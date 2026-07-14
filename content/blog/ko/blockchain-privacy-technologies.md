---
title: "주요 블록체인 프라이버시 기술: 영지식 증명, FHE, MPC, TEE, 링 서명"
date: '2026-07-02'
language: ko
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 50
format: roundup
description: 영지식 증명, FHE, MPC, TEE, 링 서명 등 다섯 가지 주요 블록체인 프라이버시 기술을 쉬운 말로 설명하고 나란히 비교합니다.
ogImage: ../../assets/blockchain-privacy-technologies-og.jpg
keywords: ['블록체인 프라이버시', '영지식 증명', 'ZKP', '완전 동형 암호화', 'FHE', '안전한 다자간 연산', 'MPC', '신뢰 실행 환경', 'TEE', '링 서명', '스텔스 주소', 'Monero', 'Zcash', 'zkSync', 'Starknet', '프라이버시 기술', '기밀 컴퓨팅', '온체인 프라이버시', '블록체인 암호학', '프라이버시 코인']
relatedArticles:
  - /ko/blog/blockchain-cryptographic-primitives/
  - /ko/blog/blockchain-scaling-approaches/
  - /ko/blog/blockchain-virtual-machines/
  - /ko/blog/blockchain-consensus-mechanisms/
  - /ko/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /ko/glossary/zero-knowledge-proof/
  - /ko/glossary/fully-homomorphic-encryption/
  - /ko/glossary/secure-multiparty-computation/
  - /ko/glossary/trusted-execution-environment/
  - /ko/glossary/cryptographic-security/
relatedTopics:
  - /ko/topics/web3-foundations/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/tokenize-your-com/
  - /ko/series/domain-flipping-skills/
---

공개 [블록체인](/ko/glossary/blockchain/)의 모든 거래는 기본적으로 누구나 볼 수 있습니다. 잔액, 전송 금액, 거래 상대방이 공개 원장에 영원히 남습니다. 이런 투명성은 블록체인의 신뢰 보장을 가능하게 하지만 동시에 부담이기도 합니다. 어떤 은행도 고객 잔액을 공개하지 않으며, 어떤 기업도 공급업체 대금이나 급여 지급 내역을 경쟁사가 읽을 수 있기를 바라지 않습니다.

블록체인 프라이버시 기술은 체인을 유용하게 만드는 검증 가능성, 탈중앙화, 신뢰할 중개자 없이 낯선 사람끼리 거래하는 능력을 포기하지 않으면서 이 간극을 메우기 위해 존재합니다. 현재는 다섯 가지 기법이 주류를 이룹니다. [영지식 증명](/ko/glossary/zero-knowledge-proof/), [완전 동형 암호화](/ko/glossary/fully-homomorphic-encryption/)(FHE), [안전한 다자간 연산](/ko/glossary/secure-multiparty-computation/)(MPC), [신뢰 실행 환경](/ko/glossary/trusted-execution-environment/)(TEE), 그리고 스텔스 주소와 함께 사용하는 링 서명입니다. 각 기술은 문제의 서로 다른 부분을 숨기고, 서로 다른 가정을 신뢰하며, 서로 다른 수준의 연산 비용을 요구합니다. 이 가이드에서는 다섯 가지를 모두 살펴보고 나란히 비교하며, [Web3](/ko/glossary/web3/)를 구축하거나 단순히 배우는 사람에게도 이 선택이 중요한 이유를 설명합니다.

---

## 영지식 증명

![증명자가 문서를 등 뒤에 잠근 채 검증자에게 빛나는 유효 증명 배지를 건네며, 영지식 증명이 원래 명제를 공개하지 않고도 상대를 납득시키는 방식을 보여 주는 모습](../../assets/blockchain-privacy-technologies-01-zero-knowledge.jpg)

