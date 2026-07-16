---
title: "Namefi MCP-Schnellstart: Claude Code, Cursor & Windsurf"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
format: guide
ogImage: ../../assets/mcp-quickstart-og.jpg
description: "MCP-Einrichtung je Editor für Claude Code, Cursor und Windsurf, gefolgt von einem 5-Schritte-Schnellstart von einer neuen App bis zu einer live geschalteten benutzerdefinierten Domain — ohne den Editor zu verlassen."
keywords: ["claude code mcp domain", "cursor mcp domain", "windsurf mcp domain", "domain-registrierung im editor", "domain-registrierung programmieragent", "domain im editor registrieren", "mcp schnellstart", "namefi mcp konfiguration", "vercel custom domain namefi", "cloudflare pages custom domain namefi", "custom domain mit ki-agent deployen", "schnellstart domain-registrierung", "x-api-key mcp konfiguration", "domain auf deployment zeigen"]
relatedArticles:
  - /de/blog/ai-agent-register/
  - /de/blog/claude-mcp-domains/
  - /de/blog/namefi-mcp/
  - /de/blog/wallet-checkout/
  - /de/blog/vibe-coding-domain/
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
  - /de/glossary/nameserver/
  - /de/glossary/domain-renewal/
---

Du bist bereits im Editor. Die App ist eingerichtet, das erste Deployment ist gerade auf einer Plattform-Subdomain live gegangen, und bevor du Menschen darauf verweisen kannst, fehlt nur noch eine echte Domain. Dieser Schnellstart zeigt, wie du diesen Registrierungsschritt erledigst, ohne einen Browser-Tab zu öffnen, ein Checkout-Formular auszufüllen oder dieselbe [KI-Agent](/de/glossary/ai-agent/)-Sitzung zu verlassen, die die App erstellt hat: die exakte [MCP](https://modelcontextprotocol.io)-Verbindungskonfiguration für Claude Code, Cursor und Windsurf, ein komprimierter Ablauf in fünf Schritten und — der Teil, den die meisten Domain-Leitfäden überspringen — wie du die gerade registrierte Domain tatsächlich auf das gerade ausgelieferte Deployment zeigst.

Dieser Leitfaden behandelt bewusst drei Editoren. Falls du stattdessen OpenAI Codex, Gemini CLI oder Claude Desktop nutzt, ist [Wie du mit deinem KI-Agenten eine Domain bei Namefi registrierst](/de/blog/ai-agent-register/) der zentrale Leitfaden mit einer verifizierten Einrichtung für alle sechs Clients sowie dem direkten REST-Weg für alles, was nicht MCP-nativ ist. Alles hier verbindet sich mit demselben [Namefi](https://namefi.io)-MCP-Server, den dieser zentrale Leitfaden dokumentiert. Daher widerspricht nichts weiter unten ihm — diese Seite ist lediglich die verdichtete, auf Entwicklertools ausgerichtete Fassung mit einem Deployment-Schritt, den der zentrale Leitfaden nicht behandelt.

## Warum die Domain im Editor registrieren

„Registriere eine Domain“ ist für eine Fünf-Minuten-Aufgabe ein Kontextwechsel mit ungewöhnlich hohen Kosten: Du verlässt den Editor, öffnest die Website eines Registrars, suchst einen Namen, durchläufst einen Upsell-Funnel für Datenschutz und E-Mail-Hosting, nach denen du nicht gefragt hast, bezahlst und kommst dann zurück, um herauszufinden, welche DNS-Einträge du hinzufügen musst.

Die Alternative ist, denselben Agenten, der das Projekt eingerichtet und das Deployment aufgesetzt hat, auch die letzte Meile erledigen zu lassen: den Namen prüfen, registrieren und DNS einrichten — alles als Tool-Aufrufe in der Unterhaltung, die du bereits führst. [Cloudflare vermarktet eine Variante derselben Idee für seine eigene Registrar API](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=An%20agent%20using%20the%20API%20can%20suggest%20domain%20names%2C%20check%20registrability%2C%20and%20complete%20the%20purchase%20without%20the%20user%20leaving%20their%20current%20context) — ein Beleg dafür, dass dies keine Nischenpräferenz, sondern ein Workflow ist, auf den mehr als ein Registrar hinarbeitet. Der Vergleichsabschnitt gegen Ende behandelt speziell den Cloudflare-Ansatz; die Version von Namefi ergänzt eine Option für [tokenisierte Domains](/de/glossary/tokenized-domain/) und einen per Wallet-Signatur autorisierten Zahlungsweg ganz ohne Konto, erläutert in [Domains mit einer Krypto-Wallet bezahlen](/de/blog/wallet-checkout/).

## Die Verbindung einrichten: drei Editoren, drei Konfigurationsdateien

Alle drei nachstehenden Editoren verbinden sich über Streamable HTTP mit demselben Endpoint, `https://api.namefi.io/mcp`. Dein Namefi-[API-Key](https://namefi.io/api-key) wird dabei als `x-api-key`-Header gesendet. Je Editor unterscheiden sich nur das Dateiformat und der Befehl, der es schreibt.

### Claude Code

Die eigene Dokumentation von Claude Code enthält einen direkten CLI-Befehl, um einen Remote-HTTP-Server mit einem benutzerdefinierten Header hinzuzufügen:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

Führe ihn einmal aus einem Terminal in deinem Projekt aus und ersetze den Platzhalter durch deinen echten Schlüssel. Standardmäßig schreibt er den Server im **lokalen** Scope — nur für dich und nur in diesem Projekt verfügbar. Füge `--scope user` hinzu, um ihn stattdessen für jedes Projekt auf deinem Rechner verfügbar zu machen, und bestätige die Verbindung mit `claude mcp list`.

### Cursor

Cursor liest MCP-Server aus `mcp.json` — einer Projektkopie unter `.cursor/mcp.json` oder einer globalen Kopie unter `~/.cursor/mcp.json`. Das dokumentierte Format für Remote-Server unterstützt Header-basierte Authentifizierung mit Umgebungsvariablen-Interpolation, sodass der Schlüssel selbst nicht in der Datei stehen muss:

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

`${env:NAMEFI_API_KEY}` wird aus dem Wert aufgelöst, den diese Variable in der Shell hat, die Cursor gestartet hat — exportiere sie, bevor du den Editor öffnest.

### Windsurf (Cascade)

Die MCP-Integration von Windsurf — als Cascade vermarktet — liest `~/.codeium/windsurf/mcp_config.json`. Remote-Server verwenden dort statt `url` ein Feld `serverUrl`, mit demselben Muster aus `headers` und `${env:VAR}` wie bei Cursor:

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

Ein wichtiger Hinweis: Zum Veröffentlichungsdatum dieses Leitfadens leitet `docs.windsurf.com/windsurf/cascade/mcp` auf `docs.devin.ai/desktop/cascade/mcp` weiter. Die Windsurf-Dokumentation liegt nun unter der Produktdokumentationsdomain von Cognition Devin, und das obige Konfigurationsformat ist das, was die aktuelle Seite dokumentiert. Falls du einen älteren Build nutzt, überprüfe die Feldnamen anhand des Dokumentationslinks, auf den die In-App-Hilfe deiner Version verweist.

## Der Schnellstart in fünf Schritten: von einer neuen App zu live geschaltetem DNS

Sobald eine der obigen Verbindungen aktiv ist, bleibt der restliche Ablauf gleich, unabhängig vom verwendeten Editor.

1. **Besorge einen API-Key** über [namefi.io/api-key](https://namefi.io/api-key), erzeugt aus der Wallet, der die neue Domain gehören soll.
2. **Verbinde dich** mit der Konfiguration für deinen Editor und führe dann einen Plausibilitätscheck durch: Frage „Prüfe, ob `<yourapp>.com` auf Namefi verfügbar ist, und sage mir, welches Tool du aufgerufen hast.“ Das ist ein schreibgeschützter `checkAvailability`-Aufruf und funktioniert daher, bevor du etwas finanziert hast.
3. **Registriere.** Bestätige Name und Laufzeit in natürlicher Sprache — „Registriere sie für ein Jahr.“ Der Agent sendet `registerDomain` und fragt die Bestellung ab, bis sie `SUCCEEDED` erreicht (oder einen terminalen Fehlerzustand); eine typische Registrierung wird nach einer Handvoll Abfragezyklen abgeschlossen.
4. **Zeige die Domain auf dein Deployment.** Dieser Schritt wird im nächsten Abschnitt ausführlich behandelt — füge die DNS-Einträge hinzu, die deine Hosting-Plattform verlangt, über dieselbe Unterhaltung.
5. **Prüfe die Auflösung.** [DNS-Propagierung](/de/glossary/dns-propagation/) erfolgt nicht sofort. Warte daher ein paar Minuten und bestätige sie dann mit einer öffentlichen DNS-Abfrage oder indem du die Domain einfach im Browser lädst.

## Die neue Domain auf das gerade ausgelieferte Deployment zeigen

Hierauf kommt ein allgemeiner Leitfaden zu „Wie registriere ich eine Domain?“ nie, weil es nach der Registrierung auf Seiten der Hosting-Plattform geschieht. Es ist jedoch der eigentliche Sinn, dies im Editor zu erledigen: Dein Agent weiß bereits, auf welcher Plattform er deployed hat, und kann das DNS im selben Atemzug wie die Registrierung einrichten.

### Vercel

Die eigene Domain-Dokumentation von Vercel führt durch den Ablauf über **Settings → Domains** im Projekt-Dashboard: Füge die Domain hinzu, und Vercel zeigt dir, welchen Eintrag du erstellen musst, je nachdem, ob es sich um eine Apex-Domain oder eine Subdomain handelt. Für eine **Apex-Domain** (`yourapp.com`) verlangt Vercel einen **A-Eintrag**, der auf seine Serving-IP zeigt; für eine **Subdomain** (`www.yourapp.com`) verlangt es einen **CNAME**. Bevor du ein Beispiel aus einem älteren Leitfaden übernimmst, solltest du wissen: [Die Vercel-Dokumentation stellt ausdrücklich klar, dass dieses CNAME-Ziel für jedes Projekt eindeutig ist](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record). Es wird im Dashboard angezeigt, statt dass es einen einzelnen festen Hostnamen gibt, den alle Projekte teilen.

Sobald du diesen Wert hast, ist die DNS-Seite eine weitere Anfrage an den Agenten:

> „Füge einen A-Eintrag für `@` hinzu, der auf `76.76.21.21` zeigt, und einen CNAME für `www`, der auf das CNAME-Ziel zeigt, das Vercel mir gegeben hat.“

Das ruft `createDnsRecord` zweimal auf — einmal pro Eintrag —, dasselbe [DNS-Eintrag](/de/glossary/dns-record-types/)-Tool, das für jeden DNS-Schreibvorgang auf Namefi verwendet wird. Die Regel zum abschließenden Punkt gilt hier wie überall: `rdata` für ein CNAME-Ziel benötigt einen abschließenden Punkt, `zoneName` (deine Domain) nicht.

### Cloudflare Pages

Wenn dein Deployment-Ziel stattdessen Cloudflare Pages ist und das DNS deiner Domain nicht bereits auf Cloudflare verwaltet wird, verlangt [die eigene Dokumentation von Cloudflare zu Custom Domains](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) einen einzelnen **CNAME**-Eintrag, der auf die `.pages.dev`-Subdomain deines Projekts zeigt. Ein A-Eintrag ist nicht nötig, da Pages alles über dieses CNAME-Ziel ausliefert. Der Schritt im Cloudflare-Dashboard (Workers & Pages → dein Projekt → Custom domains → Set up a domain) muss zuerst erfolgen; erst dann löst das CNAME-Ziel korrekt auf.

> „Füge einen CNAME für `app` hinzu, der auf `my-project.pages.dev.` zeigt.“

Derselbe Tool-Aufruf, dieselbe Regel zum abschließenden Punkt beim Ziel, andere Plattform.

<!-- TODO: verify — Vercel and Cloudflare Pages exact steps for issuing/renewing the TLS certificate on a newly attached custom domain, to state confidently whether it's automatic on both or needs a manual trigger -->

## Wie dies mit der Registrierung im Editor bei Cloudflare verglichen werden kann

Cloudflare ist der andere Registrar, der einen Ansatz im Editor aktiv vermarktet, und verdient eine direkte Erwähnung. Seine Registrar API, [die laut Bericht seit April 2026 in der Beta ist](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/), integriert sich ebenfalls mit MCP-fähigen Editoren einschließlich Cursor und Claude Code. Damit kann ein Agent eine Domain suchen, bepreisen und synchron registrieren, ohne den aktuellen Kontext zu verlassen — dieselbe Kernidee, die dieser Leitfaden für Namefi durchgeht. Derselbe Bericht weist darauf hin, dass die API von Cloudflare in der Beta die Verwaltung nach der Registrierung wie Transfers und Verlängerungen noch nicht abdeckt; sie ist für später 2026 geplant.

Der MCP-Server von Namefi deckt heute den gesamten Lebenszyklus ab — Registrierung, DNS, [Auto-Renew](/de/glossary/domain-renewal/) — sowie zwei Dinge, die der Weg über Cloudflare nicht bietet: Die Domain wird standardmäßig als NFT registriert und damit zu einer [tokenisierten Domain](/de/glossary/tokenized-domain/) (auf jede Wallet umleitbar), und er unterstützt einen per Wallet-Signatur autorisierten Checkout ganz ohne Namefi-Konto, ausführlich beschrieben in [Domains mit einer Krypto-Wallet bezahlen](/de/blog/wallet-checkout/). Beide bauen auf denselben „Editor nicht verlassen“-Workflow hin; welcher passt, hängt davon ab, ob du eine Standardregistrierung oder eine Registrierung möchtest, die zugleich ein On-Chain-Asset ist.

## Häufig gestellte Fragen

### Deckt dies auch Codex oder Gemini CLI ab?
Nicht hier — dieser Leitfaden beschränkt sich bewusst auf Claude Code, Cursor und Windsurf. [Wie du mit deinem KI-Agenten eine Domain bei Namefi registrierst](/de/blog/ai-agent-register/) enthält dieselbe exakte, verifizierte Konfiguration für Codex CLI, Gemini CLI und Claude Desktop.

### Benötige ich ein Namefi-Konto, bevor ich dies ausprobieren kann?
Nein. Eine schreibgeschützte Verfügbarkeitsabfrage benötigt keine Authentifizierung. Du kannst daher jeden der obigen Editoren verbinden und den Test-Prompt aus Schritt 2 ausführen, bevor du einen API-Key erzeugst oder etwas finanzierst.

### Was ist, wenn meine Deployment-Plattform nicht Vercel oder Cloudflare Pages ist?
Das Muster gilt überall: Das Dashboard deiner Plattform sagt dir, welchen DNS-Eintragstyp es benötigt — fast immer einen A-Eintrag für eine Apex-Domain oder einen CNAME für eine Subdomain — und du gibst diesen Wert an deinen Agenten weiter, damit er ihn über `createDnsRecord` schreibt.

### Wird die Domain bei dieser Registrierung automatisch tokenisiert?
Ja, standardmäßig — die Domain wird als NFT auf Base in die an deinen API-Key gebundene Wallet registriert, sofern du in der Anfrage keine andere `nftReceivingWallet` angibst. Wenn das neu für dich ist, lies [Was sind tokenisierte Domains?](/de/blog/what-are-tokenized-domains/).

### Kann ich den API-Key vollständig überspringen?
Ja, mit einer Einschränkung: Der per Wallet-Signatur autorisierte [x402](/de/glossary/x402/)-Checkout-Weg von Namefi ermöglicht es einer finanzierten Wallet, eine Registrierung ganz ohne Konto oder API-Key zu bezahlen. Er braucht eine eigene Erklärung; diese findest du in [Domains mit einer Krypto-Wallet bezahlen](/de/blog/wallet-checkout/).

## Den Namen mit der App ausliefern

Die Domain ist Infrastruktur, genauso wie das Deployment-Ziel und die Datenbank. Es gibt keinen überzeugenden Grund, warum sie das eine Teil beim Ausliefern einer App sein sollte, das weiterhin verlangt, deine Tools zu verlassen und ein Webformular auszufüllen. Verbinde eine der drei obigen Konfigurationen, führe den Ablauf in fünf Schritten aus, und die Domain geht live, auf dasselbe Deployment gerichtet, das dein Agent gerade erstellt hat — ohne einen einzigen Browser-Tab.

**[Einen Namefi API-Key erzeugen](https://namefi.io/api-key)** — und probiere den Prompt zur Verfügbarkeitsabfrage in dem Editor aus, den du bereits geöffnet hast. Wenn du jeden Schritt im Detail sehen möchtest, lies die [vollständige Claude-Code-Anleitung mit kommentiertem Transkript](/de/blog/claude-mcp-domains/).

## Quellen und weiterführende Lektüre

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (MCP-Server-URL, Transport, Authentifizierung, Referenz für die Registrierungs-/DNS-Endpoints — Primärquelle für jede Namefi-spezifische Behauptung in diesem Leitfaden)
- Namefi — [docs.namefi.io: Eine Domain registrieren](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (Felder der Registrierungsanfrage, Abfrageablauf, Statuswerte der Bestellung)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP-Discovery-Deskriptor)
- Anthropic / Claude Code — [Claude Code über MCP mit Tools verbinden](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (`claude mcp add --transport http`-Syntax, Flags `--header`, `--scope`)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (Remote-Server-Format in `mcp.json`, `headers`, `${env:VAR}`-Interpolation, Konfigurationsorte für Projekt und global)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (leitet zum Veröffentlichungsdatum dieses Leitfadens auf [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp) weiter; Format von `mcp_config.json`, `serverUrl`, `headers`)
- Vercel — [Eine Custom Domain hinzufügen und konfigurieren](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record) (A-Eintrag für Apex-Domains, projektspezifisches CNAME-Ziel für Subdomains, Nameserver-Methode)
- Vercel — [Domains-Übersicht](https://vercel.com/docs/domains#:~:text=76.76.21.21) (die für Apex-A-Einträge verwendete Serving-IP `76.76.21.21`)
- Cloudflare — [Custom Domains für Pages](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) (CNAME-zu-`.pages.dev`-Ablauf für Domains, die nicht auf Cloudflare verwaltet werden)
- webhosting.today — [KI-Agenten können jetzt Domains registrieren, kein Mensch erforderlich](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/) (Bericht zur Cloudflare Registrar API Beta: Editor-Integrationen, Einschränkungen der Beta)
- Model Context Protocol — [modelcontextprotocol.io](https://modelcontextprotocol.io) (Protokollübersicht)
