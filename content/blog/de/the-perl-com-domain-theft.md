---
title: 'Der Perl.com-Domain-Diebstahl: Wie ein 30 Jahre altes Community-Zuhause still gestohlen wurde'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
description: 'Ende Januar 2021 wurde perl.com – das jahrzehntelange Zuhause der Perl-Programmier-Community – durch einen Registrar-Account-Kompromiss gestohlen, über China übertragen, auf eine mit Malware verbundene IP-Adresse gezeigt und für 190.000 Dollar angeboten. Hier erfahren Sie, wie es passierte, wie es wiederhergestellt wurde und was es über die Sicherheit von Registrar-Accounts lehrt.'
keywords: ['perl.com', 'perl.com Domain-Diebstahl', 'Domain-Hijacking', 'Domain-Diebstahl', 'Registrar-Account-Kompromiss', 'Social Engineering', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'DNS-Hijack', 'Domain-Sicherheit', 'Account-Übernahme', 'BizCN']
relatedArticles:
  - /de/blog/the-panix-com-domain-hijack/
  - /de/blog/the-lenovo-com-dns-hijack/
  - /de/blog/the-fox-it-dns-hijack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/name-change-game-change/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/dns/
  - /de/glossary/icann/
  - /de/glossary/registry/
  - /de/glossary/tld/
---

Manche Domains sind Infrastruktur, die zufällig wie ein Name aussieht. **perl.com** ist eine davon. Es ist kein Marketing-Asset oder eine Marke, die jemand letztes Jahr aufgebaut hat – es ist ein Stück Internet-Mobiliar, um das die Perl-Programmier-Community seit den frühen Tagen des Webs gelebt hat: die kanonische Eingangstür zu Dokumentation, Artikeln und dem öffentlichen Gesicht der Sprache.

