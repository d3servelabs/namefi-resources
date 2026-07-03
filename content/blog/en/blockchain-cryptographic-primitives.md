---
title: "Top Cryptographic Primitives Behind Every Blockchain"
date: '2026-07-02'
language: en
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
format: roundup
description: A guide to the core cryptographic primitives that make blockchains work—hash functions, digital signatures, Merkle trees, elliptic-curve crypto, and commitments.
ogImage: ../../assets/blockchain-cryptographic-primitives-og.jpg
keywords: ['blockchain cryptography', 'cryptographic primitives', 'hash function', 'SHA-256', 'Keccak-256', 'digital signature', 'ECDSA', 'EdDSA', 'BLS signature', 'merkle tree', 'elliptic curve cryptography', 'secp256k1', 'commitment scheme', 'post-quantum cryptography', 'public key cryptography', 'blockchain security']
relatedArticles:
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/blockchain-consensus-mechanisms/
  - /en/blog/blockchain-virtual-machines/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /en/glossary/hash-function/
  - /en/glossary/digital-signature/
  - /en/glossary/merkle-tree/
  - /en/glossary/public-key/
  - /en/glossary/private-key/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

Every blockchain claim — "this transaction is final," "this address owns this asset," "this history hasn't been altered" — ultimately reduces to a handful of cryptographic primitives doing narrow, well-defined jobs. None of them are blockchain inventions. Hash functions, digital signatures, and Merkle trees predate Bitcoin by decades. What blockchains did was combine them into a system where no single party has to be trusted for any of those claims to hold.

This guide walks through the primitives that actually carry the weight: [hash functions](/en/glossary/hash-function/) that fingerprint data, [digital signatures](/en/glossary/digital-signature/) that authorize transactions, [Merkle trees](/en/glossary/merkle-tree/) that make huge datasets verifiable in pieces, the elliptic-curve math those signatures run on, and commitment schemes — the building block that leads into [zero-knowledge proofs](/en/glossary/zero-knowledge-proof/). Understanding each one is the fastest way to understand what a blockchain is actually doing under the hood.

---

## Cryptographic Hash Functions (SHA-256, Keccak)

![A document fed into a hash function machine produces a fixed-length fingerprint digest, and changing a single letter in the input produces a completely different digest, illustrating the avalanche effect](../../assets/blockchain-cryptographic-primitives-01-hash-function.jpg)

A [hash function](/en/glossary/hash-function/) takes an input of any size and deterministically produces a fixed-size output — a "digest" — such that flipping a single bit of input scrambles the output completely, and finding two different inputs that hash to the same output is computationally infeasible. That property, collision resistance, is what makes a hash usable as a compact, tamper-evident fingerprint for arbitrarily large data.

Bitcoin uses SHA-256 throughout: block headers are chained by embedding the SHA256(SHA256()) hash of the previous header in each new one, so altering any past block changes its hash and breaks every header that follows it ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Each%20block%20also%20stores%20the%20hash%20of%20the%20previous%20block%27s%20header%2C%20chaining%20the%20blocks%20together)). The same double-SHA-256 construction hashes transactions into the block's [Merkle tree](/en/glossary/merkle-tree/) ([Bitcoin.org reference](https://developer.bitcoin.org/reference/block_chain.html#:~:text=A%20SHA256%28SHA256%28%29%29%20hash%20in%20internal%20byte%20order)).

Ethereum instead standardizes on Keccak-256 (the original Keccak submission, distinct from the later NIST SHA-3 standard) as its general-purpose hash. Every account address is derived by taking the last 20 bytes of the Keccak-256 hash of the account's [public key](/en/glossary/public-key/) ([ethereum.org](https://ethereum.org/en/developers/docs/accounts/#:~:text=You%20get%20a%20public%20address%20for%20your%20account%20by%20taking%20the%20last%2020%20bytes%20of%20the%20Keccak-256%20hash%20of%20the%20public%20key)), and the same function underlies the key/value content-addressing used throughout the [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=key%20%3D%3D%20keccak256%28rlp%28value%29%29) that stores Ethereum's state.

Hashing is also what turns block headers into a genuine chain rather than a loose collection of records — each header's hash depends on the previous header's hash, so rewriting history requires redoing every block after the point you want to change, plus outrunning the honest network's ongoing work. That "chaining" property is the literal reason the data structure is called a **blockchain**.

