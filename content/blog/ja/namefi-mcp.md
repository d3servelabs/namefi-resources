---
title: "Namefi MCPサーバー：AIエージェント向けドメインツール"
date: '2026-07-10'
language: 'ja'
tags: ['ai-agents', 'domains', 'web3']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
format: explainer
ogImage: ../../assets/namefi-mcp-og.jpg
description: "Namefi MCPサーバーがAIエージェントに提供する全ツールを紹介します。検索、登録、DNS、更新、トークン化に加え、認証モデルとワークフロー例も扱います。"
keywords: ["namefi mcp サーバー", "mcp ツール一覧", "namefi mcp 機能", "mcp サーバー ドメイン管理", "ドメインレジストラ mcp サーバー", "namefi api キースコープ", "dns mcp ツール", "mcp でドメイン登録", "mcp でドメインをトークン化", "x402 ドメイン決済", "siwe ドメイン認証", "eip-712 ドメイン署名", "ドメイン アウトバウンドリード発掘", "namefi openapi", "ai エージェント ドメインツール"]
relatedArticles:
  - /ja/blog/claude-mcp-domains/
  - /ja/blog/ai-agent-register/
  - /ja/blog/wallet-checkout/
  - /ja/blog/llms-txt/
  - /ja/blog/mcp-quickstart/
relatedTopics:
  - /ja/topics/domain-tokenization/
  - /ja/topics/web3-foundations/
relatedSeries:
  - /ja/series/blockchain-concepts/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/ai-agent/
  - /ja/glossary/registrar/
  - /ja/glossary/tokenized-domain/
  - /ja/glossary/dnssec/
  - /ja/glossary/ens/
---

Namefi MCPサーバーへ接続するすべての[AIエージェント](/ja/glossary/ai-agent/)には、同じ呼び出し可能なツール一覧が表示されます。APIが定義する各操作に一つずつ用意され、検索、登録、DNS、ドメイン単位の設定、アウトバウンドリード発掘、決済を網羅しています。このページは全体のカタログです。すべてのツール、その機能、必要な認証、複数のツールを実際のワークフローに組み合わせる三つの実例を紹介します。

まだエージェントをNamefiへ接続していない場合は、クライアント別の設定を説明する[NamefiでAIエージェントを使ってドメインを登録する方法](/ja/blog/ai-agent-register/)か、対話記録全体を掲載した[Claudeでドメインを購入する：Namefi MCPステップ別ガイド](/ja/blog/claude-mcp-domains/)から始めてください。このページでは接続がすでに存在すると仮定します。

## Namefi MCPサーバーとは

NamefiはAPI全体に対応する単一のMCPサーバーを、`https://api.namefi.io/mcp`でStreamable HTTP転送方式により運用しています。エージェントがチャットに貼り付けられたドキュメントを基にREST呼び出しを一つずつ自作するのではなく、一度接続するとAPIが定義するすべての操作に対応した型付きツールを受け取ります。これらはNamefi自身のOpenAPI 3仕様である[api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json)から直接生成されるため、MCPカタログとREST APIが食い違うことはありません。

[namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)にある機械可読ディスカバリーディスクリプターを使うと、人間が設定ファイルへURLを手で貼り付けなくてもエージェントがサーバーを見つけられます。サーバー名は`namefi-api`、転送方式は`streamable-http`、接続認証は`apiKey`/`x-api-key`と記載されています。[ICANN](/ja/glossary/icann/)認定[レジストラ](/ja/glossary/registrar/)のNamefiは、MCPを利用しないエージェントやスクリプト向けに、同じ操作を通常のHTTPSエンドポイントとして[namefi.io/llms.txt](https://namefi.io/llms.txt)でも公開しています。

## 完全な機能カタログ

以下は、この執筆時点でAPIが定義するすべての操作を、Namefi自身のリファレンスと同じ分類でまとめたものです。**操作**列はOpenAPI仕様の`operationId`、つまりMCPクライアントのツール一覧で使われる名前です。**認証**列は最も簡単な方法を示します。APIキーでほぼすべてを扱えます。APIキー以外の選択肢を含む完全な認証モデルは、次のセクションで説明します。

### 検索と発見

| 操作 | エンドポイント | 機能 | 認証 |
| --- | --- | --- | --- |
| `checkAvailability` | `GET /v-next/search/availability` | 一つのドメイン名を登録できるか確認 | なし |
| `checkBulkAvailability` | `GET /v-next/search/bulk-availability` | 候補名の一群を一回の呼び出しで選別 | なし |
| `getSuggestions` | `GET /v-next/search/suggestions` | クエリに関連するアルゴリズムベースの名前候補を取得 | なし |

### 登録と注文

| 操作 | エンドポイント | 機能 | 認証 |
| --- | --- | --- | --- |
| `registerDomain` | `POST /v-next/orders/register-domain` | ドメインを0–10年間登録。`domainSetupOptions`オブジェクト（`autoPark`、`autoEns`、`autoRenew`、`dnssec`、`keepExistingNameservers`）と、省略可能な`nftReceivingWallet`を受け付ける | APIキー |
| `registerWithRecords` | `POST /v-next/orders/register-domain/records` | 一回の呼び出しで登録と初期DNSレコード一式の適用を実行 | APIキー |
| `getOrder` | `GET /v-next/orders/{orderId}` | 注文が最終状態の`SUCCEEDED`、`FAILED`、`CANCELLED`、`PARTIALLY_COMPLETED`のいずれかになるまでポーリング | APIキー |

登録は非同期です。`registerDomain`は注文の`id`をすぐに返し、エージェントは完了するまで`getOrder`をポーリングします。[Claudeガイド](/ja/blog/claude-mcp-domains/)と[複数エージェントの設定ガイド](/ja/blog/ai-agent-register/)では、どちらも対話記録全体を通じてこのパターンを示しています。

### DNSレコード管理

レコード単位または一括の完全なCRUDと、認証を一切必要としない読み取り操作を提供します。

| 操作 | エンドポイント | 機能 | 認証 |
| --- | --- | --- | --- |
| `getDnsRecords` | `GET /v-next/dns/records` | ゾーン内の全レコードを一覧表示 | なし |
| `createDnsRecord` | `POST /v-next/dns/records` | レコードを一つ作成 | APIキー |
| `updateDnsRecord` | `PUT /v-next/dns/record` | IDを指定してレコードを更新 | APIキー |
| `deleteDnsRecord` | `DELETE /v-next/dns/record` | IDを指定してレコードを削除 | APIキー |
| `batchCreateDnsRecords` | `POST /v-next/dns/records/batch` | 一回の呼び出しで複数のレコードを作成 | APIキー |
| `batchUpdateDnsRecords` | `PUT /v-next/dns/records/batch` | 一回の呼び出しで複数のレコードを更新 | APIキー |
| `batchDeleteDnsRecords` | `DELETE /v-next/dns/records/batch` | 一回の呼び出しで複数のレコードを削除 | APIキー |

対応する[DNSレコードタイプ](/ja/glossary/dns-record-types/)：A、AAAA、CNAME、MX、TXT、NS、SOA、PTR、SRV、CAA、DS、TLSA、SSHFP、HTTPS、SVCB、NAPTR、SPF。初回の操作で特につまずきやすい書式規則が二つあります。`zoneName`の末尾にはドットを付けず、CNAME、MX、NSレコードの`rdata`値には末尾のドットを付けます。

### ドメイン単位のトグル

個別のDNSレコードとは別に、機能全体のオンとオフを切り替えます。

| 操作 | エンドポイント | 機能 | 認証 |
| --- | --- | --- | --- |
| `toggleDomainParking` / `parkDomain` | `PUT` / `POST /v-next/dns/park` | [ドメインパーキング](/ja/glossary/domain-parking/)をオンまたはオフにする | APIキー |
| `isDomainParked` | `GET /v-next/dns/parked` | ドメインが現在パーキング中か確認 | なし |
| `toggleForwarding` | `PUT /v-next/dns/forwarding` | [ドメイン転送](/ja/glossary/domain-forwarding/)をオンまたはオフにする | APIキー |
| `toggleAutoEns` | `PUT /v-next/dns/auto-ens` | [ENS](/ja/glossary/ens/)レコードの自動公開をオンまたはオフにする | APIキー |
| `toggleVercelAnyCastRecords` | `PUT /v-next/dns/vercel-anycast` | Vercel Anycast DNSレコードをオンまたはオフにする | APIキー |

[DNSSEC](/ja/glossary/dnssec/)は、これらのトグルには含まれません。`domainSetupOptions`の一フィールドとして登録時に設定するもので、上の`registerDomain`とは別に後からエージェントが呼び出す独立したエンドポイントではありません。

### ドメイン設定

| 操作 | エンドポイント | 機能 | 認証 |
| --- | --- | --- | --- |
| `getAutoRenew` | `GET /v-next/domain-config/auto-renew` | 自動更新が有効か確認 | APIキー |
| `toggleAutoRenew` | `PUT /v-next/domain-config/auto-renew` | 自動更新をオンまたはオフにする | APIキー |

[自動更新](/ja/glossary/domain-renewal/)を有効にすると、所有者ウォレットの決済手段を使って、有効期限前にドメインが自動更新されます。ポートフォリオ全体でデフォルトのまま有効にするのではなく、ドメインごとに慎重に判断すべき継続的な承認です。

### アウトバウンドリード発掘

所有するドメインを静的な資産一覧ではなく営業パイプラインに変える、最も新しい機能です。

| 操作 | エンドポイント | 機能 | 認証 |
| --- | --- | --- | --- |
| `getUserDomains` | `GET /v-next/user/domains` | 認証済みウォレットが所有するドメインを一覧表示 | APIキー |
| `startOutboundRun` | `POST /v-next/outbound/runs` | 所有する一つのドメインについてAIによるリード発掘を開始。`reasoningEffort`は`low`、`medium`、`high`のいずれか | APIキー |
| `listOutboundRuns` | `GET /v-next/outbound/runs` | 過去と実行中の処理を一覧表示 | APIキー |
| `getOutboundRun` | `GET /v-next/outbound/runs/{runId}` | 実行状態をポーリング：`QUEUED`、`RUNNING`、`SUCCEEDED`、`FAILED`、`CANCELED` | APIキー |
| `listOutboundLeads` | `GET /v-next/outbound/runs/{runId}/leads` | 根拠、発見した連絡先、既存のアプローチ文面を含む、順位付きの購入候補リードを一覧表示 | APIキー |
| `prepareOutboundOutreach` | `POST /v-next/outbound/runs/{runId}/leads/{leadId}/outreach` | 一件のリード向けアプローチ文面を生成するか、追加の生成費用なしで既存の文面を返す | APIキー |

レスポンスには、スコア、モデルの詳細、除外されたリードの状態といった内部の順位付け方式は含まれません。そのため、人間向けに結果を要約するエージェントが参照できるのは、公開された根拠、発見した連絡先、文面の有無だけです。

### 決済とアカウント

| 操作 | エンドポイント | 機能 | 認証 |
| --- | --- | --- | --- |
| `getBalance` | `GET /v-next/balance` | 登録の支払いに使うNFSC（Namefi Service Credit）残高を確認 | APIキー |
| `requestNfscFaucet` | `POST /v-next/user/faucet` | 無料のテスト用NFSCクレジットを申請（開発環境のみ） | APIキー |
| `registerDomainX402` | `GET /x402/domain/{domainName}` | Namefiアカウントなしで、ステーブルコイン署名によるHTTP 402フローを使って一度に登録・決済 | ウォレット署名 |
| — | `GET /x402/purchase/{purchaseId}` | x402購入の状態をポーリング | なし |
| `registerDomainMPP` | `GET /mpp/domain/{domainName}` | MPP（Machine Payable Protocol）のチャレンジ・レスポンス方式で登録・決済 | ウォレット署名 |

検索、登録、DNS、ドメイン設定、アウトバウンド、決済の範囲に含まれるすべての操作は以上です。それぞれ単一のサーバー接続を通じてMCPツールとして利用でき、MCPを使わないエージェントでは通常のHTTPS呼び出しとして利用できます。（Namefi APIは、この一覧以外にもアカウント管理やEIP-712/SIWEの補助操作をいくつか公開しています。全体の最新情報は、下の出典にリンクしたOpenAPI仕様で確認できます。）

## 認証モデル：三つの経路、すべての背後に一つのウォレット

上記のすべての書き込み操作は、三つの経路のいずれかで同じことを確認します。呼び出し元が、ドメインを所有している、またはこれから所有するウォレットを管理しているかどうかです。どの経路が適用されるかは、単一のアカウント設定ではなく操作によって決まります。

**APIキー（`x-api-key`）。** 最も簡単な選択肢で、この一連の記事にあるすべての実例が使う方式です。[namefi.io/api-key](https://namefi.io/api-key)で生成します。キーを生成したウォレットの権限を引き継ぐため、DNS書き込み、パーキング、登録を含む上記すべての操作に利用できます。SDKは不要で、通常のHTTPヘッダーとして渡します。

**EIP-712型付きデータ署名。** 保存したキーを使わずにプログラムから利用する場合は、各リクエストをEthereum[ウォレット](/ja/glossary/wallet/)で署名します。`x-namefi-signer`、`x-namefi-signature`、`x-namefi-eip712-type`ヘッダーは、タイムスタンプと300秒後に失効する一回限りのnonceを含むエンベロープでペイロードを包みます。APIキーなしで`toggleDomainParking`、`createDnsRecord`、`registerDomain`などを実行する際に必要な方式です。Namefiのドキュメントには変更される可能性があると記載されているため、ドメインと型定義はハードコードした定数ではなく、稼働中のエンドポイント（`GET /v-next/eip712/domain`、`/eip712/types`）から取得します。スマートコントラクトウォレットは直接署名できないため、承認された外部所有アカウントがコントラクトに代わって署名し、`x-namefi-erc1271-account`または`x-namefi-eip7702-account`でリクエストを承認するコントラクトを指定します。

**SIWE（Sign-In with Ethereum）。** 所有ドメインや注文の一覧など、呼び出しごとに新しい署名を必要としない保護された読み取り操作で使うセッショントークン（`x-namefi-siwe-token`）です。nonceを取得し、署名対象のメッセージを受け取り、`personal_sign`で署名して検証した後、トークンを再利用します。

認証が不要な操作もいくつかあります。`checkAvailability`、`getSuggestions`、`getDnsRecords`、`isDomainParked`、EIP-712メタデータのエンドポイントです。これらは読み取り専用で、ドメインの公開DNSからブラウザーですでに確認できる以上の情報を公開しません。

さらに決済の層があります。`registerDomainX402`は[x402プロトコル](https://x402.org)を通じて購入を決済します。購入者のウォレットが、USDCのような[ステーブルコイン](/ja/glossary/stablecoin/)についてEIP-3009の`transferWithAuthorization`に署名し、Namefiアカウントは必要ありません。`registerDomainMPP`は代わりに署名付きのチャレンジ・レスポンスで同じ結果を実現します。どちらも、エージェントがアカウント作成を省略し、取引ごとに支払えるようにします。[暗号資産ウォレットでドメイン料金を支払う：アカウント不要](/ja/blog/wallet-checkout/)では、この経路を最初から最後まで解説します。

## トークン化はカタログの外ではなく、全体に関わる

`registerDomain`は、ドメインを[NFT](/ja/glossary/nft/)、つまり多くのマーケットプレイスやウォレットがすでに読み取れる[標準インターフェース](https://eips.ethereum.org/EIPS/eip-721)である[ERC-721](/ja/glossary/erc-721/)トークンとして発行します。デフォルトではBase上で、呼び出し元のAPIキーに紐づくウォレットへ発行します。`nftReceivingWallet`を使うと、登録時に別のウォレットまたはチェーンを受取先として指定できます。その後のDNS書き込み、パーキング、自動更新、アウトバウンドリード発掘はすべて、別のアカウントデータベースではなく、同じオンチェーンの所有権記録を確認します。[OpenSea](https://opensea.io)のようなマーケットプレイスで取引される[トークン化ドメイン](/ja/glossary/tokenized-domain/)は、DNSの管理権とERC-721の所有権を一つのオブジェクトとして引き継ぐため、二つのシステムを手動で同期する必要がありません。

## 三つのエージェント、同じツールセットを使う三つの方法

**開発者が一回の会話でドメインを登録し、DNSまで設定します。** `checkAvailability`で名前を登録できることを確認し、`registerDomain`を送信するときに`domainSetupOptions`の`autoRenew`と`dnssec`を設定します。注文が`SUCCEEDED`に達すると、`batchCreateDnsRecords`で、デプロイプラットフォームの検証手順が待っているCNAMEとTXTレコードを書き込みます。[コーディングエージェント向けNamefi MCPクイックスタート](/ja/blog/mcp-quickstart/)では、エディター内でこの手順を実行します。

**ドメイントレーダーがポートフォリオを管理します。** `getUserDomains`で現在の保有ドメインを取得し、`checkBulkAvailability`で新しい候補を一回の呼び出しで選別し、`registerDomain`で取得する価値のあるものを確保します。再販売する名前には`toggleDomainParking`でランディングページを設置し、`isDomainParked`で公開されていることを確認します。ポートフォリオ全体では、`getAutoRenew`と`toggleAutoRenew`を使い、継続的な更新承認に値する名前と、失効させてもよいほど投機的な名前を判断します。

**企業が所有済みの名前についてアウトバウンドリード発掘を実行します。** `getUserDomains`で使われていないドメインを見つけ、`startOutboundRun`で調査を開始し、`getOutboundRun`で`SUCCEEDED`に達するまでポーリングします。`listOutboundLeads`は、プロフィールからその名前を必要としそうな企業を順位付きで返します。`prepareOutboundOutreach`はリードごとのメール文面を一度だけ生成し、以後の呼び出しでは同じ文面を無料で返します。

## エージェントが無人で実行する前に

Namefi自身のアウトバウンドドキュメントは、`registerDomain`、`registerWithRecords`、`startOutboundRun`、`prepareOutboundOutreach`の四つを**影響の大きい操作**として示しています。それぞれが残高を消費するか、外部から見える行動を取るためです。`checkAvailability`のような読み取り専用ツールは、自律的に実行しても危険はありません。注文の作成、稼働中ドメインへのDNSレコードの書き込み、アプローチ文面の作成には、確認手順を設ける価値があります。[エージェントネイティブなドメインレジストラとは？](/ja/blog/agent-native/)には、レジストラのエージェント向け機能をこの観点で評価する詳しいチェックリストがあります。

## このカタログを最新に保つ

この表は固定されたロードマップではなく、上記の公開日時点におけるNamefiの稼働中OpenAPI仕様を反映しています。新しい操作は、ブログ記事の表より先に[namefi.io/llms.txt](https://namefi.io/llms.txt)と[namefi.io/llms-full.txt](https://namefi.io/llms-full.txt)へ追加されます。

## よくある質問

### 名前が利用可能か確認するだけでもAPIキーが必要ですか？
いいえ。`checkAvailability`、`checkBulkAvailability`、`getSuggestions`には認証が不要なので、資金を用意する前でも、新しく接続したエージェントから利用できます。

### Namefi APIキーを一度も持たずに、エージェントがこのカタログ全体を利用できますか？
はい。`registerDomainX402`と`registerDomainMPP`は、どちらもNamefiアカウントなしでウォレット署名により登録を決済します。残りの書き込み操作は、EIP-712署名を使ってウォレットから直接実行できます。

### どの経路で登録しても、ドメインは自動的にトークン化されますか？
はい。すべての登録経路でデフォルトの動作です。`nftReceivingWallet`を指定しない場合、ドメインはBase上で、呼び出し元のAPIキーに紐づくウォレットへERC-721 NFTとして登録されます。

### 自律エージェントが実行する前に、人間が確認すべき操作はどれですか？
少なくとも、Namefiのドキュメントが影響の大きい操作として示す四つ、`registerDomain`、`registerWithRecords`、`startOutboundRun`、`prepareOutboundOutreach`に加え、実際のトラフィックを処理中のドメインに対するすべてのDNS書き込みです。

## エージェントを完全なカタログへ接続する

上記すべてのツールは、`https://api.namefi.io/mcp`という一つの接続の先で実際に稼働しています。まだ設定していない場合は、[NamefiでAIエージェントを使ってドメインを登録する方法](/ja/blog/ai-agent-register/)で異なる六つのクライアント向けの正確な設定を確認し、[ドメイン向けllms.txt](/ja/blog/llms-txt/)でその基盤となるディスカバリー層を理解してください。

**[Namefi APIキーを生成し](https://namefi.io/api-key)**、エージェントをサーバーへ接続してください。上記のツールがそこで待っています。

## 出典と参考資料

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt)（MCPサーバーURL、転送方式、認証、主要操作のリファレンス — このカタログの一次資料）
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt)（Web3決済とアウトバウンドリード発掘をインライン展開した単一ファイルのリファレンス）
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt)（x402、MPP、EIP-712、SIWEの各フローを詳しく解説）
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)（MCPディスカバリーディスクリプター：サーバー名、URL、転送方式、認証タイプ）
- Namefi — [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json)（機械可読OpenAPI 3仕様 — 上の機能カタログにあるすべての`operationId`とエンドポイントの出典）
- Namefi — [docs.namefi.io：認証](https://docs.namefi.io/docs/02-authentication.mdx#:~:text=The%20Namefi%20API%20supports%20three%20authentication%20methods)（APIキー、EIP-712、SIWEの認証方式、操作別の認証要件、ERC-1271/EIP-7702委任）
- Namefi — [docs.namefi.io：ドメインを登録する](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx)（登録リクエストのフィールド、ポーリング手順、注文ステータスの値）
- Namefi — [docs.namefi.io：残高を管理する](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx)（NFSC残高とfaucetエンドポイント）
- Model Context Protocol — [Model Context Protocolとは？](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications)（プロトコルの概要）
- llmstxt.org — [/llms.txtファイル](https://llmstxt.org)（Namefiのファイルが従うディスカバリー規約の仕様と根拠）
- x402.org — [x402プロトコル](https://x402.org)（`registerDomainX402`の基盤となるHTTP 402ベースのステーブルコイン決済標準）
- Ethereum Improvement Proposals — [ERC-721：非代替性トークン標準](https://eips.ethereum.org/EIPS/eip-721)（NamefiのドメインNFTが実装するトークン標準）
