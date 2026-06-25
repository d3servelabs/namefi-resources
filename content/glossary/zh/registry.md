---
title: 注册局
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 负责运营顶级域名权威数据库与域名服务器的组织，将零售销售委托给注册商，并制定批发定价。
keywords: ['注册局', '注册局运营商', 'TLD 注册局', '域名注册局', 'ICANN', '注册商', 'EPP', 'gTLD 注册局', 'ccTLD 注册局', '共享注册系统']
also_known_as: ['注册局运营商']
level: 2
sources:
  - https://www.icann.org/resources/pages/registries-0-2012-02-25-en
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/registry-agreements
  - https://www.icann.org/resources/pages/gtld-registry-agreement-2013-01-25-en
---

**注册局**（也称*注册局运营商*）是负责运营某个 [TLD](/zh/glossary/tld/) 权威数据库的组织——记录该后缀下每一个已注册域名，维护将这些名称映射到[域名服务器](/zh/glossary/nameserver/)的区域文件，并发布使 [DNS](/zh/glossary/dns/) 查询正常运转所需的数据。注册局位于域名供应链的顶端，处于[注册商](/zh/glossary/registrar/)和[注册人](/zh/glossary/registrant/)之上。

## 注册局的职能

注册局的核心职能是维护其 TLD 下所有域名的**权威数据库**——通常称为*注册局数据库*或*共享注册系统*。每当域名被创建、续期、转移或删除时，注册局都会记录该变更。注册局还负责发布 **TLD 区域文件**：即告知全球 [DNS](/zh/glossary/dns/) 如何处理该 TLD 下名称查询请求的[域名服务器](/zh/glossary/nameserver/)委派集合。

除数据库管理外，大多数注册局还自行运营或签约运营其 TLD 的**权威域名服务器**（通常称为 TLD 域名服务器）。这些服务器负责回答解析器发来的查询，例如"哪些域名服务器对 `example.com` 具有权威性？"并从注册局的区域文件中返回答案。

注册局的职责不止于此，还包括：

