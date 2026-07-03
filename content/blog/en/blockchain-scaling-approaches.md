---
title: "Top Blockchain Scaling Approaches: Rollups, Sidechains, Channels and Sharding"
date: '2026-07-02'
language: en
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 40
format: roundup
description: A learner's guide to blockchain scaling — optimistic rollups, ZK rollups, sidechains, payment channels, sharding, and data availability layers compared.
ogImage: ../../assets/blockchain-scaling-approaches-og.jpg
keywords: ['blockchain scaling', 'blockchain scaling solutions', 'layer 2 scaling', 'rollups', 'optimistic rollup', 'zk rollup', 'sidechains', 'payment channels', 'state channels', 'sharding', 'data availability', 'scalability trilemma', 'Arbitrum', 'Optimism', 'zkSync', 'Starknet', 'Celestia', 'EigenDA', 'Polygon PoS', 'Lightning Network']
relatedArticles:
  - /en/blog/blockchain-virtual-machines/
  - /en/blog/blockchain-consensus-mechanisms/
  - /en/blog/blockchain-privacy-technologies/
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/premium-web3-tlds/
relatedGlossary:
  - /en/glossary/rollup/
  - /en/glossary/optimistic-rollup/
  - /en/glossary/zk-rollup/
  - /en/glossary/data-availability/
  - /en/glossary/layer-2/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

Ethereum mainnet processes roughly 15 transactions per second. A payments network like Visa handles tens of thousands. That gap is why blockchains need scaling: a way to do more work without asking every participant to verify every transaction on the base chain. Over the past several years the industry converged on a handful of distinct approaches—[rollups](/en/glossary/rollup/), sidechains, payment channels, and sharding—each trading off security, decentralization, and cost differently.

This guide walks through the main scaling approaches, explains the mechanism behind each, and compares them side by side so the difference is clear the next time it shows up in a project's docs.

---

## The Scalability Trilemma

Vitalik Buterin's framing of the **scalability trilemma** is the mental model most of this field is built around. A blockchain wants three properties at once: "scalability: the chain can process more transactions than a single regular node... can verify," "decentralization: the chain can run without any trust dependencies on a small group of large centralized actors," and "security: the chain can resist a large percentage of participating nodes trying to attack it"—but traditional designs only achieve two of the three ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Scalability%3A%20the%20chain%20can%20process%20more%20transactions%20than%20a%20single%20regular%20node)). Bitcoin and early Ethereum chose decentralization and security over throughput; high-TPS chains that rely on a small set of powerful validators get scalability and security but sacrifice decentralization; naive multi-chain designs can scale and stay decentralized but become insecure if an attacker only needs to compromise one chain.

Every approach below is really an answer to the same question: how do you add throughput without giving up the other two corners of the triangle?

## Rollups: Execute Off-Chain, Settle On-Chain

![Flat-vector diagram of many small transaction tickets funneled into a compactor labeled "Rollup Compressor" that squeezes them into a compressed batch cube, which is then posted down onto a base-layer chain of linked blocks](../../assets/blockchain-scaling-approaches-01-rollup-batching.jpg)

A **[rollup](/en/glossary/rollup/)** executes transactions outside layer 1 (L1) and then posts a compact summary—and the underlying transaction data—back to the base chain. L2BEAT, the leading tracker for these systems, defines rollups as "L2s that periodically post state commitments to Ethereum," commitments "validated by either Validity Proofs or... accepted optimistically and can be challenged via [a] Fraud Proof mechanism within a certain fraud proof window" ([l2beat.com](https://l2beat.com/scaling/summary)). Because the data and the commitment both land on L1, anyone can reconstruct the rollup's state from Ethereum alone—that's what lets a rollup inherit L1's security rather than asking users to trust a new validator set. This is the technology behind the [layer 2](/en/glossary/layer-2/) networks most people interact with today: Base, Arbitrum, Optimism, zkSync, and Starknet are all rollups.

Rollups split into two families based on how they prove their off-chain execution was correct.

### Optimistic Rollups

![Flat-vector illustration of two doors side by side: an orange "Optimistic" door with a 7-day clock and a challenge-period flag representing the fraud-proof window, and a green "ZK" door with an instant green validity-proof checkmark](../../assets/blockchain-scaling-approaches-02-optimistic-vs-zk.jpg)

An [optimistic rollup](/en/glossary/optimistic-rollup/) "assume[s] offchain transactions are valid and don't publish proofs of validity for batches of transactions" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=Optimistic%20rollups%20assume%20offchain%20transactions%20are%20valid%20and%20don%27t%20publish%20proofs%20of%20validity)). Operators batch transactions, execute them off-chain, and post the compressed data to Ethereum. A challenge window then opens during which anyone running a full node can dispute the batch with a fraud proof; withdrawing funds from L2 back to L1 has to wait until "the challenge period—lasting roughly seven days—elapses" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=the%20challenge%20period%E2%80%94lasting%20roughly%20seven%20days%E2%80%94elapses)). That week-long window is why a plain optimistic-rollup withdrawal takes about a week, unless a third-party liquidity provider is used for a faster, fee-paying exit.

