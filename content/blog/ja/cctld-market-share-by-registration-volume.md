---
title: '登録数で見るccTLDのマーケットシェア：国家ネームスペースを実際に動かしているのは誰か？'
date: '2026-05-01'
language: ja
tags: ['cctld', 'domains', 'market-analysis', 'registry']
authors: ['namefiteam']
draft: false
cluster: choosing-a-tld
format: analysis
description: 世界の国別コードトップレベルドメイン（ccTLD）の中で登録数が最も多いのはどこか、予想を裏切るリーダーたちの実態、そしてその数字がインターネットの実際の使われ方について何を物語っているかを解説します。
ogImage: ../../assets/cctld-market-share-by-registration-volume-og.jpg
keywords: ['ccTLD マーケットシェア', '国別コードドメイン', '.cn', '.de', '.uk', '.tk', '.io', 'ドメイン統計', 'レジストリデータ', 'namefi']
relatedArticles:
  - /ja/blog/how-tld-affects-domain-value/
  - /ja/blog/what-is-a-tld/
  - /ja/blog/why-are-io-domains-expensive/
  - /ja/blog/ai-vs-io-domain/
  - /ja/blog/top-tlds-to-secure-for-your-startup/
relatedTopics:
  - /ja/topics/choosing-a-tld/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/best-tlds-by-industry/
relatedGlossary:
  - /ja/glossary/tld/
  - /ja/glossary/icann/
  - /ja/glossary/registrar/
  - /ja/glossary/registry/
  - /ja/glossary/dns/
---

