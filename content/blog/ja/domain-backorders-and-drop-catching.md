---
title: "ドメインのバックオーダーとドロップキャッチ、わかりやすく解説"
date: '2026-06-21'
language: ja
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 4
format: explainer
description: "ドメインのバックオーダーとドロップキャッチとは何か、名前が解放された瞬間にサービスがいかにして奪い取るか、そしてバックオーダーにお金を払う価値があるのはどんなケースかを解説します。"
ogImage: ../../assets/domain-backorders-and-drop-catching-og.jpg
keywords: ['ドメイン バックオーダー', 'ドロップキャッチ', 'ドメイン バックオーダー 方法', '期限切れドメイン 取得', 'DropCatch', 'SnapNames', 'NameJet', 'Park.io', 'Dynadot バックオーダー', 'ドメイン ドロップキャッチ サービス', 'レデンプショングレースピリオド', 'ペンディングデリート ドメイン', 'ドメイン ドロップ タイミング', '期限切れドメイン オークション', '登録済みドメイン 取得方法']
relatedArticles:
  - /ja/blog/expired-domains-and-the-drop-cycle/
  - /ja/blog/how-to-win-domain-auctions/
  - /ja/blog/when-to-drop-a-domain/
  - /ja/blog/domain-flipping/
  - /ja/blog/hand-registering-domains-to-flip/
relatedTopics:
  - /ja/topics/domain-investing/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
  - /ja/glossary/dns/
  - /ja/glossary/registry/
---

欲しいドメインがすでに他人に登録されている。現在のオーナーは売るつもりもなく、連絡しても返事がなく、どうやら使ってすらいないようだ。そうなると残る手段はただ一つ——相手が更新を忘れるのを待つことだ。登録が失効し、その名前が再び空き状態に戻った瞬間、真っ先にそこに立っていられるかどうかが勝負になる。

これがバックオーダーと[ドロップキャッチ](/ja/glossary/backorder/)の根本にある発想だ。どちらも、今は買えないドメインに賭ける方法であり、名前が空きになった瞬間に登録できることを狙っている。両者は同じものではなく、その違いは重要だ。そして「お金を払う価値があるか?」という問いに対する正直な答えは、ほとんどの場合「ノー」だ。この解説記事では、それぞれが何であるか、名前が解放される瞬間にどんなレースが起きるか、主要サービスの概要、そしてバックオーダーにお金を払う意味がある限られたケースを説明する。これは[ドメインフリッピングスキルシリーズ](/ja/blog/domain-flipping/)の一部であり、[フリップするドメインの見つけ方](/ja/blog/how-to-find-domains-to-flip/)についての記事とも連動している。

## まず、なぜドメインが「ドロップ」するのか

![ドメイン名がグレースピリオドの各段階を経て空きプールに落ちるまでのタイムラインを示したエディトリアルイラスト](../../assets/domain-backorders-and-drop-catching-01-drop-cycle.jpg)

ドメインの有効期限が切れても、すぐに一般登録へ戻るとは限りません。レジストリ、レジストラ、拡張子によって手続きが異なります。一般削除の前に期限切れオークションへ進むドメインもあります。

