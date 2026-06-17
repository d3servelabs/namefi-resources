---
title: '12美元的一分钟：当有人悄悄买下Google.com'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2015年9月，一名前Google员工通过Google Domains花费12美元买下了google.com，并在大约一分钟内拥有了这个世界上最有价值域名的管理控制权。这是关于Sanmay Ved、$6,006.13赏金的故事，以及这一分钟的所有权揭示了谁才真正控制着域名的真相。'
keywords: ['google.com 域名', 'sanmay ved', 'google domains 漏洞', '域名安全', '谁拥有 google.com', '域名劫持', '网站站长工具访问权限', 'google 漏洞赏金', '6006.13 奖励', '域名注册漏洞', '域名控制', 'dns 安全', '域名所有权验证']
---

2015年9月29日晚上的大约一分钟里，互联网上最有价值的地址并不属于Google。

它属于一位名叫Sanmay Ved的前Google员工，他刚刚花了**12美元**买下了**google.com**。

他没有入侵系统。他没有利用缓冲区溢出漏洞，也没有对管理员进行网络钓鱼。他进入了Google自己的零售店面——Google Domains，输入了世界上最著名的域名，并看着结账流程做了一件它绝对不该做的事情：让他付款。他的卡被扣款了。订单通过了。在大约六十秒的时间里，google.com记录在案的注册人是马萨诸塞州的一名研究生。

这是我们的 **Domain Mayday / 域名浩劫** 系列，专门讲述域名安全在公众面前失效的时刻。大多数案例都是关于域名被攻击者窃取的故事。但这次不同——而且更加令人不安——因为根本没有人发起攻击。地球上最重要的单一域名，居然以标价卖给了第一个碰巧把它放进购物车的人。

## google.com 通常意味着什么

很难夸大google.com的价值，因为这个数字实际上无法用金钱来衡量。

Google.com是地球上使用最广泛的搜索引擎的大门，是Gmail、地图、广告、YouTube账户体系的核心基石，也是数十亿人的身份验证主干。Slate在报道此次事件时，称其为["全球流量最大的域名"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.)。无论Tesla.com或Cars.com卖了多少钱，google.com都处于一个独一无二的类别：它不是一个简单的品牌资产，它是很大一部分人类每天都会接触到的*基础设施*。

像这样的域名理应是不可触碰的。它应该被锁定、标记、由注册局保留（registry-held）、服务器保留（server-hold）、禁止转移（transfer-prohibited）——包裹在注册商能提供的每一层保护之中。域名安全的整个前提就是：名称越关键，它就越难被转移。

然而，仅仅因为12美元，它就被转移了。

## 12美元的一分钟

