---
title: 'SushiSwap MISO 内部人员攻击事件：一次恶意提交如何从代币拍卖中窃取约 300 万美元'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2021 年 9 月，一名匿名承包商通过恶意代码提交，将自己的钱包地址悄悄植入 SushiSwap MISO 发射台的前端，从 Jay Pegs Auto Mart 拍卖中转移了 864.8 ETH（约 300 万美元）。本次 Domain Mayday 深入探讨了代码供应链、前端信任以及它在可验证所有权方面带来的启示。'
keywords: ['sushiswap miso 黑客攻击', 'miso 供应链攻击', 'aristok3', 'jay pegs auto mart', 'defi 前端攻击', '864.8 eth', '软件供应链', '恶意提交', '内部威胁', 'auctionwallet', 'joseph delong', 'web 供应链安全', '域名安全']
---

大多数攻击都是破门而入，而这一次却是堂而皇之地从正门走进来的。

2021 年 9 月，运营 SushiSwap MISO 发射台（Launchpad）的团队没有遭遇钓鱼攻击，没有丢失私钥，也没有发布存在漏洞的智能合约。他们做了一件再平常不过的事：信任了一位贡献者。一名拥有代码提交权限的匿名承包商将自己的钱包地址写进了拍卖前端页面，推送了代码，然后让部署管道完成了剩下的工作。当一场 NFT 拍卖结算时，大约 **864.8 ETH（约合 300 万美元）** 并没有流向发起销售的项目方，而是流向了那个悄悄篡改资金去向的开发者。

没有漏洞利用，也没有零日漏洞。只有一行无人复核的代码，由一个本该是团队成员的人签名提交。

这是 Domain Mayday 第 15 期。在这个故事里，智能合约仅仅是个边缘角色。它的核心是一个关于大多数人从未审计过的 Web 组成部分的故事：代码供应链、前端页面，以及一个令人不安的事实——“谁有权修改代码？”是一个与“谁掌握着私钥？”同等严峻的安全问题。

## 对发射台代码的信任

像 MISO（Minimal Initial SushiSwap Offering）这样的 DeFi 发射台，存在的意义就是把一件事做好：从素不相识的大众那里筹集资金，并将其路由给开展代币或 NFT 销售的项目方。为了实现这一点，它将链上经过审计的智能合约和链下的 Web 前端结合在一起。用户与前端进行交互，而前端告诉用户的钱包应该签署什么交易。

这种接缝处正是最薄弱的软肋。人们痴迷于智能合约层，因为那里有安全审计、漏洞赏金和各种头条新闻。但是前端——决定拍卖资金应支付给*哪个地址*的 JavaScript 代码——仅仅是代码库中的代码，由流水线部署，并可由任何拥有写入权限的人进行编辑。你可以尽情审计“金库”，但如果内部人员可以随意篡改“请在此存款”的指示牌，那么金库再坚固也无济于事。

MISO 的代码是开放且协作的，这也是加密基础设施的一贯作风。这种开放性是一个优势：它吸引贡献者，加速产品发布，并让一个小型核心团队发挥出远超其规模的影响力。然而，这也正是供应链攻击者梦寐以求的攻击面。如果你能直接被邀请参与贡献，又何必费尽心机去强行突破呢。

## 2021 年 9 月：恶意代码提交

![Vivid colorful concept art of a single tampered brick, glowing red, being quietly swapped into an otherwise clean open-source brick wall by an anonymous gloved hand](../../assets/the-sushiswap-miso-insider-attack-01-attack.jpg)

2021 年 9 月 17 日星期五，SushiSwap 时任首席技术官 Joseph Delong 在 Twitter 上解释了发生的事情。CoinDesk 的报道非常直白：Delong 表示，[一名使用 GitHub 账号“AristoK3”的匿名承包商在一次供应链攻击中，将恶意代码注入了 Miso 的前端](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=an%20anonymous%20contractor%20using%20the%20Github%20handle)。

攻击手法简单得近乎对安全底线的侮辱。正如 Delong 所描述的，攻击者[用自己的钱包地址替换了拍卖的钱包地址](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=replaced%20the%20auction%27s%20wallet%20address%20with%20their%20own)。PYMNTS 则准确地使用供应链术语描述了这一行为：该承包商[推送了一次恶意代码提交，并被分发到了平台的前端](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=pushed%20a%20malicious%20code%20commit%20that%20was%20distributed%20on%20the%20platform%27s%20front%20end)。

该事件的事后分析报告用一句话抓住了本质：一位受雇参与拍卖项目开发的开发者[将自己的钱包地址插入到了合约中，而不是使用原本的 auctionWallet（拍卖钱包）](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=inserted%20his%20own%20wallet%20address%20into%20the%20contract%20instead%20of%20the)——他是通过修改前端在部署时输入的值来实现的，而不是通过攻破经过审计的链上逻辑。仅仅改动了一个变量。`auctionWallet` 本应指向发起销售的项目方。但他却让其指向了自己。竞拍者以为自己把钱发给了拍卖的受益人，但每一分钱却流向了别处，而在此过程中，代码的运行表面上看起来完全正常。

