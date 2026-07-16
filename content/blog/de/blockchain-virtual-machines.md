---
title: "Die wichtigsten virtuellen Maschinen für Blockchains: EVM, SVM, MoveVM, WebAssembly/RISC-V und CairoVM"
date: '2026-07-02'
language: de
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 30
format: roundup
description: "Ein Leitfaden zu den wichtigsten virtuellen Maschinen für Blockchains — EVM, SVM, MoveVM, WebAssembly- und RISC-V-VMs sowie CairoVM — mit einem Vergleich von Sprachen, Ausführungsmodellen und Ökosystemen."
ogImage: ../../assets/blockchain-virtual-machines-og.jpg
keywords: ['virtuelle maschine blockchain', 'virtuelle maschinen blockchain', 'evm', 'ethereum virtual machine', 'svm', 'solana virtual machine', 'sealevel', 'movevm', 'move-sprache', 'wasm blockchain', 'cosmwasm', 'polkavm', 'cairovm', 'cairo-sprache', 'starknet', 'smart-contract-sprache', 'parallele ausführung blockchain', 'evm-kompatibel', 'ausführungsumgebung blockchain', 'blockchain-zustandsmaschine']
relatedArticles:
  - /de/blog/blockchain-consensus-mechanisms/
  - /de/blog/blockchain-scaling-approaches/
  - /de/blog/blockchain-cryptographic-primitives/
  - /de/blog/blockchain-privacy-technologies/
  - /de/blog/what-are-tokenized-domains/
relatedTopics:
  - /de/topics/web3-foundations/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/tokenize-your-com/
  - /de/series/domain-flipping-skills/
relatedGlossary:
  - /de/glossary/ethereum-virtual-machine/
  - /de/glossary/webassembly/
  - /de/glossary/smart-contract/
  - /de/glossary/ethereum/
  - /de/glossary/gas/
---

Jeder [Smart Contract](/de/glossary/smart-contract/) muss irgendwo ausgeführt werden. Dieses „irgendwo“ ist eine virtuelle Maschine (VM) für Blockchains — das abgeschottete Programm, das jeder Node im Netzwerk identisch ausführt, sodass dieselbe Eingabe unabhängig davon, wer sie ausführt, immer dieselbe Ausgabe erzeugt. Die VM, auf der Sie aufbauen, prägt fast alles an einer Chain: in welchen Sprachen Sie schreiben können, ob Transaktionen gleichzeitig oder nur nacheinander laufen und wie viel vom bestehenden Entwicklerökosystem Sie vom ersten Tag an nutzen können.

Dieser Leitfaden führt durch fünf VM-Familien, die zusammen einen großen Teil der Smart-Contract-Aktivität im heutigen [Web3](/de/glossary/web3/) antreiben: die [Ethereum Virtual Machine](/de/glossary/ethereum-virtual-machine/) (EVM), Solanas SVM, die von Aptos und Sui verwendete MoveVM, VMs mit portablem Bytecode auf Basis von [WebAssembly](/de/glossary/webassembly/) oder RISC-V wie CosmWasm und PolkaVM sowie Starknets CairoVM.

---

## Was ist eine virtuelle Maschine für Blockchains, und warum ist sie wichtig?

Eine Blockchain-VM ist eine deterministische, abgeschottete Ausführungsumgebung: Jeder Full Node lädt dieselben Transaktionen herunter, führt sie durch dieselbe VM und erhält denselben resultierenden [On-Chain](/de/glossary/on-chain/)-Zustand. Die Ethereum-Dokumentation beschreibt die EVM als „eine dezentrale virtuelle Umgebung, die Code konsistent und sicher über alle Ethereum-Nodes hinweg ausführt“ ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20is%20a%20decentralized,mechanics%20of%20how%20they%20work)) — eine Beschreibung, die sich auf jede VM in diesem Leitfaden übertragen lässt.

Zwei Eigenschaften bestimmen die Design-Abwägungen einer VM:

- **Sprache und Toolchain.** In welchen Sprachen können Entwickler Contracts schreiben, und wie groß ist die vorhandene Bibliothek aus geprüftem Code, Werkzeugen und Fachkräften, die sie bereits beherrschen?
- **Ausführungsmodell.** Verarbeitet die VM Transaktionen strikt einzeln (sequenziell), oder können unabhängige Transaktionen gleichzeitig auf mehreren CPU-Kernen laufen (parallele Ausführung)? Über sequenzielle Ausführung lässt sich einfacher nachdenken; parallele Ausführung steigert den theoretischen Durchsatz, erhöht aber die Planungs-Komplexität.

