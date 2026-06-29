---
title: サブドメイン
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: ドメインにプレフィックスを付加して独立したアドレスを作成する仕組み。blog.example.com や app.example.com などがその例。
keywords: ['サブドメイン', 'ホスト', 'blog.example.com', 'DNS', 'セカンドレベルドメイン']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/glossary/what-is-a-subdomain/
relatedArticles:
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/what-is-a-tld/
  - /ja/blog/domain-hacks-explained/
  - /ja/blog/domain-terminology-guide/
  - /ja/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/dns/
  - /ja/glossary/tld/
  - /ja/glossary/registrar/
  - /ja/glossary/registry/
  - /ja/glossary/domain-forwarding/
---

**サブドメイン**とは、ドメインの前にプレフィックスを付加することで、そのドメイン配下に独立したアドレスを作成する仕組みを指す。`blog.example.com`、`app.example.com`、`mail.example.com` はいずれも `example.com` のサブドメインである。作成するには、親ドメインの[ネームサーバー](/ja/glossary/nameserver/)に[DNS レコード](/ja/glossary/dns-record-types/)（通常は A レコードまたは CNAME レコード）を追加するだけでよく、新たな登録手続きや追加費用は不要だ。サブドメインを活用すると、1 つの登録済みドメインで複数のサービスをホストできるため、サイト・アプリ・API を構築する際の基本的な構成要素となっている。
