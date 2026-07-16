---
title: '도메인 재난 EP10: 시리아 전자군이 피싱된 리셀러를 통해 NYTimes.com을 장악한 방법'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 23
format: case-study
description: '2013년 8월 27일, 시리아 전자군은 Melbourne IT의 리셀러를 피싱 공격으로 침투해 nytimes.com과 Twitter 도메인의 DNS 레코드를 변조하여 뉴욕 타임스를 수 시간 동안 오프라인으로 만들었습니다. 레지스트라 체인의 취약 고리가 어떻게 한 신문사의 현관문 장애로 이어졌는지, 그리고 레지스트리 잠금이 무엇을 바꿀 수 있었는지 심층 분석합니다.'
keywords: ['nytimes.com 해킹', '시리아 전자군', 'melbourne it', 'dns 하이재킹', '도메인 하이재킹', '레지스트라 보안', '리셀러 피싱', '레지스트리 잠금', 'dns 레코드', '도메인 네임 서버 공격', 'twitter dns 2013', '도메인 보안', 'serverupdateprohibited']
relatedArticles:
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-panix-com-domain-hijack/
  - /ko/blog/the-curve-finance-dns-hijack/
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
  - /ko/glossary/registry/
  - /ko/glossary/tld/
---

신문사의 도메인 이름은 그 회사의 현관문입니다. 브라우저에 `nytimes.com`을 입력할 때, 우리는 눈에 보이지 않는 체인—도메인 [레지스트리](/ko/glossary/registry/), [레지스트라](/ko/glossary/registrar/), 그리고 때로는 레지스트라 아래의 [리셀러](/ko/glossary/reseller/)—을 신뢰하며, 이 체인이 우리를 실제 편집국으로 안내해 줄 것이라 믿습니다. 평상시에는 이 체인을 의식하지 않습니다. 그러나 2013년 8월 27일, 그 체인이 끊어졌고, 수백만 명의 독자들이 *뉴욕 타임스*의 현관문 앞에 섰을 때, 그곳에는 전혀 다른 누군가의 문이 달려 있었습니다.

그 '누군가'는 **시리아 전자군**(Syrian Electronic Army, SEA)이었습니다. 이들은 아사드 정권을 지지하는 해커 집단으로, 2013년 한 해 동안 서방 언론사들을 표적으로 삼아 왔습니다. 이번 공격에서 SEA는 단 하나의 기사도 변조하지 않았고, 콘텐츠 관리 시스템에도 침투하지 않았습니다. 그들은 한 단계 더 깊이 파고들었습니다. 도메인이 어디를 가리킬지를 결정하는 **DNS 레코드** 수준에서 공격을 감행했고, 몇 시간 동안 지구상에서 가장 많이 읽히는 뉴스 사이트의 주소를 손에 쥐었습니다.

## 도메인은 현관문이고, 현관문의 자물쇠는 당신이 통제하지 못합니다

*뉴욕 타임스*와 같은 기업이 도메인을 등록하면, "이 도메인의 소유자는 누구이며, 어디를 가리키는가"에 관한 권위 있는 기록은 [레지스트리](/ko/glossary/registry/)—`.com`의 경우 Verisign—에 보관되고, **레지스트라**를 통해 관리됩니다. 대형 레지스트라들은 **리셀러**를 통해서도 서비스를 판매합니다. 리셀러는 도메인 서비스를 재판매하는 중소 업체로, 레지스트라 시스템에 대한 자체 로그인 계정을 보유합니다.

이런 계층 구조는 편리하지만, 동시에 가장 약한 고리가 전체 보안 수준을 결정하는 신뢰 사슬이기도 합니다. 공격자가 이 체인의 어느 단계에서든—[등록자](/ko/glossary/registrant/), 레지스트라 직원, 또는 리셀러—인증에 성공하면, 레지스트라 시스템은 설계 원칙에 따라 그를 정당한 소유자로 취급합니다. Melbourne IT의 최고경영자는 이 장애 방식을 한 문장으로 명확히 표현했습니다. ["그들은 정문으로 들어왔습니다."](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door) 유효한 사용자 이름과 비밀번호만 있으면, 시스템은 그 사람을 권한 있는 소유자로 간주합니다. 이것이 문제의 핵심입니다.

