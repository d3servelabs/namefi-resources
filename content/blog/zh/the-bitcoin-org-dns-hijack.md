---
title: "Bitcoin.org DNS劫持事件：比特币官网如何沦为“双倍返币”骗局"
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "2021年9月，由化名运营者Cobra维护的比特币长期信息大本营Bitcoin.org在DNS层遭到劫持，被篡改为虚假的“双倍返还比特币”赠送骗局。在该网站被关停前，诈骗分子非法牟利约17,000美元。本文是一篇Domain Mayday深度解析，带你回顾事件的起因、经过，以及它为高度依赖DNS的加密原生网站敲响的警钟。"
keywords: ['bitcoin.org', 'bitcoin.org黑客攻击', 'DNS劫持', '域名劫持', '双倍比特币骗局', '加密货币空投骗局', 'cobra bitcoin.org', 'cloudflare dns', 'namecheap', 'DNS安全', '域名安全', '域名服务器劫持', 'whois篡改攻击']
---

十多年来，如果你想得到关于“什么是比特币以及如何安全使用它”的直白且中立的答案，互联网总会把你引向同一个地址：**Bitcoin.org**。

它从来不是一家交易所，也从未出售过任何东西。对于这个世界上最具抗对抗性、去信任化的货币而言，它是最接近*官方*迎宾垫的存在——这个网站[注册于2008年8月18日](https://en.wikipedia.org/wiki/Bitcoin#:~:text=The%20domain%20name%20bitcoin.org%20was%20registered)，比创世区块本身还要古老。这里是比特币白皮书的存放地，也是教导新人的地方，向他们传授加密货币的第一准则：*做自己的银行，不要把私钥托付给任何人。*

因此，在**2021年9月23日星期四**发生的事件充满了残酷的讽刺意味。整个加密领域被反复强调最多的安全守则——*如果有人承诺双倍返还你的代币，那一定是骗局*——竟然在比特币自己的大门上被反向播报。在短短几个小时内，这个教导人们不要落入“双倍返币”陷阱的网站，本身*变成了*一个“双倍返币”的骗局。而这一切的发生，并不是因为有人黑进了服务器，而是因为有人控制了它的**域名**。

## 比特币象征性的信任大本营

要理解这次劫持为何如此刺痛人心，你必须了解 Bitcoin.org 意味着什么。

比特币没有CEO，没有总部，也没有官方发言人。多年来，它拥有的只是由社区运营的少数参考网站，而 Bitcoin.org 是其中最知名的一个。CryptoPotato 称其为[与BTC相关的最古老的网站，注册于13年多以前](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/#:~:text=the%20oldest%20website%20in%20relation%20to)。它托管着钱包推荐、入门指南以及中本聪白皮书的副本。

同样契合比特币特质的是，它的运营者如同幽灵一般。该网站由一位化名为 **Cobra** 的神秘人士维护——他出于原则保持匿名。而这一原则最近在法庭上受到了考验：就在几个月前，自称“中本聪”的 Craig Wright 在英国赢得了一场版权诉讼，迫使 Bitcoin.org 下架白皮书，法官下达了[禁止 Cobra 在英国侵犯 Wright 版权的禁令](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=injunction%20prohibiting%20Cobra%20from%20infringing)。Cobra 对自身匿名的辩护充满了诗意：[法庭规则允许我以化名被起诉，然而，我却不能以化名进行自我辩护](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=the%20court%20rules%20allowed%20for%20me%20to%20be%20sued%20pseudonymously)。

关键在于，Bitcoin.org 承载着*信任*——一种无领导者运动本不该拥有的机构级信任，在十三年间悄然积累而成。而这种信任，恰恰使它成为了攻击目标。宿主越具可信度，骗局的效果就越好。而在加密领域，很少有哪个宿主能比比特币自己的名字更具可信度。

这里还隐藏着第二重更为尖锐的讽刺。Bitcoin.org 的核心精神是*自我托管*：掌管自己的私钥，不信任任何托管人，验证一切。一个将这一教训内化于心的访客，绝不会凭一句承诺就把代币打入陌生人的钱包。但这个赠送骗局并没有要求他们信任一个陌生人——它要求他们信任 *Bitcoin.org 本身*，那个多年来一直被告诉他们是最安全起点的地址。这次攻击并未击败这种防范意识；它劫持了传递这一意识的使者。

## 2021年9月：劫持与虚假空投

![Vivid colorful concept art of a trusted coastal lighthouse domain that has been hijacked, its beam now flashing a glowing fake sign reading double your coins out over the water toward small boats](../../assets/the-bitcoin-org-dns-hijack-01-hijack.jpg)

2021年9月23日上午，访问 Bitcoin.org 的用户看到的并不是钱包指南。他们看到的是一个弹窗——一个干净、看起来非常官方的覆盖层，直接印在比特币最受信任参考网站的首页上。

这个信息披着借来的权威外衣，玩着加密领域最老套的把戏。它声称**比特币基金会**正在[回馈社区](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=giving%20back%20to%20the%20community)，表示该活动仅限[前10,000名用户](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=first%2010%2C000)，并做出了一个简单的承诺：[将比特币发送到此地址，我们将双倍返还！](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=Send%20Bitcoin%20to%20this%20address%2C%20and%20we%20will%20send%20double)。一个二维码让整个操作变得毫无阻力。正如 CoinDesk 对此类骗局的干瘪描述，其套路总是如出一辙：[这些计划给出了虚假承诺，声称只要通过二维码向某个钱包地址发送一笔初始资金，就能让资金翻倍](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=these%20schemes%20give%20false%20promises%20of%20doubling)。而结果也总是惊人地一致：[事实上，受害者什么也得不到，还会失去他们发送的加密货币](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=Victims%2C%20in%20fact%2C%20receive%20nothing)。

Cobra 公开且直言不讳地确认了这次黑客入侵，他发帖称该网站[已遭到入侵。目前正在调查黑客是如何将诈骗弹窗放到网站上的](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=has%20been%20compromised.%20Currently%20looking%20into%20how%20the%20hackers)。

## 访客们的损失

“双倍返利”的骗局只有在有人相信的情况下才能得逞。如果是在一个名不见经传的随机网站上，几乎没人会信。但在 *Bitcoin.org* 上，确实有人上当了。

诈骗钱包并没有一直空着。据 BleepingComputer 报道，该地址[最后更新的钱包余额为 0.40571238 BTC，约合 17,000 美元](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=0.40571238%20BTC%20or%20approximately%20US%2417%2C000)。实时捕捉到这一事件的 CoinDesk 指出，[截至发稿时，该赠送骗局的地址已收到超过 17,700 美元的小额交易](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=received%20over%20%2417%2C700%20in%20small%20transactions)。

一万七千美元就在一夜之间不翼而飞，而这场骗局的主办网站本来是会警告你防范这种风险的。请记住比特币设计中最残酷的一面：这些交易是不可逆的。没有退款，没有防欺诈部门，也没有“打电话给银行”这回事。正是这种不可逆转的特性赋予了比特币强大的力量，但也使得每一位受害者在扫描二维码的那一瞬间，其损失就成了永久性的定局。

损失的美元金额其实几乎无关紧要。真正的破坏在于摧毁了 Bitcoin.org 花了十三年时间建立起来的东西——人们理所当然地认为，在所有网址中，*这个*地址是值得信赖、绝对安全的。

## 始末缘由：一次DNS沦陷，而非服务器被黑

![Vivid colorful concept art of a redirected road signpost at a glowing fork, one arrow secretly repainted to point traffic toward a golden funnel trap shaped like a coin, the original safe path left dark](../../assets/the-bitcoin-org-dns-hijack-02-fake-giveaway.jpg)

让这个事件成为一则经典的 *Domain Mayday*（域名紧急呼救）案例，而非又一个普通网络钓鱼故事的细节在于：**攻击者根本不需要入侵 Bitcoin.org 的服务器。**

Cobra 在这一点上非常坚决。他表示，源服务器完好无损——[我真正的服务器在黑客攻击期间没有接收到任何流量](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=my%20actual%20server%20didn%27t%20get%20any%20traffic%20during%20the%20hack)。相反，攻击发生在上层网络，即互联网决定*域名指向何处*的那个层级。关注此事件的观察人士指出，[WHOIS信息在黑客攻击发生时被更新，域名服务器和DNS均遭篡改](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack)。一旦你控制了域名服务器，你就掌握了“bitcoin.org *到底*是哪台服务器”这个问题的决定权——你可以悄无声息地将一个受信任的域名指向你自己控制的服务器。

Cobra 自己的诊断结果将责任归咎于 DNS 层以及近期的一次基础设施变动。正如他所说：[Bitcoin.org 以前从未被黑过。但我们转移到 Cloudflare 后，两个月就被黑了。](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=Bitcoin.org%20hasn%27t%20been%20hacked%2C%20ever.%20And%20then%20we%20move%20to%20Cloudflare) 他的初步推论十分具体且具有指控性：[攻击者似乎利用了DNS中的某个漏洞](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20attackers%20just%20seem%20to%20have%20exploited%20some%20flaw%20in%20the%20DNS)。Decrypt 也以同样的方式总结了普遍的看法：攻击者[在两个月前该网站迁移至Cloudflare后，利用了其DNS配置中的缺陷](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/#:~:text=exploited%20a%20flaw%20in%20the%20DNS%20configuration%20after%20the%20website%20moved%20to%20Cloudflare)。

究竟根本原因是配置错误、注册商层面的权限沦陷，还是DNS提供商的问题，公众始终没有得到确切的答案——CoinDesk 指出，[网站被劫持的根本原因仍未证实，尽管有人怀疑这是一次DNS劫持](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=root%20cause%20of%20the%20website%20hijack%20remains%20unconfirmed)。但事件的*形态*是确凿无疑的。应用程序没问题，代码没问题，密钥也没问题。被劫持的是**域名**，而在Web世界里，控制了域名就赢得了大半场战役。

## 响应与余波

值得注意的是，修复工作同样是在域名层展开的。

这个网站无法单纯通过“打补丁”来解决问题，因为当时处于活跃状态的恶意版 Bitcoin.org 根本不是由其真实的基础设施提供的。止血的最快方法就是让域名本身暂停服务。注册商 **Namecheap** 正是这么做的——据 BleepingComputer 称，[我们已经暂时禁用了该域名](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=We%20have%20temporarily%20disabled%20the%20domain)。在一段时间内，访客既看不到骗局，也看不到原本的首页；CoinDesk 报道称，他们被[提示“无法访问此网站”。](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=This%20site%20can%27t%20be%20reached) 比特币最受信任的参考页面陷入了黑暗。

经过几个小时的调查，域名的指向被纠正，网站恢复到了被黑前的状态。受影响的窗口期很短——一天或更少——而且以加密犯罪的标准来看，单纯的金钱损失算是比较小的。但这次事件的影响依然深远，正是因为遇袭网站的*特殊地位*。一个以“不信任，去验证”为豪的运动，刚刚眼睁睁地看着自己最具权威性的“信任我们”页面被彻底武器化，反过来对付自己的用户。

## 这一事件给高度依赖DNS的加密原生网站敲响了怎样的警钟

![Vivid colorful concept art of a glowing gold coin scam funnel, bright coins pouring into a wide trustworthy-looking mouth at the top and vanishing into darkness at the narrow bottom, set against an energetic abstract background](../../assets/the-bitcoin-org-dns-hijack-03-namefi-angle.jpg)

Bitcoin.org 劫持事件中最令人不适的教训是，**哪怕你是“加密原生”的，也几乎无法让你免受此类攻击的威胁。**

比特币是去中心化的。它的账本出了名地难以篡改。只要妥善保管，你的密钥就只属于你一个人。但这些在此次事件中毫无用处——因为所有这一切的*大门*，是一个再普通不过的域名，它运行在与任何电商店铺或街角面包店相同的 DNS、注册商和域名服务器管道上。区块链本身毫发无损。在关键的意义上，网站后端也是不可侵犯的，但是**指向该网站的名称却不堪一击。**

我们可以从中总结出几个持久的教训：

1. **你的域名是你攻击面的一部分——而且往往是*最大*的部分。** 你可以编写出完美无缺的代码，将密钥保存在冷钱包中，并加固每一台服务器，但如果攻击者控制了你的域名服务器或注册商账户，他们依然能完美地冒充你。域名就是门面，而一个被劫持的域名，就等于让陌生人代替你去开门迎客。

2. **DNS/注册商的篡改是无声且具高杠杆效应的。** 当[域名服务器和DNS发生改变](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=nameservers%20%2B%20DNS%20changed)时，并没有出现常规监控能立即捕捉到的“崩溃”——网站依然能加载，只是加载地点变了。注册商锁定（Registrar lock）、注册局锁定（Registry lock）、DNSSEC，以及对注册商/DNS提供商账户进行严格的访问控制，这些绝不是可有可无的网络卫生措施；它们是经常被人遗忘的门锁。

3. **真正被盗走的是声誉。** 攻击者并不是真的在乎 Bitcoin.org 本身的服务器或是那 17,000 美元；他们想要的是它的*信誉*，借用这几个小时来让一个老掉牙的骗局变得令人信服。你的域名越受信任，被劫持的价值就越高——你也就越需要谨慎防范谁有权更改它的指向。

4. **“去信任”的基础设施依然建立在受信任的名称之上。** 即便是比特币这个消除中介的典型代表，也要通过 DNS 这个层级化、由中介主导且可篡改的系统来触达用户。货币的去中心化并没有带来入口的去中心化。

5. **检测速度胜过防御的优雅。** Bitcoin.org 能够以较小的损失度过这次危机，很大程度上是因为社区迅速发现了骗局，且注册商能在几小时内紧急停用域名。被劫持的域名向攻击者解析的时间越长，损失就越大——声誉的损害也会随之成倍增加。掌握域名控制权或路由变化发生的*那一瞬间*，比任何单一的静态锁都更有价值。

## Namefi 的视角

归根结底，Bitcoin.org 的劫持事件是一个*控制权与可验证性*的问题。应用程序是可靠的，区块链也是可靠的。出故障的是负责回答一个看似简单问题的网络层：**谁拥有这个域名的合法控制权，它被允许指向哪里？** 当这个问题的答案可以被悄无声息地重写——域名服务器被替换，[WHOIS信息在黑客攻击时被更新](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack)——那么无论技术栈的其他部分有多么强大，信任都会荡然无存。

[Namefi](https://namefi.io) 的理念是：域名的所有权和控制权应当作为一种一等的、可验证的互联网原生资产，而不是数据库中一条可以被攻击者悄悄修改的记录。代币化、可审计的所有权让“谁控制这个域名，这种控制刚刚改变了吗？”这个问题可以在链上得到解答——从而将悄无声息的域名服务器互换，转变为可见的、有记录可查的事件，同时保持与整个Web网络所依赖的DNS系统的兼容。它并不会让 DNS 消失，但它能让*对域名的控制*更难被无形劫持，同时也更容易受到持续的验证。

Bitcoin.org 花了十三年的时间向世界传达：最危险的时刻，就是当你停止验证并开始盲目信任的时刻。而在2021年9月的几个小时里，它自己的域名以惨痛的代价证明了这堂课的价值。对于其他所有人来说，得出的结论远比听起来要简单得多：你的域名就是你在互联网上的身份——请像守护背后的私钥一样，小心翼翼地守护好这个名字。

## 参考资料与延伸阅读

- BleepingComputer — [Bitcoin.org hackers steal $17,000 in 'double your cash' scam](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/)
- CoinDesk — [Bitcoin.org Website Inaccessible After Being Hacked by Apparent Giveaway Scam](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/)
- Bitcoin.com News — [Hackers Compromise Web Portal Bitcoin.org — DNS Hijack Replaces Site With BTC Doubler Scam](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/)
- Decrypt — [Bitcoin.org Compromised, Fraudulent Crypto Giveaway Advertised](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/)
- Cointelegraph — [Bitcoin.org goes offline after suffering scam attack](https://cointelegraph.com/news/bitcoin-org-goes-offline-after-suffering-scam-attack)
- CryptoPotato — [BitcoinOrg Hacked: Giveaway Scam Promising Users to Double Their BTC](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/)
- NewsBTC — [Bitcoin.org Hacked By Scammers For A Few Minutes. Someone Sent Them 0.4 BTC](https://www.newsbtc.com/news/bitcoin-org-hacked-by-scammers/)
- CoinDesk — [UK Court Orders Bitcoin.org to Remove White Paper Following Craig Wright Lawsuit](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit)
- Wikipedia — [Bitcoin (history of the bitcoin.org domain)](https://en.wikipedia.org/wiki/Bitcoin)