---
title: 'Der Malaysia-Airlines-DNS-Hijack: „404 — Flugzeug nicht gefunden"'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Im Januar 2015 kapert Lizard Squad das DNS von malaysiaairlines.com und ersetzt die Airline-Website durch einen Eidechse im Frack und den Spott „404 — Flugzeug nicht gefunden." Kein Server wurde kompromittiert — die Angreifer änderten einfach, wohin die Domain zeigte. Ein Domain-Mayday-Deep-Dive darüber, wie DNS zur verwundbarsten Eingangstür der Fluggesellschaft wurde.'
keywords: ['malaysia airlines dns hijack', 'lizard squad', 'cyber caliphate', '404 flugzeug nicht gefunden', 'dns hijacking', 'domain hijacking', 'registrar kompromittierung', 'webnic', 'malaysiaairlines.com', 'domain sicherheit', 'dns umleitung', 'registry lock', 'mh370']
---

Das Flugzeug wurde nie gefunden. Im Januar 2015 war auch die Website spurlos verschwunden.

Am Morgen des 26. Januar 2015 gelangte jeder, der **malaysiaairlines.com** in einen Browser eintippte, nicht zur Airline. Er landete bei einem Hacker. Die vertraute Buchungsseite war verschwunden, ersetzt durch das Bild einer Eidechse in Zylinder und Monokel und eine einzige, grausame Überschrift: **„404 — Flugzeug nicht gefunden."** Darunter: *„Gehackt von Lizard Squad — Offizielles Cyber-Kalifat."* Die Titelzeile eines Browsers zeigte schlicht: *„ISIS wird siegen."*

Es war ein Witz auf einem Friedhof. Weniger als ein Jahr zuvor war Malaysia-Airlines-Flug 370 mit 239 Menschen an Bord vom Radar verschwunden. Vier Monate danach wurde Flug 17 über der Ukraine aus dem Himmel geschossen. Jetzt hatte eine Gruppe Teenager den eigenen Schmerz der Airline in eine Pointe verwandelt — und sie direkt an der Eingangstür platziert, ohne jemals einen ihrer Server anzufassen.

Genau dieser letzte Punkt ist die eigentliche Geschichte. Malaysia Airlines wurde nicht „gehackt", wie die meisten Menschen es sich vorstellten. Die Buchungssysteme waren intakt. Die Passagierdaten blieben unangetastet. Was die Angreifer in Besitz nahmen, war etwas Grundlegenderes und, wie sich herausstellte, weit Leichteres: den **Domainnamen selbst** — die Adresse, die dem gesamten Internet mitteilt, wo „Malaysia Airlines" zu finden ist.

Dies ist ein Domain-Mayday-Fall über den Teil Ihrer Infrastruktur, über den Sie wahrscheinlich nie nachdenken — bis er plötzlich woanders hinzeigt.

## Eine Airline ist ihre Domain

Für einen globalen Carrier ist die Website keine Broschüre. Sie ist die Kasse, der Check-in-Schalter und das Callcenter — alles gebunden an eine einzige Zeichenkette: `malaysiaairlines.com`.

Jede Buchung, jedes Treueprogramm-Login, jeder „Meinen Flug verwalten"-Link in jeder Bestätigungsmail wird über diese Domain aufgelöst. Wenn ein Passagier in Kuala Lumpur oder London sie eintippt, läuft eine unsichtbare Kette ab: Der Browser fragt das Domain Name System (DNS) „Wo lebt malaysiaairlines.com?", DNS antwortet mit einer IP-Adresse, und der Browser stellt die Verbindung her. Die Marke der Airline, ihre Umsätze und das Vertrauen ihrer Kunden hängen alle an dieser einen Abfrage — und davon, dass sie die *richtige* Antwort zurückliefert.

DNS ist das Adressbuch des Internets. Für die meisten Organisationen ist es auch die am wenigsten bewachte Tür des Gebäudes. Man kann Millionen ausgeben, um Server zu härten, Datenbanken zu verschlüsseln und Mitarbeiter gegen Phishing zu schulen — und das alles nützt nichts, wenn jemand still und leise die Zeile im Adressbuch ändern kann, die besagt, wohin Ihr Name zeigt. Die Adresse umleiten, und man hat das Unternehmen umgeleitet — ohne je in das Gebäude einzubrechen.

