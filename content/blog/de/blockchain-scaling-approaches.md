---
title: "Die wichtigsten Blockchain-Skalierungsansätze: Rollups, Sidechains, Channels und Sharding"
date: '2026-07-02'
language: de
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 40
format: roundup
description: Ein Leitfaden für Einsteiger zur Blockchain-Skalierung — Optimistic Rollups, ZK Rollups, Sidechains, Payment Channels, Sharding und Datenverfügbarkeitsschichten im Vergleich.
ogImage: ../../assets/blockchain-scaling-approaches-og.jpg
keywords: ['blockchain-skalierung', 'blockchain-skalierungslösungen', 'layer-2-skalierung', 'rollups', 'optimistic rollup', 'zk rollup', 'sidechains', 'payment channels', 'state channels', 'sharding', 'datenverfügbarkeit', 'skalierbarkeits-trilemma', 'Arbitrum', 'Optimism', 'zkSync', 'Starknet', 'Celestia', 'EigenDA', 'Polygon PoS', 'Lightning Network']
relatedArticles:
  - /de/blog/blockchain-virtual-machines/
  - /de/blog/blockchain-consensus-mechanisms/
  - /de/blog/blockchain-privacy-technologies/
  - /de/blog/blockchain-cryptographic-primitives/
  - /de/blog/premium-web3-tlds/
relatedGlossary:
  - /de/glossary/rollup/
  - /de/glossary/optimistic-rollup/
  - /de/glossary/zk-rollup/
  - /de/glossary/data-availability/
  - /de/glossary/layer-2/
relatedTopics:
  - /de/topics/web3-foundations/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/tokenize-your-com/
  - /de/series/domain-flipping-skills/
---

Das Ethereum-Mainnet verarbeitet ungefähr 15 Transaktionen pro Sekunde. Ein Zahlungsnetzwerk wie Visa verarbeitet Zehntausende. Diese Lücke erklärt, warum Blockchains skalieren müssen: Sie brauchen eine Möglichkeit, mehr Arbeit zu erledigen, ohne dass jeder Teilnehmer jede Transaktion auf der Basischain verifizieren muss. In den vergangenen Jahren hat sich die Branche auf einige unterschiedliche Ansätze geeinigt — [Rollups](/de/glossary/rollup/), Sidechains, Payment Channels und Sharding — die jeweils Sicherheit, Dezentralisierung und Kosten anders gegeneinander abwägen.

Dieser Leitfaden führt durch die wichtigsten Skalierungsansätze, erklärt den Mechanismus hinter jedem und vergleicht sie direkt, damit der Unterschied beim nächsten Auftauchen in der Dokumentation eines Projekts klar ist.

---

## Das Skalierbarkeits-Trilemma

Vitalik Buterins Beschreibung des **Skalierbarkeits-Trilemmas** ist das Denkmodell, auf dem der Großteil dieses Bereichs beruht. Eine Blockchain möchte drei Eigenschaften zugleich: „Skalierbarkeit: Die Chain kann mehr Transaktionen verarbeiten, als ein einzelner gewöhnlicher Node ... verifizieren kann“, „Dezentralisierung: Die Chain kann ohne Vertrauensabhängigkeiten von einer kleinen Gruppe großer zentralisierter Akteure laufen“ und „Sicherheit: Die Chain kann einem hohen Anteil teilnehmender Nodes widerstehen, die versuchen, sie anzugreifen“. Herkömmliche Designs erreichen jedoch nur zwei dieser drei Eigenschaften ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Scalability%3A%20the%20chain%20can%20process%20more%20transactions%20than%20a%20single%20regular%20node)). Bitcoin und das frühe Ethereum priorisierten Dezentralisierung und Sicherheit gegenüber Durchsatz; Chains mit hoher TPS-Zahl, die auf einer kleinen Gruppe leistungsstarker Validatoren beruhen, erhalten Skalierbarkeit und Sicherheit, opfern dafür aber Dezentralisierung. Einfache Multi-Chain-Designs können skalieren und dezentral bleiben, werden jedoch unsicher, wenn ein Angreifer nur eine Chain kompromittieren muss.

