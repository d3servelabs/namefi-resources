---
title: レジストリ
date: '2026-06-22'
language: ja
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: トップレベルドメインの権威あるデータベースとネームサーバーを運営し、小売販売をレジストラに委託する組織。
keywords: ['レジストリ', 'レジストリオペレーター', 'TLDレジストリ', 'ドメインレジストリ', 'ICANN', 'レジストラ', 'EPP', 'gTLDレジストリ', 'ccTLDレジストリ', '共有レジストリシステム']
also_known_as: ['レジストリオペレーター']
level: 2
sources:
  - https://www.icann.org/resources/pages/registries-0-2012-02-25-en
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/registry-agreements
  - https://www.icann.org/resources/pages/gtld-registry-agreement-2013-01-25-en
relatedArticles:
  - /ja/blog/what-is-a-tld/
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/top-tlds-to-secure-for-your-business/
  - /ja/blog/how-tld-affects-domain-value/
  - /ja/blog/top-tlds-to-secure-for-your-fashion-brand/
relatedTopics:
  - /ja/topics/choosing-a-tld/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/best-tlds-by-industry/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
  - /ja/glossary/dns/
  - /ja/glossary/web3/
---

**レジストリ**（*レジストリオペレーター*とも呼ばれる）とは、[TLD](/ja/glossary/tld/)の権威あるデータベースを運営する組織である。その役割は、当該拡張子の下に登録されたすべてのドメインを記録し、それらの名前を[ネームサーバー](/ja/glossary/nameserver/)にマッピングするゾーンファイルを管理し、[DNS](/ja/glossary/dns/)全体でクエリが機能するためのデータを公開することである。レジストリはドメイン名のサプライチェーンの最上位に位置し、[レジストラ](/ja/glossary/registrar/)や[レジストラント](/ja/glossary/registrant/)よりも上位にある。

## レジストリの機能

レジストリの中核的な機能は、自らのTLD配下のすべてのドメインに関する**権威あるデータベース**（*レジストリデータベース*または*共有登録システム*とも呼ばれる）を維持管理することである。ドメインが新規作成、更新、移管、または削除されると、レジストリはその変更を記録する。また、レジストリは**TLDゾーンファイル**を公開する。これは、当該TLD配下の名前に対するクエリをどこに送るかをグローバル[DNS](/ja/glossary/dns/)に伝える[ネームサーバー](/ja/glossary/nameserver/)の委任情報の集合体である。

データベース管理に加え、ほとんどのレジストリは自らのTLD向けの**権威ネームサーバー**（TLDネームサーバーとも呼ばれる）を直接運営するか、または委託契約を結んでいる。これらのサーバーは、たとえば「`example.com` に対して権威を持つネームサーバーはどれか？」というリゾルバからのクエリに応答し、レジストリのゾーンファイルから回答を返す。

技術的な業務のほかに、レジストリは以下を担う。

