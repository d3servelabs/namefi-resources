---
title: "Cloudflare vs Name.com vs Namefi：エージェントネイティブなレジストラを比較"
date: '2026-07-10'
language: 'ja'
tags: ['ai-agents', 'comparison']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
format: comparison
ogImage: ../../assets/cf-namecom-namefi-og.jpg
description: "三つのエージェントネイティブなレジストラを機能別に比較。料金、MCP対応、暗号資産決済、トークン化された所有権、サービスの選び方を解説します。"
keywords: ["cloudflare レジストラ api", "name.com ai api", "namefi mcp", "エージェントネイティブ レジストラ", "ai レジストラ 比較", "暗号資産 ドメイン 決済", "トークン化ドメイン", "mcp ドメイン登録", "aiエージェント ドメイン購入", "cloudflare vs namefi", "name.com vs namefi", "原価 ドメイン料金", "ウォレット決済 ドメイン"]
relatedArticles:
  - /ja/blog/ai-domain-platforms/
  - /ja/blog/agent-native/
  - /ja/blog/airo-vs-namefi/
  - /ja/blog/claude-mcp-domains/
  - /ja/blog/ai-agent-register/
relatedTopics:
  - /ja/topics/domain-tokenization/
  - /ja/topics/choosing-a-tld/
relatedSeries:
  - /ja/series/tokenize-your-com/
  - /ja/series/best-tlds-by-industry/
relatedGlossary:
  - /ja/glossary/ai-agent/
  - /ja/glossary/registrar/
  - /ja/glossary/tokenized-domain/
  - /ja/glossary/dnssec/
  - /ja/glossary/wallet/
---

現在では、人間に代わってチェックアウトフォームへ入力できる[レジストラ](/ja/glossary/registrar/)が三社あります。Cloudflareは2026年4月、ブラウザセッションなしで[AIエージェント](/ja/glossary/ai-agent/)がドメインを登録できるAPIのベータ版を公開しました。Name.comは同じ発想を中心にAPIを刷新し、自社を初のAIネイティブなドメインプラットフォームと位置づけています。NamefiはModel Context Protocol（MCP）サーバーと、アカウント作成を完全に省けるウォレット署名型チェックアウトを構築しました。三社が目指す変化は同じです。人がブラウザで行っていたドメイン登録を、エージェントがAPI呼び出しで行うものへ変えようとしています。

もっとも、ロゴだけが異なる同一製品ではありません。各社は料金、「エージェントネイティブ」に本当に必要な要件、購入者が支払い能力を証明する方法について、それぞれ異なる選択をしています。本記事では三社を機能ごとに比較し、Cloudflareの料金が実際に極めて強力な点や、Name.comのポジショニングが実装済みの機能より先行している点も取り上げます。

## 「エージェントネイティブ」に本当に必要なもの

APIがあることと、エージェントが利用できることは同じではありません。多くのレジストラは何年も前からプログラムによる登録手段を提供しています。しかし、それらのインターフェースはドキュメントを読むリセラーや開発者向けに作られたもので、可能な操作を自力で見つけ、人がパスワードを入力せずに認証し、人が読まなくてもエラーメッセージを解析しなければならない自律プロセス向けではありません。「APIを持つ」レジストラとエージェントネイティブなレジストラを分ける詳しいチェックリストは、[エージェントネイティブ・ドメインレジストラとは？](/ja/blog/agent-native/)で解説しています。要点は、発見可能性（エージェントが自力でAPIを見つけられるか）、機械可読なレスポンス、そして人間がクレジットカードを持っていることを前提としない決済経路です。以下の三社はいずれも、程度の差はあれ、この基準を満たしています。

## Cloudflare Registrar API：原価提供、ベータ版、エディタ内ですでに利用可能

CloudflareのRegistrar APIは、同社の「Agents Week」における発表の一環として、2026年4月15日にベータ版として公開されました。リリースを扱った業界レポートによると、このAPIでは[AIエージェントがドメインの空き状況を検索し、料金を確認し、ブラウザ操作や人手による承認なしでプログラムから登録を完了できます](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=lets%20an%20AI%20agent%20search%20for%20domain%20availability%2C%20check%20pricing%2C%20and%20complete%20registration%20programmatically%20without%20any%20browser%20interaction%20or%20manual%20approval)。標準的なドメインなら登録は数秒以内に同期的に完了します。また、このAPIは[CursorやClaude Codeなど、MCPに対応したコードエディタ](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code)の中で使うことを想定しています。開発者は、プロジェクトを構築しているツールから離れずに、そのプロジェクト用のドメインを登録できます。

