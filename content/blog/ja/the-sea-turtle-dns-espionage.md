---
title: 'Sea Turtle：DNSをハイジャックして各国政府を諜報した国家支援型サイバー作戦'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 20
format: case-study
description: '2019年にCisco Talosが公開した国家支援型作戦「Sea Turtle」がいかにしてレジストラ・レジストリ・DNSプロバイダーを侵害してDNSをハイジャックし、政府機関・省庁・エネルギー企業のトラフィックを攻撃者のサーバーに誘導し、正規証明書を偽造し、国別TLDのレジストリにまで侵入したかを解説する。'
keywords: ['Sea Turtle DNSハイジャック', 'Cisco Talos Sea Turtle', 'DNSハイジャック攻撃', '国家支援型DNS攻撃', 'レジストリ侵害', 'レジストラ侵害', 'DNS諜報キャンペーン', 'Let''s Encrypt 中間者攻撃 証明書', 'Netnod侵害', 'ICS-FORTH ギリシャ ccTLD', 'CISA緊急指令19-01', 'DNSセキュリティ', 'ドメイン所有権セキュリティ', '国家サイバー攻撃']
relatedArticles:
  - /ja/blog/the-dnspionage-campaign/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/registrar/
  - /ja/glossary/tld/
  - /ja/glossary/icann/
  - /ja/glossary/registry/
---

ほとんどのサイバー攻撃は、標的の内部に*侵入*しようとする。しかしSea Turtle作戦が行ったのは、もっと静かで、はるかに危険なことだった。それは、インターネット全体に対して標的の所在を告げる**地図そのもの**を書き換えることだった。

政府省庁のウェブアドレスをブラウザに入力するとき、あるいはそこの職員にメールを送るとき、あなたのコンピューターはまず[Domain Name System](/ja/glossary/dns/)――DNS――に問い合わせ、人間が読めるその名前を適切なサーバーの数値アドレスに変換してもらう。この名前解決はインターネットのほぼあらゆる基盤となっているため、正しく解決されているかどうかを独立して検証する仕組みは存在しない。私たちはただ、その名前が本来のサーバーに解決されると信じているだけだ。Sea Turtleの攻撃者はその「信頼」を完全に理解しており、2年以上にわたって中東・北アフリカ各国の政府を諜報するためにそれを悪用し続けた。

2019年4月にCisco Talosが公開したSea Turtleは、DNS自体が国家諜報活動の道具として武器化された事例として、現在入手できる中でも最も明確なケーススタディの一つである。攻撃者は個々の従業員をフィッシングして運に任せるのではなく、標的の*上位*に位置する[レジストラ](/ja/glossary/registrar/)、レジストリ、DNSプロバイダー――つまり名前の解決を制御する機関――を標的にした。その制高点から、組織全体のトラフィックを迂回させ、認証情報を収集し、なりすましを本来は不可能にするはずの暗号証明書を偽造したのである。

## 国家諜報活動の標的としてのDNS

DNSはよく「インターネットの電話帳」と表現されるが、それでは実態を過小評価している。より正確には郵便の配送システムに近い。メール一通、ログイン一回、APIコール一つ、すべてが名前の解決から始まる。解決先を制御できれば、宛先を制御できる――そして、双方が非公開かつ直接やり取りしていると信じている会話の真ん中に、気づかれることなく座ることができる。

これがDNSをほぼ完璧な諜報標的にする理由だ。DNSプロバイダー1社を侵害するだけで、そこに依存するあらゆる組織のトラフィックを露出させることができる。そしてエンドポイントのマルウェアと違い、DNS操作は被害者自身のマシンには一切触れない。スキャンするものも、隔離するものも何もない。レコードが単に別の場所を指すようになるだけだ。

