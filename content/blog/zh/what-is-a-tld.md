---
title: '什么是顶级域名 (TLD)？完整指南'
date: '2026-06-10'
language: zh
tags: ['guide']
authors: ['namefiteam']
draft: false
description: 'TLD 是域名中位于最后一个点之后的部分，如 .com 或 .io。了解什么是 TLD，它的类型（gTLD、ccTLD、赞助型、新 gTLD、IDN），以及如何进行选择。'
keywords: ['tld', 'tld含义', '什么是tld', '什么是顶级域名', '顶级域名', 'tld定义', 'que es un tld', "qu'est-ce qu'un tld", 'tld类型', 'gtld与cctld对比', 'tld示例', '什么是域名后缀', '域名后缀', 'gTLD', 'ccTLD', '赞助型TLD', '新gTLD', 'IDN TLD', 'ICANN', 'IANA', '域名注册局', '域名注册商', '选择TLD', '热门TLD', 'namefi']
---

## 什么是 TLD？

**TLD（顶级域名，top-level domain）**是域名中位于**最后一个点之后**的部分。在 `namefi.io` 中，TLD 是 `.io`。在 `google.com` 中，TLD 是 `.com`。在 `wikipedia.org` 中，TLD 是 `.org`。

用一句话概括 **TLD 的定义**就是：[域名](/en/blog/what-is-domain/)最右侧的标签。人们也常称其为**域名扩展名 (domain extension)**或**域名后缀 (domain suffix)**，但在技术上正确的术语是*顶级域名 (top-level domain)*。它位于互联网命名层次结构的最顶端——因此得名。

> **TLD 含义速览：** *Top-Level Domain（顶级域名）*——网址末尾的后缀（如 `.com`、`.org`、`.io`、`.ai`、`.xyz`），用于标识[域名系统 (DNS)](/en/glossary/dns/) 的最高层级。

如果你曾搜索过 **"que es un TLD"**（西班牙语）或 **"qu'est-ce qu'un TLD"**（法语），在任何语言中答案都是一样的：TLD 是域名的结尾部分，由全球注册局系统在 [ICANN](/en/glossary/icann/) 的监督下进行管理。

---

## TLD、域名与子域名对比

一个完整的域名由几个部分组成，阅读顺序为**从右到左**。了解 TLD 所处的位置可以消除大部分困惑：

```
blog . namefi . io
 │       │       │
 │       │       └── TLD (top-level domain/顶级域名)
 │       └────────── SLD (second-level domain/二级域名)
 └────────────────── Subdomain (子域名)
```

| 组成部分 | 示例（在 `blog.namefi.io` 中） | 含义 |
|------|-------------------------------|------------|
| **TLD** | `.io` | 顶级域名——你在其*之下*进行注册的后缀。 |
| **二级域名 (SLD)** | `namefi` | 你选择并拥有的唯一名称。 |
| **子域名 (Subdomain)** | `blog` | 你自己创建的可选前缀，用于组织内容。 |

有几个区别需要明确：

- **域名**（或*可注册域名*）通常是 SLD + TLD 的组合——即 `namefi.io`。这才是你实际注册并付费的部分。
- **TLD** 是共享的结尾。你不拥有 `.io` 本身；你拥有的是在它*之下*的一个名称。
- **子域名**是一旦你拥有了域名，就可以免费控制的部分——例如 `mail.namefi.io`、`shop.namefi.io` 等等。

如需深入了解域名的结构，请参阅[什么是域名？](/en/blog/what-is-domain/)以及我们的[域名术语指南](/en/blog/domain-terminology-guide/)。

---

## TLD 的类型

并非所有 TLD 都是相同的。ICANN 和 IANA 将它们划分为几个类别。以下是你常会遇到的主要 **TLD 类型**。

### 1. 通用顶级域名 (gTLDs)

**gTLD** 是经典的、通用的域名扩展名。最初的集合很小且全球公认：

- [`.com`](/en/tld/com/) — *商业 (commercial)*，整个网络的默认选择
- [`.net`](/en/tld/net/) — 最初用于网络基础设施
- [`.org`](/en/tld/org/) — 最初用于组织和非营利机构
- [`.info`](/en/tld/info/) — 信息类网站

这些后缀向任何人开放，并仍然是互联网上最受信任、流动性最高的结尾。

### 2. 国家/地区代码顶级域名 (ccTLDs)

**ccTLD** 是基于 ISO 3166 国家/地区代码列表，与特定国家或地区绑定的双字母 TLD。示例包括 `.us`（美国）、`.uk`（英国）、`.de`（德国）、`.cn`（中国）、[`.ae`](/en/tld/ae/)（阿拉伯联合酋长国）和 [`.ac`](/en/tld/ac/)（阿森松岛）。

