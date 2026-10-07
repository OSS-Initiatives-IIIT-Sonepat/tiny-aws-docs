---
title: "Chapter 14: Signals"
description: "The kernel needs a way to poke a running process. Not to give it data — file descriptors handle that. To tell it something happened."
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-01-24"
---

The kernel needs a way to poke a running process. Not to give it data — file descriptors handle that. To tell it something happened.

The user pressed Ctrl-C. The child process it was waiting on exited. Someone asked it to reload its configuration. The network connection it was writing to broke. In each case, the kernel delivers a signal — a small integer that arrives asynchronously, interrupting whatever the process was doing.

Signals are the simplest form of inter-process communication. They carry no data, just a number. But that number triggers behavior that shapes how every process lives and dies.

---

## What a signal is

A signal is a notification delivered by the kernel to a process. The kernel delivers it — you can also send signals to other processes if you have permission, via the `kill(2)` syscall.

Each signal has a number and a name. The names start with `SIG`. The key ones:

| Signal | Number | Default action | Meaning |
|--------|--------|---------------|---------|
| `SIGHUP` | 1 | Terminate | Terminal closed, or: reload configuration |
| `SIGINT` | 2 | Terminate | Ctrl-C from the keyboard |
| `SIGQUIT` | 3 | Core dump | Ctrl-\ from the keyboard |
| `SIGKILL` | 9 | Terminate | Kill immediately, cannot be caught or ignored |
| `SIGTERM` | 15 | Terminate | Polite request to terminate |
| `SIGCHLD` | 17 | Ignore | A child process changed state (exited, stopped) |
| `SIGSTOP` | 19 | Stop | Pause execution, cannot be caught or ignored |
| `SIGCONT` | 18 | Continue | Resume a stopped process |
| `SIGPIPE` | 13 | Terminate | Write to a pipe with no reader |
| `SIGUSR1/2` | 10/12 | Terminate | User-defined — application decides what to do |

`kill -l` lists all signals on your system.

---

## Default actions

When a signal arrives, if the process hasn't registered a handler for it, the kernel applies the default action:

- **Terminate** — kill the process. No cleanup.
- **Core dump** — kill the process and write a core file containing its memory state for debugging.
- **Ignore** — silently discard the signal.
- **Stop** — pause the process. It can be resumed with `SIGCONT`.
- **Continue** — resume a stopped process.

Most signals default to Terminate. The process dies as if it had called `exit()` — but without any chance to run cleanup code first.

---

## Signal handlers

A process can override the default action for most signals by registering a handler — a function that runs when the signal arrives.

```c
#include <signal.h>

void handle_term(int sig) {
    // flush logs, close connections, release locks
    cleanup();
    exit(0);
}

int main() {
    signal(SIGTERM, handle_term);
    // ... run forever
}
```

When `SIGTERM` arrives, execution is interrupted wherever it was. The kernel saves the process's state, runs `handle_term`, and then resumes from where the process was interrupted (or the process calls `exit`).

Signal handlers have restrictions. They run in a signal-interrupted context, so they can only call "async-signal-safe" functions. `printf` is not safe — it uses locks internally and could deadlock if interrupted mid-lock. `write` is safe. `exit` is safe. Complex library calls generally are not.

The safe pattern: in the signal handler, set a flag. In the main loop, check the flag and do cleanup. Don't do complicated things inside the handler itself.

---

## Why SIGKILL cannot be caught or ignored

Two signals cannot be caught, ignored, or blocked by any process: `SIGKILL` (9) and `SIGSTOP` (19).

The kernel handles these entirely itself. When SIGKILL arrives, the kernel marks the process for immediate termination and removes it from the run queue. The process's code never runs again — there's no opportunity to catch it, no cleanup, no graceful exit. The kernel does all the cleanup itself: closes file descriptors, frees memory, notifies the parent.

This is intentional. If SIGKILL could be caught, a misbehaving process could ignore all signals and become impossible to kill. SIGKILL is the unconditional escape valve.

The consequence: you cannot write a SIGKILL handler. You cannot guarantee any code runs when SIGKILL arrives. Any resource that needs explicit cleanup — temporary files, lock files, database connections — must be managed by a supervisor that outlives the process, not by the process itself.

---

## The graceful shutdown pattern

The standard way to shut down a server:

```
1. Send SIGTERM — give the process a chance to shut down gracefully
2. Wait (10-30 seconds)
3. If still running, send SIGKILL — force termination
```

SIGTERM is a request. A well-written server catches SIGTERM, stops accepting new requests, finishes in-flight work, flushes writes, closes connections, then exits. Users don't see errors; work isn't lost.

SIGKILL is a demand. The process has no say. If it was in the middle of writing a file, that file may be partially written.

This two-step pattern is what `systemctl stop`, `docker stop`, Kubernetes pod deletion, and most process management systems use. The grace period (between SIGTERM and SIGKILL) is configurable — you set it based on how long your application reasonably needs to drain.

---

## Process groups and killing trees

A process group is a set of processes that share a PGID (process group ID). When you run a command in a shell, the shell puts it in its own process group. All the processes that command spawns share the same PGID.

The `kill` syscall can target a process group: a negative PID means "send to the entire process group."

```c
kill(-pgid, SIGTERM);  // sends SIGTERM to every process in the group
```

This is how you kill a whole process tree in one call. If you send `SIGTERM` to just the parent, children that don't exit on their own continue running. If you send to the process group, everyone gets it simultaneously.

In a shell, Ctrl-C delivers `SIGINT` to the foreground process group — not just the top-level process. That's why Ctrl-C kills a pipeline (`ls | grep | sort`) — all three processes are in the same process group.

Setting a new process group before exec:

```c
setpgid(0, 0);  // create a new process group, with the current process as leader
```

This is used when you want a child's process tree to be independently killable without affecting the parent's group.

---

## PID 1 and signal behavior

PID 1 has a special relationship with signals.

For most signals, if PID 1 has not installed a handler, the kernel ignores the signal entirely. The default action does not apply. `SIGTERM` to PID 1 with no handler does nothing. This protects the init process from accidental termination.

Inside a container, the container's PID 1 gets this same behavior. If your application runs as PID 1 (as it does when you `CMD ["python", "app.py"]` in Docker) and doesn't install a SIGTERM handler, sending SIGTERM to it does nothing. The only way to kill it is SIGKILL, which bypasses this rule because SIGKILL is handled entirely by the kernel.

This is the "PID 1 problem" for containers. The solution is either:
- Write a SIGTERM handler in your application
- Run a real init as PID 1 (systemd, tini, dumb-init) that handles SIGTERM and forwards it to your application
- Use process groups and kill the group instead

---

## tiny-aws: process groups and service stopping

When tiny-aws spawns a job or service, it puts the child in its own process group with `setpgid(0, 0)`. When the service needs to be stopped, it kills the entire process group:

```rust
// jobs.rs
unsafe { libc::setpgid(0, 0) };  // called in the child before exec

// in the stop handler:
unsafe { libc::kill(-(pgid as i32), libc::SIGTERM) };
```

The negative PID (`-pgid`) sends SIGTERM to every process in the group. If the process hasn't exited after a grace period, SIGKILL follows. The whole tree dies cleanly regardless of what the application did with signals internally.

This also means that even if a service spawns subprocesses that don't propagate SIGTERM, the group kill catches all of them.

Next: how a process carries configuration with it from parent to child — environment variables.
