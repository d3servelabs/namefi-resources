---
title: 'Curve FinanceのDNSハイジャック：「監査済みスマートコントラクト」が玄関口を守れなかった理由'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 9
format: case-study
description: '2022年8月、Curve Financeのスマートコントラクトは無傷だった。しかし攻撃者はcurve.fiドメインをレジストラレベルで乗っ取り、サイトを複製し、ウォレットドレイナーで約57万ドルをユーザーから奪い取った。DeFiフロントエンドへのDNS攻撃の詳細と、ドメインセキュリティが教える教訓を深掘りする。'
keywords: ['curve finance DNSハイジャック', 'curve.fi 乗っ取り', 'DNS ハイジャック DeFi', 'iwantmyname 侵害', 'ネームサーバー侵害', 'ウォレットドレイナー', 'DeFiフロントエンド攻撃', 'ドメインセキュリティ', 'DNSセキュリティ', '仮想通貨フィッシング', 'クローンサイト攻撃', 'レジストラアカウント侵害', 'ドメインメーデー']
relatedArticles:
  - /ja/blog/the-badgerdao-frontend-attack/
  - /ja/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ja/blog/the-bitcoin-org-dns-hijack/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/the-lenovo-com-dns-hijack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/dns/
  - /ja/glossary/icann/
  - /ja/glossary/web3/
  - /ja/glossary/tld/
---

スマートコントラクトは無傷だった。

これが、2022年8月9日にCurve Financeに起きた出来事を理解するうえで、まず把握すべき事実だ。そしてセキュリティエンジニアたちが何年たっても腑に落ちない部分でもある。Curveの[オンチェーン](/ja/glossary/on-chain/)コード——監査を経て実戦テスト済みの、数十億ドルものステーブルコインを預かる自動マーケットメーカー——には一切手が触れられていない。リエントランシーのバグもなく、オラクル操作もなく、フラッシュローンを使ったエクスプロイトも存在しない。[ブロックチェーン](/ja/glossary/blockchain/)は設計どおりに機能し続けた。

それでもユーザーはおよそ**57万ドル**を失った。

攻撃はコントラクトを経由しなかった。**ドメイン**を経由したのだ。攻撃者は`curve.fi`を[レジストラ](/ja/glossary/registrar/)レベルで掌握し、[ウォレット](/ja/glossary/wallet/)ドレイナーに繋がる複製サイトへ誘導した。あとはプロトコルそのものの信頼が仕事を引き受けた。Curveがこれまで通過してきたセキュリティ監査はすべて無意味だった。攻撃者はその扉を叩きすらしなかった。誰もが何も考えずに入力するウェブアドレス——その正面玄関から堂々と侵入したのだ。

これは*Domain Mayday* エピソード13だ。システムの中で最も安全な部分が完璧に保たれていても、誰もが**確認せずに信頼する**部分——ドメイン名——が静かに攻撃の入口になり得るという物語である。

## 「監査済みコントラクト」は玄関を守れない

[DeFi](/ja/glossary/defi/)はコントラクトセキュリティの文化を長年かけて築き上げてきた。監査は当然の前提条件となり、バグバウンティは数百万ドル規模に成長した。「Etherscanで検証済み」は信頼のシグナルになった。そして集合的な思考モデルは次のような形に固まった：*コントラクトが安全なら、プロトコルは安全だ。*

しかしユーザーがコントラクトと直接やりとりする機会はほとんどない。彼らはウェブサイトにアクセスする。`curve.fi`と入力し、ブラウザがその名前を[IPアドレス](/ja/glossary/ip-address/)に解決し、ページを読み込み、そのページがウォレットに署名内容を指示する。監査されたSolidityコードが一行でも実行される*前に*、これらのステップがすべて済んでいる。そしてそのすべてが、監査の対象になったことのないインフラの上に成り立っている。

ドメイン名はそのチェーンの最初のリンクだ。同時に、ほとんどのチームが「一度設定したら放置」として扱うリンクでもある。一度登録してDNSを向けたら、以降は考えない。インシデント後のある解説が述べたように、この種の攻撃は["プロトコルのブロックチェーンを突破するのではなく、ユーザーと分散型アプリのインターフェース間にある信頼レイヤーを悪用する"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)ものだ。コントラクトが完璧であっても、攻撃者が`curve.fi`の*向き先*を制御してしまえば、何もかもが無意味になる。

## 2022年8月9日：ハイジャック

![訪問者を隠し扉付きの偽店舗へ誘い込むために看板を架け替えられる店舗のコンセプトアート——温色と寒色のトーン、シュールなセキュリティメタファー、ブランドロゴなし](../../assets/the-curve-finance-dns-hijack-01-hijack.jpg)

2022年8月9日の午後、CurveのメインフロントエンドはもはやCurveのものではなくなった。

