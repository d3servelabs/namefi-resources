---
title: "DNS は引き続き機能します：トークン化ドメインにおけるネームサーバー、メール、DNSSEC"
date: '2026-05-22'
language: ja
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: domain-tokenization
series: tokenize-your-com
seriesOrder: 2
format: guide
description: ICANN ドメインをトークン化した後も、通常の DNS（ネームサーバー、A/AAAA、MX、TXT、DNSSEC、CAA）が引き続き機能する仕組みを実践的に解説します。変わること・変わらないこと、および既存の DNS プロバイダーへの接続方法を紹介します。
keywords: ['DNS トークン化ドメイン', 'DNSSEC NFT ドメイン', 'トークン化ドメイン ネームサーバー', 'トークン化ドメイン メール', 'MX レコード NFT ドメイン', 'CAA レコード トークン化ドメイン', 'トークン化ドメイン DNS 管理', 'オンチェーン ドメイン DNS', 'NFT ドメイン MX', 'NFT ドメイン DNSSEC', 'トークン化ドメイン Cloudflare', 'トークン化ドメイン Route53', 'DNS の仕組み トークン化', 'トークン化ドメイン 名前解決']
relatedArticles:
  - /ja/blog/how-to-tokenize-your-com/
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/tokenize-your-com-to-flip-it/
  - /ja/blog/how-tokenized-marketplaces-replace-escrow/
  - /ja/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /ja/topics/domain-tokenization/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/tokenize-your-com/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/registry/
  - /ja/glossary/tld/
---

[ドメインをトークン化する](/ja/glossary/tokenize/)際によくある不安として、「Webサイトは引き続き動くのか？メールは届くのか？まったく新しい DNS スタックを覚えなければならないのか？」という疑問があります。

簡潔に答えると：**はい、はい、いいえ**です。[トークン化ドメイン](/ja/glossary/tokenized-domain/)は依然として正真正銘の ICANN ドメインです。DNS はこれまでどおり DNS としての役割を果たします。この記事では、何が（少し）変わり、何が変わらないのか（ほとんど）を順を追って説明します。

---

## まず頭に入れておくべき一つのポイント

トークン化ドメインには **2 つのレイヤー**があります。

1. **[DNS](/ja/glossary/dns/) / [レジストリ](/ja/glossary/registry/)レイヤー** — `.com` がずっと存在してきた、おなじみのレイヤーです。[ICANN](/ja/glossary/icann/)、[レジストラ](/ja/glossary/registrar/)、[ルートサーバー](/ja/glossary/root-zone/)、再帰リゾルバーがここに含まれます。
2. **[オンチェーン](/ja/glossary/on-chain/)レイヤー** — *所有権*を表す、[ウォレット](/ja/glossary/wallet/)内の [NFT](/ja/glossary/nft/)です。

`example.com` を [IP アドレス](/ja/glossary/ip-address/)に変換する DNS 解決は、レイヤー 1 で完全に完結します。オンチェーンレイヤーが担うのは**ドメインを誰が制御するか**であり、名前解決の方法ではありません。ブラウザ、メールサーバー、CDN、認証局は[ブロックチェーン](/ja/glossary/blockchain/)の存在を知る必要はまったくありません。

「DNS が引き続き機能する」理由はここにあります。魔法ではなく、従来と同じ DNS なのです。

---

## 変わらないこと

### ネームサーバー

ドメインのネームサーバーは引き続き自分で設定します。Cloudflare、Route53、Namecheap、Google Cloud DNS、dnsimple など、これまで使っていたサービスをそのまま利用できます。トークン化前と同じ DNS プロバイダーを一切変更せずに使い続けるオーナーも多くいます。

### A、AAAA、CNAME、ALIAS レコード

すべて標準のまま使えます。Webサイトの名前解決は以前と変わらず機能します。

### MX、SPF、DKIM、DMARC

メールは引き続き届きます。トークン化はメール配信にまったく影響しません。Google Workspace、Microsoft 365、Fastmail、ProtonMail、あるいは自前のメールサーバーを使っていても、何も変わりません。

### TXT レコード

