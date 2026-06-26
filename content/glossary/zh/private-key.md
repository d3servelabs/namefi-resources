---
title: 私钥
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 控制区块链账户并为其交易签名的秘密数字，绝不能向任何人透露。
keywords: ['私钥', '签名密钥', '钱包密钥', '密钥', '区块链账户']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /zh/blog/onchain-domain-custody-and-recovery/
  - /zh/blog/the-badgerdao-frontend-attack/
  - /zh/blog/do-multisig-wallets-actually-improve-security/
  - /zh/blog/the-godaddy-multi-year-breach/
  - /zh/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /zh/topics/domain-security/
  - /zh/topics/domain-tokenization/
relatedSeries:
  - /zh/series/domain-apocalypse/
  - /zh/series/domain-flipping-skills/
relatedGlossary:
  - /zh/glossary/public-key/
  - /zh/glossary/wallet/
  - /zh/glossary/web3/
  - /zh/glossary/registrar/
  - /zh/glossary/blockchain/
---

**私钥**（private key）是控制区块链账户的秘密数字——在大多数区块链上为 256 位——它生成用于授权账户所有交易的数字签名，绝不能脱离你的掌控。一旦丢失，你将永久失去资产；一旦泄露，任何人都可清空你的[钱包](/zh/glossary/wallet/)。大多数用户不会直接接触原始私钥，而是通过[助记词](/zh/glossary/seed-phrase/)——一种可确定性地还原私钥的可读词组——来保护它。与私钥对应的[公钥](/zh/glossary/public-key/)由私钥派生而来，可安全地公开分享。
