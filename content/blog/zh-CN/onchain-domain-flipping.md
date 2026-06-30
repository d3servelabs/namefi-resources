---
title: "链上域名翻转：交易 ENS 与代币化域名"
date: '2026-06-24'
language: zh-CN
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 32
format: guide
description: "链上域名翻转的运作方式——把 ENS 与代币化域名当作钱包持有、像 NFT 一样具备流动性的资产来交易，以及它与注册商翻转有何不同。"
ogImage: ../../assets/onchain-domain-flipping-og.jpg
keywords: ['链上域名翻转', '翻转 ENS 域名', '代币化域名翻转', '交易代币化域名', '域名 NFT 翻转', '翻转 web3 域名', 'ENS 域名投资', 'NFT 域名市场', '把域名作为 NFT 出售', '链上域名交易', 'ERC-721 域名', '钱包持有域名', '原子化域名结算', '代币化域名流动性', 'web3 域名翻转']
relatedArticles:
  - /zh-CN/blog/tokenize-your-com-to-flip-it/
  - /zh-CN/blog/how-tokenization-changes-domain-flipping/
  - /zh-CN/blog/selling-domains-as-nfts/
  - /zh-CN/blog/onchain-domain-marketplaces-compared/
  - /zh-CN/blog/ens-vs-dns-domain-flipping/
relatedTopics:
  - /zh-CN/topics/domain-investing/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/domain-flipping-skills/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/web3/
---

域名翻转有一套熟悉的套路：低价买入一个名字，找到需要它的买家，再高价卖出。这门生意的经典版本要经过[注册商](/zh-CN/glossary/registrar/)、二级市场以及一个在转移完成前替双方保管资金的托管代理。链上域名翻转是同样的低买高卖直觉，只不过搬到了[区块链](/zh-CN/glossary/blockchain/)上——在那里，名字本身就是一枚你持有在[钱包](/zh-CN/glossary/wallet/)里的代币，可以像任何其他 [NFT](/zh-CN/glossary/nft/) 一样被交易。

仅仅这一个变化——名字即代币——就几乎重写了交易的每一个环节。保管、挂牌与结算不再是注册商那里的账户级操作，而变成了由你直接掌控的链上交易。本指南会讲清楚链上域名翻转到底是什么，划出你可以翻转的两类截然不同的"链上名字"之间那条重要的界线，并走完整笔交易的全程：获取、保管、挂牌、结算。它是更广义的[域名翻转](/zh-CN/blog/domain-flipping/)打法中的链上支柱。

## "链上域名翻转"是什么意思

在一笔普通的翻转中，所有权存活在注册商的数据库里。你登录一个账户，注册商的记录表明你掌控这个名字，而把它转给买家意味着一次由注册商居中调度的账户对账户、或注册商对注册商的[转移](/zh-CN/glossary/atomic-transfer/)。资产是真实的，但你从未亲自持有它——你持有的是一个指向它的账户。

链上翻转用一枚[代币](/zh-CN/glossary/tokenize/)取代了那个账户。名字以 [ERC-721](/zh-CN/glossary/erc-721/) 标准下的 NFT 来表示——以太坊的规范把它描述为[智能合约内 NFT 的标准 API](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs)——而它自己的摘要把它称作[非同质化代币，又称地契（deeds）](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)的标准接口。"地契"这个词正是关键所在：代币就是这个名字的产权凭证，安放在你的钱包里，而不是别人代你保管的某条记录的收据。谁持有代币谁就掌控名字，而转移掌控权是一次[智能合约](/zh-CN/glossary/smart-contract/)调用，而非一张客服工单。

正是这一属性让链上名字像一类具备流动性的资产那样被交易。它们与艺术品、收藏品挂牌在同样的 [NFT 市场](/zh-CN/glossary/marketplace/)上，几分钟内即可结算，并且带有一段公开、可审计的所有权历史。翻转本身看起来不像注册商转移，而更像跑在为数字资产打造的轨道上的[域名交易](/zh-CN/glossary/domain-trading/)。

## 两类链上名字——别把它们混为一谈

![两种不同链上名字资产并排的编辑插画——一枚带代币的钱包身份芯片，对比一个被 NFT 环绕的地球与地契证书](../../assets/onchain-domain-flipping-01-two-kinds.jpg)

在交易之前最需要弄对的一件事，就是"链上域名"涵盖了两种真正不同、对翻转者而言行为各异的资产。

