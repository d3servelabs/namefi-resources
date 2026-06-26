---
title: 授权码（EPP 码 / 转移码）
date: '2026-05-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 注册商为授权将域名转移至另一家注册商而颁发的每域名短密钥，也称为 EPP 码或转移码。
keywords: ['授权码', 'EPP 码', '转移码', '域名转移', '授权代码', 'AuthInfo 码']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
relatedArticles:
  - /zh/blog/domain-escrow-explained/
  - /zh/blog/how-to-sell-a-domain-name-you-own/
  - /zh/blog/how-tokenization-changes-domain-flipping/
  - /zh/blog/the-panix-com-domain-hijack/
  - /zh/blog/how-to-tokenize-your-com/
relatedTopics:
  - /zh/topics/domain-tokenization/
  - /zh/topics/domain-basics/
relatedSeries:
  - /zh/series/domain-apocalypse/
  - /zh/series/domain-investor-field-guide/
relatedGlossary:
  - /zh/glossary/registrar/
  - /zh/glossary/registry/
  - /zh/glossary/dns/
  - /zh/glossary/cross-registrar-transfer/
  - /zh/glossary/epp/
---

**授权码**——也称为 **EPP 码**、**AuthInfo 码**或**转移码**——是[注册商](/zh/glossary/registrar/)为特定域名颁发的短共享密钥，用于授权[跨注册商转移](/zh/glossary/cross-registrar-transfer/)。EPP（可扩展配置协议）是标准的底层注册表协议；授权码是其中的每域名凭证。要将域名从一家注册商转移到另一家，获得方注册商必须提供由[注册人](/zh/glossary/registrant/)从原注册商处获取的有效授权码。该码通常在注册商的控制面板中可见，有时隐藏在"转出"或"获取 EPP 码"按钮后面。对于[代币化域名](/zh/blog/what-are-tokenized-domains/)，链上所有权转移**不需要**授权码——[NFT（非同质化代币）](/zh/glossary/nft/)的转移在链上是原子性完成的。授权码仅在传统 [DNS (域名系统)](/zh/glossary/dns/)体系中在注册商之间转移域名时才有意义。
