---
title: WHOIS (und RDAP)
date: '2026-05-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: WHOIS und sein Nachfolger RDAP sind die öffentlichen Suchdienste für die Registrierungsdetails einer Domain, wie den Registrar und das Ablaufdatum.
keywords: ['WHOIS', 'RDAP', 'Domain-Registrierungs-Lookup', 'Registrantinformationen', 'Domain-Eigentümer-Lookup']
level: 1
sources:
  - https://www.icann.org/rdap
  - https://lookup.icann.org/
relatedArticles:
  - /de/blog/what-are-tokenized-domains/
  - /de/blog/expired-domains-and-the-drop-cycle/
  - /de/blog/how-domain-hijacking-actually-happens/
  - /de/blog/what-is-udrp/
  - /de/blog/cctld-market-share-by-registration-volume/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/domain-flipping-skills/
relatedGlossary:
  - /de/glossary/icann/
  - /de/glossary/registrar/
  - /de/glossary/dns/
  - /de/glossary/whois-privacy/
  - /de/glossary/registry/
---

**WHOIS** ist das langjährige Protokoll und der öffentliche Dienst zur Abfrage von Registrierungsinformationen zu einer Domain – Registrar, Registrierungs- und Ablaufdatum sowie historisch die Kontaktdaten des Registranten. Sein moderner Nachfolger ist **RDAP (Registration Data Access Protocol)**, das strukturiertes JSON zurückgibt und zu dem [ICANN](/de/glossary/icann/) und Registries migrieren. Bei [tokenisierten Domains](/de/blog/what-are-tokenized-domains/) existieren WHOIS/RDAP-Einträge weiterhin auf [Registrar](/de/glossary/registrar/)-Ebene, da die zugrundeliegende [DNS](/de/glossary/dns/)-Registrierung real und ICANN-anerkannt ist – lediglich die *Eigentums- und Transfermechaniken* verlagern sich auf die [On-Chain](/de/glossary/on-chain/)-Ebene. Datenschutz ist zunehmend verbreitet: Viele Registrare maskieren persönliche Kontaktdaten standardmäßig, im Einklang mit Datenschutzgesetzen wie der DSGVO. Referenz: [ICANNs WHOIS-Lookup](https://lookup.icann.org/).
