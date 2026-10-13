---
title: "Chapter 45: IAM --- two roles and a bearer token"
description: "AWS IAM is one of the most complex systems ever built. tiny-aws has two roles: admin and readonly."
author: "tiny-aws"
inspiredBy: "tiny-aws docs"
date: "2026-02-06"
---

## The scope of real IAM

AWS IAM has policy documents with Effect/Action/Resource/Condition blocks.
Roles, users, groups, identity providers, permission boundaries, SCPs, session
tags, cross-account trust, STS. The policy evaluation logic alone is a
multi-page flowchart.

tiny-aws has two roles: `admin` and `readonly`. One table. Bearer tokens.

## The API key model

```go
type APIKey struct {
    Key       string  `json:"key"`
    Role      string  `json:"role"`       // "admin" or "readonly"
    ExpiresAt *string `json:"expires_at"` // RFC3339 or null
    CreatedAt string  `json:"created_at"`
}
```

```sql
CREATE TABLE IF NOT EXISTS api_keys (
    key TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK(role IN ('admin', 'readonly')),
    expires_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

A key is a string. A role is `admin` or `readonly`. NULL `expires_at` means
the key never expires.

## Resolving a key to a role

```go
func roleForKey(db *sql.DB, key string) (string, error) {
    // Check the root API key from environment first
    if rootKey := os.Getenv("TINYAWS_API_KEY"); rootKey != "" && key == rootKey {
        return "admin", nil
    }

    var role string
    var expiresAt sql.NullString
    err := db.QueryRow(
        "SELECT role, expires_at FROM api_keys WHERE key = ?", key,
    ).Scan(&role, &expiresAt)
    if err != nil {
        return "", fmt.Errorf("invalid api key")
    }

    if expiresAt.Valid {
        t, err := time.Parse(time.RFC3339, expiresAt.String)
        if err == nil && time.Now().After(t) {
            return "", fmt.Errorf("api key expired")
        }
    }
    return role, nil
}
```

Three paths: (1) `TINYAWS_API_KEY` env var matches -- admin. (2) Database
lookup by key. (3) Expiry check -- if past, reject.

## The auth middleware

```go
func authMiddleware(db *sql.DB, next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if r.URL.Path == "/health" ||
            r.URL.Path == "/nodes/register" ||
            r.URL.Path == "/nodes/heartbeat" {
            next.ServeHTTP(w, r)
            return
        }

        authHeader := r.Header.Get("Authorization")
        if !strings.HasPrefix(authHeader, "Bearer ") {
            http.Error(w, "missing or invalid authorization header", 401)
            return
        }
        token := strings.TrimPrefix(authHeader, "Bearer ")

        role, err := roleForKey(db, token)
        if err != nil {
            http.Error(w, err.Error(), 401)
            return
        }

        if role == "readonly" && r.Method != http.MethodGet {
            http.Error(w, "readonly key cannot perform writes", 403)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

`/health`, `/nodes/register`, and `/nodes/heartbeat` are exempt -- agents need
to register without API keys. Everything else requires a Bearer token.
`readonly` allows GET only. `admin` allows everything. No resource-level
permissions exist.

## Managing keys

`iam.go` exposes three endpoints:

**Create or update:** `POST /iam/keys` upserts into `api_keys`. The caller
chooses the key value -- no server-side generation.

```go
_, err := db.Exec(`
    INSERT INTO api_keys (key, role, expires_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET role = ?, expires_at = ?`,
    apiKey.Key, apiKey.Role, apiKey.ExpiresAt, apiKey.Role, apiKey.ExpiresAt,
)
```

**Delete:** `DELETE /iam/keys/{key}` removes the row. Immediate effect.

**List:** `GET /iam/keys` returns all keys with roles and expiry. Key values
are returned in full -- no masking on the list endpoint.

## What real IAM does differently

| Feature | AWS IAM | tiny-aws |
|---------|---------|----------|
| Policy language | Effect/Action/Resource/Condition | Two hardcoded roles |
| Temporary credentials | STS AssumeRole | Not implemented |
| Cross-account | Trust policies, external IDs | Single account |
| Resource-level perms | Per-API, per-resource ARN | Global read or write |
| Groups and roles | Assumable roles, group membership | Keys map to roles |
| MFA | TOTP, U2F, hardware tokens | Not implemented |

Real IAM evaluates a policy document for every API call, checking attached
policies, resource policies, permission boundaries, and SCPs. tiny-aws checks
if the role is `admin` or `readonly` and whether the method is GET.

## The bootstrap problem

When tiny-aws starts, the `api_keys` table is empty. The `TINYAWS_API_KEY`
environment variable solves this: it is checked before the database, so the
operator sets a root key at startup and uses it to create database-backed keys.
Same pattern as AWS root account credentials -- a bootstrap identity that
should be locked away after initial setup.

## Where it plugs in

```go
mux := http.NewServeMux()
// ... register all route handlers ...
handler := authMiddleware(db, mux)
http.ListenAndServe(":"+port, handler)
```

Every request hits auth first. Exempt paths pass through. Everything else
requires a valid, non-expired token with a sufficient role.

Two roles. One table. Bearer tokens in cleartext. Enough to demonstrate the
pattern.
