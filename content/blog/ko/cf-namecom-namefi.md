---
title: "Cloudflare vs Name.com vs Namefi: AI 에이전트 네이티브 등록대행자 비교"
date: '2026-07-10'
language: 'ko'
tags: ['ai-agents', 'comparison']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
format: comparison
ogImage: ../../assets/cf-namecom-namefi-og.jpg
description: "에이전트 네이티브 등록대행자 세 곳을 가격, MCP 지원, 암호화폐 결제, 토큰화 소유권을 기준으로 기능별 비교하고 각각 어떤 상황에 적합한지 알아봅니다."
keywords: ["cloudflare 등록대행자 api", "name.com ai api", "namefi mcp", "에이전트 네이티브 등록대행자", "ai 등록대행자 비교", "암호화폐 도메인 결제", "토큰화 도메인", "mcp 도메인 등록", "ai 에이전트 도메인 구매", "cloudflare vs namefi", "name.com vs namefi", "원가 도메인 가격", "지갑 도메인 결제"]
relatedArticles:
  - /ko/blog/ai-domain-platforms/
  - /ko/blog/agent-native/
  - /ko/blog/airo-vs-namefi/
  - /ko/blog/claude-mcp-domains/
  - /ko/blog/ai-agent-register/
relatedTopics:
  - /ko/topics/domain-tokenization/
  - /ko/topics/choosing-a-tld/
relatedSeries:
  - /ko/series/tokenize-your-com/
  - /ko/series/best-tlds-by-industry/
relatedGlossary:
  - /ko/glossary/ai-agent/
  - /ko/glossary/registrar/
  - /ko/glossary/tokenized-domain/
  - /ko/glossary/dnssec/
  - /ko/glossary/wallet/
---

이제 세 [등록대행자](/ko/glossary/registrar/)에서는 사람이 아니어도 결제 양식을 작성할 수 있습니다. Cloudflare는 2026년 4월, 브라우저 세션 없이 [AI 에이전트](/ko/glossary/ai-agent/)가 도메인을 등록할 수 있는 베타 API를 공개했습니다. Name.com은 같은 구상에 맞춰 API를 전면 개편하고 스스로를 최초의 AI 네이티브 도메인 플랫폼이라고 부릅니다. Namefi는 Model Context Protocol(MCP) 서버와 지갑 서명 방식의 결제를 구축해 계정 생성 단계를 완전히 없앴습니다. 세 업체 모두 사람이 브라우저에서 하던 도메인 등록이 에이전트의 API 호출로 옮겨 가는 동일한 변화에 주목하고 있습니다.

그렇다고 로고만 다른 동일한 제품은 아닙니다. 가격 정책, "에이전트 네이티브"에 실제로 필요한 것, 구매자가 결제 능력을 증명하는 방식에 대해 각각 다른 선택을 했습니다. 이 글에서는 세 업체의 기능을 하나씩 비교합니다. Cloudflare의 가격 경쟁력이 실제로 따라잡기 어려운 부분과, Name.com의 포지셔닝이 아직 출시한 기능보다 앞서 있는 부분도 함께 살펴봅니다.

## "에이전트 네이티브"에 실제로 필요한 것

API가 있다고 해서 에이전트가 사용할 수 있는 것은 아닙니다. 대부분의 등록대행자는 수년 전부터 프로그래밍 방식의 등록 기능을 제공해 왔습니다. 하지만 이 인터페이스들은 문서를 읽는 리셀러와 개발자를 위해 만들어졌지, 가능한 기능을 스스로 찾고 사람이 비밀번호를 입력하지 않아도 인증하며 사람이 읽어 주지 않아도 오류 메시지를 해석해야 하는 자율 프로세스를 위해 만들어진 것은 아닙니다. 단순히 "API가 있는" 등록대행자와 에이전트 네이티브 등록대행자를 구분하는 전체 체크리스트는 [에이전트 네이티브 도메인 등록대행자란?](/ko/blog/agent-native/)에서 확인할 수 있습니다. 간단히 요약하면 검색 가능성(에이전트가 API를 스스로 찾을 수 있는가), 기계 판독 가능한 응답, 사람이 신용카드를 들고 있다고 가정하지 않는 결제 경로가 핵심입니다. 아래의 세 등록대행자는 정도의 차이는 있지만 모두 이 기준을 충족합니다.

