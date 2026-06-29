---
title: IP 주소 (IPv4 / IPv6)
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 네트워크상의 장치를 식별하는 숫자 주소로, DNS가 도메인 이름을 이 주소로 연결합니다.
keywords: ['IP 주소', 'IPv4', 'IPv6', 'A 레코드', 'AAAA 레코드', '네트워킹']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc791
  - https://www.cloudflare.com/learning/dns/glossary/what-is-my-ip-address/
relatedArticles:
  - /ko/blog/the-dnspionage-campaign/
  - /ko/blog/selling-domains-as-nfts/
  - /ko/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ko/blog/the-perl-com-domain-theft/
  - /ko/blog/the-sea-turtle-dns-espionage/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-investing/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/registrar/
  - /ko/glossary/web3/
---

**IP 주소**는 네트워크상의 장치를 식별하는 숫자 레이블입니다. 구형 **IPv4** 형식에서는 `93.184.216.34`와 같이 표기되며, **IPv6**에서는 `2606:2800:220:1:248:1893:25c8:1946`처럼 더 긴 16진수 문자열로 표현됩니다. IPv6는 전 세계적으로 IPv4 주소 공간이 고갈되면서 도입되었습니다. [DNS](/ko/glossary/dns/)의 핵심 역할은 사람이 읽기 쉬운 도메인 이름을 이러한 주소로 연결하는 것입니다. **A** [레코드](/ko/glossary/dns-record-types/)는 이름을 IPv4 주소에, **AAAA** 레코드는 IPv6 주소에 연결합니다. 주소 블록은 [IANA](/ko/glossary/iana/)를 통해 지역 레지스트리에 할당됩니다. 도메인 토큰화는 이 모든 구조보다 상위 계층에서 작동하며, 이름이 *가리키는* 주소가 아니라 이름의 *소유권*을 변경하는 것입니다.
