---
title: "顶级区块链虚拟机：EVM、SVM、MoveVM、WASM 与 CairoVM"
date: '2026-07-02'
language: zh-CN
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 30
format: roundup
description: 对顶级区块链虚拟机的指南——包括 EVM、SVM、MoveVM、基于 WASM 的虚拟机和 CairoVM，比较它们的语言、执行模型和生态系统。
ogImage: ../../assets/blockchain-virtual-machines-og.jpg
keywords: ['区块链虚拟机', '区块链虚拟机比较', 'evm', '以太坊虚拟机', 'svm', 'Solana 虚拟机', 'Sealevel', 'movevm', 'Move 语言', 'WASM 区块链', 'CosmWasm', 'PolkaVM', 'CairoVM', 'Cairo 语言', 'Starknet', '智能合约语言', '区块链并行执行', 'EVM 兼容', '区块链执行环境', '区块链状态机']
relatedArticles:
  - /zh-CN/blog/blockchain-consensus-mechanisms/
  - /zh-CN/blog/blockchain-scaling-approaches/
  - /zh-CN/blog/blockchain-cryptographic-primitives/
  - /zh-CN/blog/blockchain-privacy-technologies/
  - /zh-CN/blog/what-are-tokenized-domains/
relatedTopics:
  - /zh-CN/topics/web3-foundations/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/tokenize-your-com/
  - /zh-CN/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/ethereum-virtual-machine/
  - /en/glossary/webassembly/
  - /zh-CN/glossary/smart-contract/
  - /zh-CN/glossary/ethereum/
  - /zh-CN/glossary/gas/
---

每个[智能合约](/zh-CN/glossary/smart-contract/)都必须在某处运行。这个“某处”就是区块链虚拟机（VM）——由网络中的每个节点以完全相同的方式执行的沙盒化程序，因此无论由谁运行，相同的输入总会产生相同的输出。所构建的 VM 几乎决定了一条链的一切：可以使用哪些编程语言、交易能否同时运行还是只能依次运行，以及从第一天起能够接入多大范围的现有开发者生态系统。

本指南将介绍五种 VM 设计；它们共同支撑了当今 [Web3](/zh-CN/glossary/web3/) 中大多数智能合约活动： [以太坊虚拟机](/en/glossary/ethereum-virtual-machine/)（EVM）、Solana 的 SVM、Aptos 和 Sui 所使用的 MoveVM、CosmWasm 和 PolkaVM 等基于 [WebAssembly](/en/glossary/webassembly/)（WASM）的 VM，以及 Starknet 的 CairoVM。

---

## 什么是区块链虚拟机，为什么它重要？

区块链 VM 是一种确定性的沙盒化执行环境：每个全节点下载相同的交易，通过相同的 VM 执行它们，并得到相同的[链上 (On-chain)](/zh-CN/glossary/on-chain/)状态。以太坊官方文档将 EVM 描述为“在所有以太坊节点上一致且安全地执行代码的去中心化虚拟环境”（[ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20is%20a%20decentralized,mechanics%20of%20how%20they%20work)）——这一描述同样适用于本指南中的每一种 VM。

VM 的设计权衡由两个属性决定：

- **语言和工具链。** 开发者能用什么语言编写合约？已有多少经过审计的代码库、工具，以及熟悉该语言、可供招聘的开发者？
- **执行模型。** VM 是严格地一次处理一笔交易（串行），还是让相互独立的交易在多个 CPU 核心上同时运行（并行执行）？串行执行更容易推理；并行执行可提高理论吞吐量，但也增加了调度复杂性。

这些选择会进一步影响 Gas 成本、拥堵时的行为，以及哪些现有合约和工具无需重写即可迁移——因此，“选择哪种 VM”是每条新链，或构建在其上的每项[代币化](/zh-CN/glossary/tokenize/)资产，都必须首先回答的问题之一。

---

## EVM（以太坊虚拟机）

![EVM 的扁平矢量图：作为单车道栈机器，指令指针将数值压入和弹出垂直栈，Gas 计量表盘跟踪执行成本](../../assets/blockchain-virtual-machines-01-evm-stack.jpg)

EVM 是最早出现且部署最广泛的智能合约 VM，随[以太坊](/zh-CN/glossary/ethereum/)于 2015 年推出。它是一种**基于栈的**机器：以太坊文档规定，它“作为一台深度为 1024 项的栈机器运行”，每一项都是一个 256 位字（[ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20executes%20as%20a,256%2Dbit%20word)）。合约状态保存在与每个账户关联的 Merkle Patricia trie 中，而全局链状态同样组织为一个经修改的 Merkle Patricia trie，通过哈希连接所有账户（[ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Ethereum%20uses%20a%20modified%20Merkle,linked%20by%20hashes)）。

