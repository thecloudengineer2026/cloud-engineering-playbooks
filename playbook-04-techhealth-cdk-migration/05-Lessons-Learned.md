# Lessons Learned

## 1. A Passing Test Does Not Automatically Prove Anything

The generated CDK scaffold included a test named `SQS Queue Created`.

The test passed, but the synthesized CloudFormation template contained no SQS queue. The test name suggested validation that its assertions did not perform.

This reinforced an important principle:

A test is valuable only when its assertions prove the intended requirement.

For this project, the placeholder was replaced with 17 infrastructure-specific assertions covering networking, compute, database security, IAM, credential handling, and deletion behavior.

## 2. Infrastructure as Code Requires More Than Writing Code

The project demonstrated that Infrastructure as Code includes an entire operating discipline:

- Define infrastructure in code.
- Store it in version control.
- Test expected controls.
- Synthesize the deployment template.
- Review changes before deployment.
- Deploy through the declared management system.
- Validate both permitted and prohibited behavior.
- Destroy resources through the same system.
- Recreate the environment from unchanged source.

Writing TypeScript was only one part of the solution.

## 3. CloudFormation State Can Drift from Physical Reality

The `CDKToolkit` stack reported `CREATE_COMPLETE`, but its asset bucket no longer existed.

The bucket had been deleted outside CloudFormation, leaving the stack's logical state inconsistent with the physical AWS environment.

This explained why `cdk diff` could synthesize locally but could not publish its template.

The issue was resolved by:

1. Reading the expected bucket name from the stack outputs.
2. Running a direct S3 existence check.
3. Confirming a `404 Not Found` response.
4. Deleting the drifted bootstrap stack.
5. Bootstrapping the account and Region again.
6. Verifying the recreated asset bucket.
7. Rerunning the CDK diff.

This was one of the project's most valuable troubleshooting exercises because it reproduced the kind of governance problem TechHealth was trying to solve.

## 4. Manual Deletion Can Undermine Infrastructure Management

Deleting CloudFormation-managed resources manually may leave the owning stack unaware that a physical resource is missing.

This means cleanup should normally happen through:

- `cdk destroy`
- CloudFormation stack deletion
- Another declared infrastructure-management workflow

Manual deletion should be reserved for deliberate recovery situations and followed by drift assessment.

## 5. Architecture Diagrams Must Represent the Deployed System

The Academy reference diagram appeared to show:

- Two EC2 instances
- Two RDS instances
- A highly available design

The supplied CDK example created only one EC2 instance and one RDS instance.

The project diagrams were therefore redesigned to show:

- Two Availability Zones
- Four subnets
- One EC2 instance
- One RDS instance
- A subnet group spanning two isolated subnets
- An explicitly single-AZ database
- No unsupported high-availability claim

A polished diagram that misrepresents the deployed system is less valuable than a simpler accurate diagram.

## 6. Multi-AZ Networking Is Not the Same as High Availability

The VPC spans two Availability Zones, but the workload is not highly available.

High availability would require additional controls such as:

- Multiple application instances
- Load balancing
- Health checks
- Automated replacement
- Multi-AZ database deployment
- Tested failover
- Operational recovery procedures

The correct description is that the network is multi-AZ-ready.

## 7. Public Subnet Placement Was a Lab Compromise

The Academy brief required EC2 in a public subnet and prohibited NAT gateways to reduce cost.

This allowed the instance to:

- Serve the demonstration page
- Reach Systems Manager endpoints
- Install packages through user data
- Avoid NAT gateway charges

However, a real patient portal should generally place application resources in private subnets behind a public Application Load Balancer.

The project therefore distinguishes between:

- The implemented cost-controlled lab
- The recommended production architecture

## 8. Session Manager Is Stronger Than Public SSH for This Use Case

The Academy example allowed SSH from any IPv4 address, despite stating elsewhere that SSH should be restricted to the engineer's IP.

Instead, the project removed inbound SSH completely.

Session Manager provided:

