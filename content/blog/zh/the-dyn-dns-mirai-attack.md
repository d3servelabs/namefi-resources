---
title: 'Dyn DNS 攻击：Mirai 僵尸网络如何用被黑摄像头让半个互联网瘫痪'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2016 年 10 月 21 日，由 Mirai 物联网僵尸网络发动的 DDoS 攻击以三波浪潮猛击 DNS 服务商 Dyn，导致 Twitter、Netflix、Reddit、Spotify、GitHub、Airbnb 和 PayPal 数小时无法访问——这是一个关于 DNS 服务商集中化风险的域名危机案例。'
keywords: ['dyn dns 攻击', 'mirai 僵尸网络', '2016年10月21日ddos', 'dns ddos 攻击', '物联网僵尸网络', 'dns 服务商中断', '域名安全', 'dns 单点故障', 'dyn ddos 2016', 'mirai 恶意软件', '2016年互联网中断', 'dns 冗余', '被黑物联网摄像头']
---

2016 年 10 月的一个周五，在短短几个小时内，互联网突然忘记了如何找到自己。

Twitter 只显示空白页面。Netflix 转圈后放弃加载。Reddit、Spotify、GitHub、Airbnb、PayPal——它们都在那里，都在运行，各自的服务器都运转正常，但全都无法访问。没有任何东西被入侵，没有任何数据被盗取。这些网站还在原来的地方，分毫未动。崩溃的，是互联网中*告诉你事物在哪里*的那一层。

这次攻击并没有直接打击 Twitter 或 Netflix，而是瞄准了一家大多数用户从未听说过的公司：**Dyn**——一家位于新罕布什尔州、为现代互联网大量网站运营 DNS（互联网地址簿）的公司。所用的武器，也不是什么服务器集群或国家级网络武器库，而是一群被黑客控制的婴儿监视器、摄像头和家用路由器——普普通通的家用智能设备，悄无声息地被征召入一支名叫 **Mirai** 的军队。

这是**域名危机第 08 集**——不安全的智能摄像头摧毁了互联网"电话本"的那一天。

## DNS：互联网的电话本，以及 Dyn 在其中的位置

每次你输入一个域名，你的电脑都需要先将其转换为数字 IP 地址，才能建立连接。这个转换工作，正是 DNS（域名系统）的职责。它是人类可读的名称与机器实际地址之间的查询层。

Dyn 是这一查询服务的主要托管服务商之一。当一个网站将 DNS 外包给 Dyn 时，Dyn 的域名服务器就成为回答"这个域名在哪里？"的权威来源。The Register 在攻击发生时直白地描述了这种依赖关系：通过向 Dyn 发动攻击，谷歌和各大 ISP 运营的公共 DNS 解析器[无法联系 Dyn 来查询用户所需的主机名，导致用户无法访问使用 Dyn 提供 DNS 服务的网站](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames)。

这就是这个故事核心所在的隐秘脆弱性。一个网站可以做到无懈可击——冗余服务器、完美的在线时间、世界顶级的工程师——但只要那个回答"它在哪里？"的服务商下线，它就会从互联网上消失。正如卡内基梅隆大学 CyLab 后来总结的那样，受影响的域名[严重依赖 Dyn 这家第三方 DNS 服务商，换句话说，它们完全依赖 Dyn，所以当 Dyn 宕机时，它们也一并宕机了](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn)。

## 2016 年 10 月 21 日：攻击以波浪形式袭来

