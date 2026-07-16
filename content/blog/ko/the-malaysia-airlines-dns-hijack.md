---
title: '말레이시아 항공 DNS 하이재킹: "404 — 비행기를 찾을 수 없습니다"'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 16
format: case-study
description: '2015년 1월, Lizard Squad는 malaysiaairlines.com의 DNS를 하이재킹하여 항공사 사이트를 턱시도를 입은 도마뱀 이미지와 "404 — 비행기를 찾을 수 없습니다"라는 조롱 문구로 교체했습니다. 서버 침해는 없었습니다 — 공격자들은 단순히 도메인이 가리키는 위치를 변경했을 뿐입니다. Domain Mayday가 DNS가 어떻게 항공사의 가장 취약한 현관문이 되었는지 심층 분석합니다.'
keywords: ['말레이시아 항공 DNS 하이재킹', '리자드 스쿼드', '사이버 칼리파', '404 비행기를 찾을 수 없습니다', 'DNS 하이재킹', '도메인 하이재킹', '레지스트라 침해', 'webnic', 'malaysiaairlines.com', '도메인 보안', 'DNS 리디렉션', '레지스트리 잠금', 'mh370']
relatedArticles:
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/the-curve-finance-dns-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-bitcoin-org-dns-hijack/
  - /ko/blog/the-fox-it-dns-hijack/
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
  - /ko/glossary/registry/
  - /ko/glossary/tld/
---

비행기는 끝내 발견되지 않았습니다. 2015년 1월, 웹사이트도 마찬가지였습니다.

2015년 1월 26일 아침, **malaysiaairlines.com**을 브라우저에 입력한 사람은 누구도 항공사 사이트에 접근하지 못했습니다. 그들이 마주한 것은 해커였습니다. 익숙하던 예약 페이지는 사라지고, 실크 모자에 단안경을 낀 도마뱀 이미지와 단 하나의 잔인한 헤드라인이 그 자리를 차지했습니다: **"404 — 비행기를 찾을 수 없습니다."** 그 아래에는 *"Lizard Squad에 의해 해킹됨 — 공식 사이버 칼리파"*라는 문구가 적혔습니다. 브라우저 제목 표시줄에는 간단히 *"ISIS가 승리할 것이다"*라고 쓰여 있었습니다.

이것은 묘지를 소재로 한 농담이었습니다. 불과 1년도 채 되지 않아 말레이시아 항공 370편이 239명의 탑승객을 태운 채 레이더에서 사라졌습니다. 그로부터 4개월 후, 17편은 우크라이나 상공에서 격추되었습니다. 이제 10대 청소년 무리가 항공사의 비극을 항공사 자신의 현관문에 조롱거리로 걸어두었습니다 — 서버 하나 건드리지 않고서.

바로 이 마지막 부분이 이 사건의 핵심입니다. 말레이시아 항공은 대부분의 사람들이 상상하는 방식으로 "해킹"당한 것이 아니었습니다. 예약 시스템은 온전했습니다. 승객 데이터는 전혀 건드려지지 않았습니다. 공격자들이 탈취한 것은 더 근본적인 것, 그리고 놀랍게도 훨씬 쉽게 빼앗을 수 있는 것이었습니다: 바로 **도메인 이름 자체** — 전 세계 인터넷에 "말레이시아 항공"이 어디에 있는지 알려주는 주소였습니다.

이것은 아마 평소에는 전혀 생각하지 않다가 엉뚱한 곳을 가리키기 시작할 때서야 비로소 주목하게 되는 인프라 구성 요소에 관한 Domain Mayday 사례 분석입니다.

## 항공사는 곧 도메인입니다

글로벌 항공사에게 웹사이트는 단순한 홍보 책자가 아닙니다. 그것은 금전 등록기이자 체크인 카운터이자 콜센터이며, 이 모든 것이 단 하나의 문자열에 묶여 있습니다: `malaysiaairlines.com`.

