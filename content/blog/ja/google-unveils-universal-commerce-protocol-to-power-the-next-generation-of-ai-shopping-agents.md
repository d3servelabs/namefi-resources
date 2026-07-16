---
title: 'GoogleがAIショッピングエージェント次世代を支える「Universal Commerce Protocol」を発表'
date: '2026-01-15'
language: ja
tags: ['Infrastructure', 'AI Agents', 'Digital Commerce']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['chie-kudo']
draft: false
cluster: web3-foundations
format: news
description: UCPはエージェントネイティブなコマースを実現するGoogleの戦略で、AIアシスタントがチャット画面を離れることなく商品の発見から決済まで一貫して処理できるオープンスタンダードです。
keywords: ['Universal Commerce Protocol', 'UCP', 'Google UCP', 'AIショッピングエージェント', 'AI駆動コマース', 'エージェンティックコマース', 'AI eコマースプロトコル', '会話型コマース', 'AI決済', 'eコマースの未来', 'エージェントベースショッピング', 'オープンコマース標準', 'Google AI', 'Gemini AI', 'エージェントエンジン最適化']
relatedArticles:
  - /ja/blog/ai-vs-io-domain/
  - /ja/blog/the-12-dollar-minute-someone-owned-google-com/
  - /ja/blog/top-tlds-to-secure-for-your-ecommerce-store/
  - /ja/blog/from-mona-co-to-crypto-com/
  - /ja/blog/from-mrchewy-com-to-chewy-com/
relatedTopics:
  - /ja/topics/web3-foundations/
  - /ja/topics/choosing-a-tld/
relatedSeries:
  - /ja/series/name-change-game-change/
  - /ja/series/best-tlds-by-industry/
relatedGlossary:
  - /ja/glossary/icann/
  - /ja/glossary/registrar/
  - /ja/glossary/ai-agent/
  - /ja/glossary/tld/
  - /ja/glossary/web3/
---

Googleは従来のeコマースにおける「[リンク税](https://ccianet.org/advocacy/link-taxes/)」との全面対決を正式に宣言した。今週開催された[全米小売業協会（NRF）](https://nrf.com/)カンファレンスにおいて、同社はオープンソース標準規格[Universal Commerce Protocol（UCP）](https://ucp.dev/)の公開を発表した。UCPは、GeminiをはじめとするAIエージェントが、チャット画面から一切離れることなく商品の発見から決済まで購買プロセス全体を完結させることを可能にする設計となっている。

このプロトコルは[Shopify](http://shopify.com)・[Walmart](http://walmart.com)・[Target](http://target.com)・[Etsy](http://etsy.com)といった小売業の大手各社と共同開発されており、勃興しつつあるエージェンティックウェブが長年抱えてきた「[N × N](https://thingsithinkithink.blog/posts/2025/04-08-the-m-x-n-problem-in-software-architecture/)」統合問題の解決を目指している。これまでAIに購買行動を担わせるには、販売事業者ごとに個別のインテグレーションを構築する必要があった。UCPはエージェントと販売事業者のバックエンドが在庫確認・動的価格設定・安全な決済処理について「交渉」するための標準言語を提供する。

*「AIエージェントは、そう遠くない将来、私たちの購買行動の重要な一翼を担うようになるでしょう」*とGoogle CEO[サンダー・ピチャイ](https://www.britannica.com/money/Sundar-Pichai)はX上の投稿で述べた。*「UCPはネイティブチェックアウトを支えており、AI ModeおよびGeminiアプリ上で直接購入することが可能です。」*

### 技術的な仕組み

技術的には、UCPは[抽象化レイヤー](https://www.strata.io/glossary/abstraction-layer/)として機能する。「ショッピングサービス」（チェックアウトセッション、明細項目）と「ケーパビリティ」（配送、ロイヤルティプログラム）を分離する設計だ。[Model Context Protocol（MCP）](https://modelcontextprotocol.io/docs/getting-started/intro)およびGoogleが独自に開発した[Agent Payments Protocol（AP2）](https://ap2-protocol.org/)との完全互換性を備えており、Googleがエージェンティックコマースの基盤インフラを押さえようとしていることを示している。すべての店舗を自社で保有しなくとも、商取引の「レール」を掌握するという戦略だ。

### Amazonという存在

この動きは、[Amazon](http://amazon.com)に対する明確な牽制でもある。Amazonはこれまで、自社の商品データをスクレイピングしているとして[Perplexity](http://perplexity.ai)などのAI検索エンジンに対し法的措置を強化してきた。Googleはエージェントによるスクレイピングと販売に事業者が自発的に参加できるオープン標準を策定することで、賛同者による連合を形成している。実質的には、小売事業者がAmazonの囲い込みを迂回し、世界で最も広く使われているAIモデルを通じて直接販売できる道筋を提供するものだ。

現時点でUCPの展開は米国の限られたパートナー企業からスタートするが、そのメッセージは明確だ。[SEO](/ja/glossary/seo/)の時代は終わりを迎えつつあり、AEO（エージェントエンジン最適化）の時代が幕を開けた。
