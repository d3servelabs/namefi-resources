---
title: 'Bitcoin.org DNS 하이재킹: 비트코인의 공식 홈페이지가 어떻게 "코인 두 배" 사기로 둔갑했는가'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 8
format: case-study
description: '2021년 9월, Bitcoin.org — 익명 운영자 Cobra가 운영해 온 비트코인의 오랜 정보 홈페이지 — 가 DNS 계층에서 하이재킹되어 가짜 "비트코인 두 배" 증정 사기 페이지로 바뀌었습니다. 사이트가 오프라인으로 내려가기 전까지 사기꾼들이 챙긴 금액은 약 1만 7,000달러였습니다. 무슨 일이 있었는지, 어떻게 일어났는지, 그리고 암호화폐 네이티브 사이트조차 DNS에 의존한다는 사실이 무엇을 가르쳐 주는지를 Domain Mayday 시리즈에서 심층 분석합니다.'
keywords: ['bitcoin.org', 'bitcoin.org 해킹', 'dns 하이재킹', '도메인 하이재킹', '비트코인 두 배 사기', '암호화폐 증정 사기', 'cobra bitcoin.org', 'cloudflare dns', 'namecheap', 'dns 보안', '도메인 보안', '네임서버 하이재킹', 'whois 변경 공격']
relatedArticles:
  - /ko/blog/the-curve-finance-dns-hijack/
  - /ko/blog/the-lenovo-com-dns-hijack/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-tokenization/
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

10년이 넘는 세월 동안, "비트코인이 무엇이고 어떻게 안전하게 사용하는가"에 대한 솔직하고 중립적인 답을 원하는 사람이라면 누구나 같은 주소로 향했습니다. **Bitcoin.org**였습니다.

