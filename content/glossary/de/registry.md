---
title: Registry
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Die Organisation, die die maßgebliche Datenbank und Nameserver für eine Top-Level-Domain betreibt und den Einzelhandelsverkauf an Registrare delegiert.
keywords: ['Registry', 'Registry-Betreiber', 'TLD-Registry', 'Domain-Registry', 'ICANN', 'Registrar', 'EPP', 'gTLD-Registry', 'ccTLD-Registry', 'Shared-Registry-System']
also_known_as: ['Registry-Betreiber']
level: 2
sources:
  - https://www.icann.org/resources/pages/registries-0-2012-02-25-en
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/registry-agreements
  - https://www.icann.org/resources/pages/gtld-registry-agreement-2013-01-25-en
relatedArticles:
  - /de/blog/what-is-a-tld/
  - /de/blog/what-are-tokenized-domains/
  - /de/blog/top-tlds-to-secure-for-your-business/
  - /de/blog/how-tld-affects-domain-value/
  - /de/blog/top-tlds-to-secure-for-your-fashion-brand/
relatedTopics:
  - /de/topics/choosing-a-tld/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/best-tlds-by-industry/
  - /de/series/domain-flipping-skills/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/icann/
  - /de/glossary/tld/
  - /de/glossary/dns/
  - /de/glossary/web3/
---

Eine **Registry** (auch *Registry-Betreiber* genannt) ist die Organisation, die die maßgebliche Datenbank für eine [TLD](/de/glossary/tld/) betreibt — sie erfasst jede unter dieser Endung registrierte Domain, pflegt die Zonendatei, die diese Namen auf [Nameserver](/de/glossary/nameserver/) abbildet, und veröffentlicht die Daten, die Abfragen über den [DNS](/de/glossary/dns/) ermöglichen. Registries stehen an der Spitze der Domain-Lieferkette, oberhalb von [Registraren](/de/glossary/registrar/) und [Registranten](/de/glossary/registrant/).

## Was eine Registry tut

Die Kernaufgabe einer Registry besteht darin, die **maßgebliche Datenbank** — häufig als *Registry-Datenbank* oder *Shared Registration System* bezeichnet — für alle Domains unter ihrer TLD zu verwalten. Wenn eine Domain erstellt, verlängert, übertragen oder gelöscht wird, verzeichnet die Registry die Änderung. Außerdem veröffentlicht die Registry die **TLD-Zonendatei**: die Menge der [Nameserver](/de/glossary/nameserver/)-Delegierungen, die dem globalen [DNS](/de/glossary/dns/) mitteilen, wohin Abfragen für Namen unter dieser TLD weiterzuleiten sind.

Neben der Datenbankpflege betreiben oder beauftragen die meisten Registries die **maßgeblichen Nameserver** für ihre TLD (oft als TLD-Nameserver bezeichnet). Diese Server beantworten Anfragen von Resolvern wie zum Beispiel: „Welche Nameserver sind maßgeblich für `example.com`?" und liefern die Antwort aus der Zonendatei der Registry.

Über ihre technischen Aufgaben hinaus übernehmen Registries folgende Tätigkeiten:

- Sie legen **Großhandelspreise** fest — den Preis, den [Registrare](/de/glossary/registrar/) pro Domain und Jahr zahlen.
- Sie verfassen und durchsetzen **Registrierungsrichtlinien** — Eignungsanforderungen, Nutzungsregeln sowie Sunrise- und Markenschutzfristen für neue Endungen.
- Sie betreiben **WHOIS/RDAP**-Abfragedienste, die Registrierungsdaten öffentlich zugänglich machen.
- Sie arbeiten mit [ICANN](/de/glossary/icann/) im Rahmen eines Registry-Vertrags zusammen, der Pflichten und Leistungsstandards festlegt ([ICANN Registry Agreements](https://www.icann.org/en/registry-agreements)).

## Registry vs. Registrar vs. Registrant

Die Domain-Industrie ist nach einem Dreiebenen-Modell organisiert, das von [ICANN](/de/glossary/icann/) etabliert wurde:

| Ebene | Rolle | Beispiele |
|-------|-------|-----------|
| **Registry** | Betreibt die TLD-Datenbank; legt Großhandelspreis fest; kein direkter Endkundenverkauf | Verisign (.com, .net), PIR (.org), DENIC (.de) |
| **[Registrar](/de/glossary/registrar/)** | Akkreditierter Händler; verkauft Domains an die Öffentlichkeit; kommuniziert mit der Registry über EPP | GoDaddy, Namecheap, Google Domains |
| **[Registrant](/de/glossary/registrant/)** | Die Person oder Organisation, die einen Domainnamen registriert | Jedes Unternehmen oder jede Privatperson, die eine Domain kauft |

Registries und Registrare werden beide von [ICANN](/de/glossary/icann/) akkreditiert, erfüllen jedoch unterschiedliche Rollen. Nach den Regeln zur vertikalen Trennung von ICANN darf eine Registry für ihre eigenen TLDs grundsätzlich nicht gleichzeitig als Einzelhandels-Registrar tätig sein (mit wenigen Ausnahmen). Diese Trennung ist beabsichtigt: Sie verhindert, dass eine Registry sich selbst bevorzugte Preise oder bevorzugten Zugang zu begehrten Namen gegenüber der Öffentlichkeit verschafft.

## Das Registry-Registrar-Modell in der Praxis

Die technische Brücke zwischen Registry und Registrar ist das **[Extensible Provisioning Protocol (EPP)](/de/glossary/epp/)**, ein XML-basiertes Protokoll, das in [RFC 5730](https://www.rfc-editor.org/rfc/rfc5730) definiert ist. Registrare verbinden sich mit dem EPP-Server der Registry, um Domain-Lebenszyklusoperationen durchzuführen: `check` (Ist ein Name verfügbar?), `create`, `renew`, `transfer`, `update` und `delete`.

In diesem Modell gilt:

1. Ein Registrar schließt eine **Registrar Accreditation Agreement (RAA)** mit [ICANN](/de/glossary/icann/) sowie separate **Registry-Registrar-Vereinbarungen** mit jeder Registry ab, deren TLDs er verkaufen möchte.
2. Die Registry erhebt vom Registrar eine **Großhandelsgebühr** (zum Beispiel berechnet Verisign akkreditierten Registraren ab 2024 rund 10,26 USD/Jahr für eine `.com`).
3. Der Registrar fügt seine Marge hinzu und verkauft zum **Einzelhandelspreis** an den [Registranten](/de/glossary/registrant/).
4. Der Registrar sendet [EPP](/de/glossary/epp/)-Befehle an die Registry, die daraufhin die maßgebliche Datenbank und Zonendatei aktualisiert — die Domain ist innerhalb von Minuten im gesamten DNS erreichbar.

Diese Architektur, manchmal auch als **Shared Registry System (SRS)** bezeichnet, ermöglicht es einer einzigen Registry, gleichzeitig Hunderte konkurrierender Registrare zu bedienen, die alle über standardisierte [EPP](/de/glossary/epp/)-Transaktionen in dieselbe maßgebliche Datenbank schreiben. Der Wettbewerb auf Registrarebene hält die Einzelhandelspreise niedrig, ohne einem einzelnen Wiederverkäufer ein Monopol auf den Zugang zur TLD zu verschaffen.

## Beispiele

**Registries für generische TLDs**

- **Verisign** betreibt `.com` und `.net`, die beiden nach Registrierungsvolumen größten [gTLDs](/de/glossary/gtld/). Der Registry-Vertrag mit [ICANN](/de/glossary/icann/) ist öffentlich zugänglich und wird häufig als Referenzmodell zitiert ([IANA-Root-Datenbankeintrag für .com](https://www.iana.org/domains/root/db/com.html)).
- **Public Interest Registry (PIR)** betreibt `.org`, das ursprünglich als gemeinnützige Registry für nichtkommerzielle Organisationen eingerichtet wurde.
- **Identity Digital** (früher Donuts und Afilias) ist einer der größten Betreiber delegierter [neuer gTLDs](/de/glossary/new-gtld/) und verwaltet Hunderte von Endungen wie `.blog`, `.online`, `.store` und `.news`.

**Registries für Ländercodes-TLDs**

[ccTLD](/de/glossary/cctld/)-Registries operieren unter nationaler oder territorialer Autorität und nicht im Rahmen von [ICANN](/de/glossary/icann/)-[gTLD](/de/glossary/gtld/)-Vereinbarungen, obwohl viele dennoch über [EPP](/de/glossary/epp/) mit Registraren kommunizieren:

- **Nominet** (.uk) — die Registry für das Vereinigte Königreich, eine 1996 gegründete gemeinnützige Organisation.
- **DENIC** (.de) — die Genossenschafts-Registry für Deutschland, geführt von einer Mitgliederorganisation aus Registraren.
- **AFNIC** (.fr) — die Registry für Frankreich, die im Auftrag der französischen Regierung betrieben wird.
- **VeriSign** / **CNNIC** (.cn) — Chinas Ländercode-Registry, betrieben vom China Internet Network Information Center.

ccTLD-Registries sind in der IANA-Root-Datenbank unter [iana.org/domains/root/db](https://www.iana.org/domains/root/db) aufgeführt, dem maßgeblichen Verzeichnis aller TLD-Delegierungen weltweit.

## Neue gTLD-Registries

Vor 2012 war die Menge generischer TLDs klein und stabil — `.com`, `.net`, `.org`, `.info`, `.biz` und einige weitere. Mit dem **New gTLD Program** von ICANN, das 2012 startete, wurden Bewerbungen für nahezu beliebige Zeichenfolgen als [neue gTLD](/de/glossary/new-gtld/) geöffnet. Letztlich wurden über 1.200 neue Endungen delegiert.

Neue [gTLD](/de/glossary/gtld/)-Registries operieren unter einem **Registry Agreement** mit [ICANN](/de/glossary/icann/), das technische Anforderungen (EPP-Unterstützung, DNSSEC, RDAP), Leistungsstandards (Systemverfügbarkeit, Antwortzeiten) und Richtlinienpflichten (Missbrauchsbekämpfung, Markenschutzmechanismen wie die Trademark Clearinghouse-Sunrise-Phase und das Uniform Rapid Suspension-System) vorschreibt.

ICANN veröffentlicht die vollständige Liste der Registry-Vereinbarungen für neue gTLDs unter [icann.org/en/registry-agreements](https://www.icann.org/en/registry-agreements).

## Registries und tokenisierte Domains

Eine kleine Anzahl alternativer Domain-Namensräume — insbesondere Unstoppable Domains und ENS (Ethereum Name Service) — gibt domänenähnliche Namen aus, die auf öffentlichen Blockchains verankert sind und nicht in einer ICANN-koordinierten DNS-Zone. In diesen Systemen wird das Eigentum in einem Smart Contract statt in einer Registry-Datenbank erfasst, und die Auflösung erfordert eine Browser-Erweiterung oder einen kompatiblen Resolver statt des üblichen DNS-Abfragepfads.

Diese blockchain-basierten Namensräume sind nicht in der IANA-Root delegiert und für gewöhnliche DNS-Resolver standardmäßig nicht sichtbar. Sie operieren unabhängig vom oben beschriebenen ICANN-Registry-System.
