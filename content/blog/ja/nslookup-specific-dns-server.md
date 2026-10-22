---
title: 'nslookupでは第2引数でDNSサーバーを指定します'
description: 'nslookupでDNSサーバーとレコードの種類を指定し、応答の比較、権威データの確認、DNSエラーの切り分けを行う手順を説明します。'
date: '2026-10-21'
language: ja
tags: ['dns', 'networking', 'troubleshooting', 'guide']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-basics
keywords: ['nslookup DNSサーバ 指定', 'nslookup サーバ指定', 'nslookup 第2引数', 'Windows nslookup', 'BIND nslookup', 'nslookup レコード種類', 'nslookup 権威DNSサーバー', 'nslookup NXDOMAIN', 'nslookup SERVFAIL', 'nslookup タイムアウト', 'DNS 応答比較', 'nslookup TCP']
ogImage: ../../assets/nslookup-specific-dns-server-og.jpg
relatedArticles:
  - /ja/blog/fully-qualified-domain-name/
  - /ja/blog/choose-public-dns-resolver/
  - /ja/blog/reverse-dns-ptr-records/
  - /ja/blog/aaaa-record-explained/
  - /ja/blog/dns-is-the-control-plane/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/dns-resolver/
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

特定のDNSサーバーに問い合わせるには、名前の後にサーバーのアドレスを指定します。構文は `nslookup -type=A example.com. SERVER_IP` です。
`SERVER_IP` を調査対象のDNSサーバーのアドレスに置き換えてください。
名前が先で、サーバーが後です。
MicrosoftはWindows向けに、ISCはBINDのnslookup向けに、同じ引数の順序を説明しています。
[Microsoftのコマンドリファレンス](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup#remarks)でWindowsの構文を確認できます。

サーバーの指定によって、「特定の名前とレコードの種類に対して、特定のサーバーが何を返すか」という調査の目的が明確になります。
検索が成功しても、すべての利用者が同じ応答を受け取るとは限りません。
検索が失敗しても、ドメインが消失したと即断することはできません。

本記事では、対象を明確にした読み取り専用の[DNS](/ja/glossary/dns/)問い合わせを扱います。
掲載するコマンドは構文と診断方法の例であり、実測結果ではありません。
`192.0.2.53` などの文書用アドレスは架空のサーバーを表すため、実際のテストでは置き換えてください。

## サーバーとレコードの種類を明示するとテスト条件が定まります

![サーバーとレコードの種類を指定してDNSに問い合わせる構成図。](../../assets/nslookup-specific-dns-server-01-explicit-query.jpg)

まず、条件を明示した問い合わせを実行します。

```text
nslookup -type=A example.com. 192.0.2.53
```

`example.com.` は問い合わせる名前、`A` はIPv4アドレスのレコード、`192.0.2.53` は選択したサーバーを表します。
名前の末尾のピリオドは、その名前が絶対名であることを示します。
末尾のピリオドによって、検索サフィックスの追加で意図した名前が変わることを防げます。
Microsoftは[nslookupの解説](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup#remarks)でサフィックスの処理を説明しています。

サーバー自身の名前解決に問題がある可能性を考える場合は、サーバーのIPアドレスを直接指定します。
サーバー名を指定すると、問い合わせの送信前にサーバー名のアドレス解決が必要になります。
たとえば、`nslookup example.com. ns1.example.net.` は、先に `ns1.example.net.` を解決する処理に依存します。
Microsoftの[serverコマンドの説明](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-server)によると、対話モードの `server` は現在のサーバーを使って指定した名前を検索します。

サーバーのアドレスは、確定した設定やプロバイダーの記録から確認してください。
ネームサーバーの名前からアドレスを推測しないでください。
管理者が1つのサーバー名に複数のアドレスを提示した場合は、使用したアドレスも記録します。
アドレスを記録しないと、同じ条件に見えるテストが別の接続先に届く場合があります。

種類を省略したコマンドが動作しても、レコードの種類を明示してください。
Microsoftは[Windowsの既定の問い合わせ種類をA](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-type#parameters)としています。
現行の[BINDのnslookupマニュアル](https://bind9.readthedocs.io/en/latest/manpages.html#nslookup-query-internet-name-servers-interactively)は、既定でA、続いてAAAAを検索すると説明しています。
BINDでは、別の種類を明示すると、その種類だけを問い合わせます。
インストールしたバージョンによって動作が異なる場合があるため、種類を明示すると比較条件が明確になります。

調査するサービスに合わせて種類を変えます。

```text
nslookup -type=AAAA example.com. 192.0.2.53
nslookup -type=MX example.com. 192.0.2.53
nslookup -type=TXT example.com. 192.0.2.53
```

Aレコードのテストでは、メール用のレコードの存在を確認できません。
`example.com.` のTXT検索では、`_verify.example.com.` の確認用レコードの存在を確認できません。
確認用レコードを調べる前に、サービスの説明にある正確な所有者名を記録してください。
[レコードの種類のリファレンス](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-type#parameters)は、Windowsでの種類の指定方法を説明しています。

問い合わせを繰り返す場合は、サーバーを指定して対話モードを開始できます。

```text
nslookup - 192.0.2.53
set type=A
example.com.
set type=MX
example.com.
exit
```

最初の行をシェルで実行し、残りの行をnslookupのプロンプトで入力します。
選択した種類は、別の `set type` コマンドで変更するまで同じセッション内で続きます。
対話セッションでは、設定を明確に記録する必要があります。
問い合わせ先への報告では、種類を明示した個別のコマンドを使うと結果を再現しやすくなります。

実装をまたいで使える一般的なコマンドでも、すべてのサブコマンドが共通するとは限りません。
BINDのマニュアルは、過去のサブコマンドの一部を未実装としています。
Windows向けの大きな診断スクリプトを採用する前に、使用中の実装を確認してください。

## サーバーの役割によって応答から分かる内容が変わります

![再帰リゾルバーと権威DNSサーバーの役割を比較した図。](../../assets/nslookup-specific-dns-server-02-server-roles.jpg)

[DNSリゾルバー（再帰的リゾルバー）](/ja/glossary/dns-resolver/)は、利用できるデータを使い、必要に応じて追加の検索を行って再帰要求に応答します。
権威[ネームサーバー（NSレコード）](/ja/glossary/nameserver/)は、自身が権限を持つゾーンに応答します。
サーバーを明示しても、再帰応答が権威応答に変わるわけではありません。
[RFC 1035の4.1.1節](https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1)は、DNSヘッダーで権威と再帰を区別しています。

調査の目的に応じてサーバーを選びます。

| 調べる内容 | サーバー | 比較対象 |
| --- | --- | --- |
| 現在のネットワークが解決する内容 | 設定済みのリゾルバー | 利用を許可された別のリゾルバー |
| ゾーンが公開する内容 | 確認済みの権威サーバー | 別の権威サーバー |
| 内部向けの応答との差 | 内部リゾルバー | 対応する外部向けの応答 |
| 特定の接続先での障害 | 接続先のIPアドレス | 確認済みの別の接続先 |

架空のゾーンについて、管理者が再帰リゾルバーとして `192.0.2.53`、権威サーバーとして `198.51.100.53` を指定したとします。
両方が同じAレコードを返しても、アドレスごとの診断上の役割は異なります。
テスト記録では、各アドレスに役割を添えてください。

権威サーバーへ直接問い合わせる場合は、再帰を要求しない設定を明示できます。

```text
nslookup -
server 198.51.100.53
set norecurse
set type=A
example.com.
exit
```

Microsoftの[再帰設定のリファレンス](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-recurse)は、`set norecurse` が再帰要求を無効にすると説明しています。
設定を変えても、無関係なゾーンに対する権限をサーバーが得るわけではありません。
問い合わせたゾーンを担当しないサーバーは、参照先を返したり、要求を拒否したりする場合があります。

NS検索は、権威ネームサーバーの候補を見つける手掛かりになります。

```text
nslookup -type=NS example.com. 192.0.2.53
```

委任の問題を調査する場合は、検索結果を手掛かりとして扱ってください。
直接問い合わせる接続先を選ぶ前に、候補名を意図したDNS設定と照合します。
リゾルバーからのNS応答には、キャッシュ済みの情報が含まれる場合があります。
誤ったプロバイダーへの直接問い合わせでは、意図したプロバイダーの現在の公開内容を確認できません。

権威を示す情報は、プロトコル上の情報として読み取ります。
非権威応答が誤った応答とは限りません。
権威応答フラグは問い合わせ名に対する権威を示し、再帰フラグは再帰の動作を示します。
[RFC 1035のヘッダー定義](https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1)は、両者の意味を分けています。

架空の例として、アドレスを `192.0.2.10` から `192.0.2.20` へ変更したとします。
確認済みの権威サーバーは新しいアドレスを返し、再帰リゾルバーは以前のアドレスを返したとします。
比較結果は、再帰経路のキャッシュを調べる根拠になります。
比較結果だけでは、すべての権威サーバーの一致や、すべてのリゾルバーの同時更新を証明できません。

## 条件をそろえた比較によって意味のある差を調べられます

![名前と種類をそろえて複数のDNSサーバーの応答を比較する図。](../../assets/nslookup-specific-dns-server-03-controlled-comparison.jpg)

変更する条件は一度に1つにします。
リゾルバーを比較する場合は、名前と種類をそのままにして、サーバーのアドレスだけを変えます。

```text
nslookup -type=A www.example.com. 192.0.2.53
nslookup -type=A www.example.com. 192.0.2.54
```

UTC時刻、ネットワーク接続、問い合わせ名、種類、サーバーのアドレス、結果を記録してください。
支援を依頼する場合は、出力全体を保存します。
応答のアドレスだけをコピーすると、問い合わせたサーバーと種類が分からず、原因の候補を絞れません。

表示順ではなく、レコードの集合を比較します。
2つのアドレスを公開する架空のサービスで、表示順が逆になってもレコードの変更を意味しません。
同様に、値を比較する前に問い合わせた所有者名を比較してください。
ゾーンの頂点と `www` では、問い合わせの内容が異なります。

次に、確認済みの権威サーバーへ同じ問い合わせを行います。
権威サーバー間で応答が異なる場合は、利用者側のリゾルバーを原因と決める前に、DNSプロバイダーの公開内容を調べます。
権威サーバー間の応答が一致すれば、再帰リゾルバー間の比較が役立ちます。
結論は、実施したテストで裏付けられる範囲に限定してください。

キャッシュには、以前の正常な応答以外も含まれます。
[RFC 2308の5節](https://www.rfc-editor.org/rfc/rfc2308.html#section-5)は、否定応答のキャッシュを定めています。
管理者がレコードを追加した後も、リゾルバーが以前の不存在の応答を保持する場合があります。
対象となる[TTL（Time to Live）](/ja/glossary/ttl/)はキャッシュ済みの応答によって決まるため、すべてに共通する待機時間を想定しないでください。

架空の確認作業で、管理者がTXTレコードを作成する前に `_verify.example.com.` を検索したとします。
後から権威サーバーへTXTを問い合わせると成功しても、元のリゾルバーは不存在を返し続ける場合があります。
両方の結果と時刻を保存してください。
複数のDNS設定を同時に変えず、該当するキャッシュ期間の後に同じ検索を繰り返します。

内部と外部の応答にも、背景の確認が必要です。
内部リゾルバーと外部リゾルバーが、同じ名前に対して意図的に異なる応答を提供する場合があります。
すべての差を古いデータと判断する前に、意図的な違いの可能性を調べます。
[企業ネットワークのDNSに関する記事](/ja/blog/dns-over-https-vs-enterprise-split-horizon-dns/)では、その構成を扱っています。

アプリケーションのテストとDNSのテストを分けます。
Aレコードの応答では、HTTPS証明書やHTTPリダイレクトをテストできません。
MXレコードの応答では、メール配送の成功を証明できません。
DNS応答が意図した設定と一致したら、実際の接続経路で対象のアプリケーションをテストしてください。

支援依頼には、観測結果と、観測結果で裏付けられる結論を書きます。
たとえば、「リゾルバーAは以前のAレコードを返しました。
権威サーバーBは記録した時刻に意図したAレコードを返しました」と記録します。
全体的な障害や更新の完了を断定せずに、担当者が次の確認を選べる記述になります。

エスカレーションする前に、比較結果を短い障害記録にまとめます。
まず、期待するレコードと、承認済みの設定変更など、期待の根拠を書きます。
次に、各接続先の観測結果を並べます。
別の担当者がどちらも検証できるように、期待と観測を分けてください。

最後に成功したテストの情報がある場合は、障害記録に含めます。
最初の苦情から変更時刻を推測しないでください。
顧客の報告が示す時刻は、問題に気付いた時刻であり、DNSデータが変わった時刻とは限りません。
画面画像とコマンドでレコードの所有者名が異なる場合は、プロバイダーへの調査依頼前に名前を照合します。

架空のメール障害では、特定のメールホストのアドレスを調べる前に、ドメインのMX応答を比較します。
メールの宛先が存在しない問題と、特定済みの宛先のアドレス解決の問題を分けやすくなります。
メール配送のテストは別の結果として記録してください。

## ポートと通信方式を記録するとタイムアウトの調査範囲を絞れます

![同じDNS問い合わせを同じサーバーにUDPポート53またはTCPポート53で送る構成図。](../../assets/nslookup-specific-dns-server-05-transport.jpg)

サーバーのアドレスだけでは、テスト条件のすべてを表せません。
問い合わせがタイムアウトした場合は、宛先ポートと通信方式を記録してください。
Microsoftは[既定のTCP/UDP DNSポートを53](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-port)と説明しています。
別のポートは、サーバー管理者が設定を確認した場合だけ使用します。

条件をそろえてTCPをテストするには、新しい対話セッションを開始します。

```text
nslookup - 192.0.2.53
set type=A
set port=53
set vc
example.com.
exit
```

最初の行はシェルからnslookupを起動します。
残りの行は、名前を送信する前に、種類、ポート、TCP通信を指定します。
Microsoftは[TCPの指定を仮想回線と呼んでいます](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-vc)。
実装をまたいでセッション設定を使う前に、インストールしたBINDのマニュアルを確認してください。

同じアドレス、名前、種類、ポートに対する先ほどの問い合わせと結果を比較します。
TCPは成功して、先ほどの問い合わせはタイムアウトした場合は、DNSレコードを編集する前に通信方式ごとの到達性を調べます。
比較結果だけでは、差を生んだファイアウォールや接続先を特定できません。
[RFC 9520の3.1節](https://www.rfc-editor.org/rfc/rfc9520.html#section-3.1)は、別のDNS通信方式を異なる再試行経路として扱っています。

サーバーの選択が影響する対象は、nslookupのテストです。
コマンドの結果から、ブラウザーや別のアプリケーションが使うリゾルバーは確定できません。
復旧を報告する際も、アプリケーションのテストを別途記録してください。

## エラーの種類によって次の復旧確認を選べます

![DNSエラーの種類と次に確認する内容を示す図。](../../assets/nslookup-specific-dns-server-04-dns-error-decisions.jpg)

ドメイン設定を変える前に、応答の種類を読み取ります。
空の応答、否定応答、応答のない要求では、必要な調査が異なります。
[RFC 9520の2節](https://www.rfc-editor.org/rfc/rfc9520.html#section-2)は、有用な否定応答と名前解決の失敗を区別しています。

**[NXDOMAINは、返されたDNSの応答範囲で問い合わせ名が存在しないことを意味します](/ja/blog/fix-dns-probe-finished-nxdomain/)。**
つづり、検索サフィックス、選択したサーバー、正確な所有者名を確認してください。
応答にCNAMEチェーンがある場合は、最後の別名の参照先が存在しない可能性があります。
[RFC 2308の用語と名前エラーの説明](https://www.rfc-editor.org/rfc/rfc2308.html#section-2.1)は、その違いを説明しています。

**NODATAは、名前は存在するものの、要求した種類のレコードがないことを意味します。**
AAAAレコードがなくても、Aレコードがないとは限りません。
NODATAは応答の解釈であり、独立したDNS応答コードではありません。
レコードを作成または置き換える前に、要求した種類を確認してください。
[RFC 2308の2.2節](https://www.rfc-editor.org/rfc/rfc2308.html#section-2.2)は応答の構造を説明しています。

**SERVFAILは、サーバーが問い合わせを完了できなかったことを意味します。**
リゾルバーから上流への経路、権威サーバーの利用可否、検証の診断情報を調べます。
SERVFAILを、問い合わせた名前を登録できる根拠として扱わないでください。
[RFC 9520](https://www.rfc-editor.org/rfc/rfc9520.html#section-2.1)は、サーバー障害と複数の原因を説明しています。

[DNSSEC（ドメインネームシステム・セキュリティ拡張）](/ja/glossary/dnssec/)の検証失敗によって、リゾルバーが利用可能なデータを返せなくなる場合もあります。
権威応答だけでは、検証を行うリゾルバーが応答を検証できると証明できません。
権威サーバーへの直接テストが成功しても検証リゾルバーが失敗する場合は、安全対策を無効にする前に検証の診断情報を求めます。
[RFC 9520の2.6節](https://www.rfc-editor.org/rfc/rfc9520.html#section-2.6)は、検証失敗を扱っています。

**タイムアウトは、クライアントが待機時間内に応答を受け取れなかったことを意味します。**
接続先のIPアドレスと、現在のネットワークが対象のDNS通信を許可するかを確認します。
同じ問い合わせを、確認済みの別の接続先に送信してください。
タイムアウトを長くしても、誤ったアドレスや遮断された経路は直りません。
[RFC 9520のタイムアウトの説明](https://www.rfc-editor.org/rfc/rfc9520.html#section-2.3)は、応答がない状態とDNS応答を区別しています。

**REFUSEDは、サーバーが要求を拒否したことを意味します。**
現在のネットワークからの再帰要求をサーバーが許可するか、問い合わせたゾーンをサーバーが担当するかを確認します。
再帰テストには利用を許可されたリゾルバーを使い、ゾーンのテストには確認済みの権威サーバーを使います。
[RFC 9520の2.2節](https://www.rfc-editor.org/rfc/rfc9520.html#section-2.2)は、ポリシーに関係する事例を説明しています。

必要な修正後は、最初に失敗した問い合わせを繰り返して調査を終えます。
修正前後を比較できるように、サーバー、所有者名、種類をそろえてください。
続いてアプリケーションを別途テストします。
調査の成果は、特定の問いに対する記録済みの答えと、別の担当者が結果を再現できる情報です。

## 参考資料が構文と診断の根拠を示します

- Microsoft Learn、[nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup)。「Remarks」とエラー表。2026年10月21日取得。
- Microsoft Learn、[nslookup set type](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-type)。「Syntax」と「Parameters」。2026年10月21日取得。
- Microsoft Learn、[nslookup server](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-server)。冒頭の説明と「Syntax」。2026年10月21日取得。
- Microsoft Learn、[nslookup set recurse](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-recurse)。「Parameters」。2026年10月21日取得。
- ISC、[BINDのnslookupマニュアル](https://bind9.readthedocs.io/en/latest/manpages.html#nslookup-query-internet-name-servers-interactively)。「Arguments」と「Interactive Commands」。2026年10月21日取得。
- RFC Editor、[RFC 1035](https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1)。4.1.1節、ヘッダーフラグと応答コード。2026年10月21日取得。
- RFC Editor、[RFC 2308](https://www.rfc-editor.org/rfc/rfc2308.html)。1節、2.1節、2.2節、5節、否定応答とキャッシュ。2026年10月21日取得。
- RFC Editor、[RFC 9520](https://www.rfc-editor.org/rfc/rfc9520.html#section-2)。2.1～2.6節、名前解決が失敗する条件。2026年10月21日取得。
- Microsoft Learn、[nslookup set port](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-port)。既定のポートと構文。2026年10月21日取得。
- Microsoft Learn、[nslookup set vc](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup-set-vc)。仮想回線の指定。2026年10月21日取得。
