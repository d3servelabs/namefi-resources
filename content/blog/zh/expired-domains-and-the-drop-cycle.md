---
title: "过期域名与删除周期详解"
date: '2026-06-21'
language: zh
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 3
format: explainer
description: "域名如何过期和删除：宽限期、30天赎回期、5天待删除期、释放——以及被删除的域名会在哪里出现，供域名投资者抢注。"
ogImage: ../../assets/expired-domains-and-the-drop-cycle-og.jpg
keywords: ['过期域名', '域名删除周期', '域名生命周期', '赎回宽限期', '待删除期', '域名抢注', '过期域名', '域名如何过期', '已删除域名', '域名狙击', '购买过期域名', '域名赎回期', '域名何时删除', '域名预订', '寻找可交易的域名']
---

大多数人认为，一个域名到期后就会在第二天消失，隔天早上就重新回到公开市场。但事实并非如此。一个无人续费的域名会经历一个固定的、长达数周的持有状态序列——每个状态都有其关于谁可以恢复它以及需要付出何种代价的规则——然后[注册局](/zh/glossary/registry/)才会最终将其释放回可用域名池。这最后的释放就是“删除”（the drop），而在域名一落地就立即注册它的做法是一种公认的操作：正如维基百科所说，[域名抢注，也称为域名狙击，是指在域名注册过期后立即注册该域名的做法](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)。

域名投资者关心这个市场角落，因为被删除的域名并非一张白纸。一个域名之所以会走到被删除这一步，是因为有人注册过、使用过，然后放弃了它，所以它可能带有域名年龄、入站链接、残余流量，或者是一个在你本想手动注册时早已被占用的字符串。这个周期是一个回收流，回收那些已经证明有人想要的域名——与一个全新的字符串相比，其风险状况有所不同，也是我们在[如何寻找可供交易的域名](/zh/blog/how-to-find-domains-to-flip/)一文中所描绘的供应渠道之一。本篇详解将逐一介绍生命周期的各个阶段，然后探讨被删除的域名会在哪里出现，以及域名投资者如何部署以抢注它们。

## 阶段一：有效注册与续费窗口

域名从来不是被完全拥有的。它是按期限注册的，并且必须续费才能保留——根据维基百科，[gTLD](/zh/glossary/gtld/) 的注册期限有上限：[gTLD 域名的最长注册期为 10 年](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)。当期限结束而持有人没有续费时，删除周期的时钟便开始计时。

首先要理解的是，“已过期”不等于“可注册”。在到期日，原[注册人](/zh/glossary/registrant/)仍然拥有最强的权利。注册局甚至不会马上删除该域名：它会自动续费该注册，并给注册商一个窗口期来收取费用或取消。在 [`.com`](/zh/tld/com/) 命名空间中，这被称为**自动续费宽限期** (Auto-Renew Grace Period)，Verisign 具有约束力的注册局合同规定了其长度——[自动续费宽限期的当前值为 45 个日历日](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20value%20of%20the%20Auto%2DRenew%20Grace%20Period%20is%2045%20calendar%20days)。其他 gTLD 也遵循类似模式，尽管特定的注册局可以设置不同的值，所以应将 `.com` 视为参考案例，而非普遍法则。

大多数注册商在此窗口期内会停止网站解析并显示一个占位页面，但域名会为原所有者保留，他们通常能以正常价格或接近正常价格续费（滞纳金通常会随着时间的推移而增加）。原则是：过期后，失效的所有者有优先权，一个在工具中显示为“已过期”的域名通常还不能被抢注。这也是为什么保留一个域名的最便宜方式是按时续费——一个普通 `.com` 域名的标准续费费用是适中的，维基百科指出[零售成本通常在每年约 9.70 美元到约 35 美元之间](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=the%20retail%20cost%20generally%20ranges%20from%20a%20low%20of%20about%20%249.70%20per%20year)（对于一个简单的注册而言）。接下来要讲的，就是当无人支付这笔账单时会发生什么。

## 阶段二：赎回宽限期

![一个沙漏中的域名标签的编辑插图，沙漏位于一个倒计时表盘内，一只手在时间耗尽前伸出一枚硬币支付恢复费用](../../assets/expired-domains-and-the-drop-cycle-01-redemption.jpg)

