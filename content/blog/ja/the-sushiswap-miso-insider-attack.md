---
title: 'SushiSwap MISOインサイダー攻撃：悪意あるコミット1件がトークンオークションから約300万ドルを横流しした経緯'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 22
format: case-study
description: '2021年9月、匿名の請負業者がSushiSwapのMISOラunchpadフロントエンドに悪意あるコミットを紛れ込ませ、Jay Pegs Auto Martオークションから864.8 ETH（約300万ドル）を横流しした。コードのサプライチェーン、フロントエンドの信頼性、そして検証可能なオーナーシップが教えてくれることを、Domain Maydayが深く掘り下げる。'
keywords: ['sushiswap miso ハック', 'miso サプライチェーン攻撃', 'aristok3', 'jay pegs auto mart', 'defi フロントエンド攻撃', '864.8 eth', 'ソフトウェアサプライチェーン', '悪意あるコミット', 'インサイダー脅威', 'auctionwallet', 'joseph delong', 'webサプライチェーンセキュリティ', 'ドメインセキュリティ']
relatedArticles:
  - /ja/blog/the-badgerdao-frontend-attack/
  - /ja/blog/the-curve-finance-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/dns/
  - /ja/glossary/icann/
  - /ja/glossary/web3/
  - /ja/glossary/tld/
---

ほとんどの攻撃はドアを蹴破る。これは正面から堂々と入ってきた。

2021年9月、SushiSwapのMISOラunchpadを運営していたチームは、フィッシングに引っかかったわけでも、[秘密鍵](/ja/glossary/private-key/)を失ったわけでも、バグのある[スマートコントラクト](/ja/glossary/smart-contract/)をリリースしたわけでもない。彼らがやったのは、もっとありふれたことだった――コントリビューターを信用したのだ。コードへのコミットアクセスを持つ匿名の請負業者が、[オークション](/ja/glossary/auction/)フロントエンドに自分自身の[ウォレット](/ja/glossary/wallet/)アドレスを仕込んでプッシュし、デプロイパイプラインに後の作業を任せた。NFTオークションが1件決済された時点で、**864.8 ETH――約300万ドル**――は、セールを主催したプロジェクトではなく、資金の行き先を密かに書き換えたデベロッパーの元へと流れた。

エクスプロイトなし。ゼロデイなし。誰も二重チェックしなかったコード1行。それを書いたのは、チームの一員とされていた人物だった。

これはDomain Mayday EP15だ。物語の端にスマートコントラクトは登場するが、核心は別のところにある――ほとんどの人が監査しない部分、すなわちコードのサプライチェーン、フロントエンド、そして「誰がこれを変更できるのか」という問いが「誰が鍵を持っているのか」と同じくらい重大なセキュリティ問題であるという、不都合な現実だ。

## ラunchpadコードに置かれた信頼

MISO（Minimal Initial SushiSwap Offering）のような[DeFi](/ja/glossary/defi/)ラunchpadには、一つの仕事がある――見知らぬ多数の人々から資金を集め、トークンまたはNFTセールを実施するプロジェクトに届けることだ。そのために、監査済みのスマートコントラクトを[オンチェーン](/ja/glossary/on-chain/)に、ウェブフロントエンドをオフチェーンに組み合わせる。ユーザーはフロントエンドを操作し、フロントエンドがウォレットに対してどのトランザクションに署名すべきかを伝える。

この継ぎ目こそが弱点だ。スマートコントラクト層には監査もバグバウンティもヘッドラインも集まるため、人々はそこに執着する。しかしフロントエンド――オークションの支払先*アドレス*を決定するJavaScript――は、リポジトリにあるただのコードであり、パイプラインによってデプロイされ、書き込みアクセスを持つ者なら誰でも編集できる。金庫をいくら監査しても、インサイダーが「ここに預けてください」と書いた看板を差し替えられるなら、金庫は関係ない。

MISOのコードはオープンで協調的だった――クリプトインフラによくある形で。その開放性は利点でもある。コントリビューターを呼び込み、リリースを加速させ、小規模なコアチームがはるかに大きな成果を出せるようにする。しかし同時に、それはサプライチェーン攻撃者がまさに必要とするサーフェスでもある。コントリビューターとして招待してもらえれば、侵入する必要はない。

## 2021年9月：悪意あるコミット

