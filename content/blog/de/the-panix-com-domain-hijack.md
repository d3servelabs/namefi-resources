---
title: 'Der Panix.com-Domain-Hijack: Wie eine fünftägige automatische Genehmigungsregel New Yorks ältesten ISP stahl'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Im Januar 2005 wurde panix.com – die Domain des ältesten kommerziellen ISPs in New York – mithilfe gestohlener Kreditkarten betrügerisch an einen Registrar in Australien übertragen, wodurch Web und E-Mail tagelang offline waren. Die damaligen Regeln zur automatischen Genehmigung von Inter-Registrar-Transfers machten dies möglich, und die anschließende Aufarbeitung veränderte die Domain-Transfer-Richtlinien grundlegend.'
keywords: ['panix.com', 'panix domain hijack', 'domain-hijacking', 'inter-registrar-transfer', 'Melbourne IT', 'Dotster', 'Fibranet', 'ICANN-Transferrichtlinie', 'registrar-lock', 'clientTransferProhibited', 'domain-sicherheit', 'DNS-hijacking', 'EPP-auth-code']
---

Über fünfzehn Jahre lang war einer der ältesten kommerziellen Internetanbieter in den Vereinigten Staaten unter einer einzigen Adresse zu finden: **panix.com**. Doch dann, an einem langen Feiertagswochenende im Januar 2005, riss sie jemand an sich.

Nicht durch das Hacken eines Servers. Nicht durch das Erraten eines Passworts. Die Täter füllten ein Transferformular aus, bezahlten mit einer gestohlenen Kreditkarte und warteten darauf, dass eine brandneue ICANN-Regel den Rest erledigte. Innerhalb weniger Stunden wurde das Eigentum an panix.com an ein Unternehmen in Australien übertragen, das DNS auf einen Host im Vereinigten Königreich umgeleitet und die E-Mails über Kanada geleitet – und all das, während die Leute, die Panix tatsächlich betrieben, in einer Samstagnacht schliefen, ohne auch nur die geringste Vorwarnung erhalten zu haben.

Dies ist die Geschichte, wie ein einfaches Verwaltungsformular – und kein Software-Exploit – New Yorks ältesten ISP kaperte, und wie die anschließende Bereinigung dabei half, die Regeln dafür, wer eine Domain umziehen darf, neu zu schreiben.

## Ein wegweisender ISP, dessen gesamtes Geschäft auf einer Domain aufbaute

