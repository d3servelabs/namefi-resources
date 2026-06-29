---
title: '도메인 긴급 사태 EP05: 2024년 Squarespace DeFi 도메인 대규모 탈취 사건'
date: '2026-06-17'
language: ko
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 6
format: case-study
description: '2024년 7월, Google Domains에서 Squarespace로의 레지스트라 이전이 취약한 기본 인증 설정을 대규모 공격 표면으로 탈바꿈시켰습니다. 공격자들은 Compound Finance, Celer Network, Pendle, Unstoppable Domains 등 암호화폐 및 DeFi 프로젝트의 도메인을 탈취하여 지갑 탈취 피싱 사이트로 연결시켰습니다. "원활한" 마이그레이션이 어떻게 수백 개의 잠금 해제된 현관문을 만들어냈는지, 그리고 이것이 레지스트라 보안과 MFA에 대해 무엇을 시사하는지 살펴봅니다.'
keywords: ['squarespace 도메인 탈취', 'google domains 마이그레이션', 'defi dns 탈취', 'compound finance 탈취', 'celer network 탈취', '지갑 탈취', 'inferno drainer', '도메인 보안', '레지스트라 마이그레이션', 'mfa 다중 인증', 'oauth 계정 탈취', 'dns 하이재킹', '암호화폐 피싱']
relatedArticles:
  - /ko/blog/the-curve-finance-dns-hijack/
  - /ko/blog/the-badgerdao-frontend-attack/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-dnspionage-campaign/
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
  - /ko/glossary/web3/
  - /ko/glossary/tld/
---

2024년 7월, 암호화폐 프로젝트의 웹사이트에서 가장 위험한 것은 [스마트 컨트랙트](/ko/glossary/smart-contract/) 버그나 유출된 [개인 키](/ko/glossary/private-key/)가 아니었습니다. 바로 도메인을 소유한 [레지스트라](/ko/glossary/registrar/)였습니다.

그달의 며칠 동안, 브라우저 주소창에 익숙한 주소를 입력한 사용자들은 — 자신이 신뢰하는 [대출 프로토콜](/ko/glossary/lending-protocol/)의 공식 사이트, 수백 번 이용한 브리지의 공식 사이트 — 예상했던 곳에 그대로 도착했습니다. 페이지는 완벽히 정상적으로 보였고, 그 다음 순간 자신의 [지갑](/ko/glossary/wallet/)이 비워지는 것을 목격했습니다. 통상적인 의미에서 해킹된 것은 아무것도 없었습니다. 누군가 비밀번호를 뚫거나 [시드 문구](/ko/glossary/seed-phrase/)를 피싱한 것도 아니었습니다. 공격자들은 단순히 *도메인* 자체의 정문으로 걸어 들어왔을 뿐입니다. 그 정문이, 대부분의 프로젝트가 전혀 인식하지 못한 기업 이전 과정에서 잠금 해제된 채 방치되어 있었기 때문입니다.

이전이란 Google Domains의 Squarespace로의 마이그레이션이었습니다. 잠금 해제된 문은 Squarespace의 인증 기본 설정이었습니다. 그리고 그 결과는 한 연구자의 표현을 빌리자면, 수십억 달러의 자산을 관리하는 암호화폐 및 [DeFi](/ko/glossary/defi/) 프로젝트들을 겨냥한 [DNS](/ko/glossary/dns/) 탈취의 연쇄 파도였습니다.

## 레지스트라 마이그레이션이 대규모 공격 표면을 만든 경위

도메인은 보통 집합체로 인식되지 않습니다. 각각은 단일하고 개인적인 것처럼 느껴집니다 — 나만의 주소, 나만의 제어판, 나만의 DNS 레코드. 그러나 레지스트라는 도메인을 대량으로 보유하고 있으며, 한 레지스트라의 전체 고객 기반이 다른 레지스트라로 이전될 때, 그 기반의 모든 계정은 *동일한* 마이그레이션 로직에 따라, *동일한* 기본값으로, *동시에* 이전됩니다. 해당 로직에 존재하는 취약점은 단발성 버그가 아닙니다. 그것은 전체 집합체의 속성이 됩니다.

