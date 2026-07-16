---
title: 'Die 12-Dollar-Minute: Als jemand google.com stillschweigend kaufte'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
description: 'Im September 2015 kaufte ein ehemaliger Google-Mitarbeiter google.com über Google Domains für 12 Dollar und hatte etwa eine Minute lang die administrative Kontrolle über die wertvollste Domain der Welt. Die Geschichte von Sanmay Ved, dem 6.006,13-Dollar-Kopfgeld und was eine Minute Eigentumsrecht darüber verrät, wer wirklich eine Domain kontrolliert.'
keywords: ['google.com Domain', 'sanmay ved', 'Google Domains Bug', 'Domain-Sicherheit', 'wem gehört google.com', 'Domain-Hijacking', 'Webmaster-Tools-Zugang', 'Google Bug Bounty', '6006.13 Belohnung', 'Domain-Registrierungs-Sicherheitslücke', 'Domain-Kontrolle', 'DNS-Sicherheit', 'Domain-Eigentumsverifizierung']
relatedArticles:
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-fox-it-dns-hijack/
  - /de/blog/the-lenovo-com-dns-hijack/
  - /de/blog/the-sex-com-heist-the-forged-letter/
  - /de/blog/the-2024-squarespace-defi-domain-hijacks/
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
  - /de/glossary/tld/
  - /de/glossary/registry/
---

Für etwa eine Minute in der Nacht des 29. September 2015 gehörte die wertvollste Adresse im Internet nicht Google.

Sie gehörte einem ehemaligen Google-Mitarbeiter namens Sanmay Ved, der gerade **google.com** für **12 Dollar** gekauft hatte.

Er hat nichts gehackt. Er hat keinen Buffer-Overflow ausgenutzt oder einen Administrator gephisht. Er ging zu Googles eigenem Vertriebsshop — Google Domains — tippte die bekannteste Domain der Welt ein und beobachtete, wie der Checkout-Prozess etwas tat, was er niemals hätte tun sollen: Er ließ ihn bezahlen. Seine Karte wurde belastet. Die Bestellung ging durch. Und für ungefähr sechzig Sekunden war ein Masterstudent in Massachusetts als eingetragener Inhaber von google.com verzeichnet.

Dies ist **Domain Mayday / 域名浩劫**, unsere Serie über die Momente, in denen die Domain-Sicherheit öffentlich versagte. Die meisten Folgen handeln von Namen, die von Angreifern gestohlen wurden. Diese ist anders — und beunruhigender — weil niemand einen Angriff durchführte. Die bei weitem wichtigste Domain der Erde wurde zum Listenpreis an die erste Person verkauft, die sie zufällig in einen Warenkorb legte.

## Was google.com normalerweise ist

Es ist schwer zu übertreiben, was google.com wert ist, denn die Zahl ist eigentlich keine richtige Zahl.

Google.com ist das Eingangsportal zur meistgenutzten Suchmaschine des Planeten, der Anker für Gmail, Maps, Ads, YouTube-Kontoabläufe und das Authentifizierungsfundament für Milliarden von Menschen. Slate bezeichnete es anlässlich des Vorfalls als ["die meistbesuchte Domain der Welt"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.). Was auch immer Tesla.com oder Cars.com eingebracht haben — google.com ist in einer eigenen Kategorie: Es ist kein Marken-Asset, sondern *Infrastruktur*, die ein großer Teil der Weltbevölkerung täglich berührt.

Eine solche Domain sollte unantastbar sein. Sie sollte gesperrt, markiert, registry-gesichert, server-gesperrt und übertragungsverboten sein — in jeden Schutz eingehüllt, den ein [Registrar](/de/glossary/registrar/) anwenden kann. Das gesamte Prinzip der Domain-Sicherheit besagt: Je kritischer der Name, desto schwieriger ist es, ihn zu verschieben.

Und dann, für 12 Dollar, wurde er verschoben.

## Die 12-Dollar-Minute

