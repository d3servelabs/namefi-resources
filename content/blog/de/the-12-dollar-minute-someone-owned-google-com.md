---
title: "Die 12-Dollar-Minute: Als jemand unbemerkt Google.com kaufte"
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "Im September 2015 kaufte ein ehemaliger Google-Mitarbeiter google.com über Google Domains für 12 Dollar und hatte etwa eine Minute lang die administrative Kontrolle über die wertvollste Domain der Welt. Die Geschichte von Sanmay Ved, der Prämie von 6.006,13 Dollar und was eine Minute Eigentümerschaft darüber verrät, wer wirklich eine Domain kontrolliert."
keywords: ['google.com Domain', 'sanmay ved', 'google domains bug', 'domain sicherheit', 'wem gehört google.com', 'domain hijacking', 'webmaster tools zugang', 'google bug bounty', '6006.13 belohnung', 'domain registrierung schwachstelle', 'domain kontrolle', 'dns sicherheit', 'domain besitz verifizierung']
---

Für etwa eine Minute in der Nacht des 29. September 2015 gehörte die wertvollste Adresse im Internet nicht Google.

Sie gehörte einem ehemaligen Google-Mitarbeiter namens Sanmay Ved, der **google.com** gerade für **12 $** gekauft hatte.

Er ist nicht eingebrochen. Er hat keinen Buffer Overflow ausgenutzt oder einen Administrator gephisht. Er ging zu Googles eigenem Endkundenportal – Google Domains –, tippte die berühmteste Domain der Welt ein und sah zu, wie der Checkout-Prozess etwas tat, das er niemals hätte tun dürfen: Er ließ ihn bezahlen. Seine Karte wurde belastet. Die Bestellung wurde ausgeführt. Und für etwa sechzig Sekunden war der eingetragene Registrant für google.com ein Student aus Massachusetts.

Dies ist **Domain Mayday / 域名浩劫**, unsere Serie über Momente, in denen die Domain-Sicherheit öffentlich versagte. Die meisten Episoden handeln von Namen, die von Angreifern gestohlen wurden. Diese hier ist anders – und noch beunruhigender –, denn niemand hat irgendetwas angegriffen. Die wichtigste Domain der Welt wurde zum Listenpreis an die erste Person verkauft, die sie zufällig in einen Warenkorb legte.

## Was google.com normalerweise ist

Es ist schwer zu übertreiben, was google.com wert ist, denn diese Zahl ist eigentlich keine Zahl.

Google.com ist die Eingangstür zur meistgenutzten Suchmaschine der Welt, der Ankerpunkt für Gmail, Maps, Ads, YouTube-Kontoabläufe und das Authentifizierungs-Rückgrat für Milliarden von Menschen. Slate nannte sie in der Berichterstattung über den Vorfall ["die am meisten frequentierte Domain der Welt"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.). Für wie viel auch immer Tesla.com oder Cars.com verkauft wurden, google.com ist eine Klasse für sich: Es ist kein bloßer Markenwert, es ist *Infrastruktur*, mit der ein großer Teil der Weltbevölkerung jeden Tag in Berührung kommt.

Eine solche Domain sollte unantastbar sein. Sie sollte gesperrt, markiert, mit einem Registry-Hold, Server-Hold und Transferverbot versehen sein – eingehüllt in jeden Schutz, den ein Registrar anwenden kann. Die gesamte Prämisse der Domain-Sicherheit lautet: Je kritischer der Name, desto schwieriger ist er zu übertragen.

Und dann wurde sie für 12 $ übertragen.

## Die 12-Dollar-Minute