Diese Entscheidungen wirken sich auf Gaskosten, das Verhalten bei Überlastung und darauf aus, welche bestehenden Contracts und Tools ohne Neuschreibung portiert werden können. Deshalb ist die Frage „Welche VM?“ eine der ersten, die jede neue Chain oder jedes darauf aufgebaute [tokenisierte](/de/glossary/tokenize/) Asset beantworten muss.

---

## EVM (Ethereum Virtual Machine)

![Flachvektordiagramm der EVM als Stack-Maschine mit einer Ausführungsspur: Ein Befehlszeiger legt Werte auf einem vertikalen Stack ab und nimmt sie herunter, während eine Gasanzeige die Ausführungskosten verfolgt](../../assets/blockchain-virtual-machines-01-evm-stack.jpg)

Die EVM wurde 2015 mit [Ethereum](/de/glossary/ethereum/) eingeführt und gehört heute zu den am weitesten verbreiteten VMs für Smart Contracts. Sie ist eine **Stack-basierte** Maschine: Laut Ethereum-Dokumentation arbeitet sie als „Stack-Maschine mit einer Tiefe von 1024 Einträgen“, wobei jeder Eintrag ein 256-Bit-Wort ist ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20executes%20as%20a,256%2Dbit%20word)). Der Contract-Zustand liegt in einem Merkle-Patricia-Trie, der jedem Konto zugeordnet ist; auch der globale Chain-Zustand ist als modifizierter Merkle-Patricia-Trie organisiert, der alle Konten per Hash verknüpft ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Ethereum%20uses%20a%20modified%20Merkle,linked%20by%20hashes)).

**Sprache.** Contracts werden fast immer in **Solidity** geschrieben, das Ethereums eigene Dokumentation als „objektorientierte Hochsprache für die Implementierung von Smart Contracts“ beschreibt und dessen Syntax stark von C++ beeinflusst ist ([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Solidity)). **Vyper**, eine „Python-artige“ Sprache, die bewusst Funktionen reduziert, um Contracts leichter prüfbar zu machen, ist die wichtigste Alternative ([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Vyper)).

**Ausführungsmodell.** Die EVM verarbeitet Transaktionen innerhalb eines Blocks **sequenziell** — eine nach der anderen in fester Reihenfolge. Das hält die Zustandsübergangslogik einfach und gut prüfbar, begrenzt aber den Durchsatz auf der Basisschicht.

**Gas.** Jede Operation kostet [Gas](/de/glossary/gas/), Ethereums Einheit für „den für Operationen erforderlichen Rechenaufwand“. Das bepreist die Ausführung und schützt das Netzwerk vor Spam oder Endlosschleifen ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Since%20each%20transaction%20is%20broadcast,uses%20gas)).

**Besondere Stärke und Reichweite.** Der eigentliche Burggraben der EVM ist ihr Ökosystem: Sie ist die in Krypto am häufigsten implementierte VM, und Dutzende Layer 2s sowie unabhängige Chains (Arbitrum, Optimism, Base, Polygon, BNB Chain, Avalanche C-Chain) liefern **EVM-kompatible** oder **EVM-äquivalente** Umgebungen aus. Dadurch lassen sich bestehende Solidity-Contracts, Wallets und Tools mit wenigen oder ganz ohne Änderungen bereitstellen.

---

## SVM (Solana / Sealevel)

![Flachvektordiagramm mit dem Kontrast einer mehrspurigen Autobahn voller parallel fahrender Transaktionsautos und einer einspurigen Straße mit wartenden Autos; es veranschaulicht Solanas parallele Sealevel-Ausführung gegenüber sequenzieller Ausführung](../../assets/blockchain-virtual-machines-02-parallel-execution.jpg)

Solanas Laufzeitumgebung **Sealevel** beruht auf einer bestimmten Annahme: Die meisten Transaktionen berühren getrennte Teile des Zustands und können daher gleichzeitig statt einzeln ausgeführt werden. Solanas eigene Ankündigung beschreibt Sealevel als „Solanas Laufzeitumgebung für parallele Smart Contracts“, die „Tausende Contracts parallel verarbeiten kann und dabei so viele Kerne verwendet, wie dem Validator zur Verfügung stehen“ ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sealevel%E2%80%94Parallel%20Smart%20Contracts%20Runtime)).

