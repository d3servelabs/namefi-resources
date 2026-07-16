---
title: "만료 도메인과 드롭 사이클 완벽 해설"
date: '2026-06-21'
language: ko
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 3
format: explainer
description: "도메인이 만료되고 드롭되는 과정: 유예 기간, 30일 복구 창, 5일 삭제 대기, 릴리스 — 그리고 드롭된 도메인이 플리퍼들에게 나타나는 곳."
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

대부분의 사람들은 기간이 만료된 도메인이 다음 날 아침 오픈 마켓에 즉시 돌아온다고 생각합니다. 하지만 실제로는 그렇지 않습니다. 아무도 갱신하지 않은 도메인은 [레지스트리](/ko/glossary/registry/)가 최종적으로 사용 가능한 풀에 다시 공개하기까지, 각 단계마다 누가 어떤 비용으로 도메인을 되찾을 수 있는지에 관한 고유한 규칙이 있는 여러 주 에 걸친 보류 상태를 거칩니다. 이 최종 공개가 바로 "[드롭](/ko/glossary/pending-delete/)"이며, 도메인이 풀에 돌아오는 즉시 등록하는 행위는 잘 알려진 관행입니다. 위키피디아에 따르면, [도메인 드롭 캐칭(도메인 스나이핑이라고도 함)은 등록 기간이 만료된 직후 도메인 이름을 등록하는 관행](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)입니다.

플리퍼들이 이 시장 영역에 주목하는 이유는 드롭된 도메인이 백지 상태가 아니기 때문입니다. 어떤 도메인이 드롭 단계에 이른다는 것은, 누군가 등록하여 사용하다 포기했다는 의미이므로, 연령, 인바운드 링크, 잔여 트래픽, 또는 직접 등록하려 했을 때 이미 사용 중이었던 문자열을 보유하고 있을 수 있습니다. 드롭 사이클은 이미 누군가의 필요를 증명한 도메인들의 재활용 흐름입니다. 이는 완전히 새로운 문자열과는 다른 리스크 프로파일을 가지며, [플립용 도메인 찾는 법](/ko/blog/how-to-find-domains-to-flip/)에서 설명하는 공급 채널 중 하나입니다. 이 해설서는 라이프사이클을 단계별로 설명하고, 드롭된 도메인이 어디서 나타나는지와 플리퍼들이 어떻게 포지셔닝하는지를 다룹니다.

## 1단계: 활성 등록 및 갱신 창

도메인은 완전한 소유권의 대상이 아닙니다. 일정 기간 등록하고 유지하려면 갱신해야 합니다. 위키피디아에 따르면 [gTLD](/ko/glossary/gtld/) 도메인 이름의 최대 등록 기간은 10년입니다: [gTLD 도메인 이름의 최대 등록 기간은 10년](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years). 기간이 끝나고 보유자가 갱신하지 않으면 드롭 사이클의 카운트다운이 시작됩니다.

먼저 이해해야 할 것은 "만료"가 "사용 가능"을 의미하지 않는다는 점입니다. 만료일 당일에도 [등록자](/ko/glossary/registrant/)는 여전히 가장 강력한 권리를 보유합니다. 레지스트리는 도메인을 즉시 삭제하지 않습니다. 대신 등록을 자동 갱신하고 레지스트라에게 결제를 수집하거나 취소할 수 있는 창을 부여합니다. [`.com`](/ko/tld/com/) 네임스페이스에서 이를 **자동 갱신 유예 기간(Auto-Renew Grace Period)**이라 하며, Verisign의 구속력 있는 레지스트리 계약이 그 길이를 명시합니다. [자동 갱신 유예 기간의 현재 값은 45 역일(calendar days)](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20value%20of%20the%20Auto%2DRenew%20Grace%20Period%20is%2045%20calendar%20days)입니다. 다른 gTLD도 같은 구조를 따르지만 특정 레지스트리가 다른 값을 설정할 수 있으므로, `.com`은 보편적 규칙이 아닌 기준 사례로 이해해야 합니다.

