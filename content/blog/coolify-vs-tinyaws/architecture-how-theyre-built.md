---
title: "Architecture: How They're Built"
description: "Laravel monolith + Docker orchestration vs 12 Go/Rust microservices with raw syscalls."
author: "tiny-aws team"
date: "2026-09-12"
---

## Coolify: a Laravel monolith

Coolify is a Laravel 11 (PHP 8.4) backend with a Livewire + Alpine.js frontend.

| Layer | Technology | What it does |
|-------|------------|-------------|
| Web UI | Livewire, Alpine.js, Blade, Tailwind CSS | Real-time dashboard, terminal, team management |
| Backend | Laravel 11 (PHP 8.4) | Business logic, SSH orchestration, API |
| Database | PostgreSQL 15 | All state: servers, apps, deployments, teams |
| Cache / real-time | Redis 7 + Soketi | Session cache, queues, live terminal, notifications |
| Process supervisor | S6 Overlay | Keeps PHP, Nginx, Soketi alive in the Coolify container |
| Web server | Nginx | Serves the PHP app |
| Container runtime | Docker + Docker Compose | All app isolation, building, networking |
| Reverse proxy | Traefik | Dynamic routing, SSL termination, Let's Encrypt |

### Deploying an app on Coolify (10 steps)

1. Push to GitHub (or trigger manually in the UI)
2. Coolify's backend receives the webhook
3. It SSHes into your target server
4. It clones your repo on the server
5. It generates a Dockerfile (or uses yours, or uses Nixpacks to auto-detect)
6. It runs `docker build` to create an image
7. It runs `docker compose up` to start the container
8. It configures Traefik labels so your domain routes to the container
9. Traefik automatically provisions Let's Encrypt SSL certificates
10. The UI shows deployment status in real-time via WebSocket

Docker does the heavy lifting for isolation. Traefik does all the networking.
PostgreSQL stores all state. Coolify is the orchestration and UX layer.

This is a completely sensible architecture. Docker is battle-tested. Traefik is
battle-tested. Laravel is battle-tested. Coolify stands on giants.

---

## tiny-aws: 12 independent microservices

tiny-aws has no shared framework. Each service is its own binary.

| Layer | Technology | What it does |
|-------|------------|-------------|
| Control plane | Go stdlib `net/http` | Registry, scheduler, SQS, SNS, VPC, controller, metadata, API gateway (8 services) |
| Compute agent | Rust + tokio | Job execution, container management, heartbeats |
| Object store | Rust + axum + C++ FFI | File storage with custom block engine |
| Network agent | Rust + tokio | iptables/netsh rule enforcement |
| CLI | Go stdlib | Command-line interface for all operations |
| Persistence | SQLite | Every service that needs state (one .db file each) |

### Deploying an app on tiny-aws (13 steps)

1. Run `tinyaws deploy ./my-app --service --port 3000`
2. CLI zips the directory
3. Uploads the zip to the object store
4. Submits a job to the scheduler with the object URL and `job_type: "service"`
5. Scheduler queries registry for healthy compute nodes
6. Picks one (round-robin) and creates a "pending" job record in SQLite
7. Agent on that node polls `GET /jobs?node_id=X&status=pending` (every 3s)
8. Agent picks up the job, downloads the zip, extracts to a workspace dir
9. Spawns the start script as a detached process
10. Registers the service with the registry (port + PID)
11. Starts uploading service.log to the object store every 30s
12. Load balancer discovers the new service (polls registry every 10s)
13. Traffic starts routing to your app

No Docker anywhere. No framework. Isolation uses raw Linux kernel primitives
(if sandbox mode is on). The storage is a custom C++ engine. Everything is
built from scratch.

---

## The key difference

Coolify's architecture is "use the best tool for each job." Docker for isolation,
Traefik for routing, Postgres for state. Each tool is maintained by its own
team, battle-tested at scale.

tiny-aws's architecture is "build every tool yourself." Custom scheduler,
custom storage engine, custom queue, custom isolation layer. The point isn't
to build something better — it's to understand what you'd be depending on if
you chose the other approach.

After reading both, you understand why Coolify chose Docker. That's the lesson.