Als also am Morgen des 27. Januar 2021 diese Eingangstür plötzlich jemand anderem gehörte, war das kein cleverer Markenschachzug oder ein ausgehandelter Verkauf. Es war ein Diebstahl. Die Domain war Monate zuvor still aus den Händen ihres rechtmäßigen Besitzers herausgebrochen worden, hatte Registrare durchlaufen und zeigte auf eine [IP-Adresse](/de/glossary/ip-address/) mit einer Vergangenheit in der Verbreitung von Malware. Die Netzwerkbetreiber der Community brachten es auf den Punkt: [„Die perl.com-Domain wurde heute Morgen gekapert und zeigt derzeit auf eine Parking-Seite."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

Dies ist die Geschichte von EP19 unserer Domain Mayday-Serie: wie eine dreißig Jahre alte Community-Domain gestohlen wurde, ohne dass jemand auch nur einen einzigen Server geknackt hat – und was es kostete, sie zurückzubekommen.

## Eine Domain, die seit den frühen 90ern gehalten wurde

Um den Diebstahl zu verstehen, muss man verstehen, wie gewöhnlich die Situation war – und wie diese Gewöhnlichkeit die Schwachstelle war.

perl.com wurde nicht in einem gehärteten Unternehmenstresort aufbewahrt. Es wurde so gehalten, wie die meisten langlebigen Domains gehalten werden: von einer vertrauenswürdigen Person, bei einem gängigen [Registrar](/de/glossary/registrar/), Jahr für Jahr ohne Drama erneuert. Der Editor der Seite, brian d foy, beschrieb die Abstammung später in seinem eigenen Bericht über den Vorfall: [„Diese Domain wurde Anfang der 90er Jahre registriert, Tom Christiansen bekam kurz darauf die Kontrolle darüber und zahlte im Grunde einfach weiterhin die Registrierungsgebühren."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

Das ist das vollständige Profil eines riesigen Anteils der wichtigsten Namen im Internet. Eine Person, ein Registrar-Login und drei Jahrzehnte stilles Bezahlen der Rechnung. Es funktioniert perfekt – bis der Registrar-Account selbst zum Ziel wird.

## 27. Januar 2021: Die Eingangstür wechselt die Schlösser

![Lebendige farbenfrohe Konzeptkunst eines jahrzehntelangen hölzernen Community-Wegweisers, der nachts still von seinem Pfahl geschraubt und weggetragen wird, vor einem leuchtenden Schaltkreis-Himmel](../../assets/the-perl-com-domain-theft-01-theft.jpg)

Der erste öffentliche Alarm kam von den Menschen, die die Infrastruktur der Perl-Community betreiben. Der Perl NOC (Network Operations Center) Blog meldete, dass die Domain „heute Morgen" gekapert worden sei und nun auf etwas zeige, wo sie nicht hingehört. Schlimmer als eine einfache Parking-Seite warnten die Betreiber, dass [„es einige Signale gibt, dass es mit Seiten zusammenhängen könnte, die in der Vergangenheit Malware verteilt haben."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

brian d foy machte es noch am selben Tag öffentlich. Berichte über den Vorfall bestätigten den Zeitpunkt in klaren Worten: [„Am 27. Januar twitterte Perl-Programmierautor und Perl.com-Editor brian d foy, dass die perl.com-Domain plötzlich auf eine andere Person registriert worden sei."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

Die Reaktion der Community war schnell und pragmatisch. Während die Wiederherstellungsarbeiten begannen, leitete der NOC die Leser auf ein Backup um: [„Wenn Sie nach den Inhalten suchen, können Sie perldotcom.perl.org besuchen."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) Der kanonische Name war weg, aber die Inhalte blieben erreichbar.

## Was auf dem Spiel stand: Eine mit Malware verbundene IP

Eine gestohlene Domain ist proportional zu dem Vertrauen gefährlich, das sie trägt – und perl.com trug sehr viel. Millionen von Entwicklern, Tutorials, CPAN-Tools und alte Links im gesamten Web zeigten auf sie. Wer den Namen kontrollierte, kontrollierte, wozu all dieses Vertrauen aufgelöst wurde.

Und der neue Besitzer zeigte ihn nicht auf etwas Harmloses. Wie BleepingComputer dokumentierte, [„wurde der Domain-Name perl.com gestohlen und zeigt jetzt auf eine IP-Adresse, die mit Malware-Kampagnen in Verbindung steht."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

Die technischen Fingerabdrücke waren spezifisch. Die DNS-Einträge wurden so umgeschrieben, dass [„die der Domain zugewiesenen IP-Adressen von 151.101.2.132 zur Google Cloud IP-Adresse 35.186.238[.]101 geändert wurden."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) Dieses Ziel hatte eine Vergangenheit: [„Im Jahr 2019 war die IP-Adresse 35.186.238[.]101 mit einer Domain verbunden, die eine Malware-Ausführungsdatei für die mittlerweile aufgelöste Locky-Ransomware verteilte."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

Diese zwei Fakten kombiniert und die Gefahr ist offensichtlich. Ein Name, dem Entwickler reflexartig vertrauen, der plötzlich auf eine IP mit einer Malware-Geschichte zeigt, ist eine nahezu perfekte Grundlage, um genau die Art von technisch versiertem, sicherheitsbewusstem Publikum zu täuschen, das normalerweise schwer zu überlisten ist.

## Wie es passierte: Der Registrar-Account, nicht der Server

![Lebendige farbenfrohe Konzeptkunst eines gefälschten Eigentumswechsel-Belegs, der über einen Registry-Service-Tresen geschoben wird, ein offizieller Gummistempel leuchtet rot, Papierkram wirbelt in Neonlicht – keine Markenlogos](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

Hier ist der Teil, der diesen Vorfall zu einem Lehrbuchfall statt einer Fußnote macht: Niemand hat den Webserver von perl.com gehackt und niemand hat ein DNS-Passwort erraten. Der Angriff geschah eine Ebene höher, beim Registrar – dem Unternehmen, das den autoritativen Datensatz darüber hält, wem der Name gehört.

In seiner Nachbereitung beschrieb brian d foy die Arbeitstheorie direkt: [„Wir glauben, dass es einen Social-Engineering-Angriff auf Network Solutions gab, mit gefälschten Dokumenten und so weiter."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) Die Presse formulierte es genauso: Der Diebstahl war [„ein Social-Engineering-Angriff, der den Registrar Network Solutions überzeugte, die Einträge der Domain ohne gültige Autorisierung zu ändern."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

Das beunruhigendste Detail ist der Zeitplan. Die Community *bemerkte* es erst im Januar, aber der tatsächliche Kompromiss lag viel weiter zurück. Forensische Arbeit, die von Domain-Anwalt John Berryhill ans Licht gebracht wurde, schob das eigentliche Datum um Monate zurück; wie der perl.com-Bericht festhält, [„lieferte John Berryhill einige forensische Arbeit auf Twitter, die zeigte, dass der Kompromiss tatsächlich im September stattgefunden hatte."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek bestätigte die Geduld des Angreifers: [„Der Angriff, erklärt er, fand im September 2020 statt"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) – ungefähr vier Monate, bevor irgendjemand die Auswirkungen sah.

Warum die lange Wartezeit? Weil die Regeln für Domain-Übertragungen Geduld belohnen. [„ICANN verbietet die Übertragung einer Domain für 60 Tage nach der Aktualisierung der Kontaktinformationen."](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) Ein Angreifer, der im September still einen Registrar-Account übernimmt, kann die Domain nicht sofort wegschaffen – also wartete er, ließ die Zeit verstreichen und machte seinen Zug, sobald die Sperre ablief.

Als sie sich schließlich bewegten, wuschen sie den Namen durch Registrare und Grenzen, um die Wiederherstellung zu erschweren. The Register dokumentierte den ersten Schritt: [„Die Domain wurde im Dezember zum BizCN-Registrar übertragen, aber die Nameserver wurden nicht geändert."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer verfolgte denselben Weg geografisch: Die Domain [„wurde im September 2020 bei Network Solutions gestohlen, am Weihnachtstag zu einem Registrar in China übertragen"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day) bevor der letzte Schritt im Januar folgte, als [„die Domain erneut im Januar zu einem anderen Registrar, Key Systems, GmbH, übertragen wurde."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

Und dann versuchten sie, Kasse zu machen. Mit dem frisch verlegten Namen versuchte [„der unbefugte Registrant, die Domain für 190.000 Dollar auf dem Domain-Markt Afternic zu verkaufen."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) Ein dreißig Jahre altes Community-Asset, per Papierkram gestohlen, wie altes Mobiliar zum Verkauf angeboten.

## Die Wiederherstellung: Wochenlanger Papierkram, um Papierkram rückgängig zu machen

Dieselbe Maschinerie, die den Diebstahl ermöglicht hatte – Registrare, Registries und Eigentumseinträge –, war auch der einzige Weg zurück. Es gab keinen Server zu sichern und keinen Patch zu installieren. Jemand musste *beweisen*, durch die Registrar- und [Registry](/de/glossary/registry/)-Kette, dass Tom Christiansen der echte Eigentümer und der neue „Besitzer" ein Betrüger war.

Diese Arbeit begann innerhalb von Tagen. Bis zum 30. Januar berichtete der Perl NOC, dass [„Network Solutions mit Tom Christiansen, dem rechtmäßigen Registranten, an der Wiederherstellung der Perl.com-Domain arbeitet."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) Die Bemühungen [„führten schließlich zur Rückgabe der Domain an ihren früheren Eigentümer Tom Christiansen Anfang Februar."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

Aber „wiederhergestellt" bedeutete nicht „repariert". brian d foys eigene Formulierung erfasst sowohl die Erleichterung als auch die unvollendete Arbeit: [„Die Perl.com-Domain ist wieder in den Händen von Tom Christiansen und wir arbeiten an den verschiedenen Sicherheitsupdates, damit dies nicht noch einmal passiert."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) Da die Domain auf eine mit Malware verbundene IP gezeigt hatte, hatten Sicherheitsprodukte sie auf die schwarze Liste gesetzt und manche DNS-Resolver blockierten sie. Selbst nachdem der Registry-Eintrag korrekt war, dauerte es weitere Wochen, bis der Name in den Reputationssystemen des Internets wieder als vertrauenswürdig eingestuft wurde – ein langer Schwanz, der das gesamte Martyrium auf rund zwei Monate ausdehnte.

Die Schlagzeile, in foys Worten, war fast untertrieben: [„Für eine Woche verloren wir die Kontrolle über die Perl.com-Domain."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) Eine Woche aktiver Diebstahl; Monate latenter Kompromiss davor; Wochen der Aufräumarbeiten danach.

## Was dies über die Sicherheit von Registrar-Accounts und langgehaltene Domains lehrt

Der perl.com-Diebstahl ist genau deshalb so lehrreich, weil nichts Exotisches passierte. Auf das Wesentliche reduziert, sind die Lektionen beunruhigend allgemein:

1. **Ihr Registrar-Account ist das eigentliche Kronjuwel.** Alle härten ihre Server und ihren DNS-Host. Aber der *Eigentumseintrag* einer Domain liegt beim Registrar, und dieser Account ist oft kaum mehr als durch ein Passwort und ein Support-Team geschützt, das zu Änderungen überredet werden kann. perl.com wurde dort gestohlen, nicht am Rand.

2. **Social Engineering schlägt technische Kontrollen.** Kein Exploit, keine Malware auf der Seite des Opfers – nur [„gefälschte Dokumente und so weiter"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.), die überzeugend genug waren, um einen echten Eintrag zu verschieben. Zwei-Faktor-Authentifizierung an Ihrem eigenen Login hilft nicht, wenn die *Menschen* beim Registrar davon überzeugt werden können, sie zu umgehen.

3. **Langgehaltene Domains sind weiche Ziele.** Ein Name, der Anfang der 90er registriert und dreißig Jahre lang auf Autopilot erneuert wurde, neigt dazu, veraltete Kontaktdaten, einen einzigen menschlichen Ausfallpunkt und einen Eigentümer anzusammeln, der den [WHOIS](/de/glossary/whois/)-Eintrag nicht täglich überwacht. Stille Stabilität ist genau das, was einen September-Kompromiss bis Januar unbemerkt bleiben lässt.

4. **Die Übertragungsregeln wirken in beide Richtungen.** Die 60-tägige Übertragungssperre nach einer Aktualisierung, die Eigentümer *schützen* soll, wurde zum Wartezimmer des Angreifers. Geduld plus Wäsche über Registrare und Grenzen hinweg verwandelte eine schnelle Lösung in eine mehrparteien-, mehrwöchige Wiederherstellung.

5. **Wiederherstellung ist langsamer als Diebstahl.** Den Namen zu stehlen erforderte ein gefälschtes Dokument. Ihn zurückzubekommen erforderte Registrare, eine Registry, die Beweise des rechtmäßigen Eigentümers und dann wochenlangen Wiederaufbau der Reputation bei Blocklisten und Resolvern. Diebstahl ist eine Transaktion; Wiedergutmachung sind viele.

Die düstere Zusammenfassung: Bei einer Domain wie perl.com spielt die Stärke Ihres Passworts weniger eine Rolle als die Frage, ob Ihr Registrar dazu gebracht werden kann, es zu ignorieren.

## Der Namefi-Blickwinkel

![Farbenreiche Illustration von verifizierbarem, manipulationssicherem Domain-Eigentum – eine Domain-Karte, gesichert durch einen grünen Schild, ein grünes Namefi-Token und DNS-Kontinuität](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

Jeder Schritt des perl.com-Diebstahls drehte sich um eine Schwäche: Eigentum war ein *Eintrag im Account von jemand anderem*, der von jedem geändert werden konnte, der den richtigen Support-Agenten überzeugen konnte. Der Angreifer brauchte nie die Schlüssel des Eigentümers. Er brauchte das Vertrauen des Registrars – und ein gefälschtes Stück Papier reichte aus, um ein dreißig Jahre altes Asset um den Planeten zu übertragen und zum Verkauf anzubieten.

[Namefi](https://namefi.io) ist nach der gegenteiligen Prämisse aufgebaut: dass [Domain-Eigentum](/de/glossary/domain-ownership/) kryptografisch überprüfbar und schwer stillschweigend umzuschreiben sein sollte. Indem Domain-Kontrolle als tokenisiertes, On-Chain-Asset dargestellt wird, das mit DNS kompatibel bleibt, hört die maßgebliche Antwort auf „Wem gehört dieser Name?" auf, eine veränderliche Zeile in der Datenbank eines Registrars zu sein, die ein überzeugender Anruf kippen kann. Übertragungen werden zu signierten, prüfbaren Ereignissen statt zu Back-Office-Papierkram – und ein betrügerischer „Eigentümerwechsel" hat keine stille Tür mehr, durch die er gehen kann.

Es hätte perl.com nicht über Nacht unstehlbar gemacht; Registrare und Registries sind immer noch Teil der Kette. Aber es greift genau den Fehlermodus an, der diesen Vorfall definierte – die Lücke zwischen *dreißig Jahre lang für einen Namen bezahlen* und *in der Lage sein, manipulationssicher zu beweisen, dass er einem gehört* – und es verkleinert das Fenster, in dem eine gestohlene Domain gewaschen werden kann, bevor jemand Einspruch erheben kann.

perl.com hat seine Eingangstür zurückbekommen. Die härtere Frage, die diese Episode hinterlässt, ist, warum das Schloss jemals etwas war, das ein Fremder mit den richtigen Papieren öffnen konnte.

## Quellen und weiterführende Lektüre

- The Perl NOC — [perl.com gekapert](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (brian d foy) — [Die Entführung von Perl.com](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [Perl.com-Domain gestohlen, verwendet jetzt IP-Adresse, die mit Malware verbunden ist](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [Perl.com-Diebstahl auf Social-Engineering-Angriff zurückgeführt](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [Hacker kontrollierten die Perl.com-Domain Monate vor dem Hijack](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [Angreifer übernahmen die Perl.com-Domain im September 2020](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [Domain der beliebten Programmier-Website Perl.com in einem 'Hack' gestohlen](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [Perl.com-Domain gestohlen, verwendet jetzt IP-Adresse vergangener Malware-Kampagnen](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [Die perl.com-Domain wurde gekapert](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [Perl.com-Redakteure erzählen die Wahrheit über den Perl.com-Domain-Hijacking-Fall](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)
