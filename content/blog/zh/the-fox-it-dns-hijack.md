---
title: "域名求生纪 EP14：当安全公司遭遇 DNS 劫持——Fox-IT 事件"
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "2017 年 9 月，攻击者登录了荷兰安全公司 Fox-IT 的第三方域名注册商账户，更改了其 DNS，骗取了 TLS 证书，并对客户端流量进行了长达 10 小时的中间人攻击——直到 Fox-IT 发现并发布了业内最透明的事后分析报告之一。"
keywords: ['fox-it dns 劫持', 'fox-it 中间人攻击', 'fox-it 2017年事件', 'dns 劫持', '注册商账户被入侵', '伪造 ssl 证书', '中间人攻击', '域名注册商安全', 'dns 双因素认证', 'dnssec', '注册局锁定', '域名安全', 'ncc group fox-it']
---

中间人攻击最可怕的地方在于，当它发生时，一切看起来都很正常。

网站正常加载。地址栏显示正确的域名。小锁图标是闭合的。证书是有效的。文件正常上传，登录成功，邮件送达。没有任何错误、警告或损坏的图片——只有一个安静的第三方坐在对话中间，阅读着所有通过的信息，然后将其转发，以至于双方都没有注意到任何延迟。

现在，想象一下这种情况发生在那些专职负责发现这些问题的人身上。

2017 年 9 月，荷兰网络安全公司 Fox-IT——这家专门调查数据泄露、构建拦截检测传感器、并为政府提供攻击者行为模式咨询的公司——发现一名攻击者劫持了自己域名的 DNS，以其名义获取了 TLS 证书，并花了大半天时间监听其客户门户的往来流量。锁匠自己的锁被撬开了。随后，Fox-IT 做了一件几乎所有被黑客攻击的公司都不会做的事情：它[发布了一份详尽的报告，说明了事件发生的确切过程](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes)。

## 即使是安全公司也要依赖其注册商

这个案例让一个令人不安的事实变得具体：无论你内部安全做得多好，你很大一部分的攻击面其实存在于一家你无法掌控的公司。

你的域名——客户输入的名称、证书颁发的依据地址、邮件指向的目的地——都是在域名注册商处配置的。无论谁控制了这个注册商账户，谁就能控制你的域名解析到哪里。他们可以重定向你的网站、重新路由你的邮件，并向证书颁发机构证明对你域名的“所有权”。所有这些都不需要触碰你的服务器、防火墙或代码。它只需要登录一个网络控制面板。

无论以何种标准衡量，Fox-IT 都是一家严谨的安全机构。它运行着全流量抓包和自有的网络传感器。它的客户门户使用了双因素认证。它后来被 NCC Group 收购。然而，它仍然暴露在一个几乎从未登录过的账户上——因为正如该公司自己所言，[DNS 设置通常很少更改](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=DNS%20settings%20in%20general%20change%20very%20rarely)，所以守护它们的凭证就在悄无声息中过期失效了。

正如 Fox-IT 在其报告开篇所述：[如果这样的攻击能击中一家安全公司，它很可能也会击中许多其他不太关注安全的企业](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=if%20such%20an%20attack%20can%20hit%20a%20security%20firm)。

## 2017 年 9 月 19 日：劫持与中间人攻击

![一幅生动多彩的概念艺术图：一个安静的窃听者正在阅读两个遥远塔楼之间流动的两股邮件流，这两股邮件流无形地穿过他们的双手，而两座塔楼都发着光，仿佛一切正常](../../assets/the-fox-it-dns-hijack-01-hijack.jpg)

Fox-IT 的报告以一句话开篇，这句话后来成了事件响应写作中的经典之作：[对于 Fox-IT 来说，在 2017 年 9 月 19 日星期二，“如果”变成了“何时”](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=became%20%E2%80%98when%E2%80%99%20on%20Tuesday%2C%20September%2019%202017)，当时该公司成为了中间人攻击的受害者。

