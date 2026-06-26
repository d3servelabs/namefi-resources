---
title: 'DNSpionage: Die Kampagne, die DNS zur Waffe gegen Regierungen machte'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Ende 2018 deckte Cisco Talos DNSpionage auf – eine Kampagne, die später mit iranischen Interessen in Verbindung gebracht wurde. Dabei wurden DNS-Einträge von Regierungen manipuliert, E-Mail- und VPN-Verkehr auf Angreifer-Server umgeleitet und gültige TLS-Zertifikate ausgestellt, um unsichtbar zu bleiben. Die Kampagne löste die erste Notfalldirektive dieser Art der US-Regierung aus.'
keywords: ['dnspionage', 'dns-hijacking', 'dns-umleitung', 'cisco talos', 'cisa notfalldirektive 19-01', 'sea turtle dns', 'iran dns-hijacking', 'fireeye dns-hijacking', 'lets encrypt zertifikatsmissbrauch', 'dns-sicherheit', 'domain-sicherheit', 'staatliche cyberspionage', 'dns-infrastruktur-manipulation verhindern']
relatedArticles:
  - /de/blog/the-sea-turtle-dns-espionage/
  - /de/blog/the-fox-it-dns-hijack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-myetherwallet-bgp-dns-attack/
  - /de/blog/the-badgerdao-frontend-attack/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/name-change-game-change/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/registrar/
  - /de/glossary/icann/
  - /de/glossary/tld/
  - /de/glossary/registry/
---

Bei den meisten Domain-Katastrophen geht es darum, wer einen Namen *besitzt*. Bei dieser ging es darum, wer ihn *kontrolliert* – und für einige Monate Ende 2018 lautete die Antwort für Dutzende von Regierungsdomains im Nahen Osten: nicht die Regierungen selbst.

Es gab keinen Einbruch in einen Webserver. Keine Malware auf der Startseite. Keine Verunstaltung, keine Lösegeldforderung, keinen offensichtlichen Hinweis in den Anwendungsprotokollen. Die Angreifer mussten nie in die eigentlichen Gebäude eindringen. Sie gingen durch die eine Tür, die fast niemand bewacht: den **[DNS](/de/glossary/dns/)-Eintrag**, der angibt, wo die E-Mails und Websites einer Domain tatsächlich gehostet werden. Sie bearbeiteten ihn – still, mit gültigen Anmeldedaten, hinter einem gültigen TLS-Zertifikat – und der weltweite Datenverkehr folgte den neuen Anweisungen ohne Widerstand.

Cisco Talos nannte es **DNSpionage**. Es ist eine der saubersten Demonstrationen, die je aufgezeichnet wurden, dass das Domain Name System nicht nur eine technische Infrastruktur ist. Es ist nationale Sicherheitsinfrastruktur.

## DNS als Werkzeug der Staatspolitik

Um zu verstehen, warum DNSpionage Regierungen aufschreckte, muss man sich vergegenwärtigen, was DNS eigentlich tut.

Jedes Mal, wenn Sie eine E-Mail an ein Ministerium schicken, sich in ein Unternehmens-VPN einloggen oder eine Webmail-Seite aufrufen, stellt Ihr Gerät zunächst DNS eine Frage: *Welche [IP-Adresse](/de/glossary/ip-address/) gehört zu diesem Namen?* Was auch immer DNS antwortet, vertrauen Sie. Ihr E-Mail-Client verbindet sich dorthin. Ihr VPN authentifiziert sich dort. Ihr Browser übergibt dort die Sitzungsdaten. DNS ist das Adressbuch des gesamten Internets, und fast nichts überprüft, ob das Adressbuch manipuliert wurde.

Genau diese Eigenschaft nutzte DNSpionage aus. Wenn man den Eintrag ändern kann – nicht die Verschlüsselung brechen, nicht die Passwortdatei knacken, sondern nur den *Zeiger* ändern – kann man sich unsichtbar zwischen ein Ziel und die Dienste stellen, denen es vertraut. E-Mails fließen durch einen hindurch. VPN-Anmeldungen fließen durch einen hindurch. Und da der eigene Domainname des Opfers weiterhin in der Adresszeile des Browsers erscheint, fällt nichts auf.

Das ist Spionage auf der Ebene unterhalb der Anwendungsschicht. Es ist auch, unangenehmerweise, die Ebene, die die meisten Sicherheitsprogramme als gelöstes Problem betrachten.

