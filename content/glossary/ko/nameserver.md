---
title: 네임서버 (NS 레코드)
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 도메인의 DNS 쿼리에 응답하는 서버로, NS 레코드는 해당 도메인에 대한 권한 있는 서버를 지정합니다.
keywords: ['네임서버', 'NS 레코드', '권한 있는 서버', 'DNS 위임', 'DNS 호스팅']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/dns-server-types/
relatedArticles:
  - /ko/blog/how-domain-hijacking-actually-happens/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/dns-on-tokenized-domains/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/the-dnspionage-campaign/
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
  - /ko/glossary/tld/
  - /ko/glossary/zone-file/
---

**네임서버**는 도메인의 [DNS](/ko/glossary/dns/) 쿼리에 응답하는 서버이며, 도메인 [레지스트리](/ko/glossary/registry/)에 등록된 **NS 레코드**는 해당 도메인에 대해 권한 있는 네임서버를 지정합니다. 도메인을 DNS 호스트(Cloudflare, Route 53, [레지스트라](/ko/glossary/registrar/) 자체 DNS 등)로 연결할 때 설정하는 것이 바로 네임서버입니다. 지정된 네임서버는 트래픽과 메일을 라우팅하는 A, MX, TXT 등의 [레코드 유형](/ko/glossary/dns-record-types/)을 게시합니다.
