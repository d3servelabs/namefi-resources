---
title: "ENS vs. Unstoppable vs. tokenisierte DNS-Domains"
date: '2026-06-24'
language: de
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['namefiteam']
draft: false
cluster: choosing-a-tld
series: domain-flipping-skills
seriesOrder: 37
format: comparison
description: "ENS vs. Unstoppable Domains vs. tokenisiertes ICANN-DNS, verglichen anhand der Auflösbarkeit im Browser, der Verlängerungen und der Frage, wer den Namen tatsächlich kontrolliert."
ogImage: ../../assets/ens-vs-unstoppable-vs-tokenized-dns-og.jpg
keywords: ['ENS vs. Unstoppable Domains', 'ENS vs. tokenisierte Domains', 'Unstoppable Domains vs. ENS', 'Web3-Domains im Vergleich', 'tokenisierte DNS-Domains', 'ENS Domain-Flipping', '.eth-Domains', '.crypto-Domains', 'lösen Web3-Domains im Browser auf', 'ENS-Verlängerungsgebühren', 'Unstoppable Domains ohne Verlängerung', 'ICANN vs. Web3-Domains', 'wer kontrolliert eine Web3-Domain', 'tokenisierte Domain vs. Web3-Domain', 'NFT-Domains im Vergleich']
relatedArticles:
  - /de/blog/onchain-domain-flipping/
  - /de/blog/what-are-tokenized-domains/
  - /de/blog/ens-vs-dns-domain-flipping/
  - /de/blog/onchain-domain-marketplaces-compared/
  - /de/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /de/topics/choosing-a-tld/
  - /de/topics/domain-investing/
relatedSeries:
  - /de/series/domain-flipping-skills/
  - /de/series/domain-investor-field-guide/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/dns/
  - /de/glossary/icann/
  - /de/glossary/tld/
  - /de/glossary/web3/
---

Wenn du Namen on-chain flippst, ist die erste Entscheidung, welche Art von „On-Chain-Name" du überhaupt handelst. Die drei Kategorien, die die meisten Leute in einen Topf werfen, sind nicht dasselbe Asset, und die Unterschiede entscheiden darüber, ob der Name in einem Browser auflöst, ob nächstes Jahr eine Verlängerung fällig wird und wer ihn tatsächlich kontrolliert. Dieser Leitfaden vergleicht die drei direkt miteinander: [ENS](/de/glossary/ens/) (`.eth`), [Unstoppable Domains](https://unstoppabledomains.com) (`.crypto`, `.x`, `.nft`) und tokenisierte echte ICANN-[DNS](/de/glossary/dns/)-Domains (die `.com`/`.io`/`.xyz`-Namen, die du auf [Namefi](https://namefi.io) [tokenisieren](/de/glossary/tokenize/) kannst).

In einem Punkt überschneiden sie sich: Jede legt das Namens-Eigentum als Token in deine [Wallet](/de/glossary/wallet/). Bei allem, was für den Weiterverkauf zählt, gehen sie auseinander. Wenn du dir nur eine Sache merkst, dann diese: ENS- und Unstoppable-Namen leben *außerhalb* der ICANN-Root, während eine tokenisierte DNS-Domain eine ICANN-Domain *ist*, an die ein Token angeschraubt wurde. Diese eine Tatsache pflanzt sich fort in Auflösbarkeit, Verlängerungen und Kontrolle.

## Was jede dieser Optionen tatsächlich ist

![Redaktionelle Illustration von drei Namens-Token-Karten auf kleinen Podesten nebeneinander – ein hexagonaler .eth-Token, ein abgerundetes Web3-Namens-Abzeichen und eine klassische Globus-ICANN-Domain-Karte, gleichberechtigt nebeneinander](../../assets/ens-vs-unstoppable-vs-tokenized-dns-01-three-name-types.jpg)

