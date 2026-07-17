---
title: "すべてのブロックチェーンを支える主要な暗号プリミティブ"
date: '2026-07-02'
language: ja
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 10
format: roundup
description: ハッシュ関数、デジタル署名、マークルツリー、楕円曲線暗号、コミットメント方式など、ブロックチェーンを動かす中核的な暗号プリミティブを解説します。
ogImage: ../../assets/blockchain-cryptographic-primitives-og.jpg
keywords: ['ブロックチェーン 暗号技術', '暗号プリミティブ', 'ハッシュ関数', 'SHA-256', 'Keccak-256', 'デジタル署名', 'ECDSA', 'EdDSA', 'BLS署名', 'マークルツリー', '楕円曲線暗号', 'secp256k1', 'コミットメント方式', '耐量子暗号', '公開鍵暗号', 'ブロックチェーン セキュリティ']
relatedArticles:
  - /ja/blog/blockchain-privacy-technologies/
  - /ja/blog/blockchain-consensus-mechanisms/
  - /ja/blog/blockchain-virtual-machines/
  - /ja/blog/blockchain-scaling-approaches/
  - /ja/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /ja/glossary/hash-function/
  - /ja/glossary/digital-signature/
  - /ja/glossary/merkle-tree/
  - /ja/glossary/public-key/
  - /ja/glossary/private-key/
relatedTopics:
  - /ja/topics/web3-foundations/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/tokenize-your-com/
  - /ja/series/domain-flipping-skills/
---

「このトランザクションは確定している」「このアドレスがこの資産を所有している」「この履歴は改ざんされていない」。ブロックチェーンに関するあらゆる主張は、最終的には、狭く明確に定義された役割を果たす少数の暗号プリミティブへ行き着きます。どれもブロックチェーンが発明したものではありません。ハッシュ関数、デジタル署名、マークルツリーは、Bitcoinより数十年も前から存在します。ブロックチェーンが行ったのは、それらの主張を成立させるために単一の主体を信頼する必要がないシステムへ、これらの技術を組み合わせることでした。

この記事では、実際に中核を担うプリミティブを解説します。データの指紋を作る[ハッシュ関数](/ja/glossary/hash-function/)、トランザクションを承認する[デジタル署名](/ja/glossary/digital-signature/)、巨大なデータセットを部分ごとに検証できるようにする[マークルツリー](/ja/glossary/merkle-tree/)、署名の基盤となる楕円曲線の数学、そして[ゼロ知識証明](/ja/glossary/zero-knowledge-proof/)へつながる構成要素であるコミットメント方式です。それぞれを理解することが、ブロックチェーンの内部で実際に何が起きているかを理解する最短経路です。

---

## 暗号学的ハッシュ関数（SHA-256、Keccak）

![文書をハッシュ関数の機械へ入力すると固定長の指紋となるダイジェストが生成され、入力の1文字を変えただけでまったく異なるダイジェストになり、雪崩効果を示している](../../assets/blockchain-cryptographic-primitives-01-hash-function.jpg)

[ハッシュ関数](/ja/glossary/hash-function/)は、任意の大きさの入力から、決定論的に固定サイズの出力、つまり「ダイジェスト」を生成します。入力の1ビットを反転させるだけで出力全体が大きく変化し、同じ出力へハッシュされる異なる二つの入力を見つけることは計算上困難です。この性質である衝突耐性により、ハッシュは、任意の大きさのデータを小さく表す、改ざん検知可能な指紋として機能します。

