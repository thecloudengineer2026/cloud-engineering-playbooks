# 02 – Architecture Decisions

## Overview

Technology decisions should always support business objectives. Before implementing any AWS services, I evaluated StartupCo's operational needs, growth trajectory, and security risks to determine which architectural decisions would provide the greatest long-term value while remaining appropriate for the organization's current stage of maturity.

The following decisions shaped the final solution.

---

# Decision 1 — Individual AWS Identities

## Business Problem

StartupCo relied on shared administrative credentials, making it impossible to determine who performed privileged actions within the AWS environment.

## Decision

Create an individual IAM identity for every administrator.

## Why

Individual identities improve accountability, support auditing, simplify access management, and reduce organizational risk without adding significant operational overhead.

## Trade-Off

Managing individual users requires slightly more administration than shared credentials, but the increase in accountability and security far outweighs the additional effort.

---

# Decision 2 — Multi-Factor Authentication (MFA)

## Business Problem

Single-factor authentication increased the likelihood that compromised passwords could result in unauthorized access.

## Decision

Require MFA for privileged AWS identities.

## Why

MFA provides a significant increase in account security with minimal impact on the daily workflow of administrators.

## Trade-Off

Users spend a few additional seconds authenticating during login, but the improvement in identity assurance makes this a worthwhile investment.

---

# Decision 3 — Role-Based Access Control (RBAC)

## Business Problem

Engineers had broader permissions than required to perform their responsibilities.

## Decision

Assign permissions based on job function rather than granting unrestricted administrative access.

## Why

Role-based access reduces accidental changes, limits the impact of compromised credentials, and aligns with the Principle of Least Privilege.

## Trade-Off

RBAC requires additional planning during implementation, but it becomes significantly easier to manage as the organization grows.

---

# Decision 4 — Centralized Audit Logging

## Business Problem

StartupCo had limited visibility into activity occurring within its AWS environment.

## Decision

Capture administrative activity using AWS CloudTrail.

## Why

Audit logs improve operational visibility, simplify troubleshooting, support incident investigations, and strengthen organizational governance.

## Trade-Off

CloudTrail introduces a small storage cost, but the operational value greatly exceeds the expense.

---

# Decision 5 — Security Monitoring

## Business Problem

Potential security events could occur without administrators becoming aware of them.

## Decision

Implement CloudWatch monitoring and notifications for important security events.

## Why

Timely alerts reduce response time and improve operational awareness.

## Trade-Off

Alert thresholds require tuning over time to minimize unnecessary notifications.

---

# Decision 6 — Infrastructure as Code

## Business Problem

Manual configuration increases inconsistency and makes environments difficult to reproduce.

## Decision

Implement infrastructure using Terraform wherever practical.

## Why

Infrastructure as Code improves consistency, repeatability, documentation, and future scalability while reducing manual configuration errors.

## Trade-Off

Terraform introduces an initial learning curve but provides significant long-term operational benefits.

---

# Summary

Each architectural decision was selected because it directly addressed a business risk while remaining appropriate for StartupCo's size, maturity, and operational needs.

Rather than implementing security controls simply because they represent AWS best practices, every decision was evaluated according to three questions:

- Does this reduce meaningful business risk?
- Is it appropriate for the organization's current stage of growth?
- Will it support future scalability without unnecessary complexity?

These principles guided every implementation decision throughout this case study.