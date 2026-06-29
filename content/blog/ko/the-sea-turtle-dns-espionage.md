---
title: 'Sea Turtle: 정부를 감시하기 위해 DNS를 탈취한 국가 지원 캠페인'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 20
format: case-study
description: '2019년 Cisco Talos가 공개한 국가 지원 캠페인 "Sea Turtle"이 어떻게 등록 기관, 레지스트리, DNS 제공업체를 침해하여 DNS를 탈취했는지 — 정부, 부처, 에너지 기업의 트래픽을 공격자 서버로 우회하고, 유효한 인증서를 위조하며, 심지어 국가 최상위 도메인(ccTLD) 레지스트리를 침해한 사건을 분석합니다.'
keywords: ['Sea Turtle DNS 탈취', 'Cisco Talos Sea Turtle', 'DNS 하이재킹 공격', '국가 지원 DNS 공격', '레지스트리 침해', '등록 기관 침해', 'DNS 스파이 캠페인', 'Let''s Encrypt 중간자 인증서', 'Netnod 침해', 'ICS-FORTH 그리스 ccTLD', 'CISA 긴급 지침 19-01', 'DNS 보안', '도메인 소유권 보안', '국가 주체 사이버 공격']
relatedArticles:
  - /ko/blog/the-dnspionage-campaign/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/registrar/
  - /ko/glossary/tld/
  - /ko/glossary/icann/
  - /ko/glossary/registry/
---

대부분의 사이버 공격은 표적 *내부*를 뚫으려 합니다. Sea Turtle 캠페인은 이보다 훨씬 조용하고, 훨씬 위험한 방식을 택했습니다. 표적이 어디에 있는지 알려주는 인터넷 전체의 **지도** 자체를 침해한 것입니다.

정부 부처의 웹 주소를 입력하거나 그 관계자에게 이메일을 보낼 때, 우리 컴퓨터는 먼저 [도메인 이름 시스템](/ko/glossary/dns/) — DNS — 에 질의하여 사람이 읽을 수 있는 이름을 올바른 서버의 숫자 주소로 변환합니다. 이 조회 과정은 인터넷의 가장 근본적인 토대이기에, 거의 어떤 시스템도 이를 별도로 검증하지 않습니다. 우리는 그저 이름이 올바른 목적지로 연결된다고 신뢰할 뿐입니다. Sea Turtle의 운영자들은 이 신뢰 구조를 완벽히 이해했고, 2년 이상에 걸쳐 이를 악용하여 중동과 북아프리카 전역의 정부들을 감시했습니다.

2019년 4월 Cisco Talos가 공개한 Sea Turtle 사건은, DNS 자체가 국가 수준 스파이 활동의 도구로 무기화된 가장 명확한 사례 연구 중 하나입니다. 공격자들은 개별 직원을 피싱하며 요행을 바라지 않았습니다. 그들은 표적보다 *상위*에 위치한 [등록 기관](/ko/glossary/registrar/), 레지스트리, DNS 제공업체 — 이름이 어떻게 해석될지를 결정하는 기관들 — 을 공략했습니다. 그 유리한 위치에서 조직 전체의 트래픽을 우회시키고, 자격 증명을 수집하며, 위장을 불가능하게 만들어야 할 암호화 인증서까지 위조했습니다.

## DNS: 국가 수준 스파이 활동의 표적

DNS를 '인터넷 전화번호부'라고 부르기도 하지만, 이는 그 중요성을 과소평가한 표현입니다. DNS는 오히려 우편 경로 시스템에 가깝습니다. 모든 이메일, 모든 로그인, 모든 API 호출은 이름을 해석하는 것에서 시작됩니다. 해석 과정을 제어하면 목적지를 제어할 수 있고, 양측 모두 비공개로 직접 대화한다고 믿는 통신 한가운데에 눈에 띄지 않게 앉아 있을 수 있습니다.

