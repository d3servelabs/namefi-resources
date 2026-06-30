---
title: Registrar
date: '2025-06-30'
language: de
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: Ein von ICANN akkreditiertes Unternehmen, das berechtigt ist, Domainnamen im Auftrag der Öffentlichkeit zu registrieren und als Schnittstelle zwischen Registranten und Registries fungiert.
keywords: ['Registrar', 'Domain-Registrar', 'ICANN-Akkreditierung', 'Domainregistrierung', 'RAA', 'EPP', 'Auth-Code', 'Transfer-Sperre', 'Domain-Transfer']
level: 2
sources:
  - https://www.icann.org/en/accredited-registrars
  - https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en
  - https://www.iana.org/domains/root
aliasesByLocale:
  zh-CN: ['注册服务商']
  de: ['Registrierungsdienst']
relatedArticles:
  - /de/blog/how-to-sell-a-domain-name-you-own/
  - /de/blog/what-are-tokenized-domains/
  - /de/blog/what-is-a-tld/
  - /de/blog/the-panix-com-domain-hijack/
  - /de/blog/what-is-udrp/
relatedTopics:
  - /de/topics/domain-basics/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/domain-investor-field-guide/
relatedGlossary:
  - /de/glossary/icann/
  - /de/glossary/registry/
  - /de/glossary/dns/
  - /de/glossary/tld/
  - /de/glossary/web3/
---

Ein **Registrar** ist eine von [ICANN](/de/glossary/icann/) akkreditierte Organisation, die berechtigt ist, Domainnamen in einer oder mehreren Top-Level-Domains im Auftrag der Öffentlichkeit zu registrieren und dabei die Beziehung zwischen Domain-Käufern und der [Registry](/de/glossary/registry/) zu verwalten, die die autoritative Datenbank für diese Domains betreibt.

## Was ein Registrar tut

Ein Registrar fungiert als öffentlich zugänglicher Dienstleister im Domain-Namensystem. Wenn eine Person oder Organisation einen Domainnamen besitzen möchte, interagiert sie mit einem Registrar – nicht direkt mit einer Registry oder mit [ICANN](/de/glossary/icann/).

Zu den Kernfunktionen eines Registrars gehören:

- **Domain-Suche und Registrierung.** Der Registrar fragt die Verfügbarkeitsdatenbank der Registry ab und übermittelt bei einem Kauf einen Registrierungsantrag im Namen des Kunden.
- **Verlängerungsverwaltung.** Registrierungen werden für ein bis zehn Jahre gemietet. Der Registrar erhebt Verlängerungsgebühren und re-registriert den Namen, bevor er abläuft.
- **[DNS](/de/glossary/dns/)- und [Nameserver](/de/glossary/nameserver/)-Verwaltung.** Registrare bieten Registranten ein Bedienfeld zur Aktualisierung der Nameserver, die bestimmen, wo die DNS-Einträge einer Domain gehostet werden.
- **Pflege von Kontaktdaten.** ICANNs Regeln verlangen genaue WHOIS-Kontaktdaten. Registrare erfassen und veröffentlichen diese Daten (im Rahmen von Datenschutzbeschränkungen).
- **Domain-Sicherheitsfunktionen.** Dazu gehören Domain-Sperren, Zwei-Faktor-Authentifizierung am Registrar-Konto, DNSSEC-Signierung und E-Mail-Bestätigung für sensible Änderungen.
- **Transfer-Abwicklung.** Wenn ein Domain-Inhaber zu einem anderen Registrar wechselt, muss der aktuelle Registrar ICANNs Transfer-Richtlinie befolgen und die Domain auf einen gültigen Transfer-Antrag hin freigeben.

## Registrar vs. Registry vs. Registrant

Die Domain-Branche ist um drei verschiedene Rollen organisiert, die alle mit „Regist-" beginnen – eine häufige Quelle von Verwirrung.

