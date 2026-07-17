---
title: ネームサーバー（NSレコード）
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ドメインのDNSクエリに応答するサーバー。NSレコードがそのドメインの権威サーバーを指定する。
keywords: ['ネームサーバー', 'NSレコード', '権威サーバー', 'DNS委任', 'DNSホスティング']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/dns-server-types/
relatedArticles:
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/dns-on-tokenized-domains/
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/the-dnspionage-campaign/
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
  - /ja/glossary/tld/
  - /ja/glossary/zone-file/
---

**ネームサーバー**とは、ドメインの[DNS](/ja/glossary/dns/)クエリに応答するサーバーのことであり、ドメインの[レジストリ](/ja/glossary/registry/)に登録された**NSレコード**が、そのドメインに対して権威を持つネームサーバーを指定する。ドメインをDNSホスト（Cloudflare、Route 53、あるいは[レジストラ](/ja/glossary/registrar/)独自のDNS）に向ける際に設定するのがこのネームサーバーであり、各ネームサーバーがAレコード、MXレコード、TXTレコードなど各種[レコードタイプ](/ja/glossary/dns-record-types/)を公開することで、トラフィックやメールの経路が決まる。
