---
title: DNSSEC (Domain Name System Security Extensions)
date: '2026-05-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Kryptografische Signaturen auf DNS-Einträgen, die es Resolvern ermöglichen zu überprüfen, ob eine Antwort authentisch ist und nicht gefälscht oder während der Übertragung manipuliert wurde.
keywords: ['DNSSEC', 'DNS-Sicherheit', 'Domain-Sicherheit', 'DS-Eintrag', 'Vertrauenskette', 'kryptografisches DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4033
---

**DNSSEC (Domain Name System Security Extensions)** ist ein Satz kryptografischer Erweiterungen des [DNS](/de/glossary/dns/)-Protokolls, der es Resolvern ermöglicht, die Authentizität und Integrität von DNS-Antworten zu überprüfen. Ohne DNSSEC kann ein Angreifer DNS-Antworten auf dem Weg zwischen Resolver und autoritativem Server fälschen oder manipulieren und Nutzer auf schädliche Infrastruktur umleiten. Mit DNSSEC sind die Einträge signiert, und eine Vertrauenskette verläuft vom DNS-Root über jede Zone hinweg über DS-Einträge. DNSSEC ist in [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) und verwandten RFCs spezifiziert. Die Tokenisierung einer Domain ändert DNSSEC in keiner Weise – die Vertrauenskette verläuft weiterhin über den [Registrar](/de/glossary/registrar/) und die [Registry](/de/glossary/registry/), und DS-Einträge werden auf dieselbe Weise veröffentlicht. Viele DNS-Anbieter (Cloudflare, Route53) signieren Zonen automatisch, wenn DNSSEC aktiviert ist.