**Wie Parallelität funktioniert.** Solana-Transaktionen müssen im Voraus jedes Konto angeben, das sie lesen oder schreiben werden. Diese Angabe ermöglicht die Planung: Die Laufzeit kann „Millionen ausstehender Transaktionen sortieren“ und „alle sich nicht überschneidenden Transaktionen parallel einplanen“, einschließlich mehrerer Transaktionen, die dasselbe Konto nur *lesen* ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sort%20millions%20of%20pending%20transactions)). Zwei Transaktionen werden zueinander sequenziell ausgeführt, wenn sie auf dasselbe Konto zugreifen und mindestens eine von ihnen darauf schreibt; Transaktionen, die dasselbe Konto ausschließlich lesen, können weiterhin gleichzeitig laufen.

**Sprache und VM-Interna.** Solana-Programme — so nennt Solana Smart Contracts — werden in eine Variante des Berkeley-Packet-Filter-Bytecodes kompiliert. Solana Labs beschreibt die On-Chain-VM als eine Wahl für „eine Variante des Berkeley Packet Filter (BPF)-Bytecodes“ ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Berkeley%20Packet%20Filter)). Programme werden am häufigsten in **Rust** geschrieben, unterstützt werden auch C und C++.

**Besondere Stärke.** Weil die Parallelität auf Kontoebene eine Eigenschaft der Laufzeit ist und nicht von jedem Contract-Autor von Hand umgesetzt werden muss, kann Solana hohen Durchsatz aufrechterhalten, ohne die Ausführung Off-Chain zu verlagern. Der Preis ist ein strengeres Modell für die Kontendeklaration, das die Art verändert, wie Contracts im Vergleich zum frei gestaltbaren Speicher der EVM geschrieben werden.

---

## MoveVM (Aptos & Sui)

![Flachvektordiagramm einer Münze, die wie eine physische Ressource zwischen zwei Kontoboxen von Hand zu Hand gereicht wird; Schutzsymbole „Kopieren eingeschränkt“ und „kein implizites Verwerfen“ veranschaulichen Moves durch Abilities gesteuertes Ressourcenmodell](../../assets/blockchain-virtual-machines-03-move-resource-v2.jpg)

**Move** ist eine Smart-Contract-Sprache, die ursprünglich für Metas Diem-Projekt entwickelt wurde und heute die Basisschicht für **Aptos** und **Sui** bildet, die jeweils eine eigene MoveVM-Variante betreiben. Die Dokumentation von Aptos beschreibt Move als „eine sichere Programmiersprache für Web3, die Knappheit und Zugriffskontrolle in den Mittelpunkt stellt“ ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Move%20is%20a%20safe%20and,scarcity%20and%20access%20control)).

**Das Ressourcenmodell.** Die prägende Idee von Move ist, digitale Assets als **Ressourcen** zu behandeln — spezielle Struct-Typen, bei denen das Typsystem der Sprache garantiert, dass sie „nicht versehentlich dupliziert oder verworfen werden können“ ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Resources%20cannot%20be%20copied%2C%20they,structs%20cannot%20be%20accidentally%20duplicated)). Ein als Move-Ressource modellierter Token oder NFT kann nur kopiert werden, wenn sein Typ die Ability `copy` besitzt, und nur implizit verworfen werden, wenn er die Ability `drop` besitzt; ungültige Verwendungen weist der Compiler zurück. Das Modul, das den Typ definiert, kann dennoch neue Werte durch Packen erzeugen, sie durch Entpacken explizit verbrauchen und kontrollierte Mint- oder Burn-Funktionen bereitstellen ([Move-Abilities in der Aptos-Dokumentation](https://aptos.dev/en/build/smart-contracts/book/abilities), [Structs und Modulprivilegien im Move Book](https://aptos-labs.github.io/move-book/structs-and-enums.html)). Die Abilities verhindern versehentliche Kopier- und Verwerfungsfehler, beweisen jedoch weder die Korrektheit der übrigen Asset-Logik eines Contracts noch schließen sie jeden möglichen Fehler beim Doppelausgeben oder Verbrennen aus.

**Parallele Ausführung.** Aptos führt Move-Contracts über **Block-STM** aus, das laut Dokumentation „die gleichzeitige Ausführung von Transaktionen ohne Eingaben des Nutzers“ ermöglicht. Die Laufzeit leitet also während der Ausführung ab, welche Transaktionen unabhängig sind, statt die von Solana verwendeten deklarierten Kontolisten zu verlangen ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Parallelism%20via%20Block,input%20from%20the%20user)).

