---
title: 시드 구문 (복구 구문, 니모닉)
date: '2026-05-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['gong-jihye']
description: 지갑의 마스터 키를 인코딩하는 12개 또는 24개의 단어 목록으로, 이를 보유한 누구든 지갑을 제어할 수 있으므로 반드시 백업해야 하는 유일한 정보입니다.
keywords: ['시드 구문', '복구 구문', '니모닉 구문', '지갑 백업', 'BIP39', '12단어', '24단어', '암호화폐 복구']
level: 1
sources:
  - https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
relatedArticles:
  - /ko/blog/onchain-domain-custody-and-recovery/
  - /ko/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ko/blog/do-multisig-wallets-actually-improve-security/
  - /ko/blog/selling-domains-as-nfts/
  - /ko/blog/the-badgerdao-frontend-attack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/private-key/
  - /ko/glossary/web3/
  - /ko/glossary/wallet/
  - /ko/glossary/tokenized-domain/
  - /ko/glossary/tokenize/
---

**시드 구문**은 **복구 구문** 또는 **니모닉 구문**이라고도 불리며, [지갑](/ko/glossary/wallet/)의 마스터 개인 키를 인코딩하는 12개 또는 24개의 단어로 이루어진 사람이 읽을 수 있는 목록입니다. 이 형식은 [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)에 의해 표준화되었으며, 대부분의 현대 지갑(MetaMask, Ledger, Trezor, Rabby, Coinbase Wallet 등)에서 사용됩니다. 시드 구문이 있으면 [토큰화된 도메인](/ko/blog/what-are-tokenized-domains/)을 포함한 지갑 내 모든 자산을 호환 가능한 어떤 기기에서도 복원할 수 있습니다. 반면 시드 구문이 없으면 기기 접근권을 잃었을 때 자산을 영구적으로 잃게 되는 경우가 대부분입니다. "비밀번호 재설정"을 처리해 줄 중앙 기관이 존재하지 않기 때문입니다. 권장 보안 수칙은 다음과 같습니다. 시드 구문을 종이 또는 금속 백업에 기록하고, 서로 다른 물리적 장소에 최소 두 벌의 사본을 보관하며, 컴퓨터, 클라우드 문서, 클라우드와 연동된 비밀번호 관리자, 채팅, AI 어시스턴트 등에는 **절대** 입력하지 않아야 합니다. 전체 운영 가이드는 [지갑 분실 후 토큰화된 도메인 복구하기](/ko/blog/recovering-a-tokenized-domain-after-wallet-loss/)를 참조하십시오.
