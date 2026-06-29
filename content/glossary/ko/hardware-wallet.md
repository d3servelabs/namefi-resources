---
title: 하드웨어 지갑
date: '2026-05-22'
language: ko
tags: ['glossary']
authors: ['namefiteam']
description: 지갑의 개인 키를 오프라인 장치에 저장하고 트랜잭션을 기기 내부에서 서명하여, 키가 인터넷에 연결된 컴퓨터에 노출되지 않도록 하는 전용 보안 장치입니다.
keywords: ['하드웨어 지갑', '콜드 월렛', 'Ledger', 'Trezor', 'GridPlus', 'Keystone', '보안 요소', '자기 수탁']
level: 1
sources:
  - https://ethereum.org/en/wallets/
relatedArticles:
  - /ko/blog/onchain-domain-custody-and-recovery/
  - /ko/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ko/blog/do-multisig-wallets-actually-improve-security/
  - /ko/blog/tokenize-your-com-to-flip-it/
  - /ko/blog/how-to-tokenize-your-com/
relatedTopics:
  - /ko/topics/domain-tokenization/
  - /ko/topics/domain-security/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/domain-apocalypse/
relatedGlossary:
  - /ko/glossary/wallet/
  - /ko/glossary/private-key/
  - /ko/glossary/web3/
  - /ko/glossary/registrar/
  - /ko/glossary/erc-721/
---

**하드웨어 지갑**은 화면과 하나 또는 두 개의 버튼을 갖춘 소형 전용 장치로, [지갑](/ko/glossary/wallet/)의 개인 키를 오프라인 상태로 저장하고 트랜잭션 서명을 장치 내부에서 처리합니다. 이를 통해 키가 인터넷에 연결된 컴퓨터에 절대 노출되지 않습니다. 대표적인 제품으로는 Ledger, Trezor, GridPlus Lattice, Keystone 등이 있습니다. 서명 연산이 장치의 보안 요소(secure element) 내부에서 이루어지기 때문에, 연결된 노트북에 악성 코드가 감염되더라도 키를 탈취할 수 없습니다. 악성 코드가 할 수 있는 최악의 행위는 사용자를 속여 장치 화면에서 악의적인 트랜잭션을 승인하게 만드는 것뿐입니다. 이것이 바로 "기기에서 직접 확인(verify on device)"이 중요한 이유입니다.
