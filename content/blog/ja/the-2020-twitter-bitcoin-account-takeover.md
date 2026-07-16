---
title: 'ドメイン危機録 EP03：2020年Twitterビットコインアカウント乗っ取り事件'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 5
format: case-study
description: '2020年7月15日、攻撃者は電話一本でTwitterに侵入し、オバマ、バイデン、マスク、ゲイツ、Apple、Uberの認証済みアカウントを乗っ取り、ビットコイン2倍詐欺を実行——約11万8,000ドルを詐取した。オンライン上のアイデンティティがいかにして奪われたか、そして「名前を所有する」ことの意味を深く掘り下げる。'
keywords: ['2020年Twitterハッキング', 'Twitterビットコイン詐欺', 'グレアム・アイバン・クラーク', 'ビッシング', '電話スピアフィッシング', 'ソーシャルエンジニアリング', 'アカウント乗っ取り', 'オンラインアイデンティティセキュリティ', '認証済みアカウント乗っ取り', 'Twitter管理者ツール', 'エージェントツール', 'インサイダーリスク', 'ドメインセキュリティ', 'ニューヨーク金融サービス局Twitterレポート']
relatedArticles:
  - /ja/blog/the-bitcoin-org-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ja/blog/the-12-dollar-minute-someone-owned-google-com/
  - /ja/blog/the-fox-it-dns-hijack/
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
  - /ja/glossary/tld/
  - /ja/glossary/web3/
---

ある水曜日の昼下がり、数時間にわたってインターネット上で最も信頼された声たちが、一斉に同じことを言い始めた——「Bitcoin を送ってくれれば、2倍にして返します」と。

バラク・オバマが言った。ジョー・バイデンが言った。イーロン・マスクが言った。ビル・ゲイツ、ジェフ・ベゾス、カニエ・ウェスト、Apple、Uber——数億人が信頼するよう訓練されてきた、青いチェックマーク付きの認証済みアカウントが、ほぼ一字一句同じ粗雑な暗号通貨詐欺を投稿した。本人たちは一文字も打っていない。*アカウント*が投稿したのだ——鍵を握っていたのは別の誰かだったから。

これが**ドメイン危機録 EP03**だ。第1回・第2回は「名前」の話だった——誰が所有し、誰が奪えるのか。今回は同じ問いが別の衣をまとっている。Twitterのハンドル、認証バッジ、ドメイン名——いずれも、周囲の人間が信頼を寄せるアイデンティティの主張だ。そして2020年7月15日、攻撃者はその主張を奪うのに何が必要かを証明した——マルウェアでも、ゼロデイ脆弱性でもなく、一本の電話で。

## ハンドルに宿る信頼

認証済みアカウントは、信頼のショートカットだ。`@BarackObama` が投稿すれば、見る側は本当に本人かどうかを再確認しない。ハンドルとバッジの組み合わせ*が*すなわち認証だ。そのショートカットは計り知れない価値を持つ——そして、途方もなく脆い。なぜなら、信頼はすべてアカウントに集積されるが、アカウントの制御は全く別の場所に存在しうるからだ。

これはドメイン名とまったく同じ構造だ。`whitehouse.gov` が信頼されるのは、訪問者が証明書チェーンを検証するからではなく、その名前自体が権威を帯びているからだ。その名前を——[レジストラ](/ja/glossary/registrar/)で、[DNS](/ja/glossary/dns/)で、管理パネルで——制御できれば、人々がその名前に注ぎ込んできた信頼をすべて、即座に引き継ぐことができる。それが元々自分のものでなかったとしても。

2020年のTwitterハッキングは、*信頼*と*制御*の乖離を最もクリアに示した事例だ。被害を受けた規制対象の暗号通貨企業が含まれていたため調査を行ったニューヨーク州金融規制当局も、率直にこう述べている。この攻撃は「[洗練されていないサイバー犯罪者でさえ引き起こしうる壊滅的被害の教訓となる事例](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20is%20a%20cautionary%20tale%20about%20the%20extraordinary%20damage%20that%20can%20be%20caused%20even%20by%20unsophisticated%20cybercriminals)」だったと。

