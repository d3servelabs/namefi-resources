---
title: EPP 状态码
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 域名上的标准化标志，显示其当前状态——锁定、暂停、待转移等。
keywords: ['EPP状态码', 'clientHold', 'serverTransferProhibited', '域名状态', '待删除']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
---

**EPP 状态码**是可扩展配置协议（[EPP](/zh/glossary/epp/)）定义的机器可读标志，精确描述了域名在任意时刻允许执行哪些操作。它们分为两个命名空间：由[注册商](/zh/glossary/registrar/)设置的 `client*` 状态码，以及由注册局设置的 `server*` 状态码，后者优先级更高。常见状态码包括：`clientTransferProhibited`（阻止出站转移的[转移锁定](/zh/glossary/transfer-lock/)）、`serverDeleteProhibited`（注册局级别的删除保护）、`clientHold`（暂停 DNS 解析，通常因未付款触发），以及 `pendingDelete`——标记域名处于宽限期内待释放重新注册的状态，与[待删除](/zh/glossary/pending-delete/)状态相邻。理解这些状态码具有实际意义：显示 `serverTransferProhibited` 的域名即使在注册商解锁后也无法被转移，这常常令交易中途的买家感到意外。
