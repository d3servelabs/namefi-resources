---
title: 'Panix.com ドメイン乗っ取り事件：5日間の自動承認ルールがニューヨーク最古のISPを奪った経緯'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 18
format: case-study
description: '2005年1月、ニューヨーク最古の商業ISPであるPanix.comのドメインが、盗まれたクレジットカードを使ったオーストラリアの登録業者への不正移管によって奪われ、Webサービスとメールが数日間にわたってダウンした。当時の自動承認式レジストラ間移管ルールがその手口を可能にし、事後の復旧作業がドメイン移管ポリシーの抜本的な改革につながった。'
keywords: ['panix.com', 'Panixドメイン乗っ取り', 'ドメインハイジャック', 'レジストラ間移管', 'Melbourne IT', 'Dotster', 'Fibranet', 'ICANN移管ポリシー', 'レジストラロック', 'clientTransferProhibited', 'ドメインセキュリティ', 'DNSハイジャック', 'EPP認証コード']
relatedArticles:
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/the-perl-com-domain-theft/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-sex-com-heist-the-forged-letter/
  - /ja/blog/the-syrian-electronic-army-nyt-hijack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/dns/
  - /ja/glossary/tld/
  - /ja/glossary/registry/
---

15年以上にわたり、アメリカ最古の商業インターネットプロバイダーのひとつは、ひとつのアドレスに存在し続けた：**panix.com** である。そして2005年1月の長い連休明け、何者かがそれを奪った。

サーバーをハッキングしたわけではない。パスワードを推測したわけでもない。犯人は移管フォームに記入し、盗んだクレジットカードで代金を払い、施行されたばかりの [ICANN](/ja/glossary/icann/) の規則が残りの仕事をこなすのを待った。数時間のうちに、panix.com の所有権はオーストラリアの企業に移され、DNS はイギリスのホストに向け直され、メールはカナダ経由に迂回された——Panix を実際に運営していた人々が土曜の深夜に眠る間に、何の警告もなく。

これは、エクスプロイトではなく事務手続きがニューヨーク最古のISPを乗っ取った経緯、そして事後の対応がドメインを移動させる権限を規定するルールを書き直す契機となった経緯の物語である。

## 事業全体が一つのドメインに依存していた先駆的なISP

