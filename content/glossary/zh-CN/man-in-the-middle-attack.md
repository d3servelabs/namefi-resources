---
title: "中间人攻击"
date: '2026-10-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "中间人攻击让攻击者介入通信双方之间，以拦截或修改通信。"
keywords: ["中间人攻击", "MITM", "TLS 身份验证"]
also_known_as: ["MITM", "路径上攻击"]
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4949
  - https://datatracker.ietf.org/doc/html/rfc8446#section-1
relatedArticles:
  - /zh-CN/blog/the-fox-it-dns-hijack/
  - /zh-CN/blog/the-myetherwallet-bgp-dns-attack/
  - /zh-CN/blog/the-curve-finance-dns-hijack/
  - /zh-CN/blog/dns-on-tokenized-domains/
  - /zh-CN/blog/dnssec-for-domain-owners/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/certificate-authority/
  - /zh-CN/glossary/intermediate-ca/
  - /zh-CN/glossary/dane/
  - /zh-CN/glossary/caa/
  - /zh-CN/glossary/certificate-transparency/
---

**中间人攻击**又称 **MITM** 或**路径上攻击**，让攻击者介入通信双方之间。攻击者拦截、转发或修改通信，而通信双方可能以为双方正在直接通信。[DNS 劫持](/zh-CN/glossary/dns-hijacking/)可以将连接重定向到攻击者。HTTPS 通常通过证书验证和私钥持有证明来抵御端点冒充。如果客户端仍然接受受影响的[证书颁发机构](/zh-CN/glossary/certificate-authority/)，证书颁发机构失陷便可能破坏身份验证。加密随后可能保护一条以攻击者为端点的连接。
