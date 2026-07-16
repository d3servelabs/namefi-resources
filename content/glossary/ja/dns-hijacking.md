---
title: DNSハイジャック
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ドメインの登録情報ではなくDNS解決レイヤーを改ざんすることで、トラフィックを不正に転送する攻撃手法。
keywords: ['DNSハイジャック', 'キャッシュポイズニング', 'DNSスプーフィング', 'DNSSEC', 'トラフィックリダイレクト']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/dns-cache-poisoning/
relatedArticles:
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-sea-turtle-dns-espionage/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/the-dnspionage-campaign/
  - /ja/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-investor-field-guide/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/registrar/
  - /ja/glossary/bgp-hijack/
  - /ja/glossary/registry/
  - /ja/glossary/urs/
---

**DNSハイジャック**（DNSスプーフィングまたはキャッシュポイズニングとも呼ばれる）は、ドメインの登録自体ではなく、名前解決レイヤーを標的とする攻撃である。[レジストラ](/ja/glossary/registrar/)でドメインを奪取するのではなく、攻撃者は[DNSリゾルバー](/ja/glossary/dns-resolver/)や[ネームサーバー](/ja/glossary/nameserver/)が保持するドメインの解決先情報を密かに書き換え、訪問者を悪意あるIPアドレスへ誘導する。キャッシュポイズニング攻撃では、偽造されたDNS応答が再帰リゾルバーに受け入れられ、TTLの期間中キャッシュされることで、そのリゾルバーを利用するすべてのユーザーが誤った宛先へ誘導される——権威[DNS](/ja/glossary/dns/)レコードには何の変更も現れない。主要な技術的対策は[DNSSEC](/ja/glossary/dnssec/)であり、DNS応答に暗号署名を付与することでリゾルバーが改ざんを検出できるようにする。従来の[ドメイン窃盗](/ja/glossary/domain-theft/)とは異なり、DNSハイジャックは所有権に関するレコードを一切変更しないため、ドメインの実際の解決先を能動的に監視しなければ発見が難しい。
