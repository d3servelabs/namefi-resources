---
title: Registry-Sperre
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Ein Hochsicherheitsdienst, bei dem die Registry eine Domain einfriert, sodass Änderungen eine manuelle Out-of-Band-Genehmigung erfordern.
keywords: ['registry-sperre', 'domain-sperre', 'hochsicherheitssperre', 'domain-hijacking-prävention', 'out-of-band-verifizierung']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
---

Die **Registry-Sperre** ist ein Premium-Sicherheitsdienst, der von einer [Registry](/de/glossary/registry/) angeboten wird und eine Domain in einen Zustand versetzt, in dem keine Änderung – einschließlich Nameserver-Änderungen, Transfers oder Löschungen – über den normalen automatisierten EPP-Kanal verarbeitet werden kann. Stattdessen erfordert jede Änderung einen manuellen Out-of-Band-Verifizierungsprozess, der Telefonanrufe, kryptografische Token oder persönliche Identitätsprüfungen zwischen Registrar und Registry umfasst. Dies unterscheidet sich von der gebräuchlicheren [Transfer-Sperre](/de/glossary/transfer-lock/), die der [Registrar](/de/glossary/registrar/) kontrolliert und über seine eigenen Systeme umschalten kann; die Registry-Sperre eskaliert den Schutz auf die Registry-Ebene und macht unbefugte Änderungen äußerst schwierig, selbst wenn ein Angreifer vollen Zugang zum Registrar-Konto erlangt. Sie wird am häufigsten von Finanzinstituten, großen Marken und Betreibern kritischer Infrastruktur eingesetzt, um hochwertige Domains gegen [Domain-Hijacking](/de/glossary/domain-hijacking/) zu schützen.
