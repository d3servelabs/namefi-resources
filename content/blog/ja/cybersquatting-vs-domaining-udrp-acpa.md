---
title: "サイバースクワッティングと正当なドメイン投資の違い：UDRPとACPAを徹底解説"
date: '2026-06-21'
language: ja
tags: ['domains', 'security', 'domain-flipping', 'explainer']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-flipping-skills
seriesOrder: 17
format: explainer
description: "正当なドメイン投資がどこで終わり、サイバースクワッティングが始まるのか：UDRPの3要件テスト、ACPA、逆ドメインハイジャック、そして安全に取引するための実践知識。"
ogImage: ../../assets/cybersquatting-vs-domaining-udrp-acpa-og.jpg
keywords: ['サイバースクワッティング', 'サイバースクワッティングとドメイン投資の違い', 'UDRP', 'UDRP 3要件テスト', 'ACPA', 'サイバースクワッティング消費者保護法', '逆ドメインネームハイジャック', 'RDNH', '不正登録 ドメイン', 'ドメインフリッピングは合法か', '商標 ドメイン紛争', 'ドメイン紛争解決', '正当なドメイン投資', 'WIPO UDRP', 'ドメイン投資 法律']
relatedArticles:
  - /ja/blog/what-is-udrp/
  - /ja/blog/domain-flipping-and-the-law/
  - /ja/blog/domain-flipping/
  - /ja/blog/hand-registering-domains-to-flip/
  - /ja/blog/how-to-sell-a-domain-name-you-own/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-investing/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/domain-investor-field-guide/
relatedGlossary:
  - /ja/glossary/icann/
  - /ja/glossary/registrar/
  - /ja/glossary/tld/
  - /ja/glossary/dns/
  - /ja/glossary/registry/
---

2人の人物が同じ目的でドメインを登録したとする。1人は `solarpanels.com` を取得した。これは業界内の誰もが必要としうる一般的な表現だ。もう1人は `nike-running-shoes.net` を取得した。このドメインが存在意義を持つのは、ひとえにNikeが存在するからにほかならない。表面上は同じ行為でも、法律上の立場はまるで異なる。前者は普通の[ドメイン投資](/ja/glossary/domaining/)だ。後者は[サイバースクワッティング](/ja/glossary/cybersquatting/)であり、その名前を登録者から取り上げるために設計された2つの強力な制度がある。

このギャップこそが、このビジネスにおける最重要な境界線だ。そして最も知らず知らずに踏み越えやすい線でもある。本稿ではその境界を詳しく解説する。サイバースクワッティングの定義、UDRPがドメインを取り戻すために用いる3つの要件からなる連結テスト、米国の[ACPA](/ja/glossary/acpa/)が加える金銭的損害賠償、そして多くの記事が見落とすもう一方の話、つまりブランドが正当な所有者に対して制度を悪用する「逆ドメインネームハイジャック」まで扱う。本稿は、[ドメインフリッピングと法律](/ja/blog/domain-flipping-and-the-law/)および[ドメインフリッピング](/ja/blog/domain-flipping/)シリーズの法的リスク解説として位置づけられる。

> **法的アドバイスではありません。** 本稿はドメイン所有者向けの一般的な情報提供を目的としており、法的アドバイスではありません。結果は具体的な事実関係によって異なります。申し立てを受けた場合や申し立てを検討している場合は、資格のある弁護士にご相談ください。

## サイバースクワッティングとは何か

サイバースクワッティングとは「他者が欲しがっているドメインを登録すること」ではない。他者の[商標](/ja/glossary/trademark/)を利用する目的でドメインを登録することだ。Wikipediaの定義が端的にまとめている。それは[他者の商標の信用から利益を得ようとする不正な意図をもって、インターネットドメイン名を登録・売買・使用する行為](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)だ。この一文のすべての言葉が重要だ。行為（登録、売買、使用）の範囲は広い。意図（[不正な意図](/ja/glossary/bad-faith/)、利益目的）が引き金となる。そして対象は具体的だ。市場全体が共有する一般的な言葉ではなく、*他者が所有する商標*が標的となる。

