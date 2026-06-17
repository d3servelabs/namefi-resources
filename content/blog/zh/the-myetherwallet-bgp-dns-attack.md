---
title: 'MyEtherWallet BGP + DNS 攻击事件：被劫持的互联网路由如何窃取 15 万美元的 ETH'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2018 年 4 月 24 日，攻击者劫持了 Amazon Route 53 的互联网路由，污染了 myetherwallet.com 的 DNS 响应，并在自签名证书后提供了一个网络钓鱼克隆网站——窃取了价值约 15 万美元的以太坊。这是一篇域名求救信号 (Domain Mayday) 深度解析，探讨为何 DNS 运行在一个默认信任的路由层上。'
keywords: ['myetherwallet', 'bgp 劫持', 'dns 劫持', 'amazon route 53', 'route 53 劫持', 'dns 安全', 'bgp 路由安全', '以太坊钓鱼', '自签名证书', 'enet as10297', 'rpki roa', '加密钱包钓鱼', '域名安全']
---

当您在浏览器中输入网站名称时，您正在信任两个对您保持诚实的隐形系统。

第一个是 **DNS**——互联网的电话簿——它将类似 `myetherwallet.com` 的名称转换为数字 IP 地址。第二个是 **BGP**（边界网关协议），它决定了您的数据包到达该地址所经过的物理路径。几乎没有人会想到这两者。它们只是每天默默地运作数十亿次。

在 **2018 年 4 月 24 日**的早晨，这两个系统同时“撒谎”了。在长达约两个小时的时间里，任何输入 `myetherwallet.com` 并忽略浏览器警告点击继续的人，都会被重定向到一个运行在远离其预期目标服务器上的钓鱼克隆网站。在路由被纠正时，攻击者已经从真实用户的钱包中窃取了大约 **15 万美元的以太坊**。

让这一事件成为安全课程中永久经典案例的原因，并非被盗金额——后来的加密货币盗窃案金额早已让其相形见绌。真正关键的是其*机制*。攻击者从未入侵 MyEtherWallet 的服务器。他们从未猜测过密码。他们攻击的是**道路**，而不是建筑物——通过劫持互联网的路由层来污染 DNS 本身。

## DNS 运行在一个默认信任的路由层之上

要理解发生了什么，您必须了解世界上每个域名背后令人不安的基础架构。

DNS 回答了“`myetherwallet.com` 的 IP 地址是什么？”这个问题。但是，为了让您的 DNS 查询能够到达正确的服务器，互联网的路由器必须知道*哪个网络*拥有该 DNS 服务器的 IP 地址——为了找到答案，它们依赖于 BGP。

问题就在这里。从设计上讲，BGP 是一个基于信任的系统。正如维基百科上 Cloudflare 风格的总结所言，[默认情况下，BGP 协议被设计为信任对等方发送的所有路由通告](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers)。安全研究员 Bob Cromwell 更加直白地描述了它的初衷：[BGP 的设计初衷是在善意的 ISP 和大学之间建立一条信任链，这些机构会盲目相信他们收到的信息](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust)。

换句话说：当一个网络运营商站出来向世界宣布“发往*这些* IP 地址的流量应该通过*我*”，互联网的其他部分过去通常都会选择相信它。BGP 中内置了一个更具体的路由抢占机制——如果两个网络声称拥有相同的地址，宣布*更窄*、更具体地址块的那个网络将获胜。这个抢占机制正是攻击者所利用的杠杆。

因此，任何域名的攻击面都大于其注册商、DNS 提供商和网络主机。它包括将您的 DNS 查询送达正确位置的整个全球路由架构。MyEtherWallet 惨痛地体会到了这一点。

## 2018 年 4 月 24 日用户失去了什么