CertiKのインシデント後の分析はタイムラインを正確に特定した：["2022年8月9日午後4時20分（EST）頃、Curve FinanceのDNSレコードが侵害され、複製された悪意あるサイトへ向けられた。"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)  `curve.fi`を訪れるユーザーの目には、何もおかしいところはなかった。ページは表示され、ロゴもあった。プール、インターフェース、配色——すべてが忠実に再現されていた。

違いは不可視かつ絶対的なものだった。ユーザーのブラウザに表示されているサイトは、もはやCurveが提供するものではなかった。攻撃者のインフラ上に展開されたクローンであり、誰かがウォレットを接続するのをただ待っていた。

セキュリティ研究者のLefteris Karapetsasはその仕組みを率直に述べた——攻撃者たちは["サイトを複製し、クローンサイトがデプロイされた自分たちのIPアドレスへDNSを向け、悪意あるコントラクトへの承認リクエストを追加した。"](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)  Cointelegraphの後の解説も同じパターンを説明している：["攻撃者はCurve Financeのウェブサイトをクローンし、DNSの設定を操作してユーザーをそのコピーサイトへ誘導した。"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

そして彼らは待った。

## ユーザーが失ったもの

ユーザーがクローンサイトにアクセスしてそれを使おうとすると、ページはウォレットに対して、正規のDeFiサイトで一日に何千回と行われている操作を要求した：トークンの承認だ。CertiKによれば、["攻撃者はそのサイトに悪意あるコードを注入し、ユーザーが未検証のコントラクトにトークン承認を付与するよう仕向けた。"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)  Coingapeはその罠をより平易な言葉で説明している：["ハッカーはホームページに悪意あるコントラクトをデプロイすることに成功し、被害者がそれを承認するとユーザーウォレットが完全に空にされた。"](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)

トークンの承認枠を許可することは、日常的な操作に見える。正規の取引所でスワップするときと同じクリックだ。しかしここで承認されるコントラクトは攻撃者のものであり、一度承認されると被害者のステーブルコインを自由に移動できる。

オンチェーンの会計は具体的だった。CertiKは["合計7人のユーザーがエクスプロイトの影響を受け、損失は約61万2,000ドルに上った"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)と報告し、その内訳を["USDCとDAIで612,724.16ドル"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)とし、ハッカーはそれをETHに換えたと述べた。rekt.newsは広く引用されるより丸い数字を出した：["盗まれた資金（合計340 ETH、約57万5,000ドル）。"](https://rekt.news/curve-finance-rekt)  同時期の報道の多くも同じ範囲に収まっており、Cryptopotatoはハッカーが[約57万ドル相当のETHを盗んだ](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)と報じ、CryptoDailyは[57万3,000ドル超を盗んだ](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)と記している。スナップショットのタイミングやETH価格によって正確な総額は多少ぶれるが、大きな絵は変わらない：一握りのユーザーから、彼らが信頼していたサイトそっくりのサイトによって、低～中程度の6桁の金額が奪われた。

そしてここに、立ち止まって考えるべき事実がある。Tronweeklyはそれを端的にまとめた：この攻撃は["Curveのイーサリアムスマートコントラクトにも、そこに預けられた57億ドルの資産にも一切手を触れていない。"](https://www.tronweekly.com/curve-finance-dns-hijacking/)  57億ドルのプロトコル資産は完全に安全だった。同記事が指摘するように、Curve自身は["無傷であり、いかなる損失も被っていない。"](https://www.tronweekly.com/curve-finance-dns-hijacking/)  プロトコルは守られた。ユーザーは負けた。なぜなら攻撃は最初からプロトコルを狙っていなかったからだ。

## いかにして起きたか：チェーンではなくドメイン

![電話交換手が光るケーブルを密かに同一外観の偽の建物へ迂回させているコンセプトアート——ネオンのケーブルと回路、シュールなDNS迂回メタファー、ブランドロゴなし](../../assets/the-curve-finance-dns-hijack-02-dns-compromise.jpg)

では、攻撃者はどうやって`curve.fi`をCurveのサーバーではなく*自分たちの*サーバーに解決させたのか？

まずDNSが何をするかを確認しよう。`curve.fi`のようなドメイン名は人間にわかりやすいラベルだ。コンピュータはIPアドレスを必要とする。[ドメインネームシステム](/ja/glossary/dns/)はその一方を他方に変換するルックアップ層だ。Cointelegraphの解説はそれを["電話帳"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)に例え、["ユーザーフレンドリーなドメイン名を、コンピュータが接続に必要なIPアドレスへ変換する"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)と説明している。[DNSハイジャック](/ja/glossary/dns-hijacking/)とは、そのルックアップを改ざんして電話帳に間違った番号を載せることだ——["DNSクエリの解決方法を変え、ユーザーの気づかないうちに悪意あるサイトへ誘導する。"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

重要なのは、そのためにユーザーのコンピュータを侵害する必要はないという点だ。権威ある回答の発信源——ドメインが委任している**[ネームサーバー](/ja/glossary/nameserver/)**——を変えればよい。そしてその発信源は、ドメインのレジストラのところにある。

Curveの創設者Michael Egorovは、障害がどこに存在したかをはっきり述べた。rekt.newsが引用したように、["DNSレジストラのiwantmynameがネームサーバーを侵害された"](https://rekt.news/curve-finance-rekt)とし、チームの見解では["Curveは、アカウントレベルの脆弱性ではなく、基盤となるネームサーバーが侵害されたと考えている"](https://rekt.news/curve-finance-rekt)とのことだった。つまりこれは（Curveが知る限り）Curve自身のレジストラアカウントのパスワードが盗まれたというケースではなかった。問題はもう一層深い場所——レジストラ自身が運営するネームサーバーインフラにあった。Cointelegraphの解説も後にレジストラ名を明示し、そのプロジェクトが["以前の攻撃の時点でも同じレジストラ『iwantmyname』を使っていた"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)と記している。

この区別は教訓として非常に重要だ。チームが強力なパスワードを設定し、二要素認証を有効にし、自分たちのレジストラアカウントを完璧に保護していても——その下のネームサーバーが侵害されれば*それでもドメインを失う*。ドメインオーナーが必ずしもミスを犯したわけではない。彼らが信頼した下位の層が単純に破られたのだ。Cointelegraphがこれらの攻撃の仕組みを説明した言葉は、リスクをうまく一般化している：["盗まれた資格情報やレジストラの脆弱性によってサイトのマッピングが変わると、ユーザーは気づかないうちに有害なサーバーへ誘導される可能性がある。"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

ネームサーバーが攻撃者のIPアドレスを返し始めると、あとは自動だった。`curve.fi`と入力するすべてのユーザーが、静かにクローンへと手渡された。電話帳は書き換えられていたが、電話帳を確認する人はほとんどいない。

## 対応とその後

Curveのチームは素早く動いた。その対応は、彼らに*できたこと*と*できなかったこと*が明確に対比されている点で参考になる。

*即座にできたこと*は警告を出すことだった。チームはユーザーに率直に伝えた：["承認やスワップは行わないでください。原因を特定しようとしていますが、あなたの安全のために、今はcurve.fiもcurve.exchangeも使用しないでください。"](https://www.tronweekly.com/curve-finance-dns-hijacking/)  さらに、まだ汚染されていないフォールバックも案内した：["curve.fiのDNS伝播が正常に戻るまでは、https://curve.exchange をご利用ください"](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)——`curve.exchange`は別のインフラを使っており、汚染されていなかったからだ。

*即座にはできなかったこと*は、一度鳴らした鐘を鳴らしなかったことにする作業だった。ネームサーバーを変更したが、DNSは世界中で一斉に更新されるわけではない。rekt.newsが指摘したように、["ハッカーのミラーサイトはすぐに削除されたが、一部のネームサーバーはまだ更新されていなかった。"](https://rekt.news/curve-finance-rekt)  修正が入った後も一定時間、世界中のキャッシュが古い悪意ある回答を返し続けた。この伝播の遅延はDNSに固有の性質であり、攻撃者にとって固有のアドバンテージでもある。

すでに悪意あるコントラクトを承認してしまったユーザーにとって、唯一の防御は失効だった。至る所でこのメッセージが繰り返された：["過去数時間以内にCurveでコントラクトを承認した場合は、直ちに取り消してください。"](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)  rekt.newsはユーザーが失効させるべきドレイナーの具体的なアドレス——`0x9eb5f8e83359bb5013f3d8eee60bdce5654e8881`——を公表し、被害者がさらなる引き出しを防げるよう支援した。

盗まれた資金は通常のロンダリングルートへ散らばった。CertiKがその流れを追跡した——["FixedFloat：292 ETH、Tornado Cash：27.7 ETH、Binance：20 ETH"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)——そしてタイミングの妙を指摘した：Tornado CashがOFACによって制裁されたばかりだったため、["OFACによるTornado Cashへの最近の制裁が、ハッカーに盗んだ資金の大部分を（中央集権型取引所の）FixedFloatへ送ることを選ばせたと考えられる"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)。この選択が功を奏した：rekt.newsによると、FixedFloatに送られた資金のうち[112 ETHが凍結された](https://rekt.news/curve-finance-rekt)。数時間後、Curveは["問題は発見され、解消された"](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)と確認した。

## DeFiフロントエンドへのDNSが教えるもの

Curveのインシデントは、DeFiの真の攻撃対象がどこに存在するかをコンパクトに示している。いくつかの教訓はCurveを超えて広く一般化できる。

1. **ドメインはセキュリティ境界の一部だ。** ドメインをマーケティングインフラ——システムではなくラベル——として扱いたくなる誘惑はある。しかしドメインはユーザーのブラウザが最初に従う指示だ。それが間違っていれば、下流のすべてが間違う。コントラクト境界で止まる監査は、最も信頼されているリンクを未カバーのままにしている。

2. **レジストラとネームサーバーのセキュリティはあなたの上流にある。** Curve自身のアカウント管理は問題なかったかもしれない。侵害はネームサーバー層にあったと考えられている。あなたはDNSチェーン上のすべてのプロバイダのセキュリティ体制を引き継ぐ。レジストラロック、強力なアカウント保護、理想的には[DNSSEC](/ja/glossary/dnssec/)をサポートするレジストラとDNSホストを選ぶべきだ——そしてそれでも、完全にはコントロールできない層を信頼していることを理解しておく必要がある。

3. **ユーザーにはDNSが見えない。** クローンは*名前*が同一だったため、見た目も同一だった。錠前のアイコンは緑だった。URLは正しかった。慎重なユーザーが通常確認するものは何も警告を発しなかっただろう。これがDNSハイジャックを、高度なリテラシーを持つ層に対しても有効にする理由だ——欺きは人間が検査する層の下で起きている。

4. **クリーンなフォールバックを用意せよ。** Curveを救ったのは、別のインフラ上の`curve.exchange`だった。第二のフロントエンドルート——別のドメイン、別のDNSプロバイダ、[IPFS](/ja/glossary/ipfs/)や[ENS](/ja/glossary/ens/)を使ったミラー——があれば、プライマリの名前が汚染されたときにユーザーを誘導する先ができる。

5. **トークン承認がペイロードだ。** このファミリーのフロントエンド攻撃はすべて同じ形で終わる：見慣れた承認ダイアログ、しかし送り先は敵のコントラクト。ウォレット、インターフェース、ユーザーのすべてが、新しく読み込んだページ上の承認プロンプトを、それが本来持つ高リスクな行為として扱う必要がある。

## Namefiの視点

![検証可能で改ざん耐性のあるドメイン所有権のカラフルなイラスト——グリーンのシールドとNamefiトークン、そしてDNSの継続性によって保護されたドメインカード](../../assets/the-curve-finance-dns-hijack-03-namefi-angle.jpg)

Curveのハイジャックは、根本的には**誰が名前を支配するか**という問いだ。そしてその支配がいかにクリーンに検証・保持・回復できるかという問いでもある。

従来のモデルでは、ドメインの支配は脆いバンドルで構成されている：レジストラアカウント、ネームサーバーレコードのセット、そして黙って信頼するしかないプロバイダのチェーン。そのチェーンのどこかが侵害されると——iwantmynameのネームサーバーがそうだったと見られているように——正規のオーナーはミスを犯していなくても自分の名前の実効的な制御を失い得る。しかも、*何がいつ変わったのかという*明確で改ざん証明済みの記録は残らない。

[Namefi](https://namefi.io)は、ドメインがインターネットネイティブな資産として振る舞うべきだという考えのもとに構築されている。DNSとの互換性を保ちながら、所有権とコントロールを検証可能・監査可能・改ざん耐性のあるものにできるという考えだ。Curveの深い教訓は「DeFiは安全でない」ということではない。**ドメイン層は荷重を担うセキュリティインフラだ**——それが長年にわたって装飾として扱われてきたということだ。DeFiプロトコルを運営していても、店舗を運営していても、ブログを書いていても、ユーザーが入力するその名前は一つの約束だ。そしてその約束の完全性は、その背後にあるコントロール面の強度に等しい。

Curveのコントラクトは57億ドルを一傷もなく守り続けた。ドメインは一午後で50万ドルを手放した。この差の中に、すべての物語がある。

## 出典および参考情報

- CertiK — [Curve Finance Hack Incident Analysis](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)
- rekt.news — [Curve Finance — REKT](https://rekt.news/curve-finance-rekt)
- Cointelegraph（TradingView経由）— [What is DNS hijacking? How it took down Curve Finance's website](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)
- Cryptopotato — [Curve Finance Issues Warning About Compromised Front End Amid $570K Theft](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)
- Coingape — [Curve Finance DNS Hijacked, Attackers Stole $570K from User Wallets](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)
- Tronweekly — [Curve Finance's Hackers Loot $570K Via DNS Hijacking](https://www.tronweekly.com/curve-finance-dns-hijacking/)
- CryptoDaily — [Curve Finance Asks Users To Revoke Recent Contracts After DNS Hack](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)
