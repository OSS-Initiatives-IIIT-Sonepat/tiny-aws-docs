---
title: "Networking: VPC and Security Groups"
description: "AWS has custom silicon and real SDN. tiny-aws has SQLite and iptables. Here's what that actually means."
author: "tiny-aws team"
date: "2026-09-13"
---

## How AWS does networking

VPC gives you a real virtual network. Your instances get real private IPs. The
VPC has real routing tables that control packet flow. Security groups are
stateful firewalls enforced at the hypervisor level — they filter packets
before they reach your instance.

AWS built custom networking hardware (Nitro cards) and SDN (software-defined
networking) that programs physical switches and routers. It handles ARP, DHCP,
DNS, NAT, internet gateways, VPN connections, VPC peering, transit gateways,
PrivateLink... The list is long.

When you create a security group rule that says "deny port 22 from the
internet," that's not some software firewall running on your instance — it's
enforced at the hypervisor before packets even reach the guest. That's a
fundamentally different threat model.

## How tiny-aws does it

VPC in tiny-aws is metadata (~280 lines of Go). You create a VPC with a CIDR
block, subnets, route tables, security groups, and rules. It's all stored in
SQLite. The network agent (Rust, ~100 lines) reads the security group rules and
writes iptables (Linux) or netsh (Windows) rules.

But there's no real IP allocation, no real routing, no real packet filtering
between instances. Two instances on the same machine can still talk to each
other regardless of what the security group says, unless the iptables rules
happen to block it at the host level. The model is correct. The enforcement is
limited.

## The numbers

| | AWS VPC | tiny-aws VPC |
|---|---|---|
| IP allocation | Real (DHCP within CIDR) | Strings in SQLite |
| Routing | Real (route tables, IGW, NAT) | Metadata only |
| Security groups | Stateful, hypervisor-enforced | iptables/netsh (host-level) |
| Subnets | Real, AZ-scoped | Metadata (CIDR strings) |
| VPC peering | Yes | No |
| VPN / Direct Connect | Yes | No |
| Network ACLs | Yes (stateless) | No |
| Flow logs | Yes | No |
| DNS | Route 53 integration | No |
| Implementation | Custom hardware + SDN | ~380 lines (Go + Rust) |

## What's the same (conceptually)

The API and the mental model. You create VPCs, subnets, security groups, rules
with inbound/outbound directions and port/protocol/CIDR specifications.

If you learn to think in these terms with tiny-aws, you'll recognize the AWS
networking console immediately. Same nouns, same relationships — just one is
metadata in SQLite and the other is running on custom ASICs in a data center.

## Why this matters

The gap between "metadata in SQLite" and "real SDN with Nitro cards" is exactly
the kind of gap that takes years to understand if you only ever use AWS from the
console. tiny-aws makes that gap visible. You can read the VPC service in an
afternoon and understand what AWS is doing at 10,000x the scale.
