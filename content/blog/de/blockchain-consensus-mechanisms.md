---
title: "Die wichtigsten Blockchain-Konsensmechanismen: Proof of Work, Proof of Stake und mehr"
date: '2026-07-02'
language: de
tags: ['guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 20
format: roundup
description: Ein klarer Leitfaden zu Blockchain-Konsensmechanismen — Proof of Work, Proof of Stake, Delegated Proof of Stake, BFT-Konsens und dazu, wie sie jeweils ein Netzwerk absichern.
ogImage: ../../assets/blockchain-consensus-mechanisms-og.jpg
keywords: ['blockchain-konsensmechanismen', 'konsensmechanismus', 'proof of work', 'proof of stake', 'delegated proof of stake', 'byzantinische fehlertoleranz', 'tendermint', 'cometbft', 'proof of history', 'proof of authority', 'proof of space', 'doppelausgabenproblem', 'blockchain-finalität', 'ethereum merge', 'bitcoin-mining', 'validator', 'staking', 'sybil-resistenz', 'namefi']
relatedArticles:
  - /de/blog/blockchain-virtual-machines/
  - /de/blog/blockchain-scaling-approaches/
  - /de/blog/blockchain-cryptographic-primitives/
  - /de/blog/blockchain-privacy-technologies/
  - /de/blog/what-are-tokenized-domains/
relatedGlossary:
  - /de/glossary/consensus-mechanism/
  - /de/glossary/proof-of-work/
  - /de/glossary/proof-of-stake/
  - /de/glossary/blockchain/
  - /de/glossary/ethereum/
relatedTopics:
  - /de/topics/web3-foundations/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/tokenize-your-com/
  - /de/series/domain-flipping-skills/
---

Jede [Blockchain](/de/glossary/blockchain/) muss eine Frage beantworten, bevor ihr jemand Geld anvertrauen kann: Wer darf entscheiden, was passiert ist und in welcher Reihenfolge? Es gibt keine Bank, keinen Notar und keinen zentralen Server, der das Sagen hat. Ein **Konsensmechanismus** ist die Menge von Regeln, denen die Teilnehmenden eines Netzwerks folgen, um sich auf eine einzige, gemeinsame Transaktionshistorie zu einigen — ohne zentrale Instanz und ohne dass jemand dieselbe Coin zweimal ausgeben kann.

Dieser Leitfaden erläutert die heute wichtigen Konsensmechanismen, wie jeder von ihnen tatsächlich den nächsten Block auswählt und worin die jeweiligen Abwägungen liegen.

---

## Welches Problem Konsens tatsächlich löst

Zwei Probleme machen eine dezentrale Einigung schwierig.

**Das Doppelausgabenproblem.** In einem digitalen System ist eine Werteinheit nur Daten, und Daten lassen sich kopieren. Ohne Schiedsinstanz hindert nichts jemanden daran, zwei widersprüchliche Transaktionen zu verbreiten, die beide dieselbe Coin ausgeben. Satoshi Nakamotos Bitcoin-Whitepaper formuliert das Ziel direkt: Das Netzwerk braucht „ein System, mit dem sich die Teilnehmenden auf eine einzige Historie der Reihenfolge einigen, in der sie empfangen wurden“, damit ein Empfänger darauf vertrauen kann, dass eine frühere Zahlung nicht durch eine spätere, widersprüchliche rückgängig gemacht wird ([Bitcoin-Whitepaper](https://bitcoin.org/bitcoin.pdf)).

**Einigung ohne zentrale Instanz.** In einer normalen Datenbank hat das Wort eines Betreibers das letzte Gewicht. In einem öffentlichen, erlaubnisfreien Netzwerk kann jeder einen Node betreiben, Transaktionen vorschlagen und versuchen, den nächsten Block hinzuzufügen — auch Teilnehmende, die lügen, zensieren oder die Historie umschreiben wollen. Ein Konsensmechanismus muss Angriffe auf das Ledger unerschwinglich teuer machen oder auf andere Weise unattraktiv gestalten und zugleich günstig genug sein, damit ehrliche Teilnehmende das Netzwerk weiter betreiben können.

Jeder der folgenden Mechanismen beantwortet die Frage „Wer schlägt den nächsten Block vor und woher wissen wir, dass wir ihm vertrauen können?“ anders. Beim Vergleich sind zwei Achsen besonders wichtig: **[Sybil-Resistenz](/de/glossary/consensus-mechanism/)** — was einen Angreifer daran hindert, unbegrenzt viele falsche Identitäten zu erzeugen und damit alle anderen zu überstimmen — und **Finalität** — wie schnell und wie endgültig eine Transaktion unumkehrbar wird.

---

## Proof of Work

![Mehrere Miner wetteifern darum, dasselbe Hash-Rätsel zu lösen; einer hält einen Block mit der Aufschrift „gefunden!“ hoch, während Blitze die hohen Energiekosten des Minings zeigen](../../assets/blockchain-consensus-mechanisms-01-proof-of-work.jpg)

[Proof of Work](/de/glossary/proof-of-work/) (PoW) ist der Mechanismus, den Bitcoin 2009 eingeführt hat, und der, an den die meisten Menschen bei „Blockchain“ denken. Miner konkurrieren darum, ein kryptografisches Rätsel zu lösen: Sie hashen die Daten eines Kandidatenblocks wiederholt mit einer Nonce, bis der resultierende Hash unter einen Zielwert fällt. Die Entwicklerdokumentation von Ethereum beschreibt das Rennen schlicht: Ein Miner führt „wiederholt einen Datensatz ... durch eine mathematische Funktion“, um vor allen anderen eine gültige Lösung zu finden ([ethereum.org: Proof-of-work](https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/#:~:text=When%20racing%20to%20create%20a%20block%2C%20a%20miner%20repeatedly%20put%20a%20dataset)). Wer zuerst einen gültigen Hash findet, darf den nächsten Block vorschlagen und erhält die Blockbelohnung plus Transaktionsgebühren.

Die **Sybil-Resistenz** entsteht durch das Rätsel selbst: Hashes zu berechnen kostet reale Elektrizität und Hardware; viele falsche Identitäten vorzutäuschen bringt daher keinen Vorteil — nur reine Rechenleistung zählt. Die **Finalität ist probabilistisch.** Das Bitcoin-Whitepaper beschreibt, dass Nodes stets „die längste Chain als die korrekte“ erweitern ([Bitcoin-Whitepaper](https://bitcoin.org/bitcoin.pdf)); ein Empfänger gewinnt Vertrauen darin, dass eine Transaktion abgewickelt ist, indem er abwartet, bis weitere Blöcke darauf gemined werden. Jeder neue Block macht es exponentiell teurer, die Historie umzuschreiben, aber kein einzelner Block ist sofort und mathematisch endgültig.

Der Nachteil ist Energie. Ein Netzwerk durch reale Berechnungen abzusichern bedeutet realen Stromverbrauch; deshalb wird Bitcoin-Mining in Terawattstunden pro Jahr gemessen. **Beispiel-Chains:** Bitcoin, Litecoin, Dogecoin und Ethereum vor 2022.

---

## Proof of Stake

![Ein Validator sperrt einen Stapel Coins als gestakte Einlage in einem Tresor ein und wird anschließend per Glücksrad ausgewählt, den nächsten Block vorzuschlagen; am Tresor hängt ein Warnhinweis zu Slashing](../../assets/blockchain-consensus-mechanisms-02-proof-of-stake.jpg)

[Proof of Stake](/de/glossary/proof-of-stake/) (PoS) ersetzt Rechenarbeit durch eine wirtschaftliche Sicherheit. Statt Mining **staken** Teilnehmende den nativen Vermögenswert des Netzwerks, also sperren ihn ein, und das Protokoll wählt pseudozufällig einen Staker aus, um jeden Block vorzuschlagen. Die Validator-Rolle von Ethereum ist ein gutes Referenzdesign: Ein Validator hinterlegt 32 ETH und betreibt Client-Software; das Protokoll wählt dann zufällig „einen Validator ... als Block-Proposer in jedem Slot“ aus, während ein zufällig ausgewähltes Komitee anderer Validatoren die Gültigkeit dieses Blocks attestiert ([ethereum.org: Proof-of-stake](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=One%20validator%20is%20randomly%20selected%20to%20be%20a%20block%20proposer%20in%20every%20slot)).

Die **Sybil-Resistenz** kommt aus dem Stake selbst: Viele falsche Validatoren zu erstellen bedeutet nur, dass dasselbe Kapital auf mehr Identitäten verteilt wird, was keinen zusätzlichen Einfluss verschafft. Unehrliches Verhalten, etwa widersprüchliche Blöcke oder gegensätzliche Attestierungen vorzuschlagen, wird durch **Slashing** bestraft: Das Protokoll verbrennt einen Teil des Stakes des betreffenden Validators ([ethereum.org: Proof-of-stake](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=Two%20primary%20behaviors%20can%20be%20considered%20dishonest)). Ethereum finalisiert Blöcke in Epochen mithilfe eines Checkpoint-Mechanismus (Casper FFG kombiniert mit der Fork-Choice-Regel LMD-GHOST). Das bietet stärkere Finalitätsgarantien als reines PoW, ohne eine BFT-artige Abstimmung in einer einzigen Runde zu benötigen.

Der wesentliche Unterschied zu PoW ist Energie: Staking benötigt keine spezialisierte Hardware, die um das Lösen von Rätseln konkurriert; wie ethereum.org formuliert, „muss nicht viel Energie für Proof-of-Work-Berechnungen eingesetzt werden“ ([ethereum.org: Proof-of-stake](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/#:~:text=there%20is%20no%20need%20to%20use%20lots%20of%20energy%20on%20proof)). Das Ausmaß dieser Einsparung ist gut belegt: Eine unabhängige Analyse (CCRI) ergab, dass Ethereums Übergang von PoW zu PoS im September 2022 — „The Merge“ — den annualisierten Stromverbrauch des Netzwerks um mehr als 99.988% senkte ([ethereum.org: Energy consumption](https://ethereum.org/en/energy-consumption/#:~:text=CCRI%20estimates%20that%20The%20Merge%20reduced%20Ethereum%27s%20annualized%20electricity%20consumption%20by%20more%20than%2099.988%25)). **Beispiel-Chains:** Ethereum, Cardano, Solana (nutzt PoS neben Proof of History für wirtschaftliche Sicherheit) und Polkadot.

---

## Delegated Proof of Stake

Delegated Proof of Stake (DPoS) behält das Staking-Modell bei, fügt aber eine Wahlebene hinzu. Statt jeden Staker einzeln zum Vorschlagen von Blöcken zuzulassen, stimmen Token-Inhaber mit ihrem Stake für eine kleine Gruppe von **Delegierten** (auch Witnesses oder Block-Produzenten genannt); nur diese gewählte Gruppe produziert tatsächlich Blöcke. Die Stimmkraft wächst mit der Anzahl der gehaltenen Token. Die Fachliteratur erklärt den Kernmechanismus treffend: „Die Stimmkraft jedes Token-Inhabers ist proportional zur Anzahl der von ihm gehaltenen Token.“ Zudem laufen die Wahlen kontinuierlich, sodass Inhaber ihre Stimmen jederzeit neu zuweisen oder leistungsschwache Delegierte abwählen können ([Binance Academy: Delegated Proof of Stake erklärt](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)).

Die **Sybil-Resistenz** bleibt Stake-basiert — Stimmen werden nach gehaltenen Token und nicht nach Kontenanzahl gewichtet —, doch die Block*produktion* ist in einem kleinen, gewählten Komitee konzentriert, statt allen Stakern offenzustehen. Genau das ist der Zweck dieser Konzentration: Weil die aktive Validator-Gruppe klein ist und im Voraus bekannt ist, können DPoS-Netzwerke „schnelle Blockzeiten, oft deutlich unter drei Sekunden“ erreichen ([Binance Academy: Delegated Proof of Stake erklärt](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)). Der Preis dafür ist eine geringere Dezentralisierung: Die meisten DPoS-Netzwerke arbeiten mit ungefähr „21 bis 101 aktiven Validatoren“, einer weitaus kleineren Gruppe als den Hunderten oder Tausenden von Validatoren, die für offene PoS-Netzwerke typisch sind. Wahlmüdigkeit kann zudem dazu führen, dass sich dieselben Delegierten mit der Zeit festsetzen ([Binance Academy: Delegated Proof of Stake erklärt](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)). **Beispiel-Chains:** EOS, TRON und — in modifizierter Form — viele frühe Anwendungschains auf dem Cosmos SDK.

---

## BFT-artiger Konsens (Tendermint / CometBFT, PBFT)

![Ein Rat aus Validatoren sitzt an einem Tisch; mehr als zwei Drittel heben grüne Paddel mit Häkchen zur Zustimmung, wodurch ein Block mit Schloss-Symbol sofort finalisiert wird](../../assets/blockchain-consensus-mechanisms-03-bft.jpg)

Byzantine Fault Tolerant (BFT)-Konsens verfolgt einen ganz anderen Ansatz: Statt zu konkurrieren oder für jeden Block zufällig einen Proposer auszuwählen, führt eine bekannte Gruppe von Validatoren ausdrückliche Abstimmungsrunden durch und finalisiert einen Block erst, wenn eine Supermehrheit — typischerweise mehr als zwei Drittel der Stimmkraft — ihm in derselben Runde zustimmt. **CometBFT** (der Nachfolger von Tendermint Core, der Konsens-Engine hinter dem Cosmos SDK) beschreibt sich als System, das „byzantinisch fehlertolerante (BFT-)Replikation von Zustandsautomaten (SMR) für beliebige deterministische, endliche Zustandsautomaten“ ausführt ([Cosmos-Dokumentation: CometBFT](https://docs.cosmos.network/cometbft)). Das bedeutet: Es verwandelt eine Gruppe unabhängig betriebener Nodes in ein einheitliches, repliziertes Ledger, selbst wenn einige davon fehlerhaft oder böswillig sind.

Die **Sybil-Resistenz** in Tendermint-artigen Chains wird typischerweise durch Staking ergänzt (Validatoren werden wie bei PoS nach Stake gewichtet), während das BFT-Abstimmungsprotokoll selbst die **Finalität** liefert: Sobald ein Block in einer Runde die erforderliche Supermehrheit an Validator-Signaturen sammelt, wird er finalisiert und kann nicht wie ein PoW-Block reorganisiert werden. Das führt zu einer schnellen, praktischen Abwicklung — das Cosmos Network hebt für CometBFT-basierte Chains eine Transaktionsabwicklung unter einer Sekunde hervor ([Cosmos Network](https://cosmos.network/#:~:text=%3C1%20second%20transaction%20settlement)) — im Gegensatz zum Bestätigungsmodell von PoW, das auf Warten beruht. Der Nachteil ist, dass BFT-Protokolle eine bekannte und in ihrer Größe begrenzte Validator-Gruppe benötigen (der Kommunikationsaufwand wächst mit der Anzahl der Validatoren); dadurch ist begrenzt, wie viele Validatoren direkt teilnehmen können. **Beispiel-Chains:** Cosmos Hub und andere Chains auf dem Cosmos SDK (CometBFT), Binance Chain sowie erlaubnispflichtige Unternehmens-Ledger, die auf dem ursprünglichen Design der Practical Byzantine Fault Tolerance (PBFT) beruhen.

---

## Darüber hinaus: Proof of History, Proof of Authority, Proof of Space

Einige weitere Mechanismen runden das Bild ab. Jeder von ihnen löst ein engeres Problem, statt die grundlegende Frage der Sybil-Resistenz zu ersetzen.

**Proof of History (PoH)**, den Solana neben PoS verwendet, ist kein eigenständiger Konsensmechanismus, sondern eine kryptografische Uhr. Er fügt überprüfbare Zeitstempel direkt in die Chain ein, indem „die Daten der zuvor erzeugten Zustände“ wiederholt gehasht werden. Dadurch entsteht eine Sequenz, die belegt, wie viel Zeit zwischen Ereignissen verging, ohne dass Validatoren über die Zeit kommunizieren müssen ([Solana: Proof of History](https://solana.com/news/proof-of-history#:~:text=inserting%20data%20into%20the%20sequence%20by%20appending%20the%20hash%20of%20the%20data%20of%20the%20previously%20generated%20states)). Diese Uhr liefert Validatoren eine überprüfbare Reihenfolge für den Konsens, führt Transaktionen aber nicht selbst parallel aus. Die parallele Ausführung übernimmt **Sealevel**: Solana-Transaktionen deklarieren jedes Konto, aus dem sie lesen oder in das sie schreiben werden. Dadurch kann die Laufzeitumgebung Transaktionen ohne Überschneidungen — sowie Transaktionen, die denselben Zustand nur lesen — gleichzeitig ausführen ([Solana: Sealevel](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=The%20reason%20why%20Solana%20is%20able%20to%20process%20transactions%20in%20parallel,transactions%20that%20are%20only%20reading%20the%20same%20state%20to%20execute%20concurrently%20as%20well)).

**Proof of Authority (PoA)** ersetzt offenes Mining oder stakebasierte Validierung durch eine zugangsbeschränkte Gruppe autorisierter Signierer. Gegenüber PoW senkt dies die Ressourcenkosten der Blockerzeugung erheblich; laut ethereum.org vermeidet PoA den hohen Ressourcenbedarf des PoW-Minings ([ethereum.org: Proof-of-authority](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=as%20it%20overcomes%20the%20need%20for%20high%20quality%20resources%20as%20PoW%20does)). Die Betriebs- oder Sicherheitskosten des Netzwerks entfallen dadurch jedoch nicht. Die Sicherheits- und Governance-Verantwortung verlagert sich auf die Identitäten und den Ruf vertrauenswürdiger Validatoren sowie auf die Regeln für die Aufnahme von Signierern: PoA setzt Vertrauen in bekannte Signierer voraus, das häufig durch KYC oder bekannte Organisationen begründet wird ([ethereum.org: vertrauenswürdige Signierer](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=Proof%2Dof%2Dauthority%20requires%20trusting%20a%20set%20of%20authorized%20signers,if%20a%20validator%20does%20anything%20wrong%2C%20their%20identity%20is%20known)), und bei der von ethereum.org beschriebenen Implementierung stimmen die Signierer über die Aufnahme oder Entfernung anderer Signierer ab ([ethereum.org: Aufnahme von Signierern](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/#:~:text=Each%20signer%20votes%20for%20the%20addition%20or%20removal%20of%20a%20signer%20in%20their%20block%20when%20they%20create%20a%20new%20block)). Dafür wird Dezentralisierung gegen Geschwindigkeit und niedrige Betriebskosten eingetauscht. Deshalb wird PoA überwiegend in privaten Chains, Testnets und lokalen Entwicklungsnetzwerken eingesetzt, nicht in öffentlichen Netzwerken mit gegnerischen Akteuren.

**Proof of Space** (und seine Variante Proof of Space-Time) ersetzt Rechenleistung oder Stake durch zugewiesenen Festplattenspeicher: Teilnehmende weisen nach, dass sie ungenutzten Speicherplatz auf Festplatten reserviert haben, und das Protokoll fordert sie regelmäßig auf zu belegen, dass sie ihn weiterhin vorhalten. Das bietet PoW-ähnliche Sybil-Resistenz bei deutlich geringerem Energieverbrauch, setzt jedoch große Mengen an Speicherhardware voraus. Chia ist das bekannteste Beispiel.

---

## Vergleich der Mechanismen

| Mechanismus | Grundlage der Sybil-Resistenz | Finalität | Energiekosten | Dezentralisierung | Beispiel-Chains |
|---|---|---|---|---|---|
| Proof of Work | Rechenkosten (Hashing) | Probabilistisch (Bestätigungen) | Sehr hoch | Hoch (erlaubnisfreies Mining) | Bitcoin, Litecoin, Dogecoin |
| Proof of Stake | Wirtschaftlicher Stake im Risiko | Über Checkpoints / innerhalb von Epochen nahezu endgültig | Sehr niedrig | Hoch (Hunderttausende Validatoren) | Ethereum, Cardano, Polkadot |
| Delegated Proof of Stake | Nach Stake gewichtete Wahl von Delegierten | Schnell, pro gewähltem Produzenten nahezu sofort | Sehr niedrig | Niedriger (kleine gewählte Validator-Gruppe) | EOS, TRON |
| BFT-artig (Tendermint/CometBFT, PBFT) | Stake oder erlaubnispflichtige Identität + Supermehrheitsabstimmung | Sofort/deterministisch nach Übernahme | Niedrig | Mittel (begrenzte Validator-Gruppe) | Cosmos Hub, Binance Chain |
| Proof of Authority | Geprüfte Identität/Reputation | Schnell, nahezu sofort | Sehr niedrig | Niedrig (kleine vertrauenswürdige Validator-Gruppe) | Private/Unternehmens-Chains, Testnets |
| Proof of Space | Zugewiesene Speicherkapazität | Probabilistisch (blockbasiert) | Niedrig | Mittel (abhängig von Speicherhardware) | Chia |

---

## Wie dies mit tokenisierten Domains zusammenhängt

Konsensmechanismen bilden die unsichtbare Grundlage unter jeder [tokenisierten Domain](/de/blog/what-are-tokenized-domains/). Wenn eine `.com`-, `.ai`- oder `.io`-Domain als [NFT](/de/glossary/nft/) geprägt wird, sichert der Konsens der Chain den On-Chain-Eigentumsnachweis sowie alle dort verzeichneten Token-Übertragungen und Verkaufsabwicklungen. Er ersetzt nicht die Prozesse von Registrar und Registry, die für die Verlängerung der zugrunde liegenden DNS-Domain und den Fortbestand ihrer Registrierung erforderlich sind. Eine auf [Ethereum](/de/glossary/ethereum/) geprägte Domain-NFT übernimmt die Checkpoint-basierten Finalitätsgarantien des Ethereum-PoS; derselbe Vermögenswert auf einer PoW-Chain übernimmt deren probabilistisches Bestätigungsmodell. Transaktionsgebühren und die von Nutzern wahrgenommene Zeit, bis eine Transaktion praktisch als abgewickelt gilt, hängen außerdem von der Ausführungskapazität, der Nachfrage im Netzwerk und davon ab, ob die Abwicklung über L1 oder L2 erfolgt — sie werden nicht allein durch PoW oder PoS bestimmt. Zu verstehen, welcher Mechanismus einer Chain zugrunde liegt, was er tatsächlich absichert und was seine Garantien für Sybil-Resistenz und Finalität bedeuten, gehört zur Bewertung jedes On-Chain-Vermögenswerts, einschließlich tokenisierter Domains.

---

## Quellen und weiterführende Lektüre

- [Bitcoin: Ein elektronisches Peer-to-Peer-Geldsystem (Nakamoto-Whitepaper)](https://bitcoin.org/bitcoin.pdf)
- [ethereum.org — Proof-of-work](https://ethereum.org/en/developers/docs/consensus-mechanisms/pow/)
- [ethereum.org — Proof-of-stake](https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/)
- [ethereum.org — Proof-of-authority](https://ethereum.org/en/developers/docs/consensus-mechanisms/poa/)
- [ethereum.org — Energieverbrauch](https://ethereum.org/en/energy-consumption/)
- [Cosmos-Dokumentation — CometBFT](https://docs.cosmos.network/cometbft)
- [Cosmos Network](https://cosmos.network/)
- [Binance Academy — Delegated Proof of Stake erklärt](https://www.binance.com/en/academy/articles/delegated-proof-of-stake-explained)
- [Solana — Proof of History](https://solana.com/news/proof-of-history)
- [Solana — Sealevel: Tausende Smart Contracts parallel verarbeiten](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
