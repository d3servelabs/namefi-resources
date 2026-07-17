---
title: 'Der mehrjährige GoDaddy-Einbruch: Wie Eindringlinge drei Jahre lang im weltgrößten Registrar hausten'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
description: 'Zwischen 2020 und 2022 lebte eine einzelne Bedrohungsakteurgruppe in GoDaddys Infrastruktur – sie stahl Quellcode, legte die Daten von 1,2 Millionen Managed-WordPress-Kunden offen und leitete Kundenwebseiten zeitweise auf bösartige Seiten um. Eine eingehende Analyse des Konzentrationsrisikos bei Registraren und was sie über einzelne Fehlerquellen lehrt.'
keywords: ['godaddy einbruch', 'godaddy datenpanne', 'managed wordpress breach', 'registrar sicherheit', 'domain sicherheit', 'mehrjähriger einbruch', 'cpanel malware', 'website redirect angriff', 'ssl private key offenlegung', 'sftp passwort breach', 'sec 10-k cybersicherheit', 'registrar konzentrationsrisiko', 'single point of failure']
relatedArticles:
  - /de/blog/the-fox-it-dns-hijack/
  - /de/blog/the-dnspionage-campaign/
  - /de/blog/the-lenovo-com-dns-hijack/
  - /de/blog/the-badgerdao-frontend-attack/
  - /de/blog/the-icann-spear-phishing-breach/
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
  - /de/glossary/web3/
  - /de/glossary/tld/
---

Ein Domain-[Registrar](/de/glossary/registrar/) ist das langweiligste Unternehmen, von dem man jemals vollständig abhängig sein wird.

Man bezahlt es einmal im Jahr. Man meldet sich vielleicht zweimal an. Und im Gegenzug hält es das eine, was das eigene Unternehmen erreichbar macht: das Recht zu sagen „dieser Name zeigt hierhin." E-Mail, Website, Login, Zahlungen — jeder digitale Faden, den man besitzt, läuft durch denjenigen, der die DNS der eigenen Domain kontrolliert. Die meisten Menschen denken nach dem Checkout nie wieder an dieses Unternehmen.

Über zwei Jahre lang dachte eine ausgeklügelte Bedrohungsakteurgruppe ständig an GoDaddy. Sie lebten darin.

GoDaddy ist der größte Domain-Registrar der Erde, mit Dutzenden Millionen Kunden und weit über 80 Millionen verwalteten Domains. Und zwischen mindestens Ende 2019 und Ende 2022 glaubt GoDaddy nun, bewegte sich derselbe hartnäckige Eindringling wiederholt durch seine Systeme — er stahl Quellcode, legte die Daten von 1,2 Millionen Managed-WordPress-Kunden offen und verdrahtete an einem Punkt still und heimlich zufällige Kundenwebseiten um, sodass Besucher auf bösartige Ziele weitergeleitet wurden. Das Unternehmen beschrieb es nicht als einzelnen Einbruch. Es beschrieb in einer Einreichung bei der U.S. Securities and Exchange Commission [eine mehrjährige Kampagne einer ausgeklügelten Bedrohungsakteurgruppe](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=Based%20on%20our%20investigation%2C%20we%20believe%20these%20incidents%20are%20part%20of%20a%20multi%2Dyear%20campaign%20by%20a%20sophisticated%20threat%20actor%20group).

So sieht es aus, wenn das langweilige Unternehmen am Grund des eigenen Stacks sich als einzelner Fehlerknoten für Millionen anderer Menschen herausstellt.

## Warum ein Registrar ein Single Point of Failure für Millionen ist

Konzentration ist das gesamte Geschäftsmodell eines Massenmarkt-Registrars. Die Wirtschaftlichkeit funktioniert nur in enormem Maßstab: ein Bereitstellungssystem, ein Kontrollzentrum, ein Credential-Speicher, ein Satz von Hosting-Servern für alle. Diese Effizienz macht GoDaddy genau so praktisch — und genau so gefährlich, wenn ein Angreifer eindringt.

Wenn ein einzelnes kleines Unternehmen gehackt wird, hat ein Unternehmen eine schlechte Woche. Wenn die Plattform, die die Domains, Websites und Zertifikate von Millionen von Unternehmen hält, gehackt wird, ist der Explosionsradius nicht mehr ein Unternehmen. Es ist jeder, der diesem Unternehmen seinen Namen anvertraut hat.

