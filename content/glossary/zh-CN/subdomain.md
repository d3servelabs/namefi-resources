---
title: 子域名
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
description: 添加到域名前面以创建独立地址的前缀，如 blog.example.com 或 app.example.com。
keywords: ['子域名', '主机', 'blog.example.com', 'DNS', '二级域名']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/glossary/what-is-a-subdomain/
relatedArticles:
  - /zh-CN/blog/how-domain-hijacking-actually-happens/
  - /zh-CN/blog/what-is-a-tld/
  - /zh-CN/blog/domain-hacks-explained/
  - /zh-CN/blog/domain-terminology-guide/
  - /zh-CN/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/domain-flipping-skills/
relatedGlossary:
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/domain-forwarding/
---

**子域名**是添加到你的域名前面以在其下创建独立地址的前缀——`blog.example.com`、`app.example.com` 或 `mail.example.com` 都是 `example.com` 的子域名。创建子域名只需在父域名的[域名服务器](/zh-CN/glossary/nameserver/)处添加一条 [DNS 记录](/zh-CN/glossary/dns-record-types/)（通常是 A 记录或 CNAME），无需额外注册或费用。子域名让一个已注册的域名可以托管多项服务，这正是它成为网站、应用程序和 API 构建基础的原因。在代币化世界中，所有权存在于[已注册](/zh-CN/glossary/registrant/)的[二级域名 (SLD)](/zh-CN/glossary/second-level-domain/) 处；子域名是其下的配置，随父域名[钱包](/zh-CN/glossary/wallet/)的控制者而定。

*来源：RFC 1034；Cloudflare 子域名词汇表。*
