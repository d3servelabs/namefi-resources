---
title: "エージェントネイティブ・ドメインレジストラとは？"
date: '2026-07-10'
language: 'ja'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/agent-native-og.jpg
description: "レジストラには何十年も前からAPIがありますが、APIがあるだけではエージェントネイティブとはいえません。確認すべきなのは、検出可能性、ドキュメント、エラー、決済、ポリシーフックです。"
keywords: ["エージェントネイティブ・レジストラ", "エージェントネイティブの定義", "エージェントネイティブ・レジストラとは", "エージェント対応API", "MCPサーバー", "llms.txt", "機械可読なエラー", "べき等性", "エージェント型決済", "AIエージェントによるドメイン登録", "自然言語APIドキュメント", "AIエージェント向けポリシーフック", "APIキー請求", "ウォレット決済・暗号資産ドメイン"]
relatedArticles:
  - /ja/blog/ai-domain-platforms/
  - /ja/blog/cf-namecom-namefi/
  - /ja/blog/ai-agent-register/
  - /ja/blog/claude-mcp-domains/
  - /ja/blog/airo-vs-namefi/
relatedTopics:
  - /ja/topics/web3-foundations/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/blockchain-concepts/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/ai-agent/
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/epp/
  - /ja/glossary/x402/
---

ドメインレジストラには、以前からアプリケーション・プログラミング・インターフェースがありました。レジストラがレジストリと通信するためのマシン間言語である [Extensible Provisioning Protocol](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol)（EPP）は、[2004年3月にProposed Standardのステータスに達しました](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)。これは20年以上前のことです。それ以降にこれを基盤としてきたすべての [ICANN](/ja/glossary/icann/)認定[レジストラ](/ja/glossary/registrar/)には、空き状況の確認、登録申請、レコード更新を行うRESTまたはSOAP APIが何らかの形で備わっています。したがって、「このレジストラにはAPIがありますか？」という問いへの正直な答えは、市場にあるほぼすべてのレジストラについて、イエス、しかも何年も前から、です。

しかし、この問い自体が誤っています。あなたに代わってドメインを登録しようとする[AIエージェント](/ja/glossary/ai-agent/)が失敗するのは、レジストラにAPIがないからではありません。APIが、一度ドキュメントを読み、統合コードを手作業で書き、それをリリースする開発者向けに作られているからです。実行時にAPIを見つけ、JSONレスポンスから何が起きたのかを判断し、人がチェックアウトページを見張ることなく購入を完了しなければならないシステム向けではありません。必要とされる条件は異なり、後者を満たすことこそが、本稿でいう**エージェントネイティブ**です。