| Rolle | Wer sie sind | Was sie kontrollieren |
|---|---|---|
| **[Registry](/de/glossary/registry/)** | Der Betreiber einer Top-Level-Domain (TLD) – z. B. Verisign für `.com`, DENIC für `.de`. | Die autoritative Datenbank aller Second-Level-Domains unter dieser TLD; legt Großhandelspreise und Registry-Richtlinien fest. |
| **Registrar** | Ein von ICANN akkreditierter Wiederverkäufer, der berechtigt ist, Namen in einer oder mehreren TLDs zu registrieren. | Die Kundenbeziehung, Einzelhandelspreise, Bedienfelder, Verlängerungsbenachrichtigungen und Transfer-/Sperrmechanismen. |
| **[Registrant](/de/glossary/registrant/)** | Die Einzelperson, das Unternehmen oder die Organisation, die den Domainnamen kauft und nutzt. | Die Konfiguration von Nameservern und DNS-Einträgen; das Recht, den Namen zu verlängern und zu übertragen. |

Registries und Registrare sind separate Unternehmen. Eine Registry verkauft nicht an die Öffentlichkeit; sie verkauft Großhandelszugang an akkreditierte Registrare. Registrare legen dann ihre eigenen Einzelhandelspreise fest und konkurrieren um Kunden. In einigen Fällen hält dasselbe Unternehmen sowohl eine Registry- als auch eine Registrar-Akkreditierung (Donuts/Identity Digital ist ein prominentes Beispiel), aber die Rollen bleiben nach ICANN-Regeln operativ und vertraglich getrennt.

## ICANN-Akkreditierung — das RAA

Ein Unternehmen kann nicht einfach als Registrar agieren, indem es einen Checkout-Flow aufbaut. Es muss zunächst von [ICANN](/de/glossary/icann/) gemäß dem **Registrar Accreditation Agreement (RAA)**, einem bindenden Vertrag, akkreditiert werden, der Mindestpflichten zu Datengenauigkeit, Streitbeilegung, Registrantenrechten, Missbrauchsreaktionen und finanziellem Treuhandverhältnis für Kundendaten festlegt.

Wichtige Bestimmungen des RAA umfassen:

- **Registrantenverifizierung.** Registrare müssen Kontaktdaten verifizieren und innerhalb eines definierten Zeitraums auf Ungenauigkeitsbeschwerden reagieren.
- **Datentreuhand.** Registrare müssen Kundenregistrierungsdaten bei einem Drittanbieter-Treuhänder hinterlegen, damit Registrierungen bestehen bleiben, wenn der Registrar das Geschäft aufgibt.
- **Missbrauchsreaktion.** Registrare müssen eine Missbrauchs-Anlaufstelle unterhalten und innerhalb festgelegter Zeitrahmen auf dokumentierte Missbrauchsmeldungen (Spam, Malware, Phishing) reagieren.
- **Thin vs. Thick WHOIS.** Einige TLDs verwenden ein Thin-Modell (Kontaktdaten beim Registrar) und andere ein Thick-Modell (Kontaktdaten bei der Registry kopiert). Das RAA legt fest, welche Daten unter der DSGVO und ähnlichen Rahmenbedingungen veröffentlicht oder datenschutzrechtlich geschützt werden müssen.

