---
title: 域名服务器（NS 记录）
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
description: 负责回应域名 DNS 查询的服务器，其 NS 记录声明了权威服务器。
keywords: ['域名服务器', 'NS 记录', '权威服务器', 'DNS 委托', 'DNS 托管']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/dns-server-types/
relatedArticles:
  - /zh-CN/blog/how-domain-hijacking-actually-happens/
  - /zh-CN/blog/the-myetherwallet-bgp-dns-attack/
  - /zh-CN/blog/dns-on-tokenized-domains/
  - /zh-CN/blog/the-lenovo-com-dns-hijack/
  - /zh-CN/blog/the-dnspionage-campaign/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/zone-file/
---

**域名服务器**是负责回应域名 [DNS（域名系统）](/zh-CN/glossary/dns/) 查询的服务器，而域名在[注册局](/zh-CN/glossary/registry/)处的 **NS 记录**声明了哪些域名服务器对该域名具有权威性。当你将域名指向某个 DNS 托管商（Cloudflare、Route 53 或[注册商](/zh-CN/glossary/registrar/)自身的 DNS）时，你实际上是在设置其域名服务器；这些服务器随后发布[记录类型](/zh-CN/glossary/dns-record-types/)——A、MX、TXT 等——来路由流量和邮件。对域名进行代币化不会改变这一层：域名服务器及其记录与以前完全相同地运行，而所有权和转移则转移到其上方由[钱包](/zh-CN/glossary/wallet/)控制的[链上 (On-chain)](/zh-CN/glossary/on-chain/) 层。

*来源：RFC 1034；Cloudflare DNS 服务器类型。*
