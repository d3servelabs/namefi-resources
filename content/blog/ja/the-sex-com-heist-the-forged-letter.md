---
title: 'Sex.comの強奪：インターネット最高価値ドメインを盗んだ一通の偽造書類'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 21
format: case-study
description: '1995年、スティーブン・コーエンという詐欺師が、Network Solutionsに偽造書類を一通送るだけで、正当な所有者ゲイリー・クレーメンからsex.comを盗み出した。取り戻すための長年にわたる法廷闘争は、6500万ドルの賠償判決、メキシコへの逃亡、そしてドメインが財産であるという画期的な判例で幕を閉じた。'
keywords: ['sex.com', 'ドメイン窃取', 'スティーブン・コーエン', 'ゲイリー・クレーメン', 'Kremen対Cohen訴訟', 'Network Solutions', '偽造書類', 'ドメインハイジャック', 'シャロン・ディミック書類', 'ドメインセキュリティ', 'ドメインの財産性', '6500万ドル判決', 'ドメイン移管詐欺', 'Domain Mayday']
relatedArticles:
  - /ja/blog/the-panix-com-domain-hijack/
  - /ja/blog/the-12-dollar-minute-someone-owned-google-com/
  - /ja/blog/from-twitter-com-to-x-com/
  - /ja/blog/the-perl-com-domain-theft/
  - /ja/blog/from-mona-co-to-crypto-com/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-investing/
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

1995年、インターネット上で最も価値ある一つのアドレスが、たった一枚の紙切れによって持ち主を変えた。

不正侵入もなく、身代金要求もなく、高度なエクスプロイトもなかった。ある詐欺師が書類を一枚タイプし、自分のものではない名前で署名し、バージニア州のドメイン[レジストラ](/ja/glossary/registrar/)にFAXで送った。レジストラはそれを読み、信じ込み、**sex.com**を——後に四半期あたり億ドル規模のビジネスに成長するドメインを——何の権利もない人物に引き渡した。正当な所有者は事後になって初めてそれを知り、取り戻すために約十年もの闘いを強いられた。

これはインターネット史上初の大規模ドメイン強奪事件であり、すべてのドメイン所有者が問うべき問いへの最もはっきりした答えでもある。「*誰かに自分のドメイン名を奪われることを、何が防いでいるのか？*」1995年の答えは、ほぼ何もない、というものだった。

ようこそ、**Domain Mayday / 域名浩劫**へ——オンラインの名前を所有するという概念を形作ったセキュリティ事件に深く迫るシリーズ。第02話：sex.comを盗んだ偽造書類。

## sex.comの価値

