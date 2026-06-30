---
title: DNS 传播
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
description: DNS 变更在全球范围内生效前的延迟，原因是各地解析器中的旧缓存记录尚未过期。
keywords: ['DNS 传播', 'DNS 更新延迟', 'TTL', 'DNS 缓存', '域名服务器变更']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
  - https://datatracker.ietf.org/doc/html/rfc1035
relatedArticles:
  - /zh-CN/blog/the-curve-finance-dns-hijack/
  - /zh-CN/blog/the-malaysia-airlines-dns-hijack/
  - /zh-CN/blog/the-perl-com-domain-theft/
  - /zh-CN/blog/dns-on-tokenized-domains/
  - /zh-CN/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/name-change-game-change/
relatedGlossary:
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/ttl/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/registry/
---

**DNS 传播**是指进行 [DNS（域名系统）](/zh-CN/glossary/dns/) 变更到该变更在互联网各处可见之间的延迟。这是因为全球各地的[解析器](/zh-CN/glossary/dns-resolver/) 会缓存旧答案，直到其 [TTL（生存时间）](/zh-CN/glossary/ttl/) 到期，因此新的[记录](/zh-CN/glossary/dns-record-types/) 或[域名服务器](/zh-CN/glossary/nameserver/) 更新是逐渐生效，而非立即完成——耗时从几分钟到几天不等。没有一个可以立即更新的全球"DNS"；传播只是缓存依次超时的过程。实际解决方法是在计划变更前降低 TTL。这一切都不影响域名的所有权：代币化改变的是谁在链上控制该名称，而不是 DNS 编辑的传播速度。

*来源：Cloudflare TTL 词汇表；RFC 1035。*
