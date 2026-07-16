---
title: '도메인 재난 EP14: 보안 기업이 DNS 하이재킹 당한 날 — Fox-IT 사건'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 12
format: case-study
description: '2017년 9월, 공격자가 네덜란드 보안 기업 Fox-IT의 서드파티 도메인 등록 기관에 로그인해 DNS를 변경하고, TLS 인증서를 부정 발급받은 뒤 10시간 동안 클라이언트 트래픽을 중간자 공격으로 감청했습니다. Fox-IT는 이를 탐지하고 업계 역사상 가장 투명한 사후 분석 보고서 중 하나를 공개했습니다.'
keywords: ['fox-it dns 하이재킹', 'fox-it 중간자 공격', 'fox-it 사건 2017', 'dns 하이재킹', '등록 기관 계정 탈취', '허위 ssl 인증서', '중간자 공격', '도메인 등록 기관 보안', '이중 인증 dns', 'dnssec', '레지스트리 잠금', '도메인 보안', 'ncc group fox-it']
relatedArticles:
  - /ko/blog/the-dnspionage-campaign/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/the-badgerdao-frontend-attack/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
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
  - /ko/glossary/tld/
  - /ko/glossary/registry/
---

중간자 공격(man-in-the-middle attack)의 본질은 공격이 진행되는 동안 모든 것이 평소와 똑같이 보인다는 데 있습니다.

사이트는 정상적으로 로드됩니다. 주소창에는 올바른 도메인이 표시됩니다. 자물쇠 아이콘은 잠겨 있습니다. 인증서는 유효합니다. 파일이 업로드되고, 로그인이 성공하며, 이메일이 도착합니다. 오류도 없고, 경고도 없고, 깨진 이미지도 없습니다. 조용한 제3자가 대화 한가운데 앉아 오가는 내용을 모두 읽은 뒤 전달하기 때문에, 어느 쪽도 그 지연을 눈치채지 못합니다.

이번에는 바로 그것을 눈치채는 것이 본업인 사람들에게 그 일이 일어났다고 상상해 보십시오.

2017년 9월, 네덜란드 사이버 보안 기업 Fox-IT — 침해 사고를 조사하고, 침입 탐지 센서를 구축하며, 공격자의 이동 방식에 대해 정부에 자문하는 회사 — 는 공격자가 자사 도메인의 DNS를 하이재킹하고, 자사 명의의 TLS 인증서를 발급받아, 거의 하루 종일 클라이언트 포털의 트래픽을 열람했다는 사실을 발견했습니다. 자물쇠 제조업자의 자물쇠가 따졌던 것입니다. 그리고 Fox-IT는 침해를 당한 기업들이 거의 하지 않는 일을 했습니다. 바로 [정확히 어떤 일이 있었는지 상세한 보고서를 공개](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes)한 것입니다.

## 보안 기업도 등록 기관에 의존합니다

이 사례가 구체적으로 보여주는 불편한 진실이 있습니다. 내부 보안이 아무리 탄탄해도, 공격 표면의 상당 부분은 여러분이 운영하지 않는 회사에 존재한다는 것입니다.

여러분의 도메인 — 고객이 입력하는 이름, 인증서가 발급되는 주소, 이메일이 향하는 목적지 — 은 도메인 [등록 기관](/ko/glossary/registrar/)에서 설정됩니다. 그 등록 기관 계정을 제어하는 사람이 곧 여러분의 도메인 이름이 어디로 연결될지를 결정합니다. 웹사이트를 다른 곳으로 돌리고, 메일을 다른 곳으로 우회시키고, 인증 기관(CA)에 도메인 "소유권"을 증명할 수 있습니다. 이 모든 것을 위해 서버도, 방화벽도, 코드도 건드릴 필요가 없습니다. 웹 관리 패널 하나에 로그인하면 그만입니다.

