---
title: "NamefiでAIエージェントを使ってドメインを登録する方法"
date: '2026-07-10'
language: 'ja'
tags: ['ai-agents', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
format: guide
ogImage: ../../assets/ai-agent-register-og.jpg
description: "Claude、Codex、Cursorなど、あらゆるAIエージェントからMCP、REST、ウォレット決済を介してNamefiでドメインを登録するための決定版ガイド。"
keywords: ["AIエージェント ドメイン登録", "Namefi チュートリアル", "Claude ドメイン登録", "Codex ドメイン登録", "Cursor MCP ドメイン", "Windsurf MCP ドメイン", "Gemini CLI MCP ドメイン", "エージェント ドメイン 登録方法", "x-api-key", "MCPサーバー", "ウォレット決済", "Namefi MCP ドメイン登録", "AIエージェント Namefi ドメイン購入", "MCP ドメイン登録 チュートリアル"]
relatedArticles:
  - /ja/blog/claude-mcp-domains/
  - /ja/blog/cf-namecom-namefi/
  - /ja/blog/ai-domain-platforms/
  - /ja/blog/agent-native/
  - /ja/blog/airo-vs-namefi/
relatedTopics:
  - /ja/topics/domain-tokenization/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/tokenize-your-com/
  - /ja/series/blockchain-concepts/
relatedGlossary:
  - /ja/glossary/ai-agent/
  - /ja/glossary/registrar/
  - /ja/glossary/wallet/
  - /ja/glossary/x402/
  - /ja/glossary/tokenized-domain/
---

任意の[AIエージェント](/ja/glossary/ai-agent/)（特定ベンダーのものに限りません）を使い、[ICANN](/ja/glossary/icann/)認定[レジストラ](/ja/glossary/registrar/)である[Namefi](https://namefi.io)で実在するドメインを登録したいなら、このページをブックマークしてください。どのクライアントから操作しても変わらない仕組みを説明したうえで、現在よく使われている六つのエージェント、Claude Desktop、Claude Code、OpenAI Codex、Cursor、Windsurf、Gemini CLIについて、個別に検証した正確な設定手順を示します。お使いのエージェントがこの一覧にない場合にも対応できるよう、最後にHTTPリクエストを実行できるあらゆる環境で使える素のREST手順も紹介します。NamefiのAPI全体は、まさにその目的のためプレーンテキストでも公開されています。

このガイドはNamefiチームが執筆・管理しているため、各手順のNamefi側については一次情報に基づいています。エージェント向けに[namefi.io/llms.txt](https://namefi.io/llms.txt)と[docs.namefi.io](https://docs.namefi.io)で公開しているものと同じAPIを、人が読める形で説明します。各エージェントベンダーの設定については、このガイドの公開日時点における各ベンダー自身の最新ドキュメントと照合して検証しました。明確な答えがドキュメントにない箇所は、推測で補わず、その旨を明示しています。

すでにClaudeを使うと決めていて、実際の会話記録を含む注釈付きの詳しい手順を読みたい場合は、[Claudeでドメインを購入：Namefi MCPステップバイステップガイド](/ja/blog/claude-mcp-domains/)をご覧ください。このページはハブであり、そちらの記事や本文中の各リンクが、さらに詳しい情報へつながっています。

## 「AIエージェントでドメインを登録する」とは実際にはどういうことか

フォームを自分で入力せず、エージェントに代わってドメインを登録してもらうには、二つの条件を満たす必要があります。まず、エージェントがNamefiのAPIを*見つけて呼び出す*方法を持っていることです。会話型のAIクライアントを外部ツールサーバーに接続し、呼び出せる操作の一覧を認識させるオープン標準、[Model Context Protocol](https://modelcontextprotocol.io)（MCP）を使うか、会話型ではなくスクリプト型のエージェントなら通常のHTTPリクエストを使います。次に、エージェントが*支出の承認*を得ていることです。入金済み残高に紐づくAPIキー、またはその場で支払いに署名できる暗号資産[ウォレット](/ja/glossary/wallet/)が必要です。このガイドで説明する内容は、すべてこの二つのいずれかに当たります。

NamefiはAPI全体に対して単一のMCPサーバーを運用しており、Streamable HTTPトランスポートを使って`https://api.namefi.io/mcp`で提供しています。エージェント自身、またはそれを設定する人は、このページを読まなくてもサーバーを見つけられます。[namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)で機械可読の記述子を公開しており、サーバー名を`namefi-api`、トランスポートを`streamable-http`として記載しています。以下のクライアントはすべて同じURLに接続します。違うのは、そのURLを指定するために各クライアントの設定ファイルやコマンドラインで使う書式だけです。

## 共通の五つのステップ

以下は、この先にあるエージェント別の各セクションに共通する手順です。ここで理解しておけば、エージェント別の説明は単に「このツールでステップ2を実行するにはどうすればよいか」という違いにすぎません。

1. **認証情報を取得する。** [APIキー](https://namefi.io/api-key)を生成します。これは`nfk_`で始まる文字列で、登録、DNSレコードの作成、更新、削除といったすべての操作に使えます。キーは生成元ウォレットの権限を継承するため、ドメインを所有させるウォレットから生成してください。NamefiのAPIキーを一切保持したくない場合は、後述のウォレット支払い手順へ進んでください。アカウントは不要です。
2. **エージェントをMCPサーバーに接続する。** キーを含む`x-api-key`ヘッダーを付けて、クライアントの接続先を`https://api.namefi.io/mcp`に設定します。正確な書式はクライアントごとに異なるため、以下のお使いのエージェントのセクションを参照してください。
3. **検索して価格を確認する。** 名前が利用可能かどうかを自然な言葉で尋ねます。これにより`checkAvailability`操作（`GET /v-next/search/availability?domain=…`）が呼び出されます。この操作には認証が一切不要です。複数の候補をまとめて調べる場合は、一括版も利用できます。
4. **登録し、完了まで確認する。** 確認すると、エージェントは`registerDomain`（`POST /v-next/orders/register-domain`）を送信します。同じ呼び出しでDNSも設定したい場合は、`register-domain/records`統合版を使います。登録は非同期です。リクエスト本文には`normalizedDomainName`と`durationInYears`を指定します。`register-domain/records`エンドポイントでは、さらに`records`配列（各レコードに`name`、`type`、`rdata`、`ttl`）を指定でき、注文が完了した時点でDNSが書き込まれます。エージェント（またはユーザー）は、`SUCCEEDED`、`FAILED`、`CANCELLED`、`PARTIALLY_COMPLETED`のいずれかの終了状態になるまで、`getOrder`（`GET /v-next/orders/{orderId}`）をポーリングします。
5. **DNSを設定して確認する。** `createDnsRecord`（`POST /v-next/dns/records`）を使って[DNSレコード](/ja/glossary/dns-record-types/)を追加または調整し、必要なら[ネームサーバー](/ja/glossary/nameserver/)レベルの委任先を設定します。[DNS伝播](/ja/glossary/dns-propagation/)に数分待ってから、ドメインが名前解決されることを確認してください。

登録リクエストは、ドメインごとの上書き設定を含む`domainSetupOptions`オブジェクトも受け付けます。設定項目は`autoPark`、`autoEns`、`autoRenew`、`dnssec`、`keepExistingNameservers`です。最後の項目は、ドメインの既存のネームサーバー委任をNamefiが変更せず、そのまま残すよう指定します。登録直後も別の場所で名前解決を続ける必要があるドメインに便利です。任意の`nftReceivingWallet`フィールドは、ドメインの所有権トークンを受け取る場所を指定します。省略すると、ドメインはAPIキーに紐づくウォレット宛てに、Base上のNFTとして登録されます。

## エージェント別設定一覧

| エージェント | 接続方法 | 設定の保存場所 | カスタム認証ヘッダー対応 | 検証に使用した資料 |
| --- | --- | --- | --- | --- |
| Claude Code | MCP、Streamable HTTP | `claude mcp add` CLIコマンド（`~/.claude.json`または`.mcp.json`に書き込み） | 対応 — `--header`フラグ | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp)、2026-07-10に検証 |
| Claude Desktop / claude.ai | Custom Connector経由のMCP、Streamable HTTP | Settings → Connectors → Add custom connector | サーバー主導の認証プロンプト（サーバーからの要求に応じてOAuth、APIキー、または認証情報） | [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers)、2026-07-10に検証 |
| OpenAI Codex CLI | MCP、Streamable HTTP | `~/.codex/config.toml`の`[mcp_servers.<name>]`テーブル | 対応 — `http_headers`（固定値）または`env_http_headers`（環境変数から取得） | [learn.chatgpt.com/docs/extend/mcp](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)（現在は`developers.openai.com/codex/mcp`からここへリダイレクト）、2026-07-10に検証 |
| Cursor | MCP、Streamable HTTP | `.cursor/mcp.json`（プロジェクト）または`~/.cursor/mcp.json`（グローバル） | 対応 — `${env:VAR}`展開を使える`headers`オブジェクト | [cursor.com/docs/mcp](https://cursor.com/docs/mcp)、2026-07-10に検証 |
| Windsurf（Cascade） | MCP、Streamable HTTP | `~/.codeium/windsurf/mcp_config.json` | 対応 — `serverUrl`エントリ上の`headers`オブジェクトで`${env:VAR}`展開が可能 | [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp)（このガイドの公開日時点では`docs.devin.ai/desktop/cascade/mcp`にリダイレクト。後述のWindsurfセクションを参照）、2026-07-10に検証 |
| Gemini CLI | MCP、Streamable HTTP | `~/.gemini/settings.json`（ユーザー）または`.gemini/settings.json`（プロジェクト） | 対応 — `httpUrl`エントリ上の`headers`オブジェクト | [geminicli.com/docs/tools/mcp-server](https://geminicli.com/docs/tools/mcp-server/)、2026-07-10に検証 |
| その他のMCPクライアント | MCP、Streamable HTTP | クライアントのドキュメントに記載された設定形式 | クライアント次第 — Namefi側のサーバーは変わりません | [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) |
| その他のスクリプトまたはMCP非対応エージェント | 素のREST | 該当なし — HTTPSを直接呼び出し | 対応 — すべての書き込み呼び出しで`x-api-key`ヘッダーを使用 | [namefi.io/llms.txt](https://namefi.io/llms.txt)、[docs.namefi.io](https://docs.namefi.io) |

上のすべての行は、同一のサーバーと同一の操作セットに接続します。エージェントごとに変わるのは、そのクライアントに「ここにリモートMCPサーバーがあり、このヘッダーを付けて送信する」と伝えるための書式だけです。

**毎回、同じテストプロンプトを使います。** 以下で各エージェントを接続したら、クライアントごとの結果を比較できるよう、次のプロンプトをそのまま実行してください。

> 「`example.com`をNamefiで登録できるか確認し、その確認に使用したツールまたは操作を教えてください。まだ登録はしないでください。」

これは読み取り専用の呼び出しです。`checkAvailability`には認証が不要なため、まだ入金していなくても、接続したばかりのエージェントで安全に実行できます。接続とツール一覧が正しく機能しているかも、すぐに確認できます。

## Claude Desktopとclaude.ai

Claude Desktopとclaude.aiは、**Custom Connectors**を通じてリモートMCPサーバーに接続します。Settingsを開き、Connectorsへ移動して「Add custom connector」を選び、サーバーURLとして`https://api.namefi.io/mcp`を入力します。Addをクリックすると、Claudeから認証を完了するよう求められます。Anthropicのドキュメントでは、この手順には一般に「OAuth、APIキー、またはユーザー名とパスワードの組み合わせ」が使われると説明されており、実際のプロンプトは接続先サーバーが要求する内容によって決まります。

<!-- TODO: 検証 — Claude DesktopのCustom Connector画面で、x-api-key形式のヘッダーを入力する具体的なフィールド --> Desktopの設定画面にキーを貼り付ける場所が明確に表示されない場合、現時点では、書き込み操作については次のClaude Codeが検証済みの方法です。利用可否検索のような読み取り専用ツールは、キーなしでもコネクター経由で動作します。接続後のコネクターの動作を含む詳しい手順については、[Claudeでドメインを購入：Namefi MCPステップバイステップガイド](/ja/blog/claude-mcp-domains/)をご覧ください。

## Claude Code

Claude Codeの公式ドキュメントには、カスタムヘッダーを指定してリモートHTTP MCPサーバーを追加するための正確で汎用的な書式が示されています。

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

実際のキーに置き換えて、ターミナルからこのコマンドを一度実行します。デフォルトでは、サーバーは**local**スコープに書き込まれます。これは現在のプロジェクト内で自分だけが利用できる設定です（以前のClaude Codeでは、このスコープを「project」と呼んでいました）。マシン上のすべてのプロジェクトで接続を利用するには`--scope user`、コミット対象の`.mcp.json`ファイルを介してプロジェクトの全員と共有するには`--scope project`を追加します。`claude mcp list`で接続を確認し、セッション内で`/mcp`を実行して現在のツール数を確認してください。

## OpenAI Codex CLI

Codex CLIはMCP設定をTOMLファイルに保存します。デフォルトは`~/.codex/config.toml`です（信頼済みプロジェクトでは、プロジェクトスコープの`.codex/config.toml`も利用できます）。各サーバーには専用のテーブルが割り当てられ、使用するトランスポートは指定されたキーから推測されます。`command`キーならローカルのstdioサーバー、`url`キーならStreamable HTTPです。Codexのドキュメントでは、テーブル名にはアンダースコア付きの`mcp_servers`を使う必要があると明記されています。`mcp-servers`などの表記は通知なしで無視されます。

```toml
# ~/.codex/config.toml
[mcp_servers.namefi]
url = "https://api.namefi.io/mcp"
env_http_headers = { "x-api-key" = "NAMEFI_API_KEY" }
```

この形式では、キーをファイルに書き込まず、`NAMEFI_API_KEY`という環境変数から取得します。Codexを実行する前に、シェルで環境変数を設定してください。キーを直接記述する場合（コミットする可能性のあるファイルでは非推奨）、対応する固定値形式は`http_headers = { "x-api-key" = "YOUR_KEY" }`です。Codexには、`Authorization: Bearer …`形式の認証専用の`bearer_token_env_var`フィールドもあります。しかし、Namefiの`x-api-key`ヘッダーには、Bearer専用フィールドではなく、汎用の`http_headers`または`env_http_headers`を使用します。

## Cursor

Cursorは`mcp.json`からMCPサーバー定義を読み込みます。リポジトリルートのプロジェクトスコープ用`.cursor/mcp.json`、または全体に適用される`~/.cursor/mcp.json`を使用できます。Cursorのドキュメントには、ヘッダー認証と環境変数の展開を含むリモートサーバー用の形式が直接示されているため、キー自体をファイルに保存せずに済みます。

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

`${env:NAMEFI_API_KEY}`は、接続時にその環境変数に設定されている値へ展開されます。同じ設定の要点をまとめた手順については、[Namefi MCPクイックスタート：Claude Code、Cursor、Windsurf](/ja/blog/mcp-quickstart/)をご覧ください。

## Windsurf（Cascade）

製品内で**Cascade**と呼ばれるWindsurfのMCP統合は、`~/.codeium/windsurf/mcp_config.json`からサーバー一覧を読み込みます。リモートHTTPサーバーでは`command`ではなく`serverUrl`フィールドを使い、Cursorと同様の`headers`オブジェクトと`${env:VAR}`展開を指定します。

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

明確に注意しておきたい点が一つあります。このガイドの公開日時点では、`docs.windsurf.com/windsurf/cascade/mcp`は`docs.devin.ai/desktop/cascade/mcp`へリダイレクトされます。現在、WindsurfのドキュメントはCognitionのDevin製品ドキュメントのドメインで公開されており、そのページでは「Devin Desktop」とともに「Windsurf」と「Cascade」の両方に言及しています。上の設定形式は、その最新ページに記載されているものです。古いWindsurfビルドをお使いの場合もフィールド名は一致するはずですが、そのバージョンのアプリ内ヘルプからリンクされているドキュメントURLで確認してください。

## Gemini CLI

Gemini CLIは`settings.json`からMCPサーバーを読み込みます。ユーザーレベルの`~/.gemini/settings.json`、またはそのプロジェクト内でのみ適用されるプロジェクトレベルの`.gemini/settings.json`を使用できます。リモートサーバーの形式では、`url`ではなく`httpUrl`を使います。

```json
{
  "mcpServers": {
    "namefi": {
      "httpUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "YOUR_KEY"
      }
    }
  }
}
```

Gemini CLIのドキュメントには、特定のツール呼び出しが通常より長くかかる場合に使える`timeout`フィールドも記載されています（単位はミリ秒、デフォルトは600,000）。クライアントが待機するのはポーリングループ全体ではなく個々の呼び出しだけなので、登録状況のポーリングでこの設定が必要になることはないでしょう。

## その他のMCP対応エージェント

お使いのエージェントが上記六つのいずれでもなく、MCPに対応している場合も、接続するクライアントにかかわらずサーバー側は同じです。Streamable HTTPを使って`https://api.namefi.io/mcp`を指定し、カスタムヘッダーとして`x-api-key: YOUR_KEY`を設定します。具体的な設定ファイルやコマンドの書式については、クライアント自身のドキュメントを確認してください。[namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)のディスカバリー記述子は、人が貼り付けなくてもエージェント（または設定する人）がサーバーのURL、トランスポート、認証要件を見つけられるようにするために用意されています。

クライアントがリモートHTTPやSSEへ直接接続できず、**ローカル（stdio）MCPサーバー**だけに対応している場合に知っておくとよい方法があります。コミュニティ製の`mcp-remote`パッケージを使えば、リモートのStreamable HTTPサーバーをクライアントが通常どおり起動できるローカルプロセスとして中継し、設定したヘッダーを転送できます。これはNamefiが公開している方法ではなくサードパーティー製の中継ツールなので、このガイドではNamefi自身のドキュメントに照らして検証できません。お使いのクライアントがネイティブのリモートHTTPに本当に対応していない場合の代替手段として扱い、標準的な方法にはしないでください。<!-- TODO: 検証 — ネイティブのStreamable HTTPに対応しないクライアントでNamefiのサーバーを利用するための、正確なmcp-remote実行例 -->

## MCPがまったくない場合：素のREST手順

上で説明したすべての操作は通常のHTTPSエンドポイントとしても提供され、[namefi.io/llms.txt](https://namefi.io/llms.txt)ではエンドポイントごとに、[docs.namefi.io](https://docs.namefi.io)では全体が詳しく文書化されています。HTTP呼び出しはできるもののMCPには対応していないエージェントフレームワーク（独自スクリプト、別のエージェントランタイム、CIジョブなど）でも、同じ処理を直接実行できます。

```bash
# 1. Check availability (no auth required)
curl "https://api.namefi.io/v-next/search/availability?domain=example.com"

# 2. Register (requires x-api-key)
curl -X POST "https://api.namefi.io/v-next/orders/register-domain" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"normalizedDomainName": "example.com", "durationInYears": 1}'

# 3. Poll the order until it reaches a terminal status
curl "https://api.namefi.io/v-next/orders/{orderId}" \
  -H "x-api-key: YOUR_KEY"
```

llms.txtはプレーンテキストの慣例です。レンダリングされたドキュメントをクロールしなくても、AIエージェントがAPIの機能を見つけられるよう、サイトのルートで公開する機械可読の索引を指します。Namefiのファイルは十分短いため、上の要約版ではなく全体を読みたい場合は、[namefi.io/llms.txt](https://namefi.io/llms.txt)から直接読めます。この慣例自体について詳しくは、[ドメイン向けllms.txt：あらゆるAIエージェントが読めるAPI](/ja/blog/llms-txt/)をご覧ください。

## 支払い：APIキーとウォレット決済

ここまでのセクションではすべて、入金済みのNFSC（Namefi Service Credit）残高から請求されるAPIキーを前提としています。残高は`GET /v-next/balance`（`x-api-key`が必要）でいつでも確認でき、開発環境ではFaucetエンドポイントから、本番環境ではNamefiのダッシュボードから入金できます。<!-- TODO: チームに確認 — 本番環境での正確なNFSC入金手順、利用できる支払い方法、チャット/APIから購入できるか、それともダッシュボードUI限定か -->

Namefiでは、暗号資産ウォレットを使い、**Namefiアカウントを一切作らずに**ドメインを登録することもできます。[x402](/ja/glossary/x402/)プロトコルを使う方法です。エージェントのウォレットがEIP-3009認可に署名し、支払いがまだ添付されていなければAPIは価格を示すHTTP 402を返します。有効な署名付き支払いが届くと登録が決済され、通常はUSDCのような[ステーブルコイン](/ja/glossary/stablecoin/)が使われます。これに関連して、MPP（Machine Payable Protocol）のチャレンジレスポンス方式と、どちらの簡略方式も使わないウォレット向けの手動EIP-712署名方式もあります。このウォレット優先の方法が、このガイドで扱うエージェントにとって重要なのは、アカウント作成の手順を完全に省けるからです。これにより、自律プロセスはAPIキーを保持する必要も、漏えいさせるおそれもなくなります。詳しい流れは、[暗号資産ウォレットでドメインを購入：アカウント不要](/ja/blog/wallet-checkout/)をご覧ください。

## エージェントに購入権限を与える前のガードレール

ドメインを登録できるエージェントは、実際に支出し、稼働中のサイトのDNSを書き換えることもできます。そのため、いくつかの項目はデフォルト任せにせず、意識して決めておく価値があります。

- **APIキーの権限を必要最小限のウォレットに限定する。** キーは生成元ウォレットの権限を継承します。エージェントにキーが漏れてほしくない資産を保有するウォレットではなく、新規登録を所有させるウォレットから生成してください。
- **エージェントが支出できる上限を設ける。** NFSC残高そのものが支出上限になります。大きな残高を常時持たせるのではなく、エージェントが無人で使用しても問題ない金額だけを入金してください。
- **どこで人が確認に入るかを決める。** 利用可否検索のような読み取り専用操作は認証不要で、リスクもありません。`registerDomain`を送信する、auto-renewを切り替える、すでにトラフィックを処理しているドメインのDNSレコードを書き込む、といった段階に進むときは、エージェントに自律実行させず、明示的な確認を必須にすべきです。
- **DNSの書き込みは確定前に確認する。** ほかのインフラ変更と同じようにレビューしてください。Namefiの検証は不正な形式のレコードを黙って受け入れず拒否しますが（下のトラブルシューティング表を参照）、検証で見つかるのは形式上の誤りです。構文的には正しくても値が間違っている場合は検出できません。

[エージェントネイティブなドメインレジストラとは？](/ja/blog/agent-native/)では、Namefiを含む各レジストラのエージェント向け機能を評価するための、ディスカバリー、機械可読のエラー、人がクレジットカードを操作することを前提としない支払い方法など、より詳しいチェックリストを示しています。

## トラブルシューティング

| 症状 | 考えられる原因 | 対処方法 |
| --- | --- | --- |
| 書き込み呼び出しで`401 UNAUTHORIZED`になる | APIキーが無効、期限切れ、または対象ドメインを所有していないウォレットから生成されている | ドメインを所有している（または所有する予定の）ウォレットから、[namefi.io/api-key](https://namefi.io/api-key)で新しいキーを生成する |
| `403 FORBIDDEN` | キーは有効だが、そのウォレットがこのドメインを所有していない | 再試行する前に所有権を確認する |
| Codexが`[mcp_servers.namefi]`エントリを無視する | テーブル名の入力ミス — Codexでは`mcp-servers`ではなく、アンダースコア付きの`mcp_servers`が必要 | `config.toml`のテーブル見出しを修正する |
| CursorまたはWindsurfでサーバーが切断済みと表示される | `headers`オブジェクトの形式が不正、または`${env:VAR}`が未設定の変数を参照している | JSONが有効であることと、参照先の環境変数がエディタを起動したシェルで実際にエクスポートされていることを確認する |
| Gemini CLIが設定を見つけられない | 誤った`settings.json`を編集している — ユーザーレベルとプロジェクトレベルは別ファイル | 対象が`~/.gemini/settings.json`か、現在のプロジェクトの`.gemini/settings.json`かを確認する |
| 登録注文が終了状態にならない | 正常 — 登録は非同期 | `getOrder`のポーリングを続け、`SUCCEEDED`、`FAILED`、`CANCELLED`、`PARTIALLY_COMPLETED`のどれにも到達しない場合にのみ停止と判断する |
| DNSレコードの作成・更新が検証エラーで拒否される | `zoneName`の末尾にドットがある、またはCNAME/MX/NSの`rdata`値に必要な末尾のドットがない | `zoneName` = 末尾のドットなし、FQDN型の`rdata`値 = 末尾のドットが必要 |
| 登録が完全に失敗する | 支払い元ウォレットのNFSC残高が不足している | `GET /v-next/balance`を確認し、Faucet（開発環境）またはダッシュボード（本番環境）で入金する |
| エージェントが利用できるドメインツールはないと回答する | MCPサーバーが接続されていない、または書き込み操作に必要なヘッダーなしで接続されている | クライアントの設定ファイルを再確認するか、ヘッダーを含めて「サーバー追加」コマンドをもう一度実行する |

## よくある質問

### 一つのエージェントを選び、ずっと使い続ける必要がありますか？
いいえ。接続するクライアントにかかわらず、MCPサーバーとすべてのRESTエンドポイントは同じです。移行作業なしで、同じAPIキーとNFSC残高を使い、今日はClaude Code、明日はCursorというように設定できます。

### ドメイン登録に「最適」なのはどのエージェントですか？
この作業について、エージェント間に意味のある機能差はありません。どのクライアントも同じサーバー側の操作を呼び出すからです。違いは各クライアント固有のMCP設定書式だけです。このガイドがそれぞれに専用セクションと同じテストプロンプトを用意しているのは、そのためです。クライアントごとに一度実行し、会話記録をご自身で比較してください。

### エージェントがMCPにまったく対応していない場合はどうすればよいですか？
上記の素のREST手順を使ってください。MCPツール呼び出しから到達するすべての操作は、HTTPSエンドポイントとしても文書化されています。`namefi.io/llms.txt`は、エージェント（または設定する人）がブラウザなしで読めるプレーンテキストの入口として、まさにこの目的で設計されています。

### この方法で登録すると、ドメインは自動的にトークン化されますか？
はい。デフォルトではトークン化されます。登録リクエストに`nftReceivingWallet`を指定しなければ、ドメインはBase上で、APIキーに紐づくウォレット宛てのNFTとして登録されます。登録時に別のウォレットを指定することもできます。

### APIキーを一切保持せず、エージェントにドメインを登録させることはできますか？
はい。ウォレットで署名するx402決済なら、NamefiアカウントもAPIキーも不要で、必要なのは入金済みウォレットだけです。上の支払いセクションで基本的な流れを説明しています。詳しい手順は、[暗号資産ウォレットでドメインを購入：アカウント不要](/ja/blog/wallet-checkout/)をご覧ください。

### エージェント経由の登録は、Namefiのウェブサイトから登録するより高くなりますか？
このガイドでは、いずれの方向についても価格差があるとは述べていません。<!-- TODO: チームに確認 — NamefiのMCP/API価格が標準の登録価格と同じか、それとも異なるか --> いずれにしても、リクエスト元がブラウザ、スクリプト、エージェントのツール呼び出しのどれであっても、すべて同じNFSC残高から引き落とされます。

## いま開いているエージェントから始める

このガイドを使うために六つのクライアントをインストールする必要はありません。必要なのは一つだけです。それに加えて、Namefi APIキーまたは入金済みウォレットを用意します。すでに使っているエージェントに対応する上のセクションを選び、設定して、テストプロンプトを試してください。その後は、このページで説明した検索、登録、DNS設定までの残りの手順を、同じ会話の中で進められます。

**[Namefi APIキーを生成](https://namefi.io/api-key)**するか、[会話記録付きのClaude詳細ガイド](/ja/blog/claude-mcp-domains/)や[エージェントネイティブなレジストラの比較](/ja/blog/cf-namecom-namefi/)へ進んでください。このガイドを支える各要素については、[Namefi MCPサーバー：AIエージェント向けドメインツール](/ja/blog/namefi-mcp/)、[Namefi MCPクイックスタート：Claude Code、Cursor、Windsurf](/ja/blog/mcp-quickstart/)、[暗号資産ウォレットでドメインを購入：アカウント不要](/ja/blog/wallet-checkout/)、[ドメイン向けllms.txt：あらゆるAIエージェントが読めるAPI](/ja/blog/llms-txt/)をご覧ください。

## 出典と参考資料

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt)（MCPサーバーのURL、トランスポート、認証、登録/DNSエンドポイントのリファレンス、`domainSetupOptions`フィールド — このガイドにあるNamefi固有の主張すべてについての一次資料）
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt)（x402、MPP、EIP-712によるウォレット支払い手順）
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)（MCPディスカバリー記述子：サーバー名、URL、トランスポート、認証方式）
- Namefi — [docs.namefi.io：認証](https://docs.namefi.io/docs/02-authentication.mdx)（APIキー、EIP-712、SIWE認証方式、操作ごとの認証要件）
- Namefi — [docs.namefi.io：ドメインの登録](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx)（登録リクエストのフィールド、ポーリング手順、注文ステータス値）
- Namefi — [docs.namefi.io：残高の管理](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx)（NFSC残高とFaucetエンドポイント）
- Anthropic / Claude Code — [MCPを介してClaude Codeをツールに接続](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http)（`claude mcp add --transport http`の書式、`--header`、`--scope`フラグ）
- Model Context Protocol — [リモートMCPサーバーへの接続](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication)（Claude Desktop / claude.aiのCustom Connectors手順）
- OpenAI — [learn.chatgpt.com：Model Context Protocol（Codex CLI）](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)（`config.toml`の`[mcp_servers.<name>]`テーブル、`url`、`http_headers`、`env_http_headers`、`bearer_token_env_var`フィールド）
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp)（`mcp.json`のリモートサーバー形式、`headers`、`${env:VAR}`展開、プロジェクト設定とグローバル設定の保存場所）
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp)（このガイドの公開日時点では[docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp)にリダイレクト。`mcp_config.json`の形式、`serverUrl`、`headers`）
- Google — [geminicli.com：Gemini CLIでMCPサーバーを使う](https://geminicli.com/docs/tools/mcp-server/)（`settings.json`の形式、`httpUrl`、`headers`、`timeout`）
- llmstxt.org — [/llms.txtファイル](https://llmstxt.org)（`namefi.io/llms.txt`が準拠するディスカバリー慣例の仕様と根拠）
