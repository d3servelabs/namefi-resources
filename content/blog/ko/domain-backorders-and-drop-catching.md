---
title: '도메인 백오더와 드롭 캐칭, 완벽 해설'
date: '2026-06-21'
language: ko
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 4
format: explainer
description: '도메인 백오더와 드롭 캐칭이란 무엇인지, 서비스들이 도메인이 풀리는 순간 어떻게 경쟁하는지, 그리고 백오더 비용을 지불할 가치가 있는 경우는 언제인지 설명합니다.'
ogImage: ../../assets/domain-backorders-and-drop-catching-og.jpg
keywords: ['도메인 백오더', '드롭 캐칭', '도메인 백오더 방법', '만료 도메인 잡기', 'DropCatch', 'SnapNames', 'NameJet', 'Park.io', 'Dynadot 백오더', '도메인 드롭 캐칭 서비스', '구제 유예 기간', '삭제 대기 도메인', '도메인이 드롭되는 시점', '만료 도메인 경매', '등록된 도메인 획득 방법']
relatedArticles:
  - /ko/blog/expired-domains-and-the-drop-cycle/
  - /ko/blog/how-to-win-domain-auctions/
  - /ko/blog/when-to-drop-a-domain/
  - /ko/blog/domain-flipping/
  - /ko/blog/hand-registering-domains-to-flip/
relatedTopics:
  - /ko/topics/domain-investing/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/tokenize-your-com/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/dns/
  - /ko/glossary/registry/
---

원하는 도메인이 이미 다른 사람의 소유입니다. 현재 소유자는 팔 생각도 없고, 연락도 닿지 않으며, 심지어 사용조차 하지 않는 것 같습니다. 그렇다면 남은 선택지는 하나뿐입니다. 그들이 갱신을 잊기를 기다리는 것입니다. 등록이 만료되어 도메인이 오픈 풀로 돌아오는 바로 그 순간, 여러분이 그 자리에 있어야 합니다.

이것이 바로 백오더와 [드롭 캐칭](/ko/glossary/backorder/)의 본질입니다. 두 가지 모두 지금 당장은 살 수 없는 도메인에 베팅하는 방법으로, 도메인이 자유 상태가 되는 순간 즉시 등록할 기회를 노리는 것입니다. 두 방법은 같지 않으며, 그 차이는 중요합니다. 그리고 대부분의 경우 "비용을 지불할 가치가 있는가?"라는 질문에 대한 솔직한 답은 '아니오'입니다. 이 글에서는 각각이 무엇인지, 도메인이 풀리는 순간 어떤 경쟁이 벌어지는지, 주요 서비스는 어디인지, 그리고 백오더에 돈을 쓸 가치가 있는 한정적인 경우를 설명합니다. 이 글은 [도메인 플리핑 스킬 시리즈](/ko/blog/domain-flipping/)의 일부로, [플리핑할 도메인 찾기](/ko/blog/how-to-find-domains-to-flip/) 기본 가이드와 함께 읽으시면 좋습니다.

## 먼저, 도메인이 '드롭'되는 이유

![도메인 이름이 유예 기간 단계들을 거쳐 오픈 풀로 떨어지는 타임라인을 나타낸 에디토리얼 일러스트레이션](../../assets/domain-backorders-and-drop-catching-01-drop-cycle.jpg)

도메인이 만료되어도 바로 일반 등록 대상으로 돌아오지는 않습니다. 레지스트리, 등록기관, 확장자에 따라 절차가 다릅니다. 일부 도메인은 공개 삭제 전에 만료 경매로 넘어갑니다.

