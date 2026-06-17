---
title: 'Der MyEtherWallet BGP- + DNS-Angriff: Wie entführtes Internet-Routing 150.000 $ in ETH stahl'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Am 24. April 2018 entführten Angreifer das Internet-Routing für Amazon Route 53, vergifteten DNS-Antworten für myetherwallet.com und stellten einen Phishing-Klon hinter einem selbstsignierten Zertifikat bereit – wobei sie rund 150.000 US-Dollar in Ethereum erbeuteten. Ein Domain-Mayday-Deep-Dive darüber, warum DNS auf einer Routing-Schicht basiert, die standardmäßig vertraut.'
keywords: ['myetherwallet', 'bgp-hijack', 'dns-hijacking', 'amazon route 53', 'route 53 hijack', 'dns-sicherheit', 'bgp-routing-sicherheit', 'ethereum-phishing', 'selbstsigniertes zertifikat', 'enet as10297', 'rpki roa', 'krypto-wallet-phishing', 'domain-sicherheit']
---

Wenn Sie den Namen einer Website in einen Browser eingeben, vertrauen Sie darauf, dass zwei unsichtbare Systeme ehrlich zu Ihnen sind.

Das erste ist das **DNS** – das Telefonbuch des Internets –, das einen Namen wie `myetherwallet.com` in eine numerische IP-Adresse verwandelt. Das zweite ist **BGP** (Border Gateway Protocol), das entscheidet, welchen physischen Weg Ihre Datenpakete nehmen, um diese Adresse zu erreichen. Fast niemand denkt über eines von beiden nach. Sie funktionieren einfach, milliardenfach am Tag, geräuschlos.

Am Morgen des **24. April 2018** haben beide gleichzeitig gelogen. Etwa zwei Stunden lang wurde jeder, der `myetherwallet.com` eintippte und eine Browserwarnung wegklickte, auf einen Phishing-Klon umgeleitet, der auf einem Server lief, der weit von seinem eigentlichen Ziel entfernt war. Bis das Routing korrigiert wurde, hatten die Angreifer rund **150.000 US-Dollar in Ethereum** aus den Wallets echter Nutzer abgezogen.

Was diesen Vorfall zu einem festen Bestandteil von Sicherheitslehrplänen macht, ist nicht der Geldbetrag – Krypto-Diebstähle haben diesen inzwischen in den Schatten gestellt. Es ist der *Mechanismus*. Die Angreifer sind nie in die Server von MyEtherWallet eingedrungen. Sie haben nie ein Passwort erraten. Sie haben die **Straße** angegriffen, nicht das Gebäude – indem sie die Routing-Schicht des Internets entführten, um das DNS selbst zu vergiften.

## DNS basiert auf einer Routing-Schicht, die standardmäßig vertraut

Um zu verstehen, was passiert ist, muss man das unbequeme Fundament verstehen, das unter jedem Domainnamen der Welt liegt.

Das DNS beantwortet die Frage: „Welche IP-Adresse hat `myetherwallet.com`?“. Damit Ihre DNS-Anfrage aber überhaupt den richtigen Server erreicht, müssen die Router des Internets wissen, *welches Netzwerk* die IP-Adressen dieses DNS-Servers besitzt – und um das herauszufinden, verlassen sie sich auf BGP.

Hier ist der Haken. BGP ist von Haus aus ein auf Vertrauen basierendes System. Wie es in der Zusammenfassung im Cloudflare-Stil auf Wikipedia heißt, [ist das BGP-Protokoll standardmäßig so konzipiert, dass es allen von Peers gesendeten Routenankündigungen vertraut](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). Der Sicherheitsforscher Bob Cromwell beschreibt die ursprüngliche Absicht noch drastischer: [BGP wurde als Vertrauenskette zwischen wohlmeinenden ISPs und Universitäten konzipiert, die blind an die Informationen glauben, die sie erhalten](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust).

Mit anderen Worten: Wenn ein Netzwerkbetreiber auftritt und der Welt verkündet: „Der Traffic für *diese* IP-Adressen soll über *mich* laufen“, hat der Rest des Internets dies in der Vergangenheit einfach geglaubt. Es gibt bei BGP eine eingebaute Tiebreaker-Regel für spezifischere Routen – wenn zwei Netzwerke dieselben Adressen beanspruchen, gewinnt dasjenige, das den *engeren*, spezifischeren Block ankündigt. Genau dieser Tiebreaker ist der Hebel, an dem ein Angreifer ansetzt.

