---
title: "만료 도메인과 드롭 사이클 완벽 해설"
date: '2026-06-21'
language: ko
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 3
format: explainer
description: "등록기관의 갱신 기한과 레지스트리의 삭제 절차를 구분한다. 복구 기간, 삭제 대기, 만료 경매와 드롭캐칭의 차이를 설명한다."
ogImage: ../../assets/expired-domains-and-the-drop-cycle-og.jpg
keywords: ['만료 도메인', '도메인 드롭 사이클', '도메인 수명 주기', '복구 유예 기간', '삭제 대기', '도메인 드롭 캐칭', '만료 도메인 이름', '도메인 만료 방식', '드롭된 도메인', '도메인 스나이핑', '만료 도메인 구매', '도메인 복구 기간', '도메인 드롭 시점', '도메인 백오더', '플립용 도메인 찾기']
relatedArticles:
  - /ko/blog/domain-backorders-and-drop-catching/
  - /ko/blog/domain-flipping/
  - /ko/blog/how-to-win-domain-auctions/
  - /ko/blog/hand-registering-domains-to-flip/
  - /ko/blog/when-to-drop-a-domain/
relatedTopics:
  - /ko/topics/domain-investing/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/dns/
  - /ko/glossary/registry/
---

만료된 도메인을 즉시 등록할 수 있는 것은 아니다. 등록기관은 고객의 갱신 기한과 경매 절차를 관리한다. 레지스트리는 삭제와 공개를 관리한다. 이 글은 일반적인 `.com` 등록을 예로 설명한다. 국가 코드 도메인과 후원형 도메인은 다른 규칙을 따를 수 있다.

플리퍼들이 이 시장 영역에 주목하는 이유는 드롭된 도메인이 백지 상태가 아니기 때문입니다. 어떤 도메인이 드롭 단계에 이른다는 것은, 누군가 등록하여 사용하다 포기했다는 의미이므로, 연령, 인바운드 링크, 잔여 트래픽, 또는 직접 등록하려 했을 때 이미 사용 중이었던 문자열을 보유하고 있을 수 있습니다. 드롭 사이클은 이미 누군가의 필요를 증명한 도메인들의 재활용 흐름입니다. 이는 완전히 새로운 문자열과는 다른 리스크 프로파일을 가지며, [플립용 도메인 찾는 법](/ko/blog/how-to-find-domains-to-flip/)에서 설명하는 공급 채널 중 하나입니다. 이 해설서는 라이프사이클을 단계별로 설명하고, 드롭된 도메인이 어디서 나타나는지와 플리퍼들이 어떻게 포지셔닝하는지를 다룹니다.

## 1단계: 활성 등록 및 갱신 창

