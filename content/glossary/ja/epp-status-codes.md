---
title: EPPステータスコード
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ドメインの現在の状態（ロック中、保留中、転送待ちなど）を示す標準化されたフラグ。
keywords: ['EPPステータスコード', 'clientHold', 'serverTransferProhibited', 'ドメインステータス', 'pending delete']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /ja/blog/expired-domains-and-the-drop-cycle/
  - /ja/blog/domain-backorders-and-drop-catching/
  - /ja/blog/how-to-sell-a-domain-name-you-own/
  - /ja/blog/the-panix-com-domain-hijack/
  - /ja/blog/working-with-domain-brokers/
relatedTopics:
  - /ja/topics/domain-investing/
  - /ja/topics/domain-security/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/domain-apocalypse/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/epp/
  - /ja/glossary/registry/
  - /ja/glossary/dns/
  - /ja/glossary/transfer-lock/
---

**EPPステータスコード**とは、Extensible Provisioning Protocol（[EPP](/ja/glossary/epp/)）で定義された機械可読フラグであり、特定の時点でドメインに対して許可されている操作を正確に示すものである。コードは2つの名前空間に分類される。`client*` コードは[レジストラ](/ja/glossary/registrar/)が設定し、`server*` コードは[レジストリ](/ja/glossary/registry/)が設定する。サーバー側のコードはクライアント側より優先される。主なコードとしては、`clientTransferProhibited`（ドメインの外部転送を防ぐ[転送ロック](/ja/glossary/transfer-lock/)）、`serverDeleteProhibited`（レジストリレベルでの削除保護）、`clientHold`（料金未払いなどを理由にDNS解決を停止する）、そして `pendingDelete`（ドメインが[グレースピリオド](/ja/glossary/grace-period/)の期間中にあり、間もなく解放されて再登録可能になる状態で、[pending delete](/ja/glossary/pending-delete/) に隣接する状態）などが挙げられる。これらのコードを理解することは実務上重要である。たとえば、`serverTransferProhibited` が設定されたドメインは、レジストラ側でロックを解除しても転送ができないため、取引の途中で買い手が思わぬ事態に直面することがある。
