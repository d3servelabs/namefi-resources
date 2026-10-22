---
title: "証明書の透明性"
date: '2026-10-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "証明書の透明性は、公開ログで TLS 証明書の発行を可視化し、独立した監視と監査を可能にする。"
keywords: ["証明書の透明性", "CT", "TLS 認証"]
also_known_as: ["CT"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc9162#section-1
  - https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/
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
  - /ja/glossary/caa/
---

**証明書の透明性**は **CT** とも呼ばれ、TLS 証明書を追記専用の公開ログに記録する。ドメイン運用者や他の監視者は、ログを調べて[認証局](/ja/glossary/certificate-authority/)による予期しない発行を検出できる。クライアントのポリシーは、証明書を受け入れる前にログへの記録の証拠を要求できる。ログへの記録だけでは、不正発行の防止も証明書の失効もできない。クライアントによるポリシーの強制と監視は、異なる保護を提供する。CT は [CAA](/ja/glossary/caa/)を補完する。CAA は発行前に発行者への許可を規定し、CT は発行後にログ内の証明書を公開して検査を可能にする。
