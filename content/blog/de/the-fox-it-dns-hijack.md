---
title: 'Domain Mayday EP14: Als eine Sicherheitsfirma DNS-gekapert wurde — Der Fox-IT-Vorfall'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Im September 2017 loggten sich Angreifer in den Drittanbieter-Registrar des niederländischen Sicherheitsunternehmens Fox-IT ein, änderten die DNS-Einträge, erlangten auf betrügerische Weise ein TLS-Zertifikat und führten 10 Stunden lang einen Man-in-the-Middle-Angriff auf den Client-Datenverkehr durch — bis Fox-IT ihn entdeckte und eine der transparentesten Post-Mortem-Analysen der Branche veröffentlichte.'
keywords: ['fox-it dns hijack', 'fox-it man in the middle', 'fox-it vorfall 2017', 'dns hijacking', 'registrar-account-kompromittierung', 'betrügerisches ssl-zertifikat', 'man-in-the-middle-angriff', 'domain-registrar sicherheit', 'zwei-faktor-authentifizierung dns', 'dnssec', 'registry lock', 'domain-sicherheit', 'ncc group fox-it']
---

Das Tückische an einem Man-in-the-Middle-Angriff ist: Während er stattfindet, sieht alles normal aus.

Die Seite lädt. Die Adressleiste zeigt die richtige Domain. Das Schlosssymbol ist geschlossen. Das Zertifikat ist gültig. Dateien werden hochgeladen, Logins funktionieren, E-Mails kommen an. Kein Fehler, keine Warnung, kein defektes Bild — nur ein stiller Dritter, der mitten in der Kommunikation sitzt, alles liest, was durchfließt, und es dann so weiterleitet, dass keine Seite die Verzögerung bemerkt.

Stellen Sie sich nun vor, das passiert genau den Menschen, deren Aufgabe es ist, genau das zu bemerken.

Im September 2017 stellte das niederländische Cybersicherheitsunternehmen Fox-IT — ein Unternehmen, das Sicherheitsvorfälle untersucht, Abhörerkennungssensoren entwickelt und Regierungen berät, wie Angreifer vorgehen — fest, dass ein Angreifer die DNS-Einträge seiner eigenen Domain gekapert, ein TLS-Zertifikat in seinem Namen erlangt und fast einen ganzen Tag lang den Datenverkehr zu und von seinem Client-Portal mitgelesen hatte. Der Schlüsseldienst hatte sein eigenes Schloss geknackt. Und dann tat Fox-IT das, was kaum ein angegriffenes Unternehmen tut: es [veröffentlichte einen detaillierten Bericht darüber, wie das genau geschah](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes).

## Auch eine Sicherheitsfirma hängt von ihrem Registrar ab

Hier ist die unbequeme Wahrheit, die dieser Fall greifbar macht: Egal wie gut die interne Sicherheit ist, ein großer Teil der Angriffsfläche liegt bei einem Unternehmen, das man selbst nicht betreibt.

Ihre Domain — der Name, den Ihre Kunden eingeben, die Adresse, für die Ihre Zertifikate ausgestellt werden, das Ziel, auf das Ihre E-Mail verweist — wird bei einem Domain-Registrar konfiguriert. Wer das Registrar-Konto kontrolliert, bestimmt, wohin der Name aufgelöst wird. Derjenige kann Ihre Website umleiten, Ihre E-Mail umrouten und gegenüber einer Zertifizierungsstelle den „Nachweis der Inhaberschaft" über Ihre Domain erbringen. Dazu ist es nicht nötig, Ihre Server, Ihre Firewalls oder Ihren Code anzufassen. Es reicht, sich in ein Web-Panel einzuloggen.

