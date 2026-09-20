---
title: "Scope: Platform vs Infrastructure"
description: "Coolify gives you WordPress in one click. tiny-aws gives you echo hello. Different worlds entirely."
author: "tiny-aws team"
date: "2026-09-13"
---

## Coolify: a complete platform

Coolify is a turnkey PaaS. It answers "how do I deploy my app?" with:

- Git integration (GitHub, GitLab, Bitbucket, Gitea) — push code, it deploys
- Automatic builds (Nixpacks auto-detects your framework, or use your Dockerfile)
- SSL certificates (Let's Encrypt, automatic renewal, zero config)
- Custom domains (Traefik handles routing automatically)
- **Databases** — one-click PostgreSQL, MySQL, MariaDB, MongoDB, Redis, ClickHouse
- Backups (S3-compatible, automatic scheduling)
- Team management (roles, permissions, shared projects, invitations)
- Monitoring (deployment status, disk usage, container health)
- Notifications (Discord, Telegram, Slack, email)
- Real-time terminal (in-browser SSH via WebSocket)
- Full REST API for automation
- 280+ one-click service templates (WordPress, Grafana, n8n, Plausible, Ghost, Gitea...)

If you want to run a Next.js app with a Postgres database behind a custom
domain with SSL and automatic deploys on git push, Coolify gets you there in
about 10 minutes. No manual configuration. No certbot. No nginx config files.

## tiny-aws: raw infrastructure

tiny-aws is a set of primitives. It answers "what is a cloud made of?" with:

- Compute — instances with namespace isolation, overlayfs, cgroups
- Storage — object store with S3-compatible API (PUT/GET/DELETE/list)
- Scheduling — job submission and dispatch across multiple agents
- Queuing — SQS-style message queue with visibility timeout
- Pub/sub — SNS-style event fan-out to HTTP subscribers
- Networking — VPC metadata, security group rules via iptables
- Auth — API keys with expiry and 2 roles (admin/readonly)
- Functions — Lambda-style function upload and invocation
- Load balancing — round-robin HTTP proxy to healthy targets
- CLI — 20+ commands mapping to the API

What tiny-aws does not have: SSL, custom domains, git integration, web UI,
databases as a service, backups, team management, monitoring, notifications,
service templates.

## The concrete difference

Coolify: `tinyaws deploy` a WordPress template → running WordPress with MySQL,
SSL, and a domain in ~5 minutes.

tiny-aws: `tinyaws job submit "echo hello"` → "hello" in your terminal.

That's not a criticism of tiny-aws. It's a scope difference. tiny-aws
implements the layer that WordPress, MySQL, SSL, and domain routing are
eventually built on top of. Coolify implements the layer that turns those
primitives into a product.

## When does this matter?

If you want to **ship something**: use Coolify. It's built for developers who
want their app running, not developers who want to understand the infrastructure.

If you want to **understand something**: use tiny-aws. Read the scheduler source
and understand how AWS ECS places tasks. Read the SQS source and understand
why visibility timeouts exist. Read the network agent and understand what
`docker network create` does.

The best engineers eventually need both: the ability to ship quickly AND the
understanding of what's happening underneath. Coolify for Monday. tiny-aws
for Saturday.
