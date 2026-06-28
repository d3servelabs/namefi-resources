---
title: DNS
date: '2025-06-30'
language: zh
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: 将人类可读域名转换为计算机用于互联网路由的 IP 地址的分层命名系统。
keywords: ['DNS', '域名系统', '名称解析', 'DNS 查询', 'DNS 记录', '名称服务器', '递归解析器', 'DNSSEC', '互联网基础设施']
also_known_as: ['域名系统']
level: 2
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.iana.org/domains/root
  - https://www.cloudflare.com/learning/dns/what-is-dns/
  - https://www.icann.org/resources/pages/what-2012-02-25-en
relatedArticles:
  - /zh/blog/what-are-tokenized-domains/
  - /zh/blog/the-myetherwallet-bgp-dns-attack/
  - /zh/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /zh/blog/the-sea-turtle-dns-espionage/
  - /zh/blog/the-dnspionage-campaign/
relatedTopics:
  - /zh/topics/domain-security/
  - /zh/topics/domain-tokenization/
relatedSeries:
  - /zh/series/domain-apocalypse/
  - /zh/series/name-change-game-change/
relatedGlossary:
  - /zh/glossary/registrar/
  - /zh/glossary/tld/
  - /zh/glossary/icann/
  - /zh/glossary/registry/
  - /zh/glossary/web3/
---

**DNS**（即*域名系统*，Domain Name System，又称*域名系统*）是互联网的分布式、分层命名系统，负责将人类可读的域名——如 `example.com`——转换为网络设备用于在互联网上路由数据包的 [IP 地址](/zh/glossary/ip-address/)。没有 DNS，每位用户都需要记住所有想访问网站的数字地址。DNS 在 [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034) 和 [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035)（由 IETF 于 1987 年发布，至今仍是基础性标准）中定义，是互联网的核心协议之一。

## DNS 的作用

DNS 执行**名称解析**：给定一个域名，它返回与该名称关联的资源记录——最常见的是一个 [IP 地址](/zh/glossary/ip-address/)，以便浏览器或应用程序知道将连接请求发往何处。该系统还用于路由电子邮件（MX 记录）、验证域名所有权（TXT 记录），以及将某一区域的权威委托给特定服务器集合（NS 记录）。

由于 DNS 的读取频率远高于更新频率，该协议针对分布在全球数百万台服务器上的快速缓存读取进行了优化，而非追求即时一致性。

## DNS 查询的工作原理

当你在浏览器中输入 `example.com` 时，一个多步骤的解析过程随即开始：

1. **本地缓存检查。** 操作系统首先检查自己的 DNS 缓存。如果存储了最近且仍然有效的答案，查询立即结束。

2. **递归解析器。** 如果没有缓存答案，查询将转发给 [DNS 解析器](/zh/glossary/dns-resolver/)——由你的 ISP、某家公司（如 Cloudflare 的 `1.1.1.1` 或谷歌的 `8.8.8.8`）或你所在机构运营的服务器。该解析器代替你完成查找工作；这种操作模式称为**递归解析**。