有趣的部分在于——许多 ccTLD 的用途已经远远超出了其本国范围，因为这些字母恰好拼成了有用的含义：

- [`.ai`](/en/tld/ai/) 在技术上是安圭拉的 ccTLD，但它已经成为人工智能公司的*首选*后缀。
- [`.io`](/en/tld/io/) 属于英属印度洋领地，却在科技和初创企业品牌中占据主导地位（代表“I/O”即输入/输出）。
- `.co`（哥伦比亚）被广泛用作 `.com` 的简短替代品。

简而言之，这就是 **gTLD 与 ccTLD** 的区别：gTLD 直接受 ICANN 合同管辖并在全球范围内开放，而 ccTLD 则委托给国家/地区主管机构管理，每个机构都有自己的规则（有些要求本地注册身份，有些则不需要）。

### 3. 赞助型顶级域名 (sTLDs)

**赞助型 TLD** 是受限的 gTLD，由制定资格规则的特定社区或组织提供支持。通常，您必须符合资格才能注册。经典的例子有：`.gov`（美国政府）、`.edu`（受认可的美国教育机构）、`.mil`（美国军方）、`.aero`（航空业）和 `.museum`（博物馆）。

### 4. 新通用顶级域名 (New gTLDs)

从 2013 年开始，ICANN 通过**新 gTLD 计划**敞开了大门，将命名空间从几十个后缀扩展到了上千个。这些后缀涵盖了关键词、行业、爱好和品牌：

| 类别 | 示例 |
|----------|----------|
| 科技与网络 | [`.app`](/en/tld/app/)、[`.dev`](/en/tld/dev/)、[`.tech`](/en/tld/tech/)、[`.cloud`](/en/tld/cloud/)、[`.click`](/en/tld/click/) |
| 现代与通用 | [`.xyz`](/en/tld/xyz/)、[`.site`](/en/tld/site/)、[`.online`](/en/tld/online/)、[`.world`](/en/tld/world/)、[`.space`](/en/tld/space/) |
| 商业 | [`.shop`](/en/tld/shop/)、[`.store`](/en/tld/store/)、[`.vip`](/en/tld/vip/) |
| 社区与内容 | [`.blog`](/en/tld/blog/)、[`.club`](/en/tld/club/)、[`.live`](/en/tld/live/)、[`.fun`](/en/tld/fun/) |
| 简短易记 | [`.io`](/en/tld/io/)、[`.top`](/en/tld/top/)、[`.sbs`](/en/tld/sbs/)、[`.now`](/en/tld/now/) |

新 gTLD 给了互联网喘息的空间：当每个好的 `.com` 都被注册后，像 [`.xyz`](/en/tld/xyz/)、[`.site`](/en/tld/site/) 和 [`.app`](/en/tld/app/) 这样的后缀开辟了全新、易记的命名空间。

### 5. 国际化顶级域名 (IDN TLDs)

**IDN TLD** 是使用非拉丁字母表（如阿拉伯语、中文、西里尔文、天城文等）编写的顶级域名。示例包括 `.рф`（俄罗斯）、`.中国`（中国）和 `.السعودية`（沙特阿拉伯）。它们让人们能够端到端地使用自己的语言和书写系统来上网。

### 关于 Web3 后缀的说明

你可能还见过区块链原生的后缀，比如 `.eth` 或 `.crypto`。它们**不是** ICANN TLD——它们存在于传统的 DNS 根区域之外，只能通过特定的钱包或解析器进行解析。Namefi 也会对它们进行分类（参见 [`.eth`](/en/tld/eth/)），但你需要了解它们属于一个不同的类别。我们在[代币化域名与 Web3 域名对比](/en/blog/tokenized-domain-vs-web3-domain/)一文中详细解析了这种区别。

---

## TLD 是如何管理的

每个 TLD 背后都有一个分层的管理系统。以下是各个角色的分工：

- **ICANN** — [互联网名称与数字地址分配机构](/en/glossary/icann/) 是一个非营利组织，负责协调全球命名空间、制定 gTLD 政策以及认证注册商。它成立于 1998 年，是域名世界里最接近“裁判”角色的机构。
- **IANA** — 互联网号码分配局（在 ICANN 旗下运营）负责维护权威的**根区域 (root zone)**：包含所有有效 TLD 及其对应运营注册局的主列表。
- **注册局 (Registries)** — 每个 TLD 均由一个*注册局*运营，该组织负责管理该后缀的中央数据库。例如，**Verisign** 运营 `.com` 和 `.net`，**公共利益注册局 (PIR)** 运营 `.org`。ccTLD 注册局通常是国家机构——例如，[`.ae`](/en/tld/ae/) 由阿联酋的 TDRA 管理。
- **注册商 (Registrars)** — [注册商](/en/glossary/registrar/)是你购买域名的“零售商”。获得 ICANN 认证的注册商（如 Namefi、GoDaddy 和 Namecheap）向公众销售域名，并将注册信息上传提交给注册局。

