---
title: 'BadgerDAO 프론트엔드 공격: 스크립트 하나로 1억 2천만 달러가 빠져나가다'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 7
format: case-study
description: '2021년 12월, 공격자는 BadgerDAO의 Cloudflare 계정을 탈취하고 웹사이트 프론트엔드에 악성 스크립트 하나를 삽입했습니다. 감사를 통과한 스마트 컨트랙트는 단 한 줄도 건드리지 않았지만, 사용자들이 자신도 모르게 서명한 지갑 승인으로 약 1억 2천만 달러가 빠져나갔습니다. 웹사이트가 보안 영역의 일부인 이유를 심층 분석합니다.'
keywords: ['badgerdao 해킹', 'badgerdao 프론트엔드 공격', 'cloudflare api 키 탈취', '스크립트 삽입 공격', 'web3 프론트엔드 보안', '아이스 피싱', 'increaseAllowance 공격', '토큰 승인 익스플로잇', 'dns 및 도메인 보안', 'cloudflare workers 익스플로잇', 'defi 보안', '웹3 공급망 공격', '웹사이트 변조', '도메인 보안']
relatedArticles:
  - /ko/blog/the-curve-finance-dns-hijack/
  - /ko/blog/the-sushiswap-miso-insider-attack/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ko/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/web3/
  - /ko/glossary/dns/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
---

감사 결과는 이상 없었습니다. 컨트랙트도 완벽했습니다. 그러나 돈은 빠져나갔습니다.

2021년 12월 2일 전후, [DeFi](/ko/glossary/defi/) 프로젝트인 BadgerDAO — 비트코인을 탈중앙화 금융에 연결하기 위해 만들어진 — 는 사용자 자금 약 **1억 2천만 달러**를 잃었습니다. 플래시 론 트릭도, 재진입 버그도, 볼트를 겨냥한 교묘한 수학적 익스플로잇도 없었습니다. [스마트 컨트랙트](/ko/glossary/smart-contract/)는 설계된 대로 정확히 작동했습니다. 공격자는 이를 뚫을 필요가 없었습니다. 공격자는 처음부터 컨트랙트를 공격하지 않았기 때문입니다.

그는 *웹사이트*를 공격했습니다.

누군가가 app.badger.com 프론트엔드에 악성 스크립트를 조용히 심어 놓았습니다. 페이지를 로드한 모든 사용자에게는 매일 사용하던 그 dApp처럼 보였습니다. 그러나 사용자가 상호작용하려는 순간, 페이지는 [지갑](/ko/glossary/wallet/)에 눈에 보이지 않는 추가 권한을 요청했고, "승인"을 클릭하는 순간 토큰은 더 이상 그들의 것이 아니었습니다.

이 사건은 감사를 통과한 컨트랙트를 가진 프로젝트가 단 한 줄의 프론트엔드 코드 삽입으로 어떻게 9자리 달러를 잃었는지, 그리고 이것이 보안 경계에 대한 인식을 영구적으로 바꿔야 하는 이유를 보여줍니다.

## 달콤한 착각: "컨트랙트는 감사받았다"

크립토 문화는 사용자들에게 프로토콜을 신뢰하기 전 한 가지 질문을 하도록 훈련시켰습니다. *감사를 받았는가?* 감사는 중요합니다. 실제 버그를 발견합니다. 그러나 어느 시점부터 "컨트랙트는 감사받았다"는 말이 완전한 안전의 감각으로 굳어졌습니다 — 깨끗한 감사 보고서가 해당 프로젝트 이름이 붙은 모든 것을 보호하는 방패막이인 것처럼.

그렇지 않습니다.

감사는 [온체인](/ko/glossary/on-chain/) 코드를 검토합니다. 볼트, 토큰 로직, 접근 제어. 개발자가 로그인 상태로 두고 간 노트북, 브라우저를 특정 곳으로 안내하는 [DNS](/ko/glossary/dns/) 레코드, 사이트 앞에 위치한 CDN, 혹은 dApp을 방문할 때 브라우저가 실제로 다운로드해 실행하는 JavaScript에 대해서는 아무 말도 하지 않습니다. 이것들은 *Web2* 영역 — 클라우드 계정, API 키, 도메인 인프라 — 에 존재하며, Solidity 코드만큼이나 중요한 기반입니다.

