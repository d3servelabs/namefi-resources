---
title: ERC-20
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 以太坊上的同质化代币标准，如稳定币所采用，与 ERC-721 NFT 标准互补。
keywords: ['ERC-20', '同质化代币', '代币标准', '稳定币', '以太坊代币']
level: 1
sources:
  - https://eips.ethereum.org/EIPS/eip-20
---

**ERC-20** 是[以太坊](/zh/glossary/ethereum/)改进提案中定义同质化代币标准接口的规范——每个单位完全相同且可互换，就像银行账户里的货币一样。任何实现了 ERC-20 的 `transfer`、`approve` 和 `allowance` 函数的合约，无需自定义集成即可自动与钱包、交易所和 DeFi 协议兼容。USDC 和 USDT 等[稳定币](/zh/glossary/stablecoin/)，以及大多数治理代币和功能代币，均为 ERC-20 代币。ERC-20 与 [ERC-721](/zh/glossary/erc-721/) 形成鲜明对比：ERC-721 代币是非同质化的——每个代币都有唯一 ID，代表特定资产，例如某个具体域名。
