---
title: DNSSEC（域名系统安全扩展）
date: '2026-05-22'
language: zh-CN
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: DNS 记录上的加密签名，让解析器能够验证响应是真实的，且在传输过程中未被伪造或篡改。
keywords: ['DNSSEC', 'DNS 安全', '域名安全', 'DS 记录', '信任链', '加密 DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4033
relatedArticles:
  - /zh-CN/blog/dns-on-tokenized-domains/
  - /zh-CN/blog/how-domain-hijacking-actually-happens/
  - /zh-CN/blog/the-curve-finance-dns-hijack/
  - /zh-CN/blog/the-dnspionage-campaign/
  - /zh-CN/blog/the-fox-it-dns-hijack/
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
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/tld/
---

**DNSSEC（域名系统安全扩展）**是对 [DNS (域名系统)](/zh-CN/glossary/dns/)协议的一组加密扩展，让解析器能够验证 DNS 响应的真实性和完整性。没有 DNSSEC，攻击者可以在解析器与权威服务器之间的路径上伪造或篡改 DNS 响应，将用户重定向到恶意基础设施。有了 DNSSEC，记录会被签名，信任链通过 DS 记录从 DNS 根向下贯穿每个区域。DNSSEC 规范见 [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) 及相关 RFC。域名代币化并不会改变 DNSSEC——信任链仍然通过[注册商](/zh-CN/glossary/registrar/)和[注册局](/zh-CN/glossary/registry/)运行，DS 记录的发布方式也完全相同。许多 DNS 提供商（Cloudflare、Route53）在启用 DNSSEC 时会自动对区域进行签名。
