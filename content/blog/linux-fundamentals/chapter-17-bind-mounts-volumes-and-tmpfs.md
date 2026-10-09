---
title: "Chapter 17: Bind mounts, volumes, and tmpfs"
description: "overlayfs gives each container a private rootfs. But sometimes you want a container to share a directory with the host, or have a fast in-memory scratch space."
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-01-27"
---

overlayfs gives each container a private rootfs. Any writes the container makes go into its upper layer and disappear when the container exits. The base image is untouched.

That's usually what you want. But sometimes you want a container to share a directory with the host — a data directory, a config file, a Unix socket. Or you want a filesystem that's fast and temporary: disappears on reboot, stored in RAM, no I/O overhead. Or you want to mount a host directory read-only inside the container.

These are bind mounts and tmpfs.

---

## Bind mounts

Chapter 4 explained that the VFS lets you mount things at arbitrary paths. A bind mount is the simplest possible mount: you mount one directory at another path. Not a device. Not a new filesystem. Just a second address for the same directory.

```bash
mount --bind /host/data /container/rootfs/data
```

After this, `/host/data` and `/container/rootfs/data` show the same contents. They're the same directory, accessed by two different paths. Writes through one path are immediately visible through the other — because there's only one underlying inode tree.

The container process (running with `/container/rootfs` as its `/`) sees `/data`. The host sees `/host/data`. Same files. If the container writes to `/data/output.json`, the host can read `/host/data/output.json` immediately.

This is how volume mounts work in every container runtime. Docker's `-v /host/dir:/container/dir` is a bind mount. Kubernetes PersistentVolumes are bind mounts (with extra plumbing). It's always bind mounts.

---

## Why bind mounts are mount namespace operations

From chapter 8: each process has its own mount namespace. When you create a bind mount inside a container's mount namespace, it's private to that namespace. The host's mount table is unaffected.

This is how tiny-aws can bind a directory into a container without affecting the host's filesystem view. The bind mount entry exists only in the container's mount namespace. When the container exits and its namespace is destroyed, the bind mount is automatically removed.

---

## Mount options that matter for security

Every mount, including bind mounts, can have options that restrict what's allowed inside:

**`noexec`** — binaries on this filesystem cannot be executed. Useful for data directories: if an attacker writes a malicious binary to a data volume, `noexec` prevents them from running it. `/tmp` is often mounted with `noexec`.

**`nosuid`** — setuid and setgid bits are ignored. A setuid binary on a nosuid mount can't elevate privileges. Important for shared volumes — you don't want a container to drop a setuid binary that the host later executes.

**`nodev`** — device files on this filesystem are non-functional. Prevents a container from creating device files (like `/dev/sda`) that could be used to access raw hardware.

**`ro`** — read-only. The filesystem can be read but not written. Config files that should never change get mounted read-only.

```bash
# bind mount with security options
mount --bind --options ro,noexec,nosuid /host/config /container/config
```

A container that mounts `/host/config` read-only can read the configuration but can't modify it or plant executables.

---

## tmpfs — memory as a filesystem

`tmpfs` is a filesystem that lives entirely in RAM. There's no disk backing. Reads and writes operate at memory speed. When the system reboots — or when the tmpfs is unmounted — everything in it disappears.

```bash
mount -t tmpfs tmpfs /tmp
```

This replaces `/tmp` with a memory-backed filesystem. Files written to `/tmp` never touch the disk. They're fast, they're private, and they vanish when the system restarts.

tmpfs has a size limit:

```bash
mount -t tmpfs -o size=256m tmpfs /tmp
```

If you write more than 256 MB, the write fails. The memory counts against the system's physical RAM (and swap if configured).

---

## Where tmpfs appears in practice

**`/tmp`** — most Linux systems mount `/tmp` as tmpfs. Temporary files don't persist across reboots, and disk I/O for truly temporary data is pointless overhead.

**`/dev/shm`** — shared memory for applications that use POSIX shared memory (`shm_open`). On Linux, `shm_open` is implemented as files in `/dev/shm`, which is always a tmpfs. Writing to `/dev/shm/mydata` is the same as allocating shared memory.

**Inside containers** — containers often get a tmpfs at `/tmp` and `/run`. Writes there are fast and don't accumulate in the container's overlayfs upper layer (which would grow without bound for log-heavy workloads).

---

## Read-only rootfs with writable overlays

The combination of bind mounts and tmpfs enables a clean container pattern:

1. Mount the rootfs read-only (prevent tampering)
2. Bind-mount a tmpfs at `/tmp` (fast temporary writes)
3. Bind-mount a tmpfs at `/run` (runtime state)
4. Bind-mount a host directory at `/data` (persistent storage)

The container can read everything, write only to `/tmp`, `/run`, and `/data`. The rootfs is immutable. This is more secure than overlayfs in some contexts — writes can only go to known, controlled locations.

---

## tiny-aws: the --volume flag

`tinyaws instance launch --volume /host/data:/mnt/data` tells the agent to bind-mount `/host/data` into the container at `/mnt/data`.

In `instances.rs`, the agent constructs the nspawn command with a `--bind` argument:

```rust
// instances.rs
for volume in &spec.volumes {
    let parts: Vec<&str> = volume.splitn(2, ':').collect();
    if parts.len() == 2 {
        cmd.arg(format!("--bind={}:{}", parts[0], parts[1]));
    }
}
```

`systemd-nspawn --bind=host_path:container_path` sets up the bind mount inside the container's mount namespace before starting the container. The container sees the host directory at the specified path. When the container is terminated, the bind mount is cleaned up automatically.

Without volumes, all container writes go into the overlayfs upper layer and disappear when the container exits. With a volume, data written to the bind-mounted path persists on the host — the container is gone, the data is not.

---

## The ephemeral instance problem

tiny-aws instance storage is ephemeral by design. The `MISSING.md` notes: "Instance filesystem is ephemeral overlayfs. On termination, all data is gone. No EBS equivalent."

The volume mechanism is the workaround: mount a host directory for anything you want to keep. But it requires planning at launch time and knowledge of where data will be written. The automatic, transparent persistence that EBS provides — your database just writes to disk and it persists — requires more infrastructure than tiny-aws implements.

This is one of the gaps between toy infrastructure and production infrastructure. Not a conceptual gap — bind mounts are how EBS works under the hood too — but an operational gap: EBS manages the host-side storage automatically across live migrations, snapshots, and hardware failures.

Next: the memory story — why processes can allocate more memory than the machine has, and what happens when they actually try to use it.
