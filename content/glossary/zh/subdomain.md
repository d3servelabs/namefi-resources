---
title: 子域名
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 添加到域名前面以创建独立地址的前缀，如 blog.example.com 或 app.example.com。
keywords: ['子域名', '主机', 'blog.example.com', 'DNS', '二级域名']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/glossary/what-is-a-subdomain/
relatedArticles:
  - /zh/blog/how-domain-hijacking-actually-happens/
  - /zh/blog/what-is-a-tld/
  - /zh/blog/domain-hacks-explained/
  - /zh/blog/domain-terminology-guide/
  - /zh/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /zh/topics/domain-security/
  - /zh/topics/domain-basics/
relatedSeries:
  - /zh/series/domain-apocalypse/
  - /zh/series/domain-flipping-skills/
relatedGlossary:
  - /zh/glossary/dns/
  - /zh/glossary/tld/
  - /zh/glossary/registrar/
  - /zh/glossary/registry/
  - /zh/glossary/domain-forwarding/
---

**子域名**是添加到你的域名前面以在其下创建独立地址的前缀——`blog.example.com`、`app.example.com` 或 `mail.example.com` 都是 `example.com` 的子域名。创建子域名只需在父域名的[域名服务器](/zh/glossary/nameserver/)处添加一条 [DNS 记录](/zh/glossary/dns-record-types/)（通常是 A 记录或 CNAME），无需额外注册或费用。子域名让一个已注册的域名可以托管多项服务，这正是它成为网站、应用程序和 API 构建基础的原因。在代币化世界中，所有权存在于[已注册](/zh/glossary/registrant/)的[二级域名 (SLD)](/zh/glossary/second-level-domain/) 处；子域名是其下的配置，随父域名[钱包](/zh/glossary/wallet/)的控制者而定。

*来源：RFC 1034；Cloudflare 子域名词汇表。*
