---
title: 'Der Dyn-DNS-Angriff: Als ein Mirai-Botnet aus gehackten Kameras das halbe Internet lahmlegte'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Am 21. Oktober 2016 traf ein DDoS-Angriff des Mirai-IoT-Botnets den DNS-Anbieter Dyn in drei Wellen und nahm Twitter, Netflix, Reddit, Spotify, GitHub, Airbnb und PayPal stundenlang vom Netz – eine Domain-Mayday-Fallstudie über die Konzentration von DNS-Anbietern.'
keywords: ['dyn dns angriff', 'mirai botnet', '21 oktober 2016 ddos', 'dns ddos angriff', 'iot botnet', 'dns anbieter ausfall', 'domain sicherheit', 'dns single point of failure', 'dyn ddos 2016', 'mirai malware', 'internet ausfall 2016', 'dns redundanz', 'gehackte iot kameras']
---

Für ein paar Stunden an einem Freitag im Oktober 2016 vergaß das Internet, wie es sich selbst finden konnte.

Twitter lud eine leere Seite. Netflix drehte sich im Kreis und gab auf. Reddit, Spotify, GitHub, Airbnb, PayPal – alle da, alle online, alle liefen auf ihren eigenen Servern völlig problemlos und waren dennoch komplett unerreichbar. Nichts wurde gehackt. Es wurden keine Daten gestohlen. Die Websites waren genau dort, wo sie immer gewesen waren. Was kaputt ging, war der Teil des Internets, der *Ihnen sagt, wo sich die Dinge befinden*.

Der Angriff traf nicht Twitter oder Netflix. Er traf ein Unternehmen, von dem die meisten ihrer Nutzer noch nie gehört hatten: **Dyn**, eine Firma aus New Hampshire, die DNS – das Adressbuch des Internets – für einen großen Teil des modernen Webs betrieb. Und die Waffe war keine Serverfarm oder das Arsenal eines Nationalstaates. Es war ein Schwarm von gehackten Babyfonen, Webcams und Heimroutern: gewöhnliche Haushaltsgeräte, die klammheimlich in eine Armee namens **Mirai** zwangsrekrutiert wurden.

Dies ist **Domain Mayday EP08** – der Tag, an dem unsichere Smart-Kameras das Telefonbuch des Internets lahmlegten.

## DNS: das Telefonbuch des Internets und Dyns Rolle darin

Jedes Mal, wenn Sie einen Domainnamen eingeben, muss Ihr Computer diesen in eine numerische IP-Adresse übersetzen, bevor er sich mit irgendetwas verbinden kann. Diese Übersetzung ist die Aufgabe von DNS, dem Domain Name System. Es ist die Nachschlageschicht (Lookup-Layer) zwischen dem menschenlesbaren Namen und der Maschine, auf die der Name verweist.

Dyn war einer der großen Managed-Provider für diesen Lookup-Dienst. Wenn eine Website ihr DNS an Dyn auslagerte, wurden die Nameserver von Dyn zur autoritativen Quelle für die Frage „Wo lebt diese Domain?“. The Register brachte diese Abhängigkeit während des Angriffs auf den Punkt: Indem Dyn offline gesprengt wurde, waren die von Google und ISPs betriebenen öffentlichen DNS-Resolver [nicht in der Lage, Dyn zu kontaktieren, um Hostnamen für Netzbewohner nachzuschlagen, was die Menschen daran hinderte, auf Websites zuzugreifen, die Dyn für DNS nutzten](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames).

Das ist die stille Fragilität im Zentrum dieser Geschichte. Eine Website kann makellos sein – redundante Server, perfekte Verfügbarkeit, erstklassige Ingenieure – und trotzdem aus dem Internet verschwinden, wenn der einzige Anbieter, der die Frage „Wo ist sie?“ beantwortet, ausfällt. Wie CyLab der Carnegie Mellon University später zusammenfasste, waren die betroffenen Domains [kritisch abhängig von Dyn, einem Drittanbieter-DNS. Mit anderen Worten: Sie verließen sich ausschließlich auf Dyn, als Dyn also ausfiel, fielen auch sie aus](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn).

## 21. Oktober 2016: Der Angriff kam in Wellen

