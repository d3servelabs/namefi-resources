---
title: "ENS vs DNS ドメインフリッピング：何が違うのか"
date: '2026-06-24'
language: ja
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 33
format: comparison
description: "ENS の .eth ネームと従来の DNS ドメインのフリッピングの違いを解説。所有権、流動性、更新、ガス代、それぞれの適した用途を比較します。"
ogImage: ../../assets/ens-vs-dns-domain-flipping-og.jpg
keywords: ['ENS vs DNS', 'ENS ドメイン フリッピング', '.eth ドメイン 投資', '.eth ネーム 売買', 'ENS vs 従来ドメイン', 'オンチェーン ドメイン フリッピング', 'NFT ドメイン 流動性', 'ENS 更新料', 'ERC-721 ドメイン', 'web3 ドメイン フリッピング', 'OpenSea で ENS を売る', 'ENS 失効 猶予期間', 'トークン化ドメイン フリッピング', 'ENS ガス代']
relatedArticles:
  - /ja/blog/onchain-domain-flipping/
  - /ja/blog/how-tokenization-changes-domain-flipping/
  - /ja/blog/onchain-domain-marketplaces-compared/
  - /ja/blog/selling-domains-as-nfts/
  - /ja/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /ja/topics/domain-investing/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/dns/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
  - /ja/glossary/web3/
---

ドメインフリッピングに取り組んでいる人なら、[ENS](/ja/glossary/ens/) 市場を横目に眺めながら、「これは外見が変わっただけで同じゲームなのか」と思ったことがあるかもしれない。実際はそうではない。`.eth` ネームをフリップすることと従来の `.com` をフリップすることは、根本的な発想は似ている――安く良い文字列を仕入れ、それを必要としている人に高く売る――しかし、その下に広がる仕組みはほぼすべて異なる。所有権を誰が確認できるか、売却がどう決済されるか、ネームを保有し続けるためにいくら払うか、そもそも「所有する」とはどういう意味か。この記事では実際の違いを整理して、自分の時間と資金をどこに投じるべきかを判断できるようにする。

まず一点確認しておきたい。この領域は概念が混同されやすい。ENS の `.eth` ネームと**トークン化 DNS ドメイン**は別物だ。`.eth` ネームは完全に[オンチェーン](/ja/glossary/on-chain/)に存在し、リゾルバやブリッジがなければ通常のブラウザでは解決されない。一方、トークン化された `.com` は[ICANN](/ja/glossary/icann/)の正規ドメインであり、オンチェーンのトークンも持っている――通常の `.com` と同様にどこでも解決される。この三者の違いについては[トークン化ドメイン vs web3 ドメイン](/ja/blog/tokenized-domain-vs-web3-domain/)と[ENS vs Unstoppable vs トークン化 DNS](/ja/blog/ens-vs-unstoppable-vs-tokenized-dns/)の比較記事で詳しく掘り下げている。本記事は ENS `.eth` フリッピングと従来の DNS フリッピングの比較に絞っている――第三のカテゴリが両者の長所を兼ね備えていることは、頭の隅に置いておいてほしい。

## 実際に何を購入しているのか

![セルフカストディの NFT ネームトークンと鍵を自分の手の中のウォレットに保管しているイメージと、サードパーティによってロックされたレジストラのログインとリース文書のイメージを対比した編集イラスト](../../assets/ens-vs-dns-domain-flipping-01-custody.jpg)

従来の DNS ドメインは「登録」だ。ICANN 認定の[レジストラ](/ja/glossary/registrar/)に料金を払い、ネームがレジストリのデータベースに記録される。文字列を直接所有するわけではなく、更新可能なリースを保有しているにすぎず、管理の窓口はレジストラのログインになる。

