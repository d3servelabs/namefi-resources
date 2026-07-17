---
title: DNS
date: '2025-06-30'
language: de
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
description: Das hierarchische Namensystem, das menschenlesbare Domainnamen in IP-Adressen übersetzt, die Computer zur Weiterleitung von Datenverkehr im Internet verwenden.
keywords: ['DNS', 'Domain Name System', 'Namensauflösung', 'DNS-Lookup', 'DNS-Einträge', 'Nameserver', 'Rekursiver Resolver', 'DNSSEC', 'Internetinfrastruktur']
also_known_as: ['Domain Name System']
level: 2
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.iana.org/domains/root
  - https://www.cloudflare.com/learning/dns/what-is-dns/
  - https://www.icann.org/resources/pages/what-2012-02-25-en
relatedArticles:
  - /de/blog/what-are-tokenized-domains/
  - /de/blog/the-myetherwallet-bgp-dns-attack/
  - /de/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /de/blog/the-sea-turtle-dns-espionage/
  - /de/blog/the-dnspionage-campaign/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/name-change-game-change/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/tld/
  - /de/glossary/icann/
  - /de/glossary/registry/
  - /de/glossary/web3/
---

**DNS** (das *Domain Name System*) ist das verteilte, hierarchische Namensystem des Internets, das menschenlesbare Domainnamen – wie `example.com` – in die [IP-Adressen](/de/glossary/ip-address/) übersetzt, die Netzwerkgeräte zur Weiterleitung von Paketen über das Internet verwenden. Ohne DNS müsste sich jeder Nutzer die numerischen Adressen aller Websites merken, die er besuchen möchte. Das DNS, definiert in [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034) und [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035) (1987 von der IETF veröffentlicht und noch heute grundlegend), bleibt eines der Kernprotokolle des Internets.

## Was DNS leistet

DNS führt **Namensauflösung** durch: Zu einem Domainnamen liefert es die zugehörigen Ressourceneinträge zurück – am häufigsten eine [IP-Adresse](/de/glossary/ip-address/), damit ein Browser oder eine Anwendung weiß, wohin sie ihre Verbindungsanfrage senden soll. Das System wird auch zum Routen von E-Mail (MX-Einträge), zur Verifizierung von Domain-Eigentum (TXT-Einträge) und zur Delegation der Zuständigkeit über eine Zone an eine bestimmte Gruppe von Servern (NS-Einträge) verwendet.

Da DNS weitaus häufiger gelesen als aktualisiert wird, ist das Protokoll für schnelle, gecachte Lesevorgänge optimiert, die über Millionen von Servern weltweit verteilt sind – nicht für sofortige Konsistenz.

## Wie eine DNS-Abfrage funktioniert

Wenn Sie `example.com` in einen Browser eingeben, beginnt ein mehrstufiger Auflösungsprozess:

1. **Lokaler Cache-Check.** Das Betriebssystem prüft zunächst seinen eigenen DNS-Cache. Wenn dort eine aktuelle, noch gültige Antwort gespeichert ist, endet die Abfrage sofort.

2. **Rekursiver Resolver.** Wenn keine gecachte Antwort vorliegt, wird die Anfrage an einen [DNS-Resolver](/de/glossary/dns-resolver/) weitergeleitet – einen Server, der von Ihrem ISP, einem Unternehmen (wie Cloudflares `1.1.1.1` oder Googles `8.8.8.8`) oder Ihrer Organisation betrieben wird. Dieser Resolver übernimmt die Arbeit, die Antwort in Ihrem Namen zu finden; diese Betriebsart wird **rekursive Auflösung** genannt.

