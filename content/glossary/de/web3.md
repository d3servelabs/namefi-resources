---
title: Web3
date: '2025-06-30'
language: de
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: Eine Vision des Internets auf öffentlichen Blockchains, bei der Nutzer ihre Daten, Assets und Identität durch eigene Schlüssel kontrollieren – nicht über Plattform-Konten.
keywords: ['Web3', 'dezentrales Web', 'Blockchain-Internet', 'Nutzereigentum', 'Peer-to-Peer', 'Dezentralisierung', 'Kryptowährung', 'Smart Contracts', 'DeFi', 'NFT']
level: 2
sources:
  - https://ethereum.org/en/web3/
  - https://web3.foundation/about/
  - https://en.wikipedia.org/wiki/Web3
  - https://www.wired.com/story/web3-blockchain-decentralization-explained/
relatedArticles:
  - /de/blog/what-are-tokenized-domains/
  - /de/blog/onchain-domain-custody-and-recovery/
  - /de/blog/the-badgerdao-frontend-attack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/domain-flipping-skills/
relatedGlossary:
  - /de/glossary/icann/
  - /de/glossary/registrar/
  - /de/glossary/dns/
  - /de/glossary/registry/
  - /de/glossary/tld/
---

**Web3** (auch *Web 3.0* geschrieben) ist ein vorgeschlagenes Paradigma für das Internet, bei dem die Kerninfrastruktur auf öffentlichen [Blockchain](/de/glossary/blockchain/)-Netzwerken betrieben wird. Teilnehmer können dabei ihre Daten, digitalen Assets und Online-Identitäten durch kryptografische Schlüssel besitzen und kontrollieren – anstatt auf Konten zu setzen, die von zentralisierten Plattformen verwaltet werden.

## Wie sich Web3 von Web1 und Web2 unterscheidet

Der Begriff wird häufig anhand eines Drei-Generationen-Modells des Webs erklärt:

- **Web1 (≈ 1991–2004)** — statische, nur lesbare Seiten. Nutzer konsumierten Inhalte, die von Webmastern veröffentlicht wurden; Interaktivität oder nutzergenerierte Inhalte gab es kaum.
- **Web2 (≈ 2004–heute)** — das partizipative, plattformgetriebene Web. Soziale Netzwerke, Suchmaschinen und Cloud-Dienste ermöglichen es jedem, Inhalte zu veröffentlichen und zu interagieren – die zugrundeliegenden Daten, Identitäten und Monetarisierungsflüsse werden jedoch von einer kleinen Anzahl großer Plattformen (Google, Meta, Amazon und ihresgleichen) besessen und kontrolliert.
- **Web3 (vorgeschlagen)** — ein Lesen/Schreiben/Besitzen-Web. Nutzer halten ihre eigenen Schlüssel, tragen ihre Identität und Assets plattformübergreifend ohne einen zentralen Verwahrer und interagieren über offene Protokolle statt proprietärer APIs.

