---
title: 'ドメインハイジャックの実態：5つの攻撃経路とその対策'
date: '2026-05-10'
language: ja
tags: ['security', 'domains', 'registrar', 'incident-response', 'domain-flipping']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 1
format: case-study
description: ソーシャルエンジニアリング、レジストラアカウントへの不正アクセス、DNSプロバイダーの乗っ取り、NSハイジャック、失効ドメインの奪取——攻撃者が実際にドメインを乗っ取る5つの手口と、それぞれを防ぐ具体的な対策を解説します。
ogImage: ../../assets/how-domain-hijacking-actually-happens-og.jpg
keywords: ['ドメインハイジャック', 'ドメインセキュリティ', 'レジストラロック', 'トランスファーロック', 'dnssec', '二要素認証', 'ソーシャルエンジニアリング', 'ダングリングDNS', 'namefi']
relatedArticles:
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-godaddy-multi-year-breach/
  - /ja/blog/the-badgerdao-frontend-attack/
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/the-perl-com-domain-theft/
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

「[ドメインハイジャック](/ja/glossary/domain-hijacking/)」という言葉は劇的に聞こえるが、実際には発生の経緯によって意味が大きく異なる。[フィッシング](/ja/glossary/phishing/)メールによって乗っ取られた[レジストラ](/ja/glossary/registrar/)アカウントもハイジャックだ。[DNS](/ja/glossary/dns/)プロバイダー上で密かに書き換えられた[ネームサーバー](/ja/glossary/nameserver/)レコードもハイジャックだ。失効したドメインを他者が取得して別の場所に向け直すことも、ある意味ではハイジャックと言える。