Das ist die Asymmetrie im Herzen des Registrar-Risikos. Der Kunde erlebt GoDaddy als sein eigenes privates Dashboard. Der Angreifer erlebt es als Tresor, der gleichzeitig Millionen von Schlüsseln enthält — und man muss das Schloss nur einmal knacken.

Es lohnt sich, präzise darüber zu sein, was „Single Point of Failure" hier bedeutet, denn es wirkt gleichzeitig auf zwei Ebenen. Die erste ist die Registrar-Ebene: die Behörde, die entscheidet, wohin die DNS einer Domain zeigt. Wenn diese kompromittiert ist, kann ein Angreifer die gesamte Domain — einschließlich E-Mail — woanders hinleiten. Die zweite ist die Hosting- und Zertifikatsebene: die Server, Anmeldedaten und SSL-Schlüssel, die die eigentliche Website bereitstellen und authentifizieren. GoDaddy ist eines der seltenen Unternehmen, das für denselben Kunden gleichzeitig auf beiden Ebenen sitzt. Als derselbe Eindringling also im Verlauf der Kampagne die Bereitstellungssysteme, Hosting-Server und Zertifikatsmaterial berührte, drehte er sich nicht zwischen unzusammenhängenden Opfern. Er bewegte sich innerhalb eines Unternehmens, das zufällig verschiedene Arten von Schlüsseln zu denselben Millionen von Türen hielt.

![Lebendige, farbenfrohe Konzeptkunst eines einzigen riesigen zentralen Tresors, vollgestapelt vom Boden bis zur Decke mit Millionen leuchtender Domain-Schlüssel, eine schemenhafte Eindringlingsgestalt sitzt bequem auf einem Klappstuhl darin, als würde sie seit Jahren dort wohnen, dramatische Beleuchtung](../../assets/the-godaddy-multi-year-breach-01-breach.jpg)

## Die Zeitleiste: 2019 → 2022

Das Beunruhigende an der GoDaddy-Geschichte ist nicht ein einzelner Vorfall. Es ist, dass die Vorfälle, zusammen betrachtet, eine jahrelange Besatzung ergeben. GoDaddy selbst hat die Punkte nur im Nachhinein verbunden.

**Ende 2019 / März 2020 — der erste Brückenkopf.** Nach einem im Jahr 2020 offengelegten Einbruch [informierte GoDaddy 28.000 Kunden, dass ein Angreifer ihre Webhosting-Kontozugangsdaten im Oktober 2019 verwendet hatte](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=GoDaddy%20alerted%2028%2C000%20customers%20that%20an%20attacker%20used%20their%20web%20hosting%20account%20credentials%20in%20October%202019), um über SSH eine Verbindung zu ihren Hosting-Konten herzustellen. Der Angreifer benötigte keinen Zero-Day; er brauchte Anmeldedaten, und er erhielt sie. Sicherheitsberichte schrieben diese Welle später Social Engineering zu — Angreifer, die sich [telefonisch ausgaben](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/), um Mitarbeiter und Kunden dazu zu bringen, Zugänge herauszugeben. Wie GoDaddy für InformationWeek zusammenfasste: [Im März 2020 kompromittierte ein Bedrohungsakteur die Anmeldedaten von 28.000 Kunden](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=In%20March%202020%2C%20a%20threat%20actor%20compromised%20the%20login%20credentials%20of%2028%2C000%20customers).