레지스트리는 고객이 요금을 내지 않아도 `.com` 등록을 자동 갱신할 수 있다. 45일 자동 갱신 유예 기간은 레지스트리와 등록기관 사이의 요금 정산 기간이다. 등록기관이 기간 안에 삭제하면 해당 요금의 공제를 받을 수 있다. 고객에게 45일의 갱신 권리를 보장하는 제도가 아니다. 만료일이 연장되어도 고객의 결제를 증명하지 않는다. [현행 계약 부록 7의 3.1.3절](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm)을 확인하자. [ICANN 현행 정책 2.2절](https://www.icann.org/resources/pages/errp-2024-02-21-en)은 관련 규칙에 따른 만료 등록의 삭제를 허용한다.

## 2단계: 복구 유예 기간

![도메인 이름 태그가 카운트다운 다이얼 안의 모래시계에 매달려 있고, 시간이 다하기 전에 복구 수수료를 지불하려는 손이 동전을 내밀고 있는 편집 삽화](../../assets/expired-domains-and-the-drop-cycle-01-redemption.jpg)

일반적인 `.com` 등록을 신규 등록 유예 기간 밖에서 삭제하면 30일의 `redemptionPeriod`가 시작된다. 만료일 자체가 복구 기간을 시작하지는 않는다. 기존 등록자는 삭제한 등록기관에 복구를 요청해야 한다. 레지스트리는 DNS 확인을 중단한다. ICANN은 비후원형 gTLD에 30일을 요구하지만 신규 등록 유예 기간의 삭제는 예외다. 복구 요금은 일률적으로 100달러가 아니다. 복구와 갱신의 총액을 확인하자. [현행 정책 3절과 4절](https://www.icann.org/resources/pages/errp-2024-02-21-en)이 근거다.

## 3단계: 삭제 대기

일반적인 `.com`이 복구 기간 안에 복구되지 않으면 최종 삭제 대기 단계에 들어간다. 기간은 달력 기준 5일이다. 레지스트리는 변경 요청을 거부하고 이후 등록을 제거한다. [부록 7의 3.3.2절](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm)이 기간을 정한다.

상태 코드 전체를 함께 확인해야 한다. `pendingDelete`는 `redemptionPeriod` 또는 `pendingRestore`와 함께 나타날 수 있다. 복합 상태라면 복구 관련 설명을 적용해야 한다. [ICANN 상태 안내](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)가 차이를 설명한다. 공개 상태만으로 정확한 공개 시각을 계산할 수 없다. 45 + 30 + 5를 더해도 만료 후 80일째 공개를 보장하지 않는다.

## 4단계: 릴리스, 그리고 캐칭 경쟁

![여러 자동화된 로봇 서버가 열린 게이트를 통해 달려가 릴리스되는 순간 단 하나의 떨어지는 도메인 태그를 잡으려는 편집 삽화](../../assets/expired-domains-and-the-drop-cycle-02-release-scramble.jpg)

등록 제거 후 재등록에는 레지스트리 규칙이 적용된다. 만료 경매는 삭제 전에 등록을 판매할 수 있다. 도메인이 공개 등록 시장에 나오지 않고 등록자가 바뀔 수도 있다. 경매 날짜는 레지스트리 삭제 날짜가 아니다.

백오더는 취득 시도를 요청하며 성공을 보장하지 않는다. 여러 서비스가 동일한 신규 등록을 각각 완료할 수는 없다. 취득에 성공한 서비스는 여러 고객의 요청이 있으면 경매를 진행할 수 있다. 예를 들어 [Dynadot](https://www.dynadot.com/help/question/backorder-auction)은 취득 성공 후 백오더가 여러 건이면 공개 경매를 연다. 비공개 경매는 보편적인 규칙이 아니다.

## 드롭된 도메인이 나타나는 곳

![중앙의 돋보기 소싱 허브에서 드롭 목록, 백오더 티켓, 경매 망치, 애프터마켓 스토어프론트의 네 채널로 분기되어 각각 도메인 태그를 운반하는 편집 삽화](../../assets/expired-domains-and-the-drop-cycle-03-where-surface.jpg)

사이클을 이해해도 어디서 지켜봐야 할지 모르면 소용이 없습니다. 드롭되었거나 드롭이 임박한 도메인은 몇 가지 예측 가능한 곳에 나타나며, 실용적인 소싱 루틴은 보통 여러 채널을 동시에 활용합니다.

- **드롭 목록 및 만료 도메인 데이터베이스.** 공개 및 유료 목록은 매일 삭제 대기에 진입하는 도메인을 게시하며, 길이, [TLD](/ko/glossary/tld/), 키워드, 연령, 링크 지표 등으로 필터링할 수 있습니다. 릴리스를 앞둔 관심 도메인 감시 목록을 위한 원시 피드입니다.
- **백오더 및 드롭 캐칭 플랫폼.** 직접 달력을 지켜보는 대신 백오더를 신청하면 서비스가 릴리스 시 대신 경쟁합니다. 수요가 있는 도메인에 접근하는 현실적인 방법입니다. [도메인 백오더와 드롭 캐칭](/ko/blog/domain-backorders-and-drop-catching/)을 참조하세요.
- **만료 도메인 경매.** 많은 레지스트라는 가치 있는 만료 인벤토리를 공개 드롭에 내놓지 않고, 유예 창 중 또는 이후에 자체 만료 경매로 라우팅합니다. 이는 [도메인 경매에서 이기는 법](/ko/blog/how-to-win-domain-auctions/)에서 다루는 더 넓은 채널과 겹칩니다.
- **애프터마켓 마켓플레이스.** 다른 사람이 캐칭했거나 복구 후 재매물로 나온 도메인은 [애프터마켓](/ko/glossary/aftermarket/)에서 재판매됩니다. 드롭 자체는 아니지만, 드롭 후 많은 인벤토리가 결국 이곳으로 흘러옵니다.

플리퍼의 우위는 채널과 도메인을 적절히 매칭하는 데 있습니다. 경쟁이 낮은 공개 드롭 목록의 도메인은 핸드 레지스터에 가까운 접근이 유효하지만, 프리미엄 한 단어 도메인은 백오더와 경매 예산이 필요합니다. 새 문자열을 직접 등록하는 것이 본인의 접근법이라면, 그것도 정당하고 다른 경로이며 [플립용 도메인 핸드 레지스터](/ko/blog/hand-registering-domains-to-flip/)에서 다룹니다.

## 플리퍼의 관점에서 사이클 읽기

등록자는 즉시 등록기관에 갱신과 복구 조건 및 총요금을 문의해야 한다. 구매자는 확장자, 등록기관, 전체 상태, 조회 시각, 경매 채널과 백오더 기한을 기록해야 한다. 만료일만으로 공개일을 확정하지 말자. 재판매나 토큰 이전도 기반 도메인 등록의 갱신 의무를 없애지 않는다.

**실사는 도메인과 함께 따라옵니다.** 드롭된 도메인은 자신의 이력을 물려받으며, 모든 이력이 좋은 것은 아닙니다. 오래된 도메인에 입찰하기 전에 이전 사용 내역, [WHOIS](/ko/glossary/whois/) 및 소유권 이력, 모든 [레지스트라](/ko/glossary/registrar/) 잠금 여부, 그리고 문제 있는 콘텐츠가 있었는지 확인하십시오. 브랜드를 침해한 도메인은 현재 소유자인 여러분에게도 [UDRP](/ko/glossary/udrp/) 분쟁을 유발할 수 있으며, 기존 백링크가 금처럼 보여도 스팸일 수 있습니다. 드롭은 자산과 그 짐을 함께 건네줍니다.

## Namefi의 관점

훌륭한 드롭 도메인을 잡는 것은 절반에 불과합니다. 다음번에 도메인이 이전될 때, 가치 높은 [도메인 거래](/ko/glossary/domain-trading/)가 항상 직면하는 마찰에 부딪힙니다. 구매자는 도메인이 이전되기 전에는 대금을 지불하지 않고, 판매자는 대금을 받기 전에는 도메인을 이전하지 않으며, 레지스트라 간 [인증 코드](/ko/glossary/auth-code/) 인도 과정에서 불안한 공백이 생깁니다. 이 교착 상태 때문에 [에스크로](/ko/glossary/escrow/)가 존재하며, 오래되고 링크가 풍부한 도메인일수록 이 문제는 더 첨예해집니다.

## 친절한 면책 고지 (꼭 읽어주세요!)

> 저희는 변호사, 회계사, 금융 자문사, 의사가 아니며, **이 글의 어떤 내용도 법적, 금융적, 세무적, 회계적, 의학적 또는 기타 전문적 조언이 아닙니다.** 이 글은 자체 교육과 고객 편의를 위해 작성되었습니다. 여기의 정보는 구식이거나, 지역에 따라 다를 수 있거나, 단순히 틀릴 수 있습니다. 저희도 실수를 합니다.
>
> 중요한 결정을 내리기 전에 **반드시 실제 전문가와 상담하세요(진심으로!)**. 그게 맞지 않는다면, 친구, 트위터, Reddit, AI, 또는 점쟁이에게 물어보세요. 요약하면: **DOYR - 스스로 조사하세요**. 함께 배우고 즐겨봅시다.

## 출처 및 추가 자료

출처 확인일: 2026년 10월 22일(UTC). 최초 게시일을 유지한다.

- [ICANN / Verisign — 현행 .com 계약 부록 7](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm)
- [ICANN — ERRP 2024](https://www.icann.org/resources/pages/errp-2024-02-21-en)
- [ICANN — EPP](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)
- [Dynadot](https://www.dynadot.com/help/question/backorder-auction)
