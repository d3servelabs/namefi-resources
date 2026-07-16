---
title: "Vibe Coding braucht eine Domain: Registrieren, ohne den Flow zu verlassen"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'domains', 'guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
format: opinion
ogImage: ../../assets/vibe-coding-domain-og.jpg
description: "Vibe-Coding-Apps werden auf Subdomains von Plattformen bereitgestellt. Wie derselbe Agent, der Ihre App gebaut hat, sie benennen und die Domain registrieren kann, ohne den Flow zu unterbrechen."
keywords: ["vibe coding domain", "vibe coding eigene domain", "domain aus cursor registrieren", "ki hat meine app gebaut jetzt brauche ich eine domain", "eigene domain für ki-generierte app", "vibe-coded app domainname", "plattform-subdomain", "domainregistrierung ohne editor zu verlassen", "coding-agent domainregistrierung", "namefi mcp vibe coding", "ki-agent registriert domain", "domainregistrierung im kontext", "eigene domain ki-app bereitstellen", "verfügbarkeitsbewusstes domain-brainstorming"]
relatedArticles:
  - /de/blog/mcp-quickstart/
  - /de/blog/ai-agent-register/
  - /de/blog/claude-mcp-domains/
  - /de/blog/nl-domain-purchase/
  - /de/blog/best-ai-tools-2026/
relatedTopics:
  - /de/topics/domain-tokenization/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/tokenize-your-com/
  - /de/series/blockchain-concepts/
relatedGlossary:
  - /de/glossary/subdomain/
  - /de/glossary/nameserver/
  - /de/glossary/dns/
  - /de/glossary/tld/
  - /de/glossary/registrar/
---

Sie haben einen Prompt eingegeben, zugesehen, wie sich der Dateibaum füllt, und dreißig Sekunden später erschien eine Live-URL im Chat. Das ist der ganze Reiz von Vibe Coding: Die Lücke zwischen „Ich habe eine Idee“ und „da ist etwas Funktionierendes im Internet“ ist auf ungefähr die Dauer einer Kaffeepause geschrumpft. Nur endet die URL, die Sie ansehen, auf etwas wie `my-app-a3f9.vercel.app` oder `my-app.lovable.app` — einer Plattform-Subdomain, nicht einem Namen für Ihre Visitenkarte. Von dort zu einer Domain zu gelangen, die Ihnen tatsächlich gehört, ist der Punkt, an dem der Flow gewöhnlich bricht. Er muss es nicht.

## Was „Vibe Coding“ tatsächlich bedeutet