**September–November 2021 — der große Einbruch.** Am 22. November 2021 legte GoDaddy einen Einbruch in seine Managed-WordPress-Hosting-Umgebung offen. Die Zahlen waren brutal: [Der Vorfall wurde von GoDaddy](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20incident%20was%20discovered%20by%20GoDaddy%20last%20Wednesday%2C%20on%20November%2017%2C%20but%20the%20attackers%20had%20access%20to%20its%20network%20and%20the%20data%20contained%20on%20the%20breached%20systems%20since%20at%20least%20September%206%2C%202021) am 17. November 2021 entdeckt — aber die Angreifer hatten seit mindestens dem 6. September 2021 Zugang gehabt. Das sind etwa zweieinhalb Monate unentdeckter Anwesenheit. Wie TechCrunch berichtete, [verwendete die unbefugte Person ein kompromittiertes Passwort, um sich etwa am 6. September Zugang zu GoDaddys Systemen zu verschaffen](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/#:~:text=the%20unauthorized%20person%20used%20a%20compromised%20password%20to%20get%20access%20to%20GoDaddy%27s%20systems%20around%20September%206).

**Dezember 2022 — die Malware und die Weiterleitungen.** Ein Jahr später tauchte das Muster wieder auf. GoDaddy [erhielt Anfang Dezember 2022 Kundenberichte, dass ihre Seiten dazu verwendet wurden, auf zufällige Domains weiterzuleiten](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=customer%20reports%20in%20early%20December%202022%20that%20their%20sites%20were%20being%20used%20to%20redirect%20to%20random%20domains). Die darauf folgende Untersuchung führte zur Offenlegung im Februar 2023 — und zur Erkenntnis, dass es sich nicht um einen neuen Angreifer handelte, sondern um dieselbe Kampagne, die seit 2020 immer wieder auftauchte.

In der Reihenfolge betrachtet, sind das nicht drei Einbrüche. Es sind drei Sichtungen eines langfristigen Bewohners.

Was die Zeitleiste so auffällig macht, sind die Lücken zwischen den Sichtungen. Monate, dann ein Jahr. Jeder einzelne Vorfall, zum Zeitpunkt seiner Offenlegung, sah wie ein abgegrenztes Ereignis mit Anfang und Ende aus — hier ein Passwort-Reset, dort eine Zertifikatsneuausstellung. Erst als GoDaddys Ermittler die Malware vom Dezember 2022 durch ihre Werkzeuge und Methoden zurückverfolgten, hörten die Ereignisse auf, wie Zufälle auszusehen, und begannen wie ein Muster auszusehen. Der erschreckendste Satz in der gesamten Offenlegung ist das stille Eingeständnis, dass dies seit Jahren vor sich ging, bevor jemand die Verbindung herstellte.

## Was offengelegt wurde — und die Websites, die ihre Eigentümer verrieten

Der Managed-WordPress-Einbruch von 2021 ist der Vorfall mit dem klarsten und quantifiziertesten Schaden. GoDaddys eigene Mitteilung, eingereicht bei der SEC, legte ihn klar dar.

Bis zu 1,2 Millionen aktive und inaktive Managed-WordPress-Kunden hatten ihre E-Mail-Adresse und Kundennummer offengelegt. Schlimmer noch, [das ursprüngliche WordPress-Admin-Passwort, das zum Zeitpunkt der Bereitstellung festgelegt worden war, wurde offengelegt](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20original%20WordPress%20Admin%20password%20that%20was%20set%20at%20the%20time%20of%20provisioning%20was%20exposed) — der Hauptschlüssel zu diesen WordPress-Installationen. Für aktive Kunden wurden sFTP- und Datenbank-Benutzernamen und -Passwörter offengelegt, also die Zugangsdaten, mit denen man Dateien hochladen und die Datenbank direkt lesen kann. Und für die sensibelste Teilmenge wurde [der private SSL-Schlüssel offengelegt](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=For%20a%20subset%20of%20active%20customers%2C%20the%20SSL%20private%20key%20was%20exposed) — das kryptografische Geheimnis, das beweist, dass eine Site wirklich sie selbst ist.

Zusammengenommen ergibt das ein Worst-Case-Set. Das Admin-Passwort verschafft Zugang zur Site. sFTP- und Datenbankzugang ermöglichen es, sie auf Datei- und Datenbankebene zu verändern. Und der private SSL-Schlüssel — wie Wordfence in seiner [Analyse des Einbruchs](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/) feststellte — könnte einem Angreifer ermöglichen, eine Site zu imitieren oder ihren Datenverkehr zu entschlüsseln. Ein Registrar, der Vertrauen verankern soll, hatte stattdessen einem Eindringling die Mittel übergeben, um es zu fälschen.

| Was durchgesickert ist | Wer betroffen war | Was es freischaltet |
| --- | --- | --- |
| E-Mail + Kundennummer | Bis zu 1,2 Mio. aktive und inaktive Kunden | Gezieltes Phishing, Konto-Mapping |
| Ursprüngliches WordPress-Admin-Passwort | Betroffene Kunden (falls noch in Verwendung) | Vollständige Kontrolle über die WordPress-Installation |
| sFTP + Datenbank-Zugangsdaten | Aktive Kunden | Datei- und datenbankebene Website-Manipulation |
| Privater SSL-Schlüssel | Eine Teilmenge aktiver Kunden | Site-Imitation, Verkehrs-Entschlüsselung |

Die Reichweite der Offenlegung zeigt, warum sich dies qualitativ von einem normalen Site-Hack unterschied. Ein normaler Hack kompromittiert eine Site. Hier legte ein einziger Einbruch in einem gemeinsamen Bereitstellungssystem in einem einzigen Schritt die Schlüssel zu über einer Million davon frei.

Dann gibt es den Teil, der eine Datenpanne zu etwas Eindringlichem macht: Kundenwebsites, die begannen, Besucher auf bösartige Seiten weiterzuleiten. Im Dezember 2022 [verschaffte sich eine unbefugte dritte Partei Zugang zu unseren cPanel-Hosting-Servern und installierte dort Malware](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=an%20unauthorized%20third%20party%20gained%20access%20to%20and%20installed%20malware%20on%20our%20cPanel%20hosting%20servers), erklärte GoDaddy, und [die Malware leitete zeitweise zufällige Kundenwebsites auf bösartige Seiten um](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=The%20malware%20intermittently%20redirected%20random%20customer%20websites%20to%20malicious%20sites). „Zeitweise" und „zufällig" sind die grausamen Wörter hier. Eine Weiterleitung, die jedes Mal ausgelöst wird, ist leicht zu erkennen. Eine Weiterleitung, die manchmal ausgelöst wird, für einige Besucher, auf einigen Seiten, ist genau die Art von Sache, die ein Kleinunternehmer meldet und dann nicht reproduzieren kann — und die sein Hoster als Zufall abtun kann. Es ist eine in den Angriff eingebaute Tarnung.

## Wie es geschah: geliehene Schlüssel, keine aufgebrochenen Schlösser

Die unbequemste Lektion der GoDaddy-Geschichte ist, wie unspektakulär der Einstieg war.

Es gibt keinen exotischen Zero-Day im Zentrum davon. Die erste Welle lief auf gestohlenen Zugangsdaten. Der Einbruch von 2021 lief auf [einem kompromittierten Passwort](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=1.2%20million%20Managed%20WordPress%20customers%20after%20attackers%20breached%20GoDaddy%27s%20WordPress%20hosting%20environment%20using%20a%20compromised%20password). Krebs on Security titelte seine Analyse der Kampagne als [„When Low-Tech Hacks Cause High-Impact Breaches"](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/) — genau weil die Auswirkungen so unverhältnismäßig zur Raffinesse des Einstiegs waren. Man muss keinen Tresor überwinden, wenn einem jemand den Schlüssel überreicht.

Einmal drin, tat der Angreifer das Geduldige, Professionelle: er blieb. Im Verlauf der Kampagne gab GoDaddy an, dass die Akteure [auf unseren Systemen Malware installierten und Teile von Code im Zusammenhang mit einigen Diensten bei GoDaddy erlangten](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=installed%20malware%20on%20our%20systems%20and%20obtained%20pieces%20of%20code%20related%20to%20some%20services%20within%20GoDaddy). Gestohlener Quellcode ist kein einmaliger Verlust; er ist eine Karte. Er zeigt einem Angreifer, wie die Systeme, in denen er bereits sitzt, tatsächlich funktionieren — wo die Schwachstellen sind, wie die Authentifizierung abläuft, was als nächstes anzugreifen ist. Kombiniert mit persistenter Malware ist es der Unterschied zwischen einem Einbruch-und-Raub und einer langfristigen Besatzung. Wie BleepingComputer GoDaddys eigenes Fazit zusammenfasste, [konnten die Bedrohungsakteure auf den Systemen des Unternehmens Malware installieren und Code stehlen](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=Threat%20actors%20were%20able%20to%20install%20malware%20on%20the%20company%27s%20systems%20and%20steal%20code) — und das über Jahre hinweg, immer wieder.

Die Erkennungslücke ist die andere Hälfte der Geschichte. Zweieinhalb Monate beim Vorfall von 2021. Jahre insgesamt über die gesamte Kampagne. Der Angreifer war nicht schneller als GoDaddys Verteidigung, sondern ruhiger als seine Überwachung.

![Lebendige, farbenfrohe Konzeptkunst eines einzigen leuchtenden Skelettschlüssels, der gedreht wird, um eine ganze hohe Wand aus Hunderten von Briefkastentüren auf einmal zu öffnen, schwache Malware-Ranken kriechen wie Weinreben an der Wand entlang, dramatische Neonbeleuchtung, keine Logos](../../assets/the-godaddy-multi-year-breach-02-persistent-access.jpg)

## Reaktion und Nachwirkungen

GoDaddys unmittelbare technische Reaktion auf den Einbruch von 2021 folgte dem Standardvorgehen: Zurücksetzen der offengelegten sFTP- und Datenbankpasswörter und Beginn der Neuausstellung und Installation neuer SSL-Zertifikate für die Kunden, deren private Schlüssel durchgesickert waren. Zur Offenlegung im Februar 2023 erklärte das Unternehmen, es habe externe Forensik-Experten und Strafverfolgungsbehörden eingeschaltet und den Akteur als ausgeklügelte, organisierte Gruppe charakterisiert, die auf Hosting-Anbieter abzielt — kein einsamer Opportunist.

Aber die Reputations- und Regulierungsnachwirkungen überdauerten die Reaktion auf den Vorfall. Die Serie von Einbrüchen zog die Aufmerksamkeit der U.S. Federal Trade Commission auf sich, die 2025 [eine Anordnung mit GoDaddy wegen Datensicherheitsmängeln abschloss](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures). Darin wurde behauptet, das Unternehmen habe trotz der Vermarktung seiner Dienste mit Sicherheitszusagen keine angemessene Sicherheit implementiert, und es wurde verpflichtet, ein umfassendes Informationssicherheitsprogramm aufzubauen. Ein Einbruch, der mit einem geliehenen Passwort begann, endete Jahre später als bundesbehördliche Einwilligungsanordnung.

Die Offenlegungszeitleiste selbst zog Kritik auf sich: Die mehrjährige Rahmung wurde erst durch eine SEC-10-K-Einreichung im Februar 2023 öffentlich, was bedeutete, dass Kunden lange nach der individuellen Meldung jedes Vorfalls erfuhren, dass die Vorfälle von 2020, 2021 und 2022 miteinander zusammenhingen.

Es gibt ein tieferes Rechenschaftsproblem, das in dieser Reihenfolge verborgen liegt. Jede Offenlegung für sich genommen lud zu einer kleinen Reaktion ein — ein Passwort ändern, ein neues Zertifikat akzeptieren, weitermachen. Aber ein Kunde, dem drei separate Geschichten von „isolierten Vorfällen" erzählt worden waren, hatte keine Möglichkeit zu verstehen, dass er es möglicherweise mit einem anhaltenden Gegner zu tun hatte, der jahrelang in der Nähe seiner Daten gewesen war. Die Rahmung eines Einbruchs beeinflusst, wie ernst die Menschen flussabwärts ihn nehmen. Drei kleine Brände lesen sich sehr anders als ein lang brennender.

## Was dies über das Konzentrationsrisiko bei Registraren lehrt

Zieht man die Einzelheiten ab, ist die GoDaddy-Kampagne eine Lehrstunde darin, warum Registrar-Konzentration eine eigene Risikokategorie darstellt.

1. **Die Plattform ist das Ziel.** Angreifer müssen nicht auf Sie abzielen. Sie zielen auf das Unternehmen ab, das Sie und eine Million andere hält. Ihre eigene Sicherheitslage spielt kaum eine Rolle, wenn das Bereitstellungssystem Ihres Registrars das weiche Ziel ist — Sie erben seinen Explosionsradius, ob Sie wollen oder nicht.

2. **Zugangsdaten sind die Eingangstür, keine Exploits.** Ein kompromittiertes Passwort hat hier den meisten Schaden angerichtet. Multi-Faktor-Authentifizierung, Credential-Hygiene und aggressives Anomalie-Erkennen sind wichtiger als jede einzelne ausgeklügelte Verteidigung — denn der Einstiegspunkt ist fast immer geliehener Zugang, kein aufgebrochenes Schloss.

3. **Verweildauer ist die eigentliche Kennzahl.** Die Offenlegung von Daten ist schlimm. Ein Angreifer, der unbemerkt monatelang oder jahrelang in einem Bereitstellungssystem lebt, ist katastrophal schlimmer, weil Persistenz sich potenziert. Der Schaden ist eine Funktion davon, wie lange er bleibt, nicht nur dass er hereingekommen ist.

4. **Zentralisierte Geheimnisse sind zentralisiertes Versagen.** Admin-Passwörter, sFTP-Zugangsdaten und private SSL-Schlüssel an einem Ort zu speichern, abrufbar, ist bequem — bis es der schlimmste Einzelverlust ist. Wenn derselbe Speicher die Schlüssel für 1,2 Millionen Kunden hält, ist ein Einbruch 1,2 Millionen Einbrüche.

5. **Die Website-Weiterleitung ist der Albtraum des Kunden, nicht des Registrars.** Als GoDaddys Server Kundenwebsites auf bösartige Ziele umleiteten, bezahlten die Marken, Kunden und das SEO der Kunden den Preis — obwohl sie nichts falsch gemacht hatten. Konzentrationsrisiko ist im Wesentlichen das Risiko, durch den Fehler eines anderen geschädigt zu werden.

Das bedeutet nicht „benutze niemals einen großen Registrar." Skalierung bringt echte Sicherheitsinvestitionen mit sich, und kleine Anbieter scheitern auch. Es bedeutet zu verstehen, dass Sie, wenn Sie Ihre Domain einer Plattform übergeben, den schlimmsten Tag dieser Plattform als mögliche Version Ihres eigenen akzeptieren.

## Der Namefi-Blickwinkel

![Farbenfrohe Illustration von verifizierbarem, manipulationssicherem Domain-Eigentum — eine Domain-Karte, gesichert durch ein grünes Schild, einen grünen Namefi-Token und DNS-Kontinuität](../../assets/the-godaddy-multi-year-breach-03-namefi-angle.jpg)

Das tiefste Problem, das die GoDaddy-Kampagne aufdeckt, ist nicht Malware. Es ist, dass Eigentum und Kontrolle einer Domain vollständig innerhalb der privaten Datenbank eines einzigen Anbieters lebten — einer Datenbank, die ein Eindringling über Jahre hinweg von innen lesen, verändern und imitieren konnte, während die rechtmäßigen Eigentümer keine unabhängige Möglichkeit hatten, es zu wissen.

[Namefi](https://namefi.io) basiert auf einem anderen Standard: Domains sollten sich wie internet-native Vermögenswerte verhalten, deren Eigentum überprüfbar und manipulationssicher ist — nicht wie eine Zeile im Kontosystem eines einzelnen Unternehmens, die man nur durch Einloggen und Hoffen bestätigen kann. Tokenisiertes Eigentum macht die Frage „wer kontrolliert diese Domain tatsächlich?" von außerhalb eines einzelnen Anbieters beantwortbar — prüfbar, übertragbar und schwerer stillschweigend umzuschreiben — und dabei mit DNS kompatibel, sodass der Name weiterhin aufgelöst wird.

Das macht einen Registrar nicht unhackbar. Nichts tut das. Aber es verändert, was ein Einbruch still tun kann. Wenn der Eigentumsnachweis in einer überprüfbaren, unabhängigen Schicht lebt statt ausschließlich innerhalb der kompromittierten Plattform, bedeutet „der Eindringling lebte zwei Jahre in der Datenbank" nicht mehr dasselbe wie „der Eindringling kontrollierte, wem was gehört." Die GoDaddy-Geschichte zeigt, was passiert, wenn Kontrolle und Nachweis dasselbe zerbrechliche Ding sind, an einem Ort gehalten. Die Lektion ist, aufzuhören, sie dort aufzubewahren.

## Quellen und weiterführende Lektüre

- BleepingComputer — [GoDaddy: Hackers stole source code, installed malware in multi-year breach](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/)
- BleepingComputer — [GoDaddy data breach hits 1.2 million Managed WordPress customers](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/)
- Krebs on Security — [When Low-Tech Hacks Cause High-Impact Breaches](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)
- Sophos — [GoDaddy admits: Crooks hit us with malware, poisoned customer websites](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites)
- The Hacker News — [GoDaddy Discloses Multi-Year Security Breach Causing Malware Installations and Source Code Theft](https://thehackernews.com/2023/02/godaddy-discloses-multi-year-security.html)
- TechCrunch — [GoDaddy says data breach exposed over a million user accounts](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/)
- SecurityWeek — [GoDaddy Breach Exposes 1.2 Million Managed WordPress Customer Accounts](https://www.securityweek.com/godaddy-breach-exposes-12-million-managed-wordpress-customer-accounts/)
- InformationWeek — [GoDaddy Hit with Multiyear Breach](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-)
- BankInfoSecurity — [GoDaddy Confirms Breach Affects 1.2 Million Customers](https://www.bankinfosecurity.com/godaddy-confirms-breach-affects-12-million-customers-a-17974)
- Wordfence — [GoDaddy Breach — Plaintext Passwords — 1.2M Affected](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)
- U.S. Federal Trade Commission — [FTC Finalizes Order with GoDaddy over Data Security Failures](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures)
- GoDaddy (via SEC) — [Notice of Security Incident, November 22, 2021](https://www.sec.gov/Archives/edgar/data/1609711/000160971121000122/gddyblogpostnov222021.htm)
