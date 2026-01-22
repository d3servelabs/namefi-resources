---
title: "Introducing Route402 — an x402 facilitator router"
date: '2026-01-22'
language: en
tags: ['infrastructure', 'payments', 'x402']
authors: ['namefiteam']
draft: false
description: A multi-tenant router that exposes /verify, /settle and /supported, then chooses the right upstream facilitator using capability checks + a tiny YAML DSL — with encrypted credentials, RBAC, and sticky settlement.
keywords: ['Route402', 'x402', 'payments routing', 'facilitator router', 'multi-tenant payments', 'RBAC', 'credential encryption', 'capability routing', 'sticky settlement', 'payments infrastructure', 'YAML routing rules']
---

There are two kinds of problems in payments-ish systems:

1. The ones you *think* you have (“I just need to call `/verify` and `/settle`”).
2. The ones you discover the moment you add a second facilitator provider and realize you’ve built a routing problem, a secrets problem, and an idempotency problem… all at once.

[x402](https://www.x402.org/) is neat because it standardizes the shape of “paywall-ish” flows. But the moment you have **multiple facilitators** (or multiple environments, or multiple teams, or multiple networks), your application starts accruing logic that it really shouldn’t own.

So we built **Route402**: a **multi-tenant x402 facilitator router** that pretends to be *one* facilitator to your app, while actually proxying to *many* upstream facilitators — safely, deterministically, and with just enough operational tooling to not hate yourself later.

> Proxies are cheap. Settlements are not.

## Links

- [Source code](https://github.com/d3servelabs/labs-route-402)
- [Deployed app](https://labs-route-402.vercel.app/)

## The problem (a.k.a. “why is this code in my app?”)

The initial integration is always straightforward:

- Call `GET /supported` to see what’s possible.
- Call `POST /verify` to validate a payment payload.
- Call `POST /settle` to settle it.

Then reality happens:

- You want [Coinbase CDP](https://www.coinbase.com/developer-platform) in prod, but [thirdweb](https://thirdweb.com/) in staging.
- One provider supports `(scheme=exact, network=base)` but not the rest.
- You want USDC on Base to go one place, everything else somewhere else.
- You want to rotate credentials without redeploying apps.
- And you absolutely do **not** want to accidentally settle the same thing via two different providers because you “retried” and your load balancer got creative.

At this point, your app becomes the router. Which is a terrible job for an app.

## The shape of the solution

Route402 does one boring (and therefore useful) thing:

**Expose a facilitator-compatible facade:**

- `POST /api/facilitator/verify`
- `POST /api/facilitator/settle`
- `GET  /api/facilitator/supported`

…and for every request, select an upstream facilitator connection based on:

- **Project** (multi-tenant)
- **Capabilities** (don’t route to a provider that can’t support the request)
- **Routing rules** (simple YAML, first match wins)
- **Sticky settlement** (the part that prevents “double settle” foot-guns)

Your app calls Route402. Route402 calls the right upstream provider.

## Control plane vs data plane

I like systems where you can draw a line between “humans messing with config” and “machines handling traffic”.

Route402 has:

- **Control plane (dashboard):** orgs, projects, members, connections, rulesets, API keys, logs.
- **Data plane (facade endpoints):** authenticate → evaluate → route → call upstream → normalize → log.

This matters because it keeps your application code out of the “who are we settling with today?” decision.

## Multi-tenancy + [RBAC](https://csrc.nist.gov/glossary/term/role_based_access_control) (the unsexy prerequisite)

Route402 is structured as:

- **Organization**
  - members with roles (`owner`, `admin`, `viewer`)
- **Project**
  - contains runtime configuration: facilitator connections, rules, API keys, logs

And yes, RBAC is enforced server-side — because “the UI hides the button” is not a security model.

Viewers can’t see secrets. Admins can rotate keys. Owners can manage org membership. You get the idea.

## Credentials: encrypted at rest ([AES-256-GCM](https://www.nist.gov/publications/recommendation-block-cipher-modes-operation-galoiscounter-mode-gcm-and-gmac))

Facilitator credentials are stored encrypted in the database.

- A master key (`ROUTE402_MASTER_KEY`) derives **per-project keys** ([HKDF](https://www.rfc-editor.org/rfc/rfc5869.html)).
- Values are encrypted with **AES‑256‑GCM**.
- Decryption only happens in-memory inside request scope.

This is one of those “not negotiable” features. If your DB leaks, the goal is: **the attacker still doesn’t have your upstream facilitator creds**.

## Capabilities: don’t route nonsense

Before Route402 even looks at rules, it filters candidate connections down to those that are:

- **enabled**, and
- known to support the request’s `(scheme, network)` from cached `/supported` responses

This is the difference between:

- “we matched rule #2, ship it”
- and “we matched rule #2, but the chosen provider literally can’t do Base, so… no.”

We refresh capability caches when a connection is saved, and also on a schedule (see jobs later).

## Routing rules: [YAML](https://yaml.org/) (because shipping code for routing is silly)

The routing DSL is intentionally small. It’s ordered, **first match wins**, with a `default`.

```yaml
default: "thirdweb-prod"
rules:
  - name: base-usdc
    when:
      all:
        - eq: [network, "base"]
        - eq: [asset, "USDC"]
    then:
      use: "cdp-base"
```

The routing context is derived primarily from `paymentRequirements`:

* `scheme`
* `network`
* `asset`
* `amount`
* `payTo`
* `endpoint` (`verify` | `settle`)

Predicates are boring on purpose:

* `all`, `any`, `not`
* `eq`, `in`

No regex golf. No arbitrary code execution. Just deterministic routing you can review in a PR without having to light a candle.

## Verify vs settle: this is where people get hurt

There are two endpoints that *look* similar and behave very differently:

* `/verify` is “validate”
* `/settle` is “move money / finalize”

Treating them the same is how you end up writing postmortems.

### `/verify`: conservative fallback is fine

For `verify` we do:

1. authenticate API key → project
2. build routing context
3. filter eligible connections (capability-aware)
4. evaluate rules → pick a connection
5. call upstream adapter `verify()`
6. optionally fall back to another eligible connection *if* the failure is transient and semantics won’t change
7. return normalized response

For debuggability, we emit:

* `x-route402-connection`
* `x-route402-rule`

Because “it routed somewhere” is not an explanation.

### `/settle`: no improvisation (sticky or bust)

For `settle`, we do something stricter:

We compute a deterministic fingerprint:

* `fingerprint = sha256(stableJson({ paymentPayload, paymentRequirements }))`

Then we enforce **sticky routing**:

* If we’ve ever seen this fingerprint before, we re-use the *same* connection.
* If we haven’t, we pick one via rules and **persist the decision**.

This eliminates a whole class of “oops we retried and hit another provider” problems.

> If you load-balance settlement, you will have a bad time.

### Unknown outcomes (the reality of networks)

Sometimes upstreams time out or return something ambiguous. In that case:

* mark settlement state as `unknown`
* store an **encrypted** copy of the settle request for reconciliation
* return `503` with a `requestId`
* enqueue a reconciliation job

This gives you a clean operational path to determine what happened later, without lying to callers.

## Adapters: normalize the mess

Each upstream facilitator is wrapped behind a tiny adapter interface:

* `supported()`
* `verify()`
* `settle()`

Adapters normalize provider-specific details into one response shape, and we avoid returning raw upstream responses (especially anything that may contain sensitive internals).

This is also where you future-proof yourself: swapping providers becomes a config change, not an application refactor.

## Background jobs ([Trigger.dev](https://trigger.dev/docs)): reliability without latency

Some work is important but doesn’t belong on the request path:

* **Capability refresh**: fetch and cache `/supported`
* **Settlement reconciliation**: retry/check unknown settlements idempotently

This keeps your P95s honest and your operators sane.

## Observability: log decisions, not secrets

Every request produces a routing decision record:

* endpoint (`verify` / `settle`)
* chosen connection
* rule name (`default`, specific rule, `fallback`, `sticky`)
* latency
* result status (ok/error/unknown)
* settle fingerprint hash (never raw payload)

The dashboard lets you filter by connection/rule/status/time and compute basic latency stats.

The goal is simple: you should be able to answer **“what happened and why?”** without printing secrets to stdout and hoping nobody screenshots it.

## Calling the facade (what your app actually does)

Once you have a project API key, usage is intentionally boring:

```sh
curl -X POST "$ROUTE402_URL/api/facilitator/verify" \
  -H "Authorization: Bearer r402_..." \
  -H "Content-Type: application/json" \
  -d '{
    "paymentPayload": { "...": "..." },
    "paymentRequirements": {
      "scheme": "exact",
      "network": "base",
      "asset": "USDC",
      "amount": "10",
      "payTo": "0x0000000000000000000000000000000000000000"
    }
  }'
```

You’ll get a normalized response and headers like:

* `x-route402-connection: cdp-base`
* `x-route402-rule: base-usdc`

…and now when someone pings you with “hey verify is failing”, you don’t have to guess where it routed.

## Pro tips (earned the hard way)

1. **Treat settlement as a state machine**, not a boolean.
2. **Persist routing decisions** for settle. You don’t want “best effort” here.
3. **Encrypt credentials at rest**. Not “later”. Now.
4. **Capabilities are a filter, not a suggestion.** Don’t route what can’t work.
5. **Log decisions, not payloads.** You can debug without leaking secrets.

---

## Closing

Route402 is not novel in the academic sense — it’s just the set of pragmatic constraints you end up implementing once you’ve shipped a few integrations and survived a few retries.

But that’s kind of the point.

It’s a facilitator façade that lets your app integrate once, while you keep the freedom to change providers, routing, and credentials without turning “payments plumbing” into your entire product.
