---
title: TLD
date: '2026-05-22'
language: de
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
description: Eine Top-Level-Domain (TLD) ist das rechteste Label eines Domainnamens, z. B. .com, .org oder .de, delegiert über die IANA-Root-Zone unter ICANN-Aufsicht.
keywords: ['TLD', 'Top-Level-Domain', 'gTLD', 'ccTLD', 'neue gTLD', 'DNS', 'IANA', 'ICANN', 'Root-Zone', 'Domain-Registry']
also_known_as: ['Top-Level-Domain']
level: 2
sources:
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains
  - https://www.rfc-editor.org/rfc/rfc1591
  - https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains
relatedArticles:
  - /de/blog/what-is-a-tld/
  - /de/blog/top-tlds-to-secure-for-your-startup/
  - /de/blog/what-are-tokenized-domains/
  - /de/blog/how-tld-affects-domain-value/
  - /de/blog/top-tlds-to-secure-for-your-business/
relatedTopics:
  - /de/topics/choosing-a-tld/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/best-tlds-by-industry/
  - /de/series/domain-flipping-skills/
relatedGlossary:
  - /de/glossary/icann/
  - /de/glossary/registry/
  - /de/glossary/registrar/
  - /de/glossary/dns/
  - /de/glossary/web3/
---

**TLD** (*Top-Level-Domain*), auch als **Top-Level-Domain** bezeichnet, ist das rechteste Label in einem vollständig qualifizierten Domainnamen — das Segment nach dem letzten Punkt. In `www.example.com` ist die TLD `.com`; in `bbc.co.uk` ist es `.uk`. TLDs stehen an der Spitze der [DNS](/de/glossary/dns/)-Hierarchie und bilden das Fundament, auf dem jeder andere Domainname aufgebaut ist.

## Die Position der TLD in einem Domainnamen

Der [DNS](/de/glossary/dns/) ist ein hierarchisches, baumstrukturiertes Benennungssystem. Liest man einen Domainnamen von rechts nach links, erschließt sich diese Hierarchie:

1. **Root (`.`)** — Der unsichtbare Punkt ganz rechts. Die [Root-Zone](/de/glossary/root-zone/) ist der maßgebliche Ausgangspunkt: eine kleine Menge von Servern, die von [IANA](/de/glossary/iana/) betrieben werden und wissen, welche Nameserver für jede TLD maßgeblich sind.
2. **TLD** — Das erste sichtbare Label von rechts (`.com`, `.org`, `.de`). Jede TLD hat eigene maßgebliche Nameserver, die von einem [Registry](/de/glossary/registry/)-Betreiber betrieben werden.
3. **[Second-Level-Domain](/de/glossary/second-level-domain/)** — Das Label unmittelbar links der TLD (z. B. `example` in `example.com`). Das ist das, was Registranten bei einem Registrar kaufen.
4. **Subdomain** — Alle weiteren Label links davon (`www`, `mail`, `blog`), verwaltet von demjenigen, der die Second-Level-Domain kontrolliert.

Wenn ein Resolver `www.example.com` auflöst, fragt er zunächst einen Root-Server, wo `.com` zu finden ist, dann die `.com`-Registry-Nameserver, wo `example.com` liegt, und schließlich die Nameserver von `example.com` nach dem `www`-Eintrag. Diese Delegierungskette stellt sicher, dass kein einzelner Server alle Domainnamen kennen muss.

## Typen von TLDs

IANA unterteilt TLDs in mehrere Kategorien:

| Kategorie | Beispiele | Hinweise |
|-----------|-----------|----------|
| **[gTLD](/de/glossary/gtld/)** (generisch) | `.com`, `.net`, `.org`, `.info` | Ursprünglich uneingeschränkt oder breit gefasst; die am häufigsten verwendete Klasse |
| **[ccTLD](/de/glossary/cctld/)** (Ländercode) | `.de`, `.uk`, `.jp`, `.us` | Zweistellige Codes gemäß ISO 3166-1; oft unter nationaler Aufsicht |
| **sTLD** (gesponsert) | `.gov`, `.edu`, `.mil`, `.museum` | Ein gTLD-Untertyp mit einer Sponsor-Organisation, die die Berechtigung einschränkt |
| **[Neue gTLD](/de/glossary/new-gtld/)** | `.app`, `.blog`, `.shop`, `.xyz` | Ab 2013 durch das ICANN-Erweiterungsprogramm eingeführt |
| **Infrastruktur** | `.arpa` | Für technische DNS-Infrastruktur reserviert; nicht für Registrierungen offen |
| **Test / Reserviert** | `.example`, `.localhost`, `.invalid` | In RFC 2606 definiert; nie in der öffentlichen Root delegiert |

`.arpa` ist die einzige aktuelle Infrastruktur-TLD. Sie beherbergt Reverse-Lookup-Zonen (`in-addr.arpa` für IPv4, `ip6.arpa` für IPv6), die IP-Adressen auf Hostnamen zurück abbilden.

Ländercodes-TLDs waren ursprünglich auf Registranten im jeweiligen Land beschränkt, wurden aber vielfach für globale Registrierungen liberalisiert — `.io` (Britisches Territorium im Indischen Ozean) und `.co` (Kolumbien) sind bekannte Beispiele, die international als generische Alternativen genutzt werden.

## Wie TLDs erstellt und delegiert werden

