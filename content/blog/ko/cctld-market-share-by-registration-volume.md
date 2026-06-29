---
title: '등록 수량 기준 ccTLD 시장 점유율: 실제로 국가 네임스페이스를 주도하는 것은 누구인가?'
date: '2026-05-01'
language: ko
tags: ['cctld', 'domains', 'market-analysis', 'registry']
authors: ['namefiteam']
draft: false
cluster: choosing-a-tld
format: analysis
description: 전 세계 등록 수량에서 가장 높은 점유율을 차지하는 국가 코드 최상위 도메인(ccTLD)이 무엇인지, 왜 선두주자들이 대부분의 예상과 다른지, 그리고 수량 데이터가 인터넷이 실제로 어떻게 사용되는지에 대해 무엇을 알려주는지 살펴봅니다.
ogImage: ../../assets/cctld-market-share-by-registration-volume-og.jpg
keywords: ['ccTLD 시장 점유율', '국가 코드 도메인', '.cn', '.de', '.uk', '.tk', '.io', '도메인 통계', '레지스트리 데이터', 'namefi']
relatedArticles:
  - /ko/blog/how-tld-affects-domain-value/
  - /ko/blog/what-is-a-tld/
  - /ko/blog/why-are-io-domains-expensive/
  - /ko/blog/ai-vs-io-domain/
  - /ko/blog/top-tlds-to-secure-for-your-startup/
relatedTopics:
  - /ko/topics/choosing-a-tld/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-flipping-skills/
  - /ko/series/best-tlds-by-industry/
relatedGlossary:
  - /ko/glossary/tld/
  - /ko/glossary/icann/
  - /ko/glossary/registrar/
  - /ko/glossary/registry/
  - /ko/glossary/dns/
---

