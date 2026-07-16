---
title: 'DNSpionage: 정부를 겨냥해 DNS를 무기화한 사이버 첩보 캠페인'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 10
format: case-study
description: '2018년 말, Cisco Talos는 DNSpionage를 공개했습니다. 이란과 연관된 것으로 알려진 이 캠페인은 정부 DNS 레코드를 조작해 이메일과 VPN 트래픽을 공격자 서버로 우회시키고, 유효한 TLS 인증서를 발급받아 탐지를 피했습니다. 이 사건은 미국 정부 역사상 최초의 사이버보안 긴급 지시를 이끌어냈습니다.'
keywords: ['dnspionage', 'dns 하이재킹', 'dns 리다이렉션', 'cisco talos', 'cisa 긴급 지시 19-01', 'sea turtle dns', '이란 dns 하이재킹', 'fireeye dns 하이재킹', 'lets encrypt 인증서 악용', 'dns 보안', '도메인 보안', '국가 주도 사이버 첩보', 'dns 인프라 변조 대응']
relatedArticles:
  - /ko/blog/the-sea-turtle-dns-espionage/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-badgerdao-frontend-attack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/registrar/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/registry/
---

대부분의 도메인 사고는 누가 그 이름을 *소유*하느냐에 관한 문제입니다. 그런데 이 사건은 누가 그것을 *통제*하느냐에 관한 문제였습니다. 2018년 말, 수개월 동안 중동 전역의 수십 개 정부 도메인을 실질적으로 제어한 것은 해당 국가의 정부가 아니었습니다.

웹 서버가 침해된 것도 아니었습니다. 홈페이지에 악성 코드가 심긴 것도 아니었습니다. 사이트가 변조되거나 랜섬 메시지가 게시되거나 애플리케이션 로그에 이상 징후가 남지도 않았습니다. 공격자들은 건물 안으로 직접 침투할 필요조차 없었습니다. 그들은 거의 아무도 지키지 않는 단 하나의 문으로 걸어 들어갔습니다. 도메인의 이메일과 웹사이트가 실제로 어디에 위치하는지를 알려주는 **DNS 레코드**가 바로 그 문이었습니다. 그들은 유효한 자격 증명과 유효한 TLS 인증서를 갖추고, 조용히, 그 레코드를 수정했습니다. 그러자 전 세계의 트래픽은 아무 이의 없이 새로운 지시를 따랐습니다.

Cisco Talos는 이 캠페인을 **DNSpionage**라고 명명했습니다. 이 사건은 [도메인 네임 시스템(DNS)](/ko/glossary/dns/)이 단순한 인프라 배관이 아니라 국가 안보 인프라임을 보여주는, 기록상 가장 명확한 사례 중 하나입니다.

## 국가 전략 수단으로서의 DNS

DNSpionage가 각국 정부를 뒤흔든 이유를 이해하려면, DNS가 실제로 무슨 역할을 하는지부터 되짚어봐야 합니다.

정부 부처에 메일을 보내거나, 기업 VPN에 로그인하거나, 웹메일 페이지를 열 때마다, 당신의 기기는 먼저 DNS에 질문을 던집니다. *이 이름의 [IP 주소](/ko/glossary/ip-address/)는 무엇인가?* DNS가 어떻게 답하든, 당신은 그 답을 신뢰합니다. 메일 클라이언트는 그 주소로 접속하고, VPN은 그 주소로 인증을 수행하며, 브라우저는 그 주소에 세션을 넘깁니다. DNS는 인터넷 전체의 주소록이며, 그 주소록이 누군가에 의해 수정되었는지를 확인하는 메커니즘은 거의 없습니다.

DNSpionage가 이용한 것이 바로 이 특성이었습니다. 암호화를 깨거나 패스워드 파일을 크래킹할 필요가 없었습니다. 단지 *포인터*만 바꾸면 됩니다. 그렇게 하면 표적과 그들이 신뢰하는 서비스 사이에 눈에 띄지 않게 끼어들 수 있습니다. 이메일이 공격자를 통해 흐르고, VPN 로그인이 공격자를 통해 흐릅니다. 그리고 피해자의 도메인 이름이 여전히 브라우저 주소창에 표시되기 때문에, 아무것도 이상해 보이지 않습니다.

