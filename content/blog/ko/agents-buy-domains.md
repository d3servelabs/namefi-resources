---
title: "AI 에이전트가 사람 없이 도메인을 구매하는 방법 (2026)"
date: '2026-07-10'
language: 'ko'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/agents-buy-domains-og.jpg
description: "2026년 4월, 도메인 등록이 에이전트 레이어로 옮겨갔습니다. AI 에이전트가 도메인을 검색하고, 가격을 확인하고, 등록하는 방식과 여전히 중요한 가드레일을 설명합니다."
keywords: ["AI 에이전트 도메인 등록", "사람 없이 도메인 등록", "자율 도메인 등록", "에이전트 레이어 도메인 등록", "Cloudflare Registrar API 베타", "에이전트 가드레일", "2026 AI 에이전트 도메인 등록", "AI가 도메인을 사게 해도 안전한가", "도메인 리셀러로서의 에이전트", "MCP 도메인 등록", "llms.txt 도메인 검색", "AI 에이전트 지출 한도", "EPP 레지스트리 프로비저닝"]
relatedArticles:
  - /ko/blog/ai-domain-platforms/
  - /ko/blog/cf-namecom-namefi/
  - /ko/blog/agent-native/
  - /ko/blog/namefi-mcp/
  - /ko/blog/state-of-agentic/
relatedTopics:
  - /ko/topics/domain-basics/
  - /ko/topics/domain-security/
relatedSeries:
  - /ko/series/blockchain-concepts/
  - /ko/series/domain-apocalypse/
relatedGlossary:
  - /ko/glossary/ai-agent/
  - /ko/glossary/epp/
  - /ko/glossary/registrar/
  - /ko/glossary/registry/
  - /ko/glossary/reseller/
---