BadgerDAO는 이 격차를 보여주는 가장 명확한 사례입니다. 한 기술 분석 보고서가 직설적으로 표현했듯이: [스마트 컨트랙트의 관점에서는 아무런 문제가 없었고](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=From%20the%20perspective%20of%20the%20project%27s%20smart%20contracts%2C%20nothing%20had%20gone%20wrong), 공격자는 단순히 사용자들이 승인한 권한을 사용하고 있었을 뿐입니다. 체인은 완벽하게 작동했습니다. 웹사이트가 거짓말을 한 것입니다.

## 공격: 깨끗한 영수증을 가진 변조된 상점

![신뢰할 수 있고 친근해 보이는 상점의 금전 등록기가 조용히 변조되어, 고객들이 평소처럼 웃으며 결제하는 동안 숨겨진 서랍이 동전을 빼내고 있는 생생하고 컬러풀한 개념 아트](../../assets/the-badgerdao-frontend-attack-01-attack.jpg)

백 번쯤 방문한 가게에 들어간다고 상상해 보십시오. 같은 간판, 같은 직원, 같은 카운터. 작은 물건을 사고, 계산원이 금액을 입력하고, 카드를 댑니다. 모든 것이 평소와 같아 보입니다. 그러나 보이지 않는 곳에서 누군가가 카드 단말기를 바꿔 놓았습니다 — 낯선 사람이 원할 때 언제든지 계좌에서 두 번째 무제한 청구를 조용히 승인하는 단말기로.

사실상 BadgerDAO 사용자들에게 일어난 일이 바로 이것입니다.

이 사건의 분류는 중요합니다. 왜냐하면 그것이 이 사건을 매우 교훈적으로 만드는 이유이기 때문입니다. *Vice*의 요약에 따르면, 이 해킹은 [복잡한 스마트 컨트랙트 익스플로잇을 사용하지 않았습니다. 대신 BadgerDAO의 웹 인프라를 표적으로 삼은 프론트엔드 공격](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=injected%20a%20malicious%20script%20into%20BadgerDAO%27s%20frontend)이었으며, 특히 Cloudflare 계정을 겨냥했습니다. 그들의 표현을 빌리자면, [Web3](/ko/glossary/web3/) 대상을 겨냥한 *구식* 웹 공격이었습니다.

공격 방식은 우아하고 조용했습니다. 악성 스크립트는 사용자의 지갑에 공격자의 주소로 토큰 지출 권한을 부여하도록 요청했습니다. Vice의 말을 빌리면, [악성 스크립트는 기본적으로 사람들을 속여 해당 주소에 익스플로잇 주소로 토큰을 전송할 권리를 부여하도록 만들었습니다](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=The%20malicious%20script%20basically%20tricked%20people%20into%20giving). 사용자는 평소처럼 dApp을 사용하는 줄 알았습니다. 그들은 자신의 토큰 열쇠를 넘겨주는 서명을 하고 있었던 것입니다.

보안 연구자들은 이 패턴을 *아이스 [피싱](/ko/glossary/phishing/)*이라고 부릅니다. [개인 키](/ko/glossary/private-key/)를 훔치는 대신, 사용자를 속여 자발적으로 악성 지출자를 승인하게 만드는 방식입니다. 서명은 진짜입니다. 승인도 진짜입니다. 온체인 트랜잭션도 유효합니다. 바로 이 점 때문에 너무나 위험한 것입니다 — 그리고 어떤 컨트랙트 감사로도 이를 막을 수 없었던 이유입니다.

## 피해 규모: 서명 한 번에 약 1억 2천만 달러

볼트 코드 한 줄 건드리지 않은 공격치고는 그 피해 규모가 충격적입니다.

스마트 컨트랙트 감사 회사 PeckShield는 [총 손실이 약 1억 2천만 달러에 달한다고 추산했습니다](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). BadgerDAO 자체 사후 분석 보고서는 모든 피해 자산을 공통 단위로 환산했을 때 [약 2,076.54 BTC(당시 약 1억 1,630만 달러)](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=2076.54%20BTC)의 손실이 발생했다고 밝혔습니다.

피해는 균등하게 분산되지 않았습니다. 단일 피해자 — 기관 계정으로 알려진 — 가 단 한 건의 트랜잭션으로 대부분을 잃었습니다. 사례 연구에 따르면 [Yearn wBTC 볼트에서 약 900 BTC가 인출되었으며](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php), 한 당사자만 [5천만 달러 상당의 래핑된 비트코인을 잃었습니다](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=lose%20over%20%2450%20million). 나머지는 수백 명의 일반 사용자들로 구성됩니다.

