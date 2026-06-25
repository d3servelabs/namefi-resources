---
title: "域名抢注（Backorder）与域名捕获（Drop-Catching）解析"
date: '2026-06-21'
language: zh
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 4
format: explainer
description: "什么是域名抢注和域名捕获，服务商如何争分夺秒地抢夺刚被释放的域名，以及何时值得为域名抢注付费。"
ogImage: ../../assets/domain-backorders-and-drop-catching-og.jpg
keywords: ['域名抢注', '域名捕获', '如何抢注域名', '捕获过期域名', 'DropCatch', 'SnapNames', 'NameJet', 'Park.io', 'Dynadot 域名抢注', '域名捕获服务', '赎回宽限期', '待删除域名', '域名何时删除', '过期域名拍卖', '如何获取已注册域名']
---

你想注册的域名已经被占用了。当前所有者既不卖，也不回复，而且据你所知，他们甚至都没在使用这个域名。所以你只剩下最后一招：等他们忘记续费。一旦注册到期，域名回到公开市场，你就要成为第一个抢到它的人。

这就是域名[抢注](/zh/glossary/backorder/)（backorders）和域名捕获（drop-catching）的全部奥秘。两者都是在你今天无法购买某个域名时，押注于它成为自由可注册状态的瞬间去抢注它的方式。它们不完全相同，其间的差异很重要，而且大多数时候，对于“我该为此付费吗？”这个问题的诚实回答是否定的。本篇解析将涵盖它们各自的定义，[域名释放](/zh/glossary/pending-delete/)瞬间的争夺战如何运作，参与其中的主要服务商，以及在哪些少数情况下，付费抢注是值得的。本文是[域名倒卖技巧系列](/zh/blog/domain-flipping/)的一部分，与我们的核心文章[如何寻找可供倒卖的域名](/zh/blog/how-to-find-domains-to-flip/)相辅相成。

## 首先，为什么域名会“掉落”

![域名在进入公开池之前经历宽限期各个阶段的时间线示意图](../../assets/domain-backorders-and-drop-catching-01-drop-cycle.jpg)

域名并非一次性售出、永久持有。它需要按期[注册](/zh/glossary/registrar/)并续费，当所有者停止支付费用时，域名不会立即消失。它会经历一个固定的生命周期，经过几个宽限期后才返回公开市场，而这个时间线正是捕获域名的全部基础。我们在[过期域名和删除周期](/zh/blog/expired-domains-and-the-drop-cycle/)一文中详细介绍了整个周期；这里只说明与域名捕获相关的部分。

[域名到期](/zh/glossary/domain-expiration/)后，注册局会将其置于一个恢复窗口期。正如维基百科所描述，赎回宽限期是 [ICANN 的《注册商认证协议》（RAA）的一项补充，允许注册人在其域名过期后的若干天内将其收回](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=an%20addition%20to%20ICANN%27s%20Registrar%20Accreditation%20Agreement%20%28RAA%29%20which%20allows%20a%20registrant%20to%20reclaim%20their%20domain%20name%20for%20a%20number%20of%20days%20after%20it%20has%20expired)。在赎回期内，所有者仍然可以取回域名，但代价不菲——维基百科指出，所有者[可能需要支付一笔费用（通常约为 100 美元）](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=may%20be%20required%20to%20pay%20a%20fee%20%28typically%20around%20US%24100%29)来重新激活它。这个期限的长短取决于后缀；根据维基百科，[这个时间长度因顶级域名而异，通常在 30 到 90 天之间](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=This%20length%20of%20time%20varies%20by%20TLD%2C%20and%20is%20usually%20around%2030%20to%2090%20days)。

只有在此之后，域名才会进入最后的倒计时。正如维基百科所说，[在为期 5 天的“待删除”阶段结束时，该域名将从 ICANN 数据库中被删除](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=At%20the%20end%20of%20the%20%22pending%20delete%22%20phase%20of%205%20days%2C%20the%20domain%20will%20be%20dropped)。那个“删除”的瞬间，是所有人翘首以盼的时刻。域名一旦离开数据库，它就再次变回一个普通的未注册字符串，谁先注册，谁就拥有它。关键在于，“第一个”的竞争可能在毫秒之间决出胜负。