- IAM-controlled access
- No inbound port 22
- No EC2 key pair
- No SSH key distribution
- No dependence on a changing residential IP address

The local Session Manager plugin initially had to be installed on Windows, but that was a workstation prerequisite rather than an infrastructure failure.

## 9. Security-Group Referencing Is More Precise Than CIDR Access

The RDS security group referenced the application security group as its source.

This was preferable to allowing:

- The whole VPC
- An entire subnet
- A public range
- A hard-coded instance address

Security-group referencing permits communication based on workload membership rather than network location alone.

## 10. Positive and Negative Tests Are Both Necessary

A successful EC2-to-RDS connection proved that the required path worked.

That result alone did not prove that unwanted paths were blocked.

The project therefore tested both:

### Positive Path

EC2 connected to RDS on TCP 3306 using credentials from Secrets Manager.

### Negative Path

The engineer's laptop could not connect directly to the RDS endpoint on TCP 3306.

Together, these tests provided stronger evidence of least-privilege network behavior.

## 11. Ping Failure Alone Does Not Prove Isolation

The direct RDS test showed both:

- `PingSucceeded: False`
- `TcpTestSucceeded: False`

The TCP result was the more important evidence.

AWS services often reject ICMP even when an application port is reachable. Therefore, ping failure alone should not be treated as proof that a database connection is blocked.

Testing the actual MySQL port produced the relevant validation.

## 12. Secure Credential Storage Must Be Paired with IAM Boundaries

Storing credentials in Secrets Manager was only part of the control.

The EC2 role also needed permission to retrieve the specific database secret.

The project granted only:

- `secretsmanager:GetSecretValue`
- `secretsmanager:DescribeSecret`

for the secret associated with the database.

Using Secrets Manager with an overly broad IAM policy would weaken the value of secure storage.

## 13. Secrets Should Not Appear in Evidence

The database secret was retrieved into temporary shell variables without printing the secret JSON or password.

After testing, the variables were removed with `unset`.

Screenshots showed:

- Database version
- Authenticated username
- Selected database
- TLS cipher

They did not show:

- Password
- Secret value
- Access key
- Session token

Evidence collection is part of the security process. A technically correct implementation can still create exposure if screenshots reveal sensitive information.

## 14. Encryption Must Be Verified at Multiple Layers

The project configured RDS storage encryption, which protected data at rest.

The MySQL session also returned the active TLS cipher:

`TLS_AES_256_GCM_SHA384`

This provided evidence of encryption in transit.

The project therefore validated both:

- RDS storage encryption
- TLS-protected database communication

## 15. CDK Inputs and CloudFormation Properties May Use Different Names

The CDK database configuration used the TypeScript property `databaseName`.

The synthesized CloudFormation template used `DBName`.

An automated test initially expected `DatabaseName` and failed.

The correction reinforced that CDK assertion tests evaluate synthesized CloudFormation resources, not the original TypeScript property names.

When an assertion fails, the synthesized template should be treated as the evidence for identifying the mismatch.

## 16. Scope Errors Can Produce Misleading Runtime Failures

During implementation, database outputs were initially placed outside the stack constructor, causing `database is not defined`.

The RDS tests were also initially placed outside the Jest `describe` block, causing `template is not defined`.

These were not AWS architecture failures. They were TypeScript and JavaScript scope errors.

The troubleshooting process reinforced the importance of understanding:

- Constructor boundaries
- Class boundaries
- Test-suite scope
- Closing braces
- Variable visibility

## 17. Cost Controls Affect Architecture

Avoiding NAT gateways reduced cost, but it also influenced EC2 placement.

Disabling Multi-AZ RDS reduced cost, but it removed database failover.

Using destructive removal policies simplified cleanup, but it would be unsafe for production data.

Cost optimization is not separate from architecture. Cost decisions create technical tradeoffs that must be documented.

## 18. Free Tier Eligibility Should Not Be Assumed

The brief described `t2.micro` as Free Tier eligible, while its sample code used `t3.micro`.

Free Tier eligibility depends on factors such as:

