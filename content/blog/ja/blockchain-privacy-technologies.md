---
title: "ブロックチェーンの主要プライバシー技術：ゼロ知識証明、FHE、MPC、TEE、リング署名"
date: '2026-07-02'
language: ja
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 50
format: roundup
description: ゼロ知識証明、FHE、MPC、TEE、リング署名という、ブロックチェーンを代表する5つのプライバシー技術を横並びで比較する平易なガイドです。
ogImage: ../../assets/blockchain-privacy-technologies-og.jpg
keywords: ['ブロックチェーンのプライバシー', 'ゼロ知識証明', 'zkp', '完全準同型暗号', 'fhe', 'セキュアマルチパーティ計算', 'mpc', '信頼実行環境', 'tee', 'リング署名', 'ステルスアドレス', 'monero', 'zcash', 'zksync', 'starknet', 'プライバシー技術', 'コンフィデンシャルコンピューティング', 'オンチェーンプライバシー', 'ブロックチェーン暗号技術', 'プライバシーコイン']
relatedArticles:
  - /ja/blog/blockchain-cryptographic-primitives/
  - /ja/blog/blockchain-scaling-approaches/
  - /ja/blog/blockchain-virtual-machines/
  - /ja/blog/blockchain-consensus-mechanisms/
  - /ja/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /ja/glossary/zero-knowledge-proof/
  - /ja/glossary/fully-homomorphic-encryption/
  - /ja/glossary/secure-multiparty-computation/
  - /ja/glossary/trusted-execution-environment/
  - /ja/glossary/cryptographic-security/
relatedTopics:
  - /ja/topics/web3-foundations/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/tokenize-your-com/
  - /ja/series/domain-flipping-skills/
---

公開[ブロックチェーン](/ja/glossary/blockchain/)上のトランザクションは、デフォルトでは見ようとする誰にでも見えます。残高、送金額、取引相手は、公開台帳に永久に記録されます。この透明性はブロックチェーンの信頼性を支える一方で、弱点にもなります。顧客の残高を公開する銀行はなく、仕入先への支払いや給与支払いを競合他社に読まれたい企業もありません。

ブロックチェーンのプライバシー技術は、検証可能性、分散性、信頼できる仲介者なしに見知らぬ相手と取引できる能力といった、チェーンを有用にする性質を手放さずに、この隔たりを埋めるために存在します。現在の主流は、[ゼロ知識証明](/ja/glossary/zero-knowledge-proof/)、[完全準同型暗号](/ja/glossary/fully-homomorphic-encryption/)（FHE）、[セキュアマルチパーティ計算](/ja/glossary/secure-multiparty-computation/)（MPC）、[信頼実行環境](/ja/glossary/trusted-execution-environment/)（TEE）、そしてリング署名とステルスアドレスという5つの技術です。それぞれが隠す対象も、前提とする信頼も、必要な計算量も異なります。本ガイドでは5つすべてを解説して比較し、[Web3](/ja/glossary/web3/)を構築する人にも、単に学ぶ人にも、その選択が重要な理由を説明します。

---

## ゼロ知識証明

![証明者が非公開の証人を背後に隠したまま、光る有効証明バッジを検証者に渡し、ゼロ知識証明が秘密を明かさずに公開命題を検証する仕組みを表している](../../assets/blockchain-privacy-technologies-01-zero-knowledge.jpg)

[ゼロ知識証明](/ja/glossary/zero-knowledge-proof/)（ZKP）とは、一方の当事者である*証明者*が、もう一方の*検証者*に対し、公開命題が真であることを、その命題とその成立からすでに導かれる以上の情報、とりわけ証明に使った秘密の*証人*を明かさずに納得させる仕組みです。たとえば「`x` を知っており、`H(x) = y` を満たす」という主張では、通常、検証者には命題と公開値 `y` が見え、ゼロ知識性が保護するのは `x` です。アプリケーションは公開入力の一部を別途隠したりコミットしたりできますが、命題そのものを隠すことはZKPの一般的な定義には含まれません（[Thaler、*Proofs, Arguments, and Zero-Knowledge*](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html)）。

