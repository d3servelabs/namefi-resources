---
title: "Zwischenzertifizierungsstelle"
date: '2026-10-22'
language: "de"
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "Eine Zwischenzertifizierungsstelle erhält über eine Kette zu einem Vertrauensanker die Befugnis zur Zertifikatssignatur."
keywords: ["Zwischenzertifizierungsstelle", "Intermediate CA", "TLS-Authentifizierung"]
also_known_as: ["Intermediate CA"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-6
  - https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0
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
  - /de/glossary/man-in-the-middle-attack/
  - /de/glossary/dane/
  - /de/glossary/caa/
  - /de/glossary/certificate-transparency/
---

Eine **Zwischenzertifizierungsstelle**, auch **Intermediate CA** genannt, besitzt eine Signaturbefugnis, die eine andere [Zertifizierungsstelle](/de/glossary/certificate-authority/) über eine Zertifikatskette delegiert. Eine Kette verbindet normalerweise ein Website-Zertifikat mit einer vertrauenswürdigen Stammzertifizierungsstelle, manchmal über mehrere Zwischenzertifikate. Zertifikatsbeschränkungen begrenzen die delegierte Befugnis. Die Kompromittierung des [privaten Schlüssels](/de/glossary/private-key/) einer Zwischenzertifizierungsstelle kann innerhalb dieser Befugnis gefälschte Zertifikatssignaturen ermöglichen. Clients müssen relevante Aktualisierungen zum Vertrauensentzug oder Widerruf anwenden. Der Austausch eines Website-Zertifikats entfernt einen kompromittierten Zwischenschlüssel nicht aus den Vertrauensentscheidungen anderer Clients.
