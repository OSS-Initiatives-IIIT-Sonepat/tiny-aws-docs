---
title: "Docker vs No Docker"
description: "The fundamental architectural split. And why it matters more than any other difference."
author: "tiny-aws team"
date: "2026-09-13"
---

## This is the split that drives everything else

**Coolify** treats Docker as infrastructure. It uses Docker the way Docker was
designed to be used: `docker build`, `docker compose up`, `docker network
create`. Coolify is Docker's best friend. Every app you deploy is a container.
Every database you spin up is a container. Your SSL termination runs in a
container. Coolify itself runs in a container.

**tiny-aws** has no Docker dependency. The PRD explicitly says: "No Kubernetes,
no Docker, no JVM." When tiny-aws isolates a process, it calls `unshare(2)`
directly. When it builds a filesystem, it uses `overlayfs` directly. When it
limits CPU, it writes to `/sys/fs/cgroup` directly.

## What Docker actually is

Docker is roughly 20,000 lines of Go that does the following:

1. Calls `unshare()` to create new namespaces (PID, mount, network, UTS, IPC, user)
2. Sets up a filesystem with `overlayfs` (writable layer on top of a base image)
3. Calls `pivot_root()` or `chroot` to give the container its own filesystem root
4. Writes cgroup limits to `/sys/fs/cgroup` for CPU and memory constraints
5. Optionally sets up a virtual ethernet pair (`veth`) for network isolation
6. Loads a seccomp profile to restrict dangerous syscalls
7. Runs your process

That's it. The rest of Docker is the image format, the registry protocol,
the Compose file format, the networking model, and the CLI.

tiny-aws does steps 1-7 in its `ec2-agent` (around ~1,500 lines of Rust).
It's not as featureful as Docker, but it's the same syscalls underneath.

## Why Coolify uses Docker (and it's the right call for them)

If you're building a production PaaS in 2022, you don't reinvent isolation.
Docker handles:
- Pulling images from registries
- Building images from Dockerfiles
- Layer caching (fast rebuilds)
- Resource limits
- Network isolation
- The whole image ecosystem (nginx, postgres, redis, everything already containerized)

Coolify gets all of that for free. The tradeoff is Docker as a required
dependency with its daemon overhead (~200MB+ memory just for dockerd).

## Why tiny-aws skips Docker (and it's the right call for education)

If you want to *use* containers, Docker is great. If you want to *understand*
containers, you need to see the syscalls.

When you read the ec2-agent code and see:

```rust
Command::new("unshare")
    .args(&["--pid", "--mount", "--fork"])
    // ... setup namespaces
```

...you understand what `docker run` actually does at the kernel level.
When you `docker run`, you're calling this same thing, just through a bigger
API.

## The practical impact

For Coolify users: you get Docker's entire ecosystem. Any Dockerfile from the
internet works. Any `docker-compose.yml` works. Pull an nginx image, a postgres
image, anything. The isolation is Docker-grade.

For tiny-aws users: you get understanding. You can't pull a Docker image. You
need a root filesystem (Debian rootfs from debootstrap). But you know exactly
what's happening at the kernel level, which makes you a better engineer.

This isn't "tiny-aws is worse." It's "tiny-aws is for a different purpose."
The whole point is to see the layer Docker hides.
