---
title: "区块链隐私技术详解：零知识证明、FHE、MPC、TEE 与环签名"
date: '2026-07-02'
language: zh-CN
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 50
format: roundup
description: 一篇通俗易懂的指南，对零知识证明、FHE、MPC、TEE 和环签名这五大领先区块链隐私技术进行横向比较。
ogImage: ../../assets/blockchain-privacy-technologies-og.jpg
keywords: ['区块链隐私', '零知识证明', 'zkp', '全同态加密', 'fhe', '安全多方计算', 'mpc', '可信执行环境', 'tee', '环签名', '隐身地址', 'monero', 'zcash', 'zksync', 'starknet', '隐私技术', '机密计算', '链上隐私', '区块链密码学', '隐私币']
relatedArticles:
  - /zh-CN/blog/blockchain-cryptographic-primitives/
  - /zh-CN/blog/blockchain-scaling-approaches/
  - /zh-CN/blog/blockchain-virtual-machines/
  - /zh-CN/blog/blockchain-consensus-mechanisms/
  - /zh-CN/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /zh-CN/glossary/zero-knowledge-proof/
  - /zh-CN/glossary/fully-homomorphic-encryption/
  - /zh-CN/glossary/secure-multiparty-computation/
  - /zh-CN/glossary/trusted-execution-environment/
  - /zh-CN/glossary/cryptographic-security/
relatedTopics:
  - /zh-CN/topics/web3-foundations/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/tokenize-your-com/
  - /zh-CN/series/domain-flipping-skills/
---

公有[区块链](/zh-CN/glossary/blockchain/)上的每笔交易，默认对任何查看者都可见。余额、转账金额和交易对手方会永久留存在公开账本上。这种透明性是区块链信任保障的来源，但也是一种负担：没有银行会公开客户余额，也没有企业愿意让竞争对手读到其供应商付款或薪酬发放记录。

区块链隐私技术的存在，正是为了弥合这一缺口，同时不放弃区块链之所以有用的属性——可验证性、去中心化，以及陌生人无需可信中介即可交易的能力。当前格局由五种技术主导：[零知识证明](/zh-CN/glossary/zero-knowledge-proof/)（ZKP）、[全同态加密](/zh-CN/glossary/fully-homomorphic-encryption/)（FHE）、[安全多方计算](/zh-CN/glossary/secure-multiparty-computation/)（MPC）、[可信执行环境](/zh-CN/glossary/trusted-execution-environment/)（TEE），以及环签名与隐身地址。它们各自隐藏拼图中的不同部分，依赖不同的信任假设，也消耗不同程度的算力。本文会逐一介绍这五种技术，进行横向比较，并说明为何这一选择对所有在[Web3](/zh-CN/glossary/web3/)上构建应用或只是学习相关知识的人都很重要。

---

## 零知识证明

![一名证明者把一枚发光的“有效证明”徽章交给验证者，同时将文件锁在身后，说明零知识证明如何在不揭示底层陈述的前提下令人信服](../../assets/blockchain-privacy-technologies-01-zero-knowledge.jpg)

