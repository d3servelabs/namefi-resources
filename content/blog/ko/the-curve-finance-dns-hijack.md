---
title: 'Curve Finance DNS 하이재킹: "감사된 컨트랙트"도 현관문은 지키지 못했다'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 9
format: case-study
description: '2022년 8월, Curve Finance의 스마트 컨트랙트는 아무런 피해도 입지 않았습니다. 그러나 공격자들은 레지스트라 수준에서 curve.fi 도메인을 탈취하고, 복제 사이트를 연결한 뒤 사용자들의 약 57만 달러를 빼앗아 갔습니다. DeFi 프론트엔드를 겨냥한 DNS 공격의 전모와 도메인 보안이 주는 교훈을 심층 분석합니다.'
keywords: ['curve finance dns 하이재킹', 'curve.fi 하이재킹', 'dns 하이재킹 defi', 'iwantmyname 침해', '네임서버 침해', '지갑 탈취', 'defi 프론트엔드 공격', '도메인 보안', 'dns 보안', '암호화폐 피싱', '복제 웹사이트 공격', '레지스트라 계정 침해', '도메인 위기']
relatedArticles:
  - /ko/blog/the-badgerdao-frontend-attack/
  - /ko/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ko/blog/the-bitcoin-org-dns-hijack/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-lenovo-com-dns-hijack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
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

스마트 컨트랙트는 멀쩡했습니다.

2022년 8월 9일 Curve Finance에 무슨 일이 일어났는지 이해하려면, 이 사실을 먼저 받아들여야 합니다. 그리고 이 사실이야말로 수년이 지난 지금도 보안 엔지니어들을 불안하게 만드는 부분입니다. Curve의 [온체인](/ko/glossary/on-chain/) 코드 — 수십억 달러의 스테이블코인을 보유하며 감사를 거치고 실전에서 검증된 자동화 마켓메이커(AMM) — 는 전혀 손대지지 않았습니다. 재진입 버그도, 오라클 조작도, 플래시론 익스플로잇도 없었습니다. [블록체인](/ko/glossary/blockchain/)은 설계된 대로 정확히 작동했습니다.

그런데도 사용자들은 약 **57만 달러**를 잃었습니다.

공격은 컨트랙트를 통해 이루어지지 않았습니다. **도메인**을 통해 이루어졌습니다. 누군가가 [레지스트라](/ko/glossary/registrar/) 수준에서 `curve.fi`를 장악하고, [지갑](/ko/glossary/wallet/) 탈취 기능이 내장된 복제 사이트로 연결한 뒤, 프로토콜의 명성이 나머지 일을 해주기를 기다렸습니다. Curve가 통과했던 모든 보안 감사는 의미가 없어졌습니다. 공격자는 그 문을 두드리지 않았기 때문입니다. 그들은 정문으로 걸어 들어왔습니다 — 사용자들이 아무 생각 없이 입력하는 웹 주소, 바로 그 문으로.

이것은 *Domain Mayday* 에피소드 13편입니다. 시스템에서 가장 보안이 철저한 부분은 완벽히 안전한 채로 있는데, 정작 모두가 *확인도 하지 않고 신뢰하는* 부분 — 도메인 이름 — 이 어느새 공격 표면이 되어버리는 이야기입니다.

## "감사된 컨트랙트"는 현관문을 지키지 못합니다

[DeFi](/ko/glossary/defi/)는 오랜 시간에 걸쳐 컨트랙트 보안 문화를 구축해 왔습니다. 감사는 기본 요건이 되었고, 버그 바운티는 수백만 달러 규모로 성장했으며, "Etherscan 검증 완료"는 신뢰 신호가 되었습니다. 업계 전반에 걸쳐 이런 인식이 굳어졌습니다: *컨트랙트가 안전하면 프로토콜은 안전하다.*

그러나 사용자는 컨트랙트와 직접 상호작용하는 경우가 거의 없습니다. 그들은 웹사이트에 접속합니다. `curve.fi`를 입력하면 브라우저가 그 이름을 [IP 주소](/ko/glossary/ip-address/)로 변환하고, 페이지를 불러오며, 그 페이지가 지갑에 무엇을 서명할지 알려줍니다. 감사를 받은 Solidity 코드 단 한 줄이 실행되기 *전에* 이 모든 단계가 이루어지며, 그 모든 단계는 감사가 전혀 다루지 않은 인프라 위에서 작동합니다.

