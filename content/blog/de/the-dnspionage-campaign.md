---
title: 'DNSpionage: Die Kampagne, die DNS als Waffe gegen Regierungen einsetzte'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Ende 2018 deckte Cisco Talos DNSpionage auf – eine Kampagne, die später mit iranischen Interessen in Verbindung gebracht wurde. Sie schrieb DNS-Einträge von Regierungen um, leitete E-Mail- und VPN-Verkehr auf Angreifer-Server um und prägte gültige TLS-Zertifikate, um unsichtbar zu bleiben. Dies trug dazu bei, die erste Notfallrichtlinie dieser Art durch die US-Regierung auszulösen.'
keywords: ['dnspionage', 'dns-hijacking', 'dns-umleitung', 'cisco talos', 'cisa-notfallrichtlinie 19-01', 'sea turtle dns', 'iran dns-hijacking', 'fireeye dns-hijacking', 'let''s encrypt zertifikatsmissbrauch', 'dns-sicherheit', 'domain-sicherheit', 'staatliche cyber-spionage', 'manipulation der dns-infrastruktur eindämmen']
---

Bei den meisten Domain-Katastrophen geht es darum, wer einen Namen *besitzt*. Hier ging es darum, wer ihn *kontrolliert* – und für ein paar Monate Ende 2018 lautete die Antwort für Dutzende von Regierungs-Domains im gesamten Nahen Osten: nicht die Regierungen.

Es gab keinen Einbruch in einen Webserver. Keine Malware auf der Startseite. Keine Verunstaltung (Defacement), keine Lösegeldforderung, keinen handfesten Beweis in den Anwendungsprotokollen. Die Angreifer mussten die Gebäude überhaupt nicht betreten. Sie spazierten durch die eine Tür, die fast niemand bewacht: den **DNS-Eintrag**, der angibt, wo die E-Mails und Websites einer Domain tatsächlich liegen. Sie änderten ihn – leise, mit gültigen Zugangsdaten, hinter einem gültigen TLS-Zertifikat – und der weltweite Datenverkehr folgte den neuen Anweisungen ohne Beanstandung.

Cisco Talos nannte es **DNSpionage**. Es ist eine der eindrücklichsten dokumentierten Demonstrationen, dass das Domain Name System nicht einfach nur eine Rohrleitung ist. Es ist eine nationale Sicherheitsinfrastruktur.

## DNS als Waffe der Staatskunst

Um zu verstehen, warum DNSpionage die Regierungen aufrüttelte, muss man sich ins Gedächtnis rufen, was DNS eigentlich tut.

Jedes Mal, wenn Sie eine E-Mail an ein Ministerium senden, sich in einem Firmen-VPN anmelden oder eine Webmail-Seite laden, stellt Ihr Gerät dem DNS zunächst eine Frage: *Welche IP-Adresse hat dieser Name?* Was auch immer das DNS antwortet, Sie vertrauen darauf. Ihr E-Mail-Client verbindet sich dorthin. Ihr VPN authentifiziert sich dorthin. Ihr Browser übergibt dort die Sitzung. DNS ist das Adressbuch des gesamten Internets, und fast nichts überprüft, ob dieses Adressbuch manipuliert wurde.

Genau diese Eigenschaft hat DNSpionage ausgenutzt. Wenn man den Eintrag ändern kann – nicht die Verschlüsselung knacken, nicht die Passwortdatei entschlüsseln, sondern nur den *Zeiger* (Pointer) ändern –, kann man unsichtbar zwischen einem Ziel und den Diensten stehen, denen es vertraut. E-Mails fließen durch Sie hindurch. VPN-Anmeldungen fließen durch Sie hindurch. Und da im Browser weiterhin der eigene Domainname des Opfers angezeigt wird, sieht nichts verdächtig aus.

Das ist Spionage auf der Ebene unterhalb der Anwendung. Es ist zudem unangenehmerweise die Ebene, die die meisten Sicherheitsprogramme als ein gelöstes Problem betrachten.

## Die DNSpionage-Kampagne (2018–2019)

