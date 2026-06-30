---
title: TLD
date: '2026-05-22'
language: zh-CN
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: 顶级域名（TLD）是域名中最右侧的标签，如 .com、.org 或 .de，经由 IANA 根区在 ICANN 监管下委派。
keywords: ['TLD', '顶级域名', 'gTLD', 'ccTLD', '新 gTLD', 'DNS', 'IANA', 'ICANN', '根区', '域名注册局']
also_known_as: ['顶级域名']
level: 2
sources:
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains
  - https://www.rfc-editor.org/rfc/rfc1591
  - https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains
relatedArticles:
  - /zh-CN/blog/what-is-a-tld/
  - /zh-CN/blog/top-tlds-to-secure-for-your-startup/
  - /zh-CN/blog/what-are-tokenized-domains/
  - /zh-CN/blog/how-tld-affects-domain-value/
  - /zh-CN/blog/top-tlds-to-secure-for-your-business/
relatedTopics:
  - /zh-CN/topics/choosing-a-tld/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/best-tlds-by-industry/
  - /zh-CN/series/domain-flipping-skills/
relatedGlossary:
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/web3/
---

**TLD**（*top-level domain*，顶级域名），也称**顶级域名**，是完全限定域名中最右侧的标签——即最后一个点之后的部分。在 `www.example.com` 中，TLD 是 `.com`；在 `bbc.co.uk` 中，TLD 是 `.uk`。TLD 处于 [DNS](/zh-CN/glossary/dns/) 层次结构的顶端，是所有其他域名的基础。

## TLD 在域名中的位置

[DNS](/zh-CN/glossary/dns/) 是一种分层树状命名系统。从右向左阅读一个域名，便能看清这种层级关系：

1. **根（`.`）** — 最右端那个不可见的点。[根区](/zh-CN/glossary/root-zone/)是权威的起点：由 [IANA](/zh-CN/glossary/iana/) 维护的一组小型服务器，知道每个 TLD 的权威域名服务器在哪里。
2. **TLD** — 从右数第一个可见标签（`.com`、`.org`、`.de`）。每个 TLD 都有自己的权威域名服务器，由[注册局](/zh-CN/glossary/registry/)运营商运行。
3. **[二级域名](/zh-CN/glossary/second-level-domain/)** — 紧靠 TLD 左侧的标签（如 `example.com` 中的 `example`）。这是注册人向注册商购买的部分。
4. **子域名** — 再向左的标签（`www`、`mail`、`blog`），由控制二级域名的人管理。

当解析器查找 `www.example.com` 时，它首先询问根服务器 `.com` 在哪里，再询问 `.com` 注册局域名服务器 `example.com` 在哪里，最后询问 `example.com` 的域名服务器 `www` 记录在哪里。这条委派链确保没有任何单一服务器需要知道所有域名。

## TLD 的分类

IANA 将 TLD 划分为以下几类：

| 类别 | 示例 | 说明 |
|---|---|---|
| **[gTLD](/zh-CN/glossary/gtld/)**（通用） | `.com`、`.net`、`.org`、`.info` | 最初不受限制或范围宽泛；使用最广泛的类别 |
| **[ccTLD](/zh-CN/glossary/cctld/)**（国家代码） | `.de`、`.uk`、`.jp`、`.us` | 依据 ISO 3166-1 分配的两字母代码；通常由国家主管机构管理 |
| **sTLD**（赞助型） | `.gov`、`.edu`、`.mil`、`.museum` | gTLD 的一个子类，有赞助组织限制注册资格 |
| **[新 gTLD](/zh-CN/glossary/new-gtld/)** | `.app`、`.blog`、`.shop`、`.xyz` | 自 2013 年起通过 ICANN 扩展计划引入 |
| **基础设施** | `.arpa` | 为 DNS 技术基础设施保留；不对外开放注册 |
| **测试/保留** | `.example`、`.localhost`、`.invalid` | 由 RFC 2606 定义；从未在公共根中委派 |

`.arpa` 是目前唯一的基础设施 TLD，承载反向查找区（`in-addr.arpa` 用于 IPv4，`ip6.arpa` 用于 IPv6），将 IP 地址映射回主机名。

国家代码 TLD 最初限于该国境内的注册人，但许多已放开为全球注册——`.io`（英属印度洋领地）和 `.co`（哥伦比亚）就是被国际广泛用作通用替代的典型案例。

## TLD 的创建与委派

