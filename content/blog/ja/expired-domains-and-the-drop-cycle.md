---
title: "期限切れドメインとドロップサイクルの仕組み"
date: '2026-06-21'
language: ja
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 3
format: explainer
description: "ドメインが期限切れになってドロップされるまでの流れ：猶予期間、30日間の回復ウィンドウ、5日間のペンディングデリート、リリース――そしてドロップされたドメインがフリッパーにとってどこに現れるか。"
ogImage: ../../assets/expired-domains-and-the-drop-cycle-og.jpg
keywords: ['期限切れドメイン', 'ドメインドロップサイクル', 'ドメインライフサイクル', '回復猶予期間', 'ペンディングデリート', 'ドメインドロップキャッチング', '期限切れドメイン名', 'ドメインの有効期限', 'ドロップドメイン', 'ドメインスナイピング', '期限切れドメインの取得', 'ドメイン回復期間', 'ドメインのドロップタイミング', 'ドメインバックオーダー', 'ドメイン転売用の発掘方法']
relatedArticles:
  - /ja/blog/domain-backorders-and-drop-catching/
  - /ja/blog/domain-flipping/
  - /ja/blog/how-to-win-domain-auctions/
  - /ja/blog/hand-registering-domains-to-flip/
  - /ja/blog/when-to-drop-a-domain/
relatedTopics:
  - /ja/topics/domain-investing/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
  - /ja/glossary/dns/
  - /ja/glossary/registry/
---

有効期限が切れたドメインは翌朝すぐに市場に戻ってくると思っている人が多い。しかし実際にはそうではない。誰にも更新されなかったドメイン名は、複数週にわたる固定の保留状態を経由してから、[レジストリ](/ja/glossary/registry/)が再び利用可能なプールに解放する。誰が、いくらで回復できるかはステージごとに異なる。その最終的な解放が「[ドロップ](/ja/glossary/pending-delete/)」であり、名前が解放された瞬間に登録する行為は確立した手法として知られている。Wikipediaの定義によれば、[ドメインドロップキャッチング（ドメインスナイピングとも呼ばれる）とは、ドメイン名の登録が失効した直後、期限切れと同時に登録する行為である](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)。

フリッパーがこの市場に注目するのは、ドロップされたドメインが白紙状態ではないからだ。ドロップまで到達したということは、誰かがかつて登録し、使用し、手放したということを意味する。そのため、ドメイン年齢、被リンク、残存トラフィック、あるいは自分が手動登録しようとしていた文字列がすでに取得済みだったという経緯を持つことがある。このサイクルは、かつて誰かが必要としたと証明されたドメイン名のリサイクルストリームだ。新規文字列とはリスクプロファイルが異なり、[転売向けドメインの発掘方法](/ja/blog/how-to-find-domains-to-flip/)で解説するサプライチャネルのひとつでもある。本記事ではライフサイクルをステージごとに解説し、ドロップされたドメインがどこに現れるか、そしてフリッパーがどのようにキャッチを狙うかを説明する。

## ステージ1：アクティブ登録と更新ウィンドウ

ドメインは完全に「所有」するものではない。一定期間で登録し、継続するためには更新が必要だ。[gTLD](/ja/glossary/gtld/)の登録期間には上限があり、Wikipediaによれば[gTLDドメイン名の最大登録期間は10年である](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)。期間が終了しても保有者が更新しなければ、ドロップサイクルのカウントダウンが始まる。

まず理解しておくべきは、「期限切れ」と「利用可能」は別物だということだ。有効期限が切れた時点でも、[登録者](/ja/glossary/registrant/)は誰よりも強い権利を持っている。レジストリは名前をすぐには削除しない。自動更新処理が行われ、レジストラは支払いを回収するかキャンセルするかの窓口期間を与えられる。[`.com`](/ja/tld/com/)の名前空間では、これを**自動更新猶予期間（Auto-Renew Grace Period）**と呼び、Verisignの拘束力あるレジストリ契約によってその期間が定められている。[自動更新猶予期間の現行値は45暦日である](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20value%20of%20the%20Auto%2DRenew%20Grace%20Period%20is%2045%20calendar%20days)。他のgTLDも同様の構造を持つが、特定のレジストリが異なる値を設定することもあるため、`.com`を参照ケースとして扱い、普遍的な法則と見なさないこと。

