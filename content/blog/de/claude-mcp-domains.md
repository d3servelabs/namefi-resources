---
title: "Eine Domain mit Claude kaufen: Schritt-für-Schritt-Anleitung für Namefi MCP"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'domains', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/claude-mcp-domains-og.jpg
description: "Verbinden Sie Claude mit dem Namefi-MCP-Server und registrieren Sie eine echte Domain aus einem einzigen Gespräch. Mit exakter Konfiguration, kommentiertem Transkript und Fehlerbehebung."
keywords: ["namefi mcp", "claude mcp domain", "mcp-server einrichten", "domain kaufen claude", "x-api-key", "schritt-für-schritt-anleitung", "namefi mcp domainregistrierung", "claude desktop domain registrieren", "claude code domain kaufen", "namefi claude integration", "mcp-domain-registrar", "ki-agent kauft domain claude", "streamable http mcp"]
relatedArticles:
  - /de/blog/ai-agent-register/
  - /de/blog/cf-namecom-namefi/
  - /de/blog/ai-domain-platforms/
  - /de/blog/agent-native/
  - /de/blog/airo-vs-namefi/
relatedTopics:
  - /de/topics/domain-tokenization/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/tokenize-your-com/
  - /de/series/blockchain-concepts/
relatedGlossary:
  - /de/glossary/ai-agent/
  - /de/glossary/registrar/
  - /de/glossary/dns-record-types/
  - /de/glossary/tokenized-domain/
  - /de/glossary/x402/
---