도메인 이름은 이 연결고리의 맨 첫 번째 고리입니다. 동시에 대부분의 팀이 가장 소홀히 다루는 고리이기도 합니다. 한 번 등록하고, DNS를 연결하고, 이후로는 신경도 쓰지 않는 방식으로요. 이 사건 이후 어느 해설가가 정리했듯, 이런 공격은 블록체인 자체를 침해하는 것이 아니라 ["사용자와 탈중앙화 앱 인터페이스 사이의 신뢰 레이어를 악용합니다."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) 컨트랙트가 아무리 완벽해도, 공격자가 `curve.fi`가 *어디를 가리킬지*를 통제한다면 그 완벽함은 아무 의미가 없습니다.

## 2022년 8월 9일: 하이재킹

![상점 주소 간판이 바뀌며 고객들을 숨겨진 함정 바닥이 있는 동일한 가짜 상점으로 유도하는 콘셉트 아트, 따뜻하고 차가운 색조, 초현실적 보안 은유, 브랜드 로고 없음](../../assets/the-curve-finance-dns-hijack-01-hijack.jpg)

2022년 8월 9일 오후, Curve의 메인 프론트엔드는 더 이상 Curve의 것이 아니게 되었습니다.

CertiK의 사후 분석은 정확한 타임라인을 밝혔습니다: ["2022년 8월 9일 오후 4시 20분(EST) 경, Curve Finance의 DNS 레코드가 침해되어 악성 복제 사이트를 가리키게 되었습니다."](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) `curve.fi`를 방문하는 누구에게도 이상한 점은 보이지 않았습니다. 페이지는 정상적으로 렌더링되었고, 로고도 있었으며, 풀, 인터페이스, 색상 — 모든 것이 충실하게 재현되어 있었습니다.

차이는 눈에 보이지 않으면서도 완전했습니다. 사용자 브라우저에 로딩된 사이트는 더 이상 Curve가 서비스하는 것이 아니었습니다. 공격자의 인프라 위에 올라간 복제본으로, 누군가 지갑을 연결하기를 기다리고 있었습니다.

