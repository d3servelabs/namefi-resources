---
title: 'Wie Domain-Hijacking wirklich abläuft: Fünf Angriffswege und die Kontrollmechanismen, die sie stoppen'
date: '2026-05-10'
language: de
tags: ['security', 'domains', 'registrar', 'incident-response']
authors: ['namefiteam']
draft: false
description: 'Ein praktischer Leitfaden zu den fünf Methoden, mit denen Angreifer in der Praxis Domains übernehmen – Social Engineering, Kompromittierung von Registrar-Konten, Übernahme von DNS-Anbietern, NS-Hijacking und die Rückgewinnung abgelaufener Domains – und die spezifischen Maßnahmen, die jede einzelne davon blockieren.'
ogImage: ../../assets/how-domain-hijacking-actually-happens-og.jpg
keywords: ['Domain-Hijacking', 'Domain-Sicherheit', 'Registrar-Lock', 'Transfer-Lock', 'DNSSEC', 'Zwei-Faktor-Authentifizierung', 'Social Engineering', 'Dangling DNS', 'Namefi']
---

"Domain-Hijacking" ist einer dieser Begriffe, die dramatisch klingen, aber je nach Hergang sehr unterschiedliche Bedeutungen haben. Ein durch eine Phishing-E-Mail übernommenes Registrar-Konto ist ein Hijack. Ein stillschweigend bei einem DNS-Anbieter ausgetauschter Nameserver-Eintrag ist ein Hijack. Eine abgelaufene Domain, die sich jemand anderes schnappt und umleitet, ist in gewissem Sinne ebenfalls ein Hijack.

