---
title: "详解过期域名与掉落周期"
date: '2026-06-21'
language: zh-CN
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 3
format: explainer
description: "域名是如何过期并掉落的：宽限期、30 天的赎回窗口、5 天的待删除、最终释放——以及掉落的域名会在哪些地方浮现，供翻转者捕获。"
ogImage: ../../assets/expired-domains-and-the-drop-cycle-og.jpg
keywords: ['过期域名', '域名掉落周期', '域名生命周期', '赎回宽限期', '待删除', '域名抢注', '过期域名', '域名如何过期', '掉落域名', '域名狙击', '购买过期域名', '域名赎回期', '域名何时掉落', '域名预订单', '寻找可翻转的域名']
relatedArticles:
  - /zh-CN/blog/domain-backorders-and-drop-catching/
  - /zh-CN/blog/domain-flipping/
  - /zh-CN/blog/how-to-win-domain-auctions/
  - /zh-CN/blog/hand-registering-domains-to-flip/
  - /zh-CN/blog/when-to-drop-a-domain/
relatedTopics:
  - /zh-CN/topics/domain-investing/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-flipping-skills/
  - /zh-CN/series/name-change-game-change/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registry/
---

大多数人以为，一个失效的域名会在过期次日就凭空消失，第二天一早便重新回到公开市场。事实并非如此。无人续费的域名会经历一段固定的、长达数周的持有状态序列——每个阶段都有自己的规则，规定谁能找回它、以何种代价找回——之后[注册局](/zh-CN/glossary/registry/)才会最终把它释放回可注册的池子。这最后的释放就是"[掉落](/zh-CN/glossary/pending-delete/)"，而在域名落地那一刻立即抢注它是一种公认的做法：正如维基百科所说，[域名抢注（domain drop catching），也称域名狙击（domain sniping），是指在注册失效后、过期之后立即抢注该域名的做法](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)。

翻转者之所以关注市场的这个角落，是因为掉落的域名并非一张白纸。一个域名能走到掉落这一步，是因为曾有人注册它、使用它、然后弃之而去，所以它可能携带着年龄、外部链接、残留流量，或是一个本来你只能眼睁睁看着别人手注的字符串。这个周期是一条回收流，专门处理那些已经证明有人想要过的域名——它的风险特征与全新字符串不同，也是我们在[如何寻找可翻转的域名](/zh-CN/blog/how-to-find-domains-to-flip/)一文中梳理的供应渠道之一。本篇解读将逐个阶段走完整个生命周期，然后讲清楚掉落的域名会在哪里浮现，以及翻转者如何布局去捕获它们。

## 第一阶段：有效注册与续费窗口

域名从来不是被彻底拥有的。它只是被注册了一个期限，必须续费才能保有——按维基百科的说法，[gTLD](/zh-CN/glossary/gtld/) 注册的期限存在上限：[一个 gTLD 域名的最长注册期限为 10 年](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)。当期限到期而持有者未续费时，掉落周期的计时便开始了。

首先要理解的是，"过期"并不等于"可注册"。在过期当天，[注册人](/zh-CN/glossary/registrant/)依然拥有所有人中最强的主张权。注册局甚至不会立即删除该域名：它会自动续费这个注册，并给注册商留出一个窗口去收取费用或取消。在 [`.com`](/zh-CN/tld/com/) 命名空间里，这就是 **自动续费宽限期（Auto-Renew Grace Period）**，而 Verisign 具有约束力的注册局合同固定了它的长度——[自动续费宽限期当前的取值为 45 个日历日](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20value%20of%20the%20Auto%2DRenew%20Grace%20Period%20is%2045%20calendar%20days)。其他 gTLD 也遵循同样的形态，不过具体的注册局可以设定不同的数值，所以应把 `.com` 当作参照案例，而非放之四海皆准的法则。

大多数注册商会在这个窗口期间让网站停止解析并挂出一个占位页，但域名仍为原所有者保留，他通常可以按正常价格或接近正常价格续费（越往后拖，滞纳金往往爬得越高）。原则不变：过期之后立刻，失效的所有者享有优先续费权，而在工具里显示为"过期"的域名通常还没到可以抢的地步。这也是为什么保有一个域名最便宜的方式就是按时续费——一个普通 `.com` 的标准续费费用并不高，维基百科指出[（一次简单注册的）零售价格一般从每年约 9.70 美元的低位到每年约 35 美元不等](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=the%20retail%20cost%20generally%20ranges%20from%20a%20low%20of%20about%20%249.70%20per%20year)。接下来发生的一切，都是没人付这笔账时的情形。

## 第二阶段：赎回宽限期

