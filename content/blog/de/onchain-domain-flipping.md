---
title: "Onchain-Domain-Flipping: Handel mit ENS und tokenisierten Domains"
date: '2026-06-24'
language: de
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 32
format: guide
description: "Wie Onchain-Domain-Flipping funktioniert — der Handel mit ENS und tokenisierten Domains als wallet-gehaltene, NFT-liquide Assets und worin es sich vom Registrar-Flipping unterscheidet."
ogImage: ../../assets/onchain-domain-flipping-og.jpg
keywords: ['Onchain-Domain-Flipping', 'ENS-Domains flippen', 'Flipping tokenisierter Domains', 'Handel mit tokenisierten Domains', 'Domain-NFT-Flipping', 'Web3-Domains flippen', 'Investieren in ENS-Domains', 'NFT-Domain-Marktplatz', 'Domains als NFTs verkaufen', 'Onchain-Domain-Handel', 'ERC-721-Domains', 'wallet-gehaltene Domains', 'atomare Domain-Abwicklung', 'Liquidität tokenisierter Domains', 'Web3-Domain-Flipping']
relatedArticles:
  - /de/blog/tokenize-your-com-to-flip-it/
  - /de/blog/how-tokenization-changes-domain-flipping/
  - /de/blog/selling-domains-as-nfts/
  - /de/blog/onchain-domain-marketplaces-compared/
  - /de/blog/ens-vs-dns-domain-flipping/
relatedTopics:
  - /de/topics/domain-investing/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-flipping-skills/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/tld/
  - /de/glossary/icann/
  - /de/glossary/dns/
  - /de/glossary/web3/
---

Domain-Flipping hat eine vertraute Form: einen Namen günstig kaufen, einen Käufer finden, der ihn braucht, und teuer verkaufen. Die klassische Variante dieses Geschäfts läuft über [Registrars](/de/glossary/registrar/), Aftermarket-Marktplätze und einen Treuhänder, der das Geld hält, während der Transfer abgewickelt wird. Onchain-Domain-Flipping ist derselbe Günstig-kaufen-teuer-verkaufen-Instinkt, verlagert auf eine [Blockchain](/de/glossary/blockchain/), bei der der Name selbst ein Token ist, den du in einer [Wallet](/de/glossary/wallet/) hältst und wie jedes andere [NFT](/de/glossary/nft/) handeln kannst.

Diese eine Änderung — Name als Token — schreibt fast jeden Schritt des Geschäfts neu. Verwahrung, Listung und Abwicklung sind keine Operationen mehr auf Kontoebene bei einem Registrar, sondern werden zu Onchain-Transaktionen, die du selbst kontrollierst. Dieser Leitfaden erklärt, was Onchain-Domain-Flipping tatsächlich ist, zieht die wichtige Trennlinie zwischen den beiden sehr unterschiedlichen Arten von „Onchain-Namen", die du flippen kannst, und durchläuft den gesamten Bogen des Geschäfts: erwerben, verwahren, listen, abwickeln. Es ist die Onchain-Säule des breiteren [Domain-Flipping](/de/blog/domain-flipping/)-Spielbuchs.

## Was „Onchain-Domain-Flipping" bedeutet

Bei einem normalen Flip liegt das Eigentum in der Datenbank eines Registrars. Du loggst dich in ein Konto ein, die Aufzeichnungen des Registrars besagen, dass du den Namen kontrollierst, und ihn zu einem Käufer zu bewegen bedeutet einen Konto-zu-Konto- oder Registrar-zu-Registrar-[Transfer](/de/glossary/atomic-transfer/), den der Registrar vermittelt. Das Asset ist real, aber du hältst es nie selbst — du hältst ein Konto, das darauf verweist.

