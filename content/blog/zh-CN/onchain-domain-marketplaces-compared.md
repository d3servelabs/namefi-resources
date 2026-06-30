---
title: "链上域名市场对比：OpenSea、Seaport 及其他"
date: '2026-06-24'
language: zh-CN
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 36
format: comparison
description: "从费用、触达范围和托管模式三个维度，对比 OpenSea、基于 Seaport 的市场以及域名原生的链上市场——帮你判断每一笔代币化域名交易该选哪个场所。"
ogImage: ../../assets/onchain-domain-marketplaces-compared-og.jpg
keywords: ['链上域名市场', '代币化域名市场', '出售域名 NFT', 'OpenSea 域名', 'Seaport 协议', 'NFT 市场费用', 'web3 域名翻转', '在哪出售代币化域名', 'OpenSea vs Blur', '原子化 NFT 交易', 'ERC-721 域名', '域名 NFT 市场对比', 'Namefi 市场', '自托管域名交易', '链上域名交易']
relatedArticles:
  - /zh-CN/blog/selling-domains-as-nfts/
  - /zh-CN/blog/onchain-domain-flipping/
  - /zh-CN/blog/tokenize-your-com-to-flip-it/
  - /zh-CN/blog/how-tokenization-changes-domain-flipping/
  - /zh-CN/blog/ens-vs-dns-domain-flipping/
relatedTopics:
  - /zh-CN/topics/domain-investing/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/domain-flipping-skills/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/web3/
---

如果你翻转一个[代币化域名](/zh-CN/blog/what-are-tokenized-domains/)——一个真正的 ICANN 名称，外加一层[链上](/zh-CN/glossary/on-chain/)所有权代币——你就拥有了传统域名世界从未给过你的一种选择。你可以把这个名称作为 [NFT](/zh-CN/glossary/nft/) 挂到通用加密市场上，可以通过基于 [Seaport](/zh-CN/glossary/smart-contract/) 的、无第三方托管的场所出售它，也可以使用专为这类资产打造的域名原生平台。每条路径转移的都是同一个代币，但它们在费用、触达范围和托管模式上的差异大到足以让你选错时丢掉一个买家或损失一块利润。

