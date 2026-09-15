---
title: "Lambda vs Lambda"
description: "Firecracker microVMs vs a Go scheduler job. Both run your function. One takes 200ms cold, the other takes however long unzip takes."
author: "tiny-aws team"
date: "2026-09-13"
---

## How AWS Lambda does it

AWS Lambda runs your function in a Firecracker microVM that boots in ~125ms.
Each invocation gets its own isolated environment. The runtime handles
downloading your code, setting up the language environment, and routing the
event to your handler.

Cold starts are the time to boot a new microVM and load your code. Warm starts
reuse an existing one — already booted, already loaded — and take ~1ms.
AWS keeps containers warm in a pool after invocations.

Lambda supports Python, Node.js, Java, C#, Go, Ruby, and custom runtimes. It
scales automatically from zero to thousands of concurrent invocations. You pay
per 1ms of compute time, billed in 1ms increments.

The "serverless" in Lambda means you never manage servers, instances, or
capacity. You deploy a function, Lambda figures out where to run it.

## How tiny-aws does it

Lambda in tiny-aws (~236 lines of Go) stores function metadata in SQLite. When
you invoke a function:

1. It builds a shell command: download zip from object store, extract, run handler
2. That command is submitted to the scheduler as a job
3. The scheduler picks a healthy agent
4. The agent downloads the zip, extracts to a temp directory
5. It runs your handler with the event passed as an environment variable

No microVM. No warm containers. Every invocation downloads and extracts fresh.
The event and handler are passed as env vars (not shell interpolation — that
was a shell injection vulnerability that got fixed in an early commit).

## The numbers

| | AWS Lambda | tiny-aws Lambda |
|---|---|---|
| Isolation | Firecracker microVM | Agent process (optionally sandboxed) |
| Cold start | ~200ms | Download + unzip time (seconds) |
| Warm start | ~1ms | Not supported (always cold) |
| Runtimes | Python, Node, Java, C#, Go, Ruby, custom | Python 3, Node 20 |
| Concurrency | 1,000+ (auto-scaling) | 1 (one agent job at a time) |
| Max duration | 15 minutes | JOB_TIMEOUT_SECS (default 3600) |
| Memory | 128 MB - 10 GB | No limit (host memory) |
| Layers | Yes (shared dependencies) | No |
| Triggers | API GW, S3, SQS, SNS, DynamoDB, 100+ | Manual invoke only |
| Cost | $0.20 per 1M invocations + $0.0000166667/GB-s | Free |
| Implementation | Firecracker + proprietary platform | ~236 lines of Go |

## What "serverless" actually means

This comparison makes "serverless" concrete. In tiny-aws's Lambda:
- There IS a server (the agent machine)
- There IS a process that runs your code
- There IS a scheduler that picks the server

"Serverless" means you don't manage those things. The server exists — you just
don't see it. tiny-aws makes the server visible, which is the whole point.

Once you understand that Lambda is "download zip, run code in isolated env,
return result," the AWS version stops being magic. It's just a much faster,
more isolated, infinitely-scalable version of the same idea.
