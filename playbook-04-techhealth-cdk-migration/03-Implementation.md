# Implementation

## 1. Implementation Overview

The TechHealth modernization proof of concept was implemented as an AWS CDK v2 application written in TypeScript.

The implementation created and validated:

- A VPC spanning two Availability Zones
- Two public subnets
- Two private isolated database subnets
- One internet gateway
- No NAT gateways
- One EC2 application server
- One RDS MySQL database
- Separate application and database security groups
- An EC2 IAM role for Systems Manager
- Generated database credentials in AWS Secrets Manager
- Seventeen automated infrastructure tests
- A complete deploy, destroy, redeploy, and final-destroy lifecycle

The project used synthetic infrastructure and test data only.

## 2. Project Location

The project was created inside the existing `cloud-engineering-playbooks` repository.

Project directory:

`playbook-04-techhealth-cdk-migration`

This preserved the repository's portfolio structure and avoided creating a separate or nested Git repository.

## 3. CDK Project Initialization

The project was initialized with AWS CDK v2 using TypeScript.

The initialization command was:

`npx aws-cdk@latest init app --language=typescript`

The generated project included:

- `bin/playbook-04-techhealth-cdk-migration.ts`
- `lib/playbook-04-techhealth-cdk-migration-stack.ts`
- `test/playbook-04-techhealth-cdk-migration.test.ts`
- `cdk.json`
- `jest.config.js`
- `package.json`
- `package-lock.json`
- `tsconfig.json`

The project used `aws-cdk-lib` version `^2.264.0`.

Separate CDK v1 packages were not installed.

## 4. Baseline Validation

Before implementing infrastructure, the generated CDK application was tested and synthesized.

The baseline commands were:

- `npm test`
- `npx cdk synth`

The initial scaffold test passed, but it was named `SQS Queue Created` without containing a meaningful infrastructure assertion.

The synthesized template contained only CDK metadata and no SQS queue. The placeholder test was therefore replaced with assertions that validated the actual TechHealth design.

This demonstrated an important testing principle: a passing test is only useful when its assertions prove the intended behavior.

## 5. Network Foundation

The VPC was created in `lib/playbook-04-techhealth-cdk-migration-stack.ts`.

The network configuration used:

- VPC CIDR: `10.20.0.0/16`
- Maximum Availability Zones: `2`
- NAT gateways: `0`
- Public subnet CIDR size: `/24`
- Database subnet CIDR size: `/24`
- Public subnet type: `PUBLIC`
- Database subnet type: `PRIVATE_ISOLATED`

CDK allocated the following subnet ranges:

- `10.20.0.0/24` — public subnet in Availability Zone 1
- `10.20.1.0/24` — public subnet in Availability Zone 2
- `10.20.2.0/24` — isolated database subnet in Availability Zone 1
- `10.20.3.0/24` — isolated database subnet in Availability Zone 2

The public subnets received routes to the internet gateway.

The isolated database subnets did not receive routes to the internet gateway or a NAT gateway.

## 6. Resource Tags

Stack-level tags were applied to support identification, cost analysis, and governance.

The tags were:

- `Project = TechHealthMigration`
- `ManagedBy = AWS-CDK`
- `Environment = Development`

Because the tags were applied at the stack level, CDK propagated them to supported resources.

## 7. Application Security Group

The application security group allowed:

- Inbound TCP 80 from `0.0.0.0/0`
- Outbound traffic required by the demonstration instance

No inbound TCP 22 rule was created.

The application instance therefore did not rely on public SSH access or an EC2 key pair.

Public HTTP was used only to demonstrate that the instance was running the user-data-installed web server. The implementation did not process authentication data, patient records, or protected health information.

## 8. Database Security Group

The database security group allowed:

- Inbound TCP 3306 only from the application security group
- No general public ingress
- No general allow-all outbound rule

The rule referenced the application security group rather than:

- A public CIDR
- The entire VPC CIDR
- A subnet CIDR
- A hard-coded EC2 address

This ensured that database access followed the identity of the approved application tier.

## 9. EC2 IAM Role

An IAM role was created for the application instance.

The trust relationship allowed the EC2 service to assume the role.

The role received the AWS-managed `AmazonSSMManagedInstanceCore` policy.

This allowed the instance to register with AWS Systems Manager and accept Session Manager connections without opening an inbound administrative port.

After the database secret was created, the role also received permission to call:

