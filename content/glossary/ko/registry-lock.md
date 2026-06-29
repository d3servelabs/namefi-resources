---
title: 레지스트리 잠금
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 레지스트리가 도메인을 동결하여 변경 사항을 수동 대역 외 승인을 통해서만 처리할 수 있도록 하는 고보안 서비스입니다.
keywords: ['레지스트리 잠금', '도메인 잠금', '고보안 잠금', '도메인 탈취 방지', '대역 외 인증']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /ko/blog/the-syrian-electronic-army-nyt-hijack/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-sea-turtle-dns-espionage/
  - /ko/blog/how-domain-hijacking-actually-happens/
  - /ko/blog/the-malaysia-airlines-dns-hijack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/registry/
  - /ko/glossary/dns/
  - /ko/glossary/domain-hijacking/
  - /ko/glossary/transfer-lock/
---

**레지스트리 잠금**은 [레지스트리](/ko/glossary/registry/)가 제공하는 프리미엄 보안 서비스로, 도메인을 [네임서버](/ko/glossary/nameserver/) 변경, 이전, 삭제를 포함한 어떠한 수정도 일반 자동화 EPP 채널을 통해 처리할 수 없는 상태로 고정합니다. 모든 변경은 레지스트라와 레지스트리 간의 전화 통화, 암호화 토큰, 또는 대면 신원 확인을 포함하는 수동 대역 외 인증 절차를 거쳐야만 처리할 수 있습니다. 이는 [레지스트라](/ko/glossary/registrar/)가 자체 시스템을 통해 제어하고 직접 토글할 수 있는 일반적인 [이전 잠금](/ko/glossary/transfer-lock/)과는 구별되는 개념입니다. 레지스트리 잠금은 보호 수준을 레지스트리 계층까지 높여, 공격자가 레지스트라 계정에 완전히 접근하더라도 무단 변경이 극히 어렵도록 만듭니다. 이 서비스는 고가치 도메인을 [도메인 탈취](/ko/glossary/domain-hijacking/)로부터 보호하기 위해 금융 기관, 대형 브랜드, 핵심 인프라 운영자들이 주로 활용합니다.
