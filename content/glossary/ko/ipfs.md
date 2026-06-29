---
title: IPFS
date: '2026-06-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 파일을 서버 위치가 아닌 콘텐츠 해시로 식별하는 P2P 프로토콜로, 탈중앙화 웹 데이터 호스팅에 사용됩니다.
keywords: ['IPFS', '콘텐츠 주소 지정', 'P2P', '탈중앙화 스토리지', 'CID']
also_known_as: ['InterPlanetary File System']
level: 1
sources:
  - https://docs.ipfs.tech/concepts/what-is-ipfs/
relatedArticles:
  - /ko/blog/the-curve-finance-dns-hijack/
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/onchain-domain-custody-and-recovery/
  - /ko/blog/the-2024-squarespace-defi-domain-hijacks/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/web3/
  - /ko/glossary/dns/
  - /ko/glossary/tokenized-domain/
  - /ko/glossary/registrar/
  - /ko/glossary/blockchain/
---

**IPFS**(InterPlanetary File System)는 파일을 서버 위치가 아닌 콘텐츠 해시, 즉 콘텐츠 식별자(CID)로 식별하는 P2P 하이퍼미디어 프로토콜입니다. 두 노드가 동일한 파일을 보유하면 동일한 CID가 생성되므로, 네트워크는 가장 가까운 노드에서 해당 파일을 가져올 수 있습니다. 이러한 콘텐츠 주소 지정 방식은 URL이 오프라인 상태가 될 수 있는 특정 서버를 가리키는 HTTP와는 정반대의 개념입니다. [web3](/ko/glossary/web3/) 애플리케이션에서 IPFS는 표준적인 오프체인 데이터 레이어로 활용됩니다. NFT 메타데이터, 아트워크, 문서 등은 비용이 많이 드는 [블록체인](/ko/glossary/blockchain/)에 영구적으로 기록하는 대신 IPFS에 저장되며, [온체인](/ko/glossary/on-chain/) 기록에는 변경 불가능한 CID만 보관됩니다. 토큰화된 도메인의 경우, IPFS를 활용하면 IPFS 호환 게이트웨이나 브라우저 확장 프로그램을 통해 접근할 수 있는 탈중앙화 웹사이트를 호스팅할 수 있으며, 이는 기존 DNS 서버를 완전히 우회합니다.
