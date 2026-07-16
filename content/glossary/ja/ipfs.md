---
title: IPFS
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ファイルをサーバーの場所ではなくコンテンツのハッシュで識別するピアツーピアプロトコル。分散型Webデータのホスティングに使用される。
keywords: ['IPFS', 'コンテンツアドレッシング', 'ピアツーピア', '分散型ストレージ', 'CID']
also_known_as: ['InterPlanetary File System']
level: 1
sources:
  - https://docs.ipfs.tech/concepts/what-is-ipfs/
relatedArticles:
  - /ja/blog/the-curve-finance-dns-hijack/
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/onchain-domain-custody-and-recovery/
  - /ja/blog/the-2024-squarespace-defi-domain-hijacks/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/web3/
  - /ja/glossary/dns/
  - /ja/glossary/tokenized-domain/
  - /ja/glossary/registrar/
  - /ja/glossary/blockchain/
---

**IPFS**（InterPlanetary File System）は、ファイルをサーバーの場所ではなくコンテンツのハッシュ値——コンテンツ識別子（CID）——によって特定するピアツーピアのハイパーメディアプロトコルである。同一ファイルを保持する複数のノードは同じ CID を生成するため、ネットワークは最も近い場所にあるノードからファイルを取得できる。このコンテンツアドレッシングの仕組みは、URL が特定のサーバーを指し示し、そのサーバーがオフラインになる可能性があるHTTPとは対照的なモデルである。[web3](/ja/glossary/web3/)アプリケーションでは、IPFS はオフチェーンのデータレイヤーとして標準的に利用されており、NFTのメタデータ・アートワーク・ドキュメントなどが IPFS 上に保存される。これにより、コストの高い[ブロックチェーン](/ja/glossary/blockchain/)にデータを永続的に書き込む必要がなく、[オンチェーン](/ja/glossary/on-chain/)のレコードには変更不可能な CID だけを保持する形になる。トークン化されたドメインにとっては、IPFS を使って分散型のウェブサイトをホストし、IPFS 対応のゲートウェイやブラウザ拡張機能を持つユーザーに対して、従来のDNSサーバーを完全に介さずにサイトを配信できるという利点もある。
