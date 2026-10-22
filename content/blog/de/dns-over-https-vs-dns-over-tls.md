---
title: 'DNS über HTTPS und DNS über TLS schützen die Resolver-Verbindung unterschiedlich'
description: 'Vergleichen Sie DoH und DoT nach Ports, Authentifizierung, Ausweichverhalten und Datenschutz. Prüfen Sie die DNS-Verbindung Ihres Geräts.'
date: '2026-10-21'
language: de
tags: ['dns', 'security', 'privacy', 'networking']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-security
keywords: ['DNS über HTTPS vs DNS über TLS', 'DoH vs DoT', 'verschlüsseltes DNS', 'DNS-Datenschutz', 'DNS-Port 853', 'DNS-Port 443', 'strikter DNS-Datenschutz', 'DNS-Ausweichverhalten', 'DNS-Authentifizierung', 'sichere DNS-Einstellungen', 'DNS-Verbindung prüfen', 'rekursiver Resolver']
ogImage: ../../assets/dns-over-https-vs-dns-over-tls-og.jpg
relatedArticles:
  - /de/blog/choose-public-dns-resolver/
  - /de/blog/root-dns-servers/
  - /de/blog/nslookup-specific-dns-server/
  - /de/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /de/blog/dns-is-the-control-plane/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/dns-resolver/
  - /de/glossary/dnssec/
  - /de/glossary/nameserver/
  - /de/glossary/dns-hijacking/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-investor-field-guide/
  - /de/series/domain-apocalypse/
---

DNS über HTTPS und DNS über TLS verschlüsseln die Verbindung zwischen einem DNS-Client und einem Resolver. DoH überträgt DNS-Nachrichten über HTTPS. DoT überträgt DNS-Nachrichten direkt über TLS, ohne HTTP-Schicht.

Die geeignete Wahl hängt vom Geltungsbereich, der Serverauthentifizierung und dem Verhalten bei Fehlern ab. Eine Einstellung mit unverschlüsselter Ausweichverbindung bietet einen anderen Schutz als eine Einstellung, die bei Verschlüsselungsfehlern keine Namen mehr auflöst.

Keines der beiden Protokolle verbirgt DNS-Anfragen vor dem ausgewählten Resolver. Keines verschlüsselt automatisch jeden nachfolgenden DNS-Austausch oder ersetzt ein VPN. Dieser Leitfaden vergleicht die Verbindung vom Client zum Resolver und erklärt die Prüfung.

## Beide Protokolle schützen eine Verbindung im DNS-Pfad

![Beide Protokolle schützen eine Verbindung im DNS-Pfad.](../../assets/dns-over-https-vs-dns-over-tls-01-protected-connection.jpg)

Eine [DNS](/de/glossary/dns/)-Abfrage kann mehrere Verbindungen durchlaufen. Eine Anwendung fragt einen Namen ab. Ein Client kontaktiert einen [DNS-Resolver (Rekursiver Resolver)](/de/glossary/dns-resolver/), der eine Antwort beschafft. Eine Antwort im Zwischenspeicher kann zusätzliche Abfragen vermeiden. Ohne passende gespeicherte Antwort können Verbindungen zu autoritativen Servern notwendig sein.

Ein hypothetischer Laptop fragt die Adresse von `www.example.com` ab. Der Laptop sendet eine verschlüsselte Anfrage an einen konfigurierten rekursiven Resolver. Der Resolver entschlüsselt die Anfrage, denn der Resolver muss die Frage lesen, um eine Antwort zu liefern. Die verschlüsselte Verbindung endet am Resolver.

