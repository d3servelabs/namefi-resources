---
title: '도메인 메이데이 EP03: 2020년 Twitter Bitcoin 계정 탈취 사건'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 5
format: case-study
description: '2020년 7월 15일, 공격자들은 전화 한 통으로 Twitter 내부에 침투해 Obama, Biden, Musk, Gates, Apple, Uber 등 인증된 계정을 탈취하고 Bitcoin 2배 사기를 벌여 약 $118,000를 편취했습니다. 온라인 신원이 어떻게 도용될 수 있는지, 그리고 이름을 소유한다는 것이 무엇을 의미하는지에 대한 심층 분석입니다.'
keywords: ['2020 Twitter 해킹', 'Twitter 비트코인 사기', 'graham ivan clark', '비싱', '전화 스피어 피싱', '소셜 엔지니어링', '계정 탈취', '온라인 신원 보안', '인증 계정 도용', 'Twitter 관리자 도구', '에이전트 도구', '내부자 위협', '도메인 보안', 'NY DFS Twitter 보고서']
relatedArticles:
  - /ko/blog/the-bitcoin-org-dns-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ko/blog/the-12-dollar-minute-someone-owned-google-com/
  - /ko/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/web3/
---

어느 수요일 오후, 몇 시간 동안 인터넷에서 가장 신뢰받는 목소리들이 일제히 같은 말을 하기 시작했습니다. Bitcoin을 보내면 두 배로 돌려주겠다는 말이었습니다.

Barack Obama도, Joe Biden도, Elon Musk도 같은 말을 했습니다. Bill Gates, Jeff Bezos, Kanye West, Apple, Uber — 수억 명이 신뢰하도록 훈련된, 파란색 체크 표시가 붙은 인증 계정들 모두가 거의 똑같은 내용의 조악한 암호화폐 사기 게시물을 올렸습니다. 하지만 그 어느 누구도 실제로 한 글자도 입력하지 않았습니다. 그들의 *계정*이 대신 그렇게 한 것이었는데, 그 계정의 열쇠를 다른 누군가가 쥐고 있었기 때문입니다.

이것이 바로 **도메인 메이데이 EP03**입니다. 앞의 두 에피소드는 이름에 관한 이야기였습니다 — 누가 소유하고, 누가 빼앗을 수 있는지에 대해서요. 이번 에피소드는 같은 질문을 다른 형태로 다룹니다. Twitter 핸들, 인증 배지, 도메인 이름 — 이 모두는 우리가 신뢰를 전제로 받아들이는 신원 주장입니다. 그리고 2020년 7월 15일, 공격자들은 그 신원을 탈취하는 데 얼마나 작은 것으로도 충분한지를 증명했습니다 — 악성 코드나 제로데이 취약점이 아닌, 단 한 통의 전화로.

## 핸들 속에 깃든 신뢰

인증된 계정은 신뢰의 지름길입니다. `@BarackObama`가 트윗을 올리면, 누구도 그것이 진짜 그인지 재확인하지 않습니다. 핸들과 배지 자체가 *인증*이기 때문입니다. 이 지름길은 막대한 가치를 지니지만, 동시에 극도로 취약합니다. 계정에 신뢰가 축적되는 동안, 계정에 대한 통제권은 전혀 다른 곳에 있을 수 있기 때문입니다.

도메인 이름도 동일한 구조입니다. `whitehouse.gov`가 신뢰받는 이유는 방문자들이 인증서 체인을 일일이 검증해서가 아니라, 이름 자체가 권위를 내포하고 있기 때문입니다. [레지스트라](/ko/glossary/registrar/)에서든, [DNS](/ko/glossary/dns/)에서든, 관리 패널에서든 — 그 이름을 장악한다면 사람들이 그 이름에 쏟아온 모든 신뢰를 즉시 상속받습니다. 그 이름이 원래 자신의 것이었는지 여부와 상관없이.

2020년 Twitter 해킹은 *신뢰*와 *통제* 사이의 이 간극을 가장 선명하게 보여주는 사례입니다. 피해 기업 중 규제 대상 암호화폐 회사들이 포함되어 있어 사건을 조사한 뉴욕 금융 감독국은 이를 단도직입적으로 표현했습니다. 이 공격은 "[미숙한 사이버 범죄자들조차 얼마나 막대한 피해를 입힐 수 있는지를 보여주는 경고의 사례](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20is%20a%20cautionary%20tale%20about%20the%20extraordinary%20damage%20that%20can%20be%20caused%20even%20by%20unsophisticated%20cybercriminals)"라고 했습니다.