Optimistic rollups only need a fraud-proof system rather than a full cryptographic proving pipeline, which historically made it easier to support general-purpose smart contracts on top of them. **Arbitrum**, **Optimism**, and **Base**—Coinbase's rollup, described on ethereum.org as "an Optimistic Rollup built with the OP Stack" ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Base%20is%20an%20Optimistic%20Rollup%20built%20with%20the%20OP%20Stack))—are the largest optimistic rollups by usage today.

### ZK Rollups

A [ZK rollup](/en/glossary/zk-rollup/) takes the opposite approach: instead of assuming validity and allowing a challenge period, it submits a validity proof—a cryptographic proof that the batch's state transition is correct—alongside each batch. Because Ethereum verifies that proof on-chain, "there are no delays when moving funds from a ZK-rollup to Ethereum... because exit transactions are executed once the ZK-rollup contract verifies the validity proof" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=There%20are%20no%20delays%20when%20moving%20funds%20from%20a%20ZK%2Drollup%20to%20Ethereum)). ZK-rollups "can process thousands of transactions in a batch and then only post some minimal summary data to Mainnet" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20can%20process%20thousands%20of%20transactions%20in%20a%20batch)), using proof systems like zk-SNARKs (small proofs, fast verification) or zk-STARKs (transparent, no trusted setup required). **zkSync Era**, **Starknet**—"a general purpose ZK Rollup based on STARKs and the Cairo VM" ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Starknet%20is%20a%20general%20purpose%20ZK%20Rollup%20based%20on%20STARKs%20and%20the%20Cairo%20VM))—and **Linea** are prominent ZK rollups; Polygon zkEVM and Scroll also implement a zkEVM to run existing Ethereum smart contracts inside a ZK-provable environment.

The trade-off: generating validity proofs is computationally expensive and, for full EVM equivalence, technically harder to build than a fraud-proof system—part of why optimistic rollups reached mainstream adoption first even though ZK rollups offer faster finality.

## Sidechains

A **sidechain** "is a separate blockchain that runs independent of Ethereum and is connected to Ethereum Mainnet by a two-way bridge," and unlike a rollup, "a sidechain uses a separate consensus mechanism and doesn't benefit from Ethereum's security guarantees" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/#:~:text=A%20sidechain%20uses%20a%20separate%20consensus%20mechanism%20and%20doesn%27t%20benefit%20from%20Ethereum%27s%20security%20guarantees)). That's the core distinction from a layer 2: a sidechain trades inherited security for independent design freedom and, usually, lower fees and faster blocks, because it answers to its own validator set rather than to Ethereum's.

**Polygon PoS** is the best-known example. Polygon's own product page describes it as "Ethereum's most-used sidechain—battle-tested with billions in value secured, near-instant transactions, and sub-cent fees" ([polygon.technology](https://polygon.technology/polygon-pos)), secured by its own proof-of-stake validator set rather than Ethereum's. **Gnosis Chain** (formerly xDai) is another widely used sidechain, along with Skale and Metis Andromeda. Because you're trusting a different, usually smaller, validator set, a sidechain's security is only as strong as that set—a materially different guarantee than a rollup, where invalid states can in principle be caught and reverted using data anchored on L1.

## State and Payment Channels

A **state channel** lets two or more parties transact off-chain by locking funds into a shared contract and exchanging signed updates directly, so "channel peers can conduct an arbitrary number of offchain transactions while only submitting two onchain transactions to open and close the channel" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=Channel%20peers%20can%20conduct%20an%20arbitrary%20number%20of%20offchain%20transactions%20while%20only%20submitting%20two%20onchain%20transactions)). A payment channel specializes this for simple balance transfers and "is best described as a 'two-way ledger' collectively maintained by two users" ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=A%20payment%20channel%20is%20best%20described%20as%20a%20%E2%80%9Ctwo%2Dway%20ledger%E2%80%9D%20collectively%20maintained%20by%20two%20users)). Participants can transact any number of times between each other, off-chain and instantly, touching the base chain only to open the channel (locking collateral) and close it (settling the final balance).

The best-known implementation is Bitcoin's **Lightning Network**, described on its own site as "a decentralized network using smart contract functionality in the blockchain to enable instant payments across a network of participants," built from "bidirectional payment channels" that route payments the way data packets route across the internet ([lightning.network](https://lightning.network/)). The catch: channels only scale transactions *between parties who have a path of open channels to each other*, funds have to be pre-committed to open a channel, and channel networks need liquidity routing to work well at scale—none of which apply to a general-purpose rollup that can run arbitrary smart contracts for anyone.

## Sharding and Data-Availability Layers

![Flat-vector diagram of transactions split into four parallel shard lanes (Shard 1 through Shard 4), each processing its own chain of blocks independently, all feeding into a data-availability layer strip beneath](../../assets/blockchain-scaling-approaches-03-sharding.jpg)