本稿ではこの用語を正確に定義し、あらゆるレジストラ（あるいはAPI）を評価するためのチェックリストを示したうえで、[Namefi](https://namefi.io)を含む2026年に提供されているプラットフォームへ率直に適用します。定義ではなくプラットフォーム別の比較を見たい場合は、[Cloudflare vs Name.com vs Namefi：エージェントネイティブ・レジストラ](/ja/blog/cf-namecom-namefi/)または、より広い[AIエージェント型ドメインプラットフォーム・ガイド](/ja/blog/ai-domain-platforms/)を参照してください。「AIとドメイン」を、ブランド名に使えそうな文字列を提案する名称ジェネレーターとしてしか捉えていないなら、以下のチェックリストは、エージェントネイティブの基準がどれほどその先にあるかを示します。その隔たりは[AIドメイン名ジェネレーターの先へ：エージェント時代](/ja/blog/beyond-generators/)で詳しく扱っています。

## 「APIがある」と「エージェントネイティブ」は同じ主張ではない理由

従来のレジストラAPIは、設計時には人が関与することを前提にしており、実行時に人が関与することを前提にはしていません。開発者はアカウントを作成し、人向けに書かれたリファレンスページを読み、コードサンプルをコピーして、エンドポイント、認証ヘッダー、期待するレスポンス形式をアプリケーションにハードコードします。それが済めば統合は人手なしで動きますが、それは人がすでに解釈作業を済ませているからです。API自体に、事前の統合知識を持たずに現れ、利用可能な操作と呼び出し方をその場で把握しなければならないシステムにとっての分かりやすさはありません。

エージェントは常に、事前知識のない状態で現れます。コーディングエージェントとの会話ごと、新しいMCPクライアントごとに、実質的には、あなたのAPIを一度も見たことがなく、限られたコンテキスト予算の中で数秒で理解しなければならない開発者が現れることになります。「エージェントはこのAPIの使い方をどう学ぶのか」という問いへの答えが「人が数年前にドキュメントを読み、接着コードを書いたから」なら、購入時に人が何もクリックしなくても、そのAPIの実行経路には人が恒久的に挟まっています。本稿が扱うのは、こうしたコールドスタートのエージェントが成功するためにレジストラ自体が満たすべき条件です。同じ引き継ぎを購入者の視点から見たい場合は、[人間なしでAIエージェントがドメインを購入する方法（2026年）](/ja/blog/agents-buy-domains/)を参照してください。

## エージェントネイティブのチェックリスト

エージェントネイティブ・レジストラとは、ブラウザも、人が事前にドキュメントを読むことも、人がカード番号を入力することもなく、AIエージェントが完全に自力で見つけ、理解し、取引できるレジストラです。そのためには、単に「APIがある」だけではなく、次の6つの条件を満たす必要があります。

| 要件 | APIを備えたレジストラ | エージェントネイティブ・レジストラ |
| --- | --- | --- |
| 検出可能性 | エンドポイントは存在するが、ベースURLと認証方式を別経路でエージェントに伝える必要がある | エージェントが自力で見つけて読める標準的な場所（`llms.txt`、[MCP](https://modelcontextprotocol.io)サーバー） |
| 自然言語ドキュメント | ページを流し読みする人向けに書かれたリファレンスドキュメント | エージェントが推論時に利用できるよう、操作、必須フィールド、効果を一箇所に構造化したドキュメント |
| 機械可読なエラー | ログを読む人向けの説明文にHTTPステータスコードを添えたもの | プログラム上でエージェントが分岐できる、安定したエラーコード、`retryable`フラグ、構造化された詳細 |
| ブラウザ不要の購入 | 登録はホスト型のチェックアウトページで完了し、ときにはCAPTCHAの背後にある | 登録はAPIまたはプロトコル自体を通じて、ページのレンダリングなしに最初から最後まで完了する |
| プログラム可能な決済 | 決済は、人の請求アカウントに紐づく保存済みカードを前提とする | アカウントに請求されるAPIキー、またはウォレット署名トランザクションによる決済。いずれも人以外が保持できる |
| ポリシーフック | 認証情報で許されることなら、スクリプトが何をしても止めるものがない | 人が一度設定する支出上限、確認ステップ、スコープ付きキーにより、エージェントを境界内で動かせる |

ここから抽出できる定義は次のとおりです。**エージェントネイティブ・レジストラとは、検出可能性、自然言語ドキュメント、機械可読なエラー、ブラウザ不要の購入、プログラム可能な決済で「はい」と評価されるレジストラであり、ポリシーフックはこのカテゴリ全体がいまなお解決に取り組んでいる要素です。**

## 検出可能性：llms.txtとMCPはエージェントのためのサイトマップ

人間の開発者は、検索したりドキュメントサイトをクリックして回ったりしてAPIを見つけます。エージェントには、一度で取得して読めるファイルか、利用可能な操作を問い合わせられるプロトコル接続のどちらかが必要です。現在は、2つの仕組みがその役割を担っています。

[llms.txt](https://llmstxt.org)は、提案文書自身の言葉を借りれば、[「LLMが推論時にウェブサイトを利用するのを助ける情報を提供するため、`/llms.txt`ファイルを使用する標準化の提案」](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)です。クローラーにインデックス可能な範囲を伝える`robots.txt`と同じ発想ですが、こちらはサイトの内容と利用方法を言語モデルに伝えます。レジストラがこのファイルを公開したときにどのような形になるかは、[ドメイン向けllms.txt：AIエージェントが読めるAPI](/ja/blog/llms-txt/)を参照してください。

[MCP（Model Context Protocol）](https://modelcontextprotocol.io)は、隣接する問題を解決します。これは[「AIアプリケーションを外部システムへ接続するためのオープンソース標準」](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)です。llms.txtが、エージェントが一度読んで方向を定める文書であるのに対し、MCPは、定義済みの呼び出し可能なツールを公開するサーバーへエージェントのクライアントが接続するライブ接続です。両者は競合するのではなく補完関係にあります。llms.txtは、レジストラの存在とおおよその機能をエージェントが知る方法であり、MCPは、エージェントのクライアントが実際に接続して操作を呼び出す方法です。

Namefiは両方を公開しています。[namefi.io/llms.txt](https://namefi.io/llms.txt)のエントリポイントには、`api.namefi.io/mcp`のMCPサーバー、`namefi.io/.well-known/mcp/servers.json`のMCP検出ファイル、完全なRESTリファレンスに加え、ウォレットベース決済とアウトバウンド・エージェントワークフロー用の補助ファイルが記載されています。既存大手2社を直接確認すると、Cloudflareのレジストラドキュメントは`developers.cloudflare.com/registrar/llms.txt`で独自の`llms.txt`を公開していますが、公開ドキュメントにはCloudflareがレジストラ製品専用のMCPサーバーを運用しているという記述はありません。報道によれば、ベータ版の訴求は、[このAPIが「CursorやClaude Codeなど、MCPをサポートするコードエディタという、開発者がすでに利用するツールの中で動作するように設計されている」](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code)というもので、より限定的です。つまり、エディタがMCP対応であることは、必ずしもCloudflareのレジストラ自体がそうであることを意味しません。GoDaddyの開発者ポータルを直接確認したところ、本稿執筆時点では、人間の開発者向けのRESTエンドポイントが記載されている一方で、`llms.txt`やMCPサーバーへの言及は見当たりませんでした。

## 決済：保存済みカードがエージェントに適さない理由と、その代替手段

購入ステップは、人が関与するという前提を取り除くのが最も難しい部分です。消費者向けWeb決済スタックは、保存済みカード、請求先住所、ときには人以外を除外するためのCAPTCHAなど、人を前提として構築されているためです。エージェントはカードフォームを入力できませんし、技術的に可能だったとしても、人間の生のカード番号をエージェントに渡して人のふりをさせることは、望ましくないセキュリティモデルです。

現在、2つの代替手段が提供されています。1つ目はAPIキー請求です。レジストラが、前払いまたは請求書払いのアカウントに紐づく認証情報を発行し、エージェントはカードの代わりにそのキーで各呼び出しを認証します。Namefiのドキュメントでは、[namefi.io/api-key](https://namefi.io/api-key)でこのキーを生成し、すべてのリクエストで`x-api-key`ヘッダーとして渡す方法が説明されています。ブラウザセッションもカードフォームも不要です。Cloudflareの`.ai`価格設定も、同じ原価ベースの考え方に従っています。[「.aiドメインの登録と更新を追加の上乗せなしの卸売価格で提供する」](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)ため、プロモーションによって変動する価格よりも、固定的で予測可能な価格のほうがエージェントにとって判断しやすくなります。

2つ目の代替手段は、ウォレット署名による決済です。これはカードだけでなく、アカウント自体を不要にします。Namefiの`web3`ドキュメントには、HTTP 402ステータスコードと[x402](/ja/glossary/x402/)パターンを基盤としたフローが記載されています。決済なしでドメインをリクエストすると、402レスポンスで価格が返され、呼び出し元のウォレットがEIP-3009認可に署名し、その署名済み認可をヘッダーとして再送することで、登録と決済が一度に完了します。明示的に[「NamefiアカウントもEIP-712署名も不要」](https://namefi.io/web3/llms.txt)とされています。ここでのポイントはより限定的です。これはソフトウェアが自ら保持して利用できる決済手段であり、保存済みクレジットカードには構造上それができません。このフローを最初から最後まで確認するには、[暗号資産ウォレットでドメインを支払う：アカウント不要](/ja/blog/wallet-checkout/)を参照してください。

## ポリシーフック：このカテゴリ全体がまだ解決していない項目

ここには正直なギャップがあります。検出可能性、機械可読なドキュメント、構造化されたエラー、プログラム可能な決済は、レジストラが一度構築して提供できるものです。これに対して、支出上限、しきい値を超えた際の確認ステップ、1つのTLDまたは予算に限定されたキーといったポリシーフックは、人が委任した権限を保護するものです。APIの使いやすさを守るものではありません。

Namefi自身のドキュメントを確認すると、最も検証可能な事例として、特定の操作を重要な結果を伴うものとして扱い、構造化された機械可読エラー（安定したコード、`retryable`フラグ、構造化された詳細）を記録しています。この項目では実際の進展です。しかし、本稿執筆時点で公開APIリファレンスには、支出上限のプリミティブもサーバー側の確認ゲートも文書化されていません。そのガードレールは現在、人がMCPクライアント自体に設定するポリシーという、ひとつ上の層に置かれています。CloudflareまたはName.comのレジストラAPIについても、支出上限のプリミティブを示す公開ドキュメントは見つかりませんでした。これは、すべてのエージェントネイティブ・レジストラが次に埋めるべき項目です。

## 今日のプラットフォームをチェックリストで評価する

ここでは、この分野で最もよく名前が挙がる3つのプラットフォームを、マーケティング文言ではなく、各プラットフォームの公開ドキュメントを直接検証した内容に基づき、6項目のチェックリストで評価します。

| レジストラ | 検出可能性 | 自然言語ドキュメント | 機械可読なエラー | ブラウザ不要の購入 | プログラム可能な決済 | ポリシーフック |
| --- | --- | --- | --- | --- | --- | --- |
| Namefi | はい — llms.txt + MCPサーバー | はい — llms.txtファミリー | はい — 構造化コード | はい — REST + MCP | はい — APIキーまたはウォレット（x402） | まだ文書化されていない |
| Cloudflare Registrar | 一部 — 独自のllms.txt。MCPは専用サーバーではなくエディタ層 | 不明 — llms.txtのインデックス以外は未検証 | 不明 — 公開ドキュメントでは未検証 | はい — ベータ版に関する報道ではAPI駆動 | はい — APIキー、原価ベース価格 | まだ文書化されていない |
| Name.com | 不明 — 確認したドメインルートにllms.txtは見つからなかった | Name.com自身の発表で主張されているが、それ以上の独立検証はしていない | 確認した旧来のドキュメントには見当たらず、新しいAPIについては不明 | 独立検証していない | 一部 — アカウントクレジット請求のみ文書化 | まだ文書化されていない |

全プラットフォームで空白になっている項目、つまりポリシーフックは、特定の1社への批判ではなく、業界全体に共通する真のギャップです。この分野が進展するにつれて再確認する価値があります。

## よくある質問

### エージェントネイティブ・ドメインレジストラとは？

エージェントネイティブ・レジストラとは、ブラウザも、人が事前にドキュメントを読むことも、人がカード番号を入力することもなく、AIエージェントが自力で見つけ、理解し、取引できるレジストラです。検出可能性（`llms.txt`ファイルまたはMCPサーバー）、自然言語ドキュメント、機械可読なエラー、ブラウザ不要の購入、プログラム可能な決済で「はい」と評価されます。支出上限や確認ゲートなどのポリシーフックは、このカテゴリがいまなお整備を進めている要素です。

### AIエージェントが通常のレジストラAPIを使えないのはなぜですか？

技術的にはエンドポイントを呼び出せますが、ほとんどのレジストラAPIは、人間の開発者がすでにドキュメントを読み、統合コードを事前に書いていることを前提にしています。事前の統合がないエージェントには、ベースURLを見つけ、認証方式を学び、説明文によるエラーメッセージを解釈する標準的な方法がありません。APIが機能するのは、コールドスタートのエージェントにとって分かりやすいからではなく、人がすでにその解釈作業を行ったからです。

### llms.txtとMCPの違いは何ですか？

`llms.txt`は、エージェントがサイトやAPIの内容と利用方法を学ぶために一度読むプレーンテキストファイルです。クローラーに対する`robots.txt`と同じ役割ですが、言語モデル向けに書かれています。[MCP](https://modelcontextprotocol.io)は、呼び出し可能なツールを公開するサーバーへエージェントのクライアントが接続するライブプロトコルです。両者は補完関係にあります。llms.txtは検出のため、MCPはエージェントが行動する際に用いる接続のためのものです。検出の側面については、[ドメイン向けllms.txt：AIエージェントが読めるAPI](/ja/blog/llms-txt/)も参照してください。

### 自分のAPIをエージェントが使えるようにするには？

モデル向けにAPIを説明する`llms.txt`を公開し、MCPサーバーを公開するか、少なくともOpenAPIで文書化されたエンドポイントを公開してください。説明文ではなく安定したコードを持つ構造化エラーを返し、すべての書き込み操作がホスト型のチェックアウトページなしに完了できるようにし、人間のカードを前提としない決済手段をサポートしてください。そして、認証情報を持つ者がエージェントに許された範囲を制限できるよう、支出上限または確認のための制限を追加してください。

### Namefiはエージェントネイティブですか？

上のチェックリストでは、Namefiは直接検証した6項目のうち5項目で「はい」と評価されます。`llms.txt`ファミリーとMCPサーバーを公開し、ドキュメントはエージェントが利用できるよう構造化され、アウトバウンドAPIは構造化された機械可読エラーを返します。ダッシュボードを必要とせず、APIまたはx402ベースのウォレットフローのみで登録を完了でき、決済はアカウントなしでAPIキーまたはウォレット署名トランザクションにより行えます。ポリシーフックは公開APIリファレンスにまだ文書化されていません。その制御は現時点ではクライアント側にあります。<!-- TODO: confirm with team — whether a spend-cap or purchase-confirmation feature is on the near-term roadmap -->

### MCPサーバーがあれば、自動的にレジストラはエージェントネイティブになりますか？

いいえ。MCP対応は検出可能性とブラウザ不要の購入を満たしますが、レジストラがMCPサーバーを公開していても、構造化されていないエラーを返したり、保存済みカードを要求したり、支出上限の仕組みがなかったりする可能性があります。エージェントネイティブとは、個々の項目ではなくチェックリスト全体を満たすことです。

## 参考資料と追加情報

- Wikipedia — [Extensible Provisioning Protocol（EPPは2004年3月にProposed Standardとして標準化）](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- CircleID — [2026年のドメイン業界：AI、セキュリティ、市場の成熟、新gTLDの最前線（「AIエージェントはドメインリセラーとして、空き状況確認、名前の登録、DNS設定を人の介入なしに行う機会が増えている」）](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- webhosting.today — [AIエージェントは人間なしにドメインを登録できるように（Cloudflare Registrar APIベータ版、2026年4月）](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code)
- Name.com — [最初のAIネイティブ・ドメインプラットフォーム（「Model Context Protocolなどの最新標準によって支えられている」）](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=Our%20platform%20is%20supported%20by%20modern%20standards%20like%20Model%20Context%20Protocol)
- llmstxt.org — [/llms.txtファイルの提案](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- modelcontextprotocol.io — [Model Context Protocol（MCP）とは](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Schema.org — [FAQPage](https://schema.org/FAQPage)
- Cloudflare — [.aiドメインを原価で購入](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)
- Cloudflare Developers — [レジストラドキュメントのインデックス（llms.txt）](https://developers.cloudflare.com/registrar/llms.txt)
- Namefi — [namefi.io/llms.txt（APIおよびMCPサーバーのリファレンス。本稿のNamefi製品に関する主張の一次情報）](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt（ウォレット署名 / x402決済フロー。「NamefiアカウントもEIP-712署名も不要」）](https://namefi.io/web3/llms.txt)
