---
title: 'Der DNS-Hijack bei Malaysia Airlines: "404 — Plane Not Found"'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Im Januar 2015 kaperte das Lizard Squad das DNS von malaysiaairlines.com und ersetzte die Website der Fluggesellschaft durch eine Eidechse im Smoking und die Verhöhnung „404 — Plane Not Found“. Kein Server wurde gehackt – die Angreifer änderten lediglich das Ziel der Domain. Ein „Domain Mayday“-Deep-Dive darüber, wie DNS zum ungeschütztesten Einfallstor der Airline wurde.'
keywords: ['malaysia airlines dns hijack', 'lizard squad', 'cyber caliphate', '404 plane not found', 'dns hijacking', 'domain hijacking', 'registrar kompromittierung', 'webnic', 'malaysiaairlines.com', 'domain-sicherheit', 'dns-umleitung', 'registry lock', 'mh370']
---

Das Flugzeug wurde nie gefunden. Im Januar 2015 galt das auch für die Website.

Wer am Morgen des 26. Januar 2015 **malaysiaairlines.com** in einen Browser eingab, erreichte nicht die Fluggesellschaft. Er erreichte einen Hacker. Die vertraute Buchungsseite war verschwunden, ersetzt durch das Bild einer Eidechse mit Zylinder und Monokel und einer einzigen, grausamen Überschrift: **„404 — Plane Not Found.“** Darunter: *„Hacked by Lizard Squad — Official Cyber Caliphate.“* In der Titelleiste eines Browsers stand schlicht: *„ISIS will prevail.“*

Es war ein Witz über ein Grab. Weniger als ein Jahr zuvor war Flug 370 der Malaysia Airlines mit 239 Menschen an Bord vom Radar verschwunden. Vier Monate danach wurde Flug 17 über der Ukraine vom Himmel geschossen. Nun hatte eine Gruppe von Teenagern die Trauer der Fluggesellschaft in eine Pointe verwandelt, die direkt an deren eigener Haustür serviert wurde – ohne jemals ihre Server zu berühren.

Dieser letzte Teil ist die eigentliche Geschichte. Malaysia Airlines wurde nicht in dem Sinne „gehackt“, wie es sich die meisten Menschen vorstellen. Die Buchungssysteme waren intakt. Die Passagierdaten blieben unangetastet. Was die Angreifer an sich rissen, war etwas viel Grundlegenderes und, wie sich herausstellte, viel Leichteres: der **Domainname selbst** – die Adresse, die dem gesamten Internet mitteilt, wo „Malaysia Airlines“ zu finden ist.

Dies ist ein „Domain Mayday“-Fall über den Teil Ihrer Infrastruktur, an den Sie wahrscheinlich nie denken, bis er plötzlich woandershin zeigt.

## Eine Airline ist ihre Domain

Für eine globale Fluggesellschaft ist die Website keine Broschüre. Sie ist die Kasse, der Check-in-Schalter und das Callcenter, alles gebündelt in einer einzigen Zeichenfolge: `malaysiaairlines.com`.

Jede Buchung, jedes Treueprogramm-Login, jeder „Flug verwalten“-Link in jeder Bestätigungs-E-Mail wird über diese Domain aufgelöst. Wenn ein Passagier in Kuala Lumpur oder London sie eintippt, wird eine unsichtbare Kette in Gang gesetzt: Der Browser fragt das Domain Name System (DNS) „Wo befindet sich malaysiaairlines.com?“, das DNS antwortet mit einer IP-Adresse, und der Browser stellt die Verbindung her. Die Marke der Fluggesellschaft, ihr Umsatz und das Vertrauen ihrer Kunden hängen davon ab, dass diese eine Abfrage die *richtige* Antwort liefert.

Das DNS ist das Adressbuch des Internets. Es ist für die meisten Organisationen auch die am wenigsten bewachte Tür im Gebäude. Sie können Millionen ausgeben, um Ihre Server zu härten, Ihre Datenbanken zu verschlüsseln und Ihre Mitarbeiter gegen Phishing zu schulen – und nichts davon spielt eine Rolle, wenn jemand unbemerkt die Zeile im Adressbuch ändern kann, die besagt, wohin Ihr Name zeigt. Leiten Sie die Adresse um, und Sie haben das Unternehmen umgeleitet, ohne jemals in das Gebäude einzubrechen.

Genau das ist passiert.

## Der Hijack: Eine Eidechse, wo früher eine Airline war

