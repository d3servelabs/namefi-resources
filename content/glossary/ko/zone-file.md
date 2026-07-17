---
title: 존 파일 (글루 레코드)
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 도메인의 모든 DNS 레코드(네임서버를 위한 글루 레코드 포함)를 저장하는 텍스트 파일입니다.
keywords: ['존 파일', '글루 레코드', 'DNS 존', '권한 레코드', '네임서버']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/dns-zone/
relatedArticles:
  - /ko/blog/how-domain-hijacking-actually-happens/
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/dns-on-tokenized-domains/
  - /ko/blog/the-dnspionage-campaign/
  - /ko/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/registry/
  - /ko/glossary/registrar/
  - /ko/glossary/tld/
  - /ko/glossary/icann/
---

**존 파일(zone file)**은 도메인의 권한 [네임서버](/ko/glossary/nameserver/)에 저장된 텍스트 파일로, 해당 도메인의 동작 방식을 정의하는 A, MX, TXT 등 모든 [DNS 레코드](/ko/glossary/dns-record-types/)를 담고 있습니다. **글루 레코드(glue record)**는 특수한 경우입니다. 도메인의 네임서버가 *해당 도메인 자체 하위에* 위치할 경우(예: `ns1.example.com`이 `example.com`을 서비스하는 경우), 상위 [레지스트리](/ko/glossary/registry/)는 순환 조회 문제를 방지하기 위해 상위 존에 네임서버의 [IP 주소](/ko/glossary/ip-address/)를 직접 게시해야 합니다. 존 파일을 편집하는 것이 도메인의 [DNS](/ko/glossary/dns/)를 설정하는 방법입니다.
