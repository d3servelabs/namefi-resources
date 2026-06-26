---
title: WHOIS 隐私
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 在公开的 WHOIS 或 RDAP 记录中屏蔽注册人真实联系信息的服务。
keywords: ['WHOIS 隐私', '隐私保护', 'RDAP', '注册人隐私', '联系信息遮蔽']
also_known_as: ['隐私保护']
level: 1
sources:
  - https://www.icann.org/rdap
relatedArticles:
  - /zh/blog/from-massdrop-com-to-drop-com/
  - /zh/blog/how-domain-hijacking-actually-happens/
  - /zh/blog/from-getdropbox-com-to-dropbox-com/
  - /zh/blog/the-fox-it-dns-hijack/
  - /zh/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /zh/topics/domain-security/
  - /zh/topics/domain-investing/
relatedSeries:
  - /zh/series/domain-apocalypse/
  - /zh/series/name-change-game-change/
relatedGlossary:
  - /zh/glossary/registrar/
  - /zh/glossary/dns/
  - /zh/glossary/icann/
  - /zh/glossary/tld/
  - /zh/glossary/whois/
---

**WHOIS 隐私**（WHOIS privacy，也称隐私保护）是大多数[注册商](/zh/glossary/registrar/)提供的一项服务，将代理联系信息——通常为注册商自身地址和转发邮箱——替换公开 [WHOIS](/zh/glossary/whois/) 和 RDAP 记录中[注册人](/zh/glossary/registrant/)的真实姓名、地址、电话及电子邮件。若不启用此服务，上述信息将可被公开查询，使所有者成为垃圾邮件、社会工程学攻击以及旨在入侵注册商账户的定向[网络钓鱼](/zh/glossary/phishing/)的目标。自 2018 年 GDPR 执法以来，许多注册局已默认在 gTLD WHOIS 中编辑个人数据，但各 TLD 和注册商的保护程度参差不齐，因此明确启用隐私服务仍是最佳实践。需要理解的是，隐私保护有其局限性：它隐藏了联系信息，但无法阻止技术娴熟的攻击者通过 DNS 枚举或证书透明度日志来梳理域名的基础设施结构。
