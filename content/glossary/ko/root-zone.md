---
title: 루트 존 (루트 서버)
date: '2026-06-22'
language: ko
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 모든 TLD와 해당 TLD에 대한 권한 있는 서버 목록을 포함하는 DNS 계층 구조의 최상위 영역입니다.
keywords: ['루트 존', '루트 서버', 'DNS 계층 구조', 'TLD 위임', 'IANA']
level: 1
sources:
  - https://www.iana.org/domains/root
  - https://www.iana.org/domains/root/servers
relatedArticles:
  - /ko/blog/what-is-a-tld/
  - /ko/blog/premium-web3-tlds/
  - /ko/blog/the-malaysia-airlines-dns-hijack/
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /ko/topics/choosing-a-tld/
  - /ko/topics/domain-security/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/tld/
  - /ko/glossary/dns/
  - /ko/glossary/registry/
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
---

**루트 존**은 [DNS](/ko/glossary/dns/) 계층 구조의 최상위에 위치하며, 모든 [TLD](/ko/glossary/tld/)와 각 TLD에 대해 권한을 갖는 [레지스트리](/ko/glossary/registry/) 서버 목록을 담고 있는 마스터 데이터베이스입니다. 루트 존은 **루트 서버**를 통해 서비스되는데, 루트 서버는 전 세계에 분산된 시스템으로 구성되며 13개의 명명된 주소에서 접근할 수 있습니다. 루트 존의 내용은 [IANA](/ko/glossary/iana/)가 관리합니다. 캐시에 없는 모든 도메인 조회는 이곳에서 시작됩니다. [리졸버](/ko/glossary/dns-resolver/)가 루트에 `.com`을 어디서 찾아야 하는지 질의하면, 그 응답을 따라 계층 구조를 아래로 순서대로 따라가게 됩니다.
