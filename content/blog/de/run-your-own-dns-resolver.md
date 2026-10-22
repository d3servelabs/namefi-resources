---
title: "Ein eigener DNS-Resolver braucht einen klaren Betriebsplan"
description: "Planen Sie einen eigenen DNS-Resolver mit Unbound, Technitium oder Pi-hole und prüfen Sie Zugriffsrechte vor der Umstellung des Netzwerks."
date: '2026-10-21'
language: de
tags: [dns, guide, security]
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-basics
keywords: ["eigenen DNS Server einrichten", "DNS Server selber hosten", "Unbound Resolver", "Technitium DNS einrichten", "Pi-hole Unbound einrichten", "DNS Server Heimnetz", "rekursives DNS", "DNS Weiterleitung", "DuckDNS Unterschied", "privater DNS Resolver", "DNS Resolver Sicherheit", "lokaler DNS Cache"]
relatedArticles:
  - /de/blog/isp-dns-vs-public-resolver/
  - /de/blog/choose-public-dns-resolver/
  - /de/blog/dns-over-https-vs-dns-over-tls/
  - /de/blog/nslookup-specific-dns-server/
  - /de/blog/primary-secondary-dns/
relatedGlossary:
  - /de/glossary/dns-resolver/
  - /de/glossary/dns/
  - /de/glossary/dnssec/
  - /de/glossary/root-zone/
  - /de/glossary/nameserver/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-investor-field-guide/
  - /de/series/domain-apocalypse/
ogImage: ../../assets/run-your-own-dns-resolver-og.jpg
---

Ein eigener DNS-Resolver übernimmt die Namensanfragen Ihrer Geräte. Der Betrieb umfasst Konfiguration, Zugriffsschutz, Aktualisierungen, Überwachung und Wiederherstellung.

Beginnen Sie mit einem Gerät und einem privaten Abfragezugang. Entscheiden Sie, ob der Resolver rekursiv arbeitet oder Anfragen an einen anderen Betreiber weiterleitet. Halten Sie einen Rückweg bereit, bevor Sie den DNS-Standarddienst des Netzwerks ändern.

Dynamische DNS-Dienste wie DuckDNS erfüllen eine andere Aufgabe. Dynamisches DNS aktualisiert die Adresse eines Hostnamens. Dynamisches DNS ersetzt keinen Resolver, der fremde Domainnamen auflöst.

## Rekursion und Weiterleitung verlangen unterschiedliche Betriebsaufgaben

![Rekursion, Weiterleitung und dynamisches DNS erfüllen unterschiedliche Aufgaben.](../../assets/run-your-own-dns-resolver-01-section.jpg)

Ein rekursiver Resolver ermittelt Antworten über die DNS-Hierarchie und speichert geeignete Ergebnisse im Cache. Ein weiterleitender Resolver übergibt Anfragen an einen anderen Resolver. Ein lokaler Dienst kann einen Cache bereitstellen und weiterhin von einem [öffentlichen vorgelagerten Betreiber](/de/blog/isp-dns-vs-public-resolver/) abhängen.

