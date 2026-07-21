# 03 – Implementation

## Overview

After defining the target architecture, the next step was to implement the security controls in AWS. The implementation followed a logical progression, beginning with identity management before adding visibility, monitoring, and governance capabilities.

Each implementation phase built upon the previous one, creating a secure foundation that could support StartupCo's future growth.

---

## Phase 1 – Secure Identity Management

### Objective

Establish individual accountability for every administrator.

### Activities

- Created individual IAM users for administrators
- Organized users into IAM groups
- Assigned permissions based on job responsibilities
- Eliminated routine use of the AWS root account

### Outcome

Administrative actions can now be traced to individual users, improving accountability and reducing operational risk.

---

## Phase 2 – Strengthen Authentication

### Objective

Reduce the risk of unauthorized access.

### Activities

- Enabled Multi-Factor Authentication (MFA)
- Verified successful MFA enrollment
- Documented secure login procedures

### Outcome

Privileged access now requires both a password and a second authentication factor.

---

## Phase 3 – Apply Least Privilege

### Objective

Limit administrative permissions to only what is required.

### Activities

- Created role-based IAM groups
- Assigned least-privilege policies
- Tested administrative and read-only access

### Outcome

Users receive only the permissions necessary to perform their responsibilities.

---

## Phase 4 – Improve Visibility

### Objective

Capture activity occurring within the AWS environment.

### Activities

- Enabled AWS CloudTrail
- Verified management event logging
- Confirmed audit log generation

### Outcome

Administrative activity is now recorded for operational visibility and future investigations.

---

## Phase 5 – Monitoring & Alerts

### Objective

Improve awareness of important security events.

### Activities

- Configured CloudWatch monitoring
- Created SNS notifications
- Tested alert delivery

### Outcome

Administrators receive timely notification of important security events.

---

## Phase 6 – Infrastructure as Code

### Objective

Improve consistency and repeatability.

### Activities

- Defined infrastructure using Terraform
- Validated successful deployments
- Documented configuration

### Outcome

Security controls can now be deployed consistently across future environments.

---

## Implementation Summary

The implementation followed a business-first approach:

1. Secure identities
2. Strengthen authentication
3. Reduce unnecessary permissions
4. Improve operational visibility
5. Monitor critical events
6. Automate infrastructure

Each phase directly supported the project's objective of creating a secure AWS foundation without introducing unnecessary operational complexity.

## Implementation Evidence

The security controls were implemented and validated in an AWS account.

### Identity and Access Management

- Created an individual IAM user for administrative activity.
- Enabled multi-factor authentication.
- Created a read-only IAM group using the AWS-managed `ReadOnlyAccess` policy.
- Verified group membership and assigned permissions.

### Audit Logging

- Created a multi-Region CloudTrail trail.
- Configured CloudTrail to deliver audit logs to Amazon S3.
- Connected the trail to Amazon CloudWatch Logs for centralized monitoring.
- Verified that AWS management events appeared in CloudTrail Event History.

### Security Monitoring and Alerting

- Created a CloudWatch Logs metric filter for root-account activity.
- Created a CloudWatch alarm that enters the alarm state when root activity is detected.
- Connected the alarm to an Amazon SNS security-alert topic.
- Confirmed the SNS email subscription and successfully delivered a test notification.

Implementation screenshots are available in the [`images`](./images/) directory.