因此，整个链条如下所示：**ICANN/IANA** 制定规则和根区域 → **注册局**运营每个 TLD → **注册商**向**你**出售域名。当你注册 `yourname.com` 时，你是向注册商购买，注册商将其记录在注册局 (Verisign) 处，而这一切都在 ICANN 的政策框架下进行。

---

## TLD 示例：热门后缀一览

以下是一份快速、便于浏览的常见 **TLD 示例**参考，以及它们最著名的用途：

| TLD | 类型 | 最著名用途 |
|-----|------|----------------|
| [`.com`](/en/tld/com/) | gTLD | 任何企业的默认选择——最受信任，最具价值 |
| [`.org`](/en/tld/org/) | gTLD | 非营利组织、社区、开源项目 |
| [`.net`](/en/tld/net/) | gTLD | 科技、网络、基础设施 |
| [`.io`](/en/tld/io/) | ccTLD（重新定位） | 初创企业、开发者、SaaS |
| [`.ai`](/en/tld/ai/) | ccTLD（重新定位） | 人工智能与科技 |
| [`.app`](/en/tld/app/) | 新 gTLD | 移动端和 Web 应用（仅限 HTTPS） |
| [`.dev`](/en/tld/dev/) | 新 gTLD | 开发者和工程团队 |
| [`.tech`](/en/tld/tech/) | 新 gTLD | 科技品牌和产品 |
| [`.xyz`](/en/tld/xyz/) | 新 gTLD | 现代、灵活、跨代沟的域名 |
| [`.shop`](/en/tld/shop/) | 新 gTLD | 电子商务和零售 |
| [`.vip`](/en/tld/vip/) | 新 gTLD | 高端、专属、会员制品牌 |
| [`.sbs`](/en/tld/sbs/) | 新 gTLD | “Side-by-side（肩并肩）”——经济实惠、富有表现力的名称 |

想要深入了解某个特定的 TLD 吗？请浏览完整的 [TLD 指南](/en/tld/) 库，包括 [`.cloud`](/en/tld/cloud/)、[`.online`](/en/tld/online/)、[`.store`](/en/tld/store/)、[`.site`](/en/tld/site/)、[`.club`](/en/tld/club/)、[`.world`](/en/tld/world/) 以及其他数十种后缀。

---

## 如何选择 TLD

面对一千多种选择，挑选合适的结尾归根结底要考虑几个实际问题：

1. **`.com` 是否可用？**它仍然是信任度和转售价值的黄金标准。如果与你名称完全匹配的 `.com` 未被注册且价格合理，它通常是最安全的默认选择。查看[为什么 `.com` 依然是黄金标准](/en/tld/com/)。
2. **TLD 是否符合你的目标？** 初创企业适合 [`.io`](/en/tld/io/) 或 [`.ai`](/en/tld/ai/)；商店适合 [`.shop`](/en/tld/shop/) 或 [`.store`](/en/tld/store/)；开发者工具适合 [`.dev`](/en/tld/dev/)。正确的后缀可以*描述*你所从事的业务。
3. **你是否针对特定国家/地区？** 像 [`.ae`](/en/tld/ae/) 这样的 ccTLD 象征着本土业务，有助于提升本地搜索可见度——但在注册前需核实资格规则。
4. **名字是否好记且利于品牌建设？** 在现代 TLD（如 [`.xyz`](/en/tld/xyz/)、[`.app`](/en/tld/app/)）上注册一个简短的 SLD，通常比一个冗长且蹩脚的 `.com` 更好。
5. **续费成本是多少？** 有些 TLD 首年促销价很低，但续费价格较高。务必查看长期价格，而不仅仅是初始的优惠价。
6. **有任何限制吗？** 赞助型 TLD（如 `.gov`、`.edu`）和一些 ccTLD 具有资格要求。像 [`.app`](/en/tld/app/) 和 [`.dev`](/en/tld/dev/) 这样的新 gTLD 则默认强制开启 HTTPS。

一个好的经验法则是：**选择受众会信任并记住的 TLD**，然后确保它的价格和规则符合你的计划。

---

## TLD 与代币化

对于下一代域名而言，有趣的地方来了。你的 TLD 不仅塑造你的品牌——它还影响着你的域名能否被带到**链上 (on-chain)**。

