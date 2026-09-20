---
title: "What tiny-aws Teaches You"
description: "The model airplane isn't a 737. But it teaches you how the 737 works."
author: "tiny-aws team"
date: "2026-09-14"
---

## The honest summary

tiny-aws is not a replacement for AWS. It's a working model of AWS.

The difference is like a model airplane vs a 737. The model airplane has wings,
a fuselage, a tail, and it flies. But you wouldn't put passengers in it.

## What you actually learn

**1. How the services relate to each other**

Registry talks to scheduler talks to agent. Jobs flow through queues. Events
fan out through topics. Services register themselves and get discovered by the
load balancer. This is the exact same service topology as real AWS — just at
1/10,000th the scale.

When you look at an AWS architecture diagram, every arrow you see maps to
something in tiny-aws.

**2. What the APIs look like**

REST endpoints, JSON payloads, status codes, auth headers. The tiny-aws CLI
maps almost 1:1 to the real AWS CLI:

```bash
# tiny-aws
tinyaws instance launch --type micro --image debian-12

# AWS
aws ec2 run-instances --instance-type t3.micro --image-id ami-0abc123
```

Same shape. Different infrastructure underneath.

**3. What "serverless" actually means**

It means "someone else's server." In tiny-aws, that someone is you, and you
can see the server. Once that clicks, the abstraction stops being mysterious.

**4. What isolation really is**

Namespaces, cgroups, overlayfs — the same primitives Docker and Kubernetes use.
tiny-aws calls them directly. After reading the ec2-agent code, you understand
what `docker run` does at the kernel level.

**5. Where the complexity hides**

Replication. Consistency. Failure recovery. Networking. Auth policies. These
are the things that make AWS hard. tiny-aws deliberately skips most of them so
you can see the shape without drowning in the details.

Then you can go study each hard problem individually, knowing where it fits
in the overall system.

**6. What all those AWS services cost to build**

8,500 lines gets you a working prototype. Getting from prototype to
production-grade is the other 99.99% of the work.

- Eleven nines of durability requires years of distributed systems engineering
- Sub-second Lambda cold starts require custom microVM technology (Firecracker)
- Global routing requires custom silicon
- IAM that scales to millions of API calls requires its own distributed system

Understanding that gap is maybe the most important lesson. It turns "why is
AWS so expensive?" into "oh, I see exactly what I'm paying for."

## Where to go next

After reading tiny-aws's source code:

1. Read the [AWS EC2 instance lifecycle documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-instance-lifecycle.html) — you'll recognize every state
2. Read the [Firecracker paper](https://www.usenix.org/conference/nsdi20/presentation/agache) — you'll understand why Lambda uses microVMs
3. Read the [Dynamo paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf) — you'll understand eventual consistency
4. Read the [MapReduce paper](https://static.googleusercontent.com/media/research.google.com/en//archive/mapreduce-osdi04.pdf) — you'll understand distributed compute

You'll actually understand them now. That's the point.
