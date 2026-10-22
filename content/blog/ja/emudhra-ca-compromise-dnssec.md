---
title: "eMudhra の CA 侵害はドメインの保護に HTTPS 以外の対策も必要だと示す"
date: '2026-10-22'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
format: explainer
description: "eMudhra の CA 鍵侵害、ウェブサイトのなりすましリスク、DNSSEC、DANE、CAA、CT が提供する異なる保護を解説する。"
keywords: ["eMudhra", "emSign", "CA 侵害", "認証局", "中間認証局", "MITM", "DNSSEC", "DANE", "CAA", "証明書の透明性", "TLS 証明書", "ドメインセキュリティ"]
relatedArticles:
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/the-curve-finance-dns-hijack/
  - /ja/blog/dns-on-tokenized-domains/
  - /ja/blog/dnssec-for-domain-owners/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/certificate-authority/
  - /ja/glossary/intermediate-ca/
  - /ja/glossary/man-in-the-middle-attack/
  - /ja/glossary/dnssec/
  - /ja/glossary/dane/
---

ウェブサイトは、なりすまし相手との接続も暗号化できる。暗号化だけでは、接続先を誰が管理しているかを確認できない。

eMudhra の事件を受け、ドメイン所有者、創業者、Web3 チームは暗号化と認証の違いを早急に理解する必要がある。2026 年 10 月 20 日、Google と Mozilla は、中間認証局の鍵の侵害に対する緊急対応を公表した。脆弱な鍵生成が、ウェブサイトの証明書を偽造する経路を生んだ。影響を受けた鍵を引き続き信頼するクライアントは、なりすましの危険にさらされた。[Google が不具合とブロック措置を説明している](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/)。

**状況の確認日：2026 年 10 月 22 日。** 調査は続いている。鍵の侵害が確認されても、攻撃者が顧客の通信を傍受したことを意味しない。

## 事件は個々のウェブサイトより上位の署名権限の危険を示した

