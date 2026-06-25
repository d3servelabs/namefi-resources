---
title: 'Der Panix.com-Domain-Hijack: Wie eine Fünf-Tage-Automatik-Genehmigungsregel den ältesten ISP New Yorks stahl'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Im Januar 2005 wurde panix.com – die Domain des ältesten kommerziellen ISPs New Yorks – mithilfe gestohlener Kreditkarten betrügerisch zu einem Registrar in Australien übertragen, wodurch Web und E-Mail tagelang ausfielen. Die damals geltenden Regeln zur automatischen Genehmigung von Registrar-Transfers machten dies möglich, und die Aufarbeitung formte die Domain-Transfer-Richtlinien grundlegend um.'
keywords: ['panix.com', 'panix domain hijack', 'Domain-Entführung', 'inter-registrar transfer', 'Melbourne IT', 'Dotster', 'Fibranet', 'ICANN Transfer Policy', 'Registrar Lock', 'clientTransferProhibited', 'Domain-Sicherheit', 'DNS-Hijacking', 'EPP Auth-Code']
---

Mehr als fünfzehn Jahre lang lebte einer der ältesten kommerziellen Internetanbieter der Vereinigten Staaten unter einer einzigen Adresse: **panix.com**. Dann, über ein langes Feiertagswochenende im Januar 2005, wurde sie ihm weggenommen.

Nicht durch das Hacken eines Servers. Nicht durch das Erraten eines Passworts. Jemand füllte ein Transferformular aus, zahlte mit einer gestohlenen Kreditkarte und wartete darauf, dass eine brandneue [ICANN](/de/glossary/icann/)-Regel den Rest erledigen würde. Innerhalb weniger Stunden war das Eigentum an panix.com auf ein Unternehmen in Australien übertragen worden, sein DNS auf einen Host im Vereinigten Königreich gerichtet und sein E-Mail-Verkehr über Kanada umgeleitet – alles, während die Menschen, die Panix tatsächlich betrieben, in der Nacht von Samstag auf Sonntag schliefen, ohne jegliche Vorwarnung erhalten zu haben.

Dies ist die Geschichte davon, wie ein administratives Papierstück – kein Exploit – den ältesten ISP New Yorks entführte und wie die Aufarbeitung dazu beitrug, die Regeln neu zu schreiben, die bestimmen, wer eine Domain übertragen darf.

## Ein bahnbrechender ISP, dessen gesamtes Geschäft von einer einzigen Domain abhing

