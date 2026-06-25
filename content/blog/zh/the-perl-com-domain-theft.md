---
title: 'Perl.com 域名盗窃事件：一个拥有30年历史的社区门户是如何被悄然窃取的'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2021年1月下旬，拥有数十年历史的Perl编程社区门户 perl.com 遭到盗窃——攻击者通过入侵注册商账户，将域名经中国转移，指向一个与恶意软件相关的IP地址，并以19万美元挂牌出售。本文还原事件经过、记录域名找回过程，并深入探讨注册商账户安全的重要性。'
keywords: ['perl.com', 'perl.com域名盗窃', '域名劫持', '域名盗窃', '注册商账户入侵', '社会工程学', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'DNS劫持', '域名安全', '账户接管', 'BizCN']
---

有些域名是基础设施，只是碰巧以名字的形式存在。**perl.com** 就是其中之一。它不是某个品牌去年打造的营销资产，而是互联网早期以来Perl编程社区赖以为家的一块网络门牌——承载着文档、文章以及这门语言公众形象的权威入口。

因此，当2021年1月27日清晨，这扇门突然归属他人时，这不是什么聪明的品牌操作，也不是谈判达成的转让——而是一场盗窃。该域名早在数月前便已被人悄悄从合法所有者手中撬走，辗转穿越多家注册商，最终被指向一个曾与恶意软件分发相关的IP地址。Perl社区的网络运营人员直言不讳地写道：["perl.com 域名今早遭到劫持，目前正指向一个停放页面。"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

这是我们"域名告急"系列的第EP19期：一个拥有三十年历史的社区域名，在没有任何服务器被攻破的情况下遭到窃取，以及将其追回所历经的艰辛。

## 一个持有自90年代初的域名

要理解这场盗窃，必须先了解当时的托管方式有多普通——而恰恰是这种普通，构成了最大的漏洞。

perl.com 并非存放在某个严密保护的企业金库中。它的管理方式和大多数长期持有的域名一模一样：由一位受信任的个人掌管，托管在主流[注册商](/zh/glossary/registrar/)，年复一年地续费，平静如水。该网站的编辑 brian d foy 在其事件复盘文章中描述了这段历史：["这个域名注册于90年代初，不久后由 Tom Christiansen 接手，基本上就是一直在缴纳注册费。"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

这几乎是互联网上最重要的一大批域名的共同画像：一个人、一个注册商登录账号，以及三十年如一日安静地缴费。这套方式运行得无比完美——直到注册商账户本身成为攻击目标的那一天。

## 2021年1月27日：门锁换了主人

![一幅充满活力的概念艺术图：夜色中，一块拥有数十年历史的木制社区路牌被悄悄从柱子上拧下并搬走，背景是发光的电路板天空](../../assets/the-perl-com-domain-theft-01-theft.jpg)

第一声公开警报来自Perl社区基础设施的运维人员。Perl NOC（网络运营中心）博客发文称，域名"今早"遭到劫持，现已指向不该指向的地方。更为严峻的是，运维人员警告称，["有迹象表明这可能与过去曾分发恶意软件的网站有关。"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

brian d foy 当天也公开发声。媒体对此事件的报道以清晰的文字还原了时间线：["1月27日，Perl编程作者、Perl.com编辑 brian d foy 在推特上发文，称 perl.com 域名突然被登记在另一人名下。"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

社区的响应迅速而务实。在启动追回工作的同时，NOC 将读者引导至备用站点：["如果您需要查看内容，可以访问 perldotcom.perl.org。"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) 权威域名虽已失守，但内容仍可访问。

## 风险所在：一个关联恶意软件的IP地址

一个被盗域名的危险程度，与它所承载的信任度成正比——而 perl.com 承载着极高的信任。数以百万计的开发者、教程、CPAN工具链，以及整个互联网上无数的外部链接，都指向这个域名。控制了这个名字，就控制了所有这些信任所指向的目的地。

新"主人"并没有把它指向无害的地方。正如BleepingComputer所记录的：["域名 perl.com 遭到盗窃，目前指向一个与恶意软件活动相关的IP地址。"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

技术层面的痕迹非常具体。DNS记录被篡改，["分配给该域名的IP地址从 151.101.2.132 更改为 Google Cloud IP 地址 35.186.238[.]101。"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) 而这个目标地址有着不光彩的历史：["2019年，IP地址 35.186.238[.]101 曾与一个传播 Locky 勒索软件可执行文件的域名相关联，而该勒索软件现已停止活动。"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

将这两个事实叠加，危险显而易见：一个开发者本能信任的域名，突然解析到一个有恶意软件历史的IP——这几乎是专门为欺骗那些通常难以欺骗的技术型、安全意识强的用户量身定制的陷阱。

## 事件经过：被攻击的是注册商账户，而非服务器

![一幅充满活力的概念艺术图：一张伪造的所有权变更单被推过注册服务台，官方橡皮章发出红色光芒，文件在霓虹灯光中飞旋——无任何品牌标识](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

这正是使这起事件成为教科书案例而非脚注的关键：没有人入侵 perl.com 的网络服务器，也没有人猜到DNS密码。攻击发生在更上一层——注册商，即持有域名所有权权威记录的公司。

brian d foy 在事后总结中直接描述了推断的攻击手法：["我们认为攻击者对 Network Solutions 实施了社会工程学攻击，包括伪造文件等手段。"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) 媒体的表述如出一辙：此次盗窃是["一次社会工程学攻击，说服注册商 Network Solutions 在未获有效授权的情况下修改了域名记录。"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

最令人不安的细节在于时间线。社区直到1月才*发现*异常，但实际的入侵发生得更早。域名律师 John Berryhill 的取证工作将真正的入侵时间追溯至数月之前；perl.com 的文章记录道：["John Berryhill 在推特上提供了一些取证分析，显示入侵实际上发生在9月。"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek 也证实了攻击者的耐心：["他解释说，攻击发生在2020年9月"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020)——比任何人发现异常早了大约四个月。

为什么等待这么久？因为域名转移的规则奖励了耐心。["ICANN 禁止在联系信息更新后的60天内转移域名。"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) 九月悄然控制注册商账户的攻击者无法立刻将域名转走——于是他们静静等候，等锁定期满后再出手。

等到真正出手时，他们通过多家注册商和跨境转移来洗白域名，增加追回难度。The Register 记录了第一步跳转：["该域名于12月被转移至 BizCN 注册商，但域名服务器未作更改。"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer 从地理角度还原了同一路径：该域名["于2020年9月在 Network Solutions 遭到盗窃，随后在圣诞节当天被转移至中国的一家注册商"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day)，然后在1月完成最后一跳——["域名再次于1月被转移至另一家注册商 Key Systems, GmbH。"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

随后，他们试图套现。在域名转移至新地后，["未经授权的持有人试图在域名交易市场 Afternic 以19万美元的价格出售该域名。"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) 一个拥有三十年历史的社区资产，凭借一纸伪造文件被盗，像二手家具一样挂牌出售。

## 追回过程：用繁琐的文书工作，撤销一场繁琐的文书犯罪

促成此次盗窃的那套机制——注册商、[注册局](/zh/glossary/registry/)和所有权记录——也是唯一的追回路径。没有服务器需要重新加固，没有补丁可以部署。唯一的办法是通过注册商和注册局的层层链条，*证明* Tom Christiansen 才是真正的所有者，而新"所有者"是骗子。

追回工作在事发数日内便已启动。1月30日，Perl NOC 报告称["Network Solutions 正与合法注册人 Tom Christiansen 合作，推进 Perl.com 域名的追回工作。"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) 这一努力["最终促成域名于2月初归还给原所有者 Tom Christiansen。"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

但"归还"并不等于"恢复正常"。brian d foy 的表述同时传递出如释重负与尚未了结的两种情绪：["Perl.com 域名已回到 Tom Christiansen 手中，我们正在进行各项安全加固，以防止此类事件再次发生。"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) 由于域名曾指向一个与恶意软件相关的IP，安全产品已将其列入黑名单，部分DNS解析器也对其实施了封堵。即便注册局记录恢复正确，该域名在整个互联网信誉体系中重获信任仍花费了数周时间——这条漫长的尾巴将整个事件的影响拖延至近两个月之久。

foy 的总结几乎显得有些轻描淡写：["我们失去了对 Perl.com 域名的控制一周。"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) 一周的实际被盗；数月的潜伏入侵在此之前；数周的善后清理在此之后。

## 这件事对注册商账户安全和长期持有域名的警示

perl.com 事件之所以如此具有警示意义，正是因为其中没有任何异乎寻常的手段。剥去表层，得出的教训令人不安地普遍适用：

1. **注册商账户才是真正的皇冠明珠。** 人们普遍重视服务器和DNS主机的加固。但域名的*所有权记录*存放在注册商处，而那个账户往往只靠一个密码和一个可被说服的客服团队来保护。perl.com 就是在那里被盗的，而非在边缘层。

2. **社会工程学能突破技术防线。** 攻击者没有使用任何漏洞利用程序，受害方也没有遭遇恶意软件——只凭["伪造文件等手段"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.)就足以篡改真实记录。即便你自己的登录启用了双因素认证，也无法阻止注册商的*人工客服*被说服绕过它。

3. **长期持有的域名是软目标。** 注册于90年代初、三十年来依靠自动续费维持的域名，往往积累了过时的联系信息、单点人为失误风险，以及一位不会每天盯着[WHOIS](/zh/glossary/whois/)记录的所有者。正是这种平静的稳定性，让一次9月的入侵直到1月才被察觉。

4. **转移规则是一把双刃剑。** 本应*保护*所有者的"更新联系信息后60天内禁止转移"规则，反而成了攻击者的候客室。耐心等待，加上跨注册商、跨国境的洗白操作，将原本简单的修复变成了一场耗时数周、涉及多方的漫长追回战。

5. **追回永远比盗窃慢。** 盗取域名只需一份伪造文件。追回域名则需要注册商、注册局、合法所有者的举证，以及此后数周对黑名单和解析器的信誉重建。盗窃是一次交易；追偿是无数次周折。

冷峻的总结：对于 perl.com 这样的域名，你的密码强度，远不如你的注册商能否被人忽悠着绕过它来得重要。

## Namefi 的视角

![一幅色彩斑斓的插图，展示可验证、防篡改的域名所有权——一张域名卡片受到绿色盾牌、绿色Namefi代币及DNS连续性的多重保护](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

perl.com 盗窃事件的每一个环节，都指向同一个弱点：所有权不过是*存储在他人账户中的一条记录*，任何能够说服正确客服人员的人都可以修改它。攻击者根本不需要所有者的密钥，他们需要的是注册商的信任——而一张伪造的纸质文件，就足以将一个拥有三十年历史的资产跨越半个地球转移并挂牌出售。

[Namefi](https://namefi.io) 的构建逻辑与此截然相反：[域名所有权](/zh/glossary/domain-ownership/)应当是可加密验证的，难以被悄然篡改。通过将域名控制权表示为与DNS兼容的链上代币化资产，"谁拥有这个名字"的权威答案，不再是注册商数据库中一行可被一通电话随意翻转的可变记录。转移操作变成了可签名、可审计的事件，而非后台文书——伪造的"所有权变更"再也找不到可以悄然穿越的暗门。

这不会让 perl.com 从此坚不可摧；注册商和注册局仍是链条的一部分。但它直击定义此次事件的那个根本性失败——*为一个名字付费三十年*与*能够以防篡改方式证明它属于你*之间的鸿沟——并大幅压缩了被盗域名在任何人能够提出异议之前被洗白的时间窗口。

perl.com 找回了它的门。而这起事件留下的更深问题是：为什么这把锁，曾经是一个拿着合适文件的陌生人就能打开的？

## 来源与延伸阅读

- The Perl NOC — [perl.com 遭到劫持](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com（brian d foy）— [Perl.com 劫持事件始末](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [Perl.com 域名被盗，现指向与恶意软件相关的IP地址](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [Perl.com 盗窃事件归因社会工程学攻击](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [黑客在劫持前数月已控制 Perl.com 域名](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [攻击者于2020年9月接管 Perl.com 域名](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [热门编程网站 Perl.com 的域名遭"黑客"盗取](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [Perl.com 域名被盗，现指向过去恶意软件活动的IP地址](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [perl.com 域名遭劫持](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [Perl.com 编辑讲述 Perl.com 域名劫持事件真相](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)
