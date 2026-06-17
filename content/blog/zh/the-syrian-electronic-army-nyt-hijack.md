---
title: '域名求生记 EP10：叙利亚电子军如何通过网络钓鱼攻击分销商让 NYTimes.com 瘫痪'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2013年8月27日，叙利亚电子军通过网络钓鱼攻击了一家 Melbourne IT 的分销商，重写了 nytimes.com 和 Twitter 域名的 DNS 记录，导致《纽约时报》网站离线数小时。本文将深入探讨注册商供应链中的薄弱环节是如何导致这家报纸“正门”失守的——以及注册局锁定服务原本可以如何扭转乾坤。'
keywords: ['纽约时报黑客攻击', '叙利亚电子军', 'melbourne it', 'dns 劫持', '域名劫持', '注册商安全', '分销商钓鱼', '注册局锁定', 'dns 记录', '域名服务器攻击', 'twitter dns 2013', '域名安全', 'serverupdateprohibited']
---

一家报社的域名就是它的大门。当你在浏览器中输入 `nytimes.com` 时，你实际上是在信任一条看不见的链条——从域名注册局、注册商，有时还包括注册商层级之下的分销商——相信它们会将你准确无误地指向真正的新闻编辑室。在平常的日子里，你绝不会多想这条信任链。但在2013年8月27日，这条链条断裂了，数百万读者走到《纽约时报》（*The New York Times*）的“正门”前，却发现它已经被换成了别人的。

这个“别人”就是**叙利亚电子军**（Syrian Electronic Army，简称 SEA），这是一个亲阿萨德的黑客组织，在2013年曾多次针对西方媒体机构发起攻击。但这一次，他们并没有涂改某篇特定的文章，也没有入侵内容管理系统（CMS）。他们深入了更底层——直接瞄准了决定域名指向的 **DNS 记录**——并且在短短几个小时内，他们掌控了这个地球上读者最多的新闻网站之一的访问地址。

## 域名就是正门，而这扇门的锁并不在你的控制之下

当像《纽约时报》这样的公司注册一个域名时，“谁拥有这个域名以及它指向哪里”的权威记录存放在注册局（对于 `.com` 来说，是 Verisign），并通过**注册商**（registrar）进行管理。大型注册商也会通过**分销商**（reseller）进行销售，这些分销商是转售域名服务的小型公司，并且拥有登录注册商系统的独立账号。

这种分层架构固然便利，但它也是一条信任链，其中最薄弱的一环决定了整体的安全性。如果攻击者能够以该链条中*任何*人的身份进行身份验证——无论是注册人、注册商员工还是分销商——注册商的系统在设计上都会将他们视为合法所有者。Melbourne IT 的首席执行官用一句极具破坏力的话总结了这种失效模式：[“他们是从正门走进来的，”](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door)他在接受美联社采访时说道。如果你有一个有效的用户名和密码，系统就会认定你就是经过授权的所有者。这正是整个问题的核心所在。

## 2013年8月27日：nytimes.com 指向别处的那一天

![Vivid colorful concept art of a giant newspaper front-door sign being unbolted and re-hung over a different doorway, glowing red routing arrows pulling a crowd of readers off course into a dark side alley](../../assets/the-syrian-electronic-army-nyt-hijack-01-hijack.jpg)

在那个星期二傍晚，读者们开始无法访问《纽约时报》。据美国广播公司（ABC News）报道，[《纽约时报》网站“对部分用户已无法访问”](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=gone%20dark%20for%20some%20users)，该报社随后证实，在其域名注册商遭到攻击后，[该网站“在周二下午对读者不可用”](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=unavailable%20to%20readers%20on%20Tuesday%20afternoon)。这并不是一次短暂的故障。《基督教科学箴言报》报道称，[访问者“在周二的几个小时里看到的都是空白的浏览器屏幕”](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=greeted%20with%20blank%20browser%20screens%20for%20several%20hours)——更糟糕的是，[这已经是该网站“本月第二次”](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=second%20time%20this%20month)遭遇宕机。

