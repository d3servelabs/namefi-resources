---
title: '海龟行动：劫持 DNS 对政府实施间谍活动的国家支持攻击'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2019 年 Cisco Talos 披露的国家支持行动"海龟"，通过入侵域名注册商、注册局和 DNS 服务商来劫持 DNS，将政府机构、部委和能源企业的流量重定向至攻击者控制的服务器，伪造有效证书，甚至入侵了国家级顶级域名注册局。'
keywords: ['海龟 DNS 劫持', 'cisco talos 海龟行动', 'DNS 劫持攻击', '国家支持 DNS 攻击', '注册局入侵', '注册商入侵', 'DNS 间谍活动', 'lets encrypt 中间人证书', 'netnod 入侵', 'ics-forth 希腊 ccTLD', 'cisa 紧急指令 19-01', 'DNS 安全', '域名所有权安全', '国家级网络攻击']
relatedArticles:
  - /zh/blog/the-dnspionage-campaign/
  - /zh/blog/the-fox-it-dns-hijack/
  - /zh/blog/the-godaddy-multi-year-breach/
  - /zh/blog/the-myetherwallet-bgp-dns-attack/
  - /zh/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /zh/topics/domain-security/
  - /zh/topics/domain-basics/
relatedSeries:
  - /zh/series/domain-apocalypse/
  - /zh/series/name-change-game-change/
relatedGlossary:
  - /zh/glossary/dns/
  - /zh/glossary/registrar/
  - /zh/glossary/tld/
  - /zh/glossary/icann/
  - /zh/glossary/registry/
---

大多数网络攻击试图从外部*渗入*目标。而"海龟"行动所做的事情更为隐蔽，也危险得多：它入侵的是告诉整个互联网目标所在位置的那张**地图**。

当你输入某个政府部委的网址，或向其官员发送电子邮件时，你的计算机首先要向[域名系统](/zh/glossary/dns/)（DNS）查询，将这个人类可读的名称转换成对应服务器的数字地址。这一查询步骤是如此基础，以至于互联网上几乎没有任何机制去验证它。我们只是简单地信任：这个名称会解析到它应该指向的地方。海龟行动的操作者深刻理解这种信任，并花费了两年多的时间利用这种信任，对中东和北非各国政府实施间谍活动。

2019 年 4 月，Cisco Talos 披露了"海龟"行动。这是我们所见过的最清晰的案例之一，展示了 DNS 本身如何被作为国家级间谍活动的工具而武器化。攻击者并非对个别员工实施网络钓鱼然后碰运气，而是将矛头对准了位于目标*上方*的[注册商](/zh/glossary/registrar/)、注册局和 DNS 服务商——那些控制着名称如何解析的机构——并以此为据点，重定向整个组织的流量、窃取凭据，并伪造了本应让身份冒充无从遁形的密码学证书。

## 作为国家级间谍攻击目标的 DNS

DNS 有时被称为互联网的电话簿，但这个比喻低估了它的重要性。它更像是邮政路由系统：每封电子邮件、每次登录、每个 API 调用都始于名称解析。如果你控制了解析，你就控制了目的地——你可以无形地坐在双方都以为私密直连的对话中间。

这使 DNS 几乎成为完美的间谍攻击目标。入侵一个 DNS 服务商，便可以暴露依赖它的每个组织的流量。与终端设备上的恶意软件不同，DNS 操控不会碰触受害者自己的机器：没有什么可以扫描，没有什么可以隔离。记录就这样悄然指向了新的地方。