发生的并非服务器漏洞利用。在 9 月 19 日凌晨，[一名攻击者访问了我们第三方域名注册商处 Fox-IT.com 域名的 DNS 记录](https://grahamcluley.com/fox-it-dns-hack/#:~:text=an%20attacker%20accessed%20the%20DNS%20records%20for%20the%20Fox%2DIT.com%20domain)。控制了这些记录后，攻击者[修改了某个特定服务器的 DNS 记录，将其指向他们所控制的服务器，拦截并转发流量](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=modified%20a%20DNS%20record%20for%20one%20particular%20server)回 Fox-IT 的真实基础设施。

最后一个细节——*转发流量*——使得这成为一场中间人攻击，而不仅仅是简单的服务中断。访客仍然能访问一个正常工作的门户。他们只是先经过了攻击者。

目标非常明确。这次攻击[专门针对 ClientPortal，即 Fox-IT 的文档交换网络应用程序](https://grahamcluley.com/fox-it-dns-hack/#:~:text=specifically%20aimed%20at%20ClientPortal)，这是 Fox-IT 用来与客户、供应商及其他组织安全交换文件的系统。换句话说，攻击者直指敏感客户文件流通的渠道。

由于 Fox-IT 及时发现并控制了局面，该公司[将中间人攻击的总有效时间限制在 10 小时 24 分钟](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes)。独立报道也给出了同样的数字：[事件发生在 9 月 19 日，持续了 10 小时 24 分钟](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=lasted%20for%2010%20hours%20and%2024%20minutes)。

## 究竟拦截了什么

在一个文档交换门户上进行 10 个小时的中间人攻击听起来是灾难性的。但实际窃取到的数据很少——而这种“少”本身就大有文章。

在这段时间里，[有九名独立用户登录，他们的凭据被拦截了](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Nine%20individual%20users%20logged%20in)。但这些凭据基本上是没用的：Fox-IT 的门户需要第二验证因素，而坐在网络路径中的攻击者无法重放这一点。Help Net Security 指出，虽然捕获了九名用户的登录凭据，但[如果没有第二验证因素，这些凭据毫无用处](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor)。

在文件方面，[传输并拦截了 12 个文件（其中 10 个是唯一的）](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Twelve%20files%20%28of%20which%20ten%20were%20unique%29%20were%20transferred%20and%20intercepted)。少数几个包含机密的客户信息。攻击者还捕获了部分 ClientPortal 用户的姓名和电子邮件地址、一些账户名以及一个手机号码，正如 [SecurityWeek 所总结的那样](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=mobile%20phone%20number)。

两个事实限制了损失的扩大。首先，Fox-IT 明确表示，[被归类为国家机密的文件绝不会通过我们的 ClientPortal 传输](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Files%20classified%20as%20state%20secret%20are%20never%20transferred)——最敏感的资料根本不在暴露的渠道中。其次，该公司自己的双因素认证削弱了凭据盗窃的影响。即使在外围防线（DNS）失效后，这种架构仍然限制了破坏范围（blast radius）。

## 它是如何发生的：一个过期的密码，没有双因素认证

![生动多彩的概念艺术图：一把华丽的钥匙从沉睡的守门人翻出的口袋中被拿走，用来打开一个巨大的路标，将光河改道引向一个隐藏的镜面亭子，在那里伪造的蜡封在一个发光的证书上盖章](../../assets/the-fox-it-dns-hijack-02-mitm.jpg)

这个机制读起来就像是一份检查清单，说明了如何在不向受害者服务器植入一行恶意软件的情况下夺取域名。

**第一步——进入注册商账户。** 攻击者[使用有效凭证成功登录了我们第三方域名注册商提供商的 DNS 控制面板](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=logged%20in%20to%20the%20DNS%20control%20panel)。Fox-IT 的调查得出结论，攻击者[可能是通过第三方提供商的泄露获得了他们域名注册商 DNS 控制面板的凭证](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=through%20the%20compromise%20of%20a%20third%20party%20provider)。两个复合的弱点使得这次登录得以得手：[密码自 2013 年以来一直未更改](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013)，而且注册商根本不提供双因素认证——在撰写报告时，Fox-IT 指出，[该注册商仍不支持 2FA](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA)。

**第二步——更改 DNS 并向 CA 证明“所有权”。** 打开控制面板后，攻击者重新指向了 DNS。但要在 HTTPS 网站上运行令人信服的中间人攻击，他们需要一个有效的 fox-it.com 证书——而现代获取证书的方式是证明你控制该域名。因此，攻击者正是这样做的。在凌晨 02:05–02:15 这样一个狭窄的时间窗口内，他们[为了在为我们的 ClientPortal 欺诈性注册 SSL 证书的过程中证明他们拥有我们的域名，暂时重新路由并拦截了 Fox-IT 的电子邮件](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=fraudulently%20registering%20an%20SSL%20certificate%20for%20our%20ClientPortal)。这是应该让每一位读者深思的部分：**在实践中，控制了 DNS 就等于控制了域名验证。** 域验证证书会颁发给能够响应 CA（证书颁发机构）质询的任何人——而在本例中，控制 DNS 让攻击者能够重新路由验证电子邮件并进行响应。DNS 决定了所有权证明信件的目的地。

**第三步——位于中间。** 凭借一张合法签发（但非法获取）的证书，攻击者将域名指向国外的一台 VPS 并拦截了流量。正如 SecurityWeek 所描述的，[流氓 SSL 证书被用于对 ClientPortal 进行中间人攻击，发送至该门户的流量通过国外的虚拟专用服务器（VPS）提供商进行路由](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=rogue%20SSL%20certificate%20was%20used)。对访问者而言，一切毫无异样。挂锁图标是真的。证书是有效的。中间人手中握着一把浏览器信任的钥匙。

三个层级——DNS、证书颁发机构和 TLS 本身——在技术上都运作正常。攻击者并没有破坏其中任何一个。他只是让这三者都相信他就是 Fox-IT，而让他做到这一点的唯一东西，就是在注册商那里的一个陈旧的、单因素登录凭据。

## Fox-IT 的响应：检测、遏制，然后公之于众

让这次事件与成百上千起默默无闻的安全事件区别开来的，是他们的响应方式——无论是技术上还是公关上。

**检测非常迅速。** Fox-IT 发现其 fox-it.com 域名的名称服务器已被重定向，在入侵开始约 5 小时后将其捕获——据 Help Net Security 报道，这是在[攻击开始约五小时后](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=five%20hours%20after%20the%20attack%20started)。该公司自己运行的全流量抓包和网络传感器为其提供了取证记录，以准确重建哪些内容被动过，哪些没有。

**遏制是有意为之。** Fox-IT 并没有直接下线门户网站以惊动攻击者，而是选择了一种更低调的缓解策略：它[禁用了我们 ClientPortal 登录认证系统的双因素认证](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=disabled%20the%20second%20factor%20authentication)——这是一个反直觉的举动，但这让它在重新控制 DNS 的同时控制住了局面，而所有这些都没有暴露它已经发现了入侵。然后它[立即就这些文件联系了受影响的客户](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=All%20affected%20clients%20in%20respect%20of%20these%20files%20were%20contacted%20immediately)。

**接下来是使其成为经典案例的部分。** 三个月后，经过分析并随着执法调查的展开，Fox-IT 发布了一份带有时间戳的完整事后分析报告，其核心观点非常简单：[透明度比保密更能建立信任，而且其中有值得吸取的教训](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=transparency%20builds%20more%20trust%20than%20secrecy)。一家安全公司以一种最具其身份特征的方式蒙羞——然而，它并没有掩盖事实，而是向整个行业交出了一份深度剖析报告。BleepingComputer 的标题准确捕捉了那一刻应有的基调：[顶级安全公司承认遭遇中间人安全事件](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=Top%20Security%20Firm%20Admits)。

## 这教会了我们关于注册商安全和注册局锁定什么

撇开具体细节不谈，Fox-IT 事件是一堂关于真正的安全边界在哪里的课。对于大多数组织来说，边界不仅仅是防火墙，它还是注册商的登录口。这个案例证明了以下几点：

1. **像对待生产基础设施一样对待注册商账户。** 它很少改变，所以很容易被遗忘——这正是它变得脆弱的原因。一个自 [2013 年以来](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013) 从未动过的密码并不意味着“流量低所以风险低”；它是一个没有任何监控的高价值凭证。

2. **要求注册商提供多因素认证——如果不提供就换一家。** Fox-IT 的注册商根本[不支持 2FA](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA)。你域名安全链条中最重要的一环仅仅依靠密码保护。在注册商处有无 2FA 是一个采购标准，而不是锦上添花的选项。

3. **使用注册局锁定（Registry Lock）。** 除了注册商自己的登录保护之外，许多注册局还提供*注册局锁定*——一种服务器端的保持机制，除非完成带外（out-of-band）的手动验证步骤，否则阻止更改名称服务器和联系人记录。注册局锁定意味着，即使注册商密码被完全攻破，也无法悄无声息地重新指向 DNS。它将“距离被黑仅一个面板”转变成了“需要多名操作人员和一次电话验证”。

4. **尽可能部署 DNSSEC。** DNSSEC 对 DNS 响应进行加密签名，以便解析器检测解析路径中的篡改。虽然它在这里不是灵丹妙药——控制了权威记录的攻击者可以重新签名——但它提高了攻击成本，并封堵了整类在传输过程中的 DNS 操纵。在 DNS 层面上进行深度防御之所以重要，正是因为如本案所示，在信任堆栈中，DNS 位于 TLS 和证书签发*之上*。

5. **记住，控制 DNS 就等于控制证书。** 攻击者通过[重新路由电子邮件证明对域名的所有权](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=proving%20that%20they%20owned%20our%20domain)，从而获得了有效的 TLS 证书。应监控证书透明度（Certificate Transparency, CT）日志，以防你的域名下签发了意外的证书。CT 日志中出现的流氓证书是少数几个可能表明 DNS 劫持正在进行的外部信号之一。

6. **在应用程序本身保留第二验证因素。** Fox-IT 门户的 2FA 是导致被盗的九个密码[在没有第二验证因素的情况下毫无用处](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor)的原因。当外层（DNS）失效时，内层（应用层的 MFA）仍然有效限制了损害。

贯穿始终的线索是：你的域名是一个你部分外包出去的单点故障。加固它并非什么光鲜亮丽的工作，但它会在有人试图复刻 Fox-IT 事件的那一天发挥出绝对的价值。

## Namefi 视角

![展示可验证、抗篡改域名所有权的彩色插图——一张受绿色盾牌、绿色 Namefi 代币和 DNS 连续性保护的域名卡片](../../assets/the-fox-it-dns-hijack-03-namefi-angle.jpg)

追根溯源，Fox-IT 事件是一个控制权和来源可靠性（Provenance）的问题。攻击者根本不需要真正成为 Fox-IT。他只需要让一个系统——注册商控制面板——*相信*他是，而且时间足够他重新指向 DNS 和伪造证书。下游的一切系统都会盲目信任这种“相信”。

[Namefi](https://namefi.io) 的构建理念是使域名的控制权可验证且抗篡改，而不是依赖于供应商控制面板中一个可重复使用的密码。通过将域名所有权表示为一种可验证的、与 DNS 兼容的链上资产，控制权变成了你可以审计和证明的东西——而不仅仅是一个别人可以悄悄登录并重新配置的账户。关键的更改可以绑定到你真正持有的所有权上（秉承注册局锁定的精神），而不是绑定到一个多年未轮换的凭证上。

所有这些都不能让坚定的攻击者变得无计可施。但 Fox-IT 的故事说到底，是一个关于一次被盗的登录凭据转化为对一个名称的完全控制权的故事。域名的控制权越接近于可验证的所有权——通过一个陈旧的密码悄无声息地更改名称的难度就越大——像 Fox-IT 这样“如果变成了何时”的时刻在被人发现之前就越难蔓延扩大。

一家安全公司在五小时内发现了自己被劫持，并向世界讲述了这一切。大多数组织可能既察觉不到，也不会公开。最便宜的教训就是 Fox-IT 花钱买来的教训：在注册商成为敞开的大门之前，牢牢地锁定它。

## 参考资料与进一步阅读

- Fox-IT (NCC Group) — [从中间人攻击中吸取的教训（Lessons learned from a Man-in-the-Middle attack）](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/)（主要的事后分析报告）
- BleepingComputer — [顶级安全公司承认遭遇中间人安全事件（Top Security Firm Admits to MitM Security Incident）](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/)
- Help Net Security — [安全公司 Fox-IT 披露并详述其在 9 月遭受的中间人攻击（Security company Fox-IT reveals, details MitM attack they suffered in September）](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/)
- Graham Cluley — [Fox-IT 披露黑客劫持了其 DNS 记录，窃听客户文件（Fox-IT reveals hackers hijacked its DNS records, spied on clients' files）](https://grahamcluley.com/fox-it-dns-hack/)
- SecurityWeek — [黑客瞄准安全公司 Fox-IT（Hackers Target Security Firm Fox-IT）](https://www.securityweek.com/hackers-target-security-firm-fox-it/)
- GBHackers — [领先的 IT 安全公司 Fox-IT 遭遇网络攻击（Leading IT Security Firm Fox-IT hit by Cyber Attack）](https://gbhackers.com/cyber-attack/)
- Krebs on Security — [深入探讨近期广泛爆发的 DNS 劫持攻击（A Deep Dive on the Recent Widespread DNS Hijacking Attacks）](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)（相关：大规模 DNS 劫持 + 欺诈性证书技术）