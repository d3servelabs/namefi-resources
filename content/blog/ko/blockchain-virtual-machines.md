---
title: "주요 블록체인 가상 머신: EVM, SVM, MoveVM, WebAssembly/RISC-V, CairoVM"
date: '2026-07-02'
language: ko
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 30
format: roundup
description: EVM, SVM, MoveVM, WebAssembly 및 RISC-V VM, CairoVM의 언어, 실행 모델, 생태계를 비교하는 주요 블록체인 가상 머신 가이드입니다.
ogImage: ../../assets/blockchain-virtual-machines-og.jpg
keywords: ['블록체인 가상 머신', '블록체인 VM', 'EVM', '이더리움 가상 머신', 'SVM', '솔라나 가상 머신', 'Sealevel', 'MoveVM', 'Move 언어', 'WASM 블록체인', 'CosmWasm', 'PolkaVM', 'CairoVM', 'Cairo 언어', 'Starknet', '스마트 컨트랙트 언어', '블록체인 병렬 실행', 'EVM 호환', '블록체인 실행 환경', '블록체인 상태 머신']
relatedArticles:
  - /ko/blog/blockchain-consensus-mechanisms/
  - /ko/blog/blockchain-scaling-approaches/
  - /ko/blog/blockchain-cryptographic-primitives/
  - /ko/blog/blockchain-privacy-technologies/
  - /ko/blog/what-are-tokenized-domains/
relatedTopics:
  - /ko/topics/web3-foundations/
  - /ko/topics/domain-tokenization/
relatedSeries:
  - /ko/series/tokenize-your-com/
  - /ko/series/domain-flipping-skills/
relatedGlossary:
  - /ko/glossary/ethereum-virtual-machine/
  - /ko/glossary/webassembly/
  - /ko/glossary/smart-contract/
  - /ko/glossary/ethereum/
  - /ko/glossary/gas/
---

모든 [스마트 컨트랙트](/ko/glossary/smart-contract/)는 어딘가에서 실행되어야 합니다. 그 “어딘가”가 블록체인 가상 머신(VM)입니다. 네트워크의 모든 노드가 똑같이 실행하는 샌드박스 프로그램이므로, 누가 실행하든 같은 입력은 항상 같은 출력을 냅니다. 어떤 VM을 기반으로 구축하는지는 체인의 거의 모든 면을 좌우합니다. 사용할 수 있는 언어, 거래를 동시에 실행할 수 있는지 아니면 하나씩 실행해야 하는지, 기존 개발자 생태계를 첫날부터 얼마나 활용할 수 있는지가 달라집니다.

이 가이드에서는 현재 [Web3](/ko/glossary/web3/) 스마트 컨트랙트 활동의 상당 부분을 뒷받침하는 다섯 가지 VM 계열을 살펴봅니다. [이더리움 가상 머신](/ko/glossary/ethereum-virtual-machine/)(EVM), Solana의 SVM, Aptos와 Sui가 사용하는 MoveVM, 이식 가능한 바이트코드 VM([WebAssembly](/ko/glossary/webassembly/)를 실행하는 CosmWasm과 RISC-V를 사용하는 PolkaVM 등), Starknet의 CairoVM입니다.

---

## 블록체인 가상 머신이란 무엇이며 왜 중요한가?

블록체인 VM은 결정론적이며 샌드박스화된 실행 환경입니다. 모든 전체 노드가 같은 거래를 다운로드해 같은 VM으로 실행하고, 결과적으로 동일한 [온체인](/ko/glossary/on-chain/) 상태에 도달합니다. Ethereum 문서는 EVM을 “모든 Ethereum 노드에서 코드를 일관되고 안전하게 실행하는 탈중앙화 가상 환경”이라고 설명합니다([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20is%20a%20decentralized,mechanics%20of%20how%20they%20work)). 이 설명은 이 가이드의 모든 VM에 적용할 수 있습니다.

VM 설계의 트레이드오프는 두 가지 속성이 결정합니다.

- **언어와 툴체인.** 개발자는 어떤 언어로 컨트랙트를 작성할 수 있으며, 이미 감사된 코드와 도구의 라이브러리는 얼마나 크고 그 기술을 아는 인력은 얼마나 많을까요?
- **실행 모델.** VM은 거래를 반드시 한 번에 하나씩 순차적으로 처리할까요, 아니면 독립적인 거래를 여러 CPU 코어에서 동시에 실행할 수 있을까요? 순차 실행은 추론하기 더 쉽습니다. 병렬 실행은 이론적 처리량을 높이지만 스케줄링 복잡성이 추가됩니다.

