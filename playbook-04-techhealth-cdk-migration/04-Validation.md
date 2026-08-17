# Validation

## 1. Validation Objective

The validation phase tested whether the TechHealth CDK implementation satisfied its functional, security, networking, reproducibility, and cleanup requirements.

Validation included:

- Static infrastructure assertions
- CDK synthesis
- Predeployment change review
- CloudFormation deployment
- Application availability testing
- EC2 health validation
- Systems Manager validation
- Security-group inspection
- Negative database connectivity testing
- Positive EC2-to-RDS connectivity testing
- TLS validation
- Stack destruction
- Unchanged-code redeployment
- Final resource cleanup

No real patient information or protected health information was used.

## 2. Validation Summary

| Requirement | Method | Result |
|---|---|---|
| CDK project compiles | `npm test` and `cdk synth` | Passed |
| Infrastructure tests pass | Jest and CDK assertions | Passed |
| VPC spans two AZs | Synthesized template inspection | Passed |
| Two public subnets exist | Automated assertion | Passed |
| Two isolated database subnets exist | Automated assertion | Passed |
| No NAT gateway exists | Automated assertion and CDK diff | Passed |
| EC2 uses `t3.micro` | Automated assertion and AWS inspection | Passed |
| EC2 requires IMDSv2 | Automated assertion | Passed |
| No inbound SSH exists | Automated assertion and SG inspection | Passed |
| HTTP demonstration works | `Invoke-WebRequest` and browser | Passed |
| Session Manager works | SSM registration and shell connection | Passed |
| RDS is private | RDS configuration inspection | Passed |
| RDS storage is encrypted | RDS configuration inspection | Passed |
| Laptop cannot reach RDS | `Test-NetConnection` | Passed |
| EC2 can reach RDS | MariaDB client query | Passed |
| Credentials come from Secrets Manager | IAM and runtime retrieval | Passed |
| Database connection uses TLS | MySQL session status | Passed |
| Stack can be destroyed | CDK and CloudFormation | Passed |
| Stack can be recreated | Second deployment | Passed |
| Final cleanup succeeds | Final destruction and resource checks | Passed |

## 3. Automated Infrastructure Tests

The project used Jest and AWS CDK assertions to test the synthesized CloudFormation template.

Final result:

- Test suites: `1 passed`
- Tests: `17 passed`
- Snapshots: `0`
- Failed tests: `0`

The tests verified:

1. One VPC was created.
2. Four subnets were created.
3. Two public subnets mapped public IP addresses.
4. Two isolated database subnets did not map public IP addresses.
5. No NAT gateway was created.
6. One internet gateway was created.
7. One EC2 `t3.micro` instance was created.
8. IMDSv2 was required.
9. Public HTTP access was permitted.
10. MySQL access referenced a source security group.
11. Inbound SSH was absent.
12. The EC2 IAM role trusted the EC2 service.
13. One encrypted private RDS MySQL instance was created.
14. One RDS subnet group was created.
15. One generated Secrets Manager secret was created.
16. The EC2 role could read the database secret.
17. The RDS deletion policy matched the lab cleanup requirement.

### Test Correction During Implementation

The original CDK scaffold contained a test named `SQS Queue Created`, but the assertion did not prove that an SQS queue existed.

The test passed even though the synthesized template contained no SQS resource.

The placeholder was replaced with infrastructure-specific assertions. This reinforced that test names do not establish correctness; the underlying assertions must validate the intended behavior.

## 4. CDK Synthesis

The command `npx cdk synth` completed successfully.

The synthesized CloudFormation template contained the expected resource types:

- `AWS::EC2::VPC`
- `AWS::EC2::Subnet`
- `AWS::EC2::RouteTable`
- `AWS::EC2::SubnetRouteTableAssociation`
- `AWS::EC2::InternetGateway`
- `AWS::EC2::VPCGatewayAttachment`
- `AWS::EC2::SecurityGroup`
- `AWS::EC2::SecurityGroupIngress`
- `AWS::IAM::Role`
- `AWS::IAM::Policy`
- `AWS::IAM::InstanceProfile`
- `AWS::EC2::Instance`
- `AWS::EC2::LaunchTemplate`
- `AWS::RDS::DBSubnetGroup`
- `AWS::SecretsManager::Secret`
- `AWS::SecretsManager::SecretTargetAttachment`
- `AWS::RDS::DBInstance`

