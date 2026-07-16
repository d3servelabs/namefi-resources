---
title: 도메인 포워딩
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 방문자를 한 도메인에서 다른 주소로 자동 전송하는 설정으로, 주로 301 리디렉션 방식을 사용합니다.
keywords: ['도메인 포워딩', '301 리디렉션', 'URL 리디렉션', 'DNS', '도메인 관리']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
relatedArticles:
  - /ko/blog/how-domain-hijacking-actually-happens/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/from-twitter-com-to-x-com/
  - /ko/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-investing/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/301-redirect/
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
---

**도메인 포워딩**(URL 포워딩 또는 *301 리디렉션*이라고도 합니다)은 특정 도메인에 접속한 모든 방문자를 다른 목적지 URL로 자동 전송하는 설정입니다. [301 리디렉션](/ko/glossary/301-redirect/) 방식은 검색 엔진에 해당 이전이 영구적임을 알려, 원본 도메인이 보유한 링크 에퀴티(link equity)의 대부분을 대상 도메인으로 이전합니다. 이러한 특성 덕분에 브랜드를 통합하거나 트래픽을 마이그레이션할 때 가장 선호되는 방식입니다. 포워딩은 레지스트라 제어판에서 직접 설정하거나, 리디렉션 규칙을 적용하는 웹 서버를 가리키는 [DNS 레코드 유형](/ko/glossary/dns-record-types/)을 지정하는 방식으로 구성합니다. 대표적인 활용 사례로는 일치하는 [서브도메인](/ko/glossary/subdomain/)이나 오타 변형 도메인을 구매하여 본 사이트로 포워딩함으로써 이탈 트래픽을 흡수하는 것을 들 수 있습니다. 도메인 포워딩은 완전한 DNS 위임과는 구별됩니다. 도메인은 여전히 DNS를 통해 해석되지만, HTTP 수준의 지시를 통해 브라우저를 다른 주소로 안내합니다.