- 制定**批发定价**——即[注册商](/zh/glossary/registrar/)每年为每个域名支付的价格。
- 起草并执行**注册政策**——资格要求、可接受使用规则，以及新后缀的日出期/商标保护期。
- 运营 **WHOIS / RDAP** 查询服务，向公众披露注册数据。
- 在[注册局协议](https://www.icann.org/en/registry-agreements)框架下与 [ICANN](/zh/glossary/icann/) 协调，履行义务并达到绩效标准。

## 注册局、注册商与注册人

域名行业围绕 [ICANN](/zh/glossary/icann/) 建立的三层模式运作：

| 层级 | 角色 | 典型机构 |
|------|------|---------|
| **注册局** | 运营 TLD 数据库；制定批发价格；不直接面向消费者销售 | Verisign（.com、.net）、PIR（.org）、DENIC（.de）|
| **[注册商](/zh/glossary/registrar/)** | 经认证的零售商；向公众销售域名；通过 EPP 与注册局对接 | GoDaddy、Namecheap、Google Domains |
| **[注册人](/zh/glossary/registrant/)** | 注册域名的个人或组织 | 任何购买域名的企业或个人 |

注册局和注册商都经 [ICANN](/zh/glossary/icann/) 认证，但承担截然不同的角色。根据 ICANN 的垂直分离规则（仅有有限例外），注册局不得同时充当其所运营 TLD 的零售注册商。这种分离是有意为之的：目的是防止注册局在公众之前为自己提供优惠定价或优先获取热门域名的特权。

## 注册局与注册商的合作模式

注册局与注册商之间的技术桥梁是**[可扩展供应协议（EPP）](/zh/glossary/epp/)**——这是一种基于 XML 的协议，定义于 [RFC 5730](https://www.rfc-editor.org/rfc/rfc5730)。注册商通过连接注册局的 EPP 服务器来执行域名生命周期操作：`check`（名称是否可用？）、`create`、`renew`、`transfer`、`update` 和 `delete`。

该模式的运作流程如下：

1. 注册商与 [ICANN](/zh/glossary/icann/) 签署**注册商认证协议（RAA）**，并与每个希望销售其 TLD 的注册局分别签署**注册局-注册商协议**。
2. 注册局向注册商收取**批发费用**（例如，截至 2024 年，Verisign 向认证注册商收取约 10.26 美元/年的 `.com` 注册费）。
3. 注册商加收利润，以**零售价格**卖给[注册人](/zh/glossary/registrant/)。
4. 注册商向注册局提交 [EPP](/zh/glossary/epp/) 命令，注册局更新权威数据库和区域文件——域名通常在数分钟内在全球 DNS 中生效。

这种架构有时称为**共享注册系统（SRS）**：单一注册局可同时支持数百家相互竞争的注册商，所有注册商都通过标准化的 [EPP](/zh/glossary/epp/) 事务向同一权威数据库写入数据。注册商层面的竞争压低了零售价格，同时避免任何单一转售商垄断对该 TLD 的访问权。

## 典型案例

**通用 TLD 注册局**

- **Verisign** 运营 `.com` 和 `.net`，是注册量最大的两个 [gTLD](/zh/glossary/gtld/)。其与 [ICANN](/zh/glossary/icann/) 的注册局协议公开可查，被广泛引用为参考范本（[IANA 根数据库 .com 条目](https://www.iana.org/domains/root/db/com.html)）。
- **公共利益注册局（PIR）** 运营 `.org`，最初作为非营利注册局设立，服务于非商业性组织。
- **Identity Digital**（前身为 Donuts 和 Afilias）是委派[新 gTLD](/zh/glossary/new-gtld/) 最大的运营商之一，运营着数百个后缀，如 `.blog`、`.online`、`.store` 和 `.news`。

**国家代码 TLD 注册局**

[ccTLD](/zh/glossary/cctld/) 注册局依据国家或地区权威机构运营，而非 [ICANN](/zh/glossary/icann/) 的 [gTLD](/zh/glossary/gtld/) 协议，尽管许多仍通过 [EPP](/zh/glossary/epp/) 与注册商对接：

- **Nominet**（.uk）——英国注册局，1996 年成立的非营利组织。
- **DENIC**（.de）——德国注册局，由注册商成员组织运营的合作社。
- **AFNIC**（.fr）——法国注册局，在法国政府委托下运营。
- **VeriSign / CNNIC**（.cn）——中国国家代码注册局，由中国互联网络信息中心运营。

ccTLD 注册局列于 IANA 根数据库 [iana.org/domains/root/db](https://www.iana.org/domains/root/db)，这是全球所有 TLD 委派的权威目录。

## 新 gTLD 注册局

2012 年之前，通用顶级域名的数量少且稳定——`.com`、`.net`、`.org`、`.info`、`.biz` 以及少数其他后缀。ICANN 于 2012 年启动的**新 gTLD 计划**，首次向几乎任何字符串开放申请，使其成为[新 gTLD](/zh/glossary/new-gtld/)。最终共有逾 1,200 个新后缀获得委派。

新 [gTLD](/zh/glossary/gtld/) 注册局须与 [ICANN](/zh/glossary/icann/) 签署**注册局协议**，协议规定了技术要求（EPP 支持、DNSSEC、RDAP）、绩效标准（系统可用性、查询响应时间）以及政策义务（滥用治理、商标保护机制，如商标结算所日出期和统一快速暂停系统）。

ICANN 在 [icann.org/en/registry-agreements](https://www.icann.org/en/registry-agreements) 维护新 gTLD 注册局协议的完整列表。

## 注册局与代币化域名

少数替代性域名命名空间——尤以 Unstoppable Domains 和 ENS（以太坊域名服务）为代表——将类域名的名称锚定在公共区块链上，而非 ICANN 协调的 DNS 区域中。在这些系统中，所有权记录在智能合约中，而非注册局数据库；解析需要浏览器扩展程序或兼容解析器，而非标准 DNS 查询路径。

这些基于区块链的命名空间未在 IANA 根目录中获得委派，默认情况下对普通 DNS 解析器不可见。它们独立于上述 ICANN 注册局体系运作。
