---
title: "オンチェーン・ドメインマーケットプレイス比較：OpenSea、Seaport、そしてその先へ"
date: '2026-06-24'
language: ja
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 36
format: comparison
description: "OpenSea、Seaportベース、そしてドメイン特化型のオンチェーンマーケットプレイスを手数料・リーチ・カストディの観点から比較——トークン化ドメイン売却に最適な取引場所を選ぶ。"
ogImage: ../../assets/onchain-domain-marketplaces-compared-og.jpg
keywords: ['オンチェーン ドメイン マーケットプレイス', 'トークン化ドメイン 取引所', 'ドメイン NFT 売却', 'OpenSea ドメイン', 'Seaport プロトコル', 'NFT マーケット 手数料', 'ドメインフリッピング web3', 'トークン化ドメイン 売る場所', 'OpenSea vs Blur', 'アトミック NFT 売買', 'ERC-721 ドメイン', 'ドメイン NFT マーケット 比較', 'Namefi マーケットプレイス', 'セルフカストディ ドメイン売却', 'オンチェーン ドメイン 取引']
relatedArticles:
  - /ja/blog/selling-domains-as-nfts/
  - /ja/blog/onchain-domain-flipping/
  - /ja/blog/tokenize-your-com-to-flip-it/
  - /ja/blog/how-tokenization-changes-domain-flipping/
  - /ja/blog/ens-vs-dns-domain-flipping/
relatedTopics:
  - /ja/topics/domain-investing/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/dns/
  - /ja/glossary/tld/
  - /ja/glossary/web3/
---

[トークン化ドメイン](/ja/blog/what-are-tokenized-domains/)——本物のICANN名称の上にオンチェーンの所有権トークンを載せたもの——をフリッピングするなら、従来のドメイン業界では考えられなかった選択肢がある。一般的な暗号資産マーケットプレイスで[NFT](/ja/glossary/nft/)としてリスト掲載する方法、サードパーティのカストディが不要な[Seaport](/ja/glossary/smart-contract/)ベースの取引所を使う方法、あるいはこの資産クラスに特化したドメイン専用プラットフォームを利用する方法だ。どの経路も同じトークンを動かすが、手数料・リーチ・カストディモデルはそれぞれ大きく異なる。選択を誤れば、買い手を逃したり、マージンの一部を失ったりしかねない。

