---
title: DNS 전파
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: DNS 변경 후 전 세계 리졸버에 캐시된 구 레코드가 만료되기까지 해당 변경이 인터넷 전체에 반영되기 전의 지연 시간입니다.
keywords: ['DNS 전파', 'DNS 업데이트 지연', 'TTL', 'DNS 캐시', '네임서버 변경']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
  - https://datatracker.ietf.org/doc/html/rfc1035
relatedArticles:
  - /ko/blog/the-curve-finance-dns-hijack/
  - /ko/blog/the-malaysia-airlines-dns-hijack/
  - /ko/blog/the-perl-com-domain-theft/
  - /ko/blog/dns-on-tokenized-domains/
  - /ko/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/ttl/
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/registry/
---

**DNS 전파**란 [DNS](/ko/glossary/dns/) 변경을 적용한 시점부터 그 변경이 인터넷 전체에 실제로 반영되기까지의 지연 시간을 말합니다. 전 세계의 [리졸버](/ko/glossary/dns-resolver/)가 이전 응답을 캐시에 저장해 두었다가 해당 [TTL](/ko/glossary/ttl/)이 만료될 때까지 유지하기 때문에, 새로운 [레코드](/ko/glossary/dns-record-types/)나 [네임서버](/ko/glossary/nameserver/) 업데이트는 즉시 반영되지 않고 수 분에서 최대 이틀에 걸쳐 점진적으로 퍼져나갑니다. 한꺼번에 갱신할 수 있는 전 세계 공통의 단일 DNS 시스템은 존재하지 않으며, 전파란 결국 각 캐시가 순차적으로 만료되는 과정에 불과합니다. 계획된 변경에 앞서 TTL을 미리 낮춰 두는 것이 현실적인 해결책입니다.
