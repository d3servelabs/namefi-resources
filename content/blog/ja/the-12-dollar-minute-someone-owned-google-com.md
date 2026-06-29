---
title: '12ドルの1分間：誰かがひっそりとGoogle.comを購入した日'
date: '2026-06-17'
language: ja
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 4
format: case-study
description: '2015年9月、元Google社員がGoogle Domainsを通じてgoogle.comを12ドルで購入し、世界で最も価値あるドメインの管理権を約1分間保持した。Sanmay Vedと6,006.13ドルのバウンティ、そして「1分間の所有」が明かすドメイン支配の実態。'
keywords: ['google.comドメイン', 'Sanmay Ved', 'Google Domainsバグ', 'ドメインセキュリティ', 'google.comの所有者', 'ドメインハイジャック', 'ウェブマスターツールアクセス', 'Googleバグバウンティ', '6006.13報奨金', 'ドメイン登録の脆弱性', 'ドメイン制御', 'DNS セキュリティ', 'ドメイン所有権確認']
relatedArticles:
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/the-sex-com-heist-the-forged-letter/
  - /ja/blog/the-2024-squarespace-defi-domain-hijacks/
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
  - /ja/glossary/tld/
  - /ja/glossary/registry/
---

2015年9月29日の夜、約1分間にわたり、インターネット上で最も価値あるアドレスはGoogleのものではなかった。

それはSanmay Vedという名の元Google社員のものだった。彼は**google.com**を**12ドル**で購入したばかりだった。

不正侵入ではない。バッファオーバーフローの悪用でも、管理者へのフィッシングでもない。彼はGoogleが運営する小売サービス「Google Domains」にアクセスし、世界で最も有名なドメインを入力し、決して起きてはならないことをチェックアウト画面が行うのを目の当たりにした——決済が通ったのだ。カードに課金され、注文が完了した。そして約60秒間、google.comの[登録者](/ja/glossary/registrant/)としてマサチューセッツ州の大学院生の名前が記録された。

これは**Domain Mayday / 域名浩劫**、ドメインセキュリティが公衆の目の前で破綻した瞬間を記録するシリーズだ。ほとんどのエピソードは攻撃者に盗まれたドメインの話だが、今回は違う——そして、より不穏でもある。なぜなら、誰も攻撃などしていなかったからだ。地球上で最も重要なドメインが、定価でショッピングカートに入れた最初の人物に売却されたのだ。

## google.comとは何か

google.comの価値を誇張することは難しい。その数字はもはや数字の問題ではないからだ。

Google.comは地球上で最も多く使われる検索エンジンの玄関口であり、Gmail、マップ、広告、YouTubeのアカウントフロー、そして何十億もの人々の認証基盤の要でもある。Slateはこの事件を取り上げ、google.comを[「世界で最もトラフィックの多いドメイン」](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.)と表現した。[Tesla.com](/ja/blog/from-teslamotors-com-to-tesla-com/)やCars.comがいくらで売れたとしても、google.comは別次元の存在だ——それはブランド資産ではなく、人類の大きな割合が毎日触れる*インフラ*なのだ。

これほどのドメインは触れられてはならないはずだ。ロック、フラグ、レジストリ保有、サーバーホールド、転送禁止——[レジストラ](/ja/glossary/registrar/)が適用できるあらゆる保護で覆われているべきだ。ドメインセキュリティの大前提は、名前が重要であるほど移転が困難になるというものだ。

それが、12ドルで動いた。

## 12ドルの1分間

