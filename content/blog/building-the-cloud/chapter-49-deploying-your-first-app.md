---
title: "Chapter 49: Deploying your first app"
description: "From a running stack to a deployed application in five commands"
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-02-10"
---

The stack is running. Time to deploy something.

This chapter is entirely hands-on. We create a trivial application, launch an instance, deploy the app, hit it through the load balancer, read its logs, and tear it down. Every command you'll use for real work starts here.

---

## Create a simple app

```bash
mkdir my-app
cat > my-app/start.sh << 'EOF'
#!/bin/bash
python3 -m http.server 3000
EOF
chmod +x my-app/start.sh
```

That's a web server. It serves the current directory on port 3000. Python's `http.server` is already installed in the base rootfs from the bootstrap step.

---

## Launch an instance

```bash
tinyaws instance launch --type small
```

Output:

```
Launched instance i-1 (type: small, cpu: 100%, memory: 512MB)
Status: provisioning
```

The instance starts in "provisioning" state. Behind the scenes:

1. The CLI sends `POST /instances` to the scheduler
2. The scheduler picks an agent via round-robin
3. The agent creates an overlay filesystem on top of the base rootfs
4. The agent starts a `systemd-nspawn` container with cgroup limits, seccomp profile, and network namespace
5. The container boots systemd, gets an IP on the `tinyaws0` bridge
6. The agent flips the instance status to "running"

Check status:

```bash
tinyaws instance list
```

```
ID    TYPE    STATUS        IP          AGENT
i-1   small   running       10.0.0.2    127.0.0.1:8080
```

If status is still "provisioning", wait a few seconds and check again. First boot of a new overlay takes a moment while systemd initializes.

---

## Deploy

```bash
tinyaws deploy ./my-app --service --port 3000
```

Output:

```
Uploading ./my-app to object store... done (2 files, 89 bytes)
Deploying to instance i-1...
Registered service svc-1 on port 3000
```

What happens behind the scenes:

1. The CLI tars `./my-app`, uploads it to the object store as a deployment artifact
2. The CLI tells the agent to deploy the artifact to instance `i-1`
3. The agent downloads the artifact from the object store into the container
4. The agent extracts it and runs `start.sh`
5. The `--service` flag registers a service (`svc-1`) with the registry, pointing at the instance's IP and port 3000
6. The load balancer discovers `svc-1` on its next registry poll and adds it as a backend

---

## Check the service

```bash
tinyaws service list
```

```
ID      INSTANCE    PORT    STATUS     URL
svc-1   i-1         3000    healthy    http://10.0.0.2:3000
```

The service is healthy when the agent can reach `http://10.0.0.2:3000` on the health check interval.

---

## Hit it through the load balancer

```bash
curl http://localhost:8088/
```

The load balancer on port 8088 routes to healthy backends. With one service registered, every request goes to `svc-1`.

You can also hit the instance directly, bypassing the load balancer:

```bash
curl http://10.0.0.2:3000/
```

Both return the same response — a directory listing from Python's HTTP server.

---

## Read logs

```bash
tinyaws service logs svc-1
```

```
[2026-02-10 14:23:01] Serving HTTP on 0.0.0.0 port 3000
[2026-02-10 14:23:15] 10.0.0.1 - - "GET / HTTP/1.1" 200 -
[2026-02-10 14:23:18] 10.0.0.1 - - "GET / HTTP/1.1" 200 -
```

Logs are captured from the process's stdout and stderr. The `10.0.0.1` source is the bridge IP — requests from the host (including the load balancer) come through the bridge.

For a live tail:

```bash
tinyaws service logs svc-1 --follow
```

---

## Stop the service

```bash
tinyaws service stop svc-1
```

This sends SIGTERM to the service process inside the container and deregisters the service from the registry. The load balancer stops routing to it on its next poll.

The instance is still running. You can deploy something else to it, or shell into it:

```bash
tinyaws instance shell i-1
```

That drops you into an interactive shell inside the `systemd-nspawn` container via `machinectl shell`.

---

## Terminate the instance

```bash
tinyaws instance terminate i-1
```

```
Terminating instance i-1...
Status: terminated
```

The agent stops the `systemd-nspawn` container, removes the overlay filesystem, releases the IP address, and deregisters the instance from the registry. The controller picks up the termination on its next poll and confirms cleanup.

After termination:

```bash
tinyaws instance list
```

```
ID    TYPE    STATUS        IP          AGENT
(no instances)
```

---

## The full cycle

Five commands:

```bash
tinyaws instance launch --type small
tinyaws deploy ./my-app --service --port 3000
curl http://localhost:8088/
tinyaws service stop svc-1
tinyaws instance terminate i-1
```

Launch, deploy, access, stop, terminate. That's the workflow for everything. Larger deployments have more instances and more services, but the commands are the same.

---

## Troubleshooting

### Instance stuck in "provisioning"

The agent hasn't flipped the status yet. Common causes:

- **Agent not running.** Check `ps aux | grep ec2-agent`. If it's not there, start it.
- **Agent not registered.** Hit the registry directly: `curl http://localhost:9000/nodes`. If the agent isn't listed, it can't reach the registry. Check `REGISTRY_URL`.
- **Base rootfs missing.** The agent can't create an overlay if `/var/lib/tinyaws/base` doesn't exist. Run `bootstrap-rootfs.sh`.

### Service not reachable through load balancer

The load balancer routes to services it finds in the registry.

- **Service not registered.** `curl http://localhost:9000/services` — is your service listed?
- **Load balancer not polling.** Check the LB logs. It polls every 5 seconds.
- **Wrong port.** The `--port` flag in `tinyaws deploy` must match the port the app actually listens on.

### No healthy backends

The load balancer returns `502 Bad Gateway` when it has no healthy backends.

- **Agent heartbeat stopped.** The agent sends a heartbeat every 10 seconds. If it crashes, the registry marks its services unhealthy after 30 seconds.
- **Health check failing.** The agent checks `http://<instance-ip>:<port>/` — if the app isn't responding, the service is marked unhealthy.

### Deploy fails with "no instances available"

The scheduler has no agents registered, or all instances are at capacity.

- Check the registry: `curl http://localhost:9000/nodes`
- Check the scheduler: `curl http://localhost:9001/status`

---

One instance, one app, one load balancer route. That's the simplest possible deploy. Everything from here builds on this.
