---
title: レイヤー2
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: メインのブロックチェーン上に構築され、トランザクションを高速・低コストで処理するネットワーク。EthereumにおけるBaseなどがその例。
keywords: ['レイヤー2', 'ロールアップ', 'スケーリング', 'オプティミスティックロールアップ', 'ZKロールアップ']
level: 1
sources:
  - https://ethereum.org/en/layer-2/
relatedArticles:
  - /ja/blog/selling-domains-as-nfts/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/tokenize-your-com-to-flip-it/
  - /ja/blog/what-are-tokenized-domains/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/cross-chain-bridge/
  - /ja/glossary/ethereum/
  - /ja/glossary/tokenized-domain/
  - /ja/glossary/blockchain/
---

**レイヤー2**（L2）とは、メインの[ブロックチェーン](/ja/glossary/blockchain/)（レイヤー1）の外でトランザクションを実行し、圧縮されたプルーフまたはデータを親チェーンに書き戻すネットワークのことである。親チェーンのセキュリティを継承しながら、コストとレイテンシーを大幅に削減できる。主要な設計方式は二つある。オプティミスティックロールアップはトランザクションを有効と見なし、不正証明のチャレンジ期間を設ける方式であり、ZKロールアップはバッチごとに暗号学的な有効性証明を提出する方式である。Base、Optimism、Arbitrum、zkSync はいずれも[Ethereum](/ja/glossary/ethereum/)上のL2である。処理をL2に移行することで[ガス](/ja/glossary/gas/)手数料を10〜100分の1に削減でき、マイクロトランザクションや高頻度のアセット転送が経済的に成立するようになる。[トークン化ドメイン](/ja/glossary/tokenized-domain/)に関わる定型的な操作——通常の転送、DNS設定の更新、サブドメインの発行——をL2で実行することで、ユーザーはEthereumメインネットへのアセットの来歴の記録を保ちながら、数ドルではなく数セント単位のコストで操作を行える。L1とL2の間でアセットを移動する必要がある場合は、[クロスチェーンブリッジ](/ja/glossary/cross-chain-bridge/)を使用する。