## 2020年7月15日：乗っ取りの経緯

![輝くマスターキーが、均一な青い認証バッジで埋め尽くされた巨大な壁を次々と解錠していく、鮮やかなコンセプトアート](../../assets/the-2020-twitter-bitcoin-account-takeover-01-takeover.jpg)

事件は日中、そして素早く起きた。Wikipediaの再構成によれば、「[2020年7月15日、UTC時間20時から22時の間に、130の著名なTwitterアカウントが侵害された](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=On%20July%2015%2C%202020%2C%20between%2020%3A00%20and%2022%3A00%20UTC%2C%20130%20high%2Dprofile%20Twitter%20accounts%20were%20compromised)」。

ニューヨーク州金融サービス局（DFS）のレポートは、その手順を詳述している。攻撃者はまず暗号通貨関連から準備を進めた。「[ハッカーはまず、著名な暗号通貨企業や個人に関連するTwitterアカウントを操作し](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20first%20manipulated%20Twitter%20accounts%20connected%20to%20well%2Dknown%20cryptocurrency%20companies%20and%20individuals)」、Bitcoin[ウォレット](/ja/glossary/wallet/)へ誘導するダイレクトメッセージやツイートを送った。その後、「[ハッカーはさらに賭けを高め、数百万のフォロワーを持つ認証済みアカウントを標的にした](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20then%20raised%20the%20stakes%20significantly%20and%20targeted%20verified%20Twitter%20accounts%20with%20millions%20of%20followers)」。

被害を受けたアカウントのリストは、プラットフォームで最も信頼されるアカウントのゲストリストのようだった。Wikipediaは「[侵害されたとされるアカウントには、バラク・オバマ、ジョー・バイデン、ビル・ゲイツ、ジェフ・ベゾスといった著名人…Apple、Uber、Cash Appなどの企業](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=well%2Dknown%20individuals%20such%20as%20Barack%20Obama%2C%20Joe%20Biden%2C%20Bill%20Gates%2C%20Jeff%20Bezos)のアカウントが含まれていた」と記録している。

メッセージは同一で、あきれるほど単純だった。Appleのアカウントから投稿されたものをWikipediaが記録している。「[コミュニティに恩返しをします。私たちはBitcoinを支持しており、あなたにもそうしてほしいと思っています！私たちのアドレスに送られたBitcoinはすべて2倍にして返します！](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=We%20are%20giving%20back%20to%20our%20community.%20We%20support%20Bitcoin%20and%20believe%20you%20should%20too!%20All%20Bitcoin%20sent%20to%20our%20addresses%20will%20be%20sent%20back%20to%20you%2C%20doubled!)」——世界で最も信頼される数十の口を通じて、同じ口上が繰り返された。

