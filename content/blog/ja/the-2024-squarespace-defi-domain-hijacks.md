---
title: 'ドメイン緊急事態 EP05：2024年Squarespace DeFiドメイン大量乗っ取り事件'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 6
format: case-study
description: '2024年7月、Google DomainsからSquarespaceへのレジストラ移行が、デフォルト認証の脆弱性を大規模な攻撃面に変えた。攻撃者はCompound Finance、Celer Network、Pendle、Unstoppable Domainsなど暗号資産・DeFiプロジェクトのドメインを乗っ取り、ウォレットドレイナー型フィッシングサイトに誘導した。「シームレス」な移行がいかにして数百の無施錠の玄関を生み出したか、そしてレジストラセキュリティとMFAについて何を教えてくれるかを解説する。'
keywords: ['Squarespace ドメイン乗っ取り', 'Google Domains 移行', 'DeFi DNS ハイジャック', 'Compound Finance ハイジャック', 'Celer Network ハイジャック', 'ウォレットドレイナー', 'Inferno ドレイナー', 'ドメインセキュリティ', 'レジストラ移行', 'MFA 多要素認証', 'OAuth アカウント乗っ取り', 'DNS ハイジャック', '暗号資産フィッシング']
relatedArticles:
  - /ja/blog/the-curve-finance-dns-hijack/
  - /ja/blog/the-badgerdao-frontend-attack/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-dnspionage-campaign/
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

2024年7月、暗号資産プロジェクトのウェブサイトにとって最も危険な要素は、[スマートコントラクト](/ja/glossary/smart-contract/)のバグでも[秘密鍵](/ja/glossary/private-key/)の漏洩でもなかった。それは、ドメインを管理する[レジストラ](/ja/glossary/registrar/)だった。

その月の数日間、ユーザーが見慣れたアドレスをブラウザに入力すると——信頼していた[レンディングプロトコル](/ja/glossary/lending-protocol/)の公式サイト、何度も利用したブリッジのサイト——まさに目的のページにたどり着き、正確に見えるページが表示され、そして[ウォレット](/ja/glossary/wallet/)が空になった。通常の意味でハッキングされたわけではない。パスワードが解読されたわけでも、[シードフレーズ](/ja/glossary/seed-phrase/)がフィッシングされたわけでもない。攻撃者は単純に、*ドメイン*そのものの正面玄関から歩き入ったのだ。その玄関は、ほとんどのプロジェクトが気づきもしなかった企業間の移行作業の最中に、施錠されないまま放置されていた。

その移行とは、Google DomainsからSquarespaceへの移行のことだ。施錠されていなかった玄関とは、Squarespaceの認証デフォルト設定だった。その結果として生じたのは、研究者の言葉を借りれば「数十億ドル規模の資産を管理する」暗号資産・[DeFi](/ja/glossary/defi/)プロジェクトを標的とした、組織的な[DNS](/ja/glossary/dns/)乗っ取りの波だった。

## レジストラ移行が大規模な攻撃面を生み出した経緯

ドメインは通常、一つひとつが独立した存在として認識される——自分だけのアドレス、自分だけのコントロールパネル、自分だけのDNSレコード。しかしレジストラは膨大な数のドメインをまとめて管理しており、あるレジストラの顧客全員が別のレジストラへ移行する際には、*同じ*移行ロジックで、*同じ*デフォルト設定のまま、*同時に*全員分のアカウントが移行される。そのロジックに存在する弱点は、個別のバグではなく、ドメイン群全体に共通する性質となる。

これこそが、2024年の事件を個々の不運な侵害が連続したものではなく、*大規模*イベントにした要因だ。

2023年6月、[Squarespaceはおよそ1,000万件のドメイン名をGoogle Domainsから購入した](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20purchased%20roughly%2010%20million%20domain%20names%20from%20Google%20Domains%20in%20June%202023)。Googleがレジストラ事業からの撤退を発表したためだ。その後の約1年間、[Squarespaceはこの取引で取得したおよそ1,000万件のドメイン名に関するユーザーの移行作業を進めた](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=Squarespace%20has%20been%20migrating%20users%20for%20roughly%2010%20million%20domain%20names%20purchased%20in%20the%20transaction)。移行をシームレスに感じさせるため、Squarespaceはそれぞれの移行対象ドメインに紐付いたユーザーのアカウントを、Googleが保持していたメールアドレスをもとにあらかじめ作成した。

