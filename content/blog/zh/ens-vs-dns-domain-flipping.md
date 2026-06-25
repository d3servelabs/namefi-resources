---
title: "ENS 域名翻转 vs DNS 域名翻转：差别在哪里"
date: '2026-06-24'
language: zh
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 33
format: comparison
description: "翻转 ENS 的 .eth 名称与翻转传统 DNS 域名有何不同：所有权、流动性、续费、Gas，以及各自适合做什么。"
ogImage: ../../assets/ens-vs-dns-domain-flipping-og.jpg
keywords: ['ENS vs DNS', '翻转 ENS 域名', 'ENS 域名翻转', '.eth 域名投资', '翻转 .eth 名称', 'ENS vs 传统域名', '链上域名翻转', 'NFT 域名流动性', 'ENS 续费费用', 'ERC-721 域名', 'web3 域名翻转', '在 OpenSea 上出售 ENS', 'ENS 到期宽限期', '代币化域名翻转', 'ENS Gas 费用']
---

如果你做域名翻转，那你大概一直在场边观望 [ENS](/zh/glossary/ens/) 市场，并琢磨这是不是同一套玩法换了层新漆。其实不是。翻转一个 `.eth` 名称和翻转一个传统 `.com` 在韵脚上相似——便宜买进一个好字符串，卖给比你更需要它的人——但底层几乎处处不同：谁能看到你的所有权、一笔交易如何结算、你为持有这个名称要付出什么，乃至"拥有"它到底意味着什么。本文带你走一遍真正的差别，好让你判断你的时间和资金到底该投在哪里。

先澄清一点，因为这个领域很容易混淆。ENS 的 `.eth` 名称和**代币化 DNS 域名**不是一回事。`.eth` 名称完全活在[链上 (On-chain)](/zh/glossary/on-chain/)，没有解析器或桥接就无法在普通浏览器里解析。而代币化的 `.com` 是一个真实的 [ICANN](/zh/glossary/icann/) 域名，*同时*还携带一个链上代币——凡是 `.com` 能解析的地方它都能解析。我们在[代币化域名 vs web3 域名](/zh/blog/tokenized-domain-vs-web3-domain/)以及 [ENS vs Unstoppable vs 代币化 DNS](/zh/blog/ens-vs-unstoppable-vs-tokenized-dns/) 的对比中深入剖析了这三方分野。本文专门讨论 ENS 的 `.eth` 翻转与传统 DNS 翻转之间的对比——但请把第三类记在心里，因为它借鉴了两者各自最好的特性。

## 你实际买到的是什么

![自托管的 NFT 名称代币与钥匙被握在你手中的钱包里，对比由第三方锁定的、租用的注册商登录账号与租约文件的编辑插画](../../assets/ens-vs-dns-domain-flipping-01-custody.jpg)

传统 DNS 域名是一种注册：你付钱给一家经 ICANN 认证的[注册商](/zh/glossary/registrar/)，你的名称就躺在一个注册局数据库里。你并不彻底拥有这个字符串——你持有的是一份可续期的租约，而控制入口就是一个注册商登录账号。

