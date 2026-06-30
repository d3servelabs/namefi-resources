---
title: '域名劫持的真实内幕：五种攻击路径及有效防御措施'
date: '2026-05-10'
language: zh-CN
tags: ['security', 'domains', 'registrar', 'incident-response']
authors: ['namefiteam']
draft: false
description: '实战解析现实世界中攻击者接管域名的五种方式——社会工程学、注册商账户入侵、DNS 提供商接管、NS 劫持和过期域名抢注——以及阻断这些攻击的具体控制措施。'
ogImage: ../../assets/how-domain-hijacking-actually-happens-og.jpg
keywords: ['域名劫持', '域名安全', '注册商锁定', '转移锁定', 'dnssec', '双因素认证', '社会工程学', '悬空 DNS', 'namefi']
relatedArticles:
  - /zh-CN/blog/the-fox-it-dns-hijack/
  - /zh-CN/blog/the-godaddy-multi-year-breach/
  - /zh-CN/blog/the-badgerdao-frontend-attack/
  - /zh-CN/blog/the-lenovo-com-dns-hijack/
  - /zh-CN/blog/the-perl-com-domain-theft/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/name-change-game-change/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/registry/
---

“[域名劫持](/zh-CN/glossary/domain-hijacking/)”这个词听起来惊心动魄，但根据发生方式的不同，它的实际含义却大相径庭。通过钓鱼邮件接管[注册商](/zh-CN/glossary/registrar/)账户是一种劫持；在 [DNS](/zh-CN/glossary/dns/) 提供商处悄悄篡改名称服务器（Nameserver）记录是一种劫持；过期域名被他人抢注并重新指向，从某种意义上来说，同样属于劫持。

