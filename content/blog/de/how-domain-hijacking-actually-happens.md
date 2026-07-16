---
title: 'Wie Domain-Hijacking tatsächlich abläuft: Fünf Angriffswege und die Kontrollmechanismen, die sie stoppen'
date: '2026-05-10'
language: de
tags: ['security', 'domains', 'registrar', 'incident-response']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
description: 'Ein praktischer Leitfaden zu den fünf Wegen, wie Angreifer Domains in der realen Welt tatsächlich übernehmen – Social Engineering, Kompromittierung des Registrar-Kontos, Übernahme des DNS-Anbieters, NS-Hijacking und Rückforderung abgelaufener Domains – sowie die spezifischen Kontrollmechanismen, die jeden einzelnen blockieren.'
ogImage: ../../assets/how-domain-hijacking-actually-happens-og.jpg
keywords: ['Domain-Hijacking', 'Domain-Sicherheit', 'Registrar-Lock', 'Transfer-Lock', 'DNSSEC', 'Zwei-Faktor-Authentifizierung', 'Social Engineering', 'Dangling DNS', 'Namefi']
relatedArticles:
  - /de/blog/the-fox-it-dns-hijack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-badgerdao-frontend-attack/
  - /de/blog/the-lenovo-com-dns-hijack/
  - /de/blog/the-perl-com-domain-theft/
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
  - /de/glossary/tld/
  - /de/glossary/registry/
---

„[Domain-Hijacking](/de/glossary/domain-hijacking/)“ (Domain-Entführung) ist einer dieser Begriffe, die dramatisch klingen, aber je nach Ablauf sehr unterschiedliche Dinge bedeuten können. Ein durch eine [Phishing](/de/glossary/phishing/)-E-Mail übernommenes [Registrar](/de/glossary/registrar/)-Konto ist ein Hijack. Ein stillschweigend bei einem [DNS](/de/glossary/dns/)-Anbieter ausgetauschter [Nameserver](/de/glossary/nameserver/)-Eintrag ist ein Hijack. Eine abgelaufene Domain, die sich jemand anderes schnappt und neu ausrichtet, ist in gewissem Sinne ebenfalls ein Hijack.