이러한 선택은 가스 비용, 혼잡 시 동작, 다시 작성하지 않고 이전할 수 있는 기존 컨트랙트와 도구에까지 영향을 미칩니다. 그래서 새로운 체인이나 그 위에 구축되는 [토큰화](/ko/glossary/tokenize/) 자산이 가장 먼저 답해야 할 질문 중 하나가 “어떤 VM인가?”입니다.

---

## EVM(이더리움 가상 머신)

![명령 포인터가 세로 스택에 값을 넣고 꺼내며 가스 계량기 다이얼이 실행 비용을 추적하는 단일 경로 스택 머신으로 EVM을 나타낸 평면 벡터 다이어그램](../../assets/blockchain-virtual-machines-01-evm-stack.jpg)

EVM은 2015년에 [Ethereum](/ko/glossary/ethereum/)과 함께 도입되었으며, 현재 가장 널리 배포된 스마트 컨트랙트 VM 중 하나입니다. **스택 기반** 머신인 EVM은 Ethereum 문서에 따르면 “깊이가 1024개 항목인 스택 머신”으로 작동하며, 각 항목은 256비트 워드입니다([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20executes%20as%20a,256%2Dbit%20word)). 컨트랙트 상태는 각 계정에 연결된 머클 패트리샤 트라이에 저장되고, 전체 체인 상태도 모든 계정을 해시로 연결하는 수정된 머클 패트리샤 트라이로 구성됩니다([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Ethereum%20uses%20a%20modified%20Merkle,linked%20by%20hashes)).

**언어.** 컨트랙트는 거의 항상 **Solidity**로 작성됩니다. Ethereum 문서는 이를 C++ 구문의 영향을 많이 받은 “스마트 컨트랙트 구현용 객체 지향 고급 언어”라고 설명합니다([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Solidity)). 주요 대안은 컨트랙트를 더 쉽게 감사할 수 있도록 의도적으로 기능을 줄인 “Python과 유사한” 언어 **Vyper**입니다([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Vyper)).

**실행 모델.** EVM은 블록 안의 거래를 정해진 순서에 따라 하나씩 **순차적으로** 처리합니다. 상태 전이 로직을 단순하고 감사하기 쉽게 유지하지만 기반 레이어의 처리량을 제한합니다.

**가스.** 모든 연산에는 “연산에 필요한 계산 노력”의 단위인 [가스](/ko/glossary/gas/) 비용이 듭니다. 가스는 실행 비용을 매기고 스팸이나 무한 루프로부터 네트워크를 보호합니다([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Since%20each%20transaction%20is%20broadcast,uses%20gas)).

**고유한 강점과 영향력.** EVM의 진정한 해자는 생태계입니다. 암호화폐 분야에서 가장 많이 구현된 VM이며, 수십 개의 L2 솔루션과 독립 체인(Arbitrum, Optimism, Base, Polygon, BNB Chain, Avalanche C-Chain)이 **EVM 호환** 또는 **EVM 등가** 환경을 제공합니다. 따라서 기존 Solidity 컨트랙트, 지갑, 도구를 거의 또는 전혀 변경하지 않고 배포할 수 있습니다.

---

## SVM(Solana/Sealevel)

![여러 차선의 고속도로에서 거래 차량이 병렬로 달리는 모습과 차량이 줄지어 선 단일 차선 도로를 대비해 Solana의 Sealevel 병렬 실행과 순차 실행을 보여 주는 평면 벡터 다이어그램](../../assets/blockchain-virtual-machines-02-parallel-execution.jpg)

Solana의 런타임 **Sealevel**은 대부분의 거래가 서로 겹치지 않는 상태 영역을 다루므로 하나씩 처리하는 대신 동시에 실행할 수 있다는 특정한 판단을 중심으로 설계되었습니다. Solana의 발표는 Sealevel을 “Solana의 병렬 스마트 컨트랙트 런타임”으로 설명하며, “검증자가 사용할 수 있는 만큼의 코어를 활용해 수천 개의 컨트랙트를 병렬로 처리”할 수 있다고 말합니다([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sealevel%E2%80%94Parallel%20Smart%20Contracts%20Runtime)).