ICANN veröffentlicht die [vollständige Liste akkreditierter Registrare](https://www.icann.org/en/accredited-registrars), aktuell über 2.000 weltweit, zusammen mit ihrem Akkreditierungsstatus und etwaigen öffentlichen Sanktionen.

## Wie Registrierung und Transfers funktionieren

### Registrierung über EPP

Registrare verbinden sich mit Registries über das **Extensible Provisioning Protocol ([EPP](/de/glossary/epp/))**, ein standardisiertes XML-basiertes Protokoll, das in RFC 5730–5734 definiert ist. Wenn ein Registrant einen Kauf abschließt, sendet das System des Registrars einen EPP-`create`-Befehl an die Registry, die die Registrierung erfasst und einen eindeutigen **Registry Object Identifier (ROID)** zurückgibt. Die Registry veröffentlicht dann die [Nameserver](/de/glossary/nameserver/)-Delegation in der DNS-Root-Zone, sodass die Domain auflöst.

### Transfer-Sperren und Auth-Codes

Domain-Transfers zwischen Registraren werden durch ICANNs [Inter-Registrar Transfer Policy](https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en) geregelt. Zwei Mechanismen schützen vor unbefugten Transfers:

- **[Transfer-Sperre](/de/glossary/transfer-lock/) (Registrar-Sperre / EPP-Status `clientTransferProhibited`).** Wenn aktiviert, lehnt die Registry jeden Transfer-Antrag für diese Domain ab. Registrare aktivieren dies standardmäßig als Sicherheitsmaßnahme. Der Registrant muss die Domain explizit entsperren, bevor er einen Transfer einleitet.
- **[Auth-Code](/de/glossary/auth-code/) (auch EPP-Auth-Info-Code oder Transfer-Autorisierungscode genannt).** Ein einmaliges Passwort, das vom Registrar generiert wird. Der aufnehmende (empfangende) Registrar übermittelt diesen Code an die Registry, um zu belegen, dass der Registrant den Transfer autorisiert hat. Ohne ihn lehnt die Registry den Antrag ab.

Ein standardmäßiger ausgehender Transfer-Ablauf:

1. Registrant fordert den Auth-Code vom aktuellen Registrar an.
2. Registrant entsperrt die Domain (deaktiviert `clientTransferProhibited`).
3. Registrant gibt den Auth-Code beim aufnehmenden Registrar ein.
4. Aufnehmender Registrar sendet einen EPP-`transfer`-Befehl an die Registry.
5. Die Registry benachrichtigt den abgebenden Registrar, der fünf Tage Zeit hat, explizit abzulehnen oder zu genehmigen; Schweigen gilt als Genehmigung.
6. Transfer abgeschlossen; der aufnehmende Registrar hält die Registrierung für den Rest der Laufzeit zuzüglich einem Jahr.

ICANN-Regeln untersagen Registraren, eine Transfer-Gebühr beim Abgeben zu erheben, obwohl einige dies bei bestimmten TLDs versuchen.

### Die 60-Tage-Sperregel

Die ICANN-Richtlinie sperrt eine Domain für 60 Tage nach der Erstregistrierung und für 60 Tage nach einem Registrar-zu-Registrar-Transfer bei ihrem aktuellen Registrar. Dies verhindert Missbrauchsszenarien wie das Durchreichen einer Domain zwischen Registraren zur Verschleierung des Eigentums. Die 60-Tage-Frist beginnt bei jedem Transfer neu.

## Wiederverkäufer

Viele Domainnamen werden nicht direkt von akkreditierten Registraren verkauft, sondern von **[Wiederverkäufern](/de/glossary/reseller/)** – Unternehmen, die die Infrastruktur des Registrars unter ihrer eigenen Marke als White-Label anbieten. Wiederverkäufer besitzen keine eigene ICANN-Akkreditierung; sie operieren unter der Akkreditierung ihres vorgelagerten Registrars. Für den [Registranten](/de/glossary/registrant/) bedeutet dies praktisch:

- Der vorgelagerte Registrar hält die EPP-Verbindung zur Registry, daher erscheint der Name des Registrars im WHOIS, nicht der des Wiederverkäufers.
- Streitigkeiten und Treuhandrechte fallen unter das vorgelagerte RAA.
- Wenn der Wiederverkäufer das Geschäft aufgibt, bleiben Registrierungen unter der Treuhand des vorgelagerten Registrars gültig.

Wiederverkäufer-Arrangements sind weit verbreitet: Viele Web-Hosting-Unternehmen, Website-Baukästen und Telekommunikationsanbieter verkaufen Domains als Zusatzleistungen über dieses Modell.

## Die Wahl eines Registrars

Kein einzelner Registrar eignet sich für jeden Anwendungsfall. Neutrale Faktoren, die es zu vergleichen lohnt:

- **Preisgestaltung.** Registrierungspreise werden von der Registry (Großhandel) festgelegt, aber von jedem Registrar unterschiedlich aufgeschlagen. Vergleichen Sie Erstjahres-Aktionspreise mit mehrjährigen Verlängerungsraten – die Lücke ist oft groß. Prüfen Sie auch die Transfer-Eingangspreise.
- **Datenschutz.** Die meisten Registrare bieten WHOIS-Datenschutz (Proxy-Kontaktdaten) kostenlos an, entsprechend ICANNs DSGVO-Leitlinien, aber einige erheben noch Gebühren dafür. Bestätigen Sie den Standard.
- **Sicherheitsfunktionen.** Achten Sie auf Zwei-Faktor-Authentifizierung am Konto, Verfügbarkeit von Registry-Sperren für hochwertige Domains, DNSSEC-Unterstützung und Bestätigungs-E-Mails für Kontoänderungen.
- **DNS-Hosting.** Einige Registrare bündeln eigenes DNS-Hosting; andere sind Nameserver-agnostisch. Prüfen Sie, ob das gebündelte DNS Ihren Anforderungen entspricht oder ob Sie auf einen separaten Anbieter (Cloudflare, AWS Route 53 usw.) verweisen werden.
- **Support-Qualität.** Reaktionszeiten und Kanal-Optionen (Chat, Telefon, Ticket) variieren erheblich. Für geschäftskritische Domains ist ein 24/7-Live-Support wichtig.
- **Akkreditierungsumfang.** Nicht jeder Registrar ist für jede TLD akkreditiert. Bestätigen Sie, dass der Registrar die spezifischen TLD(s) unterstützt, die Sie benötigen, insbesondere für Ländercode-TLDs (ccTLDs), die möglicherweise lokale Präsenzregeln erfordern.

Bekannte Beispiele akkreditierter Registrare sind GoDaddy, Namecheap, Cloudflare Registrar, Google Domains (jetzt Squarespace Domains) und Gandi – hier als sachliche Illustrationen genannt, nicht als Empfehlungen. Jeder hat unterschiedliche Preisstrukturen, Funktionsumfänge und Benutzeroberflächen, die unterschiedlichen Registrantenanforderungen gerecht werden.

## Registrare und tokenisierte Domains

Konventionelle [DNS](/de/glossary/dns/)-Registrierung legt die Domain-Kontrolle beim Registrar: Kontozugang, Zahlungsmethode und die eigenen Richtlinien des Registrars bestimmen, wer einen Namen verlängern, übertragen oder konfigurieren kann. Das Eigentum ist effektiv an das Registrar-Konto gebunden.

Einige blockchain-basierte Benennungssysteme – wie der Ethereum Name Service (ENS) für `.eth`-Namen – operieren vollständig außerhalb der traditionellen DNS-Hierarchie und des ICANN-Akkreditierungsrahmens. In diesen Systemen ist das Eigentum in einem Smart Contract kodiert und wird durch einen kryptografischen privaten Schlüssel kontrolliert, nicht durch ein Registrar-Konto. Solche Namen erscheinen nicht in der [IANA](/de/glossary/nameserver/)-Root-Zone und sind im Standard-DNS ohne Browser-Erweiterungen oder Resolver-Unterstützung nicht auflösbar.

Eine kleine Anzahl von Projekten erforscht hybride Modelle, bei denen konventionelle, von ICANN delegierte Domainnamen mit On-Chain-Eigentumsnachweisen verknüpft sind, aber Stand 2025 bleiben diese außerhalb des Mainstream-DNS und beeinflussen die formale Rolle des Registrars gemäß RAA nicht. Für jede Domain, die im Standard-DNS auflöst, bleibt ein von ICANN akkreditierter Registrar der obligatorische Vermittler zwischen Registrant und Registry.
