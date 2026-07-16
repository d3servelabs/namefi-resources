---
title: 'DiscordApp.comからDiscord.comへ：「App」を外した日、フィッシャーが愛した抜け穴が閉じた'
date: '2026-06-17'
language: ja
tags: ['domains', 'branding', 'startups', 'domain-upgrades']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-investing
series: name-change-game-change
seriesOrder: 12
format: case-study
description: 'Discordが2015年にDiscordApp.comでサービスを開始した理由、Discord.comをひそかに取得した経緯、そして2020年にdiscord.comをメインドメインに切り替えた背景——ブランドの整合性という理由だけでなく、「discordapp.com」と「discord.com」の併存がフィッシャーやマルウェア業者に絶好の機会を与えていたという現実。'
keywords: ['discordapp.com', 'discord.com', 'Discordドメイン名', 'ドメイン移行', 'ジェイソン・シトロン', 'Discord歴史', 'cdn.discordapp.com', 'Discordフィッシング', 'スタートアップ命名', 'ブランド命名', 'プレミアムドメイン', 'ドメイン戦略', 'ドメイン移行']
relatedArticles:
  - /ja/blog/from-bufferapp-com-to-buffer-com/
  - /ja/blog/from-slackhq-com-to-slack-com/
  - /ja/blog/from-ubercab-com-to-uber-com/
  - /ja/blog/from-massdrop-com-to-drop-com/
  - /ja/blog/from-box-net-to-box-com/
relatedTopics:
  - /ja/topics/domain-investing/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/name-change-game-change/
  - /ja/series/domain-apocalypse/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/dns/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
  - /ja/glossary/web3/
---

Discordが「サーバーに入ろう」という動詞になる前、そのサービスは少し長いアドレスに居を構えていた——**DiscordApp.com**である。

