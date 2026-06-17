---
title: 'Lenovo.com DNS 劫持事件：当 Lizard Squad 夺走硬件巨头的前门'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2015年2月25日，就在 Superfish 丑闻爆发几天后，Lizard Squad 通过攻陷域名注册商 Webnic 劫持了 Lenovo.com，将这家全球最大 PC 制造商的域名重定向到了网络摄像头幻灯片并拦截了其邮件。Domain Mayday 深度剖析：为什么注册商才是你真正的安全边界。'
keywords: ['联想 DNS 劫持', 'lizard squad', 'webnic 注册商', 'web commerce communications', 'DNS 劫持', 'superfish', '域名注册商安全', '注册商沦陷', 'EPP 授权码', '电子邮件拦截', '谷歌越南劫持', '域名安全', '注册商锁定']
---

2015 年 2 月 25 日上午，互联网上点击量最高的全球最大 PC 制造商的链接，竟指向了一个满是无聊青少年盯着网络摄像头的幻灯片，背景音乐还播放着《歌舞青春》（*High School Musical*）里的歌曲。没有任何人黑入过联想的服务器，也没有任何人窃取过联想的密码。攻击者从未触及他们的办公大楼、内部网络或网站本身。

他们仅仅在公司的域名注册商那里更改了一条记录——这就足以夺走联想的“前门”（门户），重定向其电子邮件，并让其品牌在整个下午沦为笑柄。

这是 **Domain Mayday 第 17 期**：Lenovo.com DNS 劫持事件。从数据上看，这只是个小事件——仅仅几个小时的宕机，没有生产系统被破坏，也没有客户数据库被泄露。但这是迄今为止最清晰的案例之一，揭示了大多数公司仍然在犯的错误：你的域名的安全性完全取决于托管它的注册商，而这个注册商却几乎从未被纳入你的安全防护体系中。

## 将域名作为门面的硬件巨头

到 2015 年，联想已是[全球最大的 PC 制造商](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer)，其出货的笔记本和台式电脑比地球上任何公司都要多。对于这样规模的公司来说，lenovo.com 绝不仅仅是一个营销资产。它是整个运营的承重中心：客户在这里购买产品，支持工单在这里汇集，保修注册在这里流转，最关键的是——它是公司每一个 `@lenovo.com` 电子邮件地址背后的根基。

当一个品牌达到如此规模时，域名就不再只是一个网站地址，而是基础设施。每一份新闻稿、每一个零售包装盒、每一个员工签名、每一份订单确认信，都要经过它的路由。这意味着，谁控制了该域名的 DNS，谁控制的就不只是网站，而是 lenovo.com 指向何方的*真相*——无论是对浏览器还是对邮件服务器而言。

这就是 Lizard Squad 盯上的猎物。不是网站本身，而是指向网站的指针。

## 2015 年 2 月 25 日：离奇的重定向

