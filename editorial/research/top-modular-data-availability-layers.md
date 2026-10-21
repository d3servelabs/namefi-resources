# The DA comparison records its source evidence

Article: `content/blog/en/top-modular-data-availability-layers.md`. Locale: en-US. Research and manuscript review: 2026-10-21 UTC.

## The article compares deployable verification and recovery paths

The approved scope names Celestia, EigenDA, Avail, and NEAR DA. The article distinguishes providers from the previous general approaches article. Four major H2 sections cover requirements, dedicated networks, certificate/support checks, and recovery. Tables have three columns. The domain marketplace example is explicitly hypothetical and does not describe Namefi infrastructure.

## The source review found material deployment caveats

- Celestia's current Blobstream page states that Succinct-operated SP1 deployments stopped maintenance and new commitments in September 2026. The article requires an independently sourced or operated verification path. This is a specific deployment caveat, not a Celestia network shutdown.
- Celestia's retrievability page assigns historical storage to rollups/applications. The article avoids a permanent-storage claim.
- EigenDA's overview identifies mainnet operation and labels light nodes as planned. The security page still states a trusted disperser liveness assumption. The newer whitepaper describes an observability design. The manuscript treats that design as conditional rather than silently claiming every component operates in production.
- NEAR DA's Nuffle-Labs repository remains accessible. Its Integrations section explicitly calls reference implementations proof-of-concept work and not necessarily production grade. The reviewed sources did not establish a currently supported production service, maintained integration, or service commitment. The article marks that gap, rather than inferring shutdown or readiness.
- NEAR DA's README gives inconsistent retention descriptions: epoch arithmetic around receipts versus an at-least-three-days bullet. The manuscript does not publish a numerical retention promise.
- Avail's light-client README calls app-specific reconstruction WIP and warns that disabling proof verification trusts the supplying node. The manuscript describes functions without claiming universal configuration or production readiness.
- No numerical speed, cost, security-stake, or market-share ranking survives into the manuscript. Costs compare mechanisms and proposed end-to-end measurement.

## The reviewed originals support these claims

All successful source entries below were actually opened with the web tool on **2026-10-21 UTC**. The article's final source record gives section locators. No archive URL was invented or verified.

1. [https://docs.celestia.org/learn/blobstream/](https://docs.celestia.org/learn/blobstream/) — Opening legacy notice: September 2026 discontinuation of maintained Succinct SP1 commitments. What remains: self-operated/sourced verification.
2. [https://ethereum.org/en/developers/docs/data-availability/](https://ethereum.org/en/developers/docs/data-availability/) — Data availability vs data retrievability.
3. [https://docs.celestia.org/learn/celestia-101/data-availability/](https://docs.celestia.org/learn/celestia-101/data-availability/) — Data availability sampling, Namespaced Merkle trees, and Monolithic vs modular blockchains.
4. [https://docs.celestia.org/learn/celestia-101/retrievability/](https://docs.celestia.org/learn/celestia-101/retrievability/) — Suggested practices for rollups: historical storage responsibility and archival caveats.
5. [https://docs.availproject.org/docs/da/concepts/how-avail-da-works](https://docs.availproject.org/docs/da/concepts/how-avail-da-works) — Block data lifecycle, sampling, and BABE/GRANDPA consensus.
6. [https://github.com/availproject/avail-light/blob/main/client/README.md](https://github.com/availproject/avail-light/blob/main/client/README.md) — Modes of Operation: sampling, reconstruction, and disabled-proof-verification trust warning.
7. [https://docs.eigencloud.xyz/eigenda/core-concepts/overview](https://docs.eigencloud.xyz/eigenda/core-concepts/overview) — Opening mainnet status and Architecture: disperser, operators, retrieval nodes, planned light nodes.
8. [https://docs.eigencloud.xyz/eigenda/core-concepts/security/security-model](https://docs.eigencloud.xyz/eigenda/core-concepts/security/security-model) — Safety and Liveness Analysis: thresholds and trusted disperser assumption.
9. [https://docs.eigencloud.xyz/eigenda/integrations-guides/overview](https://docs.eigencloud.xyz/eigenda/integrations-guides/overview) — Proxy with REST API: payment, polling, certificate verification.
10. [https://docs.eigencloud.xyz/assets/files/EigenDA_Whitepaper-c917fb56c146ebd146abfba3c52648a1.pdf#page=14](https://docs.eigencloud.xyz/assets/files/EigenDA_Whitepaper-c917fb56c146ebd146abfba3c52648a1.pdf#page=14) — Sections 4.3.2–4.3.3, PDF page 14 / printed page 14. Certificate checks and storage period. Supporting phrase: “Sufficient signing stake.”
11. [https://github.com/Nuffle-Labs/data-availability](https://github.com/Nuffle-Labs/data-availability) — Blob store contract and Integrations: receipt design, archival retrieval, proof-of-concept and production-grade qualification.
12. [https://docs.celestia.org/learn/TIA/paying-for-blobspace/](https://docs.celestia.org/learn/TIA/paying-for-blobspace/) — Fee market overview: transaction flat fee and blob-size component.
13. [https://docs.availproject.org/docs/da/concepts/tx-pricing](https://docs.availproject.org/docs/da/concepts/tx-pricing) — Fees calculation for DA transactions and submitDataFeeModifier.
14. [https://docs.eigencloud.xyz/eigenda/core-concepts/payments](https://docs.eigencloud.xyz/eigenda/core-concepts/payments) — On-Demand Bandwidth and Reserved Bandwidth: payment structures and disperser metering.

## Failed lookups did not supply evidence

The obsolete Celestia `/learn/how-celestia-works/data-availability-layer/` returned 404. The guessed Celestia `/learn/transaction-types/` failed and was corrected using official navigation to `/learn/TIA/paying-for-blobspace/`. The obsolete EigenCloud `/products/eigenda/overview` failed and was replaced through current navigation. An Avail VectorX repository guess returned 404, and an alternate Avail repository README fetch timed out. No claim depends on those failed fetches.

## The manuscript review checked the final text

The final review checked all substantive factual paragraphs against opened sources, removed unsupported present-day retention numbers, checked the PDF locator, corrected the Celestia fee URL, and checked internal blog/glossary routes against local files. Four H2 sections remain. The references use direct inline original URLs because this repository's renderer does not guarantee local reference anchors. No body image links were added before image creation. The parent publication pass owns images and repository-wide validators. Ancestor README files remain accurate because they already describe the October batch's evidence and usage folders.