![輝く地球型ドメインに小さな12ドルの値札が付き、1枚のコインがチェックアウトスロットに落ちながら1分砂時計が動き始める、鮮やかなカラフルなコンセプトアート](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Vedはトラブルを探していたわけではない。彼は元Googlerだ——以前、Account Strategistとして同社に勤務していた——そして深夜、GoogleのレジストラサービスであるGoogle Domainsを眺めながらドメイン名を物色していた。気まぐれで、あの大きなドメインを入力してみた。

彼自身の言葉によれば、結果を見て思わず止まってしまったという。[「Google.comと入力したところ、驚くことに利用可能と表示された」](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available)とVedはBusiness Insiderに語った。「プレミアム」でも「オファー価格を入力」でも「このドメインは取得済み」でもなかった。*利用可能*、標準登録料12ドルで。

彼はカートに追加し、システムが拒否するだろうと思いながらチェックアウトした。しかし拒否されなかった。取引は完了した。The Hacker Newsがまとめたように、元Googlerが[「GoogleのサービスであるGoogle Domainsを通じて、世界で最も訪問されるドメインであるGoogle.comをたった12ドルで購入することに成功した」](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain)のだ。

すると、受信トレイが埋まり始めた。[ドメイン所有権](/ja/glossary/domain-ownership/)に紐づいたシステム——認証済みドメイン所有者にアラートや制御を送信するもの——が新しい登録者を認識し、役割を果たし始めた。Security Affairsはその瞬間を次のように描写した。[「数秒後、彼の受信トレイとGoogle Webmaster Toolsはgoogle.comドメインの所有権を確認するウェブマスター関連のメッセージで溢れかえった。」](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded)

その1分間、Vedは書類上だけで所有者とされていたわけではなかった。システムは彼を所有者として扱っていた。

## その1分間に実際に何を制御できるか

これが、面白いエピソードをセキュリティの話に変える部分だ。

GoogleのエコシステムでドメインのVerified Ownerになると、**Webmaster Tools**（現在のSearch Console）にアクセスできる——サイト所有者がプロパティのインデックス状況を確認し、サイトマップを送信し、内部メッセージを閲覧し、検索におけるドメインの表示を管理するダッシュボードだ。Vedは後に、その含意を見逃さなかったと語った。[「恐ろしかったのは、1分間ウェブマスターコントロールにアクセスできてしまったことだ」](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute)と彼は説明した。

当時の報道は、その間に彼が[「Google.comへの管理者アクセスを持っていた」](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=he%20had%20administrative%20access%20to%20Google.com)こと、そして[「Google Search ConsoleのダッシュボードがGoogle.comドメインのメッセージで更新された」](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated)ことを伝えた。ドメインを所有することで何にアクセスできるか考えてみよう。[DNS](/ja/glossary/dns/)レコード、メールルーティング、第三者への「所有権」証明能力、そしてプロパティが世界に表示される方法を決定する検索エンジンのコントロールだ。登録はマスターキーだ。DNS、証明書、メール、シングルサインオン、検索インデックス——これらすべてがその下にある登録を信頼し、登録者が主張する通りの人物であるとみなす。

Vedは責任ある行動を取った。単一のレコードも変更せず、即座に報告した。しかし教訓はそれとは無関係に存在する。「好奇心旺盛な学生」と「大惨事」の違いは技術的な制御ではなかった。それは1人の人間が誠実に行動するという選択だった。

## Googleの察知——そして対応

![大きな輝く鍵が開いた手に一瞬だけ持たれ、光の筋に引き戻され、カラフルな回路基板の空に返金されたコインが漂う、鮮やかなカラフルなコンセプトアート](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Googleの自動システムは素早く異常を検知した。約1分以内に注文が取り消された。Fox Newsはキャンセルを率直に報じた。[「Google Domainsは1分後に販売をキャンセルし、誰かが先に登録していたと伝え、Vedに12ドルを返金した。」](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later)「先に登録していた誰か」とは、もちろんGoogle自身のことだ。

そしてGoogleは、この出来事を伝説に変えることをした。脆弱性報奨プログラムを通じてVedにバウンティを支払ったのだが、その金額は意図的に選ばれた。Googleの2015年セキュリティ年次報告書には次のように書かれている。[「Sanmayへの最初の報奨金——$6,006.13——は数字でGoogleをスペルアウトしています（少し目を細めると見えてきます！）。Sanmayが報奨金を慈善団体に寄付すると知り、この金額を2倍にしました。」](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay)（数字として読むと：6-0-0-6-1-3 → G-O-O-G-L-E。）

Vedはそのお金を寄付することを選んだ。インド全土で無料の学校を支援するArt of Living India Foundationへの寄付を希望し、Googleがそれを知ると報奨金を2倍にし、合計約**12,012.26ドル**になった。この件全体に対するVedの立場は、報奨金についてではなかった。[「お金には興味がない。最初からお金の話ではなかった」](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money)と彼はBusiness Insiderに語った。

12ドルのミスは、巧みなバウンティ、寛大な寄付、そしてそれをマッチングした企業の物語になった。しかし善意を取り除けば、事実は残酷だ——レジストラが自らの王国の鍵を渡してしまい、それが戻ってきたのは素早い自動検知と、たまたま誠実な買い手のおかげだったのだ。

## なぜこれほど重要な登録が見逃されたのか

地球上で最も守られているはずの単一ドメインが、セルフサービスのチェックアウトで「12ドルで利用可能」と表示されるのはなぜか。

正直に言えば、Google以外には完全な内部事後検証の詳細は分からず、憶測はしない。しかし、失敗の*形状*はドメインシステムを扱ったことがある人なら誰でも馴染みがあり、何が言えて何が言えないかについて正確にしておく価値がある。

検証可能なのは、表面上の動作だ。当時の報道は2つの一般的な説明を提示した。[「Google Domainsのバグか、あるいは会社が期限が来たときにドメイン名を更新し忘れたかのどちらかが考えられる。」](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew)いずれにしても、ほんのわずかな時間、ストアフロントの「この名前を登録できるか？」というロジックが、売却不可能としてハードコードされているべき名前に対して誤った回答を返したのだ。

より深い教訓はアーキテクチャにある。ドメインの保護は、*それを変更する最も弱いパス*と同程度にしか強くない。レジストリはサーバーホールドと転送禁止フラグを適用できる。レジストラは名前をロックできる。組織はレジストラレベルの多要素認証と承認ワークフローを有効にできる。しかし、単一のインターフェース——小売チェックアウト、内部管理ツール、サポートオーバーライド、APIエンドポイント——がそれらのガードを発動させずに所有権を変更できるなら、その名前はその最も弱いインターフェースと同程度のセキュリティしかない。ドメイン乗っ取りの影響範囲は莫大だが（DNS、メール、証明書、ログイン）、それを引き起こす表面は微小だ——「いいえ」と言うべきところで「はい」と言ったフォーム1つで足りる。

この非対称性こそが問題の本質だ。危機に瀕している価値は最大限。それを動かすのに必要な行動は最小限。

## ドメイン制御について学べること

12ドルの1分間からは、いくつかの持続的な教訓が得られる。

1. **登録者レコードはマスターキーだ。** DNS、TLS証明書、メール到達性、「このドメインを所有していることを確認する」フローはすべて、その下にある登録を信頼している。登録を制御する者が、そこにぶら下がるすべてを制御する。そのレイヤーを事実上のルートパスワードとして保護しよう。

2. **重要性と保護は自動的には相関しない。** 世界で最も重要なドメインが最も厳重にロックされていると思うだろう。1分間、それは違った。重要性は自らを強制しない。明示的なロック、ホールド、承認ゲートが強制する。それらを監査しよう。当然のことと思わないこと。

3. **[コントロールプレーン](/ja/blog/dns-is-the-control-plane/)はDNS以上のものだ。** 人々はネームサーバーをセキュアにしながら、レジストラアカウント、サポートチャネル、請求メール、内部ツールを忘れる。ドメインは所有権を書き換えられる任意のドアから失われる可能性がある——「DNS」とラベルされたものだけでなく。

4. **往々にして、災害から守るのは1人の誠実な人間だ。** Googleは幸運だった。買い手が、即座に報告した誠実なセキュリティ意識の高い元社員だったからだ。偶然入ってきた人の善意に依存するセキュリティはセキュリティではない。「いいえ」と言うのは訪問者ではなく、システムであるべきだ。

5. **素早い検知は実際の制御だ。** Googleの約1分間の自動検知は実際に被害を限定した。すべてのミスを防ぐことはできないが、所有権変更の厳密なモニタリングによって、ミスが侵害に変わる時間的な窓を縮小できる。

このストーリーで安心できる部分は、Googleのシステムが気づいて取り消したことだ。不安を覚える部分は、そうする必要があったことだ。

## Namefiの視点

![確認可能で改ざん防止されたドメイン所有権のカラフルなイラスト——グリーンのシールド、Namefiのグリーントークン、DNS継続性によって保護されたドメインカード](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

12ドルの1分間は、本質的には1つのレコードに関する問いかけだ。*この名前の認証済み所有者は誰か、今この瞬間、そしてそれをひっそりと変更することはどれほど困難か？*

従来のモデルでは、その答えはレジストラのデータベースの中にあり、そのレジストラが公開するあらゆるインターフェース——小売チェックアウト、管理オーバーライド、サポートチケット、API——を通じて変更可能だ。それらのインターフェースのほとんどはよく守られている。しかし所有権は最も守りが薄いものと同程度の安全さしかなく、所有者は通常、自分のレコードが移転する瞬間をリアルタイムで見ることができない。Sanmay VedがGoogle.comを「所有している」と知ったのは受信トレイが光ったからであり、強化された台帳が検証済み・承認済みの移転を告知したからではなかった。

[Namefi](https://namefi.io)は、ドメイン所有権は単一の可変行に埋まっているのではなく、**検証可能で改ざん証跡が残るもの**であるべきだという前提から出発している。ドメイン制御をDNSと互換性を保ちながらトークン化されたオンチェーン資産として表現することで、「誰がこのドメインを所有しているか」という行為は独立して検証・監査できるものになる——移転はひっそりと成功するチェックアウトではなく、明示的かつ承認された可視のイベントになる。目標はドメインをエキゾチックなものにすることではない。マスターキーが誤って間違った人に渡るのを困難にし、痕跡を残さずに動かせないようにすることだ。

Google.comが1分で元に戻ったのは、Googleが脆弱なプリミティブの上に素早い検知を構築したからだ。より良い答えは、プリミティブ自体を信頼できるものにすることだ——証明できる所有権、見える移転、そして単一のフォームが「いいえ」と言うことを覚えているかどうかに依存しない制御。

## 出典と参考文献

- Google Online Security Blog — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1)（6,006.13ドルの報奨金と2倍の寄付マッチングの一次資料）
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/)（Googleのブログを逐語引用）
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- Fox News — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- Fox News — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- Yahoo Finance — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)
