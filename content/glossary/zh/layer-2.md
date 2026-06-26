---
title: Layer 2
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 构建于区块链之上以提升交易速度、降低成本的网络，例如以太坊上的 Base。
keywords: ['layer 2', 'rollup', '扩容', 'optimistic rollup', 'ZK rollup']
level: 1
sources:
  - https://ethereum.org/en/layer-2/
relatedArticles:
  - /zh/blog/selling-domains-as-nfts/
  - /zh/blog/the-fox-it-dns-hijack/
  - /zh/blog/the-myetherwallet-bgp-dns-attack/
  - /zh/blog/tokenize-your-com-to-flip-it/
  - /zh/blog/what-are-tokenized-domains/
relatedTopics:
  - /zh/topics/domain-security/
  - /zh/topics/domain-tokenization/
relatedSeries:
  - /zh/series/domain-apocalypse/
  - /zh/series/domain-flipping-skills/
relatedGlossary:
  - /zh/glossary/dns/
  - /zh/glossary/cross-chain-bridge/
  - /zh/glossary/ethereum/
  - /zh/glossary/tokenized-domain/
  - /zh/glossary/blockchain/
---

**Layer 2**（L2）是在主[区块链](/zh/glossary/blockchain/)（第一层）之外执行交易、随后将压缩证明或数据回传至主链的网络，在继承父链安全性的同时大幅降低成本与延迟。当前主流的两种设计为：乐观 Rollup（假设交易有效，并设置欺诈证明挑战窗口期）和 ZK Rollup（每批次附带密码学有效性证明）。Base、Optimism、Arbitrum 和 zkSync 均为构建于[以太坊](/zh/glossary/ethereum/)之上的 L2 网络。将计算迁移至 L2 可将 [gas](/zh/glossary/gas/) 费用降低 10 至 100 倍，使微交易和高频资产转移在经济上具备可行性。对于[代币化域名](/zh/glossary/tokenized-domain/)的日常操作——常规转移、DNS 配置更新、子域名发行——在 L2 上执行意味着用户只需支付分钱级别的费用，而资产的来源记录仍锚定在以太坊主网上。需要在第一层与 L2 之间移动资产时，可使用[跨链桥](/zh/glossary/cross-chain-bridge/)。