在所有这些情况下，结果都是一样的：现在由别人在向全世界宣告你的域名指向何处。电子邮件、支付、登录流程和 SaaS 集成都会开始将流量发送给攻击者。恢复过程通常需要几天，有时甚至几周。如果域名被转移到了另一个注册商，可能需要遵循 [ICANN](/zh-CN/glossary/icann/) 的[转移争议解决政策 (TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.)；其他情况则往往需要上报注册商、上报[注册局](/zh-CN/glossary/registry/)、进行平台恢复，甚至需要法院命令。最快捷的解决之道，就是从一开始就不要让自己陷入这种境地。

本文将详细梳理我们最常见的五种攻击路径，从防御者的角度剖析它们的特征，并介绍能够真正阻断这些攻击的具体控制措施。

## 1. 针对注册商客服团队的社会工程学攻击

过去十年中最常见、最引人注目的劫持事件，其实并不涉及任何技术漏洞，往往只是一通电话。

攻击模式：攻击者收集了关于目标的大量信息——[WHOIS](/zh-CN/glossary/whois/) 历史记录、LinkedIn、泄露的密码库、社交媒体——然后打电话或发邮件给注册商的客服团队，冒充域名所有者。他们会要求重置密码、更改电子邮箱或获取转移[授权码](/zh-CN/glossary/auth-code/)。如果客服人员按图索骥的核对清单恰好在攻击者的准备范围内，账户就会易主。

这是几起涉及加密货币交易所、广告平台和基础设施品牌的最具破坏性的劫持事件背后的核心机制。它不需要注册商代码存在任何漏洞；它利用的是流程中的人性弱点。

**如何防御：**

- **严格的注册商端规则**：要求所有权变更必须提供经过公证的文件，或对[注册人](/zh-CN/glossary/registrant/)现有渠道进行多因素验证。
- **[注册局锁定](/zh-CN/glossary/registry-lock/)（Registry lock）**（有别于注册商锁定）：注册局运营商自身拒绝在没有带外确认（out-of-band confirmation）的情况下执行转移或联系人更改。该功能适用于 `.com`、`.net` 及许多国家/地区顶级域名（ccTLD）。
- **核实你实际使用的注册商**并注销其他不用的账户。2007 年左右成立的品牌通常在三四家注册商那里都留有凭证安全性较弱的陈旧账户。

## 2. 注册商账户入侵（凭据路径）

这是社会工程学在技术上的“表亲”。攻击者通过网络钓鱼获取注册商账户凭据，或在撞库泄露的数据中找到它们，然后直接登录。随后，他们解锁域名，更改联系邮箱，并请求转移。

**如何防御：**

- **在注册商账户上启用抗钓鱼的双因素认证（2FA）。** 通过身份验证器应用（如 Authenticator）的 TOTP 是底线；硬件密钥（WebAuthn / FIDO2）则是最高标准。基于短信的 2FA 是不够的——SIM 卡劫持（SIM-swapping）攻击已多次攻破该防线。美国政府的 [CISA 指南](https://www.cisa.gov/secure-our-world/turn-mfa)明确建议停止使用基于短信的验证方式。
- **选择支持单域名锁定的注册商**：除账户级锁定外，还能确保即使单一账户被入侵，攻击者也无法一次性解锁所有域名。
- **审计跟踪和警报**：对联系人变更、名称服务器变更和转移请求设置警报。攻击者的第一步往往是关闭这些警报；如果警报发送到攻击者无法控制的渠道，你就能获得宝贵的预警时间。

## 3. DNS 提供商接管

即使注册商账户已安全锁定，注册商发布的 *名称服务器* 可能指向一个拥有独立账户的 DNS 提供商——如 Cloudflare、Route 53、NS1、DNSimple 或你自己的 BIND 服务器。如果攻击者侵入了该 DNS 账户，他们根本不需要触碰注册商。他们只需重写 A 记录、MX 记录和 TXT 记录，流量就会随之转移。

这通常是攻击者更容易得手的一条路径，因为品牌方往往会在注册商安全上投入大量精力，却将 DNS 提供商视为控制措施较弱的“基础设施”。

**如何防御：**

- **在 DNS 提供商账户上实行与注册商同等严格的 2FA 措施。** 请将其视为同等敏感的数据环境，因为它确实如此。
- **[DNSSEC](/zh-CN/glossary/dnssec/)**，在区域（zone）级别进行签名。DNSSEC 并不能防止 DNS 提供商账户被入侵：如果攻击者可以通过提供商发布记录，并且提供商使用该区域的活动密钥对记录进行签名，验证解析器仍会认为这些响应是真实的。假设父节点发布了正确的 DS 记录，DNSSEC 真正能阻止的是路径篡改、缓存投毒，以及未签名或签名错误的伪造响应。有关协议细节，请参阅 [RFC 4033-4035](https://datatracker.ietf.org/doc/html/rfc4033)。
- **多提供商 DNS**：使用拥有独立账户和凭据的多个提供商，并采用[多签名者 DNSSEC (multi-signer DNSSEC)](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.)。这有助于提高可用性和实现提供商隔离，但前提是每个提供商都提供预期的区域数据，并且 DNSKEY/DS 集得到正确协调。它并不是一种神奇的覆盖机制，无法让解析器自动偏好未被破坏的提供商。

## 4. 通过陈旧委派和悬空记录进行的名称服务器劫持

这是一个更隐蔽的变种：主域名本身安然无恙，但一个 *[子域名](/zh-CN/glossary/subdomain/)* （通过 CNAME 或 NS 记录）指向了一个原所有者不再控制的第三方服务。攻击者在第三方端注册了该资源，从而接管了对该子域名的响应。

示例：

- 子域名通过 CNAME 指向了一个已被释放的旧 Heroku、S3 或 Azure 资产。攻击者重新认领该资产名称并获取了有效的 TLS 证书。
- 委派的 `NS` 记录指向一个已被删除的 DNS 提供商账户。攻击者使用完全相同的主机模式创建一个新账户，并为该子域名提供他们想要的任何记录。

这些问题统称为 **悬空 DNS (Dangling DNS)**。它们是当今开放网络上最常见的“真实”域名劫持形式，因为大多数大型组织拥有成百上千的子域名，却只对其中一小部分进行常规审计。

**如何防御：**

- **建立完整清单**：全面盘点你所拥有的每个区域中的每一条 NS、CNAME 和 ALIAS 记录，并为每条记录明确负责人。
- **自动化的悬空 DNS 扫描器**：按计划定期重新解析每条记录，并标记那些指向不再响应的第三方服务的记录。[GitHub 的博客](https://github.blog/2021-12-13-securing-our-home-labs-frigate-version-bump/)和 [Detectify Labs](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/) 对此类攻击有长期且深入的分析文章。
- **及时清理**：在停用底层服务的当天，同步停用相关的解析记录。

## 5. 过期域名抢注

这是最简单也最不值得同情的攻击：注册人忘记了续费。[宽限期](/zh-CN/glossary/grace-period/)过后，域名掉回可用池中。其他人注册了它。

这听起来像是一个操作失误，而非安全事件，但其影响是完全相同的——现在由别人控制了这个名字，而多年来建立起来的所有信任信号（SPF、DKIM、OAuth 回调、密码重置邮件、支付集成）都开始流向一个陌生人。几起公开事件表明，攻击者专门购买过期域名，是因为前任所有者将其注册为 OAuth 令牌中的 `iss` 声明或事务性电子邮件的发件人。

**如何防御：**

- **多年续费**：对任何涉及身份验证、支付或生产流量的域名进行 5-10 年的长期续费。成本微乎其微，但保护作用极为显著。
- **使用可靠的支付方式自动续费。** 银行卡过期是导致域名意外到期的最常见原因。
- **日历提醒**：在到期前 90、60、30 和 7 天设置提醒，并发送到 *团队* 邮箱，而不是发送给某个随时可能会离职的个人邮箱。

## 理想的防护体系

综合上述控制措施，任何重要域名的安全基线应如下所示：

| 控制措施 | 阻断的攻击路径 |
| -------------------------------------- | ----------------------------------------------- |
| 注册商端使用硬件密钥 2FA | 账户入侵（路径 2） |
| DNS 提供商端使用硬件密钥 2FA | DNS 接管（路径 3） |
| 注册局锁定（如适用） | 社会工程学（路径 1） |
| 区域级别的 DNSSEC 签名 | DNS 路径篡改和伪造响应 |
| 子域名清单 + 悬空扫描器 | 子域名劫持（路径 4） |
| 5-10 年续费 + 自动续费 | 意外到期（路径 5） |
| 联系人/NS/转移变更警报 | 全部五种（提早预警） |

如果你要对一个域名负责，却无法全盘勾选上述每一行，那么攻击者的工作就会轻松得多。

## Namefi 如何改变这一现状

上述大多数控制措施作为功能，通常独立存在于某单一注册商、DNS 提供商或工作流工具中，而整体的安全性往往受制于其中最薄弱的那一个账户。Namefi 将注册人关系在[链上](/zh-CN/glossary/on-chain/)代币化，这意味着关于 *谁拥有这个域名* 的权威记录存在于任何单一注册商的客户数据库之外。没有任何一家提供商的客服人员可以在没有合法所有者签署、批准的链上交易的情况下，悄悄更改域名的所有权。注册商仍然负责技术层面的委派，但 *控制* 层被转移到了一个社会工程学完全无法发挥作用的地方。

这并不能完全替代上表中的控制措施——你仍然需要 DNSSEC，仍然需要在 DNS 提供商端设置 2FA，仍然需要及时续费。但它将威胁模型中最常见、影响最大的高危劫持载体（路径 1）彻底清除了。

## 参考资料与进一步阅读

- ICANN — [转移争议解决政策范围](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.)
- IETF — [DNSSEC RFC 4033/4034/4035](https://datatracker.ietf.org/doc/html/rfc4033) 及 [多签名者 DNSSEC RFC 8901](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.)
- CISA — [多因素认证指南](https://www.cisa.gov/secure-our-world/turn-mfa)
- Detectify Labs — [恶意子域名接管分析报告](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/)
- Verisign — [.com/.net 注册局锁定](https://www.verisign.com/en_US/channel-resources/domain-registry-products/registry-lock/index.xhtml)