---
title: 'Curve Finance DNS 劫持事件：当"经过审计的合约"无法守护前门'
date: '2026-06-17'
language: zh-CN
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2022 年 8 月，Curve Finance 的智能合约完好无损——但攻击者在注册商层面劫持了 curve.fi 域名，克隆了网站，从用户处盗取约 57 万美元。深度解析针对 DeFi 前端的 DNS 攻击，以及它对域名安全的警示。'
keywords: ['curve finance dns 劫持', 'curve.fi 劫持', 'dns 劫持 defi', 'iwantmyname 被入侵', '域名服务器被入侵', '钱包盗币', 'defi 前端攻击', '域名安全', 'dns 安全', '加密钓鱼', '克隆网站攻击', '注册商账户入侵', '域名告急']
relatedArticles:
  - /zh-CN/blog/the-badgerdao-frontend-attack/
  - /zh-CN/blog/the-2024-squarespace-defi-domain-hijacks/
  - /zh-CN/blog/the-bitcoin-org-dns-hijack/
  - /zh-CN/blog/the-myetherwallet-bgp-dns-attack/
  - /zh-CN/blog/the-lenovo-com-dns-hijack/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/name-change-game-change/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/web3/
  - /zh-CN/glossary/tld/
---

智能合约完好无损。

这是理解 2022 年 8 月 9 日 Curve Finance 事件的第一个关键点，也是多年来令安全工程师们仍感不安的地方。Curve 的[链上](/zh-CN/glossary/on-chain/)代码——那套经过审计、久经考验、持有数十亿稳定币的自动做市商合约——从未被触碰。没有重入漏洞，没有预言机操纵，没有闪电贷攻击。[区块链](/zh-CN/glossary/blockchain/)本身按照预定方式运行。

而用户仍然损失了约 **57 万美元**。

攻击不是从合约入手，而是从**域名**下手。有人在[注册商](/zh-CN/glossary/registrar/)层面夺取了 `curve.fi` 的控制权，将其指向一个植入了[钱包](/zh-CN/glossary/wallet/)盗币程序的克隆网站，然后让协议本身的声誉做剩下的事。Curve 通过的所有安全审计都无济于事，因为攻击者根本没有敲那扇门——他们从正门走了进来，就是用户不假思索地输入的那个网址。

这是 *Domain Mayday* 第 13 集。这个故事讲述了：一个系统中最安全的部分可以毫发无损，而所有人都**不加审查地信任**的部分——域名——却悄然成为攻击面。

## "经过审计的合约"无法守护前门

[DeFi](/zh-CN/glossary/defi/) 耗费多年建立了一套合约安全文化：审计成为行业标配，漏洞赏金动辄数百万，"在 Etherscan 上已验证"成为信任信号。集体认知逐渐凝固成一种共识：*合约安全，协议就安全。*

但用户几乎从不直接与合约交互。他们打开网站，输入 `curve.fi`，浏览器将该名称解析为 [IP 地址](/zh-CN/glossary/ip-address/)，加载页面，然后页面告诉他们的钱包该签什么。这一系列步骤发生在任何一行经过审计的 Solidity 代码执行*之前*——而其中每一步都依赖于审计从未覆盖的基础设施。

域名是这条链中的第一个环节，也是大多数团队"设置即忘"的环节：注册一次，配置好 DNS，此后再也不去想它。正如事件发生后某位分析人士所言，此类攻击["利用了用户与去中心化应用界面之间的信任层漏洞"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)，而非突破协议的区块链本身。合约可以无懈可击——如果攻击者控制了 `curve.fi` 的*指向*，这一切都无关紧要。

## 2022 年 8 月 9 日：劫持

![一个店面的地址牌被人偷偷更换，将顾客引入一家内置隐藏地板陷阱的仿冒商店，色彩鲜艳的概念艺术，暖色调与冷色调交融，超现实的安全隐喻，无品牌标志](../../assets/the-curve-finance-dns-hijack-01-hijack.jpg)

2022 年 8 月 9 日下午，Curve 的主前端不再属于 Curve。

