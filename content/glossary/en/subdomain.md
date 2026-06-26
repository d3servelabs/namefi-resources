---
title: Subdomain
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A prefix added to a domain to create a separate address, such as blog.example.com or app.example.com.
keywords: ['subdomain', 'host', 'blog.example.com', 'DNS', 'second-level domain']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/glossary/what-is-a-subdomain/
relatedArticles:
  - /en/blog/how-domain-hijacking-actually-happens/
  - /en/blog/what-is-a-tld/
  - /en/blog/domain-hacks-explained/
  - /en/blog/domain-terminology-guide/
  - /en/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/tld/
  - /en/glossary/registrar/
  - /en/glossary/registry/
  - /en/glossary/domain-forwarding/
---

A **subdomain** is a prefix added to your domain to create a distinct address under it — `blog.example.com`, `app.example.com`, or `mail.example.com` are all subdomains of `example.com`. You create one by adding a [DNS record](/en/glossary/dns-record-types/) (usually an A or CNAME) at the [nameservers](/en/glossary/nameserver/) for the parent domain, with no extra registration or fee. Subdomains let one registered name host many services, which is why they are a building block for sites, apps, and APIs.