[認証局](/ja/glossary/certificate-authority/)、つまり CA は、身元情報と公開鍵を関連付けるデジタル証明書を発行する。HTTPS では、証明書が、サーバーが認証可能なドメイン名を示す。CA は証明書に署名する前に、適用される身元確認要件を確認する。ブラウザーは証明書チェーンと、対応する秘密鍵をサーバーが保有する証明を確認する。[RFC 5280 が証明書モデルを説明している](https://www.rfc-editor.org/rfc/rfc5280#section-3.2)。

ルート CA は信頼アンカーを提供する。[中間認証局](/ja/glossary/intermediate-ca/)は、ルートより下位で委任された署名権限を持つ。ウェブサイトの証明書は、通常、中間認証局の下位に位置する。ウェブサイトの鍵の侵害は、該当する証明書の身元情報を脅かす。中間鍵の侵害は、証明書の制約やクライアントの検査に応じて、多数の無関係なドメインを脅かす可能性がある。

Mozilla の[事件記録は、影響を受けた中間証明書を八つ挙げている](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0)。六つは TLS 用、二つはコード署名用である。Mozilla は脆弱な秘密鍵を独自に復元した。eMudhra は 10 月 18 日に証明書を失効済みとした。これらの事実は鍵生成の不具合を示しており、何者かがすべての顧客の秘密鍵を盗んだ証拠ではない。

[10 月 21 日の声明](https://emudhra.com/en/post/certificate-security-incident#:~:text=During%20the%20ceremony)で、eMudhra は、2025 年 4 月 30 日の鍵生成セレモニーで行ったラップとアンラップの工程を、脆弱な鍵の原因として挙げた。eMudhra は、影響を受けた中間認証局がエンドエンティティ証明書を発行しておらず、公表前の悪用の証拠も見つかっていないと述べた。同社は、正確な根本原因の調査も未完了と述べた。これらは eMudhra の調査結果であり、過去のすべての通信に対する独立した保証ではない。

## ブラウザーの保護措置が実際の危険範囲を変えた

Google によると、Chrome は 10 月 17 日に CRLSet 更新で影響を受けた鍵をブロックした。Google は、ブロック前に、影響を受けた六つの TLS 中間認証局の配下の TLS 証明書が CT に現れなかったとも報告している。そのため、該当する CT 要件を強制するクライアントに対しては、これらの中間認証局による不正な証明書は機能しなかったはずである。Google の勧告は、Chrome を該当するクライアントに含めている。

Mozilla は[同日の夕方に OneCRL のブロックを配布した](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/)。Mozilla は、OneCRL の保護が届かない可能性がある構成向けに Firefox 更新も公開した。ブラウザーの更新は、同じ端末上のすべてのアプリケーションが同じ保護を持つ証拠にはならない。[Cloudflare は、アプリケーションによって証明書検証器が異なる場合があると明確に警告している](https://blog.cloudflare.com/emudhra-certificate-compromise/#:~:text=A%20successful%20browser%20test)。

Google の 10 月 20 日の勧告は、Chrome Root Store の利用クライアント全体で **emSign ECC Root CA - G3** を 2026 年 10 月 27 日の太平洋夏時間に削除すると予定している。Google は、影響を受けるウェブサイトの運用者に、別の信頼される階層へ証明書を移行するよう指示している。運用者は、即時のセキュリティブロックと、後日のルート信頼取り消しに伴うサービス停止を区別する必要がある。

## 中間者攻撃には通信へのアクセスと受け入れられる身元が必要である

[中間者攻撃](/ja/glossary/man-in-the-middle-attack/)、つまり MITM は、攻撃者を通信当事者の間に介在させる。以下は仮想の攻撃であり、観測された eMudhra の悪用事例ではない。

1. 攻撃者が、不正な DNS 応答や他のネットワーク傍受手段で訪問者を誘導する。
2. 攻撃者が、目的のドメインの偽造証明書を提示する。
3. 保護のないクライアントが証明書を受け入れ、攻撃者との TLS 接続を確立する。
4. 攻撃者が正規サービスに通信を中継しながら、アプリケーションデータを読み取る、または変更する。

CA 鍵の保有だけでは通信を自動的に誘導できない。証明書だけで、過去に記録したすべてのセッションを復号できるわけでもない。TLS 1.3 の前方秘匿性は、規定の前提条件の下で、長期認証鍵の後日の侵害から以前のセッションを保護する。[RFC 8446 が違いを説明している](https://datatracker.ietf.org/doc/html/rfc8446#appendix-E.1)。

当サイトの [Fox-IT の事例研究](/ja/blog/the-fox-it-dns-hijack/)は、類似した結果に至る別の経路を扱う。レジストラの侵害が、不正な証明書の取得を可能にした。当サイトの [MyEtherWallet の事例研究](/ja/blog/the-myetherwallet-bgp-dns-attack/)は、経路と DNS の操作を扱う。ドメインのセキュリティは、通信の行き先と接続先の認証の両方に対処する必要がある。

## DNSSEC は DNS 応答を認証するが CA 鍵を修復しない

[DNSSEC（ドメインネームシステム・セキュリティ拡張）](/ja/glossary/dnssec/)は、DNS データにデジタル署名を追加する。検証リゾルバーは、信頼の連鎖を通じて署名を確認する。ゾーンが正しく署名され、検証チェーンが完全なら、攻撃者がアドレス応答を偽造した応答に置き換えると検出できる。[RFC 4033 が保護と制限を定義している](https://datatracker.ietf.org/doc/html/rfc4033#section-3)。

クライアントはローカルで検証するか、検証リゾルバーと、そのリゾルバーへの認証済み接続の両方を信頼する必要がある。[RFC 4033 が最後の区間の要件を説明している](https://datatracker.ietf.org/doc/html/rfc4033#section-7)。

これらの条件の下で、DNSSEC は仮想攻撃の DNS 偽造段階を阻止できる。DNSSEC は、中間認証局を失効させず、HTTPS 証明書を検証せず、ウェブ通信も暗号化しない。別の経路で通信を傍受する攻撃者は、脆弱なクライアントに偽造証明書を提示できる。

署名だけでは、レジストラのアカウントや権威 DNS の管理画面も保護できない。正規の DNS 変更権限を握る攻撃者は、有害なレコードを公開し、プロバイダーに署名させることができる。運用者には、DNSSEC 検証に加え、アカウント保護、変更監視、親ゾーンの正しい DS レコードが必要である。

## クライアントが関連付けを強制すれば DANE はサービス鍵を署名付き DNS に結び付ける

[DANE](/ja/glossary/dane/)は、TLSA レコードを通じて DNSSEC と TLS 認証を結び付ける。ドメイン運用者は、期待する証明書、鍵、または信頼アンカーを署名付き DNS に公開する。対応クライアントは DNSSEC を検証し、TLSA の関連付けを強制する。[RFC 6698 が関連付けを規定している](https://www.rfc-editor.org/rfc/rfc6698#section-2)。

例えば、DANE-EE の用途は、サービスを公開鍵に直接結び付けることができる。無関係な CA 鍵で偽造した証明書は、関連付けを満たさない。この利点には、安全な DNSSEC 検証、正しい TLSA データ、クライアントによる実際の強制が必要である。鍵のローテーションには、TLSA 更新の調整も必要である。[RFC 7671 が運用指針を示している](https://www.rfc-editor.org/rfc/rfc7671#section-5.1)。

TLSA レコードを公開しても、通常のブラウザー利用者を自動的に保護することにはならない。Firefox の [DANE 実装要望は引き続き却下されている](https://bugzilla.mozilla.org/show_bug.cgi?id=1994924)。運用者は、実際に使うクライアントの対応状況を確認する必要がある。DANE には [SMTP のトランスポートセキュリティ](https://www.rfc-editor.org/rfc/rfc7672)向けの標準化された用途がある。

## CAA と CT は異なる証明書管理機能を提供する

| 管理機能 | 保護 | 制限 |
| --- | --- | --- |
| DNSSEC | 検証リゾルバーが署名付き DNS データの真正性を検証する。 | DNSSEC は侵害された CA 鍵を修復しない。 |
| DANE | 対応クライアントが DNSSEC で認証した TLSA の関連付けを確認する。 | クライアントが関連付けを強制する必要がある。 |
| CAA | 仕様に従う CA が、ドメインが許可する発行者を確認する。 | 偽造者は CA の発行手続きを迂回できる。 |
| CT | ログが証明書の発行を可視化し、監視とクライアントのポリシー検査を可能にする。 | ログだけでは、すべての偽造を防ぐことも、すべてのクライアントを保護することもできない。 |

[CAA](/ja/glossary/caa/)は、許可された発行者を DNS に公開する。[RFC 8659 は、発行許可とクライアントの証明書検証を区別している](https://www.rfc-editor.org/rfc/rfc8659#section-1)。盗まれた署名鍵や復元可能な署名鍵があれば、偽造者は CAA の確認を無視できる。

[証明書の透明性](/ja/glossary/certificate-transparency/)、つまり CT は、証明書の発行を公開監査可能にする。監視は予期しない証明書を検出できる。クライアントによる強制は、必要なログ証拠のない証明書を拒否できる。[RFC 9162 がログの仕組みを説明している](https://www.rfc-editor.org/rfc/rfc9162#section-1)。前述の Google の調査結果は、CA の事件で強制が重要になる理由を示している。

## ドメイン運用者は今すぐクライアントの信頼と証明書の依存関係を確認すべきである

- ブラウザー、OS、実行環境、CA パッケージの最新セキュリティ更新をインストールする。
- ウェブサイト、API、モバイルアプリ、コンテナー、TLS 検査ゲートウェイの証明書チェーンを棚卸しする。
- 代替の証明書パスも含め、影響を受けた中間認証局とルート削除に関する提供元の指針に従う。
- 該当クライアントの期限前に、信頼を取り消す階層につながる証明書を交換する。
- 対処後、各アプリケーションが実際に使う TLS 検証器をテストする。
- 証明書検証を有効に保ち、証明書エラーが出たら接続を中止する。
- 正しい DS 委任とともに DNSSEC を有効にし、検証する名前解決を使う。
- CAA で許可する発行者を制限し、CT を監視し、レジストラと DNS のアカウントを保護する。

VPN は通信経路を変えられる。VPN はクライアントの証明書の信頼判断を修復しない。HSTS は HTTPS を要求するが、偽造した HTTPS の身元をクライアントが受け入れると、その保護も破られる。[RFC 6797 が HSTS の安全上の制限を説明している](https://www.rfc-editor.org/rfc/rfc6797#section-14)。

Namefi の読者にとって、ドメイン所有権、DNS 管理、TLS 認証、ウォレットの認可には、それぞれ別の管理策が必要である。ドメインのトークン化は、ブラウザーの CA 信頼を自動的に置き換えず、DNSSEC も自動的に有効にしない。当サイトの[トークン化ドメイン向け DNS ガイド](/ja/blog/dns-on-tokenized-domains/)が、運用上の関係を説明している。当サイトの [Curve Finance の事例研究](/ja/blog/the-curve-finance-dns-hijack/)は、Web3 チームがインターフェースを提供するドメインを守る必要性を示している。

## 一次資料が事件と防御策を記録している

以下の資料はすべて 2026 年 10 月 22 日に参照した。調査の進展に伴い、事件に関する声明が変わる場合がある。

- [Google：Chrome と Android の対応](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/)、2026 年 10 月 20 日。エントロピー、CT、ブロック、ルート削除に関する節。
- [Mozilla：Firefox の対応](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/)、2026 年 10 月 20 日。OneCRL の配布と追加更新。
- [Mozilla の不具合 2083449](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0)、説明とコメント 1。証明書の範囲、独自の鍵復元、失効。
- [eMudhra の事件声明](https://emudhra.com/en/post/certificate-security-incident)、更新 2–4。同社の調査結果と顧客向け移行の選択肢。
- [Cloudflare の事件対応指針](https://blog.cloudflare.com/emudhra-certificate-compromise/)、アプリケーションごとの検証指針。
- [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280#section-3.2)、証明書と信頼パスのモデル。
- [RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446#appendix-E.1)、TLS 1.3 の前方秘匿性。
- [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033#section-3)、DNSSEC の機能、制限、検証。
- [RFC 6698](https://www.rfc-editor.org/rfc/rfc6698#section-2)と [RFC 7671](https://www.rfc-editor.org/rfc/rfc7671#section-5.1)、DANE の関連付けと運用。
- [Mozilla の不具合 1994924](https://bugzilla.mozilla.org/show_bug.cgi?id=1994924)、Firefox の DANE 実装状況。
- [RFC 7672](https://www.rfc-editor.org/rfc/rfc7672)、SMTP 向け DANE。
- [RFC 8659](https://www.rfc-editor.org/rfc/rfc8659#section-1)、CAA の認可と検証の違い。
- [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162#section-1)、CT のログ記録と監視。
- [RFC 6797](https://www.rfc-editor.org/rfc/rfc6797#section-14)、HSTS の安全上の考慮事項。
