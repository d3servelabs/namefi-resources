---
title: '2025년 10월 20일 AWS 장애의 이면'
date: '2025-10-23'
language: ko
tags: ['dns', 'aws', 'resilience', 'incident-explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 2
format: case-study
description: 2025년 10월 20일 AWS 장애를 레지스트라/DNS 운영 관점에서 살펴봅니다. DNS의 실제 작동 방식, 이번 장애가 광범위하게 전파된 이유, 그리고 탄력적인 인터넷 팀이 취할 수 있는 대응 방안을 다룹니다.
keywords: ['dns', 'aws 장애', '컨트롤 플레인', 'dynamodb', 'us-east-1', 'dns 캐싱', '클라우드 복원력', '멀티 서명 dns', '인시던트 대응']
relatedArticles:
  - /ko/blog/the-godaddy-multi-year-breach/
  - /ko/blog/the-dyn-dns-mirai-attack/
  - /ko/blog/the-myetherwallet-bgp-dns-attack/
  - /ko/blog/the-fox-it-dns-hijack/
  - /ko/blog/the-dnspionage-campaign/
relatedTopics:
  - /ko/topics/domain-security/
  - /ko/topics/domain-basics/
relatedSeries:
  - /ko/series/domain-apocalypse/
  - /ko/series/name-change-game-change/
relatedGlossary:
  - /ko/glossary/dns/
  - /ko/glossary/icann/
  - /ko/glossary/registrar/
  - /ko/glossary/tld/
  - /ko/glossary/web3/
---

[![](../../assets/dns-is-the-control-plane.png)](../../assets/dns-is-the-control-plane.png)

2025년 10월 20일, 인터넷 일부 구간이 최악의 아침을 맞이했습니다. Amazon Web Services(AWS)는 버지니아 북부 데이터센터 클러스터(US-EAST-1)에서 장애가 발생했다고 보고했습니다. 수 시간 동안 [Vercel](https://downdetector.com/status/vercel/), [Figma](https://downdetector.in/status/figma/), [Venmo](https://downdetector.in/status/venmo/), [Snapchat](https://downdetector.com/status/snapchat/) 등 인기 앱과 사이트 상당수가 느려지거나 접속 불능 상태에 빠졌습니다. 뉴스 매체와 모니터링 서비스에는 수백만 건의 사용자 신고가 접수됐고, 일부 Amazon 서비스도 간헐적으로 불안정해졌습니다.

그러나 Namefi 고객들은 평온한 하루를 보냈습니다. 우연이 아니라, Namefi가 DNS 리졸루션을 지역 장애에도 흔들리지 않도록 만드는 엔지니어링과 운영 체계에 지속적으로 투자해 온 결과였습니다.

Namefi 엔지니어링팀은 이번 사례를 포함해 주요 장애가 발생할 때마다 사후 분석을 진행하고 교훈을 도출합니다. 현재까지 파악된 내용을 공유합니다.

*참고: 이 글을 작성하는 시점에도 사건은 현재진행형입니다. 이 포스트는 수시로 업데이트될 수 있습니다. 오류나 수정이 필요한 내용이 있으면 [namefi.io](http://namefi.io) 개발팀으로 알려 주십시오. 감사합니다.*

## AWS에서 실제로 무슨 일이 일어났는가 — 전문 용어 없이 설명하기

모든 앱과 웹사이트에는 연결 대상 주소를 '조회'하는 수단이 필요합니다. 인터넷의 이 주소록이 바로 DNS, 즉 [도메인 네임 시스템](/ko/glossary/dns/)입니다. 10월 20일, AWS 내부에서 네이밍 문제가 발생하면서 일부 컴퓨터가 핵심 AWS 데이터베이스 서비스를 이름으로 찾지 못하는 상황이 생겼습니다. 주소록이 적시에 올바른 항목을 제공하지 못하면, 시스템 자체가 정상이어도 서로 통신할 수 없습니다.

AWS는 몇 시간 안에 즉각적인 네이밍 문제를 수정했고, 이후 하루 종일 밀린 작업 처리와 시스템 정상화에 집중했습니다. 오후 늦게(태평양 표준시 기준) AWS는 모든 서비스가 정상 운영 중이라고 밝혔으나, 일부 서비스는 복구에 더 오랜 시간이 걸렸습니다.

## 피해를 입은 곳들 — 그리고 오늘날 인터넷에 대해 알 수 있는 것

피해 범위는 넓었고, 일상 사용자에게도 친숙한 서비스들이 포함됐습니다. Snapchat, Reddit 같은 소비자 앱, Zoom, Signal 같은 커뮤니케이션 툴, Fortnite, Roblox 같은 게임 플랫폼이 장애를 보고했습니다. Coinbase, Robinhood 등 금융 서비스도 중단을 겪었으며, 영국에서는 HMRC(세금 포털)와 Lloyds/Halifax/Bank of Scotland 계열 은행 등 대민 서비스 다수가 접속 장애를 겪었습니다. Vodafone, BT의 통신사 고객 앱도 영향을 받았지만, 핵심 네트워크 자체는 정상 유지됐습니다.

Amazon 자체 서비스도 타격을 피하지 못했습니다. Amazon.com, Prime Video, Alexa, Ring 모두 장애를 겪으면서 AWS가 모기업의 소비자 서비스와 얼마나 깊이 연결되어 있는지를 드러냈습니다. Downdetector 같은 실시간 모니터링 서비스에는 전 세계 수백만 건의 사용자 불편 신고가 쏟아졌고, 이는 일상에서 사용하는 앱 얼마나 많은 수가 AWS 위에 올려져 있는지를 실감하게 했습니다. 일부 보도에서는 이 기간 동안 Apple Music 등 엔터테인먼트 앱과 대형 소비재 브랜드의 모바일 앱에도 연쇄 영향이 있었다고 전했습니다.

## 내부 구조

AWS의 타임라인은 US-EAST-1 내 DynamoDB API에 대한 DNS 리졸루션 오류를 지적합니다. 근본 원인은 Network Load Balancer(NLB) 상태를 모니터링하는 내부 EC2 서브시스템의 오작동으로, 이것이 외부적으로는 DynamoDB 엔드포인트에 대한 잘못된 이름 조회로 드러났습니다. AWS는 태평양 시간 오전 2시 24분에 DNS 문제를 완화했고, 오후 3시 1분에 전체 서비스 정상화를 선언했습니다. 밀린 작업 처리는 오후 내내 지속됐습니다. ([Amazon](https://www.aboutamazon.com/news/aws/aws-service-disruptions-outage-update), [Reuters](https://www.reuters.com/business/retail-consumer/amazons-cloud-unit-reports-outage-several-websites-down-2025-10-20/))

독립적인 네트워크 텔레메트리 결과에서는 더 넓은 인터넷 라우팅 이상(예: BGP 사고)이 감지되지 않았습니다. 이는 장애 원인이 공용 인터넷이 아닌 AWS 컨트롤 플레인 내부에 있다는 결론과 일치합니다. ([ThousandEyes](https://www.thousandeyes.com/blog/aws-outage-analysis-october-20-2025))

## 수정 이후에도 '긴 꼬리' 현상이 나타난 이유: 몇 가지 DNS 동작 방식

- **캐싱, 그리고 부정적 캐싱.** 리졸버는 TTL(Time-to-Live)이라는 유효 기간 동안 응답을 저장합니다. 표준에 따라 실패 결과도 캐싱합니다. 장애 기간 중 리졸버가 "찾을 수 없음" 응답을 캐싱했다면, AWS가 원본을 수정한 이후에도 타이머가 만료될 때까지 그 실패 응답을 계속 제공할 수 있습니다. (표준: [RFC 2308](https://datatracker.ietf.org/doc/html/rfc2308), [RFC 9520](https://www.rfc-editor.org/rfc/rfc9520)에서 업데이트됨)
- **컨트롤 플레인 대 데이터 플레인.** 클라우드 플랫폼은 오케스트레이션(컨트롤 플레인)과 정상 상태 서빙(데이터 플레인)을 분리합니다. 이름 조회를 막는 컨트롤 플레인 장애는 정상적인 서빙 경로마저 차단할 수 있습니다. 클라이언트는 여전히 이름으로 엔드포인트를 찾아야 하기 때문입니다. AWS 자체 복원력 가이드도 이 두 플레인을 구분하며, 컨트롤 시스템의 복잡성과 변경 빈도가 더 높다고 명시합니다. ([AWS whitepaper](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/control-planes-and-data-planes.html))
- **지역 집중성.** US-EAST-1에는 전 세계 수많은 기능이 의존하는 구성 요소가 집중되어 있습니다. 이 집중성 때문에 지역 단위의 네이밍 문제가 전 세계적 영향처럼 느껴졌습니다. (배경: [Reuters](https://www.reuters.com/business/retail-consumer/amazons-cloud-unit-reports-outage-several-websites-down-2025-10-20/))

## 중소 인터넷 기업이 얻을 수 있는 교훈

이번 사례는 단순하지만 중요한 원칙을 다시 한번 확인시켜 줍니다. **네이밍 레이어가 곧 안전 레이어입니다.** 사용자를 어디로 보낼지, 다음에 어느 데이터센터를 시도할지, 장애 시 트래픽을 어떻게 전환할지 — 이 모든 결정이 DNS를 통해 이루어집니다. 이 레이어를 독립적이고 이중화된 방식으로 구축하면 복구 속도가 빨라지고 장애 규모가 줄어듭니다.

## DNS가 중요한 이유, 그리고 Namefi의 역할

이번 사건의 교훈은 클라우드가 취약하다는 것이 아닙니다. 단일 네이밍 및 컨트롤 경로에 의존할 때 위험이 집중된다는 것입니다. 현대적인 인터넷 팀은 DNS를 트래픽을 위한 독립적이고 탄력적인 스티어링 레이어로 취급하고, 문제가 생기기 전에 대체 엔드포인트를 미리 준비함으로써 그 위험을 줄입니다. 견고한 DNS가 갖춰지면, 특정 공급자가 장애를 겪는 날에도 애플리케이션은 경로를 재조정하고, 우아하게 기능을 축소하며, 더 빠르게 복구할 수 있습니다.

이 철학이 Namefi가 존재하는 이유입니다. Namefi 플랫폼은 도메인과 DNS 복원력을 하나의 제품으로 제공하며, 모범 사례와 정밀하게 설계된 TTL 및 커뮤니케이션 인터페이스를 통합합니다. 그 결과물은 하위 클라우드가 복구 중이거나 스로틀링을 겪거나 작업 밀림을 처리하는 상황에서도 올바른 라우팅 결정을 내릴 수 있도록 설계된 네이밍 레이어입니다. Namefi를 도입한 팀은 이 구조를 즉시 활용할 수 있을 뿐만 아니라, 장애가 발생하는 영역과 동일한 플레인에 묶이지 않고 이를 관찰·조정할 수 있는 운영 도구도 함께 얻습니다.

10월 20일 같은 사고가 발생했을 때, 바로 그 분리 구조가 지도를 온전하게 유지합니다.

## 출처 및 참고 자료

- Amazon — 공식 인시던트 타임라인 및 복구 절차 (완화 시점 태평양 시간 오전 2시 24분, 전체 서비스 정상화 오후 3시 1분, 복구 중 EC2 스로틀링). ([Amazon](https://www.aboutamazon.com/news/aws/aws-service-disruptions-outage-update))
- Reuters — EC2 내부 NLB 상태 모니터링 서브시스템의 근본 원인, 피해 범위, 수백만 건의 사용자 신고, 밀린 작업 처리. ([Reuters](https://www.reuters.com/business/retail-consumer/amazons-cloud-unit-reports-outage-several-websites-down-2025-10-20/))
- ThousandEyes — US-EAST-1 집중 텔레메트리, DynamoDB에 대한 DNS 분석, 더 넓은 라우팅 이상 부재 확인. ([ThousandEyes](https://www.thousandeyes.com/blog/aws-outage-analysis-october-20-2025))
- The Verge / Tom's Guide — 공개 타임라인, 이번 사건이 사이버 공격이 아닌 DNS/컨트롤 플레인 관련 문제임을 확인, 영향을 받은 플랫폼 사례. ([The Verge](https://www.theverge.com/news/802486/aws-outage-alexa-fortnite-snapchat-offline))
- IETF / Cloudflare Docs — DNS 부정적 캐싱 동작 (RFC 2308, RFC 9520) 및 다중 공급자 권위 네임서버 배포를 위한 멀티 서명 DNSSEC 패턴 (RFC 8901, 운영자 문서). ([RFC Editor](https://www.rfc-editor.org/rfc/rfc8901), [RFC Editor](https://www.rfc-editor.org/rfc/rfc9520))