적용 대상 gTLD에 대해 [ICANN 정책](https://www.icann.org/en/contracted-parties/consensus-policies/expired-registration-recovery-policy/expired-registration-recovery-policy-21-02-2024-en)은 삭제 후 30일의 복구 유예 기간을 요구합니다. 후원형 gTLD 레지스트리는 해당 요건에서 제외합니다. 기존 등록자는 삭제를 수행한 등록기관에 복구를 요청할 수 있습니다. 등록기관은 복구 요금을 공개해야 합니다. 국가 코드 도메인은 다른 규칙을 적용할 수 있습니다.

복구하지 않으면 도메인이 최종 삭제 대기 단계로 넘어갈 수 있습니다. [ICANN 상태 설명](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)에 따르면 레지스트리는 최종 `pendingDelete` 상태에서 달력 기준 5일이 지난 뒤 도메인을 삭제합니다. 이후 일반 등록이 가능합니다. 만료일만으로 공개 시점을 확정할 수는 없습니다.

## 드롭 캐칭: 밀리초를 제패하는 싸움

![여러 서버 팔들이 도메인 이름 태그 하나를 풀리는 순간 잡으려고 경쟁하는 장면을 초 단위 스톱워치와 함께 나타낸 에디토리얼 일러스트레이션](../../assets/domain-backorders-and-drop-catching-02-millisecond-race.jpg)

드롭 캐칭은 무력(brute-force) 방식입니다. 여러분이 직접, 혹은 현실적으로는 대행 서비스가, 도메인이 삭제되는 바로 그 순간에 등록을 시도하는 것입니다. Wikipedia의 정의는 간명합니다. 드롭 캐칭, 즉 도메인 스나이핑이란 [등록이 만료된 직후, 만료 즉시 도메인 이름을 등록하는 행위](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)입니다.

손으로 직접 할 수는 없습니다. 좋은 도메인은 예측 가능한 일정에 따라 삭제되고, 수많은 전문 서비스들이 같은 순간 레지스트리를 두드립니다. 도메인 투기 관련 문헌에 따르면, [레지스트리가 삭제하는 도메인 이름을 등록하는 사업은 드롭 캐칭으로 알려져 있으며, 매우 경쟁이 치열한 비즈니스입니다](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=The%20business%20of%20registering%20the%20domain%20names%20as%20they%20are%20deleted%20by%20the%20registries%20is%20known%20as%20drop%20catching.%20It%20is%20a%20highly%20competitive%20business). 경쟁은 극도로 빠르게 진행됩니다. [드롭과 캡처 사이의 시간은 종종 초 또는 그 분수 단위로 측정됩니다](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=The%20time%20between%20a%20drop%20and%20a%20capture%20is%20often%20measured%20in%20seconds%20or%20fractions%20thereof).

경매가 최종 가격을 결정할 수 있습니다. [NameJet](https://www.namejet.com/userguide.action)과 [SnapNames](https://www.snapnames.com/userguide.action) 안내는 사전 주문이 없는 사람도 참여하는 공개 경매 가능성을 명시합니다. 실제 매물을 확인하세요. 백오더만으로 입찰자 범위를 제한할 수는 없습니다.

## 백오더는 도메인 취득 시도를 요청합니다

![취득 경로, 경매 규칙, 예산을 보여 주는 주문 전 확인표](../../assets/domain-backorders-and-drop-catching-04-order-checks.jpg)

백오더는 서비스에 도메인 취득 시도를 요청하는 주문입니다. 공개 삭제에서는 해당 서비스도 다른 등록 시스템과 경쟁합니다. 백오더는 다른 업체에 대한 공통 우선권을 부여하지 않습니다. 선결제, 결제 승인, 입찰 의무는 플랫폼별 규칙을 따릅니다.

[Dynadot](https://www.dynadot.com/help/question/place-a-backorder)은 취득 성공을 보장하지 않습니다. 여러 요청이 들어오면 경매가 열릴 수 있습니다. [NameJet](https://www.namejet.com/userguide.action)은 제휴 등록기관의 만료 재고와 공개 삭제 대기 재고를 구분합니다. 독립적인 서비스는 공개 등록 대상으로 나오지 않은 도메인을 새로 등록할 수 없습니다.

## 대신 경쟁해 주는 서비스들

대부분의 플리퍼들은 소수의 플랫폼을 통해 드롭 캐칭에 참여합니다. 이 서비스들은 서로 겹치기도 하고 확장자별로 전문화되어 있으며, 적합한 서비스는 도메인이 등록된 레지스트라와 [TLD](/ko/glossary/tld/)에 따라 다릅니다.

- **DropCatch**는 [`.com`](/ko/tld/com/)을 비롯한 레거시 gTLD에서 가장 잘 알려진 순수 드롭 캐칭 플랫폼입니다. 삭제 대기 중인 도메인에 백오더를 걸면 서비스가 레지스트라 플릿을 총동원해 삭제 순간에 도전합니다. 여러 사용자가 같은 도메인에 백오더를 걸었다면 경매로 결정됩니다. 공개 삭제를 대규모로 캐치하는 기본 선택지입니다.
- **SnapNames**와 **NameJet**은 대표적인 만료 경매 중개 플랫폼으로, 위에서 언급한 [Snapnames and Namejet](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=instead%20introducing%20an%20intermediary%20%28e.g.%2C%20Snapnames%20and%20Namejet%29)입니다. 파트너 레지스트라가 만료 재고를 먼저 이곳으로 라우팅하기 때문에 공개적으로 드롭되지 않는 도메인을 다루는 데 강합니다. 원하는 도메인이 파트너 레지스트라에 있다면 여기서 거래됩니다.
- **Dynadot**은 백오더 및 만료 경매 서비스를 함께 운영하는 정식 레지스트라로, 일반 등록과 같은 곳에서 캐치 예약을 할 수 있습니다. 참고로 Wikipedia는 Dynadot을 [소프트웨어 엔지니어 Todd Han이 2002년에 설립한 ICANN 인증 도메인 레지스트라 겸 웹 호스팅 회사](https://en.wikipedia.org/wiki/Dynadot#:~:text=is%20an%20ICANN%2Daccredited%20domain%20registrar%20and%20web%20host%20company%20founded%20by%20software%20engineer%20Todd%20Han%20in%202002)로 소개합니다.
- **Park.io**는 신규 및 국가 코드 확장자(ccTLD) 캐칭으로 명성을 쌓은 서비스입니다. 범용 캐처의 커버리지가 얇은 덜 대중적인 TLD를 노린다면, 전문 서비스가 유일한 현실적 선택지인 경우가 많습니다.

주문 전에 취득 경로와 결제 의무를 확인하세요. 공개 삭제에서는 여러 독립 서비스가 더 많은 등록 시스템을 제공할 수 있습니다. 독점 재고는 해당 매물을 관리하는 플랫폼을 이용해야 합니다. 여러 서비스에 주문한다고 반드시 비용을 낭비하는 것은 아닙니다.

## 백오더 비용을 지불할 가치가 있는 경우

백오더는 비용이 저렴해 과도하게 신청하기 쉬우며, 바로 이것이 함정입니다. 솔직한 판단 기준을 소개합니다.

**도메인이 진정으로 희귀하고 구체적인 용도가 있을 때 비용을 지불하십시오.** 깔끔한 단어 하나짜리 `.com`, 짧은 브랜더블 도메인, 또는 실제로 개발 중인 프로젝트의 정확한 매칭 도메인은 백오더 수수료와 어느 정도의 경매 예산을 쏟을 가치가 있습니다. 공개적으로 드롭되면 경쟁이 붙고, 캐처 없이는 놓칠 것이기 때문입니다. 실제로 검증 가능한 역사가 있는 노령 도메인, 즉 이전 후에도 살아 있는 기존 백링크나 트래픽이 있는 경우도 마찬가지입니다. 이는 [플리핑을 위한 신규 도메인 직접 등록](/ko/blog/hand-registering-domains-to-flip/)과는 다른 소싱 채널입니다.

**도메인이 실제로 희귀하지 않다면 건너뛰십시오.** 거의 동일한 문자열을 지금 당장 일반 등록 비용으로 직접 등록할 수 있다면, 만료 버전에 백오더 수수료를 내고 경매까지 감수하는 것은 대개 나쁜 거래입니다. 드롭이 의미를 갖는 것은 오직 *특정* 도메인 자체가 자산이고 대체제가 없을 때입니다.

**질 수도 있다고 가정하고, 그에 맞게 예산을 책정하십시오.** 백오더는 시도이지, 구매가 아닙니다. 인기 있는 도메인이라면 캐치 후 경매에서 더 높은 입찰자에게 질 수도 있고, 더 강력한 화력의 서비스에 캐치를 빼앗길 수도 있습니다. 수수료는 확률이 나쁘지 않은 복권 비용으로 생각하십시오. 이미 소유한 도메인의 계약금이 아닙니다.

**상표 경계를 주시하십시오.** 만료된 도메인을 캐치해도 그 도메인의 역사가 세탁되지는 않습니다. 해당 문자열이 누군가의 브랜드라면, 등록이 만료됐다는 사실이 그것을 안전하게 잡아 재판매할 수 있다는 의미는 아닙니다. [UDRP](/ko/glossary/udrp/) 체계는 여전히 적용되며, 만료된 [상표](/ko/glossary/trademark/) 도메인은 분쟁을 유발하는 전형적인 사례입니다. 이 내용은 [UDRP란 무엇인가](/ko/blog/what-is-udrp/)에서 다루고 있습니다. 일반적이고 브랜더블한 도메인을 노리되, 만료된 브랜드는 피하십시오.

캐치된 도메인에만 해당하는 추가 실사 사항이 있습니다. [만료 도메인](/ko/blog/buy-expired-domains/)은 신규 등록에는 없는 부담을 안고 있을 수 있습니다. 스팸 이력이나 Google 패널티 같은 것들입니다. 높은 금액으로 입찰하기 전에 [WHOIS](/ko/glossary/whois/)와 아카이브 기록에서 과거를 확인하십시오. 도메인의 역사는 도메인과 함께 이전됩니다.

## 캐치 후: 실제 소유하기

캐치에 성공하는 것은 끝이 아니라 시작입니다. 도메인은 캐치한 레지스트라의 계정에 들어오며, 이를 깔끔하고 판매 가능한 자산으로 만들려면 진정한 [통제권](/ko/glossary/domain-ownership/)을 확보해야 합니다. [인증 코드(auth code)](/ko/glossary/auth-code/), 홈 레지스트라로의 [크로스 레지스트라 이전](/ko/glossary/cross-registrar-transfer/) 권한, 그리고 [WHOIS](/ko/glossary/whois/)와 DNS가 본인 것임을 확인하는 것입니다. 이 인계 과정이 고가 도메인에서 가장 긴장되는 부분입니다. 모든 [도메인 거래](/ko/glossary/domain-trading/)를 따라다니는 교착 상태 때문입니다. 누구도 먼저 움직이려 하지 않습니다.

[Namefi](https://namefi.io)는 바로 이 마찰을 줄이기 위해 만들어졌습니다. 토큰화된 소유권은 실제 [ICANN](/ko/glossary/icann/) 도메인의 통제권을 더 쉽게 검증하고 이전할 수 있게 하며, DNS 연속성 덕분에 캐치된 도메인이 인계 과정에서도 지속적으로 정상 작동합니다. 재판매 시의 표준 절차, 즉 등록, 가격 책정, 중립적인 [에스크로](/ko/glossary/escrow/) 인계는 [소유한 도메인 이름 판매 방법](/ko/blog/how-to-sell-a-domain-name-you-own/)과 [도메인 에스크로 해설](/ko/blog/domain-escrow-explained/)에서 다루고 있습니다.

## 요약

백오더는 취득 시도를 요청하는 주문입니다. 성공이나 모든 서비스에 대한 우선권을 보장하지 않습니다. 취득 경로, 경매 규칙, 총예산을 확인하세요. 배정 완료와 계정 접근을 확인한 뒤 취득 성공을 판단하세요.

## 친절한 면책 고지 (꼭 읽어주세요!)

> 저희는 변호사, 회계사, 재무 어드바이저, 의사가 아니며, **이 글의 어떤 내용도 법률, 재무, 세금, 회계, 의료 또는 그 밖의 전문적인 조언이 아닙니다.** 이 글은 스스로 배우고 고객 여러분의 편의를 위해 작성한 것입니다. 내용이 오래됐거나, 지역에 따라 다르거나, 단순히 틀릴 수도 있습니다. 저희도 실수를 합니다.
>
> 중요한 결정을 내리기 전에 **반드시 전문가와 상담하십시오(진심으로!)**. 또는 그것이 맞지 않는다면, 친구에게 물어보거나 Twitter, Reddit, AI, 혹은 점쟁이에게 물어보세요. 한마디로: **DOYR - 직접 연구하세요(Do Your Own Research)**. 함께 배우고 즐겨봅시다.

## 다음 자료에서 주문 규칙을 확인할 수 있습니다

자료 확인일: 2026년 10월 21일.

- [ICANN](https://www.icann.org/en/contracted-parties/consensus-policies/expired-registration-recovery-policy/expired-registration-recovery-policy-21-02-2024-en)
- [ICANN EPP](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)
- [Dynadot](https://www.dynadot.com/help/question/place-a-backorder)
- [NameJet](https://www.namejet.com/userguide.action)
- [SnapNames](https://www.snapnames.com/userguide.action)