---

## Public-Key Cryptography & Digital Signatures (ECDSA, EdDSA, BLS)

![A private key signs a transaction to produce a digital signature, which a matching public key verifies as valid with a green checkmark while a mismatched public key rejects it with a red X](../../assets/blockchain-cryptographic-primitives-02-signatures.jpg)

A blockchain has no login form, so it needs another way to prove "this transaction really came from the owner of this account." [Public-key cryptography](/en/glossary/public-key/) solves this with a key pair: a [private key](/en/glossary/private-key/) kept secret and a public key that can be shared freely. Signing a transaction with the private key produces a [digital signature](/en/glossary/digital-signature/) that anyone can verify against the public key — proving authorization without ever revealing the private key itself.

Ethereum accounts derive their public key from the private key using the Elliptic Curve Digital Signature Algorithm, ECDSA, over the secp256k1 curve — the same curve Bitcoin uses ([ethereum.org accounts docs](https://ethereum.org/en/developers/docs/accounts/#:~:text=The%20public%20key%20is%20generated%20from%20the%20private%20key%20using%20the%20Elliptic%20Curve%20Digital%20Signature%20Algorithm); [EIP-2, secp256k1 signature malleability fix](https://eips.ethereum.org/EIPS/eip-2#:~:text=secp256k1n%2F2)). ECDSA is fast to verify and has decades of scrutiny, but it has one operational weakness relevant to newer designs: individual ECDSA signatures don't aggregate efficiently, so verifying thousands of them means doing thousands of separate checks.

That's the gap EdDSA and BLS signatures fill. EdDSA (used by chains like Solana and Stellar) uses a different curve construction that's deterministic and resistant to certain implementation pitfalls that have historically caused ECDSA nonce-reuse bugs. BLS signatures go further: because of the mathematical pairing property of the curves they use, many BLS signatures can be combined into a single aggregate signature that verifies all of them at once. Ethereum's proof-of-stake consensus layer relies on exactly this — validators sign attestations with BLS keys so the beacon chain can aggregate votes from hundreds of thousands of validators into signatures compact enough to verify quickly, which is what makes large-scale proof-of-stake practical at all ([ethereum.org, *The Beacon Chain*](https://eth2book.info/capella/part2/building_blocks/signatures/#:~:text=BLS%20signatures%20can%20be%20aggregated%20together%2C%20making%20them%20efficient%20to%20verify%20at%20large%20scale)). Ethereum also exposes BLS12-381 curve operations as EVM precompiles specifically to support BLS signature verification in smart contracts ([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#:~:text=Add%20functionality%20to%20efficiently%20perform%20operations%20over%20the%20BLS12-381%20curve%2C%20including%20those%20for%20BLS%20signature%20verification)).

---

## Merkle Trees

![A pyramid of Merkle tree hash nodes combining pairwise up to a single root, with one leaf-to-root proof path highlighted in orange showing a light-client Merkle proof](../../assets/blockchain-cryptographic-primitives-03-merkle-tree.jpg)

A [Merkle tree](/en/glossary/merkle-tree/) is what lets a blockchain summarize thousands of transactions into a single 32-byte hash without forcing every participant to store every transaction. Leaves are hashes of individual data items (transactions, account states); each pair of hashes is concatenated and hashed again, repeating until one hash — the root — remains ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Copies%20of%20each%20transaction%20are%20hashed%2C%20and%20the%20hashes%20are%20then%20paired%2C%20hashed%2C%20paired%20again%2C%20and%20hashed%20again%20until%20a%20single%20hash%20remains%2C%20the%20merkle%20root%20of%20a%20merkle%20tree)). That root is stored directly in the block header, which is what lets a full node commit to the entire contents of a block using almost no extra space.

The payoff is proof size. To show that one transaction is included in a block, you don't need the whole block — just the transaction plus a "Merkle branch," the sibling hashes along the path from that leaf to the root, typically on the order of log₂(n) hashes for n transactions. This is the basis of Simplified Payment Verification (SPV): a lightweight client that has only block headers can still verify a specific transaction happened by checking its Merkle branch against the header's root, without downloading the entire blockchain ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/operating_modes.html#:~:text=the%20merkle%20root%20in%20the%20block%20header%20along%20with%20a%20merkle%20branch%20can%20prove%20to%20the%20SPV%20client%20that%20the%20transaction%20in%20question%20is%20embedded%20in%20a%20block%20in%20the%20block%20chain)).

