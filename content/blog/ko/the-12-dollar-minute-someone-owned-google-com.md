---
title: '12달러의 1분: 누군가 조용히 Google.com을 구매한 날'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 4
format: case-study
description: '2015년 9월, 전직 Google 직원이 Google Domains에서 google.com을 12달러에 구매하여 세계에서 가장 가치 있는 도메인의 관리 권한을 약 1분간 보유했습니다. Sanmay Ved, 6,006.13달러의 버그 바운티, 그리고 그 1분의 소유권이 드러낸 도메인 통제의 본질에 관한 이야기입니다.'
keywords: ['google.com 도메인', 'sanmay ved', '구글 도메인 버그', '도메인 보안', 'google.com 소유자', '도메인 하이재킹', '웹마스터 도구 접근', '구글 버그 바운티', '6006.13 보상', '도메인 등록 취약점', '도메인 통제', 'DNS 보안', '도메인 소유권 검증']
relatedArticles:
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/the-sex-com-heist-the-forged-letter/
  - /ko/blog/the-2024-squarespace-defi-domain-hijacks/
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

2015년 9월 29일 밤, 약 1분 동안 인터넷에서 가장 가치 있는 주소는 Google의 것이 아니었습니다.

그것은 Sanmay Ved라는 전직 Google 직원의 소유였습니다. 그는 방금 **google.com**을 **12달러**에 구매했습니다.

그는 시스템을 해킹한 것이 아니었습니다. 버퍼 오버플로를 악용하거나 관리자를 피싱한 것도 아니었습니다. 그는 Google의 자체 소매 서비스인 Google Domains에 접속하여 세상에서 가장 유명한 도메인을 입력했고, 결제 프로세스가 절대 해서는 안 될 일을 하는 것을 지켜보았습니다. 결제가 승인된 것입니다. 카드에서 금액이 청구되었고 주문이 완료되었습니다. 약 60초 동안 google.com의 공식 [등록자](/ko/glossary/registrant/)은 매사추세츠주의 대학원생이었습니다.

이 시리즈 **Domain Mayday / 域名浩劫**은 도메인 보안이 공개적으로 실패한 순간들을 다룹니다. 대부분의 사례는 공격자에게 탈취된 도메인에 관한 것입니다. 이번 사례는 다릅니다 — 그리고 더욱 불안한 이야기입니다 — 왜냐하면 누구도 공격하지 않았기 때문입니다. 지구상에서 가장 중요한 단 하나의 도메인이 정가에, 장바구니에 담은 첫 번째 사람에게 판매되었습니다.

## google.com이 무엇인가

google.com이 얼마나 가치 있는지 과장하기란 쉽지 않습니다. 그 숫자는 사실 숫자로 표현하기 어렵습니다.

Google.com은 지구상에서 가장 많이 사용되는 검색 엔진의 정문이자, Gmail, Maps, Ads, YouTube 계정 흐름의 앵커이며, 수십억 명의 인증 기반입니다. 이 사건을 다룬 Slate는 google.com을 ["세계에서 가장 많은 트래픽을 가진 도메인"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.)이라고 불렀습니다. [Tesla.com](/ko/blog/from-teslamotors-com-to-tesla-com/)이나 Cars.com이 얼마에 팔렸든 간에, google.com은 그 자체로 독보적인 범주에 속합니다. 이것은 브랜드 자산이 아니라, 전 인류의 상당한 비율이 매일 접촉하는 *인프라*입니다.

이런 도메인은 손댈 수 없어야 합니다. 잠금 처리되고, 플래그가 지정되고, 레지스트리 보유, 서버 보류, 이전 금지 등 [레지스트라](/ko/glossary/registrar/)가 적용할 수 있는 모든 보호 수단으로 감싸여 있어야 합니다. 도메인 보안의 전제는 이름이 중요할수록 이동이 어려워진다는 것입니다.

그런데 12달러에 이동했습니다.

## 12달러의 1분

