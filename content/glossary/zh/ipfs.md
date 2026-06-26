---
title: IPFS
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 一种通过内容哈希寻址文件的点对点协议，用于托管去中心化网络数据。
keywords: ['IPFS', '内容寻址', '点对点', '去中心化存储', 'CID']
also_known_as: ['InterPlanetary File System']
level: 1
sources:
  - https://docs.ipfs.tech/concepts/what-is-ipfs/
relatedArticles:
  - /zh/blog/the-curve-finance-dns-hijack/
  - /zh/blog/what-are-tokenized-domains/
  - /zh/blog/the-fox-it-dns-hijack/
  - /zh/blog/onchain-domain-custody-and-recovery/
  - /zh/blog/the-2024-squarespace-defi-domain-hijacks/
relatedTopics:
  - /zh/topics/domain-security/
  - /zh/topics/domain-tokenization/
relatedSeries:
  - /zh/series/domain-apocalypse/
  - /zh/series/domain-flipping-skills/
relatedGlossary:
  - /zh/glossary/web3/
  - /zh/glossary/dns/
  - /zh/glossary/tokenized-domain/
  - /zh/glossary/registrar/
  - /zh/glossary/blockchain/
---

**IPFS**（InterPlanetary File System，也称星际文件系统）是一种点对点超媒体协议，通过内容哈希——即内容标识符（CID）——来标识文件，而非依赖服务器位置。若两个节点持有相同文件，它们会生成相同的 CID，因此网络可从距离最近的节点获取该文件。这种内容寻址模型与 HTTP 截然相反——HTTP 的 URL 指向一台随时可能下线的特定服务器。在 [web3](/zh/glossary/web3/) 应用中，IPFS 是标准的链下数据层：NFT 元数据、艺术作品和文档存储在 IPFS 上，无需永久锁定在昂贵的[区块链](/zh/glossary/blockchain/)上——[链上](/zh/glossary/on-chain/)记录只需保存不可变的 CID 即可。对于代币化域名，IPFS 可托管去中心化网站，当用户使用具备 IPFS 功能的网关或浏览器扩展时即可访问，完全绕过传统 DNS 服务器。
