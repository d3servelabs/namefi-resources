---
title: 'Sex.com 劫案：一封伪造信件如何偷走互联网最昂贵的域名'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '1995年，骗子斯蒂芬·科恩（Stephen Cohen）仅凭一封寄给 Network Solutions 的伪造信件，就从合法所有者加里·克雷门（Gary Kremen）手中偷走了 sex.com。这场长达数年的域名争夺战最终以 6500 万美元的判决、一名逃亡墨西哥的逃犯以及一项将域名认定为财产的具有里程碑意义的裁决而告终。'
keywords: ['sex.com', '域名盗窃', 'Stephen Cohen', 'Gary Kremen', 'Kremen v. Cohen', 'Network Solutions', '伪造信件', '域名劫持', 'Sharon Dimmick 信件', '域名安全', '域名作为财产', '6500万美元判决', '域名转移欺诈', 'Domain Mayday']
---

1995年，互联网上最具价值的地址仅仅因为一张纸就易了主。

没有入室盗窃，没有勒索赎金，也没有奇技淫巧的黑客攻击。一名骗子打印了一封信，签上了一个不属于他的名字，并将其传真给位于弗吉尼亚州的一家域名注册商。注册商读了这封信并信以为真，就这样把 **sex.com** —— 这个后来据报道创造了高达 2.5 亿美元商业价值的域名 —— 交给了毫无所有权的人。合法所有者直到事后才发现，并在此后花了近十年的时间努力夺回它。

这是史上第一桩重大的域名劫案，它也为每个域名所有者都应深思的问题提供了最清晰的答案：*到底是什么在阻止别人轻易拿走我的域名？* 在 1995 年，答案是几乎没有任何东西。

欢迎来到 **Domain Mayday / 域名浩劫** —— 深入探讨那些重塑我们在互联网上拥有域名认知的一系列安全事件。第 02 集：一封伪造信件如何偷走了 sex.com。

## sex.com 的价值所在