[代币化域名](/en/blog/what-are-tokenized-domains/)是一个真实的、受 ICANN 认可的域名，其所有权*同时*作为代币（通常是 [NFT](/en/glossary/nft/)）形式存在于你的钱包中。DNS 层面的工作原理与以前完全一致；你只是在它之上获得了第二层可编程的所有权层。

但并非每个 TLD 都已为此做好了同等准备。一些注册局早已开始支持链上所有权层级；而其他一些则毫无动作。因此，如果你曾有以下打算，你选择的 TLD 就显得尤为重要：

- 直接将域名存放在自己的钱包中
- 在几秒钟内进行链上转移（DNS 记录将随之自动更新）
- 将其挂载到 NFT 市场上，或在 [DeFi](/en/glossary/defi/) 中作为抵押品

**Namefi** 是第一个在以太坊主网上将真实 ICANN 域名代币化的平台，也是第一个在 Base 网络上实现这一功能的平台，它支持上述许多 TLD，包括 [`.com`](/en/tld/com/)、[`.xyz`](/en/tld/xyz/)、[`.io`](/en/tld/io/) 等等。在一个产品中，你既保留了真实的、浏览器可解析的域名，*同时*又获得了钱包原生的所有权。

> 很好奇这两层是如何结合在一起的吗？请阅读[什么是代币化域名？](/en/blog/what-are-tokenized-domains/)，或访问 [namefi.io](https://namefi.io) 注册并代币化你的域名。

---

## 常见问题 (FAQ)

### 什么是 TLD？
TLD（顶级域名）是域名中位于最后一个点之后的部分——例如 `.com`、`.org` 或 `.io`。它是域名系统层次结构中的最高层级，通常被称为域名扩展名或后缀。

### TLD 是什么意思？
TLD 是 **Top-Level Domain（顶级域名）**的缩写。它指的是位于网址末尾的后缀，位于互联网命名层次结构的顶端。

### TLD 和域名有什么区别？
*域名* 是完整的可注册名称，通常是二级域名加上 TLD 的组合（例如 `namefi.io`）。*TLD* 只是共享的结尾（`.io`）。你注册并拥有的是域名；你是在某个 TLD *之下*注册名称，但不拥有该 TLD 本身。

### TLD 的主要类型有哪些？
主要类型包括通用顶级域名 (gTLD) 如 `.com`，国家/地区代码顶级域名 (ccTLD) 如 `.uk` 和 `.ai`，赞助型顶级域名 (sTLD) 如 `.edu` 和 `.gov`，新 gTLD 如 `.xyz` 和 `.app`，以及使用非拉丁字母表书写的国际化顶级域名 (IDN)。

### gTLD 和 ccTLD 有什么区别？
gTLD 是一种通用的、全球可用的结尾，直接受 ICANN 合同的管辖（例如 `.com`、`.org`）。ccTLD 是一种绑定特定国家或地区并委托给国家级主管机构管理的双字母结尾（例如 `.uk`、`.de`、`.ai`），每个机构都有自己的注册规则。

### 有哪些 TLD 的例子？
常见的例子包括 `.com`、`.org`、`.net`、`.io`、`.ai`、`.app`、`.dev`、`.tech`、`.xyz`、`.shop` 和 `.vip`。如今可用的 TLD 远超 1,000 种。

### 谁控制 TLD？
ICANN 负责协调全球命名空间并认证注册商，IANA 维护所有有效 TLD 的权威根区域，注册局负责运营各自的 TLD（例如 Verisign 运营 `.com`），而注册商则向公众出售域名。

### 我应该选择哪个 TLD？
如果与你名称完全匹配的 `.com` 未被注册且价格合理，从信任度和转售价值考虑，它通常是最安全的选择。否则，请选择符合你目标的 TLD——初创企业选 `.io` 或 `.ai`，商店选 `.shop`，开发者选 `.dev`——并在注册前查看续费价格和相关资格规则。

---

## 总结

- **TLD（顶级域名）** 是域名中位于最后一个点之后的部分——如 `.com`、`.org`、`.io` 等。它也被称为域名扩展名或后缀。
- 从右向左阅读，一个域名可以分解为 **TLD → 二级域名 → 子域名**。
- 主要的 **TLD 类型** 包括 gTLD、ccTLD、赞助型 TLD、新 gTLD 和国际化顶级域名 (IDN)。
- TLD 由顶层的 **ICANN** 和 **IANA**、运营各后缀的**注册局**，以及向你出售域名的**[注册商](/en/glossary/registrar/)**共同管理。
- 选择 TLD 关乎信任、契合度、成本，并且越来越重要的一点是——它是否能作为[代币化域名](/en/blog/what-are-tokenized-domains/)被带到**链上**。

准备好注册或代币化你心仪的 TLD 域名了吗？访问 [namefi.io](https://namefi.io) 即可开始。