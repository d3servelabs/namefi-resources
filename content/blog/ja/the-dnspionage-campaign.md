---
title: 'DNSpionage：DNSを武器に政府を標的にしたサイバー諜報作戦'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 10
format: case-study
description: '2018年末、Cisco Talosはイラン系の関与が指摘されるサイバー諜報作戦「DNSpionage」を公表した。この作戦は政府のDNSレコードを書き換え、メールおよびVPNトラフィックを攻撃者のサーバーへ迂回させ、正規のTLS証明書を取得することで痕跡を消した。米国政府が初めて発令した種類の緊急指令の引き金ともなった事案である。'
keywords: ['DNSpionage', 'DNSハイジャック', 'DNSリダイレクト', 'Cisco Talos', 'CISA緊急指令19-01', 'Sea Turtle DNS', 'イランDNSハイジャック', 'FireEye DNSハイジャック', 'Let''s Encrypt証明書悪用', 'DNSセキュリティ', 'ドメインセキュリティ', '国家サイバー諜報', 'DNSインフラ改ざん対策']
relatedArticles:
  - /ja/blog/the-sea-turtle-dns-espionage/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/the-badgerdao-frontend-attack/
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
  - /ja/glossary/registry/
---

ドメインに関わる大半のインシデントは、名前の「所有者」が誰かという問題だ。しかしこの事案は、名前を「支配する」のが誰かという問題だった――そして2018年末の数ヶ月間、中東各地の政府ドメインに対するその答えは、当該政府自身ではなかった。

Webサーバーへの侵入はなかった。ホームページへのマルウェア埋め込みもなかった。改ざんも、身代金要求のメッセージも、アプリケーションログに残る証拠も何もなかった。攻撃者は建物に侵入する必要すらなかった。彼らが通ったのは、ほぼ誰も守っていない唯一の扉――ドメインのメールやWebサイトが実際にどこに存在するかを記述した**DNSレコード**だった。攻撃者はそのレコードを、正規の認証情報と正規のTLS証明書を使い、ひっそりと書き換えた。世界中のトラフィックは、何の抵抗もなく新しい経路へと従った。

Cisco TalosはこれをDNSpionageと命名した。[ドメインネームシステム（DNS）](/ja/glossary/dns/)が単なるインフラではなく、国家安全保障上の基幹設備であることを示す、記録上最も明確な事例のひとつである。

## 国家戦略の道具としてのDNS

DNSpionageが各国政府を動揺させた理由を理解するには、DNSが実際に何をしているかを改めて押さえる必要がある。

官庁にメールを送るとき、企業VPNにログインするとき、Webメールのページを開くとき――あなたのデバイスはまずDNSに問い合わせる。「この名前の[IPアドレス](/ja/glossary/ip-address/)は何か？」と。DNSが返した答えを、デバイスは無条件に信頼する。メールクライアントはそこへ接続し、VPNはそこで認証し、ブラウザはそこでセッション情報を渡す。DNSはインターネット全体のアドレス帳であり、そのアドレス帳が改ざんされていないかを検証する仕組みはほぼ存在しない。

DNSpionageが突いたのはまさにこの性質だった。暗号化を破る必要も、パスワードファイルを解読する必要もない。ただ「ポインタ」を変えるだけで、標的とそのサービスの間に透明な形で割り込むことができる。メールも通る。VPNのログイン情報も通る。そして被害者自身のドメイン名がブラウザのアドレスバーに表示され続けるため、何もおかしく見えない。

これはアプリケーションより下の層で行われるスパイ活動だ。しかも不都合なことに、ほとんどのセキュリティプログラムが「解決済みの問題」として扱っている層である。

## DNSpionage作戦（2018〜2019年）

![国家の交換台の下に隠された傍受室のコンセプトイラスト。影の操作者が偽の公印と光るデータケーブルを使い、一国のメールを秘密の傍受拠点へと静かに迂回させている](../../assets/the-dnspionage-campaign-01-campaign.jpg)