## Die DNSpionage-Kampagne (2018–2019)

![Eine lebhafte, farbenfrohe Konzeptillustration eines versteckten Abhörraums unter einer nationalen Vermittlungsstelle, in dem ein schattenhafter Betreiber die Post eines Landes still und heimlich über gefälschte offizielle Siegel umleitet, während leuchtende Datenkabel zu einem geheimen Abhörposten abzweigen](../../assets/the-dnspionage-campaign-01-campaign.jpg)

Am **27. November 2018** veröffentlichte Cisco Talos seinen ersten Bericht. Die Eröffnungszeile war präzise: „[Cisco Talos recently discovered a new campaign targeting Lebanon and the United Arab Emirates (UAE) affecting .gov domains, as well as a private Lebanese airline company](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Cisco%20Talos%20recently%20discovered%20a%20new%20campaign%20targeting%20Lebanon%20and%20the%20United%20Arab%20Emirates)."

Die Kampagne hatte zwei Gesichter. Das eine war eine recht gewöhnliche Malware-Operation: „[This particular campaign utilizes two fake, malicious websites containing job postings that are used to compromise targets via malicious Microsoft Office documents with embedded macros](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=This%20particular%20campaign%20utilizes%20two%20fake%2C%20malicious%20websites%20containing%20job%20postings)." Die Köder-Seiten gaben sich als echte Personalvermittler aus – „[hr-wipro[.]com (with a redirection to wipro.com) and hr-suncor[.]com (with a redirection to suncor.com)](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=hr%2Dwipro)" – und installierten ein spezielles Fernzugriffswerkzeug, das charakteristischerweise über DNS selbst mit seinem Kommandoserver kommunizieren konnte.

Doch das zweite Gesicht ist das, das Geschichte schrieb. In den Worten von Talos: „[In a separate campaign, the attackers used the same IP to redirect the DNS of legitimate .gov and private company domains](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=the%20attackers%20used%20the%20same%20IP%20to%20redirect%20the%20DNS%20of%20legitimate)." Echte Regierungs-Nameserver wurden auf Maschinen umgeleitet, die die Angreifer kontrollierten: „[Multiple nameservers belonging to the public sector in Lebanon and UAE, as well as some companies in Lebanon, were apparently compromised, and hostnames under their control were pointed to attacker-controlled IP addresses](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Multiple%20nameservers%20belonging%20to%20the%20public%20sector)."

Die gefälschten Jobseiten waren der Teil, der wie normale Cyberkriminalität aussah. Die DNS-Umleitung war der Teil, der nach Staatspolitik aussah.

Als unabhängige Forscher den Faden zu Ende gesponnen hatten, war das Ausmaß weit größer als zwei Länder. Brian Krebs fand, ausgehend von den IP-Adressen der Angreifer, heraus, dass „[in the last few months of 2018 the hackers behind DNSpionage succeeded in compromising key components of DNS infrastructure for more than 50 Middle Eastern companies and government agencies](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=in%20the%20last%20few%20months%20of%202018%20the%20hackers%20behind%20DNSpionage%20succeeded)."

## Wer ins Visier genommen wurde und was auf dem Spiel stand

Die Liste der Opfer liest sich wie eine Karte des Nervensystems einer Region: Außenministerien, Zivilluftfahrtbehörden, Telekommunikationsunternehmen, Internetinfrastruktur und das Webmail eines nationalen Finanzministeriums. Das sind keine zufälligen Ziele. Es sind die Stellen, durch die die Geheimnisse einer Nation über Leitungen fließen.