この期間中、多くのレジストラはサイトの名前解決を停止してプレースホルダーページを表示するが、名前は元の所有者のために保持されており、通常は標準価格前後で更新できる（遅れるほど延滞手数料が増える傾向がある）。原則は変わらない：有効期限直後は失効した元の所有者が優先権を持ち、ツールで「期限切れ」と表示されている名前はまだキャッチできない状態が多い。これはまた、ドメインを保持するもっとも安い方法が期限内に更新することである理由でもある。単純な`.com`の標準更新費用は低く抑えられており、Wikipediaによれば[小売価格は一般に年間約9.70ドルから約35ドルの範囲である](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=the%20retail%20cost%20generally%20ranges%20from%20a%20low%20of%20about%20%249.70%20per%20year)。この費用を誰も払わなかった場合に、以下のプロセスが始まる。

## ステージ2：回復猶予期間（リデンプション・グレース・ピリオド）

![砂時計の中に吊るされたドメイン名タグとカウントダウンダイヤルのイラスト。時間が切れる前に回復手数料を支払おうとしている手が描かれている](../../assets/expired-domains-and-the-drop-cycle-01-redemption.jpg)

猶予期間が更新なしに終了すると、レジストラはドメインを**[回復猶予期間（Redemption Grace Period）](/ja/glossary/grace-period/)**と呼ばれる回復ウィンドウへ削除する（[WHOIS](/ja/glossary/whois/)やEPPのステータスでは「[redemption period](/ja/glossary/redemption-period/)」や`redemptionPeriod`と表示されることもある）。このステージは多くの人を驚かせる。元の所有者はまだ名前を取り戻せるが、今度は実際のコストが発生し、正式なステータス変更が伴うからだ。[ICANN](/ja/glossary/icann/)自身が[30日間の回復猶予期間（RGP）](https://www.icann.org/resources/pages/grace-2013-05-03-en#:~:text=30%2Dday%20Redemption%20Grace%20Period%20%28RGP%29)に言及しており、登録者向けFAQでは、ドメイン名が削除された場合、[そのドメイン名は30日間の回復期間に入る](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20enter%20into%20a%20redemption%20period%20for%2030%20days)と確認している。`.com`の拘束力ある契約でも同じ日数が定められており、[この回復期間の現行の長さは30暦日である](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20length%20of%20this%20Redemption%20Period%20is%2030%20calendar%20days)。

フリッパーにとって実際に重要な点は2つある。第一に、30日という数字は一般的なgTLDのベースラインであり、普遍的な定数ではない。Wikipediaによれば、[この期間の長さはTLDによって異なり、通常は30〜90日程度である](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=usually%20around%2030%20to%2090%20days)。第二に、回復期間中の取り戻しは意図的にコストが高く設定されている。クリックひとつで更新できるわけではなく、ICANNのルールでは、[30日間の回復猶予期間中のドメイン名は、ウィンドウが閉じる前に回復（または更新）できる](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=Domain%20names%20that%20are%20in%20the%2030%2Dday%20Redemption%20Grace%20Period%20can%20be%20redeemed)が、レジストラは通常、更新料に加えて高額の回復手数料を請求する。Wikipediaでは、所有者が[ドメインを再アクティブ化・再登録するために手数料（通常約100米ドル）の支払いを求められる場合がある](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=may%20be%20required%20to%20pay%20a%20fee%20%28typically%20around%20US%24100%29)と記している。この手数料は意図的に設けられたものだ。本当に忘れていた所有者には最後のチャンスを与えつつ、サイクルを悪用することへのコストを高める役割がある。

ドメインを回復期間中に観察しているバイヤーにとっての教訓は「焦らず待つ」ことだ。回復期間中のドメインはキャッチできず、公開市場での売買もできない。法的にはまだ失効した元の所有者が回復する権利を持っている。「ほぼ無料」に見えるドメインの多くがこのウィンドウにあり、元の登録者は失効に気づいた後、まともな名前の相当数を取り戻す。回復期間中に期待を膨らませることが、ドロップに失望する最もよくあるパターンだ。

## ステージ3：ペンディングデリート

回復されないまま回復期間が終わると、ドメインはリリース前の最後の保留状態に入る。それがペンディングデリートだ。この短い、固定された封鎖期間中は誰も登録や回復ができない。元の所有者も、あなたも。`.com`の契約にはトリガーとロックが明確に記されている。[ドメイン名は、回復猶予期間中に復旧されなかった場合にPENDING DELETE状態に置かれ](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=A%20domain%20name%20is%20placed%20in%20PENDING%20DELETE%20status%20if%20it%20has%20not%20been%20restored%20during%20the%20Redemption%20Grace%20Period)、この状態のドメインに対するレジストラからの変更リクエストはすべて拒否される。このステージはレジストリが削除までのカウントダウンをきれいに刻むためだけに存在する。

この期間の長さは、サイクル全体の中で最も固定された数字だ。ICANNの登録者向けFAQでは、回復されなかった名前は[5日間のPendingDelete状態に入る](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=will%20enter%20into%20PendingDelete%20status%20for%205%20days)とされており、`.com`レジストリ契約でも[このペンディングデリート期間の現行の長さは5暦日である](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20length%20of%20this%20Pending%20Delete%20Period%20is%20five%20calendar%20days)と確認されている。Wikipediaも同じウィンドウに言及しており、その後[ドメインはICANNデータベースからドロップされる](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=phase%20of%205%20days%2C%20the%20domain%20will%20be%20dropped%20from%20the%20ICANN%20database)。この5日間はフリッパーにとって最も有用なシグナルだ。ペンディングデリートは終了時刻が予測可能な唯一のステージだからだ。狙っているドメインが一度このステージに入れば、リリース時刻を1時間単位でほぼ計算できる。その予測可能性がドロップをくじ引きから計画可能なものへと変える。追う価値のある名前は5日前に自分のリリース日を告知するようなものだ。

## ステージ4：リリース、そしてキャッチの争奪戦

![複数の自動化されたロボットサーバーが開いたゲートを抜けて、リリースされた瞬間に落下する単一のドメインタグを取ろうと競い合うイラスト](../../assets/expired-domains-and-the-drop-cycle-02-release-scramble.jpg)

ペンディングデリートが終わると、名前はレジストリから削除され、利用可能なプールに戻る。ICANNのガイダンスはシンプルだ。回復期間とペンディングデリート期間を経た後、[ドメイン名はリリースされ、先着順で登録可能になる](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20be%20released%20and%20made%20available%20for%20registration%20on%20a%20first%2Dcome%2Dfirst%2Dserved%20basis)。理論上は、この瞬間に誰でも標準料金で登録できる。しかし実際には、需要のある名前はレジストラの検索ボックスに手入力している人間のもとにほぼ届かない。まさにこの瞬間のために構築された自動化システムが競争を繰り広げるからだ。

ここで[ドロップキャッチング](/ja/glossary/backorder/)サービスの出番となる。自分で検索を更新して待つのではなく、これらのオペレーターはインフラをレジストリに向け、名前がリリースされたマイクロ秒に登録リクエストを発射する。Wikipediaによれば、[これらのサービスはドメイン名が利用可能になった時点でサーバーをその確保に集中させることを提供し、通常はオークション価格で行う](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=These%20services%20offer%20to%20dedicate%20their%20servers%20to%20securing%20a%20domain%20name%20upon%20its%20availability)。そして手動でやっている相手には安定して勝てる。Wikipediaはその非対称性について率直だ。[限られたリソースしか持たない個人は、人気のある名前においてこれらのドロップキャッチ企業と競争することが難しい](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=Individuals%20with%20their%20limited%20resources%20find%20it%20difficult%20to%20compete%20with%20these%20drop%20catching%20firms)。複数のサービスが異なるクライアントのために同じ名前をキャッチした場合、それはサービス間のプライベート[オークション](/ja/glossary/auction/)に回される。つまり、競合する名前を「キャッチ」するとは、通常、登録料を払うことではなく入札に勝つことを意味する。

フリッパーへの率直な見解：本当に良い名前については、自分でドロップをキャッチするのではなく、キャッチを「雇う」のだ。サイクルを理解することで、名前がいつ取得可能になるか、そしてそれが何の価値があるかがわかる。実際のキャプチャはバックオーダーまたはドロップキャッチサービスを通じて行われる。詳しくは[ドメインバックオーダーとドロップキャッチング](/ja/blog/domain-backorders-and-drop-catching/)で解説している。

## ドロップされたドメインが現れる場所

![中央の虫眼鏡ハブから4つのチャネル（ドロップリスト、バックオーダーチケット、オークションの槌、アフターマーケットストア）へと枝分かれし、それぞれがドメインタグを運ぶイラスト](../../assets/expired-domains-and-the-drop-cycle-03-where-surface.jpg)

サイクルを知っているだけでは不十分だ。どこを見ればいいかを知らなければ意味がない。ドロップ済みおよびドロップ間近の名前はいくつかの予測可能な場所に現れ、実用的なソーシング（調達）ルーティンは通常これらを複数組み合わせる。

- **ドロップリストと期限切れドメインデータベース。** 公開または有料のリストが毎日ペンディングデリートに入る名前を公開しており、文字数、[TLD](/ja/glossary/tld/)、キーワード、年齢、リンクメトリクスなどでフィルタリングできることが多い。まもなくリリースされる名前のウォッチリストのための生データフィードだ。
- **バックオーダーおよびドロップキャッチプラットフォーム。** 自分でカレンダーを監視する代わりに、バックオーダーを入れてサービスにリリース時の競争を代行させる。需要があるものを狙うには現実的なルートだ。詳しくは[ドメインバックオーダーとドロップキャッチング](/ja/blog/domain-backorders-and-drop-catching/)を参照。
- **期限切れドメインオークション。** 多くのレジストラは価値のある期限切れインベントリをパブリックドロップに出さず、猶予ウィンドウ中または終了後に自社の期限切れオークションに回す。名前はリリースではなく販売される形になる。これは[ドメインオークションで勝つ方法](/ja/blog/how-to-win-domain-auctions/)で説明するより広いチャネルとも重なる。
- **アフターマーケット。** 他の誰かにキャッチされた名前や、回復されて再出品された名前は、[アフターマーケット](/ja/glossary/aftermarket/)で再販される。ドロップそのものではないが、ドロップ後のインベントリの多くはここに行き着く。

フリッパーの優位性は、チャネルを名前に合わせることにある。競争の少ない文字列がパブリックドロップリストにあれば、手動登録に近い良い勝負になる。一方、プレミアムな一語ドメインはバックオーダーとおそらくオークション予算が必要だ。代わりに新規文字列を登録する方法を選ぶなら、それも正当な別のルートだ。[転売目的のドメイン手動登録](/ja/blog/hand-registering-domains-to-flip/)で説明している。

## フリッパーとしてのサイクルの読み方

各ステージを合わせて見ると、ドロップサイクルはミステリーではなく、行動のための時刻表になる。メカニズムから直接導き出せるルールが2つある。

**有効期限ではなくペンディングデリートを監視せよ。**「期限切れ」は「利用可能」ではない。失効した所有者は[自動更新](/ja/glossary/domain-renewal/)ウィンドウを通じて最初の請求権を持ち、回復期間中はコストがかかるものの名前を取り戻せる。価値のある名前の多くは、所有者が失効に気づいた時点で回復される。ペンディングデリートまで生き残るのは、所有者が本当に手放した名前に偏っている。この5日間のウィンドウは固定されているため、正確にタイミングを計れる唯一のステージだ。だからこそバックオーダーサービスはこの段階に全オペレーションを合わせている。

**デューデリジェンスは名前と一緒についてくる。** ドロップされた名前はその歴史を引き継ぐ。そして歴史がすべて良いとは限らない。古い名前に入札する前に、過去の使われ方、[WHOIS](/ja/glossary/whois/)と所有権の履歴、[レジストラ](/ja/glossary/registrar/)のロック、かつて問題のあるコンテンツを掲載していないかを確認すること。かつてブランドを侵害していた名前は、あなたが保有していても[UDRP](/ja/glossary/udrp/)の申し立てを受ける可能性がある。既存のバックリンクはゴールドと同様にスパムである可能性がある。ドロップは資産を渡すと同時に、その荷物も渡す。

サイクルは、これを運ではなく配管設備として扱う人を報いる。タイミングは公開されており、ステージは固定されており、名前はスケジュール通りに出てくる。ソーシングの優位性と更新の無駄な繰り返しを分けるのは、どのドロップする名前が取る価値があるかを知ること、つまりタイミングではなく評価のスキルだ。これは[ドメインフリッピング](/ja/blog/domain-flipping/)シリーズで描く大きな技術の中の上流サプライステップだ。

## Namefiの視点

優れたドロップドメインをキャッチすることは仕事の半分に過ぎない。次の取引の際には、高額な[ドメイン取引](/ja/glossary/domain-trading/)すべてが直面する同じ摩擦にぶつかる。バイヤーは名前が移転する前に支払わず、セラーは代金を受け取る前に移転しない。そしてレジストラ間での[認証コード](/ja/glossary/auth-code/)の引き渡しが中間に不安なギャップを生む。この膠着状態こそが[エスクロー](/ja/glossary/escrow/)が存在する理由であり、年数の積み重なったリンク豊富な名前になるほど問題は鋭くなる。

[Namefi](https://namefi.io)はこのギャップを縮めるために構築されている。トークン化された所有権により、実際のICANNドメインの管理と移転が容易に検証でき、[DNS](/ja/glossary/dns/)の連続性によってドロップでキャッチした名前をフリップした後もクリーンに名前解決が続く。ドロップサイクルからソーシングするフリッパーにとって、出口での決済摩擦が少ないほど、苦労してキャッチした名前が実際のクローズド取引に変わる確率が高まる。

## 免責事項（必ずお読みください）

> 私たちは弁護士でも会計士でも財務アドバイザーでも医師でもなく、**本記事のいかなる内容も、法的・財務的・税務的・会計的・医療的、またはその他の専門的なアドバイスを構成するものではありません。** これらの記事は自己教育と顧客の利便性を目的として執筆しています。ここに記載された情報は古くなっていたり、特定の地域にのみ該当したり、単純に誤りである可能性もあります。私たちも間違いを犯すことがあります。
>
> 重要な意思決定の際は、**必ず専門家にご相談ください（本当に！）**。それが合わない場合は、友人、Twitter、Reddit、AI、あるいは占い師に聞いてみてください。要するに：**DOYR（Do Your Own Research＝自分で調べる）**。一緒に学び、楽しみましょう。

## 出典および参考資料

- ICANN — [.com レジストリ契約、付録7（自動更新猶予期間45日、回復期間30日、ペンディングデリート5日）](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20value%20of%20the%20Auto%2DRenew%20Grace%20Period%20is%2045%20calendar%20days)
- ICANN — [登録者向けFAQ：ドメイン名の更新と有効期限（30日の回復期間、5日のPendingDelete、先着順リリース）](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20enter%20into%20a%20redemption%20period%20for%2030%20days)
- ICANN — [回復猶予期間中のドメイン名の回復について（30日のRGP）](https://www.icann.org/resources/pages/grace-2013-05-03-en#:~:text=30%2Dday%20Redemption%20Grace%20Period%20%28RGP%29)
- Wikipedia — [ドメインドロップキャッチング（ドロップ/スナイピングの定義、回復期間は通常30〜90日および約100米ドルの手数料、5日間のペンディングデリート、ドロップキャッチサービス）](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)
- Wikipedia — [ドメイン名レジストラ（gTLD最大10年の登録期間、`.com`の小売価格）](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)
- Wikipedia — [ドメイン名投機（ドメイニングとドメインフリッピング）](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=is%20the%20practice%20of%20identifying%20and%20registering%20or%20acquiring%20generic%20Internet%20domain%20names%20as%20an%20investment)