Onchain-Flipping ersetzt dieses Konto durch einen [Token](/de/glossary/tokenize/). Der Name wird als NFT nach dem [ERC-721](/de/glossary/erc-721/)-Standard dargestellt, den die Ethereum-Spezifikation als [Standard-API für NFTs innerhalb von Smart Contracts](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs) beschreibt — und dessen eigene Zusammenfassung ihn eine Standardschnittstelle für [nicht-fungible Token, auch bekannt als Urkunden („deeds")](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds) nennt. Dieses Wort, „deeds" (Urkunden), ist die ganze Idee: Der Token ist der Eigentumstitel am Namen, der in deiner Wallet liegt, und keine Quittung für einen Eintrag, den jemand anderes führt. Wer den Token hält, kontrolliert den Namen, und die Kontrolle zu übertragen ist ein [Smart-Contract](/de/glossary/smart-contract/)-Aufruf statt eines Support-Tickets.

Diese Eigenschaft ist der Grund, warum Onchain-Namen wie eine liquide Anlageklasse gehandelt werden. Sie werden auf denselben [NFT-Marktplätzen](/de/glossary/marketplace/) wie Kunst und Sammlerstücke gelistet, werden in Minuten abgewickelt und tragen eine öffentliche, prüfbare Eigentumshistorie. Der Flip selbst sieht weniger wie ein Registrar-Transfer aus und mehr wie [Domain-Handel](/de/glossary/domain-trading/) auf Schienen, die für digitale Assets gebaut wurden.

## Zwei Arten von Onchain-Namen — verwechsle sie nicht

![Redaktionelle Illustration von zwei verschiedenen Onchain-Namens-Assets nebeneinander — ein Wallet-Identitäts-Chip mit einem Token gegenüber einem Globus und einer Urkunden-Zertifikat, umringt von NFTs](../../assets/onchain-domain-flipping-01-two-kinds.jpg)

Das mit Abstand Wichtigste, was du richtig verstehen musst, bevor du handelst, ist, dass „Onchain-Domain" zwei wirklich unterschiedliche Assets umfasst, die sich für einen Flipper unterschiedlich verhalten.

Das erste ist der [Web3](/de/glossary/web3/)-native Name, dessen Archetyp [ENS](/de/glossary/ens/) (`.eth`) ist. Diese Namen leben vollständig auf Ethereum. Sie sind nicht Teil der [ICANN](/de/glossary/icann/)-Root, sodass `vitalik.eth` in einem gewöhnlichen Browser ohne Resolver oder Bridge nicht aufgelöst wird. Ihr Wert liegt in der Wallet-Identität und der krypto-nativen Benennung. ENS ist auch offen ein Registrierungsmarkt: Laut der ENS-Dokumentation [kostet ein `.eth` mit 5+ Buchstaben 5 USD pro Jahr](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), wobei vier- und dreibuchstabige Namen bewusst höher bepreist sind, und einmal registriert kann ein Name [genau wie jeder andere ERC721-Token](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token) bewegt werden. Genau diese niedrige, transparente Registrierungsuntergrenze ist der Grund, warum kurze, Premium-`.eth`-Namen zu einem eigenen spekulativen Markt wurden.

Das zweite ist die **tokenisierte ICANN-Domain** — eine echte `.com`, `.xyz` oder `.io`, deren Eigentum als NFT gespiegelt wird, während der zugrunde liegende DNS-Name überall weiter auflöst. Wie unser Erklärtext dazu, [was tokenisierte Domains sind](/de/blog/what-are-tokenized-domains/), darlegt, sind dies echte DNS-Domains, die *auch* eine Onchain-Repräsentation haben, kein paralleler Namensraum. Für einen Flipper ist die Unterscheidung konkret: Eine tokenisierte `.com` trägt die universelle Auflösbarkeit, E-Mail- und Zertifikatsunterstützung des traditionellen Internets, während ein ENS-Name krypto-native Nützlichkeit trägt, aber eine Bridge braucht, um sich wie eine Website zu verhalten. Beide können onchain geflippt werden; sie sind nicht dasselbe Produkt, und ein Käufer zahlt bei jedem für unterschiedliche Dinge. Wir vergleichen die Familien direkt in [tokenisierte Domain vs. Web3-Domain](/de/blog/tokenized-domain-vs-web3-domain/).

Ein dritter Bereich — Web3-TLDs von Plattformen wie Unstoppable Domains — liegt näher bei ENS als bei tokenisierten ICANN-Namen; der Leitfaden zu [Premium-Web3-TLDs](/de/blog/premium-web3-tlds/) behandelt, wo diese hineinpassen. Halte die drei auseinander, und du wirst jeden korrekt bepreisen.

## Wie es sich vom Registrar-Aftermarket-Flipping unterscheidet

![Redaktionelle Illustration einer atomaren Abwicklung — Münzen und ein NFT-Token, die wie Puzzleteile zwischen zwei Händen ineinandergreifen, während ein ausgegrauter Treuhänder beiseitegestellt ist](../../assets/onchain-domain-flipping-02-atomic-settle.jpg)

Die Mechanik weicht am stärksten bei der Abwicklung voneinander ab, und genau da werden traditionelle Flips nervös. In der Registrar-Welt stehen sich Käufer und Verkäufer in einer Pattsituation gegenüber: Der Verkäufer überträgt nicht, bevor er bezahlt wird, der Käufer zahlt nicht, bevor er den Namen erhält, und ein [Treuhänder](/de/glossary/escrow/) als Dritter muss in der Mitte stehen und beide Seiten halten. Wir entschlüsseln diesen klassischen Workflow in [Domain-Treuhand erklärt](/de/blog/domain-escrow-explained/).

Onchain kann diese Pattsituation in eine einzige atomare Transaktion zusammenfallen. Für NFTs gebaute Marktplatz-Protokolle lassen Zahlung und Transfer gemeinsam oder gar nicht geschehen. OpenSeas Order-Protokoll Seaport beschreibt sich selbst als ein [Marktplatz-Protokoll zum sicheren und effizienten Kaufen und Verkaufen von NFTs](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs), und der praktische Effekt ist, dass die Zahlung des Käufers und der Token des Verkäufers in einem einzigen Abwicklungsschritt tauschen. Kein Treuhänder hält das Asset mitten im Geschäft — der Vertrag erzwingt den Tausch. Das ist der Mechanismus, den wir meinen, wenn wir sagen, dass tokenisierte Marktplätze [die Treuhand ersetzen](/de/blog/how-tokenized-marketplaces-replace-escrow/).

Die anderen großen Unterschiede:

- **Die Verwahrung gehört dir.** Statt eines Kontos bei einem Registrar liegt das Asset in deiner Wallet. Das beseitigt Plattform-Lock-in und das Risiko einer Kontobeschlagnahme, aber es legt dir das volle Gewicht des [Schlüsselmanagements](/de/glossary/custodial-ownership/) auf — verlierst du die Schlüssel, verlierst du den Namen.
- **Die Liquidität ist breiter.** Ein tokenisierter Name kann auf allgemeinen NFT-Marktplätzen neben jedem anderen ERC-721-Asset gelistet werden, nicht nur auf domainspezifischen Aftermarkets, was den Pool an Augenpaaren und Geboten erweitert.
- **Die Herkunft ist öffentlich.** Jeder vorherige Verkauf und Transfer ist onchain sichtbar, sodass ein Käufer die Historie überprüfen kann, ohne dem Wort eines Marktplatzes zu vertrauen — nützlich für die Bewertung und um zu beweisen, dass ein Name nicht gestohlen ist.

## Das Geschäft Schritt für Schritt: erwerben, verwahren, listen, abwickeln

![Redaktionelle Illustration eines vierstufigen Onchain-Flip-Ablaufs — eine Lupe über einem Namensschild, ein Schlüssel und eine Wallet, eine Marktplatz-Storefront und ein kreisförmiger Münze-gegen-Token-Tausch](../../assets/onchain-domain-flipping-03-trade-steps.jpg)

### Erwerben

Du beschaffst Onchain-Namen genauso, wie du jeden Flip beschaffst — auf der Suche nach falsch bepreisten Assets —, aber die Kanäle unterscheiden sich. ENS-Namen kommen vom ENS-Registrierungsmarkt oder von sekundären NFT-Marktplätzen; die Untergrenze ist transparent, weil jeder die Registrierungsgebühr onchain lesen kann. Tokenisierte ICANN-Domains kommen aus dem Registrieren oder [Tokenisieren einer echten `.com`](/de/blog/how-to-tokenize-your-com/), die du bereits für unterbewertet hältst, oder aus dem Kauf einer bereits tokenisierten. Die Disziplin ist identisch mit dem Rest des [Domain-Handels](/de/glossary/domain-trading/): Verliebe dich nicht in einen Namen, den niemand kaufen wird, und zahle beim Einstieg nicht zu viel, denn der Einstiegspreis bestimmt deine gesamte Marge.

### Verwahren

Dies ist der Schritt ohne Entsprechung im Registrar-Flipping und der, den neue Flipper unterschätzen. Sobald der Name ein NFT ist, bist *du* das Verwahrungssystem. Eine Hot Wallet ist bequem für aktives Handeln, aber am stärksten exponiert; eine Hardware-Wallet oder eine [Multi-Sig](/de/glossary/multi-sig/)-Anordnung tauscht etwas Bequemlichkeit gegen einen weitaus besseren Schutz eines Namens, den du monatelang hältst. Ob Multi-Sig die richtige Antwort ist, ist eine echte Frage — wir wägen sie in [verbessern Multi-Sig-Wallets die Sicherheit wirklich](/de/blog/do-multisig-wallets-actually-improve-security/) ab. Und weil ein verlorener Schlüssel einen verlorenen Namen bedeuten kann, halte einen Wiederherstellungsplan bereit, bevor du ihn brauchst; [Wiederherstellung einer tokenisierten Domain nach Wallet-Verlust](/de/blog/recovering-a-tokenized-domain-after-wallet-loss/) behandelt, was möglich ist und was nicht.

### Listen

Einen Onchain-Namen zu listen ist eine Marktplatz-Aktion, keine „Zu verkaufen"-Landingpage auf einer geparkten Domain. Du setzt einen festen Sofort-kaufen-Preis oder eröffnest eine Auktion direkt auf einem NFT-Marktplatz, und die Listung ist selbst eine Onchain- (oder marktplatzsignierte) Order, die jeder Käufer ausführen kann. Bei tokenisierten ICANN-Domains behältst du auch die Option eines normalen Verkaufsseiten-Funnels — der Unterschied ist, dass der Abschluss über einen Token-Tausch statt über eine Treuhand-Übergabe läuft. Speziell bei tokenisierten Namen spielt hier die [DNS-Kontinuität](/de/blog/dns-on-tokenized-domains/) eine Rolle: Eine gut gebaute tokenisierte Domain löst während der Übergabe sauber weiter auf, sodass eine Live-Site mitten im Verkauf nicht dunkel wird.

### Abwickeln

Die Abwicklung ist die Auszahlung für die gesamte Onchain-Infrastruktur. Der Käufer führt deine Order aus, Zahlung und Token-Transfer werden gemeinsam ausgeführt, und das Eigentum wechselt in einer einzigen bestätigten Transaktion. Bei einem ENS-Namen ist das das Ende — der neue Halter kontrolliert nun den `.eth`-Namen. Bei einer tokenisierten ICANN-Domain ist der Token-Transfer die Urkunde, und die Plattform hält die zugrunde liegende DNS-Registrierung synchron, sodass der Käufer am Ende eine echte, auflösbare Domain kontrolliert. So oder so musste keine Partei zuerst handeln, und kein Treuhänder hielt das Asset dazwischen.

## Wie die Zahlen aussehen

Onchain-Flipping ist nach wie vor ein Portfolio-Spiel, keine Lotterie — die meisten Namen, die du hältst, werden sich nicht verkaufen, und die Gewinne finanzieren die laufenden Kosten. Aber die Schlagzeilen-Verkäufe zeigen, warum die Kategorie Aufmerksamkeit erhält. Der teuerste je verkaufte ENS-Name war laut The Block [paradigm.eth, der im Oktober 2021 für 420 ETH (damals etwa 1,5 Millionen US-Dollar) gekauft wurde](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=paradigm.eth%2C%20which%20was%20purchased%20in%20October%202021%20for%20420%20ETH); derselbe Bericht merkt an, dass [000.eth für 300 ETH (315.000 US-Dollar) gekauft wurde](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH), im Juli 2022.

Behandle diese als Ausreißer, nicht als Geschäftsmodell — derselbe Realitätscheck, der für `.com`-Mega-Verkäufe gilt, gilt hier doppelt, mit der zusätzlichen Komplikation, dass Onchain-Namenspreise der Volatilität des Kryptomarktes ausgesetzt sind. Eine in ETH gemessene Untergrenze kann sich in Dollar halbieren, ohne dass ein einziger Name den Besitzer wechselt. Nüchterne Bewertung, nicht die Highlight-Rolle, ist das, was ein Onchain-Portfolio in den schwarzen Zahlen hält.

## Wo Namefi hineinpasst

Die saubere Variante eines Onchain-Flips — wallet-gehaltener Eigentumstitel, atomare Abwicklung, keine Treuhand-Pattsituation — ist genau der Workflow, den [Namefi](https://namefi.io) für *echte* ICANN-Domains liefern soll. Tokenisiertes Eigentum macht die Kontrolle über eine `.com` prüfbar und übertragbar wie ein NFT, während die DNS-Kontinuität den Namen während der Übergabe auflösbar hält, sodass ein Flipper die Onchain-Liquidität erhält, ohne die universelle Auflösbarkeit aufzugeben, für die Käufer tatsächlich zahlen. Wenn du einen Namen, den du bereits besitzt, in dieses Modell bringen möchtest, findest du die Anleitung in [wie du deine .com tokenisierst](/de/blog/how-to-tokenize-your-com/), und die Plattform-Kompromisse stehen in [eine Domain-Tokenisierungsplattform wählen](/de/blog/choosing-a-domain-tokenization-platform/).

## Freundlicher Haftungsausschluss (Lies mich!)

> Wir sind keine Anwälte, Buchhalter, Finanzberater oder Ärzte, und **nichts in diesem Artikel ist rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder irgendeine andere Art von professioneller Beratung.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden, und als Annehmlichkeit für unsere Kunden. Informationen hier können veraltet, geografisch spezifisch oder schlicht falsch sein. Auch wir machen Fehler.
>
> Für jede wichtige Entscheidung **konsultiere bitte einen echten Fachmann (im Ernst!)**. Oder wenn das nicht dein Ding ist, frag einen Freund, frag Twitter, frag Reddit, frag eine KI oder frag einen Hellseher. Kurz gesagt: **DOYR — Do Your Own Research (mach deine eigene Recherche)**. Lass uns lernen und Spaß haben.

## Quellen und weiterführende Literatur

- Ethereum Improvement Proposals — [ERC-721 Non-Fungible Token Standard (NFTs „auch bekannt als deeds")](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- ENS-Dokumentation — [ETH Registrar (Registrierungspreise; Transfer als ERC-721-Token)](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ProjectOpenSea — [Seaport (Marktplatz-Protokoll zum sicheren und effizienten Kaufen und Verkaufen von NFTs)](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- The Block — [ENS-Domain 000.eth verkauft sich für 300 ETH; paradigm.eth bleibt der größte ENS-Verkauf mit 420 ETH](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
