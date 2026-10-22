---
title: "DANE"
date: '2026-10-22'
language: "de"
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "DANE authentifiziert TLS-Dienste durch Zertifikats- oder Schlüsselzuordnungen in DNSSEC-geschützten TLSA-Einträgen."
keywords: ["DANE", "DNS-basierte Authentifizierung benannter Entitäten", "TLS-Authentifizierung"]
also_known_as: ["DNS-basierte Authentifizierung benannter Entitäten"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc6698#section-2
  - https://www.rfc-editor.org/rfc/rfc7671#section-5.1
relatedArticles:
  - /de/blog/the-fox-it-dns-hijack/
  - /de/blog/the-myetherwallet-bgp-dns-attack/
  - /de/blog/the-curve-finance-dns-hijack/
  - /de/blog/dns-on-tokenized-domains/
  - /de/blog/dnssec-for-domain-owners/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/certificate-authority/
  - /de/glossary/intermediate-ca/
  - /de/glossary/man-in-the-middle-attack/
  - /de/glossary/caa/
  - /de/glossary/certificate-transparency/
---

**DANE**, kurz für **DNS-basierte Authentifizierung benannter Entitäten**, ordnet mithilfe von TLSA-Einträgen einem TLS-Dienst ein Zertifikat, einen öffentlichen Schlüssel oder einen Vertrauensanker zu. [DNSSEC (Domain Name System Security Extensions)](/de/glossary/dnssec/) authentifiziert die DNS-Daten. Ein unterstützender Client setzt die Zuordnung während der TLS-Authentifizierung durch. Je nach gewählter Verwendung kann DANE eine öffentliche [Zertifizierungsstelle](/de/glossary/certificate-authority/) einschränken oder einen Dienst unabhängig vom Vertrauen in öffentliche CAs authentifizieren. Das bloße Veröffentlichen von TLSA-Einträgen schützt keine Clients, die DANE ignorieren. Betreiber müssen Schlüsseländerungen mit TLSA-Aktualisierungen abstimmen und die DNSSEC-Validierung erhalten.