实际发生的事情是一场发生在注册商级别的 **DNS 劫持**。攻击者触及了将 `nytimes.com` 转换为 IP 地址的底层记录，并对其进行了重写。根据维基百科对该事件的记录，[`NYTimes.com`“其 DNS 被重定向到了一个显示着‘被 SEA 黑客攻击’（Hacked by SEA）信息的页面”](https://en.wikipedia.org/wiki/Syrian_Electronic_Army#:~:text=had%20its%20DNS%20redirected%20to%20a%20page%20that%20displayed%20the%20message)。这扇“正门”被重新挂在了另一间屋子的门框上。

《纽约时报》并非该账号下被攻击的唯一目标。TechCrunch 在进行实时报道时发现，[“《纽约时报》和 Twitter 的名称服务器（name servers）似乎都是通过注册商 Melbourne IT 注册的，”](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=name%20servers%20appear%20to%20have%20been%20registered%20through%20the%20registrar%20Melbourne%20IT)而且[“负责提供 Twitter 图片和头像的 `twimg.com` 域名，也显示出了更改，指向了显然归 SEA 所有的服务器。”](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=which%20serves%20up%20Twitter%20images%20and%20avatars)Twitter 的主站大部分保持完好，但其提供图片和头像的域名却出现了动摇——以至于部分用户在短时间内看到了破损的图像。

## 影响：持续数小时的黑暗，以及你无法信任的重定向

对于一家新闻机构来说，被劫持的代价不仅仅体现在丢失的页面浏览量上，更是对信任的打击。在网站宕机期间，任何访问 `nytimes.com` 的人都在受攻击者的重定向控制。《纽约时报》的首席信息官 Mark Frons 告诉员工，这次服务中断[“是叙利亚电子军或极力想冒充他们的人发起的一场恶意外部攻击的结果”](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=was%20the%20result%20of%20a%20malicious%20external%20attack)——并警告员工，在域名脱离报社控制的这段时间里，使用电子邮件时务必保持谨慎。

想想看一条被劫持的 DNS 记录究竟能做什么。攻击者控制着域名的解析位置，这意味着他们可以提供一个网页涂鸦（正如他们所做的那样），但他们同样可以轻易地提供一个极具迷惑性的假登录页面，以此窃取凭证，或者拦截流量。网页涂鸦是高调且显眼的，但一场*悄无声息*的 DNS 劫持则要危险得多——而同样的漏洞可以让这两者成为现实。《赫芬顿邮报》（英国版）的域名也卷入了同一事件中，这凸显了这是一起注册商账号遭入侵的事件，而非针对单一新闻编辑室的一次性恶作剧。

## 事件起因：被钓鱼的是分销商，而不是报社

![Vivid colorful concept art of a phished golden key sliding into a glowing control-room door labeled with abstract routing dials, a shadowy hand rewriting a luminous ledger of address arrows while a fake email envelope dissolves into the lock](../../assets/the-syrian-electronic-army-nyt-hijack-02-reseller-phish.jpg)

这里有一个值得深思的细节：SEA 压根就不需要入侵《纽约时报》。他们从未触碰过该报的服务器或其 CMS 系统。他们攻击的是注册商*层级之下*的供应链。

攻击的切入点是一封发送给一家位于美国的 Melbourne IT 分销商的**鱼叉式网络钓鱼邮件**。正如 The Next Web 所报道的，[Melbourne IT “证实 SEA 使用了钓鱼策略来获取登录凭据”](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter#:~:text=used%20phishing%20tactics%20to%20get%20hold%20of%20the%20log)——分销商的员工被欺骗交出了他们的电子邮件凭据，然后攻击者在这些邮箱中挖掘出了注册商系统的登录信息。接下来的事情就顺理成章了：[“Melbourne IT 一家分销商的凭据（用户名和密码）被用来访问 Melbourne IT 系统上的分销商账号，”](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=credentials%20of%20a%20Melbourne%20IT%20reseller)进入系统后，[攻击者“更改了几个域名的 DNS 记录……其中包括《纽约时报》的域名。”](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=changed%20the%20DNS%20records%20of%20several%20domain%20names)

TechCrunch 的描述同样直白：[“该分销商账号下的几个域名的 DNS 记录被篡改了——其中包括 `nytimes.com`。”](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=DNS%20records%20of%20several%20domain%20names%20on%20that%20reseller%20account%20were%20changed)

这就是让注册商供应链攻击显得如此诱人的不对称性。《纽约时报》大可以把他们自己的基础设施武装到牙齿，但这无济于事，因为那个脆弱的账号属于一个与新闻编辑室相隔好几个层级的第三方分销商。仅仅对一家小公司的几名员工进行一次鱼叉式钓鱼攻击，就足以将一家拥有数百万读者的报纸重定向到其他地方。

## 响应与余波

一旦 Melbourne IT 弄清了事情的真相，补救措施就很直接了——这也表明了*只要你控制了注册商*，这些攻击是极易逆转的。该公司恢复了正确的设置：它[将篡改的 DNS 记录恢复原状，并将它们“锁定”以防止进一步被篡改](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=reverted%20the%20altered%20DNS%20records)。它更改了受损分销商账号的密码，并调取了日志以追踪入侵轨迹。《纽约时报》在周三早间恢复了服务。

但整个事件中最具教育意义的细节在于，*为什么破坏行为没有进一步扩大*。同一个分销商账号下的某些域名压根就没有受到任何影响——因为它们的所有者开启了更强的保护措施。用 Melbourne IT 自己的话来说，[“对于任务关键型域名，我们建议域名所有者利用包括 .com 在内的域名注册局提供的额外注册局锁定功能——受攻击的分销商账号上的部分目标域名激活了这些锁定功能，因此没有受到影响。”](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=For%20mission%20critical%20names%20we%20recommend%20that%20domain%20name%20owners%20take%20advantage%20of%20additional%20registry%20lock)

注册局锁定服务会将域名置于一种特殊状态（你可以在 WHOIS 信息中看到类似 `serverUpdateProhibited` 这样的标志），在这种状态下，除非遵循更严格的带外（out-of-band）验证流程，否则注册局将拒绝任何更改。正如当时域名行业的观察者所注意到的那样，Twitter 的记录恰好拥有这种 [Verisign 锁定状态](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/#:~:text=serverUpdateProhibited)。一个通过钓鱼得来的分销商密码不足以破解注册局锁定——而这一个小小的配置选择，正是决定网站是“宕机数小时”还是“从未受影响”的分水岭。

## 关于注册商、分销商供应链以及注册局锁定，这件事教会了我们什么

8月27日的劫持事件是一个近乎完美的教学案例，因为失败链条中的每一个环节都清晰可见。

1. **你的域名安全程度，取决于能更改它的最薄弱的那个账号。** 这包括你注册商的员工以及他们下属的任何分销商——其中没有任何一方是由你直接控制的。《纽约时报》在自家的服务器上没有做错任何事；真正的漏洞在远离他们控制范围的好几个层级之外。
2. **网络钓鱼完胜防火墙。** 这次攻击没有使用任何复杂的漏洞利用技术。只需向少数几个分销商员工发送伪造的电子邮件，就能生成让注册商系统视为完全授权的登录凭据。[“他们是从正门走进来的。”](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door)
3. **注册局锁定才是真正起作用的控制手段。** 拥有[额外注册局锁定功能](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=additional%20registry%20lock%20features)的域名“因此未受影响”。对于任何任务关键型域名而言，注册局锁定（加上注册商锁定和注册商账号的 2FA 双因素身份验证）绝非可有可无的加固手段——而是最基本的基线要求。
4. **DNS 更改威力巨大且见效神速。** 仅仅修改一次名称服务器（name-server）或 A 记录，就能瞬间重定向整个品牌。一个被攻破的账号所造成的破坏范围，波及它可以触碰到的每一个域名。
5. **监控你自己的记录。** WHOIS 和 DNS 监控可以在几分钟内标记出未经授权的更改。你越早注意到意外的名称服务器更改，宕机的时间就越短。

## Namefi 的视角

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-syrian-electronic-army-nyt-hijack-03-namefi-angle.jpg)

SEA 劫持事件，在其核心层面上，是一个**权限**问题。注册商的系统无法区分真正的所有者和一个拿着钓鱼得来的密码的人，所以它只是执行了预设的逻辑，接受了更改请求。每一个奏效的防御措施——注册局锁定、带外验证确认、仔细的监控——本质上都是为了提高门槛，以*证明*更改请求确实来自于真正的所有者。

[Namefi](https://namefi.io) 正是基于这样一个前提：域名的所有权和控制权应当是**可验证且防篡改的**，而不是靠一个在分销商收件箱里飘荡的、可重复使用的密码来维系。通过将域名所有权表达为一种链上的、可通过密码学验证的资产（同时保持与 DNS 的兼容性），Namefi 让“谁有权更改这个域名”变成了一个有着强有力、可审计答案的问题，而不是对“任何登录进来的人”的隐式信任。控制权的变更转变为明确的、与所有者绑定的签名操作——这更像是一把由你亲自保管钥匙的注册局锁，而不是一扇只要密码正确，任何人都能推门而入的“正门”。

报社的域名就是它的大门。2013年8月27日的惨痛教训是，如果隔着好几栋楼的陌生人能被轻易骗走你大门备用钥匙的副本，那么哪怕你门上的防盗锁再坚固也无济于事。解决之道在于让所有权本身变得“可证明”——这样，陌生人就再也没有机会说出那句“我是从正门走进来的”了。

## 参考资料与延伸阅读

- The Register — [New York Times, Twitter domain hijackers 'came in through front door'](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/)
- TechCrunch — [Syrian Electronic Army Apparently Hacks DNS Records Of Twitter, NYT Through Registrar Melbourne IT](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/)
- ABC News — [New York Times Website Hacked, Syrian Electronic Army Appears to Take Credit](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043)
- Christian Science Monitor — [New York Times hacked, Syrian Electronic Army takes credit](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit)
- iTnews — [Melbourne IT compromise redirects NY Times, HuffPo readers](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935)
- The Next Web — [Here's How the New York Times and Twitter Got Hacked](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter)
- Domain Name Wire — [Melbourne IT the weak link as Twitter and NY Times domain names compromised](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/)
- Wikipedia — [Syrian Electronic Army](https://en.wikipedia.org/wiki/Syrian_Electronic_Army)
- NBC News — [Syrian group hacks Twitter, New York Times](https://www.nbcnews.com/id/wbna52864470)
- Al Jazeera — [Syria hackers target New York Times website](https://www.aljazeera.com/news/2013/8/28/syria-hackers-target-new-york-times-website)