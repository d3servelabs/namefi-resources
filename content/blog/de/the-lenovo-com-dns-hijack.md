---
title: 'Der Lenovo.com-DNS-Hijack: Als Lizard Squad die Eingangstür eines Hardware-Riesen übernahm'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Am 25. Februar 2015 kaperte Lizard Squad Lenovo.com durch einen Angriff auf den Registrar Webnic, leitete die Domain des weltgrößten PC-Herstellers auf eine Webcam-Diashow um und fing E-Mails ab – nur wenige Tage nach dem Superfish-Skandal. Eine Domain-Mayday-Analyse darüber, warum der Registrar Ihr eigentlicher Sicherheitsperimeter ist.'
keywords: ['lenovo.com dns hijack', 'lizard squad', 'webnic registrar', 'web commerce communications', 'dns-hijacking', 'superfish', 'domain-registrar-sicherheit', 'registrar-kompromittierung', 'epp auth code', 'e-mail-abfangen', 'google vietnam hijack', 'domain-sicherheit', 'registrar lock']
---

Am Morgen des 25. Februar 2015 führte der meistgeklickte Link im Internet für den weltgrößten PC-Hersteller auf eine Diashow von gelangweilten Teenagern, die in ihre Webcams starrten – untermalt von einem Song aus *High School Musical*. Niemand hatte auch nur einen einzigen Lenovo-Server gehackt. Niemand hatte ein Lenovo-Passwort gestohlen. Die Angreifer berührten weder das Gebäude, das Netzwerk noch die Website selbst.

Sie änderten einen einzigen Eintrag beim Domainregistrar des Unternehmens – und das reichte aus, um Lenovos Eingangstür zu übernehmen, seine E-Mails umzuleiten und die [Marke](/de/glossary/trademark/) für einen Nachmittag zur Lachnummer zu machen.

Dies ist **Domain Mayday EP17**: der Lenovo.com-DNS-Hijack. In Zahlen ist es eine kleine Geschichte – ein paar Stunden Ausfall, keine kompromittierten Produktionssysteme, keine geleakte Kundendatenbank. Aber es ist eine der saubersten Demonstrationen, die je gezeigt wurden, einer Lektion, die die meisten Unternehmen immer noch falsch verstehen: Ihre Domain ist nur so sicher wie der [Registrar](/de/glossary/registrar/), der sie verwaltet – und dieser Registrar befindet sich so gut wie nie innerhalb Ihres Sicherheitsprogramms.

## Ein Hardware-Riese, dessen Domain sein Gesicht ist

Bis 2015 war Lenovo der [weltgrößte PC-Hersteller](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer) und lieferte mehr Laptops und Desktops als jedes andere Unternehmen der Welt. Für ein Unternehmen dieser Größe ist lenovo.com kein Marketing-Asset. Es ist das tragende Zentrum des gesamten Betriebs: der Ort, an dem Kunden kaufen, Support-Tickets eingehen, Garantieregistrierungen abgewickelt werden – und entscheidend – die Domain hinter jeder `@lenovo.com`-E-Mail-Adresse im Unternehmen.

Wenn eine Marke diese Größenordnung erreicht, hört die Domain auf, eine Website-Adresse zu sein, und wird zu Infrastruktur. Jede Pressemitteilung, jede Einzelhandelsverpackung, jede Mitarbeiter-Signatur, jede Bestellbestätigung läuft durch sie hindurch. Das bedeutet: Wer die DNS der Domain kontrolliert, kontrolliert nicht nur die Website, sondern die *Wahrheit* darüber, wohin lenovo.com zeigt – sowohl für Browser als auch für Mailserver.

Das war die Beute, auf die Lizard Squad abzielte. Nicht die Website. Der Zeiger darauf.

## 25. Februar 2015: die bizarre Umleitung

