---
title: "Chapter 12: Users, permissions, and capabilities"
description: "Every process runs as someone. That someone determines what the process is allowed to do."
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-01-22"
---

Every process runs as someone.

Chapter 7 mentioned that each process has a UID and a GID — user ID and group ID. It moved on. Now we need to understand what those numbers actually do, because they're the foundation of every access control decision the kernel makes, and they're the reason container security is harder than it looks.

---

## UIDs and GIDs

A UID is a number. Nothing more. The kernel doesn't care about names like "alice" or "root". Those names live in `/etc/passwd`, a text file that maps names to numbers. The kernel only sees the number.

Every file on the filesystem has two ownership fields baked into its inode: the UID of its owner and the GID of its group. Every process carries at least one of each: an effective UID and an effective GID that the kernel checks when the process tries to do something.

When a process opens a file, the kernel runs this check:

```
if effective UID == 0:
    allow (root bypasses permission checks)
elif effective UID == file's owner UID:
    apply owner permissions (rwx bits 6-4)
elif effective GID matches file's group GID:
    apply group permissions (rwx bits 3-1)
else:
    apply other permissions (rwx bits 0-2)
```

That's it. Three bits checked in order. The "everyone else" case is the `other` column in `ls -l`.

---

## File permissions

`ls -la` shows something like:

```
-rwxr-xr-- 1 alice dev 4096 Jan 12 10:00 server
drwxr-x--- 2 root  sys  140 Jan 12 10:00 config/
```

The first column is ten characters. The first character is the type: `-` for a regular file, `d` for a directory, `l` for a symlink, `b` for a block device, `c` for a character device.

The remaining nine are three groups of three: owner, group, other. Each group is `rwx` — read, write, execute. A `-` means the permission is not set.

So `rwxr-xr--` means:
- Owner (alice): read, write, execute
- Group (dev): read, execute
- Other: read only

For directories, the bits mean something different. `r` means you can list the directory. `w` means you can create or delete files inside it. `x` means you can traverse it — enter it and access files inside by name. A directory with `x` but not `r` means you can access files inside if you know their names, but can't list what's there.

`chmod` changes permissions. `chmod 755 server` sets `rwxr-xr-x`. `chmod 644 config.txt` sets `rw-r--r--`. The octal number is just the three rwx bits as a three-digit base-8 number: `7 = 111 = rwx`, `5 = 101 = r-x`, `4 = 100 = r--`.

`chown alice:dev server` sets ownership.

---

## UID 0 — root

UID 0 is special. The kernel bypasses the standard file permission check for processes running as UID 0. They can read any file, write any file, execute any file regardless of the permission bits. They can bind to ports below 1024. They can kill any process. They can mount filesystems, load kernel modules, change any file's ownership.

This is why "don't run as root" matters. A process running as UID 0 with full access to the host can undo every piece of isolation you've built. If a container process escapes its namespace and it's running as UID 0, it owns the machine.

---

## setuid and how sudo works

There's a problem. Some operations legitimately require elevated privileges even when run by an ordinary user. Changing your own password requires writing to `/etc/shadow`, which only root can write. Running a server on port 80 requires binding to a privileged port.

The solution is the setuid bit.

When a file has the setuid bit set, executing it causes the process to run with the file's *owner* UID, not the caller's UID. `/usr/bin/passwd` is owned by root and has the setuid bit set. When alice runs `passwd`, the process starts with effective UID 0, writes to `/etc/shadow`, then drops back to alice's UID. Alice never had root — the binary ran as root on her behalf.

`sudo` works similarly. It's a setuid binary owned by root. When you run `sudo`, the process gets UID 0. It checks `/etc/sudoers` to decide whether to let you proceed. If yes, it runs your command as root. You never had root — `sudo` made a controlled decision to grant temporary elevation.

```
# check what binaries have setuid bit set
find /usr/bin /usr/sbin -perm /4000
```

The setuid bit is a necessary escape valve in the Unix permission model, and a historical source of privilege escalation vulnerabilities. Any setuid binary is an attack surface.

---

## Linux capabilities — root broken into pieces

UID 0 is a binary switch: you either have all privileges or you don't. That's too coarse.

Linux capabilities divide root's privileges into about 40 discrete permissions. Instead of "you are root and can do everything," you get individual capabilities:

- `CAP_NET_BIND_SERVICE` — bind to ports below 1024
- `CAP_NET_ADMIN` — configure network interfaces, iptables rules
- `CAP_SYS_PTRACE` — trace other processes
- `CAP_KILL` — send signals to any process
- `CAP_SYS_ADMIN` — a catch-all for many admin operations (mount, sethostname, etc.)
- `CAP_CHOWN` — change file ownership arbitrarily
- `CAP_DAC_OVERRIDE` — bypass file permission checks (read/write anything)
- `CAP_SYS_MODULE` — load and unload kernel modules
- `CAP_SYS_REBOOT` — reboot the system

A process's capabilities are stored in its process descriptor alongside its UID. A process can have UID 0 but zero capabilities — it looks like root but can do almost nothing. A process can have UID 1000 (an ordinary user) but `CAP_NET_BIND_SERVICE` — it can't do anything root-specific except bind privileged ports.

```bash
# see capabilities of a running process
cat /proc/self/status | grep -i cap

# run a command with a specific capability
capsh --caps="cap_net_bind_service=eip" -- -c "python3 -m http.server 80"
```

Capabilities are inherited through `fork` and can be dropped before `exec`. A container runtime typically starts with full root capabilities, sets up the container, then drops most of them before the container's PID 1 runs. The container process runs as UID 0 but with a reduced capability set — it can do things that need some elevated privileges (bind ports, change ownership inside the container) but not things that affect the host (load modules, reboot, reconfigure iptables on the host).

---

## What capability stripping looks like in practice

A typical container drops these capabilities before starting user code:

```
CAP_SYS_MODULE     # can't load kernel modules
CAP_SYS_RAWIO      # can't access raw hardware
CAP_SYS_PTRACE     # can't trace processes outside the namespace
CAP_SYS_REBOOT     # can't reboot
CAP_NET_ADMIN      # can't reconfigure networking globally
CAP_SYS_ADMIN      # the big one — restricted
```

It keeps:
```
CAP_CHOWN          # needed to set file ownership in the rootfs
CAP_DAC_OVERRIDE   # needed for installs and builds
CAP_NET_BIND_SERVICE  # needed to run web servers on ports < 1024
CAP_KILL           # needed to manage child processes
```

This is why containers can generally do what applications need but can't reach out and damage the host — even when running as UID 0.

---

## tiny-aws's approach

tiny-aws runs the ec2-agent as root on the host. It doesn't use user namespaces and doesn't strip capabilities before running containers. Both of these are acknowledged in `MISSING.md`.

The practical consequence: a container process that finds a kernel exploit gets full root on the host. The namespace and rootfs isolation is real and effective against normal code — it's the capability stripping and user namespace remapping that would protect against a container that's actively trying to escape.

This is the difference between tiny-aws and AWS's Nitro. Nitro enforces isolation at the hardware level. tiny-aws enforces it in software, in the same kernel that the container is also running in.

Next: how processes communicate with the world — file descriptors, pipes, and I/O redirection.
