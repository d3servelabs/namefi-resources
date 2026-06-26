---
title: 'Sea Turtle: Die staatlich geförderte Kampagne, die DNS kaperte, um Regierungen auszuspionieren'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Wie „Sea Turtle", eine 2019 von Cisco Talos aufgedeckte staatlich geförderte Kampagne, DNS durch die Kompromittierung von Registraren, Registries und DNS-Anbietern kaperte – Regierungen, Ministerien und Energieunternehmen auf Angreifer-Server umleitete, gültige Zertifikate fälschte und sogar eine nationale TLD-Registry kompromittierte.'
keywords: ['sea turtle dns-hijacking', 'cisco talos sea turtle', 'dns-hijacking-angriff', 'staatlich geförderter dns-angriff', 'registry-kompromittierung', 'registrar-kompromittierung', 'dns-spionagekampagne', 'lets encrypt mitm-zertifikat', 'netnod kompromittierung', 'ics-forth griechenland ccTLD', 'cisa-notfalldirektive 19-01', 'dns-sicherheit', 'domain-eigentümerschaft sicherheit', 'nationalstaatlicher cyberangriff']
relatedArticles:
  - /de/blog/the-dnspionage-campaign/
  - /de/blog/the-fox-it-dns-hijack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-myetherwallet-bgp-dns-attack/
  - /de/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/name-change-game-change/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/registrar/
  - /de/glossary/tld/
  - /de/glossary/icann/
  - /de/glossary/registry/
---

Die meisten Cyberangriffe versuchen, in ein Ziel *einzubrechen*. Die Sea-Turtle-Kampagne tat etwas Stilleres und weitaus Gefährlicheres: Sie brach in die **Karte** ein, die dem gesamten Internet mitteilt, wo das Ziel zu finden ist.

Wenn Sie die Webadresse eines Regierungsministeriums eingeben oder eine E-Mail an dessen Beamte senden, fragt Ihr Computer zunächst das [Domain Name System](/de/glossary/dns/) – DNS – ab, um diesen menschenlesbaren Namen in die numerische Adresse des richtigen Servers zu übersetzen. Diese Abfrage ist so grundlegend, dass fast nichts im Internet sie verifiziert. Wir vertrauen schlicht darauf, dass der Name zu dem Ort aufgelöst wird, dem er entsprechen soll. Die Betreiber von Sea Turtle verstanden dieses Vertrauen in Gänze – und verbrachten mehr als zwei Jahre damit, es zu missbrauchen, um Regierungen im Nahen Osten und Nordafrika auszuspionieren.

Im April 2019 von Cisco Talos aufgedeckt, ist Sea Turtle eine der klarsten Fallstudien, die wir über den Einsatz von DNS selbst als Instrument staatlicher Spionage besitzen. Die Angreifer phishten keine einzelnen Mitarbeiter in der Hoffnung auf Erfolg. Sie griffen die Registrare, Registries und DNS-Anbieter an, die *über* ihren Zielen stehen – die Institutionen, die kontrollieren, wie Namen aufgelöst werden – und von dieser vorteilhaften Position aus leiteten sie den Datenverkehr ganzer Organisationen um, ernteten Zugangsdaten und fälschten die kryptographischen Zertifikate, die eine Imitation eigentlich unmöglich machen sollten.

## DNS als Ziel staatlicher Spionage

DNS wird manchmal als Telefonbuch des Internets bezeichnet, aber das unterschätzt seine Bedeutung. Es kommt eher dem postalischen Routingsystem gleich: Jede E-Mail, jede Anmeldung, jeder API-Aufruf beginnt mit der Auflösung eines Namens. Wer die Auflösung kontrolliert, kontrolliert das Ziel – und kann unsichtbar in der Mitte von Gesprächen sitzen, die beide Seiten für privat und direkt halten.

