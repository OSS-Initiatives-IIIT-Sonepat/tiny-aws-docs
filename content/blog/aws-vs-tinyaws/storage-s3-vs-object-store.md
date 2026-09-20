---
title: "Storage: S3 vs tiny-aws object store"
description: "Eleven nines of durability vs 'your disk didn't fail.' Same PUT/GET API, very different guarantees."
author: "tiny-aws team"
date: "2026-09-12"
---

## How AWS does it

S3 is one of the most impressive distributed systems ever built. Your object gets split across multiple disks, in multiple facilities, in multiple availability zones. S3 replicates everything at least three times. It does consistent reads (since 2020). It handles trillions of objects. The internal architecture uses a custom request router, a placement service, and a storage engine that writes to physical spinning disks and SSDs.

You never see any of this. You just PUT an object and GET it back.

S3 has versioning, lifecycle policies (auto-delete after N days, transition to cheaper storage), event notifications (trigger Lambda on upload), S3 Select (query CSV/JSON in place), transfer acceleration, cross-region replication, storage classes (Standard, Infrequent Access, Glacier, Deep Archive), and more.

## How tiny-aws does it

tiny-aws has a C++ block engine (`block_store.cpp`, ~150 lines) that writes files to disk via raw `fstream`. A Rust HTTP server sits on top with axum, handling PUT/GET/DELETE/list. SQLite stores metadata (size, etag, content-type). Buckets are just path prefixes.

Replication exists: when you set `REPLICATION_FACTOR=2`, writes go to multiple storage nodes (discovered from the registry). Reads fall back to peers if the local copy is missing. Deletes fan out too.

That's the whole thing. No distributed consensus, no erasure coding, no storage tiering. Files on disk with an HTTP API and optional multi-node replication.

## The numbers

| | AWS S3 | tiny-aws object store |
|---|---|---|
| **Durability** | 99.999999999% (eleven nines) | "Your disk didn't fail" |
| **Availability** | 99.99% | "The process is running" |
| **Consistency** | Strong (since Dec 2020) | Eventual (with replication) |
| **Max object size** | 5 TB | Disk space |
| **Storage classes** | 8 (Standard thru Deep Archive) | 1 |
| **Versioning** | Yes | No |
| **Lifecycle policies** | Yes | No |
| **Event notifications** | Yes (Lambda, SQS, SNS) | No |
| **Encryption** | SSE-S3, SSE-KMS, SSE-C | No |
| **Replication** | Built-in, cross-region | Manual, same-region, configurable factor |
| **Access control** | Bucket policies, ACLs, IAM | Bearer token (one key for all) |
| **Cost** | $0.023/GB/month (Standard) | Free (your disk) |
| **Implementation** | Millions of lines + custom hardware | ~1,200 lines (Rust + C++) |

## What's the same

The API shape: PUT an object with a key, GET it back with the same key. Buckets as namespaces. Flat key structure (no real directories). ETags for content verification. Content-type metadata. Bearer auth headers.

If you've used the tiny-aws object store, you'll feel at home with S3's API. The verbs are the same. The mental model is the same. You think in terms of "bucket + key = object."

## Where it gets interesting

The durability gap is where the real engineering lives. S3's eleven nines means if you store 10 million objects, you'd statistically lose one every 10,000 years. tiny-aws's durability is "however reliable your disk is." If your disk dies, your data's gone (unless you set up replication, in which case it's "however reliable your two disks are").

Getting from "files on a disk" to "eleven nines" is years of engineering: erasure coding, checksumming, automatic repair, cross-datacenter replication, hardware monitoring, disk replacement workflows. That gap is what thousands of S3 engineers work on every day. tiny-aws shows you the starting point. S3 shows you where it ends up after two decades of work.

## The replication story

tiny-aws does have replication, and it's actually a pretty clean implementation. Storage nodes discover each other through the registry. When you write an object with `REPLICATION_FACTOR=2`, it fans out to a peer. When you read and the local copy is missing, it falls back to peers. Deletes propagate too.

But it's eventually consistent. There's no consensus protocol. Two simultaneous writes to the same key on different nodes? Last one wins, and "last" is undefined. S3 solved this with strong consistency in December 2020, which was a massive engineering achievement. tiny-aws hasn't.

That's a great thing to understand: why consistency is hard, and what it costs to achieve.