## 2020년 7월 15일: 탈취 당일

![단 하나의 빛나는 마스터 키가 거대한 벽에 빼곡히 늘어선 파란색 인증 배지들을 차례로 잠금 해제하는 생동감 있는 컨셉 아트](../../assets/the-2020-twitter-bitcoin-account-takeover-01-takeover.jpg)

사건은 대낮에, 그것도 빠르게 벌어졌습니다. Wikipedia의 재구성에 따르면, "[2020년 7월 15일 UTC 20:00~22:00 사이에 130개의 고-프로파일 Twitter 계정이 침해되었다](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=On%20July%2015%2C%202020%2C%20between%2020%3A00%20and%2022%3A00%20UTC%2C%20130%20high%2Dprofile%20Twitter%20accounts%20were%20compromised)."

뉴욕 금융감독국(DFS) 보고서는 공격의 순서를 상세히 기술합니다. 해커들은 먼저 암호화폐 계정을 대상으로 워밍업을 했습니다. "[해커들은 먼저 유명 암호화폐 회사 및 인물과 연결된 Twitter 계정을 조작했다](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20first%20manipulated%20Twitter%20accounts%20connected%20to%20well%2Dknown%20cryptocurrency%20companies%20and%20individuals)"고 하며, Bitcoin [지갑](/ko/glossary/wallet/)을 가리키는 다이렉트 메시지와 트윗을 뿌렸습니다. 이후 규모를 키웠습니다. "[해커들은 이후 수백만 팔로워를 보유한 인증 Twitter 계정을 대상으로 판돈을 크게 올렸다](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20then%20raised%20the%20stakes%20significantly%20and%20targeted%20verified%20Twitter%20accounts%20with%20millions%20of%20followers)."

피해 계정 목록은 플랫폼에서 가장 신뢰받는 계정들의 명단 같았습니다. Wikipedia는 "[침해된 것으로 알려진 계정에는 Barack Obama, Joe Biden, Bill Gates, Jeff Bezos 같은 저명인사와 Apple, Uber, Cash App 같은 기업이 포함되었다](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=well%2Dknown%20individuals%20such%20as%20Barack%20Obama%2C%20Joe%20Biden%2C%20Bill%20Gates%2C%20Jeff%20Bezos)"고 기록하고 있습니다.

메시지는 동일했고 터무니없이 단순했습니다. Wikipedia에 기록된 Apple 계정의 게시물을 보면: "[우리는 커뮤니티에 보답하고 있습니다. 우리는 Bitcoin을 지지하며 여러분도 그래야 한다고 생각합니다! 우리 주소로 보내진 모든 Bitcoin은 두 배로 돌려드립니다!](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=We%20are%20giving%20back%20to%20our%20community.%20We%20support%20Bitcoin%20and%20believe%20you%20should%20too!%20All%20Bitcoin%20sent%20to%20our%20addresses%20will%20be%20sent%20back%20to%20you%2C%20doubled!)" 같은 제안이 세계에서 가장 신뢰받는 수십 개의 입을 통해 동시에 반복됐습니다.

침해된 계정 모두가 활용된 것은 아니었습니다. 규제 기관 조사에 따르면 "[Twitter 해킹 중 총 130개의 Twitter 계정이 침해되었으며, 그 중 45개 계정이 트윗 발송에 사용되었다](https://www.dfs.ny.gov/Twitter_Report#:~:text=Overall%2C%20130%20Twitter%20user%20accounts%20were%20compromised%20during%20the%20Twitter%20Hack.%20Of%20those%2C%2045%20accounts%20were%20used%20to%20send%20tweets)." 45개의 확성기는 충분히도 넘쳤습니다.

## 실제로 잃어버린 것

실제 피해 금액은 소박한 수준이었습니다. DFS 보고서에 따르면 "[해커들은 Twitter 해킹을 통해 약 $118,000 상당의 비트코인을 탈취했다](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20stole%20approximately%20%24118%2C000%20worth%20of%20bitcoin%20through%20the%20Twitter%20Hack)." Wikipedia는 단 하나의 사기 지갑이 "[사기 메시지가 삭제되기 전 $110,000 이상의 가치에 해당하는 320회 이상의 입금을 받았다](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=received%20over%20320%20deposits%20with%20a%20value%20of%20over%20US%24110%2C000%20before%20the%20scam%20messages%20were%20removed)"고 기록합니다. 이 규모의 침해 사건치고 $118,000은 민망할 정도로 작은 금액입니다.

