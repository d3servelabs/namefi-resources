---
title: 'Bitcoin.org DNSハイジャック：Bitcoinの公式ホームページが「コインを倍増」詐欺に変えられた経緯'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 8
format: case-study
description: '2021年9月、Bitcoin.org――匿名運営者Cobraが長年運営してきたBitcoinの情報サイト――がDNS層でハイジャックされ、偽の「Bitcoinを倍増させる」プレゼント詐欺に変えられた。サイトがオフラインになるまでの間、詐欺師たちは約1万7,000ドルを騙し取った。Domain Maydayが、何が起きたのか、どのような手法だったのか、そしてクリプトネイティブなサイトであってもDNSに依存するという事実が何を教えてくれるのかを深く掘り下げる。'
keywords: ['bitcoin.org', 'bitcoin.orgハック', 'DNSハイジャック', 'ドメインハイジャック', 'Bitcoin倍増詐欺', '暗号資産プレゼント詐欺', 'cobra bitcoin.org', 'cloudflare dns', 'namecheap', 'DNSセキュリティ', 'ドメインセキュリティ', 'ネームサーバーハイジャック', 'WHOIS変更攻撃']
relatedArticles:
  - /ja/blog/the-curve-finance-dns-hijack/
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
  - /ja/glossary/registry/
---

十数年にわたり、「Bitcoinとは何か、安全に使うにはどうすればよいか」という問いに対して、ベンダーに中立な答えを求める人々はひとつのアドレスに辿り着いてきた――**Bitcoin.org**だ。

