---
title: '从 DiscordApp.com 到 Discord.com：去掉"App"如何关闭了钓鱼者最爱利用的漏洞'
date: '2026-06-17'
language: zh-CN
tags: ['domains', 'branding', 'startups', 'domain-upgrades']
authors: ['namefiteam']
draft: false
description: 'Discord 于 2015 年在 DiscordApp.com 上线，原因是 Discord.com 已被他人注册。多年后，公司悄然买下这个裸词域名，并于 2020 年将 discord.com 设为主站——一方面是为了品牌整洁，另一方面也是因为"discordapp.com"与"discord.com"并存的局面为钓鱼者和恶意软件团伙提供了可乘之机。'
keywords: ['discordapp.com', 'discord.com', 'Discord 域名', '域名升级', 'Jason Citron', 'Discord 历史', 'cdn.discordapp.com', 'Discord 钓鱼', '初创公司命名', '品牌命名', '优质域名', '域名策略', '域名迁移']
relatedArticles:
  - /zh-CN/blog/from-bufferapp-com-to-buffer-com/
  - /zh-CN/blog/from-slackhq-com-to-slack-com/
  - /zh-CN/blog/from-ubercab-com-to-uber-com/
  - /zh-CN/blog/from-massdrop-com-to-drop-com/
  - /zh-CN/blog/from-box-net-to-box-com/
relatedTopics:
  - /zh-CN/topics/domain-investing/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/name-change-game-change/
  - /zh-CN/series/domain-apocalypse/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/web3/
---

在 Discord 成为一个动词（"上服务器"）之前，它曾住在一个略长的地址上：**DiscordApp.com**。

