---
title: '马来西亚航空 DNS 劫持事件："404 — 飞机未找到"'
date: '2026-06-17'
language: zh-CN
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2015 年 1 月，Lizard Squad 劫持了 malaysiaairlines.com 的 DNS，将航空公司官网替换为一只身着燕尾服的蜥蜴图片，并配以嘲讽文字"404 — 飞机未找到"。整个攻击过程中，攻击者没有入侵任何服务器——他们只是修改了域名的指向。这是一次深度剖析 DNS 如何成为该航空公司最脆弱入口的"域名紧急事件"案例。'
keywords: ['马来西亚航空 DNS 劫持', 'Lizard Squad', '网络哈里发', '404 飞机未找到', 'DNS 劫持', '域名劫持', '注册商入侵', 'Webnic', 'malaysiaairlines.com', '域名安全', 'DNS 重定向', '注册表锁定', 'MH370']
relatedArticles:
  - /zh-CN/blog/the-lenovo-com-dns-hijack/
  - /zh-CN/blog/the-curve-finance-dns-hijack/
  - /zh-CN/blog/the-godaddy-multi-year-breach/
  - /zh-CN/blog/the-bitcoin-org-dns-hijack/
  - /zh-CN/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/name-change-game-change/
relatedGlossary:
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/tld/
---

飞机从未被找到。2015 年 1 月，那个网站也消失了。

2015 年 1 月 26 日上午，任何在浏览器中输入 **malaysiaairlines.com** 的人，都没有到达这家航空公司的官网——他们到达的是一名黑客的页面。熟悉的订票页面消失了，取而代之的是一张头戴大礼帽、手持单片眼镜的蜥蜴图片，以及一行残忍的标题：**"404 — 飞机未找到。"** 下方还有：*"由 Lizard Squad — 官方网络哈里发入侵。"* 一个浏览器标签栏上简单写道：*"ISIS 将会胜利。"*

这是一个把坟场当成玩笑的恶作剧。不到一年前，马来西亚航空 MH370 航班带着 239 名乘客从雷达上消失。四个月后，MH17 航班在乌克兰上空被击落。现在，一群青少年把这家航空公司最沉重的悲剧变成了落在它自家门口的一个嘲讽——而且他们从未触碰过任何服务器。

最后这一点才是整个故事的关键。马来西亚航空并非以大多数人想象的方式被"黑客攻击"。其订票系统完好无损，旅客数据毫发未损。攻击者夺取的是一个更为根本、也更容易得手的东西：**域名本身**——那个告诉整个互联网"马来西亚航空"在哪里的地址。

这是一个关于基础设施中那个你可能从未想过、直到它指向别处才会注意到的部分的"域名紧急事件"案例。

## 航空公司就是它的域名

对于一家全球承运商来说，官网不是一本宣传册，而是收银台、值机柜台和客服中心——全部绑定在一串文字上：`malaysiaairlines.com`。

每一次订票、每一次常旅客登录、每一封确认邮件中的"管理我的航班"链接，都要通过这个域名解析。当吉隆坡或伦敦的乘客在浏览器中输入它时，一条看不见的链条开始运作：浏览器向[域名系统](/zh-CN/glossary/dns/)（DNS）询问"malaysiaairlines.com 在哪里？"，DNS 以 [IP 地址](/zh-CN/glossary/ip-address/)作答，浏览器随即建立连接。航空公司的品牌、收入以及客户的信任，都依赖于这一次查询返回*正确*的答案。

DNS 是互联网的地址簿。对大多数组织而言，它也是大楼里最少有人看管的那扇门。你可以花费数百万加固服务器、加密数据库、对员工进行防钓鱼培训——但如果有人能悄悄修改地址簿中指向你名字的那一行，这一切都无济于事。重定向了地址，就等于重定向了整个公司，而无需撬开任何一扇门。

这正是所发生的事情。

## 劫持：蜥蜴占领了原属于航空公司的地方

