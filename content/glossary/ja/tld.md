---
title: TLD（トップレベルドメイン）
date: '2026-05-22'
language: ja
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: TLD（トップレベルドメイン）とは、ドメイン名の最も右側のラベルであり、.com、.org、.de などがその例。ICANN の監督のもと、IANA のルートゾーンを通じて委任される。
keywords: ['TLD', 'トップレベルドメイン', 'gTLD', 'ccTLD', '新gTLD', 'DNS', 'IANA', 'ICANN', 'ルートゾーン', 'ドメインレジストリ']
also_known_as: ['トップレベルドメイン']
level: 2
sources:
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains
  - https://www.rfc-editor.org/rfc/rfc1591
  - https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains
relatedArticles:
  - /ja/blog/what-is-a-tld/
  - /ja/blog/top-tlds-to-secure-for-your-startup/
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/how-tld-affects-domain-value/
  - /ja/blog/top-tlds-to-secure-for-your-business/
relatedTopics:
  - /ja/topics/choosing-a-tld/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/best-tlds-by-industry/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/icann/
  - /ja/glossary/registry/
  - /ja/glossary/registrar/
  - /ja/glossary/dns/
  - /ja/glossary/web3/
---

**TLD**（*top-level domain*）は、**トップレベルドメイン**とも呼ばれ、完全修飾ドメイン名において最も右側に位置するラベル、すなわち最後のドットの後ろに続く部分を指す。`www.example.com` では TLD は `.com` であり、`bbc.co.uk` では `.uk` がそれにあたる。TLD は [DNS](/ja/glossary/dns/) 階層の頂点に位置し、すべてのドメイン名が構築される基盤となる。

## ドメイン名における TLD の位置づけ

[DNS](/ja/glossary/dns/) は階層的なツリー構造の命名システムである。ドメイン名を右から左へ読むと、その階層構造が明らかになる。

1. **ルート（`.`）** — 最右端に存在する不可視のドット。[ルートゾーン](/ja/glossary/root-zone/)は権威ある出発点であり、すべての TLD に対して権威を持つネームサーバーがどれかを知っている、[IANA](/ja/glossary/iana/) が管理する少数のサーバー群で構成される。
2. **TLD** — 右から最初に現れる可視のラベル（`.com`、`.org`、`.de` など）。各 TLD は独自の権威ネームサーバーを持ち、[レジストリ](/ja/glossary/registry/)オペレーターによって運営される。
3. **[セカンドレベルドメイン](/ja/glossary/second-level-domain/)** — TLD のすぐ左のラベル（例：`example.com` における `example`）。レジストラントがレジストラから購入するのがこの部分にあたる。
4. **サブドメイン** — さらに左に続くラベル（`www`、`mail`、`blog` など）。セカンドレベルドメインを管理する者が制御する。

リゾルバーが `www.example.com` を検索する際、まずルートサーバーに `.com` の所在を問い合わせ、次に `.com` レジストリのネームサーバーに `example.com` の所在を問い合わせ、最後に `example.com` のネームサーバーに `www` レコードを問い合わせる。この委任チェーンにより、単一のサーバーがすべてのドメイン名を把握する必要がなくなる。

## TLD の種類

IANA は TLD を次のカテゴリーに分類している。

| カテゴリー | 例 | 備考 |
|---|---|---|
| **[gTLD](/ja/glossary/gtld/)** （汎用） | `.com`、`.net`、`.org`、`.info` | もともと制限なしまたは広範な用途向け；最も広く使われるクラス |
| **[ccTLD](/ja/glossary/cctld/)** （国コード） | `.de`、`.uk`、`.jp`、`.us` | ISO 3166-1 に基づく二文字コード；多くは国家機関が管轄 |
| **sTLD** （スポンサー付き） | `.gov`、`.edu`、`.mil`、`.museum` | 登録資格を制限するスポンサー組織を持つ gTLD のサブタイプ |
| **[新gTLD](/ja/glossary/new-gtld/)** | `.app`、`.blog`、`.shop`、`.xyz` | ICANN の拡張プログラムにより2013年以降導入 |
| **インフラストラクチャー** | `.arpa` | DNS 技術インフラ用に予約済み；一般登録は不可 |
| **テスト／予約済み** | `.example`、`.localhost`、`.invalid` | RFC 2606 で定義；パブリックルートには委任されない |

`.arpa` は現在唯一のインフラ TLD である。IPv4 アドレスを逆引きする `in-addr.arpa` と、IPv6 用の `ip6.arpa` というリバースルックアップゾーンをホストしており、IP アドレスをホスト名にマッピングする。

国コード TLD はもともと当該国内の登録者向けとされていたが、多くはグローバル登録に向けて自由化されている。`.io`（英領インド洋地域）や `.co`（コロンビア）は、汎用の代替として国際的に広く利用されている代表例である。

## TLD の作成と委任

