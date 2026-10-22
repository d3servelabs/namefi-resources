---
title: "Abgelaufene Domains und der Drop-Zyklus, erklärt"
date: '2026-06-21'
language: de
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 3
format: explainer
description: "Unterscheide Registrarfristen und Registry-Löschung: Rückgewinnung, Pending Delete, Ablaufauktionen und Drop-Catching ohne universellen Countdown."
ogImage: ../../assets/expired-domains-and-the-drop-cycle-og.jpg
keywords: ['abgelaufene Domains', 'Domain-Drop-Zyklus', 'Domain-Lebenszyklus', 'Redemption Grace Period', 'Pending Delete', 'Domain Drop Catching', 'abgelaufene Domainnamen', 'wie Domains ablaufen', 'gedroppte Domains', 'Domain-Sniping', 'abgelaufene Domains kaufen', 'Domain Redemption Period', 'wann droppen Domains', 'Domain-Backorder', 'Domains zum Flippen finden']
relatedArticles:
  - /de/blog/domain-backorders-and-drop-catching/
  - /de/blog/domain-flipping/
  - /de/blog/how-to-win-domain-auctions/
  - /de/blog/hand-registering-domains-to-flip/
  - /de/blog/when-to-drop-a-domain/
relatedTopics:
  - /de/topics/domain-investing/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/domain-flipping-skills/
  - /de/series/name-change-game-change/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/icann/
  - /de/glossary/tld/
  - /de/glossary/dns/
  - /de/glossary/registry/
---

Eine abgelaufene Domain ist nicht sofort frei. Der Registrar verwaltet Kundenfristen und mögliche Auktionen. Die Registry verwaltet Löschung und Freigabe. Dieser Artikel verwendet gewöhnliche `.com`-Registrierungen als Beispiel. Länderendungen und gesponserte Endungen können anderen Regeln folgen.

Flipper interessieren sich für diese Ecke des Marktes, weil gedroppte Namen keine unbeschriebenen Blätter sind. Ein Name erreicht den Drop nur, weil ihn jemand registriert, genutzt und dann aufgegeben hat — er kann also Alter, eingehende Links, Resttraffic oder eine Zeichenfolge mitbringen, die an dem Tag belegt war, an dem Sie ihn sonst per Hand registriert hätten. Der Zyklus ist ein Recyclingstrom für Namen, von denen schon einmal jemand bewiesen hat, dass er sie wollte — ein anderes Risikoprofil als bei einer brandneuen Zeichenfolge und einer der Beschaffungskanäle, die wir in [wie man Domains zum Flippen findet](/de/blog/how-to-find-domains-to-flip/) kartieren. Dieser Erklärartikel geht den Lebenszyklus Stufe für Stufe durch und behandelt dann, wo gedroppte Namen auftauchen und wie sich Flipper positionieren, um sie zu fangen.

## Stufe eins: das aktive Registrierungs- und Verlängerungsfenster

