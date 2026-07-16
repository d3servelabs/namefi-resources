---
title: 'ICANN 자체가 피싱 당한 날: 인터넷의 심장부를 강타한 2014년 스피어 피싱 침해 사건'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 14
format: case-study
description: '2014년 말, 인터넷 도메인 이름 시스템을 조율하는 기관인 ICANN은 자체 도메인을 사칭한 스피어 피싱 이메일이 직원 자격 증명을 탈취하고 공격자에게 중앙화 존 데이터 시스템(CZDS)에 대한 관리 접근 권한을 넘겨주었음을 공개적으로 인정했습니다. DNS 당국 자체가 어떻게 피싱 당했는지, 무엇이 노출되었는지, 그리고 왜 지금도 중요한지를 Domain Mayday 시리즈가 심층 분석합니다.'
keywords: ['icann 침해', 'icann 스피어 피싱', 'czds', '중앙화 존 데이터 시스템', 'dns 보안', '도메인 보안', '스피어 피싱 공격', '자격 증명 피싱', '존 파일', 'iana', '솔팅된 패스워드 해시', '도메인 이름 시스템 침해', 'icann 2014 해킹']
relatedArticles:
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ko/blog/the-dnspionage-campaign/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/icann/
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/tld/
  - /ko/glossary/registry/
---

보안 업계 전체가 잠시 멈추게 만드는 특별한 종류의 뉴스 헤드라인이 있습니다. "또 다른 소매업체 침해됨"도, "또 다른 스타트업 데이터베이스 유출"도 아닙니다. 바로 다른 모든 이들이 신뢰하는 바로 그 기관이, 가장 평범한 방식으로 해킹당했음을 인정하는 순간입니다.

2014년 12월, 그 기관은 [ICANN](/ko/glossary/icann/)이었습니다. 인터넷 할당 번호 관리 기관(Internet Corporation for Assigned Names and Numbers) — 전체 [도메인 이름 시스템](/ko/glossary/dns/)을 조율하는 비영리 단체, `namefi.io`와 `google.com`을 비롯한 지구상의 모든 주소가 서버로 연결될 수 있게 해주는 규칙의 관리자 — 이 기관은 자체 직원 일부가 가짜 이메일의 링크를 클릭하고, 가짜 로그인 페이지에 비밀번호를 입력하여, 공격자에게 내부 시스템의 열쇠를 넘겨주었다고 공개했습니다. 피해 시스템 중에는 세계 최상위 도메인 존 파일을 신청하고 접근하는 저장소인 중앙화 존 데이터 시스템(Centralized Zone Data System, CZDS)도 포함되어 있었습니다.

인터넷에서 신뢰가 작동하는 방식을 정의하는 그 조직이 피싱 당했습니다. 사칭 이메일 하나로. ICANN을 흉내 낸 가짜 메일로.

이것은 **Domain Mayday EP11**입니다 — 그리고 이 에피소드에서 위협은 바로 집 안에서 걸려온 전화였습니다.

## ICANN이 하는 일, 그리고 그 곳의 침해가 상징적인 이유

이 사건이 왜 그토록 큰 충격을 주었는지 이해하려면, ICANN이 실제로 무엇을 하는 기관인지 알아야 합니다.

ICANN은 도메인을 구매하는 회사가 아닙니다. 그 한 단계 위에 위치합니다. ICANN은 인터넷을 탐색 가능하게 만드는 고유 식별자들의 전 세계적 시스템을 조율합니다. 최상위 도메인(`.com`, `.org`, `.io`, 그리고 수백 개의 신규 도메인), 레지스트리와 [레지스트라](/ko/glossary/registrar/)가 따르는 규칙들, 그리고 [IANA](/ko/glossary/iana/) 기능을 통해 다른 모든 조회가 궁극적으로 의존하는 DNS 계층 구조의 최정상인 [루트 존](/ko/glossary/root-zone/)을 관리합니다.

