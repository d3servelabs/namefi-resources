---
title: 'GoDaddyの多年にわたる侵害：世界最大のドメインレジストラに3年間潜伏した攻撃者の手口'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 13
format: case-study
description: '2020年から2022年にかけて、単一の脅威アクターグループがGoDaddyのインフラ内部に潜伏し続けた。ソースコードを盗み出し、Managed WordPress顧客120万人のデータを流出させ、さらには顧客のウェブサイトを断続的に悪意あるサイトへリダイレクトさせた。レジストラへの集中リスクと単一障害点が何を意味するのかを深く掘り下げる。'
keywords: ['GoDaddy侵害', 'GoDaddyデータ漏洩', 'Managed WordPress侵害', 'レジストラセキュリティ', 'ドメインセキュリティ', '多年侵害', 'cPanelマルウェア', 'ウェブサイトリダイレクト攻撃', 'SSL秘密鍵流出', 'SFTPパスワード漏洩', 'SEC 10-Kサイバーセキュリティ', 'レジストラ集中リスク', '単一障害点']
relatedArticles:
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-dnspionage-campaign/
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/the-badgerdao-frontend-attack/
  - /ja/blog/the-icann-spear-phishing-breach/
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
  - /ja/glossary/web3/
  - /ja/glossary/tld/
---

ドメイン[レジストラ](/ja/glossary/registrar/)は、あなたが完全に依存していながら、これほど地味な存在もないだろう。

年に一度料金を支払い、ログインするのは年に2回程度。その代わりに、ビジネスのオンライン上の存在を支える唯一の権利——「このドメイン名はここを指す」という宣言権——を預けることになる。メール、ウェブサイト、ログイン、決済。あらゆるデジタルの接点は、あなたのドメインのDNSを管理している会社に集約されている。多くの人は、契約後にその会社のことを二度と考えない。

しかし2年以上にわたって、ある高度な脅威アクターグループはGoDaddyのことを考え続けていた。内側から。

GoDaddyは地球上最大のドメインレジストラであり、数千万の顧客と8000万以上のドメインを管理している。そして少なくとも2019年末から2022年末にかけて、同一の持続的な攻撃者がGoDaddyのシステムを繰り返し侵害していたと、同社は現在信じている。ソースコードを盗み、Managed WordPress顧客120万人のデータを流出させ、ある時期には顧客のウェブサイトをひそかに書き換えて悪意あるサイトへリダイレクトさせた。GoDaddyはこれを単発の侵入とは説明しなかった。米国証券取引委員会（SEC）への提出書類の中で、[巧妙な脅威アクターグループによる多年にわたるキャンペーン](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=Based%20on%20our%20investigation%2C%20we%20believe%20these%20incidents%20are%20part%20of%20a%20multi%2Dyear%20campaign%20by%20a%20sophisticated%20threat%20actor%20group)と表現したのだ。

これが、スタックの最底辺にいる地味な会社が、実は数百万人にとっての単一障害点だったと判明したときに何が起きるかという話だ。

## なぜ一つのレジストラが数百万の単一障害点となるのか

集中化こそが、マスマーケット向けレジストラのビジネスモデルの本質だ。巨大なスケールでなければ採算が取れない。一つのプロビジョニングシステム、一つのコントロールパネル、一つのクレデンシャルストア、一セットのホスティングサーバーで、すべての顧客にサービスを提供する。その効率性こそがGoDaddyの利便性を生み出している——そして攻撃者が侵入したときに危険な理由でもある。

小さな企業が一社ハッキングされたとき、被害を受けるのはその一社だ。しかし数百万のビジネスのドメイン、ウェブサイト、証明書を管理するプラットフォームがハッキングされたとき、被害の射程はもはや一社ではない。その会社に名前を預けた全員だ。

これがレジストラリスクの核心にある非対称性だ。顧客にとってGoDaddyは自分専用のダッシュボードに見える。攻撃者にとってそれは、数百万の鍵を一か所に収めた金庫だ——錠前を一度こじ開けるだけでいい。

ここで「単一障害点」の意味を正確に理解しておく価値がある。というのも、それは二つの層で同時に機能するからだ。一つ目はレジストラ層：ドメインのDNSがどこを向くかを決める権限。ここが侵害されれば、攻撃者はメールも含めてドメイン全体を別の場所へリダイレクトできる。二つ目はホスティングと証明書の層：実際のウェブサイトを配信・認証するサーバー、クレデンシャル、SSLキー。GoDaddyは、同じ顧客に対して同時にこの両方の層を担う稀な企業だ。だから、同じ攻撃者がキャンペーンを通じてプロビジョニングシステム、ホスティングサーバー、証明書素材に触れたとき、無関係な複数の標的の間を移動していたわけではない。同じ数百万の扉に対して複数種類の鍵を持つ一社の内部を動き回っていたのだ。