이로 인해 DNS는 스파이 활동의 거의 완벽한 표적이 됩니다. DNS 제공업체 하나를 침해하면 해당 제공업체에 의존하는 모든 조직의 트래픽을 노출시킬 수 있습니다. 그리고 엔드포인트의 악성코드와 달리, DNS 조작은 피해자의 기기를 전혀 건드리지 않습니다. 스캔할 것도, 격리할 것도 없습니다. 레코드가 단순히 새로운 곳을 가리킬 뿐입니다.

Talos는 이 메커니즘을 명확하게 설명했습니다. 보고서에서 [DNS 하이재킹은 공격자가 DNS 이름 레코드를 불법으로 수정하여 사용자를 공격자가 제어하는 서버로 유도할 수 있을 때 발생한다](https://blog.talosintelligence.com/seaturtle/#:~:text=DNS%20hijacking%20occurs%20when%20the%20actor%20can%20illicitly%20modify%20DNS%20name%20records%20to%20point%20users%20to%20actor%2Dcontrolled%20servers)고 서술했습니다. 설명은 단순하지만, 실제 피해는 막심합니다.

## Sea Turtle 캠페인 (2017–2019)

![국가 주체 행위자의 그림자가 거북이 실루엣으로 표현되어 있으며, 양식화된 지역 지도 위에서 빛나는 화살표들을 숨겨진 서버 방향으로 조용히 우회시키는 생생하고 화려한 개념 아트, 네온 네트워크 선이 구부러지며 이어지는 장면](../../assets/the-sea-turtle-dns-espionage-01-campaign.jpg)

Sea Turtle은 단순한 약탈 작전이 아니었습니다. Talos는 [진행 중인 작전이 빠르면 2017년 1월에 시작되어 2019년 1분기까지 계속된 것으로 평가된다](https://blog.talosintelligence.com/seaturtle/#:~:text=The%20ongoing%20operation%20likely%20began%20as%20early%20as%20January%202017%20and%20has%20continued%20through%20the%20first%20quarter%20of%202019)고 분석했습니다. 2년 이상에 걸친 인내심 있고 지속적인 작전이었습니다.

그 기간 동안 Talos의 집계에 따르면, [이 캠페인을 통해 13개국 40개 이상의 다양한 조직이 침해되었습니다](https://blog.talosintelligence.com/seaturtle/#:~:text=at%20least%2040%20different%20organizations%20across%2013%20different%20countries%20were%20compromised%20during%20this%20campaign). TechCrunch는 그 규모를 이렇게 요약했습니다. 이 그룹은 [13개국의 정부 및 정보 기관, 통신 기업, 인터넷 대기업 40곳을 2년 이상 표적으로 삼았으며](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/), 피해자는 [아르메니아, 이집트, 터키, 스웨덴, 요르단, 아랍에미리트](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/) 등에서 발견되었습니다.

Talos는 캠페인을 특정 정부에 공개적으로 귀속시키기를 거부했지만, 운영자의 수준에 대해서는 확신했습니다. Cisco Talos의 Craig Williams는 TechCrunch에 [이 그룹은 이전에는 볼 수 없었던 독특한 방식으로 운영되며, 새로운 전술, 기법, 절차를 사용한다](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)고 밝혔으며, 팀은 이 그룹의 [주요 동기가 스파이 활동](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)이라고 평가했습니다.

## 표적과 위험의 규모

피해 기관 목록은 정보 수집 목표물 목록처럼 읽힙니다. Talos는 주요 표적을 [국가 안보 기관, 외무부, 주요 에너지 기업](https://blog.talosintelligence.com/seaturtle/#:~:text=national%20security%20organizations%2C%20ministries%20of%20foreign%20affairs%2C%20and%20prominent%20energy%20organizations)으로 파악했습니다. 적대적인 국가가 내부 통신을 가장 원할 기관들이 바로 이것들입니다.

두 번째 피해 계층은 어떤 의미에서 더욱 시사하는 바가 컸습니다. Talos는 공격자들이 [다수의 DNS 등록 기관, 통신 회사, 인터넷 서비스 제공업체](https://blog.talosintelligence.com/seaturtle/#:~:text=numerous%20DNS%20registrars%2C%20telecommunication%20companies%2C%20and%20internet%20service%20providers)도 침해했음을 확인했습니다. 이들은 궁극적인 표적이 아니었습니다. 이들은 *수단*이었습니다. 인프라 제공업체를 장악함으로써 공격자들은 하위 실제 표적의 DNS를 조작할 수 있는 레버리지를 획득했습니다.

BleepingComputer의 요약은 이를 명확히 포착했습니다. 주요 표적은 [외무부, 군사 조직, 정보 기관, 에너지 기업](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)이었습니다. 외무부의 이메일과 로그인 트래픽을 조용히 가로챌 수 있다면 암호화를 뚫을 필요가 없습니다. 자격 증명을 수집하고 메일이 흘러들어오는 대로 읽으면 그만입니다.

## 사건의 전개: 신뢰 사슬을 탈취하다

![중간자 공격 인물이 빛나는 정부 봉투 흐름을 가로채 각각에 위조된 녹색 도장을 찍은 뒤 전달하는 장면, 두 자물쇠가 갈라진 파이프라인 양쪽을 마주 보고 있는 생생하고 화려한 개념 아트](../../assets/the-sea-turtle-dns-espionage-02-registry-compromise.jpg)

Sea Turtle이 유달리 정교했던 이유가 여기 있습니다. 공격자들은 표적에 직접 접근하는 경우가 드물었습니다. 대신 신뢰 사슬을 타고 올라갔습니다.

Talos가 재구성하고 독립 보도를 통해 확인된 공격 패턴은 대략 다음과 같습니다. 먼저 DNS 제공업체, 등록 기관 또는 [레지스트리](/ko/glossary/registry/)에서 발판을 마련합니다. 주로 스피어 피싱이나 알려진 취약점 악용을 통해서입니다. 이 접근 권한을 통해 [표적의 합법적인 사용자가 공격자 제어 서버를 향하도록 DNS 레코드를 수정합니다](https://blog.talosintelligence.com/seaturtle/#:~:text=Modified%20DNS%20records%20to%20point%20legitimate%20users%20of%20the%20target%20to%20actor%2Dcontrolled%20servers). 그 서버들은 중간자(MitM) 계층으로 구성되었습니다. BleepingComputer에 따르면, [Sea Turtle 운영자들은 로그인 자격 증명을 탈취할 목적으로 피해자가 이용하는 합법적인 서비스를 사칭하는 중간자 프레임워크를 구축했습니다](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/). 피해자들은 평소와 다름없어 보이는 메일 또는 VPN 포털에 로그인했고, 공격자들은 [사용자가 공격자 제어 서버와 상호작용할 때 합법적인 사용자 자격 증명을 수집](https://blog.talosintelligence.com/seaturtle/#:~:text=Captured%20legitimate%20user%20credentials%20when%20users%20interacted%20with%20these%20actor%2Dcontrolled%20servers)한 뒤 조용히 실제 서비스로 중계하여 아무 이상이 없는 것처럼 보이게 했습니다.

가장 영리하고 가장 우려스러운 부분은 자물쇠를 무력화한 방법이었습니다. 트래픽을 우회시키는 것은 한 가지 과제이고, 브라우저 인증서 경고를 발생시키지 않으면서 그렇게 하는 것은 또 다른 문제입니다. Sea Turtle은 자신들이 사칭하는 도메인의 정품 유효 인증서를 획득하는 방식으로 이를 해결했습니다. Talos는 공격자들이 [동일한 도메인에 대해 다른 제공업체로부터 인증 기관 서명 X.509 인증서를 획득했으며](https://blog.talosintelligence.com/seaturtle/#:~:text=obtained%20a%20certificate%20authority%2Dsigned%20X.509%20certificate), [이 행위자들은 MitM 서버에 Let's Encrypt, Comodo, Sectigo 및 자체 서명 인증서를 사용한다](https://blog.talosintelligence.com/seaturtle/#:~:text=use%20Let%27s%20Encrypts%2C%20Comodo%2C%20Sectigo%2C%20and%20self%2Dsigned%20certificates)고 밝혔습니다. DNS 레코드를 제어했기 때문에, 무료 인증 기관이 의존하는 자동화된 도메인 유효성 검사를 통과할 수 있었고, 실제로는 소유하지도 않은 도메인에 대한 정품 녹색 자물쇠를 손에 넣었습니다.

Brian Krebs는 밀접하게 관련된 이전 공격 파동을 문서화하며 동일한 수법을 설명했습니다. 공격자들은 [도메인이 자신들이 제어하는 유럽의 서버를 가리키도록 해당 도메인의 DNS 레코드를 변경한 것으로 보이며](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/), 이후 [SSL 제공업체 Comodo 및/또는 Let's Encrypt로부터 해당 도메인의 SSL 인증서를 획득할 수 있었습니다](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/). 인용된 피해자 중에는 [아랍에미리트 정부 기관의 이메일을 처리하는 mail.gov.ae](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)도 포함되어 있었습니다.

### 레지스트리 침해

이 캠페인의 정점은 DNS를 *사용*하는 것이 아니라 국가 전체를 위해 DNS를 *운영*하는 조직들의 침해였습니다.

최초로 공개 확인된 사례는 스웨덴의 Netnod와 관련이 있습니다. Krebs가 보도한 바와 같이, 공격자들은 [Netnod의 도메인 이름 등록 기관 계정에 접근했으며](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/), Netnod 자체는 [1월 2일에 공격에서 자신들의 역할을 알게 되었다](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)고 밝혔습니다. 결정적으로 Netnod는 목적지가 아니었습니다. 그것은 통로였습니다. BleepingComputer는 Netnod가 [자신들은 공격의 표적이 아니라 공격자가 "인터넷 서비스 로그인 정보를 탈취"하는 경로였다](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)고 밝혔음을 전했습니다.

Talos는 더 넓은 의미를 냉정하게 서술했습니다. 이 운영자들은 [루트 서버 영역을 관리하는 조직에 대한 최초의 공개 확인된 공격 사례를 만든 주체](https://blog.talosintelligence.com/seaturtle/#:~:text=responsible%20for%20the%20first%20publicly%20confirmed%20case%20against%20an%20organizations%20that%20manages%20a%20root%20server%20zone)였습니다. 인터넷 핵심 주소록의 일부를 운영하는 사람들이 조용히 사칭될 수 있다면, DNS가 기본적으로 신뢰할 수 있다는 전제는 더 이상 성립하지 않습니다.

## 대응과 그 후: 그들은 멈추지 않았다

이 규모의 [DNS 하이재킹](/ko/glossary/dns-hijacking/)은 공식적인 대응을 불러왔습니다. 2019년 1월, 미국 사이버보안 및 인프라 보안국(CISA)은 [긴급 지침 19-01 "DNS 인프라 변조 완화"](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)를 발령했습니다. CISA가 발령한 최초의 긴급 지침으로, 연방 기관에 DNS 레코드 감사, DNS 관리 계정 자격 증명 변경, 해당 계정 다중 인증 활성화를 명령했습니다. 이는 DNS 관리가 국가 안보의 최전선이 되었다는 사실상의 인정이었습니다.

그러나 Sea Turtle에서 가장 놀라운 점은 사건이 공개된 *이후*에 일어난 일입니다. 대부분의 캠페인은 Talos와 같은 업체가 수법을 공개하면 잠잠해집니다. Sea Turtle은 정반대였습니다.

2019년 7월 추가 보고에서 Talos는 이 그룹이 새로운 피해자를 발견했다고 밝혔습니다. 그 중에는 [특정 국가 코드를 사용하는 모든 도메인의 DNS 레코드를 관리하는 국가 코드 최상위 도메인(ccTLD) 레지스트리](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=a%20country%20code%20top%2Dlevel%20domain%20%28ccTLD%29%20registry)도 포함되어 있었습니다. 구체적으로, [그리스의 ccTLD인 정보 과학 재단 연구 기술 헬라스 연구소(ICS-FORTH)](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=The%20Institute%20of%20Computer%20Science%20of%20the%20Foundation%20for%20Research%20and%20Technology%20%2D%20Hellas%20%28ICS%2DForth%29%2C%20the%20ccTLD%20for%20Greece) — `.gr` 네임스페이스를 운영하는 기관 — 이 침해되었습니다. SecurityWeek는 ICS-FORTH가 침해 사실을 공개적으로 인정한 후에도 [Cisco 텔레메트리가 적어도 5일 더 침해가 지속됨을 확인했다](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)고 보도했습니다.

이 그룹에 대한 Talos의 평가는 이례적으로 단호했습니다. [이 그룹은 유독 대담해 보이며, 앞으로도 억제될 가능성이 낮다](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=this%20group%20appears%20to%20be%20unusually%20brazen%2C%20and%20will%20be%20unlikely%20to%20be%20deterred%20going%20forward)는 것이었습니다. 그 예측은 옳았습니다. Sea Turtle은 일회성 사건이 아니었습니다. DNS 계층 스파이 활동이 효과적임을, 그리고 이를 수행하는 사람들이 공개된 상황에서도 계속할 의지가 있음을 증명한 사례였습니다.

## DNS가 핵심 인프라임을 가르쳐 주는 교훈

지정학을 걷어내면 Sea Turtle은 인터넷의 네이밍 계층이 실제로 어떻게 작동하는지에 대한 불편한 교훈들을 남깁니다.

1. **DNS는 신뢰 사슬이며, 그 전체를 당신이 제어하지는 않습니다.** 당신의 보안이 뛰어날 수 있습니다. 하지만 도메인의 해석은 등록 기관과 레지스트리를 통과하며, 둘 중 하나라도 침해되면 당신의 네트워크를 건드리지 않고도 레코드가 변경될 수 있습니다. Sea Turtle은 공격자들이 당신이 가장 가시성이 낮은 사슬의 고리를 의도적으로 표적으로 삼는다는 것을 증명했습니다.

2. **유효한 인증서가 합법적인 목적지의 증거는 아닙니다.** 녹색 자물쇠는 *현재 도메인을 제어하는 사람*에게 연결이 암호화되어 있음을 증명할 뿐입니다. 공격자가 DNS를 탈취했다면, 그 제어자는 바로 그 공격자입니다. 도메인 유효성 검사 인증서는 검증에 사용되는 DNS만큼만 신뢰할 수 있습니다.

3. **DNS 조작은 피해자에게 거의 보이지 않습니다.** 피해자의 기기에서 악성코드가 실행되지 않습니다. 엔드포인트 스캐너는 아무것도 발견하지 못합니다. 유일한 신호는 레코드가 있어서는 안 될 곳을 가리키고 있다는 것입니다. 바로 그렇기 때문에 DNS 레코드의 예상치 못한 변경을 모니터링하고 이를 잠그는 것이 중요합니다.

4. **등록 기관과 레지스트리 계정 보안은 국가 안보 인프라입니다.** CISA 최초의 긴급 지침은 본질적으로 DNS 관리 계정의 자격 증명에 관한 것이었습니다. 다중 인증, 레지스트리 잠금, DNS 레코드를 변경할 수 있는 계정에 대한 엄격한 접근 제어는 보안 위생의 편의 사항이 아닙니다. 그것은 도메인을 실제로 소유하는 것과 단지 소유한 것처럼 보이는 것의 차이입니다.

## Namefi의 관점

![검증 가능하고 변조 방지 기능을 갖춘 도메인 소유권의 컬러풀한 일러스트 — 녹색 방패와 Namefi 토큰으로 보호된 도메인 카드, DNS 연속성](../../assets/the-sea-turtle-dns-espionage-03-namefi-angle.jpg)

Sea Turtle은 근본적으로 *누가 도메인의 레코드를 변경할 권한을 가지는가* — 그리고 그 권한이 조용히 탈취되었을 때 나머지 세계가 이를 얼마나 알아채기 어려운가에 대한 이야기입니다.

전통적인 모델은 그 권한을 등록 기관 및 레지스트리 계정에 집중시키며, 너무나 자주 비밀번호와 이메일 주소 하나만으로 보호됩니다. 그 계정이 침해되면 도메인의 제어도 함께 조용히 사라집니다. 누가 합법적으로 이름을 보유하는지에 대한 독립적으로 검증 가능한 내장 레코드가 없으며, 제어권이 이전될 때 변조 기록도 남지 않습니다.

[Namefi](https://namefi.io)는 DNS와의 호환성을 유지하면서 [도메인 소유권](/ko/glossary/domain-ownership/)이 **설계 자체에서 검증 가능하고 변조 방지적이어야 한다**는 관점으로 접근합니다. 소유권을 토큰화하면 도메인을 제어하는 사람에 대한 감사 가능하고 암호화 방식으로 고정된 레코드가 생성됩니다. 이를 통해 무단 이전과 조용한 탈취는 명백한 흔적을 남기지 않고는 실행하기가 훨씬 어려워집니다. 물론 이것만으로 레지스트리가 피싱당하는 것을 막을 수는 없습니다. 그러나 Sea Turtle이 우리에게 전달하는 더 큰 교훈은 Namefi가 구축된 근거와 같습니다. 도메인은 핵심 인프라이며, *누가 진정으로 이 이름을 소유하는가*라는 질문은 "제어판에 로그인할 수 있는 사람"보다 더 강력한 답을 받을 자격이 있습니다.

이 캠페인은 *도메인을 보유하는 것*과 *보유하고 있음을 증명하는 것* 사이의 간극을 악용하여 정부들의 트래픽을 우회시켰습니다. 그 간극을 닫는 것 — 소유권을 검증 가능하게, 이전을 감사 가능하게, 제어의 연속성을 증명 가능하게 만드는 것 — 이야말로 네이밍 계층이 여전히 필요로 하는 회복력의 핵심입니다.

## 출처 및 추가 자료

- Cisco Talos — [DNS Hijacking Abuses Trust In Core Internet Service](https://blog.talosintelligence.com/seaturtle/)
- Cisco Talos — [Sea Turtle keeps on swimming, finds new victims, DNS hijacking techniques](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/)
- TechCrunch — [A new state-backed hacker group is hijacking government domains at a phenomenal pace](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)
- BleepingComputer — ['Sea Turtle' Campaign Focuses on DNS Hijacking to Compromise Targets](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)
- SecurityWeek — [Sea Turtle's DNS Hijacking Continues Despite Exposure](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)
- BankInfoSecurity — ['Sea Turtle' DNS Hijacking Group Conducts Espionage: Report](https://www.bankinfosecurity.com/sea-turtle-dns-hijacking-group-conducts-espionage-report-a-12390)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)
- SDxCentral — [Cisco Talos Says a Nation State Is Behind Sea Turtle DNS Hijacking Attacks](https://www.sdxcentral.com/articles/news/cisco-talos-says-a-nation-state-is-behind-sea-turtle-dns-hijacking-attacks/2019/04/)
- SecurityWeek — [State-Sponsored Hackers Use Sophisticated DNS Hijacking in Ongoing Attacks](https://www.securityweek.com/state-sponsored-hackers-use-sophisticated-dns-hijacking-ongoing-attacks/)