도메인이 인터넷의 주소라면, ICANN은 우체국의 마스터 디렉토리를 운영하는 기관입니다. [레지스트라](/ko/glossary/registrar/)에서의 침해는 심각합니다. ICANN에서의 침해는 상징적입니다. ICANN은 *권위* 그 자체여야 하는 기관이기 때문입니다 — 이름 지정 시스템을 질서 있고 신뢰할 수 있게 유지하는 것이 임무인 유일한 기관. 인터넷 이름의 권위자가 공격받았을 때, 불편한 질문은 명백합니다. *그들*도 피싱 당할 수 있다면, 누가 당하지 않을 수 있겠습니까?

## 2014년 말: 침해 사건

![인터넷 마스터 키의 빛나는 고리를 손에 든 거대한 수호자를 교묘히 통과하는 사기 공문서를 묘사한 생동감 넘치는 컨셉 아트. 공문서는 빨간 빛을 발하고, 열쇠들은 파란 빛을 발합니다.](../../assets/the-icann-spear-phishing-breach-01-breach.jpg)

ICANN은 2014년 12월 16일 발표한 [자체 공개 발표문](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=We%20believe%20a%20%22spear%20phishing%22%20attack%20was%20initiated%20in%20late%20November%202014.)에서 주목할 만큼 솔직하게 타임라인을 밝혔습니다. "우리는 2014년 11월 말에 '스피어 피싱' 공격이 시작되었다고 판단합니다."

공격 방식은 모욕적일 정도로 단순했습니다. ICANN의 설명에 따르면, 이 공격은 "[자체 도메인에서 발송된 것처럼 꾸며진 이메일 메시지를 직원들에게 보내는 방식으로 이루어졌습니다](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=It%20involved%20email%20messages%20that%20were%20crafted%20to%20appear%20to%20come%20from%20our%20own%20domain%20being%20sent%20to%20members%20of%20our%20staff.)." 직원들은 `icann.org`에서, 즉 ICANN 내부에서 발송된 것처럼 보이는 이메일을 받았습니다. 일부는 링크를 클릭했습니다. The Register의 재구성에 따르면, 직원들은 "[메시지 안의 링크를 클릭해 가짜 로그인 페이지로 이동했고, 그 곳에 사용자 이름과 비밀번호를 입력했습니다](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=clicked%20on%20a%20link%20in%20the%20messages%20that%20took%20them%20to%20a%20bogus%20login%20page)." 그렇게 공격자들에게 업무용 이메일 자격 증명을 넘겨주었습니다. 부재했던 방어 수단에 대한 The Register의 냉소적인 평가는 이렇습니다. "[이중 인증 사용 흔적은 전혀 없다.](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)"

결과를 ICANN 자체의 표현으로 정리하면 다음과 같습니다. "[이 공격으로 인해 여러 ICANN 직원의 이메일 자격 증명이 침해되었습니다.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attack%20resulted%20in%20the%20compromise%20of%20the%20email%20credentials%20of%20several%20ICANN%20staff%20members.)" Help Net Security는 더 직접적으로 표현했습니다. "[여러 직원이 속아 공격자에게 이메일 자격 증명을 넘겨주었습니다](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=Several%20staff%20members%20were%20fooled%20into%20handing%20over%20their%20email%20credentials)."

제로데이 취약점도 없었습니다. 정교한 악성코드도 없었습니다. 설득력 있는 이메일 한 통과 가짜 로그인 창 하나 — 인터넷에서 가장 오래된 수법이, 인터넷 운영을 돕는 바로 그 사람들을 상대로 사용된 것입니다.

## 무엇이 접근되었나: 핵심의 존 데이터 시스템

탈취된 이메일 자격 증명 자체도 심각한 문제입니다. 그러나 이 침해가 *Domain Mayday* 에피소드가 된 것은 공격자들이 그것으로 *무엇에* 접근했느냐 때문입니다.

2014년 12월 초, ICANN은 탈취된 로그인 정보가 다른 시스템에 재사용되었음을 발견했습니다. 가장 심각한 것은 **중앙화 존 데이터 시스템(CZDS)** 이었습니다 — 승인된 당사자들이 세계 일반 최상위 도메인의 존 파일을 신청하고 다운로드하는 플랫폼입니다. ICANN의 공개 내용은 충격적입니다. "[공격자는 CZDS의 모든 파일에 대한 관리자 접근 권한을 획득했습니다.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attacker%20obtained%20administrative%20access%20to%20all%20files%20in%20the%20CZDS.)"