Panix（Public Access Networks Corporation）は小さな話ではない。1989年に設立されたこの企業は、Wikipediaによれば [The World と NetCom に次ぐ世界で3番目に古いISP](https://en.wikipedia.org/wiki/Panix_(ISP)#:~:text=third%2Doldest%20ISP%20in%20the%20world%20after%20The%20World%20and%20NetCom) であった。ニューヨーク市の初期の商業インターネットを代表する存在であり、シェルアカウント、メール、Webホスティング、そして数千人のニューヨーカーがオンライン接続に使ったダイヤルアップ・ブロードバンド回線を提供していた。

そして、当時も今もインターネットビジネスのほぼすべてがそうであるように、Panix のアイデンティティはそのドメインそのものだった。顧客のメールボックスは `@panix.com` で終わっていた。Webサーバーは `www.panix.com` に応答していた。会社全体——そのブランド、外部からの到達可能性、顧客のメールが実際に届く仕組み——は、一つの名前に紐付けられた DNS レコードにかかっていた。そのドメインの制御を失えば、失うのはマーケティング資産ではない。事業の神経系そのものを失うのだ。

それが、まさに起きたことだった。

## 2005年1月：不正移管

法的な記録はその日付を明確に示している。法律事務所 Davis Wright Tremaine がまとめたように、[2005年1月14日（金）、ニューヨーク州に拠点を置くインターネットサービスプロバイダーが所有するドメイン名「panix.com」が、権限なく第三者へ移管されるという注目すべき乗っ取りが発生した](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=On%20Friday%2C%20Jan.%2014%2C%202005%2C%20a%20high%2Dprofile%20hijacking%20occurred)。

その週末の深夜には、被害がすでに現実のものとなっていた。The Register は事件の展開を追いながら、この奪取の構図を一文で鮮やかに描写した：[panix.com の所有権はオーストラリアの企業に移され、DNS レコード自体はイギリスの企業に移動され、panix.com のメールはさらに別のカナダの企業経由に迂回された](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=The%20ownership%20of%20panix.com%20was%20moved%20to%20a%20company%20in%20Australia)。

1月16日に Slashdot を通じて技術コミュニティに広まったニュースは、端的にこう伝えた：[ニューヨーク最古の商業インターネットプロバイダーである Panix が、身元不明の人物によってドメイン名「panix.com」をハイジャックされた](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked)。

Panix の立場から見て最も痛烈な点は、無通知であったことだ。[1989年に設立されたニューヨーク最古の商業ISPは、自社も自社の登録業者も変更予定について何の通知も受けていなかったと述べた](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=neither%20it%20nor%20its%20registrar%20received%20any%20notification%20of%20the%20proposed%20changes)。ドメインを奪い去った移管は、正当な所有者の目には、すでに完了した後まで完全に見えなかったのである。

## 被害：Webとメールが数日間ダウン

![家の権利書が深夜に海を越えて密かに見知らぬ人物に再登録される様子を描いたカラフルなコンセプトアート——輝く権利書が海を渡り、真夜中のスタンプを押された外国の机の上に滑り込んでいく](../../assets/the-panix-com-domain-hijack-01-hijack.jpg)

乗っ取られたドメインはオン・オフのスイッチではない——それは緩やかで醜い衰退であり、最大の被害はメールにある。

ドメインの DNS を制御するということは、メールの配送先を制御するということだ。panix.com のメールレコードを書き換えた攻撃者は、ISP 全体の顧客基盤の「郵便局」として機能し始めた。請求書、パスワードリセット、ビジネスメール、個人の連絡——受信するはずのメッセージは Panix には届かず、攻撃者が管理するサーバーへと流れ込んだ。InfoWorld は事件後の取材で、[乗っ取りにより一部の Panix 顧客は2日間メールにアクセスできなくなり](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)、その間に100通以上のメッセージを失った顧客もいたと報じた。

乗っ取り中に誤配されたメールは単に遅延するわけではない。その多くは永遠に消える——バウンスされるか、破棄されるか、本来受信すべきでないサーバーに黙って飲み込まれるのだ。「メールが届いたかどうか」でサービスの価値を測る顧客にとって、数日間のメール誤配は最悪のレベルの障害に等しかった。

そして顧客にできることは何もなかった。問題は Panix 自身のマシンにあったのではなく、それらは正常に動いていた。問題は [Domain Name System](/ja/glossary/dns/)（DNS）のグローバルなルーティングテーブルにあり、オーストラリアの[レジストラ](/ja/glossary/registrar/)が不正なリクエストに基づいて、panix.com が別の誰かのものになったと世界中に告げていたのだった。

## 手口：自動承認移管の抜け穴

![光るドメインキーの移管フォームに巨大なゴム印で「承認済」と押しつけられ、身分証明も署名も受付係もない状態を描いたカラフルなコンセプトアート——背景の時計が5日間のカウントダウンを示している](../../assets/the-panix-com-domain-hijack-02-transfer-loophole.jpg)

この事件を単なる「最悪な週末」ではなく歴史的事例たらしめる部分がここにある：誰も不正侵入していない。システムは設計通りに動いた。設計そのものが脆弱性だったのだ。

一連の仕組みは複数の仲介者を経由して動いた。Panix のドメインはワシントン州バンクーバーの登録業者 **Dotster** に登録されていた。不正な移管はイギリスを拠点とする[リセラー](/ja/glossary/reseller/) **Fibranet Services Ltd.** のアカウントを通じて申請され、オーストラリアの大手登録業者 **Melbourne IT** に送られた。InfoWorld が報じたように、[Melbourne IT Ltd. のミスにより、盗まれたクレジットカードを使った詐欺師が Panix.com の制御を奪うことができた](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)——移管に使われたアカウントは[盗まれたクレジットカードで開設された不正なもの](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)だった。

しかし、クレジットカード詐欺はアカウントを開設したに過ぎない。ドメインを実際に動かしたのはポリシーだった。ICANN はわずか数週間前の2004年11月に施行されたばかりの新しいレジストラ間移管プロセスを導入しており、それは*デフォルト承認*の原則に基づいていた。The Register の説明によれば、新しい枠組みのもとでは[昨年11月に発効したこれらのルールにより、レジストリ間の移管リクエストはドメイン所有者によって撤回されない限り、5日後に自動的に承認される](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=automatically%20approved%20after%20five%20days%20unless%20countermanded%20by%20the%20domain%20owner)。

改めて読んでほしい。これがすべての話だ。沈黙は「同意」を意味した。正当な所有者が何もしなければ——たとえば通知を受け取れなかったために——移管は自動的に完了した。Davis Wright Tremaine は同じ罠を法的観点から次のように描写した：新ルールは[ドメイン所有者が5日以内に移管リクエストを撤回しない限りドメインが自動的に移管されるため、不正移管をより容易にするという側面がある](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=automatically%20transferred%20unless%20the%20owner%20countermands%20the%20transfer%20request%20within%20five%20days)。

失敗を積み重ねると、絵柄は暗澹たるものになる。移管先の登録業者（Melbourne IT、Fibranet 経由）は盗まれたカードに裏付けられたリクエストを受け入れ、後にみずから認めたように[リクエストを適切に検証しなかった](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=failed%20to%20properly%20verify%20the%20request)。移管元の登録業者（Dotster）と正当な所有者（Panix）は有効な通知を受けなかったため、何も撤回しなかった。そして、ポリシーのデフォルト——異議がなければ承認——が、この異議なしという状況を完了した窃盗に変えた。ファイアウォールは突破されていない。攻撃の手段は事務手続きだったのだ。

## 復旧と、それが引き起こしたポリシー改革

人間が介入してからの復旧は速かった——そしてそれ自体が一つの告発であった。移管は最初から承認されるべきではなかったことを証明したからだ。

日曜日には、[Panix は盗まれたドメインが一時的に置かれていたオーストラリアのドメインホスティング・登録会社 Melbourne IT から panix.com を取り戻した](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=Panix%20had%20recovered%20its%20Panix.com%20domain)、そして Dotster の本来の場所に戻した。[レジストリ](/ja/glossary/registry/)レベルの修正はほぼ即座だったが、グローバルな後処理はそうではなかった。DNS は命令で記憶を消去しないからだ。The Register が指摘したように、[ルートサーバー](/ja/glossary/root-zone/)は速やかに更新されたが、DNS の分散的な性質上、完全に正常に戻るまでには最大24時間かかる見込みだった——世界中のキャッシュが有効期限を迎えて初めて、すべてのユーザーが本物の panix.com を見られるようになるのだ。

Melbourne IT は、その評判を守るために事実を隠さなかった。2日後、The Register は[あるオーストラリアのドメイン登録業者が先週末のドメイン名ハイジャックにおける自社の責任を認めた](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=An%20Australian%20domain%20registrar%20has%20admitted%20to%20its%20part)と報じ、移管プロセスにおける確認ステップが実施されなかったことを原因として挙げ、問題を生じさせた抜け穴を塞いだと約束した。

しかしより重要な帰結は構造的なものだった。Panix はその後の移管セキュリティに関する広範な再検討における教科書的な事例となった。ICANN のセキュリティ安定性諮問委員会（SSAC）は2005年に報告書[『Domain Name Hijacking: Incidents, Threats, Risks, and Remedial Actions』](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)を発表し、まさにこのクラスの失敗——[登録者](/ja/glossary/registrant/)であることを確認せずに移管を受け入れる登録業者——を詳しく検証した。その後にシステムを強化した恒久的な対策は、この週末のような出来事に直接端を発している：

- **デフォルトのレジストラロック。** `clientTransferProhibited` が設定されたドメインは、正当な保有者がロックを解除するまで移管を単純に拒否する。かつては目立たないオプトイン機能だったものが、多くの登録業者においてデフォルトの状態となった——自動承認ルールが上書きできないブレーキである。
- **[認証コード](/ja/glossary/auth-code/)（EPP 移管コード）。** 現代の [gTLD](/ja/glossary/gtld/) 移管には秘密の認証コードが必要であり、移管元の登録業者が本人確認された登録者にのみ発行するため、移管先の登録業者が書類だけでドメインを引き出すことはできなくなった。
- **詳細な [ICANN 移管ポリシー](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)** が策定され、より厳格な確認義務と、まさにこの種の不正移管を迅速に覆すための緊急連絡チャンネルが設けられた。

Panix のハイジャック事件がこれらの仕組みを単独で生み出したわけではないが、それらの必要性を訴える際に誰もが指し示す事例となった。

## 移管ロックと本人確認が教えること

日付と登録業者名を取り除いても、Panix はいくつかの永続的な教訓を残している。

1. **デフォルト許可はセキュリティ上の決断であり、たいていの場合は誤った決断だ。** 2005年において最も危険な設計上の選択は、「沈黙は同意を意味する」というものだった。所有者が何もしなければ完了する移管は、所有者が常に監視し、常に連絡可能であることを前提とする。連休の週末にはどちらも成り立たない。
2. **本人確認は資産を受け取る側ではなく、資産を手放す側が行わなければならない。** 移管先の登録業者はビジネスを欲しがっており、「はい」と言うインセンティブが強い。真のセキュリティは、移管元の登録業者が確認済みの保有者に認証コードを発行しなければならない仕組みによってのみもたらされた——資産が実際に存在する場所に確認の責任を置いたのだ。
3. **ロックをオンにすること。** `clientTransferProhibited` は、ドメイン所有者がこの種の攻撃に対して持てる最も安価で効果的な保護であり、コストはゼロだ。ロックされたドメインは、書類がどれほど説得力があっても黙って移管されることはない。重要なドメインはロックをかけ、ロックしたままにしておくこと。
4. **ドメインはあなたの単一障害点だ。** Panix のサーバーは一切侵害されていなかったにもかかわらず、会社は事実上オフラインになった。レジストリの一つのレコードがWebとメールの全存在を別の場所に向けられるとき、そのレコードはサーバー以上の保護に値する。
5. **通知を監視すること。** 5日間の撤回窓は、移管通知を実際に受け取り、かつ読んだ所有者しか守らない。古くなった登録者メールアドレス、監視されていない管理者連絡先、あるいは連休の週末は、安全弁を無声の失敗に変えてしまう。

## Namefi の観点

![検証可能で改ざん耐性のあるドメイン所有権のカラフルなイラスト——グリーンのシールド、緑の Namefi トークン、DNS の継続性によって守られたドメインカード](../../assets/the-panix-com-domain-hijack-03-namefi-angle.jpg)

Panix のハイジャックは、本質的には「権威」の問題だ。「誰がこのドメインを移動させる権限を持つか」という問いに対する答えが、リセラーの連鎖とデフォルト承認タイマーによって提供され、強力で検証可能な所有証明には基づいていなかった。別の半球に住む見知らぬ人物がニューヨークのISPを代表しているとシステムを納得させるのに、盗まれたクレジットカードと5日間の沈黙で十分だったのだ。

[Namefi](https://namefi.io) は正反対の前提から出発する：ドメインの制御は、推定されるのではなく、証明可能でなければならないという前提だ。[ドメイン所有権](/ja/glossary/domain-ownership/)をトークン化されたオンチェーン資産として表現することで、DNS との互換性を維持しつつ、「誰がこの名前を保有しているか」という行為が暗号学的に検証可能かつ監査可能になる——不正な書類を受け入れた登録業者によって静かに上書きされることのない記録だ。移管は保有者の鍵が承認したときに動き、5日間のタイマーが誰にも見られずにカウントダウンを終えることで完了するわけではない。デフォルトは「拒否」であり、同意は異議申し立てがないことではなく、実際に示されなければならない。

1989年に Panix が設立された頃——あるいはハイジャックが起きた2005年でさえ——こうした仕組みは存在しなかった。しかし、それはあの週末が業界全体に教えた教訓を指し示している：ドメインは沈黙によって支配されるには重要すぎる。所有権とは必要なときにいつでも証明できるものでなければならず、長い週末に受信トレイを見ていなかったというだけで見知らぬ人物が奪えるようなものであってはならない。

## 出典と参考資料

- The Register — [Panix recovers from domain hijack](https://www.theregister.com/2005/01/17/panix_domain_hijack/)
- The Register — [Panix.com hijack: Aussie firm shoulders blame](https://www.theregister.com/2005/01/19/panix_hijack_more/)
- Davis Wright Tremaine — [Guarding Against Domain Name Hijacking](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking)
- InfoWorld — [Australian company takes blame for Panix domain hijack](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)
- Slashdot — [New York's Oldest ISP Gets Domain-Jacked](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked)
- Wikipedia — [Panix (ISP)](https://en.wikipedia.org/wiki/Panix_(ISP))
- Wikipedia — [Domain hijacking](https://en.wikipedia.org/wiki/Domain_hijacking)
- ICANN SSAC — [Domain Name Hijacking: Incidents, Threats, Risks, and Remedial Actions (2005)](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)
- ICANN — [Transfer Policy](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)
- NANOG mailing list archive — [discussion of the panix.com transfer and ICANN remedies](https://diswww.mit.edu/charon/nanog/77162)