いずれの場合も結果は同じだ。あなたのドメイン名がどこを指すかを、今や別の誰かが世界に向けて宣言している。メール、決済、ログインフロー、SaaS連携——すべてのトラフィックが攻撃者のもとへ流れ始める。復旧には数日、場合によっては数週間かかる。別のレジストラへ移転されていた場合、[ICANN](/ja/glossary/icann/)の[Transfer Dispute Resolution Policy (TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.)が適用される場合もある。それ以外のケースでは、レジストラへのエスカレーション、[レジストリ](/ja/glossary/registry/)へのエスカレーション、プラットフォームによる復旧、あるいは裁判所命令が必要になることも多い。最善の対策は、そもそもその状況に陥らないことだ。

本稿では、最も頻繁に見られる5つの攻撃経路を取り上げ、防御する側からの見え方と、それぞれを実際に防ぐ具体的な対策を解説する。

## 1. レジストラのサポートチームへのソーシャルエンジニアリング

過去10年間に発生した注目度の高いハイジャック事例の多くは、技術的な脆弱性を悪用したものではない。電話一本がきっかけだった。

典型的な手口はこうだ。攻撃者はターゲットに関する情報——[WHOIS](/ja/glossary/whois/)の履歴、LinkedIn、流出したパスワードダンプ、SNS——を集める。そしてレジストラのサポートチームに電話またはメールをして、所有者になりすます。パスワードのリセット、メールアドレスの変更、または移転用の[認証コード](/ja/glossary/auth-code/)を要求する。サポート担当者が攻撃者の想定どおりの確認手順を踏んでしまえば、アカウントは乗っ取られる。

この手口は、暗号資産取引所、広告プラットフォーム、インフラ系ブランドが被害を受けた特に深刻なハイジャック事例の背景にあったものだ。レジストラのコードに脆弱性は必要ない——プロセスに関与する人間を利用するのだ。

**有効な対策：**

- **レジストラ側での厳格なルール**：所有者変更には、公証済みの書類か、[登録者](/ja/glossary/registrant/)の既存チャンネルを使った多要素認証による確認を必須とする。
- **[レジストリロック](/ja/glossary/registry-lock/)（レジストラロックとは別のもの）**：レジストリオペレーター自身が、アウトオブバンドでの確認なしに移転や連絡先変更の要求に応じない仕組み。`.com`、`.net`、多くの国別ドメイン（ccTLD）で利用可能。
- **実際に利用しているレジストラを確認し、他のアカウントを削除する**。2007年頃に立ち上げたブランドなら、認証情報が脆弱なまま3〜4社のレジストラに休眠アカウントが残っていることも珍しくない。

## 2. レジストラアカウントの不正アクセス（認証情報の悪用）

ソーシャルエンジニアリングの技術的な亜種だ。攻撃者はレジストラアカウントの認証情報をフィッシングで入手するか、クレデンシャルスタッフィングのダンプから発見して直接ログインする。その後はドメインのロックを解除し、連絡先メールアドレスを変更して、移転を申請する。

**有効な対策：**

- **レジストラアカウントへのフィッシング耐性のある2要素認証（2FA）**。認証アプリによるTOTPが最低ラインで、ハードウェアキー（WebAuthn / FIDO2）が理想的な選択だ。SMS方式の2FAでは不十分——SIMスワッピング攻撃によって繰り返し突破されてきた。米国政府のCISAガイダンス（[CISA guidance](https://www.cisa.gov/secure-our-world/turn-mfa)）はSMSから移行するよう明示的に推奨している。
- **アカウント単位のロックに加えて、ドメイン単位のロックをサポートするレジストラ**を選ぶ。単一アカウントが侵害されても、すべてのドメインのロックが一度に解除されないようにするためだ。
- **連絡先変更、ネームサーバー変更、移転申請に対する監査ログとアラート**。攻撃者がまず行うのはそのアラートを止めることだ。攻撃者が制御できないチャンネルにアラートが飛べば、早期に気づける。

## 3. DNSプロバイダーの乗っ取り

レジストラアカウントが厳重に保護されていても、レジストラが公開している*ネームサーバー*が、別のアカウントで管理されているDNSプロバイダー——Cloudflare、Route 53、NS1、DNSimple、独自のBINDサーバーなど——を指している場合がある。攻撃者がそのDNSアカウントに侵入すれば、レジストラには一切手を触れる必要がない。A、MX、TXTレコードを書き換えるだけで、トラフィックは追随する。

ブランドはレジストラのセキュリティには投資する一方、DNSプロバイダーを「インフラ」として扱い、管理が甘くなりがちだ。攻撃者にとってはこちらのほうが狙いやすい経路になっていることも多い。

**有効な対策：**

- **DNSプロバイダーアカウントにも、レジストラと同水準の2FAを適用する**。同等に機密性の高い資産として扱うべきだ。実際そうなのだから。
- **ゾーンレベルで署名された[DNSSEC](/ja/glossary/dnssec/)**。ただし、DNSSECはDNSプロバイダーアカウントの侵害を防ぐものではない。攻撃者がプロバイダーを通じてレコードを公開でき、そのプロバイダーがゾーンのアクティブな鍵でそれに署名すれば、検証リゾルバーはその回答を正当なものとして扱う。DNSSECが防ぐのは、経路上での改ざん、キャッシュポイズニング、未署名または不正署名の偽造回答だ——親ゾーンが正しいDSレコードを公開していることが前提となる。プロトコルの詳細は[RFC 4033-4035](https://datatracker.ietf.org/doc/html/rfc4033)を参照されたい。
- **別々のアカウントと認証情報を持つ複数のDNSプロバイダー**を使い、[マルチシグナーDNSSEC](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.)を採用する。可用性とプロバイダーの分離に効果があるが、それが機能するのはすべてのプロバイダーが意図したゾーンデータを提供し、DNSKEY/DSセットが正しく調整されている場合に限られる。侵害されていないプロバイダーをリゾルバーが自動的に優先するような魔法の仕組みではない。

## 4. 古い委任設定とダングリングレコードを狙ったネームサーバーハイジャック

より巧妙な亜種がある。ドメイン自体には問題がないが、*[サブドメイン](/ja/glossary/subdomain/)*が（CNAMEまたはNSレコード経由で）、元の所有者がもはや管理していないサードパーティのサービスを指している場合だ。攻撃者がそのサードパーティ側でリソースを登録すると、サブドメインへの応答を制御できるようになる。

具体的な例：

- リリース済みのHeroku、S3、またはAzureのアセットにCNAMEされたサブドメイン。攻撃者がそのアセット名を再取得し、有効なTLS証明書を入手する。
- 削除されたDNSプロバイダーのアカウントを指す`NS`レコード。攻撃者がまったく同じホストパターンで新規アカウントを作成し、サブドメインに対して好き勝手なレコードを提供する。

これらは**ダングリングDNS**という総称で整理されており、今日のオープンウェブで最も多く見られる「実際の」ドメインハイジャックの形態だ。大規模な組織は数百から数千のサブドメインを持ちながら、そのごく一部しか監査していないことが多いためだ。

**有効な対策：**

- **所有するすべてのゾーンの、すべてのNS、CNAME、ALIASレコードを網羅した台帳**を作成し、それぞれに担当者を割り当てる。
- **定期的にすべてのレコードを再解決し、もはや応答しないサードパーティサービスを指しているものにフラグを立てる、自動ダングリングDNSスキャナー**を導入する。[GitHubのブログ](https://github.blog/2021-12-13-securing-our-home-labs-frigate-version-bump/)と[Detectify Labs](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/)に、この攻撃クラスに関する継続的なレポートがある。
- **サービスを廃止した当日に、対応するDNSレコードも削除する**。

## 5. 失効ドメインの取得

最もシンプルで、同情の余地が少ない手口だ。登録者が更新を忘れた。[猶予期間](/ja/glossary/grace-period/)が過ぎる。ドメインがプールに戻る。他の誰かが登録する。

一見、セキュリティインシデントではなく運用上のミスに見えるかもしれないが、影響は同じだ。他の誰かがそのドメイン名を支配しており、長年かけて築いた信頼のシグナル——SPF、DKIM、OAuthコールバック、パスワードリセットメール、決済連携——がすべて見知らぬ者のもとへ流れ始める。公開事例の中には、OAuthトークンの`iss`クレームやトランザクションメールの送信元として登録されていたため、攻撃者が[失効ドメイン](/ja/blog/expired-domains-and-the-drop-cycle/)を意図的に購入したケースも複数ある。

**有効な対策：**

- **認証、決済、または本番トラフィックに関わるドメインは、5〜10年の長期更新**を行う。コストはわずかだが、保護効果は大きい。
- **サイレントに失敗しない支払い方法によるオートリニューアル**を設定する。カードの有効期限切れは、意図しない失効の最も多い原因だ。
- **90日、60日、30日、7日前に通知が届くカレンダーリマインダー**を、会社を去るかもしれない1人の個人の受信箱ではなく、*チーム*のアドレスに設定する。

## 理想的な状態

これらの対策をまとめると、重要なドメインに必要な最低限のベースラインは次のようになる：

| 対策                                          | 防ぐ攻撃経路                                        |
| --------------------------------------------- | --------------------------------------------------- |
| レジストラへのハードウェアキー2FA             | アカウントへの不正アクセス（経路2）                 |
| DNSプロバイダーへのハードウェアキー2FA        | DNSの乗っ取り（経路3）                              |
| レジストリロック（利用可能な場合）            | ソーシャルエンジニアリング（経路1）                 |
| ゾーンレベルでのDNSSEC署名                    | DNS経路上の改ざんと偽造回答                         |
| サブドメイン台帳とダングリングスキャナー      | サブドメインハイジャック（経路4）                   |
| 5〜10年更新 + オートリニューアル             | 意図しない失効（経路5）                             |
| 連絡先・NS・移転変更のアラート               | 5つすべて（早期に気づける）                         |

あるドメインを管理していて、この表のすべての行にチェックを入れられないなら、攻撃者の仕事は確実に楽になっている。

## Namefiがもたらす変化

上記の対策のほとんどは、あるレジストラ、あるDNSプロバイダー、あるワークフローツールの機能として存在しており、セキュリティの強度は最も弱いアカウントに依存する。Namefiは登録者の関係を[オンチェーン](/ja/glossary/on-chain/)でトークン化する。つまり、*この名前を誰が所有しているか*という権威ある記録が、特定のレジストラの顧客データベースの外に存在することを意味する。いずれかのプロバイダーのサポート担当者が、正当な所有者が承認しなければならない署名済みトランザクションなしに、ひっそりと所有権を変更することはできない。レジストラが引き続き技術的な委任を担うが、*制御*レイヤーはソーシャルエンジニアリングが通用しない場所に移されている。

これは上記の表にある対策を完全に代替するものではない——DNSSEC、DNSプロバイダーへの2FA、更新も引き続き必要だ。しかし、最も頻繁に発生し影響が大きいハイジャックのベクター（経路1）を、脅威モデルから完全に取り除くことができる。

## 出典・参考資料

- ICANN — [Transfer Dispute Resolution Policyの範囲](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.)
- IETF — [DNSSEC RFC 4033/4034/4035](https://datatracker.ietf.org/doc/html/rfc4033)および[マルチシグナーDNSSEC RFC 8901](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.)
- CISA — [多要素認証ガイダンス](https://www.cisa.gov/secure-our-world/turn-mfa)
- Detectify Labs — [サブドメイン乗っ取りの解説](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/)
- Verisign — [.com/.netのレジストリロック](https://www.verisign.com/en_US/channel-resources/domain-registry-products/registry-lock/index.xhtml)
