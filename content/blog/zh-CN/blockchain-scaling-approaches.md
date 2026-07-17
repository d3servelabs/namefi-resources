---
title: "主流区块链扩容方案：Rollup、侧链、通道与分片"
date: '2026-07-02'
language: zh-CN
tags: ['guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 40
format: roundup
description: 面向初学者的区块链扩容指南，对比乐观 Rollup、ZK Rollup、侧链、支付通道、分片和数据可用性层。
ogImage: ../../assets/blockchain-scaling-approaches-og.jpg
keywords: ['区块链扩容', '区块链扩容方案', 'Layer 2 扩容', 'Rollup', '乐观 Rollup', 'ZK Rollup', '侧链', '支付通道', '状态通道', '分片', '数据可用性', '可扩展性三难困境', 'Arbitrum', 'Optimism', 'zkSync', 'Starknet', 'Celestia', 'EigenDA', 'Polygon PoS', 'Lightning Network']
relatedArticles:
  - /zh-CN/blog/blockchain-virtual-machines/
  - /zh-CN/blog/blockchain-consensus-mechanisms/
  - /zh-CN/blog/blockchain-privacy-technologies/
  - /zh-CN/blog/blockchain-cryptographic-primitives/
  - /zh-CN/blog/premium-web3-tlds/
relatedGlossary:
  - /zh-CN/glossary/rollup/
  - /zh-CN/glossary/optimistic-rollup/
  - /zh-CN/glossary/zk-rollup/
  - /zh-CN/glossary/data-availability/
  - /zh-CN/glossary/layer-2/
relatedTopics:
  - /zh-CN/topics/web3-foundations/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/tokenize-your-com/
  - /zh-CN/series/domain-flipping-skills/
---

以太坊主网每秒大约处理 15 笔交易。像 Visa 这样的支付网络则能处理数万笔。这个差距正是区块链需要扩容的原因：在不要求每位参与者都在基础链上验证每笔交易的前提下，完成更多工作的方法。过去数年，业界逐渐形成了几种截然不同的方案——[Rollup](/zh-CN/glossary/rollup/)、侧链、支付通道和分片——它们对安全性、去中心化和成本作出了不同取舍。

本指南将讲解主要扩容方案、说明各自背后的机制，并将它们并列比较；下次你在某个项目文档中看到这些术语时，就能清楚区分它们。

---

## 可扩展性三难困境

Vitalik Buterin 对**可扩展性三难困境**的阐释，是这个领域大部分设计所依赖的思维模型。区块链希望同时具备三种属性：“可扩展性：链能够处理的交易多于单个普通节点……所能验证的数量”“去中心化：链无需依赖少数大型中心化参与者的信任即可运行”，以及“安全性：链能够抵御相当大比例的参与节点试图攻击它”——但传统设计通常只能同时实现其中两项（[vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Scalability%3A%20the%20chain%20can%20process%20more%20transactions%20than%20a%20single%20regular%20node)）。比特币和早期以太坊选择了去中心化与安全性，而非吞吐量；依赖少数强大验证者的高 TPS 链获得了可扩展性和安全性，却牺牲了去中心化；朴素的多链设计可以扩展并保持去中心化，但如果攻击者只需攻破其中一条链，它们就会变得不安全。

下文的每一种方案，本质上都在回答同一个问题：如何在不放弃三角形另外两个顶点的前提下提高吞吐量？

## Rollup：链下执行，链上结算

![许多小型交易凭证汇入一个标有“Rollup Compressor”的压缩器，被压成一个批次立方体，再发布到由相连区块组成的基础层链上的扁平矢量图](../../assets/blockchain-scaling-approaches-01-rollup-batching.jpg)

**[Rollup](/zh-CN/glossary/rollup/)** 在第一层（L1）之外执行交易，随后将精简摘要及底层交易数据发布回基础链。此类系统的主要追踪平台 L2BEAT 将 Rollup 定义为“定期向以太坊发布状态承诺的 L2”，这些承诺“要么由有效性证明验证，要么以乐观方式接受，并可在特定的欺诈证明窗口内通过欺诈证明机制提出挑战”（[l2beat.com](https://l2beat.com/scaling/summary)）。由于数据和承诺都会落在 L1 上，任何人都能仅凭以太坊重建 Rollup 的状态；这使 Rollup 继承 L1 的安全性，而不必要求用户信任一套新的验证者集合。这正是当今大多数人接触的 [Layer 2](/zh-CN/glossary/layer-2/) 网络所采用的技术：Base、Arbitrum、Optimism、zkSync 和 Starknet 都是 Rollup。

Rollup 会根据如何证明链下执行正确无误，分为两大类。

### 乐观 Rollup

![两扇并列的门的扁平矢量图：橙色“Optimistic”门配有 7 天时钟和代表欺诈证明窗口的挑战期旗帜；绿色“ZK”门配有即时有效性证明的绿色对勾](../../assets/blockchain-scaling-approaches-02-optimistic-vs-zk.jpg)

[乐观 Rollup](/zh-CN/glossary/optimistic-rollup/)“假定链下交易有效，且不为交易批次发布有效性证明”（[ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=Optimistic%20rollups%20assume%20offchain%20transactions%20are%20valid%20and%20don%27t%20publish%20proofs%20of%20validity)）。运营者将交易打包、在链下执行，再把压缩数据发布到以太坊。随后会开启一个挑战窗口，任何运行全节点的人都可在此期间用欺诈证明质疑该批次；从 L2 将资金提回 L1 必须等到“挑战期——约持续七天——结束”（[ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=the%20challenge%20period%E2%80%94lasting%20roughly%20seven%20days%E2%80%94elapses)）。因此，普通的乐观 Rollup 提款大约需要一周；除非借助第三方流动性提供者，以付费方式更快退出。

乐观 Rollup 只需要欺诈证明系统，而不需要完整的密码学证明管线；从历史上看，这使它们更容易支持通用智能合约。**Arbitrum**、**Optimism** 和 **Base** 是当今按使用量计规模最大的乐观 Rollup；ethereum.org 将 Coinbase 的 Rollup **Base** 描述为“使用 OP Stack 构建的乐观 Rollup”（[ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Base%20is%20an%20Optimistic%20Rollup%20built%20with%20the%20OP%20Stack)）。

### ZK Rollup

[ZK Rollup](/zh-CN/glossary/zk-rollup/)采取相反的方法：它不假定有效性并设置挑战期，而是在每个批次旁提交有效性证明——即证明该批次状态转换正确的密码学证明。由于以太坊会在链上验证该证明，“从 ZK Rollup 向以太坊转移资金不会有延迟……因为退出交易会在 ZK Rollup 合约验证有效性证明后执行”（[ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=There%20are%20no%20delays%20when%20moving%20funds%20from%20a%20ZK%2Drollup%20to%20Ethereum)）。ZK Rollup“可在一个批次中处理数千笔交易，然后只向主网发布少量摘要数据”（[ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20can%20process%20thousands%20of%20transactions%20in%20a%20batch)），所用证明系统包括 zk-SNARK（证明小、验证快）和 zk-STARK（透明且无需可信设置）。**zkSync Era**、**Starknet**——ethereum.org 将其描述为“基于 STARK 和 Cairo VM 的通用 ZK Rollup”（[ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Starknet%20is%20a%20general%20purpose%20ZK%20Rollup%20based%20on%20STARKs%20and%20the%20Cairo%20VM)）——以及 **Linea** 都是重要的 ZK Rollup；Polygon zkEVM 和 Scroll 也实现了 zkEVM，以便在可由 ZK 证明的环境中运行现有的以太坊智能合约。

其代价在于：生成有效性证明需要大量计算资源，而且要实现完整的 EVM 等价性，其技术构建难度也高于欺诈证明系统——这也是为什么尽管 ZK Rollup 提供更快的终局性，乐观 Rollup 仍更早获得主流采用。

## 侧链

**侧链**“是一条独立于以太坊运行、通过双向桥与以太坊主网连接的独立区块链”；与 Rollup 不同，“侧链采用独立的共识机制，无法获得以太坊的安全保障”（[ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/#:~:text=A%20sidechain%20uses%20a%20separate%20consensus%20mechanism%20and%20doesn%27t%20benefit%20from%20Ethereum%27s%20security%20guarantees)）。这正是它与 Layer 2 的核心区别：侧链以继承安全性换取独立的设计自由度，通常也带来更低的费用和更快的出块速度，因为它依赖自身的验证者集合，而非以太坊。

**Polygon PoS** 是最知名的例子。Polygon 的产品页面将其描述为“以太坊使用最广泛的侧链——经受实战检验，保障数十亿美元价值，交易近乎即时，费用低于一美分”（[polygon.technology](https://polygon.technology/polygon-pos)）。它由自己的权益证明验证者集合保障，而非以太坊。**Gnosis Chain**（原 xDai）也是一条广泛使用的侧链，此外还有 Skale 和 Metis Andromeda。由于你信任的是一套不同且通常规模更小的验证者集合，侧链的安全性只能与该集合一样强；这与 Rollup 的保障实质不同，后者原则上可以利用锚定在 L1 上的数据发现并回滚无效状态。

## 状态通道与支付通道

**状态通道**允许两个或更多参与方将资金锁定在共享合约中，并直接交换经签名的更新来进行链下交易。因此，“通道对等方可以进行任意数量的链下交易，同时只提交两笔链上交易来开启和关闭通道”（[ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=Channel%20peers%20can%20conduct%20an%20arbitrary%20number%20of%20offchain%20transactions%20while%20only%20submitting%20two%20onchain%20transactions)）。支付通道则将这种模式专用于简单的余额转移，它“最恰当的描述是由两名用户共同维护的‘双向账本’”（[ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=A%20payment%20channel%20is%20best%20described%20as%20a%20%E2%80%9Ctwo%2Dway%20ledger%E2%80%9D%20collectively%20maintained%20by%20two%20users)）。参与者之间可以在链下即时交易任意多次，只有在开启通道（锁定抵押品）和关闭通道（结算最终余额）时才会触及基础链。

最著名的实现是比特币的 **Lightning Network**。其官网将它描述为“利用区块链中的智能合约功能、使参与者网络能够进行即时支付的去中心化网络”，由“可双向使用的支付通道”构成，支付会像数据包在互联网中路由一样被转发（[lightning.network](https://lightning.network/)）。但它也有局限：通道只能扩展彼此之间存在已开启通道路径的参与方之间的交易；开启通道必须预先承诺资金；通道网络要在大规模下良好运行，还需要流动性路由。通用 Rollup 可为任何人运行任意智能合约，这些限制则不适用。

## 分片与数据可用性层

![交易被拆分至四条并行分片通道（分片 1 至分片 4）的扁平矢量图；每条通道独立处理自己的区块链，所有通道都汇入下方的数据可用性层](../../assets/blockchain-scaling-approaches-03-sharding.jpg)

**分片**将区块链的验证工作分配给多个并行的节点子集（“分片”），使任何单一节点都不必处理整个网络的交易负载。Vitalik Buterin 认为“分片是一种能同时获得三者的技术”（[vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Sharding%20is%20a%20technique%20that%20gets%20you%20all%20three)）：它使用随机抽样的验证者委员会并行验证不同分片。使分片能够安全运作、又无需每个节点下载每个分片全部数据的技术是[数据可用性](/zh-CN/glossary/data-availability/)抽样（DAS）——“让网络检查数据是否可用，同时又不会给任何单个节点带来过多负担的方法”（[ethereum.org](https://ethereum.org/en/developers/docs/data-availability/#:~:text=Data%20availability%20sampling%20is%20a%20way%20for%20the%20network%20to%20check%20that%20data%20is%20available%20without%20putting%20too%20much%20strain%20on%20any%20individual%20node)）：轻节点只下载区块数据中随机选取的小部分，借助纠删码，仍可确信完整数据已被发布。

同样的数据可用性问题也直接适用于 Rollup，这正是专用数据可用性层成为独立基础设施类别的原因。**Celestia** 是一条专门构建的模块化区块链，旨在让“Rollup 和 L2 将 Celestia 用作发布交易数据并让任何人都可下载这些数据的网络”（[celestia.org](https://celestia.org/what-is-celestia/#:~:text=Rollups%20and%20L2s%20use%20Celestia%20as%20a%20network%20for%20publishing%20and%20making%20transaction%20data%20available%20for%20anyone%20to%20download)），让 Rollup 能将数据发布到比以太坊主网更便宜、为此目的打造的 DA 层。构建在 EigenLayer 再质押基础设施上的 **EigenDA** 提供类似服务，其安全性来自选择同时保障该 DA 层的以太坊质押者。将数据发布到外部 DA 层而非以太坊 L1 的 Rollup，有时会被称为 *validium* 或 *optimium*，而非“纯”Rollup；L2BEAT 将它们作为与 Rollup 及其他 L2 方案并列的独立类别进行追踪（[l2beat.com](https://l2beat.com/scaling/summary)）。它们以一部分锚定于 L1 的安全保障，换取更低的数据发布成本。

## 方案对比

| 方案 | 计算执行位置 | 继承 L1 安全性？ | 数据可用性 | 主要取舍 | 示例 |
|---|---|---|---|---|---|
| 乐观 Rollup | 链下（L2） | 是——数据与欺诈证明位于 L1 | 完整数据发布到 L1 | 约 7 天的提款挑战期 | Arbitrum、Optimism、Base |
| ZK Rollup | 链下（L2） | 是——数据与有效性证明位于 L1 | 完整数据发布到 L1 | 证明生成昂贵；实现完整 EVM 等价性更难 | zkSync、Starknet、Linea |
| 侧链 | 独立链 | 否——使用自身共识与验证者 | 自有链，不发布到 L1 | 安全性只与自身验证者集合一样强 | Polygon PoS、Gnosis Chain |
| 状态／支付通道 | 链下，在参与方之间 | 间接继承——资金锁定在 L1 | 不发布；只有最终状态上链 | 只能扩展通道连通的参与方之间的交易；资金必须预先锁定 | Lightning Network |
| 分片／DA 层 | 并行分片，或独立 DA 网络 | 不一——L1 分片继承安全性；外部 DA 层引入新的信任假设 | 通过数据可用性抽样验证 | 外部 DA 可降低成本，但会增加 L1 之外的依赖 | 以太坊的分片路线图、Celestia、EigenDA |

没有一种方案能在每个维度上胜出，因此生产系统越来越多地将它们结合使用。例如，一个将数据发布到 Celestia 而非以太坊的 ZK Rollup，可以从一层借用有效性证明带来的安全性，再从另一层获得更低成本的数据可用性。

---

## 与代币化域名的关联

扩容选择会影响[代币化域名](/zh-CN/glossary/tokenized-domain/)，因为每次铸造、转移、DNS 更新或抵押品操作都是链上交易，其成本和终局性时间取决于它在何处结算。在乐观 Rollup 上确认的代币化 `.com` 转移，在 L2 上看起来费用低、速度快，但该 Rollup 交易[只有在 Rollup 区块被以太坊接受后才达到终局性](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=transactions%20conducted%20on%20the%20rollup%20are%20only%20final%20after%20the%20rollup%20block%20is%20accepted%20on%20Ethereum)。快速退出桥不会让 Rollup 状态更早在 L1 上达到终局性：对于提款，流动性提供者会[接手待处理的 L2 提款，并在 L1 上向用户付款](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=A%20liquidity%20provider%20assumes%20ownership%20of%20a%20pending%20L2%20withdrawal%20and%20pays%20the%20user%20on%20L1)，通常会收取费用，而标准提款仍须等待挑战期结束。同一笔转移若在 ZK Rollup 上进行，则会在有效性证明上链后立即相对于 L1 达到终局性。侧链的成本可能更低，但若域名 NFT 只存在于某条侧链上，它继承的是该侧链规模更小的验证者集合的安全性，而非以太坊的安全性。理解这些取舍，是理解域名以链上形式表示时你实际拥有何物的一部分；这也是理解[Web3 基础知识](/zh-CN/topics/web3-foundations/)时应具备的同一种尽职调查习惯。

---

## 来源与延伸阅读

- [区块链可扩展性的边界 — Vitalik Buterin](https://vitalik.eth.limo/general/2021/04/07/sharding.html)
- [Layer 2 — ethereum.org](https://ethereum.org/en/layer-2/)
- [乐观 Rollup — ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/)
- [ZK Rollup — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [侧链 — ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/)
- [状态通道 — ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/)
- [数据可用性 — ethereum.org](https://ethereum.org/en/developers/docs/data-availability/)
- [L2BEAT 扩容摘要](https://l2beat.com/scaling/summary)
- [什么是 Celestia？— celestia.org](https://celestia.org/what-is-celestia/)
- [Lightning Network](https://lightning.network/)
- [Polygon PoS — polygon.technology](https://polygon.technology/polygon-pos)
