---
title: IPFS
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A peer-to-peer protocol that addresses files by their content, used to host decentralized web data.
keywords: ['IPFS', 'content addressing', 'peer-to-peer', 'decentralized storage', 'CID']
also_known_as: ['InterPlanetary File System']
level: 1
sources:
  - https://docs.ipfs.tech/concepts/what-is-ipfs/
relatedArticles:
  - /en/blog/the-curve-finance-dns-hijack/
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/onchain-domain-custody-and-recovery/
  - /en/blog/the-2024-squarespace-defi-domain-hijacks/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/web3/
  - /en/glossary/dns/
  - /en/glossary/tokenized-domain/
  - /en/glossary/registrar/
  - /en/glossary/blockchain/
---

**IPFS** (InterPlanetary File System) is a peer-to-peer hypermedia protocol that identifies files by their content hash — a Content Identifier (CID) — rather than by server location. If two nodes hold the same file, they produce the same CID, so the network can retrieve it from whoever is nearest. This content-addressing model is the opposite of HTTP, where a URL points to a specific server that may go offline. In [web3](/en/glossary/web3/) applications, IPFS is a standard off-chain data layer: NFT metadata, artwork, and documents are stored on IPFS so they are not permanently pinned to the expensive [blockchain](/en/glossary/blockchain/) — instead the [on-chain](/en/glossary/on-chain/) record holds the immutable CID. For tokenized domains, IPFS can host a decentralized website that resolves when someone has an IPFS-capable gateway or browser extension, entirely bypassing conventional DNS servers.