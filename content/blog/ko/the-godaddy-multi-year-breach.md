---
title: 'GoDaddy의 다년간 보안 침해: 세계 최대 도메인 등록기관에 공격자가 3년간 잠복한 사건'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 13
format: case-study
description: '2020년부터 2022년까지, 단일 위협 행위자 그룹이 GoDaddy의 내부 인프라에 상주하며 소스 코드를 탈취하고, Managed WordPress 고객 120만 명의 데이터를 노출시키며, 간헐적으로 고객 웹사이트를 악성 사이트로 리디렉션했습니다. 도메인 등록기관 집중 리스크와 단일 장애점이 주는 교훈을 심층 분석합니다.'
keywords: ['godaddy 침해', 'godaddy 데이터 유출', 'managed wordpress 침해', '등록기관 보안', '도메인 보안', '다년간 침해', 'cpanel 악성코드', '웹사이트 리디렉션 공격', 'ssl 개인키 유출', 'sftp 비밀번호 유출', 'sec 10-k 사이버보안', '등록기관 집중 리스크', '단일 장애점']
relatedArticles:
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-dnspionage-campaign/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/the-badgerdao-frontend-attack/
  - /ko/blog/the-icann-spear-phishing-breach/
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
  - /ko/glossary/web3/
  - /ko/glossary/tld/
---

도메인 [등록기관](/ko/glossary/registrar/)은 당신이 전적으로 의존하면서도 가장 따분하게 여기는 회사입니다.

매년 한 번 요금을 내고, 아마 일 년에 두 번쯤 로그인할 것입니다. 그 대가로 이 회사는 당신의 비즈니스를 온라인에서 찾을 수 있게 해주는 단 한 가지를 보유합니다. 바로 "이 도메인 이름은 여기를 가리킨다"고 선언할 수 있는 권한입니다. 이메일, 웹사이트, 로그인, 결제 — 당신이 보유한 모든 디지털 자산의 흐름은 결국 도메인의 DNS를 누가 관리하느냐로 귀결됩니다. 대부분의 사람들은 가입 후 그 회사에 대해 다시는 생각하지 않습니다.

하지만 2년 넘는 기간 동안, 정교한 위협 행위자 그룹은 GoDaddy에 대해 끊임없이 생각하고 있었습니다. 그들은 그 내부에 살고 있었으니까요.

GoDaddy는 수천만 명의 고객과 8,000만 개 이상의 도메인을 관리하는 세계 최대의 도메인 등록기관입니다. 그런데 적어도 2019년 말부터 2022년 말까지, GoDaddy가 현재 파악하기로는, 동일한 지속적 침입자가 시스템 전반을 반복적으로 이동하며 소스 코드를 탈취하고, Managed WordPress 고객 120만 명의 데이터를 노출시키며, 한때는 무작위 고객 웹사이트를 악성 목적지로 조용히 리디렉션했습니다. GoDaddy는 이것을 단순한 일회성 침입으로 설명하지 않았습니다. 미국 증권거래위원회(SEC)에 제출한 서류에서, 이 회사는 [정교한 위협 행위자 그룹에 의한 다년간의 캠페인](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=Based%20on%20our%20investigation%2C%20we%20believe%20these%20incidents%20are%20part%20of%20a%20multi%2Dyear%20campaign%20by%20a%20sophisticated%20threat%20actor%20group)이라고 명시했습니다.

이것이 바로 당신 시스템 스택의 맨 아래에 자리한 그 따분한 회사가 수백만 명에게도 공통된 단일 장애점으로 판명되었을 때 어떤 일이 벌어지는지를 보여줍니다.

## 등록기관 하나가 수백만 명의 단일 장애점이 되는 이유

집중화는 대형 도메인 등록기관의 비즈니스 모델 그 자체입니다. 규모의 경제가 작동해야만 수익성이 생깁니다. 하나의 프로비저닝 시스템, 하나의 제어판, 하나의 자격증명 저장소, 하나의 호스팅 서버 세트로 모든 고객을 서비스하는 것입니다. 바로 그 효율성이 GoDaddy를 편리하게 만들고 — 동시에, 공격자가 침투했을 때 위험하게 만드는 요인입니다.

