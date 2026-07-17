---
title: WHOIS 개인정보 보호
date: '2026-06-22'
language: ko
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 공개 WHOIS 또는 RDAP 레코드에서 등록자의 개인 연락처 정보를 마스킹하는 서비스입니다.
keywords: ['WHOIS 개인정보 보호', '개인정보 보호', 'RDAP', '등록자 개인정보', '연락처 마스킹']
also_known_as: ['개인정보 보호 서비스']
level: 1
sources:
  - https://www.icann.org/rdap
relatedArticles:
  - /ko/blog/from-massdrop-com-to-drop-com/
  - /ko/blog/how-domain-hijacking-actually-happens/
  - /ko/blog/from-getdropbox-com-to-dropbox-com/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-investing/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/whois/
---

**WHOIS 개인정보 보호**(또는 개인정보 보호 서비스)는 대부분의 [등록대행자](/ko/glossary/registrar/)가 제공하는 서비스로, 공개 [WHOIS](/ko/glossary/whois/) 및 RDAP 레코드에서 [등록자](/ko/glossary/registrant/)의 실제 이름, 주소, 전화번호, 이메일 대신 프록시 연락처(일반적으로 등록대행자의 주소와 전달용 이메일)를 표시합니다. 이 서비스를 이용하지 않으면 해당 정보가 누구에게나 공개 조회되어, 도메인 소유자가 스팸, 사회공학적 공격, 그리고 등록대행자 계정 탈취를 노리는 표적형 [피싱](/ko/glossary/phishing/)의 대상이 될 수 있습니다. 2018년 이후 GDPR 시행으로 많은 레지스트리가 gTLD WHOIS에서 개인 정보를 기본적으로 비공개 처리하고 있으나, 보호 수준은 [TLD](/ko/glossary/tld/)와 등록대행자에 따라 다르므로 개인정보 보호 서비스를 명시적으로 활성화하는 것이 여전히 권장됩니다. 다만 개인정보 보호 서비스가 하지 못하는 것도 이해하는 것이 중요합니다. 이 서비스는 연락처 정보를 숨길 뿐이며, 기술적으로 능숙한 공격자가 [DNS](/ko/glossary/dns/) 열거나 인증서 투명성 로그를 활용해 도메인 인프라를 파악하는 것을 막지는 못합니다.
