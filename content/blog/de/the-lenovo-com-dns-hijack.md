---
title: 'Der Lenovo.com DNS-Hijack: Als Lizard Squad die Vordertür eines Hardware-Giganten übernahm'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Am 25. Februar 2015 kaperte Lizard Squad Lenovo.com durch die Kompromittierung des Registrars Webnic, leitete die Domain des weltgrößten PC-Herstellers auf eine Webcam-Slideshow um und fing dessen E-Mails ab – nur Tage nach dem Superfish-Skandal. Ein Domain Mayday Deep-Dive darüber, warum der Registrar Ihr wahrer Perimeter ist.'
keywords: ['lenovo.com dns hijack', 'lizard squad', 'webnic registrar', 'web commerce communications', 'dns hijacking', 'superfish', 'domain registrar sicherheit', 'registrar kompromittierung', 'epp auth code', 'e-mail abfangen', 'google vietnam hijack', 'domain sicherheit', 'registrar lock']
---

Am Morgen des 25. Februar 2015 führte der am häufigsten geklickte Link im Internet für den weltgrößten PC-Hersteller zu einer Slideshow gelangweilter Teenager, die in ihre Webcams starrten, untermalt von einem Song aus *High School Musical*. Niemand hatte einen einzigen Lenovo-Server gehackt. Niemand hatte ein Lenovo-Passwort gestohlen. Die Angreifer hatten das Gebäude, das Netzwerk oder die Website selbst nie berührt.

Sie änderten einen einzigen Eintrag beim Domain-Registrar des Unternehmens – und das reichte aus, um Lenovos Vordertür zu beschlagnahmen, die E-Mails umzuleiten und die Marke für einen Nachmittag zur Zielscheibe von Spott zu machen.

Das ist **Domain Mayday EP17**: der Lenovo.com DNS-Hijack. In nackten Zahlen ausgedrückt ist es eine kleine Geschichte – ein paar Stunden Ausfallzeit, keine kompromittierten Produktionssysteme, keine geleakte Kundendatenbank. Aber es ist eine der saubersten Demonstrationen einer Lektion, die die meisten Unternehmen noch immer falsch verstehen: Ihre Domain ist nur so sicher wie der Registrar, der sie verwaltet, und dieser Registrar ist fast nie Teil Ihres Sicherheitsprogramms.

## Ein Hardware-Gigant, dessen Domain sein Gesicht ist

Bis 2015 war Lenovo der [weltgrößte PC-Hersteller](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer) und lieferte mehr Laptops und Desktops aus als irgendjemand sonst auf der Welt. Für ein Unternehmen dieser Größe ist lenovo.com kein reines Marketing-Asset. Es ist das tragende Zentrum der gesamten Operation: Hier kaufen Kunden ein, hier landen Support-Tickets, hier fließen Garantieregistrierungen ein und – entscheidend – es ist die Domain hinter jeder `@lenovo.com` E-Mail-Adresse im gesamten Unternehmen.

Wenn eine Marke diese Größenordnung erreicht, ist die Domain nicht länger nur eine Website-Adresse, sondern wird zur essenziellen Infrastruktur. Jede Pressemitteilung, jede Verpackung, jede Mitarbeiterunterschrift, jede Bestellbestätigung läuft über sie. Das bedeutet: Wer das DNS der Domain kontrolliert, kontrolliert nicht nur die Website, sondern die *Wahrheit* darüber, wohin lenovo.com zeigt – für Browser und Mailserver gleichermaßen.

Das war der Preis, auf den Lizard Squad aus war. Nicht die Website. Der Wegweiser dorthin.

## 25. Februar 2015: die bizarre Umleitung

