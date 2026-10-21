# The second batch continues the existing article plan

As of 2026-10-21. Base Resources revision: `c52d1521229a79ab874fb22df55af8fb6c005269`.

The user authorized ten English articles from the existing plan, per-article actual research and writing token records, PR creation, admin merge, and production publication. The user requested no new topic selection. The user requested a ChatGPT Pro workload, continuing the GPT workflow; repository model rules remain unchanged.

## The batch uses isolated writing sessions for usage measurements

Each manuscript has one focused GPT writer. The writer captures cumulative Codex token counters before research and after manuscript review. The corresponding JSON in `usage/` retains the raw start and end counters, session identity, timestamps, and scope. Differences measure the observed writing-session interval, including repeated inputs and tool-result context. Cached input is a subset of input. Reasoning output is a subset of output. Neither subset is added twice.

Per-article records cover the writer research, drafting, and text review interval. Shared coordinator work, additional source checks, images, validation, GitHub, deployment and production verification are separate overhead. Image API usage is separate from these Codex text counters. These records do not establish subscription-percentage attribution or an API invoice.

## The coordinator preserves the planned order

The existing plan is `docs/blockchain-concepts-roundups-plan.md`. EVM-compatible chains and account-abstraction standards are the two unfinished Tier-2 topics. The Tier-3 backlog supplies the following topics. The user explicitly confirmed the first ten remaining topics on 2026-10-21. The final intent/solver-network topic remains outside this batch.

The confirmed continuation is:

1. EVM-compatible chains (`top-evm-compatible-chains`, order 100).
2. Account-abstraction standards (`top-account-abstraction-standards`, order 110).
3. FHE projects (`top-fhe-projects`, order 120).
4. ZK rollups (`top-zk-rollups`, order 130).
5. Modular and data-availability layers (`top-modular-data-availability-layers`, order 140).
6. Rollup frameworks (`top-rollup-frameworks`, order 150).
7. Restaking and shared security (`top-restaking-shared-security`, order 160).
8. Oracle networks (`top-oracle-networks`, order 170).
9. Interoperability and bridges (`top-interoperability-bridges`, order 180).
10. DePIN networks (`top-depin-networks`, order 190).

The existing Tier-2 drafts are being researched afresh. No keyword research or topic ranking is being repeated.

## Publication remains gated on content and rendering checks

All new English articles require verified primary-source citations, a comparison rubric, natural glossary links, mobile-readable tables, official house-style images and current-state caveats. Production strips some raw HTML citation anchors, so inline source links use the documented direct-link fallback.

The final record will include per-article usage, word counts, validation, PRs and production evidence.

## Dedicated writer intervals provide actual token measurements

All ten article intervals were independently matched to emitted token_count events in the local writer logs. The observed writer model was `gpt-6.1-sol`. No per-article token estimate replaces those observed counters. The first two articles lack a research-to-writing middle boundary; only their combined actuals are available. The other eight preserve separate research and writing/text-review boundaries.

| Article | Uncached input | Cached input | Output | Total including cache |
| --- | ---: | ---: | ---: | ---: |
| `top-account-abstraction-standards` | 33,665 | 374,656 | 5,936 | 414,257 |
| `top-depin-networks` | 85,395 | 1,466,624 | 10,227 | 1,562,246 |
| `top-evm-compatible-chains` | 65,817 | 1,006,464 | 6,911 | 1,079,192 |
| `top-fhe-projects` | 52,794 | 943,232 | 7,472 | 1,003,498 |
| `top-interoperability-bridges` | 58,340 | 590,464 | 6,058 | 654,862 |
| `top-modular-data-availability-layers` | 106,824 | 1,536,768 | 7,865 | 1,651,457 |
| `top-oracle-networks` | 35,860 | 537,984 | 6,246 | 580,090 |
| `top-restaking-shared-security` | 92,803 | 1,792,512 | 8,550 | 1,893,865 |
| `top-rollup-frameworks` | 54,870 | 704,512 | 6,032 | 765,414 |
| `top-zk-rollups` | 61,808 | 936,576 | 7,830 | 1,006,214 |

Total observed writer usage: **10,611,095 tokens**, consisting of 648,176 uncached input, 9,889,792 cached input and 73,127 output. The output includes 2,895 reasoning tokens, not an additional chargeable count. These totals exclude shared coordinator research/review, image generation, checks and publication.

A future batch should compare cached and uncached inputs separately. The earlier 70,000–160,000 total-token forecast understated repeated cached context. No fixed conversion from these counters to a Pro daily quota is established.

## The coordinator completed the publication checks

The final batch contains ten English articles and fifty house-style images. Each article has one 1200×630 cover and four 1200×675 illustrations. The coordinator inspected every final image and corrected misleading labels or diagrams before publication. Image generation used the repository image harness with credential-safe transport. Image API consumption remains outside the writer token records.

The coordinator compiled all ten manuscripts as MDX with GFM. The coordinator checked rendered previews at 390-pixel widths. No preview created horizontal viewport overflow. All forty inline images loaded. These previews verify content rendering; production verification remains a separate publication step.

The final local checks passed: `bun data:validate`, `bun lint:mdx`, `bun links:audit`, and `git diff --check`. The data validator retained 37 existing warnings. The link audit found zero broken links or locale/relationship mismatches across 4,015 files. The audit retained 512 existing translation fallbacks. The link-audit tests also passed: 18 tests and 95 assertions.

The PR and production receipt will retain the final merge, workflow and live-page evidence. The source plan keeps the intent/solver-network topic outside this batch.
