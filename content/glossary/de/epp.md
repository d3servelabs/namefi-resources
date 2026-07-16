---
title: EPP
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
description: Das Standardprotokoll, das Registrare nutzen, um Domains mit einer Registry zu registrieren und zu verwalten.
keywords: ['EPP', 'Extensible Provisioning Protocol', 'Domain-Verwaltung', 'Registry-Protokoll', 'RFC 5730']
also_known_as: ['Extensible Provisioning Protocol']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5730
relatedArticles:
  - /de/blog/the-panix-com-domain-hijack/
  - /de/blog/the-lenovo-com-dns-hijack/
  - /de/blog/expired-domains-and-the-drop-cycle/
  - /de/blog/what-is-udrp/
  - /de/blog/domain-escrow-explained/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/domain-flipping-skills/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/registry/
  - /de/glossary/epp-status-codes/
  - /de/glossary/dns/
  - /de/glossary/icann/
---

**EPP** (Extensible Provisioning Protocol) ist das XML-basierte Befehlsprotokoll, das in RFC 5730 definiert ist und regelt, wie ein [Registrar](/de/glossary/registrar/) mit einer [Registry](/de/glossary/registry/) kommuniziert, um Domain-Registrierungen zu erstellen, zu aktualisieren, zu transferieren oder zu löschen. Jedes Mal, wenn ein Registrar einen neuen Namen registriert, ihn verlängert oder einen Transfer einleitet, sendet er einen EPP-Befehl über eine sichere TCP-Sitzung an den EPP-Server der Registry und erhält eine strukturierte Antwort, die den Erfolg bestätigt oder einen Fehler meldet. Das Protokoll trägt auch den [Auth-Code](/de/glossary/auth-code/), der zur Autorisierung ausgehender Transfers verwendet wird, und zeigt die [EPP-Statuscodes](/de/glossary/epp-status-codes/) – wie `clientTransferProhibited` oder `serverHold` – an, die den aktuellen Zustand einer Domain beschreiben. Da EPP streng kontrolliert ist, ist der Zugang auf akkreditierte Registrare beschränkt; Endnutzer interagieren niemals direkt damit.