하지만 금액은 실제 피해를 심각하게 과소평가합니다. 그날 오후 실제로 무너진 것은 *인증 핸들이 신뢰 신호로서 지니는 무결성*이었습니다. 두 시간 동안 파란색 체크 표시는 아무것도 증명하지 못했습니다. 트윗이 해당 이름을 가진 사람에게서 왔다고 믿을 수 있게 해주는 플랫폼의 신원 체계 전체가 — 한 명의 십 대 청소년에 의해 동시에 제어될 수 있다는 사실이 명백히 드러났습니다. Twitter의 대응은 많은 것을 시사합니다. Twitter는 많은 인증 계정의 트윗 기능을 일시적으로 동결했습니다. 신뢰받는 계정들이 거짓말을 하지 못하게 막는 유일한 방법이 그것들을 침묵시키는 것이었으니까요.

이것이 신원 탈취의 진정한 비용입니다. 금전적 피해는 각주에 불과합니다. 진짜 피해는 "이 계정 = 이 사람"이라는 등식이 더 이상 성립하지 않게 되고, 그 등식을 믿었던 모든 사람이 위험에 노출된다는 것입니다.

## 어떻게 일어났는가: 전화 한 통, 그리고 관리자 패널

![전화 수화기가 낚싯줄처럼 캐스팅되어, 스위치와 토글로 가득 찬 빛나는 내부 제어판 대시보드를 낚아채는 생동감 있는 컨셉 아트](../../assets/the-2020-twitter-bitcoin-account-takeover-02-vishing.jpg)

익스플로잇은 없었습니다. DFS 보고서는 단호하게 말합니다. "[Twitter 해킹은 사이버 공격에서 흔히 사용되는 첨단 또는 정교한 기술을 전혀 수반하지 않았다 — 악성 코드도, 익스플로잇도, 백도어도 없었다](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20did%20not%20involve%20any%20of%20the%20high%2Dtech%20or%20sophisticated%20techniques%20often%20used%20in%20cyberattacks%20%E2%80%93%20no%20malware%2C%20no%20exploits%2C%20and%20no%20backdoors)." 대신 "[해커들은 전통적인 사기꾼에 가까운 기본적인 기술을 사용했다. 즉, Twitter의 IT 부서 직원인 척하는 전화 통화였다](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20used%20basic%20techniques%20more%20akin%20to%20those%20of%20a%20traditional%20scam%20artist%3A%20phone%20calls%20where%20they%20pretended%20to%20be%20from%20Twitter%E2%80%99s%20Information%20Technology%20department)."

이것이 바로 **비싱(vishing)** — 음성 [피싱](/ko/glossary/phishing/)입니다. 공격자들은 "[여러 Twitter 직원에게 전화를 걸어 Twitter IT 부서 헬프 데스크에서 연락한다고 주장했으며](https://www.dfs.ny.gov/Twitter_Report#:~:text=called%20several%20Twitter%20employees%20and%20claimed%20to%20be%20calling%20from%20the%20Help%20Desk%20in%20Twitter%E2%80%99s%20IT%20department)", "[해당 직원이 Twitter의 가상 사설망(VPN)에서 겪고 있다고 신고된 문제에 대응하는 중이라고 주장했다](https://www.dfs.ny.gov/Twitter_Report#:~:text=claimed%20they%20were%20responding%20to%20a%20reported%20problem%20the%20employee%20was%20having%20with%20Twitter%E2%80%99s%20Virtual%20Private%20Network)." Twitter 자체도 이를 나중에 "[전화 스피어 피싱 공격](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=phone%20spear%20phishing%20attack)"으로 묘사하며, "[특정 직원들을 오도하고 인간의 취약점을 악용하려는 중대하고 집요한 시도](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=a%20significant%20and%20concerted%20attempt%20to%20mislead%20certain%20employees%20and%20exploit%20human%20vulnerabilities)"에 기반한 것이었다고 밝혔습니다.

설득력의 원천은 기술적 역량이 아닌 사전 조사였습니다. 보안 전문 기자 Brian Krebs가 기록한 바에 따르면, 공격자들은 LinkedIn과 이전 데이터 유출 사고에서 수집한 이름, 직책, 개인 정보 등 프로필 데이터를 활용해 실제 동료처럼 들리게 만들었습니다. 직원이 발신자를 믿는 순간, 그 직원은 자격 증명을 넘겨줬고, 그 자격 증명이 핵심 자산에 이르는 문을 열었습니다. 바로 Twitter의 내부 계정 관리 도구였습니다.

