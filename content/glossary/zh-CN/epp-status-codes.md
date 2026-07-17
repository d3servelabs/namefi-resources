---
title: EPP 状态码
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['fenwei-bian']
description: 域名上的标准化标志，显示其当前状态——锁定、暂停、待转移等。
keywords: ['EPP状态码', 'clientHold', 'serverTransferProhibited', '域名状态', '待删除']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /zh-CN/blog/expired-domains-and-the-drop-cycle/
  - /zh-CN/blog/domain-backorders-and-drop-catching/
  - /zh-CN/blog/how-to-sell-a-domain-name-you-own/
  - /zh-CN/blog/the-panix-com-domain-hijack/
  - /zh-CN/blog/working-with-domain-brokers/
relatedTopics:
  - /zh-CN/topics/domain-investing/
  - /zh-CN/topics/domain-security/
relatedSeries:
  - /zh-CN/series/domain-flipping-skills/
  - /zh-CN/series/domain-apocalypse/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/epp/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/transfer-lock/
---

**EPP 状态码**是可扩展配置协议（[EPP](/zh-CN/glossary/epp/)）定义的机器可读标志，精确描述了域名在任意时刻允许执行哪些操作。它们分为两个命名空间：由[注册商](/zh-CN/glossary/registrar/)设置的 `client*` 状态码，以及由[注册局](/zh-CN/glossary/registry/)设置的 `server*` 状态码，后者优先级更高。常见状态码包括：`clientTransferProhibited`（阻止出站转移的[转移锁定](/zh-CN/glossary/transfer-lock/)）、`serverDeleteProhibited`（注册局级别的删除保护）、`clientHold`（暂停 DNS 解析，通常因未付款触发），以及 `pendingDelete`——标记域名处于[宽限期](/zh-CN/glossary/grace-period/)内待释放重新注册的状态，与[待删除](/zh-CN/glossary/pending-delete/)状态相邻。理解这些状态码具有实际意义：显示 `serverTransferProhibited` 的域名即使在注册商解锁后也无法被转移，这常常令交易中途的买家感到意外。