이것은 애플리케이션 계층 아래에서 이루어지는 첩보 행위입니다. 그리고 불편하게도, 대부분의 보안 프로그램이 이미 해결된 문제로 간주하는 바로 그 계층에서 발생합니다.

## DNSpionage 캠페인 (2018–2019)

![국가 중계 교환소 아래에 숨겨진 감청실 개념 삽화 — 그림자 속의 운영자가 위조된 공식 인장과 빛나는 데이터 케이블을 이용해 국가의 메일을 비밀 감청 거점으로 조용히 재전송하는 모습](../../assets/the-dnspionage-campaign-01-campaign.jpg)

**2018년 11월 27일**, Cisco Talos는 첫 번째 보고서를 발표했습니다. 첫 문장은 구체적이었습니다. "[Cisco Talos는 레바논과 아랍에미리트(UAE)를 표적으로 한 새로운 캠페인을 최근 발견했으며, 이 캠페인은 .gov 도메인과 레바논의 한 민간 항공사에 영향을 미쳤습니다](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Cisco%20Talos%20recently%20discovered%20a%20new%20campaign%20targeting%20Lebanon%20and%20the%20United%20Arab%20Emirates)."

이 캠페인은 두 가지 양상을 띠었습니다. 하나는 평범한 악성 코드 작전이었습니다. "[이 특정 캠페인은 악성 매크로가 삽입된 Microsoft Office 문서를 통해 표적을 침해하기 위해 채용 공고를 포함한 두 개의 가짜 악성 웹사이트를 활용했습니다](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=This%20particular%20campaign%20utilizes%20two%20fake%2C%20malicious%20websites%20containing%20job%20postings)." 미끼 사이트들은 실제 채용 담당자를 사칭했으며 — "[hr-wipro[.]com(wipro.com으로 리다이렉션)과 hr-suncor[.]com(suncor.com으로 리다이렉션)](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=hr%2Dwipro)" — 특징적으로 DNS를 통해 명령 서버와 통신하는 맞춤형 원격 접근 도구를 투하했습니다.

그러나 역사에 이름을 남긴 것은 두 번째 양상이었습니다. Talos의 표현에 따르면, "[별도의 캠페인에서 공격자들은 동일한 IP를 사용해 합법적인 .gov 및 민간 기업 도메인의 DNS를 리다이렉션했습니다](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=the%20attackers%20used%20the%20same%20IP%20to%20redirect%20the%20DNS%20of%20legitimate)." 실제 정부 네임서버가 공격자 소유의 기계를 가리키도록 변경되었습니다. "[레바논과 UAE의 공공 부문에 속한 다수의 네임서버와 레바논의 일부 기업 네임서버가 침해되었고, 그 관할 하에 있는 호스트명들이 공격자 제어 IP 주소로 연결되었습니다](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Multiple%20nameservers%20belonging%20to%20the%20public%20sector)."

가짜 채용 사이트는 일반적인 사이버 범죄처럼 보이는 부분이었습니다. DNS 리다이렉션은 국가 전략처럼 보이는 부분이었습니다.

독립적인 연구자들이 실마리를 끝까지 추적한 결과, 피해 범위는 두 나라를 훨씬 넘어섰습니다. Brian Krebs는 공격자 IP 주소를 역추적해 "[2018년 하반기에 DNSpionage 배후 해커들이 중동 50개 이상의 기업과 정부 기관의 핵심 DNS 인프라 구성 요소를 침해하는 데 성공했다](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=in%20the%20last%20few%20months%20of%202018%20the%20hackers%20behind%20DNSpionage%20succeeded)"는 사실을 밝혀냈습니다.

## 표적과 그 위험성

피해자 명단은 한 지역의 신경계 지도를 연상케 합니다. 외교부, 민간 항공 당국, 통신 사업자, 인터넷 인프라, 그리고 국가 재무부 웹메일에 이르기까지. 이들은 무작위 표적이 아닙니다. 국가의 기밀이 전선을 통해 지나가는 바로 그 지점들입니다.