Die Angriffsfläche für jede Domain ist also größer als ihr Registrar, größer als ihr DNS-Anbieter und größer als ihr Webhoster. Sie umfasst die gesamte globale Routing-Struktur, die Ihre DNS-Anfrage an den richtigen Ort bringt. MyEtherWallet musste das auf die harte Tour lernen.

## Was Nutzer am 24. April 2018 verloren haben

![Lebendige, farbenfrohe Konzeptkunst von Internet-Traffic, der entlang einer leuchtenden Datenautobahn fließt und plötzlich durch ein gefälschtes Umleitungsschild auf eine falsche Straße umgeleitet wird, die zu einem Hochstapler-Gebäude führt, wobei sich Lichtpakete in einer Falle verstreuen](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

Der Schaden konzentrierte sich auf ein Zeitfenster von etwa zwei Stunden. Laut The Register lief das bösartige Routing an diesem Tag [zwischen 11:00 und 13:00 Uhr UTC](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC). In diesem Zeitfenster wurde ein Teil derer, die versuchten, `myetherwallet.com` zu erreichen, unbemerkt an einen Betrüger weitergeleitet.

Der Betrüger war überzeugend. Es sah aus wie MyEtherWallet, weil es ein fast exakter Klon war. Das *Einzige*, was es verriet, war eine Zertifikatswarnung – und entscheidend war, dass Nutzer diese Warnung einfach wegklicken konnten. Diejenigen, die dies taten und sich dann einloggten, übergaben die Schlüssel zu ihren eigenen Geldern. Wie BleepingComputer berichtete, [wurden denjenigen, die sich einloggten, die privaten Schlüssel ihrer Wallets gestohlen, die der Angreifer dann nutzte, um Konten zu leeren](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen).

Die Bilanz wird in den verschiedenen Medien leicht unterschiedlich angegeben, aber die Kernzahl ist konsistent. BleepingComputer bezifferte sie auf [215 Ether, was zum Zeitpunkt der Transaktion 160.000 US-Dollar entsprach](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000). CyberScoop berichtete, dass die Diebe [es schafften, 215 Ether zu stehlen, was zu diesem Zeitpunkt etwa 152.000 US-Dollar ausmachte](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000). Help Net Security fasste zusammen, dass die Angreifer [etwa 150.000 US-Dollar in Ethereum erbeuten konnten](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum). Es waren immer dieselben 215 ETH; der Dollarbetrag schwankt lediglich mit dem Wechselkurs zum Zeitpunkt des Diebstahls.

Das ist die brutale wirtschaftliche Realität eines Routing-plus-DNS-Angriffs auf eine Krypto-Wallet. Es gibt keine Abteilung zur Rückabwicklung von Betrug, keine Rückbuchungen (Chargebacks) und keine Bank, die man anrufen könnte. Sobald private Schlüssel in den Klon eines Angreifers eingegeben und Gelder on-chain verschoben werden, sind sie weg.

## Wie es passierte: Die Route entführen, die Antwort vergiften, den Klon bereitstellen

![Lebendige, farbenfrohe Konzeptkunst einer entführten, leuchtenden Weltkarte, auf der eine GPS-Route durch eine Hochstapler-Hand, die den Weg neu zeichnet, umgeleitet wird. Reisende werden zu einem gefälschten Wahrzeichen geführt, während das eigentliche Ziel unbeachtet in der Ferne leuchtet](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

Bei dem Angriff wurden zwei Schwachstellen miteinander verkettet. Keine davon hätte allein funktioniert. Zusammen waren sie verheerend.

**Schritt eins: Entführung der Route zu den DNS-Servern von Amazon.** MyEtherWallet nutzte den verwalteten DNS-Dienst von Amazon. Wie Help Net Security treffend feststellte, [verwendet MyEtherWallet.com den Route 53 DNS-Dienst von Amazon](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service). Die Angreifer sind nicht bei Route 53 eingebrochen. Stattdessen war, laut The Register, [jemand in der Lage, BGP-Nachrichten (Border Gateway Protocol) an die Kern-Router des Internets zu senden, um sie davon zu überzeugen, Traffic, der für einige der AWS-Server bestimmt war, an eine manipulierte Maschine zu senden](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP).

Die Ankündigung, die dies bewirkte, kam von einem unerwarteten Ort. The Register berichtete, dass [der Netzwerkblock AS10297, der zum in Ohio ansässigen Website-Hosting-Unternehmen eNet gehört, ankündigte, er könne den Traffic übernehmen, der für einige der IP-Adressen von AWS bestimmt war](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet). Und da BGP spezifischere Routen bevorzugt und seinen Peers vertraut, verbreitete sich die gefälschte Ankündigung. Wikipedia dokumentiert das Ausmaß: [Rund 1300 IP-Adressen im Bereich von Amazon Web Services, die für Amazon Route 53 vorgesehen waren, wurden von eNet (oder einem deren Kunden), einem ISP in Columbus, Ohio, entführt. Mehrere Peering-Partner wie Hurricane Electric verbreiteten die Ankündigungen blind weiter](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space). „Blind weiterverbreitet“ ist die ganze Geschichte des BGP-Vertrauensmodells in zwei Worten.

**Schritt zwei: Zum DNS-Server werden und lügen.** Nachdem die Route entführt worden war, landeten Anfragen, die eigentlich an die echten DNS-Server von Amazon hätten gehen sollen, stattdessen auf dem Server des Angreifers. Dieser Rechner gab sich als Route 53 aus. The Register beschrieb das Ergebnis: [Dieser bösartige Rechner fungierte dann als AWS-DNS-Dienst und gab die falschen IP-Adressen für MyEtherWallet.com heraus, wodurch einige unglückliche Besucher der .com-Adresse auf eine Phishing-Seite geleitet wurden](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service). Die Analyse von Kentik beleuchtet dieselbe Tatsache von der DNS-Seite aus: [Der autoritative DNS-Server des Betrügers lieferte gefälschte Antworten für myetherwallet.com zurück und leitete Nutzer auf eine gefälschte Version der MyEtherWallet-Website um](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com).

**Schritt drei: Den Phishing-Klon bereitstellen – aus Russland.** Die vergifteten DNS-Antworten leiteten die Nutzer auf einen Server in Russland, der die gefälschte Wallet hostete. Help Net Security berichtete, dass die Angreifer die Entführung nutzten, um [Traffic, der für MyEtherWallet.com bestimmt war, auf die täuschend echte Phishing-Seite umzuleiten, die auf einem Server in Russland gehostet wurde](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia).

**Die einzige Schutzmaßnahme, die fast funktioniert hätte: das Zertifikat.** Hier ist der Teil, bei dem jeder Leser innehalten sollte. Die Angreifer kontrollierten die *Auflösung* der Domain und den *Server*, aber sie konnten kein gültiges TLS-Zertifikat für `myetherwallet.com` vorlegen, das von einer vertrauenswürdigen Zertifizierungsstelle ausgestellt wurde. Der Browser tat also genau das, was er tun sollte – er gab eine Warnung aus. Help Net Security beschrieb es treffend: [Der einzige Hinweis darauf, dass die Phishing-Seite nicht das war, was sie vorgab zu sein, war die Warnung, die den Besuchern angezeigt wurde und besagte, dass das von der Seite verwendete TLS-Zertifikat von einer unbekannten Stelle signiert (d. h. selbstsigniert) war](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication). Auch BleepingComputer bestätigte, dass das Warnsignal für jeden, der aufpasste, offensichtlich war: [Die gefälschte Website war leicht zu erkennen, da die Angreifer ein selbstsigniertes TLS-Zertifikat verwendeten, das in allen modernen Browsern einen Fehler auslöste](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot).

Aber „leicht zu erkennen“ setzt voraus, dass der Nutzer auch innehält. WeLiveSecurity von ESET erfasste, wie dünn dieser Schutz wirklich war: [Der einzige offensichtliche Hinweis, den ein typischer Nutzer hätte erkennen können, bestand darin, dass ihm beim Besuch der gefälschten MyEtherWallet-Seite eine Fehlermeldung angezeigt wurde, die besagte, dass die Seite ein nicht vertrauenswürdiges SSL-Zertifikat verwendete](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted). Der Browser hob quasi die Hand und sagte: *Hier stimmt etwas nicht*. Die Nutzer, die Geld verloren haben, sind diejenigen, die trotzdem weitergeklickt haben – und die Opfer [mussten sich durch eine HTTPS-Fehlermeldung klicken, da das gefälschte MyEtherWallet.com ein nicht vertrauenswürdiges TLS/SSL-Zertifikat verwendete](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message).

## Reaktion und Nachwirkungen

Für die Leute, die sich beruflich mit Routing beschäftigen, war die Entführung nicht subtil. Netzwerk-Überwachungssysteme sahen, wie die gefälschten, spezifischeren Präfixe auftauchten und sich innerhalb desselben zweistündigen Zeitfensters wieder zurückzogen, und sobald die bösartige Ankündigung entfernt wurde, kehrte das normale Routing zu Route 53 zurück.

MyEtherWallet selbst betonte nachdrücklich, dass ihre eigene Infrastruktur nicht kompromittiert worden war. Wie das Unternehmen unmittelbar danach betonte, lag das Problem an der Infrastruktur des Internets, nicht an ihrer Anwendung – es handelte sich um ein [DNS-Hijacking](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking) des Auflösungspfads, das über BGP erreicht wurde, und nicht um eine Kompromittierung der Server oder des Codes von MEW.

Die tiefergehende Lösung setzte auf der Routing-Schicht an. Die Episode wurde zu einem der am häufigsten zitierten Argumente für **RPKI** (Resource Public Key Infrastructure) und **ROAs** (Route Origin Authorizations) – kryptografische Einträge, mit denen Netzwerke auf nachweisbare Weise deklarieren können, welche autonomen Systeme welche IP-Präfixe ankündigen *dürfen*. Wenn gültige ROAs vorhanden sind, kann eine verirrte Ankündigung à la „Ich übernehme die Adressen von Amazon“ von einem ISP aus Ohio als **RPKI-ungültig** markiert und verworfen werden, anstatt [blind weiterverbreitet](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements) zu werden. Kentik bringt die Konsequenz direkt auf den Punkt: Würde dieselbe Ankündigung heute gegen ein ordnungsgemäß signiertes Präfix erfolgen, [wäre sie als RPKI-ungültig bewertet worden](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid). In den Jahren nach Angriffen wie diesem beschleunigten große Netzwerke die Veröffentlichung von ROAs für genau diese Klasse von Routen.

Aber die Einführung von RPKI ist ein globales, mehrjähriges Opt-in-Projekt. Die Lektion für alle anderen war einfacher und unmittelbarer: Die Sicherheit Ihrer Domain hängt von Schichten ab, die Ihnen nicht gehören und die Sie nicht sehen können.

## Was uns das über die Standardvertrauensannahme (Trust-by-Default) von BGP und DNS lehrt

Dieser Vorfall ist es wert, im Gedächtnis zu bleiben, denn er stellt das übliche mentale Modell von „Domain-Sicherheit“ auf den Kopf.

Die meisten Leute denken, Domain-Sicherheit bedeutet ein starkes Registrar-Passwort, Zwei-Faktor-Authentifizierung und ein Registrar-Lock. All das ist richtig und notwendig – und **nichts davon hätte den 24. April 2018 verhindert.** Die Angreifer haben den Registrar nie angerührt, die DNS-Einträge von MyEtherWallet nie angerührt und die Server nie angerührt. Die Einträge zeigten die ganze Zeit das Richtige an. Das Internet hat einfach aufgehört, Anfragen an den Ort weiterzuleiten, an dem sie lagen.

Ein paar bleibende Erkenntnisse:

1. **Ihre Domain basiert auf geliehenem Vertrauen.** Die Auflösung hängt von BGP ab, und BGP ist [standardmäßig ... so konzipiert, dass es allen von Peers gesendeten Routenankündigungen vertraut](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). Sie können eine makellose DNS-Konfiguration haben und dennoch eine Ebene tiefer entführt werden.

2. **DNS-Poisoning kann erreicht werden, ohne jemals das DNS anzufassen.** Entführen Sie die Route zum DNS-Server und Sie kontrollieren die Antworten, selbst wenn die autoritativen Einträge unangetastet bleiben.

3. **TLS ist ein echter Rückhalt – und ein zerbrechlicher.** Die Zertifikatswarnung war das Einzige, was zwischen den Nutzern und dem Totalverlust stand. Sie funktionierte technisch, versagte aber auf der Verhaltensebene. Eine Sicherheitskontrolle, die ein Nutzer wegklicken kann, ist nur so stark wie die Geduld des Nutzers.

4. **On-Chain-Finalität entfernt das Sicherheitsnetz.** Bei einem Bank-Login ist eine kompromittierte Sitzung schlimm. Bei einer Krypto-Wallet ist sie unumkehrbar. Derselbe Angriff gegen eine andere Art von Website wäre ein Schreck gewesen; hier war es ein dauerhafter Verlust.

5. **Tiefenverteidigung (Defense in Depth) muss die Routing-Schicht einschließen.** RPKI/ROA auf Netzwerkebene sowie die Überwachung auf unerwartete Ursprungsankündigungen Ihrer Präfixe gehören heute zur Grundausstattung für alles von hohem Wert.

## Die Namefi-Perspektive

![Farbenfrohe Illustration von verifizierbarem, manipulationssicherem Domain-Besitz — eine Domain-Karte, die durch ein grünes Schild geschützt ist, ein grüner Namefi-Token und DNS-Kontinuität](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

Der MyEtherWallet-Angriff ist eine scharfe Erinnerung daran, dass eine Domain kein einzelnes Ding ist, das man „besitzt“ – sie ist ein Stapel von Vertrauensbeziehungen, von denen jede Schicht unterwandert werden kann: die Registry, der Registrar, der DNS-Anbieter und die globale Routing-Struktur, die Anfragen an diesen Anbieter weiterleitet.

[Namefi](https://namefi.io) wurde entwickelt, um die *Eigentums*-Schicht (Ownership) dieses Stacks überprüfbar und manipulationssicher zu machen. Tokenisierter Domain-Besitz bedeutet, dass die Kontrolle über eine Domain kryptografisch nachgewiesen und auf eine überprüfbare Weise übertragen werden kann, anstatt ausschließlich auf dem Kontopasswort bei einem einzigen Anbieter zu beruhen – und das alles bei gleichzeitiger Kompatibilität mit dem DNS. Es repariert BGP nicht von allein; nichts auf der Eigentumsebene schreibt neu, wie das Internet Pakete routet. Aber es greift dieselbe zugrunde liegende Krankheit an, die durch diesen Vorfall offengelegt wurde: **Zu viel kritisches Internet-Vertrauen ist implizit, nicht überprüfbar und von jedem manipulierbar, der in der Lage ist, die richtige Nachricht zu fälschen.**

Die Zukunft der Domain-Sicherheit sieht weniger wie ein starkes Passwort aus und mehr wie ein kryptografischer Nachweis auf jeder Ebene – verifizierbares Eigentum, verifizierbares Routing (RPKI), verifizierbare Identität (TLS). Die Nutzer von MyEtherWallet verloren Geld in der Lücke zwischen diesen Schichten. Das Schließen dieser Lücke, eine verifizierbare Schicht nach der anderen, ist das eigentliche Projekt.

Die Domain-Einträge waren am 24. April 2018 zu keinem Zeitpunkt falsch. Das Internet hat nur eine Lüge darüber geglaubt, wie man sie erreicht. Um sicherzustellen, dass die nächste gefälschte Ankündigung verworfen statt befolgt wird, muss man beweisbar machen, „wer was besitzt und wie man es erreicht“, anstatt es einfach vorauszusetzen.

## Quellen und weiterführende Literatur

- The Register — [Kryptowährungsdiebe erbeuten ~$150k, nachdem BGP-Hijack das MyEtherWallet DNS umgeleitet hat](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [Hacker entführt DNS-Server von MyEtherWallet, um $160.000 zu stehlen](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [MyEtherWallet-Nutzer nach erfolgreichem DNS-Hijacking-Angriff ausgeraubt](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [Amazon DNS-Dienst-Server für $152.000 Ether-Diebstahl entführt](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Ethereum-Kryptowährungs-Wallets nach Entführung von Amazons Internet-Domain-Dienst geplündert](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [Was lässt sich aus den jüngsten BGP-Hijacks lernen, die auf Kryptowährungsdienste abzielten?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [BGP-Hijacking](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [BGP-Hijacking](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [Wie wurde das MEW (MyEtherWallet) DNS gespooft?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [Hacker entführten DNS-Server, um MyEtherWallet-Nutzer zu bestehlen](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)