NLnet Labs beschreibt [Unbound als validierenden, rekursiven DNS-Resolver mit Cache](https://unbound.docs.nlnetlabs.nl/en/latest/use-cases/home-resolver.html). Die Software eignet sich für einen privaten Dienst im Heimnetz. Das offizielle Beispiel verwendet ein bestimmtes Betriebssystem. Passen Sie die Anleitung an die unterstützten Paket- und Dienstwerkzeuge Ihrer Plattform an.

Wählen Sie die Architektur vor der Installation. Vollständige Rekursion kann die direkte Abhängigkeit von einem öffentlichen rekursiven Betreiber verringern. Eine Weiterleitung eignet sich möglicherweise besser für einen kontrollierten lokalen Zugang mit verschlüsselter Verbindung zum gewählten vorgelagerten Resolver.

Keine Architektur verhindert jede Beobachtung von außen. Die [DNS-Datenschutzanalyse der IETF](https://datatracker.ietf.org/doc/html/rfc9076#section-6.2) behandelt die Sichtbarkeit bei autoritativen Servern und rekursiven Resolvern. Ein selbst betriebener Resolver garantiert keine Anonymität.

Dokumentieren Sie die Architektur und die Zuständigkeiten:

| Aufbau | Lokale Verantwortung | Externe Abhängigkeit |
| --- | --- | --- |
| Rekursiver Resolver | Lokaler Cache, Validierung, Dienstzustand, ausgehende Auflösung | Autoritative DNS-Infrastruktur und Internetverbindung |
| Weiterleitender Resolver | Abfragezugang, Zugriffsschutz, Weiterleitungsregeln | Vorgelagerter Resolver und dessen Regeln |
| Router mit Weiterleitung an einen lokalen Resolver | Routereinstellungen und Resolverwartung | Gewählte rekursive oder weiterleitende Architektur |
| Programm für dynamische DNS-Updates | Adressdatensatz eines Hostnamens aktualisieren | Aktualisierungsdienst des dynamischen DNS-Anbieters |

Die letzte Zeile beschreibt eine separate Aufgabe. Die [HTTP-API-Spezifikation von DuckDNS](https://www.duckdns.org/spec.jsp) dokumentiert Adressupdates für eigene DuckDNS-Namen. Eine Namensaktualisierung für einen Heimserver macht den Heimserver nicht zum rekursiven Resolver.

In einem beispielhaften Heimlabor hilft ein dynamischer DNS-Name beim Auffinden einer wechselnden öffentlichen Adresse. Ein privater Unbound-Dienst beantwortet gleichzeitig DNS-Anfragen im Heimnetz. Beide Dienste können nebeneinander laufen. Beide Dienste benötigen eine eigene Konfiguration und Zugriffsentscheidung.

Öffnen Sie keinen eingehenden DNS-Zugang allein wegen eines dynamischen DNS-Namens. Fernzugriff braucht einen geplanten Aufbau. Ein VPN zu einem autorisierten Netzwerk bietet einen anderen Zugangsweg als ein öffentlich erreichbarer rekursiver Dienst.

Notieren Sie Benutzer, Netzwerke, Rechner, Architektur und Zuständigkeit für die Wiederherstellung. Ein persönlicher Versuch benötigt eine andere Verfügbarkeit als ein Resolver für alle Haushaltsgeräte.

## Technitium und Pi-hole bieten unterschiedliche Einrichtungswege

![Pi-hole filtert Client-Anfragen, bevor Unbound erlaubte Namen über autoritatives DNS auflöst.](../../assets/run-your-own-dns-resolver-05-pihole-unbound.jpg)

Wählen Sie die Software nach dem DNS-Abfrageweg. [Technitium DNS Server](https://technitium.com/dns/) kombiniert rekursive Auflösung, autoritative Zonen, Sperrlisten und eine Verwaltungskonsole im Browser. Technitium unterstützt auch verschlüsselte Weiterleitung. Diese Funktionen verlangen weder einen öffentlichen autoritativen Dienst noch eine öffentliche Verwaltungsoberfläche.

Die [Unbound-Anleitung von Pi-hole](https://docs.pi-hole.net/guides/dns/unbound/) beschreibt einen anderen Aufbau. Pi-hole filtert Client-Anfragen und übergibt erlaubte Anfragen an eine lokale Unbound-Instanz zur rekursiven Auflösung. Pi-hole kann auch einen externen vorgelagerten Resolver verwenden. Die Installation von Pi-hole allein beweist keine Rekursion durch Unbound.

| Ausgangsanforderung | Geeignete Option | Zu prüfende Entscheidung |
| --- | --- | --- |
| Rekursiver Cache ohne Filteroberfläche | Unbound | Abfragezugang, Zugriffsregeln, Validierung und Wiederherstellung |
| Filterung mit separater rekursiver Komponente | Pi-hole mit Unbound | Beide Dienste und tatsächlicher vorgelagerter Abfrageweg |
| Rekursion, Filterung und Zonenverwaltung in einer Konsole | Technitium | Aktivierte Rollen, Rekursionsregeln und Verwaltungszugang |
| Hostname für eine wechselnde öffentliche Adresse | DuckDNS | Adressupdates getrennt von der DNS-Auflösung für Clients |

Für einen Testbetrieb von Pi-hole und Unbound auf demselben Rechner verwendet die offizielle Anleitung Unbound unter `127.0.0.1:5335`. Das Feld für benutzerdefinierte vorgelagerte Resolver in Pi-hole schreibt den Endpunkt als `127.0.0.1#5335`. Die Anleitung deaktiviert andere vorgelagerte Resolver, damit Anfragen den vorgesehenen Unbound-Weg verwenden. Die Loopback-Adresse des Rechners bezeichnet keinen separaten Container und keinen zweiten Rechner.

Testen Sie Unbound direkt, bevor Sie den vorgelagerten Resolver in Pi-hole ändern. Testen Sie anschließend über Pi-hole und prüfen Sie Filterung sowie gewöhnliche Auflösung. Verwenden Sie unterschiedliche Ports für beide Dienste. Konfigurieren Sie keine Rückleitung von Unbound an Pi-hole. Eine Rückleitung würde eine Weiterleitungsschleife erzeugen.

Verwenden Sie die beiden DNSSEC-Tests der offiziellen Anleitung. Der absichtlich ungültige Name soll `SERVFAIL` liefern. Der gültige Vergleich soll `NOERROR` liefern. Eine Zeitüberschreitung beweist keine erfolgreiche Validierung. Speichern Sie die genauen Befehle und Ergebnisse mit den Betriebsnotizen.

## Ein privater Testbetrieb beginnt mit unterstützter Installation und begrenztem Zugriff

![Ein privater Testbetrieb begrenzt den Abfragezugang und die zugelassenen Clients.](../../assets/run-your-own-dns-resolver-02-section.jpg)

Wählen Sie einen Rechner, den Sie verfügbar halten und warten können. Dokumentieren Sie Adresse, Betriebssystem, Aktualisierungsmethode und Dienstverwaltung. Prüfen Sie, ob ein anderer lokaler Dienst bereits den vorgesehenen DNS-Port verwendet.

Verwenden Sie die unterstützte Paketquelle der Plattform oder den dokumentierten Build-Prozess des Projekts. Prüfen Sie die installierte Version mit dem Versionsbefehl der Software. Eine Versionsnummer aus einer alten Anleitung beweist keine Übereinstimmung mit Ihrem Rechner.

Lesen Sie das aktuelle [Unbound-Konfigurationshandbuch](https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound.conf.html#description), bevor Sie den Dienst ändern. Konfigurationspfade und Paketvorgaben können abweichen. Sichern Sie die ursprünglichen Dateien und prüfen Sie den Startmechanismus des Pakets.

Begrenzen Sie den Zugriff zunächst auf den Testrechner. Erweitern Sie den Betrieb erst nach einem erfolgreichen lokalen Test auf das Netzwerk. Übernehmen Sie keine umfassenden Empfangsadressen oder Zugriffsregeln ohne begründete Entscheidung aus einem Beispiel.

Das Konfigurationshandbuch unterscheidet Empfangsschnittstellen und Zugriffsregeln. Eine Empfangsschnittstelle legt fest, wo der Dienst Anfragen annimmt. Eine Zugriffsregel legt fest, welche Clients den Dienst verwenden dürfen. Prüfen Sie beide Einstellungen sowie die Firewallregeln auf Rechner und Netzwerk.

Verwenden Sie folgende Prüfschritte:

1. Bestimmen Sie den vorgesehenen Rechner und die zuständige Person.
2. Dokumentieren Sie den aktuellen DNS-Weg und die Rückkehreinstellungen.
3. Installieren Sie die Software aus einer unterstützten Quelle.
4. Prüfen Sie die installierte Version und den Dienstzustand.
5. Begrenzen Sie den Abfragezugang auf den vorgesehenen Testumfang.
6. Prüfen Sie Client-Zugriffsregeln und Firewalls.
7. Prüfen Sie die Konfiguration vor dem Neustart.
8. Testen Sie eine direkte Anfrage an den lokalen Resolver.

Unbound bietet [`unbound-checkconf`](https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound-checkconf.html) zur Prüfung von Konfigurationsdateien. Verwenden Sie den tatsächlichen Konfigurationspfad. Eine Syntaxprüfung bestätigt weder einen funktionierenden vorgelagerten Abfrageweg noch passende Zugriffsregeln.

Testen Sie den Dienst direkt, bevor Sie den Systemstandard ändern. Unsere [Anleitung für nslookup mit einem bestimmten DNS-Server](/de/blog/nslookup-specific-dns-server/) erklärt den grundlegenden Vergleich. Halten Sie den bisherigen Resolver verfügbar, bis der Testbetrieb gewöhnliche Namen zuverlässig beantwortet.

Prüfen Sie bei Startfehlern das Dienstprotokoll und die genaue Fehlermeldung. Ein Portkonflikt, ein Dateiberechtigungsfehler und ein Konfigurationsfehler erfordern andere Korrekturen als eine fehlgeschlagene vorgelagerte Auflösung. Ändern Sie jeweils nur eine relevante Einstellung.

Deaktivieren Sie nicht sämtliche Schutzfunktionen, um einen Fehler zu unterdrücken. Bewahren Sie die fehlgeschlagene Anfrage, den Antwortcode und den Protokollkontext auf. Eine gezielte Diagnose hält die spätere Konfiguration verständlich.

## Validierung und Datenschutz verlangen getrennte Prüfungen

![DNSSEC-Validierung und Transportverschlüsselung erfordern getrennte Prüfungen.](../../assets/run-your-own-dns-resolver-03-section.jpg)

DNSSEC-Validierung prüft die Authentizität von DNS-Daten anhand der jeweiligen Vertrauenskette. DNSSEC verschlüsselt den Abfrageweg nicht. Behandeln Sie Validierung und Transportverschlüsselung als getrennte Anforderungen.

Befolgen Sie bei Unbound die Hinweise des installierten Pakets zu Vertrauensankern und Systemzeit. Prüfen Sie das tatsächliche Validierungsverhalten mit einem dokumentierten Test für Ihren Aufbau. Ein laufender Prozess beweist keine funktionierende Validierung.

Bestimmen Sie bei einer Weiterleitung den genauen vorgelagerten Dienst. Dokumentieren Sie Anbieteradressen, Transport, Anforderungen an die Zertifikatsprüfung und Datenschutzrichtlinie. Eine verschlüsselte Einstellung ohne authentifizierte Endpunktprüfung ergibt keinen vollständigen Aufbau.

Die [Unbound-Konfiguration für Weiterleitungen](https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound.conf.html#forward-zone-options) dokumentiert `forward-tls-upstream` und die Konfiguration vertrauenswürdiger Zertifikate. Lesen Sie die aktuellen Optionsbeschreibungen zusammen. Die Aktivierung einer einzelnen Option garantiert keinen authentifizierten TLS-Transport für alle übrigen Abfragewege.

Unsere [Anleitung zu DNS over HTTPS und DNS over TLS](/de/blog/dns-over-https-vs-dns-over-tls/) erklärt den Transportunterschied. Wählen Sie zuerst die Architektur und prüfen Sie danach den tatsächlichen Datenverkehr. Ein Browser oder VPN kann einen anderen Resolverweg als die Systemeinstellung verwenden.

Vergleichen Sie mindestens vier Ergebnisse im Testbetrieb:

| Prüfung | Aufzubewahrender Nachweis |
| --- | --- |
| Gewöhnliche öffentliche Antwort | Abfragename, Datensatztyp, Antwortcode und Antwort |
| Wiederholte Anfrage | Beobachtetes Cacheverhalten ohne Geschwindigkeitsversprechen |
| Validierungstest | Dokumentierter Test und tatsächliches Ergebnis |
| Unterbrechung des vorgelagerten Dienstes | Entstandener Fehler und erfolgreiche Rückkehr zum bisherigen Aufbau |

Ein lokaler Cache kann wiederholte Anfragen unterstützen. Das Ergebnis hängt von Abfragemustern und Cachezustand ab. Versprechen Sie keine schnellere Internetnutzung ohne Messung sinnvoller Aufgaben. Ein leerer Cache und ein gefüllter Cache ergeben unterschiedliche Vergleichsbedingungen.

Prüfen Sie Protokolle als Teil des Datenschutzkonzepts. Ein selbst betriebener Dienst kann bei umfassender Protokollierung einen detaillierten lokalen Abfrageverlauf erzeugen. Legen Sie Zweck und Aufbewahrung für gespeicherte Protokolle fest.

Beschränken Sie neben dem Abfragezugang auch die Verwaltungsoberfläche. Ein privater Abfragedienst braucht sichere Verwaltung. Halten Sie Konfigurationssicherungen und Betriebsanweisungen verfügbar, ohne Geheimnisse offenzulegen.

Dokumentieren Sie einen beispielhaften Weiterleitungstest präzise: „Der Laptop erreicht den lokalen Resolver. Der lokale Resolver leitet an den gewählten Betreiber weiter.“ Behaupten Sie keinen Datenschutz für sämtliche Geräteanfragen, wenn der tatsächliche Testumfang die Aussage nicht belegt.

## Der Netzwerkbetrieb braucht Verfügbarkeit und Schutz vor Missbrauch

![Ein Netzwerkresolver benötigt Wartung und begrenzte Zugriffsrechte.](../../assets/run-your-own-dns-resolver-04-section.jpg)

Ein Resolver wird zur Infrastruktur, sobald andere Geräte vom Resolver abhängen. Ein schlafender Laptop, eine wechselnde lokale Adresse oder ein ungeplanter Neustart kann anschließend die Namensauflösung im gesamten Netzwerk stören.

Geben Sie dem Rechner über die unterstützte Netzwerkkonfiguration eine stabile, dokumentierte Netzwerkadresse. Testen Sie den Resolver nach einem Neustart. Prüfen Sie den automatischen Dienststart und die Verfügbarkeit erforderlicher Netzwerkverbindungen.

Erweitern Sie den Client-Zugriff nur auf vorgesehene Netzwerke. Die [IETF-Empfehlungen für rekursive Server](https://datatracker.ietf.org/doc/html/rfc5358#section-4) empfehlen eingeschränkte Rekursion und nach Möglichkeit getrennte rekursive und autoritative Rollen. Ein offener rekursiver Resolver kann Reflexionsangriffe unterstützen.

Prüfen Sie eingehende Erreichbarkeit an der passenden Netzwerkgrenze. Eine erfolgreiche lokale Anfrage beweist lokale Erreichbarkeit, jedoch keinen fehlenden Internetzugang. Prüfen Sie Portweiterleitungen des Routers, IPv6-Firewallregeln und gegebenenfalls die Cloud-Firewall eines entfernten Rechners.

Verwenden Sie keine uneingeschränkte Freigabe als Abkürzung für einen problematischen Client. Ermitteln Sie den Adressbereich des Clients und den vorgesehenen Zugangsweg. Gewähren Sie nur den Zugriff, den der Betriebsplan verlangt.

Führen Sie die Umstellung kontrolliert durch:

1. Testen Sie einen Client mit manuellen Einstellungen.
2. Testen Sie erforderliche öffentliche und private Namen.
3. Prüfen Sie die Wiederherstellung nach einem Rechnerneustart.
4. Prüfen Sie Zugriffsgrenzen für Abfragen und Verwaltung.
5. Dokumentieren Sie die Wiederherstellung bei einem Ausfall.
6. Ändern Sie anschließend die vom Netzwerk verteilten DNS-Einstellungen.
7. Prüfen Sie repräsentative Geräte nach Erneuerung oder Wiederverbindung.
8. Prüfen Sie nach der Umstellung Protokolle und Fehler.

Beachten Sie bei einer zweiten DNS-Adresse das Auswahlverhalten der Clients. Eine zweite Adresse dient nicht immer nur als ungenutzte Reserve. Unsere [Anleitung zu primärem und sekundärem DNS](/de/blog/primary-secondary-dns/) erklärt die irreführende Bezeichnung.

Wählen Sie eine Ausweichlösung, die zu Ihren Zielen passt. Ein öffentlicher Ersatzresolver kann Verfügbarkeit herstellen und gleichzeitig lokale Filter oder Datenschutzerwartungen umgehen. Ein zweiter lokaler Resolver erfordert zusätzliche Aktualisierungen. Dokumentieren Sie die Abwägung und die Abhängigkeit.

Erstellen Sie einen kurzen Wartungsplan für Softwareaktualisierungen, Konfigurationssicherungen, Zugriffsprüfungen und Wiederherstellungstests. Prüfen Sie den Aufbau nach einem Routerwechsel, einer Änderung des Adressplans oder einer VPN-Änderung erneut.

Betreiben Sie einen eigenen Resolver, wenn die betriebliche Kontrolle den Wartungsaufwand rechtfertigt. Trennen Sie Rekursion, Weiterleitung und dynamisches DNS. Prüfen Sie den privaten Testbetrieb, erhalten Sie Zugriffsgrenzen und behandeln Sie Wiederherstellung als Teil des Dienstes.

## Diese Quellen stützen den Artikel

Die Quellenprüfung erfolgte am 21. Oktober 2026. Der Artikel beschreibt einen Planungsablauf und keine universell kopierbare Konfiguration.

- [NLnet Labs: Resolver for Home Networks](https://unbound.docs.nlnetlabs.nl/en/latest/use-cases/home-resolver.html). Die Anleitung beschreibt Unbound im Heimnetz.
- [Unbound-Konfigurationshandbuch](https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound.conf.html). Das Handbuch definiert Empfangsschnittstellen, Zugriffsregeln, Weiterleitung und TLS-Optionen.
- [Unbound-Konfigurationsprüfung](https://unbound.docs.nlnetlabs.nl/en/latest/manpages/unbound-checkconf.html). Der Befehl prüft eine Konfigurationsdatei.
- [Technitium DNS Server](https://technitium.com/dns/). Das Projekt beschreibt Rekursion, autoritative Zonen, Filterung und verschlüsselte Weiterleitung.
- [Pi-hole: Unbound-Anleitung](https://docs.pi-hole.net/guides/dns/unbound/). Die Anleitung dokumentiert den lokalen vorgelagerten Endpunkt, getrennte Ports und Validierungstests.
- [DuckDNS: HTTP-API-Spezifikation](https://www.duckdns.org/spec.jsp). Die Spezifikation dokumentiert dynamische Adressupdates.
- [RFC 5358, Abschnitt 4](https://datatracker.ietf.org/doc/html/rfc5358#section-4). Die Empfehlungen behandeln eingeschränkte rekursive Dienste.
- [RFC 9076, Abschnitt 6](https://datatracker.ietf.org/doc/html/rfc9076#section-6). Die Analyse unterscheidet die Sichtbarkeit bei Resolvern und autoritativen Servern.
