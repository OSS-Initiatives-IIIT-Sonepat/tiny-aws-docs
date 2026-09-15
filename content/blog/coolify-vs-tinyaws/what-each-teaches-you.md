---
title: "What Each Teaches You"
description: "Study Coolify and learn how to build a production PaaS. Study tiny-aws and learn how the cloud works underneath."
author: "tiny-aws team"
date: "2026-09-15"
---

## If you study Coolify's architecture

**You learn how to build a production PaaS with Laravel.**
The route structure, controller patterns, model relationships, job queues,
event broadcasting — it's a well-organized real-world Laravel app at scale.

**You learn Docker orchestration over SSH.**
Coolify's core loop: receive webhook → SSH to server → docker build → docker
compose up → configure Traefik labels → return status. This pattern scales to
thousands of servers and is essentially how every managed hosting service works.

**You learn how Traefik handles routing.**
Dynamic configuration via Docker labels, automatic Let's Encrypt certificate
provisioning, HTTPS redirection, health checks, load balancing. Traefik is used
at scale in production and Coolify teaches you how to use it properly.

**You learn real-time UIs with Livewire and WebSockets.**
The deployment log that streams in real-time, the terminal in the browser, the
live status updates — these are powered by Livewire components, Alpine.js
reactivity, and Soketi WebSocket server. This is a real production stack.

**You learn PostgreSQL + Redis together.**
PostgreSQL for durable state with migrations and relationships. Redis for
caching, session storage, and queue backend. This combination is the backbone
of most production web apps.

**You learn the value of standing on proven tools.**
Coolify chose Docker, Traefik, PostgreSQL, and Laravel because they're
battle-tested. Reading Coolify teaches you not just how to use these tools,
but why you'd choose them over building everything yourself.

---

## If you study tiny-aws's architecture

**You learn how cloud services are built from scratch.**
Not just "EC2 launches VMs" — you learn the exact sequence of syscalls,
API calls, and state transitions that happen when an instance boots. You read
the Go service that handles the API and the Rust agent that does the work.

**You learn Linux container primitives.**
`unshare(2)`, `pivot_root(2)`, `overlayfs`, cgroups v2, seccomp profiles.
This is what Docker does when you type `docker run`. After reading the
ec2-agent, you know exactly what that command does at the kernel level.

**You learn multi-language system design.**
Go for HTTP services (fast to write, easy to read). Rust for systems code
(memory safety, no GC pauses, direct syscall access). C++ for the storage
engine (FFI from Rust, low-level block I/O). Seeing all three in one system
teaches you when to reach for each.

**You learn distributed systems concepts in a small, readable codebase.**
Replication: the object store replicates to multiple nodes. Scheduling: the
scheduler places jobs across agents. Health checks: the LB polls agents and
removes unhealthy ones. Service discovery: agents register and deregister.
These patterns are the same ones in Kubernetes and AWS, just at 1/1000th the
scale.

**You learn SQLite as a universal persistence layer.**
Every tiny-aws service uses SQLite. The scheduler doesn't need Postgres. The
queue doesn't need Redis. For read-heavy, single-writer workloads, SQLite is
remarkably capable — and seeing it used this way changes how you think about
when you actually need a "real" database.

**You learn the cost of building everything yourself.**
Every missing feature (SSL, monitoring, backups, Git integration) is a feature
someone had to decide not to build. Reading the PRD's "not MVP" and "not
production-ready" sections teaches you how to scope a system — what to include
and what to defer.

---

## The philosophical difference

Coolify's philosophy: **use the tool, focus on the experience.**
Docker solved containers. Traefik solved routing. Postgres solved state.
Coolify's job is to build the best experience on top. This is the right
approach for a product — nobody wants to implement TLS from scratch.

tiny-aws's philosophy: **build the tool, understand the layer.**
No Docker, no frameworks, no shortcuts. The point is not to build something
better than Docker — it's to understand what Docker does by building it yourself.

**Coolify asks:** how do we make self-hosting as easy as Vercel?
**tiny-aws asks:** how does the thing underneath Vercel actually work?

Both are valid questions. The best engineers ask both.

---

## The honest path

Use Coolify to ship. Read tiny-aws to learn. Then go read the AWS architecture
whitepapers, the Firecracker paper, the Dynamo paper — and you'll actually
understand what they're talking about, because you've seen the smaller version
that makes the big version legible.

That's growth.