바로 이것이 2024년 사건을 개별적으로 불운한 침해들의 연속이 아닌 *대규모* 사건으로 만든 이유입니다.

2023년 6월, [Squarespace는 Google이 자사 레지스트라 서비스 종료를 발표한 후 약 1,000만 개의 도메인 이름을 Google Domains로부터 인수했습니다](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20purchased%20roughly%2010%20million%20domain%20names%20from%20Google%20Domains%20in%20June%202023). 이후 약 1년에 걸쳐, [Squarespace는 이 거래에서 인수한 약 1,000만 개 도메인 이름의 사용자 마이그레이션을 진행해 왔습니다](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=Squarespace%20has%20been%20migrating%20users%20for%20roughly%2010%20million%20domain%20names%20purchased%20in%20the%20transaction). 전환을 원활하게 느끼게 하기 위해, Squarespace는 마이그레이션된 각 도메인과 연결된 사람들을 위해 Google이 보유하고 있던 이메일 주소를 기준으로 계정을 사전 생성했습니다.

원활함이 바로 문제의 핵심이었습니다. 사용자에게 아무것도 요구하지 않는 마이그레이션은 사용자가 아무것도 증명하지 않은 마이그레이션입니다 — 비밀번호도, 신원도, 이메일 제어권도 증명하지 않은 것입니다. 계정은 존재했고, 도메인은 연결되어 있었으며, 도메인과 먼저 나타난 사람 사이에 놓인 유일한 것은 이 마이그레이션된 계정들에 대해 거의 아무것도 묻지 않는 로그인 화면뿐이었습니다.

## 2024년 7월의 탈취 사건들

![이전 트럭에서 쏟아져 나오는 도메인 집 열쇠들의 대규모 이주를 묘사한 선명하고 다채로운 개념 예술 삽화, 그림자 속에서 뻗어 나오는 손들이 일부 열쇠를 낚아채고, 빛나는 웹 주소가 표시된 작은 집들이 줄지어 서 있는 모습](../../assets/the-2024-squarespace-defi-domain-hijacks-01-mass-hijack.jpg)

[공격은 7월 9일에 시작되어](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=The%20attacks%20started%20on%20July%209) 이후 며칠간 계속되었습니다. 결코 은밀한 것이 아니었습니다. BleepingComputer가 보도한 바와 같이, [Squarespace 레지스트라를 사용하는 탈중앙화 금융(DeFi) 암호화폐 도메인을 겨냥한 조직적인 DNS 하이재킹 공격의 파도가 방문자들을 지갑 탈취 도구를 실행하는 피싱 사이트로 리다이렉트시켰습니다](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=A%20wave%20of%20coordinated%20DNS%20hijacking%20attacks%20targets%20decentralized%20finance%20%28DeFi%29%20cryptocurrency%20domains%20using%20the%20Squarespace%20registrar%2C%20redirecting%20visitors%20to%20phishing%20sites%20hosting%20wallet%20drainers).

가장 먼저 주목받은 것은 DeFi 대출 분야의 최대 이름 중 하나였습니다. 사건을 조사한 보안업체 Blockaid는 [이 사이트들을 방문한 사용자들이 연결된 지갑에서 자금을 탈취하도록 설계된 악성 페이지로 리다이렉트되고 있었다](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=Visitors%20to%20these%20sites%20were%20being%20redirected%20to%20malicious%20pages%20designed%20to%20drain%20funds%20from%20connected%20wallets)는 사실을 확인했습니다. 가짜 사이트들은 조잡한 모조품이 아니었습니다. Blockaid에 따르면, [이 가짜 dApp들은 사용자를 속여 지갑을 비우는 트랜잭션에 서명하도록 설계된 Inferno 드레이닝 키트의 최신 버전을 실행하고 있었습니다](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=These%20fake%20dApps%20were%20running%20the%20latest%20iteration%20of%20the%20Inferno%20draining%20kit%2C%20designed%20to%20trick%20users%20into%20signing%20transactions%20that%20would%20empty%20their%20wallets).

