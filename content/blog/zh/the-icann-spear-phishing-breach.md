---
title: '当 ICANN 自身遭遇钓鱼攻击：2014 年直击互联网核心的鱼叉式钓鱼事件'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2014 年底，负责协调互联网域名系统的机构 ICANN 承认，一封伪造其域名的鱼叉式钓鱼邮件窃取了员工凭据，并让攻击者获得了中央区域数据系统（CZDS）的管理权限。本期 Domain Mayday 深入探讨了这家 DNS 权威机构本身是如何遭到钓鱼攻击的、暴露了哪些信息，以及为什么这件事至今仍具有重要意义。'
keywords: ['ICANN 数据泄露', 'ICANN 鱼叉式钓鱼', 'CZDS', '中央区域数据系统', 'DNS 安全', '域名安全', '鱼叉式钓鱼攻击', '凭据钓鱼', '区域文件', 'IANA', '加盐密码哈希', '域名系统泄露', 'ICANN 2014 黑客攻击']
---

有一种特殊的新闻头条，会让整个安全行业为之屏息。不是“又一家零售商遭黑客入侵”，也不是“又一家初创公司泄露了数据库”——而是那个被*所有人*信任的机构，承认自己以最普通的方式被黑客攻击了。

2014 年 12 月，这家机构就是 ICANN（互联网名称与数字地址分配机构）。这个负责协调整个域名系统的非营利组织，是让 `namefi.io`、`google.com` 以及地球上每一个其他地址都能解析到服务器的规则守护者。他们披露称，其内部部分员工点击了伪造邮件中的链接，在虚假的登录页面中输入了密码，从而将内部系统的钥匙拱手交给了攻击者——这些内部系统就包括中央区域数据系统（CZDS），这是一个用于请求和访问全球顶级域名区域文件（Zone files）的存储库。

制定互联网信任机制的组织竟然遭遇了钓鱼攻击。用的是一封伪造的邮件。而且是伪装成 ICANN 本身。

这是 **Domain Mayday（域名求生）第 11 期** —— 在这一期里，危险的呼叫声正是从安全屋内部传出的。

## ICANN 是谁，为什么它的被黑具有象征意义

要理解为什么这个事件引起如此轩然大波，你必须首先了解 ICANN 究竟是做什么的。

ICANN 并不是一家让你购买域名的公司。它的层级更高。它负责协调使得互联网可以被导航的全球唯一标识符系统：顶级域名（包括 `.com`、`.org`、`.io` 以及数百个较新的后缀）、注册局和注册商遵循的规则，并且——通过其 IANA 职能——管理着 DNS 层次结构的最顶端，即所有其他查询最终都要依赖的根区（root zone）。

如果把域名比作互联网的地址，那么 ICANN 就是掌管邮局总目录的机构。注册商被黑固然糟糕，但 ICANN 被黑则具有强烈的象征意义，因为 ICANN 理应是那个*绝对权威*——那个职责是保持命名系统有序且值得信赖的唯一机构。当互联网名称的权威机构遭到入侵时，一个令人不安的问题就浮现了：如果连*他们*都能被钓鱼，还有谁能幸免？

## 2014 年底：系统被攻破

![一张生动色彩鲜艳的概念艺术图：一封伪造的官方信件悄然溜过一位高大守护者的身旁，守护者手中握着一圈发光的互联网万能钥匙，信件闪烁着红光，而钥匙闪烁着蓝光](../../assets/the-icann-spear-phishing-breach-01-breach.jpg)

ICANN 在 2014 年 12 月 16 日发布的[公开声明](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=We%20believe%20a%20%22spear%20phishing%22%20attack%20was%20initiated%20in%20late%20November%202014.)中列出了时间表，其坦诚程度令人钦佩：“我们认为，在 2014 年 11 月下旬，发生了一起‘鱼叉式网络钓鱼’（spear phishing）攻击。”

攻击手法简单得几乎像是一种侮辱。正如 ICANN 描述的那样，此次攻击“[向我们的员工发送了精心伪造的电子邮件，使其看起来像是来自我们自己的域名](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=It%20involved%20email%20messages%20that%20were%20crafted%20to%20appear%20to%20come%20from%20our%20own%20domain%20being%20sent%20to%20members%20of%20our%20staff.)”。员工收到了看起来像是来自 `icann.org` —— 即 ICANN 内部的邮件。一些员工点击了。根据 The Register（英国科技媒体）的复原，员工“[点击了邮件中的链接，被带到了一个虚假的登录页面——员工在其中输入了用户名和密码](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=clicked%20on%20a%20link%20in%20the%20messages%20that%20took%20them%20to%20a%20bogus%20login%20page)”，将他们的工作邮箱凭据拱手交给了攻击者。The Register 对于缺失安全防线的冷酷判定是：“[看来根本没有双重身份验证的踪影。](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)”

