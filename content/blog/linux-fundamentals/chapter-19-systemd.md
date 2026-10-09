---
title: "Chapter 19: systemd — PID 1 at scale"
description: "PID 1 starts. Everything else descends from it. On modern Linux, PID 1 is systemd — an init system that manages services, mounts, timers, and the entire lifecycle of the machine."
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-01-29"
---

PID 1 starts. Everything else descends from it.

Chapter 7 established that PID 1 is the ancestor of every process on the machine, and that it has special signal behavior and the responsibility to reap orphaned processes. But we didn't talk about what PID 1 actually does for the rest of its life — and on almost every modern Linux system, PID 1 is `systemd`.

systemd is more than just a program launcher. It's an event-driven process manager that handles the entire lifecycle of every service on the machine, from startup through shutdown. Understanding it is essential because tiny-aws runs as a systemd service, and its instances use `systemd-nspawn` — systemd's own container runtime.

---

## Why the old init wasn't enough

The original Unix init ran scripts sequentially. To start the network, then the database, then the web server, you wrote shell scripts that ran in order. This had problems:

- **No parallelism.** Scripts ran one after another. The database waited for the network even if it didn't need it. On modern hardware with many independent services, sequential startup is slow.
- **No dependency tracking.** If the database started before the network was configured, it failed. The fix was `sleep 5` — wait and hope.
- **No supervision.** If a service crashed, it stayed dead. Someone had to notice and restart it.
- **No logging infrastructure.** Each service wrote to its own log file in its own format, or got lost.

systemd addresses all of these. It starts services in parallel where possible, declares dependencies explicitly, automatically restarts failed services, and captures all output into a structured journal.

---

## Units

Everything in systemd is a unit. A unit is a configuration file that describes something systemd manages. The type of unit is determined by the file's extension.

**`.service`** — a daemon or process to run. The most common type.
**`.timer`** — a cron-like scheduled task.
**`.mount`** — a filesystem to mount.
**`.socket`** — a socket to listen on (for socket activation).
**`.target`** — a synchronization point with no action of its own, just dependencies.

Units live in several directories:
- `/lib/systemd/system/` — provided by packages
- `/etc/systemd/system/` — local configuration, overrides packages
- `~/.config/systemd/user/` — per-user units

---

## Anatomy of a service unit

```ini
[Unit]
Description=My Web Server
After=network.target
Requires=postgresql.service

[Service]
Type=simple
User=webserver
WorkingDirectory=/opt/myapp
ExecStart=/opt/myapp/server --port 8080
Restart=on-failure
RestartSec=5s
Environment=NODE_ENV=production
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

**`[Unit]`** — metadata and ordering:
- `Description` — human-readable label shown in status output
- `After=network.target` — start this unit after `network.target` is reached (network is available)
- `Requires=postgresql.service` — this unit cannot run without PostgreSQL; if PostgreSQL fails, this unit stops too

**`[Service]`** — how to run the service:
- `Type=simple` — the process started by `ExecStart` is the service. Other types: `forking` (process forks and parent exits), `oneshot` (runs once and exits)
- `User=webserver` — run as this user, not root
- `ExecStart` — the command to run
- `Restart=on-failure` — if the process exits with a non-zero code, restart it after `RestartSec`
- `Environment` — environment variables for the process
- `StandardOutput/Error=journal` — capture output into the systemd journal

**`[Install]`** — when does this unit start:
- `WantedBy=multi-user.target` — enable this unit when the system reaches the multi-user state (normal operation). This is how `systemctl enable` works — it creates a symlink so this unit gets started as part of `multi-user.target`.

---

## Targets — the checkpoints

A target is a named state the system can be in. Targets have no exec section — they're just a collection of dependencies.

Common targets:

- `sysinit.target` — early system initialization complete
- `basic.target` — basic system running (logging, sockets, timers)
- `network.target` — network configured
- `multi-user.target` — normal multi-user operation (everything you'd want for a server)
- `graphical.target` — multi-user plus display manager

When you boot, systemd reaches `default.target` (usually symlinked to `multi-user.target` on servers). To reach it, it starts all units that `WantedBy` that target. Each unit declares its `After=` and `Requires=` dependencies. systemd builds a dependency graph and starts units in parallel where possible.

---

## systemctl — controlling units

```bash
systemctl start   nginx      # start right now
systemctl stop    nginx      # stop right now
systemctl restart nginx      # stop, then start
systemctl reload  nginx      # ask the service to reload its config (SIGHUP)
systemctl enable  nginx      # create symlink so it starts on boot
systemctl disable nginx      # remove symlink
systemctl status  nginx      # show state, recent log lines, PID

