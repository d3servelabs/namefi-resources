---
title: "支撑每条区块链的核心密码学原语"
date: '2026-07-02'
language: zh-CN
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 10
format: roundup
description: 介绍支撑区块链运作的核心密码学原语：哈希函数、数字签名、Merkle 树、椭圆曲线密码学和承诺方案。
ogImage: ../../assets/blockchain-cryptographic-primitives-og.jpg
keywords: ['区块链密码学', '密码学原语', '哈希函数', 'SHA-256', 'Keccak-256', '数字签名', 'ECDSA', 'EdDSA', 'BLS 签名', 'Merkle 树', '椭圆曲线密码学', 'secp256k1', '承诺方案', '后量子密码学', '公钥密码学', '区块链安全']
relatedArticles:
  - /zh-CN/blog/blockchain-privacy-technologies/
  - /zh-CN/blog/blockchain-consensus-mechanisms/
  - /zh-CN/blog/blockchain-virtual-machines/
  - /zh-CN/blog/blockchain-scaling-approaches/
  - /zh-CN/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /zh-CN/glossary/hash-function/
  - /zh-CN/glossary/digital-signature/
  - /zh-CN/glossary/merkle-tree/
  - /zh-CN/glossary/public-key/
  - /zh-CN/glossary/private-key/
relatedTopics:
  - /zh-CN/topics/web3-foundations/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/tokenize-your-com/
  - /zh-CN/series/domain-flipping-skills/
---

区块链的每一项主张——“这笔交易已最终确定”“这个地址拥有这项资产”“这段历史没有被篡改”——归根结底都依赖于少数几种职责明确的密码学原语。它们没有一项是区块链的发明；哈希函数、数字签名和 Merkle 树都比 Bitcoin 早了几十年。区块链所做的，是把它们组合成一个系统，让这些主张成立时不必信任任何单一方。

本指南会逐一说明真正承担关键作用的原语：为数据生成指纹的[哈希函数](/zh-CN/glossary/hash-function/)、授权交易的[数字签名](/zh-CN/glossary/digital-signature/)、让庞大数据集能够分段验证的[Merkle 树](/zh-CN/glossary/merkle-tree/)、这些签名所依赖的椭圆曲线数学，以及承诺方案——它是通向[零知识证明](/zh-CN/glossary/zero-knowledge-proof/)的基础构件。理解每一种原语，是弄清区块链底层实际在做什么的最快途径。

---

## 密码学哈希函数（SHA-256、Keccak）

![一份文档被输入哈希函数机器，输出固定长度的指纹摘要；输入中只改动一个字母，摘要就完全不同，展示雪崩效应](../../assets/blockchain-cryptographic-primitives-01-hash-function.jpg)

[哈希函数](/zh-CN/glossary/hash-function/)接收任意大小的输入，并以确定性的方式生成固定大小的输出，即“摘要”。只要翻转输入中的一个比特，输出就会完全混乱；而要找到两个哈希值相同的不同输入，在计算上不可行。这种抗碰撞性使哈希可作为任意大型数据的紧凑、防篡改指纹。