Panix – die Public Access Networks Corporation – war keine kleine Nummer. Gegründet 1989, war es laut Wikipedia der [drittälteste ISP der Welt nach The World und NetCom](https://en.wikipedia.org/wiki/Panix_(ISP)#:~:text=third%2Doldest%20ISP%20in%20the%20world%20after%20The%20World%20and%20NetCom). Es war eine feste Größe des frühen kommerziellen Internets in New York City: Shell-Accounts, E-Mail, Webhosting, die Einwahl- und später Breitbandverbindungen, die Tausende von New Yorkern nutzten, um online zu gehen.

Und wie bei fast jedem Internetunternehmen damals wie heute *war* die Identität von Panix seine Domain. Kundenpostfächer endeten auf `@panix.com`. Die Webserver reagierten auf `www.panix.com`. Das gesamte Unternehmen – seine Marke, seine Erreichbarkeit, das, was dafür sorgte, dass die E-Mail eines Kunden tatsächlich ankam – hing von den DNS-Einträgen ab, die mit diesem einen Namen verknüpft waren. Verliert man die Kontrolle über diesen Namen, verliert man nicht nur ein Marketinginstrument. Man verliert das Nervensystem des Unternehmens.

Und genau das ist passiert.

## Januar 2005: Der betrügerische Transfer

Der juristische Bericht nennt den genauen Tag. Wie die Anwaltskanzlei Davis Wright Tremaine es damals zusammenfasste: [am Freitag, den 14. Januar 2005, ereignete sich ein aufsehenerregender Hijack-Vorfall, als der Domainname "panix.com", im Besitz des gleichnamigen New Yorker Internet Service Providers, ohne Autorisierung an eine dritte Partei übertragen wurde](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=On%20Friday%2C%20Jan.%2014%2C%202005%2C%20a%20high%2Dprofile%20hijacking%20occurred).

Schon in den frühen Morgenstunden jenes Wochenendes wurden die Konsequenzen sichtbar. The Register, das über den sich entwickelnden Vorfall berichtete, beschrieb die Umleitung in einem Satz, der sich noch heute wie der Plan eines Raubüberfalls liest: [das Eigentum an panix.com wurde an ein Unternehmen in Australien übertragen, die tatsächlichen DNS-Einträge wurden zu einem Unternehmen im Vereinigten Königreich verlagert, und die E-Mails von Panix.com wurden an ein weiteres Unternehmen in Kanada umgeleitet](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=The%20ownership%20of%20panix.com%20was%20moved%20to%20a%20company%20in%20Australia).

Slashdot, wo die Nachricht am 16. Januar in der breiteren Technik-Community die Runde machte, brachte es auf den Punkt: [Panix, dem ältesten kommerziellen Internetanbieter in New York, wurde sein Domainname 'panix.com' von Unbekannten entwendet (hijacked)](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked).

Das verheerendste Detail aus der Sicht von Panix war jedoch die Stille. Das Unternehmen, [das 1989 gegründet wurde und New Yorks ältester kommerzieller ISP ist, erklärte, dass weder das Unternehmen selbst noch sein Registrar irgendeine Benachrichtigung über die geplanten Änderungen erhalten habe](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=neither%20it%20nor%20its%20registrar%20received%20any%20notification%20of%20the%20proposed%20changes). Der Transfer, der die Domain entwendete, war für den rechtmäßigen Eigentümer völlig unsichtbar – bis er bereits vollzogen war.

## Die Störung: Web und E-Mail tagelang offline

![Vivid colorful concept art of a house deed being quietly re-registered to a stranger overseas while the rightful owner sleeps, a glowing paper title sliding across an ocean toward a foreign desk stamped at midnight](../../assets/the-panix-com-domain-hijack-01-hijack.jpg)

Eine gekaperte Domain ist kein sauberer Ein-/Ausschalter – es ist ein langsames, hässliches Verblassen, und der schlimmste Schaden betrifft die E-Mails.

Wenn man das DNS einer Domain kontrolliert, kontrolliert man auch, wohin deren E-Mails zugestellt werden. Indem die Entführer die Mail-Einträge von panix.com umleiteten, machten sie sich selbst zum Postamt für die gesamte Kundenbasis eines ISPs. Eingehende Nachrichten – Rechnungen, Passwort-Resets, Geschäftskorrespondenz, persönliche E-Mails – kamen nicht mehr bei Panix an, sondern flossen zu einem Server, den die Angreifer kontrollierten. InfoWorld berichtete, nachdem sich der Staub gelegt hatte, dass die Entführung [einige Panix-Kunden zwei Tage lang ihres E-Mail-Zugangs beraubte](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html) und dass einige dieser Kunden über das Wochenende möglicherweise hundert oder mehr Nachrichten verloren haben.

E-Mails, die während eines Hijacks fehlgeleitet werden, verspäten sich nicht einfach nur. Viele davon sind unwiederbringlich verloren – sie werden abgewiesen, verworfen oder stillschweigend von einem Server geschluckt, der sie niemals empfangen sollte. Für einen Anbieter, dessen Kunden den Wert des Dienstes daran maßen, ob ihre "E-Mail ankam", waren Tage voller fehlgeleiteter Nachrichten wohl der schlimmstmögliche Ausfall.

Und die Kunden konnten absolut nichts tun. Das Problem lag nicht an den Maschinen von Panix, diese liefen einwandfrei. Es lag in der globalen Routing-Tabelle des Domain Name Systems, der – von einem Registrar in Australien auf Grundlage einer betrügerischen Anfrage – mitgeteilt worden war, dass panix.com nun jemand anderem gehörte.

## Wie es passierte: Die Lücke der automatischen Transfergenehmigung

![Vivid colorful concept art of a giant rubber stamp slamming APPROVED onto a transfer form for a glowing domain key, with no ID check, no signature, no guard at the desk — a clock in the background showing five days ticking down](../../assets/the-panix-com-domain-hijack-02-transfer-loophole.jpg)

Hier ist der Teil, der Panix zu einem Präzedenzfall und nicht nur zu einem weiteren schlechten Wochenende macht: Niemand ist eingebrochen. Das System funktionierte genau so, wie es entworfen wurde. Das Design selbst war die Schwachstelle.

Die Mechanik verlief über eine Kette von Vermittlern. Die Domain von Panix war bei **Dotster**, einem Registrar in Vancouver, Washington, registriert. Der betrügerische Transfer wurde über ein Konto bei **Fibranet Services Ltd.**, einem Reseller mit Sitz in Großbritannien, initiiert, der diesen an **Melbourne IT**, einen großen Registrar in Australien, weiterleitete. Wie InfoWorld berichtete, [ermöglichte ein Fehler der Melbourne IT Ltd. Betrügern, die gestohlene Kreditkarten nutzten, die Kontrolle über Panix.com zu übernehmen](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html) – das für den Transfer genutzte Konto war [betrügerisch und wurde mit gestohlenen Kreditkarten eingerichtet](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html).

Aber der Kreditkartenbetrug öffnete lediglich das Konto. Was die Domain tatsächlich übertrug, war eine Richtlinie. Die ICANN hatte einen neuen Prozess für Inter-Registrar-Transfers eingeführt, der erst wenige Wochen zuvor, im November 2004, in Kraft getreten war und auf dem Prinzip der *Standardgenehmigung (Default Approval)* basierte. Wie The Register erklärte, bedeuteten diese neuen Rahmenbedingungen, [dass Inter-Registry-Transferanfragen nach fünf Tagen automatisch genehmigt werden, sofern sie nicht vom Domain-Inhaber widerrufen werden](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=automatically%20approved%20after%20five%20days%20unless%20countermanded%20by%20the%20domain%20owner).

Lesen Sie das noch einmal, denn das ist die ganze Geschichte. Schweigen bedeutete *Ja*. Wenn der rechtmäßige Eigentümer nichts tat – beispielsweise weil er die Benachrichtigung nie erhalten hatte –, wurde der Transfer von selbst durchgeführt. Davis Wright Tremaine beschrieb dieselbe Falle von der juristischen Seite aus: Die neuen Regeln [machen es wohl einfacher, betrügerische Transfers durchzuführen, da Domains gemäß den Regeln automatisch übertragen werden, es sei denn, der Eigentümer widerruft die Transferanfrage innerhalb von fünf Tagen](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=automatically%20transferred%20unless%20the%20owner%20countermands%20the%20transfer%20request%20within%20five%20days).

Zählt man diese Fehler zusammen, ergibt sich ein düsteres Bild. Der *empfangende* Registrar (Melbourne IT, via Fibranet) akzeptierte eine Anfrage, die mit einer gestohlenen Karte gedeckt war, und hat nach eigenem späteren Eingeständnis [versäumt, die Anfrage ordnungsgemäß zu überprüfen](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=failed%20to%20properly%20verify%20the%20request). Der *abgebende* Registrar (Dotster) und der rechtmäßige Eigentümer (Panix) erhielten keine wirksame Benachrichtigung und konnten daher auch nichts widerrufen. Und die Standardeinstellung der Richtlinie – genehmigen, es sei denn, jemand widerspricht – verwandelte dieses Fehlen eines Widerspruchs in einen vollendeten Diebstahl. Keine Firewall wurde durchbrochen. Das reine Formularwesen war der Angriff.

## Wiederherstellung und die dadurch ausgelösten Richtlinienreformen

Die Wiederherstellung, sobald Menschen eingriffen, verlief schnell – und das ist ein Armutszeugnis für sich, denn es bewies, dass der Transfer überhaupt nie hätte genehmigt werden dürfen.

Bis Sonntag [hatte Panix seine Domain Panix.com von der australischen Domain-Hosting-/Registrierungsfirma Melbourne IT, wo die gestohlene Domain geparkt war, zurückerhalten](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=Panix%20had%20recovered%20its%20Panix.com%20domain) und wieder auf ihr ursprüngliches Zuhause bei Dotster verwiesen. Die Korrektur auf Registry-Ebene erfolgte fast augenblicklich; die weltweite Bereinigung jedoch nicht, denn das DNS vergisst nicht auf Befehl. Wie The Register anmerkte, wurden die Root-Server zwar schnell aktualisiert, aber die verteilte Natur des DNS bedeutete, dass es bis zu 24 Stunden dauern würde, bis die Normalität vollständig wiederhergestellt war – Caches auf der ganzen Welt mussten erst ablaufen, bevor wieder jeder Nutzer das echte panix.com sah.

Melbourne IT hat sich, was man ihnen zugutehalten muss, nicht versteckt. Zwei Tage später berichtete The Register, dass [ein australischer Domain-Registrar seine Beteiligung am Domainnamen-Hijack vom vergangenen Wochenende zugegeben hat](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=An%20Australian%20domain%20registrar%20has%20admitted%20to%20its%20part), wobei der Fehler auf einen Verifizierungsschritt in seinem Transferprozess zurückgeführt wurde, der nicht durchgeführt worden war. Das Unternehmen versprach, dass die Lücke, die diesen Fehler ermöglichte, geschlossen wurde.

Doch die wichtigere Konsequenz war struktureller Natur. Panix wurde zum Paradebeispiel in der anschließenden, breiteren Aufarbeitung der Transfersicherheit. Das Security and Stability Advisory Committee (SSAC) der ICANN veröffentlichte 2005 einen Bericht, [*Domain Name Hijacking: Incidents, Threats, Risks, and Remedial Actions*](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf), der genau diese Art von Fehlern untersuchte – Registrare, die Transfers akzeptierten, ohne zu bestätigen, dass der Anfragende tatsächlich der Registrant war. Die dauerhaften Korrekturen, die das System härter machten, lassen sich direkt auf Wochenenden wie dieses zurückführen:

- **Standardmäßige Registrar-Locks.** Eine Domain mit dem Status `clientTransferProhibited` weigert sich schlichtweg, übertragen zu werden, bis die Sperre vom rechtmäßigen Inhaber entfernt wird. Was einst ein obskures Opt-in-Verfahren war, wurde bei vielen Registraren zum Standardzustand – eine Bremse, die sich auch durch die automatische Genehmigungsregel nicht aushebeln ließ.
- **Auth-Codes (EPP-Transfer-Codes).** Moderne gTLD-Transfers erfordern einen geheimen Autorisierungscode, den der *abgebende* Registrar nur an den verifizierten Registranten herausgibt. So kann ein empfangender Registrar eine Domain nicht mehr allein durch Formulare abziehen.
- **Eine dokumentierte [ICANN-Transferrichtlinie (Transfer Policy)](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)** mit strengeren Bestätigungspflichten und einem Notfall-Kontaktkanal, um genau diese Art von betrügerischen Transfers schnell rückgängig zu machen.

Der Panix-Hijack hat diese Mechanismen nicht selbst erfunden, aber es war der Fall, auf den jeder verwies, wenn argumentiert wurde, warum sie notwendig seien.

## Was uns das über Transfer-Locks und Verifizierung lehrt

Lässt man die genauen Daten und Registrarnamen beiseite, hinterlässt der Fall Panix einige beständige Lektionen.

1. **Standardmäßiges Zulassen (Default-Allow) ist eine Sicherheitsentscheidung – und meistens die falsche.** Die gefährlichste Designentscheidung im Jahr 2005 war der Grundsatz *Schweigen bedeutet Zustimmung*. Ein Transfer, der abgeschlossen wird, wenn der Inhaber nichts tut, geht davon aus, dass der Inhaber alles stets im Blick hat und immer erreichbar ist. An einem Feiertagswochenende trifft beides nicht zu.
2. **Die Identität muss von der Partei verifiziert werden, die den Vermögenswert abgibt, nicht nur von der Partei, die ihn erhält.** Der empfangende Registrar wollte das Geschäft machen und hatte jeden Anreiz, ja zu sagen. Echte Sicherheit entstand erst, als der *abgebende* Registrar einen Auth-Code an einen verifizierten Inhaber herausgeben musste – womit die Verifizierung dorthin verlagert wurde, wo der Vermögenswert tatsächlich liegt.
3. **Schalten Sie die Sperre ein.** `clientTransferProhibited` ist der günstigste und effektivste Schutz, den ein Domain-Inhaber gegen genau diesen Angriff hat, und er kostet nichts. Eine gesperrte Domain kann nicht stillschweigend übertragen werden, egal wie überzeugend das Formular auch sein mag. Sperren Sie Ihre wichtigen Namen und lassen Sie sie gesperrt.
4. **Ihre Domain ist Ihr Single Point of Failure (SPOF).** Die Server von Panix wurden nie kompromittiert, und doch war das Unternehmen praktisch offline. Wenn ein einziger Eintrag in einer Registry Ihre gesamte Web- und E-Mail-Präsenz umleiten kann, verdient dieser Eintrag mehr Schutz als Ihre Server.
5. **Achten Sie auf Benachrichtigungen.** Das fünftägige Widerrufsfenster schützt nur einen Inhaber, der die Transferbenachrichtigung auch tatsächlich erhält – und liest. Veraltete Registranten-E-Mails, ein nicht überwachter Admin-Kontakt oder ein langes Feiertagswochenende verwandeln ein Sicherheitsventil in ein geräuschloses Scheitern.

## Die Namefi-Perspektive

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-panix-com-domain-hijack-03-namefi-angle.jpg)