Fox-IT war nach jeglichem Maßstab eine ernstzunehmende Sicherheitsorganisation. Das Unternehmen betrieb vollständige Paketaufzeichnung und eigene Netzwerksensoren. Es nutzte Zwei-Faktor-Authentifizierung für sein kundenseitiges Portal. Es wurde später von der NCC Group übernommen. Und dennoch war es über genau das Konto angreifbar, in das es sich so gut wie nie einloggte — denn, wie das Unternehmen selbst formulierte, [ändern sich DNS-Einstellungen im Allgemeinen sehr selten](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=DNS%20settings%20in%20general%20change%20very%20rarely), sodass die Zugangsdaten, die sie schützten, still veralteten.

Wie Fox-IT es in der Einleitung seines eigenen Berichts formulierte: [Wenn ein solcher Angriff eine Sicherheitsfirma treffen kann, kann er höchstwahrscheinlich auch viele andere Arten von Unternehmen treffen](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=if%20such%20an%20attack%20can%20hit%20a%20security%20firm), die weniger auf Sicherheit ausgerichtet sind.

## 19. September 2017: Die Kaperung und der MITM-Angriff

![Vivid colorful concept art of a quiet eavesdropper figure reading two streams of mail flowing between two distant towers, the streams passing invisibly through their hands while both towers glow as if nothing is wrong](../../assets/the-fox-it-dns-hijack-01-hijack.jpg)

Der Bericht von Fox-IT beginnt mit einem Satz, der seitdem zu einem kleinen Klassiker in der Incident-Response-Literatur geworden ist: [Für Fox-IT wurde aus „ob" ein „wann" am Dienstag, den 19. September 2017](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=became%20%E2%80%98when%E2%80%99%20on%20Tuesday%2C%20September%2019%202017), als das Unternehmen Opfer eines Man-in-the-Middle-Angriffs wurde.