本指南从真正决定一笔翻转成败的四件事——费用、触达范围、托管和各自适合哪种交易——出发，对比三类链上场所：像 OpenSea 这样的通用 NFT 市场、基于 Seaport 的零费用市场，以及包括 [Namefi](https://namefi.io) 在内的域名原生平台。Namefi 只是这里的一个选项，而非唯一选项。我们的目标是帮你把场所匹配到交易上。

如果你刚开始把名称当作代币来出售，请先从[将域名作为 NFT 出售](/zh-CN/blog/selling-domains-as-nfts/)以及集群支柱文[链上域名翻转](/zh-CN/blog/onchain-domain-flipping/)入手。本文假设你已经持有一个代币化名称，正在决定该在哪里出售它。

## 为什么场所在链上比在链下更重要

在传统的[二级市场](/zh-CN/glossary/domain-trading/)里，市场基本上就是一个挂牌板加一个[第三方担保（escrow）](/zh-CN/blog/domain-escrow-explained/)台。在注册商那边有人手动推送之前，名称不会转移，与此同时一个中立的第三方代为保管资金。而在链上，市场更接近于一个结算层：合约本身可以在一笔交易中用代币换取付款，于是第三方担保所要解决的"谁先动手"的僵局可以被压缩为一次[原子传输](/zh-CN/glossary/atomic-transfer/)。我们在[代币化市场如何取代第三方担保](/zh-CN/blog/how-tokenized-marketplaces-replace-escrow/)中拆解了这套机制。

这一转变改变了你要比较的东西。在链下，你比较的是佣金率和第三方担保的可信度。在链上，你还要比较智能合约模型、场所是否会托管你的名称，以及到底有多少对的买家真的在浏览它。三件事最为关键：**费用**（场所和创作者抽走多少）、**触达范围**（你的买家是不是真的在那里），以及**托管**（在成交那一刻之前，你是否把名称保留在自己的[钱包](/zh-CN/glossary/wallet/)里）。

## OpenSea 与通用 NFT 市场

![四家平面风格的店面并排排列在条纹遮阳棚下的编辑插画——一家大型综合集市、一个精简的极简摊位、一个挂着六边形招牌的小亭子，以及一家挂着地球招牌的域名原生店铺](../../assets/onchain-domain-marketplaces-compared-01-venue-storefronts.jpg)

OpenSea 是默认答案，因为它是最大的通用 NFT 市场，而大多数以 [ERC-721](/zh-CN/glossary/erc-721/) 代币形式发行的代币化域名——[一套面向非同质化代币（也称契据，deeds）的标准接口](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)——都会自动出现在那里。如果你的名称在以太坊或 Base 上，你通常无需任何域名专用集成就能把它挂到 OpenSea 上。

在费用方面，OpenSea 现在收取[出售 NFT 1% 的费用](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=1%25%20fee%20for%20selling%20NFTs)，创作者收益则另行处理——在 OpenSea 上，[创作者收益是强制还是可选](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=creator%20earnings%20are%20enforced%20or%20optional)取决于具体的合集。对于一个你自己铸造的域名，通常不必担心创作者版税，所以总的抽成很小。

这里的优势在于触达范围和熟悉度。一个本就在交易 NFT 的买家，已经连接了钱包、熟悉挂牌流程，也信任这个品牌。劣势在于，通用市场会把你的名称当成又一张 JPEG 图片来对待。它不会呈现域名专属的信号：这个名称能在 [DNS](/zh-CN/blog/dns-on-tokenized-domains/) 中解析、它带有流量、它是一个真正的 `.com` 而不是一个仅限 Web3 的字符串。一个在 OpenSea 上扫货的域名投资者，没有任何原生方式来筛选"带有 X 特征的真实 ICANN 名称"。OpenSea 是网撒得最广、上下文最浅的那个。

**最适合：**那些流动性高、易于辨认、买家是加密原住民、价值仅凭字符串本身就一目了然的名称。

## 基于 Seaport 的市场与零费用市场

![一台双盘天平的编辑插画，一端称量着代表低费用的一小摞硬币，另一端称量着代表受众触达范围的、宽阔放射状展开的扇形](../../assets/onchain-domain-marketplaces-compared-02-fees-vs-reach.jpg)

[Seaport](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs) 是 OpenSea 底层的开源协议——其自家代码仓库将它描述为[一个用于安全高效地买卖 NFT 的市场协议](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)。因为它是一个公开的[智能合约](/zh-CN/glossary/smart-contract/)，任何人都可以在它之上构建市场，这正是为什么"基于 Seaport"是一个类别而不是单一站点。它们共有的特征是：挂牌是由合约直接结算的已签名报价——你把名称保留在自己的钱包里，买家的付款与你的代币原子化地完成互换，没有任何运营方曾经持有过该资产。

另一个值得关注的分支是零费用、面向专业交易者的场所。例如 Blur 就以[0%](https://blur.io/#:~:text=0%25)[市场费用](https://blur.io/#:~:text=Marketplace%20fees)为卖点，从老牌平台手中争夺高频交易者。对于一个要把每一个基点都抠到极致的翻转者来说，零费用场所很有吸引力——但触达范围是其中的陷阱。这些平台是为艺术品和 PFP 合集调校的，它们有着深厚、近乎可互换的地板价，而不是为一个个独一无二、每个字符串都自成一个独立市场的域名而设计的。你可能一分钱费用都不付，却仍要等很久，因为对的买家根本不在那里浏览。

托管这块才是这一类平台真正的胜出之处：一个设计良好的 Seaport 流程是一次货真价实的[原子传输](/zh-CN/glossary/atomic-transfer/)，于是第三方担保所要消除的交易对手风险大体上消失了。相比我们在[第三方担保详解](/zh-CN/blog/how-tokenized-marketplaces-replace-escrow/)中描述的链下流程，这是一次实质性的升级。

**最适合：**对费用敏感、已经物色好买家的卖家，或者那些想要自托管和原子结算、且不需要场所去创造需求的卖家。

## 关于 Web3 原生名称市场的一点说明

值得把代币化的 ICANN 域名与 Web3 原生名称区分开来，因为它们在不同的地方交易，而这条界线又很容易被模糊。像 `vitalik.eth` 这样的 [ENS](/zh-CN/glossary/ens/) 名称并不是 DNS 域名——ENS 是[一套基于以太坊区块链的、分布式、开放且可扩展的命名系统](https://docs.ens.domains/learn/protocol#:~:text=a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)，而 `.eth` 名称存在于 ICANN 根之外。它们的发行也采用不同的费用模型：ENS 按长度为 `.eth` 注册定价，一个五个字符及以上的名称大约每年 [5 美元](https://docs.ens.domains/registry/eth#:~:text=5%20USD)，而一个三字符名称每年约为 [$640](https://docs.ens.domains/registry/eth#:~:text=640)。

ENS 及类似名称可以作为 NFT 交易，能够紧挨着一个代币化的 `.com` 一起出现在 OpenSea 上，但 `crypto.eth` 的买家想要的东西与 `crypto.com` 的买家不同——前者是钱包原生的身份标识，后者是一个可被普遍解析的网站地址。我们在 [ENS 域名翻转 vs DNS 域名翻转](/zh-CN/blog/ens-vs-dns-domain-flipping/)中完整划清了这条界线，并在 [ENS vs Unstoppable vs 代币化 DNS](/zh-CN/blog/ens-vs-unstoppable-vs-tokenized-dns/)中做了平台层面的对比。简而言之：不要把一个代币化的 ICANN 域名当成 ENS 名称来定价或挂牌，也不要假设一个 ENS 买家就是你的买家。

## 域名原生市场，包括 Namefi

第三类是专门为代币化的真实域名而构建的。域名原生场所不会把名称当作一个通用代币来对待，而是理解其底层还有一个 DNS 层：它能展示该名称可以解析、能在交接过程中保持 DNS 连续性以免一个运行中的站点在交易中途宕机，还能把挂牌呈现给那些在寻找真实域名、而非收藏品的买家。

[Namefi](https://namefi.io) 就属于这一类。它在以太坊和 Base 上把真实的 ICANN 名称代币化为 NFT，同时让 DNS 层持续运转，这意味着一个通过 Namefi 出售的名称可以在[链上](/zh-CN/glossary/on-chain/)结算，采用与 Seaport 交易相同的原子化、免第三方担保机制——但带有通用市场无法提供的域名专属上下文。因为经 Namefi 代币化的名称是标准 NFT，它们仍然可以挂到 OpenSea 和其他场所上。你不会被锁定；你是在增加一个懂域名的选项，而不是关闭其他选项。如果你正在一开始就决定到哪里去代币化，[如何选择域名代币化平台](/zh-CN/blog/choosing-a-domain-tokenization-platform/)对各家提供商做了对比。

代价在于，域名原生市场比 OpenSea 更年轻、更单薄。它们在原始用户数量上的触达范围更窄，即便每一个用户都是更合格的域名买家。对于那些买家需要确信自己拿到的是一个真实、可解析的域名——而不只是一个代币——的高价值名称来说，这种合格的上下文可能比纯粹的流量更重要。

**最适合：**那些 DNS 连续性、买家信任和域名专属呈现都很重要的真实 ICANN 名称——通常是你那些价值较高或正在被实际使用的名称。

## 如何把场所匹配到交易

![一枚域名代币硬币沿着分叉的虚线路径被路由到多个店面中最匹配的那一家的编辑插画，像一张决策流程图](../../assets/onchain-domain-marketplaces-compared-03-match-venue.jpg)

不存在唯一最好的市场，只有对某个特定名称而言最合适的那个。一份粗略的决策指南：

| 如果这个名称是… | 倾向于 |
|---|---|
| 流动性高、加密圈易于辨认的字符串，买家是 NFT 原住民 | OpenSea——触达范围最广，费用低至 1% |
| 已经卖出（你已有买家），你想要零费用 + 自托管 | 基于 Seaport 或零费用的场所——原子结算 |
| 一个真实、可解析、且 DNS 连续性与信任都很重要的 ICANN 域名 | 像 Namefi 这样的域名原生市场 |
| 一个 ENS / Web3 原生名称，而非 DNS 域名 | 一个懂 ENS 的场所——并把它当作身份标识、而非网站来定价 |

更深一层的要点是，在链上你可以同时把同一个代币挂到不止一个地方，因为这些场所大多读取的是同一个钱包和同一个 ERC-721 合约。一个务实的翻转者往往会为了触达范围而在通用市场上广泛挂牌，同时通过域名原生场所去运作那些高价值名称，以获得上下文和信任。托管模式——在结算之前把名称保留在你自己的[多重签名](/zh-CN/glossary/multi-sig/)或单密钥钱包里——会随你一起在所有这些场所之间流转，而这正是自托管的[市场](/zh-CN/glossary/marketplace/)交易胜过老式第三方担保来回拉扯的全部理由。关于如何保护资产本身，更多内容见[多签钱包真的能提升安全性吗](/zh-CN/blog/do-multisig-wallets-actually-improve-security/)，以及[钱包丢失后如何找回代币化域名](/zh-CN/blog/recovering-a-tokenized-domain-after-wallet-loss/)中的恢复手册。

为你面前的这个名称挑选场所，而不是反过来。代币在哪里都一样；买家不是。

## 友情免责声明（请阅读！）

> 我们不是律师、会计师、理财顾问，也不是医生，**本文中的任何内容都不构成法律、金融、税务、会计、医疗或任何其他形式的专业建议。** 我们写这些文章是为了自我学习，也是为了方便我们的客户。这里的信息可能已经过时、只适用于特定地区，或者干脆就是错的。我们也会犯错。
>
> 对于任何重要决定，**请咨询真正的专业人士（说真的！）**。或者如果那不合你的风格，那就问问朋友、问问 Twitter、问问 Reddit、问问 AI，或者问问算命先生。一句话：**DOYR——做你自己的研究（Do Your Own Research）**。让我们一起学习，一起开心。

## 来源与延伸阅读

- 以太坊改进提案——[ERC-721 非同质化代币标准（"一套面向非同质化代币、也称契据的标准接口"）](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- ProjectOpenSea/seaport（GitHub）——[Seaport 是一个用于安全高效地买卖 NFT 的市场协议](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- OpenSea 帮助中心——[我在 OpenSea 上需要支付哪些费用？（1% 出售费；创作者收益强制或可选）](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=1%25%20fee%20for%20selling%20NFTs)
- Blur——[面向专业交易者的 NFT 市场（0% 市场费用）](https://blur.io/#:~:text=0%25)
- ENS 文档——[什么是 ENS？（"一套基于以太坊区块链的、分布式、开放且可扩展的命名系统"）](https://docs.ens.domains/learn/protocol#:~:text=a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)
- ENS 文档——[.eth 注册商定价（按长度计算的年费：5+ 字符约 $5/年，3 字符约 $640/年）](https://docs.ens.domains/registry/eth#:~:text=5%20USD)
