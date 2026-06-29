---
title: シードフレーズ（リカバリーフレーズ、ニーモニック）
date: '2026-05-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: ウォレットのマスター秘密鍵をエンコードする12語または24語のリスト。保有者はウォレットを完全に支配できるため、必ずバックアップすべき唯一の情報です。
keywords: ['シードフレーズ', 'リカバリーフレーズ', 'ニーモニックフレーズ', 'ウォレットバックアップ', 'BIP39', '12ワード', '24ワード', '暗号資産リカバリー']
level: 1
sources:
  - https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
relatedArticles:
  - /ja/blog/onchain-domain-custody-and-recovery/
  - /ja/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ja/blog/do-multisig-wallets-actually-improve-security/
  - /ja/blog/selling-domains-as-nfts/
  - /ja/blog/the-badgerdao-frontend-attack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/private-key/
  - /ja/glossary/web3/
  - /ja/glossary/wallet/
  - /ja/glossary/tokenized-domain/
  - /ja/glossary/tokenize/
---

**シードフレーズ**（**リカバリーフレーズ**または**ニーモニックフレーズ**とも呼ばれる）は、[ウォレット](/ja/glossary/wallet/)のマスター秘密鍵をエンコードした12語または24語の人間が読める単語リストです。この形式は [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) によって標準化されており、MetaMask、Ledger、Trezor、Rabby、Coinbase Wallet など、現代の主要なウォレットのほぼすべてで採用されています。シードフレーズがあれば、[トークン化されたドメイン](/ja/blog/what-are-tokenized-domains/)を含むウォレット内のあらゆる資産を、対応する任意のデバイスで復元できます。一方、シードフレーズを失った状態でデバイスへのアクセスを喪失した場合、「パスワードリセット」を発行できる中央機関が存在しないため、資産の永久喪失につながります。ベストプラクティスとして、シードフレーズは紙または金属製バックアップに書き留め、異なる物理的場所に最低2部保管し、コンピューター・クラウドドキュメント・クラウドに接続するパスワードマネージャー・チャット・AIアシスタントなどへの入力は**絶対に行わない**ことが重要です。具体的な操作手順については、[ウォレット紛失後のトークン化ドメイン復旧ガイド](/ja/blog/recovering-a-tokenized-domain-after-wallet-loss/)を参照してください。
