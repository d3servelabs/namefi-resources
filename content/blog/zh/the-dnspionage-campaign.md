---
title: 'DNSpionage：将 DNS 武器化、针对各国政府的间谍行动'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2018 年底，Cisco Talos 披露了 DNSpionage——一场后来被证实与伊朗利益相关的行动。攻击者篡改政府 DNS 记录，将电子邮件和 VPN 流量重定向至攻击者服务器，并申请有效的 TLS 证书以掩人耳目。这场行动促使美国政府发布了有史以来第一份同类紧急指令。'
keywords: ['dnspionage', 'dns劫持', 'dns重定向', 'cisco talos', 'cisa紧急指令19-01', 'sea turtle dns', '伊朗dns劫持', 'fireeye dns劫持', 'lets encrypt证书滥用', 'dns安全', '域名安全', '国家级网络间谍', '缓解dns基础设施篡改']
---

大多数域名灾难的核心是：谁*拥有*某个名字。而这次行动的核心是：谁*控制*它——在 2018 年底的数个月里，中东数十个政府域名的控制权答案是：并非这些政府本身。

没有 Web 服务器遭到入侵，没有主页被植入恶意软件，没有篡改页面，没有勒索信息，应用日志里也没有任何明显的蛛丝马迹。攻击者根本无需破门而入。他们穿过了几乎无人把守的那扇门：**[DNS](/zh/glossary/dns/) 记录**——那条告诉全世界某个域名的邮件和网站究竟在哪里的记录。他们悄悄地、凭借有效凭据、躲在有效 TLS 证书的掩护下修改了这条记录——世界各地的流量便毫无怨言地按新指令奔涌而去。

Cisco Talos 将此次行动命名为 **DNSpionage**。它是有史以来最清晰的案例之一，证明域名系统不仅仅是技术管道，它是国家安全基础设施。

## DNS 作为国家治理的武器

要理解 DNSpionage 为何令各国政府震惊，必须先回想 DNS 究竟做了什么。

每当你向某个政府部门发送邮件、登录企业 VPN，或打开一个网页邮箱，你的设备首先会向 DNS 提问：*这个名字对应哪个 [IP 地址](/zh/glossary/ip-address/)？* 无论 DNS 如何回答，你都会信任它。你的邮件客户端连向那里，VPN 在那里完成认证，浏览器在那里交出会话凭据。DNS 是整个互联网的地址簿，而几乎没有任何机制会核实这本地址簿是否被人修改过。

这正是 DNSpionage 所利用的属性。如果你能改变记录——不需要破解加密，不需要暴力破解密码文件，只需更改那个*指针*——你就能悄无声息地站在目标与其信任的服务之间。电子邮件流经你，VPN 登录流经你。而由于受害者自己的域名仍然显示在浏览器地址栏中，一切看起来都毫无异常。

这是在应用层之下进行的间谍活动，也恰恰是大多数安全方案将其视为"已解决问题"的那一层。

## DNSpionage 行动（2018–2019）

![一幅生动的彩色概念插图：国家电话交换台之下隐藏着一间截听室，一名神秘的操作员悄悄地将整个国家的邮件通过伪造的官方印章重新路由，发光的数据线在秘密监听站分叉](../../assets/the-dnspionage-campaign-01-campaign.jpg)

**2018 年 11 月 27 日**，Cisco Talos 发布了第一份报告，开篇即点明目标："[Cisco Talos 近日发现一个针对黎巴嫩和阿拉伯联合酋长国（UAE）的新行动，波及 .gov 域名以及一家黎巴嫩私营航空公司](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Cisco%20Talos%20recently%20discovered%20a%20new%20campaign%20targeting%20Lebanon%20and%20the%20United%20Arab%20Emirates)。"

这次行动呈现出两副面孔。一副是相当普通的恶意软件行动："[此次行动使用了两个包含招聘广告的虚假恶意网站，通过内嵌宏的恶意 Microsoft Office 文档来攻陷目标](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=This%20particular%20campaign%20utilizes%20two%20fake%2C%20malicious%20websites%20containing%20job%20postings)。"诱饵网站冒充真实招聘机构——"[hr-wipro[.]com（并重定向至 wipro.com）和 hr-suncor[.]com（并重定向至 suncor.com）](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=hr%2Dwipro)"——并植入一款定制的远程访问工具，该工具的显著特点是可通过 DNS 本身与指挥服务器通信。