그 도구가 이 사건 전체의 핵심입니다. Krebs는 "[Twitter의 관리자 도구 내에서는 모든 Twitter 사용자의 이메일 주소를 업데이트할 수 있다](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=within%20Twitter%E2%80%99s%20admin%20tools%2C%20apparently%20you%20can%20update%20the%20email%20address%20of%20any%20Twitter%20user)"고 보도했습니다 — 이메일을 변경하고, 비밀번호 재설정을 트리거하면, 배지까지 포함한 계정이 통째로 넘어옵니다. DFS 보고서는 직원 한 명이 뚫린 것이 왜 그토록 치명적이었는지를 구조적 실패에서 찾습니다. "[Twitter는 내부 도구에 대한 접근을 제한하기는 했지만, 여전히 1,000명 이상의 Twitter 직원이 해당 도구에 접근할 수 있었다](https://www.dfs.ny.gov/Twitter_Report#:~:text=Twitter%20did%20limit%20access%20to%20the%20internal%20tools%2C%20but%20over%201%2C000%20Twitter%20employees%20still%20had%20access%20to%20them)." 천여 명의 직원이 플랫폼의 모든 신원에 대한 마스터 키를 쥐고 있었고, 회사에는 이를 관리할 최고정보보안책임자(CISO)가 없었습니다 — Twitter는 "[Twitter 해킹 7개월 전인 2019년 12월부터 최고정보보안책임자(CISO)가 없었다](https://www.dfs.ny.gov/Twitter_Report#:~:text=had%20not%20had%20a%20chief%20information%20security%20officer%20(%E2%80%9CCISO%E2%80%9D)%20since%20December%202019%2C%20seven%20months%20before%20the%20Twitter%20Hack)."

이 모든 일 아래에는 [마켓플레이스](/ko/glossary/marketplace/)가 있었습니다. 유명인 사기가 시작되기 전, 이 일당은 짧은 "OG" 핸들을 조용히 판매하고 있었습니다. Krebs는 Obama/Biden/Musk/Gates 대상 공격 이전에 "[여러 개의 탐나는 단문자 Twitter 계정 이름들이 거래됐다](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=several%20highly%20desirable%20short%2Dcharacter%20Twitter%20account%20names%20changed%20hands)"고 보도했습니다. 그들 커뮤니티에서 "[짧은 프로필 이름은 지위와 부의 척도가 되며](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=short%2Dcharacter%20profile%20names%20confer%20a%20measure%20of%20status%20and%20wealth)", "[재판매 시 수천 달러를 받을 수 있기](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=can%20often%20fetch%20thousands%20of%20dollars%20when%20resold)" 때문입니다. 희소성 있는 이름을 훔쳐 포럼에서 전매하는 이 패턴은 도메인 투자자라면 즉시 알아볼 것입니다.

## 사건의 여파와 체포

해체는 해킹만큼이나 빠르게 이루어졌습니다. 2주 이내에 검사들이 움직였습니다. Krebs는 기소 내용을 보도했습니다. "[영국 Bognor Regis 출신 19세 Mason 'Chaewon' Sheppard가 전신 사기 공모, 자금 세탁 및 컴퓨터 무단 접근 혐의로 캘리포니아에서 기소됐다](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Mason%20%E2%80%9CChaewon%E2%80%9D%20Sheppard%2C%20a%2019%2Dyear%2Dold%20from%20Bognor%20Regis%2C%20U.K.%2C%20also%20was%20charged%20in%20California%20with%20conspiracy%20to%20commit%20wire%20fraud%2C%20money%20laundering%20and%20unauthorized%20access%20to%20a%20computer)", 그리고 "[플로리다주 올랜도 출신 22세 Nima 'Rolex' Fazeli는 보호된 컴퓨터에 대한 고의적 접근 방조 혐의로 북부 캘리포니아에서 형사 고소됐다](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Nima%20%E2%80%9CRolex%E2%80%9D%20Fazeli%2C%20a%2022%2Dyear%2Dold%20from%20Orlando%2C%20Fla.%2C%20was%20charged%20in%20a%20criminal%20complaint%20in%20Northern%20California%20with%20aiding%20and%20abetting%20intentional%20access%20to%20a%20protected%20computer)."