シームレスであることこそが問題だった。ユーザーに何も要求しない移行は、ユーザーが何も証明していない移行でもある——パスワードも、身元も、メールアドレスの管理権限も。アカウントは存在し、ドメインは紐付けられ、ドメインと「最初にたどり着いた者」との間に立ちはだかるのは、移行後アカウントに対してほとんど何も要求しないログイン画面だけだった。

## 2024年7月の乗っ取り事件

![引越しトラックから大量のドメインの家の鍵がこぼれ落ち、一部が暗闇の中から伸びる手に舞い込む様子を描いたカラフルなコンセプトアートイラスト。小さな家の列がそれぞれ光るウェブアドレスを冠している](../../assets/the-2024-squarespace-defi-domain-hijacks-01-mass-hijack.jpg)

[攻撃は7月9日に始まり](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=The%20attacks%20started%20on%20July%209)、その後数日間にわたって続いた。その手口は決して巧妙なものではなかった。BleepingComputerの報道によれば、[Squarespaceレジストラを利用する分散型金融（DeFi）暗号資産ドメインを標的とした組織的なDNSハイジャック攻撃の波が発生し、訪問者はウォレットドレイナーを仕掛けたフィッシングサイトへとリダイレクトされた](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=A%20wave%20of%20coordinated%20DNS%20hijacking%20attacks%20targets%20decentralized%20finance%20%28DeFi%29%20cryptocurrency%20domains%20using%20the%20Squarespace%20registrar%2C%20redirecting%20visitors%20to%20phishing%20sites%20hosting%20wallet%20drainers)。

最初に騒動となったのは、DeFiレンディング分野でも屈指の知名度を誇るプロジェクトだった。事件を調査したセキュリティ企業Blockaidは、[これらのサイトへの訪問者が、接続したウォレットから資金を抜き取るよう設計された悪意あるページへリダイレクトされていた](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=Visitors%20to%20these%20sites%20were%20being%20redirected%20to%20malicious%20pages%20designed%20to%20drain%20funds%20from%20connected%20wallets)ことを確認した。偽サイトは粗雑なコピーではなかった。Blockaidによれば、[これらの偽dAppはInfernoドレインキットの最新バージョンを稼働させており、ユーザーにウォレットを空にするトランザクションへの署名を誘導するよう設計されていた](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=These%20fake%20dApps%20were%20running%20the%20latest%20iteration%20of%20the%20Inferno%20draining%20kit%2C%20designed%20to%20trick%20users%20into%20signing%20transactions%20that%20would%20empty%20their%20wallets)。

被害が確認されたプロジェクトのリストは、エコシステムの名だたる顔ぶれが並んだ。乗っ取られたのは[Celer Network、Compound Finance、Pendle Finance、そしてUnstoppable Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Celer%20Network%2C%20Compound%20Finance%2C%20Pendle%20Finance%2C%20and%20Unstoppable%20Domains)だ。Compoundは[メインドメインが乗っ取られてフィッシングページを表示する状態となった](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=its%20main%20domain%20had%20been%20taken%20over%20to%20display%20a%20phishing%20page)。Celerは攻撃を察知し[DNSレコードを迅速に回復した](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=swiftly%20recovered%20its%20DNS%20records)。Pendleも[同様の問題が発生し](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=experienced%20similar%20issues)、ユーザーに対してウォレット承認の取り消しを警告した。

## 何が危機にさらされ、何が失われたか

ドメイン乗っ取りの残酷さは、ユーザーが習慣的に頼っているあらゆる安全確認を無効化することにある。URLを確認する。本物のサイトかどうか確かめる。鍵マークを確認する。これらのアドバイスはすべて、ドメインが正しい場所を指していることを前提としている。しかし攻撃者がドメインのDNSを支配している場合、URLは*本物*——プロジェクトの正規アドレス——でありながら、攻撃者のサーバーへと誘導する。南京錠のアイコンは緑色だ。アドレスバーは嘘をつかない。しかしページは罠だ。

