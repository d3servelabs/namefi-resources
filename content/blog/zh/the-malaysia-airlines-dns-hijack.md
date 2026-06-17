---
title: '马来西亚航空 DNS 劫持事件：“404 — 找不到飞机”'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2015 年 1 月，“蜥蜴小队”（Lizard Squad）劫持了 malaysiaairlines.com 的 DNS，将该航司网站替换为一只穿着燕尾服的蜥蜴，并留下嘲讽的话语：“404 — 找不到飞机”。没有任何服务器遭到入侵——攻击者只是更改了域名的指向。本期 Domain Mayday 深入探讨 DNS 是如何成为该航司最脆弱前门的。'
keywords: ['马来西亚航空 DNS 劫持', '蜥蜴小队', '网络哈里发', '404 找不到飞机', 'DNS 劫持', '域名劫持', '注册商入侵', 'webnic', 'malaysiaairlines.com', '域名安全', 'DNS 重定向', '注册局锁定', 'mh370']
---

飞机再也没有被找到。2015 年 1 月，这家航空公司的网站也“失踪”了。

2015 年 1 月 26 日上午，任何在浏览器中输入 **malaysiaairlines.com** 的人都没能访问该航空公司的官网，而是被引导到了一个黑客的页面。熟悉的订票页面消失了，取而代之的是一只戴着大礼帽和单片眼镜的蜥蜴图片，以及一行残忍的醒目标题：**“404 — 找不到飞机”（404 — Plane Not Found）**。下方写着：*“被蜥蜴小队黑客入侵——官方网络哈里发（Hacked by Lizard Squad — Official Cyber Caliphate）”*。部分浏览器的标题栏甚至只显示着一句话：*“ISIS 必胜（ISIS will prevail）”*。

这是一个拿坟墓开的恶劣玩笑。就在不到一年前，载有 239 人的马来西亚航空 370 航班从雷达上消失；四个月后，17 航班又在乌克兰上空被击落。而现在，一群青少年将这家航空公司的悲痛变成了一个笑话，挂在了他们自家的“大门”上——甚至都没有碰过他们的服务器。

最后这句话正是整个事件的核心。马来西亚航空并没有遭到大多数人想象中的那种“黑客攻击”。其预订系统完好无损，乘客数据也原封不动。攻击者夺取的其实是更底层的东西，而且事实证明，这也更容易得手：**域名本身**——这个告诉整个互联网“马来西亚航空”在哪里的地址。

本期 Domain Mayday 案例将探讨你基础设施中的这一部分：你平时可能极少关注它，直到有一天它突然指向了别处。

## 一家航空公司，就是它的域名

对于一家全球性航空公司来说，网站可不是什么宣传册。它是收银机、值机台和呼叫中心，所有这一切都系于一串字符：`malaysiaairlines.com`。

每一笔预订、每一次会员登录、每一封确认邮件中的每一个“管理我的航班”链接，都需要通过该域名进行解析。当吉隆坡或伦敦的乘客输入该网址时，一条无形的链条就开始运作：浏览器向域名系统（DNS）询问“malaysiaairlines.com 在哪里？”，DNS 返回一个 IP 地址，然后浏览器建立连接。该航空公司的品牌、收入和客户信任，全赖于这一次查询能够返回*正确*的答案。

DNS 是互联网的通讯录。对大多数组织而言，它也是整栋建筑中最缺乏监控的一扇门。你可以斥资数百万美元来加固服务器、加密数据库并对员工进行反钓鱼培训——但如果有人能悄悄篡改通讯录中告诉你名字指向哪里的那行记录，所有这些努力都将付诸东流。重定向了地址，你就重定向了整个公司，而根本无需闯入大楼内部。

这正是当时发生的事情。

## 劫持：航司官网变蜥蜴

