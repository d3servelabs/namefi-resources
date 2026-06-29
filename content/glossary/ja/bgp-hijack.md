---
title: BGPハイジャック
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: 偽のIPルートアナウンスによってインターネットトラフィックを迂回させる、DNSより下位のネットワーク層で起きる攻撃。
keywords: ['BGPハイジャック', 'ルートハイジャック', 'IPプレフィックス', 'ネットワークセキュリティ', 'インターネットルーティング']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
relatedArticles:
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/the-dnspionage-campaign/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-sea-turtle-dns-espionage/
  - /ja/blog/how-domain-hijacking-actually-happens/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/dns-hijacking/
  - /ja/glossary/icann/
  - /ja/glossary/public-key/
  - /ja/glossary/web3/
---

**BGPハイジャック**（Border Gateway Protocolハイジャック）は、悪意のある、あるいは誤設定された自律システム（AS）が虚偽のルーティングアナウンスをブロードキャストするネットワーク層の攻撃である。これにより、インターネット上の他のルーターが正規の[IPアドレス](/ja/glossary/ip-address/)宛てのトラフィックを攻撃者のインフラ経由で転送するよう誘導される。[DNSハイジャック](/ja/glossary/dns-hijacking/)が名前とIPのマッピングを改ざんするのとは異なり、BGPハイジャックはルーティング層で機能するため、ドメインのDNSレコードは改変されず、[DNSSEC](/ja/glossary/dnssec/)もこの攻撃に対しては無効である。トラフィックが迂回されると、攻撃者はTLS証明書の発行を傍受したり（BGPハイジャックは、HTTPベースのドメイン検証を使用する認証局から不正な証明書を取得するために悪用された事例がある）、暗号化されていないトラフィックを盗聴したり、中間者攻撃を実行したりすることが可能になる。対策としては、RPKI（Resource Public Key Infrastructure）を用いたルートオリジン検証や、予期しないASがプレフィックスをアナウンスした際に警告を発する監視サービスの活用が挙げられる。