소규모 기업 하나가 해킹당하면, 그 기업 하나가 힘든 한 주를 보냅니다. 하지만 수백만 개 기업의 도메인, 웹사이트, 인증서를 보유한 플랫폼이 해킹당하면, 피해 범위는 더 이상 한 회사가 아닙니다. 그 회사에 자신의 이름을 맡긴 모든 사람이 피해를 입습니다.

이것이 등록기관 리스크의 핵심에 있는 비대칭성입니다. 고객은 GoDaddy를 자신만의 사설 대시보드처럼 경험합니다. 하지만 공격자는 이를 수백만 개의 열쇠가 동시에 보관된 금고로 경험합니다 — 그리고 자물쇠는 단 한 번만 따면 됩니다.

여기서 "단일 장애점"이 두 가지 층위에서 동시에 작동한다는 점을 정확히 짚어볼 필요가 있습니다. 첫 번째는 등록기관 층위입니다. 도메인의 DNS가 어디를 가리킬지 결정하는 권한이 여기에 있습니다. 이것이 침해되면 공격자는 이메일을 포함한 도메인 전체를 다른 곳으로 리디렉션할 수 있습니다. 두 번째는 호스팅 및 인증서 층위입니다. 실제 웹사이트를 서비스하고 인증하는 서버, 자격증명, SSL 키가 여기에 있습니다. GoDaddy는 동일한 고객에 대해 두 층위 모두를 동시에 장악하는 드문 기업 중 하나입니다. 그래서 동일한 침입자가 이번 캠페인에서 프로비저닝 시스템, 호스팅 서버, 인증서 자료 모두를 건드렸을 때, 이는 서로 무관한 피해자들 사이를 이동한 것이 아니었습니다. 동일한 수백만 개의 문에 서로 다른 종류의 열쇠를 보관하고 있는 하나의 회사 내부를 돌아다닌 것이었습니다.

![중앙에 거대한 금고 하나가 있고, 수백만 개의 빛나는 도메인 열쇠가 천장까지 쌓여 있으며, 그림자 속 침입자가 접이의자에 편안하게 앉아 수년째 살고 있는 듯한 생동감 넘치는 컨셉 아트, 극적인 조명](../../assets/the-godaddy-multi-year-breach-01-breach.jpg)

## 타임라인: 2019 → 2022

GoDaddy 사건에서 불안감을 주는 것은 어느 단일 사건이 아닙니다. 개별 사건들을 종합해 보면 수년에 걸친 점령 행위로 이어진다는 점입니다. GoDaddy 자신도 이 연결 고리를 사후에야 파악했습니다.

**2019년 말 / 2020년 3월 — 최초 거점 확보.** 2020년에 공개된 침해 사건 이후, GoDaddy는 [2019년 10월에 공격자가 웹 호스팅 계정 자격증명을 사용했다며 2만 8,000명의 고객에게 알렸습니다](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=GoDaddy%20alerted%2028%2C000%20customers%20that%20an%20attacker%20used%20their%20web%20hosting%20account%20credentials%20in%20October%202019). SSH를 통해 호스팅 계정에 접속한 것입니다. 공격자는 제로데이 취약점이 필요하지 않았습니다. 자격증명만 있으면 됐고, 그걸 손에 넣었습니다. 이후 보안 보고서는 이 공격의 흐름을 소셜 엔지니어링으로 귀인했습니다 — 공격자들이 [전화로 직원 및 고객을 사칭](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)하여 접근 권한을 넘겨받은 것입니다. GoDaddy가 InformationWeek에 요약한 바에 따르면, [2020년 3월, 위협 행위자가 고객 2만 8,000명의 로그인 자격증명을 탈취했습니다](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=In%20March%202020%2C%20a%20threat%20actor%20compromised%20the%20login%20credentials%20of%2028%2C000%20customers).

