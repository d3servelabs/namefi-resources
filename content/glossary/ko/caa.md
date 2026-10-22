---
title: "CAA"
date: '2026-10-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "CAA 레코드는 도메인이 인증서 발급을 허용하는 인증 기관을 지정한다."
keywords: ["CAA", "인증 기관 권한 부여", "TLS 인증"]
also_known_as: ["인증 기관 권한 부여"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc8659#section-1
  - https://www.rfc-editor.org/rfc/rfc8659#section-5
  - https://letsencrypt.org/docs/caa/
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
  - /ko/glossary/dane/
  - /ko/glossary/certificate-transparency/
---

**CAA**는 **인증 기관 권한 부여**의 약어로, 도메인이 인증서 발급을 허용하는 [인증 기관](/ko/glossary/certificate-authority/)을 지정하는 DNS 레코드다. 규격을 준수하는 CA는 발급 전에 적용되는 CAA 레코드를 확인한다. [DNSSEC (도메인 네임 시스템 보안 확장)](/ko/glossary/dnssec/)은 정책을 담은 DNS 응답의 진위를 검증할 수 있다. CAA는 규격을 준수하는 절차에서 의도하지 않은 발급을 줄인다. CAA는 브라우저가 다른 발급자의 인증서를 거부하게 하거나, 기존 인증서를 폐지하거나, 침해된 CA 서명 키로 직접 인증서를 위조하는 사람을 막지 않는다. CAA는 발급자 권한을 지정하며, 도메인 검증은 별도 요건으로 남는다.
