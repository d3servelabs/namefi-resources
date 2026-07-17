---
title: "Cloudflare vs. Name.com vs. Namefi: Agent-native Registrare"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'comparison']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
format: comparison
ogImage: ../../assets/cf-namecom-namefi-og.jpg
description: "Funktionsvergleich der drei agent-nativen Registrare: Preise, MCP-Unterstützung, Krypto-Checkout, tokenisierte Eigentümerschaft und wann welcher die richtige Wahl ist."
keywords: ["cloudflare registrar api", "name.com ki api", "namefi mcp", "agent-nativer registrar", "ki-registrar vergleich", "krypto-domain-checkout", "tokenisierte domain", "mcp-domain-registrierung", "ki-agent domain kaufen", "cloudflare vs namefi", "name.com vs namefi", "domain-preise zum selbstkostenpreis", "wallet-checkout domain"]
relatedArticles:
  - /de/blog/ai-domain-platforms/
  - /de/blog/agent-native/
  - /de/blog/airo-vs-namefi/
  - /de/blog/claude-mcp-domains/
  - /de/blog/ai-agent-register/
relatedTopics:
  - /de/topics/domain-tokenization/
  - /de/topics/choosing-a-tld/
relatedSeries:
  - /de/series/tokenize-your-com/
  - /de/series/best-tlds-by-industry/
relatedGlossary:
  - /de/glossary/ai-agent/
  - /de/glossary/registrar/
  - /de/glossary/tokenized-domain/
  - /de/glossary/dnssec/
  - /de/glossary/wallet/
---

Drei [Registrare](/de/glossary/registrar/) ermöglichen es inzwischen etwas anderem als einem Menschen, ein Checkout-Formular auszufüllen. Cloudflare eröffnete im April 2026 eine Beta-API, mit der ein [KI-Agent](/de/glossary/ai-agent/) eine Domain ohne Browser-Sitzung registrieren kann. Name.com hat seine API rund um dieselbe Idee neu aufgebaut und bezeichnet sich als erste KI-native Domain-Plattform. Namefi hat einen Model Context Protocol (MCP)-Server und einen per Wallet-Signatur autorisierten Checkout entwickelt, der die Kontoerstellung vollständig überspringt. Alle drei zielen auf denselben Wandel: Domain-Registrierung wird von etwas, das eine Person im Browser erledigt, zu etwas, das ein Agent über einen API-Aufruf erledigt.

Sie sind jedoch nicht dasselbe Produkt mit unterschiedlichen Logos. Jedes setzt andere Schwerpunkte bei der Preisgestaltung, bei der Frage, was „agent-native“ tatsächlich erfordert, und dabei, wie ein Käufer seine Zahlungsfähigkeit nachweist. Dies ist ein Funktionsvergleich der drei — einschließlich der Punkte, an denen Cloudflares Preisgestaltung wirklich schwer zu übertreffen ist, und der Punkte, an denen die Positionierung von Name.com dem ausgelieferten Produkt voraus ist.

## Was „agent-native“ tatsächlich erfordert

Eine API zu haben ist nicht dasselbe, wie von einem Agenten nutzbar zu sein. Die meisten Registrare bieten seit Jahren programmatische Registrierung an — doch diese Schnittstellen wurden für Reseller und Entwickler entwickelt, die Dokumentation lesen, nicht für einen autonomen Prozess, der herausfinden muss, was möglich ist, sich ohne von einem Menschen eingegebenes Passwort authentifizieren und eine Fehlermeldung ohne menschliche Lektüre auswerten muss. Eine ausführlichere Checkliste dessen, was einen Registrar mit API von einem agent-nativen Registrar unterscheidet, findet sich in [Was ist ein agent-nativer Domain-Registrar?](/de/blog/agent-native/). Kurz gesagt geht es um Auffindbarkeit (kann ein Agent die API selbst finden?), maschinenlesbare Antworten und einen Zahlungsweg, der nicht voraussetzt, dass ein Mensch eine Kreditkarte in der Hand hält. Die drei folgenden Registrare erfüllen diese Anforderungen in unterschiedlichem Maß.

## Cloudflare Registrar API: Zum Selbstkostenpreis, als Beta und bereits in deinem Editor