- AWS account age
- Current AWS offers
- Region
- Resource type
- Usage duration

The project used small instance classes for cost control but did not promise that the deployment would be free.

## 19. Destructive Policies Must Match the Environment

The project intentionally used:

- RDS removal policy `DESTROY`
- Disabled deletion protection
- Zero-day backup retention
- Automated backup deletion

These settings were appropriate only because:

- The environment was temporary.
- The data was synthetic.
- Reproducibility was a project requirement.
- Cost control required prompt cleanup.

A production database would require substantially different retention and recovery settings.

## 20. Reproducibility Must Be Demonstrated

Infrastructure as Code is often described as reproducible, but the project tested that claim directly.

The environment was:

1. Deployed
2. Validated
3. Destroyed
4. Recreated from unchanged committed code
5. Destroyed again

The second `CREATE_COMPLETE` result provided practical evidence that the environment could be reconstructed.

## 21. Healthcare Terminology Requires Restraint

The project implemented controls relevant to sensitive workloads, including:

- Network segmentation
- Encryption
- Managed credentials
- Restricted database access
- IAM-based administration
- Infrastructure testing

These controls do not independently establish HIPAA compliance.

The project therefore avoids claims that exceed the evidence and states that no real protected health information was used.

## 22. Documentation Is Part of the Engineering Deliverable

The final project includes:

- Business problem
- Architecture decisions
- Current-state diagram
- Target-state diagram
- CDK source code
- Automated tests
- Implementation record
- Validation evidence
- Lessons learned
- Cost and production limitations
- Setup and cleanup instructions

This documentation allows another engineer, interviewer, or client to understand both the implementation and the reasoning behind it.

## 23. Skills Reinforced

The project reinforced practical experience with:

- AWS CDK v2
- TypeScript
- CloudFormation
- Amazon VPC
- Public and isolated subnets
- Route tables
- Internet gateways
- Amazon EC2
- Amazon RDS for MySQL
- AWS Secrets Manager
- AWS Systems Manager Session Manager
- IAM roles and managed policies
- Security-group referencing
- IMDSv2
- RDS encryption
- TLS validation
- Jest
- CDK assertions
- Git
- PowerShell
- AWS CLI
- Infrastructure drift troubleshooting
- Cost-aware resource cleanup
- Technical documentation
- Architecture communication

## 24. Future Enhancements

A production-oriented evolution could include:

### Application Architecture

- Application Load Balancer
- HTTPS with AWS Certificate Manager
- EC2 instances in private subnets
- Auto Scaling across Availability Zones
- Health checks
- Route 53 DNS

### Database Resilience

- Multi-AZ RDS
- Backup retention
- Point-in-time recovery
- Deletion protection
- Snapshot retention
- Tested restoration procedures
- Credential rotation

### Network Security

- VPC endpoints for Systems Manager and Secrets Manager
- Controlled private-subnet egress
- AWS WAF
- VPC Flow Logs
- More restrictive application egress

### Monitoring and Audit

- CloudWatch dashboards
- Application and system alarms
- RDS performance monitoring
- CloudTrail
- AWS Config
- Security Hub
- GuardDuty
- Centralized Session Manager logs

### Delivery Process

- Pull-request validation
- Automated `npm test`
- Automated `cdk synth`
- Policy validation
- Security scanning
- Environment-specific configuration
- Controlled deployment approvals

### Migration Planning

- Existing-resource discovery
- Dependency mapping
- Database migration strategy
- Backup validation
- Cutover planning
- Rollback planning
- DNS and certificate transition
- Business continuity testing

## 25. Final Reflection

The most valuable outcome was not the creation of another VPC, EC2 instance, or RDS database.

The project demonstrated how to turn loosely defined and partially contradictory requirements into a tested, traceable, cost-aware, and accurately documented Infrastructure as Code implementation.

It also reinforced that professional cloud engineering requires more than successful deployment. It requires judgment about security, cost, scope, evidence, recoverability, and the difference between a working lab and a production-ready system.