---
title: 서브도메인
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 도메인 앞에 접두사를 붙여 별도의 주소를 만드는 방식으로, blog.example.com이나 app.example.com 같은 형태가 이에 해당합니다.
keywords: ['서브도메인', '호스트', 'blog.example.com', 'DNS', '2차 도메인']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/glossary/what-is-a-subdomain/
relatedArticles:
  - /ko/blog/how-domain-hijacking-actually-happens/
  - /ko/blog/what-is-a-tld/
  - /ko/blog/domain-hacks-explained/
  - /ko/blog/domain-terminology-guide/
  - /ko/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/tld/
  - /ko/glossary/registrar/
  - /ko/glossary/registry/
  - /ko/glossary/domain-forwarding/
---

**서브도메인**은 도메인 앞에 접두사를 붙여 그 아래에 독립된 주소를 만드는 방식입니다. `blog.example.com`, `app.example.com`, `mail.example.com`은 모두 `example.com`의 서브도메인에 해당합니다. 서브도메인을 생성하려면 상위 도메인의 [네임서버](/ko/glossary/nameserver/)에서 [DNS 레코드](/ko/glossary/dns-record-types/)(보통 A 레코드 또는 CNAME)를 추가하면 되며, 별도의 등록 절차나 비용은 필요하지 않습니다. 서브도메인을 활용하면 하나의 등록된 도메인 이름으로 여러 서비스를 운영할 수 있어, 웹사이트·앱·API 구축의 기본 단위로 널리 쓰입니다.
