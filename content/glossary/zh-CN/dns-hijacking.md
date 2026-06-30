---
title: DNS 劫持
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
description: 通过篡改 DNS 解析而非域名注册本身，将域名流量重定向至恶意目标。
keywords: ['DNS劫持', '缓存投毒', 'DNS欺骗', 'DNSSEC', '流量重定向']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/dns-cache-poisoning/
relatedArticles:
  - /zh-CN/blog/the-fox-it-dns-hijack/
  - /zh-CN/blog/the-sea-turtle-dns-espionage/
  - /zh-CN/blog/the-myetherwallet-bgp-dns-attack/
  - /zh-CN/blog/the-dnspionage-campaign/
  - /zh-CN/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/domain-investor-field-guide/
relatedGlossary:
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/bgp-hijack/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/urs/
---

**DNS 劫持**（也称 DNS 欺骗或缓存投毒）攻击的是解析层而非注册本身：攻击者无需在[注册商](/zh-CN/glossary/registrar/)处夺取域名，而是破坏 [DNS 解析器](/zh-CN/glossary/dns-resolver/)或[域名服务器](/zh-CN/glossary/nameserver/)所认为域名指向的地址，悄无声息地将访问者引导至恶意 IP。在缓存投毒攻击中，伪造的 DNS 响应被递归解析器接受并缓存至 TTL 到期，在此期间，该解析器服务的所有用户都会被误导——而权威 [DNS](/zh-CN/glossary/dns/) 记录中没有任何可见变化。主要的技术对策是 [DNSSEC](/zh-CN/glossary/dnssec/)，它对 DNS 响应进行密码学签名，使解析器能够检测篡改。与传统[域名盗窃](/zh-CN/glossary/domain-theft/)不同，DNS 劫持不会改变所有权记录，因此在没有主动监控域名实际解析位置的情况下，更难被发现。