확인된 피해자 목록은 생태계의 핵심 명단처럼 읽혔습니다. 탈취된 대상에는 [Celer Network, Compound Finance, Pendle Finance, Unstoppable Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Celer%20Network%2C%20Compound%20Finance%2C%20Pendle%20Finance%2C%20and%20Unstoppable%20Domains)가 포함되었습니다. Compound의 경우 [메인 도메인이 피싱 페이지를 표시하도록 탈취되었습니다](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=its%20main%20domain%20had%20been%20taken%20over%20to%20display%20a%20phishing%20page). Celer는 시도를 포착하고 [신속하게 DNS 레코드를 복구했으며](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=swiftly%20recovered%20its%20DNS%20records), Pendle도 [유사한 문제를 겪으며](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=experienced%20similar%20issues) 사용자들에게 지갑 승인을 취소하도록 경고했습니다.

## 위험에 처한 것들 — 그리고 사용자들이 잃은 것들

도메인 탈취의 잔인함은 사용자들이 믿도록 교육받은 모든 습관을 무력화한다는 것입니다. URL을 확인하세요. 진짜 사이트인지 확인하세요. 자물쇠 아이콘을 확인하세요. 이 모든 조언은 도메인이 여전히 가야 할 곳을 가리키고 있다는 전제에 기반합니다. 공격자가 도메인의 DNS를 제어할 때, URL은 *진짜*입니다 — 프로젝트의 실제 주소이며 — 공격자의 서버로 연결됩니다. 자물쇠는 초록색입니다. 주소창은 정직합니다. 페이지가 함정입니다.

바로 이것이 Inferno와 같은 지갑 탈취 키트가 [DNS 하이재킹](/ko/glossary/dns-hijacking/)과 자연스럽게 결합되는 이유입니다. 탈취 도구는 비밀번호를 훔칠 필요가 없습니다. 피해자가 *지갑을 연결하고 서명*하도록 유도하면 됩니다. 그리고 자신의 대출 프로토콜의 실제 도메인에 도착한 사용자는 트랜잭션을 승인하기 전에 주저할 이유가 없습니다. [피싱](/ko/glossary/phishing/) 사이트는 합법적인 도메인이 수년에 걸쳐 쌓아온 신뢰를 고스란히 물려받습니다.