正当なドメイン投資は、この意図の境界線の反対側にある。一般的・説明的な名前や独自に造られた名前を購入して転売することは、長い歴史を持つ正当な取引だ。`solarpanels.com` のような[ドメイン](/ja/glossary/domain-ownership/)の価値は、業界全体にとって有益な言葉であることに由来する。特定企業の評判に乗っかっているわけではない。同様に、特定の商標とは無関係なブランダブルな造語や短い[`.com`](/ja/tld/com/)・[`.io`](/ja/tld/io/)ドメインにも同じことが言える。その資産価値はドメイン名という文字列そのものにあり、それが[ドメイン売買](/ja/glossary/domain-trading/)という正当なビジネスの本質だ。

問題が生じるのは、ドメインの価値が言葉そのものではなく*ブランドに由来している*場合だ。`tesla` にハイフンで接尾語をつけたドメイン、有名商標の意図的なスペルミス（[タイポスクワッティング](/ja/glossary/typosquatting/)）、あるいは新製品発表直後に新しい[TLD](/ja/glossary/tld/)でブランド名を登録する行為。こうした場合、あなたが捕捉しようとしているのは他者が築いた信用だ。それこそが以下の2つの制度が取り締まるものだ。

## UDRPの3要件連結テスト

![3つの南京錠が一列に並び、それぞれにチェックマークが付いて1本のチェーンでつながれ、1つのドメイン名タグが解放される様子を描いたイラスト](../../assets/cybersquatting-vs-domaining-udrp-acpa-01-three-locks.jpg)

最初かつ最もよく使われる制度が[UDRP](/ja/glossary/udrp/)（統一ドメイン名紛争解決方針）だ。すべての認定[レジストラー](/ja/glossary/registrar/)は登録時にこの方針への同意を求めるため、裁判所ではなく私的仲裁パネルがドメインの移転を命じることができる。プロセス全体のタイムラインと結果については[UDRPとは何か](/ja/blog/what-is-udrp/)で詳しく解説しているが、本稿ではテスト自体に焦点を当てる。ドメインフリッパーが勝敗を分けるのはまさにこのテストだからだ。

申し立て人は以下の**3つすべて**を立証しなければならない。これは*連結*テストであり、それがこの制度において最も重要な事実だ。どれか1つでも立証できなければ、他の2つがどれほど強力でも申し立ては却下される。

1. **同一または混同を生じさせるほど類似している。** 方針の文言によれば、[ドメイン名が申し立て人の所有する商標またはサービスマークと同一または混同を生じさせるほど類似していること](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark%20in%20which%20the%20complainant%20has%20rights)。実務上これは主として申し立て適格の確認として機能する。申し立て人が関連する商標を所有し、あなたのドメインがそれに類似しているかを確認するものだ。

2. **権利または正当な利益がない。** 第2の要件は、[登録者がドメイン名に対して何らの権利または正当な利益を有しないこと](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=The%20registrant%20does%20not%20have%20any%20rights%20or%20legitimate%20interests)を求める。真摯なビジネス利用、説明的な意味、非商業的な言論はいずれも正当な利益を基礎づけうる。だからこそ、ブランドに近接したドメインよりも一般的な名前の方がはるかに安全なのだ。

3. **不正な意図で登録・使用されている。** 第3の要件は、[ドメイン名が不正な意図で登録され、かつ不正な意図で使用されていること](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=The%20domain%20name%20has%20been%20registered%20and%20the%20domain%20name%20is%20being%20used%20in)を求める。**「かつ（and）」**という言葉を強調しておきたい。不正な意図は、登録時と使用時の*両方*に存在しなければならない。申し立て人の商標が存在する前から登録されていたドメインは、一般に不正な意図をもって登録されたとは言えない。存在しないブランドを標的にすることはできないからだ。

防御可能なポートフォリオが生き残るのはこの第3の要件においてだ。UDRPが認定する不正な意図のパターンは具体的だ。商標保有者に高値で売却することを主目的として登録すること、組織的なパターンの一環としてブランドが自ら使うドメイン名を塞ぐために登録すること、競合他社の業務を妨害するために登録すること、商標との混同を生じさせてトラフィックを誘導する目的で使用すること。重要なのは、*一般的・説明的なドメインを売りに出すこと自体は、それだけでは不正な意図とはならない*ということだ。ドメインを売ることは正当なビジネスだ。境界線は、言葉を取引していたのか、ブランドを標的にしていたのかにある。

フリッパーへの実践的な教訓は単純だ。辞書的な言葉を買え、商標は買うな。そして*なぜ*・*いつ*購入したかの記録を保持せよ。商標の成立前に遡る登録日が決定打となることは多い。

## ACPA：サイバースクワッティングが実際のお金を奪う

