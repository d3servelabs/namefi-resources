# The EVM comparison uses current official network documentation

Locale: en-US. Research retrieval: 2026-10-21 UTC, beginning after 16:56:54 UTC. The source list below records 15 distinct public pages actually opened and read with the web tool. Sources returned readable body text without a login or payment wall. The web tool did not expose raw HTTP status codes, so this record does not claim independently measured HTTP 200 responses.

## The verified claims distinguish execution, proofs, and consensus

- Ethereum.org separates EVM compatibility from inherited Ethereum security and identifies Polygon PoS as a sidechain example.
- Optimism documents open proposal/challenge access, Guardian intervention, instant upgrade powers, address aliasing, and execution differences. Generic OP Stack text contains broad chain claims, so the manuscript avoids assigning every OP Stack chain the same operator or configuration.
- Base Azul overview explicitly marks Mainnet Live May 28, 2026. The proof specification describes permissioned TEE and permissionless ZK paths. Beryl overview explicitly marks Mainnet Live June 25, 2026, reducing the long window to five days while retaining the one-day dual-proof path. The older Azul proof page still lists seven days, so the manuscript uses the newer Beryl change and current finality page for timing.
- Base derivation separates L1-derived transaction inputs from output checkpoint proving. Base finality separates ordinary L2 status from exit availability. Do not restore the previous draft's blanket assertion that Base shares OP Mainnet's optimistic proof system.
- Arbitrum Nitro docs distinguish One/Rollup from Nova/AnyTrust, describe Geth execution and Ethereum transaction batches. BoLD docs explicitly identify active permissionless validation and bonded validator responsibilities. Council documentation confirms emergency responsibilities but labels itself public preview. The manuscript does not state current council membership, thresholds, or a rollup stage score.
- Polygon architecture describes Bor and Heimdall-v2, Ethereum staking contracts, and checkpoint Merkle roots. Checkpoint roots do not supply full replay inputs. The manuscript does not describe Polygon PoS as an Ethereum rollup.
- Avalanche Primary Network docs explicitly identify the post-Helicon Continuous Execution VM, replacing Coreth for later blocks, with Mainnet September 22, 2026. Snowman documentation describes repeated validator sampling. The manuscript makes no measured throughput, latency, fee, validator-count, or security-ranking claim.

## The source list preserves retrieval and locators


The sources below opened publicly through the research tool on October 21, 2026 UTC. Inline citations use direct section links because the publication renderer may strip custom HTML anchors. Fetch dates record retrieval, not the publication date. No archive snapshot was verified.

- Ethereum.org, [Sidechains](https://ethereum.org/developers/docs/scaling/sidechains/#evm-compatibility), “EVM compatibility,” “Consensus algorithms,” and “Use Sidechains.” Fetched 2026-10-21.
- Optimism, [Differences from Ethereum](https://docs.optimism.io/op-stack/protocol/differences#opcodes), “Opcodes,” “Address aliasing,” “Transaction fees,” and “Chain Finality.” Fetched 2026-10-21.
- Optimism, [Fault proofs explainer](https://docs.optimism.io/op-stack/fault-proofs/explainer#permissionless-challenges), opening overview, “Permissionless challenges,” and Guardian discussion. Fetched 2026-10-21.
- Optimism, [OP Stack security model](https://docs.optimism.io/op-stack/security/faq-sec-model#op-stack-multisig), “OP Stack multisig” and “Fault proofs.” Fetched 2026-10-21.
- Base, [Azul overview](https://docs.base.org/upgrades/azul/overview#features), activation table and “Multiproofs.” Fetched 2026-10-21.
- Base, [Proof System](https://docs.base.org/upgrades/azul/proofs#security-and-decentralization), opening checkpoint explanation and “Security and Decentralization.” Fetched 2026-10-21.
- Base, [Beryl overview](https://docs.base.org/upgrades/beryl/overview#features), activation table and “Faster Withdrawals.” Fetched 2026-10-21.
- Base, [Transaction Finality](https://docs.base.org/specifications/transactions/transaction-finality#finality-for-withdrawal-transactions), L2 stages and “Finality for Withdrawal Transactions.” Fetched 2026-10-21.
- Base, [Derivation](https://docs.base.org/specifications/base-protocol/consensus/derivation#overview), “Overview,” input list. Fetched 2026-10-21.
- Arbitrum, [Inside Arbitrum Nitro](https://docs.arbitrum.io/how-arbitrum-works/inside-arbitrum-nitro#nitros-design-the-four-big-ideas), opening network distinction, Geth execution, and Ethereum batch publication. Fetched 2026-10-21.
- Arbitrum, [Overview of BoLD](https://docs.arbitrum.io/how-arbitrum-works/bold/gentle-introduction#what-exactly-is-bold), opening active-network statement and validator responsibilities. Fetched 2026-10-21.
- Arbitrum Foundation, [Security Council overview](https://docs.arbitrum.foundation/concepts/security-council#the-role-of-the-security-council), role and emergency responsibilities. The page labels itself public preview. Fetched 2026-10-21.
- Polygon, [Architecture overview](https://docs.polygon.technology/pos/architecture/overview#heimdall-v2-validation-layer), two-layer architecture and checkpoint construction. Fetched 2026-10-21.
- Avalanche, [Primary Network](https://build.avax.network/docs/primary-network#c-chain-contract-chain), C-Chain implementation, Helicon transition, and separate network targets. Fetched 2026-10-21.
- Avalanche, [Snowman Consensus](https://build.avax.network/docs/primary-network/avalanche-consensus#conceptual-overview), repeated validator sampling. Fetched 2026-10-21.


## The review excludes unsupported claims and documents limitations

The manuscript contains 4 substantive major sections, 3 narrow comparison tables, a requirements rubric, engineering checklist, and one domain-specific bridge to the custody/recovery guide. The manuscript uses direct inline source links because content/blog/en/README.md warns that production strips custom HTML citation IDs. Sources are section-linked where possible and otherwise supply a precise named section in the reference list. No archive URL was invented or claimed. No images were generated by this writer. The parent owns images, rendering, validation, independent source review, and publication.

Unusable opening attempts, excluded as evidence: old Base network-information and fault-proofs paths, guessed Optimism security-model and derivation paths, guessed Arbitrum bold-for-everyone path, and guessed Avalanche consensus path. Canonical pages reached through working links replaced each required source. These failures did not justify retaining unverified draft claims.

Text review checked dates, network naming, native-versus-bridged distinction, table scope, no rankings, current Base proof classification, current Avalanche implementation, internal link targets, frontmatter relationships, natural prose, and citation coverage. Engineering recommendations and hypothetical examples remain explicitly labeled as judgment. The manuscript is not token investment guidance.