![生动多彩的数字艺术：一家企业玻璃店面的发光招牌在一夜之间被换成了花哨的恶作剧广告牌，霓虹粉与电光蓝交织，一群人抬头满脸疑惑地看着，没有品牌徽标](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

从那天下午开始，输入 lenovo.com 的访客并没有进入联想官网。该网站被替换成了一个[青少年坐在电脑前看着网络摄像头的幻灯片](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)，他们表情茫然，甚至带着一丝尴尬，背景音乐播放着《歌舞青春》里的 ["Breaking Free"](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)。The Register 将同一场景描述为[无聊青年的网络摄像头照片幻灯片](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth)，而不是该公司通常展示的产品。

这种刻意的荒诞正是他们的目的所在。这不是一场企图掩人耳目的暗中数据窃取。这是一场公开羞辱，在公司最显眼的网址上演。

攻击者的身份昭然若揭。被替换页面的 HTML 将其“全新升级并重塑品牌”的构建归功于 [Ryan King 和 Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) —— 互联网侦探很快将这两个名字与 Lizard Squad 联系起来，正是这个组织在之前的假期期间让 PlayStation Network 和 Xbox Live 陷入了瘫痪。该组织在 Twitter 上承认了此事，并特意向联想引用了《歌舞青春》的歌词以示嘲讽。

随后，情况变得比单纯的尴尬更加严重。因为攻击者控制了 lenovo.com 的 DNS，他们拥有的不仅仅是网站——他们还掌握了邮件系统。正如一家媒体所言，这次劫持[意味着它还能拦截联想的电子邮件](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)，直到重定向被关闭。Lizard Squad 随后公布了两条在它掌握控制权期间[发送给联想员工](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails)的信息。其中一条带着冷酷的喜剧色彩，[提到一台联想 Yoga 笔记本被“变砖”（完全无法使用）](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked)，原因是客户试图运行联想官方的工具来卸载一款名为 Superfish 的软件。

这个细节用一句话概括了整个事件的动机。

## Superfish 事件背景

要想理解为什么偏偏是联想，你必须将时间倒回五天前。

Superfish 是联想[自 2014 年 9 月起在其部分电脑上捆绑](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014)的一款广告软件。表面上看，它只是一个广告注入器——一种悄悄在你浏览器中塞入额外购物广告的软件。但它的工作原理却是灾难性的。为了将广告注入加密页面，Superfish 安装了自己的根证书，以便能够[甚至在加密页面上引入广告](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages)——换句话说，它破坏了保护 HTTPS 的那把“安全锁”。

更糟糕的是，该证书在每台机器上都使用了相同的私钥，而且这个密钥是可以被破解的。任何提取出该私钥的攻击者，都可以向*任何*运行 Superfish 的联想笔记本电脑伪造*任何* HTTPS 网站。这绝不仅仅是理论上的漏洞。在 [2015 年 2 月 20 日，美国国土安全部建议卸载该软件](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it)及其根证书。

因此，在短短一周的时间里，一家向企业出售安全与信任的公司，先是被曝出其出货的数百万台笔记本电脑内置了中间人攻击漏洞，接着又眼睁睁地看着自家发布的卸载工具让至少一名客户的机器“变砖”。Lizard Squad 的劫持行动被包装成了一场抗议——在 Superfish 引起轩然大波后让他们[尝尝自己的苦果](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=sparked%20online%20uproar%20following%20the%20discovery%20of%20adware%20called%20Superfish)。网络摄像头幻灯片只是一场戏剧。其传递的真正信息是：*你破坏了客户的加密防线，那我们就来砸了你的大门。*

## 事件经过：注册商成了薄弱环节

![生动多彩的数字艺术：一个被劫持的控制面板，带有发光的路由刻度盘和开关，一只阴影之手将品牌的门户和邮件管道重新路由到一条新霓虹灯路径上，电光蓝绿和洋红色，没有品牌徽标](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

这是会让首席信息安全官（CISO）们夜不能寐的部分：联想自己的基础设施从未被攻破。

攻击者的目标实际上是域名注册商。安全分析师将此次劫持追踪到了 **Web Commerce Communications** 的一次系统沦陷——它更为人熟知的名字是 **Webnic.cc**，一家总部位于马来西亚的注册商。正如 Help Net Security 所言，黑客并没有入侵联想的服务器；相反，他们[攻陷了 Web Commerce Communications (Webnic.cc)](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)——托管联想域名的注册商的服务器。

这不是 Webnic 第一次遭遇倒霉的一周。就在两天前，Google 的越南域名也以同样的方式遭到了重定向。SecurityWeek 毫不避讳地总结了这两者的联系：Lizard Squad [在攻破马来西亚注册商 WebNIC 的系统后，劫持了 Google 越南和联想的 DNS 记录](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)。Brian Krebs 援引参与调查的研究人员的话报道称，[这两次劫持之所以能够发生，是因为攻击者夺取了 Webnic.cc 的控制权](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=both%20hijacks%20were%20possible%20because%20the%20attackers%20seized%20control%20over%20Webnic.cc)——根据同一篇报道，这家注册商不仅服务于这两个域名，还服务于其他 60 万个域名。

从 Krebs 的报道来看，其作案手法简直是一部“为什么注册商是一块肥肉”的教科书：

- **入侵途径。** Lizard Squad 利用 [Webnic.cc 中的命令注入漏洞上传了 rootkit（隐匿后门）](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit)——这使他们能够持久且隐蔽地访问注册商的系统。
- **万能钥匙。** 他们还[获取了 Webnic 存储的](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of)“授权码（auth codes）”——即能够将*任何*域名转移到另一家注册商的 EPP 转移机密。
- **重定向。** 凭借注册商级别的控制权，他们更改了 lenovo.com 的名称服务器（nameserver）记录。The Register 指出，该域名的[名称服务器设置今天遭到可疑更新，指向了属于网页托管企业 CloudFlare 的 DNS 服务器](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare)——他们利用 Cloudflare 来掩盖真实的源服务器。
- **拦截邮件。** 最关键的是，他们并没有止步于网站。他们[更改了邮件服务器记录，使他们能够拦截发送给](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)联想地址的邮件。DNS 控制的不仅仅是 `A` 记录，它还控制着 `MX` 记录。拥有域名就意味着拥有邮件系统。

最后一点往往是人们容易遗忘的。网页篡改是高调且显而易见的。而无声的电子邮件拦截才是 DNS 劫持中极其危险的另一半——而且它同样仅仅源于在注册商处更改记录这一简单操作。

## 应对与余波

联想行动迅速，因为除了干预注册商，他们无计可施——修复方案存在于注册商端，而非联想自己的服务器上。该公司证实它已成为[网络攻击的受害者](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)，其结果是联想网站的流量被重定向，并[在 2 月 25 日晚间似乎已恢复了对其公开网站的全面访问](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025)。Cloudflare 发现自己的名字被用在了重定向链中，随后切断了恶意的名称服务器，这也终止了电子邮件的拦截。

更艰巨的清理工作落在了 Webnic 身上。单一注册商的一个命令注入漏洞，在 48 小时内将互联网上最有价值的两个域名——联想的和一个谷歌的资产——交到了一个热衷于搞噱头的黑客团队手中。这次事件成为了注册商风险领域的经典案例研究，同时也敲响了警钟：还有“其他 60 万个域名”隐没在同一个受损系统的背后。

对于联想来说，持久的损害是声誉上的。在 Superfish 事件发酵几天后，这次劫持将一次严重的安全故障变成了一出分为两幕的戏剧：首先是公司破坏了对自身客户的信任，紧接着它在众目睽睽之下失去了对自家名字的控制。人们记住的是网络摄像头幻灯片，但真正关键的却是注册商的沦陷。

## 我们能学到什么：你的注册商才是你真正的安全边界

EP17 带来了一个令人不安的教训：联想在自己控制的部分几乎做对了一切，但仍然由于自己无法控制的部分而遭遇了劫持。

这里有几条远超 2015 年时代局限性的经验教训：

1. **无论你是否重视，注册商始终处于你的信任边界内。** 你可以加固你拥有的每一台服务器，但仍可能在一个你也许从未进行过安全审查的第三方手中丢失域名。攻击者总是选择阻力最小的路径——而注册商通常比你的系统更脆弱。
2. **DNS 控制权就是邮件控制权。** 劫持绝不仅仅是主页被篡改。同样的记录更改会悄无声息地重新路由电子邮件，实现邮件拦截、基于你的域名的密码重置以及身份伪造。应当将 `MX` 记录视为关键的安全资产，而不仅仅是管道。
3. **锁定一切可以锁定的东西。** 注册商锁定（registrar-lock / `clientTransferProhibited`）、限制对 EPP/授权码的访问以及高价值域名的注册局级别锁定，其存在正是为了阻止未经授权的名称服务器更改和转移。这些措施的成本很低。而忽略它们的代价就是你的品牌会沦为网络摄像头幻灯片的笑柄。
4. **DNSSEC 会提高攻击成本。** 尽管它本身无法阻止注册商账户被接管，但签名区域和受监控的 DNS 会让神不知鬼不觉的悄悄篡改变得更加困难。
5. **监控你自己的 DNS 漂移。** 联想的名称服务器变成一家意料之外的提供商就是一个信号。对 NS 和 MX 记录的持续监控，能将“当客户看到幻灯片时我们才发现”转变为“记录发生更改时我们就会收到警报”。

共同的主题是：域名控制权本身就是一个独立的安全领域，而大多数公司却将其外包给了一个从未出现在他们威胁模型中的供应商。

## Namefi 视角

![可验证、防篡改域名所有权的彩色插图——由绿色盾牌、绿色 Namefi 代币和 DNS 连续性保护的域名卡片](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

联想劫持事件的根源，其实是一个控制权与出处（provenance）的问题。攻击者不需要*成为*联想；他们只需要让控制 lenovo.com 的系统相信应该指向新的地方。没有任何强大、独立、可验证的记录来证明谁真正合法地控制该域名——只有一个普通的注册商账户，而这个账户却可以通过联想内部谁也看不到的漏洞被悄然攻破。

[Namefi](https://namefi.io) 的创立理念是，域名应当像互联网原生资产一样，具备可验证、防篡改的所有权。当域名的控制权锚定于可审计且难以被悄悄覆盖的密码学所有权时——而不是依赖具有可恢复授权码的单一注册商账户——未经授权的名称服务器交换将不再是一次安静的后端编辑，而是变成了监管链中显而易见、可证明的断裂。代币化（Tokenized）所有权在保持域名与 DNS 兼容的同时，让“谁控制了这个名字，它刚才发生改变了吗？”这个问题有了可验证的答案。

仅仅在一个下午，Lizard Squad 就通过利用所有权链条中最薄弱的一环，将一家硬件巨头的门户变成了一场恶作剧。防御策略并不在于让网站的声音更大，而在于让名字的*所有权*本身成为攻击者无法悄悄伪造的坚固壁垒。

## 参考资料与延伸阅读

- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- The Register — [Oh No, Lenovo! Lizard Squad on the attack, flashes swiped emails](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/)
- Engadget — [Lenovo's website hijacked, apparently by Lizard Squad](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)
- SecurityWeek — [Lizard Squad Hijacks Lenovo Website, Emails](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- BankInfoSecurity — [Lenovo Website Hijacked](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953)
- IT Security Guru — [Lizard Squad domain hijack gives control of Google Vietnam and Lenovo website](https://www.itsecurityguru.org/2015/02/26/lizard-squad-domain-hijack-gives-control-of-google-vietnam-and-lenovo-website/)
- CNBC — [Lenovo website breached, hacker group Lizard Squad claims responsibility](https://www.cnbc.com/2015/02/25/lenovo-website-breached-hacker-group-lizard-squad-claims-responsibility.html)
- We Live Security (ESET) — [Lenovo website hacked, Lizard Squad claims responsibility](https://www.welivesecurity.com/2015/02/26/lenovo-website-hacked-lizard-squad-claims-responsibility/)
- Computing — [Lenovo website hijacked by Lizard Squad after Superfish debacle](https://www.computing.co.uk/news/2397084/lenovo-website-hijacked-by-lizard-squad-after-superfish-debacle)
- 维基百科 — [Superfish](https://en.wikipedia.org/wiki/Superfish)
- CISA — [Lenovo Superfish Adware Vulnerable to HTTPS Spoofing](https://www.cisa.gov/news-events/alerts/2015/02/20/lenovo-superfish-adware-vulnerable-to-https-spoofing)