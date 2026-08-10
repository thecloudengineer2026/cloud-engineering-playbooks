# Architecture Decisions

## Primary Architecture Question

How should StartupCo replace shared root-account access with secure, role-based AWS access while preserving each team's ability to work?

## Decision Summary

StartupCo's shared-root model was replaced with individually attributable IAM identities organized into four job-based groups. Permissions were assigned according to documented business responsibilities, and an explicit MFA enforcement policy was applied across all workforce groups.

The lab uses IAM users and groups to demonstrate core identity and access-management concepts. A production implementation should use AWS IAM Identity Center or an external identity provider to provide centralized workforce identity management and temporary credentials.

## Access-Control Model

| Group | Users | Authorized capabilities | Key restrictions |
|---|---:|---|---|
| StartupCo-Developers | 4 | View EC2 resources, manage tagged development instances, manage approved application files, view CloudWatch Logs | No IAM administration, billing administration, RDS management, or unrestricted production access |
| StartupCo-Operations | 2 | Manage EC2, RDS, Systems Manager, and CloudWatch | No general IAM or billing administration |
| StartupCo-Finance | 1 | View billing, Cost Explorer, Budgets, and resource configurations | No infrastructure modification |
| StartupCo-Analysts | 3 | Read approved analytical S3 data and view RDS resources | No S3 writes, database administration, or infrastructure modification |

## Decision 1: Remove Root from Daily Operations

### Decision

Protect the root user with MFA, ensure that no root access keys exist, and reserve root access for tasks that explicitly require it.

### Rationale

The root user has unrestricted authority over the AWS account. Sharing it prevents individual accountability, makes individual access revocation impossible, and increases the impact of credential compromise.

### Validation

The IAM credential report confirmed:

- Root MFA active: `true`
- Root access key 1 active: `false`
- Root access key 2 active: `false`

## Decision 2: Organize Access by Job Function

### Decision

Create four IAM groups corresponding to StartupCo's workforce responsibilities:

- StartupCo-Developers
- StartupCo-Operations
- StartupCo-Finance
- StartupCo-Analysts

### Rationale

Group-based permission management is more consistent and scalable than attaching unrelated policies directly to individual users. Employees receive access through their assigned role rather than through ad hoc individual grants.

## Decision 3: Create Dormant Fictional Identities

### Decision

Create the ten required IAM users without console passwords or access keys.

### Rationale

The users represent StartupCo's workforce structure for the portfolio scenario. Creating ten reusable credentials solely for demonstration would introduce unnecessary security risk and contradict the project's objectives.

The IAM credential report verified that all ten users have:

- No console password
- No active access key
- No second access key
- No authentication capability until deliberately activated

## Decision 4: Enforce MFA Through an Explicit Deny

### Decision

Attach the `StartupCoRequireMFA` policy to all four groups.

### Rationale

An explicit deny overrides permissions granted by other policies. This prevents even highly privileged Operations users from using AWS services without MFA.

Before MFA is present, users are limited to the actions necessary to:

- View the account password requirements
- Change their own password
- Create an MFA device
- Enable or resynchronize their own MFA device

### Validation

The IAM Policy Simulator returned:

- Developer CloudWatch access without MFA: `explicitDeny`
- Developer CloudWatch access with MFA: `allowed`

## Decision 5: Use a Customer-Managed Developer Policy

### Decision

Create `StartupCoDeveloperAccess` instead of attaching `AmazonEC2FullAccess` and `AmazonS3FullAccess`.

### Rationale

Developers should not automatically control every EC2 instance or S3 bucket in the account.

The policy:

- Allows EC2 visibility
- Allows start, stop, and reboot operations only on instances tagged:
  - `Environment=Development`
  - `Project=StartupCo`
- Limits S3 access to buckets matching `startupco-app-*`
- Provides CloudWatch Logs viewing
- Provides no IAM, billing, or RDS administration

This demonstrates resource scoping rather than service-wide access.

## Decision 6: Use Broad Infrastructure Policies for Operations

### Decision

Attach the following AWS-managed policies to Operations:

- `AmazonEC2FullAccess`
- `CloudWatchFullAccessV2`
- `AmazonSSMFullAccess`
- `AmazonRDSFullAccess`

### Rationale

The brief explicitly assigns Operations broad infrastructure-management responsibilities. AWS-managed policies provide a time-efficient lab implementation.

### Tradeoff

These policies are broader than a mature production design should normally require. A production engagement should analyze actual operational tasks, resource boundaries, environments, and service-role requirements before replacing them with narrower customer-managed policies.

## Decision 7: Separate RDS Control-Plane Access from Database Access

### Decision

Grant analysts permission to view RDS resource information, but do not represent that permission as access to application data.

### Rationale

RDS IAM actions govern the AWS control plane. They do not automatically grant `SELECT` permission on database tables.

A complete production solution would additionally require:

- Network connectivity to the database
- Database authentication
- A database user or role
- Read-only privileges on approved schemas or tables
- Auditing of database queries and access

## Decision 8: Use a Strong Password Policy Without Scheduled Expiration

### Decision

Configure:

- Minimum length of 14 characters
- Uppercase, lowercase, numeric, and symbol requirements
- Self-service password changes
- Prevention of reuse for 24 previous passwords
- No fixed password-expiration schedule

### Rationale

Long passwords, MFA, password-history enforcement, and immediate response to suspected compromise provide stronger protection than predictable scheduled password changes.

The IAM password policy applies only to IAM users with console passwords. It does not control root or IAM Identity Center authentication.

## Decision 9: Recommend Federation for Production

### Decision

Use IAM users and groups for the academy implementation, while recommending IAM Identity Center or external federation for StartupCo's production workforce.

### Rationale

Federated workforce access provides:

- Centralized identity lifecycle management
- Temporary credentials
- Role-based permission sets
- Easier onboarding and offboarding
- Reduced dependence on long-lived IAM credentials
- Better integration with organizational authentication controls

## Architecture Tradeoffs

| Decision | Benefit | Limitation |
|---|---|---|
| IAM groups | Clear demonstration of role-based access | Not the preferred modern workforce architecture |
| Dormant test users | No unnecessary credentials | Users cannot perform live console tests |
| Managed Operations policies | Fast and aligned with broad lab requirements | Broader than mature least privilege |
| Custom Developer policy | Demonstrates resource scoping | Requires consistent resource tagging |
| S3 bucket-name patterns | Restricts access by workload purpose | Naming conventions must be governed |
| Policy Simulator validation | Safely tests allowed and denied behavior | Does not replace live workload testing |
| No database deployment | Avoids cost and unnecessary scope | Database-level read access remains conceptual |

## Production Recommendations

StartupCo should next consider:

1. Migrating workforce access to IAM Identity Center.
2. Separating development and production into different AWS accounts.
3. Using permission sets and temporary credentials.
4. Defining emergency privileged-access procedures.
5. Narrowing Operations permissions based on actual tasks.
6. Implementing database-level roles for analysts.
7. Automating access deployment through Terraform.
8. Periodically reviewing credential reports and unused access.
9. Monitoring privileged actions through CloudTrail and security alerts.