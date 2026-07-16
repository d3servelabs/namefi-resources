---
title: "区块链共识机制详解：工作量证明、权益证明及其他机制"
date: '2026-07-02'
language: zh-CN
tags: ['guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 20
format: roundup
description: 清晰解析区块链共识机制——工作量证明、权益证明、委托权益证明、BFT 共识，以及各机制如何保障网络安全。
ogImage: ../../assets/blockchain-consensus-mechanisms-og.jpg
keywords: ['区块链共识机制', '共识机制', '工作量证明', '权益证明', '委托权益证明', '拜占庭容错', 'Tendermint', 'CometBFT', '历史证明', '权威证明', '空间证明', '双重支付问题', '区块链终局性', '以太坊合并', '比特币挖矿', '验证者', '质押', '抗女巫攻击能力', 'Namefi']
relatedArticles:
  - /zh-CN/blog/blockchain-virtual-machines/
  - /zh-CN/blog/blockchain-scaling-approaches/
  - /zh-CN/blog/blockchain-cryptographic-primitives/
  - /zh-CN/blog/blockchain-privacy-technologies/
  - /zh-CN/blog/what-are-tokenized-domains/
relatedGlossary:
  - /zh-CN/glossary/consensus-mechanism/
  - /zh-CN/glossary/proof-of-work/
  - /zh-CN/glossary/proof-of-stake/
  - /zh-CN/glossary/blockchain/
  - /zh-CN/glossary/ethereum/
relatedTopics:
  - /zh-CN/topics/web3-foundations/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/tokenize-your-com/
  - /zh-CN/series/domain-flipping-skills/
---

每一条[区块链](/zh-CN/glossary/blockchain/)在能够被托付资金之前，都必须回答一个问题：由谁决定发生了什么，以及其先后顺序？这里没有银行、公证人，也没有中央服务器可以拍板。**共识机制**是一套规则，网络参与者据此就唯一、共享的交易历史达成一致——既不需要中央机构，也不会让任何人把同一枚代币花两次。

本指南将介绍当今主要的共识机制、每种机制实际上如何选出下一个区块，以及其中的取舍所在。

---

## 共识机制实际解决什么问题

有两个问题让去中心化的达成一致变得困难。

**双重支付问题。** 在数字系统中，一个价值单位只是数据，而数据可以被复制。没有裁判，就无法阻止某人广播两笔彼此冲突、却都花费同一枚代币的交易。中本聪的比特币白皮书直接阐明了目标：网络需要“让参与者就其接收顺序的一段唯一历史达成一致的系统”，使收款人能够确信较早的付款不会被较晚、相冲突的交易推翻（[比特币白皮书](https://bitcoin.org/bitcoin.pdf)）。

**没有中央机构时如何达成一致。** 在普通数据库中，一家运营方说了算。在公开、无需许可的网络中，任何人都可以运行节点、提议交易并尝试添加下一个区块——其中也包括可能撒谎、审查或试图重写历史的参与者。共识机制既要让攻击账本的代价高得令人无法承受，或以其他方式消除攻击动机，又要让诚实参与者维持网络运行的成本足够低。

以下每一种机制都在回答同一个问题：“谁来提议下一个区块，我们又如何知道该信任它？”比较这些机制时，最重要的两条轴线是**[抗女巫攻击能力](/zh-CN/glossary/consensus-mechanism/)**——什么能阻止攻击者创建无限多个虚假身份来压倒其他所有人——以及**终局性**——一笔交易以多快的速度、又以多绝对的方式变得不可逆转。

---

## 工作量证明

![多名矿工竞相解开同一道哈希谜题，其中一人举起写着“找到了！”的区块，闪电象征挖矿的高能耗](../../assets/blockchain-consensus-mechanisms-01-proof-of-work.jpg)

[工作量证明](/zh-CN/glossary/proof-of-work/)（Proof of Work，PoW）是比特币于 2009 年引入的机制，也是大多数人听到“区块链”时会想到的机制。矿工竞相解决一道密码学谜题：反复使用 nonce 对候选区块数据进行哈希，直到所得哈希值低于目标值。以太坊的开发者文档对这场竞赛描述得很直白——矿工会“反复将一组数据……输入数学函数”，以便在其他人之前找到有效解（[ethereum.org：工作量证明](https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/#:~:text=When%20racing%20to%20create%20a%20block%2C%20a%20miner%20repeatedly%20put%20a%20dataset)）。谁先找到有效哈希，谁就能提议下一个区块，并获得区块奖励及交易费。

**抗女巫攻击能力**来自谜题本身：计算哈希需要真实的电力和硬件，因此伪造许多身份不会带来优势——只有纯粹的计算能力才重要。**终局性具有概率性。** 比特币白皮书指出，节点会始终将“最长链视为正确链”（[比特币白皮书](https://bitcoin.org/bitcoin.pdf)）；收款人通过等待其上继续挖出更多区块，来提高对交易已结算的信心。每一个新区块都会让重写历史的成本呈指数级上升，但没有任何单一区块能在瞬间获得数学意义上的最终确定性。

代价是能源。用现实世界的计算来保护网络，意味着消耗现实世界的电力，这也是比特币挖矿以每年太瓦时计量的原因。**示例链：**比特币、莱特币、狗狗币，以及 2022 年前的以太坊。

---

## 权益证明

![一名验证者将一摞代币作为质押存入保险库，随后由抽奖转盘选中来提议下一个区块；保险库上带有惩罚性削减警示标签](../../assets/blockchain-consensus-mechanisms-02-proof-of-stake.jpg)

[权益证明](/zh-CN/glossary/proof-of-stake/)（Proof of Stake，PoS）用经济担保取代计算工作。参与者不再挖矿，而是进行**质押**——锁定网络的原生资产——协议再以伪随机方式选出一名质押者来提议每个区块。以太坊的验证者角色是很好的参考设计：验证者存入 32 ETH 并运行客户端软件；随后协议会在“每个时隙随机选出一名验证者担任区块提议者”，而由随机选出的其他验证者委员会为该区块的有效性作证明（[ethereum.org：权益证明](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=One%20validator%20is%20randomly%20selected%20to%20be%20a%20block%20proposer%20in%20every%20slot)）。

**抗女巫攻击能力**来自质押本身——创建许多虚假验证者只是在更多身份之间分割同一笔资本，并不会获得额外影响力。提议相互冲突的区块或作出彼此矛盾的证明等不诚实行为，会受到**惩罚性削减**（slashing）的处罚：协议会销毁违规验证者部分质押（[ethereum.org：权益证明](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=Two%20primary%20behaviors%20can%20be%20considered%20dishonest)）。以太坊使用检查点机制（Casper FFG 与 LMD-GHOST 分叉选择规则相结合）在各个周期（epoch）中完成区块的最终确认，在无需 BFT 风格单轮投票的前提下，提供比纯 PoW 更强的终局性保障。

相对于 PoW，最显著的取舍是能源：质押不需要专用硬件竞相解题，因此正如 ethereum.org 所说，“无需在工作量证明计算上消耗大量能源”（[ethereum.org：权益证明](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=there%20is%20no%20need%20to%20use%20lots%20of%20energy%20on%20proof)）。这一节省的规模有充分记录：独立分析机构 CCRI 发现，以太坊在 2022 年 9 月从 PoW 转向 PoS——即“The Merge”——使网络的年化用电量减少了超过 99.988%（[ethereum.org：能源消耗](https://ethereum.org/en/energy-consumption/#:~:text=CCRI%20estimates%20that%20The%20Merge%20reduced%20Ethereum%27s%20annualized%20electricity%20consumption%20by%20more%20than%2099.988%25)）。**示例链：**以太坊、Cardano、Solana（将 PoS 用于经济安全性，并结合历史证明），以及 Polkadot。

---

## 委托权益证明

委托权益证明（Delegated Proof of Stake，DPoS）保留了质押模型，但增加了一层选举机制。并非让每个质押者都能独立获得提议区块的资格，代币持有者将其质押权重投给一小组**代表**（也称见证人或区块生产者），只有该当选集合实际生产区块。投票权会随所持代币数量而增长；相关领域对其核心机制的说明很准确：“每位代币持有者的投票权与其持有的代币数量成正比”，而且选举持续进行，因此持有者随时可以重新分配选票，或投票罢免表现不佳的代表（[Binance Academy：委托权益证明详解](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)）。

**抗女巫攻击能力**仍以质押为基础——投票按所持代币加权，而非按账户数量加权——但区块*生产*集中于一个小型的当选委员会，而非向每一位质押者开放。这种集中正是其设计目的：由于活跃验证者集合规模小且事先已知，DPoS 网络“能够实现很快的区块时间，通常远低于三秒”（[Binance Academy：委托权益证明详解](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)）。代价是去中心化程度——大多数 DPoS 网络大约运行着“21 至 101 名活跃验证者”，远少于开放式 PoS 网络中常见的数百或数千名验证者；而选民冷漠会让同一批代表随着时间推移巩固其地位（[Binance Academy：委托权益证明详解](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)）。**示例链：**EOS、TRON，以及许多早期 Cosmos SDK 应用链（经过修改的形式）。

---

## BFT 风格共识（Tendermint / CometBFT、PBFT）

![一群验证者围坐在桌旁，超过三分之二的人举起绿色对勾牌表示同意，随即最终确认一个带锁图标的区块](../../assets/blockchain-consensus-mechanisms-03-bft.jpg)

拜占庭容错（BFT）共识采用完全不同的方法：它不让一个提议者竞赛或被随机选出负责每个区块，而是由一组已知的验证者进行明确的多轮投票，只有在同一轮中获得超级多数——通常超过三分之二的投票权——同意时，才提交区块。**CometBFT**（Tendermint Core 的后继者，也是 Cosmos SDK 背后的共识引擎）将自身描述为“为任意确定性、有限状态机提供拜占庭容错（BFT）状态机复制（SMR）”（[Cosmos 文档：CometBFT](https://docs.cosmos.network/cometbft)）；这意味着即便其中一些节点发生故障或恶意行事，它仍能将一组独立运行的节点转化为一份一致的复制账本。

在 Tendermint 风格的链中，**抗女巫攻击能力**通常通过质押叠加实现（验证者与 PoS 一样按质押加权），而 BFT 投票协议本身提供**终局性**：一旦区块在某轮收集到所需超级多数的验证者签名，它就被提交，不会像 PoW 区块那样发生重组。这带来了快速、实用的结算——Cosmos Network 强调基于 CometBFT 的链可实现不足一秒的交易结算（[Cosmos Network](https://cosmos.network/#:~:text=%3C1%20second%20transaction%20settlement)）——与 PoW 通过等待确认的模型形成对比。代价在于 BFT 协议要求验证者集合已知且规模受限（通信开销会随验证者数量增长），这限制了能够直接参与的验证者人数。**示例链：**Cosmos Hub 和其他 Cosmos SDK 链（CometBFT）、Binance Chain，以及构建在原始实用拜占庭容错（PBFT）设计之上的许可制或企业账本。

---

## 其他机制：历史证明、权威证明与空间证明

还有几种机制补全了这一图景；它们各自解决更狭窄的问题，而不是取代抗女巫攻击这一核心问题。

**历史证明（Proof of History，PoH）**由 Solana 与 PoS 一同使用，它不是独立的共识机制，而是一种密码学时钟。它通过反复哈希“先前生成状态的数据”，将可验证的时间戳直接插入链中，创建出一个序列来证明事件之间经过了多少时间，而验证者无需就时间进行通信（[Solana：历史证明](https://solana.com/news/proof-of-history#:~:text=inserting%20data%20into%20the%20sequence%20by%20appending%20the%20hash%20of%20the%20data%20of%20the%20previously%20generated%20states)）。这个时钟为验证者提供了用于共识的可验证排序，但并不负责并行执行交易。并行执行来自 **Sealevel**：Solana 交易会声明其将读取或写入的每个账户，因此运行时可以并发执行互不重叠的交易，以及仅从同一状态读取数据的交易（[Solana：Sealevel](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=The%20reason%20why%20Solana%20is%20able%20to%20process%20transactions%20in%20parallel,transactions%20that%20are%20only%20reading%20the%20same%20state%20to%20execute%20concurrently%20as%20well)）。

**权威证明（Proof of Authority，PoA）**用一组获准的签名者取代开放挖矿或基于质押的验证。与 PoW 相比，这显著降低了生产区块的资源成本；ethereum.org 指出，PoA 无需像 PoW 那样进行高资源消耗的挖矿（[ethereum.org：权威证明](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=as%20it%20overcomes%20the%20need%20for%20high%20quality%20resources%20as%20PoW%20does)）。但它并不会消除网络运行或安全成本。安全与治理负担转移到了可信验证者的身份、声誉以及签名者准入规则上：PoA 要求信任一组身份已知的签名者，这些签名者通常经过 KYC 验证，或隶属于身份明确的组织（[ethereum.org：可信签名者](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=Proof%2Dof%2Dauthority%20requires%20trusting%20a%20set%20of%20authorized%20signers,if%20a%20validator%20does%20anything%20wrong%2C%20their%20identity%20is%20known)）；ethereum.org 所述的实现还允许签名者投票添加或移除其他签名者（[ethereum.org：签名者准入](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=Each%20signer%20votes%20for%20the%20addition%20or%20removal%20of%20a%20signer%20in%20their%20block%20when%20they%20create%20a%20new%20block)）。它以去中心化换取速度和较低的运营成本，因此主要用于私有链、测试网和本地开发网络，而不是公开、对抗性的网络。

**空间证明**（及其近亲时空证明）以分配的磁盘存储空间取代计算能力或质押：参与者证明自己已预留未使用的硬盘空间，协议会定期挑战他们，以证明这些空间仍由其持有。它以远低于 PoW 的能源足迹提供类似的抗女巫攻击能力，代价是需要大量存储硬件。Chia 是最知名的例子。

---

## 机制比较

| 机制 | 抗女巫攻击基础 | 终局性 | 能源成本 | 去中心化程度 | 示例链 |
|---|---|---|---|---|---|
| 工作量证明 | 计算成本（哈希计算） | 概率性（确认次数） | 非常高 | 高（无需许可的挖矿） | 比特币、莱特币、狗狗币 |
| 权益证明 | 面临损失风险的经济质押 | 在 epoch 内通过检查点实现近乎最终确认 | 非常低 | 高（数十万验证者） | 以太坊、Cardano、Polkadot |
| 委托权益证明 | 面向代表的、按质押加权的投票 | 快速，每位当选生产者近乎即时 | 非常低 | 较低（小型当选验证者集合） | EOS、TRON |
| BFT 风格（Tendermint/CometBFT、PBFT） | 质押或许可制身份 + 超级多数投票 | 一经提交即即时且确定 | 低 | 中等（规模受限的验证者集合） | Cosmos Hub、Binance Chain |
| 权威证明 | 经审查的身份/声誉 | 快速，近乎即时 | 非常低 | 低（小型受信任验证者集合） | 私有/企业链、测试网 |
| 空间证明 | 分配的存储容量 | 概率性（基于区块） | 低 | 中等（依赖存储硬件） | Chia |

---

## 这与代币化域名有何关联

共识机制是支撑每个[代币化域名](/zh-CN/blog/what-are-tokenized-domains/)的隐形基础。当 `.com`、`.ai` 或 `.io` 域名被铸造成 [NFT（非同质化代币）](/zh-CN/glossary/nft/) 时，该链的共识会确认并排序相应的账本状态，从而保障链上所有权记录，以及任何记录在链上的代币转移或出售结算。它不会取代注册商与注册局负责的底层 DNS 域名续费和注册有效性维护流程。铸造在[以太坊](/zh-CN/glossary/ethereum/)上的域名 NFT 会继承以太坊 PoS 基于检查点的终局性保障；同一资产若位于 PoW 链上，则会继承该链的概率性确认模型。交易费和用户在实际使用中感受到的结算时间，还取决于执行容量、网络需求以及用户使用的是 L1 还是 L2，而不是仅由 PoW 与 PoS 的差异决定。了解一条链采用哪种底层机制、它实际保障什么，以及其抗女巫攻击能力与终局性保障意味着什么，是评估任何链上资产（包括代币化域名）的一部分。

---

## 来源与延伸阅读

- [Bitcoin：点对点电子现金系统（中本聪白皮书）](https://bitcoin.org/bitcoin.pdf)
- [ethereum.org — 工作量证明](https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/)
- [ethereum.org — 权益证明](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/)
- [ethereum.org — 权威证明](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/)
- [ethereum.org — 能源消耗](https://ethereum.org/en/energy-consumption/)
- [Cosmos 文档 — CometBFT](https://docs.cosmos.network/cometbft)
- [Cosmos Network](https://cosmos.network/)
- [Binance Academy — 委托权益证明详解](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)
- [Solana — 历史证明](https://solana.com/news/proof-of-history)
- [Solana — Sealevel：并行处理数千个智能合约](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