Talos 直白地描述了这一机制。他们的报告指出，[DNS 劫持发生在攻击者能够非法修改 DNS 名称记录，将用户引导至攻击者控制的服务器时](https://blog.talosintelligence.com/seaturtle/#:~:text=DNS%20hijacking%20occurs%20when%20the%20actor%20can%20illicitly%20modify%20DNS%20name%20records%20to%20point%20users%20to%20actor%2Dcontrolled%20servers)。描述简单，实际破坏力却极具毁灭性。

## 海龟行动（2017–2019）

![关于海龟行动的概念艺术图：一个国家级威胁行为者以海龟剪影的形式悄然重新路由发光箭头，穿越一幅区域地图，霓虹网络线弯向隐藏的服务器](../../assets/the-sea-turtle-dns-espionage-01-campaign.jpg)

海龟行动并非一次打砸抢式的攻击。Talos 评估认为，[该持续行动很可能早在 2017 年 1 月就已开始，并持续至 2019 年第一季度](https://blog.talosintelligence.com/seaturtle/#:~:text=The%20ongoing%20operation%20likely%20began%20as%20early%20as%20January%202017%20and%20has%20continued%20through%20the%20first%20quarter%20of%202019)——超过两年的耐心、持续行动。

在这段时间里，据 Talos 统计，[此次行动共入侵了 13 个不同国家的至少 40 个不同组织](https://blog.talosintelligence.com/seaturtle/#:~:text=at%20least%2040%20different%20organizations%20across%2013%20different%20countries%20were%20compromised%20during%20this%20campaign)。TechCrunch 总结了其影响范围：该组织在超过两年时间里[将 13 个国家的 40 个政府和情报机构、电信公司及互联网巨头列为攻击目标](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)，受害者分布在[亚美尼亚、埃及、土耳其、瑞典、约旦和阿联酋](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)等国。

Talos 未公开将此次行动归因于某一特定政府，但对攻击者的能力水平表示有把握。Cisco Talos 的 Craig Williams 向 TechCrunch 表示，[这是一个以前所未见的相对独特方式运作的新组织，使用了新的战术、技术和程序](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)，团队评估该组织的[主要动机是实施间谍活动](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)。

## 攻击对象及其风险

受害者名单读起来像一份情报收集清单。Talos 确认主要目标为[国家安全机构、外交部以及重要能源组织](https://blog.talosintelligence.com/seaturtle/#:~:text=national%20security%20organizations%2C%20ministries%20of%20foreign%20affairs%2C%20and%20prominent%20energy%20organizations)——正是那些敌对国家最想窃听其内部通信的机构。

第二层受害者在某种意义上更能说明问题。Talos 发现，攻击者还入侵了[众多 DNS 注册商、电信公司和互联网服务提供商](https://blog.talosintelligence.com/seaturtle/#:~:text=numerous%20DNS%20registrars%2C%20telecommunication%20companies%2C%20and%20internet%20service%20providers)。这些并非最终目标，而是*手段*。通过掌控基础设施提供商，攻击者获得了操控下游真实目标 DNS 的杠杆。

BleepingComputer 的摘要清晰地呈现了最终目的：主要目标是[外交部、军事组织、情报机构、能源公司](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)。当你能够无声地拦截外交部的电子邮件和登录流量时，根本无需破解加密——只需收获凭据，在邮件流过时直接阅读即可。

## 攻击手法：劫持信任链

![概念艺术图：一个中间人角色拦截发光的政府信封流，在每封上盖上伪造的绿色印章后再传递出去，两把面对面的挂锁横跨一条断裂的管道](../../assets/the-sea-turtle-dns-espionage-02-registry-compromise.jpg)

海龟行动之所以异常复杂，正在于攻击者很少直接攻击受害者，而是沿着信任链向上攀爬。

Talos 重建并经独立报道证实的攻击模式大致如下：首先，通过鱼叉式网络钓鱼或利用已知漏洞，在 DNS 服务商、注册商或[注册局](/zh/glossary/registry/)取得立足点。有了访问权限后，[修改 DNS 记录，将目标的合法用户重定向至攻击者控制的服务器](https://blog.talosintelligence.com/seaturtle/#:~:text=Modified%20DNS%20records%20to%20point%20legitimate%20users%20of%20the%20target%20to%20actor%2Dcontrolled%20servers)。这些服务器被设置为中间人层：据 BleepingComputer 报道，[海龟行动的操作者构建了一套中间人（MitM）框架，冒充受害者使用的合法服务，目的是窃取登录凭据](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)。受害者登录的是看起来正常的邮件或 VPN 门户，而攻击者则会[在用户与这些攻击者控制的服务器交互时捕获合法用户凭据](https://blog.talosintelligence.com/seaturtle/#:~:text=Captured%20legitimate%20user%20credentials%20when%20users%20interacted%20with%20these%20actor%2Dcontrolled%20servers)，然后悄悄转发至真实服务，让一切看起来正常无异。

最聪明、也最令人警惕的环节在于他们如何绕过了"小绿锁"。重定向流量是一回事；在不触发浏览器证书警告的情况下做到这一点又是另一回事。海龟行动通过为所冒充的域名获取真实有效的证书来解决这一问题。Talos 发现攻击者[从其他服务商获取了针对同一域名的由证书颁发机构签名的 X.509 证书](https://blog.talosintelligence.com/seaturtle/#:~:text=obtained%20a%20certificate%20authority%2Dsigned%20X.509%20certificate)，并指出[这些攻击者在其 MitM 服务器上使用了 Let's Encrypt、Comodo、Sectigo 及自签名证书](https://blog.talosintelligence.com/seaturtle/#:~:text=use%20Let%27s%20Encrypts%2C%20Comodo%2C%20Sectigo%2C%20and%20self%2Dsigned%20certificates)。由于他们控制了 DNS 记录，便能通过免费证书颁发机构所依赖的自动域名验证检查——并最终为一个他们并不拥有的域名拿到合法的绿色小锁。

Brian Krebs 在记录密切相关的早期攻击浪潮时描述了同样的手法：攻击者[似乎修改了这些域名的 DNS 记录，使其指向他们控制的欧洲服务器](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)，并随后[成功从 SSL 服务商 Comodo 和/或 Let's Encrypt 为这些域名获得了 SSL 证书](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)。被引用的受害者之一是[mail.gov.ae，负责处理阿联酋政府机构的电子邮件](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)。

### 注册局入侵

此次行动的最高峰是入侵了那些不仅*使用* DNS，而且为整个国家*运营* DNS 的组织。

第一个公开确认的案例涉及瑞典的 Netnod。据 Krebs 报道，攻击者[获取了 Netnod 域名注册商账户的访问权限](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)，Netnod 自身也声明[于 1 月 2 日得知其在攻击中扮演的角色](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)。关键在于，Netnod 并非最终目的地——它是一扇门。BleepingComputer 指出，Netnod 表示[他们并非攻击目标，而是攻击者"获取互联网服务登录信息"的通道](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)。

Talos 用严峻的措辞描述了这一事件更广泛的意义：这些操作者[负责实施了第一个公开确认的针对管理根服务器区域的组织的攻击案例](https://blog.talosintelligence.com/seaturtle/#:~:text=responsible%20for%20the%20first%20publicly%20confirmed%20case%20against%20an%20organizations%20that%20manages%20a%20root%20server%20zone)。当运营互联网核心地址簿一部分的机构都可以被悄然冒充时，DNS 默认可信的假设便不再成立。

## 应对与后续：他们并未停手

如此大规模的 [DNS 劫持](/zh/glossary/dns-hijacking/)引发了官方回应。2019 年 1 月，美国网络安全和基础设施安全局（CISA）发布了[紧急指令 19-01《缓解 DNS 基础设施篡改》](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)——这是 CISA 有史以来发布的第一份紧急指令——命令联邦机构审计其 DNS 记录、更改 DNS 管理账户的凭据，并为这些账户启用多因素认证。这在某种程度上承认了 DNS 管理已成为国家安全的前线阵地。

然而，海龟行动最令人震惊之处，是曝光*之后*发生的事情。大多数行动一旦被 Talos 等供应商公开其技战术便会偃旗息鼓。海龟行动却恰恰相反。

2019 年 7 月的后续报告中，Talos 披露该组织又发现了新的受害者，包括[一个国家代码顶级域名（ccTLD）注册局，该机构管理着使用该特定国家代码的每一个域名的 DNS 记录](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=a%20country%20code%20top%2Dlevel%20domain%20%28ccTLD%29%20registry)。具体而言，[希腊计算机科学研究所暨技术与研究基金会（ICS-Forth），即希腊的 ccTLD](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=The%20Institute%20of%20Computer%20Science%20of%20the%20Foundation%20for%20Research%20and%20Technology%20%2D%20Hellas%20%28ICS%2DForth%29%2C%20the%20ccTLD%20for%20Greece)——运营 `.gr` 命名空间的机构——遭到入侵。SecurityWeek 注意到，即使在 ICS-Forth 公开承认泄露之后，[Cisco 的遥测数据证实该入侵又持续了至少五天](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)。

Talos 对该组织的评估异常直率：[该组织似乎格外大胆，未来不太可能受到威慑而罢手](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=this%20group%20appears%20to%20be%20unusually%20brazen%2C%20and%20will%20be%20unlikely%20to%20be%20deterred%20going%20forward)。他们是对的。海龟行动并非一次性事件，它证明了 DNS 层面的间谍攻击切实可行，而实施者愿意在公开曝光后继续行动。

## 这对 DNS 作为关键基础设施的启示

剥去地缘政治的外壳，海龟行动留下的是一组关于互联网命名层真实运作方式的令人不安的教训。

1. **DNS 是一条信任链，而你并不控制其全部。** 你自己的安全可能无懈可击。但你域名的解析要经过注册商和注册局，若其中任一被入侵，你的记录就可能在完全不触及你的网络的情况下被篡改。海龟行动证明，攻击者会刻意瞄准信任链中你能见度最低的那个环节。

2. **有效证书并不能证明目的地合法。** 绿色小锁证明连接已加密至*当前控制该域名的任何人*——如果攻击者已劫持 DNS，那就是他们。域名验证型证书的可信度，仅取决于其验证所依赖的 DNS 的可信度。

3. **DNS 操控对受害者几乎是不可见的。** 受害者的机器上没有运行任何恶意软件，终端扫描器什么也看不到。唯一的信号是记录指向了不该指向的地方——这正是为什么监控 DNS 记录的意外变化、并对其加以锁定如此重要。

4. **注册商和注册局账户安全是国家安全基础设施。** CISA 有史以来第一份紧急指令，从根本上说是关于 DNS 管理账户的凭据安全。多因素认证、注册局锁定以及严格管控能够修改 DNS 记录的账户的访问权限，并非可有可无的安全卫生举措——它们是真正拥有一个域名与仅仅表面上拥有之间的分水岭。

## Namefi 的视角

![彩色插图，呈现可验证、防篡改的域名所有权——一张由绿色盾牌保护的域名卡片、一枚绿色 Namefi 代币以及 DNS 连续性](../../assets/the-sea-turtle-dns-espionage-03-namefi-angle.jpg)

海龟行动从根本上说是一个关于*谁被允许更改域名记录*的故事——以及外界有多难察觉这种权限已被悄然窃取。

传统模式将这一权限集中于注册商和注册局账户，而这些账户往往仅靠一个密码和一个电子邮件地址来保护。当这些账户沦陷，域名的控制权也随之悄然易手。没有内置的、可独立核实的记录来证明谁是某个名称的合法持有者，控制权易手时也没有防篡改的痕迹。

[Namefi](https://namefi.io) 将[域名所有权](/zh/glossary/domain-ownership/)视为一种应当在设计上**可验证且防篡改**、同时与 DNS 保持兼容的东西。通过代币化所有权，为谁控制某个域名创建了一份可审计、以密码学为锚点的记录——使未经授权的转移和无声接管在不留下明显痕迹的情况下难以得逞。这本身并不能阻止注册局遭受钓鱼攻击。但海龟行动强调的更广泛教训，正是 Namefi 的立足之本：域名是关键基础设施，而*谁真正拥有这个名称*这一问题，理应得到比"能登录控制面板的人"更有力的回答。

此次攻击行动通过利用*持有*域名与*证明*持有域名之间的落差来重定向各国政府的流量。弥合这一落差——让所有权可验证、转移可审计、控制连续性可证明——正是命名层至今仍需的那种韧性。

## 来源及延伸阅读

- Cisco Talos — [DNS Hijacking Abuses Trust In Core Internet Service](https://blog.talosintelligence.com/seaturtle/)
- Cisco Talos — [Sea Turtle keeps on swimming, finds new victims, DNS hijacking techniques](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/)
- TechCrunch — [A new state-backed hacker group is hijacking government domains at a phenomenal pace](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)
- BleepingComputer — ['Sea Turtle' Campaign Focuses on DNS Hijacking to Compromise Targets](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)
- SecurityWeek — [Sea Turtle's DNS Hijacking Continues Despite Exposure](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)
- BankInfoSecurity — ['Sea Turtle' DNS Hijacking Group Conducts Espionage: Report](https://www.bankinfosecurity.com/sea-turtle-dns-hijacking-group-conducts-espionage-report-a-12390)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)
- SDxCentral — [Cisco Talos Says a Nation State Is Behind Sea Turtle DNS Hijacking Attacks](https://www.sdxcentral.com/articles/news/cisco-talos-says-a-nation-state-is-behind-sea-turtle-dns-hijacking-attacks/2019/04/)
- SecurityWeek — [State-Sponsored Hackers Use Sophisticated DNS Hijacking in Ongoing Attacks](https://www.securityweek.com/state-sponsored-hackers-use-sophisticated-dns-hijacking-ongoing-attacks/)
