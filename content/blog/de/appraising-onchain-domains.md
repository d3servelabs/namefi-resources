---
title: "ENS- und tokenisierte Domains bewerten: Onchain-Vergleichswerte lesen"
date: '2026-06-24'
language: de
tags: ['domains', 'domain-flipping', 'web3', 'analysis']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 40
format: analysis
description: "Wie man ENS- und tokenisierte Domains mit Onchain-Vergleichswerten, der Floor-gegen-Premium-Logik und ENS-Club-Faktoren bewertet – und warum sich das von DNS unterscheidet."
ogImage: ../../assets/appraising-onchain-domains-og.jpg
keywords: ['ENS-Domains bewerten', 'ENS-Domain-Bewertung', 'Bewertung tokenisierter Domains', 'Onchain-Vergleichswerte', 'vergleichbare Domain-Verkäufe', 'NameBio-Vergleichswerte', 'ENS-Floor-Preis', 'ENS 999 Club', 'ENS 10k Club', 'wie man einen ENS-Namen bewertet', 'Wert tokenisierter Domains', 'Web3-Domain-Bewertung', 'ERC-721-Domain-Wert', 'Onchain-Verkaufshistorie', 'Domain Floor gegen Premium']
relatedArticles:
  - /de/blog/onchain-domain-flipping/
  - /de/blog/how-to-read-comparable-domain-sales/
  - /de/blog/domain-appraisal-tools-compared/
  - /de/blog/domain-flipping/
  - /de/blog/onchain-domain-marketplaces-compared/
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
  - /de/glossary/registry/
---

Die Bewertung ist die Fähigkeit, die darüber entscheidet, ob ein Flip Geld einbringt. Die Beschaffung sagt dir, was zum Verkauf steht, und der Verkauf macht aus einem Namen einen Scheck, aber die Zahl dazwischen – was ein Name tatsächlich wert ist – ist der Ort, an dem die Marge steckt. Das gilt für eine `.com` und es gilt onchain, nur dass dir die Onchain-Welt etwas an die Hand gibt, das der [DNS](/de/glossary/dns/)-Aftermarket nie liefern konnte: ein öffentliches, mit Zeitstempel versehenes Verzeichnis nahezu jedes Verkaufs. Dies ist das Bewertungskapitel des umfassenderen [Domain-Flipping](/de/blog/domain-flipping/)-Playbooks, mit Fokus auf die beiden Assets, die du beim [Onchain-Domain-Flipping](/de/blog/onchain-domain-flipping/) handelst – [ENS (Ethereum Name Service)](/de/glossary/ens/)-Namen und tokenisierte ICANN-Domains.

Die Methode ist dieselbe, die professionelle Gutachter und Immobilienmakler verwenden: Vergleichswerte. Wikipedia definiert sie so: [Comparables (oder comps) ist ein Begriff aus der Immobilienbewertung, der sich auf Objekte bezieht, deren Merkmale denen eines zu bewertenden Objekts ähneln](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property). Domains haben keinen Tickerkurs, also leitest du den Wert davon ab, wofür ähnliche Namen kürzlich verkauft wurden. Der Onchain-Clou ist, dass „kürzlich verkauft für“ kein Gerücht mehr ist, sondern eine überprüfbare Tatsache wird.

## Woher die Vergleichswerte stammen

![Redaktionelle Illustration einer Gutachterfigur mit einer Lupe, die ein transparentes Onchain-Hauptbuch mit jüngsten vergleichbaren Verkaufspreisschildern liest, die aus einem Blockchain-Würfel herausströmen](../../assets/appraising-onchain-domains-01-onchain-comps.jpg)