## Cloudflare Registrar API: 원가 제공, 베타 단계, 이미 에디터 안에

Cloudflare의 Registrar API는 회사의 "Agents Week" 발표 기간인 2026년 4월 15일에 베타로 공개됐습니다. 출시 관련 업계 보도에 따르면 이 API를 사용하면 [AI 에이전트가 브라우저 조작이나 수동 승인 없이 도메인 사용 가능 여부를 검색하고 가격을 확인한 뒤 프로그래밍 방식으로 등록을 완료할 수 있습니다](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=lets%20an%20AI%20agent%20search%20for%20domain%20availability%2C%20check%20pricing%2C%20and%20complete%20registration%20programmatically%20without%20any%20browser%20interaction%20or%20manual%20approval). 일반 도메인은 몇 초 안에 동기 방식으로 등록이 완료됩니다. 또한 API는 [Cursor와 Claude Code처럼 MCP를 지원하는 코드 에디터](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code) 안에서 사용하도록 설계됐습니다. 개발자는 프로젝트를 개발하는 도구를 벗어나지 않고 해당 프로젝트의 도메인을 등록할 수 있습니다.

Cloudflare가 내세우는 가장 강력한 장점은 가격입니다. 신뢰할 만한 비교를 위해서는 이 부분에서 Cloudflare가 확실히 앞선다는 점을 인정해야 합니다. Cloudflare는 [.ai 도메인의 등록과 갱신을 추가 마진 없이 도매가격으로 제공합니다](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups). 등록된 모든 도메인에는 [무료 DNSSEC, 무료 SSL, 이중 인증, 기본 활성화된 도메인 잠금](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=free%20DNSSEC%2C%20free%20SSL%2C%20two-factor%20authentication%2C%20and%20a%20domain%20lock%20enabled%20by%20default)이 제공되고, [무료 WHOIS 정보 비공개 처리](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=every%20.ai%20domain%20comes%20with%20free%20WHOIS%20redaction)도 포함됩니다. 다른 등록대행자가 부가 서비스로 판매하는 [WHOIS 개인정보 보호](/ko/glossary/whois-privacy/)에 추가 비용이 없습니다. 별도의 등록대행자 비교 자료도 이 가격 정책을 독립적으로 확인합니다. Cloudflare의 [원가 가격 정책은 등록과 갱신 시 마진 없이 Cloudflare가 지불하는 금액만 고객에게 청구합니다](https://www.hostinger.com/tutorials/best-domain-registrars/#:~:text=At-cost%20pricing%20charges%20you%20only%20what%20Cloudflare%20pays%2C%20with%20no%20markup%20at%20registration%20or%20renewal). 가격이 결정적인 기준이고 "등록한 뒤 안전하게 잠그는 것" 이상의 기능이 필요하지 않다면 Cloudflare를 이기기 어렵습니다.

제약은 기능 범위입니다. 현재 베타는 검색, 가격 확인, 등록을 지원합니다. [Cloudflare는 수명 주기 관리 기능을 개발 중이며 2026년 후반에 출시할 계획이라고 밝혔습니다](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=Cloudflare%20has%20stated%20that%20lifecycle%20management%20is%20in%20development%20and%20is%20planned%20for%20release%20later%20in%202026). 즉, 이전, 갱신, 연락처 변경은 아직 에이전트용 API에 포함되지 않습니다. 암호화폐 결제 옵션과 토큰화 소유권도 없습니다. Cloudflare를 통해 등록한 도메인은 기존 등록대행자 계정에 귀속되는 자산이며, 지갑이 직접 보유할 수 있는 자산은 아닙니다.

## Name.com의 AI 네이티브 API: 자연어에서 실제 작동하는 코드까지

Name.com이 내세우는 가치는 Cloudflare와 다릅니다. 가격을 앞세우기보다 [에이전틱 AI 시대에 맞춰 도메인을 현대화한 AI 네이티브 플랫폼, 새로운 name.com API의 출시](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI)에 맞춰 개발자 API를 전면 개편했습니다. 이 API는 [AI 에이전트가 도메인 관련 작업과 직접 상호작용할 수 있게 하는 Model Context Protocol(MCP) 및 OpenAPI 사양](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=supported%20by%20modern%20standards%20like%20Model%20Context%20Protocol%20%28MCP%29%20and%20OpenAPI%20specification%2C%20which%20enable%20AI%20agents%20to%20interact%20directly%20with%20domain)을 기반으로 합니다. Name.com 역시 에디터 내부 워크플로를 명확히 홍보합니다. MCP 지원 덕분에 개발자가 [Claude와 Cursor 같은 AI 도구에 간단한 프롬프트를 입력해 도메인 관련 작업을 처리할 수 있다](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=Leverage%20AI%20tools%20like%20Claude%20and%20Cursor%20to%20handle%20domain%20operations%20through%20simple%20prompts%2C%20thanks%20to%20MCP%20support)고 설명합니다.

Name.com의 발표에서 가장 분명한 차별점은 자연어를 코드로 바꾸는 방식입니다. 에이전트가 고정된 엔드포인트 집합을 호출하는 데 그치지 않고, 에이전트에게 "내 앱에 도메인 등록 기능을 추가해 줘"라고 말하면 에이전트가 API 문서를 활용해 통합 코드를 직접 작성한다는 구상입니다. Name.com은 "세상이 이 방향으로 움직이고 있다"는 주장을 자체 고객 조사로 뒷받침합니다. [응답자의 91%가 향후 두 해 안에 AI 에이전트가 도메인 관리 업무의 적어도 일부를 처리할 것으로 예상했다](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years)고 보고했습니다. 이 수치는 외부 기관이 아니라 Name.com의 자체 발표에서 나온 것이므로, 독립적인 설문 결과가 아닌 회사가 보고한 시장 인식으로 받아들여야 합니다.

두 가지는 솔직히 짚고 넘어갈 필요가 있습니다. 첫째, Name.com의 블로그 글은 포지셔닝과 비전을 다룬 글입니다. Cloudflare나 Namefi 문서처럼 항목별 기능표를 공개하지 않았으므로, 아래 비교표의 일부 항목은 검증된 사양이 아니라 발표에서 주장한 내용에 근거합니다. 둘째, 가격과 관련해 Name.com의 게시물은 리셀러 측의 유연성, 즉 [자체 마진을 설정할 수 있는 기능](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20ability%20to%20set%20your%20own%20markups)을 설명합니다. 이는 리셀러 파트너를 위한 기능이지, Cloudflare처럼 최종 사용자에게 원가로 제공한다는 약속이 아닙니다. 이 발표에는 암호화폐 결제 경로나 토큰화 소유권도 나오지 않습니다.

## Namefi: MCP 서버, 지갑 결제, 토큰화 소유권

Namefi의 접근 방식은 구매자가 브라우저 세션이나 신용카드를 보유한 사람이 아닐 수 있고, 작업 전에 Namefi 계정을 만들고 싶어 하지 않을 수도 있다는 전제에서 출발합니다. 제품 관련 주장의 유일한 기준인 Namefi의 기계 판독 가능 API 문서에 따르면, Namefi는 Streamable HTTP 전송 방식으로 `https://api.namefi.io/mcp`에서 MCP 서버를 운영합니다. 이 서버는 "모든 `/v-next` 작업을 형식이 지정된 도구(search, registration, DNS, domain config, outbound)로 제공"하며, `https://namefi.io/.well-known/mcp/servers.json`에서 검색할 수 있습니다. Claude Code용 한 줄 설정 명령어(`claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"`)도 문서로 제공합니다. REST API 인증에는 도메인을 소유한 지갑에 연결된 `x-api-key` 헤더를 사용하며, 읽기 전용 도구에는 키가 필요하지 않습니다.

가장 두드러지는 차별점은 결제입니다. Namefi는 에이전트가 Namefi 계정을 먼저 만들지 않고도 스테이블코인 USDC로 도메인을 구매할 수 있는 [x402](https://x402.org) 결제 흐름을 문서로 제공합니다. 구매자의 지갑은 EIP-3009 `transferWithAuthorization`에 서명합니다. 결제 정보가 첨부되지 않으면 API가 가격과 함께 `402 Payment Required` 응답을 반환하고, 유효한 결제 헤더가 도착하면 등록을 완료합니다. 별도의 Machine Payable Protocol(MPP) 흐름도 이와 유사한 챌린지-서명 방식을 제공합니다. Cloudflare나 Name.com은 이에 견줄 만한 기능을 문서로 제공하지 않습니다. 이 비교에서 가장 뚜렷한 차별점입니다. 전체 결제 흐름은 [암호화폐 지갑으로 도메인 결제하기: 계정 불필요](/ko/blog/wallet-checkout/)에서 확인할 수 있습니다.

Namefi는 도메인을 [NFT (대체 불가능 토큰)](/ko/glossary/nft/), 즉 등록대행자의 내부 데이터베이스만이 아니라 온체인에서 소유권을 검증하는 [토큰화 도메인](/ko/glossary/tokenized-domain/)으로 등록합니다. DNS 설정에는 전체 DNS 레코드 관리(단일 및 일괄), 자동 갱신, 도메인 파킹, 포워딩과 함께 자동 [ENS (이더리움 네임 서비스)](/ko/glossary/ens/) 레코드와 [DNSSEC (도메인 네임 시스템 보안 확장)](/ko/glossary/dnssec/) 기능이 포함됩니다. Namefi의 llms.txt에 명시되지 않은 것은 가격 정책입니다. Cloudflare와 비교할 수 있는 "원가" 정책도 없고, 이 글을 위해 검토한 문서에는 공개 가격표도 보이지 않습니다. 따라서 Cloudflare와 가격이 비슷하다고 가정하지 말고 namefi.io에서 현재 가격을 직접 확인하세요. <!-- TODO: 팀 확인 필요 — 레지스트리 원가 대비 Namefi의 공개 가격/마진 정책 -->

## 기능 비교표

| 기능 | Cloudflare Registrar API | Name.com AI 네이티브 API | Namefi |
|---|---|---|---|
| 도메인 사용 가능 여부 검색 | 지원 | 지원 | 지원(`search/availability`, 일괄 검색) |
| 가격 조회 | 지원 | 지원(문서화됐으나 항목별 정보 없음) | 지원(x402 402 응답 및 API를 통해 반환) |
| 구매/등록 | 지원, 몇 초 안에 동기 처리 | 지원(에이전트가 생성한 통합 코드) | 지원 — API 키 또는 x402/MPP를 통한 지갑 서명 USDC 결제 |
| DNS 관리 | 현재 베타에서 미지원 | 발표에 세부 항목 없음 | 지원 — 전체 CRUD, 일괄 작업, A/CNAME/TXT/MX 등 |
| 갱신 자동화 | 현재 베타에서 미지원(2026년 후반 예정) | 발표에 세부 항목 없음 | 지원 — 도메인별 자동 갱신 설정 |
| 암호화폐 결제 | 미지원 | 미지원 | 지원 — 계정 없이 x402로 USDC 결제 |
| 토큰화 소유권 | 미지원 | 미지원 | 지원 — 도메인을 NFT로 등록하고 온체인에서 검증 |
| 계정 필요 여부 | 필요(Cloudflare 계정) | 필요(개발자/API 접근 권한) | x402 지갑 결제에는 불필요. API 키 방식은 지갑에 연결 |
| MCP 지원 | 지원(외부 보도 기준, 에디터 내부) | 지원(문서화됨) | 지원 — 전용 MCP 서버와 검색 디스크립터 |
| 에디터 연동 | Cursor, Claude Code(보도 기준) | Claude, Cursor(발표 기준) | Claude Code(설정 명령어 문서화), 개방형 MCP 프로토콜 |
| 원가/무마진 가격 | 지원한다고 명시 | 명시 없음(리셀러 마진 언급) | 공개 안 됨 — 실시간 가격 확인 필요 |

## 각 서비스가 가장 적합한 상황

가격과 단순성이 결정적인 기준이고 도메인을 등록해 안전하게 잠그는 것 이상의 기능이 필요하지 않다면 **Cloudflare**를 선택하세요. 원가 가격 정책과 기본 보안 기능(DNSSEC, WHOIS 정보 비공개 처리, 이중 인증)은 대다수 기존 업체가 같은 보호 기능에 청구하는 조건보다 확실히 낫습니다. 이미 Cursor나 Claude Code에서 Cloudflare 스택을 기반으로 개발하고 있다면 워크플로도 매끄럽습니다. 분명한 절충점은 기능 범위입니다. 베타가 등록만 지원하기 때문에 아직 DNS 관리, 갱신 자동화, 암호화폐 또는 토큰화 옵션이 없습니다.

에이전트가 고정된 API를 호출하기보다 통합 코드를 직접 작성하기를 원하거나, 이미 Name.com 리셀러로서 현대화된 MCP 호환 플랫폼에서 마진 설정의 유연성을 원한다면 **Name.com**을 선택하세요. 정확히 어떤 기능이 출시됐고 무엇이 로드맵에 있는지에 관한 문서가 Cloudflare나 Namefi보다 부족하므로, 실제 API 기능을 마케팅 내용과 대조해 테스트할 시간을 확보해야 합니다.

구매 주체가 진정으로 에이전트 중심이라면 **Namefi**를 선택하세요. 사람의 계정 없이 저장된 카드 대신 지갑 서명으로 결제를 승인하고, 등록대행자 데이터베이스의 행으로만 존재하는 것이 아니라 온체인에서 이전 가능한 토큰으로 소유권을 나타낼 수 있습니다. MCP 서버, 완전한 DNS 제어, 자동 ENS, 지갑 네이티브 결제의 조합은 현재 Cloudflare 베타나 Name.com 발표에서는 찾을 수 없습니다. 절충점은 Namefi가 Cloudflare와 같은 원가 가격 약속을 공개하지 않았다는 것입니다. 도매가격이 가장 중요하다면 Namefi가 Cloudflare보다 저렴할 것이라고 가정하기 전에 현재 가격을 직접 확인하세요.

많은 팀은 결국 둘 이상을 함께 사용하게 될 것입니다. 이미 운영 중인 인프라 앞에 놓이는 도메인에는 Cloudflare나 Name.com을 사용하고, 마켓플레이스에서 거래할 이름이나 사람의 계정 대신 에이전트 자체 지갑이 소유할 이름처럼 온체인에서 소유하고 거래해야 하는 대상에는 Namefi 같은 지갑 네이티브 등록대행자를 사용할 수 있습니다. 사람이 아니라 에이전트가 [등록자](/ko/glossary/registrant/)가 될 때 "소유권"이 정확히 무엇을 의미하는지는 별도의 글이 필요할 만큼 깊은 주제입니다. 자세한 내용은 [AI 에이전트가 도메인을 소유할 수 있을까? WHOIS, 수탁 및 토큰](/ko/blog/agent-own-domain/)에서 확인하세요.

## 자주 묻는 질문

### AI 에이전트가 사용하기에 가장 저렴한 등록대행자는 어디인가요?
세 업체 중 원가·무마진 가격 정책을 명시적으로 공개한 곳은 Cloudflare뿐이며, 독립적인 등록대행자 비교 자료도 동일한 정책을 확인합니다. Name.com의 발표는 최종 사용자에 대한 원가 제공 약속이 아니라 리셀러의 마진 설정 유연성을 다룹니다. Namefi는 API 문서에 가격 정책을 공개하지 않았으므로, 현재로서는 각 플랫폼의 실시간 가격을 확인하지 않고 직접 비교할 수 없습니다.

### 사람이 보유한 신용카드 없이 에이전트가 결제할 수 있는 서비스가 있나요?
문서화된 암호화폐 네이티브 결제 흐름을 제공하는 곳은 세 업체 중 Namefi뿐입니다. 에이전트의 지갑은 Namefi 계정을 생성하지 않고 x402 프로토콜을 통해 USDC로 결제하거나, 별도의 Machine Payable Protocol 챌린지-서명 흐름을 이용할 수 있습니다. Cloudflare의 베타와 Name.com의 API는 이에 상응하는 비계정 결제 경로를 문서로 제공하지 않습니다.

### 도메인 등록뿐 아니라 이 API로 DNS 레코드도 관리할 수 있나요?
Namefi 문서는 일괄 생성/업데이트/삭제와 파킹, 포워딩, 자동 ENS, Vercel 애니캐스트 레코드 설정을 포함한 전체 DNS 레코드 CRUD를 다룹니다. 현재 Cloudflare Registrar API 베타는 등록만 지원하며, 수명 주기와 등록 후 관리(DNS 포함)는 추후 출시될 예정입니다. Name.com의 발표에는 DNS 관리 기능이 항목별로 나와 있지 않습니다.

### Cloudflare Registrar API는 정식 출시됐나요?
아니요. 이 API는 Cloudflare의 "Agents Week" 기간인 2026년 4월 15일에 베타로 공개됐습니다. Cloudflare는 보다 광범위한 수명 주기 관리(이전, 갱신, 연락처 변경)를 아직 개발 중이며 2026년 후반에 출시할 계획이라고 밝혔습니다. 베타 단계의 기능은 변경될 수 있으므로 프로덕션에서 의존하기 전에 다시 확인하세요.

### "에이전트 네이티브"란 무엇이며, 세 업체가 모두 이 기준을 충족하나요?
에이전트 네이티브란 사람이 브라우저 양식을 작성하지 않아도 에이전트가 API를 찾고 인증하며 구매를 완료할 수 있다는 의미입니다. 전체 체크리스트는 [에이전트 네이티브 도메인 등록대행자란?](/ko/blog/agent-native/)에서 확인하세요. 여기서 비교한 세 등록대행자는 모두 기본 기준(검색부터 구매까지 프로그래밍 방식으로 처리, MCP 또는 MCP 연계 도구)을 충족하지만, 등록 이후까지 에이전트 네이티브 설계를 얼마나 확장했는지는 크게 다릅니다. DNS, 갱신, 결제 수단, 소유권 모델에서 차이가 납니다.

## Namefi에서 도메인 구매 및 토큰화하기

지갑 네이티브 결제와 토큰화 소유권이 필요하다면 [Namefi](https://namefi.io)를 이용해 다른 공인 등록대행자와 같은 방식으로 실제 ICANN 도메인을 등록하고, 지갑이 제어하는 NFT로 도메인을 보유할 수 있습니다. 이 세 업체를 넘어 전체 시장을 살펴보려면 [AI 에이전틱 도메인 플랫폼: 2026년 가이드](/ko/blog/ai-domain-platforms/)를 읽거나 [AI 에이전트로 Namefi에서 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)의 실습 설정으로 바로 이동하세요. 에이전트가 스스로 구매를 완료하는 원리는 [사람 없이 AI 에이전트가 도메인을 구매하는 방법(2026)](/ko/blog/agents-buy-domains/)에서 확인할 수 있습니다.

**[Namefi에서 도메인 검색 및 등록하기](https://namefi.io).**

## 출처 및 추가 자료

- webhosting.today — [사람 없이 AI 에이전트가 도메인을 등록할 수 있게 되다(Cloudflare Registrar API 베타, 2026년 4월)](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=lets%20an%20AI%20agent%20search%20for%20domain%20availability%2C%20check%20pricing%2C%20and%20complete%20registration%20programmatically%20without%20any%20browser%20interaction%20or%20manual%20approval)
- Cloudflare — [.ai 도메인 구매: 원가 가격과 포함된 보안 기능](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)
- Name.com — [최초의 AI 네이티브 도메인 플랫폼](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI)
- Hostinger — [Cloudflare의 원가 가격 정책을 포함한 최고의 도메인 등록대행자 비교](https://www.hostinger.com/tutorials/best-domain-registrars/#:~:text=At-cost%20pricing%20charges%20you%20only%20what%20Cloudflare%20pays%2C%20with%20no%20markup%20at%20registration%20or%20renewal)
- llmstxt.org — [llms.txt 사양](https://llmstxt.org/#:~:text=context%20windows%20are%20too%20small%20to%20handle%20most%20websites%20in%20their%20entirety)
- Model Context Protocol — [MCP란?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt(MCP 서버, API 및 인증 참고 자료)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt(지갑 서명 및 x402 암호화폐 결제 참고 자료)](https://namefi.io/web3/llms.txt)
