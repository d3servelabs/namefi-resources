---
title: '과도한 비용 없이 도메인 경매에서 낙찰받는 방법'
date: '2026-06-21'
language: ko
tags: ['domains', 'domain-investing', 'domain-flipping', 'guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 6
format: guide
description: '애프터마켓 도메인 경매의 실제 작동 방식 — 프록시 입찰, 스나이핑, 최대 한도 설정, 수요 파악, 그리고 과도한 지출과 허위 입찰 함정을 피하는 방법.'
ogImage: ../../assets/how-to-win-domain-auctions-og.jpg
keywords: ['도메인 경매', '도메인 경매 낙찰 방법', '도메인 경매 전략', 'GoDaddy 경매', 'NameJet', 'Sedo 경매', '프록시 입찰', '경매 스나이핑', '만료 도메인 경매', '허위 입찰', '낙찰자의 저주 도메인', '만료 도메인 구매', '도메인 애프터마켓', '드롭 캐칭 경매', '도메인 과다 지출 방지']
relatedArticles:
  - /ko/blog/domain-flipping/
  - /ko/blog/end-user-vs-reseller-domain-pricing/
  - /ko/blog/how-to-read-comparable-domain-sales/
  - /ko/blog/domain-backorders-and-drop-catching/
  - /ko/blog/when-to-drop-a-domain/
relatedTopics:
  - /ko/topics/domain-investing/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/domain-investor-field-guide/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/dns/
  - /ko/glossary/tld/
  - /ko/glossary/registry/
---

구매하고 싶은 좋은 도메인 이름의 대부분은 이미 등록된 상태이며, 그중 상당수는 결국 [경매](/ko/glossary/auction/)를 통해 거래됩니다. 등록이 만료되거나, 도메인 투자자가 보유 자산을 처분하거나, 레지스트라가 [백오더](/ko/glossary/backorder/) 없이 삭제 예정 도메인을 확보하면, 해당 도메인은 경매에 올라 최고 입찰자에게 낙찰됩니다. 도메인 플리핑을 한다면 이 시장에서 실제 돈을 쓰게 됩니다. 수익성 있는 인수와 계정에 쌓이는 애물단지 사이의 차이는 대부분 입찰 순간의 절제력에 달려 있습니다.

이 가이드는 [애프터마켓](/ko/glossary/aftermarket/) 경매의 실제 작동 방식, 반드시 이해해야 할 두 가지 입찰 메커니즘(프록시 입찰과 스나이핑), 최대 한도를 설정하고 지키는 방법, 수요가 실제인지 파악하는 방법, 그리고 경매에서 돈을 잃는 두 가지 함정(스스로 과다 지출하거나 타인에게 이용당하는 것)을 피하는 방법을 다룹니다. 이 글은 [도메인 플리핑](/ko/blog/domain-flipping/) 시리즈의 일부이며, [플리핑할 도메인 찾는 방법](/ko/blog/how-to-find-domains-to-flip/)과 직접 연결됩니다. 경매는 도메인을 발굴하는 주요 경로 중 하나이기 때문입니다.

## 도메인 경매의 출처

도메인 이름 경매는 저렴하게 사서 비싸게 파는 거래의 공식화된 형태입니다. 경매는 [현재 등록된 도메인 이름의 매매를 촉진하며, 개인이 판매를 원하는 소유자로부터 이미 등록된 도메인을 구매할 수 있게 해줍니다](https://en.wikipedia.org/wiki/Domain_name_auction#:~:text=facilitates%20the%20buying%20and%20selling%20of%20currently%20registered). 입찰하게 될 대부분의 도메인은 만료 파이프라인에서 나옵니다. 도메인이 갱신되지 않으면 곧바로 개방 풀로 돌아가지 않고, 레지스트라가 먼저 경매에 회부합니다. [도메인 드롭 캐칭](/ko/blog/expired-domains-and-the-drop-cycle/)의 메커니즘에 대해 Wikipedia가 설명하듯이, [GoDaddy나 eNom과 같은 일반 레지스트라는 TDNAM이나 Snapnames 같은 서비스를 통해 도메인을 경매용으로 보유합니다](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=Retail%20registrars%20such%20as%20GoDaddy%20or%20eNom%20retain%20names%20for%20auction). 다른 레지스트라는 중간 업체에 도메인을 넘기기도 합니다. [일부 레지스트라는 도메인이 일반적인 방식으로 드롭되는 것을 허용하지 않고, 삭제 전에 경매를 진행하는 중개인(예: Snapnames, Namejet)을 개입시킵니다](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=introducing%20an%20intermediary).

실제로 접하게 될 플랫폼은 세 가지 유형입니다.

- **GoDaddy Auctions**: 거래량이 가장 많은 만료 도메인 시장으로, 세계 최대 [레지스트라](/ko/glossary/registrar/)에서 만료된 도메인이 공급됩니다. 대부분의 매물은 공개 타이머가 적용된 만료 도메인입니다.
- **NameJet**(및 이와 밀접한 Snapnames): 백오더와 경매를 결합한 서비스를 운영합니다. 삭제 대기 중인 도메인에 [백오더](/ko/blog/domain-backorders-and-drop-catching/)를 넣으면, 둘 이상의 사람이 원할 경우 백오더 참여자들 사이의 비공개 경매로 진행됩니다.
- **Sedo**: 만료 도메인보다 소유자가 직접 등록한 매물에 중점을 둡니다. Sedo는 2006년에 [도메인 이름 경매를 도입한](https://en.wikipedia.org/wiki/Sedo#:~:text=introduced%20domain%20name%20auctions) 미국의 도메인 애프터마켓 기업으로, 판매자 주도 및 중개 거래의 주요 창구로 남아 있습니다.

공급원은 다르지만 입찰 메커니즘은 거의 동일합니다. 한 번 익히면 어디서든 입찰할 수 있습니다.

## 프록시 입찰: 내부 엔진

![봉투 속에 숨겨진 최대 입찰가가 기어 구동 기계로 투입되는 편집 일러스트. 기계는 숨겨진 상한선 바로 아래에서 멈추며, 필요한 만큼만 입찰가를 올립니다](../../assets/how-to-win-domain-auctions-01-proxy.jpg)

거의 모든 도메인 경매는 eBay가 유명하게 만든 **프록시 입찰** 방식으로 운영됩니다. 정확한 정의는 다음과 같습니다. 프록시 입찰은 [eBay에서 사용되는 영국식 차가 경매(second-price auction)의 구현으로, 낙찰자는 두 번째로 높은 입찰가에 정해진 증분을 더한 금액을 지불합니다](https://en.wikipedia.org/wiki/Proxy_bid#:~:text=is%20an%20implementation%20of%20an%20English%20second%2Dprice%20auction). 지불 의사가 있는 최대 금액을 입력하면, 시스템은 그 금액을 노출하지 않고 증분 단위로 대신 입찰하되, 상한선까지만 올라갑니다.

이는 경매 전략에서 가장 유용한 단일 사실을 낳으며, 처음에는 직관에 반하는 것처럼 느껴집니다. [지불 금액은 경쟁자의 입찰에 의해서만 결정되며 새로운 입찰 금액에 의해 결정되지 않기 때문에](https://en.wikipedia.org/wiki/Proxy_bid#:~:text=the%20price%20paid%20is%20determined%20only%20by%20competitors%27%20bids), 합리적인 행동은 진짜 최대 금액을 한 번 입력하고 다시는 건드리지 않는 것입니다. 최대 금액까지 누군가 밀어 올리지 않는 한, 그 금액을 지불하지 않습니다. 상한선이 $1,200이고 다음 입찰자의 최고 금액이 $700이라면, $1,200이 아닌 $700에 증분 하나를 더한 금액에 낙찰됩니다. 실제 최대 금액을 입력해도 "노출"되지 않습니다. 누구도 그 금액을 볼 수 없고, 가격은 2위 입찰자가 결정하기 때문입니다.

이것이 바로 $25씩 조금씩 올리는 입찰이 손해인 이유입니다. 증분 입찰은 프록시 시스템에서 더 좋은 가격을 만들어 내지 못합니다. 오히려 자신이 해당 도메인을 얼마나 원하는지를 실시간으로 드러낼 뿐이며, 그 정보가 결국 과다 지출로 이어집니다. 타이머가 없을 때 금액을 결정하고, 한 번 입력한 뒤 나머지는 시스템에 맡기십시오.

## 스나이핑: 타이밍, 그리고 왜 대부분 소음에 불과한가

모두가 궁금해하는 또 다른 메커니즘은 **스나이핑** — 마지막 순간에 입찰하는 것입니다. 경매 스나이핑은 [온라인 경매에서 현재 최고 입찰가를 초과할 가능성이 높은 입찰을 가능한 한 늦게 제출하는 행위](https://en.wikipedia.org/wiki/Auction_sniping#:~:text=the%20practice%2C%20in%20a%20timed%20online%20auction)입니다. 논리 자체는 타당합니다. 늦게 입찰하면 경쟁자가 반응할 시간이 없고, [입찰 전쟁](https://en.wikipedia.org/wiki/Auction_sniping#:~:text=avoid%20bidding%20wars)과 입찰 쫓기(경쟁 입찰을 보는 것만으로 다른 사람들이 참여하게 되는 현상)를 피할 수 있습니다.

도메인 경매에서는 두 가지 요소가 스나이핑을 복잡하게 만듭니다. 첫째, 대부분의 주요 플랫폼은 **스나이핑 방지 연장** 기능을 사용합니다. 마감 직전에 입찰이 들어오면 종료 시간이 몇 분씩 연장되며, 아무도 그 시간 안에 입찰하지 않을 때까지 반복됩니다. 이는 스나이핑의 핵심인 기습 효과를 무력화합니다. 자신을 기다려 주는 시계를 이길 수는 없으니까요. 둘째, 스나이핑은 *낙찰*을 위한 전술이지, *덜 내기* 위한 전술이 아닙니다. 프록시 입찰 하에서 마지막 순간에 진짜 최대 금액을 스나이핑하든 일찍 입력하든, 같은 가격에 같은 도메인을 얻습니다.

솔직한 결론: 스나이핑의 유일한 합법적 용도는 관심을 숨겨 스스로 입찰 쫓기를 하지 않거나 경쟁을 이용하는 경쟁자에게 힌트를 주지 않는 것입니다. 연장 기능이 있는 플랫폼에서는 가격에 아무런 영향도 없습니다. 중요한 절제는 *언제* 입찰하느냐가 아니라 *얼마를* 입찰할 것인가에 있습니다.

## 최대 한도를 설정하고 지키기

![상승하는 가격 화살표가 단단하고 움직이지 않는 벽에 부딪히는 편집 일러스트. 벽은 굳건히 버팁니다](../../assets/how-to-win-domain-auctions-02-hardmax.jpg)

입찰을 시작하기 전에 지불 의사가 있는 최대 금액을 적어 두고, 그 숫자를 제안이 아닌 벽으로 대하십시오. 최대 금액은 "완벽한 구매자에게 이 도메인이 가치 있을 수 있는 금액"이 아닙니다. 출구에서 역산한 값입니다. 현실적인 재판매 가격을 추정하고, 판매 측에 지불할 마켓플레이스 수수료를 빼고, 팔릴 때까지 부담할 것으로 예상되는 수년치 갱신 비용을 빼고, 거래를 가치 있게 만드는 마진을 빼십시오. 그 나머지가 당신의 인수 상한선입니다. (이 계산의 재판매 부분이 불확실하다면, [보유 도메인을 파는 방법](/ko/blog/how-to-sell-a-domain-name-you-own/) 가이드에서 출구 전략을 다룹니다.)

그리고 지키십시오. 실시간 경매의 감정적 구조는 당신의 벽을 움직이도록 설계되어 있으며, [도메이닝](/ko/glossary/domaining/)에서 가장 비싼 단어는 "그냥"입니다. *그냥* 한 번 더. *그냥* 오만 원만 더. 각각의 작은 조정은 홀로 보면 사소해 보입니다. 그게 함정입니다. $800로 평가했던 도메인이 고통 없이 한 걸음씩 $1,400짜리 구매가 되어 있고, 어느새 마진은 사라집니다. 프록시 시스템은 당신이 허용한다면 여기서 당신을 보호합니다. 진짜 상한선을 한 번 입력하고, 자리를 떠나, 결과를 받아들이십시오. 지더라도, 당신의 숫자가 말해 주는 것보다 그 도메인의 가치를 더 높이 평가한 사람에게 진 것입니다. 그것은 패배처럼 보이는 승리입니다.

패배 패턴에는 경매 이론에서 이름이 있습니다. **낙찰자의 저주**는 서로 다른 사적 추정치를 가진 입찰자들 사이에서 [낙찰자가 자산을 가장 낙관적으로 평가한 입찰자이므로 과대평가하고 과다 지불하는 경향이 있다](https://en.wikipedia.org/wiki/Winner%27s_curse#:~:text=the%20winner%20is%20the%20bidder%20with%20the%20most%20optimistic%20evaluation)는 현상입니다. 도메이너들이 모인 방에서, 낙찰자는 정의상 해당 도메인에 가장 높은 가치를 매긴 사람이며, 그것은 종종 높은 쪽으로 잘못 평가한 사람입니다. 최대 한도는 바로 그 사람이 되지 않기 위한 구조적 방어입니다.

## 수요가 실제인지 파악하기

![수많은 고유한 입찰자들이 패들을 들고 있는 군중을 돋보기로 관찰하는 일러스트와, 두 사람이 서로 대결하는 장면을 대조적으로 보여주는 편집 일러스트](../../assets/how-to-win-domain-auctions-03-demand.jpg)

과다 지불을 피하는 절반은 도메인을 정확히 평가하는 것이고, 경매는 반응하는 대신 읽어야 할 신호를 제공합니다.

**입찰 횟수가 아니라 고유 입찰자 수를 세십시오.** 두 사람이 결의를 다지면 수십 번의 입찰을 통해 가격을 끌어올릴 수 있습니다. 그것은 시장이 아니라 결투입니다. 다양한 입찰자가 많다는 것은 폭넓은 수요와 실질적인 최저 가격을 의미합니다. 경쟁자 한 명이 당신을 쫓아 올린 가격은 시장이 아닌 그 사람의 욕구를 보여줍니다.

**[비교 거래 사례](/ko/glossary/comparable-sales/)와 비교해 점검하십시오.** 실시간 경매 가격은 잡음이 섞인 단일 데이터 포인트입니다. "다른 사람이 입찰했으니 공정한 가격"이라고 판단하기 전에, 실제로 유사한 도메인(같은 종류의 단어, 같은 확장자, 같은 구매자 용도)이 실제로 얼마에 팔렸는지에 근거를 두십시오. [플리핑할 도메인 찾는 방법](/ko/blog/how-to-find-domains-to-flip/)의 기본 원칙이 경매 매물 평가에도 직접 적용됩니다.

**도메인과 지표를 분리하십시오.** 만료 도메인 경매는 연령, 백링크, 트래픽을 즐겨 보여 주지만, 이것들은 실제 가치일 수도 있고 재활용된 스팸, 조작된 링크 프로필, 기존 콘텐츠가 내려가면 사라지는 트래픽일 수도 있습니다. 인상적인 지표는 입찰 이유가 아니라 파고들 이유로 삼으십시오. 실제 [엔드 유저](/ko/glossary/end-user/)에 대한 재판매 가치는 대개 완전히 검증할 수 없는 [SEO](/ko/glossary/seo/) 이력이 아니라 도메인 문자열 자체에 달려 있습니다.

**왜 매물로 나왔는지 파악하십시오.** [드롭된 도메인이 더 가치 있는](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=dropped%20domain%20names%20can%20be%20more%20valuable) 경우가 있는 것은 과거에 유명한 사이트가 있었기 때문이고, 때로는 그 이력이 바로 소유자가 떠난 이유(폐기된 프로젝트, [상표](/ko/glossary/trademark/) 문제)인 부채이기도 합니다. 가격을 올리기 전에 도메인의 히스토리를 먼저 확인하십시오.

## 조종당하지 않기: 허위 입찰과 가격 함정

과다 지불의 또 다른 경로는 조종당하는 것이며, 경매에는 구조 자체에 내재된 고전적인 조종 수법이 있습니다. **허위 입찰자(shill)**는 가짜 입찰자입니다. [판매자나 경매인에게 유리하도록 가짜 입찰로 가격을 올리는 사람들을 허위 입찰자라 합니다](https://en.wikipedia.org/wiki/Shill#:~:text=drive%20prices%20in%20favor%20of%20the%20seller%20or%20auctioneer%20with%20fake%20bids). 실제 수요가 있는 것처럼 꾸며 진짜 입찰자가 더 높은 가격을 내게 만듭니다. 허위 입찰은 모든 신뢰할 만한 플랫폼에서 금지되어 있지만, 어떤 정책도 완전히 없애지는 못합니다.

방어책은 허위 입찰자를 현장에서 탐지하는 것이 아닙니다. 대개 그것은 불가능합니다. 방어책은 최대 한도를 정해 두면 허위 입찰이 무관해진다는 점입니다. 유령 입찰자는 오직 가짜 입찰로 당신의 금액을 끌어올릴 때만 해를 끼칠 수 있는데, 당신의 금액은 움직이지 않습니다. 허위 입찰자가 당신을 상한선까지 밀어 "낙찰"받으면, 그들은 도메인을 스스로 다시 사게 된 것이며, 경우에 따라서는 그 특권에 대한 수수료까지 내야 합니다. 벽을 지키면 조종은 그 벽에 부딪힙니다.

언급할 만한 관련 가격 함정 몇 가지:

- **유보가 및 최저가.** 많은 매물에는 숨겨진 유보가가 있습니다. 유보가가 당신의 최대 한도를 초과한다면 떠나십시오. 공개되지 않은 최저가를 쫓다 보면 자신의 숫자를 넘어서게 됩니다.
- **"[즉시 구매](/ko/glossary/buy-it-now/)" 앵커링.** 높은 즉시 구매가는 경매가 상대적으로 저렴해 보이게 만들기 위한 것입니다. 이는 마케팅 앵커이지 가치 평가가 아닙니다. 무시하고 도메인 자체의 가치로 평가하십시오.
- **추가 수수료.** 일부 플랫폼은 구매자 프리미엄을 추가하거나 판매자 측 수수료를 부과해 모든 사람의 실질적인 최저 가격을 조용히 끌어올립니다. 최대 한도에 총비용을 포함시켜, 입력하는 금액이 실제 지불 가능한 금액이 되도록 하십시오.

## 낙찰 후: 안전하게 도메인 받기

낙찰은 거래의 끝이 아니라 시작이며, 고액 낙찰의 경우 인수 과정에서 거래가 틀어지는 일이 생깁니다. 바로 그 때문에 도메인 경매 [사이트들은 에스크로 대리인 링크를 제공하는 경우가 많습니다](https://en.wikipedia.org/wiki/Domain_name_auction#:~:text=auction%20sites%20often%20provide%20links%20to%20escrow%20agents). 중립적인 [에스크로](/ko/glossary/escrow/)를 통해 판매자는 결제 완료 전에 이전하지 않고, 구매자는 도메인이 확보되기 전에 결제하지 않을 수 있습니다. 만료 도메인 경매의 경우 레지스트라가 보통 도메인을 자동으로 계정에 넣어 주지만, 소유자 간 거래의 경우 에스크로를 통한 적절한 [이전](/ko/glossary/cross-registrar-transfer/)을 고집하고 [인증 코드](/ko/glossary/auth-code/)를 수령하였는지 확인하십시오. 안전한 인수 절차는 [도메인 에스크로 설명](/ko/blog/domain-escrow-explained/)에서 다룹니다.

정산은 또한 토큰화된 소유권이 계산을 바꾸는 지점입니다. 고전적인 교착 상태(어느 쪽도 먼저 움직이려 하지 않는 것)가 고액 [도메인 거래](/ko/glossary/domain-trading/)를 긴장되게 만드는 이유이며, 이 격차를 좁히기 위해 [Namefi](https://namefi.io)가 구축되었습니다. 실제 [ICANN](/ko/glossary/icann/) 도메인의 소유권 확인과 이전이 더 쉬워지고, 이전 과정에서도 라이브 도메인이 계속 해석되도록 [DNS](/ko/glossary/dns/) 연속성이 유지됩니다. 경매 구매자에게 정산 마찰 감소는 낙찰받은 도메인이 실제로 완료되는 비율을 높여 줍니다.

## 요약

경매는 준비에 보상을 주고 즉흥에 벌칙을 줍니다. 타이머가 시작되기 전에 평가를 마치십시오. 도메인을 얼마나 원하는지가 아니라, 현실적인 출구에서 역산한 최대 한도를 설정하십시오. 프록시 입찰은 한 번에 진짜 상한선을 입력하고도 과다 지불하지 않게 해 주며, 연장 기능이 있는 플랫폼에서의 스나이핑은 타이밍은 바꾸지만 가격은 바꾸지 않습니다. 낙찰자의 저주, 허위 입찰자, 즉시 구매가 앵커링은 모두 당신이 움직이기를 거부하는 숫자 앞에서 힘을 잃습니다. 당신의 계산에 맞는 도메인을 낙찰받고, 나머지는 과다 지불할 사람에게 넘기고, [에스크로](/ko/glossary/escrow/)를 통해 정산하여 낙찰이 실제로 계정에 들어오도록 하십시오.

## 고지 사항 (꼭 읽어 주세요!)

> 저희는 변호사, 회계사, 금융 어드바이저, 의사가 아니며, **이 글의 어떠한 내용도 법적, 재정적, 세금, 회계, 의료 또는 기타 전문적 조언에 해당하지 않습니다.** 이 글은 자체 학습과 고객 편의를 위해 작성한 것입니다. 내용이 최신 정보가 아니거나, 특정 지역에만 해당하거나, 단순히 틀릴 수 있습니다. 저희도 실수를 합니다.
>
> 중요한 결정에 대해서는 **반드시 실제 전문가와 상담하십시오(진심으로!)**. 그것이 어렵다면, 친구에게 묻거나, Twitter에 묻거나, Reddit에 묻거나, AI에 묻거나, 점쟁이에게 물어보십시오. 요컨대: **DOYR - 스스로 조사하십시오**. 함께 배우고 즐겨봅시다.

## 출처 및 추가 읽을거리

- Wikipedia — [Domain name auction (정의; 에스크로 링크)](https://en.wikipedia.org/wiki/Domain_name_auction#:~:text=facilitates%20the%20buying%20and%20selling%20of%20currently%20registered)
- Wikipedia — [Proxy bid (eBay 차가 경매 모델; 경쟁자 입찰로 가격 결정)](https://en.wikipedia.org/wiki/Proxy_bid#:~:text=is%20an%20implementation%20of%20an%20English%20second%2Dprice%20auction)
- Wikipedia — [Auction sniping (마지막 순간 입찰; 입찰 전쟁 회피)](https://en.wikipedia.org/wiki/Auction_sniping#:~:text=the%20practice%2C%20in%20a%20timed%20online%20auction)
- Wikipedia — [Winner''s curse (가장 낙관적인 입찰자가 과다 지불)](https://en.wikipedia.org/wiki/Winner%27s_curse#:~:text=the%20winner%20is%20the%20bidder%20with%20the%20most%20optimistic%20evaluation)
- Wikipedia — [Shill (판매자를 위한 가짜 입찰로 가격 올리기)](https://en.wikipedia.org/wiki/Shill#:~:text=drive%20prices%20in%20favor%20of%20the%20seller%20or%20auctioneer%20with%20fake%20bids)
- Wikipedia — [Domain drop catching (GoDaddy/eNom의 경매용 도메인 보유)](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=Retail%20registrars%20such%20as%20GoDaddy%20or%20eNom%20retain%20names%20for%20auction)
- Wikipedia — [Domain name speculation (Snapnames/Namejet 중개 경매; 드롭 도메인)](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=introducing%20an%20intermediary)
- Wikipedia — [Sedo (2006년 도메인 이름 경매 도입)](https://en.wikipedia.org/wiki/Sedo#:~:text=introduced%20domain%20name%20auctions)