대부분의 사람들이 인터넷을 떠올릴 때 `.com`을 생각합니다. 그리고 실제 수치로도 `.com`은 현재 약 1억 6천만 개의 도메인을 관리하는 지구상 최대의 [최상위 도메인(TLD)](/ko/glossary/tld/)입니다. 그러나 `.com`은 [gTLD](/ko/glossary/gtld/), 즉 *일반* 최상위 도메인입니다. 시선을 **국가 코드 TLD(ccTLD)**—[ISO 3166-1](https://www.iso.org/iso-3166-country-codes.html)에 따라 각국 및 영토에 부여된 두 글자 접미사—로 돌리면, 그림이 훨씬 흥미로워지고 예측하기 어려워집니다.

이 글에서는 어떤 ccTLD가 등록 수량 기준으로 선두를 차지하는지, 왜 선두주자들이 예상과 다른지, 그리고 그 수치가 세계 각지에서 인터넷이 *실제로* 어떻게 사용되는지에 대해 무엇을 보여주는지 살펴보겠습니다.

## 선두 ccTLD 순위

공개 레지스트리 데이터(수치를 공개하는 운영사의 데이터와 [DNIB Q1 2026 도메인 이름 산업 브리프](https://www.dnib.com/articles/the-domain-name-industry-brief-q1-2026#:~:text=The%20top%2010%20ccTLDs%2C%20as%20of%20March%2031%2C%202026%2C%20were%20.cn%2C%20.de%2C%20.uk%2C%20.ru%2C%20.nl%2C%20.br%2C%20.fr%2C%20.au%2C%20.in%20and%20.eu.) 및 [DENIC의 .de 통계](https://www.denic.de/en/products/statistics-about-de/)와 같은 집계 자료 포함)에 따르면, 상위 ccTLD는 대략 다음 순서와 같습니다.

- **.cn (중국)** — 약 2천만 개 수준. 대부분의 날 기준으로 최대 [ccTLD](/ko/glossary/cctld/)입니다.
- **.de (독일)** — 약 1천 7백만 개. DENIC이 운영하며, 연간 수치가 매우 안정적입니다.
- **.uk (영국)** — `.uk`와 `.co.uk`를 합산하면 약 1천만 개.
- **.nl (네덜란드)** — 약 6백만 개. 인구 1천 7백만 명의 나라치고는 이례적으로 큰 수치입니다.
- **.ru (러시아)** — 약 5백만 개. 여기에 키릴 문자 국제화 도메인(IDN)인 `.рф`에도 수백만 개가 추가됩니다.
- **.br (브라질)** 및 **.fr (프랑스)** — 각각 그 다음 규모로, `.br`은 `.com.br` 아래에 집중되어 있습니다.
- **.au (호주)**, **.in (인도)**, **.eu (유럽연합)** — 각각 그 다음 티어. `.eu`는 기술적으로 단일 국가가 아닌 지역 ccTLD입니다.
- **.it, .pl, .ca** — 보고 기간 및 출처에 따라 현재 상위 10위권 안팎에 위치하는 중요한 국가 네임스페이스입니다.

이 상위권 아래로는, 수십만 개에서 수백만 개 사이에 위치하는 국가 코드 존들의 긴 꼬리가 이어집니다.

## 선두주자들이 예상과 다른 이유

몇 가지 주목할 만한 패턴이 있습니다.

### 미국이 아닌 중국과 독일이 선두

미국에도 ccTLD가 있습니다. `.us`입니다. 그러나 거의 아무도 사용하지 않습니다. 활성 등록 수는 100만 개에 훨씬 못 미칩니다. 미국의 인터넷은 처음부터 `.com`으로 직행했고, 그 이후 한 번도 돌아보지 않았습니다. 결과적으로 세계 최대 경제 대국은 ccTLD 차트에서 사실상 부재하며, 실제 ccTLD 선두는 *로컬* 확장자가 강한 브랜드 신뢰를 쌓은 국가들—독일(`.de`), 영국(`.co.uk`), 네덜란드(`.nl`), 중국(`.cn`)—이 차지하고 있습니다.

이것이 ccTLD 시장 점유율이 낯설게 느껴지는 가장 큰 이유입니다. 분모는 "인터넷 사용자 수"가 아닙니다. 분모는 "로컬 확장자가 실제로 의미를 지니는 지역의 인터넷 사용자 수"입니다.

### 일부 ccTLD는 실제로 해당 국가에서 사용되지 않는다

일부 소국의 ccTLD는 사실상 일반 확장자처럼 운영되며, 등록의 대부분이 해당 국가 외부에서 이루어집니다.

- **[.io](/ko/tld/io/)** (영국령 인도양 영토) — "입출력(input/output)"의 어감을 살린 네이밍으로 기술 스타트업에게 사랑받고 있습니다.
- **[.tv](/ko/tld/tv/)** (투발루) — 미디어 및 스트리밍 브랜드에 임대되어 사용됩니다.
- **[.co](/ko/tld/co/)** (콜롬비아) — `.com`의 대안으로 글로벌하게 마케팅되고 있습니다.
- **[.me](/ko/tld/me/)** (몬테네그로) — 대명사(pronoun)로 활용하기 좋아 개인 사이트에서 인기가 높습니다.
- **[.ai](/ko/tld/ai/)** (앵귈라) — AI 붐 덕분에 최근 급격히 성장했습니다.
- **.tk** (토켈라우) — 무료 등록 프로그램으로 수치가 인위적으로 부풀려진 바 있으며, 이후 [서비스가 종료되었습니다](https://en.wikipedia.org/wiki/.tk).

이러한 존들은 매우 높은 수량 수치를 보일 수 있지만, 그 수량은 *글로벌 브랜딩 수요*를 반영하는 것이지, 해당 국가의 인구나 경제 활동을 반영하는 것이 아닙니다. 투발루는 약 1만 1천 명의 주민이 살고 있지만, 세계에서 가장 주목받는 ccTLD 중 하나를 보유하고 있습니다.

### 무료 등록이 통계를 왜곡한다

2010년대 대부분의 기간 동안, Freenom은 `.tk`, `.ml`, `.ga`, `.cf`, `.gq`에 대한 무료 등록을 제공했습니다. 전성기에는 `.tk` 하나의 등록 수가 `.de`를 능가했다는 보고도 있었습니다. 업계 전문가들은 그 도메인들의 상당수가 사용되지 않거나 [피싱](/ko/glossary/phishing/)에 악용되고 있다고 지속적으로 지적했습니다. [ICANN 절차 및 레지스트리 인수](https://www.icann.org/en/system/files/files/proposed-renewal-tk-redelegation-12sep23-en.pdf) 이후 Freenom은 신규 등록을 중단했고, 시장 점유율은 순식간에 사라졌습니다. 교훈은 명확합니다. 등록 *수량*과 등록 *가치*는 서로 다른 지표입니다.

### 제한적 ccTLD는 의도적으로 규모를 작게 유지한다

일부 ccTLD는 자격 요건을 두고 있습니다. 현지 주소, 현지 법인, 국민 신분증이 필요한 경우가 있습니다. `.jp`와 `.no`가 그 대표적인 예입니다. JPRS는 `.jp` 등록에 일본 내 상시 우편 주소를 요구하고, Norid는 `.no` 등록에 노르웨이 신원 또는 단체 자격과 노르웨이 우편 주소를 요구합니다. `.fi`는 좋은 반례입니다. Traficom은 현재 거주지에 관계없이 기업, 단체, 개인 모두 `.fi` 도메인을 등록할 수 있도록 허용하고 있습니다. 제한적 존은 완전히 개방된 존과 등록 수량 경쟁에서 결코 이길 수 없습니다. 그러나 그곳에 존재하는 이름들은 대개 매우 건전합니다. 낮은 남용률, 낮은 주차율, 높은 갱신율이 그 증거입니다. 수량 수치를 실제로 신뢰할 수 있는 [레지스트리](/ko/glossary/registry/)를 원한다면, 제한적 ccTLD가 좋은 기준점이 됩니다.

## 수량 대 가치: 수치가 말해주는 것과 말해주지 않는 것

등록 수 기준 ccTLD 순위는 가장 많이 인용되는 통계이자, 가장 많이 오해되는 통계이기도 합니다. 보다 정직한 그림을 얻으려면 세 가지 수치를 함께 살펴봐야 합니다.

- **총 등록 수** — 표제 수치입니다.
- **갱신율** — 1년 후에도 유지되는 도메인의 비율. 건전한 존은 75~85% 수준입니다. 투기적이거나 무료 티어의 존은 50% 이하에 머무를 수 있습니다.
- **사용률** — 실제로 웹사이트, MX 레코드, 또는 다른 활성 서비스로 연결되는 도메인의 비율. 측정하기가 더 어렵지만, 레지스트리 투명성 보고서와 제3자 크롤 결과(예: [DomainTools](https://www.domaintools.com/resources/blog/), [SecurityTrails](https://securitytrails.com/blog))에 추정치가 공개됩니다.

2천만 개의 도메인을 보유하고 갱신율이 50%인 ccTLD는, 실질적인 의미에서 6백만 개를 보유하고 갱신율이 88%인 ccTLD보다 작습니다. 전자는 이탈이고, 후자는 *실질적인 기반*입니다.

## 도메인 선택 시 시사점

개발자와 사업자에게 실질적인 시사점은 다음과 같습니다.

- **`.com`은 여전히 기본 글로벌 브랜드 확장자입니다.** 별도로 설명 없이 누구나 알아듣는 유일한 TLD입니다.
- **ccTLD가 지배적인 국가에서는 로컬 ccTLD가 `.com`보다 신뢰를 더 잘 얻습니다.** 독일, 네덜란드, 영국, 체코, 폴란드가 그 예입니다. 이들 시장에서 사용자는 적극적으로 로컬 확장자를 선호합니다.
- **글로벌하게 운영되는 소국 ccTLD**(`.io`, `.ai`, `.co`, `.me`)는 명칭만 ccTLD일 뿐 사실상 gTLD입니다. 관할권 결정이 아닌 브랜드 결정으로 다루되, [레지스트리 정책](https://www.icann.org/resources/pages/registries-listing-2012-02-25-en)을 반드시 확인하여 운영사가 바뀔 경우 어떤 일이 발생하는지 파악하십시오.
- **등록 수량은 품질 지표가 아닙니다.** 주로 마케팅 지표입니다. 진정한 가치를 보여주는 수치는 갱신율입니다.

## Namefi의 관점

Namefi는 위에 언급된 많은 ccTLD—자격 조건이 있는 제한적 ccTLD 포함—에 대해 다수의 [레지스트라](/ko/glossary/registrar/) 백엔드를 통해 등록을 처리합니다. Namefi는 소유권 기록을 단일 레지스트라의 계정 수준 제어에 의존하는 대신 [온체인(on-chain)](/ko/glossary/on-chain/)으로 [토큰화(tokenize)](/ko/glossary/tokenize/)하기 때문에, 확장자 선택이 종속 결정이 아닌 라우팅 결정이 됩니다. `.io`로 시작해서 나중에 로컬 시장을 위해 같은 브랜드 정체성을 `.de`로 이전하고 싶으십니까? Namefi는 그 과정을 별도의 마이그레이션 프로젝트가 아닌 일반적인 이전 워크플로우로 처리할 수 있도록 설계되었습니다.

핵심은 이것입니다. ccTLD 시장 점유율은 열린 인터넷에서의 *신뢰 신호*에 관한 이야기입니다. 사람들이 등록하는 이름은 어떤 확장자가 어떤 시장에서 자연스럽게 느껴지는지를 보여줍니다. 그리고 그 토착 확장자가 항상 수량 순위표의 상위에 있는 것은 아닙니다.

## 출처 및 추가 자료

- Verisign — [Domain Name Industry Brief](https://www.verisign.com/en_US/domain-names/dnib/index.xhtml), TLD 시장에 대한 분기별 스냅샷으로 가장 많이 인용되는 자료.
- DNIB — [Q1 2026 Domain Name Industry Brief](https://www.dnib.com/articles/the-domain-name-industry-brief-q1-2026#:~:text=The%20top%2010%20ccTLDs%2C%20as%20of%20March%2031%2C%202026%2C%20were%20.cn%2C%20.de%2C%20.uk%2C%20.ru%2C%20.nl%2C%20.br%2C%20.fr%2C%20.au%2C%20.in%20and%20.eu.), 위에서 사용된 현재 상위 10개 ccTLD 순위 출처.
- DENIC — [.de 통계](https://www.denic.de/en/know-how/statistics/), 독일 레지스트리의 공개 대시보드.
- Nominet — [.uk 통계](https://www.nominet.uk/news/reports-statistics/) 및 정책.
- JPRS — [.jp 등록 자격](https://jprs.co.jp/en/jpdomain.html#:~:text=Any%20individual%2C%20group%20or%20organization%20having%20a%20permanent%20postal%20address%20in%20Japan%20is%20eligible%20for%20registration.).
- Norid — [.no 일반 요건](https://teknisk.norid.no/en/administrere-domenenavn/generelle-krav/#:~:text=must%20have%20a%20mailing%20address%20in%20Norway).
- Traficom — [.fi 등록 자격](https://traficom.fi/en/fi-domains/applying-and-using-fi-domains/how-get-fi-domain-name#:~:text=Companies%2C%20organisations%20and%20private%20persons%2C%20regardless%20of%20their%20domicile%2C%20can%20all%20have%20fi%2Ddomain%20names%20registered%20for%20them.).
- ICANN — [Centralized Zone Data Service](https://czds.icann.org/), 이용 가능한 경우 존 파일 접근을 위한 서비스.
- ISO — [ISO 3166-1 국가 코드](https://www.iso.org/iso-3166-country-codes.html), 모든 ccTLD 레이블의 근거.