**ENS** ist ein Namenssystem auf [Ethereum](/de/glossary/ethereum/). Die offizielle Dokumentation beschreibt es schlicht: [ENS bildet menschenlesbare Namen wie 'alice.eth' auf maschinenlesbare Kennungen wie Ethereum-Adressen ab](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names), Content-Hashes und Metadaten. Ein `.eth`-Name wird als Token auf Ethereum ausgegeben, und du [überträgst deinen Namen genauso wie jeden anderen ERC721-Token](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token) – mechanisch gesehen ist er also ein [ERC-721](/de/glossary/erc-721/)-[NFT](/de/glossary/nft/). Entscheidend ist: `.eth` wird nicht von der ICANN delegiert; es ist ein Namespace, den ENS on-chain geschaffen hat.

**Unstoppable Domains** verkauft blockchain-native Namen wie `.crypto`, `.x`, `.nft` und `.dao`. Diese [Domainnamen können ebenfalls als Non-Fungible Token (NFT) auf der Ethereum-Blockchain geprägt werden](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token), und das Unternehmen speichert sie in deiner Wallet – die Support-Dokumentation sagt: [Web3-Domains werden in deiner Krypto-Wallet als digitale Vermögenswerte (NFTs) gespeichert und gehören vollständig dir](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets). Wie `.eth` sind auch diese TLDs nicht Teil der ICANN-Root.

**Tokenisierte DNS-Domains** sind grundsätzlich anders. Das zugrunde liegende Asset ist eine gewöhnliche ICANN-Domain – `example.com`, `yourname.io` –, registriert über einen akkreditierten [Registrar](/de/glossary/registrar/), mit einem on-chain geprägten Token, der ihr Eigentum spiegelt. Wir entschlüsseln die Mechanik in [Was sind tokenisierte Domains](/de/blog/what-are-tokenized-domains/), aber die Kurzfassung lautet: Es ist ein Name mit zwei synchronisierten Schichten, kein neuer Namespace. Für die breitere Kategorie-Einordnung siehe [tokenisierte Domain vs. Web3-Domain](/de/blog/tokenized-domain-vs-web3-domain/).

## Auflösbarkeit im Browser: funktioniert der Name einfach?

![Redaktionelle Illustration von drei gestapelten Browser-Adressleisten-Fenstern – das oberste zeigt ein grünes Häkchen, während die anderen beiden ein kleines Puzzleteil-Gateway-Plugin benötigen, bevor sie auflösen](../../assets/ens-vs-unstoppable-vs-tokenized-dns-02-resolvability.jpg)

Das ist die sauberste Trennlinie, und für einen Flipper ist sie oft die ganze Sache, denn Auflösbarkeit ist das, wofür die meisten Endkäufer tatsächlich bezahlen.

Eine tokenisierte `.com` löst überall dort auf, wo eine normale `.com` es tut – in jedem Browser, jedem E-Mail-Client, jedem CDN und jeder Zertifizierungsstelle –, weil sie eine normale `.com` *ist*. Vom Besucher ist nichts Besonderes verlangt.

ENS- und Unstoppable-Namen überspringen diese Hürde nicht aus eigener Kraft. Unstoppable sagt offen, dass seine Namen Hilfe brauchen: [Du kannst unsere Erweiterung zur Domain-Auflösung für Chrome & Firefox herunterladen](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=you%20can%20download), und nativ lösen sie nur in einer Handvoll krypto-freundlicher Browser wie Brave und Opera auf. Bei ENS-`.eth`-Namen ist es in Standard-Browsern ohne Resolver, Gateway oder Erweiterung dieselbe Geschichte. Das ist kein Vorwurf an die Technik – es ist eine bewusste Designentscheidung, die diesen Systemen die Freiheit verschafft, außerhalb der ICANN zu iterieren. Aber sie verändert, wer dein Käufer ist: Du verkaufst in erster Linie an das [Web3](/de/glossary/web3/)- und Wallet-native Publikum, nicht an den allgemeinen Markt, der erwartet, dass ein Name im schlichten Chrome lädt.

