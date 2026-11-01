---
title: "Chapter 49b: Deploying Kokoro TTS — a real app across two laptops"
description: "How we ran an OpenAI-compatible TTS server on Arch from a Windows laptop, using tinyaws.build and a cached Debian rootfs"
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-10-30"
---

Chapter 49 deploys a toy HTTP server. This chapter deploys something that actually hurts: [Kokoro TTS](https://github.com/FirePheonix/kokoro-deployed-tts) — a Rust OpenAI-compatible speech server with model weights, native deps, and a multi-minute compile.

We did it for real. Stack on an Arch Linux laptop. CLI (and curl) from a Windows laptop on the same Wi‑Fi. No Docker on either machine.

---

## The setup

| Role | Machine | Job |
|------|---------|-----|
| Control plane + agent | Arch laptop (Dell), e.g. `192.168.1.47` | registry, scheduler, object store, ec2-agent |
| Client | Windows laptop (HP) | zip the app, upload, submit the job, hit `:3000` |

The Arch box is the cloud. Windows only speaks HTTP to it. Same pattern as [Chapter 50](/building-the-cloud/chapter-50-multi-machine), except here the “second machine” is just the laptop you type on — it never runs an agent.

On the Arch side you need the stack listening on the LAN, not localhost:

```bash
# .env.local on the Arch laptop (example)
REGISTRY_URL=http://192.168.1.47:9000
SCHEDULER_URL=http://192.168.1.47:9001
OBJECT_STORE_URL=http://192.168.1.47:7001
OBJECT_STORE_ADDR=0.0.0.0:7001
AGENT_ADVERTISE_ADDR=192.168.1.47
```

`OBJECT_STORE_ADDR=0.0.0.0:7001` is the one people forget. If the store binds `127.0.0.1`, health checks from Windows look fine for registry/scheduler and then the zip upload dies.

Start the stack (`./scripts/run-local.sh`), then run the agent as root so `unshare` / overlays work:

```bash
set -a; source .env.local; set +a
pkill -f ec2-agent || true
cd data-plane/compute/ec2-agent
sudo -E cargo run   # or sudo -E ./target/debug/ec2-agent
```

From Windows, sanity-check:

```powershell
$S = "192.168.1.47"
curl.exe -s http://${S}:9000/health
curl.exe -s http://${S}:9001/health
curl.exe -s http://${S}:7001/health
curl.exe -s http://${S}:9000/nodes
```

You want a compute node with `"status":"healthy"` (ours was `arch-dell`).

---

## The app is one file: `tinyaws.build`

The deploy directory does not need the Kokoro source tree on Windows. The build file tells the Arch agent what to fetch and compile:

```
kokoro-tts-deploy/
└── tinyaws.build
```

The file that worked (also in the main repo as `kokoro-tts-deploy/tinyaws.build`):

```
# Kokoro TTS — OpenAI-compatible TTS server
# Uses a pre-baked Debian base with Rust + build tools already installed.
base: /var/lib/tinyaws/images/b50875264ce5316a
packages: libsonic-dev libpcaudio-dev
run: git clone --depth 1 --branch main https://github.com/FirePheonix/kokoro-deployed-tts.git /build/kokoro
run: mount -t proc proc /proc && cd /build/kokoro && RUSTUP_HOME=/opt/rustup CARGO_HOME=/opt/cargo /opt/cargo/bin/cargo build --release; umount /proc
run: mkdir -p /opt/koko && cp /build/kokoro/target/release/koko /opt/koko/koko
run: cd /build/kokoro && bash download_all.sh && cp -r checkpoints data /opt/koko/
run: cp -r /build/kokoro/target/release/build/espeak-rs-sys-*/out/share/espeak-ng-data /opt/koko/espeak-ng-data
run: rm -rf /build /opt/rustup /opt/cargo
start: cd /opt/koko && ESPEAK_DATA_PATH=/opt/koko/espeak-ng-data ./koko --instances 1 openai --port 3000 --ip 0.0.0.0
```

Line by line:

| Directive | Meaning |
|-----------|---------|
| `base:` | Path to an **already built** rootfs on the agent (Debian + Rust toolchain). Not a distro codename. |
| `packages:` | Extra apt packages the Kokoro native bits need. |
| `run:` | Build steps inside that rootfs: clone, `cargo build --release`, download models, install into `/opt/koko`, strip the toolchain. |
| `start:` | Long-running command. Listens on `0.0.0.0:3000` so the host LAN can reach it. |

This is the [Chapter 37](/building-the-cloud/chapter-37-deploying-an-application) `tinyaws.build` path with a heavyweight `start:`.

### Why not `base: noble` / Ubuntu?

We tried a fresh Ubuntu image first. The agent’s `apt` step failed looking for packages (e.g. `clang`) that were not available the way that suite was configured, then a half-built image got reused and the overlay mount fell over. The fix was not “debug apt forever” — it was to point `base:` at a Debian rootfs that already had the Rust toolchain (`/var/lib/tinyaws/images/b50875264ce5316a` on that machine). Once that image exists, every Kokoro deploy reuses it by path (and the build file’s content hash caches further layers).

---

## Deploy from Windows

Two equivalent paths. Prefer the CLI when you have Go; use curl + a JSON file when PowerShell eats your escapes.

### Option A — CLI

```powershell
$S = "192.168.1.47"
$env:REGISTRY_URL = "http://${S}:9000"
$env:SCHEDULER_URL = "http://${S}:9001"
$env:OBJECT_STORE_URL = "http://${S}:7001"

cd E:\path\to\tiny-aws\control-plane\cli
go run . deploy "E:\path\to\tiny-aws\kokoro-tts-deploy" --service --port 3000
```

That zips the folder, `PUT`s it to the object store as `kokoro-tts-deploy.zip`, and `POST`s a service job. Same flow as Chapter 37.

### Option B — zip + curl (what we used after a restart)

PowerShell turns `\"` inside `-d "..."` into literal backslashes, and the scheduler replies `failed to decode job`. Write JSON to a file instead:

```powershell
$S = "192.168.1.47"
$zip = "$env:TEMP\kokoro-tts-deploy.zip"
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path "E:\path\to\tiny-aws\kokoro-tts-deploy\*" -DestinationPath $zip -Force

curl.exe -s -X PUT "http://${S}:7001/buckets/deployments"
curl.exe -s -X PUT "http://${S}:7001/buckets/deployments/objects/kokoro-tts-deploy.zip" `
  -H "Content-Type: application/zip" --data-binary "@$zip"

python -c "import json,os; open(os.path.join(os.environ['TEMP'],'kokoro-job.json'),'w',encoding='ascii',newline='\n').write(json.dumps({'command':'','deploy_url':'http://192.168.1.47:7001/buckets/deployments/objects/kokoro-tts-deploy.zip','job_type':'service','port':3000}))"

curl.exe -s -X POST "http://${S}:9001/jobs" -H "Content-Type: application/json" `
  --data-binary "@$env:TEMP\kokoro-job.json"
```

You should get something like:

```json
{"job_id":"job-77","node_id":"arch-dell","job_type":"service","port":3000,"status":"pending",...}
```

Poll until the job is `running` and a new service row appears:

```powershell
curl.exe -s http://${S}:9001/jobs/job-77
curl.exe -s http://${S}:9000/services
```

First build (clone + cargo + model download) can take a long time. Watch the Arch agent terminal. Later deploys with the same build file hash skip the heavy work — after we restarted the whole stack and redeployed, the playground came back in seconds because the image was still under `/var/lib/tinyaws/images/`.

---

## Prove it

```powershell
curl.exe -s -D - http://192.168.1.47:3000/ -o NUL
```

Expect `HTTP/1.1 200` and an HTML body titled **Kokoro TTS Playground**. Open the same URL in a browser on the Windows laptop.

Under the hood (compressed version of Chapter 37):

1. Windows uploads the zip to the Arch object store.
2. Scheduler assigns the job to `arch-dell`.
3. Agent downloads/extracts, finds `tinyaws.build`, builds or reuses the rootfs.
4. Agent starts `koko` as a **service** job (process stays up; stdout is logged).
5. Agent registers e.g. `svc-42` on port `3000` with the registry.
6. Traffic hits the host’s `:3000` (and the load balancer can pick the service up on its next poll).

No SSH into an “instance.” No Docker image push. The guest filesystem is a directory tree; isolation is namespaces + overlay + pivot_root (or nspawn for full instances). Kokoro here ran as a **host-side service job** with a custom rootfs — the usual path for `tinyaws deploy --service` when you do not pass `--instance`.

---

## Redeploy after a restart

Closing the stack kills the `koko` PID. Registry rows may still say `running` — those are stale SQLite records, not live processes. Port `3000` will not answer until you submit the service job again.

If the cached image is still on disk:

```bash
# on the Arch laptop
ls /var/lib/tinyaws/images/b50875264ce5316a
```

…then the same zip + service job is enough. You do not need to rebuild Rust or re-download models.

---

## Bugs we actually hit

1. **PowerShell JSON escaping** — hand-built `-d "{\"command\":...}"` becomes garbage. Use the CLI or a JSON file.
2. **Object store on localhost** — remote upload needs `OBJECT_STORE_ADDR=0.0.0.0:7001`.
3. **Agent without root** — `unshare: Operation not permitted`. Restart with `sudo -E`.
4. **Wrong base image** — Ubuntu/`clang` failure; switch to the pre-baked Debian image path.
5. **Stale “running” services** — after a reboot, trust `:3000`, not old `svc-*` rows.
6. **`export` in PowerShell** — use `$env:REGISTRY_URL = "..."`, not bash `export`.

---

## How this sits next to the other chapters

| Chapter | What it teaches | What Kokoro adds |
|---------|-----------------|------------------|
| [37 — Deploying an application](/building-the-cloud/chapter-37-deploying-an-application) | Zip → job → spawn → register | Same pipeline with a real `tinyaws.build` |
| [49 — First app](/building-the-cloud/chapter-49-deploying-your-first-app) | Five-command happy path | Heavy compile, model download, remote Windows client |
| [50 — Multi-machine](/building-the-cloud/chapter-50-multi-machine) | Control plane vs workers | Here Windows is only a client; Arch runs control plane *and* agent |

Toy apps teach the commands. Kokoro teaches why image caching, bind addresses, and root privileges matter when the build is expensive and the client is not the same machine as the agent.

When it works, you get a TTS playground at `http://<arch-ip>:3000/` — Debian userspace on Arch, driven from Windows, with no container runtime in the middle.
