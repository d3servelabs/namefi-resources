---
title: 'Der Dyn-DNS-Angriff: Als ein Mirai-Botnetz aus gehackten Kameras das halbe Internet lahmlegte'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Am 21. Oktober 2016 traf ein DDoS-Angriff des Mirai-IoT-Botnetzes den DNS-Anbieter Dyn in drei Wellen und legte Twitter, Netflix, Reddit, Spotify, GitHub, Airbnb und PayPal stundenlang lahm — eine Domain-Mayday-Fallstudie zur Konzentration auf einen einzelnen DNS-Anbieter.'
keywords: ['dyn dns angriff', 'mirai botnetz', 'ddos 21 oktober 2016', 'dns ddos angriff', 'iot botnetz', 'dns-anbieter ausfall', 'domain-sicherheit', 'dns single point of failure', 'dyn ddos 2016', 'mirai malware', 'internet ausfall 2016', 'dns redundanz', 'gehackte iot kameras']
---

Für einige Stunden an einem Freitag im Oktober 2016 hatte das Internet vergessen, wie es sich selbst findet.

Twitter zeigte eine leere Seite. Netflix drehte sich und gab auf. Reddit, Spotify, GitHub, Airbnb, PayPal — alle da, alle online, alle auf ihren eigenen Servern einwandfrei in Betrieb und trotzdem völlig unerreichbar. Nichts wurde gehackt. Keine Daten wurden gestohlen. Die Websites befanden sich genau dort, wo sie immer gewesen waren. Was zusammenbrach, war der Teil des Internets, der *Ihnen sagt, wo die Dinge sind*.

Der Angriff traf weder Twitter noch Netflix. Er traf ein Unternehmen, von dem die meisten Nutzer noch nie gehört hatten: **Dyn**, ein Unternehmen in New Hampshire, das DNS betrieb — das Adressbuch des Internets — für einen großen Teil des modernen Webs. Und die Waffe war keine Serverfarm oder ein Arsenal eines Nationalstaats. Es war ein Schwarm gehackter Babymonitore, Webcams und Heimrouter: gewöhnliche Haushaltsgeräte, still in eine Armee namens **Mirai** eingezogen.

Dies ist **Domain Mayday EP08** — der Tag, an dem unsichere Smart-Kameras das Telefonbuch des Internets zum Einsturz brachten.

## DNS: das Telefonbuch des Internets und Dyns Rolle darin

Jedes Mal, wenn Sie einen Domainnamen eingeben, muss Ihr Computer ihn in eine numerische IP-Adresse übersetzen, bevor er sich mit irgendetwas verbinden kann. Diese Übersetzung ist die Aufgabe des DNS, des Domain Name Systems. Es ist die Lookup-Schicht zwischen dem menschenfreundlichen Namen und der Maschine, auf die der Name verweist.

Dyn war einer der großen verwalteten Anbieter dieses Lookup-Dienstes. Wenn eine Website ihr DNS an Dyn auslagerte, wurden Dyns Nameserver zur maßgeblichen Quelle für die Frage „Wo lebt diese Domain?" The Register brachte die Abhängigkeit während des Angriffs auf den Punkt: Durch das Offline-Bringen von Dyn waren die öffentlichen DNS-Resolver von Google und Internetanbietern [nicht in der Lage, Dyn zu kontaktieren, um Hostnamen für Nutzer aufzulösen, was Menschen daran hinderte, auf Sites zuzugreifen, die Dyn für DNS verwenden](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames).

Das ist die stille Fragilität im Zentrum dieser Geschichte. Eine Website kann makellos sein — redundante Server, perfekte Betriebszeit, erstklassige Ingenieure — und trotzdem aus dem Internet verschwinden, wenn der eine Anbieter, der auf „Wo ist sie?" antwortet, offline geht. Wie CyLab der Carnegie Mellon University später zusammenfasste, waren die betroffenen Domains [kritisch von Dyn, einem Drittanbieter-DNS, abhängig. Mit anderen Worten: Sie verließen sich ausschließlich auf Dyn, und als Dyn ausfiel, fielen auch sie aus](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn).

## 21. Oktober 2016: Der Angriff kam in Wellen

