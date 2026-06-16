# Postmortem: Read-only Redis took down the whole backend via CORS

- **Date:** 2026-06-16
- **Status:** Resolved — immediate recovery by manually resetting the Redis
  primary; code fix landed to prevent recurrence; infra follow-ups open
- **Severity:** SEV1 — full backend outage (all API traffic, all origins)
- **Authors:** Backend team
- **Related:** rule `.claude/rules/redis-fallback-only.md`

## Summary

The backend's CORS middleware resolved allowed origins by reading the
"powered-by-namefi" domain list, which is cached in Redis. On a cache miss it
**wrote** the freshly-loaded list back to Redis. When the Redis instance flipped
to **read-only**, that write (`redis.set`) was rejected and threw. The rejection
had no error handling, so it propagated out of the CORS origin resolver and into
the Hono `cors()` middleware that runs on **every** request. From that point
every request — including first-party, same-origin app traffic — failed CORS and
the service was effectively down.

The trigger was an infrastructure event: a firewall change to the Redis VMs the
day before (2026-06-15) most likely disrupted replication between the primary and
its replicas, leaving the app — which connects to a single fixed endpoint with no
failover awareness — talking to a node that was (or became) a read-only replica.
The reason this became a **total outage** rather than a degraded cache was a code
defect: Redis was treated as a hard dependency on the hottest possible path
(CORS origin resolution) instead of as a fallback cache.

**Immediate recovery:** on-call **manually reset the Redis primary** (restoring a
writable primary at the endpoint the app connects to), which brought the service
back quickly. That was a stopgap; the code fix below is what prevents a future
read-only Redis from taking the site down. See Root cause below.

## Impact

- All backend API requests rejected for the duration of the incident.
- Frontend app unusable (API + auth calls blocked at the CORS layer).
- The `browser-logs-proxy` router (same hostname-resolution dependency) also
  affected.
- Read-only Redis means **writes** failed; reads on the same path would have
  succeeded on a cache hit — so the failure manifested specifically on cache
  misses / first request after TTL expiry / first request after a deploy.

## Timeline (to be filled from logs/metrics)

| Time (UTC) | Event |
|------------|-------|
| 2026-06-15 | Firewall rules on the 4 Redis VMs changed (`allow-redis-known` pri 0, `deny-redis-public` pri 1; deleted `redis-vm1-external`). Existing connections survive (GCP firewall is stateful), so no immediate impact. |
| T0 | A reconnect (blip / node restart) hits the **new** rules; primary↔replica replication traffic is now denied → the endpoint the app is pinned to is (or becomes) a read-only replica. |
| T0+ | First CORS cache-miss request triggers `redis.set` against the (now read-only) node, which is rejected with `READONLY`; CORS middleware throws. |
| T0+ | Error rate spikes to ~100%; all origins blocked. |
| T1 | On-call paged / outage detected. |
| T2 | **On-call manually resets the Redis primary**, restoring a writable primary at the app's endpoint. |
| T3 | Service recovers. |

> Action: backfill exact timestamps — firewall-rule creation time, the
> replication-break / role-change event, and the error-rate spike — to confirm
> ordering.

## Root cause

Two independent factors combined:

### 1. Trigger — a firewall change broke primary↔replica replication, leaving the app on a read-only node (infrastructure)

**Leading hypothesis (strong).** On 2026-06-15 a teammate strangled public access
to the 4 Redis VMs (a P0 security task):

- `allow-redis-known` (priority 0): `35.192.19.153/32` (serverless egress) +
  `10.0.0.0/8` → `tcp:6379,26379`
- `deny-redis-public` (priority 1): `0.0.0.0/0` → `tcp:6379,26379` (beats the
  existing `namefi` allow-all at the same priority — in GCP, deny wins ties)
- Deleted `redis-vm1-external` (`0.0.0.0/0 → tcp:6379`)

