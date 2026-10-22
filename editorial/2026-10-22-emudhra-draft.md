# The eMudhra draft explains CA trust and layered domain defenses

As of October 22, 2026. This package contains one English source article and six glossary drafts. The requested translations cover es, de, fr, zh-CN, ar, hi, ko, ja, and ta. Every new page keeps `draft: true`.

The user explicitly requested multilingual drafting and approved the current GPT model after the Claude login check failed. The model exception applies to this task. The exception changes no repository instructions.

## The translation decision follows the requested editorial scope

Decision: TRANSLATE FOR DRAFT REVIEW. Source: `content/blog/en/emudhra-ca-compromise-dnssec.md` and six accompanying glossary drafts. Target variants: es (general international), de (Germany), fr (France), zh-CN (mainland simplified Chinese), ar (modern Egyptian Arabic), hi (India), ko (South Korea), ja (Japan), ta (India). Regions describe editorial language choices, not measured demand.

Google Ads demand, GSC visibility, local SERP evidence, review costs, and maintenance costs: UNKNOWN, not requested or measured. The user's explicit nine-language approval supplies the drafting scope. Publication prioritization remains DEFER pending editorial selection. This package claims no search-volume opportunity.

## The evidence separates exposure from exploitation

Google and Mozilla published response advisories on October 20. Mozilla Bug 2083449 identifies six TLS and two code-signing intermediate certificates. The vendor's status page groups all eight under its Global TLS business. The article preserves Mozilla's technical distinction.

The article attributes the wrap/unwrap explanation and no-issued-certificates statement to eMudhra. The article preserves the ongoing root-cause investigation. Google's CT finding applies to CT-enforcing clients, not every TLS client. Google's October 27 root removal is a scheduled event, not a completed event.

DNSSEC authenticates DNS data. DANE requires client enforcement. CAA constrains compliant issuance, not arbitrary forged signatures. A tokenized domain does not automatically alter browser CA trust. The article makes no claim that Namefi infrastructure suffered an incident or provides automatic immunity.

Every cited source was opened during research on October 22, 2026. The manuscript uses direct inline citations because the English content README warns that production can strip raw HTML reference anchors. No archive snapshot was captured. No cover image is assigned at this drafting stage.

## Existing articles supply five relevant outbound paths

| Existing page | Purpose | Proposed inbound change after publication |
| --- | --- | --- |
| `the-fox-it-dns-hijack` | Registrar control and fraudulent certificate acquisition | Link the certificate-trust discussion to the CA term and this case. |
| `the-myetherwallet-bgp-dns-attack` | Routing and DNS interception | Link the certificate-warning discussion to the MITM term. |
| `the-curve-finance-dns-hijack` | Web3 interface dependence on domain security | Link the defense discussion to DNSSEC and this incident. |
| `dns-on-tokenized-domains` | Token ownership and DNS operation | Link the trust-boundary discussion to this explainer. |
| `dnssec-for-domain-owners` | Practical DNSSEC deployment follow-up in related articles | No inbound change proposed in this draft. |

Published articles receive no links to unpublished drafts. The new article links to existing pages and the six accompanying term drafts. Publication must move the linked draft terms and article together, or remove unpublished targets first. Inbound suggestions are capped at these four pages and must mirror into existing translations when applied.

## Publication requires a fresh incident check and language review

A future publication pass must recheck vendor actions and the October 27 deadline, confirm the final root-cause findings, review Chinese canonical term titles, obtain native-language LQA where needed, and inspect rendered desktop/mobile/RTL pages. This draft task does not claim those publication checks have happened.

## Verification confirms the draft package and leaves publication checks explicit

The completed manifest lists 70 pages: 10 article files and 60 glossary files. The English source and nine translations keep `draft: true`. The six concepts are Certificate Authority, Intermediate CA, Man-in-the-Middle Attack, DANE, CAA, and Certificate Transparency.

The independent English review found a missing DNSSEC last-hop qualification and an incorrect RFC section locator. Both findings were corrected and propagated. A further independent Arabic/Hindi review checked the two articles and six high-risk glossary translations. The Arabic last-hop omission was corrected, and Hindi now explicitly names a client that supports DANE. The authoring pass also checked Chinese prose and the Japanese/Korean DNSSEC and DANE sections. These checks do not constitute native-speaker certification.

Existing repository dependencies loaded successfully and ESLint ran without another installation. The initial request to install dependencies was unnecessary for completing the checks. The final checks used the task worktree's available dependencies.

- `bun run data:validate`: passed, including 13 fixture tests; 37 repository warnings remain.
- `bun run lint:mdx`: passed across content.
- `bun run links:test`: 18 tests passed.
- `bun run links:audit`: 4,166 files audited; zero broken links, missing locale prefixes, locale mismatches, or relationship mismatches. The audit reports 548 accepted missing-translation fallback warnings across the repository.
- `bun run termbase:build` and `bun run termbase:check`: passed. The termbase retains 172 published concepts and excludes all new draft terms.
- Package QA: all 70 pages preserve source/body link order, heading/list/table coverage, metadata invariants, locale, and draft status. No exact English body copies or tool artifacts were found. Every glossary entry has at least two distinct source documents. Descriptions remain within 155 characters.
- `git diff --check`: passed for tracked README changes. New-page checks also passed scoped/full Markdown lint.

The user subsequently requested separate draft pull requests for Namefi and the personal blog. The Namefi PR contains the 70 content drafts and this evidence record. The personal article and cartoons belong to `xinbenlv/zThink`. This task does not publish or deploy either article. The package includes no new cover image. Native-language and rendered desktop/mobile/RTL review remain future publication work. Chinese term titles remain provisional until maintainer review.

The Chinese article uses the approved calm Namefi introduction rather than the personal commentary opening. The remaining technical sections retain their citations and qualifications. This localized editorial adaptation changes the Chinese opening and title, so literal body-link parity does not apply to that opening.

## The owner approved publication on October 22

The owner explicitly requested administrator merges and production publication for both articles. The Namefi package now publishes the ten article locales and the sixty linked glossary entries together. The publication pass rechecked the Google advisory and vendor status page on October 22. The October 27 deadline remains prospective. Prior draft-only notes describe the earlier review stage.
