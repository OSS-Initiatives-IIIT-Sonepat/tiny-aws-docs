---
title: "Chapter 1 — Why Tiny-AWS?"
description: "For years, we've been taught how to use the cloud."
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-01-02"
---

For years, we've been taught how to **use the cloud**.

There are thousands of videos explaining how to deploy an application on AWS, create a VM on Azure, configure a load balancer, upload files to S3, or spin up a Kubernetes cluster. But there's a different question that doesn't get answered nearly as often: 

**What is actually happening underneath all of this?**

When you click **“Launch Instance”**, what happens? How does a cloud provider decide *where* that machine should run? How are thousands—or millions—of machines distributed across physical hardware? How does a request travel from an API to a scheduler, from a scheduler to a machine, and eventually become a running workload? 
How does storage work?
How does networking work?
How do machines register themselves?
How does the system know that a machine has died?
These systems are enormously complex, and the internals of large cloud providers are, for the most part, a black box.And that's understandable. AWS, Azure, and Google Cloud are massive production systems built to operate at an incredible scale. Their actual implementations contain decades of engineering, thousands of services, and enormous amounts of code. But that creates a problem when you're trying to **learn how cloud infrastructure actually works**. You can learn how to *use* a cloud without ever understanding how a cloud is *built*.

That's where **Tiny-AWS** comes in, which I actually built as a college student.

Tiny-AWS is my attempt to build a small, educational implementation of a cloud platform from scratch - for my college students, and also maybe yours? Not a production-ready AWS replacement. Not something designed to compete with AWS. And definitely not an attempt to recreate all of AWS.

The goal is much simpler:
**Build just enough of a cloud to understand what's happening underneath it.** The entire project is roughly **10,000 lines of code**. Instead of hiding everything behind enormous abstractions, Tiny-AWS breaks the system into small, understandable pieces: A registry for machines. A scheduler that decides where workloads should run. A controller that manages those workloads. A networking layer. Storage. Messaging. An API. A CLI. And the compute agent actually running on the machine. Each module is intentionally small enough that you can sit down on a Tuesday afternoon, open the code, and actually understand what's happening.

That's the philosophy behind Tiny-AWS:
> **Don't just learn how to use the cloud. Build a tiny one and see how it works.**

And before we start building it, there's one more question worth asking:
**Where did the idea of “cloud computing” actually come from?**

Because AWS didn't invent the idea of running software on someone else's machines. The cloud is the result of several decades of ideas coming together—from time-sharing systems and virtualization to distributed computing and data centers. And understanding that history gives us a much better idea of **why modern cloud infrastructure looks the way it does.**

That's where we'll start.
