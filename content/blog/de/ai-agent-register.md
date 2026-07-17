---
title: "So registrieren Sie eine Domain mit Ihrem KI-Agenten bei Namefi"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
format: guide
ogImage: ../../assets/ai-agent-register-og.jpg
description: "Der maßgebliche Leitfaden zur Domainregistrierung bei Namefi mit jedem KI-Agenten — Claude, Codex, Cursor und weiteren — über MCP, REST oder Wallet-Checkout."
keywords: ['domain mit ki-agent registrieren', 'namefi tutorial', 'claude domainregistrierung', 'codex domainregistrierung', 'cursor mcp domain', 'windsurf mcp domain', 'gemini cli mcp domain', 'anleitung agenten-domain', 'x-api-key', 'mcp-server', 'wallet-checkout', 'namefi mcp domainregistrierung', 'ki-agent domain bei namefi kaufen', 'tutorial domainregistrierung mcp']
relatedArticles:
  - /de/blog/claude-mcp-domains/
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
  - /de/glossary/wallet/
  - /de/glossary/x402/
  - /de/glossary/tokenized-domain/
---

Diese Seite sollten Sie als Lesezeichen speichern, wenn ein [KI-Agent](/de/glossary/ai-agent/) — irgendein KI-Agent, nicht der eines bestimmten Anbieters — für Sie bei [Namefi](https://namefi.io), einem ICANN-akkreditierten [Registrar](/de/glossary/registrar/), eine echte Domain registrieren soll. Sie behandelt zunächst die Mechanik, die sich unabhängig vom verwendeten Client nicht ändert, und liefert dann genaue, jeweils einzeln verifizierte Einrichtungsschritte für die sechs Agenten, die Menschen heute tatsächlich nutzen: Claude Desktop, Claude Code, OpenAI Codex, Cursor, Windsurf und Gemini CLI. Falls Ihr Agent nicht auf dieser Liste steht, endet der Leitfaden mit einem direkten REST-Weg, der mit allem funktioniert, was eine HTTP-Anfrage stellen kann, denn die gesamte API-Oberfläche von Namefi wird genau zu diesem Zweck auch als Klartext veröffentlicht.

Dieser Leitfaden wird vom Namefi-Team geschrieben und gepflegt; die Namefi-Seite jedes Schritts stammt daher aus erster Hand. Er erklärt in lesbarer Form dieselbe API, die wir für Agenten unter [namefi.io/llms.txt](https://namefi.io/llms.txt) und [docs.namefi.io](https://docs.namefi.io) veröffentlichen. Die Einrichtung bei jedem Agenten-Anbieter wurde am Veröffentlichungsdatum dieses Leitfadens anhand der jeweils aktuellen Dokumentation des Anbieters überprüft. Wo die Dokumentation eines Anbieters keine klare Antwort gibt, wird das ausdrücklich gekennzeichnet, statt eine Vermutung einzufügen.

Wenn Sie bereits wissen, dass Sie Claude nutzen, und eine vollständige kommentierte Anleitung mit einem echten Transkript wünschen, geht [Eine Domain mit Claude kaufen: Namefi MCP Schritt-für-Schritt-Leitfaden](/de/blog/claude-mcp-domains/) über die komprimierten Claude-Abschnitte hier hinaus. Diese Seite ist der Knotenpunkt; jener Beitrag und die weiteren hier verteilten Links sind die Speichen.

## Was „eine Domain mit einem KI-Agenten registrieren“ tatsächlich bedeutet

Damit ein Agent in Ihrem Auftrag eine Domain registrieren kann, ohne dass Sie selbst ein Formular ausfüllen, müssen zwei Dinge gelten. Erstens benötigt der Agent einen Weg, die API von Namefi zu *entdecken und aufzurufen*: das ist das [Model Context Protocol](https://modelcontextprotocol.io) (MCP), ein offener Standard, über den ein KI-Client sich mit einem externen Tool-Server verbinden und eine definierte Liste aufrufbarer Vorgänge sehen kann, oder eine reine HTTP-Anfrage, wenn der Agent skriptgesteuert statt dialogorientiert arbeitet. Zweitens braucht der Agent eine *Ausgabenautorisierung*: einen API-Schlüssel, der an ein gedecktes Guthaben gebunden ist, oder ein Krypto-[Wallet](/de/glossary/wallet/), das eine Zahlung sofort signieren kann. Alles in diesem Leitfaden ist eines dieser beiden Elemente.

Namefi betreibt für seine gesamte API einen MCP-Server unter `https://api.namefi.io/mcp` über den Streamable-HTTP-Transport. Ein Agent — oder die Person, die ihn konfiguriert — kann ihn entdecken, ohne diese Seite zu lesen: Wir veröffentlichen unter [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) einen maschinenlesbaren Deskriptor, der den Server `namefi-api` nennt und seinen Transport als `streamable-http` aufführt. Jeder unten genannte Client verbindet sich mit derselben URL; unterschiedlich ist nur, wie die Konfigurationsdatei oder Kommandozeile des jeweiligen Clients auf diesen Server verweist.

## Der universelle Ablauf in fünf Schritten

Dies ist die Abfolge hinter jedem weiter unten stehenden agentenspezifischen Abschnitt. Sobald Sie sie hier verstanden haben, sind die Anweisungen pro Agent nur noch: „Wie führe ich Schritt 2 in diesem speziellen Werkzeug aus?“

1. **Zugangsdaten beschaffen.** Erzeugen Sie einen [API-Schlüssel](https://namefi.io/api-key) — eine mit `nfk_` beginnende Zeichenfolge, die für jeden Vorgang funktioniert: Registrierung, Erstellung, Aktualisierung und Löschung von DNS-Einträgen. Der Schlüssel erbt die Berechtigungen des Wallets, das ihn erzeugt hat; erzeugen Sie ihn daher aus dem Wallet, das die Domain besitzen soll. Wenn Sie lieber gar keinen Namefi-API-Schlüssel halten möchten, wechseln Sie zum unten beschriebenen Wallet-Zahlungsweg — dieser benötigt kein Konto.
2. **Ihren Agenten mit dem MCP-Server verbinden.** Richten Sie Ihren Client mit dem Header `x-api-key`, der Ihren Schlüssel enthält, auf `https://api.namefi.io/mcp` aus. Die genaue Syntax ist clientspezifisch; siehe den Abschnitt zu Ihrem Agenten unten.
3. **Suchen und bepreisen.** Fragen Sie in natürlicher Sprache, ob ein Name verfügbar ist. Dies ruft den Vorgang `checkAvailability` (`GET /v-next/search/availability?domain=…`) auf, der überhaupt keine Authentifizierung benötigt, oder seine Bulk-Variante, um mehrere Kandidaten gleichzeitig zu prüfen.
4. **Registrieren und dann abfragen.** Nach der Bestätigung übermittelt der Agent `registerDomain` (`POST /v-next/orders/register-domain`), oder die kombinierte Variante `register-domain/records`, wenn Sie DNS im selben Aufruf setzen möchten. Die Registrierung ist asynchron: Der Request-Body nimmt `normalizedDomainName` und `durationInYears` entgegen; der Endpunkt `register-domain/records` akzeptiert zusätzlich ein Array `records` (`name`, `type`, `rdata`, `ttl` je Eintrag), sodass DNS geschrieben wird, sobald die Bestellung abgeschlossen ist. Der Agent (oder Sie) fragt `getOrder` (`GET /v-next/orders/{orderId}`) ab, bis ein Endstatus erreicht ist: `SUCCEEDED`, `FAILED`, `CANCELLED` oder `PARTIALLY_COMPLETED`.
5. **DNS konfigurieren und überprüfen.** Ergänzen oder ändern Sie [DNS-Einträge](/de/glossary/dns-record-types/) über `createDnsRecord` (`POST /v-next/dns/records`), setzen Sie bei Bedarf die Delegation auf [Nameserver](/de/glossary/nameserver/)-Ebene und geben Sie der [DNS-Propagation](/de/glossary/dns-propagation/) einige Minuten Zeit, bevor Sie bestätigen, dass die Domain auflöst.

Der Registrierungsrequest akzeptiert außerdem ein Objekt `domainSetupOptions` mit Überschreibungen pro Domain: `autoPark`, `autoEns`, `autoRenew`, `dnssec` und `keepExistingNameservers`. Letzteres weist Namefi an, die bestehende Nameserver-Delegation der Domain unverändert zu lassen, statt sie neu auszurichten; das ist nützlich, wenn Sie eine Domain registrieren, die sofort weiterhin an einem anderen Ort auflösen soll. Ein optionales Feld `nftReceivingWallet` steuert, wo der Eigentums-Token der Domain landet. Wenn Sie es weglassen, wird die Domain als NFT auf Base an das mit Ihrem API-Schlüssel verknüpfte Wallet registriert.

## Einrichtungsmatrix nach Agent

| Agent | Verbindungsmethode | Ort der Konfiguration | Benutzerdefinierter Auth-Header unterstützt | Verifiziert anhand von |
| --- | --- | --- | --- | --- |
| Claude Code | MCP, Streamable HTTP | CLI-Befehl `claude mcp add` (schreibt in `~/.claude.json` oder `.mcp.json`) | Ja — Flag `--header` | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp), überprüft am 2026-07-10 |
| Claude Desktop / claude.ai | MCP, Streamable HTTP über Custom Connector | Settings → Connectors → Add custom connector | Servergesteuerte Authentifizierungsabfrage (OAuth, API-Schlüssel oder Zugangsdaten, je nach Serveranforderung) | [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers), überprüft am 2026-07-10 |
| OpenAI Codex CLI | MCP, Streamable HTTP | `~/.codex/config.toml`, Tabelle `[mcp_servers.<name>]` | Ja — `http_headers` (statisch) oder `env_http_headers` (aus Umgebungsvariablen) | [learn.chatgpt.com/docs/extend/mcp](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (das aktuelle Weiterleitungsziel von `developers.openai.com/codex/mcp`), überprüft am 2026-07-10 |
| Cursor | MCP, Streamable HTTP | `.cursor/mcp.json` (Projekt) oder `~/.cursor/mcp.json` (global) | Ja — Objekt `headers` mit `${env:VAR}`-Interpolation | [cursor.com/docs/mcp](https://cursor.com/docs/mcp), überprüft am 2026-07-10 |
| Windsurf (Cascade) | MCP, Streamable HTTP | `~/.codeium/windsurf/mcp_config.json` | Ja — Objekt `headers` in einem `serverUrl`-Eintrag mit `${env:VAR}`-Interpolation | [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (zum Veröffentlichungsdatum dieses Leitfadens leitet die URL auf `docs.devin.ai/desktop/cascade/mcp` weiter; siehe den Windsurf-Abschnitt unten), überprüft am 2026-07-10 |
| Gemini CLI | MCP, Streamable HTTP | `~/.gemini/settings.json` (Nutzer) oder `.gemini/settings.json` (Projekt) | Ja — Objekt `headers` in einem `httpUrl`-Eintrag | [geminicli.com/docs/tools/mcp-server](https://geminicli.com/docs/tools/mcp-server/), überprüft am 2026-07-10 |
| Jeder andere MCP-Client | MCP, Streamable HTTP | Jedes Konfigurationsformat, das der Client dokumentiert | Abhängig vom Client — die Serverseite von Namefi ändert sich nicht | [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) |
| Jedes Skript oder jeder Nicht-MCP-Agent | Direktes REST | N/A — direkte HTTPS-Aufrufe | Ja — Header `x-api-key` bei jedem Schreibvorgang | [namefi.io/llms.txt](https://namefi.io/llms.txt), [docs.namefi.io](https://docs.namefi.io) |

Jede obige Zeile verbindet sich mit demselben Server und demselben Satz von Vorgängen. Pro Agent ändert sich nur die Syntax, mit der diesem bestimmten Client gesagt wird: „Hier ist ein entfernter MCP-Server, und dies ist der Header, den er mitsenden soll.“

**Jedes Mal derselbe Test-Prompt.** Führen Sie nach dem Verbinden jedes der unten genannten Agenten genau diesen Prompt aus, damit Sie die Ergebnisse von Client zu Client vergleichen können:

> „Prüfe, ob `example.com` zur Registrierung bei Namefi verfügbar ist, und teile mir mit, welches Werkzeug oder welchen Vorgang du dazu aufgerufen hast. Registriere noch nichts.“

Dies ist ein reiner Leseaufruf: `checkAvailability` benötigt keine Authentifizierung. Er kann daher sicher mit einem frisch verbundenen Agenten ausgeführt werden, selbst bevor Sie Guthaben eingezahlt haben, und zeigt sofort, ob Verbindung und Werkzeugliste funktionieren.

## Claude Desktop und claude.ai

Claude Desktop und claude.ai verbinden sich über **Custom Connectors** mit entfernten MCP-Servern. Öffnen Sie Settings, gehen Sie zu Connectors, wählen Sie „Add custom connector“ und geben Sie `https://api.namefi.io/mcp` als Server-URL ein. Nach dem Klick auf Add fordert Claude Sie auf, die Authentifizierung abzuschließen. Anthropic beschreibt diesen Schritt so, dass dabei häufig „OAuth, API keys, or username/password combinations“ vorkommen; die genaue Aufforderung wird durch die Anforderungen des verbundenen Servers bestimmt.

<!-- TODO: verify — the exact field Claude Desktop's Custom Connector screen presents for an x-api-key-style header --> Wenn Ihre Desktop-Einrichtung keinen offensichtlichen Ort zum Einfügen des Schlüssels anbietet, ist Claude Code (als Nächstes) heute der verifizierte Weg für Schreibvorgänge; schreibgeschützte Werkzeuge wie die Verfügbarkeitssuche funktionieren über den Connector ganz ohne Schlüssel. Die vollständige Anleitung, einschließlich des Connector-Ablaufs nach der Verbindung, finden Sie in [Eine Domain mit Claude kaufen: Namefi MCP Schritt-für-Schritt-Leitfaden](/de/blog/claude-mcp-domains/).

## Claude Code

Die eigene Dokumentation von Claude Code gibt eine genaue allgemeine Syntax an, um einen entfernten HTTP-MCP-Server mit benutzerdefiniertem Header hinzuzufügen:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

Führen Sie dies einmal im Terminal aus und ersetzen Sie `YOUR_KEY` durch Ihren echten Schlüssel. Standardmäßig schreibt dies den Server in den **lokalen** Bereich, sodass er nur für Sie im aktuellen Projekt verfügbar ist; ältere Claude-Code-Versionen nannten diesen Bereich „project“. Ergänzen Sie `--scope user`, wenn die Verbindung in jedem Projekt auf Ihrem Rechner verfügbar sein soll, oder `--scope project`, um sie über eine eingecheckte `.mcp.json` mit allen Personen im Projekt zu teilen. Bestätigen Sie die Verbindung mit `claude mcp list` und prüfen Sie die Live-Anzahl der Werkzeuge innerhalb einer Sitzung mit `/mcp`.

## OpenAI Codex CLI

Codex CLI speichert die MCP-Konfiguration standardmäßig in der TOML-Datei `~/.codex/config.toml` (oder in einer projektbezogenen `.codex/config.toml` für vertrauenswürdige Projekte). Jeder Server erhält seine eigene Tabelle; der Transport wird anhand der vorhandenen Schlüssel abgeleitet: Ein Schlüssel `command` bedeutet einen lokalen stdio-Server, ein Schlüssel `url` bedeutet Streamable HTTP. Die Codex-Dokumentation schreibt ausdrücklich vor, dass der Tabellenname `mcp_servers` mit Unterstrich heißen muss; `mcp-servers` oder ähnliche Varianten werden stillschweigend ignoriert.

```toml
# ~/.codex/config.toml
[mcp_servers.namefi]
url = "https://api.namefi.io/mcp"
env_http_headers = { "x-api-key" = "NAMEFI_API_KEY" }
```

Diese Form holt den Schlüssel aus einer Umgebungsvariablen namens `NAMEFI_API_KEY`, statt ihn in die Datei zu schreiben. Setzen Sie sie in Ihrer Shell, bevor Sie Codex ausführen. Wenn Sie ihn lieber fest eintragen möchten — nicht empfohlen für eine Datei, die Sie möglicherweise committen —, lautet die gleichwertige statische Form `http_headers = { "x-api-key" = "YOUR_KEY" }`. Codex dokumentiert außerdem ein Feld `bearer_token_env_var` speziell für die Authentifizierung nach dem Muster `Authorization: Bearer …`; der Header `x-api-key` von Namefi benötigt jedoch die allgemeinen Felder `http_headers` beziehungsweise `env_http_headers`, nicht das bearer-spezifische Feld.

## Cursor

Cursor liest MCP-Serverdefinitionen aus `mcp.json`: einer projektbezogenen Kopie unter `.cursor/mcp.json` im Root Ihres Repositories oder einer globalen Kopie unter `~/.cursor/mcp.json`, die überall gilt. Die Cursor-Dokumentation zeigt die Form für Remote-Server direkt, einschließlich headerbasierter Authentifizierung und Umgebungsvariablen-Interpolation, sodass der Schlüssel selbst nicht in der Datei stehen muss:

```json
{
  "mcpServers": {
    "namefi": {
      "url": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

`${env:NAMEFI_API_KEY}` wird zur Verbindungszeit durch den Wert dieser Umgebungsvariablen ersetzt. [Namefi MCP Quickstart: Claude Code, Cursor & Windsurf](/de/blog/mcp-quickstart/) bietet die komprimierte Version derselben Einrichtung.

## Windsurf (Cascade)

Die MCP-Integration von Windsurf — im Produkt als **Cascade** bezeichnet — liest ihre Serverliste aus `~/.codeium/windsurf/mcp_config.json`. Entfernte HTTP-Server verwenden ein Feld `serverUrl` (nicht `command`) sowie dieselbe Art von `headers`-Objekt und `${env:VAR}`-Interpolation wie Cursor:

```json
{
  "mcpServers": {
    "namefi": {
      "serverUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

Etwas sollte klar angesprochen werden: Zum Veröffentlichungsdatum dieses Leitfadens leitet `docs.windsurf.com/windsurf/cascade/mcp` auf `docs.devin.ai/desktop/cascade/mcp` weiter. Die Dokumentation von Windsurf liegt jetzt unter der Produktdokumentations-Domain Devin von Cognition, und die Seite selbst nennt „Windsurf“, „Cascade“ und „Devin Desktop“. Das obige Konfigurationsformat ist das, was diese aktuelle Seite dokumentiert. Wenn Sie eine ältere Windsurf-Version nutzen, sollten die Feldnamen übereinstimmen; prüfen Sie jedoch die URL, auf die die In-App-Hilfe Ihrer Version verlinkt.

## Gemini CLI

Gemini CLI liest MCP-Server aus `settings.json`: einer Kopie auf Nutzerebene unter `~/.gemini/settings.json` oder einer Kopie auf Projektebene unter `.gemini/settings.json`, die nur in diesem Projekt gilt. Die Form für entfernte Server verwendet `httpUrl` statt `url`:

```json
{
  "mcpServers": {
    "namefi": {
      "httpUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "YOUR_KEY"
      }
    }
  }
}
```

Die Gemini-CLI-Dokumentation beschreibt zudem ein Feld `timeout` (in Millisekunden, Standardwert 600,000), falls ein bestimmter Werkzeugaufruf länger als üblich benötigt. Für das Abfragen des Registrierungsstatus sollte dies nicht nötig sein, da der Client nur auf jeden einzelnen Aufruf wartet, nicht auf die gesamte Abfrageschleife.

## Jeder andere MCP-fähige Agent

Wenn Ihr Agent MCP unterstützt, aber nicht zu den sechs oben genannten gehört, ist die Serverseite unabhängig vom verbundenen Client identisch: Richten Sie ihn über Streamable HTTP auf `https://api.namefi.io/mcp` aus und verwenden Sie `x-api-key: YOUR_KEY` als benutzerdefinierten Header. Schlagen Sie die konkrete Konfigurationsdatei oder Befehlssyntax in der Dokumentation Ihres Clients nach. Der Deskriptor unter [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) existiert genau dafür, damit ein Agent — oder die Person, die ihn konfiguriert — URL, Transport und Authentifizierungsanforderungen des Servers finden kann, ohne dass ein Mensch sie von Hand einfügt.

Ein Muster, das Sie kennen sollten, wenn Ihr Client nur **lokale (stdio) MCP-Server** unterstützt und nicht direkt Remote-HTTP oder SSE: Das Community-Paket `mcp-remote` überbrückt einen entfernten Streamable-HTTP-Server zu einem lokalen Prozess, den Ihr Client normal starten kann, und leitet die von Ihnen konfigurierten Header weiter. Dies ist kein Weg, den dieser Leitfaden anhand der eigenen Dokumentation von Namefi überprüfen kann, da es sich um eine Brücke eines Drittanbieters und nicht um einen von Namefi veröffentlichten Pfad handelt. Behandeln Sie ihn als Rückfalloption, wenn Ihr spezieller Client tatsächlich keine native Remote-HTTP-Unterstützung besitzt, nicht als Standardwahl. <!-- TODO: verify — an exact mcp-remote invocation for Namefi's server if a client without native Streamable HTTP support needs it -->

## Ganz ohne MCP: der direkte REST-Weg

Jeder oben beschriebene Vorgang ist auch ein reiner HTTPS-Endpunkt, der einzeln unter [namefi.io/llms.txt](https://namefi.io/llms.txt) und vollständig unter [docs.namefi.io](https://docs.namefi.io) dokumentiert ist. Ein Agenten-Framework, das HTTP-Aufrufe machen kann, aber kein MCP spricht — ein benutzerdefiniertes Skript, eine andere Agentenlaufzeit oder ein CI-Job — kann denselben Ablauf direkt steuern:

```bash
# 1. Check availability (no auth required)
curl "https://api.namefi.io/v-next/search/availability?domain=example.com"

# 2. Register (requires x-api-key)
curl -X POST "https://api.namefi.io/v-next/orders/register-domain" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"normalizedDomainName": "example.com", "durationInYears": 1}'

# 3. Poll the order until it reaches a terminal status
curl "https://api.namefi.io/v-next/orders/{orderId}" \
  -H "x-api-key: YOUR_KEY"
```

llms.txt ist eine Klartext-Konvention: ein maschinenlesbarer Index, den eine Website im Root veröffentlicht, damit ein KI-Agent entdecken kann, was eine API tut, ohne gerenderte Dokumentationsseiten zu durchsuchen. Die Datei von Namefi ist kurz genug, um sie direkt unter [namefi.io/llms.txt](https://namefi.io/llms.txt) zu lesen, wenn Sie die vollständige Fassung statt der komprimierten Zusammenfassung oben möchten. Mehr über die Konvention selbst finden Sie in [llms.txt für Domains: Eine API, die jeder KI-Agent lesen kann](/de/blog/llms-txt/).

## Bezahlen: API-Schlüssel oder Wallet-Checkout

Alles in den obigen Abschnitten setzt einen API-Schlüssel voraus, der gegen ein gedecktes NFSC-Guthaben (Namefi Service Credit) abgerechnet wird. Sie können dieses jederzeit unter `GET /v-next/balance` prüfen (`x-api-key` erforderlich), es in Entwicklungsumgebungen über einen Faucet-Endpunkt auffüllen oder in der Produktion über das Namefi-Dashboard. <!-- TODO: confirm with team — the exact production NFSC top-up flow: accepted payment methods, and whether it's purchasable through chat/API or only the dashboard UI -->

Namefi unterstützt auch die Registrierung einer Domain mit einem Krypto-Wallet und **ganz ohne Namefi-Konto** über das Protokoll [x402](/de/glossary/x402/): Das Wallet eines Agenten signiert eine EIP-3009-Autorisierung; wenn noch keine Zahlung beigefügt wurde, antwortet die API mit HTTP 402 und dem Preis, und die Registrierung wird abgeschlossen, sobald eine gültige signierte Zahlung eintrifft — typischerweise in einem [Stablecoin](/de/glossary/stablecoin/) wie USDC. Es gibt außerdem eine verwandte Challenge-Response-Variante von MPP (Machine Payable Protocol) und einen manuellen EIP-712-Signaturweg für Wallets, die keine der beiden Abkürzungen verwenden. Dieser Wallet-first-Weg ist gerade für die Agenten wichtig, um die es in diesem Leitfaden geht: Er entfernt die Kontoerstellung vollständig, sodass ein autonomer Prozess überhaupt keinen API-Schlüssel halten oder preisgeben muss. [Domains mit einem Krypto-Wallet bezahlen: kein Konto erforderlich](/de/blog/wallet-checkout/) behandelt diesen Ablauf für sich.

## Leitplanken, bevor Sie einem Agenten Kaufbefugnis geben

Ein Agent, der eine Domain registrieren kann, kann auch Geld ausgeben und DNS für eine aktive Infrastruktur umschreiben. Einige Entscheidungen sollten Sie daher bewusst treffen, statt sie beim Standard zu belassen:

- **Nutzen Sie für den API-Schlüssel ein Wallet mit minimalen Berechtigungen.** Ein Schlüssel erbt die Berechtigungen des Wallets, das ihn erzeugt hat. Erzeugen Sie ihn aus dem Wallet, das neue Registrierungen besitzen soll, nicht aus einem Wallet mit Vermögenswerten, die nicht durch den Schlüssel eines Agenten gefährdet werden sollen.
- **Begrenzen Sie die Ausgaben des Agenten.** Ein NFSC-Guthaben ist selbst ein Ausgabenlimit: Statten Sie es nur mit so viel aus, wie ein unbeaufsichtigter Agent ausgeben darf, statt ein großes dauerhaftes Guthaben bereitzuhalten.
- **Entscheiden Sie, wo ein Mensch im Ablauf bleibt.** Lesevorgänge wie die Verfügbarkeitssuche brauchen keine Authentifizierung und bergen kein Risiko. Sobald ein Aufruf `registerDomain` übermittelt, die automatische Verlängerung umschaltet oder einen DNS-Eintrag auf einer Domain schreibt, die bereits Traffic verarbeitet, sollten Sie eine ausdrückliche Bestätigung verlangen, statt den Agenten autonom fortfahren zu lassen.
- **Prüfen Sie DNS-Schreibvorgänge, bevor Sie sie bestätigen,** so wie jede andere Infrastrukturänderung. Die Validierung von Namefi weist fehlerhafte Einträge zurück, statt sie stillschweigend zu akzeptieren (siehe die Tabelle zur Fehlerbehebung unten). Sie erkennt jedoch Formatfehler, nicht einen syntaktisch korrekten, aber falschen Wert.

[Was ist ein agent-nativer Domain-Registrar?](/de/blog/agent-native/) enthält eine ausführlichere Prüfliste — Auffindbarkeit, maschinenlesbare Fehler und Zahlungswege, die keinen Menschen mit Kreditkarte voraussetzen —, um die Agentenoberfläche jedes Registrars einschließlich Namefi zu bewerten.

## Fehlerbehebung

| Symptom | Wahrscheinliche Ursache | Lösung |
| --- | --- | --- |
| `401 UNAUTHORIZED` bei jedem Schreibaufruf | API-Schlüssel ungültig, abgelaufen oder aus einem Wallet erzeugt, das die Zieldomain nicht besitzt | Erzeugen Sie unter [namefi.io/api-key](https://namefi.io/api-key) einen neuen Schlüssel aus dem Wallet, das die Domain besitzt oder besitzen wird |
| `403 FORBIDDEN` | Schlüssel ist gültig, aber sein Wallet besitzt diese konkrete Domain nicht | Prüfen Sie den Besitz, bevor Sie es erneut versuchen |
| Codex ignoriert Ihren Eintrag `[mcp_servers.namefi]` | Tippfehler im Tabellennamen — Codex verlangt die Unterstrichform `mcp_servers`, nicht `mcp-servers` | Korrigieren Sie die Tabellenüberschrift in `config.toml` |
| Cursor oder Windsurf zeigt den Server als getrennt an | Objekt `headers` fehlerhaft oder `${env:VAR}` verweist auf eine nicht gesetzte Variable | Prüfen Sie, ob das JSON gültig ist und die referenzierte Umgebungsvariable tatsächlich in der Shell exportiert wurde, die den Editor gestartet hat |
| Gemini CLI findet die Konfiguration nicht | Die falsche `settings.json` wurde bearbeitet — Dateien auf Nutzer- und Projektebene sind getrennt | Prüfen Sie, ob Sie im aktuellen Projekt `~/.gemini/settings.json` oder `.gemini/settings.json` verwenden wollten |
| Registrierungsauftrag hängt in einem nicht finalen Status | Normal — die Registrierung ist asynchron | Fragen Sie `getOrder` weiter ab; behandeln Sie sie erst als hängend, wenn nie `SUCCEEDED`, `FAILED`, `CANCELLED` oder `PARTIALLY_COMPLETED` erreicht wird |
| Erstellung/Aktualisierung eines DNS-Eintrags wird mit Validierungsfehler abgelehnt | `zoneName` hat einen abschließenden Punkt oder ein `rdata` für CNAME/MX/NS hat nicht den erforderlichen abschließenden Punkt | `zoneName` = kein abschließender Punkt; `rdata` von FQDN-Typen = abschließender Punkt erforderlich |
| Registrierung schlägt vollständig fehl | Ungenügendes NFSC-Guthaben im zahlenden Wallet | Prüfen Sie `GET /v-next/balance` und füllen Sie über Faucet (Entwicklung) oder Dashboard (Produktion) auf |
| Agent sagt, keine Domainwerkzeuge verfügbar zu haben | MCP-Server nicht verbunden oder ohne Header verbunden, der für Schreibvorgänge erforderlich ist | Prüfen Sie die Konfigurationsdatei Ihres Clients erneut oder führen Sie dessen Befehl zum Hinzufügen des Servers mit Header erneut aus |

## Häufig gestellte Fragen

### Muss ich einen Agenten auswählen und bei ihm bleiben?

Nein. Der MCP-Server und jeder REST-Endpunkt sind unabhängig vom verbundenen Client identisch. Sie können die Einrichtung heute für Claude Code und morgen für Cursor mit demselben API-Schlüssel und demselben NFSC-Guthaben ausführen; ein Migrationsschritt ist nicht erforderlich.

### Welcher dieser Agenten ist „am besten“ für die Registrierung einer Domain?

Für diese Aufgabe gibt es keinen wesentlichen Fähigkeitsunterschied, da jeder Client dieselben serverseitigen Vorgänge aufruft. Die Unterschiede liegen ausschließlich in der MCP-Konfigurationssyntax des jeweiligen Clients. Genau deshalb hat dieser Leitfaden für jeden einen eigenen Abschnitt und denselben Test-Prompt: Führen Sie ihn einmal pro Client aus und vergleichen Sie die Transkripte selbst.

### Was ist, wenn mein Agent MCP überhaupt nicht unterstützt?

Nutzen Sie den oben beschriebenen direkten REST-Weg. Jeder Vorgang, den ein MCP-Tool-Aufruf erreicht, ist auch ein dokumentierter HTTPS-Endpunkt; `namefi.io/llms.txt` ist ausdrücklich als Klartext-Einstiegspunkt gestaltet, den ein Agent oder die Person, die ihn konfiguriert, ohne Browser lesen kann.

### Wird meine Domain bei einer Registrierung auf diesem Weg automatisch tokenisiert?

Ja, standardmäßig. Wenn Sie im Registrierungsrequest kein `nftReceivingWallet` angeben, wird die Domain auf Base als NFT an das mit Ihrem API-Schlüssel verknüpfte Wallet registriert. Sie können sie bei der Registrierung an ein anderes Wallet umleiten.

### Kann ein Agent eine Domain registrieren, ohne dass ich überhaupt einen API-Schlüssel halte?

Ja — der Wallet-signierte x402-Checkout benötigt kein Namefi-Konto und keinen API-Schlüssel, nur ein gedecktes Wallet. Der Zahlungsabschnitt oben behandelt das Wesentliche dieses Ablaufs; [Domains mit einem Krypto-Wallet bezahlen: kein Konto erforderlich](/de/blog/wallet-checkout/) enthält die vollständige Anleitung.

### Kostet die Registrierung über einen Agenten mehr als über die Website von Namefi?

Dieser Leitfaden stellt keinen Preisvergleich in die eine oder andere Richtung an. <!-- TODO: confirm with team — whether Namefi's MCP/API pricing matches its standard registration pricing, or differs --> In jedem Fall belastet jeder Weg dasselbe NFSC-Guthaben, unabhängig davon, ob die Anfrage aus einem Browser, einem Skript oder dem Werkzeugaufruf eines Agenten stammt.

## Beginnen Sie mit dem Agenten, den Sie bereits geöffnet haben

Sie brauchen nicht sechs Clients installiert, um diesen Leitfaden zu nutzen — Sie brauchen genau einen plus einen Namefi-API-Schlüssel oder ein gedecktes Wallet. Wählen Sie oben den Abschnitt, der zu dem Agenten passt, mit dem Sie bereits arbeiten, führen Sie die Einrichtung aus und probieren Sie den Test-Prompt. Danach geschieht der weitere Ablauf dieser Seite — suchen, registrieren, DNS konfigurieren — in derselben Unterhaltung.

**[Einen Namefi-API-Schlüssel erzeugen](https://namefi.io/api-key)** oder tiefer einsteigen mit der [Claude-Anleitung samt vollständigem Transkript](/de/blog/claude-mcp-domains/) und dem [direkten Vergleich der agentenorientierten Registrare](/de/blog/cf-namecom-namefi/). Zu den Bausteinen unterhalb dieses Leitfadens siehe [Namefi MCP Server: Domain Tools for AI Agents](/de/blog/namefi-mcp/), [Namefi MCP Quickstart: Claude Code, Cursor & Windsurf](/de/blog/mcp-quickstart/), [Domains mit einem Krypto-Wallet bezahlen: kein Konto erforderlich](/de/blog/wallet-checkout/) und [llms.txt für Domains: Eine API, die jeder KI-Agent lesen kann](/de/blog/llms-txt/).

## Quellen und weiterführende Lektüre

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP-Server-URL, Transport, Authentifizierung, Referenz für Registrierungs-/DNS-Endpunkte, Felder von `domainSetupOptions` — Primärquelle für jede Namefi-spezifische Aussage in diesem Leitfaden)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (Zahlungsflüsse für x402, MPP und EIP-712 über Wallets)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP-Entdeckungsdeskriptor: Servername, URL, Transport, Authentifizierungstyp)
- Namefi — [docs.namefi.io: Authentifizierung](https://docs.namefi.io/docs/02-authentication.mdx) (API-Schlüssel, EIP-712- und SIWE-Authentifizierungsmodi; Authentifizierungsanforderungen pro Vorgang)
- Namefi — [docs.namefi.io: Eine Domain registrieren](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (Felder für Registrierungsanfragen, Abfrageablauf, Werte für Auftragsstatus)
- Namefi — [docs.namefi.io: Ihr Guthaben verwalten](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (NFSC-Guthaben und Faucet-Endpunkte)
- Anthropic / Claude Code — [Claude Code über MCP mit Werkzeugen verbinden](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (Syntax `claude mcp add --transport http`, Flags `--header`, `--scope`)
- Model Context Protocol — [Mit entfernten MCP-Servern verbinden](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (Ablauf für Custom Connectors in Claude Desktop / claude.ai)
- OpenAI — [learn.chatgpt.com: Model Context Protocol (Codex CLI)](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (Tabelle `[mcp_servers.<name>]` in `config.toml`, Felder `url`, `http_headers`, `env_http_headers`, `bearer_token_env_var`)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (Format für Remote-Server in `mcp.json`, `headers`, `${env:VAR}`-Interpolation, Orte für Projekt- und globale Konfiguration)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (leitet zum Veröffentlichungsdatum dieses Leitfadens auf [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp) weiter; Format von `mcp_config.json`, `serverUrl`, `headers`)
- Google — [geminicli.com: MCP-Server mit der Gemini CLI](https://geminicli.com/docs/tools/mcp-server/) (Format `settings.json`, `httpUrl`, `headers`, `timeout`)
- llmstxt.org — [Die Datei /llms.txt](https://llmstxt.org) (Spezifikation und Begründung der Entdeckungskonvention, der `namefi.io/llms.txt` folgt)