![编辑插画：一个域名牌悬浮在倒计时表盘内的沙漏中，一只手递上一枚硬币，要在时间耗尽前支付找回费用](../../assets/expired-domains-and-the-drop-cycle-01-redemption.jpg)

如果宽限窗口期满仍无续费，注册商会把域名删除进一个名为 **[赎回宽限期](/zh-CN/glossary/grace-period/)** 的找回窗口（你在 [WHOIS](/zh-CN/glossary/whois/) 和 EPP 状态里也会看到"[赎回期](/zh-CN/glossary/redemption-period/)"或 `redemptionPeriod`）。这是最常让人意外的阶段，因为原所有者仍然能把域名要回来，只不过现在要花真金白银，并且会触发一次正式的状态变更。[ICANN](/zh-CN/glossary/icann/) 自己就提到了[为期 30 天的赎回宽限期（RGP）](https://www.icann.org/resources/pages/grace-2013-05-03-en#:~:text=30%2Dday%20Redemption%20Grace%20Period%20%28RGP%29)，其面向注册人的常见问题解答也确认，如果一个域名被删除，[该域名将进入为期 30 天的赎回期](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20enter%20into%20a%20redemption%20period%20for%2030%20days)。具有约束力的 `.com` 合同钉死了同一个数字——[该赎回期当前的长度为 30 个日历日](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20length%20of%20this%20Redemption%20Period%20is%2030%20calendar%20days)。

这里有两个实务细节对翻转者很重要。第一，30 天这个数字是常见 gTLD 的基准，而非通用常数。按维基百科的说法，[这段时长因 TLD 而异，通常在 30 到 90 天左右](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=usually%20around%2030%20to%2090%20days)。第二，赎回期内的找回是被刻意设计得很贵的。它不是点一下就续费这么简单；ICANN 的规则要求，[处于 30 天赎回宽限期内的域名可以被赎回（或续费）](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=Domain%20names%20that%20are%20in%20the%2030%2Dday%20Redemption%20Grace%20Period%20can%20be%20redeemed)，前提是赶在窗口关闭之前，但注册商通常会在续费费用之上再收取一笔高昂的赎回费——维基百科给出的价位是所有者[可能需要支付一笔费用（通常在 100 美元左右）才能重新激活并重新注册该域名](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=may%20be%20required%20to%20pay%20a%20fee%20%28typically%20around%20US%24100%29)。这笔费用的存在是有意为之：它给真正健忘的所有者留了最后一次机会，同时让人很难在这个周期上耍花样。

对于盯着某个域名走过赎回期的买家来说，要点就是耐心。处于赎回期的域名既不可抢，也不会在公开市场上出售——它在法律上仍属于失效所有者，可被其找回。许多看起来"几乎免费"的域名就卡在这个窗口里，而注册人会在它们掉落之前要回其中相当一部分好域名。在赎回期就提前数鸡，是被掉落辜负的最常见方式。

## 第三阶段：待删除

当赎回期结束仍无人找回时，域名会进入释放前的最后一个持有状态：待删除。这是一段短暂而刚性的锁定期，期间没有任何人能注册或找回该域名——原所有者不行，你也不行。`.com` 合同明确写出了触发条件与锁定：[如果一个域名在赎回宽限期内未被恢复，它就会被置于"待删除"（PENDING DELETE）状态](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=A%20domain%20name%20is%20placed%20in%20PENDING%20DELETE%20status%20if%20it%20has%20not%20been%20restored%20during%20the%20Redemption%20Grace%20Period)，处于该状态的域名，注册商提出的所有修改请求都会被拒绝。它存在的唯一目的，就是给注册局一个干净的删除倒计时。

这里的时长是整个周期中最确定的数字。ICANN 面向注册人的常见问题解答说，一个未被恢复的域名[将进入"待删除"（PendingDelete）状态，为期 5 天](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=will%20enter%20into%20PendingDelete%20status%20for%205%20days)，而 `.com` 注册局合同确认[该待删除期当前的长度为 5 个日历日](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20length%20of%20this%20Pending%20Delete%20Period%20is%20five%20calendar%20days)；维基百科也提到了同样的窗口，此后[该域名将从 ICANN 数据库中掉落](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=phase%20of%205%20days%2C%20the%20domain%20will%20be%20dropped%20from%20the%20ICANN%20database)。这 5 天是翻转者最有用的信号，因为待删除是唯一一个终点可知的阶段。一旦你想要的域名进入这个状态，你就能精确到接近小时地算出它何时释放。这种可预测性把掉落从一场抽奖变成了你可以提前规划的事：值得追逐的域名会提前 5 天宣告自己的释放日期。

## 第四阶段：释放，以及抢夺它的混战

![编辑插画：几台自动化机器人服务器冲过一道敞开的闸门，要在一个域名牌释放的瞬间抢下这枚正在坠落的牌子](../../assets/expired-domains-and-the-drop-cycle-02-release-scramble.jpg)

在待删除期结束时，域名会从注册局中清除，重新回到可注册的池子。ICANN 的指引说得很直白：在赎回期与待删除期之后，[该域名将被释放，并以先到先得的方式开放注册](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20be%20released%20and%20made%20available%20for%20registration%20on%20a%20first%2Dcome%2Dfirst%2Dserved%20basis)。理论上，这就是任何人都能以标准费用注册它的时刻。但在实践中，最抢手的域名几乎永远轮不到一个人坐在注册商搜索框前敲键盘，因为这场释放正是由专为这一瞬间打造的自动化系统在争夺。

这就是[抢注](/zh-CN/glossary/backorder/)服务登场的地方。这些运营方不是靠刷新搜索页碰运气，而是把基础设施对准注册局，在域名释放的那一微秒发出注册请求。正如维基百科所述，[这些服务承诺把它们的服务器专门用于在域名变为可用时拿下它，通常以拍卖价成交](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=These%20services%20offer%20to%20dedicate%20their%20servers%20to%20securing%20a%20domain%20name%20upon%20its%20availability)——而且在与任何手动操作者的较量中，它们都能稳定取胜。维基百科对这种不对称毫不掩饰：在抢夺那些抢手的域名时，[资源有限的个人很难与这些抢注公司竞争](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=Individuals%20with%20their%20limited%20resources%20find%20it%20difficult%20to%20compete%20with%20these%20drop%20catching%20firms)。当不止一家服务为各自的客户抢到同一个域名时，它会进入这几家之间的私下[拍卖](/zh-CN/glossary/auction/)，所以"抢"到一个有争夺的域名通常意味着竞标获胜，而不是支付一笔注册费。

对翻转者诚实的说法是：对于真正的好域名，你其实并不亲自去抢掉落——你是雇人去抢。理解这个周期能告诉你一个域名*何时*可争、*值多少钱*；而真正的捕获要通过预订单或抢注服务来完成，这一点我们会在[域名预订单与抢注](/zh-CN/blog/domain-backorders-and-drop-catching/)一文中讲到。

## 掉落的域名会在哪里浮现

![编辑插画：一个以放大镜为中心的寻源枢纽分出四条渠道——一张掉落清单、一张预订单凭据、一柄拍卖槌、一家二级市场店面——每条渠道都挂着一个域名牌](../../assets/expired-domains-and-the-drop-cycle-03-where-surface.jpg)

懂得这个周期，只有在你知道该去哪里盯着它时才有用。掉落的和将要掉落的域名会在几个可预测的地方浮现，而一套行之有效的寻源流程通常会同时从其中好几个地方抓取：

- **掉落清单与过期域名数据库。** 免费和付费的清单每天发布进入待删除的域名，往往可以按长度、[TLD](/zh-CN/glossary/tld/)、关键词、年龄和链接指标筛选——这是用来构建"即将释放域名"观察列表的原始数据源。
- **预订单与抢注平台。** 与其自己盯着日历，不如下一张预订单，由服务在释放时代你去争夺这个域名。这是争取任何热门域名的实务路径——参见[域名预订单与抢注](/zh-CN/blog/domain-backorders-and-drop-catching/)。
- **过期域名拍卖。** 许多注册商根本不会让有价值的过期库存进入公开掉落；它们会在宽限窗口期间或之后，把这些域名引入自己的过期拍卖，于是域名是被卖掉而非被释放。这与[如何赢得域名拍卖](/zh-CN/blog/how-to-win-domain-auctions/)中讲到的更广义渠道有所重叠。
- **二级市场平台。** 被别人抢到的、或被找回后重新挂牌的域名，会在[二级市场](/zh-CN/glossary/aftermarket/)上重新出现以供转售。这本身不是掉落，但大量掉落后的库存最终都汇集到这里。

翻转者的优势在于把渠道与域名匹配起来——一个竞争不激烈、出现在公开掉落清单上的字符串，是一手适合"接近手注"的牌，而一个高端的单词域名则需要预订单，并且很可能还要一笔拍卖预算。如果你的本能是去注册全新的字符串，那是一条正当而不同的路径，我们在[手注可翻转的域名](/zh-CN/blog/hand-registering-domains-to-flip/)中走过这条路。

## 以翻转者的视角读懂这个周期

把各个阶段拼到一起，掉落周期就不再是个谜，而成了一张你可以据以行动的时间表。两条规则直接从这套机制里推导而出。

**盯住待删除，而不是过期日期。** "过期"不等于"可注册"：失效的所有者在[自动续期](/zh-CN/glossary/domain-renewal/)窗口内享有优先主张权，并且在整个赎回期里仍能（以高昂代价）找回该域名。大多数有价值的域名在所有者注意到失效后就会在那里被赎回，所以能撑到待删除的域名，更偏向于那些被所有者真心抛弃的。正因为这 5 天的窗口是固定的，它才是你唯一能精确计时的阶段——这也是为什么预订单服务把它们的整套运作都围绕着它来设计。

**尽职调查随域名一同到来。** 一个掉落的域名会继承它的历史，而并非所有历史都是好的。在你为一个有年头的域名出价之前，先查它过去的用途、它的 [WHOIS](/zh-CN/glossary/whois/) 与所有权轨迹、是否有任何[注册商](/zh-CN/glossary/registrar/)锁，以及它是否曾托管过会玷污它的东西。一个过去侵犯过品牌的域名，到了你手里仍可能招来一桩 [UDRP](/zh-CN/glossary/udrp/) 投诉；既有的反向链接，可能是垃圾，也可能是金矿。掉落把资产*连同*它的包袱一起交到你手上。

这个周期会犒赏那些把它当作管道工程、而非当作运气来对待的人。时间是公布的，阶段是固定的，域名按时落下。把寻源优势与续费坟场区分开来的，是知道哪些将要掉落的域名值得去抢——这是一项估值技能，而非计时技能。它是更大手艺中的上游供应环节，我们在[域名翻转](/zh-CN/blog/domain-flipping/)系列里对此进行了梳理。

## Namefi 的视角

抢到一个好的掉落域名只完成了一半的工作；当它下一次易手时，你会撞上每一笔高价值[域名交易](/zh-CN/glossary/domain-trading/)都会撞上的同一道摩擦。买家不会在域名转移之前付款，卖家不会在收到款之前转移它，而注册商之间的[授权码](/zh-CN/glossary/auth-code/)交接，在中间留下一段令人忐忑的空档。这种僵局正是[托管](/zh-CN/glossary/escrow/)存在的理由，而当一个有年头、富含链接的域名越值钱时，这道难题就越发尖锐。

这正是 [Namefi](https://namefi.io) 着力收窄的鸿沟。代币化的所有权让一个真实 ICANN 域名的控制权更易于验证和转移，并配以 [DNS](/zh-CN/glossary/dns/) 连续性，使得在掉落时抢到的域名在你把它翻转出手时仍能干净地保持解析。对于一个从掉落周期寻源的翻转者来说，出场环节更少的结算摩擦，意味着那些来之不易的捕获中有更多真正变成已成交的销售。

## 友情免责声明（请务必阅读！）

> 我们不是律师、会计师、理财顾问，也不是医生，并且**本文中的任何内容都不构成法律、财务、税务、会计、医疗或任何其他类型的专业建议。**我们撰写这些文章是为了自我学习，也是为方便我们的客户。这里的信息可能已经过时、仅适用于特定地区，或者干脆就是错的。我们也会犯错。

> 对于任何重要决定，**请务必咨询真正的专业人士（说真的！）**。或者，如果那不合你的风格，那就问问朋友、问问 Twitter、问问 Reddit、问问 AI，或者问问算命先生。一句话：**DOYR——做你自己的研究（Do Your Own Research）**。让我们一起学习，一起开心。

## 来源与延伸阅读

- ICANN——[《.com 注册局协议》附录 7（自动续费宽限期 45 天；赎回期 30 天；待删除 5 天）](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20value%20of%20the%20Auto%2DRenew%20Grace%20Period%20is%2045%20calendar%20days)
- ICANN——[《注册人常见问题：域名续费与过期》（30 天赎回期、5 天待删除、先到先得释放）](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20enter%20into%20a%20redemption%20period%20for%2030%20days)
- ICANN——[《关于在赎回宽限期内赎回域名》（30 天 RGP）](https://www.icann.org/resources/pages/grace-2013-05-03-en#:~:text=30%2Dday%20Redemption%20Grace%20Period%20%28RGP%29)
- 维基百科——[Domain drop catching（掉落/狙击定义；赎回期通常 30–90 天且约 100 美元费用；5 天待删除；抢注服务）](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)
- 维基百科——[Domain name registrar（gTLD 期限上限 10 年；`.com` 零售价）](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)
- 维基百科——[Domain name speculation（域名投资与域名翻转）](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=is%20the%20practice%20of%20identifying%20and%20registering%20or%20acquiring%20generic%20Internet%20domain%20names%20as%20an%20investment)
