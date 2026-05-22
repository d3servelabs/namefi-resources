---
title: "So tokenisieren Sie Ihre .com-Domain: Eine Schritt-für-Schritt-Anleitung (2026)"
date: '2026-05-22'
language: de
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Eine praktische Schritt-für-Schritt-Anleitung zur Tokenisierung einer Domain, die Sie bereits besitzen — Voraussetzungen, Wallets, Gebühren, Dauer und was Sie auf jedem Bildschirm erwartet. Geschrieben für Eigentümer, nicht für Protokoll-Nerds."
keywords: ['wie man eine domain tokenisiert', 'wie man eine .com tokenisiert', 'meine domain tokenisieren', 'bestehende domain tokenisieren', 'domain schritt für schritt tokenisieren', 'domain tokenisierung tutorial', 'tokenize .com anleitung', 'tokenize .xyz', 'tokenize .io', 'namefi tokenisieren', 'nft domain anleitung', 'domain zu nft transferieren', 'domain zu nft', 'domain tokenisierungs prozess', 'tokenisierte domain einrichtung', 'icann domain tokenisieren']
---

Sie besitzen also eine Domain — vielleicht `mybrand.com`, vielleicht ein Portfolio von `.xyz`-Namen — und haben beschlossen, dass Sie diese **tokenisieren** möchten. Dieser Leitfaden führt Sie Schritt für Schritt durch das, was tatsächlich passiert, Bildschirm für Bildschirm, damit Sie die Zeit, das Geld und die Zugänge planen können, die Sie benötigen, bevor Sie beginnen.

Wenn Sie noch darüber nachdenken, *warum* Sie tokenisieren sollten, lesen Sie zuerst [Warum Domains On-Chain tokenisieren?](/en/blog/why-tokenize-domains/). Wenn Sie sich nicht sicher sind, *was* Tokenisierung überhaupt bedeutet, ist [Was sind tokenisierte Domains?](/en/blog/what-are-tokenized-domains/) der richtige Ausgangspunkt.

Dieser Beitrag geht davon aus, dass Sie sich bereits dazu entschlossen haben.

---

## Bevor Sie beginnen: Eine 60-Sekunden-Checkliste

Der Prozess wird viel reibungsloser ablaufen, wenn folgende Punkte erfüllt sind, bevor Sie irgendetwas anklicken:

- **Sie kontrollieren die Domain bei ihrem aktuellen [Registrar](/en/glossary/registrar/).** Sie können sich einloggen, Nameserver ändern und Transfers / [Auth-Codes](/en/glossary/auth-code/) genehmigen.
- **Sie haben eine Self-Custody [Wallet](/en/glossary/wallet/).** MetaMask, Rabby, Coinbase Wallet oder eine andere Standard-EVM-Wallet. Stellen Sie sicher, dass Sie tatsächlich die [Seed-Phrase](/en/glossary/seed-phrase/) besitzen – und nicht nur ein Konto bei einer Krypto-Börse.
- **Die Wallet verfügt über eine kleine Menge an [Gas](/en/glossary/gas/).** Ein paar Dollar in ETH oder Base ETH decken die [On-Chain](/en/glossary/on-chain/)-Minting-Transaktion ab. Sie benötigen nicht viel.
- **Die Domain ist nicht gesperrt, läuft nicht ab und befindet sich nicht mitten in einem Transfer.** Domains innerhalb von etwa 60 Tagen nach einem kürzlichen [Registrar-Wechsel](/en/glossary/cross-registrar-transfer/) oder innerhalb von 30 Tagen vor Ablauf können oft nicht transferiert werden. Prüfen Sie dies zuerst.
- **Sie haben Zeit.** Planen Sie etwa 30 Minuten aktive Aufmerksamkeit ein, plus bis zu 5–7 Tage Hintergrundverarbeitung für Registrar-Wechsel.

Wenn einer dieser Punkte unklar ist, beheben Sie dies, bevor Sie beginnen. Der Prozess verträgt Geduld viel besser als Überraschungen.

---

## Schritt 1: Verbinden Sie Ihre Wallet auf namefi.io