![Lebendige bunte Konzeptkunst eines leuchtenden, globusförmigen Domains mit einem kleinen Zwölf-Dollar-Preisschild, einer einzelnen Münze, die in einen Checkout-Schlitz fällt, während eine Ein-Minuten-Sanduhr zu laufen beginnt](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Ved war nicht auf der Suche nach Schwierigkeiten. Er war ein Ex-Googler — er hatte früher als Account Strategist für das Unternehmen gearbeitet — und spät in der Nacht stöberte er in Google Domains, Googles damals neuem Registrar-Dienst, und schaute sich Domain-Namen an. Aus einer Laune heraus tippte er den großen Namen ein.

Nach seiner eigenen Schilderung blieb ihm das Ergebnis die Luft weg: ["Ich tippe Google.com ein und zu meiner Überraschung wird er als verfügbar angezeigt,"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available) erzählte Ved Business Insider. Nicht „premium", nicht „Angebot machen", nicht „diese Domain ist vergeben." *Verfügbar.* Für die Standard-Registrierungsgebühr von 12 Dollar.

Er legte ihn in seinen Warenkorb und checkte aus, in der festen Erwartung, dass das System ihn ablehnen würde. Das tat es nicht. Die Transaktion wurde abgeschlossen. Wie The Hacker News zusammenfasste, hatte ein Ex-Googler ["es geschafft, die meistbesuchte Domain der Welt google.com über Googles eigenen Domains-Dienst für nur 12 Dollar zu kaufen."](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain)

Und dann begann sich sein Posteingang zu füllen. Die Systeme, die an Domain-Eigentumsrechten hängen — die einem verifizierten Domain-Inhaber Benachrichtigungen und Kontrollen senden — sahen einen neuen Inhaber und begannen ihre Arbeit zu tun. Security Affairs beschrieb den Moment: ["In wenigen Sekunden wurden sein Posteingang und die Google Webmaster Tools mit webmaster-bezogenen Nachrichten überflutet, die das Eigentum an den Google.com-Domains bestätigten."](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded)

Für diese eine Minute war Ved nicht nur auf dem Papier als Inhaber eingetragen. Die Maschine behandelte ihn als Inhaber.

## Was man in dieser Minute tatsächlich kontrolliert

Das ist der Teil, der eine lustige Anekdote in eine Sicherheitsgeschichte verwandelt.

Wenn man der verifizierte Inhaber einer Domain im Google-Ökosystem ist, erhält man Zugang zu den **Webmaster Tools** (jetzt Search Console) — dem Dashboard, das Site-Inhaber verwenden, um zu sehen, wie eine Property indiziert wird, Sitemaps einzureichen, interne Nachrichten anzuzeigen und zu verwalten, wie die Domain in der Suche erscheint. Ved sagte später, dass ihm die Implikation nicht entgangen war: ["Das Erschreckende war, dass ich für eine Minute Zugriff auf die Webmaster-Kontrollen hatte,"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute) erklärte er.

Berichte aus dieser Zeit stellten fest, dass er während dieses Zeitfensters ["administrativen Zugang zu Google.com"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=he%20had%20administrative%20access%20to%20Google.com) hatte und dass sein ["Google Search Console-Dashboard mit Nachrichten für die Domain google.com aktualisiert wurde."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated) Denke daran, was das Besitzen einer Domain tatsächlich ermöglicht: [DNS](/de/glossary/dns/)-Einträge, Mail-Routing, die Möglichkeit, gegenüber Dritten „Eigentümerschaft" zu beweisen, und die Suchmaschinen-Kontrollen, die festlegen, wie eine Property der Welt präsentiert wird. Die Registrierung ist der Hauptschlüssel. Alles Nachgelagerte — DNS, Zertifikate, E-Mail, Single Sign-On, Suchindizierung — geht davon aus, dass der Inhaber derjenige ist, der er vorgibt zu sein.

Ved verhielt sich verantwortungsbewusst. Er änderte keinen einzigen Eintrag. Er meldete es sofort. Aber die Lehre daraus ist unabhängig davon klar: Der Unterschied zwischen „ein neugieriger Student" und „einer Katastrophe" war keine technische Kontrolle. Es war die Entscheidung einer einzelnen Person, sich korrekt zu verhalten.

## Googles Reaktion — und seine Antwort

![Lebendige bunte Konzeptkunst eines riesigen leuchtenden Schlüssels, der kurz in einer offenen Hand gehalten wird, dann sanft von einem Lichtstrahl zurückgezogen wird, vor einem bunten Leiterplatten-Himmel mit einer wegschwebenden erstatteten Münze](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Googles automatisierte Systeme erkannten die Anomalie schnell. Innerhalb von etwa einer Minute wurde die Bestellung storniert. Fox News berichtete über die Stornierung direkt: ["Google Domains hat den Verkauf eine Minute später storniert und erklärt, jemand habe die Website vor ihm registriert, und erstattete Ved die 12 Dollar."](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later) Der „jemand", der sie zuerst registriert hatte, war natürlich Google selbst.

Dann tat Google das, was die Geschichte zur Legende werden ließ. Über sein Vulnerability Reward Program zahlte es Ved ein Kopfgeld — und das Unternehmen wählte die Zahl bewusst. In seinem offiziellen Sicherheitsjahresrückblick 2015 schrieb Google: ["Unsere anfängliche finanzielle Belohnung für Sanmay — $ 6.006,13 — buchstabierte Google numerisch (blinzle ein wenig, dann wirst du es sehen!). Wir haben diesen Betrag dann verdoppelt, als Sanmay seine Belohnung für wohltätige Zwecke spendete."](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay) (Lies es als Ziffern: 6-0-0-6-1-3 → G-O-O-G-L-E.)

Ved entschied sich, das Geld weiterzugeben. Er bat darum, dass es der Art of Living India Foundation zugutekam, die kostenlose Schulen in ganz Indien unterstützt — und als Google von der Spende erfuhr, verdoppelte es die Belohnung, wodurch die Gesamtsumme auf etwa **12.012,26 Dollar** stieg. Veds eigene Einschätzung der gesamten Episode drehte sich nie um die Auszahlung. ["Es geht mir nicht um das Geld. Es ging mir nie ums Geld,"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money) sagte er Business Insider.

Ein 12-Dollar-Fehler wurde zur Geschichte über ein cleveres Kopfgeld, eine großzügige Spende und ein Unternehmen, das diese verdoppelte. Aber wenn man den guten Willen beiseitelässt, ist die zugrundeliegende Tatsache erschreckend: Ein Registrar übergab die Schlüssel zu seinem eigenen Königreich, und das Einzige, das sie zurückholte, war eine schnelle automatisierte Reaktion — und ein Käufer, der zufällig ehrlich war.

## Wie kann eine so wichtige Registrierung durchrutschen?

Wie kann die einzelne am stärksten geschützte Domain der Erde in einem Self-Service-Checkout als „für 12 Dollar verfügbar" erscheinen?

Die ehrliche Antwort ist, dass niemand außer Google das vollständige interne Post-mortem hat, und wir werden das nicht so tun als ob. Aber die *Form* des Versagens ist jedem vertraut, der mit Domain-Systemen gearbeitet hat, und es lohnt sich, präzise zu sein, was wir sagen können und was nicht.

Was verifizierbar ist, ist das sichtbare Verhalten. Berichte aus dieser Zeit brachten die beiden gewöhnlichen Erklärungen vor: ["Es könnte ein Bug in Google Domains gewesen sein, oder das Unternehmen hat schlicht vergessen, seinen Domain-Namen zu erneuern, als die Zeit gekommen war."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew) So oder so lieferte die Logik des Storefronts „Ist dieser Name zur Registrierung verfügbar?" für kurze Zeit die falsche Antwort für einen Namen, der hätte fest codiert als unverkäuflich sein sollen.

Die tiefere Lehre ist architektonischer Natur. Der Schutz einer Domain ist nur so gut wie der *schwächste Weg, sie zu ändern*. Eine Registry kann Server-Hold- und Übertragungsverbots-Flags anwenden; ein Registrar kann einen Namen sperren; eine Organisation kann Multi-Faktor-Authentifizierung und Genehmigungs-Workflows auf Registrar-Ebene aktivieren. Aber wenn eine einzelne Schnittstelle — ein Einzelhandels-Checkout, ein internes Admin-Tool, ein Support-Override, ein API-Endpunkt — die Eigentumsrechte ohne das Auslösen dieser Schutzmaßnahmen ändern kann, dann ist der Name genau so sicher wie diese eine schwächste Schnittstelle. Der Schadenradius einer Domain-Übernahme ist enorm (DNS, E-Mail, Zertifikate, Login), aber die Angriffsfläche, die sie auslöst, kann winzig sein: ein Formular, das „Nein" hätte sagen sollen und stattdessen „Ja" sagte.

Diese Asymmetrie ist das eigentliche Problem. Der auf dem Spiel stehende Wert ist maximal. Die zum Verschieben erforderliche Aktion kann minimal sein.

## Was das über Domain-Kontrolle lehrt

Aus der 12-Dollar-Minute lassen sich einige dauerhafte Lehren ziehen:

1. **Der Inhaber-Datensatz ist der Hauptschlüssel.** DNS, TLS-Zertifikate, E-Mail-Zustellbarkeit und „Beweise, dass du diese Domain besitzt"-Abläufe vertrauen alle der darunter liegenden Registrierung. Wer die Registrierung kontrolliert, kontrolliert alles, was davon abhängt. Schütze diese Schicht wie das Root-Passwort, das sie effektiv ist.

2. **Kritikalität und Schutz korrelieren nicht automatisch.** Man würde annehmen, dass die wichtigste Domain der Welt am stärksten gesperrt ist. Für eine Minute war sie es nicht. Wichtigkeit setzt sich nicht von selbst durch; explizite Sperren, Holds und Genehmigungsgates tun es. Prüfe sie; nehme sie nicht als gegeben hin.

3. **Die Kontrollebene ist größer als DNS.** Menschen sichern ihre Nameserver und vergessen dabei das Registrar-Konto, den Support-Kanal, die Abrechnungs-E-Mail und die interne Werkzeugausstattung. Eine Domain kann durch jede Tür verloren gehen, die Eigentumsrechte neu schreiben kann — nicht nur durch die mit der Aufschrift „DNS."

4. **Man ist oft nur eine ehrliche Person von einer Katastrophe entfernt.** Google hatte Glück, dass der Käufer ein sicherheitsbewusster Ex-Mitarbeiter war, der es sofort meldete. Sicherheit, die vom guten Willen desjenigen abhängt, der zufällig hereinkommt, ist keine Sicherheit. Das System, nicht der Besucher, sollte das sein, was Nein sagt.

5. **Schnelle Erkennung ist eine echte Kontrolle.** Googles automatisierter Catch in etwa einer Minute begrenzte den Schaden tatsächlich erheblich. Man kann nicht jeden Fehler verhindern, aber eine enge Überwachung von Eigentumsänderungen verkleinert das Zeitfenster, in dem ein Versehen zu einem Sicherheitsverstoß wird.

Der beruhigende Teil dieser Geschichte ist, dass Googles Systeme es bemerkten und rückgängig machten. Der unangenehme Teil ist, dass sie es mussten.

## Die Namefi-Perspektive

![Farbenfrohe Illustration von verifizierbarem, manipulationsresistentem Domain-Eigentum — eine Domain-Karte gesichert durch ein grünes Schild, ein grünes Namefi-Token und DNS-Kontinuität](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

Die 12-Dollar-Minute ist im Kern eine Frage nach einem Datensatz: *Wer ist der verifizierte Eigentümer dieses Namens gerade jetzt, und wie schwer ist es, das stillschweigend zu ändern?*

Im traditionellen Modell lebt die Antwort in der Datenbank eines Registrars, veränderbar durch alle Schnittstellen, die der Registrar bereitstellt — Einzelhandels-Checkout, Admin-Override, Support-Ticket, API. Die meisten dieser Schnittstellen sind gut gesichert. Aber Eigentumsrechte sind nur so sicher wie die am wenigsten gesicherte — und der Eigentümer kann normalerweise nicht in Echtzeit den Moment sehen, in dem sein Datensatz die Hände wechselt. Sanmay Ved erfuhr, dass er google.com „besaß", weil sein Posteingang aufleuchtete — nicht weil ein gehärtetes Hauptbuch eine verifizierte, autorisierte Übertragung ankündigte.

[Namefi](https://namefi.io) geht von der Prämisse aus, dass Domain-Eigentum **verifizierbar und manipulationserkennbar** sein sollte, nicht in einer einzelnen veränderbaren Zeile vergraben. Indem Domain-Kontrolle als tokenisiertes, On-Chain-Asset dargestellt wird, das mit DNS kompatibel bleibt, wird der Vorgang „wem gehört diese Domain" zu etwas, das man unabhängig überprüfen und prüfen kann — und eine Übertragung wird zu einem expliziten, autorisierten, sichtbaren Ereignis, anstatt zu einem Checkout, der still und heimlich erfolgreich ist. Das Ziel ist nicht, Domains exotisch zu machen; es geht darum, den Hauptschlüssel schwerer aus Versehen in die falschen Hände zu geben und unmöglich zu verschieben, ohne eine Spur zu hinterlassen.

Google.com schnappte in einer Minute zurück, weil Google schnelle Erkennung auf einem fragilen Primitiv aufgebaut hat. Die bessere Antwort ist, das Primitiv selbst vertrauenswürdig zu machen: Eigentum, das man beweisen kann, Übertragungen, die man sehen kann, und Kontrolle, die nicht von einem einzelnen Formular abhängt, das sich daran erinnern muss, „Nein" zu sagen.

## Quellen und weiterführende Lektüre

- Google Online Security Blog — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1) (Primärquelle für die 6.006,13-Dollar-Belohnung und die verdoppelte Spende)
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/) (zitiert Googles Blog wörtlich)
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- Fox News — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- Fox News — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- Yahoo Finance — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)