Bitcoinは全体でSHA-256を使います。各ブロックヘッダーに一つ前のヘッダーのSHA256(SHA256())ハッシュを埋め込んで連結するため、過去のブロックを一つでも変更すると、そのハッシュが変わり、後続するすべてのヘッダーとのつながりが壊れます（[Bitcoin開発者ガイド](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Each%20block%20also%20stores%20the%20hash%20of%20the%20previous%20block%27s%20header%2C%20chaining%20the%20blocks%20together)）。同じ二重SHA-256構成で、トランザクションをブロックの[マークルツリー](/ja/glossary/merkle-tree/)へハッシュ化します（[Bitcoin.orgリファレンス](https://developer.bitcoin.org/reference/block_chain.html#:~:text=A%20SHA256%28SHA256%28%29%29%20hash%20in%20internal%20byte%20order)）。

一方、Ethereumは汎用ハッシュとしてKeccak-256を標準化しています。これは元のKeccak提案であり、後に制定されたNIST SHA-3標準とは異なります。各アカウントのアドレスは、そのアカウントの[公開鍵](/ja/glossary/public-key/)をKeccak-256でハッシュ化し、最後の20バイトを取ることで導出されます（[ethereum.org](https://ethereum.org/en/developers/docs/accounts/#:~:text=You%20get%20a%20public%20address%20for%20your%20account%20by%20taking%20the%20last%2020%20bytes%20of%20the%20Keccak-256%20hash%20of%20the%20public%20key)）。同じ関数は、Ethereumの状態を保存する[マークル・パトリシア・トライ](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=key%20%3D%3D%20keccak256%28rlp%28value%29%29)全体で使われる、キー/値のコンテンツアドレッシングの基盤でもあります。

ハッシュ化は、ブロックヘッダーをばらばらな記録の集まりではなく、一つのチェーンとして連結する仕組みでもあります。あるヘッダーを変更すると、そのハッシュが変わり、後続ヘッダー内の参照が壊れます。その後の作業をやり直して誠実なネットワークへ追いつく必要があるのは、Bitcoinのプルーフ・オブ・ワーク・コンセンサスに固有の要件です。過去のブロックを変更する攻撃者は、そのブロックのプルーフ・オブ・ワークと、それ以降のすべての作業をやり直したうえで、誠実なチェーンへ追いつかなければなりません（[Bitcoinホワイトペーパー、§4](https://bitcoin.org/bitcoin.pdf)）。他のブロックチェーンは異なるコンセンサスルールに基づいて履歴を認証し、ファイナライズします。そのため、ハッシュによる連結だけでは、このプルーフ・オブ・ワークのコストは生じません。連結されたヘッダーハッシュこそ、このデータ構造が文字どおり**ブロックチェーン**と呼ばれる理由です。

---

## 公開鍵暗号とデジタル署名（ECDSA、EdDSA、BLS）

![秘密鍵でトランザクションへ署名してデジタル署名を生成し、対応する公開鍵では緑のチェックマーク付きで有効と検証され、一致しない公開鍵では赤いX印付きで拒否されている](../../assets/blockchain-cryptographic-primitives-02-signatures.jpg)

ブロックチェーンにはログインフォームがないため、「このトランザクションが本当にこのアカウントの所有者から送られた」ことを別の方法で証明する必要があります。[公開鍵](/ja/glossary/public-key/)を使う暗号方式は、秘密に保持する[秘密鍵](/ja/glossary/private-key/)と、自由に共有できる公開鍵のペアで、この問題を解決します。秘密鍵でトランザクションへ署名すると、誰でも公開鍵と照合して検証できる[デジタル署名](/ja/glossary/digital-signature/)が生成されます。秘密鍵自体を一切公開せずに、承認を証明できます。

Ethereumアカウントは、Bitcoinと同じsecp256k1曲線上の楕円曲線デジタル署名アルゴリズム、ECDSAを使い、秘密鍵から公開鍵を導出します（[ethereum.orgのアカウント解説](https://ethereum.org/en/developers/docs/accounts/#:~:text=The%20public%20key%20is%20generated%20from%20the%20private%20key%20using%20the%20Elliptic%20Curve%20Digital%20Signature%20Algorithm)、[EIP-2：secp256k1署名の展性に関する修正](https://eips.ethereum.org/EIPS/eip-2#:~:text=secp256k1n%2F2)）。ECDSAは検証が速く、数十年にわたり精査されてきました。しかし、新しい設計に関係する運用上の弱点が一つあります。個々のECDSA署名は効率よく集約できないため、数千個の署名を検証するには、数千回の個別チェックが必要です。

この課題を埋めるのが、EdDSAとBLS署名です。SolanaやStellarなどのチェーンで使われるEdDSAは、決定論的に動作する別の曲線構成を採用しており、過去にECDSAのnonce再利用バグを引き起こしてきた一部の実装上の落とし穴に強い方式です。BLS署名はさらに先へ進みます。使用する曲線の数学的なペアリング特性により、多数のBLS署名を一つの集約署名へまとめ、一度にすべてを検証できます。Ethereumのプルーフ・オブ・ステークのコンセンサス層は、まさにこの仕組みに依存しています。バリデーターはBLS鍵でアテステーションへ署名するため、ビーコンチェーンは数十万のバリデーターによる投票を、迅速に検証できるほど小さな署名へ集約できます。これにより、大規模なプルーフ・オブ・ステークを実用化できます（[ethereum.org『The Beacon Chain』](https://eth2book.info/capella/part2/building_blocks/signatures/#:~:text=BLS%20signatures%20can%20be%20aggregated%20together%2C%20making%20them%20efficient%20to%20verify%20at%20large%20scale)）。Ethereumは、スマートコントラクトでのBLS署名検証を支援するため、BLS12-381曲線演算をEVMプリコンパイルとして提供しています（[EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#:~:text=Add%20functionality%20to%20efficiently%20perform%20operations%20over%20the%20BLS12-381%20curve%2C%20including%20those%20for%20BLS%20signature%20verification)）。

---

## マークルツリー

![マークルツリーのハッシュノードがピラミッド状に二つずつ結合されて一つのルートへ集約され、葉からルートまでの一つの証明経路がオレンジ色で強調され、ライトクライアント向けマークル証明を示している](../../assets/blockchain-cryptographic-primitives-03-merkle-tree.jpg)

[マークルツリー](/ja/glossary/merkle-tree/)を使うと、すべての参加者へ全トランザクションの保存を強制することなく、数千件のトランザクションを一つの32バイトハッシュへ要約できます。葉は個々のデータ項目、たとえばトランザクションやアカウント状態のハッシュです。ハッシュを二つずつ連結して再びハッシュ化し、一つのハッシュであるルートが残るまで繰り返します（[Bitcoin開発者ガイド](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Copies%20of%20each%20transaction%20are%20hashed%2C%20and%20the%20hashes%20are%20then%20paired%2C%20hashed%2C%20paired%20again%2C%20and%20hashed%20again%20until%20a%20single%20hash%20remains%2C%20the%20merkle%20root%20of%20a%20merkle%20tree)）。ルートはブロックヘッダーへ直接保存されるため、フルノードは、ほとんど追加容量を使わずにブロックの内容全体へコミットできます。

利点は証明サイズです。一つのトランザクションがブロックに含まれていると示すために、ブロック全体は必要ありません。必要なのは、そのトランザクションと、葉からルートまでの経路に沿った兄弟ハッシュで構成される「マークルブランチ」だけです。n件のトランザクションに対し、通常はおよそlog₂(n)個のハッシュで済みます。これが簡易決済検証（SPV）の基盤です。ブロックヘッダーだけを持つ軽量クライアントでも、ブロックチェーン全体をダウンロードせず、マークルブランチをヘッダーのルートと照合することで、特定のトランザクションが発生したことを検証できます（[Bitcoin開発者ガイド](https://developer.bitcoin.org/devguide/operating_modes.html#:~:text=the%20merkle%20root%20in%20the%20block%20header%20along%20with%20a%20merkle%20branch%20can%20prove%20to%20the%20SPV%20client%20that%20the%20transaction%20in%20question%20is%20embedded%20in%20a%20block%20in%20the%20block%20chain)）。

Ethereumは、マークルツリーとプレフィックス（基数）トライを組み合わせたマークル・パトリシア・トライへ、この考え方を拡張しています。トランザクションの一覧だけでなく、アカウント状態全体の保存に使います。各ブロックヘッダーには、`stateRoot`、`transactionsRoot`、`receiptsRoot`という三つの異なるトライルートが格納され、それぞれを個別に証明できます（[ethereum.org](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=From%20a%20block%20header%20there%20are%203%20roots%20from%203%20of%20these%20tries)）。そのため、スマートコントラクトや軽量クライアントは、チェーン全体を再実行せず、一つのアカウント残高や一つのストレージスロットを検証できます。

---

## 楕円曲線暗号

楕円曲線暗号（ECC）は、ECDSA、EdDSA、BLSすべての数学的基盤です。古典的なRSAのように大きな数の素因数分解の難しさへ依存する代わりに、ECCは楕円曲線離散対数問題の難しさへ依存します。基点を何度も加算して得られた曲線上の点が与えられても、何回加算したかを復元することは計算上困難です。一方、順方向に点を計算するのは簡単です。この非対称性、つまり一方向は簡単で逆方向は難しいという性質により、導出した公開鍵を安全に公開しながら、秘密鍵を署名に安全に使用できます。

具体的な曲線と署名方式の両方が重要です。BitcoinとEthereumはいずれも、Standards for Efficient Cryptography Groupが標準化し、十分に研究された256ビットのパラメータを持つKoblitz曲線、secp256k1を使います（[SEC 2：推奨楕円曲線ドメインパラメータ](https://www.secg.org/sec2-v2.pdf)）。他のエコシステムは異なるトレードオフを選びます。Ed25519は、Edwards25519曲線上に実装された具体的なEdDSA署名方式です（[RFC 8032、§5.1](https://www.rfc-editor.org/rfc/rfc8032.html#section-5.1)）。RFC 8032では、その古典計算機に対するセキュリティ水準を約128ビットとしています（[§8.5](https://www.rfc-editor.org/rfc/rfc8032.html#section-8.5)）。BLS12-381はペアリングに適した曲線で、BLS署名の集約などの演算に選ばれており、EIP-2537では120ビット超のセキュリティが説明されています（[EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#motivation)）。これらの見積もりは、各方式が同じ「鍵1ビット当たりのセキュリティ」を提供するという意味ではありません。方式ごとに群、符号化、前提が異なり、公称鍵長そのものがセキュリティ強度を表すわけでもありません。たとえばNISTは、128ビットの古典的セキュリティに対し、通常のECC鍵では256〜383ビット、RSA鍵では3072ビットを対応付けています（[NIST SP 800-57 Part 1 Rev. 5、表2](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf#page=67)）。これは、楕円曲線方式がブロックチェーンアカウントの標準となった理由を理解する助けになります。

---

## コミットメント方式（ゼロ知識への橋渡し）

コミットメント方式を使うと、値を「確定」できます。特定のデータに自分を拘束する情報を公開しながら、データ自体は明かさず、後からコミットメントを「開示」して、その内容を証明できます。日常的なたとえは、封をした封筒です。今日、封をした封筒を誰かに渡せば、後から開封するまで中身を見せずに、すでに答えを決めていたことを示せます。一度封をすれば、中の答えを入れ替えることはできません。

小さなプリミティブに見えますが、ほとんどのゼロ知識証明システムを支える中核要素です。たとえば、Ethereumのblobベースのデータ可用性設計では、KZG多項式コミットメントを使い、各blobを小さな暗号学的コミットメントへ縮約します。KZG証明は、そのコミットメントに対する評価値やサンプリングしたセルの正当性を確認できますが、それだけでblob全体が利用可能だとは証明しません。可用性はコンセンサス層の配布とサンプリングのルールによって確保され、KZGは受信したデータの完全性を検証します（[EIP-4844](https://eips.ethereum.org/EIPS/eip-4844#consensus-layer-validation)、[EIP-7594：PeerDAS](https://eips.ethereum.org/EIPS/eip-7594#networking)）。この分離により、検証者は、コンパクトな評価証明をblobの全データが公開された証明と取り違えることなく、blobの小さな一部分を確認できます。実際、マークルルート自体も単純なコミットメント方式です。ルートハッシュを通じてデータセット全体へコミットし、マークルブランチが、その一部を明かす「開示」となります。ZK-rollupは、より高度なコミットメント方式である多項式コミットメントとベクトルコミットメントを基盤に、トランザクション実行のバッチ全体を、オンチェーンで安価に検証できる一つの証明へ圧縮します。このテーマは[完全ゼロ知識と計算量的ゼロ知識](/ja/blog/perfect-vs-computational-zero-knowledge/)で詳しく解説しています。

---

## 比較：ブロックチェーンの暗号プリミティブ

| プリミティブ | 提供する性質 | オンチェーンでの用途 | 古典計算機での安全性 / 耐量子リスク |
|---|---|---|---|
| ハッシュ関数（SHA-256、Keccak-256） | 衝突耐性のある指紋生成、ブロックの連結 | ブロックのハッシュ化、アドレス導出、マークルルート | 現在の出力サイズでは古典計算機に対して強固。ハッシュベースの方式は一般に、現在の楕円曲線署名より量子攻撃への耐性が高いと考えられる |
| デジタル署名 — ECDSA | 秘密鍵と公開鍵のペアによるトランザクション承認 | BitcoinとEthereumのアカウント署名 | 古典計算機に対して安全。十分な能力を持つ大規模量子コンピューターは、楕円曲線ベースの方式を破れると予想されるため、NISTは耐量子代替方式を標準化している（[NIST、2024年](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards#:~:text=A%20sufficiently%20capable%20quantum%20computer%2C%20though%2C%20would%20be%20able%20to%20sift%20through%20a%20vast%20number%20of%20potential%20solutions%20to%20these%20problems%20very%20quickly%2C%20thereby%20defeating%20current%20encryption)） |
| デジタル署名 — EdDSA / BLS | 決定論的署名（EdDSA）、効率的な署名集約（BLS） | Solana / Stellarの署名（EdDSA）、Ethereumバリデーターのアテステーション（BLS） | ECDSAと同じ楕円曲線の仮定に基づくため、長期的には同じ量子リスクがある |
| マークルツリー | 大規模データセットへのコンパクトなコミットメント、小さな包含証明 | ブロックヘッダー、軽量クライアント（SPV）による検証、Ethereumの状態 / トランザクション / レシートのトライ | 基盤となるハッシュ関数の衝突耐性だけに依存するため、新たなリスクを追加するのではなく、そのハッシュの量子攻撃に対する性質を引き継ぐ |
| 楕円曲線暗号 | コンパクトな鍵と署名の数学的基盤 | secp256k1（Bitcoin、Ethereum）、Ed25519、BLS12-381 | 将来の大規模量子コンピューターに対し、ECDSA / EdDSA / BLSと同じ形で脆弱。これが耐量子移行研究の主な推進要因となっている |
| コミットメント方式 | 今すぐ値へ拘束し、事前に内容を公開せず後から開示または証明する | Ethereumのデータ可用性におけるKZGコミットメント、単純なコミットメントとしてのマークルルート、ZK-rollupの構成要素 | セキュリティは、方式の構築に使う基盤のハッシュまたは楕円曲線の仮定に依存する |

---

## トークン化ドメインとの関係

ドメインを[トークン化](/ja/glossary/tokenize/)するとき、これらすべてのプリミティブが直接使われます。所有権を表す[NFT（非代替性トークン）](/ja/glossary/nft/)は、チェーンのアカウントとトークンに関する認可ルールで保護されます。外部所有アカウント（EOA）が保有している場合、そのアカウントの秘密鍵がアカウント操作を認可します。一方、コントラクトアカウントは秘密鍵を持たず、そのコードによって制御されます（[ethereum.org『Ethereumアカウント』](https://ethereum.org/en/developers/docs/accounts/#account-types)）。ERC-721トークンでは、承認済みアドレスやオペレーターも移転を開始できます（[ERC-721](https://eips.ethereum.org/EIPS/eip-721#specification)）。そのため、自分で管理するEOAで所有する場合は、[ハードウェアウォレット](/ja/glossary/hardware-wallet/)と[シードフレーズ](/ja/glossary/seed-phrase/)の慎重な管理が重要です。一方、スマートコントラクトウォレットやカストディアルウォレットでは、認可と信頼の境界が異なります。ドメインの所有権記録は、チェーン上の他のアカウント残高や[スマートコントラクト](/ja/glossary/smart-contract/)を保護するものと同じ、マークルコミットされた状態に存在します。そのため、トークン化ドメインは、他のオンチェーン資産と同じ改ざん検知性を持ちます。移転可能で、検証可能であり、レジストラのデータベースだけを唯一の正しい情報源とせず、所有権を証明できます。

これらのプリミティブを理解すると、トークン化によって変わることと変わらないことも明確になります。ドメインのDNSレコードとレジストリ上の状態は引き続きICANNのルールに従いますが、所有権の証明には、ログインで保護された[レジストラ](/ja/glossary/registrar/)アカウントではなく、ここで説明した暗号技術を使うようになります。全体像は[ブロックチェーンのコンセンサスメカニズム](/ja/blog/blockchain-consensus-mechanisms/)と[ブロックチェーンのスケーリング手法](/ja/blog/blockchain-scaling-approaches/)で確認できます。トークン化を始めるには[namefi.io](https://namefi.io)へアクセスしてください。

---

## 出典と参考資料

- Bitcoin開発者ガイド — [ブロックチェーン](https://developer.bitcoin.org/devguide/block_chain.html)、前のヘッダーのSHA256(SHA256())による連結
- Bitcoin — [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf)、プルーフ・オブ・ワーク履歴の書き換えと累積作業量
- Bitcoin開発者リファレンス — [ブロックチェーン](https://developer.bitcoin.org/reference/block_chain.html)、マークルルートの構築
- Bitcoin開発者ガイド — [動作モード](https://developer.bitcoin.org/devguide/operating_modes.html)、SPVとマークルブランチ
- ethereum.org — [Ethereumアカウント](https://ethereum.org/en/developers/docs/accounts/)、ECDSAとKeccak-256によるアドレス導出、EOAとコントラクトアカウントの制御
- ethereum.org — [マークル・パトリシア・トライ](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/)、状態 / トランザクション / レシートのルート
- ethereum.org — [Danksharding](https://ethereum.org/en/roadmap/danksharding/)、KZG多項式コミットメント
- EIP-4844 — [Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)、blobコミットメント、証明、コンセンサス層での可用性
- EIP-7594 — [PeerDAS](https://eips.ethereum.org/EIPS/eip-7594)、セル証明とデータ可用性サンプリング
- ERC-721 — [Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721)、トークン所有権、承認、オペレーター
- EIP-2 — [Homesteadハードフォークの変更](https://eips.ethereum.org/EIPS/eip-2)、secp256k1署名の制約
- EIP-2537 — [BLS12-381曲線演算のプリコンパイル](https://eips.ethereum.org/EIPS/eip-2537)
- RFC 8032 — [Edwards-Curve Digital Signature Algorithm (EdDSA)](https://www.rfc-editor.org/rfc/rfc8032.html)、Ed25519の方式、曲線、セキュリティ水準
- SEC 2：推奨楕円曲線ドメインパラメータ — [secg.org](https://www.secg.org/sec2-v2.pdf)
- NIST SP 800-57 Part 1 Rev. 5 — [Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final)、ECCとRSAで同等となるセキュリティ強度
- 『The Eth2 Book』— [署名とBLS集約](https://eth2book.info/capella/part2/building_blocks/signatures/)
- NIST — [NISTが最初の3つの耐量子暗号標準を最終決定](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards)