Die Registrar API von Cloudflare ging am April 15, 2026 während der Ankündigungen zur „Agents Week“ des Unternehmens in die Beta. Laut einem Branchenbericht zur Einführung [ermöglicht die API einem KI-Agenten, die Verfügbarkeit einer Domain zu suchen, Preise zu prüfen und die Registrierung programmatisch ohne Browser-Interaktion oder manuelle Freigabe abzuschließen](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=lets%20an%20AI%20agent%20search%20for%20domain%20availability%2C%20check%20pricing%2C%20and%20complete%20registration%20programmatically%20without%20any%20browser%20interaction%20or%20manual%20approval). Die Registrierung wird bei Standard-Domains innerhalb von Sekunden synchron abgeschlossen, und die API ist dafür ausgelegt, in [Code-Editoren mit MCP-Unterstützung wie Cursor und Claude Code](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code) zu laufen. Ein Entwickler kann eine Domain für das Projekt registrieren, das er baut, ohne das Werkzeug zu verlassen, in dem er es baut.

Der stärkste Teil von Cloudflares Angebot ist die Preisgestaltung, und hier verlangt Glaubwürdigkeit, einen echten starken Punkt anzuerkennen: Cloudflare [bietet Registrierungen und Verlängerungen von .ai-Domains zu Großhandelspreisen ohne zusätzliche Aufschläge](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups). Jede registrierte Domain enthält [kostenlos DNSSEC, SSL, Zwei-Faktor-Authentifizierung und eine standardmäßig aktivierte Domain-Sperre](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=free%20DNSSEC%2C%20free%20SSL%2C%20two-factor%20authentication%2C%20and%20a%20domain%20lock%20enabled%20by%20default), außerdem eine [kostenlose WHOIS-Schwärzung](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=every%20.ai%20domain%20comes%20with%20free%20WHOIS%20redaction) — für den [WHOIS-Datenschutz](/de/glossary/whois-privacy/), den andere Registrare als Zusatzleistung verkaufen, fällt kein Aufpreis an. Eine separate Übersicht über Registrare bestätigt das Preismodell unabhängig: Bei Cloudflares [Preisgestaltung zum Selbstkostenpreis zahlst du nur, was Cloudflare zahlt, ohne Aufschlag bei Registrierung oder Verlängerung](https://www.hostinger.com/tutorials/best-domain-registrars/#:~:text=At-cost%20pricing%20charges%20you%20only%20what%20Cloudflare%20pays%2C%20with%20no%20markup%20at%20registration%20or%20renewal). Wenn der Preis entscheidend ist und du über „registrieren und absichern“ hinaus nichts brauchst, ist Cloudflare schwer zu übertreffen.

Der Haken ist der Umfang. Die Beta umfasst Suche, Preisprüfung und Registrierung. [Cloudflare hat erklärt, dass das Lebenszyklusmanagement in Entwicklung ist und später 2026 veröffentlicht werden soll](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=Cloudflare%20has%20stated%20that%20lifecycle%20management%20is%20in%20development%20and%20is%20planned%20for%20release%20later%20in%202026), sodass Transfers, Verlängerungen und Kontaktaktualisierungen noch nicht Teil der agentengerichteten API sind. Es gibt keine Krypto-Zahlungsoption und keine tokenisierte Eigentümerschaft: Eine über Cloudflare registrierte Domain ist ein konventionelles Asset in einem Registrar-Konto und kein Vermögenswert, den eine Wallet direkt halten kann.

## Die KI-native API von Name.com: Von natürlicher Sprache zu funktionierendem Code

Die Positionierung von Name.com unterscheidet sich von der von Cloudflare. Statt mit dem Preis zu beginnen, hat Name.com seine Entwickler-API rund um [die Einführung der neuen name.com API, unserer KI-nativen Plattform, die Domains für das Zeitalter agentischer KI modernisiert](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI), aufgebaut. Diese beruht auf der [Model Context Protocol (MCP)- und OpenAPI-Spezifikation, die KI-Agenten die direkte Interaktion mit Domain-Vorgängen ermöglicht](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=supported%20by%20modern%20standards%20like%20Model%20Context%20Protocol%20%28MCP%29%20and%20OpenAPI%20specification%2C%20which%20enable%20AI%20agents%20to%20interact%20directly%20with%20domain). Auch dies vermarktet das Unternehmen ausdrücklich als Workflow im Editor: Es sagt, Entwickler könnten [KI-Tools wie Claude und Cursor dank MCP-Unterstützung über einfache Prompts für Domain-Vorgänge einsetzen](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=Leverage%20AI%20tools%20like%20Claude%20and%20Cursor%20to%20handle%20domain%20operations%20through%20simple%20prompts%2C%20thanks%20to%20MCP%20support).

Das klarste Unterscheidungsmerkmal in der Ankündigung von Name.com ist die Einordnung als Weg von natürlicher Sprache zu Code. Statt dass ein Agent einen festen Satz von Endpoints aufruft, lautet das Versprechen: Du sagst einem Agenten „Füge meiner App Domain-Registrierung hinzu“, und der Agent schreibt mithilfe der API-Dokumentation selbst den Integrationscode. Name.com stützt das Argument „die Welt bewegt sich in diese Richtung“ mit eigener Kundenforschung und berichtet, dass [91% der Befragten erwarten, dass KI-Agenten in den nächsten zwei Jahren zumindest einen Teil ihrer Domain-Verwaltung übernehmen](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years). Da diese Statistik unmittelbar aus der Ankündigung von Name.com und nicht von Dritten stammt, sollte sie als vom Unternehmen berichtete Marktstimmung und nicht als unabhängige Umfrage behandelt werden.

Zwei Punkte sollten ehrlich hervorgehoben werden. Erstens ist der Blogbeitrag von Name.com ein Text zu Positionierung und Vision; er veröffentlicht nicht die detaillierte Fähigkeitstabelle, die die Dokumentation von Cloudflare und Namefi bietet. Mehrere Zellen der folgenden Matrix spiegeln daher wider, was die Ankündigung behauptet, und nicht eine getestete Spezifikation. Zweitens spricht der eigene Beitrag von Name.com bei der Preisgestaltung über Flexibilität auf Reseller-Seite — [die Möglichkeit, eigene Aufschläge festzulegen](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20ability%20to%20set%20your%20own%20markups). Das ist eine Funktion für Reseller-Partner, nicht das Versprechen von Preisen zum Selbstkostenpreis für Endnutzer wie bei Cloudflare. Auch einen Krypto-Zahlungsweg oder tokenisierte Eigentümerschaft nennt die Ankündigung nicht.

## Namefi: MCP-Server, Wallet-Checkout und tokenisierte Eigentümerschaft

Der Ansatz von Namefi beginnt mit einer anderen Annahme: Der Käufer ist möglicherweise kein Mensch mit Browser-Sitzung oder Kreditkarte und möchte möglicherweise kein Namefi-Konto anlegen, bevor er handeln kann. Laut der eigenen maschinenlesbaren API-Dokumentation von Namefi — der einzigen Quelle der Wahrheit für die Produktbehauptungen — betreibt Namefi einen MCP-Server unter `https://api.namefi.io/mcp` über Streamable-HTTP-Transport. Er stellt „jeden `/v-next`-Vorgang als typisiertes Tool bereit (Suche, Registrierung, DNS, Domain-Konfiguration, Outbound)“, ist unter `https://namefi.io/.well-known/mcp/servers.json` auffindbar und dokumentiert einen einzeiligen Einrichtungsbefehl für Claude Code (`claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"`). Die REST API verwendet zur Authentifizierung einen `x-api-key`-Header, der an die Wallet gebunden ist, welche die Domain besitzt; schreibgeschützte Tools benötigen überhaupt keinen Schlüssel.

Das charakteristische Merkmal ist die Zahlung. Namefi dokumentiert einen [x402](https://x402.org)-Zahlungsfluss, mit dem ein Agent eine Domain mit dem Stablecoin USDC kaufen kann, ohne zunächst ein Namefi-Konto anzulegen. Die Wallet des Käufers signiert ein EIP-3009-`transferWithAuthorization`, die API gibt ohne beigefügte Zahlung eine `402 Payment Required`-Antwort mit dem Preis zurück und führt die Registrierung durch, sobald ein gültiger Payment-Header eintrifft. Ein separater Machine Payable Protocol (MPP)-Fluss bietet ein ähnliches Challenge-and-Sign-Muster. Weder Cloudflare noch Name.com dokumentieren etwas Vergleichbares; das ist der schärfste Unterschied in diesem Vergleich. Wie dieser Checkout-Fluss Ende zu Ende funktioniert, zeigt [Domains mit einer Krypto-Wallet bezahlen: Kein Konto nötig](/de/blog/wallet-checkout/).

Namefi registriert Domains außerdem als [NFTs](/de/glossary/nft/) — [tokenisierte Domains](/de/glossary/tokenized-domain/), deren Eigentümerschaft On-Chain und nicht nur in der internen Datenbank eines Registrars verifiziert wird. Seine DNS-Schalter umfassen automatische [ENS](/de/glossary/ens/)-Einträge und [DNSSEC](/de/glossary/dnssec/) sowie vollständige CRUD-Verwaltung von DNS-Einträgen (einzeln und im Batch), automatische Verlängerung, Domain-Parking und Weiterleitung. Was die llms.txt von Namefi nicht veröffentlicht, ist eine festgelegte Preisrichtlinie: Es gibt keinen „zum Selbstkostenpreis“-Anspruch wie bei Cloudflare und keine sichtbare veröffentlichte Preisliste in der für diesen Beitrag geprüften Dokumentation. Prüfe daher die aktuellen Preise direkt auf namefi.io, statt Preisgleichheit mit Cloudflare anzunehmen. <!-- TODO: confirm with team — Namefi's published pricing/markup policy relative to registry cost -->

## Die Funktionsmatrix

| Funktion | Cloudflare Registrar API | Name.com KI-native API | Namefi |
|---|---|---|---|
| Verfügbarkeitssuche | Ja | Ja | Ja (`search/availability`, im Batch) |
| Preisabfrage | Ja | Ja (dokumentiert, nicht detailliert aufgeschlüsselt) | Ja (in der x402-`402`-Antwort; auch über API) |
| Kauf / Registrierung | Ja, synchron, Sekunden | Ja (vom Agenten erzeugter Integrationscode) | Ja — API-Key oder per Wallet-Signatur autorisiertes USDC über x402/MPP |
| DNS-Verwaltung | Nicht in der aktuellen Beta | In der Ankündigung nicht detailliert | Ja — vollständiges CRUD, Batch-Vorgänge, A/CNAME/TXT/MX und mehr |
| Automatisierte Verlängerung | Nicht in der aktuellen Beta (später 2026 geplant) | In der Ankündigung nicht detailliert | Ja — Auto-Renew-Schalter pro Domain |
| Krypto-Zahlung | Nein | Nein | Ja — USDC über x402, kein Konto erforderlich |
| Tokenisierte Eigentümerschaft | Nein | Nein | Ja — Domain als NFT registriert, On-Chain-Verifizierung |
| Konto erforderlich | Ja (Cloudflare-Konto) | Ja (Entwickler-/API-Zugang) | Nein beim x402-Wallet-Checkout; der API-Key-Weg ist an eine Wallet gebunden |
| MCP-Unterstützung | Ja (im Editor, laut Drittanbieterbericht) | Ja (dokumentiert) | Ja — dedizierter MCP-Server, Discovery-Deskriptor |
| Editor-Integration | Cursor, Claude Code (laut Bericht) | Claude, Cursor (laut Ankündigung) | Claude Code (dokumentierter Einrichtungsbefehl); offenes MCP-Protokoll |
| Selbstkostenpreis / keine Aufschläge | Ja, ausdrücklich genannt | Nicht genannt (Aufschläge von Resellern erwähnt) | Nicht veröffentlicht — aktuelle Preise prüfen |

## Wann welcher gewinnt

Wähle **Cloudflare**, wenn Preis und Einfachheit ausschlaggebend sind und du über die Registrierung eines Namens und dessen Absicherung hinaus nichts brauchst. Die Preise zum Selbstkostenpreis und die integrierten Sicherheitsstandards (DNSSEC, WHOIS-Schwärzung, Zwei-Faktor-Authentifizierung) sind tatsächlich besser als das, was die meisten etablierten Anbieter für denselben Schutz verlangen. Wenn du bereits in Cursor oder Claude Code auf dem Stack von Cloudflare arbeitest, ist der Workflow reibungslos. Die ehrliche Abwägung ist der Umfang: Noch keine DNS-Verwaltung, keine automatisierten Verlängerungen und keine Krypto- oder tokenisierten Optionen, denn die Beta beschränkt sich auf Registrierung.

Wähle **Name.com**, wenn ein Agent den Integrationscode für dich schreiben soll, statt eine feste API aufzurufen, oder wenn du bereits Name.com-Reseller bist und auf einer modernisierten, MCP-kompatiblen Plattform flexible Aufschläge möchtest. Die Dokumentation ist bei der Frage, was genau ausgeliefert ist und was auf der Roadmap steht, dünner als bei Cloudflare oder Namefi. Plane daher Zeit ein, die tatsächliche API-Oberfläche gegen das Marketing zu testen.

Wähle **Namefi**, wenn der Käufer wirklich agent-first ist: kein menschliches Konto, eine Zahlung, die durch Wallet-Signatur statt durch eine gespeicherte Karte autorisiert wird, und Eigentümerschaft, die als übertragbarer On-Chain-Token statt nur als Zeile in der Datenbank eines Registrars dargestellt werden soll. Diese Kombination — MCP-Server, vollständige DNS-Kontrolle, automatisches ENS und Wallet-nativer Checkout — bieten die Beta von Cloudflare und die Ankündigung von Name.com derzeit nicht. Der Nachteil ist, dass Namefi keine Selbstkostenpreis-Zusage wie Cloudflare veröffentlicht hat. Wenn Großhandelspreise deine höchste Priorität sind, prüfe die aktuellen Namefi-Preise direkt, bevor du annimmst, sie seien niedriger als bei Cloudflare.

Viele Teams werden am Ende mehr als einen Anbieter nutzen: Cloudflare oder Name.com für die Domain vor Infrastruktur, die sie dort bereits betreiben, und einen Wallet-nativen Registrar wie Namefi für alles, was On-Chain besessen und gehandelt werden muss — sei es ein Name, der auf einem Marketplace gehandelt werden soll, oder einer, der der eigenen Wallet eines Agenten statt dem Konto einer Person gehört. Was „Eigentümerschaft“ überhaupt bedeutet, sobald der [Registrant](/de/glossary/registrant/) ein Agent statt einer Person ist, ist eine Frage, die tief genug für einen eigenen Beitrag ist — siehe [Kann ein KI-Agent eine Domain besitzen? WHOIS, Verwahrung & Token](/de/blog/agent-own-domain/).

## Häufig gestellte Fragen

### Welcher Registrar ist für einen KI-Agenten am günstigsten?
Cloudflare ist der einzige der drei, der eine ausdrückliche Preiszusage zum Selbstkostenpreis ohne Aufschlag veröffentlicht und diese durch eine unabhängige Registrar-Übersicht bestätigt sieht. Die Ankündigung von Name.com behandelt Aufschlagsflexibilität für Reseller statt einer Selbstkostenpreis-Zusage für Endnutzer. Namefi hat in seiner API-Dokumentation keine Preisrichtlinie veröffentlicht; ein direkter Preisvergleich ist daher derzeit nicht möglich, ohne die aktuellen Preise auf jeder Plattform zu prüfen.

### Ermöglicht einer davon einem Agenten zu zahlen, ohne dass ein Mensch eine Kreditkarte hält?
Namefi ist der einzige der drei mit einem dokumentierten Krypto-nativen Zahlungsfluss: Die Wallet eines Agenten kann über das x402-Protokoll in USDC zahlen, ohne ein Namefi-Konto anzulegen, oder über einen separaten Machine Payable Protocol Challenge-and-Sign-Fluss. Weder die Beta von Cloudflare noch die API von Name.com dokumentieren einen vergleichbaren Zahlungsweg ohne Konto.

### Kann ich DNS-Einträge über diese APIs verwalten und nicht nur die Domain registrieren?
Die Dokumentation von Namefi deckt vollständiges CRUD für DNS-Einträge ab, einschließlich Erstellung, Aktualisierung und Löschung im Batch sowie Schalter für Parking, Weiterleitung, automatisches ENS und Vercel-Anycast-Einträge. Die Beta der Registrar API von Cloudflare ist zum Zeitpunkt dieses Beitrags auf Registrierung beschränkt; Lebenszyklus- und Verwaltung nach der Registrierung (einschließlich DNS) sollen später veröffentlicht werden. Die Ankündigung von Name.com schlüsselt DNS-Verwaltungsfähigkeiten nicht auf.

### Ist die Registrar API von Cloudflare bereits allgemein verfügbar?
Nein. Sie ging am April 15, 2026 während der „Agents Week“ von Cloudflare in die Beta. Cloudflare hat erklärt, dass ein breiteres Lebenszyklusmanagement (Transfers, Verlängerungen, Kontaktaktualisierungen) noch in Entwicklung und für später 2026 geplant ist. Fähigkeiten in der Beta können sich ändern; überprüfe sie erneut, bevor du dich in der Produktion darauf verlässt.

### Was bedeutet „agent-native“, und erfüllen alle drei diesen Anspruch?
Agent-native bedeutet, dass ein Agent die API finden, sich authentifizieren und einen Kauf abschließen kann, ohne dass ein Mensch ein Browser-Formular ausfüllt. Die vollständige Checkliste steht in [Was ist ein agent-nativer Domain-Registrar?](/de/blog/agent-native/). Alle drei Registrare erfüllen die grundlegende Voraussetzung (programmatische Suche bis zum Kauf, MCP- oder MCP-nahe Tools), unterscheiden sich aber stark darin, wie weit dieses agent-native Design über die Registrierung hinausgeht — DNS, Verlängerungen, Zahlungsmethode und Eigentumsmodell.

## Domains bei Namefi kaufen und tokenisieren

Wenn du Wallet-nativen Checkout und tokenisierte Eigentümerschaft brauchst, registriert [Namefi](https://namefi.io) echte ICANN-Domains wie jeder akkreditierte Registrar — mit der Option, die Domain als NFT zu halten, das deine Wallet kontrolliert. [KI-agentische Domain-Plattformen: Der Leitfaden für 2026](/de/blog/ai-domain-platforms/) zeigt die gesamte Landschaft über diese drei hinaus; direkt zur praktischen Einrichtung geht es in [Wie du mit deinem KI-Agenten eine Domain bei Namefi registrierst](/de/blog/ai-agent-register/). Die Mechanik, mit der ein Agent diesen Kauf selbstständig abschließt, erklärt [Wie KI-Agenten Domains ohne Menschen kaufen (2026)](/de/blog/agents-buy-domains/).

**[Eine Domain bei Namefi suchen und registrieren](https://namefi.io).**

## Quellen und weiterführende Lektüre

- webhosting.today — [KI-Agenten können jetzt Domains registrieren, kein Mensch erforderlich (Cloudflare Registrar API Beta, April 2026)](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=lets%20an%20AI%20agent%20search%20for%20domain%20availability%2C%20check%20pricing%2C%20and%20complete%20registration%20programmatically%20without%20any%20browser%20interaction%20or%20manual%20approval)
- Cloudflare — [.ai-Domains kaufen: Preise zum Selbstkostenpreis und enthaltene Sicherheitsfunktionen](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)
- Name.com — [Die erste KI-native Domain-Plattform](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI)
- Hostinger — [Die besten Domain-Registrare im Vergleich, einschließlich der Selbstkostenpreise von Cloudflare](https://www.hostinger.com/tutorials/best-domain-registrars/#:~:text=At-cost%20pricing%20charges%20you%20only%20what%20Cloudflare%20pays%2C%20with%20no%20markup%20at%20registration%20or%20renewal)
- llmstxt.org — [Die llms.txt-Spezifikation](https://llmstxt.org/#:~:text=context%20windows%20are%20too%20small%20to%20handle%20most%20websites%20in%20their%20entirety)
- Model Context Protocol — [Was ist MCP?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt (Referenz für MCP-Server, API und Authentifizierung)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt (Referenz für Wallet-signierte und x402-Krypto-Zahlungen)](https://namefi.io/web3/llms.txt)
