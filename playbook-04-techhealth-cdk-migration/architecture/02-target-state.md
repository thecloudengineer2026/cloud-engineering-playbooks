# TechHealth Target-State Architecture

The target state replaces manually configured infrastructure with a tested AWS CDK application written in TypeScript. AWS CloudFormation provisions a segmented VPC, controlled application access, an isolated database tier, generated credentials, and repeatable infrastructure lifecycle management.

```mermaid
flowchart TB
    Engineer["Cloud engineer"] -->|"Commit reviewed code"| Git["Git repository"]
    Git -->|"CDK synth and deploy"| CDK["AWS CDK"]
    CDK -->|"CloudFormation template"| CFN["AWS CloudFormation"]
    CFN -->|"Provision and manage"| VPC

    Patient["Portal user"] -->|"HTTP 80 lab traffic"| IGW["Internet gateway"]
    Administrator["Authorized administrator"] -->|"Session Manager"| SSM["AWS Systems Manager"]
    Secret["AWS Secrets Manager"] -->|"Read generated credentials"| EC2

    subgraph AWS["TechHealth AWS account"]
        subgraph VPC["TechHealth VPC — 10.20.0.0/16"]
            IGW

            subgraph AZ1["Availability Zone 1"]
                subgraph PublicA["Public subnet — 10.20.0.0/24"]
                    EC2["EC2 t3.micro application server"]
                end

                subgraph DatabaseA["Isolated database subnet — 10.20.2.0/24"]
                    RDS["RDS MySQL db.t3.micro"]
                end
            end

            subgraph AZ2["Availability Zone 2"]
                PublicB["Public subnet — 10.20.1.0/24"]
                DatabaseB["Isolated database subnet — 10.20.3.0/24"]
            end

            AppSG["Application security group<br/>Inbound TCP 80<br/>No inbound SSH"]
            DbSG["Database security group<br/>TCP 3306 from application SG only"]
            SubnetGroup["RDS subnet group"]

            AppSG -.-> EC2
            DbSG -.-> RDS
            SubnetGroup -.-> DatabaseA
            SubnetGroup -.-> DatabaseB
        end
    end

    IGW -->|"HTTP 80"| EC2
    SSM -->|"Outbound-initiated administration"| EC2
    EC2 -->|"Encrypted MySQL 3306"| RDS
```

## Implemented Security Boundaries

- EC2 is placed in a public subnet for the Academy lab requirement.
- No inbound SSH rule or EC2 key pair is required.
- Administrative access uses AWS Systems Manager Session Manager.
- RDS is placed in private isolated subnets with no internet route.
- RDS public accessibility is explicitly disabled.
- The database security group accepts MySQL only from the application security group.
- Database credentials are generated and stored in AWS Secrets Manager.
- The EC2 role can read only the database secret associated with this stack.
- RDS storage is encrypted.
- IMDSv2 is required on the EC2 instance.
- No NAT gateway is deployed.

## Availability and Production Boundaries

This is a cost-controlled portfolio environment, not a production healthcare platform.

- The VPC spans two Availability Zones.
- One public and one isolated database subnet exist in each Availability Zone.
- The RDS subnet group spans both isolated subnets.
- The deployed EC2 instance and RDS database are single-instance resources.
- `MultiAZ` is disabled for RDS to control lab costs.
- The application is therefore **multi-AZ-ready but not highly available**.
- HTTP is used only for synthetic demonstration traffic.
- A production patient portal should use HTTPS, an Application Load Balancer, private application instances, managed scaling, stronger monitoring, backup retention, deletion protection, and formal compliance controls.
- No real protected health information was stored or processed.