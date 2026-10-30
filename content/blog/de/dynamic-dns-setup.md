---
title: "Dynamisches DNS hält einen Hostnamen mit einer wechselnden Adresse verbunden"
description: "Konfigurieren Sie ddclient für wechselnde IPv4-Adressen. Schützen Sie Zugangsdaten und prüfen Sie DNS und Netzwerkzugriff getrennt."
date: '2026-10-22'
language: de
tags: ['dns', 'networking', 'domains', 'guide']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-basics
keywords: ['dynamisches DNS', 'DDNS einrichten', 'Dynamic-DNS-Client', 'DDNS eigene Domain', 'dynamische IP-Adresse', 'ddclient', 'Cloudflare dynamisches DNS', 'DDNS CGNAT', 'DNS-Aktualisierung', 'DDNS-Sicherheit', 'DDNS-Fehlersuche']
ogImage: ../../assets/dynamic-dns-setup-og.jpg
relatedArticles:
  - /de/blog/dhcp-vs-dns/
  - /de/blog/run-your-own-dns-resolver/
  - /de/blog/primary-secondary-dns/
  - /de/blog/change-domain-nameservers/
  - /de/blog/ipv6-and-dns/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-investor-field-guide/
  - /de/series/domain-apocalypse/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/dns-record-types/
  - /de/glossary/ttl/
  - /de/glossary/ip-address/
  - /de/glossary/nameserver/
---

