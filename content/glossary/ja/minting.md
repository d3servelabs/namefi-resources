---
title: ミンティング
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ブロックチェーン上に新しいトークンを作成すること。ドメインの場合は、その所有権を表すNFTを発行する処理を指す。
keywords: ['ミンティング', 'ミント', 'NFT作成', 'トークン発行', 'オンチェーン']
also_known_as: ['ミント']
level: 1
sources:
  - https://ethereum.org/en/nft/
relatedArticles:
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/how-to-tokenize-your-com/
  - /ja/blog/onchain-domain-custody-and-recovery/
  - /ja/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ja/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /ja/topics/domain-tokenization/
  - /ja/topics/domain-security/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/domain-apocalypse/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/registrar/
  - /ja/glossary/tokenized-domain/
  - /ja/glossary/web3/
  - /ja/glossary/tokenize/
---

**ミンティング**とは、[ブロックチェーン](/ja/glossary/blockchain/)に新しいトークンのレコードを書き込む行為であり、コインを鋳造することに例えられる。ただし「鋳造所」に相当するのは[スマートコントラクト](/ja/glossary/smart-contract/)の関数であり、コントラクトのオンチェーン状態にエントリを作成して所有者アドレスに割り当てる。ドメインのトークン化においてミンティングは特に重要なステップであり、実際のDNS名がブロックチェーンネイティブな資産へと変わる瞬間を指す。具体的には、スマートコントラクトが `mint` を呼び出して[ERC-721](/ja/glossary/erc-721/) [NFT](/ja/glossary/nft/)を生成し、そのトークンIDが特定のドメインに紐付けられる。ミンティング後は、従来のレジストラの手続きを経ることなく、ドメインをピアツーピアで転送したり、[NFTマーケットプレイス](/ja/glossary/marketplace/)に出品したり、[DeFi](/ja/glossary/defi/)で活用したりすることが可能になる。ミンティングには計算処理の対価として[ガス](/ja/glossary/gas/)が必要であり、[トークン化](/ja/glossary/tokenize/)のプロセスではレジストラのレコードをロックする処理も伴うことで、オンチェーンの所有者がDNS設定を管理できる状態になる。ミンティング完了後はNFTが所有権の唯一の信頼できる情報源となり、バーニング（破棄）によって従来の登録システムへの管理が返還される。
