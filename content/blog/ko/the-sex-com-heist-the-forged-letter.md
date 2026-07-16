---
title: 'Sex.com 강탈 사건: 인터넷 역사상 가장 가치 있는 도메인을 훔친 위조 편지'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 21
format: case-study
description: '1995년, Stephen Cohen이라는 사기꾼이 Network Solutions에 단 한 장의 위조 편지를 보내 합법적 소유자 Gary Kremen의 sex.com을 탈취했습니다. 도메인을 되찾기까지 수년간의 법적 다툼 끝에 6,500만 달러의 판결, 멕시코로 도주한 사기꾼, 그리고 도메인을 재산으로 인정한 역사적 판례가 남았습니다.'
keywords: ['sex.com', '도메인 탈취', 'Stephen Cohen', 'Gary Kremen', 'Kremen v. Cohen', 'Network Solutions', '위조 편지', '도메인 하이재킹', 'Sharon Dimmick 편지', '도메인 보안', '도메인 재산권', '6500만 달러 판결', '도메인 이전 사기', 'Domain Mayday']
relatedArticles:
  - /ko/blog/the-panix-com-domain-hijack/
  - /ko/blog/the-12-dollar-minute-someone-owned-google-com/
  - /ko/blog/from-twitter-com-to-x-com/
  - /ko/blog/the-perl-com-domain-theft/
  - /ko/blog/from-mona-co-to-crypto-com/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-investing/
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

1995년, 인터넷에서 가장 가치 있는 주소가 단 한 장의 종이 때문에 주인이 바뀌었습니다.

침입도, 몸값 요구도, 정교한 해킹도 없었습니다. 사기꾼 한 명이 편지를 타이핑하고, 자신의 이름이 아닌 서명을 한 뒤, 버지니아주에 있는 도메인 [등록기관](/ko/glossary/registrar/)으로 팩스를 보냈을 뿐입니다. 등록기관은 그것을 읽고 사실로 믿었으며, **sex.com** — 이후 2억 5천만 달러 규모의 사업이 될 도메인 — 을 아무런 권리도 없는 자에게 넘겨주었습니다. 실제 소유자는 사후에야 이 사실을 알게 되었고, 이후 거의 10년간 도메인을 되찾기 위한 싸움을 벌여야 했습니다.

이것은 역사상 첫 번째 대형 도메인 강탈 사건이며, 모든 도메인 소유자가 반드시 물어봐야 할 질문에 대한 가장 명확한 답이기도 합니다. *내 이름을 누군가가 그냥 가져가는 것을 막아주는 것이 정확히 무엇인가?* 1995년, 그 답은 거의 아무것도 없었습니다.

**Domain Mayday / 域名浩劫** — 온라인에서 이름을 소유한다는 것의 의미를 바꾼 보안 사고들을 심층 탐구합니다. 2화: sex.com을 훔친 위조 편지.

## sex.com의 가치

