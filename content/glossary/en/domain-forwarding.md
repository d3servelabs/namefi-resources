---
title: Domain Forwarding
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: Sending visitors from one domain automatically to another address, often via a 301 redirect.
keywords: ['domain forwarding', '301 redirect', 'URL redirect', 'DNS', 'domain management']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
relatedArticles:
  - /en/blog/how-domain-hijacking-actually-happens/
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-lenovo-com-dns-hijack/
  - /en/blog/from-twitter-com-to-x-com/
  - /en/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-investing/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/301-redirect/
  - /en/glossary/registrar/
  - /en/glossary/dns/
  - /en/glossary/icann/
  - /en/glossary/tld/
---

**Domain forwarding** (also called *URL forwarding* or a *301 redirect*) is a configuration that automatically sends every visitor who arrives at one domain to a different destination URL. The [301 redirect](/en/glossary/301-redirect/) variant signals to search engines that the move is permanent, passing most of the original domain's link equity to the target — making it the preferred choice when consolidating brands or migrating traffic. Forwarding is configured either at the registrar control panel or by setting a [DNS record type](/en/glossary/dns-record-types/) that points to a web server applying the redirect rule. A common use case is buying a matching [subdomain](/en/glossary/subdomain/) or typo variant and forwarding it to the main site to capture stray traffic. Forwarding is distinct from full DNS delegation: the domain still resolves through DNS, but HTTP-level instructions redirect the browser.
