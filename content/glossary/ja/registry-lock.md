---
title: レジストリロック
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: レジストリがドメインを凍結し、変更には手動による帯域外承認が必要となる高セキュリティサービス。
keywords: ['レジストリロック', 'ドメインロック', '高セキュリティロック', 'ドメインハイジャック防止', '帯域外認証']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /ja/blog/the-syrian-electronic-army-nyt-hijack/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-sea-turtle-dns-espionage/
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/the-malaysia-airlines-dns-hijack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/registry/
  - /ja/glossary/dns/
  - /ja/glossary/domain-hijacking/
  - /ja/glossary/transfer-lock/
---

**レジストリロック**は、[レジストリ](/ja/glossary/registry/)が提供するプレミアムセキュリティサービスであり、対象ドメインに対して[ネームサーバー](/ja/glossary/nameserver/)の変更・移管・削除を含む一切の操作を通常の自動EPPチャネル経由では受け付けない状態に設定するものです。変更を行うには、レジストラとレジストリの間で電話確認・暗号トークン・対面での本人確認といった手動の帯域外認証プロセスを経る必要があります。これは、レジストラ側が管理しシステム上で簡単に切り替えられる一般的な[移管ロック](/ja/glossary/transfer-lock/)とは異なります。レジストリロックはレジストリ層まで保護を引き上げるため、攻撃者がレジストラアカウントを完全に乗っ取ったとしても不正な変更を行うことが極めて困難になります。このサービスは主に、高価値ドメインを[ドメインハイジャック](/ja/glossary/domain-hijacking/)から守りたい金融機関・大手ブランド・重要インフラ事業者が利用しています。