Falls Ihnen der Begriff noch nicht geläufig ist: [Wikipedia definiert Vibe Coding](https://en.wikipedia.org/wiki/Vibe_coding) als „eine durch künstliche Intelligenz (KI) unterstützte Praxis der Softwareentwicklung, bei der ein Entwickler ein Projekt oder eine Aufgabe in einem Prompt an ein großes Sprachmodell (LLM) beschreibt, das automatisch Quellcode erzeugt.“ Das definierende Merkmal ist nicht nur, dass KI den Code schreibt — viele ältere Tools taten das bereits mit Autovervollständigung —, sondern dass Sie das Ergebnis häufig annehmen und durch Beschreiben der nächsten Änderung in natürlicher Sprache iterieren, statt jede vom Modell erzeugte Zeile zu lesen. Der frühere Tesla-AI-Leiter und OpenAI-Mitgründer Andrej Karpathy prägte den Begriff im Februar 2025; er verbreitete sich schnell genug, dass Merriam-Webster ihn innerhalb eines Monats als Trend-Slang markierte und das Collins English Dictionary ihn später zum Wort des Jahres kürte.

Das ist keine Kritik an der Praxis. Zu beschreiben, was Sie wollen, und eine laufende App zurückzubekommen, ist eine wirklich neue Art zu bauen. Die Tools darum herum — Cursor, Lovable, Replit, bolt.new, v0, Claude Code — sind gut genug geworden, dass ein funktionierender Prototyp nicht mehr der schwierige Teil ist. Schwierig ist, oder zumindest weiterhin wie 2015 aussieht, alles nach „es funktioniert“: ihm einen Namen zu geben und ihm eine echte Adresse zuzuweisen.

## Die letzte Meile: von der Plattform-Subdomain zur eigenen Domain

All diese Plattformen lösen dasselbe Problem auf dieselbe Weise: erst bereitstellen, auf einer [Subdomain](/de/glossary/subdomain/) der eigenen Plattform-Domain veröffentlichen und die eigene Domain als späteren, optionalen Schritt in einem Einstellungsbereich konfigurieren. Das ist der richtige Standard — Sie sollten keine Domain besitzen müssen, bevor Sie sehen können, ob Ihre Idee überhaupt funktioniert —, doch es macht die Plattform-Subdomain zu einem Zwischenstopp, nicht zum Ziel. Sie lässt sich langsamer aussprechen, bleibt nicht im Gedächtnis und signalisiert jedem Blick auf die Adressleiste: „Ich nutze noch die kostenlose Stufe eines fremden Tools.“

Die echte Domain zu registrieren ist absolut gesehen eine kleine Aufgabe — eine Namenssuche, ein Kauf, ein paar DNS-Einträge —, aber es ist der eine Schritt in der gesamten Vibe-Coding-Schleife, der traditionell an einem völlig anderen Ort geschieht.

## Warum das Verlassen des Editors den Flow unterbricht

Hier liegt die eigentliche Reibung, und nicht darin, dass eine Domainregistrierung schwierig wäre. Sondern darin, dass sie *woanders* stattfindet. Um eine Domain auf herkömmliche Weise zu registrieren, unterbrechen Sie das Gespräch mit Ihrem Coding-Agenten, öffnen einen Browser-Tab, landen auf der Startseite eines [Registrars](/de/glossary/registrar/), suchen einen Namen, bekommen drei Upsells für Datenschutz, E-Mail-Hosting und einen Website-Builder gezeigt, den Sie nicht brauchen, müssen herausfinden, welches Kontrollkästchen abzuwählen ist, bezahlen und dann — diesen Teil lassen allgemeine Domainleitfäden aus — bestimmen, welchen [DNS](/de/glossary/dns/)-Eintrag Ihre konkrete Hosting-Plattform benötigt, den Wert in einem anderen Dashboard suchen und ihn in einen dritten Tab einfügen.

Das ist keine Aufgabe, sondern fünf, verteilt auf drei verschiedene Produkte, von denen keines weiß, was Sie gerade gebaut haben oder auf welcher Plattform Sie es bereitgestellt haben. Jeder Kontextwechsel kostet wirklich etwas: Sie verlieren den Faden Ihrer Arbeit, und es besteht eine reale Chance, dass Sie eine Stunde später zurückkommen, weil Sie in einem der anderen Tabs abgelenkt wurden. Für eine Fünf-Minuten-Aufgabe ist das viel Overhead.

## Registrieren, ohne den Chat zu verlassen

Die Lösung besteht darin, die Domain genauso zu behandeln wie das Deployment: als weiteren Tool-Aufruf im selben Gespräch, nicht als separaten Botengang. Der Agent, der Ihre App aufgebaut und das Deployment gepusht hat, kennt bereits den Kontext — den Namen der App und die Plattform, auf der sie läuft — und ist deshalb das richtige Tool, um auch einen Namen zu prüfen, ihn zu registrieren und DNS zu verbinden.

Auf das Wesentliche verdichtet, besteht der Ablauf aus drei Schritten:

1. **Bitten Sie den Agenten, den Namen zu prüfen.** „Ist `myapp.com` verfügbar?“ ist ein schreibgeschützter Aufruf und funktioniert deshalb sogar, bevor Sie etwas mit Schreibzugriff verbunden haben.
2. **Bestätigen und registrieren.** „Registriere sie für ein Jahr“ übermittelt die Bestellung; der Agent überwacht sie, bis sie abgeschlossen ist.
3. **Auf Ihr Deployment zeigen lassen.** Geben Sie dem Agenten den Eintrag, den Ihre Hosting-Plattform verlangt (einen A-Eintrag für eine Apex-Domain, einen CNAME für eine Subdomain), und er schreibt ihn — oder er richtet die Delegierung auf [Nameserver](/de/glossary/nameserver/)-Ebene der Domain neu aus, wenn Sie DNS vollständig Ihrem Hoster überlassen.

Das ist die Form des Ablaufs. Die exakte Mechanik — welche Konfigurationsdatei jeder Editor liest, die genauen DNS-Werte, die Vercel und Cloudflare Pages verlangen — ist bereits Schritt für Schritt im [Namefi MCP Quickstart: Claude Code, Cursor & Windsurf](/de/blog/mcp-quickstart/) beschrieben; dieser Beitrag wiederholt sie daher nicht. Wenn Sie in einem anderen als diesen drei Editoren programmieren — OpenAI Codex, Gemini CLI, Claude Desktop oder etwas anderem, das [MCP](https://modelcontextprotocol.io) spricht —, ist [Eine Domain mit Ihrem KI-Agenten bei Namefi registrieren](/de/blog/ai-agent-register/) der Knotenpunkt mit geprüfter Einrichtung für jeden davon sowie einem reinen REST-Weg für alles, was überhaupt nicht MCP-nativ ist.

## Lassen Sie den Agenten auch Namen brainstormen

Der Benennungsschritt verdient eine eigene Erwähnung, weil er gewöhnlich ebenso sehr die Schleife unterbricht wie der Checkout. Die traditionelle Version: Einen Namen ausdenken, zu einem Registrar wechseln, entdecken, dass er vergeben ist, einen anderen ausdenken, zurückwechseln, wiederholen, bis etwas hängen bleibt oder Sie aufgeben und eine Zahl ans Ende setzen.

Die API von Namefi stellt eine Massenverfügbarkeitsprüfung bereit. Dieselbe Referenz unter [namefi.io/llms.txt](https://namefi.io/llms.txt#:~:text=or%20screen%20many%20names%20at%20once), die jeder Agent liest, beschreibt sie als Möglichkeit, „viele Namen gleichzeitig zu prüfen“. Anstatt Kandidaten nacheinander zu testen, können Sie Ihrem Agenten eine ganze Vorauswahl geben und in einem einzigen Roundtrip zurückerhalten, welche wirklich frei sind. In der Praxis wird die Namensfindung zu einem Prompt: „Die App ist ein Habit-Tracker namens Streaky — prüfe `streaky.com`, `streaky.app`, `getstreaky.com` und `streaky.io` und sage mir, was verfügbar ist.“ Der Agent führt den Batch aus, berichtet zurück, und Sie wählen aus Namen, die Sie tatsächlich haben können, statt sich in einen Namen zu verlieben, der schon registriert ist.

## Ein ausgearbeitetes Beispiel: vom Prompt zur Live-URL

Nehmen wir an, Sie haben einen Nachmittag lang per Vibe Coding ein kleines Tool gebaut — eine gemeinsame Einkaufslisten-App, weil Sie die bestehenden störten. Es ist auf einer Plattform-Subdomain live, es funktioniert, und ein paar Freunde wollen den Link. Hier ist der ganze Rest der Sitzung im selben Chatfenster:

Sie fragen, ob `cartly.app` frei ist. Sie ist es. Sie sagen: „Registriere sie für ein Jahr und richte sie auf das Deployment, das wir gerade erstellt haben.“ Der Agent übermittelt die Registrierung, fragt ab, bis sie fertig ist, und fragt dann Ihre Hosting-Plattform (durch einen Blick in ihr Dashboard), welchen DNS-Eintrag sie für die gerade gekaufte Domain benötigt — in diesem Fall einen A-Eintrag, weil Sie eine Apex-Domain statt einer `www`-Subdomain verwenden. Sie fügen den Wert zurück ein, der Agent schreibt den Eintrag, und wenige Minuten später — DNS braucht etwas Zeit zur Propagation — löst `cartly.app` auf genau die App auf, die Ihre Freunde bereits in einem anderen Tab geöffnet haben. Gesamte Zeit außerhalb des Editors: null. Insgesamt geöffnete Tabs, die nicht ohnehin zum Bau der App gehörten: null.

## Häufig gestellte Fragen

### Muss ich DNS kennen, um das zu tun?

Nicht mehr, als Sie wissen müssen, wie ein Datenbankindex funktioniert, um einen zu verwenden. Ihr Agent fragt die Hosting-Plattform, welchen Eintrag sie benötigt, und schreibt ihn; Sie bestätigen überwiegend Werte, statt sie selbst von Hand zusammenzusetzen.

### Funktioniert das mit jeder Vibe-Coding-Plattform oder nur mit bestimmten?

Die Registrierungs- und DNS-Seite ist plattformunabhängig — es sind eine Domain und ein DNS-Eintrag, die unabhängig davon gleich funktionieren, wodurch Ihre App gebaut wurde. Unterschiede gibt es beim Eintragstyp, den Ihre Hosting-Plattform verlangt; der [Namefi MCP Quickstart](/de/blog/mcp-quickstart/) behandelt das speziell für Vercel und Cloudflare Pages.

### Wird die Domain, die ich so registriere, tokenisiert?

Ja, standardmäßig. Namefi ist ein von ICANN akkreditierter Registrar und registriert die Domain zusätzlich zur Standardregistrierung auf Base als NFT für die an Ihren API-Schlüssel gebundene Wallet. Sie erhalten eine normale funktionierende Domain und einen On-Chain-Eigentumsnachweis, nicht das eine statt des anderen.

### Was ist, wenn der exakte Name, den ich möchte, schon vergeben ist?

Dafür ist die obige Massenverfügbarkeitsprüfung da: Geben Sie Ihrem Agenten mehrere Kandidaten ([TLD](/de/glossary/tld/)-Varianten, Präfixe, Synonyme), statt sie einzeln zu testen, und lassen Sie ihn berichten, was wirklich frei ist.

### Brauche ich ein Namefi-Konto, bevor ich das ausprobiere?

Nein. Die Verfügbarkeitsprüfung ist schreibgeschützt und benötigt keine Authentifizierung. Sie können die Verbindung also einrichten und einen Namen testen, bevor Sie einen API-Schlüssel erzeugen oder irgendetwas aufladen.

## Den Namen mit dem Flow ausliefern, in dem Sie schon arbeiten

Die Domain ist kein separates Projekt — sie ist dieselbe Art Infrastrukturentscheidung wie die Wahl einer Hosting-Plattform. Es gibt keinen guten Grund, warum sie der eine Teil beim Bereitstellen einer App sein sollte, der weiterhin einen Browser-Tab und ein Checkout-Formular verlangt. Wenn ein Agent Ihnen das nächste Mal eine funktionierende App auf einer Plattform-Subdomain zurückgibt, bleiben Sie im Gespräch und bitten ihn, einen Namen zu prüfen.

**[Einen Namefi-API-Schlüssel erzeugen](https://namefi.io/api-key)** und es mit dem ausprobieren, was Sie gerade bauen, oder mit der vollständigen Anleitung im [Namefi MCP Quickstart: Claude Code, Cursor & Windsurf](/de/blog/mcp-quickstart/) beginnen.

## Quellen und weiterführende Lektüre

- Wikipedia — [Vibe Coding](https://en.wikipedia.org/wiki/Vibe_coding) (Definition, Prägung durch Andrej Karpathy im Februar 2025, zeitlicher Verlauf der Verbreitung)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt#:~:text=or%20screen%20many%20names%20at%20once) (Endpunkt für Massenverfügbarkeit, MCP-Server-URL, Referenz für Registrierung und DNS)
- Namefi — [Namefi MCP Quickstart: Claude Code, Cursor & Windsurf](/de/blog/mcp-quickstart/) (Konfiguration je Editor, der vollständige Ablauf in fünf Schritten, DNS-Schritte für Vercel und Cloudflare Pages)
- Namefi — [Eine Domain mit Ihrem KI-Agenten bei Namefi registrieren](/de/blog/ai-agent-register/) (Einrichtung für Codex, Gemini CLI, Claude Desktop und den direkten REST-Weg)
- Model Context Protocol — [modelcontextprotocol.io](https://modelcontextprotocol.io) (Überblick über das Protokoll)
