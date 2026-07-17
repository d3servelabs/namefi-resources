---
title: 'Perl.com 도메인 탈취 사건: 30년 된 커뮤니티의 집이 조용히 도난당한 이야기'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 19
format: case-study
description: '2021년 1월 말, 수십 년간 Perl 프로그래밍 커뮤니티의 본거지였던 perl.com이 등록기관 계정 침해를 통해 탈취되었습니다. 도메인은 중국을 경유해 이전되고, 악성코드 배포 이력이 있는 IP 주소로 연결되었으며, 19만 달러에 매물로 올라왔습니다. 사건의 경위, 도메인 복구 과정, 그리고 등록기관 계정 보안에 대한 교훈을 살펴봅니다.'
keywords: ['perl.com', 'perl.com 도메인 탈취', '도메인 하이재킹', '도메인 절도', '등록기관 계정 침해', '소셜 엔지니어링', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'DNS 하이재킹', '도메인 보안', '계정 탈취', 'BizCN']
relatedArticles:
  - /ko/blog/the-panix-com-domain-hijack/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
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

어떤 도메인은 이름처럼 보이지만 실질적으로는 인프라입니다. **perl.com**이 바로 그런 경우입니다. 이 도메인은 누군가가 작년에 구축한 마케팅 자산이나 브랜드가 아닙니다. 웹 초창기부터 Perl 프로그래밍 커뮤니티가 의지해 온 인터넷의 터전으로, 문서와 글, 그리고 이 언어의 공식 창구 역할을 해 온 정규 관문입니다.