Fox-IT는 어떤 기준으로 봐도 진지한 보안 조직이었습니다. 전체 패킷 캡처와 자체 네트워크 센서를 운영했습니다. 클라이언트 포털에는 이중 인증(2FA)을 사용했습니다. 이후에는 NCC Group에 인수되기도 했습니다. 그럼에도 거의 사용하지 않던 계정 하나를 통해 뚫렸습니다. 회사 스스로 인정했듯이, [DNS 설정은 일반적으로 거의 변경되지 않기](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=DNS%20settings%20in%20general%20change%20very%20rarely) 때문에 그것을 지키던 자격 증명이 조용히 낡아버렸던 것입니다.

Fox-IT가 자체 보고서 서두에서 밝혔듯이, [이러한 공격이 보안 기업을 타격할 수 있다면, 보안에 덜 집중하는 다른 많은 유형의 기업들도 마찬가지](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=if%20such%20an%20attack%20can%20hit%20a%20security%20firm)일 것입니다.

## 2017년 9월 19일: 하이재킹과 MITM

![조용한 도청자 형상이 멀리 떨어진 두 탑 사이를 흐르는 두 갈래의 메일 흐름을 읽고 있는 선명한 컬러 컨셉 아트. 두 탑은 아무 이상 없다는 듯 빛나고 있지만, 두 흐름은 그 인물의 손을 보이지 않게 통과하고 있습니다](../../assets/the-fox-it-dns-hijack-01-hijack.jpg)

Fox-IT의 보고서는 사고 대응 분야에서 소소한 명문이 된 한 문장으로 시작합니다. [Fox-IT에게 "만약"은 2017년 9월 19일 화요일에 "언제"가 되었습니다](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=became%20%E2%80%98when%E2%80%99%20on%20Tuesday%2C%20September%2019%202017). 그날 Fox-IT는 중간자 공격의 피해자가 되었습니다.

