---
title: 'IPv6-DNS nutzt einen anderen Transport als die Adresse in der Antwort'
description: 'Finden Sie IPv6-DNS-Serveradressen und prüfen Sie beide DNS-Verbindungen. Unterscheiden Sie Transport, AAAA-Einträge und Website-Verbindungen.'
date: '2026-10-21'
language: de
tags: ['dns', 'networking', 'guide']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-basics
keywords: ['IPv6 DNS', 'IPv6 DNS Server', 'IPv6 DNS Adresse', 'Google DNS IPv6', 'Cloudflare DNS IPv6', 'Quad9 IPv6', 'DNS über IPv6', 'Dual-Stack-DNS', 'dig IPv6', 'IPv6 DNS Fehlerbehebung', 'A und AAAA Abfragen', 'DNS-Transport']
ogImage: ../../assets/ipv6-and-dns-og.jpg
relatedArticles:
  - /de/blog/aaaa-record-explained/
  - /de/blog/choose-public-dns-resolver/
  - /de/blog/dns-over-https-vs-dns-over-tls/
  - /de/blog/run-your-own-dns-resolver/
  - /de/blog/nslookup-specific-dns-server/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/dns-resolver/
  - /de/glossary/dns-record-types/
  - /de/glossary/nameserver/
  - /de/glossary/ttl/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-investor-field-guide/
  - /de/series/domain-apocalypse/
---

