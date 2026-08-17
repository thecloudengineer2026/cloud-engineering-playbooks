# Architecture Decisions

## 1. Decision-Making Approach

The TechHealth brief contained several conflicting requirements and examples. The implementation therefore prioritized:

1. The stated business and security objectives
2. The infrastructure actually required for the lab
3. Current AWS CDK v2 practices
4. Least-privilege access
5. Cost control
6. Accurate documentation of limitations

The Academy reference architecture was treated as guidance rather than copied without review.

## 2. Use AWS CDK v2 with TypeScript

### Decision

Define the infrastructure using AWS CDK v2 and TypeScript.

### Rationale

- Infrastructure can be reviewed and version controlled.
- TypeScript provides compile-time feedback.
- CDK constructs reduce repetitive CloudFormation code.
- CDK synthesizes standard CloudFormation templates.
- Jest and CDK assertions support automated testing.
- The implementation aligns with the client's migration objective.

### CDK Version Clarification

The Academy implementation guide referenced legacy CDK v1 service packages such as:

- `@aws-cdk/aws-ec2`
- `@aws-cdk/aws-rds`
- `@aws-cdk/aws-iam`

These packages were not installed. CDK v2 consolidates stable AWS service constructs into the single `aws-cdk-lib` package, which was already included by `cdk init`.

## 3. Keep the Project in the Existing Playbook Repository

### Decision

Store the project under `playbook-04-techhealth-cdk-migration` inside the existing `cloud-engineering-playbooks` repository.

### Rationale

- Maintains a coherent portfolio structure
- Avoids unnecessary repository fragmentation
- Allows shared project conventions
- Presents the work as part of a continuing cloud-engineering practice
- Prevents accidental creation of a nested Git repository

## 4. Use a Two-Availability-Zone VPC

### Decision

Create one VPC spanning two Availability Zones.

### Address Plan

- VPC: `10.20.0.0/16`
- Public subnet 1: `10.20.0.0/24`
- Public subnet 2: `10.20.1.0/24`
- Database subnet 1: `10.20.2.0/24`
- Database subnet 2: `10.20.3.0/24`

### Rationale

- Separates internet-facing and database tiers.
- Provides an intentional subnet structure.
- Allows future application placement across Availability Zones.
- Supports an RDS subnet group spanning two Availability Zones.
- Improves reproducibility compared with manually created networking.

### Limitation

A network spanning two Availability Zones does not automatically make the application highly available. The lab deployed one EC2 instance and one single-AZ RDS instance.

## 5. Place EC2 in a Public Subnet

### Decision

Place the demonstration EC2 application server in the first public subnet.

### Rationale

- Satisfies the Academy project requirement.
- Allows the demonstration web page to receive HTTP traffic.
- Allows outbound access to AWS Systems Manager endpoints.
- Avoids NAT gateway and interface endpoint costs.

### Tradeoff

A production patient portal should not normally expose an application instance directly to the internet.

A stronger production design would place:

- An Application Load Balancer in public subnets
- EC2 instances or containers in private subnets
- HTTPS certificates in AWS Certificate Manager
- Application resources in an Auto Scaling group
- Controlled outbound connectivity through NAT gateways or VPC endpoints

The public EC2 placement is therefore a lab-specific cost and scope decision.

## 6. Eliminate Inbound SSH

### Decision

Do not create an inbound rule for TCP 22 and do not configure an EC2 key pair.

Use AWS Systems Manager Session Manager for administrative access.

### Rationale

- Removes a public administrative port.
- Eliminates SSH key distribution and rotation.
- Provides IAM-controlled administrative access.
- Uses an outbound-initiated management channel.
- Reduces the attack surface.
- Demonstrates a stronger design than allowing SSH from `0.0.0.0/0`.

### Required Permission

The EC2 role uses the AWS-managed `AmazonSSMManagedInstanceCore` policy.

## 7. Permit Public HTTP Only for Demonstration

### Decision

Allow inbound TCP 80 from `0.0.0.0/0` to the application security group.

### Rationale

This permits validation of the demonstration web server without introducing additional load balancer and certificate resources.

### Limitation

HTTP is unencrypted and is not acceptable for a real patient portal. No authentication, patient information, or sensitive workload was used.

A production implementation would require HTTPS and should redirect HTTP traffic to HTTPS.

## 8. Use Private Isolated Subnets for RDS

### Decision

Place RDS in subnets configured as `ec2.SubnetType.PRIVATE_ISOLATED`.