Zwei Monate nach dem ersten Talos-Bericht veröffentlichte FireEye (jetzt Mandiant) seine eigene Analyse und machte die Zuordnung explizit, aber vorsichtig. Wie FireEye es formulierte: „[initial research suggests the actor or actors responsible have a nexus to Iran](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/#:~:text=initial%20research%20suggests%20the%20actor%20or%20actors%20responsible%20have%20a%20nexus%20to%20Iran)." In seiner Berichterstattung über die FireEye-Erkenntnisse stellte SecurityWeek fest, dass das Unternehmen mit „[moderater Gewissheit](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=moderate%20confidence)" einschätzte, dass Iran hinter den Angriffen steckte, basierend auf technischen Beweisen und der Tatsache, dass die Kampagne den Interessen der iranischen Regierung entsprach.

Das Ausmaß der Bedrohung ergibt sich unmittelbar aus den Zielen. Wenn man die E-Mails eines Außenministeriums im Klartext lesen kann, stiehlt man keine Daten – man liest den Gedanken einer Regierung in nahezu Echtzeit. Deshalb ist eine Kampagne zur Erfassung von Anmeldedaten auf der DNS-Ebene nicht als Betrug zu verstehen, sondern als nachrichtendienstliche Informationsgewinnung gegen den Staat.

## Wie es geschah: DNS-Einträge + gültige Zertifikate + gefälschte Jobseiten

![Eine lebhafte, farbenfrohe Konzeptillustration einer nationalen Post-Vermittlungsstelle, die still umprogrammiert wird – leuchtende Adresskarten werden an einer riesigen Routing-Wand ausgetauscht, jede umgeleitete Leitung passiert ein gefälschtes grünes Schlosssymbol, bevor sie eine versteckte Abhörkabine erreicht](../../assets/the-dnspionage-campaign-02-dns-redirection.jpg)

Hier lohnt es sich, innezuhalten, denn die Technik ist auf die schlimmste Art elegant. Es gab drei Schritte.

**Schritt eins: Den Schlüssel zum Adressbuch erhalten.** Die Angreifer knackten keine DNS-Kryptografie. Sie loggten sich einfach ein. FireEye beschrieb zwei Wege: „[One method involves logging into a DNS provider's administration interface using compromised credentials and changing DNS A records in an effort to intercept email traffic. Another method involves changing DNS NS records after hacking into the victim's domain registrar account](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=One%20method%20involves%20logging%20into%20a%20DNS%20provider)." Gestohlene [Registrar](/de/glossary/registrar/)- und DNS-Host-Anmeldedaten waren der Generalschlüssel. Wer den Registrar-Login besitzt, besitzt die Domain – und die Domain trägt alles, was auf sie verweist.

**Schritt zwei: Den Datenverkehr so umleiten, dass er weiterhin funktioniert.** Den Mailserver einer Regierung auf die eigene IP zu lenken, würde normalerweise Probleme verursachen und Alarme auslösen. Also proxierten die Angreifer. Der Datenverkehr wurde nach dem Abfangen an das eigentliche Ziel weitergeleitet, sodass die Nutzer ein funktionierendes Postfach und ein funktionierendes VPN sahen. Wie FireEye eine dritte Variante beschrieb: „[users were redirected to attacker-controlled infrastructure](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=users%20were%20redirected%20to%20attacker%2Dcontrolled%20infrastructure)." Das Abfangen war ein Man-in-the-Middle, der still weiterleitete – genau deshalb unsichtbar, weil nichts ausfiel.

**Schritt drei: Das grüne Schlosssymbol überlisten.** Moderne Dienste verwenden TLS, das eigentlich eine Zertifikatswarnung ausgeben sollte, sobald der Datenverkehr auf dem falschen Server ankommt. Die Angreifer schlossen diese Lücke, indem sie eigene legitime Zertifikate ausstellten. Talos stellte fest, dass „[during each DNS compromise, the actor carefully generated Let's Encrypt certificates for the redirected domains](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=During%20each%20DNS%20compromise%2C%20the%20actor%20carefully%20generated)." Da sie nun die DNS-Kontrolle über die Domain hatten, konnten sie gegenüber einer Zertifizierungsstelle die Kontrolle *nachweisen* – und die automatisierte Domain-Validierung stellte ihnen ein gültiges Zertifikat aus. FireEye bestätigte dasselbe Muster über alle Methoden hinweg: „[in both cases the attackers used Let's Encrypt certificates to avoid raising suspicion](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=in%20both%20cases%20the%20attackers%20used%20Let%E2%80%99s%20Encrypt%20certificates)."

Das Ergebnis war, in Krebs' Zusammenfassung, vollständig: „[these DNS hijacks also paved the way for the attackers to obtain SSL encryption certificates for the targeted domains (e.g. webmail.finance.gov.lb), which allowed them to decrypt the intercepted email and VPN credentials and view them in plain text](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=these%20DNS%20hijacks%20also%20paved%20the%20way%20for%20the%20attackers%20to%20obtain%20SSL%20encryption%20certificates)." E-Mails und VPN-Anmeldedaten, abgefangen und lesbar, mit einem gültigen Schlosssymbol die ganze Zeit.

Beachten Sie, was *nicht* erforderlich war. Kein Zero-Day-Exploit. Keine Malware auf den eigenen Servern des Opfers. Keine überwundene Firewall. Der Angriff lebte vollständig in der Lücke zwischen „Ich besitze diese Domain" und „Ich kann beweisen, wer ihre Einträge gerade kontrolliert." In dieser Lücke lebte DNSpionage – und sie ist größer, als die meisten Organisationen annehmen.

## Die Reaktion: CISA-Notfalldirektive 19-01

Die kombinierten Enthüllungen von Talos und FireEye trafen Washington hart. Am **22. Januar 2019** erließ die US-amerikanische Cybersecurity and Infrastructure Security Agency die **Notfalldirektive 19-01, „Mitigate DNS Infrastructure Tampering"** – die erste Notfalldirektive, die CISA je herausgegeben hatte, und eine seltene, für die gesamte zivile Bundesregierung verbindliche Anweisung.

Die Diagnose der Direktive entsprach genau den Erkenntnissen der Forscher. Wie in zeitgenössischen Berichten zitiert, warnte CISA, dass „[attackers have redirected and intercepted web and mail traffic, and could do so for other networked services](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=redirected%20and%20intercepted%20web%20and%20mail%20traffic)", und dass die Akteure „[compromised the accounts of administrators in charge of government DNS domains](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=compromised%20the%20accounts%20of%20administrators)" hatten.

Die Direktive ordnete dann vier Maßnahmen an, mit einer Frist von 10 Tagen – und sie lesen sich wie eine direkte Antwort auf jeden der drei Angreifer-Schritte:

1. **DNS-Einträge überprüfen** – verifizieren, dass nichts an autoritativen und sekundären Servern manipuliert wurde.
2. **DNS-Kontopasswörter ändern** – alle Anmeldedaten rotieren, die DNS bearbeiten können.
3. **Zwei-Faktor-Authentifizierung hinzufügen** für alle DNS-Administratorkonten – damit ein gestohlenes Passwort allein kein Generalschlüssel mehr ist.
4. **Certificate Transparency-Protokolle überwachen** – auf Zertifikate achten, die für eigene Domains ausgestellt wurden, ohne dass man sie beantragt hat.

Der vierte Punkt ist besonders aufschlussreich. CISA wies die Behörden nicht nur an, die Tür zu verschließen; es wies sie auch an, die öffentlichen Zertifikatsverzeichnisse zu überwachen, um Hinweise darauf zu finden, ob jemand bereits eine Kopie des Schlüssels verwendet hatte. DNSpionage hatte Certificate Transparency von einem Nischenmerkmal der PKI zu einem erstklassigen Erkennungswerkzeug für staatliches [DNS-Hijacking](/de/glossary/dns-hijacking/) gemacht.

Krebs fasste die Ungewöhnlichkeit des Moments treffend zusammen: „[the U.S. Department of Homeland Security issued a rare emergency directive ordering all U.S. federal civilian agencies to secure the login credentials for their Internet domain records](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=issued%20a%20rare%20emergency%20directive%20ordering%20all%20U.S.%20federal%20civilian%20agencies)."

DNSpionage handelte bei der Auslösung nicht allein. Eine parallele, noch aggressivere Operation, die Talos **Sea Turtle** nannte – die Talos als „[the first known case of a domain name registry organization that was compromised for cyber espionage operations](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=first%20known%20case%20of%20a%20domain%20name%20registry%20organization%20that%20was%20compromised)" bezeichnete und die „[approximately 40 different organizations across 13 different countries](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=approximately%2040%20different%20organizations%20across%2013%20different%20countries)" traf – erhöhte den Einsatz weiter. Talos hielt sorgfältig an der Unterscheidung zwischen beiden fest; in seinem April-2019-Folgeartikel stellte es fest, dass das Verhalten von DNSpionage „[will likely continue to distinguish this actor from more concerning campaigns like Sea Turtle](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/#:~:text=will%20likely%20continue%20to%20distinguish%20this%20actor%20from%20more%20concerning%20campaigns%20like%20Sea%20Turtle)." Gemeinsam machten die beiden Kampagnen denselben Punkt aus unterschiedlichen Perspektiven: Die DNS-Lieferkette war zum Schauplatz staatlicher Konflikte geworden.

## Was das über DNS als nationale Sicherheitsinfrastruktur lehrt

DNSpionage bietet wenig Malware-Drama, aber umso mehr unangenehme Lektionen. Einige, die es wert sind, festgehalten zu werden:

- **Das Registrar-Konto ist eine Kronjuwele.** Alles, was unterhalb einer Domain liegt – Mail, Web, VPN, Single Sign-On, Zertifikatsausstellung – erbt das Vertrauen dessen, der ihre DNS-Einträge bearbeiten kann. Ein Passwort ohne zweiten Faktor auf diesem Konto ist keine kleine Lücke; es ist die gesamte Burg mit aufgestoßenem Tor. CISAs erste Anweisungen betrafen genau aus diesem Grund *Anmeldedaten*, nicht Firewalls.
- **Ein gültiges Zertifikat ist kein Legitimitätsbeweis.** Das grüne Schlosssymbol beweist, dass der Datenverkehr verschlüsselt zu *wem auch immer die Domain gerade kontrolliert* übertragen wird. Wenn ein Angreifer das DNS kontrolliert, stellt die automatisierte Domain-Validierung ihm bereitwillig ein echtes Zertifikat aus. Vertrauen in TLS ist geliehenes Vertrauen in DNS – und DNS ist weicher, als die meisten Menschen annehmen.
- **DNS-Angriffe sind von Natur aus unsichtbar.** Da der Proxy echten Datenverkehr weiterleitet, funktionieren die Dienste des Opfers weiterhin. Es gibt keinen Ausfall, den man untersuchen müsste. Das einzige externe Signal kann ein Zertifikat sein, das in einem öffentlichen CT-Protokoll erscheint – weshalb die Überwachung dieser Protokolle von optional über Nacht zu verpflichtend wurde.
- **Domain-Kontrolle ist eine nationale Sicherheitskontrolle.** Wenn die Einheit, die die DNS-Einträge eines Außenministeriums bearbeitet, ein feindlicher Staat ist, bricht die Unterscheidung zwischen „IT-Betrieb" und „Spionageabwehr" zusammen. Das Adressbuch des Internets ist strategisches Terrain.

Der rote Faden ist eine einzige Frage, die fast kein operatives Werkzeug in Echtzeit beantwortet: **Wer kontrolliert diese Domain gerade wirklich, und kann ich beweisen, dass sich das nicht still verändert hat?** DNSpionage funktionierte, weil diese Frage so schwer zu beantworten war, dass die Regierungen einer ganzen Region sie nicht beantworten konnten.

## Der Namefi-Aspekt

![Farbenfrohe Illustration von verifizierbarem, manipulationssicherem Domain-Eigentum – eine Domain-Karte, gesichert durch ein grünes Schutzschild, ein grünes Namefi-Token und DNS-Kontinuität](../../assets/the-dnspionage-campaign-03-namefi-angle.jpg)

DNSpionage ist im Kern ein **Herkunftsproblem**. Die Angreifer besaßen die angegriffenen Domains nie. Sie liehen sich deren Kontrolle, indem sie die Anmeldedaten stahlen, die es Registrar- und DNS-Host-Oberflächen ermöglichen, stille, nicht nachvollziehbare Änderungen vorzunehmen – und nichts im System meldete, dass die *kontrollierende Partei* gewechselt hatte.

[Namefi](https://namefi.io) basiert auf der Prämisse, dass [Domain-Eigentum](/de/glossary/domain-ownership/) und -Kontrolle **verifizierbar, portabel und manipulationssicher** sein sollten, anstatt hinter einer undurchsichtigen Registrar-Anmeldung eingesperrt zu sein. Tokenisiertes Eigentum macht „Wer kontrolliert diesen Namen" zu einer Tatsache, die man überprüfen und auditieren kann – nicht zu einer Einstellung, die hinter einem Passwort vergraben ist, das sich möglicherweise bereits in fremden Händen befindet. Das ersetzt keine Registrar-Konto-Hygiene oder Zwei-Faktor-Authentifizierung – CISAs Ratschläge sind weiterhin genau richtig – aber es bekämpft die tiefere Lücke, die DNSpionage ausnutzte: die Schwierigkeit, unabhängig und kontinuierlich zu *beweisen*, dass die Partei, die eine Domain kontrolliert, auch diejenige ist, die es sein sollte.

Die Lektion von DNSpionage ist nicht, dass DNS auf irgendeine exotische Weise fragil ist. Sie ist, dass die wichtigste Tatsache über eine Domain – wer sie kontrolliert – allzu lange nur durch ein gestohlenes Passwort geschützt war. Diese Tatsache verifizierbar zu machen, ist der eigentliche Zweck.

## Quellen und weiterführende Lektüre

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
