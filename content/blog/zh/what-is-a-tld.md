---
title: 什么是顶级域名（TLD）？完整指南
date: '2026-06-10'
language: zh
tags: ['guide']
authors: ['namefiteam']
draft: false
description: TLD 是域名中最后一个点之后的部分，例如 .com 或 .io。了解什么是 TLD、各种类型（gTLD、ccTLD、赞助型、新通用顶级域、IDN），以及如何选择合适的顶级域名。
keywords: ['tld', 'tld meaning', 'what is a tld', 'what is a top level domain', 'top-level domain', 'tld def', 'tld definition', 'que es un tld', "qu'est-ce qu'un tld", 'types of tld', 'gtld vs cctld', 'tld examples', 'what is a domain extension', 'domain extension', 'gTLD', 'ccTLD', 'sponsored TLD', 'new gTLD', 'IDN TLD', 'ICANN', 'IANA', 'domain registry', 'domain registrar', 'choosing a TLD', 'popular TLDs', 'namefi']
---

## 什么是 TLD？

**[TLD](/zh/glossary/tld/)（顶级域名）** 是域名中**最后一个点之后**的部分。在 `namefi.io` 中，TLD 是 `.io`；在 `google.com` 中，TLD 是 `.com`；在 `wikipedia.org` 中，TLD 是 `.org`。

一句话即可概括 **TLD 的定义**：它是[域名](/zh/blog/what-is-domain/)中最右边的标签。人们也将其称为**域名扩展名**或**域名后缀**，但技术上正确的术语是*顶级域名*。它位于互联网命名层级的最顶端——这也正是其名称的由来。

> **TLD 含义速览：** *Top-Level Domain（顶级域名）* — 网址末尾的后缀（`.com`、`.org`、`.io`、`.ai`、`.xyz`），标识了[域名系统（DNS）](/zh/glossary/dns/)的最高层级。

如果你曾搜索过 **"que es un TLD"**（西班牙语）或 **"qu'est-ce qu'un TLD"**（法语），任何语言的答案都是一样的：TLD 是域名的结尾部分，由 [ICANN](/zh/glossary/icann/) 监管下的全球注册机构体系负责管理。

---

## TLD、域名与子域名的区别

一个完整的域名由多个部分构成，**从右往左**依次解读。理解 TLD 所处的位置，可以消除大多数困惑：

```
blog . namefi . io
 │       │       │
 │       │       └── TLD（顶级域名）
 │       └────────── SLD（二级域名）
 └────────────────── 子域名
```

| 部分 | 示例（在 `blog.namefi.io` 中） | 说明 |
|------|-------------------------------|------|
| **TLD** | `.io` | 顶级域名——你在其下注册的后缀。 |
| **二级域名（SLD）** | `namefi` | 你选择并拥有的独特名称。 |
| **子域名** | `blog` | 你自行创建的可选前缀，用于组织内容。 |

以下几点区别值得明确：

- **域名**（或*可注册域名*）通常是 SLD 与 TLD 的组合——例如 `namefi.io`。这才是你真正注册并付费的对象。
- **TLD** 是共享的结尾。你并不拥有 `.io` 本身，而是拥有在其*下面*注册的名称。
- **子域名**是你在拥有域名之后可以免费控制的部分——例如 `mail.namefi.io`、`shop.namefi.io` 等。

关于域名结构的详细介绍，请参阅[什么是域名？](/zh/blog/what-is-domain/)以及我们的[域名术语指南](/zh/blog/domain-terminology-guide/)。

---

## TLD 的类型

并非所有 TLD 都相同。ICANN 和 [IANA](/zh/glossary/iana/) 将其划分为几个类别。以下是你会遇到的主要 **TLD 类型**。

### 1. 通用顶级域名（gTLD）

**gTLD** 是经典的通用扩展名。最初的集合规模较小，但在全球范围内广为人知：

- [`.com`](/zh/tld/com/) — *commercial（商业）*，整个互联网的默认选择
- [`.net`](/zh/tld/net/) — 最初用于网络基础设施
- [`.org`](/zh/tld/org/) — 最初用于组织和非营利机构
- [`.info`](/zh/tld/info/) — 信息类网站

这些域名对任何人开放，至今仍是互联网上最受信任、流动性最强的后缀。

### 2. 国家代码顶级域名（ccTLD）

**[ccTLD](/zh/glossary/cctld/)** 是与某个国家或地区绑定的两字母顶级域名，基于 ISO 3166 国家代码列表。示例包括 `.us`（美国）、`.uk`（英国）、`.de`（德国）、`.cn`（中国）、[`.ae`](/zh/tld/ae/)（阿联酋）和 [`.ac`](/zh/tld/ac/)（阿森松岛）。

