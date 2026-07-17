---
title: "Namefi MCPクイックスタート：Claude Code、Cursor、Windsurf"
date: '2026-07-10'
language: 'ja'
tags: ['ai-agents', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
format: guide
ogImage: ../../assets/mcp-quickstart-og.jpg
description: "Claude Code、Cursor、Windsurfのエディター別MCP設定と、新しいアプリから公開中のカスタムドメインまでをエディター内で完結する5段階のクイックスタートです。"
keywords: ["claude code mcp ドメイン", "cursor mcp ドメイン", "windsurf mcp ドメイン", "エディター内ドメイン登録", "コーディングエージェント ドメイン登録", "エディターからドメイン登録", "mcp クイックスタート", "namefi mcp 設定", "vercel カスタムドメイン namefi", "cloudflare pages カスタムドメイン namefi", "ai エージェント デプロイ カスタムドメイン", "ドメイン登録 クイックスタート", "x-api-key mcp 設定", "デプロイ先にドメインを接続"]
relatedArticles:
  - /ja/blog/ai-agent-register/
  - /ja/blog/claude-mcp-domains/
  - /ja/blog/namefi-mcp/
  - /ja/blog/wallet-checkout/
  - /ja/blog/vibe-coding-domain/
relatedTopics:
  - /ja/topics/domain-tokenization/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/tokenize-your-com/
  - /ja/series/blockchain-concepts/
relatedGlossary:
  - /ja/glossary/ai-agent/
  - /ja/glossary/registrar/
  - /ja/glossary/dns-record-types/
  - /ja/glossary/nameserver/
  - /ja/glossary/domain-renewal/
---

すでにエディターを開いています。アプリのひな型を作り、最初のデプロイをプラットフォームのサブドメインへ公開しました。利用者に案内する前に残っているのは、本物のドメインだけです。このクイックスタートでは、ブラウザーのタブを開かず、決済フォームに入力せず、アプリを構築した[コーディングエージェント](/ja/glossary/ai-agent/)のセッションを離れずに登録する方法を説明します。Claude Code、Cursor、Windsurfの正確な[MCP](https://modelcontextprotocol.io)接続設定、要点を絞った五段階の手順、そして多くのドメインガイドが省略する部分、つまり登録したばかりのドメインを、公開したばかりのデプロイ先に実際に接続する方法まで扱います。

このガイドが三つのエディターを扱うのには理由があります。OpenAI Codex、Gemini CLI、Claude Desktopを使っている場合は、[NamefiでAIエージェントを使ってドメインを登録する方法](/ja/blog/ai-agent-register/)が、六つのクライアントで検証済みの設定と、MCPを標準対応しない環境向けの直接的なREST手順をまとめた基本ガイドです。ここで紹介する設定はすべて、そのガイドに記載された同じ[Namefi](https://namefi.io) MCPサーバーへ接続するため、内容に矛盾はありません。このページは開発者ツールを起点に要点をまとめ、基本ガイドにはないデプロイ接続の手順を加えたものです。

## エディター内でドメインを登録する理由

「ドメインを登録しに行く」という作業は、五分で終わる内容に対して、非常に大きなコンテキスト切り替えを伴います。エディターを離れてレジストラのサイトを開き、名前を検索し、頼んでもいないプライバシー保護やメールホスティングの追加販売をやり過ごし、支払い、戻ってから追加すべきDNSレコードを調べる必要があります。

代わりに、プロジェクトのひな型を作り、デプロイまで設定した同じエージェントに最後の工程も任せられます。今の会話の中で、名前の確認、登録、DNS接続をすべてツール呼び出しとして処理する方法です。[Cloudflareも自社のRegistrar APIで同じ考え方を取り入れた機能を売り出しています](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=An%20agent%20using%20the%20API%20can%20suggest%20domain%20names%2C%20check%20registrability%2C%20and%20complete%20the%20purchase%20without%20the%20user%20leaving%20their%20current%20context)。これは一部だけが好む特殊な方法ではなく、複数のレジストラが目指しているワークフローだという証拠です。終盤の比較セクションでは、Cloudflareとの違いを具体的に説明します。Namefiの方式には[トークン化ドメイン](/ja/glossary/tokenized-domain/)の選択肢と、アカウントを必要としないウォレット署名決済が加わります。詳細は[暗号資産ウォレットでドメイン料金を支払う](/ja/blog/wallet-checkout/)で説明します。

## 接続設定：三つのエディター、三つの設定ファイル

以下の三つのエディターはすべて、Streamable HTTPを通じて同じエンドポイント`https://api.namefi.io/mcp`へ接続し、Namefiの[APIキー](https://namefi.io/api-key)を`x-api-key`ヘッダーとして送信します。エディターごとに異なるのは、ファイル形式とファイルを書き込むコマンドだけです。

### Claude Code

Claude Codeの公式ドキュメントには、カスタムヘッダーを使うリモートHTTPサーバーを追加する直接的なCLIコマンドが示されています。

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

実際のキーに置き換え、プロジェクトのターミナルから一度だけ実行します。デフォルトではサーバーが**local**スコープに記録され、自分がこのプロジェクト内だけで利用できます。代わりに`--scope user`を加えると、このマシン上のすべてのプロジェクトで利用できます。`claude mcp list`で接続を確認してください。

### Cursor

Cursorは`mcp.json`からMCPサーバーを読み取ります。プロジェクト用は`.cursor/mcp.json`、グローバル用は`~/.cursor/mcp.json`です。公式ドキュメントのリモートサーバー形式は、環境変数の展開を使ったヘッダー認証に対応しているため、キー自体をファイルに保存する必要はありません。

```json
{
  "mcpServers": {
    "namefi": {
      "url": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

`${env:NAMEFI_API_KEY}`は、Cursorを起動したシェルでこの変数に入っている値に展開されます。エディターを開く前にexportしてください。

### Windsurf（Cascade）

Cascadeという名称のWindsurfのMCP統合機能は、`~/.codeium/windsurf/mcp_config.json`を読み込みます。ここではリモートサーバーに`serverUrl`フィールドを使い、`url`は使いません。`headers`と`${env:VAR}`のパターンはCursorと同じです。

```json
{
  "mcpServers": {
    "namefi": {
      "serverUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

注意すべき点が一つあります。このガイドの公開日時点で、`docs.windsurf.com/windsurf/cascade/mcp`は`docs.devin.ai/desktop/cascade/mcp`へリダイレクトされます。Windsurfのドキュメントは現在、CognitionのDevin製品ドキュメントのドメインにあり、上の設定形式はその現行ページに記載されたものです。古いビルドを利用している場合は、そのバージョンのアプリ内ヘルプが示すドキュメントでフィールド名を確認してください。

## 五段階のクイックスタート：新しいアプリから公開DNSまで

上記いずれかの接続が有効になれば、利用するエディターに関係なく、その後の流れは同じです。

1. 新しいドメインを所有するウォレットで生成した**APIキーを[namefi.io/api-key](https://namefi.io/api-key)から取得します。**
2. 上記のエディター別設定を使って**接続**し、正常に動くか確認します。「Namefiで`<yourapp>.com`が利用できるか確認し、どのツールを呼び出したか教えて」と依頼してください。これは読み取り専用の`checkAvailability`呼び出しなので、資金を用意する前でも動作します。
3. **登録します。** 名前と期間を自然な言葉で確認します。たとえば「一年間登録して」と依頼します。エージェントは`registerDomain`を送信し、注文が`SUCCEEDED`または最終的な失敗状態に達するまでポーリングします。通常の登録は数回のポーリングで完了します。
4. **デプロイ先へ接続します。** 次のセクションで詳しく扱う手順です。同じ会話から、ホスティングプラットフォームが求めるDNSレコードを追加します。
5. **名前解決を確認します。** [DNS伝播](/ja/glossary/dns-propagation/)は瞬時には完了しません。数分待ってから、公開DNSの照会を使うか、ブラウザーでドメインを直接開いて確認します。

## 新しいドメインをデプロイ先へ接続する

一般的な「ドメインを登録する方法」のガイドがここまで扱うことはありません。登録後にホスティングプラットフォーム側で行う作業だからです。しかし、これこそエディター内で処理する意味です。エージェントはどのプラットフォームへデプロイしたかをすでに把握しているため、登録に続けてDNSも設定できます。

### Vercel

Vercelの公式ドメインドキュメントでは、プロジェクトダッシュボードの**Settings → Domains**から始まる手順を説明しています。ドメインを追加すると、apexドメインかサブドメインかに応じて、作成すべきレコードが表示されます。**apexドメイン**（`yourapp.com`）には配信IPを指す**Aレコード**、**サブドメイン**（`www.yourapp.com`）には**CNAME**が必要です。古いガイドの例をコピーする前に知っておくべき点として、[Vercelのドキュメントは、このCNAMEの接続先がプロジェクトごとに固有であると明記しています](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record)。すべてのプロジェクトが共有する固定ホスト名ではなく、ダッシュボードに表示された値を使います。

値を確認したら、DNS側の作業はエージェントへの追加の依頼一つで完了します。

> 「`@`が`76.76.21.21`を指すAレコードと、`www`がVercelから提示されたCNAMEの接続先を指すCNAMEを追加して」

これにより`createDnsRecord`がレコードごとに一度、合計二回呼び出されます。Namefi上のあらゆるDNS書き込みに使用するものと同じ[DNSレコード](/ja/glossary/dns-record-types/)ツールです。末尾のドットに関する規則も同じで、CNAMEの接続先を表す`rdata`には末尾のドットが必要ですが、ドメインを表す`zoneName`には不要です。

### Cloudflare Pages

デプロイ先がCloudflare Pagesで、ドメインのDNSがまだCloudflareで管理されていない場合、[Cloudflareのカスタムドメインに関する公式ドキュメント](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain)では、プロジェクトの`.pages.dev`サブドメインを指す**CNAME**レコード一つを求めています。PagesはすべてをそのCNAMEの接続先から配信するため、Aレコードは不要です。まずCloudflareダッシュボードの手順（Workers & Pages → 対象プロジェクト → Custom domains → Set up a domain）を済ませる必要があります。その後でのみ、CNAMEの接続先が正しく解決されます。

> 「`app`が`my-project.pages.dev.`を指すCNAMEを追加して」

同じツール呼び出しと、接続先に関する同じ末尾ドット規則を使います。異なるのはプラットフォームだけです。

<!-- TODO: 要確認 — 新しく接続したカスタムドメインでTLS証明書を発行・更新するVercelとCloudflare Pagesの正確な手順を検証し、両方で自動なのか、手動操作が必要なのかを明記する -->

## Cloudflareのエディター内登録との比較

Cloudflareはエディター内での登録を積極的に売り出しているもう一つのレジストラであり、直接比較する価値があります。[2026年4月時点でベータ版と報じられた](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/)Registrar APIは、CursorやClaude Codeを含むMCP対応エディターとも連携します。エージェントは現在のコンテキストを離れず、ドメインの検索、価格確認、同期的な登録を行えます。このガイドでNamefiを使って説明したものと同じ中心的な考え方です。同じ報道によると、ベータ時点のCloudflare APIは、移管や更新など登録後の管理にはまだ対応しておらず、2026年後半に提供する予定です。

NamefiのMCPサーバーは現在、登録、DNS、[自動更新](/ja/glossary/domain-renewal/)までのライフサイクル全体をカバーしています。さらにCloudflareの方式にはない二つの機能があります。ドメインはデフォルトで[トークン化ドメイン](/ja/glossary/tokenized-domain/)NFTとして登録され、受取先に任意のウォレットを指定できます。また、Namefiアカウントなしでウォレット署名による決済を利用できます。詳しくは[暗号資産ウォレットでドメイン料金を支払う](/ja/blog/wallet-checkout/)で説明します。どちらも「エディターを離れない」ワークフローを目指しています。標準的な登録を求めるか、オンチェーン資産でもある登録を求めるかによって、適した方式が変わります。

## よくある質問

### CodexやGemini CLIも対象ですか？
このガイドでは扱いません。意図的にClaude Code、Cursor、Windsurfに限定しています。[NamefiでAIエージェントを使ってドメインを登録する方法](/ja/blog/ai-agent-register/)には、Codex CLI、Gemini CLI、Claude Desktop向けに、同じく正確に検証済みの設定があります。

### 試す前にNamefiアカウントが必要ですか？
いいえ。読み取り専用の利用可能性確認には認証が不要なので、APIキーを生成したり資金を用意したりする前に、上記のどのエディターでも接続して手順2のテストプロンプトを実行できます。

### デプロイ先がVercelやCloudflare Pagesではない場合は？
どの環境でも基本は同じです。プラットフォームのダッシュボードに必要なDNSレコードタイプが表示されます。ほとんどの場合、apexドメインにはAレコード、サブドメインにはCNAMEです。その値をエージェントに渡し、`createDnsRecord`で書き込ませます。

### この方法で登録すると、ドメインは自動的にトークン化されますか？
はい。リクエストで別の`nftReceivingWallet`を指定しない限り、デフォルトではAPIキーに紐づくウォレットに対して、Base上のNFTとしてドメインが登録されます。初めて知った場合は、[トークン化ドメインとは？](/ja/blog/what-are-tokenized-domains/)をご覧ください。

### APIキーを完全に省略できますか？
はい。ただし条件があります。Namefiのウォレット署名による[x402](/ja/glossary/x402/)決済では、資金のあるウォレットが、アカウントもAPIキーも使わずに登録料金を支払えます。別途説明が必要な仕組みなので、[暗号資産ウォレットでドメイン料金を支払う](/ja/blog/wallet-checkout/)で詳しく扱います。

## アプリと一緒にドメインも公開する

ドメインは、デプロイ先やデータベースと同じインフラです。アプリを公開する要素のうち、ドメインだけがツールを離れてウェブフォームに入力しなければならない理由はありません。上の三つの設定から一つを接続して五段階の手順を実行すれば、ブラウザーのタブを一つも開かずに、エージェントが構築したデプロイ先を指すドメインが公開されます。

**[Namefi APIキーを生成し](https://namefi.io/api-key)**、すでに開いているエディターで利用可能性確認のプロンプトを試してください。全手順を詳しく確認したい場合は、[注釈付きの対話記録を含むClaude Code完全ガイド](/ja/blog/claude-mcp-domains/)をご覧ください。

## 出典と参考資料

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt)（MCPサーバーURL、転送方式、認証、登録/DNSエンドポイントのリファレンス — このガイドのNamefi固有の説明すべてに対する一次資料）
- Namefi — [docs.namefi.io：ドメインを登録する](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx)（登録リクエストのフィールド、ポーリング手順、注文ステータスの値）
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)（MCPディスカバリーディスクリプター）
- Anthropic / Claude Code — [MCPでClaude Codeをツールに接続する](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http)（`claude mcp add --transport http`構文、`--header`、`--scope`フラグ）
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp)（`mcp.json`のリモートサーバー形式、`headers`、`${env:VAR}`展開、プロジェクト用とグローバル用の設定場所）
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp)（このガイドの公開日時点で[docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp)へリダイレクト。`mcp_config.json`形式、`serverUrl`、`headers`）
- Vercel — [カスタムドメインの追加と設定](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record)（apexドメインのAレコード、サブドメイン用のプロジェクト固有CNAME接続先、ネームサーバー方式）
- Vercel — [ドメインの概要](https://vercel.com/docs/domains#:~:text=76.76.21.21)（apexのAレコードに使う配信IP `76.76.21.21`）
- Cloudflare — [Pagesのカスタムドメイン](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain)（Cloudflareで管理されていないドメイン向けの`.pages.dev`へのCNAME接続手順）
- webhosting.today — [AIエージェントが人間なしでドメインを登録可能に](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/)（Cloudflare Registrar APIベータ版の報道：エディター連携、ベータ版の制限）
- Model Context Protocol — [modelcontextprotocol.io](https://modelcontextprotocol.io)（プロトコルの概要）