1994年初頭、Match.comを創業したことでも知られる起業家[ゲイリー・クレーメン](https://en.wikipedia.org/wiki/Sex.com#:~:text=In%20early%201994%2C%20entrepreneur%20Gary%20Kremen%20%28who%20also%20founded%20Match.com)は、生まれたばかりの商業インターネットを眺め、自明の可能性を見出した。裁判記録によれば、[ゲイリー・クレーメンは1994年5月9日、Network Solutions, Inc.にsex.comというドメイン名を登録した](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424)。当時、ドメインは無料で、メールを一通送るだけで登録でき、その将来的な価値を理解している人はほとんどいなかった。第9巡回区控訴裁判所は後の判決文で、この事件全体を象徴するような皮肉を冒頭に引用している。[「インターネット上でアダルトコンテンツ？誰もが言った——それで金になるわけがない」](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)

金になった。ドメインが盗まれた後、窃盗犯はそれを一大マシンへと変えた。[1日あたり最大2500万ヒットを記録する広告集中型サイト](https://en.wikipedia.org/wiki/Sex.com#:~:text=an%20advertising%2Dheavy%20site%20that%20received%20up%20to%2025%20million%20hits%20a%20day)として運営し、クリックスルーその他の広告から[月間5万〜50万ドルを稼いだ](https://en.wikipedia.org/wiki/Sex.com#:~:text=making%20%2450%2C000%20to%20%24500%2C000%20per%20month)とも言われる。一部の報告によれば、この盗まれたドメインは[sex.comドメイン名を不正に支配していた期間に2億5000万ドル規模のビジネスの基盤](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=may%20have%20created%20a%20%24250%2C000%2C000%20business%20during%20the%20years%20he%20had%20illicit%20control%20of%20the%20sex.com%20domain%20name)となった。業界の観察者の言葉を借りれば、[一部の試算では、これまでに売却されたどのドメイン名よりも高い価値があった](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=by%20some%20accounts%20could%20be%20worth%20more%20than%20any%20domain%20name%20sold%20to%20date)のだ。

これほどの価値を持つ名前が、1990年代のレジストラのセキュリティのもとに置かれていた——紙の錠前がかかった宝箱も同然だった。

## 盗難：一通の偽造書類

![赤いワックスの封印が押された偽造書類が、施錠された金庫から輝く黄金のドメインキーを引き出す様子を描いた、鮮やかなカラーのコンセプトアートイラスト](../../assets/the-sex-com-heist-the-forged-letter-01-the-theft.jpg)

その錠前を破った人物は、スティーブン・マイケル・コーエン——初犯の犯罪者ではなかった。第9巡回区とウィキペディアのいずれもが指摘するように、彼はsex.comに目をつけたとき、刑務所を出たばかりだった。[スティーブン・M・コーエンは、詐欺罪で有罪判決を受けた後に服役を終えたところだった](https://en.wikipedia.org/wiki/Kremen_v._Cohen#:~:text=who%20had%20recently%20completed%20a%20prison%20sentence%20after%20being%20convicted%20of%20fraud)。彼はsex.comにクレーメンと同じものを見た——一財産——そして、それを奪うことを決意した。

その手口は、侮辱的なほど単純だった。コーエンは[クレーメンの会社Online Classifiedsの存在しない役員を名乗る偽造書類でNetwork Solutionsを騙し、sex.comをコーエンに移管するよう授権した](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=hoodwinked%20Network%20Solutions%20with%20a%20phony%20letter)。同じ情報源がより端的に述べているように、コーエンは[偽造された移管申請書をドメインレジストラNetwork Solutionsに送付し、署名を偽造するという単純な方法でゲイリー・クレーメンのドメイン名sex.comを盗んだ](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=stole%20Gary%20Kremen%27s%20domain%20name%2C%20sex.com%2C%20simply%20by%20submitting%20a%20fake%20transfer%20letter)。

[1995年10月18日、Network Solutionsは許可なくドメインをスティーブン・M・コーエンに移管した](https://en.wikipedia.org/wiki/Sex.com#:~:text=On%20October%2018%2C%201995%2C%20Network%20Solutions%20transferred%2C%20without%20permission%2C%20the%20domain%20to%20Stephen%20M.%20Cohen)。ウィキペディアの表現によれば、コーエンは[電話、メール、偽造書類を使い、しばらく前からドメインの支配権を詐取しようと画策していた](https://en.wikipedia.org/wiki/Sex.com#:~:text=had%20been%20trying%20to%20gain%20control%20of%20the%20domain%20for%20some%20time%20by%20misrepresentation%2C%20using%20phone%20calls%2C%20e%2Dmails%20and%20forged%20letters)人物だった。インターネット最高の名前には新たな「所有者」が生まれ、本物の所有者はそれすら知らなかった。

## 偽造「ディミック書類」

![粗雑な偽造署名と不自然なレターヘッドが記された素人臭いタイプライター書類を、虚偽であることを暴く虫眼鏡が照らし出すシーンの、鮮やかなカラーのコンセプトアートイラスト](../../assets/the-sex-com-heist-the-forged-letter-02-forged-letter.jpg)

偽造書類の中身は注目に値する——傑作などではなかった。FAXで送られた、杜撰な代物だった。

地区裁判所の記録によれば、[1995年10月15日付の書類で、シャロン・ディミックなる人物が、Online Classifiedsを代表するとして、スティーブン・コーエンにOnline Classifiedsがドメイン名sex.comを「放棄することにした」旨を伝えた](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424)。書類を作成した者は現実的な問題を抱えていた。会社がどうやってドメインを「放棄」すれば、見知らぬ人物がそれを取得できるのか？控訴審の判決文で引用されたコーエンの答えは、書類にこう書かせることだった。[インターネットへの直接接続を持っていないため、弊社に代わってインターネット登録機関に通知し、ドメイン名sex.comを削除するようお願いしたい](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)と。ウェブサイトの運営を業とする会社が、インターネットに繋ぐ手段がないと主張する——それでもNetwork Solutionsは眉一つ動かさなかった。

書類に名前が記された「シャロン・ディミック」は実在した人物だが、何かを放棄することには何ら関与していなかった。Globe and Mailが報じたように、Network Solutionsが受け取ったのは[1995年末、クレーメンのルームメイトだったシャリン・ディミックが署名したと見られる書類](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)だった。コーエンはクレーメンの同居人の名前を借用し、クレーメン自身の会社になりすましたのだ。

しかも、その名前すら誤っていた。ある事件要約が端的に記録しているように、[コーエンは偽造書類のディミックの署名を誤って記載した](https://www.studicata.com/case-briefs/case/kremen-v-cohen)。後にこの事件に関する著書を書いたジャーナリストはさらに辛辣で、その書類を「[送ったとされる人物が自分の名前すら正確に書けず、レターヘッドは文盲の幼稚園児がジョン・ブル家庭用印刷機で作ったようなもの](https://www.theregister.com/2007/05/31/sex_dot_com_review/)」と評した。

この点にこそ、この話の本当の衝撃がある。インターネット最高価値のドメインを守っていた錠前は、「作者」本人が自分の名前を正しく書けないような偽造書類で破られるほど脆く——そしてレジストラは[それを額面通りに受け取り、支配権を手放した](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)。

## 取り戻すための長年の闘い

sex.comを盗むには書類一通で足りた。取り戻すには何年もの訴訟が必要で、クレーメンはコーエンとドメインを手放したレジストラという二つの戦線で同時に戦わなければならなかった。

コーエンに対しては、事実は動かしがたく、コーエン自身もそれを知っていた。彼は詐欺師らしい方法で応じた——さらなる書類を偽造することだった。[自分が最初からドメインを所有していたこと、sex.comに関する商標を持っていたことを示す書類を偽造し](https://en.wikipedia.org/wiki/Kremen_v._Cohen)、窃盗を弁護するための架空の歴史を作り上げた。裁判所は欺かれなかった。ジェームズ・ウェア判事は移管を無効と裁定した。[地区裁判所はコーエンが詐欺を犯したと判断し、詐欺的書類によってドメイン名を取得したことを理由に、sex.comの所有権を無効と判示した](https://en.wikipedia.org/wiki/Kremen_v._Cohen)。MoreLawの判決記録はその結果を簡潔に示している——[原告勝訴、sex.comを原告に返還するよう命令](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424)。[判事がsex.comの真の所有者と認定した](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)クレーメンは、ついに自分のドメインを取り戻した。

より困難だったのはNetwork Solutionsとの闘いで、それこそが他のすべての人にとって重要な部分だった。クレーメンはレジストラが自分の財産を*転換*——手放した——ことについて責任を負うべきだと主張した。Network Solutionsは、ドメインはそもそも「財産」ではなく、単なるサービスの提供であると反論し、下級裁判所は当初それに同意した。控訴審でコジンスキー判事はこれに異議を唱え、ドメインを明確に財産法の枠組みの中に置いた。[クレーメンのドメイン名はカリフォルニア州の転換法によって保護される](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)と。彼のアナロジーは核心を突いていた——偽造書類に基づいてドメインを誤った人物に手渡すことは、[同様の状況で誰かの株式を手放した場合に企業が責任を負わされることと何ら変わらない](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)と判示した。その後事件は和解で終結したが、原則は定着した。ドメイン名は所有し、失い、訴訟の対象とすることができる財産である。

## 6500万ドルの判決——そしてコーエンの逃亡

この窃盗に課された賠償額は、当時としては巨額だった。裁判所はコーエンが[逸失利益として4000万ドル、懲罰的損害賠償として2500万ドル、計6500万ドルの詐欺・偽造の責任を負う](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/#:~:text=the%20sum%20of%20%2440%20million%20in%20compensation%20for%20lost%20profits%20and%20%2425%20million%20in%20punitive%20damages)と認定した。第9巡回区もその要旨として、裁判所が[補償的損害賠償4000万ドルと懲罰的損害賠償2500万ドルをさらに命じた](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)と記した。The Registerはその終幕を端的にまとめた。この闘いは[2001年4月、クレーメンにドメインが返還され、6500万ドルが認定されてようやく終結した](https://www.theregister.com/2007/05/31/sex_dot_com_review/)。

しかし取り立ては別の話だった。コーエンには支払う気など全くなかった。[命令を無視し、多額の資金をオフショア口座に送金した](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)。これを受けた判事は、判決文の言葉を借りれば容赦なく本気を見せた。[コーエンを逃亡者と宣言し、逮捕状を発行し、米国連邦保安官を差し向けた](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)。その頃にはコーエンはすでに姿を消していた。[逮捕状が発行されると、コーエンはメキシコへ逃亡し](https://en.wikipedia.org/wiki/Sex.com#:~:text=When%20an%20arrest%20warrant%20was%20issued%2C%20Cohen%20fled%20to%20Mexico)、Globe and Mailが「[米国とメキシコ警察に追われるインターネット史上初のドメイン名逃亡者](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)」と呼ぶ人物となった。[自己破産を宣告してメキシコに逃れ、2005年に出入国管理法違反でメキシコ当局に強制送還されるまで数年間、逮捕を逃れ続けた](https://en.wikipedia.org/wiki/Kremen_v._Cohen)。

クレーメンはドメインと判決を手に入れた。しかし6500万ドルの全額回収にはほど遠かった。ここからの教訓は厳しいが重要だ。紙の上の判決は、逃げる覚悟のある人物に対してそれを執行できる能力があって初めて意味を持つ。

## 1990年代のレジストラはなぜこれを許したのか

これをある一つの不注意なレジストラによる、稀有な出来事として読みたくなる気持ちはわかる。そうではなかった。1995年における[ドメイン所有権](/ja/glossary/domain-ownership/)の実態から生まれた、必然的な結果だった。

当時、ドメインを所有していることの「証明」は、レジストラのデータベースにある記録と管理担当者の連絡先だった。そして変更するには*申請する*——通常は書類かFAXで——だけでよかった。暗号署名もなく、二要素認証もなく、移管が実行される前の既存所有者への自動通知もなかった。システムは信頼の上で成り立ち、誰も単純に嘘をつかないという前提で動いていた。コーエンの書類を前にしたNetwork Solutionsは、[クレーメンへの連絡を一切せず](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/)、ウィキペディアが要約するように、[コーエンの不正書類を額面通りに受け取り、コーエンの主張の誤りを確認するための精査も、クレーメンがドメインを放棄したかどうかを確かめる連絡も行わなかった](https://en.wikipedia.org/wiki/Kremen_v._Cohen#:~:text=took%20Cohen%27s%20fraudulent%20letter%20at%20face%20value)。

ここには二つの構造的な欠陥が重なっている。

- **なりすましによる認証。** レジストラは*人物*ではなく*書類*を認証した。もっともらしく見える書類を適切な「会社」名義で作成できる者なら誰でも、ドメインを移動させることができた。身元確認はコスプレに過ぎなかった。
- **本物の所有者への通知がなかった。** これを完全に防いだはずの唯一の制御——移管の実行前に「誰かがあなたのドメインを移管しようとしています」とクレーメンに知らせること——が、単に存在しなかった。被害者が最後に知ることになった。

これはコーエンの失敗ではない。世界で最も価値ある名前を図書館カードのように扱ったシステムの失敗だ。

## ドメイン所有について何を教えるか

sex.comの強奪は30年前の出来事だが、その教訓が色褪せない理由は、ドメイン所有の根底にあるアーキテクチャが思いのほか変わっていないからだ。

1. **ドメインは財産だ——そして財産は盗まれる。** *Kremen対Cohen*訴訟の最も永続的な遺産は、ドメインが転換法によって保護される財産であるという判決だ。それは朗報（あなたには権利がある）であり、警告（価値があり所有者がいるものは、盗む価値がある）でもある。
2. **最も弱い環は移管プロセスであって、パスワードではない。** コーエンはパスワードを推測したわけではない。彼が狙ったのは*管理上の*経路——名前の所有者を変える人間的プロセスだ。ドメインハイジャックの多くは今もこの継ぎ目を狙っている。レジストラのサポート、移管認証、連絡先記録の変更がその対象だ。
3. **書類への信頼はセキュリティではない。** 「公式に見えた」——それが地球上で最も価値あるドメインが持ち出されたきっかけだ。署名、レターヘッド、もっともらしい話——これらのどれも、実際に誰が認可されているかを証明するものではない。
4. **通知と確認は絶対条件だ。** この強奪全体を防いだであろう唯一の手段は、実行前に本当の所有者にリクエストを確認することだった。あなたのドメインを*あなた自身*が確実に関与することなく移動できるシステムは、ドメインを失わせ得るシステムだ。
5. **判決は回収ではない。** クレーメンは6500万ドルの判決を得たが、実際に回収できたのはその一部に過ぎない。防止は常に訴訟に勝る。なぜなら、すでに逃亡した人物が収益化してしまったドメインを、裁判所が見つけることすらできない訴訟で取り戻すことはできないからだ。

## Namefiの視点

![検証可能で改ざん耐性のあるドメイン所有を表すカラフルなイラスト——グリーンのシールド、緑のNamefiトークン、DNS継続性によって保護されたドメインカード](../../assets/the-sex-com-heist-the-forged-letter-03-namefi-angle.jpg)

メキシコへの逃亡とアダルトサイトの収益を取り除いて見れば、sex.comの強奪はたった一つのことを物語っている。誰がその名前を所有しているかを示す、改ざん耐性があり所有者が管理できる記録が存在しなかったということだ。所有権はプライベートデータベースの中に生きており、誤った名前が書かれた偽造書類で係員を騙せる者なら誰でも書き換えることができた。

[Namefi](https://namefi.io)はその対極の前提から出発する。ドメインがトークン化されると、所有権は*あなた自身*が管理する暗号鍵に固定され、すべての移管は誰かが「額面通りに受け取る」FAXではなく、認可され可視化され監査可能な[オンチェーン](/ja/glossary/on-chain/)のアクションとなる。欺くべき係員はなく、説得力のある書類が本当の所有者を上回れる管理上の裏口もなく、所有者が数ヶ月後に知ることになるサイレントな移管もない。支配権は証明可能で、移管は所有者が署名し、監査記録は構造上公開されている——それでいて、インターネットの残りの部分が依存するDNSとの互換性を維持している。

コーエンの偽造書類が機能したのは、彼とsex.comの間に立ちはだかっていたのが、紙切れを信じようとする他者の意思だけだったからだ。検証可能で改ざん耐性のある所有権の意義は、その攻撃を試みることすら不可能にすることにある。署名を偽造できるように[秘密鍵](/ja/glossary/private-key/)を偽造することはできない。インターネット史上初の大規模[ドメイン窃取](/ja/blog/the-perl-com-domain-theft/)が残した最も重要な教訓とは、「この名前は誰のものか」という問いは証明できる事実であるべきであって、見知らぬ者が語れる話であってはならない、ということだ。

## 出典・参考資料

- Wikipedia — [Sex.com](https://en.wikipedia.org/wiki/Sex.com)
- Wikipedia — [Kremen v. Cohen](https://en.wikipedia.org/wiki/Kremen_v._Cohen)
- 米国第9巡回区控訴裁判所 — [Kremen v. Cohen / Online Classifieds v. Network Solutions, 325 F.3d 1035（全文判決、PDF）](https://www.internetlibrary.com/pdf/kremen-cohen-9th-cir.pdf)
- MoreLaw — [Gary Kremen v. Stephen Michael Cohen, et al.（事件記録）](https://www.morelaw.com/verdicts/case.asp?n=98-cv-20718&s=CA&d=11424)
- CircleID — [Domain Name Theft, Fraud And Regulations](https://circleid.com/posts/domain_name_theft_fraud_and_regulations/)
- The Globe and Mail — [The fugitive, the Cupid and sex.com](https://www.theglobeandmail.com/technology/the-fugitive-the-cupid-and-sexcom/article25701429/)
- The Register — [Sex.com: read it if you dare（Kieren McCarthyの著書レビュー）](https://www.theregister.com/2007/05/31/sex_dot_com_review/)
- Studicata — [Kremen v. Cohen — Case Brief Summary](https://www.studicata.com/case-briefs/case/kremen-v-cohen)
- Kieren McCarthy — [The lowdown on the Sex.com case](https://www.kierenmccarthy.co.uk/2006/12/09/the-lowdown-on-the-sexcom-case/)
- CircleID — [Book Review: Sex.com by Kieren McCarthy](https://circleid.com/posts/book_sex_com_by_kieren_mccarthy)