Das macht DNS zu einem nahezu perfekten Spionageziel. Die Kompromittierung eines einzigen DNS-Anbieters kann den Datenverkehr jeder Organisation offenlegen, die davon abhängig ist. Und anders als Schadsoftware auf einem Endgerät lässt DNS-Manipulation die Rechner des Opfers unberührt: Es gibt nichts zu scannen, nichts unter Quarantäne zu stellen. Die Einträge zeigen einfach auf etwas Neues.

Talos war offen über den Mechanismus. Wie ihr Bericht es formulierte: [DNS-Hijacking tritt auf, wenn der Angreifer DNS-Namenseinträge unberechtigt so ändern kann, dass Nutzer auf vom Angreifer kontrollierte Server geleitet werden](https://blog.talosintelligence.com/seaturtle/#:~:text=DNS%20hijacking%20occurs%20when%20the%20actor%20can%20illicitly%20modify%20DNS%20name%20records%20to%20point%20users%20to%20actor%2Dcontrolled%20servers). Einfach zu beschreiben; verheerende Konsequenzen in der Praxis.

## Die Sea-Turtle-Kampagne (2017–2019)

![Lebendige, farbenfrohe Konzeptgrafik eines schattenhaften staatlichen Akteurs, der als Schildkröte silhouettiert ist und leise leuchtende Pfeile über eine stilisierte Landkarte einer Region auf versteckte Server umleitet, Neon-Netzwerkleitungen, die sich biegen](../../assets/the-sea-turtle-dns-espionage-01-campaign.jpg)

Sea Turtle war kein schneller Einbruch. Talos bewertete, dass [die laufende Operation wahrscheinlich bereits im Januar 2017 begann und bis zum ersten Quartal 2019 fortdauerte](https://blog.talosintelligence.com/seaturtle/#:~:text=The%20ongoing%20operation%20likely%20began%20as%20early%20as%20January%202017%20and%20has%20continued%20through%20the%20first%20quarter%20of%202019) – mehr als zwei Jahre geduldige, beharrliche Operationen.

In diesem Zeitraum wurden nach Talos' Zählung [mindestens 40 verschiedene Organisationen in 13 verschiedenen Ländern im Rahmen dieser Kampagne kompromittiert](https://blog.talosintelligence.com/seaturtle/#:~:text=at%20least%2040%20different%20organizations%20across%2013%20different%20countries%20were%20compromised%20during%20this%20campaign). TechCrunch fasste die Reichweite zusammen: Die Gruppe hatte [40 Regierungs- und Geheimdienstbehörden, Telekommunikationsunternehmen und Internetgiganten in 13 Ländern mehr als zwei Jahre lang ins Visier genommen](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/), mit Opfern in Ländern wie [Armenien sowie Ägypten, der Türkei, Schweden, Jordanien und den Vereinigten Arabischen Emiraten](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/).

Talos lehnte es ab, die Kampagne öffentlich einer bestimmten Regierung zuzuschreiben, war jedoch vom Kaliber des Betreibers überzeugt. Wie Craig Williams von Cisco Talos TechCrunch mitteilte, handelt es sich [um eine neue Gruppe, die auf eine relativ einzigartige Weise operiert, die wir zuvor noch nicht gesehen haben, mit neuen Taktiken, Techniken und Vorgehensweisen](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/), und das Team bewertete die [primären Motivationen der Gruppe als Spionage](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/).

## Wer das Ziel war und was auf dem Spiel stand

Die Opferliste liest sich wie eine Wunschliste für geheimdienstliche Erkenntnisgewinnung. Talos identifizierte die primären Ziele als [nationale Sicherheitsorganisationen, Außenministerien und bedeutende Energieorganisationen](https://blog.talosintelligence.com/seaturtle/#:~:text=national%20security%20organizations%2C%20ministries%20of%20foreign%20affairs%2C%20and%20prominent%20energy%20organizations) – genau die Institutionen, deren interne Kommunikation ein feindlicher Staat am liebsten lesen würde.

Eine zweite Gruppe von Opfern war in gewissem Sinne sogar noch aufschlussreicher. Talos stellte fest, dass die Angreifer auch [zahlreiche DNS-Registrare, Telekommunikationsunternehmen und Internetdienstanbieter](https://blog.talosintelligence.com/seaturtle/#:~:text=numerous%20DNS%20registrars%2C%20telecommunication%20companies%2C%20and%20internet%20service%20providers) angriffen. Diese waren nicht das eigentliche Ziel; sie waren das *Mittel*. Durch die Übernahme der Infrastrukturanbieter erlangten die Angreifer den Hebel, um DNS für die eigentlichen Ziele weiter unten in der Kette zu manipulieren.

BleepingComputers Zusammenfassung traf den Kern: Die Hauptziele waren [Außenministerien, Militärorganisationen, Geheimdienste, Energieunternehmen](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/). Wenn man die E-Mail- und Anmeldedaten eines Außenministeriums still abfangen kann, muss man keine Verschlüsselung knacken – man kann einfach die Zugangsdaten abschöpfen und die E-Mails im Klartext lesen.

## So geschah es: Die Vertrauenskette wird gekapert

![Lebendige, farbenfrohe Konzeptgrafik einer Man-in-the-Middle-Figur, die einen Strom leuchtender Regierungsumschläge abfängt und jeden mit einem gefälschten grünen Siegel stempelt, bevor sie weitergegeben werden; zwei Schlösser stehen sich über einer gebrochenen Pipeline gegenüber](../../assets/the-sea-turtle-dns-espionage-02-registry-compromise.jpg)

Hier liegt das, was Sea Turtle ungewöhnlich ausgefeilt machte: Die Angreifer gingen selten direkt auf ihre Opfer los. Stattdessen erklommen sie die Vertrauenskette.

Das Muster, wie es von Talos rekonstruiert und durch unabhängige Berichte bestätigt wurde, verlief ungefähr wie folgt: Zunächst wurde bei einem DNS-Anbieter, Registrar oder einer [Registry](/de/glossary/registry/) Fuß gefasst – typischerweise durch Spear-Phishing oder die Ausnutzung einer bekannten Schwachstelle. Mit diesem Zugang wurden [DNS-Einträge so geändert, dass legitime Nutzer des Ziels auf vom Angreifer kontrollierte Server geleitet wurden](https://blog.talosintelligence.com/seaturtle/#:~:text=Modified%20DNS%20records%20to%20point%20legitimate%20users%20of%20the%20target%20to%20actor%2Dcontrolled%20servers). Diese Server wurden als Man-in-the-Middle-Schicht eingerichtet: Laut BleepingComputer [richteten Sea-Turtle-Betreiber ein Man-in-the-Middle (MitM)-Framework ein, das legitime Dienste des Opfers imitierte, um Anmeldedaten zu stehlen](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/). Opfer meldeten sich an dem an, was wie ihr normales Mail- oder VPN-Portal aussah, und die Angreifer [erfassten legitime Nutzerdaten, wenn Nutzer mit diesen vom Angreifer kontrollierten Servern interagierten](https://blog.talosintelligence.com/seaturtle/#:~:text=Captured%20legitimate%20user%20credentials%20when%20users%20interacted%20with%20these%20actor%2Dcontrolled%20servers), und leiteten sie dann still an den echten Dienst weiter, sodass nichts ungewöhnlich wirkte.

Das clevere – und beunruhigendste – Element war, wie sie das Schloss aushebelte. Den Datenverkehr umzuleiten ist eine Sache; dies zu tun, ohne eine Browser-Zertifikatswarnung auszulösen, ist eine andere. Sea Turtle löste dieses Problem, indem es echte, gültige Zertifikate für die Domains erlangte, die es imitierte. Talos stellte fest, dass die Angreifer [ein von einer Zertifizierungsstelle signiertes X.509-Zertifikat von einem anderen Anbieter für dieselbe Domain erhielten](https://blog.talosintelligence.com/seaturtle/#:~:text=obtained%20a%20certificate%20authority%2Dsigned%20X.509%20certificate), und wies darauf hin, dass [diese Akteure Let's Encrypt, Comodo, Sectigo und selbstsignierte Zertifikate auf ihren MitM-Servern verwenden](https://blog.talosintelligence.com/seaturtle/#:~:text=use%20Let%27s%20Encrypts%2C%20Comodo%2C%20Sectigo%2C%20and%20self%2Dsigned%20certificates). Da sie die DNS-Einträge kontrollierten, konnten sie die automatisierten Domain-Validierungsprüfungen bestehen, auf die kostenlose Zertifizierungsstellen angewiesen sind – und mit einem legitimen grünen Schloss für eine Domain davon gehen, die ihnen nicht gehörte.

Brian Krebs, der die eng verwandte frühere Angriffswelle dokumentierte, beschrieb dieselbe Vorgehensweise: Die Angreifer [scheinen die DNS-Einträge dieser Domains so geändert zu haben, dass die Domains auf von ihnen kontrollierte Server in Europa zeigten](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/), und [waren dann in der Lage, SSL-Zertifikate für diese Domains von den SSL-Anbietern Comodo und/oder Let's Encrypt zu erhalten](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/). Eines der genannten Opfer war [mail.gov.ae, das E-Mails für Regierungsbüros der Vereinigten Arabischen Emirate abwickelt](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/).

### Die Registry-Kompromittierungen

Der Höhepunkt der Kampagne war die Kompromittierung von Organisationen, die DNS nicht nur *nutzen*, sondern es für ganze Länder *betreiben*.

Der erste öffentlich bestätigte Fall betraf Schwedens Netnod. Wie Krebs berichtete, [verschafften sich die Angreifer Zugang zu Konten beim Domain-Registrar von Netnod](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/), und Netnod selbst erklärte, es [erfuhr am 2. Januar von seiner Rolle bei dem Angriff](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/). Entscheidend ist, dass Netnod nicht das eigentliche Ziel war – es war ein Durchgang. BleepingComputer vermerkte, dass Netnod sagte, [sie seien nicht das Ziel der Angriffe gewesen, sondern eine Route für den Angreifer zur „Erfassung von Anmeldedaten für Internetdienste"](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/).

Talos beschrieb die breitere Bedeutung in deutlichen Worten: Die Betreiber waren [verantwortlich für den ersten öffentlich bestätigten Fall gegen eine Organisation, die eine Root-Server-Zone verwaltet](https://blog.talosintelligence.com/seaturtle/#:~:text=responsible%20for%20the%20first%20publicly%20confirmed%20case%20against%20an%20organizations%20that%20manages%20a%20root%20server%20zone). Wenn die Menschen, die einen Teil des zentralen Adressbuchs des Internets betreiben, still imitiert werden können, hält die Annahme nicht mehr stand, dass DNS von Natur aus vertrauenswürdig ist.

## Reaktion und Nachspiel: Sie hörten nicht auf

[DNS-Hijacking](/de/glossary/dns-hijacking/) in diesem Ausmaß löste eine offizielle Reaktion aus. Im Januar 2019 erließ die US-amerikanische Cybersecurity and Infrastructure Security Agency die [Notfalldirektive 19-01, „Mitigate DNS Infrastructure Tampering"](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) – die erste Notfalldirektive, die CISA je herausgegeben hatte – und wies Bundesbehörden an, ihre DNS-Einträge zu überprüfen, Zugangsdaten für DNS-Verwaltungskonten zu ändern und die Multi-Faktor-Authentifizierung für diese Konten zu aktivieren. Es war ein stillschweigendes Eingeständnis, dass die DNS-Verwaltung zur vordersten Front der nationalen Sicherheit geworden war.

Am auffälligsten an Sea Turtle ist jedoch, was *danach* geschah, als es aufgedeckt wurde. Die meisten Kampagnen werden still, sobald ein Anbieter wie Talos ihre Vorgehensweise veröffentlicht. Sea Turtle tat das Gegenteil.

In einem Folgeartikel vom Juli 2019 berichtete Talos, dass die Gruppe neue Opfer gefunden hatte, darunter [eine Country-Code-Top-Level-Domain (ccTLD)-Registry, die die DNS-Einträge für jede Domain verwaltet, die diesen bestimmten Ländercode verwendet](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=a%20country%20code%20top%2Dlevel%20domain%20%28ccTLD%29%20registry). Konkret wurde [das Institut für Informatik der Stiftung für Forschung und Technologie – Hellas (ICS-Forth), die ccTLD für Griechenland](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=The%20Institute%20of%20Computer%20Science%20of%20the%20Foundation%20for%20Research%20and%20Technology%20%2D%20Hellas%20%28ICS%2DForth%29%2C%20the%20ccTLD%20for%20Greece) – die Stelle, die den `.gr`-Namespace betreibt – kompromittiert. SecurityWeek bemerkte, dass selbst nachdem ICS-Forth den Einbruch öffentlich anerkannt hatte, [Cisco-Telemetrie bestätigte, dass die Kompromittierung noch mindestens fünf weitere Tage anhielt](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/).

Die Einschätzung von Talos zur Gruppe war ungewöhnlich direkt: [Diese Gruppe erscheint ungewöhnlich dreist und wird sich wahrscheinlich in Zukunft nicht abschrecken lassen](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=this%20group%20appears%20to%20be%20unusually%20brazen%2C%20and%20will%20be%20unlikely%20to%20be%20deterred%20going%20forward). Sie hatten Recht. Sea Turtle war kein Einzelfall; es war ein Beweis dafür, dass DNS-Schicht-Spionage funktioniert, und dass die Menschen, die es betreiben, bereit sind, auch im Rampenlicht weiterzumachen.

## Was das über DNS als kritische Infrastruktur lehrt

Klammert man die Geopolitik aus, hinterlässt Sea Turtle eine Reihe unbequemer Erkenntnisse darüber, wie die Namensgebungsschicht des Internets tatsächlich funktioniert.

1. **DNS ist eine Vertrauenskette, und Sie kontrollieren nicht alle Teile davon.** Ihre eigene Sicherheit mag hervorragend sein. Aber die Auflösung Ihrer Domain läuft über einen Registrar und eine Registry, und wenn einer von beiden kompromittiert wird, können Ihre Einträge geändert werden, ohne Ihr Netzwerk je zu berühren. Sea Turtle bewies, dass Angreifer gezielt auf das schwächste Glied in der Kette abzielen werden.

2. **Ein gültiges Zertifikat ist kein Beweis für ein legitimes Ziel.** Das grüne Schloss bescheinigt, dass die Verbindung zu *wem auch immer die Domain gerade kontrolliert* verschlüsselt ist – und wenn ein Angreifer das DNS gekapert hat, ist das dieser Angreifer. Domain-validierte Zertifikate sind nur so vertrauenswürdig wie das DNS, gegen das sie validiert werden.

3. **DNS-Manipulation ist für das Opfer nahezu unsichtbar.** Auf den Rechnern des Opfers läuft keine Schadsoftware. Endpoint-Scanner sehen nichts. Das einzige Signal ist, dass Einträge auf etwas zeigen, auf das sie nicht zeigen sollten – weshalb die Überwachung von DNS-Einträgen auf unerwartete Änderungen und ihre Absicherung so wichtig ist.

4. **Die Sicherheit von Registrar- und Registry-Konten ist Infrastruktur der nationalen Sicherheit.** CISAs erste Notfalldirektive überhaupt drehte sich im Kern um Zugangsdaten für DNS-Verwaltungskonten. Multi-Faktor-Authentifizierung, Registry Locks und streng kontrollierter Zugang zu den Konten, die DNS-Einträge ändern können, sind keine netten Hygienemaßnahmen – sie sind der Unterschied zwischen dem Besitz einer Domain und dem bloßen Erscheinen als deren Besitzer.

## Die Namefi-Perspektive

![Farbenfrohe Illustration von verifizierbarem, manipulationssicherem Domain-Eigentum – eine Domain-Karte, gesichert durch ein grünes Schild, einen grünen Namefi-Token und DNS-Kontinuität](../../assets/the-sea-turtle-dns-espionage-03-namefi-angle.jpg)

Sea Turtle ist im Kern eine Geschichte darüber, *wer berechtigt ist, die Einträge einer Domain zu ändern* – und wie schwer es für den Rest der Welt ist zu erkennen, wenn diese Berechtigung still gestohlen wurde.

Das traditionelle Modell konzentriert diese Berechtigung in Registrar- und Registry-Konten, die zu oft durch kaum mehr als ein Passwort und eine E-Mail-Adresse geschützt sind. Wenn diese Konten fallen, fällt die Kontrolle über die Domain mit ihnen – still und leise. Es gibt kein eingebautes, unabhängig verifizierbares Protokoll darüber, wer legitim einen Namen hält, und keine manipulationssichere Spur, wenn die Kontrolle die Hände wechselt.

[Namefi](https://namefi.io) betrachtet Domain-Eigentümerschaft als etwas, das **konstruktionsbedingt verifizierbar und manipulationssicher** sein sollte, während es mit DNS kompatibel bleibt. Durch die Tokenisierung von Eigentümerschaft entsteht ein prüfbares, kryptographisch verankertes Protokoll darüber, wer eine Domain kontrolliert – was unautorisierte Übertragungen und stille Übernahmen viel schwerer durchführbar macht, ohne offensichtliche Spuren zu hinterlassen. Das allein verhindert nicht, dass eine Registry per Phishing angegriffen wird. Aber die übergeordnete Lektion, die Sea Turtle verdeutlicht, ist genau die, auf der Namefi aufgebaut ist: Domains sind kritische Infrastruktur, und die Frage, *wem dieser Name wirklich gehört*, verdient eine stärkere Antwort als „wer auch immer sich im Kontrollpanel anmelden kann."

Die Kampagne leitete Regierungen um, indem sie die Lücke zwischen dem *Halten* einer Domain und dem *Beweisen*, dass man sie hält, ausnutzte. Diese Lücke zu schließen – Eigentümerschaft verifizierbar, Übertragungen prüfbar und Kontrollkontinuität nachweisbar zu machen – ist genau die Art von Widerstandsfähigkeit, die die Namensgebungsschicht noch immer braucht.

## Quellen und weiterführende Lektüre

- Cisco Talos — [DNS Hijacking Abuses Trust In Core Internet Service](https://blog.talosintelligence.com/seaturtle/)
- Cisco Talos — [Sea Turtle keeps on swimming, finds new victims, DNS hijacking techniques](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/)
- TechCrunch — [A new state-backed hacker group is hijacking government domains at a phenomenal pace](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)
- BleepingComputer — ['Sea Turtle' Campaign Focuses on DNS Hijacking to Compromise Targets](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)
- SecurityWeek — [Sea Turtle's DNS Hijacking Continues Despite Exposure](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)
- BankInfoSecurity — ['Sea Turtle' DNS Hijacking Group Conducts Espionage: Report](https://www.bankinfosecurity.com/sea-turtle-dns-hijacking-group-conducts-espionage-report-a-12390)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)
- SDxCentral — [Cisco Talos Says a Nation State Is Behind Sea Turtle DNS Hijacking Attacks](https://www.sdxcentral.com/articles/news/cisco-talos-says-a-nation-state-is-behind-sea-turtle-dns-hijacking-attacks/2019/04/)
- SecurityWeek — [State-Sponsored Hackers Use Sophisticated DNS Hijacking in Ongoing Attacks](https://www.securityweek.com/state-sponsored-hackers-use-sophisticated-dns-hijacking-ongoing-attacks/)
