---
title: "中間認証局"
date: '2026-10-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "中間認証局は、信頼アンカーにつながる証明書チェーンを通じて委任された証明書署名権限を持つ。"
keywords: ["中間認証局", "中間 CA", "TLS 認証"]
also_known_as: ["中間 CA"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-6
  - https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0
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
  - /ja/glossary/man-in-the-middle-attack/
  - /ja/glossary/dane/
  - /ja/glossary/caa/
  - /ja/glossary/certificate-transparency/
---

**中間認証局**は**中間 CA** とも呼ばれ、別の[認証局](/ja/glossary/certificate-authority/)が証明書チェーンを通じて委任する署名権限を持つ。通常、証明書チェーンはウェブサイトの証明書を信頼するルートに接続し、複数の中間証明書を経由する場合もある。証明書の制約が委任権限を制限する。中間認証局の[秘密鍵](/ja/glossary/private-key/)が侵害されると、攻撃者は権限の範囲内で証明書の署名を偽造できる可能性がある。クライアントは、該当する信頼取り消しや失効の更新を適用する必要がある。あるウェブサイトの証明書を交換しても、他のクライアントの信頼判断から侵害された中間鍵を除外することにはならない。
