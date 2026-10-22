---
title: "中间证书颁发机构"
date: '2026-10-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "中间证书颁发机构持有经证书链委托、连接到信任锚的证书签名权限。"
keywords: ["中间证书颁发机构", "中间 CA", "TLS 身份验证"]
also_known_as: ["中间 CA"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-6
  - https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0
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
  - /zh-CN/glossary/man-in-the-middle-attack/
  - /zh-CN/glossary/dane/
  - /zh-CN/glossary/caa/
  - /zh-CN/glossary/certificate-transparency/
---

**中间证书颁发机构**又称**中间 CA**，持有其他[证书颁发机构](/zh-CN/glossary/certificate-authority/)通过证书链委托的签名权限。证书链通常将网站证书连接到受信任的根，有时会经过多个中间证书。证书约束限制委托权限。中间证书颁发机构的[私钥](/zh-CN/glossary/private-key/)一旦失陷，攻击者便可能在委托权限范围内伪造证书签名。客户端必须应用相关的不信任或吊销更新。更换一个网站的证书，不能让其他客户端在信任判断中排除已失陷的中间密钥。
