---
title: DNSSEC（ドメインネームシステム・セキュリティ拡張）
date: '2026-05-22'
language: ja
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: DNSレコードに付与される暗号署名。リゾルバーが応答の正当性を検証し、転送中の偽造や改ざんを検知できるようにする。
keywords: ['DNSSEC', 'DNSセキュリティ', 'ドメインセキュリティ', 'DSレコード', '信頼チェーン', '暗号化DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4033
relatedArticles:
  - /ja/blog/dns-on-tokenized-domains/
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/the-curve-finance-dns-hijack/
  - /ja/blog/the-dnspionage-campaign/
  - /ja/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/registrar/
  - /ja/glossary/registry/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
---

**DNSSEC（Domain Name System Security Extensions）**は、[DNS](/ja/glossary/dns/)プロトコルに対する暗号拡張仕様の総称であり、リゾルバーがDNS応答の真正性と完全性を検証できるようにする。DNSSECがない場合、攻撃者はリゾルバーと権威サーバーの間の経路でDNS応答を偽造・改ざんし、ユーザーを悪意のあるインフラへ誘導することができる。DNSSECを導入すると、レコードに署名が付与され、DSレコードを介してDNSルートから各ゾーンへと連なる「信頼チェーン」が構築される。DNSSECは[RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033)および関連RFCで規定されている。ドメインをトークン化してもDNSSECの仕組みは何ら変わらない——信頼チェーンは引き続き[レジストラー](/ja/glossary/registrar/)と[レジストリ](/ja/glossary/registry/)を経由し、DSレコードも従来どおりの方法で公開される。多くのDNSプロバイダー（Cloudflare、Route53など）は、DNSSECを有効化するとゾーンへの署名を自動的に行う。
