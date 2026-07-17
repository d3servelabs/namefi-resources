---
title: Transfer-Sperre
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
description: Ein Status, der den Transfer einer Domain zu einem anderen Registrar blockiert, bis er explizit aufgehoben wird.
keywords: ['transfer-sperre', 'registrar-sperre', 'domain-sicherheit', 'EPP-status', 'domain-transfer']
also_known_as: ['Registrar-Sperre']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /de/blog/the-panix-com-domain-hijack/
  - /de/blog/how-to-sell-a-domain-name-you-own/
  - /de/blog/how-tokenization-changes-domain-flipping/
  - /de/blog/avoiding-domain-sale-scams/
  - /de/blog/working-with-domain-brokers/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-investing/
relatedSeries:
  - /de/series/domain-flipping-skills/
  - /de/series/domain-apocalypse/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/domain-hijacking/
  - /de/glossary/cross-registrar-transfer/
  - /de/glossary/epp/
  - /de/glossary/registry-lock/
---

Die **Transfer-Sperre** (auch *Registrar-Sperre* genannt; EPP-Status `clientTransferProhibited`) ist ein Flag, das von Ihrem [Registrar](/de/glossary/registrar/) gesetzt wird und verhindert, dass eine Domain ohne vorherige bewusste Entsperrung zu einem anderen Registrar verschoben wird. Wenn die Sperre aktiv ist, wird jeder Versuch, einen [Cross-Registrar-Transfer](/de/glossary/cross-registrar-transfer/) einzuleiten, abgelehnt, bevor er fortfahren kann, selbst wenn der Antragsteller den [Auth-Code](/de/glossary/auth-code/) besitzt. Sie ist eine der einfachsten und wirksamsten Verteidigungen gegen [Domain-Hijacking](/de/glossary/domain-hijacking/): Ein Dieb, der Ihr Konto kompromittiert hat, kann das Asset nicht still und heimlich transferieren, solange die Sperre aktiv ist. Die Best Practice ist, die Transfer-Sperre jederzeit aktiviert zu lassen und sie nur für das kurze Zeitfenster zu entfernen, das für einen legitimen Transfer benötigt wird.
