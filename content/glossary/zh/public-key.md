---
title: 公钥
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 区块链密钥对中可公开分享的一半，由私钥派生而来，用于接收资产和验证签名。
keywords: ['公钥', '地址', '验证密钥', '非对称密码学', '区块链账户']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
---

**公钥**（public key）是[区块链](/zh/glossary/blockchain/)账户密码密钥对中可公开分享的一半。公钥本身——或由其派生的地址——可安全地公开发布：其他人向你发送代币或以你的名义调用智能合约时，都需要用到它。公钥通过单向椭圆曲线运算从[私钥](/zh/glossary/private-key/)派生而来，因此公开分享公钥不会暴露授权交易的私密信息。将数字签名与公钥进行核验，可证明某条消息由对应私钥的持有者签署，这也是网络确认交易确实获得授权的方式。