![Vivid colorful concept art of a tidal wave of glowing junk traffic crashing over a giant illuminated phone-book switchboard, the directory lights flickering out across a dark map](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

Der Angriff begann am Vormittag des Freitags, 21. Oktober 2016, und traf nicht als einzelner Schlag. Er kam im Laufe des Tages in unterschiedlichen Wellen.

Der Wikipedia-Eintrag zu dem Vorfall listet [drei aufeinanderfolgende Distributed-Denial-of-Service-Angriffe](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks) auf Dyn auf, die gegen 11:10 UTC begannen. Die Mechanik war ein DDoS aus dem Lehrbuch: Der [DDoS-Angriff wurde durch zahlreiche DNS-Lookup-Anfragen von zig Millionen IP-Adressen durchgeführt](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses), wodurch die Nameserver von Dyn in so viel Datenmüll ertranken, dass legitime Abfragen nicht mehr durchkamen.

Die Wellen machten es so unerbittlich. The Register, das live berichtete, beschrieb den Moment, als sich Dyn scheinbar erholte – und es dann doch nicht tat: [Nach zwei Stunden der anfänglichen Flutwelle aus Datenmüll gab Dyn bekannt, den Angriff abgeschwächt zu haben und der Service normalisiere sich wieder. Doch die Erleichterung war nur von kurzer Dauer: Nur etwa eine Stunde später wurde der Angriff fortgesetzt](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave). Was wie das Ende aussah, war nur die Pause zwischen den Runden.

Vom reinen Volumen her war der Angriff für die damalige Zeit enorm – einer der größten DDoS-Vorfälle, die bis dahin verzeichnet wurden. The Register schätzte den Höhepunkt auf [mehr als 1 TB/s](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps). (Dyn selbst gab zu bedenken, dass ein „Wiederholungssturm“ legitimen Traffics einige frühe Schätzungen in die Höhe trieb, ein Punkt, auf den wir noch zurückkommen).

## Welche Seiten vom Netz gingen – und wie es sich anfühlte

Als die Nameserver von Dyn nicht mehr antworten konnten, weitete sich der Ausfall auf alle aus, die von ihnen abhängig waren. Das war keine dunkle Ecke des Webs. Es war die Startseite des Verbraucher-Internets.

Der Live-Bericht von The Register nannte einige der Opfer direkt: ein außergewöhnlicher, gezielter Angriff auf Dyn, der weiterhin [die Internetdienste für Hunderte von Unternehmen störte, darunter die Online-Giganten Twitter, Amazon, AirBnB, Spotify und andere](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies). Wikipedias Liste der betroffenen Dienste liest sich wie ein Who-is-Who der größten Seiten dieser Ära: [Airbnb, Amazon.com, CNN, GitHub, Netflix, PayPal, Reddit, Spotify, Twitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb) und Dutzende weitere.

Brian Krebs, dessen eigene Website Wochen zuvor von derselben Malware getroffen worden war, beschrieb die Erfahrung der Verbraucher so: Der [Angriff begann, für Internetnutzer Probleme beim Erreichen einer Vielzahl von Websites zu verursachen, darunter Twitter, Amazon, Tumblr, Reddit, Spotify und Netflix](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter). Für normale Nutzer gab es keine Fehlermeldung, die Sinn ergab. Die Seiten luden einfach nicht – zuerst an der US-Ostküste, dann breitete sich das Problem mit den späteren Wellen aus und erreichte Nutzer in den gesamten USA und bis nach Europa.

## Wie es passierte: Eine Armee aus unsicheren Smart-Geräten

![Vivid colorful concept art of thousands of tiny smiling hacked smart-cameras, toasters and baby monitors swarming like glowing insects toward a single overloaded directory tower](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

Hier ist der Punkt, der den Dyn-Angriff zu einem Wendepunkt machte: Die Feuerkraft stammte nicht von Computern. Sie stammte von *Dingen*.

Mirai ist eine Malware, die nach Internet-of-Things-Geräten (IoT) – Kameras, Router, DVRs – sucht und sie kapert. Sie funktioniert, indem sie die lausigste Schwachstelle in Verbraucherhardware ausnutzt: das Passwort, mit dem das Gerät ausgeliefert wurde. Wie The Register es beschrieb, verbreitet sich Mirai im Web und vergrößert seine Reihen gehorsamer Zombies, indem es sich [über Telnet und SSH mit den werksseitig voreingestellten Standardpasswörtern in Geräte einloggt](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords). Krebs formulierte den Mechanismus ebenso unverblümt: Mirai [durchsucht das Web nach IoT-Geräten, die durch kaum mehr als werkseitige Standard-Benutzernamen und -Passwörter geschützt sind, und rekrutiert die Geräte dann für Angriffe](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices).

Die Geräte im Zentrum des Dyn-Angriffs waren hauptsächlich billige Webcams und DVRs. Krebs verfolgte das Botnet zurück zu [hauptsächlich kompromittierten digitalen Videorekordern (DVRs) und IP-Kameras des chinesischen Hightech-Unternehmens XiongMai Technologies](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders) – Geräte, deren Standard-Zugangsdaten in vielen Fällen [vom Nutzer nicht ohne Weiteres geändert werden können](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password), weil das Passwort fest in die Firmware programmiert war.

Zwei Dinge machten aus Mirai nicht nur ein Ärgernis, sondern eine Katastrophe. Erstens hatte der Autor der Malware [Ende September 2016 den Quellcode dafür veröffentlicht, wodurch praktisch jeder seine eigene Angriffsarmee aufbauen konnte](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it). Zweitens war die Zahl der anfälligen Geräte riesig. Dyn bestätigte die Signatur des Angriffs: Das Unternehmen konnte [bestätigen, dass ein erheblicher Teil des Angriffs-Traffics von Mirai-basierten Botnets stammte](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai), und Wikipedia beschreibt das Botnet als einen Schwarm von [mit dem Internet verbundenen Geräten – wie Druckern, IP-Kameras, Heimroutern und Babyfonen –, die mit der Mirai-Malware infiziert worden waren](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors).

## Die Nachwirkungen: Das Ausmaß des Schwarms – und die Täter

Als sich der Staub gelegt hatte, stellte sich selbst die grundlegende Frage, *wie groß* das Ausmaß war, als schwierig heraus. Dyns eigene Analyse nach dem Vorfall, durchgeführt von EVP Scott Hilton, schätzte das Botnet auf [bis zu 100.000 bösartige Endpunkte](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints) – groß, aber kleiner als die „zig Millionen IPs“, die in einigen frühen Zahlen genannt wurden. Die Diskrepanz resultierte aus einer Rückkopplungsschleife: Die bösartigen Angriffe stammten von mindestens einem Botnet, [wobei der Wiederholungssturm einen falschen Indikator für eine weitaus größere Anzahl von Endpunkten lieferte, als wir heute wissen](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20storm%20providing%20a%20false%20indicator). Mit anderen Worten: Das interneteigene automatische „Erneut versuchen“-Verhalten verstärkte das Chaos.

Die juristischen Nachwirkungen brachten eine weitere Wendung. Die drei jungen Männer hinter Mirai – Paras Jha, Josiah White und Dalton Norman – [bekannten sich schließlich schuldig für ihre Rolle bei der Erschaffung, dem Betrieb und dem Verkauf des Zugangs zum „Mirai-Botnet“](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating). Doch zum Zeitpunkt des Dyn-Angriffs hatte Jha den Quellcode bereits öffentlich zugänglich gemacht – und Staatsanwälte sowie Reporter wiesen darauf hin, dass die Dyn-Angreifer nicht zwangsläufig das ursprüngliche Trio waren. Wie CyberScoop berichtete, ist es [zum Beispiel noch unklar, wer hinter dem bisher prominentesten Mirai-Angriff gegen das Internet-Performance-Management-Unternehmen Dyn steckte](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind). Sobald die Waffe Open-Source war, konnte jeder den Abzug betätigen.

Für Dyn war der geschäftliche Schaden real: In den folgenden Monaten zogen Tausende von Domains ihr DNS ab – eine teure Lektion in Sachen Kundenvertrauen nach einem einzigen schlechten Tag.

## Was uns das über die Konzentration von DNS-Anbietern lehrt

Der Dyn-Angriff bleibt als eine IoT-Sicherheitsgeschichte in Erinnerung, und das ist sie auch. Aber die tiefere Lehre betrifft die *Architektur*: Die Gefahr, zu viel vom Internet durch ein einziges Nadelöhr zu leiten.

Jede Website, die am 21. Oktober offline ging, hatte dieselbe scheinbar vernünftige Entscheidung getroffen – das DNS an einen einzigen exzellenten Anbieter auszulagern. Individuell gesehen war das klug. Kollektiv bedeutete es, dass der Ausfall eines Unternehmens einen beträchtlichen Teil des Webs auf einen Schlag auslöschen konnte. Das Urteil von CyLab lautete, dass die Lehren aus dem Angriff [selbst Jahre später nur von einer Handvoll direkt betroffener Websites umgesetzt wurden](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful).

Die defensive Antwort lautet Redundanz: die Verteilung des autoritativen DNS auf mehr als einen Anbieter, sodass kein einzelner Ausfall fatal ist. Zwei Jahre nach Dyn stellte The Register fest, dass dies immer noch selten und schwierig war – Cricket Liu von Infoblox bemerkte, dass es [zum Beispiel nicht einfacher geworden ist, mehrere autoritative DNS-Anbieter zu nutzen (etwa Dyn plus Verisign oder Neustar). Die Möglichkeit, mehrere Anbieter zu nutzen, würde einen großen Unterschied machen](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers). Die wichtigsten Erkenntnisse für jeden, der von einer Domain abhängig ist:

1. **Eine Domain hat mehr Fehlerquellen als ihren Registrar.** Der Anbieter, der antwortet: „Wohin verweist dieser Name?“, ist genauso tragend wie die Server dahinter.
2. **Ein einzelner DNS-Anbieter ist ein Single Point of Failure.** Eine hervorragende Verfügbarkeit unter normalen Bedingungen sagt nichts über das Verhalten bei einer Flut von 1 TB/s aus.
3. **Konzentration ist bequem und fragil.** Dieselbe Effizienz, die einen Anbieter attraktiv macht, sorgt dafür, dass sein Ausfall weithin spürbar ist.
4. **Widerstandsfähigkeit (Resilienz) ist eine Eigenschaft des Eigentums, nicht nur des Hostings.** Wenn etwas kaputtgeht, müssen Sie die Konfiguration Ihrer Domain sauber genug kontrollieren können, um schnell umzuleiten.

## Die Namefi-Perspektive

![Colorful illustration of verifiable, resilient domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

Beim Dyn-Angriff wurde keine einzige Domain gestohlen. Es wurde kein Transfer gefälscht oder ein Registrar-Konto gekapert. Und doch verloren die Leute, denen diese Domains *gehörten*, für einige Stunden praktisch die Kontrolle darüber, wohin ihre Namen verwiesen – nicht, weil ihre Eigentumsrechte in Frage standen, sondern weil die operative Schicht unter ihren Domains auf einen Schlag versagte.

Genau diese Lücke – zwischen dem *Besitz* eines Namens und der *zuverlässigen Kontrolle* darüber, wohin er auflöst – ist die Schwachstelle, die Angriffe wie dieser ausnutzen. Domains gehören zu den wertvollsten Vermögenswerten eines Unternehmens, dennoch befindet sich ihre Kontrolle oft hinter einer undurchsichtigen, zentralisierten Infrastruktur, die der Eigentümer weder überprüfen noch unter Druck schnell neu konfigurieren kann.

[Namefi](https://namefi.io) basiert auf der Idee, dass sich Domains wie internetnative Vermögenswerte verhalten sollten: ein Eigentum, das kryptografisch verifizierbar und portabel ist, während es vollständig mit DNS kompatibel bleibt. Verifizierbares, vom Eigentümer kontrolliertes Domain-Eigentum hält zwar kein Botnet auf – aber es treibt die Welt in Richtung eines Internets, in dem die Kontrolle über einen Namen nachweisbar und überprüfbar ist und nicht stillschweigend vom schlimmsten Tag eines einzigen Anbieters abhängt. Der Mirai-Dyn-Angriff ist eine Erinnerung daran, dass eine Domain, die Sie „besitzen“, nur so widerstandsfähig ist wie die Schicht, die für sie antwortet. Resilienz beginnt damit, Eigentum und Kontrolle zu etwas zu machen, das Sie auch tatsächlich verifizieren können.

## Quellen und weiterführende Literatur

- Krebs on Security — [Hacked Cameras, DVRs Powered Today's Massive Internet Outage](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/)
- Wikipedia — [DDoS attacks on Dyn](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn)
- The Register — [DNS devastation: Top websites whacked offline as Dyn dies again](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/)
- The Register — [Today the web was broken by countless hacked devices: your 60-second summary](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/)
- The Register — [Mirai, Mirai, pwn them all: who's the greatest botnet on the whole?](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/)
- The Register — [In the two years since Dyn went dark, what have we learned? Not much, it appears](https://www.theregister.com/2018/10/11/dns_insecurity_survey/)
- BankInfoSecurity — [Botnet Army of 'Up to 100,000' IoT Devices Disrupted Dyn](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486)
- Carnegie Mellon CyLab — [Four years since the Mirai-Dyn attack… is the Internet safer?](https://cylab.cmu.edu/news/2020/10/30-dynattack.html)
- CyberScoop — [Three men plead guilty for roles in Mirai botnet empire](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/)