![匿名の手袋をはめた手が、クリーンなオープンソースのレンガ壁に、赤く光る改ざんされたレンガをこっそりと差し込んでいる鮮やかなカラーコンセプトアート](../../assets/the-sushiswap-miso-insider-attack-01-attack.jpg)

2021年9月17日金曜日、SushiSwap当時の最高技術責任者Joseph Delongは、何が起きたのかをTwitterで説明した。CoinDesk の報道は率直だ。Delongは[GitHubハンドル名「AristoK3」を使う匿名の請負業者がサプライチェーン攻撃でMISOのフロントエンドに悪意あるコードを注入した](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=an%20anonymous%20contractor%20using%20the%20Github%20handle)と述べた。

手口は呆れるほど単純だった。Delongの説明によると、攻撃者は[オークションのウォレットアドレスを自分のものと差し替えた](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=replaced%20the%20auction%27s%20wallet%20address%20with%20their%20own)。PYMNTSはこの行為をサプライチェーンの文脈で正確に表現している。その請負業者は[プラットフォームのフロントエンドに配布された悪意あるコードコミットをプッシュした](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=pushed%20a%20malicious%20code%20commit%20that%20was%20distributed%20on%20the%20platform%27s%20front%20end)。

このインシデントのポストモーテムは本質を一文で捉えている。オークション業務を請け負ったデベロッパーが、[`auctionWallet`ではなく自分自身のウォレットアドレスをコントラクトに挿入した](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=inserted%20his%20own%20wallet%20address%20into%20the%20contract%20instead%20of%20the)――デプロイ時にフロントエンドが渡す値を編集することで、監査済みのオンチェーンロジック自体を破ることなく。変数一つ。`auctionWallet`はセールを実施するプロジェクトを指すはずだった。代わりに、それは請負業者を指していた。入札者がオークション受益者に送ったつもりの全資金は別の場所へ流れ、コードは何事もなかったかのように見えていた。

## 横流しされたもの：864.8 ETH、約300万ドル

標的は一つの、ほとんど滑稽とも言えるオークションだった。CryptoSlateが報じたように、MISOは[「Jay Pegs Auto Mart」トークンオークションコントラクトから864.8 ETHを流出させるサプライチェーン攻撃](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=drained%20864.8%20ETH%20from%20the)を受けた。Jay Pegs Auto MartはNFTアートプロジェクトで、中古車ディーラーを模したスタイルを取っていた――財務的には非常にリアルなトークンセールの上に乗った、遊び心あるクリプトカルチャーの演出だ。

数字は各メディアで一致している。PYMNTSは[ハッカーが864.8 ETH（約300万ドル）を自分のウォレットに送金した](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=transferred%20864.8%20Ethereum%20coins)と報じた。The Crypto Timesは攻撃者が[864.8 ETHを流出させた](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=drained%20864.8%20ETH)こと、そして[ハッキングと悪用の被害を受けた唯一のオークションプロジェクトはJay Pegs Auto Martだ](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=The%20only%20auction%20project%20that%20has%20been%20hacked%20and%20exploited)と確認した。

最後の点は重要だ。汚染されたコードはフロントエンドを通じて配布されていたため、理論上は*いかなる*オークションでも資金の行き先を変えることができた。しかし実際には、チームが気づく前に攻撃者のアドレスへ決済されたのはJay Pegs Auto Martだけだった。他の影響を受けたオークションは流出前にパッチが当たった――単一の悪いヘッドラインと大惨事の間にあったのは、数時間の差だった。

## 経緯：壊れた鍵ではなく、インサイダーへの信頼

![グローイングしたマネーパイプを影の中のインサイダーがこっそりとひねり、本来のタンクではなく私的なバケツへ流れを逸らしている鮮やかなカラーコンセプトアート](../../assets/the-sushiswap-miso-insider-attack-02-malicious-commit.jpg)

クリプトの語彙を取り除けば、これは典型的なソフトウェアサプライチェーン攻撃だ――毒入りnpmパッケージや改ざんされたビルドサーバーと同じカテゴリで、支払いがETH建てになっているだけだ。