그런데 2021년 1월 27일 아침, 그 관문이 갑자기 다른 사람의 것이 되어 있었습니다. 이는 영리한 브랜드 전략이나 합의된 거래가 아니었습니다. 명백한 절도였습니다. 도메인은 수개월 전에 이미 정당한 소유자의 손을 떠나 있었고, 여러 등록기관을 거쳐 전전하다가 악성코드 배포 이력이 있는 [IP 주소](/ko/glossary/ip-address/)로 연결되었습니다. 커뮤니티 네트워크 운영진은 단도직입적으로 밝혔습니다. ["perl.com 도메인이 오늘 아침 하이재킹되어 현재 파킹 사이트를 가리키고 있습니다."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

이것이 우리 Domain Mayday 시리즈 EP19의 이야기입니다. 서버 해킹 한 번 없이 30년 된 커뮤니티 도메인이 탈취된 경위, 그리고 그것을 되찾기까지의 과정을 살펴봅니다.

## 90년대 초부터 보유해 온 도메인

이 탈취 사건을 이해하려면 먼저 얼마나 평범한 구조가 취약점이 되었는지를 파악해야 합니다.

perl.com은 철통같은 기업 보안 시스템 안에 있지 않았습니다. 대부분의 오래된 도메인이 그렇듯, 신뢰할 수 있는 한 사람이 주류 [등록기관](/ko/glossary/registrar/)에 등록하고 별 탈 없이 매년 갱신해 온 방식이었습니다. 사이트 편집장 brian d foy는 이 사건에 대한 자신의 회고에서 그 내력을 이렇게 설명했습니다. ["이 도메인은 90년대 초에 등록되었으며, 그 직후 Tom Christiansen이 관리권을 넘겨받아 기본적으로 등록 비용을 계속 납부해 왔습니다."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

인터넷에서 가장 중요한 도메인 상당수가 바로 이런 구조입니다. 한 사람, 등록기관 로그인, 그리고 30년간 조용히 납부해 온 갱신료. 완벽하게 작동합니다 — 등록기관 계정 자체가 공격 대상이 되기 전까지는.

## 2021년 1월 27일: 현관문의 자물쇠가 바뀌다

![수십 년 된 나무 커뮤니티 안내판이 밤중에 조용히 기둥에서 풀려 옮겨지는 모습을 묘사한 생생한 컬러 컨셉 아트, 회로 기판 하늘을 배경으로](../../assets/the-perl-com-domain-theft-01-theft.jpg)

최초의 공개 경보는 Perl 커뮤니티 인프라를 운영하는 사람들에게서 나왔습니다. Perl NOC(네트워크 운영 센터) 블로그는 도메인이 "오늘 아침" 하이재킹되어 엉뚱한 곳을 가리키고 있다고 게시했습니다. 단순한 파킹 페이지보다 더 심각한 문제였습니다. 운영진은 ["과거에 악성코드를 배포한 사이트와 관련이 있을 수 있다는 신호가 일부 있습니다"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)라고 경고했습니다.

brian d foy도 같은 날 공개적으로 이 문제를 제기했습니다. 사건 보도는 그 시점을 명확히 확인해 주었습니다. ["1월 27일, Perl 프로그래밍 저자이자 Perl.com 편집장인 brian d foy가 perl.com 도메인이 갑자기 다른 사람 명의로 등록되었다고 트윗했습니다."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

커뮤니티의 대응은 빠르고 실용적이었습니다. 복구 작업이 시작되는 동안 NOC는 독자들에게 백업 주소를 안내했습니다. ["콘텐츠를 찾으신다면 perldotcom.perl.org를 방문하시기 바랍니다."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) 정규 이름은 사라졌지만 콘텐츠는 계속 접근 가능한 상태를 유지했습니다.

## 위험 요소: 악성코드 연관 IP

탈취된 도메인의 위험성은 그것이 보유한 신뢰도에 비례합니다. 그리고 perl.com이 보유한 신뢰는 상당했습니다. 수백만 명의 개발자, 튜토리얼, CPAN 툴링, 그리고 웹 전반에 퍼진 수많은 링크가 이 도메인을 가리키고 있었습니다. 이름을 장악한 자는 곧 그 모든 신뢰가 향하는 목적지를 장악하는 것이었습니다.

새로운 점유자는 무해한 곳으로 연결하지 않았습니다. BleepingComputer가 문서화했듯, ["도메인 이름 perl.com이 탈취되어 현재 악성코드 캠페인과 연관된 IP 주소를 가리키고 있습니다."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

기술적 흔적은 구체적이었습니다. DNS 레코드가 재작성되어 ["도메인에 할당된 IP 주소가 151.101.2.132에서 Google Cloud IP 주소 35.186.238[.]101로 변경되었습니다."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) 그 목적지에는 전력이 있었습니다. ["2019년, IP 주소 35.186.238[.]101은 현재는 사라진 Locky 랜섬웨어의 악성코드 실행 파일을 배포하는 도메인과 연결된 것으로 확인된 바 있습니다."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

이 두 사실을 합치면 위험성은 명백합니다. 개발자들이 반사적으로 신뢰하는 도메인이 갑자기 악성코드 이력이 있는 IP로 연결된다는 것은, 평소에는 속이기 어려운 기술적이고 보안 의식이 높은 사용자층을 노린 거의 완벽한 함정입니다.

## 공격 경로: 서버가 아닌 등록기관 계정

![위조된 소유권 이전 서류가 레지스트리 서비스 데스크 위로 밀려들고, 공식 고무 도장이 붉게 빛나며, 서류들이 네온 빛 속에서 소용돌이치는 모습을 묘사한 생생한 컬러 컨셉 아트 — 브랜드 로고 없음](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

이 사건을 단순한 에피소드가 아니라 교과서적 사례로 만드는 것이 바로 이 부분입니다. 아무도 perl.com의 웹 서버를 해킹하지 않았고, 아무도 DNS 비밀번호를 추측하지 않았습니다. 공격은 한 단계 위에서, 즉 이름의 소유자 기록을 보유하는 회사인 등록기관 수준에서 이루어졌습니다.

brian d foy는 사후 분석에서 유력한 가설을 직접 서술했습니다. ["우리는 위조 서류 등을 이용한 Network Solutions에 대한 소셜 엔지니어링 공격이 있었다고 봅니다."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) 언론도 같은 방식으로 규정했습니다. 이 탈취는 ["등록기관 Network Solutions가 유효한 권한 없이 도메인 기록을 변경하도록 납득시킨 소셜 엔지니어링 공격"](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)이었습니다.

가장 불안한 사실은 타임라인입니다. 커뮤니티가 이를 *인지*한 것은 1월이었지만, 실제 침해는 훨씬 이전에 발생했습니다. 도메인 전문 변호사 John Berryhill이 공개한 포렌식 자료는 실제 날짜를 수개월 전으로 소급했습니다. perl.com 기록에 따르면 ["John Berryhill이 트위터에서 공개한 포렌식 작업은 실제 침해가 9월에 발생했음을 보여주었습니다."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek도 공격자의 인내심을 확인했습니다. ["그에 따르면 공격은 2020년 9월에 발생했습니다"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) — 그 영향이 드러나기까지 대략 4개월이 걸린 셈입니다.

왜 이렇게 오래 기다렸을까요? 도메인 이전 규칙이 인내심에 보상을 주기 때문입니다. ["ICANN은 연락처 정보 업데이트 후 60일간 도메인 이전을 금지하고 있습니다."](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) 9월에 등록기관 계정을 조용히 탈취한 공격자는 도메인을 즉시 옮길 수 없었습니다. 그래서 기다렸고, 잠금 기간이 만료되자 비로소 행동에 나섰습니다.

움직이기 시작하자 그들은 복구를 어렵게 만들기 위해 여러 등록기관과 국경을 넘나들며 도메인을 세탁했습니다. The Register는 첫 번째 이동을 이렇게 기록했습니다. ["도메인은 12월에 BizCN 등록기관으로 이전되었지만, 네임서버는 변경되지 않았습니다."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer는 같은 경로를 지리적으로 추적했습니다. 도메인은 ["Network Solutions에 있던 2020년 9월에 탈취되어, 크리스마스 당일 중국의 등록기관으로 이전되었고"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day), 1월에 다시 한번 이동하여 ["도메인은 1월에 또 다른 등록기관인 Key Systems GmbH로 이전되었습니다."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

그 다음에는 현금화를 시도했습니다. 도메인을 새 위치로 옮긴 직후, ["무단 등록자는 도메인 마켓 Afternic에 이 도메인을 19만 달러에 판매하려 했습니다."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) 30년 된 커뮤니티 자산이 서류 위조로 탈취되어 중고 가구처럼 매물로 올라온 것입니다.

## 복구: 서류로 시작된 일을 서류로 되돌리다

탈취를 가능하게 한 바로 그 체계 — 등록기관, 레지스트리, 소유자 기록 — 만이 유일한 복구 경로였습니다. 재보안을 설정할 서버도, 배포할 패치도 없었습니다. Tom Christiansen이 실제 소유자이며 새로운 "소유자"는 사기꾼임을 등록기관과 [레지스트리](/ko/glossary/registry/) 체계를 통해 *증명*해야만 했습니다.

그 작업은 며칠 내로 시작되었습니다. 1월 30일, Perl NOC는 ["Network Solutions가 정당한 등록자인 Tom Christiansen과 협력하여 Perl.com 도메인 복구 작업을 진행 중"](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.)이라고 보고했습니다. 이 노력은 ["결국 2월 초 도메인을 이전 소유자 Tom Christiansen에게 반환하는 결과로 이어졌습니다."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

그러나 "반환"이 "해결"을 의미하지는 않았습니다. brian d foy의 표현은 안도감과 함께 아직 끝나지 않은 작업을 동시에 담고 있습니다. ["Perl.com 도메인이 Tom Christiansen의 손으로 돌아왔으며, 이런 일이 다시 발생하지 않도록 다양한 보안 업데이트 작업을 진행 중입니다."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) 도메인이 악성코드 연관 IP를 가리키고 있었기 때문에 보안 제품들이 이를 블랙리스트에 올렸고 일부 DNS 리졸버는 싱크홀링을 적용했습니다. 레지스트리 기록이 수정된 후에도 인터넷의 평판 시스템 전반에서 이 이름이 다시 신뢰를 회복하기까지는 추가로 몇 주가 더 걸렸습니다 — 전체 사태가 대략 두 달에 걸쳐 이어진 긴 후유증이었습니다.

foy의 표현은 거의 절제된 듯 들렸습니다. ["일주일 동안 우리는 Perl.com 도메인에 대한 통제권을 잃었습니다."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) 일주일의 적극적 탈취, 그 이전 수개월의 잠복 침해, 그리고 그 이후 몇 주간의 수습이 이어졌습니다.

## 등록기관 계정 보안과 오래된 도메인에서 배울 수 있는 것

perl.com 탈취 사건이 이토록 시사하는 바가 큰 이유는 정확히 아무런 특별한 일도 없었기 때문입니다. 핵심을 추리면 교훈은 불편할 만큼 일반적입니다.

1. **등록기관 계정이 진짜 핵심 자산입니다.** 누구나 서버와 DNS 호스트를 강화합니다. 그러나 도메인의 *소유권 기록*은 등록기관에 있으며, 그 계정은 대개 비밀번호와, 변경 요청을 수용하도록 설득될 수 있는 지원 팀 이상의 보호를 받지 못합니다. perl.com은 엣지에서가 아니라 바로 거기서 탈취되었습니다.

2. **소셜 엔지니어링은 기술적 통제를 능가합니다.** 익스플로잇도 없었고, 피해자 측 악성코드도 없었습니다. ["위조 서류 등"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.)만으로 실제 기록을 이동시키기에 충분했습니다. 자신의 로그인에 이중 인증을 적용해도 등록기관의 *직원*이 이를 우회하도록 설득될 수 있다면 소용이 없습니다.

3. **오래된 도메인은 취약한 표적입니다.** 90년대 초에 등록되어 30년간 자동 갱신으로 유지된 도메인에는 오래된 연락처 정보, 단일 인적 실패 지점, 그리고 [WHOIS](/ko/glossary/whois/) 기록을 매일 확인하지 않는 소유자가 쌓이는 경향이 있습니다. 조용한 안정이 바로 9월의 침해가 1월까지 눈치채이지 못하게 한 원인입니다.

4. **이전 규칙은 양날의 검입니다.** 소유자를 *보호*하기 위해 마련된 업데이트 후 60일 [이전 잠금](/ko/glossary/transfer-lock/)이 공격자의 대기실이 되었습니다. 인내심에 등록기관과 국경을 넘나드는 세탁이 더해져 빠른 해결책이 다수 당사자가 얽힌 수주짜리 복구 작업으로 변했습니다.

5. **복구는 탈취보다 느립니다.** 이름을 훔치는 데는 위조 서류 한 장이면 충분했습니다. 돌려받으려면 등록기관, 레지스트리, 정당한 소유자의 증거, 그리고 블랙리스트와 리졸버에서 평판을 회복하는 데 걸리는 수주가 필요했습니다. 절도는 단 하나의 거래이지만, 배상은 많은 것을 요구합니다.

냉혹한 결론: perl.com 같은 도메인에서는 비밀번호의 강도보다 등록기관이 그 비밀번호를 무시하도록 속임을 당할 수 있느냐 없느냐가 더 중요합니다.

## Namefi의 관점

![검증 가능하고 위변조 저항적인 도메인 소유권을 나타내는 컬러 일러스트 — 녹색 방패로 보호된 도메인 카드, 초록색 Namefi 토큰, DNS 연속성](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

perl.com 탈취의 모든 단계는 하나의 취약점에서 비롯되었습니다. 소유권이 *타인의 계정에 있는 기록*이었고, 적절한 지원 담당자를 설득할 수 있는 사람이라면 누구든 변경할 수 있었습니다. 공격자는 소유자의 키가 필요하지 않았습니다. 등록기관의 신뢰만 있으면 충분했고, 위조된 서류 한 장으로 30년 된 자산이 지구 반대편으로 이전되어 매물로 올라갔습니다.

[Namefi](https://namefi.io)는 그 반대 전제 위에 구축되어 있습니다. [도메인 소유권](/ko/glossary/domain-ownership/)은 암호학적으로 검증 가능해야 하며, 조용히 재작성될 수 없어야 한다는 것입니다. 도메인 통제를 DNS와 호환되는 토큰화된 온체인 자산으로 표현함으로써, "이 이름의 소유자는 누구인가?"라는 질문에 대한 권위 있는 답변이 더 이상 설득력 있는 전화 한 통으로 바뀔 수 있는 등록기관 데이터베이스의 가변적 한 줄이 아닌 것이 됩니다. 이전은 불투명한 백오피스 서류 작업이 아닌 서명되고 감사 가능한 이벤트가 되며, 사기적 "소유권 변경"이 통과할 수 있는 조용한 문은 사라집니다.

이것이 perl.com을 하룻밤 사이에 탈취 불가능하게 만들지는 않을 것입니다. 등록기관과 레지스트리는 여전히 체인의 일부입니다. 그러나 이 사건을 규정한 바로 그 실패 양식 — *30년간 이름 비용을 납부하는 것*과 *그것이 자신의 것임을 위변조 저항적으로 증명할 수 있는 것* 사이의 간극 — 을 정면으로 공략하며, 탈취된 도메인이 누군가 이의를 제기하기 전에 세탁될 수 있는 시간을 줄입니다.

perl.com은 현관문을 되찾았습니다. 이 사건이 남긴 더 어려운 질문은, 왜 그 자물쇠가 애초에 적절한 서류를 가진 낯선 사람이 열 수 있는 것이었냐는 것입니다.

## 출처 및 추가 참고자료

- The Perl NOC — [perl.com hijacked](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (brian d foy) — [The Hijacking of Perl.com](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [Perl.com domain stolen, now using IP address tied to malware](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [Perl.com theft blamed on social engineering attack](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [Hackers Controlled Perl.com Domain Months Before Hijack](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [Attackers took over the Perl.com domain in September 2020](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [Domain for popular programming website Perl.com stolen in 'hack'](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [Perl.com Domain Stolen, Now Using IP Address of Past Malware Campaigns](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [The perl.com domain has been hijacked](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [Perl.com editors tell the truth about the Perl.com domain hijacking case](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)