インターネットというとほとんどの人が `.com` を思い浮かべる。実際、件数だけを見れば `.com` は依然として世界最大の[トップレベルドメイン](/ja/glossary/tld/)であり、管理下にある名前は約1億6000万件にのぼる。しかし `.com` は[gTLD](/ja/glossary/gtld/)——つまり*汎用*トップレベルドメインだ。視点を**国別コードTLD（ccTLD）**——[ISO 3166-1](https://www.iso.org/iso-3166-country-codes.html) に基づいて各国・地域に割り当てられた2文字のサフィックス——に移すと、様相はずっと興味深く、そして予想をはるかに超えたものになる。

この記事では、登録数でリードするccTLDはどこか、なぜその顔ぶれは意外なのか、そしてそれらの数字が世界各地でインターネットが*実際にどう使われているか*について何を示しているかを掘り下げる。

## リーダーたち、概ねの順位で

公開されているレジストリデータ（集計値を公表しているオペレーターのデータや、[DNIB Q1 2026 ドメイン名産業概況](https://www.dnib.com/articles/the-domain-name-industry-brief-q1-2026#:~:text=The%20top%2010%20ccTLDs%2C%20as%20of%20March%2031%2C%202026%2C%20were%20.cn%2C%20.de%2C%20.uk%2C%20.ru%2C%20.nl%2C%20.br%2C%20.fr%2C%20.au%2C%20.in%20and%20.eu.)、[DENICの.de統計](https://www.denic.de/en/products/statistics-about-de/)などのアグリゲーター・スナップショットを含む）によると、ccTLDの上位層は概ね以下の順になる。

- **.cn（中国）** — 約2000万件前後。多くの日において最大の[ccTLD](/ja/glossary/cctld/)。
- **.de（ドイツ）** — 約1700万件。DENICが運営し、年間を通じて際立って安定している。
- **.uk（英国）** — `.uk` と `.co.uk` の合計で約1000万件。
- **.nl（オランダ）** — 約600万件。人口1700万人の国にしては突出した数字だ。
- **.ru（ロシア）** — 約500万件に加え、キリル文字のIDN版である `.рф` に数百万件。
- **.br（ブラジル）** と **.fr（フランス）** — いずれも次の大きな層に位置し、`.br` は `.com.br` の下に集中している。
- **.au（オーストラリア）**、**.in（インド）**、**.eu（欧州連合）** — それぞれ次の層。`.eu` は単一国家のネームスペースではなく、技術的には地域ccTLDに分類される。
- **.it、.pl、.ca** — 報告期間やデータソースによっては現在のトップ10圏内外に位置する重要な国家ネームスペース。

このバンドの下には、数十万件から数百万件の間に位置する国別コードゾーンの長いテールが続く。

## なぜ予想外のリーダーが並ぶのか

いくつかのパターンは取り上げる価値がある。

### 中国とドイツが牽引——米国ではない

米国にもccTLDがある——`.us` だ。しかし、これを使う人はほとんどいない。アクティブ登録数は100万件をはるかに下回っている。アメリカのインターネットは最初から `.com` 一辺倒で走り、振り返ることがなかった。そのため、世界最大の経済大国はccTLDチャートからほぼ姿を消し、実際のccTLDリーダーは*ローカル*拡張子が強いブランド信頼を持つ経済圏——ドイツ（`.de`）、英国（`.co.uk`）、オランダ（`.nl`）、中国（`.cn`）——が占めることになる。

これがccTLDマーケットシェアが馴染みのない顔ぶれに見える最大の理由だ。分母は「インターネットユーザー数」ではない。「ローカル拡張子が実際に意味を持つ地域のインターネットユーザー数」なのだ。

### 一部のccTLDは実際に自国では使われていない

小国のccTLDの中には、汎用拡張子のように運用されているものがあり、登録の大半がその国の外から来ている。

- **[.io](/ja/tld/io/)** （英領インド洋地域）——「input/output」の語呂合わせでテックスタートアップに愛用されている。
- **[.tv](/ja/tld/tv/)** （ツバル）——メディアやストリーミングブランドにリースされている。
- **[.co](/ja/tld/co/)** （コロンビア）——`.com` の代替としてグローバルにマーケティングされている。
- **[.me](/ja/tld/me/)** （モンテネグロ）——代名詞的な語感で、個人サイトに人気がある。
- **[.ai](/ja/tld/ai/)** （アンギラ）——AIブームを受けて最近急激に注目を集めている。
- **.tk** （トケラウ）——かつて無料登録プログラムによって件数が膨らんでいたが、すでに[廃止](https://en.wikipedia.org/wiki/.tk)されている。

これらのゾーンは非常に大きな件数を示すことがあるが、その件数は割り当て国の人口や経済活動ではなく、*グローバルなブランディング需要*を反映している。ツバルの住民は約1万1000人だが、そのccTLDは世界で最も注目されている。

### 無料登録がテーブルを歪める

2010年代の大半にわたって、Freenomは `.tk`、`.ml`、`.ga`、`.cf`、`.gq` で無料登録を提供していた。ピーク時には `.tk` だけで `.de` より多い登録件数が報告されていた。業界のオブザーバーたちは、それらの名前の大半が未使用か、[フィッシング](/ja/glossary/phishing/)目的で悪用されていると一貫して指摘していた。[ICANNの手続きおよびレジストリ引き継ぎ](https://www.icann.org/en/system/files/files/proposed-renewal-tk-redelegation-12sep23-en.pdf)を経て、Freenomは新規登録を停止し、見かけ上のマーケットシェアは消滅した。教訓は明確だ：登録*件数*と登録*価値*は異なる指標である。

### 制限付きccTLDはあえて小規模にとどまっている

一部のccTLDには資格要件がある——現地住所、現地法人、国民IDが必要となる。`.jp` と `.no` はまさにその典型だ。JPRSは `.jp` の登録に日本の恒久的な住所を要求し、Noridは `.no` にノルウェーのアイデンティティまたは組織の適格性とノルウェーの郵便住所を要求する。`.fi` はその対照的な例として参考になる。Traficomは現在、住所地に関わらず企業・団体・個人が登録できるようにしている。制限付きゾーンは完全にオープンなゾーンと件数で競い合うことはないが、そこに存在する名前は概して品質が高い——悪用率・駐車率が低く、更新率が高い。件数の信頼性が高い[レジストリ](/ja/glossary/registry/)を探すなら、制限付きccTLDは有力な候補だ。

## 件数と価値：数字が語ること・語らないこと

ccTLDの登録件数によるランキングは最もよく引用される統計であり、最も誤解されやすい統計でもある。より正直な全体像は、3つの数字を組み合わせることで見えてくる。

- **総登録件数** — 見出しとなる数字。
- **更新率** — 1年後も残っている名前の割合。健全なゾーンは75〜85%前後。投機的または無料ティアのゾーンは50%を下回ることがある。
- **利用率** — 実際にウェブサイト、MXレコード、その他のライブサービスとして解決される名前の割合。測定は難しいが、レジストリの透明性レポートやサードパーティのクロール（例：[DomainTools](https://www.domaintools.com/resources/blog/)、[SecurityTrails](https://securitytrails.com/blog)）が推定値を公表している。

2000万件の名前を抱えながら更新率が50%のccTLDは、ある意味において、600万件で更新率88%のccTLDより小さいと言える。前者は回転率（チャーン）であり、後者は*インストールベース*（定着した利用者基盤）だ。

## ドメインを選ぶ際のインプリケーション

サービスを構築する人にとっての実践的なポイントは次の通りだ。

- **`.com` は依然としてグローバルブランドのデフォルト拡張子だ。** スペルアウトする必要がない唯一のTLDである。
- **ccTLDが支配的な国・地域では、ローカルccTLDの方が `.com` よりもローカル市場の信頼を得やすい** ——ドイツ、オランダ、英国、チェコ、ポーランドがその例だ。これらの市場ではユーザーがローカル拡張子を積極的に好む。
- **グローバルに運用される小国ccTLD**（`.io`、`.ai`、`.co`、`.me`）は、名称こそccTLDだが実質的にはgTLDだ。管轄の問題としてではなく、ブランドの意思決定として扱い、オペレーターが変わった場合に何が起きるかを把握するために[レジストリのポリシー](https://www.icann.org/resources/pages/registries-listing-2012-02-25-en)を確認しておくこと。
- **登録件数は品質のシグナルではない。** それは主にマーケティングのシグナルだ。問い合わせる価値がある数字は更新率の方だ。

## Namefiの考え方

Namefiでは、上記の多くのccTLD（資格確認を伴う制限付きのものを含む）に対して、複数の[レジストラ](/ja/glossary/registrar/)バックエンドを経由して登録をルーティングしている。単一レジストラのアカウントレベルの管理に依存するのではなく、所有権レコードを[オンチェーン](/ja/glossary/on-chain/)で[トークナイズ](/ja/glossary/tokenize/)するため、拡張子の選択はロックインの決断ではなく、ルーティングの決断となる。`.io` でスタートして、後から現地市場向けに同じブランドアイデンティティを `.de` に移したい？それはNaemfiが対応するように設計されたトランスファーワークフローであり、移行プロジェクトではない。

より本質的なポイントは、ccTLDのマーケットシェアとは開かれたインターネット上の*信頼のシグナル*に関する物語だということだ。人々が登録する名前は、どの拡張子がどの市場でネイティブに感じられるかを示している。そして、そのネイティブな拡張子は必ずしも件数の表が上位に置くものとは一致しない。

## 出典と参考資料

- Verisign — [Domain Name Industry Brief](https://www.verisign.com/en_US/domain-names/dnib/index.xhtml)：TLD市場で最も多く引用される四半期スナップショット。
- DNIB — [Q1 2026 ドメイン名産業概況](https://www.dnib.com/articles/the-domain-name-industry-brief-q1-2026#:~:text=The%20top%2010%20ccTLDs%2C%20as%20of%20March%2031%2C%202026%2C%20were%20.cn%2C%20.de%2C%20.uk%2C%20.ru%2C%20.nl%2C%20.br%2C%20.fr%2C%20.au%2C%20.in%20and%20.eu.)：本稿で使用した現在のccTLDトップ10の順位。
- DENIC — [.de の統計](https://www.denic.de/en/know-how/statistics/)：ドイツのレジストリによる公開ダッシュボード。
- Nominet — [.uk の統計](https://www.nominet.uk/news/reports-statistics/)とポリシー。
- JPRS — [.jp 登録資格](https://jprs.co.jp/en/jpdomain.html#:~:text=Any%20individual%2C%20group%20or%20organization%20having%20a%20permanent%20postal%20address%20in%20Japan%20is%20eligible%20for%20registration.)。
- Norid — [.no の一般要件](https://teknisk.norid.no/en/administrere-domenenavn/generelle-krav/#:~:text=must%20have%20a%20mailing%20address%20in%20Norway)。
- Traficom — [.fi 登録資格](https://traficom.fi/en/fi-domains/applying-and-using-fi-domains/how-get-fi-domain-name#:~:text=Companies%2C%20organisations%20and%20private%20persons%2C%20regardless%20of%20their%20domicile%2C%20can%20all%20have%20fi%2Ddomain%20names%20registered%20for%20them.)。
- ICANN — [Centralized Zone Data Service](https://czds.icann.org/)：利用可能なゾーンファイルへのアクセス。
- ISO — [ISO 3166-1 国コード](https://www.iso.org/iso-3166-country-codes.html)：すべてのccTLDラベルの根拠となる規格。