Eine Nuance lohnt sich zu kennen: ENS überbrückt *hin* zu DNS statt weg davon. Seine Dokumentation merkt an, dass [ENS DNS-Namen unterstützt und es Nutzern erlaubt, DNS-Namen in ENS zu importieren](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names) über [DNSSEC](/de/glossary/dnssec/). Ein `.com`-Eigentümer kann also seinen echten Namen in ENS projizieren – aber dabei ist es der DNS-Name, der im regulären Internet auflöst, während ENS eine on-chain Identitätsschicht hinzufügt. Es bringt `.eth` selbst nicht dazu, in einem Standard-Browser aufzulösen.

## Verlängerungen: schuldest du nächstes Jahr Geld?

Das Verlängerungsmodell ist der Punkt, an dem die drei auf eine Weise auseinandergehen, die direkt deine laufenden Kosten trifft – und an dem ein Flipper eine böse Überraschung erleben kann.

ENS-`.eth`-Namen tragen eine jährliche Gebühr. Die offizielle Registrar-Dokumentation ist beim Preis eindeutig: [eine `.eth` mit 5+ Buchstaben kostet dich 5 USD pro Jahr. Eine mit 4 Buchstaben 160 USD pro Jahr und eine mit 3 Buchstaben 640 USD pro Jahr](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you), und [diese Gebühr wird in ETH gezahlt](https://docs.ens.domains/registry/eth/#:~:text=This%20fee%20is%20paid%20in%20ETH). Versäumst du sie, gibt es ein Kulanzfenster, nach dem laut ENS [90 Tage nach Ablauf eines Namens (also nach der Kulanzfrist) der Name in eine Temporary Premium Auction übergeht](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires). Bei kurzen, wertvollen `.eth`-Namen ist die Verlängerung ein echter Posten.

Unstoppable Domains vermarktet das Gegenteil-Modell: ein einmaliger Kauf. Die Dokumentation sagt, Web3-Domains [können dir nicht weggenommen werden, erfordern keine Verlängerungen und gehören dir ein Leben lang](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=don%27t%20require%20renewals%2C%20and%20are%20yours%20for%20life). Keine jährliche Rechnung ist für einen Buy-and-Hold-Flipper attraktiv, wobei „ein Leben lang" eine Aussage über die Absicht des Protokolls ist, keine ICANN-Garantie – diese Namen existieren nur so lange, wie die Auflösungsinfrastruktur existiert, die sie liest.

Tokenisierte DNS-Domains folgen der normalen ICANN-Ökonomie: Du zahlst die jährliche Verlängerung eines Registrars, und gTLD-Registrierungen sind auf eine Laufzeit von maximal 10 Jahren begrenzt. Das sind wiederkehrende Kosten, aber es sind dieselben, gut verstandenen Kosten, die jeder `.com`-Investor ohnehin schon einkalkuliert. Die Tokenisierung fügt keine zweite Verlängerung hinzu – der Token verfolgt die eine darunterliegende DNS-Registrierung.

## Wer den Namen tatsächlich kontrolliert

![Redaktionelle Illustration von drei Bedienpanels, jedes mit einer Verlängerungsuhr und einem Schlüssel – ein Schlüssel vollständig in der Hand eines Nutzers, die anderen beiden greifen in einen hohen Registry-Turm hinein](../../assets/ens-vs-unstoppable-vs-tokenized-dns-03-who-controls.jpg)

„Selbstverwahrung" wird bei allen dreien locker verwendet, also sei präzise, was Kontrolle auf jeder Schicht bedeutet.

Bei ENS und Unstoppable gehört die On-Chain-Kontrolle wirklich dir: Wer den [privaten Schlüssel](/de/glossary/private-key/) hält, hält den Namen, ohne dass ein Registrar ihn über ein Support-Ticket zurückholen könnte. Genau das ist der eigentliche Reiz daran, dass die [verwahrte Eigentümerschaft](/de/glossary/custodial-ownership/) durch die Wallet-Verwahrung ersetzt wird. Der Haken: „Der Name" bedeutet nur etwas innerhalb der Auflösungssysteme, die ihn anerkennen. Wenn du den Token kontrollierst, ihn aber nur eine Browser-Erweiterung und ein paar dApps auflösen, ist deine Kontrolle echt, aber ihre *Reichweite* ist durch die Verbreitung begrenzt.

Bei einer tokenisierten DNS-Domain ist die Kontrolle geschichtet. Der Token in deiner Wallet regelt das On-Chain-Eigentum und den Transfer; der zugrunde liegende Name bleibt eine echte ICANN-Domain, was bedeutet, dass er weiterhin der Verlängerung, der ICANN-Politik und [UDRP](/de/glossary/udrp/)-Streitigkeiten unterliegt – denselben Regeln, unter denen jede `.com` lebt. Eine seriöse Tokenisierungsplattform hält die beiden Schichten im Gleichschritt, sodass die Übertragung des Tokens die Domain mitnimmt, mit DNS-Kontinuität, damit die Live-Website bei einer Übergabe nicht blinzelt. Du bekommst Wallet-native Kontrolle *und* einen Namen, den das gesamte Internet bereits anerkennt. Der Kompromiss ist ehrlich: Du bist nicht „außerhalb des Systems", denn das Asset ist eine echte Domain, die realen Regeln unterliegt. Wir gehen bei der Verwahrungsfrage tiefer in [Wiederherstellung einer tokenisierten Domain nach Wallet-Verlust](/de/blog/recovering-a-tokenized-domain-after-wallet-loss/).

## Liquidität und wo sie verkauft werden

Weil alle drei [ERC-721](/de/glossary/erc-721/)-artige NFTs sind (oder nahe dran), können sie auf NFT-[Marktplätzen](/de/glossary/marketplace/) gelistet werden und mit einem [atomaren](/de/glossary/atomic-transfer/) Tausch übertragen werden, bei dem der Käufer zahlt und empfängt – ohne einen Drittpartei-[Treuhand](/de/glossary/escrow/)-Agenten, der das Asset mitten im Deal hält. Genau diese gemeinsame Infrastruktur macht On-Chain-Namen zum Flippen attraktiv, und sie wird in [Wie tokenisierte Marktplätze Treuhanddienste ersetzen](/de/blog/how-tokenized-marketplaces-replace-escrow/) behandelt.

Die Käufergruppen unterscheiden sich allerdings. ENS hat den tiefsten Sekundärmarkt der drei – Premium-`.eth`-Namen wurden für ernsthaftes Geld gehandelt. CoinGecko hält fest, dass [die teuerste je verkaufte Krypto-Domain „paradigm.eth" war, die am 9. Oktober 2021 für 1,51 Millionen US-Dollar (420 ETH) verkauft wurde](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for), und The Block berichtete, dass [die Ethereum-Name-Service-(ENS)-Domain 000.eth für 300 ETH (315.000 US-Dollar) gekauft wurde](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH). Das sind echte Zahlen, aber behandle sie als Ausreißer – genauso wie `Voice.com` in der DNS-Welt ein Ausreißer ist –, sie sagen dir, dass eine Obergrenze existiert, nicht, was ein typischer Name einbringt. Jede „Floor-Price"-Zahl, die du zitiert siehst, ist eine bewegliche Schätzung, keine Tatsache.

Tokenisierte DNS-Domains erschließen ein anderes und größeres Käuferuniversum: jeden, der eine echte, universell auflösbare Domain *plus* Wallet-natives Eigentum möchte. Das ist das Publikum, das will, dass ein Name in jedem Browser lädt, E-Mails ausführt und ein SSL-Zertifikat trägt – ohne die Option aufzugeben, ihn als NFT zu verkaufen.

## Welche du flippen solltest

Es gibt keinen einzigen Gewinner; es gibt eine Passung für deinen Käufer.

- **Flippe ENS `.eth`**, wenn du an ein krypto-natives Publikum verkaufst, das kurze numerische oder Wort-Namen als On-Chain-Identität schätzt, und wenn es dir nichts ausmacht, die jährliche Verlängerung für alles zu tragen, was sich zu halten lohnt.
- **Flippe Unstoppable-Namen**, wenn dein Käufer eine verlängerungsfreie, Wallet-first Web3-Identität möchte und Auflösbarkeit in Standard-Browsern für ihn keine Priorität hat. Siehe [Premium-Web3-TLDs](/de/blog/premium-web3-tlds/) dazu, wie dieser Namespace bewertet wird.
- **Flippe tokenisierte DNS-Domains**, wenn du die größte Käufergruppe und einen Namen willst, der *funktioniert* – eine echte ICANN-`.com`/`.io`/`.xyz`, die du halten, programmieren und on-chain verkaufen kannst, während sie für alle auflöst. Beginne mit [So tokenisierst du deine .com](/de/blog/how-to-tokenize-your-com/), und wenn du Plattformen abwägst, geht [Die Wahl einer Plattform für Domain-Tokenisierung](/de/blog/choosing-a-domain-tokenization-platform/) die Kriterien durch.

Für das große Ganze, warum irgendetwas davon das alte Treuhand-und-Vertrauen-Modell schlägt, bindet der [Domain-Flipping](/de/blog/domain-flipping/)-Hub den gesamten Skill-Stack zusammen, und [Warum Domains tokenisieren](/de/blog/why-tokenize-domains/) deckt den Vorteil ausführlich ab. Welche Kategorie du auch handelst – wisse, welches Asset in deiner Wallet liegt, bevor du einen Preis nennst, denn Auflösbarkeit, Verlängerungen und Kontrolle sind keine Details, sie sind das Produkt.

## Freundlicher Haftungsausschluss (Lies mich!)

> Wir sind keine Anwälte, Buchhalter, Finanzberater oder Ärzte, und **nichts in diesem Artikel ist eine rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder sonstige Form von professioneller Beratung.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden, und als Annehmlichkeit für unsere Kunden. Die Informationen hier können veraltet, geografisch spezifisch oder schlicht falsch sein. Auch wir machen Fehler.
>
> Bei jeder wichtigen Entscheidung **konsultiere bitte einen echten Fachmann (im Ernst!)**. Oder wenn das nicht dein Ding ist, frag einen Freund, frag Twitter, frag Reddit, frag eine KI oder frag einen Hellseher. Kurz gesagt: **DOYR – Do Your Own Research** (mach deine eigene Recherche). Lass uns lernen und Spaß haben.

## Quellen und weiterführende Literatur

- ENS Docs — [ENS-Protokoll: bildet menschenlesbare Namen auf Adressen ab](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names)
- ENS Docs — [ETH Registrar: `.eth`-Transfers wie jeder andere ERC721-Token; jährliche Preise (5 / 160 / 640 USD pro Jahr); Gebühr in ETH gezahlt; 90 Tage Kulanz](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- ENS Docs — [ENS unterstützt den Import von DNS-Namen über DNSSEC](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names)
- Unstoppable Domains Support — [Web3-Domains als NFTs in deiner Wallet gespeichert; keine Verlängerungen, gehören dir ein Leben lang; Browser-Erweiterung für Chrome & Firefox erforderlich](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets)
- CoinMarketCap — [Unstoppable Domains als NFTs auf der Ethereum-Blockchain geprägt](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token)
- CoinGecko Research — [Teuerste Krypto-Domains: paradigm.eth für 1,51 Millionen US-Dollar (420 ETH) verkauft, 9. Okt. 2021](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for)
- The Block — [000.eth für 300 ETH (315.000 US-Dollar) gekauft, zweitgrößter ENS-Verkauf](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
