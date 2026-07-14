---
title: "AI 에이전트로 Namefi에서 도메인을 등록하는 방법"
date: '2026-07-10'
language: 'ko'
tags: ['ai-agents', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/ai-agent-register-og.jpg
description: "Claude, Codex, Cursor 등 어떤 AI 에이전트로든 MCP, REST 또는 지갑 결제를 통해 Namefi에서 도메인을 등록하는 표준 가이드입니다."
keywords: ["AI 에이전트 도메인 등록", "Namefi 튜토리얼", "Claude 도메인 등록", "Codex 도메인 등록", "Cursor MCP 도메인", "Windsurf MCP 도메인", "Gemini CLI MCP 도메인", "에이전트 도메인 등록 방법", "x-api-key", "MCP 서버", "지갑 결제", "Namefi MCP 도메인 등록", "AI 에이전트 Namefi 도메인 구매", "도메인 등록 MCP 튜토리얼"]
relatedArticles:
  - /ko/blog/claude-mcp-domains/
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
  - /ko/glossary/wallet/
  - /ko/glossary/x402/
  - /ko/glossary/tokenized-domain/
---

[AI 에이전트](/ko/glossary/ai-agent/), 즉 특정 업체의 제품에 한정되지 않은 어떤 AI 에이전트로든 [ICANN](/ko/glossary/icann/) 인증 [등록대행자](/ko/glossary/registrar/)인 [Namefi](https://namefi.io)에서 실제 도메인을 등록하려 한다면 이 페이지 하나를 북마크해 두세요. 어떤 클라이언트에 입력하든 달라지지 않는 작동 원리를 설명한 다음, 오늘날 사람들이 실제로 사용하는 여섯 가지 에이전트인 Claude Desktop, Claude Code, OpenAI Codex, Cursor, Windsurf, Gemini CLI의 정확하고 개별적으로 검증된 설정 절차를 제공합니다. 사용하는 에이전트가 이 목록에 없더라도 괜찮습니다. HTTP 요청을 보낼 수 있는 모든 도구에서 작동하는 원시 REST 방식으로 가이드를 마무리합니다. 바로 이런 용도를 위해 Namefi의 전체 API도 일반 텍스트로 공개되어 있기 때문입니다.

이 가이드는 Namefi 팀이 직접 작성하고 관리합니다. 따라서 모든 단계에서 Namefi와 관련된 부분은 직접 제공된 자료를 바탕으로 하며, 에이전트용으로 [namefi.io/llms.txt](https://namefi.io/llms.txt)와 [docs.namefi.io](https://docs.namefi.io)에 공개한 것과 같은 API를 사람이 읽기 쉬운 형태로 안내합니다. 각 에이전트 업체의 설정은 이 가이드의 게시일을 기준으로 해당 업체의 최신 공식 문서와 대조해 검증했습니다. 업체 문서에서 명확한 답을 제공하지 않는 부분은 추측으로 채우지 않고 명시적으로 표시했습니다.

이미 Claude를 사용하기로 했고 실제 대화 기록이 포함된 전체 주석형 안내를 원한다면 [Claude로 도메인 구매하기: Namefi MCP 단계별 가이드](/ko/blog/claude-mcp-domains/)에서 여기의 요약된 Claude 절보다 더 깊이 살펴볼 수 있습니다. 이 페이지가 허브라면 해당 가이드와 곳곳의 다른 링크는 허브에서 뻗어 나가는 바퀴살입니다.

## "AI 에이전트로 도메인을 등록한다"는 말의 실제 의미

직접 양식을 작성하지 않고 에이전트가 사용자를 대신해 도메인을 등록하려면 두 가지 조건이 충족되어야 합니다. 첫째, 에이전트가 Namefi API를 *발견하고 호출할 방법*이 필요합니다. 여기에는 AI 클라이언트가 외부 도구 서버에 연결해 호출 가능한 작업 목록을 확인할 수 있게 하는 개방형 표준인 [Model Context Protocol](https://modelcontextprotocol.io)(MCP)을 사용하거나, 대화형이 아닌 스크립트형 에이전트라면 일반 HTTP 요청을 사용하는 방법이 있습니다. 둘째, 에이전트에 *지출 권한*이 필요합니다. 자금이 충전된 잔액에 연결된 API 키나 즉석에서 결제에 서명할 수 있는 암호화폐 [지갑](/ko/glossary/wallet/)이 이에 해당합니다. 이 가이드의 모든 내용은 이 두 요소 중 하나를 다룹니다.

Namefi는 전체 API에 대해 `https://api.namefi.io/mcp`에서 Streamable HTTP 전송 방식으로 단일 MCP 서버를 운영합니다. 에이전트 또는 이를 설정하는 사람은 이 페이지를 전혀 읽지 않고도 서버를 찾을 수 있습니다. [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)에 서버 이름을 `namefi-api`, 전송 방식을 `streamable-http`로 명시한 기계 판독형 설명자를 공개하고 있기 때문입니다. 아래의 모든 클라이언트는 같은 URL에 연결됩니다. 차이는 각 클라이언트의 설정 파일이나 명령줄에서 해당 URL을 지정하는 방식뿐입니다.

## 공통 다섯 단계 흐름

아래쪽의 에이전트별 절은 모두 다음 순서를 따릅니다. 여기서 흐름을 이해하고 나면 에이전트별 안내는 결국 "이 도구에서는 2단계를 어떻게 실행하는가"를 설명하는 내용입니다.

1. **인증 정보를 준비합니다.** 등록, DNS 레코드 생성, 업데이트, 삭제 등 모든 작업에 사용할 수 있는 `nfk_` 접두사 문자열인 [API 키](https://namefi.io/api-key)를 생성합니다. 키는 이를 생성한 지갑의 권한을 상속하므로, 도메인을 소유할 지갑에서 키를 만드세요. Namefi API 키를 전혀 보유하고 싶지 않다면 아래의 지갑 결제 방식으로 건너뛰세요. 이 방식에는 계정이 필요하지 않습니다.
2. **에이전트를 MCP 서버에 연결합니다.** 키를 담은 `x-api-key` 헤더와 함께 클라이언트가 `https://api.namefi.io/mcp`를 가리키도록 설정합니다. 정확한 문법은 클라이언트마다 다르므로 아래의 해당 에이전트 절을 참고하세요.
3. **검색하고 가격을 확인합니다.** 원하는 이름을 등록할 수 있는지 자연어로 물어봅니다. 그러면 인증이 전혀 필요 없는 `checkAvailability` 작업(`GET /v-next/search/availability?domain=…`)이 호출됩니다. 여러 후보를 한꺼번에 선별하려면 일괄 처리형 작업을 사용할 수도 있습니다.
4. **등록한 뒤 상태를 조회합니다.** 사용자가 확인하면 에이전트가 `registerDomain`(`POST /v-next/orders/register-domain`)을 제출합니다. 같은 호출에서 DNS까지 설정하려면 결합형 `register-domain/records` 방식을 사용합니다. 등록은 비동기 방식입니다. 요청 본문에는 `normalizedDomainName`과 `durationInYears`가 들어가며, `register-domain/records` 엔드포인트는 여기에 `records` 배열(레코드별 `name`, `type`, `rdata`, `ttl`)도 받으므로 주문이 완료되는 즉시 DNS가 기록됩니다. 에이전트 또는 사용자는 `getOrder`(`GET /v-next/orders/{orderId}`)를 호출해 `SUCCEEDED`, `FAILED`, `CANCELLED`, `PARTIALLY_COMPLETED` 중 하나의 최종 상태에 도달할 때까지 조회합니다.
5. **DNS를 설정하고 확인합니다.** `createDnsRecord`(`POST /v-next/dns/records`)를 통해 [DNS 레코드](/ko/glossary/dns-record-types/)를 추가하거나 조정하고, 필요한 경우 [네임서버](/ko/glossary/nameserver/) 수준의 위임을 지정한 다음, 도메인 해석 여부를 확인하기 전에 [DNS 전파](/ko/glossary/dns-propagation/)가 이루어지도록 몇 분 기다립니다.

등록 요청은 도메인별 재정의를 위한 `domainSetupOptions` 객체도 받습니다. 여기에는 `autoPark`, `autoEns`, `autoRenew`, `dnssec`, `keepExistingNameservers`가 있습니다. 마지막 필드는 Namefi가 도메인의 기존 네임서버 위임을 다른 곳으로 다시 지정하지 않고 그대로 두도록 합니다. 등록 직후에도 다른 곳을 계속 가리켜야 하는 도메인에 유용합니다. 선택 사항인 `nftReceivingWallet` 필드는 도메인의 소유권 토큰을 받을 곳을 결정합니다. 생략하면 도메인은 API 키에 연결된 지갑을 소유자로 하여 Base에서 NFT로 등록됩니다.

## 에이전트별 설정 비교표

| 에이전트 | 연결 방식 | 설정 파일 위치 | 사용자 지정 인증 헤더 지원 | 검증 기준 |
| --- | --- | --- | --- | --- |
| Claude Code | MCP, Streamable HTTP | `claude mcp add` CLI 명령(`~/.claude.json` 또는 `.mcp.json`에 기록) | 지원 — `--header` 플래그 | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp), 2026-07-10 검증 |
| Claude Desktop / claude.ai | 사용자 지정 커넥터를 통한 MCP, Streamable HTTP | 설정 → 커넥터 → 사용자 지정 커넥터 추가 | 서버가 인증 안내를 제공(OAuth, API 키 또는 서버가 요구하는 인증 정보) | [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers), 2026-07-10 검증 |
| OpenAI Codex CLI | MCP, Streamable HTTP | `~/.codex/config.toml`의 `[mcp_servers.<name>]` 테이블 | 지원 — `http_headers`(정적) 또는 `env_http_headers`(환경 변수) | [learn.chatgpt.com/docs/extend/mcp](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)(현재 `developers.openai.com/codex/mcp`의 리디렉션 대상), 2026-07-10 검증 |
| Cursor | MCP, Streamable HTTP | `.cursor/mcp.json`(프로젝트) 또는 `~/.cursor/mcp.json`(전역) | 지원 — `${env:VAR}` 보간을 사용하는 `headers` 객체 | [cursor.com/docs/mcp](https://cursor.com/docs/mcp), 2026-07-10 검증 |
| Windsurf(Cascade) | MCP, Streamable HTTP | `~/.codeium/windsurf/mcp_config.json` | 지원 — `serverUrl` 항목의 `headers` 객체와 `${env:VAR}` 보간 | [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp)(이 가이드 게시일 현재 `docs.devin.ai/desktop/cascade/mcp`로 리디렉션됨. 아래 Windsurf 절 참고), 2026-07-10 검증 |
| Gemini CLI | MCP, Streamable HTTP | `~/.gemini/settings.json`(사용자) 또는 `.gemini/settings.json`(프로젝트) | 지원 — `httpUrl` 항목의 `headers` 객체 | [geminicli.com/docs/tools/mcp-server](https://geminicli.com/docs/tools/mcp-server/), 2026-07-10 검증 |
| 기타 MCP 클라이언트 | MCP, Streamable HTTP | 해당 클라이언트 문서에 명시된 설정 형식 | 클라이언트에 따라 다름 — Namefi 서버 측은 변하지 않음 | [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) |
| 스크립트 또는 비 MCP 에이전트 | 원시 REST | 해당 없음 — 직접 HTTPS 호출 | 지원 — 모든 쓰기 호출의 `x-api-key` 헤더 | [namefi.io/llms.txt](https://namefi.io/llms.txt), [docs.namefi.io](https://docs.namefi.io) |

위의 모든 행은 동일한 서버와 동일한 작업 집합에 연결됩니다. 에이전트마다 달라지는 것은 해당 클라이언트에 "여기에 원격 MCP 서버가 있고 이 헤더를 함께 보내야 한다"고 알려 주는 문법뿐입니다.

**항상 같은 테스트 프롬프트를 사용하세요.** 아래에서 각 에이전트를 연결한 뒤 다음과 정확히 같은 프롬프트를 실행하면 클라이언트별 결과를 비교할 수 있습니다.

> "Namefi에서 `example.com`을 등록할 수 있는지 확인하고, 이를 알아보기 위해 어떤 도구 또는 작업을 호출했는지 알려 줘. 아직 아무것도 등록하지 마."

이는 읽기 전용 호출입니다. `checkAvailability`에는 인증이 필요하지 않으므로 자금을 충전하기 전이라도 새로 연결한 에이전트에서 안전하게 실행할 수 있으며, 연결과 도구 목록이 정상인지 즉시 알 수 있습니다.

## Claude Desktop과 claude.ai

Claude Desktop과 claude.ai는 **사용자 지정 커넥터**를 통해 원격 MCP 서버에 연결합니다. 설정을 열고 커넥터로 이동한 뒤 "사용자 지정 커넥터 추가"를 선택하고 서버 URL로 `https://api.namefi.io/mcp`를 입력하세요. 추가를 클릭하면 Claude가 인증 완료를 안내합니다. Anthropic 문서에 따르면 이 단계에는 일반적으로 "OAuth, API 키 또는 사용자 이름/비밀번호 조합"이 사용되며, 정확한 입력 항목은 연결된 서버의 요구 사항에 따라 결정됩니다.

<!-- TODO: verify — the exact field Claude Desktop's Custom Connector screen presents for an x-api-key-style header --> Desktop 설정에 키를 붙여 넣을 명확한 입력란이 보이지 않는다면, 현재 쓰기 작업에 대해 검증된 방식은 다음 절의 Claude Code입니다. 이용 가능 여부 검색 같은 읽기 전용 도구는 키 없이도 커넥터를 통해 작동합니다. 연결 후 커넥터 흐름을 포함한 전체 안내는 [Claude로 도메인 구매하기: Namefi MCP 단계별 가이드](/ko/blog/claude-mcp-domains/)를 참고하세요.

## Claude Code

Claude Code의 공식 문서는 사용자 지정 헤더가 있는 원격 HTTP MCP 서버를 추가하는 정확한 범용 문법을 제공합니다.

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

터미널에서 실제 키로 바꿔 한 번 실행하세요. 기본적으로 서버는 **local** 범위, 즉 현재 프로젝트 안에서 사용자 본인만 사용할 수 있도록 기록됩니다. 이전 Claude Code 버전에서는 이 범위를 "project"라고 불렀습니다. 컴퓨터의 모든 프로젝트에서 연결을 사용하려면 `--scope user`를 추가하고, 커밋된 `.mcp.json` 파일을 통해 프로젝트의 모든 구성원과 공유하려면 `--scope project`를 추가합니다. `claude mcp list`로 연결을 확인하고, 세션 안에서 `/mcp`를 실행해 실시간 도구 수를 확인하세요.

## OpenAI Codex CLI

Codex CLI는 기본적으로 `~/.codex/config.toml`에 MCP 설정을 저장하며, 신뢰할 수 있는 프로젝트에서는 프로젝트 범위의 `.codex/config.toml`을 사용할 수도 있습니다. 서버마다 별도의 테이블이 있고, 전송 방식은 포함된 키에 따라 추론됩니다. `command` 키는 로컬 stdio 서버를, `url` 키는 Streamable HTTP를 뜻합니다. Codex 문서는 테이블 이름에 밑줄이 포함된 `mcp_servers`를 사용해야 한다고 명시합니다. `mcp-servers` 같은 변형은 아무 경고 없이 무시됩니다.

```toml
# ~/.codex/config.toml
[mcp_servers.namefi]
url = "https://api.namefi.io/mcp"
env_http_headers = { "x-api-key" = "NAMEFI_API_KEY" }
```

이 형식은 키를 파일에 기록하지 않고 `NAMEFI_API_KEY`라는 환경 변수에서 가져옵니다. Codex를 실행하기 전에 셸에서 해당 변수를 설정하세요. 키를 직접 기록하고 싶다면(커밋할 가능성이 있는 파일에는 권장하지 않음) 이에 해당하는 정적 형식은 `http_headers = { "x-api-key" = "YOUR_KEY" }`입니다. Codex는 `Authorization: Bearer …` 형식의 인증을 위한 `bearer_token_env_var` 필드도 별도로 문서화하지만, Namefi의 `x-api-key` 헤더에는 Bearer 전용 필드가 아니라 범용 `http_headers` 또는 `env_http_headers` 필드를 사용해야 합니다.

## Cursor

Cursor는 프로젝트 범위에서는 저장소 루트의 `.cursor/mcp.json`, 전역 범위에서는 어디서나 적용되는 `~/.cursor/mcp.json`의 `mcp.json` 서버 정의를 읽습니다. Cursor 문서는 헤더 기반 인증과 환경 변수 보간을 포함한 원격 서버 형식을 직접 제공하므로 키 자체를 파일에 넣지 않아도 됩니다.

```json
{
  "mcpServers": {
    "namefi": {
      "url": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

`${env:NAMEFI_API_KEY}`는 연결 시점에 해당 환경 변수에 들어 있는 값으로 해석됩니다. 같은 설정의 요약본은 [Namefi MCP 빠른 시작: Claude Code, Cursor 및 Windsurf](/ko/blog/mcp-quickstart/)를 참고하세요.

## Windsurf(Cascade)

제품 내에서 **Cascade**라는 이름으로 제공되는 Windsurf의 MCP 통합은 `~/.codeium/windsurf/mcp_config.json`에서 서버 목록을 읽습니다. 원격 HTTP 서버는 `command`가 아니라 `serverUrl` 필드를 사용하며, Cursor와 같은 종류의 `headers` 객체 및 `${env:VAR}` 보간을 함께 사용합니다.

```json
{
  "mcpServers": {
    "namefi": {
      "serverUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

한 가지는 분명히 짚고 넘어갈 필요가 있습니다. 이 가이드 게시일 현재 `docs.windsurf.com/windsurf/cascade/mcp`는 `docs.devin.ai/desktop/cascade/mcp`로 리디렉션됩니다. Windsurf 문서는 현재 Cognition의 Devin 제품 문서 도메인에 있으며, 페이지에서는 "Devin Desktop"과 함께 "Windsurf"와 "Cascade"를 모두 언급합니다. 위의 설정 형식은 해당 최신 페이지에 문서화된 내용입니다. 이전 Windsurf 빌드를 사용 중이라면 필드 이름은 같아야 하지만, 현재 버전의 앱 내 도움말이 연결하는 문서를 확인하세요.

## Gemini CLI

Gemini CLI는 사용자 수준의 `~/.gemini/settings.json` 또는 해당 프로젝트 안에서만 적용되는 프로젝트 수준의 `.gemini/settings.json`에서 MCP 서버 설정을 읽습니다. 원격 서버 형식에서는 `url` 대신 `httpUrl`을 사용합니다.

```json
{
  "mcpServers": {
    "namefi": {
      "httpUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "YOUR_KEY"
      }
    }
  }
}
```

Gemini CLI 문서에는 특정 도구 호출에 평소보다 긴 시간이 필요할 때 사용할 수 있는 `timeout` 필드도 명시되어 있습니다. 단위는 밀리초이고 기본값은 600,000입니다. 클라이언트는 전체 조회 반복 과정이 아니라 개별 호출 하나가 끝나기만 기다리므로 등록 상태 조회에 이 필드는 필요하지 않을 것입니다.

## 기타 MCP 지원 에이전트

사용하는 에이전트가 위 여섯 가지에 포함되지 않더라도 MCP를 지원한다면 클라이언트와 관계없이 서버 측은 동일합니다. Streamable HTTP를 통해 `https://api.namefi.io/mcp`를 가리키고 사용자 지정 헤더에 `x-api-key: YOUR_KEY`를 넣으세요. 구체적인 설정 파일이나 명령 문법은 해당 클라이언트의 문서를 확인하세요. [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)의 검색 설명자는 에이전트 또는 이를 설정하는 사람이 직접 붙여 넣지 않고도 서버 URL, 전송 방식, 인증 요구 사항을 찾을 수 있도록 존재합니다.

클라이언트가 원격 HTTP 또는 SSE를 직접 지원하지 않고 **로컬(stdio) MCP 서버**만 지원하는 경우 알아둘 만한 방식이 하나 있습니다. 커뮤니티의 `mcp-remote` 패키지는 원격 Streamable HTTP 서버를 클라이언트가 일반적으로 실행할 수 있는 로컬 프로세스에 연결하고, 설정한 헤더를 전달합니다. 이는 Namefi가 공개한 방식이 아니라 외부 커뮤니티의 브리지이므로 Namefi 자체 문서를 기준으로 검증할 수 있는 것은 아닙니다. 특정 클라이언트가 원격 HTTP를 실제로 기본 지원하지 않을 때만 대안으로 취급하고, 기본 방식으로 사용하지 마세요. <!-- TODO: verify — an exact mcp-remote invocation for Namefi's server if a client without native Streamable HTTP support needs it -->

## MCP가 전혀 없는 경우: 원시 REST 방식

위에서 설명한 모든 작업은 일반 HTTPS 엔드포인트로도 제공되며, [namefi.io/llms.txt](https://namefi.io/llms.txt)에 엔드포인트별로, [docs.namefi.io](https://docs.namefi.io)에 전체 내용이 문서화되어 있습니다. HTTP 호출은 가능하지만 MCP를 사용하지 않는 에이전트 프레임워크, 즉 사용자 지정 스크립트, 다른 에이전트 런타임, CI 작업도 같은 흐름을 직접 실행할 수 있습니다.

```bash
# 1. Check availability (no auth required)
curl "https://api.namefi.io/v-next/search/availability?domain=example.com"

# 2. Register (requires x-api-key)
curl -X POST "https://api.namefi.io/v-next/orders/register-domain" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"normalizedDomainName": "example.com", "durationInYears": 1}'

# 3. Poll the order until it reaches a terminal status
curl "https://api.namefi.io/v-next/orders/{orderId}" \
  -H "x-api-key: YOUR_KEY"
```

llms.txt는 AI 에이전트가 렌더링된 문서 페이지를 크롤링하지 않고도 API가 하는 일을 알아낼 수 있도록 사이트 루트에 공개하는 기계 판독형 일반 텍스트 색인 규약입니다. 요약본이 아니라 전체 버전을 보고 싶다면 Namefi의 파일은 짧으므로 [namefi.io/llms.txt](https://namefi.io/llms.txt)에서 직접 읽을 수 있습니다. 규약 자체에 관한 자세한 내용은 [도메인을 위한 llms.txt: 모든 AI 에이전트가 읽을 수 있는 API](/ko/blog/llms-txt/)를 참고하세요.

## 결제: API 키와 지갑 결제 비교

위 절의 모든 내용은 자금이 충전된 NFSC(Namefi Service Credit) 잔액에 청구되는 API 키를 전제로 합니다. 언제든 `GET /v-next/balance`(`x-api-key` 필요)에서 잔액을 확인하고, 개발 환경에서는 파우셋 엔드포인트로, 프로덕션에서는 Namefi 대시보드에서 충전할 수 있습니다. <!-- TODO: confirm with team — the exact production NFSC top-up flow: accepted payment methods, and whether it's purchasable through chat/API or only the dashboard UI -->

Namefi는 [x402](/ko/glossary/x402/) 프로토콜을 통해 암호화폐 지갑만으로 **Namefi 계정 없이도** 도메인을 등록할 수 있도록 지원합니다. 에이전트의 지갑이 EIP-3009 승인에 서명하고, 아직 결제가 첨부되지 않았다면 API가 가격을 표시하는 HTTP 402 응답을 보냅니다. 유효한 서명 결제가 도착하면 등록이 결제 처리되며, 보통 USDC 같은 [스테이블코인](/ko/glossary/stablecoin/)이 사용됩니다. 이와 관련된 MPP(Machine Payable Protocol) 질의-응답 방식과 두 단축 방식을 사용하지 않는 지갑을 위한 수동 EIP-712 서명 방식도 있습니다. 지갑 우선 방식은 바로 이 가이드가 다루는 에이전트에 중요합니다. 계정 생성 단계를 완전히 없애므로 자율 프로세스가 API 키를 보유하거나 유출할 일이 없기 때문입니다. 이 흐름만 자세히 보려면 [암호화폐 지갑으로 도메인 결제하기: 계정 불필요](/ko/blog/wallet-checkout/)를 참고하세요.

## 에이전트에 구매 권한을 주기 전의 가드레일

도메인을 등록할 수 있는 에이전트는 실제 운영 중인 자산에 돈을 쓰고 DNS를 다시 작성할 수도 있으므로, 몇 가지 사항은 기본값에 맡기지 말고 의도적으로 결정해야 합니다.

- **API 키의 범위를 최소한의 지갑으로 제한하세요.** 키는 이를 생성한 지갑의 권한을 상속합니다. 에이전트의 키에 노출하고 싶지 않은 자산이 들어 있는 지갑이 아니라, 새 등록 도메인을 소유할 지갑에서 키를 생성하세요.
- **에이전트가 쓸 수 있는 금액에 한도를 두세요.** NFSC 잔액 자체가 지출 한도입니다. 큰 금액을 상시 보유해 두기보다 에이전트가 사람의 개입 없이 사용해도 괜찮은 만큼만 충전하세요.
- **사람이 어느 지점에서 개입할지 정하세요.** 이용 가능 여부 검색 같은 읽기 전용 작업은 인증이 필요 없고 위험도 없습니다. 호출이 `registerDomain`을 제출하거나 자동 갱신을 전환하거나 이미 트래픽을 처리하는 도메인의 DNS 레코드를 쓰는 순간에는 에이전트가 자율적으로 진행하게 두지 말고 명시적 확인을 요구해야 합니다.
- **확정하기 전에 DNS 쓰기 작업을 검토하세요.** 다른 인프라 변경을 검토하는 것과 같은 방식입니다. Namefi의 검증은 잘못된 레코드를 그대로 받아들이지 않고 거부하지만(아래 문제 해결 표 참고), 형식 오류만 잡을 수 있을 뿐 문법상 올바르지만 값이 잘못된 경우까지 찾지는 못합니다.

[에이전트 네이티브 도메인 등록대행자란?](/ko/blog/agent-native/)에서는 Namefi를 포함한 등록대행자의 에이전트용 기능을 평가하기 위한 검색 가능성, 기계 판독형 오류, 사람이 신용카드를 들고 있다고 가정하지 않는 결제 방식에 관한 더 자세한 체크리스트를 제공합니다.

## 문제 해결

| 증상 | 가능한 원인 | 해결 방법 |
| --- | --- | --- |
| 쓰기 호출에서 `401 UNAUTHORIZED` 발생 | API 키가 유효하지 않거나 만료되었거나, 대상 도메인을 소유하지 않은 지갑에서 생성됨 | 도메인을 소유하고 있거나 소유하게 될 지갑으로 [namefi.io/api-key](https://namefi.io/api-key)에서 새 키 생성 |
| `403 FORBIDDEN` | 키는 유효하지만 해당 지갑이 이 도메인을 소유하지 않음 | 다시 시도하기 전에 소유권 확인 |
| Codex가 `[mcp_servers.namefi]` 항목을 무시함 | 테이블 이름 오타 — Codex에는 `mcp-servers`가 아니라 밑줄이 있는 `mcp_servers`가 필요함 | `config.toml`의 테이블 헤더 수정 |
| Cursor 또는 Windsurf가 서버 연결 끊김으로 표시됨 | `headers` 객체가 잘못되었거나 `${env:VAR}`가 설정되지 않은 변수를 참조함 | JSON의 유효성을 확인하고, 편집기를 실행한 셸에 참조된 환경 변수가 실제로 내보내졌는지 확인 |
| Gemini CLI가 설정을 찾지 못함 | 잘못된 `settings.json`을 편집함 — 사용자 수준 파일과 프로젝트 수준 파일은 서로 다름 | 사용자 수준의 `~/.gemini/settings.json`인지 현재 프로젝트의 `.gemini/settings.json`인지 확인 |
| 등록 주문이 최종 상태가 아닌 상태에 머묾 | 정상 동작 — 등록은 비동기 방식임 | `getOrder`를 계속 조회하고, `SUCCEEDED`, `FAILED`, `CANCELLED`, `PARTIALLY_COMPLETED` 중 어느 상태에도 끝내 도달하지 않을 때만 멈춘 것으로 판단 |
| DNS 레코드 생성 또는 업데이트가 검증 오류로 거부됨 | `zoneName` 끝에 마침표가 있거나 CNAME/MX/NS `rdata` 값 끝에 필수 마침표가 없음 | `zoneName` = 끝에 마침표 없음, FQDN 유형 `rdata` 값 = 끝에 마침표 필요 |
| 등록이 완전히 실패함 | 결제 지갑의 NFSC 잔액 부족 | `GET /v-next/balance`를 확인하고 파우셋(개발) 또는 대시보드(프로덕션)에서 충전 |
| 에이전트가 사용할 수 있는 도메인 도구가 없다고 말함 | MCP 서버가 연결되지 않았거나 쓰기 작업에 필요한 헤더 없이 연결됨 | 클라이언트의 설정 파일을 다시 확인하거나 헤더를 포함해 "서버 추가" 명령을 다시 실행 |

## 자주 묻는 질문

### 에이전트 하나를 골라 계속 사용해야 하나요?
아니요. 어떤 클라이언트가 연결하든 MCP 서버와 모든 REST 엔드포인트는 같습니다. 마이그레이션 절차 없이도 같은 API 키와 같은 NFSC 잔액으로 오늘은 Claude Code, 내일은 Cursor를 설정해 사용할 수 있습니다.

### 도메인 등록에 "가장 좋은" 에이전트는 무엇인가요?
모든 클라이언트가 같은 서버 측 작업을 호출하므로 이 작업에서는 의미 있는 기능 차이가 없습니다. 차이는 각 클라이언트의 MCP 설정 문법에만 있습니다. 바로 이 때문에 가이드에서 에이전트마다 별도의 절과 같은 테스트 프롬프트를 제공합니다. 클라이언트별로 한 번씩 실행하고 대화 기록을 직접 비교해 보세요.

### 에이전트가 MCP를 전혀 지원하지 않으면 어떻게 하나요?
위의 원시 REST 방식을 사용하세요. MCP 도구 호출이 도달하는 모든 작업은 문서화된 HTTPS 엔드포인트로도 제공됩니다. `namefi.io/llms.txt`는 브라우저 없이도 에이전트 또는 이를 설정하는 사람이 읽을 수 있는 일반 텍스트 진입점으로 특별히 설계되었습니다.

### 이 방식으로 등록하면 도메인이 자동으로 토큰화되나요?
예, 기본적으로 토큰화됩니다. 등록 요청에서 `nftReceivingWallet`을 지정하지 않으면 도메인은 Base에서 API 키에 연결된 지갑을 소유자로 하는 NFT로 등록됩니다. 등록할 때 다른 지갑으로 보낼 수도 있습니다.

### API 키를 전혀 보유하지 않아도 에이전트가 도메인을 등록할 수 있나요?
예. 지갑 서명형 x402 결제 방식에는 Namefi 계정이나 API 키가 필요하지 않고 자금이 충전된 지갑만 있으면 됩니다. 위 결제 절에서 이 흐름의 핵심을 설명합니다. 전체 안내는 [암호화폐 지갑으로 도메인 결제하기: 계정 불필요](/ko/blog/wallet-checkout/)를 참고하세요.

### 에이전트를 통해 등록하면 Namefi 웹사이트에서 등록할 때보다 비용이 더 드나요?
이 가이드에서는 어느 쪽이 더 저렴하다고 주장하지 않습니다. <!-- TODO: confirm with team — whether Namefi's MCP/API pricing matches its standard registration pricing, or differs --> 어느 방식을 사용하든 요청이 브라우저, 스크립트, 에이전트의 도구 호출 중 어디에서 왔는지와 관계없이 같은 NFSC 잔액에서 차감됩니다.

## 지금 열려 있는 에이전트로 시작하세요

이 가이드를 사용하기 위해 여섯 가지 클라이언트를 모두 설치할 필요는 없습니다. Namefi API 키 또는 자금이 충전된 지갑과 클라이언트 하나만 있으면 됩니다. 이미 사용 중인 도구에 맞는 위 절을 선택해 설정하고 테스트 프롬프트를 실행하세요. 그다음부터 검색, 등록, DNS 설정으로 이어지는 나머지 흐름은 같은 대화 안에서 진행됩니다.

**[Namefi API 키 생성하기](https://namefi.io/api-key)** 또는 [전체 대화 기록이 포함된 Claude 가이드](/ko/blog/claude-mcp-domains/)와 [에이전트 네이티브 등록대행자 비교](/ko/blog/cf-namecom-namefi/)에서 더 자세히 살펴보세요. 이 가이드의 기반 요소는 [Namefi MCP 서버: AI 에이전트용 도메인 도구](/ko/blog/namefi-mcp/), [Namefi MCP 빠른 시작: Claude Code, Cursor 및 Windsurf](/ko/blog/mcp-quickstart/), [암호화폐 지갑으로 도메인 결제하기: 계정 불필요](/ko/blog/wallet-checkout/), [도메인을 위한 llms.txt: 모든 AI 에이전트가 읽을 수 있는 API](/ko/blog/llms-txt/)에서 확인할 수 있습니다.

## 출처 및 추가 자료

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP 서버 URL, 전송 방식, 인증, 등록 및 DNS 엔드포인트 참고 자료, `domainSetupOptions` 필드 — 이 가이드의 모든 Namefi 관련 설명에 대한 직접 제공 자료)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402, MPP, EIP-712 지갑 결제 흐름)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP 검색 설명자: 서버 이름, URL, 전송 방식, 인증 유형)
- Namefi — [docs.namefi.io: 인증](https://docs.namefi.io/docs/02-authentication.mdx) (API 키, EIP-712, SIWE 인증 방식과 작업별 인증 요구 사항)
- Namefi — [docs.namefi.io: 도메인 등록](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (등록 요청 필드, 상태 조회 흐름, 주문 상태 값)
- Namefi — [docs.namefi.io: 잔액 관리](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC 잔액 및 파우셋 엔드포인트)
- Anthropic / Claude Code — [MCP를 통해 Claude Code를 도구에 연결하기](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (`claude mcp add --transport http` 문법, `--header`, `--scope` 플래그)
- Model Context Protocol — [원격 MCP 서버에 연결하기](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (Claude Desktop / claude.ai 사용자 지정 커넥터 흐름)
- OpenAI — [learn.chatgpt.com: Model Context Protocol(Codex CLI)](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (`config.toml`의 `[mcp_servers.<name>]` 테이블, `url`, `http_headers`, `env_http_headers`, `bearer_token_env_var` 필드)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (`mcp.json` 원격 서버 형식, `headers`, `${env:VAR}` 보간, 프로젝트 및 전역 설정 위치)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (이 가이드 게시일 현재 [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp)로 리디렉션됨. `mcp_config.json` 형식, `serverUrl`, `headers`)
- Google — [geminicli.com: Gemini CLI에서 MCP 서버 사용하기](https://geminicli.com/docs/tools/mcp-server/) (`settings.json` 형식, `httpUrl`, `headers`, `timeout`)
- llmstxt.org — [/llms.txt 파일](https://llmstxt.org) (`namefi.io/llms.txt`가 따르는 검색 규약의 사양과 근거)
