---
title: "DNSレコードの種類はウェブサイト・メール・ゾーンの権威を結びます"
description: "DNSレコードの種類を用途で選び、A・AAAA・CNAME・MX・TXTの設定例と依存関係を確認します。権威DNSとメールを維持しながら変更を検証する手順も解説します。"
date: '2026-10-21'
language: ja
tags: ['dns', 'domains', 'email', 'guide']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-basics
keywords: ['DNSレコード 種類', 'DNSレコード 一覧', 'DNSレコード 設定 例', 'AとAAAAレコード', 'CNAMEの制限', 'MXレコードの依存関係', 'TXT確認レコード', 'NSとSOAレコード', 'CAA証明書ポリシー', 'DNSSECレコード', 'SRVサービス検出', 'HTTPSレコード']
ogImage: ../../assets/dns-record-types-guide-og.jpg
relatedArticles:
  - /ja/blog/aaaa-record-explained/
  - /ja/blog/cname-vs-a-record/
  - /ja/blog/reverse-dns-ptr-records/
  - /ja/blog/change-domain-nameservers/
  - /ja/blog/dhcp-vs-dns/
relatedGlossary:
  - /ja/glossary/dns-record-types/
  - /ja/glossary/dns/
  - /ja/glossary/nameserver/
  - /ja/glossary/ttl/
  - /ja/glossary/dnssec/
relatedTopics:
  - /ja/topics/domain-basics/
  - /ja/topics/domain-security/
relatedSeries:
  - /ja/series/domain-investor-field-guide/
  - /ja/series/domain-apocalypse/
---

ウェブサイトの移行が成功しても、メールが届かなくなる場合があります。ドメインの名前解決が正しくても、証明書の発行に失敗する場合があります。DNS の各レコードは、異なる依存関係を管理します。

[DNSレコードタイプ（A、AAAA、CNAME、MX、TXT）](/ja/glossary/dns-record-types/)は、レコードのデータをソフトウェアがどう解釈するかを定めます。レコードを選ぶ出発点は、応答を必要とするサービスです。ウェブサイトはアドレス、メールは配送先情報を必要とします。証明書の発行には、認可ポリシーも関係します。

本記事では、架空の `example.com` ゾーンを使って判断の手順を説明します。名前、アドレス、ポリシーの例は、依存関係を示すための説明用です。実際の変更には、利用するサービスが指定した値を使ってください。

「ドメインにはどのレコードが必要か」だけでは判断できません。各レコードを読むアプリケーション、公開する名前、必要な関連レコードを確認してください。

## レコードタイプはサービスごとの異なる質問に答えます

![ウェブサイトのアドレスには A・AAAA、別名には CNAME、メール配送には MX、SPF には TXT、ゾーンの権威には NS と SOA を使います。](../../assets/dns-record-types-guide-05-record-selection.jpg)

次の表で、調べるべきゾーンの設定を選んでください。各レコードの役割と根拠は、後の節で説明します。

| タイプ | データまたは目的 | 利用する場面 |
| --- | --- | --- |
| A | IPv4 アドレス | サービスが IPv4 の接続先を指定する |
| AAAA | IPv6 アドレス | サービスが動作確認済みの IPv6 接続先を指定する |
| CNAME | 別名の参照先 | 事業者が、別名を設定できる名前でエイリアスを要求する |
| MX | 優先値とメール交換サーバー名 | ドメインがメールサービスでメールを受信する |
| TXT | アプリケーションが解釈するテキスト | サービスが確認用情報や SPF・DKIM の公開を要求する |
| NS | 権威サーバー名 | ゾーンが権限を委任する、または担当サーバーを宣言する |
| SOA | ゾーン管理の項目 | 権威 DNS サービスがゾーンの管理情報を扱う |
| CAA | 証明書発行のポリシー | ドメインが証明書の発行認可を制限する |
| SRV | 優先度、重み、ポート、参照先 | アプリケーションが DNS によるサービス検出に対応する |
| PTR | 逆引きゾーン内の名前 | アドレス管理者が逆引き DNS を設定する |
| DNSKEY、DS、RRSIG、NSEC | DNSSEC の検証データ | 運用者が設定を連携させて署名済みゾーンを運用する |
| SVCB、HTTPS | サービスバインディングのデータ | 接続先とクライアントが該当する方式に対応する |