Die maßgebliche Liste aller delegierten TLDs wird in der **IANA-Root-Zone-Datenbank** ([iana.org/domains/root/db](https://www.iana.org/domains/root/db)) geführt, die jede TLD ihren maßgeblichen Nameservern und dem zuständigen [Registry](/de/glossary/registry/)-Betreiber zuordnet.

**ccTLD-Delegierung** folgt der in [RFC 1591](https://www.rfc-editor.org/rfc/rfc1591) (Postel, 1994) festgelegten Politik: Zweistellige Codes werden aus ISO 3166-1 abgeleitet und an einen Treuhänder delegiert — in der Regel eine Regierungsbehörde oder ein national anerkanntes Gremium —, der dem öffentlichen Interesse des betreffenden Landes oder Territoriums verpflichtet ist. [IANA](/de/glossary/iana/) prüft Anträge auf Neudelegierung, wenn sich die Governance einer ccTLD ändert.

**Neue gTLDs** werden durch [ICANN](/de/glossary/icann/)-Bewerbungsrunden geschaffen. Die erste große Erweiterung begann 2012, als ICANN Bewerbungen für beliebige Zeichenfolgen mit drei oder mehr Zeichen als generische TLD öffnete. Bewerber zahlen eine Grundgebühr, durchlaufen eine Prüfung auf technische Kompetenz und finanzielle Stabilität, bestehen ein Einspruchsverfahren (das Gemeinschafts-, Moral-, Rechte-an-geistigem-Eigentum- und Zeichenfolgen-Verwechslungsgründe abdeckt) und schließen einen Registry Agreement mit ICANN ab ([ICANN neues gTLD-Programm](https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains)). Aus dieser Runde wurden über 1.200 neue gTLDs delegiert. Eine zweite Bewerbungsrunde öffnete 2026 und erweiterte den Namensraum weiter.

Nach der Delegierung pflegt der [Registry](/de/glossary/registry/)-Betreiber einer TLD die maßgebliche Datenbank aller darunter registrierten Second-Level-Domains, betreibt die Nameserver der Zone und legt die Richtlinien (Preisgestaltung, Berechtigung, Längenregeln) fest, die Registrare beim Verkauf von Namen an Registranten befolgen müssen.

## Beispiele und bemerkenswerte TLDs

| TLD | Betreiber | Hinweise |
|-----|-----------|----------|
| `.com` | Verisign | Größte TLD nach Registrierungsvolumen; ursprünglich für kommerzielle Einheiten |
| `.net` | Verisign | Ursprünglich für Netzwerkinfrastrukturanbieter; jetzt uneingeschränkt |
| `.org` | Public Interest Registry | Ursprünglich für Non-Profit-Organisationen; jetzt weitgehend uneingeschränkt |
| `.gov` | GSA (USA) | Beschränkt auf US-amerikanische Bundes-, Landes- und Kommunalbehörden |
| `.edu` | Educause | Beschränkt auf akkreditierte US-amerikanische Hochschuleinrichtungen |
| `.uk` | Nominet | UK-ccTLD; übliche Registrierungen verwenden Second-Level-Labels wie `.co.uk` |
| `.de` | DENIC | Deutschland-ccTLD; eine der größten ccTLDs nach Volumen |
| `.io` | ICANN / Registry-Übergang ausstehend | Britisches Territorium im Indischen Ozean; weit verbreitet bei Technologieunternehmen |
| `.app` | Google Registry | Neue gTLD; HTTPS durch Registry-Richtlinie vorgeschrieben |
| `.xyz` | XYZ.com LLC | Neue gTLD; hohes Registrierungsvolumen dank niedrigen Preisen |

## TLDs, Wert und SEO

Suchmaschinen behandeln TLDs auf zwei unterschiedliche Weisen:

**Geo-Targeting:** Eine [ccTLD](/de/glossary/cctld/) sendet ein geografisches Signal. Google Search Central stellt fest, dass eine `.de`-Website generell als auf deutschsprachige Nutzer ausgerichtet interpretiert wird, und Google Search Console erlaubt explizites Geo-Targeting für generische TLDs, wendet ccTLD-Signale jedoch automatisch an. Wenn ein Unternehmen eine globale Zielgruppe von einer einzelnen Domain aus bedienen möchte, vermeidet eine generische TLD unbeabsichtigte geografische Beschränkungen.

**Ranking:** Für die meisten Zwecke ist die TLD selbst kein Ranking-Faktor. Google hat erklärt, dass es [neue gTLDs wie jede andere TLD behandelt](https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains) und dass eine `.com` gegenüber einer `.app` oder `.xyz` von sich aus kein höheres Ranking erzielt. Was zählt, ist die Gesamtautorität und Relevanz der Domain, nicht die Endung allein. Einige ältere schlüsselwortreiche TLDs (wie `.jobs` oder `.travel`) tragen implizite Kontextsignale, die jedoch im Vergleich zu Inhaltsqualität und Backlink-Profil gering sind.

**Markenwahrnehmung und Einprägsamkeit:** Domain-Investoren und Marketer beobachten, dass etablierte kurze TLDs — insbesondere `.com` — bei Endnutzern eine starke Wiedererkennung genießen, was sich auf Klickraten in Suchergebnissen, direkte Navigation und Vertrauen auswirken kann. Dies ist eine Markt- und Verhaltens-Dynamik, kein algorithmischer Effekt.

**Premium- und Nachmarktpreise:** Der wahrgenommene Wert einer TLD beeinflusst die Sekundärmarktpreise für [Second-Level-Domain](/de/glossary/second-level-domain/)-Namen darunter. `.com`-Namen erzielen im Durchschnitt höhere Nachmarktpreise als gleichwertige Namen unter neueren Endungen — ein Ausdruck der Vertrautheit der Verbraucher, nicht eines technischen Vorteils.

## TLDs und tokenisierte Domains

Mehrere blockchain-basierte Benennungssysteme operieren außerhalb der IANA-Root-Zone und führen faktisch alternative TLDs ein, die sich nur in kompatiblen Resolvern oder Browser-Erweiterungen auflösen. Beispiele sind `.eth` (Ethereum Name Service), `.crypto` und `.nft`. Diese sind nicht über [IANA](/de/glossary/iana/) delegiert und lösen sich im globalen DNS standardmäßig nicht auf, obwohl Bridges und Gateway-Dienste eine teilweise Interoperabilität ermöglichen können.

Innerhalb des IANA-verwalteten Namensraums ist die Tokenisierung von [Second-Level-Domain](/de/glossary/second-level-domain/)-Namen (die Darstellung des Eigentums an einem Namen wie `example.com` als Blockchain-Token) ein von der TLD selbst getrenntes Konzept; die TLD verbleibt unter derselben Registry-Governance, unabhängig davon, wie das Eigentum an einzelnen darunter liegenden Namen erfasst wird.
