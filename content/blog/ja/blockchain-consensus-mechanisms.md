---
title: "主要なブロックチェーンのコンセンサスメカニズム：PoW、PoS、その先へ"
date: '2026-07-02'
language: ja
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 20
format: roundup
description: プルーフ・オブ・ワーク、プルーフ・オブ・ステーク、DPoS、BFTなど、主要なブロックチェーンのコンセンサスメカニズムと、それぞれがネットワークを守る仕組みを分かりやすく解説します。
ogImage: ../../assets/blockchain-consensus-mechanisms-og.jpg
keywords: ['ブロックチェーン コンセンサスメカニズム', 'コンセンサスメカニズム', 'プルーフ・オブ・ワーク', 'プルーフ・オブ・ステーク', 'デリゲーテッド・プルーフ・オブ・ステーク', 'ビザンチン耐障害性', 'Tendermint', 'CometBFT', 'プルーフ・オブ・ヒストリー', 'プルーフ・オブ・オーソリティ', 'プルーフ・オブ・スペース', '二重支払い問題', 'ブロックチェーン ファイナリティ', 'Ethereum マージ', 'Bitcoin マイニング', 'バリデーター', 'ステーキング', 'シビル耐性', 'Namefi']
relatedArticles:
  - /ja/blog/blockchain-virtual-machines/
  - /ja/blog/blockchain-scaling-approaches/
  - /ja/blog/blockchain-cryptographic-primitives/
  - /ja/blog/blockchain-privacy-technologies/
  - /ja/blog/what-are-tokenized-domains/
relatedGlossary:
  - /ja/glossary/consensus-mechanism/
  - /ja/glossary/proof-of-work/
  - /ja/glossary/proof-of-stake/
  - /ja/glossary/blockchain/
  - /ja/glossary/ethereum/
relatedTopics:
  - /ja/topics/web3-foundations/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/tokenize-your-com/
  - /ja/series/domain-flipping-skills/
---

あらゆる[ブロックチェーン](/ja/glossary/blockchain/)は、誰かのお金を預かるほど信頼される前に、一つの問いへ答えなければなりません。何が起きたのか、そしてどの順番で起きたのかを、誰が決めるのでしょうか。銀行も公証人も、指揮を執る中央サーバーもありません。**コンセンサスメカニズム**とは、中央管理者を置かず、同じコインの二重支払いも許さずに、ネットワーク参加者が単一の共有トランザクション履歴へ合意するためのルールです。

この記事では、現在使われている主要なコンセンサスメカニズム、それぞれが次のブロックを実際に選ぶ方法、そして各方式のトレードオフを解説します。

---

## コンセンサスが実際に解決すること

分散型ネットワークでの合意形成を難しくする問題は二つあります。