![色彩鲜艳的概念艺术图：一波波发光的垃圾流量如海啸般冲击一个巨大的、灯火通明的电话簿交换台，目录指示灯在黑暗的地图上相继熄灭](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

攻击始于 2016 年 10 月 21 日周五早晨，并非一蹴而就，而是在当天以明显的波浪形式接连涌来。

维基百科记录了这次事件：[三轮连续的分布式拒绝服务攻击](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks)在协调世界时 11:10 前后向 Dyn 发起。攻击手段堪称教科书式的分布式拒绝服务：[来自数千万 IP 地址的大量 DNS 查询请求](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses)将 Dyn 的域名服务器淹没在垃圾流量中，使合法请求根本无法通过。

正是这种波浪式攻击，让人感到毫无喘息之机。The Register 进行现场报道时，描述了 Dyn 看似已经恢复——但随后再度崩溃的那一刻：[在最初的垃圾流量海啸持续了约两小时后，Dyn 宣布已成功抵御攻击，服务正在恢复正常。然而短暂的喘息并未持续：就在大约一小时后，攻击再度卷土重来](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave)。看似结束的，不过是两轮攻击之间的间歇。

从规模来看，这次攻击在当时是史无前例的——堪称迄今为止规模最大的 DDoS 事件之一，The Register 将峰值流量描述为[超过 1 Tbps](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps)。（Dyn 本身也提醒称，合法流量的"重试风暴"放大了部分早期估计数字，这一点我们稍后再谈。）

## 哪些网站陷入黑暗——以及当时的感受

当 Dyn 的域名服务器无法响应时，故障波及了所有依赖它的网站。受影响的不是互联网的某个冷僻角落，而是面向消费者的互联网前台。

The Register 的现场报道直接点名了部分受害者：这是一场针对 Dyn 的异常集中的攻击，持续[扰乱了数百家公司的互联网服务，包括 Twitter、Amazon、AirBnB、Spotify 等在线巨头](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies)。维基百科列出的受影响服务名单，堪称那个时代最大网站的名人录：[Airbnb、Amazon.com、CNN、GitHub、Netflix、PayPal、Reddit、Spotify、Twitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb)，以及数十个其他网站。

Brian Krebs 的网站几周前刚刚遭受同一恶意软件的攻击，他描述了用户的切身感受：[此次攻击导致用户访问 Twitter、Amazon、Tumblr、Reddit、Spotify 和 Netflix 等一系列网站时出现问题](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter)。对于普通用户来说，没有任何有意义的错误提示，网站就是无法加载——最初主要集中在美国东海岸，随着后续几波攻击，影响范围逐渐扩展至全美乃至欧洲。

## 攻击如何发生：一支不安全智能设备组成的军队

![色彩鲜艳的概念艺术图：数千台面带微笑的被黑智能摄像头、烤面包机和婴儿监视器如发光的昆虫群涌向一座超负荷运转的目录塔](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

让 Dyn 攻击成为一个转折点的，正是这一点：攻击火力并非来自电脑，而是来自*物品*。

Mirai 是一种专门猎寻物联网设备——摄像头、路由器、数字录像机——并劫持它们的恶意软件。它利用的是消费者硬件中最懒惰的弱点：设备出厂时的默认密码。正如 The Register 所描述的，Mirai 通过[使用 Telnet 和 SSH 登录设备的默认出厂密码](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords)在网络上蔓延，不断壮大其听命的僵尸大军。Krebs 的描述同样直白：Mirai [在网络上搜寻仅靠出厂默认用户名和密码保护的物联网设备，并将这些设备征募用于发动攻击](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices)。

此次 Dyn 攻击的核心，主要是廉价的网络摄像头和数字录像机。Krebs 追踪到僵尸网络的来源，[主要是一家名为雄迈科技（XiongMai Technologies）的中国高科技公司生产的被入侵数字录像机（DVR）和 IP 摄像头](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders)——这些设备的默认凭证在很多情况下[用户根本无法更改](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password)，因为密码已被硬编码进了固件。

两件事让 Mirai 从一个小麻烦变成了一场灾难。其一，恶意软件的作者[在 2016 年 9 月底公开发布了其源代码，实际上让任何人都可以建立自己的攻击军队](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it)。其二，易受攻击的设备数量庞大。Dyn 随后确认了攻击的特征：该公司[确认大量攻击流量来源于基于 Mirai 的僵尸网络](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai)；维基百科将这个僵尸网络描述为一个由[打印机、IP 摄像头、家用网关和婴儿监视器等联网设备——均被 Mirai 恶意软件感染——组成的蜂群](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors)。

## 事后：清点蜂群规模——以及追查肇事者

尘埃落定后，就连"规模究竟有多大"这一基本问题都难以回答。Dyn 自己的事后分析（通过执行副总裁 Scott Hilton 发布）将僵尸网络估算为[多达 10 万个恶意终端](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints)——数量庞大，但远小于部分早期数据中"数千万 IP"的说法。这一出入，源于一个反馈循环：恶意攻击至少来自一个僵尸网络，[而重试风暴提供了一个假象，使外界误以为终端数量远大于我们现在所知道的实际数字](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20storm%20providing%20a%20false%20indicator)。换句话说，互联网自身的自动"重试"机制放大了混乱。

事后的法律追究带来了一个转折。Mirai 背后的三名年轻人——Paras Jha、Josiah White 和 Dalton Norman——最终[就其在创建、运营和出售"Mirai 僵尸网络"访问权限中所扮演的角色认罪伏法](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating)。但在 Dyn 遭受攻击时，Jha 已经公开发布了源代码——检察官和记者们也都谨慎指出，发动 Dyn 攻击的人未必就是最初的三人组。正如 CyberScoop 所报道的，[究竟是谁策划了这场针对互联网性能管理公司 Dyn 的高知名度 Mirai 相关攻击，目前仍不明朗](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind)。一旦武器开源，任何人都可以扣动扳机。

对于 Dyn 来说，商业损失是实实在在的：此后数月内，数千个域名将 DNS 迁移至其他服务商，这是在糟糕的一天之后付出的惨痛信任代价。

## 这次事件对 DNS 服务商集中化的警示

Dyn 攻击被铭记为一个物联网安全事件，确实如此。但它更深层的教训在于*架构*：将太多互联网流量集中于单一节点的危险。

10 月 21 日陷入黑暗的每一个网站，都曾做出了同一个看似合理的决策——将 DNS 外包给一家优秀的服务商。单独来看，这是明智之举；但集体而言，这意味着击垮一家公司就能让相当一部分互联网同时陷入黑暗。CyLab 的结论是，即便多年之后，这次攻击的教训[也仅被少数直接受到波及的网站付诸实践](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful)。

防御的答案是冗余：将权威 DNS 分散到多个服务商，确保任何单一故障都不至于致命。Dyn 事件两年后，The Register 发现这种做法依然罕见，而且代价不菲——Infoblox 的 Cricket Liu 指出，[使用多个权威 DNS 服务商（例如同时使用 Dyn 和 Verisign 或 Neustar）并没有变得更容易，但能够使用多家服务商将会大有裨益](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers)。对于任何依赖域名的人来说，以下几点值得铭记：

1. **域名的故障点远不止注册商一处。** 回答"这个名字指向哪里？"的服务商，与其背后的服务器同等关键。
2. **单一服务商的 DNS 就是单点故障。** 正常情况下出色的在线时间，无法说明在 1 Tbps 洪流冲击下会有何表现。
3. **集中化既高效又脆弱。** 使单一服务商具有吸引力的同一种效率，也使其宕机时影响广泛。
4. **韧性是所有权的属性，而非仅仅是托管的属性。** 一旦出现问题，你需要能够足够清晰地掌控域名配置，以便迅速重新路由。

## Namefi 的视角

![色彩鲜艳的插图，展示可验证、具有韧性的域名所有权——一张由绿色盾牌保护的域名卡片、一枚绿色 Namefi 代币，以及 DNS 连续性](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

Dyn 攻击没有盗取任何一个域名，没有伪造转移，没有劫持注册商账户。然而，在短短几个小时内，那些*拥有*这些域名的人实际上失去了对域名指向的控制——不是因为所有权受到质疑，而是因为其域名之下的操作层同时崩溃了。

这道裂缝——*拥有*一个名称与*可靠地控制*其解析之间的差距——恰恰是此类攻击所利用的接缝。域名是企业持有的最有价值的资产之一，然而其控制权往往藏身于不透明的集中化基础设施之后，所有者既无法验证，也无法在压力之下快速重新配置。

[Namefi](https://namefi.io) 建立在这样一个理念之上：域名应该像互联网原生资产一样运作——所有权在密码学上可验证、可移植，同时与 DNS 完全兼容。可验证的、由所有者掌控的域名所有权并不能阻止僵尸网络的攻击——但它推动世界走向一个互联网：在那里，名称的控制权是可证明的、可审计的，而不是静默地依赖于某一服务商最糟糕的那一天。Mirai-Dyn 攻击提醒我们：你"拥有"的域名，其韧性只取决于为其提供应答的那一层。韧性，始于让所有权与控制权成为你真正能够验证的东西。

## 资料来源与延伸阅读

- Krebs on Security — [被黑摄像头与 DVR 驱动了今天的大规模互联网中断](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/)
- Wikipedia — [针对 Dyn 的 DDoS 攻击](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn)
- The Register — [DNS 浩劫：顶级网站在 Dyn 再度倒下时相继离线](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/)
- The Register — [今日互联网被无数被黑设备击垮：60 秒速览](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/)
- The Register — [Mirai，Mirai，收服众生：谁是互联网最强僵尸网络？](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/)
- The Register — [Dyn 陷入黑暗两年后，我们学到了什么？似乎并不多](https://www.theregister.com/2018/10/11/dns_insecurity_survey/)
- BankInfoSecurity — [由多达 10 万台物联网设备组成的僵尸网络军队扰乱了 Dyn](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486)
- 卡内基梅隆大学 CyLab — [Mirai-Dyn 攻击四年后……互联网更安全了吗？](https://cylab.cmu.edu/news/2020/10/30-dynattack.html)
- CyberScoop — [三人就参与 Mirai 僵尸网络帝国认罪](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/)
