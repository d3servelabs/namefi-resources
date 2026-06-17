---
title: 'DNSpionage：将 DNS 武器化以攻击政府的黑客行动'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2018 年底，Cisco Talos 披露了 DNSpionage——这一后来被认为与伊朗利益相关的黑客行动篡改了政府的 DNS 记录，将电子邮件和 VPN 流量重定向至攻击者的服务器，并伪造了有效的 TLS 证书以保持隐蔽。它甚至促使美国政府发布了史上首个此类紧急指令。'
keywords: ['dnspionage', 'DNS 劫持', 'DNS 重定向', 'cisco talos', 'CISA 紧急指令 19-01', 'sea turtle dns', '伊朗 DNS 劫持', 'fireeye DNS 劫持', 'lets encrypt 证书滥用', 'DNS 安全', '域名安全', '国家级网络间谍活动', '缓解 DNS 基础设施篡改']
---

大多数域名灾难都与谁*拥有*一个域名有关。而这一次则关乎谁*控制*它——在 2018 年底的几个月里，中东数十个政府域名的答案是：控制者并非政府。

没有 Web 服务器被攻破。主页上没有恶意软件。没有页面篡改，没有勒索信，应用程序日志中也没有留下确凿证据。攻击者根本不需要“破门而入”。他们从一扇几乎无人把守的大门大摇大摆地走了进去：那就是指示域名电子邮件和网站实际位置的 **DNS 记录**。他们修改了记录——悄无声息地，使用有效的凭据，隐藏在有效的 TLS 证书之后——而全世界的网络流量都毫无怨言地听从了这些新的指令。

Cisco Talos 将其命名为 **DNSpionage**（DNS 间谍活动）。这是有史以来最清晰明了的案例之一，证明了域名系统（DNS）不仅仅是互联网的“管道设施”，它更是国家安全基础设施。

## 将 DNS 作为国家级博弈的武器

要理解为什么 DNSpionage 让各国政府感到恐慌，你必须回想一下 DNS 的实际作用。

每当你向政府部门发送邮件、登录企业 VPN 或加载网页邮件时，你的设备首先会问 DNS 一个问题：*这个名字对应的 IP 地址是多少？* 无论 DNS 回答什么，你都会相信它。你的邮件客户端连接到那里，VPN 在那里进行身份验证，浏览器把会话交接给那里。DNS 是整个互联网的地址簿，而几乎没有任何机制会去检查这本地址簿是否被篡改过。

这正是 DNSpionage 所利用的特性。如果你能修改这条记录——不需要破解加密，不需要破解密码文件，只需更改*指向*——你就可以隐形地站在目标和他们信任的服务之间。电子邮件流经你，VPN 登录流经你。由于受害者自己的域名仍然显示在浏览器地址栏中，一切看起来都完美无缺。

这是在应用层之下的间谍活动。令人不安的是，这也正是大多数安全防护计划默认已经“解决”的一层。

## DNSpionage 攻击行动（2018–2019）