第一种是 [Web3](/zh-CN/glossary/web3/) 原生名字，典型代表是 [ENS](/zh-CN/glossary/ens/)（`.eth`）。这些名字完全存活在以太坊上。它们不属于 [ICANN](/zh-CN/glossary/icann/) 根，所以 `vitalik.eth` 在没有解析器或桥接的情况下无法在普通浏览器里解析。它们的价值在于作为钱包身份和加密原生的命名。ENS 同时也公开地是一个注册市场：根据 ENS 文档，[5 个及以上字母的 `.eth` 每年花费你 5 美元](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)，四字母和三字母的名字按设计定价更高，而一旦注册，名字就可以[像任何其他 ERC721 代币一样](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token)被转移。正是那条低而透明的注册底价，让短小的优质 `.eth` 名字成了一个自成一体的投机市场。

第二种是**代币化 ICANN 域名**——一个真实的 `.com`、`.xyz` 或 `.io`，其所有权被映射为一枚 NFT，而底层的 DNS 名字仍在各处正常解析。正如我们在[什么是代币化域名](/zh-CN/blog/what-are-tokenized-domains/)的科普中所阐述的，这些是真实的 DNS 域名，只是*同时*拥有一种链上表示，而非一个平行的命名空间。对翻转者而言，这个区别很具体：一个代币化的 `.com` 承载着传统互联网的普遍可解析性、电子邮件和证书支持，而一个 ENS 名字承载着加密原生的实用性，但需要桥接才能表现得像一个网站。两者都能在链上翻转；它们不是同一种产品，买家在每一种上为不同的东西买单。我们在[代币化域名 vs Web3 域名](/zh-CN/blog/tokenized-domain-vs-web3-domain/)中直接对比了这两个家族。

还有第三类——来自 Unstoppable Domains 等平台的 Web3 TLD——它更接近 ENS，而非代币化 ICANN 名字；[优质 Web3 TLD](/zh-CN/blog/premium-web3-tlds/) 指南讲述了它们的归属。把这三类厘清，你就能给每一种正确定价。

## 它与注册商二级市场翻转有何不同

![原子化结算的编辑插画——硬币和一枚 NFT 代币像拼图块一样在两只手之间咬合在一起，一个被灰化的托管代理被搁置在一旁](../../assets/onchain-domain-flipping-02-atomic-settle.jpg)

机制差异在结算环节最为尖锐——而这正是传统翻转最让人神经紧张的地方。在注册商的世界里，买家和卖家陷入僵持：卖家在收到钱之前不愿转移，买家在收到名字之前不愿付款，于是一个第三方[托管](/zh-CN/glossary/escrow/)代理必须站在中间同时握住两边。我们在[域名托管详解](/zh-CN/blog/domain-escrow-explained/)中拆解了这套经典流程。

在链上，那种僵持可以坍缩为一笔原子化交易。为 NFT 打造的市场协议让付款与转移要么一起发生，要么都不发生。OpenSea 的订单协议 Seaport 把自己描述为[一个用于安全高效地买卖 NFT 的市场协议](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)，其实际效果是买家的付款和卖家的代币在同一个结算步骤里互换。交易过程中没有代理握住资产——合约强制执行这次互换。这正是我们说代币化市场[取代托管](/zh-CN/blog/how-tokenized-marketplaces-replace-escrow/)时所指的机制。

其他几个重大差异：

- **保管权归你。** 资产不再是注册商那里的一个账户，而是安放在你的钱包里。这消除了平台锁定和账户被查封的风险，但也把[密钥管理](/zh-CN/glossary/custodial-ownership/)的全部重量压在了你身上——丢了密钥，就丢了名字。
- **流动性更广。** 一个代币化名字可以与所有其他 ERC-721 资产一起挂牌在通用 NFT 市场上，而不仅限于域名专属的二级市场，这扩大了关注和出价的池子。
- **来源是公开的。** 每一次此前的销售和转移都在链上可见，因此买家无需信任某个市场的说辞就能核验历史——这对估值以及证明一个名字并非被盗都很有用。

## 逐步拆解这笔交易：获取、保管、挂牌、结算

![链上翻转四步流程的编辑插画——一枚名牌上的放大镜、一把钥匙和一个钱包、一家市场店面，以及一次硬币换代币的环形互换](../../assets/onchain-domain-flipping-03-trade-steps.jpg)

### 获取

你获取链上名字的方式和获取任何翻转标的一样——寻找定价错误的资产——但渠道有所不同。ENS 名字来自 ENS 注册市场或二级 NFT 市场；底价是透明的，因为任何人都能在链上读取注册费。代币化 ICANN 域名来自注册或[代币化一个你已经相信被低估的真实 `.com`](/zh-CN/blog/how-to-tokenize-your-com/)，或者购买一个已被代币化的。其纪律与[域名交易](/zh-CN/glossary/domain-trading/)的其余部分完全一致：不要爱上一个没人会买的名字，也不要在入手时出价过高，因为入场价决定了你的全部利润空间。

### 保管