Jeder der folgenden Ansätze beantwortet im Kern dieselbe Frage: Wie lässt sich der Durchsatz erhöhen, ohne die beiden anderen Ecken des Dreiecks aufzugeben?

## Rollups: Off-Chain ausführen, On-Chain abrechnen

![Flaches Vektordiagramm: Viele kleine Transaktionsbelege laufen in einen Verdichter mit der Aufschrift „Rollup Compressor“, der sie zu einem komprimierten Batch-Würfel presst, der anschließend auf eine Basisschicht-Chain aus verbundenen Blöcken geschrieben wird](../../assets/blockchain-scaling-approaches-01-rollup-batching.jpg)

Ein **[Rollup](/de/glossary/rollup/)** führt Transaktionen außerhalb von Layer 1 (L1) aus und veröffentlicht dann eine kompakte Zusammenfassung — und die zugrunde liegenden Transaktionsdaten — zurück auf der Basischain. L2BEAT, der führende Tracker für diese Systeme, definiert Rollups als „L2s, die regelmäßig Zustandszusagen an Ethereum übermitteln“; diese Zusagen werden „entweder durch Validity Proofs validiert oder ... optimistisch akzeptiert und können innerhalb eines bestimmten Fraud-Proof-Fensters über einen Fraud-Proof-Mechanismus angefochten werden“ ([l2beat.com](https://l2beat.com/scaling/summary)). Da sowohl die Daten als auch die Zusage auf L1 landen, kann jeder den Zustand eines Rollups allein aus Ethereum rekonstruieren. Das ermöglicht einem Rollup, die Sicherheit von L1 zu erben, statt Nutzer zu bitten, einer neuen Validator-Gruppe zu vertrauen. Das ist die Technologie hinter den [Layer-2](/de/glossary/layer-2/)-Netzwerken, mit denen die meisten Menschen heute interagieren: Base, Arbitrum, Optimism, zkSync und Starknet sind alles Rollups.

Rollups teilen sich danach in zwei Familien, je nachdem, wie sie die Richtigkeit ihrer Off-Chain-Ausführung nachweisen.

### Optimistic Rollups

![Flache Vektorillustration von zwei Türen nebeneinander: eine orange Tür „Optimistic“ mit einer 7-Tage-Uhr und einer Flagge für die Anfechtungsfrist, die das Fraud-Proof-Fenster darstellt, und eine grüne Tür „ZK“ mit einem sofortigen grünen Häkchen für den Validity Proof](../../assets/blockchain-scaling-approaches-02-optimistic-vs-zk.jpg)

Ein [Optimistic Rollup](/de/glossary/optimistic-rollup/) „geht davon aus, dass Off-Chain-Transaktionen gültig sind, und veröffentlicht keine Gültigkeitsnachweise für Transaktions-Batches“ ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=Optimistic%20rollups%20assume%20offchain%20transactions%20are%20valid%20and%20don%27t%20publish%20proofs%20of%20validity)). Betreiber bündeln Transaktionen, führen sie Off-Chain aus und veröffentlichen die komprimierten Daten auf Ethereum. Danach beginnt eine Anfechtungsfrist, in der jeder mit einem Full Node den Batch mit einem Fraud Proof bestreiten kann. Die Auszahlung von Geldern aus L2 nach L1 muss warten, bis „die ungefähr sieben Tage dauernde Anfechtungsfrist abläuft“ ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=the%20challenge%20period%E2%80%94lasting%20roughly%20seven%20days%E2%80%94elapses)). Deshalb dauert eine einfache Auszahlung aus einem Optimistic Rollup etwa eine Woche, sofern nicht ein externer Liquiditätsanbieter für einen schnelleren, gebührenpflichtigen Ausstieg eingesetzt wird.