3. **根名称服务器。** 如果解析器没有缓存答案，它将联系 13 个逻辑[根区](/zh/glossary/root-zone/)名称服务器集群之一（以字母 `a` 至 `m` 标记）。根服务器不知道最终答案，但会返回一个转介，指向负责相关顶级域（TLD，如 `.com` 或 `.org`）的[名称服务器](/zh/glossary/nameserver/)。[IANA](https://www.iana.org/domains/root) 发布并维护根区数据库。

4. **TLD 名称服务器。** 解析器查询 TLD 名称服务器，后者返回一个转介，指向特定域名（`example.com`）的**权威名称服务器**。

5. **权威名称服务器。** 解析器查询域名的权威[名称服务器](/zh/glossary/nameserver/)，后者保存着实际的 DNS 记录。权威服务器返回资源记录——例如，包含 IPv4 地址的 `A` 记录。

6. **响应与缓存。** 解析器将答案返回给客户端，并在记录的 [TTL](/zh/glossary/ttl/)（生存时间）规定的时长内进行缓存。在 TTL 窗口内对同一名称的后续查询将从缓存中响应，从而降低延迟并减轻上游服务器的负载。

这种模式——解析器承担迭代式查询工作，客户端只与一台服务器通信——称为**递归解析**。相对地，**迭代解析**是指客户端本身依次查询层级结构中的每一级；这在实践中并不常见，但解析器内部遍历层级结构时采用的正是这种方式（[RFC 1034 §5.3](https://datatracker.ietf.org/doc/html/rfc1034#section-5.3)）。

## DNS 层级与常用记录类型

DNS 被组织为一棵倒置的树。根（`.`）位于顶端；其下是 TLD（`.com`、`.net`、`.io`，以及国家代码如 `.de`）；每个 TLD 下方是二级域（`example.com`）；这些域还可以拥有任意深度的子域（`mail.example.com`）。

树中的每个节点称为一个**区**，区的权威名称服务器保存该区的**资源记录**。最常见的 [DNS 记录类型](/zh/glossary/dns-record-types/)如下：

| 记录 | 用途 | 示例值 |
|--------|---------|---------------|
| **A** | 将名称映射到 IPv4 地址 | `93.184.216.34` |
| **AAAA** | 将名称映射到 IPv6 地址 | `2606:2800:21f:cb07::1` |
| **CNAME** | 将一个名称别名到另一个规范名称 | `www → example.com` |
| **MX** | 指定域名的邮件服务器及其优先级 | `10 mail.example.com` |
| **NS** | 将一个区委托给一组名称服务器 | `ns1.example.com` |
| **TXT** | 存储任意文本；用于 SPF、DKIM、域名验证 | `"v=spf1 include:…"` |
| **SOA** | 权威起始记录——区本身的元数据 | 序列号、刷新、重试时间参数 |

`CNAME` 记录不能放置在区顶点（裸域 `example.com`），因为 `CNAME` 必须是某个名称下的唯一记录，而区顶点同时还需要 `NS` 和 `SOA` 记录。许多 DNS 提供商通过专有的"CNAME 扁平化"或 `ALIAS`/`ANAME` 伪记录类型来解决这一问题。

## DNS 的运营者

DNS 的治理和运营分布在多个层次的参与者之间：

- **[ICANN](/zh/glossary/icann/) / IANA。** 互联网名称与数字地址分配机构负责监管[根区](/zh/glossary/root-zone/)并协调全球 DNS 命名空间。IANA 作为 ICANN 的职能机构，维护列出所有 TLD 及其权威名称服务器的[根区数据库](https://www.iana.org/domains/root)。

- **注册局。** [注册局](/zh/glossary/registry/)运营特定 TLD 的权威数据库。例如，Verisign 运营 `.com` 和 `.net`；公共利益注册局运营 `.org`。注册局发布并维护指向每个域名名称服务器的 NS 记录。

- **注册商。** [注册商](/zh/glossary/registrar/)是经 ICANN（或相关注册局）认证、向公众出售域名并代表客户向注册局提交注册数据的机构。

- **递归解析器。** DNS 解析器由 ISP、公共 DNS 服务（Cloudflare、Google、Quad9）、企业和家用路由器运营。它们负责处理上述迭代查询并缓存结果以降低查询延迟（[Cloudflare 学习中心——什么是 DNS？](https://www.cloudflare.com/learning/dns/what-is-dns/)）。

- **权威名称服务器。** 由域名所有者或其 DNS 提供商托管，这些服务器保存实际的区文件，并以确定性答案响应解析器的查询。

## 安全性

DNS 的原始规范设计以可靠性和扩展性为主要目标，并未着重考虑安全性。随着时间推移，若干漏洞与防护机制相继出现：

**缓存投毒。** 能够将伪造 DNS 响应注入解析器缓存的攻击者，可以在用户不知情的情况下将其从合法网站重定向至恶意网站。2008 年的 Kaminsky 攻击大规模演示了这一点，推动了端口随机化和 [DNSSEC](/zh/glossary/dnssec/) 的更广泛采用。

**DNSSEC。** DNS 安全扩展（定义于 RFC 4033–4035）为 DNS 记录添加了密码学签名。能够验证 [DNSSEC](/zh/glossary/dnssec/) 签名的解析器可检测被篡改的响应。其采用率持续增长但参差不齐：截至 2024 年，约 90% 的根区和主要 TLD 已完成签名，但端到端验证需要链中所有区都已签名且解析器主动检查签名。

**DNS 劫持。** 攻击者若能攻陷注册商账户、注册局系统或 ISP 的解析器，可大规模重定向 DNS 响应。防御手段包括注册商级多因素认证、注册局锁（EPP `serverTransferProhibited`），以及对意外 NS 或 A 记录变更的监控。

**DNS over HTTPS / DNS over TLS（DoH / DoT）。** 这些协议对客户端与解析器之间的 DNS 查询进行加密，防止在传输途中对查询进行窃听和路径修改——这是对 DNSSEC 的补充性保护，后者解决的是数据完整性问题而非隐私问题。

## DNS 与代币化域名

部分基于区块链的域名系统（如以太坊名称服务）完全在链上维护自己的名称→地址映射，独立于传统 DNS 层级体系。另一些则发行代表传统注册域名所有权的链上代币，其底层 DNS 区文件继续托管在标准名称服务器上。在后一种情况下，DNS 解析通过上述正常查询流程进行；区块链记录证明所有权，但并不处于解析路径之中。这两个系统——链上所有权记录与全球 DNS——是可以共存或通过网关解析器桥接的独立层次。

---

*来源：[RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034)、[RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035)、[IANA 根区数据库](https://www.iana.org/domains/root)、[Cloudflare 学习中心——什么是 DNS？](https://www.cloudflare.com/learning/dns/what-is-dns/)、[ICANN——什么是 DNS？](https://www.icann.org/resources/pages/what-2012-02-25-en)*