Die Registry kann eine `.com`-Registrierung automatisch verlängern, obwohl der Kunde nicht bezahlt hat. Die 45-tägige Auto-Renew Grace Period betrifft die Abrechnung zwischen Registry und Registrar. Bei rechtzeitiger Löschung kann der Registrar die entsprechende Gutschrift erhalten. Kunden erhalten dadurch keine garantierte Verlängerungsfrist von 45 Tagen. Ein späteres Ablaufdatum beweist auch keine Kundenzahlung. Siehe [Anhang 7, Abschnitt 3.1.3 des aktuellen Vertrags](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm). Die [aktuelle ICANN-Richtlinie, Abschnitt 2.2](https://www.icann.org/resources/pages/errp-2024-02-21-en) erlaubt Löschungen nach Ablauf gemäß den geltenden Regeln.

## Stufe zwei: die Redemption Grace Period

![Redaktionelle Illustration eines Domain-Namensschilds, das in einer Sanduhr innerhalb eines Countdown-Zifferblatts schwebt, während eine Hand eine Münze anbietet, um eine Rückhol-Gebühr zu zahlen, bevor die Zeit abläuft](../../assets/expired-domains-and-the-drop-cycle-01-redemption.jpg)

Die Löschung einer gewöhnlichen `.com`-Registrierung außerhalb der anfänglichen Add Grace Period startet `redemptionPeriod` für 30 Kalendertage. Das Ablaufdatum allein startet diese Frist nicht. Der bisherige Registrant muss die Wiederherstellung beim löschenden Registrar beantragen. Die Registry deaktiviert die DNS-Auflösung. ICANN verlangt 30 Tage bei nicht gesponserten gTLDs, mit einer Ausnahme für Löschungen während der Add Grace Period. Eine allgemeine Gebühr von 100 US-Dollar gibt es nicht. Erfragen Sie den Gesamtpreis für Wiederherstellung und Verlängerung. Siehe [Abschnitte 3 und 4 der aktuellen Richtlinie](https://www.icann.org/resources/pages/errp-2024-02-21-en).

## Stufe drei: Pending Delete

Ohne Wiederherstellung folgt bei gewöhnlichen `.com`-Registrierungen die abschließende Pending-Delete-Phase von fünf Kalendertagen. Die Registry lehnt Änderungen ab und entfernt anschließend die Registrierung. [Anhang 7, Abschnitt 3.3.2](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm) legt diese Frist fest.

Prüfen Sie die vollständige Statuskombination. `pendingDelete` kann zusammen mit `redemptionPeriod` oder `pendingRestore` auftreten. Dann gilt die Beschreibung der Wiederherstellung beziehungsweise Rückgewinnung. Der [ICANN-Statusleitfaden](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en) erklärt den Unterschied. Der öffentliche Status ergibt keine genaue Freigabeuhrzeit. Die Summe 45 + 30 + 5 garantiert keine Freigabe am 80. Tag nach Ablauf.

## Stufe vier: Freigabe und das Gerangel, sie zu fangen

![Redaktionelle Illustration mehrerer automatisierter Roboter-Server, die durch ein offenes Tor rasen, um ein einzelnes herabfallendes Domain-Namensschild in dem Moment zu fangen, in dem es freigegeben wird](../../assets/expired-domains-and-the-drop-cycle-02-release-scramble.jpg)

Nach der endgültigen Löschung ermöglicht die Registry eine neue Registrierung nach ihren Regeln. Eine Ablaufauktion kann die Domain bereits vor der Löschung verkaufen. Ein Inhaberwechsel muss deshalb keine öffentliche Freigabe voraussetzen. Ein Auktionsdatum ist kein Löschdatum der Registry.

Eine Backorder beauftragt einen Erwerbsversuch und garantiert keinen Erfolg. Mehrere Dienste können nicht jeweils dieselbe Neuregistrierung abschließen. Der erfolgreiche Dienst kann bei mehreren Kundenaufträgen eine Auktion veranstalten. Beispielsweise startet [Dynadot](https://www.dynadot.com/help/question/backorder-auction) nach erfolgreichem Erwerb mit mehreren Backorders eine öffentliche Auktion. Private Auktionen sind keine allgemeine Regel.

## Wo gedroppte Namen auftauchen

![Redaktionelle Illustration einer zentralen Beschaffungs-Drehscheibe mit Lupe, die sich zu vier Kanälen verzweigt — eine Drop-Liste, ein Backorder-Ticket, ein Auktionshammer und ein Aftermarket-Schaufenster —, von denen jeder ein Domain-Namensschild trägt](../../assets/expired-domains-and-the-drop-cycle-03-where-surface.jpg)

Den Zyklus zu kennen hilft nur, wenn Sie wissen, wo Sie ihn beobachten müssen. Gedroppte und droppende Namen tauchen an einigen vorhersehbaren Orten auf, und eine funktionierende Beschaffungsroutine zieht meist aus mehreren zugleich:

- **Drop-Listen und Datenbanken abgelaufener Domains.** Öffentliche und kostenpflichtige Listen veröffentlichen täglich Namen, die in Pending Delete eintreten, oft filterbar nach Länge, [TLD](/de/glossary/tld/), Keyword, Alter und Link-Metriken — der Rohstrom für eine Beobachtungsliste von Namen, die kurz vor der Freigabe stehen.
- **Backorder- und Drop-Catch-Plattformen.** Statt den Kalender selbst zu beobachten, platzieren Sie eine Backorder, und ein Dienst konkurriert bei der Freigabe in Ihrem Namen um den Namen. Das ist der praktische Weg zu allem, was gefragt ist — siehe [Domain-Backorders und Drop Catching](/de/blog/domain-backorders-and-drop-catching/).
- **Auktionen für abgelaufene Domains.** Viele Registrare lassen wertvollen ablaufenden Bestand gar nicht erst in den öffentlichen Drop gelangen; sie leiten ihn während oder nach dem Grace-Fenster in ihre eigenen Auktionen für abgelaufene Domains, sodass der Name verkauft statt freigegeben wird. Das überschneidet sich mit dem breiteren Kanal in [wie man Domain-Auktionen gewinnt](/de/blog/how-to-win-domain-auctions/).
- **Aftermarket-Marktplätze.** Namen, die jemand anderes gefangen hat oder die zurückgeholt und neu gelistet wurden, tauchen zum Wiederverkauf auf dem [Aftermarket](/de/glossary/aftermarket/) wieder auf. Nicht der Drop selbst, aber der Ort, an dem ein Großteil des Post-Drop-Bestands landet.

Der Vorteil des Flippers liegt darin, den Kanal auf den Namen abzustimmen — eine Zeichenfolge mit geringer Konkurrenz auf einer öffentlichen Drop-Liste ist ein guter handregistrierungsnaher Zug, während ein Premium-Einwortname eine Backorder und vermutlich ein Auktionsbudget verlangt. Wenn Ihr Instinkt eher dazu rät, frische Zeichenfolgen zu registrieren, ist das ein legitimer und anderer Weg, beschritten in [Domains zum Flippen per Hand registrieren](/de/blog/hand-registering-domains-to-flip/).

## Den Zyklus als Flipper lesen

Inhaber sollten sofort beim Registrar nach Verlängerung, Wiederherstellung und Gebühren fragen. Käufer sollten Endung, Registrar, vollständige Statuswerte, Abfragezeit, Auktionskanal und Backorderfrist dokumentieren. Das Ablaufdatum garantiert kein Freigabedatum. Ein späterer Verkauf oder Token-Transfer hebt die Verlängerungspflicht der zugrunde liegenden Registrierung nicht auf.

**Die Sorgfaltsprüfung reist mit dem Namen.** Ein gedroppter Name erbt seine Geschichte, und nicht jede Geschichte ist gut. Bevor Sie auf einen gealterten Namen bieten, prüfen Sie seine frühere Nutzung, seine [WHOIS](/de/glossary/whois/)- und Eigentümerspur, etwaige [Registrar](/de/glossary/registrar/)-Sperren und ob er je etwas gehostet hat, das ihn belastet. Ein Name, der zuvor eine Marke verletzt hat, kann in Ihren Händen noch immer eine [UDRP](/de/glossary/udrp/)-Beschwerde anziehen; bestehende Backlinks können ebenso gut Spam wie Gold sein. Der Drop übergibt Ihnen das Asset *und* seinen Ballast.

## Der Namefi-Blickwinkel

Einen großartigen gedroppten Namen zu fangen ist nur die halbe Arbeit; beim nächsten Eigentümerwechsel stoßen Sie auf dieselbe Reibung, auf die jeder hochwertige [Domain-Handel](/de/glossary/domain-trading/) stößt. Der Käufer zahlt nicht, bevor der Name umzieht, der Verkäufer zieht ihn nicht um, bevor er bezahlt wird, und die Übergabe des [Auth-Codes](/de/glossary/auth-code/) zwischen Registraren hinterlässt eine nervöse Lücke in der Mitte. Diese Pattsituation ist der Grund, warum es [Treuhand](/de/glossary/escrow/) gibt, und sie wird umso schärfer, je mehr ein gealterter, linkreicher Name wert ist.

## Freundlicher Haftungsausschluss (Bitte lesen!)

> Wir sind keine Anwälte, Steuerberater, Finanzberater oder Ärzte, und **nichts in diesem Artikel ist eine rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder sonstige Art von professioneller Beratung.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden, und als Service für unsere Kunden. Die Informationen hier können veraltet, geografisch spezifisch oder schlicht falsch sein. Auch wir machen Fehler.
>
> Für jede wichtige Entscheidung **konsultieren Sie bitte einen echten Fachmann (im Ernst!)**. Oder, wenn das nicht Ihr Ding ist, fragen Sie einen Freund, fragen Sie Twitter, fragen Sie Reddit, fragen Sie eine KI oder fragen Sie eine:n Hellseher:in. Kurz gesagt: **DOYR — Do Your Own Research (Recherchieren Sie selbst).** Lassen Sie uns lernen und Spaß haben.

## Quellen und weiterführende Literatur

Quellen am 22. Oktober 2026 (UTC) geprüft. Das ursprüngliche Veröffentlichungsdatum bleibt erhalten.

- [ICANN / Verisign — Aktueller .com-Vertrag, Anhang 7](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm)
- [ICANN — ERRP 2024](https://www.icann.org/resources/pages/errp-2024-02-21-en)
- [ICANN — EPP](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)
- [Dynadot](https://www.dynadot.com/help/question/backorder-auction)