Optimistic Rollups benötigen nur ein Fraud-Proof-System statt einer vollständigen kryptografischen Beweis-Pipeline. Das machte es historisch einfacher, allgemeine Smart Contracts darauf zu unterstützen. **Arbitrum**, **Optimism** und **Base** — das Rollup von Coinbase, auf ethereum.org als „ein mit dem OP Stack gebautes Optimistic Rollup“ beschrieben ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Base%20is%20an%20Optimistic%20Rollup%20built%20with%20the%20OP%20Stack)) — sind heute gemessen an der Nutzung die größten Optimistic Rollups.

### ZK Rollups

Ein [ZK Rollup](/de/glossary/zk-rollup/) verfolgt den gegenteiligen Ansatz: Statt Gültigkeit anzunehmen und eine Anfechtungsfrist zuzulassen, übermittelt es zusammen mit jedem Batch einen Validity Proof — einen kryptografischen Nachweis, dass der Zustandsübergang des Batches korrekt ist. Weil Ethereum diesen Nachweis On-Chain überprüft, „gibt es keine Verzögerungen beim Verschieben von Geldern aus einem ZK-Rollup zu Ethereum ... da Ausstiegstransaktionen ausgeführt werden, sobald der ZK-Rollup-Contract den Validity Proof verifiziert“ ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=There%20are%20no%20delays%20when%20moving%20funds%20from%20a%20ZK%2Drollup%20to%20Ethereum)). ZK-Rollups „können Tausende Transaktionen in einem Batch verarbeiten und dann nur minimale Zusammenfassungsdaten an das Mainnet übermitteln“ ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20can%20process%20thousands%20of%20transactions%20in%20a%20batch)). Sie verwenden Beweissysteme wie zk-SNARKs (kleine Beweise, schnelle Verifikation) oder zk-STARKs (transparent, kein vertrauenswürdiges Setup erforderlich). **zkSync Era**, **Starknet** — „ein allgemeines ZK Rollup auf Basis von STARKs und der Cairo VM“ ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Starknet%20is%20a%20general%20purpose%20ZK%20Rollup%20based%20on%20STARKs%20and%20the%20Cairo%20VM)) — und **Linea** sind prominente ZK Rollups. Polygon zkEVM und Scroll implementieren ebenfalls eine zkEVM, um bestehende Ethereum Smart Contracts in einer ZK-beweisbaren Umgebung auszuführen.

Der Nachteil: Validity Proofs zu erzeugen ist rechenintensiv und für vollständige EVM-Äquivalenz technisch schwieriger zu bauen als ein Fraud-Proof-System. Das ist ein Teil des Grundes, warum Optimistic Rollups die breite Akzeptanz früher erreichten, obwohl ZK Rollups eine schnellere Finalität bieten.

## Sidechains

Eine **Sidechain** „ist eine separate Blockchain, die unabhängig von Ethereum läuft und über eine bidirektionale Bridge mit dem Ethereum Mainnet verbunden ist“. Anders als ein Rollup „verwendet eine Sidechain einen separaten Konsensmechanismus und profitiert nicht von Ethereums Sicherheitsgarantien“ ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/#:~:text=A%20sidechain%20uses%20a%20separate%20consensus%20mechanism%20and%20doesn%27t%20benefit%20from%20Ethereum%27s%20security%20guarantees)). Das ist der zentrale Unterschied zu Layer 2: Eine Sidechain tauscht geerbte Sicherheit gegen unabhängige Gestaltungsfreiheit und in der Regel niedrigere Gebühren sowie schnellere Blöcke, weil sie ihrer eigenen Validator-Gruppe und nicht Ethereum unterliegt.

