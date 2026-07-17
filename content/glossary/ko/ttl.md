---
title: TTL (Time to Live)
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: DNS 레코드를 리졸버가 캐시할 수 있는 시간(초 단위)으로, 이 시간이 지나면 다시 조회해야 합니다.
keywords: ['TTL', 'time to live', 'DNS 캐시', 'DNS 전파', '레코드 캐싱']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
relatedArticles:
  - /ko/blog/the-panix-com-domain-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-sushiswap-miso-insider-attack/
  - /ko/blog/working-with-domain-brokers/
  - /ko/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-investing/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/dns-propagation/
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/registry/
---

**TTL(Time to Live)**은 모든 [DNS 레코드](/ko/glossary/dns-record-types/)에 초 단위로 부여되는 값으로, [리졸버](/ko/glossary/dns-resolver/)가 해당 응답을 얼마나 오래 캐시할 수 있는지를 나타냅니다. TTL이 짧으면(예: 300초) 변경 사항이 빠르게 반영되지만 조회 횟수가 늘어나고, TTL이 길면(86,400초 = 하루) 효율적이지만 업데이트된 내용이 캐시에 오래 남게 됩니다. 변경 작업 하루 전에 TTL을 낮춰두는 것이 빠른 [DNS 전파](/ko/glossary/dns-propagation/)를 위한 표준적인 방법입니다.
