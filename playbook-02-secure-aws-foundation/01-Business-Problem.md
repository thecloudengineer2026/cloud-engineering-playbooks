# 01 – Business Problem

## Business Context

StartupCo is a rapidly growing Software-as-a-Service (SaaS) company whose engineering team has expanded from a small group of founders to a larger development organization. During the company's early growth, speed and product delivery were prioritized over operational governance. As a result, several temporary security practices became permanent parts of the AWS environment.

While these shortcuts supported rapid development, they introduced increasing levels of operational and security risk as the business matured.

---

## The Challenge

StartupCo's cloud environment lacked several foundational security controls expected of a growing technology company.

Examples included:

- Shared AWS administrative credentials
- Routine use of the AWS root account
- Limited visibility into administrative activity
- Broad access permissions across engineering teams
- Inconsistent identity management
- Minimal monitoring of security events

These practices reduced accountability, increased the likelihood of human error, and made it difficult to investigate incidents or demonstrate appropriate security governance.

---

## Business Risks

If these issues remained unaddressed, StartupCo faced several business risks:

- Unauthorized access to critical AWS resources
- Increased likelihood of accidental configuration changes
- Reduced ability to investigate security incidents
- Loss of customer confidence following a security event
- Greater difficulty meeting future compliance and enterprise customer expectations
- Security processes that would not scale alongside company growth

The organization needed a stronger security foundation without slowing engineering productivity or introducing unnecessary operational complexity.

---

## Project Goal

The objective of this case study is to design and implement a secure AWS foundation that improves identity management, access control, visibility, and operational governance while remaining practical for a growing startup.

Rather than pursuing security for its own sake, the solution focuses on reducing business risk and creating a scalable platform that supports future growth.

---

## Success Criteria

This project will be considered successful if StartupCo can:

- Eliminate routine use of the AWS root account
- Provide every administrator with an individual identity
- Strengthen authentication through Multi-Factor Authentication (MFA)
- Apply least-privilege access to AWS resources
- Capture and monitor administrative activity
- Improve accountability across engineering teams
- Establish a secure baseline that supports future organizational growth

---

## Guiding Question

> **How can a growing startup improve its security posture without creating unnecessary operational complexity?**

The remaining sections of this case study explain the architectural decisions, implementation approach, validation process, and lessons learned while answering this question.