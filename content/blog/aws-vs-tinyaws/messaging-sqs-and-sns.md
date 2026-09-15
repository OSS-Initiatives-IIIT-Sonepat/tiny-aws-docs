---
title: "Messaging: SQS and SNS"
description: "Distributed queues and pub/sub at AWS scale vs SQLite tables and HTTP POSTs. Same patterns, radically simpler."
author: "tiny-aws team"
date: "2026-09-13"
---

## How AWS does it

### SQS

SQS is a fully managed distributed queue. Messages are replicated across multiple servers in multiple AZs. It supports standard queues (best-effort ordering, at-least-once delivery) and FIFO queues (exactly-once, strict ordering). Visibility timeout hides a message while a consumer processes it. Dead letter queues catch repeatedly-failed messages.

SQS handles billions of messages per day across AWS's customer base. You never think about capacity — it just scales.

### SNS

SNS is pub/sub: publish a message to a topic, and it fans out to all subscribers (SQS queues, HTTP endpoints, email, Lambda, SMS, mobile push). It's the glue that connects AWS services together — S3 uploads trigger Lambda via SNS, CloudWatch alarms notify you via SNS, etc.

## How tiny-aws does it

### SQS

A SQLite table of messages (~187 lines of Go). Send inserts a row. Receive selects the oldest visible message and bumps its `visible_after` by 30 seconds. Delete marks it deleted. That's the whole thing.

No FIFO. No dead letter queue. No batching. Just a table with a visibility timeout.

### SNS

Another SQLite table (~175 lines of Go). Subscribe adds an endpoint URL to a topic. Publish does a goroutine fan-out — one HTTP POST per subscriber. If the POST fails, it logs and moves on. Best-effort, no retry.

## The numbers

| | AWS SQS | tiny-aws SQS | AWS SNS | tiny-aws SNS |
|---|---|---|---|---|
| **Queue types** | Standard + FIFO | Standard only | - | - |
| **Delivery** | At-least-once (std), exactly-once (FIFO) | At-least-once | Best-effort with retry | Best-effort, no retry |
| **Visibility timeout** | Configurable (0s-12hr) | 30s (hardcoded) | - | - |
| **Dead letter queue** | Yes | No | - | - |
| **Message size** | 256 KB | SQLite TEXT (unlimited-ish) | 256 KB | Unlimited |
| **Subscribers** | - | - | SQS, HTTP, Lambda, email, SMS | HTTP only |
| **Throughput** | Unlimited (standard) | SQLite write speed (~thousands/s) | Unlimited | SQLite write speed |
| **Cost** | $0.40 per million msgs | Free | $0.50 per million | Free |
| **Implementation** | Proprietary distributed | ~187 lines Go + SQLite | Proprietary distributed | ~175 lines Go + SQLite |

## What's the same

The mental model. SQS is "put a message on a queue, someone picks it up later." That's exactly what tiny-aws SQS does — just with a SQLite table instead of a distributed cluster. The visibility timeout concept is identical: when you receive a message, it becomes invisible to other consumers for a window. If you don't delete it in time, it comes back. This is how you get at-least-once delivery.

SNS is "publish to a topic, everyone subscribed gets it." Same thing here. tiny-aws just fans out with goroutines and HTTP POSTs instead of a distributed pub/sub infrastructure.

The scheduler even integrates with SQS — set `SQS_URL` and it polls a `jobs` queue for work. And both the registry and scheduler publish events to SNS topics (`instance-launch`, `job-status`). So the internal wiring between services uses the same messaging primitives that users can access. That's the same pattern AWS uses internally.

## What's different

Scale and reliability. AWS SQS is designed so that if an entire availability zone goes down, your messages are still safe. tiny-aws SQS is a single SQLite file. If the process crashes mid-write, you might lose a message. If the disk fills up, everything stops.

The 30-second hardcoded visibility timeout is a deliberate simplification. In AWS, you can set it anywhere from 0 seconds to 12 hours, and you can extend it mid-processing. That flexibility matters in production when some jobs take 5 seconds and others take 5 minutes. In tiny-aws, everyone gets 30 seconds.

FIFO queues are another big gap. Sometimes ordering matters — "create user" must happen before "update user." AWS SQS FIFO guarantees strict ordering with exactly-once delivery. tiny-aws doesn't even try. This is one of those features where the implementation complexity is 100x the API complexity.

## Why this comparison is useful

Messaging is one of the clearest examples of "the concept is simple, the production implementation is not." The tiny-aws SQS is maybe 30 lines of actual logic (INSERT, SELECT with WHERE, UPDATE). The concept fits in your head. But making that concept work when you have billions of messages, multiple data centers, and a 99.999% availability requirement — that's what turns 30 lines into a team of engineers.

Understanding the 30-line version makes the distributed version make sense.
