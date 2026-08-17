# TechHealth Current-State Architecture

TechHealth's legacy infrastructure was created manually through the AWS Management Console. Application and database resources share a poorly segmented network, while security-group rules and infrastructure changes are not managed through version-controlled code.

```mermaid
flowchart TB
    Team["Engineers and administrators"] -->|"Manual infrastructure changes"| Console["AWS Management Console"]
    Console --> LegacyVPC
    Console --> Problems["No version control<br/>No automated tests<br/>Outdated documentation"]

    Patient["Patient portal user"] -->|"Application request"| IGW["Internet gateway"]

    subgraph AWS["TechHealth AWS account"]
        subgraph LegacyVPC["Legacy VPC"]
            IGW

            subgraph AZ1["Availability Zone 1"]
                Public1["Public subnet"]
                App1["EC2 application instances"]
                Database["RDS MySQL database"]

                Public1 --> App1
                Public1 --> Database
            end

            subgraph AZ2["Availability Zone 2"]
                Public2["Public subnet"]
                App2["Additional EC2 resources"]

                Public2 --> App2
            end

            ManualSG["Manually configured security groups"]
            ManualSG -.-> App1
            ManualSG -.-> App2
            ManualSG -.-> Database
        end
    end

    IGW --> App1
    IGW --> App2
    App1 -->|"MySQL traffic"| Database
    App2 -->|"MySQL traffic"| Database
```

## Current-State Risks

- Infrastructure changes are performed manually and are not consistently attributable.
- Infrastructure cannot be recreated reliably across environments.
- Application and database tiers lack proper subnet segmentation.
- Security-group configuration is manual and vulnerable to configuration drift.
- Network behavior is not protected by automated infrastructure tests.
- Documentation may not reflect the resources currently deployed.
- Resources span Availability Zones without an intentional availability design.
- Database placement in a public subnet creates unnecessary exposure risk, even if security groups currently restrict access.