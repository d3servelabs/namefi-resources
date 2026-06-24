---
title: Minting (Mint)
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: Creating a new token on a blockchain — for a domain, issuing the NFT that represents its ownership.
keywords: ['minting', 'mint', 'NFT creation', 'token issuance', 'on-chain']
level: 1
sources:
  - https://ethereum.org/en/nft/
---

**Minting** is the act of writing a new token record to a [blockchain](/en/glossary/blockchain/) — analogous to striking a coin, except the "mint" is a [smart contract](/en/glossary/smart-contract/) function that creates an entry in the contract's on-chain state and assigns it to an owner address. For domain tokenization, minting is the critical step where a real DNS name becomes a blockchain-native asset: a smart contract calls `mint`, creating an [ERC-721](/en/glossary/erc-721/) [NFT](/en/glossary/nft/) whose token ID maps to a specific domain. From that moment the domain can be transferred peer-to-peer, listed on an NFT marketplace, or used in DeFi without touching the traditional registrar workflow. Minting requires [gas](/en/glossary/gas/) to pay for the computation, and the [tokenize](/en/glossary/tokenize/) process also involves locking the registrar record so the on-chain owner controls DNS configuration. Once minted, the NFT is the source of truth for ownership; burning (destroying) it returns control to the conventional registration system.