![Vivid colorful concept art of a corporate glass storefront whose illuminated sign has been swapped overnight for a garish prank billboard, neon pinks and electric blues, a crowd staring up in confusion, no brand logos](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

Ab diesem Nachmittag erreichten Besucher, die lenovo.com eintippten, Lenovo nicht mehr. Die Seite war durch eine [Slideshow mit Webcam-Bildern von Kids vor dem Computer](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) ersetzt worden, die leer und leicht verlegen dreinschauten, untermalt von den Klängen von ["Breaking Free"](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) aus *High School Musical*. The Register beschrieb dieselbe Szene als eine [Slideshow von Webcam-Fotos eines gelangweilt aussehenden Jugendlichen](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth) anstelle der üblichen Produkte des Unternehmens.

Es war bewusst absurd, und die Absurdität war genau der Sinn der Sache. Dies war kein leiser Datendiebstahl, der im Verborgenen bleiben sollte. Es war eine öffentliche Demütigung, inszeniert auf der sichtbarsten URL, die das Unternehmen besaß.

Die Täterschaft war offensichtlich. Das HTML der Ersatzseite schrieb den „neuen und verbesserten umbenannten“ Build [Ryan King und Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) zu – zwei Namen, die Internet-Ermittler schnell mit Lizard Squad in Verbindung brachten, derselben Gruppe, die in der vorangegangenen Weihnachtssaison das PlayStation Network und Xbox Live lahmgelegt hatte. Die Gruppe übernahm auf Twitter die Verantwortung und zitierte Lenovo als Draufgabe noch die Texte aus *High School Musical*.

Und dann wurde es schlimmer als nur peinlich. Da die Angreifer das DNS von lenovo.com kontrollierten, gehörte ihnen nicht nur die Website – ihnen gehörte auch der E-Mail-Verkehr. Wie ein Medium es ausdrückte, bedeutete der Hijack, dass [man in der Lage war, auch Lenovo-E-Mails abzufangen](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), bis die Umleitung abgeschaltet wurde. Lizard Squad veröffentlichte später zwei Nachrichten, [die an Mitarbeiter bei Lenovo gesendet wurden](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails), während des Zeitraums, in dem sie die Kontrolle hatten. Eine davon bezog sich mit makaberem komödiantischem Timing [auf einen Lenovo Yoga-Laptop, der „gebrickt“ (unbrauchbar gemacht) wurde](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked), als ein Kunde versuchte, Lenovos eigenes Tool auszuführen, um ein Stück Software namens Superfish zu entfernen.

Dieses Detail fasst das gesamte Motiv in einem Satz zusammen.

## Die Superfish-Hintergründe

Um zu verstehen, warum ausgerechnet Lenovo ins Visier geriet, muss man fünf Tage zurückspulen.

Superfish war Adware, die Lenovo [seit September 2014 auf einigen seiner Computer vorinstalliert hatte](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014). Auf den ersten Blick war es nur ein Ad-Injector – Software, die zusätzliche Shopping-Anzeigen in Ihren Browser schmuggelte. Aber die Art und Weise, wie sie funktionierte, war katastrophal. Um Anzeigen in verschlüsselte Seiten zu injizieren, installierte Superfish sein eigenes Root-Zertifikat, sodass es [Anzeigen sogar auf verschlüsselten Seiten einführen konnte](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages) – mit anderen Worten, es brach das Schlossymbol, das HTTPS schützt.

Schlimmer noch, das Zertifikat verwendete auf jeder Maschine denselben privaten Schlüssel, und dieser Schlüssel war knackbar. Jeder Angreifer, der ihn extrahierte, konnte *jede* HTTPS-Website gegenüber *jedem* Lenovo-Laptop mit Superfish imitieren. Dies war keine theoretische Schwachstelle. Am [20. Februar 2015 riet das US-Ministerium für Heimatschutz (DHS) zur Deinstallation](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it) der Software und ihres Root-Zertifikats.

Innerhalb einer Woche hatte also ein Unternehmen, das Sicherheit und Vertrauen an Konzerne verkaufte, Millionen von Laptops mit einer eingebauten Man-in-the-Middle-Schwachstelle ausgeliefert und musste dann mit ansehen, wie das eigene Entfernungstool mindestens den Rechner eines Kunden unbrauchbar machte. Der Hijack von Lizard Squad wurde als Protest inszeniert – um sie nach dem Superfish-Aufruhr [ihre eigene Medizin schmecken zu lassen](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=sparked%20online%20uproar%20following%20the%20discovery%20of%20adware%20called%20Superfish). Die Webcam-Slideshow war reines Theater. Die Botschaft lautete: *Ihr habt die Verschlüsselung für eure Kunden gebrochen, also brechen wir für euch eure Vordertür auf.*

## Wie es passierte: Der Registrar war die Schwachstelle

![Vivid colorful concept art of a hijacked control panel with glowing routing dials and switches, a shadowy hand rerouting a brand's front door and mail pipes down a new neon-lit path, electric teal and magenta, no brand logos](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

Hier ist der Teil, der CISOs nachts wachhalten sollte: Lenovos eigene Infrastruktur wurde nie kompromittiert.

Die Angreifer nahmen stattdessen den Registrar ins Visier. Sicherheitsanalysten führten den Hijack auf eine Kompromittierung von **Web Commerce Communications** zurück – besser bekannt als **Webnic.cc**, ein Registrar mit Sitz in Malaysia. Wie Help Net Security es ausdrückte, kompromittierten die Hacker nicht die Server von Lenovo; stattdessen [kompromittierten sie die von Web Commerce Communications (Webnic.cc)](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/), dem Registrar, bei dem die Lenovo-Domain registriert war.

Dies war nicht Webnics erste schlechte Woche. Nur zwei Tage zuvor war Googles vietnamesische Domain auf dieselbe Weise umgeleitet worden. SecurityWeek fasste den Zusammenhang unmissverständlich zusammen: Lizard Squad [kaperte Google Vietnam und Lenovo DNS-Einträge, nachdem sie die Systeme von WebNIC gehackt hatten](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/), einem in Malaysia ansässigen Registrar. Brian Krebs, der sich auf die beteiligten Forscher berief, berichtete, dass [beide Hijacks möglich waren, weil die Angreifer die Kontrolle über Webnic.cc übernommen hatten](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=both%20hijacks%20were%20possible%20because%20the%20attackers%20seized%20control%20over%20Webnic.cc) – einen Registrar, der laut demselben Bericht diese beiden Domains und 600.000 andere betreute.

Die Mechanismen lesen sich laut Krebs' Bericht wie ein Lehrbuchbeispiel dafür, warum ein Registrar ein so verlockendes Ziel ist:

- **Der Weg hinein.** Lizard Squad nutzte eine [Command-Injection-Schwachstelle in Webnic.cc, um ein Rootkit hochzuladen](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) – was ihnen dauerhaften, versteckten Zugriff auf die Systeme des Registrars verschaffte.
- **Die Hauptschlüssel.** Sie erhielten auch [Zugriff auf Webnics Speicher für](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of) „Auth-Codes“ – die geheimen EPP-Transfer-Schlüssel, mit denen *jede* Domain zu einem anderen Registrar umgezogen werden kann.
- **Die Umleitung.** Mit der Kontrolle auf Registrar-Ebene änderten sie die Nameserver-Einträge von lenovo.com. The Register bemerkte, dass die [Nameserver-Einstellungen der Domain heute verdächtigerweise aktualisiert wurden, um auf DNS-Server des Webhosting-Unternehmens CloudFlare zu verweisen](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare) – wobei Cloudflare dazu diente, den wahren Zielserver zu verschleiern.
- **Der E-Mail-Klau.** Entscheidend ist, dass sie nicht bei der Website stehen blieben. Sie [änderten Mailserver-Einträge, was es ihnen ermöglichte, Nachrichten abzufangen](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/), die an Lenovo-Adressen gesendet wurden. DNS steuert mehr als nur den `A`-Record; es steuert auch den `MX`-Record. Wer die Domain besitzt, dem gehören auch die E-Mails.

Letzterer Punkt ist der, den die Leute oft vergessen. Ein Defacement (die Verunstaltung einer Website) ist laut und offensichtlich. Lautloses E-Mail-Abfangen ist die weitaus gefährlichere Hälfte eines DNS-Hijacks – und beides resultiert aus ein und derselben Handlung: der Änderung eines Eintrags beim Registrar.

## Reaktion und Nachwirkungen

Lenovo handelte schnell, denn es gab nicht viel, was sie tun konnten – die Lösung lag beim Registrar, nicht auf ihren eigenen Servern. Das Unternehmen bestätigte, es sei [Opfer eines Cyberangriffs](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) geworden, dessen Effekt es war, den Traffic von der Lenovo-Website umzuleiten, und es [schien den vollständigen Zugriff auf seine öffentliche Website bis zum Abend des 25. Februar wiederhergestellt zu haben](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025). Cloudflare, das seinen Namen in der Umleitungskette wiederfand, kappte die bösartigen Nameserver, wodurch auch das E-Mail-Abfangen beendet wurde.

Das größere Aufräumen blieb Webnic überlassen. Ein Command-Injection-Fehler bei einem einzigen Registrar hatte zwei der wertvollsten Domains im Internet – die von Lenovo und eine Google-Property – innerhalb von 48 Stunden in die Hände einer auf Stunts fokussierten Hackergruppe gespielt. Der Vorfall wurde zur ständigen Fallstudie für Registrar-Risiken und zur bitteren Erinnerung daran, dass „600.000 andere Domains“ hinter demselben kompromittierten System lagen.

Für Lenovo war der bleibende Schaden ein Reputationsschaden. Nur wenige Tage nach Superfish machte der Hijack aus einem schwerwiegenden Sicherheitsversagen eine Zwei-Akte-Geschichte: Zuerst brach das Unternehmen das Vertrauen seiner eigenen Kunden, dann verlor es sichtbar die Kontrolle über seinen eigenen Namen. Die Webcam-Slideshow ist das, woran sich die Leute erinnern, aber die Kompromittierung des Registrars war das, was tatsächlich von Bedeutung war.

## Was uns das lehrt: Ihr Registrar ist Ihr wahrer Perimeter

Die unbequeme Lektion von EP17 ist, dass Lenovo bei den Teilen, die es kontrollierte, das meiste richtig gemacht hat – und dennoch über den Teil gekapert wurde, den es nicht kontrollierte.

Ein paar Erkenntnisse, die sich weit über das Jahr 2015 hinaus verallgemeinern lassen:

1. **Der Registrar befindet sich in Ihrer Vertrauensgrenze, ob Sie ihn so behandeln oder nicht.** Sie können jeden Ihrer eigenen Server absichern und dennoch die Domain an einen Drittanbieter verlieren, den Sie wahrscheinlich nie einer Sicherheitsprüfung unterzogen haben. Der Angreifer wählt den Weg des geringsten Widerstands – und der Registrar ist oft das leichtere Ziel als Sie selbst.
2. **DNS-Kontrolle ist E-Mail-Kontrolle.** Ein Hijack ist nicht nur eine verunstaltete Homepage. Dieselbe Änderung der Einträge leitet lautlos E-Mails um und ermöglicht das Abfangen von Nachrichten, das Zurücksetzen von Passwörtern über Ihre Domain und Identitätsdiebstahl. Behandeln Sie den `MX`-Record als ein sicherheitskritisches Asset und nicht als technische Nebensache.
3. **Sperren Sie ab, was sich absperren lässt.** Registrar-Sperren (Registrar-Lock / `clientTransferProhibited`), eingeschränkter Zugriff auf EPP/Auth-Codes und Sperren auf Registry-Ebene für hochwertige Domains existieren genau aus dem Grund, um unbefugte Änderungen an Nameservern und Transfers zu stoppen. Sie sind günstig. Der Nachteil, wenn man sie überspringt, ist Ihre Marke auf einer Webcam-Slideshow.
4. **DNSSEC treibt den Aufwand in die Höhe.** Es hätte eine Kontoübernahme beim Registrar allein nicht verhindert, aber signierte Zonen und überwachtes DNS erschweren es erheblich, lautlose Manipulationen unentdeckt durchzuführen.
5. **Überwachen Sie Ihr eigenes DNS auf Abweichungen (Drift).** Dass sich Lenovos Nameserver unerwartet auf einen anderen Anbieter änderten, war das verräterische Zeichen. Die kontinuierliche Überwachung von NS- und MX-Records verwandelt ein „Wir haben es herausgefunden, als Kunden eine Slideshow sahen“ in ein „Wir wurden alarmiert, sobald sich der Eintrag änderte“.

Das gemeinsame Thema: Domain-Kontrolle ist ein ganz eigener Sicherheitsbereich, und die meisten Unternehmen haben ihn an einen Dienstleister ausgelagert, der in ihrem Bedrohungsmodell gar nicht erst auftaucht.

## Die Perspektive von Namefi

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

Der Lenovo-Hijack ist im Kern ein Kontroll- und Herkunftsproblem (Provenance). Die Angreifer mussten nicht Lenovo *sein*; sie mussten lediglich das System, das lenovo.com kontrolliert, davon überzeugen, auf ein neues Ziel zu verweisen. Es gab keinen starken, unabhängigen, verifizierbaren Beleg dafür, wer legitimerweise die Kontrolle über die Domain hat – nur ein Registrar-Konto, das leise über eine Schwachstelle überwältigt werden konnte, die niemand bei Lenovo sehen konnte.

[Namefi](https://namefi.io) basiert auf der Idee, dass sich Domains wie internetnative Assets mit verifizierbaren, manipulationssicheren Eigentumsverhältnissen verhalten sollten. Wenn die Kontrolle über eine Domain an kryptografisches Eigentum geknüpft ist, das auditierbar und schwer lautlos zu überschreiben ist – anstatt an ein einzelnes Registrar-Konto mit wiederherstellbarem Auth-Code –, hört ein unautorisierter Nameserver-Wechsel auf, eine stille Backend-Änderung zu sein, und wird zu einem sichtbaren, nachweisbaren Bruch in der Verwahrungskette (Chain of Custody). Tokenisiertes Eigentum sorgt dafür, dass die Domain weiterhin kompatibel mit DNS bleibt, während es die Frage „Wer kontrolliert diesen Namen, und hat sich das gerade geändert?“ mit einer verifizierbaren Antwort ausstattet.

Lizard Squad hat die Vordertür eines Hardware-Giganten an einem Nachmittag in einen Streich verwandelt, indem sie das schwächste Glied in der Eigentümerkette ausnutzten. Die Verteidigung dagegen ist keine lautere Website. Es geht vielmehr darum, das *Eigentum* des Namens selbst zu etwas zu machen, das ein Angreifer nicht heimlich fälschen kann.

## Quellen und weiterführende Literatur

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