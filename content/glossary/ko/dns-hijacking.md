---
title: DNS 하이재킹
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 도메인 등록 정보가 아닌 DNS 확인 과정을 조작하여 트래픽을 다른 곳으로 우회시키는 공격 방식입니다.
keywords: ['DNS 하이재킹', '캐시 포이즈닝', 'DNS 스푸핑', 'DNSSEC', '트래픽 우회']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/dns-cache-poisoning/
relatedArticles:
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-sea-turtle-dns-espionage/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-dnspionage-campaign/
  - /ko/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-investor-field-guide/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/registrar/
  - /ko/glossary/bgp-hijack/
  - /ko/glossary/registry/
  - /ko/glossary/urs/
---

**DNS 하이재킹**(DNS 스푸핑 또는 캐시 포이즈닝이라고도 합니다)은 도메인 등록 자체가 아닌 DNS 확인 계층을 공격합니다. 공격자는 [레지스트라](/ko/glossary/registrar/)에서 도메인을 탈취하는 대신, [DNS 리졸버](/ko/glossary/dns-resolver/)나 [네임서버](/ko/glossary/nameserver/)가 도메인의 목적지로 인식하는 정보를 변조하여 방문자를 악의적인 IP 주소로 은밀하게 유도합니다. 캐시 포이즈닝 공격에서는 위조된 DNS 응답이 재귀적 리졸버에 수락되어 TTL(Time To Live) 기간 동안 캐시에 저장되며, 해당 리졸버를 이용하는 모든 사용자가 잘못된 경로로 안내됩니다. 이 과정에서 권위 있는 [DNS](/ko/glossary/dns/) 레코드에는 아무런 변화도 나타나지 않습니다. 주요 기술적 대응책은 [DNSSEC](/ko/glossary/dnssec/)으로, DNS 응답에 암호학적 서명을 적용하여 리졸버가 변조 여부를 탐지할 수 있게 합니다. 전통적인 [도메인 탈취](/ko/glossary/domain-theft/)와 달리, DNS 하이재킹은 소유권 등록 정보를 그대로 유지하기 때문에 도메인이 실제로 어디로 연결되는지 능동적으로 모니터링하지 않으면 탐지하기가 어렵습니다.