The setup is a **Redis primary–replica cluster** (4 VMs; `6379` = Redis
replication). Whether a failover orchestrator is deployed — Redis **Sentinel** on
`26379`, a managed/provider failover, or none (manual promotion) — is **not yet
confirmed**; the analysis below holds either way. The application connects with a
**plain single-endpoint client** — `createClient({ url: MAIN_REDIS_URL })` in both
`apps/backend/src/lib/redis.ts` and `packages/dns-service/src/lib/redis.ts`, with
**no Sentinel/Cluster discovery** — so it is pinned to one node's address and
cannot follow a topology change. That makes a read-only node fatal:

1. The new rules allow Redis traffic **only** from `35.192.19.153/32` and
   `10.0.0.0/8`. Any replication (or, if present, Sentinel) path outside those
   ranges is now silently denied — breaking the primary↔replica link.
2. The node the app is pinned to ends up **read-only**, via either path:
   - **(a) Failover/promotion** — if an orchestrator (Sentinel or managed) is
     present, it promotes a replica and **demotes the old primary** the app talks
     to into a read-only replica; or
   - **(b) `min-replicas-to-write`** — if the primary is configured to require N
     connected replicas and the firewall dropped them below the threshold, the
     **primary itself refuses writes** while still serving reads. This needs **no
     failover and no Sentinel** — just a broken replication link.
3. The app, pinned to that node's URL, sees `GET` succeed (reads are served) but
   `SET` fail with `READONLY You can't write against a read only replica.`
