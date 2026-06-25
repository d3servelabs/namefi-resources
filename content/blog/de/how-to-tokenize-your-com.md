---
title: "So tokenisieren Sie Ihre .com: Eine Schritt-für-Schritt-Anleitung (2026)"
date: '2026-05-22'
language: de
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Eine praktische Schritt-für-Schritt-Anleitung zur Tokenisierung einer Domain, die Sie bereits besitzen – Voraussetzungen, Wallets, Gebühren, Dauer und was Sie auf jedem Bildschirm erwartet. Geschrieben für Eigentümer, nicht für Protokoll-Nerds."
keywords: ['Wie man eine Domain tokenisiert', 'Wie man eine .com tokenisiert', 'Meine Domain tokenisieren', 'Bestehende Domain tokenisieren', 'Domain tokenisieren Schritt für Schritt', 'Domain-Tokenisierung Tutorial', '.com tokenisieren Anleitung', '.xyz tokenisieren', '.io tokenisieren', 'Namefi tokenisieren', 'NFT Domain Anleitung', 'Domain zu NFT transferieren', 'Domain zu NFT', 'Domain Tokenisierungsprozess', 'Tokenisierte Domain Einrichtung', 'ICANN Domain tokenisieren']
---

Sie besitzen also eine Domain – vielleicht `mybrand.com`, vielleicht ein Portfolio von `.xyz`-Namen – und Sie haben beschlossen, dass Sie diese **tokenisieren** möchten. Dieser Leitfaden führt Sie Bildschirm für Bildschirm durch das, was tatsächlich passiert, damit Sie die Zeit, das Geld und die Zugriffsrechte planen können, die Sie benötigen, bevor Sie beginnen.

Wenn Sie noch überlegen, *warum* Sie tokenisieren sollten, lesen Sie zuerst [Warum Domains On-Chain tokenisieren?](/de/blog/why-tokenize-domains/). Wenn Sie sich nicht sicher sind, *was* Tokenisierung überhaupt bedeutet, ist [Was sind tokenisierte Domains?](/de/blog/what-are-tokenized-domains/) der richtige Einstiegspunkt.

Dieser Beitrag geht davon aus, dass Sie es bereits tun möchten.

---

## Bevor Sie beginnen: Eine 60-Sekunden-Checkliste

Der Ablauf wird viel reibungsloser sein, wenn folgende Punkte erfüllt sind, bevor Sie irgendwo klicken:

- **Sie kontrollieren die Domain bei ihrem aktuellen [Registrar](/de/glossary/registrar/).** Sie können sich einloggen, Nameserver ändern und Transfers / [Auth-Codes](/de/glossary/auth-code/) genehmigen.
- **Sie besitzen eine selbstverwaltete (self-custodial) [Wallet](/de/glossary/wallet/).** MetaMask, Rabby, Coinbase Wallet oder jede andere Standard-EVM-Wallet. Stellen Sie sicher, dass Sie tatsächlich über die [Seed-Phrase](/de/glossary/seed-phrase/) verfügen – und nicht nur über ein Konto bei einer Kryptobörse.
- **Die Wallet verfügt über eine kleine Menge an [Gas](/de/glossary/gas/).** Ein paar Dollar in ETH oder Base-ETH decken die [On-Chain](/de/glossary/on-chain/)-Mint-Transaktion ab. Sie benötigen nicht viel.
- **Die Domain ist nicht gesperrt, läuft nicht bald ab und befindet sich nicht mitten in einem Transfer.** Domains innerhalb von etwa 60 Tagen nach einem kürzlichen [Registrar-Transfer](/de/glossary/cross-registrar-transfer/) oder innerhalb von 30 Tagen vor Ablauf können oft nicht übertragen werden. Prüfen Sie dies im Voraus.
- **Sie haben Zeit.** Planen Sie etwa 30 Minuten aktive Aufmerksamkeit ein, plus bis zu 5–7 Tage für die Hintergrundverarbeitung bei Registrar-Transfers.

Wenn einer dieser Punkte unsicher ist, beheben Sie ihn, bevor Sie beginnen. Der Prozess verträgt Geduld viel besser als Überraschungen.

---

## Schritt 1: Verbinden Sie Ihre Wallet auf namefi.io

