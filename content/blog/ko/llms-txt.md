---
title: "도메인을 위한 llms.txt: 모든 AI 에이전트가 읽을 수 있는 API"
date: '2026-07-10'
language: 'ko'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/llms-txt-og.jpg
description: "일반 텍스트 파일 하나로 모든 AI 에이전트가 등록대행자의 전체 API를 찾고 사용할 수 있게 하는 namefi.io/llms.txt의 작동 방식과 MCP와의 연계 방법을 살펴봅니다."
keywords: ["llms.txt", "llms.txt 예시", "llms.txt란", "AI가 읽을 수 있는 API 문서", "API 검색 가능성", "AI를 위한 robots.txt", "llms.txt와 MCP 비교", "namefi.io/llms.txt", "기계 판독형 API 레퍼런스", "에이전트 네이티브 API", "LLM을 위한 구조화 문서", "일반 텍스트 API 검색", "MCP 검색 디스크립터", "AI 에이전트 도메인 등록"]
relatedArticles:
  - /ko/blog/ai-agent-register/
  - /ko/blog/claude-mcp-domains/
  - /ko/blog/namefi-mcp/
  - /ko/blog/mcp-quickstart/
  - /ko/blog/agent-native/
relatedTopics:
  - /ko/topics/web3-foundations/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/blockchain-concepts/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/ai-agent/
  - /ko/glossary/registrar/
  - /ko/glossary/epp/
  - /ko/glossary/dns/
  - /ko/glossary/seo/
---

[API](/ko/glossary/epp/)를 제공하는 모든 [등록대행자](/ko/glossary/registrar/)는 어딘가에 문서를 갖추고 있습니다. 문서 사이트나 레퍼런스 페이지일 수도 있고, 로그인 장벽 뒤에 OpenAPI 사양이 있을 수도 있습니다. 지난 이십 년 동안은 이것으로 충분했습니다. 독자가 사람인 개발자였기 때문에 이곳저곳을 클릭하고 탐색 요소를 훑어넘기며 필요한 단락 하나를 찾아낼 수 있었기 때문입니다. 하지만 추론 시점에 같은 사이트를 읽는 [AI 에이전트](/ko/glossary/ai-agent/)에게는 그런 여유가 없습니다. 컨텍스트 예산은 제한되어 있고, JavaScript로 렌더링되는 문서 포털을 기다릴 수도 없으며, API가 무엇을 하는지 한 번에 파악하지 못하면 포기하거나 존재하지 않는 엔드포인트를 지어낼 수 있습니다.

