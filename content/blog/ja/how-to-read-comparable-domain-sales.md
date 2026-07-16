---
title: "ドメイン売却事例（コンプス）の読み方"
date: '2026-06-21'
language: ja
tags: ['domains', 'domain-investing', 'domain-flipping', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 9
format: guide
description: "NameBioスタイルの売却履歴を使ってドメインを適正価格で評価する方法：真の比較可能事例の見つけ方、TLD・文字数・キーワードによる調整、チェリーピッキングの回避策。"
ogImage: ../../assets/how-to-read-comparable-domain-sales-og.jpg
keywords: ['ドメイン売却事例', 'ドメインコンプス', 'ドメインコンプスの読み方', 'NameBio', 'ドメイン売却履歴', 'ドメイン評価コンプス', 'ドメイン価格比較', 'ドメイン価格設定方法', 'ドメイン査定比較事例', 'ドメイン売却データ', '比較可能なドメインの探し方', 'ドメインコンプス調整', 'ドメイン投資コンプス', 'ドメイン価格データ']
relatedArticles:
  - /ja/blog/how-to-value-a-domain-name/
  - /ja/blog/end-user-vs-reseller-domain-pricing/
  - /ja/blog/domain-appraisal-tools-compared/
  - /ja/blog/what-makes-a-domain-valuable/
  - /ja/blog/domain-flipping/
relatedTopics:
  - /ja/topics/domain-investing/
  - /ja/topics/choosing-a-tld/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/domain-investor-field-guide/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/tld/
  - /ja/glossary/icann/
  - /ja/glossary/dns/
  - /ja/glossary/registry/
---

不動産鑑定士に物件の価値を尋ねると、彼らは当て推量はしない。近隣の類似物件が最近いくらで売れたかを調べ、そこから差異を調整して価格を導く。[ドメイン査定](/ja/glossary/domain-appraisal/)もまったく同じ仕組みだ。「近隣の最近の成約事例」に相当するのが、過去のドメイン売却の公開記録――コンプス（比較事例）である。コンプスを正しく読めれば、設定した価格のほぼすべてを論理的に説明できる。読み方が雑であれば、市場が一度も認めたことのない数字を自分に信じ込ませることになる。

このガイドは、[ドメイン価値の評価方法](/ja/blog/how-to-value-a-domain-name/)に関する主要記事で予告したコンプス詳細解説であり、[ドメインフリッピング](/ja/blog/domain-flipping/)スキル体系の一段を担う。売却データの所在、真に比較可能な事例の見つけ方、常に存在する差異の調整方法、そして他のどんな単一ミスよりも査定を台無しにするチェリーピッキングの罠を取り上げる。

## 売却データはどこにあるか

コンプスの原材料は、開示されたドメイン売却の公開履歴であり、その標準リファレンスがNameBioだ。NameBioは過去のドメイン売却価格を検索できるデータベースで、業界全体が引用する情報源となっている。Wikipediaのドメイン二次市場概説も主要な市場数値の根拠としてこれを参照しており、[NameBioによれば、2024年には14万4,700件、総額1億8,500万米ドルのドメイン売却が記録された](https://en.wikipedia.org/wiki/Domain_aftermarket#:~:text=According%20to%20NameBio%2C%20144%2C700%20domain%20name%20sales%20totaling%20US%24185%20million%20were%20recorded%20in%202024)とされている。コンプスを探す際に検索するのがこのプール――年間数万件の開示売却事例であり、キーワード、拡張子、文字数、価格、日付で絞り込める。これらの記録は開示された[マーケットプレイス](/ja/glossary/marketplace/)と[レジストラ](/ja/glossary/registrar/)の取引から集まっているため、公開プールは大規模ではあっても決して網羅的ではない。

このプールについて二つの事実が、以降の議論すべてを左右する。第一に、`.com`に極端に偏っていること。同概説によれば、2024年における[.comドメインの売却が年間総取引額の74.4%を占めた](https://en.wikipedia.org/wiki/Domain_aftermarket#:~:text=accounted%20for%2074.4%25%20of%20the%20year%27s%20total%20dollar%20volume)――つまり`.com`名ならば豊富で信頼性の高いコンプスが得られるが、他の[拡張子](/ja/glossary/tld/)に移るほどデータは薄くなる。第二に、市場は年々動いていること。2024年の総取引額は売却件数が減少したにもかかわらず[2023年比で32.8%増加した](https://en.wikipedia.org/wiki/Domain_aftermarket#:~:text=rose%20by%2032.8%25%20compared%20to%202023)。3年前のコンプスは今日とは異なる市場環境で成立したものであり、それは必ず調整しなければならない。

自動査定ツールも同じデータソースを使っている。たとえばGoDaddyの評価ツールは、その[アルゴリズムが独自の機械学習と実際の市場売却データを使用してドメイン価値を推定し、比較可能なドメイン売却事例を提供する](https://www.godaddy.com/resources/skills/godaddy-domain-name-value-appraisal-tool#:~:text=algorithm%20uses%20proprietary%20machine%20learning%20and%20real%20market%20sales%20data%20to%20estimate%20domain%20values)と説明している。このツールが自動でやっていることを、このガイドでは手作業で学ぶ――[比較売却事例](/ja/glossary/comparable-sales/)を集めて比較検討するプロセスだ。コンプスを自分で読めるようになれば、ツールを盲目的に信じるのではなく、その出力を検証できる。各ツールの詳細は[ドメイン査定ツール比較](/ja/blog/domain-appraisal-tools-compared/)で取り上げている。

## 真の比較事例とは何か

![ターゲットドメインのカードが、合致する比較ドメインには実線で、合致しないドメインには薄い破線でつながれているイラスト](../../assets/how-to-read-comparable-domain-sales-01-true-comparable.jpg)

コンプスは、あなたのドメインと本当に*似ている*場合にのみ有用だ。最もよくある査定ミスは、自分のキーワードを含むあらゆる売却事例を価格の根拠として扱ってしまうことだ。それは根拠にならない。真の比較事例とは、単に言葉が一致しているだけでなく、実際に価値を左右する次元でも一致しているドメインである。

以下のチェックリストを、制約が厳しい順に確認していこう。

- **同じ拡張子であること。** `.com`の売却事例は[`.net`](/ja/glossary/tld/)や`.co`名のコンプスにはならない、これは絶対だ。拡張子は最大の価格決定要因の一つであり、混在させると最も簡単に自分を欺くことになる。`.io`を評価するなら`.io`のコンプスを探し、`.xyz`を評価するなら`.xyz`のコンプスを探す。この差がなぜ大きいかは[TLDがドメイン価値に与える影響](/ja/blog/how-tld-affects-domain-value/)で説明している。
- **同じ文字数クラスであること。** 1語の名前、短い2語の名前、3語以上の名前、数字やハイフンを含む名前は別々の資産クラスだ。4文字のブランダブルドメインは、15文字の3語フレーズについては何も教えてくれない。
- **同じキーワードファミリーと商業的意図を持つこと。** 取引に結びついた言葉（`loans`、`insurance`、`casino`）は、趣味の言葉とは異なる価格曲線を描く。話題だけでなく、言葉の*種類*を合わせること。`puppies`と`mortgages`はどちらも一般的な英語名詞だが、互いのコンプスにはならない。
- **同じ買い手タイプであること。** これは新しいフリッパーが見落としがちな点だ。別の投資家への卸売価格と[エンドユーザー](/ja/glossary/end-user/)への小売価格では、同じドメインでも大幅に異なることがある。[リセラー](/ja/glossary/reseller/)のコンプスはいくらで*買うべきか*を示し、エンドユーザーのコンプスはいくらで*売れるか*を示す。両者を平均してはいけない――二つの異なる市場を測定しているのであり、それが[エンドユーザーとリセラーのドメイン価格設定](/ja/blog/end-user-vs-reseller-domain-pricing/)の論点そのものだ。
- **十分に新しいこと。** 活況な年の売却と低迷した年の売却では価格が異なる。最近のコンプスを重視し、数年前のものは方向性の参考にはなるが決定的ではないと扱うこと。

5つすべてが合致するコンプスは金の価値がある。2つしか合致しないコンプスは、大幅な調整が必要な出発点にすぎない。1つ――キーワードだけ――しか合致しないコンプスは、ほとんど根拠にならない。

## 常に存在する差異の調整方法

![出発点となるコンプス価格が、拡張子・文字数・タイミングのスライダーによって最終的な調整後価格へと動かされているイラスト](../../assets/how-to-read-comparable-domain-sales-02-adjusting.jpg)

まったく同一のドメインは存在しないため、すべてのコンプスには調整が必要だ。ここで査定は単純な検索作業ではなくスキルになる。基本は単純だ。コンプスの価格を出発点とし、自分のドメインとの違いごとに上下に動かしていく。

**拡張子。** `.com`は他の市場が価格付けを行う基準点だ。コンプスが`.com`で自分のドメインがそうでなければ、信頼度の低い拡張子では同じ文字列でも価値が下がるため、下方調整する――しばしば大幅に。幸運にも`.com`を持っていてコンプスがより弱い拡張子であれば、上方調整する。プレミアム拡張子はニッチ内でこのルールを破ることがある。開発者ツールの[`.io`](/ja/tld/io/)やAIスタートアップの[`.ai`](/ja/tld/ai/)は一般的な`.com`に近い、あるいは上回る価格をつけることがあり、二次市場もそれに気づいている――2024年の`.ai`取引額は[100%超増加し107%上昇した](https://en.wikipedia.org/wiki/Domain_aftermarket#:~:text=more%20than%20doubled%2C%20rising%20107%25)。拡張子そのものではなく、その拡張子の市場に合わせて価格を設定すること。

**文字数と構成。** 短くシンプルなほど上方調整、長くハイフンや数字が入るほど下方調整。コンプスが`cars.com`クラスで自分のドメインが`bestcars-online.com`なら、そのコンプスは届きもしない上限であり、下限ではない。

**言葉の力。** 実在し、検索され、発音しやすい言葉は弱い言葉で構成されたコンプスより上方調整し、より強い言葉のコンプスより下方調整する。ここでは正直であること。コンプスが自分のキーワードを*含んでいる*からといって、同じ需要があるとは限らない――`flowers`と`flowerz`は、安易なマッチングで並べられても同じ資産ではない。

**市場のタイミング。** 最も強いコンプスが活況だった年のものなら、現在の状況に向けて割り引くこと。市場がその後に過熱しているなら、上方に微調整する。1年間での32.8%の振れ幅は、「いくらで売れたか」と「今ならいくらで売れるか」が別の問いであることを思い起こさせる。

**付帯価値。** 売却事例の中には、純粋なドメイン名のコンプスとはまったく言えないものがある。買い手が文字列ではなく*ビジネス*に対価を払っていた場合だ。QuinStreetが2010年に`CarInsurance.com`を[4,970万ドルの現金で取得した](https://www.globenewswire.com/news-release/2010/11/08/433738/12254/en/QuinStreet-Announces-Acquisition-of-CarInsurance-com-Inc.html#:~:text=for%20%2449.7%20million%20in%20cash)とき、その価格はドメイン名単体に対するものではなかった。Domain Name Wireは[価値の主体はサイトが受けているオーガニックトラフィックとそれがリードに転換される仕組みにある](https://domainnamewire.com/2010/11/09/quinstreet-bought-carinsurance-com-for-the-organic-traffic/#:~:text=the%20value%20comes%20primarily%20from%20the%20organic%20traffic)と報じた。同じニッチのトラフィックなしの駐車ドメインのコンプスにこのような売却を使えば、数百万ドル単位で数字が膨らんでしまう。比較前に付帯価値を除去するか、その売却事例はそもそも使わないことだ。

## チェリーピッキングの罠

![ありふれた売却の中央値クラスターを無視して、群を抜く外れ値のバーを一本つまみ上げる手のイラスト](../../assets/how-to-read-comparable-domain-sales-03-cherry-picking.jpg)

他のすべてのミスを合わせたより多くの査定を台無しにしてきたミスがある。キーワードファミリーで唯一の突出した売却事例を見つけ、それを基準に据えて、周囲の平凡な百件を無視するパターンだ。業界で最も陥りやすい罠だ。なぜなら、データ自体がそちらへ誘うからである――最大の売却事例は最も有名で、最も引用され、見つけたときに最も気分が高揚する。

公開記録はそうした誘惑を提供するために作られたかのようだ。Wikipediaの高額ドメイン一覧は[300万ドル以上の売却のみを収録](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=most%20expensive%20domain%20name%20sales%2C%20with%20values%20of%20%243%20million)し、[純粋なドメイン名および現金のみによる売却に限定](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=limited%20to%20pure%20domain%20name%20and%20cash%2Donly%20sales)されている。[Voice.com](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=Voice.com)の2019年3,000万ドル、[Sex.com](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=Sex.com)の2010年1,300万ドル、[Hotels.com](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=Hotels.com)の2001年1,100万ドルといった数字は、実在し検証されたものだが、普通のドメイン名のコンプスとしてはまったく役に立たない。これらは1語の辞書クラスの`.com`であり、存亡に関わる必要性と厚い資金力を持つ買い手が購入したものだ――[TeslaMotors.comからTesla.comへ](/ja/blog/from-teslamotors-com-to-tesla-com/)のリブランドのように、買い手の切実なニーズが価格を決めたのであって、広い市場がそうした価値を認めたわけではない。これらは市場全体の上限を示すだけであり、あなたのドメインの価格を示してはいない。

解決策は**分布全体で価格を決め、ピークに頼らないこと**だ。コンプスを集めるときは、上位だけでなく全体の広がりを集める。中央値と自分のドメインに最も似た売却事例のクラスターを見て、高い外れ値はそのまま外れ値として扱い、自分のドメインが本当にその域に属さない限り除外する。有用な習慣として、最高値と最安値のコンプスを一件ずつ除外し、残りから価格レンジを構築すること。論拠となる価格が一件の売却事例にすべて依存しているなら、それはコンプスに裏打ちされた価格ではない。希望的観測であり、希望は査定ではない。

チェリーピッキングは逆方向にも起きる。交渉で相手が対抗してくるとき、買い手は*最安値*の比較事例を引っ張り出してそれが市場だと主張する。同じ規律が両方向で自分を守る。分布全体を把握し、真の比較事例を示せれば、夢想家にも買い叩き屋にも対して価格を守ることができる。

## 実例による簡単なウォークスルー

`BudgetTravel.io`を保有していて価格を設定したいとしよう。間違ったアプローチは、`Travel.com`の有名な売却事例を探して夢を見ることだ。正しいアプローチはチェックリストを踏む。

まず拡張子から。`.io`のコンプスが必要なので、どれほど魅力的でも`.com`の売却事例は脇に置く。次に文字数と構成。`BudgetTravel`は自然な2語フレーズなので、キーワード詰め込みやハイフンを含むものより、短くて自然な2語名を重視する。キーワードファミリーを合わせる。旅行はエンドユーザー需要のある実際の商業カテゴリーなので、趣味の言葉の売却事例とは比較しない。買い手タイプを確認する。`.io`の卸売フリップとエンドユーザーへの`.io`売却を分け、どちらの数字を推計しているかを決める。最後にタイミングを調整し、古いコンプスを現在の市場環境に近づける。

行き着く先は、外れ値を除外し、残った各コンプスを自分のドメインとの差異に応じて調整した、真に類似した売却事例のクラスターに根ざした*価格レンジ*だ。そのレンジなら交渉で守り抜ける数字となる――それがまさに査定の目的だ。交渉が合意に達すれば、次の課題は安全な決済だ。それが[エスクロー](/ja/glossary/escrow/)の役割であり、[ドメインエスクロー解説](/ja/blog/domain-escrow-explained/)と[所有ドメインの売り方](/ja/blog/how-to-sell-a-domain-name-you-own/)で取り上げるワークフローだ。

## Namefiの視点

コンプスを読むことでドメインの価値がわかる。取引のもう半分は、価格に合意したあと、ドメインが確かにクリーンに移転されたことを証明することだ。高額な[ドメイン取引](/ja/glossary/domain-trading/)が毎回つまずくのは同じ信頼のギャップだ。買い手は資産を支配する前に代金を支払いたくなく、売り手は入金を確認する前にドメインを手放したくない。

[Namefi](https://namefi.io)はそのギャップを埋めるために設計されている。実際の[ICANN](/ja/glossary/icann/)ドメインをトークン化することで所有権が監査可能かつ移転可能になり、[DNS](/ja/glossary/dns/)の継続性により引き渡しの間もドメインの名前解決が維持される。コンプスは守れる数字を与え、クリーンで検証可能な移転がその数字をどちらも先に動かすことなくクローズされた取引に変える。

## 免責事項（必ずお読みください）

> 私たちは弁護士でも会計士でも財務アドバイザーでも医師でもなく、**この記事のいかなる内容も法律上、財務上、税務上、会計上、医療上、その他いかなる専門的なアドバイスを構成するものではありません。** これらの投稿は自己学習のため、またお客様への参考情報として作成しています。ここに記載の情報は古くなっている場合があり、特定の地域にのみ適用される場合があり、あるいは単純に誤っている場合もあります。私たちも間違いを犯します。
>
> 重要な意思決定については、**必ず実際の専門家に相談してください（本当に！）**。それが難しければ、友人に聞く、Twitter/Xで聞く、Redditで聞く、AIに聞く、あるいは占い師に聞くのも一手。要するに：**DOYR（自分自身でリサーチする）**。一緒に学び、楽しみましょう。

## 情報源と参考文献

- Wikipedia — [Domain aftermarket](https://en.wikipedia.org/wiki/Domain_aftermarket#:~:text=According%20to%20NameBio%2C%20144%2C700%20domain%20name%20sales%20totaling%20US%24185%20million%20were%20recorded%20in%202024)（NameBio 2024：14万4,700件 / 1億8,500万ドル；.com 取引額の74.4%；前年比+32.8%；.ai +107%）
- Wikipedia — [List of most expensive domain names](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=most%20expensive%20domain%20name%20sales%2C%20with%20values%20of%20%243%20million)（Voice.com 3,000万ドル/2019年、Sex.com 1,300万ドル/2010年、Hotels.com 1,100万ドル/2001年；300万ドル以上の公開現金取引のみ収録）
- GoDaddy — [Domain Name Value & Appraisal tool](https://www.godaddy.com/resources/skills/godaddy-domain-name-value-appraisal-tool#:~:text=algorithm%20uses%20proprietary%20machine%20learning%20and%20real%20market%20sales%20data%20to%20estimate%20domain%20values)（機械学習＋実際の市場売却データ；比較可能な売却事例を提供）
- GlobeNewswire — [QuinStreet Announces Acquisition of CarInsurance.com, Inc.](https://www.globenewswire.com/news-release/2010/11/08/433738/12254/en/QuinStreet-Announces-Acquisition-of-CarInsurance-com-Inc.html#:~:text=for%20%2449.7%20million%20in%20cash)（4,970万ドル現金、2010年）
- Domain Name Wire — [QuinStreet Bought CarInsurance.com for the Organic Traffic](https://domainnamewire.com/2010/11/09/quinstreet-bought-carinsurance-com-for-the-organic-traffic/#:~:text=the%20value%20comes%20primarily%20from%20the%20organic%20traffic)