这一步在注册商翻转中没有对应物，也是新手翻转者最容易低估的一步。一旦名字成了 NFT，*你*就是保管系统。热钱包对活跃交易很方便，但暴露程度最高；硬件钱包或[多重签名](/zh-CN/glossary/multi-sig/)安排牺牲一些便利，换来对一个你要持有数月的名字远更好的保护。多重签名是不是正确答案是个真问题——我们在[多重签名钱包真的能提升安全性吗](/zh-CN/blog/do-multisig-wallets-actually-improve-security/)中权衡了这一点。而由于丢失密钥可能意味着丢失名字，请在需要之前就准备好一套恢复方案；[钱包丢失后找回代币化域名](/zh-CN/blog/recovering-a-tokenized-domain-after-wallet-loss/)讲述了哪些可行、哪些不可行。

### 挂牌

挂牌一个链上名字是一次市场操作，而不是在一个停放域名上做一个"出售中"的落地页。你直接在 NFT 市场上设定一个固定的立即购买价或开启一场拍卖，而这个挂牌本身就是一笔任何买家都能成交的链上（或市场签名）订单。对代币化 ICANN 域名，你还保留着走常规销售页漏斗的选项——区别在于成交是通过一次代币互换而非托管交接来完成的。具体到代币化名字，[DNS 连续性](/zh-CN/blog/dns-on-tokenized-domains/)在这里很重要：一个构建良好的代币化域名在交接过程中持续干净地解析，因此一个在线站点不会在销售中途突然黑屏。

### 结算

结算是所有链上管道工作的回报。买家成交你的订单，付款与代币转移一起执行，所有权在一笔确认的交易里移交。对一个 ENS 名字来说这就结束了——新持有者现在掌控这个 `.eth` 名字。对一个代币化 ICANN 域名来说，代币转移就是产权凭证，平台让底层的 DNS 注册保持同步，使买家最终掌控一个真实、可解析的域名。无论哪种方式，双方都无需先行动一步，期间也没有代理握住资产。

## 数字看起来是什么样

链上翻转仍然是一场组合游戏，而不是彩票——你持有的大多数名字不会卖出，而那些成交的赢家则为持仓成本买单。但那些标志性的成交说明了为什么这个品类会吸引关注。据 The Block 报道，迄今为止成交价最高的 ENS 名字是 [paradigm.eth，于 2021 年 10 月以 420 ETH 购入（在当时约合 150 万美元）](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=paradigm.eth%2C%20which%20was%20purchased%20in%20October%202021%20for%20420%20ETH)；同一份报道指出 [000.eth 以 300 ETH（31.5 万美元）购入](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)，时间是 2022 年 7 月。

把这些当作异常值，而不是一种商业模式——适用于 `.com` 天价成交的那套清醒检验在这里加倍适用，还多了一层皱褶：链上名字的价格随加密市场的波动而起伏。一个以 ETH 计量的底价，可能在没有任何一个名字易手的情况下，按美元计就腰斩。清醒的估值，而非高光集锦，才是让一个链上组合保持盈利的东西。

## Namefi 的位置

链上翻转的那个干净版本——钱包持有的产权、原子化结算、没有托管僵持——正是 [Namefi](https://namefi.io) 为*真实*的 ICANN 域名所打造、要交付的工作流。代币化所有权让对一个 `.com` 的掌控像 NFT 一样可审计、可转移，而 DNS 连续性让名字在交接过程中保持解析，于是翻转者既获得了链上流动性，又不必放弃买家真正愿意为之付费的普遍可解析性。如果你想把一个你已经拥有的名字带入这个模型，操作步骤详见[如何代币化你的 .com](/zh-CN/blog/how-to-tokenize-your-com/)，而各平台之间的取舍详见[如何选择域名代币化平台](/zh-CN/blog/choosing-a-domain-tokenization-platform/)。

## 友情免责声明（请阅读！）

> 我们不是律师、会计师、财务顾问，也不是医生，而且**本文中的任何内容都不构成法律、财务、税务、会计、医疗或任何其他类型的专业建议。**我们撰写这些文章是为了教育我们自己，也是为了方便我们的客户。这里的信息可能已经过时、因地区而异，或者干脆就是错的。我们也会犯错。

> 对于任何重要的决定，**请咨询一位真正的专业人士（认真的！）**。或者如果那不合你的口味，那就问问朋友、问问推特、问问 Reddit、问问 AI，或者问问算命先生。简而言之：**DOYR——做你自己的研究（Do Your Own Research）**。让我们一起学习，乐在其中。

## 来源与延伸阅读

- 以太坊改进提案——[ERC-721 非同质化代币标准（NFT"又称地契 deeds"）](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- ENS 文档——[ETH 注册商（注册定价；作为 ERC-721 代币转移）](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ProjectOpenSea——[Seaport（用于安全高效地买卖 NFT 的市场协议）](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- The Block——[ENS 域名 000.eth 以 300 ETH 成交；paradigm.eth 仍是最大的 ENS 成交，达 420 ETH](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