![一幅色彩鲜艳的概念艺术图：跑道上一个发光的 DNS 路标被一双无形的手切换方向，将一股旅客流从登机口引向贴着巨大"404"字样的死胡同，霓虹青绿色和品红色交织](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

这次涂改的设计极尽残忍之能事。身着正装的蜥蜴图片是 Lizard Squad 的标志性符号；这个组织在前一年 12 月的假日期间曾将 [Xbox Live 和索尼 PlayStation 网络](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month)下线。到了 1 月，他们又披上了"网络哈里发"的外衣，摆出与 ISIS 结盟的姿态，尽管研究人员对此深表质疑。

访问者看到的网站，[展示了一张头戴大礼帽、手持单片眼镜的蜥蜴图片，以及文字"404-飞机未找到"](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27)。维基百科对该组织的记载也描述了同样的场景：用户[被重定向到另一个展示身着燕尾服的蜥蜴图片的页面](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard)，该页面[以"404 - 飞机未找到"为标题，明显影射该航空公司前一年失踪的 MH370 航班](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year)。

残忍，正是目的所在。MH370 [于 2014 年 3 月 8 日从雷达上消失](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014)，机上 239 人最终被推定罹难，残骸至今未被确切找到。MH17 [于 2014 年 7 月 17 日被俄罗斯支持的武装力量用 Buk 9M38 地对空导弹击落](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014)，机上 298 人全部遇难。在这家航空公司的主页上打上"飞机未找到"，就是把公司历史上最惨烈的一年当作武器，并将其广播给每一个试图访问该网站的客户。

随后又来了威胁。该组织[发推称将"很快公开在 www.malaysiaairlines.com 服务器上找到的战利品"](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon)，甚至发布了一张据称显示旅客行程的截图。对于一家早已在灾难年中挣扎求生的航空公司而言，客户数据可能泄露的传言本身就是另一场灾难。

## 事件经过：动的是地址簿，而非建筑本身

![一幅色彩鲜艳的概念艺术图：一名未来主义的总机操作员将一根发光的电缆从正确的插孔拔出，插入一个冒充插孔，光流量从跑道偏向一个冒牌航站楼，电蓝色与暖橙色交相辉映](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

以下是技术核心，也是这个案例属于域名安全系列而非服务器入侵系列的原因。

马来西亚航空的官方声明在各路报道中被反复引用，措辞精准地划定了界限：[马来西亚航空确认其域名系统（DNS）已遭入侵，当用户在浏览器中输入 www.malaysiaairlines.com 时，将被重定向至一个黑客网站](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website)。该航空公司坚称其[网站未被黑客攻击，此次临时故障不影响其订票，用户数据依然安全](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured)，并补充称其[网络服务器完好无损](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact)。

两件事同时成立：网站被破坏，*而且*服务器完好无损。攻击者根本不需要服务器。正如 The Register 所描述的，[该网站的 DNS 记录遭到篡改，导致访客被重定向至一个由黑客控制的网站](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site)。他们修改的是地址簿条目，而非它所指向的建筑。就连恶意内容也被写入了元数据：当时的 [Whois](/zh-CN/glossary/whois/) 查询显示，该网站的标题字段写着[ISIS 将会胜利](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail)。

那本地址簿放在哪里？放在[注册商](/zh-CN/glossary/registrar/)那里。该航空公司的域名[似乎在 Web Commerce Communications Limited（即 Webnic）处注册，该公司在新加坡、马来西亚和中国设有办事处](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China)。这个名字很重要，因为 Webnic 即将声名狼藉。

一个月后，同一家注册商成为一起更大规模事件的主角。据 Brian Krebs 报道，攻击者[控制了 Webnic.cc——这家为该域名及其他 60 万个域名提供服务的马来西亚注册商](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others)，随后[利用其在 Webnic.cc 的访问权限，篡改了域名系统（DNS）记录](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records)，受害者包括**联想**和**谷歌越南**。Krebs 报道称，攻击手段是利用[Webnic.cc 的命令注入漏洞上传了一个 rootkit](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit)——从而对控制数十万个域名指向的那个系统获得了持久访问权。

你不需要入侵谷歌就能重定向 google.com.vn。你不需要入侵一家航空公司就能重定向它的主页。你只需要攻破那个*掌握着"这个域名在哪里"这一问题答案*的层级——注册商账户及其背后的 DNS 记录。而这个层级，恰恰在大多数公司真正设防的安全边界之外。

## 影响与应对

对于这家航空公司而言，损失主要体现在声誉和运营层面，而非数据失窃。试图订票或办理值机的客户碰壁而归。全球媒体的头条将"马来西亚航空"与"被黑"联系在一起——这个本已深陷危机的品牌，又与一只嘲讽失联航班的蜥蜴挂上了钩。

该航空公司采取了处置 DNS 劫持唯一可行的方式来控制局面：通过被攻破的那个层级进行修复。它表示已[与服务提供商解决了这一问题](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider)，[系统预计将在 22 小时内完全恢复](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours)。这个时间窗口本身就是 DNS 的一个特征：即使你修复了记录，错误的答案仍会在全球各地的缓存中滞留，直到 TTL 过期。劫持发动得快，完全消除却很慢。

在数据泄露威胁方面，该航空公司守住了立场——订票未受影响，用户数据安全——该组织吹嘘的灾难性数据泄露最终并未如所描述的那样发生。但"我们没有真正被入侵，攻击者只是在将近一天的时间里掌控了我们的全部公开身份"，这样的信息很难让出行的旅客信服。对于一个盯着"404 — 飞机未找到"的客户来说，服务器入侵与 DNS 劫持之间的区别根本看不见。网站就是这家航空公司。而有一天，这个网站属于别人。

## 这次事件教给我们的：DNS 就是你的前门

马来西亚航空劫持案是一堂教科书式的课，恰恰因为*没有任何东西在传统意义上被攻破*。其启示几乎适用于所有在线组织：

1. **你的域名是一个你无法单独掌控的单点故障。** 注册商保存着你名字指向何处的主记录。如果他们的账户安全——或者他们的软件——出了问题，你精心加固的服务器就毫无意义。Webnic 在一个月内用一家航空公司、谷歌和联想的案例证明了这一点。

2. **DNS 劫持不需要入侵你自己的系统。** 攻击者重定向的是地址簿，而非建筑本身。那些监视你的服务器、代码和网络的防御措施，可能完全错过一次发生在命名层的攻击。

3. **锁定那些可以移动你名字的记录。** 注册表锁（Registry Lock）和注册商级别的锁正是为此而生——阻止对 DNS 和[域名服务器](/zh-CN/glossary/nameserver/)记录的未授权更改，在任何人可以重新指向你的域名之前，增加一个人工的带外验证步骤。对于高价值域名而言，这不是可选项。

4. **在注册商层面使用 [DNSSEC](/zh-CN/glossary/dnssec/) 和双因素认证。** 注册商账户的强身份验证和区域的 DNSSEC 签名，会大幅提高那种悄悄置换记录——正是涂改马来西亚航空网站的手段——的攻击成本。

5. **恢复比攻击更慢。** TTL 和全球缓存意味着劫持的影响会超过修复本身。要为清理窗口做好规划，而不仅仅是修补漏洞。

令人不安的总结是：大多数公司守卫的是建筑，却在前门贴了张便利贴，告诉所有人该走进哪栋楼。改掉那张便利贴，公司就被移走了。

## Namefi 的视角

![一幅彩色插图，展示可验证、防篡改的域名所有权——一张受绿色盾牌保护的域名卡片、一枚绿色 Namefi 代币，以及持续的 DNS 连接](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

马来西亚航空劫持事件，其核心是一个关于*谁有权修改名字指向何处*的问题——以及这种权限在注册商层面有多容易被悄然窃取。这次攻击没有破解任何密码学机制，也没有攻破任何数据库。它攻破的是那个柔软的、基于账户的控制平面——正是它决定了一个域名最重要的事实：解析到哪里。

[Namefi](https://namefi.io) 的构建理念是：域名的所有权和控制权应当像一种可验证的、互联网原生的资产那样运作，而非注册商数据库中那条任何一个被攻破的账户都能改写的记录。代币化所有权使"谁控制着这个域名，以及这种控制权是否刚刚易手"这一问题变得可审计、可溯源，同时与 DNS 保持兼容。对抗劫持的防御，不仅仅是更强的密码——而是让未授权的更改变得*可见、可证明*，而非悄无声息。

马来西亚航空从未失去它的服务器。它失去的是一个问题的答案——*这个名字指向哪里？*——大约持续了一天。飞机从未被找到。网站本也不应该丢失。"域名紧急事件"系列留给我们的教训是：地址簿是安全边界的一部分，而你忘记这一点的那天，就是一只头戴大礼帽的蜥蜴搬进你前门的那天。

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
