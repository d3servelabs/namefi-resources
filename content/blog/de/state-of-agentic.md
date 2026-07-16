---
title: "Der Stand des agentischen Domain-Managements, 2026"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'domains', 'analysis']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: analysis
ogImage: ../../assets/state-of-agentic-og.jpg
description: "Der Wandel der Domain-Registrierung in die Agentenschicht: eine belegte Zeitleiste, ein Audit von Ausgeliefertem gegenüber Angekündigtem einschließlich Namefi und falsifizierbare Prognosen für 2027."
keywords: ["stand des agentischen domain-managements", "agentisches domain-management 2026", "ki-trends in der domain-branche", "ki-adoption in der domain-branche", "zeitleiste der agentenschicht", "prognosen für domain-registrare 2027", "mcp-adoption bei domain-registrierung", ".ai domain-registrierungen 2026", "cloudflare registrar api beta", "name.com ki-native api", "these agenten als reseller", "verisign domain name industry brief", "dns-verankerte identität für ki-agenten"]
relatedArticles:
  - /de/blog/agents-buy-domains/
  - /de/blog/cf-namecom-namefi/
  - /de/blog/ai-domain-platforms/
  - /de/blog/agent-native/
  - /de/blog/ai-agent-register/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/web3-foundations/
relatedSeries:
  - /de/series/blockchain-concepts/
  - /de/series/domain-apocalypse/
relatedGlossary:
  - /de/glossary/ai-agent/
  - /de/glossary/epp/
  - /de/glossary/registrar/
  - /de/glossary/registry/
  - /de/glossary/reseller/
---

Zur Mitte des Jahres 2026 lässt sich die Erzählung „KI-Agenten werden verändern, wie Domains registriert werden“ an realen Ereignissen statt an Prognosen messen. Ein Teil davon geschah an einem konkreten, überprüfbaren Datum. Ein anderer Teil ist noch ein Beta-Label, ein Positionierungsbeitrag oder ein Entwurf in der Warteschlange eines Standardisierungsgremiums. Dieser Beitrag hält diese beiden Kategorien getrennt: eine belegte Zeitleiste dessen, was die Domain-Registrierung in Richtung [Agentenschicht](/de/blog/agents-buy-domains/) bewegte, ein ehrliches Audit dessen, was tatsächlich ausgeliefert und was lediglich angekündigt wurde (einschließlich Namefi, mit allen Lücken), die in der Fachpresse kursierende These „Agenten als Reseller“ sowie Prognosen für 2027, die so formuliert sind, dass Leser sie ohne unsere Interpretation als wahr oder falsch bewerten können.

## Die Adoptionszahlen und woher sie tatsächlich stammen

Zwei Zahlen werden in der Berichterstattung über „KI und Domains“ in diesem Jahr ständig zitiert; sie verdienen unterschiedlich viel Vertrauen.

Die erste ist die eigene Behauptung von Name.com, dass [„91% der Befragten erwarten, dass KI-Agenten in den nächsten zwei Jahren zumindest einen Teil ihrer Domain-Verwaltung übernehmen“](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years). Sie stammt aus einem Blogbeitrag, den das Unternehmen am **July 10, 2025** veröffentlichte. Name.com schreibt die Zahl „unserer jüngsten Kundenumfrage“ zu, veröffentlicht aber weder Stichprobengröße noch Methodik oder unabhängige Überprüfung. Behandle sie daher als das, was sie ist: **Name.com berichtet**, dass die eigenen, von Name.com befragten Kunden dies gesagt haben — vom Unternehmen berichtete Stimmung, keine unabhängige Branchenstatistik.

Die zweite Zahl ist überprüfbar und unabhängig bestätigt. Am **January 28, 2026** gab die Regierung von Anguilla bekannt, dass die `.ai`-[ccTLD](/de/glossary/cctld/) eine Million registrierte Domains überschritten hatte. [Domain Name Wire berichtete direkt über diesen Meilenstein](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/): zu Beginn von 2025 gab es ungefähr 598,000 `.ai`-Domains; etwa dreizehn Monate später wurde die Marke von einer Million überschritten. Ausgehend von rund 40,000 Registrierungen in 2020 dauerte dieser Anstieg fünf Jahre. Die Berichterstattung von CircleID über die Domain-Branche nennt denselben Meilenstein unabhängig, und die Branchenanalyse von Hogan Lovells zu `.ai` bestätigt die Entwicklung — eine mehrfach bestätigte Zahl und keine einzelne Selbstauskunft.

