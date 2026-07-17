---
title: Ethereum Virtual Machine
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: The stack-based, deterministic runtime that executes smart contract code identically across every Ethereum node.
keywords: ['ethereum virtual machine', 'evm', 'evm compatible', 'smart contract execution', 'solidity']
also_known_as: ['EVM']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/evm/
  - https://ethereum.org/en/developers/docs/smart-contracts/languages/
relatedArticles:
  - /en/blog/blockchain-virtual-machines/
  - /en/blog/blockchain-consensus-mechanisms/
  - /en/blog/blockchain-scaling-approaches/
  - /en/blog/blockchain-cryptographic-primitives/
  - /en/blog/blockchain-privacy-technologies/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/smart-contract/
  - /en/glossary/ethereum/
  - /en/glossary/gas/
  - /en/glossary/blockchain/
  - /en/glossary/web3/
---

The **Ethereum Virtual Machine** (EVM) is the stack-based runtime that executes smart contract code the same way on every full node of the [Ethereum](/en/glossary/ethereum/) network, so all validators reach identical results from identical input — Ethereum's documentation describes it as "a decentralized virtual environment that executes code consistently and securely across all Ethereum nodes." Developers write [smart contracts](/en/glossary/smart-contract/) mainly in Solidity, and every operation the EVM runs costs [gas](/en/glossary/gas/), which prices computation and protects the network from spam. Because the EVM is the most widely implemented contract runtime in [Web3](/en/glossary/web3/), dozens of other networks describe themselves as "EVM-compatible," meaning they can run the same Solidity contracts, wallets, and tooling built for Ethereum itself. That broad compatibility is part of why most tokenized-domain infrastructure, including NFT-based domain ownership, targets EVM chains first.
