# The ZK rollup comparison records current network evidence

Research and review date: 2026-10-21 UTC. Article: `content/blog/en/top-zk-rollups.md`. Scope: English research, writing, and factual self-review. The parent agent handles images, repository validation, and publication. The user authorized GPT Pro writing in place of the older Claude-only skill default.

## The opened primary sources support the published claims

All 12 cited public sources were opened through the web tool on 2026-10-21 UTC. No archive snapshot was obtained or invented. Human-readable section locators supplement original-source fragment links.

| Original source | Exact location and observed support | Review limit |
| --- | --- | --- |
| https://ethereum.org/developers/docs/scaling/zk-rollups/ | “What are zero-knowledge rollups?” and “How ZK-rollups publish transaction data on Ethereum”: validity proof, reconstruction data, public data, no automatic confidentiality | Do not repeat the broad “no delays” sentence as an operational withdrawal guarantee |
| https://docs.scroll.io/en/developers/building-on-scroll/ | Opening paragraphs: live Ethereum L2, EVM bytecode, familiar tooling, L1 proof verification | Avoid marketing claims of no decentralization compromise or quoted block times |
| https://docs.scroll.io/en/developers/ethereum-and-scroll-differences | EVM Opcodes, Reorgs and Finality, Transaction Fees: documented execution differences and distinct finality/fee concerns | Source contains version-specific compiler claims. Article does not repeat compiler version or current opcode inventory |
| https://docs.linea.build/network | Opening paragraphs: Linea Mainnet public zkEVM, Lineth deployable stack | Page also says instant/free withdrawals and all Ethereum features. Article instead uses detailed finality and difference pages |
| https://docs.linea.build/network/overview/ethereum-differences | EVM opcodes, precompiles, calldata, JSON-RPC, type3 and EIP7702 | The older `/build-on-linea/ethereum-differences` route returned no content on open. Current route discovered by clicking network page |
| https://docs.linea.build/network/overview/transaction-finality | Transaction lifecycle and Hard finality: proof verification plus Ethereum finalization differ from soft finality | No claimed end-to-end withdrawal duration |
| https://docs.zksync.io/zksync-protocol/rollup | Opening architecture: ZK Stack rollups and validiums | Ecosystem name does not determine a chain's DA configuration |
| https://docs.zksync.io/zksync-protocol/era-vm/evm-interpreter/overview | Execution Model and Developer Considerations: interpreter on EraVM, native and EVM deployment paths, execution/gas/interoperation limits | Current docs also include ZKsync OS. Article does not claim every current ZKsync chain uses EraVM or assert a blanket migration status |
| https://docs.zksync.io/zksync-protocol/security/withdrawal-delay | Opening paragraphs: 3-hour minimum and actual finalization may take longer | Scope is supported ZKsync chains as documentation states. No blanket maximum |
| https://docs.starknet.io/build/starknet-by-example | What is Starknet By Example: Cairo contracts | Examples explicitly unaudited. Article does not present example code as production-ready |
| https://docs.starknet.io/learn/protocol/intro | User interactions, Block production and validation: contract accounts, STARK proofs, compressed state diffs on Ethereum | Current intro also discusses STRK20. Article does not assume every Starknet transaction is private |
| https://polygon.technology/polygon-zkevm | Sunset Complete, Recovery window and deadline, Funds locked in smart contracts | Current page says July3 completed sunset, EOA claim eligibility, no smart-contract claim support, interface retirement Dec31 2027 without forfeiture |

## The review resolves conflicting or outdated descriptions

- Polygon's older April 2026 forum reminder says July1 planned sunset and describes assets as abandoned after2027. The current official status page gives July3 completed sunset and explicitly says no forfeiture by interface retirement. The article uses the current completed-status source only.
- The old Starknet SNOS route returned an inaccessible result. The published article cites the current protocol introduction and Cairo examples instead.
- Linea Mainnet and Lineth are separate named objects. A custom stack deployment cannot inherit claims from the public network without checking deployment configuration.
- ZKsync is an ecosystem that supports multiple configurations. The article identifies execution-mode decisions and refuses to generalize EraVM to every current chain.
- “EVM-equivalent” does not certify operational identity. Scroll and Linea each publish differences. The article points teams to application-specific testing.
- No TPS, TVL, fee, or security-stage league table appears. The article has no measured evidence for a cross-network numerical ranking.

## The editorial recommendations remain explicit analysis

The shortlist prioritizes compatibility for existing Solidity applications, configuration review for ZKsync, and Cairo capability for Starknet. These conclusions interpret technical documentation. The conclusions do not claim that the sources measured a universal winner.

Domain-marketplace examples describe hypothetical acceptance tests. No example asserts a Namefi integration with any listed network, changes Namefi's authoritative chain, or promises that a token transfer automatically changes registrar records.

The self-review checked unsupported superlatives, instant-exit claims, confidentiality claims, VM terminology, and the Polygon sunset. Frontmatter has five article routes, five glossary routes, two topic routes, and two series routes. Four major H2 sections precede the source list. The source list uses direct original links because production strips some raw HTML anchors. Images remain the parent agent's responsibility.
