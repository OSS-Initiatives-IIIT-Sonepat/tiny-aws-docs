---
title: "The Size Difference"
description: "62k stars, 200k lines, hundreds of dependencies vs a handful of students, 8,500 lines, one SQLite dep."
author: "tiny-aws team"
date: "2026-09-12"
---

## This is the most striking thing, so let's put it upfront

| | Coolify | tiny-aws |
|---|---|---|
| **Production code** | ~200,000+ lines (estimated) | ~8,500 lines |
| **Languages** | PHP, JavaScript, Bash, Blade | Go, Rust, C++ |
| **Files** | 2,000+ | ~64 production files |
| **Dependencies** | composer.json + package.json (hundreds of PHP/JS packages) | 1 Go dep (modernc.org/sqlite), a few Rust crates |
| **External services required** | Docker, Docker Compose, Traefik, PostgreSQL, Redis, Soketi, Nginx, S6 Overlay | None. SQLite files on disk. |
| **GitHub stars** | 62,000+ | New project |
| **Commits** | 17,000+ | ~300 |
| **Contributors** | 500+ | A handful of students |
| **Age** | 4+ years (started ~2022) | ~1 month |
| **Tests** | PHPUnit + Dusk (browser tests) | 323 unit tests + 17 integration scripts |
| **License** | Apache-2.0 | MIT |

## What does this mean?

Coolify is a mature product with a company behind it (coolLabs Solutions Kft),
paid cloud hosting, sponsors, and a 20,000+ member Discord. tiny-aws is a
student project that happens to work end-to-end.

You shouldn't compare them as competing products. That would be like comparing
a Toyota factory to a student's go-kart. Same broad domain (vehicles), totally
different purpose.

Compare them as architectures: how do two projects serving broadly similar
goals (run apps on your own hardware) make completely different choices in
language, dependencies, infrastructure requirements, and philosophy?

## Why Coolify is 200k lines

It's not bloat. A production PaaS needs:
- A full web UI (that's tens of thousands of lines right there)
- Real-time WebSocket terminal
- Team and permission management
- Git webhook handling
- SSL certificate management
- Database management
- Backup orchestration
- Notification integrations (Discord, Telegram, email, Slack...)
- 280+ service templates
- A full REST API with documentation
- Multi-language builds (Nixpacks, Dockerfile, Compose)

Each of those is a significant feature. 200k lines is the cost of being a
complete product.

## Why tiny-aws is 8,500 lines

It's not underpowered. It's scoped differently:
- No web UI (CLI only)
- No team management
- No SSL
- No git integration
- No service templates
- No backups

tiny-aws implements the *infrastructure layer* — compute, storage, queuing,
pubsub, networking, auth, functions. The layer that everything else is built on.

8,500 lines to implement cloud infrastructure is remarkable. 200,000 lines
to build a polished product on top of existing infrastructure is also
remarkable. They're remarkable in different ways.
