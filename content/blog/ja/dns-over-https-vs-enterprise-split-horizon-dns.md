---
title: 'DNS over HTTPS vs エンタープライズ スプリットホライズン DNS：自然解決しない対立'
date: '2026-05-04'
language: ja
tags: ['dns', 'doh', 'enterprise', 'security', 'networking']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-security
format: comparison
description: DNS over HTTPS（DoH）はDNSクエリをHTTPS内で暗号化することでユーザーのプライバシーを保護する。エンタープライズのスプリットホライズン DNS はネットワークがそのクエリを可視化できることを前提としている。この両者の衝突は、企業ネットワーク・ブラウザ・OSにおける名前解決の在り方を大きく変えつつある。
ogImage: ../../assets/dns-over-https-vs-enterprise-split-horizon-dns-og.jpg
keywords: ['DNS over HTTPS', 'DoH', 'スプリットホライズン DNS', 'エンタープライズ DNS', 'DoT', '暗号化 DNS', '内部 DNS', '名前解決', 'namefi']
relatedArticles:
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/the-dnspionage-campaign/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
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

インターネットの歴史の大半において、[DNS](/ja/glossary/dns/) クエリはポート53番を通じて平文で送受信されてきた。ネットワーク経路上にいる者なら誰でもそれを読み取り、記録し、改ざんすることができた。このプライバシー上の問題に対し、IETFはやがて二つの暗号化代替手段を導入した。2016年の [DNS over TLS（DoT、RFC 7858）](https://datatracker.ietf.org/doc/html/rfc7858) と、2018年の [DNS over HTTPS（DoH、RFC 8484）](https://datatracker.ietf.org/doc/html/rfc8484) である。

特にDoHは業界の構図を一変させた。DNSクエリを通常のHTTPSストリームの*内部*に隠してしまうからだ。ネットワーク監視者の目には、DoHクエリはコンテンツサーバーへの通常のTLS接続と区別がつかない。敵対的なカフェのネットワークを使うユーザーにとっては理想的な仕組みだ。しかし、ネットワーク境界を通過するすべてのDNSクエリを「見て、制御する」ことに依存している企業のITチームにとっては、ほとんど好ましくない。

これが今日の対立の構図だ。双方にそれぞれ正当で明確に言語化された要件がある。標準化機関・ブラウザベンダー・OSベンダーは約10年をかけてこの両立を模索してきたが、結果として生まれたのは、2026年に企業ネットワークを運用する者なら誰もが理解しておくべき、不安定な妥協策の積み重ねである。

## DoHが実際に行うこと

DoHクライアントはDNSクエリをHTTPSのPOSTまたはGETリクエストとして送信する。宛先は通常 `https://dns.google/dns-query` や `https://cloudflare-dns.com/dns-query` などの公開リゾルバーだ。応答は通常のHTTPSレスポンスボディとして返ってくる。重要な特性は三つある。

- **転送中の暗号化。** ネットワーク監視者はクエリ名や応答内容を読み取れない。
- **サーバー認証。** クライアントがリゾルバーのTLS証明書を検証するため、中間者攻撃によるなりすましが不可能になる。
- **ウェブトラフィックとの区別不能。** ポート443、TLS 1.3、通常のSNIパターン。フィルタリングに使えるDNS特有のトラフィックが存在しない。

この三番目の特性が対立の本質を定義している。DoTもクエリを暗号化するが、*専用*ポート（853番）を使用するため、ネットワーク側で容易にブロックまたはリダイレクトできる。DoHは選択的にブロックできない。ブロックしようとすれば、通常のウェブブラウジングまで道連れにするほかない。

## エンタープライズのスプリットホライズン DNS が実際に行うこと

大規模組織の多くは**スプリットホライズン DNS**を運用している。同じホスト名（`vpn.example.corp`、`git.example.com`、`intranet.example.com` など）が、クエリの発信元がネットワーク内部か外部かによって、異なるIPアドレスに解決される仕組みだ。

ネットワーク内部では：
- リゾルバーは企業の内部 DNS であり、Active Directory と統合されていることが多い。
- `git.example.com` は `10.0.4.7` のようなプライベートな RFC 1918 アドレスに解決される場合がある。
- 内部専用ゾーン（`example.corp`、`example.internal` など）はパブリックインターネット上に存在しないことがある。
- DLPやセキュリティツールがすべてのクエリを可視化し、既知の悪意あるドメインへのDNSにフラグを立てられる。

ネットワーク外部（または自宅Wi-Fiの個人端末）では：
- 同じクエリが公開リゾルバーに向かう。
- `git.example.com` はパブリックなロードバランサーに解決される。
- 内部専用の名前は単純に解決されない。

これは特殊な構成ではない。数百名規模以上のほぼすべての企業で標準的に採用されている。ここには一つの重要な前提がある。**エンドポイントはDHCP・プッシュポリシー・VPN設定を通じてネットワークから指定されたリゾルバーを使用する**、という前提だ。

DoHはその前提を壊す。ブラウザが独自のリゾルバーを持ち込んだり、OSがシステムリゾルバーを迂回したりすると、エンドポイントは内部DNSへの問い合わせを完全にやめてしまう。内部ホスト名が解決できなくなる。セキュリティツールは、検知に依存していたクエリを見えなくなる。

## ブラウザとOSが取り組んできた対処

ベンダー側もこの問題を見て見ぬふりしてきたわけではない。現在存在する妥協策は多層的で、やや場当たり的だ。

### Chromeの「自動アップグレード」モデル

ChromeのDoH実装は、システムリゾルバーがChromeのDoH対応プロバイダーのホワイトリスト（Google、Cloudflare、Quad9など）に含まれている場合にのみ、そのシステムリゾルバーをDoHへアップグレードする。システムがホワイトリスト外の社内リゾルバーを使うよう設定されている場合、Chromeはそれに手を加えない。エンタープライズポリシーでは [Chromeの `DnsOverHttpsMode`](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode) 設定を使ってDoHを完全に無効化することもできる。

### FirefoxのTRR（Trusted Recursive Resolver）モデル

Firefoxのアプローチはより議論を呼んできた。MozillaがデフォルトでDoHを有効化しているロケールでは、Firefoxは米国ではCloudflareのようなデフォルトリゾルバーを使用するが、DoHを有効化する前にエンタープライズおよびネットワークのヒューリスティックも実行する。重要なシグナルの一つがカナリアドメイン `use-application-dns.net` だ。ローカルリゾルバーが否定的な結果を返すと、Firefoxはデフォルトでリゾルバーが有効化されているユーザーのアプリケーションレベルDNSを無効化する。また、Mozillaはスプリットホライズンに関する重要なニュアンスを文書化している。内部専用の名前はDoHの解決が失敗した場合に通常のDNSへフォールバックできるが、ネットワーク内部で異なる解決を行うパブリック名については、DoHを無効化するためにエンタープライズポリシーが必要だ。

### AppleのEncrypted DNS（iOS 14以降、macOS Big Sur以降）

Appleはアプリや設定プロファイルがシステム全体でDoHまたはDoTをオプトインできるようにしているが、特定のリゾルバーを指定するMDMポリシーには従う。MDM管理下の端末は初期設定のまま正しく動作する。

### Windows ネイティブ DoH

Windows 11以降、およびWindows Server 2022以降では、OS自体がシステムリゾルバーにDoHを使用できる。グループポリシーでDoHを許可・必須・禁止のいずれかに制御でき、WindowsはDoHのサポートが確認されている設定済みDNSサーバーに対してのみDoHを有効化する。これはおそらく最もクリーンなモデルだ。セキュリティチームがポリシーを選択し、OSがそれを強制する。

パターンは明確だ。**単一のアプリ（ブラウザ）内に収まるDoHはネットワーク側から制御しにくく、OSレベルのリゾルバーに組み込まれたDoHは通常のMDMチャネルで制御可能**だ。IETFとOSベンダーは概ね、ポリシーはOSレイヤーに属するという方向で合意している。

## 2026年における企業の現実的な選択肢

上記のツール群を踏まえると、実行可能な戦略は三つあり、そして機能しない戦略が一つある。

### 戦略A：完全内部化・DoHブロック

すべてのブラウザでDoHを無効化するポリシーを展開し、公知の公開DoHエンドポイントへのポート443をブロックし、すべてのDNSを内部リゾルバー経由に強制する。内部リゾルバー自体は上流の公開リゾルバーにDoHで問い合わせてもよいが、ネットワーク内部ではすべてが内部リゾルバーを経由する。

これは最も管理が厳格な選択肢だ。スプリットホライズンを完全に維持し、セキュリティツールに完全な可視性を与える。コストは、新しいDoHエンドポイントのブロックリストを維持し続ける必要があること、そしてユーザーがインストールするアプリの中で独自のDoHを使用するもの（一部のチャットクライアント、一部のVPN）が誤動作する可能性があることだ。

### 戦略B：内部DoH

社内DoHサーバー（Cloudflared、AdGuard、またはDoH有効化済みのWindows DNSサーバー）を立ち上げ、エンドポイントがそれを使うよう設定し、内部DoHサーバーでスプリットホライズンを実行する。エンドポイントは暗号化DNSを得られ、ネットワーク側は可視性を失わない。

これは最もクリーンな選択肢であり、大企業の多くが移行を進めている方向だ。プライバシーの恩恵（LAN上のクエリが暗号化される）を保ちながら、セキュリティの恩恵（内部リゾルバーがすべてのクエリを可視化・フィルタリングできる）を維持する。Microsoft、Google、Appleはいずれもこのシナリオに向けたOSレベルの設定をサポートしている。

### 戦略C：カナリアドメイン／ネットワークシグナル

Mozillaのカナリアドメインを公開し、ChromeとEdgeの関連ポリシーを展開し、ブラウザが管理ネットワーク上にいることを検出してシステムリゾルバーに委ねるよう動作させる。最も介入度が低い選択肢であり、多くの中小規模組織には十分だ。

### 戦略D（機能しない）：「DoHは無視する」

対立が存在しないふりをして、デフォルト設定をそのままにし、すべてのDNSがまだ社内リゾルバーを通っていると思い込む。これが最も多く見られる状況であり、予測可能な障害を生む。内部専用URLがEdgeでは動作するのにFirefoxでは動作しないと開発者が報告する、セキュリティチームがDNSログにギャップを発見する、VPNとDNSが絡んだ断続的な障害を診断するのに何時間もかかる、といった問題だ。問題は解消しない。原因特定がより困難になるだけだ。

## DoHが手放すのはプライバシーだけではない

DoHのより見えにくい影響は、リゾルバーの集中化だ。ブラウザやOSが公開DoHリゾルバーを使うよう設定されると、そのユーザーのDNSトラフィックがより多く単一のリゾルバーオペレーターに集まる可能性がある。Chromeの自動モードは可能な限りユーザーの既存DNSプロバイダーを維持するよう明示的に設計されており、Firefoxのデフォルトロールアウトはロケールとヒューリスティックに依存している。そのため、あらゆるデプロイで文字通り「すべてのクエリ」が集中するわけではない。しかし、アーキテクチャ上のトレードオフは残る。暗号化DNSはローカルネットワークやISPへの信頼を、選別されたより少数のリゾルバーオペレーターへの信頼に置き換えることになりうる。

そのトレードオフが受け入れられるかどうかは、脅威モデルによる。敵対的なカフェのネットワーク上のユーザーにとっては、Cloudflareに信頼を集中させることはカフェを信頼するよりも明らかに改善だ。契約関係にある ISP をすでに持っている企業にとっては、後退に映ることもある。[EFF はこのトレードオフについて](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet)、DoHの初期ロールアウト時から継続的に論じている。

最もクリーンな答えは戦略Bと同じだ。独自のDoHリゾルバーを運用することで、暗号化DNSがクエリストリーム全体をサードパーティに委ねることを要求しない構成にする。

## ドメインオーナーへの示唆

エンタープライズが利用するドメインを運用している場合——SaaSアプリ、開発者向けツール、API——関連する事実を以下に示す。

- 一定割合のユーザーが、特に非管理端末や明示的に設定されたブラウザを通じて、公開DoHエンドポイント経由でアクセスする。CNAMEチェーン、[サブドメイン](/ja/glossary/subdomain/)委任、およびパーソナライズのために用いている巧みなDNSの工夫は、任意の公開リゾルバーから解決されても、顧客の内部リゾルバーから解決された場合と同様に機能する必要がある。
- DoHによるDNS検閲回避は現実のユースケースだ。政府のDNSフィルターによってドメインがブロックされている場合（暗号化メッセージングやVPNの一部のドメインがそうなっている）、ユーザーは公開リゾルバーのDoH経由でアクセスしてくる。メカニズムは同じだが、政治的な文脈は異なる。
- 内部のスプリットホライズンは、パブリック向けの名前を*内部でしか意味をなさない*ものに解決してはならない。そのような解決はDoHでクエリしたユーザーを壊してしまう。典型的な障害パターンは、内部専用の `app.example.com` がプライベートIPを返し、DoH経由のユーザーはそのIPに到達できない、そしてホテルにいるリモート社員が同じホスト名に接続できないとバグ報告を上げてくる、というものだ。明確に分離された内部専用ゾーン（`app.example.internal`）を使うべきだ。

## Namefiとの関わり

Namefiは DNS をパブリックな[コントロールプレーン](/ja/blog/dns-is-the-control-plane/)として捉えている——グローバルな名前付けとローカルポリシーが交わる場所だ。当社のDNSワークフローは、列挙できないDoHエンドポイントを含むあらゆるリゾルバーからクエリが来ることを前提としており、公開している名前は一貫して機能する。社内でスプリットホライズンを運用している顧客に対しては、Namefiはパブリック側に位置する。`example.com` の権威応答は当社が提供するものであり、内部ユーザーのためにそれを上書きするのは顧客のリゾルバーとエンドポイントポリシーの間の話だ。

より本質的な点を言えば、暗号化DNSはここに留まり続け、エンタープライズの可視性も同様に残り続ける。両者を調和させる方法は、標準規格と戦うことではなく、ポリシー適用点をネットワークからオペレーティングシステムへ移動させることだ。標準化機関、Microsoft、Apple、Google、Mozillaはすべてその答えに収束している。残る課題はほぼ運用上のものだ。

## 参考資料・関連リンク

- IETF — [DNS over HTTPS、RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) および [DNS over TLS、RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858)。
- Chrome Enterprise — [DoHポリシーコントロール](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode)。
- Mozilla — [Trusted Recursive Resolverプログラム](https://wiki.mozilla.org/Trusted_Recursive_Resolver)、[カナリアドメインの動作](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).)、および [スプリットホライズンのフォールバックガイダンス](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.)。
- Chromium — [ChromeによるDoH自動アップグレードの同一プロバイダーモデル](https://www.chromium.org/developers/dns-over-https/#:~:text=Chrome's%20auto%2Dupgrade%20approach%20does%20not%20change%20the%20DNS%20provider)。
- Microsoft — [WindowsでのDNS over HTTPSの設定](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support#:~:text=Allow%20DoH.%20Queries%20will%20be%20performed%20using%20DoH%20if%20the%20specified%20DNS%20servers%20support%20the%20protocol.)。
- EFF — [暗号化DNSはインターネット最大のプライバシーギャップの一つを埋める可能性がある](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet)。
