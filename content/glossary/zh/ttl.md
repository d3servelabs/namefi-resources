---
title: TTL（生存时间）
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: DNS 记录可被解析器缓存的时长（以秒为单位），超时后必须重新查询。
keywords: ['TTL', '生存时间', 'DNS 缓存', 'DNS 传播', '记录缓存']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
relatedArticles:
  - /zh/blog/the-panix-com-domain-hijack/
  - /zh/blog/the-godaddy-multi-year-breach/
  - /zh/blog/the-sushiswap-miso-insider-attack/
  - /zh/blog/working-with-domain-brokers/
  - /zh/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /zh/topics/domain-security/
  - /zh/topics/domain-investing/
relatedSeries:
  - /zh/series/domain-apocalypse/
  - /zh/series/domain-flipping-skills/
relatedGlossary:
  - /zh/glossary/dns/
  - /zh/glossary/dns-propagation/
  - /zh/glossary/registrar/
  - /zh/glossary/icann/
  - /zh/glossary/registry/
---

**TTL（生存时间）**是附加在每条 [DNS 记录](/zh/glossary/dns-record-types/) 上的秒数值，告知[解析器](/zh/glossary/dns-resolver/) 可以缓存该答案多长时间后才需要重新查询。较短的 TTL（如 300 秒）意味着更改能快速生效，但会产生更多查询；较长的 TTL（86,400 秒 = 一天）效率更高，但意味着更新会在缓存中持续存在。在计划变更前一天降低 TTL 是实现快速 [DNS 传播](/zh/glossary/dns-propagation/) 的标准技巧。TTL 仅控制 DNS 缓存——与域名的注册期限或代币化域名所添加的[链上 (On-chain)](/zh/glossary/on-chain/) 所有权层无关。

*来源：RFC 1035；Cloudflare TTL 词汇表。*
