---
title: 'ドメイン危機録 EP10：シリア電子軍がフィッシングで再販業者を陥落させ、NYTimes.comを奪取した方法'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 23
format: case-study
description: '2013年8月27日、シリア電子軍はMelbourne ITの再販業者をフィッシングで攻撃し、nytimes.comとTwitterのドメインのDNSレコードを書き換えて、ニューヨーク・タイムズを数時間にわたってオフラインに追い込んだ。レジストラチェーンの弱い輪が大手新聞社の玄関口を破綻させるまでの経緯、そしてレジストリロックがあれば何が変わったかを徹底的に解説する。'
keywords: ['nytimes.comハッキング', 'シリア電子軍', 'melbourne it', 'DNSハイジャック', 'ドメインハイジャック', 'レジストラセキュリティ', '再販業者フィッシング', 'レジストリロック', 'DNSレコード', 'ドメインネームサーバー攻撃', 'twitter dns 2013', 'ドメインセキュリティ', 'serverupdateprohibited']
relatedArticles:
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
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

新聞社にとって、ドメイン名は玄関口そのものだ。`nytimes.com` と入力するとき、あなたは目に見えない連鎖——ドメイン[レジストリ](/ja/glossary/registry/)、[レジストラ](/ja/glossary/registrar/)、そしてその下層に位置する[再販業者](/ja/glossary/reseller/)——を信頼し、本物の編集局だけに接続されることを期待している。普段はその連鎖を意識することすらない。だが2013年8月27日、その連鎖が断ち切られた。数百万人の読者が*ニューヨーク・タイムズ*の玄関口を訪れると、そこには全く別の「何者か」が掲げた看板が立っていた。

その「何者か」とは**シリア電子軍**（SEA：Syrian Electronic Army）——アサド政権を支持する親政府系ハッカー集団で、2013年を通じて欧米メディアを次々と標的にしていた。今回彼らがやったことは、記事の改ざんでも、コンテンツ管理システムへの侵入でもなかった。もう一段深いところ——**DNSレコード**、つまりドメインの接続先を決める仕組み——に手を入れたのだ。そして数時間のあいだ、地球上でもっとも読まれるニュースサイトのひとつのアドレスを、彼らが支配した。

## ドメインは玄関口であり、その錠前はあなたの管轄外にある

*ニューヨーク・タイムズ*のような企業がドメインを登録すると、「誰がこれを所有しているか、どこを指しているか」という権威ある情報は[レジストリ](/ja/glossary/registry/)（`.com`の場合はVerisign）に保存され、**レジストラ**を通じて管理される。大手レジストラはさらに**再販業者**——ドメインサービスを転売し、レジストラのシステムへの独自ログインを持つ中小企業——を通じてサービスを提供することが多い。

この多層構造は便利だ。しかし同時に、最も弱い輪がシステム全体のセキュリティを決定する信頼の連鎖でもある。攻撃者がその連鎖のなかの*誰か*——[登録者](/ja/glossary/registrant/)、レジストラのスタッフ、あるいは再販業者——として認証を通過できれば、レジストラのシステムは設計通りにその人物を正当な所有者として扱う。Melbourne ITのCEO自身が、この脆弱性を一言で言い表した。AP通信に対し、[「彼らは正面玄関から入ってきた」](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door)と述べたのだ。有効なユーザー名とパスワードさえあれば、システムはその人物を正当な所有者とみなす。問題の核心はまさにそこにある。

## 2013年8月27日：nytimes.comが別の場所を指した日

![巨大な新聞社の玄関看板がボルトを外されて別の出入口に付け替えられる鮮やかなコンセプトアート。赤く光るルーティング矢印が群衆の読者を暗い脇道へと引き込んでいる](../../assets/the-syrian-electronic-army-nyt-hijack-01-hijack.jpg)

