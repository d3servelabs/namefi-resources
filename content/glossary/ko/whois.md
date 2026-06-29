---
title: WHOIS (및 RDAP)
date: '2026-05-22'
language: ko
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: WHOIS와 그 후속 프로토콜인 RDAP는 도메인의 등록 정보(등록 기관, 만료일 등)를 공개적으로 조회할 수 있는 서비스입니다.
keywords: ['WHOIS', 'RDAP', '도메인 등록 조회', '등록자 정보', '도메인 소유권 조회']
level: 1
sources:
  - https://www.icann.org/rdap
  - https://lookup.icann.org/
relatedArticles:
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/expired-domains-and-the-drop-cycle/
  - /ko/blog/how-domain-hijacking-actually-happens/
  - /ko/blog/what-is-udrp/
  - /ko/blog/cctld-market-share-by-registration-volume/
relatedTopics:
  - /ko/topics/domain-basics/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/icann/
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/whois-privacy/
  - /ko/glossary/registry/
---

**WHOIS**는 도메인의 등록 정보를 조회하기 위한 오래된 프로토콜이자 공개 서비스입니다. 등록 기관, 등록일 및 만료일, 그리고 과거에는 [등록자](/ko/glossary/registrant/)의 연락처 정보까지 확인할 수 있었습니다. 현대적인 후속 서비스는 **RDAP(Registration Data Access Protocol)**로, 구조화된 JSON 형식으로 데이터를 반환하며 [ICANN](/ko/glossary/icann/)과 레지스트리들이 이 프로토콜로 전환 중입니다. [토큰화된 도메인](/ko/blog/what-are-tokenized-domains/)의 경우에도 WHOIS/RDAP 레코드는 [등록 기관](/ko/glossary/registrar/) 수준에서 여전히 존재합니다. 기반이 되는 [DNS](/ko/glossary/dns/) 등록이 실질적이며 ICANN의 인정을 받기 때문입니다. 다만 *소유권 및 이전 메커니즘*만이 [온체인](/ko/glossary/on-chain/) 레이어로 이동합니다. 개인정보 보호 기능의 활용은 점점 보편화되고 있으며, GDPR과 같은 개인정보 보호법에 따라 많은 등록 기관이 기본적으로 개인 연락처 정보를 마스킹 처리합니다. 참고 자료: [ICANN WHOIS 조회](https://lookup.icann.org/).
