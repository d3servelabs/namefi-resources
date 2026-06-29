---
title: DNSSEC (도메인 네임 시스템 보안 확장)
date: '2026-05-22'
language: ko
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: DNS 레코드에 적용된 암호화 서명으로, 응답이 위조되거나 전송 중에 변조되지 않았음을 리졸버가 검증할 수 있게 합니다.
keywords: ['DNSSEC', 'DNS 보안', '도메인 보안', 'DS 레코드', '신뢰 체인', '암호화 DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4033
relatedArticles:
  - /ko/blog/dns-on-tokenized-domains/
  - /ko/blog/how-domain-hijacking-actually-happens/
  - /ko/blog/the-curve-finance-dns-hijack/
  - /ko/blog/the-dnspionage-campaign/
  - /ko/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/registrar/
  - /ko/glossary/registry/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
---

**DNSSEC (Domain Name System Security Extensions)** 는 [DNS](/ko/glossary/dns/) 프로토콜에 대한 암호화 확장 집합으로, 리졸버가 DNS 응답의 진위성과 무결성을 검증할 수 있게 합니다. DNSSEC가 없으면 공격자는 리졸버와 권한 있는 서버 사이의 경로에서 DNS 응답을 위조하거나 변조하여 사용자를 악성 인프라로 유도할 수 있습니다. DNSSEC를 사용하면 레코드에 서명이 적용되며, DS 레코드를 통해 DNS 루트에서 각 존을 거쳐 내려오는 신뢰 체인이 형성됩니다. DNSSEC는 [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) 및 관련 RFC에 명세되어 있습니다. 도메인을 토큰화해도 DNSSEC에는 아무런 변화가 없습니다. 신뢰 체인은 여전히 [레지스트라](/ko/glossary/registrar/)와 [레지스트리](/ko/glossary/registry/)를 통해 유지되며, DS 레코드도 동일한 방식으로 게시됩니다. 많은 DNS 제공업체(Cloudflare, Route53 등)는 DNSSEC를 활성화하면 존에 자동으로 서명합니다.
