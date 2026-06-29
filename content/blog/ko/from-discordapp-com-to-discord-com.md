---
title: 'DiscordApp.com에서 Discord.com으로: "App"을 떼어낸 것이 피싱범들이 애용하던 문을 닫은 방법'
date: '2026-06-17'
language: ko
tags: ['domains', 'branding', 'startups', 'domain-upgrades']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: name-change-game-change
seriesOrder: 12
format: case-study
description: 'Discord는 2015년 Discord.com이 이미 점유된 상태였기 때문에 DiscordApp.com으로 서비스를 시작했습니다. 이후 조용히 짧은 도메인을 매입하고 2020년에 discord.com을 주소로 전환했는데, 이는 브랜드 정리를 위한 결정이기도 했지만, "discordapp.com" 대 "discord.com"이라는 두 도메인 분열이 피싱 및 악성코드 유포자들에게 좋은 먹잇감이 되어왔기 때문이기도 합니다.'
keywords: ['discordapp.com', 'discord.com', '디스코드 도메인', '도메인 업그레이드', 'jason citron', '디스코드 역사', 'cdn.discordapp.com', '디스코드 피싱', '스타트업 네이밍', '브랜드 네이밍', '프리미엄 도메인', '도메인 전략', '도메인 마이그레이션']
relatedArticles:
  - /ko/blog/from-bufferapp-com-to-buffer-com/
  - /ko/blog/from-slackhq-com-to-slack-com/
  - /ko/blog/from-ubercab-com-to-uber-com/
  - /ko/blog/from-massdrop-com-to-drop-com/
  - /ko/blog/from-box-net-to-box-com/
relatedTopics:
  - /ko/topics/domain-investing/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/name-change-game-change/
  - /ko/series/domain-apocalypse/
relatedGlossary:
  - /ko/glossary/registrar/
  - /ko/glossary/dns/
  - /ko/glossary/icann/
  - /ko/glossary/tld/
  - /ko/glossary/web3/
---

Discord가 "서버에 들어오세요"라는 동사처럼 쓰이기 전, 이 서비스는 조금 더 긴 주소에서 살았습니다. 바로 **DiscordApp.com**입니다.