Als Größenordnung gegenüber dem gesamten Domain-Markt: Der [Domain Name Industry Brief](https://www.dnib.com) von Verisign für Q1 2026 meldete 392.5 million Domain-Registrierungen über alle TLDs hinweg, 1.4% mehr gegenüber dem Vorquartal und 6.5% mehr gegenüber dem Vorjahr. Die [Berichterstattung von CircleID über die Veröffentlichung](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29) zitiert diese Zahl direkt. Die ungefähr eine Million `.ai`-Registrierungen sind innerhalb der 392.5 million ein kleiner, schnell wachsender Anteil — echte Dynamik, aber noch kein marktverändernder Anteil. Weder DNIB noch die öffentlichen Materialien von Identity Digital weisen aus, welcher Anteil der Registrierungen über einen Agenten statt über einen Browser-Checkout fließt. Genau diese Lücke umgeht der Rest dieses Beitrags: Wir können überprüfen, *dass* agentengerichtete Infrastruktur gestartet wurde und ungefähr wann, aber noch nicht, *wie viel* Volumen darüber fließt.

## Zeitleiste: der Wandel zur Agentenschicht

Jedes nachstehende Datum ist gegen eine Primärankündigung, offizielle Dokumentation oder einen direkt abgerufenen Fachpressebericht verifiziert, nicht gegen einen Sekundäraggregator, der eine unbelegte Zahl wiederholt.

| Datum | Ereignis | Quelle |
| --- | --- | --- |
| 2004-03 | [EPP](/de/glossary/epp/) (Extensible Provisioning Protocol) — die Maschine-zu-Maschine-Sprache, mit der Registrare noch immer mit Registries kommunizieren — erhält den Status Proposed Standard | [RFCs 3730–3734, veröffentlicht March 2004](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004) |
| 2024-09-03 | Der Dateivorschlag `/llms.txt` wird veröffentlicht und gibt Websites eine Standardmethode, sich Sprachmodellen zur Inferenzzeit zu beschreiben | [llmstxt.org, veröffentlicht von Jeremy Howard](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time) |
| 2024-11-25 | Anthropic veröffentlicht das [Model Context Protocol](https://modelcontextprotocol.io), einen offenen Standard zum Verbinden von KI-Anwendungen mit externen Tool-Servern | [Ankündigung von Anthropic zu MCP](https://www.anthropic.com/news/model-context-protocol) |
| 2025-07-10 | Name.com veröffentlicht seinen Positionierungsbeitrag zur „ersten KI-nativen Domain-Plattform“, aufgebaut auf MCP und OpenAPI, einschließlich der oben genannten selbst berichteten 91%-Zahl | [Name.com-Blog](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI) |
| 2026-01-28 | `.ai` überschreitet laut einer Regierungsankündigung aus Anguilla eine Million registrierte Domains | [Domain Name Wire](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/) |
| 2026-04-15 | Cloudflare stellt seine Registrar API während der „Agents Week“ in die öffentliche Beta und bindet Registrierung, Suche und Preisabfrage in die MCP-Schicht ein | [Ankündigung der Cloudflare Registrar API Beta](https://blog.cloudflare.com/registrar-api-beta/); [Branchenberichterstattung](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer) |
| 2026-04-20 | CircleID veröffentlicht seine Analyse „Agenten als Domain-Reseller“ | [CircleID, Simone Catania](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) |
| 2026-04-24 | Der Domain Name Industry Brief von Verisign für Q1 2026 meldet 392.5 million Domain-Registrierungen insgesamt — Markt-Kontext für jede der obigen Zahlen | [DNIB.com](https://www.dnib.com); [CircleID-Berichterstattung](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29) |
| 2026-04-27 | Identity Digital — Muttergesellschaft der `.ai`-Registry und von [Name.com](https://www.name.com) — startet einen „neutralen, DNS-verankerten Identitätsstandard für KI-Agenten“ und schlägt DNS-Einträge als Ort vor, an dem der verantwortliche Eigentümer eines Agenten festgehalten wird | [Newsroom von Identity Digital](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-identity-standard-for-ai-agents.html) |
| 2026-06-04 | Innovation Labs von Identity Digital formalisiert diesen Vorschlag als IETF Internet-Draft „DNS-Anchored Durable Identity for AI Agents (DNSid)“ | [GlobeNewswire](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems); [IETF-Datatracker-Entwurf](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

In dieser Reihenfolge gelesen ergibt sich folgendes Muster: ein zwanzig Jahre altes Bereitstellungsprotokoll, dann zwei allgemeine KI-Agentenstandards, die gar nicht für Domains entwickelt wurden (llms.txt, MCP), dann Registrare, die diese Standards nacheinander in Checkout-Flüsse nachrüsten, und schließlich dieselbe Registry-Familie (Identity Digital), die über den eigenen Registrar hinausgreift und DNS als Infrastruktur für die *Identität* eines Agenten vorschlägt, nicht nur für dessen *Kauf*. Dieser letzte Schritt ist der neueste und am wenigsten gefestigte: Ein Internet-Draft ist ein zur Diskussion eingereichter Vorschlag, kein ratifizierter Standard.

## Was tatsächlich ausgeliefert ist und was angekündigt wurde

„Agent-native“ wird in Marketingtexten locker verwendet. Hier ist, was jede Position tatsächlich ausgeliefert hat — gegen die jeweils eigene Live-Dokumentation der Plattform verifiziert — im Vergleich zu dem, was noch ein Beta-Label, eine Positionierungsbehauptung oder ein Standard-Track-Vorschlag ohne laufenden Code dahinter ist.

| Plattform | Fähigkeit | Status | Nachweis |
| --- | --- | --- | --- |
| Namefi | MCP-Server (`api.namefi.io/mcp`, Streamable HTTP, auffindbar unter `/.well-known/mcp/servers.json`) | **Ausgeliefert** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | Per Wallet-Signatur autorisierter USDC-Checkout über [x402](/de/glossary/x402/) (EIP-3009 `transferWithAuthorization`, kein Konto erforderlich) | **Ausgeliefert** | [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) |
| Namefi | `llms.txt`-basierte Auffindbarkeit für Agenten-Tools und REST-Referenz | **Ausgeliefert** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | Primitive für Ausgabenlimit oder Kaufbestätigung auf der API-Schicht | **Nicht ausgeliefert** — zum Zeitpunkt dieses Beitrags gibt es keine dokumentierte Schranke; die Leitplanke liegt derzeit beim MCP-Client, nicht beim Server | Unsere eigene [Analyse der agent-nativen Checkliste](/de/blog/agent-native/), für diesen Beitrag direkt gegen `namefi.io/llms.txt` und `namefi.io/web3/llms.txt` gegengeprüft |
| Cloudflare | Registrar API: Suche, Verfügbarkeit, Preisabfrage, synchrone Registrierung | **Ausgeliefert, in öffentlicher Beta** seit 2026-04-15 | [Ankündigung der Cloudflare Registrar API Beta](https://blog.cloudflare.com/registrar-api-beta/) |
| Cloudflare | DNS-Eintragsverwaltung, Transfers, Verlängerungen, Kontaktaktualisierungen über dieselbe API | **Angekündigt, in Entwicklung** — der eigene Beitrag von Cloudflare sagt, das Unternehmen arbeite „aktiv daran, die API auf weitere Teile des grundlegenden Registrar-Erlebnisses auszuweiten“, vorgesehen für später 2026 | [Ankündigung der Cloudflare Registrar API Beta](https://blog.cloudflare.com/registrar-api-beta/) |
| Name.com | KI-native Positionierung mit MCP und OpenAPI, Einordnung von natürlicher Sprache zu Integrationscode | **Angekündigt** — ein Positionierungsbeitrag, keine detaillierte Fähigkeitsspezifikation | [Name.com-Blog](https://www.name.com/blog/the-first-ai-native-domain-platform) |
| Name.com | Auffindbare `llms.txt` oder dedizierter MCP-Server, direkt an der Domain-Root geprüft | **Nicht gefunden** zum Zeitpunkt unserer Prüfung | Direkte Prüfung von `name.com`, abgeglichen in [Cloudflare vs. Name.com vs. Namefi](/de/blog/cf-namecom-namefi/) |
| Identity Digital | DNSid: ein DNS-verankerter, kryptografisch überprüfbarer Eintrag zum verantwortlichen Eigentümer für KI-Agenten | **Vorgeschlagen** — ein zur Diskussion eingereichter IETF Internet-Draft, kein ratifizierter Standard und in keinen Live-Registrar-Checkout integriert | [IETF-Datatracker: draft-ihsanullah-dnsid](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

In dieser Tabelle stecken zwei Erkenntnisse. Erstens hat keine der von uns geprüften Plattformen — einschließlich Namefi — ein dokumentiertes, von der API erzwungenes Ausgabenlimit ausgeliefert; jede Leitplanke liegt eine Schicht höher, in der clientseitig von Menschen festgelegten Richtlinie. Zu demselben Ergebnis kam unsere [agent-native Checkliste](/de/blog/agent-native/) bei der Bewertung dieser Kategorie. Zweitens befindet sich DNS als Identitätsanker für den Agenten selbst, nicht nur für die Domain, die er kauft, noch im Stadium „zur IETF-Diskussion eingereicht“ — selbst bei positiver Aufnahme noch Monate davon entfernt, dass ein Registrar es in einen Live-Checkout einbauen könnte.

## Die Reseller-These

Die in der Berichterstattung der Domain-Branche 2026 wiederholte Aussage lautet, dass KI-Agenten zu *Resellern* werden. Die Analyse von CircleID vom April 20, 2026 formuliert es direkt: [„KI-Agenten agieren zunehmend als Domain-Reseller, prüfen die Verfügbarkeit, registrieren Namen und konfigurieren DNS ohne menschliches Eingreifen.“](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)

Die Wortwahl sollte von ihren Implikationen getrennt werden. Ein [Reseller](/de/glossary/reseller/) ist im eigenen Vokabular der Domain-Branche etwas Bestimmtes und Formelles: eine Partei, die Domains im Rahmen der [ICANN](/de/glossary/icann/)-Akkreditierungsvereinbarung eines Registrars verkauft oder bereitstellt und vertragliche Pflichten gegenüber dem Registrar und mittelbar gegenüber ICANN hat. Ein Agent, der heute eine Registrierungs-API aufruft, schafft diese Beziehung nicht. Der Agent handelt als Delegierter des Endkunden, authentifiziert durch dessen eigenen API-Key oder dessen Wallet, nicht als eigenständig akkreditierte Partei. Die Einordnung von CircleID ist beschreibend, keine Behauptung über einen Akkreditierungsstatus: Das *Verhaltensmuster* eines Resellers — suchen, bepreisen, registrieren, DNS konfigurieren, in großer Menge und im Auftrag anderer wiederholt — erscheint nun in Agenten-Workflows, obwohl der Betreiber kein Unternehmen mit einer unterzeichneten Reseller-Vereinbarung ist.

Ob sich dieses Verhalten zu etwas verdichtet, das Registries formell anerkennen, ist eine offene Frage. Dafür müssten Registries und Registrare entscheiden, ob Agentenaktivität mit hohem Volumen und klaren Richtlinien eine eigene Akkreditierungsstufe, Haltung zur Ratenbegrenzung oder Kategorie für Missbrauchsüberwachung braucht, die sich von der eines menschlichen Resellers unterscheidet. Nichts in der obigen Zeitleiste — die Beta von Cloudflare, der Beitrag von Name.com, der DNSid-Entwurf von Identity Digital — schlägt diese Stufe bislang vor. DNSid kommt dem am nächsten, weil es ausdrücklich darum geht zu überprüfen, wer für die Handlungen eines Agenten verantwortlich ist. Doch „wer ist verantwortlich“ und „ist formell als Reseller akkreditiert“ sind unterschiedliche Fragen, und der Entwurf beantwortet nur die erste. Die Mechanik eines einzelnen Kaufs erklärt [Wie KI-Agenten Domains ohne Menschen kaufen](/de/blog/agents-buy-domains/).

## Prognosen für 2027

Jede der folgenden Aussagen ist so formuliert, dass sie anhand öffentlicher Belege überprüfbar ist — eine konkrete Behauptung, keine Stimmung. Leser, die Mitte 2027 zurückkehren, können sie daher ohne unsere Interpretation als wahr, falsch oder ungelöst markieren.

1. **Mindestens einer von Cloudflare, Name.com oder ein vergleichbarer Mainstream-Registrar wird bis July 2027 eine dokumentierte, von der API erzwungene Primitive für Ausgabenlimit oder Kaufbestätigung veröffentlichen** (nicht nur clientseitige Anleitung). Zum Zeitpunkt dieses Beitrags ist diese Zeile bei jeder von uns geprüften Plattform leer, einschließlich Namefi.
2. **Die Registrar API von Cloudflare wird bis Ende 2027 ihr „Beta“-Label ablegen und mindestens eine von DNS-Eintragsverwaltung, automatisierter Verlängerung oder Transferunterstützung ausliefern** — entsprechend der Formulierung „später 2026“ in der eigenen Beta-Ankündigung, mit einem zusätzlichen Jahr Spielraum.
3. **Der DNSid Internet-Draft (oder ein direkter Nachfolger zur Frage „wer ist für diesen Agenten verantwortlich?“) wird bis July 2027 weiterhin IETF-Entwurfsstatus und keinen genehmigten RFC haben**, denn Standard-Track-Dokumente brauchen üblicherweise Jahre über die Einreichung hinaus und dieser wurde im June 2026 eingereicht.
4. **`.ai`-Registrierungen werden bis July 2027 1.5 million überschreiten** und damit die von Domain Name Wire und Identity Digital dokumentierte Wachstumskurve fortsetzen, statt nahe der im January 2026 überschrittenen Marke von einer Million zu stagnieren.
5. **Mindestens eine hier verglichene Plattform wird in eigenem Marketing oder eigener Dokumentation öffentlich das Wort „Reseller“ oder „Agent-Reseller“** für agentengesteuerte Registrierungsaktivitäten verwenden und damit die von CircleID im April 2026 verwendete Einordnung formalisieren, statt sie als Sprache der Fachpresse zu belassen.

## Häufig gestellte Fragen

### Wie viele Domains werden derzeit tatsächlich von KI-Agenten registriert?

Keine von uns geprüfte Registry oder kein Registrar — DNIB, Identity Digital, Cloudflare, Name.com — veröffentlicht eine Zahl, die von Agenten initiierte Registrierungen von menschlichen trennt. Überprüfbar ist die Infrastruktur: welche Plattformen einen von Agenten aufrufbaren Registrierungspfad ausgeliefert haben (Namefi, Cloudflare in der Beta, Name.com über Positionierung) und wann. Ein Agenten zurechenbares Adoptionsvolumen ist zum Zeitpunkt dieses Beitrags keine öffentliche Datenquelle.

### Ist die 91%-Statistik von Name.com eine verlässliche Branchenzahl?

Behandle sie als vom Unternehmen berichtete Stimmung, nicht als unabhängige Umfrage. Der Beitrag von Name.com aus July 2025 schreibt die Zahl „unserer jüngsten Kundenumfrage“ zu, ohne Methodik, Stichprobengröße oder externen Prüfer zu veröffentlichen — ein Signal dafür, was die Kunden von Name.com dem Unternehmen mitgeteilt haben, keine zitierfähige marktweite Statistik.

### Hat `.ai` wirklich eine Million Registrierungen erreicht, und wer hat dies bestätigt?

Ja — unabhängig bestätigt. Die Regierung von Anguilla, die die `.ai`-[ccTLD](/de/glossary/cctld/) verwaltet, gab den Meilenstein direkt bekannt, und Domain Name Wire berichtete die Wachstumszahlen mit einem konkreten Datum (January 28, 2026). CircleID und eine Branchenanalyse von Hogan Lovells zitieren denselben Meilenstein jeweils unabhängig — eine andere Belegschwelle als bei einer vom Unternehmen selbst berichteten Statistik.

### Was ist DNSid, und verändert es die Registrierung von Domains?

DNSid ist ein Internet-Draft — ein formeller Vorschlag, kein ratifizierter Standard —, den Innovation Labs von Identity Digital im June 2026 bei der IETF eingereicht hat. Er schlägt DNS-Einträge als dauerhaften, überprüfbaren Eintrag „wer ist für diesen KI-Agenten verantwortlich?“ vor. Das ist ein anderes Problem als die Registrierung selbst: Es geht um die Identifizierung des Agenten, nicht um den Kauf einer Domain. Zum Zeitpunkt dieses Beitrags ist DNSid in keinen Live-Registrar-Checkout integriert.

### Hat ein Registrar tatsächlich ein Ausgabenlimit oder eine „Lass den Agenten nicht zu viel ausgeben“-Kontrolle ausgeliefert?

Nicht auf API-Ebene, soweit wir durch direkte Prüfung der Dokumentation jeder Plattform überprüfen konnten. Namefi, Cloudflare und Name.com überlassen diese Leitplanke alle der Richtlinie, die ein Mensch clientseitig festlegt — dem MCP-Client, dem Agenten-Framework, dem Finanzierungslimit des API-Keys — statt einer Bestätigungsschranke, die der Registrar selbst erzwingt. Es ist die eine Zeile, die jede „agent-native“ Scorecard in diesem Bereich, einschließlich unserer, weiterhin als unvollständig markiert.

### Wo kann ich die Mechanik eines einzelnen Agentenkaufs statt der branchenweiten Perspektive nachlesen?

[Wie KI-Agenten Domains ohne Menschen kaufen](/de/blog/agents-buy-domains/) führt Schritt für Schritt durch die Abfolge Suche–Preis–Authentifizierung–Registrierung–Konfiguration. [Cloudflare vs. Name.com vs. Namefi](/de/blog/cf-namecom-namefi/) vergleicht die drei Plattformen Funktion für Funktion, und [Was ist ein agent-nativer Domain-Registrar?](/de/blog/agent-native/) beschreibt die Checkliste hinter der Tabelle dieses Beitrags zu ausgeliefert gegenüber angekündigt.

## Mit einem Agenten registrieren, der bereits den gesamten Stack ausliefert

Die meisten Lücken, die dieser Beitrag dokumentiert — undokumentierte Ausgabenlimits, Beta-Labels, Positionierungsbeiträge ohne detaillierte Spezifikation — sind nicht einzigartig für eine Plattform. Sie beschreiben, wo die Kategorie Mitte 2026 steht. [Namefi](https://namefi.io) liefert, was heute ausgeliefert ist: einen MCP-Server, mit dem sich dein Agent direkt verbindet, eine über `llms.txt` auffindbare REST API und einen per Wallet-Signatur autorisierten [x402](/de/glossary/x402/)-Checkout in USDC ganz ohne Konto, dazu [tokenisierte](/de/glossary/tokenized-domain/) Eigentümerschaft, falls die Domain in der Wallet eines Agenten liegen soll.

**[Eine Domain bei Namefi suchen und registrieren](https://namefi.io).**

## Quellen und weiterführende Lektüre

- Domain Name Wire — [.AI-Namespace erreicht 1 Million Domainnamen (January 28, 2026)](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/)
- CircleID — [Das Domain-Universum 2026: KI, Sicherheit, Marktreife und die New-gTLD-Grenze (April 20, 2026)](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- CircleID — [DNIB meldet 392.5 Million Domain-Registrierungen in Q1 2026](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29)
- Verisign / DNIB.com — [Domain Name Industry Brief](https://www.dnib.com)
- Cloudflare — [Ankündigung der Registrar API Beta (April 15, 2026)](https://blog.cloudflare.com/registrar-api-beta/)
- webhosting.today — [KI-Agenten können jetzt Domains registrieren, kein Mensch erforderlich](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer)
- Name.com — [Die erste KI-native Domain-Plattform (July 10, 2025)](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years)
- Identity Digital — [Identity Digital startet neutralen DNS-verankerten Identitätsstandard für KI-Agenten (April 27, 2026)](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-identity-standard-for-ai-agents.html)
- Identity Digital / GlobeNewswire — [Innovation Labs von Identity Digital reicht DNS-verankerten Vorschlag für eine dauerhafte KI-Agentenidentität bei der IETF ein (June 4, 2026)](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems)
- IETF Datatracker — [draft-ihsanullah-dnsid: DNS-verankerte dauerhafte Identität für KI-Agenten](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/)
- llmstxt.org — [Der /llms.txt-Dateivorschlag (veröffentlicht September 3, 2024)](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- Anthropic — [Einführung des Model Context Protocol (November 25, 2024)](https://www.anthropic.com/news/model-context-protocol)
- Wikipedia — [Extensible Provisioning Protocol (Proposed Standard, March 2004)](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- Namefi — [namefi.io/llms.txt (Referenz für MCP-Server und REST API)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt (Referenz für x402-Checkout per Wallet-Signatur)](https://namefi.io/web3/llms.txt)
