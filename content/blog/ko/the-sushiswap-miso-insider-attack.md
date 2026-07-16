---
title: 'SushiSwap MISO 내부자 공격: 단 하나의 악성 커밋이 토큰 경매에서 약 300만 달러를 빼돌린 사건'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 22
format: case-study
description: '2021년 9월, 익명의 외부 계약자가 악성 커밋을 통해 SushiSwap MISO 런치패드 프런트엔드에 자신의 지갑 주소를 삽입하여 Jay Pegs Auto Mart 경매에서 864.8 ETH(약 300만 달러)를 탈취했습니다. 코드 공급망, 프런트엔드 신뢰, 그리고 검증 가능한 소유권의 중요성에 대한 Domain Mayday 심층 분석.'
keywords: ['sushiswap miso 해킹', 'miso 공급망 공격', 'aristok3', 'jay pegs auto mart', 'defi 프런트엔드 공격', '864.8 eth', '소프트웨어 공급망', '악성 커밋', '내부자 위협', 'auctionwallet', 'joseph delong', '웹 공급망 보안', '도메인 보안']
relatedArticles:
  - /ko/blog/the-badgerdao-frontend-attack/
  - /ko/blog/the-curve-finance-dns-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/icann/
  - /ko/glossary/web3/
  - /ko/glossary/tld/
---

대부분의 공격은 문을 부수고 들어옵니다. 이 공격은 정문으로 걸어 들어왔습니다.

2021년 9월, SushiSwap의 MISO 런치패드를 운영하던 팀은 피싱을 당한 것도, [개인 키](/ko/glossary/private-key/)를 탈취당한 것도, 버그가 있는 [스마트 컨트랙트](/ko/glossary/smart-contract/)를 배포한 것도 아니었습니다. 그들이 한 일은 훨씬 더 평범한 것이었습니다. 바로 기여자를 신뢰한 것입니다. 코드에 커밋 권한을 가진 익명의 계약자가 [경매](/ko/glossary/auction/) 프런트엔드에 자신의 [지갑](/ko/glossary/wallet/) 주소를 삽입하고 푸시한 뒤, 배포 파이프라인이 나머지를 처리하도록 내버려 두었습니다. 단 하나의 NFT 경매가 마감되었을 때, 약 **864.8 ETH — 약 300만 달러**가 판매를 진행한 프로젝트가 아닌, 자금이 어디로 가야 하는지를 조용히 다시 써버린 그 개발자에게 흘러 들어갔습니다.

익스플로잇도 없었고, 제로데이도 없었습니다. 그저 아무도 두 번 확인하지 않은 코드 한 줄이 있었을 뿐이며, 팀의 일원이어야 할 사람이 서명한 것이었습니다.

이것이 Domain Mayday EP15입니다. 이 이야기는 스마트 컨트랙트 이야기가 아닙니다. 핵심은 대부분의 사람들이 결코 감사하지 않는 웹의 한 부분, 즉 코드 공급망과 프런트엔드, 그리고 "누가 이것을 변경할 수 있는가?"라는 질문이 "누가 키를 쥐고 있는가?"만큼이나 심각한 보안 질문이라는 불편한 사실에 관한 것입니다.

## 런치패드 코드에 부여하는 신뢰

MISO — Minimal Initial SushiSwap Offering — 같은 [DeFi](/ko/glossary/defi/) 런치패드는 단 하나의 일을 잘 수행하기 위해 존재합니다. 불특정 다수의 군중으로부터 자금을 받아 토큰 또는 NFT 판매를 진행하는 프로젝트에 전달하는 것입니다. 이를 위해 [온체인](/ko/glossary/on-chain/)에서 감사된 스마트 컨트랙트와 오프체인의 웹 프런트엔드를 연결합니다. 사용자는 프런트엔드와 상호작용하고, 프런트엔드는 지갑에 어떤 트랜잭션에 서명할지 알려줍니다.