有趣的是，许多 ccTLD 因为字母拼写上的意义而被广泛应用于本国以外：

- [`.ai`](/zh/tld/ai/) 在技术上是安圭拉的 ccTLD，但已成为人工智能公司的*首选*扩展名。
- [`.io`](/zh/tld/io/) 属于英属印度洋领地，却在科技和初创公司品牌中占据主导地位（对应"I/O"）。
- `.co`（哥伦比亚）被广泛用作 `.com` 的简短替代。

这就是 **[gTLD](/zh/glossary/gtld/) 与 ccTLD** 区别的核心：gTLD 直接在 ICANN 合同框架下管理，向全球开放；而 ccTLD 则委托给各国主管机构，每个机构有其自己的规则（有些要求本地注册主体，有些则不要求）。

### 3. 赞助型顶级域名（sTLD）

**赞助型 TLD** 是由特定社区或组织支持的受限通用顶级域名，该组织负责制定注册资格规则。通常需要满足一定条件才能注册。经典示例包括：`.gov`（美国政府）、`.edu`（美国认证教育机构）、`.mil`（美国军队）、`.aero`（航空业）和 `.museum`。

### 4. 新通用顶级域名（新 gTLD）

从 2013 年开始，ICANN 通过**[新 gTLD](/zh/glossary/new-gtld/) 计划**大幅扩展了命名空间，将后缀数量从几十个增加到一千多个。这些新后缀涵盖关键词、行业、爱好和品牌：

| 类别 | 示例 |
|------|------|
| 科技与互联网 | [`.app`](/zh/tld/app/)、[`.dev`](/zh/tld/dev/)、[`.tech`](/zh/tld/tech/)、[`.cloud`](/zh/tld/cloud/)、[`.click`](/zh/tld/click/) |
| 现代与通用 | [`.xyz`](/zh/tld/xyz/)、[`.site`](/zh/tld/site/)、[`.online`](/zh/tld/online/)、[`.world`](/zh/tld/world/)、[`.space`](/zh/tld/space/) |
| 商业 | [`.shop`](/zh/tld/shop/)、[`.store`](/zh/tld/store/)、[`.vip`](/zh/tld/vip/) |
| 社区与内容 | [`.blog`](/zh/tld/blog/)、[`.club`](/zh/tld/club/)、[`.live`](/zh/tld/live/)、[`.fun`](/zh/tld/fun/) |
| 简短易记 | [`.io`](/zh/tld/io/)、[`.top`](/zh/tld/top/)、[`.sbs`](/zh/tld/sbs/)、[`.now`](/zh/tld/now/) |

新 gTLD 为互联网提供了更大的发展空间：当所有优质 `.com` 都被注册时，[`.xyz`](/zh/tld/xyz/)、[`.site`](/zh/tld/site/) 和 [`.app`](/zh/tld/app/) 等后缀开辟了全新的、令人印象深刻的命名空间。

### 5. 国际化顶级域名（IDN TLD）

**IDN TLD** 是以非拉丁文字书写的顶级域名，包括阿拉伯文、中文、西里尔文、天城文等。示例包括 `.рф`（俄罗斯）、`.中国`（中国）和 `.السعودية`（沙特阿拉伯）。它们让人们能够以自己的语言和文字系统端到端地使用互联网。

### 关于 Web3 后缀的说明

你可能也见过[区块链](/zh/glossary/blockchain/)原生后缀，如 `.eth` 或 `.crypto`。这些*不是* ICANN TLD——它们存在于传统 DNS 根之外，只能通过特殊钱包或解析器访问。Namefi 同样收录了这些后缀（参见 [`.eth`](/zh/tld/eth/)），但值得注意的是，它们属于不同的类别。我们在[代币化域名与 Web3 域名](/zh/blog/tokenized-domain-vs-web3-domain/)中详细阐述了这一区别。

---

## TLD 的治理体系

每个 TLD 背后都有一套分层的治理体系。以下是各方的职责：

- **ICANN** — [互联网名称与数字地址分配机构](/zh/glossary/icann/)是协调全球命名空间、制定 gTLD 政策并认证注册商的非营利组织。成立于 1998 年，是域名领域最接近"裁判"角色的机构。
- **IANA** — 互联网号码分配机构（由 ICANN 管理）维护着权威的**根区**：包含所有有效 TLD 及其对应注册机构的主列表。
- **[注册局](/zh/glossary/registry/)（Registries）** — 每个 TLD 由一个*注册局*运营，该组织负责维护该后缀的中央数据库。例如，**Verisign** 运营 `.com` 和 `.net`，**公共利益注册机构（PIR）** 运营 `.org`。ccTLD 注册局通常是国家机构——例如，[`.ae`](/zh/tld/ae/) 由阿联酋的 TDRA 管理。
- **注册商（Registrars）** — [注册商](/zh/glossary/registrar/)是你购买域名的零售商。经 ICANN 认证的注册商（如 Namefi、GoDaddy 和 Namecheap）向公众销售域名，并将注册信息提交给注册局。