用 ICANN 自己的话来说，结果是：“[攻击导致了几名 ICANN 员工的电子邮件凭据被泄露。](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attack%20resulted%20in%20the%20compromise%20of%20the%20email%20credentials%20of%20several%20ICANN%20staff%20members.)”而 Help Net Security 网站则说得更加直白：“[几名员工被骗，向攻击者交出了他们的电子邮件凭据](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=Several%20staff%20members%20were%20fooled%20into%20handing%20over%20their%20email%20credentials)”。

没有零日漏洞（Zero-day）。没有奇异的恶意软件。只是一封令人信服的邮件和一个虚假的登录框——互联网上最古老的把戏，却对那些帮助运营互联网的人奏了效。

## 哪些信息被访问：核心位置的区域数据系统

被盗的电子邮件凭据本身就已经很糟糕了。但让这次违规事件成为 *Domain Mayday* 一期的原因在于，攻击者*利用*这些凭据触及了什么。

2014 年 12 月初，ICANN 发现被攻破的登录信息被重复使用，进而进入了其他系统。最严重的是**中央区域数据系统（CZDS）**—— 这是授权方请求和下载全球通用顶级域名区域文件的平台。ICANN 的披露令人触目惊心：“[攻击者获得了 CZDS 中所有文件的管理访问权限。](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attacker%20obtained%20administrative%20access%20to%20all%20files%20in%20the%20CZDS.)”

*管理*权限。涵盖*所有*文件。The Register 解释了这为何如此重要：CZDS “[让授权方能够访问全球通用顶级域名的所有区域文件](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=gives%20authorized%20parties%20access%20to%20all%20the%20zone%20files%20of%20the%20world%27s%20generic%20top%2Dlevel%20domains)”。该系统的*用户*并非普通人——正如 The Register 所指出的，他们是“[全球许多注册局和注册商的管理员](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=many%20of%20the%20administrators%20of%20the%20world%27s%20registries%20and%20registrars)”。攻击者不只是进入了一个数据库；他们进入了命名系统守门人亲自登录的那个数据库。

除了区域文件之外，这次泄露还暴露了 CZDS 用户注册时的个人数据。根据 ICANN 的说法，被盗取的资料“[包括系统中区域文件的副本，以及用户输入的信息，如姓名、邮寄地址、电子邮件地址、传真和电话号码、用户名及密码](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=This%20included%20copies%20of%20the%20zone%20files%20in%20the%20system%2C%20as%20well%20as%20information%20entered%20by%20users)”。这些管理顶级域名（TLDs）的人员的用户名和密码——就这样躺在攻击者佩戴着窃取来的证件轻易走进的系统里。

这些凭据的触角甚至伸得更远。ICANN 证实，攻击者还触及了 **GAC Wiki**（政府咨询委员会的工作空间）、**ICANN 博客** 和 **WHOIS 信息门户**，不过据其报告，[后两个系统没有受到任何影响](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=The%20latter%20two%20were%20not%20affected%20in%20any%20way.)，而 wiki 也只遭到了有限的浏览。

## 事情是如何发生的：印着“ICANN”的通行证

![一张色彩鲜艳的生动概念图：夜晚的域名系统控制塔，一张印有勾号的发光伪造通行证解开了它的大门，真正的守卫却在不知不觉中站立着，红色的光束从中泄露出来](../../assets/the-icann-spear-phishing-breach-02-spear-phishing.jpg)

剥去技术的外衣，这次攻击本质上就是一场信任欺诈。

鱼叉式网络钓鱼与普通网络钓鱼的不同之处在于其精确性。它不是发送数百万封垃圾邮件然后守株待兔；它是针对特定人群精心定制的少量邮件，旨在看起来像日常的内部通信。而在这次事件中，伪装已经做到了极致：邮件看起来发自 `icann.org`。正如 The Register 所总结的：“[攻击者向员工发送了伪装成来自 icann.org 的欺骗性邮件。](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Attackers%20sent%20staff%20spoofed%20emails%20appearing%20to%20coming%20from%20icann.org.)”

想一想背后的心理学。来自你自己组织域名的邮件不会触发警报。一个看起来和你每天使用的一模一样的登录页面同样也不会。整个攻击利用了人们的一个错觉：*内部的*和*熟悉的*事物感觉上等同于*安全的*——然而事实并非如此。地址栏显示着熟悉的内容，而其背后的页面却在悄无声息地收集着敲入的每一个字符。