### Rationale

- Isolated subnets have no route to the internet.
- RDS does not require outbound internet access for this lab.
- The database cannot receive traffic through an internet gateway.
- No NAT gateway is required.
- Network segmentation is defined and enforced through code.

### Additional Control

RDS public accessibility was explicitly configured as `publiclyAccessible: false`.

## 9. Use Security-Group Referencing

### Decision

Allow MySQL traffic on TCP 3306 to the database only when the source is the application security group.

### Rationale

Security-group referencing is more durable and restrictive than permitting:

- A public CIDR range
- The entire VPC CIDR
- A hard-coded EC2 private IP address
- Every resource in the application subnet

The rule follows application identity rather than a changing instance address.

### Validated Behavior

- EC2-to-RDS connectivity succeeded.
- Direct laptop-to-RDS connectivity failed.
- No public database ingress rule existed.

## 10. Disable RDS Outbound Access

### Decision

Configure the database security group with `allowAllOutbound: false`.

### Rationale

The database did not require outbound communication for the tested workflow.

CDK synthesized a dummy egress rule using an unusable ICMP destination. This prevents AWS from automatically restoring the default allow-all egress rule. The dummy rule did not create a practical database communication path.

## 11. Generate Credentials with Secrets Manager

### Decision

Generate the RDS username and password through AWS Secrets Manager.

### Rationale

- Prevents credentials from appearing in source code.
- Prevents credentials from appearing in CloudFormation outputs.
- Supports controlled application retrieval.
- Avoids manually shared database passwords.
- Enables future credential rotation capabilities.

### IAM Boundary

The EC2 role received only `secretsmanager:GetSecretValue` and `secretsmanager:DescribeSecret` for the database secret created by this stack.

Broad Secrets Manager permissions were not granted.

## 12. Require IMDSv2

### Decision

Configure the EC2 instance with `requireImdsv2: true`.

### Rationale

IMDSv2 uses session-oriented requests and provides stronger protection for instance metadata and temporary IAM credentials than unrestricted IMDSv1 access.

## 13. Encrypt RDS Storage

### Decision

Configure RDS with `storageEncrypted: true`.

### Rationale

Encryption at rest is a fundamental control for sensitive-data workloads.

### Limitation

Encryption alone does not establish healthcare compliance. Compliance also depends on organizational controls, contractual requirements, identity governance, monitoring, auditing, data handling, incident response, and other safeguards.

## 14. Use TLS for Database Connectivity

### Decision

Connect from EC2 to RDS using an encrypted MySQL session.

### Validation

The successful connection returned `TLS_AES_256_GCM_SHA384` as the active `Ssl_cipher`.

This demonstrated encryption in transit for the tested database session.

## 15. Use Single-AZ RDS for the Lab

### Decision

Configure RDS with `multiAz: false`.

### Rationale

- Reduces portfolio-lab cost.
- Matches the temporary nature of the environment.
- Keeps deployment and destruction manageable.
- Avoids claiming production availability where none exists.

### Tradeoff

Single-AZ RDS does not provide synchronous standby failover. A production healthcare workload would require an availability decision based on recovery objectives, business impact, risk, and budget.

## 16. Avoid NAT Gateways

### Decision

Configure the VPC with `natGateways: 0`.

### Rationale

NAT gateways introduce hourly and data-processing charges. The lab did not require private application resources to access the internet.

### Tradeoff

This decision influenced the placement of EC2 in a public subnet. A production private application tier would require NAT gateways, VPC interface endpoints, or another controlled outbound design.

## 17. Use Small Instance Classes

### Decision

Use:

- EC2 `t3.micro`
- RDS `db.t3.micro`
- 20 GiB of GP3 database storage

### Rationale

These resources were sufficient for infrastructure validation and synthetic connectivity testing.

Instance selection was based on lab requirements and cost control. The project does not guarantee that these resources qualify for the AWS Free Tier because eligibility depends on the account, Region, and current AWS offer.

## 18. Use Destructive Removal Policies Only for the Lab

### Decision

Configure the database with:

- `removalPolicy: cdk.RemovalPolicy.DESTROY`
- `deletionProtection: false`
- `deleteAutomatedBackups: true`
- `backupRetention: cdk.Duration.days(0)`

### Rationale

The environment contained only synthetic test data and needed to be removed promptly to control cost.

### Production Alternative

A production database should generally use:

