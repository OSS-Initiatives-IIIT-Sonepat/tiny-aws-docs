---
title: "Full Technical Comparison Table"
description: "30 dimensions. Side by side. No fluff."
author: "tiny-aws team"
date: "2026-09-14"
---

## The table

| Dimension | Coolify | tiny-aws |
|-----------|---------|----------|
| **Goal** | Production PaaS for self-hosters | Educational cloud infrastructure |
| **Architecture** | Laravel monolith + Docker orchestration | 12 independent microservices |
| **Production code** | ~200,000+ lines | ~8,500 lines |
| **Languages** | PHP, JavaScript, Bash, Blade templates | Go, Rust, C++ |
| **Container runtime** | Docker (dockerd daemon) | systemd-nspawn + raw namespaces (unshare/overlayfs/cgroups) |
| **Storage** | Docker volumes; S3-compatible backups | Custom C++ block engine + Rust HTTP layer |
| **Database** | PostgreSQL 15 (Eloquent ORM, migrations) | SQLite (one .db file per service, raw SQL) |
| **Cache** | Redis 7 | None |
| **Frontend** | Livewire + Alpine.js + Tailwind CSS | None (CLI only) |
| **Reverse proxy** | Traefik (automatic SSL, Let's Encrypt, dynamic routing) | Custom Go round-robin LB (plain HTTP, no SSL) |
| **Git integration** | GitHub, GitLab, Bitbucket, Gitea webhooks | None (zip upload) |
| **SSL** | Let's Encrypt automatic provisioning and renewal | None |
| **Domains** | Custom domain routing via Traefik labels | No domain management |
| **Service templates** | 280+ one-click (WordPress, Grafana, n8n, Plausible...) | Build your own |
| **Database hosting** | PostgreSQL, MySQL, MariaDB, MongoDB, Redis, ClickHouse (one-click) | None |
| **Backups** | S3-compatible, automatic scheduling | None |
| **External dependencies** | Docker, Traefik, PostgreSQL, Redis, Soketi, Nginx, S6 Overlay | 1 SQLite driver (that's it) |
| **RAM overhead** | ~500 MB+ | ~50 MB (all services combined) |
| **Monitoring** | Built-in (disk, deployments, container health) | Agent heartbeats only |
| **Notifications** | Discord, Telegram, Slack, email | None |
| **Team management** | Roles, permissions, shared projects, invitations | admin / readonly API keys |
| **Real-time UI** | WebSocket terminal, live deployment logs | None |
| **Queuing** | Redis-backed Laravel queues | Custom SQS service (SQLite) |
| **Pub/sub** | None built-in | Custom SNS service (HTTP fan-out) |
| **VPC / Networking** | Docker networks | Custom VPC metadata + iptables rules |
| **Serverless / FaaS** | No | Yes (Lambda runtime, ~236 lines Go) |
| **Multi-server** | Yes (SSH to remote servers, auto Docker install) | Yes (agent self-registration + HTTP polling) |
| **Build system** | Nixpacks / Dockerfile / docker-compose | Zip and upload (no build step) |
| **API** | Full REST API with OpenAPI spec | REST API per service (no unified spec) |
| **Install** | `curl -fsSL https://cdn.coollabs.io/coolify/install.sh \| bash` | `git clone` + `go build` + `cargo build` |
| **Time to first deploy** | ~5 minutes (install + UI walkthrough) | ~20 minutes (build all 12 services + start) |
| **GitHub stars** | 62,000+ | New project |
| **Contributors** | 500+ from around the world | A handful of students at IIIT Sonepat |
| **License** | Apache-2.0 | MIT |

## Reading this table

The differences cluster into two groups:

**Product features Coolify has and tiny-aws doesn't:** SSL, domains, templates,
database hosting, backups, monitoring, notifications, teams, real-time UI,
git integration. These are all "above the infrastructure layer" features that
make a PaaS usable for real developers.

**Infrastructure features tiny-aws has and Coolify doesn't:** Custom SQS,
custom SNS, Lambda runtime, VPC metadata, custom network agent. These are
cloud primitives that Coolify doesn't need because Docker handles the
equivalent functionality.

That pattern tells you something: Coolify builds on top of Docker (which
handles containers, networking, storage) and adds a product layer. tiny-aws
builds the Docker-equivalent layer itself and exposes it directly. Different
layers of the same stack.
