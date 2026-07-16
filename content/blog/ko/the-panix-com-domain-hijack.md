---
title: 'Panix.com 도메인 하이재킹: 5일 자동 승인 규칙이 뉴욕 최초의 ISP를 빼앗은 방법'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 18
format: case-study
description: '2005년 1월, panix.com — 뉴욕 최초의 상업용 ISP 도메인 — 이 도난된 신용카드를 이용한 사기 이전을 통해 호주의 등록 기관으로 넘어갔고, 며칠간 웹과 이메일이 마비되었습니다. 당시 시행 중이던 레지스트라 간 자동 승인 이전 규칙이 이를 가능하게 했으며, 사후 수습 과정은 도메인 이전 정책을 전면 개편하는 계기가 되었습니다.'
keywords: ['panix.com', 'panix 도메인 하이재킹', '도메인 하이재킹', '레지스트라 간 이전', 'Melbourne IT', 'Dotster', 'Fibranet', 'ICANN 이전 정책', '레지스트라 잠금', 'clientTransferProhibited', '도메인 보안', 'DNS 하이재킹', 'EPP 인증 코드']
relatedArticles:
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/the-perl-com-domain-theft/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-sex-com-heist-the-forged-letter/
  - /ko/blog/the-syrian-electronic-army-nyt-hijack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/dns/
  - /ko/glossary/tld/
  - /ko/glossary/registry/
---

미국 역사상 가장 오래된 상업용 인터넷 서비스 제공업체 중 하나가 15년 넘게 단 하나의 주소에 의존해왔습니다. 바로 **panix.com**입니다. 그리고 2005년 1월의 긴 연휴 주말, 누군가가 그 주소를 빼앗아갔습니다.

서버를 해킹한 것도 아니었고, 비밀번호를 알아낸 것도 아니었습니다. 범인은 이전 신청서를 작성하고, 도난된 신용카드로 결제한 뒤, 새로 도입된 [ICANN](/ko/glossary/icann/) 규칙이 나머지를 처리하길 기다렸습니다. 불과 몇 시간 만에 panix.com의 소유권은 호주의 한 기업으로 넘어갔고, DNS는 영국의 호스팅 업체를 가리키게 되었으며, 이메일은 캐나다의 또 다른 서버로 우회되었습니다. 이 모든 일이 Panix 운영진이 토요일 밤을 자는 사이에, 아무런 경고도 없이 벌어졌습니다.

이것은 익스플로잇이 아닌 행정 서류가 뉴욕 최고(最古)의 ISP를 탈취한 이야기이며, 그 수습 과정이 도메인 이동 권한을 규정하는 규칙을 어떻게 다시 쓰게 했는지에 관한 기록입니다.

## 모든 사업이 도메인 하나에 달려 있던 선구적인 ISP