SaaS ツール（Stripe、Slack、GitHub、Atlassian など）のドメイン確認も引き続き機能します。TXT レコードの追加・削除はこれまでどおり行えます。

### CAA レコード

Certificate Authority Authorization（CAA）レコード — 認証局（Let's Encrypt、DigiCert）に対してドメインの証明書発行を許可する者を指定するレコード — は変更なく機能し続けます。

### TLS / SSL 証明書

証明書の取得元は変わりません。Let's Encrypt、CDN プロバイダー、ロードバランサーなど、従来のフローがそのまま使えます。ACME チャレンジ（DNS-01 または HTTP-01）も同様に機能します。

### 更新（Renewal）

ドメインの更新は引き続きレジストラを通じて行われ、同じスケジュール・同じ課金方式で処理されます。トークン化によって新たな更新の仕組みが追加されるわけではありません。

---

## *変わること*（少し）

### ドメインを管理する権限の所在

トークン化前：レジストラのアカウントにログインできる人が管理者。
トークン化後：**オンチェーン NFT を保有している人**が権限を持ちます。Namefi のダッシュボードはプロトコルを通じて NFT とレジストラのアカウントを紐付けており、ウォレットが唯一の信頼の源となります。

これこそがトークン化の本質です。だからこそ、ウォレットのセキュリティを真剣に管理する必要があります。詳しくは [ウォレット紛失後のトークン化ドメイン復旧](/ja/blog/recovering-a-tokenized-domain-after-wallet-loss/) を参照してください。

### DNS を管理する場所

トークン化後は、多くのオーナーが Namefi のダッシュボード内で DNS レコードを管理します — ダッシュボードがユーザーに代わってレジストラと通信します。Cloudflare や Route53 などで DNS を管理し続けたい場合は、ネームサーバーをそのまま向けておくだけで問題ありません。アプリ内の DNS UI は無視して構いません。どちらの方法も機能します。

### ドメインの移転

トークン化前：[auth コード](/ja/glossary/auth-code/)と 60 日間のクールダウンを伴う[レジストラ間移転](/ja/glossary/cross-registrar-transfer/)フロー。
トークン化後：[**NFT を転送する**](/ja/glossary/atomic-transfer/)だけです。単一のオンチェーントランザクションで所有権が移動し、レジストラ側の記録はプロトコルによって自動的に同期されます。これは劇的に速く、だからこそトークン化ドメインのマーケットプレイスには従来の[エスクロー](/ja/glossary/escrow/)が不要なのです（詳しくは [出品から決済まで](/ja/blog/how-tokenized-marketplaces-replace-escrow/)を参照）。

従来のレジストラ間移転を行いたい場合も引き続き可能です。オンチェーンレイヤーはそれを妨げません。

---

## トークン化ドメインにおける DNSSEC

