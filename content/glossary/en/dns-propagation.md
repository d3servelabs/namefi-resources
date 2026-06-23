---
title: DNS Propagation
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The delay before a DNS change is seen everywhere, as cached old records expire across resolvers.
keywords: ['DNS propagation', 'DNS update delay', 'TTL', 'DNS cache', 'nameserver change']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
  - https://datatracker.ietf.org/doc/html/rfc1035
---

**DNS propagation** is the lag between making a [DNS](/en/glossary/dns/) change and that change being visible everywhere on the internet. It happens because [resolvers](/en/glossary/dns-resolver/) around the world cache the old answer until its [TTL](/en/glossary/ttl/) expires, so a new [record](/en/glossary/dns-record-types/) or [nameserver](/en/glossary/nameserver/) update rolls out gradually rather than instantly — anywhere from minutes to a couple of days. There is no global "DNS" to update at once; propagation is just caches timing out. The practical fix is to lower the TTL ahead of a planned change. None of this touches a domain's ownership: tokenization changes who controls the name on-chain, not how quickly DNS edits spread. *Sources: Cloudflare TTL glossary; RFC 1035.*
