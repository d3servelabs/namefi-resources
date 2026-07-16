---
title: "ENSおよびトークン化ドメインの査定：オンチェーンのコンプスを読む"
date: '2026-06-24'
language: ja
tags: ['domains', 'domain-flipping', 'web3', 'analysis']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 40
format: analysis
description: "オンチェーンのコンプス、フロア対プレミアムの考え方、ENSクラブ要因を使ってENSおよびトークン化ドメインを査定する方法と、DNS査定との違いを解説します。"
ogImage: ../../assets/appraising-onchain-domains-og.jpg
keywords: ['ENSドメイン査定', 'ENSドメイン価値評価', 'トークン化ドメイン査定', 'オンチェーンコンプス', 'ドメイン比較売買データ', 'NameBioコンプス', 'ENSフロア価格', 'ENS 999クラブ', 'ENS 10kクラブ', 'ENS名の価値算定', 'トークン化ドメインの価値', 'Web3ドメイン査定', 'ERC-721ドメイン価値', 'オンチェーン売買履歴', 'ドメインフロア対プレミアム']
relatedArticles:
  - /ja/blog/onchain-domain-flipping/
  - /ja/blog/how-to-read-comparable-domain-sales/
  - /ja/blog/domain-appraisal-tools-compared/
  - /ja/blog/domain-flipping/
  - /ja/blog/onchain-domain-marketplaces-compared/
relatedTopics:
  - /ja/topics/domain-investing/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/tld/
  - /ja/glossary/icann/
  - /ja/glossary/dns/
  - /ja/glossary/registry/
---

査定こそが、ドメインフリップで利益を生むかどうかを決める技術です。仕入れは何が売りに出ているかを教えてくれ、販売は名前を現金に変えますが、その中間にある数字――そのドメインの実際の価値――こそがマージンの源泉です。`.com`でも、オンチェーンでも、この原則は変わりません。ただしオンチェーンでは、[DNS](/ja/glossary/dns/)アフターマーケットでは通常得られない情報が手に入る場合があります。それは公開されたタイムスタンプ付きの所有権履歴であり、マーケットプレイスプロトコルが対価を記録していれば、監査可能な取引証拠です。ただし、これは完全な売買記録と同じではありません。移転の一部は売買ではなく、支払いや取引条件の一部がオフチェーンに残ることもあります。本記事は[ドメインフリッピング](/ja/blog/domain-flipping/)プレイブックの査定章であり、[オンチェーンドメインフリッピング](/ja/blog/onchain-domain-flipping/)で取引される2つの資産――[ENS](/ja/glossary/ens/)ネームとトークン化ICANNドメイン――に焦点を当てます。

手法は、プロの査定士や不動産エージェントが使うものと同じです：コンプス（比較事例）です。Wikipediaの定義によれば、[コンパラブルス（コンプス）とは不動産査定の用語で、価値を求めようとする対象物件と似た特徴を持つ物件を指す](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property)。ドメインには相場価格がないため、類似した名前が最近いくらで売れたかをもとに価値を推定します。オンチェーン特有の利点は、売買だとされる取引について、申告をそのまま信用するのではなく、プロトコル固有のマーケットプレイスイベントや決済イベントと照合できる場合が多いことです――ただし、それらのイベントが対価を明らかにしている場合に限られます。

## コンプスの出所

![査定士のイラスト。虫眼鏡を持ち、ブロックチェーンキューブから流れ出る最近の比較売買価格タグが記された透明なオンチェーン台帳を読んでいる](../../assets/appraising-onchain-domains-01-onchain-comps.jpg)

