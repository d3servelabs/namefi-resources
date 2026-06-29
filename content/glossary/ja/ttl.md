---
title: TTL（Time to Live）
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: DNSレコードに付与される秒単位の値で、リゾルバーが再問い合わせを行う前にその回答をキャッシュしてよい時間を示す。
keywords: ['TTL', 'time to live', 'DNSキャッシュ', 'DNS伝播', 'レコードキャッシュ']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
relatedArticles:
  - /ja/blog/the-panix-com-domain-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-sushiswap-miso-insider-attack/
  - /ja/blog/working-with-domain-brokers/
  - /ja/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-investing/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/dns-propagation/
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/registry/
---

**TTL（time to live）**は、すべての[DNSレコード](/ja/glossary/dns-record-types/)に付与される秒単位の値であり、[リゾルバー](/ja/glossary/dns-resolver/)が再度問い合わせを行う前にその回答をキャッシュしてよい時間を[リゾルバー](/ja/glossary/dns-resolver/)に伝えるものです。TTLが短い場合（例：300秒）、変更はすぐに反映されますが、その分ルックアップの回数が増えます。一方、TTLが長い場合（86,400秒＝1日）は効率的ですが、更新内容がキャッシュに残り続けます。変更を予定している1日前にTTLを短縮しておくことが、[DNS伝播](/ja/glossary/dns-propagation/)を素早く行うための標準的な手法です。
