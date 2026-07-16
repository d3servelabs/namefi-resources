---
title: 'Dyn DNS攻撃：ハッキングされたカメラのMiraiボットネットがインターネットの半分を壊した日'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 11
format: case-study
description: '2016年10月21日、Mirai IoTボットネットによるDDoS攻撃がDNSプロバイダーDynに3波にわたって押し寄せ、Twitter・Netflix・Reddit・Spotify・GitHub・Airbnb・PayPalを数時間にわたってダウンさせた。DNSプロバイダー集中リスクのドメイン・メーデー事例研究。'
keywords: ['Dyn DNS攻撃', 'Miraiボットネット', '2016年10月21日DDoS', 'DNS DDoS攻撃', 'IoTボットネット', 'DNSプロバイダー障害', 'ドメインセキュリティ', 'DNS単一障害点', 'Dyn DDoS 2016', 'Miraiマルウェア', '2016年インターネット障害', 'DNS冗長化', 'ハッキングされたIoTカメラ']
relatedArticles:
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-curve-finance-dns-hijack/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/the-lenovo-com-dns-hijack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
  - /ja/glossary/web3/
---

2016年10月のある金曜日、数時間のあいだ、インターネットは自分自身の居場所を見失った。

Twitterは白紙のページを表示した。Netflixはくるくると読み込み続けて諦めた。Reddit、Spotify、GitHub、Airbnb、PayPal——どれも稼働中で、それぞれのサーバーは完全に正常に動いていたにもかかわらず、どこにも接続できなかった。ハッキングされたわけではない。データが盗まれたわけでもない。ウェブサイトはずっとそこにあった。壊れたのは、インターネットにおける「ものの場所を教える」部分だった。

攻撃はTwitterやNetflixに向けられたのではない。その標的は、利用者のほとんどが名前すら知らなかった企業——ニューハンプシャー州に本拠を置く**Dyn**だった。Dynは現代のウェブの大部分にとって、インターネットのアドレス帳であるDNSを運営していた。使われた武器はサーバーファームでも国家レベルのサイバー兵器でもなかった。ハッキングされたベビーモニター、ウェブカメラ、家庭用ルーター——ごく普通の家電製品が静かに徴集され、**Mirai**と呼ばれる軍隊を形成していたのだ。

これは**ドメイン・メーデー EP08**——安全対策が不十分なスマートカメラがインターネットの電話帳を落とした日の記録である。

## DNS：インターネットの電話帳と、その中でのDynの位置づけ

ドメイン名を入力するたびに、コンピューターはそれを数字の[IPアドレス](/ja/glossary/ip-address/)に変換してから接続を試みる。この変換を担うのがDNS、すなわち[ドメインネームシステム](/ja/glossary/dns/)だ。人間が読みやすい名前と、その名前が指す実際のマシンをつなぐ参照レイヤーである。

DynはそのDNSルックアップサービスの主要なマネージドプロバイダーのひとつだった。サイトがDNSをDynに委託すると、Dynのネームサーバーが「このドメインはどこにあるのか」という問いへの権威ある回答者となる。The Registerは攻撃中にこう端的に説明した——Dynをオフラインに追い込むことで、GoogleやISPが運営するパブリックDNSリゾルバーは[ユーザーのホスト名を調べるためにDynへ接続できなくなり、DNSにDynを使っているサイトへのアクセスが遮断された](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames)のだと。

これがこの物語の核心にある静かな脆弱性だ。ウェブサイトがどれほど完璧であっても——冗長なサーバー、完璧な稼働率、世界レベルのエンジニア——「どこにあるか」という問いに答えるプロバイダーが一社だけで、そこが落ちれば、インターネットから消えてしまう。カーネギーメロン大学のCyLabが後にまとめたように、影響を受けたドメインは[サードパーティDNSであるDynに決定的に依存していた。つまり、Dyn一社のみに頼っていたため、Dynが落ちれば彼らも道連れになった](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn)のだ。

## 2016年10月21日：波状攻撃