바로 이 연결 지점이 취약한 부분입니다. 사람들은 감사, 버그 바운티, 그리고 헤드라인이 존재하는 스마트 컨트랙트 계층에 집착합니다. 그러나 프런트엔드 — 경매가 *어느 주소*로 지급할지를 결정하는 JavaScript — 는 단순히 저장소에 있는 코드이며, 파이프라인이 배포하고, 쓰기 권한을 가진 누구든 편집할 수 있습니다. 금고를 아무리 감사해도 소용없습니다. 내부자가 "여기에 돈을 맡기세요"라는 안내판을 바꿀 수 있다면, 금고는 아예 관련이 없게 됩니다.

MISO의 코드는 크립토 인프라가 흔히 그렇듯 개방적이고 협업적이었습니다. 이러한 개방성은 기여자를 불러들이고, 출시를 가속화하며, 소규모 핵심 팀이 훨씬 더 큰 영향력을 발휘할 수 있게 해주는 장점입니다. 동시에 이것은 공급망 공격자에게 필요한 바로 그 표면이기도 합니다. 침입할 필요가 없습니다. 기여에 초대받기만 하면 됩니다.

## 2021년 9월: 악성 커밋

![개방형 소스 벽돌 벽에서 익명의 장갑 낀 손이 빛나는 빨간색의 변조된 벽돌 하나를 조용히 교체하는 생생하고 화려한 컨셉 아트](../../assets/the-sushiswap-miso-insider-attack-01-attack.jpg)

2021년 9월 17일 금요일, SushiSwap의 당시 최고기술책임자(CTO)인 Joseph Delong이 트위터를 통해 무슨 일이 있었는지 설명했습니다. CoinDesk의 보도는 단도직입적입니다. Delong은 [GitHub 핸들 "AristoK3"를 사용하는 익명의 계약자가 공급망 공격을 통해 MISO 프런트엔드에 악성 코드를 삽입했다](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=an%20anonymous%20contractor%20using%20the%20Github%20handle)고 밝혔습니다.

수법은 거의 모욕적일 만큼 단순했습니다. Delong이 설명한 대로, 공격자는 [경매의 지갑 주소를 자신의 주소로 교체했습니다](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=replaced%20the%20auction%27s%20wallet%20address%20with%20their%20own). PYMNTS는 이 행위를 공급망 용어로 정확히 표현했습니다. 계약자가 [플랫폼 프런트엔드를 통해 배포된 악성 코드 커밋을 푸시했습니다](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=pushed%20a%20malicious%20code%20commit%20that%20was%20distributed%20on%20the%20platform%27s%20front%20end).

사건 사후 보고서는 그 본질을 한 문장으로 포착합니다. 경매 작업을 위해 계약된 개발자가 [auctionWallet 대신 자신의 지갑 주소를 컨트랙트에 삽입했습니다](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=inserted%20his%20own%20wallet%20address%20into%20the%20contract%20instead%20of%20the). 이는 감사된 온체인 로직 자체를 破壊한 것이 아니라, 배포 시점에 프런트엔드가 전달하는 값을 편집함으로써 이루어졌습니다. 단 하나의 변수였습니다. `auctionWallet`은 판매를 진행하는 프로젝트를 가리켜야 했지만, 대신 계약자를 가리켰습니다. 입찰자가 경매 수혜자에게 보낸다고 생각한 모든 자금이 다른 곳으로 흘러갔으며, 코드는 그 과정에서 완전히 정상처럼 보였습니다.

## 탈취된 금액: 약 864.8 ETH, 약 300만 달러

대상은 단 하나의, 거의 희극적인 경매였습니다. CryptoSlate가 보도한 바에 따르면, MISO는 ['Jay Pegs Auto Mart' 토큰 경매 컨트랙트에서 864.8 ETH를 탈취당하는](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=drained%20864.8%20ETH%20from%20the) 공급망 공격을 받았습니다. Jay Pegs Auto Mart는 중고차 딜러십 컨셉의 NFT 아트 프로젝트였습니다. 장난스러운 크립토 문화적 외양 아래에는 재정적으로 매우 실질적인 토큰 판매가 있었습니다.

수치는 여러 매체에서 동일하게 보도되었습니다. PYMNTS는 [해커가 864.8 이더리움 코인, 약 300만 달러를 자신의 지갑으로 이체했다](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=transferred%20864.8%20Ethereum%20coins)고 보도했습니다. The Crypto Times는 공격자가 [864.8 ETH를 탈취했으며](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=drained%20864.8%20ETH), [현재까지 해킹 및 익스플로잇된 경매 프로젝트는 Jay Pegs Auto Mart가 유일하다](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=The%20only%20auction%20project%20that%20has%20been%20hacked%20and%20exploited)고 확인했습니다.

