---
title: 301リダイレクト
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: ページが新しいURLへ恒久的に移動したことを、ブラウザと検索エンジンに伝えるHTTPステータス。
keywords: ['301 redirect', 'permanent redirect', 'http redirect', 'seo', 'domain forwarding', 'link equity']
also_known_as: ['恒久リダイレクト']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
---

**301リダイレクト**（*恒久リダイレクト* とも呼ばれます）は、リソースが新しい URL へ恒久的に移動し、今後のリクエストは新しい移動先へ送るべきだとブラウザと検索エンジンに知らせる HTTP レスポンスコードです。「301」は一時的な 302 リダイレクトと区別されます。301 では、Google は古い URL から新しい URL へ、リンクエクイティや[アンカーテキスト](/ja/glossary/anchor-text/)を含むランキングシグナルを統合するため、[SEO](/ja/glossary/seo/)価値を失わずに[ドメイン転送](/ja/glossary/domain-forwarding/)を行う標準的な仕組みです。実務上は、ドメイン投資家が強い[ドメインオーソリティ](/ja/glossary/domain-authority/)を持つ古いドメインを取得し、対象サイトへ向けることで、蓄積されたリンクエクイティの多くを移動先へ渡せることを意味します。この移行は即時ではなく、Google がシグナルを統合するには通常数週間かかり、常に 100% でもありません。そのため 301 は有用ですが、完全な評価移植ではありません。
