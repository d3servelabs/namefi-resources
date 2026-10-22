---
title: "Zertifizierungsstelle"
date: '2026-10-22'
language: "de"
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "Eine Zertifizierungsstelle stellt digitale Zertifikate aus, die Identitäten mit öffentlichen Schlüsseln verknüpfen."
keywords: ["Zertifizierungsstelle", "CA", "TLS-Authentifizierung"]
also_known_as: ["CA", "Zertifizierungsautorität"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-3.2
  - https://www.rfc-editor.org/rfc/rfc8659#section-2.2
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
  - /de/glossary/intermediate-ca/
  - /de/glossary/man-in-the-middle-attack/
  - /de/glossary/dane/
  - /de/glossary/caa/
  - /de/glossary/certificate-transparency/
---

Eine **Zertifizierungsstelle**, auch **Zertifizierungsautorität** oder **CA** genannt, stellt digitale Zertifikate aus, die Identitäten mit einem [öffentlichen Schlüssel](/de/glossary/public-key/) verknüpfen. Eine öffentlich vertrauenswürdige TLS-CA prüft vor der Signatur eines Website-Zertifikats die Kontrolle über die Domain und die geltenden Identitätsanforderungen. Clients validieren die Zertifikatskette anhand einer vertrauenswürdigen Stammzertifizierungsstelle und prüfen den Nachweis des Servers über den zugehörigen privaten Schlüssel. Eine CA kann die Signaturbefugnis an eine [Zwischenzertifizierungsstelle](/de/glossary/intermediate-ca/) delegieren. Das Vertrauen in eine CA authentifiziert eine Identität gemäß der Client-Richtlinie. Das Vertrauen in eine CA garantiert keine ehrlichen Website-Inhalte.
