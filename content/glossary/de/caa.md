---
title: "CAA"
date: '2026-10-22'
language: "de"
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "Ein CAA-Eintrag nennt die Zertifizierungsstellen, die eine Domain zur Ausstellung von Zertifikaten autorisiert."
keywords: ["CAA", "Autorisierung von Zertifizierungsstellen", "TLS-Authentifizierung"]
also_known_as: ["Autorisierung von Zertifizierungsstellen"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc8659#section-1
  - https://www.rfc-editor.org/rfc/rfc8659#section-5
  - https://letsencrypt.org/docs/caa/
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
  - /de/glossary/dane/
  - /de/glossary/certificate-transparency/
---

**CAA**, kurz für **Autorisierung von Zertifizierungsstellen**, ist ein DNS-Eintrag, der die [Zertifizierungsstelle](/de/glossary/certificate-authority/) nennt, die eine Domain zur Ausstellung von Zertifikaten autorisiert. Eine regelkonforme CA prüft vor der Ausstellung die geltenden CAA-Einträge. [DNSSEC (Domain Name System Security Extensions)](/de/glossary/dnssec/) kann die DNS-Antwort mit der Richtlinie authentifizieren. CAA reduziert unbeabsichtigte Ausstellungen durch regelkonforme Prozesse. CAA veranlasst Browser weder zur Ablehnung von Zertifikaten anderer Aussteller noch widerruft CAA bestehende Zertifikate. CAA stoppt auch niemanden, der Zertifikate direkt mit einem kompromittierten CA-Signaturschlüssel fälscht. CAA legt die Autorisierung des Ausstellers fest, während die Domainvalidierung eine separate Anforderung bleibt.