Cloudflareの最大の強みは料金です。ここは信頼できる比較のためにも、その明確な優位性を認める必要があります。Cloudflareは[.aiドメインの登録と更新を追加の上乗せなしで卸売価格にて提供](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)しており、登録するすべてのドメインに[無料のDNSSEC、無料SSL、二要素認証、デフォルトで有効なドメインロック](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=free%20DNSSEC%2C%20free%20SSL%2C%20two-factor%20authentication%2C%20and%20a%20domain%20lock%20enabled%20by%20default)が付属します。[WHOIS情報の無料非公開化](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=every%20.ai%20domain%20comes%20with%20free%20WHOIS%20redaction)も含まれ、他社が追加オプションとして販売する[WHOIS プライバシー](/ja/glossary/whois-privacy/)保護にも追加料金はかかりません。別のレジストラ比較記事も、この料金体系を独自に確認しています。Cloudflareの[原価料金では、登録時も更新時も上乗せなしで、Cloudflareが支払う金額だけが請求されます](https://www.hostinger.com/tutorials/best-domain-registrars/#:~:text=At-cost%20pricing%20charges%20you%20only%20what%20Cloudflare%20pays%2C%20with%20no%20markup%20at%20registration%20or%20renewal)。価格が決め手で、「登録してロックする」以上の機能が不要なら、Cloudflareに対抗するのは困難です。

ただし、対象範囲には注意が必要です。ベータ版が対応するのは検索、料金確認、登録までです。[Cloudflareはライフサイクル管理を開発中で、2026年後半のリリースを予定していると説明しています](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=Cloudflare%20has%20stated%20that%20lifecycle%20management%20is%20in%20development%20and%20is%20planned%20for%20release%20later%20in%202026)。つまり、移管、更新、連絡先の変更は、まだエージェント向けAPIに含まれていません。暗号資産による支払いも、トークン化された所有権もありません。Cloudflareで登録したドメインは従来型のレジストラアカウント内の資産であり、ウォレットが直接保有できるものではありません。

## Name.comのAIネイティブAPI：自然言語から動作するコードへ

Name.comの訴求点はCloudflareとは異なります。価格を前面に出すのではなく、Name.comは[エージェンティックAI時代に向けてドメインを現代化するAIネイティブプラットフォーム、新しいname.com APIの提供開始](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI)を軸に開発者向けAPIを再構築しました。基盤には、[AIエージェントがドメイン操作を直接実行できるようにするModel Context Protocol（MCP）とOpenAPI仕様](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=supported%20by%20modern%20standards%20like%20Model%20Context%20Protocol%20%28MCP%29%20and%20OpenAPI%20specification%2C%20which%20enable%20AI%20agents%20to%20interact%20directly%20with%20domain)を採用しています。同社もエディタ内のワークフローとして明確に売り込んでおり、MCP対応により、開発者は[ClaudeやCursorなどのAIツールを利用し、簡単なプロンプトからドメイン操作を実行できる](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=Leverage%20AI%20tools%20like%20Claude%20and%20Cursor%20to%20handle%20domain%20operations%20through%20simple%20prompts%2C%20thanks%20to%20MCP%20support)としています。

Name.comの発表で最も明確な差別化要因は、自然言語からコードを生成するという位置づけです。エージェントが固定された一連のエンドポイントを呼び出すのではなく、「アプリにドメイン登録機能を追加して」と伝えると、エージェントがAPIドキュメントを使って統合コードそのものを書く、という提案です。Name.comは、「世界はこの方向へ進んでいる」という主張を自社顧客調査で裏づけ、[回答者の91%が、今後二年間にAIエージェントがドメイン管理の少なくとも一部を担うと予想している](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years)と報告しています。ただし、この数値は第三者調査ではなくName.com自身の発表に基づくため、独立調査ではなく、同社が報告する市場意識として扱うべきです。

率直に指摘すべき点が二つあります。第一に、Name.comのブログ記事はポジショニングとビジョンを示すもので、CloudflareやNamefiのドキュメントのような項目別の機能表は公開していません。そのため、以下の比較表の一部は、検証済みの仕様ではなく発表内容に基づいています。第二に、料金についてName.comの記事が述べているのは、リセラー側の柔軟性、つまり[独自の上乗せ価格を設定できること](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20ability%20to%20set%20your%20own%20markups)です。これはリセラーパートナー向けの機能であり、Cloudflareのようにエンドユーザーへ原価で提供するという約束ではありません。この発表には、暗号資産による決済経路もトークン化された所有権も記載されていません。

## Namefi：MCPサーバー、ウォレット決済、トークン化された所有権

Namefiのアプローチは、購入者がそもそもブラウザセッションやクレジットカードを持つ人間とは限らず、操作前にNamefiアカウントを作ることも望まないかもしれない、という異なる前提から始まります。製品に関する唯一の正確な情報源であるNamefi自身の機械可読なAPIドキュメントによると、NamefiはStreamable HTTPトランスポートを使用するMCPサーバーを`https://api.namefi.io/mcp`で運用しています。このサーバーは「`/v-next`のすべての操作を型付きツール（検索、登録、DNS、ドメイン設定、外部移管）として」公開し、`https://namefi.io/.well-known/mcp/servers.json`から検出できます。また、Claude Code向けに一行のセットアップコマンド（`claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"`）も記載されています。REST APIの認証では、ドメインを所有するウォレットに紐づいた`x-api-key`ヘッダーを使用し、読み取り専用ツールにはキーすら必要ありません。

最大の特徴は決済です。Namefiが文書化する[x402](https://x402.org)決済フローでは、エージェントが先にNamefiアカウントを作らなくても、ステーブルコインUSDCでドメインを購入できます。購入者のウォレットがEIP-3009の`transferWithAuthorization`へ署名し、決済情報が添付されていなければAPIが価格を含む`402 Payment Required`レスポンスを返し、有効な決済ヘッダーを受け取ると登録を完了します。別のMachine Payable Protocol（MPP）フローでも、同様のチャレンジ＆署名方式を利用できます。CloudflareもName.comも同等の仕組みを文書化しておらず、これは本比較で最も明確な差別化要因です。チェックアウトの一連の流れについては、[暗号資産ウォレットでドメインを支払う：アカウント不要](/ja/blog/wallet-checkout/)を参照してください。

Namefiはドメインを[NFT（非代替性トークン）](/ja/glossary/nft/)としても登録します。つまり、所有権がレジストラ内部のデータベースだけでなくオンチェーンでも検証される[トークン化ドメイン](/ja/glossary/tokenized-domain/)です。DNSの切り替え機能には自動[ENS（Ethereum Name Service）](/ja/glossary/ens/)レコードと[DNSSEC（ドメインネームシステム・セキュリティ拡張）](/ja/glossary/dnssec/)が含まれ、DNSレコードの完全なCRUD管理（単一・一括）、自動更新、ドメインパーキング、転送にも対応します。一方、Namefiのllms.txtには明示的な料金方針が掲載されていません。Cloudflareに相当する「原価提供」の主張も、本記事で確認したドキュメント上の公開料金表もないため、価格面でCloudflareと同等だと仮定せず、namefi.ioで現在の料金を直接確認してください。<!-- TODO: チームに確認 — レジストリ原価に対するNamefiの公開料金／上乗せ方針 -->

## 機能比較表

| 機能 | Cloudflare Registrar API | Name.com AIネイティブAPI | Namefi |
|---|---|---|---|
| 空き状況の検索 | 対応 | 対応 | 対応（`search/availability`、一括検索） |
| 料金照会 | 対応 | 対応（文書化済み、項目別の記載なし） | 対応（x402の402レスポンスで返却、APIからも取得可能） |
| 購入／登録 | 対応、同期処理、数秒 | 対応（エージェントが統合コードを生成） | 対応 — APIキー、またはウォレット署名したUSDCによるx402/MPP決済 |
| DNS管理 | 現在のベータ版では未対応 | 発表に項目別の記載なし | 対応 — 完全なCRUD、一括操作、A/CNAME/TXT/MXなど |
| 更新の自動化 | 現在のベータ版では未対応（2026年後半に予定） | 発表に項目別の記載なし | 対応 — ドメインごとの自動更新切り替え |
| 暗号資産決済 | 非対応 | 非対応 | 対応 — x402によるUSDC決済、アカウント不要 |
| トークン化された所有権 | 非対応 | 非対応 | 対応 — ドメインをNFTとして登録し、オンチェーンで検証 |
| アカウントの要否 | 必要（Cloudflareアカウント） | 必要（開発者／APIアクセス） | x402ウォレット決済では不要。APIキー経路はウォレットに紐づく |
| MCP対応 | 対応（第三者レポートによるとエディタ内で利用可能） | 対応（文書化済み） | 対応 — 専用MCPサーバーと検出用記述子 |
| エディタ連携 | Cursor、Claude Code（レポートによる） | Claude、Cursor（発表による） | Claude Code（セットアップコマンドを文書化）、オープンなMCPプロトコル |
| 原価／上乗せなしの料金 | 対応、明記あり | 記載なし（リセラーの上乗せに言及） | 未公開 — 現在の料金を要確認 |

## それぞれが適している場面

価格とシンプルさが決め手で、ドメインを登録してロックする以上の機能が不要なら、**Cloudflare**が適しています。原価料金と標準装備のセキュリティ機能（DNSSEC、WHOIS情報の非公開化、二要素認証）は、同じ保護に料金を課す多くの既存事業者より実際に優れています。すでにCursorやClaude CodeからCloudflareの技術基盤上で開発しているなら、ワークフローも滑らかです。率直なトレードオフは機能範囲です。ベータ版は登録専用のため、DNS管理、更新の自動化、暗号資産やトークン化の機能はまだありません。

固定APIを呼ぶエージェントではなく、統合コードを書いてくれるエージェントが欲しい場合、またはすでにName.comのリセラーで、現代化されたMCP対応プラットフォーム上でも価格の上乗せを柔軟に設定したい場合は、**Name.com**が適しています。ただし、実装済みの範囲とロードマップ上の範囲について、ドキュメントはCloudflareやNamefiより簡略です。マーケティング内容と実際のAPI機能を照合するテスト時間を確保してください。

購入者が真にエージェントファースト、つまり人間のアカウントを必要とせず、保存済みカードではなくウォレット署名で支払いを承認し、所有権をレジストラのデータベース上の行だけでなく、オンチェーンで移転可能なトークンとして表したいなら、**Namefi**が適しています。MCPサーバー、完全なDNS管理、自動ENS、ウォレットネイティブなチェックアウトという組み合わせは、Cloudflareのベータ版にもName.comの発表にも現時点ではありません。トレードオフは、NamefiがCloudflareのような原価料金の約束を公表していないことです。卸売価格を最優先するなら、Namefiの方がCloudflareより安いと決めつけず、現在の料金を直接確認してください。

最終的に複数社を使うチームも多いでしょう。すでに運用しているインフラの入口となるドメインにはCloudflareまたはName.comを使い、マーケットプレイスでの取引を想定した名前や、人のアカウントではなくエージェント自身のウォレットで所有する名前など、オンチェーンで保有・取引する必要があるものにはNamefiのようなウォレットネイティブなレジストラを使う形です。[登録者](/ja/glossary/registrant/)が人ではなくエージェントになったとき、「所有」とは何を意味するのか。それだけで一本の記事になるほど深い問いです。詳しくは[AIエージェントはドメインを所有できるのか？ WHOIS、カストディ、トークン](/ja/blog/agent-own-domain/)をご覧ください。

## よくある質問

### AIエージェントが利用する場合、最も安いレジストラはどれですか？
三社のうち、原価・上乗せなしの料金を明確に約束しているのはCloudflareだけであり、独立したレジストラ比較記事も同じ方針を確認しています。Name.comの発表が説明しているのは、エンドユーザーへの原価提供ではなくリセラー向けの上乗せ価格の柔軟性です。また、NamefiはAPIドキュメントで料金方針を公開していません。したがって、各プラットフォームの現在の料金を確認しない限り、現時点で直接比較することはできません。

### 人間が持つクレジットカードなしでエージェントが支払えるサービスはありますか？
暗号資産ネイティブな決済フローを文書化しているのは、三社のうちNamefiだけです。エージェントのウォレットはNamefiアカウントを作成せず、x402プロトコルを介してUSDCで支払えます。別のMachine Payable Protocolによるチャレンジ＆署名フローも利用できます。Cloudflareのベータ版もName.comのAPIも、これに相当するアカウント不要の決済経路を文書化していません。

### ドメイン登録だけでなく、これらのAPIからDNSレコードも管理できますか？
Namefiのドキュメントでは、DNSレコードの一括作成・更新・削除を含む完全なCRUDと、パーキング、転送、自動ENS、Vercel Anycastレコードの切り替えを扱っています。本記事執筆時点のCloudflare Registrar APIベータ版は登録専用で、DNSを含むライフサイクル管理と登録後の管理機能は、今後のリリースが予定されています。Name.comの発表にはDNS管理機能の項目別の記載がありません。

### CloudflareのRegistrar APIはすでに一般提供されていますか？
いいえ。Cloudflareの「Agents Week」期間中である2026年4月15日にベータ版へ移行しました。Cloudflareは、より広範なライフサイクル管理（移管、更新、連絡先変更）を引き続き開発中で、2026年後半に提供予定だと説明しています。ベータ段階の機能は変更される可能性があるものとして扱い、本番環境で依存する前にあらためて確認してください。

### 「エージェントネイティブ」とは何ですか？ 三社すべてが該当しますか？
エージェントネイティブとは、人間がブラウザフォームへ入力しなくても、エージェントがAPIを発見し、認証し、購入を完了できることです。詳しいチェックリストは[エージェントネイティブ・ドメインレジストラとは？](/ja/blog/agent-native/)をご覧ください。ここで扱った三社はいずれも基本的な基準（プログラムによる検索から購入までの処理、MCPまたはMCPに近いツール）を満たします。ただし、エージェントネイティブな設計が登録後のどこまで及ぶか、つまりDNS、更新、支払い方法、所有権モデルについては大きく異なります。

## Namefiでドメインを購入してトークン化

ウォレットネイティブなチェックアウトとトークン化された所有権が必要なら、[Namefi](https://namefi.io)は、認定レジストラと同じ方法で実在するICANNドメインを登録し、そのドメインを自分のウォレットが管理するNFTとして保有する選択肢を提供します。三社以外も含む全体像については[AIエージェント型ドメインプラットフォーム：2026年版ガイド](/ja/blog/ai-domain-platforms/)を、すぐに設定を始めるなら[NamefiでAIエージェントを使ってドメインを登録する方法](/ja/blog/ai-agent-register/)をご覧ください。エージェントが購入を自力で完了する仕組みについては、[AIエージェントは人間なしでどうドメインを購入するのか（2026年）](/ja/blog/agents-buy-domains/)で解説しています。

**[Namefiでドメインを検索・登録する](https://namefi.io)。**

## 出典と参考資料

- webhosting.today — [AIエージェントが人間なしでドメインを登録可能に（Cloudflare Registrar APIベータ版、2026年4月）](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=lets%20an%20AI%20agent%20search%20for%20domain%20availability%2C%20check%20pricing%2C%20and%20complete%20registration%20programmatically%20without%20any%20browser%20interaction%20or%20manual%20approval)
- Cloudflare — [.aiドメインを購入：原価料金と付属のセキュリティ機能](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)
- Name.com — [初のAIネイティブ・ドメインプラットフォーム](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI)
- Hostinger — [Cloudflareの原価料金を含むドメインレジストラ比較](https://www.hostinger.com/tutorials/best-domain-registrars/#:~:text=At-cost%20pricing%20charges%20you%20only%20what%20Cloudflare%20pays%2C%20with%20no%20markup%20at%20registration%20or%20renewal)
- llmstxt.org — [llms.txt仕様](https://llmstxt.org/#:~:text=context%20windows%20are%20too%20small%20to%20handle%20most%20websites%20in%20their%20entirety)
- Model Context Protocol — [MCPとは？](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt（MCPサーバー、API、認証のリファレンス）](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt（ウォレット署名とx402暗号資産決済のリファレンス）](https://namefi.io/web3/llms.txt)
