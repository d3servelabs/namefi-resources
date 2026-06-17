---
title: '海龟行动 (Sea Turtle)：劫持 DNS 监视政府的国家级黑客行动'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '思科 Talos 团队于 2019 年披露的国家级黑客行动“海龟 (Sea Turtle)”是如何通过攻陷注册商、注册局和 DNS 提供商来劫持 DNS 的——他们将政府、部委和能源公司的流量重定向至攻击者的服务器，伪造有效的安全证书，甚至攻破了一个国家顶级域名 (TLD) 注册局。'
keywords: ['海龟行动 DNS 劫持', '思科 Talos 海龟行动', 'DNS 劫持攻击', '国家级 DNS 攻击', '注册局入侵', '注册商入侵', 'DNS 间谍活动', 'Let''s Encrypt 中间人证书', 'Netnod 入侵', 'ICS-FORTH 希腊 ccTLD', 'CISA 紧急指令 19-01', 'DNS 安全', '域名所有权安全', '国家级网络攻击']
---

大多数网络攻击都试图破坏并进入目标*内部*。而“海龟 (Sea Turtle)”行动做了一件更悄无声息且危险得多的事情：它入侵了告诉整个互联网目标所在位置的**地图**。

当您输入某个政府部委的网址，或者向其官员发送电子邮件时，您的计算机首先会请求域名系统（DNS）将人类可读的名称转换为正确服务器的数字地址。这种查询机制非常基础，以至于互联网上几乎没有任何机制去验证它。我们只是单纯地信任该名称会解析到它应该去的地方。“海龟”行动的幕后操纵者彻底看透了这种信任，并花了两年多的时间滥用它，对整个中东和北非的政府进行监视。

思科 Talos 团队于 2019 年 4 月披露的“海龟”行动，是我们所见过的将 DNS 本身武器化为国家级间谍工具的最清晰案例之一。攻击者并没有去网络钓鱼个别员工碰运气。他们直接盯上了位于目标*上游*的注册商、注册局和 DNS 提供商——这些机构控制着域名的解析方式。从这个制高点，他们重新路由了整个组织的流量，窃取了凭证，并伪造了本应让身份冒充成为不可能的加密证书。

## 作为国家级间谍活动目标的 DNS

DNS 有时被称为互联网的电话簿，但这低估了它的作用。它更像是邮政路由系统：每一封电子邮件、每一次登录、每一次 API 调用都从名称解析开始。如果您控制了解析，您就控制了目的地——并且您可以隐身坐在对话的中间，而通信双方都相信他们的交流是私密且直接的。

这使得 DNS 成为近乎完美的间谍活动目标。攻破一个 DNS 提供商就可能暴露所有依赖它的组织的流量。而且，与终端上的恶意软件不同，DNS 操纵不会触及受害者自己的机器：没有可扫描的病毒，也没有可隔离的威胁。解析记录只是单纯地指向了一个新的地方。

