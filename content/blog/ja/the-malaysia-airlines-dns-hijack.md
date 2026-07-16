---
title: 'マレーシア航空DNSハイジャック事件：「404 — 機体が見つかりません」'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 16
format: case-study
description: '2015年1月、Lizard Squadはmalaysiaairlines.comのDNSをハイジャックし、航空会社のサイトをタキシードを着たトカゲの画像と「404 — 機体が見つかりません」という皮肉な見出しに差し替えた。サーバーは一切侵害されていない――攻撃者はドメインの向き先を変えただけだった。DNSがいかに航空会社にとって最も無防備な玄関口になったかを、Domain Maydayが深掘りする。'
keywords: ['マレーシア航空 DNS ハイジャック', 'Lizard Squad', 'Cyber Caliphate', '404 機体が見つかりません', 'DNSハイジャック', 'ドメインハイジャック', 'レジストラ侵害', 'Webnic', 'malaysiaairlines.com', 'ドメインセキュリティ', 'DNSリダイレクト', 'レジストリロック', 'MH370']
relatedArticles:
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/the-curve-finance-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-bitcoin-org-dns-hijack/
  - /ja/blog/the-fox-it-dns-hijack/
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
  - /ja/glossary/registry/
  - /ja/glossary/tld/
---

機体は今も見つかっていない。2015年1月、ウェブサイトもまた消えていた。

2015年1月26日の朝、ブラウザに **malaysiaairlines.com** と入力した人は、航空会社のサイトには辿り着けなかった。彼らが辿り着いたのはハッカーのページだった。見慣れた予約画面は跡形もなく消え、代わりにシルクハットとモノクルをつけたトカゲの画像と、一行の残酷な見出しが表示された。**「404 — 機体が見つかりません」**。その下には、*「Lizard Squad によるハック — オフィシャル・サイバー・カリフェイト」*。ブラウザのタイトルバーにはただ、*「ISIS will prevail（ISISは必ず勝つ）」*と記されていた。

これは墓場に向けたジョークだった。それより一年も経っていない以前、マレーシア航空370便が239名の乗客乗員を乗せてレーダーから消えていた。その4ヶ月後には、17便がウクライナ上空で撃墜された。今度は10代の若者グループが、同社の哀しみそのものを嘲弄の道具に変え、サーバーには一切触れることなく、航空会社自身の玄関口に貼り付けて全世界に晒したのだ。

最後の一文がすべてを物語っている。マレーシア航空は、多くの人がイメージするような「ハッキング」被害を受けたわけではなかった。予約システムは無傷のままだった。乗客データにも手は加えられていなかった。攻撃者が奪ったのは、もっと根本的なもの――そして実は、はるかに容易に奪えるもの――だった。それが **ドメイン名そのもの**、つまりインターネット全体に「マレーシア航空はここにある」と伝える住所だった。

これは、意識の外にあったインフラの一部が、突然別の場所を指し示したときに何が起きるかを語るDomain Maydayのケーススタディである。

## 航空会社にとってドメインとは何か

グローバルキャリアにとって、ウェブサイトはパンフレットではない。それはレジカウンターであり、チェックインカウンターであり、コールセンターでもある。そのすべてが一本の文字列に紐づいている――`malaysiaairlines.com` だ。

すべての予約、すべてのマイレージログイン、すべての確認メールに埋め込まれた「フライトを管理する」リンクは、このドメインを経由して解決される。クアラルンプールかロンドンにいる乗客がこのアドレスを入力すると、見えない連鎖が動き出す。ブラウザが[ドメインネームシステム（DNS）](/ja/glossary/dns/)に「malaysiaairlines.com はどこにある？」と問い合わせ、DNSが[IPアドレス](/ja/glossary/ip-address/)で答え、ブラウザが接続する。航空会社のブランド、収益、そして顧客の信頼は、そのたった一回の問い合わせが*正しい答え*を返すことに懸かっている。

