---
title: "인증 기관"
date: '2026-10-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "인증 기관은 신원과 공개 키를 연결하는 디지털 인증서를 발급한다."
keywords: ["인증 기관", "CA", "TLS 인증"]
also_known_as: ["CA", "인증서 발급 기관"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-3.2
  - https://www.rfc-editor.org/rfc/rfc8659#section-2.2
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
  - /ko/glossary/intermediate-ca/
  - /ko/glossary/man-in-the-middle-attack/
  - /ko/glossary/dane/
  - /ko/glossary/caa/
  - /ko/glossary/certificate-transparency/
---

**인증 기관**은 **인증서 발급 기관** 또는 **CA**라고도 하며, 신원과 [공개 키](/ko/glossary/public-key/)를 연결하는 디지털 인증서를 발급한다. 공개적으로 신뢰받는 TLS CA는 웹사이트 인증서에 서명하기 전에 도메인 제어권과 적용되는 신원 확인 요건을 검사한다. 클라이언트는 신뢰하는 루트를 기준으로 인증서 체인을 검증하고, 서버가 해당 개인 키를 보유했다는 증명을 확인한다. CA는 [중간 인증 기관](/ko/glossary/intermediate-ca/)에 서명 권한을 위임할 수 있다. CA에 대한 신뢰는 클라이언트 정책에 따라 신원을 인증한다. CA에 대한 신뢰가 웹사이트 콘텐츠의 정직성을 보장하지는 않는다.
