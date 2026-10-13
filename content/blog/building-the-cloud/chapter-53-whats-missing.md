---
title: "Chapter 53: What's missing and why it's hard"
description: "The gap between tiny-aws and a real cloud is a handful of genuinely hard problems"
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-02-14"
---

tiny-aws is about 10,000 lines of code. AWS is about 10,000 engineers. The gap between them is not 10,000 features — it's a handful of genuinely hard problems.

This chapter walks through what tiny-aws doesn't have and why each missing piece is hard to add. Not hard as in "we ran out of time" — hard as in "this took a dedicated team years to build at AWS."

---

## Security

### No TLS

Every service in tiny-aws communicates over plain HTTP. The registry, scheduler, agent, object store, load balancer — all unencrypted. Adding TLS to one service is straightforward: generate a certificate, configure the server. Adding TLS to twelve services that talk to each other is a certificate management system.

You need a certificate authority (even a self-signed one). You need to issue certificates to each service. You need to rotate them before they expire. You need every service to trust the CA. You need to handle the case where a certificate expires before rotation happens (graceful degradation or hard failure?). You need to decide whether to use mutual TLS (both client and server present certificates) or server-only TLS.

In production, this becomes ACME (Let's Encrypt), certificate managers like cert-manager in Kubernetes, hardware security modules for the CA key, and certificate transparency logs. AWS runs its own CA infrastructure. Adding "just TLS" is adding an operational system.

### Shared kernel

Every tiny-aws container shares the host's Linux kernel. A kernel vulnerability exploited from inside any container compromises the host and every other container. Namespaces, cgroups, and seccomp are enforced by the kernel — if the kernel has a bug, the enforcement has a bug.

The fix is hardware isolation: run each tenant in a VM with its own kernel. That's what AWS Nitro does. Firecracker — the VM monitor behind Lambda and Fargate — boots a lightweight VM in about 125 milliseconds with about 5MB of memory overhead. But Firecracker requires KVM, a guest kernel image, and a different rootfs format. It's a fundamentally different architecture, not a patch on top of containers.

Tiny-aws uses containers because they're simpler to understand and build. The security trade-off is explicit.

### No audit trail

tiny-aws has API key authentication at the gateway. There's no logging of who did what, when, to which resource. Real cloud audit involves three layers:

1. **API layer** (CloudTrail): every API call is logged with caller identity, timestamp, parameters, and result.
2. **Service layer**: internal service-to-service calls are logged with request IDs that correlate to the originating API call.
3. **Data layer**: access to objects, reads of database rows, decryption of keys — each logged separately.

Each layer is a distributed logging system with its own storage, retention policy, query interface, and tamper-resistance guarantees. CloudTrail alone stores billions of events per day across all AWS accounts. Building one layer is a project. Building three is a platform.

---

## Networking

### VPC is metadata

tiny-aws has VPC as a label. You can tag an instance with a VPC ID. But there's no network isolation between VPCs. All containers share the same `tinyaws0` bridge. An instance in "vpc-1" can ping an instance in "vpc-2" because they're on the same Layer 2 network.

Real VPC isolation requires enforcement at every network hop. AWS does this in the hypervisor's network stack — each packet is checked against VPC routing rules before it reaches the virtual NIC. The hypervisor drops packets that violate VPC boundaries. This is hardware-assisted: the Nitro card offloads network processing from the CPU.

In software, you could implement VPC isolation with iptables rules, separate bridge networks per VPC, or eBPF programs that filter at the bridge level. Each approach has complexity and performance trade-offs. And you need to handle cross-VPC communication (VPC peering) as a deliberate, configured exception to the default deny.

### No DNS

Instances in tiny-aws get IPs. They don't get DNS names. There's no `i-1.tinyaws.internal` that resolves to `10.0.0.2`. If you want to address an instance, you use its IP.

DNS sounds simple — map names to IPs, serve queries on port 53. But doing it correctly means:

- Dynamic registration: when an instance launches, its name must be immediately resolvable.
- Consistency: all instances must see the same DNS state. A query from instance A and a query from instance B for the same name must return the same answer (or a valid cached answer).
- Low latency: DNS is on the critical path for every connection. Slow DNS means slow everything.
- High availability: if DNS goes down, nothing can connect to anything by name.

Route 53 runs on 200+ anycast PoPs worldwide. Building a DNS system that's correct, fast, and available is a multi-year project for a dedicated team.

### No VPC peering

If VPCs were isolated (they aren't, but if they were), connecting two VPCs would require a routing control plane. VPC A needs to know how to reach VPC B's IP range. Every agent in VPC A needs routing rules that forward cross-VPC traffic to the right place. Changes to either VPC's IP range need to propagate to all peers.

This is a distributed routing problem. AWS solves it with a central routing control plane that pushes rules to every hypervisor. tiny-aws has no routing control plane.

---

## Storage

### Single-node durability

The object store runs on one machine. If the disk fails, the data is gone. That's zero nines of durability.

S3's eleven nines (99.999999999%) means that if you store 10 million objects, you can statistically expect to lose one every 10,000 years. This comes from:

- **Replication**: every object is stored on at least three devices across at least three availability zones.
- **Quorum writes**: a write isn't acknowledged until a majority of replicas confirm it.
- **Integrity checking**: every stored object has a checksum that's periodically verified.
- **Automatic repair**: if a replica fails integrity checks or its device dies, a new replica is automatically created from the remaining copies.

Each of these is a distributed system. Replication needs a placement algorithm (which devices, which AZs). Quorum writes need consensus. Integrity checking needs background scanning at petabyte scale. Repair needs capacity reservation so there's always room for a new replica.

### No versioning

S3 versioning keeps every version of every object. Delete an object, and the previous version is still there. Overwrite it, and both versions exist. This requires:

- Immutable storage: writes append, never overwrite.
- Generation tracking: each version has a monotonically increasing ID.
- Garbage collection: eventually, old versions need to be cleaned up (lifecycle policies).
- Consistency: a read-after-write must return the latest version, not a stale one.

tiny-aws's object store overwrites in place. There's one version: the current one.

---

## Compute

### No auto-scaling

tiny-aws launches instances when you tell it to and terminates them when you tell it to. There's no automatic response to load.

Auto-scaling requires three separate systems:

1. **Metrics collection**: CPU usage, request count, queue depth — measured per instance, aggregated per service. This is a time-series database.
2. **Threshold evaluation**: "If average CPU > 70% for 5 minutes, add an instance." This is a rules engine that evaluates against the metrics stream.
3. **Capacity planning**: "Can I add an instance? Is there a machine with enough free resources?" This is a resource-aware scheduler — the round-robin scheduler tiny-aws uses doesn't track capacity.

Each system has edge cases. What if the metric is stale? What if you're already at max instances? What if scaling up causes a cascade (new instance takes traffic, but its startup load pushes CPU higher, triggering more scaling)? Cool-down periods, instance warm-up times, scale-in protection — each is a policy decision with real operational consequences.

### No live migration

If Machine B needs maintenance, every instance on it must be terminated. There's no way to move a running instance to Machine C.

Live migration means:

1. Pause the process (or run it in a mode where memory changes are tracked)
2. Copy its memory state to the destination machine
3. Copy the pages that changed during the copy
4. At some point, stop the source, copy the last delta, resume on the destination

This is CRIU (Checkpoint/Restore In Userspace) for containers, or the hypervisor's built-in migration for VMs. The hard part is convergence: if the process is writing memory faster than you can copy it, you never catch up. The process must be paused at some point, and minimizing that pause (to milliseconds) is the engineering challenge.

AWS uses live migration for host maintenance. The instance doesn't know it moved. Building this for containers requires CRIU integration, shared or replicated storage (so the filesystem is accessible from both machines), and network continuity (the instance's IP must follow it).

---

## Observability

### No metrics

tiny-aws services log to stdout. There's no metrics collection, no dashboards, no alerting.

CloudWatch is a time-series database that ingests metrics from every AWS service and every customer's instances. It stores data at multiple resolutions (1-second, 1-minute, 5-minute), evaluates alarm rules, triggers notifications, and serves queries through a custom query language (Metrics Insights).

Building a metrics system means: a collection agent on every machine, a transport protocol, an ingestion pipeline that can handle millions of data points per second, a storage engine optimized for time-series queries, a query language, and a rendering layer. Each component is a project.

### No distributed tracing

When a request enters the load balancer, hits a service, which calls another service, which reads from the object store — there's no way to see the full request path. Each service logs independently. Correlating logs across services requires manual timestamp matching.

Distributed tracing requires:

- A trace ID generated at the entry point
- Propagation of that ID through every service-to-service call (HTTP headers, gRPC metadata)
- Each service emitting spans (start time, end time, service name, operation) tagged with the trace ID
- A collector that assembles spans into traces
- A query interface to search and visualize traces

The propagation is the hard part operationally. Every HTTP client in every service must forward the trace header. Miss one, and the trace breaks. In a polyglot system (Go, Rust, Python), each language needs its own instrumentation library.

---

## The architecture ceiling

tiny-aws is designed for a small team running on 1-3 machines. That's the right ceiling for an educational project. Every design decision reflects it:

- **Single registry**: no replication, no failover. If it dies, the cluster is blind.
- **Single scheduler**: no HA, no consensus. If it dies, no new instances can launch.
- **Single object store**: no replication. If the disk fails, data is lost.
- **In-memory state**: the registry and scheduler hold state in memory. A restart loses all registrations. Services re-register on heartbeat, but there's a gap.

Removing any of these limitations means adding distributed consensus (Raft, Paxos), which means adding a consensus library, handling leader election, log replication, snapshot management, and split-brain scenarios. That's a significant jump in complexity — justified for production systems, overkill for a learning tool.

---

## What the gaps teach

Each missing feature points to a real engineering problem:

| Missing feature | Engineering problem |
|----------------|---------------------|
| TLS everywhere | Certificate lifecycle management |
| Kernel isolation | Hardware virtualization (hypervisors) |
| Audit trail | Distributed logging at scale |
| VPC enforcement | Hypervisor-level network filtering |
| DNS | Consistent, low-latency name resolution |
| Durable storage | Multi-AZ replication with quorum writes |
| Auto-scaling | Time-series metrics + rules engine + capacity planner |
| Live migration | Memory checkpointing + network continuity |
| Distributed tracing | Cross-service context propagation |

None of these are unsolved problems. AWS, Google, and Microsoft have solved all of them. But each solution took a team, years, and millions of lines of code. The solutions are documented in papers and blog posts. The implementations are mostly proprietary.

tiny-aws gives you the starting point. The gaps give you the curriculum.

---

The gaps are the curriculum. Every line in MISSING.md is a graduate-level distributed systems problem. Understanding what's missing — and why it's hard to add — is as valuable as understanding what's present. That's why we built tiny-aws: not to replace the cloud, but to see through it.
