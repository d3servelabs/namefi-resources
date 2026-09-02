# Keyword Volume Tool — Design Document

**Namefi** · internal editorial and campaign planning tool · 2026-09-02

---

## 1. What this tool is

Namefi (namefi.io) is an **ICANN-accredited domain name registrar** — IANA
Registrar ID **4337**, listed by IANA as *D3Serve Labs Inc. dba Namefi*, status
*Accredited*. We advertise our own products on Google Ads.

This tool is an **internal script**, run from our own code repository by our
marketing and content team. It retrieves keyword search volume from the Google
Ads API and writes it to a local JSON file, which our team then uses to plan
campaigns and the pages those campaigns point to.

It is not a product, not a service, and not accessible to anyone outside the
company.

## 2. Why we need the API

We use it for two connected parts of running our Google Ads campaigns.

**Campaign planning.** Which search terms to bid on, how to group them into ad
groups, and how to write ad copy in the language customers actually use.

**Landing pages.** Each ad group points at a relevant set of pages — a product
feature, or an explainer answering the industry question behind that group's
keywords — so that the page a user arrives on answers what they searched for.
This improves ad relevance and landing page experience, and lifts conversion.

The second part is why keyword data reaches our editorial process: search terms
tell us which questions prospective customers are actually asking, and those
questions determine which pages we write and how we structure them. The pages
exist to serve users who arrive from our ads; they are not written to be
redirects, and each carries original content that stands on its own.

## 3. Which services we call

| Service | Method | What we read |
| --- | --- | --- |
| `KeywordPlanIdeaService` | `GenerateKeywordIdeas` | keyword ideas for a seed set |
| `KeywordPlanIdeaService` | `GenerateKeywordHistoricalMetrics` | average monthly searches, monthly history |

We do **not** call campaign, ad group, ad, budget or account mutation services.
The tool is read-only with respect to the Google Ads account: it creates
nothing, modifies nothing and deletes nothing.

## 4. Architecture

```
  target queries (JSON, per locale)
            |
            v
  +---------------------------+
  |  api.ts                   |   library entry point
  |  searchVolume(specs)      |   upper layers call this
  +---------------------------+
            |
            v
  +---------------------------+
  |  VolumeProvider interface |   one interface, swappable sources
  +---------------------------+
            |
            v
  +---------------------------+
  |  googleads.ts             |   OAuth2 refresh -> access token
  |  GoogleAdsProvider        |   POST :generateKeywordIdeas
  +---------------------------+
            |
            v
  local JSON file  ->  read by our content and marketing team
```

Four files, roughly 500 lines in total:

- `provider.ts` — the interface every source implements, the locale-to-market
  map, and the result shape.
- `googleads.ts` — the Google Ads provider: token exchange, request building,
  response mapping.
- `api.ts` — the library entry point (`searchVolume`, `activeProvider`,
  `toSpecs`). This is what upper layers import.
- `index.ts` — a thin command-line wrapper over `api.ts`.

## 5. Call volume

Small and bursty, not a polling loop. Our full editorial backlog is 100
candidate topics carrying 640 unique (query, locale) pairs, which groups into
**two requests** — one per market. We run this when the backlog is re-planned,
on the order of once a month, not continuously.

There is no scheduled job, no retry storm and no per-user traffic: a person runs
the script, it makes its requests, and it exits.

## 6. Who has access

**Internal users only** — our own employees on the marketing and content team.

The tool is not sold, not offered to clients, and not exposed to the public.
There is no user interface, no hosted endpoint and no multi-tenant behaviour. It
runs on a team member's own machine against Google Ads accounts we own, under
our own manager account.

## 7. Credentials and security

Five values are required: developer token, OAuth2 client ID and secret, refresh
token, and the manager account ID.

They are read from the process environment and **never logged, never printed and
never committed**. On developer machines they are held in a local encrypted
secrets broker and injected into the process for the duration of one run. The
repository contains no credential and no credential file; `.env.local` is
outside the repository tree.

## 8. Data handling

- **Storage.** Results are written to a local JSON file used by our own team.
- **Retention.** Superseded on each run; we keep only the current planning cycle.
- **Sharing.** We do **not** display, redistribute, resell or otherwise expose
  Google Ads data to any third party. It is never rendered on our website, never
  sent to another service, and never included in anything we publish.
- **No invented figures.** A failed request, a keyword absent from the response,
  and an unconfigured provider are three distinct states, and all three are
  recorded as `null` with a stated reason. None of them is recorded as a zero.
  Nothing downstream ever reports a number the API did not return.

## 9. Compliance notes

- The tool falls under the API's **"researching keywords and recommendations"**
  permissible use: it accesses `KeywordPlanIdeaService` to obtain suggestions
  that facilitate the creation and management of our own Google Ads campaigns.
- **Required Minimum Functionality does not apply**: RMF governs Standard access
  and tools serving external users. This is an internal tool on our own accounts
  requesting Basic access.
- Landing pages built with this research carry original content and are not
  designed to send users elsewhere, consistent with Google's destination
  requirements. Our editorial standards — every claim cited, each page useful on
  its own — are what keep that true in practice.

## 10. Contact

API contact: dev-team@namefi.io · Manager account: 350-597-6042 ·
Google Cloud project: 86583255333 · IANA Registrar ID: 4337