Ethereum extends the idea with the Merkle Patricia Trie, a hybrid of a Merkle tree and a prefix (radix) trie used to store the entire account state, not just a list of transactions. Every block header carries three separate trie roots — `stateRoot`, `transactionsRoot`, and `receiptsRoot` — each independently provable ([ethereum.org](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=From%20a%20block%20header%20there%20are%203%20roots%20from%203%20of%20these%20tries)). This is what lets a smart contract or a light client verify a single account balance or a single storage slot without replaying the whole chain.

---

## Elliptic-Curve Cryptography

Elliptic-curve cryptography (ECC) is the mathematical foundation ECDSA, EdDSA, and BLS all sit on top of. Instead of relying on the difficulty of factoring large numbers (as classic RSA does), ECC relies on the difficulty of the elliptic-curve discrete logarithm problem: given a point on the curve reached by adding a base point to itself many times, it's computationally infeasible to recover how many times — even though computing the point itself, going forward, is easy. That asymmetry (easy one direction, hard to reverse) is exactly what makes a private key safe to use for signing while the derived public key stays safe to publish.

The specific curve matters. Bitcoin and Ethereum both use secp256k1, a Koblitz curve standardized by the Standards for Efficient Cryptography Group with well-studied 256-bit parameters ([SEC 2: Recommended Elliptic Curve Domain Parameters](https://www.secg.org/sec2-v2.pdf)). Other ecosystems use different curves for different tradeoffs — Ed25519 (the curve behind EdDSA in Solana and Stellar) prioritizes implementation safety and speed, while BLS12-381 is chosen specifically because it supports the pairing operations aggregation needs. All of them deliver roughly the same practical security level per key bit while producing much shorter keys and signatures than equivalent RSA — which is why ECC, not RSA, became the default for blockchain accounts.

---

## Commitment Schemes (a Bridge to Zero-Knowledge)

A commitment scheme lets you "lock in" a value — publish something that binds you to a specific piece of data — without revealing the data itself, and later "open" the commitment to prove what it was. The everyday analogy is a sealed envelope: you can hand someone a sealed envelope today as proof you already decided on an answer, without them seeing it until you choose to open it later, and once sealed, you can't swap the answer inside.

This sounds like a small primitive, but it's the load-bearing piece underneath most zero-knowledge proof systems. Ethereum's blob-based data-availability design, for instance, uses KZG commitments — a polynomial commitment scheme — to reduce a large blob of rollup data down to a single small cryptographic commitment that provers and verifiers can check without processing the full blob ([ethereum.org, Danksharding](https://ethereum.org/en/roadmap/danksharding/#:~:text=KZG%20stands%20for%20Kate-Zaverucha-Goldberg)). A Merkle root, in fact, is itself a simple commitment scheme: it commits to an entire dataset via its root hash, and a Merkle branch is the "opening" that reveals one piece of it. ZK-rollups build on more advanced commitment schemes (polynomial and vector commitments) to compress an entire batch of transaction execution into a proof that's cheap to verify on-chain — the topic covered in depth in [Perfect vs. Computational Zero-Knowledge](/en/blog/perfect-vs-computational-zero-knowledge/).

---

## Comparison: Blockchain Cryptographic Primitives

| Primitive | Property it provides | Where it's used on-chain | Classical vs. post-quantum risk |
|---|---|---|---|
| Hash functions (SHA-256, Keccak-256) | Collision-resistant fingerprinting; chains blocks together | Block hashing, address derivation, Merkle roots | Classically strong at current output sizes; hash-based schemes are generally considered more resilient to quantum attack than today's elliptic-curve signatures |
| Digital signatures — ECDSA | Transaction authorization via a private/public key pair | Bitcoin and Ethereum account signatures | Classically secure; a sufficiently capable large-scale quantum computer is expected to break elliptic-curve-based schemes, which is why NIST has standardized post-quantum alternatives ([NIST, 2024](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards#:~:text=A%20sufficiently%20capable%20quantum%20computer%2C%20though%2C%20would%20be%20able%20to%20sift%20through%20a%20vast%20number%20of%20potential%20solutions%20to%20these%20problems%20very%20quickly%2C%20thereby%20defeating%20current%20encryption)) |
| Digital signatures — EdDSA / BLS | Deterministic signing (EdDSA); efficient signature aggregation (BLS) | Solana/Stellar signing (EdDSA); Ethereum validator attestations (BLS) | Same underlying elliptic-curve assumption as ECDSA — same long-term quantum exposure |
| Merkle trees | Compact commitment to a large dataset; small inclusion proofs | Block headers, light-client (SPV) verification, Ethereum's state/transactions/receipts tries | Depends only on the underlying hash function's collision resistance, so it inherits that hash's quantum posture rather than adding new exposure |
| Elliptic-curve cryptography | Mathematical basis for compact keys and signatures | secp256k1 (Bitcoin, Ethereum), Ed25519, BLS12-381 | Vulnerable in the same way as ECDSA/EdDSA/BLS to a future large-scale quantum computer; this is the primary driver of post-quantum migration research |
| Commitment schemes | Bind to a value now, reveal/prove it later, without exposing it upfront | KZG commitments in Ethereum data availability; Merkle roots as simple commitments; building block for ZK-rollups | Security depends on the underlying hash or elliptic-curve assumption used to build the scheme |

---

## How This Connects to Tokenized Domains

Every one of these primitives shows up directly when you [tokenize](/en/glossary/tokenize/) a domain. The [NFT](/en/glossary/nft/) representing ownership is secured by the same ECDSA signatures that protect any other blockchain asset — whoever controls the private key controls the domain token, full stop, which is why [hardware wallets](/en/glossary/hardware-wallet/) and careful [seed phrase](/en/glossary/seed-phrase/) custody matter as much for a tokenized `.com` as for any other on-chain asset. The domain's ownership record lives in the same Merkle-committed state that secures every other account balance and [smart contract](/en/glossary/smart-contract/) on the chain, which is exactly what gives a tokenized domain the same tamper-evidence as any other on-chain asset — transferable, verifiable, and provably owned without a registrar's database being the sole source of truth.

Understanding these primitives also clarifies what tokenization does and doesn't change: the domain's DNS record and registry status still follow ICANN rules, but its ownership proof now runs on the cryptography described above instead of a login-protected [registrar](/en/glossary/registrar/) account. Explore the broader picture in [Blockchain Consensus Mechanisms](/en/blog/blockchain-consensus-mechanisms/) and [Blockchain Scaling Approaches](/en/blog/blockchain-scaling-approaches/), or start tokenizing at [namefi.io](https://namefi.io).

---

## Sources and Further Reading

- Bitcoin Developer Guide — [Block Chain](https://developer.bitcoin.org/devguide/block_chain.html), chaining via SHA256(SHA256()) of the previous header
- Bitcoin Developer Reference — [Block Chain](https://developer.bitcoin.org/reference/block_chain.html), Merkle root construction
- Bitcoin Developer Guide — [Operating Modes](https://developer.bitcoin.org/devguide/operating_modes.html), SPV and Merkle branches
- ethereum.org — [Ethereum Accounts](https://ethereum.org/en/developers/docs/accounts/), ECDSA and Keccak-256 address derivation
- ethereum.org — [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/), state/transactions/receipts roots
- ethereum.org — [Danksharding](https://ethereum.org/en/roadmap/danksharding/), KZG polynomial commitments
- EIP-2 — [Homestead Hard-fork Changes](https://eips.ethereum.org/EIPS/eip-2), secp256k1 signature constraints
- EIP-2537 — [Precompile for BLS12-381 curve operations](https://eips.ethereum.org/EIPS/eip-2537)
- SEC 2: Recommended Elliptic Curve Domain Parameters — [secg.org](https://www.secg.org/sec2-v2.pdf)
- *The Eth2 Book* — [Signatures and BLS aggregation](https://eth2book.info/capella/part2/building_blocks/signatures/)
- NIST — [NIST Releases First 3 Finalized Post-Quantum Encryption Standards](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards)