Am Ende dieses Leitfadens haben Sie eine echte, bei [ICANN](/de/glossary/icann/) registrierte Domain, deren DNS auf Ihr Projekt verweist — vollständig aus einem Gespräch mit Claude heraus, ohne Browser-Checkout, Warenkorb oder CAPTCHA. Dies ist die eigene Einrichtungsanleitung des Namefi-Teams für den [Namefi](https://namefi.io)-MCP-Server — die menschenlesbare Erläuterung derselben API, die wir für Agenten unter [namefi.io/llms.txt](https://namefi.io/llms.txt) und [docs.namefi.io](https://docs.namefi.io) veröffentlichen. Wo ein Detail noch nicht finalisiert oder veröffentlicht ist, sagt dieser Leitfaden es ausdrücklich, statt zu raten.

Es gibt Anleitungen von Drittanbietern zum Thema „eine Domain mit Ihrem [KI-Agenten](/de/glossary/ai-agent/) registrieren“ — [ein beliebtes Beispiel](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) demonstriert das Muster mit einem anderen MCP-Server, der als Reseller auf Cloudflares Registrar-API aufsetzt. Die Mechanik von MCP selbst folgt bei allen Anbietern derselben Idee; dieser Leitfaden bezieht sich konkret auf Namefis eigenen MCP-Server, dessen eigenes Authentifizierungsmodell und dessen Option für [tokenisierte Domains](/de/glossary/tokenized-domain/). Er wurde anhand der Namefi-Dokumentation geprüft, nicht anhand der Beschreibung eines Dritten.

## Was ist MCP, kurz erklärt?

Das [Model Context Protocol](https://modelcontextprotocol.io) (MCP) ist ein offener Standard, der eine KI-Anwendung — hier Claude — mit externen Tools und Datenquellen verbindet. Die Dokumentation des Protokolls selbst beschreibt es als [USB-C-Anschluss für KI-Anwendungen](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications): ein standardisierter Anschluss statt einer individuellen Integration pro Tool. Sobald Claude mit Namefis MCP-Server verbunden ist, erhält es einen definierten Satz aufrufbarer Operationen — Verfügbarkeit prüfen, eine Domain registrieren sowie DNS-Einträge lesen und schreiben — statt eine REST-API aus in den Chat kopierter Dokumentation rekonstruieren zu müssen.

## Voraussetzungen

- **Ein MCP-fähiger Claude-Client.** Dieser Leitfaden behandelt Claude Code (Kommandozeile) mit konkreten, getesteten Befehlen sowie Claude Desktop / claude.ai (über Custom Connectors) mit dem dokumentierten allgemeinen Ablauf. Andere MCP-Clients wie Cursor oder Windsurf verbinden sich mit demselben Server; die Abschnitte je Agent in [Eine Domain mit Ihrem KI-Agenten bei Namefi registrieren](/de/blog/ai-agent-register/) behandeln diese Clients. Wenn Sie nur die Verbindungsbefehle brauchen, nutzen Sie den kompakten [Namefi MCP Quickstart: Claude Code, Cursor & Windsurf](/de/blog/mcp-quickstart/).
- **Ein Namefi-API-Schlüssel**, erzeugt unter [namefi.io/api-key](https://namefi.io/api-key), *oder* eine Krypto-[Wallet](/de/glossary/wallet/), wenn Sie lieber pro Transaktion ganz ohne API-Schlüssel zahlen möchten (siehe den Wallet-Abschnitt weiter unten).
- **Ein aufgeladenes NFSC-Guthaben**, wenn Sie sich in Namefis Produktionsumgebung registrieren. NFSC (Namefi Service Credits) ist das Guthaben, gegen das die Domainregistrierung abgerechnet wird. Die Namefi-Dokumentation beschreibt das Aufladen über das Namefi-Dashboard in Produktion und das Anfordern kostenloser Testguthaben von einem Faucet-Endpunkt in Entwicklungsumgebungen.

## Schritt 1: Einen Namefi-API-Schlüssel abrufen

Der [API-Schlüssel](https://namefi.io/api-key) ist der einfachste Authentifizierungsweg und wird in diesem Leitfaden durchgehend verwendet: Ein einzelner Header deckt jede Operation ab — Registrierung, Erstellung, Aktualisierung und Löschung von DNS-Einträgen. Ein Detail sollten Sie verinnerlichen, bevor Sie einen Schlüssel erzeugen: **Der Schlüssel übernimmt die Berechtigungen der Wallet, die ihn erzeugt hat.** Wenn Sie DNS für eine bereits bestehende Domain verwalten möchten, erzeugen Sie den Schlüssel mit der Wallet, der das NFT dieser Domain gehört. Ein Schlüssel aus einer anderen Wallet hat keinen Schreibzugriff auf eine Domain, deren [Registrierungsinhaber](/de/glossary/registrant/) jemand anderes ist.

Nach der Erzeugung ist der Schlüssel ein mit `nfk_` beginnender String. Bei jeder Schreiboperation übergeben Sie ihn im Header `x-api-key`; schreibgeschützte Operationen wie eine Verfügbarkeitsprüfung benötigen ihn überhaupt nicht.

## Schritt 2: Claude mit dem Namefi-MCP-Server verbinden

Namefi, ein von ICANN akkreditierter [Registrar](/de/glossary/registrar/), betreibt für seine gesamte API-Oberfläche einen einzigen MCP-Server unter `https://api.namefi.io/mcp`, erreichbar über den Streamable-HTTP-Transport. Der Server stellt jede `/v-next`-Operation als typisiertes Tool bereit — Suche, Registrierung, DNS, Domainkonfiguration, Outbound — und seine Existenz sowie Verbindungsdetails sind selbst als Discovery-Deskriptor unter [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) veröffentlicht. Dieser ist maschinenlesbar, damit ein Agent den Server finden kann, ohne dass ein Mensch ihm zuerst die URL einfügt.

### Claude Code

Das Hinzufügen des Servers zu Claude Code ist ein Befehl:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

Das entspricht der [dokumentierten Syntax von Claude Code](https://code.claude.com/docs/en/mcp) für das Hinzufügen eines entfernten HTTP-MCP-Servers mit einem benutzerdefinierten Authentifizierungs-Header. Das allgemeine Muster lautet `claude mcp add --transport http <name> <url> --header "<Header-Name>: <value>"`. Führen Sie den Befehl einmal im Terminal aus (ersetzen Sie `YOUR_KEY` durch den Schlüssel aus Schritt 1); Claude Code schreibt den Server dann in die MCP-Konfiguration Ihres Projekts oder Benutzers. Standardmäßig registriert der Befehl den Server nur für das aktuelle Projekt. Ergänzen Sie `--scope user`, wenn er in jedem Projekt verfügbar sein soll, oder lassen Sie den Schlüssel zunächst ganz weg, falls Sie nur schreibgeschützte Tools wie die Verfügbarkeitssuche benötigen.

Bestätigen Sie die Verbindung mit `claude mcp list`; dort sollte `namefi` als verbunden erscheinen. Innerhalb einer Claude-Code-Sitzung zeigt Ihnen `/mcp`, wie viele Tools der Namefi-Server bereitstellt.

### Claude Desktop und claude.ai

Claude Desktop und claude.ai verbinden sich über **Custom Connectors** mit entfernten MCP-Servern. Der Ablauf ist unter [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers) dokumentiert: Öffnen Sie Settings, wechseln Sie zu Connectors, wählen Sie „Add custom connector“ und geben Sie die Server-URL `https://api.namefi.io/mcp` ein. Nach dem Klick auf Add fordert der Ablauf Sie zum Abschluss der Authentifizierung auf; laut Anthropic-Dokumentation umfasst dieser Schritt „üblicherweise OAuth, API-Schlüssel oder Kombinationen aus Benutzername und Passwort“, abhängig von den Anforderungen des konkreten Servers. Claude zeigt den jeweiligen vom Server angeforderten Dialog an.

<!-- TODO: Mit dem Team bestätigen — welches genaue Feld der Custom-Connector-Authentifizierungsdialog von Claude Desktop für einen Header im Stil von x-api-key anzeigt; die öffentlichen Anthropic-Dokumente beschreiben den allgemeinen Authentifizierungsschritt, zeigen aber nicht speziell den Namefi-Server. --> Falls Ihr Desktop-Connector-Setup keinen offensichtlichen Ort zur Eingabe des Schlüssels zeigt, ist Claude Code derzeit der geprüfte Weg. Schreibgeschützte Tools (Verfügbarkeitssuche) funktionieren über den Connector auch ganz ohne Schlüssel.

## Schritt 3: NFSC-Guthaben aufladen

Eine Domainregistrierung ist eine kostenpflichtige Operation: Sie benötigt NFSC (Namefi Service Credits) in der zahlenden Wallet. In einer Entwicklungs- oder Testumgebung gibt ein Faucet (`POST /v-next/user/faucet` oder `client.user.requestNfscFaucet()` im SDK) kostenlose Testguthaben aus, begrenzt pro Wallet. In Produktion wird NFSC über das Namefi-Dashboard aufgeladen. <!-- TODO: Mit dem Team bestätigen — den genauen Produktionsablauf zum Aufladen: akzeptierte Zahlungsmethoden und ob der Kauf direkt im Chat oder nur über die Dashboard-Oberfläche möglich ist. --> Sie können Ihr aktuelles Guthaben jederzeit prüfen: Fragen Sie Claude nach der Verbindung „Wie hoch ist mein Namefi-Guthaben?“ oder rufen Sie direkt `GET /v-next/balance` auf.

## Schritt 4: Das Kaufgespräch

Bei verbundenem MCP-Server und aufgeladenem Guthaben läuft der Rest in natürlicher Sprache. Hier sehen Sie eine kommentierte Version dieses Gesprächs, die jedem Schritt die zugehörige Operation aus der Namefi-API-Dokumentation zuordnet.

**1. Sie bitten Claude, einen Namen zu prüfen.**

> „Ist `example.com` für eine Registrierung verfügbar?“

Claude ruft die Verfügbarkeitsprüfung auf (die Operation `checkAvailability`, direkt erreichbar unter `GET /v-next/search/availability?domain=example.com`; Authentifizierung ist nicht erforderlich). Claude meldet zurück, ob der Name frei ist, und kann über die Bulk-Variante der Verfügbarkeitsprüfung mehrere Kandidaten gleichzeitig prüfen, wenn Sie mehrere Namen zum Vergleich angeben.

**2. Sie bestätigen und registrieren.**

> „Registriere die Domain für ein Jahr und richte DNS so ein, dass `@` auf 203.0.113.10 zeigt.“

Claude übermittelt eine Registrierungsbestellung (`registerDomain`, `POST /v-next/orders/register-domain`) — oder, falls Sie auch DNS-Einträge angefordert haben, die kombinierte Variante `register-domain/records`. Diese wendet den gewünschten [A-Eintrag](/de/glossary/dns-record-types/) an, sobald die Bestellung abgeschlossen ist. Der Request-Body nimmt einen `normalizedDomainName` entgegen (Kleinschreibung, kein abschließender Punkt; jede [TLD](/de/glossary/tld/), die `search/availability` als registrierbar meldet) sowie `durationInYears` (0–10, Standardwert 1). Optional steuert `nftReceivingWallet` die Tokenisierung: Wenn Sie das Feld weglassen, wird die Domain als NFT auf Base für die mit Ihrem API-Schlüssel verbundene Wallet registriert. Ein Objekt `domainSetupOptions` dokumentiert weitere Überschreibungen pro Domain, darunter `autoRenew`, `dnssec` und `keepExistingNameservers`. Letzteres erlaubt Claude, die Domain zu registrieren, ohne die [Nameserver](/de/glossary/nameserver/)-Delegierung von ihrem derzeitigen Ziel weg umzuleiten.

**3. Claude fragt den Status ab, bis die Bestellung fertig ist.**

Die Registrierung erfolgt asynchron. Claude (oder Sie, wenn Sie den Status beobachten) fragt `getOrder` (`GET /v-next/orders/{orderId}`) ab, bis die Bestellung einen endgültigen Status erreicht: `SUCCEEDED`, `FAILED`, `CANCELLED` oder `PARTIALLY_COMPLETED`. Eine typische Registrierung ist nach wenigen Abfragezyklen fertig; Claude meldet sich dann zurück, statt Sie auf einen Ladeindikator starren zu lassen.

**4. Sie fordern weitere DNS-Einträge an, falls Sie nicht alle im Voraus eingerichtet haben.**

> „Füge außerdem einen CNAME für `www` hinzu, der auf `cname.vercel-dns.com.` zeigt, sowie einen TXT-Eintrag unter `_verify` mit diesem Token.“

Claude ruft für jeden Eintrag `createDnsRecord` (`POST /v-next/dns/records`) auf. Bevor Sie danach fragen, sind zwei Formatierungsregeln wichtig: `rdata` für [CNAME](/de/glossary/dns-record-types/) und ähnliche Eintragstypen muss mit einem abschließenden Punkt enden (`cname.vercel-dns.com.`), während `zoneName` — die Domain selbst — keinen solchen Punkt haben darf. Die Verwechslung dieser beiden Regeln ist die häufigste Ursache eines Validierungsfehlers in diesem Ablauf.

**5. Optional: automatische Verlängerung einschalten.**

> „Schalte die automatische Verlängerung für diese Domain ein.“

Claude schaltet die [automatische Verlängerung](/de/glossary/domain-renewal/) über `PUT /v-next/domain-config/auto-renew` ein oder aus. Wenn sie aktiviert ist, verlängert sich die Domain vor dem Ablauf automatisch über die in der Eigentümer-Wallet verfügbaren Zahlungsarten. Das sollten Sie wissen, bevor Sie sie einschalten, denn es handelt sich um eine fortlaufende Autorisierung und nicht um eine einmalige Bestätigung.

## Schritt 5: Auflösung prüfen

[DNS-Propagation](/de/glossary/dns-propagation/) erfolgt nicht sofort; warten Sie daher vor der Prüfung einige Minuten. DNS-Lesevorgänge benötigen keine Authentifizierung. Sie (oder Claude) können deshalb mit `GET /v-next/dns/records?zoneName=example.com` oder einem öffentlichen DNS-Lookup-Tool bestätigen, was live ist. Wenn Sie die Domain auf eine Deployment-Plattform gerichtet haben, ist deren eigener Domain-Verifizierungsschritt — die Prüfung des angeforderten TXT-Eintrags — ebenfalls eine separate, sinnvolle Bestätigung.

## Mit einer Wallet statt mit einem API-Schlüssel bezahlen

Alles oben nutzt den Weg über den API-Schlüssel. Namefi unterstützt auch die Registrierung einer Domain mit einer Krypto-Wallet und ganz ohne Namefi-Konto über das [x402](/de/glossary/x402/)-Protokoll: Die Wallet des Käufers signiert eine EIP-3009-Autorisierung, die API antwortet ohne beigefügte Zahlung mit `402 Payment Required` samt Preis und führt die Registrierung aus, sobald eine gültige Zahlung eingeht. Dieser Ablauf verdient einen eigenen Leitfaden statt einer Fußnote. Alle Details finden Sie in [Domains mit einer Krypto-Wallet bezahlen: Kein Konto nötig](/de/blog/wallet-checkout/) oder im Zahlungsabschnitt von [Eine Domain mit Ihrem KI-Agenten bei Namefi registrieren](/de/blog/ai-agent-register/).

## Fehlerbehebung

| Symptom | Wahrscheinliche Ursache | Lösung |
| --- | --- | --- |
| `401 UNAUTHORIZED` bei jedem Schreibaufruf | API-Schlüssel ungültig, abgelaufen oder von einer Wallet erzeugt, der die Domain nicht gehört | Erzeugen Sie einen neuen Schlüssel unter [namefi.io/api-key](https://namefi.io/api-key) mit der Wallet, der die Domain gehört (oder gehören wird) |
| `403 FORBIDDEN` | Schlüssel ist gültig, aber die zugehörige Wallet besitzt diese konkrete Domain nicht | Prüfen Sie die Eigentümerschaft anhand Ihres Namefi-Kontos, bevor Sie es erneut versuchen |
| Registrierungsbestellung verbleibt in einem nicht endgültigen Status | Normal — die Registrierung erfolgt asynchron | Fragen Sie `getOrder` weiter ab; Namefis eigene Beispiele fragen alle 5 Sekunden ab. Betrachten Sie die Bestellung erst als festgefahren, wenn sie nie `SUCCEEDED`, `FAILED`, `CANCELLED` oder `PARTIALLY_COMPLETED` erreicht |
| Erstellung/Aktualisierung eines DNS-Eintrags wird mit einem Validierungsfehler abgelehnt | `zoneName` hat einen abschließenden Punkt oder bei einem CNAME-/MX-/NS-`rdata`-Wert fehlt der abschließende Punkt | `zoneName` = kein abschließender Punkt; `rdata`-Werte vom FQDN-Typ = abschließender Punkt erforderlich |
| Registrierung schlägt vollständig fehl | Unzureichendes NFSC-Guthaben in der zahlenden Wallet | Guthaben prüfen (`GET /v-next/balance`), über den Faucet aufladen (Test) oder über das Namefi-Dashboard (Produktion) |
| Claude sagt, es seien keine Domain-Tools verfügbar | MCP-Server nicht verbunden oder ohne den für Schreiboperationen erforderlichen Header verbunden | `claude mcp add` erneut mit dem Flag `--header` ausführen oder `/mcp` / `claude mcp list` auf den Verbindungsstatus prüfen |

## Häufig gestellte Fragen

### Muss ich dafür Namefis REST-API kennen, oder kann ich einfach mit Claude in natürlicher Sprache sprechen?
Natürliche Sprache reicht für den gesamten oben beschriebenen Ablauf aus: „Ist diese Domain verfügbar?“, „Registriere sie“ und „Richte sie auf diese IP-Adresse“ funktionieren als direkte Anfragen. Die Endpunkte und Request-Felder in diesem Leitfaden sind dokumentiert, damit Sie überprüfen können, was Claude im Hintergrund tut, oder sie selbst direkt aufrufen können, wenn Sie statt eines Gesprächs ein Skript verwenden.

### Kostet die Registrierung über Claude mehr als die Registrierung auf Namefis Website?
Dieser Leitfaden stellt keine Preisbehauptung in die eine oder andere Richtung auf. <!-- TODO: Mit dem Team bestätigen — ob die MCP-/API-Preise von Namefi den Standardpreisen für die Registrierung entsprechen oder abweichen. --> In jedem Fall wird die Registrierung gegen dasselbe NFSC-Guthaben abgerechnet, unabhängig davon, ob die Anfrage aus einem Browser, Skript oder MCP-Tool-Aufruf kam.

### Wird meine Domain bei dieser Registrierung automatisch als NFT tokenisiert?
Ja, standardmäßig. Wenn Sie in der Registrierungsanfrage keine `nftReceivingWallet` angeben, wird die Domain auf Base als NFT für die mit Ihrem API-Schlüssel verbundene Wallet registriert. Bei der Registrierung können Sie sie auf eine andere Wallet oder Chain umleiten.

### Was passiert, wenn Claudes DNS-Eintragsanfrage einen Tippfehler enthält — kann sie meine Domain unbemerkt beschädigen?
DNS-Schreibvorgänge durchlaufen vor der Anwendung die Namefi-Validierung. Fehlerhafte `rdata` (etwa ein fehlender abschließender Punkt bei einem CNAME-Ziel) werden mit einem Fehler abgelehnt, statt stillschweigend akzeptiert zu werden — siehe die Tabelle zur Fehlerbehebung oben. Behandeln Sie DNS-Änderungen an einer Live-Domain dennoch wie jede Infrastrukturänderung: Prüfen Sie, was Claude senden wird, bevor Sie bestätigen.

### Kann ich diesen MCP-Server statt mit Claude auch mit Cursor oder Windsurf verwenden?
Ja — der Namefi-Server spricht dasselbe offene MCP-Protokoll, unabhängig davon, welcher Client ihn verbindet; auf Serverseite ändert sich also nichts. Die Verbindungsbefehle auf Clientseite unterscheiden sich je Editor. Siehe die Konfigurationsabschnitte nach Client in [Eine Domain mit Ihrem KI-Agenten bei Namefi registrieren](/de/blog/ai-agent-register/) oder den kürzeren [Namefi MCP Quickstart: Claude Code, Cursor & Windsurf](/de/blog/mcp-quickstart/).

## Ihre nächste Domain aus einem Gespräch kaufen

Dies ist die Einrichtung, die Namefi heute konkret unterstützt, keine Hypothese. Sobald der MCP-Server verbunden ist, geschieht alles vom Suchen eines Namens über die Registrierung und DNS-Konfiguration bis zur optionalen Umwandlung in einen in einer Wallet gehaltenen Token, ohne den Chat zu verlassen. Der MCP-Server stellt mehr als die Registrierung bereit — Outbound-Lead-Finding, DNS-Operationen im Batch, Domainkonfiguration — und alles ist nach der Einrichtung über dieselbe Verbindung auffindbar. Den vollständigen Tool-Katalog finden Sie unter [Namefi MCP Server: Domain-Tools für KI-Agenten](/de/blog/namefi-mcp/).

**[Einen Namefi-API-Schlüssel erzeugen und Claude verbinden](https://namefi.io/api-key).**

## Quellen und weiterführende Lektüre

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP-Server-URL, Transport, Authentifizierung, Registrierungs- und DNS-Endpunkte — Primärquelle für diesen Leitfaden)
- Namefi — [docs.namefi.io: Authentifizierung](https://docs.namefi.io/docs/02-authentication.mdx) (API-Schlüssel, EIP-712- und SIWE-Authentifizierungsmodi; Authentifizierungsanforderungen je Operation)
- Namefi — [docs.namefi.io: Eine Domain registrieren](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (ausgearbeitete Registrierungs- und Abfragebeispiele in SDK, fetch, cURL und Python)
- Namefi — [docs.namefi.io: Guthaben verwalten](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC-Faucet- und Guthabenprüf-Endpunkte)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP-Discovery-Deskriptor)
- Anthropic / Claude Code — [Claude Code über MCP mit Tools verbinden](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (Syntax für `claude mcp add --transport http`, Header-Authentifizierung, Scope-Flags)
- Model Context Protocol — [Mit entfernten MCP-Servern verbinden](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (Ablauf für Custom Connectors in Claude Desktop und claude.ai)
- Model Context Protocol — [Was ist das Model Context Protocol?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (Überblick über das Protokoll)
- llmstxt.org — [Die Datei /llms.txt](https://llmstxt.org) (Spezifikation und Begründung für den Namen der Discovery-Datei namefi.io/llms.txt)
- dev.to — [Eine Domain mit Ihrem KI-Agenten registrieren, kein Mensch erforderlich](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) (MCP-Anleitung eines Drittanbieters auf Basis eines anderen, von Cloudflare unterstützten Registrar-Resellers)