証明システムがゼロ知識プロトコルとして成立するには、3つの性質を満たす必要があります。完全性（誠実な検証者は真の主張を受理する）、健全性（不正な証明者は、証明システムで定められた誤り確率を除き、誠実な検証者に偽の主張を受理させられない）、そしてゼロ知識性（公開命題から導かれる範囲を超えて、証明が秘密の証人に関する追加知識を明かさない）です。古典的な対話型プロトコルでは、コミットメント、検証者のチャレンジ、証明者のレスポンスがよく用いられます。現代の非対話型SNARKやSTARKは、検証者からリアルタイムでチャレンジを受けることなく必要な証明データをまとめつつ、完全性、健全性、ゼロ知識性という同じ大枠の目標を保ちます。

**隠すもの：** 秘密データや非公開の計算入力など、秘密の証人です。アプリケーションが別途コミットまたは暗号化しない限り、公開命題と公開入力は見えたままです。

**現在の用途：** ブロックチェーンのスケーリングにおいて、ZKPの最大の実用例はZKロールアップです。トランザクションを「オフチェーンで実行するバッチにまとめ（すなわち『ロールアップ』し）」、単一の妥当性証明を生成します。Ethereumは、バッチによる状態変更を確定する前にその証明を検証します（[ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20bundle%20)）。Matter Labsが開発したzkSync Eraは、「独自のzkEVMを利用するEVM互換ZKロールアップ」です（[ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)）。一方、StarkWareが開発したStarknetは、EVMではなく独自のCairo VMを実行する妥当性ロールアップです（Solidityコントラクトは別途ブリッジされます）。L2BEATは両者を、オプティミスティックロールアップの不正証明チャレンジ期間ではなく、妥当性証明によって保護されるロールアップとして追跡しています（[l2beat.com](https://l2beat.com/scaling/summary)）。プライバシーの分野では、[Zcash](https://z.cash/technology/)がシールドトランザクションにzk-SNARK（Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge）を先駆けて採用しました。これにより、「ユーザーのアドレスや取引額」などの詳細を暗号化したまま、ネットワークはトランザクションが有効であることを確認できます（[z.cash](https://z.cash/technology/)）。

**トレードオフ：** ZK証明の生成は計算負荷が高く、証明回路はバッチ内のすべてのトランザクションを走査して検査を再実行します。そのため、オンチェーンでの検証は安価かつ高速でも、証明時間とハードウェアコストが現実的な制約になります。セキュリティは、証明システムの暗号学的前提、安全なパラメータ生成、回路とプロトコルの正しい実装に依存します。一部の証明システムでは、一度限りのトラステッドセットアップ・セレモニーも必要です。Ethereumのドキュメントは、セットアップのエントロピーが侵害されると偽の証明が可能になり、実装エラーはセキュリティモデルを損なう可能性があると指摘しています（[ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/#trust-assumptions)）。

---

## 完全準同型暗号（FHE）

![鍵のないクラウドサーバーが操作する計算装置を、施錠された箱が通過し、計算結果を収めたまま施錠された状態で出てくる様子で、暗号化データを直接計算する仕組みを表している](../../assets/blockchain-privacy-technologies-02-fhe.jpg)

[完全準同型暗号](/ja/glossary/fully-homomorphic-encryption/)は異なるアプローチを取ります。隠されたデータについて事実を証明するのではなく、*暗号化データを直接計算*し、その結果を復号すると、平文を計算した場合と同じ答えになる暗号化結果を得られます。FHEの研究とインフラストラクチャを主導する企業の一つであるZamaは、「FHEは復号せずにデータを処理できるため、企業はユーザーデータにアクセスせずにサービスを提供でき、ユーザーは変わらない機能を利用できる」と説明しています（[zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)）。

**隠すもの：** 計算の生の入力、中間状態、出力です。計算を実行する当事者を含め、鍵の保持者以外には暗号文しか見えません。

**大まかな仕組み：** FHE方式は、格子に基づく数学を用いて平文の値を暗号文に符号化し、暗号化された加算と乗算に相当する演算を定義することで、暗号文上で任意の回路を実行できるようにします。ブロックチェーンに適用すると、スマートコントラクトは関係する金額を一度も見ることなく、トークンを移動したりロジックを評価したりできます。Zamaの例では、「ブロックチェーンは実際の金額を一度も見ることなく、Aliceに十分な資金があることを検証」します（[zama.org](https://www.zama.org/introduction-to-homomorphic-encryption#:~:text=The%20blockchain%20verified%20Alice%20has%20sufficient%20funds%20without%20ever%20seeing%20the%20actual%20amounts)）。Zamaはさらに、格子ベースのFHE方式は「本質的に耐量子性を備える」と述べています。これは暗号技術の長期的なリスクを考える人にとって重要です（[zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)）。

**プロジェクト例：** [Zama](https://www.zama.org/)は、オープンソースのFHEライブラリ（TFHE-rs、Concrete）と、EVMチェーンに機密スマートコントラクト実行を加えるfhEVMを開発しています。[Fhenix](https://cofhe-docs.fhenix.zone/)は、「完全準同型暗号を使って、開発者がプライバシー保護型スマートコントラクトを構築」し、「機密データを計算中も暗号化された状態に保つ」ことに特化したブロックチェーンです。クライアント側暗号化用のJavaScriptライブラリ（Cofhejs）と、オンチェーンの暗号化演算用Solidity FHEライブラリを提供しています（[cofhe-docs.fhenix.zone](https://cofhe-docs.fhenix.zone/)）。

**トレードオフ：** FHEの特徴的な保証は、対応する計算を入力や中間値を復号せずに実行できることです。ただし、具体的なセキュリティは方式とパラメータの選択に依存します。そのため、HomomorphicEncryption.orgは方式ごとのセキュリティ表とパラメータ選択のガイダンスを公開しています（[HomomorphicEncryption.org](https://homomorphicencryption.org/security-guidelines/)）。また、FHEはこの一覧の中で、平文での実行と比べて群を抜いて計算コストが高いアプローチです。そのため、現在のFHEベースチェーンは、すべてのトランザクションではなく機密性が重要なロジックにFHEを使っており、FHEのハードウェア高速化をめぐる研究競争も活発です。

---

## セキュアマルチパーティ計算（MPC）

![3人がパズルのピース状の鍵の断片を1つずつ持ち、破線で単一の署名済みトランザクションにつながっており、誰も秘密の全体を見ずに共同結果を生成するセキュアマルチパーティ計算を表している](../../assets/blockchain-privacy-technologies-03-mpc.jpg)

[セキュアマルチパーティ計算](/ja/glossary/secure-multiparty-computation/)は、関連はしていても別の問題を解決します。1人の当事者が暗号化データを計算するのではなく、それぞれが入力の非公開部分を持つ*複数*の当事者が、個々の入力を互いに明かさず、共同で関数を計算します。形式的な定義では、MPCは「複数の当事者が入力を非公開に保ちながら、それらの入力に対する関数を共同で計算する方法の構築を目的とする暗号学の一分野」です。3人の参加者なら、「Alice、Bob、Charlieは、誰が何を入力したかを明かさずにF(x, y, z)を知る」ことができます（[Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation#:~:text=Secure%20multi%2Dparty%20computation%20)）。

**隠すもの：** 各当事者の個別の入力を、ほかのすべての当事者から隠します。明らかになるのは合意された出力だけで、秘密全体を見る参加者は1人もいません。

**信頼の前提：** あらゆるMPCに共通する不正参加者数の閾値はありません。完全接続ネットワークを想定した古典的なBGWの結果では、受動的な不正に対する秘匿性は `t < n/2`、ビザンチン障害に対する堅牢性は `t < n/3` で成立します（[ACM](https://doi.org/10.1145/62212.62213)）。これらの上限はそのプロトコルモデルを説明するものであり、すべてのMPCに当てはまるものではありません。完全セキュアなプロトコルは、ブロードキャストを仮定すると `t < n/2` まで対応できます（[TCC 2021](https://www.iacr.org/archive/tcc2021/130420196/130420196.pdf)）。一方、計算量的安全性に基づくSPDZプロトコルは、前処理モデルで `n - 1` 人までの不正参加者に対する能動的セキュリティを提供します（[IACR](https://eprint.iacr.org/2011/535)）。この不正多数派への保証はアボート付きセキュリティであり、不正参加者は依然として計算を停止できます。したがって、公平性や出力保証まで提供するものではありません（[PoPETs](https://petsymposium.org/popets/2024/popets-2024-0053.php)）。そのため、具体的なデプロイでは、プロトコル、受動的または能動的な不正モデル、同期性と通信チャネル／セットアップの前提（ブロードキャストを含む）、誠実多数派と不正多数派のどちらを仮定するかを明記する必要があります。

**現在の用途 — 閾値署名カストディ：** ブロックチェーンにおけるMPCの最も目立つ用途は、秘密鍵を独立した複数の当事者に分割し、単一のデバイスや人物が鍵全体を保持することを防ぐ仕組みです。カストディインフラ事業者のFireblocksは、「マルチパーティ計算（MPC）は、秘密鍵を個別のシェアに分割し、独立した複数の当事者に分配する暗号手法」であり、重要な点として「完全な鍵は、いかなる時点でも1か所に組み立てられることがない」と説明しています（[fireblocks.com](https://www.fireblocks.com/what-is-mpc#:~:text=Multi%2Dparty%20computation%20)）。トランザクションへの署名が必要になると、定足数を満たすエンドポイントがそれぞれトランザクションを検証し、部分署名を提供します。「秘密鍵が組み立てられることは一切ない」ため、「1つのエンドポイントが侵害されても、ほかの場所に保持された鍵シェアは単独では役に立ちません」（[fireblocks.com](https://www.fireblocks.com/what-is-mpc)）。現在、この閾値署名パターンは、大部分の機関向け暗号資産カストディと、多くのマルチシグウォレットを支えています。

**トレードオフ：** MPCは、単一の秘密鍵を1台のデバイスに置くことによる単一障害点を避けられますが、当事者間の通信ラウンドによる遅延を加え、慎重なプロトコル設計を必要とします。その保証の強さは、選択したプロトコルの暗号学的前提、不正参加者に関する前提、ネットワークの前提、そして当事者の運用上の独立性に依存します。MPCは単独の鍵保有者への依存をなくせますが、システム設計上の信頼までなくせるわけではありません。

---

## 信頼実行環境（TEE）

[信頼実行環境](/ja/glossary/trusted-execution-environment/)は、さらに別の経路を取ります。計算中ずっとデータを暗号化するのではなく、チップ上のハードウェアで保護された領域、すなわち*セキュアエンクレーブ*内に計算を隔離し、そのマシン自身のオペレーティングシステムからも見えないようにします。最もよく知られた実装であるIntel SGX（Software Guard Extensions）は、Wikipediaで「一部のIntel製中央処理装置（CPU）に組み込まれた、信頼実行環境を実装する一連の命令コード」と説明されています（[Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=Intel%20Software%20Guard%20Extensions)）。仕組みとしては、「SGXではCPUがメモリの一部（エンクレーブ）を暗号化」し、「エンクレーブ由来のデータとコードはCPU内でその場で復号される」ため、オペレーティングシステムや下層のハイパーバイザーなど、「より高い権限レベルで実行されるコード」を含むほかのコードによる検査や読み取りから保護されます（[Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)）。

**隠すもの：** エンクレーブ内のデータとコードを、侵害されたOSを含む同一マシン上のほかのすべてのプロセスから隠します。サーバー運営者を信頼せず、特定のコードが正しく実行されることを信頼したい場合に役立ちます。

**信頼の前提：** ZKP、FHE、MPCは「純粋な数学」に依存し、TEEだけがベンダーを信頼するという区分は正確ではありません。実運用される暗号システムも、明示された計算困難性の前提、パラメータまたはセットアップ、正しい実装、さらにMPCではプロトコルの参加者と通信のモデルに依存します。TEEは、こうしたシステムの信頼前提に、ハードウェアによる隔離とアテステーションを加えます。IntelはSGXのトラステッド・コンピューティング・ベース（TCB）を、SGXのセキュリティ目標を満たすために必要なハードウェア、CPUファームウェア、プラットフォームソフトウェアと定義しており、アテステーションにより検証側はエンクレーブのアイデンティティとプラットフォームのパッチレベルを評価できます（[Intel](https://www.intel.com/content/www/us/en/security-center/technical-details/sgx-attestation-technical-details.html)）。この信頼境界は実際に試されてきました。SGXは「サイドチャネル攻撃を防げず」、研究者は実用的な突破を繰り返し実証しています。2017年には「同一システム上で動作するSGXエンクレーブから5分以内にRSA鍵」を抽出し、2018年のForeshadow攻撃では「投機的実行とバッファオーバーフローを組み合わせてSGXを回避」しました。その後もPlundervolt、LVI、SGAxe、ÆPIC Leakなどの脆弱性が見つかっています（[Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=While%20this%20can%20mitigate%20many%20kinds%20of%20attacks%2C%20it%20does%20not%20protect%20against%20side%2Dchannel%20attacks)）。この歴史から、TEEは暗号学的に盤石な保証ではなく、実用的で高速な中間解として説明されるのが一般的です。

**プロジェクト例：** [Oasis Protocol](https://oasis.net/technology)のSapphireネットワークでは、ハードウェアエンクレーブ内でスマートコントラクトを実行します。ユーザーは「ハードウェアで保護されたエンクレーブ内でコードを実行」でき、「データはサーバー運営者からも暗号化されたまま」になります。一方、「実行のたびに、ユーザーが盲目的に信頼することなく検証できる暗号学的証明」が生成され、「EVM互換性とコンポーザビリティ」を維持する「機密スマートコントラクト」が提供されます（[oasis.net](https://oasis.net/technology)）。Secret Networkや、リステーキングに隣接する複数のプライバシー製品もTEEを利用しており、多くの場合、多層防御のためにほかの技術と組み合わせています。

**トレードオフ：** TEEはネイティブに近い速度で動作し、FHEや負荷の高いZK証明よりはるかに高速です。このため遅延の影響を受けやすい用途に適しています。ただし、その速度は、サイドチャネル攻撃を受けた実例が記録されている、より広範なハードウェアとソフトウェアのトラステッド・コンピューティング・ベースを伴います。したがって、比較すべきなのはシステムごとに異なる前提であり、ハードウェアへの信頼と、前提のない「純粋な暗号」との比較ではありません。

---

## リング署名とステルスアドレス

最後の2つの技術は、より限定的ながら非常に実用的な対象を保護します。トランザクション自体がオンチェーンで見えていても、*誰が*送信し、*誰が*受信したかを隠します。[Monero](https://www.getmonero.org/)は、両方を実運用する代表例です。

**リング署名**は送信者を隠します。Moneroのドキュメントでは、「リング署名とは、それぞれ鍵を持つユーザーのグループにおいて、どのメンバーでも生成できるデジタル署名の一種」であり、「グループ内のどのメンバーの鍵が署名の生成に使われたかを特定することは、計算上実行不可能であるべき」と説明されています（[getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html#:~:text=a%20ring%20signature%20is%20a%20type%20of%20digital%20signature)）。実際のMoneroトランザクションでは、実際に支出する人の鍵と、「ガンマ分布法を用いてブロックチェーンから抽出」したおとりの公開鍵を混ぜます。これにより、「署名者候補の『リング』では、すべてのリングメンバーが等しく有効」となり、「署名グループ内の署名者候補のうち、どれが自分のアカウントに属するかを外部の観察者が見分ける方法はありません」（[getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)）。

**ステルスアドレス**は受信者を隠します。同じ公開アドレスを再利用する代わりに、「送信者は受信者に代わって、トランザクションごとにランダムな一度限りのアドレスを作成」します。そのため入金は、「受信者の公開アドレスにも、ほかのトランザクションのアドレスにも関連付けられない、ブロックチェーン上の固有アドレス」に届きます（[getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html#:~:text=They%20allow%20and%20require%20the%20sender%20to%20create%20random%20one%2Dtime%20addresses)）。受信者は秘密閲覧鍵を使ってチェーン上の支払いを探し、秘密支出鍵を使ってその資金を移動します。そのため、「支払い先を特定できるのは送信者と受信者だけ」です（[getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)）。

**隠すもの：** 送信者の身元（リング署名）と受信者の身元（ステルスアドレス）です。取引*金額*は、これら2つの技術だけではなく、別の仕組みであるコンフィデンシャルトランザクション（Confidential Transactions）／RingCTによって隠されます。

**トレードオフ：** どちらの技術も、証明生成の負荷やエンクレーブへの依存なしに、一般的なハードウェア上で効率よく動作するため、実稼働する決済ネットワークに適しています。ただし、その信頼モデルは、おとりの集合が実際の署名者と統計的に見分けられないことに依存します。おとりの選び方が弱かったり、ブロックチェーン分析のヒューリスティクスが使われたりすると、初期のリング署名実装では匿名集合が絞り込まれた例があります。そのため、パラメーターの選択（リングサイズ、おとりの分布）は、基礎となる暗号プリミティブと同じくらい重要です。

---

## 5つのアプローチを比較

| 技術 | 隠すもの | 信頼の前提 | パフォーマンスコスト | 現在の成熟度 | プロジェクト例 |
|---|---|---|---|---|---|
| ゼロ知識証明 | 秘密の証人／データ。別途隠さない限り公開命題は見える | 証明システムの前提、パラメータ、回路／プロトコルの実装。一部のシステムではトラステッドセットアップも必要 | 証明生成は高コスト、検証は低コスト | 大規模な実運用段階（ロールアップ、シールド決済） | zkSync、Starknet、Zcash |
| 完全準同型暗号 | 計算を通じたすべてのデータ。計算事業者からも隠す | 方式の計算困難性の前提に加え、安全なパラメータと実装の選択 | 非常に大きな計算オーバーヘッド | 実運用初期。ハードウェア高速化の研究が進行中 | Zama、Fhenix |
| セキュアマルチパーティ計算 | 各当事者の個別の入力 | プロトコル固有の不正参加者の閾値、ネットワーク／セットアップモデル、参加者の独立性 | 中程度。通信ラウンドが増加 | 成熟し、カストディで広く導入済み | Fireblocksなどの閾値署名カストディ事業者 |
| 信頼実行環境 | OSを含む、ほかのすべてのプロセスからデータ／コードを隠す | アテステーション済みのエンクレーブコードと、ハードウェア、ファームウェア、ソフトウェアのTCB及びそのパッチ状態 | ネイティブに近い速度 | 実運用段階だが、サイドチャネル攻撃の履歴が記録されている | Intel SGX、Oasis Sapphire |
| リング署名とステルスアドレス | 送信者と受信者の身元 | おとり集合の統計的な識別不可能性 | 低コスト。一般的なハードウェアで効率よく動作 | 成熟し、10年以上の実運用実績 | Monero |

すべての評価軸で勝る単一の技術はありません。そのため現在の研究では、MPC計算の正しさを検証するZK証明や、多層防御のためにFHEと併用するTEEなど、複数技術の組み合わせが増えています。

---

## トークン化ドメインとのつながり

[トークン化ドメイン](/ja/glossary/tokenize/)は、ほかのオンチェーン資産と同じく、デフォルトで透明という性質を受け継ぎます。所有権の移転、入札、メタデータの更新は、誰でも読み取れます。これは主として利点です。来歴と所有履歴こそが、[トークン化ドメイン](/ja/blog/what-are-tokenized-domains/)を取引可能な資産として信頼できるものにするからです。一方で、ドメインポートフォリオの保有状況や売却価格も、チェーンを監視する誰にでも見えることになります。

本ガイドで取り上げたプライバシー技術は、ドメインNFTインフラが将来進み得る方向を示しています。MPCベースの閾値カストディは、ほかのデジタル資産と同じ方法で、ドメインNFTを保有する機関向け[ウォレット](/ja/glossary/wallet/)をすでに保護しています。将来的には、ZK証明によって入札者が残高全体を明かさず、購入できる資力があることを証明できるかもしれません。また、コンフィデンシャルコンピューティング技術によって、レジストラやマーケットプレイスが購入者の完全な身元を公開せず、適格性ルールを検証できる可能性もあります。現在、ドメインのトークン化にはこれらの技術は一つも導入されていません。しかし、その基盤となる暗号プリミティブは、まさに今、DeFiとカストディインフラで数十億ドル相当の資産を保護しています。

---

## 出典と参考資料

- [ゼロ知識証明 — ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)
- [Proofs, Arguments, and Zero-Knowledge — Justin Thaler](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html)
- [ZKロールアップ — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [L2BEATスケーリング概要](https://l2beat.com/scaling/summary)
- [Zcashの技術概要](https://z.cash/technology/)
- [準同型暗号入門 — Zama](https://www.zama.org/introduction-to-homomorphic-encryption)
- [セキュリティガイドライン — HomomorphicEncryption.org](https://homomorphicencryption.org/security-guidelines/)
- [Fhenix cofheドキュメント](https://cofhe-docs.fhenix.zone/)
- [セキュアマルチパーティ計算 — Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)
- [非暗号学的耐故障分散計算の完全性定理 — ACM](https://doi.org/10.1145/62212.62213)
- [効率的な完全セキュア計算 — TCC 2021](https://www.iacr.org/archive/tcc2021/130420196/130420196.pdf)
- [ある程度準同型な暗号からのマルチパーティ計算（SPDZ）— IACR](https://eprint.iacr.org/2011/535)
- [公平性によるSPDZセキュリティの拡張 — PoPETs](https://petsymposium.org/popets/2024/popets-2024-0053.php)
- [MPCとは — Fireblocks](https://www.fireblocks.com/what-is-mpc)
- [Software Guard Extensions（SGX）— Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)
- [Intel SGXアテステーションの技術詳細](https://www.intel.com/content/www/us/en/security-center/technical-details/sgx-attestation-technical-details.html)
- [Oasis Protocolの技術](https://oasis.net/technology)
- [リング署名 — Monero Moneropedia](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)
- [ステルスアドレス — Monero Moneropedia](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)