systemctl list-units                    # all loaded units
systemctl list-units --failed           # units that have failed
systemctl daemon-reload                 # re-read unit files after editing
```

`systemctl status nginx` shows:
```
● nginx.service - A high performance web server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled)
     Active: active (running) since Tue 2026-01-14 10:30:00 UTC; 3h ago
    Process: 1234 ExecStartPre=...
   Main PID: 1235 (nginx)
      Tasks: 5 (limit: 4915)
     Memory: 12.3M
        CPU: 2.154s
     CGroup: /system.slice/nginx.service
             ├─1235 nginx: master process /usr/sbin/nginx
             └─1236 nginx: worker process
```

The cgroup information at the bottom shows where systemd placed the service in the cgroup hierarchy — and what processes are in it.

---

## journalctl — structured logging

systemd captures stdout and stderr from all services into the journal — a binary, indexed log store. Unlike log files scattered in `/var/log`, the journal is queryable.

```bash
journalctl -u nginx                      # all logs for nginx
journalctl -u nginx -n 50               # last 50 lines
journalctl -u nginx -f                  # follow (like tail -f)
journalctl -u nginx --since "1 hour ago"
journalctl -u nginx --until "2026-01-14 12:00"
journalctl -p err -u nginx              # only errors
journalctl -b                           # logs from the current boot
journalctl -k                           # kernel messages only
```

Every log entry has metadata: timestamp, hostname, unit name, PID, severity level. You can filter on any of them. You don't need to grep files.

---

## systemd-run — transient units

Sometimes you want to run a command with systemd's cgroup management and restart capabilities, but you don't want to write a unit file. `systemd-run` creates a transient unit on the fly:

```bash
systemd-run --unit=myserver \
    --property=CPUQuota=200% \
    --property=MemoryMax=512M \
    --property=Restart=on-failure \
    /opt/myapp/server
```

This starts `/opt/myapp/server` as a transient service named `myserver`, with resource limits enforced by cgroups. `systemctl status myserver` shows it. `journalctl -u myserver` shows its logs. When the process exits, the transient unit is automatically cleaned up.

This is how tiny-aws enforces resource limits on instances. `systemd-run` handles the cgroup creation and the resource limit configuration — tiny-aws just passes the right `--property` flags.

---

## tiny-aws as a systemd service

After building tiny-aws, you can install it as a persistent service:

```bash
sudo cp scripts/tinyaws.service /etc/systemd/system/
sudo systemctl enable --now tinyaws
```

The unit file in `scripts/tinyaws.service` looks approximately like:

```ini
[Unit]
Description=tiny-aws cloud platform
After=network.target
Wants=network.target

[Service]
Type=forking
WorkingDirectory=/opt/tiny-aws
ExecStart=/opt/tiny-aws/scripts/tinyaws-start.sh
ExecStop=/opt/tiny-aws/scripts/tinyaws-stop.sh
Restart=on-failure
RestartSec=10s

[Install]
WantedBy=multi-user.target
```

On boot, systemd waits for the network, then runs `tinyaws-start.sh`, which starts all the services. If any part crashes, systemd can restart it. Logs from all the services appear in `journalctl -u tinyaws`.

Without systemd, keeping twelve services running across reboots and machine restarts requires custom monitoring, startup scripts, and log management. systemd handles all of it.

Next: systemd's container runtime — the tool that uses everything we've learned to create real isolated Linux instances.