발생한 일은 서버 익스플로잇이 아니었습니다. 9월 19일 이른 아침, [공격자는 서드파티 도메인 등록 기관에서 Fox-IT.com 도메인의 DNS 레코드에 접근](https://grahamcluley.com/fox-it-dns-hack/#:~:text=an%20attacker%20accessed%20the%20DNS%20records%20for%20the%20Fox%2DIT.com%20domain)했습니다. 레코드를 장악한 공격자는 [특정 서버의 DNS 레코드를 자신이 보유한 서버로 변경하고, 트래픽을 가로채 실제 Fox-IT 인프라로 전달](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=modified%20a%20DNS%20record%20for%20one%20particular%20server)했습니다.

마지막 세부 사항 — *트래픽을 전달* — 이 이것을 단순한 서비스 중단이 아닌 중간자 공격으로 만든 이유입니다. 방문자들은 여전히 작동하는 포털에 접속했습니다. 다만 공격자를 먼저 거쳐서였을 뿐입니다.

공격 대상은 구체적으로 지정되었습니다. 이 공격은 [Fox-IT가 고객, 공급업체 및 기타 조직과 파일을 안전하게 교환하는 데 사용하는 문서 교환 웹 애플리케이션인 ClientPortal을 특정해서 겨냥](https://grahamcluley.com/fox-it-dns-hack/#:~:text=specifically%20aimed%20at%20ClientPortal)한 것이었습니다. 즉, 공격자는 민감한 클라이언트 문서가 오가는 채널을 곧장 노렸습니다.

Fox-IT가 이를 탐지하고 차단했기에, 회사는 [MITM 유효 시간을 총 10시간 24분으로 제한](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes)했습니다. 독립적인 보도들도 같은 수치를 제시합니다. [사건은 9월 19일에 발생해 10시간 24분간 지속](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=lasted%20for%2010%20hours%20and%2024%20minutes)되었습니다.

## 실제로 무엇이 탈취되었나

문서 교환 포털에서 10시간 동안 중간자 공격이 이루어졌다고 하면 대재앙처럼 들립니다. 그러나 실제 피해는 작았으며, 그 작음 자체가 이야기의 핵심입니다.

공격 시간대 동안 [9명의 개별 사용자가 로그인했고 그들의 자격 증명이 탈취](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Nine%20individual%20users%20logged%20in)되었습니다. 그러나 이 자격 증명은 대부분 무용지물이었습니다. Fox-IT 포털은 두 번째 인증 요소를 요구했고, 네트워크 경로 상에 앉아 있는 공격자는 이를 재사용할 수 없었습니다. Help Net Security는 9명의 로그인 자격 증명이 탈취되었지만 [두 번째 인증 요소 없이는 무용지물](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor)이었다고 지적했습니다.

파일 측면에서는 [12개 파일(그 중 10개는 고유)이 전송되어 탈취](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Twelve%20files%20%28of%20which%20ten%20were%20unique%29%20were%20transferred%20and%20intercepted)되었습니다. 일부 파일에는 기밀 클라이언트 정보가 포함되어 있었습니다. 공격자는 또한 ClientPortal 사용자들의 이름 및 이메일 주소 일부, 일부 계정명, 휴대폰 번호 하나를 탈취했는데, [SecurityWeek이 이를 정리](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=mobile%20phone%20number)했습니다.

두 가지 사실이 피해를 제한했습니다. 첫째, Fox-IT는 [국가 기밀로 분류된 파일은 ClientPortal을 통해 절대 전송되지 않는다](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Files%20classified%20as%20state%20secret%20are%20never%20transferred)고 명시적으로 밝혔습니다. 가장 민감한 자료는 노출된 채널에 애초에 존재하지 않았습니다. 둘째, 회사 자체의 이중 인증이 자격 증명 탈취의 영향을 약화시켰습니다. 아키텍처가 폭발 반경을 제한했고, DNS라는 외곽선이 무너진 이후에도 피해를 억제했습니다.

## 어떻게 발생했나: 낡은 비밀번호 하나, 이중 인증 없음

![장식이 화려한 열쇠 하나가 잠든 열쇠 보관자의 주머니에서 빠져나와, 거대한 이정표를 돌려 빛의 강을 숨겨진 거울 부스 쪽으로 우회시키는 데 사용되고, 그 부스에서 위조된 인장이 빛나는 인증서를 찍는 선명한 컬러 컨셉 아트](../../assets/the-fox-it-dns-hijack-02-mitm.jpg)

공격 메커니즘은 피해자 서버에 악성 코드 한 줄 심지 않고 도메인을 탈취하는 방법의 체크리스트처럼 읽힙니다.

**1단계 — 등록 기관 계정에 침입.** 공격자는 [유효한 자격 증명을 사용해 서드파티 도메인 등록 기관의 DNS 제어 패널에 성공적으로 로그인](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=logged%20in%20to%20the%20DNS%20control%20panel)했습니다. Fox-IT의 조사는 공격자가 [서드파티 제공업체의 침해를 통해 도메인 등록 기관의 DNS 제어 패널 자격 증명에 접근했을 가능성이 높다](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=through%20the%20compromise%20of%20a%20third%20party%20provider)는 결론을 내렸습니다. 두 가지 취약점이 복합적으로 작용해 그 로그인이 성공할 수 있었습니다. [비밀번호가 2013년 이후 변경되지 않았고](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013), 등록 기관이 이중 인증을 전혀 지원하지 않았습니다. Fox-IT가 지적했듯이, 사건 당시에도 [해당 등록 기관은 여전히 2FA를 지원하지 않았습니다](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA).

**2단계 — DNS 변경 후 CA에 "소유권" 증명.** 패널을 열자마자 공격자는 DNS를 다른 곳으로 돌렸습니다. 그러나 HTTPS 사이트에서 *믿을 만한* 중간자 공격을 실행하려면 fox-it.com에 대한 유효한 인증서가 필요했으며, 현대적인 방법으로 이를 얻으려면 도메인을 제어한다는 것을 증명해야 합니다. 공격자는 정확히 그렇게 했습니다. 02:05–02:15 사이의 짧은 시간 동안, 공격자는 [ClientPortal의 SSL 인증서를 부정 발급받는 과정에서 도메인 소유권을 증명하기 위한 특정 목적으로 Fox-IT 이메일을 일시적으로 우회해 탈취](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=fraudulently%20registering%20an%20SSL%20certificate%20for%20our%20ClientPortal)했습니다. 이 부분은 모든 독자가 잠시 멈춰 생각해야 할 대목입니다. **DNS 제어는 실질적으로 도메인 검증의 제어입니다.** 도메인 검증(DV) 인증서는 CA의 챌린지에 응답할 수 있는 사람에게 발급되는데, 여기서 DNS를 제어한 공격자는 검증 이메일을 다른 곳으로 우회해 응답할 수 있었습니다. DNS가 소유권 증명의 도달 지점을 결정합니다.

**3단계 — 중간에서 감청.** 정식으로 발급되었지만 부정하게 취득한 인증서를 손에 넣은 공격자는 도메인을 해외 VPS로 연결해 트래픽을 가로챘습니다. SecurityWeek이 묘사했듯이, [불량 SSL 인증서는 ClientPortal에 대한 MITM 공격에 사용되었으며, 포털로 향하는 트래픽은 해외 VPS 제공업체를 통해 라우팅](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=rogue%20SSL%20certificate%20was%20used)되었습니다. 방문자 입장에서는 아무 문제가 없었습니다. 자물쇠는 진짜였고, 인증서는 유효했으며, 중간의 공격자는 브라우저가 신뢰하는 키를 쥐고 있었습니다.

DNS, 인증 기관, TLS — 세 레이어 모두 기술적으로는 정상적으로 작동하고 있었습니다. 공격자는 어느 것도 파괴하지 않았습니다. 셋 모두를 자신이 Fox-IT라고 설득했을 뿐이며, 그것을 가능하게 한 단 하나의 조건은 등록 기관에서의 낡고 단일 요소인 로그인 하나였습니다.

## Fox-IT의 대응: 탐지, 억제, 그리고 공개

이 사건을 조용히 묻힌 수백 건의 사건들과 구분 짓는 것은 기술적·편집적 대응 방식입니다.

**탐지는 빠르게 이루어졌습니다.** Fox-IT는 fox-it.com 도메인의 네임서버가 우회되었다는 사실을 파악했는데, Help Net Security에 따르면 [공격 시작 약 5시간 후](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=five%20hours%20after%20the%20attack%20started)였습니다. 회사가 자체적으로 운영하던 전체 패킷 캡처와 네트워크 센서가 무엇이 건드려졌고 무엇이 그렇지 않았는지를 정확히 재구성하는 포렌식 기록을 제공했습니다.

**차단은 신중하게 이루어졌습니다.** 포털을 즉시 오프라인으로 만들어 공격자에게 발각 사실을 알리는 대신, Fox-IT는 더 조용한 완화 방법을 선택했습니다. [ClientPortal 로그인 인증 시스템의 이중 인증을 비활성화](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=disabled%20the%20second%20factor%20authentication)한 것입니다. 직관에 반하는 조치처럼 보이지만, 이를 통해 침입 사실을 드러내지 않으면서 DNS 제어권을 되찾는 동안 상황을 관리할 수 있었습니다. 이후 [해당 파일과 관련된 피해 고객 모두에게 즉시 연락](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=All%20affected%20clients%20in%20respect%20of%20these%20files%20were%20contacted%20immediately)했습니다.

**그다음, 이 사건을 케이스 스터디로 만든 일이 벌어졌습니다.** 3개월 후, 분석을 마치고 법 집행 기관의 조사가 진행 중인 상황에서 Fox-IT는 단순한 명제 아래 전체 타임스탬프가 포함된 사후 분석 보고서를 공개했습니다. [투명성은 비밀보다 더 많은 신뢰를 쌓으며, 배울 교훈이 있다](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=transparency%20builds%20more%20trust%20than%20secrecy)는 것이었습니다. 보안 기업이 가장 전형적인 방식으로 망신을 당했고, 그것을 묻어버리는 대신 업계에 해부 보고서를 내놓은 것입니다. BleepingComputer의 헤드라인은 그 순간의 분위기를 정확히 포착했습니다. [탑급 보안 기업이 MITM 보안 사고를 인정하다](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=Top%20Security%20Firm%20Admits).

## 등록 기관 보안과 레지스트리 잠금에 대한 교훈

세부 사항을 제거하면 Fox-IT 사건은 진정한 경계선이 어디에 있는지에 관한 교훈입니다. 대부분의 조직에서 경계선은 방화벽만이 아닙니다. 등록 기관 로그인이 바로 그 경계선입니다. 이 사례가 지지하는 것들을 정리합니다.

1. **등록 기관 계정을 프로덕션 인프라처럼 취급하십시오.** 거의 변경되지 않기 때문에 잊어버리기 쉽습니다. 그것이 바로 계정이 방치되는 이유입니다. [2013년 이후](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013) 변경되지 않은 비밀번호는 "트래픽이 적어서 위험 낮음"이 아닙니다. 모니터링도 없는 고가치 자격 증명입니다.

2. **등록 기관에 다중 인증을 요구하고, 지원하지 않으면 떠나십시오.** Fox-IT의 등록 기관은 [2FA를 전혀 지원하지 않았습니다](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA). 도메인 보안 체인에서 가장 중요한 계정이 비밀번호 하나만으로 보호되고 있었습니다. 등록 기관의 2FA 지원 여부는 있으면 좋은 기능이 아니라 조달 기준입니다.

3. **레지스트리 잠금을 사용하십시오.** 등록 기관 자체 로그인을 넘어, 많은 레지스트리는 *[레지스트리 잠금](/ko/glossary/registry-lock/)*을 제공합니다. 이는 대역 외(out-of-band) 수동 검증 단계가 완료되지 않으면 네임서버 및 연락처 레코드 변경을 방지하는 서버 측 홀드입니다. 레지스트리 잠금이 있었다면, 등록 기관 비밀번호가 완전히 침해되더라도 DNS를 조용히 바꿀 수 없었을 것입니다. "패널 하나만 있으면 되는 일"이 "여러 명의 담당자와 전화 통화가 필요한 일"로 바뀝니다.

4. **가능한 곳에 [DNSSEC](/ko/glossary/dnssec/)을 배포하십시오.** DNSSEC은 DNS 응답에 암호화 서명을 추가해 리졸버가 해석 경로에서 변조를 탐지할 수 있게 합니다. 이것이 만능 해결책은 아닙니다. 권한 레코드를 제어하는 공격자는 재서명할 수 있기 때문입니다. 그러나 비용을 높이고 전송 중 DNS 조작의 전체 유형을 차단합니다. DNS 계층에서의 심층 방어는 이 사례가 보여주듯이 DNS가 신뢰 스택에서 TLS와 인증서 발급보다 *상위*에 있기 때문에 중요합니다.

5. **DNS 제어는 인증서 제어임을 명심하십시오.** 공격자는 [우회된 이메일을 통해 도메인 소유권을 증명](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=proving%20that%20they%20owned%20our%20domain)해 유효한 TLS 인증서를 취득했습니다. 도메인에 대해 예기치 않게 발급된 인증서를 찾기 위해 인증서 투명성(Certificate Transparency) 로그를 모니터링하십시오. CT에 나타나는 불량 인증서는 DNS 하이재킹이 진행 중일 수 있다는 몇 안 되는 외부 신호 중 하나입니다.

6. **애플리케이션 자체에 두 번째 인증 요소를 유지하십시오.** Fox-IT 포털의 2FA 덕분에 탈취된 9개의 비밀번호가 [두 번째 인증 요소 없이 무용지물](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor)이 되었습니다. 외곽 레이어(DNS)가 무너졌을 때, 내부 레이어(앱 수준 MFA)가 피해를 제한했습니다.

공통된 교훈: 여러분의 도메인은 부분적으로 외주화된 단일 장애 지점입니다. 이를 강화하는 것은 화려하지 않으며, Fox-IT에게 일어난 일이 누군가에게 일어나는 그날에만 효과가 증명됩니다.

## Namefi의 관점

![검증 가능하고 변조 방지 도메인 소유권을 나타내는 컬러 일러스트레이션 — 녹색 방패, 녹색 Namefi 토큰, DNS 연속성으로 보호된 도메인 카드](../../assets/the-fox-it-dns-hijack-03-namefi-angle.jpg)

Fox-IT 사건은 근본적으로 제어와 출처 증명의 문제입니다. 공격자는 Fox-IT가 될 필요가 없었습니다. 하나의 시스템 — 등록 기관 패널 — 이 DNS를 돌리고 인증서를 발급받기에 충분한 시간 동안 자신이 Fox-IT라고 *믿게* 하면 그만이었습니다. 다운스트림의 모든 것이 그 믿음을 신뢰했습니다.

[Namefi](https://namefi.io)는 도메인 제어를 벤더의 웹 패널에 있는 단일 재사용 비밀번호에 의존하는 대신, 검증 가능하고 변조 방지된 방식으로 만드는 것을 목표로 구축되었습니다. [도메인 소유권](/ko/glossary/domain-ownership/)을 DNS와 호환되는 검증 가능한 온체인 자산으로 표현함으로써, 제어는 누군가가 조용히 로그인해 재구성할 수 있는 계정이 아니라, 감사하고 증명할 수 있는 것이 됩니다. 레지스트리 잠금의 정신에 따라 중요한 변경을 실제로 보유한 소유권에 묶을 수 있으며, 수년간 갱신되지 않은 자격 증명이 아닌 것에 묶을 수 있습니다.

이것이 결단력 있는 공격자를 불가능하게 만들지는 않습니다. 그러나 Fox-IT 사례는 궁극적으로 탈취된 로그인 하나가 도메인의 완전한 제어로 이어지는 이야기입니다. 도메인 제어가 검증 가능한 소유권에 더 가깝게 위치하고, 낡은 비밀번호 하나로 조용히 이름을 바꾸기 더 어려울수록, Fox-IT의 "만약이 언제가 된 순간"과 같은 일이 퍼지기 전에 누군가 눈치챌 가능성이 높아집니다.

보안 기업은 5시간 만에 자신의 하이재킹을 발견하고 세상에 그 방법을 공개했습니다. 대부분의 조직은 두 가지 중 어느 것도 하지 못할 것입니다. Fox-IT가 치르고 얻은 가장 저렴한 교훈은 이것입니다. 등록 기관이 열린 문이 되기 전에 잠가두십시오.

## 출처 및 추가 읽기

- Fox-IT (NCC Group) — [중간자 공격에서 얻은 교훈](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/) (1차 사후 분석 보고서)
- BleepingComputer — [탑급 보안 기업이 MITM 보안 사고를 인정하다](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/)
- Help Net Security — [보안 기업 Fox-IT, 9월에 당한 MITM 공격 공개 및 상세 설명](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/)
- Graham Cluley — [Fox-IT, 해커가 DNS 레코드를 하이재킹해 고객 파일을 엿봤다고 밝혀](https://grahamcluley.com/fox-it-dns-hack/)
- SecurityWeek — [해커들이 보안 기업 Fox-IT를 겨냥하다](https://www.securityweek.com/hackers-target-security-firm-fox-it/)
- GBHackers — [선도적인 IT 보안 기업 Fox-IT, 사이버 공격 피해](https://gbhackers.com/cyber-attack/)
- Krebs on Security — [최근 광범위한 DNS 하이재킹 공격에 대한 심층 분석](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (관련: 대규모 DNS 하이재킹 + 허위 인증서 기법)