**Eine IPv6-DNS-Serveradresse bezeichnet einen Resolver, den ein Client über IPv6 erreichen kann.** Die Adresse beschränkt den Resolver nicht auf IPv6-Antworten. Ein Client kann A- oder AAAA-Einträge über IPv4 oder IPv6 abfragen. [RFC 3596 trennt ausdrücklich den Abfragetransport vom Inhalt des Eintrags](https://www.rfc-editor.org/rfc/rfc3596.html#section-1).

Der Unterschied zeigt sich an zwei Befehlen. `dig -6 @2001:4860:4860::8888 example.com. A` fragt IPv4-Adresseinträge über eine IPv6-Verbindung zum Resolver ab. `dig -4 @8.8.8.8 example.com. AAAA` fragt dagegen IPv6-Adresseinträge über eine IPv4-Verbindung ab. Die Befehle sind Beispiele und keine dokumentierten Testergebnisse.

Dieser Leitfaden hilft bei der Auswahl einer IPv6-Resolveradresse und bei der Diagnose einer fehlerhaften DNS-Verbindung. Der [Leitfaden zu AAAA-Einträgen](/de/blog/aaaa-record-explained/) erklärt dagegen, wie Sie das IPv6-Ziel Ihrer Website veröffentlichen.

## Die Resolververbindung und der abgefragte Eintrag beantworten unterschiedliche Fragen

![IPv4- und IPv6-Transport lassen sich jeweils mit A- und AAAA-Abfragen kombinieren.](../../assets/ipv6-and-dns-01-independent-choices.jpg)

Bei der Diagnose spielen drei Entscheidungen eine Rolle. Der Client wählt eine Verbindung zu einem [DNS-Resolver (Rekursiver Resolver)](/de/glossary/dns-resolver/). Die Abfrage legt einen der [DNS-Eintragstypen (A, AAAA, CNAME, MX, TXT)](/de/glossary/dns-record-types/) fest. Anschließend stellt eine Anwendung eine eigene Verbindung zum Ziel her.

| Entscheidung | Beispiel | Aussage der Entscheidung |
| --- | --- | --- |
| Resolvertransport | IPv6 zum Google-Resolver | Über welche Verbindung die DNS-Abfrage den Resolver erreicht |
| Abgefragter Eintrag | AAAA für `example.com` | Welche Adresseinträge der Client anfordert |
| Anwendungsverbindung | Eine Browserverbindung zur Website | Ob die Anwendung das Ziel erreicht |

Eine AAAA-Antwort allein beweist weder einen IPv6-DNS-Transport noch einen funktionierenden IPv6-Zugriff auf die Website. Ebenso bedeutet eine A-Antwort über IPv6 nicht, dass die DNS-Verbindung IPv4 verwendet hat. Halten Sie die Verbindung und die zurückgegebene Adresse bei der Ergebnisaufzeichnung getrennt.

Die Clientverbindung legt auch nicht jede weitere Verbindung fest. Ein rekursiver Resolver kann autoritative Server über unterschiedliche verfügbare Transportwege erreichen. [RFC 3901 beschreibt, wie ein unerreichbarer Transportweg innerhalb der Verweiskette die Auflösung verhindert](https://www.rfc-editor.org/rfc/rfc3901.html#section-1). Eine IPv6-Verbindung zum rekursiven Resolver beweist deshalb keine durchgehend über IPv6 laufende Auflösung.

IPv6 verschlüsselt DNS außerdem nicht automatisch. Herkömmliches DNS über UDP oder TCP bietet keine Transportverschlüsselung. [Google dokumentiert DoH und DoT als gesonderte verschlüsselte Transportverfahren](https://developers.google.com/speed/public-dns/docs/secure-transports). Die `dig`-Beispiele in diesem Artikel aktivieren keines der beiden Verfahren.

## Öffentliche Resolverbetreiber veröffentlichen gesonderte IPv6-Adressen

![IPv4- und IPv6-Adressen bieten zwei Zugänge zu demselben DNS-Dienst.](../../assets/ipv6-and-dns-02-resolver-endpoints.jpg)

Die folgenden Adressen stammen aus den Betreiberunterlagen. Die Prüfung erfolgte am 21. Oktober 2026. Die Tabelle bezeichnet konkrete Dienstvarianten. Die Tabelle bewertet keine Geschwindigkeit und garantiert keine Erreichbarkeit aus einem bestimmten Netz.

| Dienst | IPv6-Resolveradressen | Zugehörige IPv4-Adressen |
| --- | --- | --- |
| [Google Public DNS](https://developers.google.com/speed/public-dns/docs/using#google_public_dns_ip_addresses) | `2001:4860:4860::8888`, `2001:4860:4860::8844` | `8.8.8.8`, `8.8.4.4` |
| [Cloudflare-Standarddienst ohne Inhaltsfilter](https://developers.cloudflare.com/1.1.1.1/ip-addresses/) | `2606:4700:4700::1111`, `2606:4700:4700::1001` | `1.1.1.1`, `1.0.0.1` |
| [Quad9 Secure mit Schutz vor schädlichen Domains](https://docs.quad9.net/services/#9999-secure) | `2620:fe::fe`, `2620:fe::9` | `9.9.9.9`, `149.112.112.112` |

Übernehmen Sie beide IPv6-Adressen aus der offiziellen Anleitung des gewählten Dienstes. Behalten Sie die vollständige Adresse einschließlich aller Doppelpunkte bei. Cloudflare und Quad9 veröffentlichen weitere Varianten mit anderen Adressen und Richtlinien. Eine Adresse aus der benachbarten Tabellenzeile kann einen anderen Dienst auswählen.

Wählen Sie zuerst den Betreiber und die gewünschte Richtlinie. Ändern Sie erst danach die Einstellungen. Der [Leitfaden für öffentliche Resolver](/de/blog/choose-public-dns-resolver/) vergleicht Datenschutz, Filter, Validierung und Wiederherstellung. Eine IPv6-Adresse ersetzt diese Entscheidung nicht.

Sichern Sie vor einer Geräteänderung die bisherige automatische oder manuelle Konfiguration. [Google empfiehlt, die bisherigen DNS-Einstellungen aufzubewahren](https://developers.google.com/speed/public-dns/docs/using#important_before_you_start). Folgen Sie der aktuellen Geräteanleitung, denn Eingabefelder und Geltungsbereich unterscheiden sich je nach Plattform.

Testen Sie direkte Abfragen, bevor Sie den Standardresolver des Netzes ändern. Ein öffentlicher IPv6-Resolver benötigt einen nutzbaren IPv6-Verbindungsweg vom Testgerät. Die Eingabe einer Resolveradresse stellt keine fehlende IPv6-Konnektivität her. Erhalten Sie in einem verwalteten Netz die benötigte interne Namensauflösung und beziehen Sie die Netzwerkadministration ein.

## Vergleichsabfragen grenzen Fehler in der Resolververbindung ein

![Eine erfolgreiche DNS-Antwort und eine erfolgreiche Website-Verbindung benötigen getrennte Prüfungen.](../../assets/ipv6-and-dns-03-diagnose-path.jpg)

Beginnen Sie mit einem Anbieter und einem öffentlichen Hostnamen. Behalten Sie beim Transportvergleich den Hostnamen und den Abfragetyp bei. Das [BIND-Handbuch für dig dokumentiert Serverauswahl, Eintragstypen sowie die Optionen `-4` und `-6`](https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility).

Führen Sie zuerst `dig -4 @8.8.8.8 example.com. A` aus. Führen Sie danach `dig -6 @2001:4860:4860::8888 example.com. A` aus. Wiederholen Sie beide Abfragen mit `AAAA` anstelle von `A`. Jeder Befehl wählt direkt einen Resolver, ohne gespeicherte DNS-Einstellungen zu ändern. Die vier Abfragen prüfen Transport und Eintragstyp unabhängig voneinander.

Bewahren Sie die vollständige Ausgabe auf. Notieren Sie Befehl, Zeitpunkt, Antwortstatus, Antwortabschnitt und angegebenen Server. Verzichten Sie bei der ersten Diagnose auf `+short`, denn die Kurzansicht lässt Kontext weg.

Die folgende Tabelle zeigt, welchen Abschnitt Sie als Nächstes untersuchen sollten. Die Hinweise nennen mögliche Prüfrichtungen und keine bestätigten Ursachen.

| Beobachtung | Nächste Untersuchung |
| --- | --- |
| IPv4 antwortet, IPv6 überschreitet bei beiden Eintragstypen die Wartezeit | IPv6-Route, Resolveradresse und Netzwerkzugriffsregeln prüfen |
| Beide Transportwege liefern eine AAAA-Antwort, aber die Website scheitert | Website-Verbindung getrennt prüfen |
| Der Resolver liefert `NXDOMAIN` | Den genauen abgefragten Namen prüfen |
| Eine Antwort enthält den angeforderten Eintragstyp nicht | Vollständige Antwort und autoritative Konfiguration prüfen |
| Direkte Abfragen funktionieren, die Anwendung scheitert | Den tatsächlichen Resolverweg der Anwendung prüfen |

Eine Zeitüberschreitung unterscheidet sich von einer negativen DNS-Antwort. `NXDOMAIN` bezeichnet einen Namensfehler. Eine Antwort kann auch einen vorhandenen Namen ohne Daten für den angefragten Typ melden. [RFC 2308 unterscheidet Namensfehler von Antworten ohne den angefragten Datentyp](https://www.rfc-editor.org/rfc/rfc2308.html#section-2). Eine fehlende AAAA-Antwort belegt keine fehlerhafte IPv6-Verbindung zum Resolver.

Prüfen Sie bei einer IPv6-Zeitüberschreitung die IPv6-Anbindung des Geräts und die Route zur genauen Resolveradresse. Prüfen Sie relevante Firewall- oder VPN-Regeln gemeinsam mit dem Netzwerkbetreiber. Veröffentlichen oder löschen Sie keine Website-AAAA-Einträge, um eine Verbindung zwischen Client und Resolver zu reparieren.

Wenn direkte Abfragen funktionieren und ein Browser scheitert, ermitteln Sie den konfigurierten Browserresolver und den Modus für verschlüsseltes DNS. Der direkte Befehl belegt nur den Verbindungsweg des getesteten Befehls. Der [Leitfaden zu DoH und DoT](/de/blog/dns-over-https-vs-dns-over-tls/) erklärt den Anwendungsbereich und die Prüfung von Ausweichverbindungen.

Wenn beide DNS-Verbindungen funktionieren und die Website scheitert, setzen Sie die getrennten Anwendungstests aus dem [Leitfaden zu AAAA-Einträgen](/de/blog/aaaa-record-explained/) fort. Eine korrekte DNS-Antwort konfiguriert weder den Website-Listener noch Zertifikate oder Routing.

Unterscheiden Sie bei einem [selbst betriebenen Resolver](/de/blog/run-your-own-dns-resolver/) den IPv6-Listener für Clients von der Verbindung zu vorgelagerten Servern. Ein lokaler Listener kann zwischengespeicherte Antworten liefern, obwohl ein Problem mit vorgelagerten Verbindungen besteht. Bewahren Sie die Abfrageergebnisse auf. Prüfen Sie die Betriebskonfiguration, bevor Sie mehrere Einstellungen gleichzeitig ändern.

Schließen Sie die Diagnose mit einer kurzen Störungsaufzeichnung ab. Notieren Sie Resolveradresse, Transport, abgefragten Namen, Eintragstyp, Ergebnis und den nächsten fehlerhaften Abschnitt. Die Aufzeichnung sollte den beobachteten Fehler erklären, ohne jedes IPv6-Problem als AAAA-Problem einzuordnen.

## Diese Quellen stützen den Leitfaden

Die Quellenprüfung erfolgte am 21. Oktober 2026 in der Zeitzone America/Los_Angeles. Die Befehle beschreiben mögliche Prüfungen und keine Messungen aus einem bestimmten Netz.

- [RFC 3596, Abschnitt 1](https://www.rfc-editor.org/rfc/rfc3596.html#section-1): Abfragetransport und Eintragsinhalt bleiben unabhängig.
- [RFC 3901, Abschnitte 1 und 4](https://www.rfc-editor.org/rfc/rfc3901.html): Erreichbarkeit innerhalb der Verweiskette und DNS-Betrieb mit unterschiedlichen Transportwegen.
- [Einrichtung von Google Public DNS](https://developers.google.com/speed/public-dns/docs/using): Resolveradressen und Wiederherstellung der Konfiguration.
- [Cloudflare-Resolveradressen](https://developers.cloudflare.com/1.1.1.1/ip-addresses/): Standarddienst und gefilterte Varianten.
- [Quad9-Dienste](https://docs.quad9.net/services/): Dienstvarianten und IPv6-Endpunkte.
- [BIND-Handbuch für dig](https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility): Abfragesyntax und Transportoptionen.
- [Sichere Transportverfahren von Google](https://developers.google.com/speed/public-dns/docs/secure-transports): Verschlüsselung erfordert eine gesonderte Transportauswahl.
- [RFC 2308, Abschnitt 2](https://www.rfc-editor.org/rfc/rfc2308.html#section-2): Einordnung negativer Antworten.