**Sharding** splits a blockchain's validation work across multiple parallel subsets ("shards") of nodes so no single node has to process the entire network's transaction load. Vitalik Buterin argues "sharding is a technique that gets you all three" corners of the trilemma at once ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Sharding%20is%20a%20technique%20that%20gets%20you%20all%20three)), using randomly sampled validator committees to verify different shards in parallel. The technology that makes sharding safe without forcing every node to download every shard's full data is [data availability](/en/glossary/data-availability/) sampling (DAS)—"a way for the network to check that data is available without putting too much strain on any individual node" ([ethereum.org](https://ethereum.org/en/developers/docs/data-availability/#:~:text=Data%20availability%20sampling%20is%20a%20way%20for%20the%20network%20to%20check%20that%20data%20is%20available%20without%20putting%20too%20much%20strain%20on%20any%20individual%20node)): a light node downloads only small, randomly selected pieces of a block's data and, thanks to erasure coding, can still become confident the full data was published.

This same data-availability problem applies directly to rollups, which is why dedicated data-availability layers have emerged as their own category of infrastructure. **Celestia** is a modular blockchain built specifically so that "rollups and L2s use Celestia as a network for publishing and making transaction data available for anyone to download" ([celestia.org](https://celestia.org/what-is-celestia/#:~:text=Rollups%20and%20L2s%20use%20Celestia%20as%20a%20network%20for%20publishing%20and%20making%20transaction%20data%20available%20for%20anyone%20to%20download)), letting a rollup post its data to a cheaper, purpose-built DA layer instead of Ethereum mainnet. **EigenDA**, built on EigenLayer's restaking infrastructure, offers a comparable service secured by Ethereum stakers who opt in to also secure the DA layer. Rollups that publish data to an external DA layer instead of Ethereum L1 are sometimes called *validiums* or *optimiums* rather than "pure" rollups, since L2BEAT tracks them as a distinct category alongside rollups and other L2 solutions ([l2beat.com](https://l2beat.com/scaling/summary))—they trade some of that L1-anchored security guarantee for lower data-posting costs.

## Comparing the Approaches

| Approach | Where computation runs | Inherits L1 security? | Data availability | Main trade-off | Examples |
|---|---|---|---|---|---|
| Optimistic rollup | Off-chain (L2) | Yes — data + fraud-proof on L1 | Full data posted to L1 | ~7-day withdrawal challenge window | Arbitrum, Optimism, Base |
| ZK rollup | Off-chain (L2) | Yes — data + validity proof on L1 | Full data posted to L1 | Expensive proof generation; harder full EVM-equivalence | zkSync, Starknet, Linea |
| Sidechain | Independent chain | No — own consensus/validators | Own chain, not posted to L1 | Security only as strong as its own validator set | Polygon PoS, Gnosis Chain |
| State/payment channel | Off-chain, between participants | Indirectly — funds locked on L1 | Not published; only final state on-chain | Only scales transactions between channel-connected parties; funds must be pre-locked | Lightning Network |
| Sharding / DA layer | Parallel shards, or a separate DA network | Varies — L1 sharding inherits it; external DA layers add a new trust assumption | Verified via data-availability sampling | External DA cuts cost but adds a dependency outside L1 | Ethereum's sharding roadmap, Celestia, EigenDA |

No single approach wins on every axis, which is why production systems increasingly combine them—a ZK rollup that posts its data to Celestia instead of Ethereum, for instance, borrows validity-proof security from one layer and cheap data availability from another.

---

## How This Connects to Tokenized Domains

Scaling choices matter for [tokenized domains](/en/glossary/tokenized-domain/) because every mint, transfer, DNS update, or collateral action is an on-chain transaction, and its cost and finality time depend on where it settles. A tokenized `.com` transfer confirmed on an optimistic rollup is cheap and fast for the user but not fully final against L1 for about a week unless a fast-exit bridge is used; the same transfer on a ZK rollup finalizes against L1 as soon as the validity proof lands. Sidechains can be even cheaper, but a domain NFT living only on a sidechain inherits that sidechain's smaller validator-set security rather than Ethereum's. Understanding these trade-offs is part of understanding what you actually own when a domain is represented on-chain—the same due-diligence habit that matters across [Web3 foundations](/en/topics/web3-foundations/) generally.

---

## Sources and Further Reading

- [The Limits to Blockchain Scalability — Vitalik Buterin](https://vitalik.eth.limo/general/2021/04/07/sharding.html)
- [Layer 2 — ethereum.org](https://ethereum.org/en/layer-2/)
- [Optimistic Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/)
- [ZK-Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [Sidechains — ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/)
- [State Channels — ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/)
- [Data Availability — ethereum.org](https://ethereum.org/en/developers/docs/data-availability/)
- [L2BEAT Scaling Summary](https://l2beat.com/scaling/summary)
- [What Is Celestia? — celestia.org](https://celestia.org/what-is-celestia/)
- [Lightning Network](https://lightning.network/)
- [Polygon PoS — polygon.technology](https://polygon.technology/polygon-pos)
