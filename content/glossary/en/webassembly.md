---
title: WebAssembly
date: '2026-07-02'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A portable, near-native-speed binary instruction format that several blockchains use as their smart contract execution engine.
keywords: ['webassembly', 'wasm', 'cosmwasm', 'wasm smart contracts', 'stack-based virtual machine']
also_known_as: ['Wasm']
level: 1
sources:
  - https://webassembly.org/
  - https://www.cosmwasm.com/
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
  - /en/glossary/blockchain/
  - /en/glossary/web3/
  - /en/glossary/on-chain/
---

**WebAssembly** (Wasm) is "a binary instruction format for a stack-based virtual machine," originally built as "a portable compilation target for programming languages" that "aims to execute at native speed" in browsers and servers. Several blockchain ecosystems reuse this general-purpose, battle-tested runtime as their smart contract engine instead of designing a bespoke bytecode format: CosmWasm, the dominant platform across Cosmos SDK chains such as Osmosis, Neutron, and Injective, compiles [smart contracts](/en/glossary/smart-contract/) written in Rust down to Wasm and executes them on an optimized Wasm runtime. Using Wasm means any language with a Wasm compiler — Rust, C, C++, Go — can, in principle, target the chain, in contrast to [Ethereum](/en/glossary/ethereum/)'s Solidity-first EVM. For [Web3](/en/glossary/web3/) infrastructure built [on-chain](/en/glossary/on-chain/), including tokenized assets, the choice between a Wasm-based VM and the EVM affects which developer tooling and existing contracts port over without a rewrite.
