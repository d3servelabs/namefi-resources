# The article compares current deployable configurations

Research date: 2026-10-21 UTC. Authoring scope: English manuscript and text review. Parent handles images, integration checks, publication, and independent source reopening.

The manuscript contains 1,940 body words before Sources and further reading, counting table and checklist text with whitespace tokenization after removing Markdown link destinations. Four substantive H2 sections compare OP Stack, Arbitrum Orbit/Nitro, ZK Stack, and Polygon CDK. Fifteen cited public official sources were opened and read with the web tool. No archive snapshots were claimed or invented.

## The source ledger identifies each supported claim

| Official source | Claim and precise location | Caveat |
| --- | --- | --- |
| https://docs.optimism.io/op-stack/introduction/op-stack#what-the-op-stack-gives-you | OP Stack features and modularity | Generic stack capabilities do not establish deployed-chain configuration. |
| https://docs.optimism.io/op-stack/architecture#the-actors-and-who-runs-each | Components table, standard configuration at introduction, transaction lifecycle | Ethereum DA and permissionless fault proofs explicitly configurable. |
| https://docs.optimism.io/op-stack/features/experimental/alt-da-mode | Opening experimental warning, How it works | Does not equate Alt-DA with Ethereum DA. |
| https://docs.optimism.io/op-stack/security/faq-sec-model#fault-proofs | Instant upgrades limit fault-proof protection | Do not transfer named OP governance signers to independent chain. |
| https://www.base.org/blog/next-chapter-for-base-chain-1#accelerating-upgrades | February 18, 2026 announcement, base/base release path and proof transition roadmap | Announcement establishes divergence, not exact current activation status. Article does not claim roadmap completion. |
| https://docs.arbitrum.io/launch-arbitrum-chain/overview/introduction | Opening Nitro identity, customization, optional-withdrawal note | 100ms optional and fast withdrawals disabled by default. Article avoids fixed timing promises. |
| https://docs.arbitrum.io/launch-arbitrum-chain/chain-config/data-availability/config-data-availability#available-data-availability-options | Rollup, AnyTrust, DAC configuration | Parent-chain placement and committee setup require deployment-specific examination. |
| https://docs.zksync.io/zk-stack/components | Current component list | Older EraVM-specific guides are not treated as universal current deployment architecture. |
| https://docs.zksync.io/zk-stack/components/zksync-airbender#proving-pipeline | RISC-V proving, six-stage pipeline, final FFLONK wrapper | No generic benchmark or guaranteed proving time quoted. |
| https://docs.zksync.io/zk-stack/customizations/validium#types-of-validium | Database-only, external DA without onchain validation, external DA with validation | ZKsync page's DA stages are not L2 decentralization stages. Manuscript uses descriptions instead of numeric stages. |
| https://docs.zksync.io/zk-stack/running/ownership-model#contracts-overview | Shared contract owners, ChainAdmin versus protocol roles | Older L1 ecosystem-contract guide contains first-release details, so current ownership table takes precedence. |
| https://docs.zksync.io/zk-stack/running/raas | Managed infrastructure and service responsibilities | Vendor selection remains separate from framework selection. |
| https://docs.polygon.technology/chain-development/cdk | Current institutional managed product, not self-serve kit | Current framing differs materially from older CDK roundups. |
| https://docs.polygon.technology/chain-development/cdk/get-started/overview#rollup-modes | OP clients, Besu, sovereign/validium live, zkRollup in development | CDK overlaps OP Stack execution. Sovereign pessimistic proofs do not establish execution validity. Besu sovereign only. |
| https://polygon.technology/polygon-zkevm | Opening sunset statement, Key dates | Sequencer sunset July 3, 2026. Distinguish sunset network from current CDK project. |

## The text review checked the security boundaries

The review checked every framework paragraph against opened official passages. The review removed generic claims that all OP-derived chains share proofs or governance. The manuscript treats the Base article as an announcement and roadmap, without claiming completion. The review distinguishes CDK from Polygon zkEVM Mainnet Beta and avoids the obsolete assertion that every CDK mode is a deployable Ethereum-DA ZK rollup.

The review checked four substantive sections, a three-column rubric, an explicitly hypothetical market.example deployment, and an eight-item operational acceptance checklist. Deployment recommendations and tests are editorial analysis, not claims that providers completed those tests. All five related articles and all five glossary targets exist. Existing source citation sections define the published citation convention. The body adds no renderer implementation notes or speculative archive records.

Image generation and insertion remain outside this agent's scope. The ogImage path is the approved parent-owned cover target. No nonexistent body image reference was inserted. Parent performs full repository validation after image integration.