**语言。** 合约几乎总是使用 **Solidity** 编写；以太坊官方文档将其描述为“一种用于实现智能合约的面向对象高级语言”，深受 C++ 语法影响（[ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Solidity)）。主流替代方案是 **Vyper**，一种刻意删减功能以便于审计合约的“Python 风格”语言（[ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Vyper)）。

**执行模型。** EVM 在一个区块内**串行地**处理交易——按固定顺序一笔接一笔地执行——这使状态转换逻辑简单且易于审计，但也限制了基础层的吞吐量。

**Gas。** 每项操作都需要消耗[Gas（交易费用）](/zh-CN/glossary/gas/)；Gas 是以太坊用于衡量“操作所需计算工作量”的单位，用于为执行定价，并保护网络免受垃圾交易或无限循环的侵害（[ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Since%20each%20transaction%20is%20broadcast,uses%20gas)）。

**独特优势与覆盖范围。** EVM 真正的护城河在于其生态系统：它是加密领域实现最广泛的 VM，数十个 Layer 2 和独立链（Arbitrum、Optimism、Base、Polygon、BNB Chain、Avalanche C-Chain）都提供**EVM 兼容**或**EVM 等效**环境，因此现有的 Solidity 合约、钱包和工具几乎无需修改即可部署。

---

## SVM（Solana / Sealevel）

![扁平矢量图：多车道公路上的交易汽车并行行驶，与单车道道路上排队的汽车形成对比，说明 Solana 的 Sealevel 并行执行与串行执行的区别](../../assets/blockchain-virtual-machines-02-parallel-execution.jpg)

Solana 的运行时 **Sealevel** 建立在一个明确的判断之上：大多数交易触及的是相互独立的状态片段，因此可以同时执行，而不是一次执行一笔。Solana 自己的公告将 Sealevel 描述为“Solana 的并行智能合约运行时”，能够“使用验证者可用的任意数量核心，并行处理数千份合约”（[solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sealevel%E2%80%94Parallel%20Smart%20Contracts%20Runtime)）。

**并行如何实现。** Solana 交易必须预先声明它们将读取或写入的每一个账户。这一声明使调度成为可能：运行时可以“排序数百万笔待处理交易”，并“将所有互不重叠的交易并行调度”；其中包括允许只*读取*同一账户的多笔交易并发运行（[solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sort%20millions%20of%20pending%20transactions)）。只有当两笔交易都写入同一个账户时，它们才必须相互串行化。

**语言和 VM 内部机制。** Solana 程序（即其对智能合约的称呼）被编译为 Berkeley Packet Filter 字节码的一种变体——Solana Labs 表示，为链上 VM 选择了“Berkeley Packet Filter（BPF）字节码的一种变体”（[solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Berkeley%20Packet%20Filter)）。程序最常使用 **Rust** 编写，也支持 C 和 C++。

**独特优势。** 由于账户级并行性是运行时的属性，而不是每个合约作者必须手动实现的能力，Solana 无需将执行移至链下即可维持高吞吐量；代价是更严格的账户声明模型，这改变了合约的编写方式，区别于 EVM 的自由形式存储。

---

## MoveVM（Aptos 与 Sui）

![扁平矢量图：一枚硬币被视为在两个账户方框之间传递的实体资源，带有“不可复制”和“不可丢失”保护徽章，说明 Move 的资源模型](../../assets/blockchain-virtual-machines-03-move-resource.jpg)

**Move** 是最初为 Meta 的 Diem 项目构建的智能合约语言，现在是 **Aptos** 和 **Sui** 的基础层；两者各自运行自己的 MoveVM 变体。Aptos 文档将 Move 描述为“一种面向 Web3 的安全、可靠编程语言，强调稀缺性和访问控制”（[aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Move%20is%20a%20safe%20and,scarcity%20and%20access%20control)）。

**资源模型。** Move 的核心理念是将数字资产视为**资源**——这种特殊的结构体类型，语言的类型系统保证其“不会被意外复制或丢弃”（[aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Resources%20cannot%20be%20copied%2C%20they,structs%20cannot%20be%20accidentally%20duplicated)）。一个被建模为 Move 资源的代币或 NFT，不可能因有缺陷的合约而被复制；而朴素的账户余额整数则可能因此发生双花——编译器会拒绝这类程序。只有被明确标记为可复制或可丢弃的结构体，才能被复制或丢弃。