![Vivid colorful concept art of a glowing globe-shaped domain wearing a tiny twelve-dollar price tag, a single coin dropping into a checkout slot as a one-minute hourglass begins to run](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Ved并不是在找麻烦。他是一名前Google员工——多年前曾在该公司担任客户策略师——那天深夜，他正在浏览Google当时新推出的域名注册服务Google Domains，查看一些域名。心血来潮之下，他输入了那个大名鼎鼎的名字。

用他自己的话来说，结果让他惊呆了：["我输入了Google.com，令我惊讶的是，它显示为可用（available），"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available) Ved告诉Business Insider。不是“溢价（premium）”，不是“出价（make an offer）”，也不是“该域名已被注册（this domain is taken）”。而是*可用（Available）*。只需标准的12美元注册费。

他把它加入了购物车并结账，满心以为系统会拒绝他。但系统没有。交易完成了。正如The Hacker News总结的那样，一名前Google员工["仅花了12美元，就通过Google自己的Domains服务成功买下了全球访问量最大的域名Google.com。"](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain)

接着，他的收件箱开始被塞满。那些以域名所有权为核心的系统——负责向经过验证的域名所有者发送警报和控制权限的系统——看到了新的注册人，并开始执行它们的工作。Security Affairs这样描述那一刻：["几秒钟内，他的收件箱和Google网站站长工具就被与网站管理相关的消息淹没了，这些消息都在确认他拥有Google.com域名。"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded)

在那一分钟里，Ved不仅在纸面上被列为所有者。机器也确实把他当成了真正的所有者。

## 在那一分钟里你究竟能控制什么

正是这一部分，将一个有趣的轶事变成了一个严肃的安全故事。

当你是Google生态系统中某个域名的受验证所有者时，你就可以访问**网站站长工具（Webmaster Tools，现为Search Console）**——网站所有者用来查看资产索引情况、提交站点地图、查看内部消息以及管理域名在搜索中显示方式的仪表板。Ved后来表示，他完全明白这意味着什么：["可怕的是，我有一分钟的时间可以访问网站站长的控制权限，"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute) 他解释道。

当时的报道指出，在这段短暂的时间内，他拥有["Google.com的管理访问权限"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=he%20had%20administrative%20access%20to%20Google.com)，并且他的["Google Search Console仪表板中更新了针对Google.com域名的消息。"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated) 想一想，拥有一个域名实际上能让你触及什么：DNS记录、邮件路由、向第三方证明“所有权”的能力，以及决定一个资产如何向世界展示的搜索引擎控制权。注册信息就是万能钥匙。所有下游的一切——DNS、证书、电子邮件、单点登录、搜索索引——都假设注册人就是他们声称的那个人。

Ved做了一件负责任的事。他没有更改任何一条记录。他立刻报告了此事。但教训依然摆在那里：“一个好奇的学生”和“一场灾难”之间的区别并不是什么技术控制手段，而仅仅是凭借一个人选择表现出良好行为的自觉。

## Google的拦截——及其回应

![Vivid colorful concept art of a giant glowing key held briefly in an open hand, then gently pulled back by a beam of light, against a colorful circuit-board sky with a refunded coin floating away](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Google的自动化系统很快发现了异常。大约在一分钟内，订单被撤销。福克斯新闻（Fox News）直白地报道了这次取消：["一分钟后，Google Domains取消了这笔交易，称在Ved之前已经有人注册了该网站，并将12美元退还给了他。"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later) 当然，那个“已经注册了该网站”的“人”，就是Google自己。

随后，Google的做法让这件事成为了传奇。通过其漏洞赏金计划（Vulnerability Reward Program），Google向Ved支付了一笔赏金——而且公司特意挑选了这个数字。在2015年的官方安全年度回顾中，Google写道：["我们最初给Sanmay的资金奖励是$ 6,006.13——这个数字拼写出来就是Google（眯着眼睛看你就能发现！）。当Sanmay将他的奖励捐给慈善机构后，我们将这个金额翻了一倍。"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay) （将它作为数字来读：6-0-0-6-1-3 → G-O-O-G-L-E。）

Ved选择把钱捐出去。他要求将这笔钱捐给生活艺术印度基金会（Art of Living India Foundation），该基金会支持遍布印度的免费学校——当Google得知这项捐款时，将奖金翻倍，总额达到约**12,012.26美元**。对Ved来说，整个事件从来都不是为了赚钱。["我不在乎钱。这绝不是为了钱，"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money) 他告诉Business Insider。

一个12美元的错误，最终演变成了一个关于巧妙的赏金、慷慨的捐赠以及公司配捐的佳话。但撇开这些善意不谈，基本事实依然严峻：一家注册商交出了自己王国的钥匙，而唯一能把钥匙收回来的，是一次快速的自动拦截机制——以及一个碰巧很诚实的买家。

## 如此重要的注册是如何漏网的？

地球上受保护最严密的单一域名，怎么会在自助结账页面上显示为“可用，只需12美元”？

坦诚地说，除了Google内部，没有人掌握完整的内部复盘报告，我们也不会假装知道。但这种故障的*形态*对于任何使用过域名系统的人来说都很熟悉，我们有必要准确界定哪些是已知事实。

可验证的是可见的行为。当时的报道提出了两种常见的解释：["这可能是Google Domains的一个漏洞，或者仅仅是公司在到期时忘记了续费其域名。"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew) 无论哪种情况，在短暂的时间窗口内，店面系统关于“这个名称可以注册吗？”的逻辑，对于一个本应硬编码为不可出售的名称给出了错误的答案。

更深刻的教训在于架构层面。一个域名的保护程度仅仅取决于*更改它的最薄弱路径*。注册局可以应用服务器保留和禁止转移的标记；注册商可以锁定域名；组织可以启用注册商级别的多因素认证和审批工作流。但是，如果任何单一接口——零售结账、内部管理工具、客服的覆盖操作、API端点——能够在不触发这些守卫的情况下改变所有权，那么该域名的安全性就完全等同于那个最薄弱的接口。域名接管的爆炸半径（影响范围）是巨大的（涵盖DNS、电子邮件、证书、登录等），但触发它的表面却可能极小：仅仅是一个本该说“不”却错误地说了“是”的表单。

这种不对称性正是问题的核心。面临的资产价值是顶级的，但转移它所需的动作却可以是极微小的。

## 这件事在域名控制方面给我们带来了什么启示

这12美元的一分钟带来了一些值得铭记的教训：

1. **注册人记录就是万能钥匙。** DNS、TLS证书、邮件送达率以及“验证你拥有该域名”的流程，都完全信任底层的注册信息。谁控制了注册信息，谁就控制了依附于其上的一切。请像保护Root密码一样保护这一层，因为它实际上就是。

2. **重要性与保护措施并不会自动挂钩。** 你可能会理所当然地认为世界上最重要的域名肯定锁得最严密。但在那一分钟里，它并不是。重要性本身不能自动实施保护；明确的锁定、保留状态和审批关卡才能做到。要去审计它们，而不是盲目假设它们存在。

3. **控制面比DNS更大。** 人们保护好他们的名称服务器，却忘记了注册商账户、客服支持渠道、账单邮箱和内部工具。域名可能通过任何能够改写所有权的通道丢失——而不仅仅是那个标有“DNS”的门。

4. **距离灾难往往只差一个诚实的人。** Google很幸运，买家是一位有安全意识的前员工，他立即报告了此事。依赖于偶然闯入者善意的安全并不是真正的安全。应该是系统主动说“不”，而不是寄希望于访客的自律。

5. **快速检测也是一种切实的控制手段。** Google大约一分钟的自动拦截确实限制了损害。你无法阻止每一个错误发生，但是对所有权更改的严密监控可以大幅缩小失误演变成灾难性泄露的时间窗口。

这个故事令人欣慰的部分是，Google的系统注意到了并撤销了它。令人不安的部分则是，他们不得不这么做。

## Namefi 的视角

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

这12美元的一分钟，其核心是关于一条记录的拷问：*此时此刻谁是这个域名经过验证的真正所有者，要悄无声息地改变这一点到底有多难？*

在传统模型中，答案存在于注册商的数据库中，可以通过该注册商公开的任何接口（零售结账、管理员覆盖、工单支持、API）进行修改。这些接口中的大部分都防守严密。但所有权的安全性仅取决于防守最薄弱的那个接口，而且所有者通常无法实时看到他们的记录易手的瞬间。Sanmay Ved之所以知道他“拥有”了google.com，是因为他的收件箱被邮件淹没了——而不是因为某个坚固的账本宣布了一次经过验证和授权的转移。

[Namefi](https://namefi.io) 的出发点是：域名所有权应该具备**可验证性和防篡改性**，而不是深埋在单个可随意更改的数据行中。通过将域名控制权表示为一种与DNS保持完全兼容的、代币化的链上资产，“谁拥有这个域名”这一事实就变成了你可以独立验证和审计的东西——并且域名的转移也会变成一个明确的、授权的、可见的事件，而不是一次悄无声息就走通的结账流程。我们的目标不是让域名变得稀奇古怪；而是让这把万能钥匙更难被意外交给错误的人，并且确保它在移动时必定留下不可磨灭的痕迹。

Google.com在一分钟内恢复原状，是因为Google在一个脆弱的基础机制（primitive）之上构建了快速检测防线。而更好的解决方案是，让基础机制本身就值得信赖：所有权可以被确凿证明，转移过程是公开可见的，并且控制权不再仅仅依赖于某个表单是否记得说“不”。

## 参考资料与延伸阅读

- Google 在线安全博客 — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1) （6,006.13美元赏金和双倍捐赠的主要来源）
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/) （逐字引用了Google博客的内容）
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- 福克斯新闻 — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- 福克斯新闻 — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- 雅虎财经 — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)