Panix — Public Access Networks Corporation — 은 결코 작은 존재가 아니었습니다. 1989년 설립된 이 회사는 Wikipedia에 따르면 [The World과 NetCom에 이어 세계에서 세 번째로 오래된 ISP](https://en.wikipedia.org/wiki/Panix_(ISP)#:~:text=third%2Doldest%20ISP%20in%20the%20world%20after%20The%20World%20and%20NetCom)였습니다. 뉴욕시 초기 상업 인터넷의 핵심 인프라로서 쉘 계정, 이메일, 웹 호스팅, 그리고 수천 명의 뉴욕 시민이 인터넷에 접속하던 다이얼업·광대역 연결을 제공했습니다.

그리고 당시나 지금이나 거의 모든 인터넷 사업체와 마찬가지로, Panix의 정체성은 곧 도메인이었습니다. 고객 메일박스는 `@panix.com`으로 끝났고, 웹 서버는 `www.panix.com`으로 응답했습니다. 회사 전체 — 브랜드, 연결 가능성, 고객 이메일이 실제로 전달되게 해주는 모든 것 — 이 하나의 이름에 연결된 DNS 레코드에 달려 있었습니다. 그 이름에 대한 통제권을 잃는다는 것은 마케팅 자산을 잃는 게 아니라 사업의 신경계를 잃는 것이었습니다.

그리고 정확히 그 일이 벌어졌습니다.

## 2005년 1월: 사기 이전

법적 기록은 날짜를 정확히 명시하고 있습니다. 법률 회사 Davis Wright Tremaine이 당시 정리한 바에 따르면, [2005년 1월 14일 금요일, 뉴욕 기반의 인터넷 서비스 제공업체 panix.com의 도메인이 무단으로 제3자에게 이전되는 고프로파일 하이재킹이 발생했습니다](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=On%20Friday%2C%20Jan.%2014%2C%202005%2C%20a%20high%2Dprofile%20hijacking%20occurred).

그 주말의 이른 새벽, 피해가 현실로 드러났습니다. The Register는 사건이 전개되는 과정을 보도하면서 범행 구조를 한 문장으로 요약했는데, 지금 읽어도 마치 범행 설계도 같습니다. [panix.com의 소유권은 호주의 기업으로 이전되었고, 실제 DNS 레코드는 영국의 기업으로 옮겨졌으며, Panix.com의 메일은 캐나다의 또 다른 기업으로 우회되었습니다](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=The%20ownership%20of%20panix.com%20was%20moved%20to%20a%20company%20in%20Australia).

1월 16일, 더 넓은 기술 커뮤니티에 소식이 퍼진 Slashdot은 직설적으로 전했습니다. [뉴욕 최초의 상업용 인터넷 서비스 제공업체 Panix의 도메인 'panix.com'이 신원 미상의 자들에 의해 하이재킹되었습니다](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked).

Panix 측에서 가장 충격적이었던 점은 침묵이었습니다. 1989년 설립된 뉴욕 최고(最古)의 상업용 ISP인 이 회사는 [자신도, 자사의 레지스트라도 제안된 변경 사항에 대한 어떠한 통보도 받지 못했다](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=neither%20it%20nor%20its%20registrar%20received%20any%20notification%20of%20the%20proposed%20changes)고 밝혔습니다. 도메인을 빼앗아간 이전은 정당한 소유자가 보기에 이미 완료된 뒤에야 비로소 존재를 드러냈습니다.

## 피해: 며칠간 마비된 웹과 이메일

![해가 저문 사이 집문서가 바다 건너 낯선 이의 책상으로 조용히 넘어가는 장면을 묘사한 생동감 넘치는 컨셉 아트 — 자정에 도장이 찍히고, 정당한 소유자는 깊이 잠들어 있다](../../assets/the-panix-com-domain-hijack-01-hijack.jpg)

하이재킹된 도메인은 단순히 꺼지고 켜지는 스위치가 아닙니다. 피해는 느리고 지저분하게 번지며, 그중 가장 큰 피해는 이메일에서 발생합니다.

도메인의 DNS를 장악하면 이메일이 어디로 전달될지도 통제할 수 있습니다. panix.com의 메일 레코드를 변경함으로써 공격자들은 ISP 전체 고객의 우체국 역할을 스스로 맡게 되었습니다. 청구서, 비밀번호 재설정 메일, 업무 서신, 개인 메시지 등 수신 메일이 Panix 서버로 오지 않고 공격자가 통제하는 서버로 흘러들어갔습니다. InfoWorld는 사건 이후 보도에서 이번 하이재킹으로 [일부 Panix 고객이 이틀간 이메일을 사용하지 못했으며](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html), 주말 동안 수백 통의 메시지가 소실되었을 가능성이 있다고 전했습니다.

하이재킹 중에 잘못 전달된 이메일은 단순히 지연되는 것이 아닙니다. 대부분은 영원히 사라집니다 — 반송되거나, 삭제되거나, 전혀 수신하지 말아야 할 서버에 조용히 삼켜집니다. "내 이메일이 제대로 왔는가"로 서비스 가치를 판단하는 고객들에게 며칠간의 메일 오전송은 사실상 최악의 장애나 다름없었습니다.

고객들이 할 수 있는 것은 아무것도 없었습니다. 문제는 Panix의 서버에 있지 않았습니다 — 서버는 정상 운영 중이었습니다. 문제는 [도메인 이름 시스템](/ko/glossary/dns/)의 글로벌 라우팅 테이블에 있었습니다. 호주의 [레지스트라](/ko/glossary/registrar/)가 사기 요청에 응해 panix.com이 이제 다른 누군가의 것이라고 세계에 알려버린 것입니다.

## 사건 경위: 자동 승인 이전의 허점

![인증 확인도, 서명도, 경비도 없이 거대한 고무 도장이 빛나는 도메인 키 이전 양식에 '승인' 도장을 꽝 찍는 장면을 묘사한 생동감 넘치는 컨셉 아트 — 배경 시계는 5일 카운트다운 중](../../assets/the-panix-com-domain-hijack-02-transfer-loophole.jpg)

Panix 사건이 단순한 보안 사고를 넘어 역사적인 사례로 남은 이유가 여기 있습니다. 아무도 침입하지 않았습니다. 시스템은 설계된 대로 정확하게 작동했습니다. 설계 자체가 취약점이었습니다.

사건의 구조는 중개업체들의 연쇄를 통해 이루어졌습니다. Panix의 도메인은 워싱턴주 밴쿠버에 위치한 레지스트라 **Dotster**에 등록되어 있었습니다. 사기 이전 요청은 영국 기반의 [리셀러](/ko/glossary/reseller/) **Fibranet Services Ltd.**의 계정을 통해 제출되어, 호주의 대형 레지스트라 **Melbourne IT**로 올라갔습니다. InfoWorld의 보도에 따르면 [Melbourne IT Ltd.의 실수로 도난된 신용카드를 사용한 사기꾼들이 Panix.com의 통제권을 가져갈 수 있었으며](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html), 이전에 사용된 계정은 [도난된 신용카드로 개설된 사기 계정](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)이었습니다.

그러나 신용카드 사기는 계정 개설에만 쓰였습니다. 도메인을 실제로 이동시킨 것은 정책이었습니다. ICANN은 불과 몇 주 전인 2004년 11월에 발효된 새로운 레지스트라 간 이전 절차를 도입했는데, 이 절차는 *기본 승인* 원칙을 근간으로 했습니다. The Register의 설명에 따르면, 새 체계 하에서 [지난 11월 발효된 이 규칙은 도메인 소유자가 반대하지 않는 한 레지스트리 간 이전 요청이 5일 후 자동으로 승인되도록 규정했습니다](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=automatically%20approved%20after%20five%20days%20unless%20countermanded%20by%20the%20domain%20owner).

다시 한번 읽어보십시오 — 이것이 사건의 전부입니다. 침묵은 *동의*를 의미했습니다. 정당한 소유자가 아무 조치도 취하지 않으면 — 예를 들어 통보 자체를 받지 못했기 때문에 — 이전이 자동으로 완료되었습니다. Davis Wright Tremaine은 법률적 관점에서 같은 함정을 이렇게 설명했습니다. 새 규칙은 [소유자가 5일 이내에 이전 요청에 이의를 제기하지 않으면 도메인이 자동으로 이전되기 때문에 오히려 사기 이전을 더 쉽게 만들 수 있다](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=automatically%20transferred%20unless%20the%20owner%20countermands%20the%20transfer%20request%20within%20five%20days)고 지적했습니다.

실패들을 층층이 쌓아보면 그림이 더욱 암담해집니다. *이전 받는* 레지스트라(Fibranet를 통한 Melbourne IT)는 도난된 카드로 뒷받침된 요청을 받아들이고 나중에 스스로 인정했듯이 [요청을 제대로 검증하지 않았습니다](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=failed%20to%20properly%20verify%20the%20request). *이전 내주는* 레지스트라(Dotster)와 정당한 소유자(Panix)는 실질적인 통보를 받지 못해 아무런 이의도 제기하지 못했습니다. 그리고 정책의 기본값 — 이의가 없으면 승인 — 은 그 침묵을 완성된 절도로 바꾸었습니다. 방화벽은 뚫리지 않았습니다. 서류가 공격 도구였습니다.

## 복구, 그리고 그것이 촉발한 정책 개혁

복구는, 사람이 개입하자마자, 빠르게 이루어졌습니다. 그리고 이것 자체가 하나의 고발이었습니다. 이전이 처음부터 승인되어서는 안 되었음을 증명했기 때문입니다.

일요일에는 이미 [Panix가 도메인을 탈취해 보관하고 있던 호주의 도메인 호스팅·등록 기업 Melbourne IT로부터 panix.com을 되찾아와](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=Panix%20had%20recovered%20its%20Panix.com%20domain) Dotster의 원래 위치로 돌려놓은 상태였습니다. [레지스트리](/ko/glossary/registry/) 수준의 수정은 거의 즉각적으로 이루어졌지만, 전 세계적인 복구는 그렇지 않았습니다. DNS는 명령에 따라 즉시 기억을 지우지 않기 때문입니다. The Register의 보도에 따르면 [루트 서버](/ko/glossary/root-zone/)는 빠르게 업데이트되었지만 DNS의 분산 특성상 전 세계 정상화까지 최대 24시간이 소요되었습니다 — 전 세계 모든 사용자가 실제 panix.com을 다시 보기 위해서는 전 세계 캐시가 만료되어야 했습니다.

Melbourne IT는 그 공로를 인정받을 만하게도 사실을 숨기지 않았습니다. 이틀 뒤 The Register는 [한 호주 도메인 레지스트라가 지난 주말 도메인 이름 하이재킹에서 자사의 역할을 인정했다고](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=An%20Australian%20domain%20registrar%20has%20admitted%20to%20its%20part) 보도했으며, Melbourne IT는 이전 프로세스에서 수행되지 않은 검증 단계를 실패 원인으로 지목하고 해당 허점이 폐쇄되었다고 약속했습니다.

그러나 더 중요한 결과는 구조적 변화였습니다. Panix는 이후 이전 보안 문제를 둘러싼 광범위한 재검토에서 교과서적인 사례가 되었습니다. ICANN 보안 및 안정성 자문위원회는 2005년 보고서 [*도메인 이름 하이재킹: 사례, 위협, 위험 및 시정 조치*](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)를 발표하며 레지스트라가 실제 [등록자](/ko/glossary/registrant/)의 확인 없이 이전을 수락하는 바로 이 유형의 실패를 분석했습니다. 시스템을 강화한 지속적인 개선 조치들은 이 사건과 같은 주말들에서 직접 비롯되었습니다.

- **기본적인 레지스트라 잠금.** `clientTransferProhibited`로 설정된 도메인은 정당한 소유자가 잠금을 해제하기 전까지 이전 자체가 거부됩니다. 한때 선택적 옵션이었던 이 설정이 많은 레지스트라에서 기본 상태가 되었습니다 — 자동 승인 규칙도 무력화할 수 없는 브레이크가 생긴 것입니다.
- **[인증 코드](/ko/glossary/auth-code/)(EPP 이전 코드).** 현재의 [gTLD](/ko/glossary/gtld/) 이전에는 *이전 내주는* 레지스트라가 검증된 등록인에게만 공개하는 비밀 인증 코드가 필요합니다. 이로써 이전 받는 레지스트라가 서류만으로 도메인을 가져가는 것이 불가능해졌습니다.
- **더 엄격한 확인 의무와 이 같은 사기 이전을 신속하게 되돌리기 위한 긴급 연락 채널을 담은 공식 [ICANN 이전 정책](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy).**

Panix 하이재킹이 이러한 메커니즘을 단독으로 탄생시킨 것은 아닙니다. 그러나 이 사건은 그것들이 필요하다고 주장할 때 모든 사람이 가리키는 사례가 되었습니다.

## 이전 잠금과 본인 확인이 주는 교훈

날짜와 레지스트라 이름을 지워도 Panix 사건은 몇 가지 오래 남을 교훈을 남깁니다.

1. **기본 허용은 보안 결정이며, 대개 잘못된 결정입니다.** 2005년의 가장 위험한 설계 선택은 *침묵이 동의를 의미한다*는 것이었습니다. 소유자가 아무것도 하지 않으면 완료되는 이전은 소유자가 항상 상황을 주시하고 언제나 연락 가능하다고 가정합니다. 연휴 주말에는 그 어느 쪽도 사실이 아닙니다.
2. **신원 확인은 자산을 넘겨주는 쪽이 해야 하며, 받는 쪽만이 해서는 안 됩니다.** 이전 받는 레지스트라는 비즈니스를 원했고 '예'라고 말할 모든 유인이 있었습니다. 진정한 보안은 *이전 내주는* 레지스트라가 검증된 소유자에게만 인증 코드를 공개할 때, 즉 검증이 자산이 실제로 있는 곳에서 이루어질 때 비로소 가능해졌습니다.
3. **잠금을 설정하십시오.** `clientTransferProhibited`는 도메인 소유자가 이 정확한 공격에 대해 사용할 수 있는 가장 저렴하고 효과적인 보호 수단이며, 비용도 전혀 들지 않습니다. 잠긴 도메인은 서류가 아무리 그럴듯해 보여도 조용히 이전될 수 없습니다. 중요한 도메인은 잠근 채로 유지하십시오.
4. **도메인은 단일 실패 지점입니다.** Panix의 서버는 한 번도 침해당하지 않았지만 회사는 사실상 오프라인이 되었습니다. 레지스트리의 레코드 하나가 웹과 이메일 전체를 다른 곳으로 돌릴 수 있다면, 그 레코드는 서버보다 더 강한 보호를 받아야 합니다.
5. **통보에 주의를 기울이십시오.** 5일 이의 제기 기간은 소유자가 이전 통보를 실제로 받고, 또 읽을 때만 보호 수단이 됩니다. 오래된 등록인 이메일, 모니터링되지 않는 관리자 연락처, 또는 연휴 주말은 안전 밸브를 침묵의 실패로 바꾸어버립니다.

## Namefi의 관점

![검증 가능하고 변조 불가능한 도메인 소유권을 표현한 컬러풀한 일러스트 — 녹색 방패와 Namefi 녹색 토큰, DNS 연속성으로 보호되는 도메인 카드](../../assets/the-panix-com-domain-hijack-03-namefi-angle.jpg)

Panix 하이재킹은 본질적으로 *권한* 문제입니다. "이 도메인을 이동시킬 수 있는 사람은 누구인가?"라는 질문이 중개업체들의 연쇄와 기본 승인 타이머에 의해 답변되었으며, 소유권에 대한 강력하고 검증 가능한 증명은 없었습니다. 도난된 신용카드와 5일간의 침묵만으로 시스템은 반대편 대륙의 낯선 사람이 뉴욕의 ISP를 대표한다고 납득해버렸습니다.

[Namefi](https://namefi.io)는 정반대의 전제에서 출발합니다. 도메인에 대한 통제권은 추정되는 것이 아니라 증명 가능해야 한다는 것입니다. [도메인 소유권](/ko/glossary/domain-ownership/)을 DNS와 호환되는 토큰화된 온체인 자산으로 표현함으로써, "이 이름을 누가 보유하고 있는가"라는 행위가 암호학적으로 검증 가능하고 감사 가능해집니다 — 레지스트라가 잘못된 서류를 받아들임으로써 조용히 덮어쓸 수 없는 기록이 됩니다. 이전은 소유자의 키가 승인할 때 이루어지며, 5일 카운트다운이 무인 상태로 만료될 때가 아닙니다. 기본값은 *거부*이며, 동의는 단순히 이의를 제기하지 않는 것이 아니라 능동적으로 증명해야 합니다.

이러한 것들은 Panix가 설립된 1989년에도, 하이재킹이 발생한 2005년에도 존재하지 않았습니다. 그러나 그 주말이 업계 전체에 가르쳐준 교훈을 향해 나아갑니다. 도메인은 침묵에 의해 지배되기에는 너무 중요합니다. 소유권은 요구할 때 증명할 수 있어야 하며, 긴 주말 동안 받은 편지함을 확인하지 않았다는 이유로 낯선 사람이 가져갈 수 없어야 합니다.

## 출처 및 추가 자료

- The Register — [Panix recovers from domain hijack](https://www.theregister.com/2005/01/17/panix_domain_hijack/)
- The Register — [Panix.com hijack: Aussie firm shoulders blame](https://www.theregister.com/2005/01/19/panix_hijack_more/)
- Davis Wright Tremaine — [Guarding Against Domain Name Hijacking](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking)
- InfoWorld — [Australian company takes blame for Panix domain hijack](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)
- Slashdot — [New York's Oldest ISP Gets Domain-Jacked](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked)
- Wikipedia — [Panix (ISP)](https://en.wikipedia.org/wiki/Panix_(ISP))
- Wikipedia — [Domain hijacking](https://en.wikipedia.org/wiki/Domain_hijacking)
- ICANN SSAC — [Domain Name Hijacking: Incidents, Threats, Risks, and Remedial Actions (2005)](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)
- ICANN — [Transfer Policy](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)
- NANOG mailing list archive — [discussion of the panix.com transfer and ICANN remedies](https://diswww.mit.edu/charon/nanog/77162)