## 域名捕获：赢得毫秒之争

![多个服务器手臂在域名释放的瞬间竞相抢夺同一个域名标签的示意图，秒表正在计算着毫秒级的时间](../../assets/domain-backorders-and-drop-catching-02-millisecond-race.jpg)

域名捕获是一种硬碰硬的方法：你（或者更现实地说，一个为你服务的平台）在域名被删除的字面瞬间尝试注册它。维基百科的定义很直白——域名捕获，也称为域名狙击，是[在域名注册失效后，即过期后立即注册该域名的行为](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)。

你不可能靠手动操作赢得这场比赛。好的域名会按可预测的时间表被删除，在你点击鼠标的同一秒，一群专业的服务商正在向注册局发起猛烈请求。正如域名投机文献所描述，[在域名被注册局删除时立即注册它们的业务被称为域名捕获。这是一个竞争异常激烈的行业](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=The%20business%20of%20registering%20the%20domain%20names%20as%20they%20are%20deleted%20by%20the%20registries%20is%20known%20as%20drop%20catching.%20It%20is%20a%20highly%20competitive%20business)，而且竞争速度快得惊人：[从域名掉落到被捕获之间的时间通常以秒或其零头来衡量](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=The%20time%20between%20a%20drop%20and%20a%20capture%20is%20often%20measured%20in%20seconds%20or%20fractions%20thereof)。

这就是为什么域名捕获服务存在并且能抢到你永远无法从普通注册商结账页面获得的域名的原因。顶尖的捕获服务商拥有多个注册商资质，并运营着针对注册局删除队列的服务器集群。维基百科对这种模式的描述很简单：这些服务[提供专门的服务器，在域名可用时立即确保获得该域名，通常以拍卖价格成交](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=offer%20to%20dedicate%20their%20servers%20to%20securing%20a%20domain%20name%20upon%20its%20availability%2C%20usually%20at%20an%20auction%20price)。最后那句话是新手容易忽略的部分。如果一个服务商捕获了一个有多位客户想要的域名，你并不能以注册费得到它——它会进入感兴趣的抢注者之间的[拍卖](/zh/glossary/auction/)，一个有争议的热门域名捕获最终可能以数百或数千美元成交。这些竞价战的机制本身就是一门学问，我们在[如何赢得域名拍卖](/zh/blog/how-to-win-domain-auctions/)中有详细介绍。

## 域名抢注：在域名掉落前预留你的位置

![一个人手持预订票站在隔离线最前端，在等待的人群中抢占了优先位置的示意图](../../assets/domain-backorders-and-drop-catching-03-reserve-spot.jpg)

域名抢注是你提前下达的预订。你不是在域名掉落时疯狂地尝试注册，而是告诉一个服务商“如果这个域名变得可用，请帮我捕获它”，通常需要预付一笔固定费用。维基百科清晰地界定了两者的区别：域名抢注赋予了优先权，因为[抢注订单的所有者将有第一个机会获得该域名，然后该域名才会被删除并向所有人开放。通过这种方式，域名抢注通常优先于域名捕获](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=the%20owner%20of%20the%20back%2Dorder%20will%20be%20given%20the%20first%20opportunity%20to%20acquire%20the%20domain%20name)。

在底层，一个域名抢注订单通常由相同的域名捕获机制来执行，只是将目标指向了你的请求。域名投机文献描述了一个注册商网络如何集中火力：[如果域名被一个试图完成域名抢注订单的注册商联盟捕获，那么捕获该域名的注册商会将其注册给预订该域名的实体](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=If%20the%20domain%20is%20caught%20by%20a%20confederation%20of%20registrars%20attempting%20to%20fulfill%20a%20domain%20backorder)。换句话说，你买的不是一个保证。你买的是获得最强捕获尝试的机会，以及在公开争抢之前排队的位置。