- Deletion protection
- Snapshot or retain removal policies
- Automated backup retention
- Point-in-time recovery
- Tested restoration procedures
- Formal data-retention requirements

## 19. Test Infrastructure Before Deployment

### Decision

Use Jest and AWS CDK assertions to validate the synthesized CloudFormation template.

### Tested Controls

The 17 automated tests verified:

- One VPC
- Four subnets
- Two public subnets
- Two isolated database subnets
- No NAT gateway
- One internet gateway
- One `t3.micro` EC2 instance
- Required IMDSv2
- Public HTTP access
- Security-group-based MySQL access
- No inbound SSH
- EC2 IAM trust relationship
- One encrypted private RDS instance
- One RDS subnet group
- Generated Secrets Manager credentials
- Least-privilege secret retrieval
- Database deletion behavior for the lab

### Rationale

A successful deployment does not prove that infrastructure satisfies its security requirements. Automated assertions catch configuration mistakes before resources are created.

## 20. Use CloudFormation Change Review Before Deployment

### Decision

Run `cdk synth` and `cdk diff` before `cdk deploy`.

### Rationale

- `cdk synth` confirms that the TypeScript application can generate a valid CloudFormation template.
- `cdk diff` identifies the resources, IAM policies, and security-group changes that AWS will create.
- Reviewing the diff helps identify unexpected access or chargeable resources before deployment.

The reviewed diff showed one EC2 instance, one RDS instance, two security groups, four subnets, one generated secret, and no NAT gateway.

## 21. Demonstrate Reproducibility

### Decision

Perform the following lifecycle:

`Test → Synthesize → Diff → Deploy → Validate → Destroy → Redeploy unchanged code → Destroy`

### Rationale

The client's original environment could not be reproduced reliably. A second successful deployment from the same committed source provides stronger evidence than stating that CDK is theoretically repeatable.

### Result

- The first deployment reached `CREATE_COMPLETE`.
- The stack was destroyed successfully.
- The unchanged CDK application passed all tests again.
- The second deployment reached `CREATE_COMPLETE`.
- The recreated environment was destroyed successfully.

## 22. Repair CDK Bootstrap Drift

### Situation

The existing `CDKToolkit` CloudFormation stack reported `CREATE_COMPLETE`, but its recorded S3 asset bucket had been manually deleted.

The logical CloudFormation state therefore differed from the physical AWS environment.

### Decision

- Retrieve the expected bootstrap bucket from the stack outputs.
- Verify that the physical bucket returned `404 Not Found`.
- Delete the drifted `CDKToolkit` stack.
- Bootstrap the AWS account and Region again.
- Verify that the recreated asset bucket existed.
- Preserve the repaired toolkit for future CDK projects.

### Lesson

CloudFormation does not continuously change a stack's status when a managed resource is deleted outside CloudFormation. Infrastructure state and physical resources can diverge when manual changes bypass the owning deployment system.

This incident reinforced the client problem the project was designed to solve: infrastructure should be changed through its declared management workflow rather than through untracked manual actions.

## 23. Do Not Claim High Availability

### Decision

Describe the environment as multi-AZ-ready rather than highly available.

### Rationale

The Academy reference diagram appeared to show two application instances and two database instances. The implemented CDK code created one EC2 instance and one RDS instance.

The final documentation and target-state diagram therefore represent the deployed resources accurately.

### Production Requirement

A highly available production design would require, at minimum:

- Multiple application instances across Availability Zones
- Load balancing
- Health checks
- Automated replacement or scaling
- Multi-AZ database deployment or another resilient data architecture
- Tested failover and recovery procedures

## 24. Avoid Compliance Overstatement

### Decision

Do not describe the implementation as HIPAA compliant.

### Rationale

The project implements security controls that may support a stronger healthcare security posture, but technical architecture alone does not establish compliance.

No real patient information or protected health information was stored or processed during the project.

## 25. Final Architecture Position

The implemented solution is a cost-controlled Infrastructure as Code proof of concept that demonstrates:

- Version-controlled infrastructure
- Repeatable deployment
- Automated testing
- Public and private network segmentation
- Least-privilege security-group relationships
- SSH-free EC2 administration
- Generated credential storage
- Encryption at rest
- TLS database connectivity
- Controlled resource destruction
- Transparent documentation of production limitations

It should not be presented as a finished production healthcare platform. Its value lies in demonstrating how TechHealth could begin replacing unmanaged console-based infrastructure with a tested, traceable, and reproducible engineering workflow.