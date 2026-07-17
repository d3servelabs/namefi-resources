---
title: "Claudeでドメインを購入：Namefi MCPのステップ別ガイド"
date: '2026-07-10'
language: 'ja'
tags: ['ai-agents', 'domains', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
format: guide
ogImage: ../../assets/claude-mcp-domains-og.jpg
description: "ClaudeをNamefi MCPサーバーに接続し、一度の会話から実在するドメインを登録します。正確な設定、注釈付きの会話例、トラブルシューティングを解説します。"
keywords: ["namefi mcp", "claude mcp ドメイン", "mcp サーバー設定", "claudeでドメイン購入", "x-api-key", "ステップ別チュートリアル", "namefi mcp ドメイン登録", "claude desktop ドメイン登録", "claude code ドメイン購入", "namefi claude 連携", "mcp ドメインレジストラ", "aiエージェント claude ドメイン購入", "streamable http mcp"]
relatedArticles:
  - /ja/blog/ai-agent-register/
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
  - /ja/glossary/dns-record-types/
  - /ja/glossary/tokenized-domain/
  - /ja/glossary/x402/
---

このガイドを最後まで読むと、[ICANN](/ja/glossary/icann/)に実在するドメインを登録し、構築中のサービスにDNSを向けるところまで、Claudeとの会話だけで完了できます。ブラウザーでの決済も、カートも、CAPTCHAも必要ありません。これは[Namefi](https://namefi.io) MCPサーバーに関するNamefiチーム公式のセットアップガイドです。[namefi.io/llms.txt](https://namefi.io/llms.txt)と[docs.namefi.io](https://docs.namefi.io)でエージェント向けに公開している同じAPIを、人が読みやすい形で説明します。まだ確定または公開されていない詳細については、推測せず、その旨を明記します。

「[AIエージェント](/ja/glossary/ai-agent/)でドメインを登録する」方法を解説する第三者のガイドも存在します。[よく知られた一例](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26)では、Cloudflare Registrar API上にリセラーとして構築された別のMCPサーバーを使って、このパターンを紹介しています。MCP自体の仕組みはどのプロバイダーでも同じ発想に基づきますが、このガイドではNamefi独自のMCPサーバー、認証モデル、[トークン化ドメイン](/ja/glossary/tokenized-domain/)のオプションに絞り、第三者による説明ではなくNamefiのドキュメントに照らして検証しています。

## MCPとは（簡単に）

[Model Context Protocol](https://modelcontextprotocol.io)（MCP）は、AIアプリケーション（ここではClaude）を外部ツールやデータソースに接続するためのオープン標準です。プロトコルの公式ドキュメントでは、[AIアプリケーションのためのUSB-Cポート](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications)と説明されています。ツールごとに独自の連携を作る代わりに、単一の標準化されたコネクターを使うという考え方です。NamefiのMCPサーバーに接続すると、Claudeは、利用可否の確認、ドメイン登録、DNSレコードの読み書きといった、明確に定義された呼び出し可能な操作を利用できるようになります。チャットに貼り付けられたドキュメントからREST APIを推測する必要はありません。

## 前提条件

- **MCP対応のClaudeクライアント。** このガイドでは、具体的に検証済みのコマンドを使ってClaude Code（コマンドライン）を説明し、ドキュメントで示されている一般的な手順に沿ってClaude Desktop / claude.ai（Custom Connectors経由）も取り上げます。CursorやWindsurfなど、ほかのMCPクライアントも同じサーバーに接続できます。各エージェント向けの説明は[NamefiでAIエージェントを使ってドメインを登録する方法](/ja/blog/ai-agent-register/)を参照してください。接続コマンドだけが必要なら、要点をまとめた[Namefi MCPクイックスタート：Claude Code、Cursor、Windsurf](/ja/blog/mcp-quickstart/)をご覧ください。
- **Namefi APIキー。** [namefi.io/api-key](https://namefi.io/api-key)で生成します。APIキーを一切使わず取引ごとに支払いたい場合は、暗号資産[ウォレット](/ja/glossary/wallet/)も利用できます（終盤のウォレットに関するセクションを参照）。
- Namefiの本番環境で登録する場合は、**入金済みのNFSC残高。** NFSC（Namefi Service Credits）はドメイン登録の支払いに使われる残高です。Namefiのドキュメントでは、本番環境ではNamefiダッシュボードから残高を追加し、開発環境ではfaucetエンドポイントから無料のテストクレジットを申請する方法が説明されています。

## ステップ1：Namefi APIキーを取得する

[APIキー](https://namefi.io/api-key)は最も簡単な認証方法であり、このガイドでは一貫してこの方法を使います。単一のヘッダーで、登録、DNSレコードの作成、更新、削除のすべてを認証できます。キーを生成する前に理解しておきたい重要な点があります。**キーは、生成元のウォレットが持つ権限を引き継ぎます。** すでに所有しているドメインのDNSを管理したい場合は、そのドメインのNFTを所有するウォレットからキーを生成してください。別のウォレットから生成したキーでは、[登録者](/ja/glossary/registrant/)が他者であるドメインへの書き込み権限は得られません。

生成されたキーは、`nfk_`で始まる文字列です。書き込み操作のたびに`x-api-key`ヘッダーとして渡します。一方、利用可否の確認などの読み取り専用操作にはキーは一切必要ありません。

## ステップ2：ClaudeをNamefi MCPサーバーに接続する

ICANN認定[レジストラ](/ja/glossary/registrar/)であるNamefiは、API全体に対応する単一のMCPサーバーを`https://api.namefi.io/mcp`で運用しており、Streamable HTTPトランスポートで接続できます。このサーバーは、検索、登録、DNS、ドメイン設定、アウトバウンドを含むすべての`/v-next`操作を型付きツールとして公開しています。サーバーの存在と接続情報自体も、[namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)でディスカバリーディスクリプターとして公開されています。機械可読なので、人が最初にURLを貼り付けなくてもエージェントがサーバーを見つけられます。

### Claude Code

Claude Codeへのサーバー追加は、次のコマンド一つで完了します。

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

これは、カスタム認証ヘッダー付きのリモートHTTP MCPサーバーを追加するための[Claude Code公式の構文](https://code.claude.com/docs/en/mcp)と一致します。一般形は`claude mcp add --transport http <name> <url> --header "<Header-Name>: <value>"`です。ターミナルから一度実行し（`YOUR_KEY`をステップ1で取得したキーに置き換えてください）、Claude CodeがサーバーをプロジェクトまたはユーザーのMCP設定に書き込みます。デフォルトでは、現在のプロジェクトだけにサーバーが登録されます。すべてのプロジェクトで使えるようにするには`--scope user`を追加してください。まず利用可否検索のような読み取り専用ツールだけを使う場合は、キーを省略し、後から追加することもできます。

接続を確認するには`claude mcp list`を実行します。`namefi`が接続済みとして表示されるはずです。また、Claude Codeセッション内で`/mcp`を実行すると、Namefiサーバーが公開しているツール数を確認できます。

### Claude Desktopとclaude.ai

Claude Desktopとclaude.aiは、[modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers)で説明されている**Custom Connectors**を使ってリモートMCPサーバーに接続します。Settingsを開き、Connectorsに移動して「Add custom connector」を選び、サーバーURLの`https://api.namefi.io/mcp`を入力します。Addをクリックすると、認証を完了するよう案内されます。Anthropicのドキュメントによると、サーバーの要件に応じて、この手順には「通常、OAuth、APIキー、またはユーザー名とパスワードの組み合わせが使用され」、Claudeがそのサーバーに必要な入力画面を表示します。

<!-- TODO: チームに確認 — Claude DesktopのCustom Connector認証画面で、x-api-key形式のヘッダーを入力する正確なフィールド。Anthropicの公開ドキュメントには一般的な認証手順が記載されていますが、Namefiのサーバーに固有の画面は示されていません --> Desktopのコネクター設定でキーを入力する場所が明確に表示されない場合、現時点ではClaude Codeが検証済みの方法です。読み取り専用ツール（利用可否検索）は、キーなしでもコネクター経由で動作します。

## ステップ3：NFSC残高に入金する

ドメイン登録は有料の操作であり、支払いに使うウォレットにNFSC（Namefi Service Credits）が必要です。開発環境またはテスト環境では、faucet（`POST /v-next/user/faucet`、SDKでは`client.user.requestNfscFaucet()`）から、ウォレットごとのレート制限付きで無料のテストクレジットを受け取れます。本番環境では、NamefiダッシュボードからNFSCを追加します。<!-- TODO: チームに確認 — 本番環境で残高を追加する正確な手順：利用可能な支払い方法と、チャットから直接購入できるのか、ダッシュボードUIのみなのか --> 現在の残高はいつでも確認できます。接続後にClaudeへ「Namefiの残高は？」と尋ねるか、`GET /v-next/balance`を直接呼び出してください。

## ステップ4：購入の会話

MCPサーバーに接続し、残高への入金が完了すれば、その後の手順は自然言語で進みます。以下は、その会話がどのようになるかを注釈付きで示した例です。各ステップを、NamefiのAPIドキュメントに記載された内部操作に対応付けています。

**1. Claudeにドメイン名の確認を依頼します。**

> 「`example.com`は登録できますか？」

Claudeは利用可否チェック（`checkAvailability`操作。認証不要で`GET /v-next/search/availability?domain=example.com`から直接利用可能）を呼び出します。そのドメイン名が空いているかを報告し、比較したい候補を複数与えれば、一括利用可否チェックを通じてまとめて確認することもできます。

**2. 確認して登録します。**

> 「一年間登録して、`@`が203.0.113.10を指すようにDNSを設定してください。」

Claudeは登録注文（`registerDomain`、`POST /v-next/orders/register-domain`）を送信します。DNSレコードの設定も依頼した場合は、`register-domain/records`の統合版を使い、注文完了後すぐに指定した[Aレコード](/ja/glossary/dns-record-types/)を適用します。リクエストボディには、`normalizedDomainName`（小文字、末尾のドットなし、`search/availability`が登録可能と報告した任意の[TLD](/ja/glossary/tld/)）と`durationInYears`（0〜10、デフォルトは1）を指定します。任意の`nftReceivingWallet`でトークン化を制御できます。省略すると、APIキーに紐づくウォレット宛てに、Base上のNFTとしてドメインが登録されます。`domainSetupOptions`オブジェクトには、`autoRenew`、`dnssec`、`keepExistingNameservers`など、ドメインごとの追加の上書き設定が定義されています。最後の設定を使えば、現在の委任先から[ネームサーバー](/ja/glossary/nameserver/)を変更せずに、Claudeがドメインを登録できます。

**3. 注文が完了するまでClaudeがポーリングします。**

登録は非同期です。Claude（またはステータスを監視するユーザー）は、注文が`SUCCEEDED`、`FAILED`、`CANCELLED`、`PARTIALLY_COMPLETED`のいずれかの終了ステータスになるまで、`getOrder`（`GET /v-next/orders/{orderId}`）をポーリングします。一般的な登録は数回のポーリングで完了します。Claudeは完了時に結果を報告するため、ユーザーがスピナーを見続ける必要はありません。

**4. 最初にすべて設定しなかった場合は、追加のDNSレコードを依頼します。**

> 「さらに、`www`が`cname.vercel-dns.com.`を指すCNAMEと、`_verify`配下にこのトークンを持つTXTレコードを追加してください。」

Claudeはそれぞれに対して`createDnsRecord`（`POST /v-next/dns/records`）を呼び出します。依頼する前に知っておきたい書式上のルールが二つあります。[CNAME](/ja/glossary/dns-record-types/)などのレコードタイプでは、`rdata`の末尾にドットが必要です（`cname.vercel-dns.com.`）。一方、ドメイン自体を表す`zoneName`には末尾のドットを付けてはいけません。この二つを逆にすることが、この手順で検証エラーが発生する最も一般的な原因です。

**5. 任意：自動更新を有効にします。**

> 「このドメインの自動更新を有効にしてください。」

Claudeは`PUT /v-next/domain-config/auto-renew`を使って[自動更新](/ja/glossary/domain-renewal/)を切り替えます。有効にすると、所有者のウォレットで利用可能な支払い方法を使い、有効期限前にドメインが自動更新されます。これは一度限りの確認ではなく継続的な承認なので、有効にする前に理解しておくことが重要です。

## ステップ5：名前解決を確認する

[DNS伝播](/ja/glossary/dns-propagation/)は即時ではないため、レコードを確認するまで数分待ってください。DNSの読み取りには認証が不要なので、`GET /v-next/dns/records?zoneName=example.com`または公開DNS検索ツールを使って、反映内容をユーザー自身（またはClaude）が確認できます。ドメインをデプロイプラットフォームに向けた場合は、そのプラットフォーム独自のドメイン検証手順（指定されたTXTレコードの確認）も、別途行う価値があります。

## APIキーの代わりにウォレットで支払う

ここまでの手順ではAPIキーを使いました。Namefiでは、[x402](/ja/glossary/x402/)プロトコルを通じて、Namefiアカウントを一切使わず、暗号資産ウォレットでドメインを登録することもできます。購入者のウォレットがEIP-3009認可に署名し、支払いが添付されていなければAPIが価格を含む`402 Payment Required`を返し、有効な支払いを受信すると登録を決済します。この手順は脚注ではなく独立したガイドに値します。詳しくは[暗号資産ウォレットでドメインを支払う：アカウント不要](/ja/blog/wallet-checkout/)、または[NamefiでAIエージェントを使ってドメインを登録する方法](/ja/blog/ai-agent-register/)の支払いセクションをご覧ください。

## トラブルシューティング

| 症状 | 考えられる原因 | 対処方法 |
| --- | --- | --- |
| 書き込み呼び出しで`401 UNAUTHORIZED`が返る | APIキーが無効、期限切れ、またはドメインを所有していないウォレットから生成されている | ドメインを所有している（または所有する予定の）ウォレットを使い、[namefi.io/api-key](https://namefi.io/api-key)で新しいキーを生成する |
| `403 FORBIDDEN` | キーは有効だが、紐づくウォレットがこの特定のドメインを所有していない | 再試行する前にNamefiアカウントで所有権を確認する |
| 登録注文が終了前のステータスで止まっている | 正常な挙動 — 登録は非同期 | `getOrder`のポーリングを続ける。Namefi公式の例では5秒ごとにポーリングする。`SUCCEEDED`、`FAILED`、`CANCELLED`、`PARTIALLY_COMPLETED`のいずれにも到達しない場合にのみ、停止していると判断する |
| DNSレコードの作成または更新が検証エラーで拒否される | `zoneName`に末尾のドットがある、またはCNAME/MX/NSの`rdata`値に末尾のドットがない | `zoneName` = 末尾のドットなし。FQDN形式の`rdata`値 = 末尾のドットが必要 |
| 登録が完全に失敗する | 支払いに使うウォレットのNFSC残高が不足している | 残高を確認し（`GET /v-next/balance`）、faucet（テスト）またはNamefiダッシュボード（本番）から追加する |
| Claudeが利用可能なドメインツールがないと表示する | MCPサーバーが未接続、または書き込み操作に必要なヘッダーなしで接続されている | `--header`フラグ付きで`claude mcp add`を再実行するか、`/mcp` / `claude mcp list`で接続状態を確認する |

## よくある質問

### 利用するにはNamefiのREST APIを理解する必要がありますか。それともClaudeに自然言語で話しかけるだけでよいですか？
上記の手順はすべて自然言語だけで実行できます。「このドメインは空いていますか」「登録してください」「このIPアドレスを向き先にしてください」といった依頼をそのまま伝えられます。このガイドにエンドポイントとリクエストフィールドを記載しているのは、Claudeが内部で何をしているかを確認したり、チャットではなくスクリプトから直接呼び出したりできるようにするためです。

### Claude経由で登録すると、Namefiのウェブサイトから登録するより高くなりますか？
このガイドでは、どちらが安いか高いかを断定しません。<!-- TODO: チームに確認 — NamefiのMCP/API料金が通常の登録料金と同じか、異なるか --> いずれの場合も、ブラウザー、スクリプト、MCPツール呼び出しのどれからリクエストしたかにかかわらず、登録料金は同じNFSC残高から引き落とされます。

### この方法で登録すると、ドメインは自動的にNFTとしてトークン化されますか？
はい、デフォルトでトークン化されます。登録リクエストで`nftReceivingWallet`を指定しない場合、APIキーに紐づくウォレット宛てに、Base上のNFTとしてドメインが登録されます。登録時に別のウォレットまたはチェーンへ変更できます。

### ClaudeのDNSレコード要求に入力ミスがあると、気付かないうちにドメインが壊れる可能性はありますか？
DNSへの書き込みは適用前にNamefiの検証を通過します。不正な`rdata`（たとえばCNAMEの向き先に末尾のドットがない場合）は、黙って受け入れられるのではなくエラーで拒否されます。上のトラブルシューティング表を参照してください。それでも、本番ドメインのDNS変更は、ほかのインフラ変更と同様に扱ってください。確定する前に、Claudeが送信しようとしている内容を確認しましょう。

### Claudeの代わりにCursorやWindsurfから同じMCPサーバーを使えますか？
はい。Namefiのサーバーは、接続するクライアントにかかわらず同じオープンなMCPプロトコルを使用するため、サーバー側は変わりません。クライアント側の接続コマンドはエディターによって異なります。クライアント別の設定については[NamefiでAIエージェントを使ってドメインを登録する方法](/ja/blog/ai-agent-register/)、短い手順については[Namefi MCPクイックスタート：Claude Code、Cursor、Windsurf](/ja/blog/mcp-quickstart/)をご覧ください。

## 次のドメインを会話から購入する

これは仮定の話ではなく、Namefiが現在実際に対応しているセットアップです。MCPサーバーに接続すると、ドメイン名の検索から登録、DNS設定、さらに任意でウォレットに保有するトークンへの変換まで、チャットを離れずに実行できます。MCPサーバーが公開する機能は登録だけではありません。アウトバウンドの見込み顧客探索、DNSの一括操作、ドメイン設定なども、セットアップ完了後は同じ接続からすべて検出できます。ツールの全一覧については[Namefi MCPサーバー：AIエージェント向けドメインツール](/ja/blog/namefi-mcp/)をご覧ください。

**[Namefi APIキーを生成してClaudeを接続する](https://namefi.io/api-key)。**

## 出典と関連資料

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt)（MCPサーバーURL、トランスポート、認証、登録およびDNSエンドポイント — このガイドの一次情報）
- Namefi — [docs.namefi.io：認証](https://docs.namefi.io/docs/02-authentication.mdx)（APIキー、EIP-712、SIWEの認証方式と、操作ごとの認証要件）
- Namefi — [docs.namefi.io：ドメインを登録する](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx)（SDK、fetch、cURL、Pythonによる登録とポーリングの実例）
- Namefi — [docs.namefi.io：残高を管理する](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx)（NFSC faucetおよび残高確認エンドポイント）
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)（MCPディスカバリーディスクリプター）
- Anthropic / Claude Code — [MCP経由でClaude Codeをツールに接続する](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http)（`claude mcp add --transport http`の構文、ヘッダー認証、スコープフラグ）
- Model Context Protocol — [リモートMCPサーバーに接続する](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication)（Claude Desktopおよびclaude.aiでのCustom Connectorsの手順）
- Model Context Protocol — [Model Context Protocolとは？](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications)（プロトコルの概要）
- llmstxt.org — [/llms.txtファイル](https://llmstxt.org)（namefi.io/llms.txtが準拠するディスカバリーファイルの仕様と目的）
- dev.to — [人の操作なしでAIエージェントを使ってドメイン名を登録する方法](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26)（Cloudflareを基盤とする別のレジストラリセラーを使った、第三者によるMCPチュートリアル）
