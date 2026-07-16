---
title: "Namefi MCP 빠른 시작: Claude Code, Cursor, Windsurf"
date: '2026-07-10'
language: 'ko'
tags: ['ai-agents', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: guide
ogImage: ../../assets/mcp-quickstart-og.jpg
description: "Claude Code, Cursor, Windsurf용 편집기별 MCP 설정과 새 앱에서 실제 커스텀 도메인까지 이어지는 5단계 빠른 시작 가이드입니다. 편집기를 벗어날 필요가 없습니다."
keywords: ["claude code mcp 도메인", "cursor mcp 도메인", "windsurf mcp 도메인", "편집기 내 도메인 등록", "코딩 에이전트 도메인 등록", "편집기에서 도메인 등록", "mcp 빠른 시작", "namefi mcp 설정", "vercel 커스텀 도메인 namefi", "cloudflare pages 커스텀 도메인 namefi", "ai 에이전트 배포 커스텀 도메인", "도메인 등록 빠른 시작", "x-api-key mcp 설정", "배포에 도메인 연결"]
relatedArticles:
  - /ko/blog/ai-agent-register/
  - /ko/blog/claude-mcp-domains/
  - /ko/blog/namefi-mcp/
  - /ko/blog/wallet-checkout/
  - /ko/blog/vibe-coding-domain/
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
  - /ko/glossary/nameserver/
  - /ko/glossary/domain-renewal/
---

이미 편집기 안에 있습니다. 앱의 기본 구조를 만들었고, 첫 배포도 플랫폼의 서브도메인으로 내보냈습니다. 이제 사람들에게 공개하기 전에 남은 일은 실제 도메인 하나뿐입니다. 이 가이드는 브라우저 탭을 열거나 결제 양식을 작성하거나 앱을 만든 [코딩 에이전트](/ko/glossary/ai-agent/) 세션을 벗어나지 않고 도메인을 등록하는 빠른 시작 안내서입니다. Claude Code, Cursor, Windsurf의 정확한 [MCP](https://modelcontextprotocol.io) 연결 설정과 간결한 5단계 흐름, 그리고 대부분의 도메인 가이드가 빠뜨리는 부분인 방금 등록한 도메인을 방금 배포한 서비스에 실제로 연결하는 방법까지 다룹니다.

이 가이드에서 세 가지 편집기를 다루는 데는 이유가 있습니다. OpenAI Codex, Gemini CLI 또는 Claude Desktop을 사용한다면 [Namefi에서 AI 에이전트로 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)에서 여섯 가지 클라이언트의 검증된 설정과 MCP를 기본 지원하지 않는 도구를 위한 원시 REST 방식까지 확인할 수 있습니다. 여기의 모든 설정은 해당 종합 가이드에 나온 것과 동일한 [Namefi](https://namefi.io) MCP 서버에 연결되므로 서로 모순되지 않습니다. 이 페이지는 개발자 도구 중심으로 핵심만 압축하고, 종합 가이드에는 없는 배포 연결 단계를 추가한 버전입니다.

## 편집기 안에서 도메인을 등록해야 하는 이유

"도메인을 등록하러 가기"는 5분짜리 작업치고 유난히 큰 컨텍스트 전환을 요구합니다. 편집기를 나가 등록기관 사이트를 열고, 이름을 검색하고, 원하지도 않은 개인정보 보호와 이메일 호스팅을 권하는 추가 판매 과정을 거쳐 결제한 뒤, 다시 돌아와 어떤 DNS 레코드를 추가해야 하는지 알아내야 합니다.

대신 프로젝트의 기본 구조를 만들고 배포까지 연결한 바로 그 에이전트가 마지막 단계도 처리하게 할 수 있습니다. 현재 진행 중인 대화 안에서 도구 호출만으로 이름을 확인하고, 등록하고, DNS를 연결하는 것입니다. [Cloudflare도 자체 Registrar API에 같은 발상을 적용한 방식을 홍보하고 있습니다](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=An%20agent%20using%20the%20API%20can%20suggest%20domain%20names%2C%20check%20registrability%2C%20and%20complete%20the%20purchase%20without%20the%20user%20leaving%20their%20current%20context). 이는 일부 사용자만 선호하는 틈새 방식이 아니라 여러 등록기관이 지향하는 워크플로임을 보여 줍니다. 글 후반의 비교 섹션에서 Cloudflare와의 차이를 구체적으로 다룹니다. Namefi 방식에는 [토큰화 도메인](/ko/glossary/tokenized-domain/) 옵션과 계정 없이 이용할 수 있는 지갑 서명 결제 방식이 추가되며, 자세한 내용은 [암호화폐 지갑으로 도메인 결제하기](/ko/blog/wallet-checkout/)에서 확인할 수 있습니다.

## 연결 설정: 편집기 세 개, 설정 파일 세 개

아래 세 편집기는 모두 Streamable HTTP를 통해 같은 엔드포인트인 `https://api.namefi.io/mcp`에 연결하며, Namefi [API 키](https://namefi.io/api-key)는 `x-api-key` 헤더로 전송됩니다. 편집기마다 달라지는 것은 파일 형식과 해당 파일을 작성하는 명령뿐입니다.

### Claude Code

Claude Code 공식 문서는 커스텀 헤더가 있는 원격 HTTP 서버를 추가하는 직접적인 CLI 명령을 제공합니다.

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

프로젝트의 터미널에서 실제 키를 넣어 한 번 실행하세요. 기본적으로 서버는 **local** 범위로 기록되어 본인만 이 프로젝트에서 사용할 수 있습니다. 대신 `--scope user`를 추가하면 컴퓨터의 모든 프로젝트에서 사용할 수 있으며, `claude mcp list`로 연결 상태를 확인할 수 있습니다.

### Cursor

Cursor는 `mcp.json`에서 MCP 서버 정보를 읽습니다. 프로젝트용 파일은 `.cursor/mcp.json`, 전역용 파일은 `~/.cursor/mcp.json`에 있습니다. 문서에 명시된 원격 서버 형식은 환경 변수 치환을 이용한 헤더 인증을 지원하므로 키 자체를 파일에 저장할 필요가 없습니다.

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

`${env:NAMEFI_API_KEY}`는 Cursor를 실행한 셸의 해당 변수 값으로 해석됩니다. 편집기를 열기 전에 변수를 export하세요.

### Windsurf (Cascade)

Cascade라는 이름의 Windsurf MCP 통합 기능은 `~/.codeium/windsurf/mcp_config.json`을 읽습니다. 여기서 원격 서버는 `serverUrl` 필드를 `url` 대신 사용하며, `headers`와 `${env:VAR}` 패턴은 Cursor와 같습니다.

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

한 가지 짚고 넘어갈 점이 있습니다. 이 가이드의 발행일을 기준으로 `docs.windsurf.com/windsurf/cascade/mcp`는 `docs.devin.ai/desktop/cascade/mcp`로 리디렉션됩니다. Windsurf 문서는 이제 Cognition의 Devin 제품 문서 도메인에 있으며, 위 설정 형식은 해당 최신 페이지에 문서화된 내용입니다. 이전 빌드를 사용 중이라면 앱 내 도움말이 가리키는 문서 링크에서 필드 이름을 확인하세요.

## 5단계 빠른 시작: 새 앱에서 실제 DNS까지

위 연결 중 하나가 활성화되면 어떤 편집기를 사용하든 나머지 흐름은 같습니다.

1. 새 도메인을 소유할 지갑에서 생성한 **API 키를 [namefi.io/api-key](https://namefi.io/api-key)에서 발급받습니다.**
2. 위의 편집기별 설정으로 **연결**한 다음 정상 작동 여부를 확인합니다. "Namefi에서 `<yourapp>.com`을 사용할 수 있는지 확인하고, 어떤 도구를 호출했는지 알려 줘"라고 요청하세요. 읽기 전용 `checkAvailability` 호출이므로 자금을 넣기 전에도 작동합니다.
3. **등록합니다.** 원하는 이름과 기간을 자연어로 확인하세요. 예를 들어 "1년 동안 등록해 줘"라고 말하면 됩니다. 에이전트는 `registerDomain`을 제출하고 주문이 `SUCCEEDED` 또는 최종 실패 상태에 도달할 때까지 폴링합니다. 일반적인 등록은 몇 차례의 폴링 주기 안에 완료됩니다.
4. **배포에 연결합니다.** 다음 섹션에서 이 단계를 자세히 다룹니다. 동일한 대화에서 호스팅 플랫폼이 요구하는 DNS 레코드를 추가하세요.
5. **도메인이 해석되는지 확인합니다.** [DNS 전파](/ko/glossary/dns-propagation/)는 즉시 끝나지 않으므로 몇 분 기다린 뒤 공개 DNS 조회를 사용하거나 브라우저에서 도메인을 직접 열어 확인하세요.

## 새 도메인을 방금 배포한 서비스에 연결하기

일반적인 "도메인 등록 방법" 가이드는 이 부분까지 다루지 않습니다. 등록 이후 호스팅 플랫폼 측에서 진행되는 단계이기 때문입니다. 하지만 이것이 바로 편집기 안에서 작업하는 핵심입니다. 에이전트는 어느 플랫폼에 배포했는지 이미 알고 있으므로 등록에 이어 같은 흐름에서 DNS까지 연결할 수 있습니다.

### Vercel

Vercel의 도메인 공식 문서는 프로젝트 대시보드의 **Settings → Domains**에서 시작하는 흐름을 설명합니다. 도메인을 추가하면 에이펙스 도메인인지 서브도메인인지에 따라 Vercel이 생성할 레코드를 알려 줍니다. **에이펙스 도메인**(`yourapp.com`)에는 서비스 IP를 가리키는 **A 레코드**가 필요하고, **서브도메인**(`www.yourapp.com`)에는 **CNAME**이 필요합니다. 오래된 가이드의 예시를 복사하기 전에 알아 둘 점이 있습니다. [Vercel 문서는 이 CNAME 대상이 프로젝트마다 고유하다고 명시합니다](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record). 즉, 모든 프로젝트가 공유하는 하나의 고정 호스트 이름이 아니라 대시보드에 표시되는 값을 사용해야 합니다.

해당 값을 확인했다면 DNS 측 작업은 에이전트에게 한 번 더 요청하면 됩니다.

> "`@`가 `76.76.21.21`을 가리키는 A 레코드를 추가하고, `www`가 Vercel이 알려 준 CNAME 대상을 가리키는 CNAME도 추가해 줘."

그러면 `createDnsRecord`가 레코드당 한 번씩 총 두 번 호출됩니다. Namefi에서 모든 DNS 쓰기에 사용하는 [DNS 레코드](/ko/glossary/dns-record-types/) 도구와 같습니다. 여기에도 다른 곳과 동일한 후행 점 규칙이 적용됩니다. CNAME 대상의 `rdata`에는 끝에 점이 필요하지만, 도메인인 `zoneName`에는 필요하지 않습니다.

### Cloudflare Pages

배포 대상이 Cloudflare Pages이고 도메인의 DNS가 아직 Cloudflare에서 관리되지 않는다면, [Cloudflare의 커스텀 도메인 공식 문서](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain)는 프로젝트의 `.pages.dev` 서브도메인을 가리키는 **CNAME** 레코드 하나를 요구합니다. Pages는 해당 CNAME 대상을 통해 모든 요청을 처리하므로 A 레코드는 필요하지 않습니다. 먼저 Cloudflare 대시보드 단계(Workers & Pages → 프로젝트 → Custom domains → Set up a domain)를 완료해야 하며, 그래야 CNAME 대상이 올바르게 해석됩니다.

> "`app`이 `my-project.pages.dev.`를 가리키는 CNAME을 추가해 줘."

같은 도구 호출이며 대상에 동일한 후행 점 규칙을 적용하지만, 플랫폼만 다릅니다.

<!-- TODO: 확인 필요 — 새로 연결한 커스텀 도메인에 TLS 인증서를 발급하고 갱신하는 Vercel 및 Cloudflare Pages의 정확한 단계를 검증해, 두 플랫폼 모두 자동인지 수동 실행이 필요한지 확실히 설명할 것 -->

## Cloudflare의 편집기 내 등록과 비교

Cloudflare는 편집기 내 등록 방식을 적극적으로 홍보하는 또 다른 등록기관이므로 직접 비교할 가치가 있습니다. [2026년 4월 기준 베타로 보도된](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/) Cloudflare의 Registrar API 역시 Cursor와 Claude Code를 비롯한 MCP 지원 편집기와 통합됩니다. 이를 통해 에이전트는 현재 컨텍스트를 벗어나지 않고 도메인을 검색하고 가격을 확인하고 동기 방식으로 등록할 수 있습니다. 이 가이드에서 Namefi를 통해 진행한 것과 같은 핵심 발상입니다. 같은 보도에 따르면 베타 시점에는 Cloudflare API가 등록 이후의 이전이나 갱신 같은 관리 기능을 아직 지원하지 않으며, 해당 기능은 2026년 후반으로 계획되어 있습니다.

Namefi MCP 서버는 현재 등록, DNS, [자동 갱신](/ko/glossary/domain-renewal/)까지 전체 수명 주기를 지원합니다. 또한 Cloudflare 방식에는 없는 두 가지 기능도 제공합니다. 도메인이 기본적으로 [토큰화 도메인](/ko/glossary/tokenized-domain/) NFT로 등록되며 원하는 지갑을 수령 대상으로 지정할 수 있고, Namefi 계정 없이 지갑 서명 결제도 지원합니다. 자세한 내용은 [암호화폐 지갑으로 도메인 결제하기](/ko/blog/wallet-checkout/)에서 확인할 수 있습니다. 두 서비스 모두 "편집기를 벗어나지 않는" 워크플로를 지향합니다. 표준 도메인 등록이 필요한지, 온체인 자산이기도 한 등록이 필요한지에 따라 적합한 방식을 선택하면 됩니다.

## 자주 묻는 질문

### Codex나 Gemini CLI도 이 가이드에서 다루나요?
아닙니다. 이 가이드는 의도적으로 Claude Code, Cursor, Windsurf에만 초점을 맞춥니다. [Namefi에서 AI 에이전트로 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)에서 Codex CLI, Gemini CLI, Claude Desktop에 대해 동일하게 검증된 정확한 설정을 확인할 수 있습니다.

### 이 기능을 사용하기 전에 Namefi 계정이 필요한가요?
아닙니다. 읽기 전용 가용성 확인에는 인증이 필요하지 않으므로 API 키를 발급하거나 자금을 넣기 전에 위 편집기 중 하나를 연결하고 2단계의 테스트 프롬프트를 실행할 수 있습니다.

### 배포 플랫폼이 Vercel이나 Cloudflare Pages가 아니라면 어떻게 하나요?
어떤 플랫폼에서도 패턴은 같습니다. 플랫폼 대시보드는 필요한 DNS 레코드 유형을 알려 줍니다. 대부분 에이펙스 도메인에는 A 레코드, 서브도메인에는 CNAME이 필요합니다. 해당 값을 에이전트에게 전달해 `createDnsRecord`로 기록하면 됩니다.

### 이 방식으로 등록하면 도메인이 자동으로 토큰화되나요?
네. 별도의 `nftReceivingWallet`을 요청에 지정하지 않는 한, 도메인은 기본적으로 API 키와 연결된 지갑으로 Base의 NFT로 등록됩니다. 처음 접하는 개념이라면 [토큰화 도메인이란?](/ko/blog/what-are-tokenized-domains/)을 참고하세요.

### API 키를 완전히 생략할 수 있나요?
네, 단 조건이 있습니다. Namefi의 지갑 서명 [x402](/ko/glossary/x402/) 결제 방식에서는 자금이 있는 지갑으로 계정이나 API 키 없이 등록 비용을 낼 수 있습니다. 별도의 설명이 필요한 방식이며, [암호화폐 지갑으로 도메인 결제하기](/ko/blog/wallet-checkout/)에서 자세히 다룹니다.

## 앱과 함께 도메인도 출시하세요

도메인은 배포 대상이나 데이터베이스와 마찬가지로 인프라입니다. 앱을 출시하는 과정에서 도메인만 유일하게 도구를 벗어나 웹 양식을 작성해야 할 이유는 없습니다. 위 세 가지 설정 중 하나를 연결하고 5단계 흐름을 실행하면, 브라우저 탭을 단 하나도 열지 않고 에이전트가 방금 만든 배포를 가리키는 도메인이 실제로 서비스됩니다.

**[Namefi API 키를 발급하고](https://namefi.io/api-key)** 이미 열어 둔 편집기에서 가용성 확인 프롬프트를 실행해 보세요. 모든 단계를 자세히 보고 싶다면 [주석이 달린 대화 기록과 함께 보는 전체 Claude Code 가이드](/ko/blog/claude-mcp-domains/)를 읽어 보세요.

## 출처 및 추가 자료

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP 서버 URL, 전송 방식, 인증, 등록/DNS 엔드포인트 참고 자료 — 이 가이드의 모든 Namefi 관련 설명에 대한 1차 출처)
- Namefi — [docs.namefi.io: 도메인 등록](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (등록 요청 필드, 폴링 흐름, 주문 상태 값)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP 검색 설명자)
- Anthropic / Claude Code — [MCP로 Claude Code를 도구에 연결하기](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (`claude mcp add --transport http` 구문, `--header`, `--scope` 플래그)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (`mcp.json` 원격 서버 형식, `headers`, `${env:VAR}` 치환, 프로젝트 및 전역 설정 위치)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (이 가이드의 발행일 기준 [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp)로 리디렉션됨. `mcp_config.json` 형식, `serverUrl`, `headers`)
- Vercel — [커스텀 도메인 추가 및 설정](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record) (에이펙스 도메인 A 레코드, 서브도메인별 프로젝트 고유 CNAME 대상, 네임서버 방식)
- Vercel — [도메인 개요](https://vercel.com/docs/domains#:~:text=76.76.21.21) (에이펙스 A 레코드에 사용하는 `76.76.21.21` 서비스 IP)
- Cloudflare — [Pages의 커스텀 도메인](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) (Cloudflare에서 관리하지 않는 도메인을 위한 `.pages.dev` 대상 CNAME 흐름)
- webhosting.today — [AI 에이전트가 이제 사람 없이 도메인을 등록할 수 있습니다](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/) (Cloudflare Registrar API 베타 보도: 편집기 통합, 베타 제한 사항)
- Model Context Protocol — [modelcontextprotocol.io](https://modelcontextprotocol.io) (프로토콜 개요)