피해가 얼마나 심각할 수 있었을까요? 피해 규모를 포착하는 숫자는 확인된 도난 건수가 아니라 *노출된* 프로젝트의 수였습니다. Decrypt가 보도한 Blockaid의 분석은 단호했습니다: [약 228개의 DeFi 프로토콜 프론트엔드가 여전히 위험에 처해 있으며](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack#:~:text=roughly%20228%20DeFi%20protocol%20front%20ends%20are%20still%20at%20risk), 그 모두가 동일한 마이그레이션 계정 취약점 뒤에 놓여 있었기 때문입니다. 실제로 발생한 탈취는 표본에 불과했습니다. 공격 표면은 Google에서 Squarespace로의 마이그레이션을 거친 전체 암호화폐 코호트였습니다.

## 어떻게 발생했는가: 마이그레이션의 인증 결함

![새 건물 외부의 긴 우편함 줄을 묘사한 선명하고 다채로운 개념 예술 삽화, 각 우편함 문이 열려 잠금 해제된 채로 있으며, 정당한 소유자가 도착하기 전에 윤곽 없는 인물이 조용히 편지를 집어넣고, 따뜻한 빛과 차가운 빛의 대비](../../assets/the-2024-squarespace-defi-domain-hijacks-02-migration-flaw.jpg)

연구자들이 재구성하고 보니, 메커니즘은 거의 당혹스러울 정도로 단순했습니다 — 바로 그것이 대규모로 위험한 이유였습니다.

두 가지 설계 선택에서 시작합니다. 첫째, Squarespace는 로그인하는 사람이 실제로 계정의 이메일을 제어하고 있는지 확인하지 않았습니다. 연구자들이 설명했듯이, [Squarespace는 비밀번호로 생성된 새 계정에 대한 이메일 인증을 요구하지 않습니다](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts#:~:text=Squarespace%20doesn%27t%20require%20email%20verification%20for%20new%20accounts%20created%20with%20a%20password). 둘째, 마이그레이션된 계정들은 사전 생성되었지만 아직 청구되지 않은 상태였습니다 — 비밀번호가 설정되지 않은 것입니다. 따라서 누군가 올바른 이메일로 접근하면, [계정에 비밀번호가 없기 때문에 시스템이 바로 '새 계정의 비밀번호 생성' 절차로 넘어가 버립니다](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=since%20there%27s%20no%20password%20on%20the%20account%2C%20it%20just%20shoots%20them%20to%20the).

이 둘을 합치면 공격은 저절로 완성됩니다. 마이그레이션된 도메인에 연결된 이메일 주소는 비밀이 아니었습니다 — 관리자 및 [등록자](/ko/glossary/registrant/) 연락처는 종종 공개되거나 추측 가능합니다. 실제 소유자가 로그인하기 전에 알려진 마이그레이션 이메일을 사용하여 단순히 먼저 계정을 등록한 공격자는 도메인 제어권을 가져갔습니다. 이 사건을 해부한 연구자 중 한 명인 MetaMask 수석 제품 매니저 Taylor Monahan은 이 맹점을 정확히 묘사했습니다: [Squarespace는 위협 행위자가 합법적인 이메일 보유자가 직접 계정을 생성하기 전에 최근 마이그레이션된 도메인과 연결된 이메일을 사용하여 계정에 가입할 가능성을 전혀 고려하지 않았습니다](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20never%20accounted%20for%20the%20possibility%20that%20a%20threat%20actor%20might%20sign%20up%20for%20an%20account%20using%20an%20email%20associated%20with%20a%20recently%2Dmigrated%20domain%20before%20the%20legitimate%20email%20holder%20created%20the%20account%20themselves).

사전 연결은 왜 존재했을까요? 편의성 때문이었습니다. 연구자들은 [Squarespace가 Google Domains에서 마이그레이션하는 모든 사용자가 이메일과 비밀번호 대신 소셜 로그인 옵션을 선택할 것이라고 가정했다](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20assumed%20all%20users%20migrating%20from%20Google%20Domains%20would%20select%20the%20social%20login%20options)고 결론지었습니다 — 즉 Google OAuth를 선택할 것이라는 가정이었습니다. The Register에 연구자들이 설명한 바와 같이, 시스템은 [계정이 이미 존재하는지 여부에 관계없이 모든 이메일을 도메인에 사전 연결했는데, 이는 사용자들이 Google로 OAuth를 사용하여 즉시 모든 도메인에 접근할 수 있도록 하기 위한 것으로 보입니다](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/#:~:text=pre%2Dlinking%20all%20emails%20to%20domains%2C%20regardless%20of%20whether%20the%20account%20already%20exists%2C%20likely%20because%20they%20wanted%20users%20to%20be%20able%20to%20OAuth%20with%20Google%20and%20immediately%20have%20access%20to%20all%20their%20domains). 그러나 이메일과 비밀번호 경로는 결코 차단되지 않았고, 그 경로에서는 아무것도 받은 편지함 제어권을 증명하지 않았습니다.

한 가지 가속 요인이 더 있었습니다. 마이그레이션 과정에서, 이를 막았어야 할 보호 장치가 꺼졌습니다: [Squarespace로의 전환 과정에서 계정의 다중 인증이 비활성화되었습니다](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=as%20part%20of%20the%20transition%20to%20Squarespace%2C%20multi%2Dfactor%20authentication%20was%20turned%20off%20on%20accounts). Google Domains에서 신중하게 MFA를 활성화했던 도메인 소유자조차 Squarespace에 도착했을 때는 그 MFA가 제거된 상태였습니다. 뚫어야 할 비밀번호도, 우회해야 할 두 번째 인증 요소도, 가로채야 할 이메일도 없었습니다 — 마이그레이션되었지만 미청구 상태인 계정의 경우, 추측 가능한 이메일 주소를 아는 것이 인증 전부였습니다.

## 대응 및 완화 조치

암호화폐 보안 커뮤니티는 레지스트라보다 빠르게 움직였습니다. [Samczsun, Taylor Monahan, Andrew Mohawk](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=Samczsun%2C%20Taylor%20Monahan%2C%20and%20Andrew%20Mohawk)를 포함한 연구자들이 메커니즘을 공개했고, Blockaid는 여전히 취약한 프론트엔드 목록을 배포하여 프로젝트들이 노출 여부를 확인할 수 있도록 했습니다. 피해를 입은 프로젝트들은 계정 탈환, DNS 레코드 재설정, 악성 사이트에 부여된 토큰 승인을 취소하도록 사용자에게 경고하는 작업에 총력을 기울였습니다.

아직 마이그레이션된 계정에 있는 모든 사람에 대한 즉각적인 복구 조언은 동일했습니다: 공격자보다 먼저 로그인하여 계정을 청구하고, 강력하고 고유한 비밀번호를 설정하고, 무엇보다도 마이그레이션이 조용히 제거한 다중 인증을 다시 활성화하는 것이었습니다. Squarespace는 마이그레이션된 계정과 계정 생성 흐름을 잠그는 작업을 진행했습니다. 그러나 구조적인 교훈은 패치를 오래 살아남았습니다: 마이그레이션 과정에서 공급업체가 비활성화한 보안 제어는, 그 마이그레이션이 지속되는 동안, 존재하지 않는 제어입니다.

## 레지스트라 보안과 MFA에 대한 교훈

Squarespace 탈취 사건은 실제로 한 회사의 잘못된 설정에 관한 이야기가 아닙니다. 도메인 제어권이 실제로 어디에 존재하는지, 그리고 [블록체인](/ko/glossary/blockchain/) 위의 계층이 얼마나 취약한 채로 남아 있는지에 관한 이야기입니다.

2024년 7월을 훨씬 넘어 일반화되는 몇 가지 교훈이 있습니다:

1. **레지스트라 계정이 진정한 신뢰의 근원입니다 — 스마트 컨트랙트가 아닙니다.** 피해를 입은 프로토콜들 중 컨트랙트 버그가 있는 것은 하나도 없었습니다. [온체인](/ko/glossary/on-chain/) 코드는 멀쩡했습니다. 공격자들이 취한 것은 *도메인*이었으며, 도메인은 사용자들이 입력하고, 신뢰하고, 지갑을 연결하는 대상입니다. 프로젝트는 온체인에서는 완벽할 수 있지만 DNS [제어 플레인](/ko/blog/dns-is-the-control-plane/)이 취약하다면 사용자를 공격자에게 넘겨줄 수 있습니다.

2. **MFA는 마이그레이션 후에도 유지될 때만 보호가 됩니다.** 여기서 고통스러운 세부 사항은 MFA가 공격 중에 실패한 것이 아니라 — 마이그레이션 편의를 위해 공격 *전에* 제거되었다는 것입니다. MFA 상태를 한 번 설정하고 잊어버리는 것이 아니라, 모든 계정 이전, 전송, 또는 공급업체 변경 후 재확인해야 할 사항으로 취급하십시오.

3. **"원활함"은 보안의 트레이드오프입니다.** 사용자의 편의를 위해 마이그레이션이 건너뛰는 모든 단계는 신원이 증명되지 않는 단계입니다. 사전 생성된 계정, 자동 연결된 이메일, 인증 없는 로그인은 모두 사용자가 느끼지 못한 마찰입니다 — 그리고 마찰은 매우 자주, 공격자를 막아온 바로 그것입니다.

4. **추측 가능한 식별자는 위장한 자격 증명입니다.** 이 도메인들의 잠금을 해제한 "비밀"은 결코 비밀이 아니었던 이메일 주소였습니다. 공개 식별자를 알면 제어권을 부여하는 모든 시스템은 사칭 한 번으로 침해될 수 있습니다.

5. **레지스트라의 피해 반경은 전체 고객 기반과 같습니다.** 레지스트라의 기본 동작이 취약하다면 개별 도메인 보안은 의미가 없습니다. 기본값이 모든 사람에게 동시에 적용되기 때문입니다. 도메인이 어디에 있는지, 그 관리자가 인증을 어떻게 처리하는지는 온체인에서 내리는 어떤 결정만큼이나 중요한 보안 결정입니다.

## Namefi의 관점

![검증 가능하고 변조 방지된 도메인 소유권을 보여주는 다채로운 삽화 — 초록색 방패, 초록색 Namefi 토큰, DNS 연속성으로 보호된 도메인 카드](../../assets/the-2024-squarespace-defi-domain-hijacks-03-namefi-angle.jpg)

2024년 탈취 사건은 "이 도메인을 실제로 소유한 사람"과 "그것을 제어하는 계정에 로그인할 수 있는 사람" 사이의 간극에서 발생했습니다. 전통적인 모델에서 이 두 가지는 느슨하게만 연결되어 있습니다: 소유권은 레지스트라 데이터베이스의 레코드이고, 접근 권한은 해당 레지스트라가 그 주에 우연히 시행하는 인증에 의해 제어됩니다 — 1,000만 개 도메인 마이그레이션 도중 잠깐 동안 문이 활짝 열려 있었던 것을 포함해서.

[Namefi](https://namefi.io)는 그 간극을 닫기 위해 구축되었습니다. [도메인 소유권](/ko/glossary/domain-ownership/)을 DNS와 호환성을 유지하면서 토큰화된 온체인 자산으로 표현함으로써, 제어권은 추측 가능한 이메일과 공급업체의 로그인 기본값에 의존하는 것이 아니라 *암호학적으로 검증*할 수 있는 것이 됩니다. 소유권은 본인이 제어하는 지갑에 존재하고, 이전은 감사 가능하며, "이 도메인의 레코드를 변경할 수 있는 사람은 누구인가"라는 질문에 고객 지원의 답변이 아닌 변조 방지된 답변이 주어집니다.

이것이 Squarespace의 마이그레이션을 완벽하게 만들지는 않았을 것입니다. 그러나 실패 방식을 바꿉니다. 알려진 이메일로 계정을 등록한 공격자는 그로 인해 [토큰화된 도메인](/ko/blog/what-are-tokenized-domains/)을 소유하지 않습니다 — 소유권은 반쯤 초기화된 계정이 조용히 청구할 수 있는 행이 아닙니다. 이름의 제어 플레인은 그것이 보호하는 자산만큼 스푸핑하기 어려워야 합니다. 2024년 7월, 수백 개의 암호화폐 프로젝트에서 그렇지 않았습니다. 그 간극이 바로 엔지니어링으로 해소할 가치가 있는 것입니다.

## 출처 및 추가 자료

- Krebs on Security — [Researchers: Weak Security Defaults Enabled Squarespace Domains Hijacks](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/)
- BleepingComputer — [DNS hijacks target crypto platforms registered with Squarespace](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/)
- Blockaid — [Squarespace Domain Hijacking Incident: Attack Report](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident)
- SecurityWeek — [Hackers Exploit Flaw in Squarespace Migration to Hijack Domains](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/)
- Decrypt — [More Than 220 DeFi Protocols Still 'at Risk' From Squarespace DNS Hijack](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack)
- The Register — [Infoseccers claim Squarespace migration linked to DNS hijackings at Web3 firms](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/)
- Socket — [Squarespace Domain Hijacks Enabled by Email Address Exploit on Migrated Accounts](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts)
- SiliconANGLE — [Multiple crypto domains hijacked from Squarespace due to Google Domains migration flaw](https://siliconangle.com/2024/07/15/multiple-crypto-domains-hijacked-squarespace-due-google-domains-migration-flaw/)
- Cybernews — [Squarespace crypto domains under DNS attack, lack of MFA to blame](https://cybernews.com/security/squarespace-dns-hijack-attack-crypto-domains-mfa/)
- Hackread — [DeFi Hack Alert: Squarespace Domains Vulnerable to DNS Hijacking](https://hackread.com/defi-hack-alert-squarespace-domains-dns-hijacking/)
- CircleID — [Security Lapses Lead to Squarespace Domain Hijacks](https://circleid.com/posts/20240716-security-lapses-lead-to-squarespace-domain-hijacks)
