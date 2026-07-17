---
title: 'MyEtherWallet BGP + DNS 攻击：路由劫持如何盗走 15 万美元以太币'
date: '2026-06-17'
language: zh-CN
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
description: '2018 年 4 月 24 日，攻击者劫持了 Amazon Route 53 的互联网路由，篡改了 myetherwallet.com 的 DNS 应答，并在自签名证书背后架设了一个钓鱼克隆站，最终盗走约 15 万美元的以太币。这是一篇"域名告急"深度分析文章，探讨为何 DNS 依托于一个默认信任的路由层之上。'
keywords: ['myetherwallet', 'bgp 劫持', 'dns 劫持', 'amazon route 53', 'route 53 劫持', 'dns 安全', 'bgp 路由安全', '以太坊钓鱼', '自签名证书', 'enet as10297', 'rpki roa', '加密钱包钓鱼', '域名安全']
relatedArticles:
  - /zh-CN/blog/the-fox-it-dns-hijack/
  - /zh-CN/blog/the-curve-finance-dns-hijack/
  - /zh-CN/blog/the-bitcoin-org-dns-hijack/
  - /zh-CN/blog/the-godaddy-multi-year-breach/
  - /zh-CN/blog/the-dnspionage-campaign/
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
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/web3/
---

当你在浏览器中输入一个网站名称时，你正在信任两个看不见的系统对你诚实。

第一个是 **DNS**——互联网的电话簿——它将 `myetherwallet.com` 这样的名称转换为数字 [IP 地址](/zh-CN/glossary/ip-address/)。第二个是 **BGP**（边界网关协议），它决定你的数据包通过哪条物理路径到达该地址。几乎没有人会去想这两个系统。它们每天无声地运转数十亿次。

**2018 年 4 月 24 日**上午，这两个系统同时撒了谎。大约两个小时内，任何输入 `myetherwallet.com` 并点击略过一条浏览器警告的用户，都被引导到一个钓鱼克隆站，而那个站点运行在一台远离他们预期目标的服务器上。路由被纠正之时，攻击者已从真实用户的[钱包](/zh-CN/glossary/wallet/)中盗走了约 **15 万美元的以太币**。

这一事件之所以成为安全教学中的经典案例，并非因为金额——此后的加密货币盗窃早已使其相形见绌。关键在于*攻击机制*。攻击者从未入侵 MyEtherWallet 的服务器，也从未猜测任何密码。他们攻击的是**道路**，而非建筑——通过劫持互联网路由层来毒化 DNS 本身。

## DNS 依托于一个默认信任的路由层

要理解发生了什么，必须先了解地球上每个域名之下那个令人不安的基础。

DNS 回答的问题是"`myetherwallet.com` 的 IP 地址是什么？"但你的 DNS 查询要到达正确的服务器，互联网路由器必须知道*哪个网络*拥有该 DNS 服务器的 IP 地址——为了找到答案，它们依赖 BGP。

问题就在这里。BGP 在设计上是一个基于信任的系统。正如维基百科上 Cloudflare 风格的摘要所述，[BGP 协议默认设计为信任对等方发送的所有路由通告](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers)。安全研究员 Bob Cromwell 对其初衷的描述更加直白：[BGP 被设计为善意的 ISP 和大学之间的信任链，它们盲目相信所收到的信息](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust)。

换句话说：当一个网络运营商站出来向全世界宣布"前往*这些* IP 地址的流量应该经过*我*"时，其余互联网在历史上只是选择相信它。BGP 内置了一个更具体路由优先规则——如果两个网络声称拥有相同地址，宣告*更窄*、更具体地址块的一方胜出。攻击者利用的正是这个规则。

因此，任何域名的攻击面都大于其[注册商](/zh-CN/glossary/registrar/)、大于其 DNS 提供商、也大于其 Web 主机。它涵盖了将你的 DNS 查询送达正确位置的整个全球路由结构。MyEtherWallet 以惨痛的代价明白了这一点。

## 2018 年 4 月 24 日用户的损失