모든 예약, 모든 마일리지 로그인, 모든 확인 이메일 속 "내 항공편 관리" 링크는 이 도메인을 통해 처리됩니다. 쿠알라룸푸르나 런던의 승객이 이 주소를 입력하면 보이지 않는 연결 고리가 작동합니다: 브라우저가 [도메인 네임 시스템(DNS)](/ko/glossary/dns/)에 "malaysiaairlines.com은 어디에 있습니까?"라고 묻고, DNS는 [IP 주소](/ko/glossary/ip-address/)로 답하며, 브라우저가 연결합니다. 항공사의 브랜드, 매출, 고객의 신뢰 모두가 이 단 하나의 조회가 *올바른* 답을 반환하는 데 달려 있습니다.

DNS는 인터넷의 주소록입니다. 그리고 대부분의 조직에게는 건물에서 가장 감시가 소홀한 문이기도 합니다. 서버를 강화하고, 데이터베이스를 암호화하고, [피싱](/ko/glossary/phishing/) 대비 직원 교육에 수백만 달러를 쏟아부을 수 있습니다 — 하지만 누군가가 주소록에서 여러분의 이름이 가리키는 줄을 조용히 바꿀 수 있다면 이 모든 노력은 무의미합니다. 주소를 바꾸면 회사 자체를 바꿀 수 있습니다. 건물에 침입하지 않아도 됩니다.

이것이 정확히 일어난 일입니다.

## 하이재킹: 항공사가 있어야 할 자리에 도마뱀이