Talos 对该机制的描述非常直白。正如他们的报告所述，[当攻击者能够非法修改 DNS 名称记录以将用户指向攻击者控制的服务器时，就会发生 DNS 劫持](https://blog.talosintelligence.com/seaturtle/#:~:text=DNS%20hijacking%20occurs%20when%20the%20actor%20can%20illicitly%20modify%20DNS%20name%20records%20to%20point%20users%20to%20actor%2Dcontrolled%20servers)。描述起来很简单，但在实际操作中却具有毁灭性。

## “海龟”行动 (2017–2019)

![Vivid colorful concept art of a shadowy state actor silhouetted as a turtle quietly rerouting glowing arrows across a stylized map of a region, neon network lines bending toward hidden servers](../../assets/the-sea-turtle-dns-espionage-01-campaign.jpg)

“海龟”行动绝非“打砸抢”式的快闪攻击。Talos 评估认为，[这项持续进行的行动可能早在 2017 年 1 月就开始了，并一直持续到 2019 年第一季度](https://blog.talosintelligence.com/seaturtle/#:~:text=The%20ongoing%20operation%20likely%20began%20as%20early%20as%20January%202017%20and%20has%20continued%20through%20the%20first%20quarter%20of%202019)——这是两年多耐心、持久的行动。

在此期间，根据 Talos 的统计，[在此次行动中，至少有来自 13 个不同国家的 40 家不同组织遭到破坏](https://blog.talosintelligence.com/seaturtle/#:~:text=at%20least%2040%20different%20organizations%20across%2013%20different%20countries%20were%20compromised%20during%20this%20campaign)。TechCrunch 总结了其波及范围：该组织 [在两年多的时间里，将 13 个国家的 40 个政府和情报机构、电信公司以及互联网巨头作为目标](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)，受害者遍布多个国家，包括 [亚美尼亚，以及埃及、土耳其、瑞典、约旦和阿拉伯联合酋长国](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)。

Talos 拒绝公开将此次行动归咎于特定政府，但对操纵者的实力深信不疑。正如思科 Talos 团队的 Craig Williams 告诉 TechCrunch 的那样，[这是一个新出现的组织，正以我们以前从未见过的一种相对独特的方式进行操作，采用了全新的战术、技术和程序](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)，并且该团队评估该组织的 [主要动机是进行间谍活动](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)。

## 谁是目标，以及面临何种风险

遇袭者名单读起来就像一份情报收集愿望清单。Talos 将主要目标锁定为 [国家安全组织、外交部以及知名的能源机构](https://blog.talosintelligence.com/seaturtle/#:~:text=national%20security%20organizations%2C%20ministries%20of%20foreign%20affairs%2C%20and%20prominent%20energy%20organizations)——这些恰恰是敌对国家最想读取其内部通信的机构。

在某种意义上，第二梯队的受害者更能说明问题。Talos 发现攻击者还袭击了 [众多 DNS 注册商、电信公司和互联网服务提供商 (ISP)](https://blog.talosintelligence.com/seaturtle/#:~:text=numerous%20DNS%20registrars%2C%20telecommunication%20companies%2C%20and%20internet%20service%20providers)。这些并非最终的战利品；它们只是*手段*。通过控制基础设施提供商，攻击者获得了为下游真正目标操纵 DNS 的筹码。

BleepingComputer 的总结清晰地点明了这些战利品：主要目标是 [外交部、军事组织、情报机构、能源公司](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)。当你可以悄无声息地拦截某个外交部的电子邮件和登录流量时，你根本不需要破解加密——你只需收集凭证并在邮件流转时直接阅读即可。

## 这是如何发生的：劫持信任链

![Vivid colorful concept art of a man-in-the-middle figure intercepting a stream of glowing government envelopes and stamping each with a forged green seal before passing them on, two padlocks facing each other across a fractured pipeline](../../assets/the-sea-turtle-dns-espionage-02-registry-compromise.jpg)

这正是“海龟”行动非同寻常的复杂之处：攻击者很少直接针对受害者采取行动，相反，他们攀爬了信任链。

根据 Talos 的重建并得到独立报告证实的攻击模式，大致如下。首先，在 DNS 提供商、注册商或注册局处获得立足点——通常是通过鱼叉式网络钓鱼或利用已知漏洞。获得访问权限后，[修改 DNS 记录以将目标的合法用户重定向至攻击者控制的服务器](https://blog.talosintelligence.com/seaturtle/#:~:text=Modified%20DNS%20records%20to%20point%20legitimate%20users%20of%20the%20target%20to%20actor%2Dcontrolled%20servers)。这些服务器被设置为中间人层：正如 BleepingComputer 所述，[“海龟”行动的操作者建立了一个中间人 (MitM) 框架，伪装成受害者使用的合法服务，目的是窃取登录凭证](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)。受害者会登录到看似正常的邮件或 VPN 门户网站，而攻击者则会 [在用户与这些由攻击者控制的服务器交互时捕获合法用户凭证](https://blog.talosintelligence.com/seaturtle/#:~:text=Captured%20legitimate%20user%20credentials%20when%20users%20interacted%20with%20these%20actor%2Dcontrolled%20servers)，然后悄悄将他们转发到真正的服务中，这样一切看起来就跟正常一样。

其中最聪明——也是最令人警惕的——一环，是他们如何击败“安全锁”。重定向流量是一回事；在不触发浏览器证书警告的情况下做到这一点又是另一回事。“海龟”行动通过为他们冒充的域名获取真实有效的证书解决了这个问题。Talos 发现攻击者 [从另一家提供商处获取了同一域名、由证书颁发机构签发的 X.509 证书](https://blog.talosintelligence.com/seaturtle/#:~:text=obtained%20a%20certificate%20authority%2Dsigned%20X.509%20certificate)，并指出 [这些攻击者在其 MitM 服务器中使用了 Let's Encrypts、Comodo、Sectigo 以及自签名的证书](https://blog.talosintelligence.com/seaturtle/#:~:text=use%20Let%27s%20Encrypts%2C%20Comodo%2C%20Sectigo%2C%20and%20self%2Dsigned%20certificates)。由于他们控制了 DNS 记录，因此可以轻易通过免费证书颁发机构所依赖的自动域名验证检查——从而顺理成章地为他们并不拥有的域名拿到了合法的绿色安全锁。

记录了密切相关的早期攻击浪潮的 Brian Krebs 描述了同样的剧本：攻击者 [似乎更改了这些域名的 DNS 记录，使域名指向了他们控制的位于欧洲的服务器](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)，然后 [能够从 SSL 提供商 Comodo 和/或 Let's Encrypt 处获得这些域名的 SSL 证书](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)。其中提到的受害者之一是 [mail.gov.ae，该域名负责处理阿拉伯联合酋长国政府办公室的电子邮件](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)。

### 注册局的沦陷

此次行动的“最高潮”在于攻陷了那些不仅*使用* DNS，而且为整个国家*运行* DNS 的组织。

首个公开确认的案例涉及瑞典的 Netnod。正如 Krebs 所报道的，攻击者 [获得了 Netnod 域名注册商账户的访问权限](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)，而 Netnod 本身则表示，它 [在 1 月 2 日得知了其在此次攻击中被利用的角色](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)。关键在于，Netnod 并非最终目的地——它只是一扇门。BleepingComputer 指出 Netnod 表示 [他们不是攻击的目标，而是攻击者“捕获互联网服务登录详细信息”的途径](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)。

Talos 用严厉的措辞描述了其更广泛的意义：这些操作者制造了 [针对管理根服务器区域的组织的第一起公开确认的攻击案件](https://blog.talosintelligence.com/seaturtle/#:~:text=responsible%20for%20the%20first%20publicly%20confirmed%20case%20against%20an%20organizations%20that%20manages%20a%20root%20server%20zone)。当运行互联网核心地址簿某一部分的人员可以被悄无声息地冒充时，默认 DNS 是可信的这一假设便不复存在了。

## 反应与余波：他们并未收手

如此规模的 DNS 劫持引起了官方的响应。2019 年 1 月，美国网络安全和基础设施安全局 (CISA) 发布了 [第 19-01 号紧急指令：“缓解 DNS 基础设施篡改”](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)——这是 CISA 有史以来发布的第一份紧急指令——要求联邦机构审计其 DNS 记录，更改 DNS 管理账户的凭证，并对这些账户启用多因素身份验证。这实际上是一种默认，即 DNS 管理已成为国家安全的阻击前线。

然而，关于“海龟”行动最引人注目的是在它被曝光*之后*发生的事情。一旦像 Talos 这样的安全厂商公布了他们的作案手法，大多数黑客行动都会归于沉寂。但“海龟”却反其道而行之。

在 2019 年 7 月的后续报道中，Talos 报告称该组织发现了新的受害者，其中包括 [一个国家代码顶级域名 (ccTLD) 注册局，该注册局管理着使用该特定国家代码的每个域名的 DNS 记录](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=a%20country%20code%20top%2Dlevel%20domain%20%28ccTLD%29%20registry)。具体而言，被攻陷的是 [希腊研究与技术基金会计算机科学研究所 (ICS-Forth)，即希腊的 ccTLD 管理机构](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=The%20Institute%20of%20Computer%20Science%20of%20the%20Foundation%20for%20Research%20and%20Technology%20%2D%20Hellas%20%28ICS%2DForth%29%2C%20the%20ccTLD%20for%20Greece)——该机构运营着 `.gr` 命名空间。SecurityWeek 指出，甚至在 ICS-Forth 公开承认遭遇数据泄露之后，[思科的遥测数据证实，这种失陷状态至少又持续了五天](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)。

Talos 对该组织的评估异常尖锐：[这个组织显得异乎寻常的肆无忌惮，并且在未来不太可能被轻易吓退](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=this%20group%20appears%20to%20be%20unusually%20brazen%2C%20and%20will%20be%20unlikely%20to%20be%20deterred%20going%20forward)。他们说得对。“海龟”并非一次性事件；它证明了 DNS 层面的间谍活动是有效的，并且实施此类活动的人愿意在光天化日之下继续干下去。

## 这带给我们关于 DNS 作为关键基础设施的哪些启示

抛开地缘政治不谈，“海龟”行动留下了一系列关于互联网命名层实际运作方式的令人不安的教训。

1. **DNS 是一条信任链，而您并未掌握全部控制权。** 您的安全防护可能非常出色。但您的域名解析要经过注册商和注册局，如果其中任何一个被攻陷，您的记录就可以在不触及您的网络的情况下被更改。“海龟”行动证明，攻击者会故意针对您可见度最低的信任链环节发起攻击。

2. **有效的证书并不能证明目的地的合法性。** 绿色的安全锁仅证明连接已加密并发送至*当前控制该域名的人*——如果攻击者劫持了 DNS，那么那个人就是他们。域名验证证书的可靠性取决于它们验证所依赖的 DNS 的可靠性。

3. **DNS 操纵对受害者来说几乎是不可见的。** 受害者的机器上没有任何恶意软件运行。端点扫描器也察觉不到任何异常。唯一的信号是记录指向了它们不应该指向的地方——这正是为什么监控 DNS 记录是否存在意外更改并将其锁定如此重要的原因。

4. **注册商和注册局账户安全是国家安全基础设施。** CISA 有史以来的第一份紧急指令，其核心就是关于 DNS 管理账户的凭证。多因素身份验证、注册局锁定以及严格控制对可更改 DNS 记录的账户的访问权限，这些都不是可有可无的“卫生”细节——它们是“真正拥有域名”与“仅仅看起来拥有”之间的区别。

## Namefi 的视角

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-sea-turtle-dns-espionage-03-namefi-angle.jpg)

从根本上说，“海龟”行动是一个关于*谁被允许更改域名记录*的故事——以及当这种权限被悄悄窃取时，外界是多么难以察觉。

传统模式将这种权限集中在注册商和注册局的账户中，而这些账户往往只受密码和电子邮件地址的保护。当这些账户沦陷时，域名的控制权也会随之悄然易主。系统并没有内置独立的、可验证的合法持有者记录，控制权易手时也没有防篡改的痕迹。

[Namefi](https://namefi.io) 认为域名所有权在设计上应是**可验证且防篡改的**，同时需保持与 DNS 的兼容性。将所有权代币化创造了一个可审计、以密码学为锚点的域名控制者记录——这使得未经授权的转移和悄无声息的接管极难在不留下明显痕迹的情况下完成。虽然它本身不能阻止注册局遭遇网络钓鱼，但“海龟”行动带给我们的深刻教训，正是 Namefi 建立的核心理念：域名是关键基础设施，关于*谁真正拥有这个名称*的问题，值得一个比“谁能登录控制面板谁就是主人”更有力的答案。

此次黑客行动利用了*持有*域名与*证明*持有域名之间的鸿沟，从而成功对多国政府的流量进行了重定向。消除这一鸿沟——使所有权可验证、转移可审计、控制连续性可证明——正是命名层当前迫切需要的韧性。

## 资料来源与延伸阅读

- 思科 Talos — [DNS 劫持滥用了对核心互联网服务的信任](https://blog.talosintelligence.com/seaturtle/)
- 思科 Talos — [“海龟”继续游弋，寻找新受害者及 DNS 劫持技术](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/)
- TechCrunch — [一个由国家支持的新黑客组织正以惊人的速度劫持政府域名](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)
- Krebs on Security — [深入探讨近期广泛爆发的 DNS 劫持攻击](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)
- BleepingComputer — [“海龟”行动侧重于 DNS 劫持以攻陷目标](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)
- SecurityWeek — [尽管已曝光，“海龟”的 DNS 劫持仍在继续](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)
- BankInfoSecurity — [报告称：“海龟”DNS 劫持组织进行间谍活动](https://www.bankinfosecurity.com/sea-turtle-dns-hijacking-group-conducts-espionage-report-a-12390)
- CISA — [第 19-01 号紧急指令：缓解 DNS 基础设施篡改](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)
- SDxCentral — [思科 Talos 称某国家是海龟 DNS 劫持攻击的幕后黑手](https://www.sdxcentral.com/articles/news/cisco-talos-says-a-nation-state-is-behind-sea-turtle-dns-hijacking-attacks/2019/04/)
- SecurityWeek — [国家支持的黑客在持续的攻击中使用复杂的 DNS 劫持技术](https://www.securityweek.com/state-sponsored-hackers-use-sophisticated-dns-hijacking-ongoing-attacks/)