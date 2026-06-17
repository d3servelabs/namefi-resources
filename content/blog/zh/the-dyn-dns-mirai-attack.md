---
title: 'Dyn DNS 攻击：当被黑客入侵的摄像头组成的 Mirai 僵尸网络瘫痪了半个互联网时'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2016年10月21日，由 Mirai 物联网僵尸网络发起的 DDoS 攻击分三波袭击了 DNS 提供商 Dyn，导致 Twitter、Netflix、Reddit、Spotify、GitHub、Airbnb 和 PayPal 离线数小时——这是一个关于 DNS 提供商集中化风险的 Domain Mayday 案例研究。'
keywords: ['Dyn DNS 攻击', 'Mirai 僵尸网络', '2016年10月21日 DDoS', 'DNS DDoS 攻击', '物联网僵尸网络', 'DNS 提供商中断', '域名安全', 'DNS 单点故障', 'Dyn DDoS 2016', 'Mirai 恶意软件', '2016 互联网中断', 'DNS 冗余', '被黑客入侵的物联网摄像头']
---

在 2016 年 10 月的一个星期五，有那么几个小时，互联网忘了该如何找到自己。

Twitter 加载出一片空白。Netflix 的加载圈转个不停最终只能放弃。Reddit、Spotify、GitHub、Airbnb、PayPal——它们都在，都在线，在各自的服务器上运行得完美无缺，却完全无法被访问。没有任何东西被黑客入侵，没有任何数据被盗，这些网站依然在它们一直所在的位置。出故障的，是互联网中那个*告诉你事物在哪里*的部分。

这场攻击并没有针对 Twitter 或 Netflix。它袭击了一家它们的大多数用户从未听说过的公司：**Dyn**，一家位于新罕布什尔州的公司，负责为现代网络的一大部分运行 DNS（互联网的通讯录）。而武器并非服务器农场或国家级的网络军火库，而是一大群被黑客入侵的婴儿监视器、网络摄像头和家庭路由器：这些普通的家用设备，被悄悄征召进了一支名为 **Mirai** 的大军。

这就是 **Domain Mayday（域名求救信号）第 8 期**——讲述不安全的智能摄像头搞垮互联网电话簿的那一天。

## DNS：互联网的电话簿，以及 Dyn 在其中的位置

每次你输入一个域名，你的电脑都必须将其翻译成一个数字 IP 地址，然后才能建立任何连接。这种翻译正是 DNS（域名系统）的工作。它是人类友好的名称与该名称指向的机器之间的查找层。

Dyn 曾是提供此类查询服务的大型托管提供商之一。当一个网站将其 DNS 外包给 Dyn 时，Dyn 的域名服务器就成为回答“这个域名在哪里？”的权威来源。The Register（英国科技媒体）在攻击期间直白地指出了这种依赖关系：通过迫使 Dyn 离线，谷歌和互联网服务提供商（ISP）运行的公共 DNS 解析器[无法联系 Dyn 为网民查找主机名，从而阻止了人们访问使用 Dyn 作为 DNS 的网站](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames)。

这就是隐藏在这个故事核心中的脆弱性。一个网站可以做到完美无缺——冗余的服务器、出色的正常运行时间、世界级的工程师——但如果那个回答“它在哪里？”的唯一提供商陷入瘫痪，它依然会从互联网上消失。正如卡内基梅隆大学 CyLab 后来总结的那样，受影响的域名[严重依赖 Dyn 这个第三方 DNS。换句话说，它们完全依赖于 Dyn，所以当 Dyn 宕机时，它们也随之宕机](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn)。

## 2016 年 10 月 21 日：一波接一波的攻击

