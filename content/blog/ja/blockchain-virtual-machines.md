---
title: "主要なブロックチェーン仮想マシン：EVM、SVM、MoveVM、WebAssembly／RISC-V、CairoVM"
date: '2026-07-02'
language: ja
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 30
format: roundup
description: EVM、SVM、MoveVM、WebAssemblyおよびRISC-V VM、CairoVMという主要なブロックチェーン仮想マシンを、言語、実行モデル、エコシステムの観点から比較するガイドです。
ogImage: ../../assets/blockchain-virtual-machines-og.jpg
keywords: ['ブロックチェーン仮想マシン', 'ブロックチェーンVM', 'EVM', 'Ethereum仮想マシン', 'SVM', 'Solana仮想マシン', 'Sealevel', 'MoveVM', 'Move言語', 'WASMブロックチェーン', 'CosmWasm', 'PolkaVM', 'CairoVM', 'Cairo言語', 'Starknet', 'スマートコントラクト言語', 'ブロックチェーン並列実行', 'EVM互換', 'ブロックチェーン実行環境', 'ブロックチェーン状態マシン']
relatedArticles:
  - /ja/blog/blockchain-consensus-mechanisms/
  - /ja/blog/blockchain-scaling-approaches/
  - /ja/blog/blockchain-cryptographic-primitives/
  - /ja/blog/blockchain-privacy-technologies/
  - /ja/blog/what-are-tokenized-domains/
relatedTopics:
  - /ja/topics/web3-foundations/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/tokenize-your-com/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/ethereum-virtual-machine/
  - /ja/glossary/webassembly/
  - /ja/glossary/smart-contract/
  - /ja/glossary/ethereum/
  - /ja/glossary/gas/
---

すべての[スマートコントラクト](/ja/glossary/smart-contract/)は、どこかで実行される必要があります。その「どこか」がブロックチェーン仮想マシン（VM）です。ネットワーク上の全ノードが同一の方法で実行するサンドボックス化されたプログラムであり、誰が実行しても同じ入力から常に同じ出力が得られます。どのVM上に構築するかは、チェーンのほぼあらゆる側面を形作ります。使用できる言語、トランザクションを同時に実行できるか一つずつしか実行できないか、既存の開発者エコシステムを初日からどこまで活用できるかが変わります。

本ガイドでは、現在の[Web3](/ja/glossary/web3/)におけるスマートコントラクト活動の多くを支える五つのVMファミリーを取り上げます。[Ethereum仮想マシン](/ja/glossary/ethereum-virtual-machine/)（EVM）、SolanaのSVM、AptosとSuiが採用するMoveVM、ポータブルバイトコードVM（[WebAssembly](/ja/glossary/webassembly/)を使うCosmWasmやRISC-Vを使うPolkaVMなど）、StarknetのCairoVMです。

---

## ブロックチェーン仮想マシンとは何か、なぜ重要なのか

ブロックチェーンVMは、決定論的でサンドボックス化された実行環境です。すべてのフルノードが同じトランザクションをダウンロードし、同じVMで実行して、結果として同一の[オンチェーン](/ja/glossary/on-chain/)状態に到達します。Ethereumの公式ドキュメントはEVMを「すべてのEthereumノードでコードを一貫して安全に実行する分散型仮想環境」と説明しています（[ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20is%20a%20decentralized,mechanics%20of%20how%20they%20work)）。この説明は、本ガイドのすべてのVMに当てはまります。

VM設計のトレードオフは、二つの特性によって決まります。

- **言語とツールチェーン。** 開発者はどの言語でコントラクトを書けるのか、監査済みコードやツールの既存ライブラリはどれほど充実しているのか、すでにその技術を知る人材はどれほど多いのか、という点です。
- **実行モデル。** VMはトランザクションを厳密に一つずつ順次処理するのか、それとも独立したトランザクションを複数のCPUコアで同時に実行できるのか、という点です。逐次実行は推論しやすい一方、並列実行は理論上のスループットを高めますが、スケジューリングの複雑さが加わります。

