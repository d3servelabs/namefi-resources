---
title: "에이전트 네이티브 도메인 등록대행자란 무엇인가?"
date: '2026-07-10'
language: 'ko'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
format: explainer
ogImage: ../../assets/agent-native-og.jpg
description: "등록대행자는 수십 년간 API를 제공해 왔지만 API만으로는 에이전트 네이티브가 아닙니다. 발견성, 문서, 오류, 결제, 정책 훅 체크리스트를 설명합니다."
keywords: ["에이전트 네이티브 등록대행자", "에이전트 네이티브 정의", "에이전트 네이티브 도메인 등록대행자란", "에이전트 준비 API", "MCP 서버", "llms.txt", "기계 판독 가능 오류", "멱등성", "에이전트 결제", "AI 에이전트 도메인 등록", "자연어 API 문서", "AI 에이전트 정책 훅", "API 키 청구", "지갑 체크아웃 암호화폐 도메인"]
relatedArticles:
  - /ko/blog/ai-domain-platforms/
  - /ko/blog/cf-namecom-namefi/
  - /ko/blog/ai-agent-register/
  - /ko/blog/claude-mcp-domains/
  - /ko/blog/airo-vs-namefi/
relatedTopics:
  - /ko/topics/web3-foundations/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/blockchain-concepts/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/ai-agent/
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/epp/
  - /ko/glossary/x402/
---

도메인 등록대행자는 오래전부터 애플리케이션 프로그래밍 인터페이스를 제공해 왔습니다. 등록대행자가 레지스트리와 통신할 때 사용하는 기계 간 언어인 [Extensible Provisioning Protocol](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol)(EPP)은 [2004년 3월 Proposed Standard 지위에 도달했습니다](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004). 20년이 넘는 시간 전입니다. 그 이후 이를 기반으로 구축된 모든 [ICANN](/ko/glossary/icann/) 공인 [등록대행자](/ko/glossary/registrar/)는 가용성 확인, 등록 요청 제출, 레코드 업데이트를 위한 REST 또는 SOAP API를 어떤 형태로든 제공해 왔습니다. 그러므로 “이 등록대행자는 API가 있나?”라는 질문의 정직한 답은 시장의 거의 모든 등록대행자에게 “그렇다. 그리고 수년 전부터 그랬다”입니다.

하지만 그 질문은 잘못된 질문으로 드러납니다. 사용자를 대신해 도메인을 등록하려는 [AI 에이전트](/ko/glossary/ai-agent/)가 실패하는 이유는 등록대행자에게 API가 없어서가 아닙니다. 그 API가 문서를 한 번 읽고, 통합 코드를 손으로 작성해 배포하는 개발자를 위해 만들어졌기 때문입니다. 즉, 런타임에 API를 발견하고, JSON 응답을 보고 무슨 일이 일어났는지 판단하며, 누군가가 체크아웃 페이지를 보고 있지 않아도 구매를 완료해야 하는 시스템을 위한 것이 아닙니다. 이들은 서로 다른 요구 사항이며, 두 번째 요구 사항을 충족하는 것이 이 글에서 말하는 **에이전트 네이티브**입니다.