ICANN 唯一真正有效的防御措施在存储端：被盗密码并未以明文形式存放。正如披露中指出的，“[这些密码是作为加盐的加密哈希值（salted cryptographic hashes）存储的](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=Although%20the%20passwords%20were%20stored%20as%20salted%20cryptographic%20hashes)”——这比明文好得多。但是，正如 The Register 指出的，只有当用户没有在其他地方重复使用相同的登录信息时，这种保护才有效，因为这些哈希值仍然可以被离线破解。这次泄露并没有止步于数据的下载；它引发了一场缓慢的拉锯战，一方是防守方在轮换密码，另一方则是攻击者在试图逆向破解密码。

## 应对措施与余波

值得称赞的是，ICANN 在信息披露方面的处理比系统防护要做得好。

它在几周内便公之于众，停用了 CZDS 密码，通知了受影响的用户，并且——值得注意的是——将透明度视为一种责任而不是负担。该组织表示，它“[公开提供有关此事件的信息，不仅是因为我们对公开和透明的承诺，也是因为共享网络安全信息有助于所有相关方评估其系统面临的威胁](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=providing%20information%20about%20this%20incident%20publicly%2C%20not%20just%20because%20of%20our%20commitment%20to%20openness%20and%20transparency)”。它还报告说，当年早些时候启动的一项安全增强计划“[帮助限制了攻击中获得的未授权访问](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=these%20enhancements%20helped%20limit%20the%20unauthorized%20access%20obtained%20in%20the%20attack)”。

对于更广泛的互联网世界而言，最重要的一句话是关于哪些系统*没有*沦陷的。ICANN 证实：“[此次攻击未影响任何与 IANA 相关的系统](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=this%20attack%20does%20not%20impact%20any%20IANA%2Drelated%20systems)”。IANA——正如 Help Net Security 所描述的，这个“[管理域名系统 (DNS) 中根区](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=manages%20the%20root%20zone%20in%20the%20Domain%20Name%20System)”的职能部门——才是互联网命名金字塔真正的塔尖。如果攻击者触及了它，这就不再仅仅是一起令人尴尬的数据泄露事件，而将是一场结构性的重大紧急事件。

然而，事件发生的时机让这种尴尬雪上加霜。The Register 的新闻副标题一针见血地指出：“[鱼叉式钓鱼攻击的时机对域名监管机构来说简直糟透了](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Spear%2Dphishing%20attack%20timing%20couldn%27t%20be%20worse%20for%20domain%20name%20overseer)”。为什么？因为 ICANN “[希望在明年接管关键的 IANA 合同的控制权](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=it%20will%20prove%20extremely%20embarrassing%20to%20ICANN%2C%20which%20hopes%20to%20be%20handed%20control%20of%20the%20critical%20IANA%20contract%20next%20year)”——正是当时正在谈判的监管权移交事宜。被钓鱼成功，对于一句“请把 DNS 核心交给我们”的试镜台词来说，无疑是一次糟糕的试演。（补充背景：这也不是 ICANN 在 2014 年经历的第一次 CZDS 惊魂：The Register 指出，在当年 4 月份发生的一起早期事件中，“[部分用户被错误地授予了该系统的管理员权限](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=a%20number%20of%20users%20were%20wrongly%20given%20admin%20access%20to%20the%20system)”。）

