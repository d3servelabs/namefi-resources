---
title: WHOIS（与 RDAP）
date: '2026-05-22'
language: zh-CN
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: WHOIS 及其继任者 RDAP 是用于查询域名注册详情（如注册商和到期日期）的公开查询服务。
keywords: ['WHOIS', 'RDAP', '域名注册查询', '注册人信息', '域名所有权查询']
level: 1
sources:
  - https://www.icann.org/rdap
  - https://lookup.icann.org/
relatedArticles:
  - /zh-CN/blog/what-are-tokenized-domains/
  - /zh-CN/blog/expired-domains-and-the-drop-cycle/
  - /zh-CN/blog/how-domain-hijacking-actually-happens/
  - /zh-CN/blog/what-is-udrp/
  - /zh-CN/blog/cctld-market-share-by-registration-volume/
relatedTopics:
  - /zh-CN/topics/domain-basics/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/domain-flipping-skills/
relatedGlossary:
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/whois-privacy/
  - /zh-CN/glossary/registry/
---

**WHOIS** 是用于查询域名注册信息的长期协议和公共服务——包括注册商、注册和到期日期，以及历史上的[注册人](/zh-CN/glossary/registrant/)联系信息。其现代继任者是 **RDAP（注册数据访问协议）**，它返回结构化 JSON 格式数据，是 [ICANN](/zh-CN/glossary/icann/) 和注册局正在迁移采用的协议。对于[代币化域名](/zh-CN/blog/what-are-tokenized-domains/)，WHOIS/RDAP 记录仍然存在于[注册商](/zh-CN/glossary/registrar/)层面，因为底层的 [DNS (域名系统)](/zh-CN/glossary/dns/)注册是真实且经 ICANN 认可的——只有*所有权和转移机制*转移到了[链上 (On-chain)](/zh-CN/glossary/on-chain/)层。隐私保护正变得越来越普遍：许多注册商现在默认屏蔽个人联系信息，以符合 GDPR 等隐私法规。参考资料：[ICANN 的 WHOIS 查询](https://lookup.icann.org/)。