No NAT gateway resource was present.

## 5. Predeployment Difference Review

The command `npx cdk diff` was run before deployment.

The diff identified:

- The EC2 trust relationship
- Systems Manager permissions
- Resource-specific secret retrieval
- Application HTTP ingress
- Database ingress from the application security group
- EC2 and RDS resources
- Four subnets
- One generated secret
- Stack outputs
- No NAT gateway

No inbound SSH rule or public database rule appeared.

The first diff attempt also exposed drift in the shared CDK bootstrap environment. The missing asset bucket was verified and the bootstrap stack was repaired before deployment.

## 6. Initial Deployment

The first deployment completed successfully.

CloudFormation returned:

`CREATE_COMPLETE`

Recorded timing:

- Synthesis: `8.73 seconds`
- Deployment: `375.63 seconds`
- Total: `449.21 seconds`

Evidence:

![Initial CloudFormation deployment](images/01-deploy-complete.png)

## 7. Application Availability

The application public IP was retrieved from the CloudFormation outputs.

A PowerShell web request returned HTTP status code `200`.

The response contained:

`TechHealth Infrastructure Migration`

and:

`Managed with AWS CDK`

The page was also opened successfully in a browser.

Evidence:

![TechHealth demonstration page](images/02-application-page.png)

### Boundary

The page used HTTP only because it was a synthetic lab demonstration. A production patient portal would require HTTPS and should not expose an application instance directly to the internet.

## 8. EC2 Health

AWS reported:

- Instance state: `running`
- System status: `ok`
- Instance status: `ok`

This confirmed that the EC2 instance and underlying AWS host passed their status checks.

## 9. Systems Manager Validation

AWS Systems Manager reported:

- Ping status: `Online`
- Platform: Amazon Linux
- SSM Agent version: `3.3.4624.0`

A Session Manager shell was opened successfully after installing the required Session Manager plugin on the local Windows workstation.

No SSH security-group rule or EC2 key pair was required.

## 10. Application Security Group

AWS CLI inspection showed:

- Protocol: TCP
- From port: 80
- To port: 80
- IPv4 source: `0.0.0.0/0`

No TCP 22 rule existed.

Evidence:

![Application security group ingress](images/03-application-ingress.png)

## 11. Database Security Group

AWS CLI inspection showed:

- Protocol: TCP
- From port: 3306
- To port: 3306
- Source: application security group

The database rule did not use:

- `0.0.0.0/0`
- The VPC CIDR
- A public IP
- A hard-coded EC2 private address

Evidence:

![Database security group ingress](images/04-database-ingress.png)

## 12. RDS Security Controls

AWS CLI inspection confirmed:

- Instance class: `db.t3.micro`
- Engine: MySQL
- Engine version: `8.0.43`
- Status: available
- Storage encryption: enabled
- Public accessibility: disabled
- Multi-AZ: disabled

Evidence:

![RDS security controls](images/05-rds-controls.png)

### Interpretation

The database was private and encrypted.

`MultiAZ: False` was intentional for lab cost control. The result must not be interpreted as a highly available database deployment.

## 13. Negative Connectivity Test

The RDS endpoint resolved to private address `10.20.2.131` during the first deployment.

A direct connection test from the engineer's laptop to TCP 3306 returned:

- `PingSucceeded: False`
- `TcpTestSucceeded: False`

Evidence:

![Direct RDS access blocked](images/06-direct-rds-access-blocked.png)

### Interpretation

The laptop had no route or permitted security-group path to the private database.

A failed ping alone would not prove database isolation because AWS resources commonly reject ICMP. The failed TCP 3306 test provided the more relevant result.

## 14. Positive EC2-to-RDS Test

