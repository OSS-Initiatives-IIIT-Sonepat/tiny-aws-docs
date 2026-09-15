---
title: "Cost Comparison"
description: "AWS charges for every byte and every millisecond. tiny-aws costs your electricity bill."
author: "tiny-aws team"
date: "2026-09-14"
---

## The numbers

| | AWS | tiny-aws |
|---|---|---|
| Compute (1 vCPU, 1 GB) | ~$7.50/month (t3.micro) | Free (your hardware) |
| Storage (100 GB) | ~$2.30/month (S3 Standard) | Free (your disk) |
| Load balancer | ~$16/month (ALB) | Free |
| SQS (1M messages) | $0.40 | Free |
| Lambda (1M invocations) | $0.20 | Free |
| Data transfer (100 GB out) | ~$9.00 | Free (your network) |
| **Total for a small app** | **~$35-50/month** | **Electricity + hardware you own** |
| At scale (real company) | $10K - $10M+/month | Buy more machines |

## Why AWS costs what it does

You're not paying for a computer. You're paying for:

- **Hardware redundancy**: Your data is stored on multiple physical disks across multiple racks in multiple buildings. If one burns down, you don't lose your data.
- **Network**: AWS moves petabytes between data centers constantly. That bandwidth costs real money.
- **Operations**: Thousands of engineers keep the lights on 24/7/365 with financial SLA penalties if things go wrong.
- **Elasticity**: You can go from 1 instance to 10,000 in seconds. That requires idle capacity sitting around waiting for you.
- **Global reach**: A server in Tokyo, Frankfurt, São Paulo, and Sydney, all synced, all managed.
- **Compliance**: SOC 2, PCI DSS, HIPAA, FedRAMP, ISO 27001. These aren't free.

## The tiny-aws tradeoff

tiny-aws is free, but you're the ops team. You:
- Keep the machine running
- Handle disk failures
- Handle network outages
- Handle software updates
- Handle backups (or don't, and lose your data)
- Handle scaling (buy another machine)

For a learning project or a course, that tradeoff is obviously fine. For
a startup serving real customers with real SLAs, AWS's $35/month looks
cheap compared to a production outage at 3am.

## The real lesson

The most valuable thing this comparison teaches isn't "AWS is expensive."
It's "here's what you're buying."

Every line item on your AWS bill maps to real infrastructure, real redundancy,
real operations. When you understand tiny-aws, you understand what those line
items actually mean. Then the bill stops feeling like a black box.
