# TechHealth Infrastructure as Code Migration

## 1. Client Background

TechHealth Inc. is a fictional healthcare technology company operating a patient portal on AWS.

Its infrastructure was originally created manually through the AWS Management Console approximately five years ago. This approach helped the company launch quickly, but the environment became increasingly difficult to govern, reproduce, test, and maintain.

The existing application uses:

- Amazon EC2 for the patient portal application
- Amazon RDS for a MySQL database
- A basic Amazon VPC
- Public subnets with insufficient tier separation
- Manually configured security groups
- Resources distributed across Availability Zones without an intentional availability design

This portfolio project uses synthetic infrastructure and test data only. It does not store or process real protected health information.

## 2. Business Problem

TechHealth's primary problem was not simply that its infrastructure was old. The larger issue was that the organization had no reliable system for managing infrastructure changes.

Console-based administration created several operational weaknesses:

- Infrastructure configuration was not stored in version control.
- Changes were difficult to attribute to individual engineers.
- Environments could not be reproduced consistently.
- Infrastructure documentation became outdated.
- Security-group changes depended on manual implementation.
- Configuration drift could occur without detection.
- Network controls were not protected by automated tests.
- Disaster recovery and environment recreation remained labor-intensive.

These conditions increased operational risk and made future modernization more difficult.

For a company handling healthcare-related workloads, undocumented and inconsistent infrastructure also creates governance concerns. Network segmentation and encryption contribute to a stronger security posture, but they do not independently establish regulatory compliance.

## 3. Current-State Technical Risks

### 3.1 Insufficient Network Segmentation

Application and database resources were placed in public subnets without a deliberate separation between application and data tiers.

This increased the risk that database resources could become unnecessarily exposed through routing or security-group mistakes.

### 3.2 Manual Security Configuration

Security groups were configured through the AWS Console.

Without version-controlled definitions and automated tests, engineers could not consistently prove that:

- SSH was properly restricted
- Database access originated only from the application tier
- Unnecessary ingress rules were absent
- Security settings remained consistent after changes

### 3.3 Infrastructure Drift

The actual AWS environment could diverge from documentation because infrastructure changes occurred outside a controlled deployment workflow.

This made it difficult to answer:

- What changed?
- Who made the change?
- Why was it changed?
- Was it reviewed?
- Can the same configuration be recreated?

### 3.4 Weak Reproducibility

The environment could not be destroyed and recreated predictably.

This limited TechHealth's ability to create development, test, recovery, or future production environments using a consistent configuration.

### 3.5 Credential-Management Risk

Database credentials required secure generation, storage, and retrieval.

Hard-coded credentials, plaintext configuration files, or credentials shared through team communication channels would create unnecessary security exposure.

### 3.6 Administrative Access Risk

Opening SSH to EC2 would introduce another inbound access path and require management of keys and approved source addresses.

A managed administrative channel was preferable for this implementation.

## 4. Project Objective

The objective was to create a tested Infrastructure as Code reference implementation that modernizes TechHealth's network and resource-management approach.

The solution needed to:

- Define infrastructure using AWS CDK with TypeScript
- Use AWS CloudFormation as the deployment engine
- Create a VPC spanning two Availability Zones
- Create one public subnet per Availability Zone
- Create one isolated database subnet per Availability Zone
- Avoid NAT gateways to control lab costs
- Place an EC2 application server in a public subnet
- Place an RDS MySQL database in isolated private subnets
- Prevent direct public access to RDS
- Permit MySQL only from the EC2 security group
- Eliminate inbound SSH
- Use AWS Systems Manager Session Manager for administration
- Generate and store database credentials in AWS Secrets Manager
- Encrypt RDS storage
- Require IMDSv2 on EC2
- Validate infrastructure through automated tests
- Demonstrate deployment, destruction, and recreation

## 5. Scope

The implemented proof of concept included:

- One VPC using CIDR `10.20.0.0/16`
- Two public `/24` subnets
- Two isolated database `/24` subnets
- Two Availability Zones
- One internet gateway
- Zero NAT gateways
- One Amazon Linux 2023 EC2 `t3.micro` instance
- One RDS MySQL 8.0.43 `db.t3.micro` instance
- One EC2 application security group
- One RDS database security group
- One EC2 IAM role
- AWS Systems Manager Session Manager access
- AWS Secrets Manager-generated database credentials
- Seventeen automated CDK assertions
- Positive and negative connectivity tests
- Complete deployment and destruction lifecycle validation

## 6. Important Scope Boundary

Although the project is described as an infrastructure migration, it does not perform an in-place migration of a real production environment or transfer an existing patient database.

It is a modernization proof of concept that demonstrates how TechHealth's manually managed infrastructure could be replaced by a controlled CDK implementation.

A real migration would additionally require:

- Discovery of existing resources and dependencies
- Data classification
- Application compatibility testing
- Database migration planning
- Backup and restoration procedures
- Cutover and rollback plans
- Downtime requirements
- DNS and certificate migration
- Observability baselines
- Security and compliance review
- Business continuity planning
- Stakeholder approval

This distinction prevents the portfolio project from overstating what was implemented.

## 7. Success Criteria

The project would be considered successful when:

1. The CDK application synthesized without errors.
2. All automated infrastructure tests passed.
3. The VPC contained two public and two isolated subnets across two Availability Zones.
4. No NAT gateway was created.
5. The EC2 application responded successfully over HTTP for demonstration purposes.
6. EC2 administrative access worked through Session Manager without inbound SSH.
7. RDS was encrypted and not publicly accessible.
8. Direct access from the engineer's laptop to RDS failed.
9. EC2 successfully connected to RDS using credentials retrieved from Secrets Manager.
10. The database connection used TLS.
11. The stack was destroyed successfully.
12. The same committed CDK code recreated the stack successfully.
13. The recreated stack was destroyed without leaving application resources running.

## 8. Business Value

The proposed approach provides TechHealth with:

### Consistency

Infrastructure is defined once and deployed consistently through AWS CloudFormation.

### Traceability

Changes can be reviewed, committed, attributed, and compared through Git.

### Security

Subnet separation, security-group referencing, encrypted storage, managed secrets, IMDSv2, and SSH-free administration are defined through code.

### Testability

Automated assertions verify critical requirements before deployment.

### Recoverability

The environment can be destroyed and recreated from the same source code.

### Maintainability

Future engineers can inspect both the infrastructure implementation and the reasoning behind its design.

### Cost Awareness

The lab avoids NAT gateways, uses small instance classes, disables Multi-AZ RDS, and destroys chargeable resources after validation.