보안 연구자 Lefteris Karapetsas는 그 메커니즘을 간결하게 설명했습니다 — 공격자들은 ["사이트를 복제하고, 복제 사이트가 배포된 자신들의 IP를 가리키도록 DNS를 변경했으며, 악성 컨트랙트에 대한 승인 요청을 추가했습니다."](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) Cointelegraph의 이후 해설도 같은 패턴을 묘사했습니다: ["공격자들은 Curve Finance 웹사이트를 복제하고 DNS 설정을 조작해 사용자들을 사이트의 복사본으로 유도했습니다."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

그리고 기다렸습니다.

## 사용자들이 잃은 것

복제 사이트에 접속한 사용자가 사이트를 이용하려고 하면, 페이지는 합법적인 DeFi 사이트에서 하루에도 수천 번씩 하는 일을 지갑에 요청했습니다: 토큰 승인. CertiK에 따르면, ["공격자는 해당 사이트에 악성 코드를 주입해, 사용자들이 미검증 컨트랙트에 토큰 승인을 부여하도록 유도했습니다."](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Coingape는 그 함정을 더 쉽게 설명했습니다: ["해커들은 홈페이지에 악성 컨트랙트를 배포하는 데 성공했으며, 피해자가 이를 승인하면 사용자 지갑이 완전히 비워졌습니다."](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)

토큰 허용량 승인은 일상적인 행동처럼 느껴집니다. 합법적인 거래소에서 스왑할 때와 같은 클릭입니다. 그러나 이번에 승인된 컨트랙트는 공격자의 것이었고, 일단 승인되면 피해자의 스테이블코인을 빼낼 수 있었습니다.

온체인 상의 피해 규모는 구체적이었습니다. CertiK는 ["총 7명의 사용자가 이 익스플로잇에 피해를 입었으며 약 61만 2,000달러의 손실이 발생했다"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)고 보고했으며, 금액 내역은 ["USDC와 DAI 합산 612,724.16달러"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)로 해커가 이후 ETH로 교환했다고 밝혔습니다. rekt.news는 더 많이 인용되는 반올림된 수치를 제시했습니다: ["탈취된 자금은 총 340 ETH, 약 57만 5,000달러."](https://rekt.news/curve-finance-rekt) 당시 대부분의 보도도 비슷한 수치를 보였습니다 — Cryptopotato는 [해커들이 약 57만 달러 상당의 ETH를 탈취했다](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)고 보도했고, CryptoDaily는 [해커가 57만 3,000달러 이상을 탈취했다](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)고 전했습니다. 정확한 총액은 스냅샷 시점과 ETH 가격에 따라 조금씩 다르지만, 전체적인 그림은 동일합니다: 소수의 사용자로부터 빼앗아 간 수십만 달러 규모의 피해.

그리고 여기서 진정으로 되새겨야 할 부분이 있습니다. Tronweekly는 이렇게 정리했습니다: 이 공격은 ["Curve의 이더리움 스마트 컨트랙트나 거기에 보관된 57억 달러의 자산에는 전혀 손을 대지 않았습니다."](https://www.tronweekly.com/curve-finance-dns-hijacking/) 57억 달러의 프로토콜 자산이 완전히 안전했습니다. Curve 자체는, 같은 기사가 주목했듯, ["피해를 입지 않았고 아무런 손실도 없었습니다."](https://www.tronweekly.com/curve-finance-dns-hijacking/) 프로토콜은 승리했습니다. 사용자들이 졌습니다. 공격이 처음부터 프로토콜을 겨냥하지 않았기 때문입니다.

## 어떻게 일어났는가: 체인이 아닌 도메인

![전화 교환원이 빛나는 전화선을 몰래 위조된 동일한 건물로 연결하는 모습, 네온 케이블과 회로, 초현실적 DNS 우회 은유, 브랜드 로고 없음](../../assets/the-curve-finance-dns-hijack-02-dns-compromise.jpg)

그렇다면 공격자는 어떻게 `curve.fi`가 Curve의 서버가 아닌 *자신들의* 서버로 연결되도록 만들었을까요?

DNS가 무엇을 하는지부터 살펴봐야 합니다. `curve.fi`와 같은 도메인 이름은 사람이 이해하기 쉬운 레이블입니다. 컴퓨터는 IP 주소가 필요합니다. [도메인 네임 시스템](/ko/glossary/dns/)은 이 둘을 변환하는 조회 레이어입니다 — Cointelegraph의 해설은 이를 ["전화번호부"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)에 비유하며, ["사용자 친화적인 도메인 이름을 컴퓨터 연결에 필요한 IP 주소로 변환한다"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)고 설명합니다. [DNS 하이재킹](/ko/glossary/dns-hijacking/)이란 이 조회 과정을 조작해 전화번호부가 잘못된 번호를 알려주게 만드는 것 — ["DNS 쿼리가 처리되는 방식을 변경해 사용자 모르게 악성 사이트로 우회시키는 것"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)입니다.

중요한 점은, 사용자의 컴퓨터를 침해할 필요가 없다는 것입니다. 권위 있는 답변의 원천, 즉 도메인이 위임된 **[네임서버](/ko/glossary/nameserver/)**의 답변을 바꾸기만 하면 됩니다. 그리고 그 원천은 도메인의 레지스트라에 있습니다.

Curve의 창립자 Michael Egorov는 문제가 어디에 있었는지를 직접적으로 밝혔습니다. rekt.news에 인용된 내용에 따르면, ["dns 레지스트라 iwantmyname의 ns가 침해되었다"](https://rekt.news/curve-finance-rekt)고 하며, 팀의 판단은 ["Curve는 계정 수준의 취약점이 아니라 기반 네임서버가 침해된 것으로 본다"](https://rekt.news/curve-finance-rekt)는 것이었습니다. 즉, Curve 자신의 레지스트라 계정 비밀번호가 탈취된 것이 아니라 (Curve가 파악한 한에서는), 레지스트라가 직접 운영하는 네임서버 인프라에서 한 단계 더 아래에서 문제가 발생한 것이었습니다. Cointelegraph의 해설은 이후 이 레지스트라를 이름으로 확인하며, 해당 프로젝트가 ["이전 공격 당시에도 동일한 레지스트라인 'iwantmyname'을 사용하고 있었다"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)고 밝혔습니다.

이 구분은 교훈 측면에서 매우 중요합니다. 팀이 강력한 비밀번호를 적용하고, 이중 인증을 활성화하며, 자신의 레지스트라 로그인을 완벽하게 잠가두었더라도 — 그 아래의 네임서버가 침해되면 여전히 도메인을 잃을 수 있습니다. 도메인 소유자가 반드시 실수를 저지른 것이 아닙니다. 그들이 하위 레이어에 둔 신뢰가 단순히 무너진 것입니다. Cointelegraph는 이러한 공격이 작동하는 방식에 대해 이렇게 일반화했습니다: ["사이트 매핑이 탈취된 자격증명이나 레지스트라의 취약점으로 인해 변경되면, 사용자들은 이를 인지하지 못한 채 유해한 서버로 리다이렉트될 수 있습니다."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

네임서버가 공격자의 IP로 응답하기 시작하자, 이후는 자동으로 진행되었습니다. `curve.fi`를 입력하는 모든 사용자는 조용히 복제 사이트로 안내되었습니다. 전화번호부가 수정되었고, 전화번호부를 확인하는 사람은 거의 없었습니다.

## 대응과 사후

Curve 팀은 신속하게 움직였으며, 그 대응 과정은 그들이 할 수 있었던 것과 없었던 것이라는 측면에서 시사하는 바가 큽니다.

즉각적으로 *할 수 있었던* 것은 경고를 알리는 일이었습니다. 팀은 사용자들에게 분명히 전했습니다: ["어떠한 승인이나 스왑도 진행하지 마십시오. 문제를 파악 중이지만, 지금 당장은 안전을 위해 curve.fi나 curve.exchange를 사용하지 마십시오."](https://www.tronweekly.com/curve-finance-dns-hijacking/) 그들은 사용자들을 여전히 정상인 대체 경로로 안내했습니다 — ["https://curve.fi의 전파가 정상으로 돌아올 때까지 지금은 https://curve.exchange를 이용해 주십시오"](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/) — 왜냐하면 `curve.exchange`는 별도 인프라를 사용하고 있어 오염되지 않았기 때문입니다.

즉각적으로 *할 수 없었던* 것은 이미 벌어진 일을 되돌리는 것이었습니다. 그들은 네임서버를 변경했지만, DNS는 즉시 전 세계에 업데이트되지 않습니다. rekt.news가 언급했듯, ["해커의 미러 사이트는 빠르게 내려갔지만, 일부 네임서버는 아직 업데이트되지 않은 상태였습니다."](https://rekt.news/curve-finance-rekt) 수정이 이루어진 이후에도 한동안, 전 세계의 캐시들은 오래된, 악성 응답을 계속 전달했습니다. 이 전파 지연은 DNS의 내재적 특성이자 — 공격자에게 내재적으로 유리한 점입니다.

이미 악성 컨트랙트를 승인한 사용자들에게 유일한 방어는 취소였습니다. 메시지는 어디서나 반복되었습니다: ["지난 몇 시간 내에 Curve에서 컨트랙트를 승인한 경우, 즉시 취소하십시오."](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) rekt.news는 사용자들이 취소해야 할 구체적인 탈취 컨트랙트 주소 `0x9eb5f8e83359bb5013f3d8eee60bdce5654e8881`을 공개하여, 피해자들이 추가 피해 전에 허용량을 차단할 수 있도록 했습니다.

탈취된 자금은 일반적인 세탁 경로를 통해 흩어졌습니다. CertiK는 자금 흐름을 추적했습니다 — ["FixedFloat: 292 ETH, Tornado Cash: 27.7 ETH, Binance: 20 ETH"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) — 그리고 타이밍의 아이러니를 지적했습니다: Tornado Cash가 며칠 전 OFAC에 의해 제재된 상황에서, ["OFAC의 최근 Tornado Cash 제재로 인해 해커는 탈취 자금의 대부분을 FixedFloat으로 보낸 것으로 보인다"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)고 밝혔습니다. 중앙화 거래소였던 이 선택은 도움이 되었습니다: rekt.news는 FixedFloat으로 전송된 자금 중 [112 ETH가 동결되었다](https://rekt.news/curve-finance-rekt)고 보도했습니다. 수시간 내에 Curve는 ["문제가 발견되어 복구되었다"](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)고 확인했습니다.

## DeFi 프론트엔드를 위한 DNS 교훈

Curve 사건은 DeFi의 실제 공격 표면이 어디에 있는지를 압축적으로 보여주는 교훈입니다. Curve를 넘어 폭넓게 적용되는 몇 가지 시사점이 있습니다:

1. **도메인은 보안 경계의 일부입니다.** 도메인을 마케팅 인프라 — 시스템이 아닌 레이블 — 로 취급하고 싶은 유혹이 있습니다. 하지만 도메인은 사용자 브라우저가 따르는 첫 번째 명령입니다. 이것이 잘못되면 하위의 모든 것이 잘못됩니다. 컨트랙트 경계에서 멈추는 감사는 가장 신뢰받는 고리를 무방비 상태로 남깁니다.

2. **레지스트라와 네임서버 보안은 여러분보다 상위에 있습니다.** Curve 자체의 계정 보안 상태는 괜찮았을 수 있지만, 침해는 네임서버 레이어에서 발생한 것으로 판단되었습니다. 여러분은 DNS 체인 내 모든 공급자의 보안 수준을 그대로 물려받습니다. 레지스트라 잠금, 강력한 계정 보호, 이상적으로는 [DNSSEC](/ko/glossary/dnssec/)를 지원하는 레지스트라와 DNS 호스트를 선택하십시오 — 그리고 그렇게 해도 여전히 완전히 통제할 수 없는 레이어를 신뢰하고 있다는 점을 인식해야 합니다.

3. **사용자는 DNS를 볼 수 없습니다.** 복제 사이트는 *이름*이 동일했기 때문에 동일하게 보였습니다. 자물쇠 아이콘은 초록색이었고, URL도 맞았습니다. 주의 깊은 사용자가 일반적으로 확인하는 어떤 것도 문제를 감지하지 못했을 것입니다. 이것이 DNS 하이재킹이 숙련된 사용자에게도 그토록 효과적인 이유입니다 — 속임수는 사람이 확인하는 레이어 아래에서 발생합니다.

4. **깨끗한 대안 경로를 확보하십시오.** Curve의 구원은 별도 인프라의 `curve.exchange`였습니다. 두 번째 프론트엔드 경로 — 다른 도메인, 다른 DNS 공급자, [IPFS](/ko/glossary/ipfs/) 또는 [ENS](/ko/glossary/ens/) 기반 미러 — 는 기본 도메인이 오염되었을 때 사용자를 보낼 곳을 제공합니다.

5. **토큰 승인이 공격의 핵심입니다.** 이 계열의 모든 프론트엔드 공격은 같은 방식으로 끝납니다: 방금 로딩된 페이지에서 적대적인 컨트랙트에 대한 일상적으로 보이는 승인. 지갑, 인터페이스, 사용자 모두 방금 로드된 페이지의 승인 프롬프트를 그것이 실제로 가진 위험한 행동으로 취급해야 합니다.

## Namefi의 관점

![검증 가능하고 변조 방지 가능한 도메인 소유권 — 초록색 방패, 초록색 Namefi 토큰, DNS 연속성으로 보호되는 도메인 카드의 컬러풀한 일러스트레이션](../../assets/the-curve-finance-dns-hijack-03-namefi-angle.jpg)

Curve 하이재킹은 근본적으로 **누가 이름을 통제하는가** 에 관한 질문입니다 — 그리고 그 통제가 얼마나 명확하게 검증되고, 유지되며, 복구될 수 있는가의 문제입니다.

전통적인 모델에서 도메인 통제는 취약한 묶음입니다: 레지스트라 계정, 네임서버 레코드, 그리고 아무런 의문 없이 신뢰해야 하는 공급자 체인. 그 체인의 어느 고리가 침해되면 — iwantmyname 네임서버가 그랬던 것처럼 — 합법적인 소유자는 아무런 실수도 하지 않고도, *무엇이 언제 변경되었는지*에 대한 명확하고 변조 증거가 남는 기록도 없이 자신의 이름에 대한 실효적 통제를 잃을 수 있습니다.

[Namefi](https://namefi.io)는 도메인이 인터넷 네이티브 자산처럼 작동해야 한다는 생각을 중심으로 구축되었습니다 — 소유권과 통제권을 DNS와 호환성을 유지하면서 검증 가능하고, 감사 가능하며, 변조 방지 가능하게 만들 수 있다는 것입니다. Curve의 더 깊은 교훈은 "DeFi는 안전하지 않다"가 아닙니다. **도메인 레이어는 핵심 보안 인프라**라는 것, 그리고 수년간 장식품처럼 취급받아 왔다는 것입니다. DeFi 프로토콜을 운영하든, 온라인 상점을 운영하든, 블로그를 운영하든, 사용자들이 입력하는 이름은 하나의 약속입니다 — 그 약속의 무결성은 그 뒤에 있는 통제 표면만큼만 강합니다.

Curve의 컨트랙트는 57억 달러를 흠집 하나 없이 지켰습니다. 도메인은 오후 한나절 만에 50만 달러를 내어주었습니다. 그 격차가 이 이야기의 전부입니다.

## 출처 및 추가 참고자료

- CertiK — [Curve Finance Hack Incident Analysis](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)
- rekt.news — [Curve Finance — REKT](https://rekt.news/curve-finance-rekt)
- Cointelegraph (via TradingView) — [What is DNS hijacking? How it took down Curve Finance's website](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)
- Cryptopotato — [Curve Finance Issues Warning About Compromised Front End Amid $570K Theft](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)
- Coingape — [Curve Finance DNS Hijacked, Attackers Stole $570K from User Wallets](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)
- Tronweekly — [Curve Finance's Hackers Loot $570K Via DNS Hijacking](https://www.tronweekly.com/curve-finance-dns-hijacking/)
- CryptoDaily — [Curve Finance Asks Users To Revoke Recent Contracts After DNS Hack](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)