DoH und DoT schützen daher den Inhalt der DNS-Nachrichten vor gewöhnlichem passivem Mitlesen auf der geschützten Verbindung. Die [IETF-Datenschutzanalyse](https://www.rfc-editor.org/rfc/rfc9076.html#section-6.1.4) unterscheidet Transportschutz und Sichtbarkeit beim Resolver. Der Resolver erhält weiterhin den abgefragten Namen und zugehörige Verbindungsinformationen. Die Auswahl des Resolvers bleibt eine Vertrauensentscheidung.

Prüfen Sie den Betreiber des Resolvers, bevor Sie die Transportauswahl abschließen. Lesen Sie die aktuelle Datenschutzerklärung und die Konfigurationsanleitung des Dienstes. Verschlüsselung allein sagt nichts über Aufbewahrungsfristen, Filterregeln oder andere Nutzungen der Abfragedaten aus.

Die nächste Verbindung braucht eine eigene Betrachtung. Ein rekursiver Resolver kann nach einer erfolglosen Zwischenspeicherabfrage einen autoritativen [Nameserver (NS Record)](/de/glossary/nameserver/) kontaktieren. Die Aktivierung von DoH im Browser konfiguriert diese Verbindung nicht. Die ursprüngliche [DoT-Spezifikation](https://www.rfc-editor.org/rfc/rfc7858.html#section-1) konzentriert sich auf Stub-Clients und rekursive Server, statt den autoritativen Transport festzulegen.

Verschlüsseltes DNS lässt außerdem andere Netzwerkaktivitäten sichtbar. Netzwerkbeobachter erkennen weiterhin Verbindungsziele und Verkehrsmuster. Die Verschlüsselung der DNS-Nachrichten schafft keine Anonymität. Eine Zieladresse kann Hinweise auf den Dienst geben. Die [IETF nennt die Verkehrsanalyse](https://www.rfc-editor.org/rfc/rfc9076.html#section-5.2) als verbleibendes Problem.

[DNSSEC (Domain Name System Security Extensions)](/de/glossary/dnssec/) löst ein anderes Problem. DNSSEC authentifiziert die Herkunft signierter DNS-Daten und schützt deren Integrität. DNSSEC verschlüsselt keine Anfragen, wie [RFC 4033 erklärt](https://www.rfc-editor.org/rfc/rfc4033.html#section-1). Eine authentifizierte Resolver-Verbindung und DNSSEC-Validierung können einander ergänzen.

Ein VPN hat ebenfalls einen anderen Geltungsbereich. DoH und DoT transportieren DNS-Verkehr, statt beliebigen Anwendungsverkehr durch einen Tunnel zu leiten. Wenn ein Ziel ein VPN erfordert, genügt verschlüsseltes DNS allein nicht. Umgekehrt beweist die Prüfung einer VPN-Verbindung nicht, welche DNS-Einstellungen eine Anwendung verwendet.

Die praktische Frage lautet: Welcher Client sendet welche Anfragen über welche geschützte Verbindung an welchen Resolver? Diese Frage verhindert unbelegte Aussagen über das gesamte Gerät aufgrund einer Browsereinstellung.

### Jeder Beobachter behält eine andere Sicht auf die Verbindung

![Eine verschlüsselte DNS-Verbindung verbirgt die Anfrage vor dem Netzwerk, zeigt die Anfrage aber dem ausgewählten Resolver.](../../assets/dns-over-https-vs-dns-over-tls-05-visibility-boundary.jpg)

| Beobachter | Schutz durch authentifiziertes DoH oder DoT | Weiterhin sichtbar |
| --- | --- | --- |
| Beobachter im lokalen WLAN oder beim Internetanbieter | Inhalt der DNS-Frage und DNS-Antwort auf der geschützten Verbindung | Resolver-Ziel, Verbindungszeitpunkte und Datenmengen |
| Betreiber des ausgewählten Resolvers | Keine Verschleierung gegenüber dem antwortenden Dienst | DNS-Frage und Verbindungsinformationen |
| Autoritativer Server | Keine automatische Verschlüsselung der separaten vorgelagerten Resolver-Verbindung | Fragen, die der Resolver an den Server sendet |

Die Tabelle beschreibt die [Datenschutzgrenzen aus RFC 9076](https://www.rfc-editor.org/rfc/rfc9076.html#section-6.1.4). Die Tabelle behauptet nicht, dass jeder Beobachter jede besuchte Website erkennen kann. Zwischenspeicher, gemeinsam genutzte Adressen und weitere Schutzmaßnahmen beeinflussen solche Rückschlüsse.

## DoH und DoT unterscheiden sich bei Transport und Konfiguration

![DoH und DoT unterscheiden sich bei Transport und Konfiguration.](../../assets/dns-over-https-vs-dns-over-tls-02-transport-paths.jpg)

DoT stellt normalerweise eine TCP-Verbindung zu Port 853 her und startet einen TLS-Verbindungsaufbau. [RFC 7858, Abschnitt 3.1](https://www.rfc-editor.org/rfc/rfc7858.html#section-3.1), erlaubt einen anderen gemeinsam konfigurierten Port, schließt dafür aber Port 53 aus. Nach einem fehlgeschlagenen Verbindungsaufbau darf ein DoT-Port kein unverschlüsseltes DNS übertragen.

DoH nutzt HTTPS mit dem Standardport 443. Der Client benötigt eine konfigurierte Endpunkt-URL oder URI-Vorlage. [RFC 8484, Abschnitte 3 und 4](https://www.rfc-editor.org/rfc/rfc8484.html#section-3), beschreiben Serverauswahl und DNS-Anfragen über HTTP GET oder POST. Eine IP-Adresse allein beschreibt keinen vollständigen DoH-Endpunkt.

| Merkmal | DoH | DoT |
| --- | --- | --- |
| Nachrichtentransport | HTTPS | TLS direkt |
| Standardport | 443 | TCP 853 |
| Konfiguration | HTTPS-Endpunkt | Server und Authentifizierungsangaben |
| Sichtbarkeit des Ports | Gemeinsamer HTTPS-Port | Eigener DNS-Transportport |
| Fehlerverhalten | Clienteinstellung | Clientprofil und Einstellung |

Google liefert ein konkretes Beispiel. Googles [Dokumentation sicherer Transporte](https://developers.google.com/speed/public-dns/docs/secure-transports#endpoints) nennt `dns.google` für DoT auf Port 853. Die Dokumentation nennt `https://dns.google/dns-query{?dns}` für standardkonformes DoH auf Port 443. Andere Dienste können andere Endpunktnamen und Pfade veröffentlichen.

Übernehmen Sie Endpunktwerte aus der Dokumentation des ausgewählten Betreibers. Ein Hostnamenfeld und ein URL-Feld erwarten unterschiedliche Eingaben. Fügen Sie keine HTTPS-URL in ein Feld für einen DoT-Authentifizierungshostnamen ein. Nehmen Sie nicht an, dass jeder Anbieter `/dns-query` verwendet, nur weil ein dokumentierter Endpunkt diesen Pfad nutzt.

Der eigene DoT-Port vereinfacht portbasierte Netzwerkregeln. DoH teilt einen Port mit anderen HTTPS-Diensten und erschwert damit die Erkennung allein anhand des Ports. Dieser Unterschied macht DoH nicht unblockierbar. Ein Netzwerk kann Ziele beschränken. Verwaltete Geräte können Anwendungsrichtlinien anwenden.

Keine Portnummer allein beweist Vertraulichkeit. Verkehr zu Port 443 kann zu einer anderen Website gehören. Verkehr zu Port 853 zeigt Ziel und Port, beweist aber keine erfolgreiche Serverauthentifizierung. Eine Prüfung muss Verkehrsdaten, Clientkonfiguration und Verbindungsstatus zusammen betrachten.

DoH übernimmt außerdem HTTP-Implementierungsentscheidungen. Cookies und identifizierende Header können zusätzliche Verknüpfungsmöglichkeiten schaffen, laut [RFC 8484, Abschnitt 8.2](https://www.rfc-editor.org/rfc/rfc8484.html#section-8.2). Daraus folgt nicht, dass jeder DoH-Client Cookies sendet. Prüfen Sie die Clientimplementierung vor einer solchen Aussage.

Wählen Sie keinen Transport aufgrund einer pauschalen Geschwindigkeitsbehauptung. Ein sinnvoller lokaler Vergleich kontrolliert Resolver, Netzwerk, Zwischenspeicherzustand und Anwendung. Erfassen Sie neben der Dauer auch erfolgreiche und fehlgeschlagene Abfragen. Eine schnelle gespeicherte Antwort und eine neue Verbindung messen unterschiedliche Bedingungen. Eine einzelne Messung kann keinen allgemeinen Sieger bestimmen.

## Authentifizierung und Ausweichverhalten bestimmen den tatsächlichen Schutz

![Authentifizierung und Ausweichverhalten bestimmen den tatsächlichen Schutz.](../../assets/dns-over-https-vs-dns-over-tls-03-failure-policies.jpg)

Verschlüsselung schützt einen Kanal. Der Client muss zusätzlich die Identität des vorgesehenen Servers feststellen. Sonst könnte ein Client eine Anfrage an einen unbeabsichtigten Empfänger verschlüsseln. Eine sichere Konfiguration benötigt daher Transportschutz und eine zuverlässige Authentifizierungsentscheidung.

DoH prüft die HTTPS-Serveridentität für den konfigurierten Endpunkt, wie [RFC 8484, Abschnitt 3](https://www.rfc-editor.org/rfc/rfc8484.html#section-3), festlegt. Untersuchen Sie Zertifikatsfehler. Die Abschaltung der Zertifikatsprüfung, um einen Endpunkt erreichbar zu machen, beseitigt die notwendige Identitätsprüfung.

Bei DoT ist die Unterscheidung der Profile wichtig. Das [Profil Strict Privacy](https://www.rfc-editor.org/rfc/rfc8310.html#section-5) verlangt eine verschlüsselte und authentifizierte Verbindung. Wenn der Client die erforderliche Verbindung nicht herstellen kann, schlägt die Namensauflösung fehl. Das Profil priorisiert den festgelegten Schutz gegenüber fortgesetzter Namensauflösung.

Das Profil Opportunistic Privacy erlaubt schwächere Ergebnisse, wenn stärkerer Schutz fehlt. Je nach Konfiguration und Fähigkeiten kann der Client authentifizierte Verschlüsselung, Verschlüsselung ohne Authentifizierung oder Klartext verwenden. Die Angabe „DoT unterstützt“ beweist daher nicht, dass jede erfolgreiche Abfrage authentifizierte Verschlüsselung nutzte.

Halten Sie bei einer hypothetischen Konfigurationsprüfung vier Angaben fest: Resolver-Adresse, Authentifizierungsname, erlaubte Ersatzresolver und Regeln für unverschlüsselte Ausweichverbindungen. Bewahren Sie die Angaben neben der Gerätekonfiguration auf. Eine spätere Fehlersuche benötigt das beabsichtigte Verhalten ebenso wie die aktuelle Einstellung.

DoH-Clients brauchen ebenfalls eine ausdrückliche Prüfung des Fehlerverhaltens. Bezeichnungen in Browseroberflächen beschreiben Produktverhalten und ändern das DoH-Protokoll nicht. Ein Browser kann mehrere Modi mit unterschiedlichen Verfügbarkeitsentscheidungen anbieten.

Mozilla dokumentiert beispielsweise, dass Firefox mit [Standardschutz auf Standardresolver ausweichen kann](https://support.mozilla.org/en-US/kb/dns-over-https#protection-levels-explained), wenn Probleme auftreten. Beim maximalen Schutz zeigt Firefox laut Mozilla eine Warnung, wenn der sichere Resolver das erforderliche Ergebnis nicht liefert. Die Warnung bietet eine Ausnahme über System-DNS an. Eine akzeptierte Ausnahme ändert den Schutz dieser Abfrage.

Diese Firefox-Angaben belegen kein Verhalten anderer Browser. Prüfen Sie die Dokumentation des installierten Clients und des ausgewählten Modus. Verwaltungsrichtlinien, Anwendungsausnahmen und spätere Softwareänderungen können die wirksame Konfiguration beeinflussen.

Der Start des Resolvers schafft eine weitere Grenze. Ein Client mit konfiguriertem Resolver-Hostnamen benötigt möglicherweise zuerst die Adresse dieses Hostnamens. [RFC 8310, Abschnitt 5](https://www.rfc-editor.org/rfc/rfc8310.html#section-5), erlaubt eine anfängliche Adressabfrage vor der anschließenden strikten Verbindung. Strikter Betrieb bedeutet nicht zwingend, dass jedes Startpaket bereits den endgültigen geschützten Kanal nutzt.

Wählen Sie das gewünschte Fehlerverhalten vor einem Ausfall. Wenn vertraulicher DNS-Transport Pflicht ist, prüfen Sie, ob fehlgeschlagene Authentifizierung Abfragen stoppt. Wenn fortgesetzte Erreichbarkeit wichtiger ist, dokumentieren Sie das erlaubte Ausweichverhalten und den geringeren Schutz. Kein Ergebnis sollte die für das Gerät verantwortliche Person überraschen.

## Androids Einstellung „Privates DNS“ verlangt einen Hostnamen und eine Prüfung des Geltungsbereichs

Android bietet bei „Privates DNS“ die Optionen **Aus**, **Automatisch** und **Hostname des privaten DNS-Anbieters**. Googles [Android-Anleitung](https://support.google.com/android/answer/9654714) nennt **Netzwerk & Internet → Privates DNS** als Menüpfad. Gerätehersteller können den Menüpfad ändern.

Tragen Sie für Googles dokumentierten Dienst `dns.google` in das Anbieter-Hostnamenfeld ein und speichern Sie die Einstellung. Geben Sie einen Hostnamen statt `8.8.8.8` oder einer HTTPS-URL ein. Googles [Android-Konfigurationsanleitung](https://developers.google.com/speed/public-dns/docs/using#android) liefert dieses Beispiel. Die Anbieterauswahl erfordert weiterhin die zuvor beschriebenen Prüfungen der Richtlinien und des Ausweichverhaltens.

Leiten Sie den aktiven Transport nicht allein aus der Bezeichnung „Privates DNS“ ab. Android 9 führte DoT-Unterstützung ein. Google [kündigte später Upgrades auf DoH über HTTP/3 an](https://security.googleblog.com/2022/07/dns-over-http3-in-android.html). Diese Upgrades betreffen unterstützte bekannte Resolver auf geeigneten Geräten mit Android 11 oder neuer. Die Ankündigung beschreibt eine aktualisierungsabhängige Transportänderung. Die Ankündigung verspricht keine allgemeine Unterstützung beliebiger DoH-Endpunkt-URLs im Hostnamenfeld.

Prüfen Sie die installierte Android-Version, Systemaktualisierungen, Resolver-Dokumentation und tatsächliche Verbindung. Ein Browser mit eigener Einstellung für sicheres DNS benötigt eine eigene Prüfung. Privates DNS schützt DNS-Fragen und DNS-Antworten statt des gesamten Geräteverkehrs. Bei nicht erreichbaren internen Namen kann die verwaltete Resolver- oder VPN-Konfiguration erforderlich sein, statt eines anderen öffentlichen Hostnamens.

## Ein kontrollierter Test zeigt die DNS-Verbindung des Clients

![Ein kontrollierter Test zeigt die DNS-Verbindung des Clients.](../../assets/dns-over-https-vs-dns-over-tls-04-verify-connection.jpg)

Beginnen Sie mit einer kleinen, rückgängig zu machenden Prüfung auf einem selbst verwalteten Gerät. Sichern Sie die aktuellen DNS-Einstellungen vor einer Änderung. Wählen Sie eine Anwendung und einen dokumentierten Resolver-Endpunkt. Schließen Sie nach Möglichkeit andere Anwendungen, damit fremder Verkehr weniger mehrdeutige Beobachtungen erzeugt.

Halten Sie fest, ob die Konfiguration für den Browser, das Betriebssystem oder einen weiterleitenden Resolver gilt. Ein erfolgreicher Browsertest prüft keinen DNS-Pfad einer anderen Anwendung. Ein DNS-Befehlszeilenprogramm kann einen anderen Pfad als der Browser nutzen. Eine erfolgreiche Abfrage mit dem Programm beweist daher kein Browserverhalten.

Nutzen Sie die folgende Reihenfolge als Diagnoseplan. Die Schritte beschreiben geplante Prüfungen und melden keine Messungen eines bestimmten Geräts.

1. Notieren Sie Resolver, Endpunkt, Authentifizierungseinstellungen und Ausweichmodus.
2. Öffnen Sie die dokumentierte Verbindungsstatus- oder Diagnoseansicht des Clients.
3. Rufen Sie `example.com` in der ausgewählten Anwendung auf.
4. Prüfen Sie, ob die Diagnoseansicht den vorgesehenen verschlüsselten Resolver meldet.
5. Prüfen Sie mit erlaubten Netzwerkdiagnosen das erwartete Ziel und die Verbindung.
6. Wiederholen Sie die Prüfung nach einer erneuten Netzwerkverbindung.

Berücksichtigen Sie gespeicherte Ergebnisse. Eine bereits besuchte Seite benötigt möglicherweise keinen neuen DNS-Austausch. Befolgen Sie das dokumentierte Verfahren zum Leeren des Client-Zwischenspeichers. Alternativ können Sie einen neuen Testnamen unter einer eigenen Domain verwenden. Erzeugen Sie keinen Diagnoseverkehr mit erfundenen Zufallsnamen unter fremden Domains.

Eine Paketaufzeichnung kann den Anwendungsstatus auf einem selbst verwalteten Gerät ergänzen. Suchen Sie nach der erwarteten Resolver-Verbindung und unerwartetem unverschlüsseltem DNS-Verkehr. Ordnen Sie Verkehr auf Port 53 zuerst einem Verursacher zu. Ein anderer Prozess oder eine Startabfrage des Resolvers kann ein Paket erklären. Fehlender sichtbarer Verkehr auf Port 53 beweist ebenfalls nicht, dass jede Anwendung den vorgesehenen Resolver nutzt.

Prüfen Sie danach das Fehlerverhalten mit einer vorübergehenden Regel, die nur den ausgewählten Resolver auf dem Testgerät betrifft. Halten Sie einen Wiederherstellungsweg bereit. Beobachten Sie, ob die ausgewählte Anwendung warnt, die Auflösung stoppt oder einen anderen Pfad verwendet. Entfernen Sie die vorübergehende Regel direkt nach der Beobachtung.

Vergleichen Sie den beobachteten Fehler mit dem dokumentierten Modus. Wenn ein Browser eine gespeicherte Seite weiter lädt, belegt der Vorgang kein Ausweichverhalten. Eine neue erfolgreiche Abfrage über einen anderen Resolver liefert stärkere Hinweise. Erfassen Sie Anwendungsstatus und Zieländerung gemeinsam vor der Interpretation.

Prüfen Sie bei Verbindungsfehlern Endpunktschreibweise, erforderlichen Port, Authentifizierungshostnamen, Geräteuhr und Zertifikatsfehler. Prüfen Sie Netzwerkbeschränkungen, bevor Sie wiederholt den Anbieter wechseln. Umgehen Sie keine Zertifikatsprüfung. Ändern Sie keine autoritativen DNS-Einträge, um einen lokalen Fehler des Resolver-Transports zu beheben.

Trennen Sie Transportfehler und DNS-Antworten. Eine funktionierende verschlüsselte Verbindung kann weiterhin eine negative Antwort für einen nicht vorhandenen Namen liefern. Ein Resolver kann eine Antwort auch wegen fehlgeschlagener DNSSEC-Validierung ablehnen. Verschlüsselung repariert keine fehlerhafte Zone und erzeugt keinen gültigen fehlenden Eintrag.

Wenn nur interne Dienste ausfallen, behandeln Sie den Vorfall nicht weiter als allgemeinen DoH-DoT-Vergleich. Resolver-Auswahl und private DNS-Richtlinien benötigen eine eigene Untersuchung. Der [Leitfaden zu unternehmensinternem Split-Horizon-DNS](/de/blog/dns-over-https-vs-enterprise-split-horizon-dns/) behandelt dieses Bereitstellungsproblem.

Halten Sie das Endergebnis kurz fest: vorgesehener Resolver, geschützter Client-Geltungsbereich, Authentifizierungsergebnis und beobachtetes Fehlerverhalten. Wiederholen Sie relevante Prüfungen nach Änderungen an Browsereinstellungen, VPN-Konfiguration oder Netzwerkrichtlinien. Eine geprüfte Konfiguration liefert eine klarere Antwort als eine Protokollbezeichnung allein.

## Die Quellen erläutern Protokolle und Produkteinstellungen

- IETF — [RFC 8484](https://www.rfc-editor.org/rfc/rfc8484.html), Abschnitte 3–4, 6 und 8: Endpunkte, HTTPS-Nachrichten und Datenschutz. Abgerufen am 21.10.2026.
- IETF — [RFC 7858](https://www.rfc-editor.org/rfc/rfc7858.html), Einleitung und Abschnitt 3: DoT-Geltungsbereich, TCP 853 und Sitzungen. Abgerufen am 21.10.2026.
- IETF — [RFC 8310](https://www.rfc-editor.org/rfc/rfc8310.html#section-5), Abschnitte 4–6: Authentifizierung, strikter Betrieb, opportunistisches Ausweichen und Startabfragen. Abgerufen am 21.10.2026.
- IETF — [RFC 9076](https://www.rfc-editor.org/rfc/rfc9076.html), Abschnitte 5.2, 6.1.4 und 6.2: verbleibende DNS-Datenschutzrisiken. Abgerufen am 21.10.2026.
- IETF — [RFC 4033](https://www.rfc-editor.org/rfc/rfc4033.html#section-1), Einleitung: DNSSEC-Integrität und Unterschied zur Vertraulichkeit. Abgerufen am 21.10.2026.
- Mozilla — [DoH-Schutzstufen in Firefox konfigurieren](https://support.mozilla.org/en-US/kb/dns-over-https), Schutzstufen und Statusfragen. Abgerufen am 21.10.2026.
- Google — [Sichere DNS-Transporte](https://developers.google.com/speed/public-dns/docs/secure-transports#endpoints), Endpunkte. Abgerufen am 21.10.2026.
- Google — [Android-Einstellungen für Privates DNS](https://support.google.com/android/answer/9654714), [Android-Konfiguration für Google Public DNS](https://developers.google.com/speed/public-dns/docs/using#android) und [DNS über HTTP/3 in Android](https://security.googleblog.com/2022/07/dns-over-http3-in-android.html): Hostnamenfelder, Geltungsbereich und versionsabhängige Transporte. Abgerufen am 21.10.2026.
