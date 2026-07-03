# Blockchain Concepts — "Top N" Roundup Initiative

**Audience:** people *learning* blockchain (developers, curious newcomers, would-be
builders) — **not** domain investors. Top-of-funnel authority content.
**Format:** ranked/compared "Top N" roundups (`format: roundup`).
**Home cluster:** `web3-foundations` ("Stablecoins, tokenized assets, zero-knowledge,
payment rails" — already exists in astra `taxonomy.ts`).
**Funnel role:** capture broad "what is FHE / best ZK proof systems" search intent →
each concept links into the **glossary** → glossary + soft product mentions carry the
reader toward Namefi. The roundups are the wide net; the glossary is the landing net.

## Editorial rules for every roundup

- **A scoring/comparison rubric per article, rendered as a Markdown table.** This is the
  moat against AI-slop lists. Each entry is scored on the same axes (e.g. ZK systems:
  proof size · prover time · trusted-setup y/n · EVM-friendliness).
- **Cross-link every named concept to a glossary term.** Create the one-liner (`level: 1`)
  stub in the *same* PR — link-audit fails on dangling internal links.
- **Verified citations** (per the `article-writing` skill): inline citation on the claim +
  a `## Sources and further reading` section; fetch-and-confirm every source; prefer
  primary/authoritative (ethereum.org, project docs, papers, Vitalik's writing).
- **Thread back to Namefi** without being salesy — a project's real domain, a "web3-native
  projects name themselves on-chain" aside, a link to a tokenized-domain explainer.
- **English is source of truth.** Translations to the 9 other locales are a follow-up pass.

## Frontmatter contract (enforced by `scripts/validate-data.ts`)

- `relatedArticles`: **exactly 5**, each resolving to an existing `/en/blog/*` file.
- `relatedGlossary`: **exactly 5**, each resolving to an existing `/en/glossary/*` file.
- `relatedTopics`: **exactly 2**, valid cluster slug (we use `web3-foundations` +
  `domain-tokenization`).
- `relatedSeries`: **exactly 2**, valid series slug. ⚠️ None of the 6 existing series fit
  this content — see "Follow-ups" for the fix. Roundups **omit the `series:` membership
  field** so they are not misfiled; `relatedSeries` is only a footer suggestion.
- `format: roundup`, `cluster: web3-foundations`, `priority: P2` (default; promote later).
- `termbase.json` is generated — after adding glossary stubs run `bun run termbase:build`.

---

## Tier 1 — Concept landscape roundups (THIS batch)

The "explain the whole category" pieces. Evergreen, low-maintenance. Cover the user's
named interests (ZK, EVM, FHE) inside broader concept maps.

| # | Slug | Working title | Rubric axes |
|---|---|---|---|
| A1 | `blockchain-privacy-technologies` | Top Blockchain Privacy Technologies: Zero-Knowledge Proofs, FHE, MPC, TEEs & Ring Signatures | what it hides · trust assumption · performance cost · maturity · example projects |
| A2 | `blockchain-virtual-machines` | Top Blockchain Virtual Machines: EVM, SVM, MoveVM, WASM & CairoVM | language(s) · execution model · parallelism · ecosystem size · EVM-compatibility |
| A3 | `blockchain-consensus-mechanisms` | Top Blockchain Consensus Mechanisms: Proof of Work, Proof of Stake & Beyond | Sybil resistance · finality · energy cost · decentralization · example chains |
| A4 | `blockchain-cryptographic-primitives` | Top Cryptographic Primitives Behind Every Blockchain | what it provides · where it's used on-chain · classical vs quantum risk |
| A5 | `blockchain-scaling-approaches` | Top Blockchain Scaling Approaches: Rollups, Sidechains, Channels & Sharding | where compute runs · security inheritance · data availability · trade-off |

### New glossary stubs created with Tier 1 (17)

- **Privacy (A1):** `zero-knowledge-proof`, `fully-homomorphic-encryption`,
  `secure-multiparty-computation`, `trusted-execution-environment`
- **VMs (A2):** `ethereum-virtual-machine`, `webassembly`
- **Consensus (A3):** `consensus-mechanism`, `proof-of-work`, `proof-of-stake`
- **Primitives (A4):** `hash-function`, `digital-signature`, `merkle-tree`
- **Scaling (A5):** `rollup`, `optimistic-rollup`, `zk-rollup`, `data-availability`,
  `sharding`

---

## Tier 2 — Sub-concept deep roundups (backlog)

Narrower, higher-intent; each is one level down from a Tier-1 article.

- **Top zero-knowledge proof systems** — Groth16, PLONK, STARKs, Halo2, Nova/folding
- **Top FHE schemes & when to use each** — BFV, BGV, CKKS, TFHE
- **Top rollup types** — optimistic vs ZK vs validium/volition
- **Top EVM-compatible chains** — and EVM-equivalent vs EVM-compatible
- **Top account-abstraction standards** — ERC-4337, EIP-7702
- **Top data-availability approaches** — on-chain, DACs, DAS / Celestia-style

## Tier 3 — Entity / project roundups (backlog — needs refresh cadence)

Highest freshness & backlink value; goes stale, so each carries an "as of \<date\>" note
and a review cadence. Seed 2–3 flagships first to test maintenance burden.

- **Top FHE projects to watch** — Zama, Fhenix, Inco, Sunscreen
- **Top ZK-rollups** — zkSync, Starknet, Scroll, Linea, Polygon zkEVM
- **Top modular / data-availability layers** — Celestia, EigenDA, Avail, NearDA
- **Top rollup frameworks (RaaS)** — OP Stack, Arbitrum Orbit, ZK Stack, Polygon CDK
- **Top restaking / shared-security** — EigenLayer, Symbiotic, Karak
- Others: oracle networks · interoperability/bridges · DePIN · intent/solver networks

---

## Follow-ups (out of scope for this resources-only PR)

1. **Proper home for the initiative — DONE (needs the astra companion to render).**
   The 5 articles are now members of a new **`blockchain-concepts`** series
   (`series: blockchain-concepts` + `seriesOrder` 10–50), and the slug is registered in
   `namefi-resources/scripts/validate-data.ts` (`SERIES_SLUGS`). The matching series
   definition in `namefi-astra/apps/resources/src/lib/taxonomy.ts` (`SERIES`) ships as a
   **companion astra PR** — that PR must merge/deploy so `/en/series/blockchain-concepts/`
   renders before this resources change reaches an astra environment.
2. **Illustrations.** Run the `article-illustrations` pass — a cover (OG card) + one image
   per `##` section for each article, saved to `content/assets/` **before** referencing
   (static-import build breaks on dangling refs). Needs `OPENAI_API_KEY` (astra Infisical,
   `gpt-image-2`).
3. **Translations.** Fan out one Sonnet agent per locale (`ar de es fr hi ja ko zh-CN ta`)
   for the 5 articles + 17 stubs; English-source-first, then `bun run termbase:build`.
4. **Promote priority.** Once indexed/performing, bump the strongest 1–2 to `P1`/`P0`.
5. **Work down Tier 2, then seed Tier 3 flagships.**
