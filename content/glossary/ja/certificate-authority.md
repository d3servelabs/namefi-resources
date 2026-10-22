---
title: "認証局"
date: '2026-10-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "認証局は、身元情報と公開鍵を関連付けるデジタル証明書を発行する。"
keywords: ["認証局", "CA", "TLS 認証"]
also_known_as: ["CA", "証明書認証局"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-3.2
  - https://www.rfc-editor.org/rfc/rfc8659#section-2.2
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
  - /ja/glossary/intermediate-ca/
  - /ja/glossary/man-in-the-middle-attack/
  - /ja/glossary/dane/
  - /ja/glossary/caa/
  - /ja/glossary/certificate-transparency/
---

**認証局**は**証明書認証局**または **CA** とも呼ばれ、身元情報と[公開鍵](/ja/glossary/public-key/)を関連付けるデジタル証明書を発行する。公的に信頼される TLS CA は、ウェブサイトの証明書に署名する前に、ドメインの管理権と適用される身元確認要件を確認する。クライアントは、信頼するルートに照らして証明書チェーンを検証し、対応する秘密鍵をサーバーが保有する証明を確認する。CA は[中間認証局](/ja/glossary/intermediate-ca/)に署名権限を委任できる。CA への信頼は、クライアントのポリシーに基づく身元認証に役立つ。CA への信頼は、ウェブサイトの内容が誠実であることを保証しない。