![12달러 가격표가 붙은 빛나는 지구 모양의 도메인, 1분 모래시계가 시작되는 동안 동전이 결제 슬롯에 떨어지는 생생하고 다채로운 컨셉 아트](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Ved는 문제를 일으키려던 것이 아니었습니다. 그는 전직 Googler였습니다 — 수년 전 계정 전략가로 Google에서 근무했습니다 — 그리고 늦은 밤 Google의 당시 새로운 레지스트라 서비스인 Google Domains를 둘러보며 도메인 이름들을 살펴보고 있었습니다. 충동적으로 그는 가장 유명한 도메인을 입력했습니다.

그의 말에 따르면 결과가 그를 놀라게 했습니다. ["Google.com을 입력했더니 놀랍게도 사용 가능하다고 나왔습니다,"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available) 라고 Ved는 Business Insider에 말했습니다. "프리미엄"도 아니고, "제안하기"도 아니고, "이미 등록된 도메인"도 아니었습니다. *사용 가능*이었습니다. 표준 등록 요금 12달러에.

그는 장바구니에 추가하고 결제를 시도했습니다. 시스템이 거부할 것이라 확신하면서요. 하지만 거부하지 않았습니다. 거래가 완료되었습니다. The Hacker News가 요약했듯이, 전직 Googler가 ["Google 자체 Domains 서비스를 통해 세계에서 가장 많이 방문하는 도메인 Google.com을 단 12달러에 구매하는 데 성공했습니다."](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain)

그리고 그의 받은 편지함이 채워지기 시작했습니다. [도메인 소유권](/ko/glossary/domain-ownership/)을 기반으로 작동하는 시스템들 — 인증된 도메인 소유자에게 알림과 제어 권한을 보내는 시스템들 — 이 새로운 등록인을 확인하고 자신의 역할을 수행하기 시작했습니다. Security Affairs는 그 순간을 이렇게 설명했습니다. ["몇 초 만에 그의 받은 편지함과 Google Webmaster Tools가 Google.com 도메인의 소유권을 확인하는 웹마스터 관련 메시지로 넘쳐났습니다."](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded)

그 1분 동안 Ved는 단순히 서류상 소유자로 등록된 것이 아니었습니다. 시스템이 그를 실제 소유자로 취급했습니다.

## 그 1분 동안 실제로 통제할 수 있는 것

이것이 재미있는 일화를 보안 이야기로 바꾸는 부분입니다.

Google 생태계에서 도메인의 인증된 소유자가 되면 **Webmaster Tools**(현재 Search Console)에 접근할 수 있습니다 — 사이트 소유자가 속성이 어떻게 인덱싱되는지 확인하고, 사이트맵을 제출하고, 내부 메시지를 보고, 도메인이 검색에 표시되는 방식을 관리하는 데 사용하는 대시보드입니다. Ved는 나중에 그 함의를 놓치지 않았다고 말했습니다. ["무서운 점은 제가 1분 동안 웹마스터 제어판에 접근할 수 있었다는 것입니다,"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute) 라고 그는 설명했습니다.

당시 보도에 따르면 그 시간 동안 그는 ["Google.com에 대한 관리자 접근 권한"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=he%20had%20administrative%20access%20to%20Google.com)을 가지고 있었으며 ["그의 Google Search Console 대시보드가 Google.com 도메인에 대한 메시지로 업데이트되었습니다."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated) 도메인을 소유하면 실제로 무엇에 접근할 수 있는지 생각해 보십시오. [DNS](/ko/glossary/dns/) 레코드, 메일 라우팅, 제3자에게 "소유권"을 증명하는 능력, 그리고 속성이 세상에 어떻게 표시되는지를 결정하는 검색 엔진 제어판. 등록은 마스터 키입니다. 그 아래에 있는 모든 것 — DNS, 인증서, 이메일, 싱글 사인온, 검색 인덱싱 — 은 등록인이 자신이 주장하는 사람임을 신뢰합니다.

Ved는 책임감 있게 행동했습니다. 단 하나의 레코드도 변경하지 않았습니다. 즉시 신고했습니다. 하지만 교훈은 여전히 남아 있습니다. "호기심 많은 학생"과 "재앙" 사이의 차이는 기술적 통제가 아니었습니다. 그것은 한 사람이 올바르게 행동하기로 한 선택이었습니다.

## Google의 감지 — 그리고 대응

![다채로운 회로 기판 하늘을 배경으로 열린 손에 잠시 쥐어진 거대한 빛나는 열쇠가 빛의 광선에 의해 부드럽게 되돌아가고 환불된 동전이 떠오르는 생생하고 다채로운 컨셉 아트](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Google의 자동화 시스템은 이 이상 현상을 빠르게 감지했습니다. 약 1분 만에 주문이 취소되었습니다. Fox News는 취소를 간결하게 보도했습니다. ["Google Domains가 1분 후 판매를 취소했으며, 누군가가 그보다 먼저 사이트를 등록했다고 하면서 Ved에게 12달러를 환불했습니다."](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later) 물론 먼저 등록한 "누군가"는 Google 자신이었습니다.

그런 다음 Google은 이 사건을 전설로 만든 행동을 했습니다. 취약점 보상 프로그램을 통해 Ved에게 바운티를 지급했으며, 회사는 그 금액을 의도적으로 선택했습니다. 2015년 공식 보안 연간 검토에서 Google은 이렇게 썼습니다. ["Sanmay에게 지급한 초기 재정 보상금 — $6,006.13 — 은 숫자로 Google을 표기한 것입니다(조금만 들여다보면 보입니다!). 그리고 Sanmay가 보상금을 자선 단체에 기부하겠다고 했을 때 이 금액을 두 배로 늘렸습니다."](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay) (숫자로 읽으면: 6-0-0-6-1-3 → G-O-O-G-L-E.)

Ved는 돈을 기부하기로 했습니다. 인도 전역에서 무료 학교를 지원하는 Art of Living India Foundation에 보내달라고 요청했으며, Google이 기부 사실을 알고 나서 상금을 두 배로 늘려 총 **$12,012.26**이 되었습니다. 이 사건 전체에 대한 Ved 자신의 생각은 결코 보상금에 관한 것이 아니었습니다. ["저는 돈에 관심 없습니다. 처음부터 돈 문제가 아니었습니다,"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money) 라고 그는 Business Insider에 말했습니다.

12달러짜리 실수는 영리한 바운티, 관대한 기부, 그리고 이를 매칭한 기업에 관한 이야기가 되었습니다. 하지만 선의를 걷어내면 남는 사실은 냉정합니다. 레지스트라가 자신의 왕국의 열쇠를 내어줬고, 그것을 되돌린 유일한 것은 빠른 자동화 감지 — 그리고 마침 정직했던 구매자였습니다.

## 이토록 중요한 등록이 어떻게 빠져나갔는가

지구상에서 유일하게 가장 잘 보호되어야 할 도메인이 어떻게 셀프 서비스 결제창에서 "12달러에 구매 가능"으로 표시될 수 있었을까요?

솔직히 말해서, Google 내부의 전체 사후 분석 자료를 갖고 있는 사람은 Google 외에 없으며 우리는 추측하지 않겠습니다. 하지만 도메인 시스템을 다뤄본 사람이라면 이 실패의 *형태*는 낯설지 않으며, 우리가 말할 수 있는 것과 없는 것을 정확히 구분하는 것이 중요합니다.

검증 가능한 것은 드러난 행동입니다. 당시 보도에서는 두 가지 일반적인 설명을 제시했습니다. ["Google Domains의 버그이거나, 회사가 단순히 도메인 이름을 갱신하지 않아 기한이 만료됐을 가능성이 있습니다."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew) 어느 쪽이든, 잠깐 동안 상점 프런트의 "이 이름을 등록할 수 있나요?" 로직이 절대 판매해서는 안 되는 이름에 대해 잘못된 답변을 반환했습니다.

더 깊은 교훈은 아키텍처적입니다. 도메인의 보호는 *그것을 변경하는 가장 취약한 경로*만큼만 강합니다. 레지스트리는 서버 보류 및 이전 금지 플래그를 적용할 수 있고, 레지스트라는 이름을 잠글 수 있으며, 조직은 레지스트라 수준의 다중 인증 및 승인 워크플로를 활성화할 수 있습니다. 하지만 단일 인터페이스 — 소매 결제, 내부 관리 도구, 지원 재정의, API 엔드포인트 — 가 그 보호 장치 없이 소유권을 변경할 수 있다면, 그 이름은 정확히 그 하나의 가장 취약한 인터페이스만큼만 안전합니다. 도메인 탈취의 피해 범위는 엄청납니다(DNS, 이메일, 인증서, 로그인). 하지만 그것을 촉발하는 표면은 매우 작을 수 있습니다. "아니오"라고 해야 했는데 "예"라고 한 하나의 폼.

이 비대칭이 핵심 문제입니다. 위험에 처한 가치는 최대입니다. 그것을 이동하는 데 필요한 행동은 최소일 수 있습니다.

## 도메인 통제에 대해 이 사건이 가르치는 것

12달러의 1분에서 몇 가지 지속적인 교훈이 나옵니다.

1. **등록인 기록이 마스터 키입니다.** DNS, TLS 인증서, 이메일 전달 가능성, "이 도메인을 소유하고 있음을 확인하세요" 흐름은 모두 그 아래에 있는 등록을 신뢰합니다. 등록을 통제하는 사람은 그것에 연결된 모든 것을 통제합니다. 이 계층을 사실상 루트 비밀번호처럼 보호하십시오.

2. **중요성과 보호는 자동으로 상관관계가 없습니다.** 세상에서 가장 중요한 도메인이 가장 잘 잠겨 있다고 가정할 것입니다. 1분 동안 그렇지 않았습니다. 중요성이 스스로를 보호하지 않습니다. 명시적인 잠금, 보류, 승인 게이트가 보호합니다. 이를 감사하십시오. 가정하지 마십시오.

3. **[제어 평면](/ko/blog/dns-is-the-control-plane/)은 DNS보다 큽니다.** 사람들은 네임서버를 보안하고 레지스트라 계정, 지원 채널, 청구 이메일, 내부 도구를 잊습니다. 도메인은 소유권을 재작성할 수 있는 어떤 문을 통해서도 손실될 수 있습니다 — "DNS"라고 표시된 문만이 아닙니다.

4. **우리는 종종 재앙으로부터 한 명의 정직한 사람만큼 떨어져 있습니다.** Google은 구매자가 즉시 신고한 보안 의식이 있는 전직 직원이었다는 행운이 있었습니다. 우연히 들어온 사람의 선의에 의존하는 보안은 보안이 아닙니다. 방문자가 아니라 시스템이 "아니오"라고 말해야 합니다.

5. **빠른 감지는 실질적인 통제입니다.** Google의 약 1분 자동화 감지는 피해를 실질적으로 제한했습니다. 모든 실수를 예방할 수는 없지만, 소유권 변경에 대한 철저한 모니터링은 슬립이 침해가 되는 시간 창을 줄입니다.

이 이야기의 안심되는 부분은 Google의 시스템이 이를 발견하고 되돌렸다는 것입니다. 불편한 부분은 그들이 그렇게 해야 했다는 것입니다.

## Namefi의 관점

![검증 가능하고 변조 방지된 도메인 소유권의 다채로운 일러스트레이션 — 녹색 방패, 녹색 Namefi 토큰, DNS 연속성으로 보호된 도메인 카드](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

12달러의 1분은 본질적으로 기록에 관한 질문입니다. *지금 이 이름의 인증된 소유자는 누구이며, 그것을 조용히 바꾸는 것이 얼마나 어려운가?*

전통적인 모델에서 답은 레지스트라의 데이터베이스 안에 있습니다. 해당 레지스트라가 노출하는 어떤 인터페이스 — 소매 결제, 내부 관리 재정의, 지원 티켓, API — 를 통해서도 변경될 수 있습니다. 이러한 인터페이스 대부분은 잘 보호되어 있습니다. 하지만 소유권은 가장 덜 보호된 인터페이스만큼만 안전하며, 소유자는 일반적으로 자신의 기록이 다른 사람에게 넘어가는 순간을 실시간으로 볼 수 없습니다. Sanmay Ved는 받은 편지함이 갑자기 메시지로 가득 찼기 때문에 자신이 google.com을 "소유"한다는 것을 알게 되었습니다 — 강화된 장부가 인증된 승인된 이전을 알려줬기 때문이 아니라.

[Namefi](https://namefi.io)는 도메인 소유권이 단일 가변 행에 묻혀 있는 것이 아니라 **검증 가능하고 변조 증거가 명확**해야 한다는 전제에서 출발합니다. 도메인 통제를 DNS와 호환성을 유지하면서 토큰화된 온체인 자산으로 표현함으로써, "이 도메인을 누가 소유하는가"라는 행위는 독립적으로 검증하고 감사할 수 있는 것이 됩니다 — 그리고 이전은 결제 프로세스가 조용히 완료되는 것이 아니라 명시적이고 승인된 가시적 이벤트가 됩니다. 목표는 도메인을 복잡하게 만드는 것이 아닙니다. 마스터 키를 실수로 잘못된 사람에게 넘기기 어렵게 만들고, 흔적 없이 이동하는 것을 불가능하게 만드는 것입니다.

Google.com이 1분 만에 회복된 것은 Google이 취약한 기본 구조 위에 빠른 감지를 구축했기 때문입니다. 더 나은 답은 기본 구조 자체를 신뢰할 수 있게 만드는 것입니다. 증명할 수 있는 소유권, 볼 수 있는 이전, 그리고 단일 폼이 "아니오"라고 기억하는 것에 의존하지 않는 통제.

## 출처 및 추가 읽기

- Google Online Security Blog — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1) ($6,006.13 보상 및 두 배 기부에 대한 1차 출처)
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/) (Google 블로그 원문 인용)
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- Fox News — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- Fox News — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- Yahoo Finance — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)