**병렬 처리 방식.** Solana 거래는 읽거나 쓸 모든 계정을 미리 선언해야 합니다. 이 선언이 스케줄링을 가능하게 합니다. 런타임은 “대기 중인 수백만 건의 거래를 정렬”하고 “서로 겹치지 않는 모든 거래를 병렬로 스케줄링”할 수 있습니다. 같은 계정을 *읽기만* 하는 여러 거래도 동시에 실행할 수 있습니다([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sort%20millions%20of%20pending%20transactions)). 두 거래는 같은 계정에 대한 접근이 충돌할 때, 즉 적어도 한쪽이 해당 계정에 쓰기를 수행할 때만 서로 직렬화됩니다.

**언어와 VM 내부 구조.** Solana에서 스마트 컨트랙트를 뜻하는 프로그램은 Berkeley Packet Filter 바이트코드의 변형으로 컴파일됩니다. Solana Labs는 온체인 VM에 “Berkeley Packet Filter(BPF) 바이트코드의 변형”을 선택했다고 설명합니다([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Berkeley%20Packet%20Filter)). 프로그램은 대부분 **Rust**로 작성되며 C와 C++도 지원됩니다.

**고유한 강점.** 계정 수준 병렬 처리는 각 컨트랙트 작성자가 직접 구현하는 것이 아니라 런타임의 속성이므로 Solana는 실행을 오프체인으로 옮기지 않고도 높은 처리량을 유지할 수 있습니다. 그 대가로 EVM의 자유로운 저장소와 비교할 때 컨트랙트 작성 방식을 바꾸는 더 엄격한 계정 선언 모델을 따릅니다.

---

## MoveVM(Aptos와 Sui)

![동전이 물리적인 리소스처럼 두 계정 상자 사이에서 손에서 손으로 전달되고, '복사 제한'과 '암묵적 폐기 불가' 보호 배지가 Move의 ability 기반 리소스 모델을 보여 주는 평면 벡터 다이어그램](../../assets/blockchain-virtual-machines-03-move-resource-v2.jpg)

**Move**는 원래 Meta의 Diem 프로젝트를 위해 만들어진 스마트 컨트랙트 언어이며, 지금은 각각 고유한 MoveVM 변형을 실행하는 **Aptos**와 **Sui**의 기반 레이어입니다. Aptos 문서는 Move를 “희소성과 접근 제어를 강조하는 안전하고 보안성 높은 Web3 프로그래밍 언어”라고 설명합니다([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Move%20is%20a%20safe%20and,scarcity%20and%20access%20control)).

