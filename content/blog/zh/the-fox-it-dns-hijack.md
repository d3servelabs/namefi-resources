---
title: '域名紧急事件 EP14：当一家安全公司遭遇 DNS 劫持——Fox-IT 事件'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2017 年 9 月，攻击者登录了荷兰安全公司 Fox-IT 的第三方域名注册商，修改了其 DNS 记录，欺诈性地获取了一张 TLS 证书，并对客户流量实施了长达 10 小时的中间人攻击——直到 Fox-IT 发现并发布了行业内最透明的事后分析报告之一。'
keywords: ['fox-it dns 劫持', 'fox-it 中间人攻击', 'fox-it 2017 事件', 'dns 劫持', '域名注册商账户入侵', '欺诈性 ssl 证书', '中间人攻击', '域名注册商安全', 'dns 双因素认证', 'dnssec', '注册局锁定', '域名安全', 'ncc group fox-it']
---

中间人攻击的可怕之处在于：攻击发生时，一切看起来都毫无异样。

网站正常加载，地址栏显示正确的域名，小锁图标完好无损，证书有效无误。文件上传成功，登录顺利完成，邮件如期送达。没有报错，没有警告，没有加载失败的图片——只是一个悄无声息的第三方悄悄坐在对话中间，在两端毫无察觉的情况下读取所有经过手中的内容，然后继续转发出去。

现在，想象一下，这件事发生在了那些专门负责发现此类攻击的人身上。

2017 年 9 月，荷兰网络安全公司 Fox-IT——一家专门调查安全事件、构建入侵检测传感器、为政府提供攻击溯源咨询的机构——发现有攻击者劫持了其自有域名的 DNS，以该公司名义获取了 TLS 证书，并在将近一整天的时间里窃听了其客户门户的往来流量。锁匠自己的锁被撬开了。随后，Fox-IT 做了一件几乎没有任何受害公司会做的事：它[详细公开了整个经过](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes)。

## 即便是安全公司，也依赖于其域名注册商

这个案例揭示了一个令人不安的事实：无论你的内部安全做得多好，你的大部分攻击面都存在于你并不掌控的一家公司那里。

你的域名——客户输入的名称、证书签发的对象、邮件的目的地——是在域名注册商处配置的。谁控制了那个注册商账户，谁就控制了你的域名解析目标。他们可以把你的网站指向别处，重定向你的邮件，并向证书颁发机构"证明"对你域名的所有权。这一切都不需要触碰你的服务器、防火墙或代码，只需要登录一个网页控制台。

Fox-IT 无论从哪个维度来看都是一家严肃的安全机构：它对自身网络实施全流量抓包，并部署了自建的网络传感器；其面向客户的门户启用了双因素认证；后来更是被 NCC Group 收购。然而，公司仍然因为那个几乎从不登录的账户而遭到攻破——正如公司自己所说，[DNS 设置通常极少变动](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=DNS%20settings%20in%20general%20change%20very%20rarely)，因此守护它的凭据也就悄然老化了。

Fox-IT 在自己的报告开篇如此写道：[如果这样的攻击能够击中一家安全公司，那它很可能也能击中许多其他类型的企业](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=if%20such%20an%20attack%20can%20hit%20a%20security%20firm)——那些对安全关注度更低的企业。

## 2017 年 9 月 19 日：劫持与中间人攻击

![一幅色彩鲜艳的概念艺术图，描绘一个静默的窃听者读取在两座远处塔楼之间流动的两条邮件流，信息无声无息地穿过他的双手，而两座塔楼仍在发光，仿佛什么都没有发生](../../assets/the-fox-it-dns-hijack-01-hijack.jpg)

Fox-IT 的报告以一句此后成为事件响应写作经典的话开篇：[对于 Fox-IT 而言，"如果"在 2017 年 9 月 19 日星期二变成了"当"](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=became%20%E2%80%98when%E2%80%99%20on%20Tuesday%2C%20September%2019%202017)——那一天，公司成为了中间人攻击的受害者。

