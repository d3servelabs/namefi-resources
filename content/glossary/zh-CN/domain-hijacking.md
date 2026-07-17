---
title: 域名劫持
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['fenwei-bian']
description: 攻击者通过未经授权取得注册商账户或注册信息的控制权，从而窃取域名的行为。
keywords: ['域名劫持', '账户入侵', '域名盗窃', '注册商安全', '未授权转移']
level: 1
sources:
  - https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en
relatedArticles:
  - /zh-CN/blog/how-domain-hijacking-actually-happens/
  - /zh-CN/blog/domain-flipping-and-the-law/
  - /zh-CN/blog/the-perl-com-domain-theft/
  - /zh-CN/blog/the-2024-squarespace-defi-domain-hijacks/
  - /zh-CN/blog/the-panix-com-domain-hijack/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/domain-flipping-skills/
relatedGlossary:
  - /zh-CN/glossary/domain-theft/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/registry-lock/
  - /zh-CN/glossary/phishing/
  - /zh-CN/glossary/transfer-lock/
---

**域名劫持**是指攻击者通过取得拥有域名的[注册商](/zh-CN/glossary/registrar/)账户的控制权，对域名实施未经授权夺取的行为——通常通过[网络钓鱼](/zh-CN/glossary/phishing/)、凭证填充或针对注册商支持人员的社会工程学手段实现。一旦进入账户，攻击者可修改域名服务器以重定向流量、禁用[注册局锁定](/zh-CN/glossary/registry-lock/)保护，或发起转移将合法持有人彻底拒之门外，因此往往与彻底的[域名盗窃](/zh-CN/glossary/domain-theft/)相互交织。防御措施包括启用[转移锁定](/zh-CN/glossary/transfer-lock/)、使用硬件密钥双因素认证、对高价值域名启用注册局级别的锁定，以及保持注册商联系信息最新以确保恢复邮件能够送达。