[IANA のリソースレコード登録簿](https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-4)には、さらに専門的なタイプも載っています。ドメインに全タイプを設定する必要はありません。本記事は、歴史的な登録の全件ではなく、よく使う運用上の選択肢を扱います。

手順に「AAA レコード」とある場合は、AAAA を意味するか確認してください。「C レコード」とある場合は、CNAME を意味するか確認してください。IANA は AAAA と CNAME を登録していますが、AAA や C というタイプは登録していません。検索語の略記から独自のタイプを作らないでください。

## ウェブサイト用レコードは名前と接続先を結びます

![A、AAAA、CNAME が異なる方法でウェブサイトの接続先を指定します。](../../assets/dns-record-types-guide-01-website-record-paths.jpg)

ウェブサイトを変更するときは、公開する名前と接続先を分けて確認します。ホスティング事業者は、アドレス、別名の参照先、独自機能の設定手順を指定することがあります。各手順の設定方法は異なります。

A レコードは IPv4 アドレスを格納します。架空の `www.example.com` の A レコードなら、`192.0.2.20` を指定できます。値に `https://`、ポート、ページのパスは含めません。[RFC 1035 の 3.4.1 節](https://www.rfc-editor.org/rfc/rfc1035.html#section-3.4.1)が形式を定めています。

AAAA レコードは IPv6 アドレスを格納します。対応する架空の例は `2001:db8::20` です。AAAA の公開だけでは、接続先サーバーやネットワークの設定は完了しません。公開前に IPv6 接続を確認してください。[RFC 3596 の 2 節](https://www.rfc-editor.org/rfc/rfc3596.html#section-2)は、AAAA を A とは別に定義しています。

CNAME は、別の DNS 名を指定します。例えば、`www.example.com` の別名の参照先を `site.example.net` にできます。リゾルバーは、対応する問い合わせに答える際に参照先のデータをたどります。ドメイン管理者が参照先を管理できない場合でも、参照先への依存関係が生まれます。[RFC 1034 の 3.6.2 節](https://www.rfc-editor.org/rfc/rfc1034.html#section-3.6.2)が別名の名前解決を説明しています。

| 目的 | レコード | 確認事項 |
| --- | --- | --- |
| IPv4 を使う | A | 接続先アドレス |
| IPv6 を使う | AAAA | IPv6 接続 |
| ホスト名を参照する | CNAME | 参照先の名前解決 |
| HTTP の接続パラメーターを公開する | HTTPS | クライアントの対応 |

CNAME と同じ所有者名には、A、MX、TXT などの通常のレコードを置けません。DNSSEC の特定の管理データには例外があります。ゾーン頂点には SOA と NS が必要なので、通常の CNAME とは両立しません。[RFC 2181 の 10.1 節](https://www.rfc-editor.org/rfc/rfc2181.html#section-10.1)と [RFC 4034 の 3 節](https://www.rfc-editor.org/rfc/rfc4034.html#section-3)が区別を定めています。

事業者の管理画面では、フラット化などの独自機能でゾーン頂点の別名を受け付ける場合があります。Cloudflare の CNAME フラット化は、参照先を解決し、CNAME の代わりに最終的な IP アドレスを返します。画面の項目名だけでは、公開応答の形式は分かりません。[Cloudflare の説明](https://developers.cloudflare.com/dns/cname-flattening/#how-it-works)が事業者固有の動作を示しています。

ゾーン頂点の設定を評価するときは、実際の応答を調べてください。事業者がアドレスを返すか、参照先への依存関係を維持するか、必要なレコードの組み合わせに対応するかを確認します。別の事業者へゾーンを移す前にも、同じ点を再確認してください。

HTTPS と SVCB は、対応するクライアントへサービスの接続先や接続パラメーターを伝えます。HTTPS は、SVCB を HTTP 向けに特化したタイプです。サービス単位の別名はゾーン頂点でも使えます。CNAME のように名前全体を別名にはしません。クライアントの対応が必要です。[RFC 9460 の 2～3 節](https://www.rfc-editor.org/rfc/rfc9460.html#section-2)が仕組みを定義しています。

無関係な解説を見て HTTPS や SVCB を追加しないでください。利用サービスの設定要件に従い、未対応クライアントが必要とするアドレスレコードも維持します。もっともらしいパラメーターでも、接続先が提供しない機能を示す可能性があります。

変更後は、ホスト名の DNS 応答とウェブサイトの両方を確認します。公開する各ホスト名で、目的のページと証明書を確認してください。アドレスが正しくても、ウェブサーバーが要求されたホスト名を受け付けるとは限りません。

### 設定例は所有者名と値を分けて示します

次の各行は、架空のゾーンファイルの一行です。実際の応答でも完全なゾーンでもありません。形式は [RFC 1035 の 5 節](https://www.rfc-editor.org/rfc/rfc1035.html#section-5)に従います。

| 所有者名 | TTL | クラス | タイプ | 値 |
| --- | --- | --- | --- | --- |
| `example.com.` | `300` | `IN` | `A` | `192.0.2.20` |
| `example.com.` | `300` | `IN` | `AAAA` | `2001:db8::20` |
| `www.example.com.` | `300` | `IN` | `CNAME` | `site.example.net.` |
| `example.com.` | `3600` | `IN` | `MX` | `10 mail.example.net.` |
| `_verify.example.com.` | `300` | `IN` | `TXT` | `"illustrative-verification-token"` |

TTL の単位は秒です。`IN` は Internet クラスを表します。ゾーンファイルのドメイン名末尾のドットは、絶対名を表します。管理画面の入力規則は異なる場合があるため、保存後の完全な名前を確認してください。

例には、予約済みの[例示用ドメイン](https://www.rfc-editor.org/rfc/rfc2606.html#section-3)、[文書用 IPv4 アドレス](https://www.rfc-editor.org/rfc/rfc5737.html#section-3)、[文書用 IPv6 プレフィックス](https://www.rfc-editor.org/rfc/rfc3849.html#section-2)を使っています。本番環境に例の接続先をコピーしないでください。MX の例では、メール交換サーバー側のゾーンにアドレスレコードも必要です。TXT の例は実際のアカウントを確認しません。

[AAAA の解説](/ja/blog/aaaa-record-explained/)は IPv6 の準備確認を扱います。[A と CNAME の比較](/ja/blog/cname-vs-a-record/)は別名の制約を詳しく扱います。

## メール用レコードは配送と送信者認証を分担します

![MX、SPF、DKIM はメールの異なる依存関係を管理します。](../../assets/dns-record-types-guide-02-email-dependencies.jpg)

メール設定では、複数の名前に複数タイプのレコードを設定することが一般的です。受信の配送、送信の認可、署名の検証を別々に確認してください。ウェブサイトの動作だけでは、メールの各機能を確認できません。

MX は、ホスト名でメール交換サーバーを指定し、優先値を含めます。小さい優先値が優先します。架空の `example.com` の MX は、優先値 `10` で `mail.example.net` を指定できます。値は IP アドレスではなくホスト名です。[RFC 1035 の 3.3.9 節](https://www.rfc-editor.org/rfc/rfc1035.html#section-3.3.9)が両方の項目を定義しています。

受信準備の完了前に、メール交換サーバーのアドレスレコードも確認します。ホスト名はアドレスに解決する必要があり、CNAME にしてはいけません。[RFC 2181 の 10.3 節](https://www.rfc-editor.org/rfc/rfc2181.html#section-10.3)が参照先の制限を定めています。

ウェブサイトの移行では、関連するアドレスにも注意が必要です。既存の MX が `mail.example.com` を参照し、その名前に専用の A があるなら、ウェブサイトの変更時もメール用の A を維持してください。MX がゾーン頂点を参照する場合、頂点のアドレス変更はメールの配送先も変えます。

TXT は、別のプロトコルが解釈するテキストを格納します。タイプだけでは用途を判別できません。事業者の確認トークンと送信ポリシーは、同じ名前の別々の TXT に格納できます。利用サービスが該当するデータを選びます。[RFC 1035 の 3.3.14 節](https://www.rfc-editor.org/rfc/rfc1035.html#section-3.3.14)が入れ物としての形式を定義しています。

SPF は TXT で送信の認可を公開します。管理画面に旧来の SPF タイプが残っていても、標準は TXT を要求します。SPF ポリシーを二つ公開すると、複数の SPF レコードを選ぶことを禁じる規則により認可確認が失敗する場合があります。既存のポリシーに正規の送信元をまとめ、メール管理者と結果を確認してください。[RFC 7208 の 3.1～3.2 節](https://www.rfc-editor.org/rfc/rfc7208.html#section-3.1)が公開規則を定めています。

DKIM は、セレクターと署名ドメインから公開鍵を探します。問い合わせ先の例は `selector1._domainkey.example.com` です。事業者は TXT を直接要求する場合も、別名による設定を指定する場合もあります。指定された所有者名とタイプを維持してください。[RFC 6376 の 3.6.2 節](https://www.rfc-editor.org/rfc/rfc6376.html#section-3.6.2)が鍵の取得を説明しています。

| 作業 | レコード | 依存関係 |
| --- | --- | --- |
| メールを受信する | MX | 交換サーバーのアドレス |
| 送信元を認可する | SPF 用の TXT | 有効なポリシー |
| 署名を検証する | DKIM の鍵取得 | 正しいセレクター |
| サービスの管理権限を確認する | 指定された TXT/CNAME | 正確な確認用データ |

確認用レコードは、利用サービスが定める確認手順だけを満たします。継続的な確認を要求するサービスでは、レコードを維持してください。古いトークンを削除する前に、要求元のサービスとアカウントを特定します。

復旧時は、現在のゾーンと保存済みの設定を比較します。送信ポリシーの変更前に、受信の配送を確認してください。送信は別に試し、受信側の認証結果を調べます。[独自ドメインのメール設定ガイド](/ja/blog/set-up-email-with-your-own-domain/)は、設定全体を扱います。

## 権威とポリシーのレコードは異なる判断を管理します

![NS、SOA、CAA は権威サーバー、ゾーン管理、証明書発行を分担します。](../../assets/dns-record-types-guide-03-authority-policy.jpg)

[DNS](/ja/glossary/dns/) レコードを利用するには、リゾルバーが正しい権威サービスへ到達する必要があります。NS は権威を持つ[ネームサーバー（NSレコード）](/ja/glossary/nameserver/)を示します。親ゾーンは委任情報を公開し、子ゾーンは頂点の NS を公開します。権威の移行では両側を連携させてください。[RFC 1034 の 4.2.1 節](https://www.rfc-editor.org/rfc/rfc1034.html#section-4.2.1)がゾーン境界を説明しています。

既存ゾーン内の NS を編集しても、親の委任は自動的に変わりません。登録ドメインでは、レジストラのネームサーバー変更手順で委任を更新します。委任されたサブドメインでは、親ゾーン管理者との連携が必要です。

ゾーン内のネームサーバーを調べるために同じネームサーバーが先に必要になる場合、グルーレコードがアドレスを補います。`ns1.example.com` への架空の委任が循環する依存関係の例です。ネームサーバーのアドレス変更は、通常のウェブサイト用レコードと区別して親管理者と調整してください。[RFC 1034 の 4.2.1 節](https://www.rfc-editor.org/rfc/rfc1034.html#section-4.2.1)がグルーの役割を説明しています。

SOA は、シリアル番号や時間設定などのゾーン管理情報を含みます。Cloudflare は、自社の権威ネームサーバーを使うゾーンに SOA を自動作成します。[Cloudflare の SOA 文書](https://developers.cloudflare.com/dns/manage-dns-records/reference/dns-record-types/#soa)が事業者の方針を説明しています。手動編集の前に、事業者の管理方法を確認してください。シリアル番号の比較は複製の調査に役立ちますが、必要な全レコードの存在を証明しません。[RFC 1035 の 3.3.13 節](https://www.rfc-editor.org/rfc/rfc1035.html#section-3.3.13)が SOA を定義しています。

[DNSSEC（ドメインネームシステム・セキュリティ拡張）](/ja/glossary/dnssec/)は、公開鍵に DNSKEY、署名に RRSIG、委任と子の鍵の接続に DS を使います。NSEC は、データが存在しないことの認証用データを提供します。各レコードは検証を支え、ウェブサイトの提供やメール配送は行いません。[RFC 4034 の 2～5 節](https://www.rfc-editor.org/rfc/rfc4034.html#section-2)が役割を定義しています。

事業者の変更時は、DNSSEC の関連設定を連携させてください。移行先の署名手順と、親の DS を確認します。アドレスだけをコピーし、信頼関係を見落とすと、別の依存関係が未解決のまま残ります。

CAA は、ドメイン保有者が証明書発行の認可を指定する仕組みです。準拠する認証局は、発行前に該当する CAA レコード集合を確認します。親の名前や別名の名前解決も、CAA ポリシーに関係します。要求したホスト名だけでなく、適用されるポリシーを調べてください。[RFC 8659 の 3 節](https://www.rfc-editor.org/rfc/rfc8659.html#section-3)が検索規則を定めています。

CAA は、証明書の設置やウェブサイトの接続先指定を行いません。移行後に発行が失敗したら、発行元の認証局と有効な CAA ポリシーを比較します。証明書の処理とアドレスの変更を分けて調査してください。

SRV は、優先度、重み、ポート、参照先ホスト名を使ってサービス検出情報を提供します。対応する検出手順を実装したアプリケーションだけが SRV を利用します。参照先にはアドレスレコードが必要で、別名にはできません。[RFC 2782 の「The format of the SRV RR」](https://www.rfc-editor.org/rfc/rfc2782.html)が依存関係を定義しています。

PTR は、逆引き DNS 名から別の名前を指定します。逆引きゾーンは、アドレス割り当ての境界に従います。変更はアドレス空間の管理者やホスティング事業者と調整してください。通常の正引きゾーンに PTR のような行を追加しても、アドレスの逆引き委任は変わりません。[RFC 1035 の 3.5 節](https://www.rfc-editor.org/rfc/rfc1035.html#section-3.5)が IPv4 の逆引きを説明しています。

## 計画的な変更はレコードを保存し依存関係を確認します

![ゾーンの記録、編集、DNS とアプリケーションの確認を順に進めます。](../../assets/dns-record-types-guide-04-change-verification.jpg)

編集前にゾーンを書き出すか、正確なレコード一覧を保存してください。所有者名、タイプ、値、TTL を含めます。各サービスの担当者と用途も記録すると、不明なトークンの誤削除を防げます。

変更の目的を一つずつ明確にします。ウェブサイトの移行では A、AAAA、別名の変更が必要になる場合があります。メールの移行では MX と認証の更新が必要です。DNS 事業者の移行では、ゾーンの再現と権威・検証の連携が必要です。

管理画面の正確な所有者名を確認してください。相対ラベルを要求する画面も、完全な名前を受け付ける画面もあります。保存前に、結果となる完全な名前を確認します。確認用の名前やサービス検出名のアンダースコアには特に注意してください。

[TTL（Time to Live）](/ja/glossary/ttl/)は、プロトコルの規則に従ってリゾルバーがデータをキャッシュできる期間を定めます。TTL を短くしても、以前の TTL で保存済みの応答の期間は短くなりません。古いキャッシュ期間を考慮して事前に計画してください。[RFC 2181 の 8 節](https://www.rfc-editor.org/rfc/rfc2181.html#section-8)が TTL の上限を説明しています。

存在しないという応答もキャッシュできます。公開直前に名前やタイプが存在しないと取得したリゾルバーは、公開後も古い結果を返す場合があります。[RFC 2308 の 5 節](https://www.rfc-editor.org/rfc/rfc2308.html#section-5)がネガティブキャッシュを定義しています。「反映には必ず何時間かかる」と一律に約束しないでください。

変更履歴には、旧値、新値、対象サービスを記録します。変更時刻と各確認結果も残してください。記録があれば、同僚は移行の未完了と、その後の予期しない編集を区別できます。

保存後は、各権威サーバーへ正確な名前とタイプを問い合わせます。続いて、再帰リゾルバーの応答と比較します。権威データが正しく再帰応答が古い場合と、権威サーバー自体が誤った値を公開する場合では、調査の対象が異なります。

最後にアプリケーションを確認します。ウェブサイトの両方のホスト名、必要なアドレスファミリー、メールの送受信、必要に応じた証明書発行を確認してください。DNS の調査は公開された指示を確認します。アプリケーションの確認は、サービスが指示に従って動作するかを確かめます。

失敗した場合は、原因となった特定のレコードを保存済みの値に戻してください。無関係な動作中のレコードは維持します。可能であれば、検証が終わるまで以前のサービスを残してください。正確な一覧があれば、復旧を推測ではなく明確な操作として実行できます。

## 次の出典はレコード選択の説明を裏付けます

- IETF — [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034.html)、3.6.2 節と 4.2.1 節：別名、ゾーン、委任、グルー。2026年10月21日取得。
- IETF — [RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html)、3.3.9～3.3.14 節、3.4.1 節、3.5 節：MX、NS、SOA、TXT、A、逆引き。2026年10月21日取得。
- IETF — [RFC 2181](https://www.rfc-editor.org/rfc/rfc2181.html)、8 節と 10 節：TTL、CNAME の制約、交換サーバーの参照先。2026年10月21日取得。
- IETF — [RFC 3596](https://www.rfc-editor.org/rfc/rfc3596.html#section-2)、2 節：AAAA レコード。2026年10月21日取得。
- Cloudflare — [CNAME フラット化](https://developers.cloudflare.com/dns/cname-flattening/#how-it-works)、「How it works」と「Aspects to keep in mind」。2026年10月21日取得。
- Cloudflare — [DNS レコードタイプ](https://developers.cloudflare.com/dns/manage-dns-records/reference/dns-record-types/#soa)、「SOA」：SOA の自動作成と管理。2026年10月21日取得。
- IETF — [RFC 9460](https://www.rfc-editor.org/rfc/rfc9460.html#section-2)、2～3 節：SVCB、HTTPS、別名モード。2026年10月21日取得。
- IETF — [RFC 7208](https://www.rfc-editor.org/rfc/rfc7208.html#section-3)、3.1～3.3 節：SPF の公開と複数レコード。2026年10月21日取得。
- IETF — [RFC 6376](https://www.rfc-editor.org/rfc/rfc6376.html#section-3.6.2)、3.6.2 節：DKIM の鍵取得。2026年10月21日取得。
- IETF — [RFC 4034](https://www.rfc-editor.org/rfc/rfc4034.html)、2～5 節：DNSSEC レコードと CNAME の管理データ例外。2026年10月21日取得。
- IETF — [RFC 8659](https://www.rfc-editor.org/rfc/rfc8659.html#section-3)、3 節：CAA の処理。2026年10月21日取得。
- IETF — [RFC 2782](https://www.rfc-editor.org/rfc/rfc2782.html)、「The format of the SRV RR」：項目と参照先の制限。2026年10月21日取得。
- IETF — [RFC 2308](https://www.rfc-editor.org/rfc/rfc2308.html#section-5)、5 節：ネガティブキャッシュ。2026年10月21日取得。
- IANA — [DNS リソースレコードタイプ](https://www.iana.org/assignments/dns-parameters/dns-parameters.xhtml#dns-parameters-4)：登録済みタイプ名と専門的な割り当て。2026年10月21日取得。
- IETF — [RFC 2606](https://www.rfc-editor.org/rfc/rfc2606.html#section-3)、3 節：予約済みの例示用ドメイン。2026年10月21日取得。
- IETF — [RFC 5737](https://www.rfc-editor.org/rfc/rfc5737.html#section-3)、3 節：文書用 IPv4 アドレス範囲。2026年10月21日取得。
- IETF — [RFC 3849](https://www.rfc-editor.org/rfc/rfc3849.html#section-2)、2 節：文書用 IPv6 プレフィックス。2026年10月21日取得。
