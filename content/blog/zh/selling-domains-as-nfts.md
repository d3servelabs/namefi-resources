---
title: "将域名作为 NFT 出售：链上流动性"
date: '2026-06-24'
language: zh
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 35
format: guide
description: "将域名作为 NFT 出售是如何运作的：上架机制、Seaport 与 OpenSea、限定买家的私下成交、版税，以及 gas 费与诈骗陷阱。"
ogImage: ../../assets/selling-domains-as-nfts-og.jpg
keywords: ['将域名作为 NFT 出售', '域名 NFT', '代币化域名出售', '链上域名流动性', '在 OpenSea 上架域名 NFT', 'Seaport 协议', '限定买家上架', '私下 NFT 上架', 'NFT 版税 域名', 'ERC-721 域名', '原子转移 域名', '出售代币化域名', 'NFT 出售 gas 费', 'NFT 域名诈骗', '链上域名倒卖']
relatedArticles:
  - /zh/blog/onchain-domain-marketplaces-compared/
  - /zh/blog/onchain-domain-flipping/
  - /zh/blog/tokenize-your-com-to-flip-it/
  - /zh/blog/how-tokenization-changes-domain-flipping/
  - /zh/blog/end-user-vs-reseller-domain-pricing/
relatedTopics:
  - /zh/topics/domain-investing/
  - /zh/topics/domain-tokenization/
relatedSeries:
  - /zh/series/domain-flipping-skills/
  - /zh/series/tokenize-your-com/
relatedGlossary:
  - /zh/glossary/registrar/
  - /zh/glossary/icann/
  - /zh/glossary/dns/
  - /zh/glossary/web3/
  - /zh/glossary/tld/
---

传统的域名交易从一开始就内置了一个信任难题。卖家不愿在收到钱之前就推送转移；买家也不愿在域名进入自己账户之前就把钱汇出去。整个[托管](/zh/glossary/escrow/)行业之所以存在，就是为了在这两种本能反应之间充当中间人。将域名作为 [NFT（非同质化代币）](/zh/glossary/nft/)出售，则重新排布了这场僵局。当一个真实 ICANN 域名的所有权同时也是一个[链上 (On-chain)](/zh/glossary/on-chain/) 代币时，这个域名就成了你可以在同一笔转移资金的交易中上架、定价并交付的东西——不再需要中间人在付款与转移之间那段黑暗时刻替你保管资产。

本指南讲的就是这一层流动性：当你上架一个[域名](/zh/glossary/domain-trading/) NFT 时究竟会发生什么、市场的底层管道如何运作、何时该用限定买家的私下上架而非公开上架、版税如何表现，以及那些悄悄蚕食链上交易收益的 gas 费与诈骗陷阱。它是更宏大的[域名倒卖](/zh/blog/domain-flipping/)系列中的一根辐条，并假定你已经知道什么是代币化域名——如果还不知道，请先从[什么是代币化域名](/zh/blog/what-are-tokenized-domains/)看起。

## 你究竟在出售什么

首先要厘清一个本文通篇都依赖的关键点。一个代币化域名与一个 [ENS（以太坊域名服务）](/zh/glossary/ens/)名称或一个 Unstoppable 名称并不是同一种东西，出售它们也不是同一回事。

