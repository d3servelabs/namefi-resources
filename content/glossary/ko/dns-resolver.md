---
title: DNS 리졸버 (재귀 리졸버)
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 도메인 조회 요청을 받아 DNS 계층 구조를 탐색하여 해당 주소를 반환하는 서버입니다.
keywords: ['DNS 리졸버', '재귀 리졸버', '리졸버', '8.8.8.8', '1.1.1.1', 'DNS 조회']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/what-is-a-dns-resolver/
relatedArticles:
  - /ko/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /ko/blog/the-dyn-dns-mirai-attack/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/tokenized-domain-vs-web3-domain/
  - /ko/blog/premium-web3-tlds/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/tld/
  - /ko/glossary/urs/
  - /ko/glossary/registry/
  - /ko/glossary/registrar/
---

**DNS 리졸버**(또는 *재귀 리졸버*)는 도메인을 [IP 주소](/ko/glossary/ip-address/)로 변환해야 할 때 장치가 쿼리를 보내는 서버입니다. `1.1.1.1`(Cloudflare)이나 `8.8.8.8`(Google) 같은 공개 리졸버가 실제 탐색을 수행합니다. [루트 존](/ko/glossary/root-zone/)에서 출발하여 [DNS](/ko/glossary/dns/) 계층 구조를 따라 해당 도메인의 권한 있는 [네임서버](/ko/glossary/nameserver/)까지 내려가며 쿼리하고, 얻은 응답을 해당 [TTL](/ko/glossary/ttl/) 동안 캐시합니다. 이것이 바로 "이름을 입력하면 바로 사이트에 도달한다"는 경험을 가능하게 하는 DNS의 핵심 요소입니다.
