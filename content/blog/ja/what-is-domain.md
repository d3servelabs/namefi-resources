---
title: ドメイン名とは何か？
date: '2025-06-19'
language: ja
priority: P0
tags: ['faq']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-basics
format: explainer
description: ドメイン名の階層をルートからサブドメインまで解説します。登録できる範囲と URL の構成要素の違いも確認できます。
keywords: ['ドメイン名', 'DNS', 'ドメインネームシステム', 'IPアドレス', 'ウェブアドレス', 'インターネット基礎', 'ドメイン登録', 'ウェブサイトアドレス', 'URL', 'namefi']
relatedArticles:
  - /ja/blog/what-is-a-tld/
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/what-is-udrp/
  - /ja/blog/domain-terminology-guide/
  - /ja/blog/how-to-sell-a-domain-name-you-own/
relatedTopics:
  - /ja/topics/domain-basics/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-investor-field-guide/
  - /ja/series/domain-apocalypse/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/dns/
  - /ja/glossary/tld/
  - /ja/glossary/icann/
  - /ja/glossary/registry/
ogImage: ../../assets/what-is-domain-og.jpg
---

## ドメイン名は DNS 上の名前を表します

**ドメイン名**は、`example.com` や `namefi.io` のような名前です。利用者はドメイン名を使ってウェブサイトやメールサービスにアクセスします。ドメイン名には `https://` やページのパスを含めません。

