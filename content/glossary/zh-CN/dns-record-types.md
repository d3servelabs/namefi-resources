---
title: DNS 记录类型（A、AAAA、CNAME、MX、TXT）
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
description: 区域文件中将域名映射到地址和服务的条目，包括 A、AAAA、CNAME、MX、TXT 等。
keywords: ['DNS 记录', 'A 记录', 'AAAA 记录', 'CNAME', 'MX 记录', 'TXT 记录']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/dns-records/
relatedArticles:
  - /zh-CN/blog/dns-on-tokenized-domains/
  - /zh-CN/blog/how-domain-hijacking-actually-happens/
  - /zh-CN/blog/the-lenovo-com-dns-hijack/
  - /zh-CN/blog/the-dnspionage-campaign/
  - /zh-CN/blog/what-are-tokenized-domains/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/registry/
---

**DNS 记录类型**是域名区域文件中的各个条目，告知 [DNS（域名系统）](/zh-CN/glossary/dns/) 将不同类型的流量发送到何处。常见类型有：**A**（将名称映射到 IPv4 [IP 地址](/zh-CN/glossary/ip-address/)）、**AAAA**（IPv6）、**CNAME**（将一个名称别名为另一个）、**MX**（路由邮件）和 **TXT**（用于 SPF、DKIM 和域名验证的自由格式文本）。这些记录由你委托域名指向的[域名服务器](/zh-CN/glossary/nameserver/)发布，它们才是真正让网站加载或邮件送达的关键。对域名进行代币化不影响这些记录：记录照常解析，而所有权和转移则转移到由[钱包](/zh-CN/glossary/wallet/)控制的[链上 (On-chain)](/zh-CN/glossary/on-chain/) 层。

*来源：RFC 1035；Cloudflare DNS 记录。*
