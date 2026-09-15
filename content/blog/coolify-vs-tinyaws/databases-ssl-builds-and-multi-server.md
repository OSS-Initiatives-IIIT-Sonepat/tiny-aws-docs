---
title: "Databases, SSL, Builds, and Multi-Server"
description: "The practical feature-by-feature breakdown of where Coolify and tiny-aws go their separate ways."
author: "tiny-aws team"
date: "2026-09-14"
---

## Database hosting

**Coolify:** First-class feature. One-click deployments for PostgreSQL, MySQL,
MariaDB, MongoDB, Redis, ClickHouse, DragonFly. Automatic backups to any
S3-compatible storage. UI for managing connection strings. Works on any server
you've connected to Coolify. This is one of Coolify's strongest features — you
get a managed database experience on your own hardware.

**tiny-aws:** No database service. You could run PostgreSQL inside a tiny-aws
instance using the compute layer, but there's no managed offering, no
one-click setup, no automatic backups, no connection string management.
The object store can store files, but it's not a database.

---

## SSL certificates

**Coolify:** Traefik handles everything automatically. You set a domain in the
UI, Coolify adds Traefik labels to your Docker container, Traefik contacts
Let's Encrypt, certificates are provisioned, automatically renewed before
expiry. Zero manual steps.

**tiny-aws:** No SSL. The load balancer does plain HTTP. If you want HTTPS, you
put nginx or Caddy in front manually. The PRD marks TLS as a Tier M item —
"add before exposing to the internet." It's a known gap.

---

## Build system

**Coolify:** Three options:
1. **Nixpacks** — auto-detects your language/framework (Node.js, Python, Ruby, PHP, Rust, Go...) and generates a build plan
2. **Your Dockerfile** — full control, whatever you want
3. **docker-compose.yml** — multi-container apps with one config file

Coolify runs `docker build` on your target server, so the build environment
is the target server's Docker daemon.

**tiny-aws:** No build system. You zip your source directory as-is. The agent
downloads and extracts the zip and runs your `start.sh`. If your app needs
`npm install` or `pip install`, those go in the start script or you include
pre-installed deps in the zip. It's your problem.

This is intentional — tiny-aws is teaching you the deployment primitive, not
abstracting the build.

---

## Multi-server

**Coolify:** Add servers by providing SSH credentials. Coolify SSHes in,
installs Docker if needed, and manages everything over SSH commands. Dozens
of servers, each running different apps, all managed from one dashboard.

**tiny-aws:** Start an agent binary on each machine. The agent registers with
the central registry over HTTP (using `AGENT_ADVERTISE_ADDR` for its routable
IP). The scheduler distributes jobs across healthy agents. No SSH involved —
pure agent-based registration and HTTP polling.

| | Coolify | tiny-aws |
|---|---|---|
| Discovery | SSH connection you configure | Agent self-registration via HTTP |
| Communication | SSH commands | HTTP polling (agents poll scheduler every 3s) |
| Requirements | Docker on target server | Rust agent binary on target server |
| Auth | SSH keys | Bearer token API key |
| Agent install | Automatic via install script | Manual (cargo build or download binary) |

---

## Infrastructure requirements

| | Coolify | tiny-aws |
|---|---|---|
| **Minimum server** | 2 vCPU, 2 GB RAM, 30 GB disk | Any Linux box with Go + Rust installed |
| **OS** | Ubuntu, Debian, Fedora, CentOS, Arch | Linux (full), Windows (partial, no isolation) |
| **Runtime deps** | Docker, Docker Compose (auto-installed) | None (self-contained binaries) |
| **Database** | PostgreSQL 15 (bundled in Docker install) | SQLite (file on disk, no setup) |
| **Ports needed** | 8000 (UI), 80/443 (Traefik), 6001 (WS), 5432 (Postgres) | 9000-9007 (services), 8080 (agent), 8088 (LB), 8000 (gateway) |
| **Docker required** | Yes (entire architecture depends on it) | No |
| **Root access** | Yes (Docker requires root or docker group) | Yes for isolation, No for basic job execution |
| **RAM overhead** | ~500 MB+ (Postgres, Redis, Soketi, PHP, Nginx) | ~50 MB (all services combined) |
| **Install time** | ~5 minutes (one curl command) | ~20 minutes (clone + build everything) |

The RAM difference is significant if you're running on a small VPS.
Coolify's ~500MB baseline means a $6/month 1GB DigitalOcean droplet is tight.
tiny-aws's ~50MB baseline runs fine on basically anything.
