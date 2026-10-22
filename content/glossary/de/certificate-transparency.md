---
title: "Zertifikatstransparenz"
date: '2026-10-22'
language: "de"
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "Zertifikatstransparenz macht TLS-Zertifikatsausstellungen durch öffentliche Protokolle unabhängig überwachbar und prüfbar."
keywords: ["Zertifikatstransparenz", "CT", "TLS-Authentifizierung"]
also_known_as: ["CT"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc9162#section-1
  - https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/
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
  - /de/glossary/caa/
---

**Zertifikatstransparenz**, auch **CT** genannt, erfasst TLS-Zertifikate in öffentlichen Protokollen, die ausschließlich neue Einträge zulassen. Domainbetreiber und andere Überwachende können die Protokolle auf unerwartete Ausstellungen durch eine [Zertifizierungsstelle](/de/glossary/certificate-authority/) prüfen. Client-Richtlinien können vor der Annahme eines Zertifikats einen Protokollierungsnachweis verlangen. Die Protokollierung allein verhindert keine betrügerische Ausstellung und widerruft kein Zertifikat. Die Durchsetzung durch Clients und die Überwachung bieten unterschiedliche Schutzfunktionen. CT ergänzt [CAA](/de/glossary/caa/): CAA regelt vor der Ausstellung die Autorisierung des Ausstellers, während CT protokollierte Zertifikate anschließend zur Prüfung offenlegt.
