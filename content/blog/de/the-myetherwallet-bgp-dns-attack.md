---
title: 'Der MyEtherWallet BGP + DNS-Angriff: Wie gekapertes Internet-Routing 150.000 $ in ETH ableitete'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
description: 'Am 24. April 2018 kaperten Angreifer das Internet-Routing für Amazon Route 53, vergifteten DNS-Antworten für myetherwallet.com und stellten einen Phishing-Klon hinter einem selbstsignierten Zertifikat bereit — und entzogen dabei rund 150.000 $ in Ethereum. Ein Domain-Mayday-Tiefgang darüber, warum DNS auf einer Routing-Schicht aufbaut, die standardmäßig vertraut.'
keywords: ['myetherwallet', 'bgp hijack', 'dns-hijacking', 'amazon route 53', 'route 53 hijack', 'dns-sicherheit', 'bgp-routing-sicherheit', 'ethereum phishing', 'selbstsigniertes zertifikat', 'enet as10297', 'rpki roa', 'krypto-wallet phishing', 'domain-sicherheit']
relatedArticles:
  - /de/blog/the-fox-it-dns-hijack/
  - /de/blog/the-curve-finance-dns-hijack/
  - /de/blog/the-bitcoin-org-dns-hijack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-dnspionage-campaign/
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
  - /de/glossary/web3/
---

Wenn Sie den Namen einer Website in einen Browser eingeben, vertrauen Sie zwei unsichtbaren Systemen, die Ihnen die Wahrheit sagen.

Das erste ist **DNS** — das Telefonbuch des Internets — das einen Namen wie `myetherwallet.com` in eine numerische [IP-Adresse](/de/glossary/ip-address/) umwandelt. Das zweite ist **BGP**, das Border Gateway Protocol, das entscheidet, welchen physischen Weg Ihre Datenpakete nehmen, um diese Adresse zu erreichen. Kaum jemand denkt über eines davon nach. Sie funktionieren einfach, milliardenfach täglich, still und leise.

Am Morgen des **24. April 2018** logen beide gleichzeitig. Für etwa zwei Stunden wurde jeder, der `myetherwallet.com` eintippte und eine Browserwarnung wegklickte, zu einem [Phishing](/de/glossary/phishing/)-Klon weitergeleitet, der auf einem Server lief, der weit entfernt von dem war, wohin sie zu gehen glaubten. Als das Routing korrigiert wurde, hatten die Angreifer bereits rund **150.000 $ in [Ethereum](/de/glossary/ethereum/)** aus echten Nutzer-Wallets abgezogen.

Was diesen Vorfall zu einem festen Bestandteil von Sicherheits-Lehrplänen macht, ist nicht der Geldbetrag — Krypto-Diebstähle haben ihn seitdem weit in den Schatten gestellt. Es ist der *Mechanismus*. Die Angreifer drangen nie in MyEtherWallets Server ein. Sie erraten kein einziges Passwort. Sie griffen die **Straße** an, nicht das Gebäude — indem sie die Routing-Schicht des Internets kaperten, um DNS selbst zu vergiften.

## DNS sitzt auf einer Routing-Schicht, die standardmäßig vertraut

Um zu verstehen, was passierte, müssen Sie das unbehagliche Fundament unter jedem Domain-Namen der Welt verstehen.

DNS beantwortet die Frage: „Welche IP-Adresse hat `myetherwallet.com`?" Damit Ihre DNS-Anfrage überhaupt den richtigen Server erreicht, müssen die Router des Internets wissen, *welches Netzwerk* die IP-Adressen dieses DNS-Servers besitzt — und um das herauszufinden, verlassen sie sich auf BGP.

Hier liegt der Haken. BGP ist von Natur aus ein vertrauensbasiertes System. Wie die Cloudflare-ähnliche Zusammenfassung auf Wikipedia es formuliert, [ist das BGP-Protokoll standardmäßig so konzipiert, dass es allen von Peers gesendeten Routen-Ankündigungen vertraut](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). Sicherheitsforscher Bob Cromwell beschreibt die ursprüngliche Absicht noch direkter: [BGP wurde als Vertrauenskette zwischen wohlmeinenden ISPs und Universitäten konzipiert, die die empfangenen Informationen blind glauben](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust).