![A vivid colorful concept illustration of a hidden interception room beneath a national switchboard, where a shadowy operator quietly reroutes a country's mail through forged official seals, glowing data cables splitting toward a secret listening post](../../assets/the-dnspionage-campaign-01-campaign.jpg)

Am **27. November 2018** veröffentlichte Cisco Talos seinen ersten Bericht. Der erste Satz war unmissverständlich: „[Cisco Talos entdeckte kürzlich eine neue Kampagne, die auf den Libanon und die Vereinigten Arabischen Emirate (VAE) abzielt und .gov-Domains sowie eine private libanesische Fluggesellschaft betrifft](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Cisco%20Talos%20recently%20discovered%20a%20new%20campaign%20targeting%20Lebanon%20and%20the%20United%20Arab%20Emirates).“

Die Kampagne hatte zwei Gesichter. Eines war eine recht gewöhnliche Malware-Operation: „[Diese spezielle Kampagne nutzt zwei gefälschte, bösartige Websites mit Stellenangeboten, die verwendet werden, um Ziele über bösartige Microsoft Office-Dokumente mit eingebetteten Makros zu kompromittieren](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=This%20particular%20campaign%20utilizes%20two%20fake%2C%20malicious%20websites%20containing%20job%20postings).“ Die Köder-Websites gaben sich als echte Personalvermittler aus – „[hr-wipro[.]com (mit einer Weiterleitung zu wipro.com) und hr-suncor[.]com (mit einer Weiterleitung zu suncor.com)](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=hr%2Dwipro)“ – und schleusten ein maßgeschneidertes Remote-Access-Tool ein, das bezeichnenderweise über DNS selbst mit seinem Command-Server kommunizieren konnte.

Aber das zweite Gesicht ist dasjenige, das Geschichte schrieb. In den Worten von Talos: „[In einer separaten Kampagne nutzten die Angreifer dieselbe IP, um das DNS legitimer .gov- und privater Unternehmens-Domains umzuleiten](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=the%20attackers%20used%20the%20same%20IP%20to%20redirect%20the%20DNS%20of%20legitimate).“ Echte Regierungs-Nameserver wurden auf Rechner gelenkt, die den Angreifern gehörten: „[Mehrere Nameserver, die zum öffentlichen Sektor im Libanon und in den VAE sowie zu einigen Unternehmen im Libanon gehören, wurden anscheinend kompromittiert, und Hostnamen unter ihrer Kontrolle wurden auf IP-Adressen unter der Kontrolle der Angreifer umgeleitet](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Multiple%20nameservers%20belonging%20to%20the%20public%20sector).“

Die gefälschten Jobseiten waren der Teil, der wie normale Cyberkriminalität aussah. Die DNS-Umleitung war der Teil, der nach Staatskunst aussah.

Als unabhängige Forscher den Faden weitergesponnen hatten, war der Umfang weitaus größer als zwei Länder. Brian Krebs arbeitete sich von den IP-Adressen der Angreifer rückwärts vor und fand heraus, dass „[in den letzten Monaten des Jahres 2018 die Hacker hinter DNSpionage erfolgreich Schlüsselkomponenten der DNS-Infrastruktur für mehr als 50 Unternehmen und Regierungsbehörden im Nahen Osten kompromittiert haben](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=in%20the%20last%20few%20months%20of%202018%20the%20hackers%20behind%20DNSpionage%20succeeded).“

## Wer das Ziel war und worum es ging

Die Opferliste liest sich wie eine Karte des Nervensystems einer Region: Außenministerien, Zivilluftfahrt, Telekommunikationsanbieter, Internet-Infrastruktur und das Webmail eines nationalen Finanzministeriums. Dies sind keine zufälligen Ziele. Es sind die Orte, an denen die Geheimnisse einer Nation durch die Leitungen fließen.

Zwei Monate nach dem ersten Bericht von Talos veröffentlichte FireEye (jetzt Mandiant) seine eigene Analyse und machte die Zuschreibung deutlich, aber vorsichtig. Wie FireEye es ausdrückte: „[Erste Untersuchungen deuten darauf hin, dass der oder die verantwortlichen Akteure eine Verbindung zum Iran haben](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/#:~:text=initial%20research%20suggests%20the%20actor%20or%20actors%20responsible%20have%20a%20nexus%20to%20Iran).“ In einem Bericht über die FireEye-Ergebnisse stellte SecurityWeek fest, dass das Unternehmen mit „[mittlerer Zuversicht](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=moderate%20confidence)“ (moderate confidence) einschätzte, dass der Iran hinter den Angriffen steckte, basierend auf technischen Beweisen und der Tatsache, dass die Kampagne mit den Interessen der iranischen Regierung übereinstimmte.

Was auf dem Spiel stand, ergibt sich direkt aus den Zielen. Wenn man die E-Mails eines Außenministeriums im Klartext lesen kann, stiehlt man keine Daten – man liest die Gedanken einer Regierung in nahezu Echtzeit. Deshalb ist eine Kampagne zum Sammeln von Zugangsdaten auf der DNS-Ebene nicht als Betrug, sondern als nachrichtendienstliche Sammlung gegen den Staat zu verstehen.

## Wie es passierte: DNS-Einträge + gültige Zertifikate + gefälschte Jobseiten

![A vivid colorful concept illustration of a national mail switchboard being silently re-patched — glowing address cards being swapped on a giant routing wall, each rerouted line passing through a forged green padlock seal before reaching a hidden listening booth](../../assets/the-dnspionage-campaign-02-dns-redirection.jpg)

Hier lohnt es sich, etwas genauer hinzusehen, denn die Technik ist auf die schlimmste Art und Weise elegant. Es gab drei Züge.

**Schritt eins: Die Schlüssel zum Adressbuch besorgen.** Die Angreifer haben keine DNS-Kryptografie geknackt. Sie loggten sich ein. FireEye beschrieb zwei Wege: „[Eine Methode besteht darin, sich mit gestohlenen Zugangsdaten in die Verwaltungsoberfläche eines DNS-Anbieters einzuloggen und DNS-A-Einträge zu ändern, um E-Mail-Verkehr abzufangen. Eine andere Methode besteht darin, DNS-NS-Einträge zu ändern, nachdem man sich in das Domain-Registrar-Konto des Opfers gehackt hat](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=One%20method%20involves%20logging%20into%20a%20DNS%20provider).“ Gestohlene Zugangsdaten von Registraren und DNS-Hosts waren der Hauptschlüssel. Wer das Registrar-Login besitzt, besitzt die Domain – und die Domain kontrolliert alles, was auf sie verweist.

**Schritt zwei: Den Datenverkehr so umleiten, dass er weiterhin funktioniert.** Den Mailserver einer Regierung auf eine eigene IP-Adresse umzuleiten, würde normalerweise Dinge zerstören und Alarme auslösen. Also nutzten die Angreifer Proxys. Der Datenverkehr wurde nach dem Abfangen an das echte Ziel weitergeleitet, sodass die Benutzer einen funktionierenden Posteingang und ein funktionierendes VPN sahen. Wie FireEye eine dritte Variante beschrieb: „[Benutzer wurden auf eine von den Angreifern kontrollierte Infrastruktur umgeleitet](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=users%20were%20redirected%20to%20attacker%2Dcontrolled%20infrastructure).“ Das Abfangen war eine Man-in-the-Middle-Attacke, die stillschweigend weiterleitete – unsichtbar, gerade weil nichts fehlzuschlagen schien.

**Schritt drei: Das grüne Vorhängeschloss überwinden.** Moderne Dienste verwenden TLS, was eine Zertifikatswarnung ausgeben sollte, sobald der Datenverkehr auf dem falschen Server landet. Die Angreifer schlossen diese Lücke, indem sie ihre eigenen legitimen Zertifikate prägten. Talos fand heraus, dass „[der Akteur während jeder DNS-Kompromittierung sorgfältig Let's Encrypt-Zertifikate für die umgeleiteten Domains generierte](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=During%20each%20DNS%20compromise%2C%20the%20actor%20carefully%20generated).“ Da sie nun das DNS für die Domain kontrollierten, konnten sie gegenüber einer Zertifizierungsstelle die Kontrolle *nachweisen* – und die automatisierte Domain-Validierung händigte ihnen ein gültiges Zertifikat aus. FireEye bestätigte das gleiche Muster für beide Methoden: „[In beiden Fällen verwendeten die Angreifer Let's Encrypt-Zertifikate, um keinen Verdacht zu erregen](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=in%20both%20cases%20the%20attackers%20used%20Let%E2%80%99s%20Encrypt%20certificates).“

Das Ergebnis war, laut Krebs' Zusammenfassung, absolut: „[Diese DNS-Hijacks ebneten den Angreifern auch den Weg, um SSL-Verschlüsselungszertifikate für die anvisierten Domains (z. B. webmail.finance.gov.lb) zu erhalten, was es ihnen ermöglichte, die abgefangenen E-Mail- und VPN-Zugangsdaten zu entschlüsseln und sie im Klartext einzusehen](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=these%20DNS%20hijacks%20also%20paved%20the%20way%20for%20the%20attackers%20to%20obtain%20SSL%20encryption%20certificates).“ E-Mail- und VPN-Anmeldungen, erfasst und lesbar, durchgehend mit einem gültigen Vorhängeschloss versehen.

Beachten Sie, was *nicht* erforderlich war. Kein Zero-Day-Exploit. Keine Malware auf den eigenen Servern des Opfers. Keine umgangene Firewall. Der Angriff lebte vollständig in der Lücke zwischen „Mir gehört diese Domain“ und „Ich kann beweisen, wer derzeit ihre Einträge kontrolliert“. In dieser Lücke spielte sich DNSpionage ab – und sie ist größer, als die meisten Organisationen denken.

## Die Reaktion: CISA-Notfallrichtlinie 19-01

Die kombinierten Enthüllungen von Talos und FireEye schlugen in Washington hohe Wellen. Am **22. Januar 2019** erließ die US-Cybersicherheitsbehörde CISA (Cybersecurity and Infrastructure Security Agency) die **Notfallrichtlinie 19-01, „Mitigate DNS Infrastructure Tampering“** (Eindämmung von Manipulationen der DNS-Infrastruktur) – die erste Notfallrichtlinie, die die CISA jemals herausgegeben hatte, und eine seltene Anweisung, die für die gesamte zivile Bundesregierung bindend war.

Die Diagnose der Richtlinie stimmte genau mit den Forschungsergebnissen überein. Wie in zeitgenössischen Berichten zitiert, warnte die CISA, dass „[Angreifer Web- und E-Mail-Verkehr umgeleitet und abgefangen haben und dies auch für andere Netzwerkdienste tun könnten](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=redirected%20and%20intercepted%20web%20and%20mail%20traffic)“, und dass die Akteure „[die Konten von Administratoren kompromittiert haben, die für die DNS-Domains von Regierungen zuständig sind](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=compromised%20the%20accounts%20of%20administrators)“.

Daraufhin ordnete sie vier Maßnahmen an, die innerhalb von 10 Tagen umzusetzen waren – und sie lesen sich wie eine direkte Erwiderung auf jeden der drei Schritte der Angreifer:

1. **Überprüfen Sie Ihre DNS-Einträge** – stellen Sie sicher, dass auf autoritativen und sekundären Servern nichts manipuliert wurde.
2. **Ändern Sie die Passwörter von DNS-Konten** – rotieren Sie jede Zugangsberechtigung, die DNS bearbeiten kann.
3. **Fügen Sie eine Multi-Faktor-Authentifizierung hinzu** zu allen DNS-Admin-Konten – damit ein gestohlenes Passwort allein nicht mehr der Hauptschlüssel ist.
4. **Überwachen Sie Certificate Transparency-Protokolle** – achten Sie auf Zertifikate, die für Ihre Domains ausgestellt wurden, die Sie aber nie angefordert haben.

Dieser vierte Punkt spricht Bände. Die CISA wies die Behörden nicht nur an, die Tür abzuschließen; sie wies sie an, die öffentlichen Zertifikatsregister (Certificate Transparency Logs) auf Beweise dafür zu überwachen, dass bereits jemand eine Kopie des Schlüssels verwendet hatte. DNSpionage hatte Certificate Transparency von einer Nischenfunktion der PKI (Public Key Infrastructure) zu einem Erkennungswerkzeug an vorderster Front für staatlich gelenktes DNS-Hijacking gemacht.

Krebs brachte die Ungewöhnlichkeit dieses Moments auf den Punkt: „[Das US-Ministerium für Heimatschutz (DHS) hat eine seltene Notfallrichtlinie herausgegeben, die alle zivilen US-Bundesbehörden anweist, die Anmeldedaten für ihre Internet-Domain-Einträge zu sichern](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=issued%20a%20rare%20emergency%20directive%20ordering%20all%20U.S.%20federal%20civilian%20agencies).“

DNSpionage war nicht der einzige Auslöser dafür. Eine parallele, noch aggressivere Operation, die Talos **Sea Turtle** nannte – und die Talos als „[den ersten bekannten Fall einer Domainnamen-Registrierungs-Organisation, die für Cyberspionage-Operationen kompromittiert wurde](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=first%20known%20case%20of%20a%20domain%20name%20registry%20organization%20that%20was%20compromised)“ beschrieb und „[ungefähr 40 verschiedene Organisationen in 13 verschiedenen Ländern](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=approximately%2040%20different%20organizations%20across%2013%20different%20countries)“ traf –, erhöhte die Einsätze weiter. Talos achtete darauf, die beiden getrennt zu betrachten; in seinem Follow-up vom April 2019 merkte es an, dass das Verhalten von DNSpionage „[diesen Akteur wahrscheinlich weiterhin von besorgniserregenderen Kampagnen wie Sea Turtle unterscheiden wird](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/#:~:text=will%20likely%20continue%20to%20distinguish%20this%20actor%20from%20more%20concerning%20campaigns%20like%20Sea%20Turtle)“. Zusammen verdeutlichten die beiden Kampagnen denselben Punkt aus verschiedenen Blickwinkeln: Die DNS-Lieferkette war zu einem Schauplatz staatlicher Konflikte geworden.

## Was uns das über DNS als nationale Sicherheitsinfrastruktur lehrt

DNSpionage spart an Malware-Drama und liefert dafür umso mehr unbequeme Lektionen. Einige davon sind es wert, festgehalten zu werden:

- **Das Registrar-Konto ist ein Kronjuwel.** Alles, was einer Domain nachgelagert ist – E-Mail, Web, VPN, Single Sign-On, Zertifikatsausstellung –, erbt das Vertrauen desjenigen, der ihr DNS bearbeiten kann. Ein Passwort ohne zweiten Faktor bei diesem Konto ist keine kleine Lücke; es bedeutet, dass das gesamte Tor zur Burg offen steht. Die ersten Anweisungen der CISA betrafen genau aus diesem Grund *Zugangsdaten*, nicht Firewalls.
- **Ein gültiges Zertifikat ist kein Beweis für Legitimität.** Das grüne Vorhängeschloss beweist, dass der Datenverkehr für *denjenigen verschlüsselt ist, der die Domain im Moment kontrolliert*. Wenn ein Angreifer das DNS kontrolliert, stellt ihm die automatisierte Domain-Validierung problemlos ein echtes Zertifikat aus. Das Vertrauen in TLS ist nur vom Vertrauen in DNS abgeleitet – und DNS ist weicher, als die meisten Leute annehmen.
- **DNS-Angriffe sind absichtlich unsichtbar.** Da der Proxy echten Datenverkehr weiterleitet, funktionieren die Dienste des Opfers weiterhin. Es gibt keinen Ausfall, den man untersuchen könnte. Das einzige externe Signal könnte ein Zertifikat sein, das in einem öffentlichen CT-Protokoll auftaucht – weshalb die Überwachung dieser Protokolle über Nacht von einer optionalen zu einer obligatorischen Maßnahme wurde.
- **Domain-Kontrolle ist eine Kontrolle der nationalen Sicherheit.** Wenn die Entität, die das DNS eines Außenministeriums bearbeitet, ein feindlicher Staat ist, bricht die Unterscheidung zwischen „IT-Betrieb“ und „Spionageabwehr“ zusammen. Das Adressbuch des Internets ist strategisches Terrain.

Der rote Faden ist eine einzige Frage, die fast kein operatives Tool in Echtzeit beantwortet: **Wer kontrolliert diese Domain aktuell wirklich, und kann ich beweisen, dass sie nicht heimlich geändert wurde?** DNSpionage funktionierte, weil diese Frage so schwer zu beantworten war, dass die Regierungen einer ganzen Region dies nicht konnten.

## Der Namefi-Ansatz

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-dnspionage-campaign-03-namefi-angle.jpg)

DNSpionage ist im Kern ein **Provenienz-Problem** (Herkunftsproblem). Die Angreifer besaßen die Ziel-Domains zu keinem Zeitpunkt. Sie liehen sich deren Kontrolle aus, indem sie die Zugangsdaten stahlen, die es ermöglichten, in Registrar- und DNS-Host-Panels stille, nicht verifizierbare Änderungen vorzunehmen – und nichts im System signalisierte, dass sich die *kontrollierende Partei* geändert hatte.

[Namefi](https://namefi.io) basiert auf der Prämisse, dass Besitz und Kontrolle von Domains **überprüfbar, portabel und manipulationssicher** sein sollten, anstatt in einem undurchsichtigen Registrar-Login eingeschlossen zu sein. Die Tokenisierung des Eigentums macht die Frage „Wer kontrolliert diesen Namen?“ zu einer Tatsache, die Sie überprüfen und auditieren können, und nicht zu einer Einstellung, die hinter einem Passwort vergraben ist, das sich möglicherweise bereits in fremden Händen befindet. Das ersetzt nicht die Hygiene bei Registrar-Konten oder die Multi-Faktor-Authentifizierung – die Ratschläge der CISA sind weiterhin absolut richtig –, aber es greift die tiefere Lücke an, die DNSpionage ausgenutzt hat: die Schwierigkeit, unabhängig und kontinuierlich zu *beweisen*, dass die Partei, die eine Domain kontrolliert, auch die Partei ist, die es sein sollte.

Die Lektion von DNSpionage ist nicht, dass DNS auf irgendeine exotische Weise fragil ist. Sie lautet, dass die wichtigste Tatsache über eine Domain – nämlich wer sie kontrolliert – viel zu lange nur durch ein einziges (potenziell gestohlenes) Passwort geschützt war. Diese Tatsache überprüfbar zu machen, ist der springende Punkt.

## Quellen und weiterführende Literatur

- Cisco Talos — [DNSpionage Campaign Targets Middle East](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/) (27. Nov. 2018)
- Cisco Talos — [DNSpionage brings out the Karkoff](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/) (23. Apr. 2019)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (18. Feb. 2019)
- The Register — [Baddies linked to Iran fingered for DNS hijacking to read Middle Eastern regimes' emails](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/) (10. Jan. 2019)
- SecurityWeek — [Iran-Linked DNS Hijacking Attacks Target Organizations Worldwide](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/) (10. Jan. 2019)
- BleepingComputer — [DHS Issues Emergency Directive to Prevent DNS Hijacking Attacks](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/) (Jan. 2019)
- Network World — [Cisco Talos details exceptionally dangerous DNS hijacking attack](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html) (17. Apr. 2019)
- Network World — [Cisco: DNSpionage attack adds new tools, morphs tactics](https://www.networkworld.com/article/967303/cisco-dnspionage-attack-adds-new-tools-morphs-tactics.html)
- CERT-IST — [DNSpionage and DNS data hijacking](https://www.cert-ist.com/public/en/SO_detail?format=html&code=dnspionage)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) (22. Jan. 2019)