Talos의 첫 보고서가 나온 지 두 달 후, FireEye(현 Mandiant)는 자체 분석 보고서를 발표하며 귀속 판단을 명시적으로, 그러나 신중하게 제시했습니다. FireEye는 "[초기 연구에 따르면 책임 있는 행위자 또는 행위자들은 이란과 연관성이 있는 것으로 추정됩니다](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/#:~:text=initial%20research%20suggests%20the%20actor%20or%20actors%20responsible%20have%20a%20nexus%20to%20Iran)"라고 밝혔습니다. SecurityWeek는 FireEye 분석 내용을 전하며, 동 회사가 기술적 증거와 캠페인이 이란 정부의 이익에 부합한다는 사실을 근거로 "[중간 수준의 신뢰도](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=moderate%20confidence)"로 이란의 소행으로 판단했다고 보도했습니다.

위험성은 표적의 성격에서 직접 도출됩니다. 외교부의 이메일을 평문으로 읽을 수 있다면, 그것은 단순한 데이터 탈취가 아닙니다. 거의 실시간으로 정부의 생각을 읽는 것입니다. 그렇기 때문에 DNS 계층에서의 자격 증명 수집 캠페인은 사기 행위가 아니라, 국가를 대상으로 한 정보 수집 작전으로 이해해야 합니다.

## 공격 방법: DNS 레코드 + 유효한 인증서 + 가짜 채용 사이트

![국가 우편 중계 교환소가 조용히 재설정되는 개념 삽화 — 거대한 라우팅 벽에서 빛나는 주소 카드가 교체되고, 각각의 우회된 선이 위조된 초록 자물쇠 인장을 통과해 비밀 감청 부스에 도달하는 모습](../../assets/the-dnspionage-campaign-02-dns-redirection.jpg)

이 기법은 최악의 방식으로 우아합니다. 세 단계로 이루어졌습니다.

**1단계: 주소록의 열쇠를 손에 넣다.** 공격자들은 DNS 암호화를 크래킹하지 않았습니다. 로그인했습니다. FireEye는 두 가지 경로를 설명했습니다. "[한 가지 방법은 침해된 자격 증명으로 DNS 제공업체의 관리 인터페이스에 로그인해 이메일 트래픽을 가로채기 위해 DNS A 레코드를 변경하는 것입니다. 또 다른 방법은 피해자의 도메인 레지스트라 계정을 해킹한 뒤 DNS NS 레코드를 변경하는 것입니다](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=One%20method%20involves%20logging%20into%20a%20DNS%20provider)." 탈취된 [레지스트라](/ko/glossary/registrar/) 및 DNS 호스트 자격 증명이 마스터 키였습니다. 레지스트라 로그인을 소유한 자가 도메인을 소유하며, 도메인은 그것을 가리키는 모든 것을 소유합니다.

**2단계: 트래픽이 여전히 작동하도록 우회시키다.** 정부 메일 서버를 자신의 IP로 단순히 돌려버리면 서비스가 중단되고 경보가 울립니다. 그래서 공격자들은 프록시를 사용했습니다. 트래픽을 가로챈 뒤 실제 목적지로 그대로 중계했기 때문에 사용자들에게는 편지함과 VPN이 정상 작동하는 것처럼 보였습니다. FireEye가 세 번째 변형으로 설명한 것처럼, "[사용자들은 공격자가 통제하는 인프라로 리다이렉션되었습니다](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=users%20were%20redirected%20to%20attacker%2Dcontrolled%20infrastructure)." 이 가로채기는 조용히 트래픽을 전달하는 중간자 공격이었으며, 아무것도 고장나지 않았기 때문에 정확히 보이지 않았습니다.

