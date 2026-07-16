---
title: 'Nameserver (NS Record)'
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
description: Ein Server, der DNS-Anfragen für eine Domain beantwortet; seine NS Records benennen die autoritativen Server.
keywords: ['Nameserver', 'NS Record', 'autoritativer Server', 'DNS-Delegierung', 'DNS-Hosting']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/dns-server-types/
relatedArticles:
  - /de/blog/how-domain-hijacking-actually-happens/
  - /de/blog/the-myetherwallet-bgp-dns-attack/
  - /de/blog/dns-on-tokenized-domains/
  - /de/blog/the-lenovo-com-dns-hijack/
  - /de/blog/the-dnspionage-campaign/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/registrar/
  - /de/glossary/registry/
  - /de/glossary/tld/
  - /de/glossary/zone-file/
---

Ein **Nameserver** ist ein Server, der [DNS](/de/glossary/dns/)-Anfragen für eine Domain beantwortet, und die **NS Records** bei der [Registry](/de/glossary/registry/) einer Domain geben an, welche Nameserver für sie autoritativ sind. Wenn man eine Domain auf einen DNS-Anbieter zeigt (Cloudflare, Route 53 oder den eigenen DNS des [Registrars](/de/glossary/registrar/)), legt man damit deren Nameserver fest. Diese Server veröffentlichen dann die [Eintragstypen](/de/glossary/dns-record-types/) — A, MX, TXT und weitere —, die den Datenverkehr und die E-Mail-Zustellung steuern. Die Tokenisierung einer Domain ändert diese Ebene nicht: Die Nameserver und ihre Einträge funktionieren weiterhin genau wie zuvor, während Eigentum und Transfer zu einer [Wallet](/de/glossary/wallet/)-gesteuerten [On-Chain](/de/glossary/on-chain/)-Schicht darüber wechseln. *Quelle(n): RFC 1034; Cloudflare DNS-Servertypen.*
