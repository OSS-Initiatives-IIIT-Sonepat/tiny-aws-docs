---
title: "The Dependency Philosophy"
description: "Stand on giants vs own every layer. Two legitimate engineering philosophies that lead to completely different codebases."
author: "tiny-aws team"
date: "2026-09-14"
---

## Coolify: stand on the shoulders of giants

Coolify depends on everything battle-tested:
- **Docker** for container isolation and image management
- **Traefik** for routing, SSL, and Let's Encrypt
- **PostgreSQL** for persistent state (ACID guarantees, real transactions, migrations)
- **Redis** for caching and real-time features (queues, WebSocket message routing)
- **Laravel** for the web framework (routing, ORM, queues, events, middleware)
- **Livewire** for reactive UI components without a JavaScript framework
- **Soketi** for WebSocket handling
- **Nginx** for serving the PHP app
- **S6 Overlay** for process supervision inside the Coolify container

That's a lot of dependencies. The `composer.json` has dozens of PHP packages
(SSH libraries, YAML parsers, HTTP clients, AWS SDK for backups). The
`package.json` has Tailwind, Vite, Alpine.js, and more.

**This is the right call for a product.** Each dependency is maintained by its
own team, documented, tested at scale, and has a community around it. Coolify
inherits Docker's reliability, Traefik's routing features, and PostgreSQL's
ACID guarantees without having to implement any of them.

The risk is real: Docker's daemon can crash. Traefik has a learning curve.
PostgreSQL needs maintenance. Each dependency is a potential failure point and
a potential upgrade headache. But for a production PaaS serving thousands of
users, the tradeoff is clearly worth it.

## tiny-aws: own every layer

tiny-aws's entire Go control plane has exactly one external dependency:
`modernc.org/sqlite` — a pure-Go SQLite driver. That's it.

The CLI has zero external dependencies. It's just Go stdlib: `net/http`,
`encoding/json`, `os/exec`, `archive/zip`.

Rust services use standard async Rust: `tokio`, `axum`, `reqwest`, `serde`.
These are the established Rust ecosystem libraries — no frameworks, nothing
exotic.

Everything else is built from scratch:
- HTTP server: Go `net/http`, Rust `axum` — no Express, no Django, no Laravel
- Job scheduling: custom SQLite-backed Go service
- Message queue: custom SQLite-backed Go service  
- Object storage: custom C++ block engine + Rust HTTP layer
- Load balancing: custom Go round-robin proxy
- Container isolation: direct syscalls (unshare, overlayfs, cgroups)

**This is the right call for education.** Every line of code in tiny-aws is
there because someone had to write it. No magic. No "it's handled by the
framework." When you read the scheduler and want to know how jobs get
dispatched, you read the scheduler code — not a framework's internals.

## The tradeoff is real

Coolify inherits:
- Docker's reliability (and Docker's ~200MB daemon overhead)
- Traefik's routing sophistication (and Traefik's YAML config complexity)
- PostgreSQL's ACID guarantees (and PostgreSQL's installation requirements)
- Hundreds of PHP packages (and their security patch cycle)

tiny-aws owns:
- Every line of code (and every bug)
- Every architectural decision (and every missing feature)
- Every security gap (there are several, documented in the PRD)
- Zero dependency upgrade cycle (and zero inherited features)

## What this teaches you

Reading Coolify teaches you how to compose a PaaS from existing pieces.
Reading tiny-aws teaches you what those pieces actually do.

The best engineers understand both. You should know when to reach for Docker
(most of the time) and when to understand what Docker actually does (when
debugging, when constrained, when teaching, when the abstraction leaks).

tiny-aws is the "understand what Docker does" tool. Coolify is the "ship
your app with Docker" tool. Both philosophies are valid. Both are useful.
They're just for different moments.