**리소스 모델.** Move의 핵심 발상은 디지털 자산을 **리소스**로 취급하는 것입니다. 리소스는 언어의 타입 시스템이 “실수로 복제되거나 폐기될 수 없도록” 보장하는 특별한 구조체 타입입니다([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Resources%20cannot%20be%20copied%2C%20they,structs%20cannot%20be%20accidentally%20duplicated)). Move 리소스로 모델링한 토큰이나 NFT는 그 타입에 `copy` ability가 없으면 복사할 수 없고, `drop` ability가 없으면 암묵적으로 폐기할 수 없으며, 잘못된 사용은 컴파일러가 거부합니다. 다만 해당 타입을 정의한 모듈은 새 값을 패킹할 수 있고, 언패킹해 값을 명시적으로 소모할 수 있으며, 제어된 발행 또는 소각 함수를 노출할 수도 있습니다([Aptos Move ability](https://aptos.dev/en/build/smart-contracts/book/abilities), [Move 구조체와 모듈 권한](https://aptos-labs.github.io/move-book/structs-and-enums.html)). 이 ability 규칙들은 실수로 복사하거나 폐기하는 오류를 막지만, 컨트랙트의 더 넓은 자산 로직이 올바른지까지 증명하거나 모든 이중 지출 및 소각 버그를 배제하지는 않습니다.

**병렬 실행.** Aptos는 **Block-STM**을 통해 Move 컨트랙트를 실행합니다. 문서는 이를 “사용자의 입력 없이 거래를 동시에 실행”할 수 있게 하는 방식이라고 설명합니다. 런타임은 Solana처럼 계정 목록을 선언하도록 요구하는 대신 실행 시점에 어떤 거래가 독립적인지 추론합니다([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Parallelism%20via%20Block,input%20from%20the%20user)).

**Sui의 객체 모델.** Sui는 객체 중심 저장소 레이어를 통해 Move의 리소스 개념을 더 발전시킵니다. “객체는 네트워크 저장소의 기본 단위입니다. 온체인의 모든 리소스, 자산, 데이터 조각은 객체”이며, 계정의 키-값 저장소 안에 존재하는 대신 고유 ID로 주소를 지정할 수 있습니다([Sui 객체 모델](https://docs.sui.io/develop/sui-architecture/object-model)). Sui의 현재 객체 모델은 **주소 소유(address-owned)**, **불변(immutable)**, **합의 주소 소유(consensus-address-owned, party)**, **공유(shared)**, **래핑(wrapped)**의 다섯 가지 소유 형태를 구분합니다. 모든 변경 가능한 객체 입력이 주소 소유이고 나머지 객체 입력이 모두 불변일 때만 거래가 합의 순서 결정 없이 Sui의 직접 fast path를 이용할 수 있습니다. 합의 주소 소유 객체와 공유 객체는 거래가 그 객체를 읽기만 하더라도 합의를 통해 순서화되지만, 충돌하지 않는 읽기 전용 접근은 여전히 동시에 실행될 수 있습니다([Sui 주소 소유 객체](https://docs.sui.io/develop/objects/object-ownership/address-owned), [party 객체](https://docs.sui.io/develop/objects/object-ownership/party), [Lutris 논문](https://docs.sui.io/paper/sui-lutris.pdf)). 따라서 서로 독립적인 fast-path 거래는 모든 객체를 전역 공유 상태로 취급하지 않고도 동시에 처리할 수 있습니다.

**고유한 강점.** Move의 리소스 타입은 `copy` ability 없이 일반 코드가 값을 복사하거나 `drop` ability 없이 스코프에서 사라지게 두는 것을 막습니다. 해당 타입을 정의한 모듈은 여전히 값을 발행할 수 있고 언패킹으로 명시적으로 파괴할 수 있으므로, 이러한 검사만으로 자산 보존이 증명되거나 모든 자산 로직 버그가 제거되는 것은 아닙니다. Aptos와 Sui는 모두 이 안전 모델에 처음부터 병렬 실행을 결합했으며, 나중에 덧붙인 것이 아닙니다.

---

## 이식 가능한 바이트코드 VM(CosmWasm, PolkaVM)

블록체인 전용 바이트코드를 정의하는 대신 이식 가능한 범용 명령 형식을 사용하는 체인도 있습니다. **CosmWasm**은 WebAssembly를 실행하지만, **PolkaVM**은 RISC-V에서 파생된 바이트코드를 실행합니다. 따라서 PolkaVM은 WASM 기반 VM이 아닙니다. WebAssembly 표준은 Wasm을 “스택 기반 가상 머신을 위한 바이너리 명령 형식”이자 “프로그래밍 언어를 위한 이식 가능한 컴파일 대상”으로 설명하며, “네이티브 속도로 실행하는 것을 목표”로 합니다([webassembly.org](https://webassembly.org/#:~:text=WebAssembly%20(abbreviated%20Wasm)%20is%20a,wide%20range%20of%20platforms)). Wasm을 컨트랙트 VM으로 사용하면 Wasm 컴파일 대상을 지원하는 Rust, C, C++, Go 같은 언어는 원칙적으로 배포 가능한 컨트랙트를 만들 수 있습니다.

**CosmWasm.** Cosmos 생태계의 대표적인 Wasm 기반 스마트 컨트랙트 플랫폼인 CosmWasm은 스스로를 “멀티체인 세계를 위한 안전하고 성능이 뛰어나며 상호 운용 가능한 스마트 컨트랙트 플랫폼”이라고 설명합니다([cosmwasm.com](https://www.cosmwasm.com/#:~:text=Secure%2C%20performant%2C%20interoperable%20smart%20contract,platform%20for%20the%20multi%2Dchain%20world)). 컨트랙트는 **Rust**로 작성되어 “고도로 최적화된 Web Assembly 런타임”에서 실행됩니다([cosmwasm.com](https://www.cosmwasm.com/#:~:text=highly%20optimized%20Web%20Assembly%20runtime)). CosmWasm은 Osmosis, Neutron, Injective, Secret Network, Terra를 포함해 수십 개의 Cosmos SDK 체인에 배포되었으며 Cosmos의 기본 IBC 크로스체인 메시징을 물려받습니다.

**PolkaVM.** Polkadot의 최신 스마트 컨트랙트 VM은 다른 길을 택했습니다. 원시 Wasm을 실행하는 대신 Parity는 자체 저장소 설명에 따라 “범용 사용자 수준 RISC-V 기반 가상 머신”인 PolkaVM을 만들었습니다([github.com/paritytech/polkavm](https://github.com/paritytech/polkavm#:~:text=PolkaVM%20is%20a%20general%20purpose,level%20RISC%2DV%20based%20virtual%20machine)). ink! 스마트 컨트랙트 문서에 따르면 그 이유는 성능입니다. RISC-V 실행은 “거래 처리량과 거래 비용에 연관”되며 ink!가 이전에 사용하던 Wasm 인터프리터보다 더 빠르고 저렴한 실행을 제공합니다([use.ink](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/#:~:text=performance%20correlates%20with%20transaction%20throughput)). 특히 “Revive”라는 브랜드의 Polkadot PolkaVM 스택은 EVM 인터프리터 레이어도 제공하므로 Solidity 컨트랙트를 같은 RISC-V 백엔드에서 실행할 수 있습니다.

**고유한 강점.** 이식 가능한 바이트코드 VM은 블록체인 전용 바이트코드를 확립된 범용 컴파일 대상으로 대체합니다. 특히 Rust는 컨트랙트 코드에 강력한 메모리 안전성 보장을 제공하며, Wasm과 RISC-V 모두 훨씬 더 큰 비블록체인 활용 사례를 위해 만들어진 도구의 이점을 누립니다. CosmWasm과 PolkaVM은 서로 다른 아키텍처로, 전자는 Wasm을 실행하고 후자는 RISC-V에서 파생된 바이트코드를 실행합니다.

---

## CairoVM(Starknet)

**Cairo**는 영지식 증명 생성을 위해 특별히 만든 스마트 컨트랙트 언어이자 VM이며, Ethereum [레이어 2](/ko/glossary/layer-2/)인 **Starknet**의 기반입니다. Starknet 문서는 설계 목표를 분명히 설명합니다. “Cairo는 임의 연산에 대한 유효성 증명을 생성할 수 있는 STARK 친화적 폰 노이만 아키텍처”입니다([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Cairo%20is%20a%20STARK,for%20arbitrary%20computations)). “STARK 친화적”이라는 말은 명령어 집합이 “STARK 증명 시스템에 최적화되어 있으면서 다른 증명 시스템 백엔드와도 호환”된다는 뜻입니다([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Being%20STARK,other%20proof%20system%20backends)). 먼저 실행을 위해 설계된 뒤 확장용 증명 시스템을 나중에 덧붙인 EVM이나 SVM과는 우선순위가 반대입니다.

**실행 모델.** Cairo는 대수적 중간 표현의 집합으로 규정된 튜링 완전 명령어 집합인 “Cairo 머신”으로 컴파일됩니다. 따라서 모든 Cairo 프로그램의 실행 추적을 Ethereum L1에서 검증할 수 있는 간결한 STARK 증명으로 바꿀 수 있습니다([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=At%20its%20core%2C%20Cairo%20is,arbitrary%20code%29%20through%20the%20Cairo%20machine)). 이 덕분에 Starknet은 모든 거래를 다시 실행하는 대신 수천 건의 거래를 오프체인에서 배치로 묶고 정확성을 나타내는 압축된 증명 하나를 Ethereum에 게시할 수 있습니다.

**고유한 강점.** 증명 친화성은 Cairo의 초기 설계 제약으로, 명령어 집합과 실행 추적이 효율적인 STARK 증명을 염두에 두고 설계되었습니다. 다만 실제 증명 비용은 프로그램, 증명기 구현, 증명 시스템 매개변수, 비교 대상에 따라 달라지므로 모든 zkEVM 워크로드보다 항상 낮은 것은 아닙니다. 트레이드오프는 Ethereum 출신 개발자에게 Solidity보다 더 새롭고 작은 언어 생태계와 더 가파른 학습 곡선입니다.

---

## 비교표

| VM | 컨트랙트 언어 | 실행/상태 모델 | 병렬 실행 | 생태계 규모 | EVM 호환 |
|---|---|---|---|---|---|
| **EVM** | Solidity, Vyper | 스택 머신, 머클 패트리샤 트라이의 계정/저장소 상태 | 아니요 — 블록 안에서 순차 실행 | 최대 규모, L2와 앱 체인의 기본 대상 | 네이티브 |
| **SVM(Solana)** | Rust, C, C++ | BPF 계열 바이트코드, 선언된 읽기/쓰기 집합을 갖춘 계정 기반 상태 | 예 — Sealevel이 겹치지 않는 거래를 동시에 스케줄링 | 크고 빠르게 성장하며 대부분 Solana 기반 | 아니요(별도 생태계) |
| **MoveVM(Aptos/Sui)** | Move | 리소스 타입 객체, Aptos는 Block-STM을 사용하고 Sui는 직접 경로와 합의 순서 경로가 있는 여러 소유 형태를 사용 | 예 — 런타임에서 추론(Aptos)하거나 객체 소유권 활용(Sui) | 더 작지만 성장 중인 두 개의 독립 Move 생태계 | 아니요 |
| **이식 가능한 바이트코드(CosmWasm, PolkaVM)** | Rust(CosmWasm), Rust/C/RISC-V 툴체인(PolkaVM) | Wasm 바이트코드(CosmWasm) 또는 RISC-V 바이트코드(PolkaVM) | 체인에 따라 다르며 어느 명령 형식에도 보편적인 속성은 아님 | 중간 규모, 여러 Cosmos 체인과 Polkadot 파라체인 집합에 분산 | PolkaVM/Revive는 EVM 인터프리터 레이어 추가, CosmWasm은 EVM 비호환 |
| **CairoVM(Starknet)** | Cairo | STARK 증명을 위해 설계된 튜링 완전 AIR 기반 머신 | 주된 설계 목표가 아님 — 동시 실행이 아니라 증명 가능성에 최적화 | 다섯 개 중 가장 작지만 Starknet L2 활동과 함께 성장 중 | 아니요(zkEVM 프로젝트는 Solidity 컨트랙트를 별도로 브리지) |

---

## 토큰화 도메인과의 관계

어떤 VM을 실행하는지는 [토큰화 도메인](/ko/glossary/tokenized-domain/) 인프라에 직접적인 영향을 줍니다. [NFT](/ko/glossary/nft/)로 표현된 도메인의 기반에는 누가 토큰을 소유하고 무엇을 할 수 있는지 집행하는 스마트 컨트랙트가 있습니다. 이런 로직은 리소스 복사와 암묵적 폐기에 대한 Move의 컴파일 시점 제한에서 이점을 얻으며, EVM의 성숙한 도구를 사용하면 기존 지갑과 마켓플레이스에서 쉽게 감사하고 통합할 수 있습니다. Namefi의 토큰화 모델은 의도적으로 EVM 생태계를 대상으로 합니다. EVM 호환성 덕분에 토큰화된 `.com` 또는 `.ai` 도메인의 소유권 NFT는 새로운 VM마다 별도 통합을 요구하는 대신 기존 EVM 지갑, 마켓플레이스, DeFi 프로토콜 전체에서 즉시 작동합니다. [namefi.io](https://namefi.io)에서 토큰화 도메인을 살펴보세요.

---

## 출처 및 추가 자료

- [이더리움 가상 머신(EVM) — ethereum.org](https://ethereum.org/en/developers/docs/evm/)
- [스마트 컨트랙트 언어 — ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/)
- [Sealevel — 수천 개 스마트 컨트랙트의 병렬 처리 — Solana](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
- [Move — Aptos 문서](https://aptos.dev/en/network/blockchain/move)
- [Move ability — Aptos 문서](https://aptos.dev/en/build/smart-contracts/book/abilities)
- [구조체와 열거형 — Move Book](https://aptos-labs.github.io/move-book/structs-and-enums.html)
- [객체 모델 — Sui 문서](https://docs.sui.io/develop/sui-architecture/object-model)
- [주소 소유 객체 — Sui 문서](https://docs.sui.io/develop/objects/object-ownership/address-owned)
- [Party 객체 — Sui 문서](https://docs.sui.io/develop/objects/object-ownership/party)
- [Sui Lutris](https://docs.sui.io/paper/sui-lutris.pdf)
- [CosmWasm](https://www.cosmwasm.com/)
- [PolkaVM — GitHub(paritytech)](https://github.com/paritytech/polkavm)
- [스마트 컨트랙트를 위한 RISC-V와 PolkaVM — ink! 문서](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/)
- [Cairo 아키텍처 — Cairo 프로그래밍 언어 / Starknet](https://www.starknet.io/cairo-book/ch201-architecture.html)
- [WebAssembly](https://webassembly.org/)
