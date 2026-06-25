---
title: Öffentlicher Schlüssel
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Die teilbare Hälfte eines Blockchain-Schlüsselpaares, aus dem privaten Schlüssel abgeleitet; dient zum Empfangen von Geldern und zur Signaturverifizierung.
keywords: ['öffentlicher schlüssel', 'adresse', 'verifikationsschlüssel', 'asymmetrische kryptographie', 'blockchain-konto']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
---

Ein **öffentlicher Schlüssel** ist die teilbare Hälfte des kryptografischen Schlüsselpaares eines [Blockchain](/de/glossary/blockchain/)-Kontos. Er – oder die daraus abgeleitete Adresse – kann offen veröffentlicht werden: Hier senden andere Token oder rufen Smart Contracts in Ihrem Namen auf. Der öffentliche Schlüssel wird aus dem [privaten Schlüssel](/de/glossary/private-key/) durch einwegige Elliptische-Kurven-Mathematik abgeleitet, sodass das Teilen des öffentlichen Schlüssels niemals das Geheimnis offenbart, das Transaktionen autorisiert. Das Verifizieren einer digitalen Signatur gegen den öffentlichen Schlüssel beweist, dass eine Nachricht vom Inhaber des passenden privaten Schlüssels signiert wurde – so bestätigt das Netzwerk, dass eine Transaktion tatsächlich autorisiert ist.