`llms.txt`는 이 문제를 해결하기 위한 방법이며, Namefi는 [namefi.io/llms.txt](https://namefi.io/llms.txt)에 이 파일을 공개하고 있습니다. 이 글에서는 이 규약이 무엇인지, 왜 만들어졌는지, Namefi의 파일에 섹션별로 무엇이 담겨 있는지, 의도적으로 어디까지 다루지 않는지, 그리고 [Model Context Protocol](https://modelcontextprotocol.io)(MCP)과 경쟁하는 대신 어떻게 함께 작동하는지 설명합니다. 또한 이 글 자체도 설계상 설명 대상의 한 사례입니다. 공개 API 제공업체가 기계 판독형 검색 파일을 알기 쉬운 문장으로 직접 설명하기 때문입니다.

## 에이전트가 문서 사이트를 그냥 크롤링할 수 없는 이유

`llms.txt`의 근거는 추측이 아니라 제안서에 직접 명시되어 있습니다. [Jeremy Howard의 최초 설명](https://llmstxt.org)은 그 배경이 된 제약으로 시작합니다. “대규모 언어 모델은 웹사이트 정보에 점점 더 의존하지만, 대부분의 웹사이트 전체를 처리하기에는 컨텍스트 윈도가 너무 작다는 중대한 한계가 있습니다. 탐색 메뉴, 광고, JavaScript가 포함된 복잡한 HTML 페이지를 LLM에 적합한 일반 텍스트로 변환하는 작업은 어렵고 부정확하기도 합니다.”

이는 두 가지 문제가 겹친 상황입니다. 실제 문서 사이트의 탐색 메뉴, 변경 이력, 마케팅 문구, 쿠키 배너는 에이전트가 하나의 작업을 수행하는 데 필요한 몇 개 단락에 비하면 대부분 잡음입니다. 게다가 이런 잡음 중 상당 부분은 헤드리스 요청이 실행하지 않는 JavaScript 뒤에 있으므로, 에이전트의 HTTP 클라이언트가 보는 내용은 사람이 보는 페이지와 같지도 않습니다. `llms.txt`는 두 문제를 모두 피해 갑니다. 크롤링한 뒤 축약하는 대신 처음부터 끝까지 한 번에 읽도록 만든, Markdown 형식의 단일 일반 텍스트 파일입니다.

## `robots.txt`와의 비유, 그리고 그 한계

웹 인프라를 아는 사람에게 `llms.txt`의 위치를 가장 빠르게 설명하는 방법은 [`robots.txt`](https://www.robotstxt.org)에 비유하는 것이며, 일정 부분까지는 적절합니다. `robots.txt`는 웹 크롤러에 지침을 제공하기 위해 존재합니다. 해당 사이트의 표현을 빌리면 “웹사이트 소유자는 /robots.txt 파일을 사용해 웹 로봇에 사이트에 관한 지침을 제공하며, 이를 *로봇 배제 프로토콜(The Robots Exclusion Protocol)*이라고 합니다.” 두 파일 모두 예측 가능한 루트 경로에 있고, 일반 텍스트이며, 사람이 아니라 자동화된 독자를 대상으로 합니다.

이 비유가 성립하지 않는 지점은 의도입니다. `robots.txt`는 거의 전적으로 **부정적인** 지침입니다. `Disallow: /some-path`는 크롤러가 *접근하지 말아야 할* 곳을 알려줍니다. 반면 `llms.txt`는 **긍정적**입니다. 이 사이트가 무엇이며 읽을 가치가 있는 부분이 어디에 있는지를 알려줍니다. 울타리라기보다 책 전체를 훑어볼 수 없는 독자를 위한 목차에 가깝습니다. 두 파일은 서로 보완하며, Namefi 사이트는 둘 다 운영합니다.

## 사양이 실제로 요구하는 것

`llms.txt`는 자유 형식이 아닙니다. 제안서는 특정한 Markdown 구조와 순서를 정의합니다. 선택적인 바이트 순서 표식, 사이트 이름이 포함된 필수 H1, 블록 인용문 형식의 요약 다음에 제목 없는 세부 섹션이 없거나 여러 개 이어지고, H2로 구분되는 `[name](url): notes` 링크 형식 “파일 목록” 섹션도 없거나 여러 개 이어집니다. 한 H2 제목에는 특별한 의미가 있습니다. **Optional**이라는 섹션은 “더 짧은 컨텍스트가 필요하다면 이곳의 URL은 건너뛸 수 있음”을 나타냅니다. Namefi의 파일은 사양에 설명된 그대로 이 제목을 사용합니다.

## namefi.io/llms.txt 자세히 살펴보기

다음은 실제 파일을 섹션별로 주석과 함께 정리한 것입니다. 실제로 무엇이 들어 있는지 직접 인용하고, 처음 접하는 에이전트가 읽기 좋도록 각 부분을 왜 이런 형태로 구성했는지 설명합니다.

| 섹션(파일에 표시되는 그대로) | 내용 | 이렇게 구성한 이유 |
| --- | --- | --- |
| H1 + 블록 인용문 | `# Namefi API` / `> Namefi lets you register traditional domains as NFTs and manage their DNS records via API.` | 사양이 요구하는 시작 부분입니다. 에이전트가 나머지를 전혀 읽지 않더라도 이 한 줄만으로 행동할 수 있습니다. |
| 요약 안의 MCP 안내 | `MCP server (every operation below as MCP tools): https://api.namefi.io/mcp — discovery descriptor at https://namefi.io/.well-known/mcp/servers.json` | 가장 빠른 경로인 실시간 프로토콜 연결을 일반 텍스트 방식보다 앞서 첫 세 줄 안에 제시합니다. |
| `## Base URLs` | `https://api.namefi.io/v-next/` | 설명 없이 한 줄만 있습니다. 원시 HTTP 호출을 구성하는 에이전트에게 필요한 것은 정확히 이 정보입니다. |
| `## MCP Server (for AI agents)` | “클라이언트가 지원한다면 MCP를 우선 사용하세요… Claude Code에 추가: `claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"`” | 권장 방식을 밝히고, 장문의 설명 대신 그대로 복사해 실행할 수 있는 명령 하나를 제공합니다. |
| `## Authentication` | “키 생성: https://namefi.io/api-key… **모든 작업**에 사용할 수 있습니다… **직접 HTTP 사용(AI 에이전트에 권장):** 헤더를 직접 전달하세요. SDK는 필요 없습니다.” | 쓰기 작업을 인증하는 데 SDK, OAuth 절차 또는 브라우저 세션이 필요하지 않음을 독자에게 명확히 알려줍니다. |
| `## Domain Registration` | 세 단계의 `curl` 절차: 사용 가능 여부 확인, `POST /v-next/orders/register-domain` 제출, 최종 상태가 될 때까지 `GET /v-next/orders/{orderId}` 폴링 | 요청 및 응답 형태를 문장으로 설명하는 대신 핵심 트랜잭션을 실행 가능한 명령으로 제시합니다. |
| `## DNS Record Management` | `/v-next/dns/records`, `/v-next/dns/park`, `/v-next/dns/forwarding` 등에 대한 열한 개 엔드포인트(`GET`/`POST`/`PUT`/`DELETE`)를 메서드, 경로, 인증 여부, 한 줄 설명과 함께 정리한 표 | 비슷한 엔드포인트가 많은 레퍼런스 데이터이므로 열한 개 단락 대신 표에 담습니다. |
| 문제 해결 참고 사항 | “**UNAUTHORIZED (401):** API 키가 유효하지 않거나 만료되었거나 도메인 소유자의 지갑과 연결되어 있지 않습니다… **레코드 검증 오류:** `zoneName` 끝에 점이 없어야 하고 CNAME/MX/NS 유형의 `rdata` 끝에는 점이 있어야 하는지 확인하세요…” | 에이전트가 가장 먼저 마주칠 가능성이 높은 실패 사례를 일반적인 상태 코드 표가 아닌 원인과 해결 방법의 형태로 예상해 제공합니다. |
| `## Optional` | TypeScript SDK 문서, `@namefi/api-client` npm 패키지, 기계 판독형 OpenAPI 3 사양, 아웃바운드 에이전트 가이드, 서명 방식에 종속되지 않는 도우미 스크립트의 GitHub 저장소로 연결되는 링크 | 사양에서 말하는 “더 짧은 컨텍스트가 필요하면 건너뛰어도 되는” 섹션입니다. 핵심 흐름의 필수 요소가 아니라 더 깊이 살펴보기 위한 자료입니다. |

파일의 마지막에는 같은 내용을 하나의 문서에 인라인으로 담은 `namefi.io/llms-full.txt`가 안내되어 있습니다. 여기에는 루트 파일이 링크만 제공하는 Web3 결제 흐름과 아웃바운드 가이드도 포함됩니다. 이러한 분리는 사양 자체의 두 단계 패턴을 따릅니다. 진입점은 컨텍스트에 여유 있게 들어갈 만큼 짧게 유지하고, 더 필요한 에이전트는 링크 하나를 따라가게 합니다.

## 보조 파일: web3와 MCP 검색

루트 파일은 범용 진입점에 포함할 필요가 없는 API 영역을 별도 파일로 연결합니다. [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt)는 API 키 대신 지갑을 보유한 에이전트에게 필요한 결제 경로를 설명합니다. 여기에는 [x402](/ko/glossary/x402/) 흐름이 포함됩니다. 이 흐름에서 `GET /x402/domain/{domainName}`은 서명된 `X-PAYMENT` 헤더가 첨부될 때까지 가격 정보와 함께 `402 Payment Required`를 반환합니다. 또한 `mppx` CLI로 서명하는 MPP(Machine Payable Protocol) 챌린지-응답 방식과 스마트 계약 지갑을 포괄하는 수동 EIP-712 서명 경로도 설명합니다. 파일에는 x402 등록에 관해 “Namefi 계정이나 EIP-712 서명이 필요하지 않습니다. 구매자의 지갑이 EIP-3009 `transferWithAuthorization`에 서명합니다.”라고 명확히 적혀 있습니다. API 키만 필요한 에이전트는 이 내용을 전혀 불러올 필요가 없습니다.

MCP 측에는 `llms.txt`와 완전히 별개인 자체 검색 파일이 있습니다. [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)은 Markdown이 아니라 작은 JSON 디스크립터입니다.

```json
{
  "servers": [
    {
      "name": "namefi-api",
      "transport": "streamable-http",
      "url": "https://api.namefi.io/mcp",
      "authentication": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key"
      },
      "documentation": "https://namefi.io/llms.txt"
    }
  ]
}
```

이 디스크립터는 `/.well-known/security.txt`가 기계 검색형 메타데이터에 사용하는 것과 동일한 규약인 `.well-known/` 아래에 위치합니다. 즉, Markdown 문장 중심인 `llms.txt` 방식보다 범위가 좁고 JSON으로 형식화된 보조 파일입니다. 마지막 필드는 다시 `llms.txt`를 가리키므로, MCP 서버를 먼저 발견한 에이전트도 해당 도구가 하는 일을 설명하는 일반 텍스트 문서로 이동할 수 있습니다.

## 포함된 내용과 제외된 내용, 그리고 그 이유

몇 가지 선택에는 분명한 의도가 보입니다. 거의 모든 작업이 요청 스키마를 설명하는 단락이 아니라 실행 가능한 `curl` 호출로 제시됩니다. 스스로 요약문을 작성하는 무언가가 아니라 코드를 실행하는 무언가를 위해 작성된 파일이기 때문입니다. 루트 파일은 모든 내용을 포함하는 대신 외부 파일로 연결하고, `llms-full.txt`는 루트 파일에서 참조만 한 내용을 인라인으로 포함합니다. 사양의 크기 관리 패턴을 문자 그대로 적용한 것입니다. `## Optional` 섹션에는 Markdown과 함께 전체 OpenAPI 3 사양 링크가 있어, 엄격하게 형식화된 스키마가 필요한 도구는 기본 읽기 경로를 복잡하게 만들지 않고도 이를 사용할 수 있습니다. 또한 x402, MPP, EIP-712 기반의 지갑 결제는 별도 파일에 두어 모든 에이전트가 가장 먼저 읽는 내용이 API 키 인증과 도메인 등록이 되도록 했습니다.

<!-- TODO: 팀 확인 필요 — 루트 llms.txt에 목표 토큰/문자 예산이 있는지, 그리고 API가 확장됨에 따라 llms.txt / llms-full.txt / web3/llms.txt / outbound/llms.txt 간 분할을 어떤 방식으로 재검토하는지 -->

## llms.txt와 MCP: 검색과 연결의 차이

각 요소가 하는 일을 정확히 구분할 필요가 있습니다. `llms.txt`는 문서입니다. 에이전트가 한 번 가져오면 API가 무엇이고 더 자세한 자료가 어디에 있는지 알 수 있지만, 누군가 그 내용을 토대로 행동하기 전까지는 정적인 텍스트일 뿐입니다. 프로토콜 자체의 설명에 따르면 [MCP](https://modelcontextprotocol.io)는 “AI 애플리케이션을 외부 시스템에 연결하기 위한 오픈 소스 표준”입니다. 클라이언트가 서버에 여는 실시간 세션이며, 이 세션을 통해 호출 가능한 도구의 목록을 가져오고 실행합니다.

Namefi의 파일은 이 관계를 직접 보여줍니다. `llms.txt`는 에이전트에게 `api.namefi.io/mcp`에 MCP 서버가 있음을 알려주고, 연결에 필요한 `claude mcp add` 명령을 제공합니다. 파일을 읽고, 실시간 도구 인터페이스가 있다는 사실을 파악한 뒤, 연결하고, 행동하는 흐름입니다. 곧바로 MCP로 이동하는 에이전트도 `.well-known/mcp/servers.json`을 통해 서버를 찾을 수 있습니다. 하지만 이 디스크립터의 `documentation` 필드가 다시 `llms.txt`를 가리키므로 두 요소가 완전히 분리되어 작동하는 경우는 드뭅니다.

## 다른 API 제공업체를 위한 지침

제대로 작동하는 `llms.txt`를 공개하기 위해 문서 체계를 처음부터 다시 만들 필요는 없습니다.

1. **H1, 요약, 가장 빠른 연결 방법을 맨 앞에 배치하세요.** 컨텍스트가 작은 에이전트는 첫 몇 줄 이후를 읽지 않을 수 있습니다.
2. **스키마 설명 대신 실행 가능한 요청을 보여주세요.** 실제 필드 이름이 포함된 `curl` 명령 하나가 JSON 본문을 설명하는 단락보다 낫습니다.
3. **팀 구조가 아니라 크기에 따라 분리하세요.** 짧은 루트 파일, 더 완전한 확장 파일, 결제 같은 관심사를 위한 별도 파일을 두면 일반적인 경로를 짧게 유지할 수 있습니다.
4. **상태 코드만 나열하지 말고 실제 실패 사례를 문서화하세요.** 호출이 401과 403 중 어느 쪽을 반환하는지보다 그 이유가 더 중요합니다.
5. **건너뛸 수 있는 내용에는 사양의 규약에 따라 `## Optional` 제목을 사용하세요.**
6. **MCP 서버를 운영한다면 llms.txt와 함께 MCP 검색 디스크립터를 공개하세요.** 하나는 “이것이 무엇인가”에, 다른 하나는 “어떻게 연결하는가”에 답합니다.

## 자주 묻는 질문

### llms.txt란 무엇인가요?

웹사이트 루트에 AI 에이전트에게 사이트나 API가 무엇이고 더 자세한 정보를 어디서 찾을 수 있는지 알려주는 일반 텍스트 Markdown 파일을 공개하기 위한 제안된 규약입니다. 정식 IETF 또는 W3C 표준은 아닙니다. H1 제목, 블록 인용문 형식의 요약, 선택적인 세부 단락, H2로 구분된 링크 목록이라는 특정 순서를 정의하며, “Optional”이라는 제목은 건너뛸 수 있는 자료를 위해 예약되어 있습니다.

### llms.txt는 robots.txt와 어떻게 다른가요?

`robots.txt`는 로봇 배제 프로토콜에 따라 웹 크롤러에게 색인하지 말아야 할 대상을 알려주는 부정적 지침입니다. `llms.txt`는 사이트가 무엇이며 무엇을 읽을 가치가 있는지 알려주는 긍정적 지침입니다. 두 파일은 서로 다른 자동화 독자를 대상으로 하며, 일반적으로 같은 사이트에 함께 존재합니다.

### llms.txt가 MCP를 대체하나요?

아닙니다. `llms.txt`는 에이전트가 API의 기능을 이해하기 위해 한 번 읽는 문서이며, MCP는 클라이언트가 해당 API의 작업을 실제로 호출하기 위해 여는 실시간 프로토콜 연결입니다. Namefi는 둘 다 공개하며, 에이전트에게 MCP 서버가 존재한다는 사실을 처음 알려주는 것이 `llms.txt`입니다.

### Namefi의 llms.txt 파일에는 무엇이 들어 있나요?

기본 URL, MCP 서버 안내, API 키 인증 섹션, 실행 가능한 `curl` 예시를 사용하는 세 단계의 도메인 등록 흐름, DNS 레코드 관리 엔드포인트 표, 도메인 구성 엔드포인트, 문제 해결 섹션, 그리고 SDK·OpenAPI 사양·지갑 결제 및 아웃바운드 워크플로용 보조 파일로 연결되는 “Optional” 섹션이 있습니다.

### AI 에이전트 없이 제가 직접 llms.txt를 읽을 수 있나요?

네. 일반 Markdown이므로 모델뿐 아니라 사람도 읽을 수 있습니다. [namefi.io/llms.txt](https://namefi.io/llms.txt)는 간결한 API 빠른 참조 문서처럼 읽힙니다. 사람이 훑어보기 쉬운 명확한 구성이 모델이 내용을 정확히 파악하는 데도 도움이 됩니다.

## 출처 및 추가 자료

- llmstxt.org — [llms.txt 파일: 배경, 제안 및 형식 사양](https://llmstxt.org/#:~:text=Large%20language%20models%20increasingly%20rely%20on%20website%20information%2C%20but%20face%20a%20critical%20limitation)
- robotstxt.org — [/robots.txt 소개: “핵심 요약”](https://www.robotstxt.org/robotstxt.html#:~:text=Web%20site%20owners%20use%20the%20/robots.txt%20file%20to%20give%20instructions%20about%20their%20site%20to%20web%20robots%3B%20this%20is%20called%20The%20Robots%20Exclusion%20Protocol)
- modelcontextprotocol.io — [Model Context Protocol(MCP)이란?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (이 글에서 주석과 함께 소개한 모든 인용문의 일차 출처)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402, MPP, EIP-712 지갑 결제 흐름)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP 검색 디스크립터)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (Web3 및 아웃바운드 보조 파일을 인라인으로 포함한 단일 파일 확장판)
- IETF — [RFC 8615, Well-Known URI(`.well-known/` 규약)](https://datatracker.ietf.org/doc/html/rfc8615)

## 직접 파일 읽어보기

`llms.txt`를 이해하는 가장 빠른 방법은 실제 파일을 열어보는 것입니다. [namefi.io/llms.txt](https://namefi.io/llms.txt)는 공개되어 있고 인증이 필요 없으며, 이 글을 읽는 데 걸린 시간 안에 충분히 읽을 수 있을 만큼 짧습니다. Namefi에 연결하는 모든 AI 에이전트가 가장 먼저 읽는 바로 그 파일입니다. 그 뒤에 있는 MCP 도구가 실제로 무엇을 하는지 알아보려면 [Namefi MCP 서버: AI 에이전트를 위한 도메인 도구](/ko/blog/namefi-mcp/)를, 편집기에서 연결하려면 [MCP 빠른 시작](/ko/blog/mcp-quickstart/)을, 에이전트가 전체 흐름을 실행하는 모습을 보려면 [Namefi에서 AI 에이전트로 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)을 참조하세요.
