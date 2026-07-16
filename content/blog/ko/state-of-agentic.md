---
title: "2026년 에이전틱 도메인 관리 현황"
date: '2026-07-10'
language: 'ko'
tags: ['ai-agents', 'domains', 'analysis']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: analysis
ogImage: ../../assets/state-of-agentic-og.jpg
description: "도메인 등록이 에이전트 계층으로 이동하는 흐름을 살펴봅니다. 출처가 있는 타임라인, Namefi를 포함한 출시와 발표 현황 점검, 참·거짓으로 판정할 수 있는 2027년 전망을 다룹니다."
keywords: ["에이전틱 도메인 관리 현황", "에이전틱 도메인 관리 2026", "AI 도메인 산업 동향", "도메인 산업 AI 도입", "에이전트 계층 타임라인", "도메인 등록대행자 전망 2027", "MCP 도메인 등록 도입", ".ai 도메인 등록 2026", "Cloudflare Registrar API 베타", "Name.com AI 네이티브 API", "도메인 에이전트 리셀러 논지", "Verisign 도메인 이름 산업 보고서", "DNS 기반 AI 에이전트 신원"]
relatedArticles:
  - /ko/blog/agents-buy-domains/
  - /ko/blog/cf-namecom-namefi/
  - /ko/blog/ai-domain-platforms/
  - /ko/blog/agent-native/
  - /ko/blog/ai-agent-register/
relatedTopics:
  - /ko/topics/domain-basics/
  - /ko/topics/web3-foundations/
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

2026년 중반에 접어든 지금, "AI 에이전트가 도메인 등록 방식을 바꿀 것"이라는 이야기를 전망이 아닌 실제 사건과 대조해 볼 수 있습니다. 일부는 구체적이고 검증 가능한 날짜에 실제로 일어났습니다. 일부는 여전히 베타 라벨이나 포지셔닝 게시물, 표준 기구의 검토 대기열에 놓인 초안입니다. 이 글은 두 범주를 구분합니다. 도메인 등록이 [에이전트 계층](/ko/blog/agents-buy-domains/)으로 이동한 과정을 출처와 함께 정리한 타임라인, 실제 출시된 것과 발표에 그친 것을 Namefi의 부족한 점까지 포함해 솔직하게 점검한 결과, 업계 보도에서 회자되는 "리셀러로서의 에이전트" 논지, 그리고 독자가 별도의 해석 없이 참 또는 거짓으로 판정할 수 있게 작성한 2027년 전망을 다룹니다.

## 도입 수치와 실제 출처

올해 "AI와 도메인" 관련 보도에서 계속 인용되는 수치가 두 개 있으며, 신뢰 수준은 서로 다르게 봐야 합니다.

첫 번째는 ["응답자의 91%가 향후 2년 내에 AI 에이전트가 도메인 관리의 적어도 일부를 처리할 것으로 예상한다"](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years)는 Name.com의 자체 주장입니다. 이 회사가 **2025년 7월 10일**에 게시한 블로그 글에서 나온 수치입니다. Name.com은 이를 "최근 고객 설문조사"에서 얻었다고 설명하지만 표본 크기, 조사 방법, 독립적인 검증은 공개하지 않았습니다. 이 수치를 있는 그대로 봐야 합니다. **Name.com의 보고에 따르면**, Name.com이 조사한 자체 고객이 그렇게 답했다는 뜻입니다. 독립적인 업계 통계가 아니라 회사가 보고한 인식 조사 결과입니다.

두 번째 수치는 검증할 수 있으며 독립적으로 교차 확인되었습니다. **2026년 1월 28일**, 앵귈라 정부는 `.ai` [ccTLD](/ko/glossary/cctld/)의 등록 도메인이 100만 개를 넘었다고 발표했고, [Domain Name Wire가 이 이정표를 직접 보도했습니다](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/). 2025년 초 약 598,000개였던 `.ai` 도메인은 약 13개월 뒤 100만 개를 넘었으며, 2020년 약 40,000개에서 이 수준에 이르기까지 5년이 걸렸습니다. CircleID의 도메인 업계 보도도 같은 이정표를 독립적으로 인용하고, Hogan Lovells의 `.ai` 업계 보고서도 이 추세를 뒷받침합니다. 한 회사의 자체 주장에만 의존하지 않고 교차 확인된 수치입니다.

