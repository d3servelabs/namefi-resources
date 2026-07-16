---
title: 注册商
date: '2025-06-30'
language: zh-CN
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['fenwei-bian']
description: 经 ICANN 认证、获授权代表公众注册域名的公司，充当注册人与注册局之间的接口。
keywords: ['注册商', '域名注册商', 'ICANN 认证', '域名注册', 'RAA', 'EPP', '授权码', '转移锁', '域名转移']
level: 2
sources:
  - https://www.icann.org/en/accredited-registrars
  - https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en
  - https://www.iana.org/domains/root
aliasesByLocale:
  zh-CN: ['注册服务商']
  de: ['Registrierungsdienst']
relatedArticles:
  - /zh-CN/blog/how-to-sell-a-domain-name-you-own/
  - /zh-CN/blog/what-are-tokenized-domains/
  - /zh-CN/blog/what-is-a-tld/
  - /zh-CN/blog/the-panix-com-domain-hijack/
  - /zh-CN/blog/what-is-udrp/
relatedTopics:
  - /zh-CN/topics/domain-basics/
  - /zh-CN/topics/domain-security/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/domain-investor-field-guide/
relatedGlossary:
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/web3/
---

**注册商**是经 [ICANN](/zh-CN/glossary/icann/) 认证的机构，获授权代表公众在一个或多个顶级域中注册域名，负责管理域名购买者与运营相关域名权威数据库的[注册局](/zh-CN/glossary/registry/)之间的关系。

## 注册商的职能

注册商是域名系统中面向公众的服务提供商。当个人或机构想要拥有一个域名时，他们与注册商互动——而非直接联系注册局或 [ICANN](/zh-CN/glossary/icann/)。

注册商提供的核心功能包括：

- **域名搜索与注册。** 注册商查询注册局的可用性数据库，购买完成后代表客户提交注册请求。
- **续费管理。** 注册期限为一至十年不等。注册商收取续费并在域名到期前重新注册。
- **[DNS](/zh-CN/glossary/dns/) 与[名称服务器](/zh-CN/glossary/nameserver/)管理。** 注册商为注册人提供控制面板，用于更新决定域名 DNS 记录托管位置的名称服务器。
- **联系记录维护。** ICANN 规定要求 WHOIS 联系数据准确无误。注册商收集这些数据并（在隐私约束范围内）予以公开。
- **域名安全功能。** 包括域名锁定、注册商账户的双因素认证、DNSSEC 签名，以及针对敏感变更的电子邮件验证。
- **转移协助。** 当域名所有者迁移至不同注册商时，当前注册商必须遵循 ICANN 的转移政策，并在收到有效转移请求后释放域名。

## 注册商、注册局与注册人的区别

域名行业围绕三个不同角色组织，三者均以"注册"开头——这是常见混淆的根源。

| 角色 | 是谁 | 掌控什么 |
|---|---|---|
| **[注册局](/zh-CN/glossary/registry/)** | 顶级域（TLD）的运营商——例如 Verisign 运营 `.com`，DENIC 运营 `.de`。 | 该 TLD 下所有二级域的权威数据库；制定批发价格和注册局政策。 |
| **注册商** | 经 ICANN 认证、获授权在一个或多个 TLD 内注册名称的转售商。 | 客户关系、零售定价、控制面板、续费通知，以及转移/锁定机制。 |
| **[注册人](/zh-CN/glossary/registrant/)** | 购买并使用域名的个人、企业或机构。 | 名称服务器和 DNS 记录的配置；续费和转移该名称的法律权利。 |

注册局和注册商是独立的业务实体。注册局不直接向公众销售，而是向经认证的注册商批发访问权限；注册商再自行制定零售价格并争夺客户。在某些情况下，同一家公司同时持有注册局和注册商资质（Donuts/Identity Digital 是典型例子），但根据 ICANN 规则，这两个角色在运营和合同层面仍保持独立。

## ICANN 认证——RAA

一家公司不能仅凭搭建一个结账流程就自称注册商。它必须首先通过**注册商认证协议（RAA）**获得 [ICANN](/zh-CN/glossary/icann/) 认证——这是一份具有约束力的合同，就数据准确性、争议处理、注册人权利、滥用响应和客户数据财务托管等方面设定了最低义务。

RAA 的主要条款包括：

- **注册人验证。** 注册商必须在规定时限内验证联系数据并响应不准确投诉。
- **数据托管。** 注册商必须将客户注册数据存入第三方托管服务商，以确保在注册商倒闭时注册记录仍可幸存。
- **滥用响应。** 注册商必须维护一个滥用联系点，并在规定时限内对有据可查的滥用举报（垃圾邮件、恶意软件、网络钓鱼）采取行动。
- **瘦型与厚型 WHOIS。** 部分 TLD 采用瘦型模式（联系数据保存在注册商端），另一些采用厚型模式（联系数据复制至注册局）。RAA 规定了哪些数据须依据 GDPR 及类似框架予以公开或进行隐私保护。