整个链条如下：**ICANN/IANA** 制定规则并维护根区 → **注册局**运营各个 TLD → **注册商**向**你**销售域名。当你注册 `yourname.com` 时，你从注册商购买，注册商将其记录到注册局（Verisign），整个过程均遵循 ICANN 政策。

---

## TLD 示例：常见后缀速览

以下是常见 **TLD 示例**及其最知名用途的快速参考：

| TLD | 类型 | 最知名的用途 |
|-----|------|-------------|
| [`.com`](/zh/tld/com/) | gTLD | 任何企业的默认选择——最受信任、最具价值 |
| [`.org`](/zh/tld/org/) | gTLD | 非营利组织、社区、开源项目 |
| [`.net`](/zh/tld/net/) | gTLD | 科技、网络、基础设施 |
| [`.io`](/zh/tld/io/) | ccTLD（重新定位） | 初创公司、开发者、SaaS |
| [`.ai`](/zh/tld/ai/) | ccTLD（重新定位） | 人工智能与科技 |
| [`.app`](/zh/tld/app/) | 新 gTLD | 移动端和网页应用（强制 HTTPS） |
| [`.dev`](/zh/tld/dev/) | 新 gTLD | 开发者和工程团队 |
| [`.tech`](/zh/tld/tech/) | 新 gTLD | 科技品牌和产品 |
| [`.xyz`](/zh/tld/xyz/) | 新 gTLD | 现代、灵活、跨代际 |
| [`.shop`](/zh/tld/shop/) | 新 gTLD | 电商和零售 |
| [`.vip`](/zh/tld/vip/) | 新 gTLD | 高端、专属、会员制品牌 |
| [`.sbs`](/zh/tld/sbs/) | 新 gTLD | "并肩同行"——经济实惠、富有表现力的名称 |

想深入了解某个特定后缀？浏览完整的 [TLD 指南库](/en/tld/)，包括 [`.cloud`](/zh/tld/cloud/)、[`.online`](/zh/tld/online/)、[`.store`](/zh/tld/store/)、[`.site`](/zh/tld/site/)、[`.club`](/zh/tld/club/)、[`.world`](/zh/tld/world/) 等数十个更多选项。

---

## 如何选择 TLD

面对一千多种选择，挑选合适的后缀归结为几个实际问题：

1. **`.com` 是否可用？** 它仍然是信任度和转售价值的黄金标准。如果你想要的 `.com` 空闲且价格合理，通常是最稳妥的默认选择。参阅[为何 `.com` 仍是黄金标准](/zh/tld/com/)。
2. **TLD 与你的用途是否匹配？** 初创公司适合 [`.io`](/zh/tld/io/) 或 [`.ai`](/zh/tld/ai/)；电商店铺适合 [`.shop`](/zh/tld/shop/) 或 [`.store`](/zh/tld/store/)；开发者工具适合 [`.dev`](/zh/tld/dev/)。合适的后缀能够*描述*你所做的事情。
3. **你是否针对特定国家或地区？** 像 [`.ae`](/zh/tld/ae/) 这样的 ccTLD 能彰显本地存在感，有助于提升本地搜索可见性——但请先确认注册资格要求。
4. **域名是否易记且具有品牌价值？** 在现代 TLD（[`.xyz`](/zh/tld/xyz/)、[`.app`](/zh/tld/app/)）下注册一个简短的二级域名，往往胜过一个冗长别扭的 `.com`。
5. **续费费用如何？** 有些 TLD 首年优惠价格低廉，但续费价格较高。务必确认长期价格，而非只看促销价。
6. **是否有限制条件？** 赞助型 TLD（`.gov`、`.edu`）和部分 ccTLD 有注册资格要求。新 gTLD 如 [`.app`](/zh/tld/app/) 和 [`.dev`](/zh/tld/dev/) 默认强制使用 HTTPS。

一个实用原则：**选择你的目标受众信任且容易记住的 TLD**，然后确认价格和规则符合你的规划。

---

## TLD 与代币化

这里是下一个域名时代最令人兴奋的部分。你的 TLD 不仅塑造你的品牌形象，还影响你的域名能否被**上链**。

