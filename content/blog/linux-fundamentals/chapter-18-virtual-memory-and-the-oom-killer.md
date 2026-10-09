---
title: "Chapter 18: Virtual memory and the OOM killer"
description: "A process asks for memory. The kernel says yes — immediately, even if the RAM isn't there yet. This is the deal at the center of modern operating systems."
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-01-28"
---

A process asks for memory. The kernel says yes — immediately, even if the RAM isn't there yet.

This is the deal at the center of modern operating systems. It enables programs to run on machines with less RAM than they nominally need. It makes `fork` nearly instant regardless of the parent's size. It lets processes safely address enormous amounts of memory without the kernel having to provide all of it upfront.

But it creates an accounting problem. When the machine genuinely runs out of memory, something has to give. The mechanism that decides what gives is the OOM killer — and understanding it is essential for anyone running containers with memory limits.

---

## Physical versus virtual memory

Physical memory is RAM — the actual chips. On a 16 GB machine, there are 16 GB of physical addresses the CPU can read and write.

Virtual memory is an illusion. Each process gets its own virtual address space — a private range of addresses that looks, from the process's perspective, like it has the machine to itself. A process on a 16 GB machine might have a 128 GB virtual address space. It doesn't actually have 128 GB — it has a private *view* of up to 128 GB.

The CPU has hardware — the Memory Management Unit (MMU) — that translates virtual addresses to physical addresses on every memory access. The translation table is called a page table. The kernel sets up and manages page tables; the MMU uses them automatically.

When a process reads or writes a virtual address, the MMU looks it up in the page table. If the virtual address maps to a physical page, the access proceeds. If it doesn't map to anything — if the process tries to access memory it hasn't been given — the MMU triggers a page fault, and the kernel decides what to do.

---

## Pages

Memory is managed in fixed-size chunks called pages. On x86-64, a page is 4096 bytes (4 KB). Every allocation, every stack frame, every `mmap` region is rounded up to a multiple of pages.

The kernel tracks which physical pages are in use, which are free, and which process's virtual address maps to which physical page.

When a process calls `malloc(1024)`, the C library may already have free pages to carve from, or it asks the kernel for more virtual space via `mmap` or `brk`. The kernel grants the virtual space immediately — it sets up the mapping in the page table — but doesn't necessarily allocate physical pages yet.

---

## Memory overcommit

The kernel's memory overcommit policy is: promise more than you have.

When the kernel grants a virtual address range, it often doesn't back it with physical RAM immediately. The physical page is only allocated when the process first writes to the address. This is called demand paging.

The consequence: a process can `malloc(10GB)` on a 16 GB machine, and the allocation succeeds immediately — the kernel just set up a virtual mapping. The process has the addresses. If it later writes to all 10 GB, the kernel will need to find physical pages for all of it. Until it actually writes, the physical RAM isn't consumed.

This enables:
- Programs that allocate worst-case buffers but use far less in practice
- Container images that pre-allocate pools they rarely fill
- Fork-based server models (Apache-style) where each worker fork seems to have a full copy of parent memory but actually shares pages via copy-on-write

Overcommit is configurable via `/proc/sys/vm/overcommit_memory`. `0` = heuristic, `1` = always overcommit, `2` = never overcommit. Most systems use `0` or `1`.

---

## Copy-on-write and why fork is cheap

Chapter 7 mentioned `fork` creates a copy of the parent process. But if a parent has 2 GB of memory, copying it for the child would take seconds and require 2 GB of free RAM. That would make `fork` unusable.

The solution: the kernel doesn't copy the memory on fork. It marks all of the parent's pages as copy-on-write in both parent and child page tables. Both processes map the same physical pages, but the pages are marked read-only.

When either process writes to one of these shared pages, the MMU triggers a page fault (the write hit a read-only page). The kernel catches this, allocates a new physical page, copies the old page's content into the new page, updates the writing process's page table to point to the new page, and lets the write proceed.

