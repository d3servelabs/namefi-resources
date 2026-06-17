---
title: 'Curve Finance DNS 劫持事件：当“经过审计的合约”也守不住前门'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2022 年 8 月，Curve Finance 的智能合约安然无恙，但攻击者在其注册商处劫持了 curve.fi 域名，克隆了网站，并从用户手中窃取了约 57 万美元。本文深入剖析了这场针对 DeFi 前端的 DNS 攻击，探讨它给域名安全带来了哪些启示。'
keywords: ['Curve Finance DNS 劫持', 'curve.fi 劫持', 'DeFi DNS 劫持', 'iwantmyname 遇袭', '域名服务器遇袭', '钱包窃取器', 'DeFi 前端攻击', '域名安全', 'DNS 安全', '加密货币网络钓鱼', '克隆网站攻击', '注册商账户被盗', '域名紧急状态']
---

智能合约完好无损。

这是了解 2022 年 8 月 9 日 Curve Finance 事件时首先需要明白的一点，也是多年后仍让安全工程师们感到不安的地方。Curve 的链上代码——那个经过严格审计、久经沙场且持有数十亿美元稳定币的自动做市商——根本没有被触碰过。没有重入漏洞。没有预言机操纵。没有闪电贷漏洞利用。区块链完美执行了它应尽的职责。

然而，用户仍损失了大约 **57 万美元**。

攻击并没有通过合约进行。它来自**域名**。有人在注册商层面接管了 `curve.fi` 的控制权，将其指向一个连接着钱包窃取器（wallet-drainer）的克隆网站，然后让协议本身的良好声誉去完成剩下的工作。Curve 曾经通过的每一项安全审计都变得毫无意义，因为攻击者根本没有敲那扇门。他们直接从前门走了进来——那个用户不假思索就会输入的网址。

这是《Domain Mayday》系列第 13 期。这个故事讲述了：即便系统中最安全的部分安然无恙，那个每个人都*盲目信任*的部分——域名——是如何悄然沦为攻击面的。

## “经过审计的合约”保护不了前门

DeFi 领域花了很多年时间建立起智能合约的安全文化。审计成为了基本门槛。漏洞赏金规模达到了数百万美元。“在 Etherscan 上验证”成为了信任的标志。行业的集体共识逐渐固化为这样一种观念：*只要合约是安全的，协议就是安全的。*

但用户几乎从不直接与合约交互。他们访问的是网站。他们输入 `curve.fi`，浏览器将该名称解析为 IP 地址，加载出一个页面，然后该页面告诉他们的钱包该签名什么。所有这些步骤都发生在哪怕一行经过审计的 Solidity 代码执行*之前*——并且所有这些步骤都依赖于审计从未覆盖的基础设施。

域名就是这条链路中的第一环。它也是大多数团队采用“设置后即忘”态度的环节：注册一次，指向 DNS，然后就抛诸脑后。正如事件发生后的一篇分析文章所言，这种攻击[“利用了用户与去中心化应用界面之间的信任层”](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)，而不是去入侵协议的区块链。合约本身可以完美无缺，但如果攻击者控制了 `curve.fi` 的*指向*，那么一切都无济于事。

## 2022 年 8 月 9 日：劫持事件

![Vivid colorful concept art of a storefront whose address sign is being swapped to redirect shoppers into an identical fake shop with a hidden trapdoor floor, warm and cool tones, surreal security metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-01-hijack.jpg)

2022 年 8 月 9 日下午，Curve 的主要前端已经不再属于 Curve 了。

CertiK 的事件后分析准确地锁定了时间线：[“美国东部时间 2022 年 8 月 9 日下午 4:20 左右，Curve Finance 的 DNS 记录遭到破坏，并指向了一个克隆的恶意网站。”](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) 对于任何访问 `curve.fi` 的人来说，一切看起来都很正常。页面正常渲染，Logo 也在那里。资金池、界面、配色——所有细节都被忠实地复刻了。

但这背后有着彻底且隐形的差异：用户浏览器中加载的网站已不再由 Curve 提供服务。它是一个克隆体，部署在攻击者的基础设施上，静候着有人连接钱包。

