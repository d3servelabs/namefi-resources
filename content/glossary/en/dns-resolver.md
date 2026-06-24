---
title: DNS Resolver (Recursive Resolver)
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The server that takes a domain lookup and walks the DNS hierarchy to return the matching address.
keywords: ['DNS resolver', 'recursive resolver', 'resolver', '8.8.8.8', '1.1.1.1', 'DNS lookup']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/what-is-a-dns-resolver/
---

A **DNS resolver** (or *recursive resolver*) is the server your device asks whenever it needs to turn a domain into an [IP address](/en/glossary/ip-address/). Public resolvers like `1.1.1.1` (Cloudflare) and `8.8.8.8` (Google) do the legwork: starting from the [root zone](/en/glossary/root-zone/), they query down the [DNS](/en/glossary/dns/) hierarchy to the domain's authoritative [nameservers](/en/glossary/nameserver/), then cache the answer for its [TTL](/en/glossary/ttl/). This is the part of DNS that makes "type a name, reach a site" feel instant.
