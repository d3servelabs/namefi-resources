---
title: 注册局锁定
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
description: 注册局提供的高级安全服务，将域名冻结以确保任何变更都需要人工带外审批。
keywords: ['注册局锁定', '域名锁定', '高安全级别锁定', '防域名劫持', '带外验证']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /zh-CN/blog/the-syrian-electronic-army-nyt-hijack/
  - /zh-CN/blog/the-fox-it-dns-hijack/
  - /zh-CN/blog/the-sea-turtle-dns-espionage/
  - /zh-CN/blog/how-domain-hijacking-actually-happens/
  - /zh-CN/blog/the-malaysia-airlines-dns-hijack/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/domain-flipping-skills/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/domain-hijacking/
  - /zh-CN/glossary/transfer-lock/
---

**注册局锁定**（Registry Lock）是由[注册局](/zh-CN/glossary/registry/)提供的高级安全服务，将域名置于一种特殊状态，使其在标准自动化 EPP 通道中无法进行任何修改——包括名称服务器变更、转移或删除。任何变更均需通过人工带外核验流程，涉及注册商与注册局之间的电话沟通、密码令牌验证或现场身份核查。这与更为常见的[转移锁定](/zh-CN/glossary/transfer-lock/)不同——后者由[注册商](/zh-CN/glossary/registrar/)控制，可通过其自身系统进行切换；而注册局锁定将保护升级至注册局层面，即便攻击者完全控制了注册商账户，也极难进行未授权变更。该服务最常被金融机构、大型品牌及关键基础设施运营商用于保护高价值域名免遭[域名劫持](/zh-CN/glossary/domain-hijacking/)。