**2018年11月27日**、Cisco Talosは最初のレポートを公開した。冒頭はこう記されていた。「[Cisco Talosはレバノンおよびアラブ首長国連邦（UAE）の.govドメイン、ならびにレバノンの民間航空会社を標的にした新たなキャンペーンを最近発見した](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Cisco%20Talos%20recently%20discovered%20a%20new%20campaign%20targeting%20Lebanon%20and%20the%20United%20Arab%20Emirates)」

この作戦には二つの顔があった。ひとつはごく普通のマルウェア作戦だ。「[このキャンペーンでは、悪意あるMicrosoft Officeドキュメントに埋め込まれたマクロを通じてターゲットを侵害するために、求人情報を装った偽の悪意あるWebサイトが2つ使われた](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=This%20particular%20campaign%20utilizes%20two%20fake%2C%20malicious%20websites%20containing%20job%20postings)」。囮サイトは実在する採用企業になりすまし――「[hr-wipro[.]com（wipro.comへのリダイレクト付き）とhr-suncor[.]com（suncor.comへのリダイレクト付き）](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=hr%2Dwipro)」――特徴的なことに、DNS自体を通じてコマンドサーバーと通信できるカスタムのリモートアクセスツールを被害者の端末に仕込んだ。

しかし歴史に名を刻んだのは、もうひとつの顔だった。Talosの言葉を借りれば、「[別のキャンペーンでは、攻撃者は同一のIPアドレスを使って正規の.govドメインおよび民間企業ドメインのDNSをリダイレクトした](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=the%20attackers%20used%20the%20same%20IP%20to%20redirect%20the%20DNS%20of%20legitimate)」。実際の政府ネームサーバーが、攻撃者の管理下にあるマシンへ向け替えられていた。「[レバノンおよびUAEの公共部門に属する複数のネームサーバー、ならびにレバノン国内の一部企業のネームサーバーが侵害されており、それらの管理下にあるホスト名が攻撃者管理のIPアドレスに向け替えられていた](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Multiple%20nameservers%20belonging%20to%20the%20public%20sector)」

偽の求人サイトは、通常のサイバー犯罪に見えた。DNSリダイレクトは、国家の諜報活動に見えた。

独立した研究者たちがこの糸を手繰り寄せた頃には、被害の規模は2ヶ国にとどまらなかった。Brian Krebsは攻撃者のIPアドレスを逆引きし、「[2018年末の数ヶ月間で、DNSpionageの背後にいるハッカーたちは中東の50社以上の企業・政府機関のDNSインフラの主要コンポーネントを侵害することに成功した](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=in%20the%20last%20few%20months%20of%202018%20the%20hackers%20behind%20DNSpionage%20succeeded)」と報告した。

## 標的と賭けられたもの

被害者リストは、ある地域の神経系の地図のように読める。外務省、民間航空局、通信キャリア、インターネットインフラ、国家財務省のWebメール。これらは無差別に選ばれた標的ではない。国家の機密が電線を通り過ぎる場所だ。

