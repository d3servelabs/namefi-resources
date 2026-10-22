---
title: "Root-DNS-Server verweisen Resolver an die Server der Top-Level-Domains"
description: "Root-DNS-Server liefern Verweise auf TLD-Server. Erfahren Sie, was 13 Kennungen bedeuten und wie Sie Antworten mit dig untersuchen."
date: '2026-10-21'
language: de
tags: ['dns', 'domains', 'infrastructure']
authors: ['namefiteam']
draft: false
format: explainer
cluster: domain-basics
keywords: ['DNS Root Server', 'Root-Nameserver', 'DNS-Stammserver', 'DNS-Root-Zone', '13 Root-Server', 'Root-Server-Kennungen', 'DNS-Verweise', 'Root Hints', 'DNS-Priming', 'DNS-Anycast', 'rekursiver DNS-Resolver', 'DNSSEC-Vertrauensanker', 'QNAME-Minimierung']
ogImage: ../../assets/root-dns-servers-og.jpg
relatedArticles:
  - /de/blog/choose-public-dns-resolver/
  - /de/blog/primary-secondary-dns/
  - /de/blog/fully-qualified-domain-name/
  - /de/blog/domain-terminology-guide/
  - /de/blog/what-is-domain/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/root-zone/
  - /de/glossary/tld/
  - /de/glossary/dns-resolver/
  - /de/glossary/dnssec/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-investor-field-guide/
  - /de/series/domain-apocalypse/
---