而另一副面孔才是载入史册的部分。用 Talos 的话来说："[在一项独立行动中，攻击者使用同一个 IP 地址重定向了合法 .gov 域名及私营企业域名的 DNS](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=the%20attackers%20used%20the%20same%20IP%20to%20redirect%20the%20DNS%20of%20legitimate)。"真实的政府域名服务器被指向攻击者控制的机器："[黎巴嫩和 UAE 公共部门以及黎巴嫩部分企业的多台域名服务器显然遭到入侵，其控制下的主机名被指向攻击者控制的 IP 地址](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Multiple%20nameservers%20belonging%20to%20the%20public%20sector)。"

那些虚假招聘网站看起来像普通网络犯罪，而 DNS 重定向则具有国家行为的色彩。

当独立研究人员顺藤摸瓜完成追溯后，行动的波及范围远超两个国家。Brian Krebs 从攻击者 IP 地址反向追踪，发现"[2018 年最后几个月，DNSpionage 幕后黑手成功入侵了中东逾 50 家企业和政府机构的关键 DNS 基础设施](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=in%20the%20last%20few%20months%20of%202018%20the%20hackers%20behind%20DNSpionage%20succeeded)。"

## 攻击目标与风险等级

受害者名单犹如一张地区神经系统地图：外交部、民航局、电信运营商、互联网基础设施提供商，以及某国财政部的网页邮箱。这些绝非随机目标，而是一个国家机密信息流经电缆的要害之处。

Talos 首份报告发布两个月后，FireEye（现已更名为 Mandiant）发布了独立分析报告，并给出了审慎而明确的归因。正如 FireEye 所言，"[初步研究表明，幕后行为者与伊朗存在关联](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/#:~:text=initial%20research%20suggests%20the%20actor%20or%20actors%20responsible%20have%20a%20nexus%20to%20Iran)。"SecurityWeek 在报道 FireEye 调查结果时指出，该公司以"[中等可信度](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=moderate%20confidence)"评估伊朗是攻击主体，依据是技术证据以及该行动与伊朗政府利益高度吻合。

攻击目标的性质直接决定了风险等级。当你能够以明文读取某个外交部的电子邮件，你并非在窃取数据，而是近乎实时地洞悉一国政府的心思。正因如此，在 DNS 层面实施的凭据窃取行动不应被视为一般欺诈，而应被理解为针对国家的情报收集。

## 攻击手法：DNS 记录 + 有效证书 + 虚假招聘网站

![一幅生动的彩色概念插图：国家邮件交换台正被悄然重新接线——发光的地址卡片在巨型路由墙上被替换，每条重路由的线路在抵达隐藏监听站之前都通过了一枚伪造的绿色锁形印章](../../assets/the-dnspionage-campaign-02-dns-redirection.jpg)

以下是值得细细品味的部分，因为这套技术的精妙令人不寒而栗。整个过程分三步走。

**第一步：拿到地址簿的钥匙。** 攻击者没有破解 DNS 密码学，他们直接登录了系统。FireEye 描述了两条路径："[一种方法是使用窃取的凭据登录 DNS 提供商的管理界面并修改 DNS A 记录，以拦截电子邮件流量。另一种方法是入侵受害者的域名注册商账户后修改 DNS NS 记录](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=One%20method%20involves%20logging%20into%20a%20DNS%20provider)。"被盗的[注册商](/zh/glossary/registrar/)和 DNS 托管商凭据就是万能主密钥。掌握注册商登录凭据，就掌握了域名——而域名掌控着指向它的一切。

**第二步：重路由流量，同时维持服务正常运行。** 将政府邮件服务器指向自己的 IP 通常会造成中断并触发警报。为此，攻击者搭建了代理。流量在被截获后会被转发至真实目的地，因此用户看到的是正常运作的收件箱和 VPN。FireEye 在描述第三种变体时写道："[用户被重定向至攻击者控制的基础设施](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=users%20were%20redirected%20to%20attacker%2Dcontrolled%20infrastructure)。"这种中间人拦截悄无声息地转发流量——正因为没有任何服务中断，所以无迹可寻。

