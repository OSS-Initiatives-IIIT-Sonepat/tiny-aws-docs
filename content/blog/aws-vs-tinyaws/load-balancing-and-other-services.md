---
title: "Load Balancing, Controller, Metadata, and API Gateway"
description: "The services that glue everything together — and what AWS has that tiny-aws doesn't."
author: "tiny-aws team"
date: "2026-09-14"
---

## Load balancing: ELB vs tiny-aws LB

### How AWS does it

AWS has three load balancers:
- **ALB** (Application Load Balancer): Layer 7, HTTP/HTTPS, path-based routing, host-based routing, WebSocket support, sticky sessions
- **NLB** (Network Load Balancer): Layer 4, TCP/UDP, millions of requests per second, static IPs
- **CLB** (Classic Load Balancer): Legacy, both L4 and L7

All are fully managed, auto-scaling, multi-AZ, with health checks, SSL
termination, and access logs.

### How tiny-aws does it

A single Go service (~180 lines) that:
- Polls the registry every 10 seconds for healthy compute nodes
- Health-checks each agent's `/health` endpoint
- Discovers running services from the registry
- Round-robin forwards HTTP requests to the next healthy target
- Exposes `/targets` to list current backends

| | AWS ELB/ALB | tiny-aws LB |
|---|---|---|
| Layer | L4 (NLB) or L7 (ALB) | L7 (HTTP only) |
| Algorithm | Round-robin, least connections, flow hash | Round-robin only |
| Health checks | TCP, HTTP, HTTPS, gRPC | HTTP GET /health |
| SSL termination | Yes (ACM certificates) | No |
| Auto-scaling | Yes | No |
| Sticky sessions | Yes | No |
| Cost | ~$16/month + data | Free |
| Implementation | Proprietary + custom hardware | ~180 lines of Go |

---

## Controller (~80 lines of Go)

The controller polls the registry every 15 seconds for terminated instances and
removes their workspace directories with `os.RemoveAll()`.

This is the same reconciliation loop that runs inside AWS to clean up after
terminated instances — deleting EBS volumes, releasing IPs, removing ENIs. AWS
does it across millions of resources. tiny-aws does it for a handful of
directories on one machine. The pattern is identical.

---

## Metadata service (~60 lines of Go)

Fans out to registry, scheduler, and networking to aggregate all resources into
one response. Similar to AWS Resource Explorer or the EC2 instance metadata
service at `169.254.169.254`.

Except tiny-aws's version is 60 lines, not a distributed system serving every
AWS account on earth.

---

## API gateway (~60 lines of Go)

A `httputil.ReverseProxy` that strips `/v1` and routes to backend services.

AWS API Gateway is a full product: REST APIs, HTTP APIs, WebSocket APIs,
throttling, caching, request/response transforms, authorization, usage plans,
developer portal, SDK generation. tiny-aws's version is literally "strip
prefix, forward request."

---

## What AWS has that tiny-aws doesn't (the honest list)

tiny-aws has the foundation. AWS has the foundation plus 20 years of features:

**Databases as a service**
RDS, DynamoDB, Aurora, ElastiCache, Neptune, Redshift, DocumentDB, Timestream, QLDB, Keyspaces

**Container orchestration**
ECS, EKS, Fargate, App Runner

**CI/CD**
CodePipeline, CodeBuild, CodeDeploy, CodeCommit, CodeArtifact

**Monitoring and observability**
CloudWatch, X-Ray, CloudTrail, AWS Config, Systems Manager

**Content delivery**
CloudFront (CDN), Global Accelerator

**DNS and routing**
Route 53

**Messaging**
Kinesis (real-time streams), EventBridge, MSK (Managed Kafka), MQ (ActiveMQ/RabbitMQ), AppSync (GraphQL)

**Email and notifications**
SES, SNS SMS, Pinpoint

**Search**
OpenSearch, CloudSearch, Kendra

**ML and AI**
SageMaker, Bedrock, Rekognition, Textract, Transcribe, Translate, Polly, Forecast, Personalize, Comprehend

**IoT**
IoT Core, IoT Analytics, Greengrass, IoT Events

**Security**
KMS, Secrets Manager, Certificate Manager, WAF, Shield, GuardDuty, Macie, Inspector, Security Hub

**Networking extras**
Direct Connect, VPN, Transit Gateway, PrivateLink, Network Firewall

**Developer tools**
Cloud9, CloudShell, X-Ray, CodeGuru, DevOps Guru

**Business apps**
WorkSpaces, WorkMail, Chime, Connect (call center)

**Quantum**
Braket

**Satellite**
Ground Station

That's 200+ more services. tiny-aws has 12. But those 12 are the primitives
everything else is built on.
