---
title: WHOIS（およびRDAP）
date: '2026-05-22'
language: ja
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: WHOISとその後継であるRDAPは、ドメインの登録情報（登録事業者や有効期限など）を公開照会するサービスです。
keywords: ['WHOIS', 'RDAP', 'ドメイン登録照会', '登録者情報', 'ドメイン所有者確認']
level: 1
sources:
  - https://www.icann.org/rdap
  - https://lookup.icann.org/
relatedArticles:
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/expired-domains-and-the-drop-cycle/
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/what-is-udrp/
  - /ja/blog/cctld-market-share-by-registration-volume/
relatedTopics:
  - /ja/topics/domain-basics/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/icann/
  - /ja/glossary/registrar/
  - /ja/glossary/dns/
  - /ja/glossary/whois-privacy/
  - /ja/glossary/registry/
---

**WHOIS** は、ドメインの登録情報——登録事業者、登録日・有効期限、そして従来は[登録者](/ja/glossary/registrant/)の連絡先情報——を照会するための長年にわたるプロトコルおよび公開サービスです。その現代的な後継が **RDAP（Registration Data Access Protocol）** であり、構造化されたJSONを返す方式で、[ICANN](/ja/glossary/icann/) やレジストリが移行を進めているプロトコルです。[トークン化ドメイン](/ja/blog/what-are-tokenized-domains/)の場合も、WHOIS/RDAPのレコードは[登録事業者](/ja/glossary/registrar/)レベルで引き続き存在します。これは、基盤となる[DNS](/ja/glossary/dns/)登録が実際のものであり、ICANNに認められているためです——変わるのは*所有権と移転の仕組み*が[オンチェーン](/ja/glossary/on-chain/)レイヤーに移行する点のみです。プライバシー保護はますます一般的になっており、GDPRなどのプライバシー法に準拠して、多くの登録事業者がデフォルトで個人の連絡先情報をマスクするようになっています。参考：[ICANNのWHOIS検索](https://lookup.icann.org/)。
