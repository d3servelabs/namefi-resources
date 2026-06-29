---
title: DNS
date: '2025-06-30'
language: ja
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: 人間が読めるドメイン名をコンピューターがインターネット上でトラフィックを転送する際に使用するIPアドレスに変換する、階層型の命名システム。
keywords: ['DNS', 'ドメインネームシステム', '名前解決', 'DNSルックアップ', 'DNSレコード', 'ネームサーバー', '再帰的リゾルバー', 'DNSSEC', 'インターネットインフラ']
also_known_as: ['ドメインネームシステム']
level: 2
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.iana.org/domains/root
  - https://www.cloudflare.com/learning/dns/what-is-dns/
  - https://www.icann.org/resources/pages/what-2012-02-25-en
relatedArticles:
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /ja/blog/the-sea-turtle-dns-espionage/
  - /ja/blog/the-dnspionage-campaign/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/tld/
  - /ja/glossary/icann/
  - /ja/glossary/registry/
  - /ja/glossary/web3/
---

**DNS**（*Domain Name System*）は、インターネットの分散型・階層型命名システムであり、`example.com` のような人間が読めるドメイン名を、ネットワーク機器がインターネット上でパケットを転送する際に使用する[IPアドレス](/ja/glossary/ip-address/)へと変換する。DNS がなければ、ユーザーはアクセスしたいサイトごとに数値アドレスを記憶しなければならない。1987年に IETF が発行した [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034) および [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035) で定義され、今日もなおインターネットの中核プロトコルの一つであり続けている。

## DNS の役割

DNS は**名前解決**を担う。ドメイン名を受け取り、そのドメイン名に対応するリソースレコードを返す。最も一般的なのは[IPアドレス](/ja/glossary/ip-address/)であり、ブラウザやアプリケーションが接続先を把握するために使用する。このシステムはメールの転送（MX レコード）、ドメイン所有権の検証（TXT レコード）、特定のサーバー群へのゾーン権限の委任（NS レコード）にも利用される。

DNS は更新よりも参照の頻度がはるかに高いため、即時の一貫性よりも、世界中の数百万台のサーバーに分散されたキャッシュによる高速な読み取りに最適化されている。

## DNS ルックアップの仕組み

ブラウザに `example.com` と入力すると、複数のステップからなる名前解決プロセスが始まる。

1. **ローカルキャッシュの確認。** オペレーティングシステムはまず自身の DNS キャッシュを確認する。有効な回答がキャッシュに存在すれば、ルックアップはその場で完了する。

2. **再帰的リゾルバー。** キャッシュに回答がない場合、クエリは[DNS リゾルバー](/ja/glossary/dns-resolver/)へ転送される。これは ISP、企業（Cloudflare の `1.1.1.1` や Google の `8.8.8.8` など）、または組織が運営するサーバーである。このリゾルバーが代わりに回答を探す作業を引き受ける動作を**再帰的解決**と呼ぶ。

