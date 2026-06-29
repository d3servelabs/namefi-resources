---
title: 전송 잠금
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 명시적으로 잠금을 해제하기 전까지 도메인이 다른 레지스트라로 이전되는 것을 차단하는 상태입니다.
keywords: ['전송 잠금', '레지스트라 잠금', '도메인 보안', 'EPP 상태', '도메인 이전']
also_known_as: ['레지스트라 잠금']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /ko/blog/the-panix-com-domain-hijack/
  - /ko/blog/how-to-sell-a-domain-name-you-own/
  - /ko/blog/how-tokenization-changes-domain-flipping/
  - /ko/blog/avoiding-domain-sale-scams/
  - /ko/blog/working-with-domain-brokers/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-investing/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/domain-apocalypse/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/domain-hijacking/
  - /ko/glossary/cross-registrar-transfer/
  - /ko/glossary/epp/
  - /ko/glossary/registry-lock/
---

**전송 잠금**(레지스트라 잠금이라고도 하며, EPP 상태 코드 `clientTransferProhibited`에 해당)은 [레지스트라](/ko/glossary/registrar/)가 설정하는 플래그로, 잠금이 명시적으로 해제되기 전까지 도메인을 다른 레지스트라로 이전하지 못하도록 차단합니다. 잠금이 활성화된 상태에서는 [크로스 레지스트라 이전](/ko/glossary/cross-registrar-transfer/)을 시작하려는 모든 시도가 거부됩니다. 요청자가 [인증 코드](/ko/glossary/auth-code/)를 보유하고 있더라도 마찬가지입니다. 전송 잠금은 [도메인 탈취](/ko/glossary/domain-hijacking/)에 대한 가장 단순하면서도 효과적인 방어 수단 중 하나입니다. 계정이 침해된 경우에도 잠금이 활성화되어 있는 한, 공격자는 해당 도메인 자산을 조용히 빼돌릴 수 없습니다. 모범 사례로는 전송 잠금을 항상 활성화 상태로 유지하고, 정당한 이전을 완료하는 데 필요한 짧은 시간 동안만 잠금을 해제하는 것이 권장됩니다.
