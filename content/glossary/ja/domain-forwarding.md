---
title: ドメイン転送
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: 訪問者をあるドメインから別のURLへ自動的に転送する設定。多くの場合、301リダイレクトを使用して行われる。
keywords: ['ドメイン転送', '301リダイレクト', 'URLリダイレクト', 'DNS', 'ドメイン管理']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
relatedArticles:
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/the-fox-it-dns-hijack/
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/from-twitter-com-to-x-com/
  - /ja/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-investing/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/name-change-game-change/
relatedGlossary:
  - /ja/glossary/301-redirect/
  - /ja/glossary/registrar/
  - /ja/glossary/dns/
  - /ja/glossary/icann/
  - /ja/glossary/tld/
---

**ドメイン転送**（*URLフォワーディング*または*301リダイレクト*とも呼ばれる）とは、あるドメインに到達したすべての訪問者を、別の宛先URLへ自動的に転送する設定のことである。[301リダイレクト](/ja/glossary/301-redirect/)方式を採用すると、その移転が恒久的なものであることを検索エンジンに伝え、元のドメインが持つリンクエクイティの大部分を転送先へ引き継ぐことができる。そのため、ブランドの統合やトラフィックの移行を行う際に最も適した選択肢とされている。転送の設定は、レジストラのコントロールパネルから行うか、リダイレクトルールを適用するウェブサーバーを指し示す[DNSレコードタイプ](/ja/glossary/dns-record-types/)を設定することで実現できる。典型的な活用例としては、類似した[サブドメイン](/ja/glossary/subdomain/)やタイポ（誤入力）バリアントのドメインを取得し、メインサイトへ転送することで、迷い込んだトラフィックを取り込む手法が挙げられる。なお、ドメイン転送はDNSの完全な委任とは異なる概念である。ドメイン自体は引き続きDNSを通じて名前解決されるが、HTTPレベルの命令によってブラウザのリダイレクトが行われる点が特徴である。