전체 도메인 시장과 비교하면 다음과 같습니다. Verisign의 2026년 1분기 [Domain Name Industry Brief](https://www.dnib.com)는 모든 TLD에 걸쳐 3억 9,250만 건의 도메인 이름이 등록되었으며 전 분기 대비 1.4%, 전년 대비 6.5% 증가했다고 보고했습니다. [CircleID의 발표 보도](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29)도 이 수치를 직접 인용합니다. 약 100만 건인 `.ai` 등록은 3억 9,250만 건 중 작지만 빠르게 성장하는 일부입니다. 분명한 성장세이지만 아직 시장의 구도를 바꿀 만한 비중은 아닙니다. DNIB와 Identity Digital의 공개 자료 모두 브라우저 결제와 에이전트 중 어느 경로에서 등록이 발생했는지 그 비율을 구분하지 않습니다. 이 글은 나머지 부분에서 이 자료 공백을 감안해 분석합니다. 에이전트용 인프라가 출시되었다는 사실과 대략적인 시점은 검증할 수 있지만, 아직 그 인프라를 거치는 등록량은 확인할 수 없습니다.

## 타임라인: 에이전트 계층으로의 이동

아래의 모든 날짜는 출처 없는 수치를 반복하는 2차 집계 사이트가 아니라 1차 발표, 공식 문서 또는 직접 확인한 업계 보도와 대조해 검증했습니다.

| 날짜 | 사건 | 출처 |
| --- | --- | --- |
| 2004-03 | 등록대행자가 레지스트리와 통신할 때 여전히 사용하는 기계 간 언어인 [EPP](/ko/glossary/epp/)(Extensible Provisioning Protocol)가 Proposed Standard 단계에 도달 | [2004년 3월에 발행된 RFC 3730–3734](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004) |
| 2024-09-03 | 추론 시점의 언어 모델을 위해 사이트가 자신을 설명하는 표준 방식을 제시하는 `/llms.txt` 파일 제안이 공개됨 | [Jeremy Howard가 공개한 llmstxt.org](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time) |
| 2024-11-25 | Anthropic이 AI 애플리케이션을 외부 도구 서버에 연결하는 개방형 표준인 [Model Context Protocol](https://modelcontextprotocol.io)을 공개 | [Anthropic의 MCP 발표](https://www.anthropic.com/news/model-context-protocol) |
| 2025-07-10 | Name.com이 MCP와 OpenAPI를 기반으로 한 "최초의 AI 네이티브 도메인 플랫폼" 포지셔닝 글을 게시하고 위의 자체 보고 91% 수치를 포함 | [Name.com 블로그](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI) |
| 2026-01-28 | 앵귈라 정부 발표에 따르면 `.ai` 등록 도메인이 100만 개를 돌파 | [Domain Name Wire](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/) |
| 2026-04-15 | Cloudflare가 "Agents Week" 기간에 Registrar API를 공개 베타로 전환하고 등록, 검색, 가격 확인 기능을 MCP 계층에 연결 | [Cloudflare의 Registrar API 베타 발표](https://blog.cloudflare.com/registrar-api-beta/), [업계 보도](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer) |
| 2026-04-20 | CircleID가 "도메인 리셀러로서의 에이전트" 분석을 게시 | [CircleID, Simone Catania](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) |
| 2026-04-24 | Verisign의 2026년 1분기 Domain Name Industry Brief가 전체 도메인 등록 3억 9,250만 건을 보고해 위 수치를 시장 전체의 맥락에 배치 | [DNIB.com](https://www.dnib.com), [CircleID 보도](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29) |
| 2026-04-27 | `.ai` 레지스트리와 [Name.com](https://www.name.com)의 모회사 Identity Digital이 "AI 에이전트를 위한 중립적 DNS 기반 신원 표준"을 발표하고, 에이전트에 책임을 지는 소유자를 DNS 레코드에 기록하는 방안을 제안 | [Identity Digital 뉴스룸](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-identity-standard-for-ai-agents.html) |
| 2026-06-04 | Identity Digital의 Innovation Labs가 해당 제안을 "AI 에이전트를 위한 DNS 기반 영속 신원(DNSid)"이라는 IETF Internet-Draft로 공식화 | [GlobeNewswire](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems), [IETF datatracker 초안](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

순서대로 읽으면 다음과 같은 흐름이 보입니다. 20년 된 프로비저닝 프로토콜, 도메인만을 위해 만들어진 것은 아닌 두 가지 범용 AI 에이전트 표준(llms.txt, MCP), 등록대행자들이 이러한 표준을 결제 흐름에 하나씩 덧붙이는 과정, 그리고 같은 레지스트리 계열사(Identity Digital)가 자체 등록대행자의 범위를 넘어 DNS를 에이전트의 *구매*뿐 아니라 *신원*을 위한 인프라로 제안하는 단계입니다. 마지막 단계는 가장 최근이며 가장 확정되지 않았습니다. Internet-Draft는 논의를 위해 제출된 제안이지 승인된 표준이 아닙니다.

## 실제 출시와 발표의 구분

마케팅 문구에서는 "에이전트 네이티브"라는 말을 느슨하게 사용합니다. 아래 표는 각 플랫폼의 실제 문서와 대조해 무엇이 실제로 출시되었는지, 무엇이 여전히 베타 라벨이나 포지셔닝 주장 또는 실행 코드가 없는 표준화 제안인지 구분합니다.

| 플랫폼 | 기능 | 상태 | 근거 |
| --- | --- | --- | --- |
| Namefi | MCP 서버(`api.namefi.io/mcp`, Streamable HTTP, `/.well-known/mcp/servers.json`에서 검색 가능) | **출시됨** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | [x402](/ko/glossary/x402/)를 통한 지갑 서명 USDC 결제(EIP-3009 `transferWithAuthorization`, 계정 불필요) | **출시됨** | [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) |
| Namefi | 에이전트 도구와 REST 참고 자료를 찾을 수 있게 하는 `llms.txt` 기반 탐색 지원 | **출시됨** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | API 계층의 지출 한도 또는 구매 확인 기능 | **미출시** — 이 글 작성 시점에 문서화된 차단 장치가 없으며, 현재 안전장치는 서버가 아니라 MCP 클라이언트에 있음 | 자체 [에이전트 네이티브 체크리스트 분석](/ko/blog/agent-native/)과 이 글을 위해 `namefi.io/llms.txt`, `namefi.io/web3/llms.txt`를 직접 교차 확인한 결과 |
| Cloudflare | Registrar API: 검색, 가용성, 가격 확인, 동기식 등록 | 2026-04-15 이후 **출시됨, 공개 베타** | [Cloudflare Registrar API 베타 발표](https://blog.cloudflare.com/registrar-api-beta/) |
| Cloudflare | 동일 API를 통한 DNS 레코드 관리, 이전, 갱신, 연락처 업데이트 | **발표됨, 개발 중** — Cloudflare 자체 게시물은 "Registrar 핵심 경험의 더 많은 부분을 포함하도록 API 확장을 적극적으로 진행 중"이라고 밝히며 2026년 후반을 목표로 함 | [Cloudflare Registrar API 베타 발표](https://blog.cloudflare.com/registrar-api-beta/) |
| Name.com | AI 네이티브, MCP와 OpenAPI 포지셔닝, 자연어에서 통합 코드로 이어지는 구상 | **발표됨** — 세부 기능 명세가 아닌 포지셔닝 게시물 | [Name.com 블로그](https://www.name.com/blog/the-first-ai-native-domain-platform) |
| Name.com | 도메인 루트에서 직접 확인한 검색 가능한 `llms.txt` 또는 전용 MCP 서버 | 검토 시점에 **확인되지 않음** | `name.com` 직접 확인, [Cloudflare vs Name.com vs Namefi](/ko/blog/cf-namecom-namefi/)에서 교차 참조 |
| Identity Digital | DNSid: AI 에이전트의 책임 있는 소유자를 DNS에 기반해 암호학적으로 검증하는 레코드 | **제안됨** — 논의를 위해 제출된 IETF Internet-Draft이며 승인된 표준이 아니고 실제 등록대행자 결제 흐름에도 통합되지 않음 | [IETF datatracker: draft-ihsanullah-dnsid](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

이 표에서 두 가지 결론을 얻을 수 있습니다. 첫째, 확인한 플랫폼 중 Namefi를 포함해 문서화되고 API가 강제하는 지출 한도를 출시한 곳은 없습니다. 모든 안전장치는 한 계층 위, 즉 사람이 클라이언트 측에 설정하는 정책에 있습니다. 이는 [에이전트 네이티브 체크리스트](/ko/blog/agent-native/)에서 이 범주를 평가해 얻은 결론과 같습니다. 둘째, 구매하는 도메인뿐 아니라 에이전트 자체의 신원을 위한 기준점으로 DNS를 사용하는 구상은 아직 "IETF 논의를 위해 제출"된 단계입니다. 호평을 받더라도 등록대행자가 실제 결제 흐름에 연결하려면 수개월은 걸릴 것입니다.

## 리셀러 논지

2026년 도메인 업계 보도에서 반복되는 표현은 AI 에이전트가 *리셀러*가 되고 있다는 것입니다. CircleID의 2026년 4월 20일 분석은 이를 직접 표현합니다. ["AI 에이전트는 사람의 개입 없이 가용성을 확인하고, 이름을 등록하고, DNS를 설정하면서 점점 도메인 리셀러 역할을 하고 있다."](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)

이 단어가 암시하는 의미와 실제 용법을 구분해야 합니다. 도메인 업계의 자체 용어에서 [리셀러](/ko/glossary/reseller/)는 구체적이고 공식적인 지위입니다. 등록대행자의 [ICANN](/ko/glossary/icann/) 인증 계약 아래에서 도메인을 판매하거나 프로비저닝하며, 등록대행자와 그 관계를 통해 ICANN에 계약상 의무를 지는 주체입니다. 오늘날 에이전트가 등록 API를 호출한다는 사실만으로 이런 관계가 생기지는 않습니다. 에이전트는 그 자체로 공인된 당사자가 아니라 최종 고객의 대리인으로 행동하며, 해당 고객의 API 키나 지갑을 사용해 인증됩니다. CircleID의 표현은 인증 지위에 대한 주장이 아니라 행동을 묘사한 것입니다. 다른 사람을 대신해 대량으로 검색, 가격 확인, 등록, DNS 설정을 반복하는 리셀러의 *행동 패턴*이 에이전트 워크플로에 나타나지만, 그 운영 주체가 리셀러 계약에 서명한 회사인 것은 아닙니다.

이러한 행동이 레지스트리가 공식적으로 인정하는 형태로 자리 잡을지는 아직 열린 질문입니다. 이를 위해서는 레지스트리와 등록대행자가 정책의 제한을 받는 대규모 에이전트 활동에 사람 리셀러와 구분되는 별도의 공인 등급, 속도 제한 정책 또는 악용 감시 범주가 필요한지 결정해야 합니다. 위 타임라인의 Cloudflare 베타, Name.com 게시물, Identity Digital DNSid 초안 중 어느 것도 아직 그런 공인 등급을 제안하지 않습니다. 에이전트의 행동에 누가 책임을 지는지를 명시적으로 검증하기 때문에 DNSid가 가장 가까운 구상입니다. 하지만 "누가 책임지는가"와 "공식적으로 리셀러 인증을 받았는가"는 서로 다른 질문이며, 이 초안은 첫 번째에만 답합니다. 개별 구매가 이루어지는 방식은 [AI 에이전트가 사람 없이 도메인을 구매하는 방법](/ko/blog/agents-buy-domains/)을 참고하세요.

## 2027년 전망

다음 항목은 모두 공개 증거를 바탕으로 확인할 수 있게 작성했습니다. 분위기를 표현한 것이 아니라 구체적인 주장이므로, 2027년 중반에 다시 찾아온 독자가 별도의 해석 없이 참, 거짓 또는 미결로 표시할 수 있습니다.

1. **Cloudflare, Name.com 또는 이에 준하는 주류 등록대행자 중 최소 한 곳이 2027년 7월까지 문서화되고 API가 강제하는 지출 한도 또는 구매 확인 기능을 공개할 것입니다.** 클라이언트 측 안내만 제공하는 경우는 포함하지 않습니다. 이 글 작성 시점에 확인한 모든 플랫폼에서 이 항목은 비어 있으며 Namefi도 마찬가지입니다.
2. **Cloudflare의 Registrar API는 2027년 말까지 "베타" 라벨을 떼고 DNS 레코드 관리, 갱신 자동화, 이전 지원 중 최소 하나를 출시할 것입니다.** 자체 베타 발표의 "2026년 후반"이라는 표현에 1년의 여유를 더한 전망입니다.
3. **DNSid Internet-Draft 또는 "이 에이전트에 누가 책임지는가"를 직접 다루는 후속 초안은 2027년 7월에도 승인된 RFC가 아니라 IETF 초안 상태일 것입니다.** 표준화 문서는 일반적으로 제출 후 수년이 걸리며, 이 문서는 2026년 6월에 제출되었습니다.
4. **`.ai` 등록은 2027년 7월까지 150만 건을 넘어설 것입니다.** 2026년 1월에 돌파한 100만 건 수준에서 정체하지 않고 Domain Name Wire와 Identity Digital이 기록한 성장 곡선을 이어 간다는 전망입니다.
5. **여기서 비교한 플랫폼 중 최소 한 곳이 에이전트 기반 등록 활동에 대해 자체 마케팅이나 문서에서 공개적으로 "리셀러" 또는 "에이전트 리셀러"라는 표현을 사용할 것입니다.** CircleID가 2026년 4월에 사용한 표현을 업계 보도에만 남겨 두지 않고 공식화한다는 의미입니다.

## 자주 묻는 질문

### 현재 AI 에이전트가 실제로 등록하는 도메인은 몇 개인가요?

검토한 어떤 레지스트리나 등록대행자도 DNIB, Identity Digital, Cloudflare, Name.com을 포함해 에이전트가 시작한 등록을 사람이 시작한 등록과 구분한 수치를 공개하지 않습니다. 검증할 수 있는 것은 인프라입니다. 어떤 플랫폼이 에이전트가 호출할 수 있는 등록 경로를 언제 출시했는지 확인할 수 있습니다. Namefi, 공개 베타인 Cloudflare, 포지셔닝을 통해 제시한 Name.com이 여기에 해당합니다. 이 글 작성 시점에 에이전트에 귀속할 수 있는 도입 규모는 공개 데이터가 아닙니다.

### Name.com의 91% 통계는 신뢰할 수 있는 업계 수치인가요?

독립적인 설문조사가 아니라 회사가 보고한 인식 조사로 봐야 합니다. Name.com의 2025년 7월 게시물은 이 수치가 "최근 고객 설문조사"에서 나왔다고 설명하지만 조사 방법, 표본 크기, 외부 감사 기관을 공개하지 않았습니다. 시장 전체를 대표하는 인용 가능한 통계가 아니라 Name.com 고객이 회사에 전한 인식을 보여 주는 신호입니다.

### `.ai` 등록이 실제로 100만 건에 도달했으며, 누가 확인했나요?

네, 독립적으로 교차 확인되었습니다. `.ai` [ccTLD](/ko/glossary/cctld/)를 관리하는 앵귈라 정부가 이 이정표를 직접 발표했고, Domain Name Wire가 구체적인 날짜인 2026년 1월 28일과 함께 성장 수치를 보도했습니다. CircleID와 Hogan Lovells의 업계 보고서도 같은 이정표를 각각 인용합니다. 한 회사의 자체 보고 통계와는 다른 수준의 증거입니다.

### DNSid란 무엇이며, 도메인 등록 방식을 바꾸나요?

DNSid는 승인된 표준이 아니라 정식 제안인 Internet-Draft입니다. Identity Digital의 Innovation Labs가 2026년 6월 IETF에 제출했습니다. DNS 레코드를 "이 AI 에이전트에 누가 책임지는가"를 영속적이고 검증 가능하게 기록하는 수단으로 제안합니다. 이는 등록 자체와는 다른 문제로, 도메인을 구매하는 것이 아니라 에이전트의 신원을 확인하는 일입니다. 이 글 작성 시점에 실제 등록대행자의 결제 흐름에는 통합되지 않았습니다.

### 지출 한도나 "에이전트의 과소비 방지" 기능을 실제로 출시한 등록대행자가 있나요?

각 플랫폼의 문서를 직접 확인한 범위에서는 API 계층에 없습니다. Namefi, Cloudflare, Name.com 모두 등록대행자가 직접 강제하는 확인 관문 대신 사람이 클라이언트 측에 설정한 정책, 즉 MCP 클라이언트, 에이전트 프레임워크, API 키의 자금 한도에 안전장치를 맡깁니다. 자체 평가표를 포함해 이 영역의 모든 "에이전트 네이티브" 평가표가 아직 미완료로 표시하는 유일한 항목입니다.

### 업계 전체의 상황이 아니라 개별 에이전트 구매 방식은 어디에서 볼 수 있나요?

[AI 에이전트가 사람 없이 도메인을 구매하는 방법](/ko/blog/agents-buy-domains/)은 검색, 가격 확인, 인증, 등록, 설정 순서를 단계별로 설명합니다. [Cloudflare vs Name.com vs Namefi](/ko/blog/cf-namecom-namefi/)는 세 플랫폼의 기능을 항목별로 비교하며, [에이전트 네이티브 도메인 등록대행자란?](/ko/blog/agent-native/)은 이 글의 출시와 발표 현황 표에 사용한 체크리스트를 제시합니다.

## 전체 스택을 이미 제공하는 에이전트를 통해 도메인을 등록하세요

이 글에서 다룬 부족한 점인 문서화되지 않은 지출 한도, 베타 라벨, 세부 명세가 없는 포지셔닝 게시물은 한 플랫폼만의 문제가 아닙니다. 2026년 중반 현재 이 범주가 놓인 상황입니다. [Namefi](https://namefi.io)는 현재 제공할 수 있는 기능을 실제로 제공합니다. 에이전트가 직접 연결하는 MCP 서버, `llms.txt`를 통해 발견할 수 있는 REST API, 계정 없이 USDC로 결제하는 지갑 서명 [x402](/ko/glossary/x402/) 결제, 그리고 도메인을 에이전트 지갑에 보관하고 싶을 때 이용하는 [토큰화 도메인](/ko/glossary/tokenized-domain/) 소유권입니다.

**[Namefi에서 도메인을 검색하고 등록하세요](https://namefi.io).**

## 출처 및 추가 자료

- Domain Name Wire — [.AI 네임스페이스의 도메인 이름 100만 개 돌파(2026년 1월 28일)](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/)
- CircleID — [2026년 도메인 세계: AI, 보안, 시장 성숙도, 새로운 gTLD 개척지(2026년 4월 20일)](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- CircleID — [DNIB, 2026년 1분기 도메인 이름 등록 3억 9,250만 건 보고](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29)
- Verisign / DNIB.com — [도메인 이름 산업 보고서](https://www.dnib.com)
- Cloudflare — [Registrar API 베타 발표(2026년 4월 15일)](https://blog.cloudflare.com/registrar-api-beta/)
- webhosting.today — [AI 에이전트가 사람 없이 도메인을 등록할 수 있게 되다](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer)
- Name.com — [최초의 AI 네이티브 도메인 플랫폼(2025년 7월 10일)](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years)
- Identity Digital — [Identity Digital, AI 에이전트를 위한 중립적 DNS 기반 신원 표준 공개(2026년 4월 27일)](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-identity-standard-for-ai-agents.html)
- Identity Digital / GlobeNewswire — [Identity Digital Innovation Labs, AI 에이전트를 위한 DNS 기반 영속 신원 제안을 IETF에 제출(2026년 6월 4일)](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems)
- IETF Datatracker — [draft-ihsanullah-dnsid: AI 에이전트를 위한 DNS 기반 영속 신원](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/)
- llmstxt.org — [/llms.txt 파일 제안(2024년 9월 3일 공개)](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- Anthropic — [Model Context Protocol 소개(2024년 11월 25일)](https://www.anthropic.com/news/model-context-protocol)
- Wikipedia — [Extensible Provisioning Protocol(Proposed Standard, 2004년 3월)](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- Namefi — [namefi.io/llms.txt(MCP 서버 및 REST API 참고 자료)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt(x402 지갑 서명 결제 참고 자료)](https://namefi.io/web3/llms.txt)
