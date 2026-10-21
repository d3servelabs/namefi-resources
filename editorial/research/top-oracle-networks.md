# The oracle comparison distinguishes prices from assertions

Research and text review completed on 2026-10-21 UTC. Primary official documentation only. The article compares mechanisms and does not rank market adoption, TVL, token investment merit, cost, or benchmark latency.

| Opened URL | Evidence location and supported claims | Limits |
| --- | --- | --- |
| https://docs.chain.link/data-feeds | Build with Data Feeds | Product overview only. No global feed coverage inference. |
| https://docs.chain.link/architecture-overview/architecture-decentralized-model?parent=dataFeeds | Data aggregation; Decentralized Oracle Network; Consumer; Proxy; Aggregator | Feed-specific operator count, shared onchain values, proxy upgrade path, deviation and heartbeat triggers. No universal oracle count or guaranteed maximum age. |
| https://docs.chain.link/data-feeds/developer-responsibilities | Market Integrity Risks; Application Code Risks | Developer responsibility for low-liquidity/manipulation risks, checks, circuit breakers and contingency logic. |
| https://docs.pyth.network/price-feeds/core | Introduction; top service notice | First-party providers; Hermes API key requirement. Provider and chain counts deliberately omitted. |
| https://docs.pyth.network/price-feeds/core/upgrade/how-it-works | Data flow; Routers; Upgraded Core Contract; comparison table; What this means for consumers | Five routers, 3/5 quorum, new contracts, preserved interface, August 26, 2026 upgrade. Old Wormhole/Pythnet description is obsolete for upgraded Core. No universal chain deployment assertion. |
| https://docs.pyth.network/price-feeds/core/best-practices | Staleness; Adversarial selection; Latency; Executable Price Risks | Timestamp checks, user update selection, uncertainty and confidence policy. The $100/$8/2% and 90-second/30-second examples are invented acceptance tests. |
| https://docs.redstone.finance/docs/introduction/ | Stage 1: Market Data | Push/pull product scope. Marketing secured-value and downtime claims omitted. |
| https://docs.redstone.finance/docs/stage1-market-data/price-feeds/pull-model/ | Usage; Adjust your smart contracts; override function list | Transaction payload, data extraction and verification, aggregator compatibility, signer/timestamp/aggregation settings. Demo imports are not a production recommendation. |
| https://docs.redstone.finance/docs/stage1-market-data/price-feeds/push-model/ | How RedStone Push works; Relayer; Contracts | Relayer, time/deviation triggers, storage and timestamp, familiar interface, multiple independent relayers. Broad compatibility is not evidence of a deployed feed on every chain. |
| https://docs.uma.xyz/developers/optimistic-oracle-v3 | Overview | Opened for navigation, not substantive mechanism evidence. |
| https://docs.uma.xyz/developers/optimistic-oracle-v3/quick-start | A minimum viable OOV3 integration; Next Steps | Assertion/challenge/default DVM flow and unsafe demonstration caveat. The page includes obsolete Goerli instructions. Article uses lifecycle explanations only, omits addresses, deployment steps and 120-second demo setting. |
| https://docs.uma.xyz/protocol-overview/how-does-umas-oracle-work | Disputes; Dispute Resolution via DVM | Economic incentives and staker voting. Marketing success percentages and precise voting schedule omitted. |

## The text review keeps application judgments separate from documentation

- Four major H2 sections, one per named provider. The endnotes use a bold lead-in.
- Three-column comparison avoids unsupported ranking and wide benchmark tables.
- All hypothetical domain, checkout, stale-price and confidence examples carry explicit hypothetical or invented framing.
- The domain example concerns payment-token conversion, not domain appraisal or a claimed Namefi integration.
- The freshness and confidence rules remain independent. Neither signatures nor source diversity establish economic appropriateness.
- Push/pull compatibility and familiar interfaces do not imply identical data origins or trust assumptions.
- UMA settlement waits for the actual resolution result. Challenge windows require monitoring and adequate incentives.
- Selected internal related routes existed at drafting. Parent handles asset generation, complete validation, independent reopening of sources and publication.
- No archive links were invented. Public source notes record actual UTC fetch date.

Body count before source notes: 2,009 whitespace-delimited words after removing Markdown link targets. Headings and comparison/checklist text count toward the body. Frontmatter and source notes do not count.