[DNSSEC](/ja/glossary/dnssec/) は機能します。トークン化前に有効化していた場合、そのまま維持されます。無効だった場合は、トークン化後に有効化できます。信頼チェーンは通常どおりレジストリを経由して構成されており、オンチェーンレイヤーはそのパス上のどこにも介在しません。（背景知識として：プロトコルの定義は [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033)、信頼の根（Root of Trust）のプロセスは [ICANN の KSK セレモニー解説](https://www.icann.org/dns-resolvers-checking-current-trust-anchors)を参照してください。）

実際に役立つ注意点をいくつか紹介します。

- Cloudflare や Route53 で DNS を管理している場合、これらのプロバイダーが DNSSEC 署名を代行します。レジストラ側で有効化するだけでよく、Namefi ダッシュボードから操作できます。
- DS レコードはレジストラ / レジストリレベルで管理します。KSK をローテーションする場合は、これまでと同じフローで新しい DS レコードを公開します。
- DNSSEC の障害は標準ツール（`dig +dnssec`、[dnsviz.net](https://dnsviz.net/)、[Verisign の DNSSEC アナライザー](https://dnssec-debugger.verisignlabs.com/)）で確認できます。トークン化によって新たな障害モードが加わることはありません。

---

## トークン化後のメール到達性

メールについて最も心配する方が多いため、明確に述べます：**メールに関しては何も変わりません。**

MX レコードは引き続きメールをプロバイダーへルーティングします。SPF は引き続き送信者を認証します。DKIM は引き続き送信メッセージに署名します。DMARC は引き続きアライメントを強制します。送信レピュテーションは送信元 IP とドメインのペアに紐付いており、ドメインは変わらずあなたのドメインです — 同じ名前、同じ歴史、同じ実績です。

トークン化と同時期にメールプロバイダーを切り替えようとしている場合（整理するのに良いタイミングだと感じることはよくあります）、変更は一つずつ行ってください。トークン化が何かを壊すわけではありませんが、一度に変更する変数を一つに絞るのは運用上の基本的な衛生管理です。

---

## クイックリファレンス：主なレコード一覧

| レコード | 用途 | トークン化による影響 |
|---|---|---|
| A / AAAA | Web サイトの IP アドレス | なし |
| CNAME / ALIAS | エイリアス | なし |
| MX | メールルーティング | なし |
| TXT | 確認、SPF、DKIM、DMARC | なし |
| CAA | 認証局の制限 | なし |
| NS | 委任（ネームサーバー指定） | なし（引き続き自分で指定） |
| DS | DNSSEC 委任 | なし（通常どおりレジストリで管理） |
| SRV | サービスロケーション | なし |
| TLSA | DANE | なし |

「トークン化」レイヤーは DNS の*上*ではなく、DNS の*隣*に存在します。

---

## よくある落とし穴

- **どのウォレットに NFT があるかを忘れる。** これは DNS の問題ではありませんが、トークン化ドメインへのアクセスを失う最も多いパターンです。必ず書き留めておきましょう。
- **ネームサーバーと DNS プロバイダーを同時に切り替える。** 誘惑にかられることはありますが、不要なリスクを招きます。まずトークン化を完了させ、DNS プロバイダーの変更は後から行いましょう。
- **オンチェーンレイヤーが DNS 変更を自動的に反映すると思い込む。** そうではありません。DNS の変更は引き続き DNS プロバイダーを通じて行われ、通常の伝播時間（TTL に応じて数分〜数時間）がかかります。
- **移行中に DNSSEC を無効化する。** DNSSEC をオフ・オンする場合は、DS レコードを適切に更新しながら丁寧に進めてください。中途半端な DNSSEC の設定は、あらゆる環境での名前解決を破壊します。

---

## 免責事項（必ずお読みください）

> 当チームは弁護士でも、会計士でも、ファイナンシャルアドバイザーでも、医師でもありません。**この記事のいかなる内容も、法的・財務的・税務的・会計的・医学的、またはその他の専門的アドバイスを構成するものではありません。** これらの投稿は、私たち自身の学習と、お客様への情報提供を目的として書かれています。掲載情報は古くなっている場合、特定の地域にのみ適用される場合、または単純に誤りを含む場合があります — 私たちも間違えることがあります。
>
> 重要な意思決定を行う際は、**必ず専門家にご相談ください（本当に！）**。それが難しければ、友人、Twitter、Reddit、AI、あるいは占い師に相談してください。要するに：**DOYR — Do Your Own Research（自分で調べよう）**。共に学び、楽しみましょう。

---

## まとめ

- ドメインのトークン化は DNS を置き換えません。DNS は引き続き DNS として機能します。
- ネームサーバー、Webサイト、メール（MX/SPF/DKIM/DMARC）、DNSSEC、CAA、TLS 証明書はすべて変更なく動作し続けます。
- 変わるのは**所有権**です。ウォレット内の NFT が新たな権限の中心となります。移転はレジストラの煩雑な手続きではなく、オンチェーン上で行われます。
- DNS は Cloudflare、Route53、あるいは現在の場所に置いたままで構いません。Namefi で管理することも可能です。どちらも有効な選択肢です。
- 実務上の意味：トークン化された `.com` は、売却や移転を行うまでは通常の `.com` と運用上まったく区別がつきません。売却・移転の段階に至って初めて、オンチェーンレイヤーがすべてを劇的に速くします。

まずトークン化そのもののオペレーター向け手順については、[.com のトークン化方法](/ja/blog/how-to-tokenize-your-com/)をご覧ください。