所有已委派 TLD 的权威列表维护在 **IANA 根区数据库**（[iana.org/domains/root/db](https://www.iana.org/domains/root/db)），其中将每个 TLD 映射到其权威域名服务器组及指定[注册局](/zh-CN/glossary/registry/)运营商。

**ccTLD 委派**遵循 [RFC 1591](https://www.rfc-editor.org/rfc/rfc1591)（Postel，1994 年）规定的政策：两字母代码源自 ISO 3166-1，每个代码委派给一位受托人——通常是政府机构或国家公认机构——预期其服务于该国或地区的公共利益。当 ccTLD 的治理权易手时，[IANA](/zh-CN/glossary/iana/) 负责审查重新委派申请。

**新 gTLD** 通过 [ICANN](/zh-CN/glossary/icann/) 申请轮次创建。第一次大规模扩展始于 2012 年，ICANN 开放了三个或更多字符任意字符串作为通用 TLD 的申请。申请人需缴纳基础费用，接受技术能力和财务稳健性评估，通过异议程序（涵盖社群、道德、知识产权和字符串混淆等方面），并与 ICANN 签署注册局协议（[ICANN 新 gTLD 计划](https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains)）。该轮次共委派了逾 1,200 个新 gTLD。第二轮申请于 2026 年开放，进一步扩展了命名空间。

委派完成后，TLD 的[注册局](/zh-CN/glossary/registry/)运营商负责维护其下所有二级域名注册的权威数据库、运行区域域名服务器，并制定注册商在向注册人销售域名时须遵守的政策（定价、资格要求、长度规则）。

## 典型 TLD 示例

| TLD | 运营商 | 说明 |
|---|---|---|
| `.com` | Verisign | 注册量最大的 TLD；最初面向商业实体 |
| `.net` | Verisign | 最初面向网络基础设施提供商；现已不受限制 |
| `.org` | Public Interest Registry | 最初面向非营利组织；现基本不受限制 |
| `.gov` | GSA（美国） | 限美国联邦、州和地方政府实体注册 |
| `.edu` | Educause | 限美国经认证的高等院校注册 |
| `.uk` | Nominet | 英国 ccTLD；常见注册使用二级标签如 `.co.uk` |
| `.de` | DENIC | 德国 ccTLD；按注册量计最大的 ccTLD 之一 |
| `.io` | ICANN / 注册局移交待定 | 英属印度洋领地代码；被科技公司广泛采用 |
| `.app` | Google Registry | 新 gTLD；注册局政策要求强制使用 HTTPS |
| `.xyz` | XYZ.com LLC | 新 gTLD；因低价策略注册量庞大 |

## TLD、价值与 SEO

搜索引擎以两种截然不同的方式对待 TLD：

**地理定向：** [ccTLD](/zh-CN/glossary/cctld/) 传递地理信号。Google Search Central 指出，`.de` 网站通常被解读为面向德语用户，Google Search Console 允许对通用 TLD 进行明确的地理定向，但会自动应用 ccTLD 信号。若企业希望以单一域名服务全球受众，选择通用 TLD 可避免无意中的地理限制。

**排名：** 在大多数情况下，TLD 本身并非排名因素。Google 已声明，[新 gTLD 与其他 TLD 一视同仁](https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains)，`.com` 并不天然优于 `.app` 或 `.xyz`。决定排名的是域名的整体权威性和相关性，而非后缀本身。部分带有关键词属性的老 TLD（如 `.jobs` 或 `.travel`）携带隐含的语境信号，但与内容质量和外链情况相比，这些信号微乎其微。

**品牌认知与记忆度：** 域名投资者和营销人员观察到，知名度高的短 TLD——尤其是 `.com`——在终端用户中具有强烈的认知度，可影响搜索结果的点击率、直接导航访问和信任度。这是市场行为动态，而非算法因素。

**溢价与二手市场定价：** TLD 的感知价值会影响其下[二级域名](/zh-CN/glossary/second-level-domain/)的二手市场价格。`.com` 域名的平均二手价格高于同等名称在新后缀下的价格，这反映的是消费者熟悉度，而非任何技术优势。

## TLD 与代币化域名

多个基于区块链的命名系统在 IANA 根区之外运行，实际上引入了只能在兼容解析器或浏览器扩展中解析的替代 TLD。典型案例包括 `.eth`（以太坊域名服务）、`.crypto` 和 `.nft`。这些 TLD 未经 [IANA](/zh-CN/glossary/iana/) 委派，默认情况下无法在全球 DNS 中解析，但桥接服务和网关服务可提供部分互操作性。

在 IANA 管理的命名空间内，对[二级域名](/zh-CN/glossary/second-level-domain/)进行代币化（即将 `example.com` 等名称的所有权表示为区块链代币）是一个独立于 TLD 本身的概念；无论其下个别名称的所有权以何种方式记录，TLD 本身仍处于相同的注册局治理之下。
