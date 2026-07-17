---
title: 移管ロック
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ドメインを別のレジストラへ移管できないようにするステータス。明示的にロックを解除するまで移管は拒否される。
keywords: ['移管ロック', 'レジストラロック', 'ドメインセキュリティ', 'EPP ステータス', 'ドメイン移管']
also_known_as: ['レジストラロック']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /ja/blog/the-panix-com-domain-hijack/
  - /ja/blog/how-to-sell-a-domain-name-you-own/
  - /ja/blog/how-tokenization-changes-domain-flipping/
  - /ja/blog/avoiding-domain-sale-scams/
  - /ja/blog/working-with-domain-brokers/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-investing/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/domain-apocalypse/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/domain-hijacking/
  - /ja/glossary/cross-registrar-transfer/
  - /ja/glossary/epp/
  - /ja/glossary/registry-lock/
---

**移管ロック**（*レジストラロック*とも呼ばれる。EPP ステータス `clientTransferProhibited`）は、[レジストラ](/ja/glossary/registrar/)がドメインに設定するフラグであり、意図的にロックを解除するまで、そのドメインを別のレジストラへ移動できないようにする。ロックが有効な状態では、[レジストラ間移管](/ja/glossary/cross-registrar-transfer/)を開始しようとするいかなる試みも、処理が進む前に拒否される。たとえリクエスト側が[認証コード](/ja/glossary/auth-code/)を持っていても例外ではない。移管ロックは[ドメインハイジャック](/ja/glossary/domain-hijacking/)に対する最もシンプルかつ効果的な防御手段の一つである。アカウントを不正に取得した攻撃者も、ロックが有効である限り、ドメインを密かに別の場所へ移管することはできない。ベストプラクティスとしては、常に移管ロックを有効にしておき、正規の移管を完了するために必要な短い期間だけ解除することが推奨される。
