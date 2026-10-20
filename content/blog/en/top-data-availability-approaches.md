---
title: "Top Blockchain Data-Availability Approaches: Calldata, Blobs, Committees and Sampling"
date: '2026-10-20'
language: en
tags: ['guide']
authors: ['namefiteam']
draft: true
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 90
format: roundup
description: Compare Ethereum calldata and blobs, data-availability committees, and sampling-based networks by recovery guarantee, cost, and trust assumptions.
keywords: ['data availability', 'Ethereum calldata', 'EIP-4844 blobs', 'blobspace', 'data availability committee', 'DAC', 'data availability sampling', 'DAS', 'Celestia', 'validium', 'rollup data', 'state recovery', 'off-chain data availability', 'modular blockchain']
relatedArticles:
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/top-rollup-types/
  - /en/blog/blockchain-consensus-mechanisms/
  - /en/blog/top-zk-proof-systems/
  - /en/blog/blockchain-virtual-machines/
relatedGlossary:
  - /en/glossary/data-availability/
  - /en/glossary/rollup/
  - /en/glossary/optimistic-rollup/
  - /en/glossary/zk-rollup/
  - /en/glossary/merkle-tree/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
---

A validity proof can confirm a state transition without publishing the data needed to reconstruct the resulting state. A [rollup](/en/glossary/rollup/) must also publish recovery data through its data-availability path. To independently check execution—or recover an account balance when the operator disappears—users need the underlying transaction or state data. [Data availability](/en/glossary/data-availability/) (DA) asks whether that data was actually published for network participants to retrieve ([ethereum.org](https://ethereum.org/en/developers/docs/data-availability/)).

Four approaches recur in blockchain design: put data in Ethereum transaction calldata, put it in temporary Ethereum blobs, ask a designated committee to hold it, or publish it to a separate DA network where light nodes sample encoded data. Their costs and guarantees differ. A proof that execution was valid does not turn unavailable data into recoverable data; Ethereum's validium guide explicitly separates validity proofs from off-chain DA trust ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/validium/)).

This is a comparison of **where recovery data lives and who can attest to its availability**, not a ranking of project names. Exact fees change with congestion, compression, and implementation, so the cost labels below are qualitative.

---

## Ethereum calldata puts recovery data in transaction history

Calldata is bytes attached to an Ethereum transaction. If a rollup publishes its compressed batches there, Ethereum nodes receive the data as part of the chain's transaction history. Ethereum's DA guide contrasts calldata's persistent chain history with temporary blob storage ([ethereum.org](https://ethereum.org/en/developers/docs/data-availability/#data-availability-and-layer-2-rollups)).

The security advantage is direct: the rollup's users and challengers rely on Ethereum's own publication and consensus path for the information needed to reconstruct state. The downside is competition with ordinary Ethereum execution for blockspace. It is usually an expensive way to publish large amounts of batch data compared with purpose-built blobspace.

“Permanent on-chain history” still does not mean every RPC endpoint keeps an indexed copy or serves it forever. An application may need an archive service to make old records convenient to retrieve. Ethereum distinguishes the original availability guarantee from later **retrievability** of historical data ([ethereum.org](https://ethereum.org/en/developers/docs/data-availability/#data-availability-vs-data-retrievability)).

**Our assessment of suitable uses:** systems that need Ethereum DA and are willing to pay for durable transaction-history publication, or applications with relatively small data volumes.

---

## Ethereum blobs provide availability for a limited retention period

EIP-4844 introduced blob-carrying transactions so rollups could publish batch data in a separate fee market. Blob contents are not directly readable by the [Ethereum Virtual Machine](/en/glossary/ethereum-virtual-machine/); the transaction references a blob commitment through its versioned hash, while Ethereum's consensus layer makes the blob data available for a bounded period ([EIP-4844](https://eips.ethereum.org/EIPS/eip-4844#abstract)).

That bounded window is the crucial caveat. A rollup's independent actors must download or mirror data while it is available; Ethereum does not promise to serve old blobs indefinitely. The EIP frames this as sufficient for honest actors to construct rollup state during the relevant period, not a permanent archive ([EIP-4844](https://eips.ethereum.org/EIPS/eip-4844#motivation)). A project that needs later state reconstruction still needs a retention and retrieval plan.

Sampling is not exclusive to external DA networks. [EIP-7594 specifies PeerDAS](https://eips.ethereum.org/EIPS/eip-7594#abstract), an Ethereum networking protocol that checks blob availability while each node downloads only a subset. Its use of sampling does not change which network supplies the availability guarantee. Compare the publication and verification paths, rather than treating every sampling design as a separate DA chain.

Blobs therefore keep the **Ethereum DA security domain** while reducing the cost of publishing large rollup batches relative to calldata. They do not make proof systems or bridges secure by themselves; users still depend on the rollup's execution, upgrade, and exit rules.

**Our assessment of suitable uses:** Ethereum-settled rollups with sufficient data volume to benefit from blobspace and explicit archival arrangements for old batches.

---

## Data-availability committees add a disclosed trust assumption

A data-availability committee (DAC) is a named set of parties that stores off-chain batch data and signs or attests that it can be retrieved. A validium can publish a validity proof on Ethereum while asking the committee—not Ethereum—to retain the recovery data. StarkEx documents separate Rollup and Validium DA modes, with committee-held data in the latter ([StarkEx data-availability documentation](https://docs.starkware.co/starkex/con_data_availability.html)).

This can avoid much of the L1 publication cost, but it changes the failure mode. If enough committee members withhold data, users may not be able to construct withdrawal proofs even though Ethereum accepted a valid state-transition proof. Ethereum's validium guide explicitly warns about funds becoming frozen under data withholding ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/validium/#data-availability-managers)).

“Committee” is not one fixed level of safety. Readers need the actual membership, signing threshold, incentives, geographic/operator independence, retention obligation, and escape-hatch behavior. A threshold signature on a commitment proves that a threshold signed it; the system's security argument must explain why the underlying bytes remain retrievable.

**Our assessment of suitable uses:** applications willing to accept a clearly disclosed committee assumption in exchange for lower data-publication cost.

---

## Separate DA networks let light nodes sample published data

A separate DA chain can publish data commitments and let light nodes check availability by requesting random shares. In Celestia's design, producers erasure-code block data, commit to the encoded shares, and light nodes sample coordinates with proofs built from [Merkle trees](/en/glossary/merkle-tree/). Namespaces help an application retrieve only its own data ([Celestia documentation](https://docs.celestia.org/learn/celestia-101/data-availability/)).

Sampling is a statistical availability check, not a promise that one node stores every historical byte forever. [Celestia's retrievability documentation](https://docs.celestia.org/learn/celestia-101/retrievability/#suggested-practices-for-rollups) distinguishes the light-node sampling window from archival nodes or providers that retain older data. For a system settling on Ethereum, the settlement integration must authenticate the DA commitment and bind the accepted batch to it. Publishing data on Celestia does not give a system Ethereum's own DA guarantee.

This model can scale data publication without a small fixed committee, but it introduces the DA network's own consensus, sampling assumptions, bridge or proof integration, and historical-retention dependencies. Those are different from Ethereum blob assumptions, even when both systems use sampling techniques.

**Our assessment of suitable uses:** modular systems that can integrate a separate DA network and are prepared to state its security and settlement-bridge assumptions explicitly.

---

## The comparison separates publication from historical retrieval

| Approach | Where recovery data is published | Who must keep it available during the critical window | Historical retrieval | Relative publication cost | Main trust/operational trade-off |
|---|---|---|---|---|---|
| **Ethereum calldata** | Ethereum transaction history | Ethereum validators and nodes | Transaction history; historical serving still needs retained copies | Uses execution gas | Pays execution blockspace for direct Ethereum DA |
| **Ethereum blobs** | Temporary Ethereum consensus-layer blob data | Ethereum network during blob retention | External archiving needed after protocol retention | Separate blob fee market | Time-bounded availability; operators must capture data promptly |
| **DAC** | Committee-operated off-chain storage | Enough honest, reachable members to recover the data | Defined by committee policy and backups | Lower L1 publication footprint | Data withholding can block exits despite valid execution proofs |
| **Sampling-based external DA** | Separate DA network, such as Celestia | That network's producers, samplers, and retrievers | Separate archival providers or nodes | Depends on the DA network and bridge | Additional consensus and settlement-verification assumptions |

The table isolates DA. It does not score the proof system, sequencer, upgrade keys, token bridge, or user escape path. A real risk assessment needs all of them.

---

## Builders should test the recovery path before choosing a DA design

The following questions form an evaluation checklist. They are practical review steps, rather than claims about a particular network's implementation.

1. **Identify the required bytes.** Does recovery need full transactions, state differences, or another published representation? Record the exact format and decoder.
2. **Identify the publication network.** Distinguish an Ethereum commitment from the network that distributes the underlying data. Name every additional verifier or bridge.
3. **Identify the retrieval window.** Record the applicable protocol or service retention policy. Do not assume an older specification describes the current deployment.
4. **Identify the independent reader.** Determine whether an unrelated operator can retrieve the data with public software. Test an actual batch, not only a block explorer link.
5. **Identify the historical provider.** Document how a new node obtains older batches after the normal retention window. Test the backup independently of the sequencer.
6. **Identify the exit requirements.** Determine which data and proofs the withdrawal contract requires. Check what happens when a publisher or committee stops cooperating.

Keep the evidence for each answer beside the design decision. An architecture diagram should distinguish data publication, execution verification, settlement, and historical storage. One arrow labeled “secured by Ethereum” cannot describe all four responsibilities.

When estimating cost, compare the same workload over a stated period. Include publication fees, retention, retrieval, and any integration service. The comparison table describes mechanisms; it does not report a benchmark or promise a fixed saving.

A recovery exercise can also expose dependencies outside DA. A complete data archive does not by itself supply a working decoder, a valid withdrawal proof, or an accessible exit contract. Treat those components as separate checks.

## Domain owners need a recovery path for their ownership records

A [tokenized domain](/en/blog/what-are-tokenized-domains/) on an L2 is an ownership record, not merely an inexpensive transaction. If its rollup operator disappears, can the owner reconstruct the state and prove that the domain token belongs to them? The answer depends partly on DA, not just on whether a validity proof was accepted.

For a high-value asset, inspect the exact path: where the batch bytes went, who retains them, how long the base protocol guarantees availability, and what independent exit is possible if a publisher withholds data. “On Ethereum” and “uses ZK” are both too broad to answer those questions.

---

## The sources document each availability mechanism

- [Data Availability — ethereum.org](https://ethereum.org/en/developers/docs/data-availability/) — verified 2026-10-20
- [Blockchain Data Storage Strategies — ethereum.org](https://ethereum.org/en/developers/docs/data-availability/blockchain-data-storage-strategies/) — verified 2026-10-20
- [EIP-4844: Shard Blob Transactions — Ethereum Improvement Proposals](https://eips.ethereum.org/EIPS/eip-4844) — verified 2026-10-20
- [Validium — ethereum.org](https://ethereum.org/en/developers/docs/scaling/validium/) — verified 2026-10-20
- [StarkEx Data Availability — StarkWare Documentation](https://docs.starkware.co/starkex/con_data_availability.html) — verified 2026-10-20
- [Celestia's Data Availability Layer — Celestia Documentation](https://docs.celestia.org/learn/celestia-101/data-availability/) — verified 2026-10-20

- [PeerDAS — EIP-7594](https://eips.ethereum.org/EIPS/eip-7594#abstract), Abstract and Specification — verified 2026-10-20
- [Data retrievability and pruning — Celestia](https://docs.celestia.org/learn/celestia-101/retrievability/#suggested-practices-for-rollups), historical storage responsibilities and suggested practices — verified 2026-10-20

Source links point directly to the supporting documents. No dated archive snapshot was verified for this review.
