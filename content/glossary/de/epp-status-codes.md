---
title: EPP-Statuscodes
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Die standardisierten Flags einer Domain, die ihren Zustand anzeigen – gesperrt, zurückgehalten, ausstehender Transfer und mehr.
keywords: ['EPP-Statuscodes', 'clientHold', 'serverTransferProhibited', 'Domain-Status', 'Pending Delete']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /de/blog/expired-domains-and-the-drop-cycle/
  - /de/blog/domain-backorders-and-drop-catching/
  - /de/blog/how-to-sell-a-domain-name-you-own/
  - /de/blog/the-panix-com-domain-hijack/
  - /de/blog/working-with-domain-brokers/
relatedTopics:
  - /de/topics/domain-investing/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-flipping-skills/
  - /de/series/domain-apocalypse/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/epp/
  - /de/glossary/registry/
  - /de/glossary/dns/
  - /de/glossary/transfer-lock/
---

**EPP-Statuscodes** sind die maschinenlesbaren Flags, die durch das Extensible Provisioning Protocol ([EPP](/de/glossary/epp/)) definiert werden und genau beschreiben, welche Operationen auf einer Domain zu einem bestimmten Zeitpunkt zulässig sind. Sie kommen in zwei Namensräumen: `client*`-Codes, die vom [Registrar](/de/glossary/registrar/) gesetzt werden, und `server*`-Codes, die von der [Registry](/de/glossary/registry/) gesetzt werden, wobei die Server-Codes Vorrang haben. Häufige Codes umfassen `clientTransferProhibited` (der [Transfer-Lock](/de/glossary/transfer-lock/), der ausgehende Transfers blockiert), `serverDeleteProhibited` (Registry-seitiger Schutz gegen Löschung), `clientHold` (setzt die DNS-Auflösung aus, oft bei Nichtzahlung) und `pendingDelete`, das eine Domain in ihrer Kulanzfrist vor der Freigabe zur erneuten Registrierung markiert – ein Zustand, der an [Pending Delete](/de/glossary/pending-delete/) grenzt. Das Verständnis dieser Codes hat praktische Bedeutung: Eine Domain mit `serverTransferProhibited` kann nicht bewegt werden, auch nachdem der Registrar sie entsperrt hat, was Käufer mitten in einer Transaktion überraschen kann.
