---
title: 'Lenovo.com DNS ハイジャック事件：Lizard Squad がPC業界最大手の玄関を乗っ取った日'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 15
format: case-study
description: '2015年2月25日、Lizard Squad はレジストラ Webnic を侵害して Lenovo.com をハイジャックし、世界最大のPCメーカーのドメインをウェブカム・スライドショーに差し替え、メールも傍受した。Superfish スキャンダルの直後に起きたこの事件は、レジストラこそが真のセキュリティ境界であることを示す Domain Mayday の深掘り事例だ。'
keywords: ['lenovo.com DNS ハイジャック', 'Lizard Squad', 'Webnic レジストラ', 'Web Commerce Communications', 'DNS ハイジャック', 'Superfish', 'ドメインレジストラ セキュリティ', 'レジストラ侵害', 'EPP 認証コード', 'メール傍受', 'Google ベトナム ハイジャック', 'ドメインセキュリティ', 'レジストラロック']
relatedArticles:
  - /ja/blog/the-malaysia-airlines-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-panix-com-domain-hijack/
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

2015年2月25日の朝、世界最大のPCメーカーのドメインをクリックすると、ウェブカムを見つめる無表情な十代の若者たちのスライドショーが現れ、『ハイスクール・ミュージカル』の楽曲が流れていた。Lenovo のサーバーは一台も侵害されていなかった。Lenovo のパスワードは一つも盗まれていなかった。攻撃者はビルにも、ネットワークにも、ウェブサイト本体にも、一切触れていなかった。

攻撃者がやったのは、同社のドメイン[レジストラ](/ja/glossary/registrar/)にある一つのレコードを変更することだけ。それだけで Lenovo の玄関を乗っ取り、メールを迂回させ、そのブランドを一日中笑いものにするには十分だった。

これが **Domain Mayday EP17**：Lenovo.com DNS ハイジャック事件だ。数字だけ見れば小さな出来事だ——数時間のダウンタイム、本番システムへの侵害なし、顧客データベースの流出なし。しかしこれは、多くの企業が今も間違え続けているある教訓を、かつてないほど鮮明に示した事例だ。すなわち、ドメインのセキュリティはそれを管理するレジストラの強度と等しく、そのレジストラはほぼ確実に自社のセキュリティプログラムの外に置かれているということだ。

## 企業の顔そのものであるドメイン

2015年時点で、Lenovo は[世界最大のPCメーカー](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer)であり、世界で最も多くのノートPCとデスクトップPCを出荷していた。その規模の企業にとって、lenovo.com は単なるマーケティング資産ではない。事業全体の根幹だ。顧客が購入し、サポートチケットが集まり、保証登録が行われる場所であり、そして決定的に重要なのは、社内すべての `@lenovo.com` メールアドレスを支えるドメインでもある。

ブランドがその規模に達すると、ドメインはウェブサイトのアドレスであることをやめ、インフラそのものになる。すべてのプレスリリース、すべての製品パッケージ、すべての従業員の署名、すべての注文確認メールがそこを通る。つまり、ドメインの DNS を支配する者は、ウェブサイトだけでなく、lenovo.com がどこを指すかという「真実」そのものを——ブラウザとメールサーバーの両方にとって——握ることになる。

Lizard Squad が狙ったのはウェブサイトではない。それが指し示すポインタだった。

## 2015年2月25日：奇妙なリダイレクト

