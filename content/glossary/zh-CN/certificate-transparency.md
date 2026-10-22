---
title: "证书透明度"
date: '2026-10-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "证书透明度通过公开日志披露 TLS 证书签发情况，供独立监测与审计。"
keywords: ["证书透明度", "CT", "TLS 身份验证"]
also_known_as: ["CT"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc9162#section-1
  - https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/
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
  - /zh-CN/glossary/caa/
---

**证书透明度**又称 **CT**，将 TLS 证书记录在只能追加的公开日志中。域名运营者和其他监测者可以检查日志，发现[证书颁发机构](/zh-CN/glossary/certificate-authority/)的非预期签发。客户端策略可以要求证书先提供日志收录证明，客户端才接受证书。日志记录本身不能阻止欺诈签发，也不能吊销证书。客户端强制执行策略与日志监测提供不同保护。CT 补充了 [CAA](/zh-CN/glossary/caa/)：CAA 在签发前规定颁发机构授权，CT 则在签发后公开已记录的证书，供各方检查。