Bitcoin 在各处使用 SHA-256：每个新区块头都会嵌入前一个区块头的 SHA256(SHA256()) 哈希，因此篡改任何历史区块都会改变其哈希，并破坏后续的每一个区块头（[Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Each%20block%20also%20stores%20the%20hash%20of%20the%20previous%20block%27s%20header%2C%20chaining%20the%20blocks%20together)）。同样的双重 SHA-256 构造还会将交易哈希进区块的[Merkle 树](/zh-CN/glossary/merkle-tree/)（[Bitcoin.org 参考资料](https://developer.bitcoin.org/reference/block_chain.html#:~:text=A%20SHA256%28SHA256%28%29%29%20hash%20in%20internal%20byte%20order)）。

Ethereum 则以 Keccak-256（最初提交的 Keccak 方案，与之后的 NIST SHA-3 标准不同）作为通用哈希标准。每个账户地址都由该账户[公钥](/zh-CN/glossary/public-key/)的 Keccak-256 哈希的最后 20 个字节推导而来（[ethereum.org](https://ethereum.org/en/developers/docs/accounts/#:~:text=You%20get%20a%20public%20address%20for%20your%20account%20by%20taking%20the%20last%2020%20bytes%20of%20the%20Keccak-256%20hash%20of%20the%20public%20key)）；同一函数也是存储 Ethereum 状态的 [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=key%20%3D%3D%20keccak256%28rlp%28value%29%29) 中键/值内容寻址的基础。

哈希还会把区块头连接成一条链，而不是一组松散的记录：更改某个区块头会改变其哈希，并使后续区块头中的引用失效。重做后续工作并赶超诚实网络这一额外要求，特指 Bitcoin 的工作量证明共识：攻击者若要更改过去的区块，就必须重做该区块及其后所有区块的工作量证明，再追上诚实链（[Bitcoin 白皮书，第 4 节](https://bitcoin.org/bitcoin.pdf)）。其他区块链依据不同的共识规则验证并最终确定历史记录，因此仅靠哈希链接并不会产生这种工作量证明成本。区块头哈希之间的这种直接链接，正是该数据结构被称为**区块链**的原因。

---

## 公钥密码学与数字签名（ECDSA、EdDSA、BLS）

![一把私钥为交易签名后生成数字签名；匹配的公钥以绿色勾号验证其有效，而不匹配的公钥以红色 X 拒绝它](../../assets/blockchain-cryptographic-primitives-02-signatures.jpg)

区块链没有登录表单，因此需要另一种方式证明“这笔交易确实来自该账户的拥有者”。[公钥密码学](/zh-CN/glossary/public-key/)通过一对密钥解决这个问题：可以自由分享的公钥以及必须保密的[私钥](/zh-CN/glossary/private-key/)。用私钥为交易签名会生成一份[数字签名](/zh-CN/glossary/digital-signature/)，任何人都能用公钥验证它——在从不暴露私钥本身的前提下证明授权。

Ethereum 账户使用 secp256k1 曲线上的椭圆曲线数字签名算法（ECDSA）从私钥推导公钥——Bitcoin 使用的也是同一条曲线（[ethereum.org 账户文档](https://ethereum.org/en/developers/docs/accounts/#:~:text=The%20public%20key%20is%20generated%20from%20the%20private%20key%20using%20the%20Elliptic%20Curve%20Digital%20Signature%20Algorithm)；[EIP-2：secp256k1 签名可塑性修复](https://eips.ethereum.org/EIPS/eip-2#:~:text=secp256k1n%2F2)）。ECDSA 的验证速度快，且经历了数十年的审视；但它有一个与新型设计相关的实际弱点：单份 ECDSA 签名无法高效聚合，所以验证数千份签名就意味着分别进行数千次检查。

EdDSA 和 BLS 签名正是为填补这一空白而生。EdDSA（Solana、Stellar 等链采用）使用不同的曲线构造，具有确定性，并能避免某些过去曾导致 ECDSA nonce 重用漏洞的实现陷阱。BLS 签名更进一步：由于所用曲线具备数学配对性质，许多 BLS 签名可以合并为一份聚合签名，同时验证全部签名。Ethereum 的权益证明共识层恰好依赖这一点——验证者用 BLS 密钥签署证明，让信标链能够把数十万验证者的投票聚合成足够紧凑、能快速验证的签名；这正是大规模权益证明得以实际运行的原因（[ethereum.org，《The Beacon Chain》](https://eth2book.info/capella/part2/building_blocks/signatures/#:~:text=BLS%20signatures%20can%20be%20aggregated%20together%2C%20making%20them%20efficient%20to%20verify%20at%20large%20scale)）。Ethereum 还将 BLS12-381 曲线操作作为 EVM 预编译合约公开提供，专门用于支持智能合约中的 BLS 签名验证（[EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#:~:text=Add%20functionality%20to%20efficiently%20perform%20operations%20over%20the%20BLS12-381%20curve%2C%20including%20those%20for%20BLS%20signature%20verification)）。

---

## Merkle 树

![由 Merkle 树哈希节点两两合并、逐层汇聚成单一根节点的金字塔；其中一条从叶到根的证明路径以橙色突出显示，呈现轻客户端的 Merkle 证明](../../assets/blockchain-cryptographic-primitives-03-merkle-tree.jpg)

[Merkle 树](/zh-CN/glossary/merkle-tree/)让区块链能将数千笔交易汇总为单个 32 字节哈希，而不必强迫每名参与者存储每一笔交易。叶节点是单个数据项（交易、账户状态）的哈希；每对哈希会连接起来再做一次哈希，如此重复，直到只剩一个哈希，即根节点（[Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Copies%20of%20each%20transaction%20are%20hashed%2C%20and%20the%20hashes%20are%20then%20paired%2C%20hashed%2C%20paired%20again%2C%20and%20hashed%20again%20until%20a%20single%20hash%20remains%2C%20the%20merkle%20root%20of%20a%20merkle%20tree)）。该根直接存储在区块头中，因此全节点只用几乎不额外占用空间，就能对一个区块的全部内容作出承诺。

其价值在于证明大小。要证明一笔交易被包含在某个区块中，不需要整个区块——只需该交易以及一条“Merkle 分支”，即从该叶节点到根节点路径上的相邻哈希。对于 n 笔交易，通常只需约 log₂(n) 个哈希。这是简化支付验证（SPV）的基础：仅保存区块头的轻量客户端，无须下载整个区块链，也能通过对照区块头根节点检查 Merkle 分支，验证某笔特定交易确实发生过（[Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/operating_modes.html#:~:text=the%20merkle%20root%20in%20the%20block%20header%20along%20with%20a%20merkle%20branch%20can%20prove%20to%20the%20SPV%20client%20that%20the%20transaction%20in%20question%20is%20embedded%20in%20a%20block%20in%20the%20block%20chain)）。

Ethereum 用 Merkle Patricia Trie 扩展了这一思路。它是 Merkle 树与前缀（基数）Trie 的混合结构，用于存储整个账户状态，而不仅是一张交易列表。每个区块头都携带三个独立的 Trie 根：`stateRoot`、`transactionsRoot` 和 `receiptsRoot`，且每个都可独立证明（[ethereum.org](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=From%20a%20block%20header%20there%20are%203%20roots%20from%203%20of%20these%20tries)）。因此，智能合约或轻客户端无需重放整条链，就能验证单个账户余额或单个存储槽位。

---

## 椭圆曲线密码学

椭圆曲线密码学（ECC）是 ECDSA、EdDSA 和 BLS 所共同依赖的数学基础。传统 RSA 依赖大整数分解的难度，而 ECC 依赖椭圆曲线离散对数问题的难度：给定曲线上通过将一个基点反复与自身相加得到的点，要反推出加了多少次在计算上不可行；即使正向计算这个点很容易。正是这种不对称性（一个方向容易、逆向困难）让私钥可以安全地用于签名，同时由其推导的公钥也能安全公开。

具体选择哪条曲线和哪种签名方案很重要。Bitcoin 和 Ethereum 都使用 secp256k1，这是一条由 Standards for Efficient Cryptography Group 标准化、参数经过充分研究的 Koblitz 曲线（[SEC 2：推荐椭圆曲线域参数](https://www.secg.org/sec2-v2.pdf)）。其他生态系统会做出不同取舍：Ed25519 是在 Edwards25519 曲线上实例化的具体 EdDSA 签名方案（[RFC 8032，§5.1](https://www.rfc-editor.org/rfc/rfc8032.html#section-5.1)），RFC 8032 认为其经典安全级别约为 128 位（[§8.5](https://www.rfc-editor.org/rfc/rfc8032.html#section-8.5)）；BLS12-381 是一条配对友好曲线，为 BLS 签名聚合等运算而选用，EIP-2537 对其安全性的描述是 120 位以上（[EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#motivation)）。这些估算并不意味着它们具有相同的“每密钥位安全性”：这些系统使用不同的群、编码和假设，名义密钥长度本身也不等于安全强度。例如，NIST 将 128 位经典安全对应到 256–383 位的普通 ECC 密钥，却对应到 3072 位的 RSA 密钥（[NIST SP 800-57 Part 1 Rev. 5，表 2](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf#page=67)）。这有助于解释为何椭圆曲线系统成为区块链账户的默认选择。

---

## 承诺方案：通向零知识的桥梁

承诺方案让你能够“锁定”一个值：公开某样能将你绑定到特定数据的东西，却不揭示数据本身；之后再“打开”这项承诺以证明其中是什么。日常类比是一封密封的信：你今天可以把密封信封交给某人，证明你已经决定了答案，而无需让对方看到内容；等你选择日后打开它时，对方才会知道答案，而且一旦封好，你就无法调换其中的答案。

这听上去像一种小型原语，却是大多数零知识证明系统底下真正承重的部分。以 Ethereum 的基于 blob 的数据可用性设计为例：它使用 KZG 多项式承诺，将每个 blob 缩减为一项小型密码学承诺。KZG 证明可以根据该承诺验证某个求值或被抽样的数据单元，但它本身不能证明完整 blob 可用：可用性来自共识层的分发与抽样规则，而 KZG 负责检查所接收数据的完整性（[EIP-4844](https://eips.ethereum.org/EIPS/eip-4844#consensus-layer-validation)；[EIP-7594，PeerDAS](https://eips.ethereum.org/EIPS/eip-7594#networking)）。这种职责分离让验证者能够检查 blob 的一小部分，同时不会把紧凑的求值证明误认为所有 blob 数据已经发布的证明。事实上，Merkle 根本身就是一种简单的承诺方案：它通过根哈希承诺整个数据集，而 Merkle 分支则是揭示其中一部分的“打开”方式。ZK-rollup 在更高级的承诺方案（多项式承诺和向量承诺）之上构建，将整批交易执行压缩为一项可在链上低成本验证的证明；[完美零知识与计算零知识](/zh-CN/blog/perfect-vs-computational-zero-knowledge/)会深入讲解这个主题。

---

## 对比：区块链密码学原语

| 原语 | 提供的属性 | 链上用途 | 经典密码学与后量子风险 |
|---|---|---|---|
| 哈希函数（SHA-256、Keccak-256） | 抗碰撞的指纹；将区块链接起来 | 区块哈希、地址推导、Merkle 根 | 在当前输出长度下对经典攻击很强；基于哈希的方案通常被认为比当今椭圆曲线签名更能抵御量子攻击 |
| 数字签名——ECDSA | 通过私钥/公钥密钥对授权交易 | Bitcoin 和 Ethereum 的账户签名 | 在经典环境中安全；预计足够强大的大规模量子计算机会攻破基于椭圆曲线的方案，因此 NIST 已标准化后量子替代方案（[NIST，2024](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards#:~:text=A%20sufficiently%20capable%20quantum%20computer%2C%20though%2C%20would%20be%20able%20to%20sift%20through%20a%20vast%20number%20of%20potential%20solutions%20to%20these%20problems%20very%20quickly%2C%20thereby%20defeating%20current%20encryption)) |
| 数字签名——EdDSA / BLS | 确定性签名（EdDSA）；高效签名聚合（BLS） | Solana/Stellar 签名（EdDSA）；Ethereum 验证者证明（BLS） | 与 ECDSA 具有相同的底层椭圆曲线假设，因此面临相同的长期量子暴露风险 |
| Merkle 树 | 对大型数据集的紧凑承诺；小型包含证明 | 区块头、轻客户端（SPV）验证、Ethereum 的状态/交易/收据 Trie | 只依赖底层哈希函数的抗碰撞性，因此继承该哈希的量子安全态势，不会增加新的暴露面 |
| 椭圆曲线密码学 | 紧凑密钥和签名的数学基础 | secp256k1（Bitcoin、Ethereum）、Ed25519、BLS12-381 | 与 ECDSA/EdDSA/BLS 一样会受到未来大规模量子计算机的威胁；这正是后量子迁移研究的主要动力 |
| 承诺方案 | 现在绑定一个值，之后揭示/证明它，同时不预先暴露它 | Ethereum 数据可用性中的 KZG 承诺；作为简单承诺的 Merkle 根；ZK-rollup 的基础构件 | 安全性取决于用来构建方案的底层哈希或椭圆曲线假设 |

---

## 这与代币化域名有何关联

当你将一个域名[代币化](/zh-CN/glossary/tokenize/)时，这些原语中的每一种都会直接出现。代表所有权的[NFT（非同质化代币）](/zh-CN/glossary/nft/)受链上账户和代币授权规则保护。若由外部拥有账户（EOA）持有，该账户的私钥可授权账户操作；合约账户没有私钥，而是由代码控制（[ethereum.org，*Ethereum 账户*](https://ethereum.org/en/developers/docs/accounts/#account-types)）。对于 ERC-721 代币，获批地址或操作员也可以发起转移（[ERC-721](https://eips.ethereum.org/EIPS/eip-721#specification)）。因此，如果资产由自行控制的 EOA 持有，[硬件钱包](/zh-CN/glossary/hardware-wallet/)以及对[助记词（恢复短语）](/zh-CN/glossary/seed-phrase/)的谨慎保管非常重要；而智能合约钱包和托管钱包会引入不同的授权与信任边界。域名的所有权记录存在于同一个由 Merkle 承诺保护的状态中，该状态也保障着链上所有其他账户余额和[智能合约](/zh-CN/glossary/smart-contract/)；这正是代币化域名能拥有与任何其他链上资产同样的防篡改证据的原因——可转让、可验证，且无需把注册商的数据库作为唯一的可信来源就能证明所有权。

理解这些原语还能厘清代币化改变了什么、没有改变什么：域名的 DNS 记录和注册局状态仍遵循 ICANN 规则，但其所有权证明现在运行在上述密码学之上，而不再依赖受登录保护的[注册商](/zh-CN/glossary/registrar/)账户。想了解更完整的图景，请参阅[区块链共识机制](/zh-CN/blog/blockchain-consensus-mechanisms/)和[区块链扩展方案](/zh-CN/blog/blockchain-scaling-approaches/)；或直接在 [namefi.io](https://namefi.io) 开始代币化。

---

## 来源与延伸阅读

- Bitcoin Developer Guide — [Block Chain](https://developer.bitcoin.org/devguide/block_chain.html)，通过前一个区块头的 SHA256(SHA256()) 实现链式连接
- Bitcoin — [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf)，工作量证明下的历史改写与累计工作量
- Bitcoin Developer Reference — [Block Chain](https://developer.bitcoin.org/reference/block_chain.html)，Merkle 根的构造
- Bitcoin Developer Guide — [Operating Modes](https://developer.bitcoin.org/devguide/operating_modes.html)，SPV 与 Merkle 分支
- ethereum.org — [Ethereum Accounts](https://ethereum.org/en/developers/docs/accounts/)，ECDSA 与 Keccak-256 地址推导，EOA 与合约账户的控制方式
- ethereum.org — [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/)，状态/交易/收据根
- ethereum.org — [Danksharding](https://ethereum.org/en/roadmap/danksharding/)，KZG 多项式承诺
- EIP-4844 — [Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)，blob 承诺、证明与共识层可用性
- EIP-7594 — [PeerDAS](https://eips.ethereum.org/EIPS/eip-7594)，数据单元证明与数据可用性抽样
- ERC-721 — [Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)，代币所有权、授权与操作员
- EIP-2 — [Homestead Hard-fork Changes](https://eips.ethereum.org/EIPS/eip-2)，secp256k1 签名约束
- EIP-2537 — [Precompile for BLS12-381 curve operations](https://eips.ethereum.org/EIPS/eip-2537)
- RFC 8032 — [Edwards-Curve Digital Signature Algorithm (EdDSA)](https://www.rfc-editor.org/rfc/rfc8032.html)，Ed25519 的签名方案、曲线与安全级别
- SEC 2: Recommended Elliptic Curve Domain Parameters — [secg.org](https://www.secg.org/sec2-v2.pdf)
- NIST SP 800-57 Part 1 Rev. 5 — [Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)，ECC 与 RSA 的可比安全强度
- *The Eth2 Book* — [Signatures and BLS aggregation](https://eth2book.info/capella/part2/building_blocks/signatures/)
- NIST — [NIST Releases First 3 Finalized Post-Quantum Encryption Standards](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards)