4. The unguarded `redis.set` on the CORS path (amplifier #2 below) throws → outage.

That the incident was cleared by **manually resetting the primary** (T2) is
consistent with both (a) and (b): re-promoting / restarting restores a writable
primary at the app's endpoint.

**Why the ~1-day delay (applied 06-15, outage 06-16):** GCP firewall is
**stateful**. Already-established replication connections kept working after the
change; the denial only bit on the first **reconnect** (a network blip or node
restart), at which point the link could not re-form and the node went read-only.

**Why "verified, no traffic disrupted" missed it:** the verification was a
point-in-time snapshot of **established** connections (peers `35.192.19.153` +
`10.128.0.3/4/5`). A stateful firewall keeps those alive, so a snapshot cannot
observe the failure — it only appears on new/reconnecting flows. Gaps to check:

- **Cluster-bus port `16379` not in the allow-list.** If this is Redis **Cluster
  mode** (`cluster-enabled yes`), every node also needs the cluster bus —
  client-port + 10000 = `16379` — for gossip, failure detection, and failover
  coordination. `allow-redis-known` covers only `tcp:6379,26379`, so 16379 is
  **not** allowed. (It's not denied by `deny-redis-public` either, so it's
  currently carried by the still-open `namefi` all-ingress catch-all — meaning
  **completing the open P1 (removing that catch-all) would sever cluster-bus
  traffic and could cause a second outage** unless 16379 is added first.) Note
  `26379` (Sentinel) vs `16379` (Cluster bus) are different architectures —
  which port the nodes actually use tells you which topology you have.
- **`replica-announce-ip` / `announce-ip` set to public IPs.** If nodes (or
  Sentinels, if deployed) advertise each other via *external* IPs, that traffic
  now hits `deny-redis-public`. Most common cause of "firewall change → broken
  replication."
- **Nodes/subnets outside `10.0.0.0/8`** (e.g. a `172.16.0.0/12` or
  `192.168.0.0/16` subnet, or a cross-region/peered VPC) — denied.
- **Missing GCP health-check ranges** `35.191.0.0/16` and `130.211.0.0/22`. A
  failing health check on 6379/26379 can drive a promotion.
- **App egress wider than `/32`.** Cloud NAT / Direct VPC egress may use multiple
  IPs; pinning to a single `35.192.19.153/32` denies the rest (this presents as
  connection errors rather than read-only, but rule it out).

**Other (now lower-probability) hypotheses**, still worth excluding from metrics:

- **Memory pressure + `maxmemory-policy noeviction`** → OOM on writes, reads OK.
  Small PBN blob, but rate-limit/notification/auth/lock keys accumulate.
- **Provider/maintenance window** or **failed RDB bgsave** with
  `stop-writes-on-bgsave-error yes`.

> Action — confirm topology, ordering, and mechanism:
> 1. **Confirm the topology:** is this Redis **Cluster mode** (uses the cluster
>    bus on `16379`) or primary–replica with **Sentinel** (`26379`) / managed /
>    manual? Which inter-node port is actually in use settles the architecture.
>    Also check whether `min-replicas-to-write` is set. This decides between
>    mechanism (a) and (b) above — and whether `16379` must be in the allow-list.
> 2. Correlate the firewall-rule creation time + last node reconnect with the
>    error-rate spike.
> 3. Redis (and Sentinel, if present) logs around T0: replica `MASTER <-> REPLICA
>    sync` / socket errors point to a broken link; `+switch-master` / `+failover`
>    (Sentinel) or a role change confirms a promotion.
> 4. `redis-cli -h <MAIN_REDIS_URL host> INFO replication` — `role:slave` (or a
>    `master` with `min_slaves_to_write` unmet) confirms why writes were rejected.
> 5. VPC Flow Logs / `deny-redis-public` hit counts for `tcp:6379,26379` with
>    intra-cluster or health-check sources after the change.

### 2. Amplifier — Redis was a hard dependency on the CORS hot path (code)

`apps/backend/src/lib/namefi-registry.ts :: getPoweredByNamefi3PDomainsDetails`
did, with **no error handling**:

```ts
const redis = await getRedisClient();
const cachedDomainsString = await redis.get(POWERED_BY_NAMEFI_DOMAINS_CACHE_KEY);
const cachedDomains = cachedDomainsString ? superjson.parse(...) : undefined;
const poweredbyNamefiDomains = cachedDomains ?? (await db.query...findMany());
if (!cachedDomains) {
  await redis.set(POWERED_BY_NAMEFI_DOMAINS_CACHE_KEY, ..., { EX: 12h }); // <-- threw on read-only Redis
}
```

This function is reached on **every request** through
`apps/backend/src/index.ts :: resolveCorsOrigin` →
`getPoweredByNamefi3PHostnames()`. A thrown rejection there rejects the CORS
`origin` callback, which fails the request before any route handler runs.

Notably, the **dns-service** copy of this logic
(`packages/dns-service/src/lib/namefi-registry.ts`) already had the correct
try/catch-and-fall-back-to-DB pattern — the backend copy had drifted from it and
lost the resilience.

## What went well

- **Fast recovery.** Once diagnosed, manually resetting the Redis primary restored
  a writable endpoint and the service recovered quickly.
- The `dns-service` package, rate limiter (`#lib/rate-limit.ts` in-memory
  insurance limiter), and notification cache (`#lib/notifications/cache.ts`)
  already degrade gracefully on Redis failure — the pattern existed, it just
  wasn't applied uniformly.

## What went wrong

- A cache was treated as a hard dependency on the single hottest code path.
- The most dangerous operation — a **write** — was unguarded; read-only Redis is
  exactly the failure mode that breaks writes while leaving reads working, so it
  evaded any "Redis is totally down" intuition.
- The resilient pattern existed in a sibling package but wasn't shared/enforced.

## Fixes

### Code (landed)

1. Added a shared `fromCacheOrFallback(...)` cache-aside helper to `#lib/redis`
   (both `apps/backend` and `packages/dns-service`): hit → return; miss →
   `fallback()` + best-effort write-back; any Redis read/write error → throttled
   `fatal` + `fallback()`. A read-only Redis can no longer fail a cache call.
2. Converted every recomputable (cache) Redis path to it:
   `getPoweredByNamefi3PDomainsDetails` (the CORS path),
   `dns-service` powered-by-namefi rows, and the park-gate token issuer.
3. Added `logRedisFallbackFailure(scope, error, message)`: a **throttled**
   `logger.fatal` (once per minute per scope, `debug` in between) so a sustained
   outage still pages on-call but does not emit thousands of fatal logs per
   minute.
4. Defense-in-depth in `resolveCorsOrigin` (`index.ts`): resolving the
   powered-by-namefi hostnames is wrapped so that even a total cache **and** DB
   failure degrades to **first-party-only** CORS instead of rejecting every
   request. First-party app traffic survives any backing-store outage.

### Process (landed)

5. New repo rule `.claude/rules/redis-fallback-only.md` codifying "Redis is a
   fallback, never a gate," with the canonical `fromCacheOrFallback` pattern, the
   source-of-truth exceptions (auth nonces, sessions, locks), and a pre-merge
   checklist.

### Infra follow-ups (open)

- [ ] **Document the Redis topology** (replica cluster only? Sentinel on `26379`?
      managed failover? `min-replicas-to-write` value?) — this is currently
      unknown and decides the exact mechanism.
- [ ] **Confirm the firewall→read-only chain** (see the Action steps under Root
      cause #1): correlate timestamps, check replication/role logs, and the
      `INFO replication` role of the `MAIN_REDIS_URL` node.
- [ ] **Make the client failover-aware.** The app connects to a single fixed
      endpoint (`createClient({ url })`) and cannot follow a promotion — it can
      get stranded on a read-only replica (the manual primary reset was the
      stopgap for exactly this). Point `MAIN_REDIS_URL` at a Sentinel-aware
      client (if Sentinel is deployed), a stable VIP/proxy, or the provider's
      configuration endpoint that always tracks the primary.
- [ ] **Close the firewall gaps before re-applying** (if reverted) **and before
      completing the open P1 catch-all removal**: add the cluster-bus port
      `16379` if Cluster mode is enabled (currently missing — its removal during
      P1 would break inter-node comms), include GCP health-check ranges
      `35.191.0.0/16` + `130.211.0.0/22`, any non-`10/8` internal subnets, and fix
      `replica-announce-ip`/`announce-ip` to internal addresses so replication
      (and Sentinel/cluster-bus, as applicable) stays inside `allow-redis-known`.
- [ ] **Coordinate Redis-VM firewall/topology changes** with a connectivity test
      that forces a reconnect (not just a snapshot of established connections),
      since GCP firewall is stateful and masks the impact until the next reconnect.
- [ ] Review `maxmemory`, `maxmemory-policy`, and `used_memory` headroom; audit
      Redis key TTLs (rate-limit / notifications / auth) to rule out unbounded
      growth as an alternate read-only cause.
- [ ] Add alerts on Redis `READONLY`/OOM error rate, `role=replica` for the
      `MAIN_REDIS_URL` node, and `deny-redis-public` hit count, so the next
      occurrence pages immediately and unambiguously.

## Lessons / action items

| # | Action | Owner | Status |
|---|--------|-------|--------|
| 1 | Shared `fromCacheOrFallback` helper + throttled fatal logging | Backend | Done |
| 2 | Convert all cache Redis paths (CORS, dns-service, park-gate) to the helper | Backend | Done |
| 3 | First-party-only CORS degradation as last resort | Backend | Done |
| 4 | Repo rule: Redis is fallback-only | Backend | Done |
| 5 | Audit all `getRedisClient` call sites against the new rule | Backend | Done |
| 6 | Document Redis topology (Sentinel? managed? `min-replicas-to-write`?) | Infra | Open |
| 7 | Confirm firewall → broken replication → read-only-node chain | Infra | Open |
| 8 | Make Redis client failover-aware (Sentinel/VIP/config endpoint) | Infra | Open |
| 9 | Re-apply firewall rules with health-check ranges + internal `replica-announce-ip` | Infra | Open |
| 10 | Connectivity test (force reconnect) for Redis-VM firewall/topology changes | Infra | Open |
| 11 | Alert on Redis read-only / OOM / replica-role / `deny-redis-public` hits | Infra | Open |