Der Panix-Hijack ist im Kern ein *Autoritäts*-Problem. Die Frage "Wer darf diese Domain umziehen?" wurde nicht durch einen starken, verifizierbaren Eigentumsnachweis beantwortet, sondern durch eine Kette von Resellern und einen Timer für die Standardgenehmigung. Eine gestohlene Kreditkarte und fünf Tage Schweigen reichten aus, um das System davon zu überzeugen, dass ein Fremder auf einer anderen Hemisphäre für einen ISP in New York sprach.

[Namefi](https://namefi.io) geht von der gegenteiligen Prämisse aus: dass die Kontrolle über eine Domain nachweisbar sein sollte, nicht nur angenommen. Indem das Domain-Eigentum als tokenisierter On-Chain-Vermögenswert abgebildet wird, der mit dem DNS kompatibel bleibt, wird die Frage "Wer hält diesen Namen?" kryptografisch verifizierbar und überprüfbar – ein Datensatz, der nicht einfach stillschweigend von einem Registrar überschrieben werden kann, der schlechte Dokumente akzeptiert. Transfers finden dann statt, wenn der Schlüssel des Inhabers sie autorisiert, und nicht, wenn eine unbeaufsichtigte Fünf-Tage-Frist abläuft. Die Standardeinstellung ist *Ablehnen (Deny)*, und die Zustimmung muss aktiv nachgewiesen werden, anstatt ihr lediglich nicht zu widersprechen.

Nichts davon existierte 1989, als Panix gegründet wurde – oder auch 2005, als der Hijack passierte. Aber es deutet auf die Lektion hin, die dieses Wochenende der gesamten Branche gelehrt hat: Eine Domain ist zu wichtig, um durch Schweigen regiert zu werden. Eigentum sollte etwas sein, das man bei Bedarf nachweisen kann – und etwas, das einem ein Fremder nicht einfach wegnehmen kann, nur weil man über ein langes Wochenende nicht in den Posteingang geschaut hat.

## Quellen und weiterführende Literatur

- The Register — [Panix erholt sich vom Domain-Hijack](https://www.theregister.com/2005/01/17/panix_domain_hijack/)
- The Register — [Panix.com-Hijack: Australische Firma übernimmt die Schuld](https://www.theregister.com/2005/01/19/panix_hijack_more/)
- Davis Wright Tremaine — [Schutz vor Domainnamen-Hijacking](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking)
- InfoWorld — [Australisches Unternehmen übernimmt Verantwortung für Panix-Domain-Hijack](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)
- Slashdot — [Dem ältesten ISP New Yorks wird die Domain gestohlen](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked)
- Wikipedia — [Panix (ISP)](https://en.wikipedia.org/wiki/Panix_(ISP))
- Wikipedia — [Domain-Hijacking](https://en.wikipedia.org/wiki/Domain_hijacking)
- ICANN SSAC — [Domain Name Hijacking: Vorfälle, Bedrohungen, Risiken und Abhilfemaßnahmen (2005)](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)
- ICANN — [Transferrichtlinie (Transfer Policy)](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)
- NANOG Mailinglisten-Archiv — [Diskussion über den panix.com-Transfer und ICANN-Abhilfemaßnahmen](https://diswww.mit.edu/charon/nanog/77162)