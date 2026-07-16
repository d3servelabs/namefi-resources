---
title: 'Lenovo.com DNS 하이재킹: Lizard Squad가 IT 공룡의 정문을 장악한 날'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 15
format: case-study
description: '2015년 2월 25일, Lizard Squad는 등록 기관 Webnic을 해킹하여 lenovo.com을 웹캠 슬라이드쇼로 대체하고 이메일을 도청했습니다. Superfish 스캔들이 터진 지 불과 며칠 만의 일이었습니다. 세계 최대 PC 제조사의 도메인이 단 한 곳, 등록 기관에서 무너진 이유를 분석합니다.'
keywords: ['lenovo.com dns 하이재킹', 'lizard squad', 'webnic 등록 기관', 'web commerce communications', 'dns 하이재킹', 'superfish', '도메인 등록 기관 보안', '등록 기관 침해', 'epp 인증 코드', '이메일 도청', '구글 베트남 하이재킹', '도메인 보안', '등록 기관 잠금']
relatedArticles:
  - /ko/blog/the-malaysia-airlines-dns-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-fox-it-dns-hijack/
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

2015년 2월 25일 오전, 세계 최대 PC 제조사의 홈페이지에서 가장 많이 클릭된 링크는 십대들이 웹캠을 바라보며 멍하니 앉아 있는 슬라이드쇼로 연결되었습니다. 배경에는 *하이스쿨 뮤지컬*의 노래가 흘렀습니다. Lenovo의 서버를 해킹한 사람은 아무도 없었습니다. Lenovo의 비밀번호를 훔친 사람도 없었습니다. 공격자들은 건물에도, 네트워크에도, 웹사이트 자체에도 손끝 하나 대지 않았습니다.

그들이 한 일은 단 하나, 회사의 도메인 [등록 기관](/ko/glossary/registrar/)에서 레코드 하나를 변경한 것뿐이었습니다. 그것만으로 Lenovo의 정문을 장악하고, 메일을 우회시키고, 브랜드를 반나절 동안 웃음거리로 만들기에 충분했습니다.

이것이 **Domain Mayday EP17**, lenovo.com DNS 하이재킹 사건입니다. 숫자로만 보면 소규모 사건입니다 — 몇 시간의 서비스 중단, 운영 시스템 침해 없음, 고객 데이터베이스 유출 없음. 그러나 이 사건은 대부분의 기업이 여전히 놓치고 있는 교훈을 가장 명확하게 보여준 사례 중 하나입니다. 바로 도메인 보안은 그것을 관리하는 등록 기관의 보안 수준과 같다는 것이며, 그 등록 기관은 거의 예외 없이 기업의 보안 프로그램 밖에 놓여 있다는 사실입니다.

## 도메인이 곧 얼굴인 IT 공룡

2015년 당시 Lenovo는 전 세계에서 가장 많은 노트북과 데스크톱을 출하하는 [세계 최대 PC 제조사](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer)였습니다. 그 규모의 기업에게 lenovo.com은 단순한 마케팅 자산이 아닙니다. 고객이 제품을 구매하고, 지원 티켓이 접수되고, 보증 등록이 이루어지는 전체 운영의 중심축입니다. 무엇보다 회사의 모든 `@lenovo.com` 이메일 주소의 근간이 되는 도메인입니다.

브랜드가 그 규모에 이르면, 도메인은 단순한 웹사이트 주소를 넘어 기반 시설이 됩니다. 모든 보도 자료, 모든 제품 박스, 모든 직원 서명, 모든 주문 확인서가 이 도메인을 통해 흐릅니다. 즉, 도메인의 DNS를 통제하는 자는 단순히 웹사이트만이 아니라 lenovo.com이 어디를 가리키는지에 대한 *진실*을 통제하게 됩니다 — 브라우저와 메일 서버 모두에게.

그것이 바로 Lizard Squad가 노린 전리품이었습니다. 웹사이트가 아니라, 웹사이트를 가리키는 포인터였습니다.

## 2015년 2월 25일: 기이한 리디렉션