Talosの最初のレポートから2ヶ月後、FireEye（現Mandiant）は独自の分析を公表し、慎重ながらも帰属を明示した。FireEyeは「[初期の調査では、関与した攻撃者がイランとつながりを持つことが示唆される](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/#:~:text=initial%20research%20suggests%20the%20actor%20or%20actors%20responsible%20have%20a%20nexus%20to%20Iran)」と述べた。SecurityWeekはFireEyeの調査を伝え、同社が技術的証拠とこの作戦がイラン政府の利益に沿うという事実に基づき、「[中程度の確信](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=moderate%20confidence)」をもってイランが背後にあると評価したと報じた。

標的から、賭けられたものは直接読み取れる。外務省のメールを平文で読むことができれば、それはデータの窃取ではなく、ほぼリアルタイムで政府の思考を読むことに等しい。DNS層での認証情報収集が、詐欺ではなく国家に対する情報収集として正しく理解される理由がここにある。

## 手口：DNSレコード＋正規証明書＋偽求人サイト

![国家の郵便交換台が静かに改ざんされるコンセプトイラスト。巨大なルーティングウォールでアドレスカードが差し替えられ、迂回した回線が偽の緑色の南京錠を通過して秘密の傍受ブースへと向かっている](../../assets/the-dnspionage-campaign-02-dns-redirection.jpg)

ここで立ち止まって考える価値がある。この手口は最悪の意味でエレガントだった。攻撃は三つの動作から成っていた。

**第一手：アドレス帳の鍵を手に入れる。** 攻撃者はDNS暗号を破ったのではなく、ログインした。FireEyeは二つの経路を説明している。「[ひとつの方法は、侵害した認証情報を使ってDNSプロバイダーの管理インターフェースにログインし、メールトラフィックを傍受するためにDNS Aレコードを変更すること。もうひとつは、被害者のドメイン[レジストラ](/ja/glossary/registrar/)アカウントをハックしてDNS NSレコードを変更することだ](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=One%20method%20involves%20logging%20into%20a%20DNS%20provider)」。盗まれたレジストラおよびDNSホストの認証情報がマスターキーとなった。レジストラのログイン情報を持つ者がドメインを持ち、ドメインに紐づくすべてを掌握する。

**第二手：正常に見えるようにトラフィックを迂回させる。** 政府のメールサーバーを自分のIPに向け替えれば、通常はサービスが停止して警報が鳴る。そこで攻撃者はプロキシを使った。トラフィックは傍受された後、実際の宛先へ中継されたため、利用者には機能しているメールボックスと機能しているVPNが見えていた。FireEyeが説明した第三のバリアントによれば、「[ユーザーは攻撃者の管理するインフラへリダイレクトされた](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=users%20were%20redirected%20to%20attacker%2Dcontrolled%20infrastructure)」。傍受は中間者として静かに転送するものであり、何も失敗していないように見えたがゆえに不可視だった。

**第三手：緑の南京錠を突破する。** 現代のサービスはTLSを使用しており、トラフィックが見知らぬサーバーに届いた瞬間に証明書の警告が表示されるはずだ。攻撃者はその穴を自前の正規証明書を発行することで塞いだ。Talosは、「[DNS侵害のたびに、攻撃者はリダイレクトしたドメインに対してLet's Encrypt証明書を慎重に生成していた](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=During%20each%20DNS%20compromise%2C%20the%20actor%20carefully%20generated)」と報告した。ドメインのDNSを支配していたため、認証局に対してドメインの管理権を「証明」できた。自動化されたドメイン認証は、攻撃者に正規の証明書を発行した。FireEyeも同じパターンを確認している。「[いずれの手法においても、攻撃者は疑惑を招かないようにLet's Encrypt証明書を使用した](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=in%20both%20cases%20the%20attackers%20used%20Let%E2%80%99s%20Encrypt%20certificates)」

Krebsが総括したとおり、結果は完全なものだった。「[これらのDNSハイジャックは、攻撃者が標的ドメイン（例：webmail.finance.gov.lb）のSSL暗号化証明書を入手する道も開いた。それにより傍受したメールとVPN認証情報を復号し、平文で閲覧することができた](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=these%20DNS%20hijacks%20also%20paved%20the%20way%20for%20the%20attackers%20to%20obtain%20SSL%20encryption%20certificates)」。メールとVPNのログイン情報は傍受・解読され、その間中、有効な南京錠のアイコンが表示されていた。

何が不要だったかに注目してほしい。ゼロデイ脆弱性は不要だった。被害者自身のサーバーへのマルウェアも不要だった。ファイアウォールの突破も不要だった。攻撃は「私はこのドメインを所有している」と「現在誰がそのレコードを管理しているかを証明できる」という二点の間に存在するギャップの中だけで完結した。そのギャップの中にDNSpionageは棲んでいた――そしてそのギャップは、多くの組織が想定するより遥かに広い。

## 対応：CISA緊急指令19-01

TalosとFireEyeの相次ぐ開示はワシントンに強い衝撃を与えた。**2019年1月22日**、米国サイバーセキュリティ・インフラセキュリティ庁（CISA）は**緊急指令19-01「DNSインフラ改ざんの緩和（Mitigate DNS Infrastructure Tampering）」**を発令した。CISAが初めて発令したこの種の緊急指令であり、米国連邦政府の民間機関全体を拘束する異例の命令だった。

指令の診断は研究報告と完全に一致していた。当時の報道が引用したように、CISAは「[攻撃者がWebおよびメールのトラフィックをリダイレクト・傍受しており、他のネットワークサービスに対しても同様のことが可能だ](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=redirected%20and%20intercepted%20web%20and%20mail%20traffic)」と警告し、攻撃者が「[政府DNSドメインを管理する管理者のアカウントを侵害した](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=compromised%20the%20accounts%20of%20administrators)」とした。

そして10日以内に4つの措置を命じた――攻撃者の三つの動作それぞれへの直接的な反論として読むことができる。

1. **DNSレコードの監査** ――権威ネームサーバーおよびセカンダリサーバーで改ざんがないか確認する。
2. **DNSアカウントのパスワード変更** ――DNSを編集できるすべての認証情報をローテーションする。
3. **すべてのDNS管理者アカウントへの多要素認証の追加** ――パスワードの盗難だけではマスターキーにならないようにする。
4. **証明書透明性ログの監視** ――自分が要求していない証明書が自組織のドメインに対して発行されていないか監視する。

4番目の項目が本質を突いている。CISAは機関に扉を施錠するよう命じただけでなく、既に誰かがそのコピーキーを使った証拠を公開の証明書台帳で監視するよう命じた。DNSpionageは証明書透明性（Certificate Transparency）を、ニッチなPKI機能から国家的な[DNSハイジャック](/ja/glossary/dns-hijacking/)の最前線の検知ツールへと変えた。

Krebsはこの瞬間の異例さを簡潔に表した。「[米国国土安全保障省は、すべての米国連邦民間機関にインターネットドメインレコードのログイン認証情報を保護するよう命じる異例の緊急指令を発令した](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=issued%20a%20rare%20emergency%20directive%20ordering%20all%20U.S.%20federal%20civilian%20agencies)」

緊急指令の引き金を引いたのはDNSpionageだけではなかった。TalosがSea Turtleと呼んだ並行するさらに大規模な作戦は、「[サイバー諜報活動のために侵害されたドメイン名レジストリ組織の最初の既知事例](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=first%20known%20case%20of%20a%20domain%20name%20registry%20organization%20that%20was%20compromised)」として、「[13ヶ国にまたがる約40の組織](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=approximately%2040%20different%20organizations%20across%2013%20different%20countries)」を標的にし、事態をさらに深刻化させた。Talosは両者を慎重に区別し、2019年4月のフォローアップレポートでDNSpionageの挙動は「[Sea Turtleのようなより懸念すべきキャンペーンとのこの攻撃者の区別を今後も維持する可能性が高い](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/#:~:text=will%20likely%20continue%20to%20distinguish%20this%20actor%20from%20more%20concerning%20campaigns%20like%20Sea%20Turtle)」と指摘した。二つの作戦は異なる角度から同じ点を示した。DNSサプライチェーンは国家間対立の舞台となっていた。

## DNSが国家安全保障インフラであることの教訓

DNSpionageにはマルウェアドラマが少なく、不快な教訓が多い。押さえておくべきものをいくつか挙げる。

- **レジストラアカウントは王冠の宝石だ。** ドメインの下流にあるすべて――メール、Web、VPN、シングルサインオン、証明書発行――はDNSを編集できる者の信頼を継承する。そのアカウントに第二要素なしでパスワードのみという状態は小さなギャップではなく、城門を開けっ放しにしたままの城全体だ。CISAの最初の指示がファイアウォールではなく「認証情報」についてだったのは、まさにこの理由による。
- **有効な証明書は正当性の証明ではない。** 緑の南京錠が証明するのは、「現時点でドメインを管理している者」に対してトラフィックが暗号化されているということだけだ。攻撃者がDNSを支配していれば、自動化されたドメイン認証は喜んで正規の証明書を発行する。TLSへの信頼はDNSへの信頼から借用されており、DNSは多くの人が想定するより脆弱だ。
- **DNS攻撃は設計上、不可視だ。** プロキシが実際のトラフィックを転送するため、被害者のサービスは正常に動作し続ける。調査すべき障害は発生しない。外部から察知できる唯一のシグナルは、公開のCTログに現れる証明書だ。だからこそ、それらのログの監視が一夜にして任意から必須に変わったのだ。
- **ドメインの支配は国家安全保障上の管理事項だ。** 外務省のDNSを編集している主体が敵対国家であるとき、「IT運用」と「防諜」の区別は消える。インターネットのアドレス帳は戦略的な領土だ。

根底に流れる問いはひとつだ――ほぼいかなる運用ツールもリアルタイムで答えられない問い。**今この瞬間、このドメインを実際に支配しているのは誰であり、それが静かに変わっていないことを証明できるか？** DNSpionageが成立したのは、この問いに答えることがあまりに難しく、ある地域全体の政府がそれを知る手段を持っていなかったからだ。

## Namefiの視点

![改ざん防止・検証可能なドメイン所有権のカラフルなイラスト。緑のシールド、緑のNamefiトークン、DNS継続性によって保護されたドメインカード](../../assets/the-dnspionage-campaign-03-namefi-angle.jpg)

DNSpionageは根本的に**来歴（プロベナンス）**の問題だ。攻撃者は標的ドメインを所有していたわけではない。レジストラやDNSホストのパネルで静かに検証不可能な編集を行える認証情報を盗むことで、一時的に支配権を借用した――そしてシステムのどこも、「支配している主体」が変わったことを検知しなかった。

[Namefi](https://namefi.io)は、[ドメイン所有権](/ja/glossary/domain-ownership/)と支配権が不透明なレジストラのログインの中に閉じ込められるのではなく、**検証可能で、移転可能で、改ざんが証明できる**べきだという前提のうえに構築されている。トークン化された所有権は、「誰がこの名前を管理しているか」を確認・監査できる事実にする。それは既に誰かの手にあるかもしれないパスワードの後ろに埋もれた設定ではなくなる。これはレジストラアカウントの衛生管理や多要素認証の代替ではない――CISAの勧告は依然として正しい――しかし、DNSpionageが突いたより深いギャップを攻略する。すなわち、ドメインを支配している主体が本来そうあるべき主体であることを、独立した継続的な形で**証明する**ことの困難さだ。

DNSpionageの教訓は、DNSがある特殊な意味で脆弱だということではない。ドメインにとって最も重要な事実――誰がそれを支配しているか――が、あまりにも長い間、盗まれたパスワード一枚で変えられる状態に置かれていたということだ。その事実を検証可能にすることが、すべての核心にある。

## 参考資料・関連情報

- Cisco Talos — [DNSpionage Campaign Targets Middle East](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/)（2018年11月27日）
- Cisco Talos — [DNSpionage brings out the Karkoff](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/)（2019年4月23日）
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)（2019年2月18日）
- The Register — [Baddies linked to Iran fingered for DNS hijacking to read Middle Eastern regimes' emails](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/)（2019年1月10日）
- SecurityWeek — [Iran-Linked DNS Hijacking Attacks Target Organizations Worldwide](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/)（2019年1月10日）
- BleepingComputer — [DHS Issues Emergency Directive to Prevent DNS Hijacking Attacks](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/)（2019年1月）
- Network World — [Cisco Talos details exceptionally dangerous DNS hijacking attack](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html)（2019年4月17日）
- Network World — [Cisco: DNSpionage attack adds new tools, morphs tactics](https://www.networkworld.com/article/967303/cisco-dnspionage-attack-adds-new-tools-morphs-tactics.html)
- CERT-IST — [DNSpionage and DNS data hijacking](https://www.cert-ist.com/public/en/SO_detail?format=html&code=dnspionage)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)（2019年1月22日）
