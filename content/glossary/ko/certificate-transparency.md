---
title: "인증서 투명성"
date: '2026-10-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "인증서 투명성은 공개 로그로 TLS 인증서 발급 내역을 드러내 독립적인 모니터링과 감사를 지원한다."
keywords: ["인증서 투명성", "CT", "TLS 인증"]
also_known_as: ["CT"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc9162#section-1
  - https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/
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
  - /ko/glossary/caa/
---

**인증서 투명성**은 **CT**라고도 하며, TLS 인증서를 추가만 가능한 공개 로그에 기록한다. 도메인 운영자와 다른 모니터링 주체는 로그에서 [인증 기관](/ko/glossary/certificate-authority/)의 예기치 않은 발급을 확인할 수 있다. 클라이언트 정책은 인증서를 수용하기 전에 로그 기록 증거를 요구할 수 있다. 로그 기록만으로 부정 발급을 막거나 인증서를 폐지할 수는 없다. 클라이언트의 정책 강제와 모니터링은 서로 다른 보호를 제공한다. CT는 [CAA](/ko/glossary/caa/)를 보완한다. CAA는 발급 전에 발급자 권한을 규정하고, CT는 발급 후 기록된 인증서를 공개하여 검사를 가능하게 한다.