Panix – Public Access Networks Corporation – war keine Kleinigkeit. Gegründet im Jahr 1989, war es laut Wikipedia der [drittälteste ISP der Welt nach The World und NetCom](https://en.wikipedia.org/wiki/Panix_(ISP)#:~:text=third%2Doldest%20ISP%20in%20the%20world%20after%20The%20World%20and%20NetCom). Es war ein fester Bestandteil des frühen kommerziellen Internets in New York City: Shell-Accounts, E-Mail, Web-Hosting, die Einwahl- und späteren Breitbandverbindungen, die Tausende New Yorker nutzten, um online zu gehen.

Und wie fast jedes Internetunternehmen damals wie heute *war* Panix' Identität seine Domain. Kunden-Postfächer endeten auf `@panix.com`. Die Webserver antworteten auf `www.panix.com`. Das gesamte Unternehmen – seine Marke, seine Erreichbarkeit, das, was dafür sorgte, dass eine Kunden-E-Mail tatsächlich ankam – hing an den DNS-Einträgen, die an einem einzigen Namen hingen. Die Kontrolle über diesen Namen zu verlieren bedeutete nicht, ein Marketinggut zu verlieren. Es bedeutete, das Nervensystem des Unternehmens zu verlieren.

Genau das ist passiert.

## Januar 2005: der betrügerische Transfer

Die rechtliche Aufzeichnung ist präzise hinsichtlich des Datums. Wie die Anwaltskanzlei Davis Wright Tremaine es damals zusammenfasste, [ereignete sich am Freitag, dem 14. Januar 2005, ein aufsehenerregender Hijacking-Vorfall, bei dem der Domainname „panix.com", der dem gleichnamigen New Yorker Internetdienstanbieter gehörte, ohne Genehmigung auf einen Dritten übertragen wurde](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=On%20Friday%2C%20Jan.%2014%2C%202005%2C%20a%20high%2Dprofile%20hijacking%20occurred).

In den frühen Morgenstunden dieses Wochenendes waren die Folgen bereits eingetreten. The Register beschrieb die Umleitung in einem einzigen Satz, der noch heute wie ein Heist-Diagramm klingt: [Das Eigentum an panix.com wurde auf ein Unternehmen in Australien übertragen, die eigentlichen DNS-Einträge wurden zu einem Unternehmen im Vereinigten Königreich verschoben, und die Post von panix.com wurde zu einem weiteren Unternehmen in Kanada umgeleitet](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=The%20ownership%20of%20panix.com%20was%20moved%20to%20a%20company%20in%20Australia).

Slashdot, wo die Neuigkeit am 16. Januar der breiteren technischen Community bekannt wurde, brachte es auf den Punkt: [Panix, der älteste kommerzielle Internetanbieter in New York, hat seinen Domainnamen 'panix.com' von unbekannten Personen entführt bekommen](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked).

Das vernichtendste Detail aus Panix' Sicht war die Stille. Das [1989 gegründete Unternehmen und älteste kommerzielle ISP New Yorks erklärte, weder es selbst noch sein Registrar habe eine Benachrichtigung über die geplanten Änderungen erhalten](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=neither%20it%20nor%20its%20registrar%20received%20any%20notification%20of%20the%20proposed%20changes). Der Transfer, der die Domain wegnahm, war für den rechtmäßigen Eigentümer offenbar völlig unsichtbar – bis er bereits vollzogen war.

## Die Störung: Web und E-Mail tagelang offline

![Lebendige farbige Konzeptkunst einer Hausurkunde, die still auf einen Fremden im Ausland umgeschrieben wird, während der rechtmäßige Eigentümer schläft – ein leuchtendes Papierdokument gleitet über einen Ozean in Richtung eines fremden Schreibtisches, der um Mitternacht abgestempelt wird](../../assets/the-panix-com-domain-hijack-01-hijack.jpg)

Eine gekaperter Domain ist kein sauberer Ein/Aus-Schalter – es ist ein langsames, hässliches Verblassen, und der schlimmste Schaden entsteht durch die E-Mail.

Wenn man die [DNS](/de/glossary/dns/)-Kontrolle über eine Domain hat, kontrolliert man, wohin ihre E-Mails zugestellt werden. Durch das Umzeigen der E-Mail-Einträge von panix.com machten sich die Entführer zum Postamt der gesamten Kundenbasis eines ISPs. Eingehende Nachrichten – Rechnungen, Passwort-Resets, Geschäftskorrespondenz, private Post – hörten auf, bei Panix anzukommen, und flossen stattdessen zu einem Server, den die Angreifer kontrollierten. InfoWorld berichtete nach dem Ende des Vorfalls, dass der Hijack [einige Panix-Kunden zwei Tage lang des E-Mail-Zugangs beraubt hatte](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html) und dass einige dieser Kunden über das Wochenende möglicherweise hundert oder mehr Nachrichten verloren hatten.

Post, die während eines Hijacks fehlgeleitet wird, ist nicht einfach verzögert. Vieles davon ist verloren – zurückgeworfen, verworfen oder still von einem Server verschluckt, der sie nie hätte empfangen sollen. Für einen Anbieter, dessen Kunden den Wert des Dienstes daran maßen, ob ihre E-Mail ankam, waren tagelange Fehlzustellungen nahezu der schlimmstmögliche Ausfall.

Und die Kunden konnten nichts tun. Das Problem lag nicht bei Panix' Maschinen, die einwandfrei liefen. Es lag in der globalen Routing-Tabelle des Domain Name Systems, das – von einem [Registrar](/de/glossary/registrar/) in Australien auf Basis einer betrügerischen Anfrage – darüber informiert worden war, dass panix.com jetzt jemandem anderem gehöre.

## Wie es passierte: die Hintertür der automatischen Transfer-Genehmigung

![Lebendige farbige Konzeptkunst eines riesigen Gummistempels, der GENEHMIGT auf ein Transferformular für einen leuchtenden Domain-Schlüssel drückt – ohne Identitätsprüfung, ohne Unterschrift, ohne Wächter am Schreibtisch – mit einer Uhr im Hintergrund, die fünf Tage herunterzählt](../../assets/the-panix-com-domain-hijack-02-transfer-loophole.jpg)

Hier ist der Teil, der Panix zu einem Meilenstein-Fall macht – und nicht nur zu einem weiteren schlechten Wochenende: Niemand hat eingebrochen. Das System funktionierte genau wie vorgesehen. Das Design war die Schwachstelle.

Die Mechanik verlief über eine Kette von Zwischenhändlern. Panix' Domain war bei **Dotster** registriert, einem Registrar in Vancouver, Washington. Der betrügerische Transfer wurde über ein Konto bei **Fibranet Services Ltd.**, einem britischen Wiederverkäufer, initiiert, das ihn an **Melbourne IT**, einen großen australischen Registrar, weiterleitete. Wie InfoWorld berichtete, [ermöglichte ein Fehler von Melbourne IT Ltd. Betrügern, die gestohlene Kreditkarten verwendeten, die Kontrolle über panix.com zu übernehmen](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html) – das für den Transfer verwendete Konto war [betrügerisch und mit gestohlenen Kreditkarten eingerichtet worden](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html).

Aber der Kreditkartenbetrug öffnete nur das Konto. Was die Domain tatsächlich verschob, war eine Richtlinie. ICANN hatte einen neuen Inter-Registrar-Transferprozess eingeführt, der erst Wochen zuvor, im November 2004, in Kraft getreten war und auf dem Prinzip der *Standard-Genehmigung* basierte. Wie The Register erklärte, bedeutete der neue Rahmen, [dass diese Regeln, die letzten November in Kraft traten, dazu führen, dass Inter-Registry-Transferanfragen nach fünf Tagen automatisch genehmigt werden, sofern der Domain-Inhaber sie nicht widerruft](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=automatically%20approved%20after%20five%20days%20unless%20countermanded%20by%20the%20domain%20owner).

Lesen Sie das noch einmal, denn das ist die ganze Geschichte. Schweigen bedeutete *Ja*. Wenn der rechtmäßige Eigentümer nichts unternahm – weil er beispielsweise die Benachrichtigung nie erhalten hatte –, wurde der Transfer von selbst abgeschlossen. Davis Wright Tremaine beschrieb dieselbe Falle aus rechtlicher Sicht: Die neuen Regeln [machen betrügerische Transfers wohl leichter durchführbar, weil Domains gemäß den Regeln automatisch übertragen werden, sofern der Eigentümer die Transferanfrage nicht innerhalb von fünf Tagen widerruft](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=automatically%20transferred%20unless%20the%20owner%20countermands%20the%20transfer%20request%20within%20five%20days).

Stapelt man die Versäumnisse, ergibt sich ein düsteres Bild. Der *aufnehmende* Registrar (Melbourne IT über Fibranet) akzeptierte eine Anfrage, die auf einer gestohlenen Karte basierte, und gab nach eigenem späterem Eingeständnis zu, [die Anfrage nicht ordnungsgemäß verifiziert zu haben](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=failed%20to%20properly%20verify%20the%20request). Der *abgebende* Registrar (Dotster) und der rechtmäßige Eigentümer (Panix) erhielten keine wirksame Benachrichtigung und widerriefen daher nichts. Und der Standardwert der Richtlinie – genehmigen, sofern niemand widerspricht – verwandelte das Ausbleiben eines Widerspruchs in einen vollendeten Diebstahl. Es wurde keine Firewall durchbrochen. Das Papierstück war der Angriff.

## Wiederherstellung und die dadurch ausgelösten Richtlinienreformen

Die Wiederherstellung war, sobald Menschen eingreifen konnten, schnell – und das ist seine eigene Anklage, denn es bewies, dass der Transfer von Anfang an nicht hätte genehmigt werden dürfen.

Am Sonntag [hatte Panix seine Domain panix.com vom australischen Domain-Hosting-/Registrierungsunternehmen Melbourne IT, bei dem die gestohlene Domain geparkt worden war, zurückgewonnen](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=Panix%20had%20recovered%20its%20Panix.com%20domain) und sie zurück zu ihrem natürlichen Zuhause bei Dotster gezeigt. Die Korrektur auf [Registry](/de/glossary/registry/)-Ebene war nahezu sofort; die globale Bereinigung war es nicht, denn DNS vergisst nicht auf Befehl. Wie The Register feststellte, wurden die [Root-Server](/de/glossary/root-zone/) schnell aktualisiert, aber die verteilte Natur des DNS bedeutete, dass es bis zu 24 Stunden dauern würde, bevor die Normalität vollständig wiederhergestellt war – Caches auf der ganzen Welt mussten erst ablaufen, bevor jeder Nutzer das echte panix.com wieder sah.

Melbourne IT versteckte sich zu seinem Verdienst nicht. Zwei Tage später berichtete The Register, dass [ein australischer Domain-Registrar seinen Anteil am Hijacking des vergangenen Wochenendes eingestanden hat](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=An%20Australian%20domain%20registrar%20has%20admitted%20to%20its%20part), das Versäumnis auf einen Verifikationsschritt in seinem Transferprozess zurückführte, der nicht durchgeführt worden war, und versprach, dass die Lücke, die den Fehler ermöglicht hatte, geschlossen worden sei.

Die wichtigere Folge war jedoch struktureller Natur. Panix wurde zum Lehrbuchbeispiel in der umfassenderen Abrechnung über Transfer-Sicherheit, die folgte. Das ICANN Security and Stability Advisory Committee veröffentlichte 2005 einen Bericht, [*Domain Name Hijacking: Incidents, Threats, Risks, and Remedial Actions*](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf), der genau diese Art von Versagen untersuchte – Registrare, die Transfers akzeptierten, ohne zu bestätigen, dass der Antragsteller tatsächlich der [Registrant](/de/glossary/registrant/) war. Die dauerhaften Korrekturen, die das System gehärtet haben, gehen direkt auf Wochenenden wie dieses zurück:

- **Registrar-Locks als Standard.** Eine Domain mit dem Status `clientTransferProhibited` weigert sich schlicht, transferiert zu werden, bis die Sperre vom rechtmäßigen Inhaber aufgehoben wird. Was einst ein obskures Opt-in war, wurde bei vielen Registraren zum Standardzustand – eine Bremse, die die Automatik-Genehmigungsregel nicht überschreiben konnte.
- **Auth-Codes (EPP-Transfer-Codes).** Moderne [gTLD](/de/glossary/gtld/)-Transfers erfordern einen geheimen Autorisierungscode, den der *abgebende* Registrar nur an den verifizierten Registranten herausgibt, sodass ein aufnehmender Registrar eine Domain nicht mehr allein auf Basis von Papierkram übertragen kann.
- **Eine dokumentierte [ICANN Transfer Policy](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)** mit strengeren Bestätigungspflichten und einem Notfall-Kontaktkanal zur schnellen Umkehrung genau dieser Art betrügerischer Transfers.

Der Panix-Hijack hat diese Mechanismen nicht allein erfunden, aber er wurde zum Fall, auf den jeder verwies, wenn argumentiert wurde, dass sie notwendig sind.

## Was dies über Transfer-Locks und Verifizierung lehrt

Streicht man die Daten und Registrar-Namen heraus, hinterlässt Panix einige dauerhafte Lektionen.

1. **Standard-Erlaubnis ist eine Sicherheitsentscheidung – und meist die falsche.** Die gefährlichste Design-Entscheidung des Jahres 2005 war, dass *Schweigen Zustimmung bedeutet*. Ein Transfer, der abgeschlossen wird, wenn der Eigentümer nichts tut, setzt voraus, dass der Eigentümer immer aufpasst und immer erreichbar ist. Beides trifft über ein Feiertagswochenende nicht zu.
2. **Identität muss von der Partei verifiziert werden, die das Gut abgibt – nicht nur von der, die es übernimmt.** Der aufnehmende Registrar wollte das Geschäft und hatte jeden Anreiz, Ja zu sagen. Echte Sicherheit entstand erst, als der *abgebende* Registrar einen Auth-Code an einen verifizierten Inhaber herausgeben musste – die Verifizierung also dorthin verlegte, wo das Gut tatsächlich liegt.
3. **Schalten Sie den Lock ein.** `clientTransferProhibited` ist der günstigste und wirksamste Schutz, den ein Domain-Inhaber gegen genau diesen Angriff hat, und er kostet nichts. Eine gesperrte Domain kann nicht stillschweigend übertragen werden, egal wie überzeugend die Papiere sind. Sperren Sie Ihre wichtigen Namen und lassen Sie sie gesperrt.
4. **Ihre Domain ist Ihr einzelner Fehlerpunkt.** Die Server von Panix wurden nie kompromittiert, und doch war das Unternehmen faktisch offline. Wenn ein einziger Eintrag in einer Registry Ihre gesamte Web- und E-Mail-Präsenz umleiten kann, verdient dieser Eintrag mehr Schutz als Ihre Server.
5. **Beobachten Sie die Benachrichtigungen.** Das Fünf-Tage-Widerruf-Fenster schützt nur einen Eigentümer, der die Transfer-Benachrichtigung tatsächlich erhält – und liest. Eine veraltete Registranten-E-Mail, ein nicht überwachter Admin-Kontakt oder ein Feiertagswochenende verwandelt ein Sicherheitsventil in ein stilles Versagen.

## Der Namefi-Blickwinkel

![Bunte Illustration von verifizierbarem, manipulationssicherem Domain-Eigentum – eine Domain-Karte, gesichert durch ein grünes Schild, ein grünes Namefi-Token und DNS-Kontinuität](../../assets/the-panix-com-domain-hijack-03-namefi-angle.jpg)

Der Panix-Hijack ist im Kern ein *Autoritäts*-Problem. Die Frage „Wer darf diese Domain übertragen?" wurde durch eine Kette von Wiederverkäufern und einen Standard-Genehmigungs-Timer beantwortet – statt durch irgendeinen starken, überprüfbaren Eigentumsnachweis. Eine gestohlene Kreditkarte und fünf Tage Stille reichten aus, um das System davon zu überzeugen, dass ein Fremder auf einer anderen Hemisphäre für einen ISP in New York spricht.

[Namefi](https://namefi.io) geht von der entgegengesetzten Prämisse aus: dass die Kontrolle über eine Domain beweisbar sein sollte, nicht angenommen. Indem [Domain-Eigentum](/de/glossary/domain-ownership/) als tokenisiertes, on-chain-Asset dargestellt wird, das mit DNS kompatibel bleibt, wird die Frage „Wer hält diesen Namen?" kryptografisch verifizierbar und prüfbar – ein Eintrag, der nicht still von einem Registrar überschrieben werden kann, der fehlerhafte Papiere akzeptiert. Transfers erfolgen, wenn der Schlüssel des Inhabers sie autorisiert – nicht wenn eine Fünf-Tage-Uhr unbeaufsichtigt abläuft. Der Standard ist *Ablehnen*, und Zustimmung muss demonstriert, nicht bloß nicht-widersprochen werden.

All das gab es 1989 nicht, als Panix gegründet wurde – oder sogar 2005, als der Hijack geschah. Aber es zeigt auf die Lektion, die dieses Wochenende der gesamten Branche lehrte: Eine Domain ist zu wichtig, um von Schweigen regiert zu werden. Eigentum sollte etwas sein, das man auf Abruf beweisen kann – und das ein Fremder nicht einfach nehmen kann, weil man über ein langes Wochenende nicht in den Posteingang geschaut hat.

## Quellen und weiterführende Lektüre

- The Register — [Panix erholt sich vom Domain-Hijack](https://www.theregister.com/2005/01/17/panix_domain_hijack/)
- The Register — [Panix.com-Hijack: Australische Firma trägt die Verantwortung](https://www.theregister.com/2005/01/19/panix_hijack_more/)
- Davis Wright Tremaine — [Guarding Against Domain Name Hijacking](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking)
- InfoWorld — [Australian company takes blame for Panix domain hijack](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)
- Slashdot — [New York's Oldest ISP Gets Domain-Jacked](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked)
- Wikipedia — [Panix (ISP)](https://en.wikipedia.org/wiki/Panix_(ISP))
- Wikipedia — [Domain hijacking](https://en.wikipedia.org/wiki/Domain_hijacking)
- ICANN SSAC — [Domain Name Hijacking: Incidents, Threats, Risks, and Remedial Actions (2005)](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)
- ICANN — [Transfer Policy](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)
- NANOG mailing list archive — [Diskussion über den panix.com-Transfer und ICANN-Maßnahmen](https://diswww.mit.edu/charon/nanog/77162)