Für traditionelle Domains ist die maßgebliche Vergleichsdatenbank [NameBio](https://namebio.com/), ein durchsuchbares Archiv historischer [Domain](/de/glossary/domain-trading/)-Verkäufe, das du nach Stichwort, Endung, Preis und Datum filtern kannst. Es ist das, was dem DNS-Aftermarket einer öffentlichen Preisquelle am nächsten kommt: Du suchst nach Namen wie dem, den du bewertest, schaust dir an, zu welchem Preis sie tatsächlich abgeschlossen wurden, und baust aus der Evidenz eine vertretbare Spanne auf – statt aus dem Bauch heraus. Behandle die Schlagzeilen-Zahlen als Schätzungen – gemeldete Verkäufe sind zu denen verzerrt, die es wert sind, gemeldet zu werden, und eine Datenbank abgeschlossener Deals kann dir nichts über die Namen sagen, die nie verkauft wurden – aber als Ausgangspunkt schlägt sie jedes automatisierte Bewertungstool, weshalb sich unser Leitfaden dazu, [wie man einen Domainnamen bewertet](/de/blog/how-to-value-a-domain-name/), auf [vergleichbare Verkäufe](/de/glossary/comparable-sales/) statt auf Algorithmen stützt.

Onchain sind die Vergleichsdaten sogar noch besser, und sie sind kostenlos. Weil ein ENS-Name oder eine tokenisierte Domain ein [NFT (Non-Fungible Token)](/de/glossary/nft/) gemäß dem [ERC-721 (NFT-Standard)](/de/glossary/erc-721/) ist – den die Ethereum-Spezifikation als [Standard-API für NFTs innerhalb von Smart Contracts](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs) beschreibt – wird jede Übertragung und jeder Verkauf in ein öffentliches Hauptbuch geschrieben. Marktplätze stellen das direkt dar: ENS-Namen sind [Non-Fungible Tokens (NFTs) und können auf NFT-Marktplätzen wie OpenSea verkauft werden](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=ENS%20names%20are%20also%20non%2Dfungible%20tokens), und diese Marktplätze zeigen dir die vollständige Verkaufshistorie, die aktuellen Angebote und den Floor einer Kollektion, ohne dass irgendjemand etwas selbst melden muss. Das Rohmaterial der Bewertung – wofür die letzten zehn vergleichbaren Namen tatsächlich gehandelt wurden – liegt onchain, prüfbar, ohne Bezahlschranke.

## Floor gegen Premium

![Redaktionelle Illustration eines Preisdiagramms mit einer flachen Floor-Basislinie aus vielen gleich kleinen Namenskacheln und einigen herausragenden Premium-Kacheln, die hoch über die Linie aufragen](../../assets/appraising-onchain-domains-02-floor-vs-premium.jpg)

Der mit Abstand nützlichste Rahmen für eine Onchain-Bewertung ist Floor gegen Premium, und er bildet sauber ab, wie diese Assets tatsächlich gehandelt werden.

Der **Floor** ist der billigste verfügbare Name in einer erkennbaren Kategorie – das niedrigste Gebot in einer [Marktplatz (z.B. OpenSea, Blur)](/de/glossary/marketplace/)-Kollektion. Für eine Klasse ähnlicher Namen (etwa fünfbuchstabige `.eth`-Namen oder zufällige vierstellige Zahlen) ist der Floor deine Basislinie: Er ist ungefähr das, was ein generisches, undifferenziertes Mitglied dieser Gruppe gerade jetzt wert ist. Floors bewegen sich mit dem Markt und mit dem Hype, daher ist jeder Floor, den du nennst, eine Momentaufnahme, keine Konstante.

Das **Premium** ist alles, was ein bestimmter Name über diesen Floor hinaus erzielt – dafür, dass er kürzer ist, ein echtes Wörterbuchwort, eine bekannte Marke oder eine niedrige Zahl. Der Großteil der Arbeit eines Gutachters besteht darin, das Premium zu rechtfertigen: Den Floor kannst du vom Bildschirm ablesen, aber die Lücke zwischen dem Floor und dem, was `crypto.eth` einbringen würde, ist eine Ermessensentscheidung, die du mit Vergleichswerten verteidigst. Die Disziplin besteht darin, sich zuerst am Floor zu verankern und dann das Premium von vergleichbaren Verkäufen aus nach oben zu begründen, statt von einer Wunschzahl auszugehen und sich nach unten zu arbeiten.

ENS macht das greifbar, weil seine eigene Registrierungspreisgestaltung nach Länge gestaffelt ist. Laut der ENS-Dokumentation [kostet dich eine `.eth` mit 5+ Buchstaben 5 USD pro Jahr](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), während vier- und dreistellige Namen per Design mehr für die Registrierung kosten. Dieses Knappheitssignal auf Protokollebene – kürzere Namen kosten schon im Besitz mehr – sagt dir, wo sich das Premium konzentriert, bevor du dir auch nur einen einzigen Verkauf ansiehst.

## ENS-Seltenheit und Club-Faktoren

![Redaktionelle Illustration von ENS-artigen Namens-Tokens, die in Seltenheitsstufen als gerankte Abzeichen-Regale sortiert werden – eine dreistellige Stufe, eine vierstellige Stufe, ein Palindrom und ein Kurzname](../../assets/appraising-onchain-domains-03-club-factors.jpg)

ENS hat eine Eigenheit, die keine DNS-Endung teilt: organisierte Seltenheitsstufen. Die „Clubs“ sind Sets von Namen, die rein über ihre Form definiert sind, und die Mitgliedschaft ist ein starker, gut lesbarer Werttreiber.

Am bekanntesten sind die numerischen Clubs. Der 999 Club umfasst die 1.000 dreistelligen Namen von `000.eth` bis `999.eth`; der 10k Club die 10.000 vierstelligen Namen von `0000.eth` bis `9999.eth`. Weil das Angebot jeder Gruppe fix und winzig ist, werden sie wie eine Sammelserie mit sichtbarem Floor und einem dünnen Premium-Schwanz gehandelt. Zahlen sind außerdem sprachneutral und schwer zu vertippen, was ein Teil davon ist, warum sie zu einem eigenen spekulativen Markt wurden. Dieselbe Logik erstreckt sich auf kurze Buchstabenfolgen, Palindrome und Emoji-Namen: Je seltener und besser lesbar das Muster, desto dicker das Premium über dem Floor.

Die Spitzenverkäufe zeigen, wie weit der Premium-Schwanz reicht. Der größte ENS-Verkauf, der je verzeichnet wurde, ist `paradigm.eth`, der laut The Block [im Oktober 2021 für 420 ETH (damals etwa 1,5 Millionen Dollar) gekauft wurde](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=purchased%20in%20October%202021%20for%20420%20ETH), und `000.eth` – das Aushängeschild des 999 Club – [wurde für 300 ETH (315.000 Dollar) gekauft](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH), [was ihn zum zweitgrößten Verkauf macht, gemessen sowohl in Ether als auch in Dollar](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=making%20it%20the%20second%2Dlargest%20sale). Das sind Ausreißer und sie sind in ETH bepreist, sodass die Dollarzahl mit dem Token schwankt – aber sie verankern die Spitze der Kurve. Wenn du einen Club-Namen bewertest, verortest du ihn auf einer Verteilung, deren Floor und Decke beide onchain beobachtbar sind. Wo diese Namen relativ zu anderen Onchain-Assets stehen, erfährst du unter [Premium-Web3-TLDs](/de/blog/premium-web3-tlds/) und im umfassenderen Vergleich [ENS gegen Unstoppable gegen tokenisiertes DNS](/de/blog/ens-vs-unstoppable-vs-tokenized-dns/).

## Eine tokenisierte ICANN-Domain zu bewerten ist eine DNS-Bewertung

Hier ist die Linie, die du nicht verwischen darfst. Eine tokenisierte ICANN-Domain ist kein ENS-Name mit einer anderen Bezeichnung – sie ist eine echte `.com`, `.xyz` oder `.io`, deren Eigentum als Token gespiegelt wird, während der zugrunde liegende Name überall weiter auflöst. Wie unsere Erklärung dazu, [was tokenisierte Domains sind](/de/blog/what-are-tokenized-domains/), es formuliert: Das sind echte DNS-Domains, die *zusätzlich* eine Onchain-Schicht haben, kein paralleler Namensraum. Die praktische Konsequenz für die Bewertung: Du bewertest eine tokenisierte `.com` so, wie du jede `.com` bewertest – mit DNS-Vergleichswerten von NameBio und den üblichen Fundamentaldaten Länge, Stichwort-Nachfrage und Endungsstärke –, weil der Käufer für einen universell auflösbaren Namen bezahlt, nicht für ein Wallet-Handle.

Damit teilt sich das Vergleichsset sauber auf. Um `acme.eth` zu bewerten, ziehst du ENS-Verkäufe und Club-Floors heran, denn sein Wert ist krypto-native Identität. Um eine tokenisierte `acme.com` zu bewerten, ziehst du `.com`-Vergleichswerte heran, denn ihr Wert ist eine echte Website-Adresse, die zufällig onchain abgewickelt wird. Die beiden zu vermischen ist der häufigste Bewertungsfehler in diesem Bereich – eine tokenisierte `.com` und eine `.eth` desselben Wortstamms sind verschiedene Produkte mit verschiedenen Käufern und sehr unterschiedlichen Vergleichswerten. Die handelsseitige Version dieser Unterscheidung gehen wir in [ENS- gegen DNS-Domain-Flipping](/de/blog/ens-vs-dns-domain-flipping/) durch, und die Mechanik, warum Tokenisierung den Handel verändert, in [wie Tokenisierung das Domain-Flipping verändert](/de/blog/how-tokenization-changes-domain-flipping/).

## Wie sich die Onchain-Bewertung von der DNS-Bewertung unterscheidet

Die Eingangsgrößen ähneln sich, aber vier Dinge unterscheiden sich wirklich, sobald ein Name ein Token ist.

**Vergleichsdaten sind überprüfbar, nicht gemeldet.** Ein NameBio-Eintrag ist ein Verkauf, den jemand offenzulegen entschieden hat; ein Onchain-Verkauf ist ein [Smart Contract](/de/glossary/smart-contract/)-Ereignis, das jeder lesen kann. Das nimmt eine Vertrauensebene heraus und macht Wash-Trading zu der neuen Sache, auf die man achten muss, statt nicht gemeldeter Deals.

**Es gibt einen Live-Floor.** DNS-Namen haben keinen Floor-Preis; jeder ist seine eigene Verhandlung. Eine Kollektion von Onchain-Namen hat einen, und ein sich bewegender Floor verändert die Bewertung von Stunde zu Stunde auf eine Weise, wie es eine `.com`-Bewertung nie tut.

**Liquidität ist strukturell.** Ein tokenisierter Name wird in einem einzigen [Atomaren Transfer](/de/glossary/atomic-transfer/) abgewickelt, wenn der Käufer zahlt – kein Treuhänder, kein Übertragungsfenster –, was die Onchain-[Liquidität](/de/glossary/domain-liquidity/) höher und die Vergleichswerte frischer macht. Das ist derselbe Mechanismus, der es dir erlaubt, einen Namen [als NFT](/de/blog/selling-domains-as-nfts/) ohne Mittelsmann zu verkaufen; wir behandeln das in [wie tokenisierte Marktplätze Treuhand ersetzen](/de/blog/how-tokenized-marketplaces-replace-escrow/).

**Krypto-denominierte Preise fügen eine zweite Variable hinzu.** Die meisten Onchain-Vergleichswerte werden in ETH angegeben. Ein Name, der „5 ETH wert“ ist, kann allein durch Token-Bewegungen um Tausende Dollar schwanken, also notiere immer, ob du in ETH oder Fiat bewertest – sie erzählen unterschiedliche Geschichten, und einen ETH-Floor als stabile Dollarzahl zu behandeln, ist der Weg, auf dem Bewertungen schiefgehen.

Der rote Faden: Onchain-Bewertung gibt dir bessere Daten und einen schnelleren Markt, aber das Kernhandwerk bleibt unverändert. Verankere dich am Floor, rechtfertige das Premium mit echten vergleichbaren Verkäufen und bepreise das richtige Vergleichsset für das richtige Asset. Eine tokenisierte `.com` auf einer Plattform wie [Namefi](https://namefi.io) wird als die echte Domain bewertet, die sie ist; eine `.eth` wird als das Onchain-Sammlerstück bewertet, das sie ist. Bring das Vergleichsset richtig hin, und der Rest ist Arithmetik.

## Freundlicher Haftungsausschluss (Bitte lesen!)

> Wir sind keine Anwälte, Buchhalter, Finanzberater oder Ärzte, und **nichts in diesem Artikel ist rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder sonstige professionelle Beratung.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden, und als Service für unsere Kundschaft. Informationen hier können veraltet, geografisch spezifisch oder schlicht falsch sein. Auch wir machen Fehler.
>
> Für jede wichtige Entscheidung **konsultiere bitte einen echten Profi (im Ernst!)**. Oder wenn das nicht dein Ding ist, frag einen Freund, frag Twitter, frag Reddit, frag eine KI oder frag eine Wahrsagerin. Kurz gesagt: **DOYR – Do Your Own Research (Recherchiere selbst).** Lass uns lernen und Spaß haben.

## Quellen und weiterführende Literatur

- Wikipedia – [Comparables (die Vergleichswert-Methode der Bewertung anhand ähnlicher jüngster Verkäufe)](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property)
- NameBio – [durchsuchbare Datenbank historischer Domainnamen-Verkäufe](https://namebio.com/)
- Ethereum Improvement Proposals – [ERC-721: Non-Fungible Token Standard (Standard-API für NFTs innerhalb von Smart Contracts)](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs)
- ENS-Dokumentation – [.eth-Registrar-Preise nach Namenslänge (5+ Buchstaben = 5 $/Jahr)](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- The Block – [000.eth für 300 ETH (315.000 $) verkauft; paradigm.eth für 420 ETH (~1,5 Mio. $, Okt. 2021); ENS-Namen als NFTs auf OpenSea](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
