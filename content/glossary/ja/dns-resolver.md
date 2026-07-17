---
title: DNSリゾルバー（再帰的リゾルバー）
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ドメインの問い合わせを受け取り、DNSの階層構造をたどって対応するアドレスを返すサーバー。
keywords: ['DNSリゾルバー', '再帰的リゾルバー', 'リゾルバー', '8.8.8.8', '1.1.1.1', 'DNS検索']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/what-is-a-dns-resolver/
relatedArticles:
  - /ja/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /ja/blog/the-dyn-dns-mirai-attack/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/tokenized-domain-vs-web3-domain/
  - /ja/blog/premium-web3-tlds/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/tld/
  - /ja/glossary/urs/
  - /ja/glossary/registry/
  - /ja/glossary/registrar/
---

**DNSリゾルバー**（または*再帰的リゾルバー*）は、デバイスがドメイン名を[IPアドレス](/ja/glossary/ip-address/)に変換する必要があるときに問い合わせ先となるサーバーである。`1.1.1.1`（Cloudflare）や`8.8.8.8`（Google）のようなパブリックリゾルバーが実際の処理を担う。具体的には、[ルートゾーン](/ja/glossary/root-zone/)を起点に[DNS](/ja/glossary/dns/)の階層構造をたどり、そのドメインの権威[ネームサーバー](/ja/glossary/nameserver/)に到達するまで順次問い合わせを行い、得られた回答を[TTL](/ja/glossary/ttl/)の期間だけキャッシュする。「名前を入力すればサイトに瞬時につながる」という体験を支えているのが、このDNSの仕組みである。