だからこそInfernoのようなウォレットドレイナーキットは、[DNSハイジャック](/ja/glossary/dns-hijacking/)と非常に相性がよい。ドレイナーはパスワードを盗む必要がない。被害者に*ウォレットを接続させ、署名させる*だけでよい。そして、レンディングプロトコルの正規ドメインにたどり着いたユーザーには、トランザクションを承認することを躊躇う理由がない。[フィッシング](/ja/glossary/phishing/)サイトは、正規ドメインが長年かけて培った信頼をそのまま受け継ぐのだ。

被害の規模はどれほどだったか。その深刻さを示す数字は、確認された盗難件数ではなく、*危険にさらされた*プロジェクトの数だった。Decryptが伝えたBlockaidの分析は率直だった。[おおよそ228のDeFiプロトコルのフロントエンドがいまだリスクにさらされている](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack#:~:text=roughly%20228%20DeFi%20protocol%20front%20ends%20are%20still%20at%20risk)——すべてが同じ移行アカウントの脆弱性の背後にあるからだ。実際に発生した乗っ取りは、あくまで一部にすぎない。攻撃面はGoogleからSquarespaceへの移行に乗った暗号資産コミュニティ全体に及んでいた。

## 経緯：移行における認証の欠陥

![新しいビルの外に郵便受けが一列に並び、すべての扉が開いて施錠されていない様子を描いたカラフルなコンセプトアートイラスト。顔のない人物が、正当な所有者が到着する前に一つの郵便受けにこっそり手紙を入れている。暖かい光と冷たい光のコントラスト](../../assets/the-2024-squarespace-defi-domain-hijacks-02-migration-flaw.jpg)

研究者が仕組みを再構築すると、それはほとんど恥ずかしくなるほど単純なものだった——だからこそ、大規模に危険だったのだ。

二つの設計上の選択から始まる。第一に、Squarespaceはログインしようとしている人物が実際にそのアカウントのメールアドレスを管理しているかを確認していなかった。研究者が指摘したように、[Squarespaceはパスワードで作成された新しいアカウントに対してメールアドレスの確認を要求しない](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts#:~:text=Squarespace%20doesn%27t%20require%20email%20verification%20for%20new%20accounts%20created%20with%20a%20password)。第二に、移行済みアカウントはあらかじめ作成されていたがまだ誰にも請求されておらず——パスワードが設定されていなかった。そのため、正しいメールアドレスを持つ者が現れると、[アカウントにパスワードがないため、「新規アカウントのパスワードを作成」するフローに直接誘導される](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=since%20there%27s%20no%20password%20on%20the%20account%2C%20it%20just%20shoots%20them%20to%20the)。

この二つを組み合わせれば、攻撃の手口は自ずと描ける。移行対象ドメインに紐付いたメールアドレスは秘密ではなかった——管理者連絡先や[登録者](/ja/glossary/registrant/)連絡先は公開されていたり推測可能だったりすることが多い。正当な所有者がログインするより先に、既知の移行済みメールアドレスを使ってアカウントを登録した攻撃者は、そのままドメインの支配権を手にした。MetaMaskのリードプロダクトマネージャーであり、この事件を解剖した研究者の一人でもあるTaylor Monahanは、この盲点を正確に指摘した。[Squarespaceは、脅威アクターが正当なメールアドレス保有者より先に、最近移行されたドメインに関連するメールアドレスを使ってアカウントを登録する可能性を想定していなかった](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20never%20accounted%20for%20the%20possibility%20that%20a%20threat%20actor%20might%20sign%20up%20for%20an%20account%20using%20an%20email%20associated%20with%20a%20recently%2Dmigrated%20domain%20before%20the%20legitimate%20email%20holder%20created%20the%20account%20themselves)。

なぜこのような事前紐付けが存在したのか。利便性のためだ。研究者は、[SquarespaceはGoogle Domainsから移行するユーザー全員がソーシャルログインオプション、つまりGoogle OAuthを選ぶと想定していた](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20assumed%20all%20users%20migrating%20from%20Google%20Domains%20would%20select%20the%20social%20login%20options)と結論づけた。このシステムは[アカウントがすでに存在するかどうかにかかわらず、すべてのメールアドレスをドメインに事前紐付けした。おそらく、ユーザーがGoogle OAuthでログインすれば即座にすべてのドメインにアクセスできるようにしたかったのだろう](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/#:~:text=pre%2Dlinking%20all%20emails%20to%20domains%2C%20regardless%20of%20whether%20the%20account%20already%20exists%2C%20likely%20because%20they%20wanted%20users%20to%20be%20able%20to%20OAuth%20with%20Google%20and%20immediately%20have%20access%20to%20all%20their%20domains)と、研究者はThe Registerへの取材で説明した。しかしメールアドレスとパスワードによるログインパスは閉じられておらず、そのパスでは受信箱の管理権限を何ら証明しないままだった。

さらなる加速剤もあった。移行の過程で、本来この問題を防ぐべき保護機能が無効化されていた。[Squarespaceへの移行の一環として、アカウントの多要素認証がオフにされていた](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=as%20part%20of%20the%20transition%20to%20Squarespace%2C%20multi%2Dfactor%20authentication%20was%20turned%20off%20on%20accounts)のだ。Google DomainでMFAを丁寧に有効化していたドメイン所有者でさえ、Squarespaceに到達した時点でそのMFAは剥ぎ取られていた。解読すべきパスワードも、突破すべき第二要素も、傍受すべきメールも存在しない——移行済みで誰にも請求されていないアカウントにとって、推測可能なメールアドレスを知っていることがすべての認証だった。

## 対応と緩和策

暗号資産セキュリティコミュニティは、レジストラよりも速く動いた。[Samczsun、Taylor Monahan、Andrew Mohawk](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=Samczsun%2C%20Taylor%20Monahan%2C%20and%20Andrew%20Mohawk)らの研究者がその仕組みを公開し、Blockaidはまだ脆弱なフロントエンドのリストを関係プロジェクトに共有して、自分たちが危険にさらされているかどうか確認できるようにした。被害を受けたプロジェクトは、アカウントを取り戻し、DNSレコードをリセットし、悪意あるサイトに付与したトークン承認を取り消すようユーザーへ警告することに追われた。

移行済みアカウントに残る全員への即時の対処アドバイスは同じだった。攻撃者より先にログインしてアカウントを確保し、強固でユニークなパスワードを設定し、そして何より——移行によって無言のうちに削除されていた多要素認証を再有効化すること。Squarespace側は移行済みアカウントとアカウント作成フローのセキュリティ強化に取り組んだ。しかし、構造的な教訓はパッチよりも長く語り継がれるはずだ。ベンダーが移行中に無効化したセキュリティ制御は、その移行期間中、存在しない制御と同義である。

## レジストラセキュリティとMFAから学ぶべきこと

Squarespaceの乗っ取り事件は、ある一社の設定ミスをめぐる話ではない。ドメインの支配権が実際にどこにあるのか、そして[ブロックチェーン](/ja/glossary/blockchain/)より上のレイヤーがいかに脆弱であり続けているかをめぐる話だ。

2024年7月を超えて広く通用するいくつかの教訓がある。

1. **レジストラアカウントが信頼の真の根拠であり、スマートコントラクトではない。** 被害を受けたプロトコルのいずれもコントラクトにバグはなかった。[オンチェーン](/ja/glossary/on-chain/)のコードは正常だった。攻撃者が奪ったのは*ドメイン*であり、ドメインこそユーザーが入力し、信頼し、ウォレットを接続するものだ。プロジェクトはオンチェーンで完璧であっても、DNSの[コントロールプレーン](/ja/blog/dns-is-the-control-plane/)が脆弱であれば、ユーザーを攻撃者の手に渡してしまう。

2. **MFAは移行を乗り越えてこそ保護になる。** ここで痛ましいのは、MFAが攻撃によって無効化されたのではなく——移行の利便性として、攻撃より*前に*削除されていたことだ。MFAの状態を、アカウントの移行・譲渡・ベンダー変更のたびに再確認すべきものとして扱い、一度設定すれば終わりという姿勢を捨てること。

3. **「シームレス」はセキュリティとのトレードオフである。** 移行がユーザーの利便性のために省略するステップは、アイデンティティが証明されないステップだ。あらかじめ作成されたアカウント、自動紐付けされたメールアドレス、確認なしのログイン——これらはすべてユーザーが感じなかった摩擦であり、摩擦こそが多くの場合、攻撃者を締め出していたものだ。

4. **推測可能な識別子は、変装した認証情報だ。** これらのドメインを解錠した「秘密」は、決して秘密でなかったメールアドレスだった。公開された識別子を知ることで支配権が得られるシステムは、なりすまし一つで侵害される。

5. **レジストラの影響範囲は顧客全体に及ぶ。** レジストラのデフォルト動作が脆弱であれば、個々のドメインセキュリティはほとんど意味をなさない。デフォルトは全員に一度に適用されるからだ。ドメインをどこに置くか、そしてその管理者が認証をどのように扱うかは、オンチェーンでの意思決定と同じくらい重大なセキュリティの選択だ。

## Namefiの観点

![検証可能な改ざん耐性のあるドメイン所有権を表すカラフルなイラスト——グリーンのシールドに守られたドメインカード、緑のNamefiトークン、DNS継続性](../../assets/the-2024-squarespace-defi-domain-hijacks-03-namefi-angle.jpg)

2024年の乗っ取りは、「このドメインを本当に所有しているのは誰か」と「そのドメインを管理するアカウントにログインできるのは誰か」という二つの問いの間隙で起きた。従来のモデルでは、この二つの結びつきは緩い。所有権はレジストラのデータベース上の記録であり、そのアクセスはレジストラがその週に適用している認証方式によって制御される——1,000万件のドメイン移行の最中に、その門が一時的に大きく開いていたとしても。

[Namefi](https://namefi.io)はこの間隙を埋めるために作られている。[ドメイン所有権](/ja/glossary/domain-ownership/)をDNSとの互換性を保ちながらトークン化されたオンチェーン資産として表現することで、支配権は推測可能なメールアドレスやベンダーのログインデフォルトに依存するのではなく、*暗号学的に検証可能*なものとなる。所有権は自分が管理するウォレットに存在し、移転は監査可能であり、「誰がこのドメインのレコードを変更できるか」という問いには、カスタマーサポートへの問い合わせではなく、改ざん耐性のある答えがある。

それはSquarespaceの移行を完璧なものにするわけではない。しかし障害の様相を変える。既知のメールアドレスを使ってアカウントを登録した攻撃者は、それによって[トークン化ドメイン](/ja/blog/what-are-tokenized-domains/)を所有することにはならない——所有権は、半初期化されたアカウントが静かに請求できるようなデータ行ではないからだ。名前のコントロールプレーンは、それが守る資産と同等の偽造困難性を持つべきだ。2024年7月、数百の暗号資産プロジェクトにとってそれは実現していなかった。その間隙こそ、技術的に解消する価値がある。

## 情報源と参考資料

- Krebs on Security — [Researchers: Weak Security Defaults Enabled Squarespace Domains Hijacks](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/)
- BleepingComputer — [DNS hijacks target crypto platforms registered with Squarespace](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/)
- Blockaid — [Squarespace Domain Hijacking Incident: Attack Report](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident)
- SecurityWeek — [Hackers Exploit Flaw in Squarespace Migration to Hijack Domains](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/)
- Decrypt — [More Than 220 DeFi Protocols Still 'at Risk' From Squarespace DNS Hijack](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack)
- The Register — [Infoseccers claim Squarespace migration linked to DNS hijackings at Web3 firms](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/)
- Socket — [Squarespace Domain Hijacks Enabled by Email Address Exploit on Migrated Accounts](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts)
- SiliconANGLE — [Multiple crypto domains hijacked from Squarespace due to Google Domains migration flaw](https://siliconangle.com/2024/07/15/multiple-crypto-domains-hijacked-squarespace-due-google-domains-migration-flaw/)
- Cybernews — [Squarespace crypto domains under DNS attack, lack of MFA to blame](https://cybernews.com/security/squarespace-dns-hijack-attack-crypto-domains-mfa/)
- Hackread — [DeFi Hack Alert: Squarespace Domains Vulnerable to DNS Hijacking](https://hackread.com/defi-hack-alert-squarespace-domains-dns-hijacking/)
- CircleID — [Security Lapses Lead to Squarespace Domain Hijacks](https://circleid.com/posts/20240716-security-lapses-lead-to-squarespace-domain-hijacks)