![Vivid colorful concept art of a tidal wave of glowing junk traffic crashing over a giant illuminated phone-book switchboard, the directory lights flickering out across a dark map](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

攻击始于 2016 年 10 月 21 日星期五的上午，它并非一击毙命，而是在这一天里以数波截然不同的攻势袭来。

维基百科对该事件的记录列出了大约从 11:10 UTC 开始针对 Dyn 的[三次连续分布式拒绝服务攻击（DDoS）](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks)。其机制是教科书级别的分布式拒绝服务：[这场 DDoS 攻击是通过来自数千万个 IP 地址的无数次 DNS 查询请求完成的](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses)，海量的垃圾流量淹没了 Dyn 的域名服务器，使得合法的查询请求根本无法通过。

这种波次性的攻击让人感到其绝望与无情。正在进行现场报道的 The Register 描述了 Dyn 似乎恢复了——但随后又被击垮的时刻：[在最初的垃圾流量海啸持续两小时后，Dyn 宣布已缓解了攻击，服务正在恢复正常。但这短暂的喘息并没有持续多久：大约一小时后，攻击再次恢复](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave)。看似结束的时刻，仅仅是回合之间的间隙。

就原始流量而言，这场攻击在当时是极其庞大的——是当时见过的最大规模的 DDoS 事件之一，The Register 将其峰值描述为[超过 1TBps](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps)。（Dyn 自身也曾提醒，合法流量的“重试风暴”使得一些早期估算数值被夸大，关于这一点我们稍后会提到。）

## 哪些网站陷入了瘫痪——以及当时的感受

当 Dyn 的域名服务器无法做出响应时，故障如波纹般扩散至每一个依赖它们的人。这可不是互联网上什么不起眼的角落，这是面向消费者的互联网的“门面”。

The Register 的现场报道直接列出了一些“伤亡名单”：这是一场针对 Dyn 的非同寻常且集中的攻击，持续[破坏着数百家公司的互联网服务，包括在线巨头 Twitter、亚马逊、AirBnB、Spotify 等](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies)。维基百科上受影响的服务名单简直就像是那个时代最大型网站的名人录：[Airbnb、Amazon.com、CNN、GitHub、Netflix、PayPal、Reddit、Spotify、Twitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb)，还有数十家其他网站。

知名安全专家 Brian Krebs（其自己的网站在几周前也曾遭同款恶意软件攻击）这样描述消费者的体验：[攻击开始给互联网用户访问一系列网站（包括 Twitter、亚马逊、Tumblr、Reddit、Spotify 和 Netflix）带来问题](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter)。对于普通用户来说，没有任何合理的错误提示。网站就是无法加载——首先是美国东海岸，随后随着后续几波攻击的到来逐渐蔓延，波及全美甚至欧洲的用户。

## 它是如何发生的：一支由不安全智能设备组成的大军

![Vivid colorful concept art of thousands of tiny smiling hacked smart-cameras, toasters and baby monitors swarming like glowing insects toward a single overloaded directory tower](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

正是这个原因让 Dyn 攻击成为了一个转折点：这些火力并非来自计算机，而是来自各种“*物品*”。

Mirai 是一种恶意软件，它会搜寻物联网（IoT）设备——如摄像头、路由器、DVR——并劫持它们。它的工作原理是利用了消费类硬件中最容易被忽视的弱点：设备出厂时自带的密码。正如 The Register 所描述的，Mirai 在网络上蔓延，不断壮大其服从命令的“僵尸”队伍，其手段就是[通过 Telnet 和 SSH 使用默认的出厂设置密码登录设备](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords)。Krebs 对该机制的描述同样直白：Mirai [在网络上搜寻那些仅仅受到出厂默认用户名和密码保护的物联网设备，然后将它们招募进攻击大军](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices)。

处于 Dyn 攻击核心的设备主要是廉价的网络摄像头和 DVR。Krebs 追溯了该僵尸网络的来源，发现[主要是由一家名为雄迈科技的中国高科技公司制造的被入侵的数字视频录像机（DVR）和 IP 摄像头](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders)——在许多情况下，这些设备的默认凭据[用户根本无法更改](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password)，因为密码被硬编码在了固件中。

有两件事使得 Mirai 从一个小麻烦变成了一场灾难。首先，该恶意软件的作者[在 2016 年 9 月底公布了其源代码，实际上让任何人都可以建立自己的攻击大军](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it)。其次，存在漏洞的设备基数极其庞大。Dyn 确认了攻击的特征：该公司能够[确认大量攻击流量源自基于 Mirai 的僵尸网络](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai)，而维基百科则将该僵尸网络描述为一群[感染了 Mirai 恶意软件的互联网连接设备——例如打印机、IP 摄像头、家庭网关和婴儿监视器](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors)。

## 余波：清点“蜂群”——以及揪出肇事者

尘埃落定后，即使是“*攻击规模到底有多大*”这个最基本的问题，也变得难以回答。Dyn 自己的事件后分析（通过执行副总裁 Scott Hilton 发布）估计该僵尸网络[拥有多达 10 万个恶意端点](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints)——规模很大，但比早期一些数据暗示的“数千万个 IP”要小得多。这种差异源于一个反馈循环：恶意攻击至少来源于一个僵尸网络，[而“重试风暴”提供了一个错误的指标，使得端点集合看起来比我们现在知道的要大得多](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20storm%20providing%20a%20false%20indicator)。换句话说，互联网自身的自动“重试”行为放大了这场混乱。

法律层面的余波又增添了几分曲折。Mirai 背后的三个年轻人——Paras Jha、Josiah White 和 Dalton Norman——最终[对他们在创建、运营和出售“Mirai 僵尸网络”访问权限方面所扮演的角色表示认罪](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating)。但在 Dyn 攻击发生时，Jha 已经公开了源代码——检察官和记者们都谨慎地指出，针对 Dyn 的攻击者并不一定是这最初的三人组。正如 CyberScoop 所报道的那样，[目前尚不清楚，例如，是谁策划了那场最受瞩目的针对互联网性能管理公司 Dyn 的基于 Mirai 的攻击](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind)。一旦武器被开源，任何人都可以扣动扳机。

对于 Dyn 来说，业务上的损失是实实在在的：在接下来的几个月里，数以千计的域名将它们的 DNS 迁移到了其他地方，仅仅因为糟糕的一天，就付出了失去客户信任的沉重代价。

## 这给 DNS 提供商集中化带来了什么启示

Dyn 攻击作为一个物联网安全故事被人们铭记，它确实如此。但其更深层的教训在于*架构*：将互联网的过多部分路由通过单一咽喉要道的危险性。

在 10 月 21 日瘫痪的每一个网站，都做出了一个看似十分合理的决定——将 DNS 外包给一家优秀的提供商。从个体来看，这很聪明。但从整体来看，这意味着击垮一家公司就能立刻让网络中很大一部分陷入瘫痪。CyLab 的结论是，即使在数年之后，从这次攻击中吸取的教训[也只有极少数受到直接影响的网站采取了行动](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful)。

防御的答案是冗余：将权威 DNS 分散到多个提供商，这样任何单一的宕机都不会是致命的。在 Dyn 事件发生的两年后，The Register 发现这种情况依然罕见且令人痛苦——Infoblox 的 Cricket Liu 指出，[例如，使用多个权威 DNS 提供商（比如 Dyn 加上 Verisign 或 Neustar）并没有变得更容易。如果能够使用多个提供商，将会产生巨大的改变](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers)。对于任何依赖域名的人来说，我们能得出以下启示：

1. **域名的故障点不仅仅是其注册商。** 回答“这个名称指向哪里？”的提供商，与其背后的服务器一样，都是承载业务的关键节点。
2. **单一提供商的 DNS 就是一个单点故障。** 正常条件下的卓越运行时间，并不能代表在 1 Tbps 流量洪峰下的表现。
3. **集中化既带来便利也带来脆弱。** 让一家提供商具有吸引力的同一份高效，也会让其宕机的影响被广泛波及。
4. **韧性是所有权的属性，而不仅仅是托管的属性。** 当出现故障时，你需要对你的域名配置有足够清晰的控制力，以便快速重新路由。

## Namefi 视角

![Colorful illustration of verifiable, resilient domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

Dyn 攻击没有窃取哪怕一个域名。它没有伪造转移请求，也没有劫持注册商账户。然而，在这几个小时里，*拥有*这些域名的人实质上失去了对自己域名指向何处的控制权——不是因为他们的所有权受到质疑，而是因为在他们域名之下的运营层瞬间全线崩溃。

这种在*拥有*一个名称和*可靠地控制*它解析到哪里之间的脱节，正是此类攻击所利用的软肋。域名是企业所拥有的最有价值的资产之一，然而对它们的控制权往往隐藏在不透明、集中化的基础设施背后，所有者既无法进行验证，也无法在突发压力下快速重新配置。

[Namefi](https://namefi.io) 建立在这样一个理念之上：域名应该像互联网原生资产一样运作——其所有权应具有密码学层面的可验证性和可移植性，同时与现有的 DNS 保持完全兼容。可验证、由所有者主导的域名所有权虽然无法直接阻挡僵尸网络的攻击，但它推动世界迈向一个域名控制权可证明、可审计的互联网，而不是悄无声息地受制于某家提供商最糟糕的一天。Mirai-Dyn 攻击提醒我们，你“拥有”的域名的韧性，完全受限于为其提供解析的那个技术层的韧性。而韧性，正是始于让所有权和控制权成为你真正可以验证的东西。

## 参考资料与进一步阅读

- Krebs on Security — [被黑客入侵的摄像头、DVR 导致了今天的大规模互联网中断](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/)
- Wikipedia — [对 Dyn 的 DDoS 攻击](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn)
- The Register — [DNS 灾难：顶级网站被击垮离线，Dyn 再次宕机](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/)
- The Register — [今天网络被无数被黑设备弄瘫痪：60秒摘要](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/)
- The Register — [Mirai，Mirai，黑掉它们全部：到底谁是最大的僵尸网络？](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/)
- The Register — [在 Dyn 宕机两年后，我们学到了什么？显然不多](https://www.theregister.com/2018/10/11/dns_insecurity_survey/)
- BankInfoSecurity — [由“多达10万个”物联网设备组成的僵尸军队破坏了 Dyn](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486)
- Carnegie Mellon CyLab — [Mirai-Dyn 攻击四年后……互联网变得更安全了吗？](https://cylab.cmu.edu/news/2020/10/30-dynattack.html)
- CyberScoop — [三名男子因在 Mirai 僵尸网络帝国中所扮演的角色认罪](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/)