こうした選択は、ガスコスト、混雑時の挙動、書き直さずに移植できる既存コントラクトやツールにまで波及します。だからこそ、新しいチェーンや、その上に構築される[トークン化](/ja/glossary/tokenize/)資産が最初に答えるべき問いの一つが「どのVMか」なのです。

---

## EVM（Ethereum Virtual Machine）

![命令ポインターが垂直スタックへ値をプッシュ、ポップし、ガスメーターのダイヤルが実行コストを追跡する単一レーンのスタックマシンとしてEVMを示すフラットベクター図](../../assets/blockchain-virtual-machines-01-evm-stack.jpg)

EVMは2015年に[イーサリアム](/ja/glossary/ethereum/)とともに導入され、現在では最も広く展開されているスマートコントラクトVMの一つです。EVMは**スタックベース**のマシンです。Ethereumのドキュメントによると、「深さ1024項目のスタックマシン」として動作し、各項目は256ビットのワードです（[ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20executes%20as%20a,256%2Dbit%20word)）。コントラクトの状態は各アカウントに関連付けられたマークル・パトリシア・トライに保存され、チェーン全体の状態も同様に、すべてのアカウントをハッシュで結ぶ修正版マークル・パトリシア・トライとして構成されます（[ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Ethereum%20uses%20a%20modified%20Merkle,linked%20by%20hashes)）。

**言語。** コントラクトはほぼ常に**Solidity**で記述されます。Ethereumの公式ドキュメントはSolidityを、C++の構文から強い影響を受けた「スマートコントラクト実装用のオブジェクト指向高水準言語」と説明しています（[ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Solidity)）。主な代替言語は、コントラクトを監査しやすくするため意図的に機能を絞った「Python風」の**Vyper**です（[ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Vyper)）。

**実行モデル。** EVMはブロック内のトランザクションを、固定された順序で一つずつ**逐次的に**処理します。これにより状態遷移ロジックは単純で監査しやすくなりますが、ベースレイヤーのスループットには上限が生じます。

**ガス。** すべての演算には[ガス](/ja/glossary/gas/)が必要です。ガスはEthereumにおける「演算に必要な計算量」の単位で、実行に価格を付け、スパムや無限ループからネットワークを保護します（[ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Since%20each%20transaction%20is%20broadcast,uses%20gas)）。

**固有の強みと広がり。** EVMの本当の競争優位は、そのエコシステムです。暗号資産分野で最も多く実装されているVMであり、数十のL2ソリューションや独立チェーン（Arbitrum、Optimism、Base、Polygon、BNB Chain、Avalanche C-Chain）が**EVM互換**または**EVM等価**の環境を提供しています。そのため、既存のSolidityコントラクト、ウォレット、ツールをほとんど、あるいはまったく変更せずに展開できます。

---

## SVM（Solana／Sealevel）

![複数レーンの高速道路をトランザクションの車が並列に走る様子と、車が列を作る単一レーンの道路を対比し、SolanaのSealevelによる並列実行と逐次実行を示すフラットベクター図](../../assets/blockchain-virtual-machines-02-parallel-execution.jpg)

Solanaのランタイム**Sealevel**は、ほとんどのトランザクションが互いに重ならない状態領域に触れるため、一つずつではなく同時に実行できるという設計思想を中核にしています。Solanaの発表では、Sealevelを「Solanaの並列スマートコントラクトランタイム」と説明し、「バリデーターが利用できる数だけコアを使い、数千のコントラクトを並列処理」できるとしています（[solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sealevel%E2%80%94Parallel%20Smart%20Contracts%20Runtime)）。