A Session Manager shell was opened on the EC2 instance.

The EC2 IAM role retrieved the database credentials from Secrets Manager. The credential values were stored temporarily in shell variables and were not printed.

The MariaDB client connected to the private RDS endpoint and returned:

- MySQL version: `8.0.43`
- Authenticated user: `techhealthadmin@%`
- Selected database: `techhealth`

Evidence:

![Successful EC2-to-RDS TLS connection](images/07-ec2-rds-tls-connection.png)

### Interpretation of the MySQL Host Indicator

The `%` in `techhealthadmin@%` is part of the MySQL account host-matching identity.

It does not mean that RDS was publicly accessible. Network access remained restricted by:

- Isolated subnet routing
- `PubliclyAccessible: false`
- Database security-group ingress from the application security group only

## 15. Encryption-in-Transit Validation

The database session returned:

`Ssl_cipher = TLS_AES_256_GCM_SHA384`

This confirmed that the tested EC2-to-RDS MySQL session used TLS encryption.

The database also used encrypted storage, providing both at-rest and in-transit protection for the tested workflow.

## 16. First Destruction

After validation, the stack was destroyed using `npx cdk destroy`.

CloudFormation returned:

`DELETE_COMPLETE`

Evidence:

![First successful stack destruction](images/08-destroy-complete.png)

This removed the project VPC, EC2 instance, RDS instance, security groups, generated secret, and related stack resources.

## 17. Reproducibility Test

Before redeployment:

- The same project source remained committed.
- No changes were made to `lib`, `test`, or `bin`.
- The automated tests passed again.

The same CDK application was deployed a second time.

CloudFormation returned a new:

`CREATE_COMPLETE`

Evidence:

![Successful unchanged-code redeployment](images/09-redeploy-complete.png)

The new creation timestamp demonstrated that the infrastructure was recreated after the first environment had been destroyed.

## 18. Final Destruction

The recreated environment was destroyed after reproducibility evidence was captured.

CloudFormation returned:

`DELETE_COMPLETE`

Evidence:

![Final successful stack destruction](images/10-final-destroy.png)

The final cleanup stopped ongoing EC2, public IPv4, RDS, database storage, and project-secret charges.

The shared `CDKToolkit` bootstrap stack was retained for future CDK projects.

## 19. Evidence Index

| Evidence | Purpose |
|---|---|
| `01-deploy-complete.png` | Initial CloudFormation deployment |
| `02-application-page.png` | HTTP application response |
| `03-application-ingress.png` | Public HTTP rule and no displayed SSH rule |
| `04-database-ingress.png` | MySQL access from application SG |
| `05-rds-controls.png` | RDS privacy, encryption, class, and version |
| `06-direct-rds-access-blocked.png` | Negative external database test |
| `07-ec2-rds-tls-connection.png` | Positive internal connection and TLS |
| `08-destroy-complete.png` | First environment destruction |
| `09-redeploy-complete.png` | Reproducible second deployment |
| `10-final-destroy.png` | Final cleanup |

## 20. What the Validation Proves

The evidence demonstrates that:

- The infrastructure was defined as code.
- Critical requirements were tested before deployment.
- The application and database tiers were segmented.
- EC2 could be administered without SSH.
- Database credentials were retrieved through an IAM role.
- RDS was not publicly reachable.
- Authorized application-to-database traffic succeeded.
- The database session used TLS.
- The stack could be destroyed and recreated.
- Chargeable project resources were removed after testing.

## 21. What the Validation Does Not Prove

The project does not prove:

- HIPAA compliance
- Production readiness
- Application authentication or authorization
- Application-level vulnerability resistance
- High availability
- Automated failover
- Backup restoration
- Disaster recovery
- Production performance
- Production monitoring
- Data migration from an existing database
- Zero-downtime cutover

These items would require additional technical, operational, compliance, and business validation.

## 22. Final Validation Result

All defined portfolio-project success criteria passed.

The implementation successfully demonstrated a tested, traceable, segmented, and reproducible Infrastructure as Code foundation for TechHealth's modernization initiative.