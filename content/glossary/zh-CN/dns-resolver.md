---
title: DNS 解析器（递归解析器）
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['fenwei-bian']
description: 接受域名查询并遍历 DNS 层级以返回对应地址的服务器。
keywords: ['DNS 解析器', '递归解析器', '解析器', '8.8.8.8', '1.1.1.1', 'DNS 查询']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/what-is-a-dns-resolver/
relatedArticles:
  - /zh-CN/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /zh-CN/blog/the-dyn-dns-mirai-attack/
  - /zh-CN/blog/the-myetherwallet-bgp-dns-attack/
  - /zh-CN/blog/tokenized-domain-vs-web3-domain/
  - /zh-CN/blog/premium-web3-tlds/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/domain-flipping-skills/
relatedGlossary:
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/urs/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/registrar/
---

**DNS 解析器**（或*递归解析器*）是你的设备在需要将域名转换为 [IP 地址](/zh-CN/glossary/ip-address/) 时所询问的服务器。公共解析器如 `1.1.1.1`（Cloudflare）和 `8.8.8.8`（Google）负责完成实际工作：从[根区域](/zh-CN/glossary/root-zone/) 开始，它们沿着 [DNS（域名系统）](/zh-CN/glossary/dns/) 层级向下查询到域名的权威[域名服务器](/zh-CN/glossary/nameserver/)，然后按其 [TTL（生存时间）](/zh-CN/glossary/ttl/) 缓存答案。这正是 DNS 让"输入名称、访问网站"感觉瞬间完成的部分。解析器只读取公共 DNS 数据——它们对谁*拥有*一个域名一无所知，这也是为什么代币化域名基于[钱包](/zh-CN/glossary/wallet/) 的所有权层对解析过程不可见，也不会改变名称的解析方式。

*来源：RFC 1034；Cloudflare DNS 解析器。*
