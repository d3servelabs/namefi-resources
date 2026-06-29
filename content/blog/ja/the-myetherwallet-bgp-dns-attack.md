---
title: 'MyEtherWallet BGP・DNS攻撃：インターネットルーティングの乗っ取りで15万ドル相当のETHが流出した経緯'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 17
format: case-study
description: '2018年4月24日、攻撃者はAmazon Route 53のインターネットルーティングを乗っ取り、myetherwallet.comのDNS応答を改ざんして自己署名証明書を使ったフィッシングサイトを提供し、実際のユーザーのウォレットからおよそ15万ドル相当のEthereumを奪った。DNSがデフォルト信頼のルーティング層に依存している構造に迫る、Domain Mayday深掘り解説。'
keywords: ['myetherwallet', 'BGPハイジャック', 'DNSハイジャック', 'amazon route 53', 'route 53 ハイジャック', 'DNSセキュリティ', 'BGPルーティングセキュリティ', 'イーサリアム フィッシング', '自己署名証明書', 'eNet AS10297', 'RPKI ROA', '暗号ウォレット フィッシング', 'ドメインセキュリティ']
relatedArticles:
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-curve-finance-dns-hijack/
  - /ja/blog/the-bitcoin-org-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-dnspionage-campaign/
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

ブラウザにウェブサイトの名前を入力するとき、あなたは二つの見えないシステムが正直に機能することを信頼している。

一つ目は **DNS** — インターネットの電話帳 — で、`myetherwallet.com` のような名前を数値の[IPアドレス](/ja/glossary/ip-address/)に変換する。二つ目は **BGP**（Border Gateway Protocol）で、パケットがそのアドレスに届くまでの物理的な経路を決定する。ほとんどの人はどちらも意識しない。毎日何十億回も、静かに、当たり前のように動いている。

**2018年4月24日**の朝、その両方が同時に嘘をついた。約2時間にわたり、`myetherwallet.com` と入力してブラウザ警告を一度クリックして突き進んだ人は誰でも、本来向かうはずのサーバーとはまったく別のサーバーで動く[フィッシング](/ja/glossary/phishing/)クローンに誘導された。ルーティングが修正されるまでに、攻撃者は実際のユーザーの[ウォレット](/ja/glossary/wallet/)からおよそ**15万ドル相当の[Ethereum](/ja/glossary/ethereum/)**を奪い去っていた。

この事件がセキュリティ教材に恒久的に残る理由は、金額ではない — 暗号通貨の盗難はその後はるかに大規模になっている。問題は*メカニズム*にある。攻撃者はMyEtherWalletのサーバーに侵入したわけではない。パスワードを推測したわけでもない。彼らが攻撃したのは**建物ではなく道路**だった — インターネットのルーティング層を乗っ取ることでDNS自体に嘘をつかせたのだ。

## DNSはデフォルト信頼のルーティング層の上に乗っている

何が起きたのかを理解するには、地球上のあらゆるドメイン名の下に横たわる不安な基盤を理解しなければならない。

DNSは「`myetherwallet.com` のIPアドレスは何か？」という問いに答える。しかしDNSクエリが正しいサーバーに到達するためには、インターネットのルーターが「どのネットワークがそのDNSサーバーのIPアドレスを所有しているか」を知る必要があり、そのためにBGPに頼っている。

ここに落とし穴がある。BGPは設計上、信頼ベースのシステムだ。WikipediaにあるCloudflareスタイルの要約によれば、[デフォルトでBGPプロトコルはピアから送られたすべてのルートアナウンスを信頼するよう設計されている](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers)。セキュリティ研究者のBob Cromwellはその本来の意図をさらに率直に述べている：[BGPは、受け取った情報を盲目的に信じる善意のISPと大学の間の信頼の連鎖として設計されていた](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust)。

言い換えれば：ネットワーク事業者が「*これらの*IPアドレス宛のトラフィックは*私を通じて*来るべきだ」と世界に向けてアナウンスしたとき、インターネットの残りはそれを歴史的にそのまま信じてきた。BGPにはより詳細なルートのタイブレーカーが組み込まれており — 二つのネットワークが同じアドレスを主張した場合、*より狭い*、より詳細なブロックをアナウンスした側が勝つ。このタイブレーカーこそ、攻撃者が引いたレバーだ。