火曜日の午後遅く、読者は*タイムズ*にアクセスできなくなった。ABCニュースは[「ニューヨーク・タイムズのウェブサイトが一部ユーザーに表示されなくなった」](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=gone%20dark%20for%20some%20users)と報じ、同紙はドメインレジストラへの攻撃を受けて[「火曜日の午後から読者がサイトを閲覧できない状態」](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=unavailable%20to%20readers%20on%20Tuesday%20afternoon)にあると認めた。これは一時的な小さな障害ではなかった。クリスチャン・サイエンス・モニターは、[訪問者が「火曜日の数時間にわたって空白のブラウザ画面を表示された」](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=greeted%20with%20blank%20browser%20screens%20for%20several%20hours)と報じた。さらに追い打ちをかけるように、これは[「今月2度目」](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=second%20time%20this%20month)のダウンだった。

実際に起きていたのはレジストラレベルでの**DNSハイジャック**だった。攻撃者は`nytimes.com`を[IPアドレス](/ja/glossary/ip-address/)に変換するレコードに侵入し、書き換えた。Wikipediaの事件記録によると、[`NYTimes.com`の「DNSが『Hacked by SEA（SEAによりハッキング済み）』というメッセージを表示するページにリダイレクトされた」](https://en.wikipedia.org/wiki/Syrian_Electronic_Army#:~:text=had%20its%20DNS%20redirected%20to%20a%20page%20that%20displayed%20the%20message)のだ。玄関の看板が、全く別の出入口に付け替えられていたのである。

*タイムズ*だけが標的ではなかった。TechCrunchがリアルタイムで報じたところによれば、[「ニューヨーク・タイムズとTwitterのネームサーバーはいずれもレジストラMelbourne ITに登録されていたとみられる」](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=name%20servers%20appear%20to%20have%20been%20registered%20through%20the%20registrar%20Melbourne%20IT)という。また[「Twitterの画像とアバターを配信する`twimg.com`ドメインも、SEAが保有するとみられるサーバーを指す変更が確認された」](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=which%20serves%20up%20Twitter%20images%20and%20avatars)とも報告された。Twitterの本体サービスはほぼ無事だったが、画像・アバター用ドメインが一時的に不安定になり、一部ユーザーは壊れた画像を目にした。

## 影響：数時間の暗転と、信頼できないリダイレクト

報道機関にとって、ハイジャックの代償はページビューの損失だけでは測れない。信頼そのものが傷つく。障害が続くあいだ、`nytimes.com`にアクセスするすべての人は攻撃者の管理下に置かれていた。*タイムズ*の最高情報責任者マーク・フロンズは社員に対し、この障害は[「シリア電子軍、あるいはそれになりすまそうとした何者かによる、悪意ある外部攻撃の結果」](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=was%20the%20result%20of%20a%20malicious%20external%20attack)だと伝え、ドメインが新聞社の管理下を離れている間はメールの取り扱いに注意するよう警告した。

ハイジャックされたDNSレコードが実際に可能にすることを考えてほしい。攻撃者はドメインの名前解決先を制御できるため、今回のような改ざんページを表示させることができる。だが同じ手口で、巧妙な偽ログイン画面を表示したり、認証情報を収集したり、通信を傍受したりすることも可能だ。改ざんは派手で目立つ。だが*静かな*DNSハイジャックははるかに危険であり、同じ脆弱性がどちらにも悪用できる。ハフィントン・ポストUKのドメインも今回の事件に巻き込まれており、これが単一のニュースルームへのいたずらではなく、レジストラアカウントの侵害であったことを物語っている。

## 手口：新聞社ではなく、再販業者をフィッシングする

![フィッシングで盗まれた金色の鍵が、抽象的なルーティングダイヤルが並ぶ輝くコントロールルームの扉に差し込まれ、影の手が発光するアドレス台帳を書き換えている。偽のメールエンベロープが錠前に溶け込んでいく鮮やかなコンセプトアート](../../assets/the-syrian-electronic-army-nyt-hijack-02-reseller-phish.jpg)

ここで立ち止まって考えるべき点がある。SEAは*ニューヨーク・タイムズ*に侵入する必要がなかった。同紙のサーバーにもCMSにも一切触れていない。彼らが攻撃したのは、レジストラの*下に連なる*連鎖だった。

侵入口となったのは、Melbourne ITの米国拠点の再販業者に送られた**スピアフィッシングメール**だった。The Next Webが報じたとおり、[Melbourne ITは「SEAがフィッシング手法を使って再販業者のログイン情報を入手したことを確認した」](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter#:~:text=used%20phishing%20tactics%20to%20get%20hold%20of%20the%20log)——再販業者のスタッフが騙されてメール認証情報を渡してしまい、攻撃者はそのメールボックスからレジストラのログイン情報を掘り起こした。あとは単純な話だ。[「Melbourne ITの再販業者の認証情報（ユーザー名とパスワード）が、Melbourne ITシステム上の再販業者アカウントへのアクセスに使われ」](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=credentials%20of%20a%20Melbourne%20IT%20reseller)、侵入後、攻撃者は[「*タイムズ*のドメインを含む複数のドメイン名のDNSレコードを変更した」](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=changed%20the%20DNS%20records%20of%20several%20domain%20names)のだ。

TechCrunchの報告も率直だ。[「その再販業者アカウント上の複数のドメイン名のDNSレコードが変更された——`nytimes.com`を含む」](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=DNS%20records%20of%20several%20domain%20names%20on%20that%20reseller%20account%20were%20changed)。

これがレジストラチェーン攻撃を魅力的にする非対称性だ。*タイムズ*が自社インフラをいくら堅牢にしても意味がない。脆弱なアカウントは、編集局から何段階も離れたサードパーティの再販業者に属していたのだから。小さな会社の数人の社員へのスピアフィッシングで、数百万人が読む新聞のアクセスを乗っ取るのに十分だった。

## 対応と事後

Melbourne ITが状況を把握してからの復旧は比較的単純だった——そしてこれは、*レジストラを掌握している側であれば*これらの攻撃がどれだけ回復可能かを示している。同社は正しい設定を復元し、[改ざんされたDNSレコードを元に戻して「ロック」し、それ以上の変更を防いだ](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=reverted%20the%20altered%20DNS%20records)。侵害された再販業者アカウントのパスワードを変更し、ログを調査して侵入経路を追跡した。*タイムズ*は水曜日の早朝にサービスを復旧した。

しかし、この事件でもっとも教訓になる詳細は、*なぜ被害がそこで止まったのか*という点だ。同じ再販業者アカウント上のドメインのなかに、まったく影響を受けなかったものがあった——その所有者が、より強固な保護を有効にしていたからだ。Melbourne IT自身の言葉を借りれば、[「ミッションクリティカルなドメイン名については、.comを含むドメイン名レジストリが提供する追加のレジストリロック機能を活用するよう推奨している——今回標的になった再販業者アカウントのドメイン名のうち、このロック機能を有効にしていたものは影響を受けなかった」](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=For%20mission%20critical%20names%20we%20recommend%20that%20domain%20name%20owners%20take%20advantage%20of%20additional%20registry%20lock)というわけだ。

レジストリロックは、ドメインを特定の状態（[WHOIS](/ja/glossary/whois/)では`serverUpdateProhibited`といったフラグとして確認できる）に置き、より厳格なアウトオブバンドプロセスを経なければレジストリが変更を拒否する仕組みだ。ドメイン業界の観測者が当時指摘したとおり、Twitterのレコードにはまさにそのような[Verisignロックステータス](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/#:~:text=serverUpdateProhibited)が付いていた。フィッシングで盗んだ再販業者のパスワードは[レジストリロック](/ja/glossary/registry-lock/)を突破できない——そのたった一つの設定の選択が、「数時間のダウン」と「まったく影響なし」の分かれ目だった。

## レジストラ・再販業者チェーンとレジストリロックが教えること

2013年8月27日のハイジャックは、失敗の連鎖のすべての輪が可視化された、ほぼ完璧な教材だ。

1. **ドメインのセキュリティは、それを変更できる最も弱いアカウントのレベルに依存する。** それにはレジストラのスタッフや、その下の再販業者も含まれる——いずれもあなたが直接コントロールできない。*タイムズ*は自社サーバーで何も誤ったことをしていない。侵害は何段階も遠いところで起きた。
2. **フィッシングはファイアウォールを迂回する。** 高度な脆弱性は一切使われなかった。数人の再販業者社員への偽メールが、レジストラシステムが完全に正当と認める認証情報を生み出した。[「彼らは正面玄関から入ってきた。」](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door)
3. **レジストリロックこそが実際に機能した対策だった。** [追加のレジストリロック機能](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=additional%20registry%20lock%20features)を有効にしていたドメインは「影響を受けなかった」。ミッションクリティカルなドメインにとって、レジストリロック（加えてレジストラロックとレジストラアカウントへの2要素認証）はオプションの強化策ではない——これがベースラインだ。
4. **DNSの変更は強力かつ迅速だ。** ネームサーバーやAレコードを1回書き換えるだけで、ブランド全体が即座に別の場所に向く。一つの侵害されたアカウントの被害範囲は、そのアカウントが触れられるすべてのドメインに及ぶ。
5. **自分のレコードを監視せよ。** WHOISとDNSのモニタリングがあれば、不正な変更を数分で検知できる。予期しないネームサーバー変更に気づくのが早いほど、障害は小さくなる。

## Namefiの視点

![検証可能かつ改ざん耐性を持つドメイン所有権のカラフルなイラスト——グリーンのシールド、Namefiのグリーントークン、DNSの継続性によって保護されたドメインカード](../../assets/the-syrian-electronic-army-nyt-hijack-03-namefi-angle.jpg)

SEAのハイジャックは、本質的には**権限の証明**の問題だった。レジストラのシステムは、本物の所有者とフィッシングで盗んだパスワードを持つ攻撃者を区別できなかったため、設計通りに動作して変更を受け入れた。機能した防御策のすべて——レジストリロック、アウトオブバンド確認、監視体制——は結局のところ、変更要求が真に所有者から来たものであることを*証明*するためのハードルを上げる手段だ。

[Namefi](https://namefi.io)はまさにその前提から出発している。[ドメイン所有権](/ja/glossary/domain-ownership/)と管理は、**検証可能かつ改ざん耐性を持つ**べきものであり、再販業者の受信箱を漂う単一の使い回し可能なパスワードに頼るべきではない。ドメイン所有権をDNSとの互換性を保ちながら[オンチェーン](/ja/glossary/on-chain/)の暗号学的に検証可能な資産として表現することで、Namefiは「このドメインを変更する権限は誰にあるか」という問いに、暗黙の信頼ではなく、強固で監査可能な答えを与える。コントロールの変更は、ログインした誰かによる暗黙の操作ではなく、所有者に紐づいた明示的な署名済みアクションとなる——誰かがパスワードを知っていれば開けられる玄関の錠前ではなく、自分だけが鍵を持つレジストリロックに近い形で。

新聞社にとってドメインは玄関口だ。2013年8月27日の教訓は、どれほど頑丈な錠前を取り付けても、数棟離れたところにいる見知らぬ人が騙されて合鍵を渡してしまえば無意味だということだ。解決策は、所有権そのものを証明可能にすること——見知らぬ人が「正面玄関から入ってきた」と言える状況を、永遠に成立させないことだ。

## 出典・参考資料

- The Register — [New York Times, Twitter domain hijackers 'came in through front door'](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/)
- TechCrunch — [Syrian Electronic Army Apparently Hacks DNS Records Of Twitter, NYT Through Registrar Melbourne IT](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/)
- ABC News — [New York Times Website Hacked, Syrian Electronic Army Appears to Take Credit](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043)
- Christian Science Monitor — [New York Times hacked, Syrian Electronic Army takes credit](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit)
- iTnews — [Melbourne IT compromise redirects NY Times, HuffPo readers](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935)
- The Next Web — [Here's How the New York Times and Twitter Got Hacked](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter)
- Domain Name Wire — [Melbourne IT the weak link as Twitter and NY Times domain names compromised](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/)
- Wikipedia — [Syrian Electronic Army](https://en.wikipedia.org/wiki/Syrian_Electronic_Army)
- NBC News — [Syrian group hacks Twitter, New York Times](https://www.nbcnews.com/id/wbna52864470)
- Al Jazeera — [Syria hackers target New York Times website](https://www.aljazeera.com/news/2013/8/28/syria-hackers-target-new-york-times-website)