DNSはインターネットのアドレス帳だ。同時に、ほとんどの組織にとって、建物の中で最も見張られていない扉でもある。サーバーの堅牢化に数百万ドルを注ぎ込み、データベースを暗号化し、[フィッシング](/ja/glossary/phishing/)対策の研修を徹底したとしても、アドレス帳の中の「この名前はどこを指す」という一行を誰かにそっと書き換えられれば、そのすべては無意味だ。アドレスを書き換えられれば、会社ごと書き換えられる――建物には一切侵入せずに。

まさにそれが起きた。

## ハイジャック：航空会社のいた場所に現れたトカゲ

![滑走路の上に光り輝くDNSの道案内が立ち、見えない手によって切り替えられ、旅行者の流れが出発ゲートから404と刻印された行き止まりの壁へと誘導されるという鮮やかなコンセプトアート。ネオンティールとマゼンタ](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

改ざんは最大限の残酷さを持って設計されていた。フォーマルウェアを着たトカゲの画像はLizard Squadの名刺代わりだった。このグループは前年12月に[Xbox LiveとSony PlayStation Networkをオフラインに落とし](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month)、年末年始のホリデーシーズンを台無しにした実績を持つ。1月に入るとグループは「サイバー・カリフェイト」のイメージに自らを包み込み、ISIS支持を装い始めたが、研究者たちはその主張を深く疑っていた。

訪問者が目にしたサイトは、[シルクハットとモノクルをつけたトカゲの画像と「404-Plane Not Found」という文字を表示していた](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27)。Wikipediaに記録されたグループの記事も同じ場面を伝えている。ユーザーは[タキシードを着たトカゲの画像が掲げられた別のページにリダイレクトされ](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard)、そのページには[「404 - Plane Not Found」という見出しが掲げられ、前年に同航空会社が失ったMH370便への明らかな言及だった](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year)。

この残酷さこそが目的だった。MH370は[2014年3月8日にレーダーから消え](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014)、239名全員が最終的に死亡と推定され、機体の残骸も決定的な形では発見されていない。MH17は[2014年7月17日にロシアが支援する勢力によってブク9M38地対空ミサイルで撃墜され](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014)、乗客乗員298名全員が命を落とした。「機体が見つかりません」というメッセージを同社のホームページに刻み込むことは、その航空会社が経験した最悪の一年を武器に変え、サイトに辿り着こうとしたすべての顧客に向けて放送することを意味していた。

そして脅迫が続いた。グループは[「まもなくwww.malaysiaairlines.comのサーバーで見つけた戦利品を公開する」とツイートし](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon)、乗客の旅程表が写っているとされるスクリーンショットまで投稿した。すでに惨禍の一年を耐えてきた航空会社にとって、顧客データが流出しているかもしれないという観測それ自体が、また別の災難だった。

## 何が起きたのか：建物ではなく、アドレス帳

![未来的な交換台のオペレーターが光るケーブルを正しいソケットから引き抜き、偽のソケットに差し込み、光のトラフィックの流れが滑走路から偽のターミナルへと逸れていくという鮮やかなコンセプトアート。電気的なブルーと温かみのあるオレンジ](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

これが事件の技術的核心であり、このケースがサーバー侵害のシリーズではなくドメインセキュリティのシリーズに属する理由だ。

マレーシア航空自身の声明は、報道全体を通じて繰り返し引用され、その区別を明確に示していた。[マレーシア航空は、ドメインネームシステム（DNS）が侵害され、www.malaysiaairlines.comのURLを入力するとハッカーのウェブサイトにリダイレクトされることを確認する](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website)。同社は、[ウェブサイト自体はハッキングされておらず、この一時的な障害は予約に影響を与えず、ユーザーデータは安全に保護されている](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured)と断言し、[ウェブサーバーは無傷](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact)であると付け加えた。

両方とも事実だった。サイトは破壊された、*そして*サーバーは無事だった。攻撃者にサーバーは必要なかった。The Registerが書いたように、[サイトのDNSレコードが改ざんされ、閲覧者はハッカーが管理するサイトにリダイレクトされていた](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site)。彼らはアドレス帳の記載を変えただけで、それが指し示す建物には手をつけていない。悪意はメタデータにも記録されていた。当時の[Whois](/ja/glossary/whois/)検索では、サイトのタイトルとして[「ISIS will prevail」](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail)が登録されていた。

では、そのアドレス帳はどこに保管されていたのか。[レジストラ](/ja/glossary/registrar/)にだ。同社のドメインは[Web Commerce Communications Limited――通称Webnic――（シンガポール、マレーシア、中国に拠点を置く）に登録されていたとみられる](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China)。この名前が重要なのは、Webnicがまもなく悪名高い存在となるからだ。

一ヶ月後、同じレジストラがはるかに大規模な事件の中心に立つことになる。Brian Krebsが報告したように、攻撃者は[マレーシアのレジストラWebnic.ccを掌握し、同社は対象の両ドメインを含む60万件のドメインを管理していた](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others)。さらに[Webnic.ccへのアクセスを利用して、DNSレコードを改ざんした](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records)のが**[Lenovo](/ja/blog/the-lenovo-com-dns-hijack/)**と**Google Vietnam**だった。Krebsによれば、その手口は[Webnic.ccのコマンドインジェクション脆弱性を利用してルートキットをアップロードする](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit)というもので、数十万のドメインがどこを指すかを管理するシステムへの永続的なアクセスを手にしたことになる。

Googleに侵入しなくても google.com.vn をリダイレクトできる。航空会社に侵入しなくても、そのホームページをリダイレクトできる。必要なのは、「このドメインはどこにあるか」という問いへの*答えを持っているレイヤー*――レジストラアカウントとその背後にあるDNSレコード――を侵害することだけだ。そのレイヤーは、ほとんどの企業が実際に守っているセキュリティ境界の外に存在している。

## 影響と対応

同社にとってのダメージは、データ盗難よりもブランドと業務上のものだった。予約やチェックインをしようとした顧客は改ざんページに行き着いた。世界中の見出しが「マレーシア航空」と「ハッキング」を並べた――すでに危機に瀕していたブランドが、今度は行方不明の機体を嘲弄するトカゲと結びつけられたのだ。

同社がDNSハイジャックへの唯一の対処法として動いたのは、侵害されたレイヤーを通じて対応することだった。同社は[サービスプロバイダーと連携して問題を解決した](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider)とし、[システムは22時間以内に完全に復旧する見込み](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours)であると述べた。この復旧時間はDNSの特性を如実に示している。レコードを修正した後でも、誤った答えは世界中のキャッシュに残り、TTLが切れるまで消えない。ハイジャックは素早く実行でき、完全に元に戻すには時間がかかる。

データ公開の脅しについては、同社は予約に影響なし・ユーザーデータは安全という立場を貫いた。グループが豪語した壊滅的な情報漏洩は、結局、公言された形では実現しなかった。しかし「私たちは本当には侵害されていない。攻撃者が私たちの公開上の全アイデンティティを1日近く支配していただけだ」というメッセージを旅行者に伝えるのは難しい。「404 — 機体が見つかりません」を見つめる顧客にとって、サーバー侵害とDNSハイジャックの違いは見えない。サイトが航空会社だった。そして1日間、そのサイトは別の誰かのものだった。

## DNS が玄関口であることから学べること

マレーシア航空のハイジャック事件は、従来の意味では*何も侵害されていなかった*からこそ、教科書的な教訓となる。ここから得られる洞察は、ほぼすべてのオンライン組織に一般化できる。

1. **あなたのドメインは、あなただけではコントロールできない単一障害点だ。** レジストラが、あなたの名前がどこを指すかのマスターレコードを持っている。レジストラのアカウントセキュリティ――あるいはそのソフトウェア――に欠陥があれば、あなたが完璧に堅牢化したサーバーは意味を失う。Webnicはそれを1ヶ月以内に2回、航空会社とGoogleおよびLenovoで証明した。

2. **DNSハイジャックにはあなたへの侵害は不要だ。** 攻撃者はアドレス帳を書き換えただけで、建物には手をつけていない。サーバー、コード、ネットワークを監視する防御策は、命名レイヤーだけで完結する攻撃を見逃しうる。

3. **ドメインを移動できるレコードをロックせよ。** [レジストリロック](/ja/glossary/registry-lock/)およびレジストラレベルのロックは、まさにDNSや[ネームサーバー](/ja/glossary/nameserver/)レコードへの不正変更を阻止するために存在する――ドメインの向き先を変えるためには、手動かつ帯域外のステップが必要になる。高価値ドメインにとって、これはオプションではない。

4. **レジストラでの[DNSSEC](/ja/glossary/dnssec/)と2FAを活用せよ。** レジストラアカウントへの強力な認証とDNSSEC署名を組み合わせれば、マレーシア航空を改ざんしたような静かなレコード差し替えのコストを大幅に引き上げられる。

5. **復旧は攻撃より遅い。** TTLとグローバルキャッシュにより、ハイジャックは修正後も生き続ける。パッチだけでなく、クリーンアップの時間窓を計画に含めること。

不快な結論を一言で言えば、ほとんどの企業は建物を守り、玄関ドアにはどの建物に入るかを全員に知らせる付箋を貼ったままにしている。その付箋を書き換えられれば、会社ごと移転させられる。

## Namefiの視点

![検証可能で改ざん耐性のあるドメイン所有権のカラフルなイラスト――緑のシールドで保護されたドメインカード、緑のNamefiトークン、DNS継続性](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

マレーシア航空のハイジャック事件は、その核心において、*名前の向き先を変える権限を誰が持つか*――そしてその権限がレジストラのレイヤーでいかに容易に静かに奪われうるか――という問いだ。この攻撃は暗号技術を破ったわけでも、データベースをクラックしたわけでもない。破られたのは、ドメインに関する最も重要な事実――どこへ解決されるか――を決定する、アカウントベースのソフトなコントロールプレーンだった。

[Namefi](https://namefi.io)は、[ドメインの所有権](/ja/glossary/domain-ownership/)とコントロールが、レジストラのデータベースの一項目――侵害された一つのアカウントで書き換えられてしまうような――ではなく、検証可能な[インターネットネイティブアセット](/ja/glossary/internet-native-asset/)として振る舞うべきだという考えのもとに構築されている。トークン化された所有権は、「このドメインを誰がコントロールしているか、そのコントロールはたった今移転したか」という問いを監査可能かつ改ざん証跡が残る形にする――DNSとの互換性を保ちながら。ハイジャックへの防衛策は、強固なパスワードだけではない。不正な変更を*静かに行われるもの*から*可視かつ証明可能なもの*へと変えることだ。

マレーシア航空はサーバーを失わなかった。失ったのは、「この名前はどこを指すか」というたった一つの問いへの答えを――約1日間。機体は今も見つかっていない。ウェブサイトもまた、失われるべきではなかった。Domain Maydayの教訓は、アドレス帳がセキュリティ境界の一部であり、それを忘れた日にシルクハットをかぶったトカゲがあなたの玄関に居座るということだ。

## 出典と参考資料

- TechCrunch — [Malaysia Airlines Site Hacked By Lizard Squad](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/)
- The Register — [Lizard Squad threatens Malaysia Airlines with data dump](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/)
- BankInfoSecurity — [Malaysia Airlines Website Hacked](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833)
- Computerworld — [Malaysia Airlines claim DNS hijacked, site not hacked, but attackers threaten data dump](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html)
- Infosecurity Magazine — [Malaysia Airlines Site Back Up as Hackers Threaten Data Dump](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/)
- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- ABC News — [Malaysia Airlines Hit by Lizard Squad Hack Attack](https://abcnews.go.com/Technology/malaysia-airlines-hit-lizard-squad-hack-attack/story?id=28489244)
- NBC News — [Lizard Squad Claims It Hacked Malaysia Airlines Website](https://www.nbcnews.com/storyline/isis-terror/lizard-squad-claims-it-hacked-malaysia-airlines-website-n293461)
- IT Security Guru — [Lizard Squad hijacks Malaysia Airline DNS](https://www.itsecurityguru.org/2015/01/26/lizard-squad-hijacks-malaysia-airline-dns/)
- Wikipedia — [Lizard Squad](https://en.wikipedia.org/wiki/Lizard_Squad)
- Wikipedia — [Malaysia Airlines Flight 370](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370)
- Wikipedia — [Malaysia Airlines Flight 17](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17)