这不是一次服务器漏洞利用。9 月 19 日清晨，[攻击者访问了 Fox-IT.com 域名在第三方域名注册商处的 DNS 记录](https://grahamcluley.com/fox-it-dns-hack/#:~:text=an%20attacker%20accessed%20the%20DNS%20records%20for%20the%20Fox%2DIT.com%20domain)。掌握了这些记录的控制权后，攻击者[修改了特定服务器的 DNS 记录，将其指向自己控制的服务器，从而拦截并转发流量](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=modified%20a%20DNS%20record%20for%20one%20particular%20server)到真实的 Fox-IT 基础设施。

最后这个细节——*转发流量*——正是使这次攻击成为中间人攻击而非简单断网事故的关键。访问者依然能访问到一个正常运作的门户，只是他们需要先经过攻击者。

攻击目标非常明确。此次攻击[专门针对 ClientPortal——Fox-IT 的文档交换 Web 应用程序](https://grahamcluley.com/fox-it-dns-hack/#:~:text=specifically%20aimed%20at%20ClientPortal)，即 Fox-IT 用于与客户、供应商及其他机构安全交换文件的系统。换言之，攻击者直接瞄准了敏感客户文件的传输通道。

由于 Fox-IT 及时检测并控制了局势，公司[将有效中间人攻击时间限制在了 10 小时 24 分钟](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes)。独立媒体的报道也给出了相同数字：[该事件发生于 9 月 19 日，持续了 10 小时 24 分钟](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=lasted%20for%2010%20hours%20and%2024%20minutes)。

## 究竟被拦截了什么

在一个文档交换门户上进行长达十小时的中间人攻击，听起来灾难性十足。但实际窃取到的内容很少——而这种"少"本身才是故事的核心。

在这段时间内，[九名用户登录了系统，其凭据遭到拦截](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Nine%20individual%20users%20logged%20in)。但这些凭据几乎毫无用处：Fox-IT 的门户要求第二重身份验证，而坐在网络路径中的攻击者无法重放该因素。Help Net Security 指出，九名用户的登录凭据被截获，但[没有第二重身份验证因素就毫无用处](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor)。

在文件方面，[共有十二个文件（其中十个为唯一文件）被传输并遭到拦截](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Twelve%20files%20%28of%20which%20ten%20were%20unique%29%20were%20transferred%20and%20intercepted)。其中少量文件包含机密客户信息。攻击者还截获了部分 ClientPortal 用户的姓名、电子邮件地址、一些账户名以及一个手机号码，如 [SecurityWeek 所总结](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=mobile%20phone%20number)。

两个关键因素控制住了损害范围。其一，Fox-IT 明确声明[被列为国家机密的文件从不通过我们的 ClientPortal 传输](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Files%20classified%20as%20state%20secret%20are%20never%20transferred)——最敏感的材料根本不存在于被攻击的渠道中。其二，公司自身的第二重验证因素有效削弱了凭据窃取的危害。即使在 DNS 这道外围防线失守之后，架构设计依然限制了爆炸半径。

## 事件经过：一个过时的密码，没有第二重验证

![一幅色彩鲜艳的概念艺术图，描绘一把精致的钥匙从沉睡的持有者口袋中被取走，用于打开一块巨型路牌，将一道光之河流改道流向一个隐藏的镜像亭，在那里一枚伪造的蜡封印章为一张发光的证书盖章](../../assets/the-fox-it-dns-hijack-02-mitm.jpg)

攻击过程读来像一份域名被劫持的操作清单——在受害者的服务器上没有留下任何一行恶意代码。

**第一步——进入注册商账户。** 攻击者[使用有效凭据成功登录了第三方域名注册商的 DNS 控制面板](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=logged%20in%20to%20the%20DNS%20control%20panel)。Fox-IT 的调查结论是，攻击者[可能通过入侵某个第三方供应商获取了域名注册商 DNS 控制面板的凭据](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=through%20the%20compromise%20of%20a%20third%20party%20provider)。两个叠加的弱点让这次登录得手：[密码自 2013 年起从未更换](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013)，且该注册商根本不提供第二重验证——Fox-IT 在报告撰写时注意到，该[注册商仍不支持 2FA](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA)。

**第二步——修改 DNS 并向 CA "证明所有权"。** 控制面板一旦打开，攻击者便重新指向了 DNS。但要对一个 HTTPS 网站实施*可信的*中间人攻击，他们还需要一张 fox-it.com 的有效证书——而现代获取证书的方式是证明你控制该域名。攻击者就这样做了。在 02:05 至 02:15 前后的短暂时间窗口内，他们[临时重定向并拦截了 Fox-IT 的电子邮件，专门用于在欺诈性注册 ClientPortal SSL 证书的过程中证明他们拥有我们的域名](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=fraudulently%20registering%20an%20SSL%20certificate%20for%20our%20ClientPortal)。这一环节值得每位读者停下来思考：**控制 DNS，在实践中就等于控制域名验证。** 域名验证证书颁发给能够响应 CA 质询的一方——而在此案中，控制 DNS 让攻击者能够重定向验证邮件并作出响应。DNS 决定了所有权证明的落点。

**第三步——坐镇中间。** 凭借一张合法签发（却欺诈性获取）的证书，攻击者将域名指向境外一台 VPS 并拦截流量。正如 SecurityWeek 所描述的，[恶意 SSL 证书被用于对 ClientPortal 实施中间人攻击，门户流量被路由通过境外一家虚拟私有服务器（VPS）提供商](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=rogue%20SSL%20certificate%20was%20used)。对于访问者而言，一切正常。小锁图标是真实的，证书通过了验证。中间人持有着浏览器完全信任的密钥。

DNS、证书颁发机构和 TLS 三个层面——在技术上全部运转正常。攻击者没有破坏其中任何一个，而是让三者都相信他就是 Fox-IT。而让他得以做到这一切的，只是注册商处一个陈旧的单因素登录凭据。

## Fox-IT 的应对：检测、控制，然后公开披露

让这次事件区别于数百起同类悄无声息事件的，是其应对方式——无论是技术层面还是公关层面。

**检测来得很快。** Fox-IT 确认其 fox-it.com 域名的名称服务器已被重定向，在攻击开始约五小时后发现了入侵——据 Help Net Security 报道，[攻击开始约五小时后](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=five%20hours%20after%20the%20attack%20started)。公司对自身实施的全流量抓包和网络传感器为其提供了完整的取证记录，得以精确还原哪些内容被触碰，哪些没有。

**控制过程是经过深思熟虑的。** Fox-IT 没有选择直接下线门户、从而惊动攻击者，而是采取了一种反直觉的降险措施：[禁用了 ClientPortal 登录认证系统的第二重验证](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=disabled%20the%20second%20factor%20authentication)——这一举措看似矛盾，但让公司得以在悄悄重夺 DNS 控制权的同时管控局势，且未暴露已发现入侵的事实。随后，公司[立即联系了涉及这些文件的所有受影响客户](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=All%20affected%20clients%20in%20respect%20of%20these%20files%20were%20contacted%20immediately)。

**接下来发生的事让这次事件成为了一个行业案例。** 三个月后，在完成分析、执法机构调查正在进行的情况下，Fox-IT 发布了一份完整的、带有时间戳的事后分析报告，核心论点简明扼要：[透明建立的信任比保密更多，这里有值得借鉴的教训](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=transparency%20builds%20more%20trust%20than%20secrecy)。一家安全公司以最符合自身定位的方式遭遇了尴尬——但它没有选择掩盖，而是向整个行业呈现了一份完整的复盘。BleepingComputer 的标题精准捕捉到了这一时刻应有的基调：[顶级安全公司承认遭遇中间人安全事件](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=Top%20Security%20Firm%20Admits)。

## 这个事件对注册商安全和注册局锁定的启示

剥开具体细节，Fox-IT 事件是一堂关于"真正防线在哪里"的课。对大多数组织而言，防线不只是防火墙，也是注册商登录凭据。这个案例为我们提供了以下论据：

1. **像对待生产基础设施一样对待注册商账户。** 它很少变动，所以很容易被遗忘——而这正是它腐化变质的原因。一个自 [2013 年](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013)起从未更换的密码，不是"因为访问量低所以风险低"——而是一个完全没有监控的高价值凭据。

2. **要求注册商提供多因素认证——如果不支持就换一家。** Fox-IT 的注册商[根本不支持 2FA](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA)。你整个域名安全链条中最重要的账户仅凭一个密码来保护。注册商是否支持 2FA，是采购标准，而不是锦上添花。

3. **使用[注册局锁定](/zh/glossary/registry-lock/)（Registry Lock）。** 除了注册商自身的登录安全之外，许多注册局还提供*注册局锁定*——一种服务端保持锁定状态，只有在完成带外人工验证步骤后，才允许修改名称服务器和联系人记录。注册局锁定意味着即便注册商密码被完全攻破，也无法悄悄修改 DNS 指向。它把"一个控制面板就能搞定"变成了"需要多个人工环节和一个电话才能完成"。

4. **在可行之处部署 [DNSSEC](/zh/glossary/dnssec/)。** DNSSEC 对 DNS 响应进行密码学签名，使解析器能够检测解析路径中的篡改。在这个案例中它不是万能药——控制权威记录的攻击者可以重新签名——但它提高了攻击成本，并阻断了整类在途 DNS 操控手段。DNS 层面的纵深防御意义重大，正是因为正如此案所示，DNS 在信任栈中位于 TLS 和证书签发的*上游*。

5. **记住：控制 DNS 就等于控制证书。** 攻击者通过[重定向邮件来证明域名所有权](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=proving%20that%20they%20owned%20our%20domain)，从而获取了一张有效的 TLS 证书。请监控证书透明（Certificate Transparency）日志，排查针对你的域名签发的异常证书。在 CT 日志中出现的恶意证书，是 [DNS 劫持](/zh/glossary/dns-hijacking/)可能正在进行中的为数不多的外部信号之一。

6. **在应用层保留第二重验证因素。** Fox-IT 门户的 2FA 正是让九个被盗密码[在没有第二重验证因素时毫无用处](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor)的原因。当外层防线（DNS）失守，内层防线（应用级 MFA）仍然限制住了损害范围。

贯穿始终的教训：你的域名是一个你部分外包出去的单点故障。加固它并不光鲜，只有在某天有人尝试了与 Fox-IT 相同的手段时，它的价值才会显现出来。

## Namefi 的视角

![一幅色彩鲜艳的插图，展示可验证、防篡改的域名所有权——一张由绿色盾牌、绿色 Namefi 代币和 DNS 连续性保护的域名卡片](../../assets/the-fox-it-dns-hijack-03-namefi-angle.jpg)

从本质上看，Fox-IT 事件是一个控制权与来源可信性的问题。攻击者根本不需要真正是 Fox-IT，他只需要让一个系统——注册商控制面板——*相信*他是，维持足够长的时间来重指 DNS 并签发证书。而下游的一切都信任了这个"认定"。

[Namefi](https://namefi.io) 的构建理念是让域名控制权可验证、防篡改，而不是依赖于供应商网页面板中的一个可复用密码。通过将[域名所有权](/zh/glossary/domain-ownership/)表示为可验证的、与 DNS 保持兼容的链上资产，控制权变成了可审计和可证明的——而不只是某个人悄悄登录就能重新配置的账户。关键变更可以绑定到你实际持有的所有权上，从精神上类似于注册局锁定，而不是绑定到一个多年未轮换的凭据上。

这些措施并不能让有决心的攻击者无计可施。但 Fox-IT 的故事归根结底是关于：一次被盗的登录如何转化为对一个域名的完全控制。域名控制权越接近可验证的所有权——越难通过单一过期密码悄无声息地修改域名——Fox-IT 那次"'如果'变成'当'"的时刻就越难在被发现前蔓延。

一家安全公司在五小时内发现了自己遭受的劫持，并将经过告知了全世界。大多数组织两者都做不到。Fox-IT 花钱买来的教训，也是最廉价的一课：在注册商成为那扇敞开的门之前，先把它锁好。

## 来源与延伸阅读

- Fox-IT (NCC Group) — [从中间人攻击中汲取的教训](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/)（原始事后分析报告）
- BleepingComputer — [顶级安全公司承认遭遇中间人安全事件](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/)
- Help Net Security — [安全公司 Fox-IT 披露并详述其九月遭受的中间人攻击](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/)
- Graham Cluley — [Fox-IT 披露黑客劫持其 DNS 记录、监听客户文件](https://grahamcluley.com/fox-it-dns-hack/)
- SecurityWeek — [黑客攻击安全公司 Fox-IT](https://www.securityweek.com/hackers-target-security-firm-fox-it/)
- GBHackers — [领先 IT 安全公司 Fox-IT 遭受网络攻击](https://gbhackers.com/cyber-attack/)
- Krebs on Security — [近期大规模 DNS 劫持攻击深度剖析](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)（相关背景：大规模 DNS 劫持与欺诈证书手法）
