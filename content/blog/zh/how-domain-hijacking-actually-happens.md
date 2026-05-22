---
title: '域名劫持究竟是如何发生的：五种攻击路径及相应的防范控制措施'
date: '2026-05-10'
language: zh
tags: ['安全', '域名', '注册商', '事件响应']
authors: ['namefiteam']
draft: false
description: '实战解析现实世界中攻击者接管域名的五种常见方式——社会工程学、注册商账户入侵、DNS提供商接管、NS劫持以及过期域名抢注——并提供能够有效阻断每种攻击的具体防范措施。'
ogImage: ../../assets/how-domain-hijacking-actually-happens-og.jpg
keywords: ['域名劫持', '域名安全', '注册商锁定', '转移锁定', 'dnssec', '双因素认证', '社会工程学', '悬空dns', 'namefi']
---

“域名劫持”这个词听起来惊心动魄，但根据发生方式的不同，其实际含义却大相径庭。注册商账户被钓鱼邮件接管属于劫持；DNS 提供商处的名称服务器（NS）记录被悄悄篡改属于劫持；过期的域名被他人抢注并重新指向，从某种意义上来说，同样也是一种劫持。

无论哪种情况，结果都如出一辙：现在由别人来向全世界宣告你的域名指向何处。电子邮件、支付、登录流程以及 SaaS 集成，都会开始将流量发送给攻击者。恢复工作往往需要几天，甚至几周的时间。如果域名被转移到了另一个注册商，可能会涉及 ICANN 的 [转移争议解决政策 (TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.)；其他情况通常需要注册商升级处理、注册局升级处理、平台恢复，甚至法庭命令。最快捷的解决办法，就是从一开始就不要让自己陷入这种境地。

本文将为您详细梳理我们最常见的五种攻击路径，从防御者的视角还原它们的真实面貌，并提供能够切实阻断这些攻击的具体控制措施。

## 1. 针对注册商客服团队的社会工程学攻击

过去十年中，最常见的那些备受瞩目的劫持事件，其实并没有涉及任何技术层面的漏洞利用。它们往往只是一通电话。

其模式如下：攻击者收集足够多的目标信息——WHOIS 历史记录、LinkedIn、泄露的密码库、社交媒体——然后冒充域名所有者致电或发邮件给注册商的客服团队。他们会要求重置密码、更改邮箱或获取转移授权码。如果客服人员只是机械地核对攻击者早已准备好答案的问题清单，账户就会易手。

这是涉及加密货币交易所、广告平台和基础设施品牌的多起最具破坏性劫持事件背后的核心机制。它不需要注册商代码中存在任何漏洞；它利用的是流程中的“人”。

**如何防范：**

- **注册商端的硬性规定**：所有权变更必须提供经过公证的文件，或通过域名注册人现有渠道进行多因素身份验证。
- **注册局锁定（Registry lock）**（与注册商锁定不同）：注册局（Registry）本身在没有带外（out-of-band）确认的情况下，拒绝执行转移或联系人信息的更改。这在 `.com`、`.net` 以及许多国家/地区代码顶级域名（ccTLDs）中均有提供。
- **核查您实际使用的注册商**，并注销其他闲置账户。从2007年左右起步的品牌，往往在三四个注册商处都留有凭证安全性较弱的陈旧账户。

## 2. 注册商账户入侵（凭据路径）

这是社会工程学在技术上的“表亲”。攻击者通过钓鱼获取注册商账户凭据，或者在撞库泄露的数据中找到它们，然后直接登录。一旦进入，他们就会解锁域名、更改联系邮箱并请求转移。

**如何防范：**

- **在注册商账户上启用抗钓鱼的双因素认证（2FA）。** 通过身份验证器应用获取 TOTP 只是底线；硬件安全密钥（WebAuthn / FIDO2）才是最佳实践。基于短信（SMS）的 2FA 并不安全——SIM 卡劫持（SIM-swapping）攻击已经多次将其攻破。美国政府的 [CISA 指南](https://www.cisa.gov/secure-our-world/turn-mfa) 已明确建议放弃使用短信。
- **选择支持“单域名锁定（per-domain locks）”的注册商**，而不仅仅是账户级别的锁定。这样一来，即使单个账户被入侵，攻击者也无法一次性解锁所有域名。
- **对联系人变更、名称服务器（NS）变更和转移请求进行审计追踪并设置警报。** 攻击者的第一步行动往往是让这些警报静音；如果警报发送到攻击者无法控制的渠道，您就能争取到宝贵的预警时间。

## 3. DNS 提供商接管

即使注册商账户被牢牢锁定，注册商公布的 *名称服务器（Name Servers）* 可能指向具有独立账户的 DNS 提供商——比如 Cloudflare、Route 53、NS1、DNSimple，或者您自建的 BIND 服务器。如果攻击者进入了该 DNS 账户，他们根本不需要动注册商。他们只需重写 A、MX 和 TXT 记录，流量就会随之转移。

这往往是攻击者更容易得手的路径，因为品牌方通常会在注册商安全上投入大量精力，却将 DNS 提供商视为安全控制较弱的底层“基础设施”。

**如何防范：**

- **在 DNS 提供商账户上实施与注册商同等严格的 2FA。** 请将其视为同等敏感的资产，因为它确实如此。
- **DNSSEC（在区域级别进行签名）。** DNSSEC 并不能防止 DNS 提供商账户被入侵：如果攻击者可以通过提供商发布记录，且提供商使用区域（Zone）的活跃密钥对其进行签名，那么验证解析器（resolvers）依然会将这些响应视为真实的。但假设父级发布了正确的 DS 记录，DNSSEC 能够有效阻断的是路径中篡改、缓存投毒，以及未签名或签名错误的伪造响应。有关协议细节，请参阅 [RFC 4033-4035](https://datatracker.ietf.org/doc/html/rfc4033)。
- **多提供商 DNS**：使用独立的账户和凭据，并采用 [多签名者 DNSSEC (multi-signer DNSSEC)](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.)。这有助于提升可用性并实现提供商隔离，但前提是每个提供商都提供预期的区域数据，且 DNSKEY/DS 集得到了正确协调。它并不是一种“魔法覆盖”，解析器并不会自动偏好那个未被入侵的提供商。

## 4. 通过陈旧委派和悬空记录进行的名称服务器（NS）劫持

这是一个更为隐蔽的变种：主域名本身安然无恙，但一个 *子域名* （通过 CNAME 或 NS 记录）指向了一个原所有者已不再控制的第三方服务。攻击者在第三方服务中注册了该资源，从而接管了该子域名的响应。

示例：

- 一个子域名通过 CNAME 指向了已经被释放的旧版 Heroku、S3 或 Azure 资产。攻击者重新认领该资产名称，并获得有效的 TLS 证书。
- 一个委派的 `NS` 记录指向了已被删除的 DNS 提供商账户。攻击者使用完全相同的主机模式创建一个新账户，然后就能随心所欲地为该子域名提供任何记录。

这些情况被统称为 **悬空 DNS (Dangling DNS)**，它们是当今开放网络上最常见的“真正”意义上的域名劫持形式。因为大多数大型组织拥有成百上千个子域名，却只对其中一小部分进行审计。

**如何防范：**

- **为您拥有的每个区域建立包含每个 NS、CNAME 和 ALIAS 记录的完整清单**，并为每条记录指定负责人。
- **使用自动化的悬空 DNS 扫描器**，定期重新解析每条记录，并标记那些指向不再响应的第三方服务的记录。[GitHub 的博客](https://github.blog/2021-12-13-securing-our-home-labs-frigate-version-bump/) 和 [Detectify Labs](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/) 对此类攻击都有详尽的记录和分析。
- **在下线底层服务的同一天同步清理废弃记录。**

## 5. 过期域名抢注

这是最简单、最令人扼腕的攻击方式：注册人忘记了续费。宽限期结束，域名重新掉入公共可用池。然后被其他人注册了。

这听起来像是一个操作失误，而非安全事件，但其影响却是完全相同的——现在由别人控制了这个名字，而多年来建立起的所有信任信号（如 SPF、DKIM、OAuth 回调、密码重置邮件、支付集成等）都开始流向一个陌生人。在几起公开的安全事件中，攻击者专门购买过期域名的原因，正是因为前任所有者将其注册为了 OAuth 令牌中的 `iss`（发行者）声明，或是用于发送事务性电子邮件的发件人。

**如何防范：**

- **对所有涉及身份验证、支付或生产流量的域名进行多年续费**（5-10 年）。成本微不足道，带来的保护却意义重大。
- **使用不会悄无声息失效的支付方式开启自动续费。** 信用卡过期是导致域名意外过期最常见的原因。
- **设置日历提醒**，在到期前 90 天、60 天、30 天和 7 天发送提醒至 *团队* 邮箱，而不是发送给某个可能会离职的员工的个人收件箱。

## 优秀的安全基线该是什么样

综合以上控制措施，任何关键域名的安全基线应如下表所示：

| 控制措施                               | 阻断的攻击路径                                  |
| -------------------------------------- | ----------------------------------------------- |
| 注册商账户启用硬件密钥 2FA             | 账户入侵（路径 2）                              |
| DNS 提供商账户启用硬件密钥 2FA         | DNS 接管（路径 3）                              |
| 注册局锁定（若可用）                   | 社会工程学（路径 1）                            |
| 在区域级别签名的 DNSSEC                | 阻断 DNS 路径篡改和伪造响应                     |
| 子域名清单 + 悬空记录扫描器            | 子域名劫持（路径 4）                            |
| 5-10 年续费 + 自动续费                 | 意外过期（路径 5）                              |
| 联系人/NS/转移变更警报                 | 全部五种情况（确保尽早知晓）                    |

如果您负责管理一个域名，却无法在每一项上打勾，那么攻击者的工作就会变得容易得多。

## Namefi 如何改变这一局面

上述的大多数控制措施都是作为一个注册商、一个 DNS 提供商或一个工作流工具的功能存在的，其安全性取决于其中最薄弱的那个账户。Namefi 将注册人关系在链上进行代币化，这意味着 *谁拥有这个域名* 的权威记录存在于任何单一注册商的客户数据库之外。任何提供商的客服人员都无法在没有合法所有者批准的签名交易的情况下，悄无声息地更改所有权。注册商依然负责技术委派，但其 *控制* 层被转移到了一个社会工程学无法起作用的地方。

这并不是上表中各项控制措施的完全替代品——您仍然需要 DNSSEC，仍然需要在 DNS 提供商处启用 2FA，也仍然需要及时续费。但它从威胁模型中彻底消除了最常见、影响最大的劫持载体（即路径 1）。

## 参考资料与延伸阅读

- ICANN — [转移争议解决政策范围](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.)。
- IETF — [DNSSEC RFC 4033/4034/4035](https://datatracker.ietf.org/doc/html/rfc4033) 以及 [多签名者 DNSSEC RFC 8901](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.)。
- CISA — [多因素身份验证指南](https://www.cisa.gov/secure-our-world/turn-mfa)。
- Detectify Labs — [恶意子域名接管分析](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/)。
- Verisign — [.com/.net 的注册局锁定](https://www.verisign.com/en_US/channel-resources/domain-registry-products/registry-lock/index.xhtml)。