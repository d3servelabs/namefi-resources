---
title: DNS伝播
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: DNSの変更がインターネット全体に反映されるまでの遅延。古いレコードのキャッシュがリゾルバー間でTTL切れを迎えるまで発生する。
keywords: ['DNS伝播', 'DNS更新の遅延', 'TTL', 'DNSキャッシュ', 'ネームサーバー変更']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
  - https://datatracker.ietf.org/doc/html/rfc1035
relatedArticles:
  - /ja/blog/the-curve-finance-dns-hijack/
  - /ja/blog/the-malaysia-airlines-dns-hijack/
  - /ja/blog/the-perl-com-domain-theft/
  - /ja/blog/dns-on-tokenized-domains/
  - /ja/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/ttl/
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/registry/
---

**DNS伝播**とは、[DNS](/ja/glossary/dns/)の変更を行ってから、その変更がインターネット全体で反映されるまでのタイムラグのことである。世界中の[リゾルバー](/ja/glossary/dns-resolver/)は古い応答を[TTL](/ja/glossary/ttl/)が切れるまでキャッシュしているため、新しい[レコード](/ja/glossary/dns-record-types/)や[ネームサーバー](/ja/glossary/nameserver/)の更新は即座に反映されず、数分から数日かけて段階的に広まっていく。更新対象となるグローバルな「DNS」が一か所に存在するわけではなく、伝播とはキャッシュが順次期限切れを迎えるプロセスに過ぎない。現実的な対処策は、計画的な変更の前にTTLをあらかじめ短く設定しておくことである。
