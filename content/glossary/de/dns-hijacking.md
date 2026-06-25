---
title: DNS-Hijacking
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Umleitung des Datenverkehrs einer Domain durch Manipulation der DNS-Auflösung statt der Registrierung selbst.
keywords: ['DNS-Hijacking', 'Cache-Poisoning', 'DNS-Spoofing', 'DNSSEC', 'Datenverkehrsumleitung']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/dns-cache-poisoning/
---

**DNS-Hijacking** (auch DNS-Spoofing oder Cache-Poisoning genannt) greift die Auflösungsebene statt der Registrierung selbst an: Anstatt die Domain beim [Registrar](/de/glossary/registrar/) zu übernehmen, korrumpiert der Angreifer, was ein [DNS-Resolver](/de/glossary/dns-resolver/) oder [Nameserver](/de/glossary/nameserver/) als Ziel der Domain kennt, und leitet Besucher lautlos auf eine bösartige IP um. Bei einem Cache-Poisoning-Angriff wird eine gefälschte DNS-Antwort von einem rekursiven Resolver akzeptiert und für die Dauer der TTL gecacht, wodurch jeder Nutzer, den dieser Resolver bedient, falsch geleitet wird – ohne dass sich die autoritativen [DNS](/de/glossary/dns/)-Einträge ändern. Die wichtigste technische Gegenmaßnahme ist [DNSSEC](/de/glossary/dnssec/), das DNS-Antworten kryptografisch signiert, damit Resolver Manipulationen erkennen können. Anders als bei herkömmlichem [Domain-Diebstahl](/de/glossary/domain-theft/) bleiben beim DNS-Hijacking die Eigentumseinträge unberührt, was eine Erkennung ohne aktives Monitoring erschwert.
