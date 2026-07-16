---
title: IDN (국제화 도메인 이름) / Punycode
date: '2026-06-22'
language: ko
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 비ASCII 문자를 사용하는 도메인으로, DNS에서 xn--로 시작하는 ASCII Punycode로 인코딩되어 처리됩니다.
keywords: ['IDN', '국제화 도메인 이름', 'Punycode', 'xn--', '유니코드 도메인', '호모그래프']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5890
  - https://www.icann.org/resources/pages/idn-2012-02-25-en
relatedArticles:
  - /ko/blog/what-is-a-tld/
  - /ko/blog/from-discordapp-com-to-discord-com/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/cybersquatting-vs-domaining-udrp-acpa/
  - /ko/blog/domain-hacks-explained/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-investing/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/domain-apocalypse/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/registry/
  - /ko/glossary/tld/
  - /ko/glossary/dns/
  - /ko/glossary/phishing/
---

**IDN(국제화 도메인 이름, Internationalized Domain Name)**은 `münchen.de`, `中国.cn`, 이모지 도메인처럼 비ASCII 문자를 사용하는 도메인으로, 기본 라틴 문자 이외의 문자 체계로도 도메인 이름을 표기할 수 있게 합니다. [DNS](/ko/glossary/dns/) 자체는 ASCII만 처리하므로, IDN은 **Punycode**라는 ASCII 호환 문자열로 인코딩되며 항상 `xn--` 접두어로 시작합니다(예: `münchen` → `xn--mnchen-3ya`). [레지스트리](/ko/glossary/registry/)와 [레지스트라](/ko/glossary/registrar/)는 [TLD](/ko/glossary/tld/) 수준에서 IDN을 지원하지만, 시각적으로 유사한 문자를 악용한 *호모그래프* 모방 도메인이 [피싱](/ko/glossary/phishing/)에 사용될 수 있다는 알려진 위험이 있습니다.