[零知识证明](/zh-CN/glossary/zero-knowledge-proof/)（ZKP）让一方——*证明者（prover）*——能够说服另一方——*验证者（verifier）*——某个陈述为真，而不透露该陈述的任何其他信息。Ethereum 的开发者文档对此有一句简明的说明：“零知识证明是一种在不揭示陈述本身的情况下证明陈述有效性的方法”；其中，“证明者”是试图证明某项主张的一方，而“验证者”负责验证该主张（[ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/#:~:text=A%20zero%2Dknowledge%20proof%20is,without%20revealing%20the%20statement%20itself)）。

要成为真正的零知识协议，证明系统必须满足三项性质：完备性（“如果输入有效，零知识协议总会返回 'true'”）、可靠性（“如果输入无效，从理论上讲不可能欺骗零知识协议返回 'true'”），以及零知识性本身，即“验证者除陈述为真或为假之外，对该陈述一无所知”（[ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)）。具体而言，一份证明由见证（证明者掌握的秘密）、挑战（验证者提出的问题）和响应构成；响应让验证者能够检验证明者的知识，却始终看不到见证本身。

**它隐藏什么：**底层数据或计算——只公开某项主张为真的证明。

**如今如何使用：**ZK-rollup 是 ZKP 在区块链扩容中的最大规模生产应用。它们会“将交易捆绑（或‘汇总’）成批次，在链下执行”，再生成一份由 Ethereum 验证的有效性证明，之后才最终确认该批次的状态变更（[ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20bundle%20)）。由 Matter Labs 构建的 zkSync Era 是“与 EVM 兼容的 ZK Rollup……由其自身 zkEVM 驱动”（[ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)）；而由 StarkWare 构建的 Starknet 是有效性 rollup，运行自己的 Cairo VM 而不是 EVM（Solidity 合约会另行桥接）。L2BEAT 将两者都列为由有效性证明保障的 rollup，而不是采用乐观 rollup 所使用的欺诈证明挑战窗口（[l2beat.com](https://l2beat.com/scaling/summary)）。在隐私领域，[Zcash](https://z.cash/technology/)率先将 zk-SNARK（Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge）用于屏蔽交易；在此类交易中，“用户的地址、交易金额”及其他细节保持加密，而网络仍可确认交易有效（[z.cash](https://z.cash/technology/)）。

**取舍：**生成 ZK 证明的计算成本很高——证明电路必须遍历一批中的每笔交易并重新执行检查——因此证明时间和硬件成本都是实实在在的约束；尽管如此，链上验证既便宜又快速。对系统的信任可归结为对数学的信任，以及对某些证明系统的一次性可信设置仪式的信任。

---

## 全同态加密（FHE）

![一个上锁的盒子穿过由云服务器操作的数学机器，服务器没有钥匙；盒子出来时仍上锁，却装着计算结果，说明可以直接在加密数据上进行计算](../../assets/blockchain-privacy-technologies-02-fhe.jpg)

[全同态加密](/zh-CN/glossary/fully-homomorphic-encryption/)采用不同的方法：它不是证明隐藏数据的某个事实，而是让你能够*直接在加密数据上计算*，并获得一个加密结果；该结果解密后与在明文上计算得到的答案相同。领先的 FHE 研究和基础设施公司之一 Zama 如此描述：“FHE 支持在不解密的情况下处理数据——公司可在不接触用户数据的情况下提供服务，用户的使用体验则保持不变”（[zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)）。

**它隐藏什么：**计算的原始输入、中间状态和输出——除密钥持有人外，所有人只能看到密文，即使是执行计算的一方也是如此。

**基本工作原理：**FHE 方案会将明文值编码为基于格密码学的密文，然后定义加法和乘法的加密对应操作，使任意电路都能在密文上运行。应用于区块链时，这意味着智能合约可以转移代币或评估逻辑，却永远看不到涉及的金额——正如 Zama 自己的示例所说：“区块链验证了 Alice 拥有足够资金，却从未看到实际金额”（[zama.org](https://www.zama.org/introduction-to-homomorphic-encryption#:~:text=The%20blockchain%20verified%20Alice%20has%20sufficient%20funds%20without%20ever%20seeing%20the%20actual%20amounts)）。Zama 还指出，基于格的 FHE 方案“天然具备后量子韧性”，这对长期考量密码学风险的人尤其重要（[zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)）。

**示例项目：**[Zama](https://www.zama.org/)构建开源 FHE 库（TFHE-rs、Concrete）以及用于为 EVM 链添加机密智能合约执行能力的 fhEVM。[Fhenix](https://cofhe-docs.fhenix.zone/)是一条专门构建的区块链，用于让“开发者能够使用全同态加密构建保护隐私的智能合约”，从而使“敏感数据在整个计算过程中始终保持加密”；它提供 JavaScript 库 Cofhejs 用于客户端加密，也提供 Solidity FHE 库用于链上加密操作（[cofhe-docs.fhenix.zone](https://cofhe-docs.fhenix.zone/)）。

**取舍：**FHE 在本列表中提供最强的隐私保障——即使在计算过程中也从不解密任何内容——但与明文执行相比，它的计算成本也要高得多。因此，当今基于 FHE 的链只会将其用于保密性关键逻辑，而不是每一笔交易；FHE 硬件加速也仍是活跃的研究竞赛。

---

## 安全多方计算（MPC）

![三个人各自持有一块拼图式密钥分片，并以虚线连接成一笔已签名交易，说明安全多方计算如何在任何一方都看不到完整秘密的情况下生成联合结果](../../assets/blockchain-privacy-technologies-03-mpc.jpg)

[安全多方计算](/zh-CN/glossary/secure-multiparty-computation/)（MPC）解决的是一个相关但不同的问题：它不是让一方在加密数据上计算，而是让各自持有私有输入片段的*多方*共同计算一个函数，同时不向彼此披露各自的输入。按照正式定义，MPC 是“密码学的一个子领域，目标是创建让各方在保持输入私密的同时，能够共同计算其输入上的函数的方法”；因此，对于三名参与者而言，“Alice、Bob 和 Charlie 仍能得知 F(x, y, z)，而无需披露谁贡献了什么”（[Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation#:~:text=Secure%20multi%2Dparty%20computation%20)）。

**它隐藏什么：**每一方的单独输入不向其他任何一方披露——只公开事先约定的输出，且没有单一参与者会看到完整秘密。

**信任假设：**安全性取决于在方案失效之前允许多少参与者不诚实。经典秘密共享构造可提供信息论安全性，前提是主动恶意的一方少于三分之一，或者只是好奇的一方少于二分之一（[Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)）。换言之，MPC 将“信任一名保管人”替换为“信任这 N 方中不会有太多方串通”。

**如今如何使用——门限签名托管：**MPC 最显眼的区块链应用，是将私钥拆分给独立多方，使没有任何单一设备或个人持有完整密钥。托管基础设施提供商 Fireblocks 的直接描述是：“多方计算（MPC）是一种密码学方法，它将私钥拆分为分配给多个独立方的不同份额”；关键在于，“完整密钥在任何时间点都不会在同一处被组装出来”（[fireblocks.com](https://www.fireblocks.com/what-is-mpc#:~:text=Multi%2Dparty%20computation%20)）。当交易需要签名时，一组达到法定人数的端点会分别验证交易并贡献部分签名；“私钥在任何时候都不会被组装出来”，因此“即使一个端点被攻破……其他位置持有的密钥份额单独来看也毫无用处”（[fireblocks.com](https://www.fireblocks.com/what-is-mpc)）。这一门限签名模式如今支撑了大多数机构级加密资产托管和许多多签名钱包。

**取舍：**MPC 避免了单把私钥放在单台设备上造成的单点故障，但它增加了参与方之间的通信轮次（延迟），也要求审慎的协议设计。MPC 方案的安全保障只与其假设的诚实多数门限一样强；这不仅是数学假设，也是社会和运营层面的假设。

---

## 可信执行环境（TEE）

[可信执行环境](/zh-CN/glossary/trusted-execution-environment/)采取了另一条路线：它不在整个计算过程中加密数据，而是将计算隔离在芯片中受硬件保护的区域——*安全飞地（secure enclave）*——内；即使是机器自身的操作系统也无法检查该区域。最广为人知的实现 Intel SGX（Software Guard Extensions），在 Wikipedia 上被描述为“内置于某些 Intel 中央处理器（CPU）中的一组实现可信执行环境的指令代码”（[Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=Intel%20Software%20Guard%20Extensions)）。从机制上看，“SGX 涉及 CPU 对一部分内存（飞地）进行加密”，因此“源自飞地的数据和代码会在 CPU 内即时解密，防止它们被其他代码检查或读取”，其中包括“在操作系统和任何底层虚拟机监控程序等更高权限级别运行的代码”（[Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)）。

**它隐藏什么：**飞地内的数据和代码不被同一台机器上的任何其他进程看到，包括已被攻破的操作系统——当你需要信任某段特定代码的执行、却不想信任服务器运营者时，这很有用。

**信任假设：**与纯粹依赖数学的 ZKP、FHE 或 MPC 不同，TEE 要求你信任芯片制造商的硬件和固件。这一信任已被反复检验：SGX“无法防御侧信道攻击”，研究人员也多次展示实际攻击，从“在五分钟内从同一系统中运行的 SGX 飞地提取 RSA 密钥”（2017 年），到结合推测执行与缓冲区溢出以绕过 SGX 的 Foreshadow 攻击（2018 年），以及之后的 Plundervolt、LVI、SGAxe 和 ÆPIC Leak 等漏洞（[Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=While%20this%20can%20mitigate%20many%20kinds%20of%20attacks%2C%20it%20does%20not%20protect%20against%20side%2Dchannel%20attacks)）。正因如此，TEE 通常被描述为务实、速度更快的折中方案，而不是密码学上无懈可击的保障。

**示例项目：**[Oasis Protocol](https://oasis.net/technology) 的 Sapphire 网络在硬件飞地内运行智能合约，用户可以“在受硬件保护的飞地内运行代码”，其中“数据即使对服务器运营者也保持加密”；同时，“每次执行都会产生用户无需盲目信任即可验证的密码学证明”——由此提供了保持“EVM 兼容性和可组合性”的“机密智能合约”（[oasis.net](https://oasis.net/technology)）。Secret Network 和若干与再质押相邻的隐私产品也建立在 TEE 之上，且常与其他技术结合，以实现纵深防御。

**取舍：**TEE 的运行速度接近原生速度——远快于 FHE 或高成本 ZK 证明——这使它们对延迟敏感的应用很有吸引力；但这种速度源自对硬件的信任，而硬件存在真实且有记录的侧信道攻破历史。因此，在最坏情形下的信任假设方面，基于 TEE 的系统通常弱于纯密码学方案。

---

## 环签名与隐身地址

最后一对技术保护的是一个范围更窄、但非常实用的目标：即使交易本身在链上可见，也要隐藏*谁*发送了交易，以及*谁*接收了交易。[Monero](https://www.getmonero.org/)是这两种技术最重要的生产应用实例。

**环签名**用于隐藏发送者。Monero 自己的文档解释说：“环签名是一种数字签名，可由一组各自拥有密钥的用户中的任何成员执行”；其中，“要在计算上确定该组成员中究竟是哪一把密钥用于生成签名，应当是不可行的”（[getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html#:~:text=a%20ring%20signature%20is%20a%20type%20of%20digital%20signature)）。在实践中，一笔 Monero 交易会将真实支付者的密钥与“使用伽马分布方法从区块链中抽取”的诱饵公钥混合；这样一来，在“可能签名者组成的‘环’中，所有环成员都同等且有效”，且“外部观察者无法判断签名组中哪一位可能的签名者属于你的账户”（[getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)）。

**隐身地址**用于隐藏接收者。发送者不会重复使用一个公钥地址，而是“代表接收者为每笔交易创建随机的一次性地址”；因此，收款“会发送到区块链上的唯一地址，无法再与接收者公开的地址或任何其他交易地址关联”（[getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html#:~:text=They%20allow%20and%20require%20the%20sender%20to%20create%20random%20one%2Dtime%20addresses)）。接收者使用私有查看密钥扫描链上的付款，并使用私有花费密钥转移资金，因此“只有发送者和接收者能确定一笔付款被发送到了哪里”（[getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)）。

**它隐藏什么：**发送者身份（环签名）和接收者身份（隐身地址）；交易*金额*由另一种机制——机密交易（Confidential Transactions / RingCT）——隐藏，并非只靠这两种技术就能实现。

**取舍：**两种技术都能在普通硬件上高效运行，无须证明开销或飞地依赖，因此很适合实时支付网络。但其信任模型依赖于诱饵集合在统计上与真实签名者不可区分——历史上，薄弱的诱饵选择或区块链分析启发式方法曾缩小早期环签名部署的匿名集。因此，参数选择（环大小、诱饵分布）与底层原语本身同样重要。

---

## 五种方法的比较

| 技术 | 它隐藏什么 | 信任假设 | 性能成本 | 当前成熟度 | 示例项目 |
|---|---|---|---|---|---|
| 零知识证明 | 底层数据/计算；只公开证明的有效性 | 密码学数学（部分系统还需可信设置） | 生成证明成本高；验证成本低 | 已大规模投入生产（rollup、屏蔽支付） | zkSync、Starknet、Zcash |
| 全同态加密 | 计算全过程中的所有数据，连计算提供方也看不到 | 密码学数学（基于格） | 极高的计算开销 | 早期生产阶段；硬件加速研究活跃 | Zama、Fhenix |
| 安全多方计算 | 每一方的单独输入 | 参与者之间的诚实多数/门限 | 中等；增加通信轮次 | 成熟，且广泛用于托管 | Fireblocks 和其他门限签名托管方 |
| 可信执行环境 | 来自其他所有进程（包括操作系统）的数据/代码 | 硬件/固件供应商（芯片制造商） | 接近原生速度 | 已投入生产，但有记录在案的侧信道攻击历史 | Intel SGX、Oasis Sapphire |
| 环签名与隐身地址 | 发送者身份和接收者身份 | 诱饵集合在统计上不可区分 | 低；可在普通硬件上高效运行 | 成熟，已在线运行逾十年 | Monero |

没有一种技术能在所有维度上胜出——这正是当前研究日益将它们结合使用的原因，例如用 ZK 证明验证 MPC 计算的正确性，或将 TEE 与 FHE 并用以实现纵深防御。

---

## 这与代币化域名有何关联

经[代币化](/zh-CN/glossary/tokenize/)的域名与任何其他链上资产一样，继承了默认透明的特性：所有权转移、出价和元数据更新都可被公开读取。这在很大程度上是优势——来源和所有权历史正是让[代币化域名](/zh-CN/blog/what-are-tokenized-domains/)成为可信、可交易资产的原因——但这也意味着，任何观察链上活动的人都能看到一个域名投资组合的持仓和出售价格。

本指南所述的隐私技术指明了域名 NFT 基础设施下一步可能的发展方向：基于 MPC 的门限托管已像保护其他数字资产一样，保护着持有域名 NFT 的机构[钱包](/zh-CN/glossary/wallet/)；ZK 证明最终或许能让出价者证明自己付得起报价，却无需披露全部余额；而机密计算技术则可能让注册商或市场在不暴露买方完整身份的情况下验证资格规则。这些能力今天尚未部署在域名代币化领域，但其底层原语正是当下保护数十亿美元 DeFi 和托管基础设施的同一类技术。

---

## 参考来源与延伸阅读

- [零知识证明 — ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)
- [ZK-Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [L2BEAT 扩容摘要](https://l2beat.com/scaling/summary)
- [Zcash 技术概览](https://z.cash/technology/)
- [同态加密简介 — Zama](https://www.zama.org/introduction-to-homomorphic-encryption)
- [Fhenix cofhe 文档](https://cofhe-docs.fhenix.zone/)
- [安全多方计算 — Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)
- [什么是 MPC？— Fireblocks](https://www.fireblocks.com/what-is-mpc)
- [软件防护扩展（SGX）— Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)
- [Oasis Protocol 技术](https://oasis.net/technology)
- [环签名 — Monero Moneropedia](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)
- [隐身地址 — Monero Moneropedia](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)
