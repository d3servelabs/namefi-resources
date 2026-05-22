---
title: "Von der Listung bis zur Abwicklung: Wie tokenisierte Marktplätze Escrow ersetzen"
date: '2026-05-22'
language: de
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Wie Marktplätze für tokenisierte Domains Käufern und Verkäufern eine atomare On-Chain-Abwicklung ermöglichen – ohne Treuhandservice, ohne Auth-Codes, ohne fünftägige Registrar-Sperre. Was jeden Teil des traditionellen Ablaufs ersetzt und welche Risiken sich auf andere Ebenen verlagern."
keywords: ['Domain-Marktplatz Blockchain', 'atomarer Domain-Transfer', 'Marktplatz für tokenisierte Domains', 'Domain-Escrow ersetzen', 'Domain-Verkauf ohne Escrow', 'Domain-Verkauf Krypto', 'Verkaufsprozess tokenisierte Domain', 'tokenisierte Domain verkaufen', 'tokenisierte Domain kaufen', 'On-Chain-Domain-Verkauf', 'Domain-NFT-Abwicklung', 'Domain-Marktplatz 2026', 'Liquidität tokenisierter Domains']
---

Der traditionelle Ablauf beim Verkauf einer `.com` sieht in etwa so aus:

1. Einstellen bei [Sedo](https://sedo.com/), [Afternic](https://www.afternic.com/) oder Dan.com.
2. Verhandeln.
3. Eröffnung eines [Treuhandkontos (Escrow)](/en/glossary/escrow/) bei [Escrow.com](https://www.escrow.com/) oder einem ähnlichen Anbieter. Der Käufer überweist das Geld.
4. Der Verkäufer entsperrt die Domain und stellt den [Auth-Code](/en/glossary/auth-code/) bereit.
5. Der Käufer leitet einen [Cross-Registrar-Transfer](/en/glossary/cross-registrar-transfer/) bei seinem [Registrar](/en/glossary/registrar/) ein.
6. 5–7 Tage warten, bis der [ICANN](/en/glossary/icann/)-Transfer abgeschlossen ist.
7. Den Transfer bestätigen; der Escrow-Service gibt die Gelder frei.
8. 3–6 % an Escrow-Gebühren plus den Anteil des Marktplatzes zahlen.

Es funktioniert. Das ist seit zwei Jahrzehnten der Standard. Es ist aber auch langsam, teuer und voller Momente, in denen eine Partei der anderen (oder einem dritten Treuhänder) vertrauen muss, das Richtige zu tun.

Der Verkauf tokenisierter Domains komprimiert das Ganze in eine einzige Transaktion. Dieser Beitrag erklärt, wie das funktioniert und wohin sich das Vertrauen dabei tatsächlich verlagert.

---

## Der neue Ablauf, durchgängig (End-to-End)

1. Die [tokenisierte Domain](/en/blog/what-are-tokenized-domains/) auf einem [Marktplatz](/en/glossary/marketplace/) einstellen (Namefis eigener, Doma, [OpenSea](https://opensea.io/), [Blur](https://blur.io/) usw.).
2. Der Käufer zahlt. Das [NFT](/en/glossary/nft/) geht in das [Wallet](/en/glossary/wallet/) des Käufers über. Der Eintrag auf [Registrar](/en/glossary/registrar/)-Seite wird von der Plattform synchron gehalten.
3. Fertig.

Das war's. Zwei Schritte. Kein [Auth-Code](/en/glossary/auth-code/), kein [Escrow](/en/glossary/escrow/), keine 5-tägige Registrar-Sperre, keine "Ich habe das Geld überwiesen, jetzt vertraue ich dir"-Lücke.

Das funktioniert, weil das **NFT der verbindliche Eigentumsnachweis** ist und [On-Chain](/en/glossary/on-chain/)-Transaktionen [atomar](/en/glossary/atomic-transfer/) sind: Zahlung und Vermögensübertragung finden im selben Block statt, oder keines von beiden geschieht.

---

## Was aus den traditionellen Bestandteilen wird

### Listing-Plattform (Marktplatz)

Gleiche Idee, andere Oberfläche. Marktplätze nehmen immer noch einen Anteil und kuratieren weiterhin Angebote. Die große Änderung: Tokenisierte Listings können **auf mehreren Marktplätzen gleichzeitig** erscheinen, da es sich um Standard-NFTs handelt. Listen Sie die Domain einmal auf der Plattform, von der sie stammt; OpenSea/Blur aggregieren sie möglicherweise automatisch.

Dies ist eine bedeutende Liquiditätsverbesserung gegenüber der klassischen Domain-Welt, in der Sedo und Afternic als geschlossene Systeme (Walled Gardens) agierten.

### Escrow.com

**Verschwunden.** Ersetzt durch die atomare On-Chain-Abwicklung.

Im traditionellen Ablauf dient der Treuhandservice (Escrow) dazu, die asynchrone Lücke zwischen der Zahlung des Käufers und der Übertragung durch den Verkäufer zu überbrücken. Beim tokenisierten Ablauf existiert diese Lücke nicht – die Transaktion ist atomar, sodass kein Dritter das Geld dazwischen verwahren muss. Dadurch entfallen die 3–6 % Escrow-Gebühr und die Wartezeit.

### Auth-Codes (EPP-Codes)

**Für die tokenisierte Hälfte der Transaktion nicht erforderlich.** Der On-Chain-Transfer erfolgt sofort. Die Synchronisation der Einträge auf Registrar-Seite wird vom Protokoll übernommen; der Käufer muss nichts manuell erledigen.

(Wenn ein Käufer die Domain später *de-tokenisieren* und vollständig zu einem anderen Registrar umziehen möchte, ist das ein separater Ablauf, der den traditionellen Registrar-Transfer-Mechanismus reaktivieren würde – inklusive Auth-Codes und allem anderen.)

### 5-tägige ICANN-Transfersperre

**Wird für den tokenisierten Transfer selbst übersprungen.** Die Transferregeln der ICANN gelten für Transfers zwischen Registraren, nicht für Eigentümerwechsel innerhalb eines Registrars. Die Plattform für tokenisierte Domains wickelt die On-Chain-Änderung ab, ohne einen vollständigen Inter-Registrar-Transfer auszulösen.

Es gibt eine verwandte Regel – die 60-tägige Sperrfrist nach einem Registrar-Transfer –, die weiterhin gilt, falls eine Domain kürzlich zwischen Registraren transferiert wurde. Dabei geht es jedoch um Registrar-Transfers, nicht um On-Chain-Transfers, daher blockiert dies keine tokenisierten Verkäufe.

### Banküberweisungen und Bankverzögerungen

**Ersetzt durch Krypto- und [Stablecoin](/en/glossary/stablecoin/)-Zahlungen.** USDC, ETH und andere On-Chain-Zahlungen werden in Sekunden abgewickelt. Banküberweisungen dauern Tage. Dieser Unterschied ist bei internationalen Verkäufen am eklatantesten.

### „Ich vertraue darauf, dass die andere Person ihren Teil erfüllt“

**Ersetzt durch die Atomizität von Smart Contracts.** Die Transaktion wird entweder vollständig abgeschlossen (Sie erhalten den Vermögenswert, der andere das Geld) oder sie findet gar nicht erst statt (keine Bewegung auf beiden Seiten). Es gibt keine Version, bei der die eine Seite liefert und die andere nicht.

---

## Wohin sich die Risiken tatsächlich verlagern

Das bringt nicht nur Vorteile mit sich – das Risikoprofil verschiebt sich. Einige Risiken, die im traditionellen Ablauf vom Escrow abgedeckt wurden, liegen nun woanders.

### Sicherheitsrisiko des Wallets

Sie senden jetzt ein NFT an eine Wallet-Adresse. Wenn der Käufer Ihnen eine falsche Adresse gegeben hat – oder wenn Ihre Benutzeroberfläche Sie dazu verleitet, an eine falsche Adresse zu senden –, liegt das in Ihrer Verantwortung. Überprüfen Sie immer die Empfängeradresse.

### Smart-Contract-Risiko

Der Smart Contract des Marktplatzes ist das neue "Escrow". Wenn er einen Fehler hat, können seltsame Dinge passieren. Deshalb sind geprüfte (auditierte), praxiserprobte Marktplätze so wichtig. Seien Sie nicht der Erste, der einen brandneuen Contract für einen Verkauf mit hohem Wert nutzt.

### Front-Running und MEV

On-Chain-Listings sind öffentlich. Ein entschlossener Akteur kann versuchen, einer Transaktion zuvorzukommen (der Überbegriff dafür ist [MEV – Maximal Extractable Value](https://ethereum.org/en/developers/docs/mev/)). Große Marktplätze haben Schutzmaßnahmen, aber das ist eine Risikokategorie, die im traditionellen Ablauf so nicht existierte.

### Risiko gestohlener Vermögenswerte

Wenn das NFT, das Sie kaufen, gestohlen wurde, könnten Sie am Ende eine Domain besitzen, die von Plattformen und Marktplätzen in Abstimmung miteinander markiert (geflaggt) wird. Einige Marktplätze weigern sich, Verkäufe von markierten NFTs zu akzeptieren. Dies ist ein reales und fortlaufendes Aufgabenfeld im gesamten NFT-Ökosystem.

### KYC / Sanktionen

Je nach Marktplatz und Gerichtsbarkeit können Verkäufer und Käufer mit KYC-Anforderungen (Know Your Customer) konfrontiert werden. Das ist nicht neu – Escrow-Dienste hatten diese ebenfalls –, aber die Mechanik ist eine andere.

### Steuerliche Ereignisse

Ein in Krypto bezahlter Verkauf stellt in einigen Gerichtsbarkeiten ein anderes steuerliches Ereignis dar als ein in Fiatwährung bezahlter Verkauf. Lesen Sie unseren Beitrag über [Steuer- und Buchhaltungsfragen für tokenisierte Domains](/en/blog/tax-and-accounting-questions-for-tokenized-domains/), um eine Liste von Fragen für Ihren Steuerberater zusammenzustellen.

---

## Was das für Käufer bedeutet

- **Geschwindigkeit.** Verkäufe werden in Minuten abgewickelt, nicht in Tagen.
- **Niedrigere Gebühren.** Kein Escrow-Anteil. Die Kosten für den Marktplatz und Gas sind in der Regel viel niedriger als 3–6 %.
- **Direktes Eigentum.** Das NFT ist sofort in Ihrem Wallet, ohne Wartezeit.
- **Überprüfbarkeit.** Sie können die On-Chain-Historie vor dem Kauf einsehen – wann die Domain gemintet wurde, frühere Transfers, frühere Listings.

Sie tauschen den Komfort eines vertrauten Escrow-Workflows gegen den ungewohnten Komfort kryptographischer Atomizität. Für die meisten an NFTs gewöhnten Käufer ist dies ein klares Upgrade. Für Neueinsteiger lohnt es sich, zuerst eine kleine Probe-Transaktion durchzuführen.

---

## Was das für Verkäufer bedeutet

- **Gleiche Upgrades:** schneller, günstiger, transparenter.
- **Mehr Verkaufsorte.** Ihr Listing kann auf mehreren NFT-Marktplätzen gleichzeitig erscheinen.
- **Anderes Publikum.** Käufer auf NFT-Marktplätzen verhalten sich anders als traditionelle Domain-Käufer. Die Preisdynamik kann sich je nach Domain in beide Richtungen verschieben.
- **Kein Risiko abspringender Käufer ("Buyer Flake").** Entweder die Transaktion wird abgeschlossen oder nicht. Kein "Der Käufer hat das Escrow bezahlt und ist dann verschwunden" mehr.

Die Kehrseite: Sie verzichten auf die (manchmal beträchtliche) Marketing-Reichweite der spezialisierten Broker der traditionellen Domain-Branche. Für Premium-Domains sind hybride Strategien üblich – die Listung sowohl als tokenisiertes NFT als auch über traditionelle Kanäle.

---

## Hybride Listings

Nichts an einer tokenisierten Domain hindert Sie daran, sie auch auf die altmodische Weise anzubieten. Viele Eigentümer listen:

- Auf dem plattformeigenen Marktplatz.
- Auf allgemeinen NFT-Marktplätzen (OpenSea, Blur).
- Auf traditionellen Domain-Marktplätzen (Sedo, Afternic), mit der Einschränkung, dass der Käufer die Domain möglicherweise "de-tokenisieren" möchte oder die tokenisierte Form akzeptieren muss.

Das ist mehr Arbeit, erweitert aber bei Top-Tier-Domains den Käuferpool erheblich.

---

## Wohin sich dies unserer Meinung nach entwickelt

Sobald sich Käufer und Verkäufer an die atomare Abwicklung gewöhnt haben, fühlt sich der traditionelle Escrow-Ablauf an wie das Ausstellen eines Schecks – praktikabel, aber archaisch. Die Puzzleteile, die noch benötigt werden, damit Marktplätze für tokenisierte Domains einen größeren Teil des Volumens übernehmen können, sind:

- Bessere domain-spezifische Suche und Filterung auf NFT-Marktplätzen.
- Bessere Bewertungstools für heterogene Vermögenswerte.
- Breitere TLD-Abdeckung über Tokenisierungsplattformen hinweg.
- Stabile, gut auditierte Contracts, die bisher keine aufsehenerregenden Vorfälle verursacht haben.

All dies ist noch in Arbeit (Work-in-Progress) und verbessert sich von Jahr zu Jahr sichtbar.

---

## Freundlicher Haftungsausschluss (Bitte lesen!)

> Wir sind keine Anwälte, Steuerberater, Finanzberater oder Ärzte – und **nichts in diesem Artikel stellt eine rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder sonstige professionelle Beratung dar.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden und als Service für unsere Kunden. Die Informationen hier können veraltet, geografie-spezifisch oder einfach nur falsch sein – auch wir machen Fehler.
>
> Für wichtige Entscheidungen **konsultieren Sie bitte einen echten Experten (im Ernst!)**. Oder wenn das nicht Ihr Ding ist, fragen Sie einen Freund, fragen Sie Twitter, fragen Sie Reddit, fragen Sie eine KI oder fragen Sie einen Hellseher. Kurz gesagt: **DOYR – Do Your Own Research (Recherchieren Sie selbst)**. Lassen Sie uns lernen und Spaß dabei haben.

---

## Zusammenfassung

- Marktplätze für tokenisierte Domains komprimieren den traditionellen Ablauf von Listung → Verhandlung → Escrow → Transfer → Abwicklung in eine einzige On-Chain-Transaktion.
- Das Element, das am offensichtlichsten verschwindet, ist das **Escrow**: Kryptographische Atomizität macht einen drittplatzierten Treuhänder überflüssig.
- Auth-Codes, Registrar-Sperren und Banküberweisungen entfallen ebenfalls für die tokenisierte Hälfte der Transaktion.
- An ihre Stelle treten neue Risiken: Wallet-Sicherheit, Smart-Contract-Bugs, MEV, Koordination bei gestohlenen Assets. Sie verlagern sich an andere Orte und verschwinden nicht völlig.
- Nettoeffekt: schnellere, günstigere und transparentere Verkäufe mit einer anderen (und verbesserungswürdigen) User Experience (UX). Hybride Listings bleiben bei Premium-Domains üblich.

Wenn Sie den Verkauf einer tokenisierten Domain tatsächlich einmal ausprobieren möchten, besuchen Sie [namefi.io](https://namefi.io). Für einen umfassenderen Überblick lesen Sie unseren Artikel über [Anwendungsfälle für tokenisierte Domains im Jahr 2026](/en/blog/tokenized-domain-use-cases-2026/).