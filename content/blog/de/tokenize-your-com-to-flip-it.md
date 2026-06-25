---
title: "Tokenisiere deine .com, um sie zu flippen: ein Namefi-Walkthrough"
date: '2026-06-24'
language: de
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['namefiteam']
draft: false
cluster: domain-tokenization
series: domain-flipping-skills
seriesOrder: 39
format: guide
description: "Ein Namefi-Walkthrough: bringe eine .com on-chain, halte das DNS am Auflösen und flippe sie als NFT mit atomarer Abwicklung statt einer Treuhand-Pattsituation."
ogImage: ../../assets/tokenize-your-com-to-flip-it-og.jpg
keywords: ['eine .com tokenisieren, um sie zu flippen', 'deine com tokenisieren', 'tokenisierte Domains flippen', 'eine Domain als NFT verkaufen', 'tokenisiertes .com-Flipping', 'On-Chain-Domain-Flipping', 'atomare Domain-Abwicklung', 'Marktplatz für tokenisierte Domains', 'DNS-Kontinuität tokenisierte Domain', 'wie man eine Domain zum Verkauf tokenisiert', 'mit Namefi tokenisieren und verkaufen', 'im Wallet gehaltene .com', 'ERC-721-Domain', 'Liquidität tokenisierter Domains', 'eine com-Domain on-chain flippen']
---

Die meisten Flips einer `.com` enden auf die gleiche nervöse Weise: Der Käufer will nicht zahlen, bevor der Name übertragen wird, der Verkäufer will den Namen nicht übertragen, bevor er bezahlt wurde, und ein [Treuhand](/de/glossary/escrow/)-Agent steht in der Mitte und hält das Geld, während eine Registrar-Übertragung tagelang abgewickelt wird. Diese Pattsituation ist die Reibungssteuer auf jeden hochwertigen Verkauf. Die `.com` zuerst zu tokenisieren verändert die ganze Form des Geschäfts: Der Name wird zu einem Token, das du in einem [Wallet](/de/glossary/wallet/) hältst, und der Verkauf wird zu einem einzigen On-Chain-Tausch statt zu einer mehrtägigen Übergabe zwischen mehreren Parteien.

