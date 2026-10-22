---
title: "CAA"
date: '2026-10-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "CAA 记录指定域名授权哪些证书颁发机构签发证书。"
keywords: ["CAA", "证书颁发机构授权", "TLS 身份验证"]
also_known_as: ["证书颁发机构授权"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc8659#section-1
  - https://www.rfc-editor.org/rfc/rfc8659#section-5
  - https://letsencrypt.org/docs/caa/
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
  - /zh-CN/glossary/man-in-the-middle-attack/
  - /zh-CN/glossary/dane/
  - /zh-CN/glossary/certificate-transparency/
---

**CAA** 是**证书颁发机构授权**的缩写。CAA 是一种 DNS 记录，用于指定域名授权哪些[证书颁发机构](/zh-CN/glossary/certificate-authority/)签发证书。遵循规范的 CA 会在签发前检查适用的 CAA 记录。[DNSSEC（域名系统安全扩展）](/zh-CN/glossary/dnssec/)可以验证承载授权策略的 DNS 响应。CAA 减少遵循规范的流程中的非预期签发。CAA 不会使浏览器拒绝其他颁发机构的证书，不会吊销现有证书，也不能阻止攻击者直接利用失陷的 CA 签名密钥伪造证书。CAA 指定颁发机构授权，而域名验证仍是一项独立要求。
