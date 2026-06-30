---
title: Web3
date: '2025-06-30'
language: zh-CN
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: 一种以公共区块链为核心基础设施的互联网愿景，用户通过自己掌握的密钥而非平台账户拥有数据、资产和身份。
keywords: ['Web3', '去中心化网络', '区块链互联网', '用户所有权', '点对点', '去中心化', '加密货币', '智能合约', 'DeFi', 'NFT']
level: 2
sources:
  - https://ethereum.org/en/web3/
  - https://web3.foundation/about/
  - https://en.wikipedia.org/wiki/Web3
  - https://www.wired.com/story/web3-blockchain-decentralization-explained/
relatedArticles:
  - /zh-CN/blog/what-are-tokenized-domains/
  - /zh-CN/blog/onchain-domain-custody-and-recovery/
  - /zh-CN/blog/the-badgerdao-frontend-attack/
  - /zh-CN/blog/the-godaddy-multi-year-breach/
  - /zh-CN/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/domain-flipping-skills/
relatedGlossary:
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/tld/
---

**Web3**（亦写作 *Web 3.0*）是一种互联网新范式构想，其核心基础设施运行在公共[区块链](/zh-CN/glossary/blockchain/)网络之上，使参与者能够通过密码学密钥——而非由中心化平台管理的账户——拥有并掌控自己的数据、数字资产和网络身份。

## Web3 与 Web1、Web2 的区别

这一概念通常通过互联网发展的三代模型来解释：

- **Web1（约 1991–2004 年）** — 静态、只读页面。用户消费由网站管理员发布的内容，几乎没有互动性，也鲜有用户生成内容。
- **Web2（约 2004 年至今）** — 参与式、平台驱动的网络。社交网络、搜索引擎和云服务让任何人都可以发布内容并互动，但底层的数据、身份和货币化流量归少数大型平台所有和控制（谷歌、Meta、亚马逊及其同行）。
- **Web3（构想中）** — 读/写/拥有的网络。用户持有自己的密钥，无需中心托管人即可跨应用携带身份和资产，并通过开放协议而非专有 API 进行交互。

这一概念[由以太坊联合创始人 Gavin Wood 于 2014 年提出](https://ethereum.org/en/web3/)，用于描述他认为构建一个更少依赖信任的互联网所必需的一套技术体系。在 2020–2022 年间，随着 [DeFi](/zh-CN/glossary/defi/) 和 NFT 市场的崛起，Web3 进入主流视野。

## 核心技术

Web3 应用通常基于以下技术的某种组合构建：

- **[智能合约](/zh-CN/glossary/smart-contract/)** — 部署在[链上](/zh-CN/glossary/on-chain/)的自执行代码，无需中心化运营方即可强制执行规则。它们是去中心化应用（dApp）的基础原语。
- **公共区块链** — 无需许可、只可追加的账本（以太坊是通用应用中使用最广泛的），在无需可信中介的情况下提供共享的事实来源。
- **密码学钱包** — 管理私钥并对交易进行签名的软件（或硬件）。[钱包](/zh-CN/glossary/wallet/)地址在兼容应用中充当通用、可携带的身份标识。
- **代币与代币化** — 将资产[代币化](/zh-CN/glossary/tokenize/)的能力，包括同质化货币、治理权或独特数字对象（NFT），作为公共账本上任何应用都可读取和验证的条目。
- **去中心化存储** — IPFS 和 Arweave 等协议，将内容分布复制到众多节点，使任何单一实体都无法对其进行审查或删除。
- **[DAO](/zh-CN/glossary/dao/)（去中心化自治组织）** — 链上实体，其规则和资金库由代币持有者集体治理，而非由董事会决策。

## 身份与命名

Web2 与 Web3 在结构上的差异之一在于对身份的处理方式。在 Web2 中，身份是存储在公司数据库中的用户名和密码——平台随时可以停用。在 Web3 中，身份源于持有人掌控的公私钥对。

人类可读的命名层，例如[以太坊名称服务（ENS）](/zh-CN/glossary/ens/)，将密码学地址映射到可读名称（如 `alice.eth`），这一注册表完全存在于链上。这些名称可同时充当支付地址、登录标识符和去中心化网站指针，只要所有者掌控相应的密钥，就没有任何中心机构能够撤销它们。

Web3 基金会[由 Gavin Wood 等人创立](https://web3.foundation/about/)，资助去中心化和公平互联网基础设施的研究与开发，尤其注重互操作性协议。

## 质疑与开放问题

Web3 在[技术人员和经济学家中颇具争议](https://www.wired.com/story/web3-blockchain-decentralization-explained/)。常被提及的关切包括：

- **可扩展性** — 公共区块链每秒处理的交易量远少于中心化数据库，且在高负载下手续费会飙升。二层网络（rollup、侧链）可缓解这一问题，但增加了复杂性。
- **用户体验** — 管理私钥、gas 费用和交易确认，远比用社交账号登录复杂得多。助记词丢失意味着资产永久丢失，且没有账户恢复路径。
- **再中心化** — 在实践中，Web3 生态系统的很大一部分依赖少数基础设施提供商（如提供 RPC 访问的 Infura 和 Alchemy、提供 NFT 流动性的 OpenSea、少数稳定币发行商）。批评者认为，这不过是以不同的主导者重建了 Web3 本想消除的权力集中。
- **投机与金融化** — 围绕加密货币和 NFT 的市场周期，令观察者质疑基于代币的激励机制究竟能否催生可持续的生态系统，还是主要回报早期持有者。
- **能源消耗** — 工作量证明区块链历史上的碳足迹巨大；以太坊 2022 年转向权益证明后，其能耗降低了[约 99.95%](https://ethereum.org/en/energy-consumption/)，但部分工作量证明链仍是不可忽视的能源消耗者。
- **监管不确定性** — 代币是否构成证券、DAO 作为法律实体如何对待、智能合约纠纷的跨境执法，在大多数司法管辖区仍悬而未决。

支持者则反驳称，其中许多是随时间推移可以改善的工程问题，而无需信任的开放协议所构建的基础，值得承受当前的取舍。

## 与域名的关联

传统域名通过 ICANN 维护的中心化层级体系运作，并委托给注册局和注册商——域名所有者最终依赖注册商保持记录有效。Web3 引入了另一种模式：链上名称注册表，所有权以代币形式编码并存放于所有者的钱包中，注册商无法单方面撤销。

这影响了域名运作的几个方面：

- **抗审查性** — 所有权记录存在于公共区块链上的域名，无法通过针对注册商的政策变更或法院命令来没收。
- **可组合性** — 链上名称可被智能合约读取和操作，从而在单一标识符内实现支付路由、去中心化网站解析和凭证颁发。
- **二级市场** — 由于链上名称即代币，可点对点转让或通过去中心化市场出售，无需注册商居中协助转让。
- **互操作性** — ENS 等标准使单一名称可在多个应用（钱包、浏览器、dApp）中解析，而无需每个应用都查询专有 API。

取舍在于：基于区块链的名称在传统 DNS 中解析能力有限，要求所有者自行管理密钥，且依赖底层链的持续运行。
