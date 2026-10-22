---
title: "So richten Sie E-Mail mit eigener Domain ein"
date: '2026-10-21'
language: de
tags: ['domains', 'guide']
authors: ['namefiteam']
draft: false
cluster: domain-basics
ogImage: ../../assets/set-up-email-with-your-own-domain-og.jpg
format: guide
description: "Richten Sie E-Mail mit eigener Domain ein: Dienst wählen, Domain bestätigen, DNS-Einträge setzen und Empfang sowie Versand prüfen."
keywords: ['E-Mail mit eigener Domain', 'eigene E-Mail-Domain', 'E-Mail-Domain kaufen', 'Domain E-Mail einrichten', 'E-Mail-Hosting', 'MX-Einträge', 'SPF', 'DKIM', 'DMARC', 'Domainbestätigung', 'eigenes Postfach']
relatedArticles:
  - /de/blog/dns-on-tokenized-domains/
  - /de/blog/what-is-domain/
  - /de/blog/domain-vs-hosting/
  - /de/blog/email-sender-reputation-arms-race/
  - /de/blog/transfer-domain-to-another-registrar/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-investor-field-guide/
  - /de/series/domain-apocalypse/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/dns-record-types/
  - /de/glossary/registrar/
  - /de/glossary/domain-ownership/
  - /de/glossary/subdomain/
---