**2021년 9월~11월 — 최대 규모의 사건.** 2021년 11월 22일, GoDaddy는 Managed WordPress 호스팅 환경 침해 사실을 공개했습니다. 피해 규모는 가혹했습니다. [GoDaddy가 이 사건을 발견한 것은](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20incident%20was%20discovered%20by%20GoDaddy%20last%20Wednesday%2C%20on%20November%2017%2C%20but%20the%20attackers%20had%20access%20to%20its%20network%20and%20the%20data%20contained%20on%20the%20breached%20systems%20since%20at%20least%20September%206%2C%202021) 2021년 11월 17일이었지만, 공격자들은 적어도 2021년 9월 6일부터 접근 권한을 유지하고 있었습니다. 탐지되지 않은 채 약 두 달 반 동안 내부에 있었던 셈입니다. TechCrunch의 보도에 따르면, [무단 접근자는 탈취된 비밀번호를 이용해 9월 6일경 GoDaddy 시스템에 접근했습니다](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/#:~:text=the%20unauthorized%20person%20used%20a%20compromised%20password%20to%20get%20access%20to%20GoDaddy%27s%20systems%20around%20September%206).

**2022년 12월 — 악성코드와 리디렉션.** 1년 후, 패턴이 다시 수면 위로 올라왔습니다. GoDaddy는 [2022년 12월 초 고객들로부터 자신들의 사이트가 무작위 도메인으로 리디렉션되는 데 사용되고 있다는 신고를 접수했습니다](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=customer%20reports%20in%20early%20December%202022%20that%20their%20sites%20were%20being%20used%20to%20redirect%20to%20random%20domains). 이어진 조사 끝에 2023년 2월 공개 발표가 이루어졌고 — 이것이 새로운 공격자가 아니라, 2020년부터 반복된 동일한 캠페인이라는 사실이 드러났습니다.

순서대로 읽으면, 이것은 세 건의 별개 침해가 아닙니다. 한 명의 장기 거주자를 세 번 목격한 것입니다.

이 타임라인이 더욱 충격적인 것은 목격 사이의 공백 때문입니다. 몇 달, 그리고 또 1년. 각각의 개별 사건은 공개 당시에는 시작과 끝이 있는 독립된 사건처럼 보였습니다. 여기서는 비밀번호를 재설정하고, 저기서는 인증서를 재발급하는 식으로요. GoDaddy 조사관들이 2022년 12월 악성코드를 도구와 방법론을 통해 역추적하고 나서야, 각 사건들은 우연의 일치가 아니라 하나의 패턴으로 보이기 시작했습니다. 이번 공개 발표에서 가장 섬뜩한 문장은, 이 모든 일이 수년 동안 아무도 연결하지 못한 채 계속됐다는 조용한 인정입니다.

## 유출된 것 — 그리고 고객에게 등을 돌린 웹사이트들

2021년 Managed WordPress 침해는 피해가 가장 명확하고 수치화된 사건입니다. GoDaddy가 SEC에 제출한 공식 통보서에 이것이 명확하게 기술되어 있습니다.

최대 120만 명의 활성 및 비활성 Managed WordPress 고객의 이메일 주소와 고객 번호가 노출됐습니다. 더 심각한 것은, [프로비저닝 당시 설정된 최초 WordPress 관리자 비밀번호가 노출됐다](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20original%20WordPress%20Admin%20password%20that%20was%20set%20at%20the%20time%20of%20provisioning%20was%20exposed)는 점입니다. WordPress 설치의 마스터 키나 다름없었습니다. 활성 고객의 경우 sFTP와 데이터베이스 사용자 이름 및 비밀번호가 노출됐습니다. 파일을 업로드하고 데이터베이스를 직접 읽을 수 있는 자격증명이었습니다. 그리고 가장 민감한 일부 고객의 경우, [SSL 개인키가 노출됐습니다](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=For%20a%20subset%20of%20active%20customers%2C%20the%20SSL%20private%20key%20was%20exposed). 사이트가 실제로 본인임을 증명하는 암호화 비밀이었습니다.

이것들을 모두 합치면 최악의 시나리오를 위한 도구 세트가 됩니다. 관리자 비밀번호는 사이트에 접근하게 해줍니다. sFTP와 데이터베이스 접근은 파일 및 데이터 계층에서 사이트를 변조할 수 있게 해줍니다. 그리고 SSL [개인키](/ko/glossary/private-key/) — Wordfence가 [이번 침해 분석](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)에서 지적했듯이 — 는 공격자가 사이트를 사칭하거나 트래픽을 복호화할 수 있게 해줄 수 있습니다. 신뢰의 닻이 되어야 할 등록기관이 오히려 침입자에게 신뢰를 위조할 수 있는 재료를 넘겨준 셈입니다.

| 유출된 항목 | 피해 대상 | 이것으로 할 수 있는 것 |
| --- | --- | --- |
| 이메일 + 고객 번호 | 최대 120만 명의 활성·비활성 고객 | 표적 피싱, 계정 매핑 |
| 최초 WordPress 관리자 비밀번호 | 해당 고객 (여전히 사용 중인 경우) | WordPress 설치 전체 제어 |
| sFTP + 데이터베이스 자격증명 | 활성 고객 | 파일 수준 및 데이터베이스 수준의 사이트 변조 |
| SSL 개인키 | 일부 활성 고객 | 사이트 사칭, 트래픽 복호화 |

노출의 범위를 보면 이것이 일반적인 사이트 해킹과 본질적으로 다른 이유를 알 수 있습니다. 일반적인 해킹은 하나의 사이트를 침해합니다. 이번에는 공유 프로비저닝 시스템의 단 한 번 침해로 100만 개 이상의 사이트 열쇠가 한 번에 노출됐습니다.

그리고 데이터 침해를 더욱 생생한 공포로 만드는 부분이 있습니다. 고객 웹사이트가 방문자를 악성 사이트로 리디렉션하기 시작한 것입니다. 2022년 12월, [무단 제3자가 cPanel 호스팅 서버에 접근하여 악성코드를 설치했습니다](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=an%20unauthorized%20third%20party%20gained%20access%20to%20and%20installed%20malware%20on%20our%20cPanel%20hosting%20servers)고 GoDaddy는 밝혔으며, [악성코드는 간헐적으로 무작위 고객 웹사이트를 악성 사이트로 리디렉션했습니다](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=The%20malware%20intermittently%20redirected%20random%20customer%20websites%20to%20malicious%20sites). "간헐적으로"와 "무작위"라는 단어가 핵심입니다. 매번 발동되는 리디렉션은 쉽게 잡힙니다. 하지만 때로는, 일부 방문자에게, 일부 사이트에서만 발동되는 리디렉션은 소규모 기업주가 신고하려 해도 재현이 안 되는 — 호스팅 업체가 일회성 오류로 묵살할 수 있는 — 종류의 문제입니다. 이 공격에는 위장이 내장되어 있었습니다.

## 어떻게 일어났나: 잠금장치를 뚫은 게 아니라 열쇠를 빌린 것

GoDaddy 사건에서 가장 불편한 교훈은 침투 방식이 얼마나 평범했냐는 것입니다.

이 사건의 중심에는 정교한 제로데이 취약점 같은 것이 없습니다. 첫 번째 파도는 탈취된 자격증명으로 실행됐습니다. 2021년 침해는 [탈취된 비밀번호](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=1.2%20million%20Managed%20WordPress%20customers%20after%20attackers%20breached%20GoDaddy%27s%20WordPress%20hosting%20environment%20using%20a%20compromised%20password)로 이루어졌습니다. Krebs on Security는 이 캠페인 분석의 제목을 ["저기술 해킹이 고파급 침해를 일으킬 때"](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)라고 붙였습니다 — 침투 기법의 정교함과 파급력이 그만큼 불균형했기 때문입니다. 누군가 열쇠를 건네준다면 금고를 뚫을 필요가 없습니다.

일단 내부에 들어오자 공격자는 인내심 있고 전문적인 방식으로 행동했습니다. 그들은 머물렀습니다. 이번 캠페인 전반에 걸쳐 GoDaddy는 공격자들이 [시스템에 악성코드를 설치하고 GoDaddy 내 일부 서비스와 관련된 코드 조각을 탈취했다](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=installed%20malware%20on%20our%20systems%20and%20obtained%20pieces%20of%20code%20related%20to%20some%20services%20within%20GoDaddy)고 밝혔습니다. 탈취된 소스 코드는 일회성 손실이 아닙니다. 그것은 지도입니다. 공격자에게 자신이 이미 내부에 있는 시스템이 어떻게 작동하는지 알려줍니다. 취약한 연결 지점이 어디인지, 인증 흐름이 어떻게 되는지, 다음에 무엇을 공략해야 하는지를요. 지속적인 악성코드와 결합되면, 이는 단순한 약탈과 장기 점령의 차이를 만들어냅니다. BleepingComputer가 GoDaddy 자체 결론을 요약한 것처럼, [위협 행위자들은 수년에 걸쳐 반복적으로 회사 시스템에 악성코드를 설치하고 코드를 탈취할 수 있었습니다](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=Threat%20actors%20were%20able%20to%20install%20malware%20on%20the%20company%27s%20systems%20and%20steal%20code).

탐지 공백은 이 이야기의 또 다른 절반입니다. 2021년 사건에서는 두 달 반, 전체 캠페인으로 보면 수년이었습니다. 공격자가 GoDaddy의 방어보다 빠른 것이 아니라, 모니터링보다 조용했던 것입니다.

![수백 개의 우편함 문을 한꺼번에 여는 빛나는 해골 열쇠 하나와, 벽을 따라 덩굴처럼 기어오르는 희미한 악성코드 촉수가 그려진 생동감 넘치는 컨셉 아트, 극적인 네온 조명, 로고 없음](../../assets/the-godaddy-multi-year-breach-02-persistent-access.jpg)

## 대응과 그 이후

2021년 침해에 대한 GoDaddy의 즉각적인 기술적 대응은 표준 대응 절차를 따랐습니다. 노출된 sFTP와 데이터베이스 비밀번호를 재설정하고, 개인키가 유출된 고객들을 위해 새로운 SSL 인증서를 재발급·설치했습니다. 2023년 2월 공개 발표에서는 외부 포렌식 전문가와 수사기관을 참여시켰으며, 이번 공격의 주체를 개인 기회주의자가 아닌 호스팅 업체를 표적으로 삼는 정교하고 조직화된 그룹으로 규정했습니다.

하지만 명성 및 규제 측면의 여파는 사고 대응보다 오래 지속됐습니다. 연이은 침해 사건들은 미국 연방거래위원회(FTC)의 주목을 받았고, FTC는 2025년에 [데이터 보안 실패와 관련해 GoDaddy와의 명령을 확정했습니다](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures). FTC는 GoDaddy가 보안을 보장한다고 서비스를 홍보하면서도 합리적인 보안 조치를 이행하지 않았다고 주장했으며, 포괄적인 정보보안 프로그램 구축을 요구했습니다. 탈취된 비밀번호 하나로 시작된 침해는 수년 뒤 연방 동의 명령으로 마무리됐습니다.

공개 발표 타임라인 자체도 비판을 받았습니다. 다년간 캠페인이라는 전체 그림은 2023년 2월 SEC 10-K 제출을 통해서야 공개됐습니다. 즉, 고객들이 2020년, 2021년, 2022년의 사건들이 서로 연결돼 있다는 사실을 알게 된 것은 각각이 개별적으로 보고된 한참 뒤였습니다.

이 순서 안에는 더 깊은 책임성 문제가 숨어 있습니다. 각각의 공개 발표는 단독으로는 소소한 대응만을 불러일으켰습니다. 비밀번호를 바꾸고, 새 인증서를 받아들이고, 넘어가는 것이었습니다. 하지만 세 번의 별개 "고립된 사건" 이야기를 들은 고객은, 수년 동안 자신의 데이터 근처에 머물고 있던 단일 지속적 공격자를 상대하고 있었을 수도 있다는 사실을 이해할 방법이 없었습니다. 침해의 서술 방식은 하류에 있는 사람들이 얼마나 심각하게 받아들이는지에 영향을 미칩니다. 세 개의 작은 불은 오랫동안 타오르는 하나의 큰 불과 전혀 다르게 읽힙니다.

## 등록기관 집중 리스크에 대한 교훈

구체적인 내용을 걷어내면, GoDaddy 캠페인은 등록기관 집중이 독자적인 리스크 범주임을 보여주는 전형적인 사례입니다.

1. **플랫폼이 목표물이다.** 공격자는 당신을 표적으로 삼을 필요가 없습니다. 그들은 당신과 수백만 명을 보유한 회사를 표적으로 삼습니다. 등록기관의 프로비저닝 시스템이 취약 지점이라면 당신의 보안 태세는 거의 무의미합니다 — 원하든 원하지 않든 그 회사의 피해 범위를 그대로 상속받게 됩니다.

2. **자격증명이 정문이지, 취약점 익스플로잇이 아니다.** 여기서 대부분의 피해는 탈취된 비밀번호 하나에서 비롯됐습니다. 다중 인증(MFA), 자격증명 위생 관리, 적극적인 이상 탐지가 어떤 단일 첨단 방어 수단보다 중요합니다 — 진입점은 거의 항상 빌린 접근권이지, 뚫린 잠금장치가 아니기 때문입니다.

3. **체류 시간이 진짜 지표다.** 데이터 노출은 나쁜 일입니다. 하지만 공격자가 프로비저닝 시스템 내에서 수개월 또는 수년간 탐지되지 않은 채 머무는 것은 재앙적으로 더 심각합니다. 지속성이 피해를 복리로 늘리기 때문입니다. 피해는 얼마나 오래 머무느냐의 함수이지, 단순히 침투했다는 사실만의 함수가 아닙니다.

4. **중앙화된 비밀은 중앙화된 실패다.** 관리자 비밀번호, sFTP 자격증명, SSL 개인키를 한 곳에 복구 가능한 형태로 저장하는 것은, 그것이 최악의 단일 손실 지점이 되기 전까지는 편리합니다. 동일한 저장소가 120만 명 고객의 열쇠를 보유하고 있을 때, 침해 1건은 120만 건의 침해와 같습니다.

5. **웹사이트 리디렉션은 고객의 악몽이지, 등록기관의 악몽이 아니다.** GoDaddy의 서버가 고객 사이트를 악성 목적지로 리디렉션했을 때, 피해는 고객의 브랜드, 고객층, SEO가 받았습니다 — 고객들이 아무 잘못도 하지 않았는데도요. 집중 리스크는 결국 다른 누군가의 실수로 피해를 입을 위험입니다.

이것이 "대형 등록기관은 절대 쓰지 말라"는 의미는 아닙니다. 규모는 실질적인 보안 투자를 가능하게 하고, 소규모 업체도 마찬가지로 실패합니다. 하지만 이것은, 도메인을 플랫폼에 맡길 때 그 플랫폼의 최악의 날이 당신의 최악의 날이 될 수 있다는 점을 이해하고 받아들이는 것을 의미합니다.

## Namefi의 관점

![검증 가능하고 변조 저항적인 도메인 소유권을 나타내는 컬러 일러스트 — 녹색 방어막으로 보호되는 도메인 카드, 녹색 Namefi 토큰, DNS 연속성](../../assets/the-godaddy-multi-year-breach-03-namefi-angle.jpg)

GoDaddy 캠페인이 드러낸 가장 심층적인 문제는 악성코드가 아닙니다. 도메인의 소유권과 통제권이 전적으로 한 공급자의 사설 데이터베이스 안에 존재했다는 것입니다. 수년간 침입자가 내부에서 읽고, 변조하고, 사칭할 수 있었던 그 데이터베이스에. 정당한 소유자들은 독립적으로 확인할 방법이 없었습니다.

[Namefi](https://namefi.io)는 다른 기본 원칙을 중심으로 구축됐습니다. 도메인은 소유권이 검증 가능하고 변조 저항적인 인터넷 네이티브 자산처럼 작동해야 합니다. 로그인하고 기도하는 방식으로만 확인할 수 있는 단일 기업 계정 시스템의 한 행(row)이 아닌 것으로요. 토큰화된 소유권은 "이 도메인을 실제로 누가 통제하는가?"라는 질문을 어떤 단일 공급자 외부에서 답변할 수 있게 만듭니다 — 감사 가능하고, 이식 가능하며, 조용히 재기록하기 어렵게 — DNS와의 호환성을 유지하여 도메인 이름이 계속 해석될 수 있도록 하면서도요.

이것이 등록기관을 해킹 불가능하게 만들지는 않습니다. 그 어떤 것도 그렇게 할 수 없습니다. 하지만 침해가 조용히 할 수 있는 것을 바꿉니다. 소유권의 증명이 침해된 플랫폼 내부에만 존재하는 것이 아니라 검증 가능하고 독립적인 계층에 존재한다면, "침입자가 2년간 데이터베이스에 살았다"는 것이 "침입자가 누가 무엇을 소유하는지를 통제했다"는 것과 동일한 의미가 되지 않습니다. GoDaddy 사건은 통제와 증명이 동일한 취약한 것으로서 한 곳에 보관될 때 어떤 일이 벌어지는지를 보여줍니다. 교훈은 거기에 계속 보관하기를 멈추는 것입니다.

## 출처 및 추가 참고 자료

- BleepingComputer — [GoDaddy: 해커들, 다년간 침해로 소스 코드 탈취 및 악성코드 설치](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/)
- BleepingComputer — [GoDaddy 데이터 침해, Managed WordPress 고객 120만 명 타격](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/)
- Krebs on Security — [저기술 해킹이 고파급 침해를 일으킬 때](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)
- Sophos — [GoDaddy 인정: 범죄자들이 악성코드로 공격하고 고객 웹사이트를 오염시켜](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites)
- The Hacker News — [GoDaddy, 악성코드 설치 및 소스 코드 탈취를 야기한 다년간 보안 침해 공개](https://thehackernews.com/2023/02/godaddy-discloses-multi-year-security.html)
- TechCrunch — [GoDaddy, 100만 명 이상의 사용자 계정이 노출된 데이터 침해 밝혀](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/)
- SecurityWeek — [GoDaddy 침해, Managed WordPress 고객 계정 120만 개 노출](https://www.securityweek.com/godaddy-breach-exposes-12-million-managed-wordpress-customer-accounts/)
- InformationWeek — [GoDaddy, 다년간 침해 피해](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-)
- BankInfoSecurity — [GoDaddy, 고객 120만 명 영향 침해 확인](https://www.bankinfosecurity.com/godaddy-confirms-breach-affects-12-million-customers-a-17974)
- Wordfence — [GoDaddy 침해 — 평문 비밀번호 — 120만 명 피해](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)
- 미국 연방거래위원회(FTC) — [FTC, GoDaddy의 데이터 보안 실패 관련 명령 확정](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures)
- GoDaddy (SEC 제출) — [보안 사고 통보, 2021년 11월 22일](https://www.sec.gov/Archives/edgar/data/1609711/000160971121000122/gddyblogpostnov222021.htm)