![荒れ狂うジャンクトラフィックの大波が巨大な光り輝く電話交換台に押し寄せ、暗い地図の上でディレクトリの灯りが次々と消えていく鮮やかなコンセプトアート](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

攻撃は2016年10月21日（金曜日）の朝に始まったが、一撃で終わることはなかった。一日をかけて、明確に区別できる複数の波として押し寄せた。

Wikipediaの事件記録によると、UTCで午前11時10分頃から始まった[3回連続の分散型サービス妨害攻撃](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks)がDynに叩き込まれた。手口は教科書通りのDDoS攻撃だった——[数千万のIPアドレスから膨大なDNSルックアップリクエストが送りつけられ](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses)、Dynのネームサーバーはジャンクトラフィックに溺れ、正規のリクエストが通らなくなった。

波状攻撃こそが、この攻撃を容赦ないと感じさせた理由だ。The Registerはリアルタイムで状況を伝え、Dynが持ち直したかに見えた瞬間——そして実はそうでなかった瞬間——をこう描写した。[最初のジャンクトラフィックの津波から2時間後、Dynは攻撃を緩和し、サービスが通常に戻りつつあると発表した。しかし束の間の安堵に終わった。約1時間後、攻撃が再開されたのだ](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave)。終わったと思ったのは、ただのラウンドとラウンドの間隙だった。

規模の面では、この攻撃は当時としては前例のない巨大なものだった——The Registerは最大規模を[1Tbpsを超える](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps)と表現している。（ただしDyn自身は、正規トラフィックの「リトライストーム」が初期の推計値を膨らませたと注意を促しており、この点については後で触れる。）

## どのサービスが落ちたか、そしてそれはどう感じられたか

Dynのネームサーバーが応答できなくなると、障害は同社に依存していたすべての事業者へと連鎖した。影響を受けたのは、ウェブの無名の片隅ではない。一般向けインターネットのまさにフロントページだった。

The Registerのライブレポートは被害者を名指しした——Dynへの異例に集中した攻撃は、[Twitterをはじめ、Amazon、Airbnb、Spotifyなど、数百の企業のインターネットサービスを断続的に麻痺させた](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies)と。Wikipediaが列挙した影響サービスは、当時最大規模のサイトの名鑑そのものだ——[Airbnb、Amazon.com、CNN、GitHub、Netflix、PayPal、Reddit、Spotify、Twitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb)、そして数十もの企業が連なる。

数週間前に同じマルウェアで自らのサイトを攻撃されていたBrian Krebsは、ユーザー体験をこう描写した——攻撃は[Twitter、Amazon、Tumblr、Reddit、Spotify、Netflixを含む多数のサイトへのアクセスに問題を引き起こし始めた](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter)と。一般ユーザーにとって、意味のあるエラーメッセージは何も表示されなかった。サイトがただ、読み込まれなかった。最初は米国東海岸で、やがて後続の波とともに米国全土、そしてヨーロッパへと障害が広がった。

## どうやって起きたか：安全対策の甘いスマートデバイスで構成された軍隊

![ハッキングされた何千もの小さなスマートカメラ、トースター、ベビーモニターが光る昆虫の群れのように、過負荷になった単一のディレクトリタワーへと殺到するカラフルなコンセプトアート](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

Dyn攻撃を転換点にした要素がここにある——攻撃力の源泉はコンピューターではなかった。*モノ*だった。

Miraiは、IoT（モノのインターネット）デバイス——カメラ、ルーター、DVR——を狩り出してハイジャックするマルウェアだ。その手口は、コンシューマー向けハードウェアの最も怠慢な弱点を突く。出荷時のデフォルトパスワードだ。The Registerが説明したように、Miraiは[デバイスの工場出荷時のデフォルトパスワードを使ってTelnetやSSH経由でログインし](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords)、従順なゾンビ部隊を増やしながらウェブ全体に広がる。Krebsも同じメカニズムを率直に説明した——Miraiは[工場出荷時のデフォルトのユーザー名とパスワードしかかかっていないIoTデバイスをウェブ上でスキャンし、それらを攻撃に動員する](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices)のだと。

Dyn攻撃の中核にあったデバイスは主に安価なウェブカメラとDVRだった。Krebsはボットネットの出所を追跡し、[中国のハイテク企業、雄迈技術（XiongMai Technologies）製のデジタルビデオレコーダー（DVR）とIPカメラが中心だった](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders)と突き止めた。それらのデバイスのデフォルト認証情報は、多くの場合、[ユーザーには現実的に変更できない](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password)——パスワードがファームウェアにハードコードされていたからだ。

Miraiを厄介者から大惨事へと変えた要因は二つある。第一に、マルウェアの作者が[2016年9月末にソースコードを公開し、事実上誰でも独自の攻撃軍を構築できるようにした](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it)こと。第二に、脆弱なデバイスの数が膨大だったこと。Dynは攻撃の特徴を確認した——同社は[攻撃トラフィックの相当量がMiraiベースのボットネットから発生したことを確認できた](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai)と。Wikipediaはそのボットネットを、[プリンター、IPカメラ、家庭用ゲートウェイ、ベビーモニターなど、Miraiマルウェアに感染したインターネット接続デバイスの群れ](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors)と表現している。

## 事後処理：群れの規模と実行犯を突き止める

騒動が収まった後、「規模はどれほどだったのか」というごく基本的な問いにさえ、明確な答えを出すのが難しかった。Dynが事後分析で示した、EVPスコット・ヒルトンによる推計では、ボットネットの規模は[最大10万の悪意あるエンドポイント](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints)——大規模ではあるが、初期段階の「数千万のIPアドレス」という数字よりははるかに小さかった。この乖離はフィードバックループによるものだ。悪意ある攻撃は少なくとも一つのボットネットに由来していたが、[リトライストームが、実際よりも大幅に多いエンドポイントの存在を示す偽の指標となった](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20storm%20providing%20a%20false%20indicator)のだ。つまり、インターネット自身の「再試行」という自動的な挙動が、混乱をさらに増幅させた。

法的な後日談にも一捻りある。Miraiの背後にいた3人の若者——パラス・ジャ、ジョサイア・ホワイト、ダルトン・ノーマン——は最終的に、[「Miraiボットネット」の作成・運営・アクセス販売への関与について有罪を認めた](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating)。しかしDyn攻撃が行われた時点で、ジャはすでにソースコードを公開していた。検察もメディアも、Dyn攻撃の実行犯が必ずしも元の3人組ではなかった可能性を慎重に指摘している。CyberScoopが報じたように、[インターネット・パフォーマンス管理企業Dynへの最も注目すべきMirai関連攻撃の背後に誰がいたのか、例えばまだ明らかになっていない](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind)部分がある。武器がオープンソースになった瞬間、誰でも引き金を引けるようになった。

Dynへのビジネス的ダメージは現実のものだった。その後数か月で、数千のドメインがDNSを別のプロバイダーへ移転した。一日の失態が顧客の信頼をどれほど損なうか、高い代償を払って学んだ教訓だった。

## DNSプロバイダーへの集中がはらむ教訓

Dyn攻撃はIoTセキュリティの問題として語られることが多く、確かにそれは正しい。しかしより深い教訓は*アーキテクチャ*にある——インターネットのあまりにも多くの経路を一つのチョークポイントに集中させることの危うさだ。

10月21日に落ちたサービスのいずれもが、一見合理的な同じ判断を下していた——DNSを一社の優秀なプロバイダーに委託する。個別に見れば賢い選択だ。しかし集合的に見れば、一社を叩き落とすだけで、ウェブの相当な部分を一気に消滅させることができることを意味していた。CyLabの評価では、この攻撃から得られた教訓が[直接被害を受けた一握りのサイトにしか活かされていない](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful)のは、数年後になっても変わらなかった。

防御の答えは冗長性だ——権威DNSを複数のプロバイダーに分散させることで、どの単一障害も致命傷にならないようにする。Dyn事件から2年後、The Registerは依然としてこの実践が稀であり、難しいままであることを伝えている。InfobloxのCricket Liuは、[複数の権威DNSプロバイダーを使うこと（例えばDynとVerisignまたはNeustar）は依然として容易ではない。複数プロバイダーを使えるようになれば大きな違いが生まれる](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers)と述べた。ドメインを保有するすべての人への教訓は次のとおりだ：

1. **ドメインの障害点は[レジストラ](/ja/glossary/registrar/)だけではない。** 「この名前はどこを指しているか」に答えるプロバイダーは、その背後のサーバーと同じくらい重要な役割を担っている。
2. **単一プロバイダーへのDNS集中は単一障害点を生む。** 通常時の優れた稼働率は、1Tbpsの洪水に対する耐性については何も保証しない。
3. **集中は便利だが脆弱だ。** 一社のプロバイダーを魅力的にしているのと同じ効率性が、その障害を広く波及させる。
4. **回復力は所有権の属性であり、ホスティングだけの話ではない。** 何かが壊れたとき、素早く経路を切り替えられるよう、自分のドメイン設定を明確にコントロールできることが必要だ。

## Namefiの視点

![検証可能で回復力のあるドメイン所有権のカラフルなイラスト——グリーンのシールドで保護されたドメインカード、緑のNamefiトークン、DNSの継続性](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

Dyn攻撃は、ドメインを一つも盗まなかった。移転を偽造したわけでも、レジストラのアカウントをハイジャックしたわけでもない。それでも数時間のあいだ、それらのドメインを*所有していた*人々は、自分の名前がどこを指しているかについて事実上のコントロールを失った。所有権が疑われたからではなく、ドメインの下にある運用レイヤーが一斉に機能を停止したからだ。

「名前を所有すること」と「名前の解決先を確実にコントロールすること」の間にあるこのギャップ——これがまさに、今回のような攻撃が突いてくる継ぎ目だ。ドメインは企業が保有する最も価値ある資産の一つでありながら、そのコントロールは不透明で中央集権的なインフラの背後に置かれがちで、所有者はそれを検証することも、プレッシャー下で素早く再設定することもできない。

[Namefi](https://namefi.io)は、ドメインがインターネットネイティブな資産として振る舞うべきだという考えのもとに構築されている。暗号学的に検証可能でポータブルな所有権でありながら、DNSとの完全な互換性を維持する。検証可能で所有者がコントロールできる[ドメイン所有権](/ja/glossary/domain-ownership/)はボットネットを止めることはできない——しかしそれは、名前のコントロールが証明可能で監査可能であり、一社のプロバイダーの最悪の一日に静かに依存しないインターネットへと世界を向かわせるものだ。Mirai-Dyn攻撃は、あなたが「所有している」ドメインは、それに代わって答えるレイヤーと同じくらいしか回復力を持たないことを、改めて示している。回復力の出発点は、所有権とコントロールを実際に検証できるものにすることだ。

## 参考資料・さらに読む

- Krebs on Security — [Hacked Cameras, DVRs Powered Today's Massive Internet Outage](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/)
- Wikipedia — [DDoS attacks on Dyn](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn)
- The Register — [DNS devastation: Top websites whacked offline as Dyn dies again](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/)
- The Register — [Today the web was broken by countless hacked devices: your 60-second summary](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/)
- The Register — [Mirai, Mirai, pwn them all: who's the greatest botnet on the whole?](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/)
- The Register — [In the two years since Dyn went dark, what have we learned? Not much, it appears](https://www.theregister.com/2018/10/11/dns_insecurity_survey/)
- BankInfoSecurity — [Botnet Army of 'Up to 100,000' IoT Devices Disrupted Dyn](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486)
- Carnegie Mellon CyLab — [Four years since the Mirai-Dyn attack… is the Internet safer?](https://cylab.cmu.edu/news/2020/10/30-dynattack.html)
- CyberScoop — [Three men plead guilty for roles in Mirai botnet empire](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/)
