---
title: ERC-20
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The Ethereum standard for fungible tokens like stablecoins, complementing the ERC-721 NFT standard.
keywords: ['ERC-20', 'fungible token', 'token standard', 'stablecoin', 'ethereum token']
level: 1
sources:
  - https://eips.ethereum.org/EIPS/eip-20
---

**ERC-20** is the [Ethereum](/en/glossary/ethereum/) Improvement Proposal that defines a standard interface for fungible tokens — every unit is identical and interchangeable, just like dollars in a bank account. Any contract implementing ERC-20's `transfer`, `approve`, and `allowance` functions is automatically compatible with wallets, exchanges, and [DeFi](/en/glossary/defi/) protocols without custom integration. [Stablecoins](/en/glossary/stablecoin/) like USDC and USDT are ERC-20 tokens, as are most governance and utility tokens. ERC-20 contrasts sharply with [ERC-721](/en/glossary/erc-721/): an ERC-721 token is non-fungible — each one has a unique ID representing a distinct asset, like a specific domain name.
