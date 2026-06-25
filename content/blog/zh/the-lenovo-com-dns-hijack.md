---
title: 'Lenovo.com DNS 劫持事件：当蜥蜴小队夺走这家硬件巨头的大门'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2015年2月25日，Lizard Squad（蜥蜴小队）通过入侵注册商 Webnic，劫持了 Lenovo.com，将全球最大PC制造商的域名重定向到一段网络摄像头幻灯片，并拦截其邮件——此事发生在 Superfish 丑闻曝光后的数天之内。这是一篇关于注册商才是真正安全边界的深度解析。'
keywords: ['lenovo.com DNS劫持', '蜥蜴小队', 'Lizard Squad', 'webnic注册商', 'Web Commerce Communications', 'DNS劫持', 'Superfish', '域名注册商安全', '注册商入侵', 'EPP授权码', '邮件拦截', '谷歌越南域名劫持', '域名安全', '注册商锁定']
---

2015年2月25日上午，全球最大PC制造商点击量最高的链接，指向了一段无聊青少年对着摄像头发呆的幻灯片，配乐来自《歌舞青春》中的歌曲。没有人入侵了联想的任何一台服务器，没有人盗取了任何联想密码，攻击者从未触碰联想的建筑、网络或网站本身。

他们只是在该公司的域名注册商处修改了一条记录——这就足以夺走联想的"前门"，重定向其邮件，并让这个品牌在一个下午沦为笑柄。

这是 **Domain Mayday 第17期**：Lenovo.com [DNS 劫持](/zh/glossary/dns-hijacking/)事件。从数字上看，这是一个小故事——仅有几个小时的停机，没有生产系统被攻破，没有客户数据库泄露。但它是迄今为止最清晰地演示了一个大多数公司至今仍未认清的教训：你的域名安全，取决于持有它的注册商；而那家注册商，几乎从未被纳入你的安全体系之中。

## 一家以域名为颜面的硬件巨头

2015年时，联想已是[全球最大的PC制造商](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer)，出货量超过全球任何一家同行。对于这种规模的公司而言，lenovo.com 不是一项营销资产，它是整个运营的核心基础设施：客户在这里购买产品，支持工单在这里落地，保修注册通过这里流转，而且——至关重要的是——它是公司每一个 `@lenovo.com` 邮件地址背后的域名。

当一个品牌达到这种规模，域名就不再是一个网站地址，而成为基础设施。每一篇新闻稿、每一个零售包装盒、每位员工的邮件签名、每一封订单确认函，都通过它流转。这意味着，谁控制了域名的 DNS，谁就不仅控制了网站，更控制了 lenovo.com 所指向的*真相*——对浏览器和邮件服务器皆然。

这就是蜥蜴小队的目标。不是网站本身，而是指向它的那个指针。

## 2015年2月25日：诡异的重定向