- `secretsmanager:GetSecretValue`
- `secretsmanager:DescribeSecret`

These actions were limited to the database secret created by the stack.

## 10. EC2 Application Instance

The application tier used:

- Amazon EC2
- Instance class: `t3.micro`
- Amazon Linux 2023
- Public subnet placement
- Application security group
- EC2 Systems Manager role
- IMDSv2 requirement

The instance was configured with `requireImdsv2: true`.

User data installed:

- Apache HTTP Server
- MariaDB command-line client

The user-data process then:

- Enabled Apache
- Started Apache
- Created a basic TechHealth demonstration page

The page displayed:

- `TechHealth Infrastructure Migration`
- `Managed with AWS CDK`

The demonstration page was successfully retrieved over HTTP with status code `200`.

## 11. RDS MySQL Database

The database tier used:

- Amazon RDS for MySQL
- MySQL version `8.0.43`
- Instance class `db.t3.micro`
- Database name `techhealth`
- 20 GiB of GP3 storage
- Storage encryption
- Private isolated subnet placement
- Database security group
- Public accessibility disabled
- Single-AZ deployment

The RDS subnet group included both isolated database subnets.

Although the subnet group spans two Availability Zones, the database itself was configured with `MultiAZ: false` to control lab costs.

## 12. Database Credential Management

Credentials were created with `rds.Credentials.fromGeneratedSecret`.

The generated username was `techhealthadmin`.

The password was generated by Secrets Manager and was never:

- Hard-coded in the CDK source
- Committed to Git
- Printed in CloudFormation outputs
- Added to screenshots
- Shared through the project documentation

CloudFormation output exposed only the secret name required for controlled retrieval.

The secret value was retrieved temporarily from the EC2 instance using its IAM role.

After the connectivity test, the shell variables holding the secret JSON, username, and password were cleared.

## 13. Lab Removal Configuration

The RDS database was configured for complete lab cleanup.

The settings included:

- Removal policy: `DESTROY`
- Deletion protection: disabled
- Automated backup deletion: enabled
- Backup retention: zero days

These settings would be inappropriate for a production patient database, but they were intentional for a temporary synthetic-data environment.

## 14. CloudFormation Outputs

The stack produced outputs for:

- VPC ID
- Public subnet IDs
- Database subnet IDs
- Application EC2 instance ID
- Application public IP
- Application security group ID
- Database security group ID
- Database endpoint
- Database port
- Database secret name

No database password or secret value was included.

## 15. Automated Tests

The generated placeholder test was replaced with 17 CDK assertion tests.

The tests verified:

1. One VPC was created.
2. Four subnets were created.
3. Two subnets mapped public IP addresses.
4. Two subnets did not map public IP addresses.
5. No NAT gateway was created.
6. One internet gateway was created.
7. One `t3.micro` EC2 instance was created.
8. IMDSv2 was required.
9. Public HTTP access was permitted.
10. MySQL access used a source security group.
11. Inbound SSH was absent.
12. The EC2 IAM trust relationship was correct.
13. One encrypted private RDS MySQL instance was created.
14. One RDS subnet group was created.
15. One generated Secrets Manager secret was created.
16. The EC2 role could read the database secret.
17. The database deletion policy matched the lab lifecycle requirement.

The final test execution returned:

- Test suites: `1 passed`
- Tests: `17 passed`
- Failed tests: `0`

## 16. CDK Synthesis

The CDK application was synthesized with:

`npx cdk synth`

The synthesized CloudFormation template confirmed the expected resources, including:

- VPC and subnet resources
- Route tables and route associations
- Internet gateway
- Security groups
- EC2 IAM role and instance profile
- EC2 instance and launch template
- RDS subnet group
- Secrets Manager secret
- RDS database instance
- Stack outputs

## 17. CDK Bootstrap Drift

The initial `cdk diff` operation failed to publish its template because the expected CDK bootstrap S3 bucket did not exist.

The `CDKToolkit` CloudFormation stack still reported `CREATE_COMPLETE` and recorded the missing bucket as an output.

A direct S3 `HeadBucket` request returned `404 Not Found`.

This showed that the logical CloudFormation state had drifted from the physical AWS environment after the bucket was manually deleted.

The repair process was:

1. Verify the expected bucket name from the `CDKToolkit` outputs.
2. Confirm that the bucket did not exist.
3. Delete the drifted `CDKToolkit` stack.
4. Wait for stack deletion to complete.
5. Run `cdk bootstrap` for the AWS account and `us-east-1`.
6. Verify that the new asset bucket existed.
7. Rerun `cdk diff`.

