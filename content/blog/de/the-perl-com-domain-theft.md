---
title: 'Der Perl.com-Domain-Diebstahl: Wie das 30 Jahre alte Zuhause einer Community still und heimlich gestohlen wurde'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Ende Januar 2021 wurde perl.com – ein jahrzehntealtes Zuhause der Perl-Programmier-Community – über die Kompromittierung eines Registrar-Kontos gestohlen, durch China transferiert, auf eine mit Malware in Verbindung stehende IP umgeleitet und für 190.000 $ zum Verkauf angeboten. Hier erfahren Sie, wie es passierte, wie die Domain wiedererlangt wurde und was wir daraus über die Sicherheit von Registrar-Konten lernen können.'
keywords: ['perl.com', 'perl.com Domain-Diebstahl', 'Domain-Hijacking', 'Domain-Diebstahl', 'Registrar-Konto-Kompromittierung', 'Social Engineering', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'DNS-Hijack', 'Domain-Sicherheit', 'Account Takeover', 'BizCN']
---

Manche Domains sind Infrastruktur, die zufällig wie ein Name aussieht. **perl.com** ist eine davon. Sie ist kein Marketing-Asset oder eine Marke, die jemand letztes Jahr aufgebaut hat – sie ist ein Stück Internet-Inventar, um das herum die Perl-Programmier-Community seit den Anfangstagen des Webs gelebt hat, das kanonische Eingangstor zu Dokumentationen, Artikeln und das öffentliche Gesicht der Programmiersprache.