## 2013년 8월 27일: nytimes.com이 다른 곳을 가리킨 날

![신문사 현관문 간판이 분리되어 다른 출입구 위에 다시 걸리는 장면을 묘사한 생동감 넘치는 컨셉 아트. 빨간 라우팅 화살표들이 독자들의 무리를 어두운 골목으로 이탈시키고 있다](../../assets/the-syrian-electronic-army-nyt-hijack-01-hijack.jpg)

화요일 오후 늦게, 독자들은 *타임스*에 접속하지 못하게 됐습니다. ABC 뉴스는 [뉴욕 타임스 웹사이트가 "일부 이용자들에게 먹통이 됐다"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=gone%20dark%20for%20some%20users)고 보도했고, 타임스 측은 도메인 레지스트라에 대한 공격으로 ["화요일 오후 독자들에게 사이트 접속이 불가했다"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=unavailable%20to%20readers%20on%20Tuesday%20afternoon)고 확인했습니다. 이는 잠깐의 장애가 아니었습니다. 크리스천 사이언스 모니터는 방문자들이 ["화요일 수 시간 동안 빈 브라우저 화면만 보았다"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=greeted%20with%20blank%20browser%20screens%20for%20several%20hours)고 보도했으며, 설상가상으로 ["이 달 들어 두 번째"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=second%20time%20this%20month) 사이트가 다운된 것이었습니다.

