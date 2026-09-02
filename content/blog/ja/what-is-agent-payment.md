---
title: "エージェント決済とは何か、そしてなぜ誰もがこぞって提供しようとしているのか？"
date: '2026-08-13'
language: 'ja'
tags: ['ai-agents', 'payments', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
format: explainer
ogImage: ../../assets/what-is-agent-payment-og.jpg
description: "エージェント決済は、範囲が限定され取り消し可能な権限でAIエージェントに支出させる仕組みです。StripeのLinkのエージェント向けウォレット、Mercuryのエージェントカード、そして2025〜26年の駆け込みの内側を解説します。"
keywords: ["エージェント決済とは", "エージェント決済の仕組み", "エージェンティックコマース", "Stripe Linkのエージェント向けウォレット", "Stripeのエージェント向けIssuing", "Mercuryのエージェントカード", "Mercuryの支出管理", "Agentic Commerce Protocol", "Google AP2プロトコル", "Mastercard Agent Pay", "Visa Intelligent Commerce", "AIエージェント向け使い切りカード", "共有決済トークン", "AIエージェントの支出上限", "x402 エージェント決済"]
relatedArticles:
  - /ja/blog/wallet-checkout/
  - /ja/blog/agents-buy-domains/
  - /ja/blog/state-of-agentic/
  - /ja/blog/agent-native/
  - /ja/blog/ai-agent-register/
relatedTopics:
  - /ja/topics/web3-foundations/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/blockchain-concepts/
  - /ja/series/domain-apocalypse/
relatedGlossary:
  - /ja/glossary/ai-agent/
  - /ja/glossary/x402/
  - /ja/glossary/stablecoin/
  - /ja/glossary/wallet/
  - /ja/glossary/tokenized-domain/
---

わずか16か月の間に、二大カードネットワークとGoogle、OpenAI、Stripeが、同じことのためのインフラを発表または実装してきました。[AIエージェント](/ja/glossary/ai-agent/)にお金を使わせることです。Mastercardは2025年4月29日に[Agent Payを発表](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens)しました。Visaはその翌日、[Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=browse%2C%20select%2C%20purchase%20and%20manage%20on%20their%20behalf)を発表しました。Googleは2025年9月、60を超えるパートナー企業とともに[Agent Payments Protocol（AP2）](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption)を公開しました。同じ月、OpenAIは[ChatGPT内でInstant Checkoutを有効化](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe)しました。そして2026年4月、Stripeは[Linkのエージェント向けウォレット](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)を立ち上げました。エージェントが一度の購入ごとに借りられる、消費者向けウォレットです。企業向けバンキングプラットフォームのMercuryでさえ、今では「チームと**エージェント**のためのカード」という[支出管理の売り文句](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents)を前面に打ち出しています。

本稿では、「エージェント決済」とは実際に何なのかを説明し、二つの示唆に富む実装——Stripeの消費者向けウォレットとMercuryの企業向けエージェントカード——を見た上で、なぜこれほど多くの企業がほぼ同時に、この波に乗り遅れられないと判断したのかを考えます。

## 「エージェント決済」とは実際に何を意味するのか

エージェント決済とは、ソフトウェアエージェントが個人や企業に代わってお金を使えるようにするインフラです。生のカード番号をエージェントに渡すという乱暴な手段の代わりに、その権限は**範囲が限定され**（この金額まで、この加盟店で、この目的のために）、**証明可能**（加盟店は、エージェントが実際に許可されていたことを確認できる）、そして**取り消し可能**（所有者はいつでも権限を止められる）です。

最後の「取り消し可能」という一節こそが本質です。Visaのカード番号をボットの設定ファイルに貼り付けることを、これまで誰も止めてきませんでした。ほとんどの人がそうしないのは、カード番号が範囲の限定されない権限だからです。それを保持する者は誰でも、あなたが気付いてカードを解約するまで、どこでも何にでも請求できます。GoogleのAP2発表は、根底にある問題を率直に述べています。現在の決済システムは概して[人間が信頼できる画面上で直接「購入」をクリックすることを前提としており](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=assume%20a%20human%20is%20directly%20clicking)、自律的なエージェントが支払いを開始することは、[この根本的な前提を打ち破ります](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption)。AP2は、このギャップを、あらゆるエージェント取引が答えなければならない三つの問いとして整理しています。**認可**（ユーザーはこの購入についてエージェントに権限を与えたか）、**真正性**（エージェントのリクエストはユーザーの実際の意図を反映しているか）、**説明責任**（何か問題が起きたとき、誰が損失を負うのか）です。

この分野のあらゆる製品——カードネットワークのトークンプログラム、オープンプロトコル、ウォレット、エージェントカード——は、エージェントにお金を使わせることが当たり前の、退屈なことになる程度まで、この三つの問いに十分に答えようとする試みです。

## Stripe：エージェントが一度の購入ごとに借りられるウォレット

[2026年4月29日に発表された](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching)Stripeの参入は、新しい**Issuing for agents**レイヤーの上に構築された**Linkのエージェント向けウォレット**です。Linkは、Stripeの消費者向けウォレット——「情報を保存してすばやくチェックアウトする」ための製品——であり、Stripeが公表する顧客基盤は[2億人を超える消費者](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers)です。エージェントのフローは次のように動きます。

1. 消費者は、標準的なOAuthフローを通じてエージェントにLinkウォレットへのアクセスを許可します。これは、あらゆるサードパーティアプリを接続する際に使われるのと同じ同意パターンです。
2. エージェントが何かを購入したいとき、加盟店名、URL、金額、そして何をなぜ購入するのかを人間が読める形で説明した文脈を含む**支出リクエスト**を作成します。
3. 消費者は、ウェブまたはLinkのモバイルアプリでリクエストを確認し、承認します。現時点では、[いずれの認証情報も共有される前に、本人によるリクエストごとの確認が必要](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=each%20request%20requires%20the%20person%E2%80%99s%20review)です。Stripeによれば、支出上限や事前承認による自律性は今後計画されています。
4. 承認されると、エージェントは**使い切りカード**または**Shared Payment Token（SPT）**のいずれかを受け取ります。[金額、通貨、加盟店といった制御によって範囲を限定できる](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=scoped%20with%20controls%20like%20amount%2C%20currency%2C%20and%20merchant)認証情報です。Stripeいわく、[「エージェントが生の支払い認証情報にアクセスすることは決してありません」](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)。

この設計は、カード情報保存型モデルを反転させているという点で、じっくり読む価値があります。保存済みカードは、加盟店（またはエージェント）が何度でも引き出せる継続的な権限であり、認証情報そのものではなく事後に強制される契約によって制限されています。それに対して支出リクエストは、購入の瞬間に作成され、その購入だけに限定され、その後は無効になる、一回限りの権限付与です。Stripeはまた、その下層にあるレイヤー——Issuing for agents——も公開しており、企業は自前のエージェント向けウォレットを構築できます。使い切りの仮想カード、資金の保管、カード単位の権限設定、取引モニタリング、そして認可時点での不正対策などです。

## Mercury：法人カードとエージェントの出会い

Stripeのウォレットが答えるのは、消費者側の問い——「買い物エージェントに自分のお金で買い物をさせるにはどうすればよいか」——です。Mercuryの[支出管理](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents)が答えるのは、その企業版であり、その答えは示唆に富んでいます。エージェントを従業員のように扱う、というものです。

Mercuryはこの製品を、[「インテリジェントな予算、従業員への払い戻し、そしてチームとエージェントのためのカードを備えた、自己執行型の経費管理」](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents)と説明しています。その仕組みは、[特定の目的に範囲を限定した予算とガードレール](https://mercury.com/spend-management#:~:text=Set%20up%20budgets%20and%20guardrails%20to%20unblock%20your%20team%20and%20agents)、カテゴリ別の上限、リアルタイムの追跡、自己執行するポリシーというおなじみの支出管理ツール一式を、人間以外の支出者にも拡張したものです。企業は、[承認済みの取引ごとに専用のエージェントカードを発行](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions)でき、それぞれに独自の上限を設定できます。

同ページでは実演もされています。エージェントが「Janeのエージェントカード」でチェックアウトフォームに入力し、100ドルの広告を注文したうえで、そのカードには月1,000ドルの支出上限があること、そしてカード情報はそのチェックアウトのためだけに使われ、保存はされなかったことを報告する、という内容です。Mercury Spendは、[Mercuryの法人向けバンキング顧客全員に含まれており](https://mercury.com/spend-management#:~:text=included%20for%20all%20Mercury%20business%20banking%20customers)、他行を利用するチーム向けにスタンドアロン版も計画されています。

この機能一覧よりも、その捉え方のほうが重要です。企業にとって、お金を使うエージェントは目新しい決済上の難題ではなく、単なる**人員**です。財務システムに新しく加わった社員とまったく同じように、カード、予算、目的、月間上限、監査証跡が与えられます。Stripeが消費者のための同意ループを構築したのに対し、Mercuryはソフトウェアのための組織図上の枠を構築したのです。

## 発表が相次いだ16か月

時系列を一か所にまとめると、この駆け込みぶりは見紛いようがありません。

| 日付 | 企業 | 発表内容 |
|---|---|---|
| 2025年4月29日 | Mastercard | [Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens)：Agentic Tokens。取引するにはエージェントを[登録・検証](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=trusted%20AI%20agents%20to%20be%20registered%20and%20verified)する必要がある |
| 2025年4月30日 | Visa | [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users)：トークン化された認証情報を通じてVisaのネットワークをAIエージェントに開放 |
| 2025年9月16日 | Google | [Agent Payments Protocol（AP2）](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption)：AmexからCoinbase、PayPalまで60社を超えるパートナーによるオープンプロトコル |
| 2025年9月29日 | OpenAI + Stripe | [ChatGPTにおけるInstant Checkout](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe)。オープンソース化されたAgentic Commerce Protocol（ACP）を採用 |
| 2026年1月15日 | Google | [Universal Commerce Protocol（UCP）](/ja/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/)：AP2と併用できるよう設計された、オープンなコマース相互運用標準 |
| 2026年4月29日 | Stripe | [Linkのエージェント向けウォレット＋Issuing for agents](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching)：エージェントの支出のための消費者向けウォレットアクセスと発行のプリミティブ |
| 2026年 | Mercury | [エージェントカードを備えた支出管理](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions)：エージェント向けの予算、ガードレール、専用カード |

なぜこの殺到が起きたのでしょうか。三つの力が働いています。ただし、ここから先は発表そのものが明言している内容ではなく、あくまで解釈です。

**買い手が移動しており、ウォレットもその移動先についていきたがっている。** OpenAIは、[毎週7億人を超える人々がChatGPTを利用している](https://openai.com/index/buy-it-in-chatgpt/#:~:text=More%20than%20700%20million%20people%20turn%20to%20ChatGPT%20each%20week)としており、今ではチャット内で購入も処理しています。発見からチェックアウトまでがすべてエージェントとの会話の中で完結するなら、そのエージェントにウォレットを供給する者は、あらゆる加盟店とあらゆる顧客の間に座ることになります。Stripeが開発者に向けて示す売り込みは、その賞品について明言しています。Linkの上に構築すれば、[2億人の消費者基盤](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers)に届く、というものです。決済企業はこの二十年、検索やソーシャルがコマースを仲介するのを見てきました。エージェントがそれを行うのを、今度は誰も傍観席から見ているつもりはありません。

**範囲の限定されない認証情報は、自動化との接触に耐えられない。** 目的に合わせて作られたレールがなければ、人々はエージェントに保存済みカードや共有ログイン情報を渡すことになります。範囲の限定されない継続的な権限であり、まさに不正検知システムが捕まえるために存在するパターンです。Visaのプロダクト責任者は、この要件を、ユーザーを超えて広がる信頼の問題として位置付けました。エージェントは、[「ユーザーだけでなく、銀行や販売者からも決済において信頼される必要がある」](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users)としています。認可されたエージェントとカードテスト用のボットを見分けられるネットワークは、より多くの正当な取引を承認し、より多くの不正な取引を拒否できます。見分けられないネットワークは、そのどちらも下手にしかできません。

**プロトコルは陣取り合戦だ。** ACP、AP2、Mastercardの Agentic Tokens、Visaのトークン化認証情報は、いずれも機械による購入のデフォルトの文法になることを目指しています。オープンスタンダードは、採用しやすいことによってこの競争に勝つ傾向があります。だからこそOpenAIは[ACPをオープンソース化](https://openai.com/index/buy-it-in-chatgpt/#:~:text=Agentic%20Commerce%20Protocol%2C%20so%20that%20more%20merchants%20and%20developers%20can%20begin%20building)し、GoogleはAP2のために60社のローンチパートナーを集め、そのうえで2026年1月には、支払いを取り巻く購買ワークフローを標準化するため、[Universal Commerce Protocol](/ja/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/)を追加で発表しました。誰も、負けた標準を二度実装したくはありません。

## 一つの設計パターン、多数のロゴ

ブランディングを取り払えば、まともなエージェント決済製品はすべて、同じ四つの特性に収斂します。

1. **生の認証情報を絶対に晒さない。** 使い切りカード（Stripe）、Shared Payment Token（Stripe/ACP）、Agentic Tokens（Mastercard）、トークン化認証情報（Visa）。エージェントが持つのは、あなたのPANではなく、目的に特化した手段です。
2. **権限の範囲を限定する。** 金額、通貨、加盟店、時間の制限を、認証情報そのものに組み込みます。OpenAIの場合、[暗号化された決済トークンは「特定の金額と特定の加盟店に対してのみ認可される」](https://openai.com/index/buy-it-in-chatgpt/#:~:text=encrypted%20payment%20tokens%20are%20only%20authorized%20for%20specific%20amounts%20and%20specific%20merchants)としています。
3. **承認ループに人間を残す——少なくとも今のところは。** Stripeは現在、リクエストごとの確認を要求しています。Mercuryの予算は、人間が設定した上限内での支出をあらかじめ承認します。自律性のダイヤルは動いていきますが、今はほぼゼロの位置から始まっています。
4. **エージェントの支出を可視化する。** 登録済みエージェント（Mastercard）、支出リクエストの文脈文字列（Stripe）、リアルタイム追跡と「レシートがなければカードをロックする」という強制（Mercury）。すべての取引は、「どのエージェントが、誰の権限で、何のために」に答えられなければなりません。

これらの特性が、暗号資産に慣れた読者にとってどこか見覚えがあるとすれば、それは正しい直感です。[x402](/ja/glossary/x402/)の厳密決済方式のもとで署名によって認可される[ステーブルコイン](/ja/glossary/stablecoin/)送金——正確な金額を、正確な受取人へ、限られた時間枠内でのみ有効に、購入の瞬間に支払い者自身の[ウォレット](/ja/glossary/wallet/)が署名する——は、逆方向からたどり着いた同じ設計です。違いは、範囲の限定を発行者のポリシーエンジンではなく暗号技術によって強制している点だけです。Stripe自身も、エージェント向けウォレットの今後の支払い方法としてステーブルコインを挙げています。カードの世界と暗号資産の世界は、同じ答えに収斂しつつあります。*保存された権限ではなく、取引ごとの権限だ*、という答えです。

## ドメインはどこに位置づけられるのか

ドメインは、エージェントが自力で最初に購入するものの一つになりつつあります。純粋なAPIオブジェクトであり、配送先住所は不要で、デプロイされたエージェント製品はいずれ、自分が管理する名前を必要とするからです。私たちはこれまで、[人間なしでAIエージェントがドメインを購入する方法](/ja/blog/agents-buy-domains/)、[エージェントネイティブなドメインレジストラとは？](/ja/blog/agent-native/)、そして[NamefiでAIエージェントを使ってドメインを登録する方法](/ja/blog/ai-agent-register/)の手順について書いてきました。

Namefi自身のこの支払い問題への答えは、[暗号資産ウォレットでドメイン料金を支払う：アカウント不要](/ja/blog/wallet-checkout/)で詳しく取り上げている、ウォレット署名によるチェックアウトです。エージェントのウォレットは、一つの正確な登録に対して一つの正確な価格でUSDC送金の認可に署名することで、x402のチャレンジに応答します。アカウントはなく、どこにも保存された認証情報はありません。そして、支払いに使ったのと同じウォレットへ、ドメインを[トークン化された資産](/ja/glossary/tokenized-domain/)として受け取ります。これはまさに、本稿がここまで説明してきた意味でのエージェント決済であり、エージェントが最も確実に購入する必要があるものについて、実際の製品ですでに稼働しています。

結局のところ、エージェント決済を提供しようとするこの駆け込みは、信頼されるための駆け込みです。2億人を超えるLinkの消費者、毎週7億人を超えるChatGPTの利用者、そしてあらゆる法人カードプログラムが、同じ賭けに収斂しています。次の10億人の買い手は、すべてが人間とは限らない。そして、そのソフトウェアに安全で、範囲が限定され、説明責任を果たせる支出権限を与えるインフラは、前の時代の商取引にとってのカードネットワークと同じくらい基盤的なものになる——という賭けです。

## 出典と参考資料

- Stripe — [エージェントに支払う力を与える](https://stripe.com/blog/giving-agents-the-ability-to-pay)（Linkのエージェント向けウォレット＋Issuing for agents、2026年4月29日）
- Mercury — [支出管理（Spend Management）](https://mercury.com/spend-management)（予算、ガードレール、専用のエージェントカード）
- Google Cloud — [Agent Payments Protocol（AP2）の発表](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)（2025年9月16日）
- OpenAI — [ChatGPTで購入する：Instant CheckoutとAgentic Commerce Protocol](https://openai.com/index/buy-it-in-chatgpt/)（2025年9月29日）
- Mastercard — [MastercardがAgent Payを発表](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html)（2025年4月29日）
- Visa — [AIで見つけて買う：Visaがコマースの新時代を発表](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html)（Visa Intelligent Commerce、2025年4月30日）
- Namefi — [暗号資産ウォレットでドメイン料金を支払う：アカウント不要](/ja/blog/wallet-checkout/)（x402ウォレット署名によるチェックアウト）