Gehen Sie zu [namefi.io](https://namefi.io) und klicken Sie auf „Connect Wallet“. Genehmigen Sie die Verbindung in Ihrer Wallet. Diese Wallet wird der **Eigentümer** der tokenisierten Domain – das NFT wird hier liegen, und wer auch immer diese Wallet kontrolliert, besitzt die Domain.

> **Nehmen Sie dies ernst.** Wenn Sie diese Wallet verlieren, verlieren Sie die On-Chain-Seite Ihrer Domain. Wir haben einen separaten Leitfaden zur [Wiederherstellung einer tokenisierten Domain nach Wallet-Verlust](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) – lesen Sie ihn jetzt, nicht erst später.

---

## Schritt 2: Fügen Sie die Domain hinzu, die Sie tokenisieren möchten

Suchen Sie in Ihrem Namefi-Dashboard nach der Domain, die Sie bereits besitzen, oder fügen Sie sie hinzu. Namefi prüft die Berechtigung — den aktuellen [Registrar](/en/glossary/registrar/), ob sie sperrbar ist, ob sie innerhalb der [ICANN](/en/glossary/icann/)-Transferregeln liegt und ob die [TLD](/en/glossary/tld/) unterstützt wird.

Sie werden einen von drei Status sehen:

- **Jetzt berechtigt (Eligible now).** Fahren Sie mit Schritt 3 fort.
- **Nach einer Wartezeit berechtigt.** Bedeutet meist, dass ein kürzlicher Transfer noch innerhalb der 60-tägigen ICANN-Frist liegt. Warten Sie diese ab und kommen Sie dann zurück.
- **Nicht unterstützt.** Einige TLDs werden noch nicht unterstützt. Überprüfen Sie die Liste der unterstützten TLDs oder kontaktieren Sie den Support.

---

## Schritt 3: Wählen Sie einen Tokenisierungspfad

Namefi bietet in der Regel verschiedene Pfade an, abhängig vom aktuellen Registrar der Domain:

1. **Transferieren und dann tokenisieren.** Übertragen Sie die Domain zu Namefis akkreditiertem Registrar-Partner und minten Sie dann den On-Chain-Token. Dies ist der häufigste Weg. Er dauert aufgrund des ICANN-Transferablaufs einige Tage, nicht wegen blockchain-bezogener Gründe.
2. **Vor Ort tokenisieren (wo unterstützt).** Bei einigen Registrar-Integrationen bleibt die Domain dort, wo sie ist, und die On-Chain-Ebene wird darübergelegt. Schneller, aber nur für bestimmte Partner-Registrare verfügbar.

Sie werden den Pfad sehen, der für Ihre Domain zutrifft. Das Dashboard zeigt die geschätzte Zeit und alle anfallenden Gebühren im Voraus an.

---

## Schritt 4: Auth-Code bestätigen / Transfer genehmigen (falls erforderlich)

Für den Transfer-Pfad holen Sie sich den [**Auth-Code**](/en/glossary/auth-code/) (manchmal auch EPP-Code genannt) von Ihrem aktuellen Registrar und fügen ihn in Namefi ein. Möglicherweise müssen Sie außerdem:

- Die Domain bei Ihrem aktuellen Registrar entsperren (Unlock).
- Eine Bestätigungs-E-Mail genehmigen, die an den Domaininhaber (Registrant Contact) gesendet wird.

Dies ist der langsamste Teil des gesamten Prozesses. Planen Sie 5–7 Tage für den Abschluss des Registrar-Wechsels ein, obwohl es oft schneller geht.

---

## Schritt 5: Den On-Chain-Token minten

Sobald sich die Domain unter der Namefi-Registrar-Integration befindet, werden Sie aufgefordert, die [NFT](/en/glossary/nft/)-Repräsentation (einen Standard-[ERC-721](/en/glossary/erc-721/)-Token) zu **minten**. Ihre Wallet öffnet sich; Sie bestätigen eine Transaktion; [Gas](/en/glossary/gas/) wird bezahlt; der Token landet in Ihrer Wallet.

Dies ist der Moment, in dem die Domain [*tokenisiert*](/en/glossary/tokenize/) wird. Sie haben nun:

- Den traditionellen [DNS](/en/glossary/dns/) / Registrar-Eintrag (immer noch real, immer noch ICANN-anerkannt).
- Ein [On-Chain](/en/glossary/on-chain/)-NFT in Ihrer Wallet, das den Besitz repräsentiert.

Beide werden fortan durch das Protokoll synchron gehalten.

---

## Schritt 6: Überprüfung in Ihrer Wallet und einem Block-Explorer

Öffnen Sie den NFT-Tab in Ihrer Wallet. Sie sollten das neue tokenisierte Domain-NFT sehen. Klicken Sie sich zu einem Block-Explorer (Etherscan, Basescan usw.) durch, um den Vertrag und die Eigentümeradresse zu bestätigen. Dies ist ein guter Zeitpunkt, um einen Screenshot für Ihre eigenen Unterlagen zu machen.

Wenn Sie eine [Hardware-Wallet](/en/glossary/hardware-wallet/) haben, ist dies ein hervorragender Moment, um das NFT dorthin zu verschieben. Die Übertragung ist ein normaler NFT-Transfer und kostet Gas.

---

## Schritt 7: Verwaltung von DNS und Verlängerungen (Renewals)

Die Tokenisierung einer Domain ändert nichts an ihrer Auflösung. Ihre Nameserver, A-Records, MX-Records, DNSSEC – all das funktioniert weiterhin. Sie können diese über das Namefi-Dashboard verwalten oder wie bisher an Ihren bestehenden DNS-Anbieter (Cloudflare, Route53 usw.) delegieren.

Details darüber, was sich auf der DNS-Ebene ändert (und was nicht), finden Sie unter [DNS funktioniert weiterhin: Nameserver, E-Mail und DNSSEC bei einer tokenisierten Domain](/en/blog/dns-on-tokenized-domains/).

Verlängerungen (Renewals) erfolgen weiterhin über die Registrar-Ebene. Namefi kümmert sich um die registrarseitige Abrechnung; Sie behalten den On-Chain-Besitz.

---

## Was Sie in Bezug auf die Kosten erwartet

Sie zahlen grob gesagt für drei Dinge:

- **Registrar-Gebühren.** Normale jährliche Preise für die Domain-Verlängerung plus eventuelle Transfergebühren. Dies sind reale Kosten, die unabhängig von der Tokenisierung anfallen.
- **Gas.** Ein paar Dollar für die Mint-Transaktion, je nachdem, auf welcher Chain (Base ist günstiger als Ethereum L1).
- **Protokoll-Gebühren.** Namefis eigene Gebühren für den Tokenisierungs-Dienst. Diese werden im Dashboard angezeigt, bevor Sie bestätigen.

Es gibt keine versteckten Überraschungen. Wenn ein Betrag nicht auf dem Bestätigungsbildschirm steht, wird er auch nicht berechnet.

---

## Häufige Stolpersteine

- **„Mein Registrar gibt den Auth-Code nicht heraus.“** Einige Registrare verstecken diesen tief in ihrer Benutzeroberfläche oder verlangen ein Support-Ticket. Seien Sie geduldig und hartnäckig.
- **„Ich habe die Domain entsperrt, aber das System sagt immer noch ‚gesperrt‘.“** Registrare speichern den Sperrstatus oft bis zu 24 Stunden im Cache. Warten Sie einen Tag, laden Sie die Seite neu.
- **„Meine Wallet zeigt das NFT, aber die Domain wird noch bei meinem alten Registrar angezeigt.“** Während des Transferfensters können beide Seiten kurzzeitig den Besitz anzeigen. Die On-Chain-Seite wird maßgeblich, nachdem der Transfer abgeschlossen ist.
- **„Ich möchte ein [Multisig](/en/glossary/multi-sig/) als Eigentümer verwenden.“** Wird unterstützt. Verbinden Sie die Multisig-Wallet. Stellen Sie nur sicher, dass Sie tatsächlich Transaktionen von dort ausführen können – ein Multisig, bei dem Sie Unterzeichner verloren haben, bedeutet auch eine verlorene Domain. Hintergrundwissen: [Verbessern Multisig-Wallets wirklich die Sicherheit?](/en/blog/do-multisig-wallets-actually-improve-security/)

---

## Freundlicher Haftungsausschluss (Bitte lesen!)

> Wir sind keine Anwälte, Steuerberater, Finanzberater oder Ärzte – und **nichts in diesem Artikel stellt eine rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder sonstige professionelle Beratung dar.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden und als Service für unsere Kunden. Die Informationen hier können veraltet, länderspezifisch oder schlichtweg falsch sein – auch wir machen Fehler.
>
> Für wichtige Entscheidungen **konsultieren Sie bitte einen echten Fachmann (ernsthaft!)**. Oder wenn das nicht Ihr Stil ist, fragen Sie einen Freund, fragen Sie Twitter, fragen Sie Reddit, fragen Sie eine KI oder fragen Sie ein Medium. Kurz gesagt: **DOYR — Do Your Own Research (Recherchieren Sie selbst)**. Lassen Sie uns dazulernen und Spaß dabei haben.

---

## Zusammenfassung

- Die Tokenisierung einer Domain, die Sie bereits besitzen, ist ein geführter, ca. 30-minütiger interaktiver Prozess, plus bis zu einer Woche Wartezeit auf Seiten des Registrars.
- Sie benötigen: Kontrolle über die Domain, eine Self-Custody-Wallet, eine kleine Menge an Gas und Geduld.
- Das On-Chain-Minting ist der *letzte* Schritt; der Großteil der Arbeit ist der langweilige Registrar-Transfer-Ablauf, den die ICANN unabhängig von der Blockchain vorschreibt.
- Nach der Tokenisierung haben Sie **zwei synchronisierte Eigentumsebenen** – den traditionellen DNS-Eintrag und ein NFT in Ihrer Wallet.
- Lesen Sie den [Leitfaden zur Wiederherstellung nach Wallet-Verlust](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) *bevor* Sie tokenisieren, nicht danach.

Bereit anzufangen? Gehen Sie zu [namefi.io](https://namefi.io).