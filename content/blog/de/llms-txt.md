---
title: "llms.txt für Domains: Eine API, die jeder KI-Agent lesen kann"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/llms-txt-og.jpg
description: "Eine Erläuterung von namefi.io/llms.txt: Wie eine Klartextdatei jedem KI-Agenten ermöglicht, die vollständige API eines Registrars zu entdecken und zu nutzen, und wie sie mit MCP zusammenspielt."
keywords: ["llms.txt", "llms.txt beispiel", "was ist llms.txt", "ki-lesbare api-dokumentation", "api-auffindbarkeit", "robots.txt für ki", "llms.txt vs mcp", "namefi.io/llms.txt", "maschinenlesbare api-referenz", "agent-native api", "strukturierte dokumentation für llms", "api-entdeckung per klartext", "mcp-discovery-deskriptor", "ki-agent domainregistrierung"]
relatedArticles:
  - /de/blog/ai-agent-register/
  - /de/blog/claude-mcp-domains/
  - /de/blog/namefi-mcp/
  - /de/blog/mcp-quickstart/
  - /de/blog/agent-native/
relatedTopics:
  - /de/topics/web3-foundations/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/blockchain-concepts/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/ai-agent/
  - /de/glossary/registrar/
  - /de/glossary/epp/
  - /de/glossary/dns/
  - /de/glossary/seo/
---

Jeder [Registrar](/de/glossary/registrar/) mit einer [API](/de/glossary/epp/) hat seine Dokumentation irgendwo: auf einer Dokumentationsseite, einer Referenzseite, vielleicht als OpenAPI-Spezifikation hinter einer Anmeldebarriere. Zwei Jahrzehnte lang genügte das, denn der Leser war ein menschlicher Entwickler, der klicken und die Navigationsleisten überfliegen konnte, um den einen relevanten Absatz zu finden. Ein [KI-Agent](/de/glossary/ai-agent/), der dieselbe Seite zur Inferenzzeit liest, hat diesen Luxus nicht — ein festes Kontextbudget, keine Geduld für ein per JavaScript gerendertes Dokumentationsportal und nur einen Versuch herauszufinden, was eine API tut, bevor er aufgibt oder einen nicht existierenden Endpunkt halluziniert.

