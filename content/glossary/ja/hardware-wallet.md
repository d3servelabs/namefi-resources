---
title: ハードウェアウォレット
date: '2026-05-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ウォレットの秘密鍵をオフラインで保管し、デバイス上でトランザクションに署名する専用デバイス。鍵がインターネットに接続されたコンピュータに触れることはない。
keywords: ['ハードウェアウォレット', 'コールドウォレット', 'Ledger', 'Trezor', 'GridPlus', 'Keystone', 'セキュアエレメント', 'セルフカストディ']
level: 1
sources:
  - https://ethereum.org/en/wallets/
relatedArticles:
  - /ja/blog/onchain-domain-custody-and-recovery/
  - /ja/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ja/blog/do-multisig-wallets-actually-improve-security/
  - /ja/blog/tokenize-your-com-to-flip-it/
  - /ja/blog/how-to-tokenize-your-com/
relatedTopics:
  - /ja/topics/domain-tokenization/
  - /ja/topics/domain-security/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/domain-apocalypse/
relatedGlossary:
  - /ja/glossary/wallet/
  - /ja/glossary/private-key/
  - /ja/glossary/web3/
  - /ja/glossary/registrar/
  - /ja/glossary/erc-721/
---

**ハードウェアウォレット**とは、[ウォレット](/ja/glossary/wallet/)の秘密鍵をオフラインで保管し、デバイス自体の内部でトランザクションに署名する小型の専用デバイスである。一般的にスクリーンと1〜2個のボタンを備えており、鍵がインターネットに接続されたコンピュータに触れることは一切ない。代表的な製品としては、Ledger、Trezor、GridPlus Lattice、Keystoneなどが挙げられる。署名処理はデバイスのセキュアエレメント内部で完結するため、接続先のノートパソコンにマルウェアが侵入していても秘密鍵を抽出することはできない。攻撃者にできる最悪の手段は、デバイス画面上で悪意あるトランザクションをユーザーに承認させることだけであり、だからこそ「デバイス上での確認」が重要なのである。
