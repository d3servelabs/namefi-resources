---
title: 'perl.com ドメイン盗難事件：30年の歴史を持つコミュニティの玄関口がひそかに奪われた顛末'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 19
format: case-study
description: '2021年1月下旬、数十年にわたってPerlプログラミングコミュニティの拠点となっていたperl.comが、レジストラのアカウント侵害によって盗み取られた。ドメインは中国を経由して移転し、マルウェアと関連するIPアドレスに向けられ、19万ドルで売りに出された。本稿では、その経緯・奪還の過程、そしてレジストラのアカウントセキュリティに関する教訓を解説する。'
keywords: ['perl.com', 'perl.com ドメイン盗難', 'ドメインハイジャック', 'ドメイン窃取', 'レジストラアカウント侵害', 'ソーシャルエンジニアリング', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'DNS ハイジャック', 'ドメインセキュリティ', 'アカウント乗っ取り', 'BizCN']
relatedArticles:
  - /ja/blog/the-panix-com-domain-hijack/
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/dns/
  - /ja/glossary/icann/
  - /ja/glossary/registry/
  - /ja/glossary/tld/
---

ドメインの中には、名前の皮をかぶったインフラが存在する。**perl.com** はまさにそのひとつだ。マーケティング資産でもなく、誰かが昨年立ち上げたブランドでもない。Webの黎明期からPerlプログラミングコミュニティが寄り集まってきた「インターネットの調度品」であり、ドキュメント・記事・言語の公式顔としての正面玄関だった。

