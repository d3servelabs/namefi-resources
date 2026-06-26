---
title: アトミック転送
date: '2025-06-30'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: 資産と支払いの交換が、単一の不可分なオンチェーン手順で完全に成立するか、まったく成立しない取引。
keywords: ['atomic transfer', 'blockchain transaction', 'all-or-nothing', 'secure exchange', 'smart contract']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/transactions/
---

**アトミック転送**とは、完全に成立するか完全に失敗するかのどちらかで、部分的に実行された状態を残さない取引です。「アトミック」という語は、その操作をさらに小さな部分へ分割できないという考えに由来します。従来のドメイン移転では、複数のシステムをまたぐ手順が必要になることが多く、部分的な完了や紛争のリスクが生まれます。トークン化ドメインでは、ドメイン [NFT](/ja/glossary/nft/) を取引するとき、所有権の変更と関連する支払いが単一のブロックチェーン取引内で同時に行われることをアトミック転送が保証します。これによりカウンターパーティリスクがなくなり、双方が合意したものを受け取るか、取引全体が取り消されるかのどちらかになります。