**3단계: 초록 자물쇠를 무력화하다.** 현대 서비스는 TLS를 사용하므로 트래픽이 잘못된 서버에 도착하는 순간 인증서 경고가 발생해야 합니다. 공격자들은 자신들만의 합법적인 인증서를 발급받아 이 허점을 메웠습니다. Talos는 "[DNS를 침해할 때마다 공격자는 리다이렉션된 도메인에 대한 Let's Encrypt 인증서를 꼼꼼히 생성했습니다](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=During%20each%20DNS%20compromise%2C%20the%20actor%20carefully%20generated)"라는 사실을 밝혀냈습니다. 도메인의 DNS를 통제하고 있었기 때문에, 인증 기관에 도메인 제어권을 *입증*할 수 있었고, 자동화된 도메인 유효성 검증은 그들에게 유효한 인증서를 발급해주었습니다. FireEye는 동일한 패턴을 모든 방법에서 확인했습니다. "[두 경우 모두 공격자들은 의심을 피하기 위해 Let's Encrypt 인증서를 사용했습니다](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=in%20both%20cases%20the%20attackers%20used%20Let%E2%80%99s%20Encrypt%20certificates)."

Krebs가 요약한 결과는 완전했습니다. "[이러한 DNS 하이재킹은 공격자들이 표적 도메인(예: webmail.finance.gov.lb)에 대한 SSL 암호화 인증서를 획득하는 데도 길을 열어주었으며, 이를 통해 공격자들은 가로챈 이메일과 VPN 자격 증명을 복호화해 평문으로 열람할 수 있었습니다](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=these%20DNS%20hijacks%20also%20paved%20the%20way%20for%20the%20attackers%20to%20obtain%20SSL%20encryption%20certificates)." 이메일과 VPN 로그인 정보가 유효한 자물쇠가 걸린 채 포착되어 열람되었습니다.

필요하지 *않았던* 것들이 무엇인지 눈여겨보십시오. 제로데이가 없었습니다. 피해자 서버에 악성 코드가 없었습니다. 방화벽도 뚫리지 않았습니다. 이 공격은 전적으로 "내가 이 도메인을 소유하고 있다"와 "현재 누가 이 레코드를 통제하는지 증명할 수 있다" 사이의 간극에서 이루어졌습니다. 그 간극이 DNSpionage가 존재했던 공간이며, 대부분의 조직이 생각하는 것보다 훨씬 넓습니다.

## 대응: CISA 긴급 지시 19-01

Talos와 FireEye의 공개 보고서는 워싱턴에 강한 충격을 주었습니다. **2019년 1월 22일**, 미국 사이버보안 및 인프라 보안국(CISA)은 **긴급 지시 19-01 "DNS 인프라 변조 완화"**를 발령했습니다. 이는 CISA 역사상 최초의 긴급 지시였으며, 미국 연방 민간 정부 전체를 구속하는 이례적인 명령이었습니다.

지시의 진단은 연구 결과와 정확히 일치했습니다. 당시 보도에서 인용된 바에 따르면, CISA는 "[공격자들이 웹 및 메일 트래픽을 리다이렉션 및 가로챘으며, 다른 네트워크 서비스에 대해서도 동일한 행위를 할 수 있습니다](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=redirected%20and%20intercepted%20web%20and%20mail%20traffic)"라고 경고하면서, 공격자들이 "[정부 DNS 도메인을 담당하는 관리자 계정을 침해했습니다](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=compromised%20the%20accounts%20of%20administrators)"라고 밝혔습니다.

그런 다음 10일의 기한을 두고 네 가지 조치를 명령했으며, 이는 공격자의 세 가지 수법에 대한 직접적인 반박처럼 읽힙니다.

1. **DNS 레코드 감사** — 권한 있는 서버와 보조 서버에서 아무것도 변조되지 않았는지 확인하십시오.
2. **DNS 계정 비밀번호 변경** — DNS를 수정할 수 있는 모든 자격 증명을 교체하십시오.
3. **모든 DNS 관리 계정에 다단계 인증 추가** — 탈취된 비밀번호 하나만으로는 더 이상 마스터 키가 되지 않도록 하십시오.
4. **인증서 투명성(CT) 로그 모니터링** — 자신이 요청하지 않은 도메인 인증서가 발급되는지 감시하십시오.

