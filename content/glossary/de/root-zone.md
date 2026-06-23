---
title: 'Root-Zone (Root-Server)'
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Die Spitze der DNS-Hierarchie, die jede TLD und die dafür autoritativen Server auflistet.
keywords: ['Root-Zone', 'Root-Server', 'DNS-Hierarchie', 'TLD-Delegierung', 'IANA']
level: 1
sources:
  - https://www.iana.org/domains/root
  - https://www.iana.org/domains/root/servers
---

Die **Root-Zone** ist die oberste Ebene der [DNS](/de/glossary/dns/)-Hierarchie — die Masterliste jeder [TLD](/de/glossary/tld/) und der [Registry](/de/glossary/registry/)-Server, die für sie autoritativ sind. Sie wird von den **Root-Servern** bereitgestellt, einem weltweit verteilten System, das unter dreizehn benannten Adressen erreichbar ist, und der Inhalt der Zone wird durch [IANA](/de/glossary/iana/) gepflegt. Jede Domain-Abfrage, die nicht bereits gecacht ist, beginnt hier: Ein [Resolver](/de/glossary/dns-resolver/) fragt die Root, wo `.com` zu finden ist, und folgt dann der Kette nach unten. Die Root-Zone ist der Namensanker des Internets — und sie wird durch die Tokenisierung nicht berührt, die eine [Wallet](/de/glossary/wallet/)-gesteuerte Eigentumsschicht über dem bestehenden DNS hinzufügt, anstatt die Root zu ersetzen. *Quelle(n): IANA-Root-Zone; IANA-Root-Server.*
