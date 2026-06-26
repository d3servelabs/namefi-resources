---
title: "ENS- vs. DNS-Domain-Flipping: Was ist der Unterschied"
date: '2026-06-24'
language: de
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 33
format: comparison
description: "Wie sich das Flipping von ENS-.eth-Namen vom Flipping klassischer DNS-Domains unterscheidet: Eigentum, Liquidität, Verlängerung, Gas und wofür sich was jeweils eignet."
ogImage: ../../assets/ens-vs-dns-domain-flipping-og.jpg
keywords: ['ENS vs DNS', 'ENS-Domains flippen', 'ENS-Domain-Flipping', '.eth-Domain-Investing', '.eth-Namen flippen', 'ENS vs. klassische Domains', 'On-Chain-Domain-Flipping', 'NFT-Domain-Liquidität', 'ENS-Verlängerungsgebühren', 'ERC-721-Domains', 'Web3-Domain-Flipping', 'ENS auf OpenSea verkaufen', 'ENS-Ablauf-Schonfrist', 'tokenisiertes Domain-Flipping', 'ENS-Gas-Gebühren']
relatedArticles:
  - /de/blog/onchain-domain-flipping/
  - /de/blog/how-tokenization-changes-domain-flipping/
  - /de/blog/onchain-domain-marketplaces-compared/
  - /de/blog/selling-domains-as-nfts/
  - /de/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /de/topics/domain-investing/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-flipping-skills/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/dns/
  - /de/glossary/icann/
  - /de/glossary/tld/
  - /de/glossary/web3/
---

Wenn du Domains flippst, hast du den [ENS](/de/glossary/ens/)-Markt wahrscheinlich schon von der Seitenlinie aus beobachtet und dich gefragt, ob es dasselbe Spiel mit einem neuen Anstrich ist. Ist es nicht. Einen `.eth`-Namen zu flippen und ein klassisches `.com` zu flippen reimen sich zwar — kauf günstig eine gute Zeichenfolge, verkauf sie an jemanden, der sie dringender braucht —, aber fast alles darunter ist anders: wer dein Eigentum sehen kann, wie ein Verkauf abgewickelt wird, was du fürs Halten des Namens zahlst und was „Eigentum" überhaupt bedeutet. Dieser Beitrag geht die echten Unterschiede durch, damit du entscheiden kannst, wo deine Zeit und dein Kapital tatsächlich gut aufgehoben sind.

Zuerst eine Klarstellung, denn das Feld ist unübersichtlich. ENS-`.eth`-Namen sind nicht dasselbe wie **tokenisierte DNS-Domains**. Ein `.eth`-Name lebt vollständig [on-chain](/de/glossary/on-chain/) und wird in einem normalen Browser ohne einen Resolver oder eine Bridge nicht aufgelöst. Ein tokenisiertes `.com` ist eine echte [ICANN](/de/glossary/icann/)-Domain, die *zusätzlich* einen On-Chain-Token trägt — sie löst überall dort auf, wo ein `.com` auflöst. Wir gehen dieser Dreiteilung in [tokenisierte Domain vs. Web3-Domain](/de/blog/tokenized-domain-vs-web3-domain/) und im Vergleich [ENS vs. Unstoppable vs. tokenisiertes DNS](/de/blog/ens-vs-unstoppable-vs-tokenized-dns/) auf den Grund. In diesem Artikel geht es speziell um ENS-`.eth`-Flipping gegenüber klassischem DNS-Flipping — behalte die dritte Kategorie im Hinterkopf, denn sie übernimmt die besten Eigenschaften beider.

## Was du tatsächlich kaufst

![Redaktionelle Illustration eines selbstverwahrten NFT-Namens-Tokens samt Schlüssel in einer Wallet, die du in deiner Hand hältst, gegenüber einem gemieteten Registrar-Login und einem Mietvertrag, der von einem Dritten verschlossen wird](../../assets/ens-vs-dns-domain-flipping-01-custody.jpg)