**Polygon PoS** ist das bekannteste Beispiel. Die eigene Produktseite von Polygon beschreibt es als „die meistgenutzte Sidechain von Ethereum — in der Praxis mit Milliarden an gesichertem Wert erprobt, mit nahezu sofortigen Transaktionen und Gebühren unter einem Cent“ ([polygon.technology](https://polygon.technology/polygon-pos)). Sie wird durch ihre eigene Proof-of-Stake-Validator-Gruppe und nicht durch die von Ethereum abgesichert. **Gnosis Chain** (früher xDai) ist neben Skale und Metis Andromeda eine weitere weit verbreitete Sidechain. Da Nutzer einer anderen, meist kleineren Validator-Gruppe vertrauen, ist die Sicherheit einer Sidechain nur so stark wie diese Gruppe. Das ist eine wesentlich andere Garantie als bei einem Rollup, bei dem ungültige Zustände grundsätzlich anhand auf L1 verankerter Daten erkannt und zurückgesetzt werden können.

## State- und Payment-Channels

Ein **State Channel** ermöglicht es zwei oder mehr Parteien, Off-Chain zu handeln, indem sie Gelder in einem gemeinsamen Contract sperren und signierte Aktualisierungen direkt austauschen. Dadurch können „Channel-Partner beliebig viele Off-Chain-Transaktionen durchführen und dabei nur zwei On-Chain-Transaktionen zum Öffnen und Schließen des Channels übermitteln“ ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=Channel%20peers%20can%20conduct%20an%20arbitrary%20number%20of%20offchain%20transactions%20while%20only%20submitting%20two%20onchain%20transactions)). Ein Payment Channel spezialisiert dieses Muster auf einfache Saldenübertragungen und „lässt sich am besten als ein gemeinsam von zwei Nutzern geführtes Zweiwege-Ledger beschreiben“ ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=A%20payment%20channel%20is%20best%20described%20as%20a%20%E2%80%9Ctwo%2Dway%20ledger%E2%80%9D%20collectively%20maintained%20by%20two%20users)). Teilnehmende können beliebig oft untereinander, Off-Chain und sofort handeln; die Basischain wird nur berührt, um den Channel zu öffnen (Sicherheiten zu sperren) und ihn zu schließen (den Endsaldo abzurechnen).

