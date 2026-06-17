---
title: 'Perl.com 域名失窃案：一个拥有 30 年历史的社区家园是如何被悄悄盗走的'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2021 年 1 月底，Perl 编程社区拥有数十年历史的家园 perl.com 被盗。攻击者通过入侵注册商级别的账户，将域名转移至中国，指向一个与恶意软件相关的 IP，并标价 19 万美元挂牌出售。本文将详细揭秘这起事件的经过、域名的找回过程，以及它给注册商账户安全带来的深刻教训。'
keywords: ['perl.com', 'perl.com 域名失窃', '域名劫持', '域名盗窃', '注册商账户被黑', '社会工程学', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'DNS 劫持', '域名安全', '账户接管', 'BizCN']
---

有些域名本质上是基础设施，只是碰巧长得像个名字。**perl.com** 就是其中之一。它不是营销资产，也不是某人去年刚建立的品牌——它是自互联网早期以来，Perl 编程社区一直赖以生存的网络基石，是通往文档、文章的权威门户，也是该语言的公众形象。

因此，当 2021 年 1 月 27 日上午，这扇大门突然易主时，这绝不是什么聪明的品牌策略或谈判出售。这是一起盗窃案。就在几个月前，该域名被悄无声息地从其合法所有权人手中夺走，在多个注册商之间辗转，并被指向一个有过分发恶意软件历史的 IP 地址。该社区自己的网络运营商直言不讳地表示：["perl.com 域名今早遭到劫持，目前正指向一个停放站点。"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

这是我们“域名求生（Domain Mayday）”系列第 19 期的故事：一个拥有三十年历史的社区域名，如何在没有任何服务器被攻破的情况下被盗，以及人们为了找回它付出了怎样的代价。

## 自 90 年代初就持有的域名

要理解这起盗窃案，你必须了解其配置有多么普通——而这种“普通”正是其脆弱性所在。

perl.com 并没有被保存在某个坚不可摧的企业金库中。它的保管方式与大多数长寿域名一样：由一位受信任的人，在一家主流注册商处保管，年复一年平平淡淡地续费。该网站的编辑 brian d foy 后来在他自己对这起事件的描述中介绍了这一渊源：["这个域名注册于 90 年代初，Tom Christiansen 在那之后不久便获得了该域名的控制权，并且基本上一直由他来支付注册费用。"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

这正是互联网上很大一部分最重要域名的完整写照。一个人，一个注册商登录账号，以及三十年来默默支付的账单。这套模式运转得十分完美——直到注册商账户本身成为被攻击的目标。

## 2021 年 1 月 27 日：大门被换了锁

![Vivid colorful concept art of a decades-old wooden community signpost being quietly unscrewed from its post at night and carried off, against a glowing circuit-board sky](../../assets/the-perl-com-domain-theft-01-theft.jpg)

第一次公开的警报来自于 Perl 社区基础设施的运营者。Perl NOC（网络运营中心）博客发布消息称，该域名在“今天早上”被劫持，现在正指向一个不该指向的地方。更糟糕的是，这不仅仅是一个简单的域名停放页面，运营者警告说：["有迹象表明，它可能与过去分发过恶意软件的网站有关。"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

brian d foy 在同一天公开提出了这个问题。有关该事件的报道直截了当地证实了这一时间点：["1 月 27 日，Perl 编程作家兼 Perl.com 编辑 brian d foy 在推特上表示，perl.com 域名突然被注册到了另一个人名下。"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

社区的反应迅速且务实。在开始恢复工作的同时，NOC 将读者重定向到了一个备份站点：["如果您正在寻找内容，可以访问 perldotcom.perl.org。"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) 权威域名虽然丢失，但内容依然可以访问。

## 危险降临：与恶意软件关联的 IP

被盗域名的危险程度与其承载的信任度成正比——而 perl.com 承载了极大的信任。数以百万计的开发者、教程、CPAN 工具以及遍布全网的旧链接都指向它。谁控制了这个域名，谁就控制了所有这些信任最终指向的地方。

而新主人并没有把它指向什么无害的地方。正如 BleepingComputer 所记录的那样：["perl.com 域名被盗，现在指向了一个与恶意软件活动相关的 IP 地址。"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

技术特征非常明确。DNS 记录被重写，使得 ["分配给该域名的 IP 地址从 151.101.2.132 更改为了 Google Cloud 的 IP 地址 35.186.238[.]101。"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) 这个目标地址有着不良的过往：["2019 年，IP 地址 35.186.238[.]101 曾绑定到一个域名，该域名分发了现已覆灭的 Locky 勒索软件的恶意可执行文件。"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

将这两个事实叠加在一起，危险显而易见。一个开发者条件反射般信任的域名，突然解析到了一个有过恶意软件历史的 IP 上。这几乎是一个完美的陷阱，专门用来欺骗那些平时很难被忽悠的、具备技术和安全意识的受众。

## 案件重演：问题出在注册商账户，而非服务器

![Vivid colorful concept art of a forged change-of-ownership slip being slid across a registry service desk, an official rubber stamp glowing red, paperwork swirling in neon light — no brand logos](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

让这起事件成为教科书级案例而不是无足轻重的小插曲的关键在于：没有人入侵 perl.com 的 Web 服务器，也没有人去猜 DNS 密码。攻击发生在更高一层，即注册商层面——这是一家掌握着该域名所有权权威记录的公司。

在事后分析中，brian d foy 直接描述了他们推测的作案手法：["我们认为这起事件涉及对 Network Solutions 的社会工程学攻击，包括使用伪造文件等。"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) 媒体的报道也采用了同样的说法：这起盗窃案是 ["一场社会工程学攻击，说服了注册商 Network Solutions 在没有有效授权的情况下更改了该域名的记录。"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

最令人不安的细节是时间线。社区直到 1 月份才*发现*问题，但实际的入侵发生得要早得多。由域名律师 John Berryhill 披露的取证工作将真实的作案时间往前推了几个月；正如 perl.com 账户记录所述：["John Berryhill 在推特上提供了一些取证结果，显示账户被黑实际发生在 9 月份。"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek 证实了攻击者的耐心：["他解释说，攻击发生在 2020 年 9 月"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) ——大约在任何人看到后果的四个月之前。

为什么要等这么久？因为域名转移的规则变相“奖励”了耐心。["ICANN 规定，在更新联系信息后的 60 天内禁止转移域名。"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) 一个在 9 月份悄悄控制了注册商账户的攻击者无法立即将域名转移走——所以他们按兵不动，任由时间流逝，一旦锁定到期便立刻采取行动。

当他们最终动手时，他们跨越注册商和国界对域名进行了“洗白”，以增加恢复的难度。The Register 记录了第一跳：["该域名于 12 月被转移到 BizCN 注册商，但名称服务器（nameservers）没有被更改。"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer 在地理位置上追踪了相同的路径：该域名 ["2020 年 9 月在 Network Solutions 处被盗，在圣诞节当天被转移到中国的一家注册商"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day)，随后在 1 月份进行了最后一跳，即 ["该域名在 1 月份再次被转移到另一家注册商，Key Systems, GmbH。"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

然后，他们试图套现。域名刚刚转移完毕，["未经授权的注册人就试图在域名市场 Afternic 上以 19 万美元的价格出售该域名。"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) 一项拥有三十年历史的社区资产，竟然通过伪造文书被盗，并像旧家具一样被挂牌出售。

## 艰难找回：用数周的文书工作来推翻伪造的文书

让盗窃得以发生的同一套机制——注册商、注册局和所有权记录——也是找回域名的唯一途径。没有服务器需要重新加固，也没有补丁需要部署。必须要有人通过注册商和注册局的流程来*证明*：Tom Christiansen 才是真正的所有者，而新的“所有者”是个骗子。

这项工作在几天内就开始了。到了 1 月 30 日，Perl NOC 报告称 ["Network Solutions 正在与合法的注册人 Tom Christiansen 合作，以恢复 Perl.com 域名。"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) 这项推进工作 ["最终促使该域名在 2 月初归还给了其前任所有者 Tom Christiansen。"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

但“归还”并不意味着“修复完毕”。brian d foy 自己的表述既表达了如释重负的心情，也指出了未竟的工作：["Perl.com 域名已回到了 Tom Christiansen 手中，我们正在进行各项安全更新，以防此类事件再次发生。"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) 由于该域名曾指向一个与恶意软件关联的 IP，安全产品已经将其列入黑名单，一些 DNS 解析器也在对其进行黑洞路由（sinkholing）。即使在注册局的记录被修正后，又花了数周时间，该域名才在互联网的信誉系统中重新获得信任——这一长尾效应让整个苦难历程拉长到了大约两个月的时间。

用 foy 的话来说，这起事件的标题几乎算是轻描淡写了：["有整整一个星期，我们失去了对 Perl.com 域名的控制。"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) 实际上，这是一个星期的活跃盗窃期；在此之前，经历了长达数月的潜伏被黑期；之后，又经历了数周的清理期。

## 关于注册商账户安全和长期持有域名的深刻教训

perl.com 失窃案之所以如此具有教育意义，正是因为其中并没有什么稀奇古怪的手法。抽丝剥茧之后，我们得出的教训具有一种令人不安的普遍性：

1. **您的注册商账户才是真正的“皇冠明珠”。** 每个人都在加固他们的服务器和 DNS 主机。但是，域名的*所有权记录*存在于注册商那里，而保护这个账户的往往只有一个密码，以及一个可以被说服并进行更改的客服团队。perl.com 就是在那里被盗的，而不是在边缘网络被攻破的。

2. **社会工程学战胜了技术控制。** 根本没有用到漏洞利用程序，受害者端也没有被植入恶意软件——只有 ["伪造的文件等等"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.)，其说服力足以让客服去更改一条真实的记录。如果注册商的*人工客服*被说服并越权操作，那么您自己登录时设置的双重认证（2FA）也无济于事。

3. **长期持有的域名是软目标。** 一个注册于 90 年代初、并在长达三十年里自动续费的域名，往往会积累过时的联系信息，存在单点人员故障的风险，而且所有者也不会每天去查看 WHOIS 记录。正是这种表面上的“风平浪静”，导致了 9 月份的入侵直到 1 月份才被发现。

4. **转移规则是一把双刃剑。** 本意是用来*保护*所有权人、在更新后锁定 60 天的转移限制，却成了攻击者的“候车室”。耐心加上跨注册商和跨国界的“洗白”，将原本可以快速解决的事件变成了一场牵扯多方、历时数周的漫长恢复行动。

5. **恢复的速度远慢于盗窃。** 盗走域名只需要一份伪造的文件。而找回它则需要注册商、注册局、合法所有权人的证据，然后还需要花费数周时间在封锁名单和解析器中重建信誉。盗窃只需一次交易；而物归原主则需要无数次交涉。

总结起来十分残酷：对于像 perl.com 这样的域名来说，密码强度的重要性，远不及你的注册商是否容易被欺骗从而绕过密码来得重要。

## Namefi 的视角

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

perl.com 盗窃案的每一步都暴露了一个弱点：所有权只是*别人账户里的一条记录*，任何能说服特定客服人员的人都可以更改它。攻击者根本不需要所有权人的密钥。他们需要的是注册商的信任——一张伪造的纸就足以将一项拥有三十年历史的资产跨越大半个地球转移走，并挂牌出售。

[Namefi](https://namefi.io) 则是建立在截然相反的前提之上：域名的所有权应该可以通过密码学验证，并且难以被悄无声息地篡改。通过将域名控制权转化为代币化、兼容 DNS 的链上资产，“谁拥有这个域名？”的权威答案，不再是注册商数据库里一行可以通过一通花言巧语的电话就能被更改的易变数据。域名转移变成了经过签名的、可审计的事件，而不是后台的文书工作——从而彻底堵死了欺诈性“所有权变更”的暗门。

它并不能让 perl.com 在一夜之间变得绝对无法被盗；毕竟注册商和注册局仍然是整个链条的一部分。但是，它直击了定义此次事件的确切故障模式——即*为一个域名付费三十年*与*能够防篡改地证明它属于你*之间的鸿沟——并且大大缩短了被盗域名在任何人提出异议之前被“洗白”的时间窗口。

perl.com 最终找回了它的大门。但这段插曲留下了一个更令人深思的问题：为什么这把锁，竟然是一个拿着所谓正确文件的陌生人就能轻易打开的？

## 参考来源与延伸阅读

- Perl NOC — [perl.com 被劫持](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (brian d foy) — [Perl.com 劫持案](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [Perl.com 域名被盗，目前正使用与恶意软件相关联的 IP 地址](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [Perl.com 失窃归咎于社会工程学攻击](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [黑客在劫持数月前就已控制了 Perl.com 域名](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [攻击者于 2020 年 9 月接管了 Perl.com 域名](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [知名编程网站 Perl.com 的域名在“黑客攻击”中被盗](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [Perl.com 域名被盗，现指向过去恶意软件活动使用的 IP 地址](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [perl.com 域名遭到劫持](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [Perl.com 编辑讲述 Perl.com 域名劫持案的真相](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)