Gehen Sie zu [namefi.io](https://namefi.io) und klicken Sie auf „Connect Wallet“. Bestätigen Sie die Verbindung in Ihrer Wallet. Diese Wallet wird der **Eigentümer** der tokenisierten Domain – der NFT wird hier liegen, und wer diese Wallet besitzt, besitzt die Domain.

> **Nehmen Sie das ernst.** Wenn Sie diese Wallet verlieren, verlieren Sie die On-Chain-Seite Ihrer Domain. Wir haben einen separaten Leitfaden zur [Wiederherstellung einer tokenisierten Domain nach Wallet-Verlust](/de/blog/recovering-a-tokenized-domain-after-wallet-loss/) – lesen Sie ihn jetzt, nicht erst später.

---

## Schritt 2: Fügen Sie die Domain hinzu, die Sie tokenisieren möchten

Suchen oder fügen Sie in Ihrem Namefi-Dashboard die Domain hinzu, die Sie bereits besitzen. Namefi prüft die Eignung – den [Registrar](/de/glossary/registrar/), bei dem sie sich derzeit befindet, ob sie gesperrt werden kann, ob sie den [ICANN](/de/glossary/icann/)-Transferregeln entspricht und ob die [TLD](/de/glossary/tld/) unterstützt wird.

Sie werden einen von drei Status sehen:

- **Jetzt berechtigt.** Fahren Sie mit Schritt 3 fort.
- **Nach einer Wartezeit berechtigt.** Dies bedeutet in der Regel, dass sich ein kürzlicher Transfer noch innerhalb des 60-tägigen ICANN-Sperrfensters befindet. Warten Sie diese Zeit ab und kommen Sie dann zurück.
- **Nicht unterstützt.** Einige TLDs werden noch nicht unterstützt. Überprüfen Sie die Liste der unterstützten TLDs oder kontaktieren Sie den Support.

---

## Schritt 3: Wählen Sie einen Tokenisierungs-Pfad

Namefi bietet in der Regel einige verschiedene Pfade an, abhängig vom aktuellen Registrar der Domain:

1. **Transferieren und dann tokenisieren.** Verschieben Sie die Domain zum akkreditierten Registrar-Partner von Namefi und minten Sie dann den On-Chain-Token. Dies ist der häufigste Weg. Er dauert aufgrund des ICANN-Transferablaufs einige Tage, nicht wegen irgendetwas [Blockchain](/de/glossary/blockchain/)-spezifischem.
2. **Direkte Tokenisierung (wo unterstützt).** Bei einigen Registrar-Integrationen (in-place) bleibt die Domain dort, wo sie ist, und die On-Chain-Schicht wird darüber gelegt. Dies ist schneller, aber nur für bestimmte Partner-Registrare verfügbar.

Sie sehen den Pfad, der für Ihre Domain infrage kommt. Das Dashboard zeigt Ihnen im Voraus die geschätzte Dauer und anfallende Gebühren an.

---

## Schritt 4: Auth-Code bestätigen / Transfer genehmigen (falls erforderlich)

Für den Transfer-Pfad holen Sie sich den [**Auth-Code**](/de/glossary/auth-code/) (manchmal auch EPP-Code genannt) von Ihrem aktuellen Registrar und fügen ihn bei Namefi ein. Möglicherweise müssen Sie auch:

- Die Domain bei Ihrem aktuellen Registrar entsperren (Unlock).
- Eine Bestätigungs-E-Mail genehmigen, die an den Kontakt des Domaininhabers gesendet wird.

Dies ist der langsamste Teil des gesamten Prozesses. Planen Sie 5–7 Tage für den Abschluss des Registrar-Transfers ein, obwohl er oft auch schneller abgeschlossen ist.

---

## Schritt 5: Den On-Chain-Token minten

Sobald sich die Domain unter der Namefi-Registrar-Integration befindet, werden Sie aufgefordert, die [NFT](/de/glossary/nft/)-Darstellung (ein Standard-[ERC-721](/de/glossary/erc-721/)-Token) zu **minten**. Ihre Wallet öffnet sich; Sie bestätigen eine Transaktion; [Gas](/de/glossary/gas/) wird bezahlt; der Token landet in Ihrer Wallet.

Dies ist der Moment, in dem die Domain [*tokenisiert*](/de/glossary/tokenize/) wird. Sie haben nun:

- Den traditionellen [DNS](/de/glossary/dns/) / Registrar-Eintrag (immer noch real, immer noch ICANN-anerkannt).
- Einen [On-Chain](/de/glossary/on-chain/)-NFT in Ihrer Wallet, der das Eigentum repräsentiert.

Beide werden fortan durch das Protokoll synchron gehalten.

---

## Schritt 6: Überprüfen Sie Ihre Wallet und einen Block-Explorer

Öffnen Sie den NFT-Tab Ihrer Wallet. Sie sollten den neuen NFT der tokenisierten Domain sehen. Klicken Sie sich zu einem Block-Explorer (Etherscan, Basescan usw.) durch, um den Smart Contract und die Eigentümeradresse zu bestätigen. Dies ist ein guter Moment, um einen Screenshot für Ihre eigenen Unterlagen zu machen.

Wenn Sie eine [Hardware-Wallet](/de/glossary/hardware-wallet/) haben, ist dies ein hervorragender Moment, um den NFT dorthin zu übertragen. Die Übertragung ist ein normaler NFT-Transfer und kostet Gas.

---

## Schritt 7: DNS und Verlängerungen verwalten

Die Tokenisierung einer Domain ändert nichts daran, wie sie aufgelöst wird. Ihre Nameserver, A-Records, MX-Records, [DNSSEC](/de/glossary/dnssec/) – all das funktioniert weiterhin. Sie können diese über das Namefi-Dashboard verwalten oder sie wie bisher an Ihren bestehenden DNS-Anbieter (Cloudflare, Route53 usw.) delegieren.

Details darüber, was sich auf der DNS-Ebene ändert (und was nicht), finden Sie unter [DNS funktioniert weiterhin: Nameserver, E-Mail und DNSSEC bei einer tokenisierten Domain](/de/blog/dns-on-tokenized-domains/).

Verlängerungen (Renewals) erfolgen weiterhin über die Registrar-Ebene. Namefi übernimmt die registrarseitige Abrechnung; Sie behalten das On-Chain-Eigentum.

---

## Was Sie an Kosten erwarten können

Sie zahlen im Grunde für drei Dinge:

- **Registrar-Gebühren.** Die normalen jährlichen Preise für Domainverlängerungen plus etwaige Transfergebühren. Dies sind reale Kosten, die unabhängig von der Tokenisierung anfallen.
- **Gas.** Ein paar Dollar für die Mint-Transaktion, je nachdem auf welcher Blockchain (Base ist günstiger als [Ethereum](/de/glossary/ethereum/) L1).
- **Protokollgebühren.** Die eigenen Gebühren von Namefi für den Tokenisierungs-Dienst. Diese werden im Dashboard angezeigt, bevor Sie bestätigen.

Es gibt keine versteckten Überraschungen. Wenn eine Zahl nicht auf dem Bestätigungsbildschirm steht, handelt es sich auch nicht um eine Gebühr.

---

## Häufige Stolpersteine

- **„Mein Registrar gibt den Auth-Code nicht heraus.“** Einige Registrare verstecken diesen tief in ihrer Benutzeroberfläche oder verlangen ein Support-Ticket. Seien Sie geduldig und hartnäckig.
- **„Ich habe die Domain entsperrt, aber das System sagt immer noch, sie sei gesperrt.“** Registrare speichern den Sperrstatus oft für bis zu 24 Stunden im Cache. Warten Sie einen Tag ab und aktualisieren Sie dann die Seite.
- **„Meine Wallet zeigt den NFT an, aber die Domain erscheint immer noch bei meinem alten Registrar.“** Während des Transferfensters können beide Seiten kurzzeitig den Besitz anzeigen. Die On-Chain-Seite wird maßgeblich, nachdem der Transfer abgeschlossen ist.
- **„Ich möchte eine [Multisig](/de/glossary/multi-sig/) als Eigentümer verwenden.“** Wird unterstützt. Verbinden Sie die Multisig-Wallet. Stellen Sie nur sicher, dass Sie tatsächlich Transaktionen von ihr ausführen können – eine Multisig, bei der Sie Unterzeichner verloren haben, bedeutet auch eine verlorene Domain. Hintergrundinformationen: [Verbessern Multisig-Wallets tatsächlich die Sicherheit?](/de/blog/do-multisig-wallets-actually-improve-security/)

---

## Freundlicher Haftungsausschluss (Bitte lesen!)

> Wir sind keine Anwälte, Steuerberater, Finanzberater oder Ärzte – und **nichts in diesem Artikel stellt eine rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder sonstige professionelle Beratung dar.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden und als Service für unsere Kunden. Die Informationen hier können veraltet, regionalspezifisch oder schlichtweg falsch sein – auch wir machen Fehler.
>
> Für jede wichtige Entscheidung **konsultieren Sie bitte einen echten Experten (im Ernst!)**. Oder wenn das nicht Ihr Fall ist, fragen Sie einen Freund, fragen Sie Twitter, fragen Sie Reddit, fragen Sie eine KI oder fragen Sie ein Medium. Kurz gesagt: **DYOR — Do Your Own Research (Recherchieren Sie selbst)**. Lassen Sie uns lernen und Spaß haben.

---

## Zusammenfassung

- Die Tokenisierung einer Domain, die Sie bereits besitzen, ist ein geführter, ca. 30-minütiger interaktiver Prozess plus bis zu einer Woche Wartezeit auf Seiten des Registrars.
- Sie benötigen: Kontrolle über die Domain, eine selbstverwaltete Wallet, eine kleine Menge an Gas und Geduld.
- Der On-Chain-Mint ist der *letzte* Schritt; die meiste Arbeit ist der eher langweilige Registrar-Transfer-Ablauf, den die ICANN unabhängig von der Blockchain vorschreibt.
- Nach der Tokenisierung haben Sie **zwei synchronisierte Eigentumsschichten** – den traditionellen DNS-Eintrag und einen NFT in Ihrer Wallet.
- Lesen Sie den [Leitfaden zur Wiederherstellung nach Wallet-Verlust](/de/blog/recovering-a-tokenized-domain-after-wallet-loss/) *bevor* Sie tokenisieren, nicht erst danach.

Bereit loszulegen? Besuchen Sie [namefi.io](https://namefi.io).