실제로 발생한 일은 레지스트라 수준에서의 **DNS 하이재킹**이었습니다. 공격자들은 `nytimes.com`을 [IP 주소](/ko/glossary/ip-address/)로 변환하는 레코드에 접근해 이를 변조했습니다. 위키피디아의 해당 사건 기록에 따르면, [`NYTimes.com`은 "'SEA에 의해 해킹됨'이라는 메시지를 표시하는 페이지로 DNS가 리다이렉트됐다"](https://en.wikipedia.org/wiki/Syrian_Electronic_Army#:~:text=had%20its%20DNS%20redirected%20to%20a%20page%20that%20displayed%20the%20message)고 합니다. 현관문이 통째로 다른 출입구 위에 다시 걸린 것이었습니다.

*타임스*만이 표적이 아니었습니다. 테크크런치는 실시간으로 취재하면서 ["뉴욕 타임스와 Twitter 네임 서버가 모두 레지스트라 Melbourne IT를 통해 등록된 것으로 확인됐다"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=name%20servers%20appear%20to%20have%20been%20registered%20through%20the%20registrar%20Melbourne%20IT)고 보도했으며, ["Twitter 이미지와 아바타를 제공하는 `twimg.com` 도메인도 SEA 소유로 보이는 서버를 가리키는 변경 사항이 나타났다"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=which%20serves%20up%20Twitter%20images%20and%20avatars)고 밝혔습니다. Twitter 메인 사이트는 대부분 정상을 유지했지만, 이미지·아바타 도메인이 흔들리면서 일부 사용자들은 잠시 이미지가 깨진 화면을 보게 됐습니다.

## 피해: 수 시간의 암흑, 그리고 신뢰할 수 없는 리다이렉트

뉴스 조직에게 하이재킹의 대가는 페이지뷰 손실만으로 측정되지 않습니다. 신뢰의 손실로 측정됩니다. 서비스 중단이 지속되는 동안, `nytimes.com`에 접속한 모든 사람은 공격자가 설정한 경로로 안내받고 있었습니다. *타임스*의 최고정보책임자 마크 프론스는 직원들에게 이 장애가 ["시리아 전자군, 또는 그들인 척하려는 누군가의 악의적인 외부 공격의 결과"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=was%20the%20result%20of%20a%20malicious%20external%20attack)라고 전하며, 도메인이 신문사의 통제권을 벗어난 동안 이메일 사용에 주의를 기울이라고 경고했습니다.

하이재킹된 DNS 레코드가 실제로 가능하게 하는 것들을 생각해 보십시오. 공격자는 도메인 이름이 어디로 해석될지를 결정할 수 있으므로, 변조된 페이지를 띄울 수도 있고(실제로 그렇게 했듯이), 그와 똑같이 설득력 있는 가짜 로그인 페이지를 제공하거나, 자격증명을 수집하거나, 트래픽을 가로채는 것도 얼마든지 가능합니다. 변조 페이지는 눈에 잘 띕니다. 반면 *조용한* DNS 하이재킹은 훨씬 더 위험합니다. 그리고 두 경우 모두 동일한 취약점을 이용합니다. 같은 사건에서 허핑턴 포스트 UK의 도메인도 영향을 받았다는 사실은, 이 침해가 특정 편집국 하나를 겨냥한 단발성 장난이 아니라 레지스트라 계정 침해였음을 잘 보여줍니다.

## 어떻게 일어났는가: 신문사가 아닌 리셀러를 피싱하다

![피싱된 황금 열쇠가 추상적인 라우팅 다이얼로 가득한 빛나는 제어실 문으로 미끄러져 들어가는 장면의 생동감 넘치는 컨셉 아트. 그림자 손이 빛나는 주소 화살표 원장을 수정하고, 가짜 이메일 봉투가 자물쇠 속으로 녹아 들어가고 있다](../../assets/the-syrian-electronic-army-nyt-hijack-02-reseller-phish.jpg)

여기서 주목할 부분이 있습니다. SEA는 단 한 번도 *뉴욕 타임스*에 직접 침투할 필요가 없었습니다. 타임스의 서버나 CMS에는 손도 대지 않았습니다. 그들이 공격한 것은 레지스트라 *아래*에 있는 체인이었습니다.

침입 경로는 Melbourne IT의 미국 기반 리셀러에 전송된 **스피어 피싱 이메일**이었습니다. The Next Web의 보도에 따르면, Melbourne IT는 ["SEA가 피싱 수법을 사용해 로그인 정보를 탈취했다"](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter#:~:text=used%20phishing%20tactics%20to%20get%20hold%20of%20the%20log)고 확인했습니다. 리셀러 직원들은 이메일 자격증명을 내어주도록 속았고, 공격자들은 그 메일함을 뒤져 레지스트라 로그인 정보를 손에 넣었습니다. 그 다음은 간단했습니다. ["Melbourne IT 리셀러의 자격증명(사용자 이름과 비밀번호)으로 Melbourne IT 시스템의 리셀러 계정에 접근했고,"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=credentials%20of%20a%20Melbourne%20IT%20reseller) 일단 내부에 진입한 뒤 공격자들은 ["*타임스*를 포함한 여러 도메인 이름의 DNS 레코드를 변경했습니다."](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=changed%20the%20DNS%20records%20of%20several%20domain%20names)

테크크런치의 보도 역시 단도직입적입니다. ["해당 리셀러 계정에 등록된 여러 도메인 이름의 DNS 레코드가 변경됐으며—`nytimes.com`도 포함됐습니다."](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=DNS%20records%20of%20several%20domain%20names%20on%20that%20reseller%20account%20were%20changed)

이것이 레지스트라 체인 공격을 매력적으로 만드는 비대칭성입니다. *타임스*가 자사 인프라를 아무리 철저히 강화했더라도 아무 소용이 없었을 것입니다. 취약한 계정은 편집국과 여러 단계 거리가 있는 제3자 리셀러의 것이었기 때문입니다. 소규모 업체의 직원 몇 명을 겨냥한 스피어 피싱 하나로, 수백만 명이 읽는 신문사를 리다이렉트하기에 충분했습니다.

## 대응과 이후

Melbourne IT가 상황을 파악하자 복구는 곧바로 이루어졌습니다. 이런 공격이 *레지스트라를 통제하고 있을 때는* 얼마나 쉽게 되돌릴 수 있는지를 잘 보여주는 사례이기도 합니다. 회사는 올바른 설정을 복원했습니다. [변경된 DNS 레코드를 되돌리고 추가 변경을 막기 위해 "잠금"을 걸었으며](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=reverted%20the%20altered%20DNS%20records), 침해된 리셀러 계정의 비밀번호를 변경하고 로그를 확인해 침입 경로를 추적했습니다. *타임스*는 수요일 이른 시간 서비스를 복원했습니다.

그러나 이 사건 전체에서 가장 시사적인 세부 사항은, *피해가 거기서 멈춘 이유*입니다. 동일한 리셀러 계정에 등록된 일부 도메인은 전혀 영향을 받지 않았습니다. 소유자들이 더 강력한 보호 기능을 활성화해 두었기 때문입니다. Melbourne IT는 이렇게 말했습니다. ["미션 크리티컬 도메인의 경우, .com을 포함한 도메인 이름 레지스트리에서 제공하는 추가적인 레지스트리 잠금 기능을 활용하도록 권장합니다. 해당 리셀러 계정에서 표적이 된 일부 도메인 이름은 이 잠금 기능이 활성화되어 있어 영향을 받지 않았습니다."](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=For%20mission%20critical%20names%20we%20recommend%20that%20domain%20name%20owners%20take%20advantage%20of%20additional%20registry%20lock)

레지스트리 잠금은 도메인을 특정 상태로 설정합니다([WHOIS](/ko/glossary/whois/)에서 `serverUpdateProhibited`와 같은 플래그로 확인할 수 있습니다). 이 상태에서는 보다 엄격한 별도 절차를 거치지 않으면 레지스트리가 변경 요청을 거부합니다. 당시 도메인 업계 전문가들이 지적했듯, Twitter의 레코드에는 정확히 그런 [Verisign 잠금 상태](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/#:~:text=serverUpdateProhibited)가 설정되어 있었습니다. 피싱으로 탈취한 리셀러 비밀번호로는 [레지스트리 잠금](/ko/glossary/registry-lock/)을 무력화할 수 없습니다. 그리고 바로 이 단 하나의 설정 선택이, "수 시간 동안 다운"과 "전혀 영향 없음"의 차이를 만들어 냈습니다.

## 레지스트라·리셀러 체인과 레지스트리 잠금에서 얻는 교훈

2013년 8월 27일의 하이재킹은 장애 체인의 모든 고리가 눈에 선명히 드러나는 거의 완벽한 교과서적 사례입니다.

1. **도메인의 보안 수준은 그것을 변경할 수 있는 가장 취약한 계정의 수준과 같습니다.** 여기에는 레지스트라 직원과 그 아래의 리셀러가 모두 포함되며, 이들 중 누구도 도메인 소유자가 직접 통제하지 못합니다. *타임스*는 자사 서버에서 아무런 잘못을 저지르지 않았습니다. 침해는 몇 단계나 떨어진 곳에서 발생했습니다.
2. **피싱은 방화벽을 이깁니다.** 어떤 정교한 익스플로잇도 사용되지 않았습니다. 리셀러 직원 몇 명에게 보낸 가짜 이메일 하나로 탈취한 자격증명을, 레지스트라 시스템은 완전히 권한 있는 것으로 처리했습니다. ["그들은 정문으로 들어왔습니다."](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door)
3. **레지스트리 잠금이 실질적으로 중요한 보호 수단이었습니다.** [추가적인 레지스트리 잠금 기능](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=additional%20registry%20lock%20features)이 활성화된 도메인들은 "영향을 받지 않았습니다." 미션 크리티컬 도메인의 경우, 레지스트리 잠금(레지스트라 잠금 및 레지스트라 계정의 2단계 인증과 함께)은 선택적 강화 수단이 아니라 기본 요건입니다.
4. **DNS 변경은 강력하고 빠릅니다.** 네임 서버 또는 A 레코드 하나를 수정하면 전체 브랜드가 즉시 다른 곳으로 향합니다. 침해된 계정 하나가 닿을 수 있는 모든 도메인이 피해를 입을 수 있습니다.
5. **자체 레코드를 모니터링하십시오.** WHOIS 및 DNS 모니터링을 통해 무단 변경을 수분 내에 탐지할 수 있습니다. 예상치 못한 네임 서버 변경을 빨리 알아챌수록, 서비스 중단 시간은 짧아집니다.

## Namefi의 관점

![검증 가능하고 변조 불가능한 도메인 소유권을 표현한 컬러 일러스트. 녹색 방패, 녹색 Namefi 토큰, DNS 연속성으로 보호된 도메인 카드](../../assets/the-syrian-electronic-army-nyt-hijack-03-namefi-angle.jpg)

SEA의 하이재킹은 근본적으로 **권한 인증** 문제였습니다. 레지스트라 시스템은 실제 소유자와 피싱된 비밀번호를 손에 쥔 누군가를 구분할 방법이 없었고, 그래서 설계된 대로 동작했습니다—변경 요청을 수락한 것입니다. 실제로 효과가 있었던 모든 방어 수단—레지스트리 잠금, 별도 채널을 통한 확인, 신중한 모니터링—은 결국 변경 요청이 진짜 소유자로부터 왔음을 *증명*하기 위한 문턱을 높이는 방법들입니다.

[Namefi](https://namefi.io)는 바로 그 전제에서 출발합니다. [도메인 소유권](/ko/glossary/domain-ownership/)과 통제는 리셀러의 받은 편지함을 떠도는 재사용 가능한 비밀번호에 의존하는 것이 아니라, **검증 가능하고 변조에 강한** 형태여야 합니다. 도메인 소유권을 DNS와 호환성을 유지하면서 [온체인](/ko/glossary/on-chain/)에서 암호학적으로 검증 가능한 자산으로 표현함으로써, Namefi는 "이 도메인을 변경할 권한이 있는 자는 누구인가"라는 질문에 강력하고 감사 가능한 답을 제공합니다. 이는 로그인한 사람이 누구든 신뢰하는 방식이 아니라, 소유자에게 귀속된 명시적이고 서명된 행동으로 제어 변경을 처리합니다—누구나 열쇠를 복사할 수 있는 현관문의 자물쇠가 아니라, 소유자만 열쇠를 보유하는 레지스트리 잠금에 가까운 방식입니다.

신문사의 도메인은 그 신문사의 현관문입니다. 2013년 8월 27일의 교훈은, 아무리 튼튼한 자물쇠도 몇 동 떨어진 곳의 낯선 이가 열쇠 사본을 속임수로 건네줄 수 있다면 소용이 없다는 것입니다. 해법은 소유권 자체를 증명 가능하게 만드는 것입니다. 그래야 "정문으로 들어왔다"는 말을 낯선 이가 다시는 할 수 없게 됩니다.

## 출처 및 추가 참고 자료

- The Register — [New York Times, Twitter domain hijackers 'came in through front door'](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/)
- TechCrunch — [Syrian Electronic Army Apparently Hacks DNS Records Of Twitter, NYT Through Registrar Melbourne IT](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/)
- ABC News — [New York Times Website Hacked, Syrian Electronic Army Appears to Take Credit](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043)
- Christian Science Monitor — [New York Times hacked, Syrian Electronic Army takes credit](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit)
- iTnews — [Melbourne IT compromise redirects NY Times, HuffPo readers](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935)
- The Next Web — [Here's How the New York Times and Twitter Got Hacked](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter)
- Domain Name Wire — [Melbourne IT the weak link as Twitter and NY Times domain names compromised](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/)
- Wikipedia — [Syrian Electronic Army](https://en.wikipedia.org/wiki/Syrian_Electronic_Army)
- NBC News — [Syrian group hacks Twitter, New York Times](https://www.nbcnews.com/id/wbna52864470)
- Al Jazeera — [Syria hackers target New York Times website](https://www.aljazeera.com/news/2013/8/28/syria-hackers-target-new-york-times-website)
