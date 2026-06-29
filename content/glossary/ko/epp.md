---
title: EPP
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 등록대행자가 레지스트리와 통신하여 도메인을 등록·관리할 때 사용하는 표준 프로토콜입니다.
keywords: ['EPP', 'Extensible Provisioning Protocol', '도메인 관리', '레지스트리 프로토콜', 'RFC 5730']
also_known_as: ['Extensible Provisioning Protocol']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5730
relatedArticles:
  - /ko/blog/the-panix-com-domain-hijack/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/expired-domains-and-the-drop-cycle/
  - /ko/blog/what-is-udrp/
  - /ko/blog/domain-escrow-explained/
relatedTopics:
  - /ko/topics/domain-basics/
  - /ko/topics/domain-security/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/registry/
  - /ko/glossary/epp-status-codes/
  - /ko/glossary/dns/
  - /ko/glossary/icann/
---

**EPP**(Extensible Provisioning Protocol)는 RFC 5730에서 정의된 XML 기반 명령 프로토콜로, [등록대행자](/ko/glossary/registrar/)가 [레지스트리](/ko/glossary/registry/)와 통신하여 도메인 등록을 생성·수정·이전·삭제하는 방식을 규율합니다. 등록대행자가 새 도메인명을 등록하거나 갱신하거나 이전을 개시할 때마다, 보안 TCP 세션을 통해 레지스트리의 EPP 서버에 EPP 명령을 전송하고 성공 여부 또는 오류 내용을 담은 구조화된 응답을 수신합니다. 이 프로토콜은 아웃바운드 이전 승인에 사용되는 [인증 코드](/ko/glossary/auth-code/)도 전달하며, 도메인의 현재 상태를 나타내는 [EPP 상태 코드](/ko/glossary/epp-status-codes/) — 예를 들어 `clientTransferProhibited`나 `serverHold` — 도 제공합니다. EPP는 엄격하게 통제되는 프로토콜이므로 접근 권한은 인가된 등록대행자에게만 부여되며, 최종 사용자가 직접 EPP와 상호작용하는 경우는 없습니다.
