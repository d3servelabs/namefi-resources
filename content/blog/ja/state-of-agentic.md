---
title: "2026年のエージェント型ドメイン管理の現状"
date: '2026-07-10'
language: 'ja'
tags: ['ai-agents', 'domains', 'analysis']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
format: analysis
ogImage: ../../assets/state-of-agentic-og.jpg
description: "ドメイン登録がエージェント層へ移る流れを検証します。出典付きの年表、Namefiを含む提供済みと発表済みの差の検証、検証可能な2027年予測を扱います。"
keywords: ["エージェント型ドメイン管理の現状", "エージェント型ドメイン管理 2026", "AI ドメイン業界動向", "ドメイン業界 AI導入", "エージェント層 年表", "ドメインレジストラ 2027年予測", "MCP ドメイン登録 導入", ".ai ドメイン登録 2026", "Cloudflare Registrar API ベータ", "Name.com AIネイティブ API", "ドメインエージェント リセラー論", "Verisign ドメイン名業界報告", "DNS基盤 AIエージェント ID"]
relatedArticles:
  - /ja/blog/agents-buy-domains/
  - /ja/blog/cf-namecom-namefi/
  - /ja/blog/ai-domain-platforms/
  - /ja/blog/agent-native/
  - /ja/blog/ai-agent-register/
relatedTopics:
  - /ja/topics/domain-basics/
  - /ja/topics/web3-foundations/
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

2026年半ばとなり、「AIエージェントがドメインの登録方法を変える」という話を、予測ではなく実際の出来事と照らし合わせられるようになりました。一部は具体的で検証可能な日付に実際に起きました。一方で、いまだにベータ表示や位置づけを示す記事、あるいは標準化団体で審議待ちの草案にとどまるものもあります。この記事では両者を分けます。ドメイン登録を[エージェント層](/ja/blog/agents-buy-domains/)へ動かした出来事の出典付き年表、Namefiの不足点も含め、実際に提供されたものと発表だけのものを率直に点検した結果、業界記事で語られる「リセラーとしてのエージェント」という説、そして読者がこちらの解釈を必要とせず真偽を判定できる形で書いた2027年予測を扱います。

## 導入を示す数字と、その本当の出典

今年の「AIとドメイン」に関する記事で繰り返し引用される数字が二つありますが、信頼度は分けて考える必要があります。

一つ目は、Name.comが自ら主張する[「回答者の91%が、今後2年以内にAIエージェントがドメイン管理の少なくとも一部を担うと見込んでいる」](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years)という数字です。同社が**2025年7月10日**に公開したブログ記事に記載されています。Name.comは「最近実施した顧客調査」の結果としていますが、サンプル数、調査方法、独立した検証は公開していません。その性質どおりに扱うべきです。**Name.comの報告では**、Name.comが調査した自社の顧客がそう回答したということであり、独立した業界統計ではなく、企業が報告する意識調査です。

二つ目の数字は検証でき、独立した情報源でも裏付けられています。**2026年1月28日**、アンギラ政府は`.ai` [ccTLD](/ja/glossary/cctld/)の登録ドメイン数が100万件を超えたと発表し、[Domain Name Wireがこの節目を直接報じました](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/)。2025年初頭に約598,000件だった`.ai`ドメインは、およそ13か月後に100万件を超えました。2020年の約40,000件からこの水準へ達するまでには5年かかっています。CircleIDのドメイン業界記事も同じ節目を独立して引用し、Hogan Lovellsの`.ai`業界記事もこの推移を裏付けています。一社の自己申告だけではなく、複数の情報源で確認された数字です。