**並列化の仕組み。** Solanaのトランザクションは、読み取りまたは書き込みを行うすべてのアカウントを事前に宣言しなければなりません。この宣言によってスケジューリングが可能になります。ランタイムは「保留中の数百万件のトランザクションを並べ替え」、「重複しないすべてのトランザクションを並列にスケジュール」できます。同じアカウントを*読み取るだけ*の複数トランザクションも同時に実行できます（[solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sort%20millions%20of%20pending%20transactions)）。二つのトランザクションは、同じアカウントへのアクセスが競合し、少なくとも一方がそのアカウントに書き込む場合にのみ互いに直列化されます。

**言語とVM内部。** Solanaでスマートコントラクトを意味する「プログラム」は、Berkeley Packet Filterバイトコードの変種へコンパイルされます。Solana Labsは、オンチェーンVMに「Berkeley Packet Filter（BPF）バイトコードの変種」を選んだと説明しています（[solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Berkeley%20Packet%20Filter)）。プログラムは主に**Rust**で記述され、CとC++にも対応しています。

**固有の強み。** アカウント単位の並列性は、各コントラクト作成者が手作業で実装するものではなくランタイムの特性です。そのためSolanaは実行をオフチェーンへ移さずに高いスループットを維持できます。その代わり、EVMの自由形式のストレージと比べ、コントラクトの書き方を変える、より厳格なアカウント宣言モデルが必要です。

---

## MoveVM（AptosとSui）

![コインが物理的なリソースとして二つのアカウントボックス間を手渡され、「コピー制限」と「暗黙的な破棄なし」の保護バッジによってMoveのabilityで制御されるリソースモデルを示すフラットベクター図](../../assets/blockchain-virtual-machines-03-move-resource-v2.jpg)

**Move**は、もともとMetaのDiemプロジェクト向けに開発されたスマートコントラクト言語で、現在はそれぞれ独自のMoveVM変種を実行する**Aptos**と**Sui**のベースレイヤーです。AptosのドキュメントはMoveを「希少性とアクセス制御を重視した、安全でセキュアなWeb3プログラミング言語」と説明しています（[aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Move%20is%20a%20safe%20and,scarcity%20and%20access%20control)）。