信頼の連鎖はこのように機能していた。コントリビューターは、ライブオークションを動かすコードへの書き込みアクセスを与えられた。そのアクセスを使って、送金先アドレスを差し替える変更をコミットした。デプロイパイプラインはパイプラインらしく動いた――最新のコードを取得し、実際のユーザーがブラウザで読み込むフロントエンドに配布した。ユーザーはウォレットを接続し、フロントエンドが指示する通りに署名し、受益者が密かに書き換えられたオークションに資金を提供した。Coinspeakerの報道も同じ内容を裏付けている。[GitHubハンドル名AristoK3の匿名請負業者がMISOフロントエンドに悪意あるコードを注入した](https://www.coinspeaker.com/sushiswap-miso-attack-nft/#:~:text=an%20anonymous%20contractor%20with%20the%20GH%20handle%20AristoK3%20injected%20malicious%20code%20into%20the%20Miso%20front%20end)。

何が*必要でなかった*かに注目してほしい。攻撃者はスマートコントラクトの欠陥を探す必要がなかった。鍵を盗んだり、外部からサーバーに侵入したりする必要もなかった。必要だったのはただ一つ――コードを変更できる程度に信頼されることだ。インシデントレポートの表現は正確だ――[MISOフロントエンドはサプライチェーン攻撃の被害者となった](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=The%20Miso%20front%20end%20has%20become%20the%20victim%20of%20a%20supply%20chain%20attack)――GitHubハンドル名AristoK3を使う匿名の請負業者によって実行され、彼は[MISOフロントエンドに悪意あるコードを注入した](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=injected%20malicious%20code%20into%20the%20Miso%20front%20end)。

これが、インサイダーによるサプライチェーン攻撃がこれほど危険な理由だ。あらゆる外部防衛策――ファイアウォール、監査、トレジャリーのマルチシグ――は、脅威が外から侵入しようとしていると仮定している。コミット権限を持つインサイダーは、それらをすべて既に通り抜けている。悪意ある変更は、プロジェクト自身の信頼された正規のデプロイプロセスに乗って本番環境まで直行した。パイプラインは乗っ取られたのではない。*利用された*のだ。

## 対応と復旧：発覚、特定、そして返金

SushiSwapの対応は迅速で、公開的で、対決的だった。Delongは静かに調査するのではなく、GitHubハンドル名を公表し、疑われる実名を挙げ、期限を設けた。CoinDesk によると、警告は明確だった――資金が返還されなければ、DEXは[FBIに告訴する](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=file%20a%20complaint%20with%20the%20FBI)と。

それは効果を発揮した。攻撃者は方針を転換した。CryptoSlateは、チームが公表してから数時間後に[ハッカーが865 ETHを元のMISOコントラクトに返還した](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=the%20hacker%20returned%20865%20ETH%20to%20the%20original%20MISO%20contract)と報じた――持ち去った864.8 ETHをわずかに*上回る*額だ。The Crypto Timesは宛先を確認している。[SushiswapのマルチシグアドレスへAPS 865 ETHが返還された](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=the%20multisign%20address%20of%20Sushiswap%20got%20865%20ETH%20back)。DelongのステータスアップデートはもとのAP脅迫と同様に簡潔だった。Decryptは、約1日以内に[全額返還](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum#:~:text=All%20funds%20returned)されたという彼の確認を記録している。

このハッピーエンドには注釈が必要だ。資金が戻ってきたのは、アーキテクチャが窃盗を検知したからではない。攻撃者が、公開された露出と法執行機関への信頼できる脅威という明るい光の下で、自ら返すことを選んだからだ。公開台帳上の仮名性は両刃の剣だ――請負業者が匿名で行動できる一方、流用された資金のオンチェーンの痕跡は誰からも見えていた。それが返金を最も抵抗の少ない選択肢にしたレバレッジでもあった。今回の回収は交渉の結果であり、保証ではなかった。次のインサイダーはひるまないかもしれない。

## コードサプライチェーンとフロントエンドの信頼が教えること

MISOインシデントは、DeFi基準では金額が少なく、教訓が大きい。ここから持ち帰る価値のあるものをいくつか挙げる。

1. **フロントエンドはセキュリティ境界の一部だ。** ユーザーはインターフェイスが指示する通りに署名する。攻撃者がインターフェイスに表示されるアドレスを制御できるなら、スマートコントラクトは必要ない。オンチェーンコードだけを監査しても、システムの半分しか監査していない。
2. **書き込みアクセスが真の攻撃サーフェスだ。** 世界最強の暗号も、コードを編集できる人物がそれを決意したら役に立たない。「誰がこれを変更でき、リリース前に誰がレビューするか」はセキュリティコントロールであり、プロセスの細部ではない。
3. **必須のコードレビューは官僚主義ではない――防衛だ。** `auctionWallet`を差し替えたコミットに、第三者による必須の二重確認が一回あれば、おそらくこれは止められていた。サプライチェーン攻撃は、デプロイ前に誰も独立して確認しない変更を利用して繁栄する。
4. **仮名コントリビューターはリスクを高める。** オープンなコントリビューションは強みだが、デプロイに影響するアクセスを匿名のアイデンティティに付与することは、完全に帰属を確認できないコードを信頼することを意味する。信頼は熱意ではなく、検証に比例して与えられるべきだ。
5. **回収は運であり、アーキテクチャではない。** 資金が戻ったのは、公開的な圧力と追跡可能な台帳のおかげだ。攻撃者の善意に*依存する*システム設計は、セキュリティ設計ではない。

通底するテーマ：*誰が変更を加えることが許されるか*の整合性、そして*配布されたのが正しい変更であることの検証*は、いかなる暗号鍵と同等の重みを持つ。サプライチェーンの信頼は、柔らかい文化的な懸念ではない。それはシステムの硬い境界だ。

## Namefiの視点

![検証可能で改ざん耐性のあるオーナーシップのカラーイラスト――グリーンのシールド、グリーンのNamefiトークン、そして継続性によって保護されている](../../assets/the-sushiswap-miso-insider-attack-03-namefi-angle.jpg)

MISOが資金を失ったのは、*価値の送金先*がシステムの信頼する誰かによって密かに書き換えられ、変更がライブになる前に誰も検証しなかったからだ。この失敗モードはDeFiラunchpadに固有のものではない。ドメインのオーナーシップやDNSレコードが、適切なアクセスを持つ者――[レジストラー](/ja/glossary/registrar/)アカウント、内部パネル、認証情報を持つ請負業者――によって静かに変更される可能性がある場合と同じ構造だ。

ドメインはインターネット上で最も重大な「送金先」設定の一つだ。DNSレコードが、あなたのトラフィック、メール、ユーザーが実際にどこへ行くかを決定する。誰が何を変更したかの改ざん防止で独立に検証可能な記録なしに、インサイダーや侵害されたアカウントがそれを変更できるなら、あなたは別の装いを纏ったMISO問題を抱えている――鍵は問題ない、しかしドアの看板は差し替えられる。

[Namefi](https://namefi.io)は、[ドメインオーナーシップ](/ja/glossary/domain-ownership/)を誰かのプライベートアカウントのエントリとしてではなく、検証可能で改ざん耐性のある資産として扱うことでこれに取り組む。トークン化されたオーナーシップにより、コントロールをDNSとの互換性を保ちながらオンチェーンで監査可能かつ譲渡可能にする――「誰がこれを所有し、誰が変更を許可されているか」は、盲目的に拡張しなければならない信頼ではなく、検証できる事実となる。MISOの請負業者が支払先アドレスを書き換えられたのは、「この変更は承認されているか」という問いに対して、システムに強制された独立に確認可能な答えがなかったからだ。Namefiがサプライチェーン攻撃から得る教訓は、オーナーシップとコントロールは設計上証明可能であるべきで、*信頼された*と*検証済み*の間の危険なギャップが最初から生まれないようにすべきだということだ。

## 情報源とさらなる読み物

- CoinDesk — [$3M in Ether Stolen From SushiSwap's MISO Launchpad](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad)
- Decrypt — [SushiSwap's Token Launchpad Hacked for Over $3M in Ethereum](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum)
- CryptoSlate — [Hacker returns 865 ETH stolen from Sushi's token launch platform MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/)
- PYMNTS — [SushiSwap Crypto Platform Victimized by $3M Hack](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/)
- The Crypto Times — [Sushiswap's Miso Launchpad Loses $3 Million In An Attack](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/)
- Coinspeaker — [SushiSwap Launchpad Miso Suffers Attack with 864.8 ETH NFT Project Fund Carted Away](https://www.coinspeaker.com/sushiswap-miso-attack-nft/)
- CryptoBriefing — [Sushi's Initial Offering Launchpad Suffers $3M Exploit](https://cryptobriefing.com/sushiswaps-miso-token-launchpad-suffers-3m-exploit/)
- CryptoPotato — [Another DeFi Hack: $3M in ETH Stolen From SushiSwap's Token Platform](https://cryptopotato.com/another-defi-hack-3m-in-eth-stolen-from-sushiswaps-token-platform/)
- Quadriga Initiative — [SushiSwap MISO Jaypegs Automart case study](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php)
