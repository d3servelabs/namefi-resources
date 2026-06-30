---
title: 转移锁定
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
description: 阻止域名转移至其他注册商的状态标志，需明确解锁后方可执行转移操作。
keywords: ['转移锁定', '注册商锁定', '域名安全', 'EPP 状态', '域名转移']
also_known_as: ['注册商锁定']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /zh-CN/blog/the-panix-com-domain-hijack/
  - /zh-CN/blog/how-to-sell-a-domain-name-you-own/
  - /zh-CN/blog/how-tokenization-changes-domain-flipping/
  - /zh-CN/blog/avoiding-domain-sale-scams/
  - /zh-CN/blog/working-with-domain-brokers/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-investing/
relatedSeries:
  - /zh-CN/series/domain-flipping-skills/
  - /zh-CN/series/domain-apocalypse/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/domain-hijacking/
  - /zh-CN/glossary/cross-registrar-transfer/
  - /zh-CN/glossary/epp/
  - /zh-CN/glossary/registry-lock/
---

**转移锁定**（Transfer Lock，也称注册商锁定；EPP 状态码 `clientTransferProhibited`）是由[注册商](/zh-CN/glossary/registrar/)设置的一个标志，阻止域名在未明确解锁的情况下被转移至其他注册商。锁定生效时，任何发起[跨注册商转移](/zh-CN/glossary/cross-registrar-transfer/)的尝试在进行之前即会被拒绝，即便请求方持有[授权码](/zh-CN/glossary/auth-code/)也不例外。这是防范[域名劫持](/zh-CN/glossary/domain-hijacking/)最简单也最有效的手段之一：只要锁定处于激活状态，即便攻击者已控制你的账户，也无法悄悄将资产转移出去。最佳实践是始终保持转移锁定开启，仅在完成合法转移所需的短暂窗口期内临时解除。