だから、2021年1月27日の朝、その玄関口が突然よそ者のものになっていたとき、それは巧みなブランド戦略でも合意の上での売却でもなかった。盗難だった。ドメインは数ヶ月前に正当な所有者の管理下からひそかに引き剥がされ、複数のレジストラを経由して転々とし、[マルウェアの配布履歴を持つIPアドレス](/ja/glossary/ip-address/)に向けられていた。Perlコミュニティのネットワーク運用担当者は率直に述べた：[「perl.comドメインが今朝ハイジャックされ、現在はパーキングサイトを指しています。」](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

これはDomain Maydayシリーズの第19話（EP19）だ。サーバーに一切侵入することなく、30年の歴史を持つコミュニティドメインが盗まれ、そして取り戻されるまでの物語である。

## 1990年代初頭から保持されていたドメイン

この盗難を理解するには、その体制がいかに「普通」であったか——そしてその普通さこそが脆弱性だったか——を理解しなければならない。

perl.comは堅牢な企業の金庫に保管されていたわけではない。長く続く多くのドメインと同じように、信頼できる一人の人物によって、主流の[レジストラ](/ja/glossary/registrar/)で、毎年粛々と更新されていた。サイトの編集者であるbrian d foyは、後に自ら書いた事件の経緯の中でその来歴をこう述べている：[「このドメインは1990年代初頭に登録され、まもなくTom Christiansenが管理権を与えられ、基本的には登録料を払い続けていただけです。」](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

これがインターネット上の重要なドメインの大部分の実態だ。一人の人間、レジストラへのログイン、そして30年間ひっそりと料金を払い続けること。これは完璧に機能する——レジストラのアカウント自体が標的になるまでは。

## 2021年1月27日：玄関の鍵が変えられた日

![夜、数十年もの歴史を持つ木製のコミュニティ看板がポールからひっそりと取り外されて持ち去られていく様子を、輝く回路基板の空を背景に描いた鮮やかなカラーのコンセプトアート](../../assets/the-perl-com-domain-theft-01-theft.jpg)

最初の公開警報は、Perlコミュニティのインフラを運営する人々から発せられた。Perl NOC（ネットワーク運用センター）のブログは、ドメインが「今朝」ハイジャックされ、あるべきでない場所を指すようになったと投稿した。単なるパーキングページよりも深刻だったのは、運営者が[「過去にマルウェアを配布したサイトと関連している可能性を示すシグナルがある」](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)と警告したことだ。

brian d foyは同日、公開の場でこの件を取り上げた。事件を報じた記事は状況を端的に伝えている：[「1月27日、PerlプログラミングライターでPerl.comの編集者であるbrian d foyは、perl.comドメインが突然別人名義で登録されているとツイートした。」](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

コミュニティの対応は迅速かつ実用的だった。奪還作業が始まる間、NOCは読者をバックアップへ誘導した：[「コンテンツをお探しの場合は、perldotcom.perl.orgをご覧ください。」](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) 正式なドメイン名は失われたが、コンテンツはアクセス可能なまま維持された。

## 危機に晒されたもの：マルウェアと紐付くIPアドレス

盗まれたドメインの危険性は、そのドメインが持つ信頼の重みに比例する——そしてperl.comは非常に大きな信頼を担っていた。何百万人もの開発者、チュートリアル、CPANのツール群、そしてウェブ上の無数の古いリンクがそこを指していた。この名前を支配する者が、その信頼の向き先を支配できるのだ。

そして新しい「所有者」は、それを無害な場所に向けなかった。BleepingComputerが記録したように、[「ドメイン名perl.comは盗まれ、マルウェアキャンペーンと関連するIPアドレスを指すようになった。」](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

技術的な痕跡は具体的だった。DNSレコードが書き換えられ、[「ドメインに割り当てられたIPアドレスが151.101.2.132からGoogle CloudのIPアドレス35.186.238[.]101に変更された。」](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) その転送先には過去があった：[「2019年、IPアドレス35.186.238[.]101は、現在は活動を停止したLockyランサムウェアのマルウェア実行ファイルを配布するドメインと紐付けられていた。」](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

この二つの事実を重ね合わせれば、危険性は明らかだ。開発者たちが反射的に信頼する名前が、マルウェアの配布履歴を持つIPアドレスを指すようになるというのは、普段はなかなか騙せないセキュリティ意識の高い技術者を騙すための、ほぼ完璧なセットアップだった。

## 経緯：サーバーではなく、レジストラのアカウントが狙われた

![偽造された所有権変更書類がレジストリのサービスカウンターに滑り込まされ、公式のスタンプが赤く光り、書類がネオンの光の中で舞う様子を描いた鮮やかなカラーのコンセプトアート（ブランドロゴなし）](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

この事件が注釈ではなく教科書的な事例となっている理由はここにある：perl.comのWebサーバーはハックされていないし、DNSのパスワードも推測されていない。攻撃は一段上のレイヤー——レジストラ、すなわちドメインの所有者記録を保持する企業——で発生した。

brian d foyは事後分析の中で、その推定メカニズムを率直に説明した：[「Network Solutionsへのソーシャルエンジニアリング攻撃があったと考えています。偽造書類などを使ったものです。」](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) 報道各社も同様に報じた：この盗難は[「レジストラのNetwork Solutionsを騙して、正当な権限なしにドメインの記録を変更させたソーシャルエンジニアリング攻撃」](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)だったと。

最も不穏なのはそのタイムラインだ。コミュニティが気づいたのは1月だったが、実際の侵害ははるか以前だった。ドメイン弁護士のJohn Berryhillによるフォレンジック調査が侵害の実際の日付を数ヶ月前までさかのぼって特定した。perl.comのアカウント記録によれば、[「John Berryhillがツイッターでフォレンジック調査を公開し、侵害が実際には9月に発生していたことを示した。」](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeekも攻撃者の忍耐強さを確認した：[「攻撃は2020年9月に行われた」](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020)——被害が表面化するおよそ4ヶ月前のことだ。

なぜこれほど長く待ったのか？ドメイン移転のルールが忍耐を報いるからだ。[「ICANNは連絡先情報の更新後60日間、ドメインの移転を禁止している。」](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) 9月にレジストラのアカウントをひそかに乗っ取った攻撃者は、すぐにはドメインを移転できない——だから彼らは待ち続け、ロックが解除されてから動いた。

動き出したとき、彼らは奪還を難しくするために、レジストラと国境をまたいでドメインを「洗浄」した。The Registerは最初の移転先を記録した：[「ドメインは12月にBizCNレジストラへ移転されたが、ネームサーバーは変更されなかった。」](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputerは地理的な経路も追跡した：ドメインは[「Network Solutionsにあった2020年9月に盗まれ、クリスマスの日に中国のレジストラへ移転された」](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day)のち、1月に最後の移転が行われ、[「ドメインは再び別のレジストラ、Key Systems GmbHへ移転された。」](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

そして彼らは現金化を試みた。ドメインを新たな場所に移した後、[「不正な登録者はドメイン市場Afternicで19万ドルでドメインを売ろうとした。」](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) 30年の歴史を持つコミュニティ資産が、書類一枚で盗まれ、まるで中古家具のように売りに出されたのだ。

## 奪還：書類でなされた盗難を、書類で取り返す数週間

盗難を可能にした仕組み——レジストラ、[レジストリ](/ja/glossary/registry/)、そして所有権記録——が、唯一の帰還経路でもあった。再確保すべきサーバーはなく、適用すべきパッチもない。Tom Christiansenが本物の所有者であり、新たな「所有者」が詐欺師であることを、レジストラとレジストリの連鎖を通じて*証明*しなければならなかった。

その作業は数日以内に始まった。1月30日までに、Perl NOCは[「Network SolutionsがPerl.comドメインの奪還に向けて、正当な登録者であるTom Christiansenと協力している」](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.)と報告した。この取り組みは[「最終的に、2月初旬にドメインが前の所有者であるTom Christiansenに返還されることとなった。」](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

しかし「返還」は「解決」を意味しなかった。brian d foyの言葉は、安堵と未解決の課題を同時に捉えている：[「Perl.comドメインはTom Christiansenの手に戻り、同じことが再起こらないよう各種セキュリティアップデートに取り組んでいます。」](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) ドメインがマルウェアと紐付くIPアドレスを指していたため、セキュリティ製品はそれをブラックリストに登録し、一部のDNSリゾルバはシンクホールしていた。レジストリ上の記録が正しくなった後も、ブロックリストやリゾルバのレピュテーションシステムで信頼を取り戻すには数週間を要した——この長い尾が、事件全体をおよそ2ヶ月の苦闘へと引き延ばした。

foyはその経緯をほぼ控えめに言い表した：[「私たちは1週間、perl.comドメインの管理を失いました。」](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) 実際の盗難期間は1週間。その前には数ヶ月の潜在的な侵害。そしてその後には数週間の後処理。

## レジストラのアカウントセキュリティと長期保有ドメインへの教訓

perl.comの盗難がこれほど示唆に富むのは、まさに何も特殊なことが起きなかったからだ。本質を剥ぎ取ると、その教訓は不快なほど普遍的だ：

1. **レジストラのアカウントこそが本当の「王冠の宝石」だ。** 誰もがサーバーとDNSホストを堅牢化する。しかし、ドメインの*所有権記録*はレジストラに存在し、そのアカウントはしばしばパスワードと、変更を説得できるサポートチームによってしか守られていない。perl.comはエッジではなく、そこで盗まれた。

2. **ソーシャルエンジニアリングは技術的な制御を上回る。** エクスプロイトもなく、被害者側のマルウェアもなく——ただ[「偽造書類など」](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.)が実際の記録を動かすのに十分だっただけだ。自分のログインに二要素認証を設定していても、レジストラの*人間*がそれを上書きするよう説得されてしまえば意味がない。

3. **長期保有ドメインは格好の標的だ。** 1990年代初頭に登録され、30年間自動更新で維持されてきたドメインは、連絡先情報が古くなり、人的単一障害点を持ち、所有者が[WHOIS](/ja/glossary/whois/)レコードを毎日監視していない傾向がある。静かな安定性こそが、9月の侵害が1月まで気づかれない理由となった。

4. **移転ルールは両刃の剣だ。** 所有者を*保護*するはずだった更新後60日間の[移転ロック](/ja/glossary/transfer-lock/)が、攻撃者の待合室となった。忍耐とレジストラ・国境をまたいだ「洗浄」が、迅速な解決を多者間・数週間にわたる奪還へと変えた。

5. **奪還は盗難より遅い。** 名前を盗むのに必要だったのは偽造書類一枚。取り返すのに必要だったのは、レジストラ、レジストリ、正当な所有者の証拠、そしてブロックリストとリゾルバへの信頼回復の数週間だった。盗難は一つの取引だが、原状回復は多くの手続きを要する。

厳しい結論：perl.comのようなドメインにとって、パスワードの強度はレジストラが騙されるかどうかより重要ではない。

## Namefiの視点

![検証可能で改ざん耐性のあるドメイン所有権のカラーイラスト——緑のシールドで保護されたドメインカード、緑のNamefiトークン、そしてDNSの継続性を表現したもの](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

perl.comの盗難の各ステップは、ひとつの弱点に依存していた：所有権が*他者のアカウント上の記録*であり、適切なサポート担当者を説得できた人間が変更できるということ。攻撃者は所有者の鍵を必要としなかった。必要だったのはレジストラの信頼——そして偽造書類一枚で、30年の歴史を持つ資産を地球の反対側に移し、売りに出すのに十分だった。

[Namefi](https://namefi.io)は正反対の前提の下に構築されている：[ドメインの所有権](/ja/glossary/domain-ownership/)は暗号学的に検証可能であり、ひそかに書き換えることが困難であるべきだという考えだ。ドメインの管理をDNSとの互換性を保ちながらトークン化されたオンチェーン資産として表現することで、「この名前の所有者は誰か？」という権威ある問いの答えが、説得力のある電話一本で変更できるレジストラのデータベースの可変な一行ではなくなる。移転は署名された監査可能なイベントとなり、不正な「所有権変更」がこっそり通り抜けられる裏口がなくなる。

perl.comが一夜にして盗まれなくなるわけではない——レジストラとレジストリは依然としてチェーンの一部だ。しかし、この事件を定義した特定の障害モード——*30年間名前のために料金を払い続けること*と*それが自分のものであることを改ざん耐性をもって証明できること*の間にある溝——を攻略し、盗まれたドメインが誰も異議を唱えられない前に洗浄される時間窓を縮小する。

perl.comは正面玄関を取り戻した。この事件が残す、より困難な問いは、なぜその錠が最初から、正しい書類を持った見知らぬ人が開けられるようなものだったのか、という点だ。

## 出典と参考資料

- The Perl NOC — [perl.com hijacked](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (brian d foy) — [The Hijacking of Perl.com](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [Perl.com domain stolen, now using IP address tied to malware](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [Perl.com theft blamed on social engineering attack](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [Hackers Controlled Perl.com Domain Months Before Hijack](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [Attackers took over the Perl.com domain in September 2020](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [Domain for popular programming website Perl.com stolen in 'hack'](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [Perl.com Domain Stolen, Now Using IP Address of Past Malware Campaigns](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [The perl.com domain has been hijacked](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [Perl.com editors tell the truth about the Perl.com domain hijacking case](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)