此外，这些泄露的数据在很久之后仍然阴魂不散。在 2017 年 2 月 21 日作为其声明的更新补充中，ICANN 承认漏洞中的信息再次浮出水面：“[我们在 2014 年宣布的鱼叉式网络钓鱼事件中获取的一些信息，正被放在地下论坛上出售](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=some%20information%20obtained%20in%20the%20spear%20phishing%20incident%20we%20announced%20in%202014%20is%20being%20offered%20for%20sale%20on%20underground%20forums)”。CyberScoop 报道了几年后的市价：“[这些数据仍被以 300 美元的价格在黑市上传播和出售](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/#:~:text=the%20data%20is%20still%20being%20passed%20around%20and%20sold%20on%20black%20markets%20for%20%24300)”，卖家还附带声称它们从未被泄露过。2014 年底的一次漫不经心的点击，在 2017 年仍然在产生着黑市交易。

## 从中得到的教训：每个人都可能被钓鱼，即便是 DNS 权威机构

Domain Mayday 第 11 期给我们的教训绝不是轻飘飘的一句“ICANN 太粗心了”。而是一些更令人警醒的认知。

**每个人都可能被钓鱼。** 不是只有粗心的人，也不是只有未经培训的人。而是*所有人*。这家字面意义上管理着互联网名称的组织——里头都是以思考 DNS、安全和基础设施为生的人员——仍然有几名员工由于一封看似内部发送的邮件，而在假页面上输入了自己的凭据。钓鱼攻击打败的不是你的专业知识；它打败的是你在点击链接那短短两秒钟里的注意力。

由此，我们可以得出几个具有长远意义的启示：

1. **凭据就是安全边界。** 攻击者从未破解 ICANN 的加密算法或利用服务器漏洞。他们只是借用了密码。一旦将身份视作唯一的大门，被盗的身份就等于防线被突破——这也正是为什么网络钓鱼至今仍是世界上最“可靠”的攻击手段。
2. **对于特权系统，多重身份验证是必选项。** The Register 关于“[看来根本没有双重身份验证的踪影](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)”的吐槽切中要害。如果在当时启用了第二验证因素，凭据窃取很可能就不会造成任何实质性影响。
3. **横向移动是损害的乘数效应。** 灾难源于*重复使用*——被盗的电子邮件登录信息被重复用于访问 CZDS、wiki 和其他门户。将访问权限进行隔离，不让一个被盗凭据就能打开无数扇大门，才是遏制漏洞蔓延的关键。
4. **泄露的数据是永久性的。** 2017 年黑市的倒卖证明，“我们重置了密码”只能宣告事件的结束，但无法消除已经造成的暴露。姓名、地址和电话号码一旦泄露，便无法收回。
5. **权威不等同于免疫。** 成为定义信任的机构并不会让你免受针对信任的最基本攻击。如果说有什么不同的话，那就是这让你成为了一个更有吸引力的目标。

## Namefi 视角

![关于可验证、防篡改的域名所有权的彩色插图——一个由绿色盾牌、绿色 Namefi 代币和 DNS 连续性保护的域名卡片](../../assets/the-icann-spear-phishing-breach-03-namefi-angle.jpg)

ICANN 数据泄露事件的核心，是一个关于*谁掌控记录*的故事——以及这种控制权是如何通过中心化系统中单一被盗登录名而被劫持的。

这是值得我们深思的结构性弱点。当访问或管理关键域名数据的授权证明仅仅隐藏在单一平台上的用户名和密码背后时，一旦这些凭据被钓鱼，整个信任模型就会瞬间崩塌。没有任何二次核查。一封极具欺骗性的邮件和一个重复使用的密码，就足以向整个命名世界核心的区域数据系统授予管理员访问权限。

[Namefi](https://namefi.io) 的构建基于一个截然不同的前提：域名的所有权和控制权应当是**可验证、防篡改的，并且不依赖于单一收件箱里的单一密码。** 通过将域名所有权转化为与 DNS 保持兼容的链上代币，控制权变成了一种你可以通过密码学进行证明和审计的东西——而不仅仅是一个一封鱼叉式钓鱼邮件就能轻易偷走密码把守的关卡。这并不能让任何人完全对钓鱼攻击免疫；没有什么能做到这一点。但它极大地缩小了爆炸半径，让一个被盗用的凭据不再距离通往王国的钥匙只有一步之遥。

第 11 期留给我们最深刻的画面，是那封假借恰当的制服，大摇大摆地走过互联网万能钥匙守卫面前的伪造信件。解决之道不是寻找一个更聪明的守卫。而是建立一个系统，在这个系统中，钥匙本身就能证明它们是真的。

## 参考资料与延伸阅读

- ICANN — [ICANN Targeted in Spear Phishing Attack | Enhanced Security Measures Implemented](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en)（主要信息源，包含 2017 年的更新）
- The Register — [ICANN HACKED: Intruders poke around global DNS innards](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044)
- Help Net Security — [ICANN systems breached via spear-phishing emails](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/)
- Computerworld — [ICANN data compromised in spearphishing attack](https://www.computerworld.com/article/1487605/icann-data-compromised-in-spearphishing-attack.html)
- WeLiveSecurity (ESET) — [ICANN computers compromised by hackers](https://www.welivesecurity.com/2014/12/18/icann-computers-compromised-hackers/)
- Associations Now — [ICANN Systems Infiltrated in "Spear Phishing" Attack](https://associationsnow.com/2014/12/icann-systems-infiltrated-spear-phishing-attack/)
- Slate — [ICANN Got Hacked](https://slate.com/technology/2014/12/icann-hacked-in-spear-phishing-campaign.html)
- Domain Incite — [Hacked ICANN data for sale on black market](http://domainincite.com/21562-hacked-icann-data-for-sale-on-black-market)
- Slashdot — [Hackers Compromise ICANN, Access Zone File Data System](https://tech.slashdot.org/story/14/12/18/1540233/hackers-compromise-icann-access-zone-file-data-system)
- CyberScoop — [Hacked ICANN data still sells for hundreds of dollars years after breach](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/)
- DomainGang — [ICANN alerts users of CZDS & ICANN Wiki about security breach](https://domaingang.com/domain-news/icann-alerts-users-czds-icann-wiki-security-breach/)