![기업 유리 건물 정면의 간판이 밤새 형광 핑크와 전기 파랑의 요란한 장난 광고판으로 바뀐 모습, 군중이 고개를 들어 혼란스럽게 바라보고 있는 컬러풀한 개념 예술, 브랜드 로고 없음](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

그날 오후부터 lenovo.com을 입력한 방문자들은 Lenovo에 도달하지 못했습니다. 사이트는 [컴퓨터 앞에 멍하니 앉아 있는 아이들의 웹캠 사진 슬라이드쇼](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)로 대체되었으며, 약간 민망한 표정의 십대들 사진에 *하이스쿨 뮤지컬*의 ["Breaking Free"](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)가 흘렀습니다. The Register는 같은 장면을 [지루해 보이는 청소년의 웹캠 사진 슬라이드쇼](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth)로 묘사했습니다.

의도적으로 황당하게 연출된 이 사건에서 황당함 자체가 핵심이었습니다. 이것은 조용히 숨어 진행되는 데이터 절취가 아니었습니다. 회사가 보유한 가장 가시적인 URL에서 공개적으로 망신을 주는 행위였습니다.

범인의 흔적은 눈앞에 버젓이 드러나 있었습니다. 대체 페이지의 HTML에는 "새롭고 개선된 리브랜딩" 작업의 크레딧으로 [Ryan King과 Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)가 표기되어 있었는데, 인터넷 수사대들은 이 두 이름을 즉시 Lizard Squad와 연결했습니다. 바로 직전 연말 시즌 동안 PlayStation Network와 Xbox Live를 다운시킨 그 집단이었습니다. 그룹은 트위터에서 자신들의 소행임을 인정하며 *하이스쿨 뮤지컬* 가사를 Lenovo에게 인용해 보냈습니다.

그리고 사태는 망신에서 더 심각한 수준으로 악화되었습니다. 공격자들은 lenovo.com의 DNS를 통제했기 때문에 웹사이트만이 아니라 이메일까지 장악했습니다. 한 매체는 이 하이재킹으로 [Lenovo 이메일을 도청할 수 있었다](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)고 전했습니다. 리디렉션이 해제될 때까지의 일이었습니다. Lizard Squad는 이후 장악 기간 동안 [Lenovo 직원에게 전송된](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails) 이메일 두 건을 공개했습니다. 그 중 하나에는 씁쓸한 유머가 담겨 있었는데, 고객이 Lenovo 자체 도구를 사용해 Superfish라는 소프트웨어를 제거하려다 Lenovo Yoga 노트북이 ["벽돌"이 됐다](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked)는 내용이었습니다.

그 한 문장이 이 사건의 동기를 모두 설명합니다.

## Superfish 배경

왜 하필 Lenovo였는지를 이해하려면 닷새 전으로 거슬러 올라가야 합니다.

Superfish는 Lenovo가 [2014년 9월부터 일부 컴퓨터에 번들로 설치해온](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014) 애드웨어였습니다. 표면상으로는 단순한 광고 삽입기 — 브라우저에 쇼핑 광고를 끼워 넣는 소프트웨어였습니다. 그러나 그 작동 방식은 치명적이었습니다. 암호화된 페이지에도 광고를 삽입하기 위해 Superfish는 자체 루트 인증서를 설치하여 [암호화된 페이지에도 광고를 삽입](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages)할 수 있도록 했습니다. 다시 말해, HTTPS를 보호하는 자물쇠를 스스로 부수는 방식이었습니다.

더욱 심각한 것은 해당 인증서가 모든 기기에서 동일한 [개인 키](/ko/glossary/private-key/)를 사용했으며, 그 키는 크랙 가능했다는 점입니다. 이를 추출한 공격자는 Superfish가 설치된 *모든* Lenovo 노트북에서 *모든* HTTPS 웹사이트를 사칭할 수 있었습니다. 이것은 이론적인 취약점이 아니었습니다. [2015년 2월 20일, 미국 국토안보부는 Superfish와 해당 루트 인증서를 제거하도록 권고했습니다](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it).

즉 일주일 사이에, 기업에 보안과 신뢰를 판매하던 회사가 수백만 대의 노트북에 내장형 중간자 공격 취약점을 심어 출고했고, 자체 제거 도구는 적어도 한 고객의 기기를 벽돌로 만들어버린 것입니다. Lizard Squad의 하이재킹은 항의의 형식을 띠었습니다 — Superfish 논란 이후 [자신들이 한 짓을 직접 맛보게 하겠다](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=sparked%20online%20uproar%20following%20the%20discovery%20of%20adware%20called%20Superfish)는 것이었습니다. 웹캠 슬라이드쇼는 연극이었습니다. 메시지는 이것이었습니다: *당신네가 고객의 암호화를 망쳤으니, 우리가 당신네 정문을 부숴드리겠습니다.*

## 어떻게 가능했나: 등록 기관이 취약 고리였다

![하이재킹된 제어판에서 빛나는 라우팅 다이얼과 스위치, 그림자 손이 브랜드의 정문과 메일 파이프를 네온 불빛 경로로 돌리는 모습, 전기 청록색과 마젠타, 브랜드 로고 없음](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

CISO들이 밤잠을 설칠 만한 부분이 여기 있습니다. Lenovo 자체 인프라는 단 한 번도 침해되지 않았습니다.

공격자들은 대신 등록 기관을 표적으로 삼았습니다. 보안 분석가들은 이 하이재킹의 원인을 말레이시아에 기반을 둔 등록 기관 **Web Commerce Communications**, 즉 **Webnic.cc**의 침해로 추적했습니다. Help Net Security는 해커들이 Lenovo의 서버를 해킹한 것이 아니라 [lenovo 도메인이 등록된 등록 기관인 Web Commerce Communications(Webnic.cc)의 서버를 침해했다](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)고 보도했습니다.

이번이 Webnic에게 처음으로 힘든 한 주가 아니었습니다. 불과 이틀 전에도 구글의 베트남 도메인이 같은 방식으로 리디렉션된 바 있었습니다. SecurityWeek는 이 연관성을 간결하게 요약했습니다. Lizard Squad가 [말레이시아 기반 등록 기관 WebNIC의 시스템을 침해한 후 구글 베트남과 Lenovo의 DNS 레코드를 하이재킹했다](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)는 것입니다. Brian Krebs는 사건을 조사한 연구자들을 인용하여 [두 건의 하이재킹 모두 공격자들이 Webnic.cc를 장악했기 때문에 가능했다](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=both%20hijacks%20were%20possible%20because%20the%20attackers%20seized%20control%20over%20Webnic.cc)고 보도했습니다. 같은 보도에 따르면 이 등록 기관은 두 도메인 외에도 60만 개 이상의 도메인을 관리하고 있었습니다.

Krebs의 취재에서 드러난 공격 메커니즘은 왜 등록 기관이 매력적인 표적인지를 교과서처럼 보여줍니다.

- **침입 경로.** Lizard Squad는 [Webnic.cc의 명령 주입 취약점을 이용해 루트킷을 업로드했습니다](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — 등록 기관 시스템에 대한 지속적이고 은닉된 접근권을 확보한 것입니다.
- **마스터 키 획득.** 공격자들은 [Webnic의 "인증 코드" 저장소에도 접근했습니다](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of) — [인증 코드](/ko/glossary/auth-code/)란 *어떤* 도메인도 다른 등록 기관으로 이전할 수 있는 EPP 전송 비밀입니다.
- **리디렉션.** 등록 기관 수준의 통제권을 확보한 후, 공격자들은 lenovo.com의 [네임서버](/ko/glossary/nameserver/) 레코드를 변경했습니다. The Register는 도메인의 [네임서버 설정이 오늘 의심스럽게 업데이트되어 웹 호스팅 업체 CloudFlare의 DNS 서버를 가리키게 됐다](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare)고 전했습니다 — Cloudflare를 이용해 실제 목적지 서버를 은폐한 것입니다.
- **이메일 도청.** 공격자들은 웹사이트에서 멈추지 않았습니다. [메일 서버 레코드를 변경하여 Lenovo 주소로 전송된 메시지를 도청할 수 있었습니다](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/). DNS는 `A` 레코드만이 아니라 `MX` 레코드도 통제합니다. 도메인을 소유하면 메일도 소유하게 됩니다.

마지막 항목이 사람들이 가장 쉽게 잊는 부분입니다. 화면 변조는 눈에 확 띕니다. 그러나 조용한 이메일 도청이야말로 DNS 하이재킹의 위험한 절반입니다 — 그리고 이것은 등록 기관에서 레코드 하나를 변경하는 동일한 단일 행위에서 파생됩니다.

## 대응과 사후 처리

Lenovo는 신속하게 대응했지만, 선택지가 많지 않았습니다. 수정은 자사 서버가 아닌 등록 기관 측에 있었기 때문입니다. 회사는 lenovo 웹사이트의 트래픽을 리디렉션하는 [사이버 공격의 피해를 입었음](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)을 인정했고, [2월 25일 저녁까지 공개 웹사이트에 대한 완전한 접근권을 복원한 것으로 보였습니다](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025). Cloudflare는 자사 이름이 리디렉션 체인에 사용된 것을 파악하고 악성 네임서버를 차단했으며, 이로써 이메일 도청도 종료되었습니다.

더 큰 수습 작업은 Webnic의 몫이었습니다. 등록 기관 하나의 명령 주입 취약점 하나가 48시간이라는 짧은 시간 안에 인터넷에서 가장 귀중한 두 도메인 — Lenovo와 구글 계열사 — 을 스턴트 성 해킹 집단의 손에 넘겨버렸습니다. 이 사건은 등록 기관 리스크의 대표적인 사례 연구로 남았으며, "60만 개의 다른 도메인"이 같은 침해된 시스템 뒤에 있었다는 사실을 상기시켜줍니다.

Lenovo로서는 명성 손상이 가장 오래 지속되는 피해였습니다. Superfish 사태 이후 며칠 만에 발생한 이 하이재킹으로 인해 심각한 보안 실패가 2막짜리 이야기로 굳어졌습니다. 1막에서는 회사가 자사 고객의 신뢰를 깼고, 2막에서는 자신의 이름에 대한 통제권을 공개적으로 잃었습니다. 사람들의 기억 속에는 웹캠 슬라이드쇼가 남았지만, 실제로 중요했던 것은 등록 기관 침해였습니다.

## 교훈: 등록 기관이 진짜 경계선이다

EP17의 불편한 교훈은 Lenovo가 자신이 통제하는 영역에서는 대부분 올바르게 행동했음에도 불구하고, 통제하지 못하는 영역을 통해 하이재킹당했다는 것입니다.

2015년을 넘어 폭넓게 적용되는 몇 가지 교훈이 있습니다.

1. **등록 기관은 당신이 그렇게 대우하든 아니든 신뢰 경계 안에 있습니다.** 자체 서버를 아무리 단단히 강화해도 보안 감사를 받아본 적 없는 제3자에서 도메인을 잃을 수 있습니다. 공격자는 저항이 가장 적은 경로를 택하며, 그 경로는 종종 등록 기관입니다.
2. **DNS 통제는 메일 통제입니다.** 하이재킹은 단순한 홈페이지 변조가 아닙니다. 동일한 레코드 변경이 조용히 이메일을 우회시켜 도청, 도메인 기반 비밀번호 재설정, 사칭을 가능하게 합니다. `MX` 레코드를 배관 설비가 아닌 보안 핵심 자산으로 취급하십시오.
3. **잠글 수 있는 것은 잠그십시오.** 등록 기관 잠금(registrar-lock / `clientTransferProhibited`), EPP/인증 코드에 대한 제한적 접근, 고가치 도메인에 대한 [레지스트리](/ko/glossary/registry/) 수준의 잠금은 정확히 이런 무단 네임서버 및 이전 변경을 막기 위해 존재합니다. 비용이 저렴합니다. 이를 건너뛸 때의 대가는 웹캠 슬라이드쇼 위에 올려진 자사 브랜드입니다.
4. **[DNSSEC](/ko/glossary/dnssec/)은 공격 비용을 높입니다.** 등록 기관 계정 탈취 자체를 막을 수는 없었겠지만, 서명된 존과 모니터링된 DNS는 탐지 없는 조용한 변조를 더 어렵게 만듭니다.
5. **자체 DNS 변동을 모니터링하십시오.** Lenovo의 네임서버가 예상치 못한 공급자로 변경된 것이 신호였습니다. NS 및 MX 레코드에 대한 지속적인 모니터링은 "고객들이 슬라이드쇼를 봐서 알게 됐다"를 "레코드가 변경됐을 때 알림을 받았다"로 바꿔줍니다.

공통 주제는 이것입니다. 도메인 통제는 그 자체로 하나의 보안 도메인이며, 대부분의 기업은 이를 위협 모델에 등장하지 않는 벤더에게 아웃소싱해놓고 있습니다.

## Namefi의 시각

![검증 가능하고 변조 방지된 도메인 소유권을 표현하는 컬러풀한 일러스트 — 초록색 방패로 보호된 도메인 카드, 초록색 Namefi 토큰, DNS 연속성](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

Lenovo 하이재킹 사건의 본질은 통제권과 출처 증명의 문제입니다. 공격자들은 Lenovo일 필요가 없었습니다. lenovo.com을 통제하는 시스템을 설득하여 새로운 곳을 가리키게만 하면 됐습니다. 도메인을 합법적으로 통제하는 주체가 누구인지에 대한 강력하고 독립적이며 검증 가능한 기록이 없었습니다 — Lenovo 측에서는 볼 수조차 없는 취약점을 통해 조용히 무력화될 수 있는 등록 기관 계정만 있었을 뿐입니다.

[Namefi](https://namefi.io)는 도메인이 검증 가능하고 변조에 강한 소유권을 가진 인터넷 네이티브 자산으로 작동해야 한다는 이념을 기반으로 만들어졌습니다. 도메인의 통제권이 복구 가능한 인증 코드를 가진 단일 등록 기관 계정이 아니라 감사 가능하고 조용히 재정의하기 어려운 암호화 소유권에 기반할 때, 무단 네임서버 교체는 조용한 백엔드 수정이 아니라 보관 사슬의 눈에 보이고 증명 가능한 단절이 됩니다. 토큰화된 소유권은 도메인을 DNS와 호환되게 유지하면서도 "이 이름을 누가 통제하며, 방금 그것이 바뀌었는가?"라는 질문에 검증 가능한 답을 제공합니다.

Lizard Squad는 소유권 체인의 가장 약한 고리를 악용하여 반나절 만에 IT 공룡의 정문을 장난으로 만들었습니다. 방어책은 더 화려한 웹사이트가 아닙니다. 이름 자체의 *소유권*을 공격자가 조용히 위조할 수 없는 것으로 만드는 것입니다.

## 출처 및 추가 참고 자료

- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- The Register — [Oh No, Lenovo! Lizard Squad on the attack, flashes swiped emails](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/)
- Engadget — [Lenovo's website hijacked, apparently by Lizard Squad](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)
- SecurityWeek — [Lizard Squad Hijacks Lenovo Website, Emails](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- BankInfoSecurity — [Lenovo Website Hijacked](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953)
- IT Security Guru — [Lizard Squad domain hijack gives control of Google Vietnam and Lenovo website](https://www.itsecurityguru.org/2015/02/26/lizard-squad-domain-hijack-gives-control-of-google-vietnam-and-lenovo-website/)
- CNBC — [Lenovo website breached, hacker group Lizard Squad claims responsibility](https://www.cnbc.com/2015/02/25/lenovo-website-breached-hacker-group-lizard-squad-claims-responsibility.html)
- We Live Security (ESET) — [Lenovo website hacked, Lizard Squad claims responsibility](https://www.welivesecurity.com/2015/02/26/lenovo-website-hacked-lizard-squad-claims-responsibility/)
- Computing — [Lenovo website hijacked by Lizard Squad after Superfish debacle](https://www.computing.co.uk/news/2397084/lenovo-website-hijacked-by-lizard-squad-after-superfish-debacle)
- Wikipedia — [Superfish](https://en.wikipedia.org/wiki/Superfish)
- CISA — [Lenovo Superfish Adware Vulnerable to HTTPS Spoofing](https://www.cisa.gov/news-events/alerts/2015/02/20/lenovo-superfish-adware-vulnerable-to-https-spoofing)
