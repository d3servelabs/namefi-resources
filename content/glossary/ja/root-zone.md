---
title: ルートゾーン（ルートサーバー）
date: '2026-06-22'
language: ja
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: すべての TLD とその権威サーバーを一覧するDNS階層の最上位。
keywords: ['ルートゾーン', 'ルートサーバー', 'DNS階層', 'TLD委任', 'IANA']
level: 1
sources:
  - https://www.iana.org/domains/root
  - https://www.iana.org/domains/root/servers
relatedArticles:
  - /ja/blog/what-is-a-tld/
  - /ja/blog/premium-web3-tlds/
  - /ja/blog/the-malaysia-airlines-dns-hijack/
  - /ja/blog/what-are-tokenized-domains/
  - /ja/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /ja/topics/choosing-a-tld/
  - /ja/topics/domain-security/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/tokenize-your-com/
relatedGlossary:
  - /ja/glossary/tld/
  - /ja/glossary/dns/
  - /ja/glossary/registry/
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
---

**ルートゾーン**は、[DNS](/ja/glossary/dns/) 階層の最頂点に位置するものであり、すべての [TLD](/ja/glossary/tld/) と、それぞれの TLD に対して権威を持つ [レジストリ](/ja/glossary/registry/) サーバーを示すマスターリストです。ルートゾーンは **ルートサーバー** によって提供されます。ルートサーバーは世界中に分散した13のアドレスで構成されるシステム群であり、そのゾーンの内容は [IANA](/ja/glossary/iana/) が管理しています。キャッシュに存在しないドメイン名の問い合わせはすべてここから始まります。[リゾルバー](/ja/glossary/dns-resolver/) がルートに対して `.com` の所在を尋ね、その回答をたどって階層を下っていきます。
