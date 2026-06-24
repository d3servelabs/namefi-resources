---
title: Domain-Weiterleitung
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Das automatische Senden von Besuchern von einer Domain zu einer anderen Adresse, häufig über eine 301-Weiterleitung.
keywords: ['Domain-Weiterleitung', '301-Weiterleitung', 'URL-Weiterleitung', 'DNS', 'Domain-Verwaltung']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
---

**Domain-Weiterleitung** (auch URL-Weiterleitung oder 301-Weiterleitung genannt) ist eine Konfiguration, die jeden Besucher, der eine Domain aufruft, automatisch zu einer anderen Ziel-URL sendet. Die Variante mit der [301-Weiterleitung](/de/glossary/301-redirect/) signalisiert Suchmaschinen, dass der Umzug dauerhaft ist, und überträgt den Großteil der Link-Equity der ursprünglichen Domain auf das Ziel – was sie zur bevorzugten Wahl beim Konsolidieren von Marken oder Migrieren von Traffic macht. Die Weiterleitung wird entweder im Registrar-Kontrollpanel oder durch Setzen eines [DNS-Eintragstyps](/de/glossary/dns-record-types/), der auf einen Webserver mit der Weiterleitungsregel verweist, konfiguriert. Ein häufiger Anwendungsfall ist der Kauf einer passenden [Subdomain](/de/glossary/subdomain/) oder Tippfehler-Variante und deren Weiterleitung zur Hauptseite, um verirrten Traffic aufzufangen. Domain-Weiterleitung unterscheidet sich von vollständiger DNS-Delegation: Die Domain wird weiterhin über DNS aufgelöst, aber HTTP-Anweisungen leiten den Browser um.