Root-DNS-Server helfen einem Resolver, die zuständigen Server einer Top-Level-Domain wie `.com` oder `.org` zu finden. Die Root-Zone enthält hauptsächlich solche Delegierungen. Root-Server speichern nicht die Adressen aller Websites und erledigen nicht jede Namensauflösung für Besucher. [IANA beschreibt den Umfang der Root-Zone.](https://www.iana.org/domains/root)

Die bekannte Zahl dreizehn bezeichnet benannte Autoritäten von `a.root-servers.net` bis `m.root-servers.net`. Die Zahl bezeichnet keine dreizehn einzelnen Rechner. [IANA führt die Namen, Adressen und Betreiber auf.](https://www.iana.org/domains/root/servers)

Für Domaininhaber ist die Zuständigkeit entscheidend. Ein Website-Eintrag gehört in die autoritative Zone der Domain. Eine Root-Server-Einstellung gehört zur Infrastruktur, die Delegierungsinformationen ermittelt. Wer die Aufgaben verwechselt, untersucht möglicherweise einen Dienst, der den betroffenen Eintrag gar nicht korrigieren kann.

## Root-Server verweisen Resolver an die nächste zuständige Stelle

![Root-Server verweisen Resolver an die nächste zuständige Stelle.](../../assets/root-dns-servers-01-referral-path.jpg)

Das [DNS](/de/glossary/dns/) verteilt Zuständigkeiten über eine Hierarchie. Die [Root-Zone (Root-Server)](/de/glossary/root-zone/) bildet die höchste Ebene. Eine [TLD](/de/glossary/tld/) liegt unmittelbar unter der Root-Zone. IANA dokumentiert technische Delegierungsinformationen für TLDs und nennt deren Verwalter. [Die Übersicht zur Root-Zone erläutert die Zuständigkeiten.](https://www.iana.org/domains/root)

Betrachten Sie eine hypothetische Abfrage für `www.example.com.`. Der abschließende Punkt kennzeichnet ausdrücklich die DNS-Wurzel. Ein [DNS-Resolver (Rekursiver Resolver)](/de/glossary/dns-resolver/) beschafft die Informationen für die Antwort an den Client. Ein autoritativer Server antwortet anhand der Zonendaten, für die der Server zuständig ist. [RFC 9499 unterscheidet die Rollen von Resolvern und Servern.](https://www.rfc-editor.org/rfc/rfc9499.html#section-6)

Ohne brauchbare zwischengespeicherte Delegierung kann der Resolver einen Root-Server nach dem nächsten Schritt zu `.com` fragen. Der Root-Server liefert einen Verweis mit den Namen der `.com`-Server. Anschließend fragt der Resolver einen `.com`-Server nach `example.com`, erhält eine weitere Delegierung und kontaktiert die autoritativen Server der Domain.

Ein Verweis enthält normalerweise die NS-Einträge der untergeordneten Zone im Abschnitt „Authority“. Die Antwort kann außerdem nützliche Serveradressen im Abschnitt „Additional“ enthalten. Bestimmte unterstützende Adresseinträge heißen im DNS „Glue“. [RFC 1034 beschreibt den Aufbau eines Verweises in Abschnitt 4.3.2.](https://www.rfc-editor.org/rfc/rfc1034.html#section-4.3.2)

Der Resolver folgt dem Verweis. Der Root-Server leitet die Website-Anfrage des Besuchers nicht an den TLD-Server weiter. Auch die Website-Inhalte reisen getrennt von den DNS-Antworten. Ein funktionierender Root-Dienst beweist deshalb nicht, dass eine Anwendung funktioniert.

Die folgende Übersicht hilft bei der Wahl der Untersuchungsebene. Die Rollen beschreiben eine vereinfachte öffentliche Namensauflösung, nicht jede mögliche Bereitstellung.

| Ebene | Hauptaufgabe | Hilfreiche Frage |
| --- | --- | --- |
| Rekursiver Resolver | Ermittelt oder speichert Antworten | Können Clients Namen auflösen? |
| Root-Server | Liefert Daten der Root-Zone | Kann der Resolver die TLD finden? |
| TLD-Server | Liefert Domain-Delegierungen | Nennt die übergeordnete Zone die vorgesehenen Server? |
| Autoritativer Domainserver | Liefert die Einträge der Domain | Existiert der angefragte Eintrag? |

Das Wort „Nameserver“ kann unterschiedliche Rollen bezeichnen. Notieren Sie vor einer Supportanfrage den abgefragten Namen, den Eintragstyp, den Server und die Antwort. Die Aussage „DNS funktioniert nicht“ benennt die fehlerhafte Ebene nicht.

Ein korrekter `.com`-Verweis bestätigt beispielsweise nicht den A-Eintrag für `www.example.com`. Der Verweis zeigt den nächsten Schritt. Die autoritative Antwort der Domain beantwortet die spätere Adressfrage. Bewahren Sie beide Beobachtungen auf, wenn Sie erfolgreiche und fehlgeschlagene Abfragen vergleichen.

## Dreizehn Kennungen stehen für einen verteilten Dienst

![Dreizehn Kennungen stehen für einen verteilten Dienst.](../../assets/root-dns-servers-02-identifiers-instances.jpg)

Die Root-Server-Kennungen verwenden die Buchstaben A bis M. Jede Kennung hat eine IPv4-Adresse und eine IPv6-Adresse. Mehrere physische Instanzen können den Dienst hinter einer Kennung bereitstellen. Die FAQ der Betreiber unterscheidet ausdrücklich zwischen Kennungen, Betreibern und Instanzen. [Lesen Sie die drei Fragen zur Anzahl.](https://root-servers.org/faq/)

Eine Kennung unterscheidet sich somit von einer Adresse, und eine Adresse unterscheidet sich von einem Rechner. Dreizehn Kennungen bedeuten nicht insgesamt dreizehn Adressen. Eine kopierte Adressliste zeigt auch nicht die physische Bereitstellung hinter jeder Adresse.

Anycast macht eine Dienstadresse an mehreren Standorten verfügbar. Das Routing lenkt ein Paket zu einem erreichbaren Standort. Der Client muss keine physische Instanz aus einer weltweiten Liste auswählen. [RFC 9499 definiert Anycast und Instanzen.](https://www.rfc-editor.org/rfc/rfc9499.html#section-6)

Die Root-Server-Betreiber veröffentlichen Instanzstandorte und Betriebsinformationen auf ihrer gemeinsamen Website. Die Anzahl der Instanzen ändert sich mit der Bereitstellung. Eine feste Gesamtzahl wird schnell zu einer historischen Momentaufnahme. Aktuelle Betriebsfragen erfordern deshalb eine aktuelle Prüfung. [Die Root-Server-Website veröffentlicht das aktuelle Verzeichnis.](https://root-servers.org/)

Die Unterscheidung hilft bei Störungen. Eine Zeitüberschreitung bei einer Adresse aus einem Netz dokumentiert eine fehlgeschlagene Beobachtung. Die Zeitüberschreitung allein beweist nicht, dass jede Instanz der Kennung ausgefallen ist. Die Beobachtung sagt noch weniger über alle anderen Root-Kennungen aus.

Notieren Sie bei einer Untersuchung das Quellnetz und den Beobachtungszeitpunkt neben der Zieladresse. Vergleichen Sie Ergebnisse aus einem weiteren zugelassenen Netz, bevor Sie einen globalen Ausfall melden. Eine geänderte Antwortzeit braucht Kontext. Die Messung beweist keinen Wechsel des nächstgelegenen physischen Rechners.

Ein Büronetz könnte den freigegebenen rekursiven Resolver zulassen, aber direkten externen DNS-Verkehr sperren. In dieser hypothetischen Umgebung kann eine direkte Root-Abfrage scheitern, während die normale Namensauflösung funktioniert. Die nächste Untersuchung betrifft dann die Netzrichtlinie und den erlaubten Abfrageweg.

Das Root-System besitzt außerdem einen gemeinsamen Namensraum. Verteilte Instanzen erzeugen keine unabhängigen Versionen von `.com`, zwischen denen Kunden wählen. Die Betreiber verpflichten sich, den globalen IANA-Root-Namensraum mit vollständigen, unveränderten DNS-Daten bereitzustellen. [Die FAQ nennt diese Verpflichtung.](https://root-servers.org/faq/)

Domaininhaber sollten Root-Kennungen deshalb nicht wie konkurrierende DNS-Hosting-Angebote behandeln. Die Auswahl eines autoritativen Anbieters für `example.com` verändert eine andere Hierarchieebene. Die Auswahl eines rekursiven Resolvers verändert den Dienst, der Abfragen für Clients ausführt.

## Zwischenspeicher und minimierte Abfragen verändern den Abfrageweg

![Zwischenspeicher und minimierte Abfragen verändern den Abfrageweg.](../../assets/root-dns-servers-03-cache-minimization.jpg)

Ein Resolver beginnt nicht jede Namensauflösung an der Wurzel. Der Auflösungsalgorithmus prüft zuerst verfügbare lokale Informationen und kann zwischengespeicherte Delegierungen wiederverwenden. Zwischengespeicherte Einträge haben eine begrenzte Gültigkeitsdauer, die TTL. [RFC 1034 beschreibt den Zwischenspeicher und den Resolver-Algorithmus.](https://www.rfc-editor.org/rfc/rfc1034.html#section-5.3.2)

Angenommen, ein Resolver kennt bereits die `.com`-Server, aber nicht die Antwort für `www.example.com`. Der Resolver kann mit der bekannten Delegierung beginnen. Hat der Resolver bereits eine brauchbare endgültige Antwort gespeichert, kann der Resolver die Antwort ohne erneute Delegierungsabfragen liefern.

Die logische Hierarchie unterscheidet sich deshalb von den Paketen einer einzelnen Anfrage. Ein Diagramm mit Root-, TLD- und Domainservern erklärt die Zuständigkeiten. Das Diagramm beweist nicht, dass jeder Besuch Pakete an jede Ebene sendet.

Ein Resolver braucht dennoch eine Startkonfiguration. Root Hints liefern Root-Server-Namen und -Adressen, oft zusammen mit der Resolver-Software. IANA bietet Root Hints, die Root-Zone und Vertrauensankerdateien als getrennte Ressourcen an. [Die Seite „Root Files“ erklärt den jeweiligen Zweck.](https://www.iana.org/domains/root/files)

Priming aktualisiert die Informationen des Resolvers über die Root-Server. Eine Priming-Abfrage fordert NS-Einträge für `.` an. Die Antwort liefert den Root-Server-Satz und Adressinformationen. Der Resolver führt Priming bei Bedarf aus, etwa beim Start mit leerem Zwischenspeicher oder nach Ablauf des Root-NS-Satzes. [RFC 9609 legt das Priming-Verhalten fest.](https://www.rfc-editor.org/rfc/rfc9609.html#section-3)

Root Hints liefern somit Startinformationen. Root Hints ersetzen die Ermittlung aktueller Informationen nicht dauerhaft. Adressen können sich ändern. RFC 9609 erklärt, warum Resolver Änderungen verarbeiten und bei ausbleibender Priming-Antwort ein anderes konfiguriertes Ziel versuchen müssen. Betreiber sollten das Aktualisierungsverfahren ihrer Resolver-Software verwenden.

Die Minimierung von Abfragenamen begrenzt, wie viel des angefragten Namens ein vorgelagerter Server sieht. Ein minimierender Resolver kann die Root-Zone nach `com.` fragen, während der Resolver `www.example.com.` auflöst. Der Resolver muss an der Wurzel nicht den vollständigen ursprünglichen Namen offenlegen. [RFC 9156 erläutert das Verfahren.](https://www.rfc-editor.org/rfc/rfc9156.html#section-2)

Die Minimierung begrenzt unnötige Offenlegung gegenüber autoritativen Servern. Der rekursive Resolver, der die Client-Anfrage bearbeitet, sieht weiterhin die vollständige Anfrage. Das Protokoll braucht außerdem Implementierungsgrenzen und Kompatibilitätsverhalten. Eine idealisierte Paketfolge beschreibt nicht jede Resolver-Konfiguration.

Diese Einzelheiten verändern Datenschutz- und Leistungsfragen. Prüfen Sie, welcher Resolver die ursprüngliche Anfrage erhält, welche Delegierungen der Resolver bereits kennt und ob der Resolver vorgelagerte Namen minimiert. Eine Root-Server-Verkehrszahl belegt keinen vollständigen Browserverlauf.

Bewahren Sie bei der Fehlersuche den Zustand des Zwischenspeichers möglichst auf. [Das Leeren des Zwischenspeichers](/de/blog/flush-dns-cache/) verändert die Untersuchungsbedingungen. Dokumentieren Sie den ersten Fehler vor einem Resolver-Neustart oder dem Löschen nützlicher Informationen. Eine spätere erfolgreiche Abfrage kann sonst verdecken, ob der ursprüngliche Fehler die Ermittlung, gespeicherte Daten oder eine andere Ebene betraf.

## DNSSEC und Diagnose beantworten unterschiedliche Fragen

![DNSSEC und Diagnose beantworten unterschiedliche Fragen.](../../assets/root-dns-servers-04-trust-diagnostics.jpg)

[DNSSEC (Domain Name System Security Extensions)](/de/glossary/dnssec/) ergänzt Herkunftsauthentifizierung und Integritätsprüfungen für DNS-Daten. Ein validierender Resolver beginnt mit einem konfigurierten Vertrauensanker und baut eine Authentifizierungskette auf. DNSSEC verschlüsselt keine DNS-Fragen und garantiert keine Dienstverfügbarkeit. [RFC 4033 erläutert die Dienste und Grenzen.](https://www.rfc-editor.org/rfc/rfc4033.html#section-4)

Der Root Key Signing Key liefert einen Vertrauensanker für die Root-Validierung. IANA veröffentlicht Vertrauensankerinformationen und Hinweise zum Schlüsselwechsel für Resolver-Betreiber. Betreiber sollten aktuelle Hinweise befolgen, statt einen alten Schlüsselwert aus einer Anleitung zu kopieren. [IANA pflegt diese Betriebsinformationen.](https://www.iana.org/dnssec/files)

Ein Root-Vertrauensanker betrifft die Echtheit von DNS-Daten. Der Vertrauensanker benennt nicht den rechtlichen Domaininhaber und gewährt keine Kontrolle über ein Registrarkonto. Eine erfolgreiche Validierung beantwortet eine engere technische Frage als ein Registrierungsdokument oder eine Kontoberechtigung.

Begrenzen Sie Diagnosefragen ebenso genau. Prüfen Sie zuerst die normale Namensauflösung über den freigegebenen Resolver. Untersuchen Sie anschließend die Delegierung getrennt, wenn die Befunde auf ein Ermittlungsproblem hinweisen. Betreiber mit installiertem `dig` können den Root-NS-Satz mit folgender rein lesenden Abfrage untersuchen:

```bash
dig . NS
```

Der Befehl fragt den konfigurierten Resolver. Die Antwort kann aus dem Zwischenspeicher des Resolvers stammen. Eine erfolgreiche Antwort beweist deshalb keinen neuen direkten Austausch mit einer Root-Instanz. Speichern Sie Antwortflags, TTLs, Serverinformationen und Zeitstempel vor einer Schlussfolgerung.

### Direkte Abfragen unterscheiden Root-Antworten von TLD-Verweisen

Verwenden Sie direkte Abfragen nur, wenn die Netzrichtlinie externen DNS-Verkehr erlaubt. Die folgende Adresse gehört laut [IANA-Root-Server-Liste](https://www.iana.org/domains/root/servers) zu A-root. Die Adresse wählt einen Dienstendpunkt, keinen einzelnen physischen Rechner.

Fragen Sie den Endpunkt zuerst nach den eigenen NS-Einträgen der Root-Zone:

```bash
dig @198.41.0.4 . NS +norecurse
```

Fragen Sie denselben Endpunkt anschließend nach der `.com`-Delegierung:

```bash
dig @198.41.0.4 com. NS +norecurse
```

Das Argument `@` wählt den Server. Die Option `+norecurse` löscht das Flag für die gewünschte Rekursion. [BIND dokumentiert die Option und die Abfragesyntax.](https://bind9.readthedocs.io/en/stable/manpages.html#dig-dns-lookup-utility) Bewahren Sie die vollständige Ausgabe einschließlich Antwortabschnitten und Flags auf.

![Eine direkte Root-NS-Abfrage liefert Root-Server-Namen in ANSWER. Eine com-NS-Abfrage liefert einen Verweis in AUTHORITY.](../../assets/root-dns-servers-05-answer-referral.jpg)

Die Tabelle beschreibt erwartetes Protokollverhalten, keine aufgezeichnete Befehlsausgabe. Tatsächliche Ergebnisse hängen von der Erreichbarkeit und dem antwortenden Dienst ab.

| Abfrage | Erwartete erfolgreiche Antwort | Bedeutung |
| --- | --- | --- |
| `. NS` | Root-NS-Einträge in `ANSWER`, mit `aa` | Der Server antwortet autoritativ für den Root-Namen |
| `com. NS` | Delegierungs-NS-Einträge in `AUTHORITY`, meist mit Adressen in `ADDITIONAL` und ohne `aa` | Der Server verweist die nächste Abfrage an die `.com`-Server |

Das Flag `aa` bedeutet eine autoritative Antwort für den abgefragten Namen. Ein Root-Server kann für `.` autoritativ antworten und eine `.com`-Frage weiterverweisen. [RFC 1035 definiert AA.](https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1) Die Überschrift `AUTHORITY` benennt einen Antwortabschnitt. Die Überschrift beweist nicht, dass die Antwort das Flag `aa` enthält.

Lesen Sie neben den Abschnittszahlen auch den Antwortstatus. Ein erfolgreicher Verweis kann `NOERROR` und einen leeren `ANSWER`-Abschnitt haben. Der leere Abschnitt allein bedeutet nicht `NXDOMAIN`. [RFC 1034 ordnet die NS-Einträge eines Verweises dem Authority-Abschnitt zu](https://www.rfc-editor.org/rfc/rfc1034.html#section-4.3.2). [RFC 1035 definiert den Antwortcode für einen Namensfehler](https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1).

Eine Zeitüberschreitung liefert keinen DNS-Antwortstatus. Vergleichen Sie die Zeitüberschreitung mit dem Ergebnis des freigegebenen Resolvers und der Netzrichtlinie, bevor Sie einen Root-Dienst-Ausfall melden.

### Eine iterative Ablaufverfolgung folgt dem Delegierungsweg

Verwenden Sie für eine getrennte Delegierungsuntersuchung einen reservierten Beispielnamen:

```bash
dig +trace example.com. A
```

BIND dokumentiert `+trace` als iterative Ablaufverfolgung ab der Wurzel. Das Werkzeug folgt Verweisen und zeigt die Antworten entlang des Weges. Die Ablaufverfolgung zeigt den Austausch des Diagnosewerkzeugs, keine Wiederholung der früheren Browser-Abfrage. [Lesen Sie das BIND-Handbuch zu dig.](https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility)

Untersuchen Sie den Haltepunkt, bevor Sie die Konfiguration ändern. Eine Ablaufverfolgung bis zu den autoritativen Domainservern hat den Root-Verweis bereits passiert. Ein Fehler beim endgültigen Eintrag erfordert eine Untersuchung auf dieser Ebene. Wenn die Ablaufverfolgung nicht startet, vergleichen Sie Netzrichtlinie und normale rekursive Namensauflösung.

Ein hypothetischer Störungsbericht könnte lauten: „Der freigegebene Resolver antwortete, aber die direkte iterative Ablaufverfolgung aus dem Büronetz überschritt die Wartezeit.“ Die Aussage bewahrt die Befunde. „Die Root-Server sind ausgefallen“ behauptet mehr, als die beiden Beobachtungen belegen.

Ein hilfreicher Supportbericht enthält neben dem Fehler auch einen erfolgreichen Vergleich. Geben Sie an, ob derselbe Name über den freigegebenen Resolver auflösbar ist. Geben Sie außerdem an, ob andere Namen ebenfalls scheitern. Trennen Sie Beobachtungen aus unterschiedlichen Netzen, denn unterschiedliche Quellnetze können unterschiedliche Wege nehmen. Diese Angaben helfen dem Support, die Bedingungen ohne Annahme eines globalen Ausfalls nachzustellen.

Die Wiederherstellung sollte zum bestätigten Fehler passen. Korrigieren Sie einen Domain-Eintrag beim autoritativen DNS-Anbieter. Untersuchen Sie die übergeordnete Delegierung, wenn die übergeordnete Zone unerwartete Server nennt. Untersuchen Sie die Resolver-Konfiguration, wenn Priming oder Validierung trotz erreichbarer autoritativer Dienste scheitert. Bewahren Sie vor jeder Änderung die ursprünglichen Befunde auf.

Root-Server bilden eine wichtige gemeinsame Ermittlungsebene. Praktische Fehlersuche gelingt besser, wenn jede Beobachtung die geprüfte Zuständigkeit benennt. Ein Root-Verweis, eine zwischengespeicherte Antwort, eine validierte Signatur und eine funktionierende Website belegen jeweils ein anderes Ergebnis.

## Die Quellen liefern weitere Informationen

- IANA, [Root Zone Management](https://www.iana.org/domains/root), Einleitung und Delegierungszuständigkeiten. Abgerufen am 21.10.2026.
- IANA, [Root Name Servers](https://www.iana.org/domains/root/servers), Einleitung und Tabelle der benannten Autoritäten. Abgerufen am 21.10.2026.
- Root Server Technical Operations Association, [FAQ](https://root-servers.org/faq/), Fragen zu Kennungen, Instanzen, Zwischenspeicherung und Namensraum. Abgerufen am 21.10.2026.
- Root Server Technical Operations Association, [Root-Server-Verzeichnis](https://root-servers.org/), Karte und Betreiberlisten. Abgerufen am 21.10.2026.
- IETF, [RFC 9499, Abschnitt 6](https://www.rfc-editor.org/rfc/rfc9499.html#section-6), Resolver, autoritative Server, Anycast und Instanzen. Abgerufen am 21.10.2026.
- IETF, [RFC 1034](https://www.rfc-editor.org/rfc/rfc1034.html), Abschnitte 4.3.2 und 5.3.2–5.3.3, Verweise und zwischengespeicherte Namensauflösung. Abgerufen am 21.10.2026.
- IANA, [Root Files](https://www.iana.org/domains/root/files), Root-Zonendateien. Abgerufen am 21.10.2026.
- IETF, [RFC 9609, Abschnitte 2–3](https://www.rfc-editor.org/rfc/rfc9609.html#section-2), Root Hints und Priming-Abfragen. Abgerufen am 21.10.2026.
- IETF, [RFC 9156, Abschnitte 1–3](https://www.rfc-editor.org/rfc/rfc9156.html#section-2), Minimierung und Zwischenspeicherverhalten. Abgerufen am 21.10.2026.
- IETF, [RFC 4033, Abschnitte 2–4](https://www.rfc-editor.org/rfc/rfc4033.html#section-2), Vertrauensanker und DNSSEC-Grenzen. Abgerufen am 21.10.2026.
- IANA, [Trust Anchors and Rollovers](https://www.iana.org/dnssec/files), Einleitung und Vertrauensanker der Root-Zone. Abgerufen am 21.10.2026.
- Internet Systems Consortium, [BIND-Handbuch zu dig](https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility), Abfragesyntax und `+trace`. Abgerufen am 21.10.2026.
- IETF, [RFC 1035, Abschnitt 4.1.1](https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1), AA-Flag und Antwortcodes. Abgerufen am 21.10.2026.
- Internet Systems Consortium, [Stabiles BIND-Handbuch zu dig](https://bind9.readthedocs.io/en/stable/manpages.html#dig-dns-lookup-utility), Serverauswahl und `+norecurse`. Abgerufen am 21.10.2026.
