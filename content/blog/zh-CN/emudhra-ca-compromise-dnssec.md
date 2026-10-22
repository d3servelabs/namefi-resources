---
title: "CA 帮助浏览器验证网站身份，域名运营者仍需分层防护"
date: '2026-10-22'
language: zh-CN
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
format: explainer
description: "了解 eMudhra CA 密钥失陷、网站冒充风险，以及 DNSSEC、DANE、CAA 和 CT 提供的不同保护。"
keywords: ["eMudhra", "emSign", "CA 失陷", "证书颁发机构", "中间证书颁发机构", "MITM", "DNSSEC", "DANE", "CAA", "证书透明度", "TLS 证书", "域名安全"]
relatedArticles:
  - /zh-CN/blog/the-fox-it-dns-hijack/
  - /zh-CN/blog/the-myetherwallet-bgp-dns-attack/
  - /zh-CN/blog/the-curve-finance-dns-hijack/
  - /zh-CN/blog/dns-on-tokenized-domains/
  - /zh-CN/blog/dnssec-for-domain-owners/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/certificate-authority/
  - /zh-CN/glossary/intermediate-ca/
  - /zh-CN/glossary/man-in-the-middle-attack/
  - /zh-CN/glossary/dnssec/
  - /zh-CN/glossary/dane/
---

[证书颁发机构](/zh-CN/glossary/certificate-authority/)（Certificate Authority，CA）签发数字证书，将域名等身份与公钥关联起来。浏览器结合证书链和其他检查，验证连接对面的服务器身份。

身份验证与加密共同保护 HTTPS 连接。加密保护通信内容，身份验证帮助客户端确认通信对象。域名运营者需要理解两种机制各自承担的任务。

eMudhra 的弱密钥事件提供了一个具体案例。部分中间 CA 私钥失陷，使攻击者有机会伪造证书。实际冒充还要求攻击者接触流量，并让客户端接受伪造证书。不同客户端的证书检查和更新机制，也会影响实际风险。

本文将依次说明 CA 的作用、中间 CA 的权限，以及中间人攻击的必要条件。本文还会区分 DNSSEC、DANE、CAA 和证书透明度的保护范围。最后，本文列出域名运营者可以检查的安全措施。

**状态说明：** 调查仍在继续。确认密钥失陷，不等于确认攻击者已拦截客户流量。后文分别标明已确认事实、公司声明和假设攻击。

## 事件暴露了单个网站之上的签名权限风险

