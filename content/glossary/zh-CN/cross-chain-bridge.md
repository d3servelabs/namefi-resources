---
title: 跨链桥
date: '2026-06-22'
language: zh-CN
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: 一种在无法原生互通的区块链之间移动代币或消息的协议。
keywords: ['跨链桥', '跨链', '互操作性', '代币桥', '多链']
also_known_as: ['桥']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/bridges/
relatedArticles:
  - /zh-CN/blog/how-tokenization-changes-domain-flipping/
  - /zh-CN/blog/tokenize-your-com-to-flip-it/
  - /zh-CN/blog/what-are-tokenized-domains/
  - /zh-CN/blog/tokenized-domain-use-cases-2026/
  - /zh-CN/blog/tax-and-accounting-questions-for-tokenized-domains/
relatedTopics:
  - /zh-CN/topics/domain-tokenization/
  - /zh-CN/topics/domain-security/
relatedSeries:
  - /zh-CN/series/domain-flipping-skills/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/tokenized-domain/
  - /zh-CN/glossary/ethereum/
  - /zh-CN/glossary/web3/
  - /zh-CN/glossary/tokenize/
  - /zh-CN/glossary/registrar/
---

**跨链桥**（也称"桥"）是一种协议，它将资产锁定在一条[区块链](/zh-CN/glossary/blockchain/)上，并在另一条链上铸造代表性代币，使价值和数据能够在没有原生通信渠道的网络之间流动。最常见的模式是"锁定铸造"：将代币存入源链上的桥接合约，托管人或去中心化预言机随即指示目标链上的匹配合约发行相应的封装代币。跨链桥将[以太坊](/zh-CN/glossary/ethereum/)主网与 Optimism 或 Base 等[二层](/zh-CN/glossary/layer-2/)卷叠连接，也连接到 Polygon 或 Solana 等完全独立的链。由于跨链桥持有大量锁定资产，是高价值攻击目标——已有数起九位数的漏洞利用事件。对于代币化域名而言，跨链桥使在以太坊上发行的 NFT 能够迁移至成本较低的二层网络进行低成本转移，然后再返回主网用作 DeFi [抵押品](/zh-CN/glossary/collateral/)。
