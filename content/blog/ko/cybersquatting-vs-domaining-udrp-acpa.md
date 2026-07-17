---
title: "사이버스쿼팅 vs 합법적 도메인 투자: UDRP와 ACPA 해설"
date: '2026-06-21'
language: ko
tags: ['domains', 'security', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-security
series: domain-flipping-skills
seriesOrder: 17
format: explainer
description: "합법적 도메인 투자가 끝나고 사이버스쿼팅이 시작되는 지점: UDRP 3단계 요건, ACPA, 역도메인 하이재킹, 그리고 안전하게 활동하는 방법."
ogImage: ../../assets/cybersquatting-vs-domaining-udrp-acpa-og.jpg
keywords: ['사이버스쿼팅', '사이버스쿼팅 vs 도메인 투자', 'udrp', 'udrp 3단계 요건', 'acpa', '반사이버스쿼팅소비자보호법', '역도메인 하이재킹', 'rdnh', '악의적 도메인 등록', '도메인 플리핑 합법', '상표 도메인 분쟁', '도메인 분쟁 해결', '합법적 도메인 투자', 'wipo udrp', '도메인 투자 합법']
relatedArticles:
  - /ko/blog/what-is-udrp/
  - /ko/blog/domain-flipping-and-the-law/
  - /ko/blog/domain-flipping/
  - /ko/blog/hand-registering-domains-to-flip/
  - /ko/blog/how-to-sell-a-domain-name-you-own/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-investing/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/domain-investor-field-guide/
relatedGlossary:
  - /ko/glossary/icann/
  - /ko/glossary/registrar/
  - /ko/glossary/tld/
  - /ko/glossary/dns/
  - /ko/glossary/registry/
---

두 사람이 되팔기 위해 도메인을 등록합니다. 한 명은 `solarpanels.com`을 구매하는데, 이는 업계 누구나 원할 수 있는 평범한 사전 단어입니다. 다른 한 명은 `nike-running-shoes.net`을 구매하는데, 이 문자열은 Nike가 존재하기 때문에 가치가 생기는 것입니다. 겉보기에는 같은 행위지만, 법적 위치는 완전히 다릅니다. 전자는 일반적인 [도메인 투자](/ko/glossary/domaining/)입니다. 후자는 [사이버스쿼팅](/ko/glossary/cybersquatting/)이며, 이 이름을 등록한 사람에게서 빼앗기 위해 설계된 두 가지 강력한 제도가 존재합니다.

이 경계선이 이 사업에서 가장 중요한 선이며, 가장 쉽게 실수로 넘어설 수 있는 선이기도 합니다. 이 가이드는 그 경계를 탐색합니다. 사이버스쿼팅이 실제로 무엇인지, UDRP가 도메인을 회수하기 위해 사용하는 3단계 요건, 미국의 [ACPA](/ko/glossary/acpa/)가 금전적 손해배상을 추가하는 방식, 그리고 대부분의 글이 건너뛰는 반대 측면인 역도메인 하이재킹, 즉 브랜드가 합법적인 소유자를 상대로 제도를 악용하는 경우를 다룹니다. 이 글은 [도메인 플리핑과 법률](/ko/blog/domain-flipping-and-the-law/) 및 [도메인 플리핑](/ko/blog/domain-flipping/) 시리즈의 법적 위험 가이드로 함께 읽으시기 바랍니다.

> **법률 자문이 아닙니다.** 이 글은 도메인 소유자를 위한 일반 정보이며 법률 자문이 아닙니다. 결과는 구체적인 사실관계에 따라 달라집니다. 분쟁을 받거나 제기를 고려 중이라면 자격 있는 변호사와 상담하십시오.

## 사이버스쿼팅이란 실제로 무엇인가

사이버스쿼팅은 "다른 사람이 원하는 이름을 등록하는 것"이 아닙니다. 다른 사람의 [상표](/ko/glossary/trademark/)를 이용하기 위해 이름을 등록하는 행위입니다. Wikipedia의 정의가 핵심입니다. 이는 [다른 사람의 상표 영업권으로부터 이익을 취하려는 악의적 의도로 인터넷 도메인명을 등록, 거래하거나 사용하는 행위](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)입니다. 이 정의의 모든 단어가 중요합니다. 행위(등록, 거래, 사용)는 광범위합니다. 의도([악의](/ko/glossary/bad-faith/), 이익 추구)가 판단의 핵심입니다. 그리고 대상은 구체적입니다. 시장 전체가 공유하는 일반 단어가 아니라 *다른 사람의 상표*여야 합니다.

합법적 도메인 투자는 그 의도의 선 반대편에 있습니다. 일반적이거나 서술적이거나 창작된 이름을 구매해 되파는 것은 오래전부터 확립된 사업입니다. `solarpanels.com` 같은 [도메인](/ko/glossary/domain-ownership/)의 가치는 그 단어들이 특정 산업 전체에 유용하기 때문이지, 한 회사의 명성에 편승하기 때문이 아닙니다. 브랜드 요소가 없는 창의적 조어나 짧은 [`.com`](/ko/tld/com/) 또는 [`.io`](/ko/tld/io/) 도메인도 마찬가지입니다. 자산은 문자열 자체이며, 이것이 합법적인 [도메인 거래](/ko/glossary/domain-trading/)의 전부입니다.

문제는 이름의 가치가 단어 자체가 아닌 *브랜드에서* 비롯될 때 시작됩니다. `tesla`에 하이픈이 붙은 접미사를 등록하거나, 유명 상표의 의도적 오타([타이포스쿼팅](/ko/glossary/typosquatting/))를 등록하거나, 제품 출시 직후 새 [TLD](/ko/glossary/tld/)에 브랜드 이름을 등록한다면, 취하려는 가치는 다른 사람의 영업권에서 나오는 것입니다. 바로 이것이 아래의 두 집행 제도가 잡아내도록 설계된 행위입니다.

## UDRP 3단계 요건

![세 개의 자물쇠가 한 줄로 체인으로 연결되어 있고 각각 체크 표시가 있으며, 하나의 도메인 태그를 풀어내는 모습의 편집 일러스트](../../assets/cybersquatting-vs-domaining-udrp-acpa-01-three-locks.jpg)

첫 번째이자 가장 일반적인 제도는 [UDRP](/ko/glossary/udrp/), 즉 통일도메인분쟁해결정책입니다. 인가된 모든 [레지스트라](/ko/glossary/registrar/)는 도메인 등록 시 이에 동의하도록 요구하며, 이것이 법원이 아닌 사설 중재 패널이 도메인 이전을 명령할 수 있는 이유입니다. 전체 절차, 일정, 결과는 [UDRP란 무엇인가](/ko/blog/what-is-udrp/)에서 다루며, 여기서는 테스트 자체에 집중합니다. 도메인 투자자가 이기거나 지는 곳이 바로 이 테스트이기 때문입니다.

신청인은 다음 **세 가지 모두**를 입증해야 합니다. 이는 *결합적(conjunctive)* 요건이며, 이것이 가장 중요한 사실입니다. 어느 하나라도 충족되지 않으면 다른 두 요건이 아무리 강력해도 신청은 기각됩니다.

1. **동일하거나 혼동을 일으킬 정도로 유사함.** 정책에 따르면, [도메인명이 신청인이 권리를 보유한 상표 또는 서비스표와 동일하거나 혼동을 일으킬 정도로 유사해야 합니다](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark%20in%20which%20the%20complainant%20has%20rights). 실무적으로 이 요건은 주로 원고 적격 요건으로 기능합니다. 신청인이 관련 상표를 소유하고 있으며 해당 도메인이 그와 유사하다는 점을 확인합니다.

2. **권리 또는 정당한 이익 없음.** 두 번째 요건은 [등록자가 도메인명에 대해 어떠한 권리나 정당한 이익도 없어야 합니다](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=The%20registrant%20does%20not%20have%20any%20rights%20or%20legitimate%20interests). 진정한 사업 목적, 서술적 의미, 또는 비상업적 표현은 모두 정당한 이익으로 인정될 수 있습니다. 일반 도메인이 브랜드에 근접한 도메인보다 훨씬 안전한 이유가 여기에 있습니다.

3. **악의로 등록되고 사용됨.** 세 번째 요건은 [도메인명이 "악의"로 등록되고 사용되고 있어야 합니다](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=The%20domain%20name%20has%20been%20registered%20and%20the%20domain%20name%20is%20being%20used%20in). **그리고(and)**라는 접속사에 주목해야 합니다. 악의는 등록 시점과 사용 시점 *모두*에 존재해야 합니다. 신청인의 상표가 존재하기 전에 등록된 도메인은 일반적으로 악의로 등록되었다고 볼 수 없습니다. 존재하지 않는 브랜드를 표적으로 삼을 수는 없기 때문입니다.

바로 이 세 번째 요건이 방어 가능한 포트폴리오가 살아남는 지점입니다. UDRP가 인정하는 악의 유형은 구체적입니다. 상표 소유자에게 부당한 가격으로 도메인을 팔기 위해 주로 등록한 경우, 브랜드가 자사 이름을 쓰지 못하도록 패턴적으로 차단하기 위해 등록한 경우, 경쟁사를 방해하기 위해 등록한 경우, 또는 상표와 혼동을 일으켜 트래픽을 끌어들이기 위해 도메인을 사용하는 경우가 해당됩니다. 결정적으로, *일반적이거나 서술적인 도메인을 매물로 내놓는 것 자체는 악의가 아닙니다.* 도메인 판매는 합법적인 사업입니다. 구분선은 단어를 거래한 것인지, 아니면 브랜드를 표적으로 삼은 것인지에 있습니다.

도메인 투자자를 위한 실용적인 교훈은 간단합니다. 사전의 단어를 구매하되 상표는 절대 구매하지 마십시오. 그리고 등록 이유와 시기를 기록으로 남겨두십시오. 상표보다 앞선 등록 일자는 종종 결정적인 증거가 됩니다.

## ACPA: 사이버스쿼팅이 실질적인 비용을 초래할 때

![판사 의사봉 옆에 쌓이는 동전 더미, 달러 기호 그림자를 드리운 도메인 태그 열이 있는 편집 일러스트](../../assets/cybersquatting-vs-domaining-udrp-acpa-02-stacking-damages.jpg)

UDRP가 도메인에 할 수 있는 일은 두 가지뿐입니다. 이전하거나 취소하는 것입니다. 손해배상은 없습니다. 강력한 브랜드 또는 특히 심각한 스쿼터를 위해 미국은 더 강한 제도를 만들었습니다.

[1999년](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=1999)에 제정된 반사이버스쿼팅소비자보호법(Anticybersquatting Consumer Protection Act, ACPA)은 연방 소송 원인을 만들었습니다. Wikipedia가 요약하듯, ACPA는 [상표 또는 성명과 혼동을 일으킬 정도로 유사하거나 희석될 수 있는 도메인명을 등록, 거래하거나 사용하는 행위에 대한 소송 원인](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20cause%20of%20action%20for%20registering%2C%20trafficking%20in%2C%20or%20using%20a%20domain%20name%20confusingly%20similar)을 확립했습니다. 이 법의 기준은 UDRP의 의도 요건과 동일합니다. 법적 책임은 [해당 상표로부터 이익을 취하려는 악의적 의도](https://www.law.cornell.edu/uscode/text/15/1125#:~:text=has%20a%20bad%20faith%20intent%20to%20profit%20from%20that%20mark)를 가지고 식별력 있는 상표와 동일하거나 혼동을 일으킬 정도로 유사한 도메인을 등록, 거래하거나 사용한 사람에게 귀속됩니다.

중요한 차이는 구제수단입니다. UDRP는 단순히 도메인을 이전시키는 반면, ACPA는 지갑을 타격할 수 있습니다. 승소한 원고는 법원이 적절하다고 판단하는 [도메인당 1,000달러 이상 100,000달러 이하의 법정 손해배상](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)을 선택할 수 있습니다. 도메인 당. 브랜드 변형 도메인 포트폴리오를 보유한 스쿼터는 도메인 수에 비례하여 커지는 숫자를 보게 됩니다. 도메인을 잃는 것에 더해서입니다.

두 가지 실용적인 포인트가 있습니다. ACPA는 미국법으로, 당사자 또는 레지스트라가 미국과 연관된 경우에 주로 적용됩니다. 반면 UDRP는 레지스트라 계약에 의해 전 세계적으로 적용됩니다. 그리고 두 제도는 상호 배타적이지 않습니다. 브랜드는 빠르고 저렴한 UDRP로 도메인을 확보한 후 ACPA로 손해배상 소송을 제기할 수 있습니다. 합법적인 도메인 투자자에게 이는 대체로 안심이 됩니다. ACPA의 악의적 의도 요건이 UDRP의 세 번째 요건과 동일한 방식으로 선의의 일반 도메인 등록을 보호하기 때문입니다. 스쿼터에게는 수학이 절대 맞지 않는 이유가 됩니다.

## 역도메인 하이재킹: 브랜드가 나쁜 행위자일 때

![대형 기업 브랜드 방패가 작은 일반 도메인 태그를 잡으려 하고, 더 작은 인물이 경고 방패와 깃발을 들어 막는 모습의 편집 일러스트](../../assets/cybersquatting-vs-domaining-udrp-acpa-03-reverse-hijack.jpg)

이 선은 양방향으로 작동하며, 이것이 대부분의 "도메인 플리핑은 합법인가" 기사들이 건너뛰는 부분입니다. 상표는 그 소유자가 유사한 모든 도메인에 권리를 갖는다는 의미가 아닙니다. 브랜드가 분쟁 절차를 이용해 합법적으로 보유한 이름을 소유자에게서 빼앗으려 할 때, 이 남용 행위에는 이름이 있습니다. 역도메인 하이재킹(reverse domain name hijacking)입니다.

Wikipedia는 이를 [실제로 스쿼터가 아닌 도메인 소유자를 상대로 사이버스쿼팅 주장을 제기하여 도메인을 확보하려는 정당한 상표 소유자의 행위](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name%20by%20making%20cybersquatting%20claims)로 정의합니다. UDRP 규정은 패널에게 이에 대응하는 도구를 제공합니다. 15(e)항에 따라, 역도메인 하이재킹 인정은 [악의적으로 신청서를 제출하여 UDRP 행정 절차를 남용한 경우](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=the%20filing%20of%20a%20complaint%20in%20bad%20faith%2C%20resulting%20in%20the%20abuse)에 이루어집니다.

역도메인 하이재킹(RDNH) 인정은 도메인 소유자에게 금전적 보상을 주지는 않지만, 향후 분쟁과 소송에서 신청인의 신뢰도를 손상시키는 공식적이고 공개적인 비난입니다. 전형적인 사례는 일반 도메인을 원했던 브랜드가 구매 기회를 놓치고 UDRP를 지름길로 이용하려는 경우입니다. 신청이 취약해지는 사실관계는 대개 단순합니다. 도메인이 *상표보다 먼저* 등록되었다면, 악의적 등록이 불가능합니다. 깔끔한 일반 도메인을 보유한 투자자에게 RDNH 주장은 진정한 방어 무기입니다. 이는 또한 예방의 대상인 보안 수준의 [도메인 하이재킹](/ko/blog/how-domain-hijacking-actually-happens/)과는 구별됩니다. 후자는 법적 절차에 대응하는 것이 아니라 미리 막아야 하는 공격입니다.

## 경계선 안전하게 지키기

대부분의 안전은 한 푼도 쓰기 전에 결정됩니다. 몇 가지 습관이 포트폴리오를 방어 가능하게 유지합니다.

- **단어를 구매하고, 브랜드는 구매하지 마십시오.** 일반적이거나 서술적이거나 창작된 이름이 안전한 재고입니다. 특정 회사가 존재하기 때문에 가치가 있는 이름이라면 건너뛰십시오. 이름이 브랜드처럼 읽힐지 확신이 없다면, 그 불확실성 자체가 패스하라는 신호입니다.
- **구매 전에 상표 검색을 하십시오.** 정확한 문자열과 명백한 오타 변형에 대한 관련 등록부의 간단한 검색으로 대부분의 문제를 포착할 수 있습니다. 이는 이름과 함께 이전 [등록자](/ko/glossary/registrant/)의 이력을 물려받는 [애프터마켓](/ko/glossary/aftermarket/)에서 특히 중요합니다.
- **기록을 유지하고, 주차 페이지를 깨끗하게 관리하십시오.** 악의는 일반적으로 등록 시점에 존재해야 하므로, 등록 날짜와 이유를 저장해 두십시오. 상표 소유자와 경쟁하는 PPC 광고를 피하십시오. 일반 도메인이 악의적 사용의 증거로 변할 수 있습니다.
- **인바운드 제안을 신중하게 처리하십시오.** 브랜드가 접근해 온다면, *그들의* 필요성을 중심으로 가격을 제시하지 마십시오. 그런 표현 방식은 쉽게 "주로 상표 소유자에게 팔기 위해 등록했다"로 재해석될 수 있습니다.

도메인이 깨끗하고 기록이 깨끗하다면, 이전 자체가 마지막 변수입니다. 고가 거래는 어느 쪽도 먼저 움직이지 않아도 되도록 중립적인 [에스크로](/ko/glossary/escrow/)를 통해 이루어지며, 검증 가능한 보관 체인은 이력이 의문시될 때 도메인을 방어하는 요소 중 하나입니다. [Namefi](https://namefi.io)는 이를 강화합니다. 토큰화된 소유권은 도메인에 내구성 있고 감사 가능한 출처 기록을 제공하는 동시에 완전한 [ICANN](/ko/glossary/icann/) 준수를 유지하므로, 기초 도메인은 UDRP와 ACPA가 규율하는 시스템 안에 완전히 포함됩니다. 토큰화는 증거와 통제력을 강화합니다. 상표법 밖에 도메인을 두는 것이 아니며, 정직한 도구라면 그런 주장을 하지 않을 것입니다.

## 결론

도메인 투자와 사이버스쿼팅은 하나로 구분됩니다. 의도입니다. 단어를 구매하면 투자자입니다. 브랜드를 구매하면 표적이 됩니다. 이름을 빼앗을 수 있는 글로벌 중재 시스템과, 그 위에 도메인당 최대 10만 달러를 청구할 수 있는 미국 법률이 함께 적용됩니다. 같은 선이 반대 방향으로도 여러분을 보호합니다. 합법적인 도메인을 상대로 절차를 남용한 상표 소유자는 역도메인 하이재커로 낙인찍힐 수 있습니다. UDRP 3단계 요건을 완전히 숙지하고, 포트폴리오를 일반 도메인으로 유지하며, 기록을 깨끗이 관리하십시오. 그러면 이 사업의 법적 위험은 마땅한 곳에 머물게 됩니다. 시스템을 악용하려는 사람들에게.

## 출처 및 추가 자료

- Wikipedia — [사이버스쿼팅(정의)](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)
- Wikipedia — [통일도메인분쟁해결정책(3가지 요건)](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark%20in%20which%20the%20complainant%20has%20rights)
- Wikipedia — [반사이버스쿼팅소비자보호법(1999년; 소송 원인)](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20cause%20of%20action%20for%20registering%2C%20trafficking%20in%2C%20or%20using%20a%20domain%20name%20confusingly%20similar)
- Legal Information Institute (Cornell) — [15 U.S.C. § 1125(d) ("악의적 이익 취득 의도")](https://www.law.cornell.edu/uscode/text/15/1125#:~:text=has%20a%20bad%20faith%20intent%20to%20profit%20from%20that%20mark)
- Legal Information Institute (Cornell) — [15 U.S.C. § 1117(d) (법정 손해배상: 도메인당 $1,000–$100,000)](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)
- Wikipedia — [역도메인 하이재킹(정의; UDRP 15(e)항)](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name%20by%20making%20cybersquatting%20claims)
- ICANN — [통일도메인분쟁해결정책](https://www.icann.org/resources/pages/policy-2012-02-25-en) · WIPO — [UDRP 안내서](https://www.wipo.int/amc/en/domains/guide/)
