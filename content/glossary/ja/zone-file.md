---
title: ゾーンファイル（グルーレコード）
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: ドメインのすべての DNS レコード（ネームサーバー用のグルーレコードを含む）を保持するテキストファイル。
keywords: ['ゾーンファイル', 'グルーレコード', 'DNS ゾーン', '権威レコード', 'ネームサーバー']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/dns-zone/
relatedArticles:
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/dns-on-tokenized-domains/
  - /ja/blog/the-dnspionage-campaign/
  - /ja/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/registry/
  - /ja/glossary/registrar/
  - /ja/glossary/tld/
  - /ja/glossary/icann/
---

**ゾーンファイル**とは、ドメインの権威[ネームサーバー](/ja/glossary/nameserver/)上に置かれたテキストファイルであり、そのドメインのすべての[DNS レコード](/ja/glossary/dns-record-types/)（A レコード、MX レコード、TXT レコードなど、ドメインの動作を定義するすべてのエントリ）を格納しています。**グルーレコード**は特殊なケースです。ドメインのネームサーバーが*そのドメイン自身の配下*に存在する場合（例：`ns1.example.com` が `example.com` を管理している場合）、鶏と卵のような循環参照を避けるため、親[レジストリ](/ja/glossary/registry/)がネームサーバーの[IP アドレス](/ja/glossary/ip-address/)を親ゾーン内に直接公開する必要があります。ゾーンファイルを編集することが、ドメインの [DNS](/ja/glossary/dns/) を設定する手段です。