対象のgTLDでは、[ICANNの方針](https://www.icann.org/en/contracted-parties/consensus-policies/expired-registration-recovery-policy/expired-registration-recovery-policy-21-02-2024-en)が削除後30日間の復旧猶予期間を求めています。スポンサー付きgTLDのレジストリは、この要件の対象外です。元の登録者は、削除を行ったレジストラに復旧を申請できます。レジストラは復旧料金を公表する必要があります。国別ドメインには別の規則が適用される場合があります。

復旧しない場合、ドメインは最終的な削除待ち段階へ進むことがあります。[ICANNの状態コード説明](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)によると、最終的な`pendingDelete`状態が５暦日続いた後、レジストリがドメインを削除します。その後、一般登録が可能になります。有効期限だけでは公開日を確定できません。

## ドロップキャッチ：ミリ秒の勝負

![複数のサーバーアームが、単一のドメイン名タグが解放された瞬間に奪い合い、ストップウォッチが秒以下を刻んでいるエディトリアルイラスト](../../assets/domain-backorders-and-drop-catching-02-millisecond-race.jpg)

ドロップキャッチは力技のアプローチだ——自分が（現実的にはサービスが代わりに）文字通りその名前が削除された瞬間に登録を試みる。Wikipediaの定義はシンプルで、ドロップキャッチ（ドメインスナイピングとも呼ばれる）とは[登録が失効した後、期限切れ直後にドメイン名を登録する行為](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)だ。

これを手作業で勝つことはできない。良いドメイン名は予測可能なスケジュールで削除され、プロのサービス勢が同じ瞬間にレジストリを叩いている。ドメイン投機の文献には、[レジストリによって削除されたドメイン名を登録するビジネスはドロップキャッチとして知られており、非常に競争の激しいビジネスだ](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=The%20business%20of%20registering%20the%20domain%20names%20as%20they%20are%20deleted%20by%20the%20registries%20is%20known%20as%20drop%20catching.%20It%20is%20a%20highly%20competitive%20business)とある。そのスピードは残酷なほど速く、[ドロップからキャプチャまでの時間は、多くの場合、数秒またはそれ以下で測られる](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=The%20time%20between%20a%20drop%20and%20a%20capture%20is%20often%20measured%20in%20seconds%20or%20fractions%20thereof)。

最終価格をオークションが決める場合があります。[NameJet](https://www.namejet.com/userguide.action)と[SnapNames](https://www.snapnames.com/userguide.action)のガイドは、事前依頼のない参加者を含む公開オークションの可能性を明記しています。対象の出品を確認してください。バックオーダーだけでは、参加者を限定できません。

## バックオーダーは取得の試行を依頼する注文です

![取得経路、オークション規則、予算を示す注文前の確認表](../../assets/domain-backorders-and-drop-catching-04-order-checks.jpg)

バックオーダーは、サービスにドメイン取得の試行を依頼する注文です。一般削除では、サービスも他の登録システムと競争します。バックオーダーは、他社に対する共通の優先権を与えません。前払い、決済承認、入札の義務は各社の規則に従います。

[Dynadot](https://www.dynadot.com/help/question/place-a-backorder)は取得成功を保証していません。複数の依頼があると、オークションになる場合があります。[NameJet](https://www.namejet.com/userguide.action)は提携レジストラの期限切れ在庫と一般削除待ちの在庫を区別しています。一般公開されないドメインを、独立したサービスが新規登録することはできません。

## あなたの代わりに競争するサービス

ほとんどのフリッパーは、一握りのプラットフォームを通じてドロップキャッチと関わることになる。それぞれが重複しつつも拡張子ごとに特化しており、どれが最適かはドメインの登録先と[TLD](/ja/glossary/tld/)によって異なる。

- **DropCatch**は[`.com`](/ja/tld/com/)などのレガシーgTLDにおける最も知名度の高い純粋なドロップキャッチプラットフォームだ。ペンディングデリート状態の名前をバックオーダーすると、サービスがレジストラ群を削除タイミングに向けて投入する。複数のユーザーが同じ名前をバックオーダーしていた場合はオークションで決着する。公開削除を大規模にキャッチするためのデフォルト選択肢だ。
- **SnapNames**と**NameJet**は、古典的な有効期限切れオークション仲介業者——上述の[SnapNamesとNamejet](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=instead%20introducing%20an%20intermediary%20%28e.g.%2C%20Snapnames%20and%20Namejet%29)だ。パートナーレジストラが期限切れのドメインを先にルーティングしてくるため、公開ドロップされない名前に強い。目当ての名前がそのパートナーレジストラにある場合、ここに出てくることになる。
- **Dynadot**は通常のレジストラ機能にバックオーダーや有効期限切れオークションサービスも備えており、普段登録するのと同じ場所でキャッチを予約できる。ちなみにWikipediaによれば、[ICANNの認定を受けたドメインレジストラ兼ウェブホスティング会社で、2002年にソフトウェアエンジニアのTodd Hanが設立した](https://en.wikipedia.org/wiki/Dynadot#:~:text=is%20an%20ICANN%2Daccredited%20domain%20registrar%20and%20web%20host%20company%20founded%20by%20software%20engineer%20Todd%20Han%20in%202002)とされている。
- **Park.io**は、新しい拡張子や国コード拡張子のキャッチで評判を築いた——汎用キャッチャーのカバレッジが薄くなる種類の名前だ。メジャーでないTLDの名前を狙っているなら、スペシャリストが唯一の現実的な選択肢になることが多い。

注文前に取得経路と支払い義務を確認してください。一般削除では、独立した複数のサービスを使うと、登録システムの選択肢が増えます。独占在庫では、出品を管理するプラットフォームを利用します。複数への依頼が必ず無駄な支出になるわけではありません。

## バックオーダーに実際にお金を払う価値があるケース

バックオーダーは安くて入れやすく、だからこそ入れ過ぎてしまうのが罠だ。以下が正直なフィルターだ。

**名前が本当に希少で、具体的な用途があるときはお金を払え。** クリーンな一語の`.com`、短いブランダブル名、実際に構築しているプロジェクトの完全一致名は、バックオーダー料金と相応のオークション予算をかける価値がある。公開ドロップすれば争奪戦になり、キャッチャーなしでは失うからだ。実証可能な歴史のある熟成ドメイン——ハンドオフ後も残る既存のバックリンクやトラフィック——も同様だ。これは[フリップのために新しいドメインを手動登録する](/ja/blog/hand-registering-domains-to-flip/)のとは別の調達チャネルだ。

**名前が本当に希少でないならスキップせよ。** ほぼ同じ文字列が今すぐ通常の登録料で手動登録できるなら、期限切れのバージョンにバックオーダー料を払いオークションリスクを取るのはたいてい割の悪い取引だ。ドロップが意味を持つのは、*その特定の名前*こそが資産であり、代替が利かない場合に限る。

**負けるかもしれないと想定して、それを踏まえた予算を組め。** バックオーダーは試みであって、購入ではない。魅力的な名前ではキャッチ後のオークションで負けることもあるし、より強力なサービスに先を越されることもある。料金はそこそこの勝率の宝くじコストとして計上し、すでに自分のものの頭金とは考えないこと。

**商標のラインに気をつけろ。** 期限切れの名前をキャッチしても、その歴史が消えるわけではない。その文字列が誰かのブランドであれば、失効したからといって取得・転売が安全になるわけではない。[UDRP](/ja/glossary/udrp/)の枠組みは依然として適用され、期限切れの[商標](/ja/glossary/trademark/)名こそ紛争を引き起こしやすい——[UDRPとは何か](/ja/blog/what-is-udrp/)で詳しく解説している。キャッチすべきはジェネリックでブランダブルな名前であり、失効したブランド名ではない。

キャッチされた名前に特有のもう一つのデューデリジェンス上の注意点がある——[期限切れドメイン](/ja/blog/buy-expired-domains/)は、新規登録ではありえないような負の遺産を抱えている場合がある。スパム歴やGoogleのペナルティなどだ。強く入札する前に、[WHOIS](/ja/glossary/whois/)とアーカイブ記録でその過去を確認すること。名前の歴史は名前とともに引き継がれる。

## キャッチ後：実際の所有権を得るまで

キャッチに勝つことはゴールではなく、スタートだ。名前は、キャッチしたレジストラのアカウントに入ってくる。それをクリーンで売却可能な資産にするには、本当の意味での[所有権のコントロール](/ja/glossary/domain-ownership/)を確立する必要がある——[認証コード](/ja/glossary/auth-code/)の取得、自分のホームレジストラへの[クロスレジストラ転送](/ja/glossary/cross-registrar-transfer/)の実行、そして[WHOIS](/ja/glossary/whois/)とDNSが自分のものになっていることの確認だ。この引き渡しこそ、高価値ドメインで神経を使う部分だ。というのも、どちらも先に動きたくないという膠着状態がすべての[ドメイン取引](/ja/glossary/domain-trading/)に付きまとうからだ。

このハードルを減らすために[Namefi](https://namefi.io)は設計されている。トークン化された所有権によって、実際の[ICANN](/ja/glossary/icann/)ドメインのコントロールを検証・移転しやすくし、引き渡しの過程でもキャッチした名前のDNSが切れずに解決し続けるようにする。転売する際の標準的な手順——リスティング、価格設定、中立的な[エスクロー](/ja/glossary/escrow/)によるハンドオフ——については、[所有するドメインを売る方法](/ja/blog/how-to-sell-a-domain-name-you-own/)と[ドメインエスクローの解説](/ja/blog/domain-escrow-explained/)で詳しく説明している。

## まとめ

バックオーダーは取得の試行を依頼する注文です。成功や全サービスに対する優先権を保証しません。取得経路、オークション規則、総予算を確認してください。割り当ての完了とアカウントへのアクセスを確認してから、取得成功と判断してください。

## 免責事項（必ずお読みください）

> 私たちは弁護士でも会計士でも、ファイナンシャルアドバイザーでも医師でもありません。**この記事の内容は、法的・財務・税務・会計・医療その他いかなる種類の専門的アドバイスでもありません。** これらの投稿は自分たちの学びのため、また顧客の利便性のために書いています。情報が古くなっていたり、特定の地域にしか当てはまらなかったり、単純に間違っている可能性もあります。私たちも間違えます。
>
> 重要な判断には、**必ず実際のプロに相談してください（本当に！）。** それが好みでなければ、友人に聞いても、Twitterに聞いても、Redditに聞いても、AIに聞いても、占い師に聞いても構いません。要するに、**DOYR — Do Your Own Research（自分でリサーチせよ）**。一緒に学んで、楽しみましょう。

## これらの資料で注文条件を確認できます

資料の確認日：2026年10月21日。

- [ICANN](https://www.icann.org/en/contracted-parties/consensus-policies/expired-registration-recovery-policy/expired-registration-recovery-policy-21-02-2024-en)
- [ICANN EPP](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)
- [Dynadot](https://www.dynadot.com/help/question/place-a-backorder)
- [NameJet](https://www.namejet.com/userguide.action)
- [SnapNames](https://www.snapnames.com/userguide.action)