従来のドメインにおける定番のコンプスデータベースは[NameBio](https://namebio.com/)です。キーワード、拡張子、価格、日付でフィルタリングできる過去の[ドメイン](/ja/glossary/domain-trading/)売買履歴のアーカイブです。DNSアフターマーケットにおける公開価格フィードに最も近い存在であり、査定対象と似た名前を検索し、実際の成約価格を確認することで、感覚ではなく証拠から妥当な価格帯を構築できます。見出しの数字はあくまで参考値として扱ってください――報告される売買は掲載する価値があるものに偏っており、成約データベースは売れなかった名前については何も教えてくれません――しかし出発点としては、あらゆる自動査定ツールよりも優れています。[ドメイン価値の評価方法](/ja/blog/how-to-value-a-domain-name/)に関するガイドが[比較売買データ](/ja/glossary/comparable-sales/)をアルゴリズムより重視するのはそのためです。

オンチェーンでは、コンプスの根拠がより豊富な場合があり、無料で確認できます。ENSネームやトークン化ドメインは[NFT](/ja/glossary/nft/)であり、[ERC-721](/ja/glossary/erc-721/)標準に準拠します。Ethereumの仕様では、ERC-721は[スマートコントラクト内でNFTを実装するための標準API](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs)と説明されています。[`Transfer`イベントが記録するのは、送信者、受信者、トークンIDだけで示される所有権の変更です](https://eips.ethereum.org/EIPS/eip-721#specification)。その移転が売買かどうかや、取引価格は記録しません。売買の内容を再構成する方法はマーケットプレイスごとに異なります。例えばSeaportの[`OrderFulfilled`イベントは、オファーと対価を別々の配列として記録します](https://docs.opensea.io/docs/seaport-events-and-errors#orderfulfilled)。対応するマーケットプレイスでは、これらの記録から売買履歴、リスティング、フロア価格を組み立てられます。しかし、ウォレット間の移転、オフチェーン決済、複雑なバンドル取引には追加の検証が必要であり、明確なコンプスにできない場合があります。査定上の利点は、完全な売買記録が自動的に得られることではなく、より強力な監査証跡を得られることです。

## フロア対プレミアム

![価格チャートのイラスト。多数の均等な小さな名前タイルが形成する平坦なフロアベースラインと、そのラインを大きく上回るいくつかの際立ったプレミアムタイルを描いている](../../assets/appraising-onchain-domains-02-floor-vs-premium.jpg)

オンチェーン査定において最も有用なフレームは「フロア対プレミアム」であり、これらの資産が実際に取引される様子に正確に対応しています。

**フロア**とは、認知された特定のカテゴリ内で最も安く出品されている名前――[マーケットプレイス](/ja/glossary/marketplace/)コレクションにおける最安値の売り注文です。類似した名前のクラス（例：5文字の`.eth`名や4桁のランダムな数字）において、フロアはベースラインとなります：そのセットの汎用的で差別化されていないメンバーが今いくらかを大まかに示します。フロアは市場と話題性に応じて変動するため、引用するフロアはスナップショットであり定数ではありません。

**プレミアム**とは、特定の名前がフロアを超えて得られる価値のすべてです――より短いこと、実際の辞書の単語であること、有名なブランドであること、若い番号であることなど。査定士の仕事の大半はプレミアムを正当化することです：フロアは画面から読み取れますが、フロアと`crypto.eth`が獲得するであろう価格との差は、コンプスで裏付けた判断の問題です。重要なのは、夢の数字から下向きに逆算するのではなく、まずフロアを基準に据え、比較売買事例から上方向にプレミアムを積み上げるという規律です。

ENSはこれを具体化しています。ENS自身の登録料が文字数によって段階的に設定されているからです。ENSドキュメントによれば、[5文字以上の`.eth`は年間5USDのコスト](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)がかかりますが、4文字・3文字の名前は設計上より高い登録料となっています。このプロトコルレベルの希少性シグナル――短い名前は保有するだけでコストがかかる――は、一つの売買事例を見る前から、プレミアムがどこに集中するかを示しています。

## ENSの希少性とクラブ要因

![ENSスタイルの名前トークンが希少性ティアに仕分けられるイラスト。3桁ティア、4桁ティア、パリンドローム、短い名前がランク付きのバッジ棚に並んでいる](../../assets/appraising-onchain-domains-03-club-factors.jpg)

ENSには、いかなるDNS拡張子も持たない特性があります：組織化された希少性ティアです。「クラブ」とは純粋に形状によって定義された名前の集合であり、メンバーシップは価値の強力かつ明確なドライバーとなっています。

最もよく知られているのは数字クラブです。999クラブは`000.eth`から`999.eth`までの1,000個の3桁の名前であり、10kクラブは`0000.eth`から`9999.eth`までの10,000個の4桁の名前です。各クラブの供給量が固定されており極めて少ないため、これらは可視化されたフロアと薄いプレミアムテールを持つコレクティブルシリーズのように取引されます。数字はまた言語中立であり誤入力が難しく、それ自体が投機的市場となった一因です。同じロジックは短いアルファベット文字列、パリンドローム、絵文字名前にも当てはまります：パターンが希少で判読しやすいほど、フロアに対するプレミアムが厚くなります。

天井となる売買事例は、プレミアムテールがどこまで伸びるかを示しています。記録上最大のENS売買は`paradigm.eth`で、The Blockの報道によれば[2021年10月に420 ETH（当時約150万ドル）で購入されました](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=purchased%20in%20October%202021%20for%20420%20ETH)。また`000.eth`――999クラブの筆頭メンバー――は[300 ETH（315,000ドル）で購入され](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)、[ETH建て・ドル建ての両方で2番目に大きな売買となりました](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=making%20it%20the%20second%2Dlargest%20sale)。これらは例外的な事例であり、ETH建てで価格が付けられているため、ドル換算値はトークン価格に連動して変動します――しかし曲線の上端を定める基準点になります。クラブ名を査定する際には、フロアと天井の両方がオンチェーンで観察可能な分布上にその名前を位置づけることになります。これらの名前が他のオンチェーン資産とどう関係するかについては、[プレミアムWeb3 TLD](/ja/blog/premium-web3-tlds/)および[ENS vs Unstoppable vsトークン化DNS](/ja/blog/ens-vs-unstoppable-vs-tokenized-dns/)の比較をご覧ください。

## トークン化ICANNドメインの査定はDNS査定である

ここで混同してはならない一線があります。トークン化ICANNドメインは、ラベルが異なるだけのENSネームではありません――本物の`.com`、`.xyz`、`.io`であり、その所有権がトークンとして反映されているだけで、基盤となる名前は引き続きあらゆる場所で解決されます。[トークン化ドメインとは何か](/ja/blog/what-are-tokenized-domains/)の解説で述べているように、これらは*オンチェーン層も持つ*本物のDNSドメインであり、並行したネームスペースではありません。査定における実際的な帰結：トークン化`.com`の価値評価は、あらゆる`.com`の評価と同じ方法で行います――NameBioのDNSコンプスと、文字数・キーワード需要・拡張子の強さという通常の基本要因を用います――なぜなら買い手が支払うのは普遍的に解決可能な名前に対してであり、ウォレットハンドルに対してではないからです。

したがって、コンプスセットは明確に分かれます。`acme.eth`を査定するならENSの売買データとクラブのフロアを参照します。その価値はクリプトネイティブなアイデンティティだからです。トークン化された`acme.com`を査定するなら`.com`のコンプスを参照します。その価値はたまたまオンチェーンで決済されるだけの実在するウェブアドレスだからです。この2つを混同することが、この分野で最も多い査定ミスです――同じルート単語のトークン化`.com`と`.eth`は、異なる買い手と全く異なるコンプスを持つ別製品です。この区別の取引サイドのバージョンは[ENS vs DNSドメインフリッピング](/ja/blog/ens-vs-dns-domain-flipping/)で、トークン化が取引を変える仕組みは[トークン化がドメインフリッピングを変える方法](/ja/blog/how-tokenization-changes-domain-flipping/)で詳しく解説しています。

## オンチェーン査定とDNS査定の違い

インプットは似ていますが、名前がトークンになると4つの点で本質的な違いが生じます。

**コンプスの根拠は推測で済ませず、監査できます。** NameBioのエントリーは誰かが開示することを選んだ売買ですが、オンチェーンの所有権変更は誰でも読める[スマートコントラクト](/ja/glossary/smart-contract/)イベントであり、プロトコルが対価を記録していれば、マーケットプレイスでの売買も検証できます。ただし、ERC-721の`Transfer`イベントだけでは不十分です。コンプスとして扱う前に、売買プロトコル、決済資産、バンドルされた資産、オフチェーン部分、ウォッシュトレードの可能性を特定する必要があります。

**ライブフロアが存在します。** DNSドメインにはフロア価格がなく、それぞれが個別の交渉です。オンチェーン名前のコレクションにはフロアがあり、変動するフロアは`.com`の評価では起こらない形で、査定を時間単位で変化させます。

**決済の摩擦は構造的に減らせますが、市場流動性は自動的には生まれません。** マーケットプレイスコントラクトは、支払いとトークンを[アトミックトランスファー](/ja/glossary/atomic-transfer/)で交換できます。すべての処理が一括で成立するか、まったく成立しないかのどちらかであり、受け渡し工程を減らし、決済の時間、コスト、リスクを低減できる可能性があると、[BISはアトミック決済の概説で説明しています](https://www.bis.org/publ/othp99.htm)。これは決済メカニズムを改善しますが、それだけでオンチェーンの[ドメイン流動性](/ja/glossary/domain-liquidity/)が高まるわけではありません。買い手の需要、売り手の供給、厚みのある売り手・買い手の両面市場は、アトミック決済だけで生まれないからです。アトミック実行により、ドメインを[NFTとして売る](/ja/blog/selling-domains-as-nfts/)際に、エスクローエージェントや移管待ちの期間を省ける場合はあります。[ニューヨーク連銀は市場流動性を多面的なものと説明しており](https://www.newyorkfed.org/newsevents/speeches/2015/dud150930.html)、ビッド・アスク・スプレッド、市場の厚み、価格インパクトなどの要素で測定されるとしています。これらは決済メカニズムと分けて評価してください。決済ワークフローの詳細は、[トークン化マーケットプレイスがエスクローを置き換える方法](/ja/blog/how-tokenized-marketplaces-replace-escrow/)で解説しています。

**クリプト建て価格が第2の変数を加えます。** オンチェーンのコンプスのほとんどはETH建てです。「5 ETH相当」の名前は、トークンの動きだけで何千ドルも変動する可能性があるため、ETH建てで査定するのかフィアット建てで査定するのかを常に明記してください――両者は異なる物語を語ります。ETHフロアを安定したドル価格として扱うことが、査定が狂う原因になります。

共通する結論はこうです。オンチェーン査定では、より監査しやすい所有権履歴と迅速な決済が得られる可能性があり、マーケットプレイスが対価を記録していれば、コンプスの根拠もより豊富になります。しかし、核心となる査定技術は変わりません。フロアを基準に据え、検証済みの比較売買事例でプレミアムを正当化し、正しい資産に対して正しいコンプスセットで価格を付けます。[Namefi](https://namefi.io)のようなプラットフォーム上のトークン化`.com`は、実在するドメインとして査定され、`.eth`はオンチェーンのコレクティブルとして査定されます。コンプスセットさえ正しければ、あとは計算の問題です。

## 免責事項（必ずお読みください）

> 私たちは弁護士、会計士、ファイナンシャルアドバイザー、医師ではなく、**本記事のいかなる内容も法律、金融、税務、会計、医療、その他いかなる種類の専門的アドバイスでもありません。**これらの記事は自分たちの学習と、顧客の皆様への参考情報として執筆しています。ここに記載された情報は古くなっている場合があり、地域特有のものであったり、単純に誤りを含む場合もあります。私たちもミスをします。
>
> 重要な決定を行う際は、**必ず実際の専門家にご相談ください（真剣に！）**。それがお好みでない場合は、友人、Twitter、Reddit、AI、または占い師に聞いてみてください。要するに：**DYOR（Do Your Own Research＝自分で調査しよう）**。共に学び、楽しみましょう。

## 出典と参考資料

- Wikipedia — [コンパラブルス（類似した最近の売買による査定手法）](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property)
- NameBio — [過去のドメイン名売買の検索可能なデータベース](https://namebio.com/)
- Ethereum Improvement Proposals — [ERC-721：`Transfer`イベントは売買の対価ではなく、`_from`、`_to`、`_tokenId`を記録](https://eips.ethereum.org/EIPS/eip-721#specification)
- OpenSea Documentation — [Seaportの`OrderFulfilled`イベントは、オファーと対価を別々の配列として記録](https://docs.opensea.io/docs/seaport-events-and-errors#orderfulfilled)
- Bank for International Settlements — [アトミック決済と、決済の速度、コスト、リスクへの潜在的影響](https://www.bis.org/publ/othp99.htm)
- Federal Reserve Bank of New York — [市場流動性の指標にはビッド・アスク・スプレッド、市場の厚み、価格インパクトが含まれる](https://www.newyorkfed.org/newsevents/speeches/2015/dud150930.html)
- ENS Documentation — [名前の長さによる`.eth`レジストラの価格（5文字以上＝年間5ドル）](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- The Block — [000.ethが300 ETH（315,000ドル）で売却；paradigm.ethが420 ETH（約150万ドル、2021年10月）で売却；ENSネームはOpenSea上のNFT](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
