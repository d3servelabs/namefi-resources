---
title: 'Dyn DNS 공격: 해킹된 카메라들로 이루어진 Mirai 봇넷이 인터넷 절반을 마비시킨 날'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 11
format: case-study
description: '2016년 10월 21일, Mirai IoT 봇넷을 활용한 DDoS 공격이 세 차례에 걸쳐 DNS 공급자 Dyn을 강타하여 Twitter, Netflix, Reddit, Spotify, GitHub, Airbnb, PayPal을 수 시간 동안 오프라인 상태로 만들었습니다 — DNS 공급자 집중화에 관한 Domain Mayday 사례 연구.'
keywords: ['dyn dns 공격', 'mirai 봇넷', '2016년 10월 21일 DDoS', 'dns ddos 공격', 'iot 봇넷', 'dns 공급자 장애', '도메인 보안', 'dns 단일 장애점', 'dyn ddos 2016', 'mirai 악성코드', '2016년 인터넷 장애', 'dns 이중화', '해킹된 iot 카메라']
relatedArticles:
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-curve-finance-dns-hijack/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-lenovo-com-dns-hijack/
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
  - /ko/glossary/web3/
---

2016년 10월의 어느 금요일, 몇 시간 동안 인터넷은 자기 자신을 찾는 방법을 잊어버렸습니다.

Twitter는 빈 페이지만 불러왔습니다. Netflix는 로딩 화면만 빙빙 돌다 포기했습니다. Reddit, Spotify, GitHub, Airbnb, PayPal — 모두 존재했고, 모두 온라인 상태였으며, 각자의 서버에서 아무런 문제 없이 완벽하게 작동하고 있었지만, 그 어디에도 접근할 수 없었습니다. 해킹된 것도 없었습니다. 데이터가 도난당한 것도 없었습니다. 웹사이트들은 원래 있던 자리에 그대로 있었습니다. 망가진 것은 인터넷에서 *어디에 무엇이 있는지를 알려주는* 부분이었습니다.

공격은 Twitter나 Netflix를 직접 겨냥하지 않았습니다. 대부분의 사용자가 이름조차 들어본 적 없는 회사인 **Dyn** — 뉴햄프셔주에 위치하며 현대 웹의 상당 부분에 DNS, 즉 인터넷의 주소록 서비스를 제공하던 회사 — 를 표적으로 삼았습니다. 그리고 그 무기는 서버 팜이나 국가 수준의 사이버 무기가 아니었습니다. 해킹된 베이비 모니터, 웹캠, 가정용 라우터들로 이루어진 떼거리였습니다. 평범한 가정용 전자기기들이 조용히 징집되어 **Mirai**라는 이름의 군대가 된 것입니다.

이것이 **Domain Mayday EP08**입니다 — 보안이 취약한 스마트 카메라들이 인터넷의 전화번호부를 다운시킨 날의 이야기입니다.

## DNS: 인터넷의 전화번호부, 그리고 그 안에서 Dyn의 위치

도메인 이름을 입력할 때마다, 컴퓨터는 무언가에 연결하기 위해 먼저 그 이름을 숫자로 된 [IP 주소](/ko/glossary/ip-address/)로 변환해야 합니다. 이 변환을 담당하는 것이 바로 DNS, 즉 [도메인 네임 시스템](/ko/glossary/dns/)입니다. DNS는 사람이 읽기 쉬운 이름과 그 이름이 가리키는 실제 기계 사이를 연결하는 조회 계층입니다.

Dyn은 이 조회 서비스를 제공하는 주요 관리형 공급자 중 하나였습니다. 어떤 사이트가 자신의 DNS를 Dyn에 위탁하면, Dyn의 네임서버가 "이 도메인은 어디에 있는가?"에 대한 권위 있는 답변 주체가 됩니다. The Register는 공격 당시 이 의존 관계를 명확하게 설명했습니다. Dyn이 마비되자 Google과 ISP들이 운영하는 공개 DNS 리졸버들이 [Dyn에 연락하여 사용자들의 호스트명을 조회할 수 없게 되었고, 이로 인해 사람들은 DNS로 Dyn을 사용하는 사이트에 접근할 수 없게 되었습니다](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames).