「App」はブランディングの選択ではなかった。回避策だった。Jason CitronとStanislav Vishnevskiyが2015年5月にボイス＆チャットツールをローンチした際、[完全一致ドメイン](/ja/glossary/exact-match-domain/)であるDiscord.comはすでに他者の所有物だった。ミレニアム転換期に登録されていたのだ。そのためプロダクトは修飾語を添えてウェブに登場することになった。Wikipediaによると、[Discordは2015年5月にdiscordapp.comというドメイン名でパブリックリリースされた](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com)。初期を振り返るある記事にはこう記されている：[Discordapp.comは最初のリリース年におけるDiscordの公式URLだった](https://www.remote.tools/discord/when-was-discord-made#:~:text=Discordapp.com)。

企業が欲しい名前と実際に取得できる名前の間にあるこのギャップは、スタートアップのブランディングにおける最も一般的な問題のひとつだ。プロダクトはすでにDiscordと呼ばれていた。ただ、世界はまだDiscord.comにはたどり着けなかった。

事例13が通常の「完全一致ドメインを取得せよ」という話と異なるのは、この回避策が残した*継ぎ目*にある。5年間にわたり、Discordは2つのアドレスを同時に運用していた——使っているブランド（discordapp.com）と欲しかったブランド（discord.com）だ。そしてこの2ドメイン体制が、フィッシャー、詐欺師、マルウェア業者が好む種類の曖昧さをまさに生み出していた。これは、ブランドの整合性のためでもあり、ローンチ以来抱え続けてきたセキュリティホールを閉じるためでもあったドメイン移行の物語だ。

## 2015年：望む名前を持てなかったツール

Discordはコンシューマー現象として始まったわけではない。特定の不満を解消するための手段として生まれた。

Citronはそこに資金と経験を持ち込んだ。彼はソーシャルゲームネットワークOpenFeintを設立し——Wikipediaの記録によれば——[2011年にGREEへ1億400万ドルで売却し、その資金で2012年にゲーム開発スタジオHammer & Chiselを設立した](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=later%20sold%20it%20to%20GREE%20in%202011%20for%20%24104%20million%2C%20which%20he%20used%20to%20found%20Hammer%20%26%20Chisel)。スタジオのゲームは軌道に乗らなかったが、チームがレイド調整のために作ったチャットツールが花開いた。補助手段がプロダクトになったのだ。

名前は早い段階で決まった——ごく普通の理由で。Wikipediaによると、[「Discord」という名前は「かっこいい響きがあり、話すことに関係している」、言いやすく、スペルしやすく、覚えやすく、商標とウェブサイトが利用可能だったため選ばれた](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=The%20name%20%22Discord%22%20was%20chosen%20because%20it%20%22sounds%20cool%20and%20has%20to%20do%20with%20talking%22)。最後の節に注目してほしい——*商標とウェブサイトが利用可能*。「利用可能」という言葉は、ここで多くのことをさりげなく担っている。商標はクリアだった。むき出しの[.com](/ja/tld/com/)はそうではなかった。

そこでチームは無数のスタートアップと同じことをした——修飾語を付けてリリースしたのだ。ブランドとしての「Discord」は、アドレスとしての「DiscordApp」として世に出た。そしてそれは機能した。ユーザー数はほぼ即座にスノーボール状に膨れ上がった。Wikipediaによれば、[2016年1月の時点でHammer & Chiselは300万人がDiscordを利用したと報告し、月100万人のペースで成長しており](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=By%20January%202016%2C%20Hammer%20%26%20Chisel%20reported%20Discord%20had%20been%20used%20by%203%20million%20people%2C%20with%20growth%20of%201%20million%20per%20month)、同年7月までに1,100万人、年末までに2,500万人に達した。

この曲線こそが落とし穴だ。その数百万人ひとりひとりが「discordapp.com」としてブランドを覚えた。招待リンク、共有されたスクリーンショット、ブックマーク——すべてが回避策をより深く固定化していった。修飾語が長く付き添えば付き添うほど、除去のコストは上がる——金銭的にではなく、間違った言葉を何百回もタイプしてきたオーディエンスの筋肉記憶として。

## Discord.comへの移行

Discordは何かを改名する必要はなかった。プロダクトは常にDiscordと呼ばれていた。変えなければならなかったのはアドレスだけだ——DiscordApp.comからDiscord.comへ。そしてそのためにまず、Discord.comを*所有*しなければならなかった。

それはひっそりと、使用するより何年も前に実現した。そのドメインは[2000年に登録されており](https://www.thedomains.com/2020/05/09/discord/#:~:text=registered%20in%202000)、会社の設立よりずっと前のことだ。ドメイン業界の報道によると、同社は[2017年にDiscord.comドメインを取得した](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017)——しかし切り替えはしなかった。しばらくの間、[その.comは創業以来使用してきたdiscordapp.comドメインへのリダイレクトとして機能していた](https://www.thedomains.com/2020/05/09/discord/#:~:text=the%20.com%20was%20a%20redirect%20to%20the%20discordapp.com%20domain%20they%20have%20used%20since%20the%20start)。クリーンな名前を所有しながら、回避策に向けてポイントし続けていたのだ。

実際の切り替えは2020年に起きた。あるドメイン分析によると、購入時期を2017年とする情報源もあるが、[唯一確かな事実は、新しいドメインへの移行が2020年5月4日に行われたことだ](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020)。Discordはdiscord.comをプライマリにし——賢明にも——[旧ドメインをリダイレクトとして維持することを決めた](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=they%20decided%20to%20keep%20the%20old%20domain%20up)ので、既存のリンクは壊れなかった。ソーシャルハンドルもアドレスに追随した——同社は[@discordappから@discordのみへとソーシャルメディアのハンドルを変更した](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=changed%20their%20social%20media%20handles%20from%20%40discordapp%20to%20%40discord%20only)。

この切り替えは表面的なものだけでなく、配管の深部にまで及んだ。API自体が移行したため、ボットやライブラリの開発者はコードのポイント先を変更しなければならなかった。人気ライブラリdiscord.pyのメンテナーは、[DiscordがDiscordapp.comからDiscord.comへ移行中](https://github.com/Rapptz/discord.py/issues/4063#:~:text=Discord%20is%20moving%20from%20discordapp.com%20to%20discord.com)というトラッキングIssueを立て、強制切り替え期限を示した：[2020年11月7日までにDiscordサーバーへの接続に使用するドメインを変更しなければ、そのライブラリを使用するクライアントは接続できなくなる](https://github.com/Rapptz/discord.py/issues/4063#:~:text=is%20not%20changed%20by%20November%207th%202020%20then%20clients%20using%20the%20library%20will%20be%20unable%20to%20connect)。大多数のユーザーが気づかなかったドメイン「移行」は、開発者エコシステムにとっては締め切りだったのだ。

## 背景：2ドメイン体制がフィッシングの贈り物になる理由

![分岐した道路標識のビビッドなDiscordブルーパープルのイラスト——一方の道にdiscord.com、もう一方にdiscordapp.comと書かれており、マスコットのClydeが両者の間で不安そうに視線を行き来させ、フォーク部分にフードを被ったフィッシャーが隠れている](../../assets/from-discordapp-com-to-discord-com-02-phishing-risk.jpg)

ここが、事例13を単なる整ったブランディングの話以上のものにする部分だ。

企業が何年にもわたってほぼ同一の2つのドメインで運営すると、自社のユーザーに*両方*を正当なものとして受け入れるよう訓練してしまう。「discordapp.comが本物のDiscordか、それともdiscord.comか？」——多くの人は自信を持って答えられない。そしてその不確かさこそが、[フィッシング](/ja/glossary/phishing/)が育つ土壌そのものだ。ユーザーが2つの公式ドメインを信頼するなら、それに酷似した3つ目も信頼するだろう。名前のわずかな変形——余分な一文字や入れ替わった単語——が簡単な偽装になる。本物が複数の形で存在しているのだから。

Discordにとってそのリスクは仮説ではなく、長い尾を持っていた。Discordのコンテンツデリバリーネットワークは今も旧名で動いている——**cdn.discordapp.com**だ——そしてこのドメインは、信頼できるように見えるという理由から、マルウェアを*ホスティング*するインターネット上のお気に入りの場所になった。セキュリティ企業Zscalerは、[攻撃者がDiscordのチャンネルに悪意のあるファイルをアップロードし、その公開リンクを他の人々と共有できること——Discordユーザーでなくてもダウンロードできる](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=An%20attacker%20can%20upload%20a%20malicious%20file%20on%20a%20Discord%20channel%20and%20share%20its%20public%20link%20with%20others)を記録している。さらに悪いことに、[Discordから送信されたファイルは永遠にそこに残るため、攻撃者がDiscord内でファイルを削除しても、そのリンクを使って悪意のあるファイルをダウンロードできる](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=a%20file%20sent%20from%20Discord%20is%20there%20forever)と判明した。

脅威インテリジェンス企業Intel 471は、*ドメイン自体*が武器である理由を説明している。ファイルがアップロードされると、[プラットフォームによって直接リンクが生成され](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=a%20direct%20link%20is%20generated%20by%20the%20platform)、[攻撃者はそのリンクをフィッシングメール、ソーシャルメディア、その他のチャネルを通じて拡散できる](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=Attackers%20then%20can%20choose%20to%20disseminate%20these%20links%20through%20phishing%20emails%2C%20social%20media%20or%20other%20channels)。リンクは[https://cdn.discordapp.com/attachments/{チャンネルID}/{ファイルID}/{ファイル名}](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=The%20Discord%20URL%20follows%20the%20https%3A%2F%2Fcdn.discordapp.com%2Fattachments)という形式に従う——本物のDiscordドメイン、本物のTLS証明書を持ち、[セキュリティコントロールによってDiscordドメインが拒否されていなければ、有害なコンテンツを配布する効果的な手段となる](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=If%20the%20Discord%20domain%20isn%27t%20disallowed%20by%20security%20controls%2C%20it%27s%20an%20effective%20way%20to%20deliver%20harmful%20content)ためフィルターをすり抜ける。MalwarebytesのThreatDownリサーチチームも同様のパターンを追跡しており、[新しいフィッシングキャンペーンがペイロード配信にDiscordを使用している](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=New%20phishing%20campaign%20uses%20Discord%20for%20payload%20delivery)こと、[犯罪者がDiscordの堅牢なCDNインフラを利用してマルウェアをホストしている](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=Criminals%20abuse%20Discord%20to%20host%20malware%20because%20of%20its%20robust%20CDN%20infrastructure)と警告している。

ユーザーに見えるブランドをひとつの正規の玄関口——discord.com——に集約しても、CDNの悪用は防げない。しかし、ブランディングがセキュリティに対して*できる*ことはひとつある——「本物のDiscordはどんな見た目か？」という問いに一語で答えられるようにすることだ。ブランドの公式な綴りが少ないほど、攻撃者が隠れられる偽装は少なくなる。

## 当時、金銭的側面は別の見え方をしていた

DiscordがDiscord.comを購入したことを当然のことのように考えがちだ——もちろん企業はいつか自分の名前を所有するはずだ、と。しかし当時の決断は、後知恵ではなく霧の中でなされた。

タイムラインを見てほしい。チームがDiscord.comを取得したのは2017年——Discordがまだ成長著しくも実績の乏しいゲームチャットアプリだった頃で、パンデミック期の普及や数十億ドル規模のバリュエーションよりも何年も前のことだ。そしてそのクリーンなドメインを*リダイレクトとして3年近くも放置して*から、2020年に切り替えた。この忍耐が興味深い部分だ。Discordはより良いアドレスを所有しながら、それを使うために動くプロダクトを混乱させることを、繰り返し選ばなかった。

これがドメイン移行の真のコスト計算であり、それは購入価格とはほとんど無関係だ。難しいのは移行そのもの——アプリ、API、OAuthスコープ、保存されたパスワード、ブラウザの権限、ディープリンク、そして広大なサードパーティボットエコシステムのポイント先を変更すること——を毎日何百万人もの人々が使う稼働中のプロダクトを壊さずにこなすことだ。DiscordはDiscord.comを*購入する*余裕が、それに*移行する*余裕よりもずっと早くできていた。2017年の購入がオプションを確保し、2020年の切り替えがそのオプションを行使した——プロダクトが混乱を吸収できるほど安定してから、2020年11月の開発者締め切りを施行できるようになってから。

## 「App」を外すことが重要だった理由

![DiscordApp という文字が輝く -App のサフィックスを脱ぎ捨て、文字が舞い落ちる様子を描いたDiscordブルーパープルのビビッドなカラーイラスト——マスコットのClydeが笑みを浮かべ、クリーンなDiscordのワードマークだけが残る](../../assets/from-discordapp-com-to-discord-com-01-dropping-app.jpg)

DiscordApp.comとDiscord.comの距離は3文字だ。戦略的には、*そのアプリ*と*その場所*の距離である。

**DiscordApp.com**はソフトウェアの一品を名指す——ダウンロードするもの、アプリケーション群の中のひとつのアプリ。**Discord.com**は目的地を名指す——人が向かう場所、属するコミュニティ、無意識に使う動詞。一方はプロダクトを指し示す。もう一方はただ*ブランドそのもの*だ。Discordがゲームを超えてクラブ、授業、友人グループに使われるものへと成長するにつれ、「App」はかつて同社が自分たちをどう説明したかという遺物のように感じられ始めた。

| 移行前 | 移行後 |
| --- | --- |
| DiscordApp.com | Discord.com |
| 「そのアプリ」を指名——ダウンロードするプロダクト | ブランドを指名——場所であり動詞 |
| 回避策の修飾語を携えている | 言葉そのものだけを携えている |
| ユーザーが信頼すべき2つの公式な綴り | ひとつの正規の玄関口 |
| フィッシャーが模倣できる継ぎ目を残す | 「どっちが本物？」のギャップを閉じる |

これがドメイン移行における繰り返しのパターンだ——初期の名前は*説明する*か*修飾する*。優れた名前は*所有する*。「App」「HQ」「Cab」「The」のような修飾語は、クリーンな名前が取得できないときの合理的なオンランプだ。しかし企業が素の言葉を目的地とすべきほど大きくなった瞬間に、それは抵抗力——そしてDiscordの場合は小さなセキュリティ負債——になる。

## 順序：まず所有し、安全なときに移行する

ここでの一連の順序を立ち止まって考える価値がある。「完全一致ドメインを取得したその日に切り替えよ」というよくあるスタートアップのアドバイスを逆転させているからだ。

Discordはそうしなかった。その順序は：

1. **まず名前が決まった**——「Discord」、覚えやすく商標が[利用可能](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=The%20name%20%22Discord%22%20was%20chosen%20because%20it%20%22sounds%20cool%20and%20has%20to%20do%20with%20talking%22)だったから選ばれたが、素の.comは違った。
2. **プロダクトは修飾語付きでローンチした**——Discord.comは[2000年に遡る登録から](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com)占有されていたため、[discordapp.com](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com)として。
3. **完全一致ドメインを取得したが手元に置いた**——Discordは[2017年](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017)にDiscord.comを購入し、差し替えではなく[リダイレクト](https://www.thedomains.com/2020/05/09/discord/#:~:text=the%20.com%20was%20a%20redirect%20to%20the%20discordapp.com%20domain%20they%20have%20used%20since%20the%20start)として運用した。
4. **プロダクトが吸収できるときに切り替えた**——[新しいドメインへの移行は2020年5月4日に行われ](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020)、開発者の強制切り替え期限は2020年11月7日だった。

教訓は「移行を遅らせよ」ではない。クリーンなドメインを所有することと、そこへ*移行すること*は、リスクプロファイルが異なる2つの別々のプロジェクトだということだ。Discordはアセットを早期に安価に確保し、移行する瞬間を慎重に選んだ——旧アドレスをリダイレクトとして生かし続けることで何も壊さずに。

## ドメインはオペレーティングシステムの一部になった

プレミアムドメインが重要な理由はひとつの地味な事実にある——反復だ。

コアドメインは企業が完全にコントロールできないあらゆる場所に現れる——招待リンク、OAuthの同意画面、メールアドレス、プレスの記事、ブラウザのバー、検索結果、「サーバーに入って」という口頭での一言それぞれに。反復のたびに、摩擦を加えるか取り除くかどちらかだ。DiscordApp.comは全員に永遠に3文字余分に運ばせ、*かつ*Discordには2つの公式な綴りがあるとユーザーに静かに教えた。Discord.comは何も求めず、信頼の問いに一語で答えた。

ブランドの進化はアドレスを強化した。Discordが2020年半ばにゲームからの正式な方向転換を打ち出した年——ドメインを移行したのと同じ年——同社はコミュニティに向けた[ブログ記事](https://discord.com/blog/your-place-to-talk)の中で、[新しいタグライン「Your place to talk」を掲げた新しいウェブサイトをローンチする](https://discord.com/blog/your-place-to-talk#:~:text=we%27re%20launching%20a%20new%20website%20with%20a%20new%20tagline%3A%20Your%20place%20to%20talk)と告げた。そして[私たちが自分たちを語る方法が、世界に間違ったシグナルを送っていた](https://discord.com/blog/your-place-to-talk#:~:text=the%20way%20we%20talked%20about%20ourselves%20sent%20the%20wrong%20signal%20to%20the%20world)と認めた。自らを「App」と呼ぶ名前は、[より歓迎的で、より包括的で、より信頼できる](https://discord.com/blog/your-place-to-talk#:~:text=more%20welcoming%2C%20more%20inclusive%2C%20and%20more%20trustworthy)存在でありたいという企業が届けるよりも狭いシグナルを送っていた。「信頼できる」——それが核心だ。そして唯一の正規ドメインは、ブランドがそれを獲得する手段のひとつだ。

## 事例13から創業者が学ぶこと

簡単な教訓——「ローンチ前に完全一致の.comを所有せよ」——は的外れだ。Discordにはそれができなかったのだから。より有益な教訓は修飾語、タイミング、そしてセキュリティについてだ：

1. **修飾語は立派なオンランプだ。**「App」は、素の言葉が[2000年の登録者](/ja/glossary/registrant/)に押さえられている間、Discordを本名でローンチさせた。DiscordApp.comでのローンチは失敗ではなかった——それはリリースするための合理的な方法だった。
2. **クリーンなドメインを買うことと、そこへ移行することは別の決断だ。**DiscordはDiscord.comを2017年に取得し、2020年まで切り替えなかった。アセットの確保はオプションを買った。それを行使するのは安全な瞬間まで待てた。
3. **文字数でなく、継ぎ目の数を数えよ。**2つのドメインを運用するコストは3文字余分というだけでなく、曖昧さだ。2つの公式な綴りはユーザーに似せた名前を信頼するよう教え、フィッシャーが出荷するのがまさに似せた名前だ。
4. **ひとつの正規の玄関口はセキュリティ機能だ。**discord.comへの集約はcdn.discordapp.comのCDN悪用を止めなかったが、「本物のDiscordはどんな見た目か？」という問いへの答えを一語にした——そしてその明快さは攻撃者が簡単には偽造できないものだ。

ドメイン移行はDiscordを勝利に導かなかった。プロダクト、タイミング、パンデミック、そして爆発的なコミュニティがはるかに大きく貢献した。しかしdiscord.comはブランドをタイプしやすく、信頼しやすく、なりすましにくくした——見知らぬ人がクリックするリンクで成り立つプラットフォームにとって、それは小さなことではない。

## Namefiの視点

![プレミアムドメインが確認済みの移行を通過し、緑色のNamefiトークン、DNSの継続性が描かれたカラフルなイラスト](../../assets/from-discordapp-com-to-discord-com-03-namefi-angle.jpg)

Discordの物語は、ブランディングの表面の下に、*コントロールと継続性*の問題を抱えている。

戦略的な判断は疑いの余地がなかった——Discordと呼ばれるプラットフォームがDiscord.comに居を構えるべきなのは当然だ。課題はアセットを取り巻くすべてのことだった——20年前に登録された[プレミアムドメイン](/ja/glossary/premium-domain/)の取得、その後の所有権の証明、リダイレクトとしての安全な保持、そして最終的にアプリ、API、OAuth、保存されたクレデンシャル、サードパーティボットエコシステムという稼働中のプロダクト全体を何も壊さず、決定的には切り替え期間中になりすましの窓口を開けることなく移行すること。この最後の点こそが事例全体を貫くセキュリティの糸だ——*どのドメインが本当に自分のものか*をめぐる曖昧さは、まさに攻撃者が利用するものだ。

[Namefi](https://namefi.io)は、ドメインがインターネットネイティブなアセットとして振る舞うべきだという考えのもとに構築されている。トークン化された所有権は、DNSとの互換性を維持しながら、ドメインのコントロールを検証、移転し、現代のワークフローに統合することを容易にできる——このような取引の遅くて信頼に依存する部分（誰が何を所有しているかの確認、アセットの移転、移行を通じた継続性の維持）を、クリーンで監査可能なトランザクションに近いものに変えることで。名前の所有権が証明可能でポータブルであれば、「これが本物のDiscordか？」という問いへの答えが容易になる——企業にとっても、そのリンクをクリックする誰もにとっても。

Discord.comは今でこそ必然に見える——Discordが巨大になったからだ。しかし教訓はもっと早い段階で届く。名前がビジネスを担うことになる場合——特に回避策のドメインが詐欺師がくぐり抜けられる継ぎ目を残している場合——ドメインは飾りではない。それは玄関口であり、ひとつしかいらない。

## 出典と参考文献

- Wikipedia — [Discord (software)](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com)
- The Domains — [Discord now using Discord.com, the domain is no longer just a redirect](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017)
- Domainer — [How the Discord.com Domain Sale Reshaped the App](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020)
- GitHub (discord.py) — [Change of Discord domain from discordapp.com to discord.com (Issue #4063)](https://github.com/Rapptz/discord.py/issues/4063#:~:text=Discord%20is%20moving%20from%20discordapp.com%20to%20discord.com)
- Discord Blog — [Your Place to Talk](https://discord.com/blog/your-place-to-talk#:~:text=we%27re%20launching%20a%20new%20website%20with%20a%20new%20tagline%3A%20Your%20place%20to%20talk)
- Zscaler — [Discord CDN: A Popular Choice for Hosting Malicious Payloads](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=An%20attacker%20can%20upload%20a%20malicious%20file%20on%20a%20Discord%20channel%20and%20share%20its%20public%20link%20with%20others)
- Intel 471 — [How Discord is abused for cybercrime](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=The%20Discord%20URL%20follows%20the%20https%3A%2F%2Fcdn.discordapp.com%2Fattachments)
- ThreatDown by Malwarebytes — [New phishing campaign uses Discord for payload delivery](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=Criminals%20abuse%20Discord%20to%20host%20malware%20because%20of%20its%20robust%20CDN%20infrastructure)
- Remote Tools — [When was Discord made?](https://www.remote.tools/discord/when-was-discord-made#:~:text=Discordapp.com)
- Discord Support — [Discordapp.com is now Discord.com](https://support.discord.com/hc/en-us/articles/360042987951-Discordapp-com-is-now-Discord-com)
