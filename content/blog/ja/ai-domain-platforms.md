---
title: "AIエージェント型ドメインプラットフォーム：2026年版ガイド"
date: '2026-07-10'
language: 'ja'
tags: ['ai-agents', 'domains', 'guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
format: guide
ogImage: ../../assets/ai-domain-platforms-og.jpg
description: "2026年にAIエージェントがドメインの検索、価格確認、登録まで行える全プラットフォーム（Cloudflare、Name.com、Namefi）を、インターフェース、決済、自律性で比較します。"
keywords: ["AIエージェントによるドメイン登録", "エージェント型ドメインプラットフォーム", "AIでドメインを購入", "自然言語によるドメイン購入", "MCPドメインレジストラ", "AIドメインAPI", "エージェント型ドメイン登録プラットフォーム", "エージェントネイティブ・レジストラ", "Cloudflare Registrar API", "Namefi MCP", "Name.com AIネイティブAPI", "llms.txt対応ドメインレジストラ", "AIはドメインを購入できるか", "AIエージェントがドメイン名を購入できるプラットフォーム 2026", "AIエージェントがドメインを登録できるプラットフォーム"]
relatedArticles:
  - /ja/blog/cf-namecom-namefi/
  - /ja/blog/agent-native/
  - /ja/blog/claude-mcp-domains/
  - /ja/blog/ai-agent-register/
  - /ja/blog/airo-vs-namefi/
relatedTopics:
  - /ja/topics/domain-tokenization/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/tokenize-your-com/
  - /ja/series/best-tlds-by-industry/
relatedGlossary:
  - /ja/glossary/ai-agent/
  - /ja/glossary/registrar/
  - /ja/glossary/tld/
  - /ja/glossary/tokenized-domain/
  - /ja/glossary/wallet/
---

一年前まで、「AIとドメイン」といえば名称ジェネレーターを意味していました。ビジネスのアイデアを入力欄に入れると、`.com`や`.ai`の候補一覧が表示され、通常の人間向けチェックアウトへ進むというものです。これは今でも実在する有用なカテゴリですが、もはやそれがすべてではありません。

2026年初頭から、もう一つのカテゴリが現実のものになりました。マウスをクリックする人間ではなく、[AIエージェント](/ja/glossary/ai-agent/)自身が空き状況を検索し、価格を確認し、登録まで完了できるプラットフォームです。たとえば「このアイデアのランディングページを立ち上げ、実際のドメインで公開して」という長いタスクの一工程として実行できます。これは、より賢い候補提案ツールとは本質的に異なりますが、両者は、それらを紹介する多くのマーケティング文を含め、たびたび混同されています。

本ガイドは、その全体像を示す地図です。そもそもエージェントがプラットフォームを利用できるようにするインターフェースの形を説明し、現在エージェント型登録に対応する各プラットフォームが実際に何をでき、何をできないのかを、それぞれの公式文書で検証しながら紹介します。さらに、既存大手レジストラが代わりに提供しているものと比較し、最後に判断表とFAQを掲載します。すでに直接比較した数値を確認したい場合は、[Cloudflare vs Name.com vs Namefi](/ja/blog/cf-namecom-namefi/)へ進んでください。

始める前に注意点があります。以下のプラットフォームには公開ベータ中のものが複数あり、ベータ機能は変わります。本稿の内容は、ガイド公開日時点の現行ドキュメントに照らして確認しています。個別の機能に関する記述は恒久的な仕様ではなく、その時点での情報として扱ってください。

## ドメイン登録がエージェント層へ移った理由

二十年以上にわたり、ドメイン登録とはブラウザ上で行う作業でした。検索欄、カート、決済フォームがあり、操作しているのが人間だと証明するためにCAPTCHAを求められることも少なくありませんでした。レジストラにはその期間の大半を通じてプログラムから利用できるAPIがありましたが、それらはホスティング用ダッシュボードや一括更新スクリプトなど、ほかのソフトウェアシステム向けに作られていました。会話の途中でプロジェクトに名前が必要だと判断する言語モデル向けではなかったのです。

その後、二つの変化が相次いで起きました。まず2025年七月、Name.comが「初のAIネイティブ・ドメインプラットフォーム」と称するサービスを発表しました。[Model Context Protocol](https://modelcontextprotocol.io)（MCP）とOpenAPIスキーマを中心に構築されたAPIであり、「アプリにドメイン登録を追加して」といった自然言語の依頼から、コーディングエージェントが仕様を読み、動作する登録コードを書けるよう明示的に設計されています（[Name.com](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20first%20registrar%20to%20bring%20together%20intelligent%20domain%20capabilities%20and%20seamless%20integration%20for%20AI%20agents)）。次に2026年四月15日、CloudflareがRegistrar APIの公開ベータを開始し、「Registrar APIを使えば、ドメインの検索、空き状況の確認、プログラムによる登録が可能になる」と明確に訴求しました（Cloudflare Blog、[業界記事](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/)経由）。特筆すべきは、CursorやClaude Codeのエージェントがすでに利用できたCloudflare MCPサーバーへ、このAPIを直接組み込んだことです。

広く報じられたのは後者の動きでした。Cloudflareは大規模で知名度の高いレジストラであり、その打ち出し方も率直だったからです。人間が「同意する」をクリックしてカード番号を入力する必要があるため自動化に抵抗してきたドメイン登録が、いつの間にかエージェントがサブルーチンとして実行できる処理になっていました。CircleIDによる2026年半ばのドメイン業界調査は、これを端的に「AIエージェントは、人間の介入なしに空き状況を確認し、名前を登録し、DNSを設定するドメインリセラーとして、ますます活動するようになっている」と表現しています（[CircleID、2026年四月](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)）。

これは、レジストリがルールを変更したために起きたのではありません。いくつかのプラットフォームが、既存の購入フローをブラウザだけでなく機械からの呼び出しにも理解できる形にしたためです。そして、その実現には単に「APIを公開する」以上のものが必要でした。

## 三つのインターフェース形態：REST API、MCPサーバー、llms.txt

すべてのAPIをエージェントが利用できるわけではなく、その差は正確に名前を付ける価値があるほど重要です。完全なチェックリストは[エージェントネイティブ・レジストラとは？](/ja/blog/agent-native/)を参照してください。要約すると、本ガイドのプラットフォームには、重なり合う次の三つの形態が見られます。

- **そのままのREST API。** 最も古い形態です。開発者向けAPIを持つレジストラなら、技術上はどこでもソフトウェアからドメインを登録できます。問題は発見性です。エージェントは、そのAPIの存在をあらかじめ知り、ドキュメントをコンテキストに取り込み、対応するクライアントがすでに実装されていなければなりません。REST APIだけでは、汎用エージェントに、その存在や正しい使い方は伝わりません。
- **MCPサーバー。** [MCP](https://modelcontextprotocol.io)は、オープンでモデルに依存しないプロトコルです。管理者はこれを「AIアプリケーションを外部システムへ接続する標準化された方法」であり、「AIアプリケーション用のUSB-Cポート」に相当すると説明しています（[modelcontextprotocol.io](https://modelcontextprotocol.io#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications)）。Claude、Cursor、Windsurfなど、対応するAIクライアントに対して、定義済みの呼び出し可能なツール群を公開します。MCPサーバーを提供するレジストラは、エージェントにRESTドキュメントの壁を解析させる代わりに、正確な操作メニュー（`search_domain`、`register_domain`、`set_dns_record`）を渡しているのです。
- **llms.txtで発見できるAPI。** [llms.txt](https://llmstxt.org)は、2024年に提案されたプレーンテキストの規約で、サイトのルートに`/llms.txt`ファイルを置きます。`robots.txt`がクローラーに許可ルールを伝えるのと同じように、言語モデルへサイトの主要なドキュメントと機能を簡潔に整理した索引を提供します。たとえば`namefi.io/llms.txt`を公開するレジストラなら、そのプラットフォームを一度も見たことがないエージェントでも、人間が先にAPIドキュメントを会話へ貼り付けなくても、何ができるのかを発見できます。

これらは競合する標準ではありません。最も優れたプラットフォームは三つすべてを重ね、llms.txtを発見に、MCPサーバーを実際のツール呼び出しに使い、その両方の基盤としてREST APIを利用しています。

## プラットフォーム別の詳細

### Cloudflare Registrar API（ベータ）

2026年四月15日に提供を開始したCloudflareのベータ版は、検索、空き状況と価格の確認、登録という三つの操作に対応します。Cloudflare自身はこれを「ドメインのライフサイクルで最初に訪れる重要な瞬間」と表現しており、移管、更新、連絡先情報の更新には年内に対応するとしています（Cloudflare Blog）。価格はCloudflareが長年採用してきたレジストラモデルに従い、ダッシュボード、API、エージェントのどこから呼び出しても上乗せせず、「レジストリから請求される金額をそのまま請求する」としています（Cloudflare Blog）。

エージェント向けの要点は、別製品ではなく統合にあります。「Registrar APIはCloudflare API全体の一部であるため、エージェントはCloudflare MCPを通じて今日からすでに利用できる」、さらに「Cursor、Claude Code、またはMCP互換環境で動作するエージェントは、Registrarのエンドポイントを発見して呼び出せる」と説明されています（Cloudflare Blog）。Cloudflareが示す想定フローには確認地点が残されており、エージェントが「名前を提案し、実際に登録可能か確認し、承認のため価格を提示してから購入を完了」できます（Cloudflare Blog）。ただし文書上、これはAPI自体が強制する支出上限の仕組みではなく、設計上の提案です。

利用を前提に計画する前に知っておくべき注意点が二つあります。まず、ベータ版はCloudflareが扱うTLDの全カタログにまだ対応しておらず、「まずは厳選した人気TLD」に限られます（Cloudflare Blog）。また、既存のCloudflareアカウントに請求されるため、APIを呼び出すのがエージェントでも、法定通貨を使い、人間がオンボーディングした関係であることに変わりはありません。

### Name.com AIネイティブAPI

2025年七月に発表されたName.comのプラットフォームも、自然言語からコードを生成するという同じ発想を中心に構築されています。開発者またはエージェントが希望する内容（「アプリにドメイン登録を追加して」）を説明すると、AIクライアントがそれを実際に動作する統合コードへ変換できるようドキュメントが構成されています。基盤にはMCPとOpenAPIを使い、セルフサービス型の開発者アクセスを提供し、ClaudeやCursorなどのツールに対応します（[Name.com](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=leverages%20modern%20standards%20including%20Model%20Context%20Protocol)）。価格は明瞭な従量制で、レジストラAPIに一般的なリセラー向けの上乗せ体系を採用しています。

一方、Name.comの発表には、暗号資産やウォレットを使う決済経路、あるいはAPI自体に組み込まれた明示的な人間による確認手順は記載されていません。標準的な開発者アカウントのモデルを考えれば、どちらについても推測はできますが、出典には明記されていません。そのため、「法定通貨を使ったアカウント単位の請求」は、完全に確認された詳細ではなく、現時点の前提として扱ってください。

### Namefi：MCPサーバーとウォレット決済

Namefi自身の機械可読な機能索引である[namefi.io/llms.txt](https://namefi.io/llms.txt)は、上記で説明した三つ目の形態そのものです。以下の情報については、これが唯一の正確な情報源です。Namefiは`api.namefi.io/mcp`でStreamable HTTP方式のMCPサーバーを運用し、登録、空き状況の確認、DNS管理のための型付きツールを公開しています。Claude Codeには一つのコマンド（`claude mcp add --transport http namefi https://api.namefi.io/mcp`）で追加できます。その基盤には、`x-api-key`ヘッダーで認証するREST API（`api.namefi.io/v-next/`）があります。APIキーはドメインを所有するウォレットから生成する必要があるため、APIへのアクセスは、別のアカウント復旧フローではなくオンチェーン上のカストディに直接結び付いています。

違いが明確に表れるのは決済です。Namefiは二つの経路を説明しています。一つは、前払いしたNFSC（Namefi Service Credits）残高から請求される標準的なAPIキー方式です。もう一つは、SIWE（Sign-In With Ethereum）を含むウォレット署名を使う暗号資産ネイティブな方式で、ドキュメントがWeb3利用者や「エージェント型ウォレット」と呼ぶ対象に向け、レジストラのアカウントを一切作成せず購入を承認できます。登録後は、DNSレコードの完全なCRUD（A、AAAA、CNAME、MX、TXTなど）、自動更新、ドメインパーキングと転送、ENSレコードの自動生成に対応します。そして、この三つのプラットフォームの中で構造上の違いとなる機能が[トークン化](/ja/glossary/tokenized-domain/)です。実在するICANN登録ドメインを、オンチェーン上で[ウォレット](/ja/glossary/wallet/)が保有する資産として表します。Claude、Codex、Cursorと、ほか三つのエージェントを対象にした手順は、[NamefiでAIエージェントを使ってドメインを登録する方法](/ja/blog/ai-agent-register/)で紹介しています。Claudeに特化した詳細は、[Claudeでドメインを購入：Namefi MCPステップバイステップガイド](/ja/blog/claude-mcp-domains/)にあります。自然言語による依頼が実際にどのようなものかは、[自然言語でドメインを購入する方法（2026年）](/ja/blog/nl-domain-purchase/)を参照してください。

明確に指摘しておくべき不足が一つあります。Namefiのllms.txtには、対応するTLDの固定一覧が公開されていません。<!-- TODO: チームに確認 — 対応TLDの完全な一覧 --> TLDの対応範囲が用途を決める要因なら、採用を決める前に最新ドキュメントで直接確認してください。

## GoDaddyやNamecheapなどの既存大手が代わりに提供するもの

大手消費者向け[レジストラ](/ja/glossary/registrar/)が上の表に含まれない理由は、正確に説明しておく価値があります。[「AIドメイン検索」という言葉が、実際には異なる二つの製品を指して使われている](/ja/blog/ai-search-meanings/)ためです。既存大手は、AIによる名前候補の提案やオンボーディングへ多額の投資をしています。ビジネスの説明を入力すると、ブランドに使える名前の候補を生成し、ロゴや簡易サイトのジェネレーターを組み合わせて提供することもあります。これは実在する有用な製品です。しかし上記のプラットフォームと同じカテゴリではありません。そのフローにおけるAIは、人間の判断を支援するだけであり、外部エージェントがツールとして呼び出し、自ら検索、価格確認、登録完了まで実行できる権限は持っていないからです。人間がチェックアウトページへ移動し、購入ボタンをクリックする必要があります。既存大手がエージェントから呼び出せるAPI、MCPサーバー、または上の三つのプラットフォームと同じ権限を示すllms.txtファイルを公開するまでは、こちらではなく「AIが人間の選択を支援する」カテゴリに属します。

## 総合判断表

| プラットフォーム | インターフェース | 決済 | 人間による確認 | TLD対応範囲 |
| --- | --- | --- | --- | --- |
| **Cloudflare Registrar API**（ベータ） | REST API + Cloudflare MCP。Cursor、Claude Code、任意のMCPクライアントで直接利用可能 | 法定通貨。既存のCloudflareアカウントに請求 | 設計上は購入前に「承認用」の価格を提示するが、API自体が強制する支出上限の記載はない | ベータ開始時点では厳選された人気TLDのみ。Cloudflareの全カタログではない |
| **Name.com AIネイティブAPI** | REST + OpenAPIスキーマ。MCP互換。自然言語からコードを生成するワークフロー | 法定通貨。標準的な開発者アカウント請求。リセラー向けの従量価格 | 公開発表には記載なし | 発表には内訳の記載なし |
| **Namefi** | REST API（`x-api-key`）+ MCPサーバー（`api.namefi.io/mcp`、Streamable HTTP） | 前払いのAPIキー残高による法定通貨決済、**または**アカウント不要の暗号資産ウォレット署名（SIWE） | 設計上は任意。APIキー方式は前払い残高で上限が決まり、ウォレット方式は取引ごとに署名が必要 | 公開ドキュメントには内訳なし。利用するTLDの最新対応状況を確認する必要がある |

空き状況の検索、DNS管理、更新の自動化、トークン化された所有権など、この表を機能ごとに詳しく比較した版は、[Cloudflare vs Name.com vs Namefi：エージェントネイティブ・レジストラ](/ja/blog/cf-namecom-namefi/)を参照してください。

## 選び方

- **すでにCloudflareのエコシステムを利用しており、今は検索、確認、登録だけが必要な場合。** ドメインとDNSをすでにCloudflareへ置いているなら、Registrar APIが最も手間の少ない選択肢です。ただし、ベータ版のTLD一覧と機能は、完全なレジストラよりまだ限定されています。
- **ドメイン登録を基盤とするリセラー製品やマルチテナント製品を構築する場合。** Name.comの従量価格とセルフサービス型の開発者アクセスは、リセラーを念頭に設計されています。
- **既存の人間所有アカウントを使わずにエージェントが取引する必要がある、またはドメイン自体を持ち運べるウォレット保有資産にしたい場合。** [Namefi](https://namefi.io)は、まさにその不足を埋めるために構築されています。登録手続きなしのウォレット署名決済に加え、ドメインをほかのオンチェーン資産と同じように移動し、カストディを証明したい場合には、[トークン化](/ja/glossary/tokenized-domain/)された所有権を利用できます。
- **そもそもエージェントに購入権限が必要か分からない場合。** 求めているものが、人間が購入ボタンをクリックする前提で名前選びを手伝ってもらうことなら、本ガイドのどのプラットフォームよりも、AI支援型の名称ジェネレーターが適しています。詳しい違いは、[「AIドメイン検索」が2026年に意味する二つのもの](/ja/blog/ai-search-meanings/)を参照してください。

## よくある質問

### ChatGPTやClaudeは今すぐ私の代わりにドメインを購入できますか？
それはモデル自体ではなく、そのチャットクライアントが利用できるツールだけで決まります。Claudeのようなモデルに、ドメインを登録する機能が最初から組み込まれているわけではありません。検索、価格確認、購入完了を行うには、プラットフォームのMCPサーバーまたはAPI（たとえばNamefiのMCPサーバー、あるいはCloudflare MCP経由のCloudflare Registrar API）へ接続する必要があります。接続がなければ、AIアシスタントにできるのは、利用者自身が登録する名前の候補を提案することだけです。

### 私への事前確認なしにAIエージェントへドメイン登録と支出を任せても安全ですか？
ほかの自動購入権限と同様に、付与する前に範囲を限定してください。これらのプラットフォームで文書化されている最も安全な方式は、損失総額に上限を設ける前払い残高（NamefiのAPIキー方式）、再利用できない取引ごとの署名（ウォレット署名決済）、または最終購入を呼び出す前の手動確認です。本ガイドのプラットフォームには、利用者に代わって普遍的な支出上限を強制するものはありません。通常は、アカウントへの入金上限、または自身のエージェントのワークフローに明示的な確認手順を設け、利用者自身でガードレールを設定します。

### API、MCPサーバー、llms.txtは実際に何が違うのですか？
REST APIは、呼び出し可能な処理の基礎となる集合です。MCPサーバーは、そのうち定義済みの処理を個別のツールとしてまとめ、MCP対応AIクライアントが独自の統合コードなしで直接呼び出せるようにします。llms.txtファイルは発見の層です。サイトのルートにある短く整理された索引として、どのようなドキュメントと機能が存在するかをエージェントへ最初に伝えます。これは、robots.txtがクローラーにインデックス可能な範囲を伝えるのと似ています。プラットフォームは三つのうち一つだけを備えることもできますが、優れたエージェントネイティブ・プラットフォームは三つすべてを組み合わせます。llms.txtで発見され、MCPで呼び出され、その両方の基盤としてRESTが動作します。

### これらのプラットフォームを利用するには暗号資産ウォレットが必要ですか？
いいえ。CloudflareとName.comはいずれも、法定通貨を使った標準的なアカウント単位の請求を採用し、Namefiも前払い残高に対する同様のAPIキー請求に対応しています。ウォレットが必要なのは、Namefiのアカウント不要のウォレット署名決済、またはトークン化された所有権機能を明示的に利用したい場合だけです。

### 現時点で最も「完成している」のはどのプラットフォームですか？
いずれも、完成済みで変化しない仕様として扱うべきではありません。Cloudflareは明示的にベータ版とされ、対応TLD一覧も全カタログより限定されています。また、ベータ機能は定義上、変更される可能性があります。特定の機能へ依存するものを構築する前に、各プラットフォームの現行ドキュメントで最新の機能を確認してください。

## Namefiで次のドメインを購入し、トークン化する

どのインターフェース形態が自身のワークフローに合うとしても、[Namefi](https://namefi.io)は、フォームをクリックする人間だけでなく、エージェント、ウォレット、スクリプトが同じくらい頻繁に購入者となる状況を想定して構築されています。[ICANN](/ja/glossary/icann/)認定[レジストラ](/ja/glossary/registrar/)として、MCPサーバー、文書化されたREST API、アカウント作成を完全に省くウォレット署名決済を提供します。さらに任意の[トークン化](/ja/glossary/tokenized-domain/)により、ドメイン自体をエージェントのウォレットが保有し、移動できる資産に変えられます。

**[Namefiでドメインを検索して登録する](https://namefi.io)。**

## 出典と関連資料

- Cloudflare Blog — [Registrar APIベータ版の発表](https://blog.cloudflare.com/registrar-api-beta/)（提供開始日、対応操作、原価価格、MCP統合、厳選されたTLD群）
- webhosting.today — [AIエージェントが人間なしでドメインを登録できるようになった](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/)（Cloudflareベータ版とガバナンス上の影響をめぐる業界の見方）
- Name.com — [初のAIネイティブ・ドメインプラットフォーム](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20first%20registrar%20to%20bring%20together%20intelligent%20domain%20capabilities%20and%20seamless%20integration%20for%20AI%20agents)（2025年七月の発表）
- CircleID — [2026年のドメイン世界：AI、セキュリティ、市場成熟、新gTLDの最前線](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)（2026年四月のエージェント型リセラー分析）
- dev.to — [人間なしでAIエージェントを使ってドメイン名を登録する方法](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26)（Cloudflare Registrar APIを使った第三者作成のMCPチュートリアル）
- llmstxt.org — [/llms.txtファイル](https://llmstxt.org)（仕様と提案理由）
- modelcontextprotocol.io — [Model Context Protocolとは？](https://modelcontextprotocol.io#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications)（プロトコル概要）
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt)（Namefi自身による機能索引：API、MCPサーバー、認証モデル、DNS、トークン化機能）