그런데 주모자로 지목된 인물은 더 어렸습니다. "[플로리다주 Tampa 출신 17세 Graham Clark이 7월 15일 Twitter 해킹 관련 기소자 중 한 명이었다](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=17%2Dyear%2Dold%20Graham%20Clark%20of%20Tampa%2C%20Fla.%20was%20among%20those%20charged%20in%20the%20July%2015%20Twitter%20hack)." 미성년자였기 때문에 연방 법원이 아닌 플로리다주 검사에 의해 기소됐습니다. 그는 "[조직 사기, 통신 사기 등을 포함한 30건의 중범죄 혐의를 받았다](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=was%20hit%20with%2030%20felony%20charges%2C%20including%20organized%20fraud%2C%20communications%20fraud)."

다음 해 3월, Clark은 합의에 응했습니다. CyberScoop은 그가 "[다수의 공인 Twitter 계정을 탈취해 $117,000 이상을 훔친 계획의 주동자임을 인정했다](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/#:~:text=admitted%20to%20being%20behind%20a%20scheme%20that%20saw%20him%20steal%20more%20than%20%24117%2C000%20by%20taking%20over%20the%20Twitter%20accounts%20of%20numerous%20public%20figures)"고 보도했습니다. 공영 라디오 방송국 WUSF는 선고 결과를 보도했습니다. "[소년원 3년, 이후 집행 유예 3년](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=three%20years%20in%20a%20juvenile%20facility%20to%20be%20followed%20by%20three%20years%20of%20probation)"으로, 이는 "[주의 청소년 범죄자법상 허용되는 최대 형량](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=the%20maximum%20allowed%20under%20the%20state%E2%80%99s%20youthful%20offender%20law)"이었습니다.

네 번째 인물은 이후에 수면 위로 올라왔습니다. Wikipedia에 따르면 "[2023년 4월, 온라인 핸들 PlugwalkJoe를 사용하는 영국 국적의 23세 Joseph James O'Connor가 스페인에서 뉴욕으로 송환되어 혐의에 직면했다](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=In%20April%202023%2C%2023%2Dyear%2Dold%20Joseph%20James%20O%E2%80%99Connor%2C%20a%20British%20citizen%20with%20the%20online%20handle%20PlugwalkJoe%2C%20was%20extradited%20from%20Spain)", 이후 연방 교도소 5년 형을 선고받았습니다.

## 온라인 신원 통제에 관해 이 사건이 가르치는 것

유명인 이름과 암호화폐를 걷어내면, 2020년 Twitter 해킹은 신원을 *보유하는 것*과 신원을 *통제하는 것* 사이의 차이를 가르치는 순수한 교훈입니다. 이 사건에서 몇 가지 원칙이 도출됩니다.

1. **신뢰는 이름에 축적되고, 통제는 백오피스에 있습니다.** 수억 명이 `@BarackObama`를 신뢰했습니다. 그 신뢰 중 어느 것도 계정을 보호하지 못했습니다. 계정의 통제 접점이 천 명 이상의 직원이 접근할 수 있는 내부 관리 패널에 있었기 때문입니다. 백오피스를 통제하는 자가 신원을 통제합니다. 앞면에 누구의 이름이 적혀 있든 상관없이.

2. **가장 취약한 고리는 거의 암호화가 아닙니다.** 익스플로잇도, 악성 코드도, 백도어도 없었습니다 — 그저 설득력 있는 전화 한 통뿐이었습니다. 신원 시스템은 수학 계층보다 인간과 프로세스 계층에서 훨씬 더 자주 무너집니다. 요청을 받으면 누구든 기꺼이 열어주는 문에 달린 완벽한 자물쇠는 자물쇠가 아닙니다.

3. **단일 완전 통제 지점은 단일 완전 실패 지점입니다.** *모든* 계정의 이메일을 변경할 수 있는 하나의 재사용 가능한 내부 도구는 직원 한 명이 뚫리면 플랫폼 전체가 탈취된다는 것을 의미했습니다. 집중되고, 되돌릴 수 있고, 불투명한 통제가 바로 취약점입니다.

4. **희소한 이름은 표적이 됩니다.** 대통령 계정을 탈취한 동일 일당이 짧은 "OG" 핸들을 수천 달러에 조용히 판매했습니다. 가치 있는 이름은 절도를 끌어당기고, 이름의 가치가 바로 그 통제권을 훔칠 가치를 만드는 것입니다.

