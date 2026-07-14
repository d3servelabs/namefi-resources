---
title: "Was ist ein agent-nativer Domain-Registrar?"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/agent-native-og.jpg
description: "Registrare haben seit Jahrzehnten APIs, doch eine API allein ist nicht agent-native. Die Checkliste: Auffindbarkeit, Dokumentation, Fehler, Zahlung und Richtlinien-Kontrollen."
keywords: ["agent-nativer Registrar", "Definition agent-nativ", "was ist ein agent-nativer Registrar", "agentenfähige API", "MCP-Server", "llms.txt", "maschinenlesbare Fehler", "Idempotenz", "agentische Zahlungen", "Domainregistrierung durch KI-Agenten", "API-Dokumentation in natürlicher Sprache", "Richtlinien-Kontrollen für KI-Agenten", "API-Schlüssel-Abrechnung", "Wallet-Checkout für Kryptodomains"]
relatedArticles:
  - /de/blog/ai-domain-platforms/
  - /de/blog/cf-namecom-namefi/
  - /de/blog/ai-agent-register/
  - /de/blog/claude-mcp-domains/
  - /de/blog/airo-vs-namefi/
relatedTopics:
  - /de/topics/web3-foundations/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/blockchain-concepts/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/ai-agent/
  - /de/glossary/registrar/
  - /de/glossary/icann/
  - /de/glossary/epp/
  - /de/glossary/x402/
---

Domain-Registrare verfügen schon lange über Programmierschnittstellen. Das [Extensible Provisioning Protocol](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol) (EPP), die Sprache für die Kommunikation zwischen Maschinen, mit der Registrare mit Registries kommunizieren, erreichte im [März 2004 den Status „Proposed Standard“](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004) — vor mehr als zwei Jahrzehnten. Jeder von der [ICANN](/de/glossary/icann/) akkreditierte [Registrar](/de/glossary/registrar/), der seither darauf aufbaut, verfügt über irgendeine Form von REST- oder SOAP-API, um Verfügbarkeit zu prüfen, eine Registrierung einzureichen und Einträge zu aktualisieren. Die ehrliche Antwort auf die Frage „Hat dieser Registrar eine API?“ lautet daher für fast jeden Registrar am Markt: ja, und zwar seit Jahren.

Diese Frage erweist sich jedoch als die falsche. Ein [KI-Agent](/de/glossary/ai-agent/), der in Ihrem Auftrag eine Domain registrieren soll, scheitert nicht daran, dass dem Registrar eine API fehlt. Er scheitert, weil die API für einen Entwickler gebaut wurde, der die Dokumentation einmal liest, den Integrationscode von Hand schreibt und ihn ausliefert — nicht für ein System, das die API zur Laufzeit entdecken, aus einer JSON-Antwort ableiten muss, was passiert ist, und einen Kauf ohne eine Person abschließen muss, die eine Checkout-Seite beobachtet. Das sind unterschiedliche Anforderungen; die zweite zu erfüllen, ist mit **agent-native** in diesem Artikel gemeint.