*관리자* 접근. *모든* 파일에 대한. The Register는 이것이 왜 중요한지를 설명했습니다. CZDS는 "[승인된 당사자에게 세계 일반 최상위 도메인의 모든 존 파일에 대한 접근을 제공합니다](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=gives%20authorized%20parties%20access%20to%20all%20the%20zone%20files%20of%20the%20world%27s%20generic%20top%2Dlevel%20domains)." 이 시스템의 *사용자*들은 일반인이 아닙니다. The Register가 지적했듯, "[세계 레지스트리와 레지스트라 관리자들 중 다수](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=many%20of%20the%20administrators%20of%20the%20world%27s%20registries%20and%20registrars)"입니다. 공격자들은 단순히 어떤 데이터베이스에 침입한 것이 아닙니다. 이름 지정 시스템의 게이트키퍼들이 직접 로그인하는 바로 그 데이터베이스에 침입한 것입니다.

존 파일 외에도, 이 침해는 CZDS 사용자들이 등록한 개인정보도 노출시켰습니다. ICANN에 따르면 탈취된 정보에는 "[시스템의 존 파일 사본뿐만 아니라 이름, 우편 주소, 이메일 주소, 팩스 및 전화번호, 사용자 이름, 비밀번호 등 사용자가 입력한 정보](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=This%20included%20copies%20of%20the%20zone%20files%20in%20the%20system%2C%20as%20well%20as%20information%20entered%20by%20users)"가 포함되었습니다. TLD를 관리하는 사람들의 사용자 이름과 비밀번호가 — 공격자가 도용된 배지를 달고 걸어 들어간 그 시스템에 고스란히 남아있었던 것입니다.

자격 증명의 피해는 더 이어졌습니다. ICANN은 공격자들이 **GAC Wiki**(정부 자문 위원회 공간), **ICANN 블로그**, **[WHOIS](/ko/glossary/whois/) 정보 포털**에도 접근했음을 확인했습니다. 다만 [후자 두 시스템에는 아무런 영향이 없었고](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=The%20latter%20two%20were%20not%20affected%20in%20any%20way.), 위키에서는 제한된 열람만 이루어졌다고 보고했습니다.

## 어떻게 일어났는가: "ICANN"이라고 적힌 배지

![밤 도메인 이름 시스템 관제탑을 묘사한 생동감 넘치는 컨셉 아트. 진짜 경비원들이 알아채지 못한 채 서 있는 동안, 체크마크가 찍힌 위조된 빛나는 배지 하나가 문을 열고, 붉은 빛이 새어나오고 있습니다.](../../assets/the-icann-spear-phishing-breach-02-spear-phishing.jpg)

기술적 층위를 벗겨내면, 이 공격은 신뢰를 악용하는 사기입니다.

스피어 피싱은 일반 피싱과 정밀함에서 차이가 납니다. 누군가 걸려들기를 바라며 뿌리는 수백만 통의 스팸 이메일이 아닙니다. 특정 인물들을 겨냥해 세심하게 다듬어진 소수의 메시지로, 일상적인 내부 업무 메일처럼 보이도록 설계됩니다. 여기서 위장은 가능한 한 강력한 것이었습니다. 이메일이 `icann.org`에서 발송된 것처럼 보였습니다. The Register가 요약했듯, "[공격자들은 icann.org에서 발송된 것처럼 보이는 사칭 이메일을 직원들에게 보냈습니다.](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Attackers%20sent%20staff%20spoofed%20emails%20appearing%20to%20coming%20from%20icann.org.)"