Dies ist ein praktischer Walkthrough dieses Wegs auf [Namefi](https://namefi.io) — bringe eine `.com`, die dir bereits gehört, on-chain, halte sie überall am Auflösen und liste und settle sie dann als [NFT (Non-Fungible Token)](/de/glossary/nft/). Er ist Teil des umfassenderen [Domain-Flipping](/de/blog/domain-flipping/)-Playbooks und der Säule [On-Chain-Domain-Flipping](/de/blog/onchain-domain-flipping/). Wenn du das *Warum* vor dem *Wie* willst, beginne mit [warum man Domains on-chain tokenisiert](/de/blog/why-tokenize-domains/).

## Warum man eine tokenisierte .com statt einer normalen flippt

Eine traditionelle `.com` ist real, aber du hältst sie nie wirklich selbst — du hältst ein Konto bei einem [Registrar](/de/glossary/registrar/), dessen Datenbank sagt, dass du den Namen kontrollierst. Verkaufen bedeutet eine Übertragung von Konto zu Konto oder von Registrar zu Registrar, die der Registrar vermittelt, wobei eine Treuhand die Vertrauenslücke dazwischen überbrückt.

Tokenisierung verwandelt dieses Konto in ein [Token](/de/glossary/tokenize/), das du selbst verwahrst. Der Name wird als NFT unter dem [ERC-721 (NFT-Standard)](/de/glossary/erc-721/) dargestellt, den Ethereums Spezifikation als eine [Standard-API für NFTs innerhalb von Smart Contracts](https://eips.ethereum.org/EIPS/eip-721#:~:text=standard%20API%20for%20NFTs) bezeichnet — und deren eigenes Abstract sie als eine Standardschnittstelle für [nicht-fungible Tokens, auch bekannt als deeds](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds) beschreibt. Dieses Wort, „deeds" (Besitzurkunden), ist der entscheidende Punkt: Das Token ist der Titel zum Namen, in deinem Wallet, und nicht eine Quittung für einen Eintrag, den jemand anderes führt. Für einen Flipper kauft das drei konkrete Vorteile:

- **Die Abwicklung kollabiert zu einer einzigen Transaktion.** Zahlung und Übertragung werden zusammen ausgeführt oder gar nicht, sodass keine Seite zuerst handeln muss.
- **Die Liquidität ist breiter.** Eine tokenisierte `.com` kann auf allgemeinen [Marktplätzen (z.B. OpenSea, Blur)](/de/glossary/marketplace/) neben jedem anderen ERC-721-Asset gelistet werden, nicht nur auf domain-spezifischen Aftermarkets.
- **Die Provenienz ist öffentlich.** Jede frühere Übertragung ist [on-chain](/de/glossary/on-chain/) prüfbar, sodass ein Käufer die Historie verifizieren kann, ohne dem Wort eines Marktplatzes vertrauen zu müssen.

Entscheidend ist, dass nichts davon das aufgibt, wofür ein Käufer bei einer `.com` tatsächlich bezahlt. Anders als ein Web3-nativer Name wie ein [ENS (Ethereum Name Service)](/de/glossary/ens/) `.eth` — der außerhalb der [ICANN](/de/glossary/icann/)-Root lebt und einen Resolver oder eine Bridge braucht, um in einem normalen Browser zu laden — ist eine tokenisierte `.com` immer noch eine echte [DNS](/de/glossary/dns/)-Domain, die überall auflöst, mit funktionierender E-Mail und Zertifikaten. Diese Unterscheidung ist der ganze Grund, warum es diesen Leitfaden gibt; wir arbeiten sie vollständig heraus in [was tokenisierte Domains sind](/de/blog/what-are-tokenized-domains/) und [tokenisierte Domain vs. Web3-Domain](/de/blog/tokenized-domain-vs-web3-domain/). Vermische die beiden nicht: Eine tokenisierte ICANN-`.com` und ein `.eth`-Name flippen auf denselben Schienen, verkaufen aber völlig unterschiedliche Dinge.

## Schritt 1: Bringe die .com on-chain

![Redaktionelle Illustration einer Globus-Domain-Karte, die ein Tokenisierungsportal betritt und als facettierte NFT-Medaille wieder austritt, während ein erleuchteter Globus darunter weiterleuchtet, um zu zeigen, dass das DNS weiterhin auflöst](../../assets/tokenize-your-com-to-flip-it-01-bring-onchain.jpg)

Der vollständige Bildschirm-für-Bildschirm-Prozess steht in [wie man seine .com tokenisiert](/de/blog/how-to-tokenize-your-com/); hier ist die Grundform davon für einen Flipper.

Du verbindest ein selbstverwahrtes Wallet auf [namefi.io](https://namefi.io) — dieses Wallet wird zum Eigentümer der [Tokenisierten Domain](/de/glossary/tokenized-domain/), sodass derjenige, der es hält, den Namen hält. Du fügst die `.com` hinzu, die dir bereits gehört, Namefi prüft die Berechtigung gegen die ICANN-Übertragungsregeln und den Registrar, bei dem sie sich gerade befindet, und du wählst einen Weg. Der gängige ist Transfer-in-dann-Tokenisieren: Du überträgst die Domain mit dem [Auth-Code (EPP-Code, Transfer-Code)](/de/glossary/auth-code/) von deinem aktuellen Registrar an Namefis akkreditierten Registrar-Partner und mintest dann das Token. Manche Registrar-Integrationen unterstützen einen In-Place-Weg, bei dem der Name an Ort und Stelle bleibt und die On-Chain-Schicht obendrauf hinzugefügt wird.

Zwei Timing-Hinweise, die wichtig sind, wenn du auf eine Deadline hin flippst. Erstens ist der langsame Teil die Registrar-Übertragung, nicht irgendetwas Blockchain-bezogenes — plane wegen ICANNs Ablauf zwischen Registraren mehrere Tage ein und starte keine Tokenisierung in der Woche, in der du einen Verkauf abschließen willst. Zweitens können sich kürzlich übertragene Namen in einem ICANN-Transfer-Lock-Fenster befinden und sich schlicht noch nicht bewegen lassen, also prüfe die Berechtigung, bevor du einem Käufer irgendetwas versprichst. Das Minten selbst — eine einzige Wallet-Bestätigung, die [Gas (Transaktionsgebühren)](/de/glossary/gas/) zahlt und das NFT landet — ist der *letzte* und schnellste Schritt.

Wenn es erledigt ist, hältst du zwei synchronisierte Schichten: den traditionellen DNS-/Registrar-Eintrag und ein ERC-721-Token in deinem Wallet, das das Eigentum repräsentiert. Übertrage das Token, und die Domain folgt.

## Schritt 2: Verwahre sie wie ein Asset, das du verkaufen willst

Dies ist der Schritt ohne Entsprechung im Registrar-Flipping und der, den neue On-Chain-Flipper unterschätzen: Sobald der Name ein NFT ist, bist *du* das Verwahrungssystem. Ein Name, den du monatelang halten willst, während du einen Käufer suchst, sollte nicht in einem Hot Wallet liegen, das du auch für tägliche Transaktionen nutzt.

Ein Hardware-Wallet ist die Grundlage. Für höherwertige Namen tauscht eine [Multi-Sig (Multi-Signatur)](/de/glossary/multi-sig/)-Anordnung etwas Bequemlichkeit gegen weit besseren Schutz vor einem einzelnen kompromittierten Schlüssel — ob es sich für dich lohnt, ist allerdings eine echte Frage, die wir in [verbessern Multi-Sig-Wallets die Sicherheit wirklich](/de/blog/do-multisig-wallets-actually-improve-security/) abwägen. Die Kehrseite davon, deine eigenen [verwahrten Eigentümerschaft](/de/glossary/custodial-ownership/)-Schlüssel zu halten, ist, dass ein verlorener Schlüssel einen verlorenen Namen bedeuten kann, also habe einen Wiederherstellungsplan parat, *bevor* du ihn brauchst — [eine tokenisierte Domain nach Wallet-Verlust wiederherstellen](/de/blog/recovering-a-tokenized-domain-after-wallet-loss/) behandelt, was möglich ist und was nicht. Solide Verwahrung ist auch Teil des Pitches an einen Käufer: Ein Name mit einer sauberen, prüfbaren Eigentumskette ist leichter zu verkaufen als einer, dessen Provenienz du nicht beweisen kannst.

## Schritt 3: Halte das DNS während des gesamten Verkaufs am Auflösen

![Redaktionelle Illustration einer Eigentums-NFT-Medaille, die von der Hand eines Verkäufers in die Hand eines Käufers gleitet, über einem ununterbrochen erleuchteten Schaufenster mit einem stetigen Globus, was zeigt, dass die Website online bleibt, während sich das Eigentum ändert](../../assets/tokenize-your-com-to-flip-it-02-dns-continuity.jpg)

Hier ist der Vorteil, der eine tokenisierte `.com` von einem `.eth`-Namen unterscheidet, und er ist es wert, bewusst geschützt zu werden. Die Tokenisierung ändert nicht, wie die Domain auflöst — Nameserver, A-Records, MX, [DNSSEC (Domain Name System Security Extensions)](/de/glossary/dnssec/) funktionieren alle weiterhin, verwaltet vom Namefi-Dashboard oder an deinen bestehenden DNS-Anbieter delegiert. Wir behandeln genau, was sich ändert und was nicht, unter [DNS bei tokenisierten Domains](/de/blog/dns-on-tokenized-domains/).

Für einen Flipper ist **DNS-Kontinuität der Unterschied zwischen einem sauberen Verkauf und einem Käufer, der mitten im Deal zusieht, wie eine Live-Website dunkel wird.** Eine gut gebaute tokenisierte Domain löst während der Übergabe sauber weiter auf, sodass beim Übertragen des Token-Eigentums Website, E-Mail und Zertifikate nicht aussetzen. Diese Kontinuität ist ein Verkaufsargument für sich: Ein Käufer, der sehen kann, dass der Name den ganzen Weg über auflöst, hat weit weniger Grund, den Preis wegen Übertragungsrisikos herunterzuhandeln.

## Schritt 4: Liste sie als NFT

Eine tokenisierte `.com` zu listen ist eine Marktplatz-Aktion, keine „Zu verkaufen"-Landingpage auf einer geparkten Domain. Du setzt einen festen Sofortkaufpreis oder eröffnest eine [Auktion (holländische, englische, dynamische)](/de/glossary/auction/) direkt auf einem NFT-Marktplatz, und das Listing ist selbst eine signierte Order, die jeder Käufer ausführen kann. Weil das Asset ein standardmäßiges ERC-721-Token ist, sind deine Augenpaare nicht auf Leute beschränkt, die domain-spezifische Aftermarkets frequentieren — der Name liegt an denselben Orten wie jedes andere NFT. Wir gehen die Listing-Optionen in [Domains als NFTs verkaufen](/de/blog/selling-domains-as-nfts/) durch und vergleichen, wo man listet, in [On-Chain-Domain-Marktplätze im Vergleich](/de/blog/onchain-domain-marketplaces-compared/).

Du behältst auch für einen tokenisierten Namen die Option eines traditionellen Verkaufsseiten-Funnels. Der Unterschied liegt rein im Abschluss: Der Deal wird über einen Token-Tausch abgewickelt statt über eine Treuhand-Übergabe, was uns zur Belohnung bringt.

## Schritt 5: Abwickeln ohne Treuhand-Pattsituation

![Redaktionelle Illustration eines Käufers und Verkäufers, die eine Token-Medaille und einen Münzstapel durch zwei ineinandergreifende Zahnräder austauschen, wobei die Position des vermittelnden Treuhand-Agenten zwischen ihnen sichtbar leer gelassen ist](../../assets/tokenize-your-com-to-flip-it-03-atomic-settlement.jpg)

Hier verdient sich die On-Chain-Infrastruktur ihren Lohn. Für NFTs gebaute Marktplatz-Protokolle lassen Zahlung und Übertragung atomar geschehen — zusammen oder gar nicht. OpenSeas Order-Protokoll Seaport beschreibt sich selbst als ein [Marktplatz-Protokoll zum sicheren und effizienten Kaufen und Verkaufen von NFTs](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs), und der praktische Effekt ist, dass die Zahlung des Käufers und deine Token-Übertragung in einem Abwicklungsschritt getauscht werden. Kein Drittagent hält das Asset mitten im Deal; der Vertrag erzwingt den Tausch.

Bei deiner tokenisierten `.com` *ist* die Token-Übertragung die Übergabe der Besitzurkunde, und Namefi hält die zugrunde liegende DNS-Registrierung synchron, sodass der Käufer am Ende eine echte, auflösbare Domain kontrolliert — und nicht nur ein NFT, das auf nichts zeigt. Dieser eine Mechanismus ist es, was wir meinen, wenn wir sagen, dass tokenisierte Marktplätze [die Treuhand ersetzen](/de/blog/how-tokenized-marketplaces-replace-escrow/); jener Beitrag legt die Vertrauensrechnung dar. Keine Partei hat zuerst gehandelt, kein Agent hat das Geld gehalten, und die ganze Abwicklung, die früher tagelange Treuhand dauerte, dauert jetzt eine bestätigte Transaktion.

## Ein realistischer Blick auf die Ökonomie

Tokenisierung ändert nichts an der zugrunde liegenden Mathematik des Flippings: Es ist immer noch ein Portfolio-Spiel, kein Lottoschein. Die meisten Namen, die du hältst, werden sich nicht verkaufen, und eine kleine Zahl guter Verkäufe finanziert die laufenden Kosten für den Rest. Einen Namen on-chain zu bringen verbreitert deinen Käuferpool und entfernt Abwicklungsreibung, aber es erzeugt keine Nachfrage nach einem Namen, den niemand will. Eine nüchterne [Bewertung](/de/blog/onchain-domain-flipping/) entscheidet immer noch, ob ein Flip funktioniert.

Es gibt auch einen Kostenstapel, den man ehrlich halten muss. Du zahlst gewöhnliche Registrar-Verlängerungsgebühren unabhängig von der Tokenisierung, ein paar Dollar Gas fürs Minten (Base ist günstiger als [Ethereum](/de/glossary/ethereum/) L1) und Namefis Protokollgebühr für den Tokenisierungsdienst — alles auf dem Bestätigungsbildschirm angezeigt, bevor du dich festlegst. Wenn die Spanne zwischen deinem Einstiegspreis und deinem realistischen Verkaufspreis diese Kosten nicht bequem übersteigt, fügt das Tokenisieren eines marginalen Namens nur Schritte hinzu. Tokenisiere die Namen, die das Flippen wert sind, nicht jeden Namen, den du hältst.

Ein Kontextpunkt, den man im Blick behalten sollte: Das Aufwärtspotenzial bei großartigen `.com`s ist real, aber selten. Der Rekordverkauf bleibt `Voice.com`, wo laut der `.nl`-Registry SIDN der [Blockchain-Anbieter Block.one 30 Millionen US-Dollar bezahlte](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=Block.one%20paid) für den Namen — immer noch, merkt SIDN an, [die höchste jemals öffentlich bekannt gegebene Summe, die für einen Domainnamen bezahlt wurde](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=the%20highest%20publicly%20disclosed%20sum). Das ist ein Ausreißer, der genau deshalb in die Schlagzeilen überlebt, weil er selten ist, kein Geschäftsplan.

## Wo Namefi hineinpasst

Die saubere Version dieses Flips — im Wallet gehaltener Titel, atomare Abwicklung, keine Treuhand-Pattsituation und ein Name, der den ganzen Weg über weiter auflöst — ist genau der Workflow, den [Namefi](https://namefi.io) für *echte* ICANN-Domains zu liefern gebaut ist. Tokenisiertes Eigentum macht die Kontrolle über eine `.com` prüfbar und übertragbar wie ein NFT, während die DNS-Kontinuität die universelle Auflösbarkeit bewahrt, für die Käufer tatsächlich bezahlen. Um einen Namen, der dir bereits gehört, in dieses Modell zu bringen, gibt es die Schritt-für-Schritt-Anleitung [wie man seine .com tokenisiert](/de/blog/how-to-tokenize-your-com/); um zuerst Anbieter abzuwägen, siehe [eine Domain-Tokenisierungsplattform wählen](/de/blog/choosing-a-domain-tokenization-platform/).

## Freundlicher Haftungsausschluss (Lies mich!)

> Wir sind keine Anwälte, Buchhalter, Finanzberater oder Ärzte, und **nichts in diesem Artikel ist eine rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder irgendeine andere Art professioneller Beratung.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden, und als Annehmlichkeit für unsere Kunden. Informationen hier können veraltet, geografisch spezifisch oder schlicht falsch sein. Auch wir machen Fehler.

> Für jede wichtige Entscheidung **konsultiere bitte einen echten Profi (im Ernst!)**. Oder wenn das nicht dein Ding ist, frage einen Freund, frage Twitter, frage Reddit, frage eine KI oder frage einen Wahrsager. Kurz gesagt: **DOYR – Do Your Own Research (Recherchiere selbst)**. Lass uns lernen und Spaß haben.

## Quellen und weiterführende Literatur

- Ethereum Improvement Proposals — [ERC-721 Non-Fungible Token Standard („standard API for NFTs"; NFTs „also known as deeds")](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- ProjectOpenSea — [Seaport (marketplace protocol for safely and efficiently buying and selling NFTs)](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- SIDN — [Voice.com sold for USD 30 million (Block.one, 2019; highest publicly disclosed domain sale)](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=Block.one%20paid)