이것이 이 이야기의 핵심에 자리한 조용한 취약성입니다. 어떤 웹사이트가 아무리 완벽하더라도 — 이중화된 서버, 완벽한 가동률, 세계 최고 수준의 엔지니어를 갖추고 있더라도 — "그게 어디 있어요?"라는 질문에 답하는 단 하나의 공급자가 오프라인이 되는 순간 인터넷에서 사라질 수 있습니다. Carnegie Mellon의 CyLab이 나중에 정리했듯이, 영향을 받은 도메인들은 [제3자 DNS인 Dyn에 결정적으로 의존하고 있었습니다. 즉, Dyn에만 전적으로 의존했기 때문에, Dyn이 다운되자 그들도 함께 다운되었습니다](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn).

## 2016년 10월 21일: 파도처럼 밀려온 공격

![거대한 조명이 켜진 전화번호부 교환대 위로 밝게 빛나는 쓰레기 트래픽의 해일이 밀려드는 생생하고 다채로운 개념 미술, 어두운 지도 위에서 디렉토리 조명들이 하나씩 꺼지고 있는 모습](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

공격은 2016년 10월 21일 금요일 아침에 시작되었으며, 한 번의 강타로 온 것이 아니었습니다. 하루 동안 뚜렷이 구분되는 파도로 나뉘어 밀려왔습니다.

Wikipedia의 사건 기록에 따르면, UTC 기준 오전 11시 10분경부터 Dyn을 대상으로 한 [세 차례의 연속적인 분산 서비스 거부 공격](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks)이 이루어졌습니다. 공격의 메커니즘은 교과서적인 분산 서비스 거부 방식이었습니다. [수천만 개의 IP 주소에서 발생한 수많은 DNS 조회 요청을 통해 DDoS 공격이 수행되어](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses) Dyn의 네임서버를 대량의 쓰레기 트래픽으로 압도하여 정상적인 조회 요청이 처리되지 못하게 만들었습니다.

파도가 연이어 밀려오는 것이 이 공격을 더욱 집요하게 느껴지도록 했습니다. 사건을 실시간으로 보도한 The Register는 Dyn이 회복되는 듯했다가 그러지 못했던 순간을 이렇게 묘사했습니다. [첫 번째 쓰레기 트래픽 해일이 시작된 지 두 시간이 지나자 Dyn은 공격을 완화했으며 서비스가 정상으로 돌아오고 있다고 발표했습니다. 그러나 안도는 오래가지 않았습니다. 약 한 시간 후 공격이 재개되었습니다](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave). 끝난 것처럼 보였던 것은 단지 라운드와 라운드 사이의 틈이었을 뿐입니다.

공격의 규모는 당시 기준으로 엄청난 것이었습니다 — 그 시점까지 목격된 가장 큰 DDoS 사건 중 하나로, The Register는 최고치가 [1TBps를 초과했다](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps)고 보도했습니다. (Dyn 자체는 정상 트래픽의 "재시도 폭풍"이 일부 초기 추정치를 부풀렸다고 주의를 환기시켰는데, 이 점은 나중에 다시 다루겠습니다.)

## 어떤 사이트들이 다운되었는가 — 그리고 그것이 어떻게 느껴졌는가

Dyn의 네임서버가 응답하지 못하자, 그 장애는 Dyn에 의존하는 모든 곳으로 파급되었습니다. 이것은 웹의 어느 구석진 영역이 아니었습니다. 소비자 인터넷의 첫 페이지와 같은 곳들이었습니다.

The Register의 실시간 보도는 피해자 일부를 직접 나열했습니다. Dyn에 대한 집중적인 공격이 [Twitter, Amazon, AirBnB, Spotify 등 온라인 대기업들을 포함한 수백 개 기업의 인터넷 서비스를 계속해서 중단시켰습니다](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies). Wikipedia의 피해 서비스 목록은 당시 가장 큰 사이트들을 망라하고 있습니다. [Airbnb, Amazon.com, CNN, GitHub, Netflix, PayPal, Reddit, Spotify, Twitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb) 그리고 수십 개 사이트가 더 있었습니다.

몇 주 전 같은 악성코드에 자신의 사이트가 공격당했던 Brian Krebs는 일반 사용자들의 경험을 이렇게 묘사했습니다. [공격이 Twitter, Amazon, Tumblr, Reddit, Spotify, Netflix를 포함한 다양한 사이트에 접근하려는 인터넷 사용자들에게 문제를 일으키기 시작했습니다](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter). 일반 사용자들의 입장에서는 이해가 가는 오류 메시지도 없었습니다. 사이트가 그냥 로딩되지 않았습니다 — 처음에는 미국 동부 해안에서 시작되어, 이후 파도가 거듭되면서 미국 전역과 유럽까지 확산되었습니다.

## 어떻게 일어났는가: 보안이 취약한 스마트 기기들의 군대

![수천 개의 해킹된 스마트 카메라, 토스터, 베이비 모니터가 빛나는 곤충처럼 떼를 지어 과부하가 걸린 하나의 디렉토리 탑을 향해 몰려드는 생생하고 다채로운 개념 미술](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

여기서부터가 Dyn 공격을 하나의 전환점으로 만든 부분입니다. 화력은 컴퓨터에서 나오지 않았습니다. *사물*에서 나왔습니다.

Mirai는 사물인터넷(IoT) 기기 — 카메라, 라우터, DVR — 를 찾아 장악하는 악성코드입니다. 소비자 하드웨어에서 가장 안일하게 방치된 약점, 즉 기기가 출고될 때 설정된 기본 비밀번호를 악용하는 방식으로 작동합니다. The Register의 설명에 따르면, Mirai는 웹 전체를 돌아다니며 [Telnet과 SSH를 통해 기기의 기본 출고 비밀번호를 사용해 로그인함으로써](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords) 좀비 군단의 규모를 키워나갑니다. Krebs는 그 방식을 더욱 직접적으로 설명했습니다. Mirai는 [공장 기본 사용자명과 비밀번호로 보호되는 IoT 기기를 웹에서 검색한 다음 그 기기들을 공격에 동원합니다](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices).

Dyn 공격의 핵심에 있던 기기들은 대부분 저가형 웹캠과 DVR이었습니다. Krebs는 봇넷의 출처를 추적하여 [중국 첨단 기술 기업 XiongMai Technologies가 제조한 디지털 비디오 레코더(DVR)와 IP 카메라가 주를 이루었다](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders)는 사실을 밝혀냈습니다. 이 기기들의 기본 인증 정보는 많은 경우 [사용자가 사실상 변경할 수 없는](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password) 것이었는데, 비밀번호가 펌웨어에 하드코딩되어 있었기 때문입니다.

Mirai를 단순한 성가심에서 재앙으로 변모시킨 것은 두 가지였습니다. 첫째, 악성코드 제작자가 [2016년 9월 말에 소스 코드를 공개하여 사실상 누구든지 자신만의 공격 군대를 구축할 수 있게 했습니다](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it). 둘째, 취약한 기기의 수가 방대했습니다. Dyn은 공격의 특성을 확인하였는데, 회사는 [상당한 양의 공격 트래픽이 Mirai 기반 봇넷에서 발생했음을 확인했습니다](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai). Wikipedia는 이 봇넷을 [프린터, IP 카메라, 가정용 게이트웨이, 베이비 모니터 등 Mirai 악성코드에 감염된 인터넷 연결 기기들](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors)의 군단으로 묘사합니다.

## 사후 처리: 떼의 규모를 헤아리다 — 그리고 범행자들

먼지가 가라앉고 나서도, *규모가 어느 정도였는가*라는 기본적인 질문조차 답하기 어려운 것으로 밝혀졌습니다. EVP Scott Hilton을 통해 발표된 Dyn의 사후 분석에 따르면 봇넷은 [최대 100,000개의 악성 엔드포인트](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints)로 추정되었는데, 규모는 크지만 일부 초기 수치가 제시했던 "수천만 개의 IP"보다는 작습니다. 이 격차는 피드백 루프에서 비롯되었습니다. 악의적인 공격은 적어도 하나의 봇넷에서 비롯되었으나, [재시도 폭풍이 실제로 밝혀진 것보다 훨씬 더 많은 엔드포인트가 있다는 거짓 지표를 제공했습니다](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20providing%20a%20false%20indicator). 다시 말해, 인터넷의 자동 "재시도" 동작 자체가 혼란을 증폭시켰습니다.

법적 사후 처리도 반전을 더했습니다. Mirai 뒤에 있던 세 명의 젊은이 — Paras Jha, Josiah White, Dalton Norman — 는 결국 ["Mirai 봇넷"의 생성, 운용, 접근권 판매에서의 역할에 대해 유죄를 인정했습니다](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating). 그러나 Dyn 공격 당시에 이미 Jha는 소스 코드를 공개한 상태였으며 — 검사와 기자들은 Dyn 공격자가 반드시 원래 세 사람은 아닐 수 있다는 점을 신중하게 언급했습니다. CyberScoop의 보도에 따르면, [예를 들어 인터넷 성능 관리 회사 Dyn을 대상으로 한 가장 주목받는 Mirai 연계 공격의 배후가 누구인지는 아직 명확하지 않습니다](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind). 무기가 오픈소스가 되는 순간, 누구든 방아쇠를 당길 수 있게 된 것입니다.

Dyn에게 사업적 피해는 실질적이었습니다. 이후 수개월에 걸쳐 수천 개의 도메인이 DNS를 다른 곳으로 이전했고, 하루의 사고로 인해 고객 신뢰에 치명적인 대가를 치러야 했습니다.

## DNS 공급자 집중화가 가르쳐 주는 것

Dyn 공격은 IoT 보안 이야기로 기억되고 있으며, 실제로도 그렇습니다. 그러나 더 깊은 교훈은 *아키텍처*에 있습니다. 인터넷의 너무 많은 부분을 하나의 병목점으로 통과시키는 위험입니다.

10월 21일에 다운된 모든 사이트는 동일한, 언뜻 보면 합리적인 결정을 내린 것이었습니다 — DNS를 하나의 훌륭한 공급자에 위탁하는 것. 개별적으로는 현명한 선택이었습니다. 그러나 집합적으로는, 단 하나의 회사를 무력화하는 것만으로 웹의 상당 부분을 한꺼번에 지울 수 있다는 것을 의미했습니다. CyLab의 결론은 이 공격의 교훈이 [직접적인 영향을 받은 소수의 웹사이트들에 의해서만 실행에 옮겨졌다](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful)는 것이었는데, 이는 수년이 지난 후에도 마찬가지였습니다.

방어적 해답은 이중화입니다. 권위 있는 DNS를 둘 이상의 공급자에 분산시켜 단일 장애가 치명적이 되지 않도록 하는 것입니다. Dyn 사고 2년 후, The Register는 이것이 여전히 드물고 여전히 어렵다는 것을 확인했습니다 — Infoblox의 Cricket Liu는 [예를 들어 복수의 권위 있는 DNS 공급자(Dyn과 Verisign 또는 Neustar를 함께 사용하는 것)를 사용하는 것이 더 쉬워지지 않았다고 지적했습니다. 복수의 공급자를 사용할 수 있다면 큰 차이를 만들 것입니다](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers). 도메인에 의존하는 모든 이들을 위한 교훈은 다음과 같습니다.

1. **도메인에는 [레지스트라](/ko/glossary/registrar/)보다 더 많은 장애 지점이 있습니다.** "이 이름이 어디를 가리키는가?"에 답하는 공급자는 그 뒤에 있는 서버들만큼이나 중요한 역할을 합니다.
2. **단일 공급자 DNS는 단일 장애점입니다.** 정상 조건에서의 탁월한 가동률은 1Tbps 공격 상황에서의 동작에 대해서는 아무것도 보장하지 않습니다.
3. **집중화는 편리하지만 취약합니다.** 한 공급자를 매력적으로 만드는 바로 그 효율성이 그 공급자의 장애를 광범위하게 파급되도록 만듭니다.
4. **복원력은 호스팅뿐 아니라 소유권의 속성입니다.** 무언가가 망가졌을 때, 신속하게 재라우팅할 수 있도록 도메인 설정을 충분히 명확하게 통제할 수 있어야 합니다.

## Namefi의 관점

![검증 가능하고 복원력 있는 도메인 소유권의 다채로운 일러스트레이션 — 초록색 방패, 초록색 Namefi 토큰, DNS 연속성으로 보호되는 도메인 카드](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

Dyn 공격은 단 하나의 도메인도 탈취하지 않았습니다. 이전을 위조하거나 레지스트라 계정을 하이재킹하지도 않았습니다. 그럼에도 불구하고, 몇 시간 동안 해당 도메인을 *소유한* 사람들은 사실상 자신의 이름이 어디를 가리키는지에 대한 통제권을 잃었습니다 — 소유권이 의심스러운 것이 아니라, 도메인 아래의 운영 계층이 한꺼번에 무너졌기 때문입니다.

그 간극 — 이름을 *소유하는 것*과 그것이 어디로 해석되는지를 *안정적으로 통제하는 것* 사이의 간극 — 이 바로 이런 종류의 공격이 파고드는 틈새입니다. 도메인은 기업이 보유한 가장 가치 있는 자산 중 하나지만, 그 통제권은 종종 불투명하고 중앙화된 인프라 뒤에 놓여 있으며, 소유자는 그것을 검증하거나 압박 상황에서 신속하게 재구성하기 어렵습니다.

[Namefi](https://namefi.io)는 도메인이 인터넷 네이티브 자산처럼 동작해야 한다는 아이디어를 기반으로 구축되었습니다. 암호화 방식으로 검증 가능하고 이식 가능한 소유권이면서도 DNS와 완전히 호환됩니다. 검증 가능하고 소유자가 통제하는 [도메인 소유권](/ko/glossary/domain-ownership/)이 봇넷을 막을 수는 없습니다 — 그러나 이름의 통제권이 증명 가능하고 감사 가능하며, 한 공급자의 최악의 날에 조용히 의존하지 않는 세상으로 나아가게 합니다. Mirai-Dyn 공격은 당신이 "소유한" 도메인이 그것을 대신 답하는 계층만큼만 복원력이 있다는 사실을 상기시켜 줍니다. 복원력은 소유권과 통제권을 실제로 검증할 수 있는 것으로 만드는 것에서 시작됩니다.

## 출처 및 추가 읽을거리

- Krebs on Security — [Hacked Cameras, DVRs Powered Today's Massive Internet Outage](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/)
- Wikipedia — [DDoS attacks on Dyn](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn)
- The Register — [DNS devastation: Top websites whacked offline as Dyn dies again](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/)
- The Register — [Today the web was broken by countless hacked devices: your 60-second summary](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/)
- The Register — [Mirai, Mirai, pwn them all: who's the greatest botnet on the whole?](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/)
- The Register — [In the two years since Dyn went dark, what have we learned? Not much, it appears](https://www.theregister.com/2018/10/11/dns_insecurity_survey/)
- BankInfoSecurity — [Botnet Army of 'Up to 100,000' IoT Devices Disrupted Dyn](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486)
- Carnegie Mellon CyLab — [Four years since the Mirai-Dyn attack… is the Internet safer?](https://cylab.cmu.edu/news/2020/10/30-dynattack.html)
- CyberScoop — [Three men plead guilty for roles in Mirai botnet empire](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/)