Genau das ist passiert.

## Der Hijack: eine Eidechse, wo eine Airline war

![Lebhaftes, farbiges Konzeptbild eines leuchtenden DNS-Wegweisers auf einer Landebahn, der von einer unsichtbaren Hand umgeschaltet wird und einen Strom von Reisenden vom Abfluggate weg zu einer Sackgasse mit einem riesigen 404-Stempel umleitet, in Neon-Türkis und Magenta](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

Der Angriff war auf maximale Grausamkeit ausgelegt. Das Bild einer Eidechse in festlicher Kleidung war Lizard Squads Markenzeichen; die Gruppe hatte im Dezember zuvor [Xbox Live und das Sony PlayStation Network](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month) über die Feiertage lahmgelegt. Im Januar hatte sie sich in die Bildsprache eines „Cyber-Kalifats" gehüllt und posierte als ISIS-verbündet, obwohl Forscher diese Behauptung mit tiefer Skepsis betrachteten.

Die Website zeigte, wie Besucher feststellten, [ein Bild einer Eidechse in Zylinder und Monokel sowie den Text „404-Plane Not Found"](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27). Wikipedias Beschreibung der Gruppe schildert dieselbe Szene: Nutzer wurden [auf eine andere Seite mit dem Bild einer frackgekleideten Eidechse umgeleitet](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard), und die Seite [trug die Überschrift „404 - Plane Not Found", eine offensichtliche Anspielung auf den Verlust des Fluges MH370 im Vorjahr](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year).

Die Grausamkeit war beabsichtigt. MH370 war [am 8. März 2014 vom Radar verschwunden](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014), alle 239 Menschen an Bord wurden schließlich für tot erklärt, und die Wrackteile wurden nie eindeutig gefunden. MH17 war am [17. Juli 2014 von russisch-gestützten Kräften mit einer Buk 9M38 Boden-Luft-Rakete abgeschossen worden](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014), alle 298 Menschen an Bord kamen ums Leben. „Flugzeug nicht gefunden" auf der Homepage der Airline zu stempeln bedeutete, das schlimmste Jahr der Unternehmensgeschichte als Waffe einzusetzen — und es jedem Kunden zu präsentieren, der die Seite aufrufen wollte.

Dann kam die Drohung. Die Gruppe [twitterte, dass sie „bald Beute von den Servern von www.malaysiaairlines.com veröffentlichen" werde](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon), und postete sogar einen Screenshot, der angeblich Passagierreiserouten zeigte. Für eine Airline, die bereits in einem Jahr voller Katastrophen ertrank, war die Vorstellung, dass Kundendaten kompromittiert seien, eine eigene Art von Desaster.

## Wie es geschah: das Adressbuch, nicht das Gebäude

![Lebhaftes, farbiges Konzeptbild eines futuristischen Telefonvermittlers, der ein leuchtendes Kabel aus der richtigen Buchse zieht und es in eine gefälschte steckt, wobei Lichtströme von einer Landebahn zu einem Betrügerterminal umgeleitet werden, in elektrischen Blau- und warmem Orangeton](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

Hier liegt der technische Kern des Vorfalls — und der Grund, warum dieser Fall in eine Domain-Sicherheitsserie und nicht in eine Server-Sicherheitsverletzungsserie gehört.

Die eigene Erklärung von Malaysia Airlines, in der gesamten Berichterstattung wiederholt, traf die Unterscheidung präzise: [Malaysia Airlines bestätigt, dass sein Domain Name System (DNS) kompromittiert wurde, wobei Nutzer auf eine Hacker-Website weitergeleitet werden, wenn die URL www.malaysiaairlines.com eingegeben wird](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website). Die Airline bestand darauf, dass ihre [Website nicht gehackt wurde und dieser vorübergehende Fehler ihre Buchungen nicht beeinträchtigt und dass Nutzerdaten sicher bleiben](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured), und fügte hinzu, dass ihre [Webserver intakt sind](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact).

Beides war gleichzeitig wahr: Die Website war zerstört, *und* die Server waren in Ordnung. Die Angreifer brauchten die Server nie. Wie The Register es formulierte: [DNS-Einträge für die Website wurden manipuliert, sodass Surfer auf eine von Hackern kontrollierte Website umgeleitet werden](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site). Sie änderten den Adressbucheintrag, nicht das Gebäude, auf das er zeigte. Selbst die Bösartigkeit wurde in den Metadaten hinterlegt: Eine Whois-Abfrage zu dieser Zeit zeigte [ISIS will prevail](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail) als Titel der Website.

Wo wurde dieses Adressbuch geführt? Beim Registrar. Die Domain der Airline [scheint bei Web Commerce Communications Limited — auch bekannt als Webnic — registriert zu sein, die Niederlassungen in Singapur, Malaysia und China hat](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China). Dieser Name ist bedeutsam, denn Webnic sollte schon bald berüchtigt werden.

Einen Monat später stand derselbe Registrar im Mittelpunkt eines weit größeren Vorfalls. Wie Brian Krebs berichtete, [übernahmen Angreifer die Kontrolle über Webnic.cc, den malaysischen Registrar, der sowohl diese Domains als auch 600.000 weitere betreut](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others), und [nutzten ihren Zugang bei Webnic.cc, um die Domain Name System (DNS)-Einträge zu ändern](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records) für **Lenovo** und **Google Vietnam**. Der Mechanismus, berichtete Krebs, war eine [Command-Injection-Schwachstelle in Webnic.cc, um ein Rootkit hochzuladen](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — dauerhafter Zugang zu dem System, das kontrolliert, wohin Hunderttausende von Domains zeigen.

Man muss nicht in Google einbrechen, um google.com.vn umzuleiten. Man muss nicht in eine Airline einbrechen, um ihre Homepage umzuleiten. Man muss nur die Schicht kompromittieren, die *die Antwort besitzt* auf die Frage „Wo lebt diese Domain?" — das Registrar-Konto und die dahinterliegenden DNS-Einträge. Diese Schicht liegt außerhalb des Perimeters, den die meisten Unternehmen tatsächlich verteidigen.

## Auswirkungen und Reaktion

Für die Airline war der Schaden eher reputationsbezogen und betrieblich als datenbezogen. Kunden, die buchen oder einchecken wollten, stießen auf eine Verunstaltung. Weltweit paarten Schlagzeilen die Wörter „Malaysia Airlines" mit „gehackt" — eine Marke, die bereits in der Krise war, wurde nun mit einer Eidechse assoziiert, die sie wegen ihres verschwundenen Flugzeugs verspottete.

Die Airline bemühte sich, den Schaden zu begrenzen — auf die einzige Art, wie ein DNS-Hijack eingedämmt werden kann: indem sie durch die Schicht arbeitete, die unterwandert worden war. Sie erklärte, das Problem mit ihrem Dienstleister [gelöst zu haben](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider), und dass das [System voraussichtlich innerhalb von 22 Stunden vollständig wiederhergestellt sein werde](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours). Dieser Zeitrahmen ist selbst ein DNS-Merkmal: Selbst nachdem man die Einträge berichtigt hat, kann die falsche Antwort in Caches auf der ganzen Welt verweilen, bis sie abläuft. Ein Hijack ist schnell durchgeführt und nur langsam vollständig rückgängig zu machen.

Was die Drohung mit dem Datendump betrifft, hielt die Airline ihre Linie — Buchungen nicht beeinträchtigt, Nutzerdaten gesichert — und die katastrophale Datenpanne, mit der die Gruppe prahlte, materialisierte sich nie wie beschrieben. Aber „Wir wurden nicht wirklich angegriffen, die Angreifer kontrollierten nur fast einen ganzen Tag lang unsere gesamte öffentliche Identität" ist eine schwierige Botschaft für die Reisenden. Für einen Kunden, der auf „404 — Flugzeug nicht gefunden" starrt, ist der Unterschied zwischen einer Server-Kompromittierung und einem DNS-Hijack unsichtbar. Die Website war die Airline. Und für einen Tag gehörte die Website jemand anderem.

## Was dies über DNS als Ihre Eingangstür lehrt

Der Malaysia-Airlines-Hijack ist genau deshalb eine Lehrbuchlektion, weil im herkömmlichen Sinne *nichts kompromittiert wurde*. Die Erkenntnisse lassen sich auf fast jede Organisation im Internet übertragen:

1. **Ihre Domain ist ein einziger Ausfallpunkt, den Sie nicht allein kontrollieren.** Der Registrar hält den Haupteintrag darüber, wohin Ihr Name zeigt. Wenn die Kontosicherheit — oder die Software — des Registrars versagt, sind Ihre perfekt gehärteten Server irrelevant. Webnic bewies dies zweimal in einem Monat: einmal mit einer Airline und dann mit Google und Lenovo.

2. **Ein DNS-Hijack erfordert keinen Einbruch bei Ihnen.** Angreifer leiteten das Adressbuch um, nicht das Gebäude. Abwehrmaßnahmen, die Ihre Server, Ihren Code und Ihr Netzwerk überwachen, können einen Angriff verpassen, der vollständig auf der Namensschicht stattfindet.

3. **Sperren Sie die Einträge, die Ihren Namen verschieben können.** Registry Lock und Sperren auf Registrar-Ebene existieren genau dafür, unautorisierte Änderungen an Ihren DNS- und Nameserver-Einträgen zu verhindern — sie fügen einen manuellen, Out-of-Band-Schritt hinzu, bevor jemand Ihre Domain umzeigen kann. Bei einer hochwertigen Domain sind sie keine Option, sondern Pflicht.

4. **Greifen Sie zu DNSSEC und 2FA beim Registrar.** Starke Authentifizierung am Registrar-Konto und DNSSEC-Signierung der Zone erhöhen die Hürde für genau den stillen Eintrags-Austausch, der Malaysia Airlines verunstaltete.

5. **Die Wiederherstellung dauert länger als der Angriff.** TTLs und globale Caches bedeuten, dass ein Hijack seinen Fix überlebt. Planen Sie für das Bereinigungsfenster, nicht nur für den Patch.

Die unbequeme Zusammenfassung: Die meisten Unternehmen bewachen das Gebäude und hinterlassen einen Klebezettel an der Eingangstür, der allen mitteilt, in welches Gebäude sie gehen sollen. Ändern Sie den Zettel, und Sie haben das Unternehmen umgezogen.

## Der Namefi-Blickwinkel

![Farbenfrohe Illustration von nachweisbarem, manipulationssicherem Domain-Eigentum — eine Domain-Karte, gesichert durch ein grünes Schild, einen grünen Namefi-Token und DNS-Kontinuität](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

Der Malaysia-Airlines-Hijack ist im Kern eine Frage darüber, *wer berechtigt ist zu ändern, wohin ein Name zeigt* — und wie leicht diese Autorität auf der Registrar-Ebene still gestohlen werden kann. Der Angriff besiegte keine Kryptographie und knackte keine Datenbank. Er besiegte die weiche, kontobasierte Steuerungsebene, die die wichtigste Tatsache über eine Domain entscheidet: wohin sie aufgelöst wird.

[Namefi](https://namefi.io) basiert auf der Idee, dass Domain-Eigentum und -Kontrolle sich wie ein nachweisbares, interneteigenes Asset verhalten sollten — und nicht wie ein Eintrag in der Datenbank eines Registrars, den ein einziges kompromittiertes Konto überschreiben kann. Tokenisiertes Eigentum macht die Frage „Wer kontrolliert diese Domain, und hat sich diese Kontrolle gerade geändert?" prüfbar und manipulationssicher — bei gleichzeitiger Kompatibilität mit DNS. Die Abwehr gegen einen Hijack besteht nicht nur in stärkeren Passwörtern — es geht darum, unautorisierte Änderungen *sichtbar und nachweisbar* statt unsichtbar zu machen.

Malaysia Airlines verlor nie seine Server. Es verlor die Antwort auf eine einzige Frage — *wohin zeigt dieser Name?* — für etwa einen Tag. Das Flugzeug wurde nie gefunden. Auch die Website hätte nie verloren gehen dürfen. Die Lektion von Domain Mayday lautet: Das Adressbuch ist Teil des Perimeters, und der Tag, an dem man das vergisst, ist der Tag, an dem eine Eidechse mit Zylinder in Ihre Eingangstür einzieht.

## Quellen und weiterführende Lektüre

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