1994년 초, 기업가 [Gary Kremen — Match.com의 창업자이기도 한](https://en.wikipedia.org/wiki/Sex.com#:~:text=In%20early%201994%2C%20entrepreneur%20Gary%20Kremen%20%28who%20also%20founded%20Match.com) — 은 막 태동한 상업 인터넷을 바라보며 명백한 사실 하나를 간파했습니다. 법원 기록에는 등록 날짜가 정확히 명시되어 있습니다. [Gary Kremen은 1994년 5월 9일 Network Solutions, Inc.에 sex.com을 등록했습니다.](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424) 당시 도메인은 무료였고, 간단한 이메일 한 통으로 등록할 수 있었으며, 그것이 얼마나 가치 있게 될지 이해하는 사람은 거의 없었습니다. 제9 순회 항소법원은 이후 이 사건에 대한 의견서를 이렇게 시작했습니다. ["인터넷에서 섹스요?" 모두들 말했습니다. "그게 돈이 되겠어요."](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)

돈이 됐습니다. 도메인이 탈취된 후, 절도범은 그것을 돈 버는 기계로 만들었습니다. [하루 최대 2,500만 히트를 기록하는 광고 집약 사이트](https://en.wikipedia.org/wiki/Sex.com#:~:text=an%20advertising%2Dheavy%20site%20that%20received%20up%20to%2025%20million%20hits%20a%20day)로 운영되었으며, 클릭 수익 및 기타 광고 수입으로 [월 5만~50만 달러를 벌었다고](https://en.wikipedia.org/wiki/Sex.com#:~:text=making%20%2450%2C000%20to%20%24500%2C000%20per%20month) 알려졌습니다. 일부 추산에 따르면, 탈취된 이 도메인은 [불법 점유 기간 동안 2억 5천만 달러 규모의 사업](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=may%20have%20created%20a%20%24250%2C000%2C000%20business%20during%20the%20years%20he%20had%20illicit%20control%20of%20the%20sex.com%20domain%20name)으로 성장했습니다. 업계 한 관계자의 표현처럼, [어떤 기준으로 보더라도 현재까지 거래된 어떤 도메인보다 가치 있을 수 있는](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=by%20some%20accounts%20could%20be%20worth%20more%20than%20any%20domain%20name%20sold%20to%20date) 이름이었습니다.

그토록 가치 있는 이름이, 1990년대 등록기관의 허술한 보안 뒤에 종이 자물쇠 하나로 잠겨 있었던 셈입니다.

## 절도: 위조 편지 한 장

![봉인된 빨간 밀랍 도장이 찍힌 위조 편지가 잠긴 금고에서 빛나는 황금 도메인 열쇠를 꺼내는 모습을 담은 선명한 컬러 컨셉 아트 일러스트](../../assets/the-sex-com-heist-the-forged-letter-01-the-theft.jpg)

그 자물쇠를 딴 인물은 Stephen Michael Cohen이었으며, 그는 결코 초범이 아니었습니다. 제9 순회 항소법원과 Wikipedia 모두 그가 sex.com에 손을 뻗기 직전까지 교도소에 있었다고 기록합니다. [사기죄로 유죄 판결을 받고 최근 형기를 마친 Stephen M. Cohen](https://en.wikipedia.org/wiki/Kremen_v._Cohen#:~:text=who%20had%20recently%20completed%20a%20prison%20sentence%20after%20being%20convicted%20of%20fraud)이었습니다. 그는 sex.com에서 Kremen이 본 것과 똑같은 것을 보았습니다 — 엄청난 부. 그리고 그것을 빼앗기로 결심했습니다.

그 수법은 모욕적일 만큼 단순했습니다. Cohen은 [Kremen 회사인 Online Classifieds의 존재하지 않는 임원 명의의 가짜 편지로 Network Solutions를 속여 sex.com의 이전 권한을 Cohen에게 넘기도록 했습니다.](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=hoodwinked%20Network%20Solutions%20with%20a%20phony%20letter) 같은 출처는 이를 더욱 간명하게 정리합니다. Cohen은 [위조 서명이 담긴 가짜 이전 편지를 등록기관 Network Solutions에 제출하는 것만으로 Gary Kremen의 도메인 sex.com을 훔쳤습니다.](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=stole%20Gary%20Kremen%27s%20domain%20name%2C%20sex.com%2C%20simply%20by%20submitting%20a%20fake%20transfer%20letter)

[1995년 10월 18일, Network Solutions는 아무런 허가 없이 해당 도메인을 Stephen M. Cohen에게 이전했습니다.](https://en.wikipedia.org/wiki/Sex.com#:~:text=On%20October%2018%2C%201995%2C%20Network%20Solutions%20transferred%2C%20without%20permission%2C%20the%20domain%20to%20Stephen%20M.%20Cohen) Wikipedia의 표현에 따르면, 그는 [전화, 이메일, 위조 편지 등의 거짓 수단을 이용해 오랫동안 해당 도메인을 탈취하려 시도해 온](https://en.wikipedia.org/wiki/Sex.com#:~:text=had%20been%20trying%20to%20gain%20control%20of%20the%20domain%20for%20some%20time%20by%20misrepresentation%2C%20using%20phone%20calls%2C%20e%2Dmails%20and%20forged%20letters) 인물이었습니다. 인터넷에서 가장 가치 있는 이름에 새로운 "소유자"가 생겼고, 진짜 소유자는 그 사실조차 몰랐습니다.

## 위조된 "Dimmick 편지"

![서툰 위조 서명과 어울리지 않는 레터헤드가 찍힌 조잡한 타이프라이터 편지를 확대경으로 들여다보는 모습을 담은 선명한 컬러 컨셉 아트 일러스트. 확대경은 그것이 가짜임을 드러냅니다.](../../assets/the-sex-com-heist-the-forged-letter-02-forged-letter.jpg)

위조 자체를 잠시 짚어볼 필요가 있습니다. 그것은 결코 걸작이 아니었습니다. 조잡한 팩스였습니다.

지방법원 기록에 따르면, [1995년 10월 15일 날짜의 편지에서 Sharon Dimmick은 Online Classified를 대리한다고 칭하며 Stephen Cohen에게 Online Classified가 "sex.com 도메인 이름을 포기하기로 결정했다"고 통보했습니다.](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424) 편지 작성자에게는 해결해야 할 실질적인 문제가 있었습니다. 한 회사가 어떻게 도메인을 "포기"하여 타인이 가져갈 수 있게 만드는가? Cohen의 답변은 항소 의견서에 인용되었습니다. 편지는 이렇게 설명합니다. [저희는 인터넷에 직접 연결되어 있지 않으므로, 저희를 대신하여 인터넷 등록 기관에 저희의 도메인 sex.com을 삭제해 달라고 통보해 주시기를 요청합니다.](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf) 웹사이트를 운영하는 회사가 인터넷에 접속할 방법이 없다고 주장한 것입니다 — 그런데도 Network Solutions은 눈 하나 깜짝하지 않았습니다.

편지에 이름이 적힌 "Sharon Dimmick"은 실존 인물이었지만, 도메인 포기와는 전혀 무관했습니다. The Globe and Mail의 보도에 따르면, Network Solutions는 [1995년 말 Kremen의 룸메이트였던 Sharyn Dimmick이 서명한 것으로 보이는 편지를](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/) 받았습니다. Cohen은 Kremen의 하우스메이트 이름을 빌려 Kremen의 회사를 사칭한 것입니다.

그리고 그는 이름 철자조차 틀렸습니다. 한 사건 요약서는 간결하게 기록합니다. [Cohen은 위조 편지에서 Dimmick의 서명 철자를 잘못 썼습니다.](https://www.studicata.com/case-briefs/case/kremen-v-cohen) 이후 이 사건을 책으로 쓴 기자는 더욱 신랄하게 묘사했습니다. 해당 문서는 [발송자로 지목된 사람이 자신의 이름 철자조차 제대로 쓰지 못했으며, 레터헤드는 마치 문맹인 유치원생이 John Bull 가정용 인쇄기로 만든 것처럼 보였습니다.](https://www.theregister.com/2007/05/31/sex_dot_com_review/)

이 세부 사항이야말로 이 사건을 더욱 쓰라리게 만드는 대목입니다. 인터넷에서 가장 가치 있는 도메인을 지키던 자물쇠는 너무나 허약해서, "작성자"가 자신의 이름 철자도 제대로 못 쓴 위조 문서로 뚫렸습니다 — 그리고 등록기관은 [그것을 액면 그대로 받아들이고 통제권을 넘겨주었습니다.](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)

## 되찾기까지의 긴 싸움

sex.com을 빼앗기는 데는 편지 한 장이면 충분했습니다. 되찾는 데는 수년간의 소송이 필요했고, Kremen은 두 전선에서 동시에 싸워야 했습니다. Cohen을 상대로 한 싸움, 그리고 자신의 도메인을 내준 등록기관을 상대로 한 싸움이었습니다.

Cohen에 대한 증거는 압도적이었고, Cohen 자신도 그것을 알고 있었습니다. 그는 사기꾼답게 응수했습니다 — 더 많은 서류를 조작하는 방식으로요. 그는 [처음부터 도메인을 소유해 왔으며 sex.com에 대한 상표권을 갖고 있었다는 것을 입증하기 위해 문서를 위조했으며,](https://en.wikipedia.org/wiki/Kremen_v._Cohen) 절도를 은폐하기 위한 허구의 역사를 만들어냈습니다. 법원은 속지 않았습니다. James Ware 판사는 이전을 무효로 판결했습니다. [지방법원은 Cohen이 사기를 저질렀다고 판결했으며, 그가 위조 편지를 통해 도메인을 취득했으므로 sex.com에 대한 소유권을 무효로 선언했습니다.](https://en.wikipedia.org/wiki/Kremen_v._Cohen) MoreLaw 판결 기록은 결과를 단순하게 기술합니다 — [원고 승소 판결과 함께 sex.com을 원고에게 반환하라는 명령이 내려졌습니다.](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424) [판사가 sex.com의 진정한 소유자로 판결한](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/) Kremen은 마침내 자신의 이름을 되찾았습니다.

더 어려운 싸움은 Network Solutions를 상대로 한 것이었으며, 이 부분이 다른 모든 사람들에게 중요한 의미를 가집니다. Kremen은 등록기관이 자신의 재산을 *침탈*한 것에 대해 — 그것을 내준 것에 대해 — 책임을 져야 한다고 주장했습니다. Network Solutions는 도메인이 "재산"이 아니라 자신들이 제공하는 서비스일 뿐이라고 반박했고, 하급심은 처음에 이에 동의했습니다. 항소심에서 Kozinski 판사는 이를 뒤집으며 도메인을 재산법의 범주 안에 명확히 위치시켰습니다. [Kremen의 도메인 이름은 캘리포니아 전용 침탈법의 보호를 받습니다.](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf) 그의 비유는 핵심을 찔렀습니다 — 위조 편지로 도메인을 잘못된 사람에게 넘겨주는 것은, [같은 상황에서 누군가의 주식을 타인에게 넘겨준 법인에게 책임을 묻는 것과 다르지 않다](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)고 그는 썼습니다. 이후 사건은 합의로 마무리되었지만, 원칙은 확립되었습니다. 도메인 이름은 소유하고, 잃고, 소송을 제기할 수 있는 재산입니다.

## 6,500만 달러 판결 — 그리고 Cohen의 도주

절도에 부과된 금액은 당시로서는 엄청난 것이었습니다. 법원은 Cohen에게 [일실 이익 배상금 4천만 달러와 징벌적 손해배상금 2,500만 달러](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=the%20sum%20of%20%2440%20million%20in%20compensation%20for%20lost%20profits%20and%20%2425%20million%20in%20punitive%20damages)의 사기 및 위조 책임을 인정했습니다. 제9 순회 항소법원은 이를 [보상적 손해배상 4천만 달러와 징벌적 손해배상 2,500만 달러](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)의 판결로 요약했습니다. The Register는 결말을 간결하게 정리합니다. 이 싸움은 [2001년 4월 Kremen이 도메인을 돌려받고 6,500만 달러를 받는 것으로 마침내 끝났습니다.](https://www.theregister.com/2007/05/31/sex_dot_com_review/)

하지만 실제로 받아내는 것은 또 다른 문제였습니다. Cohen은 지불할 의사가 전혀 없었습니다. 그는 [명령을 무시하고 거액을 해외 계좌로 송금했으며,](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf) 이에 판사는 의견서 표현대로 장갑을 벗어 던졌습니다. 그는 [Cohen을 정의의 도피자로 선언하고, 체포 영장을 발부하며, 미국 연방 보안관을 그에게 파견했습니다.](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf) 그때쯤 Cohen은 이미 사라진 뒤였습니다. [체포 영장이 발부되자 Cohen은 멕시코로 도주했으며,](https://en.wikipedia.org/wiki/Sex.com#:~:text=When%20an%20arrest%20warrant%20was%20issued%2C%20Cohen%20fled%20to%20Mexico) The Globe and Mail이 명명한 것처럼 [미국과 멕시코 경찰에게 쫓기는 인터넷 최초의 도메인 이름 도주자](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)가 되었습니다. 그는 [개인 파산을 선언하고 멕시코로 잠적했다가, 2005년 불법 체류로 멕시코 당국에 의해 추방될 때까지 수년간 체포를 피해 다녔습니다.](https://en.wikipedia.org/wiki/Kremen_v._Cohen)

Kremen은 도메인과 판결을 얻었습니다. 하지만 6,500만 달러 전액을 실제로 받지는 못했습니다. 여기서 얻는 교훈은 냉혹하지만 중요합니다. 종이 위의 판결은 도망칠 의지가 있는 상대에게 그것을 집행할 수 있는 능력만큼만 유효합니다.

## 1990년대 등록기관들은 어떻게 이런 일을 허용했나

이것을 단순히 한 등록기관의 부주의와 한 번의 이상한 사건으로 읽고 싶을 수도 있습니다. 하지만 그렇지 않습니다. 이것은 1995년 [도메인 소유권](/ko/glossary/domain-ownership/)이 실제로 작동하던 방식이 낳은 예측 가능한 결과였습니다.

그 시대에 도메인을 소유한다는 "증명"은 등록기관 데이터베이스의 기록과 관리 연락처였습니다 — 그리고 그것을 변경하는 방법은 *요청*하는 것이었고, 대개 편지나 팩스로 이루어졌습니다. 암호화 서명도, 이중 인증도, 이전이 완료되기 전에 기존 소유자에게 자동으로 통보하는 시스템도 없었습니다. 시스템은 신뢰를 기반으로 운영되었으며, 아무도 단순히 거짓말하지 않을 것이라는 가정 위에 서 있었습니다. Network Solutions는 Cohen의 편지를 받고 [Kremen에게 연락하려는 어떠한 시도도 하지 않았으며,](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/) Wikipedia가 요약한 것처럼 [Cohen의 위조 편지를 액면 그대로 받아들이고, Cohen의 주장에 담긴 오류를 찾거나 Kremen에게 도메인 포기 여부를 확인하려는 어떠한 실사도 하지 않았습니다.](https://en.wikipedia.org/wiki/Kremen_v._Cohen#:~:text=took%20Cohen%27s%20fraudulent%20letter%20at%20face%20value)

여기에는 두 가지 구조적 실패가 중첩되어 있습니다.

- **사칭을 통한 승인.** 등록기관은 *사람*이 아니라 *문서*를 인증했습니다. 적당한 "회사" 명의의 그럴듯한 편지를 만들 수 있는 사람이라면 누구든 도메인을 이동시킬 수 있었습니다. 신원은 그저 의상에 불과했습니다.
- **실제 소유자에 대한 통보 부재.** 이 사건을 원천에서 차단할 수 있었던 단 하나의 통제 수단 — 이전 처리 전에 Kremen에게 "누군가 당신의 도메인을 이전하려 합니다"라고 알리는 것 — 이 단순히 존재하지 않았습니다. 피해자는 가장 마지막에 알게 되었습니다.

이것은 Cohen의 실패가 아닙니다. 세계에서 가장 가치 있는 이름들을 도서관 카드처럼 취급한 시스템의 실패입니다.

## 도메인 소유권에 대한 교훈

sex.com 강탈 사건은 30년 전 일이지만, 그 교훈은 시대를 초월합니다. 도메인 소유권의 근본적인 구조가 생각보다 훨씬 적게 변했기 때문입니다.

1. **당신의 도메인은 재산입니다 — 그리고 재산은 도난당합니다.** *Kremen v. Cohen*의 가장 지속적인 유산은 도메인이 전용 침탈법으로 보호받는 재산이라는 판결입니다. 이는 희소식(당신에게 권리가 있습니다)이자 경고(가치 있고 소유자가 있는 것은 훔칠 가치가 있는 것입니다)입니다.
2. **가장 취약한 고리는 비밀번호가 아니라 이전 절차입니다.** Cohen은 비밀번호를 추측하지 않았습니다. 그는 *행정적* 경로를 공격했습니다 — 이름의 소유자를 바꾸는 인적 프로세스를요. 대부분의 도메인 하이재킹은 여전히 그 틈새를 노립니다. 등록기관 지원, 이전 승인, 연락처 기록 변경이 그것입니다.
3. **서류 신뢰는 보안이 아닙니다.** "공식적으로 보였다"는 이유로 지구에서 가장 가치 있는 도메인이 문 밖으로 나갔습니다. 서명, 레터헤드, 그럴듯한 이야기 — 이 중 어느 것도 실제로 승인된 사람이 누구인지 증명하지 않습니다.
4. **통보와 검증은 협상 불가능한 요소입니다.** 이 강탈 전체를 막을 수 있었던 단 하나의 통제 수단은 조치를 취하기 전에 실제 소유자와 요청을 확인하는 것이었습니다. 당신을 분명히 관여시키지 않고도 당신의 도메인을 이동시킬 수 있는 시스템은, 당신의 도메인을 잃게 만들 수 있는 시스템입니다.
5. **판결은 회복이 아닙니다.** Kremen은 6,500만 달러를 받아냈지만 실제로 회수한 금액은 훨씬 적었습니다. 예방은 언제나 소송을 이깁니다. 도주한 사기꾼이 이미 수익화했고 법원도 찾지 못하는 도메인을 소송으로 되찾을 수는 없기 때문입니다.

## Namefi의 관점

![검증 가능하고 변조 방지된 도메인 소유권을 보여주는 컬러 일러스트 — 녹색 방패와 녹색 Namefi 토큰, DNS 연속성으로 보호되는 도메인 카드](../../assets/the-sex-com-heist-the-forged-letter-03-namefi-angle.jpg)

멕시코 도주와 성인 사이트 수익을 걷어내고 보면, sex.com 강탈 사건은 단 하나의 이야기입니다. 이름의 소유자가 누구인지를 나타내는 변조 방지, 소유자 통제 기록이 존재하지 않았다는 것입니다. 소유권은 사설 데이터베이스 안에 있었고, 철자도 틀린 이름이 서명된 위조 편지로 직원을 속일 수 있는 자라면 누구든 그것을 다시 쓸 수 있었습니다.

[Namefi](https://namefi.io)는 정반대의 전제에서 출발합니다. 도메인이 토큰화되면, 소유권은 *당신*이 통제하는 암호화 키에 고정되며, 모든 이전은 승인되고, 가시적이며, 감사 가능한 [온체인](/ko/glossary/on-chain/) 행위가 됩니다 — 누군가 "액면 그대로 받아들이는" 팩스가 아닙니다. 속여야 할 직원도, 그럴듯한 편지가 실제 소유자보다 우선시되는 행정적 뒷문도, 소유자가 몇 달 후에야 알게 되는 조용한 이전도 없습니다. 통제권은 증명 가능하고, 이전은 소유자가 서명하며, 감사 추적은 설계상 공개되어 있습니다 — 그러면서도 인터넷 나머지가 의존하는 DNS와 완벽하게 호환됩니다.

Cohen의 위조 편지가 통했던 이유는, 그와 sex.com 사이에 있는 유일한 것이 종이 한 장을 믿으려는 타인의 의지였기 때문입니다. 검증 가능하고 변조 방지된 소유권의 핵심은 그런 공격 자체를 시도조차 불가능하게 만드는 것입니다. 서명을 사칭하듯 [개인 키](/ko/glossary/private-key/)를 사칭할 수는 없습니다. 인터넷 최초의 위대한 [도메인 탈취](/ko/blog/the-perl-com-domain-theft/) 사건이 주는 가장 중요한 교훈은, *이 이름의 소유자가 누구인가*는 증명할 수 있는 사실이어야 한다는 것입니다 — 낯선 사람이 꾸며낼 수 있는 이야기가 아니라요.

## 출처 및 추가 자료

- Wikipedia — [Sex.com](https://en.wikipedia.org/wiki/Sex.com)
- Wikipedia — [Kremen v. Cohen](https://en.wikipedia.org/wiki/Kremen_v._Cohen)
- 미국 제9 순회 항소법원 — [Kremen v. Cohen / Online Classifieds v. Network Solutions, 325 F.3d 1035 (전문 PDF)](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)
- MoreLaw — [Gary Kremen v. Stephen Michael Cohen, et al. (사건 기록)](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424)
- CircleID — [Domain Name Theft, Fraud And Regulations](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/)
- The Globe and Mail — [The fugitive, the Cupid and sex.com](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)
- The Register — [Sex.com: read it if you dare (Kieren McCarthy 저서 리뷰)](https://www.theregister.com/2007/05/31/sex_dot_com_review/)
- Studicata — [Kremen v. Cohen — 판례 요약](https://www.studicata.com/case-briefs/case/kremen-v-cohen)
- Kieren McCarthy — [The lowdown on the Sex.com case](https://www.kierenmccarthy.co.uk/2006/12/09/the-lowdown-on-the-sexcom-case/)
- CircleID — [Book Review: Sex.com by Kieren McCarthy](https://circleid.com/posts/book_sex_com_by_kieren_mccarthy)
