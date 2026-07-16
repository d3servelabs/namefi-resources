---
title: IDN（国際化ドメイン名）/ Punycode
date: '2026-06-22'
language: ja
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ASCII以外の文字を使用するドメイン名で、DNSではxn--で始まるASCII形式のPunycodeにエンコードされる。
keywords: ['IDN', '国際化ドメイン名', 'Punycode', 'xn--', 'Unicodeドメイン', 'ホモグラフ']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5890
  - https://www.icann.org/resources/pages/idn-2012-02-25-en
relatedArticles:
  - /ja/blog/what-is-a-tld/
  - /ja/blog/from-discordapp-com-to-discord-com/
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/cybersquatting-vs-domaining-udrp-acpa/
  - /ja/blog/domain-hacks-explained/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-investing/
relatedSeries:
  - /ja/series/domain-flipping-skills/
  - /ja/series/domain-apocalypse/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/registry/
  - /ja/glossary/tld/
  - /ja/glossary/dns/
  - /ja/glossary/phishing/
---

**IDN（国際化ドメイン名）**とは、`münchen.de`、`中国.cn`、絵文字ドメインのように、ASCII以外の文字を含むドメイン名のことであり、基本的なラテン文字以外の文字体系でもドメイン名を表記できるようにするものである。[DNS](/ja/glossary/dns/)自体はASCII文字しか扱えないため、IDNは**Punycode**と呼ばれるASCII互換の文字列にエンコードされる。Punycodeは常に`xn--`というプレフィックスで始まり（例：`münchen`は`xn--mnchen-3ya`となる）、[レジストリ](/ja/glossary/registry/)および[レジストラ](/ja/glossary/registrar/)は[TLD](/ja/glossary/tld/)レベルでIDNをサポートしている。ただし、視覚的に類似した文字を利用した*ホモグラフ*攻撃が[フィッシング](/ja/glossary/phishing/)に悪用されるリスクがあることも広く知られている。
