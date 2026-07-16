---
title: クロスチェーンブリッジ
date: '2026-06-22'
language: ja
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: 相互に直接通信できないブロックチェーン間でトークンやメッセージを移動させるプロトコル。
keywords: ['ブリッジ', 'クロスチェーン', '相互運用性', 'トークンブリッジ', 'マルチチェーン']
also_known_as: ['ブリッジ']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/bridges/
relatedArticles:
  - /ja/blog/how-tokenization-changes-domain-flipping/
  - /ja/blog/tokenize-your-com-to-flip-it/
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/tokenized-domain-use-cases-2026/
  - /ja/blog/tax-and-accounting-questions-for-tokenized-domains/
relatedTopics:
  - /ja/topics/domain-tokenization/
  - /ja/topics/domain-security/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/tokenized-domain/
  - /ja/glossary/ethereum/
  - /ja/glossary/web3/
  - /ja/glossary/tokenize/
  - /ja/glossary/registrar/
---

**クロスチェーンブリッジ**（ブリッジとも呼ばれる）は、ある[ブロックチェーン](/ja/glossary/blockchain/)上の資産をロックし、別のチェーン上に代替トークンをミントするプロトコルであり、ネイティブな通信チャネルを持たないネットワーク間で価値とデータの移動を可能にする。最も一般的なパターンは「ロック・アンド・ミント」方式で、ソースチェーン上のブリッジコントラクトにトークンを預けると、カストディアンまたは分散型オラクルがデスティネーションチェーン上の対応コントラクトに対しラップされた等価トークンの発行を指示する仕組みだ。ブリッジは[Ethereum](/ja/glossary/ethereum/)メインネットをOptimismやBaseのような[レイヤー2](/ja/glossary/layer-2/)ロールアップ、さらにはPolygonやSolanaといった独立したチェーンとも接続する。ブリッジはロックされた大量の資産を保管するため、攻撃の標的になりやすく、これまでに数億ドル規模の被害をもたらすエクスプロイトが複数発生している。トークン化ドメインにおいては、ブリッジを活用することで、Ethereum上で発行されたNFTを低コストなレイヤー2に移動させて安価に転送し、[DeFi](/ja/glossary/defi/)の[担保](/ja/glossary/collateral/)として利用する際にはメインネットに戻すといった運用が可能になる。