In jedem Fall ist das Ergebnis dasselbe: Jemand anderes teilt der Welt nun mit, wohin Ihr Name verweist. E-Mails, Zahlungen, Login-Prozesse und SaaS-Integrationen leiten plötzlich ihren gesamten Traffic an den Angreifer. Die Wiederherstellung dauert oft Tage, manchmal Wochen. Wenn die Domain zu einem anderen Registrar transferiert wurde, kann die [Transfer Dispute Resolution Policy (TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.) der ICANN relevant sein; in anderen Fällen sind oft Eskalationen beim Registrar oder der Registry (Vergabestelle), Plattform-Wiederherstellungen oder ein Gerichtsbeschluss erforderlich. Die schnellste Lösung besteht darin, gar nicht erst in diese Lage zu geraten.

Dieser Beitrag beleuchtet die fünf Angriffswege, die wir am häufigsten sehen, wie jeder einzelne aus Sicht des Verteidigers aussieht und welche spezifischen Kontrollmechanismen sie tatsächlich stoppen.

## 1. Social Engineering gegen das Support-Team des Registrars

Die häufigsten aufsehenerregenden Hijacks des letzten Jahrzehnts beinhalteten keine technischen Exploits. Sie bestanden aus einem Telefonanruf.

Das Muster: Ein Angreifer sammelt genügend Informationen über ein Ziel – WHOIS-Historie, LinkedIn, geleakte Passwort-Datenbanken, Social Media – und ruft dann beim Support-Team des Registrars an oder schreibt eine E-Mail, wobei er sich als Eigentümer ausgibt. Er bittet um das Zurücksetzen eines Passworts, eine E-Mail-Änderung oder einen Transfer-Auth-Code. Wenn der Support-Mitarbeiter eine Checkliste abarbeitet, auf die sich der Angreifer vorbereitet hat, wechselt das Konto den Besitzer.

Dies war der Mechanismus hinter einigen der schädlichsten Hijacks, die Kryptowährungsbörsen, Werbeplattformen und Infrastruktur-Marken betrafen. Es erfordert keine Schwachstelle im Code des Registrars; es nutzt den Faktor Mensch aus.

**Was es stoppt:**

- **Eine strikte Regel auf Seiten des Registrars**, dass Inhaberwechsel entweder ein notariell beglaubigtes Dokument oder eine Multi-Faktor-Abfrage über den bestehenden Kanal des Registranten erfordern.
- **Registry Lock** (unabhängig vom Registrar Lock), bei dem der Betreiber der Vergabestelle (Registry) Änderungen bezüglich Transfer oder Kontaktangaben ohne eine Out-of-Band-Bestätigung strikt ablehnt. Verfügbar für `.com`, `.net` und viele ccTLDs.
- **Die Überprüfung, welchen Registrar Sie tatsächlich nutzen**, und das Entfernen der anderen. Marken, die 2007 gestartet sind, haben oft noch verwaiste Konten mit schwachen Zugangsdaten bei drei oder vier Registraren.

## 2. Kompromittierung des Registrar-Kontos (der Weg über die Zugangsdaten)

Der technische Verwandte des Social Engineerings. Der Angreifer erbeutet die Zugangsdaten für das Registrar-Konto durch Phishing oder findet sie in einem Credential-Stuffing-Dump und loggt sich direkt ein. Von dort aus entsperrt er die Domain, ändert die Kontakt-E-Mail und beantragt einen Transfer.

**Was es stoppt:**

- **Phishing-resistente 2FA für das Registrar-Konto.** TOTP via Authenticator-App ist das Minimum; Hardware-Schlüssel (WebAuthn / FIDO2) sind das Optimum. SMS-basierte 2FA ist nicht ausreichend – SIM-Swapping-Angriffe haben diese Methode wiederholt ausgehebelt. Der [CISA-Leitfaden](https://www.cisa.gov/secure-our-world/turn-mfa) der US-Regierung empfiehlt ausdrücklich, auf SMS zu verzichten.
- **Ein Registrar, der Per-Domain-Locks** zusätzlich zu kontoübergreifenden Sperren unterstützt, sodass bei der Kompromittierung eines einzelnen Kontos nicht alles auf einmal entsperrt werden kann.
- **Audit-Trails und Warnmeldungen (Alerting)** bei Kontaktänderungen, Nameserver-Änderungen und Transferanfragen. Der erste Schritt des Angreifers besteht darin, diese Warnungen zum Schweigen zu bringen; wenn sie an einen Kanal gesendet werden, den der Angreifer nicht kontrolliert, gewinnen Sie Zeit zur Reaktion.

## 3. Übernahme des DNS-Anbieters

Selbst wenn das Registrar-Konto abgesichert ist, können die *Nameserver*, die der Registrar veröffentlicht, auf einen DNS-Anbieter mit einem separaten Konto verweisen – Cloudflare, Route 53, NS1, DNSimple oder Ihr eigener BIND-Server. Wenn der Angreifer in dieses DNS-Konto eindringt, muss er den Registrar gar nicht antasten. Er ändert einfach die A-, MX- und TXT-Records, und der Traffic folgt automatisch.

Für Angreifer ist dies oft der leichtere Weg, da Marken zwar in die Sicherheit des Registrars investieren, den DNS-Anbieter jedoch oft als "Infrastruktur" mit schwächeren Kontrollen betrachten.

**Was es stoppt:**

- **Die gleiche strikte 2FA beim DNS-Anbieter-Konto wie beim Registrar.** Behandeln Sie es als genauso sensibel. Das ist es nämlich.
- **DNSSEC**, signiert auf Zonen-Ebene. DNSSEC verhindert zwar keine Kompromittierung des Kontos beim DNS-Anbieter: Wenn ein Angreifer Einträge über den Anbieter veröffentlichen kann und der Anbieter diese mit den aktiven Schlüsseln der Zone signiert, werden validierende Resolver diese Antworten als authentisch behandeln. Was DNSSEC jedoch blockiert, sind In-Path-Manipulationen, Cache-Poisoning und gefälschte Antworten, die unsigniert oder falsch signiert sind, vorausgesetzt, die übergeordnete Zone (Parent) veröffentlicht die korrekten DS-Records. Siehe [RFC 4033-4035](https://datatracker.ietf.org/doc/html/rfc4033) für die Details zum Protokoll.
- **Multi-Provider-DNS** mit getrennten Konten und Zugangsdaten unter Verwendung von [Multi-Signer DNSSEC](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.). Dies hilft bei der Verfügbarkeit und Anbieter-Isolation, funktioniert aber nur, wenn jeder Anbieter die vorgesehenen Zonendaten bereitstellt und die DNSKEY/DS-Sets korrekt koordiniert sind. Es ist keine magische Überbrückung, bei der Resolver automatisch den nicht kompromittierten Anbieter bevorzugen.

## 4. Nameserver-Hijacks durch veraltete Delegierungen und Dangling Records

Eine subtilere Variante: Die Domain selbst ist intakt, aber eine *Subdomain* verweist (via CNAME- oder NS-Record) auf einen Drittanbieter-Dienst, den der ursprüngliche Besitzer nicht mehr kontrolliert. Der Angreifer registriert die Ressource auf Seiten des Drittanbieters und antwortet nun im Namen der Subdomain.

Beispiele:

- Ein CNAME-Eintrag einer Subdomain auf eine alte Heroku-, S3- oder Azure-Ressource, die freigegeben wurde. Der Angreifer sichert sich diesen Ressourcennamen erneut und erhält ein gültiges TLS-Zertifikat.
- Ein delegierter `NS`-Eintrag, der auf ein gelöschtes Konto bei einem DNS-Anbieter verweist. Der Angreifer erstellt ein neues Konto mit exakt diesem Host-Muster und liefert für die Subdomain beliebige Einträge aus.

Diese Fälle werden unter dem Sammelbegriff **Dangling DNS** zusammengefasst. Sie sind heute die häufigste Form "echter" Domain-Hijacks im offenen Internet, da die meisten großen Organisationen Hunderte oder Tausende von Subdomains besitzen und nur einen Bruchteil davon auditieren.

**Was es stoppt:**

- **Ein vollständiges Inventar aller NS-, CNAME- und ALIAS-Records** in jeder Zone, die Ihnen gehört, mit einem Verantwortlichen für jeden Eintrag.
- **Automatisierte Dangling-DNS-Scanner**, die jeden Eintrag nach Zeitplan neu auflösen und jene markieren, die auf nicht mehr reagierende Drittanbieter-Dienste verweisen. Der [GitHub Blog](https://github.blog/2021-12-13-securing-our-home-labs-frigate-version-bump/) und [Detectify Labs](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/) bieten ausführliche Berichte über diese Angriffsklasse.
- **Das Löschen von Einträgen am selben Tag**, an dem Sie den zugrundeliegenden Dienst abschalten.

## 5. Rückgewinnung abgelaufener Domains

Der simpelste und am wenigsten mitleiderregende Angriff: Der Inhaber hat vergessen, die Domain zu verlängern. Die Nachfrist (Grace Period) verstreicht. Die Domain fällt zurück in den Pool. Jemand anderes registriert sie.

Das klingt nach einem betrieblichen Fehler und nicht nach einem Sicherheitsvorfall, doch die Auswirkungen sind identisch: Jemand anderes kontrolliert nun den Namen, und alle Vertrauenssignale, die über Jahre hinweg aufgebaut wurden (SPF, DKIM, OAuth-Callbacks, E-Mails zum Zurücksetzen von Passwörtern, Zahlungsintegrationen), fließen plötzlich zu einem Fremden. Bei mehreren öffentlich gewordenen Vorfällen kauften Angreifer abgelaufene Domains gezielt deshalb, weil der Vorbesitzer sie als `iss`-Claim in OAuth-Tokens oder als Absender für Transaktions-E-Mails registriert hatte.

**Was es stoppt:**

- **Mehrjährige Verlängerungen** (5-10 Jahre) für jede Domain, die mit Authentifizierung, Zahlungen oder Produktions-Traffic in Berührung kommt. Die Kosten sind trivial; der Schutz hingegen ist enorm.
- **Automatische Verlängerung (Auto-Renewal) mit einer Zahlungsmethode, die nicht unbemerkt fehlschlagen kann.** Abgelaufene Kreditkarten sind die mit Abstand häufigste Ursache für ein versehentliches Ablaufen von Domains.
- **Kalendererinnerungen** bei 90, 60, 30 und 7 Tagen, die an eine *Team*-Adresse gesendet werden und nicht in den Posteingang einer Einzelperson, die das Unternehmen möglicherweise verlässt.

## Wie eine gute Absicherung aussieht

Fasst man die Kontrollmechanismen zusammen, sieht die Basisabsicherung für jede wichtige Domain wie folgt aus:

| Kontrollmechanismus | Blockiert Angriffsweg |
| -------------------------------------- | ----------------------------------------------- |
| Hardware-Schlüssel-2FA beim Registrar | Kontokompromittierung (Weg 2) |
| Hardware-Schlüssel-2FA beim DNS-Anbieter | DNS-Übernahme (Weg 3) |
| Registry Lock (wo verfügbar) | Social Engineering (Weg 1) |
| Auf Zonen-Ebene signiertes DNSSEC | DNS In-Path-Manipulationen und gefälschte Antworten |
| Subdomain-Inventar + Dangling-Scanner | Subdomain-Hijack (Weg 4) |
| 5-10 Jahre Verlängerung + Auto-Renew | Versehentliches Ablaufen (Weg 5) |
| Warnmeldungen bei Kontakt-/NS-/Transfer-Änderungen | Alle fünf (Sie erfahren es frühzeitig) |

Wenn Sie für eine Domain verantwortlich sind und nicht in jeder Zeile ein Häkchen setzen können, wird die Arbeit für den Angreifer erheblich leichter.

## Wie Namefi die Lage verändert

Die meisten der oben genannten Kontrollmechanismen existieren als Features bei einem bestimmten Registrar, einem DNS-Anbieter oder einem Workflow-Tool, und die Sicherheit hängt stets davon ab, welches Konto am schwächsten ist. Namefi tokenisiert die Beziehung zum Registranten on-chain. Das bedeutet, dass der maßgebliche Nachweis darüber, *wem dieser Name gehört*, außerhalb der Kundendatenbank eines einzelnen Registrars liegt. Ein Support-Mitarbeiter bei einem beliebigen Anbieter kann den Besitz nicht einfach unbemerkt ändern, ohne dass eine signierte Transaktion vorliegt, die der rechtmäßige Eigentümer genehmigen muss. Der Registrar betreibt zwar weiterhin die technische Delegierung, aber die *Kontroll*-Ebene (Control Layer) wird an einen Ort verlagert, an dem Social Engineering nicht funktioniert.

Dies ist kein vollständiger Ersatz für die Kontrollmechanismen in der obigen Tabelle – Sie benötigen weiterhin DNSSEC, Sie benötigen weiterhin 2FA beim DNS-Anbieter, Sie müssen Domains immer noch verlängern. Aber es entfernt den häufigsten Hijacking-Vektor mit den schwerwiegendsten Auswirkungen (Weg 1) komplett aus dem Bedrohungsmodell.

## Quellen und weiterführende Literatur

- ICANN — [Geltungsbereich der Transfer Dispute Resolution Policy](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.).
- IETF — [DNSSEC RFCs 4033/4034/4035](https://datatracker.ietf.org/doc/html/rfc4033) und [Multi-Signer DNSSEC RFC 8901](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.).
- CISA — [Leitfaden zur Multi-Faktor-Authentifizierung](https://www.cisa.gov/secure-our-world/turn-mfa).
- Detectify Labs — [Bericht über feindliche Subdomain-Übernahmen](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/).
- Verisign — [Registry Lock für .com/.net](https://www.verisign.com/en_US/channel-resources/domain-registry-products/registry-lock/index.xhtml).