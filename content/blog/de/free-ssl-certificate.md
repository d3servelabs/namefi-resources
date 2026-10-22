---
title: "Ein kostenloses SSL-Zertifikat braucht zuverlässige Bereitstellung und Erneuerung"
description: "Nutzen Sie kostenlose TLS-Zertifikate über Hosting oder Let's Encrypt. Prüfen Sie Domainkontrolle, Hostnamen, Bereitstellung und Erneuerung."
date: '2026-10-22'
language: de
tags: ['https', 'tls', 'certificates', 'security']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-security
keywords: ['SSL Zertifikat kostenlos', 'kostenloses TLS Zertifikat', 'Let’s Encrypt Zertifikat', 'kostenloses HTTPS', 'verwaltetes SSL Zertifikat', 'ACME Client', 'Certbot Zertifikat', 'kostenloses Wildcard Zertifikat', 'Zertifikatsvalidierung', 'SSL Zertifikat Kosten']
ogImage: ../../assets/free-ssl-certificate-og.jpg
relatedArticles:
  - /de/blog/what-is-https/
  - /de/blog/renew-ssl-certificate/
  - /de/blog/custom-domain-github-pages/
  - /de/blog/wildcard-dns-records/
  - /de/blog/how-domain-hijacking-actually-happens/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/dns/
  - /de/glossary/private-key/
  - /de/glossary/public-key/
  - /de/glossary/subdomain/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-investor-field-guide/
  - /de/series/domain-apocalypse/
---

**Ein kostenloses SSL-Zertifikat ermöglicht HTTPS ohne Ausstellungsgebühr für das Zertifikat.** Prüfen Sie zuerst, ob der Hosting-Anbieter Zertifikate verwaltet. Für einen selbst verwalteten Server kommt ein ACME-Client mit einer Zertifizierungsstelle wie Let's Encrypt infrage.

Die Zertifikatsgebühr und der Betriebsaufwand für HTTPS sind getrennte Fragen. Let's Encrypt [verlangt keine Zertifikatsgebühr](https://letsencrypt.org/docs/faq/#what-does-it-cost-to-use-lets-encrypt-is-it-really-free). Hosting-Anbieter können dennoch Verwaltungsgebühren verlangen. Betreiber brauchen weiterhin eine funktionierende Bereitstellung und einen Erneuerungsplan.

Dieser Leitfaden behandelt die Wahl zwischen verwalteten Zertifikaten und eigener Zertifikatsverwaltung. Der [HTTPS-Beitrag](/de/blog/what-is-https/) erklärt Verschlüsselung und Authentifizierung. Der [Erneuerungsleitfaden](/de/blog/renew-ssl-certificate/) behandelt eine bestehende Bereitstellung.

## Die Hosting-Struktur bestimmt den praktischen Weg

![Verwaltetes Hosting übernimmt Zertifikate und Erneuerung, während ein eigener Server einen ACME-Client verwendet.](../../assets/free-ssl-certificate-01-manager.jpg)

Let's Encrypt empfiehlt Website-Betreibern, [die Unterstützung durch den Hosting-Anbieter zu prüfen](https://letsencrypt.org/getting-started/#without-shell-access). Ein verwalteter Dienst kann die Zertifikatsverwaltung übernehmen. GitHub Pages unterstützt beispielsweise [HTTPS für korrekt konfigurierte eigene Domains](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

| Situation | Ausgangspunkt | Vorher prüfen |
| --- | --- | --- |
| Ein Anbieter verwaltet HTTPS | Einstellungen für eigene Domains und HTTPS | Enthaltenes Zertifikat, abgedeckte Hostnamen, Zuständigkeit für Erneuerung |
| Sie verwalten den Server | Unterstützter ACME-Client | Serverzugriff, Integration in die Bereitstellung, automatische Erneuerung |
| Sie benötigen ein Wildcard-Zertifikat | Verwaltete Wildcard-Funktion oder ACME-Client mit DNS-01 | DNS-Automatisierung und eingeschränkte Zugangsdaten |
| Sie benötigen Organisationsprüfungen | Aussteller mit der geforderten Validierung | Verbindliche OV- oder EV-Anforderung |

Die Tabelle unterstützt die Auswahl und macht keine Zusage für jeden Hosting-Tarif. Prüfen Sie Tarif und Plattform, bevor Sie DNS-Einstellungen ändern oder eine Zusatzleistung kaufen.