ICANN 公开了[经认证注册商的完整列表](https://www.icann.org/en/accredited-registrars)，目前全球逾 2,000 家，并附有其认证状态及任何公开制裁记录。

## 注册与转移的工作原理

### 通过 EPP 注册

注册商使用**可扩展配置协议（[EPP](/zh-CN/glossary/epp/)）**与注册局连接——这是一种在 RFC 5730–5734 中定义的标准化基于 XML 的协议。当注册人完成购买后，注册商系统向注册局发送 EPP `create` 命令，注册局记录注册信息并返回一个唯一的**注册局对象标识符（ROID）**。随后，注册局在 DNS 根区中发布[名称服务器](/zh-CN/glossary/nameserver/)委托，使域名可以解析。

### 转移锁与授权码

注册商之间的域名转移受 ICANN [注册商间转移政策](https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en)约束。两种机制防范未经授权的转移：

- **[转移锁](/zh-CN/glossary/transfer-lock/)（注册商锁 / EPP 状态 `clientTransferProhibited`）。** 启用后，注册局将拒绝针对该域名的任何转移请求。注册商默认启用此功能作为安全措施。注册人必须在发起转移前明确解锁域名。
- **[授权码](/zh-CN/glossary/auth-code/)（亦称 EPP auth-info 码或转移授权码）。** 由注册商生成的一次性密码。接收方（获得方）注册商将此码提交至注册局，以证明注册人已授权转移。没有该码，注册局将拒绝请求。

标准的出站转移流程：

1. 注册人向当前注册商请求授权码。
2. 注册人解锁域名（禁用 `clientTransferProhibited`）。
3. 注册人在接收方注册商处输入授权码。
4. 接收方注册商向注册局提交 EPP `transfer` 命令。
5. 注册局通知失去方注册商，后者有五天时间明确拒绝或批准；沉默视为批准。
6. 转移完成；接收方注册商持有剩余期限加一年的注册权。

ICANN 规定禁止注册商收取转出费，但部分注册商仍尝试对特定 TLD 收取此类费用。

### 60 天锁定规则

ICANN 政策规定，域名在初始注册后及每次注册商间转移后，须在当前注册商处锁定 60 天。这防止了通过在注册商之间频繁转移来掩盖所有权等滥用情形。每次转移后，60 天计时重新开始。

## 转售商

许多域名并非由经认证的注册商直接销售，而是由**[转售商](/zh-CN/glossary/reseller/)**销售——即以自有品牌白标注册商基础设施的公司。转售商不持有自己的 ICANN 资质，而是在上游注册商的资质下运营。对[注册人](/zh-CN/glossary/registrant/)而言，实际影响包括：

- 上游注册商持有与注册局的 EPP 连接，因此 WHOIS 中显示的是注册商名称，而非转售商名称。
- 争议和托管权利受上游 RAA 约束。
- 若转售商退出业务，注册记录在上游注册商的托管下仍然有效。

转售商安排十分普遍：许多虚拟主机公司、网站构建工具和电信服务提供商通过此模式将域名作为附加产品销售。

## 选择注册商

没有一家注册商适合所有用途。值得比较的中立参考因素：

- **定价。** 注册价格由注册局设定（批发价），但各注册商的加价幅度不同。应将第一年的促销价格与多年续费价格进行比较——差距往往很大。同时查看转入价格。
- **隐私保护。** 按照 ICANN 的 GDPR 指南，大多数注册商免费提供 WHOIS 隐私（代理联系数据），但部分仍收费。请确认默认设置。
- **安全功能。** 关注账户的双因素认证、高价值域名的注册局锁可用性、DNSSEC 支持，以及账户变更确认邮件。
- **DNS 托管。** 部分注册商捆绑自有 DNS 托管；另一些则对名称服务器不作限定。评估捆绑 DNS 是否满足需求，或是否需要指向独立提供商（Cloudflare、AWS Route 53 等）。
- **支持质量。** 响应时间和渠道选项（聊天、电话、工单）因注册商而异显著。对于业务关键域名，全天候在线支持至关重要。
- **认证范围。** 并非每家注册商都对所有 TLD 持有资质。请确认注册商支持你所需的特定 TLD，尤其是可能要求本地存在规则的国家代码顶级域（ccTLD）。

知名经认证注册商包括 GoDaddy、Namecheap、Cloudflare Registrar、Google Domains（现为 Squarespace Domains）和 Gandi——此处作为事实性举例，并非背书。各注册商的定价结构、功能集和用户界面各有不同，适合不同注册人的需求。

## 注册商与代币化域名

传统 [DNS](/zh-CN/glossary/dns/) 注册将域名控制权交由注册商掌握：账户访问权限、支付方式和注册商自身政策决定了谁可以续费、转移或配置域名。所有权实际上与注册商账户绑定。

部分基于区块链的命名系统——例如以太坊名称服务（ENS）针对 `.eth` 名称——完全在传统 DNS 层级体系和 ICANN 认证框架之外运作。在这些系统中，所有权编码于智能合约中，并由密码学私钥（而非注册商账户）控制。此类名称不出现在 [IANA](/zh-CN/glossary/nameserver/) 根区中，在标准 DNS 中无法解析（除非借助浏览器扩展或解析器层面的支持）。

少数项目探索混合模式，将传统 ICANN 委托的域名与链上所有权记录相关联，但截至 2025 年，这些模式仍处于 DNS 主流之外，并不影响注册商在 RAA 下的正式角色。对于任何可在标准 DNS 中解析的域名，经 ICANN 认证的注册商仍是注册人与注册局之间不可或缺的中间人。