CertiK 的事后分析精准还原了时间线：["大约在 2022 年 8 月 9 日美东时间下午 4:20，Curve Finance 的 DNS 记录遭到入侵，指向了一个克隆的恶意网站。"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) 对于所有访问 `curve.fi` 的用户来说，一切看起来毫无异样——页面正常渲染，Logo 在那里，流动池、界面、配色方案，全部被忠实地复制。

区别是不可见的，却是彻底的：加载在用户浏览器中的网站已不再由 Curve 提供服务，而是一个克隆体，运行在攻击者的基础设施上，等待有人连接钱包。

安全研究员 Lefteris Karapetsas 直白地描述了这一手法——攻击者["克隆了网站，让 DNS 指向他们部署克隆站点的 IP，并向恶意合约添加了授权请求。"](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) Cointelegraph 随后的分析描述了同样的模式：["攻击者克隆了 Curve Finance 网站，并篡改其 DNS 设置，将用户引导至该网站的仿冒版本。"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

然后，他们静静等待。

## 用户损失了什么

当用户进入克隆网站并尝试使用时，页面要求他们的钱包执行一个在合法 DeFi 网站上每天发生数千次的操作：授权代币。据 CertiK 披露，["攻击者在该网站中注入了恶意代码，要求用户向一个未经验证的合约授予代币权限。"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Coingape 以更直白的语言描述了这个陷阱：["黑客设法在主页上部署了一个恶意合约，一旦受害者确认授权，就会将其钱包彻底清空。"](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)

授予代币许可感觉很日常，与在合法交易所进行兑换时的点击操作别无二致。但这里被授权的合约属于攻击者——一旦授权，它就能将受害者的稳定币转走。

链上数据有据可查。CertiK 报告称，["共有 7 名用户受到此次漏洞利用的影响，累计损失约 61.2 万美元，"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) 具体为["612,724.16 美元的 USDC 和 DAI，"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) 随后被黑客兑换为 ETH。rekt.news 采用了一个更为圆整、广为引用的数字：["被盗资金共计 340 ETH，约合 57.5 万美元。"](https://rekt.news/curve-finance-rekt) 当时大多数报道都落在这一区间——Cryptopotato 报道称[黑客盗取了价值约 57 万美元的 ETH](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)；CryptoDaily 指出[黑客盗取了逾 57.3 万美元](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)。具体总额因快照时间和 ETH 价格而略有出入，但整体轮廓清晰：数十万美元，被从少数几个用户那里盗走，通过一个看起来和他们信任的网站一模一样的克隆站点实施。

有一点值得驻足思考。Tronweekly 的表述十分精准：此次攻击["未触及 Curve 的以太坊智能合约，也未触及其中存储的 57 亿美元资产。"](https://www.tronweekly.com/curve-finance-dns-hijacking/) 57 亿美元的协议资产，分毫未损。正如同一篇文章所记，Curve 本身["毫发无伤，未遭受任何损失。"](https://www.tronweekly.com/curve-finance-dns-hijacking/) 协议赢了，用户输了。因为攻击从来就不是针对协议的。

## 事件始末：是域名，不是链

![色彩鲜艳的概念艺术：一名电话总机接线员秘密地将一根发光的通话线缆切换到一栋外观完全相同的仿冒建筑，霓虹线缆与电路交织，超现实的 DNS 重路由隐喻，无品牌标志](../../assets/the-curve-finance-dns-hijack-02-dns-compromise.jpg)

那么，攻击者如何让 `curve.fi` 解析到*他们的*服务器，而非 Curve 的服务器？

先来了解 [DNS](/zh-CN/glossary/dns/) 的作用。`curve.fi` 这样的域名是人类友好的标签，而计算机需要的是 IP 地址。域名系统（DNS）就是将两者相互转换的查询层——Cointelegraph 的解释将其比作["一本电话簿"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)，["将这些用户友好的域名转换为计算机连接所需的 IP 地址。"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) [DNS 劫持](/zh-CN/glossary/dns-hijacking/)意味着篡改这一查询过程，使电话簿给出错误的号码——["改变 DNS 查询的解析方式，在用户毫不知情的情况下将其重定向至恶意网站。"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

关键在于，要做到这一点，无需攻破用户的计算机。攻击者只需在权威来源——域名所委托的**[域名服务器](/zh-CN/glossary/nameserver/)（nameserver）**——处修改应答即可。而这个来源就在域名的注册商那里。

Curve 创始人 Michael Egorov 直接点明了故障所在。据 rekt.news 引用，["dns 注册商 iwantmyname 的域名服务器遭到入侵，"](https://rekt.news/curve-finance-rekt) 团队的判断是["Curve 认为是底层域名服务器遭到入侵，而非账户层面存在漏洞。"](https://rekt.news/curve-finance-rekt) 换言之：据 Curve 判断，这不是 Curve 自身注册商账户密码被盗的问题，而是更深一层——注册商自身运营的域名服务器基础设施出现了问题。Cointelegraph 的后续报道点名了该注册商，指出该项目["当时使用的是与此前攻击相同的注册商'iwantmyname'。"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

这一区别对于汲取教训至关重要。一个团队可以设置强密码、启用双重验证、将自己的注册商登录守得滴水不漏——但如果其下层的域名服务器遭到入侵，仍然可能丢失域名控制权。域名所有者未必犯了任何错误，只是他们对下层信任链的信赖被彻底打破了。Cointelegraph 对此类攻击运作机制的总结具有普遍意义：["如果网站的映射关系因凭证被盗或注册商漏洞而发生变化，用户可能在毫无察觉的情况下被重定向至有害服务器。"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

一旦域名服务器以攻击者的 IP 作答，其余一切自动发生。每一个输入 `curve.fi` 的用户都被悄无声息地送到了克隆站点。电话簿已被篡改，而几乎没有人会去核查电话簿。

## 事件响应与后续

Curve 团队反应迅速，而这场响应之所以值得研究，恰恰在于他们能做什么、不能做什么。

他们*能*立即做到的是发出警告。团队直白地告知用户：["请不要进行任何授权或兑换。我们正在排查问题，但为了您的安全，请暂时不要使用 curve.fi 或 curve.exchange。"](https://www.tronweekly.com/curve-finance-dns-hijacking/) 他们将用户引导至仍然安全的备用地址——["在 https://curve.fi 的解析恢复正常之前，请使用 https://curve.exchange"](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)——因为 `curve.exchange` 使用了不同的基础设施，未受污染。

他们*无法*立刻做到的是消除既成影响。他们更换了域名服务器，但 DNS 的更新不是同步发生的。正如 rekt.news 所记，["黑客的镜像网站很快被下线，但部分域名服务器的更新仍有延迟。"](https://rekt.news/curve-finance-rekt) 在修复完成后的一段时间内，世界各地的缓存仍在继续给出旧的、恶意的应答。这种传播延迟是 DNS 的内置属性——也是攻击者天然的优势。

对于已经向恶意合约授权的用户，唯一的防御手段是撤销授权。同一条消息反复出现：["如果您在过去数小时内在 Curve 上授权了任何合约，请立即撤销。"](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) rekt.news 公布了用户需要撤销的具体盗币合约地址——`0x9eb5f8e83359bb5013f3d8eee60bdce5654e8881`——以便受害者在更多资金被取走之前切断授权。

被盗资金循着惯常的洗钱路径分散转移。CertiK 追踪了资金流向——["FixedFloat：292 ETH，Tornado Cash：27.7 ETH，Binance：20 ETH"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)——并注意到一个时机上的变数：由于 Tornado Cash 在数天前刚刚遭到 OFAC 制裁，["OFAC 近期对 Tornado Cash 的制裁很可能使黑客有所顾虑，转而将大部分被盗资金发送至 FixedFloat，"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) 即一家中心化交易所。这个选择反而帮了忙：rekt.news 报道称，发往 FixedFloat 的资金中有 [112 ETH 被冻结](https://rekt.news/curve-finance-rekt)。数小时内，Curve 确认["问题已找到并已恢复。"](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)

## 此案对 DeFi 前端 DNS 安全的启示

Curve 事件是 DeFi 真实攻击面的一堂精炼课程。以下几点教训远不止适用于 Curve：

1. **域名是你安全边界的组成部分。** 人们很容易将域名视为市场营销基础设施——一个标签，而非一套系统。但域名是用户浏览器遵循的第一条指令。如果它出错，一切下游都将出错。止步于合约边界的审计，将最受信任的环节暴露在外。

2. **注册商与域名服务器的安全位于你的上游。** Curve 自身的账户安全措施或许无懈可击；被入侵的据信是域名服务器层。你继承了 DNS 链中每一个供应商的安全状况。选择支持注册商锁定、强账户保护、理想情况下还支持 [DNSSEC](/zh-CN/glossary/dnssec/) 的注册商和 DNS 托管商——同时要清楚地认识到，即便如此，你仍在信任一个自己无法完全掌控的层面。

3. **用户看不见 DNS。** 克隆网站之所以以假乱真，正是因为*名称*完全相同。小锁图标是绿色的，URL 是对的。一个谨慎用户通常会检查的任何指标都不会提示异常。这正是 DNS 劫持对再老练的受众都能奏效的原因——欺骗发生在人类目光所及的层面之下。

4. **备有干净的备用方案。** Curve 的救命稻草是运行在独立基础设施上的 `curve.exchange`。第二条前端路径——不同的域名、不同的 DNS 提供商、基于 [IPFS](/zh-CN/glossary/ipfs/) 或 [ENS](/zh-CN/glossary/ens/) 的镜像——让你在主域名被污染时有地方可以引导用户。

5. **代币授权是攻击的有效载荷。** 此类前端攻击的结局都是相同的：一个看起来例行的授权操作，指向的却是恶意合约。钱包、界面和用户都需要将"刚加载页面上的授权提示"视为其本来面目——高风险操作。

## Namefi 的视角

![色彩鲜艳的插图：可验证、防篡改的域名所有权——一张由绿色盾牌保护的域名卡片、一枚绿色 Namefi 代币，以及 DNS 的连续性](../../assets/the-curve-finance-dns-hijack-03-namefi-angle.jpg)

从根本上看，Curve 劫持事件是一个关于**谁控制名称**的问题——以及这种控制如何能被清晰地验证、持有和恢复。

在传统模式下，对域名的控制是一个脆弱的组合：一个注册商账户、一组域名服务器记录，以及一条你必须默默信任的供应商链。当这条链中的任何一个环节被入侵——就像 iwantmyname 的域名服务器据信所发生的那样——合法所有者可能在从未犯任何错误的情况下，失去对自己名称的实际控制权，而没有任何清晰的、防篡改的记录来说明*究竟是什么被改动、在何时改动*。

[Namefi](https://namefi.io) 建立在这样的理念之上：域名应该像互联网原生资产一样运作——所有权和控制权可以做到可验证、可审计、防篡改，同时与 DNS 保持兼容。Curve 事件更深层的教训不是"DeFi 不安全"，而是**域名层是承载安全的关键基础设施**，而它多年来一直被当作装饰品对待。无论你运营的是 DeFi 协议、在线商店还是博客，用户输入的名称就是一个承诺——而这个承诺的完整性，只取决于其背后控制面的可靠程度。

Curve 的合约守住了 57 亿美元，毫发无伤。域名在一个下午就失守了半百万。这个落差，就是全部的故事。

## 参考资料与延伸阅读

- CertiK — [Curve Finance 黑客事件分析](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)
- rekt.news — [Curve Finance — REKT](https://rekt.news/curve-finance-rekt)
- Cointelegraph（via TradingView）— [什么是 DNS 劫持？它如何攻陷 Curve Finance 的网站](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)
- Cryptopotato — [Curve Finance 就前端遭入侵发出警告，盗窃金额达 57 万美元](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)
- Coingape — [Curve Finance DNS 遭劫持，攻击者从用户钱包窃取 57 万美元](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)
- Tronweekly — [Curve Finance 黑客通过 DNS 劫持盗取 57 万美元](https://www.tronweekly.com/curve-finance-dns-hijacking/)
- CryptoDaily — [Curve Finance DNS 遭黑客攻击后要求用户撤销近期合约授权](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)