つまり、あらゆるドメインの攻撃対象領域は、その[レジストラ](/ja/glossary/registrar/)よりも、DNSプロバイダーよりも、ウェブホストよりも広い。DNSクエリを正しい場所に届けるグローバルなルーティング基盤全体が含まれる。MyEtherWalletはそれを苦い形で学んだ。

## 2018年4月24日にユーザーが失ったもの

![グロウするデータハイウェイを流れるインターネットトラフィックが、偽の迂回標識によって突然偽の道に誘導され、偽のビルに向かわされる様子の鮮やかなコンセプトアート — 光のパケットが罠に散らばっていく](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

被害はおよそ2時間の窓に集中した。The Registerによれば、悪意あるルーティングはその日の[午前11時から午後1時（UTC）の間](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC)に実行された。その間、`myetherwallet.com` にアクセスしようとした人の一部は、密かに偽物のサイトに誘導された。

偽物は巧妙だった。ほぼ完全なクローンだったため、MyEtherWalletそのものに見えた。唯一の手がかりは証明書の警告だったが — 決定的なことに、ユーザーはその警告をクリックして通過できた。通過してログインした人は、自分の資産の鍵を渡してしまった。BleepingComputerが報じたように、[ログインしたユーザーはウォレットの秘密鍵を盗まれ、攻撃者はそれを使ってアカウントを空にした](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen)。

被害額は報道媒体によって若干異なるが、核心となる数字は一致している。BleepingComputerは[取引時点で16万ドル相当の215 Ether](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000)と報じた。CyberScoopは[約15万2,000ドル相当の215 Ether](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000)と伝えた。Help Net Securityは攻撃者が[約15万ドル相当のEthereumを奪った](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum)とまとめた。ETHは同じ215枚 — ドル換算は盗難時の為替レートで変動するだけだ。

これがルーティング＋DNS攻撃が暗号ウォレットに与える冷酷な経済的現実だ。不正取引を取り消す窓口も、チャージバックも、電話できる銀行も存在しない。秘密鍵が攻撃者のクローンに入力され、資金が[オンチェーン](/ja/glossary/on-chain/)で移動されてしまえば、それで終わりだ。

## 手口：ルートを乗っ取り、応答を偽装し、クローンを提供する

![偽物の手がGPSルートを描き直し、旅人が本物の目的地が遠くで光るのを無視して偽のランドマークへと誘導されていく、乗っ取られた世界地図の鮮やかなコンセプトアート](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

この攻撃は二つの失敗を連鎖させた。どちらか一方だけでは機能しなかった。組み合わさることで壊滅的な結果をもたらした。

**ステップ1：AmazonのDNSサーバーへのルートを乗っ取る。** MyEtherWalletはAmazonのマネージドDNSサービスを使用していた。Help Net Securityが明確に述べているように、[MyEtherWallet.comはAmazonのRoute 53 DNSサービスを使用していた](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service)。攻撃者はRoute 53に侵入したわけではない。その代わり、The Registerによれば、[誰かがBGP（Border Gateway Protocol）メッセージをインターネットのコアルーターに送信し、AWSの一部のサーバー宛てのトラフィックを不正なサーバーに向けるよう説得することができた](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP)。

このアナウンスは予想外の場所から来た。The Registerは[オハイオ州のウェブホスティング企業eNetのAS10297というネットワークブロックが、AWSのIPアドレスの一部宛てのトラフィックを引き受けられると宣言した](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet)と報じた。BGPはより詳細なルートを優先し、ピアを信頼するため、偽のアナウンスは伝播した。Wikipediaはその規模を記録している：[Amazon Web Servicesの空間内のAmazon Route 53専用のIPアドレス約1,300個が、オハイオ州コロンバスのISPであるeNet（またはその顧客）によってハイジャックされた。Hurricane Electricなど複数のピアリングパートナーがそのアナウンスを盲目的に伝播させた](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space)。「盲目的に伝播」という二語が、BGPの信頼モデルの本質を言い表している。

**ステップ2：DNSサーバーになりすまして嘘をつく。** ルートが乗っ取られると、本来AmazonのDNSサーバーに届くはずのクエリが攻撃者のサーバーに着信した。そのサーバーはRoute 53になりすました。The Registerはその結果を説明している：[その不正マシンはAWSのDNSサービスとして機能し、MyEtherWallet.comの誤ったIPアドレスを返し、一部の不運なユーザーをフィッシングサイトに誘導した](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service)。KentikのDNS側からの分析も同じ事実を述べている：[偽の権威DNSサーバーはmyetherwallet.comに対して偽の応答を返し、ユーザーをMyEtherWalletウェブサイトの偽物に誘導した](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com)。

**ステップ3：ロシアからフィッシングクローンを提供する。** 改ざんされたDNS応答は、偽ウォレットをホストするロシアのサーバーにユーザーを向けた。Help Net Securityは、攻撃者がハイジャックを使って[MyEtherWallet.com宛てのトラフィックを、ロシアのサーバーにホストされた類似フィッシングサイトにリダイレクトした](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia)と報じた。

**ほぼ機能した唯一の安全装置：証明書。** ここは読者全員が立ち止まって考えるべき部分だ。攻撃者はドメインの*名前解決*と*サーバー*を制御していたが、信頼された認証局が発行した `myetherwallet.com` の有効なTLS証明書を用意することはできなかった。そのためブラウザは設計通りに動作した — 警告を表示した。Help Net Securityは正確に説明している：[フィッシングサイトが本物でないことを示す唯一のものは、サイトが使用するTLS証明書が未知の認証局によって署名されている（つまり自己署名である）という訪問者への警告だった](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication)。BleepingComputerも、注意を払っていた人には明らかなシグナルだったと同意している：[偽サイトは見分けやすかった — 攻撃者が使った自己署名TLS証明書は、すべての現代的なブラウザでエラーを引き起こしたからだ](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot)。

しかし「見分けやすい」というのは、ユーザーが立ち止まることを前提とする。ESETのWeLiveSecurityはその防御がいかに薄いものだったかを的確に捉えている：[一般ユーザーが気づける唯一の明らかな手がかりは、偽のMyEtherWalletサイトを訪問したときに、サイトが信頼できないSSL証明書を使用しているというエラーメッセージが表示されることだった](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted)。ブラウザは手を挙げて「*これはおかしい*」と言った。お金を失ったのは、それでも進んでクリックしたユーザーたちだ — 被害者は[HTTPSエラーメッセージをクリックして進まなければならなかった。偽のMyEtherWallet.comは信頼されないTLS/SSL証明書を使用していたからだ](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message)。

## 対応とその後

このハイジャックは、ルーティングを監視する専門家の目にはすぐに明らかだった。ネットワーク監視者は、偽のより詳細なプレフィックスが現れ、同じ2時間の窓の中で消えていくのを確認した。不正アナウンスが撤回されると、Route 53への正常なルーティングが戻った。

MyEtherWallet自体は、自社のインフラが侵害されていないことを強く主張した。同社が事件直後に強調したように、問題はアプリケーション層ではなくインターネットの配管にあった — これはMEWのサーバーやコードの侵害ではなく、BGPを通じて実現されたDNS解決経路の[DNSハイジャック](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking)だった。

より根本的な修正はルーティング層に着地した。この事件は**RPKI**（Resource Public Key Infrastructure）と**ROA**（Route Origin Authorization）— ネットワークがどの自律システムがどのIPプレフィックスをアナウンスすることを*許可されているか*を検証可能な方法で宣言できる暗号記録 — の最もよく引用される論拠の一つになった。有効なROAがあれば、オハイオ州のISPからの「Amazonのアドレスを引き受ける」という迷い込んだアナウンスは**RPKI-invalid**としてフラグが立てられ、[盲目的に伝播](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements)される代わりに破棄される。Kentikはその結果を直接的に指摘している：もし同じアナウンスが今日、適切に署名されたプレフィックスに対して行われたならば、[RPKI-invalidと評価されていただろう](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid)。このような攻撃の後、大規模ネットワークはまさにこのクラスのルートに対してROAの公開を加速させた。

しかしRPKIの採用はグローバルで複数年にわたるオプトイン型の取り組みだ。他の人々への教訓はより単純で即時的だった：あなたのドメインの安全性は、あなたが所有せず、見ることもできない層に依存している。

## BGPとDNSがデフォルト信頼であることが教えること

この事件は、「ドメインセキュリティ」という通常の思考モデルを逆転させるため、記憶に刻む価値がある。

多くの人はドメインセキュリティを、強力なレジストラのパスワード、二要素認証、レジストラロックと考える。それらはすべて現実的で必要なものだ — **しかしそのどれも2018年4月24日を防げなかっただろう。** 攻撃者はレジストラに触れず、MyEtherWalletのDNSレコードに触れず、サーバーに触れなかった。レコードはずっと正しいことを言い続けていた。インターネットがただ、それらを保有している場所へのクエリ配送を止めただけだ。

持続的な教訓をいくつか挙げる：

1. **あなたのドメインは借り物の信頼に乗っている。** 名前解決はBGPに依存し、BGPは[デフォルトでピアから送られたすべてのルートアナウンスを信頼するよう設計されている](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers)。完璧なDNS設定を持っていても、一層下でハイジャックされる可能性がある。

2. **DNSポイズニングはDNSに触れることなく実現できる。** DNSサーバーへのルートを乗っ取れば、権威レコードが一切変更されていなくても応答を制御できる。

3. **TLSは本物のバックストップであり、同時に脆弱なものでもある。** 証明書の警告がユーザーと完全な損失の間に立つ唯一のものだった。技術的には機能したが、行動的には失敗した。ユーザーがクリックして突き進める安全制御は、そのユーザーの注意力と同じ強度しかない。

4. **オンチェーンの最終性は安全網を取り除く。** 銀行ログインでのポイズニングは悪いことだ。暗号ウォレットでは取り返しがつかない。別の種類のサイトへの同じ攻撃は恐怖体験に留まったかもしれない；ここでは永続的な損失だった。

5. **多層防御はルーティング層を含まなければならない。** ネットワーク層でのRPKI/ROA、加えてプレフィックスの予期しないオリジンアナウンスの監視は、高価値なあらゆるシステムにとって今や当然の対策だ。

## Namefiの視点

![検証可能で改ざん耐性のあるドメイン所有権のカラフルなイラスト — グリーンのシールド、グリーンのNamefiトークン、DNS継続性によって保護されたドメインカード](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

MyEtherWallet攻撃は、ドメインが単一の「所有物」ではないことを鮮明に示している — それは信頼関係のスタックであり、どの層でも侵害される可能性がある：[レジストリ](/ja/glossary/registry/)、レジストラ、DNSプロバイダー、そしてそのプロバイダーにクエリを届けるグローバルなルーティング基盤。

[Namefi](https://namefi.io) はそのスタックの*所有権*層を検証可能で改ざん耐性のあるものにすることを中核に置いて構築されている。[トークン化ドメイン所有権](/ja/blog/what-are-tokenized-domains/)とは、ドメインの管理権を暗号的に証明し、単一プロバイダーのアカウントパスワードに依存するのではなく、監査可能な形で移転できるものを意味する — DNS互換性を保ちながら。それ単体でBGPを修正することはない；所有権層でのいかなるものもインターネットがパケットをルーティングする方法を書き換えない。しかし、この事件が露わにした同じ根本的な病に取り組んでいる：**あまりにも多くの重要なインターネットの信頼が暗黙的で、検証不可能で、正しいメッセージを偽造できる者によって覆せる。**

ドメインセキュリティの未来は、一つの強力なパスワードよりも、あらゆる層での暗号的証明に近づいていく — 検証可能な所有権、検証可能なルーティング（RPKI）、検証可能なアイデンティティ（TLS）。MyEtherWalletのユーザーはその層と層の隙間でお金を失った。その隙間を、一つの検証可能な層ずつ埋めていくことが、全体のプロジェクトだ。

2018年4月24日、ドメインレコードは一度も間違ったことを言わなかった。インターネットがただ、それらへの到達方法についての嘘を信じた。「誰が何を所有し、どうすれば到達できるか」を仮定ではなく証明可能にすること — それが、次の偽造アナウンスが従われる代わりに破棄されるようにする方法だ。

## 情報源と参考資料

- The Register — [Cryptocurrency thieves snatch ~$150k after BGP hijack reroutes MyEtherWallet DNS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [Hacker Hijacks DNS Server of MyEtherWallet to Steal $160,000](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [MyEtherWallet users robbed after successful DNS hijacking attack](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [Amazon DNS service server hijacked for $152,000 Ether theft](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Ethereum cryptocurrency wallets raided after Amazon's internet domain service hijacked](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [What can be learned from recent BGP hijacks targeting cryptocurrency services?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [BGP hijacking](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [BGP Hijacking](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [How Was MEW (MyEtherWallet) DNS Spoofed?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [Hackers Hijacked DNS Servers to Steal from MyEtherWallet Users](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)