ENS 名称在本质上不同。正如 ENS 文档所说，[以太坊域名服务（ENS）是一个基于以太坊区块链的分布式、开放、可扩展的命名系统](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)。一个已注册的 `.eth` 名称是一个 [NFT（非同质化代币）](/zh/glossary/nft/)——具体来说是一个住在你[钱包](/zh/glossary/wallet/)里的 [ERC-721](/zh/glossary/erc-721/) 代币。ENS 文档明确指出，用户可以[像转移任何其他 ERC721 代币一样转移自己的名称](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)。它底层的标准 ERC-721，是[一套面向非同质化代币（也称契据）的标准接口](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)，它[提供了追踪和转移 NFT 的基本功能](https://eips.ethereum.org/EIPS/eip-721#:~:text=This%20standard%20provides%20basic%20functionality%20to%20track%20and%20transfer%20NFTs)。

所以第一个差别是托管。在 DNS 里，注册商掌握着你账号的钥匙，注册局保存着权威记录。在 ENS 里，[智能合约](/zh/glossary/smart-contract/)保存着记录，而*你*掌握着钥匙。正如我们后面会看到的，这对翻转者来说是把双刃剑——它在交易中去掉了一个中间人，却把全部[托管](/zh/glossary/custodial-ownership/)的重担压在了你自己的[助记词](/zh/glossary/wallet/)上。

## 所有权是公开、链上、可审计的

当你买一个 `.com` 时，所有权是半私密的。WHOIS 数据往往被打码，转移历史不透明，买家在很大程度上只能听信你的一面之词——相信这个名称是干净、无负担的。

ENS 把这一切反转过来。由于每一次注册、转移和销售都是一笔链上交易，一个名称的完整来历是公开且永久的。任何人都能读到是哪个[钱包](/zh/glossary/wallet/)持有 `crypto.eth`、它上一次易手是什么时候、价格是多少。对翻转者来说这是双刃剑。好处是：尽职调查变得轻而易举，造假很难，买家几秒钟就能验证你的所有权，无需一个[托管](/zh/glossary/escrow/)代理出面背书。坏处是：你的投资组合和成本基础对竞争对手一览无余，而一个暴露出"我是翻转者"信号的钱包，可能会招来更糟的还价。传统域名生意让你能保持低调；ENS 不行。

这种透明性，正是让链上名称更易于估值和以程序化方式交易的同一种属性——这个主题我们在[为链上域名估值](/zh/blog/appraising-onchain-domains/)中接着展开。

## 二级市场流动性：靠市场，而非靠经纪人

![在 NFT 市场店面里一步完成的原子互换，对比一条缓慢、多步、绕经中间人的托管路径的编辑插画](../../assets/ens-vs-dns-domain-flipping-02-settlement.jpg)

ENS 真正改变体验的地方就在这里。因为 `.eth` 名称是一个 ERC-721 代币，它天然兼容通用型 NFT [市场](/zh/glossary/marketplace/)——OpenSea、Blur 等等——无需任何专门的域名行业管道。你像挂出任何其他 NFT 一样把它挂出来，而一笔交易会通过市场的标准[智能合约](/zh/glossary/smart-contract/)完成结算。

这种结算正是最大的差别。一笔传统域名交易是一场跨越数日的编排：谈好价格、开设托管、买家打款、你在注册商处推动[转移](/zh/glossary/atomic-transfer/)、注册商确认、托管释放资金。而一笔 ENS 交易是一次[原子传输](/zh/glossary/atomic-transfer/)：买家的付款和你的代币在同一笔交易里互换，要么一起发生，要么都不发生。交易进行到一半时，没有第三方持有这件资产——这正是让代币化域名交易免托管的同一套机制，详见[代币化市场如何取代托管](/zh/blog/how-tokenized-marketplaces-replace-escrow/)以及更宏观的[链上域名市场对比](/zh/blog/onchain-domain-marketplaces-compared/)。

不过流动性有一个实打实的陷阱。NFT 市场对 *NFT* 来说是有流动性的，但一个 `.eth` 名称只能卖给特别想要这个名称、且本身已经是加密原住民的买家。一个好的 `.com` 可以卖给地球上任何一家企业；而一个好的 `.eth` 只能卖给那个小得多的人群——他们持有 ETH、运行着一个钱包、并看重一个链上名称。结算更快，但需求更稀薄。别把"转移瞬间完成"和"容易卖出"混为一谈。

## 续费与到期模型并不相同

![一张宽容的宽限期安全网接住一个正在坠落的域名吊牌，对比一个严苛的荷兰式拍卖时钟、价格不断下降、一只手抢注那个掉落名称的编辑插画](../../assets/ens-vs-dns-domain-flipping-03-expiry.jpg)

两套系统都向你收费以保留一个名称，但其机制在一些对投资组合很重要的地方分道扬镳。

传统 DNS 按注册商的条款运作。一个 [gTLD（通用顶级域名）](/zh/glossary/gtld/)注册最多可以持有十年——据维基百科，[一个 gTLD 域名的最长注册期限是 10 年](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)——而一个普通 `.com` 的续费定价并不高：维基百科指出，截至 2023 年，[零售成本通常从每年约 $9.70 起](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=the%20retail%20cost%20generally%20ranges%20from%20a%20low%20of%20about%20%249.70%20per%20year)。错过一次续费也有一张宽容的缓冲网——以周计的赎回窗口和宽限期，名称才会真正掉落。

ENS 采用基于长度的年费，以 ETH 支付。据 ENS 文档，五个字符及以上的名称每年约 $5，四个字符的名称约 $160，三个字符的名称约 $640——稀缺的短字符串收费更高，以遏制囤积（估算值以撰文时为准；ENS 价格以美元计价、以 ETH 结算，所以确切的 ETH 金额会随市场波动）。其到期路径更严苛、更具对抗性：一个名称失效之后，ENS 文档描述了一个[名称到期后 90 天（即宽限期之后）](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires)的窗口，之后它才会通过文档所称的[一场 21 天的荷兰式拍卖](https://docs.ens.domains/registry/eth/#:~:text=a%2021%20day%20dutch%20auction)重新变得可注册，在这场拍卖中，赎回价格从很高起步，逐步衰减至正常费用。对翻转者来说，那场拍卖既是风险（让一个有价值的名称失效，对手就能抢注），也是机会（一个有纪律的观察者可以在荷兰式价格下跌时抢回优质名称）。

实践上的要点是：ENS 比 DNS 更要求你严守续费纪律。它的宽限机制不那么宽容，而错过续费的后果也不是悄无声息的掉落——而是一场你的竞争对手都在盯着的公开拍卖。

## Gas 与结算成本

传统域名成本是可预测的：一笔固定的续费、偶尔的转移费、零星的托管抽成。你可以把一个投资组合的年度持有成本精确预算到美元。

ENS 加进了一个你无法控制的变量：Gas。每一个链上动作——注册、续费、转移、挂单——都是一笔以太坊交易，带着一笔随网络拥堵浮动的网络费用。在清淡的日子里这微不足道；但在繁忙的铸造或市场暴动期间，它可能让一个便宜名称上 $5 的续费相形见绌。这改变了低价值翻转的算账方式。续费两百个垃圾 `.com` 是一笔固定、可知的总额；而续费两百个低档 `.eth` 名称，花在 Gas 上的钱可能远超费用本身，而费用本身也随 ETH 价格上下摆动。二层网络和批处理工具能缓解这点，但核心论点依然成立：ENS 的持有成本比 DNS 更不平滑、更难预测，而这种不可预测性对任何跑量的人来说都是一笔实打实的成本。

## 各自适合做什么

两者都不绝对更好——它们适合不同的翻转者和不同的名称。

**传统 DNS 翻转**在你的买家是*企业*而非加密用户时占上风：一个为了网站、邮箱和谷歌排名而需要 `austinplumbing.com` 的最终用户。买家池就是整个经济体，这些名称在任何地方都零摩擦地可用，持有成本可预测，玩法也已成熟。代价是缓慢的、受托管约束的结算，以及不透明的所有权。大部分[域名翻转](/zh/blog/domain-flipping/)的手艺——寻源、[估值](/zh/blog/how-to-value-a-domain-name/)、外联——都是在这里打磨出来的。

**ENS 翻转**在名称的价值*原生于加密*时占上风：一个干净的钱包身份、一个协议或 DAO 的标识、一个短小的可收藏字符串。结算是原子的，所有权是自托管的，资产可与链上应用组合。代价是更窄的买家池、Gas 敞口、更严苛的到期规则，以及对自己钥匙的全部责任——丢了钱包名称就没了，这正是为什么[钱包丢失后找回链上名称](/zh/blog/recovering-a-tokenized-domain-after-wallet-loss/)和[多重签名](/zh/glossary/multi-sig/)托管在这里远比在 DNS 里重要得多。

还有第三条不必二选一的路。一个**代币化 DNS 域名**——一个真实的 `.com` 顶上叠了一个链上代币——同时给了你 DNS 的全球买家池*和* ENS 的原子、免托管结算与自托管。这正是 [Namefi](https://namefi.io) 所打造的赛道：把一个你本就要翻转的名称代币化，让它在任何地方都照常解析，并在链上出售它而无需托管那一套繁琐流程。如果你认真权衡链上这一侧，集群支柱文章[链上域名翻转](/zh/blog/onchain-domain-flipping/)和[代币化如何改变域名翻转](/zh/blog/how-tokenization-changes-domain-flipping/)勾勒出了全貌，而[把域名作为 NFT 出售](/zh/blog/selling-domains-as-nfts/)讲解了挂单的具体机制。

## 结论

ENS 翻转和 DNS 翻转共享一种精神，却几乎没有共享任何管道。ENS 给你公开的所有权、NFT 市场的[流动性](/zh/glossary/domain-trading/)和原子结算——代价是更稀薄的买家池、Gas 敞口、严苛的到期规则和自托管风险。DNS 给你一个全球买家池、可预测的持有成本和一张宽容的续费缓冲网——代价是缓慢、受托管约束、不透明的转移。最聪明的翻转者不会站队;他们把名称匹配给市场。而且他们越来越多地转向代币化 DNS，干脆不再做选择。

## 友情免责声明（请务必阅读！）

> 我们不是律师、会计师、财务顾问或医生，**本文中的任何内容都不构成法律、财务、税务、会计、医疗或任何其他形式的专业建议。** 我们写这些文章是为了自我学习，也是为了方便我们的客户。这里的信息可能已经过时、只适用于特定地区，或者干脆就是错的。我们也会犯错。

> 对于任何重要决定，**请务必咨询真正的专业人士（说真的！）**。或者如果这不是你的风格，那就问问朋友、问问 Twitter、问问 Reddit、问问 AI，或者问问算命先生。一句话：**DOYR——做你自己的研究（Do Your Own Research）**。让我们边学边乐。

## 来源与延伸阅读

- ENS 文档 —— [什么是 ENS？（基于以太坊区块链的分布式命名系统）](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)
- ENS 文档 —— [ETH 注册商（.eth 名称像任何 ERC721 代币一样转移；到期时的宽限期与荷兰式拍卖；基于长度的年费）](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- 以太坊改进提案 —— [ERC-721 非同质化代币标准（"一套面向非同质化代币、也称契据的标准接口"）](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- 维基百科 —— [域名注册商（gTLD 最长 10 年期限；零售 `.com` 续费定价）](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)
