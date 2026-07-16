---
title: IPアドレス（IPv4 / IPv6）
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ネットワーク上のデバイスを識別する数値アドレス。DNSがドメイン名をこのアドレスに対応付ける。
keywords: ['IPアドレス', 'IPv4', 'IPv6', 'Aレコード', 'AAAAレコード', 'ネットワーク']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc791
  - https://www.cloudflare.com/learning/dns/glossary/what-is-my-ip-address/
relatedArticles:
  - /ja/blog/the-dnspionage-campaign/
  - /ja/blog/selling-domains-as-nfts/
  - /ja/blog/the-2024-squarespace-defi-domain-hijacks/
  - /ja/blog/the-perl-com-domain-theft/
  - /ja/blog/the-sea-turtle-dns-espionage/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-investing/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
  - /ja/glossary/registrar/
  - /ja/glossary/web3/
---

**IPアドレス**とは、ネットワーク上のデバイスを識別する数値ラベルである。旧来の **IPv4** 形式では `93.184.216.34` のように表記され、**IPv6** では `2606:2800:220:1:248:1893:25c8:1946` のような長い16進数の文字列となる。IPv6が導入された背景には、世界規模でIPv4アドレスが枯渇したという事情がある。[DNS](/ja/glossary/dns/) の本来の役割は、人間が扱いやすいドメイン名をこれらのアドレスに対応付けることにある。**A** [レコード](/ja/glossary/dns-record-types/)はドメイン名をIPv4アドレスに、**AAAA** レコードはIPv6アドレスにそれぞれ紐付ける。アドレスブロックの割り当ては [IANA](/ja/glossary/iana/) が地域レジストリへ行う仕組みだ。ドメインのトークン化はこれらの仕組みより上位のレイヤーで機能するものであり、変わるのは名前の*所有者*であって、その名前が解決されるアドレスではない。
