# Business Problem

## Client Overview

StartupCo is a fast-growing technology startup that recently launched a fitness-tracking application on AWS. To meet an aggressive product-launch deadline, the company prioritized speed over formal cloud-access governance.

The application is now live, the company employs ten people, and the temporary access practices used during launch have become a material security and operational risk.

## Current Environment

StartupCo operates multiple development and production environments using:

- Amazon EC2 for application compute
- Amazon S3 for user data and application assets
- Amazon RDS for user information
- Amazon CloudWatch for infrastructure and application monitoring

## Current Access Model

All ten employees share the AWS account root-user credentials. Credentials have been distributed through team-chat messages, and the account has no established multi-factor authentication requirement or strong password policy.

The company has not separated access according to job responsibilities. Developers, operations personnel, finance staff, and data analysts therefore receive the same unrestricted account access regardless of their business needs.

## Business and Security Risks

The current access model creates several material risks:

- **Account compromise:** One exposed password could give an attacker unrestricted control over the AWS account.
- **No individual accountability:** Shared credentials prevent StartupCo from reliably determining who performed a particular action.
- **Excessive privilege:** Every employee can modify or delete infrastructure, data, security settings, and billing configurations.
- **Inability to revoke individual access:** Removing one employee's access requires changing credentials for the entire organization.
- **Production disruption:** An accidental or unauthorized change could interrupt the live fitness-tracking application.
- **Data exposure:** Unrestricted access increases the likelihood that customer or application data could be disclosed, altered, or deleted.
- **Financial exposure:** Employees or attackers could provision expensive resources or change billing-related configurations.
- **Weak incident response:** Shared identities make investigation, containment, and recovery more difficult.
- **Reputational harm:** A security incident could reduce customer and investor confidence in the company.

## Workforce Access Requirements

StartupCo requires access based on job responsibilities:

### Developers

Developers require access to manage approved EC2 resources, work with application files stored in S3, and view CloudWatch logs. Their access should not include IAM administration, billing administration, or unrestricted database management.

### Operations

Operations personnel require broad infrastructure access to EC2, RDS, CloudWatch, and AWS Systems Manager. Their responsibilities do not automatically require unrestricted root-account, billing, or IAM administration.

### Finance

The finance manager requires access to Cost Explorer, AWS Budgets, billing information, and read-only resource information. The role should not permit infrastructure or application-data modification.

### Data Analysts

Data analysts require read-only access to approved S3 data and read-only access to relevant database data. Viewing RDS resources through AWS APIs is distinct from querying data within the database; database-level privileges must therefore be configured separately.

## Project Objective

Design and implement a secure, role-based AWS access model that removes shared root-account usage, establishes individual accountability, enforces appropriate authentication controls, and grants each team only the permissions required to perform its responsibilities.

The solution must improve security without preventing StartupCo's employees from completing legitimate work.

## Success Criteria

The project will be considered successful when:

- The root user is protected with MFA and removed from daily operations.
- No root-user access keys exist.
- Four workforce groups represent developers, operations, finance, and analysts.
- Ten fictional employee identities are assigned to the appropriate groups.
- No unnecessary access keys or shared credentials are created.
- Team permissions align with documented business responsibilities.
- A strong account password policy is configured.
- MFA is demonstrated and enforced for console-enabled test access.
- Allowed actions succeed during validation.
- Unauthorized actions are explicitly denied during validation.
- Current-state and target-state architectures are documented.
- Security decisions, limitations, and production recommendations are explained.

## Project Scope

### In Scope

- Current-state risk assessment
- Current-state and target-state architecture diagrams
- Root-account security review
- IAM users and groups for the academy scenario
- Role-based permission design
- Password-policy configuration
- MFA controls
- Positive and negative permission testing
- Sanitized screenshots
- Implementation and validation documentation
- Production recommendation for federated workforce access

### Out of Scope

- Building the fitness-tracking application
- Recreating the complete production network
- Migrating an external corporate directory
- Implementing application-level authorization
- Configuring production database tables or real customer data
- Creating long-lived access keys for fictional employees
- Multi-account AWS Organizations governance
- Infrastructure-as-code implementation in the initial release

## Key Assumptions and Open Questions

The project uses the following assumptions:

- Developer access is primarily intended for development resources rather than unrestricted production infrastructure.
- Operations requires broad service-management permissions but not root-user access.
- Finance requires visibility without resource-modification privileges.
- Analyst database access means permission to query approved data, not merely view RDS configuration.
- Fictional users do not require permanent console passwords or access keys.
- AWS IAM Identity Center would be preferred for production workforce access, while IAM users and groups are used here to demonstrate the academy's requested concepts.

The following questions would require confirmation in a real client engagement:

- Which developers require production access?
- Which S3 buckets and prefixes contain application files versus sensitive user data?
- Which database schemas and tables may analysts query?
- Does StartupCo already use an external identity provider?
- What approval process is required for privileged or emergency access?
- What retention and monitoring requirements apply to access activity?