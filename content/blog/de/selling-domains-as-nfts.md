---
title: "Domains als NFTs verkaufen: Onchain-Liquidität"
date: '2026-06-24'
language: de
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 35
format: guide
description: "Wie der Verkauf einer Domain als NFT funktioniert: Listing-Mechanik, Seaport und OpenSea, käuferbeschränkte private Verkäufe, Tantiemen sowie Gas- und Betrugsfallen."
ogImage: ../../assets/selling-domains-as-nfts-og.jpg
keywords: ['Domain als NFT verkaufen', 'Domain-NFT', 'Verkauf tokenisierter Domains', 'Onchain-Domain-Liquidität', 'Domain-NFT auf OpenSea listen', 'Seaport-Protokoll', 'käuferbeschränktes Listing', 'privates NFT-Listing', 'NFT-Tantiemen Domains', 'ERC-721-Domain', 'atomarer Domain-Transfer', 'tokenisierte Domain verkaufen', 'Gasgebühren NFT-Verkauf', 'NFT-Domain-Betrug', 'Onchain-Domain-Flipping']
---

Ein klassischer Domain-Verkauf hat ein eingebautes Vertrauensproblem. Der Verkäufer möchte den Transfer nicht anstoßen, bevor das Geld eingetroffen ist; der Käufer möchte keine Mittel überweisen, bevor der Name in seinem Konto auftaucht. Die gesamte [Treuhand](/de/glossary/escrow/)-Branche existiert, um zwischen diesen beiden Reflexen zu stehen. Eine Domain als [NFT](/de/glossary/nft/) zu verkaufen ordnet diese Pattsituation neu. Wenn das Eigentum an einer echten ICANN-Domain zugleich ein [On-Chain](/de/glossary/on-chain/)-Token ist, wird der Name zu etwas, das du listen, bepreisen und innerhalb derselben Transaktion übergeben kannst, die auch das Geld bewegt — kein Mittelsmann, der den Vermögenswert in den dunklen Stunden zwischen Zahlung und Transfer hält.

In diesem Leitfaden geht es um genau diese Liquiditätsschicht: was tatsächlich passiert, wenn du ein [Domain](/de/glossary/domain-trading/)-NFT listest, wie die Marktplatz-Mechanik funktioniert, wann ein käuferbeschränktes privates Listing statt eines offenen sinnvoll ist, wie sich Tantiemen verhalten und welche Gas- und Betrugsfallen Onchain-Verkäufe still und leise auffressen. Es ist ein Speichenartikel der umfassenderen [Domain-Flipping](/de/blog/domain-flipping/)-Serie und setzt voraus, dass du bereits weißt, was ein tokenisierter Name ist — falls nicht, beginne mit [Was sind tokenisierte Domains](/de/blog/what-are-tokenized-domains/).

## Was du eigentlich verkaufst

Zuerst ein Präzisionspunkt, von dem dieser ganze Beitrag abhängt. Eine tokenisierte Domain ist nicht dasselbe Tier wie ein [ENS](/de/glossary/ens/)-Name oder ein Unstoppable-Name, und sie zu verkaufen ist nicht derselbe Akt.