**Suis Objektmodell.** Sui führt Moves Ressourcenidee mit einer objektzentrierten Speicherschicht weiter: „Ein Objekt ist eine grundlegende Speichereinheit im Netzwerk. Jede Ressource, jedes Asset und jedes Datenelement On-Chain ist ein Objekt“, das über eine eindeutige ID adressierbar ist, statt im Key-Value-Store eines Kontos zu liegen ([Sui-Objektmodell](https://docs.sui.io/develop/sui-architecture/object-model)). Das aktuelle Objektmodell von Sui kennt fünf Eigentumsformen: **adressgebunden** (address-owned), **unveränderlich** (immutable), **konsensgebunden an eine Adresse** (consensus-address-owned, Party), **geteilt** (shared) und **eingebettet** (wrapped). Den direkten Fast Path von Sui ohne Konsensreihenfolge kann eine Transaktion nur nutzen, wenn alle veränderlichen Objekt-Inputs adressgebunden und alle anderen Objekt-Inputs unveränderlich sind. Konsensgebundene und geteilte Objekte werden selbst dann durch den Konsens sequenziert, wenn eine Transaktion sie nur liest; nicht miteinander in Konflikt stehende reine Lesezugriffe können dennoch gleichzeitig ausgeführt werden ([adressgebundene Objekte in Sui](https://docs.sui.io/develop/objects/object-ownership/address-owned), [Party-Objekte](https://docs.sui.io/develop/objects/object-ownership/party), [Lutris-Paper](https://docs.sui.io/paper/sui-lutris.pdf)). Unabhängige Fast-Path-Transaktionen können daher gleichzeitig verarbeitet werden, ohne jedes Objekt als global geteilten Zustand zu behandeln.

**Besondere Stärke.** Moves Ressourcentypen verhindern, dass generischer Code einen Wert ohne `copy` kopiert oder ihn ohne `drop` aus dem Gültigkeitsbereich fallen lässt. Das definierende Modul kann dennoch Werte erzeugen und sie durch Entpacken explizit vernichten. Diese Prüfungen beweisen daher weder die Erhaltung von Assets noch schließen sie jeden Fehler in der Asset-Logik aus. Aptos und Sui kombinieren dieses Sicherheitsmodell zudem mit paralleler Ausführung, die von Anfang an eingeplant und nicht nachträglich ergänzt wurde.

---

## VMs mit portablem Bytecode (CosmWasm und PolkaVM)

Statt einen Blockchain-spezifischen Bytecode zu definieren, verwenden einige Chains portable, universell einsetzbare Befehlsformate. **CosmWasm** führt WebAssembly aus, während **PolkaVM** von RISC-V abgeleiteten Bytecode ausführt; PolkaVM ist daher keine WASM-basierte VM. Der WebAssembly-Standard beschreibt Wasm als „binäres Befehlsformat für eine Stack-basierte virtuelle Maschine“, das als „portables Kompilierungsziel für Programmiersprachen“ konzipiert ist und „nahezu mit nativer Geschwindigkeit“ ausgeführt werden soll ([webassembly.org](https://webassembly.org/#:~:text=WebAssembly%20(abbreviated%20Wasm)%20is%20a,wide%20range%20of%20platforms)). Wenn Wasm die Contract-VM bildet, kann jede Sprache mit einem Wasm-Kompilierungsziel — Rust, C, C++, Go — grundsätzlich einen bereitstellbaren Contract erzeugen.

**CosmWasm.** Als führende Wasm-basierte Smart-Contract-Plattform im Cosmos-Ökosystem bezeichnet sich CosmWasm selbst als „sichere, leistungsfähige und interoperable Smart-Contract-Plattform für die Multi-Chain-Welt“ ([cosmwasm.com](https://www.cosmwasm.com/#:~:text=Secure%2C%20performant%2C%20interoperable%20smart%20contract,platform%20for%20the%20multi%2Dchain%20world)). Contracts werden in **Rust** geschrieben und laufen auf „einer hochoptimierten Web-Assembly-Laufzeit“ ([cosmwasm.com](https://www.cosmwasm.com/#:~:text=highly%20optimized%20Web%20Assembly%20runtime)). CosmWasm ist auf Dutzenden Cosmos-SDK-Chains bereitgestellt, darunter Osmosis, Neutron, Injective, Secret Network und Terra, und übernimmt Cosmos' natives IBC-Cross-Chain-Messaging.

**PolkaVM.** Polkadots neuere Smart-Contract-VM geht einen anderen Weg: Statt rohes Wasm auszuführen, hat Parity PolkaVM in der eigenen Repository-Beschreibung als „allgemeine virtuelle Maschine auf Nutzerebene, die auf RISC-V basiert“ gebaut ([github.com/paritytech/polkavm](https://github.com/paritytech/polkavm#:~:text=PolkaVM%20is%20a%20general%20purpose,level%20RISC%2DV%20based%20virtual%20machine)). Die Begründung in der ink!-Dokumentation ist Leistung: RISC-V-Ausführung „hängt mit Transaktionsdurchsatz und Transaktionskosten zusammen“ und ermöglicht eine schnellere, günstigere Ausführung als der zuvor von ink! verwendete Wasm-Interpreter ([use.ink](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/#:~:text=performance%20correlates%20with%20transaction%20throughput)). Bemerkenswert ist, dass Polkadots PolkaVM-Stack (unter dem Namen „Revive“) auch eine EVM-Interpreterebene bereitstellt, sodass Solidity-Contracts auf demselben RISC-V-Backend laufen können.

**Besondere Stärke.** VMs mit portablem Bytecode ersetzen einen Blockchain-spezifischen Bytecode durch etablierte, universell einsetzbare Kompilierungsziele. Insbesondere Rust bringt starke Garantien für Speichersicherheit in Contract-Code, und sowohl Wasm als auch RISC-V profitieren von Tools, die für wesentlich größere Anwendungsfälle außerhalb der Blockchain entwickelt wurden. CosmWasm und PolkaVM bleiben dabei unterschiedliche Architekturen: Erstere führt Wasm aus, Letztere von RISC-V abgeleiteten Bytecode.

---

## CairoVM (Starknet)

**Cairo** ist die speziell für die Erzeugung von Zero-Knowledge-Proofs entwickelte Smart-Contract-Sprache und VM, die **Starknet**, ein Ethereum-[Layer 2](/de/glossary/layer-2/), zugrunde liegt. Starknets Dokumentation formuliert das Designziel ausdrücklich: „Cairo ist eine STARK-freundliche Von-Neumann-Architektur, die Gültigkeitsbeweise für beliebige Berechnungen erzeugen kann“ ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Cairo%20is%20a%20STARK,for%20arbitrary%20computations)). „STARK-freundlich“ bedeutet, dass der Befehlssatz „für das STARK-Beweissystem optimiert ist und zugleich mit anderen Backends für Beweissysteme kompatibel bleibt“ ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Being%20STARK,other%20proof%20system%20backends)). Das ist die entgegengesetzte Priorität zur EVM oder SVM, die zunächst für Ausführung entworfen und erst später für Skalierung mit Beweissystemen ergänzt wurden.

**Ausführungsmodell.** Cairo kompiliert zu einem Turing-vollständigen Befehlssatz (der „Cairo-Maschine“), der als Satz algebraischer Zwischendarstellungen spezifiziert ist. Dadurch lässt sich die Ausführungsspur jedes Cairo-Programms in einen kompakten, auf Ethereum L1 überprüfbaren STARK-Proof umwandeln ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=At%20its%20core%2C%20Cairo%20is,arbitrary%20code%29%20through%20the%20Cairo%20machine)). So kann Starknet Tausende Transaktionen Off-Chain bündeln und einen kompakten Korrektheitsbeweis zurück auf Ethereum posten, statt jede Transaktion erneut auszuführen.

**Besondere Stärke.** Beweisfreundlichkeit war Cairos grundlegende Designvorgabe: Befehlssatz und Ausführungsspur sind auf effiziente STARK-Beweise ausgelegt. Die tatsächlichen Beweiskosten hängen jedoch vom Programm, der Prover-Implementierung, den Parametern des Beweissystems und dem Vergleichsmaßstab ab; sie liegen daher nicht bei jeder zkEVM-Arbeitslast zwangsläufig niedriger. Der Nachteil ist ein neueres, kleineres Sprachökosystem und für Entwickler aus Ethereum eine steilere Lernkurve als bei Solidity.

---

## Vergleichstabelle

| VM | Contract-Sprache(n) | Ausführungs- / Zustandsmodell | Parallele Ausführung | Größe des Ökosystems | EVM-kompatibel |
|---|---|---|---|---|---|
| **EVM** | Solidity, Vyper | Stack-Maschine; Konto-/Speicherzustand in einem Merkle-Patricia-Trie | Nein — sequenziell innerhalb eines Blocks | Am größten; das Standardziel für L2s und App-Chains | Nativ |
| **SVM (Solana)** | Rust, C, C++ | Von BPF abgeleiteter Bytecode; kontobasierter Zustand mit deklarierten Lese-/Schreibmengen | Ja — Sealevel plant sich nicht überschneidende Transaktionen gleichzeitig | Groß, schnell wachsend, überwiegend Solana-nativ | Nein (eigenes Ökosystem) |
| **MoveVM (Aptos/Sui)** | Move | Ressourcen-typisierte Objekte; Aptos verwendet Block-STM, Sui mehrere Eigentumsformen mit direkten und durch Konsens sequenzierten Pfaden | Ja — zur Laufzeit abgeleitet (Aptos) oder über Objekteigentum (Sui) | Kleiner, wachsend; zwei unabhängige Move-Ökosysteme | Nein |
| **Portabler Bytecode (CosmWasm, PolkaVM)** | Rust (CosmWasm); Rust-/C-/RISC-V-Toolchains (PolkaVM) | Wasm-Bytecode (CosmWasm) oder RISC-V-Bytecode (PolkaVM) | Chain-abhängig; keine universelle Eigenschaft eines der beiden Befehlsformate | Mittelgroß; über viele Cosmos-Chains und die Polkadot-Parachains verteilt | PolkaVM/Revive ergänzt eine EVM-Interpreterebene; CosmWasm ist nicht EVM-kompatibel |
| **CairoVM (Starknet)** | Cairo | Turing-vollständige, AIR-basierte Maschine für STARK-Proofs | Nicht das primäre Designziel — auf Beweisbarkeit, nicht Parallelität optimiert | Die kleinste der fünf, wächst aber mit Starknets L2-Aktivität | Nein (zkEVM-Projekte binden Solidity-Contracts separat ein) |

---

## Verbindung zu tokenisierten Domains

Welche VM eine Chain ausführt, ist für die Infrastruktur [tokenisierter Domains](/de/glossary/tokenized-domain/) unmittelbar relevant. Eine als [NFT](/de/glossary/nft/) dargestellte Domain ist im Kern ein Smart Contract, der durchsetzt, wem ein Token gehört und was damit geschehen darf. Diese Logik profitiert von Moves Compile-Zeit-Beschränkungen für das Kopieren von Ressourcen und ihr implizites Verwerfen; mit dem ausgereiften Tooling der EVM lässt sie sich zugleich einfach prüfen und in bestehende Wallets und Marktplätze integrieren. Namefis Tokenisierungsmodell zielt bewusst auf das EVM-Ökosystem: EVM-Kompatibilität bedeutet, dass das Eigentums-NFT einer tokenisierten `.com`- oder `.ai`-Domain direkt mit dem bestehenden Universum aus EVM-Wallets, Marktplätzen und DeFi-Protokollen funktioniert, statt für jede neue VM eine individuelle Integration zu benötigen. Entdecken Sie tokenisierte Domains auf [namefi.io](https://namefi.io).

---

## Quellen und weiterführende Lektüre

- [Die Ethereum Virtual Machine (EVM) — ethereum.org](https://ethereum.org/en/developers/docs/evm/)
- [Smart-Contract-Sprachen — ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/)
- [Sealevel — parallele Verarbeitung Tausender Smart Contracts — Solana](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
- [Move — Aptos-Dokumentation](https://aptos.dev/en/network/blockchain/move)
- [Move-Abilities — Aptos-Dokumentation](https://aptos.dev/en/build/smart-contracts/book/abilities)
- [Structs und Enums — Move Book](https://aptos-labs.github.io/move-book/structs-and-enums.html)
- [Objektmodell — Sui-Dokumentation](https://docs.sui.io/develop/sui-architecture/object-model)
- [Adressgebundene Objekte — Sui-Dokumentation](https://docs.sui.io/develop/objects/object-ownership/address-owned)
- [Party-Objekte — Sui-Dokumentation](https://docs.sui.io/develop/objects/object-ownership/party)
- [Sui Lutris](https://docs.sui.io/paper/sui-lutris.pdf)
- [CosmWasm](https://www.cosmwasm.com/)
- [PolkaVM — GitHub (paritytech)](https://github.com/paritytech/polkavm)
- [Warum RISC-V und PolkaVM für Smart Contracts — ink!-Dokumentation](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/)
- [Cairo-Architektur — Die Programmiersprache Cairo / Starknet](https://www.starknet.io/cairo-book/ch201-architecture.html)
- [WebAssembly](https://webassembly.org/)
