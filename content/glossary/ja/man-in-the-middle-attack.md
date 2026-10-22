---
title: "中間者攻撃"
date: '2026-10-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "中間者攻撃では、攻撃者が通信する当事者の間に入り、通信を傍受または改変する。"
keywords: ["中間者攻撃", "MITM", "TLS 認証"]
also_known_as: ["MITM", "オンパス攻撃"]
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4949
  - https://datatracker.ietf.org/doc/html/rfc8446#section-1
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
  - /ja/glossary/dane/
  - /ja/glossary/caa/
  - /ja/glossary/certificate-transparency/
---

**中間者攻撃**は **MITM** または**オンパス攻撃**とも呼ばれ、攻撃者が通信する当事者の間に入る攻撃を指す。当事者が直接通信していると考えている間に、攻撃者は通信を傍受、転送、または改変する。[DNSハイジャック](/ja/glossary/dns-hijacking/)は接続先を攻撃者に変更できる。HTTPS は通常、証明書の検証と秘密鍵の保有証明によって通信相手のなりすましに対抗する。[認証局](/ja/glossary/certificate-authority/)が侵害された場合、クライアントが影響を受けた認証局を引き続き受け入れると、認証が損なわれる可能性がある。その結果、暗号化が攻撃者を通信相手とする接続を保護する場合がある。
