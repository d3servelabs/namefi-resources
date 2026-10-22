---
title: "CAA"
date: '2026-10-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "CAA レコードは、ドメインが証明書の発行を許可する認証局を指定する。"
keywords: ["CAA", "認証局認可", "TLS 認証"]
also_known_as: ["認証局認可"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc8659#section-1
  - https://www.rfc-editor.org/rfc/rfc8659#section-5
  - https://letsencrypt.org/docs/caa/
relatedArticles:
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/the-curve-finance-dns-hijack/
  - /ja/blog/dns-on-tokenized-domains/
  - /ja/blog/dnssec-for-domain-owners/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/certificate-authority/
  - /ja/glossary/intermediate-ca/
  - /ja/glossary/man-in-the-middle-attack/
  - /ja/glossary/dane/
  - /ja/glossary/certificate-transparency/
---

**CAA** は**認証局認可**の略称であり、ドメインが証明書の発行を許可する[認証局](/ja/glossary/certificate-authority/)を指定する DNS レコードである。仕様に従う CA は、発行前に適用対象の CAA レコードを確認する。[DNSSEC（ドメインネームシステム・セキュリティ拡張）](/ja/glossary/dnssec/)は、ポリシーを含む DNS 応答の真正性を検証できる。CAA は、仕様に従う手続きでの意図しない発行を減らす。CAA は、他の発行者の証明書をブラウザーに拒否させることも、既存の証明書を失効させることも、侵害された CA 署名鍵による直接の証明書偽造を阻止することもない。CAA は発行者への許可を指定し、ドメインの検証は別の要件として残る。