还有第二种模式值得了解，因为它改变了你的竞争对手。一些注册商从不让域名掉落到公共池中。正如文献所指出的，某些注册商[不允许域名以正常方式掉落，而是引入一个中介（例如 Snapnames 和 Namejet），在域名被删除前进行拍卖](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=do%20not%20allow%20domains%20to%20drop%20in%20the%20normal%20fashion%2C%20instead%20introducing%20an%20intermediary)。当这种情况发生时，域名根本不会进入你所竞争的注册局删除队列，获得它的唯一途径就是通过该注册商的合作拍卖平台。了解一个域名是会公开掉落还是会被转到私人过期拍卖，能告诉你应该在哪家服务商下达抢注订单——有时甚至意味着你根本无法捕获它，只能出高价竞拍。

## 为你争分夺秒的服务商

大多数域名倒卖者通过少数几个平台接触域名捕获。这些平台各有重叠，也各有专长，选择哪个平台取决于域名在哪里注册以及它属于哪个[顶级域名](/zh/glossary/tld/)。

- **DropCatch** 是最知名的纯域名捕获平台，专注于[`.com`](/zh/tld/com/) 和其他传统通用顶级域名（[gTLD](/zh/glossary/gtld/)）。你抢注一个待删除的域名，该服务会动用其注册商集群在删除瞬间进行抢注，如果有多于一个用户抢注了同一个域名，就会通过拍卖来决定归属。这是大规模捕获公开删除域名的默认选择。
- **SnapNames** 和 **NameJet** 是经典的过期域名拍卖中介——即上文提到的 [Snapnames 和 Namejet](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=instead%20introducing%20an%20intermediary%20%28e.g.%2C%20Snapnames%20and%20Namejet%29)。它们的优势在于处理那些从不公开掉落的域名，因为合作注册商会将其过期的域名库存优先转给它们。如果你想要的域名在它们的合作注册商那里，那么它就会在这里出现。
- **Dynadot** 是一家提供全面服务的注册商，同时也运营域名抢注和过期域名拍卖服务，因此你可以在你通常注册域名的地方预订捕获。维基百科将其认定为[一家由软件工程师 Todd Han 于 2002 年创立的 ICANN 认证域名注册商和网络托管公司](https://en.wikipedia.org/wiki/Dynadot#:~:text=is%20an%20ICANN%2Daccredited%20domain%20registrar%20and%20web%20host%20company%20founded%20by%20software%20engineer%20Todd%20Han%20in%202002)。
- **Park.io** 以捕获较新的和国家代码后缀的域名而闻名——这些域名在通用捕获服务商那里的覆盖范围较小。如果你在追逐一个不太主流的顶级域名，专业的服务商通常是你唯一现实的选择。

实际操作中，明智的做法是在付钱给任何人之前，先弄清楚一个特定的域名将*如何*变得可用。它是将进入公共注册局删除流程（应使用域名捕获服务），还是其注册商会将其转到私人过期拍卖（你需要那个平台的账户）？在两个都针对同一个公开删除域名的服务商下达同一个抢注订单，大多是浪费钱；而在那个控制你心仪域名释放路径的服务商那里下单，才是关键所在。

## 何时域名抢注才真正值得付费

域名抢注的下单成本低，很容易下得过多，而这正是陷阱所在。这里是一个诚实的筛选标准。

**当域名真正稀缺且你有特定用途时，才为抢注付费。** 一个简洁的单单词 `.com` 域名、一个简短的品牌域名，或者一个与你正在构建的项目完全匹配的域名，都值得支付抢注费，甚至值得投入一笔适度的拍卖预算。因为如果它公开掉落，必然会引起争抢，没有捕获服务你就会失去它。这对于拥有真实、可验证历史的旧域名也同样适用——例如，那些在易手后仍然存在的[反向链接](/zh/glossary/backlink/)或流量。这是一种与[手动注册全新域名进行倒卖](/zh/blog/hand-registering-domains-to-flip/)不同的采购渠道。

**当域名并非真正稀缺时，就跳过它。** 如果一个几乎相同的字符串现在就可以以正常注册价格手动注册，那么为一个即将过期的版本支付抢注费并冒险参与拍卖，通常是一笔不划算的交易。只有当那个*特定的*域名本身就是资产且无可替代时，掉落才显得重要。

**假设你可能会输，并据此定价。** 域名抢注是一次尝试，而不是一次购买。对于一个热门域名，你可能会在捕获后的拍卖中被别人出价超过，或者被一个火力更强的服务商抢先捕获。把抢注费预算看作是一张中奖率不错的彩票成本，而不是你已拥有域名的首付款。

**注意商标红线。** 捕获一个过期域名并不能洗白它的历史。如果该字符串是某人的品牌，它过期了并不意味着你可以安全地抢注并转售。 [UDRP](/zh/glossary/udrp/) 框架仍然适用，而一个过期的商标域名正是那种容易引发争议的情况，正如我们在[什么是 UDRP](/zh/blog/what-is-udrp/) 中所讨论的。捕获通用和品牌化的域名，而不是过期的品牌。

还有一个专门针对捕获域名的尽职调查注意事项：一个过期域名可能带有全新注册域名永远不会有的包袱，比如垃圾邮件历史或谷歌惩罚。在你下重注之前，通过 [WHOIS](/zh/glossary/whois/) 和网站历史档案查询它的过去。一个域名的历史会随之转移。

## 捕获之后：真正拥有它

赢得捕获是开始，而不是结束。域名会进入捕获它的注册商账户中，要将其变成一个干净、可售的资产，意味着你需要获得对它的真正[控制权](/zh/glossary/domain-ownership/)——包括[授权码](/zh/glossary/auth-code/)、将其[跨注册商转移](/zh/glossary/cross-registrar-transfer/)到你常用注册商的能力，以及确保 WHOIS 和 DNS 都属于你的信心。这个交接过程是高价值域名交易中最令人紧张的环节，因为僵局困扰着每一笔[域名交易](/zh/glossary/domain-trading/)：没人想先行动。

这正是 [Namefi](https://namefi.io) 旨在减少的摩擦。代币化的所有权使得对一个真实的 [ICANN](/zh/glossary/icann/) 域名的控制权更易于验证和转移，并且具有 DNS 连续性，确保捕获的域名在交接过程中能够持续正常解析。当你确实要转售它时，标准的流程——挂牌、定价和中立的[托管](/zh/glossary/escrow/)交接——在[如何出售你拥有的域名](/zh/blog/how-to-sell-a-domain-name-you-own/)和[域名托管服务解析](/zh/blog/domain-escrow-explained/)中有详细介绍。

## 简而言之

域名捕获是在域名被删除的瞬间注册它的竞赛；域名抢注是你在这场竞赛中预留的、具有优先权的尝试，通常由相同的机制执行。只有当*特定的*域名稀缺且你有实际用途时才为抢注付费，将订单下到控制该域名实际释放方式的服务商，并且在域名转移干净利落之前，永远不要把一次捕获当作一次购买。大多数时候，有纪律的答案是放手——而正是这种纪律，区分了投资组合和续费账单。

## 友情免责声明（请阅读！）

> 我们不是律师、会计师、财务顾问或医生，**本文中的任何内容均不构成法律、财务、税务、会计、医疗或任何其他形式的专业建议。** 我们撰写这些文章是为了自我教育，并为我们的客户提供便利。此处的信息可能已过时、具有地域特定性或完全错误。我们也会犯错。
>
> 对于任何重要决策，**请咨询真正的专业人士（认真的！）**。如果这不符合你的风格，可以问问朋友、Twitter、Reddit、人工智能或通灵师。简而言之：**DOYR - 请自己做好研究**。让我们一起学习，享受乐趣。

## 来源和进一步阅读

- 维基百科 — [域名捕获（定义、赎回宽限期、待删除、抢注优先权）](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)
- 维基百科 — [域名投机（域名捕获作为竞争性业务；抢注联盟；过期拍卖中介）](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=The%20business%20of%20registering%20the%20domain%20names%20as%20they%20are%20deleted%20by%20the%20registries%20is%20known%20as%20drop%20catching.%20It%20is%20a%20highly%20competitive%20business)
- 维基百科 — [Dynadot（ICANN 认证注册商，成立于 2002 年）](https://en.wikipedia.org/wiki/Dynadot#:~:text=is%20an%20ICANN%2Daccredited%20domain%20registrar%20and%20web%20host%20company%20founded%20by%20software%20engineer%20Todd%20Han%20in%202002)