![裁判官の木槌の横で積み上がるコインの山と、それぞれドル記号の影を落とすドメイン名タグの列を描いたイラスト](../../assets/cybersquatting-vs-domaining-udrp-acpa-02-stacking-damages.jpg)

UDRPがドメインに対してできることは2つだけだ。移転か取り消しかだ。損害賠償はない。強硬なブランド、あるいは特に悪質なスクワッターに対して、米国はより鋭い制度を整備した。

[1999年](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=1999)に制定されたサイバースクワッティング消費者保護法（Anticybersquatting Consumer Protection Act）は、連邦法上の訴訟原因を創設した。Wikipediaが要約するように、ACPAは[商標または氏名と混同を生じさせるほど類似した、あるいは商標の希釈化をもたらすドメイン名を登録・売買・使用する行為に対する訴訟原因](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20cause%20of%20action%20for%20registering%2C%20trafficking%20in%2C%20or%20using%20a%20domain%20name%20confusingly%20similar)を確立した。法定基準はUDRPの意図要件を反映しており、[当該商標から利益を得ようとする不正な意図](https://www.law.cornell.edu/uscode/text/15/1125#:~:text=has%20a%20bad%20faith%20intent%20to%20profit%20from%20that%20mark)をもって識別力のある商標と同一または混同を生じさせるほど類似したドメインを登録・売買・使用する者に責任が課される。

重要な違いは救済手段にある。UDRPがドメインを移転するだけなのに対し、ACPAはあなたの財布を直撃しうる。勝訴した原告は[1ドメインにつき1,000ドル以上10万ドル以下の範囲で、裁判所が相当と認める額](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)の法定損害賠償を選択することができる。1ドメインにつきだ。ブランドのバリエーションをポートフォリオとして保有するスクワッターは、ドメインを失う上に、保有数に比例して膨れ上がる数字に直面することになる。

2つの実務的なポイントが続く。ACPAは米国法であり、当事者またはレジストラーに米国との関連がある場合に最も適用されるのに対し、UDRPはレジストラー契約によってグローバルに適用される。そして両者は排他的ではない。ブランドは迅速かつ安価なUDRPでドメインを取り戻しつつ、損害賠償のためにACPAに基づく訴訟も提起できる。正当なドメイン投資家にとって、これはおおむね安心材料だ。ACPAの不正意図要件は、UDRPの第3要件と同様に、善意による一般的な登録を保護するからだ。スクワッターにとっては、採算が合わない理由だ。

## 逆ドメインネームハイジャック：ブランドが悪者になるとき

![大企業のブランドシールドが、正当なドメインタグを手にした小さな人物を掴もうとしており、その人物が阻止するために警告の盾と旗を掲げる様子を描いたイラスト](../../assets/cybersquatting-vs-domaining-udrp-acpa-03-reverse-hijack.jpg)

境界線は双方向に機能する。そして「ドメインフリッピングは合法か」を論じる多くの記事が見落とすのがここだ。商標を保有していても、それに似たすべてのドメインに対して権利が生じるわけではない。ブランドが紛争解決プロセスを悪用して正当に保有されたドメインを奪おうとするとき、その行為には名前がある。逆ドメインネームハイジャックだ。

Wikipediaはこれを、[正当な商標保有者が、実際にはスクワッターではないドメイン名の「スクワッター」所有者に対してサイバースクワッティングの申し立てを行うことによりドメイン名を取得しようとする場合](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name%20by%20making%20cybersquatting%20claims)に生じると定義している。UDRPの規則はパネルにこれに対抗する手段を与えている。第15条(e)項のもとで、逆ドメインネームハイジャックの認定は、[不正な意図による申し立ての提起があり、UDRPの行政プロセスが濫用された](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=the%20filing%20of%20a%20complaint%20in%20bad%20faith%2C%20resulting%20in%20the%20abuse)場合になされる。

RDNH認定はドメイン所有者に金銭をもたらさないが、申し立て人の信用を傷つける公的な非難であり、以後の紛争や訴訟における申し立て人の立場を弱める。典型的な引き金となるのは、一般的な名前を欲しがったブランドが購入の機会を逃し、UDRPを近道として使い、本来は買うべきものを奪おうとするケースだ。申し立てを暴く事実パターンは通常シンプルだ。商標の成立前にドメインが登録されていれば、不正な意図による登録は不可能だ。クリーンな一般的ドメインを保有するドメイン投資家にとって、応答でRDNHを主張することは実質的な防御手段となる。なおこれは、セキュリティ上の[ドメインハイジャック](/ja/blog/how-domain-hijacking-actually-happens/)とは別物だ。後者は法的プロセスへの応答ではなく、防止すべき攻撃だ。

## 安全な側に留まるために

安全でいるための大半は、お金を使う前に決まる。いくつかの習慣でポートフォリオを守ることができる。

- **言葉を買え、ブランドは買うな。** 一般的・説明的・独自の造語が安全な在庫だ。特定企業の存在によってのみ価値が生まれるドメインは避けること。ブランドのように見えるかどうか自信が持てない場合、その不確かさ自体がパスするシグナルだ。
- **購入前に商標調査を行え。** 当該文字列と明らかなスペルバリエーションについて、関連する商標登録データベースを素早く検索すれば、ほとんどの問題を事前に把握できる。これは[アフターマーケット](/ja/glossary/aftermarket/)で特に重要だ。そこでは前の[登録者](/ja/glossary/registrant/)の歴史もドメインと一緒に引き継ぐことになるからだ。
- **記録を保持し、パーキングページを清潔に保て。** 登録日と登録理由を保存すること。不正な意図は通常、登録時点に存在しなければならない。商標保有者と競合するPPC広告を避けること。それが一般的な名前を不正使用の証拠に変えてしまいうる。
- **インバウンドのオファーには慎重に対応せよ。** ブランドが接触してきた場合、*相手方のニーズ*を軸に金額を提示してはならない。そのような交渉は「商標保有者に売却することを主目的として登録した」と再解釈されやすい。

ドメイン名がクリーンで記録もクリーンであれば、移転そのものが最後の変数だ。高額取引が中立的な[エスクロー](/ja/glossary/escrow/)を通じて決済されるのは、双方が先に動かなくて済むためだ。そして検証可能な取引の連鎖は、履歴に疑問が呈された場合にドメインを守る根拠の一部となる。[Namefi](https://namefi.io)はその点に力を入れている。トークン化された所有権により、ドメイン名には完全に[ICANN](/ja/glossary/icann/)準拠を維持しながら、永続的で監査可能な来歴記録が付与される。これにより、基盤となるドメインはUDRPとACPAが規律するシステムの中にしっかりと位置づけられる。トークン化はあなたの証拠能力とコントロールを強化する。それはドメインを商標法の外に置くものではなく、誠実なツールがそのような主張をすることもない。

## 結論

ドメイン投資とサイバースクワッティングを分けるのは一点、意図だ。言葉を買えば投資家だ。ブランドを買えば標的だ。ドメインを取り上げる全世界的な仲裁制度があり、その上さらに1ドメインにつき最大6桁ドルの罰金を科しうる米国法もある。同じ境界線が逆方向にあなたを守ってもくれる。プロセスを濫用してあなたの正当なドメインを狙う商標保有者は、逆ハイジャッカーというレッテルを貼られうる。UDRPの3要件テストを熟知し、ポートフォリオを一般的な名前で固め、記録を清潔に保つこと。それができれば、このビジネスにおける法的リスクは本来あるべき場所、つまりシステムを悪用しようとする人々の側に、留まり続ける。

## 出典と参考文献

- Wikipedia — [サイバースクワッティング（定義）](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)
- Wikipedia — [統一ドメイン名紛争解決方針（3要件）](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark%20in%20which%20the%20complainant%20has%20rights)
- Wikipedia — [サイバースクワッティング消費者保護法（1999年；訴訟原因）](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20cause%20of%20action%20for%20registering%2C%20trafficking%20in%2C%20or%20using%20a%20domain%20name%20confusingly%20similar)
- Legal Information Institute（コーネル大学）— [15 U.S.C. § 1125(d)（「不正な意図で利益を得ること」）](https://www.law.cornell.edu/uscode/text/15/1125#:~:text=has%20a%20bad%20faith%20intent%20to%20profit%20from%20that%20mark)
- Legal Information Institute（コーネル大学）— [15 U.S.C. § 1117(d)（法定損害賠償：1ドメインにつき1,000ドル〜10万ドル）](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)
- Wikipedia — [逆ドメインネームハイジャック（定義；UDRP第15条(e)項）](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name%20by%20making%20cybersquatting%20claims)
- ICANN — [統一ドメイン名紛争解決方針](https://www.icann.org/resources/pages/policy-2012-02-25-en) · WIPO — [UDRPガイド](https://www.wipo.int/amc/en/domains/guide/)