如果[宽限期](/zh/glossary/grace-period/)结束而无人续费，注册商会将域名删除到一个称为**赎回宽限期** (Redemption Grace Period) 的恢复窗口中（你也会在 [WHOIS](/zh/glossary/whois/) 和 EPP 状态中看到 "redemption period" 或 `redemptionPeriod`）。这个阶段最常让人感到意外，因为原所有者仍然可以拿回域名，尽管现在需要花费真金白银并触发正式的状态变更。[ICANN](/zh/glossary/icann/) 自身提到了[30 天的赎回宽限期 (RGP)](https://www.icann.org/resources/pages/grace-2013-05-03-en#:~:text=30%2Dday%20Redemption%20Grace%20Period%20%28RGP%29)，其注册人常见问题解答确认，如果一个域名被删除，[该域名将进入为期 30 天的赎回期](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20enter%20into%20a%20redemption%20period%20for%2030%20days)。具有约束力的 `.com` 合同也确定了相同的数字——[该赎回期的当前长度为 30 个日历日](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20length%20of%20this%20Redemption%20Period%20is%2030%20calendar%20days)。

对于域名投资者来说，这里有两个实际细节很重要。首先，30 天这个数字是常见 gTLD 的基准，并非一个普遍的常数。根据维基百科，[这个时间长度因 TLD 而异，通常在 30 到 90 天左右](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=usually%20around%2030%20to%2090%20days)。其次，在[赎回期](/zh/glossary/redemption-period/)内恢复域名是特意设计得非常昂贵的。它不是点击一下就能续费；ICANN 的规则要求[处于 30 天赎回宽限期内的域名可以被赎回（或续费）](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=Domain%20names%20that%20are%20in%20the%2030%2Dday%20Redemption%20Grace%20Period%20can%20be%20redeemed)，但注册商通常会在续费费用之外收取一笔高昂的赎回费——维基百科将其定价为一个所有者[可能需要支付一笔费用（通常约为 100 美元）来重新激活和重新注册域名](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=may%20be%20required%20to%20pay%20a%20fee%20%28typically%20around%20US%24100%29)的水平。这笔费用是有意为之的：它为真正健忘的所有者提供了最后一次机会，同时也使得利用这个周期玩花样变得成本高昂。

对于一个在赎回期内观察域名的买家来说，要点是耐心。处于赎回期的域名是无法抢注的，也不会在公开市场上出售——在法律上它仍然是原所有者可以恢复的。许多看起来“几乎免费”的域名都停留在这个窗口期，而其中很大一部分好域名在被删除前就被注册人收回了。在赎回期间就指望收入囊中，是域名抢注中最常见的失望方式。

## 阶段三：待删除期

当赎回期结束而无人恢复时，域名进入释放前的最后一个持有状态：待删除期 (pending delete)。这是一个短暂而严格的锁定期，在此期间任何人都不能注册或恢复该域名——无论是原所有者还是你。`.com` 合同明确了触发条件和锁定机制：[如果在赎回宽限期内未被恢复，域名将被置于 PENDING DELETE 状态](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=A%20domain%20name%20is%20placed%20in%20PENDING%20DELETE%20status%20if%20it%20has%20not%20been%20restored%20during%20the%20Redemption%20Grace%20Period)，并且所有修改该状态下域名的注册商请求都将被拒绝。它的存在纯粹是为了给注册局一个干净的删除倒计时。

这里的持续时间是整个周期中最固定的数字。ICANN 的注册人常见问题解答说，未被恢复的域名[将进入为期 5 天的 PendingDelete 状态](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=will%20enter%20into%20PendingDelete%20status%20for%205%20days)，而 `.com` 注册局合同也确认[该待删除期的当前长度为五个日历日](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20length%20of%20this%20Pending%20Delete%20Period%20is%20five%20calendar%20days)；维基百科也提到了同样的窗口期，之后[该域名将从 ICANN 数据库中被删除](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=phase%20of%205%20days%2C%20the%20domain%20will%20be%20dropped%20from%20the%20ICANN%20database)。这五天是域名投资者最有用的信号，因为待删除期是唯一一个结束时间已知的阶段。一旦你想要的域名进入这个阶段，你就可以计算出它何时会释放，精确到接近小时。这种可预测性将域名删除从一场彩票变成了一件可以规划的事情：值得追逐的域名会提前五天宣告自己的释放日期。

## 阶段四：释放，以及争相抢注

![多个自动化机器人服务器冲过一扇敞开的大门，争抢在释放瞬间掉落的单个域名标签的编辑插图](../../assets/expired-domains-and-the-drop-cycle-02-release-scramble.jpg)

在待删除期结束时，域名会从注册局中清除，并返回到可注册的域名池中。ICANN 的指导很明确：在赎回和待删除期之后，[该域名将被释放并以先到先得的方式提供注册](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20be%20released%20and%20made%20available%20for%20registration%20on%20a%20first%2Dcome%2Dfirst%2Dserved%20basis)。理论上，那一刻任何人都可以用标准费用注册它。但实际上，最令人向往的域名几乎永远不会到达一个在注册商搜索框中打字的人面前，因为这个释放过程被专为此刻构建的自动化系统所争夺。

这就是域名[抢注](/zh/glossary/backorder/)服务的用武之地。这些运营商不是通过刷新搜索页面来碰运气，而是将基础设施对准注册局，在域名释放的微秒内发射注册请求。正如维基百科对它们的描述，[这些服务提供专门的服务器来确保在域名可用时获得它，通常以拍卖价格成交](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=These%20services%20offer%20to%20dedicate%20their%20servers%20to%20securing%20a%20domain%20name%20upon%20its%20availability)——而且它们总能稳定地战胜任何手动操作的人。维基百科对这种不对称性直言不讳：[个人以其有限的资源很难与这些抢注公司竞争](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=Individuals%20with%20their%20limited%20resources%20find%20it%20difficult%20to%20compete%20with%20these%20drop%20catching%20firms)以获得理想的域名。当不止一个服务为不同客户抢注到同一个域名时，它会进入他们之间的私人[拍卖](/zh/glossary/auction/)，所以“抢注”一个有争议的域名通常意味着赢得竞标，而不是支付注册费。

对域名投资者来说，坦诚的说法是：对于真正的好域名，你并不是自己去抢注——而是雇人去抢注。了解这个周期能告诉你一个域名*何时*可以赢得以及*它值多少钱*；而实际的捕获则通过预订或抢注服务来完成，我们将在[域名预订与抢注](/zh/blog/domain-backorders-and-drop-catching/)中详细介绍。

## 被删除的域名在哪里出现

![一个中央放大镜采购中心分支出四个渠道的编辑插图——一个删除列表、一张预订单、一个拍卖槌和一个二级市场店面——每个都带有一个域名标签](../../assets/expired-domains-and-the-drop-cycle-03-where-surface.jpg)

只有知道在哪里观察，了解周期才有用。被删除和即将删除的域名会出现在几个可预测的地方，一个有效的采购流程通常会同时从多个来源获取信息：

- **删除列表和过期域名数据库。** 公共和付费列表会每天发布进入待删除期的域名，通常可以按长度、[TLD](/zh/glossary/tld/)、关键词、年龄和链接指标进行筛选——这是即将释放域名观察列表的原始信息源。
- **预订和抢注平台。** 你不用自己盯着日历，而是下一个预订单，让服务商在你释放时代你竞争域名。这是获取任何热门域名的实用途径——参见[域名预订与抢注](/zh/blog/domain-backorders-and-drop-catching/)。
- **过期域名拍卖。** 许多注册商根本不会让有价值的到期域名进入公开删除池；他们会在宽限期期间或之后将其导入自己的过期拍卖，这样域名就被卖掉而不是释放。这与[如何赢得域名拍卖](/zh/blog/how-to-win-domain-auctions/)中更广泛的渠道有所重叠。
- **二级市场平台。** 被别人抢注，或者被恢复后重新上架的域名，会在[二级市场](/zh/glossary/aftermarket/)上重新出售。这并非删除本身，但很多删除后的域名最终会流向这里。

域名投资者的优势在于将渠道与域名相匹配——一个在公共删除列表上的低竞争字符串，很适合作为接近手动注册的玩法；而一个优质的单词域名则需要预订，并且可能需要一笔拍卖预算。如果你的直觉是注册新字符串，那是一条合理且不同的道路，我们在[手动注册域名进行交易](/zh/blog/hand-registering-domains-to-flip/)中有所探讨。

## 作为域名投资者如何解读周期

将各个阶段放在一起，删除周期就不再是一个谜，而是一个你可以采取行动的时间表。从其机制中可以直接得出两条规则。

**关注待删除期，而非到期日。** “已过期”并不意味着“可注册”：失效的所有者在自动续费窗口期内拥有优先权，并且可以在整个赎回期内（尽管代价高昂）恢复域名。大多数有价值的域名一旦所有者注意到过期，就会在赎回期被收回，所以能存活到待删除期的域名更倾向于是所有者真正放弃的。因为那 5 天的窗口期是固定的，它是你唯一能精确计时的阶段——这也是为什么预订服务将其整个运作都围绕它展开。

**尽职调查与域名同行。** 一个被删除的域名会继承其历史，而并非所有历史都是好的。在你竞标一个有年龄的域名之前，请检查它以前的用途、它的 [WHOIS](/zh/glossary/whois/) 和所有权记录、任何[注册商](/zh/glossary/registrar/)锁定，以及它是否曾托管过有污点的内容。一个之前侵犯过某个品牌的域名，到了你手中仍可能招致 [UDRP](/zh/glossary/udrp/) 投诉；现有的反向链接可能像黄金一样珍贵，也可能同样是垃圾邮件。删除机制将资产*连同*其包袱一并交给你。

这个周期回报那些将其视为一种机制而非运气的人。时间是公开的，阶段是固定的，域名按时掉落。将采购优势与续费坟场区分开来的是，知道哪些即将删除的域名值得抢注——这是一种估值技巧，而非计时技巧。这是我们在[域名交易](/zh/blog/domain-flipping/)系列中描绘的更宏大工艺中的上游供应步骤。

## Namefi 的视角

抢注到一个绝佳的被删除域名只完成了一半的工作；下一次它易手时，你会遇到每一次高价值[域名交易](/zh/glossary/domain-trading/)都会遇到的同样摩擦。买家在域名转移前不会付款，卖家在收到款项前不会转移它，而注册商之间的[转移授权码](/zh/glossary/auth-code/)交接过程在中间留下了一个令人不安的空白。这种僵局是[第三方托管](/zh/glossary/escrow/)服务存在的原因，而一个有年龄、富含链接的域名价值越高，这种僵局就越尖锐。

这正是 [Namefi](https://namefi.io) 旨在缩小的差距。代币化的所有权使得对一个真实的 ICANN 域名的控制权更容易验证和转移，并具有 [DNS](/zh/glossary/dns/) 连续性，因此一个在删除时抢注的域名，在你转售时也能保持干净的解析。对于一个从删除周期中采购的域名投资者来说，退出时的结算摩擦减少，意味着更多来之不易的抢注域名能够真正转化为成功的销售。

## 友情免责声明（请阅读！）

> 我们不是律师、会计师、财务顾问或医生，**本文中的任何内容均不构成法律、财务、税务、会计、医疗或任何其他形式的专业建议。** 我们撰写这些文章是为了自我教育，并为我们的客户提供便利。此处的信息可能已过时、具有地域特定性，或者干脆就是错误的。我们也会犯错。
>
> 对于任何重要决定，**请咨询真正的专业人士（我们是认真的！）**。或者，如果那不是你的风格，可以问朋友、问 Twitter、问 Reddit、问 AI，或者问通灵师。简而言之：**DOYR - Do Your Own Research (做好你自己的研究)**。让我们一起学习，享受乐趣。

## 来源与进一步阅读

- ICANN — [.com 注册局协议，附录 7（自动续费宽限期 45 天；赎回期 30 天；待删除期 5 天）](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20value%20of%20the%20Auto%2DRenew%20Grace%20Period%20is%2045%20calendar%20days)
- ICANN — [注册人常见问题解答：域名续费与到期（30 天赎回期，5 天待删除期，先到先得释放）](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20enter%20into%20a%20redemption%20period%20for%2030%20days)
- ICANN — [关于在赎回宽限期内赎回域名（30 天 RGP）](https://www.icann.org/resources/pages/grace-2013-05-03-en#:~:text=30%2Dday%20Redemption%20Grace%20Period%20%28RGP%29)
- 维基百科 — [域名抢注（删除/狙击定义；赎回期通常 30-90 天且费用约 100 美元；5 天待删除期；抢注服务）](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)
- 维基百科 — [域名注册商（gTLD 最长 10 年期限；零售 .com 定价）](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)
- 维基百科 — [域名投机（domaining 和域名交易）](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=is%20the%20practice%20of%20identifying%20and%20registering%20or%20acquiring%20generic%20Internet%20domain%20names%20as%20an%20investment)