このサイトは取引所ではなく、何かを売ることもなかった。世界で最も対立的で、信頼を必要としないお金が持ちうる、*公式*な入口として最も近い存在だった。[2008年8月18日に登録された](https://en.wikipedia.org/wiki/Bitcoin#:~:text=The%20domain%20name%20bitcoin.org%20was%20registered)このサイトは、ジェネシスブロックそのものよりも古く、Bitcoinホワイトペーパーが公開され、新規参入者たちがクリプトの第一のルールを学んだ場所だ――*自分自身が銀行となり、秘密鍵を誰にも預けるな*。

だからこそ、**2021年9月23日（木曜日）**に起きたことには、残酷な皮肉がある。クリプト全体で最も繰り返し語られてきた安全上の教訓――*コインを倍増させると約束する者は詐欺師だ*――が、Bitcoinの正面玄関からまったく逆の形で発信されたのだ。数時間の間、「Bitcoin倍増詐欺に引っかかるな」と人々を教育してきたウェブサイト自体が、「Bitcoin倍増詐欺」と化した。そしてこれは、誰かがサーバーに不正侵入したからではなく、**ドメイン**が奪われたことで起きたのだ。

## 象徴的な信頼の拠り所

このハイジャックがこれほど痛烈だった理由を理解するには、Bitcoin.orgが何を意味していたかを理解する必要がある。

Bitcoinにはどこにも CEOも、本社も、公式スポークスパーソンもいない。長年にわたって存在したのは、コミュニティが運営する参照サイトの小さな集合体であり、Bitcoin.orgはその中で最も著名なものだった。CryptoPotaは[BTCに関連する最古のウェブサイトで、13年以上前に登録された](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/#:~:text=the%20oldest%20website%20in%20relation%20to)と評した。このサイトは[ウォレット](/ja/glossary/wallet/)の推薦情報、入門ガイド、そしてサトシ・ナカモトのホワイトペーパーのコピーをホストしていた。

また、Bitcoinらしいことに、このサイトは幽霊によって運営されていた。サイトは**Cobra**とだけ名乗る匿名の運営者によって維持されていた――原則として匿名を貫く人物だ。その原則はつい最近、法廷で試練を受けていた。数ヶ月前、自称「サトシ」のクレイグ・ライトが英国の著作権訴訟に勝訴し、Bitcoin.orgにホワイトペーパーの削除を強制し、裁判官は[CobraがUKでライトの著作権を侵害することを禁じる差止命令](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=injunction%20prohibiting%20Cobra%20from%20infringing)を発令していた。Cobraの匿名性を守るための弁護はほとんど詩的だった――[裁判規則では私が匿名で訴えられることは認められていたが、匿名で自分を弁護することはできなかった](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=the%20court%20rules%20allowed%20for%20me%20to%20be%20sued%20pseudonymously)。

要するに、Bitcoin.orgは*信頼*を纏っていた――リーダーなき運動が本来持つはずのない、制度的な種類の信頼を、13年間かけて静かに積み上げたのだ。その信頼こそが、標的にされた理由だ。詐欺は、ホストの信頼性が高いほど機能する。そしてクリプトにおいて、Bitcoinの名を冠したサイトほど信頼性の高いホストは、ほとんど存在しない。

ここにはさらに鋭い皮肉が潜んでいる。Bitcoin.orgの精神全体は*セルフカストディ*だった――自分で秘密鍵を持ち、カストディアンを信頼せず、すべてを自分で検証せよ。その教えを完全に身につけた訪問者なら、見知らぬ人のウォレットにコインを送るという約束には絶対に乗らないはずだった。しかしプレゼント詐欺は、見知らぬ人を信頼するよう求めたのではない――*Bitcoin.org自身*を信頼するよう求めたのだ。そのアドレスこそ、何年もの間、安全に入門できる場所として教えられてきた場所だった。この攻撃は教訓を打ち破ったのではなく、教訓を伝える使者そのものをハイジャックしたのだ。

## 2021年9月：ハイジャックと偽のプレゼント企画

![信頼されていた沿岸の灯台ドメインがハイジャックされ、そのビームが「コインを倍増」という輝く偽の看板を水上に照らし出し、小さなボートの方向へ発信している様子を描いた鮮やかなカラフルなコンセプトアート](../../assets/the-bitcoin-org-dns-hijack-01-hijack.jpg)

2021年9月23日の朝、Bitcoin.orgを訪れた人々が目にしたのはウォレットガイドではなかった。ポップアップのモーダルがあった――Bitcoinの最も信頼された参照サイトのホームページに貼り付けられた、公式らしき見た目のオーバーレイだ。

そのメッセージは、クリプト界で最も古い手口を、借り物の権威で着飾ったものだった。**Bitcoin財団**が[コミュニティに還元する](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=giving%20back%20to%20the%20community)と主張し、オファーは[先着1万名限定](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=first%2010%2C000)だと謳い、シンプルな約束を提示した――[このアドレスにBitcoinを送れば、倍の額を返金します！](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=Send%20Bitcoin%20to%20this%20address%2C%20and%20we%20will%20send%20double) QRコードにより操作は極めて簡単だった。CoinDeskがこのジャンルについて淡々と説明したように、そのメカニズムは常に同じだ――[QRコード経由でウォレットアドレスに初回送金後、資金が倍になるという偽の約束をする手口](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=these%20schemes%20give%20false%20promises%20of%20doubling)。結末も常に同じだ――[被害者は実際には何も受け取れず、送った暗号資産を失う](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=Victims%2C%20in%20fact%2C%20receive%20nothing)。

Cobraはこの侵害を公に、そして率直に認め、サイトが[侵害されたとポストし、ハッカーがどのようにして詐欺のモーダルをサイトに設置したか調査中だ](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=has%20been%20compromised.%20Currently%20looking%20into%20how%20the%20hackers)と述べた。

## 被害者が失ったもの

「お金を倍増させる」詐欺は、一部の人が信じた場合にのみ機能する。ランダムなウェブサイトでは、ほぼ誰も信じないだろう。しかし*Bitcoin.org*では、信じた人がいた。

詐欺ウォレットは空のままではなかった。BleepingComputerは、そのアドレスの[最後に更新されたウォレット残高は0.40571238 BTC、約1万7,000米ドル](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=0.40571238%20BTC%20or%20approximately%20US%2417%2C000)だったと報じた。リアルタイムで捕捉したCoinDeskは、[プレゼント詐欺のアドレスが、記事執筆時点で小額送金により1万7,700ドル超を受け取っていた](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=received%20over%20%2417%2C700%20in%20small%20transactions)と記した。

1万7,000ドルが、ひと晩で、ホストサイト自身がかつて警告していたはずの詐欺によって消えた。そして、Bitcoinの設計において最も残酷な部分を思い出してほしい――その取引は取消不能だ。チャージバックも、不正部門も、「銀行に電話する」という選択肢も存在しない。Bitcoinを強力にしているその不可逆性こそが、被害者一人一人の損失をQRコードをスキャンした瞬間に永続させたのだ。

金額的な被害はほとんど枝葉の問題だ。本当のダメージは、Bitcoin.orgが13年かけて築き上げたもの――*このアドレスこそ*が、すべてのアドレスの中で最も信頼できるという前提――に与えられた。

## 何が起きたか：サーバー侵害ではなく、DNSの侵害

![輝くフォークに置かれた道路標識が方向を変えられており、ひとつの矢印が密かに塗り替えられてトラフィックを黄金色のじょうご型の罠――コインを模した形――へ誘導し、本来の安全な経路だけが暗いままになっている、鮮やかでカラフルなコンセプトアート](../../assets/the-bitcoin-org-dns-hijack-02-fake-giveaway.jpg)

これが単なる[フィッシング](/ja/glossary/phishing/)の話ではなく、*Domain Mayday*の事例である理由はここにある――**攻撃者はBitcoin.orgのサーバーに侵入する必要が一切なかった。**

Cobraはこの点について断言した。オリジンサーバーは手つかずだったと言い――[ハック中、私の実際のサーバーには一切トラフィックが来ていなかった](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=my%20actual%20server%20didn%27t%20get%20any%20traffic%20during%20the%20hack)。攻撃はひとつ上のレイヤー、つまりインターネットが*ドメイン名が指す先を決める*部分で起きた。このインシデントを観測していた人々は、[ハックの時点でWHOIS情報が更新され、ネームサーバーとDNSが変更された](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack)と記録した。ネームサーバーを制御できれば、「bitcoin.orgとは*どのサーバー*か？」という問いへの回答を制御でき、信頼された名前を自分が所有するサーバーに密かに向け直すことができる。

Cobra自身の診断は、[DNS](/ja/glossary/dns/)層と、最近のインフラ変更に責任があるとした。彼の言葉を借りれば――[Bitcoin.orgはこれまで一度もハックされたことがなかった。そしてCloudflareに移行し、2ヶ月後にハックされた。](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=Bitcoin.org%20hasn%27t%20been%20hacked%2C%20ever.%20And%20then%20we%20move%20to%20Cloudflare) 彼の作業仮説は限定的で痛烈なものだった――[攻撃者はDNSの何らかの欠陥を突いたようだ](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20attackers%20just%20seem%20to%20have%20exploited%20some%20flaw%20in%20the%20DNS)。Decryptも主流の見解を同様に要約した――攻撃者は[サイトが2ヶ月前にCloudflareへ移行した後のDNS設定の欠陥を突いた](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/#:~:text=exploited%20a%20flaw%20in%20the%20DNS%20configuration%20after%20the%20website%20moved%20to%20Cloudflare)。

根本原因が設定ミスだったのか、[レジストラ](/ja/glossary/registrar/)レベルの侵害だったのか、DNSプロバイダー側の問題だったのかは、公には最終的に特定されなかった――CoinDeskは[ウェブサイトハイジャックの根本原因は未確認だが、DNSハイジャックと疑う声もある](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=root%20cause%20of%20the%20website%20hijack%20remains%20unconfirmed)と記した。しかしその*形*は紛れもない。アプリケーションは無事だった。コードは無事だった。秘密鍵は無事だった。しかし**名前**がハイジャックされ、ウェブ上では名前を制御することがほぼすべてを意味するのだ。

## 対応とその後

修復もまた、ドメイン層で行われた。

生きている悪意あるBitcoin.orgはBitcoin.orgの本物のインフラから提供されていたわけではないため、サイトは単純に「パッチを当てる」ことができなかった。被害を止める最速の方法は、ドメインそのものをサービスから外すことだった。レジストラである**Namecheap**はまさにそれを行った――BleepingComputerによれば、[当社はドメインを一時的に無効化した](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=We%20have%20temporarily%20disabled%20the%20domain)。しばらくの間、訪問者は詐欺ページにもホームページにも辿り着けなかった――CoinDeskは、訪問者が[「このサイトにアクセスできません。」という表示を目にした](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=This%20site%20can%27t%20be%20reached)と報じた。Bitcoin界で最も信頼されていた参照ページが暗転したのだ。

数時間の調査の後、ドメインは正しい向き先に戻され、サイトはハック前の状態に復元された。窓口は短期間――1日以下――であり、盗まれた金額もクリプト犯罪の基準からすれば控えめだった。しかしこのインシデントが大きな衝撃を与えたのは、まさに*どのサイト*だったかという理由からだ。「信頼するな、検証せよ」を誇りとする運動が、自らの正典たる「信頼してください」ページを検証可能な形でユーザーに対して武器化される場面を目の当たりにしたのだ。

## クリプトネイティブなサイトでもDNSに依存するという事実が教えること

![信頼できる外見の広い入口からコインが溢れ出し、暗い底の細い出口へと消えていく、輝く金のコイン詐欺のじょうごを描いた鮮やかでカラフルなコンセプトアート。活発な抽象的背景を背に描かれている。](../../assets/the-bitcoin-org-dns-hijack-03-namefi-angle.jpg)

Bitcoin.orgハイジャックの最も不快な教訓は、**クリプトネイティブであることは、ほとんど何の防御にもならない**ということだ。

Bitcoinは分散化されている。その台帳は改ざんが極めて困難であることで知られている。秘密鍵は、適切に管理されていれば、あなただけのものだ。しかしそのどれもここでは無意味だった――なぜなら、そのすべての*正面玄関*は、どんなECショップや地元のパン屋と何ら変わらない、まったく普通のドメイン名であり、同じDNS、レジストラ、[ネームサーバー](/ja/glossary/nameserver/)の配管の上に乗っていたからだ。[ブロックチェーン](/ja/glossary/blockchain/)は無事だった。ウェブサイト自体は重要な意味で手つかずだった――しかし、それを指す**名前は**そうではなかった。

この事件からいくつかの持続的な教訓が引き出せる。

1. **ドメインはあなたの攻撃対象領域の一部であり、しばしば*最大*の部分だ。** 完璧なコードを書き、秘密鍵をコールドストレージに保管し、すべてのサーバーを堅牢化したとしても、あなたのネームサーバーやレジストラアカウントを制御した攻撃者は、完全にあなたを詐称することができる。名前は正面玄関であり、ハイジャックされた名前は見知らぬ者にその扉を開かせる。

2. **DNSとレジストラの変更は無音かつ影響力が大きい。** [ネームサーバーとDNSが変更された](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=nameservers%20%2B%20DNS%20changed)とき、ほとんどの監視ツールが即座に検知できるような「障害」は何も発生しなかった――サイトは依然として読み込まれ、ただ間違った場所から提供されただけだ。レジストラロック、[レジストリロック](/ja/glossary/registry-lock/)、[DNSSEC](/ja/glossary/dnssec/)、そしてレジストラ/DNSプロバイダーアカウントへの厳格なアクセス制御は、オプションの衛生対策ではない――それらは、誰もが忘れがちな玄関の錠前なのだ。

3. **盗まれているのは信頼性そのものだ。** 攻撃者が本当に欲しかったのは、Bitcoin.orgの1万7,000ドル相当のサーバーではなく、その*信頼性*だ――数時間借り受けて、古典的な詐欺を信じさせるために。あなたのドメインが信頼されればされるほど、ハイジャックの価値が高まる――そして、誰がそれの向き先を変えられるかについて、それだけ慎重でなければならない。

4. **「トラストレス」なインフラも、信頼された名前の上に成り立っている。** 仲介者を排除した正典的な例であるBitcoinでさえ、DNS――階層的で、仲介が介在し、変更可能なシステム――を通じてユーザーに届く。お金を分散化することは、正面玄関を分散化しない。

5. **検知の速さは防御の洗練さに勝る。** Bitcoin.orgが比較的小さな損失でこの危機を乗り越えられたのは、主にコミュニティが詐欺を素早く発見し、レジストラが数時間以内にドメインを引き下げられたからだ。ハイジャックされた名前が攻撃者の元で解決し続ける時間が長くなるほど、損失も――そしてレピュテーションへのダメージも――複利で膨らむ。自分の名前の制御やルーティングが変化した*瞬間*に知ることは、あらゆる単一の静的なロックよりも価値がある。

## Namefiの観点から

Bitcoin.orgのハイジャックは、その根本において*制御と検証可能性*の問題だ。アプリケーションは健全だった。ブロックチェーンは健全だった。失敗したのは、表面上は単純な問いに答えるレイヤーだった――**誰がこの名前を正当に制御しており、どこを指してよいか？** その問いへの回答が無音のうちに書き換えられうる場合――ネームサーバーが交換され、[ハック時にWHOIS情報が更新される](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack)――残りのスタックがどれほど強固でも信頼は蒸発する。

[Namefi](https://namefi.io)は、[ドメイン所有権](/ja/glossary/domain-ownership/)と制御が、変更可能なデータベースのエントリ――攻撃者が密かに書き換えられる――ではなく、一級の、検証可能な、[インターネットネイティブアセット](/ja/glossary/internet-native-asset/)として機能すべきだという考えから出発している。トークン化され監査可能な所有権は、「誰がこのドメインを制御しており、その制御は変化したか？」という問いを[オンチェーン](/ja/glossary/on-chain/)で回答可能にする――無音のネームサーバー交換を、可視化され説明責任が伴うイベントへと変えながら、残りのウェブが依存するDNSとの互換性を維持する。DNSそのものを消し去るわけではないが、*名前に対する制御*をより見えない形でハイジャックしにくく、継続的に検証しやすくする。

Bitcoin.orgは13年間かけて、危険な瞬間とは「検証をやめて信頼を始める瞬間」だと世界に教えてきた。2021年9月の数時間、その自身のドメインが教訓を身をもって証明した。すべての人にとっての教訓はシンプルだ――あなたのドメインは、インターネット上のあなたのアイデンティティだ。その背後にある鍵を守るのと同じくらい慎重に、その名前を守れ。

## 参考資料

- BleepingComputer — [Bitcoin.org hackers steal $17,000 in 'double your cash' scam](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/)
- CoinDesk — [Bitcoin.org Website Inaccessible After Being Hacked by Apparent Giveaway Scam](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/)
- Bitcoin.com News — [Hackers Compromise Web Portal Bitcoin.org — DNS Hijack Replaces Site With BTC Doubler Scam](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/)
- Decrypt — [Bitcoin.org Compromised, Fraudulent Crypto Giveaway Advertised](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/)
- Cointelegraph — [Bitcoin.org goes offline after suffering scam attack](https://cointelegraph.com/news/bitcoin-org-goes-offline-after-suffering-scam-attack)
- CryptoPotato — [BitcoinOrg Hacked: Giveaway Scam Promising Users to Double Their BTC](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/)
- NewsBTC — [Bitcoin.org Hacked By Scammers For A Few Minutes. Someone Sent Them 0.4 BTC](https://www.newsbtc.com/news/bitcoin-org-hacked-by-scammers/)
- CoinDesk — [UK Court Orders Bitcoin.org to Remove White Paper Following Craig Wright Lawsuit](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit)
- Wikipedia — [Bitcoin (history of the bitcoin.org domain)](https://en.wikipedia.org/wiki/Bitcoin)