**第三步：破解绿色挂锁。** 现代服务使用 TLS，当流量落在错误服务器上时理应触发证书警告。攻击者通过自行申请合法证书封堵了这一漏洞。Talos 发现，"[在每次 DNS 入侵中，攻击者都精心为被重定向的域名申请了 Let's Encrypt 证书](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=During%20each%20DNS%20compromise%2C%20the%20actor%20carefully%20generated)。"由于他们此时控制着该域名的 DNS，就能向证书颁发机构*证明*对域名的控制权——而自动域名验证机制便顺理成章地向他们颁发了有效证书。FireEye 跨多种方法确认了相同的模式："[两种情况下，攻击者均使用 Let's Encrypt 证书以避免引起怀疑](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=in%20both%20cases%20the%20attackers%20used%20Let%E2%80%99s%20Encrypt%20certificates)。"

正如 Krebs 的总结所言，最终结果是彻底的："[这些 DNS 劫持还为攻击者铺平了道路，使其得以为目标域名（如 webmail.finance.gov.lb）申请 SSL 加密证书，从而能够解密截获的电子邮件和 VPN 凭据，以明文查看](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=these%20DNS%20hijacks%20also%20paved%20the%20way%20for%20the%20attackers%20to%20obtain%20SSL%20encryption%20certificates)。"电子邮件和 VPN 登录凭据尽在掌握、一览无余，而绿色挂锁始终完好无损。

请注意，整个过程*不需要*什么。没有零日漏洞，没有在受害者服务器上植入恶意软件，没有突破防火墙。攻击完全生存在一个裂缝之中——"我拥有这个域名"与"我能证明谁当前控制着它的记录"之间的裂缝。DNSpionage 就栖居于此——而这道裂缝比大多数组织所意识到的宽得多。

## 应对之策：CISA 紧急指令 19-01

Talos 和 FireEye 联合披露的信息在华盛顿引发强烈震动。**2019 年 1 月 22 日**，美国网络安全和基础设施安全局（CISA）发布了**紧急指令 19-01《缓解 DNS 基础设施篡改》**——这是 CISA 有史以来发布的第一份紧急指令，也是一项对整个联邦民事政府具有约束力的罕见命令。

该指令的诊断与研究结论完全吻合。据当时的报道引述，CISA 警告说，"[攻击者已重定向并拦截了 Web 和邮件流量，并可能对其他联网服务采取同样的手段](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=redirected%20and%20intercepted%20web%20and%20mail%20traffic)"，攻击者还"[入侵了负责管理政府 DNS 域名的管理员账户](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=compromised%20the%20accounts%20of%20administrators)。"

随后，指令要求在 10 天内完成四项措施——每一项都是对攻击者三步走手法的直接反制：

1. **审计 DNS 记录** — 核实权威服务器和辅助服务器上的记录未遭篡改。
2. **修改 DNS 账户密码** — 轮换所有能编辑 DNS 的凭据。
3. **为所有 DNS 管理账户启用多因素认证** — 确保仅凭一个被盗密码无法再成为万能钥匙。
4. **监控证书透明度日志** — 监测是否有人为你的域名申请了你从未请求过的证书。

第四项是关键所在。CISA 不仅要求各机构锁好门，还要求他们盯着公开的证书账本，查看是否有人已经用一把复制的钥匙开过门。DNSpionage 将证书透明度从一项小众的 PKI 特性变成了应对国家级 [DNS 劫持](/zh/glossary/dns-hijacking/)的前线检测工具。

Krebs 对这一罕见时刻的描述朴实无华："[美国国土安全部发布了一项罕见的紧急指令，要求所有美国联邦民事机构确保其互联网域名记录登录凭据的安全](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=issued%20a%20rare%20emergency%20directive%20ordering%20all%20U.S.%20federal%20civilian%20agencies)。"

推动紧急指令出台的不只有 DNSpionage。一场平行进行、手段更为激进的行动——Talos 将其命名为 **Sea Turtle**——进一步推升了紧迫程度。Talos 描述这是"[第一个已知的域名注册机构遭到入侵以实施网络间谍行动的案例](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=first%20known%20case%20of%20a%20domain%20name%20registry%20organization%20that%20was%20compromised)"，攻陷了"[13 个国家约 40 个不同组织](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=approximately%2040%20different%20organizations%20across%2013%20different%20countries)"。Talos 谨慎地将两起行动加以区分；在 2019 年 4 月的后续报告中，Talos 指出 DNSpionage 的行为特征"[将有可能使这一行为者与 Sea Turtle 等更令人担忧的行动相区别](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/#:~:text=will%20likely%20continue%20to%20distinguish%20this%20actor%20from%20more%20concerning%20campaigns%20like%20Sea%20Turtle)。"两场行动从不同角度指向同一个结论：DNS 供应链已经成为国家冲突的新战场。