3. **ルートネームサーバー。** リゾルバーにもキャッシュされた回答がない場合、13 の論理的な[ルートゾーン](/ja/glossary/root-zone/)ネームサーバークラスター（`a` から `m` のラベルが付く）のいずれかに問い合わせる。ルートサーバーは最終的な回答を持たないが、`.com` や `.org` などの関連するトップレベルドメイン（TLD）を管理する[ネームサーバー](/ja/glossary/nameserver/)への参照を返す。[IANA](https://www.iana.org/domains/root) がルートゾーンデータベースを公開・管理している。

4. **TLD ネームサーバー。** リゾルバーは TLD ネームサーバーへ問い合わせる。TLD ネームサーバーは、特定のドメイン（`example.com`）の**権威ネームサーバー**への参照を返す。

5. **権威ネームサーバー。** リゾルバーはドメインの権威[ネームサーバー](/ja/glossary/nameserver/)へ問い合わせる。権威ネームサーバーは実際の DNS レコードを保持しており、リソースレコード——たとえば IPv4 アドレスを含む `A` レコード——を返す。

6. **応答とキャッシュ。** リゾルバーはクライアントへ回答を返し、レコードの[TTL](/ja/glossary/ttl/)（Time to Live）で指定された期間だけその結果をキャッシュする。TTL の有効期間中に同じ名前への後続クエリはキャッシュから応答され、レイテンシーの低減と上位サーバーへの負荷軽減に貢献する。

このパターン——リゾルバーが反復的な探索作業を担い、クライアントは一つのサーバーとのみ通信する——を**再帰的解決**と呼ぶ。対して**反復的解決**は、クライアント自身が階層の各レベルを順番に問い合わせる方式で、実際にはほとんど使われないが、リゾルバーが内部的に階層を辿る仕組みはこれに当たる（[RFC 1034 §5.3](https://datatracker.ietf.org/doc/html/rfc1034#section-5.3)）。

## DNS の階層構造と主なレコードタイプ

DNS は逆ツリー構造として編成されている。頂点にはルート（`.`）があり、その下に TLD（`.com`、`.net`、`.io`、`.de` などの国別コード）が続く。各 TLD の下にはセカンドレベルドメイン（`example.com`）があり、さらに任意の深さのサブドメイン（`mail.example.com`）を持てる。

このツリーの各ノードを**ゾーン**と呼び、あるゾーンの権威ネームサーバーはそのゾーンの**リソースレコード**を保持する。よく使われる[DNS レコードタイプ](/ja/glossary/dns-record-types/)は以下のとおりだ。

| レコード | 用途 | 値の例 |
|--------|---------|---------------|
| **A** | 名前を IPv4 アドレスにマッピング | `93.184.216.34` |
| **AAAA** | 名前を IPv6 アドレスにマッピング | `2606:2800:21f:cb07::1` |
| **CNAME** | ある名前を別の正規名にエイリアス | `www → example.com` |
| **MX** | ドメインのメールサーバーを優先度付きで指定 | `10 mail.example.com` |
| **NS** | ゾーンを一連のネームサーバーへ委任 | `ns1.example.com` |
| **TXT** | 任意のテキストを格納。SPF、DKIM、ドメイン確認に使用 | `"v=spf1 include:…"` |
| **SOA** | Start of Authority — ゾーン自体のメタデータ | シリアル番号、更新間隔、リトライ間隔など |

`CNAME` レコードはゾーンの頂点（ベアドメイン `example.com`）には配置できない。`CNAME` はその名前の唯一のレコードでなければならないが、頂点には `NS` と `SOA` も必要だからだ。多くの DNS プロバイダーは独自の「CNAME フラット化」や `ALIAS`/`ANAME` という疑似レコードタイプでこの制限を回避している。

## DNS の運営主体

DNS のガバナンスと運営は複数の階層の主体に分散されている。

- **[ICANN](/ja/glossary/icann/) / IANA。** Internet Corporation for Assigned Names and Numbers は[ルートゾーン](/ja/glossary/root-zone/)を監督し、グローバルな DNS 名前空間を調整する。ICANN の機能の一つである IANA は、全 TLD とその権威ネームサーバーを記載した[ルートゾーンデータベース](https://www.iana.org/domains/root)を管理している。

- **レジストリ。** [レジストリ](/ja/glossary/registry/)は特定の TLD の権威データベースを運営する。たとえば Verisign は `.com` と `.net` を、Public Interest Registry は `.org` を運営している。レジストリは各ドメインのネームサーバーを指し示す NS レコードを公開・管理する。

- **レジストラー。** [レジストラー](/ja/glossary/registrar/)は ICANN（または関連するレジストリ）から認定を受け、一般にドメイン名を販売し、顧客に代わって登録データをレジストリに提出する組織だ。

- **再帰的リゾルバー。** DNS リゾルバーは ISP、公開 DNS サービス（Cloudflare、Google、Quad9）、企業、家庭用ルーターが運営する。上述の反復的ルックアップを処理し、クエリのレイテンシーを低減するために結果をキャッシュする（[Cloudflare Learning — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)）。

- **権威ネームサーバー。** ドメイン所有者またはその DNS プロバイダーがホストし、実際のゾーンファイルを保持してリゾルバーのクエリに確定的な回答を返す。

## セキュリティ

DNS の元々の仕様は信頼性とスケールを重視して設計されており、セキュリティは考慮されていなかった。その後、いくつかの脆弱性と保護機構が登場した。

**キャッシュポイズニング。** リゾルバーのキャッシュに偽造した DNS 応答を注入できた場合、攻撃者は利用者を正規サイトから悪意あるサイトへ気づかせることなく誘導できる。2008年のカミンスキー攻撃はこれを大規模に実証し、ポートランダム化と [DNSSEC](/ja/glossary/dnssec/) の普及を後押しした。

**DNSSEC。** RFC 4033〜4035 で定義される DNS Security Extensions は、DNS レコードに暗号署名を追加する。[DNSSEC](/ja/glossary/dnssec/) 署名を検証するリゾルバーは改ざんされた応答を検出できる。普及は進んでいるものの均一ではなく、2024年時点でルートゾーンと主要 TLD の約 90% が署名済みだが、エンドツーエンドの検証にはチェーン内のすべてのゾーンが署名されていること、およびリゾルバーが署名を検証することが必要だ。

**DNS ハイジャック。** レジストラーのアカウント、レジストリのシステム、または ISP のリゾルバーが侵害された攻撃者は、DNS 応答を大規模にリダイレクトできる。防御策としては、レジストラー側の多要素認証、レジストリロック（EPP の `serverTransferProhibited`）、予期しない NS や A レコードの変更に対する監視が挙げられる。

**DNS over HTTPS / DNS over TLS（DoH / DoT）。** これらのプロトコルはクライアントとリゾルバー間の DNS クエリを暗号化し、通信経路上での盗聴やクエリの改ざんを防ぐ。データの整合性を扱う DNSSEC を補完するプライバシー保護の仕組みだ。

## DNS とトークン化ドメイン

Ethereum Name Service などのブロックチェーンベースのドメインシステムの中には、従来の DNS 階層とは独立して名前とアドレスのマッピングをすべてオンチェーンで管理するものもある。また、通常の方法で登録されたドメインの所有権を表すオンチェーントークンを発行するものもあり、その場合は基盤となる DNS ゾーンファイルは引き続き標準的なネームサーバーでホストされる。後者の場合、DNS の名前解決は上述の通常のルックアップフローで機能し、ブロックチェーン上のレコードは所有権を証明するが名前解決のパスには含まれない。オンチェーンの所有権レコードとグローバル DNS は、共存またはゲートウェイリゾルバーを通じて橋渡しできる別々のレイヤーだ。

---

*出典: [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034), [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035), [IANA Root Zone Database](https://www.iana.org/domains/root), [Cloudflare Learning — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/), [ICANN — What is DNS?](https://www.icann.org/resources/pages/what-2012-02-25-en)*
