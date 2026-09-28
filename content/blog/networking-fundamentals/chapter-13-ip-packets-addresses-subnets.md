---
title: "Chapter 13: IP — packets, addresses, subnets"
description: "An IP address is a 32-bit number."
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-01-14"
---

An IP address is a 32-bit number.

That's it. Four bytes. We write it in dotted decimal — `192.168.1.1` — because four numbers between 0 and 255 are easier to read than `11000000101010000000000100000001`. But it's just a number. A 32-bit integer that uniquely identifies a network interface on the internet.

Because it's 32 bits, there are 2³² possible addresses — about 4.3 billion. That sounded like plenty in 1981. It stopped sounding like plenty sometime around 2010. IPv6 uses 128-bit addresses to fix this, but IPv4 is still the majority of traffic and the version you'll encounter in tiny-aws, so that's what we cover here.

---

## Structure

An IP address has two parts: a network part and a host part.

The network part identifies which network a machine is on. The host part identifies which machine on that network. The boundary between them is the subnet mask.

Take `192.168.1.42` with a subnet mask of `255.255.255.0`.

In binary:
```
IP:   11000000.10101000.00000001.00101010
Mask: 11111111.11111111.11111111.00000000
```

The ones in the mask mark the network part. The zeros mark the host part. So:
- Network: `192.168.1` — the first 24 bits
- Host: `42` — the last 8 bits

Every machine on the `192.168.1.0/24` network shares the same network part. They can reach each other directly without going through a router. Machines on a different network — `192.168.2.0/24` — need a router to communicate.

![IP address structure: network part, host part, and subnet mask](/networking-fundamentals/ch13-ip-packets-addresses-subnets/ip-address-structure-and-subnetting-guide.png)

---

## CIDR notation

`255.255.255.0` is verbose. CIDR notation is shorter: just write the number of ones in the mask after a slash.

`255.255.255.0` = 24 ones = `/24`
`255.255.0.0` = 16 ones = `/16`
`255.0.0.0` = 8 ones = `/8`

So `192.168.1.0/24` means: the network whose address is `192.168.1.0`, with a 24-bit network prefix. Hosts in this network have addresses from `192.168.1.1` to `192.168.1.254`. (`192.168.1.0` is the network address itself; `192.168.1.255` is the broadcast address — neither is usable for a host.)

A `/24` gives you 254 usable hosts. A `/16` gives you 65,534. A `/8` gives you 16,777,214.

tiny-aws uses `10.0.0.0/16` for its container network — up to 65,534 containers, each getting an address from `10.0.0.1` to `10.0.255.254`. The host bridge gets `10.0.0.1`. Containers get sequential addresses starting from `10.0.0.2`.

![CIDR notation and how tiny-aws uses 10.0.0.0/16 for its container network](/networking-fundamentals/ch13-ip-packets-addresses-subnets/cidr-notation-and-tiny-aws-networks.png)

---

## Private addresses

Three ranges are reserved for private networks — they're not routed on the public internet:

```
10.0.0.0/8       — 16 million addresses
172.16.0.0/12    — 1 million addresses
192.168.0.0/16   — 65,534 addresses
```

Your home network is probably `192.168.0.0/24` or `192.168.1.0/24`. Your phone's hotspot probably hands out `172.20.10.x`. Containers and VMs almost always use private ranges.

Traffic from private addresses can't reach the internet directly — routers on the public internet won't forward it, because the destination has no idea how to route back. To get internet access from a private network, you use NAT — Network Address Translation. We'll get to that in chapter 19.

---

## The packet

An IP packet has a header and a payload.

The header contains:
- **Version** — 4 for IPv4
- **Header length** — usually 20 bytes
- **Total length** — header + payload, up to 65,535 bytes
- **TTL** — Time To Live. A counter, decremented by each router the packet passes through. When it hits zero, the packet is discarded. Prevents packets from circling forever on a misconfigured network.
- **Protocol** — what's in the payload: 6 for TCP, 17 for UDP, 1 for ICMP (ping)
- **Source IP** — where the packet came from
- **Destination IP** — where it's going
- **Checksum** — header integrity check

The payload is whatever the layer above put there — a TCP segment, a UDP datagram, an ICMP message.

The IP layer doesn't care about order, reliability, or delivery guarantees. It's a best-effort postal service: it will try to deliver your packet, but it makes no promises. If a router along the path is congested, it drops the packet. No notification. No retry. Just gone.

Reliability — if you need it — is handled by TCP on top of IP.

---

## Fragmentation

IP packets have a maximum size. The maximum transmission unit — MTU — for ethernet is 1500 bytes. If an IP packet is larger than the MTU of the network it's traversing, a router can fragment it: split it into smaller packets, each with its own IP header, each delivered independently. The receiving end reassembles them.

Fragmentation is expensive and causes problems. In practice, modern systems use path MTU discovery — they send packets with a "don't fragment" flag set and adjust the packet size downward if a router sends back "too big." This avoids fragmentation entirely.

This matters for containers because veth interfaces and tunnels sometimes have lower MTUs than physical interfaces. A container behind a veth pair might have an MTU of 1450 instead of 1500 — the wrapping overhead of the virtual network. Misconfigured MTUs cause mysterious slowdowns where large transfers work poorly but small ones are fine.

![IP fragmentation and MTU: why packet size matters for container networking](/networking-fundamentals/ch13-ip-packets-addresses-subnets/ip-fragmentation-and-mtu-guide.png)

---

## Special addresses

A few IP addresses have special meaning:

`127.0.0.1` — loopback. Packets sent here are delivered to the same machine, never hitting the wire. The loopback interface (`lo`) always exists. Used for processes on the same machine to talk to each other.

`0.0.0.0` — means "any interface" in the context of binding a socket. A server that binds to `0.0.0.0:80` accepts connections on all interfaces.

`255.255.255.255` — limited broadcast. A packet sent here is delivered to all hosts on the local network segment.

`x.x.x.255` in a `/24` — directed broadcast for that subnet. `192.168.1.255` reaches all hosts on `192.168.1.0/24`.

---

## ARP: the bridge between IP and ethernet

IP addresses identify machines logically. Ethernet frames need MAC addresses. When machine A wants to send an IP packet to machine B on the same local network, it knows B's IP address but needs B's MAC address to put in the ethernet frame.

ARP — Address Resolution Protocol — handles this. Machine A broadcasts an ARP request: "who has IP `192.168.1.5`? Tell `192.168.1.1`." Machine B receives it, recognizes its own IP, and replies with its MAC address. Machine A caches this mapping in its ARP table and uses it for subsequent frames.

`arp -n` on Linux shows the current ARP cache. `ip neigh` is the modern equivalent.

When containers talk to each other through a bridge, ARP runs the same way — the bridge forwards ARP broadcasts, containers respond, and the kernel's ARP tables fill in.

![ARP explained: from broadcast request to unicast reply](/networking-fundamentals/ch13-ip-packets-addresses-subnets/arp-explained-broadcast-to-unicast.png)

---

IP is the universal addressing scheme that makes the internet possible. Everything rides on top of it. Next: how packets actually find their way — the routing system that decides, at each hop, where a packet goes next.