이 글은 이 용어를 정확하게 정의하고, 어떤 등록대행자(또는 API든)를 평가할 수 있는 체크리스트를 제시한 뒤, [Namefi](https://namefi.io)를 포함해 2026년에 출시되는 플랫폼에 이 체크리스트를 솔직하게 적용합니다. 정의가 아니라 플랫폼별 비교를 원한다면 [Cloudflare vs Name.com vs Namefi: 에이전트 네이티브 등록대행자](/ko/blog/cf-namecom-namefi/) 또는 더 폭넓은 [AI 에이전트 도메인 플랫폼 가이드](/ko/blog/ai-domain-platforms/)를 보세요. 아직도 “AI와 도메인”을 브랜드에 쓸 법한 문자열을 제안하는 이름 생성기로 생각한다면, 아래 체크리스트는 에이전트 네이티브 기준이 얼마나 더 높은지 보여 줍니다. 그 차이를 자세히 다룬 [AI 도메인 이름 생성기를 넘어서: 에이전트 시대](/ko/blog/beyond-generators/)도 참고하세요.

## “API가 있다”와 “에이전트 네이티브”는 같은 주장이 아닌 이유

전통적인 등록대행자 API는 런타임이 아니라 설계 시점에 사람이 관여한다는 전제를 둡니다. 개발자는 계정을 만들고, 사람을 위해 작성된 레퍼런스 페이지를 읽고, 코드 샘플을 복사한 다음 엔드포인트·인증 헤더·예상 응답 형식을 애플리케이션에 하드코딩합니다. 이것이 끝나면 통합은 사람 없이 실행됩니다. 그러나 이미 사람이 해석 작업을 했기 때문입니다. API 자체에는 사전 통합 없이 처음 등장해, 어떤 작업이 존재하고 어떻게 호출하는지 문맥 안에서 알아내야 하는 시스템이 읽을 수 있는 정보가 없습니다.

에이전트는 계속해서 아무 사전 지식 없이 등장합니다. 코딩 에이전트와의 모든 대화, 새로운 MCP 클라이언트 하나하나는 사실상 이전에 여러분의 API를 본 적 없는 개발자이며, 이를 파악할 수 있는 문맥 예산은 몇 초뿐입니다. “에이전트가 이 API 사용법을 어떻게 배우는가?”라는 질문에 대한 답이 “사람이 수년 전에 문서를 읽고 접착 코드를 작성했다”라면, 구매 시점에 사람이 무엇을 클릭하지 않더라도 API의 실행 경로에는 사람이 영구적으로 끼어 있는 셈입니다. 이 글은 그러한 콜드 스타트 에이전트가 성공하기 위해 등록대행자 자체가 갖춰야 할 조건을 다룹니다. 같은 인수인계 과정을 구매자 관점에서 보고 싶다면 [AI 에이전트가 사람 없이 도메인을 구매하는 방법(2026)](/ko/blog/agents-buy-domains/)을 참고하세요.

## 에이전트 네이티브 체크리스트

에이전트 네이티브 등록대행자는 AI 에이전트가 브라우저 없이, 사람이 미리 문서를 읽지 않아도, 사람이 카드 번호를 입력하지 않아도 스스로 발견하고 이해하고 거래할 수 있는 등록대행자입니다. 단순히 “API가 있다”가 아니라 다음 여섯 가지 조건을 충족해야 합니다.

| 요구 사항 | API가 있는 등록대행자 | 에이전트 네이티브 등록대행자 |
| --- | --- | --- |
| 발견성 | 엔드포인트는 존재하지만, 에이전트에게 기본 URL과 인증 방식을 별도로 알려줘야 함 | 에이전트가 도움 없이 찾아 읽을 수 있는 표준 위치(`llms.txt`, [MCP](https://modelcontextprotocol.io) 서버) |
| 자연어 문서 | 페이지를 훑는 사람을 위해 작성된 레퍼런스 문서 | 에이전트가 추론 시점에 소비하도록 구조화된 문서. 작업, 필수 필드, 효과가 한곳에 있음 |
| 기계 판독 가능 오류 | 로그를 읽는 사람을 위한 HTTP 상태 코드와 설명문 | 에이전트가 프로그래밍 방식으로 분기할 수 있는 안정적인 오류 코드, `retryable` 플래그, 구조화된 세부 정보 |
| 브라우저 없는 구매 | 때로 CAPTCHA 뒤에 있는 호스팅 체크아웃 페이지에서 등록 완료 | 페이지 렌더링 없이 처음부터 끝까지 API 또는 프로토콜로 등록 완료 |
| 프로그래밍 가능한 결제 | 사람의 결제 계정에 저장된 카드가 필요 | 계정에 청구되는 API 키 또는 지갑 서명 트랜잭션처럼 사람이 아닌 주체도 보유할 수 있는 결제 수단 |
| 정책 훅 | 자격 증명이 허용하는 모든 일을 스크립트가 실행하는 것을 막지 못함 | 사람이 한 번 설정한 지출 한도, 확인 단계 또는 범위 제한 키 안에서 에이전트가 작동 |

이 정의를 추출하면 다음과 같습니다. **에이전트 네이티브 등록대행자는 발견성, 자연어 문서, 기계 판독 가능 오류, 브라우저 없는 구매, 프로그래밍 가능한 결제에서 모두 ‘예’로 평가되며, 정책 훅은 이 범주 전체가 아직 해결해 나가는 부분입니다.**

## 발견성: llms.txt와 MCP는 에이전트를 위한 사이트맵

사람 개발자는 검색하거나 문서 사이트를 둘러보며 API를 찾습니다. 에이전트에게는 한 번에 가져와 읽을 수 있는 파일이나, 사용 가능한 작업을 조회할 수 있는 프로토콜 연결이 필요합니다. 오늘날 이 역할을 하는 것이 두 가지입니다.

제안서의 표현을 빌리면 [llms.txt](https://llmstxt.org)는 [“LLM이 추론 시점에 웹사이트를 사용할 수 있도록 정보를 제공하기 위해 `/llms.txt` 파일 사용을 표준화하자는 제안”](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)입니다. `robots.txt`와 같은 발상이지만, 크롤러에게 색인할 수 있는 것을 알려주는 대신 언어 모델에게 사이트가 무엇이고 어떻게 사용할지를 알려줍니다. 등록대행자가 이 파일을 게시할 때 어떤 모습인지 알고 싶다면 [도메인용 llms.txt: 모든 AI 에이전트가 읽을 수 있는 API](/ko/blog/llms-txt/)를 보세요.

[MCP(Model Context Protocol)](https://modelcontextprotocol.io)는 인접한 문제를 해결합니다. 이는 [“AI 애플리케이션을 외부 시스템에 연결하는 오픈 소스 표준”](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)입니다. llms.txt가 에이전트가 스스로 방향을 잡기 위해 한 번 읽는 문서라면, MCP는 에이전트의 클라이언트가 정해진 호출 가능 도구를 제공하는 서버에 여는 라이브 연결입니다. 둘은 경쟁하지 않고 상호 보완적입니다. llms.txt는 에이전트에게 등록대행자가 존재하고 대략 무엇을 할 수 있는지 알리는 방법이며, MCP는 에이전트 클라이언트가 실제로 연결해 작업을 호출하는 방법입니다.

Namefi는 둘 다 게시합니다. [namefi.io/llms.txt](https://namefi.io/llms.txt)의 진입점에는 `api.namefi.io/mcp`의 MCP 서버, `namefi.io/.well-known/mcp/servers.json`의 MCP 발견 파일, 지갑 기반 결제 및 아웃바운드 에이전트 워크플로용 보조 파일을 포함한 완전한 REST 레퍼런스가 문서화되어 있습니다. 두 기존 대형 업체를 직접 확인해 보면, Cloudflare의 등록대행자 문서는 자체 `llms.txt`를 `developers.cloudflare.com/registrar/llms.txt`에 게시합니다. 그러나 공개 문서 어디에도 Cloudflare가 등록대행자 제품을 위한 전용 MCP 서버를 운영한다고 명시하지 않습니다. 보도에 따르면 베타의 핵심은 [“API가 개발자가 이미 작업하는 도구, 즉 Cursor와 Claude Code 같은 MCP 지원 코드 에디터 안에서 작동하도록 설계되었다”](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code)는 것입니다. 이는 더 좁은 주장입니다. 에디터가 MCP를 지원하는 것이지, 반드시 Cloudflare 등록대행자 자체가 지원한다는 뜻은 아닙니다. 직접 확인한 GoDaddy 개발자 포털은 사람 개발자를 위한 REST 엔드포인트를 문서화하며, 이 글 작성 시점 기준으로 `llms.txt`나 MCP 서버 참조를 보여 주지 않습니다.

## 결제: 저장된 카드가 에이전트를 막는 이유와 그 대안

소비자 웹 결제 스택은 사람을 중심으로 구축되어 있어, 구매 단계에서 사람 참여 전제를 없애기가 가장 어렵습니다. 저장된 카드, 청구 주소, 그리고 때로는 사람이 아닌 무엇이든 걸러내도록 설계된 CAPTCHA가 필요합니다. 에이전트는 카드 양식을 채울 수 없고, 기술적으로 가능하더라도 사람의 카드 번호 원문을 넘겨 사람이 아닌 척하게 하는 것은 나쁜 보안 모델입니다.

두 가지 대안이 출시되고 있습니다. 첫 번째는 API 키 청구입니다. 등록대행자는 선불 충전 또는 청구 계정에 연결된 자격 증명을 발급하고, 에이전트는 카드 대신 그 키로 모든 호출을 인증합니다. Namefi 문서는 [namefi.io/api-key](https://namefi.io/api-key)에서 이 키를 생성하고 모든 요청에 `x-api-key` 헤더로 전달하는 방식을 설명합니다. 브라우저 세션도 카드 양식도 필요 없습니다. Cloudflare의 `.ai` 가격은 같은 원가 논리를 따릅니다. [“.ai 도메인 등록과 갱신을 추가 마진 없이 도매 가격으로 제공한다”](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)는 것입니다. 프로모션에 따라 달라지는 가격보다 고정되고 예측 가능한 가격이 에이전트가 추론하기 더 쉽습니다.

두 번째 대안은 계정만이 아니라 계정 자체를 없애는 지갑 서명 결제입니다. Namefi의 `web3` 문서는 HTTP 402 상태 코드와 [x402](/ko/glossary/x402/) 패턴을 기반으로 한 흐름을 설명합니다. 결제 없이 도메인을 요청하면 402 응답으로 가격이 반환되고, 호출자의 지갑이 EIP-3009 승인을 서명한 뒤, 서명된 승인이 헤더로 다시 전송되어 한 단계에서 등록과 결제가 완료됩니다. 명시적으로 [“Namefi 계정이나 EIP-712 서명이 필요하지 않습니다.”](https://namefi.io/web3/llms.txt) 여기서 핵심은 더 좁습니다. 저장된 신용카드는 구조적으로 할 수 없지만, 소프트웨어는 이 결제 수단을 스스로 보유하고 사용할 수 있다는 점입니다. 이 전체 흐름은 [암호화폐 지갑으로 도메인 결제하기: 계정 불필요](/ko/blog/wallet-checkout/)에서 단계별로 확인할 수 있습니다.

## 정책 훅: 이 범주 전체가 아직 해결하지 못한 행

이 부분이 정직한 공백입니다. 발견성, 기계 판독 가능 문서, 구조화된 오류, 프로그래밍 가능한 결제는 등록대행자가 한 번 구축해 제공할 수 있습니다. 하지만 지출 한도, 임계값 이상의 확인 단계, 하나의 TLD나 예산으로 범위가 제한된 키 같은 정책 훅은 다릅니다. API 사용의 편의가 아니라 권한을 위임한 사람을 보호하기 때문입니다.

Namefi 자체 문서를 확인해 가장 검증 가능한 사례를 보면, Namefi는 특정 작업을 중대한 작업으로 표시하고 구조화된 기계 판독 가능 오류(안정적인 코드, `retryable` 플래그, 구조화된 세부 정보)를 문서화합니다. 이 항목에서는 실질적인 진전입니다. 그러나 이 글 작성 시점 기준 공개 API 레퍼런스에서 문서화된 지출 한도 기본 기능이나 서버 측 확인 게이트는 찾지 못했습니다. 이 보호 장치는 현재 한 단계 위, 즉 사람이 MCP 클라이언트에 설정하는 정책에 있습니다. Cloudflare 또는 Name.com의 등록대행자 API에서도 지출 한도 기본 기능에 관한 공개 문서는 찾지 못했습니다. 이는 다음에 모든 에이전트 네이티브 등록대행자가 해결해야 할 항목입니다.

## 오늘날 플랫폼을 체크리스트로 평가하기

마케팅 문구가 아니라 각 플랫폼의 라이브 문서를 직접 확인한 결과를 바탕으로, 이 영역에서 가장 자주 언급되는 세 플랫폼을 여섯 항목 체크리스트로 평가하면 다음과 같습니다.

| 등록대행자 | 발견성 | 자연어 문서 | 기계 판독 가능 오류 | 브라우저 없는 구매 | 프로그래밍 가능한 결제 | 정책 훅 |
| --- | --- | --- | --- | --- | --- | --- |
| Namefi | 예 — llms.txt + MCP 서버 | 예 — llms.txt 묶음 | 예 — 구조화된 코드 | 예 — REST + MCP | 예 — API 키 또는 지갑(x402) | 아직 문서화되지 않음 |
| Cloudflare Registrar | 일부 — 자체 llms.txt, MCP는 전용 서버가 확인된 것이 아니라 에디터 수준 | 불명확 — llms.txt 인덱스 외에는 검증하지 못함 | 불명확 — 공개 문서에서 검증하지 못함 | 예 — 베타 보도에 따른 API 기반 | 예 — API 키, 원가 가격 | 아직 문서화되지 않음 |
| Name.com | 불명확 — 확인한 도메인 루트에서 llms.txt를 찾지 못함 | Name.com 자체 발표에서는 주장하나 추가 독립 검증은 하지 못함 | 확인한 기존 문서에서는 찾지 못했으며, 최신 API는 불명확 | 독립 검증하지 못함 | 일부 — 계정 크레딧 청구만 문서화됨 | 아직 문서화되지 않음 |

세 플랫폼 모두에서 비어 있는 행인 정책 훅은 어느 한 플랫폼을 비판하기 위한 것이 아니라 업계 전반의 실제 공백입니다. 이 분야가 발전함에 따라 다시 확인할 가치가 있습니다.

## 자주 묻는 질문

### 에이전트 네이티브 도메인 등록대행자란 무엇인가요?

에이전트 네이티브 등록대행자는 AI 에이전트가 브라우저 없이, 사람이 사전에 문서를 읽지 않아도, 사람이 카드 번호를 입력하지 않아도 스스로 발견하고 이해하고 거래할 수 있는 등록대행자입니다. 발견성(`llms.txt` 파일 또는 MCP 서버), 자연어 문서, 기계 판독 가능 오류, 브라우저 없는 구매, 프로그래밍 가능한 결제에서 모두 ‘예’로 평가되며, 정책 훅(지출 한도, 확인 게이트)은 이 범주가 아직 구축하는 부분입니다.

### AI 에이전트는 왜 일반 등록대행자 API를 사용할 수 없나요?

기술적으로는 엔드포인트를 호출할 수 있지만, 대부분의 등록대행자 API는 사람이 이미 문서를 읽고 통합 코드를 미리 작성했다는 전제를 둡니다. 사전 통합이 없는 에이전트에게는 기본 URL을 발견하고, 인증 방식을 배우고, 설명문 형태의 오류 메시지를 해석할 표준적인 방법이 없습니다. API가 작동하는 것은 콜드 스타트 에이전트가 읽을 수 있어서가 아니라 사람이 이미 해석 작업을 했기 때문입니다.

### llms.txt와 MCP의 차이는 무엇인가요?

`llms.txt`는 에이전트가 사이트나 API가 무엇이고 어떻게 쓰는지 배우기 위해 한 번 읽는 일반 텍스트 파일입니다. 크롤러에게 `robots.txt`가 하는 역할과 같지만, 언어 모델을 위해 작성됩니다. [MCP](https://modelcontextprotocol.io)는 에이전트의 클라이언트가 호출 가능한 도구를 제공하는 서버에 여는 라이브 프로토콜 연결입니다. 둘은 상호 보완적입니다. llms.txt는 발견이고, MCP는 에이전트가 행동하기 위해 사용하는 연결입니다. 발견 측면을 더 보려면 [도메인용 llms.txt: 모든 AI 에이전트가 읽을 수 있는 API](/ko/blog/llms-txt/)를 참고하세요.

### 내 API를 에이전트가 사용할 수 있게 하려면 어떻게 해야 하나요?

모델을 위한 API 설명을 담은 `llms.txt`를 게시하고, MCP 서버(또는 최소한 OpenAPI로 문서화된 엔드포인트)를 제공하며, 설명문 대신 안정적인 코드를 가진 구조화된 오류를 반환하세요. 모든 쓰기 작업이 호스팅 체크아웃 페이지 없이 완료될 수 있게 하고, 사람의 카드가 필요하지 않은 결제 수단을 지원하며, 자격 증명을 보유한 사람이 에이전트에 허용할 범위를 제한할 수 있도록 지출 또는 확인 한도를 추가해야 합니다.

### Namefi는 에이전트 네이티브인가요?

위 체크리스트에 따르면 Namefi는 직접 검증한 여섯 항목 중 다섯 항목에서 ‘예’입니다. `llms.txt` 묶음과 MCP 서버를 게시하고, 문서는 에이전트 소비를 위해 구조화되어 있으며, 아웃바운드 API는 구조화된 기계 판독 가능 오류를 반환합니다. 등록은 대시보드 없이 API 또는 x402 기반 지갑 흐름으로 완전히 완료되고, 결제는 API 키나 계정 없이 가능한 지갑 서명 트랜잭션으로 작동합니다. 정책 훅은 공개 API 레퍼런스에 아직 문서화되어 있지 않으며, 현재 그 제어는 클라이언트 측에 있습니다. <!-- TODO: 팀에 확인 — 지출 한도 또는 구매 확인 기능이 가까운 로드맵에 있는지 -->

### MCP 서버가 있으면 자동으로 등록대행자가 에이전트 네이티브가 되나요?

아니요. MCP 지원은 발견성과 브라우저 없는 구매를 다루지만, 등록대행자가 MCP 서버를 제공하면서도 구조화되지 않은 오류를 반환하거나, 저장된 카드를 요구하거나, 지출 한도 메커니즘이 전혀 없을 수 있습니다. 에이전트 네이티브는 단일 항목이 아니라 전체 체크리스트입니다.

## 출처 및 추가 읽을거리

- Wikipedia — [Extensible Provisioning Protocol(EPP, 2004년 3월 Proposed Standard로 표준화)](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- CircleID — [2026년의 도메인 세계: AI, 보안, 시장 성숙도, 새로운 gTLD 프런티어(“AI 에이전트는 점점 도메인 리셀러로 활동하고 있다…“)](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- webhosting.today — [AI 에이전트는 이제 사람 없이 도메인을 등록할 수 있습니다(Cloudflare Registrar API 베타, 2026년 4월)](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code)
- Name.com — [최초의 AI 네이티브 도메인 플랫폼(“Model Context Protocol 같은 최신 표준 지원…“)](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=Our%20platform%20is%20supported%20by%20modern%20standards%20like%20Model%20Context%20Protocol)
- llmstxt.org — [/llms.txt 파일 제안](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- modelcontextprotocol.io — [Model Context Protocol(MCP)이란 무엇인가?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Schema.org — [FAQPage](https://schema.org/FAQPage)
- Cloudflare — [.ai 도메인을 원가로 구매](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)
- Cloudflare Developers — [등록대행자 문서 인덱스(llms.txt)](https://developers.cloudflare.com/registrar/llms.txt)
- Namefi — [namefi.io/llms.txt(API 및 MCP 서버 레퍼런스 — 이 글의 Namefi 제품 주장에 대한 출처)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt(지갑 서명 / x402 결제 흐름, “Namefi 계정이나 EIP-712 서명 불필요”)](https://namefi.io/web3/llms.txt)