[代币化域名](/zh/blog/what-are-tokenized-domains/)是一个真实的、经 ICANN 认可的域名，其所有权*同时*以代币（通常是[NFT](/zh/glossary/nft/)）的形式存储在你的[钱包](/zh/glossary/wallet/)中。DNS 层的运行方式与以前完全相同；你只是在其之上获得了第二层可编程的所有权。

但并非每个 TLD 都为此做好了准备。部分注册局已提前布局，支持[链上](/zh/glossary/on-chain/)所有权层；其他的则尚未行动。这正是为什么如果你希望：

- 将域名直接持有在自己的钱包中
- 在数秒内完成链上转移（DNS 记录同步跟随）
- 在 NFT 市场上挂单或将其用作 [DeFi](/zh/glossary/defi/) 中的[抵押品](/zh/glossary/collateral/)

……那么你选择的 TLD 就至关重要。

**Namefi** 是首个在[以太坊](/zh/glossary/ethereum/)主网上[代币化](/zh/glossary/tokenize/)真实 ICANN 域名的平台——也是首个在 Base 上实现这一功能的平台——覆盖上述众多 TLD，包括 [`.com`](/zh/tld/com/)、[`.xyz`](/zh/tld/xyz/)、[`.io`](/zh/tld/io/) 等。你可以在一个产品中同时拥有一个真实的、浏览器可解析的域名*和*钱包原生所有权。

> 想了解两个层次如何配合？阅读[什么是代币化域名？](/zh/blog/what-are-tokenized-domains/)，或访问 [namefi.io](https://namefi.io) 注册或代币化你的域名。

---

## 常见问题

### 什么是 TLD？
TLD（顶级域名）是域名中最后一个点之后的部分——例如 `.com`、`.org` 或 `.io`。它是域名系统层级中的最高层，也常被称为域名扩展名或后缀。

### TLD 代表什么？
TLD 代表 **Top-Level Domain（顶级域名）**。它指的是位于网址末尾、处于互联网命名层级最顶端的后缀。

### TLD 和域名有什么区别？
*域名*是完整的可注册名称，通常是二级域名加上 TLD 的组合（例如 `namefi.io`）。*TLD* 只是共享的结尾（`.io`）。你注册并拥有域名；你在 TLD *下*注册名称，但并不拥有 TLD 本身。

### TLD 的主要类型有哪些？
主要类型包括：通用顶级域名（gTLD），如 `.com`；国家代码顶级域名（ccTLD），如 `.uk` 和 `.ai`；赞助型顶级域名（sTLD），如 `.edu` 和 `.gov`；新通用顶级域名，如 `.xyz` 和 `.app`；以及以非拉丁文字书写的国际化顶级域名（IDN）。

### gTLD 和 ccTLD 有什么区别？
gTLD 是通用的、全球可用的后缀，直接受 ICANN 合同框架管理（例如 `.com`、`.org`）。ccTLD 是与某个国家或地区绑定的两字母后缀，委托给国家主管机构管理（例如 `.uk`、`.de`、`.ai`），各有其自己的注册规则。

### TLD 有哪些常见示例？
常见示例包括 `.com`、`.org`、`.net`、`.io`、`.ai`、`.app`、`.dev`、`.tech`、`.xyz`、`.shop` 和 `.vip`。目前可用的 TLD 已超过 1,000 个。

### 谁控制 TLD？
ICANN 协调全球命名空间并认证注册商；IANA 维护所有有效 TLD 的权威根区；注册局运营各个 TLD（例如 Verisign 运营 `.com`）；注册商向公众销售域名。

### 我应该选择哪个 TLD？
如果你想要的 `.com` 可用且价格合理，通常是在信任度和转售价值方面最稳妥的选择。否则，选择一个与你用途匹配的 TLD——初创公司选 `.io` 或 `.ai`，电商店铺选 `.shop`，开发者选 `.dev`——并在注册前确认续费价格和任何资格要求。

---

## 总结

- **TLD（顶级域名）** 是域名中最后一个点之后的部分——`.com`、`.org`、`.io` 等，也称为域名扩展名。
- 从右往左阅读，域名依次拆分为 **TLD → 二级域名 → 子域名**。
- TLD 的主要**类型**包括 gTLD、ccTLD、赞助型 TLD、新 gTLD 以及国际化（IDN）TLD。
- TLD 由顶层的 **ICANN** 和 **IANA**、运营各个后缀的**注册局**，以及向你销售域名的**[注册商](/zh/glossary/registrar/)** 共同治理。
- 选择 TLD 需要考量信任度、适配性、成本，以及——越来越重要的——能否作为[代币化域名](/zh/blog/what-are-tokenized-domains/)被**上链**。

准备好在你喜欢的 TLD 下注册或代币化域名了吗？访问 [namefi.io](https://namefi.io) 开始体验。