- Ein **[ENS](https://ens.domains)-`.eth`-Name** lebt vollständig auf Ethereum. Er wird über ENS-fähige [Wallets](/de/glossary/wallet/) und Apps aufgelöst, nicht in einer schlichten Browser-Adressleiste, und ENS bepreist die Registrierung nach Länge — laut der ENS-Dokumentation kostet dich [ein `.eth` mit `5+` Buchstaben `5 USD` pro Jahr](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), bei [`4` Buchstaben `160 USD` pro Jahr](https://docs.ens.domains/registry/eth#:~:text=A%20%604%60%20letter%20%60160%20USD%60%20per%20year) und bei [`3` Buchstaben `640 USD` pro Jahr](https://docs.ens.domains/registry/eth#:~:text=and%20a%20%603%60%20letter%20%60640%20USD%60%20per%20year).
- Ein **Unstoppable-Name** (`.crypto`, `.x` und Verwandte) ist ein [Web3](/de/glossary/web3/)-Name, der außerhalb der ICANN-Root geprägt wird.
- Eine **tokenisierte ICANN-Domain** ist die, um die es dieser Serie geht: eine echte `example.com`, die in jedem Browser auflöst, *plus* ein Token in deiner Wallet, das die Kontrolle darüber repräsentiert. Wir vergleichen die drei direkt gegenüber in [tokenisierte Domain vs. Web3-Domain](/de/blog/tokenized-domain-vs-web3-domain/).

Die Marktplatz-Mechanik weiter unten gilt für jede davon, denn sie sind alle NFTs. Aber der *Wert*, den du überträgst, ist völlig unterschiedlich. Wenn du einen ENS-Namen verkaufst, erhält der Käufer eine reine Onchain-Identität. Wenn du eine tokenisierte `.com` verkaufst, erhält der Käufer einen universell auflösbaren Geschäftswert, dessen DNS während der Übergabe weiterläuft. Lass dich von einem glatten Listing-Ablauf nicht dazu verleiten, das eine wie das andere zu bepreisen.

## Wie ein Domain-NFT liquide wird

Fast jedes Domain-NFT, das du handeln wirst, ist ein [ERC-721](/de/glossary/erc-721/)-Token — der Standard, den Wikipedia beschreibt als [ein technisches Rahmenwerk, das eine Reihe von Regeln und Schnittstellen für das Erstellen und Verwalten einzigartiger, nicht-fungibler Token (NFTs) auf der Ethereum-Blockchain definiert](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique). Ein Standard-Token zu sein ist genau das, was es liquide macht: jeder [Marktplatz](/de/glossary/marketplace/), jede Wallet oder jeder [Smart Contract](/de/glossary/smart-contract/), der ERC-721 spricht, kann es listen, treuhänderisch halten oder beleihen, ohne dass dein Name ein Sonderfall ist.

Diese Standardisierung ist die gesamte Liquiditätsgeschichte. Eine klassische Domain verkauft sich nur dort, wo ein Registrar oder ein Domain-Marktplatz sie verkaufen lässt. Ein Domain-NFT verkauft sich überall dort, wo ERC-721 verstanden wird — was heute der Großteil der NFT-Ökonomie ist. Das ist der strukturelle Grund, warum Tokenisierung den Handel verändert, ausführlicher behandelt in [wie Tokenisierung das Domain-Flipping verändert](/de/blog/how-tokenized-marketplaces-replace-escrow/).

## Listing auf einem Marktplatz: Seaport und OpenSea

![Redaktionelle Illustration einer Balkenwaage, die auf der einen Seite ein Domain-NFT-Token und auf der anderen einen Stapel Münzen zeigt, verbunden durch ein ineinandergreifendes Kettenglied in der Mitte unter einer Marktplatz-Markise](../../assets/selling-domains-as-nfts-01-atomic-swap.jpg)

Die dominierenden Schienen für NFT-Verkäufe sind [Seaport](https://docs.opensea.io/docs/seaport) und [OpenSea](https://opensea.io), und es hilft zu verstehen, dass es sich um zwei verschiedene Schichten handelt. Seaport ist das Protokoll; OpenSea ist eine Storefront obendrauf. Laut OpenSeas eigener Dokumentation ist [Seaport ein Marktplatz-Protokoll zum sicheren und effizienten Kaufen und Verkaufen von NFTs auf der Blockchain](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs), und [Seaport treibt die OpenSea-Website an](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20powers%20the%20OpenSea%20website) — jede Order auf OpenSea läuft darüber.

Das mentale Modell, das für einen Verkäufer zählt, ist Seaports zweiseitige Struktur: ein **Angebot** (offer) und eine **Gegenleistung** (consideration). Das Angebot ist das, was du einsetzt (dein Domain-NFT). Die Gegenleistung ist das, was du im Gegenzug verlangst (ein Preis in ETH oder einer Stablecoin, plus etwaige Gebühren und Tantiemen, die an andere Parteien geleitet werden). Du signierst diese Order einmal. Nichts bewegt sich, bis ein Käufer sie erfüllt, und wenn er das tut, wickelt das Protokoll beide Seiten in einem einzigen atomaren Schritt ab — dein Token und seine Zahlung tauschen in derselben Transaktion, oder keines von beiden tut es. Diese Atomarität ist die Eigenschaft des [atomaren Transfers](/de/glossary/atomic-transfer/), die die Treuhand ersetzt: es gibt kein Zeitfenster, in dem eine Seite bezahlt und die andere nicht geliefert hat.

In der Praxis ist das Listing ein zweistufiges Ritual, das die meisten Verkäufer einmal durchführen und dann vergessen:

1. **Freigabe (Approval).** Wenn du zum ersten Mal aus einer Wallet listest, signierst du eine Freigabe, die dem Contract des Marktplatzes erlaubt, dieses Token in deinem Namen zu bewegen, sobald ein Verkauf ausgelöst wird. Das kostet Gas; spätere Listings anderer Token derselben Collection in der Regel nicht.
2. **Die Listing-Order.** Du signierst die eigentliche Order — Preis, Währung, Laufzeit. Auf den meisten Marktplätzen ist diese Signatur **gaslos**: du signierst eine Nachricht, sendest keine Transaktion, sodass das Erstellen oder Stornieren eines Festpreis-Listings in der Regel nichts kostet, bis jemand kauft.

Eine praktische Konsequenz: in der Regel zahlt der Käufer, nicht du, das Gas zur Ausführung eines Festpreis-Kaufs. OpenSeas Verkäufer-Leitfaden bringt es klar auf den Punkt — [Käufer zahlen Gasgebühren beim Kauf eines Festpreis-Artikels](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item), während [Verkäufer Gasgebühren zahlen, wenn sie Angebote annehmen](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Sellers%20pay%20gas%20fees%20when%20accepting%20offers). Wenn du also listest und wartest, trägt der Käufer das Gas; wenn du aktiv ein eingehendes Gebot annimmst, tust du es. Diese Asymmetrie sollte beeinflussen, wie du verkaufst, wenn das Netzwerk überlastet ist.

## Käuferbeschränkte private Listings

![Redaktionelle Illustration eines Domain-NFT-Medaillons, das in einer Glasvitrine eingeschlossen und für eine kleine Menschenmenge sichtbar ist, wobei nur eine bestimmte Person den passenden goldenen Schlüssel zum Öffnen besitzt](../../assets/selling-domains-as-nfts-02-private-listing.jpg)

Ein offenes Listing ist in Ordnung für einen Massenware-Namen, den du an jeden verkaufen würdest. Aber viele echte Domain-Deals werden zuerst außerhalb des Marktes verhandelt — ein Preis, der per E-Mail oder Anruf vereinbart wird — und dann brauchst du nur einen sauberen, vertrauenslosen Weg, um mit *genau diesem bestimmten Käufer* abzuwickeln. Einen solchen Namen offen zu listen ist ein Fehler: ein Dritter, der den Marktplatz beobachtet, könnte ihn zu deinem vereinbarten Preis wegschnappen, bevor dein Käufer klickt.

Die Lösung ist ein **käuferbeschränktes (privates) Listing**, und Seaport unterstützt das nativ, weil die Gegenleistung einen erforderlichen Empfänger benennen kann. Auf OpenSea stellst du das im Listing-Ablauf ein: laut ihrem Leitfaden kannst du [den Artikel für einen bestimmten Käufer reservieren. Klicke dazu auf „Reservieren“ und gib seine Wallet-Adresse ein](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=reserve%20the%20item%20for%20a%20specific%20buyer.%20To%20do%20so%2C%20click). Nur diese Wallet kann die Order erfüllen. Alle anderen sehen das Listing, können es aber nicht kaufen.

Das ist das Onchain-Äquivalent einer vermittelten, käuferbeschränkten Abwicklung, und es ist das Muster, auf das sich Namefi bei angebotsgetriebenen Verkäufen stützt: verhandle die Zahl mit einem Menschen, dann wickle sie als privates Listing ab, sodass der vereinbarte Käufer — und nur dieser Käufer — den atomaren Tausch abschließen kann. Du bekommst die Privatsphäre des außerbörslichen Deals *und* die treuhandfreie Endgültigkeit des Onchain-Deals. Bekomme die Zieladresse der Wallet allerdings richtig: ein einziges falsches Zeichen und du hast deinen fünfstelligen Namen für eine Adresse reserviert, die niemand kontrolliert.

## Tantiemen: überleben sie den Verkauf?

Manche Domain-NFTs tragen eine Tantieme — einen Prozentsatz, der bei jedem Weiterverkauf an den ursprünglichen Aussteller oder einen Schöpfer geleitet wird. Der Standard hier ist [EIP-2981](https://eips.ethereum.org/EIPS/eip-2981), der existiert, in seinen eigenen Worten, damit Contracts [einen Tantiemenbetrag signalisieren können, der jedes Mal an den NFT-Schöpfer oder Rechteinhaber gezahlt wird, wenn das NFT verkauft oder weiterverkauft wird](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold).

Zwei Dinge sollte jeder Flipper verinnerlichen. Erstens: EIP-2981 *signalisiert* nur eine Tantieme; es *erzwingt* keine. Ob die Tantieme tatsächlich gezahlt wird, hängt von der Richtlinie des Marktplatzes ab, und die Branche hat 2022–2023 die meisten Tantiemen optional gemacht. Modelliere deine Erträge nicht unter der Annahme, dass eine Tantieme beim nächsten Sprung honoriert wird — sie wird es vielleicht nicht. Zweitens: Tantiemen schneiden für einen Flipper in beide Richtungen: eine Tantieme, die du beim Ausstieg zahlst, ist ein echter Kostenfaktor für deine Marge, und jede Plattformgebühr kommt obendrauf. OpenSeas Leitfaden merkt an, dass die Storefront [in der Regel eine Gebühr von 1 % beim Verkäufer erhebt](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=OpenSea%20typically%20charges%20a%201%25%20fee%20to%20the%20seller), und Creator-Einnahmen, wo sie anfallen, gehen ebenfalls von deinem Erlös ab. Lies die Gebührenaufschlüsselung, die der Marktplatz anzeigt, bevor du bestätigst — das sind Schätzungen *deines* Nettoerlöses, und sie sind die Zahl, die entscheidet, ob sich der Flip gelohnt hat.

## Gas- und Betrugsfallen, die es zu vermeiden gilt

![Redaktionelle Illustration einer Wallet, die unter einer Glaskuppel mit einem Schild geschützt ist, umgeben von warnmarkierten Gefahren: eine Zapfsäule, die eine Münze tropft, ein Phishing-Haken, der ein Signatur-Freigabedokument aufspießt, und ein Klemmbrett, das eine ausgetauschte Adresse zeigt](../../assets/selling-domains-as-nfts-03-gas-scam.jpg)

Onchain-Liquidität ist real, aber sie kommt mit einer neuen Fehleroberfläche. Die beiden großen sind Gas und Betrug.

**Gas.** Ethereum berechnet Gebühren für Rechenleistung. Laut ethereum.org [bezieht sich Gas auf die Einheit, die den Umfang des rechnerischen Aufwands misst, der zur Ausführung bestimmter Operationen im Ethereum-Netzwerk erforderlich ist](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort), und es wird in ETH bezahlt. Für einen vierstelligen Namen an einem überlasteten Tag kann das Gas für Freigabe plus Abwicklung ein erheblicher Anteil deiner Marge sein — und bei einem geringwertigen Namen kann es den Verkauf gänzlich übersteigen. Zwei Verteidigungen: führe deine Freigabe durch, wenn das Netzwerk ruhig ist, und erwäge das Listing auf einer Chain mit niedrigeren Gebühren. Das ist ein Grund, warum tokenisierte Domains auf Base, nicht nur auf dem Ethereum-Mainnet, für Flipper wichtig sind, die mit kleineren Namen arbeiten.

**Betrug.** Die Onchain-Welt hat ihren eigenen Trickbetrugs-Katalog, und Domain-NFTs sind voll im Visier:

- **Wallet-Adressen-Austausch.** Schadsoftware und Zwischenablage-Hijacker ersetzen still und leise eine eingefügte Adresse. Verifiziere immer die ersten und letzten Zeichen jeder Käufer- oder Empfängeradresse gegen eine zweite Quelle, bevor du signierst.
- **Bösartige „Freigabe“-Signaturen.** Ein gefälschter Marktplatz oder eine Phishing-Site kann dich bitten, eine Freigabe zu signieren, die einem Contract umfassende Macht über deine Token gewährt. Wenn du nicht genau verstehst, was eine Signatur autorisiert, signiere sie nicht. Behandle jede unerwartete Freigabeanfrage als feindlich.
- **Gefälschte Listings.** Betrüger prägen ähnlich aussehende Token und listen sie, als wären sie die echte tokenisierte Domain. Käufer sollten die Contract-Adresse gegen die vom Aussteller veröffentlichte abgleichen; Verkäufer sollten sicherstellen, dass ihr echtes Listing dasjenige ist, das Käufer finden. Das ist teilweise der Grund, warum Verwahrung und Herkunft wichtig sind — siehe [eine tokenisierte Domain nach Wallet-Verlust wiederherstellen](/de/blog/recovering-a-tokenized-domain-after-wallet-loss/) und das Argument für ein [Multi-Sig](/de/glossary/multi-sig/)-Setup in [verbessern Multi-Sig-Wallets die Sicherheit wirklich](/de/blog/do-multisig-wallets-actually-improve-security/).
- **Gefälschter „Support“.** Niemand Seriöses wird dich zuerst per DM anschreiben und nach einer Seed-Phrase oder einer „Validierungs“-Signatur fragen. Die Seed-Phrase verlässt niemals deine Kontrolle. Punkt.

Der rote Faden: Onchain-Abwicklung nimmt das Gegenparteirisiko aus dem *Handel* und ersetzt es durch operatives Risiko in *deiner Wallet*. Der Treuhänder ist weg, und ebenso der Mensch, der früher einen vertippten Transfer abgefangen hat. Diese Verantwortung liegt jetzt bei dir.

## Wo das einen Flipper hinterlässt

Eine Domain als NFT zu verkaufen verwandelt einen Namen in etwas wahrhaft Liquides: ein ERC-721-Token, das du gaslos listen, atomar abwickeln, für einen bestimmten Käufer reservieren und über ein tiefes Marktplatz-Ökosystem bewegen kannst statt über den Aftermarket eines einzelnen Registrars. Die Treuhand-Pattsituation, die klassische Verkäufe prägt, löst sich weitgehend auf. Was sie im Gegenzug verlangt, ist Onchain-Kompetenz — zu wissen, was du signierst, was Gas kosten wird und welche Gegenparteien echt sind.

Für das größere Bild, wie tokenisierte Namen die Ökonomie des Handels verändern, ist der Hub bei [Domain-Flipping](/de/blog/domain-flipping/) der Ausgangspunkt, und [warum Domains tokenisieren](/de/blog/why-tokenize-domains/) macht von vornherein das Argument für das Hinzufügen der Onchain-Schicht. Wenn du einen Verkauf von Anfang bis Ende an einem echten, im Browser auflösbaren Namen ausprobieren willst, ist [Namefi](https://namefi.io) genau dafür gebaut — eine tokenisierte `.com`, die du onchain listen und abwickeln kannst, während das DNS während der Übergabe weiter auflöst.

## Freundlicher Haftungsausschluss (Lies mich!)

> Wir sind keine Anwälte, Buchhalter, Finanzberater oder Ärzte, und **nichts in diesem Artikel ist rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder irgendeine andere Art professioneller Beratung.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden und als Annehmlichkeit für unsere Kunden. Informationen hier können veraltet, geografisch spezifisch oder schlicht falsch sein. Auch wir machen Fehler.
>
> Für jede wichtige Entscheidung **konsultiere bitte einen echten Profi (im Ernst!)**. Oder falls das nicht dein Ding ist, frag einen Freund, frag Twitter, frag Reddit, frag eine KI oder frag einen Wahrsager. Kurz gesagt: **DOYR – Do Your Own Research (mach deine eigene Recherche)**. Lass uns lernen und Spaß haben.

## Quellen und weiterführende Lektüre

- OpenSea Docs — [Seaport (Marktplatz-Protokoll; treibt OpenSea an; Modell aus Angebot/Gegenleistung)](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- OpenSea — [How to sell NFTs (für einen bestimmten Käufer reservieren; wer Gas zahlt; 1 % Verkäufergebühr)](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item)
- Wikipedia — [ERC-721 (Standard für nicht-fungible Token auf Ethereum)](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique)
- Ethereum Improvement Proposals — [EIP-2981 (NFT Royalty Standard)](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold)
- ENS Docs — [.eth-Registrierungspreise nach Länge ($5 / $160 / $640 pro Jahr)](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ethereum.org — [Gas und Gebühren (Definition von Gas)](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort)
