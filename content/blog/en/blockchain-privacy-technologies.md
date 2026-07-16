---
title: "Top Blockchain Privacy Technologies: Zero-Knowledge Proofs, FHE, MPC, TEEs and Ring Signatures"
date: '2026-07-02'
language: en
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 50
format: roundup
description: A plain-language guide to the five leading blockchain privacy technologies—zero-knowledge proofs, FHE, MPC, TEEs, and ring signatures—compared side by side.
ogImage: ../../assets/blockchain-privacy-technologies-og.jpg
keywords: ['blockchain privacy', 'zero-knowledge proof', 'zkp', 'fully homomorphic encryption', 'fhe', 'secure multi-party computation', 'mpc', 'trusted execution environment', 'tee', 'ring signatures', 'stealth addresses', 'monero', 'zcash', 'zksync', 'starknet', 'privacy technology', 'confidential computing', 'onchain privacy', 'blockchain cryptography', 'privacy coins']
relatedArticles:
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/blockchain-virtual-machines/
  - /en/blog/blockchain-consensus-mechanisms/
  - /en/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /en/glossary/zero-knowledge-proof/
  - /en/glossary/fully-homomorphic-encryption/
  - /en/glossary/secure-multiparty-computation/
  - /en/glossary/trusted-execution-environment/
  - /en/glossary/cryptographic-security/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

Every transaction on a public [blockchain](/en/glossary/blockchain/) is, by default, visible to anyone who looks. Balances, transfer amounts, and counterparties sit in the open ledger forever. That transparency is the source of a blockchain's trust guarantees, but it is also a liability: no bank publishes customer balances, and no business wants its supplier payments or salary runs readable by competitors.

Blockchain privacy technologies exist to close that gap without giving up the properties that make chains useful in the first place—verifiability, decentralization, and the ability for strangers to transact without a trusted middleman. Five techniques dominate the current landscape: [zero-knowledge proofs](/en/glossary/zero-knowledge-proof/), [fully homomorphic encryption](/en/glossary/fully-homomorphic-encryption/) (FHE), [secure multi-party computation](/en/glossary/secure-multiparty-computation/) (MPC), [trusted execution environments](/en/glossary/trusted-execution-environment/) (TEEs), and ring signatures with stealth addresses. Each hides a different piece of the puzzle, trusts a different assumption, and costs a different amount of compute. This guide walks through all five, compares them side by side, and explains why the choice matters for anyone building on—or simply learning about—[Web3](/en/glossary/web3/).

---

## Zero-Knowledge Proofs

![A prover hands a verifier a glowing valid-proof badge while keeping the private witness locked behind their back, illustrating how a zero-knowledge proof verifies a public statement without revealing the secret](../../assets/blockchain-privacy-technologies-01-zero-knowledge.jpg)

A [zero-knowledge proof](/en/glossary/zero-knowledge-proof/) (ZKP) lets one party—the *prover*—convince another party—the *verifier*—that a public statement is true without revealing the private *witness* used to prove it, beyond anything already implied by the statement and its validity. In a claim such as "I know an `x` with `H(x) = y`," the verifier normally sees the statement and public value `y`; zero-knowledge protects `x`. Applications can separately hide or commit to parts of their public input, but hiding the statement itself is not part of the general ZKP definition ([Thaler, *Proofs, Arguments, and Zero-Knowledge*](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html)).