Als dieses Eingangstor am Morgen des 27. Januar 2021 plötzlich jemand anderem gehörte, war dies kein cleverer Marken-Schachzug oder ein ausgehandelter Verkauf. Es war ein Diebstahl. Die Domain war der Kontrolle ihres rechtmäßigen Besitzers bereits Monate zuvor still und heimlich entrissen, durch verschiedene Registrare geschleust und auf eine IP-Adresse umgeleitet worden, die in der Vergangenheit bereits für die Verbreitung von Malware bekannt war. Die Netzwerkbetreiber der Community drückten es unverblümt aus: ["Die Domain perl.com wurde heute Morgen gehijackt und verweist derzeit auf eine Parking-Seite."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

Dies ist die Geschichte von EP19 in unserer Domain Mayday-Serie: Wie eine dreißig Jahre alte Community-Domain gestohlen wurde, ohne dass auch nur ein einziger Server gehackt wurde, und was nötig war, um sie zurückzubekommen.

## Eine Domain, die seit den frühen 90er Jahren gehalten wurde

Um den Diebstahl zu verstehen, muss man begreifen, wie alltäglich das Setup war – und wie genau diese Alltäglichkeit zur Schwachstelle wurde.

perl.com wurde nicht in einem gehärteten Firmentresor aufbewahrt. Sie wurde so verwaltet, wie die meisten langlebigen Domains verwaltet werden: von einer vertrauenswürdigen Person bei einem Mainstream-Registrar, Jahr für Jahr ohne großes Aufsehen verlängert. Der Redakteur der Seite, brian d foy, beschrieb die Historie später in seinem eigenen Bericht über den Vorfall: ["Diese Domain wurde in den frühen 90er Jahren registriert, Tom Christiansen erhielt kurz darauf die Kontrolle darüber und hat im Grunde einfach weiter die Registrierungsgebühren bezahlt."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

Das ist das exakte Profil eines riesigen Teils der wichtigsten Namen im Internet. Eine Person, ein Registrar-Login und drei Jahrzehnte des stillen Rechnungsbezahlens. Es funktioniert perfekt – bis genau dieses Registrar-Konto selbst zum Ziel wird.

## 27. Januar 2021: Das Eingangstor bekommt neue Schlösser

![Lebhaftes, farbenfrohes Konzeptkunstwerk eines jahrzehntealten hölzernen Community-Wegweisers, der nachts still und heimlich von seinem Pfosten abgeschraubt und weggetragen wird, vor einem leuchtenden Leiterplatten-Himmel](../../assets/the-perl-com-domain-theft-01-theft.jpg)

Der erste öffentliche Alarm kam von den Leuten, die die Infrastruktur der Perl-Community betreiben. Der Blog des Perl NOC (Network Operations Center) meldete, dass die Domain "heute Morgen" gehijackt worden sei und nun auf ein Ziel verweise, auf das sie nicht verweisen sollte. Noch schlimmer als eine einfache Parking-Seite war die Warnung der Betreiber: ["Es gibt einige Anzeichen dafür, dass eine Verbindung zu Seiten besteht, die in der Vergangenheit Malware verbreitet haben."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

brian d foy machte dies am selben Tag öffentlich bekannt. Die Berichterstattung über den Vorfall bestätigte den Zeitpunkt unmissverständlich: ["Am 27. Januar twitterte der Perl-Programmier-Autor und Perl.com-Redakteur brian d foy, dass die Domain perl.com plötzlich auf eine andere Person registriert war."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

Die Reaktion der Community war schnell und pragmatisch. Während die Wiederherstellungsarbeiten begannen, leitete das NOC die Leser auf ein Backup um: ["Wenn Sie nach den Inhalten suchen, können Sie perldotcom.perl.org besuchen."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) Der kanonische Name war weg, aber die Inhalte blieben erreichbar.

## Was auf dem Spiel stand: eine mit Malware verknüpfte IP

Eine gestohlene Domain ist proportional zu dem Vertrauen gefährlich, das sie genießt – und perl.com genoss eine Menge davon. Millionen von Entwicklern, Tutorials, CPAN-Tools und alten Links im gesamten Web verwiesen auf sie. Wer auch immer den Namen kontrollierte, kontrollierte auch, wohin sich all dieses Vertrauen auflöste.

Und der neue Besitzer leitete sie nicht auf ein harmloses Ziel um. Wie BleepingComputer dokumentierte: ["Der Domainname perl.com wurde gestohlen und verweist nun auf eine IP-Adresse, die mit Malware-Kampagnen in Verbindung gebracht wird."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

Die technischen Fingerabdrücke waren spezifisch. Die DNS-Einträge wurden so umgeschrieben, dass ["die der Domain zugewiesenen IP-Adressen von 151.101.2.132 auf die Google Cloud IP-Adresse 35.186.238[.]101 geändert wurden."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) Dieses Ziel hatte eine Vergangenheit: ["Im Jahr 2019 war die IP-Adresse 35.186.238[.]101 an eine Domain gebunden, die eine ausführbare Malware für die inzwischen nicht mehr existierende Locky-Ransomware verbreitete."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

Kombiniert man diese beiden Fakten, liegt die Gefahr auf der Hand. Ein Name, dem Entwickler reflexartig vertrauen und der plötzlich auf eine IP mit Malware-Historie verweist, ist das nahezu perfekte Setup, um genau die Art von technischem, sicherheitsbewusstem Publikum auszutricksen, das normalerweise schwer zu täuschen ist.

## Wie es passierte: das Registrar-Konto, nicht der Server

![Lebhaftes, farbenfrohes Konzeptkunstwerk eines gefälschten Besitzerwechsel-Formulars, das über einen Registry-Service-Schalter geschoben wird, ein offizieller roter Leuchtstempel, Papiere wirbeln im Neonlicht – keine Markenlogos](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

Hier ist der Teil, der diesen Vorfall eher zu einem Lehrbuchbeispiel als zu einer bloßen Randnotiz macht: Niemand hat den Webserver von perl.com gehackt, und niemand hat ein DNS-Passwort erraten. Der Angriff fand eine Ebene höher statt, beim Registrar – jenem Unternehmen, das den maßgeblichen Eintrag darüber führt, wem der Name gehört.

In seiner Nachlese (Post-Mortem) beschrieb brian d foy die Arbeitstheorie direkt: ["Wir glauben, dass es einen Social-Engineering-Angriff auf Network Solutions gab, der gefälschte Dokumente und dergleichen umfasste."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) Die Presse formulierte es ähnlich: Der Diebstahl war ["ein Social-Engineering-Angriff, der den Registrar Network Solutions davon überzeugte, die Domain-Einträge ohne gültige Autorisierung zu ändern."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

Das beunruhigendste Detail ist der Zeitplan. Die Community *bemerkte* es erst im Januar, aber die eigentliche Kompromittierung lag viel weiter zurück. Forensische Untersuchungen, die der Domain-Anwalt John Berryhill zutage förderte, verschoben das tatsächliche Datum um Monate nach hinten; wie der Bericht auf perl.com festhält: ["John Berryhill präsentierte auf Twitter einige forensische Arbeiten, die zeigten, dass die Kompromittierung tatsächlich im September stattfand."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek bestätigte die Geduld der Angreifer: ["Der Angriff, so erklärt er, fand im September 2020 statt"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) – also etwa vier Monate, bevor jemand die Auswirkungen zu sehen bekam.

Warum die lange Wartezeit? Weil die Regeln für Domain-Transfers Geduld belohnen. ["Die ICANN verbietet den Transfer einer Domain für 60 Tage nach der Aktualisierung der Kontaktinformationen."](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) Ein Angreifer, der im September im Stillen ein Registrar-Konto übernimmt, kann die Domain nicht sofort wegtransferieren – also saßen sie die Sache aus, ließen die Zeit verstreichen und machten ihren Zug, sobald die Sperre abgelaufen war.

Als sie schließlich handelten, wuschen sie den Namen durch verschiedene Registrare und über Grenzen hinweg, um die Wiederbeschaffung zu erschweren. The Register dokumentierte den ersten Sprung: ["Die Domain wurde im Dezember zum Registrar BizCN transferiert, die Nameserver wurden jedoch nicht geändert."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer verfolgte denselben Weg geografisch: Die Domain ["wurde im September 2020 gestohlen, während sie bei Network Solutions war, und am ersten Weihnachtsfeiertag zu einem Registrar in China transferiert"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day), bevor der letzte Sprung im Januar erfolgte, als ["Die Domain im Januar erneut zu einem anderen Registrar, der Key Systems GmbH, transferiert wurde."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

Und dann versuchten sie, Kasse zu machen. Nachdem der Name frisch umgezogen war, ["versuchte der unautorisierte Registrant, die Domain für 190.000 $ auf dem Domain-Marktplatz Afternic zu verkaufen."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) Ein dreißig Jahre altes Community-Asset, per Papierkram gestohlen, zum Verkauf angeboten wie ein gebrauchtes Möbelstück.

## Die Wiederherstellung: Wochenlanger Papierkram, um Papierkram rückgängig zu machen

Genau die Maschinerie, die den Diebstahl ermöglicht hatte – Registrare, Registries und Eigentumsnachweise –, war auch der einzige Weg zurück. Es gab keinen Server, den man neu absichern, und keinen Patch, den man aufspielen konnte. Jemand musste über die Kette von Registrar und Registry hinweg *beweisen*, dass Tom Christiansen der wahre Besitzer und der neue "Besitzer" ein Betrüger war.

Diese Arbeit begann innerhalb weniger Tage. Am 30. Januar meldete das Perl NOC, dass ["Network Solutions mit Tom Christiansen, dem rechtmäßigen Registranten, an der Wiederherstellung der Domain Perl.com arbeitet."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) Dieser Vorstoß ["führte letztendlich Anfang Februar zur Rückgabe der Domain an ihren vorherigen Besitzer, Tom Christiansen."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

Aber "wiederhergestellt" hieß nicht gleich "repariert". brian d foys eigene Worte fassen sowohl die Erleichterung als auch die noch unvollendete Arbeit zusammen: ["Die Domain Perl.com ist wieder in den Händen von Tom Christiansen und wir arbeiten an verschiedenen Sicherheitsupdates, damit so etwas nicht noch einmal passiert."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) Da die Domain auf eine mit Malware verknüpfte IP verwiesen hatte, hatten Sicherheitsprodukte sie auf Blacklists gesetzt und einige DNS-Resolver leiteten sie per Sinkholing ins Leere. Selbst nachdem der Registry-Eintrag wieder korrekt war, dauerte es noch weitere Wochen, bis dem Namen in den Reputationssystemen des Internets wieder vertraut wurde – ein langer Nachlauf, der die gesamte Tortur auf rund zwei Monate streckte.

Die Schlagzeile war in foys Worten fast schon untertrieben: ["Für eine Woche haben wir die Kontrolle über die Domain Perl.com verloren."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) Eine Woche aktiver Diebstahl; Monate latenter Kompromittierung davor; Wochen der Bereinigung danach.

## Was uns das über die Sicherheit von Registrar-Konten und langjährig gehaltene Domains lehrt

Der Diebstahl von perl.com ist gerade deshalb so aufschlussreich, weil dabei nichts Exotisches passiert ist. Bricht man es auf das Wesentliche herunter, sind die Lektionen unangenehm allgemein:

1. **Ihr Registrar-Konto ist das eigentliche Kronjuwel.** Jeder härtet seine Server und seinen DNS-Host. Der *Eigentumsnachweis* der Domain liegt jedoch beim Registrar, und dieses Konto ist oft durch kaum mehr geschützt als ein Passwort und ein Support-Team, das man zu Änderungen überreden kann. perl.com wurde dort gestohlen, nicht am Edge-Server.

2. **Social Engineering schlägt technische Kontrollen.** Kein Exploit, keine Malware auf der Seite des Opfers – nur ["gefälschte Dokumente und dergleichen"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.), die überzeugend genug waren, um einen echten Eintrag zu verändern. Eine Zwei-Faktor-Authentifizierung beim eigenen Login nützt nichts, wenn die *Menschen* beim Registrar dazu gebracht werden können, diese zu umgehen.

3. **Langjährig gehaltene Domains sind weiche Ziele.** Ein Name, der in den frühen 90er Jahren registriert wurde und dreißig Jahre lang auf Autopilot verlängert wird, neigt dazu, veraltete Kontaktinformationen, einen einzelnen menschlichen Fehlerpunkt (Single Point of Failure) und einen Besitzer anzusammeln, der nicht täglich den WHOIS-Eintrag überwacht. Die ruhige Stabilität ist genau das, was eine Kompromittierung im September bis zum Januar unbemerkt bleiben lässt.

4. **Die Transfer-Regeln sind ein zweischneidiges Schwert.** Die 60-tägige Transfersperre nach einem Update, die Eigentümer eigentlich *schützen* soll, wurde zum Wartezimmer des Angreifers. Geduld gepaart mit dem "Waschen" der Domain über Registrare und Grenzen hinweg verwandelte eine schnelle Lösung in eine mehrwöchige Wiederherstellungsaktion mit vielen Beteiligten.

5. **Die Wiederherstellung ist langsamer als der Diebstahl.** Um den Namen zu stehlen, brauchte es ein gefälschtes Dokument. Ihn zurückzubekommen, erforderte Registrare, eine Registry, die Beweise des rechtmäßigen Besitzers und schließlich wochenlange Arbeit, um die Reputation bei Blocklisten und Resolvern wieder aufzubauen. Ein Diebstahl ist eine einzige Transaktion; die Rückerstattung besteht aus vielen.

Die düstere Zusammenfassung: Bei einer Domain wie perl.com ist die Stärke Ihres Passworts weniger wichtig als die Frage, ob Ihr Registrar dazu gebracht werden kann, es zu ignorieren.

## Die Namefi-Perspektive

![Bunte Illustration eines überprüfbaren, manipulationssicheren Domain-Eigentums – eine Domain-Karte, gesichert durch ein grünes Schild, einen grünen Namefi-Token und DNS-Kontinuität](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

Jeder Schritt des perl.com-Diebstahls drehte sich um eine einzige Schwachstelle: Das Eigentum war ein *Eintrag im Konto eines anderen*, änderbar von jedem, der den richtigen Support-Mitarbeiter überzeugen konnte. Der Angreifer brauchte zu keinem Zeitpunkt die Schlüssel des Besitzers. Er brauchte das Vertrauen des Registrars – und ein gefälschtes Stück Papier reichte aus, um ein dreißig Jahre altes Asset über den gesamten Globus zu transferieren und zum Verkauf anzubieten.

[Namefi](https://namefi.io) basiert auf der gegenteiligen Prämisse: Domain-Eigentum sollte kryptografisch überprüfbar und schwer stillschweigend umzuschreiben sein. Indem die Domain-Kontrolle als tokenisiertes, On-Chain-Asset dargestellt wird, das mit DNS kompatibel bleibt, ist die maßgebliche Antwort auf die Frage „Wem gehört dieser Name?“ nicht länger eine veränderbare Zeile in der Datenbank eines Registrars, die durch einen überzeugenden Telefonanruf manipuliert werden kann. Transfers werden zu signierten, überprüfbaren Ereignissen anstatt zu Papierkram im Back-Office – und ein betrügerischer "Besitzerwechsel" findet keine stille Hintertür mehr, durch die er schlüpfen kann.

Es hätte perl.com nicht über Nacht unstehlbar gemacht; Registrare und Registries sind immer noch Teil der Kette. Aber es setzt genau an jenem Fehlermechanismus an, der diesen Vorfall definierte – der Lücke zwischen dem *dreißigjährigen Bezahlen für einen Namen* und der *Fähigkeit, manipulationssicher zu beweisen, dass er einem gehört* – und es verkleinert das Zeitfenster, in dem eine gestohlene Domain „gewaschen“ werden kann, bevor jemand Widerspruch einlegen kann.

perl.com hat sein Eingangstor zurück. Die schwierigere Frage, die diese Episode hinterlässt, ist, warum das Schloss überhaupt etwas war, das ein Fremder mit dem passenden Papierkram aufschließen konnte.

## Quellen und weiterführende Literatur

- The Perl NOC — [perl.com hijacked](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (brian d foy) — [Das Hijacking von Perl.com](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [Domain perl.com gestohlen, verwendet jetzt eine mit Malware verbundene IP-Adresse](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [Perl.com-Diebstahl auf Social-Engineering-Angriff zurückgeführt](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [Hacker kontrollierten Perl.com-Domain schon Monate vor dem Hijacking](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [Angreifer übernahmen die Domain Perl.com im September 2020](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [Domain für die beliebte Programmier-Website Perl.com in einem 'Hack' gestohlen](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [Perl.com-Domain gestohlen, nutzt jetzt IP-Adresse früherer Malware-Kampagnen](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [Die Domain perl.com wurde gehijackt](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [Perl.com-Redakteure sagen die Wahrheit über den Fall des Perl.com-Domain-Hijackings](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)