![A vivid colorful concept illustration of a hidden interception room beneath a national switchboard, where a shadowy operator quietly reroutes a country's mail through forged official seals, glowing data cables splitting toward a secret listening post](../../assets/the-dnspionage-campaign-01-campaign.jpg)

在 **2018 年 11 月 27 日**，Cisco Talos 发布了其第一份报告。开篇直奔主题：“[Cisco Talos 最近发现了一个针对黎巴嫩和阿拉伯联合酋长国（UAE）的新攻击行动，该行动影响了众多 .gov 域名以及一家黎巴嫩的私人航空公司](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Cisco%20Talos%20recently%20discovered%20a%20new%20campaign%20targeting%20Lebanon%20and%20the%20United%20Arab%20Emirates)。”

这次行动具有两面性。其中一面是相当普通的恶意软件操作：“[这个特定的攻击行动利用了两个包含虚假招聘信息的恶意网站，通过嵌入宏的恶意 Microsoft Office 文档来攻陷目标](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=This%20particular%20campaign%20utilizes%20two%20fake%2C%20malicious%20websites%20containing%20job%20postings)。” 诱饵网站伪装成真实的招聘方——“[hr-wipro[.]com（随后重定向至 wipro.com）和 hr-suncor[.]com（随后重定向至 suncor.com）](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=hr%2Dwipro)”——并植入了一个定制的远程访问工具，该工具的独特之处在于它能够直接通过 DNS 与其命令服务器进行通信。

但它创造历史的是其第二面。用 Talos 的话来说：“[在另一个独立的攻击行动中，攻击者使用相同的 IP 重定向了合法的 .gov 及私营企业域名的 DNS](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=the%20attackers%20used%20the%20same%20IP%20to%20redirect%20the%20DNS%20of%20legitimate)。” 真正的政府名称服务器被指向了攻击者控制的机器：“[属于黎巴嫩和阿联酋公共部门以及黎巴嫩部分公司的多个名称服务器显然遭到入侵，其控制下的主机名被指向了攻击者控制的 IP 地址](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Multiple%20nameservers%20belonging%20to%20the%20public%20sector)。”

伪造的招聘网站看起来像是普通的网络犯罪。而 DNS 重定向这部分则暴露出了国家级博弈的影子。

当独立研究人员顺藤摸瓜查清真相时，其影响范围远超两个国家。Brian Krebs 从攻击者的 IP 地址反向追踪，发现“[在 2018 年的最后几个月里，DNSpionage 背后的黑客成功入侵了 50 多家中东公司和政府机构的 DNS 基础设施的关键组件](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=in%20the%20last%20few%20months%20of%202018%20the%20hackers%20behind%20DNSpionage%20succeeded)。”

## 目标是谁，以及风险何在

受害者名单读起来就像该地区神经网络的地图：外交部、民航机构、电信运营商、互联网基础设施，以及国家财政部的网页邮件系统。这些绝非随机目标，它们是一个国家机密信息流经的中枢神经。

在 Talos 发布首份报告两个月后，FireEye（现为 Mandiant）发布了自己的分析报告，对攻击源头做出了明确而严谨的归因。正如 FireEye 所言：“[初步研究表明，负责此行动的攻击者与伊朗有关联](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/#:~:text=initial%20research%20suggests%20the%20actor%20or%20actors%20responsible%20have%20a%20nexus%20to%20Iran)。” SecurityWeek 在报道 FireEye 的调查结果时指出，基于技术证据以及该行动与伊朗政府利益相吻合的事实，该公司“[以中等置信度](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=moderate%20confidence)”评估伊朗是此次攻击的幕后黑手。

巨大的风险直接源于目标本身。当你能够以明文读取一国外交部的电子邮件时，你并不是在窃取数据——你几乎是在实时读取一个政府的大脑。这就是为什么在 DNS 层进行的凭据窃取行动应被准确定位为针对国家的情报收集，而非普通的网络欺诈。

## 攻击如何发生：DNS 记录 + 有效证书 + 虚假招聘网站

![A vivid colorful concept illustration of a national mail switchboard being silently re-patched — glowing address cards being swapped on a giant routing wall, each rerouted line passing through a forged green padlock seal before reaching a hidden listening booth](../../assets/the-dnspionage-campaign-02-dns-redirection.jpg)

这部分值得我们放慢脚步细细拆解，因为其采用的技术可谓是“恶毒的优雅”。整个过程分为三步。

**第一步：拿到地址簿的钥匙。** 攻击者并没有破解 DNS 密码学。他们只是直接“登录”了系统。FireEye 描述了两种路径：“[一种方法是使用被窃取的凭据登录 DNS 提供商的管理界面，并更改 DNS A 记录，以拦截电子邮件流量。另一种方法是在侵入受害者的域名注册商账户后更改 DNS NS 记录](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=One%20method%20involves%20logging%20into%20a%20DNS%20provider)。” 被盗的注册商和 DNS 主机凭据成为了“万能钥匙”。谁拥有了注册商的登录权限，谁就拥有了域名——而域名则控制着指向它的所有内容。

**第二步：重定向流量但保持其正常运作。** 通常情况下，将政府的邮件服务器指向你自己的 IP 会导致服务中断并触发警报。因此，攻击者使用了代理技术。流量被捕获后会继续被转发到真正的目的地，因此用户看到的依然是一个能正常工作的收件箱和 VPN。正如 FireEye 描述的第三种变体：“[用户被重定向到了攻击者控制的基础设施](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=users%20were%20redirected%20to%20attacker%2Dcontrolled%20infrastructure)。” 这种拦截是一种悄无声息进行转发的中间人攻击——它之所以隐形，正是因为没有任何系统看起来出现了故障。

**第三步：击败“绿色挂锁”（HTTPS）。** 现代服务使用 TLS，当流量抵达错误的服务器时，本应立刻抛出证书警告。攻击者通过伪造属于自己的合法证书堵住了这个漏洞。Talos 发现，“[在每次入侵 DNS 期间，攻击者都会精心为被重定向的域名生成 Let's Encrypt 证书](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=During%20each%20DNS%20compromise%2C%20the%20actor%20carefully%20generated)。” 因为他们当时控制了该域名的 DNS，所以能够向证书颁发机构（CA）*证明*控制权——而自动化的域名验证过程则向他们颁发了有效的证书。FireEye 在多种攻击方式中均证实了同一模式：“[在这两种情况下，攻击者都使用了 Let's Encrypt 证书以避免引起怀疑](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=in%20both%20cases%20the%20attackers%20used%20Let%E2%80%99s%20Encrypt%20certificates)。”

用 Krebs 的总结来说，结果是全盘失守的：“[这些 DNS 劫持也为攻击者获取目标域名（如 webmail.finance.gov.lb）的 SSL 加密证书铺平了道路，这使他们能够解密被拦截的电子邮件和 VPN 凭据，并以明文形式查看它们](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=these%20DNS%20hijacks%20also%20paved%20the%20way%20for%20the%20attackers%20to%20obtain%20SSL%20encryption%20certificates)。” 电子邮件和 VPN 登录信息被捕获并被读取，而在此期间始终显示着有效的安全挂锁图标。

请注意这个过程中*不需要*的东西。没有零日漏洞。受害者自己的服务器上没有恶意软件。没有被攻破的防火墙。这次攻击完全生存在“我拥有这个域名”和“我能证明目前是谁控制着它的记录”之间的盲区。这就是 DNSpionage 栖身之地——而且这个盲区比大多数组织想象的要宽广得多。

## 应对措施：CISA 紧急指令 19-01

Talos 和 FireEye 的联合披露在华盛顿引起了极大震动。在 **2019 年 1 月 22 日**，美国网络安全和基础设施安全局（CISA）发布了 **第 19-01 号紧急指令：“缓解 DNS 基础设施篡改（Mitigate DNS Infrastructure Tampering）”**——这是 CISA 发布的首个紧急指令，也是一项对整个联邦民事政府具有约束力的罕见行政命令。

该指令给出的诊断结果与研究人员的调查完全一致。正如当时报道引述的那样，CISA 警告称“[攻击者重定向并拦截了网络和邮件流量，而且可能对其他网络服务如法炮制](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=redirected%20and%20intercepted%20web%20and%20mail%20traffic)”，并且这些攻击者“[入侵了负责政府 DNS 域名的管理员账户](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=compromised%20the%20accounts%20of%20administrators)”。

随后，它下令在 10 天内完成四项行动——这些行动读起来就像是对攻击者三个步骤的直接反击：

1. **审计 DNS 记录**——验证权威服务器和辅助服务器上的内容是否被篡改。
2. **更改 DNS 账户密码**——轮换能够修改 DNS 的每一个凭据。
3. **添加多因素身份验证**到所有 DNS 管理员账户——让被盗的密码不再是畅通无阻的万能钥匙。
4. **监控证书透明度（CT）日志**——密切关注为你的域名颁发但你从未请求过的证书。

这第四项是关键所在。CISA 不仅是在告诉各机构要锁好门，它还在告诉他们要盯紧公共证书账本，寻找是否有人已经使用备用钥匙的证据。DNSpionage 将证书透明度（Certificate Transparency）从一个冷门的 PKI（公钥基础设施）功能，变成了防范国家级 DNS 劫持的一线检测工具。

Krebs 清楚地捕捉到了当时那种不同寻常的氛围：“[美国国土安全部发布了一项罕见的紧急指令，命令所有美国联邦民事机构保护其互联网域名记录的登录凭据安全](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=issued%20a%20rare%20emergency%20directive%20ordering%20all%20U.S.%20federal%20civilian%20agencies)。”

促发这一指令的并不只有 DNSpionage。一个并行的、甚至更具攻击性的被 Talos 称为 **Sea Turtle**（海龟）的行动——Talos 将其描述为“[已知首例域名注册机构被黑客入侵用于网络间谍活动的案例](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=first%20known%20case%20of%20a%20domain%20name%20registry%20organization%20that%20was%20compromised)”，打击了“[遍布 13 个不同国家的约 40 个不同组织](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=approximately%2040%20different%20organizations%20across%2013%20different%20countries)”——进一步推高了安全风险。Talos 小心翼翼地将这两者区分开来；在其 2019 年 4 月的跟进报告中，Talos 指出 DNSpionage 的行为“[很可能会继续将该攻击者与 Sea Turtle 等更令人担忧的攻击行动区分开来](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/#:~:text=will%20likely%20continue%20to%20distinguish%20this%20actor%20from%20more%20concerning%20campaigns%20like%20Sea%20Turtle)”。这两场行动结合在一起，从不同的角度说明了同一点：DNS 供应链已经成为国家间冲突的战场。

## 关于 DNS 作为国家安全基础设施，这教会了我们什么

DNSpionage 缺少恶意软件那种扣人心弦的戏剧性，但却留下了许多令人不安的惨痛教训。以下几点值得铭记：

- **注册商账户是王冠上的明珠。** 域名下游的一切（邮件、Web、VPN、单点登录、证书颁发）都继承了对能够修改其 DNS 的人的信任。该账户只有一个密码而没有第二重认证因素，这绝非一个小漏洞；这等于敞开了整个城堡的大门。正是出于这个原因，CISA 的首要指示是关于*凭据*，而不是防火墙。
- **有效的证书并不是合法性的证明。** 绿色的挂锁只能证明流量在发往*目前控制该域名的人*时是加密的。如果攻击者控制了 DNS，自动化的域名验证机制就会“乐意”地向他们颁发真实的证书。对 TLS 的信任源于对 DNS 的信任——而 DNS 比大多数人想象的要脆弱得多。
- **DNS 攻击在设计上就是隐形的。** 因为代理转发了真实的流量，受害者的服务依旧保持运转。没有服务中断需要调查。唯一的外部信号可能是一张出现在公共 CT 日志中的证书——这也是为什么监控这些日志一夜之间从可选变成了强制要求。
- **域名控制权就是国家安全控制权。** 当修改一国外交部 DNS 的实体是一个敌对国家时，“IT 运维”和“反情报行动”之间的界限便荡然无存。互联网的地址簿是真正的战略高地。

贯穿始终的只有一条主线，即一个几乎没有任何运维工具能实时回答的问题：**现在究竟是谁控制着这个域名，我能证明它没有被悄悄篡改过吗？** DNSpionage 之所以能够得手，正是因为这个问题太难回答，以至于整个地区的政府都无法给出答案。

## Namefi 的视角

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-dnspionage-campaign-03-namefi-angle.jpg)

从根本上说，DNSpionage 是一个**来源与溯源（Provenance）**问题。攻击者从未拥有过目标域名。他们通过窃取凭据借用了域名的控制权，使注册商和 DNS 主机面板能够进行隐蔽的、不可验证的编辑——而系统内没有任何机制能够标记*控制方*已经易主。

[Namefi](https://namefi.io) 的创立前提是：域名的所有权和控制权应当是**可验证、可移植且防篡改的**，而不是被锁定在一个不透明的注册商登录后台中。代币化的所有权使“谁控制这个域名”成为一个你可以检查和审计的事实，而不是一个埋藏在密码背后的设置（而这个密码可能已经落在别人手里）。这并不能取代注册商账户的安全卫生或多因素身份验证——CISA 的建议依然完全正确——但它直击了 DNSpionage 所利用的更深层的漏洞：要独立、持续地*证明*目前控制域名的实体就是其应有的合法所有者，是一件异常困难的事情。

DNSpionage 的教训不在于 DNS 存在某种极其特殊的脆弱性。而在于这样一个事实：长期以来，关于域名最重要的一点——谁控制它——竟然只靠一个可能被盗的密码在守护。让这一事实变得可验证，正是问题的关键所在。

## 资料来源与扩展阅读

- Cisco Talos — [DNSpionage Campaign Targets Middle East](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/) (2018 年 11 月 27 日)
- Cisco Talos — [DNSpionage brings out the Karkoff](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/) (2019 年 4 月 23 日)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (2019 年 2 月 18 日)
- The Register — [Baddies linked to Iran fingered for DNS hijacking to read Middle Eastern regimes' emails](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/) (2019 年 1 月 10 日)
- SecurityWeek — [Iran-Linked DNS Hijacking Attacks Target Organizations Worldwide](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/) (2019 年 1 月 10 日)
- BleepingComputer — [DHS Issues Emergency Directive to Prevent DNS Hijacking Attacks](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/) (2019 年 1 月)
- Network World — [Cisco Talos details exceptionally dangerous DNS hijacking attack](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html) (2019 年 4 月 17 日)
- Network World — [Cisco: DNSpionage attack adds new tools, morphs tactics](https://www.networkworld.com/article/967303/cisco-dnspionage-attack-adds-new-tools-morphs-tactics.html)
- CERT-IST — [DNSpionage and DNS data hijacking](https://www.cert-ist.com/public/en/SO_detail?format=html&code=dnspionage)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) (2019 年 1 月 22 日)