[证书颁发机构](/zh-CN/glossary/certificate-authority/)简称 CA，负责签发数字证书，将身份与公钥关联起来。在 HTTPS 中，证书标明服务器可以证明控制权的域名。CA 在签发证书前检查适用的身份要求。浏览器检查证书链，以及服务器持有相应私钥的证明。[RFC 5280 描述了证书模型](https://www.rfc-editor.org/rfc/rfc5280#section-3.2)。

根 CA 提供信任锚。[中间证书颁发机构](/zh-CN/glossary/intermediate-ca/)持有根之下的委托签名权限。网站证书通常位于中间证书颁发机构之下。网站密钥失陷，威胁的是相应证书中的身份。中间密钥失陷则可能威胁许多互不相关的域名，具体影响取决于证书约束和客户端检查。

Mozilla 的[事件记录列出了八张受影响的中间证书](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0)：六张用于 TLS，两张用于代码签名。Mozilla 独立恢复出了薄弱的私钥。eMudhra 于 10 月 18 日将证书标记为已吊销。事实表明密钥生成存在故障，并不证明有人窃取了每一位客户的私钥。

在 [10 月 21 日的声明](https://emudhra.com/en/post/certificate-security-incident#:~:text=During%20the%20ceremony)中，eMudhra 将薄弱密钥归因于 2025 年 4 月 30 日密钥仪式中的包装与解包步骤。eMudhra 表示，受影响的中间证书没有签发过终端实体证书，并称公司没有发现披露前遭到利用的证据。公司还表示，确切根因的调查尚未完成。声明反映了 eMudhra 的调查结果，不构成对全部历史流量的独立保证。

## 浏览器保护措施改变了实际暴露程度

Google 表示，Chrome 于 10 月 17 日通过 CRLSet 更新拦截了受影响的密钥。Google 还报告，在拦截前，CT 日志中没有出现六张受影响 TLS 中间证书下的 TLS 证书。因此，针对强制执行相关 CT 要求的客户端，攻击者无法利用相关中间证书签发的欺诈证书成功冒充。Google 的通告将 Chrome 列为执行相关要求的客户端之一。

Mozilla [于当晚分发了 OneCRL 拦截更新](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/)。Mozilla 还为可能无法获得 OneCRL 保护的配置发布了 Firefox 更新。浏览器更新不能证明同一设备上的每个应用都获得相同保护。[Cloudflare 特别提醒，不同应用可能使用不同的证书验证器](https://blog.cloudflare.com/emudhra-certificate-compromise/#:~:text=A%20successful%20browser%20test)。

Google 的 10 月 20 日通告计划于太平洋夏令时 2026 年 10 月 27 日，在使用 Chrome Root Store 的客户端中移除 **emSign ECC Root CA - G3**。Google 要求受影响的网站运营者，将证书迁移至另一个受信任的证书体系。运营者必须区分即时安全拦截与后续根证书失去信任导致的服务中断。

## 中间人攻击需要流量访问能力和客户端接受的身份

[中间人攻击](/zh-CN/glossary/man-in-the-middle-attack/)简称 MITM，让攻击者介入通信双方之间。以下是假设攻击，并非已经观察到的 eMudhra 漏洞利用：

1. 攻击者通过恶意 DNS 响应或其他网络拦截方法，将访问者重定向到攻击者。
2. 攻击者出示目标域名的伪造证书。
3. 缺乏保护的客户端接受证书，并与攻击者建立 TLS 连接。
4. 攻击者向真实服务转发流量，同时读取或修改应用数据。

持有 CA 密钥不会自动重定向流量。仅有证书，也不能解密此前记录的所有会话。在 TLS 1.3 所述假设成立时，前向保密保护早先会话，防止长期身份验证密钥后来失陷造成解密。[RFC 8446 解释了相关区别](https://datatracker.ietf.org/doc/html/rfc8446#appendix-E.1)。

我们的 [Fox-IT 案例研究](/zh-CN/blog/the-fox-it-dns-hijack/)分析了产生类似结果的另一条路径：注册商失陷使攻击者能够获取欺诈证书。我们的 [MyEtherWallet 案例研究](/zh-CN/blog/the-myetherwallet-bgp-dns-attack/)分析了路由和 DNS 操纵。域名安全必须同时处理流量去向和端点身份验证。

## DNSSEC 验证 DNS 响应，但不修复 CA 密钥

[DNSSEC（域名系统安全扩展）](/zh-CN/glossary/dnssec/)为 DNS 数据添加数字签名。执行验证的解析器通过信任链检查签名。如果区域签名正确且验证链完整，攻击者替换伪造地址响应便会触发检测。[RFC 4033 规定了保护范围与限制](https://datatracker.ietf.org/doc/html/rfc4033#section-3)。

客户端必须在本地验证，或同时信任验证解析器及通往解析器的已认证连接。[RFC 4033 讨论了最后一跳的要求](https://datatracker.ietf.org/doc/html/rfc4033#section-7)。

满足前述条件时，DNSSEC 可以阻止假设攻击中的 DNS 伪造步骤。DNSSEC 不会吊销中间证书颁发机构，不会验证 HTTPS 证书，也不会加密网页流量。通过其他路径拦截流量的攻击者，仍可向存在风险的客户端出示伪造证书。

仅有签名也不能保护注册商账户或权威 DNS 控制面板。掌握授权 DNS 变更权限的攻击者，可以发布有害记录，并让服务提供商签名。运营者除了部署 DNSSEC 验证，还需要保护账户、监测变更，并正确配置父区域的 DS 记录。

## 客户端强制执行 DANE 关联后，DANE 可以将服务密钥绑定到已签名 DNS

[DANE](/zh-CN/glossary/dane/)通过 TLSA 记录将 DNSSEC 与 TLS 身份验证连接起来。域名运营者在已签名的 DNS 中发布预期证书、密钥或信任锚。支持 DANE 的客户端验证 DNSSEC，并强制执行 TLSA 关联。[RFC 6698 规定了关联机制](https://www.rfc-editor.org/rfc/rfc6698#section-2)。

例如，DANE-EE 用途可以将服务直接绑定到公钥。使用无关 CA 密钥伪造的证书无法满足绑定要求。保护效果要求安全的 DNSSEC 验证、正确的 TLSA 数据，以及客户端实际强制执行关联。密钥轮换还需要协调 TLSA 更新。[RFC 7671 提供了运维指导](https://www.rfc-editor.org/rfc/rfc7671#section-5.1)。

发布 TLSA 记录，不会自动保护普通浏览器访问者。Firefox 的 [DANE 实现请求仍处于拒绝状态](https://bugzilla.mozilla.org/show_bug.cgi?id=1994924)。运营者必须核实具体客户端的支持情况。DANE 已有针对 [SMTP 传输安全](https://www.rfc-editor.org/rfc/rfc7672)的标准化应用。

## CAA 和 CT 提供不同的证书控制措施

| 控制措施 | 保护能力 | 限制 |
| --- | --- | --- |
| DNSSEC | 执行验证的解析器验证已签名 DNS 数据的真实性。 | DNSSEC 不会修复失陷的 CA 密钥。 |
| DANE | 支持 DANE 的客户端检查经 DNSSEC 认证的 TLSA 关联。 | 客户端必须强制执行关联。 |
| CAA | 遵循规范的 CA 检查域名授权了哪些颁发机构。 | 伪造者可以绕过 CA 的签发流程。 |
| CT | 日志公开证书签发情况，供监测和客户端策略检查。 | 仅有日志不能阻止所有伪造，也不能保护所有客户端。 |

[CAA](/zh-CN/glossary/caa/)在 DNS 中公布获授权的颁发机构。[RFC 8659 区分了签发授权与客户端证书验证](https://www.rfc-editor.org/rfc/rfc8659#section-1)。遭窃或可被恢复的签名密钥，让伪造者能够忽略 CAA 检查。

[证书透明度](/zh-CN/glossary/certificate-transparency/)简称 CT，让公众能够审计证书签发。监测可以标记非预期证书，客户端强制执行策略则可以拒绝缺少必要日志证明的证书。[RFC 9162 描述了日志机制](https://www.rfc-editor.org/rfc/rfc9162#section-1)。前述 Google 调查结果说明了 CA 事件中强制执行策略的重要性。

## 域名运营者现在应检查客户端信任与证书依赖

- 安装最新的浏览器、操作系统、运行时和 CA 软件包安全更新。
- 盘点网站、API、移动应用、容器和 TLS 检查网关的证书链。
- 遵循供应商针对受影响中间证书和根证书移除的指导，包括替代证书路径。
- 在适用客户端的截止日期前，更换连接到失去信任证书体系的证书。
- 完成修复后，测试每个应用实际使用的 TLS 验证器。
- 保持证书验证开启，并在出现证书错误时停止访问。
- 正确配置 DS 委派，启用 DNSSEC，并使用执行验证的解析服务。
- 通过 CAA 限制获授权的颁发机构，监测 CT，并保护注册商与 DNS 账户。

VPN 可以改变流量路径。VPN 不会修复客户端的证书信任判断。HSTS 要求使用 HTTPS，但客户端接受伪造的 HTTPS 身份后，保护仍会失效。[RFC 6797 描述了 HSTS 的安全限制](https://www.rfc-editor.org/rfc/rfc6797#section-14)。

对于 Namefi 读者，域名所有权、DNS 管理、TLS 身份验证和钱包授权需要分别设置控制措施。域名代币化不会自动取代浏览器 CA 信任，也不会自动启用 DNSSEC。我们的[代币化域名 DNS 指南](/zh-CN/blog/dns-on-tokenized-domains/)解释了运维层面的联系。我们的 [Curve Finance 案例研究](/zh-CN/blog/the-curve-finance-dns-hijack/)说明了 Web3 团队保护界面域名的必要性。

## 一手来源记录了事件与防护措施

以下来源均于 2026 年 10 月 22 日查阅。随着调查推进，事件声明可能发生变化。

- [Google：Chrome 与 Android 的应对措施](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/)，2026 年 10 月 20 日。有关熵、CT、拦截及根证书移除的章节。
- [Mozilla：Firefox 的应对措施](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/)，2026 年 10 月 20 日。OneCRL 分发和额外更新。
- [Mozilla 问题 2083449](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0)，描述和评论 1。证书范围、独立密钥恢复和吊销。
- [eMudhra 事件声明](https://emudhra.com/en/post/certificate-security-incident)，更新 2–4。公司调查结果与客户迁移选项。
- [Cloudflare 事件指导](https://blog.cloudflare.com/emudhra-certificate-compromise/)，针对不同应用的验证指导。
- [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280#section-3.2)，证书与信任路径模型。
- [RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446#appendix-E.1)，TLS 1.3 前向保密。
- [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033#section-3)，DNSSEC 服务、限制和验证。
- [RFC 6698](https://www.rfc-editor.org/rfc/rfc6698#section-2)和 [RFC 7671](https://www.rfc-editor.org/rfc/rfc7671#section-5.1)，DANE 关联与运维。
- [Mozilla 问题 1994924](https://bugzilla.mozilla.org/show_bug.cgi?id=1994924)，Firefox 的 DANE 实现状态。
- [RFC 7672](https://www.rfc-editor.org/rfc/rfc7672)，SMTP 中的 DANE。
- [RFC 8659](https://www.rfc-editor.org/rfc/rfc8659#section-1)，CAA 授权与验证的区别。
- [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162#section-1)，CT 日志与监测。
- [RFC 6797](https://www.rfc-editor.org/rfc/rfc6797#section-14)，HSTS 安全注意事项。
