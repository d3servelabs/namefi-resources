---
title: "AI 에이전트가 도메인을 소유할 수 있나요? WHOIS, 수탁 및 토큰"
date: '2026-07-10'
language: 'ko'
tags: ['ai-agents', 'domains', 'web3']
authors: ['namefiteam']
draft: false
format: faq
ogImage: ../../assets/agent-own-domain-og.jpg
description: "등록자는 법적 주체여야 하지만 수탁은 위임할 수 있습니다. WHOIS, API 키, 토큰화 도메인으로 보는 도메인 수탁의 스펙트럼을 설명합니다."
keywords: ["AI 에이전트가 도메인을 소유할 수 있나요", "AI 에이전트 도메인 소유권", "AI가 도메인을 등록할 때 등록자는 누구인가", "AI 에이전트 WHOIS", "도메인 등록자 법적 주체", "토큰화 도메인 수탁", "AI 에이전트 지갑 NFT 도메인", "도메인 수탁 스펙트럼", "에이전트 소유 도메인 위험", "AI 에이전트 UDRP 노출", "AI 에이전트에게 도메인 위임", "지갑 보유 도메인", "AI RDAP 조회", "도메인 소유권과 통제의 차이"]
relatedArticles:
  - /ko/blog/wallet-checkout/
  - /ko/blog/agents-buy-domains/
  - /ko/blog/ai-agent-register/
  - /ko/blog/cf-namecom-namefi/
  - /ko/blog/namefi-mcp/
relatedTopics:
  - /ko/topics/domain-tokenization/
  - /ko/topics/domain-security/
relatedSeries:
  - /ko/series/blockchain-concepts/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/registrant/
  - /ko/glossary/whois/
  - /ko/glossary/custodial-ownership/
  - /ko/glossary/tokenized-domain/
  - /ko/glossary/udrp/
---

"내 AI 에이전트가 도메인을 소유할 수 있나요?"라는 질문은 [AI 에이전트](/ko/glossary/ai-agent/)가 누군가를 대신해 도메인을 등록하고 갱신하며 관리하기 시작하면 끊임없이 나옵니다. 2026년에 이것이 얼마나 흔해졌는지는 [AI 에이전트가 사람 없이 도메인을 구매하는 방법](/ko/blog/agents-buy-domains/)에서 확인할 수 있습니다. 짧은 답은 맨 앞에 있고, 이 페이지의 나머지는 사람들이 실제로 묻는 구체적인 질문을 하나씩 다룹니다. 각 질문은 그 자체로 답할 수 있습니다.

## AI 에이전트가 법적으로 도메인을 소유할 수 있나요?