![활주로 위의 빛나는 DNS 이정표가 보이지 않는 손에 의해 바뀌어, 탑승객들의 흐름이 출발 게이트에서 거대한 404가 찍힌 막다른 벽으로 리디렉션되는 생생하고 화려한 개념 아트, 네온 청록색과 마젠타](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

이 훼손은 최대한의 잔인함을 위해 치밀하게 설계되었습니다. 정장 차림의 도마뱀 이미지는 Lizard Squad의 트레이드마크였습니다. 이 그룹은 바로 전 12월에 [Xbox Live와 소니 플레이스테이션 네트워크](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month)를 연휴 기간 내내 다운시킨 바 있었습니다. 1월에 이르러 이 그룹은 "사이버 칼리파"의 이미지를 내세우며 ISIS와 연계된 척 포장했지만, 연구자들은 이러한 주장에 깊은 회의감을 표명했습니다.

방문자들이 목격한 사이트는 [실크 모자와 단안경을 낀 도마뱀 그림과 함께 "404-비행기를 찾을 수 없습니다"라는 텍스트를 표시하고 있었습니다](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27). Wikipedia의 해당 그룹 기록도 같은 장면을 묘사합니다: 사용자들은 [턱시도를 입은 도마뱀 이미지가 있는 다른 페이지로 리디렉션되었고](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard), 그 페이지에는 [전년도 MH370 실종 사건을 빗댄 것으로 보이는 "404 - 비행기를 찾을 수 없습니다"라는 헤드라인이 달려 있었습니다](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year).

잔인함은 그 자체가 목적이었습니다. MH370은 [2014년 3월 8일 레이더에서 사라졌고](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014), 탑승한 239명 전원은 결국 사망한 것으로 추정되며 잔해는 끝내 확인되지 않았습니다. MH17은 [2014년 7월 17일 러시아 지원 세력이 발사한 Buk 9M38 지대공 미사일에 격추되어](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014) 탑승자 298명 전원이 사망했습니다. 항공사의 홈페이지에 "비행기를 찾을 수 없습니다"를 새겨 넣은 것은 회사 역사상 최악의 한 해를 무기화한 행위였으며, 그 내용을 사이트에 접속하려는 모든 고객에게 방송한 것이었습니다.

그런 다음 협박이 이어졌습니다. 이 그룹은 [트윗을 통해 "www.malaysiaairlines.com 서버에서 발견된 전리품을 곧 공개하겠다"고 예고했고](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon), 승객 여정 정보가 담긴 것처럼 보이는 스크린샷까지 공개했습니다. 이미 재앙과 같은 한 해에 수몰된 항공사에게 고객 데이터가 유출되었다는 생각은 그 자체로 또 다른 재앙이었습니다.

## 발생 경위: 건물이 아니라 주소록

![미래적인 교환원이 올바른 소켓에서 빛나는 케이블을 뽑아 가짜 소켓에 꽂으며, 빛의 흐름이 활주로에서 위조 터미널로 방향을 바꾸는 생생하고 화려한 개념 아트, 전기 파란색과 따뜻한 주황색](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

이것이 이 사건의 기술적 핵심이며, 이 사례가 서버 침해 시리즈가 아닌 도메인 보안 시리즈에 속하는 이유입니다.

말레이시아 항공의 공식 발표는 보도 전반에 걸쳐 반복되며 이 차이를 정확히 짚었습니다: [말레이시아 항공은 도메인 네임 시스템(DNS)이 침해되어 www.malaysiaairlines.com URL을 입력할 때 사용자가 해커 웹사이트로 리디렉션되고 있음을 확인합니다](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website). 항공사는 [웹사이트는 해킹되지 않았으며 이 일시적인 오류는 예약에 영향을 미치지 않고 사용자 데이터는 안전하게 보호되고 있다](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured)고 주장하며, [웹 서버는 온전하다](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact)고 덧붙였습니다.

두 가지 모두 동시에 사실이었습니다: 사이트는 파괴되었고, *동시에* 서버는 멀쩡했습니다. 공격자들에게 서버는 필요하지 않았습니다. The Register가 표현했듯이, [사이트의 DNS 레코드가 변조되어 사용자들이 해커가 제어하는 사이트로 리디렉션되었습니다](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site). 그들이 바꾼 것은 주소록 항목이었지, 그것이 가리키는 건물이 아니었습니다. 악의는 메타데이터에도 새겨졌습니다: 당시 [Whois](/ko/glossary/whois/) 조회 결과 사이트의 제목으로 [ISIS가 승리할 것이다](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail)가 표시되었습니다.

그 주소록은 어디에 보관되어 있었을까요? [레지스트라](/ko/glossary/registrar/)에 있었습니다. 항공사의 도메인은 [싱가포르, 말레이시아, 중국에 사무소를 둔 Web Commerce Communications Limited, 즉 Webnic에 등록된 것으로 보입니다](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China). 이 이름은 중요합니다. Webnic이 곧 악명을 떨치게 될 것이었기 때문입니다.

한 달 후, 같은 레지스트라가 훨씬 더 큰 사건의 중심에 섰습니다. Brian Krebs의 보도에 따르면, 공격자들은 [두 도메인과 60만 개의 기타 도메인을 담당하는 말레이시아 레지스트라 Webnic.cc를 장악하고](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others), [Webnic.cc에 대한 접근권을 활용하여 도메인 네임 시스템(DNS) 레코드를 변경했습니다](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records). 대상은 **[레노버](/ko/blog/the-lenovo-com-dns-hijack/)**와 **Google 베트남**이었습니다. Krebs의 보도에 따르면 이용된 수법은 [Webnic.cc의 명령어 주입 취약점을 통한 루트킷 업로드](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit)였습니다 — 수십만 개의 도메인이 어디를 가리키는지를 제어하는 바로 그 시스템에 대한 지속적 접근권을 확보한 것입니다.

Google을 침해하지 않아도 google.com.vn을 리디렉션할 수 있습니다. 항공사를 침해하지 않아도 항공사 홈페이지를 리디렉션할 수 있습니다. "이 도메인은 어디에 있습니까?"라는 질문에 *답을 갖고 있는* 레이어, 즉 레지스트라 계정과 그 배후의 DNS 레코드를 침해하기만 하면 됩니다. 그 레이어는 대부분의 기업이 실제로 방어하는 경계 밖에 있습니다.

## 영향과 대응

항공사가 입은 피해는 데이터 절도보다는 평판 및 운영 측면의 손실이었습니다. 예약하거나 체크인하려는 고객들은 훼손된 페이지를 마주했습니다. 전 세계 헤드라인은 "말레이시아 항공"과 "해킹"이라는 단어를 함께 다루었고, 이미 위기에 처한 브랜드는 이제 실종된 자사 항공기를 조롱하는 도마뱀과 연결되었습니다.

항공사는 DNS 하이재킹을 억제할 수 있는 유일한 방법으로 대응했습니다: 침해된 레이어를 통해 작업하는 것이었습니다. 항공사는 [서비스 제공업체와 함께 문제를 해결했다](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider)고 밝혔으며, [시스템은 22시간 이내에 완전히 복구될 것으로 예상된다](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours)고 덧붙였습니다. 이 타임라인 자체가 DNS의 특성을 보여줍니다: 레코드를 수정하더라도 잘못된 응답은 만료될 때까지 전 세계 캐시에 남아 있을 수 있습니다. 하이재킹은 실행하기는 빠르지만 완전히 되돌리는 데는 느립니다.

데이터 유출 협박에 대해 항공사는 예약 미영향, 사용자 데이터 안전이라는 입장을 유지했으며, 이 그룹이 호언장담했던 대규모 유출은 결국 예고된 대로 실현되지 않았습니다. 그러나 "우리는 실제로 침해당하지 않았습니다. 공격자들이 약 하루 동안 우리의 공개 신원 전체를 장악했을 뿐입니다"라는 메시지를 여행객에게 납득시키기란 쉽지 않습니다. "404 — 비행기를 찾을 수 없습니다"를 바라보는 고객에게 서버 침해와 DNS 하이재킹의 차이는 보이지 않습니다. 사이트가 곧 항공사였습니다. 그리고 하루 동안, 그 사이트는 다른 누군가의 것이었습니다.

## DNS가 현관문이라는 것이 가르쳐 주는 교훈

말레이시아 항공 하이재킹은 일반적인 의미에서 *아무것도 침해되지 않았기 때문에* 정확히 교과서적인 교훈이 됩니다. 이 사례의 시사점은 온라인상의 거의 모든 조직에 적용됩니다:

1. **도메인은 당신 혼자 통제하지 않는 단일 장애 지점입니다.** 레지스트라가 당신의 이름이 어디를 가리키는지에 대한 마스터 레코드를 보유합니다. 그들의 계정 보안 — 혹은 소프트웨어 — 이 실패하면, 당신의 완벽하게 강화된 서버는 무의미해집니다. Webnic은 한 달 동안 두 번 이것을 증명했습니다. 한 번은 항공사로, 그다음은 Google과 레노버로.

2. **DNS 하이재킹에는 당신에 대한 침해가 필요하지 않습니다.** 공격자들은 건물이 아닌 주소록을 리디렉션했습니다. 서버, 코드, 네트워크를 감시하는 방어 체계는 전적으로 명명 레이어에서 발생하는 공격을 놓칠 수 있습니다.

3. **당신의 이름을 이동시킬 수 있는 레코드를 잠그십시오.** [레지스트리 잠금](/ko/glossary/registry-lock/)과 레지스트라 수준의 잠금은 DNS 및 [네임서버](/ko/glossary/nameserver/) 레코드에 대한 무단 변경을 막기 위해 특별히 존재하며, 도메인의 가리키는 위치를 변경하기 전에 수동적이고 대역 외 단계를 추가합니다. 고가치 도메인에 이것은 선택 사항이 아닙니다.

4. **레지스트라에서 [DNSSEC](/ko/glossary/dnssec/)와 2FA를 활성화하십시오.** 레지스트라 계정에 대한 강력한 인증과 존에 대한 DNSSEC 서명은 말레이시아 항공을 훼손한 조용한 레코드 교체의 비용을 높입니다.

5. **복구는 공격보다 느립니다.** TTL과 전 세계 캐시는 하이재킹이 수정 후에도 지속되게 합니다. 패치만이 아니라 정리 기간을 계획하십시오.

불편한 요약: 대부분의 기업은 건물을 지키면서 현관문에 모두에게 어느 건물로 들어가야 하는지 알려주는 메모를 붙여 놓습니다. 그 메모를 바꾸면 회사를 옮길 수 있습니다.

## Namefi의 관점

![검증 가능하고 변조 저항성이 있는 도메인 소유권의 다채로운 일러스트레이션 — 녹색 방패, 녹색 Namefi 토큰, DNS 연속성으로 보호된 도메인 카드](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

말레이시아 항공 하이재킹은 근본적으로 *이름이 가리키는 위치를 변경할 권한이 누구에게 있는가* — 그리고 그 권한이 레지스트라 레이어에서 얼마나 쉽게 조용히 탈취될 수 있는가의 문제입니다. 이 공격은 암호화를 격파하거나 데이터베이스를 해킹한 것이 아니었습니다. 도메인에 관한 가장 중요한 사실, 즉 어디로 연결되는지를 결정하는 소프트하고 계정 기반의 제어 플레인을 격파한 것이었습니다.

[Namefi](https://namefi.io)는 [도메인 소유권](/ko/glossary/domain-ownership/)과 제어가 레지스트라의 데이터베이스에 있는 항목 — 침해된 계정 하나가 덮어쓸 수 있는 — 이 아니라 검증 가능하고 [인터넷 네이티브 자산](/ko/glossary/internet-native-asset/)처럼 작동해야 한다는 아이디어 위에 구축되었습니다. 토큰화된 소유권은 "이 도메인을 누가 제어하며, 그 제어권이 방금 이전되었는가?"라는 질문을 DNS와의 호환성을 유지하면서 감사 가능하고 변조 증거를 남기는 방식으로 만듭니다. 하이재킹에 대한 방어는 단순히 더 강력한 비밀번호만이 아닙니다 — 무단 변경을 침묵 대신 *가시적이고 증명 가능하게* 만드는 것입니다.

말레이시아 항공은 서버를 잃지 않았습니다. 약 하루 동안 단 하나의 질문에 대한 답을 잃었습니다 — *이 이름은 어디를 가리키는가?* 비행기는 끝내 발견되지 않았습니다. 웹사이트는 결코 이렇게 잃어버려서는 안 되었습니다. Domain Mayday의 교훈은 주소록이 경계의 일부이며, 그것을 잊는 날이 바로 실크 모자를 쓴 도마뱀이 당신의 현관문을 점령하는 날이라는 것입니다.

## 출처 및 추가 자료

- TechCrunch — [Malaysia Airlines Site Hacked By Lizard Squad](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/)
- The Register — [Lizard Squad threatens Malaysia Airlines with data dump](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/)
- BankInfoSecurity — [Malaysia Airlines Website Hacked](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833)
- Computerworld — [Malaysia Airlines claim DNS hijacked, site not hacked, but attackers threaten data dump](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html)
- Infosecurity Magazine — [Malaysia Airlines Site Back Up as Hackers Threaten Data Dump](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/)
- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- ABC News — [Malaysia Airlines Hit by Lizard Squad Hack Attack](https://abcnews.go.com/Technology/malaysia-airlines-hit-lizard-squad-hack-attack/story?id=28489244)
- NBC News — [Lizard Squad Claims It Hacked Malaysia Airlines Website](https://www.nbcnews.com/storyline/isis-terror/lizard-squad-claims-it-hacked-malaysia-airlines-website-n293461)
- IT Security Guru — [Lizard Squad hijacks Malaysia Airline DNS](https://www.itsecurityguru.org/2015/01/26/lizard-squad-hijacks-malaysia-airline-dns/)
- Wikipedia — [Lizard Squad](https://en.wikipedia.org/wiki/Lizard_Squad)
- Wikipedia — [Malaysia Airlines Flight 370](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370)
- Wikipedia — [Malaysia Airlines Flight 17](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17)