![互联网流量沿发光数据高速公路流动的生动彩色概念艺术，突然被一个伪造的绕行标志改道，通往一条通向冒名建筑的假路，光的数据包散落进陷阱](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

损失集中在大约两个小时的窗口期内。据 The Register 报道，恶意路由在当天 [UTC 时间上午 11 点至下午 1 点之间](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC)运行。在这段时间内，所有尝试访问 `myetherwallet.com` 的用户中，有一部分被悄悄引导到了一个冒名顶替者那里。

这个冒名顶替者颇具欺骗性。它看起来像 MyEtherWallet，因为它几乎是完美的克隆。*唯一*暴露它的是一个证书警告——而关键在于，用户可以直接点击略过这个警告。那些这样做并随后登录的人，拱手交出了自己资金的密钥。正如 BleepingComputer 报道，[登录的用户的钱包私钥被盗，攻击者随即用这些私钥清空了账户](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen)。

各媒体报道的数字略有差异，但核心数字一致。BleepingComputer 报告为[交易时价值 16 万美元的 215 以太币](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000)。CyberScoop 报告称盗贼[成功盗取了 215 以太币，当时价值约 15.2 万美元](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000)。Help Net Security 总结攻击者[成功盗取了约 15 万美元的以太币](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum)。都是 215 ETH；美元数字仅因被盗时的汇率而浮动。

这就是路由加 DNS 攻击针对加密钱包的残酷经济学。没有欺诈撤销部门，没有退款，没有银行可以致电。一旦私钥被输入攻击者的克隆站，资金在[链上](/zh-CN/glossary/on-chain/)转移，便一去不复返。

## 事件经过：劫持路由、毒化应答、架设克隆

![生动彩色概念艺术：一张被劫持的发光世界地图，GPS 路线被一只冒名顶替的手重新绘制，旅行者被引向一个假地标建筑，而真实目的地在远处孤独地发着光](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

这次攻击将两个漏洞串联在一起。单独任何一个都不足以奏效。两者合力，则具有毁灭性。

**第一步：劫持通往 Amazon DNS 服务器的路由。** MyEtherWallet 使用 Amazon 的托管 DNS 服务。正如 Help Net Security 直接指出的，[MyEtherWallet.com 使用 Amazon 的 Route 53 DNS 服务](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service)。攻击者并未入侵 Route 53。相反，据 The Register 报道，[有人能够向互联网核心路由器发送 BGP——边界网关协议——消息，说服它们将发往部分 AWS 服务器的流量转发给一台叛逃的主机](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP)。

发出这一通告的来源出乎意料。The Register 报道，[属于俄亥俄州网站托管公司 eNet 的网络块 AS10297 宣告它可以接管发往部分 AWS IP 地址的流量](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet)。由于 BGP 偏好更具体的路由并信任对等方，这条虚假通告得以传播。维基百科记录了其规模：[亚马逊 Web 服务空间内专用于 Amazon Route 53 的约 1300 个 IP 地址，被俄亥俄州哥伦布市的 ISP eNet（或其客户）劫持。Hurricane Electric 等多个对等合作伙伴盲目传播了这些通告](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space)。"盲目传播"两个词道尽了 BGP 信任模型的全部故事。

**第二步：成为 DNS 服务器并撒谎。** 一旦路由被劫持，本应发往 Amazon 真实 DNS 服务器的查询便落入了攻击者的主机。该主机冒充 Route 53。The Register 描述了结果：[那台流氓主机随后充当 AWS 的 DNS 服务，为 MyEtherWallet.com 返回错误的 IP 地址，将部分倒霉的访客引导至一个钓鱼网站](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service)。Kentik 的分析从 DNS 角度呈现了同一事实：[冒名顶替的权威 DNS 服务器为 myetherwallet.com 返回了虚假应答，将用户误导至 MyEtherWallet 网站的仿冒版本](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com)。

**第三步：架设钓鱼克隆——服务器位于俄罗斯。** 被毒化的 DNS 应答将用户指向俄罗斯托管假钱包的服务器。Help Net Security 报告，攻击者利用劫持将[发往 MyEtherWallet.com 的流量重定向至托管在俄罗斯服务器上的仿冒钓鱼网站](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia)。

**唯一几乎奏效的防线：证书。** 这是每位读者都应该细细品味的部分。攻击者控制了域名的*解析*和*服务器*，但他们无法为 `myetherwallet.com` 获取由受信任机构颁发的有效 TLS 证书。因此浏览器做了它本应做的事——抛出了一个警告。Help Net Security 精确描述了它：[唯一能给访客一些提示、表明该钓鱼网站并非它所冒充的对象的，是向访客显示的警告，说明该网站使用的 TLS 证书由未知机构签署（即自签名）](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication)。BleepingComputer 也认为，对于任何稍加留意的人来说，这个迹象显而易见：[这个假网站很容易被识别，因为攻击者使用了自签名 TLS 证书，这会触发所有现代浏览器的错误提示](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot)。

但"容易识别"的前提是用户会停下来看。ESET 的 WeLiveSecurity 揭示了这层保护究竟有多薄弱：[普通用户可能注意到的唯一明显线索是，当他们访问假 MyEtherWallet 网站时，会看到一条错误信息，告诉他们该网站正在使用不受信任的 SSL 证书](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted)。浏览器举手说了*这是错的*。损失了资金的用户，恰恰是那些点击略过的人——受害者[不得不点击略过 HTTPS 错误消息，因为假冒的 MyEtherWallet.com 使用了不受信任的 TLS/SSL 证书](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message)。

## 响应与后续

对于那些以监控路由为业的人来说，这次劫持并不隐蔽。网络监控人员看到虚假的更具体前缀出现，随后在同一两小时窗口内撤回，一旦流氓通告被撤销，通往 Route 53 的正常路由就恢复了。

MyEtherWallet 自身明确强调，其基础设施未遭入侵。正如该公司在事后立即声明的，问题出在互联网的管道上，而非其应用——这是一次通过 BGP 实现的 [DNS 劫持](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking)，针对的是解析路径，而非对 MEW 服务器或代码的入侵。

更深层的修复落在路由层。这一事件成为支持 **RPKI**（资源公钥基础设施）和 **ROA**（路由源授权）最常被引用的论据之一——这些加密记录让网络能够以可验证的方式声明，哪些自治系统*被允许*通告哪些 IP 前缀。有了有效的 ROA，来自俄亥俄州 ISP 的"我来承接 Amazon 的地址"这类流氓通告，就可以被标记为 **RPKI 无效**并丢弃，而不是[盲目传播](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements)。Kentik 直接指出了其意义：如果同样的通告在今天针对一个已正确签名的前缀发出，[它将被评估为 RPKI 无效](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid)。在此类攻击发生后的数年间，大型网络加速发布 ROA，正是为了应对这类路由威胁。

但 RPKI 的普及是一项全球性、多年期、自愿参与的工作。对其他所有人而言，教训更为简单直接：你的域名安全取决于你不拥有、也看不见的层。

## 这一事件揭示的 BGP 和 DNS 默认信任问题

这一事件值得铭记，因为它颠覆了通常意义上"域名安全"的认知模型。

大多数人认为域名安全意味着强注册商密码、双因素认证和注册商锁定。这些都是真实且必要的——然而**其中任何一条都无法阻止 2018 年 4 月 24 日发生的事情。** 攻击者从未触碰注册商，从未触碰 MyEtherWallet 的 DNS 记录，也从未触碰其服务器。记录始终指向正确的内容。互联网只是停止了将查询传递给持有这些记录的地方。

几点经久不衰的启示：

1. **你的域名建立在借来的信任之上。** 解析依赖 BGP，而 BGP [默认……被设计为信任对等方发送的所有路由通告](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers)。即使你拥有完美的 DNS 配置，仍然可能在下面一层被劫持。

2. **无需触碰 DNS 即可实现 DNS 毒化。** 劫持通往 DNS 服务器的路由，就能控制应答，即便权威记录未被触动。

3. **TLS 是真实的兜底保障——也是脆弱的。** 证书警告是用户与全部损失之间唯一的屏障。它在技术层面有效，却在行为层面失败。一个用户可以点击略过的安全控制，其强度仅取决于用户的耐心。

4. **链上终局性移除了安全网。** 对于银行登录，一个被毒化的会话是麻烦的；对于加密钱包，则是不可逆转的。同样的攻击针对其他类型的网站不过是一场虚惊；在这里，却是永久的损失。

5. **纵深防御必须涵盖路由层。** 网络层面的 RPKI/ROA，加上对你的前缀是否出现意外来源通告的监控，现在已是任何高价值资产的必要门槛。

## Namefi 的视角

![彩色插图：可验证、防篡改的域名所有权——一张由绿色盾牌、绿色 Namefi 代币和 DNS 连续性保护的域名卡片](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

MyEtherWallet 攻击事件清晰地提醒我们：域名并非你所"拥有"的单一事物——它是一个由信任关系叠加而成的堆栈，任何一层都可能被颠覆：[注册局](/zh-CN/glossary/registry/)、注册商、DNS 提供商，以及将查询传递给该提供商的全球路由结构。

[Namefi](https://namefi.io) 的建立，正是为了让这一堆栈的*所有权*层变得可验证且防篡改。域名所有权的代币化，意味着对域名的控制可以通过密码学方式证明和转移，以可审计的方式进行，而不是仅仅依赖于单一提供商的账户密码——同时保持与 DNS 的兼容性。它本身并不能修复 BGP；所有权层的任何东西都无法重写互联网如何路由数据包。但它攻击的是这一事件所揭示的同一根本病灶：**太多关键的互联网信任是隐性的、不可验证的，且可被任何能伪造正确消息的人撤销。**

域名安全的未来，看起来不像是一个强密码，而更像是每一层的密码学证明——可验证的所有权、可验证的路由（RPKI）、可验证的身份（TLS）。MyEtherWallet 的用户在这些层之间的空隙中蒙受了损失。一次一个可验证层地弥合这一空隙，正是整个项目的使命所在。

2018 年 4 月 24 日，域名记录从未出错。互联网只是相信了一个关于如何到达它们的谎言。让"谁拥有什么、如何到达它"变得可证明而非仅凭假设，才能确保下一次伪造的通告被丢弃，而非被遵从。

## 来源与延伸阅读

- The Register — [Cryptocurrency thieves snatch ~$150k after BGP hijack reroutes MyEtherWallet DNS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [Hacker Hijacks DNS Server of MyEtherWallet to Steal $160,000](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [MyEtherWallet users robbed after successful DNS hijacking attack](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [Amazon DNS service server hijacked for $152,000 Ether theft](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Ethereum cryptocurrency wallets raided after Amazon's internet domain service hijacked](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [What can be learned from recent BGP hijacks targeting cryptocurrency services?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [BGP hijacking](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [BGP Hijacking](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [How Was MEW (MyEtherWallet) DNS Spoofed?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [Hackers Hijacked DNS Servers to Steal from MyEtherWallet Users](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)
