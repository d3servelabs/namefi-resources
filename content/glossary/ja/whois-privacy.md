---
title: WHOIS プライバシー
date: '2026-06-22'
language: ja
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: 公開 WHOIS または RDAP レコードにおいて、登録者の個人連絡先情報をマスクするサービス。
keywords: ['WHOIS プライバシー', 'プライバシー保護', 'RDAP', '登録者プライバシー', '連絡先マスキング']
also_known_as: ['プライバシー保護']
level: 1
sources:
  - https://www.icann.org/rdap
relatedArticles:
  - /ja/blog/from-massdrop-com-to-drop-com/
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/from-getdropbox-com-to-dropbox-com/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-investing/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/dns/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
  - /ja/glossary/whois/
---

**WHOIS プライバシー**（またはプライバシー保護）は、ほとんどの[レジストラ](/ja/glossary/registrar/)が提供するサービスであり、公開 [WHOIS](/ja/glossary/whois/) および RDAP レコードに記載される[登録者](/ja/glossary/registrant/)の実名・住所・電話番号・メールアドレスを、通常はレジストラ自身の連絡先情報と転送用メールアドレスからなるプロキシ情報に置き換えるものです。このサービスを利用しない場合、それらの詳細情報は誰でも照会可能な状態となり、ドメイン所有者はスパム、ソーシャルエンジニアリング、そしてレジストラの認証情報を窃取することを目的とした標的型[フィッシング](/ja/glossary/phishing/)の被害を受けやすくなります。2018年以降の GDPR 施行により、多くのレジストリが gTLD WHOIS において個人情報をデフォルトで非公開とする対応を取るようになりましたが、保護の水準は TLD やレジストラによって異なるため、プライバシーサービスを明示的に有効化することは引き続き推奨されます。なお、プライバシー保護が「しないこと」を理解しておくことも重要です。連絡先情報を隠すことはできても、技術力のある攻撃者が DNS 列挙や証明書透明性（Certificate Transparency）ログを用いてドメインのインフラ構成を把握することを防ぐものではありません。