![一幅色彩鲜艳的概念艺术：一栋企业玻璃店面的发光招牌在一夜之间被换成了一块恶作剧广告牌，霓虹粉和电光蓝交织，人群仰头驻足，无任何品牌标志](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

那天下午开始，输入 lenovo.com 的访客并未抵达联想。该网站被替换成了一段[孩子们坐在电脑前对着摄像头发呆的幻灯片](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)，表情空洞而略显尴尬，配着《歌舞青春》中的["Breaking Free"](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)。《The Register》将其描述为[一段无聊青年网络摄像头照片的幻灯片](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth)，取代了公司正常展示的产品页面。

这种荒诞是刻意为之，而荒诞本身就是目的。这不是一场意图隐秘的数据窃取，而是一场公开的羞辱，在该公司最显眼的 URL 上公然上演。

幕后主使就藏在明处。替换页面的 HTML 将其"全新升级品牌重塑"版本署名给了 [Ryan King 和 Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)——两个被网络侦探迅速认出的名字，与蜥蜴小队有关。这支队伍曾在上一个假日季接连击垮 PlayStation Network 和 Xbox Live。该组织随后在 Twitter 上认领了这次攻击，还顺便把《歌舞青春》的歌词甩给了联想。

然后事态变得比尴尬更糟。由于攻击者控制了 lenovo.com 的 DNS，他们不仅拥有了网站，更拥有了邮件。正如一家媒体所述，此次劫持[意味着攻击者能够拦截联想的电子邮件](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)，直到重定向被关闭。蜥蜴小队随后公布了控制期间[发送给联想员工的两封邮件](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails)。其中一封，以近乎黑色幽默的时机，[提到了一台联想 Yoga 笔记本在用户尝试运行联想自己的工具卸载 Superfish 软件时"变砖"](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked)的遭遇。

这一细节，在一句话里道出了整个动机。

## Superfish 事件的背景

要理解为什么偏偏是联想，需要时间回拨五天。

Superfish 是联想[自2014年9月起随部分电脑预装的广告软件](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014)。表面上，它只是一个广告注入器——在浏览器中插入额外购物广告的软件。但其工作方式极具破坏性。为了向加密页面注入广告，Superfish 安装了自己的根证书，以便[向加密页面也注入广告](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages)——换言之，它破坏了保护 HTTPS 的"绿锁"。

更糟糕的是，该证书在每台机器上使用同一个私钥，而这个密钥是可破解的。任何攻击者一旦提取它，就能对任何运行 Superfish 的联想笔记本冒充*任意* HTTPS 网站。这不是理论上的漏洞。[2015年2月20日，美国国土安全部发出建议，要求卸载该软件](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it)及其根证书。

于是，在短短一周内，一家向企业售卖安全与信任的公司，先是向数百万台笔记本预装了内置中间人攻击漏洞的软件，然后看着自己的卸载工具让至少一位客户的设备变砖。蜥蜴小队的劫持行动被包装成一次抗议——在 Superfish 风波后的[以彼之道还施彼身](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=sparked%20online%20uproar%20following%20the%20discovery%20of%20adware%20called%20Superfish)。网络摄像头幻灯片是一场表演，传递的信息是：*你破坏了用户的加密，所以我们替你破开你自己的大门。*

## 事件经过：注册商才是薄弱环节

![一幅色彩鲜艳的概念艺术：一个被劫持的控制面板，发光的路由旋钮和开关，一双阴影中的手将品牌的大门和邮件管道重新导向一条霓虹铺就的新路径，电青色与洋红交织，无任何品牌标志](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

以下这部分，应该让所有 CISO 夜不能寐：联想自身的基础设施从未被攻破。

攻击者将目标对准了注册商。安全分析人士追溯发现，此次劫持源于**Web Commerce Communications**（即广为人知的 **Webnic.cc**，一家马来西亚注册商）遭到入侵。Help Net Security 指出，黑客并非攻击联想的服务器，而是[入侵了 Web Commerce Communications（Webnic.cc）的系统](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)——联想域名正是在该注册商处注册的。

这并非 Webnic 第一次遭遇麻烦。就在两天前，谷歌越南域名也以同样的方式遭到重定向。SecurityWeek 直截了当地点明了关联：蜥蜴小队在[入侵马来西亚注册商 WebNIC 的系统后，劫持了谷歌越南和联想的 DNS 记录](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)。Brian Krebs 援引调查人员的说法报道称，[两次劫持之所以成功，是因为攻击者控制了 Webnic.cc](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=both%20hijacks%20were%20possible%20because%20the%20attackers%20seized%20control%20over%20Webnic.cc)——据同一报道，这家注册商托管了上述两个域名以及另外60万个域名。

Krebs 的报道还原了攻击机制，读来如同一份说明注册商为何是高价值目标的教科书：

- **入侵路径。** 蜥蜴小队利用 [Webnic.cc 中的命令注入漏洞上传了一个 rootkit](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit)——从而获得了对注册商系统的持久性隐蔽访问权限。
- **万能钥匙。** 他们还[获取了 Webnic 存储的](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of)"授权码"——即 EPP 转移密钥，可将*任何*域名转移至其他注册商。
- **重定向。** 掌握注册商级别的控制权后，他们修改了 lenovo.com 的[域名服务器](/zh/glossary/nameserver/)记录。《The Register》指出，该域名的[域名服务器设置被可疑地更新，指向了属于虚拟主机服务商 Cloudflare 的 DNS 服务器](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare)——借 Cloudflare 掩盖真实目标服务器。
- **邮件劫持。** 关键在于，他们没有止步于网站。他们[修改了邮件服务器记录，从而能够拦截](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)发送给联想地址的邮件。DNS 不仅控制 `A` 记录，还控制 `MX` 记录。控制域名，就等于控制邮件。

最后这一点常被人忽视。网页篡改是高调且显眼的。而无声的邮件拦截，才是 DNS 劫持中真正危险的那一半——而它只需一次修改注册商记录的动作便可实现。

## 响应与后续

联想迅速行动，因为它也没有太多其他选择——修复措施在注册商那里，而不在自己的服务器上。公司确认自己[遭受了网络攻击](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)，攻击效果是将 Lenovo 网站的流量重定向，而公司[似乎在2月25日傍晚恢复了对官网的完整访问](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025)。Cloudflare 发现自己的名字出现在重定向链中后，切断了恶意域名服务器，这也同时终止了邮件拦截。

更大范围的善后工作落在了 Webnic 身上。一家注册商的命令注入漏洞，在48小时内让互联网上两个最有价值的域名——联想的和谷歌的——落入一支以恶作剧为乐的黑客队伍手中。此次事件成为注册商风险的标志性案例，也提醒世人，"另外60万个域名"背后是同一套已被攻破的系统。

对联想而言，持久的损害是声誉层面的。在 Superfish 事件之后紧接着发生的这次劫持，将一场严重的安全失误变成了两幕剧：第一幕，公司辜负了用户的信任；第二幕，公司明显失去了对自己名字的掌控。人们记住的是那段网络摄像头幻灯片，但真正重要的，是注册商遭到入侵这件事本身。

## 本次事件的教训：注册商才是你真正的安全边界

第17期带来的令人不安的教训是：联想在自己能控制的部分上做得相当不错，却依然被一个它无法控制的环节所劫持。

以下几点启示，远不止适用于2015年：

1. **无论你是否这样对待，注册商都在你的信任边界之内。** 你可以加固自己拥有的每台服务器，却依然在一家从未经过安全审查的第三方那里丢失域名。攻击者选择阻力最小的路径——而注册商往往比你本身软得多。
2. **DNS 控制即邮件控制。** 劫持不只是一个被篡改的主页。同样的记录修改会悄悄重定向邮件，使拦截、针对你域名的密码重置和身份冒充成为可能。要将 `MX` 记录视为安全关键资产，而非管道基础设施。
3. **能锁的就锁上。** 注册商锁定（registrar-lock / `clientTransferProhibited`）、对 EPP/授权码的限制访问，以及针对高价值域名的注册局级别锁定，存在的意义就是阻止未经授权的域名服务器变更和转移。这些措施成本极低。跳过它们的代价，就是让你的品牌出现在别人的网络摄像头幻灯片上。
4. **[DNSSEC](/zh/glossary/dnssec/) 提高了攻击成本。** 它本身无法阻止注册商账户被接管，但已签名的区域和受监控的 DNS 会让无声篡改更难在不被察觉的情况下得手。
5. **监控自己的 DNS 是否发生偏移。** 联想的域名服务器切换到陌生提供商，就是明显的异常信号。对 NS 和 MX 记录进行持续监控，能将"我们在客户看到幻灯片时才知道"变成"记录一变动我们就收到告警"。

共同的主题：域名控制是一个独立的安全域，而大多数公司已将其外包给了一个从未出现在其威胁模型中的供应商。

## Namefi 的视角

![一幅彩色插画：可验证、防篡改的域名所有权——一张受绿色盾牌保护的域名卡片、一枚绿色 Namefi 代币，以及 DNS 连续性](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

联想劫持事件，从根本上说是一个控制权与归属证明的问题。攻击者不需要*成为*联想；他们只需要说服控制 lenovo.com 的系统，让它把指针指向别处。当时没有一份强大、独立、可验证的记录来证明谁合法地控制着这个域名——只有一个可以被某个联想员工永远无法看见的漏洞悄悄攻破的注册商账户。

[Namefi](https://namefi.io) 的核心理念是：域名应当像[互联网原生资产](/zh/glossary/internet-native-asset/)一样，具备可验证、防篡改的所有权。当域名的控制权锚定于可审计、难以被静默覆盖的加密所有权——而非一个拥有可恢复授权码的单一注册商账户——未经授权的域名服务器替换就不再是一次悄悄的后台编辑，而会成为一次可见、可证明的链条断裂。代币化所有权使域名在保持与 DNS 兼容的同时，让"谁控制这个名字，以及这是否刚刚发生了变化"成为一个有据可查、答案可验证的问题。

蜥蜴小队在一个下午内，通过利用所有权链条中最薄弱的一环，将一家硬件巨头的大门变成了一场恶作剧。防御之道不是喊出更响亮的网站。而是让这个名字的*所有权本身*变成一种攻击者无法悄悄伪造的东西。

## 参考来源与延伸阅读

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
- Wikipedia — [Superfish](https://en.wikipedia.org/wiki/Superfish)
- CISA — [Lenovo Superfish Adware Vulnerable to HTTPS Spoofing](https://www.cisa.gov/news-events/alerts/2015/02/20/lenovo-superfish-adware-vulnerable-to-https-spoofing)
