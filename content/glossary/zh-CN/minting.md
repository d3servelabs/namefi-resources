---
title: 铸造
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
description: 在区块链上创建新代币的行为——对域名而言，即发行代表其所有权的 NFT。
keywords: ['铸造', 'NFT 创建', '代币发行', '链上', 'minting']
also_known_as: ['Mint']
level: 1
sources:
  - https://ethereum.org/en/nft/
relatedArticles:
  - /zh-CN/blog/what-are-tokenized-domains/
  - /zh-CN/blog/how-to-tokenize-your-com/
  - /zh-CN/blog/onchain-domain-custody-and-recovery/
  - /zh-CN/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /zh-CN/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /zh-CN/topics/domain-tokenization/
  - /zh-CN/topics/domain-security/
relatedSeries:
  - /zh-CN/series/domain-flipping-skills/
  - /zh-CN/series/domain-apocalypse/
relatedGlossary:
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/tokenized-domain/
  - /zh-CN/glossary/web3/
  - /zh-CN/glossary/tokenize/
---

**铸造**（minting，也称 Mint）是将新代币记录写入[区块链](/zh-CN/glossary/blockchain/)的行为——类比于铸造货币，只不过"铸币厂"是一个[智能合约](/zh-CN/glossary/smart-contract/)函数，它在合约的链上状态中创建一条记录，并将其分配给某个所有者地址。对于域名代币化而言，铸造是将真实 DNS 名称转变为区块链原生资产的关键步骤：智能合约调用 `mint`，创建一个 [ERC-721](/zh-CN/glossary/erc-721/) [NFT](/zh-CN/glossary/nft/)，其代币 ID 映射至特定域名。自此，该域名可在无需接触传统注册商流程的情况下进行点对点转让、在 NFT 市场挂单，或用于 DeFi 协议。铸造需要支付 [gas](/zh-CN/glossary/gas/) 费用以完成计算，[代币化](/zh-CN/glossary/tokenize/)过程还涉及锁定注册商记录，使链上所有者掌控 DNS 配置。铸造完成后，NFT 即成为所有权的唯一真相来源；销毁（destroying）NFT 则将控制权归还至传统注册体系。