## 转移的资金：约 864.8 ETH，约 300 万美元

目标是一场近乎滑稽的单一拍卖。据 CryptoSlate 报道，MISO 遭受了一次供应链攻击，[从 'Jay Pegs Auto Mart' 代币拍卖合约中抽走了 864.8 ETH](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=drained%20864.8%20ETH%20from%20the)。Jay Pegs Auto Mart 是一个将自己包装成二手车经销商的 NFT 艺术项目——表面上是充满玩味的加密文化布景，但从财务角度来看，却是一场非常真实的代币销售。

各大媒体报道的数字完全一致。PYMNTS 报道称，[黑客将 864.8 枚以太坊代币（约 300 万美元）转移到了自己的钱包中](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=transferred%20864.8%20Ethereum%20coins)。The Crypto Times 指出，攻击者[抽走了 864.8 ETH](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=drained%20864.8%20ETH)，并且[迄今为止，唯一被黑客攻击和利用的拍卖项目是 Jay Pegs Auto Mart](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=The%20only%20auction%20project%20that%20has%20been%20hacked%20and%20exploited)。

最后一个细节至关重要。被投毒的代码是通过前端分发的，这意味着在原则上，它可以重定向它所接触的*任何*拍卖项目。而在实际情况中，在团队发现问题之前，只有 Jay Pegs Auto Mart 的资金结算到了攻击者的地址。其他受影响的拍卖项目在资金被抽走之前及时打上了补丁——仅仅几个小时的差距，就决定了这只是一条负面新闻，还是一场毁灭性的灾难。

## 事情是如何发生的：内部信任，而非被破坏的锁

![Vivid colorful concept art of an insider in shadow quietly twisting a glowing money pipe so its flow spills into a private bucket instead of the intended tank](../../assets/the-sushiswap-miso-insider-attack-02-malicious-commit.jpg)

抛开加密领域的词汇，这是一次典型的软件供应链攻击——与被投毒的 npm 包或被篡改的构建服务器属于同一类别，只不过这次的收益是以 ETH 计价的。