Die bekannteste Implementierung ist das **Lightning Network**, das auf seiner eigenen Website als „dezentralisiertes Netzwerk beschrieben wird, das Smart-Contract-Funktionalität in der Blockchain nutzt, um sofortige Zahlungen über ein Netzwerk von Teilnehmenden zu ermöglichen“, aufgebaut aus „bidirektionalen Payment Channels“, die Zahlungen so weiterleiten, wie Datenpakete über das Internet geroutet werden ([lightning.network](https://lightning.network/)). Der Haken: Channels skalieren Transaktionen nur *zwischen Parteien, die einen Pfad offener Channels zueinander haben*. Gelder müssen vorab gebunden werden, um einen Channel zu öffnen, und Channel-Netzwerke benötigen Liquiditätsrouting, um in großem Maßstab gut zu funktionieren. Nichts davon gilt für ein allgemeines Rollup, das beliebige Smart Contracts für jeden ausführen kann.

## Sharding und Datenverfügbarkeitsschichten

![Flaches Vektordiagramm: Transaktionen sind auf vier parallele Shard-Spuren (Shard 1 bis Shard 4) aufgeteilt, die jeweils ihre eigene Block-Chain unabhängig verarbeiten und alle in eine darunterliegende Datenverfügbarkeitsschicht münden](../../assets/blockchain-scaling-approaches-03-sharding.jpg)

**Sharding** teilt die Validierungsarbeit einer Blockchain auf mehrere parallele Teilmengen („Shards“) von Nodes auf, sodass kein einzelner Node die gesamte Transaktionslast des Netzwerks verarbeiten muss. Vitalik Buterin argumentiert, dass „Sharding alle drei“ Ecken des Trilemmas zugleich erreicht ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Sharding%20is%20a%20technique%20that%20gets%20you%20all%20three)), indem zufällig zusammengestellte Validator-Komitees unterschiedliche Shards parallel verifizieren. Die Technologie, die Sharding sicher macht, ohne jeden Node zum Herunterladen der vollständigen Daten jedes Shards zu zwingen, ist [Datenverfügbarkeit](/de/glossary/data-availability/)-Sampling (DAS) — „eine Möglichkeit für das Netzwerk zu prüfen, ob Daten verfügbar sind, ohne einen einzelnen Node übermäßig zu belasten“ ([ethereum.org](https://ethereum.org/en/developers/docs/data-availability/#:~:text=Data%20availability%20sampling%20is%20a%20way%20for%20the%20network%20to%20check%20that%20data%20is%20available%20without%20putting%20too%20much%20strain%20on%20any%20individual%20node)). Ein Light Node lädt nur kleine, zufällig ausgewählte Teile der Daten eines Blocks herunter und kann dank Erasure Coding dennoch darauf vertrauen, dass die vollständigen Daten veröffentlicht wurden.

Dasselbe Datenverfügbarkeitsproblem gilt unmittelbar für Rollups. Deshalb sind dedizierte Datenverfügbarkeitsschichten als eigene Infrastrukturkategorie entstanden. **Celestia** ist eine modulare Blockchain, die speziell dafür gebaut wurde, dass „Rollups und L2s Celestia als Netzwerk nutzen, um Transaktionsdaten zu veröffentlichen und für jeden zum Herunterladen verfügbar zu machen“ ([celestia.org](https://celestia.org/what-is-celestia/#:~:text=Rollups%20and%20L2s%20use%20Celestia%20as%20a%20network%20for%20publishing%20and%20making%20transaction%20data%20available%20for%20anyone%20to%20download)). Ein Rollup kann seine Daten dadurch auf einer günstigeren, speziell entwickelten DA-Schicht statt im Ethereum-Mainnet veröffentlichen. **EigenDA**, aufgebaut auf der Restaking-Infrastruktur von EigenLayer, bietet einen vergleichbaren Dienst, der durch Ethereum-Staker abgesichert wird, die sich dafür entscheiden, auch die DA-Schicht abzusichern. Rollups, die Daten bei einer externen DA-Schicht statt bei Ethereum L1 veröffentlichen, werden manchmal *Validiums* oder *Optimiums* statt „reiner“ Rollups genannt. L2BEAT führt sie als eigene Kategorie neben Rollups und anderen L2-Lösungen ([l2beat.com](https://l2beat.com/scaling/summary)); sie tauschen einen Teil dieser an L1 verankerten Sicherheitsgarantie gegen niedrigere Kosten für die Datenveröffentlichung ein.

## Vergleich der Ansätze

| Ansatz | Ort der Berechnung | Erbt L1-Sicherheit? | Datenverfügbarkeit | Wichtigste Abwägung | Beispiele |
|---|---|---|---|---|---|
| Optimistic Rollup | Off-Chain (L2) | Ja — Daten + Fraud Proof auf L1 | Vollständige Daten auf L1 veröffentlicht | ~7-tägige Anfechtungsfrist für Auszahlungen | Arbitrum, Optimism, Base |
| ZK Rollup | Off-Chain (L2) | Ja — Daten + Validity Proof auf L1 | Vollständige Daten auf L1 veröffentlicht | Teure Beweiserzeugung; vollständige EVM-Äquivalenz schwieriger | zkSync, Starknet, Linea |
| Sidechain | Unabhängige Chain | Nein — eigener Konsens/eigene Validatoren | Eigene Chain, nicht auf L1 veröffentlicht | Sicherheit nur so stark wie die eigene Validator-Gruppe | Polygon PoS, Gnosis Chain |
| State-/Payment-Channel | Off-Chain, zwischen Teilnehmenden | Indirekt — Gelder auf L1 gesperrt | Nicht veröffentlicht; nur Endzustand On-Chain | Skaliert nur Transaktionen zwischen über Channels verbundenen Parteien; Gelder müssen vorab gesperrt werden | Lightning Network |
| Sharding / DA-Schicht | Parallele Shards oder separates DA-Netzwerk | Unterschiedlich — L1-Sharding erbt sie; externe DA-Schichten fügen eine neue Vertrauensannahme hinzu | Durch Datenverfügbarkeits-Sampling verifiziert | Externe DA senkt Kosten, schafft aber eine Abhängigkeit außerhalb von L1 | Ethereums Sharding-Roadmap, Celestia, EigenDA |

Kein einzelner Ansatz gewinnt auf jeder Achse. Deshalb kombinieren Produktionssysteme zunehmend mehrere davon: Ein ZK Rollup, das seine Daten beispielsweise bei Celestia statt bei Ethereum veröffentlicht, kombiniert die Sicherheit eines Validity Proofs aus einer Schicht mit günstiger Datenverfügbarkeit aus einer anderen.

---

## Wie dies mit tokenisierten Domains zusammenhängt

Skalierungsentscheidungen sind für [tokenisierte Domains](/de/glossary/tokenized-domain/) wichtig, weil jedes Minting, jede Übertragung, jedes DNS-Update oder jede Besicherungsaktion eine On-Chain-Transaktion ist und ihre Kosten sowie die Zeit bis zur Finalität davon abhängen, wo sie abgerechnet wird. Eine tokenisierte `.com`-Übertragung, die auf einem Optimistic Rollup bestätigt wird, kann sich auf L2 günstig und schnell anfühlen, doch die Rollup-Transaktion ist [erst final, nachdem der Rollup-Block auf Ethereum akzeptiert wurde](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=transactions%20conducted%20on%20the%20rollup%20are%20only%20final%20after%20the%20rollup%20block%20is%20accepted%20on%20Ethereum). Eine Fast-Exit-Bridge sorgt nicht dafür, dass der Rollup-Zustand auf L1 früher final wird: Bei einer Auszahlung [übernimmt ein Liquiditätsanbieter stattdessen die ausstehende L2-Auszahlung und zahlt den Betrag an den Nutzer auf L1 aus](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=A%20liquidity%20provider%20assumes%20ownership%20of%20a%20pending%20L2%20withdrawal%20and%20pays%20the%20user%20on%20L1), üblicherweise gegen eine Gebühr, während die kanonische Auszahlung weiterhin die Anfechtungsfrist abwartet. Dieselbe Übertragung auf einem ZK Rollup ist gegenüber L1 final, sobald der Validity Proof eintrifft. Sidechains können noch günstiger sein, aber eine Domain-NFT, die ausschließlich auf einer Sidechain liegt, übernimmt die Sicherheit der kleineren Validator-Gruppe dieser Sidechain statt der von Ethereum. Diese Abwägungen zu verstehen, gehört dazu zu verstehen, was man tatsächlich besitzt, wenn eine Domain On-Chain repräsentiert wird — dieselbe Due-Diligence-Gewohnheit, die generell für [Web3-Grundlagen](/de/topics/web3-foundations/) relevant ist.

---

## Quellen und weiterführende Lektüre

- [Die Grenzen der Blockchain-Skalierbarkeit — Vitalik Buterin](https://vitalik.eth.limo/general/2021/04/07/sharding.html)
- [Layer 2 — ethereum.org](https://ethereum.org/en/layer-2/)
- [Optimistic Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/)
- [ZK-Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [Sidechains — ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/)
- [State Channels — ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/)
- [Datenverfügbarkeit — ethereum.org](https://ethereum.org/en/developers/docs/data-availability/)
- [L2BEAT-Skalierungsübersicht](https://l2beat.com/scaling/summary)
- [Was ist Celestia? — celestia.org](https://celestia.org/what-is-celestia/)
- [Lightning Network](https://lightning.network/)
- [Polygon PoS — polygon.technology](https://polygon.technology/polygon-pos)
