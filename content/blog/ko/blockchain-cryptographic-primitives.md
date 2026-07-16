---
title: "모든 블록체인을 지탱하는 주요 암호학적 기본 요소"
date: '2026-07-02'
language: ko
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['gong-jihye']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 10
format: roundup
description: 해시 함수, 디지털 서명, Merkle 트리, 타원곡선 암호학, 커밋먼트 등 블록체인을 작동하게 하는 핵심 암호학적 기본 요소를 설명합니다.
ogImage: ../../assets/blockchain-cryptographic-primitives-og.jpg
keywords: ['블록체인 암호학', '암호학적 기본 요소', '해시 함수', 'SHA-256', 'Keccak-256', '디지털 서명', 'ECDSA', 'EdDSA', 'BLS 서명', 'Merkle 트리', '타원곡선 암호학', 'secp256k1', '커밋먼트 스킴', '양자 내성 암호학', '공개 키 암호학', '블록체인 보안']
relatedArticles:
  - /ko/blog/blockchain-privacy-technologies/
  - /ko/blog/blockchain-consensus-mechanisms/
  - /ko/blog/blockchain-virtual-machines/
  - /ko/blog/blockchain-scaling-approaches/
  - /ko/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /ko/glossary/hash-function/
  - /ko/glossary/digital-signature/
  - /ko/glossary/merkle-tree/
  - /ko/glossary/public-key/
  - /ko/glossary/private-key/
relatedTopics:
  - /ko/topics/web3-foundations/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/tokenize-your-com/
  - /ko/series/domain-flipping-skills/
---

“이 거래는 최종 확정되었다”, “이 주소가 이 자산을 소유한다”, “이 기록은 변경되지 않았다” 같은 모든 블록체인의 주장은 결국 좁고 명확하게 정의된 역할을 수행하는 소수의 암호학적 기본 요소로 귀결됩니다. 이 중 블록체인이 발명한 것은 없습니다. 해시 함수, 디지털 서명, Merkle 트리는 Bitcoin보다 수십 년 먼저 등장했습니다. 블록체인이 한 일은 어느 한 주체를 신뢰하지 않고도 이런 주장이 성립하도록 이 요소들을 하나의 시스템으로 결합한 것입니다.

이 가이드에서는 실제로 핵심 역할을 맡는 기본 요소를 살펴봅니다. 데이터의 지문을 만드는 [해시 함수](/ko/glossary/hash-function/), 거래를 승인하는 [디지털 서명](/ko/glossary/digital-signature/), 방대한 데이터셋을 부분별로 검증하게 해 주는 [Merkle 트리](/ko/glossary/merkle-tree/), 그 서명의 기반이 되는 타원곡선 수학, 그리고 [영지식 증명](/ko/glossary/zero-knowledge-proof/)으로 이어지는 구성 요소인 커밋먼트 스킴입니다. 각 요소를 이해하는 것이 블록체인이 내부에서 실제로 하는 일을 이해하는 가장 빠른 방법입니다.

---

## 암호학적 해시 함수(SHA-256, Keccak)

![문서를 해시 함수 기계에 넣자 고정 길이 지문 다이제스트가 나오고, 입력에서 글자 하나를 바꾸자 완전히 다른 다이제스트가 생성되어 눈사태 효과를 보여 주는 모습](../../assets/blockchain-cryptographic-primitives-01-hash-function.jpg)

[해시 함수](/ko/glossary/hash-function/)는 크기에 상관없이 입력을 받아 고정 크기의 출력인 “다이제스트”를 결정론적으로 생성합니다. 입력 비트 하나만 뒤집어도 출력 전체가 완전히 달라지고, 같은 출력으로 해시되는 서로 다른 두 입력을 찾는 것은 계산상 불가능합니다. 이러한 속성인 충돌 저항성 덕분에 해시는 크기가 아무리 큰 데이터라도 변조를 드러내는 간결한 지문으로 사용할 수 있습니다.

