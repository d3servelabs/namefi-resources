---
title: "证书颁发机构"
date: '2026-10-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "证书颁发机构签发数字证书，将身份与公钥关联起来。"
keywords: ["证书颁发机构", "CA", "TLS 身份验证"]
also_known_as: ["CA", "认证机构"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-3.2
  - https://www.rfc-editor.org/rfc/rfc8659#section-2.2
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
  - /zh-CN/glossary/intermediate-ca/
  - /zh-CN/glossary/man-in-the-middle-attack/
  - /zh-CN/glossary/dane/
  - /zh-CN/glossary/caa/
  - /zh-CN/glossary/certificate-transparency/
---

**证书颁发机构**又称**认证机构**或 **CA**，负责签发数字证书，将身份与[公钥](/zh-CN/glossary/public-key/)关联起来。公开受信任的 TLS CA 在签发网站证书前，会检查域名控制权及适用的身份要求。客户端根据受信任的根验证证书链，并检查服务器持有相应私钥的证明。CA 可以将签名权限委托给[中间证书颁发机构](/zh-CN/glossary/intermediate-ca/)。CA 信任依据客户端策略验证身份。CA 信任不保证网站内容诚实可信。
