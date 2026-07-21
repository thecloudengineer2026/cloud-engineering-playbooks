# 04 – Validation

## Overview

Implementing security controls is only valuable if those controls perform as intended. The final phase of this case study focused on validating that the target architecture achieved the project's business objectives and reduced StartupCo's operational risk.

The following validation activities were performed after implementation.

---

## Validation Results

## Validation Results

| Validation Check | Expected Result | Result |
|---|---|---|
| Individual IAM identity exists | Administrative work does not depend on routine root-user access | Passed |
| MFA is enabled | The IAM identity requires an additional authentication factor | Passed |
| Read-only permissions are assigned through a group | Access is managed through role-based group membership | Passed |
| CloudTrail logging is enabled | AWS management activity is recorded | Passed |
| CloudTrail logs are delivered to Amazon S3 | Audit logs are retained outside the event-history interface | Passed |
| CloudTrail events are sent to CloudWatch Logs | Events are available for centralized monitoring | Passed |
| Root-account metric filter exists | Root-user activity can generate a security metric | Passed |
| CloudWatch alarm is connected to SNS | Matching security events initiate a notification workflow | Passed |
| SNS test notification is received | The notification channel successfully delivers email alerts | Passed |

## Validation Evidence

Screenshots were captured for each implemented control and stored in the [`images`](./images/) directory. Sensitive account identifiers and personal information were excluded or redacted before publication.
---

## Business Outcomes

The implemented solution achieved the primary objectives established at the beginning of the project.

### Improved Accountability

Administrative actions can now be traced to individual users, eliminating the ambiguity created by shared credentials.

### Reduced Security Risk

Multi-Factor Authentication and least-privilege access reduce the likelihood and impact of unauthorized access.

### Increased Operational Visibility

CloudTrail and CloudWatch provide continuous visibility into administrative activity and important security events.

### Improved Scalability

The environment now follows security practices that can support StartupCo as its engineering organization continues to grow.

---

## Project Success

This project successfully established a secure AWS foundation by improving identity management, access control, monitoring, and operational governance while avoiding unnecessary complexity for a growing startup.

The implemented controls provide a practical security baseline that can evolve alongside future business and technical requirements.