Der Begriff wurde [von Ethereum-Mitgründer Gavin Wood 2014 geprägt](https://ethereum.org/en/web3/), um eine Reihe von Technologien zu beschreiben, die seiner Meinung nach notwendig wären, um ein weniger vertrauensabhängiges Internet aufzubauen. Im Zeitraum 2020–2022 gewann der Begriff breite Aufmerksamkeit, parallel zum Wachstum von [DeFi](/de/glossary/defi/) und NFT-Märkten.

## Kerntechnologien

Web3-Anwendungen werden typischerweise auf einer Kombination der folgenden Technologien aufgebaut:

- **[Smart Contracts](/de/glossary/smart-contract/)** — selbst ausführender Code, der [On-Chain](/de/glossary/on-chain/) eingesetzt wird und Regeln ohne einen zentralisierten Betreiber durchsetzt. Sie sind das grundlegende Primitiv für dezentralisierte Anwendungen (dApps).
- **Öffentliche Blockchains** — erlaubnisfreie, nur-anhängige Ledger (Ethereum ist die meistgenutzte für allgemeine Anwendungen), die eine gemeinsame Wahrheitsquelle ohne vertrauenswürdigen Vermittler bereitstellen.
- **Kryptografische Wallets** — Software (oder Hardware), die private Schlüssel verwaltet und Transaktionen signiert. Eine [Wallet](/de/glossary/wallet/)-Adresse fungiert als universelle, übertragbare Identität über kompatible Anwendungen hinweg.
- **Token und Tokenisierung** — die Möglichkeit, Assets zu [tokenisieren](/de/glossary/tokenize/), einschließlich fungible Währungen, Governance-Rechte oder einzigartige digitale Objekte (NFTs), als Einträge in einem öffentlichen Ledger, den jede Anwendung lesen und verifizieren kann.
- **Dezentralisierter Speicher** — Protokolle wie IPFS und Arweave, die Inhalte über viele Knoten hinweg replizieren, sodass keine einzelne Entität sie zensieren oder entfernen kann.
- **[DAOs](/de/glossary/dao/) (Dezentralisierte Autonome Organisationen)** — On-Chain-Entitäten, deren Regeln und Vermögen kollektiv von Token-Inhabern verwaltet werden, anstatt von einem Vorstand.

## Identität und Namensgebung

Einer der strukturellen Unterschiede zwischen Web2 und Web3 betrifft die Behandlung von Identität. In Web2 besteht eine Identität aus Benutzername und Passwort, die in der Datenbank eines Unternehmens gespeichert sind – die Plattform kann sie jederzeit deaktivieren. In Web3 wird die Identität von einem öffentlich/privaten Schlüsselpaar abgeleitet, das der Inhaber kontrolliert.

Für Menschen lesbare Benennungsebenen, wie der [Ethereum Name Service (ENS)](/de/glossary/ens/), ordnen kryptografische Adressen lesbaren Namen zu (z. B. `alice.eth`) in einem Register, das vollständig On-Chain lebt. Diese Namen können gleichzeitig als Zahlungsadressen, Anmeldekennzeichen und dezentralisierte Website-Zeiger dienen, ohne dass eine zentrale Behörde sie widerrufen kann, solange der Inhaber den entsprechenden Schlüssel kontrolliert.

Die Web3 Foundation, [gegründet von Gavin Wood und anderen](https://web3.foundation/about/), finanziert Forschung und Entwicklung dezentralisierter und fairer Internetinfrastruktur mit besonderem Schwerpunkt auf Interoperabilitätsprotokollen.

## Kritik und offene Fragen

Web3 ist [unter Technologen und Ökonomen umstritten](https://www.wired.com/story/web3-blockchain-decentralization-explained/). Häufig genannte Bedenken umfassen:

- **Skalierbarkeit** — öffentliche Blockchains verarbeiten deutlich weniger Transaktionen pro Sekunde als zentralisierte Datenbanken, und Gebühren steigen unter Last. Layer-2-Netzwerke (Rollups, Sidechains) mildern dies, erhöhen aber die Komplexität.
- **Nutzererfahrung** — die Verwaltung privater Schlüssel, Gas-Gebühren und Transaktionsbestätigungen ist erheblich schwieriger als die Anmeldung mit einem Social-Media-Konto. Der Verlust eines Seed-Satzes bedeutet den dauerhaften Verlust von Assets, ohne Möglichkeit der Kontowiederherstellung.
- **Rezentralisierung** — in der Praxis hängt ein Großteil des Web3-Ökosystems von einer kleinen Anzahl von Infrastrukturanbietern ab (z. B. Infura und Alchemy für RPC-Zugang, OpenSea für NFT-Liquidität, eine Handvoll Stablecoin-Emittenten). Kritiker argumentieren, dies reproduziere die Machtkonzentrationen, die Web3 beseitigen sollte – nur mit anderen Platzhirschen.
- **Spekulation und Finanzialisierung** — die Marktzyklen rund um Kryptowährungen und NFTs haben Beobachter dazu veranlasst, zu fragen, ob tokenbasierte Anreize nachhaltige Ökosysteme erzeugen oder hauptsächlich frühe Inhaber belohnen.
- **Energieverbrauch** — Proof-of-Work-Blockchains hatten historisch großen CO₂-Fußabdruck; Ethereums Umstieg auf Proof-of-Stake im Jahr 2022 reduzierte seinen Energieverbrauch um [ca. 99,95 %](https://ethereum.org/en/energy-consumption/), obwohl einige Proof-of-Work-Ketten weiterhin erhebliche Verbraucher sind.
- **Regulatorische Unsicherheit** — ob Token als Wertpapiere gelten, wie DAOs als juristische Personen behandelt werden und die grenzüberschreitende Durchsetzung von Smart-Contract-Streitigkeiten bleiben in den meisten Rechtsgebieten ungeklärt.

Befürworter entgegnen, dass viele dieser Probleme ingenieurtechnische Herausforderungen sind, die sich mit der Zeit verbessern, und dass das Fundament vertrauensloser, offener Protokolle die gegenwärtigen Kompromisse wert ist.

## Relevanz für Domains

Traditionelle Domainnamen operieren durch eine zentralisierte Hierarchie, die von ICANN aufrechterhalten und an Registries und Registrare delegiert wird – der Inhaber eines Domainnamens hängt letztlich davon ab, dass ein Registrar den Eintrag aktiv hält. Web3 führt ein alternatives Modell ein: On-Chain-Namensregistrierungen, bei denen das Eigentum als Token kodiert ist, das in der Wallet des Inhabers liegt, ohne dass ein Registrar es einseitig widerrufen kann.

Dies betrifft mehrere Aspekte der Domain-Funktionsweise:

- **Zensurresistenz** — ein Domain, dessen Eigentumsnachweis auf einer öffentlichen Blockchain gespeichert ist, kann nicht durch eine Änderung der Registrar-Richtlinien oder einen Gerichtsbeschluss, der gegen den Registrar gerichtet ist, beschlagnahmt werden.
- **Komposierbarkeit** — On-Chain-Namen können von Smart Contracts gelesen und verarbeitet werden, was Zahlungsrouting, dezentralisierte Website-Auflösung und Credential-Ausstellung innerhalb eines einzigen Identifikators ermöglicht.
- **Sekundärmärkte** — da On-Chain-Namen Token sind, können sie Peer-to-Peer übertragen oder über dezentralisierte Märkte verkauft werden, ohne dass ein Registrar die Übertragung vermitteln muss.
- **Interoperabilität** — Standards wie ENS ermöglichen es, dass ein einziger Name über mehrere Anwendungen hinweg aufgelöst wird (Wallets, Browser, dApps), ohne dass jede Anwendung eine proprietäre API abfragen muss.

Der Kompromiss liegt darin, dass blockchain-basierte Namen nur eingeschränkt im konventionellen DNS auflösen, der Inhaber seine eigenen Schlüssel verwalten muss und die kontinuierliche Betrieb der zugrundeliegenden Kette vorausgesetzt wird.