**[DNS](/ja/glossary/dns/)** は名前とレコードを対応付けます。アドレスレコードは、ウェブサイトへの接続に必要な [IP アドレス](/ja/glossary/ip-address/)を提供できます。メールなどのサービスを支えるレコードもあります。ドメイン名を登録するだけでは、ウェブサイトのホスティングやメールボックスは用意できません。[RFC 1034](https://www.rfc-editor.org/rfc/rfc1034#section-2.4) は、名前、レコード、ネームサーバー、リゾルバーの役割を説明しています。

## ドメインの階層はルートから具体的な名前へと続きます

`blog.example.com.` を右から左へ読むと、階層を確認できます。ドットはラベルを区切り、末尾のドットはルートを表します。通常のウェブアドレスでは、末尾のドットを省略します。[RFC 1034 の第3.1節](https://www.rfc-editor.org/rfc/rfc1034#section-3.1) は、この階層構造を定義しています。

別の名前を調べる場合は、URLのパスを含めずにホスト名を[Namefiのドメイン名確認ツール](https://namefi.io/domain-tools/domain-name)に入力してください。ローカルの結果には、正規化された形式と、判明している場合はパブリックサフィックスの境界が表示されます。結果は、登録の可否、登録上の権利、名前を管理する主体を証明しません。

![ルートから com、example.com、blog.example.com へと続く DNS の階層](../../assets/what-is-domain-01-hierarchy.jpg)

| 階層 | 完全な名前 | 意味 |
| --- | --- | --- |
| ルート | `.` | すべてのトップレベルドメインの上にある共通の起点 |
| 第1レベル | `com.` | ルートの直下にあるドメイン |
| 第2レベル | `example.com.` | `com.` の直下にあるドメイン |
| 第3レベル | `blog.example.com.` | `example.com.` の直下にあるドメイン |

`example` というラベルは、`com` の下にある名前を選びます。完全な第2レベルのドメイン名は `example.com` です。ラベル単独の `example` ではありません。さらに下には、`support.blog.example.com` のような第4レベルの名前も作れます。

**[サブドメイン](/ja/glossary/subdomain/)** は、親ドメインとの関係を表す言葉です。`blog.example.com` は `example.com` のサブドメインです。広い意味では、`example.com` も `com` の下にあります。サブドメインが必ず別のウェブサイトを指すとは限りません。[JPNIC はドメイン名の階層と DNS の委任を説明しています](https://www.nic.ad.jp/ja/dom/system.html)。

## TLD の種類は階層の深さを変えません

**[トップレベルドメイン](/ja/glossary/tld/)** はルートの直下にあります。`.com` や `.org` は分野別トップレベルドメインです。`.uk`、`.de`、`.jp` は国別トップレベルドメインです。[IANA のルートデータベース](https://www.iana.org/domains/root/db) で、種類と管理組織を確認できます。

国別トップレベルドメインも、第1レベルのドメインです。「国別」は分類を示し、別の階層を追加する言葉ではありません。[TLD の解説](/ja/blog/what-is-a-tld/)では、拡張子の種類と選び方を詳しく説明しています。

## 登録できるドメインは第2レベルに限りません

DNS の階層と登録の境界は別の概念です。`example.com` では、登録するドメイン名は2つのラベルで構成されます。`example.co.uk` では、`uk` が第1レベル、`co.uk` が第2レベル、`example.co.uk` が第3レベルです。[Nominet は `.uk` と `.co.uk` の両形式を案内しています](https://nominet.uk/lookup/)。

末尾の2つのラベルが常に登録対象を示すと考えてはいけません。登録方針が境界を決めます。**パブリックサフィックス**は複数のラベルを含む場合があります。[RFC 9499](https://www.rfc-editor.org/rfc/rfc9499.html#section-9) は、名前だけではパブリックサフィックスを判定できない理由を説明しています。

## URL はドメイン名以外の情報も含みます

`https://blog.example.com/guides/domains?lang=en` を例に確認しましょう。

| 構成要素 | 例 | 役割 |
| --- | --- | --- |
| スキーム | `https` | 接続方式を指定する |
| ホスト名 | `blog.example.com` | この例の接続先を示す |
| 登録可能なドメイン | `example.com` | この例の登録境界を示す |
| パス | `/guides/domains` | ホスト上のリソースを示す |
| クエリー | `lang=en` | ウェブサイトにパラメーターを渡す |

パスとクエリーは DNS の階層を変えません。[MDN は URL の構成要素を説明しています](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL#scheme)。サイト構成を決める場合は、[サブドメインとサブディレクトリの比較](/ja/blog/subdomain-vs-subdirectory/)を参照してください。

## レジストリとレジストラは異なる役割を担います

**[レジストリ](/ja/glossary/registry/)** はドメインの登録簿を運営します。**[レジストラ](/ja/glossary/registrar/)** は顧客の登録手続きを扱います。ICANN はレジストラを認定し、[gTLD レジストリとの契約](https://www.icann.org/en/contracted-parties/registry-operators/resources/listings)を管理します。国別トップレベルドメインには、それぞれの管理体制があります。

gTLD を登録する場合は、[ICANN 認定レジストラ](https://www.icann.org/en/contracted-parties/accredited-registrars)、または認定レジストラを通じて手続きするリセラーを利用します。支払い前に、空き状況、登録資格、契約条件、更新費用を確認してください。登録契約が利用権を定めます。登録を維持し、必要なサービスに合わせて DNS を設定してください。

ドメインの登録者は、同じ時点では1人です。登録者は、別の人やサービスに名前の利用を許可できます。登録によって、他の TLD の下にある同じラベルまで確保できるわけではありません。

## 以下の資料がドメイン名と登録境界を説明しています

資料の確認日：2026年10月21日。

- IETF：[RFC 1034、第2.4節と第3.1節](https://www.rfc-editor.org/rfc/rfc1034)。
- IETF：[RFC 9499、第9節](https://www.rfc-editor.org/rfc/rfc9499.html#section-9)。
- JPNIC：[ドメイン名のしくみ](https://www.nic.ad.jp/ja/dom/system.html)。
- IANA：[ルートゾーンデータベース](https://www.iana.org/domains/root/db)。
- Nominet：[ドメイン検索の例](https://nominet.uk/lookup/)。
- MDN：[URL の解説](https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/What_is_a_URL)。
- ICANN：[認定レジストラ](https://www.icann.org/en/contracted-parties/accredited-registrars)と[レジストリ一覧](https://www.icann.org/en/contracted-parties/registry-operators/resources/listings)。