![一张生动多彩的概念艺术图，展示了跑道上发光的 DNS 指路牌被一只看不见的手切换了方向，将源源不断的旅客从登机口引向一堵印有巨大 404 字样的死胡同墙，采用霓虹青色和洋红色](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

页面篡改的操作充满了最大的恶意。那只穿着正装的蜥蜴图像是“蜥蜴小队”（Lizard Squad）的标志；在之前的 12 月假期期间，该组织刚刚让 [Xbox Live 和 Sony PlayStation Network](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month) 陷入瘫痪。到了 1 月，它又给自己披上了“网络哈里发”的外衣，标榜自己与 ISIS 有关，尽管安全研究人员对这一说法深表怀疑。

访问者所看到的网站，[展示了一张戴着大礼帽和单片眼镜的蜥蜴图片，以及“404 - 找不到飞机”的字样](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27)。维基百科对该组织的记载描述了同样的场景：用户 [被重定向到另一个带有穿着燕尾服蜥蜴图像的页面](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard)，并且该页面 [带有标题“404 - 找不到飞机”，这显然是在影射该航空公司前一年失去的 MH370 航班](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year)。

这种残酷并非偶然。MH370 曾于 [2014 年 3 月 8 日从雷达上消失](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014)，机上 239 人最终被推定为全部遇难，飞机残骸至今未能确凿寻获。MH17 则于 [2014 年 7 月 17 日被俄罗斯支持的武装分子使用 Buk 9M38 地对空导弹击落](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014)，机上 298 人全部遇难。在航空公司的主页上印上“找不到飞机”这几个大字，无异于将该公司历史上最糟糕的一年武器化——并向每一个试图访问该网站的客户进行广播。

随之而来的是威胁。该组织 [在推特上表示，“很快就会公布在 www.malaysiaairlines.com 服务器上找到的一些战利品”](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon)，甚至还发布了一张声称显示了乘客行程的截图。对于一家已经在灾难之年中苦苦挣扎的航空公司来说，客户数据遭到泄露的想法无疑是另一种灾难。

## 事件原委：问题出在通讯录，而非大楼

![一张生动多彩的概念艺术图，展示了一位具有未来感的接线员正从正确的插座拔出发光的电缆并将其插入伪造的插座中，跑道上的光流交通被引导至一个冒牌航站楼，采用电蓝色和暖橙色](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

这是事件的技术核心所在，也是为什么这个案例属于域名安全系列，而不是服务器泄露系列的原因。

马来西亚航空自己在各类报道中反复重申的声明，非常准确地区分了这两点：[马来西亚航空确认其域名系统 (DNS) 遭到破坏，当用户输入 www.malaysiaairlines.com 网址时会被重定向到一个黑客网站](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website)。该航空公司坚称其 [网站并未被黑客入侵，这种暂时的故障不会影响其预订业务，且用户数据依然安全](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured)，并补充说其 [网络服务器完好无损](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact)。

这两件事同时成立：网站确实瘫痪了，*而*服务器也的确安然无恙。攻击者根本不需要碰服务器。正如《The Register》所言，[该网站的 DNS 记录遭到了干扰，导致上网者被重定向到了一个由黑客控制的网站](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site)。他们篡改的是通讯录的条目，而不是条目所指向的大楼。甚至他们的恶意也写在了元数据里：当时的一份 Whois 查询显示，[ISIS 必胜（ISIS will prevail）](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail) 被列为了该网站的标题。

那么，这本“通讯录”保存在哪里呢？在域名注册商那里。该航空公司的域名 [似乎是在 Web Commerce Communications Limited（又名 Webnic）注册的，该公司在新加坡、马来西亚和中国均设有办事处](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China)。这个名字很关键，因为 Webnic 即将声名狼藉。

一个月后，同一家注册商卷入了一起规模更大的事件。正如 Brian Krebs 所报道的，攻击者 [控制了为这两个域名以及其它 60 万个域名提供服务的马来西亚注册商 Webnic.cc](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others)，然后 [利用他们在 Webnic.cc 的访问权限篡改了域名系统 (DNS) 记录](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records)，这次受害的是 **联想（Lenovo）** 和 **Google 越南（Google Vietnam）**。Krebs 报道称，攻击机制是利用 [Webnic.cc 中的命令注入漏洞上传了 rootkit 恶意软件](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit)——从而获得了对控制数十万个域名指向的核心系统的持久访问权限。

你不需要为了重定向 google.com.vn 去入侵 Google。你也不需要为了重定向一家航空公司的首页去入侵它。你只需要攻陷那个*掌握着*“这个域名在哪里”*答案*的层级——注册商账户以及其背后的 DNS 记录。而这个层级，却恰恰位于大多数公司真正防御的安全边界之外。

## 影响与响应

对于该航空公司而言，这次事件造成的损失主要在声誉和运营方面，而非数据窃取。试图预订或值机的客户遭遇了页面被篡改的情况。全球各大媒体的头条将“马来西亚航空”与“被黑客入侵”联系在一起——一个本已陷入危机的品牌，现在又和一只拿其失踪航班开恶劣玩笑的蜥蜴扯上了关系。

航空公司采取了唯一能够遏制 DNS 劫持的方法来控制局面：通过被攻陷的层级进行修复。它表示 [已经与其服务提供商一起解决了该问题](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider)，并且 [系统预计将在 22 小时内完全恢复](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours)。这个时间表本身就暴露了 DNS 的一个特点：即使你修复了记录，错误的答案仍然会在世界各地的缓存中残留，直到它们过期。DNS 劫持发起很快，但要完全消除影响却很慢。

面对黑客泄露数据的威胁，该航空公司坚守立场——预订系统未受影响，用户数据依然安全——而该组织吹嘘的灾难性泄露也从未发生过。然而，“我们并没有真正遭到入侵，攻击者只是在大半天的时间里控制了我们的整个公共身份”，这种解释很难让公众旅客买账。对于一个盯着“404 — 找不到飞机”屏幕的客户来说，服务器入侵和 DNS 劫持之间的区别是不可见的。网站就代表了航空公司。而那一天，这家航空公司的网站属于了别人。

## 以 DNS 作为前门的启示

马来西亚航空劫持事件是一个教科书般的教训，恰恰是因为在传统意义上*没有任何东西被入侵*。这些经验教训几乎适用于所有在线组织：

1. **你的域名是一个你无法独自控制的单点故障。** 注册商掌握着你的域名指向哪里的主记录。如果他们的账户安全——或是软件——出现漏洞，那么你完美加固的服务器也就毫无用处了。Webnic 在一个月内两次证明了这一点，先是马来西亚航空，然后是 Google 和联想。

2. **DNS 劫持不需要入侵你的系统。** 攻击者重定向的是通讯录，而不是大楼。只监视服务器、代码和网络的防御措施，往往会漏掉完全发生在域名解析层的攻击。

3. **锁定那些能转移你域名的记录。** 注册局锁定（Registry Lock）和注册商级别的锁定，其存在的目的就是为了阻止对 DNS 和域名服务器记录进行未经授权的更改——在任何人可以重新指向你的域名之前，它们会添加一个手动的、带外验证（out-of-band）的步骤。对于高价值域名来说，这些锁定措施绝不是可选项。

4. **在注册商处启用 DNSSEC 和 2FA。** 注册商账户的强身份验证以及区域的 DNSSEC 签名，将大大提高像篡改马来西亚航空记录那样悄无声息的域名替换的成本。

5. **恢复速度总是慢于攻击速度。** TTL（生存时间）和全球缓存意味着劫持的影响会比修复操作存活得更久。在规划时不仅要考虑修补的时间，还要把清理缓存的窗口期计划在内。

一个令人不安的总结是：大多数公司严防死守整栋大楼，却只在大门上贴了一张便利贴，告诉所有人应该走进哪栋大楼。只要换掉这张便利贴，你就搬走了整个公司。

## Namefi 的视角

![一张彩色插图，展示了可验证的、防篡改的域名所有权——由一个绿色盾牌、一个绿色的 Namefi 代币以及 DNS 连续性来保障的一张域名卡](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

马来西亚航空劫持事件的核心问题是：*谁有权更改域名指向？* 以及这种权力在注册商层面有多容易被悄悄窃取。这次攻击并没有击败密码学或破解数据库。它击败的是那些基于账户的软控制平面，而这个平面却决定了域名最关键的信息：它解析到哪里。

[Namefi](https://namefi.io) 的构建理念在于，域名的所有权和控制权应该表现为一种可验证的、互联网原生的资产，而不是注册商数据库中的一个可以被受损账户轻易重写的数据行。代币化的所有权使得“谁控制这个域名？控制权刚刚发生转移了吗？”这些问题变得可审计且防篡改，同时还能保持与 DNS 的兼容性。防御劫持的手段不仅是使用更强壮的密码——更是要让未经授权的更改变得*清晰可见且可被证明*，而不是悄无声息。

马来西亚航空从未失去其服务器。但有一整天的时间，它失去了对一个简单问题的答案的控制权——*这个名字指向哪里？* 飞机再也没有被找到。这家网站也同样不该“失踪”。Domain Mayday 带给我们的教训是，通讯录本身也是安全边界的一部分，一旦你忘记了这一点，也就是一只戴着大礼帽的蜥蜴堂而皇之进驻你家大门的时候。

## 参考资料与延伸阅读

- TechCrunch — [Malaysia Airlines Site Hacked By Lizard Squad](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/)
- The Register — [Lizard Squad threatens Malaysia Airlines with data dump](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/)
- BankInfoSecurity — [Malaysia Airlines Website Hacked](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833)
- Computerworld — [Malaysia Airlines claim DNS hijacked, site not hacked, but attackers threaten data dump](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html)
- Infosecurity Magazine — [Malaysia Airlines Site Back Up as Hackers Threaten Data Dump](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/)
- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- ABC News — [Malaysia Airlines Hit by Lizard Squad Hack Attack](https://abcnews.go.com/Technology/malaysia-airlines-hit-lizard-squad-hack-attack/story?id=28489244)
- NBC News — [Lizard Squad Claims It Hacked Malaysia Airlines Website](https://www.nbcnews.com/storyline/isis-terror/lizard-squad-claims-it-hacked-malaysia-airlines-website-n293461)
- IT Security Guru — [Lizard Squad hijacks Malaysia Airline DNS](https://www.itsecurityguru.org/2015/01/26/lizard-squad-hijacks-malaysia-airline-dns/)
- Wikipedia — [Lizard Squad](https://en.wikipedia.org/wiki/Lizard_Squad)
- Wikipedia — [Malaysia Airlines Flight 370](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370)
- Wikipedia — [Malaysia Airlines Flight 17](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17)