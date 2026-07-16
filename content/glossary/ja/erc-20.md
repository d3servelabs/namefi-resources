---
title: ERC-20
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ステーブルコインなどの代替可能トークンに関するEthereumの標準規格で、ERC-721 NFT標準を補完するものです。
keywords: ['ERC-20', '代替可能トークン', 'トークン標準', 'ステーブルコイン', 'イーサリアムトークン']
level: 1
sources:
  - https://eips.ethereum.org/EIPS/eip-20
relatedArticles:
  - /ja/blog/the-badgerdao-frontend-attack/
  - /ja/blog/onchain-domain-flipping/
  - /ja/blog/selling-domains-as-nfts/
  - /ja/blog/how-tokenization-changes-domain-flipping/
  - /ja/blog/onchain-domain-marketplaces-compared/
relatedTopics:
  - /ja/topics/domain-investing/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/domain-apocalypse/
relatedGlossary:
  - /ja/glossary/ethereum/
  - /ja/glossary/erc-721/
  - /ja/glossary/stablecoin/
  - /ja/glossary/wallet/
  - /ja/glossary/web3/
---

**ERC-20**は、代替可能トークンの標準インターフェースを定義する[Ethereum](/ja/glossary/ethereum/)改善提案（EIP）です。代替可能トークンとは、銀行口座における通貨と同様に、各ユニットが同一で相互に交換可能なトークンのことを指します。ERC-20が規定する `transfer`・`approve`・`allowance` 関数を実装したコントラクトは、個別の統合作業なしに、ウォレット・取引所・[DeFi](/ja/glossary/defi/)プロトコルと自動的に互換性を持ちます。USDCやUSDTといった[ステーブルコイン](/ja/glossary/stablecoin/)はERC-20トークンであり、多くのガバナンストークンやユーティリティトークンも同様です。ERC-20は[ERC-721](/ja/glossary/erc-721/)と対照的な存在です。ERC-721トークンは非代替可能（ノン・ファンジブル）であり、各トークンが一意のIDを持ち、特定のドメイン名のような固有の資産を表します。