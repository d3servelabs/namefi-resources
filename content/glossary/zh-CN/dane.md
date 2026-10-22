---
title: "DANE"
date: '2026-10-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "DANE 利用受 DNSSEC 保护的 TLSA 记录中的证书或密钥关联，验证 TLS 服务。"
keywords: ["DANE", "基于 DNS 的命名实体身份验证", "TLS 身份验证"]
also_known_as: ["基于 DNS 的命名实体身份验证"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc6698#section-2
  - https://www.rfc-editor.org/rfc/rfc7671#section-5.1
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
  - /zh-CN/glossary/caa/
  - /zh-CN/glossary/certificate-transparency/
---

**DANE** 是**基于 DNS 的命名实体身份验证**的缩写。DANE 使用 TLSA 记录，将 TLS 服务与证书、公钥或信任锚关联起来。[DNSSEC（域名系统安全扩展）](/zh-CN/glossary/dnssec/)验证 DNS 数据的真实性。支持 DANE 的客户端在 TLS 身份验证时强制执行关联要求。根据所选用途，DANE 可以约束公开受信任的[证书颁发机构](/zh-CN/glossary/certificate-authority/)，也可以独立于公共 CA 信任验证服务。仅发布 TLSA 记录不能保护忽略 DANE 的客户端。运营者必须协调密钥变更与 TLSA 更新，并维持 DNSSEC 验证。
