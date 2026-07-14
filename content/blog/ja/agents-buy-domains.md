---
title: "AIエージェントは人間なしでどうドメインを購入するのか（2026年）"
date: '2026-07-10'
language: 'ja'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/agents-buy-domains-og.jpg
description: "2026年4月、ドメイン登録はエージェント層へ移行しました。AIエージェントがドメインを検索し、価格を確認して登録する仕組みと、それでも欠かせないガードレールを解説します。"
keywords: ["AIエージェントによるドメイン登録", "人間不要のドメイン登録", "自律型ドメイン登録", "エージェント層でのドメイン登録", "Cloudflare Registrar APIベータ", "エージェント型ガードレール", "AIエージェントのドメイン登録 2026", "AIにドメインを購入させても安全か", "ドメインリセラーとしてのエージェント", "MCPドメイン登録", "llms.txtによるドメイン検出", "AIエージェントの支出上限", "EPPレジストリプロビジョニング"]
relatedArticles:
  - /ja/blog/ai-domain-platforms/
  - /ja/blog/cf-namecom-namefi/
  - /ja/blog/agent-native/
  - /ja/blog/namefi-mcp/
  - /ja/blog/state-of-agentic/
relatedTopics:
  - /ja/topics/domain-basics/
  - /ja/topics/domain-security/
relatedSeries:
  - /ja/series/blockchain-concepts/
  - /ja/series/domain-apocalypse/
relatedGlossary:
  - /ja/glossary/ai-agent/
  - /ja/glossary/epp/
  - /ja/glossary/registrar/
  - /ja/glossary/registry/
  - /ja/glossary/reseller/
---