**Dynamisches DNS aktualisiert einen DNS-Eintrag, wenn sich eine Adresse ändert.** Ein Client ermittelt die Adresse und sendet eine autorisierte Aktualisierung an den DNS-Anbieter. Cloudflare dokumentiert einen API-Ansatz und das bestehende Programm `ddclient`. [Die Anleitung beschreibt beide Möglichkeiten](#cloudflare-beschreibt-möglichkeiten-zur-adressaktualisierung).

Ein Heimserver kann denselben Hostnamen behalten, während der Internetanbieter die Anschlussadresse ändert. Dieser Vorteil beweist nicht, dass der Server Verbindungen von außen annimmt. Planen Sie DNS-Aktualisierungen und Netzwerkzugriff als getrennte Aufgaben.

## Ein Aktualisierungsclient ändert Einträge statt Namen aufzulösen

![Eine Adressermittlung sendet über einen Client eine autorisierte Aktualisierung an DNS.](../../assets/dynamic-dns-setup-01-update.jpg)

Ein [DNS-Resolver (Rekursiver Resolver)](/de/glossary/dns-resolver/) beantwortet Namensabfragen. Ein DDNS-Client ändert die Einträge, die Namensabfragen zurückliefern können. Der Betrieb eines Resolvers erzeugt nicht automatisch einen Dienst zur Adressaktualisierung. Der [Vergleich von DHCP und DNS](/de/blog/dhcp-vs-dns/) erklärt die separate Aufgabe der Clientkonfiguration.

DDNS bedeutet auch nicht, dass jeder Anbieter dasselbe Aktualisierungsprotokoll verwendet. RFC 2136 definiert die Operation DNS UPDATE zum Hinzufügen oder Löschen von Einträgen. Ein gehosteter DNS-Anbieter kann stattdessen eine HTTPS-API anbieten. [Der Standard definiert DNS UPDATE](#der-standard-definiert-dns-update), während [Cloudflare API-gestützte Aktualisierungen beschreibt](#cloudflare-beschreibt-möglichkeiten-zur-adressaktualisierung). Verwenden Sie das Verfahren, das der autoritative Anbieter und der Client unterstützen.

Prüfen Sie vorhandene Software, bevor Sie ein Skript schreiben. Die Dokumentation von `ddclient` unterscheidet allgemeine Einstellungen, Adressermittlung und Anbieterprotokolle. Diese Einstellungen beantworten drei praktische Fragen: Wie läuft der Client? Woher stammt die Adresse? Welcher Dienst erhält die Aktualisierungen? [Das Projekt erklärt sein Konfigurationsmodell](#ddclient-trennt-die-adressermittlung-von-anbieteraktualisierungen).

Prüfen Sie bei einem eigenen Hostnamen wie `home.example.com`, ob der Client den Anbieter der betreffenden Zone aktualisieren kann. Der Domainkauf bei einem Registrar beweist nicht, dass der Registrar auch das autoritative DNS betreibt. Prüfen Sie die [Nameserver (NS Record)](/de/glossary/nameserver/) der Domain, bevor Sie das Aktualisierungsverfahren auswählen.

## Eine korrekte DNS-Antwort beweist keinen Netzwerkzugriff

![Eine DNS-Prüfung und eine gesperrte Netzwerkzugangsprüfung bleiben getrennt.](../../assets/dynamic-dns-setup-02-reachability.jpg)

Ermitteln Sie die Adresse, die externe Clients erreichen müssen. Die lokale Geräteadresse, die WAN-Adresse des Routers und eine von außen beobachtete Adresse können voneinander abweichen. Carrier-Grade-NAT kann eine weitere Übersetzungsebene im Netz des Anbieters hinzufügen. RFC 6598 reserviert `100.64.0.0/10` als gemeinsamen Adressraum für solche Netze. [Der Standard beschreibt Zuweisung und Verwendung](#der-standard-beschreibt-den-gemeinsamen-adressraum).

Die Veröffentlichung einer Adresse erzeugt keine Portzuordnung durch das NAT des Anbieters. Klären Sie eingehende Verbindungen mit dem Internetanbieter, bevor Sie öffentlichen Zugriff zusagen. Eine Routeradresse im gemeinsamen Adressraum erfordert weitere Prüfung. Eine Adresse außerhalb dieses Blocks allein beweist keine Erreichbarkeit von außen.

Entscheiden Sie vor dem Öffnen eines Netzwerkpfads, wer den Dienst nutzen darf. Ein privater Verwaltungsdienst braucht einen authentifizierten Zugangsweg. DNS-Einträge benennen Ziele. DNS-Einträge gewähren und erzwingen keine Anwendungsberechtigung. Nehmen Sie Firewallregeln und Anwendungsauthentifizierung in die Bereitstellungsprüfung auf.

Auch die [TTL (Time to Live)](/de/glossary/ttl/) beeinflusst Beobachtungen. Eine autoritative Aktualisierung und eine zwischengespeicherte Antwort können voneinander abweichen, solange Zwischenspeicher ältere Daten behalten. Eine verkürzte TTL löscht keine Antwort, die bereits mit der vorherigen TTL im Zwischenspeicher liegt. Cloudflare erklärt die TTL als Steuerung der Zwischenspeicherung und mögliche Verzögerungen durch lokale Zwischenspeicher. [Die TTL-Dokumentation erläutert den Unterschied](#cloudflare-erklärt-zwischenspeicherung-und-proxy-antworten).

Bei aktiviertem Cloudflare-Proxy liefern Adressabfragen Cloudflare-Adressen statt der eingetragenen Ursprungsadresse. Prüfen Sie die Ursprungsadresse anhand der Eintragsdaten beim Anbieter. Eine Proxyadresse beweist keinen Fehler des DDNS-Clients. [Cloudflare unterscheidet Proxy- und reine DNS-Einträge](#cloudflare-erklärt-proxy-antworten).

## Eine kontrollierte Einrichtung prüft Aktualisierungen und Zugriff getrennt

1. Ermitteln Sie den autoritativen Anbieter für den vorgesehenen Hostnamen.
2. Prüfen Sie die Anbieterunterstützung und Adressermittlung des Clients.
3. Erstellen Sie Zugangsdaten mit dem kleinstmöglichen unterstützten Aktualisierungsumfang.
4. Bewahren Sie die Zugangsdaten geschützt auf und gewähren Sie nur dem Aktualisierungsdienst Zugriff.
5. Konfigurieren Sie den Hostnamen und den vorgesehenen IPv4- oder IPv6-Eintragstyp.
6. Führen Sie eine Aktualisierung aus und prüfen Sie das Ergebnis beim Anbieter.
7. Vergleichen Sie autoritative Antworten mit zwischengespeicherten Resolverantworten.
8. Prüfen Sie den vorgesehenen Dienst von einem externen Netz aus.
9. Prüfen Sie, dass unberechtigte Personen den Dienst nicht nutzen können.

Ein konkretes IPv4-Beispiel setzt voraus, dass Cloudflare Ihre Zone bereits betreibt und Sie eine aktuelle `ddclient`-Version verwenden. Erstellen Sie zuerst den vorgesehenen A-Eintrag. Das [Cloudflare-Beispiel des Projekts](https://github.com/ddclient/ddclient/blob/main/ddclient.conf.in#L168-L175) verlangt ein Token mit `Zone:DNS:Edit` und `Zone:Zone:Read`. Beschränken Sie die Ressourcen des Tokens auf die vorgesehene Zone. Die folgende Konfiguration verbindet diese Anbietereinstellungen mit der dokumentierten [IPv4-Ermittlung und Nutzung von Umgebungsvariablen](https://ddclient.net/#using-environment-variables):

```text
ssl=yes
usev4=webv4,webv4=ipify-ipv4
usev6=disabled
protocol=cloudflare
zone=example.com
password_env=CLOUDFLARE_DDNS_TOKEN
home.example.com
```

Ersetzen Sie `example.com` und `home.example.com` durch Namen, die Sie verwalten. Verwenden Sie eine Version mit der dokumentierten `_env`-Unterstützung. Speichern Sie die Konfiguration ohne Geheimnisse im Konfigurationspfad des installierten Pakets, normalerweise `/etc/ddclient/ddclient.conf`. Lassen Sie Ihren Dienst oder Ihre Geheimnisverwaltung `CLOUDFLARE_DDNS_TOKEN` ausschließlich dem Aktualisierungsprozess übergeben. Setzen Sie den Tokenwert weder in das Konfigurationsbeispiel noch in ein Shellargument ein.

Starten Sie `ddclient -daemon 0 -noquiet` über diesen autorisierten Aufruf für eine erste Aktualisierung. Der Daemonwert von null Sekunden deaktiviert die Hintergrundschleife für diesen einzelnen Lauf. Prüfen Sie die Eintragsdaten beim Anbieter und bestätigen Sie die ermittelte IPv4-Adresse. Aktivieren Sie anschließend den Dienst oder Zeitplaner des installierten Pakets und bestätigen Sie weitere Prüfungen. Wählen Sie das Abfrageintervall anhand der Paketanleitung. Diese Konfiguration richtet keine AAAA-Aktualisierung ein und löst kein Carrier-Grade-NAT.

Cloudflare erlaubt die Beschränkung von Tokenberechtigungen und Ressourcen. Ein auf eine Zone beschränktes Token begrenzt Schreibzugriffe nicht zwangsläufig auf einen Hostnamen. Prüfen Sie die verfügbaren Einschränkungen beim Anbieter. Setzen Sie keine Isolation einzelner Einträge voraus. Stellen Sie ein Token niemals in ein öffentliches Repository, einen Screenshot oder einen geteilten Befehl. [Cloudflare dokumentiert Berechtigungen und Ressourcenbeschränkungen](#cloudflare-beschreibt-tokenberechtigungen).

Halten Sie Aktualisierungsprotokolle frei von Zugangsdaten. Erfassen Sie Zielhostname, Adressfamilie, Ergebnis und Zeitpunkt der letzten erfolgreichen Aktualisierung samt Zeitzone. Behandeln Sie IPv4 und IPv6 getrennt. Eine IPv4-Aktualisierung bestätigt nicht den IPv6-Pfad.

Prüfen Sie bei der Fehlersuche jede Grenze: Adressermittlung, Aktualisierungsberechtigung, autoritativer Eintrag, zwischengespeicherte Antwort und Dienstzugriff. Eine erfolgreiche Aktualisierungsanfrage beweist weder die sofortige Erneuerung von Zwischenspeichern noch die Verfügbarkeit der Anwendung.

Fragen Sie nach einer Erfolgsmeldung des Aktualisierungsprogramms den genauen Hostnamen mit dem Typ A oder AAAA in [Namefis DNS-Abfrage](https://namefi.io/domain-tools/dns) ab. Vergleichen Sie die Antwort des ausgewählten Resolvers mit der vorgesehenen öffentlichen Adresse. Diese Beobachtung führt das Aktualisierungsprogramm nicht aus und beweist nicht, dass die Anwendung hinter der Adresse Verbindungen annimmt.

## Diese Quellen belegen die Einrichtungsentscheidungen

### Cloudflare beschreibt Möglichkeiten zur Adressaktualisierung

Cloudflare — [DNS-Einträge dynamisch aktualisieren](https://developers.cloudflare.com/dns/manage-dns-records/how-to/managing-dynamic-ip-addresses/#cloudflare-api), „Cloudflare API“ und „ddclient“. Abgerufen am 2026-10-22.

### Der Standard definiert DNS UPDATE

IETF — [RFC 2136](https://www.rfc-editor.org/rfc/rfc2136.html#section-1), Zusammenfassung und Abschnitt 8 zur Sicherheit von Aktualisierungen. Abgerufen am 2026-10-22.

### ddclient trennt die Adressermittlung von Anbieteraktualisierungen

ddclient-Projekt — [Einführung in die Konfiguration](https://ddclient.net/#configuration), Umgebungsvariablen und [Cloudflare-Konfigurationsbeispiel](https://github.com/ddclient/ddclient/blob/main/ddclient.conf.in#L168-L175). Abgerufen am 2026-10-22.

### Der Standard beschreibt den gemeinsamen Adressraum

IETF — [RFC 6598](https://www.rfc-editor.org/rfc/rfc6598.html#section-1), Abschnitte 1, 4 und 7. Abgerufen am 2026-10-22.

### Cloudflare erklärt Zwischenspeicherung und Proxy-Antworten

Cloudflare — [Time to Live](https://developers.cloudflare.com/dns/manage-dns-records/reference/ttl/#proxied-records), Einführung und „Proxied records“. Abgerufen am 2026-10-22.

### Cloudflare erklärt Proxy-Antworten

Cloudflare — [Proxystatus](https://developers.cloudflare.com/dns/proxy-status/#example), Beispiele für Proxy- und reine DNS-Antworten. Abgerufen am 2026-10-22.

### Cloudflare beschreibt Tokenberechtigungen

Cloudflare — [API-Token erstellen](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/#create-an-api-token), Berechtigungen und Ressourcenauswahl. Abgerufen am 2026-10-22.
