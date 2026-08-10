# StartupCo Current-State Architecture

## Architecture Question

How are StartupCo employees currently accessing and managing AWS resources?

```mermaid
flowchart TB
    employees["10 StartupCo Employees<br/>Developers, Operations, Finance, Analysts"]
    chat["Shared Root Credentials<br/>Distributed Through Team Chat"]
    root["AWS Account Root User<br/>Unrestricted Privileges"]

    employees --> chat
    chat --> root

    subgraph aws["StartupCo AWS Account"]
        direction TB

        subgraph dev["Development Environment"]
            devEC2["Amazon EC2"]
            devS3["Amazon S3"]
            devCW["Amazon CloudWatch"]
        end

        subgraph prod["Production Environment"]
            prodEC2["Amazon EC2"]
            prodS3["Amazon S3"]
            prodRDS["Amazon RDS"]
            prodCW["Amazon CloudWatch"]
        end
    end

    root --> dev
    root --> prod
```

## Current-State Characteristics

- All employees share one highly privileged identity.
- Credentials cannot be attributed to an individual employee.
- Every team receives unrestricted access.
- Development and production access are not separated.
- Individual access cannot be revoked.
- Root credentials are exposed through an inappropriate communication channel.
- No effective least-privilege model exists.
- A single compromised credential could expose the entire AWS environment.

## Primary Security Failure

StartupCo has no effective boundary between its workforce and the AWS account's most privileged identity. Authentication, authorization, accountability, and access revocation are all compromised by the shared-root model.