Bitcoin은 전반에 SHA-256을 사용합니다. 각 새 블록 헤더에 이전 헤더의 SHA256(SHA256()) 해시를 넣어 헤더를 연결하므로, 과거 블록 하나라도 변경하면 그 해시가 바뀌고 뒤따르는 모든 헤더와의 연결이 끊어집니다([Bitcoin 개발자 가이드](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Each%20block%20also%20stores%20the%20hash%20of%20the%20previous%20block%27s%20header%2C%20chaining%20the%20blocks%20together)). 같은 이중 SHA-256 구성을 사용해 거래를 블록의 [Merkle 트리](/ko/glossary/merkle-tree/)로 해싱합니다([Bitcoin.org 참고 자료](https://developer.bitcoin.org/reference/block_chain.html#:~:text=A%20SHA256%28SHA256%28%29%29%20hash%20in%20internal%20byte%20order)).

반면 Ethereum은 범용 해시로 Keccak-256을 표준화해 사용합니다. 이는 이후의 NIST SHA-3 표준과는 다른, 최초 Keccak 제출안입니다. 모든 계정 주소는 계정 [공개 키](/ko/glossary/public-key/)의 Keccak-256 해시에서 마지막 20바이트를 가져와 파생합니다([ethereum.org](https://ethereum.org/en/developers/docs/accounts/#:~:text=You%20get%20a%20public%20address%20for%20your%20account%20by%20taking%20the%20last%2020%20bytes%20of%20the%20Keccak-256%20hash%20of%20the%20public%20key)). 같은 함수는 Ethereum 상태를 저장하는 [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=key%20%3D%3D%20keccak256%28rlp%28value%29%29) 전반에서 키/값 콘텐츠 주소 지정의 기반으로도 사용됩니다.

해싱은 블록 헤더를 느슨한 기록 모음이 아니라 하나의 체인으로 연결하는 역할도 합니다. 헤더를 변경하면 그 해시가 바뀌고 이후 헤더의 참조가 깨집니다. 이후의 작업을 다시 수행하고 정직한 네트워크의 누적 작업을 따라잡아야 한다는 추가 조건은 Bitcoin의 작업 증명 합의에만 해당합니다. 과거 블록을 변경한 공격자는 해당 블록의 작업 증명과 그 이후의 모든 작업을 다시 수행한 뒤 정직한 체인을 따라잡아야 합니다([Bitcoin 백서, §4](https://bitcoin.org/bitcoin.pdf)). 다른 블록체인은 서로 다른 합의 규칙으로 기록의 유효성을 확인하고 확정하므로 해시 연결만으로는 이러한 작업 증명 비용이 생기지 않습니다. 서로 연결된 헤더 해시가 이 데이터 구조를 말 그대로 **블록체인**이라 부르는 이유입니다.

---

## 공개 키 암호학 및 디지털 서명(ECDSA, EdDSA, BLS)

![개인 키가 거래에 서명해 디지털 서명을 만들고, 일치하는 공개 키는 초록색 확인 표시와 함께 유효하다고 검증하지만 일치하지 않는 공개 키는 빨간색 X 표시와 함께 거부하는 모습](../../assets/blockchain-cryptographic-primitives-02-signatures.jpg)

블록체인에는 로그인 양식이 없으므로 “이 거래가 실제로 이 계정의 소유자에게서 나왔다”는 사실을 증명할 다른 방법이 필요합니다. [공개 키 암호학](/ko/glossary/public-key/)은 비밀로 보관하는 [개인 키](/ko/glossary/private-key/)와 자유롭게 공유할 수 있는 공개 키로 이루어진 키 쌍을 사용해 이 문제를 해결합니다. 개인 키로 거래에 서명하면 누구나 공개 키로 검증할 수 있는 [디지털 서명](/ko/glossary/digital-signature/)이 생성됩니다. 개인 키 자체를 공개하지 않고도 승인을 증명할 수 있습니다.

Ethereum 계정은 Bitcoin과 같은 secp256k1 곡선에서 타원곡선 디지털 서명 알고리즘인 ECDSA를 사용해 개인 키로부터 공개 키를 파생합니다([ethereum.org 계정 문서](https://ethereum.org/en/developers/docs/accounts/#:~:text=The%20public%20key%20is%20generated%20from%20the%20private%20key%20using%20the%20Elliptic%20Curve%20Digital%20Signature%20Algorithm); [EIP-2, secp256k1 서명 가변성 수정](https://eips.ethereum.org/EIPS/eip-2#:~:text=secp256k1n%2F2)). ECDSA는 검증 속도가 빠르고 수십 년 동안 검토되어 왔지만, 최신 설계와 관련된 운영상의 약점이 하나 있습니다. 개별 ECDSA 서명은 효율적으로 집계할 수 없으므로 수천 개를 검증하려면 수천 번의 별도 검사가 필요합니다.

EdDSA와 BLS 서명은 이 틈을 메웁니다. Solana와 Stellar 같은 체인에서 사용하는 EdDSA는 다른 곡선 구성을 사용하며, 결정론적으로 작동하고 과거에 ECDSA nonce 재사용 버그를 일으켰던 특정 구현상 함정에 강합니다. BLS 서명은 한 단계 더 나아갑니다. 사용하는 곡선의 수학적 페어링 속성 덕분에 여러 BLS 서명을 하나의 집계 서명으로 합쳐 한 번에 모두 검증할 수 있습니다. Ethereum의 지분 증명 합의 계층은 바로 이 특성을 사용합니다. 검증자가 BLS 키로 유효성 증명에 서명하므로 비콘 체인은 수십만 검증자의 투표를 빠르게 검증할 수 있을 만큼 작은 서명으로 집계할 수 있습니다. 이것이 대규모 지분 증명을 실용적으로 만드는 핵심입니다([ethereum.org, *비콘 체인*](https://eth2book.info/capella/part2/building_blocks/signatures/#:~:text=BLS%20signatures%20can%20be%20aggregated%20together%2C%20making%20them%20efficient%20to%20verify%20at%20large%20scale)). 또한 Ethereum은 스마트 컨트랙트에서 BLS 서명 검증을 지원하기 위해 BLS12-381 곡선 연산을 EVM 프리컴파일로 제공합니다([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#:~:text=Add%20functionality%20to%20efficiently%20perform%20operations%20over%20the%20BLS12-381%20curve%2C%20including%20those%20for%20BLS%20signature%20verification)).

---

## Merkle 트리

![Merkle 트리의 해시 노드가 피라미드 형태로 쌍을 이루며 하나의 루트까지 합쳐지고, 경량 클라이언트의 Merkle 증명을 보여 주는 한 리프에서 루트까지의 경로가 주황색으로 강조된 모습](../../assets/blockchain-cryptographic-primitives-03-merkle-tree.jpg)

[Merkle 트리](/ko/glossary/merkle-tree/)를 사용하면 모든 참여자가 모든 거래를 저장하지 않아도 블록체인이 수천 건의 거래를 하나의 32바이트 해시로 요약할 수 있습니다. 리프는 개별 데이터 항목(거래, 계정 상태)의 해시입니다. 해시를 두 개씩 연결해 다시 해싱하는 과정을 하나의 해시인 루트만 남을 때까지 반복합니다([Bitcoin 개발자 가이드](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Copies%20of%20each%20transaction%20are%20hashed%2C%20and%20the%20hashes%20are%20then%20paired%2C%20hashed%2C%20paired%20again%2C%20and%20hashed%20again%20until%20a%20single%20hash%20remains%2C%20the%20merkle%20root%20of%20a%20merkle%20tree)). 이 루트는 블록 헤더에 직접 저장되므로 전체 노드는 거의 추가 공간을 쓰지 않고도 블록의 전체 내용에 커밋할 수 있습니다.

장점은 증명 크기입니다. 거래 하나가 블록에 포함되어 있음을 보여 주는 데 전체 블록은 필요하지 않습니다. 해당 거래와 리프에서 루트까지 경로에 있는 형제 해시, 즉 “Merkle 브랜치”만 있으면 됩니다. 거래가 n개라면 일반적으로 약 log₂(n)개의 해시가 필요합니다. 이것이 단순 결제 검증(SPV)의 기반입니다. 블록 헤더만 가진 경량 클라이언트도 전체 블록체인을 다운로드하지 않고 Merkle 브랜치를 헤더의 루트와 대조해 특정 거래가 발생했음을 검증할 수 있습니다([Bitcoin 개발자 가이드](https://developer.bitcoin.org/devguide/operating_modes.html#:~:text=the%20merkle%20root%20in%20the%20block%20header%20along%20with%20a%20merkle%20branch%20can%20prove%20to%20the%20SPV%20client%20that%20the%20transaction%20in%20question%20is%20embedded%20in%20a%20block%20in%20the%20block%20chain)).

Ethereum은 Merkle 트리와 접두사(radix) 트라이를 결합한 Merkle Patricia Trie로 이 개념을 확장합니다. 거래 목록만이 아니라 전체 계정 상태를 저장하는 데 사용합니다. 모든 블록 헤더에는 `stateRoot`, `transactionsRoot`, `receiptsRoot`라는 세 개의 서로 다른 트라이 루트가 들어 있으며 각각 독립적으로 증명할 수 있습니다([ethereum.org](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=From%20a%20block%20header%20there%20are%203%20roots%20from%203%20of%20these%20tries)). 따라서 스마트 컨트랙트나 경량 클라이언트는 전체 체인을 재실행하지 않고도 계정 잔액 하나나 스토리지 슬롯 하나를 검증할 수 있습니다.

---

## 타원곡선 암호학

타원곡선 암호학(ECC)은 ECDSA, EdDSA, BLS의 수학적 기반입니다. 고전적인 RSA처럼 큰 수의 인수분해 난이도에 의존하는 대신 ECC는 타원곡선 이산 로그 문제의 난이도에 의존합니다. 기준점을 여러 번 더해 도달한 곡선 위의 점이 주어졌을 때, 정방향으로 그 점을 계산하는 일은 쉽지만 기준점을 몇 번 더했는지 역으로 알아내는 일은 계산상 불가능합니다. 이 비대칭성, 즉 한 방향은 쉽고 역방향은 어렵다는 특성 덕분에 파생된 공개 키를 안전하게 공개하면서 개인 키로 안전하게 서명할 수 있습니다.

구체적인 곡선과 서명 방식이 중요합니다. Bitcoin과 Ethereum은 모두 Standards for Efficient Cryptography Group이 표준화한 Koblitz 곡선 secp256k1을 사용하며, 이 곡선의 256비트 매개변수는 충분히 연구되어 있습니다([SEC 2: 권장 타원곡선 도메인 매개변수](https://www.secg.org/sec2-v2.pdf)). 다른 생태계는 서로 다른 트레이드오프를 선택합니다. Ed25519는 Edwards25519 곡선 위에 구현된 구체적인 EdDSA 서명 방식입니다([RFC 8032, §5.1](https://www.rfc-editor.org/rfc/rfc8032.html#section-5.1)). RFC 8032는 이를 약 128비트의 고전적 보안 수준으로 평가합니다([§8.5](https://www.rfc-editor.org/rfc/rfc8032.html#section-8.5)). BLS12-381은 페어링에 적합한 곡선으로 BLS 서명 집계 같은 연산을 위해 선택되며, EIP-2537은 120비트가 넘는 보안 수준을 설명합니다([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#motivation)). 이러한 추정치는 각 방식의 “키 비트당 보안”이 같다는 뜻이 아닙니다. 각 시스템은 서로 다른 군, 인코딩, 가정을 사용하며 명목상 키 길이 자체가 보안 강도를 뜻하지도 않습니다. 예를 들어 NIST는 128비트 고전적 보안에 일반 ECC 키 256~383비트를 대응시키지만 RSA 키는 3072비트를 대응시킵니다([NIST SP 800-57 Part 1 Rev. 5, 표 2](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf#page=67)). 이는 타원곡선 시스템이 블록체인 계정의 기본값이 된 이유를 설명하는 데 도움이 됩니다.

---

## 커밋먼트 스킴: 영지식으로 이어지는 다리

커밋먼트 스킴을 사용하면 값을 “잠글” 수 있습니다. 특정 데이터에 구속되도록 하는 결과물을 게시하되 데이터 자체는 공개하지 않고, 나중에 커밋먼트를 “열어” 그 값이 무엇이었는지 증명할 수 있습니다. 일상적인 비유로는 봉인된 봉투가 있습니다. 오늘 누군가에게 봉인된 봉투를 건네 이미 답을 정했다는 사실을 증명하면서도 나중에 직접 열기 전까지 답을 보여 주지 않을 수 있습니다. 한 번 봉인하면 안의 답을 바꿀 수 없습니다.

작은 기본 요소처럼 들리지만 대부분의 영지식 증명 시스템을 지탱하는 핵심 요소입니다. 예를 들어 Ethereum의 blob 기반 데이터 가용성 설계는 KZG 다항식 커밋먼트를 사용해 각 blob을 작은 암호학적 커밋먼트로 줄입니다. KZG 증명은 해당 커밋먼트를 기준으로 평가값이나 샘플링된 셀이 일치하는지 인증할 수 있지만, 그 자체로 전체 blob을 사용할 수 있다는 사실을 증명하지는 않습니다. 가용성은 합의 계층의 배포 및 샘플링 규칙에서 나오며, KZG는 수신한 데이터의 무결성을 검사합니다([EIP-4844](https://eips.ethereum.org/EIPS/eip-4844#consensus-layer-validation); [EIP-7594, PeerDAS](https://eips.ethereum.org/EIPS/eip-7594#networking)). 이러한 분리 덕분에 검증자는 간결한 평가 증명을 blob 데이터 전체가 게시되었다는 증명으로 오인하지 않고도 blob의 작은 일부를 확인할 수 있습니다. 실제로 Merkle 루트 자체도 단순한 커밋먼트 스킴입니다. 루트 해시를 통해 전체 데이터셋에 커밋하고, Merkle 브랜치는 그중 한 부분을 공개하는 “열기”입니다. ZK-rollup은 더 고급인 다항식 및 벡터 커밋먼트 스킴을 바탕으로 거래 실행 배치 전체를 온체인에서 저렴하게 검증할 수 있는 증명으로 압축합니다. 자세한 내용은 [완전 영지식과 계산적 영지식](/ko/blog/perfect-vs-computational-zero-knowledge/)에서 다룹니다.

---

## 비교: 블록체인의 암호학적 기본 요소

| 기본 요소 | 제공하는 속성 | 온체인 사용처 | 고전적 보안과 양자 컴퓨팅 위험 |
|---|---|---|---|
| 해시 함수(SHA-256, Keccak-256) | 충돌 저항성을 갖춘 지문 생성, 블록을 서로 연결 | 블록 해싱, 주소 파생, Merkle 루트 | 현재 출력 크기에서는 고전 컴퓨팅 공격에 강함, 해시 기반 방식은 일반적으로 오늘날의 타원곡선 서명보다 양자 공격에 더 강한 것으로 평가됨 |
| 디지털 서명 — ECDSA | 개인 키/공개 키 쌍을 통한 거래 승인 | Bitcoin 및 Ethereum 계정 서명 | 고전 컴퓨팅 환경에서는 안전함, 충분한 성능을 갖춘 대규모 양자 컴퓨터는 타원곡선 기반 방식을 깨뜨릴 것으로 예상됨. 이에 따라 NIST는 양자 내성 대안을 표준화함([NIST, 2024](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards#:~:text=A%20sufficiently%20capable%20quantum%20computer%2C%20though%2C%20would%20be%20able%20to%20sift%20through%20a%20vast%20number%20of%20potential%20solutions%20to%20these%20problems%20very%20quickly%2C%20thereby%20defeating%20current%20encryption)) |
| 디지털 서명 — EdDSA / BLS | 결정론적 서명(EdDSA), 효율적인 서명 집계(BLS) | Solana/Stellar 서명(EdDSA), Ethereum 검증자 유효성 증명(BLS) | ECDSA와 같은 타원곡선 가정에 기반하므로 장기적으로 같은 양자 위험에 노출됨 |
| Merkle 트리 | 대규모 데이터셋에 대한 간결한 커밋먼트, 작은 포함 증명 | 블록 헤더, 경량 클라이언트(SPV) 검증, Ethereum의 상태/거래/영수증 트라이 | 기반 해시 함수의 충돌 저항성에만 의존하므로 새로운 위험을 더하지 않고 해당 해시의 양자 공격 내성을 그대로 물려받음 |
| 타원곡선 암호학 | 짧은 키와 서명의 수학적 기반 | secp256k1(Bitcoin, Ethereum), Ed25519, BLS12-381 | 미래의 대규모 양자 컴퓨터에 ECDSA/EdDSA/BLS와 같은 방식으로 취약함. 이것이 양자 내성 방식으로의 전환 연구를 이끄는 주요 동인임 |
| 커밋먼트 스킴 | 값을 지금 확정하고 미리 공개하지 않은 채 나중에 공개하거나 증명 | Ethereum 데이터 가용성의 KZG 커밋먼트, 단순 커밋먼트인 Merkle 루트, ZK-rollup의 구성 요소 | 보안은 스킴을 구성할 때 사용한 기반 해시 또는 타원곡선 가정에 따라 달라짐 |

---

## 토큰화 도메인과의 관계

도메인을 [토큰화](/ko/glossary/tokenize/)할 때 이 모든 기본 요소가 직접 사용됩니다. 소유권을 나타내는 [NFT](/ko/glossary/nft/)는 체인의 계정 및 토큰 권한 규칙으로 보호됩니다. 외부 소유 계정(EOA)이 NFT를 보유한 경우 해당 계정의 개인 키가 계정 작업을 승인합니다. 컨트랙트 계정에는 개인 키가 없으며 코드가 계정을 제어합니다([ethereum.org, *Ethereum 계정*](https://ethereum.org/en/developers/docs/accounts/#account-types)). ERC-721 토큰은 승인된 주소나 운영자도 이전을 시작할 수 있습니다([ERC-721](https://eips.ethereum.org/EIPS/eip-721#specification)). 따라서 직접 관리하는 EOA가 소유권을 보유할 때는 [하드웨어 지갑](/ko/glossary/hardware-wallet/)과 신중한 [시드 구문](/ko/glossary/seed-phrase/) 보관이 중요하지만, 스마트 컨트랙트 지갑과 수탁형 지갑에는 서로 다른 권한 및 신뢰 경계가 적용됩니다. 도메인 소유권 기록은 체인의 다른 모든 계정 잔액과 [스마트 컨트랙트](/ko/glossary/smart-contract/)를 보호하는 것과 같은 Merkle 커밋 상태에 존재합니다. 이로써 토큰화 도메인은 다른 온체인 자산과 같은 변조 탐지성을 갖습니다. 등록대행자의 데이터베이스를 유일한 진실의 원천으로 삼지 않아도 이전할 수 있고, 검증할 수 있으며, 소유권을 증명할 수 있습니다.

이러한 기본 요소를 이해하면 토큰화가 바꾸는 것과 바꾸지 않는 것도 명확해집니다. 도메인의 DNS 레코드와 레지스트리 상태는 여전히 ICANN 규칙을 따르지만, 소유권 증명은 이제 로그인으로 보호되는 [등록대행자](/ko/glossary/registrar/) 계정 대신 위에서 설명한 암호학을 기반으로 작동합니다. 더 넓은 맥락은 [블록체인 합의 메커니즘](/ko/blog/blockchain-consensus-mechanisms/)과 [블록체인 확장 접근법](/ko/blog/blockchain-scaling-approaches/)에서 살펴볼 수 있으며, [namefi.io](https://namefi.io)에서 토큰화를 시작할 수 있습니다.

---

## 출처 및 추가 자료

- Bitcoin 개발자 가이드 — [블록체인](https://developer.bitcoin.org/devguide/block_chain.html), 이전 헤더의 SHA256(SHA256())을 통한 연결
- Bitcoin — [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf), 작업 증명 기록 재작성과 누적 작업량
- Bitcoin 개발자 참고 자료 — [블록체인](https://developer.bitcoin.org/reference/block_chain.html), Merkle 루트 구성
- Bitcoin 개발자 가이드 — [운영 모드](https://developer.bitcoin.org/devguide/operating_modes.html), SPV와 Merkle 브랜치
- ethereum.org — [Ethereum 계정](https://ethereum.org/en/developers/docs/accounts/), ECDSA 및 Keccak-256 주소 파생, EOA와 컨트랙트 계정 제어
- ethereum.org — [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/), 상태/거래/영수증 루트
- ethereum.org — [Danksharding](https://ethereum.org/en/roadmap/danksharding/), KZG 다항식 커밋먼트
- EIP-4844 — [Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844), blob 커밋먼트, 증명, 합의 계층 가용성
- EIP-7594 — [PeerDAS](https://eips.ethereum.org/EIPS/eip-7594), 셀 증명과 데이터 가용성 샘플링
- ERC-721 — [Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721), 토큰 소유권, 승인, 운영자
- EIP-2 — [Homestead 하드포크 변경 사항](https://eips.ethereum.org/EIPS/eip-2), secp256k1 서명 제약
- EIP-2537 — [BLS12-381 곡선 연산용 프리컴파일](https://eips.ethereum.org/EIPS/eip-2537)
- RFC 8032 — [Edwards-Curve Digital Signature Algorithm (EdDSA)](https://www.rfc-editor.org/rfc/rfc8032.html), Ed25519의 서명 방식, 곡선, 보안 수준
- SEC 2: 권장 타원곡선 도메인 매개변수 — [secg.org](https://www.secg.org/sec2-v2.pdf)
- NIST SP 800-57 Part 1 Rev. 5 — [Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final), ECC와 RSA의 비교 가능한 보안 강도
- *The Eth2 Book* — [서명 및 BLS 집계](https://eth2book.info/capella/part2/building_blocks/signatures/)
- NIST — [NIST, 최종 확정된 양자 내성 암호화 표준 3종 최초 공개](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards)