In jedem Fall ist das Ergebnis dasselbe: Jemand anderes teilt der Welt nun mit, wohin Ihr Name verweist. E-Mails, Zahlungen, Login-Prozesse und SaaS-Integrationen leiten plötzlich Datenverkehr an den Angreifer weiter. Die Wiederherstellung dauert oft Tage, manchmal Wochen. Wurde die Domain zu einem anderen Registrar transferiert, kann die [Transfer Dispute Resolution Policy (TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.) der [ICANN](/de/glossary/icann/) relevant sein; andere Fälle erfordern oft eine Eskalation beim Registrar, bei der [Registry](/de/glossary/registry/) (Vergabestelle), eine Wiederherstellung über die Plattform oder einen Gerichtsbeschluss. Die schnellste Lösung besteht darin, gar nicht erst in diese Situation zu geraten.

Dieser Artikel beleuchtet die fünf Angriffswege, die wir am häufigsten beobachten, wie jeder einzelne aus Sicht der Verteidiger aussieht und welche spezifischen Kontrollmechanismen sie tatsächlich stoppen.

## 1. Social Engineering gegen das Support-Team des Registrars

Die häufigsten aufsehenerregenden Hijacks des letzten Jahrzehnts beinhalteten keinerlei technische Exploits. Sie begannen mit einem Telefonanruf.

Das Muster: Ein Angreifer sammelt ausreichend Informationen über ein Ziel – [WHOIS](/de/glossary/whois/)-Historie, LinkedIn, geleakte Passwort-Dumps, Social Media – und ruft dann an oder schreibt dem Support-Team des Registrars eine E-Mail, wobei er sich als Eigentümer ausgibt. Er bittet um das Zurücksetzen des Passworts, eine Änderung der E-Mail-Adresse oder einen Transfer-[Auth-Code](/de/glossary/auth-code/). Wenn der Support-Mitarbeiter eine Checkliste abarbeitet, auf die sich der Angreifer vorbereitet hat, wechselt das Konto den Besitzer.

Dies war der Mechanismus hinter einigen der schädlichsten Hijacks von Kryptowährungsbörsen, Werbeplattformen und Infrastrukturmarken. Es erfordert keine Schwachstelle im Code des Registrars; es nutzt den Faktor Mensch aus.

**Was es stoppt:**

- **Eine strikte Regelung seitens des Registrars**, dass Eigentümerwechsel entweder ein notariell beglaubigtes Dokument oder eine Multi-Faktor-Abfrage über den bestehenden Kanal des Registranten erfordern.
- **Registry Lock** (unabhängig vom Registrar Lock), bei dem der Registry-Betreiber selbst Transfers oder Kontaktänderungen ohne eine Out-of-Band-Bestätigung verweigert. Verfügbar für `.com`, `.net` und viele ccTLDs.
- **Überprüfen, welchen Registrar Sie tatsächlich nutzen**, und Löschen der anderen. Marken, die 2007 gestartet sind, haben oft noch verwaiste Konten bei drei oder vier Registraren mit schwachen Zugangsdaten.

## 2. Kompromittierung des Registrar-Kontos (der Weg über Zugangsdaten)

Der technische Cousin des Social Engineerings. Der Angreifer erbeutet die Zugangsdaten für das Registrar-Konto per Phishing oder findet sie in einem Credential-Stuffing-Dump und meldet sich direkt an. Von dort aus entsperrt er die Domain, ändert die Kontakt-E-Mail-Adresse und fordert einen Transfer an.

**Was es stoppt:**

- **Phishing-resistente 2FA auf dem Registrar-Konto.** TOTP über eine Authenticator-App ist das Minimum; Hardware-Schlüssel (WebAuthn / FIDO2) sind das Optimum. SMS-basierte 2FA ist nicht ausreichend – SIM-Swapping-Angriffe haben diese immer wieder umgangen. Die [CISA-Richtlinie](https://www.cisa.gov/secure-our-world/turn-mfa) der US-Regierung empfiehlt ausdrücklich, auf SMS zu verzichten.
- **Ein Registrar, der Lock-Funktionen pro Domain unterstützt** (zusätzlich zu Kontosperren), sodass eine einzelne Kompromittierung nicht alles auf einmal entsperren kann.
- **Audit-Trails und Warnmeldungen** bei Kontaktänderungen, Nameserver-Änderungen und Transferanfragen. Der erste Schritt des Angreifers besteht darin, diese Benachrichtigungen stummzuschalten; wenn sie an einen Kanal gesendet werden, den der Angreifer nicht kontrolliert, gewinnen Sie wertvolle Vorwarnzeit.

## 3. Übernahme des DNS-Anbieters

Selbst wenn das Registrar-Konto sicher verriegelt ist, verweisen die vom Registrar publizierten *Nameserver* möglicherweise auf einen DNS-Anbieter mit einem separaten Konto – Cloudflare, Route 53, NS1, DNSimple oder Ihr eigener BIND-Server. Gelangt der Angreifer in dieses DNS-Konto, muss er den Registrar gar nicht anrühren. Er ändert einfach die A-, MX- und TXT-Einträge, und der Datenverkehr folgt.

Dies ist für Angreifer oft der einfachere Weg, da Marken viel in die Sicherheit des Registrars investieren, den DNS-Anbieter jedoch oft als „Infrastruktur“ mit schwächeren Kontrollen betrachten.

**Was es stoppt:**

- **Die gleiche strikte 2FA beim DNS-Anbieter wie beim Registrar.** Behandeln Sie es als ebenso sensibel. Das ist es nämlich.
- **[DNSSEC](/de/glossary/dnssec/)**, auf Zonen-Ebene signiert. DNSSEC verhindert nicht die Kompromittierung eines DNS-Anbieterkontos: Wenn ein Angreifer Einträge über den Anbieter veröffentlichen kann und der Anbieter diese mit den aktiven Schlüsseln der Zone signiert, behandeln validierende Resolver diese Antworten als authentisch. Was DNSSEC jedoch blockiert, sind In-Path-Manipulationen, Cache-Poisoning und gefälschte Antworten, die unsigniert oder falsch signiert sind, vorausgesetzt die übergeordnete Zone (Parent) veröffentlicht die korrekten DS-Einträge. Siehe [RFC 4033-4035](https://datatracker.ietf.org/doc/html/rfc4033) für Details zum Protokoll.
- **Multi-Provider-DNS** mit separaten Konten und Zugangsdaten unter Verwendung von [Multi-Signer-DNSSEC](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.). Dies hilft bei der Verfügbarkeit und der Isolierung der Anbieter, funktioniert jedoch nur, wenn jeder Anbieter die beabsichtigten Zonendaten bereitstellt und die DNSKEY/DS-Sets korrekt koordiniert sind. Es ist kein magischer Schutz, bei dem Resolver automatisch den unkompromittierten Anbieter bevorzugen.

## 4. Nameserver-Hijacks durch verwaiste Delegierungen und Dangling Records

Eine subtilere Variante: Die Domain selbst ist in Ordnung, aber eine *[Subdomain](/de/glossary/subdomain/)* verweist (über einen CNAME- oder NS-Eintrag) auf einen Drittanbieter-Dienst, den der ursprüngliche Besitzer nicht mehr kontrolliert. Der Angreifer registriert die Ressource beim Drittanbieter und übernimmt so die Antworten für diese Subdomain.

Beispiele:

- Ein CNAME-Eintrag einer Subdomain verweist auf eine alte Heroku-, S3- oder Azure-Ressource, die freigegeben wurde. Der Angreifer registriert diesen Ressourcennamen neu und erhält ein gültiges TLS-Zertifikat.
- Ein delegierter `NS`-Eintrag verweist auf ein DNS-Anbieterkonto, das gelöscht wurde. Der Angreifer erstellt ein neues Konto mit genau diesem Host-Muster und liefert beliebige Einträge für die Subdomain aus.

Diese Fälle werden unter dem Sammelbegriff **Dangling DNS** zusammengefasst. Sie sind heute die häufigste Form „echter“ Domain-Hijacks im offenen Web, da die meisten großen Organisationen Hunderte oder Tausende von Subdomains besitzen und nur einen Bruchteil davon prüfen.

**Was es stoppt:**

- **Eine vollständige Inventarisierung jedes NS-, CNAME- und ALIAS-Eintrags** in jeder Zone, die Sie besitzen, inklusive eines Verantwortlichen für jeden Eintrag.
- **Automatisierte Dangling-DNS-Scanner**, die jeden Eintrag nach Zeitplan neu auflösen und jene markieren, die auf Drittanbieter-Dienste verweisen, welche nicht mehr reagieren. Der [GitHub-Blog](https://github.blog/2021-12-13-securing-our-home-labs-frigate-version-bump/) und [Detectify Labs](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/) haben ausführliche Artikel zu dieser Angriffsklasse.
- **Löschung der Einträge noch am selben Tag**, an dem Sie den zugrunde liegenden Dienst außer Betrieb nehmen.

## 5. Rückforderung abgelaufener Domains

Der einfachste und am wenigsten beachtete Angriff: Der Registrant hat vergessen, die Domain zu verlängern. Die Schonfrist ([Grace Period](/de/glossary/grace-period/)) verstreicht. Die Domain fällt in den Pool zurück. Jemand anderes registriert sie.

Das klingt nach einem operativen Fehler, nicht nach einem Sicherheitsvorfall, aber die Auswirkungen sind identisch – jemand anderes kontrolliert nun den Namen, und all die Vertrauenssignale, die über Jahre hinweg aufgebaut wurden (SPF, DKIM, OAuth-Callbacks, E-Mails zum Zurücksetzen von Passwörtern, Zahlungsintegrationen), fließen plötzlich an einen Fremden. Bei mehreren öffentlichen Vorfällen haben Angreifer abgelaufene Domains gezielt gekauft, weil der Vorbesitzer diese als `iss`-Claim in OAuth-Tokens oder als Absender für Transaktions-E-Mails registriert hatte.

**Was es stoppt:**

- **Mehrjährige Verlängerung** (5–10 Jahre) für jede Domain, die mit Authentifizierung, Zahlungen oder Produktionsdatenverkehr in Berührung kommt. Die Kosten sind minimal; der Schutz ist enorm.
- **Automatische Verlängerung (Auto-Renew) mit einer Zahlungsmethode, die nicht unbemerkt fehlschlagen kann.** Abgelaufene Kreditkarten sind die häufigste Ursache für ungewollte Domain-Abläufe.
- **Kalendererinnerungen** bei 90, 60, 30 und 7 Tagen, die an eine *Team*-E-Mail-Adresse gesendet werden, nicht an das Postfach einer einzelnen Person, die das Unternehmen vielleicht irgendwann verlässt.

## Wie eine gute Absicherung aussieht

Fassen wir die Kontrollmechanismen zusammen. Die Basisabsicherung für jede wichtige Domain sieht so aus:

| Kontrollmechanismus | Blockiert Angriffsweg |
| -------------------------------------- | ----------------------------------------------- |
| Hardware-Schlüssel 2FA beim Registrar | Kontokompromittierung (Weg 2) |
| Hardware-Schlüssel 2FA beim DNS-Anbieter | DNS-Übernahme (Weg 3) |
| Registry Lock (falls verfügbar) | Social Engineering (Weg 1) |
| DNSSEC (auf Zonen-Ebene signiert) | DNS-In-Path-Manipulation und gefälschte Antworten |
| Subdomain-Inventarisierung + Dangling-Scanner | Subdomain-Hijack (Weg 4) |
| 5–10 Jahre Verlängerung + Auto-Renew | Ungewolltes Ablaufen (Weg 5) |
| Warnmeldungen bei Kontakt-/NS-/Transfer-Änderungen | Alle fünf (Sie werden frühzeitig gewarnt) |

Wenn Sie für eine Domain verantwortlich sind und nicht in jeder Zeile einen Haken setzen können, wird die Arbeit für Angreifer erheblich leichter.

## Wie Namefi die Situation verändert

Die meisten der oben genannten Kontrollen existieren als Funktionen bei einem Registrar, einem DNS-Anbieter oder in einem Workflow-Tool, und die Sicherheit hängt stets vom schwächsten Konto ab. Namefi tokenisiert die Beziehung zum Registranten [on-chain](/de/glossary/on-chain/). Das bedeutet, dass der maßgebliche Nachweis darüber, *wem dieser Name gehört*, außerhalb der Kundendatenbank eines einzelnen Registrars liegt. Ein Support-Mitarbeiter bei irgendeinem Anbieter kann das Eigentum nicht einfach stillschweigend ändern, ohne dass eine signierte Transaktion vorliegt, die der rechtmäßige Eigentümer genehmigen muss. Der Registrar übernimmt weiterhin die technische Delegierung, aber die *Kontrollschicht* wird an einen Ort verlagert, an dem Social Engineering wirkungslos ist.

Das ist kein vollständiger Ersatz für die Kontrollen in der obigen Tabelle – Sie benötigen weiterhin DNSSEC, Sie benötigen weiterhin 2FA beim DNS-Anbieter und Sie müssen die Domain weiterhin verlängern. Aber es streicht den häufigsten Hijack-Vektor mit den schwerwiegendsten Folgen (Weg 1) komplett aus dem Bedrohungsmodell.

## Quellen und weiterführende Literatur

- ICANN — [Geltungsbereich der Transfer Dispute Resolution Policy](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.).
- IETF — [DNSSEC RFCs 4033/4034/4035](https://datatracker.ietf.org/doc/html/rfc4033) und [Multi-Signer DNSSEC RFC 8901](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.).
- CISA — [Leitfaden zur Multi-Faktor-Authentifizierung](https://www.cisa.gov/secure-our-world/turn-mfa).
- Detectify Labs — [Bericht über feindliche Subdomain-Übernahmen](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/).
- Verisign — [Registry Lock für .com/.net](https://www.verisign.com/en_US/channel-resources/domain-registry-products/registry-lock/index.xhtml).