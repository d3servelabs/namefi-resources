---
title: ドメインハイジャック
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: レジストラアカウントへの不正アクセスにより、ドメイン名の管理権を奪取される行為。
keywords: ['ドメインハイジャック', 'アカウント侵害', 'ドメイン盗難', 'レジストラセキュリティ', '不正移管']
level: 1
sources:
  - https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en
relatedArticles:
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/domain-flipping-and-the-law/
  - /ja/blog/the-perl-com-domain-theft/
  - /ja/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ja/blog/the-panix-com-domain-hijack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/domain-theft/
  - /ja/glossary/registrar/
  - /ja/glossary/registry-lock/
  - /ja/glossary/phishing/
  - /ja/glossary/transfer-lock/
---

**ドメインハイジャック**とは、攻撃者がドメインを所有する[レジストラ](/ja/glossary/registrar/)アカウントの管理権を不正に奪取することで、ドメイン名を乗っ取る行為を指す。手口としては、[フィッシング](/ja/glossary/phishing/)、クレデンシャルスタッフィング（流出した認証情報を使った攻撃）、またはレジストラのサポート担当者を狙ったソーシャルエンジニアリングが典型的である。アカウントへの侵入に成功した攻撃者は、ネームサーバーを変更してトラフィックを別サイトへ誘導したり、[レジストリロック](/ja/glossary/registry-lock/)の保護を無効化したり、ドメインを他のレジストラへ移管することで正規オーナーを完全に締め出したりすることができる。このため、ドメインハイジャックは[ドメイン盗難](/ja/glossary/domain-theft/)と実質的に同義となる場合も多い。対策としては、[移管ロック](/ja/glossary/transfer-lock/)の有効化、ハードウェアキーを用いた二要素認証の導入、高価値ドメインへのレジストリレベルのロック適用、そしてレジストラに登録した連絡先情報を最新の状態に保ち、アカウント復旧メールが確実に届くようにしておくことが挙げられる。