![Lebendige, farbenfrohe Konzeptkunst einer Flutwelle aus glühendem Junk-Traffic, die über ein riesiges beleuchtetes Telefonbuch-Vermittlungssystem hereinbricht, während die Verzeichnislichter auf einer dunklen Karte erlöschen](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

Der Angriff begann am Morgen des Freitags, 21. Oktober 2016, und er traf nicht als ein einziger Schlag ein. Er kam im Laufe des Tages in deutlich getrennten Wellen.

Wikipedias Aufzeichnung des Vorfalls listet [drei aufeinanderfolgende Distributed-Denial-of-Service-Angriffe](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks) gegen Dyn auf, die gegen 11:10 UTC begannen. Die Mechanik war ein lehrbuchmäßiger verteilter Denial-of-Service: Der [DDoS-Angriff wurde durch zahlreiche DNS-Lookup-Anfragen von zig Millionen IP-Adressen ausgeführt](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses), wodurch Dyns Nameserver mit so viel Junk-Traffic überflutet wurden, dass legitime Anfragen nicht mehr durchkamen.

Die Wellen machten es besonders unerbittlich. The Register, der es live verfolgte, beschrieb den Moment, in dem Dyn sich scheinbar erholt hatte — und dann doch nicht: [Zwei Stunden nach der anfänglichen Flutwelle aus Junk-Traffic gab Dyn bekannt, den Angriff eingedämmt zu haben und der Dienst kehre zur Normalität zurück. Doch die Erleichterung war von kurzer Dauer: Etwa eine Stunde später nahm der Angriff wieder Fahrt auf](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave). Was wie das Ende aussah, war nur die Pause zwischen den Runden.

Vom reinen Volumen her war der Angriff für seine Zeit enorm — zu den größten DDoS-Ereignissen bis dahin gehörend, wobei The Register den Spitzenwert als [mehr als 1 TBps](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps) charakterisierte. (Dyn selbst warnte, dass ein „Retry-Sturm" aus legitimem Traffic einige frühe Schätzungen aufgebläht habe — ein Punkt, auf den wir noch zurückkommen werden.)

## Welche Sites dunkel wurden — und wie es sich anfühlte

Als Dyns Nameserver nicht mehr antworten konnten, breitete sich der Ausfall nach außen auf alle aus, die von ihnen abhingen. Dies war keine obskure Ecke des Webs. Es war die Startseite des Consumer-Internets.

The Registers Live-Bericht nannte einige der Betroffenen direkt: ein außerordentlicher, gezielter Angriff auf Dyn, der [Internetdienste für Hunderte von Unternehmen weiterhin störte, darunter Online-Riesen wie Twitter, Amazon, AirBnB, Spotify und andere](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies). Wikipedias Liste der betroffenen Dienste liest sich wie ein Who's-who der damals größten Sites: [Airbnb, Amazon.com, CNN, GitHub, Netflix, PayPal, Reddit, Spotify, Twitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb) und Dutzende mehr.

Brian Krebs, dessen eigene Site wenige Wochen zuvor von derselben Malware getroffen worden war, beschrieb die Benutzererfahrung: Der Angriff begann [Probleme für Internetnutzer beim Erreichen einer Reihe von Sites zu verursachen, darunter Twitter, Amazon, Tumblr, Reddit, Spotify und Netflix](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter). Für gewöhnliche Nutzer gab es keine sinnvolle Fehlermeldung. Sites luden schlicht nicht — zunächst an der US-Ostküste, dann mit den späteren Wellen weiter verbreitet, die Nutzer in den gesamten USA und bis nach Europa erreichten.

## Wie es geschah: Eine Armee unsicherer Smart-Geräte

![Lebendige, farbenfrohe Konzeptkunst von Tausenden kleiner lächelnder gehackter Smart-Kameras, Toaster und Babymonitore, die wie leuchtende Insekten auf einen einzigen überlasteten Verzeichnisturm zuschwärmen](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

Hier ist der Teil, der den Dyn-Angriff zu einem Wendepunkt machte: Die Feuerkraft kam nicht von Computern. Sie kam von *Dingen*.

Mirai ist eine Malware, die nach Internet-of-Things-Geräten sucht — Kameras, Router, DVRs — und sie kapiert. Sie funktioniert, indem sie die faulste Schwachstelle in Consumer-Hardware ausnutzt: das Passwort, mit dem das Gerät ausgeliefert wurde. Wie The Register beschrieb, verbreitet sich Mirai über das Web und vergrößert seine Reihen gehorsamer Zombies, indem es [sich mit Standard-Werkspasswörtern über Telnet und SSH in Geräte einloggt](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords). Krebs formulierte den Mechanismus ebenso direkt: Mirai [durchsucht das Web nach IoT-Geräten, die kaum mehr als durch werkseitige Standard-Benutzernamen und -passwörter geschützt sind, und zieht diese Geräte dann für Angriffe heran](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices).

Die Geräte im Herzen des Dyn-Angriffs waren größtenteils billige Webcams und DVRs. Krebs verfolgte das Botnetz auf [hauptsächlich kompromittierte digitale Videorekorder (DVRs) und IP-Kameras eines chinesischen Hightech-Unternehmens namens XiongMai Technologies](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders) zurück — Geräte, deren Standardanmeldedaten in vielen Fällen [ein Benutzer nicht sinnvoll ändern kann](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password), weil das Passwort in die Firmware einprogrammiert war.

Zwei Dinge verwandelten Mirai von einem Ärgernis in eine Katastrophe. Erstens hatte der Autor der Malware [Ende September 2016 den Quellcode veröffentlicht und damit praktisch jedem ermöglicht, seine eigene Angriffsarmee aufzubauen](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it). Zweitens war die Zahl der anfälligen Geräte enorm. Dyn bestätigte die Signatur des Angriffs: Das Unternehmen konnte [bestätigen, dass ein erhebliches Volumen an Angriffstraffic von Mirai-basierten Botnetzen stammte](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai), und Wikipedia beschreibt das Botnetz als einen Schwarm von [mit dem Internet verbundenen Geräten — wie Druckern, IP-Kameras, Heimgateways und Babymonitoren —, die mit der Mirai-Malware infiziert worden waren](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors).

## Die Nachbeben: Den Schwarm zählen — und die Täter

Als sich der Staub legte, erwies sich selbst die grundlegende Frage *wie groß war er* als schwierig zu beantworten. Dyns eigene Post-Incident-Analyse durch EVP Scott Hilton schätzte das Botnetz auf [bis zu 100.000 bösartige Endpunkte](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints) — groß, aber kleiner als die „zig Millionen von IPs", die einige frühe Zahlen suggerierten. Die Diskrepanz entstand durch eine Rückkopplungsschleife: Die bösartigen Angriffe stammten aus mindestens einem Botnetz, [wobei der Retry-Sturm einen falschen Hinweis auf eine deutlich größere Anzahl von Endpunkten lieferte, als wir heute wissen](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20storm%20providing%20a%20false%20indicator). Mit anderen Worten: Das automatische „Nochmal versuchen"-Verhalten des Internets selbst verstärkte das Chaos.

Die rechtlichen Nachbeben brachten eine überraschende Wendung. Die drei jungen Männer hinter Mirai — Paras Jha, Josiah White und Dalton Norman — bekannten sich schließlich [schuldig für ihre Rolle bei der Erstellung, dem Betrieb und dem Verkauf von Zugang zum „Mirai-Botnetz"](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating). Aber zum Zeitpunkt des Dyn-Angriffs hatte Jha den Quellcode bereits öffentlich veröffentlicht — und Staatsanwälte sowie Reporter haben sorgfältig darauf hingewiesen, dass die Dyn-Angreifer nicht notwendigerweise das ursprüngliche Trio waren. Wie CyberScoop berichtete, ist es [zum Beispiel noch nicht klar, wer hinter dem bekanntesten Mirai-verknüpften Angriff auf das Internet-Performance-Management-Unternehmen Dyn steckte](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind). Sobald die Waffe Open-Source war, konnte jeder den Abzug betätigen.

Für Dyn war der geschäftliche Schaden real: In den folgenden Monaten verlegten Tausende von Domains ihr DNS woanders hin — eine teure Lektion in Kundenvertrauen nach einem einzigen schlechten Tag.

## Was das über die DNS-Anbieter-Konzentration lehrt

Der Dyn-Angriff wird als Geschichte über IoT-Sicherheit erinnert, und das ist er auch. Aber seine tiefere Lektion betrifft die *Architektur*: die Gefahr, zu viel des Internets durch einen einzigen Engpass zu leiten.

Jede Site, die am 21. Oktober offline ging, hatte die gleiche vernünftig aussehende Entscheidung getroffen — DNS an einen einzigen hervorragenden Anbieter auslagern. Individuell klug. Kollektiv bedeutete das, dass das Ausschalten eines einzigen Unternehmens gleichzeitig einen bedeutenden Teil des Webs auslöschen konnte. CyLabs Urteil lautete, dass die Lehren aus dem Angriff [nur von einer Handvoll Websites, die direkt betroffen waren, umgesetzt wurden](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful), selbst Jahre später.

Die defensive Antwort ist Redundanz: die autoritativen DNS auf mehr als einen Anbieter zu verteilen, sodass kein einzelner Ausfall fatal ist. Zwei Jahre nach Dyn stellte The Register fest, dass dies immer noch selten und immer noch schmerzhaft war — Infoblox' Cricket Liu bemerkte, dass es [nicht einfacher geworden ist, mehrere autoritative DNS-Anbieter zu verwenden, zum Beispiel (etwa Dyn plus Verisign oder Neustar). Die Möglichkeit, mehrere Anbieter zu nutzen, würde einen großen Unterschied machen](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers). Die wichtigsten Erkenntnisse für jeden, der von einer Domain abhängt:

1. **Eine Domain hat mehr Ausfallpunkte als ihren Registrar.** Der Anbieter, der auf „Wohin zeigt dieser Name?" antwortet, trägt genauso viel Last wie die Server dahinter.
2. **DNS bei einem einzigen Anbieter ist ein Single Point of Failure.** Hervorragende Betriebszeiten unter normalen Bedingungen sagen nichts über das Verhalten bei einer 1-Tbps-Flut aus.
3. **Konzentration ist bequem und fragil.** Dieselbe Effizienz, die einen Anbieter attraktiv macht, lässt seinen Ausfall weitreichend spürbar werden.
4. **Resilienz ist eine Eigenschaft des Eigentums, nicht nur des Hostings.** Wenn etwas bricht, müssen Sie die Konfiguration Ihrer Domain sauber genug unter Kontrolle haben, um schnell umzuleiten.

## Der Namefi-Aspekt

![Farbenfrohe Illustration überprüfbaren, widerstandsfähigen Domain-Eigentums — eine Domain-Karte, gesichert durch ein grünes Schild, einen grünen Namefi-Token und DNS-Kontinuität](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

Der Dyn-Angriff stahl keine einzige Domain. Er fälschte keine Übertragung und kaperte kein Registrar-Konto. Und dennoch hatten die *Eigentümer* dieser Domains für einige Stunden faktisch die Kontrolle darüber verloren, wohin ihre Namen zeigten — nicht weil ihr Eigentum in Frage gestellt wurde, sondern weil die operative Schicht unter ihren Domains auf einmal versagte.

Diese Lücke — zwischen dem *Besitzen* eines Namens und dem *zuverlässigen Kontrollieren*, wohin er auflöst — ist genau die Naht, die Angriffe wie dieser ausnutzen. Domains gehören zu den wertvollsten Vermögenswerten eines Unternehmens, doch ihre Kontrolle sitzt oft hinter undurchsichtiger, zentralisierter Infrastruktur, die der Eigentümer weder verifizieren noch unter Druck schnell umkonfigurieren kann.

[Namefi](https://namefi.io) basiert auf der Idee, dass Domains sich wie internet-native Assets verhalten sollten: Eigentum, das kryptografisch verifizierbar und portabel ist und gleichzeitig vollständig kompatibel mit DNS bleibt. Verifizierbares, eigentümerkontrolliertes Domain-Eigentum stoppt kein Botnetz — aber es schiebt die Welt in Richtung eines Internets, in dem die Kontrolle über einen Namen nachweisbar, prüfbar und nicht still von dem schlimmsten Tag eines einzigen Anbieters abhängig ist. Der Mirai-Dyn-Angriff erinnert uns daran, dass eine Domain, die man „besitzt", nur so widerstandsfähig ist wie die Schicht, die für sie antwortet. Resilienz beginnt damit, Eigentum und Kontrolle zu etwas zu machen, das man tatsächlich verifizieren kann.

## Quellen und weiterführende Lektüre

- Krebs on Security — [Hacked Cameras, DVRs Powered Today's Massive Internet Outage](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/)
- Wikipedia — [DDoS attacks on Dyn](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn)
- The Register — [DNS devastation: Top websites whacked offline as Dyn dies again](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/)
- The Register — [Today the web was broken by countless hacked devices: your 60-second summary](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/)
- The Register — [Mirai, Mirai, pwn them all: who's the greatest botnet on the whole?](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/)
- The Register — [In the two years since Dyn went dark, what have we learned? Not much, it appears](https://www.theregister.com/2018/10/11/dns_insecurity_survey/)
- BankInfoSecurity — [Botnet Army of 'Up to 100,000' IoT Devices Disrupted Dyn](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486)
- Carnegie Mellon CyLab — [Four years since the Mirai-Dyn attack… is the Internet safer?](https://cylab.cmu.edu/news/2020/10/30-dynattack.html)
- CyberScoop — [Three men plead guilty for roles in Mirai botnet empire](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/)
