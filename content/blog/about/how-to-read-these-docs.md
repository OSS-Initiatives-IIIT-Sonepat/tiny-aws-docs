---
title: "How to Read These Docs"
description: "How the Tiny-AWS docs are organized, what order to read them in, and what each section assumes you already know."
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-01-01"
---

## How the series is organized
These docs are written as a sequence, not a reference manual. Each chapter builds on the one before it. Start with **About** — especially [What is Tiny-AWS?](/about/what-is-tiny-aws) — to understand why the project exists and what you are trying to learn. Then read **Linux Fundamentals** in order. Those chapters explain the kernel primitives — namespaces, cgroups, filesystems, processes — that make container isolation possible. After that, read **Networking Fundamentals**. Those chapters explain how packets move, how routing works, and how Linux builds virtual networks with bridges and veth pairs. Finally, read **Building the Cloud**. Those chapters walk through the actual tiny-aws system — every service, every file — from architecture to Kubernetes.
## What to expect in each chapter
Every post follows the same shape:
- A short introduction that states the problem in plain language
- `##` sections that walk through the idea step by step
- Concrete commands, diagrams, or code where they help
- A closing section that connects the idea back to Tiny-AWS
You do not need to memorize everything. The goal is to understand the mechanism well enough that when you open the Tiny-AWS source code, the pieces look familiar instead of magical.
## How to use the code
When a chapter mentions a Tiny-AWS file — `networking.rs`, `sandbox.rs`, and so on — open it alongside the doc. The chapters are written to match the actual implementation, not an abstract textbook version of it.
If something does not click on the first read, keep going. Many ideas only make full sense once you have seen the next two or three layers stacked on top.
## Suggested reading order
1. [What is Tiny-AWS?](/about/what-is-tiny-aws)
2. Linux Fundamentals — chapters 2 through 11, in filename order
3. Networking Fundamentals — chapters 12 through 20, in filename order
4. Building the Cloud — chapters 21 through 44, in filename order
The first two sections teach the primitives. **Building the Cloud** is where you see them assembled into a real system. It walks through every service in tiny-aws — the registry, the agent, the scheduler, storage, messaging, networking, Lambda, IAM — then puts them together: setup, first deploy, multi-machine clusters, Kubernetes on tiny-aws, and using instances as agent sandboxes. It ends with an honest look at what is missing and why each gap is a hard engineering problem.