"App"은 브랜딩 선택이 아니었습니다. 차선책이었습니다. Jason Citron과 Stanislav Vishnevskiy가 2015년 5월 음성·채팅 도구를 출시했을 때, [정확히 일치하는 도메인](/ko/glossary/exact-match-domain/)인 Discord.com은 이미 다른 사람이 소유하고 있었습니다. 밀레니엄 전환기에 등록된 도메인이었습니다. 그래서 제품은 수식어를 달고 웹에 공개되었습니다. Wikipedia에 따르면, [Discord는 2015년 5월 discordapp.com이라는 도메인 이름으로 공개 출시되었습니다](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com). 초창기를 다룬 한 글은 이렇게 직접적으로 표현합니다. [Discordapp.com은 Discord 첫 출시 당시의 공식 URL이었습니다](https://www.remote.tools/discord/when-was-discord-made#:~:text=Discordapp.com).

원하는 이름과 실제로 쓸 수 있는 이름 사이의 간극은 스타트업 브랜딩에서 가장 흔한 문제 중 하나입니다. 제품의 이름은 이미 Discord였습니다. 다만 세상은 아직 Discord.com으로는 그 서비스에 접근할 수 없었을 뿐입니다.

13번째 사례가 일반적인 "정확히 일치하는 도메인을 매입하라"는 이야기와 다른 점은, 차선책이 남긴 *이음새*에 있습니다. 5년 동안 Discord는 두 주소를 동시에 운영했습니다. 실제로 쓰던 브랜드(discordapp.com)와 원했던 브랜드(discord.com)가 공존했고, 이 두 도메인의 분열은 피싱범, 사기꾼, 악성코드 유포자들이 먹고 사는 바로 그 종류의 모호함이었습니다. 이 글은 일부는 브랜드 정리를 위한, 일부는 출시 이래 안고 살아온 보안 허점을 닫기 위한 도메인 업그레이드 이야기입니다.

## 2015년: 가질 수 없는 이름이 필요했던 도구

Discord는 대중적 현상으로 시작하지 않았습니다. 특정한 불편함을 해소하기 위한 수단으로 시작했습니다.

Citron은 돈과 실전 경험을 갖고 이 프로젝트에 뛰어들었습니다. 그는 소셜 게이밍 네트워크 OpenFeint를 창업했고, Wikipedia에 기록된 것처럼 [2011년 GREE에 1억 400만 달러에 매각했으며, 그 자금으로 2012년 게임 개발 스튜디오 Hammer & Chisel을 설립했습니다](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=later%20sold%20it%20to%20GREE%20in%202011%20for%20%24104%20million%2C%20which%20he%20used%20to%20found%20Hammer%20%26%20Chisel). 스튜디오의 게임은 성공하지 못했지만, 팀이 레이드 조율을 위해 만든 채팅 도구는 빛을 발했습니다. 해결책이 곧 제품이 된 것입니다.

이름은 일찌감치 결정되었고, 그 이유는 평범했습니다. Wikipedia에 따르면, ["Discord"라는 이름은 "멋있게 들리고 대화와 관련이 있으며", 말하고 쓰고 기억하기 쉽고, 상표와 웹사이트 등록이 가능했기 때문에 선택되었습니다](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=The%20name%20%22Discord%22%20was%20chosen%20because%20it%20%22sounds%20cool%20and%20has%20to%20do%20with%20talking%22). 마지막 구절에 주목하십시오 — *상표와 웹사이트 등록이 가능했다*. "가능했다"는 단어가 조용히 많은 일을 하고 있습니다. 상표는 문제없었습니다. 순수한 [.com](/ko/tld/com/)은 그렇지 않았습니다.

그래서 팀은 수많은 스타트업이 하는 일을 했습니다. 수식어를 붙이고 출시한 것입니다. 브랜드로서의 "Discord"는 주소로서의 "DiscordApp"으로 출시되었습니다. 그리고 그것은 통했습니다. 사용자 기반은 거의 즉시 눈덩이처럼 불어났습니다. Wikipedia에 따르면, [2016년 1월 기준으로 Hammer & Chisel은 Discord가 300만 명에게 사용되었으며 월 100만 명씩 성장하고 있다고 발표했습니다](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=By%20January%202016%2C%20Hammer%20%26%20Chisel%20reported%20Discord%20had%20been%20used%20by%203%20million%20people%2C%20with%20growth%20of%201%20million%20per%20month). 그해 7월에는 1,100만 명, 연말에는 2,500만 명에 달했습니다.

이 성장 곡선이 문제의 핵심입니다. 그 수백만 명 모두가 "discordapp.com"이라는 브랜드를 학습했습니다. 모든 초대 링크, 모든 공유 스크린샷, 모든 북마크가 차선책을 조금씩 더 깊이 각인시켰습니다. 수식어가 오래 따라다닐수록, 제거 비용은 더 높아집니다. 돈이 아니라, 잘못된 단어를 수백 번 입력한 사용자들의 근육 기억으로 치르는 비용입니다.

## Discord.com으로의 전환

Discord는 아무것도 이름을 바꿀 필요가 없었습니다. 제품은 항상 Discord였습니다. 주소만 바꾸면 되었습니다. DiscordApp.com에서 Discord.com으로. 그러기 위해서는 먼저 Discord.com을 *소유*해야 했습니다.

그것은 조용히, 사용하기 수년 전에 이루어졌습니다. 그 도메인은 회사가 존재하기 훨씬 전인 [2000년에 등록되었습니다](https://www.thedomains.com/2020/05/09/discord/#:~:text=registered%20in%202000). 도메인 업계 보도에 따르면, 회사는 [2017년에 Discord.com 도메인을 매입했습니다](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017). 하지만 바로 전환하지는 않았습니다. 한동안 [.com은 처음부터 사용해온 discordapp.com 도메인으로의 리디렉션이었습니다](https://www.thedomains.com/2020/05/09/discord/#:~:text=the%20.com%20was%20a%20redirect%20to%20the%20discordapp.com%20domain%20they%20have%20used%20since%20the%20start). 회사는 더 깔끔한 이름을 소유하고 있었지만, 계속 차선책으로 되돌려 연결했습니다.

실제 전환은 2020년에 이루어졌습니다. 한 도메인 분석 글은, 일부 자료는 매입 시점을 2017년으로 보지만, [유일하게 확실한 사실은 새 도메인으로의 전환이 2020년 5월 4일에 이루어졌다는 것입니다](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020)라고 기술합니다. Discord는 discord.com을 주 도메인으로 만들고, 합리적인 판단으로 [기존 도메인을 유지하기로 결정했습니다](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=they%20decided%20to%20keep%20the%20old%20domain%20up). 기존 링크가 깨지지 않도록 리디렉션으로 남겨둔 것입니다. 소셜 미디어 계정명도 주소를 따라 바뀌었습니다. 회사는 [@discordapp에서 @discord로 소셜 미디어 핸들을 변경했습니다](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=changed%20their%20social%20media%20handles%20from%20%40discordapp%20to%20%40discord%20only).

전환은 외형적인 변화에 그치지 않았습니다. API 자체가 이동하고 있었기 때문에, 봇과 라이브러리 개발자들도 코드를 수정해야 했습니다. 인기 라이브러리 discord.py의 유지관리자들은 [Discord가 discordapp.com에서 discord.com으로 이전하고 있다](https://github.com/Rapptz/discord.py/issues/4063#:~:text=Discord%20is%20moving%20from%20discordapp.com%20to%20discord.com)는 내용의 추적 이슈를 열었고, 강제 전환 시점도 명시했습니다. [2020년 11월 7일까지 Discord 서버 연결에 사용하는 도메인을 변경하지 않으면 해당 라이브러리를 사용하는 클라이언트는 연결할 수 없게 됩니다](https://github.com/Rapptz/discord.py/issues/4063#:~:text=is%20not%20changed%20by%20November%207th%202020%20then%20clients%20using%20the%20library%20will%20be%20unable%20to%20connect). 일반 사용자 대부분이 알아채지 못한 도메인 "업그레이드"가 개발자 생태계에는 마감 기한이었습니다.

## 배경: 두 도메인 분열이 피싱의 선물인 이유

![두 갈래 도로 표지판 그림. 한쪽에는 discord.com, 다른 쪽에는 discordapp.com이 쓰여 있고, Discord 마스코트 Clyde가 둘 사이에서 불안하게 바라보는 가운데 후드를 쓴 피싱범이 갈림길에 숨어 있는, Discord 블러플 색조의 생동감 있는 일러스트](../../assets/from-discordapp-com-to-discord-com-02-phishing-risk.jpg)

이 부분이 13번째 사례를 단순한 브랜딩 이야기 이상으로 만드는 대목입니다.

기업이 수년간 거의 동일한 두 도메인으로 운영되면, 자사 사용자들에게 *둘 다* 정식 도메인으로 받아들이도록 학습시키는 효과가 있습니다. "discordapp.com이 진짜 Discord인가, discord.com인가?" 대부분의 사람들은 자신 있게 말하지 못합니다. 그리고 그 불확실성이 바로 [피싱](/ko/glossary/phishing/)이 자라나는 토양입니다. 사용자들이 두 개의 공식 도메인을 신뢰한다면, 거기서 조금 다르게 생긴 세 번째 도메인도 신뢰할 것입니다. 진짜 서비스가 이미 여러 가지 형태로 존재하기 때문에, 이름의 미세한 변형이 손쉬운 위장이 됩니다.

Discord에게 그 위험은 가상의 이야기가 아니었고, 그 여파는 길게 남아 있습니다. Discord의 콘텐츠 전송 네트워크는 여전히 **cdn.discordapp.com**이라는 옛 이름에 머물고 있습니다. 그 도메인은 신뢰할 수 있는 것처럼 보이기 때문에, 인터넷에서 악성코드를 *보관*하기 좋아하는 장소 중 하나가 되었습니다. 보안 기업 Zscaler는 [공격자가 Discord 채널에 악성 파일을 업로드하고 그 공개 링크를 다른 사람들과 공유하면, Discord 사용자가 아닌 사람도 다운로드할 수 있음](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=An%20attacker%20can%20upload%20a%20malicious%20file%20on%20a%20Discord%20channel%20and%20share%20its%20public%20link%20with%20others)을 문서화했습니다. 더욱이, [Discord에서 전송된 파일은 영구적으로 남아 있어, 공격자가 Discord 내에서 파일을 삭제해도 그 링크를 통해 악성 파일을 여전히 다운로드할 수 있다](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=a%20file%20sent%20from%20Discord%20is%20there%20forever)고 밝혔습니다.

위협 인텔리전스 기업 Intel 471은 *도메인* 자체가 무기가 되는 이유를 설명했습니다. 파일이 업로드되면 [플랫폼에 의해 직접 링크가 생성됩니다](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=a%20direct%20link%20is%20generated%20by%20the%20platform). [공격자는 그 링크를 피싱 이메일, 소셜 미디어, 또는 다른 채널을 통해 배포할 수 있습니다](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=Attackers%20then%20can%20choose%20to%20disseminate%20these%20links%20through%20phishing%20emails%2C%20social%20media%20or%20other%20channels). 링크 형식은 [https://cdn.discordapp.com/attachments/{채널 ID}/{파일 ID}/{파일명}](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=The%20Discord%20URL%20follows%20the%20https%3A%2F%2Fcdn.discordapp.com%2Fattachments)이며, 실제 Discord 도메인에 실제 TLS 인증서를 갖추고 있어, [Discord 도메인이 보안 제어에 의해 차단되지 않는 한, 유해한 콘텐츠를 전달하는 효과적인 방법이 됩니다](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=If%20the%20Discord%20domain%20isn%27t%20disallowed%20by%20security%20controls%2C%20it%27s%20an%20effective%20way%20to%20deliver%20harmful%20content). Malwarebytes의 연구팀도 같은 패턴을 추적하며, [새로운 피싱 캠페인이 페이로드 전달에 Discord를 이용하고 있다](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=New%20phishing%20campaign%20uses%20Discord%20for%20payload%20delivery)고 경고하고, [범죄자들이 Discord의 강력한 CDN 인프라를 악용해 악성코드를 호스팅한다](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=Criminals%20abuse%20Discord%20to%20host%20malware%20because%20of%20its%20robust%20CDN%20infrastructure)고 지적했습니다.

사용자 대면 브랜드를 단일한 표준 출입구인 discord.com으로 통합한다고 CDN 악용이 해결되는 것은 아닙니다. 그러나 브랜딩이 보안을 위해 할 수 있는 한 가지를 해냅니다. "진짜 Discord는 어떻게 생겼는가?"라는 질문에 한 단어로 답할 수 있게 만드는 것입니다. 공식 표기법이 적을수록, 공격자가 숨을 수 있는 위장 수단도 줄어듭니다.

## 당시에는 돈 계산이 달랐다

Discord가 Discord.com을 매입한 것이 당연한 일이었다고 생각하기 쉽습니다. 결국 회사가 자기 이름을 소유하는 것이니까요. 하지만 그 결정들은 사후적으로가 아니라, 안개 속에서 내려졌습니다.

시간표를 살펴봅시다. 팀이 Discord.com을 매입한 것은 2017년이었는데, 그때 Discord는 빠르게 성장하고 있었지만 아직 검증되지 않은 게임 채팅 앱으로, 팬데믹 시대의 편재성과 수십억 달러 가치에서는 수년이나 떨어져 있었습니다. 그러고도 *깔끔한 도메인을 리디렉션으로 놔두며* 2020년 전환까지 약 3년을 더 기다렸습니다. 그 인내가 흥미로운 부분입니다. Discord는 더 나은 주소를 소유하고 있었음에도, 실제로 작동하는 제품을 흔들지 않기 위해 반복적으로 전환을 미루는 선택을 했습니다.

이것이 도메인 업그레이드의 진짜 비용 계산이며, 매입가가 핵심인 경우는 드뭅니다. 어려운 부분은 마이그레이션입니다. 수백만 명이 매일 사용하는 살아있는 서비스를 끊지 않으면서, 앱, API, OAuth 범위, 저장된 비밀번호, 브라우저 권한, 딥 링크, 방대한 서드파티 봇 생태계를 재연결하는 일입니다. Discord는 Discord.com을 매입할 여력이 *사용*할 여력보다 훨씬 먼저 생겼습니다. 2017년 매입은 옵션을 확보한 것이었고, 2020년 전환은 제품이 혼란을 흡수할 만큼 안정되고 2020년 11월 개발자 마감 기한을 강제할 수 있게 되었을 때 그 옵션을 행사한 것이었습니다.

## "App"을 떼어낸 것이 중요했던 이유

![Discord 블러플 색조의 생동감 있는 풀컬러 일러스트. DiscordApp이라는 단어에서 빛나는 -App 접미사가 떨어져 나가며 글자들이 흩어지고, Discord 마스코트 Clyde가 미소 지으며 깔끔한 Discord 워드마크만 남아 있는 장면](../../assets/from-discordapp-com-to-discord-com-01-dropping-app.jpg)

DiscordApp.com과 Discord.com 사이의 거리는 세 글자입니다. 전략적으로는 *앱*과 *장소* 사이의 거리입니다.

**DiscordApp.com**은 소프트웨어를 지칭합니다. 다운로드하는 무언가, 여러 애플리케이션 중 하나. **Discord.com**은 목적지를 지칭합니다. 찾아가는 장소, 소속된 커뮤니티, 사람들이 무의식적으로 쓰는 동사. 하나는 제품을 가리키고, 다른 하나는 그 자체가 *브랜드*입니다. Discord가 게임을 넘어 동호회, 수업, 친구 모임에서도 쓰이는 무언가로 성장하면서, "App"은 회사가 처음 스스로를 설명하던 방식의 유물처럼 느껴지기 시작했습니다.

| 이전 | 이후 |
| --- | --- |
| DiscordApp.com | Discord.com |
| "앱"을 명명 — 다운로드할 수 있는 제품 | 브랜드를 명명 — 장소이자 동사 |
| 차선책 수식어를 포함 | 단어 그 자체만 포함 |
| 사용자가 신뢰해야 할 공식 표기법이 두 개 | 표준 출입구 하나 |
| 피싱범이 모방할 수 있는 이음새를 남김 | "어느 것이 진짜인가?"라는 의문을 해소 |

도메인 업그레이드에서 반복되는 패턴이 있습니다. 초기 이름은 *설명하거나 한정*하고, 훌륭한 이름은 *소유*합니다. "App", "HQ", "Cab", "The"와 같은 수식어는 깔끔한 이름이 점유되어 있을 때 합리적인 진입로입니다. 하지만 회사가 충분히 커져서 수식어 없는 단어 자체가 목적지가 되어야 하는 순간, 그것은 부담이 됩니다. Discord의 경우에는 작은 보안 취약점이기도 했습니다.

## 순서: 먼저 확보하고, 안전할 때 이동하라

여기서의 작전 순서는 천천히 살펴볼 가치가 있습니다. 일반적인 스타트업 조언인 "정확히 일치하는 도메인을 확보하는 즉시 전환하라"를 뒤집기 때문입니다.

Discord는 그러지 않았습니다. 순서는 이랬습니다.

1. **이름을 먼저 결정했습니다** — "Discord"라는 이름은 기억하기 쉽고 상표 등록이 [가능했기 때문에](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=The%20name%20%22Discord%22%20was%20chosen%20because%20it%20%22sounds%20cool%20and%20has%20to%20do%20with%20talking%22) 선택되었습니다. 단순한 .com이 불가능하더라도요.
2. **제품은 수식어를 달고 출시되었습니다** — [discordapp.com](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com)으로 출시되었는데, Discord.com이 2000년부터 다른 사람에게 등록되어 있었기 때문입니다.
3. **정확히 일치하는 도메인을 매입했지만 보류해두었습니다** — Discord는 [2017년](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017)에 Discord.com을 매입하고 대체재가 아닌 [리디렉션](https://www.thedomains.com/2020/05/09/discord/#:~:text=the%20.com%20was%20a%20redirect%20to%20the%20discordapp.com%20domain%20they%20have%20used%20since%20the%20start)으로 운영했습니다.
4. **전환은 제품이 감당할 수 있을 때 이루어졌습니다** — [새 도메인으로의 이전은 2020년 5월 4일에 이루어졌으며](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020), 개발자 강제 전환 기한은 2020년 11월 7일이었습니다.

교훈은 "업그레이드를 미루라"는 것이 아닙니다. 깔끔한 도메인을 소유하는 것과 *거기로 마이그레이션하는 것*은 리스크 프로파일이 서로 다른 두 개의 별개 프로젝트라는 것입니다. Discord는 자산을 일찍, 저렴하게 확보한 다음 이동 시점을 신중하게 선택했습니다. 기존 주소는 리디렉션으로 살려두어 아무것도 끊기지 않도록 했습니다.

## 도메인은 운영 체계의 일부가 되었다

프리미엄 도메인이 중요한 이유는 하나, 화려하지 않은 이유입니다. 반복입니다.

핵심 도메인은 회사가 완전히 통제하지 못하는 곳 어디에나 등장합니다. 초대 링크, OAuth 동의 화면, 이메일 주소, 언론 보도, 브라우저 주소창, 검색 결과, 그리고 누군가가 말로 "내 서버에 들어와"라고 할 때마다. 반복될 때마다 마찰을 더하거나 줄입니다. DiscordApp.com은 모든 사람에게 영원히 세 글자를 더 입력하게 했고, *동시에* 사용자들에게 Discord가 두 가지 공식 표기법으로 존재한다는 것을 조용히 가르쳤습니다. Discord.com은 아무것도 요구하지 않으면서 한 단어로 신뢰 문제에 답합니다.

브랜드 진화도 주소를 강화했습니다. Discord가 2020년 중반 공식적으로 게임 중심에서 벗어나 재포지셔닝했을 때 — 도메인을 이전한 바로 그 해 — 자사 [블로그 포스트](https://discord.com/blog/your-place-to-talk)를 통해 커뮤니티에 이렇게 알렸습니다. [새로운 태그라인과 함께 새 웹사이트를 런칭합니다: 여러분의 대화 공간(Your place to talk)](https://discord.com/blog/your-place-to-talk#:~:text=we%27re%20launching%20a%20new%20website%20with%20a%20new%20tagline%3A%20Your%20place%20to%20talk). 그리고 [우리가 자신을 이야기하던 방식이 세상에 잘못된 신호를 보냈습니다](https://discord.com/blog/your-place-to-talk#:~:text=the%20way%20we%20talked%20about%20ourselves%20sent%20the%20wrong%20signal%20to%20the%20world)라고 인정했습니다. "App"이라는 이름은 [더 환영받고, 더 포용적이며, 더 신뢰할 수 있는](https://discord.com/blog/your-place-to-talk#:~:text=more%20welcoming%2C%20more%20inclusive%2C%20and%20more%20trustworthy) 회사가 되고자 하는 목표보다 좁은 신호를 보냈습니다. "신뢰할 수 있는"이 핵심 단어입니다. 그리고 단일 표준 도메인은 브랜드가 그 신뢰를 획득하는 방법 중 하나입니다.

## 창업자들이 13번째 사례에서 배워야 할 것

쉬운 교훈 — "출시 전에 정확히 일치하는 .com을 확보하라" — 은 틀린 것입니다. Discord는 그럴 수 없었기 때문입니다. 더 유용한 교훈은 수식어, 타이밍, 그리고 보안에 관한 것입니다.

1. **수식어는 좋은 진입로입니다.** "App"은 순수한 단어가 2000년부터 등록된 [등록인](/ko/glossary/registrant/)에게 점유된 상태에서도 Discord가 실제 이름으로 출시할 수 있게 해주었습니다. DiscordApp.com으로 출시한 것은 실패가 아니었습니다. 합리적인 방법으로 출시한 것이었습니다.
2. **깔끔한 도메인을 매입하는 것과 거기로 이전하는 것은 별개의 결정입니다.** Discord는 2017년에 Discord.com을 매입하고 2020년까지 전환하지 않았습니다. 자산 확보는 옵션을 샀고, 옵션 행사는 안전한 순간을 기다릴 수 있었습니다.
3. **글자 수가 아니라 이음새의 수를 세십시오.** 두 도메인을 운영하는 비용은 단순히 세 글자가 더 많다는 것이 아닙니다. 모호함입니다. 공식 표기법이 두 개이면 사용자들에게 유사한 것을 신뢰하도록 가르치고, 그 유사한 것이 피싱범들이 사용하는 것입니다.
4. **하나의 표준 출입구는 보안 기능입니다.** discord.com으로 통합한다고 cdn.discordapp.com의 CDN 악용이 멈추지는 않았지만, "진짜 Discord는 어떻게 생겼는가?"라는 질문에 한 단어로 답하게 되었습니다. 그 명확함은 공격자들이 쉽게 위조할 수 없는 것입니다.

도메인 업그레이드가 Discord를 승리하게 만든 것이 아닙니다. 제품, 타이밍, 팬데믹, 폭발적인 커뮤니티가 훨씬 더 큰 역할을 했습니다. 하지만 discord.com은 브랜드를 더 깔끔하게 입력하고, 더 신뢰하기 쉽고, 더 위조하기 어렵게 만들었습니다. 낯선 사람이 클릭하는 링크로 구축된 플랫폼에서, 그것은 작은 일이 아닙니다.

## Namefi 관점

![검증된 이전 과정을 통해 이동하는 프리미엄 도메인, 초록색 Namefi 토큰, DNS 연속성을 나타내는 다채로운 일러스트](../../assets/from-discordapp-com-to-discord-com-03-namefi-angle.jpg)

Discord의 이야기는 브랜딩 아래에서 보면 *통제와 연속성*의 문제입니다.

전략적 결론은 의심할 여지가 없었습니다. Discord라는 플랫폼이 Discord.com에 위치해야 한다는 것은 당연합니다. 어려운 것은 자산 주변의 모든 작업이었습니다. 20년 전에 등록된 [프리미엄 도메인](/ko/glossary/premium-domain/)을 매입하고, 소유권을 증명하고, 리디렉션으로 안전하게 보관하다가, 마침내 앱, API, OAuth, 저장된 자격 증명, 서드파티 봇 생태계로 구성된 실제 서비스를 아무것도 끊지 않고 — 결정적으로, 전환 과정에서 사칭자들에게 틈을 주지 않으면서 — 마이그레이션하는 일. 마지막 지점이 이 사례 전반을 관통하는 보안의 실입니다. *어느 도메인이 진짜 당신의 것인가*에 대한 모호함은 공격자들이 정확히 노리는 것이기 때문입니다.

[Namefi](https://namefi.io)는 도메인이 인터넷 네이티브 자산처럼 작동해야 한다는 생각을 기반으로 구축되었습니다. 토큰화된 소유권은 DNS와 호환성을 유지하면서 도메인 통제를 더 쉽게 검증하고, 이전하고, 현대 워크플로우에 통합할 수 있게 만들 수 있습니다. 이 과정에서 거래의 느리고 신뢰에 의존하는 부분들, 즉 누가 무엇을 소유하는지 확인하고, 자산을 이동하고, 마이그레이션 과정에서 연속성을 유지하는 것을, 깨끗하고 감사 가능한 거래에 가깝게 만들 수 있습니다. 이름의 소유권이 증명 가능하고 이전 가능하다면, "이것이 진짜 Discord인가?"라는 질문에 회사와 그 링크를 클릭하는 모든 사람이 더 쉽게 답할 수 있게 됩니다.

Discord.com은 Discord가 거대해졌기 때문에 지금 당연해 보입니다. 하지만 교훈은 더 일찍 적용됩니다. 이름이 비즈니스를 짊어질 것이고, 특히 차선책 도메인이 사기꾼들이 파고들 수 있는 이음새를 남길 때, 도메인은 장식이 아닙니다. 그것은 출입구입니다. 그리고 출입구는 하나여야 합니다.

## 출처 및 참고 자료

- Wikipedia — [Discord (소프트웨어)](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com)
- The Domains — [Discord, 이제 Discord.com 사용 — 도메인이 단순 리디렉션이 아니게 되다](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017)
- Domainer — [Discord.com 도메인 매각이 앱을 어떻게 재편했는가](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020)
- GitHub (discord.py) — [Discord 도메인을 discordapp.com에서 discord.com으로 변경 (Issue #4063)](https://github.com/Rapptz/discord.py/issues/4063#:~:text=Discord%20is%20moving%20from%20discordapp.com%20to%20discord.com)
- Discord 블로그 — [여러분의 대화 공간](https://discord.com/blog/your-place-to-talk#:~:text=we%27re%20launching%20a%20new%20website%20with%20a%20new%20tagline%3A%20Your%20place%20to%20talk)
- Zscaler — [Discord CDN: 악성 페이로드 호스팅에 인기 있는 선택](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=An%20attacker%20can%20upload%20a%20malicious%20file%20on%20a%20Discord%20channel%20and%20share%20its%20public%20link%20with%20others)
- Intel 471 — [Discord가 사이버 범죄에 악용되는 방법](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=The%20Discord%20URL%20follows%20the%20https%3A%2F%2Fcdn.discordapp.com%2Fattachments)
- ThreatDown by Malwarebytes — [새로운 피싱 캠페인이 페이로드 전달에 Discord 이용](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=Criminals%20abuse%20Discord%20to%20host%20malware%20because%20of%20its%20robust%20CDN%20infrastructure)
- Remote Tools — [Discord는 언제 만들어졌나?](https://www.remote.tools/discord/when-was-discord-made#:~:text=Discordapp.com)
- Discord 고객지원 — [Discordapp.com이 이제 Discord.com입니다](https://support.discord.com/hc/en-us/articles/360042987951-Discordapp-com-is-now-Discord-com)