대부분의 레지스트라는 이 기간 중 사이트 접속을 중단하고 안내 페이지를 게시하지만, 도메인은 원래 소유자를 위해 보류됩니다. 소유자는 대체로 정상 가격에 가깝게 갱신할 수 있으나, 기간이 길어질수록 연체 수수료가 높아지는 경향이 있습니다. 원칙은 분명합니다. 만료 직후에는 이전 소유자가 우선권을 가지며, 도구에서 "만료됨"으로 표시된 도메인은 대개 아직 캐칭이 불가능합니다. 이것이 도메인을 유지하는 가장 저렴한 방법이 제때 갱신하는 것인 이유이기도 합니다. 위키피디아에 따르면 일반 `.com`의 소매 갱신 비용은 합리적인 수준으로, [소매 비용은 일반적으로 연간 약 $9.70에서 연간 약 $35 수준](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=the%20retail%20cost%20generally%20ranges%20from%20a%20low%20of%20about%20%249.70%20per%20year)입니다. 이후에 설명하는 모든 절차는 이 금액을 아무도 납부하지 않을 때 발생하는 일입니다.

## 2단계: 복구 유예 기간

![도메인 이름 태그가 카운트다운 다이얼 안의 모래시계에 매달려 있고, 시간이 다하기 전에 복구 수수료를 지불하려는 손이 동전을 내밀고 있는 편집 삽화](../../assets/expired-domains-and-the-drop-cycle-01-redemption.jpg)