**Für eine Adresse wie `hello@example.com` brauchen Sie die Kontrolle über die Domain, einen E-Mail-Dienst und Zugriff auf die DNS-Einstellungen.** Legen Sie zuerst die Postfächer an. Bestätigen Sie danach die Domain, richten Sie den Empfang und die Absenderauthentifizierung ein und testen Sie beide Richtungen. Google verlangt in seiner Checkliste Benutzerkonten vor der MX-Umstellung, die eingehende Nachrichten zum neuen Dienst leitet. [Google beschreibt die Reihenfolge.](https://knowledge.workspace.google.com/admin/gmail/activate-gmail-with-google-workspace-your-company)

Diese Anleitung verwendet Google Workspace als dokumentiertes Beispiel. Die grundlegenden Entscheidungen gelten auch für andere Anbieter. Übernehmen Sie die Eintragswerte immer aus dem Einrichtungsdialog Ihres eigenen Anbieters.

## Wählen Sie einen Dienst für Ihren E-Mail-Versand

![Ein gehostetes Postfach empfängt und versendet Nachrichten. Eine Weiterleitung leitet eingehende Nachrichten an ein vorhandenes Postfach.](../../assets/set-up-email-with-your-own-domain-03-service-choice.jpg)

Der Domainkauf und der E-Mail-Dienst erfüllen unterschiedliche Aufgaben. Prüfen Sie vor einem weiteren Kauf, ob Ihr Domainpaket bereits Postfächer enthält. Sie brauchen für diese Einrichtung keine Website. Sie brauchen die Kontrolle über die Domain und die aktive DNS-Zone.

Wählen Sie den Dienst, bevor Sie DNS-Einträge kopieren:

| Ihr Bedarf | Passende Dienstkategorie | Prüfung vor der DNS-Änderung |
| --- | --- | --- |
| Eigene Postfächer und Antworten mit der Domainadresse | Ein gehosteter Postfachdienst, etwa Google Workspace oder Microsoft 365 | Benutzer, Aliasse, Zugriff mit E-Mail-Programmen, Kontowiederherstellung und Migration |
| Persönliche oder Familienadressen in iCloud Mail | Eigene E-Mail-Domain mit iCloud+ | Abonnement, Apple Account und gewünschte Freigabe |
| Zustellung an ein vorhandenes Postfach | Ein Weiterleitungsdienst | Bestätigte Zieladresse und eine gesonderte unterstützte Lösung für Antworten |

Microsoft 365 unterstützt die automatische Domainbestätigung und Einrichtung der Einträge über Domain Connect. Ohne Unterstützung durch den Registrar steht die manuelle Einrichtung zur Verfügung. [Microsoft beschreibt die Domaineinrichtung.](https://learn.microsoft.com/en-us/microsoft-365/admin/setup/add-domain?view=o365-worldwide)

Apple verlangt für eigene E-Mail-Domains ein iCloud+-Abonnement. Außerdem brauchen Sie einen Apple Account mit Zwei-Faktor-Authentifizierung und aktiviertes iCloud Mail. Prüfen Sie vor der Auswahl die aktuellen Voraussetzungen. [Apple nennt die Voraussetzungen.](https://support.apple.com/en-us/102540)

Cloudflare unterscheidet eingehendes Email Routing und ausgehenden Transaktionsversand mit Email Sending. Betrachten Sie eine Weiterleitungsregel als Empfangsweg. Setzen Sie die Weiterleitungsregel nicht mit einem vollständigen Postfach gleich. [Cloudflare beschreibt die Dienste.](https://developers.cloudflare.com/email-service/)

Die [kostenlosen E-Mail-Optionen für Unternehmen](/de/blog/free-business-email-options/) behandeln Tarifgrenzen und kostenlose Angebote. Diese Anleitung erklärt die Einrichtung nach der Dienstauswahl.

## Bereiten Sie die Postfächer und den DNS-Zugriff vor

Entscheiden Sie zuerst zwischen **Postfach** und **Weiterleitung**. Ein Postfachdienst stellt jedem Benutzer ein Konto und eine Adresse bereit. Eine Weiterleitung schickt eingehende Nachrichten an einen vorhandenen Posteingang. Cloudflare dokumentiert beispielsweise Regeln, die Nachrichten für eine eigene Adresse an ein bestätigtes Ziel weiterleiten. Vergleichen Sie [Googles Kontoeinrichtung](https://knowledge.workspace.google.com/admin/gmail/activate-gmail-with-google-workspace-your-company) mit [Cloudflares Weiterleitungsablauf](https://developers.cloudflare.com/email-service/get-started/route-emails/). Prüfen Sie vor dem Einsatz einer reinen Weiterleitung ausdrücklich, wie der Dienst Antworten mit Ihrer Domainadresse unterstützt.

Erstellen Sie eine kurze Bestandsaufnahme:

- Die kontrollierte Domain und die Person mit Änderungsrechten für DNS.
- Den aktiven DNS-Anbieter, der vom Registrar abweichen kann.
- Alle Empfangsadressen für Personen, Aliasse und gemeinsam genutzte Adressen.
- Alle Versanddienste, einschließlich Formularen, Newslettern und Rechnungssoftware.
- Die vorhandenen DNS-Einträge und gegebenenfalls den bisherigen E-Mail-Anbieter.

Sichern Sie auch die Website-Einträge. Die Übersicht der [DNS-Eintragstypen (A, AAAA, CNAME, MX, TXT)](/de/glossary/dns-record-types/) unterscheidet E-Mail- und Website-Einstellungen. Wenn Registrierung und DNS getrennt liegen, verwenden Sie das Konto des aktiven DNS-Anbieters. DNSimple bestätigt diese Möglichkeit für seinen Dienst. [DNSimple beschreibt das unabhängige DNS-Hosting.](https://support.dnsimple.com/articles/dnsimple-services/#domain-registration-transfer-and-renewal)

Planen Sie bei einem Anbieterwechsel den Erhalt alter Nachrichten, die Einrichtung vorhandener Aliasse und den Empfang während der Umstellung. Die Migration alter Postfachinhalte bildet eine eigene Aufgabe. Googles Checkliste führt den Import vorhandener Nachrichten als zusätzlichen Einrichtungsschritt auf. [Die Checkliste enthält die Migrationsoptionen.](https://knowledge.workspace.google.com/admin/gmail/activate-gmail-with-google-workspace-your-company)

## Bestätigen Sie die Domain vor der Empfangsumstellung

![MX-Einträge bestimmen den empfangenden E-Mail-Host für eine Domainadresse.](../../assets/set-up-email-with-your-own-domain-01-routing.jpg)

Die Domainbestätigung weist dem E-Mail-Anbieter Ihre Kontrolle nach. Bei Googles dokumentierter TXT-Methode kopieren Sie den eindeutigen Bestätigungswert aus **Konto → Domains → Domains verwalten**. Fügen Sie den Wert im DNS hinzu und bestätigen Sie anschließend die Domain in der Admin-Konsole. Übernehmen Sie den Eintragsnamen und den Wert genau aus Ihrem Konto. [Google erklärt die TXT-Bestätigung.](https://knowledge.workspace.google.com/admin/domains/verify-your-domain-with-a-txt-record)

Die Bestätigung leitet noch keine Nachrichten weiter. Ändern Sie die **MX-Einträge** erst, wenn die Postfächer bereitstehen. Erhalten Sie unabhängige TXT-, A-, AAAA- und CNAME-Einträge.

Google Workspace nennt aktuell `smtp.google.com` mit Priorität `1`. Aktivieren Sie anschließend Gmail in der Admin-Konsole. Funktionierende ältere Konfigurationen mit `aspmx`-Zielen bleiben unterstützt und brauchen keine Änderung. [Google dokumentiert die MX-Werte und die älteren Einträge.](https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace)

Googles reguläre Einrichtung verlangt bei der Umstellung das Entfernen anderer MX-Einträge. Kombinieren Sie Anbieter nicht in der Erwartung, jeder Anbieter erhalte eine Kopie jeder Nachricht. [Verwenden Sie die vorgesehene MX-Konfiguration.](https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace)

Vergleichen Sie öffentlich abrufbare MX-Antworten mit den geplanten Werten. Google nennt dafür Admin Toolbox Dig und räumt bis zu 72 Stunden für die Erkennung ein. Korrigieren Sie falsche Einträge, statt auf falsche Einträge zu warten. [Google nennt die Prüfschritte.](https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace)

## Authentifizieren Sie jeden Dienst für ausgehende Nachrichten

![SPF, DKIM und DMARC erfüllen unterschiedliche Aufgaben bei der Absenderauthentifizierung.](../../assets/set-up-email-with-your-own-domain-02-authentication.jpg)

Eine empfangene Nachricht bestätigt nur eine Richtung. Richten Sie die vom Anbieter vorgesehenen Versandverfahren ein. Berücksichtigen Sie auch weitere berechtigte Absender.

| Verfahren | Einrichtung | Zu vermeidender Fehler |
| --- | --- | --- |
| SPF | Eine DNS-TXT-Richtlinie autorisiert die Versanddienste der Domain | Mehrere getrennte SPF-Richtlinien für denselben Namen |
| DKIM | DNS-Informationen des Anbieters ermöglichen die Prüfung ausgehender Signaturen | Veröffentlichung des Eintrags ohne Aktivierung der Signierung |
| DMARC | Richtlinie und Berichte prüfen den Abgleich mit der sichtbaren From-Domain | Erzwungene Ablehnung vor funktionierender Authentifizierung aller berechtigten Absender |

Erfassen Sie vor der **SPF**-Änderung alle Absender. Google unterscheidet eine reine Workspace-Konfiguration von einer Konfiguration mit Drittanbietern. Die Fehlerbehebung verlangt, mehrere SPF-Einträge zu **einem SPF-Eintrag** zusammenzufassen. Diese Einschränkung betrifft SPF-Einträge unter demselben Namen. Die Einschränkung verbietet keine anderen TXT-Einträge in der Zone. Lesen Sie [die SPF-Einrichtung](https://knowledge.workspace.google.com/admin/security/set-up-spf) und [die Hinweise zu doppelten SPF-Einträgen](https://knowledge.workspace.google.com/admin/security/troubleshoot-spf-issues#:~:text=Note%20that%20each%20domain).

Befolgen Sie für **DKIM** die Reihenfolge Ihres Anbieters: Eintrag erzeugen oder beziehen, veröffentlichen und Signierung aktivieren. Google verlangt die Veröffentlichung des öffentlichen Schlüssels vor **Authentifizierung starten**. Laut Google kann die Schlüsselerzeugung erst 24–72 Stunden nach der Gmail-Aktivierung erfolgen. Der private Signaturschlüssel gehört nicht ins öffentliche DNS. [Google beschreibt die DKIM-Schritte.](https://knowledge.workspace.google.com/admin/security/set-up-dkim)

Eine Nachricht besteht **DMARC**, wenn SPF samt Domainabgleich oder DKIM samt Domainabgleich zur sichtbaren From-Domain erfolgreich ist. Google empfiehlt zu Beginn `p=none`, damit Sie Berichte prüfen können. Danach können Sie zu Quarantäne oder Ablehnung übergehen. Google verlangt außerdem mindestens 48 Stunden funktionierende SPF- und DKIM-Authentifizierung vor der DMARC-Aktivierung. [Google erklärt DMARC und die schrittweise Einführung.](https://knowledge.workspace.google.com/admin/security/set-up-dmarc#:~:text=When%20you%20start%20using%20DMARC)

Erhalten Sie eine vorhandene durchgesetzte DMARC-Richtlinie während der Migrationsplanung. Ersetzen Sie die Richtlinie nicht automatisch durch ein Anleitungsbeispiel. Prüfen Sie zuerst den neuen Anbieter und alle weiteren Absender gegen die vorhandene Richtlinie. Ändern Sie die Richtlinie anschließend nur bewusst.

## Testen Sie beide Richtungen vor dem Migrationsabschluss

Verwenden Sie externe Konten unter Ihrer Kontrolle oder kooperierende Testpersonen. Senden Sie vom neuen Postfach an einen externen Posteingang. Antworten Sie auf die Nachricht. Senden Sie außerdem eine neue Nachricht an die eigene Domainadresse. Testen Sie Aliasse sowie die tatsächlichen Website- und Rechnungsdienste aus Ihrer Bestandsaufnahme.

Prüfen Sie eine ausgehende Nachricht beim Empfänger. In Gmail zeigt **Original anzeigen** die Authentifizierungsergebnisse. Googles DKIM-Test verlangt einen anderen Empfänger und die Prüfung von `Authentication-Results` in der empfangenen Nachricht. Eine Nachricht an die eigene Adresse entspricht nicht diesem Prüfverfahren. [Google erklärt die Aktivierung und Prüfung von DKIM.](https://knowledge.workspace.google.com/admin/security/set-up-dkim)

Wählen Sie die nächste Prüfung anhand des Fehlers:

| Symptom | Nächste Prüfung |
| --- | --- |
| Die Bestätigung schlägt fehl | Vollständiger Bestätigungswert, richtige DNS-Zone und Eintragsname |
| Eingehende Nachrichten landen beim bisherigen Dienst | Öffentliche MX-Antworten und geplante MX-Umstellung |
| Eine Adresse empfängt Nachrichten, ein Alias aber nicht | Adress- oder Aliaskonfiguration beim neuen Anbieter |
| Die Versandauthentifizierung schlägt fehl | Tatsächlicher Absender, SPF-Richtlinie, DKIM-Signierung und DMARC-Domainabgleich |
| E-Mail funktioniert, die Website aber nicht | Versehentliche Änderung eines Website-Eintrags oder Nameservers |

Halten Sie den bisherigen Dienst verfügbar, bis Ihre Migrationsprüfungen abgeschlossen sind. Hinterlegen Sie den endgültigen Eintragssatz und die Anbieterbestätigung bei der für Verlängerungen zuständigen Person. Der Abschluss verlangt konkrete Ergebnisse: Alle vorgesehenen Adressen empfangen Nachrichten, alle vorgesehenen Dienste versenden Nachrichten und die empfangenen Nachrichten zeigen die erwarteten Authentifizierungsergebnisse.

Die engere Frage nach DNS und Tokenisierung behandelt [DNS auf einer tokenisierten Domain](/de/blog/dns-on-tokenized-domains/).

## Diese Quellen belegen die Einrichtungsschritte

- Google Workspace — [Gmail mit Google Workspace aktivieren](https://knowledge.workspace.google.com/admin/gmail/activate-gmail-with-google-workspace-your-company), erforderliche Schritte und zusätzliche Migrationsoptionen. Abgerufen am 21.10.2026.
- Cloudflare — [E-Mails weiterleiten](https://developers.cloudflare.com/email-service/get-started/route-emails/), eingehende Weiterleitung und Zielbestätigung. Abgerufen am 21.10.2026.
- DNSimple — [DNSimple-Dienste](https://support.dnsimple.com/articles/dnsimple-services/#domain-registration-transfer-and-renewal), DNS-Hosting bei einem anderen Registrar. Abgerufen am 21.10.2026.
- Google Workspace — [Domain mit einem TXT-Eintrag bestätigen](https://knowledge.workspace.google.com/admin/domains/verify-your-domain-with-a-txt-record), Schritte 1–3. Abgerufen am 21.10.2026.
- Google Workspace — [MX-Einträge einrichten](https://knowledge.workspace.google.com/admin/domains/set-up-mx-records-for-google-workspace), Eintragstabelle, ältere Einträge, Gmail-Aktivierung und Fehlerbehebung. Abgerufen am 21.10.2026.
- Google Workspace — [SPF einrichten](https://knowledge.workspace.google.com/admin/security/set-up-spf), Voraussetzungen und Bestimmung des SPF-Eintrags. Abgerufen am 21.10.2026.
- Google Workspace — [SPF-Probleme beheben](https://knowledge.workspace.google.com/admin/security/troubleshoot-spf-issues#:~:text=Note%20that%20each%20domain), genau ein SPF-Eintrag und Drittanbieter. Abgerufen am 21.10.2026.
- Google Workspace — [DKIM einrichten](https://knowledge.workspace.google.com/admin/security/set-up-dkim), Schlüsselerzeugung, Veröffentlichung, Aktivierung und Prüfung. Abgerufen am 21.10.2026.
- Google Workspace — [DMARC einrichten](https://knowledge.workspace.google.com/admin/security/set-up-dmarc#:~:text=When%20you%20start%20using%20DMARC), anfängliche Richtlinie, Domainabgleich und Voraussetzungen. Abgerufen am 21.10.2026.
- Microsoft — [Eigene Domain zu Microsoft 365 hinzufügen](https://learn.microsoft.com/en-us/microsoft-365/admin/setup/add-domain?view=o365-worldwide), automatische und manuelle Einrichtung. Abgerufen am 21.10.2026.
- Apple — [Eigene E-Mail-Domain mit iCloud Mail verwenden](https://support.apple.com/en-us/102540), Abonnement und Kontovoraussetzungen. Abgerufen am 21.10.2026.
- Cloudflare — [Email Service](https://developers.cloudflare.com/email-service/), eingehende Weiterleitung und ausgehender Transaktionsversand. Abgerufen am 21.10.2026.
