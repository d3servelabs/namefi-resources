---
title: "DANE"
date: '2026-10-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "DANE は、DNSSEC で保護した TLSA レコード内の証明書や鍵との関連付けを通じて TLS サービスを認証する。"
keywords: ["DANE", "DNS に基づく名前付きエンティティの認証", "TLS 認証"]
also_known_as: ["DNS に基づく名前付きエンティティの認証"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc6698#section-2
  - https://www.rfc-editor.org/rfc/rfc7671#section-5.1
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
  - /ja/glossary/caa/
  - /ja/glossary/certificate-transparency/
---

**DANE** は **DNS に基づく名前付きエンティティの認証**の略称であり、TLSA レコードを使って TLS サービスを証明書、公開鍵、または信頼アンカーに関連付ける。[DNSSEC（ドメインネームシステム・セキュリティ拡張）](/ja/glossary/dnssec/)が DNS データの真正性を検証する。対応するクライアントは、TLS 認証時に関連付けの条件を強制する。選択した用途によって、DANE は公的に信頼される[認証局](/ja/glossary/certificate-authority/)を制約することも、公開 CA への信頼から独立してサービスを認証することもできる。TLSA レコードを公開するだけでは、DANE を無視するクライアントを保護できない。運用者は、鍵の変更と TLSA の更新を調整し、DNSSEC 検証を維持する必要がある。
