---
title: "ドメインフリッピングと法律：商標、UDRP、そして詐欺"
date: '2026-06-21'
language: ja
tags: ['domains', 'security', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-flipping-skills
seriesOrder: 16
format: explainer
description: "ドメインフリッパーが知るべき法的リスクの全体像：商標の基礎知識、UDRPとACPA、クロージング時のエスクロー活用、ハイジャック対策、そして売却詐欺の回避法。"
ogImage: ../../assets/domain-flipping-and-the-law-og.jpg
keywords: ['ドメインフリッピング 法律', 'ドメインフリッピング 合法', 'サイバースクワッティング', 'UDRP', 'ACPA', 'ドメイン 商標法', 'ドメイン紛争', 'リバースドメインネームハイジャッキング', 'ドメインフリッピング 詐欺', 'ドメインエスクロー', 'ドメインハイジャック', '不正目的のドメイン登録', 'ドメイン投資 法律', 'ドメイン名紛争', '合法的なドメインフリッピング方法']
relatedArticles:
  - /ja/blog/domain-flipping/
  - /ja/blog/cybersquatting-vs-domaining-udrp-acpa/
  - /ja/blog/avoiding-domain-sale-scams/
  - /ja/blog/how-to-sell-domains-for-profit/
  - /ja/blog/how-to-sell-a-domain-name-you-own/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-investing/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/domain-investor-field-guide/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
  - /ja/glossary/dns/
  - /ja/glossary/registry/
---

ドメインフリッピングは合法だ。しかし、間違ったドメインに手を出せば、ドメインそのものを失うだけでなく、投資した資金も消え、場合によっては数万ドル規模の損害賠償命令まで下される。この二つの結果を分けるのは運ではない。半日あれば習得できる法律の基礎知識と、ポートフォリオを健全に保ち取引を守るいくつかの実務習慣があるかどうかだ。

これは[ドメインフリッピング](/ja/blog/domain-flipping/)シリーズの「法律とセキュリティ」の章だ。[ドメイン投資（ドメイニング）](/ja/glossary/domaining/)と[サイバースクワッティング](/ja/glossary/cybersquatting/)の境界線、その境界を執行する二つの紛争処理制度、詐欺に遭わずに売却を完了させる方法、そして他人にドメインを奪われないための防衛策を解説する。これは法的助言ではないが（末尾の免責事項を参照）、経験豊富なフリッパーが取引ごとに織り込んでいる実務知識そのものだ。

## 越えてはならない一線：商標

![分割線の左側に緑のチェックマークが付いた汎用ドメインタグ、右側にブランドエンブレムの入った「進入禁止」マーク付きドメインが描かれた図解](../../assets/domain-flipping-and-the-law-01-trademark-line.jpg)

法的な問いはつまるところ、一つの区別に集約される。汎用的・説明的・造語的なドメイン名を転売目的で登録するのは、普通の投資行為だ。一方、*特定企業のブランド*に乗っかったドメインを登録するのはサイバースクワッティングであり、それこそが正当なフリップを失敗に変える唯一の行為だ。

Wikipediaの定義が標準となっている：サイバースクワッティングとは[他者が保有する商標の信用から利益を得る不正目的をもって、インターネットドメイン名を登録、売買、または使用する行為](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)だ。この定義で重要な役割を担う言葉が二つある：*[不正目的（bad faith）](/ja/glossary/bad-faith/)*と*[商標（trademark）](/ja/glossary/trademark/)*だ。`loans`（融資）のような辞書的な単語や`Zapio`のような造語は、特定の誰かのものではない。しかし`nikeshoes-store.com`は明らかに既存のブランドに乗っかっている。あるドメイン名が既存ブランドに近づけば近づくほど、そのブランドから金を引き出すために登録したと見られ、その意図こそが法律が罰するものだ。境界線の詳細は[サイバースクワッティングとドメイニング：UDRPとACPA](/ja/blog/cybersquatting-vs-domaining-udrp-acpa/)で解説している。

購入前の実践的なチェック：「合理的な人ならこのドメインが特定の企業を指していると思うか？」——もしそうなら、どれだけ安くても手を引くべきだ。ドメイン名に価値をもたらす本質的な要素は[ドメイン名の評価方法](/ja/blog/how-to-value-a-domain-name/)と[ドメインとは何か](/ja/blog/what-is-domain/)で説明している。商標テストに引っかかるドメイン名は、持ち続けること自体が負債になるためマイナスの価値しか持たない。

## UDRP：商標権者がドメインを取り戻す方法

最も早く、コストが低い執行手段がUDRP（統一ドメイン名紛争解決方針）だ。これは[ICANN](/ja/glossary/icann/)のルール体系に組み込まれており、ドメイン登録時に同意する登録契約に含まれているため、あなたはすでにその拘束を受けている。ICANNは1999年に[UDRP](/ja/glossary/udrp/)を採択し、紛争は認定機関——中でも[世界知的所有権機関（WIPO）](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=World%20Intellectual%20Property%20Organization)が最も代表的——によって裁定される。

申立人はすべてを同時に立証しなければならない。Wikipediaがこの方針を要約しているように、対象ドメイン名が[申立人が権利を有する商標またはサービスマークと同一または混同を生じるほど類似していること](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark)、[登録者](/ja/glossary/registrant/)が[そのドメイン名について権利または正当な利益を有しないこと](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=does%20not%20have%20any%20rights%20or%20legitimate%20interests)、そしてドメイン名が[「不正目的」で登録され使用されていること](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=has%20been%20registered%20and%20the%20domain%20name%20is%20being%20used)の三点だ。どれか一つでも立証できなければ申立ては退けられる。

UDRPが持つリスクは範囲は限定的だが結果は絶対的だ。認められる救済措置はドメインの[取消または移転](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=cancellation%20or%20transfer)のみで金銭的賠償はないが、資産そのものを完全に失う。裁判ならば数か月かかるところを、パネルは数週間で判断を下す。このシステムは活発に機能している：WIPOの報告によれば、2024年には[133か国の商標権者がUDRPおよび国別ccTLD紛争制度に基づき6,168件の申立てを行った](https://www.wipo.int/pressroom/en/articles/2025/article_0003.html#:~:text=trademark%20owners%20from%20133%20countries%20filed%206%2C168%20cases%20under%20the%20Uniform%20Domain%20Name%20Dispute%20Resolution%20Policy)。フリッパーとしての教訓は単純だ：UDRPはブランドが最初に手を伸ばす安くて速いツールであるため、UDRPを引き起こしそうなドメインは在庫に持ちたくない。

## ACPA：訴訟と金銭賠償にエスカレートする場合

UDRPにできるのはドメインを移転するだけだが、米国法はさらに踏み込む。1999年に制定された[反サイバースクワッティング消費者保護法（ACPA）](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20U.S.%20law%20enacted%20in%201999)は、商標権者が連邦裁判所に提訴してドメインだけでなく損害賠償を求めることを可能にした。

[ACPA](/ja/glossary/acpa/)の核心は、登録者が[商標から利益を得る不正目的を持っていたかどうか](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=Has%20a%20bad%20faith%20intent%20to%20profit%20from%20the%20mark)であり、裁判所はさまざまな要素を検討してこれを判断する。そのうちいくつかはフリッパーを直接狙い撃ちにしている：裁判所は登録者が[商標権者のオンライン上の所在地から顧客を引き離す意図](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=intent%20to%20divert%20customers%20from%20the%20mark%20owner%27s%20online%20location)を持っていたか、また正当な利用目的なく[金銭的利益のためにドメイン名を商標権者またはサードパーティに譲渡・売却・移転しようとする申し出](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=offer%20to%20transfer%2C%20sell%2C%20or%20otherwise%20assign%20the%20domain%20name)を行ったかどうかを見る。これをもう一度よく読んでほしい：「あなたの」ドメイン名を買い取るよう価格を提示してブランドに連絡すること自体が、不正目的の証拠となりうる。これが無知なフリッパーが踏み込む罠だ。

最も痛いのは金銭的リスクだ。同法の下、原告は[ドメイン名1件あたり1,000ドル以上10万ドル以下](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)の法定損害賠償を選択できる（裁判所が相当と認める額）。ブランドに隣接するドメイン名を複数登録すれば、リスクは一気に膨らむ。しかしこれらは、健全なポートフォリオを構成する汎用・ブランダブルなドメイン名には一切関係ない。他者の商標に乗っかるドメインを絶対に買わなければ、すべて回避できる。

## フリッパーの盾：リバースドメインネームハイジャッキング

法律は双方向に機能する。これは初心者のほとんどが知らない部分だ。時には*商標権者*こそが不正目的で行動し、真の権利のない正当な登録者からドメインを強奪しようとすることがある。この行為に対して制度は名前を持っている。リバースドメインネームハイジャッキングとは[正当な商標権者が、ドメイン名の「サイバースクワッター」所有者に対してサイバースクワッティングの申立てを行うことで、ドメイン名を確保しようとする行為](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name)だ。UDRPの規則ではこれを[不正目的での申立て、すなわちUDRPの行政手続きの乱用](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=the%20filing%20of%20a%20complaint%20in%20bad%20faith%2C%20resulting%20in%20the%20abuse)と定義している。

ある企業がブランドとして採用するよりも何年も前に汎用語を登録していたなら、あなたには正当な権利がある。パネルは申立人に不利な裁定を下す可能性があり、強引な申立人を制裁できる。だからこそ、日付が明確で文書化された取得記録が重要なのだ。話の筋が明快であればあるほど——汎用ドメイン名、誰かを標的にしない明確な登録目的、誰かへの嫌がらせに使用した形跡がない——防御は強固になり、パネルが強引な申立てを退けやすくなる。[WHOIS](/ja/glossary/whois/)と購入記録を整理しておくこと。それがあなたの証拠だ。

## 詐欺に遭わずに売却を完了させる

![買い手がコインを、売り手がドメインタグを持ち、どちらも中立なエスクロー金庫を通じて資金とドメインを同時に交換している図解](../../assets/domain-flipping-and-the-law-02-escrow.jpg)

商標リスクは法的な危険であり、取引上の危険は取引そのものにある。ドメイン売買は典型的な信頼のジレンマだ：売り手は代金を受け取る前に移転したくないし、買い手はドメインを受け取る前に支払いたくない。先に動いた方が晒されるリスクを背負い、詐欺師はそのギャップに生息している。

標準的な解決策がエスクローだ——一般的な定義によれば、[取引の主当事者のために、合意された条件に従って金銭または資産を預かり支払う](https://en.wikipedia.org/wiki/Escrow#:~:text=receives%20and%20disburses%20money%20or%20property%20for%20the%20primary%20transacting%20parties)中立的な第三者機関のことだ。買い手がエスクロー業者に資金を預け、売り手がドメインを移転し、業者が引渡しを確認してから代金を放出する。双方が相手を信頼する必要はなく、信頼するのは業者だけでいい。仕組みの詳細は[ドメインエスクロー解説](/ja/blog/domain-escrow-explained/)と[エスクロー](/ja/glossary/escrow/)の用語集で説明している。

よく繰り返される詐欺のパターンをいくつか覚えておこう。より詳しくは[ドメイン売却詐欺の回避法](/ja/blog/avoiding-domain-sale-scams/)で解説している：

- **偽エスクローサイト。** 「買い手」が聞いたこともないエスクローサービスを指定してくる。URLは本物のそれを真似ているが、そのサイトは詐欺師のものだ。あなたのドメインと手数料は消えてなくなる。自分で選んで確認したエスクローサービスのみを使うこと。
- **チャージバックと返金詐欺。** 買い手が取消し可能な支払い方法で決済し、あなたがドメインを移転した後に支払いを取り消す。信頼できるエスクローと取消し不能な決済手段は、まさにこれを防ぐために存在する。
- **過払い詐欺。** 「買い手」が過剰な金額を送金し、差額の返金を求める。元の支払いは後で弾かれる。

共通する教訓：約束だけでドメインの管理権を渡してはならない。売り手向けの完全な対策については[所有ドメインの売却方法](/ja/blog/how-to-sell-a-domain-name-you-own/)と[ドメイン取引](/ja/glossary/domain-trading/)の概要を参照してほしい。

## ポートフォリオを盗まれないために

![閉じた錠前と盾で守られたドメインタグに封筒型の鍵がかかり、赤いフィッシングフックがブロックされている図解](../../assets/domain-flipping-and-the-law-03-hijack-defense.jpg)

最後の脅威はあなたの協力を必要としない。[ドメインハイジャック](/ja/glossary/domain-hijacking/)とは[元の登録者の許可なく、ドメイン名の登録情報を変更する行為](https://en.wikipedia.org/wiki/Domain_hijacking#:~:text=is%20the%20act%20of%20changing%20the%20registration%20of%20a%20domain%20name%20without%20the%20permission)だ。フリッパーにとって、あなたのポートフォリオはそのまま銀行口座だ。ハイジャックされたプレミアムドメインは、あなたが気づく前に無関係の第三者に売却されてしまう可能性がある。

ハイジャック犯が暗号を破ることはほとんどない。彼らが狙うのは人間とメールだ。Wikipediaによれば、よくある侵入経路は[ドメイン登録業者のシステムへの不正アクセスまたはソーシャルエンジニアリングを通じた脆弱性の悪用](https://en.wikipedia.org/wiki/Domain_hijacking#:~:text=unauthorized%20access%20to%2C%20or%20exploiting%20a%20vulnerability%20in%20the%20domain%20name%20registrar%27s%20system%2C%20through%20social%20engineering)か、単純に[ドメイン登録に紐付けられたドメイン所有者のメールアカウントへの侵入](https://en.wikipedia.org/wiki/Domain_hijacking#:~:text=getting%20into%20the%20domain%20owner%27s%20email%20account)だ。登録情報に登録されたメールアカウントを乗っ取られると、泥棒はレジストラのパスワードをリセットし移転を承認できてしまう。[ドメインハイジャックが実際に起きる仕組み](/ja/blog/how-domain-hijacking-actually-happens/)では攻撃の全連鎖を追っている。

対策はいずれも低コストで、使用するすべての[レジストラ](/ja/glossary/registrar/)に対して習慣として組み込む価値がある：

- **ドメインをロックする。** `clientTransferProhibited`ステータスは[レジストリ](/ja/glossary/registry/)に[ドメインの移転リクエストを拒否するよう](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=reject%20requests%20to%20transfer%20the%20domain)指示し、[ハイジャックや不正行為による不正移転を防止する](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=help%20prevent%20unauthorized%20transfers%20resulting%20from%20hijacking%20and%2For%20fraud)ために存在する。積極的に移転を行っていないドメインには常にこれをオンにしておくこと。
- **[認証コード（auth code）](/ja/glossary/auth-code/)を守る。** 正当な[レジストラ間移転](/ja/glossary/cross-registrar-transfer/)には現在のレジストラからの認証コード（auth code）が必要だ——[レジストラ間移転に必要な秘密情報](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=is%20a%20secret%20required%20in%20the%20transfer%20between%20registrars)である。パスワードと同様に扱い、見知らぬ人の「移転フォーム」に絶対に貼り付けてはならない。
- **登録メールアドレスを強化する。** レジストラに紐付けられたメールアカウントに二要素認証を設定すること。その受信トレイはあなたの[ドメイン所有権](/ja/glossary/domain-ownership/)記録全体へのマスターキーだ。

## トークン化された所有権がリスクを変える

上記の危険の多くは、共通の根本原因を持っている：従来のドメインの所有権はレジストラのデータベースの一行に過ぎず、そのレジストラのアカウントとメールアドレスによってのみ証明でき、各ハンドオフが詐欺やハイジャックの機会となる多段階プロセスを経てのみ移転できる。攻撃者や詐欺師が狙う攻撃面はそこだ。

本物のICANNドメインをトークン化することで、その攻撃面は狭まる。[オンチェーン](/ja/glossary/on-chain/)で管理権が表現されると、所有権は信用を前提とするのではなく監査可能になり、誰かが介入できる時間的な隙が生まれるのではなく、移転はDNSの継続性を保ちながらアトミックに決済される——つまりドメインは引継ぎ期間を通じて正常に名前解決され続ける。これは商標法を無効化しない（ブランドを侵害するドメイン名はいかなる仕組みでも悪手だ）が、エスクローの信頼ギャップとメール経由のハイジャック問題を直接攻略する。そのギャップを埋めるために[Namefi](https://namefi.io)は構築されており、詳細は[トークン化されたマーケットプレイスがエスクローに取って代わる仕組み](/ja/blog/how-tokenized-marketplaces-replace-escrow/)で解説している。

## まとめ

汎用的、説明的、造語的なドメイン名を買うこと。ブランドに乗っかるドメイン名は絶対に避ける。[UDRP](/ja/blog/what-is-udrp/)はドメインを素早く奪い、ACPAはさらに金銭的ダメージを与えられることを知っておく。正当なドメインを守り、リバースハイジャックにも対抗できるよう、きれいな記録を維持する。すべての売却は自分で選んだエスクローを通じて完了させ、ポートフォリオをしっかりとロックして誰にも持ち逃げさせない。これを実践すれば、法律はビジネスを待ち受ける罠ではなく、あなたのビジネスを守るフェンスとして機能する。

## 免責事項（必ずお読みください）

> 私たちは弁護士でも、会計士でも、ファイナンシャルアドバイザーでも、医師でもありません。**この記事のいかなる内容も、法律、金融、税務、会計、医療、またはその他の専門的なアドバイスではありません。** これらの投稿は、自分たちの学習のためと、ユーザーへの利便性を目的として書いています。ここに記載されている情報は古くなっている可能性があり、特定の地域のみに適用される可能性があり、あるいは単純に間違っている可能性もあります。私たちもミスを犯します。
>
> 重要な意思決定については、**必ず実際の専門家にご相談ください（本当に！）**。それが難しければ、友人、Twitter、Reddit、AI、または占い師に聞いてみてください。つまり：**DOYR — 自分自身でリサーチしてください**。一緒に学んで楽しみましょう。

## 出典および参考情報

- Wikipedia — [サイバースクワッティング（定義：商標の信用から利益を得る不正目的）](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)
- Wikipedia — [統一ドメイン名紛争解決方針（三要件・取消または移転の救済措置・WIPO）](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark)
- WIPO — [2024年のサイバースクワッティング申立て件数が過去最多（UDRP申立て6,168件、133か国）](https://www.wipo.int/pressroom/en/articles/2025/article_0003.html#:~:text=trademark%20owners%20from%20133%20countries%20filed%206%2C168%20cases%20under%20the%20Uniform%20Domain%20Name%20Dispute%20Resolution%20Policy)
- Wikipedia — [反サイバースクワッティング消費者保護法（1999年制定・不正目的要素）](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20U.S.%20law%20enacted%20in%201999)
- Cornell Law / U.S. Code — [15 U.S.C. § 1117(d)（法定損害賠償額：ドメイン名1件あたり1,000〜10万ドル）](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)
- Wikipedia — [リバースドメインネームハイジャッキング（不正目的の申立て・UDRPの手続き乱用）](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name)
- Wikipedia — [エスクロー（合意された条件に基づき中立の第三者が資産を保管・支払い）](https://en.wikipedia.org/wiki/Escrow#:~:text=receives%20and%20disburses%20money%20or%20property%20for%20the%20primary%20transacting%20parties)
- Wikipedia — [ドメインハイジャック（定義・ソーシャルエンジニアリングとメールアカウント経由の侵入経路）](https://en.wikipedia.org/wiki/Domain_hijacking#:~:text=is%20the%20act%20of%20changing%20the%20registration%20of%20a%20domain%20name%20without%20the%20permission)
- Wikipedia — [拡張プロビジョニングプロトコル（clientTransferProhibited・移転の秘密情報としての認証コード）](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=reject%20requests%20to%20transfer%20the%20domain)
