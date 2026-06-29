---
title: DNS 레코드 유형 (A, AAAA, CNAME, MX, TXT)
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 도메인을 주소 및 서비스에 매핑하는 존(zone) 내 항목 — A, AAAA, CNAME, MX, TXT 등.
keywords: ['DNS 레코드', 'A 레코드', 'AAAA 레코드', 'CNAME', 'MX 레코드', 'TXT 레코드']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/dns-records/
relatedArticles:
  - /ko/blog/dns-on-tokenized-domains/
  - /ko/blog/how-domain-hijacking-actually-happens/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/the-dnspionage-campaign/
  - /ko/blog/what-are-tokenized-domains/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/registrar/
  - /ko/glossary/tld/
  - /ko/glossary/icann/
  - /ko/glossary/registry/
---

**DNS 레코드 유형**은 도메인 존(zone) 내의 개별 항목으로, [DNS](/ko/glossary/dns/)가 각기 다른 종류의 트래픽을 어디로 전달할지 지시합니다. 주요 유형은 다음과 같습니다. **A** 레코드는 도메인 이름을 IPv4 [IP 주소](/ko/glossary/ip-address/)에 매핑하고, **AAAA** 레코드는 IPv6 주소에 매핑합니다. **CNAME**은 하나의 이름을 다른 이름의 별칭으로 지정하고, **MX**는 이메일 트래픽을 라우팅하며, **TXT**는 SPF, DKIM, 도메인 인증 등에 활용되는 자유 형식의 텍스트를 저장합니다. 이러한 레코드는 도메인을 위임받은 [네임서버](/ko/glossary/nameserver/)에 의해 게시되며, 실제로 웹사이트가 로드되거나 메일이 전달될 수 있도록 하는 핵심 요소입니다.