1994 年初，企业家 [加里·克雷门（Gary Kremen，他也是 Match.com 的创始人）](https://en.wikipedia.org/wiki/Sex.com#:~:text=In%20early%201994%2C%20entrepreneur%20Gary%20Kremen%20%28who%20also%20founded%20Match.com) 审视了刚刚兴起的商业互联网，并敏锐地察觉到了显而易见的机会。法庭记录准确地给出了注册日期：[加里·克雷门于 1994 年 5 月 9 日向 Network Solutions, Inc. 注册了域名 sex.com](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424)。在当时，域名是免费的，只需发一封简单的电子邮件即可注册，几乎没有人知道它们未来会有多大价值。第九巡回上诉法院后来在该案判决书的开篇引用了一句笼罩整个事件的玩笑话：[“在互联网上搞色情？”大家都说。“那绝不可能赚到钱的。”](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)

它不仅赚了钱，而且赚得盆满钵满。域名被盗后，窃贼把它变成了一台印钞机：[一个充斥着广告的网站，每天高达 2500 万次点击](https://en.wikipedia.org/wiki/Sex.com#:~:text=an%20advertising%2Dheavy%20site%20that%20received%20up%20to%2025%20million%20hits%20a%20day)，据报道，通过点击率和其他广告，[每月可带来 50,000 到 500,000 美元的收入](https://en.wikipedia.org/wiki/Sex.com#:~:text=making%20%2450%2C000%20to%20%24500%2C000%20per%20month)。有报道称，在这个窃贼[非法控制 sex.com 域名的几年里，这个被盗的域名成为了一个价值 2.5 亿美元商业帝国的基石](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=may%20have%20created%20a%20%24250%2C000%2C000%20business%20during%20the%20years%20he%20had%20illicit%20control%20of%20the%20sex.com%20domain%20name)。正如一位行业观察家所言，[从某些方面来看，这个域名的价值可能超过迄今为止售出的任何一个域名](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=by%20some%20accounts%20could%20be%20worth%20more%20than%20any%20domain%20name%20sold%20to%20date)。

如此有价值的名字，被放置在 20 世纪 90 年代注册商那堪忧的安全防护之后，犹如一个只挂了一把纸锁的百宝箱。

## 盗窃案：一封伪造的信件

![Vivid colorful concept-art illustration of a forged paper letter sealed with a red wax stamp, sliding a glowing golden domain key out of a locked vault](../../assets/the-sex-com-heist-the-forged-letter-01-the-theft.jpg)

撬开这把锁的人是斯蒂芬·迈克尔·科恩（Stephen Michael Cohen），而且他并不是初犯。第九巡回上诉法院和维基百科都指出，他盯上 sex.com 时才刚刚刑满释放：[斯蒂芬·M·科恩刚刚因欺诈罪服刑期满](https://en.wikipedia.org/wiki/Kremen_v._Cohen#:~:text=who%20had%20recently%20completed%20a%20prison%20sentence%20after%20being%20convicted%20of%20fraud)。他看着 sex.com，看到了克雷门所看到的同样的东西——一笔巨大的财富——于是他决定把它占为己有。

他的手法简单得几乎是在侮辱人的智商。科恩[利用克雷门所在的 Online Classifieds 公司一名虚构高管的假信件，欺骗了 Network Solutions 授权将 Sex.com 转移给科恩](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=hoodwinked%20Network%20Solutions%20with%20a%20phony%20letter)。用同一个消息来源的话说，科恩[仅仅通过向域名注册商 Network Solutions 提交一份带有伪造签名的虚假转让信，就偷走了加里·克雷门的域名 sex.com](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=stole%20Gary%20Kremen%27s%20domain%20name%2C%20sex.com%2C%20simply%20by%20submitting%20a%20fake%20transfer%20letter)。

在 [1995 年 10 月 18 日，Network Solutions 在未经许可的情况下，将该域名转移给了斯蒂芬·M·科恩](https://en.wikipedia.org/wiki/Sex.com#:~:text=On%20October%2018%2C%201995%2C%20Network%20Solutions%20transferred%2C%20without%20permission%2C%20the%20domain%20to%20Stephen%20M.%20Cohen)，用维基百科的话说，这个人[一直试图通过虚假陈述、打电话、发电子邮件和伪造信件来获得该域名的控制权](https://en.wikipedia.org/wiki/Sex.com#:~:text=had%20been%20trying%20to%20gain%20control%20of%20the%20domain%20for%20some%20time%20by%20misrepresentation%2C%20using%20phone%20calls%2C%20e%2Dmails%20and%20forged%20letters)。互联网上最具价值的域名有了新的“主人”，而真正的主人甚至对此一无所知。

## 伪造的“Dimmick 信件”

![Vivid colorful concept-art illustration of an amateurish typewritten letter with a clumsily forged signature and a mismatched letterhead, glowing under a magnifying glass that reveals it as fake](../../assets/the-sex-com-heist-the-forged-letter-02-forged-letter.jpg)

这封伪造信本身值得我们停下来仔细审视，因为它绝不是什么大师之作。那是一份传真，而且十分粗糙。

根据地方法院的记录，[在一封标注日期为 1995 年 10 月 15 日的信中，莎伦·迪米克（Sharon Dimmick）据称代表 Online Classified 公司，告知斯蒂芬·科恩 Online Classified 已“决定放弃域名 sex.com”。](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424) 写信的人面临一个需要解决的现实问题：一家公司如何“放弃”一个域名，以便让一个陌生人能够将其抢注？科恩的答案（在上诉判决书中被引用）是让信中这样解释：[因为我们没有直接连接到互联网，所以我们请求您代表我们通知互联网注册机构，删除我们的域名 sex.com](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)。一家以运营网站为业务的公司，居然声称自己无法连接互联网——而 Network Solutions 居然毫不犹豫地信了。

信上的那个名字“Sharon Dimmick”确有其人，但她与放弃任何东西毫无关系。正如《环球邮报》报道的那样，Network Solutions 收到了[一封在 1995 年底寄出的信，信上的签名显然是莎琳·迪米克（Sharyn Dimmick），她当时是克雷门先生的室友](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)。科恩借用了克雷门室友的名字来冒充克雷门自己的公司。

不仅如此，他甚至把名字写错了。正如一份案件摘要直截了当地记录的那样，[科恩在伪造信件上拼错了迪米克（Dimmick）的签名](https://www.studicata.com/case-briefs/case/kremen-v-cohen)。后来就此案写书的记者更是毫不留情，他将这份文件描述为[据说发送该文件的人甚至无法拼对自己的名字；信头看起来就像是一个文盲幼儿园学生用 John Bull 家用印刷机印出来的](https://www.theregister.com/2007/05/31/sex_dot_com_review/)。

正是这些细节让这个故事显得如此刺痛。保护着互联网上最有价值域名的锁是如此脆弱，以至于被一份连自己的“作者”都拼不对名字的伪造信件轻易撬开——而注册商竟然[对其信以为真，拱手让出了控制权](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)。

## 历时数年的域名夺回战

让 sex.com 被偷走只用了一封信。但要夺回它却花去了数年的诉讼时间，克雷门不得不面临双线作战：一方面对抗科恩，另一方面对抗那个轻易交出他域名的注册商。

在对抗科恩方面，事实确凿无疑，科恩心知肚明。他做出了骗子们一贯的回应方式——伪造更多文件。他[伪造文件以证明他一直拥有该域名并在 sex.com 上拥有商标](https://en.wikipedia.org/wiki/Kremen_v._Cohen)，构建了一段虚构的历史来为自己的盗窃行为辩护。法庭并没有被愚弄。詹姆斯·韦尔（James Ware）法官裁定转移无效：[地方法院裁定科恩犯有欺诈罪，并宣布其对 sex.com 的所有权无效，因为他是通过欺诈信件获得该域名的](https://en.wikipedia.org/wiki/Kremen_v._Cohen)。MoreLaw 的判决记录简单明了地陈述了结果——[判决原告胜诉，并命令将 sex.com 归还给原告](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424)。克雷门，[被法官裁定为 sex.com 真正所有者的人](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)，终于拿回了他的域名。

更艰难的战斗是对抗 Network Solutions，这也是对其他人而言最具意义的部分。克雷门认为注册商应为其“侵占转换（converting）”其财产的行为负责——即把属于他的财产随意送人。Network Solutions 则辩称，域名根本不是“财产”，而仅仅是其提供的一项服务，下级法院最初同意了这一观点。在上诉中，科津斯基（Kozinski）法官驳回了该观点，并将域名明确纳入了物权法的范畴：[克雷门的域名受加州财产侵占转换法（California conversion law）的保护](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)。他的比喻一针见血——他写道，凭一封伪造的信件将域名交给错误的人，[与一家公司在同样情况下将某人的股份转让给他人并因此承担责任毫无区别](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)。该案随后达成和解，但确立的原则保留了下来：域名是你可以拥有、可能失去、并且可以为此提起诉讼的财产。

## 6500万美元的判决——以及科恩的潜逃

与这起盗窃案相关的赔偿金额在当时是极其庞大的。法院裁定科恩犯有[欺诈和伪造罪，需赔偿4000万美元的利润损失和2500万美元的惩罚性赔偿](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=the%20sum%20of%20%2440%20million%20in%20compensation%20for%20lost%20profits%20and%20%2425%20million%20in%20punitive%20damages)——第九巡回法庭将这项判决总额概括为法院[判给4000万美元的补偿性赔偿金和另外2500万美元的惩罚性赔偿金](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)。《The Register》对这场风波的结局作了干脆利落的总结：这场战斗[最终于2001年4月结束，克雷门拿回了域名，并获得了6500万美元的赔偿](https://www.theregister.com/2007/05/31/sex_dot_com_review/)。

然而，拿到这笔钱完全是另一回事。科恩根本不打算付钱。他[无视法院命令，并将巨额资金电汇至离岸账户](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)，这使得法官（用判决书里的话说）不再客气：他[宣布科恩为在逃犯，签署了逮捕令，并派遣美国法警追捕他](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)。那时科恩早就逃之夭夭了。[当逮捕令发出时，科恩逃到了墨西哥](https://en.wikipedia.org/wiki/Sex.com#:~:text=When%20an%20arrest%20warrant%20was%20issued%2C%20Cohen%20fled%20to%20Mexico)，成为《环球邮报》所称的[互联网上第一个域名逃犯，遭到美国和墨西哥警方的通缉](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)。他[宣布个人破产并潜逃至墨西哥，在那里他躲避了数年的追捕，直到2005年因违反移民法被墨西哥当局驱逐出境](https://en.wikipedia.org/wiki/Kremen_v._Cohen)。

克雷门赢回了域名和判决。但他从来没有接近过拿回这全部的6500万美元。这是一个残酷但重要的教训：一纸判决的价值，完全取决于你对一个铁了心要逃跑的人的执行能力。

## 在 20 世纪 90 年代，注册商为何会让这种事情发生

人们很容易将此视为由于一家注册商的疏忽导致的一次罕见的意外事件。事实并非如此。这是1995年域名所有权实际运作方式的必然结果。

在那个年代，你拥有一个域名的“证明”仅仅是注册商数据库中的一条记录和一个管理联系人——而更改它的方法就是发出“请求”，通常是通过信件或传真。没有密码学签名验证，没有双重身份确认（2FA），在域名转移完成前也没有自动发送给现有所有者的通知。这套系统完全基于信任以及“没有人会公然撒谎”的假设之上。面对科恩的信，Network Solutions [根本没有尝试联系克雷门](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/)，正如维基百科所总结的那样，[对科恩的欺诈信件信以为真，也没有进行任何尽职调查以发现科恩理由中的漏洞，更没有联系克雷门以核实他是否真的放弃了该域名](https://en.wikipedia.org/wiki/Kremen_v._Cohen#:~:text=took%20Cohen%27s%20fraudulent%20letter%20at%20face%20value)。

有两个系统性结构缺陷在此交织叠加：

- **基于冒充的授权。** 注册商验证的是一份“文件”，而不是一个“活人”。任何人只要能伪造一封看似合理的、带有目标“公司”字样的信件，就可以转移一个域名。身份仅仅是一件可以随时穿上的戏服。
- **不通知真正的所有者。** 唯一能彻底阻止这种行为的控制措施——在行动前告诉克雷门“有人试图转移你的域名”——根本不存在。受害者总是最后一个知道的。

这些并不是科恩的过错。这是一个把世界上最有价值的资产当成图书馆借书证一样对待的系统性失灵。

## 这对域名所有权有何启示

sex.com 劫案已经过去三十年了，但其留下的教训历久弥新，因为域名所有权的底层架构发生的变化并没有你想象的那么大。

1. **你的域名是你的财产 —— 而财产是会被偷的。** *Kremen 诉 Cohen 案*最深远的影响是裁定域名受侵权法（侵占财产法）保护的财产。这是个好消息（你拥有权利），但同时也是个警告（任何有价值且有主人的东西，都值得窃贼铤而走险）。
2. **最薄弱的环节是转移流程，而不是密码。** 科恩从来没有猜过密码。他攻击的是“行政管理”路径——即用来更改域名所有者的由人类执行的流程。今天，大多数的域名劫持事件仍然针对这一痛点：注册商客服、转移授权、以及联系人记录的修改。
3. **纸面信任不等于安全。** “它看起来很官方”，地球上最昂贵的域名就是这样被人光明正大地拿走的。一个签名、一个信头、一个听起来说得过去的理由——这些都不能证明到底谁才是真正拥有授权的人。
4. **通知和验证是不可妥协的底线。** 唯一能够阻止整场劫案的控制手段，就是能在行动前与真正的所有者确认该请求。任何无需以可证伪方式让你参与其中就能转移域名的系统，都意味着你随时可能失去该域名。
5. **一纸判决不等于全额追回。** 克雷门赢得了6500万美元的赔偿，但实际拿回来的数额远低于此。事前预防永远胜于事后诉讼，因为当一个逃犯已经将你的域名变现，而法庭又找不到他时，你是无法靠打官司把域名要回来的。

## Namefi 的独特视角

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-sex-com-heist-the-forged-letter-03-namefi-angle.jpg)

抛开潜逃墨西哥和色情帝国带来的巨额收入不谈，sex.com 劫案实质上讲的是一件事：在当时，根本不存在一个防篡改且由所有者控制的所有权记录。所有权仅存在于私有数据库中，任何能用一封签有拼错名字的伪造信件骗过办事员的人，都可以随意改写它。

[Namefi](https://namefi.io) 则从完全相反的理念出发。当一个域名被代币化（Tokenized）时，其所有权便锚定在**你**所控制的密码学密钥上，每一次转移都是一次经授权、可见且可审计的链上操作，而绝非一份被某人“信以为真”的传真。没有可以被欺骗的办事员，没有因为一封看似合理的信件就越权处理所有者权益的后台行政通道，也没有所有者几个月后才发现的暗箱转移。控制权是可验证的，转移需要所有者的加密签名，并且系统在架构设计上使得审计轨迹公开透明——同时，它还能与维系整个互联网运转的 DNS 系统保持完全兼容。

科恩的伪造信之所以能得逞，是因为站在他和 sex.com 之间的唯一屏障，仅仅是别人是否愿意相信一张纸。可验证、防篡改的所有权，其核心目的就是让这种攻击在根本上无法尝试：你无法像伪造签名那样去冒充私钥。互联网史上第一桩重大域名盗窃案给我们上的最有价值的一课是：***谁拥有这个域名*应该是一个你能以密码学证明的客观事实，而不是一个陌生人可以编造的故事**。

## 参考资料与延伸阅读

- 维基百科 — [Sex.com](https://en.wikipedia.org/wiki/Sex.com)
- 维基百科 — [Kremen v. Cohen](https://en.wikipedia.org/wiki/Kremen_v._Cohen)
- 美国第九巡回上诉法院 — [Kremen v. Cohen / Online Classifieds v. Network Solutions, 325 F.3d 1035 (完整判决书PDF)](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)
- MoreLaw — [Gary Kremen 诉 Stephen Michael Cohen 等人 (案件记录)](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424)
- CircleID — [域名盗窃、欺诈与监管规制](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/)
- 环球邮报 — [逃犯、丘比特与 sex.com](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)
- The Register — [Sex.com：如果你敢的话就读吧 (Kieren McCarthy 书评)](https://www.theregister.com/2007/05/31/sex_dot_com_review/)
- Studicata — [Kremen 诉 Cohen 案 — 案件摘要](https://www.studicata.com/case-briefs/case/kremen-v-cohen)
- Kieren McCarthy — [Sex.com 案件真相内幕](https://www.kierenmccarthy.co.uk/2006/12/09/the-lowdown-on-the-sexcom-case/)
- CircleID — [书评：Kieren McCarthy 所著的《Sex.com》](https://circleid.com/posts/book_sex_com_by_kieren_mccarthy)