![中央にそびえる巨大な金庫が床から天井まで何百万もの光るドメインキーで埋め尽くされ、影のような侵入者が折りたたみ椅子に腰掛けて何年もそこに住んでいるかのように寛ぐ、鮮やかな色彩のコンセプトアート、ドラマチックな照明](../../assets/the-godaddy-multi-year-breach-01-breach.jpg)

## タイムライン：2019年→2022年

GoDaddyの事件で最も不安をかき立てるのは、個々のインシデントではない。それらを並べると数年にわたる「占拠」として一本の線になるという事実だ。GoDaddy自身が点と点を結んだのは事後のことだった。

**2019年末 / 2020年3月——最初の足がかり。** 2020年に開示された侵害の後、GoDaddyは[攻撃者が2019年10月にウェブホスティングアカウントの認証情報を使って](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=GoDaddy%20alerted%2028%2C000%20customers%20that%20an%20attacker%20used%20their%20web%20hosting%20account%20credentials%20in%20October%202019)SSH経由でホスティングアカウントに接続していたと2万8000人の顧客に通知した。攻撃者にはゼロデイ脆弱性は必要なかった。必要だったのは認証情報であり、それを入手した。セキュリティレポートは後に、この攻撃の波がソーシャルエンジニアリング——攻撃者が[電話口でなりすまして](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)スタッフや顧客を欺きアクセス権を引き出す手口——によるものだったと示した。GoDaddyがInformationWeekに要約したように、[2020年3月、脅威アクターが2万8000人の顧客のログイン認証情報を侵害した](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=In%20March%202020%2C%20a%20threat%20actor%20compromised%20the%20login%20credentials%20of%2028%2C000%20customers)。

