---
title: 도메인 하이재킹
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 공격자가 도메인 등록기관 계정 또는 등록 정보에 대한 무단 접근 권한을 획득하여 도메인을 탈취하는 행위.
keywords: ['도메인 하이재킹', '계정 탈취', '도메인 도용', '등록기관 보안', '무단 이전']
level: 1
sources:
  - https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en
relatedArticles:
  - /ko/blog/how-domain-hijacking-actually-happens/
  - /ko/blog/domain-flipping-and-the-law/
  - /ko/blog/the-perl-com-domain-theft/
  - /ko/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ko/blog/the-panix-com-domain-hijack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/domain-theft/
  - /ko/glossary/registrar/
  - /ko/glossary/registry-lock/
  - /ko/glossary/phishing/
  - /ko/glossary/transfer-lock/
---

**도메인 하이재킹**이란 공격자가 도메인 소유자의 [등록기관](/ko/glossary/registrar/) 계정을 장악하여 해당 도메인을 무단으로 탈취하는 행위를 말합니다. 주요 공격 수단으로는 [피싱](/ko/glossary/phishing/), 크리덴셜 스터핑(유출된 로그인 정보를 자동으로 대입하는 기법), 그리고 등록기관 고객지원 직원을 대상으로 한 사회공학적 기법이 있습니다. 공격자가 계정 접근에 성공하면 네임서버를 변경하여 트래픽을 리디렉션하거나, [레지스트리 잠금](/ko/glossary/registry-lock/) 보호 설정을 해제하거나, 도메인 이전을 개시하여 합법적인 소유자를 완전히 차단할 수 있습니다. 이러한 이유로 도메인 하이재킹은 명백한 [도메인 도용](/ko/glossary/domain-theft/)과 상당 부분 겹치는 경우가 많습니다. 피해를 예방하기 위해서는 [이전 잠금](/ko/glossary/transfer-lock/)을 활성화하고, 하드웨어 키 기반 2단계 인증을 사용하며, 고가 도메인의 경우 레지스트리 수준의 잠금 서비스에 가입하고, 등록기관에 등록된 연락처 정보를 최신 상태로 유지하여 복구 이메일이 정상적으로 수신될 수 있도록 해야 합니다.
