---
title: "DANE"
date: '2026-10-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "DANE는 DNSSEC로 보호하는 TLSA 레코드의 인증서 또는 키 연결 정보를 통해 TLS 서비스를 인증한다."
keywords: ["DANE", "DNS 기반 명명된 개체 인증", "TLS 인증"]
also_known_as: ["DNS 기반 명명된 개체 인증"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc6698#section-2
  - https://www.rfc-editor.org/rfc/rfc7671#section-5.1
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
  - /ko/glossary/man-in-the-middle-attack/
  - /ko/glossary/caa/
  - /ko/glossary/certificate-transparency/
---

**DANE**는 **DNS 기반 명명된 개체 인증**의 약어로, TLSA 레코드를 사용하여 TLS 서비스를 인증서, 공개 키 또는 신뢰 앵커와 연결한다. [DNSSEC (도메인 네임 시스템 보안 확장)](/ko/glossary/dnssec/)은 DNS 데이터의 진위를 검증한다. DANE를 지원하는 클라이언트는 TLS 인증 과정에서 연결 조건을 강제한다. 선택한 용도에 따라 DANE는 공개적으로 신뢰받는 [인증 기관](/ko/glossary/certificate-authority/)을 제한하거나, 공개 CA 신뢰와 독립적으로 서비스를 인증할 수 있다. TLSA 레코드를 게시하는 것만으로 DANE를 무시하는 클라이언트를 보호할 수는 없다. 운영자는 키 변경과 TLSA 업데이트를 조율하고 DNSSEC 검증을 유지해야 한다.