ENS ネームはその性質が根本的に異なる。ENS のドキュメントが述べているように、[Ethereum Name Service（ENS）はイーサリアムブロックチェーンを基盤とした、分散型でオープンかつ拡張可能な名前解決システムである](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)。登録された `.eth` ネームは[NFT](/ja/glossary/nft/)――具体的には[ERC-721](/ja/glossary/erc-721/)トークン――であり、自分の[ウォレット](/ja/glossary/wallet/)の中に存在する。ENS のドキュメントには、ユーザーが[他の ERC721 トークンと同様にネームを転送できる](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)と明示されている。その基盤となる ERC-721 規格は[非代替性トークン（いわゆる証書）の標準インターフェース](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)であり、[NFT の追跡と転送の基本機能を提供する](https://eips.ethereum.org/EIPS/eip-721#:~:text=This%20standard%20provides%20basic%20functionality%20to%20track%20and%20transfer%20NFTs)。

つまり最初の違いはカストディにある。DNS ではレジストラがアカウントの鍵を持ち、レジストリが権威レコードを保持する。ENS では[スマートコントラクト](/ja/glossary/smart-contract/)がレコードを保持し、鍵を持つのは*自分自身*だ。これはフリッパーにとって両刃の剣となる。売却時の仲介業者が不要になる半面、[カストディ](/ja/glossary/custodial-ownership/)の全責任が自分の[シードフレーズ](/ja/glossary/wallet/)にかかってくる。

## 所有権はパブリックで、オンチェーンで、監査可能

`.com` を購入しても、所有権はある意味プライベートだ。WHOIS データはしばしば伏せられ、移転履歴は不透明で、買い手はネームがクリーンで担保なしであることを売り手の言葉に頼るほかない。

ENS はこれを逆転させる。すべての登録、移転、売却がオンチェーンのトランザクションとして記録されるため、ネームの来歴は公開かつ永続的だ。誰でも `crypto.eth` をどの[ウォレット](/ja/glossary/wallet/)が保有しているか、最後にいつ誰に移転されたか、いくらで取引されたかを読み取ることができる。フリッパーにとってはプラスマイナスある。プラス面は、デューデリジェンスが容易で、偽造が困難で、[エスクロー](/ja/glossary/escrow/)エージェントの保証なしに買い手が数秒で所有権を確認できること。マイナス面は、自分のポートフォリオもコスト情報も競合相手から丸見えになること、そして「自分がフリッパーだ」と一目でわかるウォレットは、より不利なオファーを引き寄せることがある。従来のドメイン取引では静かにしていられるが、ENS ではそれができない。

この透明性こそが、オンチェーンネームをプログラム的に評価・取引しやすくしている性質でもある。詳しくは[オンチェーンドメインの価格査定](/ja/blog/appraising-onchain-domains/)で取り上げている。

## セカンダリ市場の流動性：ブローカーではなくマーケットプレイス

![NFT マーケットプレイスの店頭で一ステップのアトミックスワップが行われるイメージと、仲介者を経由する遅い複数ステップのエスクローの経路を対比した編集イラスト](../../assets/ens-vs-dns-domain-flipping-02-settlement.jpg)

ENS が体験を本当に変えているのはここだ。`.eth` ネームが ERC-721 トークンである以上、ドメイン業界専用のインフラを必要とせず、汎用の NFT [マーケットプレイス](/ja/glossary/marketplace/)――OpenSea、Blur など――とネイティブに互換する。他の NFT と同じように出品でき、売却はマーケットプレイスの標準[スマートコントラクト](/ja/glossary/smart-contract/)を通じて決済される。

この決済こそが最大の違いだ。従来のドメイン売却は複数日にわたる段取りを要する。価格に合意し、エスクローを開設し、買い手が入金し、レジストラで[移転](/ja/glossary/atomic-transfer/)を実行し、レジストラが確認し、エスクローが解放される。ENS の売却は[アトミックトランスファー](/ja/glossary/atomic-transfer/)だ。買い手の支払いと自分のトークンが単一のトランザクションの中で交換され、どちらかが失敗すれば双方とも成立しない。取引中に第三者が資産を預かる必要がない。これはトークン化ドメインの売却がエスクロー不要である仕組みと同じ原理だ。詳しくは[トークン化マーケットプレイスがエスクローに取って代わる方法](/ja/blog/how-tokenized-marketplaces-replace-escrow/)と[オンチェーンドメインマーケットプレイスの比較](/ja/blog/onchain-domain-marketplaces-compared/)を参照してほしい。

ただし流動性には大きな落とし穴がある。NFT マーケットプレイスは*NFT*については流動的だが、`.eth` ネームを購入するのは「そのネームを特に必要としていて、かつクリプトに精通した」買い手に限られる。優れた `.com` は地球上のあらゆる企業に売れるが、優れた `.eth` が売れる相手は、ETH を保有し、ウォレットを運用し、オンチェーンネームの価値を認める、はるかに小さいプールに限定される。決済は速くなるが、需要は薄い。「転送が即時」と「売りやすい」を混同しないようにしたい。

## 更新・失効の仕組みは同じではない

![寛大な猶予期間のセーフティネットが落下するドメインタグを受け止めるイメージと、厳格なダッチオークションのカウントダウンと下がり続ける価格・失効したネームをスナイプする手のイメージを対比した編集イラスト](../../assets/ens-vs-dns-domain-flipping-03-expiry.jpg)

どちらのシステムもネームを維持するための料金を徴収するが、その仕組みはポートフォリオ運用に影響する点で大きく異なる。

従来の DNS はレジストラの規約に基づいている。[gTLD](/ja/glossary/gtld/)の登録は最長10年保有できる――Wikipedia によれば[gTLD ドメイン名の最長登録期間は10年](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)――そして平凡な `.com` の更新料は安価だ。Wikipedia は2023年時点で[小売価格は概ね年間約9.70ドルから](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=the%20retail%20cost%20generally%20ranges%20from%20a%20low%20of%20about%20%249.70%20per%20year)と記している。更新を忘れても、名前が本当に失効するまでには、数週間単位の猶予期間（リデンプションウィンドウ）という緩和措置がある。

ENS は文字数に応じた年額料金を ETH で支払う方式だ。ENS のドキュメントによれば、5文字以上のネームは年間約5ドル、4文字のネームは約160ドル、3文字のネームは約640ドルとなっている――短く希少な文字列ほど高額なのは買い占めを抑止するためだ（本稿執筆時点の目安であり、ENS の料金は USD 建てで ETH 決済されるため、正確な ETH 額は市場によって変動する）。失効後の経路はより厳格で、買い占めを促す設計になっている。ネームが失効した後、ENS のドキュメントでは[名前の失効後（猶予期間終了後）90日間](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires)の窓が設けられると説明されており、その後は[21日間のダッチオークション](https://docs.ens.domains/registry/eth/#:~:text=a%2021%20day%20dutch%20auction)が始まり、回収価格は非常に高い水準からスタートして通常の料金水準まで下落していく。フリッパーにとってこのオークションはリスクでもあり機会でもある。価値あるネームを失効させれば競合にスナイプされるリスクがあるが、規律ある監視者であれば、ダッチ価格が下がるにつれてプレミアムなネームを回収するチャンスにもなる。

実務的な教訓は、ENS は DNS よりも厳格な更新管理を求めるということだ。猶予の仕組みは緩くなく、更新を見逃した結果は静かなドロップではなく、競合が注視している公開オークションだ。

## ガス代と決済コスト

従来のドメインのコストは予測しやすい。更新の固定費、折々の移転手数料、エスクローのマージン程度だ。ポートフォリオの年間保有コストをドル単位で計画できる。

ENS には自分では制御できない変動費が加わる。ガスだ。登録、更新、移転、出品など、すべてのオンチェーンアクションはネットワーク混雑に応じて変動するイーサリアムのトランザクション手数料を伴う。静かな日には微々たる額だが、ミントラッシュや市場急騰時には、安価なネームの5ドルの更新料よりガス代のほうがはるかに高くなることもある。これは低額フリップの採算計算を狂わせる。200件の雑多な `.com` を更新するコストは一定で把握できるが、200件の低グレード `.eth` ネームを更新するコストは、手数料よりガス代のほうが圧倒的に高くなりえるし、手数料自体も ETH の価格とともに変動する。レイヤー2やバッチ処理ツールはこの問題を緩和するが、核心は変わらない。ENS の保有コストは DNS より不規則で予測しにくく、その予測不能性は数量をこなす人にとって実際のコストとなる。

## それぞれの適した用途

どちらが絶対的に優れているわけではなく、フリッパーのタイプと対象のネームによって適性が分かれる。

**従来の DNS フリッピング**が有利なのは、買い手がクリプトユーザーではなく*事業者*の場合だ。`austinplumbing.com` をウェブサイト、メール、Google 検索のために必要としているエンドユーザーがいる。買い手プールは経済全体に広がり、ネームはあらゆる場所でまったく摩擦なく機能し、保有コストは予測可能で、ノウハウも成熟している。代償は、エスクロー依存で時間のかかる決済と不透明な所有権だ。[ドメインフリッピング](/ja/blog/domain-flipping/)の大部分のノウハウ――仕入れ、[査定](/ja/blog/how-to-value-a-domain-name/)、アプローチ――はここで培われてきた。

**ENS フリッピング**が有利なのは、ネームの価値が*クリプトネイティブ*である場合だ。クリーンなウォレットアイデンティティ、プロトコルや DAO のハンドル、短いコレクタブル文字列などがその例だ。決済はアトミックで、所有権はセルフカストディで、資産はオンチェーンアプリと組み合わせ可能だ。代償は、買い手プールの狭さ、ガスの変動リスク、厳格な失効ルール、そして鍵管理の全責任を負うこと――ウォレットを失えばネームも失われる。だからこそ[ウォレット紛失後のオンチェーンネームの回復](/ja/blog/recovering-a-tokenized-domain-after-wallet-loss/)と[マルチシグカストディ](/ja/glossary/multi-sig/)が DNS よりもはるかに重要になる。

そして、どちらかを選ばなくて済む第三の道がある。**トークン化 DNS ドメイン**――オンチェーントークンを付与した本物の `.com`――は、DNS の普遍的な買い手プール*と* ENS のアトミックかつエスクロー不要の決済・セルフカストディを兼ね備える。それが[Namefi](https://namefi.io)が構築している領域だ。もともとフリップするつもりだったネームをトークン化して、どこでも解決され続ける状態を維持しつつ、エスクローの煩わしさなしにオンチェーンで売却できる。オンチェーンの側面を真剣に検討しているなら、クラスターの軸となる[オンチェーンドメインフリッピング](/ja/blog/onchain-domain-flipping/)と[トークン化がドメインフリッピングを変える方法](/ja/blog/how-tokenization-changes-domain-flipping/)で全体像を確認し、[NFT としてドメインを売却する](/ja/blog/selling-domains-as-nfts/)で出品の仕組みを押さえておくといい。

## まとめ

ENS と DNS のフリッピングは精神を共有しながら、その仕組みはほぼ何一つ共通しない。ENS は公開された所有権、NFT マーケットプレイスの[流動性](/ja/glossary/domain-trading/)、アトミック決済を提供する――その代償は、買い手プールの狭さ、ガスの変動リスク、厳しい失効ルール、そしてセルフカストディリスクだ。DNS は普遍的な買い手プール、予測可能な保有コスト、寛大な更新猶予を提供する――その代償は、遅くてエスクロー依存の不透明な移転だ。賢いフリッパーは一方に肩入れするのではなく、ネームを市場に合わせて選ぶ。そしてますます多くの人が、二者択一をやめるためにトークン化 DNS に手を伸ばしている。

## 免責事項（必読！）

> 筆者は弁護士でも会計士でも金融アドバイザーでも医師でもなく、**本記事のいかなる内容も法律、金融、税務、会計、医療、その他いかなる種類の専門的アドバイスにも該当しません。** これらの記事は自らの学習と、読者への参考情報提供を目的として書いています。掲載情報は古くなっている場合、特定の地域にのみ適用される場合、あるいは単純に誤っている場合があります。私たちも間違いを犯します。
>
> 重要な意思決定に際しては、**必ず専門家に相談してください（本当に！）**。それが難しければ、友人に、Twitter に、Reddit に、AI に、あるいは占い師に聞いてみてください。要するに、**DOYR（Do Your Own Research）――自分で調査しましょう。** 一緒に学び、楽しみましょう。

## 出典・参考資料

- ENS Docs — [What is ENS?（イーサリアムブロックチェーン上の分散型名前解決システム）](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)
- ENS Docs — [ETH Registrar（.eth ネームは任意の ERC721 トークンと同様に転送可能；失効後の猶予期間とダッチオークション；文字数に応じた年額料金）](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- Ethereum Improvement Proposals — [ERC-721 Non-Fungible Token Standard（「非代替性トークン（いわゆる証書）の標準インターフェース」）](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- Wikipedia — [Domain name registrar（gTLD の最長10年登録期間；`.com` 更新料の目安）](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)