ドメイン市場全体と比較すると、Verisignの2026年第1四半期[Domain Name Industry Brief](https://www.dnib.com)は、すべてのTLDを合わせたドメイン名登録数を3億9,250万件と報告しています。前四半期比1.4%、前年同期比6.5%の増加です。[CircleIDによる同報告の紹介記事](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29)もこの数字を直接引用しています。約100万件の`.ai`登録は、3億9,250万件の中では小さいものの急成長する一部です。確かな勢いはありますが、まだ市場の構造を変えるほどの比率ではありません。DNIBもIdentity Digitalの公開資料も、エージェント経由の登録とブラウザー決済経由の登録の割合を公表していません。この記事では、その情報不足を踏まえて分析します。エージェント向け基盤が公開されたことと、おおよその時期は検証できますが、そこを通る登録件数はまだ検証できません。

## 年表：エージェント層への移行

以下の各日付は、出典のない数字を繰り返す二次的なまとめではなく、一次発表、公式ドキュメント、または直接取得した業界記事と照合しています。

| 日付 | 出来事 | 出典 |
| --- | --- | --- |
| 2004-03 | レジストラがレジストリとの通信に今も使用する機械間言語、[EPP](/ja/glossary/epp/)（Extensible Provisioning Protocol）がProposed Standardの段階に到達 | [2004年3月公開のRFC 3730–3734](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004) |
| 2024-09-03 | 推論時の言語モデルに向けてサイトが自らを説明する標準的な方法として、`/llms.txt`ファイルの提案が公開 | [Jeremy Howardが公開したllmstxt.org](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time) |
| 2024-11-25 | Anthropicが、AIアプリケーションを外部ツールサーバーへ接続するオープン標準[Model Context Protocol](https://modelcontextprotocol.io)を公開 | [AnthropicによるMCP発表](https://www.anthropic.com/news/model-context-protocol) |
| 2025-07-10 | Name.comが、MCPとOpenAPIを基盤とする「初のAIネイティブドメインプラットフォーム」という方針を示す記事を公開し、上記の自己申告による91%という数字を掲載 | [Name.comブログ](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI) |
| 2026-01-28 | アンギラ政府の発表によると、`.ai`の登録ドメイン数が100万件を突破 | [Domain Name Wire](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/) |
| 2026-04-15 | Cloudflareが「Agents Week」にRegistrar APIを公開ベータ版として提供し、登録、検索、価格確認をMCP層へ接続 | [CloudflareのRegistrar APIベータ版発表](https://blog.cloudflare.com/registrar-api-beta/)、[業界記事](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer) |
| 2026-04-20 | CircleIDが「ドメインリセラーとしてのエージェント」に関する分析を公開 | [CircleID、Simone Catania](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) |
| 2026-04-24 | Verisignの2026年第1四半期Domain Name Industry Briefが全体のドメイン登録数3億9,250万件を報告し、上記の数字に市場全体の文脈を提供 | [DNIB.com](https://www.dnib.com)、[CircleIDの記事](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29) |
| 2026-04-27 | `.ai`レジストリと[Name.com](https://www.name.com)の親会社Identity Digitalが「AIエージェント向けの中立的なDNS基盤のID標準」を発表し、エージェントに責任を負う所有者をDNSレコードへ記録する方法を提案 | [Identity Digitalニュースルーム](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-identity-standard-for-ai-agents.html) |
| 2026-06-04 | Identity DigitalのInnovation Labsが、この提案を「AIエージェント向けDNS基盤の永続的ID（DNSid）」というIETF Internet-Draftとして正式に提出 | [GlobeNewswire](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems)、[IETF datatracker草案](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

順に読むと、次の流れが見えます。20年前からあるプロビジョニングプロトコル、ドメイン専用ではない二つの汎用AIエージェント標準（llms.txt、MCP）、レジストラがそれらの標準を決済フローへ一つずつ後付けする動き、そして同じレジストリ系列（Identity Digital）が自社レジストラの範囲を越え、DNSをエージェントの*購入*だけでなく*ID*の基盤として提案する段階です。最後の段階は最も新しく、最も確定していません。Internet-Draftは議論のために提出された提案であり、承認済みの標準ではありません。

## 実際に提供済みのものと発表済みのもの

マーケティング文では「エージェントネイティブ」が広い意味で使われます。以下では、各プラットフォームの稼働中の公式ドキュメントと照合し、実際に提供済みの機能と、ベータ表示、位置づけにとどまる主張、実装のない標準化提案を区別します。

| プラットフォーム | 機能 | 状態 | 根拠 |
| --- | --- | --- | --- |
| Namefi | MCPサーバー（`api.namefi.io/mcp`、Streamable HTTP、`/.well-known/mcp/servers.json`で発見可能） | **提供済み** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | [x402](/ja/glossary/x402/)によるウォレット署名USDC決済（EIP-3009 `transferWithAuthorization`、アカウント不要） | **提供済み** | [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) |
| Namefi | エージェントツールとRESTリファレンスのための`llms.txt`ベースのディスカバリー | **提供済み** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | API層における支出上限または購入確認機能 | **未提供** — この執筆時点で文書化された制御機構はなく、安全策は現在、サーバーではなくMCPクライアント側にある | 独自の[エージェントネイティブ評価表の分析](/ja/blog/agent-native/)と、この記事のために`namefi.io/llms.txt`、`namefi.io/web3/llms.txt`を直接照合した結果 |
| Cloudflare | Registrar API：検索、利用可能性、価格確認、同期的な登録 | 2026-04-15以降、**提供済み、公開ベータ** | [Cloudflare Registrar APIベータ版発表](https://blog.cloudflare.com/registrar-api-beta/) |
| Cloudflare | 同じAPIによるDNSレコード管理、移管、更新、連絡先更新 | **発表済み、開発中** — Cloudflare自身の記事では「Registrarの中核機能をさらにカバーするため、API拡張に積極的に取り組んでいる」と述べ、2026年後半を目標としている | [Cloudflare Registrar APIベータ版発表](https://blog.cloudflare.com/registrar-api-beta/) |
| Name.com | AIネイティブ、MCPとOpenAPIという位置付け、自然言語から統合コードへつなげる構想 | **発表済み** — 機能を項目別に示す仕様ではなく、方針を示す記事 | [Name.comブログ](https://www.name.com/blog/the-first-ai-native-domain-platform) |
| Name.com | ドメインルートで直接確認した、発見可能な`llms.txt`または専用MCPサーバー | 調査時点で**確認できず** | `name.com`を直接確認し、[Cloudflare vs Name.com vs Namefi](/ja/blog/cf-namecom-namefi/)と照合 |
| Identity Digital | DNSid：AIエージェントに責任を負う所有者をDNSに基づき暗号学的に検証できるレコード | **提案段階** — 議論のために提出されたIETF Internet-Draftであり、承認済みの標準ではなく、稼働中のレジストラ決済にも統合されていない | [IETF datatracker：draft-ihsanullah-dnsid](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

この表から二つのことが分かります。一つ目は、Namefiを含め、確認したどのプラットフォームも、文書化されAPIで強制される支出上限を提供していないことです。すべての安全策は一つ上の層、つまり人間がクライアント側に設定する方針にあります。これは、[エージェントネイティブ評価表](/ja/blog/agent-native/)でこの分野を評価したときと同じ結論です。二つ目は、購入するドメインだけでなく、エージェント自体のIDの基点としてDNSを使う構想が、まだ「IETFでの議論のために提出済み」という段階にあることです。好意的に受け入れられても、レジストラが稼働中の決済へ組み込める状態になるまでには数か月かかります。

## リセラー論

2026年のドメイン業界記事で繰り返されるのは、AIエージェントが*リセラー*になりつつあるという表現です。CircleIDによる2026年4月20日の分析は、直接こう述べています。[「AIエージェントは、人間の介入なしに利用可能性を確認し、名前を登録し、DNSを設定するドメインリセラーとして、ますます活動している。」](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)

この言葉の選択と、それが示唆する内容は分けて考える必要があります。ドメイン業界の用語で[リセラー](/ja/glossary/reseller/)とは、具体的で正式な立場です。レジストラの[ICANN](/ja/glossary/icann/)認定契約の下でドメインを販売またはプロビジョニングし、レジストラに対して、さらにその関係を通じてICANNに対して契約上の義務を負う主体です。現在、エージェントが登録APIを呼び出すだけで、その関係が生じるわけではありません。エージェントは独自に認定された主体ではなく、最終顧客自身のAPIキーまたはウォレットで認証され、顧客の代理として行動します。CircleIDの表現は認定状況を主張するものではなく、行動を説明しています。ほかの誰かのために、検索、価格確認、登録、DNS設定を大量かつ反復して行うリセラーの*行動パターン*が、リセラー契約を締結した企業ではない運用者のエージェントワークフローにも現れているということです。

この行動が、レジストリが正式に認識する形へまとまるかは未解決の問題です。レジストリとレジストラは、方針で制限された大量のエージェント活動について、人間のリセラーとは異なる独自の認定区分、レート制限方針、不正利用監視区分が必要かを判断しなければなりません。上の年表にあるCloudflareのベータ版、Name.comの記事、Identity DigitalのDNSid草案のいずれも、まだその区分を提案していません。エージェントの行動に誰が責任を負うかを検証することが明確な目的なので、最も近いのはDNSidです。しかし、「誰が責任を負うか」と「リセラーとして正式に認定されているか」は別の問題で、この草案が答えるのは前者だけです。個別の購入手順は、[AIエージェントが人間なしでドメインを購入する方法](/ja/blog/agents-buy-domains/)をご覧ください。

## 2027年の予測

以下の項目はすべて公開情報で確認できる形にしています。雰囲気ではなく具体的な主張なので、2027年半ばに読み返した人が、こちらの解釈を必要とせず、真、偽、未解決のいずれかに分類できます。

1. **Cloudflare、Name.com、または同等の主要レジストラのうち少なくとも一社が、文書化されAPIで強制される支出上限または購入確認機能を公開します。** クライアント側の案内だけではなく、2027年7月までに提供されると予測します。この執筆時点では、確認したすべてのプラットフォームでこの項目が空欄であり、Namefiも例外ではありません。
2. **CloudflareのRegistrar APIは「ベータ」表示を外し、DNSレコード管理、更新の自動化、移管対応のうち少なくとも一つを2027年末までに提供します。** 自社のベータ版発表にある「2026年後半」という記載に、1年の余裕を加えた予測です。
3. **DNSid Internet-Draft、または「このエージェントに誰が責任を負うか」を直接扱う後継草案は、2027年7月時点でも承認済みRFCではなく、IETF草案のままです。** 標準化文書は通常、提出後に数年かかり、この文書は2026年6月に提出されました。
4. **`.ai`の登録数は2027年7月までに150万件を超えます。** 2026年1月に突破した100万件付近で横ばいにならず、Domain Name WireとIdentity Digitalが記録した成長曲線が続くという予測です。
5. **ここで比較したプラットフォームのうち少なくとも一つが、エージェントによる登録活動について、自社のマーケティングまたはドキュメントで「リセラー」または「エージェントリセラー」という言葉を公に使用します。** CircleIDが2026年4月に用いた枠組みを業界記事だけにとどめず、正式に採用するという予測です。

## よくある質問

### 現在、AIエージェントは実際に何件のドメインを登録していますか？

確認したどのレジストリやレジストラも、DNIB、Identity Digital、Cloudflare、Name.comを含め、エージェント起点の登録と人間起点の登録を分けた数字を公開していません。検証できるのは基盤です。どのプラットフォームが、エージェントから呼び出せる登録経路をいつ提供したかは確認できます。Namefi、公開ベータ版のCloudflare、方針を示したName.comです。この執筆時点で、エージェント経由の登録件数は公開データではありません。

### Name.comの91%という統計は、信頼できる業界全体の数字ですか？

独立した調査ではなく、企業が報告する意識調査として扱うべきです。Name.comの2025年7月の記事は、この数字を「最近実施した顧客調査」によるものとしていますが、調査方法、サンプル数、外部監査者を公開していません。市場全体の統計として引用できる数字ではなく、Name.comの顧客が同社に伝えた意識を示すものです。

### `.ai`は本当に100万件へ達したのですか？誰が確認しましたか？

はい。独立した情報源で裏付けられています。`.ai` [ccTLD](/ja/glossary/cctld/)を管理するアンギラ政府が節目を直接発表し、Domain Name Wireは具体的な日付（2026年1月28日）と成長数値を報じました。CircleIDとHogan Lovellsの業界記事も、同じ節目をそれぞれ独立して引用しています。一社の自己申告による統計とは異なる水準の証拠です。

### DNSidとは何ですか？ドメインの登録方法を変えますか？

DNSidは、承認済みの標準ではなく正式な提案であるInternet-Draftです。Identity DigitalのInnovation Labsが2026年6月にIETFへ提出しました。DNSレコードを、「このAIエージェントに誰が責任を負うか」を永続的かつ検証可能に記録する仕組みとして提案しています。登録自体とは異なる問題であり、ドメインを購入するのではなくエージェントを識別するものです。この執筆時点で、稼働中のレジストラ決済には統合されていません。

### 支出上限や「エージェントの過剰支出を防ぐ」制御を実際に提供したレジストラはありますか？

各プラットフォームのドキュメントを直接確認した限り、API層にはありません。Namefi、Cloudflare、Name.comはいずれも、レジストラ自身が強制する確認手順ではなく、MCPクライアント、エージェントフレームワーク、APIキーに割り当てる資金の上限など、人間がクライアント側に設定する方針へ安全策を委ねています。この領域のすべての「エージェントネイティブ」評価表で、私たちのものも含め、まだ未完了とされる項目です。

### 業界全体の状況ではなく、一件のエージェント購入の仕組みはどこで読めますか？

[AIエージェントが人間なしでドメインを購入する方法](/ja/blog/agents-buy-domains/)では、検索、価格確認、認証、登録、設定という流れを段階ごとに説明します。[Cloudflare vs Name.com vs Namefi](/ja/blog/cf-namecom-namefi/)では三つのプラットフォームを機能別に比較し、[エージェントネイティブなドメインレジストラとは？](/ja/blog/agent-native/)では、この記事の提供済みと発表済みの表で使った評価項目を示します。

## 必要な一式をすでに提供する環境で、エージェントから登録する

この記事で説明した不足点の大半、つまり文書化されていない支出上限、ベータ表示、項目別仕様のない方針記事は、一つのプラットフォームだけの問題ではありません。2026年半ばにおける、この分野全体の現状です。[Namefi](https://namefi.io)では、現時点で提供済みと確認できる機能が実際に利用できます。エージェントが直接接続できるMCPサーバー、`llms.txt`で発見できるREST API、アカウントなしでUSDCを支払うウォレット署名[x402](/ja/glossary/x402/)決済、そしてドメインをエージェントのウォレットに置きたい場合の[トークン化](/ja/glossary/tokenized-domain/)所有権です。

**[Namefiでドメインを検索して登録する](https://namefi.io)。**

## 出典と参考資料

- Domain Name Wire — [.AI名前空間のドメイン名が100万件を突破（2026年1月28日）](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/)
- CircleID — [2026年のドメイン世界：AI、セキュリティ、市場の成熟、新gTLDのフロンティア（2026年4月20日）](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- CircleID — [DNIB、2026年第1四半期のドメイン名登録数を3億9,250万件と報告](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29)
- Verisign / DNIB.com — [ドメイン名業界報告](https://www.dnib.com)
- Cloudflare — [Registrar APIベータ版発表（2026年4月15日）](https://blog.cloudflare.com/registrar-api-beta/)
- webhosting.today — [AIエージェントが人間なしでドメインを登録可能に](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer)
- Name.com — [初のAIネイティブドメインプラットフォーム（2025年7月10日）](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years)
- Identity Digital — [Identity Digital、AIエージェント向けの中立的なDNS基盤ID標準を発表（2026年4月27日）](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-identity-standard-for-ai-agents.html)
- Identity Digital / GlobeNewswire — [Identity DigitalのInnovation Labs、AIエージェント向けDNS基盤の永続的ID提案をIETFへ提出（2026年6月4日）](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems)
- IETF Datatracker — [draft-ihsanullah-dnsid：AIエージェント向けDNS基盤の永続的ID](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/)
- llmstxt.org — [/llms.txtファイルの提案（2024年9月3日公開）](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- Anthropic — [Model Context Protocolの紹介（2024年11月25日）](https://www.anthropic.com/news/model-context-protocol)
- Wikipedia — [Extensible Provisioning Protocol（Proposed Standard、2004年3月）](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- Namefi — [namefi.io/llms.txt（MCPサーバーとREST APIのリファレンス）](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt（x402ウォレット署名決済のリファレンス）](https://namefi.io/web3/llms.txt)