Dieser Beitrag definiert den Begriff präzise, legt eine Checkliste vor, mit der sich jeder Registrar (oder jede API) daran messen lässt, und wendet diese Checkliste dann ehrlich auf die Plattformen an, die 2026 ausgeliefert werden, einschließlich [Namefi](https://namefi.io). Den Plattformvergleich statt der Definition finden Sie unter [Cloudflare vs. Name.com vs. Namefi: agent-native Registrare](/de/blog/cf-namecom-namefi/) oder im umfassenderen Leitfaden [KI-agentische Domain-Plattformen](/de/blog/ai-domain-platforms/). Wenn Sie bei „KI und Domains“ noch an einen Namensgenerator denken, der markentaugliche Zeichenfolgen vorschlägt, zeigt die folgende Checkliste, wie viel höher die Messlatte für agent-native Systeme liegt — die vollständige Lücke erläutert [Über KI-Domainnamengeneratoren hinaus: Das Zeitalter der Agenten](/de/blog/beyond-generators/).

## Warum „hat eine API“ und „agent-native“ nicht dasselbe meinen

Eine traditionelle Registrar-API setzt voraus, dass bei der Gestaltung, nicht aber zur Laufzeit, ein Mensch eingebunden ist. Ein Entwickler legt ein Konto an, liest eine für Menschen geschriebene Referenzseite, kopiert ein Codebeispiel und hinterlegt Endpunkt, Authentifizierungs-Header und die erwartete Antwortform fest in seiner Anwendung. Ist das erledigt, läuft die Integration unbeaufsichtigt — aber nur, weil ein Mensch die Interpretationsarbeit bereits geleistet hat. An der API selbst ist nichts für ein System lesbar, das ohne vorherige Integration auftaucht und im Kontext herausfinden muss, welche Operationen es gibt und wie sie aufzurufen sind.

Ein Agent startet immer wieder ohne Vorwissen. Jedes Gespräch mit einem Programmieragenten, jeder neue MCP-Client ist faktisch ein Entwickler, der Ihre API noch nie gesehen hat und nur Sekunden an Kontextbudget besitzt, um sie zu verstehen. Wenn die Antwort auf „Wie lernt ein Agent, diese API zu nutzen?“ lautet „Ein Mensch hat vor Jahren die Dokumentation gelesen und Integrationscode geschrieben“, steckt dauerhaft eine Person im Ausführungspfad der API, selbst wenn beim Kauf niemand etwas anklickt. Dieser Beitrag beschreibt, was beim Registrar selbst gegeben sein muss, damit ein Agent mit Kaltstart erfolgreich ist — die Sicht des Käufers auf dieselbe Übergabe finden Sie unter [Wie KI-Agenten Domains ohne Menschen kaufen (2026)](/de/blog/agents-buy-domains/).

## Die agent-native Checkliste

Ein agent-nativer Registrar ist ein Registrar, den ein KI-Agent vollständig selbst entdecken, verstehen und für Transaktionen nutzen kann — ohne Browser, ohne dass ein Mensch die Dokumentation vorab liest, ohne dass jemand eine Kartennummer eingibt. Dafür müssen sechs konkrete Dinge zutreffen, nicht nur „eine API zu haben“:

| Anforderung | Registrar mit API | Agent-nativer Registrar |
| --- | --- | --- |
| Auffindbarkeit | Endpunkte existieren, aber einem Agenten müssen Basis-URL und Authentifizierungsschema außerhalb des Systems mitgeteilt werden | Ein Standardort (`llms.txt`, ein [MCP](https://modelcontextprotocol.io)-Server), den ein Agent selbstständig finden und lesen kann |
| Dokumentation in natürlicher Sprache | Referenzdokumentation ist für Menschen geschrieben, die eine Seite überfliegen | Die Dokumentation ist so strukturiert, dass ein Agent sie zur Inferenzzeit nutzen kann — Operation, Pflichtfelder und Wirkung stehen an einer Stelle |
| Maschinenlesbare Fehler | HTTP-Statuscodes plus Prosa für eine Person, die ein Log liest | Ein stabiler Fehlercode, ein `retryable`-Flag und strukturierte Details, auf die ein Agent programmatisch verzweigen kann |
| Browserfreier Kauf | Die Registrierung wird auf einer gehosteten Checkout-Seite abgeschlossen, manchmal hinter einem CAPTCHA | Die Registrierung wird über die API oder das Protokoll selbst vollständig abgeschlossen, ohne dass eine Seite gerendert werden muss |
| Programmatische Zahlung | Die Zahlung setzt eine hinterlegte Karte voraus, die an das Abrechnungskonto eines Menschen gebunden ist | Zahlung über einen API-Schlüssel, dessen Nutzung einem Konto in Rechnung gestellt wird, oder eine Wallet-signierte Transaktion — etwas, das ein nichtmenschliches System selbst halten kann |
| Richtlinien-Kontrollen | Nichts hindert ein Skript daran, alles zu tun, was die Zugangsdaten erlauben | Ausgabenlimits, Bestätigungsschritte oder begrenzte Schlüssel, die ein Mensch einmal festlegt, damit der Agent innerhalb einer Grenze arbeitet |

Das ist die verdichtete Definition: **Ein agent-nativer Registrar ist ein Registrar, der bei Auffindbarkeit, Dokumentation in natürlicher Sprache, maschinenlesbaren Fehlern, browserfreiem Kauf und programmatischer Zahlung jeweils mit Ja abschneidet — mit Richtlinien-Kontrollen als dem Teil, an dem die gesamte Kategorie noch arbeitet.**

## Auffindbarkeit: llms.txt und MCP sind die Sitemap für Agenten

Ein menschlicher Entwickler findet eine API durch Suchen oder Klicken auf einer Dokumentationswebsite. Ein Agent braucht entweder eine Datei, die er in einem Zug abrufen und lesen kann, oder eine Protokollverbindung, über die er verfügbare Operationen abfragen kann. Heute erfüllen zwei Dinge diese Rolle.

[llms.txt](https://llmstxt.org) ist, in den Worten des Vorschlags selbst, [„ein Vorschlag zur Standardisierung der Verwendung einer Datei `/llms.txt`, die Informationen bereitstellt, damit LLMs eine Website zur Inferenzzeit nutzen können“](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time). Die Idee entspricht `robots.txt`; statt einem Crawler mitzuteilen, was er indexieren darf, erklärt sie einem Sprachmodell, was eine Website ist und wie sie zu verwenden ist. Unter [llms.txt für Domains: Eine API, die jeder KI-Agent lesen kann](/de/blog/llms-txt/) sehen Sie, wie diese Datei aussieht, wenn ein Registrar sie veröffentlicht.

[MCP (Model Context Protocol)](https://modelcontextprotocol.io) löst ein benachbartes Problem: Es ist [„ein Open-Source-Standard, um KI-Anwendungen mit externen Systemen zu verbinden“](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems). Während llms.txt ein Dokument ist, das ein Agent einmal zur Orientierung liest, ist MCP eine Live-Verbindung, die der Client eines Agenten zu einem Server öffnet, der einen definierten Satz aufrufbarer Tools bereitstellt. Beides ergänzt sich statt zu konkurrieren: llms.txt zeigt einem Agenten, dass ein Registrar existiert und was er ungefähr kann; MCP ermöglicht es dem Client des Agenten, sich tatsächlich zu verbinden und die Operationen aufzurufen.

Namefi veröffentlicht beides. Der Einstiegspunkt unter [namefi.io/llms.txt](https://namefi.io/llms.txt) dokumentiert einen MCP-Server unter `api.namefi.io/mcp`, eine MCP-Discovery-Datei unter `namefi.io/.well-known/mcp/servers.json` und eine vollständige REST-Referenz sowie Begleitdateien für Wallet-basierte Zahlungen und ausgehende Agenten-Workflows. Bei direkter Prüfung zweier etablierter Anbieter zeigt sich: Die Registrar-Dokumentation von Cloudflare veröffentlicht ein eigenes `llms.txt` unter `developers.cloudflare.com/registrar/llms.txt`, doch in der öffentlichen Dokumentation steht nichts dazu, dass Cloudflare einen dedizierten MCP-Server für das Registrar-Produkt betreibt. Der Pitch der Beta lautet laut Berichterstattung, [die API sei „dafür ausgelegt, innerhalb der Tools zu funktionieren, in denen Entwickler bereits arbeiten: Code-Editoren mit MCP-Unterstützung wie Cursor und Claude Code“](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code). Das ist enger gefasst: Der Editor ist MCP-fähig, nicht zwingend Cloudflares Registrar selbst. Das Entwicklerportal von GoDaddy, ebenfalls direkt geprüft, dokumentiert REST-Endpunkte für menschliche Entwickler und zeigte zum Zeitpunkt der Erstellung weder einen Verweis auf `llms.txt` noch auf einen MCP-Server.

## Zahlung: Warum hinterlegte Karten Agenten ausbremsen und was sie ersetzt

Beim Kauf lässt sich die Annahme eines Menschen im Ablauf am schwersten beseitigen, denn die Zahlungsinfrastruktur des Verbraucher-Webs ist auf eine Person ausgerichtet: eine hinterlegte Karte, eine Rechnungsadresse und manchmal ein CAPTCHA, das alles herausfiltern soll, was keine Person ist. Ein Agent kann kein Kartenformular ausfüllen, und ihm die rohe Kartennummer eines Menschen zu geben, damit er sich als dieser ausgeben kann, ist selbst dann ein schlechtes Sicherheitsmodell, wenn es technisch möglich wäre.

Zwei Alternativen werden bereits ausgeliefert. Die erste ist die Abrechnung per API-Schlüssel: Der Registrar stellt einen Zugangsschlüssel aus, der an ein vorfinanziertes oder auf Rechnung geführtes Konto gebunden ist, und der Agent authentifiziert jeden Aufruf mit diesem Schlüssel statt mit einer Karte. Die Dokumentation von Namefi beschreibt die Erstellung dieses Schlüssels unter [namefi.io/api-key](https://namefi.io/api-key) und seine Übergabe als `x-api-key`-Header bei jeder Anfrage — keine Browser-Sitzung, kein Kartenformular. Die `.ai`-Preisgestaltung von Cloudflare folgt derselben Kostenlogik: [Das Unternehmen bietet „.ai-Domainregistrierungen und -verlängerungen zu Großhandelspreisen ohne zusätzliche Aufschläge“ an](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups). Ein fester, vorhersehbarer Preis ist für einen Agenten leichter zu beurteilen als ein Preis, der je nach Aktion schwankt.

Die zweite Alternative ist eine Wallet-signierte Zahlung, die nicht nur die Karte, sondern das Konto selbst überflüssig macht. Die `web3`-Dokumentation von Namefi beschreibt einen Ablauf auf Basis des HTTP-Statuscodes 402 und des [x402](/de/glossary/x402/)-Musters: Eine Domainanfrage ohne Zahlung liefert Preise in einer 402-Antwort zurück; die Wallet des Aufrufers signiert eine EIP-3009-Autorisierung, und diese signierte Autorisierung wird als Header erneut übermittelt, um Registrierung und Abrechnung in einem Schritt abzuschließen — ausdrücklich [„kein Namefi-Konto und keine EIP-712-Signatur erforderlich“](https://namefi.io/web3/llms.txt). Der Punkt hier ist enger: Es handelt sich um eine Zahlungsmethode, die Software selbst halten und nutzen kann, was eine hinterlegte Kreditkarte strukturell nicht kann. Den vollständigen Ablauf finden Sie unter [Domains mit einer Krypto-Wallet bezahlen: Kein Konto erforderlich](/de/blog/wallet-checkout/).

## Richtlinien-Kontrollen: Die Zeile, die die gesamte Kategorie noch nicht gelöst hat

Das ist die ehrliche Lücke. Auffindbarkeit, maschinenlesbare Dokumentation, strukturierte Fehler und programmatische Zahlung sind Dinge, die ein Registrar einmal bauen und ausliefern kann. Richtlinien-Kontrollen — Ausgabenobergrenzen, ein Bestätigungsschritt oberhalb eines Schwellenwerts oder ein auf eine TLD beziehungsweise ein Budget beschränkter Schlüssel — sind anders, denn sie schützen den Menschen, der Autorität delegiert hat, nicht die einfache Nutzung der API.

Beim am besten überprüfbaren Fall, der Dokumentation von Namefi selbst, zeigt sich: Sie kennzeichnet bestimmte Operationen als folgenreich und dokumentiert strukturierte, maschinenlesbare Fehler (stabile Codes, ein `retryable`-Flag, strukturierte Details) — ein echter Fortschritt in dieser Zeile. In der öffentlichen API-Referenz fanden wir jedoch weder ein dokumentiertes Ausgabenlimit noch ein serverseitiges Bestätigungsgate; diese Leitplanke liegt derzeit eine Ebene höher, in der Richtlinie, die der Mensch auf dem MCP-Client selbst festlegt. Auch in den Registrar-APIs von Cloudflare oder Name.com fanden wir keine öffentliche Dokumentation einer Ausgabenlimit-Primitiven — diese Zeile sollte jeder agent-native Registrar als Nächstes schließen.

## Bewertung der heutigen Plattformen anhand der Checkliste

So schneiden die drei in diesem Bereich am häufigsten genannten Plattformen bei der Checkliste mit sechs Punkten ab, basierend auf dem, was wir direkt anhand der jeweils eigenen, live verfügbaren Dokumentation verifiziert haben, nicht auf Marketingtexten:

| Registrar | Auffindbarkeit | Dokumentation in natürlicher Sprache | Maschinenlesbare Fehler | Browserfreier Kauf | Programmatische Zahlung | Richtlinien-Kontrollen |
| --- | --- | --- | --- | --- | --- | --- |
| Namefi | Ja — llms.txt + MCP-Server | Ja — llms.txt-Familie | Ja — strukturierte Codes | Ja — REST + MCP | Ja — API-Schlüssel oder Wallet (x402) | Noch nicht dokumentiert |
| Cloudflare Registrar | Teilweise — eigenes llms.txt; MCP auf Editor-Ebene, kein bestätigter dedizierter Server | Unklar — über den llms.txt-Index hinaus nicht verifiziert | Unklar — nicht in öffentlichen Dokumenten verifiziert | Ja — API-gesteuert laut Berichterstattung zur Beta | Ja — API-Schlüssel, Selbstkostenpreise | Noch nicht dokumentiert |
| Name.com | Unklar — am direkt geprüften Domain-Root kein llms.txt gefunden | In der eigenen Ankündigung von Name.com behauptet, nicht weiter unabhängig verifiziert | In den geprüften älteren Dokumenten nicht gefunden; für die neuere API unklar | Nicht unabhängig verifiziert | Teilweise — nur Abrechnung über Kontoguthaben dokumentiert | Noch nicht dokumentiert |

Die Zeile, die bei allen leer bleibt — Richtlinien-Kontrollen — ist eine echte branchenweite Lücke, kein Vorwurf an eine einzelne Plattform. Es lohnt sich, sie im Blick zu behalten, während sich dieser Bereich weiterentwickelt.

## Häufig gestellte Fragen

### Was ist ein agent-nativer Domain-Registrar?

Ein agent-nativer Registrar ist ein Registrar, den ein KI-Agent selbst entdecken, verstehen und für Transaktionen nutzen kann — ohne Browser, ohne dass ein Mensch die Dokumentation vorab liest, ohne dass jemand eine Kartennummer eingibt. Er schneidet bei Auffindbarkeit (einer `llms.txt`-Datei oder einem MCP-Server), Dokumentation in natürlicher Sprache, maschinenlesbaren Fehlern, browserfreiem Kauf und programmatischer Zahlung jeweils mit Ja ab; Richtlinien-Kontrollen (Ausgabenobergrenzen, Bestätigungsgates) sind der Teil, den die Kategorie noch aufbaut.

### Warum können KI-Agenten normale Registrar-APIs nicht verwenden?

Technisch können sie die Endpunkte aufrufen, doch die meisten Registrar-APIs setzen voraus, dass ein menschlicher Entwickler die Dokumentation bereits gelesen und den Integrationscode vorab geschrieben hat. Ein Agent ohne vorherige Integration hat keinen Standardweg, die Basis-URL zu entdecken, das Authentifizierungsschema zu lernen oder eine Fehlernachricht in Prosa zu interpretieren — die API funktioniert nur, weil eine Person diese Interpretationsarbeit bereits geleistet hat, nicht weil sie für einen Agenten mit Kaltstart lesbar ist.

### Was ist der Unterschied zwischen llms.txt und MCP?

`llms.txt` ist eine Klartextdatei, die ein Agent einmal liest, um zu erfahren, was eine Website oder API ist und wie sie zu verwenden ist — dieselbe Rolle, die `robots.txt` für Crawler spielt, aber für Sprachmodelle geschrieben. [MCP](https://modelcontextprotocol.io) ist eine Live-Protokollverbindung, die der Client eines Agenten zu einem Server mit aufrufbaren Tools öffnet. Beides ergänzt sich: llms.txt ist die Auffindbarkeit, MCP ist die Verbindung, die ein Agent zum Handeln nutzt. Mehr zum Aspekt der Auffindbarkeit finden Sie unter [llms.txt für Domains: Eine API, die jeder KI-Agent lesen kann](/de/blog/llms-txt/).

### Wie mache ich meine eigene API für Agenten nutzbar?

Veröffentlichen Sie eine `llms.txt`, die Ihre API für Modelle beschreibt, stellen Sie einen MCP-Server (oder mindestens OpenAPI-dokumentierte Endpunkte) bereit, geben Sie strukturierte Fehler mit stabilen Codes statt Prosa zurück, sorgen Sie dafür, dass sich jede Schreiboperation ohne gehostete Checkout-Seite abschließen lässt, unterstützen Sie eine Zahlungsmethode, die keine menschliche Karte voraussetzt, und ergänzen Sie Ausgaben- oder Bestätigungsgrenzen, damit derjenige, der die Zugangsdaten hält, begrenzen kann, was ein Agent tun darf.

### Ist Namefi agent-native?

Nach der obigen Checkliste erhält Namefi bei fünf der sechs direkt verifizierten Zeilen ein Ja: Das Unternehmen veröffentlicht eine llms.txt-Familie und einen MCP-Server, seine Dokumentation ist für die Nutzung durch Agenten strukturiert, seine Outbound-API liefert strukturierte maschinenlesbare Fehler, die Registrierung wird vollständig über die API oder den x402-basierten Wallet-Ablauf abgeschlossen, ohne dass ein Dashboard erforderlich ist, und die Zahlung funktioniert per API-Schlüssel oder Wallet-signierter Transaktion, ohne dass ein Konto erforderlich ist. Richtlinien-Kontrollen sind in der öffentlichen API-Referenz noch nicht dokumentiert; diese Steuerung liegt derzeit auf Client-Seite. <!-- TODO: confirm with team — whether a spend-cap or purchase-confirmation feature is on the near-term roadmap -->

### Macht ein MCP-Server einen Registrar automatisch agent-native?

Nein. MCP-Unterstützung deckt Auffindbarkeit und browserfreien Kauf ab, doch ein Registrar kann einen MCP-Server bereitstellen und dennoch unstrukturierte Fehler zurückgeben, weiterhin eine hinterlegte Karte verlangen oder weiterhin keinen Mechanismus für Ausgabenobergrenzen haben. Agent-native ist die gesamte Checkliste, nicht eine einzelne Zeile.

## Quellen und weiterführende Lektüre

- Wikipedia — [Extensible Provisioning Protocol (EPP als Proposed Standard, März 2004)](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- CircleID — [Das Domain-Universum 2026: KI, Sicherheit, Marktreife und die neue gTLD-Grenze („KI-Agenten agieren zunehmend als Domain-Reseller…“)](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- webhosting.today — [KI-Agenten können jetzt Domains ohne Menschen registrieren (Cloudflare-Registrar-API-Beta, April 2026)](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code)
- Name.com — [Die erste KI-native Domain-Plattform („unterstützt durch moderne Standards wie das Model Context Protocol…“)](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=Our%20platform%20is%20supported%20by%20modern%20standards%20like%20Model%20Context%20Protocol)
- llmstxt.org — [Der Vorschlag für die Datei /llms.txt](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- modelcontextprotocol.io — [Was ist das Model Context Protocol (MCP)?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Schema.org — [FAQPage](https://schema.org/FAQPage)
- Cloudflare — [.ai-Domains zu Selbstkosten kaufen](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)
- Cloudflare Developers — [Registrar-Dokumentationsindex (llms.txt)](https://developers.cloudflare.com/registrar/llms.txt)
- Namefi — [namefi.io/llms.txt (API- und MCP-Server-Referenz — maßgebliche Quelle für Namefi-Produktbehauptungen in diesem Artikel)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt (Wallet-signierter / x402-Zahlungsablauf, „kein Namefi-Konto und keine EIP-712-Signatur erforderlich“)](https://namefi.io/web3/llms.txt)