この20年間、ドメイン登録には決まった小さな手順がありました。検索ボックスに名前を入力し、緑のチェックマークを待ち、カード番号を入力し、写真から横断歩道を選んで人間であることを証明し、購入ボタンを押すというものです。この手順は、意図的なフィルターでもありました。[CAPTCHA](https://en.wikipedia.org/wiki/CAPTCHA)、購入フォーム、カード入力欄はどれも、人間以外による処理を遅らせるために存在しています。

2026年4月15日、このフィルターはどこでも必須というものではなくなりました。CloudflareがRegistrar APIのパブリックベータを公開し、その狙いを業界報道は率直に、[Cloudflareは「この取引をエージェント層へ移した」](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer)と要約しました。エージェント層とは、人間がフォームをクリックする代わりに、ソフトウェアが購入を開始するアーキテクチャ上の層です。人間がキーボードの前にいることを前提としていたため完全自動化が難しかった登録、DNS、その他いくつかの作業は、静かにその前提から離れました。

本記事では、この変化に焦点を当てます。技術的に何が変わったのか、[AIエージェント](/ja/glossary/ai-agent/)がユーザーに代わってドメインを登録するとき実際に何をするのか、そして「人間不要」という言葉をうのみにすべきではないからこそ、安全のために何が引き続き必要なのかを説明します。現在対応している各プラットフォームの比較は[AIエージェント対応ドメインプラットフォーム：2026年版ガイド](/ja/blog/ai-domain-platforms/)と[Cloudflare vs Name.com vs Namefi](/ja/blog/cf-namecom-namefi/)を参照してください。そもそもレジストラをエージェントが利用可能にする条件については、[エージェントネイティブなドメインレジストラとは？](/ja/blog/agent-native/)で解説しています。

## 技術的に何が変わったのか

ドメイン業界が2026年4月にルールを書き換えたわけではありません。[レジストラ](/ja/glossary/registrar/)はそれより[何十年も前](/ja/glossary/epp/)からプログラムで利用できるAPIを備えていました。変わったのは、誰にとってそのAPIが使いやすくなったかです。

従来のレジストラの購入画面は、人間がページを読み、カード情報を入力し、ボットではないことを証明してから購入を完了するよう設計されています。この3つの前提は、どれもエージェントにとって障壁になります。CAPTCHAは人間以外を遮断するための仕組みなので、不正利用だけでなく、人間の指示に従って動く正当なエージェントも同じように遮断します。Cloudflareのベータ上に構築された第三者のMCPチュートリアルは、従来のモデルを端的にこう表現しています。[「ドメインレジストラは人間向けに作られている。CAPTCHA、ダッシュボード、フォーム、クレジットカード入力欄。エージェントにやさしいとは到底言えない」](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26#:~:text=Domain%20registrars%20are%20built%20for%20humans%3A%20CAPTCHAs%2C%20dashboards%2C%20forms%2C%20credit%20card%20fields.%20Not%20exactly%20agent-friendly.)

このモデルに代わったのは次の3つです。互いに競合するものではなく、積み重なって機能します。

- **認証済みREST API**：レンダリングされた購入画面を操作する代わりに、HTTP呼び出しで購入を完了できます。Cloudflareのベータでは検索、空き状況の確認、登録をこの方法で行い、公開時の報道によれば標準ドメインの登録は「数秒以内に同期的に」完了します。
- **[MCP](https://modelcontextprotocol.io)（Model Context Protocol）**：公式ドキュメントが[「AIアプリケーションを外部システムへ接続するためのオープンソース標準」](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)と説明するオープン標準です。エージェントに専用の連携コードを渡す方式とは異なり、レジストラが提供するツール（`search`、`register`、`set_dns_record`）を自ら検出し、Claude、Cursor、その他の対応クライアントから直接呼び出せます。CloudflareはRegistrar APIをこの層に接続しました。同社の説明では、「Cursor、Claude Code、またはMCP対応環境で動作するエージェントがRegistrarのエンドポイントを検出して呼び出せる」ため、別途連携手順を踏む必要がありません。
- **[llms.txt](https://llmstxt.org)による検出**：[「推論時にLLMがウェブサイトを利用するのに役立つ情報を、`/llms.txt`ファイルで提供することを標準化する提案」](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)というプレーンテキストの規約です。初めて利用するレジストラでも、人間が会話にAPIドキュメントを貼り付けなくても、エージェント自身ができることを把握できます。

この3つは、それぞれ単体では新しいものではありません。MCPが公開され、llms.txtが提案されたのはいずれも2024年後半です。新しいのは、大手レジストラが3つすべてを実際の購入フローに組み込んだことです。その結果、「AIエージェントがドメインを登録する」という話が、個人開発者のデモではなくニュースの見出しになりました。

## エージェントが実際に行うこと

マーケティング的な表現を取り除けば、エージェントによるドメイン購入は短く機械的な一連の処理です。人間が購入画面で行うのと同じ手順を、クリックではなくAPI呼び出しで実行します。関係するのは、エージェント、レジストラのAPI、その背後にある[レジストリ](/ja/glossary/registry/)の3者です。

1. **検索する。** エージェントが候補名または必要な名前の説明をレジストラの検索エンドポイント（あるいは対応するMCPツール）へ渡し、登録可能な候補と取得済みの候補の一覧を受け取ります。
2. **空き状況と価格を確認する。** 特定の名前について、リアルタイムの空き状況と正確な価格を照会します。これには登録料、プレミアム価格の上乗せ、該当する場合の[ICANN](/ja/glossary/icann/)取引手数料が含まれます。ここでは厳選された[TLD（トップレベルドメイン）](/ja/glossary/tld/)の一覧が重要です。Cloudflareを含む複数のエージェントネイティブなベータ版は、公開時点で完全なカタログではなく、人気TLDの一部に対応しています。
3. **認証し、権限を証明する。** ログイン画面の奥に保存されたカードの代わりに、レジストラがプログラムで検証できる認証情報を提示します。入金済みアカウントに紐づくAPIキーや、ウォレット署名などです。
4. **登録する。** エージェントが登録エンドポイントを呼び出します。レジストラは、2004年にProposed Standardとなって以来レジストラとレジストリの通信に使われてきた[EPP](/ja/glossary/epp/)、すなわち[Extensible Provisioning Protocol](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol)を通じて、ドメインの[レジストリ](/ja/glossary/registry/)へリクエストを転送します。レジストリがレコードを作成すると、APIは通常数秒以内に確認結果を返します。
5. **DNSを設定する。** 名前を確保したら、エージェントは[ネームサーバー（NSレコード）](/ja/glossary/nameserver/)または個別のDNSレコードを設定します。たとえば、サーバーを指すAレコードや、ホスティングプラットフォームを指すCNAMEです。多くの場合、ドメイン登録と同じ会話の中で、すぐ次のAPI呼び出しとして実行されます。
6. **人間に結果を報告する。** 適切に設計されたエージェントフローでは、人間がカード明細を見て初めて購入を知ることはありません。エージェントがドメイン名、価格、接続先を報告します。

この6番目の手順は、見た目以上に重要です。次のセクションで詳しく説明します。

## ガードレール：「人間不要」でも、人間が定めるポリシーは必要

「人間不要」とは仕組みを表す言葉であり、ガバナンスを表すものではありません。APIは取引の途中で人間にボタンを押してもらう必要がありませんが、与えられた権限でエージェントに何を許すかは、あらかじめ誰かが決めなければなりません。Cloudflareのベータ版ドキュメントも、その責任の所在を明記しています。[「承認なしにドメインを購入しないエージェントフローを設計する責任は、人間にあります」](https://blog.cloudflare.com/registrar-api-beta/) APIによって購入画面なしで登録できるようになっても、どのタイミングで登録するかまでAPIが決めてくれるわけではありません。これはエージェントを組み込む人が定義すべきポリシーです。

実務では、次の3つのガードレールが特に有効です。

- **カード番号を直接渡さない決済承認。** プリペイド残高または請求書払いの残高に紐づくAPIキーなら、仕組み上、損失の総額に上限を設けられます。エージェントは入金額を超えて支出できません。ウォレット署名による取引は購入ごとに承認され、再利用もできません。どちらも、あらかじめ上限が設定されていない保存済みクレジットカードとは、リスクの形が大きく異なります。
- **支出上限と確認基準。** エージェントが動き始める前に人間が設定します。Cloudflareが「適切に設計されたエージェントフロー」に推奨しているのは、登録エンドポイントの呼び出し後ではなく、呼び出す前にドメイン名と価格をユーザーへ確認することです。APIはこの構成を可能にしますが、強制はしません。
- **法的責任を負う主体の明確化。** エージェントが名前を登録しても、ドメインには記録上の[登録者](/ja/glossary/registrant/)がいるという法的事実は変わりません。エージェント所有ドメインに関する論考は、リスクを率直にこう指摘しています。[「エージェントが登録したドメインが商標と抵触した場合、UDRPの申立てに対応する人間がいない」](https://dev.to/purpleflea/how-ai-agents-can-buy-their-own-domain-names-and-why-this-matters-1l4j#:~:text=If%20an%20agent%20registers%20a%20domain%20that%20turns%20out%20to%20be%20a%20trademark%20conflict%2C%20there%27s%20no%20human%20to%20respond%20to%20a%20UDRP%20complaint)可能性があるのは、認証情報を使って何が登録されたかを誰も監視していない場合です。購入画面をなくしても、[UDRP（統一ドメイン名紛争解決方針）](/ja/glossary/udrp/)の手続き、更新期限、[WHOIS（およびRDAP）](/ja/glossary/whois/)の記録はなくなりません。誰かが意識して監視を組み込む必要があります。

ここで立ち止まって考えるべき点があります。ドメインを登録できるエージェントは、各取引を誰かが確認しなくても、お金を使い、ドメインのポートフォリオを増やせます。まさにその能力が便利さを生む一方で、ポリシー層を省略できない理由にもなっています。

## 現在の提供事業者とリセラーという見方

Cloudflareのベータ版は、この変化の中で最も広く報じられた事例ですが、唯一のものではありません。Name.comは2025年半ばから、同様のMCPとOpenAPIを軸にしたAPIを構築しました。NamefiはMCPサーバーに加え、アカウント作成を完全に省略できるウォレット署名型の購入フローを運用しています。料金モデル、TLDの対応範囲、決済に既存アカウントが必要かといった機能ごとの差は、[Cloudflare vs Name.com vs Namefi：エージェントネイティブなレジストラ](/ja/blog/cf-namecom-namefi/)で比較しています。大手の消費者向けレジストラがこの領域のどこまで対応しているかを含む全体像は、[AIエージェント対応ドメインプラットフォーム：2026年版ガイド](/ja/blog/ai-domain-platforms/)を参照してください。

個々のプラットフォームより新しいのは、エージェントがこの能力を手にした後、それをどのように使い始めているかです。CircleIDが2026年半ばに行ったドメイン業界の調査は、[「AIエージェントは、空き状況の確認、名前の登録、DNSの設定を人間の介入なしで行うドメインリセラーとして、ますます活動するようになっている」](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)と説明しています。ここで[リセラー](/ja/glossary/reseller/)という言葉を使っているのは意図的です。リセラーは、自ら認定を受ける代わりに、レジストラの認定の下でドメインを販売またはプロビジョニングする既存の役割です。エージェントを新たな分類ではなく非公式のリセラーと捉えると、担当者が人間でなくても、検索、価格確認、登録、設定を他者のために大規模に行うという、見慣れたワークフローだと分かります。このパターンが実際にどこまで普及し、どこからが発表段階にとどまっているのかは、[エージェント型ドメイン管理の現状（2026年）](/ja/blog/state-of-agentic/)で追跡しています。[NamefiのMCPサーバー](/ja/blog/namefi-mcp/)は、リセラーのように動くエージェントが呼び出すツールの具体例です。

## よくある質問

### 2026年4月15日に具体的に何が変わったのですか？

Cloudflareが、ドメイン検索、空き状況と価格の確認、登録に対応するRegistrar APIのパブリックベータを公開し、CursorやClaude Codeなどでエージェントがすでに利用していたCloudflare MCPサーバーへ接続しました。エージェントから呼び出せるレジストラAPIとして最初だったわけではありません。Name.comは2025年半ばに公開しており、Namefiもすでに運用していました。しかし、広く知られた大手レジストラが、ブラウザーの購入画面だけでなくエージェントだけでも購入全体を完了できるようにした事例として、最も広く報じられました。

### AIエージェントがドメインを登録するたびに、私の許可が必要ですか？

APIの標準動作では、必ずしも必要ではありません。有効かつ承認済みの認証情報と、請求可能な価格をエンドポイントが受け取ると、登録は直ちに完了します。確認手順の有無は、レジストラが自動で強制するものではなく、エージェントの設定方法によって決まります。Cloudflareも、購入前の承認を必須にする責任はエージェントフローを設計する側にあると明示しています。

### すべての取引を監視せずにAIエージェントにドメインを購入させても、本当に安全ですか？

安全性は、事前に設定したガードレール次第です。何も設定しなくても安全になるわけではありません。実用的なのは、損失の総額に上限を設けるプリペイド残高または請求書払いの残高、1回の購入だけを承認して再利用できないウォレット署名、そして自分で決めた金額の基準を超えた場合の確認手順です。この領域のどのプラットフォームも、ユーザーに代わって共通の支出上限を強制してはいません。上限はユーザー自身が設定します。

### AIエージェントがドメインを登録した場合、法的責任を負うのは誰ですか？

ドメインには引き続き記録上の[登録者](/ja/glossary/registrant/)がいます。それはAIモデル自体ではなく、人または組織です。商標紛争、[UDRP（統一ドメイン名紛争解決方針）](/ja/glossary/udrp/)に基づく申立て、更新期限について責任を負うのは、その登録者です。購入手順から人間を外しても、所有者の記録から人間が消えるわけではありません。監視を組み込まなければ、こうしたリスクに誰も気づかない可能性があるということです。

### AIエージェントは、正式な認定を受けたドメインリセラーになりつつありますか？

ICANN認定という意味では違います。[リセラー](/ja/glossary/reseller/)は通常、レジストラの認定契約の下で事業を行う企業です。CircleIDがいう「リセラー」は法的な名称ではなく、行動パターンを表す説明的な表現です。その行動が将来、正式に認められた分類へまとまっていくかどうかは、[エージェント型ドメイン管理の現状（2026年）](/ja/blog/state-of-agentic/)で扱う未解決の論点の一つです。

### すべてのTLDで利用できますか。それとも人気のTLDだけですか？

プラットフォームによって異なります。完全対応だと決めつけず、直接確認することが重要です。Cloudflareのベータ版は、同社が人気TLDを厳選したセットと呼ぶ範囲で開始され、完全なカタログではありませんでした。ベータ版の成熟に伴い対応範囲は拡大する傾向があるため、特定の拡張子を前提にする前に、そのプラットフォームの最新ドキュメントで現在のTLD対応状況を確認してください。

## 購入画面なしで、自分のエージェントに次のドメインを登録させよう

[Namefi](https://namefi.io)は、本記事で説明したものと同じ種類のエージェントネイティブな購入経路を提供しています。エージェントが直接接続するMCPサーバー、文書化されたREST API、アカウント作成を完全に省略できるウォレット署名型の購入フローを利用できます。さらに、ドメイン自体をエージェントのウォレットで保有できる資産にしたい場合は、[トークン化](/ja/glossary/tokenized-domain/)された所有権も選べます。支出ポリシーを一度設定すれば、本記事で説明したように、検索、価格確認、登録をエージェントへ任せられます。

**[Namefiでドメインを検索・登録する](https://namefi.io)。**

## 出典と参考資料

- Cloudflare Blog — [Registrar APIベータ版の発表](https://blog.cloudflare.com/registrar-api-beta/)（公開日、対応操作、原価での料金設定、MCP連携、人間による承認の指針）
- webhosting.today — [AIエージェントが人間なしでドメインを登録可能に](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer)（Cloudflareのベータ版を「エージェント層」への移行と捉えた業界の見方、2026年4月）
- dev.to — [人間なしでAIエージェントを使ってドメイン名を登録する方法](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26#:~:text=Domain%20registrars%20are%20built%20for%20humans%3A%20CAPTCHAs%2C%20dashboards%2C%20forms%2C%20credit%20card%20fields.%20Not%20exactly%20agent-friendly.)（従来の購入画面モデルと、エージェントから呼び出せる登録を比較する第三者のMCPチュートリアル）
- dev.to — [AIエージェントはどう自分のドメイン名を購入するのか、そしてなぜ重要なのか](https://dev.to/purpleflea/how-ai-agents-can-buy-their-own-domain-names-and-why-this-matters-1l4j#:~:text=If%20an%20agent%20registers%20a%20domain%20that%20turns%20out%20to%20be%20a%20trademark%20conflict%2C%20there%27s%20no%20human%20to%20respond%20to%20a%20UDRP%20complaint)（エージェント所有ドメインと法的責任の空白に関する論考）
- CircleID — [2026年のドメイン世界：AI、セキュリティ、市場の成熟、新gTLDの最前線](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)（エージェントをリセラーとして捉えた分析、2026年4月）
- modelcontextprotocol.io — [Model Context Protocol（MCP）とは？](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)（プロトコルの概要）
- llmstxt.org — [/llms.txtファイルの提案](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)（仕様と背景）
- Wikipedia — [Extensible Provisioning Protocol（Proposed Standard、2004年3月）](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt)（NamefiのMCPサーバー、REST API、ウォレット決済に関する資料）