5. **복구는 플랫폼의 자비에 의존해서는 안 됩니다.** 신뢰받는 계정들이 거짓말을 하기 시작했을 때, Twitter가 쓸 수 있는 유일한 수단은 그것들을 동결하는 것이었습니다. 신원 소유자들은 "이것이 정말 나"임을 증명하거나 통제권을 되찾을 독립적인 방법이 없었습니다 — 그들은 중앙화된 운영자의 내부 도구와 선의에 전적으로 의존했습니다.

## Namefi의 시각

![온라인 신원의 검증 가능하고 변조 방지된 소유권을 나타내는 컬러 일러스트 — 녹색 방패, 녹색 Namefi 토큰, 그리고 지속성으로 보호됨](../../assets/the-2020-twitter-bitcoin-account-takeover-03-namefi-angle.jpg)

도메인 이름은 Twitter의 인증 핸들이 가졌던 것과 정확히 동일한 신뢰-대-통제 간극을 지닌 온라인 신원입니다 — 그리고 종종 동일한 종류의 불투명한 백오피스도 가지고 있습니다. 대부분의 도메인에서 "소유권"은 비밀번호와 고객 지원 팀이 지키는 레지스트라 계정 안에 있습니다. 설득력 있는 전화 한 통, 소셜 엔지니어링된 지원 담당자, 내부 패널을 통해 밀어붙인 이메일 변경 — 2020년 Twitter 해킹의 수법이 레지스트라 계정 탈취에 거의 일대일로 대응됩니다. 세상이 여러분의 도메인에 쏟아온 신뢰는, 그 도메인에 대한 통제가 어떤 말에도 넘어갈 수 있는 헬프 데스크 뒤에 있다면 아무것도 보호해 주지 못합니다.

[Namefi](https://namefi.io)는 이 간극을 좁히기 위해 존재합니다. 핵심 아이디어는 도메인에 대한 통제가 다른 누군가의 관리 도구 내 설정이 아닌, *검증 가능하고 소유자가 보유한* 것이어야 한다는 것입니다. [도메인 소유권](/ko/glossary/domain-ownership/)을 DNS와 호환성을 유지하면서 토큰화된 온체인 자산으로 표현함으로써, Namefi는 "이 이름을 누가 통제하는가?"라는 질문을 지원 담당자의 압박 하에서의 판단이 아닌 암호학적으로 답변 가능하게 만듭니다. 천 명의 직원이 여러분의 이름을 조용히 재할당할 수 있는 단일 내부 패널은 없습니다. 통제의 증명은 소유자와 함께하며, 이전은 즉흥적이지 않고 감사 가능합니다.

2020년 Twitter 해킹이 성공한 이유는 신원과 통제가 조용히 분리되어 있었기 때문입니다 — 이름은 한 가지를 말하고, 숨겨진 관리 도구는 다른 것을 결정했습니다. 이름에 의존하는 모든 사람에게 이 사건이 주는 교훈은, 이름이 지닌 신뢰만큼 통제 역시 명확하고 소유자 중심적으로 만들라는 것입니다. 핸들이든, 배지든, 도메인이든 — 그 뒤에 있는 백오피스만큼만 안전합니다. Namefi의 판단은, 그 백오피스가 누군가 속아 넘어갈 수 있는 전화선이 아니라, 여러분이 통제하는 검증 가능한 원장이어야 한다는 것입니다.

## 출처 및 추가 자료

- 뉴욕 금융감독국 — [Twitter 조사 보고서](https://www.dfs.ny.gov/Twitter_Report)
- Wikipedia — [2020 Twitter 계정 탈취 사건](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking)
- Krebs on Security — [수요일의 대규모 Twitter 해킹 배후는 누구인가?](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/)
- Krebs on Security — [수익과 재미를 위한 Twitter 해킹](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/)
- Krebs on Security — [7월 15일 Twitter 침해 관련 3인 기소](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/)
- CyberScoop — [Twitter 해커, 유죄 인정 후 3년 선고](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/)
- WUSF — [Tampa Twitter 해커, 징역 3년·집행 유예 3년 선고](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation)
- 미국 법무부 — [Twitter 해킹 관련 혐의로 3인 기소](https://www.justice.gov/usao-ndca/pr/three-individuals-charged-alleged-roles-twitter-hack)
- ABC News — [17세에 Twitter 해킹으로 유죄 인정한 플로리다 남성, 3년 선고](https://abcnews.go.com/Politics/florida-man-pleaded-guilty-hacking-twitter-17-year/story?id=76513232)
