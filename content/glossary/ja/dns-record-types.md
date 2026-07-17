---
title: DNSレコードタイプ（A、AAAA、CNAME、MX、TXT）
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ドメインをアドレスやサービスにマッピングするゾーン内のエントリ — A、AAAA、CNAME、MX、TXT など。
keywords: ['DNSレコード', 'Aレコード', 'AAAAレコード', 'CNAME', 'MXレコード', 'TXTレコード']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/dns-records/
relatedArticles:
  - /ja/blog/dns-on-tokenized-domains/
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/the-dnspionage-campaign/
  - /ja/blog/what-are-tokenized-domains/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/registrar/
  - /ja/glossary/tld/
  - /ja/glossary/icann/
  - /ja/glossary/registry/
---

**DNSレコードタイプ**とは、ドメインのゾーン内に存在する個別のエントリであり、さまざまな種類のトラフィックをどこへ送るかを[DNS](/ja/glossary/dns/)に伝えるものです。代表的なものとして、**A**（名前をIPv4の[IPアドレス](/ja/glossary/ip-address/)にマッピング）、**AAAA**（IPv6）、**CNAME**（ある名前を別の名前のエイリアスとして定義）、**MX**（メールの経路を指定）、**TXT**（SPF・DKIM・ドメイン認証などに使われる自由形式のテキスト）があります。これらのレコードはドメインを委任した[ネームサーバー](/ja/glossary/nameserver/)によって公開され、ウェブサイトの表示やメールの配送を実際に成立させる役割を担っています。
