---
title: DNS Record Types (A, AAAA, CNAME, MX, TXT)
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The entries in a zone that map a domain to addresses and services — A, AAAA, CNAME, MX, TXT, and more.
keywords: ['DNS records', 'A record', 'AAAA record', 'CNAME', 'MX record', 'TXT record']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/dns-records/
---

**DNS record types** are the individual entries in a domain's zone that tell the [DNS](/en/glossary/dns/) where to send different kinds of traffic. The common ones are **A** (maps a name to an IPv4 [IP address](/en/glossary/ip-address/)), **AAAA** (IPv6), **CNAME** (aliases one name to another), **MX** (routes email), and **TXT** (free-form text used for SPF, DKIM, and domain verification). These records are published by the [nameservers](/en/glossary/nameserver/) you delegate a domain to, and they are what actually make a website load or mail deliver. Tokenizing a domain leaves all of this untouched: the records keep resolving normally while ownership and transfer move to a [wallet](/en/glossary/wallet/)-controlled [on-chain](/en/glossary/on-chain/) layer. *Sources: RFC 1035; Cloudflare DNS records.*