그 사이트는 거래소도 아니었고, 무언가를 판매하지도 않았습니다. 세상에서 가장 적대적이고 신뢰가 필요 없는 화폐가 갖출 수 있는 *공식* 환영 창구에 가장 가까운 곳이었습니다. [2008년 8월 18일에 등록된](https://en.wikipedia.org/wiki/Bitcoin#:~:text=The%20domain%20name%20bitcoin.org%20was%20registered) 이 도메인은 창세기 블록보다도 오래되었으며, 비트코인 백서가 보관되어 있었고, 초보자들이 암호화폐의 첫 번째 원칙을 배우던 곳이었습니다. *나만의 은행이 되어라, 그리고 누구에게도 개인 키를 맡기지 마라.*

그렇기에 **2021년 9월 23일 목요일**에 벌어진 일은 더욱 잔인한 아이러니를 담고 있습니다. 암호화폐 세계에서 가장 많이 반복되는 안전 수칙 — *누군가 코인을 두 배로 불려준다고 하면 사기다* — 가 비트코인의 정문에서 반대로 방송된 것입니다. 몇 시간 동안, "비트코인 두 배" 사기를 경계하라고 가르쳐 온 바로 그 웹사이트가 "비트코인 두 배" 사기 그 자체가 되었습니다. 그것도 누군가 서버에 침투해서가 아니라, **도메인**을 장악했기 때문에 일어난 일이었습니다.

## 비트코인의 상징적이고 신뢰받는 홈

이 하이재킹이 왜 그토록 충격적이었는지 이해하려면, Bitcoin.org가 어떤 의미를 지닌 곳이었는지 먼저 알아야 합니다.

비트코인에는 CEO도 본사도 공식 대변인도 없습니다. 오랜 세월 그 자리를 채워 온 것은 커뮤니티가 운영하는 소수의 참조 사이트들이었고, 그 중에서 Bitcoin.org가 가장 두드러졌습니다. CryptoPotato는 이 사이트를 [BTC와 관련하여 13년 이상 전에 등록된 가장 오래된 웹사이트](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/#:~:text=the%20oldest%20website%20in%20relation%20to)라고 소개했습니다. [지갑](/ko/glossary/wallet/) 추천 정보, 시작 가이드, 사토시 나카모토의 백서 사본이 이곳에 담겨 있었습니다.

비트코인답게도, 이 사이트는 유령이 운영하고 있었습니다. 원칙적으로 익명을 고수하는 **Cobra**라는 가명의 운영자가 관리해 왔습니다. 그 원칙은 얼마 전 법정에서 시험대에 올랐습니다. 불과 몇 달 전, 스스로를 "사토시"라고 주장하는 Craig Wright가 영국 저작권 소송에서 승소하여 Bitcoin.org에 백서 삭제를 명령하는 판결을 이끌어냈고, 판사는 [Cobra가 영국에서 Wright의 저작권을 침해하지 못하도록 금지 명령](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=injunction%20prohibiting%20Cobra%20from%20infringing)을 내렸습니다. 자신의 익명성을 지키려는 Cobra의 항변은 거의 시적이었습니다. [법원 규칙은 내가 가명으로 소송을 당하는 것은 허용했지만, 가명으로 스스로를 변호하는 것은 허용하지 않았다](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=the%20court%20rules%20allowed%20for%20me%20to%20be%20sued%20pseudonymously)는 것입니다.

요컨대 Bitcoin.org는 *신뢰*를 축적한 곳이었습니다. 리더 없는 운동이 원래 가질 수 없는 종류의, 13년에 걸쳐 조용히 쌓인 제도적 신뢰였습니다. 그리고 그 신뢰가 바로 이 사이트를 표적으로 만든 이유였습니다. 사기는 호스트의 신뢰도가 높을수록 효과가 크고, 암호화폐에서 비트코인의 공식 이름보다 신뢰도가 높은 호스트는 거의 없습니다.

여기에는 더욱 날카로운 이중의 아이러니가 있습니다. Bitcoin.org의 모든 철학은 *자기 수탁*이었습니다. 자신의 키를 직접 보관하고, 어떤 보관인도 신뢰하지 말고, 모든 것을 직접 검증하라는 것이었습니다. 그 교훈을 완전히 체득한 방문자라면 낯선 사람의 지갑에 코인을 보내는 일은 절대 없었을 것입니다. 그러나 이 증정 사기는 낯선 사람을 신뢰하라고 요청한 게 아니었습니다. *Bitcoin.org 자체*를 신뢰하라고 요청했습니다. 수년간 안전한 출발점이라고 배워온 바로 그 주소를요. 공격은 그 교훈을 이기지 못했습니다. 단지 교훈을 전달하는 자를 하이재킹했을 뿐입니다.

## 2021년 9월: 하이재킹과 가짜 증정 행사

![신뢰받는 해안 등대 도메인이 하이재킹된 모습을 묘사한 선명한 컨셉 아트. 등대의 불빛이 이제 "코인 두 배"라는 빛나는 가짜 표지판을 수면 위로, 작은 배들을 향해 쏘아 보내고 있다](../../assets/the-bitcoin-org-dns-hijack-01-hijack.jpg)

2021년 9월 23일 오전, Bitcoin.org를 찾은 방문자들은 지갑 가이드를 볼 수 없었습니다. 대신 팝업 모달이 떴습니다. 비트코인의 가장 신뢰받는 참조 사이트 홈페이지 위에 깔끔하고 공식적인 외양으로 덧씌워진 오버레이였습니다.

그 메시지는 암호화폐에서 가장 오래된 사기 수법을, 빌려온 권위로 치장한 것이었습니다. **비트코인 재단**이 [커뮤니티에 보답하고 있다](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=giving%20back%20to%20the%20community)고 주장하며, 혜택은 [선착순 1만 명에게만](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=first%2010%2C000) 적용된다고 했습니다. 그리고 단 하나의 약속을 내걸었습니다. [이 주소로 비트코인을 보내면, 두 배의 금액을 돌려드립니다!](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=Send%20Bitcoin%20to%20this%20address%2C%20and%20we%20will%20send%20double) QR 코드를 통해 마찰 없이 참여할 수 있었습니다. CoinDesk가 이 유형을 건조하게 묘사했듯, 이런 수법의 원리는 언제나 같습니다. [초기 금액을 QR 코드를 통해 지갑 주소로 전송하면 두 배를 돌려준다는 거짓 약속](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=these%20schemes%20give%20false%20promises%20of%20doubling)이고, 결과도 언제나 같습니다. [피해자들은 사실 아무것도 돌려받지 못하고, 보낸 암호화폐만 잃는다](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=Victims%2C%20in%20fact%2C%20receive%20nothing)는 것입니다.

Cobra는 공개적으로, 그리고 단도직입적으로 침해 사실을 인정하며, 사이트가 [침해당했다. 현재 해커들이 어떻게 사기 모달을 사이트에 올렸는지 조사 중이다](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=has%20been%20compromised.%20Currently%20looking%20into%20how%20the%20hackers)라고 게시했습니다.

## 방문자들의 피해

"돈을 두 배로 불려준다"는 사기는 일부 사람들이 믿어줘야만 작동합니다. 무작위 웹사이트라면 거의 아무도 속지 않겠지만, *Bitcoin.org*에서라면 일부는 믿었습니다.

사기 지갑은 비어 있지 않았습니다. BleepingComputer는 [해당 지갑의 마지막 업데이트된 잔액이 0.40571238 BTC, 약 1만 7,000달러](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=0.40571238%20BTC%20or%20approximately%20US%2417%2C000)였다고 보도했습니다. CoinDesk는 현장에서 포착하여 [증정 사기 주소가 기사 작성 시점 기준으로 소액 거래들을 통해 1만 7,700달러 이상을 수령했다](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=received%20over%20%2417%2C700%20in%20small%20transactions)고 전했습니다.

하룻밤 사이에 1만 7,000달러가 사라졌습니다. 그것도 피해를 입은 바로 그 사이트가 예전에 경고해 주었을 사기를 통해서였습니다. 그리고 비트코인 설계의 가장 잔인한 부분을 기억하십시오. 그 거래들은 되돌릴 수 없습니다. 환불도, 사기 신고 부서도, "은행에 전화하기"도 없습니다. 비트코인을 강력하게 만드는 바로 그 불가역성이, QR 코드를 스캔한 순간 각 피해자의 손실을 영구적으로 만들었습니다.

달러 금액은 사실 부차적인 문제입니다. 진짜 피해는 Bitcoin.org가 13년에 걸쳐 쌓아온 것, 즉 *이* 주소만큼은 안전하게 신뢰할 수 있다는 전제였습니다.

## 사건의 경위: 서버 침해가 아닌 DNS 침해

![신호등처럼 빛나는 분기점의 도로 이정표가 조작된 모습을 묘사한 선명한 컨셉 아트. 화살표 하나가 몰래 재도색되어 황금빛 동전 모양의 깔때기 함정을 향하고 있고, 원래의 안전한 경로는 어둠 속에 남겨져 있다](../../assets/the-bitcoin-org-dns-hijack-02-fake-giveaway.jpg)

이것이 단순한 [피싱](/ko/glossary/phishing/) 사건이 아닌 *Domain Mayday* 이야기인 이유가 여기에 있습니다. **공격자들은 Bitcoin.org의 서버에 침투할 필요가 전혀 없었습니다.**

Cobra는 이 점을 단호하게 확인했습니다. 오리진 서버는 손대지 않았으며, [실제 서버에는 해킹 중 트래픽이 하나도 들어오지 않았다](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=my%20actual%20server%20didn%27t%20get%20any%20traffic%20during%20the%20hack)고 했습니다. 대신 공격은 한 계층 위에서, 즉 인터넷에서 도메인 이름이 어디를 가리킬지 결정하는 부분에서 일어났습니다. 사건을 지켜보던 관찰자들은 [해킹 당시 WHOIS 정보가 업데이트되었고, 네임서버와 DNS가 변경되었다](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack)는 사실을 지적했습니다. 네임서버를 장악하면 "bitcoin.org는 어느 서버인가?"라는 질문에 대한 답을 통제할 수 있으며, 신뢰받는 이름이 자신이 소유한 서버를 가리키도록 조용히 바꿀 수 있습니다.

Cobra 스스로의 진단은 [DNS](/ko/glossary/dns/) 계층과 최근의 인프라 변경을 원인으로 지목했습니다. 그의 말을 그대로 옮기면 이렇습니다. [Bitcoin.org는 한 번도 해킹당한 적이 없었습니다. 그런데 Cloudflare로 이전하고 두 달 만에 해킹당했습니다.](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=Bitcoin.org%20hasn%27t%20been%20hacked%2C%20ever.%20And%20then%20we%20move%20to%20Cloudflare) 그의 잠정 결론은 좁고 날카로웠습니다. [공격자들은 단순히 DNS의 어떤 결함을 이용한 것으로 보인다](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20attackers%20just%20seem%20to%20have%20exploited%20some%20flaw%20in%20the%20DNS)는 것이었습니다. Decrypt도 같은 시각으로 정리했습니다. 공격자들이 [웹사이트가 두 달 전 Cloudflare로 이전한 후 DNS 설정의 결함을 악용했다](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/#:~:text=exploited%20a%20flaw%20in%20the%20DNS%20configuration%20after%20the%20website%20moved%20to%20Cloudflare)는 것입니다.

근본 원인이 잘못된 설정인지, [레지스트라](/ko/glossary/registrar/) 수준의 침해인지, 아니면 DNS 공급자 측의 문제인지는 공개적으로 완전히 밝혀지지 않았습니다. CoinDesk는 [웹사이트 하이재킹의 근본 원인은 확인되지 않았으며, 일각에서는 DNS 하이재킹으로 의심하고 있다](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=root%20cause%20of%20the%20website%20hijack%20remains%20unconfirmed)고 전했습니다. 그러나 사건의 *형태*는 분명합니다. 애플리케이션은 멀쩡했습니다. 코드도 멀쩡했습니다. 키도 멀쩡했습니다. **이름**이 하이재킹된 것이고, 웹에서 이름을 장악하는 것은 싸움의 거의 전부나 다름없습니다.

## 대응과 사후 처리

해결책도, 예상대로, 도메인 계층에서 이루어졌습니다.

사이트는 단순히 "패치"로 빠져나올 수 없었습니다. Bitcoin.org의 실시간 악성 버전이 Bitcoin.org의 실제 인프라에서 제공되고 있지 않았기 때문입니다. 피해를 멈추는 가장 빠른 방법은 도메인 자체를 서비스에서 내리는 것이었습니다. 레지스트라인 **Namecheap**이 정확히 그렇게 했습니다. BleepingComputer에 따르면, [임시로 도메인을 비활성화했다](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=We%20have%20temporarily%20disabled%20the%20domain)는 것입니다. 한동안 방문자들은 사기 페이지도, 홈페이지도 볼 수 없었습니다. CoinDesk는 ["이 사이트에 연결할 수 없습니다."라는 메시지를 보게 되었다](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=This%20site%20can%27t%20be%20reached)고 보도했습니다. 비트코인에서 가장 신뢰받는 참조 페이지가 암흑 속으로 사라진 것입니다.

몇 시간간의 조사 후, 도메인은 올바른 서버로 재연결되었고 사이트는 해킹 이전 상태로 복원되었습니다. 사건의 창은 짧았습니다. 하루가 채 되지 않았고, 순수 달러 기준으로 절도 금액도 암호화폐 범죄 기준으로는 소규모였습니다. 그러나 사건은 *어떤* 사이트였는지 때문에 강하게 충격을 남겼습니다. "믿지 말고, 검증하라"는 자부심을 가진 운동이, 자신들의 표준 "신뢰하세요" 페이지가 사용자들에게 검증 가능한 방식으로 무기화되는 것을 직접 목격했기 때문입니다.

## 암호화폐 네이티브 사이트조차 DNS에 의존한다는 교훈

![빛나는 황금 동전 사기 깔때기를 묘사한 선명한 컨셉 아트. 신뢰할 수 있어 보이는 넓은 입구로 밝은 동전들이 쏟아져 들어가 좁은 바닥의 어둠 속으로 사라지며, 활기찬 추상적 배경 앞에 놓여 있다](../../assets/the-bitcoin-org-dns-hijack-03-namefi-angle.jpg)

Bitcoin.org 하이재킹에서 가장 불편한 교훈은 **암호화폐 네이티브라는 사실이 그 어떤 것도 보호해 주지 않는다**는 것입니다.

비트코인은 탈중앙화되어 있습니다. 비트코인 원장은 변조하기로 유명할 만큼 어렵습니다. 올바르게 보관된 키는 오직 자신만의 것입니다. 그러나 그 어떤 것도 여기서는 의미가 없었습니다. 그 모든 것의 *정문*이 어느 전자상거래 쇼핑몰이나 동네 베이커리와 다를 바 없는, 똑같은 DNS와 레지스트라와 [네임서버](/ko/glossary/nameserver/) 인프라를 타고 있었기 때문입니다. [블록체인](/ko/glossary/blockchain/)은 손댈 수 없었습니다. 웹사이트도 중요한 의미에서는 손댈 수 없었습니다. 하지만 **그것을 가리키는 이름은 그렇지 않았습니다.**

이 사건에서 몇 가지 지속적인 교훈이 나옵니다.

1. **도메인은 공격 표면의 일부이며, 종종 *가장 큰* 부분입니다.** 완벽한 코드를 작성하고, 콜드 스토리지에 키를 보관하고, 모든 서버를 강화해도, 네임서버나 레지스트라 계정을 장악한 공격자는 여전히 당신을 완벽하게 사칭할 수 있습니다. 이름이 정문이고, 하이재킹된 이름은 낯선 사람이 그 문을 열 수 있게 해줍니다.

2. **DNS/레지스트라 변경은 조용하고 파급력이 큽니다.** [네임서버와 DNS가 변경되었을 때](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=nameservers%20%2B%20DNS%20changed), 대부분의 모니터링이 즉각 포착할 수 있는 방식으로 무언가가 "망가지지는" 않았습니다. 사이트는 여전히 로딩되었고, 단지 잘못된 곳에서 제공될 뿐이었습니다. 레지스트라 잠금, [레지스트리 잠금](/ko/glossary/registry-lock/), [DNSSEC](/ko/glossary/dnssec/), 레지스트라/DNS 공급자 계정의 강력한 접근 통제는 선택적 위생 조치가 아닙니다. 이것들은 모두가 잊어버리는 문의 잠금장치입니다.

3. **실제로 도둑맞는 것은 평판입니다.** 공격자들은 정말로 Bitcoin.org의 1만 7,000달러짜리 서버를 원했던 것이 아닙니다. 그들이 원한 것은 *신뢰도*였습니다. 고대의 사기를 그럴듯하게 만들기 위해 몇 시간 동안 빌려 쓸 신뢰도였습니다. 도메인이 신뢰받을수록, 하이재킹했을 때의 가치가 크고, 어디를 가리킬지를 통제하는 사람에 대해 더 신중해야 합니다.

4. **"신뢰 불필요" 인프라도 신뢰받는 이름 위에 의존합니다.** 심지어 중개자 제거의 표준 사례인 비트코인조차도 사용자들에게는 DNS를 통해 도달합니다. DNS는 계층적이고, 중개화되어 있으며, 변경 가능한 시스템입니다. 화폐를 탈중앙화한다고 해서 정문이 탈중앙화되지는 않습니다.

5. **탐지 속도가 방어의 정교함보다 중요합니다.** Bitcoin.org가 이 사건에서 비교적 적은 피해로 살아남은 것은 커뮤니티가 사기를 빠르게 발견하고 레지스트라가 몇 시간 내에 도메인을 내릴 수 있었기 때문입니다. 하이재킹된 이름이 공격자를 향해 계속 해석될수록 피해와 평판 손상은 커집니다. 이름의 통제 또는 라우팅이 변경되는 *순간*을 아는 것은 어떤 단일 정적 잠금장치보다도 가치 있습니다.

## Namefi의 관점

Bitcoin.org 하이재킹은 그 본질에서 *통제와 검증 가능성*의 문제입니다. 애플리케이션은 건전했습니다. 블록체인도 건전했습니다. 실패한 것은 기만적으로 단순한 질문에 답하는 계층이었습니다. **이 이름을 합법적으로 통제하는 것은 누구이고, 어디를 가리킬 수 있는가?** 그 질문에 대한 답이 조용히 재작성될 수 있을 때 — 네임서버가 교체되고, [해킹 당시 WHOIS 정보가 업데이트될](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack) 때 — 나머지 스택이 아무리 강력해도 신뢰는 증발합니다.

[Namefi](https://namefi.io)는 [도메인 소유권](/ko/glossary/domain-ownership/)과 통제가 가변적인 데이터베이스의 항목처럼 작동하는 것이 아니라, 검증 가능한 [인터넷 네이티브 자산](/ko/glossary/internet-native-asset/)처럼 작동해야 한다는 아이디어에서 출발합니다. 토큰화되고 감사 가능한 소유권은 "이 도메인을 통제하는 것은 누구이고, 그 통제가 방금 변경되었는가?"라는 질문에 [온체인](/ko/glossary/on-chain/)에서 답할 수 있게 합니다. 조용한 네임서버 교체를 가시적이고 책임 있는 이벤트로 전환하면서도, 나머지 웹이 의존하는 DNS와의 호환성을 유지합니다. DNS 자체를 사라지게 하지는 않지만, *이름에 대한 통제*를 눈에 띄지 않게 하이재킹하기 더 어렵고 지속적으로 검증하기 더 쉽게 만듭니다.

Bitcoin.org는 13년간 세상에 위험한 순간은 검증을 멈추고 신뢰하기 시작할 때라는 것을 가르쳤습니다. 2021년 9월의 몇 시간 동안, 그 도메인 자체가 그 교훈을 어렵게 증명했습니다. 다른 모든 이들에게 남겨진 교훈은 들리는 것보다 간단합니다. 당신의 도메인은 인터넷에서 당신의 정체성입니다. 그 뒤에 있는 키를 지키듯 이름을 소중히 지키십시오.

## 출처 및 추가 읽을거리

- BleepingComputer — [Bitcoin.org hackers steal $17,000 in 'double your cash' scam](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/)
- CoinDesk — [Bitcoin.org Website Inaccessible After Being Hacked by Apparent Giveaway Scam](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/)
- Bitcoin.com News — [Hackers Compromise Web Portal Bitcoin.org — DNS Hijack Replaces Site With BTC Doubler Scam](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/)
- Decrypt — [Bitcoin.org Compromised, Fraudulent Crypto Giveaway Advertised](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/)
- Cointelegraph — [Bitcoin.org goes offline after suffering scam attack](https://cointelegraph.com/news/bitcoin-org-goes-offline-after-suffering-scam-attack)
- CryptoPotato — [BitcoinOrg Hacked: Giveaway Scam Promising Users to Double Their BTC](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/)
- NewsBTC — [Bitcoin.org Hacked By Scammers For A Few Minutes. Someone Sent Them 0.4 BTC](https://www.newsbtc.com/news/bitcoin-org-hacked-by-scammers/)
- CoinDesk — [UK Court Orders Bitcoin.org to Remove White Paper Following Craig Wright Lawsuit](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit)
- Wikipedia — [Bitcoin (history of the bitcoin.org domain)](https://en.wikipedia.org/wiki/Bitcoin)
