---
title: 'Vom Listing bis zur Abwicklung: Wie tokenisierte Marktplätze Treuhanddienste ersetzen'
date: '2026-05-22'
language: de
tags: ['guide']
authors: ['namefiteam']
draft: false
description: 'Wie Marktplätze für tokenisierte Domains es Käufern und Verkäufern ermöglichen, atomar On-Chain abzuwickeln – ohne Treuhanddienst, ohne Auth-Codes, ohne fünftägige Registrar-Sperre. Was jeden Teil des traditionellen Ablaufs ersetzt und welche Risiken sich auf andere Ebenen verlagern.'
keywords: ['Domain-Marktplatz Blockchain', 'atomarer Domain-Transfer', 'Marktplatz für tokenisierte Domains', 'Domain-Treuhand ersetzen', 'Domain-Verkauf ohne Treuhand', 'Domain-Verkauf Krypto', 'Verkaufsprozess für tokenisierte Domains', 'tokenisierte Domain verkaufen', 'tokenisierte Domain kaufen', 'On-Chain Domain-Verkauf', 'Domain NFT-Abwicklung', 'Domain-Marktplatz 2026', 'Liquidität für tokenisierte Domains']
relatedArticles:
  - /de/blog/domain-escrow-explained/
  - /de/blog/how-tokenization-changes-domain-flipping/
  - /de/blog/tokenize-your-com-to-flip-it/
  - /de/blog/how-to-sell-a-domain-name-you-own/
  - /de/blog/selling-domains-as-nfts/
relatedTopics:
  - /de/topics/domain-tokenization/
  - /de/topics/domain-investing/
relatedSeries:
  - /de/series/tokenize-your-com/
  - /de/series/domain-flipping-skills/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/icann/
  - /de/glossary/tld/
  - /de/glossary/dns/
  - /de/glossary/web3/
---

Der traditionelle Ablauf beim Verkauf einer `.com`-Domain sieht in etwa so aus:

1. Listing bei [Sedo](https://sedo.com/), [Afternic](https://www.afternic.com/) oder Dan.com.
2. Verhandeln.
3. Einrichten eines [Treuhandkontos (Escrow)](/de/glossary/escrow/) bei [Escrow.com](https://www.escrow.com/) oder ähnlichen Anbietern. Der Käufer überweist das Geld.
4. Der Verkäufer entsperrt die Domain und stellt den [Auth-Code](/de/glossary/auth-code/) zur Verfügung.
5. Der Käufer leitet einen [Cross-Registrar-Transfer](/de/glossary/cross-registrar-transfer/) bei seinem [Registrar](/de/glossary/registrar/) ein.
6. 5–7 Tage warten, bis der [ICANN](/de/glossary/icann/)-Transfer abgeschlossen ist.
7. Bestätigung des Transfers; der Treuhanddienst gibt die Gelder frei.
8. Zahlung von 3–6 % Treuhandgebühren, plus Marktplatzprovisionen.

Das funktioniert. Es ist seit zwei Jahrzehnten der Standard. Es ist aber auch langsam, teuer und voller Momente, in denen eine Partei darauf vertrauen muss, dass die andere (oder ein externer Treuhänder) das Richtige tut.

Der Verkauf tokenisierter Domains komprimiert das Ganze in eine einzige Transaktion. Dieser Beitrag erklärt, wie das funktioniert und wohin sich das Vertrauen eigentlich verlagert.

---

## Der neue Ablauf von A bis Z

1. Listing der [tokenisierten Domain](/de/blog/what-are-tokenized-domains/) auf einem [Marktplatz](/de/glossary/marketplace/) (dem eigenen von Namefi, Doma, [OpenSea](https://opensea.io/), [Blur](https://blur.io/) usw.).
2. Der Käufer bezahlt. Das [NFT](/de/glossary/nft/) wandert in das [Wallet](/de/glossary/wallet/) des Käufers. Der Eintrag aufseiten des [Registrars](/de/glossary/registrar/) wird von der Plattform synchron gehalten.
3. Fertig.

Das war's. Zwei Schritte. Kein [Auth-Code](/de/glossary/auth-code/), kein [Treuhanddienst (Escrow)](/de/glossary/escrow/), keine 5-tägige Registrar-Sperre, keine „Ich habe das Geld überwiesen, jetzt vertraue ich dir“-Lücke.

Das funktioniert, weil das **NFT der kanonische Eigentumsnachweis ist** und [On-Chain](/de/glossary/on-chain/)-Transaktionen [atomar](/de/glossary/atomic-transfer/) sind: Zahlung und Vermögensübertragung finden im selben Block statt, oder keines von beiden passiert.

---

## Was aus den traditionellen Elementen wird

### Listing-Plattform

Gleiches Konzept, andere Oberfläche. Marktplätze nehmen nach wie vor eine Provision und kuratieren die Angebote. Die große Änderung: Tokenisierte Angebote können auf **mehreren Marktplätzen gleichzeitig** erscheinen, da es sich um Standard-NFTs handelt. Sie listen die Domain einmal auf der Plattform, von der sie stammt; OpenSea/Blur aggregieren sie möglicherweise automatisch.

Das ist eine bedeutende [Liquidität](/de/glossary/domain-liquidity/)sverbesserung gegenüber der klassischen Domain-Welt, in der Sedo und Afternic geschlossene Ökosysteme (Walled Gardens) betrieben.

### Escrow.com

**Verschwunden.** Ersetzt durch eine atomare On-Chain-Abwicklung.

Im traditionellen Ablauf gibt es Treuhanddienste, um die asynchrone Lücke zwischen der Zahlung des Käufers und der Übertragung durch den Verkäufer zu überbrücken. Beim tokenisierten Ablauf gibt es diese Lücke nicht – die Transaktion ist atomar, sodass keine dritte Partei das Geld in der Mitte halten muss. Dadurch entfallen die Treuhandgebühr von 3–6 % und die Wartezeit.

### Auth-Codes (EPP-Codes)

**Für die tokenisierte Hälfte der Transaktion nicht erforderlich.** Der On-Chain-Transfer erfolgt sofort. Die Datensatzsynchronisation auf Registrar-Seite wird vom Protokoll übernommen; der Käufer muss nichts manuell tun.

(Möchte ein Käufer die Domain später *de-tokenisieren* und vollständig zu einem anderen Registrar umziehen, ist das ein separater Ablauf, der den traditionellen Registrar-Transfer-Mechanismus wieder in Gang setzt – mit Auth-Codes und allem Drum und Dran.)

### 5-tägige ICANN-Transfersperre

**Wird beim tokenisierten Transfer selbst übersprungen.** Die ICANN-Transferregeln gelten für Transfers zwischen Registraren, nicht für Eigentümerwechsel innerhalb eines Registrars. Die Plattform für tokenisierte Domains wickelt die On-Chain-Änderung ab, ohne einen vollständigen Inter-Registrar-Transfer auszulösen.

Es gibt eine damit zusammenhängende Regel – die 60-tägige Sperrfrist (Cooldown) nach einem Registrar-Transfer –, die weiterhin gilt, wenn eine Domain kürzlich zwischen Registraren transferiert wurde. Dabei geht es um Registrar-Transfers, nicht um On-Chain-Transfers, sodass tokenisierte Verkäufe dadurch nicht blockiert werden.

### Banküberweisungen und Bankverzögerungen

**Ersetzt durch Zahlungen mit Krypto und [Stablecoins](/de/glossary/stablecoin/).** USDC, ETH und andere On-Chain-Zahlungen werden in Sekunden abgewickelt. Banküberweisungen dauern Tage. Am deutlichsten ist der Unterschied bei internationalen Verkäufen.

### „Ich vertraue darauf, dass die andere Person ihren Teil erfüllt“

**Ersetzt durch Smart-Contract-Atomarität.** Die Transaktion wird entweder vollständig abgeschlossen (Sie erhalten das Asset, die Gegenseite das Geld) oder sie findet gar nicht erst statt (keine Bewegung auf beiden Seiten). Es gibt kein Szenario, in dem nur eine Seite ihren Teil erfüllt.

---

## Wohin sich die Risiken tatsächlich verlagern

Das alles bringt nicht nur Vorteile – das Risikoprofil verschiebt sich. Einige Risiken, die im traditionellen Ablauf von Treuhanddiensten gehandhabt wurden, existieren jetzt an anderer Stelle.

### Wallet-Sicherheitsrisiko

Sie senden nun ein NFT an eine Wallet-Adresse. Wenn der Käufer Ihnen eine falsche Adresse gegeben hat – oder wenn Ihre Benutzeroberfläche Sie dazu verleitet, an eine falsche Adresse zu senden –, liegt das in Ihrer Verantwortung. Überprüfen Sie immer die Empfängeradresse.

### Smart-Contract-Risiko

Der [Smart Contract](/de/glossary/smart-contract/) des Marktplatzes ist das neue „Treuhandkonto“. Wenn er einen Fehler hat, können seltsame Dinge passieren. Aus diesem Grund sind geprüfte (audited), praxiserprobte Marktplätze wichtig. Seien Sie nicht der Erste, der einen brandneuen Vertrag für einen hochwertigen Verkauf nutzt.

### Front-Running und MEV

On-Chain-Listings sind öffentlich. Ein entschlossener Akteur kann versuchen, einer Transaktion zuvorzukommen (Front-Running; der Überbegriff lautet [MEV — Maximal Extractable Value](https://ethereum.org/en/developers/docs/mev/)). Große Marktplätze haben Gegenmaßnahmen, aber es ist eine Risikokategorie, die es im traditionellen Ablauf nicht gab.

### Risiko gestohlener Assets

Wenn das NFT, das Sie kaufen, gestohlen wurde, könnten Sie am Ende eine Domain besitzen, die von Plattformen und Marktplätzen koordiniert markiert (geflaggt) wird. Einige Marktplätze weigern sich, Verkäufe von markierten NFTs zu honorieren. Dies ist ein reales und fortlaufendes Arbeitsfeld im gesamten NFT-Ökosystem.

### KYC / Sanktionen

Je nach Marktplatz und Rechtsprechung können Verkäufer und Käufer mit KYC-Anforderungen (Know Your Customer) konfrontiert werden. Das ist nicht neu – Treuhanddienste hatten diese auch –, aber die Mechanismen sind anders.

### Steuerliche Ereignisse

Ein in Krypto bezahlter Verkauf stellt in einigen Rechtsordnungen ein anderes steuerliches Ereignis dar als ein in Fiat-Währung bezahlter Verkauf. Lesen Sie unseren [Beitrag über Steuer- und Buchhaltungsfragen](/de/blog/tax-and-accounting-questions-for-tokenized-domains/) für einen Katalog von Fragen, die Sie Ihrem Steuerberater stellen können.

---

## Was dies für Käufer bedeutet

- **Geschwindigkeit.** Verkäufe werden in Minuten abgewickelt, nicht in Tagen.
- **Niedrigere Gebühren.** Keine Provision für Treuhanddienste. Marktplatz- und [Gas](/de/glossary/gas/)-Kosten sind in der Regel viel niedriger als 3–6 %.
- **Direktes Eigentum.** Das NFT ist sofort und ohne Wartezeit in Ihrem Wallet.
- **Verifizierung.** Sie können die On-Chain-Historie vor dem Kauf überprüfen – wann die Domain gemintet wurde, frühere Transfers, frühere Listings.

Sie tauschen den Komfort eines vertrauten Treuhand-Ablaufs gegen den ungewohnten Komfort der kryptografischen Atomarität. Für die meisten an NFTs gewöhnten Käufer ist dies unter dem Strich ein Upgrade. Für Einsteiger lohnt es sich, zuerst eine kleine Übungstransaktion durchzuführen.

---

## Was dies für Verkäufer bedeutet

- **Die gleichen Upgrades**: Schneller, günstiger, transparenter.
- **Mehr Verkaufsorte.** Ihr Listing kann auf mehreren NFT-Marktplätzen gleichzeitig erscheinen.
- **Anderes Publikum.** Käufer auf NFT-Marktplätzen verhalten sich anders als traditionelle Domain-Käufer. Die Preisdynamik kann sich je nach Domain in beide Richtungen verschieben.
- **Kein Risiko abspringender Käufer („Buyer Flake“).** Die Transaktion wird entweder abgeschlossen oder nicht. Kein „Der Käufer hat den Treuhanddienst bezahlt und ist dann verschwunden“ mehr.

Die Kehrseite: Sie verzichten auf die (manchmal beträchtliche) Marketing-Reichweite der spezialisierten Broker der traditionellen Domain-Branche. Für Premium-Domains sind hybride Strategien – sowohl als tokenisiertes NFT als auch über traditionelle Kanäle gelistet – üblich.

---

## Hybride Listings

Nichts an einer tokenisierten Domain hindert Sie daran, sie auch auf die altmodische Art zu listen. Viele Eigentümer listen:

- Auf dem plattformeigenen Marktplatz.
- Auf allgemeinen NFT-Marktplätzen (OpenSea, Blur).
- Auf traditionellen Domain-Marktplätzen (Sedo, Afternic), mit dem Vorbehalt, dass der Käufer die Domain möglicherweise „de-tokenisieren“ oder die tokenisierte Form akzeptieren möchte.

Das ist mehr Arbeit, aber für erstklassige Domains erweitert es den Käuferkreis erheblich.

---

## Wohin unserer Meinung nach die Reise geht

Sobald sich Käufer und Verkäufer an die atomare Abwicklung gewöhnt haben, fühlt sich der traditionelle Treuhand-Ablauf an wie das Ausschreiben eines Schecks – machbar, aber archaisch. Die Elemente, die noch benötigt werden, damit Marktplätze für tokenisierte Domains ein größeres Volumen übernehmen können, sind:

- Bessere domainspezifische Suche und Filterung auf NFT-Marktplätzen.
- Bessere Bewertungstools für heterogene Assets.
- Breitere [TLD](/de/glossary/tld/)-Abdeckung über Tokenisierungsplattformen hinweg.
- Stabile, gut geprüfte Smart Contracts, die keine öffentlichkeitswirksamen Zwischenfälle verursacht haben.

All dies ist in Arbeit und verbessert sich von Jahr zu Jahr zusehends.

---

## Freundlicher Haftungsausschluss (Bitte lesen!)

> Wir sind keine Anwälte, Steuerberater, Finanzberater oder Ärzte – und **nichts in diesem Artikel stellt eine rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder sonstige professionelle Beratung dar.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden und als Service für unsere Kunden. Die hier enthaltenen Informationen können veraltet, geografisch spezifisch oder schlichtweg falsch sein – auch wir machen Fehler.
>
> Für jede wichtige Entscheidung **konsultieren Sie bitte einen echten Fachmann (ernsthaft!)**. Oder wenn das nicht Ihr Ding ist, fragen Sie einen Freund, fragen Sie Twitter, fragen Sie Reddit, fragen Sie eine KI oder befragen Sie ein Medium. Kurz gesagt: **DOYR — Do Your Own Research (Recherchieren Sie selbst)**. Lassen Sie uns lernen und Spaß haben.

---

## Zusammenfassung

- Marktplätze für tokenisierte Domains komprimieren den traditionellen Ablauf (Listen → Verhandeln → Treuhand → Transfer → Abwicklung) in eine einzige On-Chain-Transaktion.
- Das Element, das am deutlichsten verschwindet, ist der **Treuhanddienst (Escrow)**: Kryptografische Atomarität macht einen externen Geldeinbehalter überflüssig.
- Auth-Codes, Registrar-Sperren und Banküberweisungen entfallen ebenfalls für die tokenisierte Hälfte der Transaktion.
- An ihrer Stelle treten neue Risiken auf: Wallet-Sicherheit, Smart-Contract-Fehler, MEV, Koordination bei gestohlenen Assets. Diese Risiken verlagern sich auf andere Bereiche, sie verschwinden nicht völlig.
- Nettoeffekt: Schnellerer, günstigerer und transparenterer Verkauf mit einer anderen (und verbesserungsfähigen) Nutzererfahrung (UX). Hybride Listings bleiben für Premium-Domains üblich.

Wenn Sie den Verkauf einer tokenisierten Domain selbst ausprobieren möchten, besuchen Sie [namefi.io](https://namefi.io). Für ein umfassenderes Bild lesen Sie [Anwendungsfälle für tokenisierte Domains im Jahr 2026](/de/blog/tokenized-domain-use-cases-2026/).