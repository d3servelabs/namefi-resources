---
title: 助记词（恢复短语）
date: '2026-05-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 一组由 12 或 24 个单词组成的列表，用于编码钱包的主密钥；持有助记词即控制钱包，因此它是你唯一必须备份的东西。
keywords: ['助记词', '恢复短语', '记忆短语', '钱包备份', 'BIP39', '12 个词', '24 个词', '加密恢复']
level: 1
sources:
  - https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
relatedArticles:
  - /zh/blog/onchain-domain-custody-and-recovery/
  - /zh/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /zh/blog/do-multisig-wallets-actually-improve-security/
  - /zh/blog/selling-domains-as-nfts/
  - /zh/blog/the-badgerdao-frontend-attack/
relatedTopics:
  - /zh/topics/domain-security/
  - /zh/topics/domain-tokenization/
relatedSeries:
  - /zh/series/domain-apocalypse/
  - /zh/series/domain-flipping-skills/
relatedGlossary:
  - /zh/glossary/private-key/
  - /zh/glossary/web3/
  - /zh/glossary/wallet/
  - /zh/glossary/tokenized-domain/
  - /zh/glossary/tokenize/
---

**助记词**——也称为**恢复短语**或**记忆短语**——是一个由 12 或 24 个单词组成的人类可读列表，用于编码[钱包](/zh/glossary/wallet/)的主私钥。该格式由 [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) 标准化，被大多数现代钱包使用（MetaMask、Ledger、Trezor、Rabby、Coinbase Wallet 等）。凭借助记词，你可以在任何兼容设备上恢复钱包——以及其中的任何资产，包括[代币化域名](/zh/blog/what-are-tokenized-domains/)。没有助记词，设备访问权限的丢失通常意味着资金永久丢失，因为没有中央机构可以发出"密码重置"指令。最佳实践：将助记词写在纸上或金属备份介质上，在不同的物理位置存储至少两份副本，并且**绝不**将其输入任何计算机、云文档、接触云端的密码管理器、聊天工具或 AI 助手。参见[丢失钱包后恢复代币化域名](/zh/blog/recovering-a-tokenized-domain-after-wallet-loss/)获取完整操作指南。