![Lebendiges, farbenfrohes Konzeptkunstwerk eines leuchtenden DNS-Wegweisers auf einer Startbahn, der von einer unsichtbaren Hand umgestellt wird und einen Strom von Reisenden von einem Abflug-Gate weg zu einer Sackgasse leitet, die mit einem riesigen 404-Fehler versehen ist, in Neon-Blaugrün und Magenta](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

Das Defacement (die Verunstaltung der Website) war auf maximale Grausamkeit ausgelegt. Das Bild einer Eidechse in festlicher Kleidung war das Markenzeichen des Lizard Squad; die Gruppe hatte den vorherigen Dezember damit verbracht, über die Feiertage das [Xbox Live and Sony PlayStation Network](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month) offline zu nehmen. Bis Januar hatte sie sich in die Bildsprache eines „Cyber-Kalifats“ gehüllt und sich als ISIS-verbündet inszeniert, auch wenn Forscher diese Behauptung mit großer Skepsis betrachteten.

Die Website, wie Besucher sie vorfanden, [zeigte ein Bild einer Eidechse mit Zylinder und Monokel sowie den Text „404-Plane Not Found“](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27). Der Wikipedia-Eintrag der Gruppe hält die gleiche Szene fest: Benutzer wurden [auf eine andere Seite umgeleitet, die das Bild einer Eidechse im Smoking trug](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard), und die Seite [trug die Überschrift „404 - Plane Not Found“, eine offensichtliche Anspielung auf den Verlust des Fluges MH370 der Fluggesellschaft im Vorjahr](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year).

Die Grausamkeit war der Sinn der Sache. MH370 war [am 8. März 2014 vom Radar verschwunden](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014), alle 239 Menschen an Bord wurden schließlich für tot erklärt und das Wrack nie endgültig lokalisiert. MH17 war [am 17. Juli 2014 von russisch unterstützten Streitkräften mit einer Boden-Luft-Rakete des Typs Buk 9M38 abgeschossen worden](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014), wobei alle 298 Menschen an Bord ums Leben kamen. Der Fluggesellschaft „Plane Not Found“ auf die Startseite zu stempeln, hieß, das schlimmste Jahr in der Unternehmensgeschichte als Waffe einzusetzen – und es jedem Kunden, der versuchte, die Seite zu erreichen, aufzuzwingen.

Dann kam die Drohung. Die Gruppe [twitterte, dass sie bald „einige Beute, die auf den Servern von www.malaysiaairlines.com gefunden wurde, veröffentlichen“ werde,](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon) und postete sogar einen Screenshot, der angeblich Passagier-Reisepläne zeigte. Für eine Fluggesellschaft, die ohnehin schon in einem Katastrophenjahr ertrank, war die Vorstellung, dass Kundendaten kompromittiert sein könnten, eine ganz eigene Art von Desaster.

## Wie es passierte: Das Adressbuch, nicht das Gebäude

![Lebendiges, farbenfrohes Konzeptkunstwerk eines futuristischen Telefonisten, der ein leuchtendes Kabel aus der richtigen Buchse zieht und in eine falsche steckt, wobei Ströme von Lichtverkehr von einer Startbahn zu einem falschen Terminal umgeleitet werden, in elektrischem Blau und warmem Orange](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

Hier ist der technische Kern der Sache und der Grund, warum dieser Fall eher in eine Reihe über Domain-Sicherheit als über Server-Hacks gehört.

Die eigene Erklärung von Malaysia Airlines, die in der gesamten Berichterstattung wiederholt wurde, zog die Grenze sehr präzise: [Malaysia Airlines bestätigt, dass ihr Domain Name System (DNS) kompromittiert wurde, wobei Benutzer beim Eingeben der URL www.malaysiaairlines.com auf eine Hacker-Website umgeleitet werden](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website). Die Fluggesellschaft betonte, ihre [Website sei nicht gehackt worden und diese vorübergehende Störung habe keine Auswirkungen auf ihre Buchungen, und die Benutzerdaten blieben gesichert](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured), mit dem Zusatz, dass ihre [Webserver intakt seien](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact).

Beides war gleichzeitig wahr: Die Seite war zerstört, *und* den Servern ging es gut. Die Angreifer brauchten die Server nie. Wie The Register es formulierte: [Die DNS-Einträge für die Seite wurden so manipuliert, dass Surfer auf eine von Hackern kontrollierte Seite umgeleitet werden](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site). Sie änderten den Eintrag im Adressbuch, nicht das Gebäude, auf das er zeigte. Sogar die Bösartigkeit wurde in den Metadaten abgelegt: Eine damalige Whois-Abfrage zeigte, dass [ISIS will prevail](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail) als Titel der Seite aufgeführt war.

Wo wurde dieses Adressbuch aufbewahrt? Beim Registrar. Die Domain der Fluggesellschaft [scheint bei Web Commerce Communications Limited registriert zu sein — auch bekannt als Webnic —, die Büros in Singapur, Malaysia und China unterhält](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China). Dieser Name ist wichtig, denn Webnic sollte bald berüchtigt werden.

Einen Monat später stand derselbe Registrar im Zentrum eines weitaus größeren Vorfalls. Wie Brian Krebs berichtete, [übernahmen Angreifer die Kontrolle über Webnic.cc, den malaysischen Registrar, der sowohl diese als auch 600.000 andere Domains verwaltet](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others), und [nutzten ihren Zugang bei Webnic.cc, um die Domain-Name-System-(DNS)-Einträge zu ändern](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records) – und zwar für **Lenovo** und **Google Vietnam**. Der Mechanismus, so berichtete Krebs, war eine [Befehlsinjektions-Schwachstelle (Command Injection) in Webnic.cc, um ein Rootkit hochzuladen](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — beständiger Zugang zu genau dem System, das kontrolliert, wohin Hunderttausende von Domains verweisen.

Man muss nicht bei Google einbrechen, um google.com.vn umzuleiten. Man muss nicht bei einer Fluggesellschaft einbrechen, um deren Startseite umzuleiten. Man muss nur die Ebene kompromittieren, die *die Antwort* auf die Frage „Wo befindet sich diese Domain?“ *besitzt* – das Registrar-Konto und die dahinter liegenden DNS-Einträge. Diese Ebene befindet sich außerhalb des Perimeters, den die meisten Unternehmen tatsächlich verteidigen.

## Auswirkungen und Reaktion

Für die Fluggesellschaft war der Schaden eher rufschädigend und betrieblich als ein Datendiebstahl. Kunden, die versuchten zu buchen oder einzuchecken, stießen auf eine verunstaltete Website. Weltweit brachten Schlagzeilen die Worte „Malaysia Airlines“ mit „gehackt“ in Verbindung – eine Marke, die sich ohnehin schon in der Krise befand, wurde nun mit einer Eidechse assoziiert, die sie wegen ihres verschwundenen Flugzeugs verhöhnte.

Die Fluggesellschaft handelte, um das Problem auf die einzige Weise einzudämmen, wie ein DNS-Hijack eingedämmt werden kann: indem sie über die Ebene arbeitete, die unterwandert worden war. Sie gab an, sie habe [das Problem mit ihrem Dienstanbieter gelöst](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider) und dass [das System voraussichtlich innerhalb von 22 Stunden vollständig wiederhergestellt sein wird](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours). Dieser Zeitrahmen ist an sich schon ein verräterisches Zeichen für DNS: Selbst nachdem man die Einträge korrigiert hat, kann die falsche Antwort in Caches auf der ganzen Welt verbleiben, bis sie abläuft. Ein Hijack ist schnell begangen, aber langsam vollständig rückgängig zu machen.

Bei der Androhung eines Daten-Leaks blieb die Airline bei ihrer Aussage – Buchungen seien nicht betroffen, Nutzerdaten seien sicher –, und das katastrophale Leak, mit dem die Gruppe prahlte, trat in der beschriebenen Form nie ein. Aber die Botschaft „Wir wurden nicht wirklich gehackt, die Angreifer kontrollierten nur fast einen ganzen Tag lang unsere gesamte öffentliche Identität“ lässt sich der reisenden Öffentlichkeit nur schwer vermitteln. Für einen Kunden, der auf „404 — Plane Not Found“ starrt, ist der Unterschied zwischen einem Server-Hack und einem DNS-Hijack unsichtbar. Die Website war die Fluggesellschaft. Und für einen Tag gehörte die Website jemand anderem.

## Was uns das über DNS als Ihre Haustür lehrt

Der Hijack bei Malaysia Airlines ist eine Lehrbuchlektion, gerade weil im herkömmlichen Sinne *nichts gehackt wurde*. Die Erkenntnisse lassen sich auf fast jede Online-Organisation übertragen:

1. **Ihre Domain ist ein Single Point of Failure, den Sie nicht allein kontrollieren.** Der Registrar hält den Master-Eintrag darüber, wohin Ihr Name zeigt. Wenn seine Kontosicherheit – oder seine Software – versagt, sind Ihre perfekt gehärteten Server irrelevant. Webnic bewies dies zweimal in einem Monat, erst bei einer Fluggesellschaft und dann bei Google und Lenovo.

2. **Ein DNS-Hijack erfordert keinen Einbruch bei Ihnen.** Die Angreifer haben das Adressbuch umgeleitet, nicht das Gebäude. Verteidigungsmaßnahmen, die Ihre Server, Ihren Code und Ihr Netzwerk überwachen, können einen Angriff übersehen, der vollständig auf der Namensebene stattfindet.

3. **Sperren Sie die Einträge, die Ihren Namen verschieben können.** Registry Lock und Sperren auf Registrar-Ebene existieren speziell, um unbefugte Änderungen an Ihren DNS- und Nameserver-Einträgen zu verhindern – sie fügen einen manuellen, Out-of-Band-Schritt hinzu, bevor jemand Ihre Domain umleiten kann. Für eine wertvolle Domain sind sie keine Option, sondern Pflicht.

4. **Nutzen Sie DNSSEC und 2FA beim Registrar.** Eine starke Authentifizierung für das Registrar-Konto und DNSSEC-Signierung für die Zone erhöhen die Kosten genau für den stillschweigenden Austausch von Einträgen, der Malaysia Airlines verunstaltet hat.

5. **Die Wiederherstellung ist langsamer als der Angriff.** TTLs und globale Caches bedeuten, dass ein Hijack seine Behebung überdauert. Planen Sie das Zeitfenster für die Bereinigung ein, nicht nur für den Patch.

Die unbequeme Zusammenfassung: Die meisten Unternehmen bewachen das Gebäude und hinterlassen einen Klebezettel an der Vordertür, der jedem sagt, in welches Gebäude er gehen soll. Ändert man den Zettel, hat man das Unternehmen umgezogen.

## Die Namefi-Perspektive

![Farbenfrohe Illustration von überprüfbarem, manipulationssicherem Domain-Besitz — eine Domain-Karte, gesichert durch einen grünen Schild, einen grünen Namefi-Token und DNS-Kontinuität](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

Der Hijack bei Malaysia Airlines ist im Kern eine Frage danach, *wer berechtigt ist zu ändern, wohin ein Name zeigt* – und wie leicht diese Autorität auf der Registrar-Ebene unbemerkt gestohlen werden kann. Der Angriff überwand keine Kryptografie oder knackte eine Datenbank. Er überwand die weiche, kontobasierte Kontrollebene, die über die wichtigste Tatsache einer Domain entscheidet: wohin sie auflöst.

[Namefi](https://namefi.io) basiert auf der Idee, dass sich Domainbesitz und -kontrolle wie ein überprüfbares, internetnatives Asset verhalten sollten, anstatt wie ein Zeileneintrag in der Datenbank eines Registrars, den ein einziges kompromittiertes Konto umschreiben kann. Tokenisierter Besitz macht die Frage „Wer kontrolliert diese Domain, und hat diese Kontrolle gerade den Besitzer gewechselt?“ prüfbar und manipulationssicher, während er gleichzeitig mit DNS kompatibel bleibt. Die Verteidigung gegen einen Hijack besteht nicht nur aus stärkeren Passwörtern – sie besteht darin, unbefugte Änderungen *sichtbar und beweisbar* zu machen, anstatt sie lautlos geschehen zu lassen.

Malaysia Airlines hat nie seine Server verloren. Es verlor die Antwort auf eine einzige Frage – *Wohin zeigt dieser Name?* – für etwa einen Tag. Das Flugzeug wurde nie gefunden. Auch die Website hätte niemals verloren gehen dürfen. Die Lektion von „Domain Mayday“ ist, dass das Adressbuch Teil des Perimeters ist, und an dem Tag, an dem man das vergisst, zieht eine Eidechse mit Zylinder in die eigene Haustür ein.

## Quellen und weiterführende Literatur

- TechCrunch — [Malaysia Airlines Site Hacked By Lizard Squad](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/)
- The Register — [Lizard Squad threatens Malaysia Airlines with data dump](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/)
- BankInfoSecurity — [Malaysia Airlines Website Hacked](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833)
- Computerworld — [Malaysia Airlines claim DNS hijacked, site not hacked, but attackers threaten data dump](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html)
- Infosecurity Magazine — [Malaysia Airlines Site Back Up as Hackers Threaten Data Dump](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/)
- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- ABC News — [Malaysia Airlines Hit by Lizard Squad Hack Attack](https://abcnews.go.com/Technology/malaysia-airlines-hit-lizard-squad-hack-attack/story?id=28489244)
- NBC News — [Lizard Squad Claims It Hacked Malaysia Airlines Website](https://www.nbcnews.com/storyline/isis-terror/lizard-squad-claims-it-hacked-malaysia-airlines-website-n293461)
- IT Security Guru — [Lizard Squad hijacks Malaysia Airline DNS](https://www.itsecurityguru.org/2015/01/26/lizard-squad-hijacks-malaysia-airline-dns/)
- Wikipedia — [Lizard Squad](https://en.wikipedia.org/wiki/Lizard_Squad)
- Wikipedia — [Malaysia Airlines Flight 370](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370)
- Wikipedia — [Malaysia Airlines Flight 17](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17)