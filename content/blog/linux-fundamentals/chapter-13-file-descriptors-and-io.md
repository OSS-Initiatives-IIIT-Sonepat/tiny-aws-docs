---
title: "Chapter 13: File descriptors and I/O"
description: "A process communicates with the world through a small set of numbered slots. Everything — files, sockets, pipes, terminals — is one of these slots."
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-01-23"
---

A process communicates with the world through a small set of numbered slots.

Not through file paths. Not through device names. Through integers — 0, 1, 2, 3, 4. These are file descriptors.

Every I/O operation a process performs goes through a file descriptor. Reading from a file. Writing to the network. Talking to a terminal. Receiving a signal from a pipe. Underneath, it's always the same four syscalls operating on an integer.

---

## What a file descriptor is

When a process opens a file — any file — the kernel creates an entry in the process's file descriptor table and returns the lowest available integer. That integer is the file descriptor. From that point on, the process uses the integer, not the path.

The process descriptor table is private to each process. FD 3 in one process has nothing to do with FD 3 in another process.

The four syscalls that operate on file descriptors:

```
open(path, flags)  → returns an fd
read(fd, buf, n)   → reads up to n bytes from fd into buf
write(fd, buf, n)  → writes n bytes from buf to fd
close(fd)          → releases the fd
```

That's the entire I/O interface. Everything else is built on these four.

---

## stdin, stdout, stderr

Three file descriptors are opened for every process before it starts:

- **0** — standard input. The process reads here to receive input.
- **1** — standard output. The process writes here to produce output.
- **2** — standard error. The process writes here to report errors.

When you run a command in a shell, FDs 0, 1, and 2 are connected to your terminal. Typing sends bytes into FD 0. `printf("hello\n")` writes to FD 1 and appears on screen. `fprintf(stderr, "error\n")` writes to FD 2 and also appears on screen (until you redirect it).

These numbers are just a convention. The kernel doesn't treat them specially after the process starts — you can close FD 1 and reopen it pointed at a file, and `printf` will then write to that file instead of the screen. The C library uses the numbers 0, 1, 2. The kernel doesn't care.

---

## Files, sockets, pipes — all file descriptors

This is the Unix philosophy made concrete. "Everything is a file" means: everything is accessible through the same fd / read / write interface.

- Opening a regular file: `open("/etc/hosts", O_RDONLY)` → returns fd 3
- Creating a network socket: `socket(AF_INET, SOCK_STREAM, 0)` → returns fd 3
- Creating a pipe: `pipe(fds)` → fills fds[0] (read end) and fds[1] (write end) with two fds
- Opening a terminal device: fd 0, 1, 2 as described above

Once you have an fd, you don't need to know what's underneath. `read(fd, buf, n)` works on all of them. The kernel dispatches to the right handler based on what the fd points at — a file system, a network stack, a pipe buffer.

This uniformity is why tools like `cat`, `grep`, and `wc` can process files, network streams, and pipe output without caring which one they're dealing with.

---

## FD inheritance through fork

When a process calls `fork`, the child receives a copy of the parent's file descriptor table. Every fd the parent had open, the child has open — pointing to the same underlying kernel objects.

This is how shells implement pipes. When you run `ls | grep txt`:

1. The shell calls `pipe(fds)` to create a pipe. `fds[0]` is the read end, `fds[1]` is the write end.
2. The shell forks twice.
3. In the first child (ls): closes `fds[0]`, then `dup2(fds[1], 1)` — this replaces FD 1 (stdout) with the write end of the pipe. Then `exec("ls")`.
4. In the second child (grep): closes `fds[1]`, then `dup2(fds[0], 0)` — this replaces FD 0 (stdin) with the read end of the pipe. Then `exec("grep txt")`.
5. Both children now share the pipe. ls writes to its stdout, which is the pipe's write end. grep reads from its stdin, which is the pipe's read end. Data flows.