자기 명의로는 안 됩니다. [ICANN](/ko/glossary/icann/)의 [2013 등록대행자 인증 계약](https://www.icann.org/en/contracted-parties/accredited-registrars/registrar-accreditation-agreement/2013-registrar-accreditation-agreement-17-09-2013-en#:~:text=The%20Registered%20Name%20Holder%20with%20whom%20Registrar%20enters%20into%20a%20registration%20agreement%20must%20be%20a%20person%20or%20legal%20entity%20other%20than%20the%20Registrar) — 모든 [ICANN 공인 등록기관](/ko/glossary/icann/)이 서명하고 그에 따라 운영하는 계약 — 은 등록대행자와 등록 계약을 맺는 "등록 도메인 보유자"가 등록대행자 이외의 개인 또는 법인이어야 한다고 직접 명시합니다. [등록자](/ko/glossary/registrant/)는 자연인 또는 등록된 법인이어야 합니다. 개인, 회사, 비영리단체, 정부 기관이 이에 해당합니다. 소프트웨어인 AI 에이전트는 어느 쪽도 아닙니다. 따라서 에이전트 자체가 등록 정보에 이름을 올릴 수는 없습니다.

그렇다고 이 규칙이 위임까지 금지하는 것은 아닙니다. RAA 어디에도 개인이나 조직이 오늘날 직원이나 자동화 도구에 권한을 주듯, 에이전트에게 자신을 대신해 검색, 등록, 갱신 또는 DNS 관리를 하도록 승인하는 일을 막는 조항은 없습니다. 등록자는 법적 주체로 남고, 도메인을 운영하는 *업무*는 에이전트에게 맡길 수 있습니다. 기록에 이름이 올라가는 주체와 클릭(또는 API 호출)을 수행하는 주체의 구분이 이 글 전체의 핵심입니다.

## AI 에이전트가 도메인을 등록할 때 등록자는 누구인가요?

계정을 보유하고 구매 자금을 부담하며 등록대행자의 약관에 동의한 사람 또는 조직입니다. 결코 에이전트가 아닙니다. 에이전트가 등록대행자의 API를 호출해 도메인을 등록할 때, 이는 누군가의 승인을 받은 도구로서 행동하는 것입니다. 웹 양식을 사용하는 사람과 법적 구조는 같지만 자동화되어 있을 뿐입니다. ICANN이 등록자에게 제공하는 안내는 책임이 어디에 있는지 명확히 말합니다. [ICANN의 등록자 혜택 및 책임 페이지](https://www.icann.org/resources/pages/benefits-2013-09-16-en#:~:text=You%20will%20assume%20sole%20responsibility%20for%20the%20registration%20and%20use%20of%20your%20domain%20name)에 따르면 "도메인 이름의 등록 및 사용에 대한 전적인 책임을 지게 됩니다." 이 책임은 에이전트를 작동시킨 계정 보유자에게 있으며, 호출을 실행한 소프트웨어에는 있지 않습니다.

그래서 [Namefi](https://namefi.io)를 포함한 신뢰할 수 있는 모든 에이전트 등록 흐름은 사람이나 법인이 통제하는 자격 증명을 거칩니다. 즉, 자금이 있는 계정에 연결된 API 키 또는 누군가가 통제하는 [지갑](/ko/glossary/wallet/)의 [개인 키](/ko/glossary/private-key/)입니다. 이 자격 증명 단계가 실제로 어떻게 작동하는지는 [Namefi에서 AI 에이전트로 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)에서 확인할 수 있습니다.

## AI 에이전트가 등록한 도메인의 WHOIS 또는 RDAP 기록에는 실제로 무엇이 표시되나요?

다른 모든 등록과 같은 필드가 표시됩니다. 즉, 기록상 등록대행자, 등록일과 만료일, 그리고 현재 대부분의 등록대행자가 기본 적용하는 [WHOIS (및 RDAP)](/ko/glossary/whois/) 개인정보 보호로 가려지지 않은 경우 등록자의 이름, 조직 및 연락처 정보입니다. "AI 에이전트가 등록함"이라는 필드는 없으며, 이를 정의하는 ICANN 정책도 없습니다. [ICANN 자체 RDAP 기반 조회 도구](https://lookup.icann.org)는 특정 도메인의 현재 기록을 확인하는 권위 있는 곳이며, 사람이 등록 양식을 입력했는지 에이전트가 API로 동일한 데이터를 제출했는지와 무관하게 같은 스키마를 반환합니다.

실무적으로 이는 외부 관찰자 — 상표권 보유자, 보안 연구자, 잠재 구매자 — 가 WHOIS/RDAP만으로 도메인이 에이전트에 의해 등록되었는지 알 수 없다는 뜻입니다. 기록은 법적 등록자를 식별합니다. 이를 만든 API 호출의 주체는 데이터 모델의 일부가 아닙니다.

## 에이전트가 도메인을 *운영*하는 것과 *소유*하는 것의 차이는 무엇인가요?

운영이란 에이전트가 갱신, DNS 레코드 편집, 이전 시작처럼 도메인에 대해 행동할 수 있음을 뜻합니다. 이는 그러한 행동에 범위가 한정된 자격 증명을 보유하기 때문입니다. 법적 무게가 있는 유일한 의미에서 소유란, 위 RAA 정의에 따라 기록상 등록자가 되는 것을 뜻합니다. 즉, 등록대행자와 ICANN 정책에 책임을 지는 개인 또는 법인입니다. 에이전트는 [Namefi의 MCP 서버](/ko/blog/namefi-mcp/)가 바로 그러한 도구를 제공하듯 도메인을 폭넓게 운영할 수 있지만, 소유자가 될 필요는 없습니다. 이는 부동산 관리인이 건물의 소유권 등기를 보유하지 않고도 열쇠를 갖고 유지보수를 처리할 수 있는 것과 같습니다.

이 두 역할의 간극에 사람들이 실제로 묻는 실무적 질문 대부분이 있습니다. 그래서 다음 몇 절에서는 단일한 예/아니오가 아니라 스펙트럼으로 이를 살펴봅니다.

## 에이전트가 관리하는 도메인의 수탁 스펙트럼이란 무엇인가요?

법적 등록자는 그대로 유지한 채, 에이전트에 점점 더 직접적인 통제권을 부여하는 세 단계입니다.

- **등록대행자 계정 접근.** 에이전트(또는 에이전트를 대신해 등록대행자 API를 호출하는 스크립트)는 개인이나 조직이 보유한 등록대행자 계정에 연결된 자격 증명을 사용합니다. 등록자 필드는 바뀌지 않습니다. 에이전트는 오늘날의 로그인 공유 방식처럼 누군가가 이미 소유한 계정 안에서 행동할 뿐입니다.
- **API 키.** 전체 계정 대시보드 접근을 반드시 공유하지 않고도, 충전된 잔액에 청구되는 등록대행자 API용으로 범위가 한정된 자격 증명입니다. [Namefi는 이를 발급합니다](https://namefi.io/api-key). 따라서 에이전트는 브라우저 세션을 건드리지 않고 검색, 가격 확인 및 등록을 할 수 있습니다. 이는 [Namefi에서 AI 에이전트로 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)에서 다룹니다. 등록자는 여전히 해당 키가 범위 지정된 계정의 보유자입니다.
- **지갑이 보유한 [토큰화 도메인](/ko/glossary/tokenized-domain/).** 등록은 온체인 토큰으로 민팅되며, [x402](/ko/glossary/x402/) 지갑 서명 결제 또는 지정된 수신 주소를 통해 그 토큰을 보유한 [지갑](/ko/glossary/wallet/)의 주체가 등록대행자 대시보드를 전혀 거치지 않고 도메인의 온체인 이전 경로를 직접 통제합니다. 이렇게 도메인을 지갑에 넣는 방식은 [암호화폐 지갑으로 도메인 결제하기: 계정 불필요](/ko/blog/wallet-checkout/)에서 확인할 수 있습니다.

각 단계는 이전 단계보다 직접적이지만, 앞서의 법적 등록자 질문은 달라지지 않습니다. 에이전트가 어느 단계에서 운영하든 답은 같습니다.

## 도메인이 토큰화되면 무엇이 달라지나요?

도메인을 토큰화하면 실제 DNS 등록에 대한 병행 온체인 통제 계층으로 작동하는 [NFT (대체 불가능 토큰)](/ko/glossary/nft/)가 민팅됩니다. 자세한 설명은 [토큰화 도메인이란 무엇인가요?](/ko/blog/what-are-tokenized-domains/)에서 볼 수 있습니다. [ICANN 공인 등록기관](/ko/glossary/icann/)인 Namefi는 기본 등록을 실제 ICANN 인정 등록으로 유지하면서, 구매자가 지정한 지갑으로 소유권 토큰을 민팅하는 방식으로 이를 처리합니다. Namefi 자체 문서는 구매자가 통제하는 `nftReceivingWallet` 주소로 결과 토큰을 직접 전송하는 도메인 등록을 설명합니다. 도메인에는 여전히 WHOIS/RDAP 기록과 기록상 등록대행자가 있습니다. 토큰은 등록대행자를 매개로 한 이전 요청 없이도 그 기록의 *통제권*을 P2P로 온체인에서 이전하는 방법을 더합니다.

토큰화가 바꾸지 않는 것은 누가 등록자가 될 수 있는가입니다. 토큰화 도메인이 기반으로 하는 [ERC-721 (NFT 표준)](/ko/glossary/erc-721/)은 [어떤 종류의 주소가 토큰을 보유할 수 있는지 제한하지 않습니다](https://eips.ethereum.org/EIPS/eip-721). 모든 지갑 주소가 NFT를 소유할 수 있고, 이 표준은 컨트랙트도 토큰을 보유할 수 있음을 명시적으로 고려합니다. 이는 토큰에 관한 설명일 뿐, 그 위의 등록대행자 계층에 있는 ICANN 등록자 규칙에 관한 것이 아닙니다. 해당 규칙은 여전히 기초 등록이 법적 개인 또는 법인으로 추적될 것을 요구합니다.

## AI 에이전트의 지갑이 실제로 토큰화 도메인을 보유할 수 있나요?

기술적으로는 그렇습니다. 좁은 의미에서 지갑은 단지 키 쌍이고, ERC-721 표준이나 민팅 트랜잭션 어디에도 개인 키를 통제하는 주체가 사람인지, 스크립트인지, 자율 프로세스인지 검사하지 않습니다. 에이전트가 지갑에 대한 서명 권한 — 자체 키이든 다른 사람의 키에 대한 위임 권한이든 — 을 갖고 있다면, 그 지갑은 다른 모든 지갑처럼 토큰화 도메인의 NFT를 수령하고 보유할 수 있습니다.

그러한 구조가 *에이전트*를 법적으로 의미 있는 소유자로 만드는지는 여기서 해결할 수 없는 진정으로 열린 질문입니다. 우리가 찾은 ICANN 정책, 법원 판결 또는 출처 중에는 사람이나 법인이 아닌 AI 에이전트가 무엇이든 법적 권리를 보유하는 문제를 다룬 것이 없습니다. "에이전트의 지갑이 토큰을 보유한다"는 표현은 확정된 법적 결론이 아니라 기술적 수탁의 설명으로 보아야 합니다. 더 안전한 틀, 그리고 위의 모든 출처가 뒷받침하는 틀은 다음과 같습니다. 지갑의 *통제자* — 개인 키를 보유하거나 그 사용을 지시할 수 있는 자 — 가 실질적인 청구권을 갖는 주체이며, 그 주체는 여전히 소프트웨어가 아니라 개인 또는 법인일 것으로 예상됩니다.

## 에이전트가 잘못 행동하면 어떻게 되나요? 도메인을 잠그거나 되찾을 수 있나요?

수탁 단계에 따라 서로 다른 두 보호 장치가 적용되며, 같은 종류의 구제 수단을 제공하지는 않습니다. 등록대행자 수준에서는 ICANN의 이전 규칙이 마찰을 둡니다. 일반적으로 도메인은 최초 등록 후 60일 이내에 새 등록대행자로 이전할 수 없고, 등록자의 이름, 조직 또는 이메일 주소가 변경된 후에는 **60일 등록자 변경 잠금**이 적용됩니다. 둘 다 [ICANN의 등록자 FAQ](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en#:~:text=Another%20situation%20is%20if%20the%20domain%20name%20is%20subject%20to%20a%2060-day%20Change%20of%20Registrant%20lock)에 문서화되어 있습니다. 이 기간은 등록자가 최종 확정 전에 무단 변경을 알아차리고 이의를 제기할 시간을 줍니다. 표준 등록대행자 계정이나 API 키에서 에이전트가 통제를 벗어났을 때의 실제적이지만 제한적인 보호입니다.

도메인이 토큰화되고 NFT가 지갑에 들어가면 이 안전망은 다르게 보입니다. 온체인 이전은 한번 확정되면 일반적으로 최종적입니다. 잘못된 주소로 전송된 토큰을 되돌리는 등록대행자 측 잠금은 없습니다. 따라서 실무적 방어는 더 앞단, 즉 에이전트의 지갑이 가진 권한의 정도로 옮겨갑니다. 두 번째 서명자가 필요한 [멀티시그](/ko/glossary/multi-sig/) 구성, 또는 가치 있는 토큰화 도메인을 보유한 지갑에 에이전트의 상시 권한을 아예 부여하지 않는 방식이 있습니다. 이는 [암호화폐 지갑으로 도메인 결제하기](/ko/blog/wallet-checkout/#the-security-model-what-the-agent-can-and-cannot-do)에서 결제에 관해 다룬 것과 같은 가드레일 원칙입니다.

## 도메인을 토큰화하면 UDRP 노출이 사라지나요?

아니요. 우리가 확인한 어떤 출처도 그렇다고 말하지 않습니다. [UDRP (통일 도메인 이름 분쟁 해결 정책)](/ko/glossary/udrp/) 의무는 토큰화 도메인에도 여전히 존재하는 ICANN 인정 DNS 등록에 붙습니다. 토큰화는 누가 어떻게 도메인을 이동할 수 있는지를 바꿀 뿐, 상표법이나 ICANN 분쟁 정책의 적용 여부를 바꾸지는 않습니다. 에이전트 소유 도메인에 관한 한 글은 노출을 다음처럼 명확히 표현했습니다. 누군가의 자격 증명으로 에이전트가 등록하는 도메인을 아무도 감시하지 않을 때, "에이전트가 상표 충돌로 판명되는 도메인을 등록하면 UDRP 이의 제기에 응답할 사람이 없습니다." 자세한 내용은 [AI 에이전트가 사람 없이 도메인을 구매하는 방법](/ko/blog/agents-buy-domains/#guardrails-no-human-required-still-needs-a-human-set-policy)에서 다룹니다. UDRP 이의 제기는 등록을 제출한 에이전트가 아니라 기록상 등록자, 즉 그 법적 개인 또는 법인을 상대로 제기됩니다.

## 에이전트의 도메인이 법적 문제를 일으키면 실제로 누가 책임을 지나요?

기록상 등록자입니다. 등록을 승인한 계정, API 키 또는 지갑의 개인이나 법인이며, AI 모델 자체가 아닙니다. 이것이 위의 모든 질문을 관통하는 흐름입니다. WHOIS/RDAP는 법적 주체의 이름을 표시하고, RAA는 이를 요구하며, ICANN의 이전 잠금 보호와 UDRP 노출은 모두 그 같은 이름에 적용됩니다. 토큰화는 통제의 작동 방식을 바꾸지만, 그 아래에서 누가 책임을 지는지는 건드리지 않습니다. "에이전트가 도메인을 소유한다"는 말은 "에이전트가 도메인의 통제권을 위임받았다"는 유용한 줄임말입니다. 이러한 위임이 어디까지 갈 수 있는지, 어떤 관할권이 자율 에이전트를 운영자가 책임지는 도구 이상으로 취급할지는 아직 검증되지 않았으므로, 이를 확정된 법적 사실로 보아서는 안 됩니다. 에이전트에게 어느 단계에서든 구매 또는 수탁 권한을 넘기기 전에 누가 법적 등록자인지 명시적으로 정하세요.

## 기록상 실제 등록자와 함께 등록하고 토큰화하세요

[Namefi](https://namefi.io)는 바로 이러한 질문을 위해 설계되었습니다. ICANN이 요구하는 방식으로 등록자 필드를 처리하는 실제 [ICANN 공인 등록기관](/ko/glossary/icann/) 등록과, 설정한 가드레일 아래 에이전트가 운영하는 지갑을 포함해 선택한 모든 지갑에 온체인 통제권을 부여하는 선택적 [토큰화](/ko/glossary/tokenized-domain/) 계층을 제공합니다. [Namefi에서 AI 에이전트로 도메인을 등록하는 방법](/ko/blog/ai-agent-register/)부터 시작하거나, [암호화폐 지갑으로 도메인 결제하기](/ko/blog/wallet-checkout/)에서 지갑 서명 결제로 바로 이동하세요.

**[Namefi에서 도메인 검색 및 등록하기](https://namefi.io).**

## 출처 및 추가 자료

- ICANN — [2013 등록대행자 인증 계약, §3.7.7](https://www.icann.org/en/contracted-parties/accredited-registrars/registrar-accreditation-agreement/2013-registrar-accreditation-agreement-17-09-2013-en#:~:text=The%20Registered%20Name%20Holder%20with%20whom%20Registrar%20enters%20into%20a%20registration%20agreement%20must%20be%20a%20person%20or%20legal%20entity%20other%20than%20the%20Registrar) ("등록대행자 이외의 개인 또는 법인이어야 합니다" — 등록자 자격의 핵심 규칙)
- ICANN — [등록자의 혜택 및 책임](https://www.icann.org/resources/pages/benefits-2013-09-16-en#:~:text=You%20will%20assume%20sole%20responsibility%20for%20the%20registration%20and%20use%20of%20your%20domain%20name) ("도메인 이름의 등록 및 사용에 대한 전적인 책임을 지게 됩니다")
- ICANN — [등록자 FAQ: 도메인 이름 이전하기](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en#:~:text=Another%20situation%20is%20if%20the%20domain%20name%20is%20subject%20to%20a%2060-day%20Change%20of%20Registrant%20lock) (신규 등록 및 등록자 변경 후 60일 이전 잠금)
- ICANN — [ICANN 조회(lookup.icann.org)](https://lookup.icann.org) (도메인의 현재 등록자 기록을 위한 공식 RDAP 기반 WHOIS/RDAP 조회)
- Ethereum — [EIP-721: 대체 불가능 토큰 표준](https://eips.ethereum.org/EIPS/eip-721) (컨트랙트를 포함해 어떤 주소가 토큰을 보유할 수 있는지 제한하지 않음)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (토큰화 및 `nftReceivingWallet` 민팅 참고 자료 — 이 글의 Namefi 제품 주장 출처)
- dev.to — [AI 에이전트가 자체 도메인 이름을 구매할 수 있는 방법과 그 의미](https://dev.to/purpleflea/how-ai-agents-can-buy-their-own-domain-names-and-why-this-matters-1l4j#:~:text=If%20an%20agent%20registers%20a%20domain%20that%20turns%20out%20to%20be%20a%20trademark%20conflict%2C%20there%27s%20no%20human%20to%20respond%20to%20a%20UDRP%20complaint) (아무도 에이전트의 등록을 감시하지 않을 때의 UDRP 노출)
- Namefi — [AI 에이전트가 사람 없이 도메인을 구매하는 방법(2026)](/ko/blog/agents-buy-domains/) (이 글의 기반이 되는 가드레일 및 리셀러 구성)
- Namefi — [암호화폐 지갑으로 도메인 결제하기: 계정 불필요](/ko/blog/wallet-checkout/) (지갑 서명 수탁 방식 및 지출 정책 가드레일)