## 从 DNS 作为国家安全基础设施中汲取的教训

DNSpionage 缺乏恶意软件攻击惯有的戏剧性，却带来了令人如坐针毡的深刻教训。以下几点值得铭记：

- **注册商账户是皇冠上的宝石。** 域名下游的一切——邮件、网站、VPN、单点登录、证书颁发——都继承了能够编辑 DNS 的人所拥有的信任。该账户只用密码、没有第二重认证，不是一个小漏洞，而是整座城堡大门洞开。CISA 的第一批指令针对的是*凭据*而非防火墙，原因正在于此。
- **有效证书并不等于合法性证明。** 绿色挂锁仅证明流量已加密传输至*当前控制该域名的人*。如果攻击者控制了 DNS，自动域名验证会乐呵呵地向他们颁发真实证书。对 TLS 的信任是从对 DNS 的信任中借来的——而 DNS 比大多数人想象的更为脆弱。
- **DNS 攻击天生具有隐蔽性。** 由于代理会转发真实流量，受害者的服务持续正常运转，不会有任何中断可供调查。唯一的外部信号可能是公开 CT 日志中出现的一张证书——这也是为何监控 CT 日志在一夜之间从可选项变成了强制项。
- **域名控制权就是国家安全控制权。** 当编辑某外交部 DNS 的主体是敌对国家时，"IT 运维"与"反情报"之间的界限便已消弭。互联网的地址簿是战略要地。

贯穿始终的是一个几乎没有任何运营工具能够实时回答的问题：**谁现在实际控制着这个域名，我能否证明它没有悄悄改变？** DNSpionage 之所以得逞，正是因为这个问题难以回答，以至于整个地区的政府都束手无策。

## Namefi 的视角

![彩色插图：可验证、防篡改的域名所有权——一张域名卡片受绿色盾牌、绿色 Namefi 代币和 DNS 连续性保护](../../assets/the-dnspionage-campaign-03-namefi-angle.jpg)

DNSpionage 从根本上说是一个**溯源**问题。攻击者从未拥有目标域名，他们通过窃取凭据借用了对这些域名的控制权——这些凭据允许注册商和 DNS 托管商控制台进行无声、无法核实的修改——而整个系统中没有任何机制标记*控制方*已经改变这一事实。

[Namefi](https://namefi.io) 的核心理念是：域名的所有权和控制权应当是**可验证、可移植、可审计**的，而非被锁在一个不透明的注册商登录界面之后。通证化所有权使"谁控制这个名字"成为一个可供查验和审计的事实，而非埋藏在某个密码背后的设置——而那个密码也许已经落入他人之手。这并不能取代注册商账户卫生管理或多因素认证——CISA 的建议依然完全正确——但它直击 DNSpionage 所利用的更深层漏洞：难以独立、持续地*证明*当前控制某域名的一方正是本应控制它的那一方。

DNSpionage 的教训并非 DNS 以某种神秘的方式存在脆弱性。教训是：关于一个域名最重要的事实——谁控制它——在太长的时间里，仅凭一个被盗密码便可被推翻。让这个事实变得可验证，正是关键所在。

## 资料来源与延伸阅读

- Cisco Talos — [DNSpionage Campaign Targets Middle East](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/)（2018 年 11 月 27 日）
- Cisco Talos — [DNSpionage brings out the Karkoff](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/)（2019 年 4 月 23 日）
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)（2019 年 2 月 18 日）
- The Register — [Baddies linked to Iran fingered for DNS hijacking to read Middle Eastern regimes' emails](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/)（2019 年 1 月 10 日）
- SecurityWeek — [Iran-Linked DNS Hijacking Attacks Target Organizations Worldwide](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/)（2019 年 1 月 10 日）
- BleepingComputer — [DHS Issues Emergency Directive to Prevent DNS Hijacking Attacks](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/)（2019 年 1 月）
- Network World — [Cisco Talos details exceptionally dangerous DNS hijacking attack](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html)（2019 年 4 月 17 日）
- Network World — [Cisco: DNSpionage attack adds new tools, morphs tactics](https://www.networkworld.com/article/967303/cisco-dnspionage-attack-adds-new-tools-morphs-tactics.html)
- CERT-IST — [DNSpionage and DNS data hijacking](https://www.cert-ist.com/public/en/SO_detail?format=html&code=dnspionage)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)（2019 年 1 月 22 日）
