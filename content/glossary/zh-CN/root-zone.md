---
title: 根区域（根服务器）
date: '2026-06-22'
language: zh-CN
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: DNS 层级的顶端，列出每个 TLD 及其权威服务器。
keywords: ['根区域', '根服务器', 'DNS 层级', 'TLD 委托', 'IANA']
level: 1
sources:
  - https://www.iana.org/domains/root
  - https://www.iana.org/domains/root/servers
relatedArticles:
  - /zh-CN/blog/what-is-a-tld/
  - /zh-CN/blog/premium-web3-tlds/
  - /zh-CN/blog/the-malaysia-airlines-dns-hijack/
  - /zh-CN/blog/what-are-tokenized-domains/
  - /zh-CN/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /zh-CN/topics/choosing-a-tld/
  - /zh-CN/topics/domain-security/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/icann/
---

**根区域**是 [DNS（域名系统）](/zh-CN/glossary/dns/) 层级的最顶端——包含每个 [TLD（顶级域名）](/zh-CN/glossary/tld/) 及其权威[注册局](/zh-CN/glossary/registry/) 服务器的主列表。它由**根服务器**提供服务，根服务器是一组分布在全球、以十三个命名地址可达的系统，其区域内容由 [IANA（互联网号码分配机构）](/zh-CN/glossary/iana/) 维护。每个尚未被缓存的域名查询都从这里开始：[解析器](/zh-CN/glossary/dns-resolver/) 询问根区域在哪里找到 `.com`，然后沿链向下追踪。根区域是互联网命名的锚点——代币化不会触及它，代币化只是在现有 DNS 之上添加由[钱包](/zh-CN/glossary/wallet/) 控制的所有权层，而非替换根区域。

*来源：IANA 根区域；IANA 根服务器。*
