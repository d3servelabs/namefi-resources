---
title: Minting
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: Creating a new token on a blockchain — for a domain, issuing the NFT that represents its ownership.
keywords: ['minting', 'mint', 'NFT creation', 'token issuance', 'on-chain']
also_known_as: ['Mint']
level: 1
sources:
  - https://ethereum.org/en/nft/
relatedArticles:
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/how-to-tokenize-your-com/
  - /en/blog/onchain-domain-custody-and-recovery/
  - /en/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /en/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/domain-flipping-skills/
  - /en/series/domain-apocalypse/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/registrar/
  - /en/glossary/tokenized-domain/
  - /en/glossary/web3/
  - /en/glossary/tokenize/
---

**Minting** is the act of writing a new token record to a [blockchain](/en/glossary/blockchain/) — analogous to striking a coin, except the "mint" is a [smart contract](/en/glossary/smart-contract/) function that creates an entry in the contract's on-chain state and assigns it to an owner address. For domain tokenization, minting is the critical step where a real DNS name becomes a blockchain-native asset: a smart contract calls `mint`, creating an [ERC-721](/en/glossary/erc-721/) [NFT](/en/glossary/nft/) whose token ID maps to a specific domain. From that moment the domain can be transferred peer-to-peer, listed on an [NFT marketplace](/en/glossary/marketplace/), or used in [DeFi](/en/glossary/defi/) without touching the traditional registrar workflow. Minting requires [gas](/en/glossary/gas/) to pay for the computation, and the [tokenize](/en/glossary/tokenize/) process also involves locking the registrar record so the on-chain owner controls DNS configuration. Once minted, the NFT is the source of truth for ownership; burning (destroying) it returns control to the conventional registration system.