The repaired bootstrap environment was retained for future CDK projects.

## 18. Deployment Review

Before deployment, `npx cdk diff` was used to inspect:

- IAM trust relationships
- Managed IAM policies
- Secret-read permissions
- Security-group ingress and egress
- Chargeable resources
- CloudFormation outputs

The reviewed changes included:

- One EC2 instance
- One RDS instance
- One generated secret
- Four subnets
- Two primary security groups
- No NAT gateway

No unexpected public RDS access or inbound SSH rule appeared.

## 19. Initial Deployment

The stack was deployed with:

`npx cdk deploy`

The first deployment completed successfully.

Recorded timing:

- Synthesis time: `8.73 seconds`
- Deployment time: `375.63 seconds`
- Total time: `449.21 seconds`

CloudFormation returned `CREATE_COMPLETE`.

The deployed stack generated the expected resource outputs without exposing credentials.

## 20. Application Validation

The application public IP was retrieved from the CloudFormation stack outputs.

PowerShell `Invoke-WebRequest` returned:

- Status code: `200`
- Content containing the TechHealth migration page

The page was also opened in a web browser and captured as implementation evidence.

## 21. EC2 Health and Session Manager Validation

The EC2 instance returned:

- Instance state: `running`
- System status: `ok`
- Instance status: `ok`

Systems Manager returned:

- Ping status: `Online`
- Platform: Amazon Linux
- SSM Agent version: `3.3.4624.0`

The local Windows Session Manager plugin was installed because the AWS CLI initially reported that `SessionManagerPlugin` was not found.

After installation, a Session Manager shell was opened successfully without SSH.

## 22. Direct Database Isolation Test

The RDS endpoint resolved to a private `10.20.x.x` address.

A direct TCP test from the engineer's laptop to port 3306 returned:

- `PingSucceeded: False`
- `TcpTestSucceeded: False`

This demonstrated that the database could not be reached directly from the external client network.

## 23. EC2-to-RDS Connectivity Test

Inside the Session Manager shell:

1. The EC2 IAM role retrieved the database secret.
2. The secret JSON was stored temporarily in shell variables.
3. The MariaDB client connected to the private RDS endpoint.
4. The connection selected the `techhealth` database.
5. The query returned MySQL version `8.0.43`.
6. The authenticated user was `techhealthadmin`.
7. The session reported the TLS cipher `TLS_AES_256_GCM_SHA384`.
8. Sensitive shell variables were cleared.

This proved that:

- The approved EC2 instance could reach RDS.
- The database security-group relationship worked.
- Secrets Manager permissions worked.
- Database authentication worked.
- The database session used TLS.

## 24. Security-Control Validation

AWS CLI inspection confirmed:

### Application Security Group

- Protocol: TCP
- Port: 80
- Source: `0.0.0.0/0`

### Database Security Group

- Protocol: TCP
- Port: 3306
- Source: application security group

### RDS Controls

- Class: `db.t3.micro`
- Engine: MySQL
- Version: `8.0.43`
- Status: available
- Storage encrypted: true
- Publicly accessible: false
- Multi-AZ: false

## 25. Destruction and Recreation

After validation, the application stack was destroyed with:

`npx cdk destroy`

CloudFormation returned `DELETE_COMPLETE`.

The same committed CDK source was then:

1. Tested again
2. Deployed again
3. Verified as `CREATE_COMPLETE`
4. Destroyed again

The final stack destruction returned `DELETE_COMPLETE`.

This demonstrated that the environment could be recreated consistently from version-controlled infrastructure code.

## 26. Final Cleanup

Final verification checked for:

- The TechHealth CloudFormation stack
- Active EC2 instances tagged `Project = TechHealthMigration`
- RDS instances associated with the project

The application stack and chargeable application resources were removed.

The shared `CDKToolkit` bootstrap stack was retained for future CDK deployments.

## 27. Implementation Result

The project replaced an undocumented console-based infrastructure concept with a tested, version-controlled CDK reference implementation.

The result demonstrated:

- Reproducible infrastructure
- Automated predeployment testing
- Deliberate network segmentation
- Controlled security-group relationships
- Managed administrative access
- Secure credential storage
- Encryption at rest and in transit
- Positive and negative connectivity testing
- Cost-aware cleanup
- Transparent documentation of lab and production boundaries