Für selbst verwaltete Server [empfiehlt Let's Encrypt zunächst Certbot](https://letsencrypt.org/getting-started/#with-shell-access). Wählen Sie die Anleitung für das tatsächliche Betriebssystem und den Webserver. Kopieren Sie keinen Befehl für eine andere Bereitstellung.

Belassen Sie den privaten Schlüssel unter der Kontrolle der Zertifikatsverwaltung. Laut Let's Encrypt [erzeugen und verwalten die Teilnehmer ihre privaten Schlüssel selbst](https://letsencrypt.org/docs/faq/#does-lets-encrypt-generate-or-store-the-private-keys-for-my-certificates-on-lets-encrypts-servers). Ein Zertifikatsantrag erfordert keine Übermittlung des privaten Schlüssels an den Aussteller.

## Kostenlose Ausstellung verlangt Domainkontrolle und passende Namensabdeckung

![Die HTTP-Validierung stellt eine Prüfdatei bereit; die DNS-Validierung veröffentlicht einen TXT-Eintrag und unterstützt Wildcard-Zertifikate.](../../assets/free-ssl-certificate-02-validation.jpg)

Let's Encrypt stellt [domainvalidierte Zertifikate](https://letsencrypt.org/docs/faq/#what-services-does-lets-encrypt-offer) aus. DV prüft die Kontrolle über eine Domain. Let's Encrypt bietet weder OV noch EV an. Ein kostenloses DV-Zertifikat erfüllt deshalb keine ausdrückliche Anforderung zur Organisationsvalidierung.

Der ACME-Client weist die Kontrolle durch eine Validierungsaufgabe nach. Bei [HTTP-01](https://letsencrypt.org/docs/challenge-types/#http-01-challenge) stellt der Client eine Prüfdatei über HTTP auf Port 80 bereit. Bei [DNS-01](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge) veröffentlicht der Client einen DNS-TXT-Wert. Wildcard-Zertifikate von Let's Encrypt erfordern DNS-01.

Die DNS-01-Automatisierung benötigt eine geeignete DNS-API. Folgen Sie der Empfehlung des Ausstellers: Begrenzen Sie DNS-Zugangsdaten oder trennen Sie die Validierung vom Webserver. Umfassende DNS-Zugangsdaten auf einem kompromittierten Server gefährden mehr als die Zertifikatserneuerung.

Notieren Sie vor der Ausstellung die benötigten Hostnamen. Ein Zertifikat kann [mehrere Namen über Subject Alternative Name enthalten](https://letsencrypt.org/docs/faq/#can-i-get-a-certificate-for-multiple-domain-names-san-certificates-or-ucc-certificates). Eine Wildcard wie `*.example.com` passt zu einer Namensebene, etwa `shop.example.com`. Nach den [Vergleichsregeln von RFC 9525](https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3) deckt die Wildcard weder `example.com` noch `a.shop.example.com` ab. Beantragen Sie die Stammdomain bei Bedarf separat.

Das Zertifikat bestätigt eine Verbindungsidentität und empfiehlt kein Vertrauen in das Unternehmen. Die [TLS-Spezifikation](https://www.rfc-editor.org/rfc/rfc8446.html#section-1) beschreibt den Schutz vor Abhören, Manipulation und Nachrichtenfälschung. Bewerten Sie Unternehmen und Anwendung gesondert.

## Eine Bereitstellungsprüfung verhindert eine unvollständige HTTPS-Einrichtung

1. Bestimmen Sie den Anbieter oder ACME-Client für die Zertifikatsverwaltung.
2. Bestätigen Sie die benötigten Hostnamen und das Validierungsverfahren.
3. Schließen Sie die Validierung ab und stellen Sie das Zertifikat am öffentlichen TLS-Endpunkt bereit.
4. Öffnen Sie jeden benötigten Hostnamen über HTTPS im Browser.
5. Prüfen Sie Namensabdeckung, Zertifikatsgültigkeit und Browservertrauen.
6. Bestätigen Sie die automatische Erneuerung und bestimmen Sie einen Verantwortlichen für Fehler.
7. Prüfen Sie Anwendungsressourcen auf verbleibende HTTP-Anfragen, bevor Sie HTTPS erzwingen.

Bei der Prüfung am 22. Oktober 2026 nennt die [FAQ von Let's Encrypt](https://letsencrypt.org/docs/faq/#what-is-the-lifetime-for-lets-encrypt-certificates-for-how-long-are-they-valid) Standardzertifikate mit 90 Tagen und optionale Zertifikate mit sechs Tagen Gültigkeit. Die FAQ empfiehlt die Erneuerung entsprechend alle 60 Tage beziehungsweise alle drei Tage. Diese Zeiträume beschreiben das aktuelle Angebot von Let's Encrypt, nicht jedes kostenlose Zertifikat. Lassen Sie die automatische Erneuerung aktiviert und überwachen Sie das Zertifikat, das der öffentliche Endpunkt tatsächlich ausliefert.

GitHub beschreibt [Probleme mit gemischten Inhalten](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https#resolving-problems-with-mixed-content), wenn eine HTTPS-Seite Ressourcen über HTTP anfordert. Eine erfolgreiche Zertifikatsausstellung korrigiert keine solchen Anwendungsverweise.

Nutzen Sie den [Leitfaden zur Zertifikatserneuerung](/de/blog/renew-ssl-certificate/) für die Prüfung des öffentlichen Endpunkts und des Zertifikatswechsels. Eine Zertifikatsübersicht kann einen erfolgreichen Antrag anzeigen, während ein anderer Server noch ein altes Zertifikat liefert. Prüfen Sie die Verbindung, die Besucher tatsächlich verwenden.

## Die Quellen erklären kostenlose Ausstellung und Betriebsanforderungen

- Let's Encrypt, [FAQ](https://letsencrypt.org/docs/faq/), Gebühren, Zertifikatstypen, private Schlüssel und SAN-Unterstützung. Abgerufen am 2026-10-22.
- Let's Encrypt, [Erste Schritte](https://letsencrypt.org/getting-started/) und [Validierungsverfahren](https://letsencrypt.org/docs/challenge-types/), verwaltetes Hosting, ACME-Clients und Validierung. Abgerufen am 2026-10-22.
- GitHub, [HTTPS für GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https), eigene Domains und gemischte Inhalte. Abgerufen am 2026-10-22.
- IETF, [RFC 9525, Abschnitt 6.3](https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3) und [RFC 8446, Abschnitt 1](https://www.rfc-editor.org/rfc/rfc8446.html#section-1), Namensvergleich und TLS-Ziele. Abgerufen am 2026-10-22.
