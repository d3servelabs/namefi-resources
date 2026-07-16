---
title: "オンチェーンドメインのカストディ、ウォレット、リカバリー"
date: '2026-06-24'
language: ja
tags: ['domains', 'domain-flipping', 'web3', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-security
series: domain-flipping-skills
seriesOrder: 38
format: explainer
description: "トークン化ドメインのカストディの実態：ウォレット、マルチシグ、シードフレーズのリスク、そしてウォレットを失った後のドメイン復旧方法。"
ogImage: ../../assets/onchain-domain-custody-and-recovery-og.jpg
keywords: ['オンチェーンドメイン カストディ', 'トークン化ドメイン ウォレット', 'トークン化ドメイン 復旧', 'ウォレット紛失 ドメイン回復', 'シードフレーズ リスク', 'マルチシグ ドメイン カストディ', 'NFT ドメイン セキュリティ', 'ハードウェアウォレット ドメイン', 'セルフカストディ ドメイン', 'ドメイン 秘密鍵', 'トークン化ドメイン 所有権', 'ERC-721 ドメイン', 'オンチェーン ドメインフリッピング', 'ドメインウォレット バックアップ', 'ソーシャルリカバリーウォレット']
relatedArticles:
  - /ja/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ja/blog/how-tokenization-changes-domain-flipping/
  - /ja/blog/onchain-domain-flipping/
  - /ja/blog/selling-domains-as-nfts/
  - /ja/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/domain-apocalypse/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/dns/
  - /ja/glossary/tld/
  - /ja/glossary/web3/
---

従来のドメインをフリップする場合、カストディは他者が管理する問題だ。ドメインは[レジストラ](/ja/glossary/registrar/)のアカウントに存在し、パスワードを忘れてもリセットリンクとサポート窓口が待っている。しかしドメインを[オンチェーン](/ja/glossary/on-chain/)に移すと、そのセーフティネットは消える。トークンそのものが権利証書であり、[ウォレット](/ja/glossary/wallet/)の鍵だけが自分とその資産の間に立つ唯一の壁となる。この変化こそが、従来の[アフターマーケット](/ja/glossary/domain-trading/)からオンチェーンフリッピングに移行する人にとって最大の意識転換だ。

本記事は[ドメインフリッピング](/ja/blog/domain-flipping/)シリーズのカストディ編である。トークン化されたドメインのカストディが実際に何を意味するか、アクセスを失う現実的な経路、それを防ぐウォレット設定、そして──正直に言えば──防止策が失敗したときのリカバリーの実態を解説する。オンチェーンのドメイン取引を行うなら、これは背景知識ではなく運用上の衛生管理として読んでほしい。

## ドメインがトークンになったとき「カストディ」が意味するもの

[トークン化ドメイン](/ja/blog/what-are-tokenized-domains/)とは、現実の[ICANN](/ja/glossary/icann/)公認ドメイン名であり、その所有権が[ブロックチェーン](/ja/glossary/blockchain/)上のトークン、通常は[ERC-721](/ja/glossary/erc-721/)規格に準拠した[NFT](/ja/glossary/nft/)として表現されたものだ。ERC-721の仕様自体は、これを[非代替性トークン——権利証書とも呼ばれる——のための標準インターフェース](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)と定義している。「権利証書」という表現はマーケティング用語ではない。ウォレット内にトークンを保有している者が、そのドメインを保有していることになる。

この点は正確に理解しておく必要がある。なぜなら「Web3ドメイン」と呼ばれる3種類のものは、カストディと名前解決の面で大きく異なり、混同すると誤った判断につながるからだ。

- **トークン化ICANNドメイン**（Namefiモデル）— あらゆるブラウザで解決できる本物の`.com`、`.xyz`、`.io`であり、レジストリレベルの所有権をオンチェーントークンが反映する。カストディはウォレット、名前解決は通常の[DNS](/ja/blog/dns-on-tokenized-domains/)が担う。
- **[ENS](/ja/glossary/ens/)名**（`vitalik.eth`）— Ethereumネイティブの名前で、完全にオンチェーンに存在し、リゾルバーやブリッジなしでは標準ブラウザで解決できない。
- **Unstoppableスタイルの名前**（`.crypto`、`.x`）— ICANNルート外のブロックチェーンネイティブ名前空間で、ウォレットや拡張機能レベルでの解決が必要。

3種類すべてにおいて、*カストディ*の構造は共通している：[秘密鍵](/ja/glossary/private-key/)が資産を制御する。ただし、トークン化ICANNドメインの場合のみ、オフチェーンのレジストリレコードも存在し、この第二の層があることで一部のリカバリー経路が成立する。詳細は[トークン化ドメインとWeb3ドメインの違い](/ja/blog/tokenized-domain-vs-web3-domain/)で解説しているが、フリッピングの観点から言えば、誰にでも売れるドメインとクリプトネイティブな買い手にしか売れないドメインの差がここに生まれる。

## カストディのスペクトラム：カストディアル型から完全セルフカストディまで

![水平なカストディスペクトラムの図解：左に銀行がドメイントークンコインを抱えている様子、中央に手渡しのシーン、右に鍵とトークンコインを手の平に乗せたオープンハンド、スライダーのドットがバー上に示されている](../../assets/onchain-domain-custody-and-recovery-01-custody-spectrum.jpg)

カストディはスイッチではなくスペクトラムだ。一方の端は[**カストディアル型所有**](/ja/glossary/custodial-ownership/) — プラットフォームや取引所が鍵を保有し、ユーザーはアカウントログインを持つ。便利でサポートチームによる回復も可能だが、まさにクリプトが排除しようとした信頼モデルそのものだ。もう一方の端は完全なセルフカストディ：鍵は自分だけのもので、誰も資産を凍結・差し押さえできないが、救済してくれる者もいない。

経験豊富なオンチェーンフリッパーの多くは中間に位置し、重要なのは*カストディモデルをドメインの価値と取引頻度に合わせる*ことだ。積極的に[マーケットプレイス](/ja/glossary/marketplace/)に出品している使い捨てのドメインは、毎日署名する hot wallet に置いておいてよい。5桁の価値を持ち長期保有するドメインは、コールドストレージか[マルチシグ](/ja/glossary/multi-sig/)以外に置く理由がない。よくある失敗は両者を同じように扱うことで、大抵の場合、ランダムなNFTのミントにも使っている一つのMetaMaskにすべてを置いてしまう。

## 鍵が実際にどこに存在するか

[暗号通貨ウォレット](https://en.wikipedia.org/wiki/Cryptocurrency_wallet)はドメインを「保管」しているわけではない。保管しているのは鍵だ。Wikipediaによれば、[秘密鍵はオーナーが暗号通貨にアクセスして送金するために使用するもので、オーナーのみが知る](https://en.wikipedia.org/wiki/Cryptocurrency_wallet#:~:text=The%20private%20key%20is%20used%20by%20the%20owner%20to%20access%20and%20send%20cryptocurrency%20and%20is%20private%20to%20the%20owner) — そして同じ鍵がドメインNFTの移転も承認する。ドメイントレーダーのための実用的な分類：

- **ホットウォレット**（MetaMask、Rabby）— インターネットに接続されたソフトウェアウォレット。署名や出品に向いているが、マルウェア、フィッシング、悪意ある署名リクエストにさらされる。これはトレーディング用ウォレットであり、金庫ではない。
- **[ハードウェアウォレット](/ja/glossary/hardware-wallet/)**（Ledger、Trezor、Keystone、GridPlus）— 鍵は専用デバイス上に存在し、オフラインで署名する。今週フリップするのではなく保有するドメインの置き場所として最適。[ミント](/ja/glossary/minting/)後はここにNFTを移すべきだ。
- **[スマートコントラクト](/ja/glossary/smart-contract/)ウォレット**（マルチシグ、ソーシャルリカバリー）— 鍵は単一の秘密ではなくオンチェーンロジックで管理される。詳細は後述。

これらのほぼすべての根底にあるのが**[シードフレーズ](/ja/glossary/seed-phrase/)**だ。[BIP-39仕様](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#:~:text=This%20BIP%20describes%20the%20implementation%20of%20a%20mnemonic%20code%20or%20mnemonic%20sentence%20%2D%2D%20a%20group%20of%20easy%20to%20remember%20words%20%2D%2D%20for%20the%20generation%20of%20deterministic%20wallets)で定義された12語または24語のニーモニックで、決定論的ウォレットを生成するための記憶しやすい単語群だ。このフレーズからウォレットが保有するすべての鍵が再生成できる。Wikipediaの説明にある通り、[ウォレットを紛失・破損・侵害された場合、シードフレーズを使ってウォレットと関連する鍵・暗号通貨に再アクセスできる](https://en.wikipedia.org/wiki/Cryptocurrency_wallet#:~:text=the%20seed%20phrase%20can%20be%20used%20to%20re%2Daccess%20the%20wallet%20and%20associated%20keys)。だからこそ、これはあなたが書き留める最も危険な単語の文字列でもある。

## シードフレーズのリスクがすべての鍵を握る

![リカバリーフレーズカードの図解：空白の単語スロットが割れたガラスドームの下にあり、フィッシングフック、炎、仮面の泥棒が一枚の脆弱なカードに向かって集まっている](../../assets/onchain-domain-custody-and-recovery-02-seed-phrase-risk.jpg)

オンチェーンでの壊滅的な損失のほぼすべては、反対方向に引っ張る二種類のシードフレーズの失敗に行き着く：

1. **シードが一カ所にしか保存されておらず、その場所が失われた。** スマートフォンのリセット、火災、ノートの紛失。リセットリンクは存在しない。単語の唯一のコピーが消えれば、ドメインも消える。
2. **シードが他者に読まれる場所に保存されていた。** クラウドのメモ、クラウド同期するパスワードマネージャー、カメラロールの写真、チャット内のスクリーンショット、LLMへの貼り付け。その単語を読んだ者は即座かつ不可逆的にウォレットが制御するすべてを所有する。

防衛の姿勢は退屈で交渉の余地がない。単語を紙に書き、2枚、2カ所の物理的な場所に保管する。価値あるものには火や水に耐えるスチール製バックアッププレートを使う。本物のシードフレーズをインターネット接続された面に触れさせない。これはベテランのフリッパーが更新料に対して取るのと同じ規律だ：必要になる前に払う安い保険、被害に遭えば全損となるリスクへの対策。

## マルチシグとソーシャルリカバリー：単一障害点を排除する

![ドメイントークンコインを守る中央のロックの図解：3つの鍵のうち2つを同時に回す必要があり、3人の鍵保有者が周囲に配置され、点線のガーディアンリカバリーサークルが彼らをつないでいる](../../assets/onchain-domain-custody-and-recovery-03-multisig-recovery.jpg)

単一のシードフレーズは単一障害点だ。構造的な解決策は、資産を移動するために*複数の*鍵を要求することだ。

[**マルチシグウォレット**](/ja/glossary/multi-sig/) — EVMチェーンでは最もよく使われる[Safe](https://safe.global/)（旧Gnosis Safe）— は転送実行前にN個中M個の鍵による署名が必要だ。ハードウェアウォレット、共同署名者、封印されたオフラインバックアップに分散した2-of-3の設定では、どれか一つの鍵を失ってもドメインは失われず、単一のフィッシング署名で資金が流出することもない。暗号学においても同様の考え方が存在する：FROSTのような閾値署名スキームは[RFC 9591](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature)で標準化されており、どの一者も完全な鍵を持つことなく[閾値数のエンティティが協力して署名を計算](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature)できる。

ただしマルチシグは魔法の言葉ではなく、そう扱うことが大きな損失を招く。単一鍵の侵害とインサイダーリスクには有効だが、侵害された署名UIや、同じ悪い日に複数の署名者を騙す協調フィッシング攻撃には*何の効果もない*。「独立した」3つの鍵がすべて同じアパートにある自分だけが管理するデバイス上にあるなら、マルチシグのオーバーヘッドを抱えながら単一鍵と同じ脅威モデルに直面していることになる。どこで保護が機能し、どこが見せかけに過ぎないかは[マルチシグウォレットは実際にセキュリティを向上させるか？](/ja/blog/do-multisig-wallets-actually-improve-security/)で詳しく解説しており、価値あるドメインを預ける前の必読記事だ。

共同署名者を調整したくないソロフリッパーには、**ソーシャルリカバリーウォレット**（Argent、リカバリーモジュール付きSafe、ERC-4337スマートアカウント）がある。鍵を失った場合にガーディアンが集合的にアクセスを復元できる仕組みで、マルチシグより使いやすいが、より多くのスマートコントラクトコードと、実際に存在して応答するガーディアンセットへの信頼が必要になる。

取引ポートフォリオへの実用的なルール：積極的に出品しているドメイン用に小さなホットウォレットを持ち、保有する在庫にはマルチシグまたはハードウェアに裏打ちされたコールドウォレットを使う。素早い売買すべてに3人の署名者を必要とすることなく、最良のドメインを怪しいミントに接続するウォレットに置かないようにしよう。

## リカバリー：アクセスを失ったときに実際に起こること

予防こそが真のリカバリー戦略だが、損失は起こる。何が可能かはアクセスを失った*方法*に完全に依存する。要約すると：

- **パスワードを失ったがシードがある** — 実質的な損失ではない。再インストールしてシードから復元すれば完了。
- **デバイスを失ったがシードがある** — 新しいデバイスでシードから復元すれば完了。
- **デバイスはあるがシードを失った** — デバイスがまだ動いているうちに、*今すぐ*NFTを新たに正しくバックアップされたウォレットに移動する。
- **デバイスもシードも両方失った** — 困難なケース。暗号学的にトークンはアクセス不能であり、誰も秘密鍵をブルートフォースできない。できると主張する者は詐欺師だ。

最後のケースでは、トークン化ICANNドメインが純粋なオンチェーン名と異なる点が現れる。基礎となる資産が実際に登録されたドメインであるため、手がかりとなるオフチェーンの糸が存在する：[登録者](/ja/glossary/registrant/)レコードに紐づいたプラットフォーム側のアイデンティティ、そして[WHOIS](/ja/glossary/whois/)履歴、請求記録、政府発行IDに裏付けられたレジストラレベルの所有権申し立てだ。これらの手順は遅く、書類手続きが多く、本人確認が必要で、保証もない——しかし存在する。失われた`.eth`の鍵では言えないことだ。**盗難**は紛失とは別の問題だ：オンチェーンの動きを証拠としてトレースし、盗まれたトークンにフラグを立てるようプラットフォームとマーケットプレイスに通知し、法執行機関を巻き込む。トークン化ドメインの盗難は登録済み資産の盗難でもあるからだ。

すべての損失シナリオ、行動の順序、プラットフォームが実際に何をできて何をできないかについての完全なプレイブックは[ウォレット紛失後のトークン化ドメインの復旧](/ja/blog/recovering-a-tokenized-domain-after-wallet-loss/)にある。一行要約：迅速に行動し、証拠を保全し、本物のICANN名への扉が永久に閉じたと思い込まないこと。

## カストディの間も更新の時計は止まらない

オンチェーンドメインに不慣れなフリッパーが陥る落とし穴の一つ：鍵を完璧に保護しても*登録*には何の効果もない。トークン化ドメインは更新スケジュールのある本物のドメインであり、トークンはその状態を反映するもので、それを無効にするわけではない。登録が失効すれば、完璧にセルフカストディされたドメインでさえ期限切れになりうる。

オンチェーンネイティブの名前空間も同様だ。たとえばENSの`.eth`名は年間レンタルだ：ENSによれば、[5文字以上の`.eth`は年間5ドルのコストがかかり](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)、失効後には[90日間のグレース期間があり、通常価格で延長できる。他者は登録できない](https://support.ens.domains/en/articles/8046905-what-is-a-grace-period#:~:text=After%20a%20.eth%20name%20expires%20you%20have%20a%2090%2Dday%20Grace%20Period)。トークン化ICANNドメインはTLDの標準レジストリ更新猶予期間が適用される。いずれにせよ、カストディと更新は別々の規律だ——鍵を持つことはドメインを維持することとイコールではない。[DNS](/ja/blog/dns-on-tokenized-domains/)と更新を健全に保つことは、あらゆる[ドメインフリッピング](/ja/blog/domain-flipping/)事業の生死を分けるポートフォリオ管理の一部だ。

## Namefiの観点から

カストディこそが、フリッパーにとってトークン化が真価を発揮する場所だ。[Namefi](https://namefi.io)でトークン化されたドメインは、所有権がウォレット内に存在する本物のICANNドメインであるため、財務資産を保護するのと同じようにマルチシグやハードウェアウォレットで保管できる。資金を守るのと同じ閾値スキームがDNS制御プレーンを守るため、一人の個人がフィッシングされても企業のプライマリ`.com`が失われることはない。そして基盤にレジストリレコードが存在するため、リカバリーの選択肢は純粋なオンチェーン名より優れている：セルフカストディが失敗しても、辿れるオフチェーンのアイデンティティスレッドがある。取引のために[ドメインをトークン化する](/ja/blog/why-tokenize-domains/)理由は決済の高速化だけではない——ドメインの価値に合ったカストディモデルをついに選択できることでもある。賢明に選び、そのドメインが重要になる*前に*設定を整えよう。

## 免責事項（必ずお読みください）

> 私たちは弁護士でも会計士でも、ファイナンシャルアドバイザーでも医師でもありません。**この記事のいかなる内容も、法律、金融、税務、会計、医療、その他いかなる種類の専門的アドバイスでもありません。** これらの記事は私たち自身の学習のため、また顧客への参考として執筆しています。ここの情報は古くなっている、地域固有である、または単純に誤りである可能性があります。私たちも間違いを犯します。
>
> 重要な意思決定には、**必ず本物の専門家に相談してください（本当に！）**。そうしたくない方は、友人に聞く、Twitterで聞く、Redditで聞く、AIに聞く、占い師に聞く、でも構いません。要するに：**DOYR（Do Your Own Research＝自分で調べよう）**。一緒に学んで楽しみましょう。

## 出典と参考文献

- Ethereum — [ERC-721 非代替性トークン標準（「非代替性トークン——権利証書とも呼ばれる——のための標準インターフェース」）](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- Wikipedia — [暗号通貨ウォレット（秘密鍵制御；シードフレーズリカバリー）](https://en.wikipedia.org/wiki/Cryptocurrency_wallet#:~:text=The%20private%20key%20is%20used%20by%20the%20owner%20to%20access%20and%20send%20cryptocurrency%20and%20is%20private%20to%20the%20owner)
- Bitcoin BIPs — [BIP-39 決定論的ウォレットのためのニーモニックコード](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#:~:text=This%20BIP%20describes%20the%20implementation%20of%20a%20mnemonic%20code%20or%20mnemonic%20sentence%20%2D%2D%20a%20group%20of%20easy%20to%20remember%20words%20%2D%2D%20for%20the%20generation%20of%20deterministic%20wallets)
- IETF — [RFC 9591：FROST閾値署名](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature)
- Safe — [スマートアカウント／マルチシグインフラストラクチャ](https://safe.global/)
- ENS Docs — [.eth登録料金（5文字以上は年間5ドル）](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ENS Support — [グレース期間とは？（失効後90日間の猶予ウィンドウ）](https://support.ens.domains/en/articles/8046905-what-is-a-grace-period#:~:text=After%20a%20.eth%20name%20expires%20you%20have%20a%2090%2Dday%20Grace%20Period)
