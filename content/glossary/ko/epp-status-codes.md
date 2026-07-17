---
title: EPP 상태 코드
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 도메인의 현재 상태를 나타내는 표준화된 플래그로, 잠금, 보류, 이전 대기 등 허용 가능한 작업을 정의합니다.
keywords: ['EPP 상태 코드', 'clientHold', 'serverTransferProhibited', '도메인 상태', '삭제 대기']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /ko/blog/expired-domains-and-the-drop-cycle/
  - /ko/blog/domain-backorders-and-drop-catching/
  - /ko/blog/how-to-sell-a-domain-name-you-own/
  - /ko/blog/the-panix-com-domain-hijack/
  - /ko/blog/working-with-domain-brokers/
relatedTopics:
  - /ko/topics/domain-investing/
  - /ko/topics/domain-security/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/domain-apocalypse/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/epp/
  - /ko/glossary/registry/
  - /ko/glossary/dns/
  - /ko/glossary/transfer-lock/
---

**EPP 상태 코드**는 확장 프로비저닝 프로토콜([EPP](/ko/glossary/epp/))이 정의하는 머신 가독형 플래그로, 특정 시점에 도메인에 허용되는 작업을 정확히 나타냅니다. 코드는 두 개의 네임스페이스로 구분됩니다. `client*` 코드는 [등록대행자](/ko/glossary/registrar/)가 설정하고, `server*` 코드는 [등록기관](/ko/glossary/registry/)이 설정하며, 서버 코드가 우선합니다. 주요 코드로는 `clientTransferProhibited`(외부 이전을 차단하는 [이전 잠금](/ko/glossary/transfer-lock/)), `serverDeleteProhibited`(등록기관 수준의 삭제 방지), `clientHold`(주로 미납을 이유로 DNS 해석을 일시 정지), 그리고 도메인이 재등록 가능 상태로 반환되기 전의 [유예 기간](/ko/glossary/grace-period/)에 있음을 표시하는 `pendingDelete`가 있습니다. 이 상태는 [삭제 대기](/ko/glossary/pending-delete/) 상태와 인접합니다. 이 코드를 이해하는 것은 실무적으로 중요합니다. `serverTransferProhibited`가 설정된 도메인은 등록대행자가 잠금을 해제하더라도 이전이 불가능하므로, 거래 중에 구매자가 예상치 못한 상황에 처할 수 있습니다.