유예 창이 갱신 없이 닫히면 레지스트라는 해당 도메인을 삭제하여 **[복구 유예 기간(Redemption Grace Period)](/ko/glossary/grace-period/)**이라는 복구 창에 진입시킵니다. [WHOIS](/ko/glossary/whois/) 및 EPP 상태에서는 "[복구 기간(redemption period)](/ko/glossary/redemption-period/)" 또는 `redemptionPeriod`로 표시됩니다. 이 단계는 많은 사람들을 놀라게 하는 부분입니다. 이전 소유자가 아직 도메인을 되찾을 수 있지만, 이제는 상당한 비용이 들고 공식적인 상태 변경이 발생합니다. [ICANN](/ko/glossary/icann/) 자체는 [30일 복구 유예 기간(RGP)](https://www.icann.org/resources/pages/grace-2013-05-03-en#:~:text=30%2Dday%20Redemption%20Grace%20Period%20%28RGP%29)을 명시하며, 등록자 FAQ에서도 도메인이 삭제되면 [도메인 이름은 30일의 복구 기간에 진입](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20enter%20into%20a%20redemption%20period%20for%2030%20days)한다고 확인합니다. `.com` 계약도 동일한 숫자를 규정합니다. [이 복구 기간의 현재 길이는 30 역일](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20length%20of%20this%20Redemption%20Period%20is%2030%20calendar%20days)입니다.

플리퍼에게 중요한 실질적인 두 가지 사항이 있습니다. 첫째, 30일이라는 기간은 일반 gTLD의 기준이지 보편적 상수가 아닙니다. 위키피디아에 따르면 [이 기간의 길이는 TLD마다 다르며, 보통 30일에서 90일 사이](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=usually%20around%2030%20to%2090%20days)입니다. 둘째, 복구 기간 중 도메인을 되찾는 비용은 의도적으로 높게 설정되어 있습니다. 단순 갱신 클릭이 아니며, ICANN 규정에 따라 [30일 복구 유예 기간에 있는 도메인 이름은 창이 닫히기 전에 복구(또는 갱신)할 수 있지만](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=Domain%20names%20that%20are%20in%20the%2030%2Dday%20Redemption%20Grace%20Period%20can%20be%20redeemed), 레지스트라는 통상 갱신료 외에 별도의 복구 수수료를 부과합니다. 위키피디아는 이를 소유자가 [도메인을 재활성화 및 재등록하기 위해 수수료(일반적으로 약 US$100)를 납부해야 할 수 있다](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=may%20be%20required%20to%20pay%20a%20fee%20%28typically%20around%20US%24100%29)고 설명합니다. 이 수수료는 목적이 있습니다. 진정으로 잊어버린 소유자에게 마지막 기회를 주면서, 사이클을 악용하는 행위에는 비용을 부과하기 위해서입니다.

복구 기간 중 도메인을 지켜보는 구매자에게 드리는 조언은 인내심입니다. 복구 기간 중인 도메인은 캐칭이 불가능하며 오픈 마켓에서 거래되지 않습니다. 법적으로 이전 소유자가 아직 되찾을 권리를 보유하고 있습니다. 이 창에는 "거의 무료로 보이는" 도메인이 상당수 있으며, 등록자가 만료 사실을 인지하면 좋은 도메인의 상당 비율을 되찾아 갑니다. 복구 기간 중에 성급하게 기대하는 것이 드롭에서 실망하는 가장 흔한 이유입니다.

## 3단계: 삭제 대기

복구가 없이 복구 유예 기간이 종료되면 도메인은 릴리스 전 마지막 보류 상태인 삭제 대기(pending delete)에 진입합니다. 이는 누구도 도메인을 등록하거나 복구할 수 없는 짧고 엄격한 잠금 기간입니다. 이전 소유자도, 여러분도 마찬가지입니다. `.com` 계약은 이 조건과 잠금을 명확히 규정합니다. [복구 유예 기간 동안 복구되지 않은 도메인 이름은 PENDING DELETE 상태에 놓이며](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=A%20domain%20name%20is%20placed%20in%20PENDING%20DELETE%20status%20if%20it%20has%20not%20been%20restored%20during%20the%20Redemption%20Grace%20Period), 해당 상태의 도메인에 대한 모든 레지스트라 수정 요청은 거부됩니다. 이 단계는 오직 레지스트리에 깔끔한 삭제 카운트다운을 제공하기 위해 존재합니다.

이 단계의 기간은 전체 사이클에서 가장 고정된 숫자입니다. ICANN 등록자 FAQ는 복구되지 않은 도메인이 [5일간 PendingDelete 상태에 진입](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=will%20enter%20into%20PendingDelete%20status%20for%205%20days)한다고 명시하며, `.com` 레지스트리 계약도 [이 삭제 대기 기간의 현재 길이는 5 역일](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20length%20of%20this%20Pending%20Delete%20Period%20is%20five%20calendar%20days)임을 확인합니다. 위키피디아도 이 창 이후 [해당 도메인이 ICANN 데이터베이스에서 삭제](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=phase%20of%205%20days%2C%20the%20domain%20will%20be%20dropped%20from%20the%20ICANN%20database)된다고 언급합니다. 이 5일은 플리퍼에게 가장 유용한 신호입니다. 삭제 대기는 종료 시점을 예측할 수 있는 유일한 단계이기 때문입니다. 원하는 도메인이 이 단계에 진입하면, 몇 시간 단위로 릴리스 시점을 계산할 수 있습니다. 이 예측 가능성이 드롭을 복권이 아닌 계획할 수 있는 무언가로 만들어 줍니다. 쫓아볼 만한 도메인은 5일 전에 자신의 릴리스 날짜를 알려주는 셈입니다.

## 4단계: 릴리스, 그리고 캐칭 경쟁

![여러 자동화된 로봇 서버가 열린 게이트를 통해 달려가 릴리스되는 순간 단 하나의 떨어지는 도메인 태그를 잡으려는 편집 삽화](../../assets/expired-domains-and-the-drop-cycle-02-release-scramble.jpg)

삭제 대기가 끝나면 도메인은 레지스트리에서 삭제되어 사용 가능한 풀로 돌아옵니다. ICANN의 지침은 명확합니다. 복구 및 삭제 대기 기간 이후 [도메인 이름은 선착순으로 등록 가능하도록 릴리스되어 제공](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20be%20released%20and%20made%20available%20for%20registration%20on%20a%20first%2Dcome%2Dfirst%2Dserved%20basis)됩니다. 이론적으로는 누구나 표준 비용으로 등록할 수 있는 순간입니다. 그러나 현실에서는 가장 좋은 도메인이 레지스트라 검색창을 직접 타이핑하는 사람에게 닿는 경우가 거의 없습니다. 바로 이 순간을 위해 설계된 자동화 시스템들이 릴리스를 두고 경쟁하기 때문입니다.

바로 이 지점에서 [드롭 캐칭](/ko/glossary/backorder/) 서비스가 등장합니다. 검색을 새로고침하며 기다리는 대신, 이 운영자들은 도메인이 릴리스되는 마이크로초 단위의 순간에 레지스트리를 향해 등록 요청을 발사하는 인프라를 구축합니다. 위키피디아의 설명처럼, [이러한 서비스들은 도메인이 사용 가능해지는 순간 자사 서버를 동원해 해당 도메인을 확보하며, 통상 경매 가격으로 제공](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=These%20services%20offer%20to%20dedicate%20their%20servers%20to%20securing%20a%20domain%20name%20upon%20its%20availability)합니다. 그리고 수동으로 시도하는 사람보다 압도적으로 높은 성공률을 보입니다. 위키피디아는 이 비대칭성을 직접적으로 표현합니다. [제한된 자원을 가진 개인은 이러한 드롭 캐칭 업체들과 경쟁하기 어렵습니다](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=Individuals%20with%20their%20limited%20resources%20find%20it%20difficult%20to%20compete%20with%20these%20drop%20catching%20firms). 둘 이상의 서비스가 서로 다른 고객을 위해 동일한 도메인을 캐칭하면, 그들 사이에서 비공개 [경매](/ko/glossary/auction/)가 진행됩니다. 따라서 경쟁이 있는 도메인을 "캐칭"한다는 것은 대개 등록 수수료를 내는 것이 아니라 경매에서 낙찰되는 것을 의미합니다.

플리퍼에게 솔직하게 말하자면, 정말 좋은 도메인은 직접 드롭을 잡는 것이 아니라 캐칭 서비스를 고용하는 것입니다. 사이클을 이해한다는 것은 도메인이 *언제* 잡을 수 있는지, 그리고 *그 가치가 얼마인지*를 아는 것입니다. 실제 캐칭은 백오더 또는 드롭 캐칭 서비스를 통해 이루어지며, 이에 대해서는 [도메인 백오더와 드롭 캐칭](/ko/blog/domain-backorders-and-drop-catching/)에서 다룹니다.

## 드롭된 도메인이 나타나는 곳

![중앙의 돋보기 소싱 허브에서 드롭 목록, 백오더 티켓, 경매 망치, 애프터마켓 스토어프론트의 네 채널로 분기되어 각각 도메인 태그를 운반하는 편집 삽화](../../assets/expired-domains-and-the-drop-cycle-03-where-surface.jpg)

사이클을 이해해도 어디서 지켜봐야 할지 모르면 소용이 없습니다. 드롭되었거나 드롭이 임박한 도메인은 몇 가지 예측 가능한 곳에 나타나며, 실용적인 소싱 루틴은 보통 여러 채널을 동시에 활용합니다.

- **드롭 목록 및 만료 도메인 데이터베이스.** 공개 및 유료 목록은 매일 삭제 대기에 진입하는 도메인을 게시하며, 길이, [TLD](/ko/glossary/tld/), 키워드, 연령, 링크 지표 등으로 필터링할 수 있습니다. 릴리스를 앞둔 관심 도메인 감시 목록을 위한 원시 피드입니다.
- **백오더 및 드롭 캐칭 플랫폼.** 직접 달력을 지켜보는 대신 백오더를 신청하면 서비스가 릴리스 시 대신 경쟁합니다. 수요가 있는 도메인에 접근하는 현실적인 방법입니다. [도메인 백오더와 드롭 캐칭](/ko/blog/domain-backorders-and-drop-catching/)을 참조하세요.
- **만료 도메인 경매.** 많은 레지스트라는 가치 있는 만료 인벤토리를 공개 드롭에 내놓지 않고, 유예 창 중 또는 이후에 자체 만료 경매로 라우팅합니다. 이는 [도메인 경매에서 이기는 법](/ko/blog/how-to-win-domain-auctions/)에서 다루는 더 넓은 채널과 겹칩니다.
- **애프터마켓 마켓플레이스.** 다른 사람이 캐칭했거나 복구 후 재매물로 나온 도메인은 [애프터마켓](/ko/glossary/aftermarket/)에서 재판매됩니다. 드롭 자체는 아니지만, 드롭 후 많은 인벤토리가 결국 이곳으로 흘러옵니다.

플리퍼의 우위는 채널과 도메인을 적절히 매칭하는 데 있습니다. 경쟁이 낮은 공개 드롭 목록의 도메인은 핸드 레지스터에 가까운 접근이 유효하지만, 프리미엄 한 단어 도메인은 백오더와 경매 예산이 필요합니다. 새 문자열을 직접 등록하는 것이 본인의 접근법이라면, 그것도 정당하고 다른 경로이며 [플립용 도메인 핸드 레지스터](/ko/blog/hand-registering-domains-to-flip/)에서 다룹니다.

## 플리퍼의 관점에서 사이클 읽기

각 단계를 종합하면 드롭 사이클은 더 이상 미스터리가 아니라 행동할 수 있는 일정표가 됩니다. 메커니즘에서 두 가지 규칙이 자연스럽게 도출됩니다.

**만료일이 아닌 삭제 대기를 주시하세요.** "만료"는 "사용 가능"이 아닙니다. 이전 소유자는 [자동 갱신](/ko/glossary/domain-renewal/) 창을 통해 우선권을 가지며, 복구 기간 내내 상당한 비용을 치르더라도 도메인을 되찾을 수 있습니다. 소유자가 만료 사실을 인지하면 가치 있는 도메인의 상당 수가 이 단계에서 회수됩니다. 따라서 삭제 대기까지 살아남은 도메인은 소유자가 진정으로 포기한 것일 가능성이 높습니다. 5일이라는 창은 고정되어 있으므로, 정확히 타이밍을 잡을 수 있는 유일한 단계입니다. 백오더 서비스들이 전체 운영을 이 단계에 맞추는 이유가 바로 이것입니다.

**실사는 도메인과 함께 따라옵니다.** 드롭된 도메인은 자신의 이력을 물려받으며, 모든 이력이 좋은 것은 아닙니다. 오래된 도메인에 입찰하기 전에 이전 사용 내역, [WHOIS](/ko/glossary/whois/) 및 소유권 이력, 모든 [레지스트라](/ko/glossary/registrar/) 잠금 여부, 그리고 문제 있는 콘텐츠가 있었는지 확인하십시오. 브랜드를 침해한 도메인은 현재 소유자인 여러분에게도 [UDRP](/ko/glossary/udrp/) 분쟁을 유발할 수 있으며, 기존 백링크가 금처럼 보여도 스팸일 수 있습니다. 드롭은 자산과 그 짐을 함께 건네줍니다.

사이클은 이를 운에 맡기지 않고 배관처럼 이해하는 사람에게 보상을 줍니다. 타이밍은 공개되어 있고, 단계는 고정되어 있으며, 도메인은 일정대로 풀립니다. 소싱 우위와 갱신 실패의 차이는 어떤 드롭 도메인이 잡을 가치가 있는지 아는 것에 있습니다. 이는 타이밍의 기술이 아니라 가치 평가의 기술입니다. 이것이 우리가 [도메인 플리핑](/ko/blog/domain-flipping/) 시리즈에서 다루는 더 큰 기법의 상류 공급 단계입니다.

## Namefi의 관점

훌륭한 드롭 도메인을 잡는 것은 절반에 불과합니다. 다음번에 도메인이 이전될 때, 가치 높은 [도메인 거래](/ko/glossary/domain-trading/)가 항상 직면하는 마찰에 부딪힙니다. 구매자는 도메인이 이전되기 전에는 대금을 지불하지 않고, 판매자는 대금을 받기 전에는 도메인을 이전하지 않으며, 레지스트라 간 [인증 코드](/ko/glossary/auth-code/) 인도 과정에서 불안한 공백이 생깁니다. 이 교착 상태 때문에 [에스크로](/ko/glossary/escrow/)가 존재하며, 오래되고 링크가 풍부한 도메인일수록 이 문제는 더 첨예해집니다.

[Namefi](https://namefi.io)는 바로 이 간극을 줄이기 위해 만들어졌습니다. 토큰화된 소유권은 실제 ICANN 도메인의 제어권 확인과 이전을 더 쉽게 하며, [DNS](/ko/glossary/dns/) 연속성을 보장하여 드롭에서 잡은 도메인을 플립할 때도 깔끔하게 계속 작동합니다. 드롭 사이클에서 소싱하는 플리퍼에게, 출구 단계의 결제 마찰이 줄어든다는 것은 어렵게 잡아낸 캐칭이 실제 완료된 거래로 이어질 가능성이 높아진다는 의미입니다.

## 친절한 면책 고지 (꼭 읽어주세요!)

> 저희는 변호사, 회계사, 금융 자문사, 의사가 아니며, **이 글의 어떤 내용도 법적, 금융적, 세무적, 회계적, 의학적 또는 기타 전문적 조언이 아닙니다.** 이 글은 자체 교육과 고객 편의를 위해 작성되었습니다. 여기의 정보는 구식이거나, 지역에 따라 다를 수 있거나, 단순히 틀릴 수 있습니다. 저희도 실수를 합니다.
>
> 중요한 결정을 내리기 전에 **반드시 실제 전문가와 상담하세요(진심으로!)**. 그게 맞지 않는다면, 친구, 트위터, Reddit, AI, 또는 점쟁이에게 물어보세요. 요약하면: **DOYR - 스스로 조사하세요**. 함께 배우고 즐겨봅시다.

## 출처 및 추가 자료

- ICANN — [.com 레지스트리 계약, 부록 7 (자동 갱신 유예 기간 45일; 복구 기간 30일; 삭제 대기 5일)](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20value%20of%20the%20Auto%2DRenew%20Grace%20Period%20is%2045%20calendar%20days)
- ICANN — [등록자 FAQ: 도메인 이름 갱신 및 만료 (30일 복구, 5일 PendingDelete, 선착순 릴리스)](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20enter%20into%20a%20redemption%20period%20for%2030%20days)
- ICANN — [복구 유예 기간 중 도메인 복구에 관하여 (30일 RGP)](https://www.icann.org/resources/pages/grace-2013-05-03-en#:~:text=30%2Dday%20Redemption%20Grace%20Period%20%28RGP%29)
- Wikipedia — [도메인 드롭 캐칭 (드롭/스나이핑 정의; 복구 기간 보통 30~90일 및 약 US$100 수수료; 5일 삭제 대기; 드롭 캐칭 서비스)](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)
- Wikipedia — [도메인 이름 레지스트라 (gTLD 최대 10년 기간; 소매 `.com` 가격)](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)
- Wikipedia — [도메인 이름 투기 (도메이닝 및 도메인 플리핑)](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=is%20the%20practice%20of%20identifying%20and%20registering%20or%20acquiring%20generic%20Internet%20domain%20names%20as%20an%20investment)
