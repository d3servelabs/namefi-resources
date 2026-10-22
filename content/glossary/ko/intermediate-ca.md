---
title: "중간 인증 기관"
date: '2026-10-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "중간 인증 기관은 신뢰 앵커로 연결되는 인증서 체인을 통해 위임받은 인증서 서명 권한을 보유한다."
keywords: ["중간 인증 기관", "중간 CA", "TLS 인증"]
also_known_as: ["중간 CA"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-6
  - https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0
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
  - /ko/glossary/man-in-the-middle-attack/
  - /ko/glossary/dane/
  - /ko/glossary/caa/
  - /ko/glossary/certificate-transparency/
---

**중간 인증 기관**은 **중간 CA**라고도 하며, 다른 [인증 기관](/ko/glossary/certificate-authority/)이 인증서 체인을 통해 위임한 서명 권한을 보유한다. 인증서 체인은 보통 웹사이트 인증서를 신뢰하는 루트에 연결하며, 여러 중간 인증서를 거칠 수도 있다. 인증서 제약 조건은 위임된 권한을 제한한다. 중간 인증 기관의 [개인 키](/ko/glossary/private-key/)가 침해되면 공격자는 해당 권한 범위에서 인증서 서명을 위조할 수 있다. 클라이언트는 관련 신뢰 철회 또는 인증서 폐지 업데이트를 적용해야 한다. 웹사이트 인증서 하나를 교체해도 다른 클라이언트의 신뢰 판단에서 침해된 중간 키가 제외되지는 않는다.