**リソースモデル。** Moveの中核的な考え方は、デジタル資産を**リソース**として扱うことです。リソースとは、言語の型システムによって「誤って複製または破棄されない」ことが保証された特別な構造体型です（[aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Resources%20cannot%20be%20copied%2C%20they,structs%20cannot%20be%20accidentally%20duplicated)）。Moveリソースとしてモデル化されたトークンやNFTは、その型が`copy` abilityを持つ場合に限って複製でき、`drop` abilityを持つ場合に限って暗黙的に破棄できます。コンパイラーは不正な使用を拒否します。ただし、その型を定義するモジュールは、新しい値をパックして作成し、アンパックして明示的に消費できるほか、制御されたmint関数やburn関数を公開できます（[AptosのMove ability](https://aptos.dev/en/build/smart-contracts/book/abilities)、[Moveの構造体とモジュール権限](https://aptos-labs.github.io/move-book/structs-and-enums.html)）。これらのabilityが防ぐのは意図しない複製や破棄のエラーであり、コントラクトの資産ロジック全体の正しさを証明したり、二重支払いやburnに関するあらゆるバグを排除したりするものではありません。

**並列実行。** Aptosは**Block-STM**を通じてMoveコントラクトを実行します。ドキュメントはこれを「ユーザーからの入力なしでトランザクションを並行実行」できる仕組みと説明しています。ランタイムは、Solanaのようにアカウントリストの宣言を求めるのではなく、実行時にどのトランザクションが独立しているかを推論します（[aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Parallelism%20via%20Block,input%20from%20the%20user)）。

**Suiのオブジェクトモデル。** Suiはオブジェクト中心のストレージレイヤーによって、Moveのリソースという考え方をさらに発展させています。「オブジェクトはネットワーク上のストレージの基本単位です。オンチェーン上のあらゆるリソース、資産、データ片はオブジェクト」であり、アカウントのキー・バリューストア内に置かれるのではなく、一意のIDでアドレス指定できます（[Suiのオブジェクトモデル](https://docs.sui.io/develop/sui-architecture/object-model)）。現行のSuiオブジェクトモデルには、**アドレス所有**、**イミュータブル**、**コンセンサス・アドレス所有**（party）、**共有**、**ラップ済み**という五つの所有形態があります。トランザクションがコンセンサスによる順序付けを経ずにSuiの直接ファストパスを使えるのは、可変の入力オブジェクトがすべてアドレス所有で、その他の入力オブジェクトがすべてイミュータブルの場合に限られます。コンセンサス・アドレス所有オブジェクトと共有オブジェクトは、トランザクションが読み取りしか行わない場合でもコンセンサスによって順序付けされますが、競合しない読み取り専用アクセスは引き続き並行実行できます（[Suiのアドレス所有オブジェクト](https://docs.sui.io/develop/objects/object-ownership/address-owned)、[partyオブジェクト](https://docs.sui.io/develop/objects/object-ownership/party)、[Lutris論文](https://docs.sui.io/paper/sui-lutris.pdf)）。そのため、独立したファストパス・トランザクションは、すべてのオブジェクトをグローバル共有状態とみなすことなく、並行処理できます。

**固有の強み。** Moveのリソース型は、汎用コードが`copy` abilityのない値を複製したり、`drop` abilityのない値をスコープから暗黙的に破棄したりすることを防ぎます。その型を定義するモジュールは、依然として新しい値をmintし、アンパックして明示的に破棄できるため、これらのチェックだけで資産保存を証明したり、あらゆる資産ロジックのバグを排除したりできるわけではありません。AptosとSuiはいずれも、この安全モデルと、後付けではなく当初から設計された並列実行を組み合わせています。

---

## ポータブルバイトコードVM（CosmWasm、PolkaVM）

ブロックチェーン固有のバイトコードを定義する代わりに、ポータブルで汎用的な命令形式を使用するチェーンもあります。**CosmWasm**はWebAssemblyを実行する一方、**PolkaVM**はRISC-V由来のバイトコードを実行します。したがって、PolkaVMはWASMベースのVMではありません。WebAssembly標準はWasmを「スタックベースの仮想マシン用バイナリー命令形式」であり、「プログラミング言語のポータブルなコンパイルターゲット」として設計され、「ネイティブ速度での実行を目指す」ものと説明しています（[webassembly.org](https://webassembly.org/#:~:text=WebAssembly%20(abbreviated%20Wasm)%20is%20a,wide%20range%20of%20platforms)）。WasmをコントラクトVMとして使用すれば、Wasmをコンパイルターゲットに持つRust、C、C++、Goなどの言語は、原理上、デプロイ可能なコントラクトを生成できます。

**CosmWasm。** Cosmosエコシステムで主流のWasmベーススマートコントラクトプラットフォームであるCosmWasmは、自らを「マルチチェーン世界のための、安全で高性能かつ相互運用可能なスマートコントラクトプラットフォーム」と説明しています（[cosmwasm.com](https://www.cosmwasm.com/#:~:text=Secure%2C%20performant%2C%20interoperable%20smart%20contract,platform%20for%20the%20multi%2Dchain%20world)）。コントラクトは**Rust**で記述され、「高度に最適化されたWeb Assemblyランタイム」上で実行されます（[cosmwasm.com](https://www.cosmwasm.com/#:~:text=highly%20optimized%20Web%20Assembly%20runtime)）。CosmWasmはOsmosis、Neutron、Injective、Secret Network、Terraを含む数十のCosmos SDKチェーンに導入され、CosmosネイティブのIBCクロスチェーンメッセージングを継承します。

**PolkaVM。** Polkadotの新しいスマートコントラクトVMは、別の道を選びました。生のWasmを実行する代わりに、Parityは自身のリポジトリの説明にある「汎用ユーザーレベルのRISC-Vベース仮想マシン」としてPolkaVMを構築しました（[github.com/paritytech/polkavm](https://github.com/paritytech/polkavm#:~:text=PolkaVM%20is%20a%20general%20purpose,level%20RISC%2DV%20based%20virtual%20machine)）。ink!のスマートコントラクトドキュメントによれば、その理由は性能です。RISC-V実行は「トランザクションのスループットとトランザクションコストに相関」し、ink!が以前使用していたWasmインタープリターより高速で低コストな実行を実現します（[use.ink](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/#:~:text=performance%20correlates%20with%20transaction%20throughput)）。特に、「Revive」と名付けられたPolkadotのPolkaVMスタックはEVMインタープリターレイヤーも提供し、Solidityコントラクトを同じRISC-Vバックエンド上で実行できます。

**固有の強み。** ポータブルバイトコードVMは、ブロックチェーン固有のバイトコードを、確立された汎用コンパイルターゲットに置き換えます。特にRustはコントラクトコードに強力なメモリ安全性の保証をもたらし、WasmとRISC-Vはいずれも、はるかに大規模な非ブロックチェーン用途向けに構築されたツールの恩恵を受けます。CosmWasmとPolkaVMは異なるアーキテクチャであり、前者はWasm、後者はRISC-V由来のバイトコードを実行します。

---

## CairoVM（Starknet）

**Cairo**はゼロ知識証明の生成に特化して構築されたスマートコントラクト言語兼VMであり、Ethereumの[レイヤー2](/ja/glossary/layer-2/)である**Starknet**を支えています。Starknetの公式ドキュメントは、設計目標を明確に示しています。「Cairoは、任意の計算に対する有効性証明を生成できるSTARKフレンドリーなフォン・ノイマン型アーキテクチャ」です（[starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Cairo%20is%20a%20STARK,for%20arbitrary%20computations)）。「STARKフレンドリー」とは、命令セットが「STARK証明システム向けに最適化されながら、他の証明システムのバックエンドとも互換性を保つ」ことを意味します（[starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Being%20STARK,other%20proof%20system%20backends)）。これは、まず実行のために設計され、後からスケーリング用の証明システムを追加されたEVMやSVMとは逆の優先順位です。

**実行モデル。** Cairoは、代数的中間表現の集合として定義されるチューリング完全な命令セット「Cairoマシン」へコンパイルされます。そのため、あらゆるCairoプログラムの実行トレースを、Ethereum L1上で検証可能な簡潔なSTARK証明へ変換できます（[starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=At%20its%20core%2C%20Cairo%20is,arbitrary%20code%29%20through%20the%20Cairo%20machine)）。これによりStarknetは、すべてのトランザクションを再実行する代わりに、数千件のトランザクションをオフチェーンでバッチ化し、正しさを示す一つのコンパクトな証明をEthereumへ投稿できます。

**固有の強み。** 証明しやすさはCairoの当初からの設計制約であり、その命令セットと実行トレースは効率的なSTARK証明を念頭に設計されています。ただし、実際の証明コストはプログラム、証明器の実装、証明システムのパラメータ、比較対象によって異なるため、あらゆるzkEVMワークロードより常に低いわけではありません。トレードオフは、Ethereum出身の開発者にとって、Solidityより新しく小規模な言語エコシステムと、より険しい学習曲線です。

---

## 比較表

| VM | コントラクト言語 | 実行／状態モデル | 並列実行 | エコシステム規模 | EVM互換 |
|---|---|---|---|---|---|
| **EVM** | Solidity, Vyper | スタックマシン、マークル・パトリシア・トライ内のアカウント／ストレージ状態 | いいえ — ブロック内で逐次実行 | 最大規模、L2とアプリチェーンの標準ターゲット | ネイティブ |
| **SVM（Solana）** | Rust, C, C++ | BPF派生バイトコード、宣言された読み取り／書き込み集合を持つアカウントベース状態 | はい — Sealevelが重複しないトランザクションを同時にスケジュール | 大規模で急成長中、主にSolanaネイティブ | いいえ（別エコシステム） |
| **MoveVM（Aptos／Sui）** | Move | リソース型オブジェクト、AptosはBlock-STM、Suiは複数の所有形態と直接パス／コンセンサス順序付けパスを使用 | はい — 実行時に推論（Aptos）またはオブジェクト所有権を利用（Sui） | 小規模だが成長中の、独立した二つのMoveエコシステム | いいえ |
| **ポータブルバイトコード（CosmWasm、PolkaVM）** | Rust（CosmWasm）、Rust／C／RISC-Vツールチェーン（PolkaVM） | Wasmバイトコード（CosmWasm）またはRISC-Vバイトコード（PolkaVM） | チェーンによる。いずれの命令形式にも普遍的な特性ではない | 中規模、多数のCosmosチェーンとPolkadotパラチェーン群に分散 | PolkaVM／ReviveはEVMインタープリターレイヤーを追加、CosmWasmはEVM非互換 |
| **CairoVM（Starknet）** | Cairo | STARK証明向けに設計されたチューリング完全なAIRベースマシン | 主な設計目標ではない — 並行性ではなく証明可能性に最適化 | 五つの中で最小だが、StarknetのL2活動とともに成長中 | いいえ（zkEVMプロジェクトはSolidityコントラクトを別途ブリッジ） |

---

## トークン化ドメインとの関係

チェーンがどのVMを実行するかは、[トークン化ドメイン](/ja/glossary/tokenized-domain/)のインフラに直接影響します。[NFT](/ja/glossary/nft/)として表現されたドメインの基盤には、トークンの所有者と、その所有者が実行できる操作を規定するスマートコントラクトがあります。このロジックは、リソースの複製と暗黙的な破棄に対するMoveのコンパイル時制限の恩恵を受ける一方、EVMの成熟したツールによって監査しやすく、既存のウォレットやマーケットプレイスとも統合しやすくなります。Namefiのトークン化モデルは意図的にEVMエコシステムを対象としています。EVM互換性があるため、トークン化された`.com`または`.ai`ドメインの所有権NFTは、新しいVMごとに専用統合を必要とせず、既存のEVMウォレット、マーケットプレイス、DeFiプロトコル群ですぐに利用できます。[namefi.io](https://namefi.io)でトークン化ドメインをご覧ください。

---

## 出典と参考資料

- [Ethereum仮想マシン（EVM）— ethereum.org](https://ethereum.org/en/developers/docs/evm/)
- [スマートコントラクト言語 — ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/)
- [Sealevel — 数千のスマートコントラクトを並列処理 — Solana](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
- [Move — Aptosドキュメント](https://aptos.dev/en/network/blockchain/move)
- [Move Ability — Aptosドキュメント](https://aptos.dev/en/build/smart-contracts/book/abilities)
- [構造体と列挙型 — Move Book](https://aptos-labs.github.io/move-book/structs-and-enums.html)
- [オブジェクトモデル — Suiドキュメント](https://docs.sui.io/develop/sui-architecture/object-model)
- [アドレス所有オブジェクト — Suiドキュメント](https://docs.sui.io/develop/objects/object-ownership/address-owned)
- [Partyオブジェクト — Suiドキュメント](https://docs.sui.io/develop/objects/object-ownership/party)
- [Sui Lutris](https://docs.sui.io/paper/sui-lutris.pdf)
- [CosmWasm](https://www.cosmwasm.com/)
- [PolkaVM — GitHub（paritytech）](https://github.com/paritytech/polkavm)
- [スマートコントラクトにRISC-VとPolkaVMを使う理由 — ink!ドキュメント](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/)
- [Cairoアーキテクチャ — Cairoプログラミング言語／Starknet](https://www.starknet.io/cairo-book/ch201-architecture.html)
- [WebAssembly](https://webassembly.org/)
