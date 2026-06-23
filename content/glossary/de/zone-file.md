---
title: 'Zone-File (Glue Record)'
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Die Textdatei, die alle DNS-Einträge einer Domain enthält, einschließlich Glue Records für ihre Nameserver.
keywords: ['Zone-File', 'Glue Record', 'DNS-Zone', 'autoritative Einträge', 'Nameserver']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/dns-zone/
---

Eine **Zone-File** ist die Textdatei auf den autoritativen [Nameservern](/de/glossary/nameserver/) einer Domain, die alle ihre [DNS-Einträge](/de/glossary/dns-record-types/) enthält — die A-, MX-, TXT- und sonstigen Einträge, die das Verhalten der Domain festlegen. Ein **Glue Record** ist ein Sonderfall: Wenn die Nameserver einer Domain *unter dieser Domain selbst* liegen (z.&nbsp;B. `ns1.example.com` für `example.com`), muss die übergeordnete [Registry](/de/glossary/registry/) die [IP-Adresse](/de/glossary/ip-address/) des Nameservers direkt in der übergeordneten Zone veröffentlichen, um ein Henne-Ei-Auflösungsproblem zu vermeiden. Die Zone-File zu bearbeiten ist der Weg, die [DNS](/de/glossary/dns/)-Konfiguration einer Domain anzupassen. Es handelt sich um operative Daten, getrennt vom Eigentum — das ist genau das, was eine tokenisierte Domain in eine [Wallet](/de/glossary/wallet/)-gesteuerte Schicht verlagert. *Quelle(n): RFC 1035; Cloudflare-DNS-Zonen-Glossar.*