- **卸売価格の設定** — [レジストラ](/ja/glossary/registrar/)がドメインを年単位で購入する際の価格を決定する。
- **登録ポリシーの策定と執行** — 資格要件、許容利用規則、新しい拡張子向けのサンライズ期間や商標保護期間を定める。
- **WHOIS / RDAP** 検索サービスを運営し、登録データを一般に公開する。
- 義務と性能基準を定める登録契約に基づき、[ICANN](/ja/glossary/icann/)と協調する（[ICANN レジストリ契約](https://www.icann.org/en/registry-agreements)）。

## レジストリ・レジストラ・レジストラントの違い

ドメイン名業界は、[ICANN](/ja/glossary/icann/)が確立した三層モデルを基盤に構成されている。

| 階層 | 役割 | 代表例 |
|------|------|--------|
| **レジストリ** | TLDデータベースを運営し卸売価格を設定する。消費者への直接販売は行わない | Verisign（.com、.net）、PIR（.org）、DENIC（.de） |
| **[レジストラ](/ja/glossary/registrar/)** | ICANNに認定された小売業者。EPP経由でレジストリと接続し、一般公衆にドメインを販売する | GoDaddy、Namecheap、Google Domains |
| **[レジストラント](/ja/glossary/registrant/)** | ドメイン名を登録する個人または組織 | ドメインを購入するあらゆる企業・個人 |

レジストリとレジストラはいずれも[ICANN](/ja/glossary/icann/)の認定を受けているが、それぞれ明確に異なる役割を担う。ICANNの垂直分離規則により、レジストリは自らのTLDに対して小売レジストラとしても機能することは原則として認められていない（一部例外あり）。この分離は意図的なものであり、レジストリが自らに優遇価格を設けたり、一般公衆に先んじて望ましいドメイン名に優先アクセスしたりすることを防ぐためである。

## レジストリとレジストラの連携モデル

レジストリとレジストラを技術的につなぐ橋渡しが、**[Extensible Provisioning Protocol（EPP）](/ja/glossary/epp/)** である。これは [RFC 5730](https://www.rfc-editor.org/rfc/rfc5730) に定義されたXMLベースのプロトコルであり、レジストラはレジストリのEPPサーバーに接続してドメインのライフサイクル操作を実行する。操作には `check`（名前は利用可能か？）、`create`、`renew`、`transfer`、`update`、`delete` が含まれる。

このモデルでは以下のように機能する。

1. レジストラは[ICANN](/ja/glossary/icann/)との**レジストラ認定契約（RAA）**を締結し、さらに販売を希望する各レジストリとの**レジストリ・レジストラ間契約**を個別に結ぶ。
2. レジストリはレジストラに**卸売料金**を請求する（たとえば、Verisign は2024年時点で認定レジストラに対して `.com` 1件あたり約10.26ドル/年を請求している）。
3. レジストラは利益を上乗せして[レジストラント](/ja/glossary/registrant/)に**小売価格**で販売する。
4. レジストラはレジストリに[EPP](/ja/glossary/epp/)コマンドを送信し、レジストリは権威あるデータベースとゾーンファイルを更新する。これにより、ドメインは数分以内にDNS全体で有効となる。

このアーキテクチャは**共有レジストリシステム（SRS）**とも呼ばれ、単一のレジストリが何百もの競合するレジストラを同時にサポートできる。すべてのレジストラが標準化された[EPP](/ja/glossary/epp/)トランザクションを通じて同一の権威あるデータベースに書き込む仕組みである。レジストラ層での競争により小売価格が抑制され、特定の再販業者がTLDへのアクセスを独占することを防いでいる。

## 具体例

**汎用TLDレジストリ**

- **Verisign** は、登録数で最大の[gTLD](/ja/glossary/gtld/)である `.com` と `.net` を運営している。[ICANN](/ja/glossary/icann/)との登録契約は公開されており、参照モデルとして広く引用されている（[IANA ルートデータベースの .com エントリ](https://www.iana.org/domains/root/db/com.html)）。
- **Public Interest Registry（PIR）** は `.org` を運営している。元々は非商業組織を対象とした非営利レジストリとして設立された。
- **Identity Digital**（旧 Donuts および Afilias）は、委任された[新しいgTLD](/ja/glossary/new-gtld/)の最大規模のオペレーターの一つであり、`.blog`、`.online`、`.store`、`.news` など数百の拡張子を運営している。

**国別コードTLDレジストリ**

[ccTLD](/ja/glossary/cctld/)レジストリは、[ICANN](/ja/glossary/icann/)の[gTLD](/ja/glossary/gtld/)契約ではなく、国または地域の権限の下で運営される。ただし、多くは依然として[EPP](/ja/glossary/epp/)を介してレジストラと連携している。

- **Nominet**（.uk）— 英国のレジストリ。1996年に設立された非営利組織。
- **DENIC**（.de）— ドイツの協同組合型レジストリ。レジストラの会員組織によって運営されている。
- **AFNIC**（.fr）— フランスのレジストリ。フランス政府からの委任に基づいて運営されている。
- **VeriSign** / **CNNIC**（.cn）— 中国の国別コードレジストリ。中国インターネット情報センター（CNNIC）によって運営されている。

ccTLDレジストリは、世界中のすべてのTLD委任の権威あるリストである IANA ルートデータベース（[iana.org/domains/root/db](https://www.iana.org/domains/root/db)）に掲載されている。

## 新しいgTLDレジストリ

2012年以前、汎用TLDの種類は少なく安定していた（`.com`、`.net`、`.org`、`.info`、`.biz` など少数の拡張子のみ）。ICANNが2012年に開始した**新しいgTLDプログラム**により、ほぼあらゆる文字列を[新しいgTLD](/ja/glossary/new-gtld/)として申請することが可能となり、最終的に1,200以上の新しい拡張子が委任された。

新しい[gTLD](/ja/glossary/gtld/)レジストリは、[ICANN](/ja/glossary/icann/)との**登録契約（Registry Agreement）**に基づいて運営される。この契約は、技術要件（EPPサポート、DNSSEC、RDAP）、性能基準（システム可用性、クエリ応答時間）、および政策上の義務（不正利用対策、商標保護クリアリングハウスのサンライズ期間やUniform Rapid Suspension（URS）制度などの商標保護メカニズム）を定めている。

新しいgTLDの登録契約の全一覧は、ICANNのウェブサイト（[icann.org/en/registry-agreements](https://www.icann.org/en/registry-agreements)）で公開されている。

## レジストリとトークン化ドメイン

Unstoppable Domains や ENS（Ethereum Name Service）など一部の代替ドメイン名前空間では、ICANNが調整するDNSゾーンではなく、パブリックブロックチェーン上にアンカーされたドメインに似た名前を発行している。これらのシステムでは、所有権はレジストリデータベースではなくスマートコントラクトに記録され、名前解決にはブラウザ拡張機能や互換リゾルバが必要であり、標準的なDNSルックアップの経路は利用しない。

これらのブロックチェーンベースの名前空間はIANAのルートに委任されておらず、デフォルトでは通常のDNSリゾルバからは参照できない。上述のICANNレジストリシステムとは独立して運営されている。