**2021年9月〜11月——最大の侵害。** 2021年11月22日、GoDaddyはManaged WordPressホスティング環境の侵害を開示した。数字は衝撃的だった。[GoDaddyがインシデントを発見したのは](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20incident%20was%20discovered%20by%20GoDaddy%20last%20Wednesday%2C%20on%20November%2017%2C%20but%20the%20attackers%20had%20access%20to%20its%20network%20and%20the%20data%20contained%20on%20the%20breached%20systems%20since%20at%20least%20September%206%2C%202021)2021年11月17日だったが、攻撃者は少なくとも2021年9月6日からアクセスを保持していた。検知されずに約2か月半潜伏していたことになる。TechCrunchが報じたように、[不正アクセス者は侵害されたパスワードを使って9月6日頃にGoDaddyのシステムへのアクセスを得た](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/#:~:text=the%20unauthorized%20person%20used%20a%20compromised%20password%20to%20get%20access%20to%20GoDaddy%27s%20systems%20around%20September%206)。

**2022年12月——マルウェアとリダイレクト。** 1年後、パターンが再び浮上した。GoDaddyは[2022年12月初旬に、顧客のサイトがランダムなドメインへのリダイレクトに使われているという顧客報告を受けた](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=customer%20reports%20in%20early%20December%202022%20that%20their%20sites%20were%20being%20used%20to%20redirect%20to%20random%20domains)。続く調査が2023年2月の開示を生み出した——そしてこれが新たな攻撃者ではなく、2020年以来繰り返されてきた同一キャンペーンだという認識をもたらした。

順番に読めば、これは三つの侵害ではない。一人の長期居住者の、三度の目撃記録だ。

このタイムラインが際立って見える理由は、目撃の合間の「空白」にある。数か月、そして1年。各インシデントは開示された当時、始まりと終わりのある独立した出来事——パスワードのリセット、証明書の再発行——に見えた。GoDaddyの調査官が2022年12月のマルウェアをツールや手法にさかのぼって追跡して初めて、一連の出来事は偶然の一致ではなくパターンとして見えてきた。この開示全体で最も背筋が凍る一文は、誰もそれを結びつける前に何年も続いていたという静かな告白だ。

## 流出した情報と、顧客に牙をむいたウェブサイト

2021年のManaged WordPress侵害は、最も明確かつ定量化された被害を持つインシデントだ。GoDaddy自身がSECに提出した通知で、その内容をはっきり説明している。

最大120万人のアクティブおよび非アクティブなManaged WordPress顧客のメールアドレスと顧客番号が流出した。さらに悪いことに、[プロビジョニング時に設定された元のWordPress管理者パスワードが流出した](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20original%20WordPress%20Admin%20password%20that%20was%20set%20at%20the%20time%20of%20provisioning%20was%20exposed)——WordPressインストールのマスターキーだ。アクティブな顧客については、sFTPとデータベースのユーザー名とパスワードも流出した。ファイルをアップロードし、データベースを直接読み取れる認証情報だ。そして最も機密性の高いサブセットについては、[SSLの秘密鍵が流出した](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=For%20a%20subset%20of%20active%20customers%2C%20the%20SSL%20private%20key%20was%20exposed)——サイトが本物であることを証明する暗号化の秘密だ。

これらを積み上げると、最悪ケースのツールキットが完成する。管理者パスワードでサイトに侵入できる。sFTPとデータベースアクセスでファイルとデータ層を改ざんできる。そしてSSL[秘密鍵](/ja/glossary/private-key/)は——Wordfenceが[侵害の分析](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)で指摘したように——攻撃者がサイトになりすましたり、トラフィックを復号したりすることを可能にする。信頼のアンカーであるべきレジストラが、攻撃者にその信頼を偽造する素材を渡してしまったのだ。

| 流出した情報 | 影響を受けたユーザー | 解錠できるもの |
| --- | --- | --- |
| メールアドレス＋顧客番号 | 最大120万人のアクティブ・非アクティブ顧客 | 標的型フィッシング、アカウントマッピング |
| 元のWordPress管理者パスワード | 影響顧客（まだ使用中の場合） | WordPressインストールの完全制御 |
| sFTP＋データベース認証情報 | アクティブ顧客 | ファイルレベル・データベースレベルのサイト改ざん |
| SSLの秘密鍵 | アクティブ顧客の一部 | サイトなりすまし、トラフィック復号 |

この流出の規模が、通常のサイトへの攻撃とは本質的に異なる理由を物語っている。通常のハッキングは一つのサイトを侵害する。ここでは、共有プロビジョニングシステムへの一度の侵入で、百万以上のサイトの鍵が一気に流出した。

そしてデータ侵害を内臓に刺さるものにした出来事がある——顧客のウェブサイトが訪問者を悪意あるサイトへリダイレクトし始めたことだ。2022年12月、[不正な第三者がcPanelホスティングサーバーにアクセスしてマルウェアをインストールした](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=an%20unauthorized%20third%20party%20gained%20access%20to%20and%20installed%20malware%20on%20our%20cPanel%20hosting%20servers)とGoDaddyは述べ、[そのマルウェアがランダムな顧客のウェブサイトを断続的に悪意あるサイトへリダイレクトした](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=The%20malware%20intermittently%20redirected%20random%20customer%20websites%20to%20malicious%20sites)と説明した。「断続的」と「ランダム」という言葉が残酷だ。毎回発動するリダイレクトは発見しやすい。しかし一部の訪問者に、一部のサイトで、時々だけ発動するリダイレクトは、中小企業の経営者が報告しても再現できず、ホストに「偶発的な不具合」と片付けられる類のものだ。それは攻撃そのものに組み込まれた迷彩だ。

## どのように侵入したか——破られた錠前ではなく、借りた鍵

GoDaddyの事件で最も居心地の悪い教訓は、入口がいかに地味だったかということだ。

この中心には高度なゼロデイ脆弱性などない。最初の波は盗まれた認証情報で動いた。2021年の侵害は[侵害されたパスワード](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=1.2%20million%20Managed%20WordPress%20customers%20after%20attackers%20breached%20GoDaddy%27s%20WordPress%20hosting%20environment%20using%20a%20compromised%20password)で実行された。Krebs on Securityはこのキャンペーンの分析に["When Low-Tech Hacks Cause High-Impact Breaches"（低技術のハックが高インパクトの侵害を引き起こすとき）](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)というタイトルをつけた——侵入の巧妙さに対して被害が不釣り合いに大きかったからこそだ。鍵を渡されるなら、金庫を破る必要はない。

内部に入ると、攻撃者は辛抱強く、プロとして振る舞った。潜伏し続けた。キャンペーンを通じてGoDaddyは、脅威アクターが[システムにマルウェアをインストールし、GoDaddy内の一部サービスに関連するコードの断片を入手した](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=installed%20malware%20on%20our%20systems%20and%20obtained%20pieces%20of%20code%20related%20to%20some%20services%20within%20GoDaddy)と述べた。盗まれたソースコードは一度限りの損失ではない。それは地図だ。攻撃者がすでに侵入しているシステムが実際にどう動くかを教えてくれる——弱い接合点はどこか、認証フローはどうなっているか、次に何を狙うべきか。持続的なマルウェアと組み合わさると、それは強盗と長期占拠の違いとなる。BleepingComputerがGoDaddy自身の結論を要約したように、[脅威アクターは数年にわたって繰り返し、同社のシステムにマルウェアをインストールしコードを盗むことができた](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=Threat%20actors%20were%20able%20to%20install%20malware%20on%20the%20company%27s%20systems%20and%20steal%20code)。

検知の遅れがこの話のもう半分だ。2021年のインシデントでは2か月半。キャンペーン全体では数年。攻撃者はGoDaddyの防御より速かったというよりも、監視より静かだったのだ。

![一本の光るスケルトンキーが回転して、何百もの郵便受けの扉が一斉に開く巨大な壁を映したコンセプトアート、マルウェアの触手がツタのように壁を這う、ドラマチックなネオン照明、ロゴなし](../../assets/the-godaddy-multi-year-breach-02-persistent-access.jpg)

## 対応と余波

GoDaddyが2021年の侵害に対して行った即時の技術的対応は標準的なプレイブックに従ったものだった。流出したsFTPとデータベースのパスワードをリセットし、秘密鍵が漏洩した顧客の新しいSSL証明書を再発行・インストールした。2023年2月の開示については、外部のフォレンジック専門家と法執行機関を関与させ、この攻撃者をホスティングプロバイダーを標的とした組織的な巧妙グループと表現した——単独の便乗者ではないと。

しかし評判と規制上の余波は、インシデント対応よりも長く続いた。一連の侵害は米国連邦取引委員会（FTC）の注目を集め、FTCは2025年に[データセキュリティの失敗を巡りGoDaddyとの命令を確定した](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures)。セキュリティを保証するマーケティングを行いながら合理的なセキュリティ対策を実施しなかったと主張し、包括的な情報セキュリティプログラムの構築を命じた。借りたパスワードから始まった侵害が、数年後に連邦の同意命令として終わった。

開示のタイムライン自体も批判を浴びた。多年にわたる問題という全体像は、2023年2月のSEC提出書類である10-Kフォームを通じて初めて公開された。これは、2020年、2021年、2022年の各インシデントが繋がっていたことを、顧客がそれぞれ個別に報告された後のずっと後になって知ったことを意味する。

この時系列の裏には、より深いアカウンタビリティの問題が埋まっている。各開示は単独では小さな反応を引き出すに過ぎなかった——パスワードを変更し、新しい証明書を受け取り、先へ進む。しかし三つの別々の「孤立したインシデント」という説明を受けてきた顧客には、自分が何年もの間データの近くに潜伏し続けた一人の持続的な敵対者と向き合っていた可能性を理解する術がなかった。侵害の伝え方が、下流の人々がそれをどれほど深刻に受け止めるかを形作る。三つの小火と、一つの長く燃え続ける炎は、まったく違った読まれ方をする。

## レジストラ集中リスクが教えること

詳細を取り除けば、GoDaddyのキャンペーンはレジストラ集中リスクがなぜ固有のリスクカテゴリーであるかの教科書だ。

1. **プラットフォームが本当の標的だ。** 攻撃者はあなたを直接狙う必要はない。あなたと他の百万人を抱える会社を狙う。あなたのセキュリティ態勢はほとんど関係ない——レジストラのプロビジョニングシステムが脆弱な標的であれば、好むと好まざるとにかかわらず、あなたはその爆発半径を引き継ぐことになる。

2. **フロントドアは脆弱性ではなく、認証情報だ。** 侵害されたパスワードがここでの被害の大半を担った。多要素認証、認証情報の衛生管理、そして積極的な異常検知は、あらゆる単一の高度な防御よりも重要だ——入口はほぼ常に借りたアクセス権であり、破られた錠前ではないのだから。

3. **滞留時間こそが真の指標だ。** データの露出は悪い。しかし攻撃者が何か月も何年もプロビジョニングシステムに検知されずに潜伏することは壊滅的に悪い。なぜなら持続性は複利で効くからだ。被害は侵入したことだけでなく、どれだけ長く滞在するかの関数だ。

4. **集中化された秘密は集中化された失敗だ。** 管理者パスワード、sFTP認証情報、SSLの秘密鍵を一か所に回収可能な形で保管することは、最悪ケースの単一損失となるまで便利だ。同じストアが120万人の顧客の鍵を持つとき、一つの侵害は120万の侵害になる。

5. **ウェブサイトのリダイレクトは、レジストラではなく顧客の悪夢だ。** GoDaddyのサーバーが顧客サイトを悪意ある場所へリダイレクトしたとき、代償を払ったのは顧客のブランド、顧客の顧客、そしてSEOだ——何も悪いことをしていないにもかかわらず。集中リスクとは、本質的に他者のミスによって被害を受けるリスクだ。

これは「大手レジストラを使うな」という意味ではない。規模は実際のセキュリティ投資をもたらし、小規模プロバイダーも失敗する。ドメインをプラットフォームに預けるとき、そのプラットフォームの最悪の日があなたの最悪の日になりえることを理解せよ、ということだ。

## Namefiの視点

![検証可能な改ざん耐性のあるドメイン所有権のカラフルなイラスト——グリーンのシールドで保護されたドメインカード、緑のNamefiトークン、DNSの継続性](../../assets/the-godaddy-multi-year-breach-03-namefi-angle.jpg)

GoDaddyのキャンペーンが露わにする最も深い問題はマルウェアではない。ドメインの所有権と管理が一つのプロバイダーのプライベートデータベースの中だけに存在していたことだ——そのデータベースは、何年もの間、侵入者が内側から読み取り、改ざんし、なりすますことができ、正当な所有者には独立して知る手段がなかった。

[Namefi](https://namefi.io)は異なるデフォルトを基盤として構築されている。ドメインは所有権が検証可能で改ざん耐性を持つインターネットネイティブな資産として振る舞うべきだ——ログインして希望しながら確認するしかない一社のアカウントシステムの一行ではなく。トークン化された所有権は「実際にこのドメインを管理しているのは誰か」という問いを、単一のプロバイダーの外側から答えられるものにする——監査可能で、移転可能で、ひそかに書き換えにくい——DNSとの互換性を保ちながら、名前は解決し続ける。

これでレジストラをハッキング不可能にするわけではない。そんなものは存在しない。しかし侵害が密かにできることを変える。所有権の証明が侵害されたプラットフォームの内側だけではなく、検証可能な独立した層に存在するとき、「侵入者が2年間データベースに潜伏していた」は「侵入者が誰が何を所有しているかを支配していた」と同じことを意味しなくなる。GoDaddyの話は、管理と証明が同じ脆弱なものとして同じ場所に置かれていたときに何が起きるかだ。その教訓は、そこに置くのをやめることだ。

## 参考資料・関連情報

- BleepingComputer — [GoDaddy: Hackers stole source code, installed malware in multi-year breach](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/)
- BleepingComputer — [GoDaddy data breach hits 1.2 million Managed WordPress customers](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/)
- Krebs on Security — [When Low-Tech Hacks Cause High-Impact Breaches](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)
- Sophos — [GoDaddy admits: Crooks hit us with malware, poisoned customer websites](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites)
- The Hacker News — [GoDaddy Discloses Multi-Year Security Breach Causing Malware Installations and Source Code Theft](https://thehackernews.com/2023/02/godaddy-discloses-multi-year-security.html)
- TechCrunch — [GoDaddy says data breach exposed over a million user accounts](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/)
- SecurityWeek — [GoDaddy Breach Exposes 1.2 Million Managed WordPress Customer Accounts](https://www.securityweek.com/godaddy-breach-exposes-12-million-managed-wordpress-customer-accounts/)
- InformationWeek — [GoDaddy Hit with Multiyear Breach](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-)
- BankInfoSecurity — [GoDaddy Confirms Breach Affects 1.2 Million Customers](https://www.bankinfosecurity.com/godaddy-confirms-breach-affects-12-million-customers-a-17974)
- Wordfence — [GoDaddy Breach — Plaintext Passwords — 1.2M Affected](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)
- U.S. Federal Trade Commission — [FTC Finalizes Order with GoDaddy over Data Security Failures](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures)
- GoDaddy (via SEC) — [Notice of Security Incident, November 22, 2021](https://www.sec.gov/Archives/edgar/data/1609711/000160971121000122/gddyblogpostnov222021.htm)
