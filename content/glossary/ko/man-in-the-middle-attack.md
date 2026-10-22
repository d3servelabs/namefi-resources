---
title: "중간자 공격"
date: '2026-10-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "중간자 공격은 공격자가 통신 당사자 사이에 개입하여 통신을 가로채거나 변경하는 공격이다."
keywords: ["중간자 공격", "MITM", "TLS 인증"]
also_known_as: ["MITM", "경로상 공격"]
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4949
  - https://datatracker.ietf.org/doc/html/rfc8446#section-1
relatedArticles:
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-curve-finance-dns-hijack/
  - /ko/blog/dns-on-tokenized-domains/
  - /ko/blog/dnssec-for-domain-owners/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/certificate-authority/
  - /ko/glossary/intermediate-ca/
  - /ko/glossary/dane/
  - /ko/glossary/caa/
  - /ko/glossary/certificate-transparency/
---

**중간자 공격**은 **MITM** 또는 **경로상 공격**이라고도 하며, 공격자가 통신 당사자 사이에 개입하는 공격이다. 당사자들은 직접 통신한다고 생각할 수 있지만, 공격자는 통신을 가로채거나 중계하거나 변경한다. [DNS 하이재킹](/ko/glossary/dns-hijacking/)은 연결을 공격자에게 돌릴 수 있다. HTTPS는 일반적으로 인증서 검증과 개인 키 보유 증명을 통해 통신 상대 사칭에 대응한다. [인증 기관](/ko/glossary/certificate-authority/)이 침해된 경우, 클라이언트가 영향받은 인증 기관을 계속 수용하면 인증이 무력화될 수 있다. 이때 암호화는 공격자를 종단으로 하는 연결을 보호할 수 있다.