![Vivid colorful concept art of internet traffic flowing along a glowing data highway, suddenly diverted by a counterfeit detour sign onto a fake road leading to an impostor building, packets of light scattering into a trap](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

破坏主要集中在大概两小时的窗口期内。根据 The Register 的报道，恶意路由发生在当天[UTC 时间上午 11 点到下午 1 点之间](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC)。在这个时间段内，一部分试图访问 `myetherwallet.com` 的用户被悄悄引导到了一个伪冒网站。

这个伪冒网站极具迷惑性。它看起来和 MyEtherWallet 一模一样，因为它是一个近乎完美的克隆。*唯一*暴露它的是证书警告——而致命的是，用户可以直接点击跳过该警告。那些点击跳过警告并登录的人，等于交出了自己资金的钥匙。正如 BleepingComputer 所报道的，[那些登录的用户其钱包私钥被盗，攻击者借此清空了他们的账户](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen)。

各家媒体对损失的具体数字报道略有不同，但核心数字是一致的。BleepingComputer 称其为[215 枚以太坊，在交易发生时相当于 160,000 美元](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000)。CyberScoop 报道窃贼[设法盗取了 215 枚以太坊，当时价值约 152,000 美元](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000)。Help Net Security 总结说，攻击者[设法窃取了价值约 150,000 美元的以太坊](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum)。同样是 215 枚 ETH；美元数字只是根据盗窃当时的汇率浮动。

这就是针对加密钱包的路由加 DNS 攻击的残酷经济学。这里没有欺诈撤销部门，没有信用卡拒付，也没有银行可以打电话求助。一旦在攻击者的克隆网站中输入私钥并且资金在链上转移，一切就化为乌有。

## 攻击如何发生：劫持路由、污染响应、提供克隆网站

![Vivid colorful concept art of a hijacked glowing world map where a GPS route is rerouted by an impostor hand redrawing the path, travelers led toward a fake landmark building while the real destination glows ignored in the distance](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

这次攻击将两个独立的安全漏洞串联在一起。任何一个单独存在都无法得逞，但结合在一起却具有毁灭性。

**第一步：劫持通往 Amazon DNS 服务器的路由。** MyEtherWallet 使用的是 Amazon 的托管 DNS 服务。正如 Help Net Security 明确指出的，[MyEtherWallet.com 使用 Amazon 的 Route 53 DNS 服务](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service)。攻击者并没有入侵 Route 53。相反，根据 The Register 的报道，[有人设法向互联网的核心路由器发送 BGP（边界网关协议）消息，以欺骗它们将发往某些 AWS 服务器的流量发送到一台叛逃的主机上](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP)。

导致这一结果的通告来自一个出人意料的地方。The Register 报道称，[属于总部位于俄亥俄州的网站托管公司 eNet 的网络区块 AS10297 宣布，它可以接管发往某些 AWS IP 地址的流量](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet)。而且由于 BGP 偏好更具体的路由并信任其对等方，这个虚假的通告被传播开来。维基百科记录了其规模：[俄亥俄州哥伦布市的 ISP eNet（或其客户）劫持了 Amazon Web Services 空间内专用于 Amazon Route 53 的大约 1300 个 IP 地址。一些对等合作伙伴（例如 Hurricane Electric）盲目传播了这些通告](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space)。“盲目传播 (Blindly propagated)” 这两个词完美地概括了 BGP 信任模型的全部问题。

**第二步：伪装成 DNS 服务器并撒谎。** 一旦路由被劫持，本应发往 Amazon 真实 DNS 服务器的查询请求就会落入攻击者的服务器。这台服务器冒充了 Route 53。The Register 描述了结果：[那台恶意机器随后充当了 AWS 的 DNS 服务，并给出了 MyEtherWallet.com 的错误 IP 地址，将一些试图访问该 .com 域名的倒霉访客指向了一个网络钓鱼网站](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service)。Kentik 的分析从 DNS 端阐述了同一个事实：[伪造的权威 DNS 服务器为 myetherwallet.com 返回了虚假响应，将用户误导至 MyEtherWallet 网站的伪造版本](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com)。

**第三步：提供钓鱼克隆网站——来自俄罗斯。** 被污染的 DNS 响应将用户指向了一台位于俄罗斯、托管着伪造钱包的服务器。Help Net Security 报道称，攻击者利用此次劫持[将原本发往 MyEtherWallet.com 的流量重定向到托管在俄罗斯服务器上的外观相似的钓鱼网站](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia)。

**差点起作用的最后一道防线：证书。** 这是每位读者都应该深思的部分。攻击者控制了域名的*解析*和*服务器*，但他们无法凭空生成由受信任机构签发的 `myetherwallet.com` 有效 TLS 证书。因此，浏览器完成了它应该做的事情——发出了警告。Help Net Security 对此有准确描述：[唯一表明钓鱼网站与其伪装不符的迹象，是向访客展示的警告，提示该网站使用的 TLS 证书由未知机构签名（即自签名）](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication)。BleepingComputer 也认为，任何留意的人都能明显察觉到异常：[这个虚假网站很容易被识破，因为攻击者使用的是自签名的 TLS 证书，这会在所有现代浏览器中触发错误](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot)。

但是，“很容易被识破”的前提是用户停下脚步。ESET 的 WeLiveSecurity 捕捉到了这层保护究竟有多么脆弱：[普通用户可能发现的唯一明显线索是，当他们访问虚假的 MyEtherWallet 网站时，会看到一条错误消息，告诉他们该网站正在使用不受信任的 SSL 证书](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted)。浏览器举起手抗议并说*这不对劲*。然而那些损失了资金的用户，都是不顾警告强行点击继续的人——受害者[必须在 HTTPS 错误消息中点击继续，因为伪造的 MyEtherWallet.com 使用了不受信任的 TLS/SSL 证书](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message)。

## 响应与善后

对于那些以监控路由为生的人来说，这次劫持并不难察觉。网络监控器发现虚假的、更具体的前缀在两小时内出现并随后撤回，一旦恶意通告被撤销，流向 Route 53 的正常路由便恢复了。

MyEtherWallet 本身也坚决表示，其自身的基础设施未遭到破坏。正如该公司在事发后立刻强调的那样，问题出在互联网的管道，而不是它的应用程序上——这是一次通过 BGP 实现的针对解析路径的[DNS 劫持](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking)，而不是对 MEW 服务器或代码的破坏。

更深层次的修复方案落在了路由层。该事件成为支持部署 **RPKI**（资源公钥基础设施）和 **ROAs**（路由发起授权）的最常被引用的论据之一——这些密码学记录让网络能够以可验证的方式，声明哪些自治系统被*允许*发布哪些 IP 前缀。在部署了有效 ROA 的情况下，来自俄亥俄州 ISP 一条偏离常理的“我来接管 Amazon 地址”的通告，就会被标记为 **RPKI 无效 (RPKI-invalid)** 并被丢弃，而不是被[盲目传播](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements)。Kentik 直接指出了其影响：如果今天对一个正确签名的前缀发布同样的通告，[它会被评估为 RPKI 无效](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid)。在此类攻击发生后的几年里，大型网络加速了针对此类路由发布 ROA 的进程。

但是，RPKI 的普及是一项全球性的、跨越多年的自愿选择加入 (opt-in) 工作。对于其他人而言，教训更加简单直接：您的域名安全取决于那些您既不拥有也看不见的网络层。

## BGP 和 DNS 的默认信任机制教会了我们什么

这个事件值得被铭记，因为它颠覆了“域名安全”的常见心理模型。

大多数人认为域名安全意味着高强度的注册商密码、双重身份验证和注册商锁定。这些都非常真实且必要——但**在 2018 年 4 月 24 日那一天，这一切都无法阻止攻击。** 攻击者从未触及注册商，从未触及 MyEtherWallet 的 DNS 记录，也从未触及它的服务器。DNS 记录自始至终都是正确的。只是互联网停止将查询传递到存放这些记录的正确地点罢了。

几个历久弥新的经验教训：

1. **您的域名建立在借来的信任之上。** 域名解析依赖于 BGP，而 BGP 在[默认情况下……被设计为信任对等方发送的所有路由通告](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers)。您可能拥有完美无瑕的 DNS 配置，但在它的下一层依然可能会被劫持。

2. **无需触及 DNS 即可实现 DNS 污染。** 只要劫持通往 DNS 服务器的路由，您就能控制解析结果，即便权威记录未受任何改动。

3. **TLS 是真正的最后防线——但也极其脆弱。** 证书警告是唯一横跨在用户与彻底损失之间的屏障。它在技术上奏效了，但在行为层面却失败了。如果一个安全控制机制可以被用户点击跳过，那么它的有效性就只等同于用户的耐心。

4. **链上确定性消除了安全网。** 对于银行登录，会话被污染是很糟糕的。但对于加密钱包，这是不可逆的。同样的攻击要是针对另一种类型的网站，可能只是虚惊一场；而在加密领域，则是永久的损失。

5. **纵深防御必须涵盖路由层。** 如今，网络层面的 RPKI/ROA 加上对您 IP 前缀的异常源头通告监控，已成为任何高价值数字资产保护的基本门槛。

## Namefi 的视角

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

MyEtherWallet 攻击事件给人们敲响了警钟：域名并非您真正“拥有”的单一物品——它是由信任关系堆叠而成的技术栈，其中的任何一层都有可能被颠覆：注册局、注册商、DNS 提供商，以及将查询传递给该提供商的全球路由架构。

[Namefi](https://namefi.io) 的核心目标是让这个技术栈的*所有权*层变得可验证且防篡改。代币化域名所有权意味着您可以利用密码学证明来控制和转移域名，并且这种方式是可审计的，而不仅仅依赖于某一个提供商的账户密码——同时仍保持对 DNS 的兼容性。单靠它自己无法修复 BGP 问题；所有权层的任何机制都无法改写互联网路由数据包的方式。但它解决的是本次事件暴露出的同一种底层弊病：**有太多关键的互联网信任是隐式的、不可验证的，而且任何能够伪造正确消息的人都能轻易撤销这些信任。**

域名安全的未来，不再是依赖于一个强密码，而是倾向于在每一层都提供密码学证明——可验证的所有权、可验证的路由 (RPKI)、可验证的身份 (TLS)。MyEtherWallet 的用户正是倒在了这些信任层的缝隙之中。一次一个可验证层地弥合这些缝隙，正是整个安全演进的方向。

在 2018 年 4 月 24 日那一天，域名记录从未出错。互联网只是轻易相信了一个关于如何到达它的谎言。把“谁拥有什么，以及如何到达”从基于假设转变为可证明，正是我们确保下一次伪造通告被丢弃而不是被服从的制胜之道。

## 来源与扩展阅读

- The Register — [BGP 劫持重定向 MyEtherWallet DNS 后，加密货币窃贼抢走约 15 万美元](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [黑客劫持 MyEtherWallet DNS 服务器窃取 16 万美元](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [成功的 DNS 劫持攻击后，MyEtherWallet 用户被盗](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [Amazon DNS 服务服务器被劫持导致 152,000 美元以太坊被盗](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Amazon 互联网域名服务被劫持后，以太坊加密货币钱包遭洗劫](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [从最近针对加密货币服务的 BGP 劫持中可以学到什么？](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [BGP 劫持](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [BGP 劫持](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [MEW (MyEtherWallet) DNS 是如何被欺骗的？](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [黑客劫持 DNS 服务器以窃取 MyEtherWallet 用户的资金](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)