3. **Root-Nameserver.** Hat der Resolver keine gecachte Antwort, kontaktiert er einen der 13 logischen [Root-Zone](/de/glossary/root-zone/)-Nameserver-Cluster (mit Buchstaben `a` bis `m` bezeichnet). Der Root-Server kennt die endgültige Antwort nicht, antwortet aber mit einer Verweisung auf die [Nameserver](/de/glossary/nameserver/), die für die relevante Top-Level-Domain (TLD) zuständig sind, wie `.com` oder `.org`. Die [IANA](https://www.iana.org/domains/root) veröffentlicht und pflegt die Root-Zone-Datenbank.

4. **TLD-Nameserver.** Der Resolver fragt die TLD-Nameserver ab. Sie antworten mit einer Verweisung auf die **autoritativen Nameserver** für die spezifische Domain (`example.com`).

5. **Autoritative Nameserver.** Der Resolver fragt den autoritativen [Nameserver](/de/glossary/nameserver/) der Domain ab, der die eigentlichen DNS-Einträge enthält. Der autoritative Server gibt den Ressourceneintrag zurück – beispielsweise einen `A`-Eintrag mit einer IPv4-Adresse.

6. **Antwort und Caching.** Der Resolver gibt die Antwort an den Client zurück und speichert sie für die Dauer, die durch den [TTL](/de/glossary/ttl/) (Time to Live) des Eintrags festgelegt ist. Nachfolgende Anfragen für denselben Namen innerhalb des TTL-Zeitfensters werden aus dem Cache bedient, wodurch Latenz und Last auf vorgelagerten Servern reduziert werden.

Dieses Muster – bei dem der Resolver die iterative Arbeit erledigt und der Client nur mit einem Server kommuniziert – wird **rekursive Auflösung** genannt. Im Gegensatz dazu steht die **iterative Auflösung**, bei der der Client selbst jede Ebene der Hierarchie der Reihe nach abfragt; dies ist in der Praxis selten, beschreibt aber, wie Resolver intern die Hierarchie durchlaufen ([RFC 1034 §5.3](https://datatracker.ietf.org/doc/html/rfc1034#section-5.3)).

## Die DNS-Hierarchie und wichtige Eintragstypen

DNS ist als invertierter Baum organisiert. Die Wurzel (`.`) steht an der Spitze; darunter befinden sich TLDs (`.com`, `.net`, `.io`, Länderkürzel wie `.de`); darunter Second-Level-Domains (`example.com`); und diese können beliebig tiefe Subdomains haben (`mail.example.com`).

Jeder Knoten in diesem Baum wird als **Zone** bezeichnet, und der autoritative Nameserver für eine Zone enthält die **Ressourceneinträge** dieser Zone. Die am häufigsten anzutreffenden [DNS-Eintragstypen](/de/glossary/dns-record-types/) sind:

| Eintrag | Zweck | Beispielwert |
|---------|-------|--------------|
| **A** | Ordnet einen Namen einer IPv4-Adresse zu | `93.184.216.34` |
| **AAAA** | Ordnet einen Namen einer IPv6-Adresse zu | `2606:2800:21f:cb07::1` |
| **CNAME** | Aliasiert einen Namen auf einen anderen kanonischen Namen | `www → example.com` |
| **MX** | Legt Mailserver für die Domain mit Priorität fest | `10 mail.example.com` |
| **NS** | Delegiert eine Zone an eine Gruppe von Nameservern | `ns1.example.com` |
| **TXT** | Speichert beliebigen Text; verwendet für SPF, DKIM, Domain-Verifizierung | `"v=spf1 include:…"` |
| **SOA** | Start of Authority — Metadaten über die Zone selbst | Seriennummer, Aktualisierungs-, Wiederholungszeiten |

`CNAME`-Einträge können nicht am Zonen-Apex (der bloßen Domain `example.com`) platziert werden, da ein `CNAME` der einzige Eintrag an einem Namen sein muss, der Apex aber auch `NS`- und `SOA`-Einträge erfordert. Viele DNS-Anbieter umgehen dies mit proprietärem „CNAME-Flattening" oder `ALIAS`/`ANAME`-Pseudo-Eintragstypen.

## Wer DNS betreibt

DNS-Governance und -Betrieb ist auf mehrere Akteure verteilt:

- **[ICANN](/de/glossary/icann/) / IANA.** Die Internet Corporation for Assigned Names and Numbers überwacht die [Root-Zone](/de/glossary/root-zone/) und koordiniert den globalen DNS-Namensraum. IANA, eine Funktion von ICANN, pflegt die [Root-Zone-Datenbank](https://www.iana.org/domains/root), die alle TLDs und deren autoritative Nameserver auflistet.

- **Registries.** Eine [Registry](/de/glossary/registry/) betreibt die autoritative Datenbank für eine bestimmte TLD. Verisign betreibt zum Beispiel `.com` und `.net`; die Public Interest Registry betreibt `.org`. Registries veröffentlichen und pflegen die NS-Einträge, die auf die Nameserver jeder Domain verweisen.

- **Registrare.** Ein [Registrar](/de/glossary/registrar/) ist eine von ICANN (oder der jeweiligen Registry) akkreditierte Organisation, die Domainnamen an die Öffentlichkeit verkauft und Registrierungsdaten im Auftrag von Kunden bei der Registry einreicht.

- **Rekursive Resolver.** DNS-Resolver werden von ISPs, öffentlichen DNS-Diensten (Cloudflare, Google, Quad9), Unternehmen und Heimroutern betrieben. Sie führen die oben beschriebenen iterativen Abfragen durch und cachen Ergebnisse, um die Abfragelatenz zu reduzieren ([Cloudflare Learning — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)).

- **Autoritative Nameserver.** Von Domain-Inhabern oder deren DNS-Anbietern gehostet, enthalten diese Server die eigentlichen Zonendateien und antworten auf Resolver-Anfragen mit definitiven Antworten.

## Sicherheit

Die ursprünglichen DNS-Spezifikationen wurden auf Zuverlässigkeit und Skalierbarkeit ausgelegt, nicht auf Sicherheit. Im Laufe der Zeit sind mehrere Schwachstellen und Schutzmaßnahmen entstanden:

**Cache Poisoning.** Ein Angreifer, der eine gefälschte DNS-Antwort in den Cache eines Resolvers einschleusen kann, kann Nutzer ohne deren Wissen von legitimen Seiten auf bösartige umleiten. Der Kaminsky-Angriff (2008) demonstrierte dies in großem Maßstab und führte zur weiteren Verbreitung von Port-Randomisierung und [DNSSEC](/de/glossary/dnssec/).

**DNSSEC.** Die DNS Security Extensions, in RFC 4033–4035 definiert, fügen kryptografische Signaturen zu DNS-Einträgen hinzu. Ein Resolver, der [DNSSEC](/de/glossary/dnssec/)-Signaturen validiert, kann manipulierte Antworten erkennen. Die Verbreitung wächst, ist aber ungleichmäßig: Stand 2024 sind etwa 90 % der Root-Zone und der großen TLDs signiert, aber die End-to-End-Validierung hängt davon ab, dass alle Zonen in der Kette signiert sind und Resolver Signaturen prüfen.

**DNS-Hijacking.** Angreifer, die ein Registrar-Konto, Registry-Systeme oder den Resolver eines ISPs kompromittieren, können DNS-Antworten in großem Maßstab umleiten. Schutzmaßnahmen umfassen Multi-Faktor-Authentifizierung auf Registrar-Ebene, Registry-Sperren (EPP `serverTransferProhibited`) und die Überwachung auf unerwartete NS- oder A-Eintragsänderungen.

**DNS over HTTPS / DNS over TLS (DoH / DoT).** Diese Protokolle verschlüsseln DNS-Anfragen zwischen Clients und Resolvern, verhindern das Abhören und die pfadbasierte Modifikation von Anfragen während der Übertragung – ein ergänzender Schutz zu DNSSEC, der Datenintegrität statt Privatsphäre adressiert.

## DNS und tokenisierte Domains

Einige blockchain-basierte Domain-Systeme (wie der Ethereum Name Service) pflegen ihre eigenen Name→Adresse-Zuordnungen vollständig On-Chain, unabhängig von der traditionellen DNS-Hierarchie. Andere vergeben On-Chain-Token, die das Eigentum an einer konventionell registrierten Domain repräsentieren, wobei die zugrundeliegende DNS-Zonendatei weiterhin auf Standard-Nameservern gehostet wird. Im letzteren Fall funktioniert die DNS-Auflösung über den oben beschriebenen normalen Lookup-Ablauf; der Blockchain-Eintrag belegt das Eigentum, ist aber nicht Teil des Auflösungspfads. Die beiden Systeme – On-Chain-Eigentumsnachweise und das globale DNS – sind eigenständige Schichten, die koexistieren oder über Gateway-Resolver verbunden werden können.

---

*Quellen: [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034), [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035), [IANA Root Zone Database](https://www.iana.org/domains/root), [Cloudflare Learning — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/), [ICANN — What is DNS?](https://www.icann.org/resources/pages/what-2012-02-25-en)*
