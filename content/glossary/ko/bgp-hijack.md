---
title: BGP 하이재킹
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 허위 IP 경로 공지를 통해 인터넷 트래픽을 우회시키는 네트워크 계층 공격으로, DNS보다 하위 계층에서 작동합니다.
keywords: ['BGP 하이재킹', '경로 하이재킹', 'IP 프리픽스', '네트워크 보안', '인터넷 라우팅']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
relatedArticles:
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-dnspionage-campaign/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-sea-turtle-dns-espionage/
  - /ko/blog/how-domain-hijacking-actually-happens/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/dns-hijacking/
  - /ko/glossary/icann/
  - /ko/glossary/public-key/
  - /ko/glossary/web3/
---

**BGP 하이재킹**(Border Gateway Protocol 하이재킹)은 악의적이거나 잘못 구성된 자율 시스템(AS)이 허위 라우팅 공지를 브로드캐스트하여, 인터넷상의 다른 라우터들이 합법적인 [IP 주소](/ko/glossary/ip-address/)로 향해야 할 트래픽을 공격자의 인프라를 통해 전달하도록 유도하는 네트워크 계층 공격입니다. 이름-IP 매핑을 변조하는 [DNS 하이재킹](/ko/glossary/dns-hijacking/)과 달리, BGP 하이재킹은 라우팅 계층에서 작동하기 때문에 도메인의 DNS 레코드는 그대로 유지되며 [DNSSEC](/ko/glossary/dnssec/)도 이 공격에 대한 방어 수단을 제공하지 못합니다. 트래픽이 우회되면 공격자는 TLS 인증서 발급을 가로채거나(BGP 하이재킹은 HTTP 기반 도메인 유효성 검사를 사용하는 CA로부터 부정 인증서를 취득하는 데 악용된 사례가 있습니다), 암호화되지 않은 트래픽을 열람하거나, 중간자 공격을 수행할 수 있습니다. 대응 방안으로는 RPKI(Resource Public Key Infrastructure)를 통한 경로 출처 검증과, 예기치 않은 AS가 자신의 프리픽스를 공지할 때 경보를 발송하는 모니터링 서비스 활용 등이 있습니다.