마지막 세부 사항이 중요합니다. 오염된 코드는 프런트엔드를 통해 배포되었으므로, 이론적으로는 해당 코드가 닿는 *모든* 경매의 자금을 가로챌 수 있었습니다. 실제로는 팀이 이를 발견하기 전에 Jay Pegs Auto Mart만이 공격자의 주소로 정산되었습니다. 다른 영향을 받은 경매들은 자금이 탈취되기 전에 패치되었습니다. 단 몇 시간의 차이가 하나의 나쁜 헤드라인과 대재앙 사이를 갈랐습니다.

## 발생 경위: 잠금장치가 아닌 내부자 신뢰

![빛나는 돈 파이프를 내부자가 그림자 속에서 조용히 비틀어 의도한 탱크 대신 개인 버킷으로 흘러들어가게 하는 생생하고 화려한 컨셉 아트](../../assets/the-sushiswap-miso-insider-attack-02-malicious-commit.jpg)

크립토 용어를 제거하면, 이것은 고전적인 소프트웨어 공급망 공격입니다. 독이 든 npm 패키지나 변조된 빌드 서버와 같은 범주에 속하며, 단지 보상이 ETH로 표시될 뿐입니다.

신뢰 사슬은 다음과 같았습니다. 기여자는 라이브 경매를 구동하는 코드에 대한 쓰기 권한을 부여받았습니다. 그들은 그 권한을 사용해 목적지 주소를 바꾸는 변경 사항을 커밋했습니다. 배포 파이프라인은 파이프라인이 하는 일을 했습니다. 최신 코드를 가져다 실제 사용자들이 브라우저에서 불러오는 프런트엔드에 배포했습니다. 사용자들은 지갑을 연결하고, 프런트엔드가 서명하도록 말한 것에 서명했으며, 수혜자가 조용히 다시 쓰인 경매에 자금을 조달했습니다. Coinspeaker의 보도는 다른 매체들과 일치합니다. [GitHub 핸들 AristoK3를 사용하는 익명의 계약자가 MISO 프런트엔드에 악성 코드를 삽입했습니다](https://www.coinspeaker.com/sushiswap-miso-attack-nft/#:~:text=an%20anonymous%20contractor%20with%20the%20GH%20handle%20AristoK3%20injected%20malicious%20code%20into%20the%20Miso%20front%20end).

필요하지 않았던 것들에 주목하십시오. 공격자는 스마트 컨트랙트의 결함을 찾을 필요가 없었습니다. 키를 훔치거나 외부에서 서버를 침해할 필요도 없었습니다. 단 하나만 필요했습니다. 코드를 변경할 만큼 충분히 신뢰받는 것. 사건 보고서의 표현은 정확합니다. [MISO 프런트엔드는 공급망 공격의 피해자가 되었으며](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=The%20Miso%20front%20end%20has%20become%20the%20victim%20of%20a%20supply%20chain%20attack) GitHub 핸들 AristoK3를 사용하는 익명의 계약자에 의해 [MISO 프런트엔드에 악성 코드가 삽입되었습니다](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=injected%20malicious%20code%20into%20the%20Miso%20front%20end).

이것이 내부자 공급망 공격이 그토록 위험한 이유입니다. 방화벽, 감사, 자금 관리의 멀티시그 등 모든 외부 방어는 위협이 외부에서 침입하려 한다고 가정합니다. 커밋 권한을 가진 내부자는 이미 그 모든 것을 통과한 상태입니다. 악성 변경 사항은 프로젝트 자체의 신뢰받는 정당한 배포 프로세스를 타고 곧장 프로덕션으로 향했습니다. 파이프라인이 전복된 것이 아니었습니다. *사용된* 것이었습니다.

## 대응과 복구: 적발, 신원 공개, 환불

SushiSwap의 대응은 신속하고 공개적이었으며 대결적이었습니다. Delong은 조용히 조사하지 않았습니다. GitHub 핸들을 공개하고, 의심되는 실제 신원을 명명하며, 기한을 설정했습니다. CoinDesk에 따르면 경고는 명시적이었습니다. 자금이 반환되지 않으면 DeFi 거래소는 [FBI에 고발장을 제출할 것이라고](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=file%20a%20complaint%20with%20the%20FBI) 했습니다.

효과가 있었습니다. 공격자는 방향을 바꿨습니다. CryptoSlate는 팀이 공개 발표를 한 지 불과 몇 시간 만에 [해커가 원래 MISO 컨트랙트에 865 ETH를 반환했다](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=the%20hacker%20returned%20865%20ETH%20to%20the%20original%20MISO%20contract)고 보도했으며, 이는 탈취된 864.8 ETH보다 약간 *더 많은* 금액이었습니다. The Crypto Times는 목적지를 확인했습니다. [SushiSwap의 멀티시그 주소로 865 ETH가 반환되었습니다](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=the%20multisign%20address%20of%20Sushiswap%20got%20865%20ETH%20back). Delong 자신의 상태 업데이트는 원래 위협만큼이나 간결했습니다. Decrypt는 하루도 채 지나지 않아 [모든 자금이 반환되었다](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum#:~:text=All%20funds%20returned)는 그의 확인을 기록했습니다.

이 해피엔딩에는 단서가 필요합니다. 돈이 돌아온 것은 아키텍처가 도난을 잡아냈기 때문이 아니라, 공격자가 공개적인 노출과 신뢰할 수 있는 법 집행 위협 앞에서 스스로 돌려주기로 선택했기 때문입니다. 공개 원장 위의 가명성은 양날의 검입니다. 계약자가 익명으로 행동할 수 있게 해줬지만, 동시에 탈취된 자금의 온체인 흔적이 모든 사람에게 보였고, 이것이 자금을 반환하는 것을 최소 저항 경로로 만든 바로 그 레버리지였습니다. 이 경우의 복구는 협상이었지 보장이 아니었습니다. 다음 내부자는 눈 하나 깜짝하지 않을 수도 있습니다.

## 코드 공급망과 프런트엔드 신뢰에서 배울 수 있는 것

MISO 사건은 DeFi 기준으로는 작은 금액이지만 교훈은 큽니다. 기억할 만한 몇 가지를 소개합니다.

1. **프런트엔드는 보안 경계의 일부입니다.** 사용자는 인터페이스가 서명하라고 말하는 것에 서명합니다. 공격자가 인터페이스가 표시하는 주소를 통제한다면, 스마트 컨트랙트는 전혀 필요하지 않습니다. 온체인 코드만 감사하면 시스템의 절반만 감사하는 것입니다.
2. **쓰기 권한이 진짜 공격 표면입니다.** 세계 최강의 암호화도 코드를 편집할 수 있는 사람이 마음을 먹으면 소용없습니다. "누가 이것을 바꿀 수 있고, 배포 전에 누가 검토하는가?"는 보안 통제이지, 단순한 프로세스 세부 사항이 아닙니다.
3. **필수 코드 리뷰는 관료주의가 아니라 방어입니다.** `auctionWallet`을 바꾼 커밋에 두 번째 눈이 필수적으로 요구되었다면 아마 이 공격을 완전히 막았을 것입니다. 공급망 공격은 배포 전에 독립적으로 검토되지 않는 변경 사항에서 번성합니다.
4. **가명 기여자는 위험을 높입니다.** 개방적인 기여는 강점이지만, 익명 신원에게 배포에 영향을 미치는 권한을 부여하는 것은 완전히 출처를 특정할 수 없는 코드를 신뢰하는 것을 의미합니다. 신뢰는 열의가 아니라 검증에 비례해서 주어져야 합니다.
5. **복구는 행운이지 아키텍처가 아닙니다.** 자금이 돌아온 것은 공개적인 압박과 추적 가능한 원장 덕분이었습니다. 공격자의 선의에 *의존하는* 시스템을 설계하는 것은 보안 설계가 전혀 아닙니다.

공통된 교훈: *누가 변경을 허용받는지*, 그리고 *그 변경이 실제로 배포된 것인지 검증하는 것*은 어떤 암호학적 키만큼이나 중요한 근간입니다. 공급망 신뢰는 부드럽고 문화적인 문제가 아닙니다. 시스템의 날카로운 경계입니다.

## Namefi의 관점

![검증 가능하고 변조 저항성이 있는 소유권을 보여주는 컬러풀한 일러스트 — 녹색 방패, 녹색 Namefi 토큰, 그리고 연속성으로 보호됨](../../assets/the-sushiswap-miso-insider-attack-03-namefi-angle.jpg)

MISO가 돈을 잃은 것은 *가치의 목적지*가 시스템이 신뢰하는 누군가에 의해 조용히 다시 쓰일 수 있었고, 배포 전에 아무도 그 변경 사항을 검증하지 않았기 때문입니다. 이 실패 양식은 DeFi 런치패드에만 고유한 것이 아닙니다. 마침 올바른 접근 권한을 보유한 누군가 — [레지스트라](/ko/glossary/registrar/) 계정, 내부 패널, 자격 증명을 가진 계약자 — 에 의해 소유권이나 DNS 레코드가 조용히 변경될 수 있는 도메인과 동일한 형태입니다.

도메인은 인터넷에서 가장 결과적인 "목적지" 설정 중 하나입니다. DNS 레코드는 트래픽, 이메일, 사용자가 실제로 어디로 가는지를 결정합니다. 만약 이것이 무엇이 언제 변경되었는지에 대한 변조 증거 없이, 독립적으로 검증 가능한 기록 없이 내부자나 침해된 계정에 의해 변경될 수 있다면, MISO 문제를 다른 옷을 입혀 가진 셈입니다. 잠금장치는 멀쩡하지만, 문의 안내판이 바뀔 수 있습니다.

[Namefi](https://namefi.io)는 [도메인 소유권](/ko/glossary/domain-ownership/)을 누군가의 개인 계정에 있는 항목이 아닌 검증 가능하고 변조 저항성이 있는 자산으로 취급함으로써 이 문제에 접근합니다. 토큰화된 소유권은 DNS와의 호환성을 유지하면서 온체인에서 제어를 감사 가능하고 양도 가능하게 만듭니다. 따라서 "누가 이것을 소유하고 변경할 수 있는가"는 맹목적으로 신뢰를 연장해야 하는 것이 아니라 검증할 수 있는 사실이 됩니다. MISO 계약자는 시스템이 "이 변경이 승인되었는가?"에 대한 강제적이고 독립적으로 확인 가능한 답을 갖지 못했기 때문에 정확히 지급 주소를 다시 쓸 수 있었습니다. Namefi가 공급망 공격에서 얻는 교훈은 소유권과 통제권이 설계상 증명 가능해야 한다는 것입니다. 그래야 *신뢰받는* 것과 *검증된* 것 사이의 위험한 틈이 애초에 열리지 않습니다.

## 출처 및 추가 읽을거리

- CoinDesk — [$3M in Ether Stolen From SushiSwap's MISO Launchpad](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad)
- Decrypt — [SushiSwap's Token Launchpad Hacked for Over $3M in Ethereum](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum)
- CryptoSlate — [Hacker returns 865 ETH stolen from Sushi's token launch platform MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/)
- PYMNTS — [SushiSwap Crypto Platform Victimized by $3M Hack](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/)
- The Crypto Times — [Sushiswap's Miso Launchpad Loses $3 Million In An Attack](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/)
- Coinspeaker — [SushiSwap Launchpad Miso Suffers Attack with 864.8 ETH NFT Project Fund Carted Away](https://www.coinspeaker.com/sushiswap-miso-attack-nft/)
- CryptoBriefing — [Sushi's Initial Offering Launchpad Suffers $3M Exploit](https://cryptobriefing.com/sushiswaps-miso-token-launchpad-suffers-3m-exploit/)
- CryptoPotato — [Another DeFi Hack: $3M in ETH Stolen From SushiSwap's Token Platform](https://cryptopotato.com/another-defi-hack-3m-in-eth-stolen-from-sushiswaps-token-platform/)
- Quadriga Initiative — [SushiSwap MISO Jaypegs Automart case study](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php)
