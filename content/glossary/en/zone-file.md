---
title: Zone File (Glue Record)
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The text file holding all the DNS records for a domain, including glue records for its nameservers.
keywords: ['zone file', 'glue record', 'DNS zone', 'authoritative records', 'nameserver']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/dns-zone/
---

A **zone file** is the text file on a domain's authoritative [nameservers](/en/glossary/nameserver/) that holds all of its [DNS records](/en/glossary/dns-record-types/) — the A, MX, TXT, and other entries that define how the domain behaves. A **glue record** is a special case: when a domain's nameservers live *under that same domain* (e.g. `ns1.example.com` serving `example.com`), the parent [registry](/en/glossary/registry/) must publish the nameserver's [IP address](/en/glossary/ip-address/) directly in the parent zone to avoid a chicken-and-egg lookup. Editing the zone file is how you configure a domain's [DNS](/en/glossary/dns/).
