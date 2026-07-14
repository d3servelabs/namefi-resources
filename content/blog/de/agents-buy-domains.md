---
title: "Wie KI-Agenten Domains ohne einen Menschen kaufen (2026)"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/agents-buy-domains-og.jpg
description: "Im April 2026 verlagerte sich die Domainregistrierung in die Agentenschicht. Wie KI-Agenten Domains suchen, bepreisen und registrieren — und welche Leitplanken weiterhin zählen."
keywords: ['ki-agenten registrieren domains', 'domainregistrierung ohne menschen erforderlich', 'autonome domainregistrierung', 'domainregistrierung in der agentenschicht', 'cloudflare registrar api beta', 'agentische leitplanken', 'domainregistrierung durch ki-agenten 2026', 'ist es sicher ki domains kaufen zu lassen', 'agenten als domain-reseller', 'mcp domainregistrierung', 'llms.txt domainentdeckung', 'ausgabenlimit für ki-agenten', 'epp registry-provisionierung']
relatedArticles:
  - /de/blog/ai-domain-platforms/
  - /de/blog/cf-namecom-namefi/
  - /de/blog/agent-native/
  - /de/blog/namefi-mcp/
  - /de/blog/state-of-agentic/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/domain-security/
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

Zwanzig Jahre lang bedeutete die Registrierung einer Domain immer dasselbe kleine Ritual: Einen Namen in ein Suchfeld eingeben, auf ein grünes Häkchen warten, eine Kartennummer eintragen, durch das Erkennen von Zebrastreifen auf einem Foto beweisen, dass man ein Mensch ist, und auf „Kaufen“ klicken. Dieses Ritual war zum Teil ein bewusster Filter — das [CAPTCHA](https://en.wikipedia.org/wiki/CAPTCHA), das Checkout-Formular und das Kartenfeld dienen alle dazu, alles zu bremsen, was keine Person ist.

Am 15. April 2026 hörte dieser Filter auf, universell zu gelten. Cloudflare stellte eine Registrar-API als öffentliche Beta bereit, begleitet von einer Botschaft, die die Branchenberichterstattung unverblümt zusammenfasste: [Cloudflare „verschob diese Transaktion in die Agentenschicht“](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer) — jene Architekturebene, auf der Software statt einer Person, die ein Formular anklickt, den Kauf auslöst. Registrierung, DNS und einige weitere Aufgaben, die sich einer vollständigen Automatisierung widersetzt hatten, weil sie einen Menschen an der Tastatur voraussetzten, hörten stillschweigend auf, dies vorauszusetzen.

Dieser Beitrag behandelt genau diesen Wandel: Was sich technisch geändert hat, was ein [KI-Agent](/de/glossary/ai-agent/) tatsächlich tut, wenn er in Ihrem Auftrag eine Domain registriert, und — weil „kein Mensch erforderlich“ eine Aussage ist, der man mit Skepsis begegnen sollte — was weiterhin gelten muss, damit das sicher ist. Einen Überblick Plattform für Plattform darüber, wer das heute anbietet, finden Sie in [KI-agentische Domainplattformen: Der Leitfaden für 2026](/de/blog/ai-domain-platforms/) und [Cloudflare vs. Name.com vs. Namefi](/de/blog/cf-namecom-namefi/). Die zugrunde liegende Definition dafür, was einen Registrar überhaupt für einen Agenten nutzbar macht, behandelt [Was ist ein Agent-Native Domain Registrar?](/de/blog/agent-native/)

## Was sich technisch geändert hat

Die Domainbranche hat ihre Regeln im April 2026 nicht neu geschrieben. [Registrare](/de/glossary/registrar/) hatten bereits seit [Jahrzehnten](/de/glossary/epp/) programmierbare APIs; geändert hat sich, für wen diese APIs verständlich und zugänglich waren.

Ein herkömmlicher Registrar-Checkout ist darauf ausgelegt, dass eine Person die Seite liest, eine Karte eingibt und vor Abschluss des Kaufs beweist, dass sie kein Bot ist — drei Annahmen, die für einen Agenten jeweils eine Mauer darstellen. Ein CAPTCHA existiert gerade, um alles auszusperren, was kein Mensch ist; deshalb blockiert es einen legitimen Agenten, der auf Anweisung eines Menschen handelt, genauso zuverlässig wie Missbrauch. Ein MCP-Tutorial eines Drittanbieters, das auf Cloudflares Beta aufbaut, beschrieb das alte Modell treffend: [„Domain registrars are built for humans: CAPTCHAs, dashboards, forms, credit card fields. Not exactly agent-friendly.“](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26#:~:text=Domain%20registrars%20are%20built%20for%20humans%3A%20CAPTCHAs%2C%20dashboards%2C%20forms%2C%20credit%20card%20fields.%20Not%20exactly%20agent-friendly.)

Drei Dinge ersetzten dieses Modell; sie ergänzen sich, statt miteinander zu konkurrieren:

- **Authentifizierte REST-APIs**, sodass ein Kauf als HTTP-Aufruf statt über eine gerenderte Checkout-Seite abgeschlossen werden kann. Cloudflares Beta deckt Suche, Verfügbarkeit und Registrierung auf diese Weise ab; laut Berichterstattung zum Start wird die Registrierung für Standarddomains „synchronously within seconds“ abgeschlossen.
- **[MCP](https://modelcontextprotocol.io) (Model Context Protocol)**, ein offener Standard, den seine eigene Dokumentation als [„an open-source standard for connecting AI applications to external systems“](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems) beschreibt. Er macht den Unterschied zwischen einem Agenten mit maßgeschneidertem Integrationscode und einem Agenten aus, der die Werkzeuge eines Registrars (`search`, `register`, `set_dns_record`) entdecken und direkt in Claude, Cursor oder einem anderen kompatiblen Client aufrufen kann. Cloudflare band seine Registrar-API in diese Ebene ein, sodass nach eigener Darstellung „an agent working in Cursor, Claude Code, or any MCP-compatible environment can discover and call Registrar endpoints“ — ohne einen separaten Integrationsschritt.
- **[llms.txt](https://llmstxt.org)-Entdeckung**, eine Klartext-Konvention — [„a proposal to standardise on using an `/llms.txt` file to provide information to help LLMs use a website at inference time“](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time) —, die einem Agenten, der einen bestimmten Registrar noch nie gesehen hat, ermöglicht herauszufinden, was er tun kann, ohne dass ein Mensch zuerst API-Dokumentation in das Gespräch einfügen muss.

Keines dieser drei Elemente ist für sich genommen neu; MCP wurde Ende 2024 veröffentlicht, und llms.txt wurde im selben Jahr vorgeschlagen. Neu ist, dass ein großer Registrar alle drei hinter einem Live-Kauffluss bereitstellt — der Teil, der „KI-Agenten registrieren Domains“ von einer Demo für Hobbyisten zu einer Schlagzeile gemacht hat.

## Was der Agent tatsächlich tut

Lässt man das Marketing beiseite, besteht ein agentischer Domainkauf aus einer kurzen, mechanischen Abfolge — derselben, der ein Mensch auf einer Checkout-Seite folgen würde, nur als API-Aufrufe statt als Klicks. Dabei sind drei Parteien beteiligt: der Agent, die API des Registrars und die dahinterliegende [Registry](/de/glossary/registry/).

1. **Suchen.** Der Agent ruft den Suchendpunkt des Registrars (oder das entsprechende MCP-Werkzeug) mit einem Kandidatennamen oder einer Beschreibung des Bedarfs auf und erhält eine Liste verfügbarer und belegter Varianten.
2. **Verfügbarkeit und Preis prüfen.** Für einen konkreten Namen fragt der Agent die aktuelle Verfügbarkeit und den exakten Preis ab — Registrierungsgebühr, etwaiger Premium-Aufschlag und gegebenenfalls die Transaktionsgebühr der [ICANN](/de/glossary/icann/). Eine kuratierte [TLD](/de/glossary/tld/)-Liste ist hier wichtig: Mehrere agentenorientierte Betas, einschließlich der von Cloudflare, decken zum Start nur eine Auswahl beliebter TLDs statt eines vollständigen Katalogs ab.
3. **Authentifizieren und autorisieren.** Der Agent legt Zugangsdaten vor, die der Registrar programmgesteuert prüfen kann — einen API-Schlüssel, der an ein gedecktes Konto gebunden ist, oder eine Wallet-Signatur — statt einer gespeicherten Karte hinter einer Anmeldeseite.
4. **Registrieren.** Der Agent ruft den Registrierungsendpunkt auf. Der Registrar leitet die Anfrage über [EPP](/de/glossary/epp/), das [Extensible Provisioning Protocol](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol), mit dem Registrare seit dessen Status als Proposed Standard im Jahr 2004 mit Registries kommunizieren, an die [Registry](/de/glossary/registry/) der Domain weiter. Die Registry erstellt den Datensatz, und die API gibt eine Bestätigung zurück, typischerweise innerhalb von Sekunden.
5. **DNS konfigurieren.** Sobald der Name gesichert ist, setzt der Agent [Nameserver](/de/glossary/nameserver/) oder einzelne DNS-Einträge — einen A-Eintrag, der auf einen Server verweist, oder einen CNAME, der auf eine Hosting-Plattform verweist — oft direkt mit dem nächsten Aufruf in derselben Unterhaltung, in der die Domain registriert wurde.
6. **Dem Menschen zurückmelden.** In einem gut gestalteten Agentenablauf erfährt der Mensch nicht erst aus einem Kartenauszug nachträglich vom Kauf; der Agent meldet den Namen, den Preis und das Ziel, auf das er die Domain verwiesen hat, zurück.

Dieser sechste Schritt leistet mehr, als es zunächst scheint — darum geht es im nächsten Abschnitt.

## Leitplanken: „Kein Mensch erforderlich“ braucht dennoch eine von Menschen gesetzte Richtlinie

„Kein Mensch erforderlich“ beschreibt den Mechanismus, nicht die Governance. Die API benötigt keine Person, die mitten in der Transaktion einen Knopf drückt — aber jemand muss vorab festlegen, was der Agent mit der ihm gegebenen Befugnis tun darf. Die eigene Dokumentation von Cloudflare zur Beta benennt klar, wo diese Verantwortung liegt: [„it is the responsibility of the human to design an agent flow that will not buy domains without your approval.“](https://blog.cloudflare.com/registrar-api-beta/) Die API ermöglicht eine Registrierung ohne Checkout-Seite; sie trifft nicht selbst die Entscheidung, wann eine Domain registriert werden soll. Diese Richtlinie muss die Person schreiben, die den Agenten integriert.

Drei Leitplanken erledigen in der Praxis den Großteil der Arbeit:

- **Zahlungsautorisierung, die nicht nur aus einer nackten Kartennummer besteht.** Ein API-Schlüssel, der gegen ein im Voraus bezahltes oder in Rechnung gestelltes Guthaben abgerechnet wird, begrenzt die Gesamtexposition konstruktionsbedingt; der Agent kann nicht mehr ausgeben als gedeckt ist. Eine Wallet-signierte Transaktion wird für jeden Kauf autorisiert und kann nicht wiederverwendet werden. Beides hat ein deutlich anderes Risikoprofil als eine gespeicherte Kreditkarte, die keine eingebaute Obergrenze besitzt.
- **Ausgabenlimits und Bestätigungsschwellen**, die der Mensch setzt, bevor der Agent tätig wird. Cloudflares Empfehlung für einen „well-designed agent flow“ lautet, Domainname und Preis mit dem Nutzer zu bestätigen, bevor der Registrierungsendpunkt aufgerufen wird, nicht danach — ein Muster, das die API unterstützt, aber nicht erzwingt.
- **Ein klarer Träger der rechtlichen Verantwortung.** Ein Agent, der einen Namen registriert, beseitigt nicht die rechtliche Tatsache, dass eine Domain einen eingetragenen [Registrant](/de/glossary/registrant/) hat. Ein Beitrag über Domains im Besitz von Agenten formulierte das Risiko klar: [„If an agent registers a domain that turns out to be a trademark conflict, there's no human to respond to a UDRP complaint“](https://dev.to/purpleflea/how-ai-agents-can-buy-their-own-domain-names-and-why-this-matters-1l4j#:~:text=If%20an%20agent%20registers%20a%20domain%20that%20turns%20out%20to%20be%20a%20trademark%20conflict%2C%20there%27s%20no%20human%20to%20respond%20to%20a%20UDRP%20complaint), wenn niemand überwacht, was unter dessen Zugangsdaten registriert wird. Das Entfernen der Checkout-Seite beseitigt weder das [UDRP](/de/glossary/udrp/)-Verfahren, den Verlängerungstermin noch den [WHOIS](/de/glossary/whois/)-Datensatz; jemand muss diese Überwachung weiterhin bewusst einbauen.

Das sollte man sich vor Augen halten: Ein Agent, der eine Domain registrieren kann, kann auch Geld ausgeben und ein Portfolio von Namen aufbauen, ohne dass jemand jede Transaktion prüft — genau die Fähigkeit, die dies nützlich macht, und genau der Grund, warum die Richtlinienebene nicht optional ist.

## Wer bietet das heute an, und die Reseller-These

Cloudflares Beta ist der meistbeachtete Fall dieses Wandels, aber nicht der einzige. Name.com baute ab Mitte 2025 eine vergleichbare API nach demselben MCP-und-OpenAPI-Ansatz auf, und Namefi betreibt einen MCP-Server sowie einen Wallet-signierten Checkout, der die Kontoerstellung vollständig überspringt. Die Funktionsunterschiede — Preismodell, TLD-Abdeckung, ob die Zahlung ein bestehendes Konto braucht — finden Sie in [Cloudflare vs. Name.com vs. Namefi: Agent-Native Registrars](/de/blog/cf-namecom-namefi/); die gesamte Landschaft, einschließlich der Frage, wo große Consumer-Registrare vor dieser Kategorie haltmachen, behandelt [KI-agentische Domainplattformen: Der Leitfaden für 2026](/de/blog/ai-domain-platforms/).

Neuer als jede einzelne Plattform ist, was Agenten mit dieser Fähigkeit zu tun beginnen, sobald sie sie haben. Die Mitte-2026-Umfrage von CircleID zur Domainbranche formulierte es so: [„AI agents are increasingly acting as domain resellers checking availability, registering names, and configuring DNS without human intervention.“](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) Das Wort [Reseller](/de/glossary/reseller/) ist bewusst gewählt: Es bezeichnet eine etablierte Rolle, nämlich eine Partei, die Domains unter der Akkreditierung eines Registrars verkauft oder bereitstellt, statt selbst eine solche zu besitzen. Die Einordnung von Agenten als informelle Reseller statt als neue Kategorie besagt, dass der Ablauf wiedererkennbar ist, obwohl der Betreiber keine Person ist: suchen, bepreisen, registrieren, konfigurieren, im Auftrag anderer und in großem Umfang. Wie weit dieses Muster tatsächlich gegangen ist und was noch bloß angekündigt ist, verfolgen wir in [Der Stand des agentischen Domainmanagements, 2026](/de/blog/state-of-agentic/). Der [MCP-Server von Namefi](/de/blog/namefi-mcp/) ist ein konkretes Beispiel für die Werkzeuge, die ein Agent im Reseller-Stil aufrufen würde.

## Häufig gestellte Fragen

### Was genau hat sich am 15. April 2026 geändert?

Cloudflare stellte eine Registrar-API als öffentliche Beta bereit, die Domainsuche, Verfügbarkeits- und Preisprüfungen sowie die Registrierung abdeckt und in den Cloudflare-MCP-Server eingebunden ist, den Agenten bereits in Werkzeugen wie Cursor und Claude Code verwenden. Es war nicht die erste von Agenten aufrufbare Registrar-API — die von Name.com startete Mitte 2025, und die von Namefi lief bereits —, aber es war der meistbeachtete Fall, in dem ein großer, bekannter Registrar den gesamten Kauf durch einen Agenten statt nur durch einen Browser-Checkout abschließbar machte.

### Braucht ein KI-Agent meine Erlaubnis für jede Domain, die er registriert?

Nicht standardmäßig auf API-Ebene: Der Endpunkt schließt eine Registrierung ab, sobald er gültige, autorisierte Zugangsdaten und einen belastbaren Preis erhält. Ob es einen Bestätigungsschritt gibt, wird durch die Konfiguration des Agenten entschieden, nicht automatisch durch den Registrar erzwungen. Cloudflares eigene Anleitung sagt ausdrücklich, dass die Person, die den Agentenablauf baut, vor dem Kauf eine Genehmigung verlangen muss.

### Ist es wirklich sicher, einen KI-Agenten Domains kaufen zu lassen, ohne jede Transaktion zu überwachen?

Es ist nur so sicher wie die vorher gesetzten Leitplanken, nicht standardmäßig sicherer. Praktikable Muster sind ein vorausbezahltes oder in Rechnung gestelltes Guthaben, das die Gesamtexposition begrenzt, eine Wallet-Signatur, die genau einen Kauf autorisiert und nicht wiederverwendet werden kann, sowie ein Bestätigungsschritt oberhalb einer selbst gewählten Schwelle. Keine der Plattformen in diesem Bereich erzwingt für Sie ein universelles Ausgabenlimit; Sie setzen es selbst.

### Wer ist rechtlich verantwortlich, wenn ein KI-Agent eine Domain registriert?

Die Domain hat weiterhin einen eingetragenen [Registrant](/de/glossary/registrant/) — eine Person oder Organisation, nicht das KI-Modell selbst —, und dieser Registrant trägt das Risiko eines Markenstreits, einer [UDRP](/de/glossary/udrp/)-Beschwerde oder eines Verlängerungstermins. Das Entfernen des Menschen aus dem Kaufschritt entfernt ihn nicht aus dem Eigentumsdatensatz; es bedeutet nur, dass möglicherweise niemand diese Risiken beobachtet, wenn Sie diese Überwachung nicht einbauen.

### Werden KI-Agenten im formellen, akkreditierten Sinn zu Domain-Resellern?

Nicht im Sinn einer ICANN-Akkreditierung: Ein [Reseller](/de/glossary/reseller/) ist normalerweise ein Unternehmen, das unter dem Akkreditierungsvertrag eines Registrars tätig ist. Die Einordnung von CircleID verwendet „Reseller“ beschreibend für das Verhaltensmuster, nicht als rechtliche Bezeichnung. Ob sich dieses Verhalten zu einer formell anerkannten Kategorie verdichtet, ist eine der offenen Fragen in [Der Stand des agentischen Domainmanagements, 2026](/de/blog/state-of-agentic/).

### Funktioniert das für jede TLD oder nur für die beliebten?

Das hängt von der Plattform ab; prüfen Sie es direkt, statt eine vollständige Abdeckung anzunehmen. Cloudflares Beta startete mit einer kuratierten Auswahl beliebter TLDs, wie die eigenen Materialien sie nennen, und nicht mit dem vollständigen Katalog. Die Abdeckung nimmt mit der Reife einer Beta tendenziell zu. Prüfen Sie daher die aktuelle TLD-Unterstützung anhand der Live-Dokumentation einer Plattform, bevor Sie sich auf eine bestimmte Endung verlassen.

## Die nächste Domain mit Ihrem eigenen Agenten registrieren — ohne Checkout-Seite

[Namefi](https://namefi.io) bietet denselben agentenorientierten Kaufpfad, den dieser Artikel beschreibt: einen MCP-Server, mit dem sich Ihr Agent direkt verbindet, eine dokumentierte REST-API und einen Wallet-signierten Checkout, der die Kontoerstellung vollständig überspringt — plus [tokenisiertes](/de/glossary/tokenized-domain/) Eigentum, wenn die Domain selbst ein Vermögenswert sein soll, den das Wallet Ihres Agenten halten kann. Legen Sie Ihre Ausgabenrichtlinie einmal fest und lassen Sie den Agenten Suche, Preis und Registrierung so übernehmen, wie es dieser Beitrag beschreibt.

**[Bei Namefi eine Domain suchen und registrieren](https://namefi.io).**

## Quellen und weiterführende Lektüre

- Cloudflare Blog — [Ankündigung der Registrar-API-Beta](https://blog.cloudflare.com/registrar-api-beta/) (Startdatum, unterstützte Vorgänge, At-Cost-Preise, MCP-Integration, Hinweise zur menschlichen Genehmigung)
- webhosting.today — [KI-Agenten können jetzt Domains registrieren, kein Mensch erforderlich](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer) (Einordnung der Cloudflare-Beta als Wechsel in die „Agentenschicht“, April 2026)
- dev.to — [Eine Domain mit Ihrem KI-Agenten registrieren, kein Mensch nötig](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26#:~:text=Domain%20registrars%20are%20built%20for%20humans%3A%20CAPTCHAs%2C%20dashboards%2C%20forms%2C%20credit%20card%20fields.%20Not%20exactly%20agent-friendly.) (MCP-Tutorial eines Drittanbieters zum alten Checkout-Modell und zur von Agenten aufrufbaren Registrierung)
- dev.to — [Wie KI-Agenten ihre eigenen Domainnamen kaufen können und warum das wichtig ist](https://dev.to/purpleflea/how-ai-agents-can-buy-their-own-domain-names-and-why-this-matters-1l4j#:~:text=If%20an%20agent%20registers%20a%20domain%20that%20turns%20out%20to%20be%20a%20trademark%20conflict%2C%20there%27s%20no%20human%20to%20respond%20to%20a%20UDRP%20complaint) (Beitrag über Domains im Besitz von Agenten und die Lücke bei der rechtlichen Verantwortung)
- CircleID — [Das Domainuniversum 2026: KI, Sicherheit, Marktreife und die neue gTLD-Grenze](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) (Analyse von Agenten als Resellern, April 2026)
- modelcontextprotocol.io — [Was ist das Model Context Protocol (MCP)?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems) (Protokollüberblick)
- llmstxt.org — [Der Vorschlag für die Datei /llms.txt](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time) (Spezifikation und Begründung)
- Wikipedia — [Extensible Provisioning Protocol (Proposed Standard, März 2004)](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (Referenz für den MCP-Server, die REST-API und den Wallet-Checkout von Namefi)