Eine klassische DNS-Domain ist eine Registrierung: Du zahlst einen ICANN-akkreditierten [Registrar](/de/glossary/registrar/), und dein Name liegt in einer Registry-Datenbank. Du besitzt die Zeichenfolge nicht uneingeschränkt — du hältst eine verlängerbare Pacht, und die Steuerungsoberfläche ist ein Registrar-Login.

Ein ENS-Name ist von anderer Art. Wie es die ENS-Doku formuliert, ist [der Ethereum Name Service (ENS) ein verteiltes, offenes und erweiterbares Benennungssystem auf Basis der Ethereum-Blockchain](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain). Ein registrierter `.eth`-Name ist ein [NFT](/de/glossary/nft/) — genauer gesagt ein [ERC-721](/de/glossary/erc-721/)-Token —, das in deiner [Wallet](/de/glossary/wallet/) lebt. Die ENS-Doku stellt ausdrücklich klar, dass Nutzer [ihren Namen genauso übertragen wie jedes andere ERC721-Token](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token). ERC-721, der zugrunde liegende Standard, ist [eine Standardschnittstelle für nicht-fungible Token, auch bekannt als Deeds](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds), und er [stellt grundlegende Funktionalität bereit, um NFTs zu verfolgen und zu übertragen](https://eips.ethereum.org/EIPS/eip-721#:~:text=This%20standard%20provides%20basic%20functionality%20to%20track%20and%20transfer%20NFTs).

Der erste Unterschied ist also die Verwahrung. Bei DNS hält der Registrar die Schlüssel zu deinem Konto und die Registry den maßgeblichen Eintrag. Bei ENS hält der [Smart Contract](/de/glossary/smart-contract/) den Eintrag und *du* hältst die Schlüssel. Das hat für einen Flipper zwei Seiten, wie wir noch sehen werden — es nimmt einen Mittelsmann aus Verkäufen heraus, legt dir aber die gesamte Last der [Verwahrung](/de/glossary/custodial-ownership/) auf deine eigene [Seed-Phrase](/de/glossary/wallet/).

## Eigentum ist öffentlich, on-chain und prüfbar

Wenn du ein `.com` kaufst, ist das Eigentum halb-privat. WHOIS-Daten sind oft geschwärzt, die Transferhistorie ist undurchsichtig, und ein Käufer muss dir weitgehend aufs Wort glauben, dass der Name sauber und unbelastet ist.

ENS kehrt das um. Weil jede Registrierung, jeder Transfer und jeder Verkauf eine On-Chain-Transaktion ist, ist die vollständige Herkunft eines Namens öffentlich und dauerhaft. Jeder kann nachlesen, welche [Wallet](/de/glossary/wallet/) `crypto.eth` hält, wann der Name zuletzt den Besitzer wechselte und zu welchem Preis. Für einen Flipper ist das zweischneidig. Der Vorteil: Die Sorgfaltsprüfung ist trivial, Fälschungen sind schwierig, und ein Käufer kann dein Eigentum in Sekunden verifizieren, ohne dass ein [Treuhand](/de/glossary/escrow/)-Agent dafür bürgt. Der Nachteil: Dein Portfolio und deine Anschaffungskosten sind für Wettbewerber sichtbar, und eine Wallet, die „Ich bin ein Flipper" signalisiert, kann schlechtere Gegenangebote provozieren. Klassisches Domaining lässt dich im Stillen agieren; ENS tut das nicht.

Diese Transparenz ist dieselbe Eigenschaft, die On-Chain-Namen leichter bewert- und programmatisch handelbar macht — ein Thema, das wir in [On-Chain-Domains bewerten](/de/blog/appraising-onchain-domains/) aufgreifen.

## Liquidität am Zweitmarkt: Marktplätze, keine Broker

![Redaktionelle Illustration eines einstufigen atomaren Swaps an der Ladenfront eines NFT-Marktplatzes gegenüber einem langsamen, mehrstufigen Treuhand-Pfad, der sich durch einen Mittelsmann windet](../../assets/ens-vs-dns-domain-flipping-02-settlement.jpg)

Hier verändert ENS die Erfahrung wirklich. Weil ein `.eth`-Name ein ERC-721-Token ist, ist er nativ mit universellen NFT-[Marktplätzen](/de/glossary/marketplace/) — OpenSea, Blur und anderen — kompatibel, ganz ohne spezielle Domain-Branchen-Infrastruktur. Du listest ihn wie jedes andere NFT, und ein Verkauf wird über den Standard-[Smart Contract](/de/glossary/smart-contract/) des Marktplatzes abgewickelt.

Diese Abwicklung ist der entscheidende Unterschied. Ein klassischer Domainverkauf ist eine mehrtägige Choreografie: Preis vereinbaren, Treuhand öffnen, der Käufer zahlt ein, du stößt den [Transfer](/de/glossary/atomic-transfer/) beim Registrar an, der Registrar bestätigt, die Treuhand gibt frei. Ein ENS-Verkauf ist ein [atomarer Transfer](/de/glossary/atomic-transfer/): Die Zahlung des Käufers und dein Token tauschen in einer einzigen Transaktion den Platz, oder es passiert gar nichts. Kein Dritter hält den Vermögenswert mitten im Deal — derselbe Mechanismus, der auch Verkäufe tokenisierter Domains treuhandfrei macht, siehe [wie tokenisierte Marktplätze die Treuhand ersetzen](/de/blog/how-tokenized-marketplaces-replace-escrow/) und den breiteren Vergleich [On-Chain-Domain-Marktplätze im Vergleich](/de/blog/onchain-domain-marketplaces-compared/).

Liquidität hat allerdings einen echten Haken. NFT-Marktplätze sind liquide für *NFTs*, aber ein `.eth`-Name verkauft sich nur an einen Käufer, der genau diesen Namen will und bereits krypto-nativ ist. Ein großartiges `.com` lässt sich buchstäblich an jedes Unternehmen der Welt verkaufen; ein großartiges `.eth` wird an den viel kleineren Kreis von Leuten verkauft, die ETH halten, eine Wallet betreiben und einen On-Chain-Namen schätzen. Schnellere Abwicklung, dünnere Nachfrage. Verwechsle „sofort übertragbar" nicht mit „leicht verkäuflich".

## Das Verlängerungs- und Ablaufmodell ist nicht dasselbe

![Redaktionelle Illustration eines nachsichtigen Schonfrist-Sicherheitsnetzes, das ein fallendes Domain-Schild auffängt, gegenüber einer strengen Holländische-Auktion-Uhr mit fallendem Preis und einer Hand, die sich den fallengelassenen Namen schnappt](../../assets/ens-vs-dns-domain-flipping-03-expiry.jpg)

Beide Systeme verlangen Geld dafür, einen Namen zu behalten, aber die Mechanik unterscheidet sich auf eine Weise, die für ein Portfolio relevant ist.

Klassisches DNS läuft nach Registrar-Bedingungen. Eine [gTLD](/de/glossary/gtld/)-Registrierung kann für bis zu zehn Jahre gehalten werden — laut Wikipedia [beträgt die maximale Registrierungsdauer für eine gTLD-Domain 10 Jahre](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years) — und die Verlängerungspreise für ein einfaches `.com` sind moderat: Wikipedia merkt an, dass sich (Stand 2023) [die Endkundenkosten in der Regel ab einem Tiefstwert von etwa 9,70 $ pro Jahr](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=the%20retail%20cost%20generally%20ranges%20from%20a%20low%20of%20about%20%249.70%20per%20year) bewegen. Verpasst du eine Verlängerung, gibt es ein nachsichtiges Polster — Rückkauffenster und Schonfristen, die in Wochen bemessen sind, bevor der Name wirklich fällt.

ENS verwendet eine längenbasierte Jahresgebühr, die in ETH gezahlt wird. Laut ENS-Doku kosten Namen mit fünf oder mehr Zeichen etwa 5 $ pro Jahr, Namen mit vier Zeichen etwa 160 $ und Namen mit drei Zeichen etwa 640 $ — die kurzen, knappen Zeichenfolgen kosten mehr, um Horten zu entmutigen (Schätzungen aktuell zum Zeitpunkt des Schreibens; ENS-Preise sind in USD denominiert und werden in ETH abgewickelt, der genaue ETH-Betrag bewegt sich also mit dem Markt). Der Ablaufpfad ist strenger und feindseliger: Nachdem ein Name verfällt, beschreibt die ENS-Doku ein Fenster von [90 Tagen nach dem Ablauf eines Namens (also nach der Schonfrist)](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires), bevor er über das, was die Doku [eine 21-tägige holländische Auktion](https://docs.ens.domains/registry/eth/#:~:text=a%2021%20day%20dutch%20auction) nennt, wieder verfügbar wird, bei der der Rückforderungspreis sehr hoch startet und zur normalen Gebühr hin absinkt. Für einen Flipper ist diese Auktion sowohl ein Risiko (lass einen wertvollen Namen verfallen, und Konkurrenten können ihn wegschnappen) als auch eine Chance (ein disziplinierter Beobachter kann Premium-Namen zurückholen, während der holländische Preis fällt).

Die praktische Erkenntnis: ENS belohnt strengere Verlängerungsdisziplin als DNS. Die Schonfrist-Mechanik ist weniger nachsichtig, und die Folge einer verpassten Verlängerung ist kein stiller Fall — es ist eine öffentliche Auktion, die deine Wettbewerber beobachten.

## Gas- und Abwicklungskosten

Klassische Domainkosten sind vorhersehbar: eine pauschale Verlängerung, gelegentliche Transfergebühren, der eine oder andere Treuhand-Anteil. Du kannst die jährlichen Haltekosten eines Portfolios auf den Dollar genau budgetieren.

ENS fügt eine Variable hinzu, die du nicht kontrollierst: Gas. Jede On-Chain-Aktion — Registrieren, Verlängern, Übertragen, Listen — ist eine Ethereum-Transaktion mit einer Netzwerkgebühr, die mit der Auslastung schwankt. An einem ruhigen Tag ist das trivial; während eines geschäftigen Mints oder einer Marktspitze kann sie die 5-$-Verlängerung eines günstigen Namens in den Schatten stellen. Das verändert die Rechnung bei geringwertigen Flips. Zweihundert Schrott-`.com`s zu verlängern kostet eine pauschale, bekannte Summe; zweihundert minderwertige `.eth`-Namen zu verlängern kann weit mehr an Gas als an Gebühren kosten, und die Gebühren selbst schwanken mit dem ETH-Preis. Layer-2- und Batching-Tools mildern das, aber der Kernpunkt bleibt: Die ENS-Haltekosten sind unregelmäßiger und weniger vorhersehbar als die DNS-Haltekosten, und diese Unvorhersehbarkeit ist ein echter Kostenfaktor für jeden, der mit Volumen arbeitet.

## Wofür sich was jeweils eignet

Keines ist grundsätzlich besser — sie passen zu unterschiedlichen Flippern und unterschiedlichen Namen.

**Klassisches DNS-Flipping** gewinnt, wenn dein Käufer ein *Unternehmen* statt eines Krypto-Nutzers ist: ein Endkunde, der `austinplumbing.com` für eine Website, E-Mail und das Google-Ranking braucht. Der Käuferkreis ist die gesamte Wirtschaft, die Namen funktionieren überall reibungslos, die Haltekosten sind vorhersehbar, und das Vorgehen ist ausgereift. Der Preis dafür ist eine langsame, treuhandgebundene Abwicklung und undurchsichtiges Eigentum. Das meiste am Handwerk des [Domain-Flippings](/de/blog/domain-flipping/) — Beschaffung, [Bewertung](/de/blog/how-to-value-a-domain-name/), Ansprache — wurde hier aufgebaut.

**ENS-Flipping** gewinnt, wenn der Wert des Namens *krypto-nativ* ist: eine saubere Wallet-Identität, ein Protokoll- oder DAO-Handle, eine kurze sammelwürdige Zeichenfolge. Die Abwicklung ist atomar, das Eigentum ist selbstverwahrt, und der Vermögenswert ist mit On-Chain-Apps komponierbar. Der Preis dafür ist ein engerer Käuferkreis, Gas-Exposure, strengere Ablaufregeln und volle Verantwortung für deine eigenen Schlüssel — verlier die Wallet, und der Name ist weg, was genau der Grund ist, warum [die Wiederherstellung eines On-Chain-Namens nach Wallet-Verlust](/de/blog/recovering-a-tokenized-domain-after-wallet-loss/) und [Multi-Sig](/de/glossary/multi-sig/)-Verwahrung hier so viel wichtiger sind als bei DNS.

Und es gibt einen dritten Weg, der die Wahl nicht erzwingt. Eine **tokenisierte DNS-Domain** — ein echtes `.com` mit einem On-Chain-Token obendrauf — gibt dir DNS' universellen Käuferkreis *und* ENS' atomare, treuhandfreie Abwicklung samt Selbstverwahrung. Genau dafür ist [Namefi](https://namefi.io) gebaut: tokenisiere einen Namen, den du ohnehin flippen würdest, lass ihn überall weiter auflösen und verkauf ihn on-chain ohne den Treuhand-Tanz. Wenn du die On-Chain-Seite ernsthaft abwägst, zeichnen die Cluster-Säule [On-Chain-Domain-Flipping](/de/blog/onchain-domain-flipping/) und [wie Tokenisierung das Domain-Flipping verändert](/de/blog/how-tokenization-changes-domain-flipping/) das vollständige Bild, und [Domains als NFTs verkaufen](/de/blog/selling-domains-as-nfts/) behandelt die Listing-Mechanik.

## Das Fazit

ENS- und DNS-Flipping teilen einen Geist und fast nichts von ihrer Infrastruktur. ENS gibt dir öffentliches Eigentum, NFT-Marktplatz-[Liquidität](/de/glossary/domain-trading/) und atomare Abwicklung — zum Preis eines dünneren Käuferkreises, von Gas-Exposure, harschen Ablaufregeln und Selbstverwahrungsrisiko. DNS gibt dir einen universellen Käuferkreis, vorhersehbare Haltekosten und ein nachsichtiges Verlängerungspolster — zum Preis von langsamen, treuhandgebundenen, undurchsichtigen Transfers. Die klügsten Flipper wählen keinen Stamm; sie passen den Namen zum Markt. Und zunehmend greifen sie zu tokenisiertem DNS, um sich gar nicht mehr entscheiden zu müssen.

## Freundlicher Haftungsausschluss (Bitte lesen!)

> Wir sind keine Anwälte, Steuerberater, Finanzberater oder Ärzte, und **nichts in diesem Artikel ist eine rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder sonstige Form von professioneller Beratung.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden, und als Service für unsere Kunden. Die Informationen hier können veraltet, geografisch spezifisch oder schlicht falsch sein. Auch wir machen Fehler.
>
> Bitte ziehe für jede wichtige Entscheidung **einen echten Fachmann hinzu (im Ernst!)**. Oder falls das nicht dein Ding ist, frag eine Freundin, frag Twitter, frag Reddit, frag eine KI oder frag eine Wahrsagerin. Kurz gesagt: **DOYR – Do Your Own Research (Recherchiere selbst)**. Lass uns lernen und Spaß haben.

## Quellen und weiterführende Literatur

- ENS Docs — [Was ist ENS? (verteiltes Benennungssystem auf der Ethereum-Blockchain)](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)
- ENS Docs — [ETH Registrar (.eth-Namen werden wie jedes ERC721-Token übertragen; Schonfrist und holländische Auktion beim Ablauf; längenbasierte Jahresgebühren)](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- Ethereum Improvement Proposals — [ERC-721 Non-Fungible Token Standard („eine Standardschnittstelle für nicht-fungible Token, auch bekannt als Deeds")](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- Wikipedia — [Domain name registrar (10-Jahres-Höchstlaufzeit für gTLDs; Endkunden-Verlängerungspreise für `.com`)](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)
