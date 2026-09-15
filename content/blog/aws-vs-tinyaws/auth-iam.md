---
title: "Auth: IAM"
description: "AWS IAM is a career. tiny-aws IAM is 80 lines of Go. Here's what that gap looks like."
author: "tiny-aws team"
date: "2026-09-13"
---

## How AWS does it

AWS IAM is a beast. Users, groups, roles, policies (JSON documents specifying
which actions on which resources are allowed or denied), temporary credentials
via STS, cross-account access, identity federation via SAML and OIDC, permission
boundaries, service control policies, session policies, resource-based
policies...

It's the most complicated part of AWS. People make entire careers out of
understanding IAM. The policy evaluation alone has its own multi-step logic:
explicit deny wins over explicit allow wins over implicit deny. That logic runs
on every single API call in AWS — billions of times per second.

The reason IAM is so complex is that large organizations need granular control:
"this Lambda function can read from this specific S3 bucket but not write, and
only when invoked by this specific API Gateway stage." tiny-aws doesn't need
that because it's a teaching tool, not a multi-tenant cloud.

## How tiny-aws does it

A SQLite table called `api_keys` with three columns: `key`, `role`, `expires_at`.

Two roles:
- `admin` — can do everything
- `readonly` — GET requests only

Set `TINYAWS_API_KEY` env var and all requests need a `Bearer` token in the
Authorization header. Keys can expire (null = never expires).

That's it. 80 lines of Go.

## The numbers

| | AWS IAM | tiny-aws IAM |
|---|---|---|
| Principals | Users, groups, roles, federated identities | API keys |
| Permissions | JSON policies (Allow/Deny per action per resource) | 2 roles: admin, readonly |
| Temporary credentials | STS (AssumeRole, GetSessionToken) | expires_at field |
| Cross-account | Yes | No |
| Identity federation | SAML, OIDC, AWS SSO | No |
| MFA | Yes | No |
| Policy evaluation | 5-step logic with explicit deny | key lookup in SQLite |
| Implementation | Proprietary (massive) | ~80 lines of Go |

## The honest lesson

The gap between 80 lines and "entire careers are built on this" is the lesson.

AWS IAM is complicated because real organizations need:
- Developer A can deploy to staging but not production
- CI/CD can read secrets but not delete them
- The billing team can see costs but not touch infrastructure
- External partner gets read-only access to one specific bucket for 24 hours

None of that complexity is in tiny-aws. But once you've seen the simple
version — API key table, two roles, Bearer tokens — you have a mental model
to hang the complex version on. The concepts transfer. The SQL scales up.