Was geschah, war kein Server-Exploit. In den frühen Morgenstunden des 19. September [griff ein Angreifer auf die DNS-Einträge der Domain Fox-IT.com bei unserem externen Domain-Registrar zu](https://grahamcluley.com/fox-it-dns-hack/#:~:text=an%20attacker%20accessed%20the%20DNS%20records%20for%20the%20Fox%2DIT.com%20domain). Mit der Kontrolle über diese Einträge [änderte der Angreifer einen DNS-Eintrag für einen bestimmten Server, sodass dieser auf einen Server in seinem Besitz verwies, um den Datenverkehr abzufangen und weiterzuleiten](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=modified%20a%20DNS%20record%20for%20one%20particular%20server) zurück zur echten Fox-IT-Infrastruktur.

Dieses letzte Detail — *den Datenverkehr weiterleiten* — ist das, was daraus einen Man-in-the-Middle-Angriff und keinen einfachen Ausfall machte. Besucher erreichten noch immer ein funktionierendes Portal. Sie erreichten es nur zuerst über den Angreifer.

Das Ziel war spezifisch. Der Angriff [zielte speziell auf ClientPortal, die Dokumentenaustausch-Webanwendung von Fox-IT](https://grahamcluley.com/fox-it-dns-hack/#:~:text=specifically%20aimed%20at%20ClientPortal), das System, das Fox-IT für den sicheren Dateiaustausch mit Kunden, Lieferanten und anderen Organisationen nutzte. Mit anderen Worten: Der Angreifer zielte direkt auf den Kanal, durch den sensible Kundendokumente flossen.

Da Fox-IT den Angriff erkannte und eindämmte, [begrenzte das Unternehmen die gesamte effektive MitM-Dauer auf 10 Stunden und 24 Minuten](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes). Unabhängige Berichte bestätigten dieselbe Zahl: [Der Vorfall fand am 19. September statt und dauerte 10 Stunden und 24 Minuten](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=lasted%20for%2010%20hours%20and%2024%20minutes).

## Was tatsächlich abgefangen wurde

Zehn Stunden Man-in-the-Middle auf einem Dokumentenaustauschs-Portal klingt katastrophal. Die tatsächliche Ausbeute war gering — und genau diese Geringfügigkeit ist der eigentliche Kern der Geschichte.

Während des Angriffsfensters [loggten sich neun einzelne Benutzer ein, deren Zugangsdaten abgefangen wurden](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Nine%20individual%20users%20logged%20in). Doch diese Zugangsdaten waren weitgehend nutzlos: Das Portal von Fox-IT verlangte einen zweiten Authentifizierungsfaktor, den der Angreifer, der im Netzwerkpfad saß, nicht wiederverwenden konnte. Help Net Security stellte fest, dass die Anmeldedaten der neun Benutzer zwar erbeutet wurden, aber [ohne den zweiten Authentifizierungsfaktor nutzlos waren](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor).

Was Dateien betrifft, so [wurden zwölf Dateien (davon zehn einzigartige) übertragen und abgefangen](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Twelve%20files%20%28of%20which%20ten%20were%20unique%29%20were%20transferred%20and%20intercepted). Einige enthielten vertrauliche Kundeninformationen. Der Angreifer erbeutete außerdem einen Teil der Namen und E-Mail-Adressen von ClientPortal-Benutzern, einige Kontonamen und eine Mobiltelefonnummer, wie [SecurityWeek zusammenfasste](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=mobile%20phone%20number).

Zwei Tatsachen hielten den Schaden begrenzt. Erstens erklärte Fox-IT ausdrücklich, dass [als Staatsgeheimnis eingestufte Dateien niemals über unser ClientPortal übertragen werden](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Files%20classified%20as%20state%20secret%20are%20never%20transferred) — das sensibelste Material befand sich schlicht nie in dem kompromittierten Kanal. Zweitens milderte der eigene zweite Faktor des Unternehmens den Zugangsdatendiebstahl ab. Die Architektur begrenzte den Schaden, selbst nachdem der Perimeter — DNS — versagt hatte.

## Wie es passierte: ein veraltetes Passwort, kein zweiter Faktor

![Vivid colorful concept art of a single ornate key being lifted from a sleeping keyholder's pocket and used to swing open a giant signpost that reroutes a river of light toward a hidden mirrored booth, where a forged wax seal stamps a glowing certificate](../../assets/the-fox-it-dns-hijack-02-mitm.jpg)

Der Ablauf liest sich wie eine Checkliste dafür, wie eine Domain übernommen wird, ohne auch nur eine einzige Zeile Schadsoftware auf den Servern des Opfers zu installieren.

**Schritt eins — Zugang zum Registrar-Konto erlangen.** Der Angreifer [loggten sich erfolgreich mit gültigen Zugangsdaten in das DNS-Control-Panel unseres externen Domain-Registrar-Anbieters ein](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=logged%20in%20to%20the%20DNS%20control%20panel). Die Untersuchung von Fox-IT kam zu dem Schluss, dass der Angreifer [wahrscheinlich über die Kompromittierung eines Drittanbieters Zugang zu den Zugangsdaten des DNS-Control-Panels seines Domain-Registrars erlangte](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=through%20the%20compromise%20of%20a%20third%20party%20provider). Zwei kumulative Schwachstellen ermöglichten diesen Login: Das [Passwort war seit 2013 nicht geändert worden](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013), und der Registrar bot überhaupt keinen zweiten Faktor an — zum Zeitpunkt des Schreibens unterstützte der [Registrar weiterhin keine 2FA](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA).

**Schritt zwei — DNS ändern und „Inhaberschaft" gegenüber einer CA nachweisen.** Mit geöffnetem Panel leitete der Angreifer DNS um. Doch um einen *glaubwürdigen* Man-in-the-Middle-Angriff auf eine HTTPS-Seite durchzuführen, benötigte er ein gültiges Zertifikat für fox-it.com — und der moderne Weg, eines zu erhalten, besteht darin, nachzuweisen, dass man die Domain kontrolliert. Also tat der Angreifer genau das. In einem kurzen Zeitfenster zwischen etwa 02:05 und 02:15 Uhr [leitete er vorübergehend E-Mails von Fox-IT um und fing sie ab, mit dem ausdrücklichen Ziel zu beweisen, dass er unsere Domain besaß, um auf betrügerische Weise ein SSL-Zertifikat für unser ClientPortal zu registrieren](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=fraudulently%20registering%20an%20SSL%20certificate%20for%20our%20ClientPortal). Dies ist der Teil, bei dem jeder Leser innehalten sollte: **Kontrolle über DNS bedeutet in der Praxis Kontrolle über die Domain-Validierung.** Ein domain-validiertes Zertifikat wird demjenigen ausgestellt, der die Challenge einer CA beantworten kann — und hier ermöglichte die Kontrolle über DNS dem Angreifer, die Validierungs-E-Mail umzuleiten und zu beantworten. DNS bestimmt, wo dieser Nachweis der Inhaberschaft landet.

**Schritt drei — in der Mitte sitzen.** Bewaffnet mit einem legitim ausgestellten (aber betrügerisch erlangten) Zertifikat leitete der Angreifer die Domain auf einen VPS im Ausland und fing den Datenverkehr ab. Wie SecurityWeek beschrieb, wurde das [gefälschte SSL-Zertifikat für einen MitM-Angriff auf ClientPortal verwendet, wobei der Datenverkehr zum Portal über einen Virtual Private Server (VPS)-Anbieter im Ausland geleitet wurde](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=rogue%20SSL%20certificate%20was%20used). Für einen Besucher war alles in Ordnung. Das Schloss war echt. Das Zertifikat war gültig. Der Mann in der Mitte hielt einen Schlüssel, dem der Browser vertraute.

Drei Schichten — DNS, die Zertifizierungsstelle und TLS selbst — funktionierten alle technisch korrekt. Der Angreifer hat keine davon gebrochen. Er überzeugte alle drei davon, dass er Fox-IT sei, und das einzige, was ihm das ermöglichte, war ein veraltetes, single-factor Login bei einem Registrar.

## Fox-ITs Reaktion: Erkennen, Eindämmen, dann alle informieren

Was diesen Vorfall von hundert stilleren unterscheidet, ist die Reaktion — sowohl technisch als auch kommunikativ.

**Die Erkennung kam schnell.** Fox-IT stellte fest, dass seine Nameserver für die Domain fox-it.com umgeleitet worden waren, und entdeckte den Einbruch ungefähr fünf Stunden nach seinem Beginn — [etwa fünf Stunden nach Beginn des Angriffs](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=five%20hours%20after%20the%20attack%20started), laut Help Net Security. Die vollständige Paketaufzeichnung und die Netzwerksensoren, die das Unternehmen für sich selbst betrieb, lieferten die forensischen Aufzeichnungen, um genau zu rekonstruieren, was berührt worden war und was nicht.

**Die Eindämmung war gezielt.** Anstatt das Portal offline zu nehmen und den Angreifer zu warnen, wählte Fox-IT eine stillere Gegenmaßnahme: Es [deaktivierte die Zwei-Faktor-Authentifizierung für unser ClientPortal-Login-Authentifizierungssystem](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=disabled%20the%20second%20factor%20authentication) — ein kontraintuitiver Schritt, der es jedoch ermöglichte, die Situation zu kontrollieren, während es die Kontrolle über sein DNS zurückgewann, ohne dabei zu verraten, dass es den Einbruch bemerkt hatte. Dann [kontaktierte es betroffene Kunden bezüglich dieser Dateien umgehend](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=All%20affected%20clients%20in%20respect%20of%20these%20files%20were%20contacted%20immediately).

**Dann kam der Teil, der es zu einer Fallstudie machte.** Drei Monate später, nach eingehender Analyse und mit einer laufenden Strafverfolgungsuntersuchung, veröffentlichte Fox-IT eine vollständige, zeitgestempelte Post-Mortem-Analyse unter einem einfachen Grundsatz: [Transparenz schafft mehr Vertrauen als Geheimhaltung, und es gibt Lektionen zu lernen](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=transparency%20builds%20more%20trust%20than%20secrecy). Ein Sicherheitsunternehmen war auf die markentypischste denkbare Weise bloßgestellt worden — und anstatt es zu vergraben, lieferte es der Branche eine vollständige Analyse. Die Schlagzeile von BleepingComputer traf den Ton des Moments genau: [Top Security Firm Admits to MitM Security Incident](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=Top%20Security%20Firm%20Admits).

## Was das über Registrar-Sicherheit und Registry Locks lehrt

Wenn man die Details beiseitelässt, ist der Fox-IT-Vorfall eine Lektion darüber, wo der eigentliche Perimeter liegt. Für die meisten Organisationen ist der Perimeter nicht nur die Firewall. Es ist der Registrar-Login. Das ist, wofür dieser Fall argumentiert:

1. **Behandeln Sie das Registrar-Konto wie Produktionsinfrastruktur.** Es ändert sich selten, sodass es leicht in Vergessenheit gerät — und das ist genau der Grund, warum es veraltet. Ein Passwort, das [seit 2013](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013) unverändert ist, ist kein „geringes Risiko wegen geringem Traffic"; es ist eine hochwertige Zugangsberechtigung ohne jegliches Monitoring.

2. **Verlangen Sie Multi-Faktor-Authentifizierung beim Registrar — und wechseln Sie, wenn sie nicht angeboten wird.** Fox-ITs Registrar [unterstützte 2FA überhaupt nicht](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA). Das wichtigste einzelne Konto in der Sicherheitskette Ihrer Domain war nur durch ein Passwort geschützt. Das Vorhandensein oder Fehlen von 2FA bei einem Registrar ist ein Beschaffungskriterium, kein Nice-to-have.

3. **Nutzen Sie einen Registry Lock.** Über den eigenen Login des Registrars hinaus bieten viele Registries einen *Registry Lock* an — eine serverseitige Sperre, die Änderungen an Nameservern und Kontaktdaten verhindert, sofern kein Out-of-Band-, manueller Verifizierungsschritt abgeschlossen wird. Ein Registry Lock würde bedeuten, dass selbst ein vollständig kompromittiertes Registrar-Passwort DNS nicht stillschweigend umleiten könnte. Er wandelt „einen Panel-Klick entfernt" in „mehrere Menschen und einen Anruf entfernt" um.

4. **Setzen Sie DNSSEC ein, wo immer möglich.** DNSSEC signiert DNS-Antworten kryptographisch, sodass Resolver Manipulationen im Auflösungspfad erkennen können. Es ist hier kein Allheilmittel — ein Angreifer, der die autoritativen Einträge kontrolliert, kann sie auch neu signieren — aber es erhöht die Kosten und schließt ganze Klassen von DNS-Manipulationen während der Übertragung aus. Verteidigung in der Tiefe auf der DNS-Ebene ist genau deshalb wichtig, weil DNS, wie dieser Fall gezeigt hat, *oberhalb* von TLS und der Zertifikatsausstellung im Vertrauens-Stack liegt.

5. **Denken Sie daran, dass DNS-Kontrolle gleich Zertifikats-Kontrolle bedeutet.** Der Angreifer erhielt ein gültiges TLS-Zertifikat, indem er [den Domain-Nachweis durch umgeleitete E-Mails erbrachte](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=proving%20that%20they%20owned%20our%20domain). Überwachen Sie Certificate Transparency-Logs auf unerwartete Zertifikate, die für Ihre Domains ausgestellt wurden. Ein gefälschtes Zertifikat, das in CT erscheint, ist eines der wenigen externen Signale, dass ein DNS-Hijack möglicherweise im Gange ist.

6. **Halten Sie einen zweiten Faktor in der Anwendung selbst aufrecht.** Die Portal-2FA von Fox-IT ist der Grund, warum neun gestohlene Passwörter [ohne den zweiten Authentifizierungsfaktor nutzlos waren](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor). Als die äußere Schicht (DNS) versagte, begrenzte die innere Schicht (MFA auf App-Ebene) noch immer den Schaden.

Der rote Faden: Ihre Domain ist ein Single Point of Failure, den Sie teilweise auslagern. Sie abzuhärten ist nicht glamourös, und es zahlt sich nur an dem Tag aus, an dem jemand genau das versucht, was Fox-IT passiert ist.

## Der Namefi-Aspekt

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-fox-it-dns-hijack-03-namefi-angle.jpg)

Der Fox-IT-Vorfall ist im Kern ein Kontroll- und Herkunftsproblem. Der Angreifer musste nie wirklich Fox-IT sein. Er musste nur ein System — das Registrar-Panel — dazu bringen, *zu glauben*, er sei es, lange genug, um DNS umzuleiten und ein Zertifikat zu erstellen. Alles Nachgelagerte vertraute diesem Glauben.

[Namefi](https://namefi.io) ist darauf ausgerichtet, Domain-Kontrolle verifizierbar und manipulationsresistent zu machen, anstatt sie von einem einzigen wiederverwendbaren Passwort in einem Web-Panel eines Anbieters abhängig zu machen. Indem Domain-Inhaberschaft als verifizierbares, On-Chain-Asset dargestellt wird, das mit DNS kompatibel bleibt, wird Kontrolle zu etwas, das man prüfen und beweisen kann — nicht nur zu einem Konto, in das jemand still einloggen und neu konfigurieren könnte. Kritische Änderungen können an Inhaberschaft gebunden werden, die man tatsächlich hält, im Geiste eines Registry Locks, anstatt an eine Zugangsberechtigung, die seit Jahren nicht rotiert wurde.

Das würde einen entschlossenen Angreifer nicht unmöglich machen. Aber die Fox-IT-Geschichte handelt letztlich davon, dass ein einzelner gestohlener Login in die vollständige Kontrolle über einen Namen übersetzt wurde. Je näher Domain-Kontrolle an verifizierbarer Inhaberschaft liegt — und je schwieriger es ist, einen Namen still mit einem einzigen veralteten Passwort zu ändern — desto weniger kann sich ein Moment wie Fox-ITs „aus ‚ob' wurde ‚wann'" ausbreiten, bevor jemand es bemerkt.

Eine Sicherheitsfirma entdeckte ihren eigenen Angriff in fünf Stunden und teilte der Welt mit, wie. Die meisten Organisationen würden ihn weder in fünf Stunden noch überhaupt entdecken. Die günstigste Lektion ist die, für die Fox-IT bezahlt hat: Sichern Sie den Registrar, bevor er zur offenen Tür wird.

## Quellen und weiterführende Lektüre

- Fox-IT (NCC Group) — [Lessons learned from a Man-in-the-Middle attack](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/) (primäre Post-Mortem-Analyse)
- BleepingComputer — [Top Security Firm Admits to MitM Security Incident](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/)
- Help Net Security — [Security company Fox-IT reveals, details MitM attack they suffered in September](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/)
- Graham Cluley — [Fox-IT reveals hackers hijacked its DNS records, spied on clients' files](https://grahamcluley.com/fox-it-dns-hack/)
- SecurityWeek — [Hackers Target Security Firm Fox-IT](https://www.securityweek.com/hackers-target-security-firm-fox-it/)
- GBHackers — [Leading IT Security Firm Fox-IT hit by Cyber Attack](https://gbhackers.com/cyber-attack/)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (verwandt: DNS-Hijack + Technik zur betrügerischen Zertifikatserlangung im großen Maßstab)