这个"App"并非品牌选择，而是一种变通之举。2015 年 5 月，Jason Citron 和 Stanislav Vishnevskiy 推出这款语音聊天工具时，精确匹配的域名 Discord.com 已被他人持有——早在千禧年之交便已注册。于是，产品只好带着一个修饰词上线。根据维基百科，[Discord 于 2015 年 5 月以域名 discordapp.com 公开发布](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com)。一篇记录早期历史的文章直白地写道：[Discordapp.com 是 Discord 上线第一年的官方网址](https://www.remote.tools/discord/when-was-discord-made#:~:text=Discordapp.com)。

公司想要的名字与实际能拿到的名字之间的落差，是初创公司品牌建设中最常见的困境之一。产品的名字一直叫 Discord，只是世界还无法通过 Discord.com 找到它。

案例 13 之所以有别于寻常的"买下[精确匹配域名](/zh-CN/glossary/exact-match-domain/)"故事，在于这个变通方案留下的*缝隙*。五年间，Discord 同时运营着两个地址——它实际使用的品牌（discordapp.com）和它真正想要的品牌（discord.com）——而这种双域名分裂，恰好是钓鱼者、骗子和恶意软件团伙赖以生存的模糊地带。这是一个域名升级的故事，既关乎品牌整洁，也关乎封堵公司自上线以来一直带着的安全漏洞。

## 2015 年：那个需要一个得不到的名字的工具

Discord 并非一开始就是消费级现象，它起步于对一个具体痛点的解决方案。

Citron 带着资金和伤疤入局。他曾创立社交游戏网络 OpenFeint，而后——据维基百科记载——[于 2011 年以 1.04 亿美元将其出售给 GREE，并用这笔资金于 2012 年创立了游戏开发工作室 Hammer & Chisel](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=later%20sold%20it%20to%20GREE%20in%202011%20for%20%24104%20million%2C%20which%20he%20used%20to%20found%20Hammer%20%26%20Chisel)。工作室的游戏没能起飞，但团队为协调副本攻略而搭建的聊天工具却大放异彩，工具本身成了产品。

名字很早就定下来了，原因也很平常。根据维基百科，["Discord"这个名字之所以被选中，是因为它"听起来很酷，而且与交流有关"，易于发音、拼写、记忆，商标和网站都可用](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=The%20name%20%22Discord%22%20was%20chosen%20because%20it%20%22sounds%20cool%20and%20has%20to%20do%20with%20talking%22)。注意最后一句话——*商标和网站都可用*。"可用"在这里暗藏玄机：商标是干净的，裸词 [.com](/zh-CN/tld/com/) 域名却不是。

于是团队做了无数初创公司会做的事：加上修饰词，然后上线。品牌"Discord"以地址"DiscordApp"登场，效果出奇得好。用户基数几乎立刻滚雪球式地增长。根据维基百科，[2016 年 1 月，Hammer & Chisel 报告称 Discord 已有 300 万用户，月增长量达 100 万](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=By%20January%202016%2C%20Hammer%20%26%20Chisel%20reported%20Discord%20had%20been%20used%20by%203%20million%20people%2C%20with%20growth%20of%201%20million%20per%20month)，到同年 7 月达到 1100 万用户，年底更突破 2500 万。

这条增长曲线正是问题所在。这数千万人中的每一位都是通过"discordapp.com"认识这个品牌的。每一条邀请链接、每一张分享的截图、每一个书签，都在把这个变通之举越钉越深。修饰词跟得越久，去除的代价就越高——不是金钱上的，而是受众在肌肉记忆中写错这个词的次数。

## 迁移到 Discord.com

Discord 不需要改名，产品始终叫 Discord。它只需要改地址——从 DiscordApp.com 改到 Discord.com——而要做到这一点，必须先*拥有* Discord.com。

这件事悄然完成，比正式启用早了好几年。这个域名早在 [2000 年就被注册](https://www.thedomains.com/2020/05/09/discord/#:~:text=registered%20in%202000)，远早于公司成立。据域名行业报道，公司[早在 2017 年就收购了 Discord.com](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017)——但没有立即切换。一段时间内，[这个 .com 只是指向他们从一开始就使用的 discordapp.com 的重定向](https://www.thedomains.com/2020/05/09/discord/#:~:text=the%20.com%20was%20a%20redirect%20to%20the%20discordapp.com%20domain%20they%20have%20used%20since%20the%20start)。公司持有了那个更干净的名字，却一直把它指回变通方案。

真正的翻转发生在 2020 年。一篇域名分析文章指出，尽管有些来源将收购时间定在 2017 年，但[唯一可确认的事实是，迁移到新域名发生在 2020 年 5 月 4 日](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020)。Discord 将 discord.com 设为主站，并明智地[保留了旧域名](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=they%20decided%20to%20keep%20the%20old%20domain%20up)作为重定向，确保现有链接不会失效。社交媒体账号也随地址一同更新：公司[将社交媒体账号从 @discordapp 改为 @discord](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=changed%20their%20social%20media%20handles%20from%20%40discordapp%20to%20%40discord%20only)。

这次切换也不只是表面文章——它深入到了底层管道。机器人和库的开发者不得不重新指向他们的代码，因为 API 本身也在迁移。流行库 discord.py 的维护者开了一个追踪 issue，指出 [Discord 正从 discordapp.com 迁移到 discord.com](https://github.com/Rapptz/discord.py/issues/4063#:~:text=Discord%20is%20moving%20from%20discordapp.com%20to%20discord.com)，并设定了强制截止日期：[如果用于连接 Discord 服务器的域名在 2020 年 11 月 7 日前未能更改，使用该库的客户端将无法连接](https://github.com/Rapptz/discord.py/issues/4063#:~:text=is%20not%20changed%20by%20November%207th%202020%20then%20clients%20using%20the%20library%20will%20be%20unable%20to%20connect)。这场大多数用户毫无感知的域名"升级"，对开发者生态来说却是一个硬性截止日期。

## 背后故事：为何双域名分裂是钓鱼者的礼物

![Discord 紫蓝色风格的生动插图：一个分叉路标，一条路写着 discord.com，另一条写着 discordapp.com，Clyde 吉祥物紧张地在两者之间张望，一名兜帽钓鱼者躲在分叉处](../../assets/from-discordapp-com-to-discord-com-02-phishing-risk.jpg)

这部分内容，让案例 13 不只是一个整洁的品牌故事。

当一家公司长年同时运营两个几乎相同的域名，它无形中在训练自己的用户接受*两者*都是合法的。"discordapp.com 是真正的 Discord，还是 discord.com 才是？"大多数人无法自信地回答——这种不确定性，正是钓鱼攻击生长的土壤。如果用户愿意信任两个官方域名，他们就会信任一个看起来和它们差不多的第三个。名字上的细微变体——多一个字母，或换一个词——成了绝佳伪装，因为真正的官方域名本来就不止一个形式。

这种风险对 Discord 来说并非假设，而且影响深远。Discord 的内容分发网络至今仍使用旧名称：**cdn.discordapp.com**——这个域名已经成为互联网上*托管*恶意软件的热门场所，正因为它看起来值得信赖。安全公司 Zscaler 记录了这样一种攻击方式：[攻击者可以将恶意文件上传到 Discord 频道，并将其公开链接分享给他人——即使是非 Discord 用户也可以下载](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=An%20attacker%20can%20upload%20a%20malicious%20file%20on%20a%20Discord%20channel%20and%20share%20its%20public%20link%20with%20others)。更糟糕的是，他们发现，[通过 Discord 发送的文件会永久保留，因此即使攻击者在 Discord 内删除了文件，其链接仍可用于下载恶意文件](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=a%20file%20sent%20from%20Discord%20is%20there%20forever)。

威胁情报公司 Intel 471 阐明了*域名*本身为何是武器。文件上传后，[平台会生成一个直接链接](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=a%20direct%20link%20is%20generated%20by%20the%20platform)，[攻击者随后可以通过钓鱼邮件、社交媒体或其他渠道传播这些链接](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=Attackers%20then%20can%20choose%20to%20disseminate%20these%20links%20through%20phishing%20emails%2C%20social%20media%20or%20other%20channels)。链接格式为 [https://cdn.discordapp.com/attachments/{频道 ID}/{文件 ID}/{文件名}](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=The%20Discord%20URL%20follows%20the%20https%3A%2F%2Fcdn.discordapp.com%2Fattachments)——真实的 Discord 域名，有效的 TLS 证书，轻松绕过过滤器，因为[如果安全控制没有将 Discord 域名列入黑名单，它就是传递有害内容的有效途径](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=If%20the%20Discord%20domain%20isn%27t%20disallowed%20by%20security%20controls%2C%20it%27s%20an%20effective%20way%20to%20deliver%20harmful%20content)。Malwarebytes 旗下的研究团队也追踪到了同样的模式，警告称[新的钓鱼活动利用 Discord 进行载荷投递](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=New%20phishing%20campaign%20uses%20Discord%20for%20payload%20delivery)，并指出[犯罪分子滥用 Discord 托管恶意软件，原因在于其强大的 CDN 基础设施](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=Criminals%20abuse%20Discord%20to%20host%20malware%20because%20of%20its%20robust%20CDN%20infrastructure)。

将面向用户的品牌收拢到单一的权威入口——discord.com——并不能解决 CDN 滥用问题。但它能做到品牌能为安全做到的那一件事：让"真正的 Discord 长什么样？"有了一个明确答案。一个品牌的官方写法越少，攻击者能借用的伪装就越少。

## 当时的钱，有不同的面貌

人们很容易把 Discord 买下 Discord.com 视为理所当然——当然，公司最终会拥有自己的名字。但这些决策是在迷雾中做出的，而非事后回望。

看看时间线。团队在 2017 年收购了 Discord.com，彼时 Discord 是一款增长迅猛但尚未被验证的游戏聊天应用，距离它疫情时代的无处不在和数十亿美元的估值还有好几年。然后它*将这个干净的域名挂为重定向*，这一挂就是三年，直到 2020 年才完成切换。这种耐心才是有趣的地方。Discord 拥有了那个更好的地址，却一再选择不去打扰一个运转良好的产品来使用它。

这就是域名升级真正的成本逻辑，而这个成本很少是收购价格本身。真正艰难的是迁移：重新对接应用、API、OAuth 授权范围、保存的密码、浏览器权限、深度链接，以及庞大的第三方机器人生态——同时不能打断每天被数百万人使用的活产品。Discord 能够在买下 Discord.com 很久之后才*迁移*到它。2017 年的收购锁定了这个选择权；2020 年的切换行使了它——此时产品已足够稳定，可以承受这次波动，11 月 2020 年的开发者截止日期也可以被强制执行了。

## 去掉"App"为何重要

![Discord 紫蓝色风格的生动彩色插图：单词 DiscordApp 正在甩掉发光的 -App 后缀，字母纷纷坠落，Clyde 吉祥物咧嘴而笑，留下一个简洁的 Discord 文字商标](../../assets/from-discordapp-com-to-discord-com-01-dropping-app.jpg)

DiscordApp.com 和 Discord.com 之间相差三个字母，但从战略层面看，这是*一款应用*与*一个地方*之间的距离。

**DiscordApp.com** 命名的是一个软件——一个你下载的东西，众多应用中的一个。**Discord.com** 命名的是一个目的地——一个你去的地方，一个你所属的社区，一个人们不假思索就会用到的动词。前者指向一款产品，后者*就是*这个品牌。随着 Discord 从游戏圈扩展到社团、课堂和朋友群体，"App"开始像一件公司最初对自我描述的遗物。

| 之前 | 之后 |
| --- | --- |
| DiscordApp.com | Discord.com |
| 命名"这款应用"——一个可下载的产品 | 命名这个品牌——一个地方和一个动词 |
| 带有变通修饰词 | 只有这个词本身 |
| 用户需要信任两个官方写法 | 只有一个权威入口 |
| 留下钓鱼者可以模仿的缝隙 | 消除"哪个才是真的？"的疑问 |

这是域名升级中反复出现的模式：早期名字*描述*或*限定*；出色的名字*拥有*。"App"、"HQ"、"Cab"或"The"这样的修饰词，在干净的域名被占用时是合理的起步选择。但一旦公司足够强大，那个裸词本应成为目的地时，修饰词就成了拖累——在 Discord 的案例中，还是一个小小的安全隐患。

## 顺序：先拥有，等到安全时再迁移

这里的操作顺序值得细细品味，因为它颠覆了通常给初创公司的建议——"一拿到精确匹配域名就立刻切换"。

Discord 没有这么做。它的顺序是：

1. **名字先确定** —— "Discord"，因为易于记忆且商标[可用](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=The%20name%20%22Discord%22%20was%20chosen%20because%20it%20%22sounds%20cool%20and%20has%20to%20do%20with%20talking%22)，即使裸词 .com 并不可用。
2. **产品以修饰词域名上线** —— [discordapp.com](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com)，因为 Discord.com 从 2000 年起就被占用了。
3. **精确匹配域名被收购但作为备用** —— Discord 于 [2017 年](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017)买入 Discord.com，并将其作为[重定向](https://www.thedomains.com/2020/05/09/discord/#:~:text=the%20.com%20was%20a%20redirect%20to%20the%20discordapp.com%20domain%20they%20have%20used%20since%20the%20start)运行，而非替换。
4. **切换发生在产品能够承受时** —— [迁移到新域名发生在 2020 年 5 月 4 日](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020)，开发者截止日期为 2020 年 11 月 7 日。

教训不是"推迟你的升级"，而是：拥有干净的域名和*迁移*到它，是两个独立的项目，风险曲线各不相同。Discord 早早、廉价地锁定了这项资产，然后审慎地选择了迁移时机——保留旧地址作为重定向，确保一切不会出错。

## 域名成为操作系统的一部分

优质域名之所以重要，原因很不起眼：重复。

一个核心域名会出现在公司无法完全掌控的每一处——邀请链接、OAuth 授权界面、电子邮件地址、媒体报道、浏览器地址栏、搜索结果，以及每一句"加入我的服务器"。每一次重复，要么增加摩擦，要么消除摩擦。DiscordApp.com 要求所有人永远多打三个字母，*同时*默默告诉用户 Discord 有两个官方写法。Discord.com 什么都不需要，一个词就回答了信任问题。

品牌演进强化了这个地址。Discord 于 2020 年年中正式将定位从游戏聊天转向更广泛的人群——也是迁移域名的同一年——它在官方[博客文章](https://discord.com/blog/your-place-to-talk)中告诉社区：[我们推出了新网站，新口号是：Your place to talk（你的交流之所）](https://discord.com/blog/your-place-to-talk#:~:text=we%27re%20launching%20a%20new%20website%20with%20a%20new%20tagline%3A%20Your%20place%20to%20talk)。它承认[我们对自己的定义方式向世界传递了错误的信号](https://discord.com/blog/your-place-to-talk#:~:text=the%20way%20we%20talked%20about%20ourselves%20sent%20the%20wrong%20signal%20to%20the%20world)。一个自称"App"的名字，传递的信号远比一家想要变得[更包容、更开放、更值得信赖](https://discord.com/blog/your-place-to-talk#:~:text=more%20welcoming%2C%20more%20inclusive%2C%20and%20more%20trustworthy)的公司来得狭窄。"值得信赖"是关键词——而唯一的权威域名，正是品牌赢得信赖的方式之一。

## 创始人应从案例 13 中学到什么

那个简单的结论——"在上线前就拥有精确匹配的 .com"——是错误的，因为 Discord 当时根本做不到。更有用的教训关乎修饰词、时机和安全：

1. **修饰词是一条不错的起步路径。** "App"让 Discord 在裸词域名被一位 2000 年的注册者持有时，仍能以真实名字上线。在 DiscordApp.com 上线不是失败，而是一种合理的上市方式。
2. **买下干净域名和迁移到它是两个不同的决策。** Discord 于 2017 年收购了 Discord.com，却直到 2020 年才切换。锁定资产争取了一个选择权；行使这个选择权可以等到安全的时机。
3. **数缝隙，不只是数字母。** 运营两个域名的代价不只是三个额外的字符——而是模糊性。两个官方写法教会用户信任相似的名字，而相似的名字正是钓鱼者使用的。
4. **一个权威入口是一项安全功能。** 收拢到 discord.com 并不能阻止 cdn.discordapp.com 上的 CDN 滥用，但它让"真正的 Discord 长什么样？"有了一个明确答案——而这种清晰，是攻击者难以伪造的。

域名升级没有让 Discord 成功。产品本身、时机、疫情、以及爆炸性的社区才是更大的功臣。但 discord.com 让这个品牌更好打出来，更容易信任，更难被仿冒——对于一个以陌生人点击的链接为基础运转的平台而言，这并不是小事一桩。

## Namefi 的视角

![彩色插图：一个优质域名经过认证转移、绿色的 Namefi 代币，以及 DNS 连续性](../../assets/from-discordapp-com-to-discord-com-03-namefi-angle.jpg)

Discord 的故事，剥去品牌外衣，本质上是一个*控制与延续性*问题。

战略决策从未令人怀疑——一个叫 Discord 的平台当然应该住在 Discord.com。真正的工作是围绕这项资产展开的：收购一个二十年前注册的优质域名，然后证明所有权，将其安全地作为重定向持有，最终将一个活产品——应用、API、OAuth、保存的凭据和第三方机器人生态——迁移到新域名上，全程不能出岔子，更关键的是，不能在切换过渡期给冒充者留下窗口。最后这一点，是贯穿整个案例的安全线索：关于*哪个域名才真正属于你*的模糊性，正是攻击者利用的漏洞。

[Namefi](https://namefi.io) 建立在这样一个理念之上：域名应当像原生互联网资产一样运作。代币化所有权可以让域名控制更易验证、转移，并融入现代工作流程，同时与 DNS 保持兼容——将此类交易中缓慢且依赖信任的环节（确认谁拥有什么、转移资产、在迁移过程中保持连续性）转变为更接近干净、可审计的交易。当一个名字的所有权可以被证明且可以流通时，"这是真正的 Discord 吗？"就变得更容易回答——对公司如此，对每一个点击链接的人亦然。

Discord.com 现在看起来势在必然，因为 Discord 变得庞大无比。但这个教训在更早的时候就已成立：当一个名字要承载整个业务——尤其是当一个变通域名留下可供骗子钻入的缝隙时——域名就不是装饰品，而是前门。而你只需要一扇。

## 参考资料与延伸阅读

- 维基百科 — [Discord（软件）](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com)
- The Domains — [Discord 现已使用 Discord.com，该域名不再只是重定向](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017)
- Domainer — [Discord.com 域名销售如何重塑这款应用](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020)
- GitHub (discord.py) — [Discord 域名从 discordapp.com 变更为 discord.com（Issue #4063）](https://github.com/Rapptz/discord.py/issues/4063#:~:text=Discord%20is%20moving%20from%20discordapp.com%20to%20discord.com)
- Discord 博客 — [Your Place to Talk](https://discord.com/blog/your-place-to-talk#:~:text=we%27re%20launching%20a%20new%20website%20with%20a%20new%20tagline%3A%20Your%20place%20to%20talk)
- Zscaler — [Discord CDN：托管恶意载荷的热门选择](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=An%20attacker%20can%20upload%20a%20malicious%20file%20on%20a%20Discord%20channel%20and%20share%20its%20public%20link%20with%20others)
- Intel 471 — [Discord 如何被用于网络犯罪](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=The%20Discord%20URL%20follows%20the%20https%3A%2F%2Fcdn.discordapp.com%2Fattachments)
- ThreatDown（Malwarebytes）— [新钓鱼活动利用 Discord 进行载荷投递](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=Criminals%20abuse%20Discord%20to%20host%20malware%20because%20of%20its%20robust%20CDN%20infrastructure)
- Remote Tools — [Discord 是什么时候创建的？](https://www.remote.tools/discord/when-was-discord-made#:~:text=Discordapp.com)
- Discord 支持 — [Discordapp.com 现已更名为 Discord.com](https://support.discord.com/hc/en-us/articles/360042987951-Discordapp-com-is-now-Discord-com)
