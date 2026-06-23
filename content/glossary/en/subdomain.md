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
---

A **subdomain** is a prefix added to your domain to create a distinct address under it — `blog.example.com`, `app.example.com`, or `mail.example.com` are all subdomains of `example.com`. You create one by adding a [DNS record](/en/glossary/dns-record-types/) (usually an A or CNAME) at the [nameservers](/en/glossary/nameserver/) for the parent domain, with no extra registration or fee. Subdomains let one registered name host many services, which is why they are a building block for sites, apps, and APIs. In the tokenized world, ownership lives at the [registered](/en/glossary/registrant/) [second-level domain](/en/glossary/second-level-domain/); subdomains are configuration under it and follow whoever controls the parent's [wallet](/en/glossary/wallet/). *Sources: RFC 1034; Cloudflare subdomain glossary.*
