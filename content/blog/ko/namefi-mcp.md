---
title: "Namefi MCP 서버: AI 에이전트를 위한 도메인 도구"
date: '2026-07-10'
language: 'ko'
tags: ['ai-agents', 'domains', 'web3']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/namefi-mcp-og.jpg
description: "Namefi MCP 서버가 AI 에이전트에 제공하는 모든 도구를 소개합니다. 검색, 등록, DNS, 갱신, 토큰화, 인증 모델과 예시 워크플로까지 다룹니다."
keywords: ["namefi mcp 서버", "mcp 도구 목록", "namefi mcp 기능", "mcp 서버 도메인 관리", "도메인 등록대행자 mcp 서버", "namefi api 키 범위", "dns mcp 도구", "mcp로 도메인 등록", "mcp로 도메인 토큰화", "x402 도메인 결제", "siwe 도메인 인증", "eip-712 도메인 서명", "도메인 아웃바운드 잠재 고객 발굴", "namefi openapi", "ai 에이전트 도메인 도구"]
relatedArticles:
  - /ko/blog/claude-mcp-domains/
  - /ko/blog/ai-agent-register/
  - /ko/blog/wallet-checkout/
  - /ko/blog/llms-txt/
  - /ko/blog/mcp-quickstart/
relatedTopics:
  - /ko/topics/domain-tokenization/
  - /ko/topics/web3-foundations/
relatedSeries:
  - /ko/series/blockchain-concepts/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/ai-agent/
  - /ko/glossary/registrar/
  - /ko/glossary/tokenized-domain/
  - /ko/glossary/dnssec/
  - /ko/glossary/ens/
---

Namefi MCP 서버에 연결하는 모든 [AI 에이전트](/ko/glossary/ai-agent/)는 API에 정의된 작업마다 하나씩 마련된 동일한 호출 가능 도구 목록을 확인합니다. 이 도구들은 검색, 등록, DNS, 도메인 단위 설정, 아웃바운드 잠재 고객 발굴과 결제를 포괄합니다. 이 페이지는 전체 카탈로그입니다. 각 도구의 기능과 필요한 인증 방식을 설명하고, 여러 도구를 실제 워크플로로 결합한 세 가지 예시를 제공합니다.

아직 에이전트를 Namefi에 연결하지 않았다면 클라이언트별 설정은 [Namefi에서 AI 에이전트로 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)에서, 전체 대화 기록은 [Claude로 도메인 구매하기: Namefi MCP 단계별 가이드](/ko/blog/claude-mcp-domains/)에서 먼저 확인하세요. 이 페이지는 연결이 이미 설정되었다고 가정합니다.

## Namefi MCP 서버란

Namefi는 전체 API를 위한 단일 MCP 서버를 `https://api.namefi.io/mcp`에서 Streamable HTTP 전송 방식으로 운영합니다. 에이전트가 채팅에 붙여 넣은 문서를 바탕으로 REST 호출을 일일이 직접 만드는 대신, 한 번 연결하면 API에 정의된 모든 작업에 대한 타입 지정 도구를 받습니다. 이 도구들은 Namefi의 자체 OpenAPI 3 명세인 [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json)에서 직접 생성되므로 MCP 카탈로그와 REST API가 서로 어긋날 수 없습니다.

[namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)의 기계 판독형 검색 설명자를 사용하면 사람이 설정 파일에 URL을 직접 붙여 넣지 않아도 에이전트가 서버를 찾을 수 있습니다. 이 설명자는 서버 이름을 `namefi-api`로 지정하고, 전송 방식은 `streamable-http`, 연결 인증은 `apiKey`/`x-api-key`라고 명시합니다. [ICANN](/ko/glossary/icann/) 인증 [등록대행자](/ko/glossary/registrar/)인 Namefi는 MCP를 사용하지 않는 에이전트와 스크립트를 위해 동일한 작업을 일반 HTTPS 엔드포인트로도 [namefi.io/llms.txt](https://namefi.io/llms.txt)에 공개합니다.

## 전체 기능 카탈로그

아래 목록은 이 글을 작성하는 시점에 API가 정의하는 모든 작업을 Namefi 자체 참고 문서와 같은 방식으로 분류한 것입니다. **작업** 열은 OpenAPI 명세의 `operationId`, 즉 MCP 클라이언트의 도구 목록에 사용되는 이름입니다. **인증** 열에는 가장 간단한 방식을 표시했습니다. API 키 하나로 거의 모든 작업을 처리할 수 있으며, API 키 대신 사용할 수 있는 방법을 포함한 전체 인증 모델은 다음 섹션에서 설명합니다.

### 검색 및 탐색

| 작업 | 엔드포인트 | 기능 | 인증 |
| --- | --- | --- | --- |
| `checkAvailability` | `GET /v-next/search/availability` | 한 도메인 이름을 등록할 수 있는지 확인 | 없음 |
| `checkBulkAvailability` | `GET /v-next/search/bulk-availability` | 후보 이름 묶음을 한 번의 호출로 선별 | 없음 |
| `getSuggestions` | `GET /v-next/search/suggestions` | 검색어와 관련된 알고리즘 기반 이름 제안 받기 | 없음 |

### 등록 및 주문

| 작업 | 엔드포인트 | 기능 | 인증 |
| --- | --- | --- | --- |
| `registerDomain` | `POST /v-next/orders/register-domain` | 도메인을 0–10년 동안 등록. `domainSetupOptions` 객체(`autoPark`, `autoEns`, `autoRenew`, `dnssec`, `keepExistingNameservers`)와 선택적 `nftReceivingWallet`을 허용 | API 키 |
| `registerWithRecords` | `POST /v-next/orders/register-domain/records` | 한 번의 호출로 도메인을 등록하고 초기 DNS 레코드 세트를 적용 | API 키 |
| `getOrder` | `GET /v-next/orders/{orderId}` | 주문이 최종 상태인 `SUCCEEDED`, `FAILED`, `CANCELLED` 또는 `PARTIALLY_COMPLETED`에 도달할 때까지 폴링 | API 키 |

등록은 비동기 방식입니다. `registerDomain`은 즉시 주문 `id`를 반환하고, 에이전트는 완료될 때까지 `getOrder`를 폴링합니다. [Claude 가이드](/ko/blog/claude-mcp-domains/)와 [다중 에이전트 설정 가이드](/ko/blog/ai-agent-register/) 모두 전체 대화 기록에서 이 패턴을 보여 줍니다.

### DNS 레코드 관리

레코드 하나씩 또는 일괄로 처리하는 전체 CRUD 기능과 인증이 전혀 필요 없는 읽기 작업을 제공합니다.

| 작업 | 엔드포인트 | 기능 | 인증 |
| --- | --- | --- | --- |
| `getDnsRecords` | `GET /v-next/dns/records` | 영역의 모든 레코드 나열 | 없음 |
| `createDnsRecord` | `POST /v-next/dns/records` | 레코드 하나 생성 | API 키 |
| `updateDnsRecord` | `PUT /v-next/dns/record` | ID로 레코드 업데이트 | API 키 |
| `deleteDnsRecord` | `DELETE /v-next/dns/record` | ID로 레코드 삭제 | API 키 |
| `batchCreateDnsRecords` | `POST /v-next/dns/records/batch` | 한 번의 호출로 여러 레코드 생성 | API 키 |
| `batchUpdateDnsRecords` | `PUT /v-next/dns/records/batch` | 한 번의 호출로 여러 레코드 업데이트 | API 키 |
| `batchDeleteDnsRecords` | `DELETE /v-next/dns/records/batch` | 한 번의 호출로 여러 레코드 삭제 | API 키 |

지원되는 [DNS 레코드 유형](/ko/glossary/dns-record-types/): A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA, DS, TLSA, SSHFP, HTTPS, SVCB, NAPTR, SPF. 처음 시도할 때 가장 흔히 실수하는 형식 규칙이 두 가지 있습니다. `zoneName` 끝에는 점을 붙이면 안 되지만 CNAME, MX, NS 레코드의 `rdata` 값 끝에는 점을 붙여야 합니다.

### 도메인 단위 토글

이 도구들은 개별 DNS 레코드와 별도로 기능 전체를 켜거나 끕니다.

| 작업 | 엔드포인트 | 기능 | 인증 |
| --- | --- | --- | --- |
| `toggleDomainParking` / `parkDomain` | `PUT` / `POST /v-next/dns/park` | [도메인 파킹](/ko/glossary/domain-parking/) 켜기 또는 끄기 | API 키 |
| `isDomainParked` | `GET /v-next/dns/parked` | 도메인이 현재 파킹되었는지 확인 | 없음 |
| `toggleForwarding` | `PUT /v-next/dns/forwarding` | [도메인 포워딩](/ko/glossary/domain-forwarding/) 켜기 또는 끄기 | API 키 |
| `toggleAutoEns` | `PUT /v-next/dns/auto-ens` | 자동 [ENS](/ko/glossary/ens/) 레코드 게시 켜기 또는 끄기 | API 키 |
| `toggleVercelAnyCastRecords` | `PUT /v-next/dns/vercel-anycast` | Vercel Anycast DNS 레코드 켜기 또는 끄기 | API 키 |

[DNSSEC](/ko/glossary/dnssec/)는 이러한 토글 중 하나가 아닙니다. 위의 `registerDomain`에 있는 `domainSetupOptions` 필드 중 하나로 등록 시점에 설정하며, 에이전트가 나중에 호출하는 별도 엔드포인트가 아닙니다.

### 도메인 설정

| 작업 | 엔드포인트 | 기능 | 인증 |
| --- | --- | --- | --- |
| `getAutoRenew` | `GET /v-next/domain-config/auto-renew` | 자동 갱신이 켜져 있는지 확인 | API 키 |
| `toggleAutoRenew` | `PUT /v-next/domain-config/auto-renew` | 자동 갱신 켜기 또는 끄기 | API 키 |

[자동 갱신](/ko/glossary/domain-renewal/)을 켜면 소유자 지갑의 결제 수단을 사용해 만료 전에 도메인이 자동으로 갱신됩니다. 이는 도메인마다 신중하게 결정할 상시 승인으로, 포트폴리오 전체에 기본으로 켜 두어서는 안 됩니다.

### 아웃바운드 잠재 고객 발굴

소유한 도메인을 정적인 자산 목록이 아닌 영업 파이프라인으로 바꾸는 최신 기능입니다.

| 작업 | 엔드포인트 | 기능 | 인증 |
| --- | --- | --- | --- |
| `getUserDomains` | `GET /v-next/user/domains` | 인증된 지갑이 소유한 도메인 나열 | API 키 |
| `startOutboundRun` | `POST /v-next/outbound/runs` | 소유한 도메인 하나에 대해 AI 잠재 고객 발굴 실행 시작. `reasoningEffort`는 `low`, `medium`, `high` 중 하나 | API 키 |
| `listOutboundRuns` | `GET /v-next/outbound/runs` | 이전 및 현재 실행 나열 | API 키 |
| `getOutboundRun` | `GET /v-next/outbound/runs/{runId}` | 실행 상태 폴링: `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED` 또는 `CANCELED` | API 키 |
| `listOutboundLeads` | `GET /v-next/outbound/runs/{runId}/leads` | 근거, 발견된 연락처, 기존 아웃리치 초안을 포함한 순위별 구매자 잠재 고객 나열 | API 키 |
| `prepareOutboundOutreach` | `POST /v-next/outbound/runs/{runId}/leads/{leadId}/outreach` | 잠재 고객 한 명을 위한 아웃리치 초안을 생성하거나 추가 생성 비용 없이 기존 초안을 반환 | API 키 |

응답에서는 점수, 모델 세부 정보, 제외된 잠재 고객 상태 같은 내부 순위 산정 방식을 제외합니다. 따라서 에이전트가 사람을 위해 결과를 요약할 때는 공개된 근거, 발견된 연락처, 초안의 존재 여부만 확인할 수 있습니다.

### 결제 및 계정

| 작업 | 엔드포인트 | 기능 | 인증 |
| --- | --- | --- | --- |
| `getBalance` | `GET /v-next/balance` | 도메인 등록 자금으로 쓰이는 NFSC(Namefi Service Credit) 잔액 확인 | API 키 |
| `requestNfscFaucet` | `POST /v-next/user/faucet` | 무료 테스트 NFSC 크레딧 요청(개발 환경 전용) | API 키 |
| `registerDomainX402` | `GET /x402/domain/{domainName}` | Namefi 계정 없이 스테이블코인 서명 HTTP 402 흐름으로 한 번에 등록하고 결제 | 지갑 서명 |
| — | `GET /x402/purchase/{purchaseId}` | x402 구매 상태 폴링 | 없음 |
| `registerDomainMPP` | `GET /mpp/domain/{domainName}` | MPP(Machine Payable Protocol) 챌린지-응답 흐름으로 등록 및 결제 | 지갑 서명 |

검색, 등록, DNS, 도메인 설정, 아웃바운드와 결제 범위의 모든 작업이 여기에 포함됩니다. 각각 단일 서버 연결을 통해 MCP 도구로 사용하거나, MCP를 사용하지 않는 에이전트에서 일반 HTTPS 호출로 사용할 수 있습니다. Namefi API에는 이 목록 밖에도 일부 계정 관리와 EIP-712/SIWE 보조 작업이 있으며, 전체 최신 목록은 아래 출처에 연결된 OpenAPI 명세에서 확인할 수 있습니다.

## 인증 모델: 세 가지 경로, 모두 하나의 지갑으로

위의 모든 쓰기 작업은 세 경로 중 하나로 동일한 사실을 확인합니다. 호출자가 도메인을 소유하고 있거나 앞으로 소유할 지갑을 제어하는지입니다. 어느 경로가 적용되는지는 하나의 계정 단위 설정이 아니라 작업에 따라 달라집니다.

**API 키(`x-api-key`).** 가장 간단한 선택지이며, 이 글 묶음의 모든 실제 예시가 사용하는 방식입니다. [namefi.io/api-key](https://namefi.io/api-key)에서 생성하세요. 키를 생성한 지갑의 권한을 상속하므로 DNS 쓰기, 파킹, 등록을 비롯한 위의 모든 작업에 사용할 수 있습니다. SDK 없이 일반 HTTP 헤더로 전달하면 됩니다.

**EIP-712 타입 데이터 서명.** 저장된 키 없이 프로그래밍 방식으로 사용하려면 각 요청을 Ethereum [지갑](/ko/glossary/wallet/)으로 서명합니다. `x-namefi-signer`, `x-namefi-signature`, `x-namefi-eip712-type` 헤더는 타임스탬프와 300초 후 만료되는 일회용 nonce가 포함된 봉투 형식으로 페이로드를 감쌉니다. API 키가 없을 때 `toggleDomainParking`, `createDnsRecord`, `registerDomain` 같은 작업에 필요한 방식입니다. Namefi 문서에 따르면 변경될 수 있으므로 도메인과 타입 정의는 하드코딩된 상수가 아니라 실제 엔드포인트(`GET /v-next/eip712/domain`, `/eip712/types`)에서 가져옵니다. 스마트 컨트랙트 지갑은 직접 서명할 수 없으므로 승인된 외부 소유 계정이 컨트랙트를 대신해 서명하며, `x-namefi-erc1271-account` 또는 `x-namefi-eip7702-account`로 요청을 승인하는 컨트랙트를 지정합니다.

**SIWE(Sign-In with Ethereum).** 소유 도메인이나 주문 목록처럼 매번 새 서명이 필요하지 않은 보호된 읽기 작업에 사용하는 세션 토큰(`x-namefi-siwe-token`)입니다. nonce를 가져오고 서명할 메시지를 받은 다음 `personal_sign`으로 서명해 검증한 뒤 토큰을 재사용합니다.

인증이 필요 없는 작업도 몇 가지 있습니다. `checkAvailability`, `getSuggestions`, `getDnsRecords`, `isDomainParked`, EIP-712 메타데이터 엔드포인트는 읽기 전용이며 도메인의 공개 DNS가 브라우저에 이미 보여 주는 것 이상의 정보를 노출하지 않습니다.

그 위에 결제 계층이 더해집니다. `registerDomainX402`는 [x402 프로토콜](https://x402.org)을 통해 구매를 결제합니다. 구매자 지갑은 USDC 같은 [스테이블코인](/ko/glossary/stablecoin/)에 대해 EIP-3009 `transferWithAuthorization`에 서명하며 Namefi 계정은 필요하지 않습니다. `registerDomainMPP`는 서명된 챌린지-응답을 통해 같은 결과에 도달합니다. 두 방식 모두 에이전트가 계정 생성을 건너뛰고 거래별로 결제할 수 있게 합니다. [암호화폐 지갑으로 도메인 결제하기: 계정 불필요](/ko/blog/wallet-checkout/)에서 이 과정을 처음부터 끝까지 설명합니다.

## 토큰화는 카탈로그와 별개가 아니라 전체에 관여합니다

`registerDomain`은 도메인을 [NFT](/ko/glossary/nft/), 즉 대부분의 마켓플레이스와 지갑이 이미 지원하는 [표준 인터페이스](https://eips.ethereum.org/EIPS/eip-721)인 [ERC-721](/ko/glossary/erc-721/) 토큰으로 발행합니다. 기본적으로 호출자의 API 키와 연결된 지갑에 Base에서 발행됩니다. `nftReceivingWallet`을 사용하면 등록 시점에 다른 지갑이나 체인으로 수령 대상을 변경할 수 있습니다. 이후의 모든 작업, 즉 DNS 쓰기, 파킹, 자동 갱신, 아웃바운드 잠재 고객 발굴은 별도의 계정 데이터베이스가 아니라 동일한 온체인 소유권 기록을 확인합니다. [OpenSea](https://opensea.io) 같은 마켓플레이스에서 거래되는 [토큰화 도메인](/ko/glossary/tokenized-domain/)은 DNS 제어권과 ERC-721 소유권을 하나의 객체로 함께 전달하므로 두 시스템을 수동으로 동기화할 필요가 없습니다.

## 에이전트 세 가지, 같은 도구 모음을 사용하는 세 가지 방법

**개발자가 한 번의 대화에서 도메인을 등록하고 DNS까지 설정합니다.** `checkAvailability`로 이름을 등록할 수 있는지 확인하고, `domainSetupOptions`의 `autoRenew`와 `dnssec`를 설정해 `registerDomain`으로 제출합니다. 주문이 `SUCCEEDED`에 도달하면 `batchCreateDnsRecords`로 배포 플랫폼의 검증 단계가 기다리는 CNAME 및 TXT 레코드를 작성합니다. [코딩 에이전트를 위한 Namefi MCP 빠른 시작](/ko/blog/mcp-quickstart/)에서 편집기 안에서 이 순서를 따라 해 볼 수 있습니다.

**도메인 트레이더가 포트폴리오를 관리합니다.** `getUserDomains`로 현재 보유 자산을 불러오고, `checkBulkAvailability`로 새 후보를 한 번의 호출로 선별한 다음, `registerDomain`으로 인수할 가치가 있는 이름을 확보합니다. 재판매할 이름은 `toggleDomainParking`으로 랜딩 페이지를 열고 `isDomainParked`로 실제 게시 여부를 확인합니다. 포트폴리오 전체에서는 `getAutoRenew`와 `toggleAutoRenew`를 사용해 상시 갱신 승인을 둘 가치가 있는 이름과 만료되도록 두어도 될 만큼 투기적인 이름을 구분합니다.

**기업이 이미 소유한 이름으로 아웃바운드 잠재 고객 발굴을 실행합니다.** `getUserDomains`로 사용하지 않는 도메인을 찾고, `startOutboundRun`으로 조사를 시작한 다음, `getOutboundRun`으로 `SUCCEEDED`에 도달할 때까지 폴링합니다. `listOutboundLeads`는 프로필상 해당 이름을 원할 가능성이 있는 기업을 순위별로 반환하고, `prepareOutboundOutreach`는 잠재 고객별 이메일을 한 번 생성합니다. 이후 반복 호출에는 같은 초안을 무료로 반환합니다.

## 에이전트가 이 작업들을 무인으로 실행하기 전에

Namefi의 자체 아웃바운드 문서는 `registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach`의 네 작업을 **중대한 결과를 수반하는 작업**으로 표시합니다. 각 작업이 잔액을 지출하거나 외부에 보이는 행동을 하기 때문입니다. `checkAvailability` 같은 읽기 전용 도구는 자율적으로 실행해도 위험하지 않습니다. 주문을 쓰거나, 실제 서비스 중인 도메인에 DNS 레코드를 쓰거나, 아웃리치 초안을 만드는 작업에는 확인 단계를 두는 것이 좋습니다. [에이전트 네이티브 도메인 등록대행자란?](/ko/blog/agent-native/)에서 등록대행자의 에이전트용 기능을 이런 관점에서 평가하는 더 자세한 체크리스트를 확인할 수 있습니다.

## 이 카탈로그를 최신 상태로 유지하는 방법

이 표는 고정된 로드맵이 아니라 위 발행일을 기준으로 Namefi의 실제 OpenAPI 명세를 반영합니다. 새 작업은 블로그 글의 표보다 먼저 [namefi.io/llms.txt](https://namefi.io/llms.txt)와 [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt)에 추가됩니다.

## 자주 묻는 질문

### 이름을 등록할 수 있는지 확인할 때도 API 키가 필요한가요?
아닙니다. `checkAvailability`, `checkBulkAvailability`, `getSuggestions`에는 인증이 필요하지 않으므로 자금을 넣기 전, 새로 연결한 에이전트에서도 작동합니다.

### 제가 Namefi API 키를 보유하지 않아도 에이전트가 이 카탈로그 전체를 사용할 수 있나요?
네. `registerDomainX402`와 `registerDomainMPP` 모두 Namefi 계정 없이 지갑 서명으로 등록 비용을 결제하며, 나머지 쓰기 작업은 EIP-712 서명을 사용해 지갑에서 직접 처리할 수 있습니다.

### 어떤 경로로 등록하든 도메인이 자동으로 토큰화되나요?
네. 모든 등록 경로에서 기본적으로 토큰화됩니다. `nftReceivingWallet`을 지정하지 않으면 도메인은 호출자의 API 키와 연결된 지갑에 Base의 ERC-721 NFT로 등록됩니다.

### 자율 에이전트가 실행하기 전에 사람이 확인해야 할 작업은 무엇인가요?
최소한 Namefi 문서에서 중대한 결과를 수반한다고 표시한 네 작업인 `registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach`와 실제 트래픽을 처리 중인 도메인에 대한 모든 DNS 쓰기는 사람이 확인해야 합니다.

## 에이전트를 전체 카탈로그에 연결하세요

위의 모든 도구는 `https://api.namefi.io/mcp` 연결 하나를 통해 실제로 제공됩니다. 아직 설정하지 않았다면 [Namefi에서 AI 에이전트로 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)에서 서로 다른 여섯 클라이언트의 정확한 설정을 확인하고, [도메인을 위한 llms.txt](/ko/blog/llms-txt/)에서 그 기반이 되는 검색 계층을 알아보세요.

**[Namefi API 키를 생성하고](https://namefi.io/api-key)** 에이전트가 서버를 가리키게 하세요. 위의 도구들이 에이전트를 기다리고 있습니다.

## 출처 및 추가 자료

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP 서버 URL, 전송 방식, 인증, 핵심 작업 참고 자료 — 이 카탈로그의 주요 출처)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (Web3 결제와 아웃바운드 잠재 고객 발굴을 인라인으로 포함한 단일 파일 참고 자료)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402, MPP, EIP-712, SIWE 흐름 상세 설명)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP 검색 설명자: 서버 이름, URL, 전송 방식, 인증 유형)
- Namefi — [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json) (기계 판독형 OpenAPI 3 명세 — 위 기능 카탈로그의 모든 `operationId`와 엔드포인트 출처)
- Namefi — [docs.namefi.io: 인증](https://docs.namefi.io/docs/02-authentication.mdx#:~:text=The%20Namefi%20API%20supports%20three%20authentication%20methods) (API 키, EIP-712, SIWE 인증 방식, 작업별 인증 요구 사항, ERC-1271/EIP-7702 위임)
- Namefi — [docs.namefi.io: 도메인 등록](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (등록 요청 필드, 폴링 흐름, 주문 상태 값)
- Namefi — [docs.namefi.io: 잔액 관리](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC 잔액 및 faucet 엔드포인트)
- Model Context Protocol — [Model Context Protocol이란?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (프로토콜 개요)
- llmstxt.org — [/llms.txt 파일](https://llmstxt.org) (Namefi 파일이 따르는 검색 규칙의 명세와 근거)
- x402.org — [x402 프로토콜](https://x402.org) (`registerDomainX402`의 기반인 HTTP 402 스테이블코인 결제 표준)
- Ethereum Improvement Proposals — [ERC-721: 대체 불가능 토큰 표준](https://eips.ethereum.org/EIPS/eip-721) (Namefi 도메인 NFT가 구현하는 토큰 표준)