Only the pages that are actually written to get copied. Pages that are only read — and most of a large process's memory is only read — are shared between parent and child indefinitely.

This is why `fork` is nearly instant regardless of the parent's size: it just sets up page table entries and marks them read-only. No data copying.

---

## The page cache

When a process reads a file from disk, the kernel copies the file data into physical pages. But it doesn't discard those pages when the `read()` call finishes. It keeps them in the page cache.

The next time any process reads the same file, the kernel serves it from the page cache — memory speed, no disk I/O. On a server that reads the same config files repeatedly, the page cache makes those reads effectively free.

The page cache is counted in cgroup memory accounting. If a container reads a 500 MB file, the cgroup's memory usage goes up by roughly 500 MB — even if the container hasn't `malloc`'d anything. This surprises people.

```bash
# memory statistics in a cgroup
cat /sys/fs/cgroup/tinyaws/job-42/memory.stat
# anon 10485760        ← actual malloc'd memory
# file 524288000       ← page cache from file reads
# ...
```

`memory.max` limits the total — anonymous plus page cache. If your container reads large files while also allocating heap memory, it can hit `memory.max` not from allocations but from the page cache filling up.

---

## The OOM killer

When a cgroup hits `memory.max`, the kernel needs to reclaim memory. If it can free page cache (evict cached pages — they can be re-read from disk), it does. If there's nothing to evict, it invokes the OOM killer.

The OOM killer picks a process inside the cgroup and kills it with SIGKILL. Its selection algorithm scores processes by a combination of:
- Memory usage (larger = more likely to free memory)
- Time running (newer processes are cheaper to kill)
- `oom_score_adj` (a per-process adjustment you can set)

The killed process receives SIGKILL — no cleanup, no warning, no handler. From the container's perspective, a process just dies. If it was PID 1 of the container, the container exits. If it was a worker process, it's gone and the rest of the container keeps running.

```bash
# adjust OOM score: -1000 = never kill, +1000 = kill me first
echo -1000 > /proc/<pid>/oom_score_adj
```

The OOM kill event is logged in the kernel journal:

```
kernel: Out of memory: Killed process 4382 (python3) total-vm:2048MB, rss:512MB
```

---

## memory.high vs memory.max

Chapter 9 mentioned both. The distinction matters:

`memory.high` is a soft limit. When the cgroup's usage exceeds this, the kernel throttles memory allocations and aggressively reclaims page cache. The processes slow down. They don't die. This is the "warning before kill" threshold.

`memory.max` is the hard limit. When this is exceeded and the kernel can't reclaim enough memory, the OOM killer fires.

Setting both gives you graceful degradation:

```
memory.high = 400M   # start reclaiming aggressively at 400 MB
memory.max  = 512M   # kill something if we hit 512 MB
```

Between 400 MB and 512 MB, the container slows down but stays alive. The application might notice increased latency from memory pressure. Above 512 MB, a process dies.

---

## tiny-aws: instance types as memory budgets

The instance types in tiny-aws are named memory budgets:

```go
// instances.go
"nano":   {"25%",  128},
"micro":  {"50%",  256},
"small":  {"100%", 512},
"medium": {"200%", 1024},
"large":  {"400%", 2048},
```

The second number is `mem_limit_mb`. In `sandbox.rs`, this becomes:

```rust
let mem_bytes = mem_limit_mb * 1024 * 1024;
std::fs::write(format!("{}/memory.max", cgroup_path), mem_bytes.to_string())?;
```

A `nano` instance gets `memory.max = 134217728` (128 MB). A `large` gets `2147483648` (2 GB). When the container crosses the line, the OOM killer fires. The exit is silent from the container's perspective — a process just disappears. From the host's logs, you see the kernel's OOM message.

This is why sizing containers matters. Not as a billing abstraction but as a real memory budget. Undersized containers die mysteriously under load. Oversized containers waste RAM on the host that other tenants could use.

Next: PID 1 in practice — the init system that manages every other process on the machine.