심리를 생각해 보십시오. 자신의 조직 도메인에서 온 이메일은 경보를 울리지 않습니다. 매일 사용하는 것과 똑같이 생긴 로그인 페이지도 마찬가지입니다. 이 공격 전체는 *내부적이고* *익숙한* 것이 *안전한* 것과 같다는 착각을 이용했습니다 — 하지만 그 둘은 같은 것이 아닙니다. 주소 표시줄에는 한 가지가 표시되었지만, 그 뒤의 페이지는 입력되는 모든 것을 수집했습니다.

ICANN이 스토리지 측에서 취한 한 가지 진정한 경감 조치가 있었습니다. 탈취된 비밀번호들이 평문으로 저장되어 있지 않았다는 점입니다. 공개문에 따르면, "[비밀번호는 솔팅된 암호화 해시 형태로 저장되었습니다](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=Although%20the%20passwords%20were%20stored%20as%20salted%20cryptographic%20hashes)." 대안보다는 낫지만, The Register가 지적했듯이, 해시는 여전히 오프라인으로 크래킹될 수 있기 때문에 사용자들이 동일한 로그인 정보를 다른 곳에서도 재사용하지 않았어야 보호 효과가 유지됩니다. 침해는 다운로드로 끝나지 않았습니다. 비밀번호를 교체하는 방어자와 이를 역산하려는 공격자 사이의 느린 경쟁이 시작된 것입니다.

## 대응과 그 이후

ICANN이 침해 자체보다는 공개를 더 잘 처리한 것은 그들의 공이라 할 수 있습니다.

몇 주 안에 공개하고, CZDS 비밀번호를 비활성화하고, 피해 사용자에게 통보하면서 — 특히 — 투명성을 책임으로 프레이밍했습니다. 기관은 "[이 사건에 대한 정보를 공개적으로 제공하는 것은 단순히 개방성과 투명성에 대한 약속 때문만이 아니라, 사이버 보안 정보 공유가 관련된 모든 이들이 자신의 시스템에 대한 위협을 평가하는 데 도움이 되기 때문](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=providing%20information%20about%20this%20incident%20publicly%2C%20not%20just%20because%20of%20our%20commitment%20to%20openness%20and%20transparency)"이라고 밝혔습니다. 또한 그 해 초에 시작된 보안 강화 프로그램이 "[공격으로 인한 무단 접근을 제한하는 데 도움이 되었다](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=these%20enhancements%20helped%20limit%20the%20unauthorized%20access%20obtained%20in%20the%20attack)"고도 보고했습니다.

더 넓은 인터넷에게 가장 중요한 한 줄은 *무엇이 무너지지 않았는가*에 관한 것이었습니다. ICANN은 확인했습니다. "[이 공격은 IANA 관련 시스템에는 영향을 미치지 않았습니다.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=this%20attack%20does%20not%20impact%20any%20IANA%2Drelated%20systems)" IANA는 — Help Net Security가 설명했듯이 "[도메인 이름 시스템(DNS)에서 루트 존을 관리](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=manages%20the%20root%20zone%20in%20the%20Domain%20Name%20System)"하는 기능으로 — 인터넷 이름 지정 피라미드의 실질적 정점입니다. 공격자들이 거기에 도달했다면, 이것은 당혹스러운 데이터 침해로 끝나지 않았을 것입니다. 구조적 비상사태가 되었을 것입니다.

타이밍이 당혹감을 더 심하게 만들었습니다. The Register의 헤드라인은 직설적이었습니다. "[스피어 피싱 공격 타이밍은 도메인 이름 감독 기관에게 최악](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Spear%2Dphishing%20attack%20timing%20couldn%27t%20be%20worse%20for%20domain%20name%20overseer)."이었습니다. 왜냐하면 ICANN은 "[내년에 핵심 IANA 계약의 통제권을 넘겨받기를 희망하고](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=it%20will%20prove%20extremely%20embarrassing%20to%20ICANN%2C%20which%20hopes%20to%20be%20handed%20control%20of%20the%20critical%20IANA%20contract%20next%20year)" 있었기 때문입니다 — 당시 협상 중이던 바로 그 관리권 이전. 피싱 당하는 것은 "DNS의 심장부를 믿고 맡겨 주십시오"를 위한 오디션으로는 최악입니다. (참고로, 이것이 2014년 CZDS와 관련된 ICANN의 첫 번째 우려 사항도 아니었습니다. The Register는 "[여러 사용자가 잘못 시스템 관리자 접근 권한을 부여받은](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=a%20number%20of%20users%20were%20wrongly%20given%20admin%20access%20to%20the%20system)" 4월의 사건을 언급했습니다.)