20년 동안 도메인 등록은 늘 같은 작은 의식과 같았습니다. 검색창에 이름을 입력하고, 초록색 확인 표시를 기다린 뒤, 카드 번호를 넣고, 사진에서 횡단보도를 고르며 사람이 맞다는 것을 증명하고, 구매를 클릭하는 과정입니다. 이 절차는 일부러 만들어진 필터이기도 했습니다. [CAPTCHA](https://en.wikipedia.org/wiki/CAPTCHA), 결제 양식, 카드 입력란은 모두 사람이 아닌 무언가의 속도를 늦추기 위해 존재합니다.

2026년 4월 15일, 이 필터는 더 이상 보편적이지 않게 되었습니다. Cloudflare는 Registrar API를 퍼블릭 베타로 공개했고, 업계 보도는 그 취지를 직설적으로 요약했습니다. Cloudflare가 ["그 거래를 에이전트 레이어로 옮겼다"](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer)는 것입니다. 이는 양식에서 사람이 클릭하는 대신 소프트웨어가 구매를 시작하는 아키텍처 계층을 뜻합니다. 키보드 앞의 사람을 전제로 했기 때문에 완전 자동화에 저항해 왔던 등록, DNS, 그리고 몇 가지 다른 작업은 조용히 그 전제를 버리기 시작했습니다.

이 글은 그 변화 자체를 다룹니다. 기술적으로 무엇이 바뀌었는지, [AI 에이전트](/ko/glossary/ai-agent/)가 사용자를 대신해 도메인을 등록할 때 실제로 무엇을 하는지, 그리고 "사람 없이 가능"이라는 주장을 의심해 볼 만한 이유가 있으므로 안전하려면 무엇이 여전히 충족되어야 하는지를 설명합니다. 오늘날 어떤 플랫폼이 이를 제공하는지 플랫폼별로 살펴보려면 [AI 에이전트형 도메인 플랫폼: 2026 가이드](/ko/blog/ai-domain-platforms/)와 [Cloudflare vs Name.com vs Namefi](/ko/blog/cf-namecom-namefi/)를 참고하세요. 등록대행자가 에이전트에 의해 사용 가능하려면 근본적으로 무엇이 필요한지의 정의는 [에이전트 네이티브 도메인 등록대행자란?](/ko/blog/agent-native/)를 참고하세요.

## 기술적으로 무엇이 바뀌었나

도메인 산업이 2026년 4월에 규칙을 다시 쓴 것은 아닙니다. [등록대행자](/ko/glossary/registrar/)는 그보다 수십 년 전부터 [EPP](/ko/glossary/epp/) 기반의 프로그래밍 가능한 API를 제공해 왔습니다. 바뀐 것은 그 API를 누가 이해하고 사용할 수 있는가입니다.

기존 등록대행자의 결제 과정은 사람이 페이지를 읽고, 카드를 입력하고, 구매가 완료되기 전에 봇이 아님을 증명하는 것을 중심으로 만들어졌습니다. 각각의 전제는 에이전트에게 장벽이 됩니다. CAPTCHA는 사람 아닌 모든 것을 차단하기 위해 존재하므로, 악용을 막는 만큼 사람의 지시에 따라 움직이는 합법적 에이전트도 차단합니다. Cloudflare 베타를 기반으로 한 제3자 MCP 튜토리얼은 기존 모델을 명확히 표현했습니다. ["도메인 등록대행자는 사람을 위해 만들어졌습니다. CAPTCHA, 대시보드, 양식, 신용카드 입력란. 에이전트 친화적이라고 하기는 어렵습니다."](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26#:~:text=Domain%20registrars%20are%20built%20for%20humans%3A%20CAPTCHAs%2C%20dashboards%2C%20forms%2C%20credit%20card%20fields.%20Not%20exactly%20agent-friendly.)

이 모델을 대체한 것은 세 가지이며, 서로 경쟁하는 대신 겹쳐 쌓입니다.

- **인증된 REST API**는 렌더링된 결제 페이지가 아니라 HTTP 호출로 구매를 완료하게 합니다. Cloudflare의 베타는 이런 방식으로 검색, 이용 가능 여부, 등록을 지원하며, 출시 보도에 따르면 표준 도메인의 등록은 "수 초 내에 동기적으로 완료"됩니다.
- **[MCP](https://modelcontextprotocol.io) (Model Context Protocol)**는 자체 문서에서 ["AI 애플리케이션을 외부 시스템에 연결하기 위한 오픈 소스 표준"](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)이라고 설명합니다. 이는 에이전트에게 맞춤 통합 코드를 건네는 것과, 에이전트가 등록대행자의 도구(`search`, `register`, `set_dns_record`)를 찾아 Claude, Cursor 또는 다른 호환 클라이언트 안에서 직접 호출할 수 있게 하는 것의 차이입니다. Cloudflare는 Registrar API를 이 계층에 연결했습니다. 자체 설명에 따르면, "Cursor, Claude Code 또는 MCP 호환 환경에서 작업하는 에이전트는 별도의 통합 단계 없이 Registrar 엔드포인트를 발견하고 호출할 수 있습니다."
- **[llms.txt](https://llmstxt.org) 검색**은 ["LLM이 추론 시 웹사이트를 사용하는 데 도움이 되는 정보를 제공하기 위해 `/llms.txt` 파일을 사용하는 표준화 제안"](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)인 일반 텍스트 규약입니다. 사람이 먼저 대화에 API 문서를 붙여 넣지 않아도, 특정 등록대행자를 처음 보는 에이전트가 무엇을 할 수 있는지 알아낼 수 있게 합니다.

이 세 가지 요소 자체는 새롭지 않습니다. MCP는 2024년 말에 출시되었고, llms.txt도 같은 해에 제안되었습니다. 새로워진 것은 주류 등록대행자가 이 세 가지를 모두 실제 구매 흐름 뒤에 배치했다는 점입니다. 이 때문에 "AI 에이전트가 도메인을 등록한다"는 말이 취미 개발자의 데모가 아니라 헤드라인이 되었습니다.

## 에이전트가 실제로 하는 일

마케팅 표현을 걷어 내면 에이전트형 도메인 구매는 짧고 기계적인 순서입니다. 사람이 결제 페이지에서 따르는 것과 같은 순서이지만, 클릭 대신 API 호출로 실행됩니다. 여기에는 에이전트, 등록대행자의 API, 그리고 그 뒤에 있는 [레지스트리](/ko/glossary/registry/)라는 세 주체가 관여합니다.

1. **검색.** 에이전트는 후보 이름 또는 필요한 이름에 대한 설명을 넣어 등록대행자의 검색 엔드포인트(또는 동등한 MCP 도구)를 호출하고, 이용 가능한 변형과 이미 사용 중인 변형의 목록을 받습니다.
2. **이용 가능 여부와 가격 확인.** 특정 이름에 대해 에이전트는 실시간 이용 가능 여부와 정확한 가격, 즉 등록 수수료, 프리미엄 할증, 그리고 적용되는 경우 [ICANN](/ko/glossary/icann/) 거래 수수료를 조회합니다. 여기서는 선별된 [TLD](/ko/glossary/tld/) 목록이 중요합니다. Cloudflare를 포함한 여러 에이전트 네이티브 베타는 출시 시 전체 카탈로그가 아니라 인기 TLD의 일부만 지원합니다.
3. **인증 및 권한 부여.** 에이전트는 로그인 페이지 뒤의 저장된 카드가 아니라, 등록대행자가 프로그래밍 방식으로 검증할 수 있는 인증 정보, 즉 자금이 충전된 계정에 연결된 API 키나 지갑 서명을 제시합니다.
4. **등록.** 에이전트가 등록 엔드포인트를 호출합니다. 등록대행자는 2004년에 Proposed Standard 지위에 도달한 뒤 레지스트리와 통신하기 위해 등록대행자들이 사용해 온 [EPP](/ko/glossary/epp/), 즉 [Extensible Provisioning Protocol](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol)을 통해 요청을 도메인의 [레지스트리](/ko/glossary/registry/)로 전달합니다. 레지스트리는 레코드를 생성하고, API는 보통 수 초 안에 확인 결과를 반환합니다.
5. **DNS 구성.** 이름을 확보한 뒤 에이전트는 [네임서버 (NS 레코드)](/ko/glossary/nameserver/) 또는 개별 DNS 레코드, 예를 들어 서버를 가리키는 A 레코드나 호스팅 플랫폼을 가리키는 CNAME을 설정합니다. 대개 이는 같은 대화에서 이름을 등록한 바로 다음 호출입니다.
6. **사람에게 확인 결과 전달.** 잘 설계된 에이전트 흐름에서 사람은 나중에 카드 명세서를 보고 구매 사실을 알게 되지 않습니다. 에이전트가 이름, 가격, 도메인이 가리키도록 설정한 대상을 알려 줍니다.

이 여섯 번째 단계는 보기보다 더 많은 역할을 합니다. 다음 절의 주제이기도 합니다.

## 가드레일: "사람 없이 가능"에도 사람이 정한 정책은 필요하다

"사람 없이 가능"은 거버넌스가 아니라 메커니즘을 설명합니다. API는 거래 중간에 사람이 버튼을 클릭할 필요가 없지만, 누군가는 에이전트가 부여받은 권한으로 무엇을 할 수 있는지 미리 결정해야 합니다. Cloudflare의 베타 문서는 이 책임이 어디에 있는지 명확히 말합니다. ["승인 없이 도메인을 구매하지 않는 에이전트 흐름을 설계하는 것은 사람의 책임입니다."](https://blog.cloudflare.com/registrar-api-beta/) API는 결제 페이지 없이 등록을 가능하게 하지만, 언제 등록할지를 스스로 결정하게 하지는 않습니다. 그 정책은 에이전트를 통합하는 사람이 작성해야 합니다.

실무에서 대부분의 역할을 하는 가드레일은 세 가지입니다.

- **그냥 카드 번호가 아닌 결제 승인.** 선불 또는 청구서 결제 잔액에 청구되는 API 키는 구조적으로 전체 노출액을 제한합니다. 에이전트는 충전된 금액 이상을 쓸 수 없습니다. 지갑 서명 거래는 구매마다 승인되며 재사용할 수 없습니다. 둘 다 내장된 한도가 없는 저장된 신용카드와는 위험 구조가 실질적으로 다릅니다.
- **사람이 에이전트가 행동하기 전에 설정하는 지출 한도와 확인 임계값.** "잘 설계된 에이전트 흐름"에 대한 Cloudflare의 지침은 등록 엔드포인트를 호출한 뒤가 아니라 그 전에 사용자에게 도메인 이름과 가격을 확인하도록 하는 것입니다. API는 이 패턴을 지원하지만 강제하지는 않습니다.
- **법적 책임을 지는 명확한 주체.** 에이전트가 이름을 등록해도, 도메인에 기록상의 [등록자](/ko/glossary/registrant/)가 있다는 법적 현실은 사라지지 않습니다. 에이전트 보유 도메인에 대한 한 글은 그 위험을 명확히 표현했습니다. 누군가 그 인증 정보로 무엇이 등록되는지 모니터링하지 않는다면, ["에이전트가 등록한 도메인이 상표 분쟁으로 판명될 때 UDRP 민원에 대응할 사람이 없다"](https://dev.to/purpleflea/how-ai-agents-can-buy-their-own-domain-names-and-why-this-matters-1l4j#:~:text=If%20an%20agent%20registers%20a%20domain%20that%20turns%20out%20to%20be%20a%20trademark%20conflict%2C%20there%27s%20no%20human%20to%20respond%20to%20a%20UDRP%20complaint)는 것입니다. 결제 페이지를 없애도 [UDRP (통일 도메인 이름 분쟁 해결 정책)](/ko/glossary/udrp/) 절차, 갱신 기한, [WHOIS (및 RDAP)](/ko/glossary/whois/) 기록은 없어지지 않습니다. 누군가는 그 모니터링을 의도적으로 설계해야 합니다.

곱씹어 볼 만한 점이 있습니다. 도메인을 등록할 수 있는 에이전트는 돈을 쓰고, 각 거래를 사람이 검토하지 않아도 도메인 포트폴리오를 쌓을 수 있습니다. 바로 그 능력이 이 기능을 유용하게 만들며, 바로 그 이유로 정책 계층은 선택 사항이 아닙니다.

## 오늘날 누가 이를 제공하는가, 그리고 리셀러 논제

Cloudflare의 베타가 이 변화의 가장 많이 보도된 사례이지만, 유일한 사례는 아닙니다. Name.com은 2025년 중반부터 동일한 MCP 및 OpenAPI 접근법을 중심으로 비교 가능한 API를 구축했고, Namefi는 MCP 서버와 계정 생성을 완전히 건너뛰는 지갑 서명 결제를 운영합니다. 가격 모델, TLD 지원 범위, 결제에 기존 계정이 필요한지 같은 기능별 차이는 [Cloudflare vs Name.com vs Namefi: 에이전트 네이티브 등록대행자](/ko/blog/cf-namecom-namefi/)에서 다룹니다. 대형 소비자용 등록대행자가 이 범주에 미치지 못하는 지점을 포함한 전체 지형은 [AI 에이전트형 도메인 플랫폼: 2026 가이드](/ko/blog/ai-domain-platforms/)에서 볼 수 있습니다.

개별 플랫폼보다 새로운 것은 에이전트가 이 능력을 갖춘 뒤 무엇을 하기 시작하는가입니다. CircleID의 2026년 중반 도메인 산업 조사에서는 이렇게 표현했습니다. ["AI 에이전트는 사람이 개입하지 않고 이용 가능 여부를 확인하고, 이름을 등록하고, DNS를 구성하는 도메인 리셀러로서 점점 더 활동하고 있습니다."](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) 이는 의도적인 단어 선택입니다. [리셀러](/ko/glossary/reseller/)는 자체 인증을 보유하는 대신 등록대행자의 인증 아래에서 도메인을 판매하거나 프로비저닝하는 당사자라는, 확립된 역할입니다. 에이전트를 새로운 범주가 아니라 비공식 리셀러로 표현하는 것은, 운영자가 사람이 아니어도 워크플로 자체는 익숙하다는 뜻입니다. 즉, 다른 사람을 위해 대규모로 검색하고, 가격을 확인하고, 등록하고, 구성하는 일입니다. 이 패턴이 실제로 어디까지 진전했는지, 무엇이 아직 발표에 그치는지는 [에이전트형 도메인 관리의 현황, 2026](/ko/blog/state-of-agentic/)에서 추적합니다. [Namefi 자체 MCP 서버](/ko/blog/namefi-mcp/)는 리셀러형 에이전트가 호출할 도구의 한 가지 구체적 예입니다.

## 자주 묻는 질문

### 2026년 4월 15일에 정확히 무엇이 바뀌었나요?

Cloudflare는 도메인 검색, 이용 가능 여부 및 가격 확인, 등록을 지원하는 Registrar API를 퍼블릭 베타로 공개하고, Cursor와 Claude Code 같은 도구에서 에이전트가 이미 사용하던 Cloudflare MCP 서버에 연결했습니다. 이는 에이전트가 호출할 수 있는 최초의 등록대행자 API는 아니었습니다. Name.com은 2025년 중반에, Namefi는 그보다 앞서 출시했습니다. 하지만 익숙한 대형 등록대행자가 브라우저 결제만이 아니라 에이전트가 전체 구매를 완료할 수 있게 한 사례로는 가장 널리 보도되었습니다.

### AI 에이전트가 등록하는 모든 도메인에 대해 내 허가가 필요한가요?

API 수준에서는 기본적으로 그렇지 않습니다. 엔드포인트는 유효하고 승인된 인증 정보와 청구 가능한 가격을 받는 즉시 등록을 완료합니다. 확인 단계가 있는지는 에이전트를 어떻게 구성하느냐에 따라 결정되며, 등록대행자가 자동으로 강제하는 것은 아닙니다. Cloudflare의 자체 지침도 구매 전 승인을 요구하도록 에이전트 흐름을 설계하는 것은 그 흐름을 만드는 사람의 책임이라고 명시합니다.

### 모든 거래를 지켜보지 않고 AI 에이전트가 도메인을 사게 해도 실제로 안전한가요?

기본값으로 더 안전한 것이 아니라, 사전에 설정한 가드레일만큼 안전합니다. 작동 가능한 패턴은 총 노출액을 제한하는 선불 또는 청구서 결제 잔액, 한 번의 구매를 승인하고 재사용할 수 없는 지갑 서명, 그리고 선택한 임계값을 넘을 때의 확인 단계입니다. 이 분야의 어떤 플랫폼도 사용자를 대신해 보편적인 지출 한도를 강제하지는 않습니다. 그 한도는 사용자가 설정합니다.

### AI 에이전트가 도메인을 등록하면 법적 책임은 누구에게 있나요?

도메인에는 여전히 기록상의 [등록자](/ko/glossary/registrant/)가 있으며, AI 모델 자체가 아니라 개인 또는 조직인 그 등록자가 상표 분쟁, [UDRP (통일 도메인 이름 분쟁 해결 정책)](/ko/glossary/udrp/) 민원 또는 갱신 기한에 노출됩니다. 구매 단계에서 사람을 없애도 소유 기록에서 사람이 사라지는 것은 아닙니다. 단지 모니터링을 설계하지 않으면 그 위험을 지켜보는 사람이 없을 수 있다는 뜻입니다.

### AI 에이전트는 공식 인증을 받은 도메인 리셀러가 되고 있나요?

ICANN 인증의 의미에서는 아닙니다. [리셀러](/ko/glossary/reseller/)는 보통 등록대행자의 인증 계약 아래에서 운영되는 회사입니다. CircleID의 표현은 법적 지위가 아니라 행동 패턴을 묘사하기 위해 "리셀러"를 사용합니다. 그러한 행동이 공식적으로 인정된 범주로 굳어질지는 [에이전트형 도메인 관리의 현황, 2026](/ko/blog/state-of-agentic/)에 남은 열린 질문 중 하나입니다.

### 모든 TLD에서 작동하나요, 아니면 인기 있는 TLD에서만 작동하나요?

플랫폼에 따라 다릅니다. 전체 지원을 가정하기보다 직접 확인할 가치가 있습니다. Cloudflare의 베타는 자체 자료에서 전체 카탈로그가 아니라 선별된 인기 TLD 집합으로 출시되었다고 설명합니다. 베타가 성숙함에 따라 지원 범위가 넓어지는 경향이 있으므로, 특정 확장자에 의존하기 전에는 플랫폼의 실시간 문서에서 현재 TLD 지원 여부를 확인하세요.

## 결제 페이지 없이, 다음 도메인은 자신의 에이전트로 등록하세요

[Namefi](https://namefi.io)는 이 글에서 설명한 것과 같은 에이전트 네이티브 구매 경로를 운영합니다. 에이전트가 직접 연결하는 MCP 서버, 문서화된 REST API, 계정 생성을 완전히 건너뛰는 지갑 서명 결제에 더해, 에이전트의 지갑이 도메인 자체를 자산으로 보유하게 하고 싶을 때 사용할 수 있는 [토큰화 도메인](/ko/glossary/tokenized-domain/) 소유권도 제공합니다. 지출 정책을 한 번 설정한 뒤, 이 글에서 설명한 대로 에이전트가 검색, 가격 확인, 등록을 처리하게 하세요.

**[Namefi에서 도메인 검색 및 등록하기](https://namefi.io).**

## 참고 자료와 추가 읽을거리

- Cloudflare Blog — [Registrar API 베타 발표](https://blog.cloudflare.com/registrar-api-beta/) (출시일, 지원 작업, 원가 기반 가격, MCP 통합, 사람의 승인에 관한 지침)
- webhosting.today — [AI 에이전트는 이제 사람 없이 도메인을 등록할 수 있습니다](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer) (2026년 4월 Cloudflare 베타를 "에이전트 레이어" 전환으로 본 업계의 관점)
- dev.to — [AI 에이전트로 사람 없이 도메인 이름을 등록하는 방법](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26#:~:text=Domain%20registrars%20are%20built%20for%20humans%3A%20CAPTCHAs%2C%20dashboards%2C%20forms%2C%20credit%20card%20fields.%20Not%20exactly%20agent-friendly.) (기존 결제 페이지 모델과 에이전트 호출형 등록을 비교한 제3자 MCP 튜토리얼)
- dev.to — [AI 에이전트가 자체 도메인 이름을 구매하는 방법과 그 중요성](https://dev.to/purpleflea/how-ai-agents-can-buy-their-own-domain-names-and-why-this-matters-1l4j#:~:text=If%20an%20agent%20registers%20a%20domain%20that%20turns%20out%20to%20be%20a%20trademark%20conflict%2C%20there%27s%20no%20human%20to%20respond%20to%20a%20UDRP%20complaint) (에이전트 보유 도메인과 법적 노출의 간극에 관한 글)
- CircleID — [2026년의 도메인 세계: AI, 보안, 시장 성숙도, 새로운 gTLD의 최전선](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) (2026년 4월, 에이전트가 리셀러로 활동한다는 분석)
- modelcontextprotocol.io — [Model Context Protocol (MCP)이란?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems) (프로토콜 개요)
- llmstxt.org — [/llms.txt 파일 제안](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time) (규격과 근거)
- Wikipedia — [Extensible Provisioning Protocol (Proposed Standard, 2004년 3월)](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (Namefi 자체 MCP 서버, REST API, 지갑 결제 참고 자료)
