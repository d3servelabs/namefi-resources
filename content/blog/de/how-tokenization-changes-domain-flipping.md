---
title: "Wie die Tokenisierung das Domain-Flipping verändert"
date: '2026-06-24'
language: de
tags: ['domains', 'domain-flipping', 'web3', 'explainer']
authors: ['namefiteam']
draft: false
cluster: domain-tokenization
series: domain-flipping-skills
seriesOrder: 34
format: explainer
description: "Wie das On-Chain-Bringen einer Domain das Flipping umgestaltet — verifiziertes Eigentum, atomare Abwicklung und programmierbare Übertragung gegenüber dem trägen Registrar-Aftermarket."
ogImage: ../../assets/how-tokenization-changes-domain-flipping-og.jpg
keywords: ['tokenisiertes Domain-Flipping', 'On-Chain-Domain-Flipping', 'tokenisierte Domains flippen', 'Domain-NFT-Flipping', 'atomare Domain-Abwicklung', 'Domains als NFTs verkaufen', 'Marktplatz für tokenisierte Domains', 'Domain-Flipping Web3', 'ERC-721-Domain', 'On-Chain-Domain-Übertragung', 'Verwahrung tokenisierter Domains', 'programmierbares Domain-Eigentum', 'Alternative zur Domain-Treuhand', 'Domains On-Chain flippen', 'Weiterverkauf tokenisierter Domains']
---

Der Großteil der Arbeit beim [Domain-Flipping](/de/blog/domain-flipping/) hat nichts mit dem Namen selbst zu tun. Sie beschaffen ihn, bewerten ihn, schützen ihn und finden einen Käufer — und dann kommt der Teil, den niemand mag: den Vermögenswert tatsächlich zu übertragen und bezahlt zu werden, ohne dass eine Seite den Kürzeren zieht. Dieser Abwicklungsschritt ist langsam, manuell und auf Vertrauen zwischen Fremden gebaut. Die Tokenisierung ist die Veränderung, die ihn neu schreibt.

Eine Domain On-Chain zu bringen macht aus einem schlechten Namen keinen guten und aus einem guten Namen keinen billigen. Was sich ändert, ist die *Mechanik* des Handels — wie Sie verifizieren, was Sie kaufen, wie Sie ihn halten, wie er sich bewegt und wie das Geld verrechnet wird. Dieser Beitrag durchläuft die vier Punkte im Lebenszyklus eines Flips, an denen die Tokenisierung die Arbeit tatsächlich verändert: Erwerb, Verwahrung, Übertragung und Weiterverkauf. Wenn Ihnen die zugrunde liegende Idee neu ist, beginnen Sie mit [dem, was tokenisierte Domains sind](/de/blog/what-are-tokenized-domains/); wenn Sie das tiefere Trader-Playbook möchten, ist der Cluster-Pfeiler [On-Chain-Domain-Flipping](/de/blog/onchain-domain-flipping/).

## Zunächst: Was „On-Chain" hier eigentlich bedeutet

Präzision ist wichtig, denn drei verschiedene Dinge werden als „Blockchain-Domains" in einen Topf geworfen, und sie sind nicht derselbe Vermögenswert.

[ENS](/de/glossary/ens/)-Namen wie `vitalik.eth` und [Unstoppable-artige](/de/blog/ens-vs-unstoppable-vs-tokenized-dns/) Namen wie `brand.crypto` existieren vollständig On-Chain, außerhalb der [ICANN](/de/blog/what-are-tokenized-domains/)-Root. Sie lösen in einem normalen Browser ohne Resolver oder Bridge nicht auf. Eine **tokenisierte Domain** hingegen ist eine echte ICANN-Domain — eine `.com`, `.xyz` oder `.io`, die in jedem Browser funktioniert — deren Eigentum *zusätzlich* als Token dargestellt wird, in der Regel als [NFT](/de/glossary/nft/), in Ihrer [Wallet](/de/glossary/wallet/). Der [DNS](/de/glossary/dns/)-Eintrag und der On-Chain-Token werden synchron gehalten, sodass der Name weiterhin so auflöst wie immer, während das Eigentum Wallet-nativ wird. Der Unterschied zwischen diesen Kategorien wird in [tokenisierte Domains vs. Web3-Domains](/de/blog/tokenized-domain-vs-web3-domain/) behandelt, und er ist die Unterscheidung, auf der dieser gesamte Beitrag beruht: Wenn wir sagen, dass sich das Flipping ändert, meinen wir das Flippen *echter* Domains, die zufällig eine On-Chain-Eigentumsebene tragen — nicht den Handel mit einem parallelen Namensraum.