委任されたすべての TLD の権威ある一覧は、**IANA ルートゾーンデータベース**（[iana.org/domains/root/db](https://www.iana.org/domains/root/db)）で管理されており、各 TLD とその権威ネームサーバー群および指定[レジストリ](/ja/glossary/registry/)オペレーターのマッピングが記録されている。

**ccTLD の委任**は [RFC 1591](https://www.rfc-editor.org/rfc/rfc1591)（Postel、1994年）に定められたポリシーに従う。二文字コードは ISO 3166-1 から導出され、各コードは受託者——通常は政府機関または国内で認知された団体——に委任され、その国や地域の公益に資することが期待される。ccTLD の管轄が変わる際には、[IANA](/ja/glossary/iana/) が再委任の申請を審査する。

**新 gTLD** は [ICANN](/ja/glossary/icann/) の申請ラウンドを通じて創設される。最初の大規模拡張は2012年に始まり、ICANN が3文字以上の任意の文字列を汎用 TLD として申請できる制度を開始した。申請者は基本料を支払い、技術的能力と財務的安定性の審査を受け、異議申し立てプロセス（コミュニティ、公序良俗、知的財産、文字列混同に関する異議を含む）を通過し、ICANN とレジストリ契約を締結する（[ICANN 新 gTLD プログラム](https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains)）。このラウンドでは1,200以上の新 gTLD が委任された。第2回申請ラウンドは2026年に開始し、名前空間がさらに拡大している。

委任後、TLD の[レジストリ](/ja/glossary/registry/)オペレーターは、その TLD 配下に登録されたすべてのセカンドレベルドメインの権威データベースを管理し、ゾーンのネームサーバーを運用し、レジストラが登録者にドメインを販売する際に従うべきポリシー（価格設定、登録資格、文字数ルールなど）を定める。

## 主な TLD の例

| TLD | 運営者 | 備考 |
|---|---|---|
| `.com` | Verisign | 登録件数最大の TLD；もともと商業団体向け |
| `.net` | Verisign | もともとネットワークインフラプロバイダー向け；現在は制限なし |
| `.org` | Public Interest Registry | もともと非営利団体向け；現在はほぼ制限なし |
| `.gov` | GSA（米国） | 米国の連邦・州・地方政府機関のみ登録可 |
| `.edu` | Educause | 米国の認定高等教育機関のみ登録可 |
| `.uk` | Nominet | 英国の ccTLD；一般的な登録は `.co.uk` などのセカンドレベルラベルを使用 |
| `.de` | DENIC | ドイツの ccTLD；登録件数で最大規模の ccTLD のひとつ |
| `.io` | ICANN／レジストリ移行中 | 英領インド洋地域のコード；テック企業に広く採用 |
| `.app` | Google Registry | 新 gTLD；レジストリポリシーにより HTTPS が必須 |
| `.xyz` | XYZ.com LLC | 新 gTLD；低価格設定により登録件数が多い |

## TLD、価値、SEO

検索エンジンは TLD を2つの異なる観点から扱う。

**ジオターゲティング：** [ccTLD](/ja/glossary/cctld/) は地理的シグナルを発する。Google Search Central によれば、`.de` のサイトはドイツ語圏ユーザーをターゲットにしていると一般に解釈され、Google Search Console では汎用 TLD に対して明示的なジオターゲティングの設定が可能だが、ccTLD のシグナルは自動的に適用される。グローバルな読者を単一ドメインで対象とする場合は、汎用 TLD を選ぶことで意図しない地理的制限を避けられる。

**ランキング：** 多くの場合、TLD 自体はランキング要因ではない。Google は[新 gTLD を他の TLD と同様に扱う](https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains)と公式に述べており、`.com` が `.app` や `.xyz` より本質的に上位に表示されるわけではない。重要なのはドメイン全体の権威と関連性であり、拡張子だけで決まるものではない。`.jobs` や `.travel` のような古くからあるキーワード性の高い TLD が暗黙的なコンテキストシグナルをもつ場合もあるが、コンテンツの品質やバックリンクプロファイルと比べれば軽微な要因に過ぎない。

**ブランド認知と記憶しやすさ：** ドメイン投資家やマーケターの観察によれば、確立された短い TLD——特に `.com`——はエンドユーザーの高い認知度を持ち、検索結果でのクリック率、直接アクセス、信頼感に影響を与える可能性がある。これはアルゴリズム的な要素ではなく、市場的・行動的なダイナミクスである。

**プレミアムとアフターマーケットの価格設定：** TLD の知覚価値は、その配下の[セカンドレベルドメイン](/ja/glossary/second-level-domain/)の二次市場価格に影響する。`.com` ドメインは平均して、新しい拡張子の同等のドメインより高いアフターマーケット価格を示す傾向がある。これは技術的な優位性ではなく、消費者の親しみやすさを反映したものである。

## TLD とトークン化ドメイン

ブロックチェーンベースの命名システムの中には、IANA のルートゾーンの外で運営され、互換性のあるリゾルバーやブラウザ拡張機能の中でのみ解決される代替 TLD を事実上導入しているものがある。`.eth`（Ethereum Name Service）、`.crypto`、`.nft` などがその例である。これらは [IANA](/ja/glossary/iana/) を通じて委任されたものではなく、デフォルトではグローバル DNS での名前解決はされないが、ブリッジやゲートウェイサービスによって部分的な相互運用性が提供される場合もある。

IANA が管轄する名前空間においては、[セカンドレベルドメイン](/ja/glossary/second-level-domain/)名のトークン化（`example.com` のような名前の所有権をブロックチェーントークンとして表現すること）は TLD 自体とは別の概念である。個々のドメイン名の所有権がどのように記録されるかにかかわらず、TLD は同じレジストリガバナンスのもとに置かれたままとなる。
