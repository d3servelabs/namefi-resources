# The FHE project comparison distinguishes current execution models

Research and manuscript text review completed on 2026-10-21 UTC. Scope: `content/blog/en/top-fhe-projects.md`, series order 120. The article uses en-US. Images, publication, shared validation, and independent parent review remain outside this writer's scope.

## The review opened eleven public primary sources

Each cited page returned readable public source text through the web tool. GitHub pages exposed their repository README content without login. The raw README URLs below served as additional corroborating retrievals. The record does not claim an archive snapshot or an HTTP status code unavailable in tool output.

| Verified source | Supported claims | Important limits |
|---|---|---|
| https://docs.zama.org/protocol/protocol/overview.md | FHEVM library, host contracts, coprocessors, Gateway, threshold MPC KMS, relayer | Component description does not establish all deployment thresholds |
| https://docs.zama.org/protocol/zama-protocol-litepaper/zama-confidential-blockchain-protocol-litepaper | Sections The Zama Confidential Blockchain Protocol, Roadmap, Components: separate FHE/MPC/ZK roles, Ethereum Mainnet live label, Nitro Enclaves for KMS software | Roadmap contains mixed future and current wording. Article makes no forecast or throughput assertion |
| https://docs.zama.org/protocol/protocol-apps/chains | Mainnet and Testnet sections list configurations separately | Listing does not prove every application/feature ready |
| https://cofhe-docs.fhenix.zone/ | Live CoFHE, live Wallet Module, coming-soon Trading | Product live label does not identify supported chain deployment |
| https://cofhe-docs.fhenix.zone/cofhe | Key resources: SDK encryption, ACPs, output decryption, Solidity FHE library | Current overview confirms interface roles only |
| https://cofhe-docs.fhenix.zone/llms.txt | Client SDK guide names include decrypt to view and decrypt to transact, latter described with Teecryptor signature | Index is limited evidence. Detailed compatibility and decryption pages failed web retrieval. No CoFHE mainnet/network/security threshold claim made |
| https://docs.inco.org/architecture/components | Confidential Compute Server explicitly runs inside TEE, computation/decryption, client key/signature handling | Current Lightning is not presented as FHE execution |
| https://docs.inco.org/home | Build with Inco: EVM live on Base, SVM beta | These are provider-reported status labels, not an independent audit |
| https://docs.inco.org/guide/best-practices | Handle allowance, new-handle permissions, public-price/auction inference, handle binding | Recommendations remain architecture-specific where method names differ |
| https://github.com/Sunscreen-tech/Sunscreen#readme | First README line distinguishes BFV repository and points to SPF TFHE compiler; warning says experiments only, no external audit | No implication this legacy library has current production approval |
| https://github.com/Sunscreen-tech/spf#overview | TFHE variant, Parasol components, LLVM compiler requirement, Disclaimers says code unaudited | Tooling repository is not evidence of a managed blockchain service |

Additional opened primary pages: https://docs.inco.org/architecture/overview, https://docs.inco.org/quickstart, https://sunscreen.tech/, https://docs.zama.org/protocol, https://docs.zama.org/protocol/llms.txt, https://docs.inco.org/llms.txt. These informed navigation but do not add material unsupported claims.

Raw README checks: https://raw.githubusercontent.com/Sunscreen-tech/Sunscreen/main/README.md and https://raw.githubusercontent.com/Sunscreen-tech/spf/main/README.md. Both expose the same relevant wording as their GitHub README sections.

The generic https://docs.sunscreen.tech/ returned a Parasol title but no readable body through the web tool. The article relies on the official GitHub README instead. Zama's detailed KMS page failed retrieval, so the accessible overview and litepaper provide the support. Fhenix detail paths listed in llms.txt repeatedly failed retrieval with and without `.md`. No claim treats those failed fetches as verification.

## The text review narrowed project and readiness claims

- The title's “top” denotes a shortlist. The manuscript excludes token valuations, investment advice, unverified throughput comparisons, and market-size claims.
- Inco remains in the planned four-project comparison as a TEE alternative. The manuscript explicitly excludes current Lightning from an FHE-specific execution requirement.
- Sunscreen includes the BFV-to-SPF/Parasol distinction. Both legacy experimental status and current SPF unaudited status remain explicit.
- Zama's Ethereum mainnet statement comes from an explicit current official label. No inference converts a promised Solana or other network roadmap into a completed deployment.
- Fhenix's “live” product label remains distinct from an unverified chain-specific mainnet assertion. The documentation index supports only the named decryption workflows and signature description.
- The confidential balance example is explicitly illustrative. It contains no untested SDK code and asserts no API equivalence. Review requirements and project-fit conclusions are labeled analysis.
- Four substantive H2 sections cover the four projects. All comparison tables have three columns. Five article, five glossary, two topic, and two series relationships use existing routes. No glossary stub was created.
- Inline citations use direct original links with actual section headings or a literal text fragment. The production renderer can strip raw HTML anchors, so none were added.
- The text review checked claim/source alignment, unsupported superlatives, hypothetical versus deployed behavior, permissions, decryption trust, privacy leakage, table width, and a natural-prose pass.

Body word count excluding frontmatter and source notes: 1,845, using words after removing link destinations. No images were created or wired. The coordinator owns the specified OG asset and four section illustrations.