그리고 탈취된 데이터는 오랫동안 후유증을 남겼습니다. 2017년 2월 21일, ICANN은 자체 발표문에 추가된 업데이트에서 침해로 얻어진 정보가 다시 나타나고 있음을 인정했습니다. "[2014년에 발표한 스피어 피싱 사건에서 얻어진 일부 정보가 지하 포럼에서 판매되고 있습니다.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=some%20information%20obtained%20in%20the%20spear%20phishing%20incident%20we%20announced%20in%202014%20is%20being%20offered%20for%20sale%20on%20underground%20forums)" CyberScoop은 수년 후의 거래 가격을 보도했습니다. "[데이터가 여전히 흑시장에서 300달러에 유통, 판매되고 있으며](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/#:~:text=the%20data%20is%20still%20being%20passed%20around%20and%20sold%20on%20black%20markets%20for%20%24300)", 이전에 유출된 적 없다는 주장까지 붙어 있었습니다. 2014년 말의 클릭 한 번이 2017년에도 여전히 수익을 창출하고 있었던 것입니다.

## 교훈: 누구나 피싱 당할 수 있다, DNS 권위 기관조차도

EP11의 교훈은 "ICANN이 부주의했다"는 것이 아닙니다. 그보다 더 겸허하게 만드는 무언가입니다.

**누구나 피싱 당할 수 있습니다.** 부주의한 사람만이 아닙니다. 교육받지 못한 사람만도 아닙니다. *누구나*. 문자 그대로 인터넷 이름을 관장하는 기관 — DNS, 보안, 인프라를 직업으로 생각하는 사람들로 구성된 — 에서도 여러 직원이 이메일이 내부에서 온 것처럼 보였기 때문에 가짜 페이지에 자격 증명을 입력했습니다. 피싱은 여러분의 지식을 이기는 것이 아닙니다. 클릭하는 데 걸리는 2초 동안 여러분의 주의를 이깁니다.

몇 가지 지속적인 교훈이 여기서 도출됩니다.

1. **자격 증명이 곧 경계선입니다.** 공격자들은 ICANN의 암호화를 깨뜨리거나 서버 취약점을 이용하지 않았습니다. 비밀번호를 빌렸을 뿐입니다. 신원이 관문이 되면, 탈취된 신원이 곧 침해입니다 — 이것이 바로 피싱이 세상에서 가장 신뢰할 수 있는 공격 방식으로 남아있는 이유입니다.
2. **권한 있는 시스템에는 다중 인증이 선택이 아닙니다.** "[이중 인증 사용 흔적은 전혀 없다](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)"는 The Register의 지적이 핵심입니다. 두 번째 인증 요소가 있었다면, 자격 증명 탈취가 아무 사건도 아닌 것으로 끝날 가능성이 높았습니다.
3. **측면 이동이 피해를 증폭시킵니다.** 피해는 *재사용*에서 비롯되었습니다 — 이메일 로그인이 CZDS, 위키, 포털에 재사용되었습니다. 접근을 분리하고 하나의 탈취된 자격 증명이 여러 문을 열 수 없게 하는 것이 침해를 억제합니다.
4. **침해된 데이터는 영구적입니다.** 2017년 재판매는 "비밀번호를 재설정했다"는 것이 사건을 종결시키지만 노출을 종결시키지는 않음을 증명합니다. 이름, 주소, 전화번호는 유출이 취소되지 않습니다.
5. **권위는 면역과 다릅니다.** 신뢰를 정의하는 기관이라도 그 신뢰에 대한 가장 기본적인 공격에 면역이 있지 않습니다. 오히려 더 나은 표적이 됩니다.

## Namefi와의 연관성