![Lebendige, farbenfrohe Konzeptkunst einer leuchtenden, kugelförmigen Domain mit einem winzigen 12-Dollar-Preisschild, bei der eine einzelne Münze in einen Checkout-Schlitz fällt, während eine Ein-Minuten-Sanduhr abläuft](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Ved war nicht auf Ärger aus. Er war ein Ex-Googler – er hatte Jahre zuvor als Account Strategist im Unternehmen gearbeitet – und stöberte spät in der Nacht auf Google Domains, dem damals neuen Registrar-Dienst von Google, nach Domain-Namen. Aus einer Laune heraus tippte er den größten aller Namen ein.

Nach seiner eigenen Erzählung ließ ihn das Ergebnis erstarren: ["Ich tippe Google.com ein und zu meiner Überraschung wurde es als verfügbar angezeigt"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available), erzählte Ved dem Business Insider. Nicht "Premium", nicht "Machen Sie ein Angebot", nicht "Diese Domain ist vergeben". *Verfügbar.* Für die standardmäßige Registrierungsgebühr von 12 $.

Er legte sie in seinen Warenkorb und ging zur Kasse, in der festen Erwartung, dass das System ihn abweisen würde. Das tat es nicht. Die Transaktion wurde abgeschlossen. Wie The Hacker News zusammenfasste, hatte ein Ex-Googler es ["geschafft, die meistbesuchte Domain der Welt, Google.com, über Googles eigenen Domains-Dienst für nur 12 $ zu kaufen."](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain)

Und dann begann sich sein Posteingang zu füllen. Die Systeme, die auf Domain-Besitz reagieren – jene, die einem verifizierten Domain-Inhaber Warnungen und Kontrollrechte senden – sahen einen neuen Registranten und begannen, ihre Arbeit zu tun. Security Affairs beschrieb den Moment: ["In wenigen Sekunden wurden sein Posteingang und die Google Webmaster Tools mit Webmaster-bezogenen Nachrichten überflutet, die den Besitz der Google.com-Domains bestätigten."](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded)

Für diese eine Minute stand Ved nicht nur auf dem Papier als Inhaber. Die Maschine behandelte ihn als Inhaber.

## Was man in dieser Minute tatsächlich kontrolliert

Das ist der Teil, der aus einer lustigen Anekdote eine Sicherheitsgeschichte macht.

Wenn man der verifizierte Inhaber einer Domain im Google-Ökosystem ist, erhält man Zugriff auf die **Webmaster Tools** (heute Search Console) – das Dashboard, das Website-Betreiber nutzen, um zu sehen, wie eine Eigenschaft indiziert wird, Sitemaps einzureichen, interne Nachrichten anzusehen und zu verwalten, wie die Domain in der Suche erscheint. Ved sagte später, dass ihm die Tragweite durchaus bewusst war: ["Das Erschreckende war, dass ich für eine Minute Zugriff auf die Webmaster-Kontrollen hatte"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute), erklärte er.

Berichte aus der Zeit hielten fest, dass er in diesem Zeitraum ["administrativen Zugriff auf Google.com"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=he%20had%20administrative%20access%20to%20Google.com) hatte und dass sein ["Google Search Console-Dashboard mit Nachrichten für die Google.com-Domain aktualisiert wurde."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated) Denken Sie darüber nach, worauf Sie durch den Besitz einer Domain tatsächlich zugreifen können: DNS-Einträge, E-Mail-Routing, die Möglichkeit, Dritten den "Besitz" nachzuweisen, und die Suchmaschinenkontrollen, die darüber entscheiden, wie eine Web-Präsenz der Welt präsentiert wird. Die Registrierung ist der Hauptschlüssel. Alles, was danach kommt – DNS, Zertifikate, E-Mail, Single Sign-On, Suchindizierung –, geht davon aus, dass der Registrant derjenige ist, für den er sich ausgibt.

Ved verhielt sich verantwortungsvoll. Er änderte nicht einen einzigen Eintrag. Er meldete es sofort. Aber die Lektion bleibt trotzdem bestehen: Der Unterschied zwischen "einem neugierigen Studenten" und "einer Katastrophe" war keine technische Kontrolle. Es war die Entscheidung einer einzigen Person, sich anständig zu verhalten.

## Googles Eingreifen — und seine Reaktion

![Lebendige, farbenfrohe Konzeptkunst eines riesigen leuchtenden Schlüssels, der kurz in einer offenen Hand gehalten wird und dann sanft von einem Lichtstrahl zurückgezogen wird, vor einem bunten Leiterplatten-Himmel mit einer davonschwebenden, erstatteten Münze](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Googles automatisierte Systeme erkannten die Anomalie schnell. Innerhalb von etwa einer Minute wurde die Bestellung storniert. Fox News berichtete nüchtern über die Stornierung: ["Google Domains stornierte den Verkauf eine Minute später mit der Begründung, jemand habe die Seite registriert, bevor er es konnte, und erstattete Ved die 12 $."](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later) Dieser "jemand", der sie zuerst registriert hatte, war natürlich Google selbst.

Dann tat Google das, was diese Geschichte zur Legende machte. Über sein Vulnerability Reward Program zahlte es Ved eine Prämie – und das Unternehmen wählte die Zahl mit Absicht. In seinem offiziellen Sicherheits-Jahresrückblick für 2015 schrieb Google: ["Unsere anfängliche finanzielle Belohnung für Sanmay – 6.006,13 $ – buchstabierte numerisch Google (wenn man die Augen ein wenig zusammenkneift, sieht man es!). Wir haben diesen Betrag dann verdoppelt, als Sanmay seine Belohnung für wohltätige Zwecke spendete."](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay) (Lesen Sie es als Ziffern: 6-0-0-6-1-3 → G-O-O-G-L-E.)

Ved entschied sich dafür, das Geld zu spenden. Er bat darum, es an die Art of Living India Foundation zu geben, die kostenlose Schulen in ganz Indien unterstützt – und als Google von der Spende erfuhr, verdoppelten sie die Prämie, sodass sich die Gesamtsumme auf rund **12.012,26 $** belief. Für Ved ging es bei der ganzen Episode nie um die Auszahlung. ["Geld ist mir egal. Es ging nie um das Geld"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money), sagte er dem Business Insider.

Ein 12-Dollar-Fehler wurde zu einer Geschichte über eine clevere Prämie, eine großzügige Spende und ein Unternehmen, das diese verdoppelte. Aber wenn man das Wohlwollen abzieht, bleibt eine nackte Tatsache: Ein Registrar verteilte die Schlüssel zu seinem eigenen Königreich, und das Einzige, was sie zurückholte, war eine schnelle automatisierte Erkennung – und ein Käufer, der zufällig ehrlich war.

## Wie rutscht eine so wichtige Registrierung durch?

Wie taucht die bestgeschützte Domain der Erde als "verfügbar für 12 $" in einem Selbstbedienungs-Checkout auf?

Die ehrliche Antwort ist, dass niemand außerhalb von Google das vollständige interne Post-Mortem kennt, und wir werden nicht so tun, als wüssten wir es. Aber die *Art* des Fehlers ist jedem vertraut, der mit Domain-Systemen gearbeitet hat, und es lohnt sich, präzise darüber zu sein, was wir sagen können und was nicht.

Verifizierbar ist das sichtbare Verhalten. Die Berichterstattung zu der Zeit brachte die beiden naheliegendsten Erklärungen ins Spiel: ["Es könnte ein Fehler in Google Domains gewesen sein, oder das Unternehmen hat einfach versäumt, seinen Domain-Namen rechtzeitig zu verlängern."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew) So oder so lieferte die "Ist dieser Name zur Registrierung verfügbar?"-Logik des Shops für ein kurzes Zeitfenster die falsche Antwort für einen Namen, der als unverkäuflich hätte hartkodiert sein müssen.

Die tiefere Lektion ist architektonischer Natur. Der Schutz einer Domain ist nur so gut wie der *schwächste Pfad, um sie zu ändern*. Eine Registry kann Server-Hold- und Transfer-Prohibited-Flags anwenden; ein Registrar kann einen Namen sperren; eine Organisation kann Multi-Faktor- und Genehmigungs-Workflows auf Registrar-Ebene aktivieren. Aber wenn auch nur eine einzige Schnittstelle – ein Endkunden-Checkout, ein internes Admin-Tool, eine Support-Übersteuerung, ein API-Endpunkt – den Besitz ändern kann, ohne dass diese Schutzmechanismen greifen, dann ist der Name genau so sicher wie diese eine schwächste Schnittstelle. Der Schadensradius einer Domain-Übernahme ist enorm (DNS, E-Mail, Zertifikate, Login), aber die Angriffsfläche, die ihn auslöst, kann winzig sein: ein Formular, das "nein" hätte sagen sollen und stattdessen "ja" sagte.

Diese Asymmetrie ist das eigentliche Problem. Der Wert, der auf dem Spiel steht, ist maximal. Die Aktion, die erforderlich ist, um ihn zu verschieben, kann minimal sein.

## Was uns das über Domain-Kontrolle lehrt

Aus der 12-Dollar-Minute lassen sich einige nachhaltige Lehren ziehen:

1. **Der Registranten-Eintrag ist der Hauptschlüssel.** DNS, TLS-Zertifikate, E-Mail-Zustellbarkeit und "Beweise, dass dir diese Domain gehört"-Abläufe vertrauen alle der darunter liegenden Registrierung. Wer die Registrierung kontrolliert, kontrolliert alles, was daran hängt. Schützen Sie diese Ebene wie das Root-Passwort, das sie de facto ist.

2. **Kritikalität und Schutz sind nicht automatisch korreliert.** Man würde annehmen, dass die wichtigste Domain der Welt auch am stärksten gesperrt ist. Für eine Minute war sie es nicht. Wichtigkeit setzt sich nicht von selbst durch; explizite Sperren, Holds und Genehmigungs-Tore tun dies. Überprüfen Sie sie; verlassen Sie sich nicht einfach darauf.

3. **Die Kontrollebene ist größer als das DNS.** Man sichert seine Nameserver und vergisst dabei das Registrar-Konto, den Support-Kanal, die Abrechnungs-E-Mail und die internen Tools. Eine Domain kann durch jede Tür verloren gehen, die den Besitz überschreiben kann – nicht nur durch diejenige mit der Aufschrift "DNS".

4. **Man ist oft nur eine ehrliche Person von einer Katastrophe entfernt.** Google hatte Glück, dass der Käufer ein sicherheitsbewusster Ex-Mitarbeiter war, der es sofort meldete. Sicherheit, die auf dem Wohlwollen dessen beruht, der zufällig hineinstolpert, ist keine Sicherheit. Das System, nicht der Besucher, sollte es sein, das Nein sagt.

5. **Schnelle Erkennung ist eine echte Kontrolle.** Googles automatisches Eingreifen nach ca. einer Minute hat den Schaden tatsächlich begrenzt. Man kann nicht jeden Fehler verhindern, aber eine strenge Überwachung von Besitzänderungen verkleinert das Zeitfenster, in dem ein Ausrutscher zu einer Sicherheitslücke wird.

Der beruhigende Teil dieser Geschichte ist, dass Googles Systeme den Fehler bemerkt und rückgängig gemacht haben. Der unbequeme Teil ist, dass sie es überhaupt tun mussten.

## Der Namefi-Blickwinkel

![Farbenfrohe Illustration von verifizierbarem, manipulationssicherem Domain-Besitz — eine durch ein grünes Schild gesicherte Domain-Karte, ein grüner Namefi-Token und DNS-Kontinuität](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

Im Kern ist die 12-Dollar-Minute eine Frage über einen Datensatz: *Wer ist genau jetzt der verifizierte Inhaber dieses Namens, und wie schwer ist es, das unbemerkt zu ändern?*

Im traditionellen Modell befindet sich die Antwort innerhalb der Datenbank eines Registrars und ist über alle Schnittstellen veränderbar, die dieser Registrar bereitstellt – Endkunden-Checkout, Admin-Übersteuerung, Support-Ticket, API. Die meisten dieser Schnittstellen sind gut bewacht. Aber der Besitz ist nur so sicher wie die am schlechtesten bewachte Schnittstelle, und der Inhaber kann normalerweise nicht in Echtzeit sehen, in welchem Moment sein Eintrag den Besitzer wechselt. Sanmay Ved erfuhr, dass ihm google.com "gehörte", weil sein Posteingang aufleuchtete – nicht, weil ein gehärtetes Ledger einen verifizierten, autorisierten Transfer ankündigte.

[Namefi](https://namefi.io) geht von der Prämisse aus, dass der Besitz einer Domain **verifizierbar und manipulationssicher** sein sollte und nicht in einer einzigen veränderbaren Tabellenzeile vergraben sein darf. Indem Domain-Kontrolle als tokenisiertes On-Chain-Asset abgebildet wird, das mit dem DNS kompatibel bleibt, wird die Frage "Wem gehört diese Domain?" zu etwas, das man unabhängig verifizieren und auditieren kann – und ein Transfer wird zu einem expliziten, autorisierten, sichtbaren Ereignis anstelle eines Checkouts, der stillschweigend erfolgreich ist. Das Ziel ist nicht, Domains exotisch zu machen; es geht darum, es schwieriger zu machen, den Hauptschlüssel versehentlich der falschen Person in die Hand zu drücken, und es unmöglich zu machen, ihn zu übertragen, ohne eine Spur zu hinterlassen.

Google.com schnellte innerhalb einer Minute zurück, weil Google eine schnelle Erkennung auf Basis eines fragilen Grundbausteins aufgebaut hatte. Die bessere Antwort besteht darin, den Grundbaustein selbst vertrauenswürdig zu machen: Besitz, den man beweisen kann, Transfers, die man sehen kann, und eine Kontrolle, die nicht davon abhängt, dass ein einzelnes Formular sich daran erinnert, "nein" zu sagen.

## Quellen und weiterführende Literatur

- Google Online Security Blog — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1) (Primärquelle für die Belohnung von 6.006,13 $ und die verdoppelte Spende)
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/) (zitiert Googles Blog wörtlich)
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- Fox News — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- Fox News — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- Yahoo Finance — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)