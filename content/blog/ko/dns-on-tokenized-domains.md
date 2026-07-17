---
title: "DNS는 그대로 작동합니다: 토큰화된 도메인의 네임서버, 이메일, DNSSEC"
date: '2026-05-22'
language: ko
tags: ['guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-tokenization
series: tokenize-your-com
seriesOrder: 2
format: guide
description: ICANN 도메인을 토큰화한 후에도 일반 DNS — 네임서버, A/AAAA, MX, TXT, DNSSEC, CAA — 가 계속 작동하는 방식을 실용적으로 살펴봅니다. 무엇이 바뀌고, 무엇이 바뀌지 않는지, 기존 DNS 공급자를 어디에 연결해야 하는지를 설명합니다.
keywords: ['DNS 토큰화 도메인', 'DNSSEC NFT 도메인', '토큰화 도메인 네임서버', '토큰화 도메인 이메일', 'MX 레코드 NFT 도메인', 'CAA 레코드 토큰화 도메인', '토큰화 도메인 DNS 관리', '온체인 도메인 DNS', 'NFT 도메인 MX', 'NFT 도메인 DNSSEC', '토큰화 도메인 Cloudflare', '토큰화 도메인 Route53', '토큰화 도메인 DNS 작동 방식', '토큰화 도메인 해석']
relatedArticles:
  - /ko/blog/how-to-tokenize-your-com/
  - /ko/blog/what-are-tokenized-domains/
  - /ko/blog/tokenize-your-com-to-flip-it/
  - /ko/blog/how-tokenized-marketplaces-replace-escrow/
  - /ko/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /ko/topics/domain-tokenization/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/tokenize-your-com/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/registry/
  - /ko/glossary/tld/
---

[도메인을 토큰화](/ko/glossary/tokenize/)할 때 흔히 드는 걱정이 있습니다. *"내 웹사이트는 계속 작동할까? 이메일은? DNS 스택을 완전히 새로 배워야 하나?"*

간단히 답하자면: **예, 예, 아니오.** [토큰화된 도메인](/ko/glossary/tokenized-domain/)은 여전히 실제 ICANN 도메인입니다. DNS는 이전과 똑같이 작동합니다. 이 글은 무엇이 (조금) 바뀌고, 무엇이 (대부분) 바뀌지 않는지를 살펴보는 안내입니다.

---

## 핵심 개념 하나만 기억하세요

토큰화된 도메인에는 **두 개의 레이어**가 있습니다.

1. **[DNS](/ko/glossary/dns/) / [레지스트리](/ko/glossary/registry/) 레이어** — 기존에 `.com`이 존재해 온 바로 그 레이어입니다. [ICANN](/ko/glossary/icann/), [레지스트라](/ko/glossary/registrar/), [루트 서버](/ko/glossary/root-zone/), 재귀 리졸버로 구성됩니다.
2. **[온체인](/ko/glossary/on-chain/) 레이어** — *소유권*을 나타내는 NFT가 [지갑](/ko/glossary/wallet/)에 저장되는 레이어입니다.

`example.com`을 [IP 주소](/ko/glossary/ip-address/)로 변환하는 DNS 해석은 전적으로 레이어 1에서 이루어집니다. 온체인 레이어는 **도메인을 누가 통제하는지**에 관한 것이지, 도메인이 어떻게 해석되는지와는 무관합니다. 브라우저, 이메일 서버, CDN, 인증 기관은 [블록체인](/ko/glossary/blockchain/)의 존재를 알 필요가 없습니다.

"DNS는 그대로 작동한다"는 말의 이유가 바로 이것입니다. 마법이 아닙니다. 똑같은 DNS입니다.

---

## 바뀌지 않는 것들

### 네임서버

도메인에 네임서버를 설정하는 방식은 그대로입니다. Cloudflare, Route53, Namecheap, Google Cloud DNS, dnsimple — 이전에 사용하던 것을 그대로 사용하면 됩니다. 많은 분들이 토큰화 이후에도 DNS 공급자를 그대로 두고 전혀 손대지 않습니다.

### A, AAAA, CNAME, ALIAS 레코드

모두 표준 그대로입니다. 웹사이트는 어제와 똑같이 해석됩니다.

### MX, SPF, DKIM, DMARC

이메일은 계속 작동합니다. 토큰화는 메일 전송에 아무런 영향을 미치지 않습니다. Google Workspace, Microsoft 365, Fastmail, ProtonMail, 또는 자체 호스팅 메일 서버를 사용하든 — 어떤 것도 바뀌지 않습니다.

### TXT 레코드

SaaS 도구(Stripe, Slack, GitHub, Atlassian 등)의 도메인 인증은 그대로 작동합니다. 필요에 따라 TXT 레코드를 추가하거나 삭제할 수 있습니다.

### CAA 레코드

인증 기관 권한 부여(Certificate Authority Authorization) — 인증 기관(Let's Encrypt, DigiCert)에게 누가 해당 도메인의 인증서를 발급할 수 있는지 알려주는 레코드 — 도 변함없이 작동합니다.

### TLS / SSL 인증서

인증서는 기존과 동일한 경로로 발급받습니다. Let's Encrypt, CDN 공급자, 로드 밸런서 — 흐름은 동일합니다. ACME 챌린지(DNS-01 또는 HTTP-01)도 동일하게 작동합니다.

### 갱신

도메인은 동일한 일정으로 레지스트라를 통해 갱신되며, 청구 방식도 동일합니다. 토큰화는 새로운 갱신 메커니즘을 도입하지 않습니다.

---

## 바뀌는 것들 (조금)

### 도메인을 통제하는 주체

토큰화 전: 레지스트라 계정 로그인 정보를 가진 사람.
토큰화 후: **온체인 NFT를 보유한 사람**이 권한 있는 통제권을 갖습니다. Namefi 대시보드는 프로토콜을 통해 NFT와 레지스트라 계정을 연결하므로, 지갑이 신뢰의 원천이 됩니다.

이것이 토큰화의 핵심입니다. 그렇기 때문에 지갑 보안을 진지하게 고려해야 합니다 — [지갑 분실 후 토큰화된 도메인 복구하기](/ko/blog/recovering-a-tokenized-domain-after-wallet-loss/)를 참고하세요.

### DNS 관리 위치

토큰화 이후에는 대부분의 소유자가 Namefi 대시보드에서 DNS 레코드를 관리합니다 — 대시보드가 레지스트라와 대신 통신합니다. Cloudflare/Route53 등에서 DNS를 계속 관리하고 싶다면, 네임서버를 그쪽에 그대로 두고 앱 내 DNS UI는 사용하지 않으면 됩니다. 두 가지 방식 모두 잘 작동합니다.

### 도메인 이전

토큰화 전: 인증 코드와 60일 잠금 기간이 있는 [레지스트라 간 이전](/ko/glossary/cross-registrar-transfer/) 절차.
토큰화 후: [**NFT 이전**](/ko/glossary/atomic-transfer/). 단일 온체인 트랜잭션으로 소유권이 이동합니다. 레지스트라 측 기록은 프로토콜에 의해 동기화됩니다. 이 방식은 극적으로 빠르며 — 토큰화된 도메인 마켓플레이스가 전통적인 [에스크로](/ko/glossary/escrow/)를 필요로 하지 않는 이유이기도 합니다([상장부터 결제까지](/ko/blog/how-tokenized-marketplaces-replace-escrow/) 참고).

원한다면 기존 레지스트라 이전 방식을 사용할 수도 있습니다. 온체인 레이어가 그것을 막지 않습니다.

---

## 토큰화된 도메인의 DNSSEC

[DNSSEC](/ko/glossary/dnssec/)은 작동합니다. 이전에 활성화되어 있었다면 그대로 유지됩니다. 활성화하지 않았다면 토큰화 이후에 활성화할 수 있습니다. 신뢰 체인은 평소와 마찬가지로 레지스트리를 통해 이어집니다 — 온체인 레이어는 그 경로 어디에도 위치하지 않습니다. (배경 지식: [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033)에서 프로토콜을 정의하며, [ICANN의 KSK 의식 설명](https://www.icann.org/dns-resolvers-checking-current-trust-anchors)에서 신뢰 루트 프로세스를 설명합니다.)

실용적인 참고 사항 몇 가지:

- DNS가 Cloudflare나 Route53에 있다면, 해당 공급자가 DNSSEC 서명을 대신 처리합니다. 레지스트라 측에서 활성화하기만 하면 되며, Namefi 대시보드를 통해 설정할 수 있습니다.
- DS 레코드는 레지스트라/레지스트리 수준에서 관리됩니다. KSK를 교체하는 경우, 이전과 동일한 방식으로 새 DS 레코드를 게시하면 됩니다.
- DNSSEC 오류는 표준 도구(`dig +dnssec`, [dnsviz.net](https://dnsviz.net/), [Verisign의 DNSSEC 분석기](https://dnssec-debugger.verisignlabs.com/))에서 확인할 수 있습니다. 토큰화로 인해 새로운 오류 유형이 추가되지는 않습니다.

---

## 토큰화 이후의 이메일 전송 가능성

이메일에 대해 가장 많이 걱정하시므로, 명확히 말씀드리겠습니다: **이메일과 관련된 것은 아무것도 바뀌지 않습니다.**

MX 레코드는 여전히 메일을 공급자에게 라우팅합니다. SPF는 여전히 발신자를 인증합니다. DKIM은 여전히 발신 메시지에 서명합니다. DMARC는 여전히 정렬을 적용합니다. 평판은 발신 IP/도메인 쌍에 귀속되며, 도메인은 여전히 동일한 도메인입니다 — 같은 이름, 같은 연령, 같은 이력입니다.

토큰화와 동시에 메일 공급자를 변경하려는 경우(정리의 좋은 기회가 되기도 하죠), 변경 작업은 하나씩 진행하세요. 토큰화가 무언가를 망가뜨리기 때문이 아니라, 한 번에 하나의 변수만 바꾸는 것이 좋은 운영 습관이기 때문입니다.

---

## 빠른 참고: 주요 레코드

| 레코드 | 용도 | 토큰화의 영향 |
|---|---|---|
| A / AAAA | 웹사이트 IP | 없음 |
| CNAME / ALIAS | 별칭 | 없음 |
| MX | 이메일 라우팅 | 없음 |
| TXT | 인증, SPF, DKIM, DMARC | 없음 |
| CAA | 인증 기관 제한 | 없음 |
| NS | 위임 | 없음 (네임서버는 직접 선택) |
| DS | DNSSEC 위임 | 없음 (레지스트리에서 평소와 같이 관리) |
| SRV | 서비스 위치 | 없음 |
| TLSA | DANE | 없음 |

"토큰화" 레이어 전체는 DNS *옆에* 위치합니다. DNS 위에 얹히는 것이 아닙니다.

---

## 실제로 흔히 발생하는 실수들

- **NFT를 보유한 지갑을 잊어버리는 것.** DNS 문제는 아니지만, 토큰화된 도메인에 대한 접근권을 잃는 가장 흔한 원인입니다. 반드시 기록해 두세요.
- **네임서버와 DNS 공급자를 동시에 교체하는 것.** 하고 싶은 마음은 이해하지만, 불필요한 위험을 초래합니다. 먼저 토큰화를 완료하고, DNS 공급자 변경은 나중에 원할 때 하세요.
- **온체인 레이어가 DNS 변경 사항을 자동으로 적용한다고 가정하는 것.** 그렇지 않습니다. DNS 변경은 여전히 DNS 공급자를 통해 이루어지며, TTL에 따라 몇 분에서 몇 시간의 일반적인 전파 시간이 소요됩니다.
- **마이그레이션 중 DNSSEC를 비활성화하는 것.** DNSSEC를 켜고 끄는 경우, 적절한 DS 레코드 업데이트와 함께 깔끔하게 처리하세요. 절반만 적용된 DNSSEC는 모든 곳에서 해석을 중단시킵니다.

---

## 안내 사항 (꼭 읽어주세요!)

> 저희는 변호사, 회계사, 재무 어드바이저, 또는 의사가 아닙니다 — **이 글의 어떤 내용도 법률, 재무, 세무, 회계, 의료, 또는 기타 전문적 조언이 아닙니다.** 이 글은 저희 스스로를 교육하고 고객들에게 편의를 제공하기 위해 작성되었습니다. 여기의 정보는 오래되었거나, 특정 지역에만 해당하거나, 또는 단순히 틀릴 수 있습니다 — 저희도 실수를 합니다.
>
> 중요한 결정을 내리기 전에는 **반드시 전문가와 상담하세요(진심으로!)**. 그게 맞지 않는다면, 친구에게 물어보거나, 트위터에 물어보거나, 레딧에 물어보거나, AI에게 물어보거나, 점쟁이에게 물어보세요. 한마디로: **DOYR — 직접 조사하세요**. 함께 배우고 즐겁게 나아갑시다.

---

## 요약

- 도메인을 토큰화해도 DNS는 대체되지 않습니다. DNS는 계속 DNS 역할을 합니다.
- 네임서버, 웹사이트, 이메일(MX/SPF/DKIM/DMARC), DNSSEC, CAA, TLS 인증서 모두 변함없이 계속 작동합니다.
- 바뀌는 것은 **소유권**입니다. 지갑의 NFT가 새로운 권한 있는 통제 지점이 됩니다. 이전은 레지스트라 행정 절차 대신 온체인에서 이루어집니다.
- DNS를 Cloudflare, Route53, 또는 현재 위치에 그대로 유지할 수 있습니다. 아니면 Namefi를 통해 관리할 수도 있습니다. 두 방식 모두 유효합니다.
- 실질적인 의미: 토큰화된 `.com`은 판매하거나 이전할 때까지는 운영 측면에서 토큰화되지 않은 `.com`과 구별이 되지 않습니다 — 그 시점에서 온체인 레이어가 모든 것을 극적으로 빠르게 만들어줍니다.

토큰화 방법에 대한 운영자 수준의 안내는 [.com을 토큰화하는 방법](/ko/blog/how-to-tokenize-your-com/)을 참고하세요.