For a proof system to count as a genuine zero-knowledge protocol it has to satisfy three properties: completeness (an honest verifier accepts a true claim), soundness (a dishonest prover cannot make an honest verifier accept a false claim except with the proof system's bounded error probability), and zero-knowledge itself (the proof reveals no additional knowledge about the private witness beyond what follows from the public statement). Classical interactive protocols often use a commitment, verifier challenge, and prover response. Modern non-interactive SNARKs and STARKs package the necessary proof data without a live challenge from the verifier, while preserving the same high-level completeness, soundness, and zero-knowledge goals.

**What it hides:** the private witness, such as secret data or private computation inputs. The public statement and public inputs remain visible unless the application separately commits to or encrypts them.

**How it's used today:** ZK-rollups are the largest production use of ZKPs in blockchain scaling. They "bundle (or 'roll up') transactions into batches that are executed offchain," then generate a single validity proof that Ethereum verifies before finalizing the batch's state changes ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20bundle%20)). zkSync Era, built by Matter Labs, is "an EVM-compatible ZK Rollup...powered by its own zkEVM" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)), while Starknet, built by StarkWare, is a validity rollup that runs its own Cairo VM rather than the EVM (Solidity contracts are bridged in separately). L2BEAT tracks both as rollups secured by validity proofs rather than the fraud-proof challenge window used by optimistic rollups ([l2beat.com](https://l2beat.com/scaling/summary)). On the privacy side, [Zcash](https://z.cash/technology/) pioneered zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) for shielded transactions, where "users' addresses, their transaction amount" and other details stay encrypted while the network still confirms the transaction is valid ([z.cash](https://z.cash/technology/)).

**The trade-off:** generating a ZK proof is computationally expensive—proving circuits loop over every transaction in a batch and re-run its checks—so proving time and hardware cost are real constraints, even though verification on-chain is cheap and fast. Security rests on the proof system's cryptographic assumptions, secure parameter generation, and correct circuit and protocol implementation; for some proof systems it also includes a one-time trusted setup ceremony. Ethereum's documentation notes that compromised setup entropy can enable false proofs and that implementation errors can undermine the security model ([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/#trust-assumptions)).

---

## Fully Homomorphic Encryption (FHE)

![A locked box passes through a math machine operated by a cloud server with no key and comes out still locked but holding a computed result, illustrating computation performed directly on encrypted data](../../assets/blockchain-privacy-technologies-02-fhe.jpg)

[Fully homomorphic encryption](/en/glossary/fully-homomorphic-encryption/) takes a different approach: instead of proving a fact about hidden data, it lets you *compute directly on encrypted data* and get an encrypted result that decrypts to the same answer as if you'd computed on the plaintext. Zama, one of the leading FHE research and infrastructure companies, describes it this way: "FHE enables data processing without decryption—companies provide services without accessing user data, while users experience unchanged functionality" ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**What it hides:** the raw inputs, intermediate state, and outputs of a computation—everyone except the key holder sees only ciphertext, even the party doing the computing.

**How it works at a high level:** FHE schemes encode plaintext values into ciphertexts built on lattice-based mathematics, then define encrypted analogues of addition and multiplication so arbitrary circuits can run on ciphertexts. Applied to a blockchain, this means a smart contract can move tokens or evaluate logic without ever seeing the amounts involved—as Zama's own example puts it, "the blockchain verified Alice has sufficient funds without ever seeing the actual amounts" ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption#:~:text=The%20blockchain%20verified%20Alice%20has%20sufficient%20funds%20without%20ever%20seeing%20the%20actual%20amounts)). Zama also notes that lattice-based FHE schemes are "inherently post-quantum resilient," which matters for anyone thinking long-term about cryptographic risk ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**Example projects:** [Zama](https://www.zama.org/) builds the open-source FHE libraries (TFHE-rs, Concrete) and the fhEVM used to add confidential smart-contract execution to EVM chains. [Fhenix](https://cofhe-docs.fhenix.zone/) is a blockchain built specifically to let "developers build privacy-preserving smart contracts using Fully Homomorphic Encryption," so that "sensitive data remains encrypted throughout computation," with a JavaScript library (Cofhejs) for client-side encryption and a Solidity FHE library for on-chain encrypted operations ([cofhe-docs.fhenix.zone](https://cofhe-docs.fhenix.zone/)).

**The trade-off:** FHE's distinctive guarantee is that supported computation can run without decrypting the inputs or intermediate values, but its concrete security still depends on the scheme and parameter choices; HomomorphicEncryption.org publishes scheme-specific security tables and parameter-selection guidance for that reason ([HomomorphicEncryption.org](https://homomorphicencryption.org/security-guidelines/)). It is also the most computationally expensive approach on this list by a wide margin compared to plaintext execution, which is why FHE-based chains today run confidentiality-critical logic rather than every transaction, and why hardware acceleration for FHE is an active research race.

---

## Secure Multi-Party Computation (MPC)

![Three people each hold one puzzle-piece key shard, joined by dashed lines into a single signed transaction, illustrating how secure multi-party computation produces a joint result without any one party seeing the whole secret](../../assets/blockchain-privacy-technologies-03-mpc.jpg)

[Secure multi-party computation](/en/glossary/secure-multiparty-computation/) solves a related but distinct problem: instead of one party computing on encrypted data, *several* parties who each hold a private piece of the input jointly compute a function without revealing their individual inputs to each other. As the formal definition puts it, MPC is "a subfield of cryptography with the goal of creating methods for parties to jointly compute a function over their inputs while keeping those inputs private," so that, for three participants, "Alice, Bob, and Charlie can still learn F(x, y, z) without revealing who makes what" ([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation#:~:text=Secure%20multi%2Dparty%20computation%20)).

**What it hides:** each party's individual input from every other party—only the agreed-upon output is revealed, and no single participant ever sees the full secret.

**Trust assumption:** there is no universal MPC corruption threshold. In the classic BGW result for a complete network, privacy against passive faults holds for `t < n/2`, while robustness against Byzantine faults holds for `t < n/3` ([ACM](https://doi.org/10.1145/62212.62213)). Those bounds describe that protocol model, not all MPC: perfectly secure protocols can reach `t < n/2` when broadcast is assumed ([TCC 2021](https://www.iacr.org/archive/tcc2021/130420196/130420196.pdf)), while the computational SPDZ protocol provides active security with up to `n - 1` corrupt parties in its preprocessing model ([IACR](https://eprint.iacr.org/2011/535)). That dishonest-majority guarantee is security with abort—a corrupt participant can still stop the computation—rather than fairness or guaranteed output ([PoPETs](https://petsymposium.org/popets/2024/popets-2024-0053.php)). A concrete deployment must therefore state the protocol, passive or active corruption model, synchrony and channel/setup assumptions (including broadcast), and whether it assumes an honest or dishonest majority.

**How it's used today—threshold-signature custody:** the most visible blockchain application of MPC is splitting a private key across independent parties so no single device or person ever holds the whole key. Custody infrastructure provider Fireblocks describes it directly: "Multi-party computation (MPC) is a cryptographic method that splits a private key into separate shares distributed across multiple independent parties," and critically, "the complete key is never assembled in one place, at any point in time" ([fireblocks.com](https://www.fireblocks.com/what-is-mpc#:~:text=Multi%2Dparty%20computation%20)). When a transaction needs signing, a quorum of endpoints each validate the transaction and contribute a partial signature; "at no point is the private key assembled," so "even if one endpoint is compromised...the key shares held elsewhere are useless in isolation" ([fireblocks.com](https://www.fireblocks.com/what-is-mpc)). This threshold-signature pattern now underpins most institutional crypto custody and many multi-signer wallets.

**The trade-off:** MPC avoids the single point of failure of one private key sitting on one device, but it adds communication rounds between parties (latency) and requires careful protocol design. Its guarantee is only as strong as the chosen protocol's cryptographic, corruption, and network assumptions and the operational independence of the parties; MPC can remove a single key holder without removing trust from the system design.

---

## Trusted Execution Environments (TEEs)

A [trusted execution environment](/en/glossary/trusted-execution-environment/) takes yet another route: rather than encrypting data throughout a computation, it isolates the computation inside a hardware-protected region of a chip—a *secure enclave*—that even the machine's own operating system cannot inspect. Intel's SGX (Software Guard Extensions), the best-known implementation, is described on Wikipedia as "a set of instruction codes implementing trusted execution environment that are built into some Intel central processing units (CPUs)" ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=Intel%20Software%20Guard%20Extensions)). Mechanically, "SGX involves encryption by the CPU of a portion of memory (the enclave)," so "data and code originating in the enclave are decrypted on the fly within the CPU, protecting them from being examined or read by other code," including "code running at higher privilege levels such as the operating system and any underlying hypervisors" ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)).

**What it hides:** the data and code inside the enclave from every other process on the same machine, including a compromised OS—useful when you need to trust a specific piece of code's execution without trusting the server operator.

**Trust assumption:** the divide is not "pure mathematics" for ZKPs, FHE, and MPC versus only vendor trust for a TEE. Deployed cryptographic systems also depend on their stated hardness assumptions, parameters or setup, correct implementations, and—for MPC—the protocol's participant and communication model. A TEE adds hardware-backed isolation and attestation to that system trust. Intel defines the SGX trusted computing base as the hardware, CPU firmware, and platform software required to meet SGX's security objectives; attestation lets a relying party assess the enclave identity and platform patch level ([Intel](https://www.intel.com/content/www/us/en/security-center/technical-details/sgx-attestation-technical-details.html)). That trust boundary has been tested: SGX "does not protect against side-channel attacks," and researchers have repeatedly demonstrated practical breaks, from extracting "RSA keys from SGX enclaves running on the same system within five minutes" (2017) to the Foreshadow attack that "combines speculative execution and buffer overflow to bypass the SGX" (2018), plus later vulnerabilities including Plundervolt, LVI, SGAxe, and ÆPIC Leak ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=While%20this%20can%20mitigate%20many%20kinds%20of%20attacks%2C%20it%20does%20not%20protect%20against%20side%2Dchannel%20attacks)). This history is why TEEs are usually described as a pragmatic, faster middle ground rather than a cryptographically airtight guarantee.

**Example projects:** [Oasis Protocol](https://oasis.net/technology)'s Sapphire network runs smart contracts inside hardware enclaves so users can "run code inside hardware-secured enclaves" where "data stays encrypted even from server operators," while "every execution produces cryptographic proof that users can verify without blind trust"—delivering "confidential smart contracts" that keep "EVM compatibility and composability" ([oasis.net](https://oasis.net/technology)). Secret Network and several restaking-adjacent privacy products also build on TEEs, often in combination with other techniques for defense in depth.

**The trade-off:** TEEs run close to native speed—far faster than FHE or heavy ZK proving—which makes them attractive for latency-sensitive applications, but that speed comes with a broader hardware-and-software trusted computing base that has a real, documented history of side-channel breaks. The comparison is therefore among different system assumptions, not hardware trust versus assumption-free "pure cryptography."

---

## Ring Signatures and Stealth Addresses

The last pair of techniques protects a narrower but very practical target: hiding *who* sent a transaction and *who* received it, even though the transaction itself is visible on-chain. [Monero](https://www.getmonero.org/) is the leading production example of both.

**Ring signatures** hide the sender. Monero's own documentation explains that "a ring signature is a type of digital signature that can be performed by any member of a group of users that each have keys," where "it should be computationally infeasible to determine which of the group members' keys was used to produce the signature" ([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html#:~:text=a%20ring%20signature%20is%20a%20type%20of%20digital%20signature)). In practice, a Monero transaction mixes the real spender's key with decoy public keys "pulled from the blockchain using a gamma distribution method," so that "in a 'ring' of possible signers, all ring members are equal and valid" and "there is no way an outside observer can tell which of the possible signers in a signature group belongs to your account" ([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)).

**Stealth addresses** hide the recipient. Rather than reusing one public address, "the sender [creates] random one-time addresses for every transaction on behalf of the recipient," so that incoming payments "go to unique addresses on the blockchain, where they cannot be linked back to either the recipient's published address or any other transactions' addresses" ([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html#:~:text=They%20allow%20and%20require%20the%20sender%20to%20create%20random%20one%2Dtime%20addresses)). A recipient uses a private view key to scan the chain for payments and a private spend key to move them, so "only the sender and receiver can determine where a payment was sent" ([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)).

**What it hides:** sender identity (ring signatures) and recipient identity (stealth addresses); transaction *amounts* are hidden by a separate mechanism (Confidential Transactions / RingCT), not covered by these two techniques alone.

**The trade-off:** both techniques run efficiently on ordinary hardware with no proving overhead or enclave dependency, making them well suited to a live payments network. But the trust model relies on decoy sets being statistically indistinguishable from the real signer—weak decoy selection or blockchain analysis heuristics have historically narrowed anonymity sets on early ring-signature deployments, so parameter choices (ring size, decoy distribution) matter as much as the underlying primitive.

---

## Comparing the Five Approaches

| Technology | What it hides | Trust assumption | Performance cost | Maturity today | Example projects |
|---|---|---|---|---|---|
| Zero-knowledge proofs | Private witness/data; public statement remains visible unless separately hidden | Proof-system assumptions, parameters, and circuit/protocol implementation; trusted setup for some systems | High to generate proofs; cheap to verify | Production at scale (rollups, shielded payments) | zkSync, Starknet, Zcash |
| Fully homomorphic encryption | All data throughout computation, even from the compute provider | Scheme hardness assumptions plus secure parameter and implementation choices | Very high compute overhead | Early production; active hardware-acceleration research | Zama, Fhenix |
| Secure multi-party computation | Each party's individual input | Protocol-specific corruption threshold, network/setup model, and participant independence | Moderate; added communication rounds | Mature and widely deployed in custody | Fireblocks and other threshold-signature custodians |
| Trusted execution environments | Data/code from every other process, including the OS | Attested enclave code plus the hardware, firmware, and software TCB and its patch state | Near-native speed | Production, but with a documented side-channel attack history | Intel SGX, Oasis Sapphire |
| Ring signatures & stealth addresses | Sender identity and recipient identity | Statistical indistinguishability of decoy sets | Low; efficient on commodity hardware | Mature, live for over a decade | Monero |

No single technology wins on every axis—that's why current research increasingly combines them, such as ZK proofs verifying the correctness of an MPC computation, or TEEs used alongside FHE for defense in depth.

---

## How This Connects to Tokenized Domains

[Tokenized domains](/en/glossary/tokenize/) inherit the same transparency-by-default property as any other on-chain asset: ownership transfers, bids, and metadata updates are publicly readable. That is mostly a feature—provenance and ownership history are exactly what make a [tokenized domain](/en/blog/what-are-tokenized-domains/) trustworthy as a tradable asset—but it also means a domain portfolio's holdings and sale prices are visible to anyone watching the chain.

The privacy technologies in this guide point toward where domain-as-NFT infrastructure could go next: MPC-based threshold custody already secures institutional [wallets](/en/glossary/wallet/) holding domain NFTs the same way it secures other digital assets; ZK proofs could eventually let a bidder prove they can afford an offer without revealing their full balance; and confidential-computation techniques could let a registrar or marketplace verify eligibility rules without exposing a buyer's full identity. None of this is deployed in domain tokenization today, but the underlying primitives are the same ones securing billions of dollars in DeFi and custody infrastructure right now.

---

## Sources and Further Reading

- [Zero-Knowledge Proofs — ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)
- [Proofs, Arguments, and Zero-Knowledge — Justin Thaler](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html)
- [ZK-Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [L2BEAT Scaling Summary](https://l2beat.com/scaling/summary)
- [Zcash Technology Overview](https://z.cash/technology/)
- [Introduction to Homomorphic Encryption — Zama](https://www.zama.org/introduction-to-homomorphic-encryption)
- [Security Guidelines — HomomorphicEncryption.org](https://homomorphicencryption.org/security-guidelines/)
- [Fhenix cofhe Documentation](https://cofhe-docs.fhenix.zone/)
- [Secure Multi-Party Computation — Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)
- [Completeness Theorems for Non-Cryptographic Fault-Tolerant Distributed Computation — ACM](https://doi.org/10.1145/62212.62213)
- [Efficient Perfectly Secure Computation — TCC 2021](https://www.iacr.org/archive/tcc2021/130420196/130420196.pdf)
- [Multiparty Computation from Somewhat Homomorphic Encryption (SPDZ) — IACR](https://eprint.iacr.org/2011/535)
- [Extending the Security of SPDZ with Fairness — PoPETs](https://petsymposium.org/popets/2024/popets-2024-0053.php)
- [What Is MPC? — Fireblocks](https://www.fireblocks.com/what-is-mpc)
- [Software Guard Extensions (SGX) — Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)
- [Intel SGX Attestation Technical Details](https://www.intel.com/content/www/us/en/security-center/technical-details/sgx-attestation-technical-details.html)
- [Oasis Protocol Technology](https://oasis.net/technology)
- [Ring Signatures — Monero Moneropedia](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)
- [Stealth Addresses — Monero Moneropedia](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)