本ガイドでは、オンチェーン取引所の三つの系統——OpenSea等の汎用NFTマーケットプレイス、Seaportベースのゼロ手数料マーケットプレイス、そして[Namefi](https://namefi.io)を含むドメイン特化型プラットフォーム——を、フリッピングの成否を左右する四つの指標（手数料・リーチ・カストディ・取引タイプとの相性）で比較する。Namefiはここで紹介する選択肢のひとつであり、唯一の答えではない。あくまでも取引内容に合った取引場所を見つけるための指針だ。

ドメインをトークンとして売ることが初めてという方は、まず[ドメインをNFTとして売る](/ja/blog/selling-domains-as-nfts/)とクラスター記事の[オンチェーン・ドメインフリッピング](/ja/blog/onchain-domain-flipping/)を読んでおくとよい。本記事では、すでにトークン化ドメインを保有しており、どこで売るかを検討している段階を前提としている。

## オンチェーンでは取引場所の選択がオフチェーン以上に重要な理由

従来の[アフターマーケット](/ja/glossary/domain-trading/)では、マーケットプレイスの役割は主にリスト掲載ボードと[エスクロー](/ja/blog/domain-escrow-explained/)デスクに限られる。名義移転はレジストラの担当者が操作して初めて完了し、その間は中立的な第三者が資金を預かる。オンチェーンでは、マーケットプレイスはより決済レイヤーに近い存在となる。コントラクト自体が一回のトランザクションでトークンと支払いを交換できるため、エスクローが解決しようとしていた「どちらが先に動くか」という問題が、一つの[アトミック転送](/ja/glossary/atomic-transfer/)に集約される。このメカニズムの詳細は[トークン化マーケットプレイスがエスクローを代替する仕組み](/ja/blog/how-tokenized-marketplaces-replace-escrow/)で解説している。

この変化により、比較すべき要素も変わる。オフチェーンでは手数料率とエスクローの信頼性を比べればよかった。オンチェーンでは、スマートコントラクトのモデル、取引所が自分のドメインの[カストディ](/ja/glossary/custodial-ownership/)を一時的に持つかどうか、そして適切な買い手が実際にそのプラットフォームを閲覧しているかどうかも重要になる。特に重要な要素は三つ：**手数料**（取引所とクリエイターが受け取る取り分）、**リーチ**（自分の買い手がそこにいるか）、**カストディ**（売却が成立するその瞬間まで自分の[ウォレット](/ja/glossary/wallet/)でドメインを管理できるか）だ。

## OpenSeaと汎用NFTマーケットプレイス

![ストライプの日よけ付き軒下に横一列に並ぶ四つの平面的な店舗のイラスト——大型の総合バザール、スリムなミニマルスタンド、小さな六角形看板のキオスク、そしてグローブ看板を掲げたドメイン特化ショップ](../../assets/onchain-domain-marketplaces-compared-01-venue-storefronts.jpg)

OpenSeaはデフォルトの選択肢として挙がることが多い。最大の汎用NFTマーケットプレイスであり、[ERC-721](/ja/glossary/erc-721/)トークンとして発行されたトークン化ドメインの多く——[非代替トークン（NFT）、デジタル証書とも呼ばれる標準インターフェース](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)——は自動的にOpenSeaに表示される。EthereumまたはBase上のドメインであれば、ドメイン固有のインテグレーションなしでほぼOpenSeaにリスト掲載できる。

手数料については、OpenSeaは現在[NFT売却に1%の手数料](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=1%25%20fee%20for%20selling%20NFTs)を設定しており、クリエイター収益は別途扱われる——OpenSeaでは[クリエイター収益は強制または任意設定](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=creator%20earnings%20are%20enforced%20or%20optional)がコレクションごとに異なる。自分でミントしたドメインであれば、クリエイターロイヤリティは通常発生しないため、合計コストは小さく抑えられる。

OpenSeaの強みはリーチと知名度だ。すでにNFTを取引している買い手はウォレットを接続済みで、リスト掲載のフローも知っており、ブランドを信頼している。弱点は、汎用マーケットプレイスがドメインを普通のJPEGと同様に扱ってしまうことだ。ドメイン固有のシグナル——名前が[DNS](/ja/blog/dns-on-tokenized-domains/)で解決されること、トラフィックを持つこと、Web3専用文字列ではなく本物の`.com`であること——は表示されない。OpenSeaを閲覧するドメイン投資家には、「X条件を満たす本物のICANN名称」でフィルタリングするネイティブな手段がない。OpenSeaは最も幅広いネットを張れるが、コンテキストは最も浅い。

**最適な用途：** 文字列だけで価値が明らかなブランド認知度の高いドメインで、買い手がクリプトネイティブである場合。

## Seaportベースとゼロ手数料マーケットプレイス

![天秤の両皿に、一方には少ない手数料のコインスタック、もう一方には広がる扇形の視聴者リーチを乗せたイラスト](../../assets/onchain-domain-marketplaces-compared-02-fees-vs-reach.jpg)

[Seaport](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)はOpenSeaの基盤となるオープンソースプロトコルで、自身のリポジトリでは[NFTを安全かつ効率的に売買するためのマーケットプレイスプロトコル](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)と説明されている。公開された[スマートコントラクト](/ja/glossary/smart-contract/)であるため、誰でもその上にマーケットプレイスを構築できる。これが「Seaportベース」がひとつのカテゴリーであり、単一サイトを指さない理由だ。共通の特徴は、リスト掲載がコントラクトによって直接決済される署名済みオファーであること：ドメインはウォレット内に保持したまま、買い手の支払いと自分のトークンがアトミックに交換され、オペレーターが資産を保有することはない。

もうひとつの注目カテゴリーはゼロ手数料のプロトレーダー向け取引所だ。例えばBlurは、既存の取引所からハイフリクエンシートレーダーを引き寄せるために[0%](https://blur.io/#:~:text=0%25)の[マーケットプレイス手数料](https://blur.io/#:~:text=Marketplace%20fees)を打ち出している。一ベーシスポイントまで最適化したいフリッパーにとってゼロ手数料は魅力的だが、問題はリーチだ。これらのプラットフォームはフロア価格が均質なアートやPFPコレクションに最適化されており、各文字列が独立した市場となるワンオフのドメイン名には向いていない。手数料ゼロでも、適切な買い手がそこを閲覧していなければ長期間待つことになる。

このカテゴリー全体の真の強みはカストディモデルにある：よく設計されたSeaportフローは真の[アトミック転送](/ja/glossary/atomic-transfer/)であり、エスクローが中和しようとしていたカウンターパーティリスクをほぼ排除できる。これは[エスクロー解説記事](/ja/blog/how-tokenized-marketplaces-replace-escrow/)で説明したオフチェーンプロセスから大きな進歩だ。

**最適な用途：** すでに買い手が決まっており手数料を節約したいセラー、またはセルフカストディとアトミック決済を求めるが取引所に需要創出を期待しないセラー。

## Web3ネイティブ・ネームマーケットプレイスについての補足

トークン化されたICANNドメインとWeb3ネイティブネームは取引される場所が異なり、混同しやすいため、両者を分けて考える価値がある。`vitalik.eth`のような[ENS](/ja/glossary/ens/)名はDNSドメインではない——ENSは[Ethereumブロックチェーン上に構築された分散型・オープン・拡張可能なネーミングシステム](https://docs.ens.domains/learn/protocol#:~:text=a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)であり、`.eth`名はICANNのルート外に存在する。手数料モデルも異なる：ENSは`.eth`の登録料を文字数に応じて設定しており、5文字以上の名前は[年間約5米ドル](https://docs.ens.domains/registry/eth#:~:text=5%20USD)、3文字の名前は年間約[$640](https://docs.ens.domains/registry/eth#:~:text=640)となる。

ENSや類似のネームはNFTとして取引可能で、OpenSea上でトークン化された`.com`と並んで表示されることもあるが、`crypto.eth`を買いたい人と`crypto.com`を買いたい人は全く異なるものを求めている——前者はウォレットネイティブのアイデンティティ、後者は世界中で解決できるウェブサイトアドレスだ。詳しい比較は[ENS vs DNSドメインフリッピング](/ja/blog/ens-vs-dns-domain-flipping/)と[ENS vs Unstoppable vs トークン化DNS](/ja/blog/ens-vs-unstoppable-vs-tokenized-dns/)のプラットフォーム比較記事で解説している。要点：トークン化されたICANNドメインをENS名のように価格設定・リスト掲載しないこと、ENSの買い手が自分の買い手だと思い込まないこと。

## ドメイン特化型マーケットプレイス（Namefiを含む）

三つ目のカテゴリーは、トークン化された本物のドメインに特化して構築されたものだ。ドメインを汎用トークンとして扱うのではなく、ドメイン特化型プラットフォームは下層にDNSレイヤーが存在することを理解している：名前が解決されていることを示せること、取引中もDNSの継続性を保ってライブサイトが途切れないようにできること、そしてコレクティブルではなく本物のドメインを探している買い手にリスト掲載を提示できることだ。

[Namefi](https://namefi.io)はこのカテゴリーに属する。EthereumとBase上で本物のICANN名称をNFTとしてトークン化しながらDNSレイヤーを維持する。これにより、Namefiを通じて売却されたドメインは、Seaportの売買と同じアトミック・エスクローフリーの仕組みで[オンチェーン](/ja/glossary/on-chain/)決済できる——しかも汎用マーケットプレイスでは提供できないドメイン固有のコンテキストを持った形で。Namefiのトークン化ドメインは標準的なNFTであるため、OpenSeaやその他の取引所にもリスト掲載し続けられる。ロックインされるわけではなく、他の選択肢を閉じるのではなく、ドメインに詳しい選択肢を追加するだけだ。まずどこでトークン化するかを選ぶ段階であれば、[ドメイントークン化プラットフォームの選び方](/ja/blog/choosing-a-domain-tokenization-platform/)でプロバイダーを比較している。

トレードオフとして、ドメイン特化型マーケットプレイスはOpenSeaより新しく、流動性も薄い。ユーザー数の絶対値ではリーチが狭いが、そのユーザー全員がより適格なドメイン買い手でもある。高額な名前で、買い手が「本物の解決可能なドメインを取得できる」という信頼を必要とする場合——単なるトークンではなく——、適格なコンテキストは純粋なトラフィックよりも重要になりうる。

**最適な用途：** DNSの継続性・買い手の信頼・ドメイン固有の表示が重要な本物のICANN名称——特に高額または実際に使用中の名前。

## 取引内容に合った取引場所の選び方

![複数の店舗の中から最適なものへと、一枚のドメイントークンコインが枝分かれした点線の経路を通って案内される決定フローのイラスト](../../assets/onchain-domain-marketplaces-compared-03-match-venue.jpg)

単一の最良マーケットプレイスというものは存在しない。あるのは特定の名前に対する最良の選択肢だ。おおまかな判断指針を以下に示す：

| ドメインの特性 | 推奨取引所 |
|---|---|
| 流動性が高く暗号資産界隈で認知度のある文字列、買い手がNFTネイティブ | OpenSea——最広リーチ、1%の低手数料 |
| すでに売却先が決まっており、ゼロ手数料＋セルフカストディを望む | Seaportベースまたはゼロ手数料取引所——アトミック決済 |
| DNSで解決する本物のICANNドメインでDNS継続性と信頼が重要 | Namefiのようなドメイン特化型マーケットプレイス |
| ENS / Web3ネイティブネーム（DNSドメインではない） | ENS対応の取引所——ウェブサイトではなくアイデンティティとして価格設定 |

より深い観点として、オンチェーンでは同じトークンを複数の取引所に同時にリスト掲載できる。これらの取引所の多くは同じウォレットと同じERC-721コントラクトを参照しているためだ。現実的なフリッパーは、リーチのために汎用マーケットプレイスに幅広くリスト掲載しながら、高額な名前はコンテキストと信頼のためにドメイン特化型取引所で売ることが多い。カストディモデル——決済が完了するその瞬間まで自分の[マルチシグ](/ja/glossary/multi-sig/)またはシングルキーウォレットで名前を保持すること——は、すべての取引所で一貫して適用できる。これこそ、セルフカストディ型の[マーケットプレイス](/ja/glossary/marketplace/)売買が従来のエスクロー方式を上回る根本的な理由だ。資産の保護については、[マルチシグウォレットは実際にセキュリティを向上させるか](/ja/blog/do-multisig-wallets-actually-improve-security/)と、[ウォレット紛失後のトークン化ドメイン復旧](/ja/blog/recovering-a-tokenized-domain-after-wallet-loss/)の復旧プレイブックも参照してほしい。

取引するドメインに合った取引所を選ぶべきであり、その逆ではない。トークン自体はどこでも同じだ——買い手は違う。

## 免責事項（必ずお読みください）

> 当方は弁護士・会計士・ファイナンシャルアドバイザー・医師のいずれでもなく、**本記事のいかなる内容も法律・金融・税務・会計・医療その他の専門的なアドバイスを構成するものではありません。** これらの投稿は自己学習と顧客への利便提供を目的として執筆しています。情報が古くなっている、特定の地域にのみ適用される、あるいは単純に誤りを含む可能性があります。私たちもミスをします。

> 重要な判断については、**必ず実際の専門家に相談してください（これは本気の言葉です！）**。あるいはそれが難しければ、友人・Twitter・Reddit・AI・占い師に聞いてみてください。要するに：**DYOR - 自分でリサーチしよう**。共に学び、楽しんでいきましょう。

## 出典と参考資料

- Ethereum Improvement Proposals — [ERC-721 Non-Fungible Token Standard（「非代替トークン、デジタル証書とも呼ばれる標準インターフェース」）](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- ProjectOpenSea/seaport (GitHub) — [Seaport is a marketplace protocol for safely and efficiently buying and selling NFTs](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- OpenSea Help Center — [What fees do I pay on OpenSea?（売却手数料1%；クリエイター収益は強制または任意）](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=1%25%20fee%20for%20selling%20NFTs)
- Blur — [NFT Marketplace for Pro Traders（マーケットプレイス手数料0%）](https://blur.io/#:~:text=0%25)
- ENS Documentation — [What is ENS?（「Ethereumブロックチェーン上に構築された分散型・オープン・拡張可能なネーミングシステム」）](https://docs.ens.domains/learn/protocol#:~:text=a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)
- ENS Documentation — [.eth Registrar 価格設定（文字数に基づく年間料金：5文字以上は約5ドル/年、3文字は約640ドル/年）](https://docs.ens.domains/registry/eth#:~:text=5%20USD)