安全研究员 Lefteris Karapetsas 毫不避讳地描述了其攻击机制——攻击者[“克隆了该网站，让 DNS 指向部署了克隆网站的攻击者 IP，并向一个恶意合约添加了授权请求。”](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) Cointelegraph 随后的分析文章也描述了相同的模式：[“攻击者克隆了 Curve Finance 网站并干扰了其 DNS 设置，将用户引导至该网站的复刻版本。”](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

然后，他们开始守株待兔。

## 用户损失了什么

当用户访问这个克隆网站并尝试使用它时，页面会请求他们的钱包执行一个在合法 DeFi 网站上每天要执行数千次的操作：授权（approve）一种代币。根据 CertiK 的报告，[“攻击者在该网站中注入了恶意代码，要求用户向一个未经审计的合约授予代币授权。”](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Coingape 用更通俗的语言描述了这个陷阱：[“黑客设法在主页上部署了一个恶意合约，一旦受害者进行授权，该合约就会将用户钱包洗劫一空。”](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)

授权代币额度让人感觉只是常规操作。这与用户在合法的交易所进行兑换时所点击的操作如出一辙。但在这里，被授权的合约属于攻击者——一旦授权通过，它就能把受害者的稳定币转移走。

链上的账目非常清晰。CertiK 报告称[“共有 7 名用户受到该漏洞的波及，导致约 61.2 万美元的损失”，](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) 具体金额为 [“612,724.16 美元的 USDC 和 DAI”，](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) 随后黑客将其兑换成了 ETH。rekt.news 采用了一个更近似且被广泛引用的数字：[“被盗资金（共计 340 ETH，约合 57.5 万美元）。”](https://rekt.news/curve-finance-rekt) 大多数同期的报道也落在这个区间内——Cryptopotato 报道称[黑客窃取了价值约 57 万美元的 ETH](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)；CryptoDaily 指出[黑客窃取了超过 57.3 万美元](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)。确切的总额会因快照拍摄的时间和 ETH 的定价方式而略有偏差。但事件的整体轮廓是不变的：几十万美元的损失，涉及少数受害者，而行窃的网站看起来与他们所信任的网站一模一样。

这里才是最值得深思的部分。Tronweekly 精准地捕捉到了这一点：这次攻击[“没有触及 Curve 的以太坊智能合约，也没有动用其中存储的 57 亿美元资产。”](https://www.tronweekly.com/curve-finance-dns-hijacking/) 57 亿美元的协议资产，完全安全。正如同一篇文章所指出的，Curve 本身[“毫发无损，没有遭受任何损失。”](https://www.tronweekly.com/curve-finance-dns-hijacking/) 协议赢了。用户却输了。因为攻击从未针对过协议本身。

## 它是如何发生的：问题出在域名，而不是链上

![Vivid colorful concept art of a telephone switchboard operator secretly rerouting one glowing call cable to a counterfeit identical building, neon cables and circuits, surreal DNS rerouting metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-02-dns-compromise.jpg)

那么，攻击者是如何让 `curve.fi` 解析到*他们*的服务器，而不是 Curve 的服务器呢？

让我们从 DNS 的作用说起。像 `curve.fi` 这样的域名是一个对人类友好的标签，而计算机需要的是 IP 地址。域名系统（DNS）是负责将一种信息转化为另一种信息的查询层——Cointelegraph 的文章将其比作[“一本电话簿”](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)，能够[“将这些方便用户记忆的域名转换为计算机建立连接所需的 IP 地址。”](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) DNS 劫持意味着篡改了这种查询机制，让电话簿给出了错误的号码——[“改变了 DNS 查询的解析方式，在用户不知情的情况下将他们重新路由到恶意网站。”](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

关键在于，你不需要入侵用户的计算机就能做到这一点。你只需改变源头的权威应答——也就是该域名所委托的**域名服务器（nameserver）**。而这个源头掌握在域名注册商手中。

Curve 的创始人 Michael Egorov 毫不含糊地指出了故障的根源。正如 rekt.news 所引述的那样，[“DNS 注册商 iwantmyname 的域名服务器遭到了入侵”，](https://rekt.news/curve-finance-rekt)团队的判断是[“Curve 认为底层的域名服务器遭到了入侵，而不是账户级别的漏洞。”](https://rekt.news/curve-finance-rekt) 换句话说：这（就 Curve 所知）并不是 Curve 自己的注册商账户密码被盗。问题出在更深的一层——注册商自己运营的域名服务器基础设施上。Cointelegraph 随后的文章证实了该注册商的名称，并指出该项目[“在之前的攻击中使用的也是同一家注册商‘iwantmyname’。”](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

这一区别对于吸取教训至关重要。一个团队可以强制使用强密码，启用双重身份验证，并完美地锁定自己的注册商登录——但如果底层的域名服务器遭到入侵，他们**依然**会失去对域名的控制。域名所有者未必犯了错。只是他们对底层设施的信任被打破了。Cointelegraph 对这类攻击原理的总结道出了这一普遍风险：[“如果由于凭据被盗或注册商漏洞导致网站的映射发生改变，用户可能会在不知不觉中被重定向到有害的服务器。”](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

一旦域名服务器用攻击者的 IP 进行了应答，剩下的事情就自然发生了。每个输入 `curve.fi` 的用户都被悄悄地引向了克隆网站。电话簿被篡改了，而几乎没有人会去核对电话簿。

## 应对与善后

Curve 团队行动迅速，而他们的应对措施之所以具有指导意义，恰恰在于他们能做什么以及不能做什么。

他们立即**能做**的，是发出警告。团队坦率地告诉用户：[“请不要执行任何授权或兑换操作。我们正在尽力定位问题，但目前为了您的安全，请不要使用 curve.fi 或 curve.exchange。”](https://www.tronweekly.com/curve-finance-dns-hijacking/) 他们将用户引向了之后确认安全的备用域名——[“在 https://curve.fi 的解析恢复正常之前，请暂时使用 https://curve.exchange”](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)——因为 `curve.exchange` 运行在不同的基础设施上，没有受到污染。

他们**不能**立即做到的，是挽回已经发生的影响。他们更改了域名服务器，但 DNS 并不是在全球范围内瞬间同步更新的。正如 rekt.news 所指出的，[“黑客的镜像网站很快被下线，但一些域名服务器仍有待更新。”](https://rekt.news/curve-finance-rekt) 在一段时间内，即使修复措施已经生效，世界各地的缓存仍会继续提供那个旧的恶意应答。这种传播延迟是 DNS 的固有属性——也是攻击者的天然优势。

对于已经授权了恶意合约的用户来说，唯一的防御手段就是撤销授权。这条消息在各个渠道被反复传达：[“如果您在过去几小时内在 Curve 上授权了任何合约，请立即撤销。”](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) rekt.news 公布了用户需要撤销的特定窃取器地址——`0x9eb5f8e83359bb5013f3d8eee60bdce5654e8881`——以便受害者能在更多资金被盗之前切断授权额度。

被盗资金通过常见的洗钱渠道被分散转移。CertiK 追踪了资金流向——[“FixedFloat: 292 ETH, Tornado Cash: 27.7 ETH, Binance: 20 ETH”](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)——并指出了一个时机上的巧合：由于 Tornado Cash 就在几天前刚被 OFAC 制裁，[“OFAC 最近对 Tornado Cash 的制裁很可能让黑客感到担忧，以至于将大部分被盗资金发送到了中心化交易所 FixedFloat。”](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) 这个选择起到了帮助作用：rekt.news 报道称，在发送到 FixedFloat 的资金中，有 [112 枚 ETH 被冻结](https://rekt.news/curve-finance-rekt)。几个小时内，Curve 证实[“问题已找到并被修复。”](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)

## 关于 DeFi 前端 DNS，这次事件教会了我们什么

Curve 事件是一堂生动紧凑的课，揭示了 DeFi 真实的攻击面在哪里。以下几点启示不仅适用于 Curve，对整个行业都具有普遍意义：

1. **您的域名是安全边界的一部分。** 人们很容易将域名视为营销基础设施——将其当作一个标签，而不是一个系统。但域名是用户浏览器遵循的第一道指令。如果这道指令错了，下游的一切就都错了。仅仅止步于智能合约边界的审计，会让这个最受信任的环节失去保护。

2. **注册商和域名服务器的安全位于您的上游。** Curve 自身账户的安全卫生可能做得很好；被攻破的环节据信是在域名服务器层。您其实继承了 DNS 链条中每一个提供商的安全态势。请选择支持注册商锁定、强大的账户保护功能以及（理想情况下）支持 DNSSEC 的注册商和 DNS 主机——并且要明白，即使做到了这些，您仍然在信任一个您无法完全控制的层级。

3. **用户看不见 DNS。** 克隆网站看起来一模一样，因为*名称*就是一模一样的。绿色安全锁标志还在；URL 也是对的。细心用户平时会检查的所有地方都不会显示异常。这就是为什么 DNS 劫持连经验丰富的高端用户也能轻易骗过——欺骗发生在人类肉眼可核查的层级之下。

4. **准备一个干净的备用方案。** Curve 的幸存要归功于部署在独立基础设施上的 `curve.exchange`。第二条前端路径——不同的域名、不同的 DNS 提供商、基于 IPFS 或 ENS 的镜像——让您在主域名受到污染时，还能有个安全的地方引导用户。

5. **代币授权就是有效载荷（payload）。** 此类前端攻击的结局如出一辙：伪装成对恶意合约进行看似常规的授权。钱包、界面和用户都需要将新加载页面上的授权提示视为高风险操作对待。

## Namefi 的视角

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-curve-finance-dns-hijack-03-namefi-angle.jpg)

追根溯源，Curve 劫持事件其实是一个关于 **谁控制了域名** 的问题——以及这种控制权能够多干净利落地被验证、持有和恢复。

在传统模式中，对域名的控制是由一系列脆弱的组件拼凑而成的：一个注册商账户、一组域名服务器记录，以及一条你必须默默信任的提供商链条。当这条链中的任何一个环节遭到破坏时——正如 iwantmyname 域名服务器被认为的那样——合法所有者哪怕没有犯任何错误，也可能失去对自己域名的实际控制权，而且没有明显的、防篡改的记录来证明*在何时发生了什么改变*。

[Namefi](https://namefi.io) 的构建理念是：域名应该像互联网原生资产一样运作——在保持与 DNS 兼容的同时，使其所有权和控制权变得可验证、可审计且防篡改。Curve 事件带来最深刻的教训并不是“DeFi 不安全”。而是 **域名层是一项承重级别的安全基础设施**，但在过去很多年里，它一直被当作装饰品对待。无论您运营的是 DeFi 协议、在线商店还是个人博客，用户输入的名字本身就是一份承诺——而这份承诺的完整性，仅仅取决于其背后的控制面有多牢固。

Curve 的智能合约守住了 57 亿美元，毫发无损。而域名却在一个下午就拱手交出了近 60 万美元。这种反差，就是整个事件的缩影。

## 参考资料与进一步阅读

- CertiK — [Curve Finance 黑客事件分析 (Curve Finance Hack Incident Analysis)](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)
- rekt.news — [Curve Finance 遭遇 Rekt (Curve Finance — REKT)](https://rekt.news/curve-finance-rekt)
- Cointelegraph (via TradingView) — [什么是 DNS 劫持？它是如何搞垮 Curve Finance 网站的 (What is DNS hijacking? How it took down Curve Finance's website)](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)
- Cryptopotato — [因 57 万美元失窃，Curve Finance 就受损前端发出警告 (Curve Finance Issues Warning About Compromised Front End Amid $570K Theft)](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)
- Coingape — [Curve Finance DNS 遭劫持，攻击者从用户钱包窃取 57 万美元 (Curve Finance DNS Hijacked, Attackers Stole $570K from User Wallets)](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)
- Tronweekly — [Curve Finance 黑客通过 DNS 劫持掠夺 57 万美元 (Curve Finance's Hackers Loot $570K Via DNS Hijacking)](https://www.tronweekly.com/curve-finance-dns-hijacking/)
- CryptoDaily — [DNS 被黑后，Curve Finance 呼吁用户撤销近期的合约授权 (Curve Finance Asks Users To Revoke Recent Contracts After DNS Hack)](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)