- 一个 **[ENS](https://ens.domains) `.eth` 名称**完全活在以太坊上。它通过支持 ENS 的[钱包](/zh/glossary/wallet/)和应用来解析，而非在普通浏览器的地址栏中解析；ENS 按长度对注册定价——根据 ENS 文档，[5 个及以上字母的 `.eth` 每年花费 5 USD](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)，[4 个字母每年 160 USD](https://docs.ens.domains/registry/eth#:~:text=A%20%604%60%20letter%20%60160%20USD%60%20per%20year)，[3 个字母每年 640 USD](https://docs.ens.domains/registry/eth#:~:text=and%20a%20%603%60%20letter%20%60640%20USD%60%20per%20year)。
- 一个 **Unstoppable 名称**（`.crypto`、`.x` 及其同类）是在 ICANN 根之外铸造的 [Web3](/zh/glossary/web3/) 名称。
- 一个**代币化的 ICANN 域名**才是本系列所关注的：一个能在所有浏览器中解析的真实 `example.com`，*外加*你钱包里一个代表对它控制权的代币。我们在[代币化域名 vs Web3 域名](/zh/blog/tokenized-domain-vs-web3-domain/)中将这三者逐项对比。

下文的市场运作机制对其中任何一种都适用，因为它们都是 NFT。但你所转移的*价值*却天差地别。当你出售一个 ENS 名称时，买家得到的是一个仅存于链上的身份。当你出售一个代币化的 `.com` 时，买家得到的则是一项能被普遍解析的业务资产，其 DNS 在交接过程中始终正常运行。别让一个花哨的上架流程骗你把前者当成后者来定价。

## 域名 NFT 如何变得具有流动性

你将交易的几乎每一个域名 NFT 都是一个 [ERC-721（NFT 标准）](/zh/glossary/erc-721/)代币——维基百科将该标准描述为[一个技术框架，定义了一套规则与接口，用于在以太坊区块链上创建和管理独一无二的非同质化代币（NFT）](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique)。正是"作为一种标准代币"这一点让它具有流动性：任何懂 ERC-721 的[市场](/zh/glossary/marketplace/)、钱包或[智能合约](/zh/glossary/smart-contract/)都可以上架它、托管它或以它为抵押放贷，而无需把你的域名当成特例处理。

这种标准化就是整个流动性故事的核心。一个传统域名只能在注册商或域名市场允许它出售的地方出售。而一个域名 NFT 可以在任何理解 ERC-721 的地方出售——如今那几乎就是整个 NFT 经济。这就是代币化改变交易的结构性原因，[代币化如何改变域名倒卖](/zh/blog/how-tokenized-marketplaces-replace-escrow/)中有更完整的论述。

## 在市场上架：Seaport 与 OpenSea

![天平的社论式插画，一侧放着一个域名 NFT 代币，另一侧放着一摞硬币，二者由中央一个互锁的链环连接，置于一个市场雨篷之下](../../assets/selling-domains-as-nfts-01-atomic-swap.jpg)

NFT 交易的主流轨道是 [Seaport](https://docs.opensea.io/docs/seaport) 与 [OpenSea](https://opensea.io)，而厘清它们是两个不同的层次会很有帮助。Seaport 是协议；OpenSea 是建立在其之上的一个店面。根据 OpenSea 自己的文档，[Seaport 是一个用于在区块链上安全、高效地买卖 NFT 的市场协议](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)，并且 [Seaport 为 OpenSea 网站提供动力](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20powers%20the%20OpenSea%20website)——OpenSea 上的每一笔订单都经过它运行。

对卖家而言真正重要的心智模型是 Seaport 的双边结构：一个 **offer（提供）**与一个 **consideration（对价）**。offer 是你拿出来的东西（你的域名 NFT）。consideration 是你要求换取的东西（以 ETH 或一种稳定币计的价格，外加任何路由给其他方的费用和版税）。你只需对该订单签名一次。在买家履行它之前，什么都不会动；而当买家履行时，协议会在单个原子步骤中结算双边——你的代币和他们的付款在同一笔交易中互换，要么都换，要么都不换。这种原子性正是取代托管的[原子传输](/zh/glossary/atomic-transfer/)属性：不存在一方已付款而另一方尚未交付的时间窗口。

实际操作中的上架是一套大多数卖家做过一次就忘掉的两步仪式：

1. **授权（Approval）。** 你第一次从某个钱包上架时，要签署一份授权，允许市场的合约在交易触发时代你转移该代币。这要花 gas；之后上架同一集合中的其他代币通常不需要再付。
2. **上架订单。** 你对实际订单签名——价格、币种、时长。在大多数市场上这一签名是**免 gas（gasless）**的：你签的是一条消息，而非发送一笔交易，所以创建或取消一个固定价上架在有人购买之前通常不花一分钱。

一个实际后果：执行一笔固定价购买的 gas 通常由买家而非你来支付。OpenSea 的卖家指南说得很直白——[买家在购买固定价商品时支付 gas 费](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item)，而[卖家在接受报价时支付 gas 费](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Sellers%20pay%20gas%20fees%20when%20accepting%20offers)。所以如果你上架后等待，gas 由买家承担；如果你主动接受一个进来的出价，则由你承担。这种不对称性应当影响你在网络拥堵时的出售方式。

## 限定买家的私下上架

![一个域名 NFT 奖章锁在玻璃展示柜中、可被一小群人看到的社论式插画，而只有某一个特定的人持有可以打开它的那把相配的金钥匙](../../assets/selling-domains-as-nfts-02-private-listing.jpg)

对于一个你愿意卖给任何人的大路货域名，公开上架没问题。但很多真实的域名交易是先在场外谈成的——价格通过邮件或通话敲定——然后你只需要一个干净、无需信任的方式去与*那个特定的买家*成交。公开上架这样一个域名是个错误：一个盯着市场的第三方可能会在你的买家点击之前，以你谈好的价格把它狙击下来。

解决办法是**限定买家（私下）上架**，而 Seaport 原生支持它，因为 consideration 可以指定一个必需的接收方。在 OpenSea 上你在上架流程中设置这一点：根据其指南，你可以[为某个特定买家保留该商品。为此，点击 Reserve 并输入他们的钱包地址](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=reserve%20the%20item%20for%20a%20specific%20buyer.%20To%20do%20so%2C%20click)。只有那个钱包能履行该订单。其他所有人都看得到这个上架，却买不了它。

这就是有中间人撮合、限定买家的成交在链上的等价物，也是 Namefi 在由报价驱动的交易中所倚仗的模式：先与一个真人谈定数字，然后将其作为私下上架来结算，使得谈好的买家——并且只有那个买家——能完成原子互换。你既获得场外交易的私密性，*又*获得链上交易那种无需托管的终局性。不过务必把目标钱包地址填对：一个字符错了，你就把自己那个五位数价格的域名保留给了一个无人控制的地址。

## 版税：交易之后还存在吗？

有些域名 NFT 带有版税——每次转售时路由给原始发行方或某个创作者的一笔百分比。这里的标准是 [EIP-2981](https://eips.ethereum.org/EIPS/eip-2981)，用它自己的话说，它之所以存在，是为了让合约能够[在 NFT 每次被出售或转售时，向 NFT 创作者或权利持有人发出应付版税金额的信号](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold)。

每个倒卖者都该牢记两点。第一，EIP-2981 只是*发出*版税信号；它并不*强制执行*版税。版税究竟是否真的被支付，取决于市场的政策，而整个行业在 2022–2023 年间让大多数版税变成了可选的。别在为你的回报建模时假设版税会在下一手被照付——它可能不会。第二，版税对倒卖者是双刃剑：你在卖出时支付的版税是你利润里实打实的成本，而任何平台费还会叠加在其之上。OpenSea 的指南指出，该店面[通常向卖家收取 1% 的费用](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=OpenSea%20typically%20charges%20a%201%25%20fee%20to%20the%20seller)，而创作者收益在适用时也是从你的所得里扣除的。在确认之前请读一读市场展示给你的费用明细——那些是对*你*到手金额的估算，也正是决定这次倒卖值不值得的那个数字。

## 需要规避的 gas 与诈骗陷阱

![一个钱包被罩在带护盾的玻璃穹顶下受到保护的社论式插画，四周环绕着标着警示旗的危险物：一个滴着硬币的加油枪、一个钓鱼鱼钩勾住一份签名授权文件，以及一块显示着被掉包地址的写字板](../../assets/selling-domains-as-nfts-03-gas-scam.jpg)

链上流动性是真实的，但它伴随着一个新的故障面。两大问题是 gas 与欺诈。

**Gas。** 以太坊对计算收费。根据 ethereum.org，[Gas 指的是衡量在以太坊网络上执行特定操作所需计算工作量的单位](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort)，并以 ETH 支付。对于一个四位数价格的域名，在拥堵的一天里，授权加结算的 gas 可能是你利润中相当可观的一块——而对于一个低价值的域名，它可能整个超过出售所得。两道防线：在网络清闲时做你的授权，以及考虑在一个手续费更低的链上上架。这也是代币化域名出现在 Base 上、而不仅在以太坊主网上，对那些经手较小域名的倒卖者很重要的原因之一。

**诈骗。** 链上世界有它自己的一套骗局图鉴，而域名 NFT 完全在其射程之内：

- **钱包地址掉包。** 恶意软件和剪贴板劫持程序会悄悄替换一个粘贴进去的地址。在签名前，务必将任何买家或接收方地址的首尾字符与另一个来源核对。
- **恶意的"授权"签名。** 一个假冒的市场或一个钓鱼站点可能要求你签署一份授权，赋予某个合约对你代币的全面权力。如果你不能确切理解一个签名授权了什么，就别签。把任何意料之外的授权请求都当作敌意的来对待。
- **仿冒上架。** 骗子会铸造仿冒代币并把它们当作真正的代币化域名来上架。买家应将合约地址与发行方公布的那个核对；卖家则应确保买家找到的是自己那个真品上架。这也部分解释了为何托管与来源出处很重要——参见[钱包丢失后如何找回代币化域名](/zh/blog/recovering-a-tokenized-domain-after-wallet-loss/)，以及[多签钱包真的能提升安全性吗](/zh/blog/do-multisig-wallets-actually-improve-security/)中对一套[多重签名](/zh/glossary/multi-sig/)方案的论证。
- **假冒"客服"。** 没有任何正规的人会先私信你索要助记词或一个"验证"签名。助记词永远不离开你的掌控。就这么简单。

贯穿始终的一条线：链上结算把交易对手风险从*交易本身*中移除，却用*你钱包里*的操作风险将其替换。托管代理消失了，那个过去会替你接住一笔填错地址转移的人也消失了。那份责任现在归你。

## 这给倒卖者留下了什么

将域名作为 NFT 出售，会把一个域名变成真正具有流动性的东西：一个 ERC-721 代币，你可以免 gas 地上架它、原子地结算它、为某个特定买家保留它，并让它在一个深厚的市场生态中流转，而不是困在某一家注册商的二手市场里。定义着传统交易的那场托管僵局基本上溶解了。它换取的是链上素养——知道你在签什么、gas 会花多少，以及哪些交易对手是真的。

要把握代币化域名如何改变这门生意经济学的全景，[域名倒卖](/zh/blog/domain-flipping/)这一中枢是开始的地方，而[为什么要将域名代币化](/zh/blog/why-tokenize-domains/)则一开始就为加上这一链上层做了论证。如果你想在一个真实、可被浏览器解析的域名上从头到尾试一次出售，[Namefi](https://namefi.io) 正是为此而生——一个你可以在链上上架并结算、同时 DNS 在交接过程中始终正常解析的代币化 `.com`。

## 友情免责声明（请读我！）

> 我们不是律师、会计师、理财顾问，也不是医生，**本文中的任何内容都不构成法律、财务、税务、会计、医疗或任何其他类型的专业建议。** 我们写这些文章是为了自我学习，也是为了给客户提供便利。这里的信息可能已经过时、因地区而异，或者干脆就是错的。我们也会犯错。
>
> 对于任何重要决定，**请咨询一位真正的专业人士（说真的！）**。或者如果那不合你的口味，问问朋友、问问 Twitter、问问 Reddit、问问 AI，或者问问算命的。简而言之：**DOYR——做你自己的研究（Do Your Own Research）**。让我们一起学习、一起开心。

## 来源与延伸阅读

- OpenSea Docs — [Seaport（市场协议；为 OpenSea 提供动力；offer/consideration 模型）](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- OpenSea — [如何出售 NFT（为特定买家保留；谁付 gas；1% 卖家费）](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item)
- Wikipedia — [ERC-721（以太坊上的非同质化代币标准）](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique)
- Ethereum Improvement Proposals — [EIP-2981（NFT 版税标准）](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold)
- ENS Docs — [.eth 按长度注册定价（每年 $5 / $160 / $640）](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ethereum.org — [Gas 与费用（gas 的定义）](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort)