アクセスされたすべてのアカウントが悪用されたわけではない。130アカウントのうち、規制当局は「[Twitterハッキングでは合計130のTwitterユーザーアカウントが侵害された。そのうち45アカウントがツイートの送信に使用された](https://www.dfs.ny.gov/Twitter_Report#:~:text=Overall%2C%20130%20Twitter%20user%20accounts%20were%20compromised%20during%20the%20Twitter%20Hack.%20Of%20those%2C%2045%20accounts%20were%20used%20to%20send%20tweets)」と認定した。45本のメガホンで十分だった。

## 実際に失われたもの

純粋な金額で見れば、被害は小さかった。DFSレポートは「[ハッカーはTwitterハッキングを通じて約11万8,000ドル相当のビットコインを盗んだ](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20stole%20approximately%20%24118%2C000%20worth%20of%20bitcoin%20through%20the%20Twitter%20Hack)」と述べている。Wikipediaも、詐欺メッセージが削除される前に、単一の詐欺ウォレットが「[320件を超える入金を受け取り、その総額は11万ドルを超えた](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=received%20over%20320%20deposits%20with%20a%20value%20of%20over%20US%24110%2C000%20before%20the%20scam%20messages%20were%20removed)」と記録している。この規模の侵害にしては、11万8,000ドルという額はほとんど恥ずかしいほど小さい。

しかし、この金額は実際の損失を大幅に過小評価している。あの午後に本当に崩れ落ちたのは、*信頼のシグナルとしての認証済みハンドルの完全性*だった。2時間にわたって、青いチェックマークは何も証明しなかった。プラットフォームのアイデンティティ層全体——ツイートがそのアカウント名の人物から来ていると信じさせるもの——が、ある10代の若者によって同時に制御可能であることが明白に示された。Twitterの対応はその本質を物語っていた。多くの認証済みアカウントのツイート機能を一時的に凍結したのだ。信頼されたアカウントが嘘をつくのを止める唯一の方法は、それらを沈黙させることだった。

これがアイデンティティ乗っ取りの真のコストだ。金額は注釈に過ぎない。ダメージとは、「このアカウント＝この人物」が真実でなくなり、その等式を信頼していた下流のすべての人が露出されることだ。

## 経緯：電話一本から管理パネルへ

![電話の受話器が釣り竿のように投げられ、そのフックがスイッチとトグルで覆われた輝く内部制御パネルのダッシュボードに引っかかる、鮮やかなコンセプトアート](../../assets/the-2020-twitter-bitcoin-account-takeover-02-vishing.jpg)

エクスプロイトは存在しなかった。DFSレポートは明確だ。「[Twitterハッキングは、サイバー攻撃でよく使われるハイテクな手法や高度な技術を一切使用していない——マルウェアなし、エクスプロイトなし、バックドアなし](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20did%20not%20involve%20any%20of%20the%20high%2Dtech%20or%20sophisticated%20techniques%20often%20used%20in%20cyberattacks%20%E2%80%93%20no%20malware%2C%20no%20exploits%2C%20and%20no%20backdoors)」と。代わりに、「[ハッカーはTwitterの情報技術部門のふりをして電話をかけるという、昔ながらの詐欺師の手口に近い基本的な技術を使った](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20used%20basic%20techniques%20more%20akin%20to%20those%20of%20a%20traditional%20scam%20artist%3A%20phone%20calls%20where%20they%20pretended%20to%20be%20from%20Twitter%E2%80%99s%20Information%20Technology%20department)」。

これが**ビッシング**——音声[フィッシング](/ja/glossary/phishing/)だ。攻撃者は「[数名のTwitter従業員に電話し、TwitterのIT部門のヘルプデスクから連絡していると主張](https://www.dfs.ny.gov/Twitter_Report#:~:text=called%20several%20Twitter%20employees%20and%20claimed%20to%20be%20calling%20from%20the%20Help%20Desk%20in%20Twitter%E2%80%99s%20IT%20department)」し、「[従業員がTwitterのVPN（バーチャルプライベートネットワーク）で問題が発生したと報告されたため対応していると主張した](https://www.dfs.ny.gov/Twitter_Report#:~:text=claimed%20they%20were%20responding%20to%20a%20reported%20problem%20the%20employee%20was%20having%20with%20Twitter%E2%80%99s%20Virtual%20Private%20Network)」。Twitter自身も後にこれを「[電話スピアフィッシング攻撃](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=phone%20spear%20phishing%20attack)」と表現し、「[特定の従業員を誤誘導し、人間の脆弱性を悪用しようとする重大かつ組織的な試み](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=a%20significant%20and%20concerted%20attempt%20to%20mislead%20certain%20employees%20and%20exploit%20human%20vulnerabilities)」に依存していたと述べた。

説得力の源泉は調査であり、技術的スキルではなかった。セキュリティジャーナリストのブライアン・クレブスが記録したように、攻撃者はLinkedInや過去のデータ漏洩から収集した名前、役職、個人情報といったプロフィールデータを駆使し、本物の同僚のように振る舞った。従業員が電話の相手を信じた瞬間、その従業員は認証情報を渡し、その認証情報が本丸への扉を開いた。Twitterの内部アカウント管理ツールへのアクセスだ。

このツールこそが、事件全体の核心だ。クレブスは「[Twitterの管理者ツール内では、任意のTwitterユーザーのメールアドレスを更新できるようだ](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=within%20Twitter%E2%80%99s%20admin%20tools%2C%20apparently%20you%20can%20update%20the%20email%20address%20of%20any%20Twitter%20user)」と報告した——メールアドレスを変更してパスワードリセットを実行すれば、バッジごとアカウントが手に入る。DFSレポートは、一人の従業員が突破されることがなぜこれほど致命的だったかの構造的な失敗を指摘した。「[Twitterは内部ツールへのアクセスを制限していたが、それでも1,000人以上のTwitter従業員がアクセス権を持っていた](https://www.dfs.ny.gov/Twitter_Report#:~:text=Twitter%20did%20limit%20access%20to%20the%20internal%20tools%2C%20but%20over%201%2C000%20Twitter%20employees%20still%20had%20access%20to%20them)」。千人以上がプラットフォーム上のすべてのアイデンティティへのマスターキーを持っていたにもかかわらず、それを管理する最高情報セキュリティ責任者（CISO）がいなかった——「[TwitterはTwitterハッキングの7ヶ月前である2019年12月以来、最高情報セキュリティ責任者（CISO）を置いていなかった](https://www.dfs.ny.gov/Twitter_Report#:~:text=had%20not%20had%20a%20chief%20information%20security%20officer%20(%E2%80%9CCISO%E2%80%9D)%20since%20December%202019%2C%20seven%20months%20before%20the%20Twitter%20Hack)」のだ。

この事件の裏には[マーケットプレイス](/ja/glossary/marketplace/)も存在していた。著名人向け詐欺が実行される前、グループは盗み出した短い「OG」ハンドルを売り捌いていた。クレブスは、オバマ/バイデン/マスク/ゲイツへの攻撃の前に「[非常に人気の高い短いキャラクターのTwitterアカウント名が次々と持ち主を変えた](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=several%20highly%20desirable%20short%2Dcharacter%20Twitter%20account%20names%20changed%20hands)」と報告している。そのコミュニティでは「[短いキャラクターのプロフィール名はステータスと富の象徴](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=short%2Dcharacter%20profile%20names%20confer%20a%20measure%20of%20status%20and%20wealth)」であり、「[転売すれば数千ドルの値がつくことが多い](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=can%20often%20fetch%20thousands%20of%20dollars%20when%20resold)」からだ。希少価値のある名前を盗んでフォーラムで転売するというパターンは、ドメイン投資家なら即座に見覚えがあるだろう。

## 事後と逮捕

事件の解決は、ハッキングとほぼ同じ速さで進んだ。2週間以内に検察が動いた。クレブスは起訴内容を報告した。「[英国ボグノールレジス出身の19歳、メイソン『チェウォン』シェパードは、カリフォルニア州で電信詐欺共謀、マネーロンダリング、コンピュータへの不正アクセスで起訴された](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Mason%20%E2%80%9CChaewon%E2%80%9D%20Sheppard%2C%20a%2019%2Dyear%2Dold%20from%20Bognor%20Regis%2C%20U.K.%2C%20also%20was%20charged%20in%20California%20with%20conspiracy%20to%20commit%20wire%20fraud%2C%20money%20laundering%20and%20unauthorized%20access%20to%20a%20computer)」。また「[フロリダ州オーランド出身の22歳、ニマ『ロレックス』ファゼリは、カリフォルニア州北部地区の刑事訴状で、保護されたコンピュータへの意図的なアクセスの幇助罪で起訴された](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Nima%20%E2%80%9CRolex%E2%80%9D%20Fazeli%2C%20a%2022%2Dyear%2Dold%20from%20Orlando%2C%20Fla.%2C%20was%20charged%20in%20a%20criminal%20complaint%20in%20Northern%20California%20with%20aiding%20and%20abetting%20intentional%20access%20to%20a%20protected%20computer)」。

しかし、首謀者とされた人物はさらに若かった。「[フロリダ州タンパ出身の17歳、グレアム・クラークが、7月15日のTwitterハッキングで起訴された人物の一人だった](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=17%2Dyear%2Dold%20Graham%20Clark%20of%20Tampa%2C%20Fla.%20was%20among%20those%20charged%20in%20the%20July%2015%20Twitter%20hack)」。未成年だったため、連邦裁判所ではなくフロリダ州検察官に起訴された。彼は「[組織的詐欺、通信詐欺を含む30件の重罪で起訴された](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=was%20hit%20with%2030%20felony%20charges%2C%20including%20organized%20fraud%2C%20communications%20fraud)」。

翌3月、クラークは司法取引に応じた。CyberScoopは、彼が「[多数の公人のTwitterアカウントを乗っ取り、117,000ドル以上を盗む計画を主導したことを認めた](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/#:~:text=admitted%20to%20being%20behind%20a%20scheme%20that%20saw%20him%20steal%20more%20than%20%24117%2C000%20by%20taking%20over%20the%20Twitter%20accounts%20of%20numerous%20public%20figures)」と報告した。公共ラジオ局WUSFは量刑を報道した。「[少年施設での3年間の収容、その後3年間の保護観察](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=three%20years%20in%20a%20juvenile%20facility%20to%20be%20followed%20by%20three%20years%20of%20probation)」であり、これは「[州の少年犯罪者法のもとで許容される最高刑](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=the%20maximum%20allowed%20under%20the%20state%E2%80%99s%20youthful%20offender%20law)」だったと付け加えた。

4人目の人物は後に浮上した。Wikipediaは「[2023年4月、オンラインハンドルPlugwalkJoeを持つ英国人23歳のジョセフ・ジェームズ・オコナーがスペインからニューヨークに身柄を引き渡され、刑事訴追に直面した](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=In%20April%202023%2C%2023%2Dyear%2Dold%20Joseph%20James%20O%E2%80%99Connor%2C%20a%20British%20citizen%20with%20the%20online%20handle%20PlugwalkJoe%2C%20was%20extradited%20from%20Spain)」と記録しており、後に連邦刑務所で5年の実刑判決を受けた。

## オンラインアイデンティティの制御が教えること

著名人の名前と暗号通貨を取り除けば、2020年のTwitterハッキングは、アイデンティティを*持つ*ことと*制御する*ことの違いに関する純粋な教訓だ。ここからいくつかの原則が浮かび上がる。

1. **信頼は名前に集積され、制御はバックオフィスに宿る。** 数億人が `@BarackObama` を信頼した。しかしその信頼はアカウントを守らなかった。アカウントの制御面は、千人以上の従業員がアクセスできる内部管理パネルだったからだ。バックオフィスを制御する者がアイデンティティを制御する——表に誰の名前が掲げられていようとも。

2. **最も弱いリンクはほぼ例外なく暗号技術ではない。** エクスプロイトなし、マルウェアなし、バックドアなし——あったのは説得力のある電話一本だ。アイデンティティシステムは、数学層よりも人間とプロセスの層でずっと頻繁に失敗する。誰でも頼めば開けてくれる扉についた完璧な錠前は、錠前ではない。

3. **単一の完全制御点は、単一の完全障害点だ。** *任意の*アカウントのメールアドレスを変更できる再利用可能な内部ツールが一つあったことで、一人の従業員の陥落がプラットフォーム全体の乗っ取りを意味した。集中化された、可逆的で不透明な制御が脆弱性だ。

4. **希少な名前は標的になる。** 大統領のアカウントを乗っ取ったのと同じグループが、密かに短い「OG」ハンドルを数千ドルで売り捌いていた。価値ある名前は窃盗を引き寄せ、名前の価値こそがその制御を奪う価値を生む。

5. **回復はプラットフォームの慈悲に依存すべきではない。** 信頼されたアカウントが嘘をつき始めたとき、Twitterに残った唯一の手段はそれらを凍結することだった。アイデンティティの所有者には「これは本当に私だ」と証明したり、制御を取り戻したりする独立した手段がなかった——彼らは完全に、中央集権的な運営者の内部ツールと善意に依存していた。

## Namefiの視点

![オンラインアイデンティティの検証可能で改ざん耐性のある所有権のカラフルなイラスト——緑のシールド、緑のNamefiトークン、継続性によって保護されている](../../assets/the-2020-twitter-bitcoin-account-takeover-03-namefi-angle.jpg)

ドメイン名は、Twitterの認証済みハンドルが持っていたのとまったく同じ「信頼 vs 制御」の乖離を抱えたオンラインアイデンティティだ——そして多くの場合、同じ種類の不透明なバックオフィスを持つ。ほとんどのドメインにとって、「所有権」はレジストラのアカウントに存在し、パスワードとサポートチームによって守られている。説得力のある電話一本、ソーシャルエンジニアリングによるサポート担当者、内部パネルを通じたメールアドレスの変更——2020年のTwitterの手口は、レジストラのアカウント乗っ取りにほぼ一対一で対応する。あなたのドメインに世界が注ぎ込んできた信頼は、そのドメインの制御が何でも言いくるめられるヘルプデスクの後ろにある限り、それを守ってくれない。

[Namefi](https://namefi.io)はこの乖離を埋めるために存在する。コアとなるアイデアは、ドメインの制御は*検証可能で所有者が保持するもの*であるべきで、誰かの管理ツールの設定であってはならないというものだ。[ドメイン所有権](/ja/glossary/domain-ownership/)をトークン化されたオンチェーン資産として表現しつつDNSとの互換性を保つことで、Namefiは「この名前を誰が制御しているか？」という問いに、サポートエージェントが圧力下で下す判断ではなく、暗号的に答えられるようにする。千人以上の従業員が誰でもアクセスして密かにあなたの名前を再割り当てできる単一の内部パネルは存在しない。制御の証明は所有者とともにあり、移転は即興ではなく監査可能な形で行われる。

2020年のTwitterハッキングが成功したのは、アイデンティティと制御が密かに引き離されていたからだ——名前は一つのことを語り、隠れた管理ツールが別のことを決めた。名前に依存する者への教訓は、制御を名前が帯びる信頼と同じくらい明確で所有者に根ざしたものにすることだ。ハンドル、バッジ、ドメイン——いずれも、その背後にあるバックオフィスと同程度にしか安全ではない。Namefiが賭けているのは、そのバックオフィスが誰かに騙されて応答させられる電話回線ではなく、自分が制御する検証可能な台帳であるべきだということだ。

## 情報源と参考資料

- ニューヨーク州金融サービス局（DFS） — [Twitter調査レポート](https://www.dfs.ny.gov/Twitter_Report)
- Wikipedia — [2020年Twitterアカウントハイジャック](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking)
- Krebs on Security — [水曜日のTwitter大規模ハックの背後にいるのは誰か？](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/)
- Krebs on Security — [利益とロルのためのTwitterハッキング](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/)
- Krebs on Security — [7月15日のTwitter侵害で3名が起訴](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/)
- CyberScoop — [Twitterハッカーが有罪答弁、3年の判決](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/)
- WUSF — [タンパのTwitterハッカー、懲役3年・保護観察3年の判決](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation)
- 米国司法省 — [Twitterハッキングへの関与で3名を起訴](https://www.justice.gov/usao-ndca/pr/three-individuals-charged-alleged-roles-twitter-hack)
- ABC News — [17歳でTwitterをハッキングし有罪答弁したフロリダ州男性に3年の判決](https://abcnews.go.com/Politics/florida-man-pleaded-guilty-hacking-twitter-17-year/story?id=76513232)
