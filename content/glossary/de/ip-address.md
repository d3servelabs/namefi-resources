---
title: 'IP-Adresse (IPv4 / IPv6)'
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Die numerische Adresse, die ein Gerät im Netzwerk identifiziert und auf die DNS einen Domainnamen abbildet.
keywords: ['IP-Adresse', 'IPv4', 'IPv6', 'A-Record', 'AAAA-Record', 'Netzwerk']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc791
  - https://www.cloudflare.com/learning/dns/glossary/what-is-my-ip-address/
---

Eine **IP-Adresse** ist das numerische Label, das ein Gerät in einem Netzwerk identifiziert — `93.184.216.34` im älteren **IPv4**-Format oder eine längere Hexadezimalzeichenkette wie `2606:2800:220:1:248:1893:25c8:1946` im **IPv6**-Format, das entstanden ist, weil der Welt die IPv4-Adressen ausgegangen sind. Der gesamte Zweck des [DNS](/de/glossary/dns/) besteht darin, einen menschenfreundlichen Domainnamen auf eine dieser Adressen abzubilden: Ein **A**-[Eintrag](/de/glossary/dns-record-types/) zeigt einen Namen auf eine IPv4-Adresse, ein **AAAA**-Eintrag auf IPv6. Adressblöcke werden über [IANA](/de/glossary/iana/) an regionale Registries zugeteilt. Die Domain-Tokenisierung operiert eine Ebene darüber — sie ändert, wem der Name *gehört*, nicht die Adressen, auf die der Name aufgelöst wird. *Quelle(n): RFC 791; Cloudflare-IP-Adress-Glossar.*