**并行执行。** Aptos 通过 **Block-STM** 运行 Move 合约；文档称其可实现“无需用户任何输入的交易并发执行”——运行时在执行时推断哪些交易相互独立，而不是要求使用 Solana 那种已声明的账户列表（[aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Parallelism%20via%20Block,input%20from%20the%20user)）。

**Sui 的对象模型。** Sui 借助以对象为中心的存储层进一步扩展了 Move 的资源理念：“对象是网络上的基本存储单元。每一项资源、资产或链上数据都是一个对象。”它们通过唯一 ID 寻址，而不是存放在账户的键值存储中（[docs.sui.io](https://docs.sui.io/concepts/object-model#:~:text=An%20object%20is%20a%20fundamental,piece%20of%20data%20onchain%20is%20an%20object)）。对象要么是单一所有者的**自有对象**（由于其他交易无法触及它们，因此无需共识排序即可并行执行），要么是可由多方访问、确实需要共识排序的**共享对象**。

**独特优势。** Move 的资源类型使整类资产漏洞——双花、意外销毁——在编译时就无法表达；Aptos 和 Sui 都将这一安全模型与从一开始就为并行执行设计的架构结合起来，而非事后改造。

---

## 基于 WASM 的 VM（CosmWasm、PolkaVM）

与定义专用字节码格式不同，另一类链通过 **WebAssembly** 执行智能合约；它是一种最初为浏览器构建的通用二进制格式。WebAssembly 标准将 Wasm 描述为“一种基于栈虚拟机的二进制指令格式”，它被设计为“编程语言的可移植编译目标”，并“旨在以接近原生速度执行”（[webassembly.org](https://webassembly.org/#:~:text=WebAssembly%20(abbreviated%20Wasm)%20is%20a,wide%20range%20of%20platforms)）。将 Wasm 用作合约 VM 意味着，原则上任何以 Wasm 为编译目标的语言——Rust、C、C++、Go——都能生成可部署的合约。

**CosmWasm。** CosmWasm 是 Cosmos 生态系统中占主导地位的基于 Wasm 的智能合约平台，将自己描述为“面向多链世界的安全、高性能、可互操作智能合约平台”（[cosmwasm.com](https://www.cosmwasm.com/#:~:text=Secure%2C%20performant%2C%20interoperable%20smart%20contract,platform%20for%20the%20multi%2Dchain%20world)）。合约使用 **Rust** 编写，并运行在“高度优化的 Web Assembly 运行时”上（[cosmwasm.com](https://www.cosmwasm.com/#:~:text=highly%20optimized%20Web%20Assembly%20runtime)）。CosmWasm 已部署在数十条 Cosmos SDK 链上，包括 Osmosis、Neutron、Injective、Secret Network 和 Terra，并继承了 Cosmos 原生的 IBC 跨链消息传递能力。

**PolkaVM。** Polkadot 较新的智能合约 VM 另辟蹊径：Parity 没有执行原始 Wasm，而是在其仓库描述中将 PolkaVM 构建为“一种通用、用户级、基于 RISC-V 的虚拟机”（[github.com/paritytech/polkavm](https://github.com/paritytech/polkavm#:~:text=PolkaVM%20is%20a%20general%20purpose,level%20RISC%2DV%20based%20virtual%20machine)）。根据 ink! 智能合约文档，其理由在于性能：RISC-V 的执行“与交易吞吐量和交易成本相关”，相比 ink! 先前使用的 Wasm 解释器，能够实现更快、更低成本的执行（[use.ink](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/#:~:text=performance%20correlates%20with%20transaction%20throughput)）。值得注意的是，Polkadot 的 PolkaVM 栈（品牌名为 “Revive”）也提供 EVM 解释器层，使 Solidity 合约能在同一 RISC-V 后端运行。

**独特优势。** 基于 WASM 的 VM 以成熟且实现广泛的编译目标，取代了专为某一链设计的字节码；Rust 尤其能为合约代码带来强大的内存安全保证，而底层的 Wasm/RISC-V 运行时则受益于为规模更大、非区块链使用场景构建的工具。

---

## CairoVM（Starknet）

**Cairo** 是专为零知识证明生成而构建的智能合约语言和 VM，为以太坊 [Layer 2](/zh-CN/glossary/layer-2/) **Starknet** 提供底层支撑。Starknet 官方文档明确说明了其设计目标：“Cairo 是一种对 STARK 友好的冯·诺依曼架构，能够为任意计算生成有效性证明”（[starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Cairo%20is%20a%20STARK,for%20arbitrary%20computations)）。“对 STARK 友好”意味着该指令集“针对 STARK 证明系统进行了优化，同时仍与其他证明系统后端兼容”（[starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Being%20STARK,other%20proof%20system%20backends)）——这与 EVM 或 SVM 的优先级相反：后二者先为执行而设计，只在后来才为扩展性加入证明系统。

**执行模型。** Cairo 会被编译为图灵完备的指令集（即“Cairo 机器”）；它被指定为一组代数中间表示，因此任何 Cairo 程序的执行轨迹都可以转化为可在以太坊 L1 上验证的简洁 STARK 证明（[starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=At%20its%20core%2C%20Cairo%20is,arbitrary%20code%29%20through%20the%20Cairo%20machine)）。这使 Starknet 能在链下批处理数千笔交易，再向以太坊提交一份紧凑的正确性证明，而不是重放每一笔交易。

**独特优势。** 由于可证明性而非事后考量是起始设计约束，Cairo 程序生成证明的成本低于在经改造、配有 zk-prover 的通用 VM（“zkEVM”）上运行的等效计算。其权衡是：相较于来自以太坊、熟悉 Solidity 的开发者所面对的环境，它的语言生态较新、更小，学习曲线也更陡峭。

---

## 对比表

| VM | 合约语言 | 执行 / 状态模型 | 并行执行 | 生态系统规模 | EVM 兼容性 |
|---|---|---|---|---|---|
| **EVM** | Solidity、Vyper | 栈机器；账户/存储状态位于 Merkle Patricia trie 中 | 否——在一个区块内串行执行 | 最大；Layer 2 和应用链的默认目标 | 原生 |
| **SVM（Solana）** | Rust、C、C++ | 源自 BPF 的字节码；基于账户的状态，声明读/写集合 | 是——Sealevel 并发调度互不重叠的交易 | 大型、快速增长，主要为 Solana 原生 | 否（独立生态系统） |
| **MoveVM（Aptos/Sui）** | Move | 资源类型化对象；Aptos 使用 Block-STM，Sui 使用对象的自有/共享模型 | 是——在运行时推断（Aptos），或通过对象所有权实现（Sui） | 较小、仍在增长；两个相互独立的 Move 生态系统 | 否 |
| **基于 WASM（CosmWasm、PolkaVM）** | Rust（CosmWasm）；Rust/C/RISC-V 工具链（PolkaVM） | Wasm 字节码（CosmWasm）或 RISC-V 字节码（PolkaVM） | 取决于链；并非 Wasm 执行的普遍属性 | 中等；分布在众多 Cosmos 链和 Polkadot 平行链集合中 | PolkaVM/Revive 添加 EVM 解释器层；CosmWasm 不兼容 EVM |
| **CairoVM（Starknet）** | Cairo | 为 STARK 证明设计的、基于 AIR 的图灵完备机器 | 不是主要设计目标——为可证明性而非并发性优化 | 五者中最小，但随 Starknet 的 Layer 2 活动增长 | 否（zkEVM 项目会另行桥接 Solidity 合约） |

---

## 这与代币化域名有何关联

一条链运行哪种 VM，直接关系到[代币化域名](/zh-CN/glossary/tokenized-domain/)基础设施。由[NFT（非同质化代币）](/zh-CN/glossary/nft/)表示的域名，本质上是一个智能合约，负责强制执行谁拥有代币以及他们可以如何使用它——这正是 Move 的资源模型旨在使其可被证明安全的同类逻辑，也是 EVM 成熟的工具链使其易于审计并与现有钱包和市场集成的原因。Namefi 的代币化模式刻意面向 EVM 生态系统：EVM 兼容意味着代币化的 `.com` 或 `.ai` 域名的所有权 NFT 可以开箱即用地配合现有的 EVM 钱包、市场和 DeFi 协议，而不必为每一种新 VM 都专门构建集成。请访问 [namefi.io](https://namefi.io) 探索代币化域名。

---

## 来源与延伸阅读

- [以太坊虚拟机（EVM）— ethereum.org](https://ethereum.org/en/developers/docs/evm/)
- [智能合约语言 — ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/)
- [Sealevel — 并行处理数千份智能合约 — Solana](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
- [Move — Aptos 文档](https://aptos.dev/en/network/blockchain/move)
- [对象模型 — Sui 文档](https://docs.sui.io/concepts/object-model)
- [CosmWasm](https://www.cosmwasm.com/)
- [PolkaVM — GitHub（paritytech）](https://github.com/paritytech/polkavm)
- [为何为智能合约选择 RISC-V 和 PolkaVM — ink! 文档](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/)
- [Cairo 架构 — Cairo 编程语言 / Starknet](https://www.starknet.io/cairo-book/ch201-architecture.html)
- [WebAssembly](https://webassembly.org/)
