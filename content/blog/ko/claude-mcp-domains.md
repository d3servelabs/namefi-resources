---
title: "Claude로 도메인 구매하기: Namefi MCP 단계별 가이드"
date: '2026-07-10'
language: 'ko'
tags: ['ai-agents', 'domains', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/claude-mcp-domains-og.jpg
description: "Claude를 Namefi MCP 서버에 연결하고 한 번의 대화로 실제 도메인을 등록하세요. 정확한 설정 방법과 주석이 달린 대화 예시, 문제 해결 방법을 안내합니다."
keywords: ["namefi mcp", "claude mcp 도메인", "mcp 서버 설정", "claude로 도메인 구매", "x-api-key", "단계별 튜토리얼", "namefi mcp 도메인 등록", "claude desktop 도메인 등록", "claude code 도메인 구매", "namefi claude 연동", "mcp 도메인 등록대행자", "ai 에이전트 claude 도메인 구매", "streamable http mcp"]
relatedArticles:
  - /ko/blog/ai-agent-register/
  - /ko/blog/cf-namecom-namefi/
  - /ko/blog/ai-domain-platforms/
  - /ko/blog/agent-native/
  - /ko/blog/airo-vs-namefi/
relatedTopics:
  - /ko/topics/domain-tokenization/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/tokenize-your-com/
  - /ko/series/blockchain-concepts/
relatedGlossary:
  - /ko/glossary/ai-agent/
  - /ko/glossary/registrar/
  - /ko/glossary/dns-record-types/
  - /ko/glossary/tokenized-domain/
  - /ko/glossary/x402/
---

이 가이드를 끝까지 따라 하면 [ICANN](/ko/glossary/icann/)에 실제 도메인을 등록하고, DNS가 자신이 구축 중인 서비스로 향하도록 설정할 수 있습니다. 이 모든 과정은 브라우저 결제, 장바구니, CAPTCHA 없이 Claude와의 대화만으로 완료됩니다. 이 글은 Namefi 팀이 직접 작성한 [Namefi](https://namefi.io) MCP 서버 설정 가이드로, [namefi.io/llms.txt](https://namefi.io/llms.txt)와 [docs.namefi.io](https://docs.namefi.io)에서 에이전트용으로 공개한 동일한 API를 사람이 이해하기 쉽게 설명합니다. 아직 확정되거나 공개되지 않은 세부 사항은 추측하지 않고 명확하게 미확정이라고 표시합니다.

“[AI 에이전트](/ko/glossary/ai-agent/)로 도메인 등록하기”를 다루는 서드파티 가이드도 있습니다. [널리 알려진 한 예시](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26)는 Cloudflare Registrar API를 기반으로 리셀러가 구축한 다른 MCP 서버를 사용해 이 방식을 보여 줍니다. MCP 자체의 작동 원리는 공급자에 관계없이 같습니다. 하지만 이 가이드는 Namefi 자체 MCP 서버와 인증 모델, [토큰화 도메인](/ko/glossary/tokenized-domain/) 옵션에만 초점을 맞추며, 서드파티 설명이 아니라 Namefi 문서를 기준으로 검증했습니다.

## MCP란 무엇인가요? 간단히 알아보기

[Model Context Protocol](https://modelcontextprotocol.io)(MCP)은 AI 애플리케이션(이 글에서는 Claude)을 외부 도구와 데이터 소스에 연결하는 개방형 표준입니다. 프로토콜 공식 문서에서는 이를 [AI 애플리케이션을 위한 USB-C 포트](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications)라고 설명합니다. 도구마다 맞춤형 연동을 만드는 대신 표준화된 커넥터 하나를 사용하는 방식입니다. Claude를 Namefi MCP 서버에 연결하면 채팅에 붙여 넣은 문서를 보고 REST API를 역으로 파악할 필요 없이, 가용성 확인, 도메인 등록, DNS 레코드 읽기 및 쓰기처럼 명확히 정의된 작업을 호출할 수 있습니다.

## 준비 사항

- **MCP를 지원하는 Claude 클라이언트.** 이 가이드에서는 구체적으로 테스트한 명령을 바탕으로 명령줄용 Claude Code를 설명하고, 문서화된 일반 절차에 따라 Custom Connectors를 사용하는 Claude Desktop/claude.ai도 다룹니다. Cursor나 Windsurf 같은 다른 MCP 클라이언트도 동일한 서버에 연결됩니다. 자세한 내용은 [Namefi에서 AI 에이전트로 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)의 에이전트별 섹션을 참조하세요. 연결 명령만 필요하다면 요약된 [Namefi MCP 빠른 시작: Claude Code, Cursor 및 Windsurf](/ko/blog/mcp-quickstart/)를 확인하세요.
- **Namefi API 키.** [namefi.io/api-key](https://namefi.io/api-key)에서 생성합니다. 또는 API 키 없이 거래별로 결제하려면 암호화폐 [지갑](/ko/glossary/wallet/)을 사용할 수 있습니다(글 뒷부분의 지갑 섹션 참조).
- **충전된 NFSC 잔액.** Namefi 프로덕션 환경에서 도메인을 등록할 때 필요합니다. NFSC(Namefi Service Credits)는 도메인 등록 비용이 차감되는 잔액입니다. Namefi 문서에 따르면 프로덕션에서는 Namefi 대시보드에서 충전하고, 개발 환경에서는 파우셋 엔드포인트에서 무료 테스트 크레딧을 요청할 수 있습니다.

## 1단계: Namefi API 키 발급하기

[API 키](https://namefi.io/api-key)는 가장 간단한 인증 방법이며, 이 가이드 전체에서 사용하는 방식입니다. 하나의 헤더로 등록과 DNS 레코드 생성, 수정, 삭제를 모두 처리할 수 있습니다. 키를 생성하기 전에 반드시 알아 둘 점이 있습니다. **키는 이를 생성한 지갑의 권한을 그대로 상속합니다.** 이미 소유한 도메인의 DNS를 관리하려면 해당 도메인 NFT를 보유한 지갑에서 키를 생성하세요. 다른 지갑에서 만든 키에는 [등록자](/ko/glossary/registrant/)가 다른 도메인에 대한 쓰기 권한이 없습니다.

생성된 키는 `nfk_` 접두사가 붙은 문자열입니다. 모든 쓰기 작업에서 이 키를 `x-api-key` 헤더로 전달합니다. 가용성 확인 같은 읽기 전용 작업에는 키가 전혀 필요하지 않습니다.

## 2단계: Claude를 Namefi MCP 서버에 연결하기

ICANN 공인 [등록대행자](/ko/glossary/registrar/)인 Namefi는 전체 API 기능을 위한 단일 MCP 서버를 `https://api.namefi.io/mcp`에서 운영하며, Streamable HTTP 전송 방식으로 접속할 수 있습니다. 서버는 검색, 등록, DNS, 도메인 설정, 아웃바운드를 포함한 모든 `/v-next` 작업을 타입이 지정된 도구로 제공합니다. 서버의 존재와 연결 정보는 [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)에 서버 검색용 설명 파일로도 공개되어 있습니다. 이 정보는 기계가 읽을 수 있으므로 사람이 URL을 먼저 붙여 넣지 않아도 에이전트가 서버를 찾을 수 있습니다.

### Claude Code

Claude Code에 서버를 추가하려면 명령 하나만 실행하면 됩니다.

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

이 명령은 사용자 지정 인증 헤더를 사용하는 원격 HTTP MCP 서버를 추가하는 [Claude Code 공식 문법](https://code.claude.com/docs/en/mcp)을 따릅니다. 일반적인 패턴은 `claude mcp add --transport http <name> <url> --header "<Header-Name>: <value>"`입니다. 터미널에서 한 번 실행하되 `YOUR_KEY`를 1단계에서 발급한 키로 바꾸세요. 그러면 Claude Code가 프로젝트 또는 사용자 MCP 설정에 서버를 기록합니다. 기본적으로 이 명령은 현재 프로젝트에만 서버를 등록합니다. 모든 프로젝트에서 사용하려면 `--scope user`를 추가하세요. 우선 가용성 검색 같은 읽기 전용 도구만 필요하다면 키를 생략하고 나중에 추가해도 됩니다.

`claude mcp list`를 실행해 연결을 확인하세요. `namefi`가 연결됨으로 표시되어야 합니다. Claude Code 세션 안에서 `/mcp`를 실행하면 Namefi 서버가 제공하는 도구 수를 확인할 수 있습니다.

### Claude Desktop 및 claude.ai

Claude Desktop과 claude.ai는 **Custom Connectors**를 통해 원격 MCP 서버에 연결합니다. 관련 절차는 [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers)에 설명되어 있습니다. Settings를 열고 Connectors로 이동한 다음 “Add custom connector”를 선택하고 서버 URL `https://api.namefi.io/mcp`를 입력하세요. Add를 클릭하면 인증을 완료하라는 안내가 표시됩니다. Anthropic 문서에 따르면 이 단계는 서버 요구 사항에 따라 “일반적으로 OAuth, API 키 또는 사용자 이름/비밀번호 조합을 사용”하며, Claude가 해당 서버가 요구하는 입력 화면을 표시합니다.

<!-- TODO: 팀 확인 필요 — Claude Desktop의 Custom Connector 인증 화면에서 x-api-key 방식 헤더를 입력할 때 표시되는 정확한 필드. Anthropic 공개 문서는 일반적인 인증 단계만 설명하며 Namefi 서버 화면은 구체적으로 보여 주지 않음 --> Desktop 커넥터 설정에서 키를 입력할 위치가 명확히 보이지 않는다면, 현재로서는 Claude Code가 검증된 방법입니다. 읽기 전용 도구(가용성 검색)는 키 없이도 커넥터에서 작동합니다.

## 3단계: NFSC 잔액 충전하기

도메인 등록은 유료 작업이며 결제 지갑에 NFSC(Namefi Service Credits)가 있어야 합니다. 개발 또는 테스트 환경에서는 파우셋(`POST /v-next/user/faucet`, SDK에서는 `client.user.requestNfscFaucet()`)이 지갑별 요청 횟수 제한과 함께 무료 테스트 크레딧을 제공합니다. 프로덕션에서는 Namefi 대시보드를 통해 NFSC를 충전합니다. <!-- TODO: 팀 확인 필요 — 정확한 프로덕션 충전 절차, 지원 결제 수단, 채팅에서 직접 구매할 수 있는지 또는 대시보드 UI에서만 가능한지 --> 현재 잔액은 언제든 확인할 수 있습니다. 연결 후 Claude에게 “내 Namefi 잔액이 얼마야?”라고 물어보거나 `GET /v-next/balance`를 직접 호출하세요.

## 4단계: 대화로 구매하기

MCP 서버가 연결되어 있고 잔액이 충전되었다면 이후 과정은 모두 일상적인 말로 진행됩니다. 다음은 각 단계에서 Namefi API 문서가 명시한 기본 작업과 연결해 설명한 대화 예시입니다.

**1. Claude에게 이름의 가용성을 확인해 달라고 요청합니다.**

> “`example.com`을 등록할 수 있어?”

Claude는 가용성 확인 작업(`checkAvailability`, `GET /v-next/search/availability?domain=example.com`에서 직접 호출 가능, 인증 불필요)을 호출합니다. 이름을 사용할 수 있는지 알려 주며, 여러 후보를 비교하도록 요청하면 일괄 가용성 기능을 통해 한 번에 확인할 수도 있습니다.

**2. 확인한 뒤 등록합니다.**

> “일 년 동안 등록하고 DNS를 설정해서 `@`가 203.0.113.10을 가리키게 해 줘.”

Claude는 등록 주문(`registerDomain`, `POST /v-next/orders/register-domain`)을 제출합니다. DNS 레코드도 함께 요청했다면 결합된 `register-domain/records` 방식을 사용해 주문이 완료되는 즉시 요청한 [A 레코드](/ko/glossary/dns-record-types/)를 적용합니다. 요청 본문에는 `normalizedDomainName`(소문자, 끝에 점 없음, `search/availability`에서 등록 가능하다고 보고한 모든 [TLD](/ko/glossary/tld/))과 `durationInYears`(0–10, 기본값 1)가 포함됩니다. 선택 항목인 `nftReceivingWallet`은 토큰화 대상을 지정합니다. 이를 생략하면 도메인은 API 키에 연결된 지갑으로 Base에서 NFT로 등록됩니다. `domainSetupOptions` 객체에는 `autoRenew`, `dnssec`, `keepExistingNameservers` 같은 도메인별 추가 설정이 정의되어 있습니다. 마지막 옵션을 사용하면 현재 설정된 [네임서버](/ko/glossary/nameserver/) 위임을 변경하지 않고 Claude가 도메인을 등록할 수 있습니다.

**3. Claude가 주문이 완료될 때까지 상태를 확인합니다.**

등록은 비동기 방식입니다. Claude(또는 상태를 직접 확인하는 사용자)는 주문이 종료 상태인 `SUCCEEDED`, `FAILED`, `CANCELLED`, `PARTIALLY_COMPLETED` 중 하나에 도달할 때까지 `getOrder`(`GET /v-next/orders/{orderId}`)를 폴링합니다. 일반적인 등록은 몇 차례 폴링하면 완료됩니다. Claude는 사용자가 로딩 표시를 계속 지켜보게 두지 않고, 완료되면 결과를 알려 줍니다.

**4. 처음에 모두 설정하지 않았다면 DNS 레코드를 추가로 요청합니다.**

> “`www`가 `cname.vercel-dns.com.`을 가리키는 CNAME을 추가하고, `_verify` 아래에는 이 토큰이 포함된 TXT 레코드도 추가해 줘.”

Claude는 각 레코드마다 `createDnsRecord`(`POST /v-next/dns/records`)를 호출합니다. 요청하기 전에 알아 두어야 할 형식 규칙이 두 가지 있습니다. [CNAME](/ko/glossary/dns-record-types/) 및 유사한 레코드 유형의 `rdata`는 반드시 끝에 점이 있어야 하지만(`cname.vercel-dns.com.`), 도메인 자체인 `zoneName`에는 점이 없어야 합니다. 이를 반대로 입력하는 것이 이 과정에서 검증 오류가 발생하는 가장 흔한 원인입니다.

**5. 선택 사항: 자동 갱신을 켭니다.**

> “이 도메인의 자동 갱신을 켜 줘.”

Claude는 `PUT /v-next/domain-config/auto-renew`를 통해 [자동 갱신](/ko/glossary/domain-renewal/)을 설정합니다. 이 기능을 켜면 소유자 지갑에서 사용할 수 있는 결제 수단으로 만료 전에 도메인이 자동 갱신됩니다. 이는 일회성 확인이 아니라 지속적인 승인이라는 점을 알아 두세요.

## 5단계: 도메인 연결 확인하기

[DNS 전파](/ko/glossary/dns-propagation/)에는 시간이 걸리므로 몇 분 후 레코드를 확인하세요. DNS 조회에는 인증이 필요하지 않습니다. 사용자 또는 Claude가 `GET /v-next/dns/records?zoneName=example.com`이나 공개 DNS 조회 도구를 사용해 실제 적용 상태를 확인할 수 있습니다. 도메인이 배포 플랫폼을 가리키도록 설정했다면, 해당 플랫폼이 요구한 TXT 레코드를 확인하는 도메인 검증 단계도 별도로 완료하는 것이 좋습니다.

## API 키 대신 지갑으로 결제하기

위의 모든 절차는 API 키 방식을 사용합니다. Namefi는 [x402](/ko/glossary/x402/) 프로토콜을 통해 Namefi 계정 없이 암호화폐 지갑만으로 도메인을 등록하는 방법도 지원합니다. 구매자의 지갑이 EIP-3009 승인에 서명하고, 결제가 첨부되지 않은 경우 API가 가격과 함께 `402 Payment Required`로 응답하며, 유효한 결제가 도착하면 등록을 처리합니다. 이 절차는 각주가 아니라 별도의 가이드가 필요할 만큼 자세한 내용이 있습니다. 전체 과정은 [암호화폐 지갑으로 도메인 결제하기: 계정 불필요](/ko/blog/wallet-checkout/) 또는 [Namefi에서 AI 에이전트로 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)의 결제 섹션을 참조하세요.

## 문제 해결

| 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| 쓰기 호출에서 `401 UNAUTHORIZED` 발생 | API 키가 유효하지 않거나 만료되었거나, 도메인을 소유하지 않은 지갑에서 생성됨 | 도메인을 소유한(또는 소유하게 될) 지갑을 사용하여 [namefi.io/api-key](https://namefi.io/api-key)에서 새 키 생성 |
| `403 FORBIDDEN` | 키는 유효하지만 연결된 지갑이 이 특정 도메인을 소유하지 않음 | 다시 시도하기 전에 Namefi 계정에서 소유권 확인 |
| 등록 주문이 종료되지 않은 상태에 머무름 | 정상적인 상황 — 등록은 비동기 방식 | `getOrder` 폴링을 계속 진행. Namefi 자체 예시는 5초마다 폴링함. `SUCCEEDED`, `FAILED`, `CANCELLED`, `PARTIALLY_COMPLETED` 중 하나에 도달하지 않을 때만 중단된 것으로 판단 |
| DNS 레코드 생성/수정이 검증 오류로 거부됨 | `zoneName` 끝에 점이 있거나 CNAME/MX/NS `rdata` 값 끝에 점이 없음 | `zoneName` = 끝에 점 없음, FQDN 유형 `rdata` 값 = 끝에 점 필수 |
| 등록이 즉시 실패함 | 결제 지갑의 NFSC 잔액 부족 | 잔액 확인(`GET /v-next/balance`) 후 파우셋(테스트) 또는 Namefi 대시보드(프로덕션)에서 충전 |
| Claude가 사용할 수 있는 도메인 도구가 없다고 말함 | MCP 서버가 연결되지 않았거나 쓰기 작업에 필요한 헤더 없이 연결됨 | `--header` 플래그를 넣어 `claude mcp add`를 다시 실행하거나 `/mcp` 또는 `claude mcp list`에서 연결 상태 확인 |

## 자주 묻는 질문

### 이 기능을 사용하려면 Namefi REST API를 알아야 하나요, 아니면 Claude에게 일상적인 말로 요청하면 되나요?
위의 모든 과정은 일상적인 말만으로 충분합니다. “이 도메인을 사용할 수 있어?”, “등록해 줘”, “이 IP를 가리키게 해 줘”처럼 직접 요청하면 됩니다. 이 가이드에 엔드포인트와 요청 필드를 문서화한 이유는 내부적으로 Claude가 무엇을 하는지 확인하거나, 대화 대신 스크립트를 작성할 때 직접 호출할 수 있도록 하기 위해서입니다.

### Claude를 통해 등록하면 Namefi 웹사이트에서 등록할 때보다 비용이 더 드나요?
이 가이드는 어느 쪽이 더 저렴한지 단정하지 않습니다. <!-- TODO: 팀 확인 필요 — Namefi MCP/API 가격이 표준 등록 가격과 같은지 또는 다른지 --> 어느 경로든 브라우저, 스크립트 또는 MCP 도구 호출 중 어디에서 요청했는지와 관계없이 등록 비용은 동일한 NFSC 잔액에서 차감됩니다.

### 이 방법으로 등록하면 도메인이 자동으로 NFT로 토큰화되나요?
기본 설정에서는 그렇습니다. 등록 요청에서 `nftReceivingWallet`을 지정하지 않으면 도메인이 API 키에 연결된 지갑으로 Base에서 NFT로 등록됩니다. 등록 시 다른 지갑이나 체인으로 보낼 수도 있습니다.

### Claude의 DNS 레코드 요청에 오타가 있으면 도메인이 모르게 망가질 수 있나요?
DNS 쓰기 요청은 적용되기 전에 Namefi 검증을 거칩니다. 잘못된 `rdata`(예: CNAME 대상 끝에 점이 없음)는 조용히 승인되지 않고 오류로 거부됩니다. 위의 문제 해결 표를 참조하세요. 그래도 운영 중인 도메인의 DNS 변경은 다른 인프라 변경과 마찬가지로 다뤄야 합니다. 승인하기 전에 Claude가 제출하려는 내용을 검토하세요.

### Claude 대신 Cursor나 Windsurf에서도 같은 MCP 서버를 사용할 수 있나요?
네. Namefi 서버는 연결하는 클라이언트와 관계없이 동일한 개방형 MCP 프로토콜을 사용하므로 서버 측은 달라지지 않습니다. 편집기마다 클라이언트 연결 명령은 다릅니다. [Namefi에서 AI 에이전트로 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)의 클라이언트별 설정 섹션이나 더 짧은 [Namefi MCP 빠른 시작: Claude Code, Cursor 및 Windsurf](/ko/blog/mcp-quickstart/)를 참조하세요.

## 대화로 다음 도메인을 구매하세요

이 방식은 가상이 아니라 현재 Namefi가 실제로 지원하는 설정입니다. MCP 서버를 연결하고 나면 이름 검색과 등록, DNS 설정, 선택 사항인 지갑에 보관되는 토큰으로의 전환까지 채팅을 벗어나지 않고 처리할 수 있습니다. MCP 서버는 등록 외에도 아웃바운드 잠재 고객 발굴, 일괄 DNS 작업, 도메인 설정 등을 제공합니다. 연결이 완료되면 같은 접속을 통해 모두 검색할 수 있습니다. 전체 도구 목록은 [Namefi MCP 서버: AI 에이전트용 도메인 도구](/ko/blog/namefi-mcp/)에서 확인하세요.

**[Namefi API 키를 생성하고 Claude 연결하기](https://namefi.io/api-key).**

## 출처 및 추가 자료

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP 서버 URL, 전송 방식, 인증, 등록 및 DNS 엔드포인트 — 이 가이드의 주요 출처)
- Namefi — [docs.namefi.io: 인증](https://docs.namefi.io/docs/02-authentication.mdx) (API 키, EIP-712 및 SIWE 인증 방식과 작업별 인증 요구 사항)
- Namefi — [docs.namefi.io: 도메인 등록](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (SDK, fetch, cURL, Python으로 작성된 등록 및 폴링 예시)
- Namefi — [docs.namefi.io: 잔액 관리](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC 파우셋 및 잔액 확인 엔드포인트)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP 서버 검색용 설명 파일)
- Anthropic / Claude Code — [MCP로 Claude Code를 도구에 연결하기](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (`claude mcp add --transport http` 문법, 헤더 인증, 범위 플래그)
- Model Context Protocol — [원격 MCP 서버에 연결하기](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (Claude Desktop 및 claude.ai의 Custom Connectors 절차)
- Model Context Protocol — [Model Context Protocol이란?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (프로토콜 개요)
- llmstxt.org — [/llms.txt 파일](https://llmstxt.org) (namefi.io/llms.txt가 따르는 검색 파일 이름의 사양과 근거)
- dev.to — [사람 없이 AI 에이전트로 도메인 이름을 등록하는 방법](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) (Cloudflare 기반의 다른 등록대행자 리셀러가 구축한 서드파티 MCP 튜토리얼)
