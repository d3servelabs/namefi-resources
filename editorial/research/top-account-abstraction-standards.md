# Research supports the account-abstraction comparison

Locale: en-US. Research date: 2026-10-21 UTC. Scope: textual research, manuscript, and textual fact-check only. The parent handles illustrations and repository validation/publication.

The author opened each original specification through the web tool and read the cited sections. Source status comes from each official page header. The previous September draft served only as a topic lead. No archive snapshot was verified or invented.

| Original source and locator | Verified claim | Caveat |
| --- | --- | --- |
| https://eips.ethereum.org/EIPS/eip-4337#specification | Final; UserOperation, bundler, EntryPoint, account validation | Standard compatibility does not establish implementation safety |
| https://eips.ethereum.org/EIPS/eip-4337#extension-paymasters | Paymaster deposit and willingness checks support optional sponsorship | No unlimited or guaranteed free gas |
| https://eips.ethereum.org/EIPS/eip-4337#support-for-eip-7702-authorizations | 7702-enabled networks can carry authorizations with operations | Check the actual implementation combination |
| https://eips.ethereum.org/EIPS/eip-7702#behavior | Final; delegation indicator, clearing, execution failure does not undo processed delegation | Persistent delegation is not a temporary script |
| https://eips.ethereum.org/EIPS/eip-7702#persistence-of-code-delegation | Persistent code delegation rationale | Later valid authorization can replace or clear delegation |
| https://eips.ethereum.org/EIPS/eip-7702#interaction-with-applications-and-wallets | Delegated code has unrestricted account access | Limited permissions require a higher-level implementation |
| https://eips.ethereum.org/EIPS/eip-7702#security-considerations | Initialization and storage deserve implementation review | No claim that replacement recovers lost assets |
| https://eips.ethereum.org/EIPS/eip-1271#specification | Final; isValidSignature, 0x1626ba7e, no state modification, context-dependent policy | A prior success is not proof of permanent authorization |
| https://eips.ethereum.org/EIPS/eip-1271#rationale | Contract policy determines authorized message signature | Transaction submission and replay policy remain separate |
| https://eips.ethereum.org/EIPS/eip-7579#abstract | Draft; modular interface, ERC-1271 compliance | Draft interface and exact implementation need rechecking |
| https://eips.ethereum.org/EIPS/eip-7579#modules | Validators, executors, fallback handlers, hooks | Roles have different privileges |
| https://eips.ethereum.org/EIPS/eip-7579#differentiating-module-types | Conflating roles can allow arbitrary execution | No module-security guarantee |
| https://eips.ethereum.org/EIPS/eip-7579#dependence-on-erc-4337 | Current strict validation-flow dependency | Do not describe a possible future extension as current behavior |

All source fetch dates: 2026-10-21 UTC. First fetch clock: 2026-10-21 16:57:08 UTC. Additional source opens occurred during this same research pass.

The manuscript follows content/blog/en/README.md: direct inline primary links with exact section locators, and final source notes. Raw HTML local reference anchors are unsuitable because the production renderer may strip anchors. This is the article-writing skill's documented fallback.

All business, marketplace, automation, and domain examples are hypothetical acceptance tests or recommendations. The manuscript makes no claim that Namefi implements any named standard. No statistics, adoption counts, fee comparisons, or named-wallet compatibility claims appear.

Text review checked persistent 7702 authority, changing ERC-1271 policy, ERC-7579 privilege separation, optional sponsorship, specification status, mobile three-column tables, four major sections, and existing internal metadata routes. Images and full repository gates remain with the parent.
