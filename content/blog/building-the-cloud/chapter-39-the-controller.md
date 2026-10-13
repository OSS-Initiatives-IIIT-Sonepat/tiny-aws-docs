---
title: "Chapter 39: The controller -- cleaning up after yourself"
description: "A reconciliation loop that removes workspace directories for terminated instances"
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-01-31"
---

Instances get terminated. Jobs finish. Workspaces pile up. Something has to clean up.

The controller is that something. It lives in `control-plane/controller/main.go` -- 104 lines, the shortest service in the entire project. It polls the registry every 15 seconds, finds terminated instances, and removes their workspace directories.

---

## The full picture

Here is the entire controller. It is short enough to show without editing:

```go
package main

import (
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "path/filepath"
    "time"
)

type Instance struct {
    ID     string `json:"id"`
    Status string `json:"status"`
}

func registryURL() string {
    if v := os.Getenv("REGISTRY_URL"); v != "" {
        return v
    }
    return "http://127.0.0.1:9000"
}

func workspacePath(instanceID string) string {
    return filepath.Join(os.TempDir(), "tinyaws", instanceID)
}

func reconcileOnce(cleaned map[string]bool) {
    resp, err := http.Get(registryURL() + "/instances")
    if err != nil {
        log.Printf("reconcile: registry unreachable: %v", err)
        return
    }

    var instances []Instance
    if err := json.NewDecoder(resp.Body).Decode(&instances); err != nil {
        resp.Body.Close()
        log.Printf("reconcile: decode error: %v", err)
        return
    }
    resp.Body.Close()

    for _, inst := range instances {
        if inst.Status != "terminated" || cleaned[inst.ID] {
            continue
        }
        path := workspacePath(inst.ID)
        if err := os.RemoveAll(path); err != nil {
            log.Printf("reconcile: remove workspace %s: %v", path, err)
        } else {
            log.Printf("reconcile: cleaned workspace %s", path)
            cleaned[inst.ID] = true
        }
    }
}

func main() {
    listenAddr := os.Getenv("CONTROLLER_ADDR")
    if listenAddr == "" {
        listenAddr = ":9002"
    }

    cleaned := make(map[string]bool)

    go func() {
        ticker := time.NewTicker(15 * time.Second)
        defer ticker.Stop()
        for range ticker.C {
            reconcileOnce(cleaned)
        }
    }()

    http.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        fmt.Fprintln(w, `{"status":"healthy","service":"controller"}`)
    })

    http.HandleFunc("POST /reconcile", func(w http.ResponseWriter, r *http.Request) {
        reconcileOnce(cleaned)
        w.Header().Set("Content-Type", "application/json")
        fmt.Fprintln(w, `{"reconciled":true}`)
    })

    log.Printf("controller listening on %s", listenAddr)
    log.Fatal(http.ListenAndServe(listenAddr, nil))
}
```

That is the whole file. Let's walk through each piece.

---

## reconcileOnce

The core function runs one reconciliation pass: `GET /instances` from the registry, filter to `terminated`, skip anything already cleaned, `os.RemoveAll` on the workspace path, mark as cleaned if removal succeeds. If `RemoveAll` fails, the instance is not marked -- it will be retried next cycle.

---

## The cleaned map

```go
cleaned := make(map[string]bool)
```

A plain in-memory map. Once an instance ID has been cleaned, it stays in this map so the controller does not re-attempt every 15 seconds. If the controller restarts, the map is lost -- which is fine, because `os.RemoveAll` on a non-existent path returns nil.

No persistence. No database. The map grows by one entry per terminated instance and never shrinks. For a local cluster with hundreds of instances, not millions, this is acceptable.

---

## workspacePath

```go
func workspacePath(instanceID string) string {
    return filepath.Join(os.TempDir(), "tinyaws", instanceID)
}
```

This mirrors the agent convention. When the agent provisions an instance, it creates a workspace at `$TEMP/tinyaws/{instance-id}`. On Linux, that resolves to `/tmp/tinyaws/i-abc123`. The controller computes the same path and removes it. The coupling is by convention, not contract -- if the agent changes its scheme, the controller silently breaks.

---

## The 15-second loop and POST /reconcile

Every 15 seconds, one pass runs in a background goroutine. If you do not want to wait, `POST /reconcile` triggers it immediately. The same `cleaned` map is shared between the background loop and the on-demand endpoint, so there is no double-cleanup.

---

The controller is the janitor. It polls every 15 seconds, checks what has been terminated, and sweeps up the workspace. Less than 100 lines.