`llms.txt` löst dieses Problem, und Namefi veröffentlicht eine solche Datei unter [namefi.io/llms.txt](https://namefi.io/llms.txt). Dieser Beitrag erklärt die Konvention, ihren Zweck, den Inhalt unserer eigenen Datei Abschnitt für Abschnitt, ihre bewusst gesetzten Grenzen und wie sie neben dem [Model Context Protocol](https://modelcontextprotocol.io) (MCP) passt, statt mit ihm zu konkurrieren. Er ist außerdem absichtlich ein Beispiel für das, was er beschreibt: ein öffentlicher API-Anbieter, der seine eigene maschinenlesbare Discovery-Datei in verständlicher Prosa erläutert.

## Warum Agenten nicht einfach Ihre Dokumentationsseite crawlen können

Die Begründung für `llms.txt` ist nicht spekulativ — sie steht direkt im Vorschlag. [Jeremy Howards ursprüngliche Erläuterung](https://llmstxt.org) beginnt mit der Einschränkung, die den Vorschlag motivierte: „Große Sprachmodelle stützen sich zunehmend auf Informationen von Websites, stoßen jedoch auf eine kritische Begrenzung: Kontextfenster sind zu klein, um die meisten Websites vollständig zu verarbeiten. Die Umwandlung komplexer HTML-Seiten mit Navigation, Werbung und JavaScript in LLM-freundlichen Klartext ist schwierig und unpräzise.“

Das sind zwei übereinandergestapelte Probleme. Eine echte Dokumentationsseite — Navigation, Changelog, Marketingtexte, Cookie-Banner — besteht größtenteils aus Rauschen im Verhältnis zu den wenigen Absätzen, die ein Agent für eine Aufgabe benötigt. Viel von diesem Rauschen liegt außerdem hinter JavaScript, das ein Headless-Fetch nie ausführt; was der HTTP-Client eines Agenten sieht, ist daher nicht einmal die Seite, die ein Mensch sieht. `llms.txt` umgeht beides: eine einzige Klartext-Markdown-Datei, die vollständig gelesen und nicht gecrawlt und verdichtet werden soll.

## Die `robots.txt`-Analogie — und wo sie nicht mehr trägt

Der Vergleich mit [`robots.txt`](https://www.robotstxt.org) ist der schnellste Weg, `llms.txt` für Menschen mit Web-Infrastrukturwissen einzuordnen, und er ist so weit zutreffend. `robots.txt` existiert, um Web-Crawlern Anweisungen zu geben — in den Worten der Website selbst: „Website-Eigentümer verwenden die Datei /robots.txt, um Web-Robotern Anweisungen zu ihrer Website zu geben; dies wird *Robots Exclusion Protocol* genannt.“ Beide Dateien liegen an einem vorhersehbaren Root-Pfad, beide sind Klartext, beide richten sich an automatisierte Leser statt an Menschen.

Bei der Absicht bricht die Analogie. `robots.txt` ist fast ausschließlich eine **negative** Anweisung — `Disallow: /some-path` sagt einem Crawler, was er *nicht* berühren soll. `llms.txt` ist **positiv**: Hier ist, was diese Website ist, und hier liegen die lesenswerten Teile. Weniger ein Zaun als ein Inhaltsverzeichnis für einen Leser, der nicht das ganze Buch überfliegen kann. Die beiden ergänzen sich, und die Namefi-Website nutzt beide.

## Was die Spezifikation tatsächlich verlangt

`llms.txt` ist nicht formfrei; der Vorschlag definiert eine bestimmte Markdown-Struktur in dieser Reihenfolge: eine optionale Byte-Order-Mark, eine erforderliche H1 mit dem Namen der Website, eine Blockquote-Zusammenfassung, null oder mehr Detailabschnitte ohne Überschrift und null oder mehr H2-getrennte Abschnitte mit Dateilisten aus Links im Format `[name](url): notes`. Eine H2-Überschrift trägt eine besondere Bedeutung: Ein Abschnitt namens **Optional** signalisiert „Die URLs hier können übersprungen werden, wenn Sie einen kürzeren Kontext benötigen.“ Namefis Datei verwendet genau diese Überschrift und tut genau das, was die Spezifikation beschreibt.

## Rundgang durch namefi.io/llms.txt

Hier ist die Live-Datei, Abschnitt für Abschnitt kommentiert — was tatsächlich darin steht, direkt zitiert und warum jeder Teil für einen Agenten, der sie ohne Vorwissen liest, so gestaltet ist.

| Abschnitt (wie in der Datei) | Was er sagt | Warum er so gestaltet ist |
| --- | --- | --- |
| H1 + Blockquote | `# Namefi API` / `> Namefi lets you register traditional domains as NFTs and manage their DNS records via API.` | Der von der Spezifikation verlangte Einstieg: eine Zeile, mit der ein Agent handeln kann, selbst wenn er nichts Weiteres liest. |
| MCP-Hinweis, inline in der Zusammenfassung | `MCP server (every operation below as MCP tools): https://api.namefi.io/mcp — discovery descriptor at https://namefi.io/.well-known/mcp/servers.json` | Setzt den schnellsten Weg — eine aktive Protokollverbindung — in den ersten drei Zeilen vor den Klartextweg. |
| `## Base URLs` | `https://api.namefi.io/v-next/` | Eine Zeile, keine Prosa — genau das, was ein Agent braucht, der rohe HTTP-Aufrufe zusammenstellt. |
| `## MCP Server (for AI agents)` | „MCP bevorzugen, wenn Ihr Client es unterstützt … In Claude Code hinzufügen: `claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"`“ | Nennt eine Präferenz und belegt sie mit einem kopierbaren Befehl statt mit einem Absatz. |
| `## Authentication` | „Einen Schlüssel unter https://namefi.io/api-key erzeugen … Funktioniert für **alle Operationen** … **Direkte HTTP-Nutzung (für KI-Agenten empfohlen):** Den Header direkt übergeben — kein SDK erforderlich“ | Sagt dem Leser klar, dass kein SDK, OAuth-Tanz oder Browser-Sitzung nötig ist, um einen Schreibaufruf zu authentifizieren. |
| `## Domain Registration` | Eine dreistufige `curl`-Sequenz: Verfügbarkeit prüfen, `POST /v-next/orders/register-domain` senden, `GET /v-next/orders/{orderId}` bis zu einem endgültigen Status abfragen | Die Kerntransaktion als ausführbare Befehle, nicht als Prosa über die Form eines Requests und einer Response. |
| `## DNS Record Management` | Eine Tabelle mit elf Endpunkten (`GET`/`POST`/`PUT`/`DELETE` für `/v-next/dns/records`, `/v-next/dns/park`, `/v-next/dns/forwarding` usw.), jeweils mit Methode, Pfad, Authentifizierung und Kurzbeschreibung | Referenzdaten — viele ähnliche Endpunkte — gehören in eine Tabelle statt in elf Absätze. |
| Hinweis zur Fehlerbehebung | „**UNAUTHORIZED (401):** Ihr API-Schlüssel ist ungültig, abgelaufen oder nicht mit der Wallet des Domaininhabers verknüpft … **Fehler bei der Eintragsvalidierung:** Prüfen Sie, dass `zoneName` keinen abschließenden Punkt hat und `rdata` für die Typen CNAME/MX/NS einen abschließenden Punkt hat …“ | Antizipiert die Fehlerarten, auf die ein Agent zuerst stößt, als Ursache und Lösung statt als generische Statustabelle. |
| `## Optional` | Verlinkt die TypeScript-SDK-Dokumentation, das npm-Paket `@namefi/api-client`, eine maschinenlesbare OpenAPI-3-Spezifikation, den Outbound-Agent-Leitfaden und ein GitHub-Repository mit signer-neutralen Hilfsskripten | Der eigene Abschnitt der Spezifikation für „kann bei kürzerem Kontext übersprungen werden“ — vertiefende Ressourcen, keine Voraussetzungen für den oben beschriebenen Kernablauf. |

Die Datei schließt mit einem Verweis auf `namefi.io/llms-full.txt`, denselben Inhalt als ein Dokument eingebunden, einschließlich der Web3-Zahlungsabläufe und des Outbound-Leitfadens, auf die die Root-Datei nur verlinkt. Diese Aufteilung spiegelt das zweistufige Muster der Spezifikation: Der Einstiegspunkt bleibt kurz genug, um komfortabel in den Kontext zu passen, und ein Agent, der mehr braucht, folgt einem Link.

## Begleitdateien: Web3- und MCP-Discovery

Die Root-Datei verlinkt auf Nachbardateien für Teile der API, die nicht in einen allgemeinen Einstiegspunkt gehören. [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) dokumentiert Zahlungswege, die ein Wallet-haltender Agent anstelle eines API-Schlüssels benötigt: einen [x402](/de/glossary/x402/)-Ablauf, bei dem `GET /x402/domain/{domainName}` bis zum Anhängen eines signierten `X-PAYMENT`-Headers mit Preisangabe `402 Payment Required` zurückgibt, eine per `mppx`-CLI signierte MPP-Variante mit Challenge-Response und einen manuellen EIP-712-Signaturweg für Smart-Contract-Wallets. Die Datei erklärt klar, dass eine x402-Registrierung „Kein Namefi-Konto und keine EIP-712-Signatur erfordert — die Wallet des Käufers signiert eine EIP-3009-`transferWithAuthorization`.“ Ein Agent, der nur einen API-Schlüssel benötigt, muss nichts davon laden.

Die MCP-Seite besitzt eine eigene Discovery-Datei, vollständig getrennt von `llms.txt`: [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json), ein kleiner JSON-Deskriptor statt Markdown:

```json
{
  "servers": [
    {
      "name": "namefi-api",
      "transport": "streamable-http",
      "url": "https://api.namefi.io/mcp",
      "authentication": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key"
      },
      "documentation": "https://namefi.io/llms.txt"
    }
  ]
}
```

Dieser Deskriptor liegt unter `.well-known/`, derselben Konvention, die `/.well-known/security.txt` für maschinell auffindbare Metadaten verwendet — ein engerer, JSON-typisierter Begleiter zu `llms.txt` mit seinem Markdown-Prosa-Ansatz. Sein letztes Feld verweist wieder auf `llms.txt`, sodass ein Agent, der zuerst den MCP-Server findet, dennoch einen Weg zur Klartext-Erklärung dieser Tools hat.

## Was enthalten ist, was fehlt und warum

Einige Entscheidungen wirken bewusst. Fast jede Operation ist ein ausführbarer `curl`-Aufruf statt eines Absatzes, der ein Request-Schema beschreibt — die Datei wurde für etwas geschrieben, das Code ausführt, nicht für etwas, das seine eigene Zusammenfassung schreibt. Die Root-Datei verlinkt, statt alles einzubetten, und `llms-full.txt` bindet ein, worauf sie nur verweist — das Größenmanagementmuster der Spezifikation, wörtlich angewandt. Der Abschnitt `## Optional` verlinkt neben dem Markdown auf eine vollständige OpenAPI-3-Spezifikation, sodass ein Tool, das ein strikt typisiertes Schema benötigt, eines erhält, ohne den primären Lesepfad zu überladen. Wallet-basierte Zahlungen — x402, MPP, EIP-712 — leben in ihrer eigenen Datei; dadurch sind API-Key-Authentifizierung und eine Registrierung das Erste, was jeder Agent liest.

<!-- TODO: Mit dem Team bestätigen — ob es ein Zielbudget für Tokens/Zeichen gibt, auf das die Root-Datei llms.txt geschrieben ist, und wie die Aufteilung zwischen llms.txt / llms-full.txt / web3/llms.txt / outbound/llms.txt mit dem Wachstum der API überprüft wird. -->

## llms.txt und MCP: Discovery versus Verbindung

Es lohnt sich, genau zu unterscheiden, was die beiden leisten. `llms.txt` ist ein Dokument — ein Agent ruft es einmal ab und weiß, was die API ist und wo vertiefende Ressourcen liegen; es bleibt träger Text, bis etwas nach seinen Anweisungen handelt. [MCP](https://modelcontextprotocol.io) ist laut seiner eigenen Protokollbeschreibung „ein Open-Source-Standard, um KI-Anwendungen mit externen Systemen zu verbinden“ — eine aktive Sitzung, die ein Client zu einem Server öffnet und über die er aufrufbare Tools auflistet und ausführt.

Namefis Datei zeigt die Beziehung unmittelbar: `llms.txt` teilt einem Agenten mit, dass unter `api.namefi.io/mcp` ein MCP-Server existiert, und gibt ihm den Befehl `claude mcp add` zum Verbinden. Datei lesen, lernen, dass es eine aktive Toolschnittstelle gibt, verbinden, handeln. Ein Agent, der direkt zu MCP springt, kann den Server auch über `.well-known/mcp/servers.json` finden — doch das Feld `documentation` dieses Deskriptors verweist zurück auf `llms.txt`; daher arbeiten die beiden selten völlig isoliert.

## Hinweise für andere API-Anbieter

Die Veröffentlichung einer funktionierenden `llms.txt` erfordert keinen Neuaufbau Ihrer Dokumentation:

1. **Stellen Sie H1, Zusammenfassung und die schnellste Verbindungsmethode an den Anfang** — ein Agent mit wenig Kontext liest möglicherweise nie über die ersten Zeilen hinaus.
2. **Zeigen Sie ausführbare Requests, keine Schema-Prosa.** Ein `curl`-Befehl mit echten Feldnamen ist besser als ein Absatz, der einen JSON-Body beschreibt.
3. **Teilen Sie nach Größe, nicht nach Teamstruktur.** Eine kurze Root-Datei plus eine umfassendere Erweiterung und separate Dateien für Bereiche wie Zahlungen halten den häufigen Pfad kurz.
4. **Dokumentieren Sie reale Fehlerarten**, nicht nur Statuscodes — warum ein Aufruf 401 statt 403 zurückgibt, ist wichtiger als die Zahlen selbst.
5. **Verwenden Sie die Überschrift `## Optional` für alles Überspringbare**, entsprechend der Konvention der Spezifikation.
6. **Veröffentlichen Sie neben llms.txt einen MCP-Discovery-Deskriptor, wenn Sie einen MCP-Server betreiben** — das eine beantwortet „Was ist das?“, das andere „Wie verbinde ich mich?“

## Häufig gestellte Fragen

### Was ist llms.txt?

Eine vorgeschlagene Konvention — kein formaler IETF- oder W3C-Standard — zur Veröffentlichung einer Klartext-Markdown-Datei im Root einer Website. Sie teilt einem KI-Agenten mit, was die Website oder API ist und wo weitere Details zu finden sind. Sie definiert eine bestimmte Reihenfolge: einen H1-Titel, eine Blockquote-Zusammenfassung, optionale Detailabsätze und H2-getrennte Linklisten; die Überschrift „Optional“ ist für überspringbares Material reserviert.

### Wie unterscheidet sich llms.txt von robots.txt?

`robots.txt` ist eine negative Anweisung an Web-Crawler — was sie nach dem Robots Exclusion Protocol nicht indexieren sollen. `llms.txt` ist positiv — was eine Website ist und was sich zu lesen lohnt. Sie bedienen unterschiedliche automatisierte Leser und existieren typischerweise auf derselben Website.

### Ersetzt llms.txt MCP?

Nein. `llms.txt` ist ein Dokument, das ein Agent einmal liest, um zu verstehen, was eine API tut; MCP ist eine aktive Protokollverbindung, die sein Client öffnet, um die Operationen dieser API tatsächlich aufzurufen. Namefi veröffentlicht beides, und `llms.txt` informiert den Agenten überhaupt erst darüber, dass der MCP-Server existiert.

### Was steht in Namefis Datei llms.txt?

Die Basis-URL, ein Hinweis auf den MCP-Server, ein Abschnitt zur API-Key-Authentifizierung, ein dreistufiger Ablauf zur Domainregistrierung mit ausführbaren `curl`-Beispielen, eine Endpunkttabelle für DNS-Eintragsverwaltung, Endpunkte zur Domainkonfiguration, ein Abschnitt zur Fehlerbehebung und ein Abschnitt „Optional“ mit Links zum SDK, zur OpenAPI-Spezifikation sowie zu Begleitdateien für Wallet-Zahlungen und Outbound-Workflows.

### Kann ich llms.txt ohne KI-Agenten selbst lesen?

Ja — es ist schlichtes Markdown, das für Menschen ebenso lesbar ist wie für ein Modell. [namefi.io/llms.txt](https://namefi.io/llms.txt) liest sich wie eine knappe API-Kurzreferenz; dieselbe Klarheit, die einem Menschen beim Überfliegen hilft, erleichtert auch einem Modell das korrekte Parsen.

## Quellen und weiterführende Lektüre

- llmstxt.org — [Die Datei /llms.txt: Hintergrund, Vorschlag und Formatspezifikation](https://llmstxt.org/#:~:text=Large%20language%20models%20increasingly%20rely%20on%20website%20information%2C%20but%20face%20a%20critical%20limitation)
- robotstxt.org — [Über /robots.txt: „Kurz gesagt“](https://www.robotstxt.org/robotstxt.html#:~:text=Web%20site%20owners%20use%20the%20/robots.txt%20file%20to%20give%20instructions%20about%20their%20site%20to%20web%20robots%3B%20this%20is%20called%20The%20Robots%20Exclusion%20Protocol)
- modelcontextprotocol.io — [Was ist das Model Context Protocol (MCP)?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (Primärquelle für jeden kommentierten Auszug in diesem Artikel)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (x402-, MPP- und EIP-712-Abläufe für Wallet-Zahlungen)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (MCP-Discovery-Deskriptor)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (Erweiterung in einer Datei, die die Web3- und Outbound-Begleitdateien einbindet)
- IETF — [RFC 8615, Well-Known Uniform Resource Identifiers (die Konvention `.well-known/`)](https://datatracker.ietf.org/doc/html/rfc8615)

## Lesen Sie die Datei selbst

Der schnellste Weg, `llms.txt` zu verstehen, ist, eine Datei zu öffnen. [namefi.io/llms.txt](https://namefi.io/llms.txt) ist öffentlich, nicht authentifiziert und kurz genug, um sie in der Zeit zu lesen, die Sie für diesen Artikel gebraucht haben — dieselbe Datei, die jeder KI-Agent liest, der sich erstmals mit Namefi verbindet. Welche Aufgaben die dahinterliegenden MCP-Tools tatsächlich erledigen, erläutert [Namefi MCP Server: Domain-Tools für KI-Agenten](/de/blog/namefi-mcp/). Für die Verbindung aus einem Editor gibt es den [MCP Quickstart](/de/blog/mcp-quickstart/); um einen Agenten beim gesamten Ablauf zu beobachten, lesen Sie [Eine Domain mit Ihrem KI-Agenten bei Namefi registrieren](/de/blog/ai-agent-register/).
