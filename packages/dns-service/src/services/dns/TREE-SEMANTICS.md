# DNS Tree Semantics

This service is an authoritative DNS server. Every response it produces has to answer a tree question, not a row-lookup question. This document is the single source of truth for how that tree is modeled, queried, and projected into DNS response codes. Every link under `links/` should point back here in its header doc.

## The tree, not the table

A DNS name is a **node** in a tree. Labels are read right-to-left: `www.example.com.` is the node `www` under `example` under `com` under the root `.`. Records (A, AAAA, TXT, MX, NS, SOA, …) live **on** nodes. A node *exists* in the tree iff any of the following is true:

1. The node carries at least one record of any type, **or**
2. Any descendant of the node carries a record (the node is then an "empty non-terminal" / ENT).

Rule (2) is the one that surprises row-oriented thinking: a node with no records of its own still exists in the tree as long as something lives below it.

### Worked example

Say the only record in the zone is an A record at `a.b.c.`. Then the existence map is:

| Query | Node exists? | Why |
|---|---|---|
| `a.b.c.` | yes | record at this name |
| `b.c.` | yes | descendant `a.b.c.` exists below it (ENT) |
| `c.` | yes | descendant `a.b.c.` exists below it (ENT) |
| `d.` | no | no records at or below |
| `x.a.b.c.` | no | no records at or below |

A DNS server that returns `NXDOMAIN` for `b.c.` in this world is **wrong** — that node is implicitly created the moment anything lives below it (see RFC 8020 "NXDOMAIN cut"). It has to return `NOERROR` with empty Answer (NODATA).

## Response codes as projections of tree state

| State | Return |
|---|---|
| Node has records of the requested type | `RCODE=0` + non-empty `Answer` |
| Node exists (records of another type OR descendants only) | `RCODE=0` + empty `Answer` (**NODATA**) |
| Node does not exist at all (no records at or below) | `RCODE=3` (**NXDOMAIN**) |

Per RFC 2308 §3, both negative outcomes (NXDOMAIN and NODATA) **must include an SOA in the Authority section** so that caching resolvers can negative-cache with a correct TTL. This server does that in `zone-ns-soa-link.ts` and `relay-zone-authority-link.ts`.

The RFC reading list:
- RFC 1034 §3 — the tree model.
- RFC 1035 §4.3.2 — the standard query algorithm.
- RFC 2308 §§2–3 — negative caching, Authority SOA for NXDOMAIN and NODATA.
- RFC 8020 — "NXDOMAIN cut": NXDOMAIN at a name implies NXDOMAIN for everything below it, so don't produce NXDOMAIN for names that have descendants.

## Storage convention (`dns_records` table)

See `packages/db/src/schema.ts:654-702`. Columns that matter for tree lookups:

- `zoneName` — the zone the record belongs to, stored as a normalized FQDN (lowercase, no trailing dot).
- `name` — per RFC-1034 §3.6:
  - `'@'` (sentinel) when the record sits on the zone apex.
  - A single label (`'www'`) for a child directly under the zone.
  - A longer in-zone name is also stored as a sub-name relative to the zone, never repeating the zone suffix.
- `type`, `ttl`, `rdata` — standard DNS.

The **full node name** of a record is therefore:

```sql
CASE
  WHEN name IN ('@', '') THEN zoneName
  ELSE name || '.' || zoneName
END
```

Every tree query should compute that full name and convert it into a label array before comparing.

## Postgres helpers

Defined in `packages/db/src/migrations/0085_records_and_zones_helpers.sql`, surfaced via drizzle in `packages/db/src/drizzle-helpers/index.ts`.

| SQL function | Drizzle wrapper | Tree concept |
|---|---|---|
| `dns_labels_from_text(name)` | `dnsLabelsFromText` | Turn `a.b.c` into `['a','b','c']`; handles `@` sentinel (drops it). |
| `dns_labels_from_text_array(parts)` | `dnsLabelsFromTextArray` | Same, but takes an array input. |
| `labels_exact_match(a, b)` | `labelsExactMatch` | "Same node." |
| `is_apex_match(a, b)` | `isApexMatch` | Alias for `labels_exact_match` (for readability at zone-apex call sites). |
| `is_immediate_sibling(a, b)` | `isImmediateSibling` | Nodes share a parent. |
| `is_second_descendant_of_first(a, b)` | `isSecondDescendantOfFirst` | `b` is strictly under `a` in the tree. |
| `string_array_match_count(a, b, 'start'/'end')` | `stringArrayMatchCount` | Count the common prefix / suffix of two label arrays (used for closest-zone matching). |

### Node existence check in Drizzle

The tree-aware resolver in `links/helpers.ts` uses these helpers like this:

```ts
// Full node-labels for each dns_records row.
const recordLabels = dnsLabelsFromText(sql<string>`
  CASE
    WHEN ${dnsRecordsTable.name} IN ('@', '') THEN ${dnsRecordsTable.zoneName}
    ELSE ${dnsRecordsTable.name} || '.' || ${dnsRecordsTable.zoneName}
  END`);
const queryLabels = dnsLabelsFromText(recordName);

// 1) Records AT the queried node.
const atNode = await db.query.dnsRecordsTable.findMany({
  where: labelsExactMatch(recordLabels, queryLabels),
});

// 2) If none, is the node an ENT (any descendant exists)?
const hasDescendants = /* EXISTS query using isSecondDescendantOfFirst(queryLabels, recordLabels) */;

// Decide RCODE based on (atNode, hasDescendants, requested record type).
```

## Where each piece of the pipeline fits

- `links/helpers.ts` — owns the tree-semantic *decision*: given a name and a type, what tree state is this, and therefore what RCODE + Answer? Everything else layers on top of its output.
- `links/zone-ns-soa-link.ts` — owns NS/SOA for a Namefi-authoritative zone (NFT or powered-by). Adds Authority SOA on both NXDOMAIN and NODATA (RFC 2308).
- `links/relay-zone-authority-link.ts` — same role as zone-ns-soa-link but for the synthetic relay zone (`NAMEFI_UNOFFICIAL_TLDS_RELAY_ZONE`).
- `links/unofficial-tld-relay-link.ts` — does the label rewrite on the relay zone; doesn't change RCODE.
- `links/rewrite-relayed-link.ts` — composition of the two relay-specific links.
- `links/combinators.ts` — generic `mergeLinks` + `switchLink`; don't touch RCODE.
- `links/resolving-link.ts` / `links/conditional-resolving-link.ts` — generic wrappers around an `DnsAnswerResolver`; take the resolver's RCODE verbatim.
- `links/wildcard-termination-link.ts` — short-circuits wildcard queries to NXDOMAIN (we don't serve them).
- `links/termination-link.ts` — finalizer; defaults `RCODE` to `0` and `Answer` to `[]` if a link forgot to set them.
- `links/logging-link.ts` — observation only; never changes the response.

If you're adding a new link, decide which of those tiers it belongs to and follow the tree-semantic rules for that tier.