信任链是这样的：一位贡献者被授予了实盘拍卖代码的写入权限。他们利用该权限提交了一次更改，替换了目标地址。部署管道照常运转——它获取最新代码，并将其传送到真实用户在浏览器中加载的前端。这些用户连接他们的钱包，签署前端提示他们签署的内容，并为一个受益人已被暗中修改的拍卖提供资金。Coinspeaker 的描述与其他媒体一致：[一名使用 GitHub 账号 AristoK3 的匿名承包商将恶意代码注入了 Miso 前端](https://www.coinspeaker.com/sushiswap-miso-attack-nft/#:~:text=an%20anonymous%20contractor%20with%20the%20GH%20handle%20AristoK3%20injected%20malicious%20code%20into%20the%20Miso%20front%20end)。

请注意这次攻击*不需要*什么。攻击者不需要寻找智能合约中的缺陷。他们不需要窃取私钥或从外部攻破服务器。他们只需要一样东西：获得足够的信任去修改代码。事件报告的定性非常准确——[Miso 前端成为了供应链攻击的受害者](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=The%20Miso%20front%20end%20has%20become%20the%20victim%20of%20a%20supply%20chain%20attack)——由一名使用 GitHub 账号 AristoK3 的匿名承包商实施，他[将恶意代码注入了 Miso 前端](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=injected%20malicious%20code%20into%20the%20Miso%20front%20end)。

这正是内部供应链攻击如此危险的原因。防火墙、安全审计、金库多重签名——每一个外部防御措施都基于这样一个假设：威胁来自外部并试图闯入。而拥有提交权限的内部人员早已越过了这一切。恶意更改顺着项目自身受信任的合法部署流程，直驱生产环境。部署管道并未被破坏。它只是被*利用*了。

## 响应与恢复：抓捕、点名和退款

SushiSwap 的反应迅速、公开且态度强硬。Delong 并没有在私下里默默调查；他直接公布了攻击者的 GitHub 账号，指出了其可能的真实身份，并设定了最后期限。据 CoinDesk 报道，这份警告非常明确：如果资金不被归还，这家 DeFi 交易所将[向 FBI 报案](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=file%20a%20complaint%20with%20the%20FBI)。

这奏效了。攻击者改变了主意。CryptoSlate 报道称，就在团队公开此事几小时后，[黑客向原始的 MISO 合约归还了 865 ETH](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=the%20hacker%20returned%20865%20ETH%20to%20the%20original%20MISO%20contract)——甚至比被转移走的 864.8 ETH 还要稍微*多一点*。The Crypto Times 确认了资金的去向：[Sushiswap 的多签地址收回了 865 ETH](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=the%20multisign%20address%20of%20Sushiswap%20got%20865%20ETH%20back)。Delong 自己更新的事件状态也和最初的警告一样简明扼要。Decrypt 记录了他的确认，大约在一天之内，[所有资金均已退还](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum#:~:text=All%20funds%20returned)。

这个大团圆结局需要打个星号。资金被追回并非因为系统架构拦截了盗窃行为，而是因为在公众曝光的聚光灯和切实的执法威胁下，攻击者选择主动归还。公共账本上的假名机制是一把双刃剑：它让承包商可以匿名作案，但也意味着转移资金的链上踪迹对所有人公开可见，而这正是让归还资金成为阻力最小路径的关键筹码。在这里，追回资金是一次谈判，而非一种保障。下一个内部人员可能就不会那么轻易妥协了。

## 这对代码供应链和前端信任的启示

以 DeFi 的标准来看，MISO 事件涉及的金额很小，但带来的教训却极为深刻。以下是值得我们汲取的几点经验：

1. **前端是你安全边界的一部分。** 用户签署的是界面提示他们签署的内容。如果攻击者控制了界面显示的地址，他们根本就不需要接触智能合约。仅审计链上代码，意味着只审计了系统的一半。
2. **写入权限才是真正的攻击面。** 如果有权修改代码的人决定作恶，哪怕是世界上最强的密码学也无济于事。“谁能修改它，在发布前由谁来复核？”不仅是一个流程细节，更是核心的安全控制机制。
3. **强制代码审查不是官僚主义——它是防御措施。** 只要对替换 `auctionWallet` 的代码提交进行强制性的交叉复核，很可能就能在源头阻止这一切。供应链攻击往往在部署前无人独立检查的变更中滋生。
4. **化名贡献者增加了风险。** 开放的社区贡献是一种优势，但将影响部署的权限授予匿名身份，意味着你在信任无法完全溯源的代码。信任的建立应当基于不断强化的验证机制，而不能仅仅依靠参与者的热情。
5. **追回资金靠的是运气，而不是架构。** 资金能被追回是因为公众舆论的压力和可追踪的账本。一个*依赖*攻击者善意的系统设计，根本就不算是安全设计。

核心的教训是：确保“*谁有权做出更改*”和“*验证最终部署的就是那项更改*”的完整性，与任何密码学密钥一样，是系统的承重墙。供应链信任不是一个柔性的文化问题，它是系统坚硬的安全边界。

## Namefi 的视角

![Colorful illustration of verifiable, tamper-resistant ownership — secured by a green shield, a green Namefi token, and continuity](../../assets/the-sushiswap-miso-insider-attack-03-namefi-angle.jpg)

MISO 损失资金的原因是，*价值流向的目的地*可以被系统信任的人悄悄篡改，并且在上线前没有人验证这一改动。这种故障模式并非 DeFi 发射台所独有。它与域名的情况如出一辙——只要掌握了合适的访问权限（无论是注册商账户、内部面板还是拥有凭证的承包商），域名的所有权或 DNS 记录就能被悄然篡改。

域名是互联网上最重要的“目的地”设置之一。其 DNS 记录决定了你的流量、你的电子邮件和你的用户实际去向哪里。如果内部人员或被入侵的账户可以更改这些记录，且没有防篡改、可独立验证的变更记录来追踪谁修改了什么，那么你就面临着穿上了新马甲的 MISO 难题：门锁完好无损，但门上的指示牌却被偷换了。

[Namefi](https://namefi.io) 解决这一问题的方法是，将域名所有权视为一项可验证、防篡改的资产，而不是某人私人账户中的一条记录。代币化的所有权使得控制权在链上变得可审计且可转移，同时保持与 DNS 的兼容性——因此，“谁拥有它，谁被允许更改它”就成了你可以验证的事实，而不是必须盲目授予的信任。MISO 的承包商之所以能重写支付地址，正是因为系统对于“这项更改是否经过授权？”缺乏一种强制且可独立核查的机制。Namefi 从供应链攻击中汲取的教训是：所有权和控制权在设计上就应当是可被证明的，只有这样，*受信任*和*经过验证*之间危险的真空地带才永远不会出现。

## 参考资料与延伸阅读

- CoinDesk — [SushiSwap MISO 发射台被盗 300 万美元以太坊](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad)
- Decrypt — [SushiSwap 代币发射台遭黑客攻击，损失超过 300 万美元以太坊](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum)
- CryptoSlate — [黑客归还从 Sushi 代币发行平台 MISO 窃取的 865 ETH](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/)
- PYMNTS — [SushiSwap 加密平台遭遇 300 万美元黑客攻击](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/)
- The Crypto Times — [Sushiswap Miso 发射台在攻击中损失 300 万美元](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/)
- Coinspeaker — [SushiSwap 发射台 Miso 遭攻击，864.8 ETH NFT 项目资金被洗劫](https://www.coinspeaker.com/sushiswap-miso-attack-nft/)
- CryptoBriefing — [Sushi 初始发行发射台遭遇 300 万美元漏洞攻击](https://cryptobriefing.com/sushiswaps-miso-token-launchpad-suffers-3m-exploit/)
- CryptoPotato — [又一起 DeFi 黑客事件：SushiSwap 代币平台被盗 300 万美元 ETH](https://cryptopotato.com/another-defi-hack-3m-in-eth-stolen-from-sushiswaps-token-platform/)
- Quadriga Initiative — [SushiSwap MISO Jaypegs Automart 案例研究](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php)