Mit anderen Worten: Wenn ein Netzwerkbetreiber aufsteht und der Welt ankündigt „Datenverkehr für *diese* IP-Adressen soll durch *mich* fließen", hat der Rest des Internets das historisch gesehen einfach geglaubt. In BGP ist ein Tiebreaker für spezifischere Routen eingebaut — wenn zwei Netzwerke dieselben Adressen beanspruchen, gewinnt das, das den *engeren*, spezifischeren Block ankündigt. Genau dieser Tiebreaker ist der Hebel, den ein Angreifer nutzt.

Die Angriffsfläche für jede Domain ist also größer als ihr [Registrar](/de/glossary/registrar/), größer als ihr DNS-Anbieter und größer als ihr Web-Host. Sie umfasst das gesamte globale Routing-Geflecht, das Ihre DNS-Anfrage an den richtigen Ort bringt. MyEtherWallet musste das auf die harte Tour lernen.

## Was Nutzer am 24. April 2018 verloren

![Lebendige, bunte Konzeptgrafik von Internet-Datenverkehr, der entlang einer leuchtenden Datenautobahn fließt und plötzlich durch ein gefälschtes Umleitungsschild auf eine falsche Straße zu einem Imitator-Gebäude umgeleitet wird, Lichtpakete zerstreuen sich in eine Falle](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

Der Schaden konzentrierte sich auf ein rund zweistündiges Zeitfenster. Laut The Register lief das bösartige Routing [zwischen 11:00 und 13:00 Uhr UTC](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC) an diesem Tag. In diesem Zeitfenster wurde ein Teil aller, die versuchten, `myetherwallet.com` zu erreichen, still und leise an einen Betrüger weitergeleitet.

Der Betrüger war überzeugend. Er sah aus wie MyEtherWallet, weil er ein nahezu exakter Klon war. Das *einzige*, das ihn verriet, war eine Zertifikatswarnung — und entscheidenderweise konnten Nutzer diese Warnung einfach wegklicken. Wer es tat und sich dann einloggte, übergab die Schlüssel zu seinen eigenen Geldmitteln. Wie BleepingComputer berichtete, [hatten jene, die sich einloggten, ihre privaten Wallet-Schlüssel gestohlen, die der Angreifer nutzte, um Konten zu leeren](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen).

Die Schadenssumme wird in verschiedenen Quellen leicht unterschiedlich angegeben, aber die Kerngröße ist konsistent. BleepingComputer bezifferte sie auf [215 Ether, zum Zeitpunkt der Transaktion dem Gegenwert von 160.000 $](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000). CyberScoop berichtete, dass die Diebe [215 Ether stehlen konnten, was zu dem Zeitpunkt etwa 152.000 $ entsprach](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000). Help Net Security fasste zusammen, dass Angreifer [rund 150.000 $ in Ethereum stehlen konnten](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum). Dieselben 215 ETH; der Dollarbetrag schwankt nur mit dem Wechselkurs zum Zeitpunkt des Diebstahls.

Das ist die brutale Ökonomie eines Routing-plus-DNS-Angriffs auf eine Krypto-Wallet. Es gibt keine Betrugs-Rückbuchungsabteilung, keine Rückbuchung, keine Bank, die man anrufen kann. Sobald private Schlüssel in den Klon eines Angreifers eingegeben und Gelder [on-chain](/de/glossary/on-chain/) bewegt wurden, sind sie weg.

## Wie es geschah: Route kapern, Antwort vergiften, Klon bereitstellen

![Lebendige, bunte Konzeptgrafik einer gekaperten, leuchtenden Weltkarte, auf der eine GPS-Route von einer Betrügerhand, die den Pfad neu zeichnet, umgeleitet wird, Reisende zu einem gefälschten Wahrzeichen geführt werden, während das echte Ziel ignoriert in der Ferne leuchtet](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

Der Angriff kettete zwei Versagen aneinander. Keines davon allein hätte funktioniert. Zusammen waren sie verheerend.

**Schritt eins: Die Route zu Amazons DNS-Servern kapern.** MyEtherWallet nutzte Amazons verwalteten DNS-Dienst. Wie Help Net Security klar feststellte, [verwendet MyEtherWallet.com Amazons Route 53 DNS-Dienst](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service). Die Angreifer drangen nicht in Route 53 ein. Stattdessen war laut The Register [jemand in der Lage, BGP-Nachrichten – Border Gateway Protocol – an die Core-Router des Internets zu senden, um sie davon zu überzeugen, den für einige AWS-Server bestimmten Datenverkehr an eine abtrünnige Maschine zu senden](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP).

Die Ankündigung, die dies auslöste, kam von einem unerwarteten Ort. The Register berichtete, dass [der Netzwerkblock AS10297, der dem in Ohio ansässigen Website-Hosting-Unternehmen eNet gehört, ankündigte, Datenverkehr übernehmen zu können, der für einige IP-Adressen von AWS bestimmt war](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet). Und weil BGP spezifischere Routen bevorzugt und seinen Peers vertraut, breitete sich die gefälschte Ankündigung aus. Wikipedia verzeichnet das Ausmaß: [Rund 1300 IP-Adressen im Amazon Web Services-Bereich, die Amazon Route 53 gewidmet sind, wurden von eNet (oder einem Kunden davon), einem ISP in Columbus, Ohio, gekapert. Mehrere Peering-Partner, wie Hurricane Electric, verbreiteten die Ankündigungen blindlings](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space). „Blindlings verbreitet" ist die ganze Geschichte von BGPs Vertrauensmodell in zwei Worten.

**Schritt zwei: DNS-Server werden und lügen.** Sobald die Route gekapert war, landeten Anfragen, die eigentlich zu Amazons echten DNS-Servern hätten gehen sollen, stattdessen auf der Maschine des Angreifers. Diese Maschine imitierte Route 53. The Register beschrieb das Ergebnis: [Diese abtrünnige Maschine fungierte dann als AWS DNS-Dienst und gab falsche IP-Adressen für MyEtherWallet.com aus, die einige unglückliche Besucher der Dot-com-Seite zu einer Phishing-Site umleiteten](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service). Kentiks Analyse stellt denselben Sachverhalt von der DNS-Seite dar: [Der Imitator-autoritativer DNS-Server gab gefälschte Antworten für myetherwallet.com zurück und leitete Nutzer zu einer Imitator-Version von MyEtherWallets Website um](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com).

**Schritt drei: Den Phishing-Klon bereitstellen — aus Russland.** Die vergifteten DNS-Antworten leiteten Nutzer an einen Server in Russland weiter, auf dem die gefälschte Wallet gehostet wurde. Help Net Security berichtete, dass die Angreifer den Hijack nutzten, um [den für MyEtherWallet.com bestimmten Datenverkehr zur gleichaussehenden Phishing-Site umzuleiten, die auf einem Server in Russland gehostet wird](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia).

**Die eine Schutzmaßnahme, die fast funktionierte: das Zertifikat.** Hier ist der Teil, bei dem jeder Leser innehalten sollte. Die Angreifer kontrollierten die *Auflösung* der Domain und den *Server*, konnten aber kein gültiges TLS-Zertifikat für `myetherwallet.com` von einer vertrauenswürdigen Stelle vorweisen. Also tat der Browser genau das, was er tun sollte — er zeigte eine Warnung. Help Net Security beschrieb es präzise: [Das einzige, was darauf hindeutete, dass die Phishing-Site nicht das ist, was sie vorgab zu sein, war die Warnung, die Besuchern angezeigt wurde, dass das von der Site verwendete TLS-Zertifikat von einer unbekannten Behörde signiert wurde (d.h. selbstsigniert war)](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication). BleepingComputer stimmte zu, dass das Zeichen für jeden, der aufpasste, offensichtlich war: [Die gefälschte Website war leicht zu erkennen, weil die Angreifer ein selbstsigniertes TLS-Zertifikat verwendeten, das bei allen modernen Browsern einen Fehler auslöste](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot).

Aber „leicht zu erkennen" setzt voraus, dass der Nutzer innehält. ESETs WeLiveSecurity erfasste, wie dünn der Schutz wirklich war: [Der einzige offensichtliche Hinweis, den ein typischer Nutzer hätte bemerken können, war, dass ihm beim Besuch der gefälschten MyEtherWallet-Site eine Fehlermeldung angezeigt wurde, die ihm mitteilte, dass die Site ein nicht vertrauenswürdiges SSL-Zertifikat verwendete](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted). Der Browser hob die Hand und sagte *Das stimmt nicht*. Die Nutzer, die Geld verloren, sind jene, die trotzdem weitergeklickt haben — und Opfer [mussten eine HTTPS-Fehlermeldung durchklicken, da die gefälschte MyEtherWallet.com ein nicht vertrauenswürdiges TLS/SSL-Zertifikat verwendete](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message).

## Reaktion und Folgen

Der Hijack war für jene, die das Routing beruflich beobachten, nicht subtil. Netzwerk-Monitore sahen die gefälschten, spezifischeren Präfixe erscheinen und dann innerhalb desselben zweistündigen Fensters wieder verschwinden, und sobald die abtrünnige Ankündigung zurückgezogen wurde, kehrte das normale Routing zu Route 53 zurück.

MyEtherWallet selbst betonte nachdrücklich, dass seine eigene Infrastruktur nicht kompromittiert worden war. Wie das Unternehmen unmittelbar danach betonte, lag das Problem in den Rohren des Internets, nicht in der Anwendung — dies war ein [DNS-Hijacking](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking) des Auflösungspfads, das durch BGP erreicht wurde, und keine Kompromittierung von MEWs Servern oder Code.

Die tiefgreifendere Lösung landete auf der Routing-Ebene. Der Vorfall wurde zu einem der am häufigsten zitierten Argumente für **RPKI** (Resource Public Key Infrastructure) und **ROAs** (Route Origin Authorizations) — kryptografische Einträge, die es Netzwerken ermöglichen, auf überprüfbare Weise zu erklären, welche autonomen Systeme *berechtigt* sind, welche IP-Präfixe anzukündigen. Mit gültigen ROAs an Ort und Stelle kann eine verirrte „Ich übernehme Amazons Adressen"-Ankündigung von einem ISP in Ohio als **RPKI-ungültig** markiert und verworfen werden, anstatt [blind weitergeleitet](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements) zu werden. Kentik stellt die Konsequenz direkt fest: Wenn dieselbe Ankündigung heute gegen ein ordnungsgemäß signiertes Präfix gemacht würde, [würde sie als RPKI-ungültig bewertet werden](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid). In den Jahren nach solchen Angriffen beschleunigten große Netzwerke die Veröffentlichung von ROAs genau für diese Art von Route.

Aber die RPKI-Übernahme ist ein globaler, mehrjähriger, freiwilliger Prozess. Die Lehre für alle anderen war einfacher und unmittelbarer: Die Sicherheit Ihrer Domain hängt von Schichten ab, die Sie nicht besitzen und nicht sehen können.

## Was das über BGP und DNS als standardmäßig vertrauend lehrt

Dieser Vorfall ist es wert, eingeprägt zu werden, weil er das übliche mentale Modell von „Domain-Sicherheit" auf den Kopf stellt.

Die meisten Menschen denken, Domain-Sicherheit bedeutet ein starkes Registrar-Passwort, Zwei-Faktor-Authentifizierung und eine Registrar-Sperre. All das ist real und notwendig — und **nichts davon hätte den 24. April 2018 verhindert.** Die Angreifer haben den Registrar nie berührt, nie MyEtherWallets DNS-Einträge berührt, nie seine Server berührt. Die Einträge sagten die ganze Zeit das Richtige. Das Internet hat einfach aufgehört, Anfragen an den Ort zu liefern, der sie hielt.

Einige dauerhafte Erkenntnisse:

1. **Ihre Domain reitet auf geborgtem Vertrauen.** Die Auflösung hängt von BGP ab, und BGP [ist standardmäßig so konzipiert, dass es allen von Peers gesendeten Routen-Ankündigungen vertraut](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). Sie können eine fehlerlose DNS-Konfiguration haben und trotzdem eine Ebene darunter gekapert werden.

2. **DNS-Vergiftung kann erreicht werden, ohne DNS jemals zu berühren.** Kapern Sie die Route zum DNS-Server und Sie kontrollieren die Antworten, auch wenn die autoritativen Einträge unberührt sind.

3. **TLS ist eine echte Absicherung — und eine fragile.** Die Zertifikatswarnung war das einzige, was zwischen den Nutzern und einem totalen Verlust stand. Sie funktionierte technisch und versagte verhaltenstechnisch. Eine Sicherheitskontrolle, an der ein Nutzer vorbeiklicken kann, ist nur so stark wie die Geduld des Nutzers.

4. **On-Chain-Finalität entfernt das Sicherheitsnetz.** Bei einem Bank-Login ist eine vergiftete Sitzung schlimm. Bei einer Krypto-Wallet ist sie unwiderruflich. Derselbe Angriff gegen eine andere Art von Site wäre ein Schrecken gewesen; hier war es ein dauerhafter Verlust.

5. **Tiefenverteidigung muss die Routing-Schicht einschließen.** RPKI/ROA auf Netzwerkebene, plus Überwachung auf unerwartete Ursprungs-Ankündigungen Ihrer Präfixe, sind jetzt Mindestanforderungen für alles mit hohem Wert.

## Der Namefi-Aspekt

![Bunte Illustration von verifizierbarem, manipulationssicherem Domain-Besitz — eine Domain-Karte, gesichert durch ein grünes Schild, ein grünes Namefi-Token und DNS-Kontinuität](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

Der MyEtherWallet-Angriff ist eine scharfe Erinnerung daran, dass eine Domain keine einzelne Sache ist, die man „besitzt" — es ist ein Stapel von Vertrauensbeziehungen, von denen jede Schicht untergraben werden kann: die [Registry](/de/glossary/registry/), der Registrar, der DNS-Anbieter und das globale Routing-Geflecht, das Anfragen an diesen Anbieter liefert.

[Namefi](https://namefi.io) ist darauf ausgerichtet, die *Eigentums*-Schicht dieses Stapels überprüfbar und manipulationssicher zu machen. Tokenisierter Domain-Besitz bedeutet, dass die Kontrolle über eine Domain kryptografisch nachgewiesen und auf eine überprüfbare Weise übertragen werden kann, anstatt ausschließlich auf einem Kontopasswort bei einem einzigen Anbieter zu beruhen — während sie dennoch mit DNS kompatibel bleibt. Es behebt für sich allein nicht BGP; nichts auf der Eigentums-Schicht schreibt um, wie das Internet Pakete routet. Aber es greift dieselbe zugrundeliegende Krankheit an, die dieser Vorfall aufdeckte: **Zu viel kritisches Internet-Vertrauen ist implizit, nicht überprüfbar und durch jeden, der die richtige Nachricht fälschen kann, umkehrbar.**

Die Zukunft der Domain-Sicherheit sieht weniger nach einem starken Passwort aus und mehr nach kryptografischem Beweis auf jeder Ebene — verifizierbares Eigentum, verifizierbares Routing (RPKI), verifizierbare Identität (TLS). MyEtherWallets Nutzer verloren Geld in der Lücke zwischen diesen Schichten. Diese Lücke zu schließen, eine überprüfbare Schicht nach der anderen, ist das gesamte Projekt.

Die Domain-Einträge waren am 24. April 2018 nie falsch. Das Internet glaubte nur einer Lüge darüber, wie man sie erreicht. „Wer was besitzt und wie man es erreicht" nachweisbar statt angenommen zu machen, ist die Art, wie man sicherstellt, dass die nächste gefälschte Ankündigung verworfen statt befolgt wird.

## Quellen und weiterführende Literatur

- The Register — [Cryptocurrency thieves snatch ~$150k after BGP hijack reroutes MyEtherWallet DNS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [Hacker Hijacks DNS Server of MyEtherWallet to Steal $160,000](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [MyEtherWallet users robbed after successful DNS hijacking attack](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [Amazon DNS service server hijacked for $152,000 Ether theft](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Ethereum cryptocurrency wallets raided after Amazon's internet domain service hijacked](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [What can be learned from recent BGP hijacks targeting cryptocurrency services?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [BGP hijacking](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [BGP Hijacking](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [How Was MEW (MyEtherWallet) DNS Spoofed?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [Hackers Hijacked DNS Servers to Steal from MyEtherWallet Users](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)
