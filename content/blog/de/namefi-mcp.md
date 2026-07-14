---
title: "Namefi-MCP-Server: Domain-Tools für KI-Agenten"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'domains', 'web3']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/namefi-mcp-og.jpg
description: "Jedes Tool, das der Namefi-MCP-Server KI-Agenten bereitstellt: Suche, Registrierung, DNS, Verlängerungen, Tokenisierung sowie das Authentifizierungsmodell und Beispielabläufe."
keywords: ["namefi mcp server", "mcp-tools liste", "namefi mcp-fähigkeiten", "mcp-server domainverwaltung", "domain-registrar mcp-server", "namefi api-key berechtigungen", "dns mcp-tools", "domain registrieren mcp", "domain tokenisieren mcp", "x402 domainzahlung", "siwe authentifizierung domains", "eip-712 domainsignatur", "outbound lead-finding domains", "namefi openapi", "ki-agent domain-tools"]
relatedArticles:
  - /de/blog/claude-mcp-domains/
  - /de/blog/ai-agent-register/
  - /de/blog/wallet-checkout/
  - /de/blog/llms-txt/
  - /de/blog/mcp-quickstart/
relatedTopics:
  - /de/topics/domain-tokenization/
  - /de/topics/web3-foundations/
relatedSeries:
  - /de/series/blockchain-concepts/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/ai-agent/
  - /de/glossary/registrar/
  - /de/glossary/tokenized-domain/
  - /de/glossary/dnssec/
  - /de/glossary/ens/
---

Jeder [KI-Agent](/de/glossary/ai-agent/), der sich mit dem Namefi-MCP-Server verbindet, sieht dieselbe Liste aufrufbarer Tools — eines für jede von der API definierte Operation. Sie decken Suche, Registrierung, DNS, Domain-Konfiguration, Outbound-Lead-Findung und Zahlung ab. Diese Seite ist der Katalog: jedes Tool, seine Funktion, seine erforderliche Authentifizierung sowie drei ausgearbeitete Beispiele, die mehrere Tools zu einem echten Workflow kombinieren.

Wenn Sie noch keinen Agenten mit Namefi verbunden haben, beginnen Sie mit [Eine Domain mit Ihrem KI-Agenten bei Namefi registrieren](/de/blog/ai-agent-register/) für die Einrichtung je Client oder [Eine Domain mit Claude kaufen: Schritt-für-Schritt-Anleitung für Namefi MCP](/de/blog/claude-mcp-domains/) für ein vollständiges Transkript. Diese Seite setzt voraus, dass die Verbindung bereits besteht.

## Was der Namefi-MCP-Server ist

Namefi betreibt für seine gesamte API einen einzigen MCP-Server unter `https://api.namefi.io/mcp` über den Streamable-HTTP-Transport. Statt dass ein Agent REST-Aufrufe aus in einen Chat kopierter Dokumentation von Hand zusammensetzt, verbindet er sich einmal und erhält für jede von der API definierte Operation ein typisiertes Tool. Diese werden direkt aus Namefis eigener OpenAPI-3-Spezifikation unter [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json) generiert, sodass MCP-Katalog und REST-API nicht auseinanderlaufen können.