![녹색 방패, 녹색 Namefi 토큰, DNS 연속성으로 보호되는 도메인 카드 — 검증 가능하고 위변조 저항성 있는 도메인 소유권의 컬러풀한 일러스트레이션](../../assets/the-icann-spear-phishing-breach-03-namefi-angle.jpg)

ICANN 침해 사건은 본질적으로 *누가 기록을 통제하는가* — 그리고 그 통제권이 중앙화 시스템에서 단일 탈취된 로그인을 통해 어떻게 납치되었는가에 관한 이야기입니다.

이것이 곱씹어볼 만한 구조적 약점입니다. 중요한 도메인 데이터에 접근하거나 관리할 권한이 있는 사람의 증명이 하나의 플랫폼의 사용자 이름과 비밀번호 뒤에 존재할 때, 그 자격 증명이 피싱 당하는 순간 전체 신뢰 모델이 무너집니다. 두 번째 검증이 없습니다. 설득력 있는 이메일 하나와 재사용된 비밀번호 하나로 이름 지정 세계의 중심에 있는 존 데이터 시스템에 관리자 접근 권한을 부여받기에 충분했습니다.

[Namefi](https://namefi.io)는 다른 전제에서 구축됩니다. [도메인 소유권](/ko/glossary/domain-ownership/)과 통제는 **검증 가능하고, 위변조 저항성이 있으며, 단일 수신함의 단일 비밀번호에 의존하지 않아야 한다**는 것입니다. [도메인 소유권](/ko/glossary/domain-ownership/)을 DNS와 호환되면서도 [온체인](/ko/glossary/on-chain/) 토큰으로 표현함으로써, 통제는 암호학적으로 증명하고 감사할 수 있는 것이 됩니다 — 스피어 피싱 이메일이 탈취할 수 있는 비밀번호로만 제어되는 것이 아니라. 이것이 누구를 피싱으로부터 완전히 면역시켜 주지는 않습니다. 그 어떤 것도 그렇게 할 수 없습니다. 하지만 피폭 반경을 좁혀, 하나의 빌린 자격 증명이 더 이상 왕국의 열쇠까지 한 걸음 거리에 있지 않게 만듭니다.

EP11이 남기는 이미지는, 올바른 유니폼을 입고 인터넷 마스터 키의 수호자를 그냥 지나쳐버린 위조 편지입니다. 해결책은 더 똑똑한 수호자가 아닙니다. 열쇠 자체가 진짜임을 증명할 수 있는 시스템입니다.

## 출처 및 추가 자료

- ICANN — [ICANN Targeted in Spear Phishing Attack | Enhanced Security Measures Implemented](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en) (1차 출처, 2017년 업데이트 포함)
- The Register — [ICANN HACKED: Intruders poke around global DNS innards](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044)
- Help Net Security — [ICANN systems breached via spear-phishing emails](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/)
- Computerworld — [ICANN data compromised in spearphishing attack](https://www.computerworld.com/article/1487605/icann-data-compromised-in-spearphishing-attack.html)
- WeLiveSecurity (ESET) — [ICANN computers compromised by hackers](https://www.welivesecurity.com/2014/12/18/icann-computers-compromised-hackers/)
- Associations Now — [ICANN Systems Infiltrated in "Spear Phishing" Attack](https://associationsnow.com/2014/12/icann-systems-infiltrated-spear-phishing-attack/)
- Slate — [ICANN Got Hacked](https://slate.com/technology/2014/12/icann-hacked-in-spear-phishing-campaign.html)
- Domain Incite — [Hacked ICANN data for sale on black market](http://domainincite.com/21562-hacked-icann-data-for-sale-on-black-market)
- Slashdot — [Hackers Compromise ICANN, Access Zone File Data System](https://tech.slashdot.org/story/14/12/18/1540233/hackers-compromise-icann-access-zone-file-data-system)
- CyberScoop — [Hacked ICANN data still sells for hundreds of dollars years after breach](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/)
- DomainGang — [ICANN alerts users of CZDS & ICANN Wiki about security breach](https://domaingang.com/domain-news/icann-alerts-users-czds-icann-wiki-security-breach/)