![Lebhaftes, farbenfrohs Konzeptbild einer Unternehmens-Glasfassade, deren beleuchtetes Schild über Nacht gegen eine grelle Streichbillboard ausgetauscht wurde, in Neonpink und Elektrikblau, eine Menge schaut verwirrt hoch, keine Markenlogos](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

Beginnend an jenem Nachmittag gelangten Besucher, die lenovo.com eintippten, nicht zu Lenovo. Die Seite war durch eine [Diashow mit Webcam-Fotos von Kindern, die an ihren Computern saßen](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), ersetzt worden – leer und leicht verlegen dreinschauend, alles unterlegt mit den Klängen von ["Breaking Free"](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) aus *High School Musical*. The Register beschrieb dieselbe Szene als [Diashow von Webcam-Fotos einer gelangweilt aussehenden Jugendlichen](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth) anstelle des normalen Sortiments des Unternehmens.

Es war bewusst absurd – und die Absurdität war der Punkt. Dies war kein stiller Datendiebstahl, der verborgen bleiben sollte. Es war eine öffentliche Demütigung, inszeniert auf der sichtbarsten URL, die das Unternehmen besaß.

Die Zuschreibung war offen sichtbar. Das HTML der Ersatzseite schrieb den „neu und verbessert umbenannten" Build [Ryan King und Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) zu – zwei Namen, die Internet-Detektive schnell mit Lizard Squad in Verbindung brachten, derselben Crew, die die vorangegangene Ferienzeit damit verbracht hatte, PlayStation Network und Xbox Live vom Netz zu nehmen. Die Gruppe übernahm die Verantwortung auf Twitter und zitierte zur Bekräftigung die *High School Musical*-Texte zurück an Lenovo.

Und dann wurde es schlimmer als peinlich. Weil die Angreifer die DNS von lenovo.com kontrollierten, besaßen sie nicht nur die Website – sie besaßen die E-Mail. Wie ein Nachrichtenportal es formulierte, [bedeutete der Hijack, dass E-Mails von Lenovo abgefangen werden konnten](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), bis die Umleitung abgeschaltet wurde. Lizard Squad veröffentlichte später zwei Nachrichten, [die an Lenovo-Mitarbeiter geschickt worden waren](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails), während sie die Kontrolle hielten. Eine davon bezog sich mit grimmigem komödiantischem Timing auf einen Lenovo Yoga Laptop, der [„gebrickt" worden war](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked), als ein Kunde versuchte, Lenovos eigenes Tool zum Entfernen einer Software namens Superfish zu verwenden.

Dieses Detail ist das gesamte Motiv in einem Satz.

## Der Superfish-Hintergrund

Um zu verstehen, warum ausgerechnet Lenovo, muss man fünf Tage zurückblättern.

Superfish war Adware, die Lenovo [seit September 2014 mit einigen seiner Computer bündelte](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014). Auf den ersten Blick war es nur ein Ad-Injektor – Software, die zusätzliche Shopping-Anzeigen in den Browser einschleuste. Die Art und Weise, wie es funktionierte, war jedoch katastrophal. Um Anzeigen in verschlüsselte Seiten einzuschleusen, installierte Superfish ein eigenes Root-Zertifikat, damit es [Anzeigen auch auf verschlüsselten Seiten einführen](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages) konnte – mit anderen Worten, es brach das Schloss, das HTTPS schützt.

Noch schlimmer: Das Zertifikat verwendete auf jedem Gerät denselben privaten Schlüssel, und dieser Schlüssel war knackbar. Jeder Angreifer, der ihn extrahierte, konnte *jede* HTTPS-Website gegenüber *jedem* Lenovo-Laptop, auf dem Superfish lief, imitieren. Dies war kein theoretischer Fehler. Am [20. Februar 2015 riet das US-Ministerium für Innere Sicherheit zur Deinstallation](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it) von Superfish und seinem Root-Zertifikat.

So hatte ein Unternehmen, das [Sicherheit](/de/glossary/collateral/) und Vertrauen an Unternehmen verkaufte, innerhalb einer Woche Millionen von Laptops mit einer eingebauten Man-in-the-Middle-Schwachstelle ausgeliefert – und dann mit ansehen müssen, wie das eigene Entfernungstool mindestens einen Kunden-PC schrottet. Lizard Squads Hijack wurde als Protest gerahmt – ein [Vorgeschmack auf die eigene Medizin](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=sparked%20online%20uproar%20following%20the%20discovery%20of%20adware%20called%20Superfish) nach dem Superfish-Aufschrei. Die Webcam-Diashow war Theater. Die Botschaft war: *Ihr habt die Verschlüsselung für eure Kunden gebrochen, also brechen wir eure Eingangstür für euch.*

## Wie es passierte: Der Registrar war der schwache Punkt

![Lebhaftes, farbenfrohs Konzeptbild eines gekaperten Kontrollpanels mit glühenden Routing-Reglern und Schaltern, eine schemenhafte Hand leitet die Eingangstür und Mail-Leitungen einer Marke auf einen neuen neonbeleuchteten Pfad um, in Elektrik-Blaugrün und Magenta, keine Markenlogos](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

Hier ist der Teil, der CISOs schlaflose Nächte bereiten sollte: Lenovos eigene Infrastruktur wurde nie kompromittiert.

Die Angreifer griffen stattdessen den Registrar an. Sicherheitsanalysten verfolgten den Hijack zurück auf eine Kompromittierung von **Web Commerce Communications** – besser bekannt als **Webnic.cc**, ein in Malaysia ansässiger Registrar. Wie Help Net Security es formulierte: Die Hacker kompromittierten nicht Lenovos Server, sondern [die von Web Commerce Communications (Webnic.cc)](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/), dem Registrar, bei dem die Lenovo-Domain registriert war.

Dies war nicht Webnics erste schwierige Woche. Nur zwei Tage zuvor war Googles vietnamesische Domain auf dieselbe Weise umgeleitet worden. SecurityWeek fasste die Verbindung knapp zusammen: Lizard Squad [kaperte die DNS-Einträge von Google Vietnam und Lenovo, nachdem es die Systeme von WebNIC](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/), einem in Malaysia ansässigen Registrar, kompromittiert hatte. Brian Krebs berichtete, unter Berufung auf die Forscher, die den Fall untersuchten, dass [beide Hijacks möglich waren, weil die Angreifer die Kontrolle über Webnic.cc übernahmen](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=both%20hijacks%20were%20possible%20because%20the%20attackers%20seized%20control%20over%20Webnic.cc) – einem Registrar, der laut demselben Bericht diese zwei Domains und 600.000 weitere verwaltete.

Die Mechanik, aus Krebs' Berichterstattung, liest sich wie ein Lehrbuch dafür, warum ein Registrar ein lohnendes Ziel ist:

- **Der Einstieg.** Lizard Squad nutzte eine [Command-Injection-Schwachstelle in Webnic.cc, um ein Rootkit hochzuladen](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) – wodurch sie dauerhaften, versteckten Zugang zu den Systemen des Registrars erhielten.
- **Die Generalschlüssel.** Sie [erlangten auch Zugang zu Webnics Vorrat an](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of) „Auth-Codes" – den EPP-Transfer-Geheimnissen, die *jede* Domain zu einem anderen Registrar transferieren können.
- **Die Umleitung.** Mit der Kontrolle auf Registrar-Ebene änderten sie die [Nameserver](/de/glossary/nameserver/)-Einträge von lenovo.com. The Register bemerkte, dass die [Nameserver-Einstellungen der Domain heute verdächtigerweise aktualisiert wurden, um auf DNS-Server zu zeigen, die dem Webhosting-Unternehmen CloudFlare gehören](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare) – Cloudflare wurde genutzt, um den eigentlichen Zielserver zu verschleiern.
- **Die E-Mail-Abfangaktion.** Entscheidend ist, dass sie nicht bei der Website aufhörten. Sie [änderten die Mailserver-Einträge, was es ihnen ermöglichte, Nachrichten abzufangen](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/), die an Lenovo-Adressen geschickt wurden. DNS kontrolliert mehr als den `A`-Eintrag; es kontrolliert auch den `MX`-Eintrag. Die Domain zu besitzen bedeutete, die E-Mails zu besitzen.

Dieser letzte Punkt ist derjenige, den die Leute vergessen. Eine Seitenverunstaltung ist laut und offensichtlich. Stilles E-Mail-Abfangen ist die gefährliche Hälfte eines DNS-Hijacks – und es folgt aus demselben einzelnen Akt des Änderns eines Eintrags beim Registrar.

## Reaktion und Folgen

Lenovo handelte schnell, denn es gab wenig anderes zu tun – der Fix lag beim Registrar, nicht auf seinen eigenen Servern. Das Unternehmen bestätigte, [Opfer eines Cyberangriffs](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) geworden zu sein, dessen Wirkung darin bestand, den Traffic von der Lenovo-Website umzuleiten, und es [schien den vollständigen Zugang zu seiner öffentlichen Website bis zum Abend des 25. Februar wiederhergestellt zu haben](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025). Cloudflare, das seinen Namen in der Umleitungskette fand, trennte die schädlichen Nameserver, was auch das E-Mail-Abfangen beendete.

Die umfangreichere Aufräumarbeit oblag Webnic. Ein einziger Command-Injection-Bug eines Registrars hatte zwei der wertvollsten Domains im Internet – Lenovos und eine Google-Domain – innerhalb von 48 Stunden in die Hände einer auf Stunts ausgerichteten Hackergruppe gebracht. Der Vorfall wurde zu einer ständigen Fallstudie zum Registrar-Risiko und einer Erinnerung daran, dass „600.000 andere Domains" hinter demselben kompromittierten System saßen.

Für Lenovo war der bleibende Schaden ein Reputationsschaden. Der Hijack, der nur wenige Tage nach Superfish kam, verwandelte ein ernstes Sicherheitsversagen in eine zweiaktige Geschichte: Erst brach das Unternehmen das Vertrauen seiner eigenen Kunden, dann verlor es sichtbar die Kontrolle über seinen eigenen Namen. Die Webcam-Diashow ist das, was die Leute in Erinnerung behielten, aber die Registrar-Kompromittierung war das, was tatsächlich zählte.

## Was dies lehrt: Ihr Registrar ist Ihr eigentlicher Sicherheitsperimeter

Die unbequeme Lektion von EP17 ist, dass Lenovo bei den Teilen, die es kontrollierte, vieles richtig machte – und dennoch durch den Teil, den es nicht kontrollierte, gekapert wurde.

Einige Erkenntnisse, die weit über 2015 hinaus verallgemeinerbar sind:

1. **Der Registrar befindet sich in Ihrer Vertrauensgrenze, ob Sie ihn so behandeln oder nicht.** Sie können jeden Server, den Sie besitzen, absichern und die Domain trotzdem bei einem Drittanbieter verlieren, den Sie wahrscheinlich nie sicherheitsgeprüft haben. Der Angreifer geht den Weg des geringsten Widerstands – und der Registrar ist oft weicher als Sie selbst.
2. **DNS-Kontrolle ist E-Mail-Kontrolle.** Ein Hijack ist nicht nur eine verunstaltete Homepage. Dieselbe Eintragsänderung leitet E-Mails stillschweigend um und ermöglicht Abfangen, Passwortzurücksetzungen gegen Ihre Domain und Identitätsdiebstahl. Behandeln Sie den `MX`-Eintrag als sicherheitskritisches Asset, nicht als Installationsrohr.
3. **Sperren Sie, was gesperrt werden kann.** Registrar-Sperren (Registrar-Lock / `clientTransferProhibited`), eingeschränkter Zugang zu EPP/Auth-Codes und [Registry](/de/glossary/registry/)-Level-Sperren für hochwertige Domains existieren genau um unautorisierte Nameserver- und Transfer-Änderungen zu verhindern. Sie sind kostengünstig. Der Nachteil, sie zu überspringen, ist Ihre Marke auf einer Webcam-Diashow.
4. **[DNSSEC](/de/glossary/dnssec/) erhöht den Aufwand.** Es hätte eine Registrar-Account-Übernahme allein nicht verhindert, aber signierte Zonen und überwachtes DNS machen stilles Manipulieren schwieriger unentdeckt durchzuführen.
5. **Überwachen Sie Ihr eigenes DNS auf Abweichungen.** Das Ändern von Lenovos Nameservern zu einem unerwarteten Anbieter war das Erkennungszeichen. Kontinuierliches Monitoring von NS- und MX-Einträgen verwandelt „Wir haben es erfahren, als Kunden eine Diashow sahen" in „Wir wurden alarmiert, als sich der Eintrag änderte."

Das gemeinsame Thema: Domain-Kontrolle ist ein eigenes Sicherheitsgebiet, und die meisten Unternehmen haben es an einen Anbieter ausgelagert, der nie in ihrem Bedrohungsmodell auftaucht.

## Der Namefi-Blickwinkel

![Farbenfrohe Illustration von verifizierbarem, manipulationssicherem Domain-Eigentum – eine Domain-Karte, gesichert durch ein grünes Schutzschild, einen grünen Namefi-Token und DNS-Kontinuität](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

Der Lenovo-Hijack ist im Kern ein Kontroll- und Herkunftsproblem. Der Angreifer musste nicht *Lenovo sein*; er musste lediglich das System, das lenovo.com kontrolliert, davon überzeugen, auf etwas Neues zu zeigen. Es gab keine starke, unabhängige, verifizierbare Aufzeichnung darüber, wer die Domain rechtmäßig kontrolliert – nur ein Registrar-Konto, das still durch eine Schwachstelle überwältigt werden konnte, die niemand bei Lenovo sehen konnte.

[Namefi](https://namefi.io) basiert auf der Idee, dass Domains sich wie internet-native Assets mit verifizierbarem, manipulationssicherem Eigentum verhalten sollten. Wenn die Kontrolle über eine Domain an kryptografisches Eigentum verankert ist, das prüfbar und schwer stillschweigend zu überschreiben ist – statt an ein einziges Registrar-Konto mit einem wiederherstellbaren [Auth-Code](/de/glossary/auth-code/) –, hört ein nicht autorisierter Nameserver-Tausch auf, eine stille Backend-Bearbeitung zu sein, und wird zu einem sichtbaren, beweisbaren Bruch in der Custody-Kette. Tokenisiertes Eigentum hält die Domain DNS-kompatibel, während es „Wer kontrolliert diesen Namen, und hat sich das gerade geändert?" zu einer Frage mit einer verifizierbaren Antwort macht.

Lizard Squad verwandelte die Eingangstür eines Hardware-Riesen an einem Nachmittag in einen Streich, indem sie das schwächste Glied in der Eigentumskettte ausnutzten. Die Verteidigung ist keine lautere Website. Es geht darum, das *Eigentum* am Namen selbst zu etwas zu machen, das ein Angreifer nicht still fälschen kann.

## Quellen und weiterführende Lektüre

- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- The Register — [Oh No, Lenovo! Lizard Squad on the attack, flashes swiped emails](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/)
- Engadget — [Lenovo's website hijacked, apparently by Lizard Squad](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)
- SecurityWeek — [Lizard Squad Hijacks Lenovo Website, Emails](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- BankInfoSecurity — [Lenovo Website Hijacked](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953)
- IT Security Guru — [Lizard Squad domain hijack gives control of Google Vietnam and Lenovo website](https://www.itsecurityguru.org/2015/02/26/lizard-squad-domain-hijack-gives-control-of-google-vietnam-and-lenovo-website/)
- CNBC — [Lenovo website breached, hacker group Lizard Squad claims responsibility](https://www.cnbc.com/2015/02/25/lenovo-website-breached-hacker-group-lizard-squad-claims-responsibility.html)
- We Live Security (ESET) — [Lenovo website hacked, Lizard Squad claims responsibility](https://www.welivesecurity.com/2015/02/26/lenovo-website-hacked-lizard-squad-claims-responsibility/)
- Computing — [Lenovo website hijacked by Lizard Squad after Superfish debacle](https://www.computing.co.uk/news/2397084/lenovo-website-hijacked-by-lizard-squad-after-superfish-debacle)
- Wikipedia — [Superfish](https://en.wikipedia.org/wiki/Superfish)
- CISA — [Lenovo Superfish Adware Vulnerable to HTTPS Spoofing](https://www.cisa.gov/news-events/alerts/2015/02/20/lenovo-superfish-adware-vulnerable-to-https-spoofing)