![コーポレートのガラス張り店舗の外観を鮮やかな色彩で描いたコンセプトアート。夜のうちに看板が悪ふざけの派手な広告塔に取り替えられ、ネオンピンクとエレクトリックブルーが輝く中、群衆が困惑して見上げている。ブランドロゴなし](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

その日の午後から、lenovo.com にアクセスしても Lenovo のサイトには届かなかった。サイトは[コンピューターの前に座る子どもたちのウェブカム写真のスライドショー](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)に置き換えられており、みな虚ろな表情で、どこか居心地が悪そうで、すべて『ハイスクール・ミュージカル』の[「Breaking Free」](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)をBGMに流れていた。The Register も同じ光景を、通常の製品ページの代わりに[つまらなそうな若者のウェブカム写真のスライドショー](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth)と表現した。

意図的に馬鹿げていた。そしてその馬鹿げた演出こそが狙いだった。これは秘密裏に行われるデータ窃取ではない。同社が所有する最も人目に触れるURLを舞台に演じられた、公開の屈辱だった。

犯人の手がかりは見え見えのところにあった。差し替えられたページのHTMLには、「新たに改良されリブランドされた」ビルドの制作者として [Ryan King と Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) の名前がクレジットされており、インターネット上の調査者たちはすぐにこれを Lizard Squad と結びつけた。前年のホリデーシーズンにPlayStation NetworkとXbox Liveをダウンさせた、あのグループだ。グループはTwitterで犯行を認め、ついでに『ハイスクール・ミュージカル』の歌詞をLenovoに向けて引用してみせた。

そして事態は、恥ずかしいでは済まない段階に進んだ。攻撃者は lenovo.com の DNS を支配していたため、ウェブサイトだけでなくメールも所有したことになる。ある報道によれば、このハイジャックによって[リダイレクトが停止されるまでの間、Lenovo のメールを傍受できる状態](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)になっていた。Lizard Squad はその後、制御を握っていた時間帯に[Lenovo の従業員に送られた2通のメール](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails)を公開した。そのうちの1通は、皮肉にも絶妙なタイミングで、顧客が Lenovo 純正の削除ツールを使って Superfish と呼ばれるソフトウェアを削除しようとした際に Lenovo Yoga ラップトップが[文鎮化した](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked)というトラブルに言及していた。

その一文に、攻撃の動機のすべてが込められていた。

## Superfish という背景

なぜ Lenovo が標的になったのかを理解するには、5日さかのぼる必要がある。

Superfish は、Lenovo が[2014年9月からコンピューターの一部にバンドル](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014)していたアドウェアだ。見た目はただの広告注入ソフトで、ブラウザに追加のショッピング広告を挿入するだけのものだった。しかし、その動作の仕組みは壊滅的な問題を抱えていた。暗号化されたページにも広告を挿入するために、Superfish は独自のルート証明書をインストールし、[暗号化されたページにも広告を差し込める](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages)ようにしていた。つまり、HTTPSを守る南京錠を破壊していたのだ。

さらに悪いことに、この証明書はすべての機械で同じ[秘密鍵](/ja/glossary/private-key/)を使用しており、その鍵は解読可能だった。鍵を取り出した攻撃者は、Superfish が動作している*すべての* Lenovo ラップトップに対して*あらゆる* HTTPS サイトになりすますことができた。これは理論上の欠陥ではなかった。[2015年2月20日、米国国土安全保障省はアンインストールを勧告し](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it)、ルート証明書の削除も求めた。

つまりわずか1週間の間に、企業向けにセキュリティと信頼を売りにしていたメーカーが、中間者攻撃の脆弱性を内蔵した数百万台のラップトップを出荷し、さらに自社の削除ツールが少なくとも1台の顧客マシンを文鎮化させるという事態が起きた。Lizard Squad のハイジャックは抗議行動として演出された——Superfish 騒動を受けた[自業自得の報い](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=sparked%20online%20uproar%20following%20the%20discovery%20of%20adware%20called%20Superfish)として。ウェブカムのスライドショーは演劇だった。メッセージはこうだ：*お前たちは顧客の暗号を壊した。だから俺たちがお前たちの玄関を壊してやる。*

## どう起きたか：レジストラが弱点だった

![ハイジャックされたコントロールパネルのビビッドなカラーコンセプトアート。光るルーティングダイヤルとスイッチが並び、影のある手がブランドの玄関とメール配線を新しいネオンに輝く経路に切り替えている。エレクトリックティールとマゼンタ。ブランドロゴなし](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

ここからが、CISOを夜も眠れなくさせる部分だ：Lenovo 自身のインフラは一切侵害されていなかった。

攻撃者が向かったのはレジストラだった。セキュリティアナリストたちはハイジャックを **Web Commerce Communications**——通称 **Webnic.cc**、マレーシア拠点のレジストラ——の侵害に起因するものと特定した。Help Net Security によれば、ハッカーたちは Lenovo のサーバーを侵害したのではなく、[Lenovo ドメインが登録されていたレジストラ Web Commerce Communications（Webnic.cc）のシステムを侵害した](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)のだという。

Webnic にとってこれが最初の受難ではなかった。その2日前、Google のベトナムドメインが同じ手口でリダイレクトされていた。SecurityWeek はその関連を端的にまとめている：Lizard Squad は[マレーシア拠点のレジストラ WebNIC のシステムに侵入した後、Google Vietnam と Lenovo の DNS レコードをハイジャックした](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)。Brian Krebs は調査した研究者たちの報告を引用し、[両ハイジャックともに攻撃者が Webnic.cc の制御を握ったことで可能になった](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=both%20hijacks%20were%20possible%20because%20the%20attackers%20seized%20control%20over%20Webnic.cc)と報じた——同報告によれば、Webnic は該当2ドメインのほか60万件のドメインを管理していた。

Krebs の報告から読み取れる攻撃の仕組みは、なぜレジストラが格好の標的になるかを示す教科書そのものだ：

- **侵入経路。** Lizard Squad は [Webnic.cc のコマンドインジェクション脆弱性を悪用してルートキットをアップロードし](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit)、レジストラシステムへの永続的な隠れたアクセスを確保した。
- **マスターキー。** さらに[Webnic が保管する](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of)「[認証コード](/ja/glossary/auth-code/)」——*あらゆる*ドメインを別のレジストラに移転できる EPP 転送シークレット——にもアクセスした。
- **リダイレクト。** レジストラレベルの制御を得たことで、lenovo.com の[ネームサーバー](/ja/glossary/nameserver/)レコードを変更した。The Register は、このドメインの[ネームサーバー設定が今日不審にも更新され、ウェブホスティング企業 CloudFlare のDNSサーバーを向くようになった](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare)と報じた——Cloudflare を使って真の送信先サーバーを隠蔽した形だ。
- **メール傍受。** 決定的なのは、ウェブサイトにとどまらなかったことだ。彼らは[メールサーバーレコードを変更して、Lenovo アドレス宛てのメッセージを傍受できる](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)ようにした。DNS は `A` レコードだけでなく `MX` レコードも制御する。ドメインを所有することはメールを所有することを意味した。

最後のポイントこそ、人々が忘れがちな点だ。ウェブサイトの改ざんは騒々しく、すぐに気づかれる。しかし、静かなメール傍受こそが DNS ハイジャックの危険な側面であり——それは同じ、レジストラ一箇所のレコード変更という単一の行為から生じる。

## 対応と事後処理

Lenovo は迅速に動いた。それ以外にできることがほとんどなかったからでもある——修正はレジストラ側にあり、自社サーバーにはなかった。同社は、lenovo.com へのトラフィックを迂回させる効果を持つ[サイバー攻撃の被害を受けた](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)と確認し、[2月25日の夕方までに公開ウェブサイトへの完全アクセスを回復したと見られる](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025)。Cloudflare は自社名がリダイレクト経路に使われていることを把握し、悪意あるネームサーバーへのサービスを停止した。これによってメール傍受も終了した。

より大きな後始末は Webnic の課題となった。1社のレジストラにおけるコマンドインジェクション脆弱性が、インターネット上で最も価値ある2つのドメイン——Lenovo のものと Google のプロパティ——を、48時間以内に愉快犯的なハッカー集団の手に渡してしまった。この事件はレジストラリスクの定番事例となり、「同じ侵害されたシステムの背後に60万件の他のドメインが存在した」という現実を改めて示した。

Lenovo にとって長期的な損害は評判面だった。Superfish の直後に起きたこのハイジャックは、深刻なセキュリティ失態を二幕構成の物語に変えた：まず同社は自社の顧客の信頼を裏切り、次に自社の名前のコントロールを公然と失った。人々が記憶しているのはウェブカムのスライドショーだが、本当に重要だったのはレジストラの侵害だ。

## 教訓：レジストラこそが真のセキュリティ境界

EP17 の不快な教訓は、Lenovo が自社でコントロールできる部分では多くのことを正しく行い、それでも自社がコントロールできない部分を通じてハイジャックされたということだ。

2015年を大きく超えて一般化できる教訓をいくつか挙げる：

1. **レジストラは、そう扱うかどうかにかかわらず、あなたの信頼境界の中にある。** 自社のすべてのサーバーを堅牢化しても、おそらく一度もセキュリティレビューをしたことのない第三者でドメインを失う可能性がある。攻撃者は最も抵抗の少ない経路を取る——そしてレジストラはしばしば自社よりも脆弱だ。
2. **DNS の制御はメールの制御だ。** ハイジャックとは改ざんされたホームページだけではない。同じレコード変更が静かにメールを迂回させ、傍受を可能にし、ドメインに対するパスワードリセットやなりすましを可能にする。`MX` レコードを配管ではなく、セキュリティクリティカルな資産として扱え。
3. **ロックできるものはロックせよ。** レジストラロック（registrar-lock / `clientTransferProhibited`）、EPP/認証コードへのアクセス制限、高価値ドメインへの[レジストリ](/ja/glossary/registry/)レベルのロックは、まさに未承認のネームサーバー変更や移転を防ぐために存在する。コストは安い。省略した場合の代償は、自社ブランドがウェブカムのスライドショーに使われることだ。
4. **[DNSSEC](/ja/glossary/dnssec/) はコストを上げる。** レジストラアカウントの乗っ取り単体を防ぐことはできないが、署名済みゾーンとDNS監視により、気づかれずに静かな改ざんを行うことは難しくなる。
5. **自社の DNS のドリフトを監視せよ。** Lenovo のネームサーバーが予期しないプロバイダーに変更されたことが手がかりだった。NSレコードと MXレコードの継続的な監視により、「顧客がスライドショーを見て初めて気づいた」という状況を、「レコードが変更されたとき即座にアラートを受けた」に変えることができる。

共通のテーマ：ドメイン管理はそれ自体が独自のセキュリティドメインであり、多くの企業はそれを脅威モデルに登場しないベンダーにアウトソーシングしている。

## Namefi の視点

![検証可能で改ざん耐性のあるドメイン所有権のカラフルなイラスト。緑のシールドで保護されたドメインカード、Namefi の緑のトークン、DNS の継続性](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

Lenovo ハイジャック事件は、根本的にはコントロールと出所証明の問題だ。攻撃者は Lenovo になる必要などなかった。lenovo.com を管理するシステムに対して、別の場所を向けるよう「説得」さえすればよかった。誰が正当にドメインを制御しているかを示す、強力で独立した検証可能な記録は存在しなかった——あったのは、Lenovo の誰にも見えない脆弱性によって静かに乗っ取られ得るレジストラアカウント一つだけだ。

[Namefi](https://namefi.io) は、ドメインがインターネットネイティブな資産として振る舞い、検証可能で改ざん耐性のある所有権を持つべきだという考えのもとに構築されている。ドメインの制御が、回収可能な認証コードを持つ単一のレジストラアカウントではなく、監査可能で静かに上書きしにくい暗号的な所有権に錨付けされていれば——未承認のネームサーバー変更は、静かなバックエンドの編集ではなく、管理の連鎖における可視的かつ証明可能な断絶となる。トークン化された所有権はドメインを DNS と互換性を保ちつつ、「この名前を誰がコントロールしており、それは今変わったか？」という問いに対して検証可能な答えを持てるようにする。

Lizard Squad は所有権の連鎖の最も弱い環を突くことで、ある午後の間に大手ハードウェアメーカーの玄関を悪ふざけの舞台にしてしまった。防衛策はより目立つウェブサイトではない。名前の*所有権*そのものを、攻撃者が静かに偽造できないものにすることだ。

## 情報源と参考文献

- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- The Register — [Oh No, Lenovo! Lizard Squad on the attack, flashes swiped emails](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/)
- Engadget — [Lenovo's website hijacked, apparently by Lizard Squad](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)
- SecurityWeek — [Lizard Squad Hijacks Lenovo Website, Emails](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- BankInfoSecurity — [Lenovo Website Hijacked](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953)
- IT Security Guru — [Lizard Squad domain hijack gives control of Google Vietnam and Lenovo website](https://www.itsecurityguru.org/2015/02/26/lizard-squad-domain-hijack-gives-control-of-google-vietnam-and-lenovo-website/)
- CNBC — [Lenovo website breached, hacker group Lizard Squad claims responsibility](https://www.cnbc.com/2015/02/25/lenovo-website-breached-hacker-group-lizard-squad-claims-responsibility.html)
- We Live Security (ESET) — [Lenovo website hacked, Lizard Squad claims responsibility](https://www.welivesecurity.com/2015/02/26/lenovo-website-hacked-lizard-squad-claims-responsibility/)
- Computing — [Lenovo website hijacked by Lizard Squad after Superfish debacle](https://www.computing.co.uk/news/2397084/lenovo-website-hijacked-by-lizard-squad-after-superfish-debacle)
- Wikipedia — [Superfish](https://en.wikipedia.org/wiki/Superfish)
- CISA — [Lenovo Superfish Adware Vulnerable to HTTPS Spoofing](https://www.cisa.gov/news-events/alerts/2015/02/20/lenovo-superfish-adware-vulnerable-to-https-spoofing)