**二重支払い問題。** デジタルシステムでは、価値の単位も単なるデータであり、データは複製できます。判定役がいなければ、同じコインを使う二つの矛盾したトランザクションを誰かが同時に送信することを止められません。Satoshi NakamotoのBitcoinホワイトペーパーは、目標を直接こう表現しています。受取人が、先の支払いが後の矛盾した支払いで取り消されないと確信できるように、ネットワークには「参加者が、トランザクションを受信した順序について単一の履歴へ合意する仕組み」が必要です（[Bitcoinホワイトペーパー](https://bitcoin.org/bitcoin.pdf)）。

**中央管理者なしでの合意。** 通常のデータベースでは、一人の運営者の判断が最終決定です。公開されたパーミッションレスネットワークでは、誰でもノードを動かし、トランザクションを提案し、次のブロックを追加しようとできます。嘘をつく、検閲する、履歴を書き換えようとする参加者も含まれます。コンセンサスメカニズムは、台帳への攻撃を実行に見合わないほど高コストにするか、別の方法で動機を失わせる一方で、誠実な参加者がネットワークを運営できる程度にコストを抑えなければなりません。

以下で説明する各方式は、「誰が次のブロックを提案し、それを信頼できるとどう判断するか」という問いへの異なる答えです。比較で最も重要な二つの軸は、**[シビル耐性](/ja/glossary/consensus-mechanism/)**、つまり一人の攻撃者が無数の偽のIDを作って他の参加者を投票で上回るのを防ぐ仕組みと、**ファイナリティ**、つまりトランザクションがどれほど速く、どれほど確実に不可逆になるかです。

---

## プルーフ・オブ・ワーク

![複数のマイナーが同じハッシュパズルの解決を競い、そのうち一人が「見つけた！」と書かれたブロックを掲げ、稲妻がマイニングの高いエネルギーコストを示している](../../assets/blockchain-consensus-mechanisms-01-proof-of-work.jpg)

[プルーフ・オブ・ワーク](/ja/glossary/proof-of-work/)（PoW）は、Bitcoinが2009年に導入した仕組みで、「ブロックチェーン」と聞いて多くの人が思い浮かべる方式です。マイナーは暗号学的パズルの解決を競います。候補ブロックのデータをnonceとともに繰り返しハッシュ化し、生成されたハッシュが目標値を下回るまで試行します。Ethereumの開発者向けドキュメントは、この競争を分かりやすく説明しています。マイナーは、他の誰よりも早く有効な解を見つけるため、「データセットを数学的関数へ繰り返し通します」（[ethereum.org：プルーフ・オブ・ワーク](https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/#:~:text=When%20racing%20to%20create%20a%20block%2C%20a%20miner%20repeatedly%20put%20a%20dataset)）。最初に有効なハッシュを見つけた者が、次のブロックを提案し、ブロック報酬とトランザクション手数料を受け取ります。

**シビル耐性**はパズルそのものから生まれます。ハッシュ計算には実際の電力とハードウェアが必要なため、多数の偽IDを作っても有利にはなりません。意味を持つのは純粋な計算能力だけです。**ファイナリティは確率的です。** Bitcoinホワイトペーパーでは、ノードは常に「最長のチェーンを正しいものとして」延長すると説明されています（[Bitcoinホワイトペーパー](https://bitcoin.org/bitcoin.pdf)）。受取人は、対象トランザクションの後に追加のブロックが採掘されるのを待つことで、決済が確定したという確信を高めます。新しいブロックが増えるたびに履歴を書き換えるコストは指数関数的に上昇しますが、どのブロックも瞬時に数学的な意味で確定するわけではありません。

トレードオフはエネルギーです。現実世界の計算によってネットワークを守るには、現実世界の電力を消費します。そのため、Bitcoinマイニングの消費量は年間テラワット時で測定されます。**採用チェーンの例：** Bitcoin、Litecoin、Dogecoin、2022年以前のEthereum。

---

## プルーフ・オブ・ステーク

![バリデーターがステークするコインの山を金庫に預け、抽選ホイールで次のブロック提案者に選ばれ、金庫にはスラッシングの警告タグが付いている](../../assets/blockchain-consensus-mechanisms-02-proof-of-stake.jpg)

[プルーフ・オブ・ステーク](/ja/glossary/proof-of-stake/)（PoS）は、計算作業を経済的な担保へ置き換えます。マイニングの代わりに、参加者はネットワークのネイティブ資産を**ステーク**、つまりロックし、プロトコルが各ブロックの提案者をステーカーから擬似ランダムに選びます。Ethereumのバリデーターの役割は、参考になる設計例です。バリデーターは32 ETHを預けてクライアントソフトウェアを実行します。その後、プロトコルは「各スロットで一人のバリデーターをブロック提案者としてランダムに選択」し、ランダムに選ばれた他のバリデーターの委員会が、そのブロックが有効であるとアテステーションを行います（[ethereum.org：プルーフ・オブ・ステーク](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=One%20validator%20is%20randomly%20selected%20to%20be%20a%20block%20proposer%20in%20every%20slot)）。

**シビル耐性**はステークそのものから生まれます。多数の偽バリデーターを作っても、同じ資本を複数のIDへ分割するだけであり、影響力は増えません。矛盾するブロックや相反するアテステーションを提案するなどの不正行為には、**スラッシング**という罰が科されます。プロトコルが、違反したバリデーターのステークの一部を焼却します（[ethereum.org：プルーフ・オブ・ステーク](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=Two%20primary%20behaviors%20can%20be%20considered%20dishonest)）。Ethereumはチェックポイント方式（Casper FFGとLMD-GHOSTフォーク選択ルールの組み合わせ）を使い、エポック単位でブロックを確定します。BFT型の単一ラウンド投票を必要とせず、純粋なPoWよりも強いファイナリティ保証を提供します。

PoWと比べた最大のトレードオフはエネルギーです。ステーキングでは、パズルの解決を競う専用ハードウェアが不要です。そのため、ethereum.orgが述べるように「プルーフ・オブ・ワークの計算へ大量のエネルギーを使う必要がありません」（[ethereum.org：プルーフ・オブ・ステーク](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=there%20is%20no%20need%20to%20use%20lots%20of%20energy%20on%20proof)）。削減規模も詳しく記録されています。独立分析機関CCRIによると、Ethereumが2022年9月にPoWからPoSへ移行した「The Merge」により、ネットワークの年間換算電力消費量は99.988%以上減少しました（[ethereum.org：エネルギー消費](https://ethereum.org/en/energy-consumption/#:~:text=CCRI%20estimates%20that%20The%20Merge%20reduced%20Ethereum%27s%20annualized%20electricity%20consumption%20by%20more%20than%2099.988%25)）。**採用チェーンの例：** Ethereum、Cardano、Solana（経済的セキュリティにPoSを使い、Proof of Historyを併用）、Polkadot。

---

## デリゲーテッド・プルーフ・オブ・ステーク

デリゲーテッド・プルーフ・オブ・ステーク（DPoS）は、ステーキングモデルに選挙の層を追加します。すべてのステーカーを個別にブロック提案者の候補とする代わりに、トークン保有者は少数の**デリゲート**（ウィットネスまたはブロックプロデューサーとも呼ばれる）へ、自分のステークに基づく票を投じます。実際にブロックを生成するのは、選出されたメンバーだけです。投票力は保有トークン数に応じて増えます。この分野の解説では、中核となる仕組みを「各トークン保有者の投票力は、保有するトークン数に比例する」と説明しています。選挙は継続的に行われるため、保有者はいつでも投票先を変えたり、成果を上げないデリゲートを落選させたりできます（[Binance Academy：デリゲーテッド・プルーフ・オブ・ステークの解説](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)）。

**シビル耐性**は引き続きステークに基づきます。投票はアカウント数ではなく保有トークン数で重み付けされます。ただし、ブロックの*生成*は、すべてのステーカーへ開放されるのではなく、選出された少数の委員会へ集中します。この集中こそが目的です。稼働中のバリデーター集合が小さく、事前に分かっているため、DPoSネットワークは「多くの場合3秒を大きく下回る高速なブロック時間を実現できます」（[Binance Academy：デリゲーテッド・プルーフ・オブ・ステークの解説](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)）。トレードオフは分散性です。ほとんどのDPoSネットワークでは、およそ「21〜101人の稼働中バリデーター」という、オープンなPoSネットワークで一般的な数百人または数千人よりはるかに小さい集合で運営されます。また、有権者の無関心が続くと、同じデリゲートが時間とともに地位を固め続ける可能性があります（[Binance Academy：デリゲーテッド・プルーフ・オブ・ステークの解説](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)）。**採用チェーンの例：** EOS、TRON、そして修正版を採用した初期のCosmos SDKアプリケーションチェーンの多く。

---

## BFT型コンセンサス（Tendermint / CometBFT、PBFT）

![バリデーターの評議会がテーブルを囲み、三分の二を超えるバリデーターが賛成を示す緑の札を上げ、鍵アイコン付きのブロックが即座に確定している](../../assets/blockchain-consensus-mechanisms-03-bft.jpg)

ビザンチン耐障害性（BFT）コンセンサスは、まったく異なる方法を取ります。競争したり、ブロックごとに一人の提案者をランダムに選んだりする代わりに、既知のバリデーター集合が明示的な投票ラウンドを行い、同じラウンドで特別多数、通常は投票力の三分の二を超える賛成が得られた場合にだけブロックをコミットします。**CometBFT**（Cosmos SDKのコンセンサスエンジンであるTendermint Coreの後継）は、自らを「任意の決定論的な有限状態機械に対し、ビザンチン耐障害性（BFT）状態機械レプリケーション（SMR）を実行する」ソフトウェアと説明しています（[Cosmosドキュメント：CometBFT](https://docs.cosmos.network/cometbft)）。つまり、一部のノードに障害があるか悪意を持っていても、独立して稼働する複数のノードを一つの一貫した複製台帳として動かします。

Tendermint型チェーンの**シビル耐性**は通常、ステーキングを組み合わせて実現します。PoSと同じように、バリデーターはステークで重み付けされます。一方、BFT投票プロトコル自体が**ファイナリティ**を提供します。あるラウンドで必要な特別多数のバリデーター署名を集めたブロックはコミットされ、PoWブロックのような再編成の対象にはなりません。その結果、実用的で高速な決済が可能です。Cosmos Networkは、CometBFTベースのチェーン全体で1秒未満のトランザクション決済を強調しています（[Cosmos Network](https://cosmos.network/#:~:text=%3C1%20second%20transaction%20settlement)）。これは、確認のために待つPoWモデルとは対照的です。トレードオフは、BFTプロトコルではバリデーター集合を既知かつ有限の規模にする必要があることです。通信の負荷がバリデーター数とともに増えるため、直接参加できるバリデーター数には上限があります。**採用チェーンの例：** Cosmos HubなどのCosmos SDKチェーン（CometBFT）、Binance Chain、元の実用ビザンチン耐障害性（PBFT）設計を基盤とする許可型または企業向け台帳。

---

## その他：プルーフ・オブ・ヒストリー、プルーフ・オブ・オーソリティ、プルーフ・オブ・スペース

さらにいくつかの方式を加えると、全体像が完成します。いずれも中核となるシビル耐性の問題を置き換えるのではなく、より限定された問題を解決します。

SolanaがPoSと併用する**プルーフ・オブ・ヒストリー（PoH）**は、独立したコンセンサスメカニズムではなく、暗号学的な時計です。「先に生成された状態のデータ」のハッシュを追加して繰り返し計算することで、検証可能なタイムスタンプをチェーンへ直接挿入します。これにより、バリデーター同士が時刻について通信しなくても、イベント間にどれだけ時間が経過したかを証明するシーケンスを作ります（[Solana：プルーフ・オブ・ヒストリー](https://solana.com/news/proof-of-history#:~:text=inserting%20data%20into%20the%20sequence%20by%20appending%20the%20hash%20of%20the%20data%20of%20the%20previously%20generated%20states)）。この時計は、コンセンサスに必要な検証可能な順序をバリデーターに提供しますが、トランザクションを並列実行する仕組みではありません。並列実行を担うのは**Sealevel**です。Solanaの各トランザクションは、読み取りまたは書き込みを行うすべてのアカウントを宣言します。そのためランタイムは、競合しないトランザクションに加え、同じ状態を読み取るだけのトランザクションも同時に実行できます（[Solana：Sealevel](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=The%20reason%20why%20Solana%20is%20able%20to%20process%20transactions%20in%20parallel,transactions%20that%20are%20only%20reading%20the%20same%20state%20to%20execute%20concurrently%20as%20well)）。

**プルーフ・オブ・オーソリティ（PoA）**は、オープンなマイニングやステークベースの検証を、許可された署名者の集合に置き換えます。PoWと比べ、ブロック生成にかかるリソースコストを大幅に削減します。ethereum.orgは、PoAではPoWのような大量のリソースを必要とするマイニングが不要になると説明しています（[ethereum.org：プルーフ・オブ・オーソリティ](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=as%20it%20overcomes%20the%20need%20for%20high%20quality%20resources%20as%20PoW%20does)）。ただし、ネットワークの運用コストやセキュリティコストがなくなるわけではありません。セキュリティとガバナンスの責任は、信頼されるバリデーターの身元と評判、署名者の承認ルールに移ります。PoAでは既知の署名者を信頼する必要があり、通常はKYCや広く認知された組織との関係によって身元を確認します（[ethereum.org：信頼される署名者](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=Proof%2Dof%2Dauthority%20requires%20trusting%20a%20set%20of%20authorized%20signers,if%20a%20validator%20does%20anything%20wrong%2C%20their%20identity%20is%20known)）。ethereum.orgが説明する実装では、署名者が他の署名者の追加・削除に投票します（[ethereum.org：署名者の承認](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=Each%20signer%20votes%20for%20the%20addition%20or%20removal%20of%20a%20signer%20in%20their%20block%20when%20they%20create%20a%20new%20block)）。この方式は分散性と引き換えに速度と低い運用コストを得るため、公開された敵対的なネットワークではなく、主にプライベートチェーン、テストネット、ローカル開発ネットワークで使われます。

**プルーフ・オブ・スペース**と、その関連方式であるプルーフ・オブ・スペースタイムは、計算能力やステークの代わりに割り当て済みのディスク容量を使います。参加者は未使用のハードディスク容量を確保したことを証明し、プロトコルは定期的に、今もその容量を保持していることの証明を求めます。PoWに似たシビル耐性を、はるかに小さいエネルギー消費で提供しますが、大量のストレージハードウェアが必要です。最もよく知られた例はChiaです。

---

## 各方式の比較

| 方式 | シビル耐性の基盤 | ファイナリティ | エネルギーコスト | 分散性 | 採用チェーンの例 |
|---|---|---|---|---|---|
| プルーフ・オブ・ワーク | 計算コスト（ハッシュ計算） | 確率的（承認数） | 非常に高い | 高い（パーミッションレスなマイニング） | Bitcoin、Litecoin、Dogecoin |
| プルーフ・オブ・ステーク | リスクにさらされる経済的ステーク | チェックポイント型 / エポック内でほぼ確定 | 非常に低い | 高い（数十万のバリデーター） | Ethereum、Cardano、Polkadot |
| デリゲーテッド・プルーフ・オブ・ステーク | デリゲートを選ぶステーク加重投票 | 選出された生成者ごとに高速で、ほぼ即時 | 非常に低い | 低め（選出された少数のバリデーター集合） | EOS、TRON |
| BFT型（Tendermint / CometBFT、PBFT） | ステークまたは許可されたID + 特別多数決 | コミット後は即時かつ決定論的 | 低い | 中程度（規模が限定されたバリデーター集合） | Cosmos Hub、Binance Chain |
| プルーフ・オブ・オーソリティ | 審査済みのID / 評判 | 高速で、ほぼ即時 | 非常に低い | 低い（信頼された少数のバリデーター集合） | プライベート / 企業向けチェーン、テストネット |
| プルーフ・オブ・スペース | 割り当て済みストレージ容量 | 確率的（ブロックベース） | 低い | 中程度（ストレージハードウェアに依存） | Chia |

---

## トークン化ドメインとの関係

コンセンサスメカニズムは、あらゆる[トークン化ドメイン](/ja/blog/what-are-tokenized-domains/)を支える目に見えない基盤です。`.com`、`.ai`、`.io`ドメインが[NFT（非代替性トークン）](/ja/glossary/nft/)として発行されるとき、そのトークンを誰が所有しているかという記録と、その後の移転、売却、更新はすべて、トークンが存在するチェーンを守るコンセンサスメカニズムと同じ程度にしか信頼できません。[イーサリアム](/ja/glossary/ethereum/)上で発行されたドメインNFTは、PoSの高速で低コストなファイナリティと、数十万規模のバリデーター集合を受け継ぎます。同じ資産がPoWチェーン上にあれば、確率的ファイナリティとはるかに高いトランザクションコストを受け継ぎます。チェーンの基盤となる方式と、そのシビル耐性やファイナリティの保証が実際に何を意味するのかを理解することは、トークン化ドメインを含む、あらゆるオンチェーン資産を評価するうえでの一要素です。

---

## 出典と参考資料

- [Bitcoin：ピアツーピア電子現金システム（Nakamotoホワイトペーパー）](https://bitcoin.org/bitcoin.pdf)
- [ethereum.org — プルーフ・オブ・ワーク](https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/)
- [ethereum.org — プルーフ・オブ・ステーク](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/)
- [ethereum.org — プルーフ・オブ・オーソリティ](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/)
- [ethereum.org — エネルギー消費](https://ethereum.org/en/energy-consumption/)
- [Cosmosドキュメント — CometBFT](https://docs.cosmos.network/cometbft)
- [Cosmos Network](https://cosmos.network/)
- [Binance Academy — デリゲーテッド・プルーフ・オブ・ステークの解説](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)
- [Solana — プルーフ・オブ・ヒストリー](https://solana.com/news/proof-of-history)
- [Solana — Sealevel：数千のスマートコントラクトを並列処理](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