네 번째 항목이 핵심을 드러냅니다. CISA는 문을 잠그라고 지시하는 데 그치지 않았습니다. 누군가가 이미 복사 열쇠를 사용했다는 증거를 공개 인증서 원장에서 찾아보라고 지시한 것입니다. DNSpionage는 인증서 투명성을 PKI의 틈새 기능에서 국가 주도 [DNS 하이재킹](/ko/glossary/dns-hijacking/)을 위한 최전선 탐지 도구로 전환시켰습니다.

Krebs는 이 순간의 이례성을 담담하게 포착했습니다. "[미국 국토안보부가 모든 미국 연방 민간 기관에 인터넷 도메인 레코드의 로그인 자격 증명을 보안하도록 명령하는 이례적인 긴급 지시를 발령했습니다](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=issued%20a%20rare%20emergency%20directive%20ordering%20all%20U.S.%20federal%20civilian%20agencies)."

DNSpionage만이 이 지시를 이끌어낸 것은 아닙니다. Talos가 **Sea Turtle**이라고 명명한 병행 작전 — Talos가 "[도메인 네임 레지스트리 기관이 사이버 첩보 작전을 위해 침해된 최초의 알려진 사례](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=first%20known%20case%20of%20a%20domain%20name%20registry%20organization%20that%20was%20compromised)"로 규정하고, "[13개국의 약 40개 다른 조직을 표적으로 삼았다](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=approximately%2040%20different%20organizations%20across%2013%20different%20countries)"고 밝힌 — 은 위협 수위를 더욱 높였습니다. Talos는 두 작전을 신중하게 구분했으며, 2019년 4월 후속 보고서에서 DNSpionage의 행동 양식이 "[Sea Turtle과 같은 더 우려스러운 캠페인과 이 행위자를 계속 구별해 줄 것](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/#:~:text=will%20likely%20continue%20to%20distinguish%20this%20actor%20from%20more%20concerning%20campaigns%20like%20Sea%20Turtle)"이라고 언급했습니다. 두 캠페인은 서로 다른 각도에서 동일한 메시지를 전달했습니다. DNS 공급망이 국가 갈등의 전장이 되었다는 것입니다.

## DNS가 국가 안보 인프라임을 알려주는 교훈

DNSpionage는 악성 코드의 드라마보다는 불편한 교훈으로 가득합니다. 기억할 만한 몇 가지를 정리합니다.

- **레지스트라 계정은 왕관의 보석이다.** 도메인의 하위 모든 것 — 메일, 웹, VPN, 싱글 사인온, 인증서 발급 — 은 그 DNS를 편집할 수 있는 자를 신뢰합니다. 해당 계정에 비밀번호만 있고 2단계 인증이 없다는 것은 작은 허점이 아닙니다. 성문이 열린 채 방치된 전체 성채입니다. CISA의 첫 번째 지시가 방화벽이 아닌 *자격 증명*에 관한 것이었던 것은 바로 이 때문입니다.
- **유효한 인증서는 정당성의 증명이 아니다.** 초록 자물쇠가 의미하는 것은 트래픽이 *현재 도메인을 통제하는 자*에게 암호화되어 전달된다는 것입니다. 공격자가 DNS를 통제하고 있다면, 자동화된 도메인 유효성 검증은 기꺼이 그들에게 진짜 인증서를 발급합니다. TLS에 대한 신뢰는 DNS에 대한 신뢰에서 빌려온 것이며, DNS는 대부분의 사람들이 생각하는 것보다 훨씬 취약합니다.
- **DNS 공격은 설계상 보이지 않는다.** 프록시가 실제 트래픽을 중계하기 때문에 피해자의 서비스는 계속 작동합니다. 조사해야 할 장애가 없습니다. 유일한 외부 신호는 공개 CT 로그에 나타나는 인증서일 수 있습니다. 바로 그렇기 때문에 해당 로그 모니터링이 하룻밤 사이에 선택 사항에서 필수 사항이 된 것입니다.
- **도메인 통제는 국가 안보 통제다.** 외교부의 DNS를 편집하는 주체가 적대 국가일 때, "IT 운영"과 "방첩"의 구분은 무너집니다. 인터넷의 주소록은 전략적 영토입니다.