The `dup2(old_fd, new_fd)` syscall is the mechanism behind all I/O redirection. `> file` is: open the file, get an fd, `dup2` it onto FD 1. Now stdout points at the file.

---

## Pipes at the kernel level

A pipe is a kernel buffer — typically 64KB. One end is write-only, the other is read-only.

```
writer → [kernel buffer, 64KB] → reader
```

Write to the write end: bytes go into the buffer. If the buffer is full, the write blocks until the reader consumes some. Read from the read end: bytes come out in order. If the buffer is empty, the read blocks until the writer puts something in.

This back-pressure mechanism is automatic. You don't have to manage it. If `grep` is slow and `ls` is fast, the pipe's buffer fills up and `ls` pauses. When `grep` catches up, `ls` continues.

When the write end is closed and the buffer is empty, the reader gets EOF. When the read end is closed and the writer tries to write, the writer receives `SIGPIPE` — a signal that says "no one is reading, stop trying."

---

## Redirects and what they actually are

```bash
command > output.txt        # write stdout to a file
command 2> error.txt        # write stderr to a file
command > out.txt 2>&1      # write both stdout and stderr to a file
command < input.txt         # read stdin from a file
command1 | command2         # pipe stdout of 1 into stdin of 2
```

All of these are FD manipulation before exec:

- `> file` opens the file for writing and `dup2`s the result onto FD 1
- `2>` does the same for FD 2
- `2>&1` copies the current FD 1 onto FD 2 — both point to the same thing
- `< file` opens the file for reading and `dup2`s onto FD 0
- `|` creates a pipe and sets up the two FDs as described above

Nothing magic. Just integer manipulation before the program starts.

---

## /proc/self/fd — seeing what you have open

The kernel exposes each process's open file descriptors as symlinks under `/proc/<pid>/fd/`. Each symlink's target is a description of what the fd points at.

```bash
ls -la /proc/self/fd
# 0 → /dev/pts/0    (terminal)
# 1 → /dev/pts/0    (terminal)
# 2 → /dev/pts/0    (terminal)

ls -la /proc/1234/fd  # inspect another process
```

For files, the symlink target is the file path. For sockets, it shows `socket:[12345]` — an inode number you can look up in `/proc/net/tcp`. For pipes, it shows `pipe:[12345]`.

This is how you debug "why won't this process exit" — check if it has file descriptors still open from a parent that it's waiting on.

---

## FD leak — the quiet bug

When a parent forks and doesn't close file descriptors before exec, the child inherits them. If the child doesn't know about them, it doesn't close them. This is a file descriptor leak.

The common version: a server opens a socket, forks a child to handle a request, the child exec's a helper program. The helper inherits the listening socket. If the server closes its socket and tries to restart, the bind fails — "address already in use" — because the helper is still holding the socket open.

The fix: use `FD_CLOEXEC` when opening fds, or explicitly close all inherited fds before exec. Modern code uses `SOCK_CLOEXEC` and `O_CLOEXEC` flags to mark fds as "close on exec" at creation time.

---

## tiny-aws: how service logs are captured

When tiny-aws deploys a service job, the agent spawns the process with its stdout and stderr piped:

```rust
// jobs.rs
let log_path = workspace.join("service.log");
let log_file = std::fs::File::create(&log_path)?;
let stdout = Stdio::from(log_file.try_clone()?);
let stderr = Stdio::from(log_file);

let child = Command::new(&prog)
    .args(&args)
    .stdout(stdout)
    .stderr(stderr)
    .spawn()?;
```

`Stdio::from(file)` is exactly `dup2(file_fd, 1)` and `dup2(file_fd, 2)` before exec. The service process's stdout and stderr are both redirected into `service.log`. The process doesn't know or care. It just writes to FD 1 and FD 2 as always.

The agent then periodically reads `service.log` and uploads it to the object store so `tinyaws service logs` can retrieve it from anywhere.

Next: the other half of process communication — signals. If file descriptors are the process's interface with data, signals are the kernel's interface with the process itself.