Ein maschinenlesbarer Discovery-Deskriptor unter [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) ermöglicht einem Agenten, den Server zu finden, ohne dass ein Mensch eine URL manuell in eine Konfigurationsdatei einfügt: Er nennt den Server `namefi-api`, meldet den Transport `streamable-http` und erklärt `apiKey`/`x-api-key` zur Verbindungs-Authentifizierung. Namefi, ein von [ICANN](/de/glossary/icann/) akkreditierter [Registrar](/de/glossary/registrar/), veröffentlicht dieselben Operationen außerdem als einfache HTTPS-Endpunkte unter [namefi.io/llms.txt](https://namefi.io/llms.txt), für Agenten und Skripte, die kein MCP sprechen.

## Der vollständige Funktionskatalog

Im Folgenden stehen alle zum Veröffentlichungszeitpunkt von der API definierten Operationen, gruppiert wie in Namefis eigener Referenz. Die Spalte **Operation** enthält die `operationId` aus der OpenAPI-Spezifikation — den Namen, aus dem die Tool-Liste eines MCP-Clients aufgebaut wird. Die Spalte **Authentifizierung** zeigt den einfachsten Weg (ein API-Schlüssel deckt fast alles ab); das vollständige Authentifizierungsmodell einschließlich der Alternativen zum API-Schlüssel folgt im nächsten Abschnitt.

### Suche und Discovery

| Operation | Endpunkt | Funktion | Authentifizierung |
| --- | --- | --- | --- |
| `checkAvailability` | `GET /v-next/search/availability` | Prüft, ob ein einzelner Domainname zur Registrierung frei ist | Keine |
| `checkBulkAvailability` | `GET /v-next/search/bulk-availability` | Prüft in einem Aufruf einen Stapel möglicher Namen | Keine |
| `getSuggestions` | `GET /v-next/search/suggestions` | Liefert algorithmische Namensvorschläge zu einer Suchanfrage | Keine |

### Registrierung und Bestellungen

| Operation | Endpunkt | Funktion | Authentifizierung |
| --- | --- | --- | --- |
| `registerDomain` | `POST /v-next/orders/register-domain` | Registriert eine Domain für 0–10 Jahre. Akzeptiert ein Objekt `domainSetupOptions` (`autoPark`, `autoEns`, `autoRenew`, `dnssec`, `keepExistingNameservers`) und optional `nftReceivingWallet` | API-Schlüssel |
| `registerWithRecords` | `POST /v-next/orders/register-domain/records` | Registriert eine Domain und legt im selben Aufruf einen ersten Satz DNS-Einträge an | API-Schlüssel |
| `getOrder` | `GET /v-next/orders/{orderId}` | Fragt eine Bestellung ab, bis sie einen endgültigen Status erreicht: `SUCCEEDED`, `FAILED`, `CANCELLED` oder `PARTIALLY_COMPLETED` | API-Schlüssel |

Die Registrierung erfolgt asynchron: `registerDomain` gibt sofort eine Bestell-`id` zurück, und der Agent fragt `getOrder` ab, bis die Bestellung abgeschlossen ist. Sowohl die [Claude-Anleitung](/de/blog/claude-mcp-domains/) als auch der [Einrichtungsleitfaden für mehrere Agenten](/de/blog/ai-agent-register/) zeigen dieses Muster als vollständiges Transkript.

### Verwaltung von DNS-Einträgen

Vollständiges CRUD, einzeln oder im Batch, plus ein Lesezugriff, der überhaupt keine Authentifizierung benötigt:

| Operation | Endpunkt | Funktion | Authentifizierung |
| --- | --- | --- | --- |
| `getDnsRecords` | `GET /v-next/dns/records` | Listet jeden Eintrag in einer Zone auf | Keine |
| `createDnsRecord` | `POST /v-next/dns/records` | Erstellt einen Eintrag | API-Schlüssel |
| `updateDnsRecord` | `PUT /v-next/dns/record` | Aktualisiert einen Eintrag anhand seiner ID | API-Schlüssel |
| `deleteDnsRecord` | `DELETE /v-next/dns/record` | Löscht einen Eintrag anhand seiner ID | API-Schlüssel |
| `batchCreateDnsRecords` | `POST /v-next/dns/records/batch` | Erstellt viele Einträge in einem Aufruf | API-Schlüssel |
| `batchUpdateDnsRecords` | `PUT /v-next/dns/records/batch` | Aktualisiert viele Einträge in einem Aufruf | API-Schlüssel |
| `batchDeleteDnsRecords` | `DELETE /v-next/dns/records/batch` | Löscht viele Einträge in einem Aufruf | API-Schlüssel |

Unterstützte [Eintragstypen](/de/glossary/dns-record-types/): A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA, DS, TLSA, SSHFP, HTTPS, SVCB, NAPTR, SPF. Zwei Formatierungsregeln bringen die meisten ersten Versuche zu Fall: `zoneName` darf keinen abschließenden Punkt haben; `rdata`-Werte für CNAME-, MX- und NS-Einträge müssen einen haben.

### Umschalter auf Domain-Ebene

Diese schalten eine vollständige Funktion ein oder aus und sind von einem einzelnen DNS-Eintrag zu unterscheiden:

| Operation | Endpunkt | Funktion | Authentifizierung |
| --- | --- | --- | --- |
| `toggleDomainParking` / `parkDomain` | `PUT` / `POST /v-next/dns/park` | Schaltet [Domain-Parking](/de/glossary/domain-parking/) ein oder aus | API-Schlüssel |
| `isDomainParked` | `GET /v-next/dns/parked` | Prüft, ob eine Domain derzeit geparkt ist | Keine |
| `toggleForwarding` | `PUT /v-next/dns/forwarding` | Schaltet [Domain-Weiterleitung](/de/glossary/domain-forwarding/) ein oder aus | API-Schlüssel |
| `toggleAutoEns` | `PUT /v-next/dns/auto-ens` | Schaltet die automatische Veröffentlichung von [ENS](/de/glossary/ens/)-Einträgen ein oder aus | API-Schlüssel |
| `toggleVercelAnyCastRecords` | `PUT /v-next/dns/vercel-anycast` | Schaltet Vercel-Anycast-DNS-Einträge ein oder aus | API-Schlüssel |

Beachten Sie, dass [DNSSEC](/de/glossary/dnssec/) nicht zu diesen Umschaltern gehört: Es wird bei der Registrierung gesetzt, als eines der oben genannten `domainSetupOptions`-Felder von `registerDomain`, nicht über einen separaten Endpunkt, den ein Agent anschließend aufruft.

### Domain-Konfiguration

| Operation | Endpunkt | Funktion | Authentifizierung |
| --- | --- | --- | --- |
| `getAutoRenew` | `GET /v-next/domain-config/auto-renew` | Prüft, ob die automatische Verlängerung aktiviert ist | API-Schlüssel |
| `toggleAutoRenew` | `PUT /v-next/domain-config/auto-renew` | Schaltet die automatische Verlängerung ein oder aus | API-Schlüssel |

Wenn die [automatische Verlängerung](/de/glossary/domain-renewal/) aktiv ist, verlängert sich die Domain vor Ablauf automatisch mit den in der Eigentümer-Wallet hinterlegten Zahlungsarten. Das ist eine fortlaufende Autorisierung, die Sie bewusst für jede Domain entscheiden sollten, statt sie standardmäßig für ein ganzes Portfolio aktiviert zu lassen.

### Outbound-Lead-Findung

Die neueste Oberfläche verwandelt gehaltene Domains aus einer statischen Asset-Liste in eine Vertriebspipeline:

| Operation | Endpunkt | Funktion | Authentifizierung |
| --- | --- | --- | --- |
| `getUserDomains` | `GET /v-next/user/domains` | Listet Domains auf, die der authentifizierten Wallet gehören | API-Schlüssel |
| `startOutboundRun` | `POST /v-next/outbound/runs` | Startet für eine gehaltene Domain einen KI-Lead-Finding-Lauf mit `reasoningEffort` von `low`, `medium` oder `high` | API-Schlüssel |
| `listOutboundRuns` | `GET /v-next/outbound/runs` | Listet vergangene und aktive Läufe auf | API-Schlüssel |
| `getOutboundRun` | `GET /v-next/outbound/runs/{runId}` | Fragt den Status eines Laufs ab: `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED` oder `CANCELED` | API-Schlüssel |
| `listOutboundLeads` | `GET /v-next/outbound/runs/{runId}/leads` | Listet priorisierte Käufer-Leads auf, jeweils mit Begründung, gefundenen Kontakten und vorhandenem Outreach-Entwurf | API-Schlüssel |
| `prepareOutboundOutreach` | `POST /v-next/outbound/runs/{runId}/leads/{leadId}/outreach` | Erzeugt für einen Lead einen Outreach-Entwurf oder gibt den bestehenden ohne zusätzliche Generierungskosten zurück | API-Schlüssel |

Die Antwort lässt interne Ranking-Mechanismen aus — Score, Modelldetails und Status unterdrückter Leads. Ein Agent, der Ergebnisse für einen Menschen zusammenfasst, sieht daher nur die öffentliche Begründung, den gefundenen Kontakt und ob ein Entwurf existiert.

### Zahlungen und Konto

| Operation | Endpunkt | Funktion | Authentifizierung |
| --- | --- | --- | --- |
| `getBalance` | `GET /v-next/balance` | Prüft das NFSC-Guthaben (Namefi Service Credit), das Registrierungen finanziert | API-Schlüssel |
| `requestNfscFaucet` | `POST /v-next/user/faucet` | Fordert kostenlose NFSC-Testguthaben an (nur Entwicklungsumgebungen) | API-Schlüssel |
| `registerDomainX402` | `GET /x402/domain/{domainName}` | Registriert und bezahlt in einem Stablecoin-signierten HTTP-402-Ablauf, ohne Namefi-Konto | Wallet-Signatur |
| — | `GET /x402/purchase/{purchaseId}` | Fragt den Status eines x402-Kaufs ab | Keine |
| `registerDomainMPP` | `GET /mpp/domain/{domainName}` | Registriert und bezahlt über den Challenge-Response-Ablauf des MPP (Machine Payable Protocol) | Wallet-Signatur |

Damit sind alle Operationen für Suche, Registrierung, DNS, Domainkonfiguration, Outbound und Zahlung abgedeckt — jede ist über die einzelne Serververbindung als MCP-Tool oder als einfacher HTTPS-Aufruf für Agenten erreichbar, die kein MCP sprechen. (Namefis API stellt außerhalb dieser Liste auch einige Hilfsoperationen für Kontoverwaltung und EIP-712/SIWE bereit; den stets aktuellen vollständigen Satz finden Sie in der unten verlinkten OpenAPI-Spezifikation.)

## Das Authentifizierungsmodell: drei Zugangswege, eine Wallet dahinter

Jede obige Schreiboperation prüft über einen von drei Wegen dasselbe: Kontrolliert der Aufrufer die Wallet, die die Domain besitzt oder besitzen wird? Welcher Weg gilt, hängt von der Operation ab, nicht von einer einzelnen Einstellung auf Kontoebene.

**API-Schlüssel (`x-api-key`).** Die einfachste Option und diejenige, die jedes ausgearbeitete Beispiel in diesem Cluster verwendet. Erzeugen Sie einen Schlüssel unter [namefi.io/api-key](https://namefi.io/api-key). Er funktioniert für jede obige Operation, einschließlich DNS-Schreibvorgängen, Parking und Registrierung, weil der Schlüssel die Berechtigungen der Wallet übernimmt, die ihn erzeugt hat. Übergeben Sie ihn als einfachen HTTP-Header; ein SDK ist nicht erforderlich.

**EIP-712-Signatur typisierter Daten.** Für den programmatischen Einsatz ohne gespeicherten Schlüssel signieren Sie jede Anfrage mit einer Ethereum-[Wallet](/de/glossary/wallet/): Die Header `x-namefi-signer`, `x-namefi-signature` und `x-namefi-eip712-type` verpacken den Payload mit Zeitstempel und einmaligem Nonce, der nach 300 Sekunden abläuft. So führen Sie Operationen wie `toggleDomainParking`, `createDnsRecord` und `registerDomain` ohne API-Schlüssel aus. Domain und Typdefinitionen kommen von Live-Endpunkten (`GET /v-next/eip712/domain`, `/eip712/types`) und nicht aus einer hartcodierten Konstante, da die Namefi-Dokumentation darauf hinweist, dass sie sich ändern können. Smart-Contract-Wallets können nicht direkt signieren; daher signiert ein zugelassenes externes Konto im Namen des Contracts, während `x-namefi-erc1271-account` oder `x-namefi-eip7702-account` den Contract benennen, der die Anfrage autorisiert.

**SIWE (Sign-In with Ethereum).** Ein Session-Token (`x-namefi-siwe-token`) für geschützte Lesezugriffe, die nicht bei jedem Aufruf eine neue Signatur benötigen, etwa das Auflisten gehaltener Domains oder Bestellungen: Nonce abrufen, zu signierende Nachricht abrufen, mit `personal_sign` signieren, verifizieren und den Token dann wiederverwenden.

Eine Handvoll Operationen benötigen keine Authentifizierung — `checkAvailability`, `getSuggestions`, `getDnsRecords`, `isDomainParked` und die EIP-712-Metadatenendpunkte —, weil sie schreibgeschützt sind und nichts offenlegen, was das öffentliche DNS einer Domain nicht ohnehin in einem Browser zeigen würde.

Darüber liegt die Zahlung. `registerDomainX402` wickelt einen Kauf über das [x402-Protokoll](https://x402.org) ab: Die Wallet des Käufers signiert eine EIP-3009-`transferWithAuthorization` für einen [Stablecoin](/de/glossary/stablecoin/) wie USDC, ohne dass ein Namefi-Konto beteiligt ist. `registerDomainMPP` erreicht dasselbe Ergebnis stattdessen über einen signierten Challenge-Response. Beide erlauben es einem Agenten, die Kontoerstellung zu überspringen und pro Transaktion zu zahlen — [Domains mit einer Krypto-Wallet bezahlen: Kein Konto nötig](/de/blog/wallet-checkout/) beschreibt diesen Weg vollständig.

## Die Tokenisierung läuft durch den Katalog, nicht daneben

`registerDomain` mintet die Domain standardmäßig auf Base als [NFT](/de/glossary/nft/) — einen [ERC-721](/de/glossary/erc-721/)-Token, [die Standardschnittstelle](https://eips.ethereum.org/EIPS/eip-721), die die meisten Marktplätze und Wallets bereits lesen — für die Wallet, die an den API-Schlüssel des Aufrufers gebunden ist. `nftReceivingWallet` leitet das bei der Registrierung an eine andere Wallet oder Chain weiter, und alles danach — DNS-Schreibvorgänge, Parking, automatische Verlängerung, Outbound-Lead-Findung — prüft denselben On-Chain-Eigentumsnachweis statt einer separaten Kontodatenbank. Eine auf einem Marktplatz wie [OpenSea](https://opensea.io) gehandelte [tokenisierte Domain](/de/glossary/tokenized-domain/) trägt DNS-Kontrolle und ERC-721-Eigentümerschaft als ein Objekt, nicht als zwei Systeme, die man von Hand synchron halten muss.

## Drei Agenten, drei Wege, dasselbe Toolset zu nutzen

**Ein Builder registriert eine Domain und stellt DNS in einem Gespräch bereit.** `checkAvailability` bestätigt, dass der Name frei ist; `registerDomain` übermittelt ihn mit `domainSetupOptions`, die für `autoRenew` und `dnssec` gesetzt sind; und sobald die Bestellung `SUCCEEDED` erreicht, schreibt `batchCreateDnsRecords` die CNAME- und TXT-Einträge, auf die der Verifizierungsschritt einer Deployment-Plattform wartet. Der [Namefi-MCP-Quickstart für Programmieragenten](/de/blog/mcp-quickstart/) führt durch diese Abfolge in einem Editor.

**Ein Domain-Händler verwaltet ein Portfolio.** `getUserDomains` lädt die aktuellen Bestände, `checkBulkAvailability` prüft neue Kandidaten in einem Aufruf und `registerDomain` nimmt die kaufwürdigen Namen auf. Für weiterverkaufte Namen stellt `toggleDomainParking` eine Landingpage bereit und `isDomainParked` bestätigt, dass sie live ist; im gesamten Portfolio entscheiden `getAutoRenew` und `toggleAutoRenew`, welche Namen eine fortlaufende Verlängerungsautorisierung wert sind und welche spekulativ genug sind, um sie auslaufen zu lassen.

**Ein Unternehmen betreibt Outbound-Lead-Findung für bereits gehaltene Namen.** `getUserDomains` identifiziert eine ungenutzte Domain, `startOutboundRun` startet die Recherche und `getOutboundRun` fragt ab, bis der Lauf `SUCCEEDED` erreicht. `listOutboundLeads` liefert priorisierte Unternehmen, deren Profil darauf hinweist, dass sie den Namen wünschen könnten, und `prepareOutboundOutreach` entwirft eine E-Mail pro Lead — einmal erzeugt und bei wiederholten Aufrufen kostenlos zurückgegeben.

## Bevor ein Agent all dies unbeaufsichtigt ausführt

Namefis eigene Outbound-Dokumentation kennzeichnet vier Operationen als **folgenreich** — `registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach` —, weil jede Guthaben ausgibt oder eine nach außen sichtbare Handlung ausführt. Schreibgeschützte Tools wie `checkAvailability` lassen sich risikolos autonom ausführen; alles, was eine Bestellung, einen DNS-Eintrag auf einer Live-Domain oder einen Outreach-Entwurf schreibt, verdient einen Bestätigungsschritt. [Was ist ein agent-nativer Domain-Registrar?](/de/blog/agent-native/) bietet eine ausführlichere Checkliste, um die Agentenschnittstelle jedes Registrars so zu bewerten.

## Diesen Katalog aktuell halten

Diese Tabelle spiegelt Namefis Live-OpenAPI-Spezifikation zum oben genannten Veröffentlichungsdatum wider, keine feste Roadmap. Neue Operationen erscheinen in [namefi.io/llms.txt](https://namefi.io/llms.txt) und [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt), bevor sie in einer Tabelle eines Blogbeitrags landen.

## Häufig gestellte Fragen

### Brauche ich einen API-Schlüssel, nur um zu prüfen, ob ein Name verfügbar ist?

Nein. `checkAvailability`, `checkBulkAvailability` und `getSuggestions` benötigen keine Authentifizierung und funktionieren daher gegen einen frisch verbundenen Agenten, bevor irgendein Guthaben aufgeladen ist.

### Kann ein Agent diesen gesamten Katalog nutzen, ohne dass ich jemals einen Namefi-API-Schlüssel halte?

Ja. `registerDomainX402` und `registerDomainMPP` wickeln beide eine Registrierung über eine Wallet-Signatur ohne Namefi-Konto ab, und die EIP-712-Signatur deckt die übrigen Schreiboperationen direkt aus einer Wallet.

### Wird eine Domain automatisch tokenisiert, wenn ich sie über einen dieser Wege registriere?

Ja, standardmäßig über jeden Registrierungsweg. Wenn `nftReceivingWallet` nicht angegeben ist, wird die Domain auf Base als ERC-721-NFT für die an den API-Schlüssel des Aufrufers gebundene Wallet registriert.

### Welche Operationen sollte ein Mensch bestätigen, bevor ein autonomer Agent sie ausführt?

Mindestens die vier in Namefis Dokumentation als folgenreich markierten — `registerDomain`, `registerWithRecords`, `startOutboundRun`, `prepareOutboundOutreach` — sowie jeden DNS-Schreibvorgang auf einer Domain, die bereits Live-Traffic bedient.

## Verbinden Sie Ihren Agenten mit dem vollständigen Katalog

Jedes obige Tool ist über eine Verbindung live: `https://api.namefi.io/mcp`. Falls Sie diese noch nicht eingerichtet haben, erläutert [Eine Domain mit Ihrem KI-Agenten bei Namefi registrieren](/de/blog/ai-agent-register/) die genaue Konfiguration für sechs verschiedene Clients, und [llms.txt für Domains](/de/blog/llms-txt/) erklärt die darunterliegende Discovery-Schicht.

**[Einen Namefi-API-Schlüssel erzeugen](https://namefi.io/api-key)** und Ihren Agenten auf den Server richten — dort warten die oben genannten Tools auf ihn.

## Quellen und weiterführende Lektüre

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP-Server-URL, Transport, Authentifizierung, Referenz der Kernoperationen — Primärquelle für diesen Katalog)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (Referenz in einer Datei, die Web3-Zahlungen und Outbound-Lead-Findung einbettet)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402-, MPP-, EIP-712- und SIWE-Abläufe im Detail)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP-Discovery-Deskriptor: Servername, URL, Transport, Authentifizierungstyp)
- Namefi — [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json) (maschinenlesbare OpenAPI-3-Spezifikation — Quelle jeder `operationId` und jedes Endpunkts im obigen Funktionskatalog)
- Namefi — [docs.namefi.io: Authentifizierung](https://docs.namefi.io/docs/02-authentication.mdx#:~:text=The%20Namefi%20API%20supports%20three%20authentication%20methods) (API-Schlüssel, EIP-712- und SIWE-Authentifizierungsmodi; Authentifizierungsanforderungen je Operation; ERC-1271-/EIP-7702-Delegierung)
- Namefi — [docs.namefi.io: Eine Domain registrieren](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (Felder des Registrierungsrequests, Abfrageablauf, Statuswerte der Bestellung)
- Namefi — [docs.namefi.io: Guthaben verwalten](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC-Guthaben- und Faucet-Endpunkte)
- Model Context Protocol — [Was ist das Model Context Protocol?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (Überblick über das Protokoll)
- llmstxt.org — [Die Datei /llms.txt](https://llmstxt.org) (Spezifikation und Begründung für die Discovery-Konvention, der Namefis Datei folgt)
- x402.org — [x402-Protokoll](https://x402.org) (auf HTTP 402 basierender Stablecoin-Zahlungsstandard, der `registerDomainX402` zugrunde liegt)
- Ethereum Improvement Proposals — [ERC-721: Non-Fungible-Token-Standard](https://eips.ethereum.org/EIPS/eip-721) (der Token-Standard, den Namefis Domain-NFTs implementieren)