이 모든 것을 관통하는 핵심 질문이 있습니다. 거의 어떤 운영 도구도 실시간으로 답하지 못하는 질문입니다. **지금 이 순간 이 도메인을 실제로 누가 통제하고 있으며, 그것이 조용히 바뀌지 않았음을 증명할 수 있는가?** DNSpionage가 성공할 수 있었던 이유는 그 질문에 답하기가 너무 어려워서 지역 전체 국가들의 정부가 파악조차 하지 못했기 때문입니다.

## Namefi의 관점

![검증 가능하고 변조 방지된 도메인 소유권을 나타내는 색상이 풍부한 삽화 — 초록 방패와 초록 Namefi 토큰, DNS 연속성으로 보호된 도메인 카드](../../assets/the-dnspionage-campaign-03-namefi-angle.jpg)

DNSpionage는 근본적으로 **출처 증명(provenance)** 문제입니다. 공격자들은 표적 도메인을 소유한 적이 없었습니다. 레지스트라와 DNS 호스트 패널이 조용하고 검증 불가능한 편집을 할 수 있게 해주는 자격 증명을 훔침으로써 통제권을 빌렸고, 시스템 내의 어떤 것도 *통제하는 주체*가 바뀌었다는 사실을 알리지 않았습니다.

[Namefi](https://namefi.io)는 [도메인 소유권](/ko/glossary/domain-ownership/)과 통제가 불투명한 레지스트라 로그인 뒤에 숨겨지는 것이 아니라, **검증 가능하고, 이식 가능하며, 변조 시 흔적이 남는** 형태여야 한다는 전제 위에 구축되었습니다. 토큰화된 소유권은 "누가 이 이름을 통제하는가"를 확인하고 감사할 수 있는 사실로 만듭니다. 이미 타인의 손에 넘어갔을지도 모르는 비밀번호 뒤에 묻혀있는 설정이 아니라 말입니다. 이것이 레지스트라 계정 보안이나 다단계 인증을 대체하는 것은 아닙니다. CISA의 조언은 여전히 정확히 옳습니다. 그러나 DNSpionage가 이용한 더 깊은 간극, 즉 도메인을 통제하는 주체가 통제해야 마땅한 주체임을 독립적으로 그리고 지속적으로 *증명하는* 어려움을 정면으로 해결합니다.

DNSpionage의 교훈은 DNS가 어떤 특이한 방식으로 취약하다는 것이 아닙니다. 도메인에 관한 가장 중요한 사실 — 누가 그것을 통제하는가 — 이 너무 오랫동안 탈취된 비밀번호 하나만이 가로막고 있었다는 것입니다. 그 사실을 검증 가능하게 만드는 것이 바로 핵심입니다.

## 출처 및 추가 읽기

- Cisco Talos — [DNSpionage Campaign Targets Middle East](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/) (2018년 11월 27일)
- Cisco Talos — [DNSpionage brings out the Karkoff](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/) (2019년 4월 23일)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (2019년 2월 18일)
- The Register — [Baddies linked to Iran fingered for DNS hijacking to read Middle Eastern regimes' emails](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/) (2019년 1월 10일)
- SecurityWeek — [Iran-Linked DNS Hijacking Attacks Target Organizations Worldwide](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/) (2019년 1월 10일)
- BleepingComputer — [DHS Issues Emergency Directive to Prevent DNS Hijacking Attacks](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/) (2019년 1월)
- Network World — [Cisco Talos details exceptionally dangerous DNS hijacking attack](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html) (2019년 4월 17일)
- Network World — [Cisco: DNSpionage attack adds new tools, morphs tactics](https://www.networkworld.com/article/967303/cisco-dnspionage-attack-adds-new-tools-morphs-tactics.html)
- CERT-IST — [DNSpionage and DNS data hijacking](https://www.cert-ist.com/public/en/SO_detail?format=html&code=dnspionage)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) (2019년 1월 22일)
