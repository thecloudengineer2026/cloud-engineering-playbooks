# StartupCo Secure Access Modernization

## Replacing Shared Root Credentials With Role-Based AWS Access

StartupCo is a fast-growing technology company whose ten employees shared the AWS root-account credentials while managing development and production resources.

This project replaced that high-risk access model with individually attributable identities, role-based permissions, strong password requirements, MFA enforcement, and tested authorization boundaries.

## Business Question

> How can StartupCo replace shared root-account access with secure, role-based AWS access without disrupting its teams?

## Project Outcomes

- Protected the root user with MFA.
- Verified that no root access keys exist.
- Created four role-based IAM groups.
- Created and assigned ten fictional employee identities.
- Created no unnecessary passwords or access keys.
- Implemented custom Developer and Analyst policies.
- Applied role-appropriate AWS-managed policies to Operations and Finance.
- Enforced MFA across all four workforce groups.
- Configured a strong IAM password policy.
- Validated allowed, implicitly denied, and explicitly denied actions.
- Documented why IAM Identity Center is the preferred production target.

## Workforce Structure

| Team | Users | Access model |
|---|---:|---|
| Developers | 4 | Tagged development EC2 instances, application S3 objects, and CloudWatch Logs |
| Operations | 2 | EC2, RDS, Systems Manager, and CloudWatch management |
| Finance | 1 | Billing, Cost Explorer, Budgets, and resource visibility |
| Analysts | 3 | Approved analytical S3 data and RDS resource visibility |

![Configured IAM groups](images/02-iam-groups-configured.png)

## Architecture

### Current State

Ten employees use shared root credentials to access development and production resources without individual accountability or least-privilege boundaries.

[View the current-state architecture](architecture/01-current-state.md)

### Target State

Individual identities authenticate with MFA and receive role-based access aligned to business responsibilities. Root is removed from daily operations.

[View the target-state architecture](architecture/02-target-state.md)

## Security Controls

### Root Protection

```text
Root MFA active:          true
Root access key 1 active: false
Root access key 2 active: false
```

### Credential Hygiene

All ten fictional employee identities were created without:

- Console passwords
- Access keys
- Shared credentials

### MFA Enforcement

The `StartupCoRequireMFA` policy explicitly denies AWS resource actions when MFA is absent, while permitting the limited actions needed to enroll an MFA device.

### Least-Privilege Controls

- Developer EC2 management requires `Environment=Development` and `Project=StartupCo` tags.
- Developer S3 access is restricted to `startupco-app-*`.
- Analyst S3 access is restricted to `startupco-analytics-*`.
- Analysts can read approved objects but cannot modify them.
- Developers and Operations cannot administer IAM.
- Finance receives visibility without general infrastructure-modification rights.

## Validation Results

| Test | Decision | Status |
|---|---|---|
| Developer accesses CloudWatch Logs without MFA | `explicitDeny` | Pass |
| Developer accesses CloudWatch Logs with MFA | `allowed` | Pass |
| Developer attempts to create IAM user | `implicitDeny` | Pass |
| Operations modifies RDS with MFA | `allowed` | Pass |
| Operations attempts to create IAM user | `implicitDeny` | Pass |
| Finance accesses Cost Explorer | `allowed` | Pass |
| Analyst reads approved S3 object | `allowed` | Pass |
| Analyst attempts to modify S3 object | `implicitDeny` | Pass |

![Permission-validation results](images/05-permission-validation.png)

## AWS Services and Tools

- AWS Identity and Access Management
- IAM customer-managed and inline policies
- IAM credential reports
- IAM Policy Simulator
- AWS CLI
- PowerShell
- Git and GitHub
- Mermaid architecture diagrams

## Documentation

- [Business Problem](01-Business-Problem.md)
- [Architecture Decisions](02-Architecture-Decisions.md)
- [Implementation](03-Implementation.md)
- [Validation](04-Validation.md)
- [Lessons Learned](05-Lessons-Learned.md)
- [Current-State Architecture](architecture/01-current-state.md)
- [Target-State Architecture](architecture/02-target-state.md)

## Key Architecture Insight

MFA and least privilege solve different problems:

- MFA strengthens authentication.
- IAM policies control authorization.
- An MFA-authenticated user should still be unable to perform actions outside their job responsibilities.

This distinction was validated by allowing authorized service actions while denying IAM administration.

## Implementation Boundary

This project uses IAM users and groups to demonstrate identity and access-management mechanics. The fictional users remain dormant and have no permanent credentials.

For production workforce access, StartupCo should use AWS IAM Identity Center or federation with an external identity provider to provide centralized lifecycle management and temporary credentials.

## Future Enhancements

- Recreate the solution with Terraform.
- Deploy representative tagged EC2 and S3 resources.
- Conduct live workload-access tests.
- Implement IAM Identity Center permission sets.
- Separate development and production AWS accounts.
- Add database-level read-only analyst roles.
- Automate IAM credential and unused-access reviews.