Der Token-Standard hinter dem meisten davon ist [ERC-721](/de/glossary/erc-721/), die Ethereum-Schnittstelle, die laut der ursprünglichen Spezifikation [the implementation of a standard API for NFTs within smart contracts](https://eips.ethereum.org/EIPS/eip-721#:~:text=allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs%20within%20smart%20contracts) ermöglicht. Diese „Standard-API" ist der stille Held der ganzen Geschichte: Weil eine tokenisierte Domain dieselbe Schnittstelle spricht wie jedes andere NFT, kann jede Wallet, jeder Marktplatz und jeder [Smart Contract](/de/glossary/smart-contract/), der bereits NFTs verarbeitet, Ihre Domain ohne jede individuelle Integration verarbeiten.

## Erwerb: einen Namen kaufen, den Sie tatsächlich verifizieren können

![Redaktionelle Illustration einer Lupe, die eine Wallet mit einem Domain-NFT-Token enthüllt, umgeben von einem öffentlichen Ledger aus Blöcken und einer transparenten Herkunftsspur](../../assets/how-tokenization-changes-domain-flipping-01-verify.jpg)

Im Registrar-Aftermarket ist es eine Mühsal, zu verifizieren, was Sie kaufen. Sie vertrauen auf ein Marktplatz-Listing, auf einen WHOIS-Eintrag, der hinter einem Datenschutz verborgen sein kann, und auf das Wort eines Verkäufers, dass er den Namen tatsächlich kontrolliert und ihn übergeben wird. Sie wissen erst dann wirklich, dass er Ihnen gehört, wenn Tage später eine [Registrar-übergreifende Übertragung](/de/blog/how-tokenized-marketplaces-replace-escrow/) abgeschlossen ist.

On-Chain ist Eigentum eine öffentliche Tatsache. Das NFT der Domain liegt an einer Adresse, die jeder lesen kann; der [Smart Contract](/de/glossary/smart-contract/), der es ausgegeben hat, ist auditierbar; die Übertragungshistorie steht direkt im Block-Explorer. Bevor Sie einen Dollar ausgeben, können Sie genau bestätigen, welche Wallet den Namen hält, welcher Vertrag ihn regelt und ob er bewegt oder in irgendetwas Ungewöhnliches eingewickelt wurde. Das ist ein echtes Upgrade für die Due Diligence — die Art von Herkunftsprüfung, die Sie im althergebrachten Aftermarket schlichtweg nicht selbst durchführen können. Am meisten zählt es, wenn Sie versuchen, einen Vermögenswert zu bepreisen, den Sie noch nicht in Verwahrung genommen haben, und die On-Chain-Herkunft ist ein weiterer Input für eine vertretbare Zahl.

Der ehrliche Vorbehalt: *den Token* zu verifizieren ist einfach, aber Sie müssen immer noch *den Namen darunter* verifizieren. Eine tokenisierte `.com` ist nur so gut wie die DNS-Domain, die sie spiegelt, sodass Erneuerungsstatus, [ICANN](/de/glossary/icann/)-Richtlinienrisiko und Markenrisiko nicht verschwinden, nur weil die Eigentumsurkunde On-Chain ist. Die Tokenisierung macht Eigentum lesbar; sie macht einen Namen nicht legal flippbar.

## Verwahrung: den Vermögenswert selbst halten

Hier ist die strukturelle Verschiebung, aus der alles andere folgt. Im traditionellen Modell halten Sie eine Domain nicht wirklich — Sie halten ein *Konto* bei einem Registrar, der die Domain für Sie hält. Das ist [verwahrte Eigentümerschaft](/de/glossary/custodial-ownership/): Wenn das Konto gesperrt, suspendiert oder verloren ist, dann auch der Name, unabhängig davon, was Sie bezahlt haben.

Eine tokenisierte Domain liegt in Ihrer eigenen Wallet. Sie halten den privaten Schlüssel; Sie halten den Vermögenswert. Das ist dasselbe Selbstverwahrungsmodell, das Krypto-Vermögenswerte portabel macht, angewendet auf einen Namen — und es schneidet in beide Richtungen, was der Teil ist, den Flipper unterschätzen. Die Selbstverwahrung entfernt den Registrar als einzelnen Ausfallpunkt, macht aber stattdessen *Sie* zum einzelnen Ausfallpunkt. Verlieren Sie den Schlüssel, gibt es keine Support-Hotline, um Ihr Passwort zurückzusetzen.

Für jeden, der ein Portfolio von bedeutendem Wert hält, ist das ein Argument dafür, Wallet-Sicherheit als eine zentrale Flipping-Fähigkeit zu behandeln, nicht als nachträglichen Gedanken. Eine [Multi-Sig-Wallet](/de/glossary/multi-sig/), bei der das Bewegen eines Vermögenswerts mehr als einen Schlüssel erfordert, ist hier das Standardwerkzeug, wobei sie, wie wir in [verbessern Multisig-Wallets wirklich die Sicherheit](/de/blog/do-multisig-wallets-actually-improve-security/) behandeln, ein Kompromiss ist und kein magischer Schutzschild. Und weil Selbstverwahrung bedeutet, dass die Wiederherstellung an Ihnen liegt, ist es nicht verhandelbar, die Optionen zu kennen, bevor die Katastrophe eintritt: Siehe [Wiederherstellung einer tokenisierten Domain nach Wallet-Verlust](/de/blog/recovering-a-tokenized-domain-after-wallet-loss/) für das, was tatsächlich möglich ist, wenn ein Schlüssel abhandenkommt.

## Übertragung: Minuten, keine Woche

![Redaktionelle Illustration, die eine langsame Registrar-Übertragung mit durchgestrichenen Kalendertagen und einem Vorhängeschloss einer schnellen On-Chain-Übertragung gegenüberstellt, bei der sich ein Domain-NFT in einem einzigen bestätigten Block zwischen zwei Wallets bewegt](../../assets/how-tokenization-changes-domain-flipping-02-transfer.jpg)

Hier ist der Kontrast zur Registrar-Welt am krassesten, und hier lebt der Großteil der Reibung eines Flips tatsächlich.

Das Bewegen einer Domain zwischen Eigentümern auf die alte Art wird durch eine Übertragungsrichtlinie mit echten, fest eingebauten Wartezeiten geregelt. Wenn Sie eine gTLD-Domain registrieren oder zu einem neuen Registrar übertragen, sperren ICANN-Regeln sie: Registrare müssen eine Sperre verhängen, die [any transfer to another registrar for sixty (60) days](https://support.dnsimple.com/articles/icann-60-day-lock-registrant-change/#:~:text=any%20transfer%20to%20another%20registrar%20for%20sixty%20%2860%29%20days) nach bestimmten Eigentumsänderungen verhindert. Selbst eine normale Registrar-zu-Registrar-Übertragung läuft über Auth-Codes, E-Mail-Bestätigungen und ein mehrtägiges Verrechnungsfenster. Nichts davon ist böswillig; es existiert, um Hijacking zu bekämpfen. Aber es ist Reibung, und Reibung tötet Flips, die auf Geschwindigkeit angewiesen sind.

Eine On-Chain-Übertragung ist eine einzige Transaktion. Der Token wandert von einer Wallet zur anderen und wird in einem Block bestätigt; die Plattform hält den DNS-seitigen Eintrag synchron, sodass der Name niemals aufhört aufzulösen. ENS macht denselben Punkt über seine eigenen Namen — Nutzer können mit der Registry interagieren, um einen Namen zu übertragen, [just like with any other ERC721 token](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token) — und tokenisierte ICANN-Domains erben genau diese Eigenschaft. Für einen Flipper bedeutet „Übertragung ist eine Transaktion", dass ein Deal in derselben Sitzung abgeschlossen werden kann, in der er vereinbart wird, statt dass Käufer und Verkäufer eine Woche lang eine Registrar-Übertragung beaufsichtigen.

## Weiterverkauf: atomare Abwicklung ersetzt die Treuhand

![Redaktionelle Illustration eines atomaren Tauschs, bei dem eine Geldmünze und ein Domain-NFT-Token gleichzeitig in einer einzigen Schleife getauscht werden, mit einem durchgestrichenen, beiseitegestellten Treuhand-Agenten, der nicht mehr benötigt wird](../../assets/how-tokenization-changes-domain-flipping-03-atomic.jpg)

Das mit Abstand Größte, was die Tokenisierung am Flipping verändert, ist, wie das Geld verrechnet wird.

Die klassische Pattsituation in jedem Domain-Verkauf ist die Vertrauensreihenfolge: Der Verkäufer will nicht übertragen, bevor er bezahlt wurde, der Käufer will nicht bezahlen, bevor er den Namen erhalten hat. Die althergebrachte Lösung ist die [Treuhand](/de/glossary/escrow/) — eine neutrale dritte Partei hält die Gelder, gibt sie frei, sobald die Übertragung abgeschlossen ist, und nimmt eine Gebühr (üblicherweise ein paar Prozent), um die Lücke zu überbrücken. Es funktioniert, aber es ist langsam und es kostet bei jedem Handel Geld.

On-Chain kann diese Lücke mechanisch geschlossen werden. Zahlung und Vermögensübertragung geschehen in derselben Transaktion durch einen [atomaren Transfer](/de/glossary/atomic-transfer/): Entweder bewegen sich die Gelder des Käufers *und* das Domain-NFT beide, oder es bewegt sich gar nichts. Es gibt kein Fenster, in dem eine Partei exponiert ist, also gibt es nichts, was ein Treuhand-Agent überbrücken müsste. Wir gehen die vollständige Mechanik in [wie tokenisierte Marktplätze Treuhanddienste ersetzen](/de/blog/how-tokenized-marketplaces-replace-escrow/) durch, aber die Schlagzeile für einen Flipper ist einfach: Sie entfernen eine Gebühr, eine Verzögerung und eine Gegenpartei aus jedem Verkauf.

Weil eine tokenisierte Domain ein Standard-NFT ist, lässt sie sich auch auf bereits existierender Infrastruktur listen. Sie können sie [als NFT verkaufen](/de/blog/selling-domains-as-nfts/) auf allgemeinen Marktplätzen — OpenSea, das zu [one of the largest NFT marketplaces](https://en.wikipedia.org/wiki/OpenSea#:~:text=one%20of%20the%20largest%20NFT%20marketplaces) heranwuchs, ist das naheliegende Beispiel — neben Domain-nativen Veranstaltungsorten. Die Abwägungen zwischen diesen Veranstaltungsorten lohnen sich zu studieren, bevor Sie listen; [On-Chain-Domain-Marktplätze im Vergleich](/de/blog/onchain-domain-marketplaces-compared/) ist der Ort, das zu tun. Das praktische Ergebnis ist mehr [Liquiditäts](/de/glossary/domain-trading/)oberfläche: ein Vermögenswert, an vielen Orten listbar, abgewickelt ohne Mittelsmann.

## Programmierbares Eigentum: der Teil ohne althergebrachtes Äquivalent

Alles oben hat ein Pendant in der Registrar-Welt, das die Tokenisierung schneller oder günstiger macht. Dieser letzte hat keines.

Weil die Domain ein [Smart-Contract](/de/glossary/smart-contract/)-Vermögenswert ist, wird Eigentum programmierbar. Ein Name kann als Sicherheit für ein Darlehen verwendet, über eine On-Chain-Auktion mit per Code durchgesetzten Regeln verkauft, unter mehreren Inhabern [fraktioniert](/de/glossary/domain-trading/) oder zu Bedingungen verpachtet werden, die automatisch ausgeführt werden. Keines dieser Muster existiert im traditionellen Aftermarket, wo eine Domain ein Eintrag in einer Registrar-Datenbank ist, der nur gekauft, verkauft oder irgendwohin verwiesen werden kann. Für einen Flipper, der über den einfachen Billig-kaufen-teuer-verkaufen-Handel hinausdenkt, eröffnet die Programmierbarkeit Finanzierungs- und Strukturierungsoptionen, die zuvor nur Menschen zur Verfügung standen, die sich Anwälte und individuelle Verträge leisten konnten.

Das ist auch der Teil, der am frühesten in seiner Adoptionskurve steht, behandeln Sie die exotischen Anwendungsfälle also als aufkommend statt als ausgereift. Die verlässlichen, heute verfügbaren Erfolge sind die ersten vier: verifizierbarer Erwerb, Selbstverwahrung, schnelle Übertragung und treuhandfreie Abwicklung.

## Was sich nicht ändert

Es lohnt sich, bei den Grenzen unverblümt zu sein, denn die Tokenisierung wird manchmal überverkauft. Die harten Teile des Flippings sind immer noch hart. Sie müssen immer noch Namen beschaffen, die es wert sind, gekauft zu werden, sie ehrlich bewerten, Markenfallen vermeiden und — vor allem — einen Käufer finden. Ein tokenisierter Name, den niemand will, ist genauso unverkäuflich wie ein Registrar-gehaltener Name, den niemand will; der schlagzeilenträchtige `Voice.com`-Verkauf, der [30 million US dollars](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=blockchain%20provider%20Block.one%20paid%2030%20million%20US%20dollars%20for%20the%20domain%20name%20voice.com) einbrachte, ging um die Nachfrage nach dem Namen, nicht um die Schienen, auf denen er abgewickelt wurde. Die Tokenisierung erzeugt keine Nachfrage. Sie entfernt Reibung aus den Handelsgeschäften, die die Nachfrage bereits trägt.

Wenn Sie bereits eine `.com` besitzen und den Unterschied aus erster Hand spüren möchten, ist die sauberste Auffahrt, einen Namen zu tokenisieren, den Sie kontrollieren, und einen Verkauf über die neuen Schienen abzuwickeln — siehe [wie Sie Ihre .com tokenisieren](/de/blog/how-to-tokenize-your-com/) für die Schritt-für-Schritt-Anleitung und [die Wahl einer Plattform für Domain-Tokenisierung](/de/blog/choosing-a-domain-tokenization-platform/), wenn Sie auswählen, wo Sie es tun. Plattformen wie [Namefi](https://namefi.io) halten die DNS-Ebene durchweg voll funktionsfähig, sodass der Name weiterhin als Domain funktioniert, während Sie die oben beschriebene On-Chain-Mechanik gewinnen.

## Freundlicher Haftungsausschluss (Bitte lesen!)

> Wir sind keine Anwälte, Buchhalter, Finanzberater oder Ärzte, und **nichts in diesem Artikel ist Rechts-, Finanz-, Steuer-, Buchhaltungs-, Medizin- oder irgendeine andere Art von professioneller Beratung.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden, und als Annehmlichkeit für unsere Kunden. Die Informationen hier können veraltet, geografisch spezifisch oder schlicht falsch sein. Auch wir machen Fehler.

> Für jede wichtige Entscheidung **konsultieren Sie bitte einen echten Fachmann (im Ernst!)**. Oder falls das nicht Ihr Ding ist, fragen Sie einen Freund, fragen Sie Twitter, fragen Sie Reddit, fragen Sie eine KI oder fragen Sie einen Hellseher. Kurz gesagt: **DOYR – Do Your Own Research (Recherchieren Sie selbst)**. Lasst uns lernen und Spaß haben.

## Quellen und weiterführende Literatur

- Ethereum Improvement Proposals — [EIP-721: Non-Fungible Token Standard (standard API for NFTs)](https://eips.ethereum.org/EIPS/eip-721#:~:text=allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs%20within%20smart%20contracts)
- ENS Documentation — [The .eth Registrar (transfer a name just like any other ERC721 token; registration fees)](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token)
- DNSimple — [ICANN 60-Day Lock After Change of Registrant (transfer lock policy)](https://support.dnsimple.com/articles/icann-60-day-lock-registrant-change/#:~:text=any%20transfer%20to%20another%20registrar%20for%20sixty%20%2860%29%20days)
- Wikipedia — [OpenSea (one of the largest NFT marketplaces)](https://en.wikipedia.org/wiki/OpenSea#:~:text=one%20of%20the%20largest%20NFT%20marketplaces)
- SIDN — [Voice.com sold for USD 30 million (Block.one, 2019)](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=blockchain%20provider%20Block.one%20paid%2030%20million%20US%20dollars%20for%20the%20domain%20name%20voice.com)