Talosはそのメカニズムについて率直に述べている。同社のレポートによれば、[DNSハイジャックとは、攻撃者がDNSのネームレコードを不正に書き換え、標的の正規ユーザーを攻撃者が管理するサーバーに誘導することで発生する](https://blog.talosintelligence.com/seaturtle/#:~:text=DNS%20hijacking%20occurs%20when%20the%20actor%20can%20illicitly%20modify%20DNS%20name%20records%20to%20point%20users%20to%20actor%2Dcontrolled%20servers)。説明はシンプルだが、実害は壊滅的だ。

## Sea Turtle作戦（2017〜2019年）

![影のような国家の脅威アクターが亀のシルエットとして描かれ、様式化された地域地図上で輝く矢印を静かに迂回させ、ネオンのネットワーク回線が隠しサーバーへと曲がっていく、鮮やかなコンセプトアート](../../assets/the-sea-turtle-dns-espionage-01-campaign.jpg)

Sea Turtleはひったくり的な攻撃ではなかった。Talosは[この進行中の作戦は早ければ2017年1月に開始し、2019年第1四半期まで継続していたと見られる](https://blog.talosintelligence.com/seaturtle/#:~:text=The%20ongoing%20operation%20likely%20began%20as%20early%20as%20January%202017%20and%20has%20continued%20through%20the%20first%20quarter%20of%202019)と評価しており、2年以上にわたる忍耐強く持続的な作戦だった。

その期間にTalosが集計した結果、[このキャンペーンでは13か国にわたる少なくとも40の異なる組織が侵害された](https://blog.talosintelligence.com/seaturtle/#:~:text=at%20least%2040%20different%20organizations%20across%2013%20different%20countries%20were%20compromised%20during%20this%20campaign)。TechCrunchはその範囲をこう要約している。このグループは[13か国の政府・情報機関・通信会社・大手インターネット企業40組織を2年以上にわたって標的にした](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)とされ、被害組織は[アルメニア、エジプト、トルコ、スウェーデン、ヨルダン、アラブ首長国連邦など](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)の各国で確認された。

Talosは作戦を特定の政府に公式に帰属させることは避けたが、攻撃者のレベルについては確信を持っていた。Cisco TalosのCraig WilliamsはTechCrunchに対し、[これまでに見られない比較的独自の手法で活動する新しいグループであり、新しい戦術・技術・手順を用いている](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)と語り、同チームはこのグループの[主な動機が諜報活動の実施にある](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)と評価している。

## 誰が標的にされたか、何が危険にさらされたか

被害者リストは、情報収集上のウィッシュリストそのものだ。Talosが特定した主な標的は[国家安全保障組織、外務省、有力エネルギー企業](https://blog.talosintelligence.com/seaturtle/#:~:text=national%20security%20organizations%2C%20ministries%20of%20foreign%20affairs%2C%20and%20prominent%20energy%20organizations)――敵対する国家が最も内部通信を読みたがるであろう機関そのものだ。

二次的な被害者の顔ぶれは、ある意味でさらに示唆に富んでいた。Talosは攻撃者が[多数のDNSレジストラ、通信会社、インターネットサービスプロバイダー](https://blog.talosintelligence.com/seaturtle/#:~:text=numerous%20DNS%20registrars%2C%20telecommunication%20companies%2C%20and%20internet%20service%20providers)も攻撃していたことを明らかにした。これらは最終的な獲物ではなく、*手段*だった。インフラプロバイダーを掌握することで、攻撃者は下流の真の標的に対してDNSを操作するためのレバレッジを手に入れたのである。

BleepingComputerの要約は核心をついている。主要な標的は[外務省、軍事組織、情報機関、エネルギー企業](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)だった。外国省庁のメールとログイントラフィックを静かに傍受できれば、暗号化を破る必要はない――認証情報を収集し、メールが流れるのをそのまま読めばいいのだ。

## 攻撃の仕組み：信頼の連鎖を乗っ取る

![男性型の中間者が光り輝く政府公文書の流れを傍受し、それぞれに偽の緑色の印鑑を押してから転送する様子と、亀裂の入ったパイプラインを挟んで向き合う2つの南京錠を描いた、鮮やかなコンセプトアート](../../assets/the-sea-turtle-dns-espionage-02-registry-compromise.jpg)

Sea Turtleが際立って高度だった理由はここにある。攻撃者はほとんどの場合、標的に直接向かわなかった。代わりに、信頼の連鎖を上へと登っていった。

TalosとそれとOを独立した報道が再構成したパターンはおおよそ次のとおりだ。まず、DNSプロバイダー、レジストラ、または[レジストリ](/ja/glossary/registry/)に足がかりを得る――主にスピアフィッシングまたは既知の脆弱性の悪用による。そのアクセスを使って、[標的の正規ユーザーが攻撃者管理サーバーに誘導されるようDNSレコードを書き換える](https://blog.talosintelligence.com/seaturtle/#:~:text=Modified%20DNS%20records%20to%20point%20legitimate%20users%20of%20the%20target%20to%20actor%2Dcontrolled%20servers)。それらのサーバーは中間者（MitM）レイヤーとして設定された。BleepingComputerによると、[Sea Turtleのオペレーターは、ログイン認証情報を窃取する目的で、被害者が利用する正規サービスになりすますMitMフレームワークを構築した](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)。被害者は通常のメールサービスやVPNポータルとまったく同じに見える偽のサイトにログインし、攻撃者は[これらの攻撃者管理サーバーにユーザーがアクセスした際に正規の認証情報を取得](https://blog.talosintelligence.com/seaturtle/#:~:text=Captured%20legitimate%20user%20credentials%20when%20users%20interacted%20with%20these%20actor%2Dcontrolled%20servers)し、何も問題がないように見せながら本物のサービスに静かに転送した。

最も巧妙で、最も衝撃的だったのが南京錠（証明書）を無力化した方法だ。トラフィックを迂回させることと、ブラウザの証明書警告を出さずにそれをやり遂げることは別の話だ。Sea Turtleはなりすます対象ドメインの正規かつ有効な証明書を取得することでこれを解決した。Talosは攻撃者が[同一ドメインに対して認証局署名のX.509証明書を別のプロバイダーから取得](https://blog.talosintelligence.com/seaturtle/#:~:text=obtained%20a%20certificate%20authority%2Dsigned%20X.509%20certificate)しており、[これらの攻撃者はMitMサーバーにLet's Encrypt、Comodo、Sectigo、自己署名証明書を使用している](https://blog.talosintelligence.com/seaturtle/#:~:text=use%20Let%27s%20Encrypts%2C%20Comodo%2C%20Sectigo%2C%20and%20self%2Dsigned%20certificates)ことを確認した。DNSレコードを制御していたため、無料の認証局が依拠する自動ドメイン検証チェックを通過でき、所有していないドメインに対して正規の緑色の南京錠を手に入れることができたのだ。

Brian Krebsは密接に関連する前段階の波を文書化し、同じ手口を描写している。攻撃者は[これらのドメインのDNSレコードを書き換え、自分たちが管理するヨーロッパのサーバーを向くようにした](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)と見られ、その後[SSLプロバイダーのComodoおよび/またはLet's EncryptからそれらのドメインのSSL証明書を取得できた](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)。引用された被害者の一つとして、[アラブ首長国連邦の政府機関のメールを処理するmail.gov.ae](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)が挙げられていた。

### レジストリの侵害

この作戦の最高水準を示すのが、DNSを単に*利用する*のではなく、国全体のDNSを*運営する*組織の侵害だった。

最初に公式に確認された事例はスウェーデンのNetnodに関するものだ。Krebsが報じたところによると、攻撃者は[Netnodのドメイン名レジストラのアカウントにアクセスした](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)とされ、Netnod自身も[1月2日に攻撃における自社の役割を知った](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)と表明した。重要なのは、Netnodが最終目的地ではなく、入口に過ぎなかったことだ。BleepingComputerはNetnodが[自分たちは攻撃の標的ではなく、攻撃者が「インターネットサービスのログイン情報を取得する」ための経路だった](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)と述べたことを指摘している。

Talosはより広い意義を率直な言葉で述べた。オペレーターたちは[ルートサーバーゾーンを管理する組織に対する、公式に確認された最初の事例の実行者だった](https://blog.talosintelligence.com/seaturtle/#:~:text=responsible%20for%20the%20first%20publicly%20confirmed%20case%20against%20an%20organizations%20that%20manages%20a%20root%20server%20zone)。インターネットの中核的アドレス帳の一部を運営する人々が静かになりすまされる可能性があるなら、DNSはデフォルトで信頼できるという前提は成立しなくなる。

## 対応とその後：彼らは止まらなかった

これほどの規模の[DNSハイジャック](/ja/glossary/dns-hijacking/)には公式の対応が伴った。2019年1月、米国サイバーセキュリティ・インフラストラクチャセキュリティ庁（CISA）は[緊急指令19-01「DNSインフラへの改ざんの緩和」](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)を発出した。これはCISAが初めて発した緊急指令であり、連邦機関に対してDNSレコードの監査、DNS管理アカウントの認証情報変更、それらのアカウントへの多要素認証の有効化を命じた。DNS管理が国家安全保障の最前線となったことの暗黙の承認だった。

しかしSea Turtleについて最も印象的なのは、公開された*後*に何が起きたかだ。通常、Talosのようなベンダーが手口を公開すれば、ほとんどのキャンペーンは沈黙する。Sea Turtleはその逆をやった。

2019年7月のフォローアップレポートでTalosは、このグループが新たな被害者を発見したと報告した。その中には[ccTLDレジストリ、すなわち特定の国コードを使用するすべてのドメインのDNSレコードを管理する機関](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=a%20country%20code%20top%2Dlevel%20domain%20%28ccTLD%29%20registry)が含まれていた。具体的には、[ギリシャのccTLDを管理するThe Institute of Computer Science of the Foundation for Research and Technology - Hellas（ICS-Forth）](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=The%20Institute%20of%20Computer%20Science%20of%20the%20Foundation%20for%20Research%20and%20Technology%20%2D%20Hellas%20%28ICS%2DForth%29%2C%20the%20ccTLD%20for%20Greece)――`.gr`名前空間を運営する機関――が侵害されていた。SecurityWeekは、ICS-Forthが侵害を公式に認めた後も、[Ciscoのテレメトリが侵害がさらに少なくとも5日間継続したことを確認した](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)と指摘した。

Talosによるこのグループへの評価は異例なほど率直だった。[このグループは異例なほど大胆であり、今後も抑止される見込みはほぼない](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=this%20group%20appears%20to%20be%20unusually%20brazen%2C%20and%20will%20be%20unlikely%20to%20be%20deterred%20going%20forward)。その評価は正しかった。Sea Turtleは一過性の事件ではなく、DNSレイヤーでの諜報活動が機能することの実証であり、実行者たちが公衆の目の前でも活動を継続する意思を持っていることの証明だった。

## DNSが重要インフラであることが教えること

地政学的文脈を取り除いても、Sea Turtleはインターネットの命名レイヤーの実際の動作についていくつかの不快な教訓を残している。

1. **DNSは信頼の連鎖であり、その全体をあなたは制御していない。** あなた自身のセキュリティは万全かもしれない。しかしドメインの解決はレジストラとレジストリを経由しており、どちらかが侵害されれば、あなたのネットワークに一切触れることなくレコードが書き換えられる可能性がある。Sea Turtleは、攻撃者が意図的に最も見通しが利かない連鎖の環を標的にすることを証明した。

2. **有効な証明書は正規の宛先の証明ではない。** 緑色の南京錠が証明するのは、「現時点でそのドメインを制御している者」への暗号化通信だ――攻撃者がDNSをハイジャックしていれば、その者は攻撃者だ。ドメイン検証型証明書は、検証の根拠となるDNS自体と同程度にしか信頼できない。

3. **DNS操作は被害者にはほぼ見えない。** 被害者のマシン上でマルウェアは動作しない。エンドポイントスキャナーは何も検出しない。唯一のシグナルは、レコードが本来とは異なる場所を指していることだ――だからこそ、DNSレコードの予期しない変更を監視し、それを固定することが非常に重要なのだ。

4. **レジストラおよびレジストリのアカウントセキュリティは国家安全保障のインフラだ。** CISAが初めて発した緊急指令は、本質的にはDNS管理アカウントの認証情報に関するものだった。多要素認証、レジストリロック、DNSレコードを変更できるアカウントへの厳格なアクセス管理は、セキュリティの「あったらいい」機能ではない――ドメインを本当に所有することと、単に所有しているように見えることの差を生む、決定的な要素だ。

## Namefiの視点

![検証可能で改ざん耐性のあるドメイン所有権のカラフルなイラスト――緑のシールドで守られたドメインカード、緑のNamefiトークン、DNS継続性](../../assets/the-sea-turtle-dns-espionage-03-namefi-angle.jpg)

Sea Turtleは根本的には*誰がドメインのレコードを変更することを許可されているか*という問題であり、その権限が密かに奪われたとき、残りの世界がそれをどれほど判別しにくいかという話でもある。

従来のモデルでは、その権限はレジストラとレジストリのアカウントに集中しており、あまりにも多くの場合、保護されているのはパスワードとメールアドレスだけだ。それらのアカウントが陥落すれば、ドメインの制御も静かに失われる。誰が正当にその名前を保有しているかについての、独立して検証可能な記録は存在せず、制御が移転するときの改ざん証跡も存在しない。

[Namefi](https://namefi.io)は[ドメイン所有権](/ja/glossary/domain-ownership/)を、DNSとの互換性を維持しながらも、**設計上、検証可能で改ざん耐性を持つ**ものとして扱う。所有権をトークン化することで、誰がドメインを管理しているかについての監査可能で暗号的に固定された記録が生まれ、不正な移転や静かな乗っ取りを明白な痕跡なしに実行することをはるかに難しくする。それ単体では、レジストリがフィッシングされるのを防ぐわけではない。しかしSea Turtleが強調するより広い教訓は、Namefiが構築されている原則そのものだ――ドメインは重要インフラであり、*この名前を本当に所有しているのは誰か*という問いは、「コントロールパネルにログインできる者」という答えよりも強固な根拠を必要としている。

この作戦は、ドメインを*保有すること*と*保有していることを証明すること*の間のギャップを突いて、政府機関のトラフィックを迂回させた。そのギャップを閉じること――所有権を検証可能にし、移転を監査可能にし、制御の継続性を証明可能にすること――こそが、命名レイヤーがいまだに必要としている回復力のあり方だ。

## 出典・参考文献

- Cisco Talos — [DNS Hijacking Abuses Trust In Core Internet Service](https://blog.talosintelligence.com/seaturtle/)
- Cisco Talos — [Sea Turtle keeps on swimming, finds new victims, DNS hijacking techniques](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/)
- TechCrunch — [A new state-backed hacker group is hijacking government domains at a phenomenal pace](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)
- BleepingComputer — ['Sea Turtle' Campaign Focuses on DNS Hijacking to Compromise Targets](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)
- SecurityWeek — [Sea Turtle's DNS Hijacking Continues Despite Exposure](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)
- BankInfoSecurity — ['Sea Turtle' DNS Hijacking Group Conducts Espionage: Report](https://www.bankinfosecurity.com/sea-turtle-dns-hijacking-group-conducts-espionage-report-a-12390)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)
- SDxCentral — [Cisco Talos Says a Nation State Is Behind Sea Turtle DNS Hijacking Attacks](https://www.sdxcentral.com/articles/news/cisco-talos-says-a-nation-state-is-behind-sea-turtle-dns-hijacking-attacks/2019/04/)
- SecurityWeek — [State-Sponsored Hackers Use Sophisticated DNS Hijacking in Ongoing Attacks](https://www.securityweek.com/state-sponsored-hackers-use-sophisticated-dns-hijacking-ongoing-attacks/)
