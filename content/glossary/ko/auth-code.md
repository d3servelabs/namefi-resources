---
title: 인증 코드 (EPP 코드, 이전 코드)
date: '2026-05-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 레지스트라가 도메인을 다른 레지스트라로 이전하는 것을 승인하기 위해 발급하는 도메인별 단일 비밀 코드로, EPP 코드 또는 이전 코드라고도 합니다.
keywords: ['인증 코드', 'EPP 코드', '이전 코드', '도메인 이전', '승인 코드', 'AuthInfo 코드']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
relatedArticles:
  - /ko/blog/domain-escrow-explained/
  - /ko/blog/how-to-sell-a-domain-name-you-own/
  - /ko/blog/how-tokenization-changes-domain-flipping/
  - /ko/blog/the-panix-com-domain-hijack/
  - /ko/blog/how-to-tokenize-your-com/
relatedTopics:
  - /ko/topics/domain-tokenization/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-investor-field-guide/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/registry/
  - /ko/glossary/dns/
  - /ko/glossary/cross-registrar-transfer/
  - /ko/glossary/epp/
---

**인증 코드(auth code)**는 **EPP 코드**, **AuthInfo 코드**, 또는 **이전 코드(transfer code)**라고도 불리며, [레지스트라](/ko/glossary/registrar/)가 특정 도메인에 대해 발급하는 단일 공유 비밀 코드입니다. 이 코드는 [레지스트라 간 이전](/ko/glossary/cross-registrar-transfer/)을 승인하는 데 사용됩니다. EPP(Extensible Provisioning Protocol)는 레지스트리의 기반이 되는 표준 프로토콜이며, 인증 코드는 그 안에서 도메인별로 부여되는 자격 증명입니다. 도메인을 한 레지스트라에서 다른 레지스트라로 이전하려면, 수신 레지스트라는 [등록자](/ko/glossary/registrant/)가 기존 레지스트라로부터 받은 유효한 인증 코드를 제출해야 합니다. 이 코드는 보통 레지스트라의 관리 패널에서 확인할 수 있으며, "도메인 이전" 또는 "EPP 코드 받기" 버튼 뒤에 숨겨져 있는 경우도 있습니다. [토큰화된 도메인](/ko/blog/what-are-tokenized-domains/)의 경우, [온체인](/ko/glossary/on-chain/) 소유권 이전에는 인증 코드가 **필요하지 않습니다** — [NFT](/ko/glossary/nft/) 이전은 블록체인상에서 원자적으로 처리됩니다. 인증 코드는 전통적인 [DNS](/ko/glossary/dns/) 환경에서 레지스트라 간에 도메인을 이동할 때만 필요합니다.