이 규모는 공격자의 인내심에서 비롯된 직접적인 결과였습니다. 공격자는 허둥지둥 공격하지 않았습니다. Forta의 분석에 따르면, [해커는 거의 200개 계정으로부터 조용히 승인을 축적했고, 2021년 12월 2일 오전 12시 48분에 10시간도 안 되어 피해자의 지갑을 비웠습니다](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack#:~:text=The%20hacker%20silently%20accumulated%20approvals%20from%20almost%20200%20accounts). 악성 승인은 며칠에 걸쳐 조용히 쌓였고 — 준비된 함정이 한꺼번에 터진 것입니다. 또 다른 분석에 따르면 공격 기간 동안 [500개 지갑이 무제한 승인을 부여했습니다](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=The%20attacker%20managed%20to%20get%20500%20wallets).

가장 잔인한 세부 사항: 주의 깊은 사용자라도 이를 확인할 방법이 없었습니다. URL은 정확했습니다. TLS 인증서도 유효했습니다. 인터페이스도 진짜였습니다. 문제가 된 것은 합법적인 사이트 자체가 제공하는 JavaScript 조각뿐이었습니다.

## 사건 경위: Cloudflare API 키와 삽입된 승인

![실제 인터페이스가 차분하고 신뢰할 수 있어 보이는 동안, 보이지 않는 손이 지갑 팝업에 추가로 빛나는 "승인" 버튼을 조용히 추가하고, 악성 코드 한 줄이 친근한 웹 페이지 속으로 슬그머니 들어가는 생생하고 컬러풀한 개념 아트](../../assets/the-badgerdao-frontend-attack-02-injected-script.jpg)

공격자가 이용한 입구는 스마트 컨트랙트가 아니었습니다. 클라우드 계정이었습니다.

BadgerDAO는 현대 웹의 상당 부분과 마찬가지로 Cloudflare — 웹사이트를 제공하고 가속하는 콘텐츠 전달 및 엣지 컴퓨팅 레이어 — 뒤에 있었습니다. 그 계정을 제어한다는 것은 BadgerDAO 웹사이트가 방문자에게 어떤 코드를 전달하는지 제어할 수 있다는 의미였습니다. 그리고 공격자는 탈취한 키를 통해 그 제어권을 얻었습니다.

CoinDesk가 전달한 BadgerDAO의 공식 설명에 따르면, [해커는 Badger 엔지니어의 지식이나 승인 없이 생성된 탈취된 API 키를 사용해 주기적으로 악성 코드를 주입했으며, 이는 일부 고객들에게 영향을 미쳤습니다](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m). "일부 고객들"이라는 표현 — 이것이 악성 행위가 오랫동안 숨겨져 있었던 이유 중 하나입니다. 스크립트는 모든 사람에게, 매번 실행되지 않았습니다. 간헐적으로 작동하며 일부 사용자에게만 영향을 미쳐 악성 동작을 재현하거나 알아차리기가 극도로 어려웠습니다.

어떻게 무단 API 키가 존재하게 되었을까요? 근본 원인은 Cloudflare 계정 결함으로 거슬러 올라갑니다. 사건 사례 연구에 따르면, 무단 사용자들이 계정을 생성하고 [이메일 인증이 완료되기 전에](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=before%20email%20verification%20was%20completed) (삭제하거나 비활성화할 수 없는) 전역 API 키를 생성하고 열람할 수 있었습니다. 공격자는 계정에 키를 심어 놓고, 실제 소유자가 인증을 완료하고 계정을 활성화할 때까지 기다릴 수 있었습니다 — 그 시점에 공격자는 유효한 API 접근 권한을 조용히 보유하게 됩니다.

그 키를 이용해 공격자는 Cloudflare Workers — Cloudflare의 엣지 컴퓨팅 플랫폼 — 를 사용해 페이지가 사용자에게 전달되는 과정에서 내용을 재작성했습니다. 사이버 보안 회사 Mandiant와 함께 준비한 BadgerDAO의 사후 분석 보고서는 12월 2일 피싱 사건이 Cloudflare Workers가 제공한 악성 삽입 코드의 결과라고 결론지었습니다. 삽입된 코드가 실질적으로 한 일은 단 하나였습니다. dApp의 일반적인 흐름 안에 추가적인 토큰 승인 요청을 끼워 넣은 것입니다.

*어떤* 승인 호출을 사용했는지에도 의도적인 기술이 담겨 있었습니다. CryptoBriefing은 [해커가 Badger 웹사이트에 악성 스크립트를 삽입해 사용자들에게 "increaseAllowance" 트랜잭션을 제시했다고 전했습니다](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/#:~:text=presented%20users%20with%20a%20transaction%20to). 이 선택은 우연이 아니었습니다. 단순한 `approve` 호출과 비교했을 때, `increaseAllowance` 프롬프트는 지갑 팝업에서 덜 눈에 띄고 덜 경각심을 주는 시각적 신호로 표시되는 경향이 있습니다 — 더 적은 경고 신호, "지출 권한을 부여하려 합니다"라는 경고가 덜 강조됩니다. 공격자는 *사용자 경험*까지 최적화하여 털어갔습니다.

전체 과정을 정리하면 이렇습니다. Cloudflare 계정 인증 취약점으로 무단 API 키 존재 가능 → 공격자가 그 키로 Worker 배포 → Worker가 app.badger.com에 스크립트 삽입 → 스크립트가 지갑에 공격자에게 토큰 권한 부여 요청 → 사용자 승인 → 공격자가 자금 인출. 이 중 감사받은 컨트랙트를 건드린 단계는 단 하나도 없습니다.

## 대응: Web2 상처를 막기 위한 체인 일시 정지

12월 2일 이른 시간 대규모 인출 트랜잭션이 발생하자 온체인 흔적이 더 이상 무시할 수 없는 수준이 되었고, BadgerDAO는 빠르게 움직였습니다 — 완전히 오프체인에서 발생한 문제를 막기 위해 스마트 컨트랙트를 사용하는 방식으로.

팀은 공개적으로 사건을 인정했고, CryptoBriefing에 따르면 [추가 인출을 막기 위해 모든 스마트 컨트랙트가 일시 중지되었음을 확인했습니다](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). Badger의 볼트에는 일시 중지 기능이 있었기 때문에, 전송을 동결함으로써 공격자가 새로 승인된 자금을 계속 이동시키는 것을 차단했습니다. 한 기술 분석 보고서는 이 중단을 팀이 `transferFrom` 함수에 대한 모든 호출을 동결하는 권한을 행사한 것으로 설명합니다 — 악성 승인이 악용하던 바로 그 [ERC-20](/ko/glossary/erc-20/) 메커니즘입니다. 또한 이 일시 중지 덕분에 손실의 일부는 이론적으로 회수 가능했습니다. 일부 자산은 공격자가 이동시켰지만 동결이 이루어지기 전에 Badger 볼트에서 완전히 출금되지 않은 상태였기 때문입니다.

인프라 측면에서는 자격증명 침해의 전형적인 Web2 수습 절차가 진행되었습니다. Cloudflare API 키 교체, 계정 비밀번호 변경, 다단계 인증 강화, 그리고 존재하지 않아야 할 모든 키의 감사. BadgerDAO는 이후 Mandiant와 협력해 사건의 타임라인을 재구성한 기술적 사후 분석 보고서를 작성하고 공개했습니다 — Cloudflare 계정 취약점, 이전 몇 달간 생성된 무단 키, 11월의 스크립트 삽입, 12월의 자금 인출 등을 포함하여.

그러나 어떤 사후 대응도 사용자들이 이미 부여한 승인을 되돌릴 수는 없었습니다. 서명은 유효했습니다. 사후 조치는 *미래의* 도난을 막고 회수를 추진할 수 있었지만, 온체인에서 이미 이루어진 동의를 되돌릴 수는 없었습니다.

## 이 사건이 가르치는 것: 웹사이트는 보안 영역의 일부입니다

BadgerDAO에서 얻을 수 있는 가장 중요한 교훈은 경계의 재정립입니다. 대부분의 팀과 사용자들은 보안 경계를 스마트 컨트랙트 주변에 그립니다. BadgerDAO는 그 경계가 훨씬 더 넓다는 것을 증명합니다.

**1. 프론트엔드는 항상 보안 범위에 포함됩니다.** 사용자의 브라우저가 실행하는 코드는 온체인에 있든 없든 프로토콜의 일부입니다. 공격자가 사이트가 제공하는 JavaScript를 제어할 수 있다면, 감사받은 컨트랙트와 무관하게 사용자의 지갑을 제어할 수 있습니다. 사이트는 "단순한 UI"가 아닙니다. 동의가 포착되는 곳입니다.

**2. 클라우드 및 도메인 인프라도 컨트랙트의 일부입니다.** Cloudflare 계정, DNS 공급자 로그인, [레지스트라](/ko/glossary/registrar/) 계정, CI/CD 키 — 이 모두가 사용자에게 보이는 것을 재작성하는 경로입니다. BadgerDAO는 볼트에서 침해당하지 않았습니다. *웹사이트를 제어하는 계정*에서 침해당했습니다. 해당 자격증명을 배포자 개인 키만큼이나 철저하게 관리하십시오.

**3. API 키와 계정 생성 흐름은 실제 공격 표면입니다.** 이 재앙 전체는 존재해서는 안 될 무단 API 키에서 비롯되었으며, 인증 격차로 인해 가능했습니다. 모든 키를 목록화하십시오. 범위를 엄격히 제한하십시오. 정기적으로 교체하십시오. 새 키 생성 시 알림을 받으십시오. 잊혀진 키는 공격자가 사용할 수 있는 키입니다.

**4. "감사 완료"는 필요조건이지 충분조건이 아닙니다.** 깨끗한 감사는 실질적인 가치가 있으며 여전히 받아야 합니다. 그러나 그것은 컨트랙트를 다룰 뿐, 클라우드 계정, DNS, CDN, 혹은 프론트엔드 빌드 파이프라인을 다루지는 않습니다. 보안은 사용자 브라우저에서 체인까지의 전체 경로입니다 — 가장 강한 고리가 아닌 가장 약한 고리가 기준을 결정합니다.

**5. 사용자는 변조된 프론트엔드를 스스로 검사해서 피할 수 없습니다.** "항상 URL을 확인하라"는 조언은 이 경우 아무 소용이 없었을 것입니다. URL은 맞았습니다. 사용자에 대한 교훈은 더 어렵습니다. 승인과 `increaseAllowance` 프롬프트를 극도로 의심하고, 토큰 승인을 해독하고 경고해 주는 지갑과 도구를 선호하며, 오래된 권한은 정기적으로 취소하십시오. 어느 페이지에 있는지보다 무엇을 승인하고 있는지가 더 중요합니다.

## Namefi의 관점

![검증 가능하고 변조 방지된 도메인 및 웹 소유권의 컬러풀한 일러스트 — 초록색 방패, 초록색 Namefi 토큰, DNS 연속성으로 보호됨](../../assets/the-badgerdao-frontend-attack-03-namefi-angle.jpg)

BadgerDAO의 본질을 파고들면 이것은 **소유권과 제어** 문제입니다. 공격자는 BadgerDAO의 웹사이트를 소유하지 않았습니다 — 그러나 몇 주 동안 그것이 제공하는 것을 바꿀 수 있었습니다. 실제로 프로젝트를 *소유한* 사람들은 계정, 키, 엣지 설정, DNS에 이르는 웹 존재의 제어 체계가 조용히 침해당했다는 것을 신뢰할 수 있는 방식으로 알아낼 방법이 없었습니다.

이것이 [Namefi](https://namefi.io)가 주목하는 격차입니다. Namefi는 도메인과 웹 소유권을 DNS와의 호환성을 유지하면서, 검증 가능하고 감사 가능하며 조용한 탈취가 더 어려운 일급 인터넷 네이티브 자산으로 취급합니다. 프론트엔드 공격 표면 — 누가 이름을 제어하는지, 어디로 해석되는지, 그 뒤에 어떤 인프라가 있는지 — 은 스마트 컨트랙트에 대한 사후 고려 사항이 아닙니다. BadgerDAO가 가장 비싼 방식으로 보여주었듯이, 이것은 보안 모델의 *일부*입니다.

컨트랙트를 완벽해질 때까지 감사할 수 있습니다. 그러나 무단 키가 웹사이트를 재작성하고 삽입된 스크립트가 사용자의 승인을 수집할 수 있다면, 감사는 결코 전체 이야기가 아니었습니다. 도메인, DNS, 그리고 실제 사용자에게 애플리케이션을 전달하는 웹 인프라는 보안 영역의 일부입니다. 그렇게 취급하십시오 — 공격자들은 이미 그렇게 하고 있기 때문입니다.

## 출처 및 추가 읽기

- CoinDesk — [BadgerDAO Reveals Details of How It Was Hacked for $120M](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)
- Vice (Motherboard) — [Hackers Steal $119M From 'Web3' Crypto Project With Old School Attack](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/)
- Halborn — [Explained: The BadgerDAO Hack (December 2021)](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021)
- Forta — [How to Derail a 120-Million-Dollar Hack](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack)
- CryptoBriefing — [$120M Lost in BadgerDAO DeFi Hack](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)
- Quadriga Initiative — [Dec 2021 — BadgerDAO Malicious Code Injected — $116.3m](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)
- Chainalysis — [Behind The Scenes of The BadgerDAO Hack](https://www.chainalysis.com/blog/chainalysis-podcast-episode-6-badgerdao-hack/)
- BadgerDAO / Mandiant — [BadgerDAO Exploit Technical Post Mortem](https://www.badger.tools/technical-post-mortem)