[영지식 증명](/ko/glossary/zero-knowledge-proof/)(ZKP)을 사용하면 한 주체인 *증명자*가 다른 주체인 *검증자*에게 어떤 명제가 참임을 그 명제에 관한 다른 정보를 공개하지 않고 확신시킬 수 있습니다. Ethereum 개발자 문서는 이를 명확하게 설명합니다. “영지식 증명은 명제 자체를 공개하지 않고 명제의 유효성을 증명하는 방법”이며, 여기서 “‘증명자’는 주장을 증명하려는 주체이고 ‘검증자’는 그 주장을 검증하는 주체”입니다([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/#:~:text=A%20zero%2Dknowledge%20proof%20is,without%20revealing%20the%20statement%20itself)).

진정한 영지식 프로토콜로 인정받으려면 증명 시스템은 세 가지 속성을 만족해야 합니다. 완전성은 “입력이 유효하면 영지식 프로토콜이 항상 ‘참’을 반환”한다는 뜻이고, 건전성은 “입력이 유효하지 않으면 영지식 프로토콜이 ‘참’을 반환하도록 속이는 것이 이론적으로 불가능”하다는 뜻입니다. 영지식성은 “검증자가 명제의 참 또는 거짓 여부 외에는 그 명제에 관해 아무것도 알지 못한다”는 의미입니다([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)). 구체적으로 증명은 증명자가 알고 있는 비밀인 증인(witness), 검증자가 제시하는 질문인 챌린지, 그리고 검증자가 증인 자체를 보지 않고도 증명자의 지식을 확인하게 하는 응답으로 구성됩니다.

**숨기는 것:** 기초 데이터 또는 연산입니다. 주장 하나가 참이라는 증명만 공개됩니다.

**현재 사용 방식:** ZK 롤업은 블록체인 확장에서 ZKP가 가장 대규모로 실사용되는 사례입니다. 거래를 “오프체인에서 실행되는 배치로 묶은 뒤(또는 ‘롤업한 뒤’)” 하나의 유효성 증명을 생성하고, Ethereum은 배치의 상태 변경을 최종 확정하기 전에 이를 검증합니다([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20bundle%20)). Matter Labs가 만든 zkSync Era는 “자체 zkEVM으로 구동되는 EVM 호환 ZK 롤업”입니다([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)). StarkWare가 만든 Starknet은 EVM 대신 자체 Cairo VM을 실행하는 유효성 롤업입니다. Solidity 컨트랙트는 별도로 브리지됩니다. L2BEAT는 두 프로젝트를 옵티미스틱 롤업의 사기 증명 챌린지 기간이 아니라 유효성 증명으로 보호되는 롤업으로 분류합니다([l2beat.com](https://l2beat.com/scaling/summary)). 프라이버시 측면에서는 [Zcash](https://z.cash/technology/)가 보호 거래에 zk-SNARK(Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge)를 선구적으로 도입했습니다. 네트워크가 거래의 유효성을 확인하는 동안 “사용자의 주소, 거래 금액”과 다른 세부 정보는 암호화된 상태로 남습니다([z.cash](https://z.cash/technology/)).

**트레이드오프:** ZK 증명 생성에는 많은 연산이 필요합니다. 증명 회로가 배치의 모든 거래를 순회하며 검사를 다시 실행하기 때문에 온체인 검증은 저렴하고 빠르더라도 증명 시간과 하드웨어 비용은 실질적인 제약입니다. 시스템의 신뢰 가정은 대부분 수학으로 축소되지만, 일부 증명 시스템에서는 일회성 신뢰 설정 절차(trusted setup ceremony)도 신뢰해야 합니다.

---

## 완전 동형 암호화(FHE)

![키가 없는 클라우드 서버가 운영하는 수학 기계를 잠긴 상자가 통과한 뒤, 계산된 결과를 담은 채 여전히 잠긴 상태로 나오는 모습. 암호화된 데이터를 직접 연산하는 과정을 보여 줌](../../assets/blockchain-privacy-technologies-02-fhe.jpg)

[완전 동형 암호화](/ko/glossary/fully-homomorphic-encryption/)는 다른 방식으로 접근합니다. 숨겨진 데이터에 관한 사실을 증명하는 대신 *암호화된 데이터를 직접 연산*할 수 있게 합니다. 그 결과로 나온 암호문을 복호화하면 평문을 연산했을 때와 같은 답을 얻습니다. FHE 연구 및 인프라를 선도하는 기업 중 하나인 Zama는 “FHE를 사용하면 복호화하지 않고 데이터를 처리할 수 있습니다. 기업은 사용자 데이터에 접근하지 않고 서비스를 제공하며, 사용자는 달라지지 않은 기능을 경험합니다”라고 설명합니다([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**숨기는 것:** 연산의 원시 입력, 중간 상태, 출력입니다. 키 보유자를 제외한 모든 주체는 암호문만 보며, 여기에는 연산을 수행하는 주체도 포함됩니다.

**개략적인 작동 방식:** FHE 스킴은 격자 기반 수학으로 만든 암호문에 평문 값을 인코딩한 다음, 암호화 상태에서의 덧셈과 곱셈을 정의해 암호문에서 임의의 회로를 실행할 수 있게 합니다. 블록체인에 적용하면 스마트 컨트랙트는 관련 금액을 전혀 보지 않고도 토큰을 이동하거나 로직을 평가할 수 있습니다. Zama의 예시처럼 “블록체인은 실제 금액을 전혀 보지 않고도 Alice에게 충분한 자금이 있음을 검증”할 수 있습니다([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption#:~:text=The%20blockchain%20verified%20Alice%20has%20sufficient%20funds%20without%20ever%20seeing%20the%20actual%20amounts)). Zama는 격자 기반 FHE 스킴이 “본질적으로 양자 내성을 갖는다”고도 설명합니다. 암호학적 위험을 장기적으로 보는 사람에게 중요한 특성입니다([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**예시 프로젝트:** [Zama](https://www.zama.org/)는 오픈 소스 FHE 라이브러리(TFHE-rs, Concrete)와 EVM 체인에서 기밀 스마트 컨트랙트 실행을 추가하는 fhEVM을 개발합니다. [Fhenix](https://cofhe-docs.fhenix.zone/)는 “개발자가 완전 동형 암호화를 사용해 프라이버시 보존형 스마트 컨트랙트를 구축”하고 “민감한 데이터가 연산 내내 암호화된 상태로 유지”되게 하기 위해 특별히 만들어진 블록체인입니다. 클라이언트 측 암호화를 위한 JavaScript 라이브러리(Cofhejs)와 온체인 암호화 연산을 위한 Solidity FHE 라이브러리를 제공합니다([cofhe-docs.fhenix.zone](https://cofhe-docs.fhenix.zone/)).

**트레이드오프:** FHE는 이 목록에서 가장 강한 프라이버시 보장을 제공합니다. 연산 중에도 아무것도 복호화하지 않기 때문입니다. 하지만 평문 연산과 비교하면 단연 가장 많은 연산 비용이 듭니다. 그래서 오늘날 FHE 기반 체인은 모든 거래가 아니라 기밀성이 중요한 로직에 FHE를 사용하며, FHE 하드웨어 가속은 활발한 연구 경쟁 분야입니다.

---

## 안전한 다자간 연산(MPC)

![세 사람이 각각 퍼즐 조각 모양의 키 조각 하나를 들고 있고, 점선이 이를 하나의 서명된 거래로 연결해 어느 한 참여자도 전체 비밀을 보지 않고 공동 결과를 만드는 안전한 다자간 연산을 보여 주는 모습](../../assets/blockchain-privacy-technologies-03-mpc.jpg)

[안전한 다자간 연산](/ko/glossary/secure-multiparty-computation/)은 서로 관련되지만 구별되는 문제를 해결합니다. 한 주체가 암호화된 데이터를 연산하는 대신, 각자 입력의 비밀 일부를 가진 *여러* 주체가 개별 입력을 서로에게 공개하지 않은 채 공동으로 함수를 계산합니다. 형식적 정의에 따르면 MPC는 “여러 주체가 각자의 입력을 비공개로 유지하면서 그 입력에 대한 함수를 공동으로 계산하는 방법을 만드는 것을 목표로 하는 암호학의 하위 분야”입니다. 따라서 참여자가 세 명이라면 “Alice, Bob, Charlie는 누가 어떤 값을 제공했는지 공개하지 않고도 F(x, y, z)를 알 수 있습니다”([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation#:~:text=Secure%20multi%2Dparty%20computation%20)).

**숨기는 것:** 각 주체의 개별 입력을 다른 모든 주체에게서 숨깁니다. 합의된 출력만 공개되며, 어느 한 참여자도 전체 비밀을 볼 수 없습니다.

**신뢰 가정:** 보안은 스킴이 깨지기 전에 부정직할 수 있는 참여자 수에 따라 달라집니다. 고전적인 비밀 공유 방식은 능동적 악성 참여자가 전체의 3분의 1 미만이거나, 수동적·반정직(semi-honest) 참여자가 절반 미만일 때 정보 이론적 보안을 제공합니다([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)). 다시 말해 MPC는 “한 명의 수탁자를 신뢰”하는 대신 “N명의 주체 중 너무 많은 수가 공모하지 않을 것이라고 신뢰”하는 방식입니다.

**현재 사용 방식 — 임계값 서명 수탁:** 블록체인에서 가장 눈에 띄는 MPC 활용 사례는 개인 키를 독립된 여러 주체에 나누어 어느 한 기기나 사람도 전체 키를 보유하지 않게 하는 것입니다. 수탁 인프라 제공업체 Fireblocks는 이를 직접 설명합니다. “다자간 연산(MPC)은 개인 키를 여러 독립 주체에 분산된 별도 조각으로 나누는 암호학적 방법”이며, 중요한 점은 “어느 시점에도 완전한 키가 한곳에서 조립되지 않는다”는 것입니다([fireblocks.com](https://www.fireblocks.com/what-is-mpc#:~:text=Multi%2Dparty%20computation%20)). 거래에 서명해야 할 때는 정족수를 충족하는 엔드포인트가 각각 거래를 검증하고 부분 서명을 제공합니다. “어느 시점에도 개인 키는 조립되지 않으므로” “한 엔드포인트가 침해되더라도 다른 곳의 키 조각은 각각 따로는 쓸모가 없습니다”([fireblocks.com](https://www.fireblocks.com/what-is-mpc)). 이 임계값 서명 패턴은 이제 대부분의 기관 암호화폐 수탁 서비스와 여러 다중 서명 지갑의 기반입니다.

**트레이드오프:** MPC는 한 기기의 개인 키 하나에서 생기는 단일 장애점을 없애지만, 주체 사이에 통신 라운드가 추가되어 지연 시간이 늘어나고 프로토콜을 신중하게 설계해야 합니다. MPC 스킴의 보안 보장은 가정한 정직한 다수 임계값만큼만 강하며, 이는 수학적 가정일 뿐 아니라 사회적·운영적 가정이기도 합니다.

---

## 신뢰 실행 환경(TEE)

[신뢰 실행 환경](/ko/glossary/trusted-execution-environment/)은 또 다른 경로를 택합니다. 연산 내내 데이터를 암호화하는 대신 칩의 하드웨어 보호 영역인 *보안 엔클레이브* 안에서 연산을 격리하여 해당 컴퓨터의 운영체제조차 내부를 검사하지 못하게 합니다. 가장 잘 알려진 구현인 Intel의 SGX(Software Guard Extensions)는 Wikipedia에서 “일부 Intel 중앙 처리 장치(CPU)에 내장되어 신뢰 실행 환경을 구현하는 명령 코드 집합”으로 설명됩니다([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=Intel%20Software%20Guard%20Extensions)). 작동 방식으로 보면 “SGX는 CPU가 메모리 일부인 엔클레이브를 암호화”하고 “엔클레이브에서 나온 데이터와 코드는 CPU 안에서 즉시 복호화되어 다른 코드가 이를 검사하거나 읽지 못하게 보호”합니다. 여기에는 “운영체제와 기반 하이퍼바이저처럼 더 높은 권한 수준에서 실행되는 코드”도 포함됩니다([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)).

**숨기는 것:** 엔클레이브 내부의 데이터와 코드를 같은 컴퓨터의 다른 모든 프로세스에서 숨깁니다. 침해된 운영체제도 볼 수 없습니다. 서버 운영자를 신뢰하지 않고 특정 코드의 실행을 신뢰해야 할 때 유용합니다.

**신뢰 가정:** 순수하게 수학에 의존하는 ZKP, FHE, MPC와 달리 TEE는 칩 제조사의 하드웨어와 펌웨어를 신뢰해야 합니다. 이 신뢰는 여러 차례 시험대에 올랐습니다. SGX는 “사이드 채널 공격을 방어하지 못하며”, 연구자들은 2017년에 “같은 시스템에서 실행되는 SGX 엔클레이브로부터 5분 안에 RSA 키”를 추출한 사례부터 2018년에 “추측 실행과 버퍼 오버플로를 결합해 SGX를 우회”한 Foreshadow 공격까지 실용적인 공격을 거듭 입증했습니다. 이후에도 Plundervolt, LVI, SGAxe, ÆPIC Leak 같은 취약점이 발견되었습니다([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=While%20this%20can%20mitigate%20many%20kinds%20of%20attacks%2C%20it%20does%20not%20protect%20against%20side%2Dchannel%20attacks)). 이런 이력 때문에 TEE는 대개 암호학적으로 빈틈없는 보장이라기보다 실용적이고 빠른 중간 지점으로 설명됩니다.

**예시 프로젝트:** [Oasis Protocol](https://oasis.net/technology)의 Sapphire 네트워크는 하드웨어 엔클레이브 안에서 스마트 컨트랙트를 실행합니다. 따라서 사용자는 “하드웨어로 보호된 엔클레이브 안에서 코드를 실행”할 수 있고 “데이터는 서버 운영자에게도 암호화된 상태로 유지”됩니다. 또한 “모든 실행은 사용자가 맹목적인 신뢰 없이 검증할 수 있는 암호학적 증명을 생성”합니다. 이를 통해 “EVM 호환성과 조합 가능성”을 유지하면서 “기밀 스마트 컨트랙트”를 제공합니다([oasis.net](https://oasis.net/technology)). Secret Network를 비롯해 리스테이킹과 연계된 여러 프라이버시 제품도 TEE를 기반으로 하며, 심층 방어를 위해 다른 기법과 결합하는 경우가 많습니다.

**트레이드오프:** TEE는 네이티브에 가까운 속도로 실행되어 FHE나 무거운 ZK 증명보다 훨씬 빠릅니다. 지연 시간에 민감한 애플리케이션에 매력적인 이유입니다. 하지만 이 속도는 실제 사이드 채널 공격 이력이 있는 하드웨어를 신뢰하는 대가로 얻는 것이므로, 최악의 경우 TEE 기반 시스템의 보안 보장은 순수 암호학적 방식보다 대체로 약하고 더 강한 외부 신뢰를 요구합니다.

---

## 링 서명과 스텔스 주소

마지막 두 기법은 더 좁지만 매우 실용적인 목표를 보호합니다. 거래 자체는 온체인에서 볼 수 있더라도 거래를 *누가* 보냈고 *누가* 받았는지 숨깁니다. [Monero](https://www.getmonero.org/)는 두 기법을 모두 실제 운영 환경에서 사용하는 대표 사례입니다.

**링 서명**은 송신자를 숨깁니다. Monero 문서는 “링 서명은 각각 키를 가진 사용자 집단의 어느 구성원이나 만들 수 있는 디지털 서명의 한 유형”이며, “집단 구성원 중 누구의 키가 서명 생성에 사용되었는지 알아내는 것이 계산상 불가능해야 한다”고 설명합니다([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html#:~:text=a%20ring%20signature%20is%20a%20type%20of%20digital%20signature)). 실제로 Monero 거래는 실제 지출자의 키를 “감마 분포 방식으로 블록체인에서 가져온” 미끼 공개 키와 섞습니다. 따라서 가능한 서명자 “링” 안에서 “모든 링 구성원은 동등하고 유효”하며, “외부 관찰자는 서명 집단의 가능한 서명자 중 어느 것이 사용자 계정에 속하는지 알아낼 방법이 없습니다”([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)).

**스텔스 주소**는 수신자를 숨깁니다. 하나의 공개 주소를 반복해서 사용하는 대신, “송신자가 수신자를 대신해 모든 거래마다 임의의 일회용 주소를 생성”합니다. 따라서 수신되는 결제는 “블록체인의 고유 주소로 들어가며, 수신자가 공개한 주소나 다른 거래 주소와 연결할 수 없습니다”([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html#:~:text=They%20allow%20and%20require%20the%20sender%20to%20create%20random%20one%2Dtime%20addresses)). 수신자는 개인 조회 키로 체인을 스캔해 결제를 찾고 개인 지출 키로 이를 이동합니다. 그래서 “결제가 어디로 전송되었는지는 송신자와 수신자만 알 수 있습니다”([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)).

**숨기는 것:** 링 서명은 송신자 신원을, 스텔스 주소는 수신자 신원을 숨깁니다. 거래 *금액*은 별도의 메커니즘인 기밀 거래/RingCT가 숨기며, 이 두 기법 자체에는 포함되지 않습니다.

**트레이드오프:** 두 기법 모두 증명 생성 오버헤드나 엔클레이브 의존성 없이 일반 하드웨어에서 효율적으로 실행되므로 실제 결제 네트워크에 적합합니다. 하지만 신뢰 모델은 미끼 집합이 실제 서명자와 통계적으로 구별되지 않는다는 가정에 의존합니다. 초기 링 서명 구현에서는 약한 미끼 선택이나 블록체인 분석 휴리스틱이 익명성 집합을 좁힌 사례가 있으므로, 링 크기와 미끼 분포 같은 매개변수 선택은 기반 암호 프리미티브 자체만큼 중요합니다.

---

## 다섯 가지 접근법 비교

| 기술 | 숨기는 것 | 신뢰 가정 | 성능 비용 | 현재 성숙도 | 예시 프로젝트 |
|---|---|---|---|---|---|
| 영지식 증명 | 기초 데이터/연산, 증명의 유효성만 공개 | 암호학적 수학(일부 시스템은 신뢰 설정 추가) | 증명 생성 비용 높음, 검증은 저렴함 | 대규모 실사용(rollup, 보호 결제) | zkSync, Starknet, Zcash |
| 완전 동형 암호화 | 연산 제공자를 포함해 연산 내내 모든 데이터 | 암호학적 수학(격자 기반) | 연산 오버헤드 매우 높음 | 초기 실사용, 하드웨어 가속 연구 활발 | Zama, Fhenix |
| 안전한 다자간 연산 | 각 주체의 개별 입력 | 참여자 사이의 정직한 다수/임계값 | 중간, 통신 라운드 추가 | 성숙했으며 수탁 분야에 널리 배포 | Fireblocks 및 기타 임계값 서명 수탁업체 |
| 신뢰 실행 환경 | 운영체제를 포함한 다른 모든 프로세스로부터 데이터/코드 | 하드웨어/펌웨어 공급업체(칩 제조사) | 네이티브에 가까운 속도 | 실사용 중이지만 문서화된 사이드 채널 공격 이력 존재 | Intel SGX, Oasis Sapphire |
| 링 서명 및 스텔스 주소 | 송신자 신원과 수신자 신원 | 미끼 집합의 통계적 비구별성 | 낮음, 일반 하드웨어에서 효율적 | 성숙했으며 십 년 넘게 실제 운영 | Monero |

어느 한 기술도 모든 축에서 이기지는 못합니다. 그래서 현재 연구는 MPC 연산의 정확성을 검증하는 ZK 증명이나, 심층 방어를 위해 FHE와 함께 사용하는 TEE처럼 여러 기술을 점점 더 결합하고 있습니다.

---

## 토큰화 도메인과의 관계

[토큰화](/ko/glossary/tokenize/)된 도메인은 다른 온체인 자산과 마찬가지로 기본적으로 투명하다는 특성을 물려받습니다. 소유권 이전, 입찰, 메타데이터 업데이트를 누구나 읽을 수 있습니다. 이는 대부분 장점입니다. 출처와 소유권 기록은 [토큰화 도메인](/ko/blog/what-are-tokenized-domains/)을 거래 가능한 자산으로 신뢰하게 하는 핵심이기 때문입니다. 하지만 도메인 포트폴리오의 보유 현황과 판매 가격도 체인을 지켜보는 누구에게나 보인다는 뜻입니다.

이 가이드의 프라이버시 기술은 NFT형 도메인 인프라가 앞으로 나아갈 수 있는 방향을 보여 줍니다. MPC 기반 임계값 수탁은 이미 다른 디지털 자산과 같은 방식으로 도메인 NFT를 보유한 기관 [지갑](/ko/glossary/wallet/)을 보호합니다. ZK 증명은 언젠가 입찰자가 전체 잔액을 공개하지 않고도 제안 금액을 감당할 수 있음을 증명하게 할 수 있습니다. 기밀 컴퓨팅 기법은 등록대행자나 마켓플레이스가 구매자의 전체 신원을 드러내지 않고 자격 요건을 검증하게 할 수 있습니다. 이들 기술은 아직 도메인 토큰화에 도입되지 않았지만, 그 기반 암호 프리미티브는 지금도 DeFi와 커스터디 인프라에서 수십억 달러 규모의 자산을 보호하고 있습니다.

---

## 출처 및 추가 자료

- [영지식 증명 — ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)
- [ZK-Rollup — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [L2BEAT 확장성 요약](https://l2beat.com/scaling/summary)
- [Zcash 기술 개요](https://z.cash/technology/)
- [동형 암호화 소개 — Zama](https://www.zama.org/introduction-to-homomorphic-encryption)
- [Fhenix cofhe 문서](https://cofhe-docs.fhenix.zone/)
- [안전한 다자간 연산 — Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)
- [MPC란? — Fireblocks](https://www.fireblocks.com/what-is-mpc)
- [Software Guard Extensions(SGX) — Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)
- [Oasis Protocol 기술](https://oasis.net/technology)
- [링 서명 — Monero Moneropedia](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)
- [스텔스 주소 — Monero Moneropedia](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)
