---
title: "Chapter 11: seccomp"
description: "We've built up a solid wall around a container."
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-01-12"
---

We've built up a solid wall around a container.

Its own PID namespace — can't see other processes. Its own mount namespace with a private root filesystem — can't see the host's files. Its own network namespace — can't see the host's network traffic. A cgroup with hard memory and CPU limits — can't starve the host.

But the container's code still talks to the kernel. Every file open, every socket connection, every memory allocation goes through a syscall. And the syscall interface is enormous — Linux has around 350 syscalls. Most of them are fine. A handful can cause real damage regardless of what namespaces you're in.

`reboot(2)` reboots the machine. Namespaces don't help — reboot is a physical operation. `kexec_load(2)` loads a new kernel image into memory, ready to replace the running kernel on the next boot or immediately. `init_module(2)` loads a kernel module — arbitrary code into kernel space, the highest privilege level on the system.

A container that can call these syscalls is not really isolated. It's a process with decorations.

seccomp — secure computing mode — is how you restrict the syscall surface.

---

## How seccomp works

seccomp is a kernel feature that lets you attach a filter to a process. The filter is a BPF (Berkeley Packet Filter) program — a small bytecode program that the kernel executes for every syscall the process makes. The filter inspects the syscall number and arguments and returns a decision: allow, kill, return an error, or notify a supervisor.

The filter is set with the `prctl(2)` syscall or with `seccomp(2)` directly. Once set, it cannot be removed — not even by root. Not even by the process itself. It's a one-way door.

Filters are composable. If a process sets a filter and then forks, the child inherits the filter. If the child tries to set a new filter, it can only add further restrictions — it cannot relax the existing one. This is important for container runtimes: the runtime can set a restrictive filter before executing untrusted code, and the untrusted code cannot undo it.

---

## Two modes

**Strict mode** was the original seccomp. A process in strict mode can only call four syscalls: `read`, `write`, `exit`, and `sigreturn`. Anything else results in the process being killed with SIGKILL. This is extremely restrictive — useful for very specific sandboxing scenarios, not for general container use.

**Filter mode** — added later — is what containers use. You provide a BPF program that makes per-syscall decisions. The common approach is either an allowlist (only permit listed syscalls, kill on anything else) or a denylist (permit everything, kill on specific dangerous calls).

---

## tiny-aws's seccomp policy

tiny-aws uses a denylist approach, defined in `seccomp-default.json`:

```json
{
  "defaultAction": "SCMP_ACT_ALLOW",
  "syscalls": [
    {
      "names": [
        "reboot",
        "kexec_load",
        "kexec_file_load",
        "init_module",
        "finit_module",
        "delete_module",
        "acct",
        "mount",
        "umount2",
        "swapon",
        "swapoff",
        "pivot_root",
        "sethostname",
        "setdomainname",
        "iopl",
        "ioperm",
        "create_module",
        "query_module",
        "ptrace",
        "process_vm_readv",
        "process_vm_writev"
      ],
      "action": "SCMP_ACT_ERRNO"
    }
  ]
}
```

`SCMP_ACT_ALLOW` as the default means: allow everything not listed. `SCMP_ACT_ERRNO` means: return an error code (EPERM) instead of killing the process. The process gets a permission denied error, not a crash. This is more debuggable than SIGKILL — at least the application can log that a syscall failed.

The blocked syscalls fall into a few categories:

**Kernel modification**: `init_module`, `finit_module`, `delete_module` — loading and unloading kernel modules. A loaded kernel module runs in kernel space with full privileges.

**Boot/power control**: `reboot`, `kexec_load`, `kexec_file_load` — rebooting the machine or replacing the kernel.

**Dangerous I/O**: `iopl`, `ioperm` — direct hardware I/O port access. On x86, these let code talk directly to hardware without going through the kernel's device abstraction.

**Mount operations**: `mount`, `umount2`, `pivot_root`, `swapon`, `swapoff` — modifying the filesystem hierarchy or swap space. Blocked to prevent container code from messing with the host's mounts. (The container runtime performs these operations before the seccomp filter is applied.)

**Hostname**: `sethostname`, `setdomainname` — changing the system hostname. The container's UTS namespace handles this; direct syscalls are blocked as a defense in depth.

**Process inspection**: `ptrace`, `process_vm_readv`, `process_vm_writev` — reading and writing another process's memory. `ptrace` is the syscall that debuggers use. Inside a container, there's no legitimate reason to ptrace host processes, and these calls can be used to steal memory contents from other containers on the same host.

**Legacy interfaces**: `acct`, `create_module`, `query_module` — obsolete or admin-only interfaces with no use in container code.

---

## The limits of tiny-aws's policy

The default action is `SCMP_ACT_ALLOW`. This is a denylist. Denylist-based seccomp is weaker than allowlist-based seccomp.

The Linux syscall surface is large. New syscalls get added. An allowlist policy only permits syscalls that were explicitly reviewed and approved; anything new is blocked by default. A denylist policy permits everything that wasn't explicitly blocked; a new dangerous syscall is automatically permitted until someone adds it to the list.

Production container runtimes — Docker, containerd, gVisor — use allowlists. They maintain a curated list of ~150-200 syscalls that normal applications need and block everything else. Maintaining that list requires understanding every syscall a typical application might need, which is non-trivial work.

tiny-aws uses a denylist because it's simpler to read and understand. It's educational — you can look at the list and understand exactly what's being prevented and why. It's acknowledged in `MISSING.md` as a known gap: the right move for production would be an allowlist.

---

## How it's applied

tiny-aws applies the seccomp profile to `systemd-nspawn` instances via the `--seccomp-profile=` flag:

```rust
fn nspawn_seccomp_args(seccomp_path: &str) -> Vec<String> {
    vec![format!("--seccomp-profile={}", seccomp_path)]
}
```

`systemd-nspawn` reads the JSON profile and applies it before executing anything inside the container. The profile path is resolved in order: `TINYAWS_SECCOMP_PROFILE` environment variable, next to the binary, `/etc/tinyaws/seccomp-default.json`.

For raw job sandboxing (without a full rootfs), tiny-aws currently relies on the namespace isolation without seccomp — another gap noted in `MISSING.md`.

---

## The full picture

Stack it all up:

| Layer | Mechanism | What it prevents |
|-------|-----------|-----------------|
| Process visibility | PID namespace | Seeing / signaling other processes |
| Filesystem visibility | Mount namespace + overlayfs + pivot_root | Accessing host files |
| Network visibility | Network namespace | Seeing host network traffic, port conflicts |
| Resource consumption | cgroups v2 | Starving the host of CPU/memory |
| Dangerous syscalls | seccomp | Rebooting, loading modules, ptrace |
| Hostname isolation | UTS namespace | Changing the host's hostname |
| IPC isolation | IPC namespace | Interfering with host shared memory |

Each layer catches a different attack surface. None of them alone is sufficient. Together they make a container that behaves like an isolated machine for all practical purposes — even though the host kernel is shared.

This is the foundation everything else is built on. Next chapter, we open `sandbox.rs` and see how tiny-aws assembles all of this in about 250 lines of Rust.
