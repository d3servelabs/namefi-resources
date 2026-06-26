---
title: "Code d'autorisation (code EPP, code de transfert)"
date: '2026-05-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Un court secret propre à chaque domaine qu'un registraire émet pour autoriser le transfert d'un domaine vers un autre registraire, aussi appelé code EPP ou code de transfert.
keywords: ['code autorisation', 'code EPP', 'code de transfert', 'transfert de domaine', 'code autorisation', 'code AuthInfo']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
relatedArticles:
  - /fr/blog/domain-escrow-explained/
  - /fr/blog/how-to-sell-a-domain-name-you-own/
  - /fr/blog/how-tokenization-changes-domain-flipping/
  - /fr/blog/the-panix-com-domain-hijack/
  - /fr/blog/how-to-tokenize-your-com/
relatedTopics:
  - /fr/topics/domain-tokenization/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-investor-field-guide/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/registry/
  - /fr/glossary/dns/
  - /fr/glossary/cross-registrar-transfer/
  - /fr/glossary/epp/
---

Un **code d'autorisation** — également appelé **code EPP**, **code AuthInfo** ou **code de transfert** — est un court secret partagé qu'un [registraire](/fr/glossary/registrar/) émet pour un domaine spécifique afin d'autoriser un [transfert inter-registrar](/fr/glossary/cross-registrar-transfer/). EPP (Extensible Provisioning Protocol) est le protocole de registre sous-jacent standard ; le code d'autorisation est le justificatif propre au domaine au sein de ce protocole. Pour transférer un domaine d'un registraire à un autre, le registraire recevant doit présenter un code d'autorisation valide obtenu par le titulaire auprès du registraire cédant. Ce code est généralement visible dans le panneau de contrôle du registraire, parfois masqué derrière un bouton « Transférer vers » ou « Obtenir le code EPP ». Pour les [domaines tokenisés](/fr/blog/what-are-tokenized-domains/), le transfert de propriété on-chain **ne nécessite pas** de code d'autorisation — le transfert du [NFT (Jeton Non Fongible)](/fr/glossary/nft/) est atomique on-chain. Les codes d'autorisation ne sont pertinents que lors du déplacement d'un domaine entre registraires dans le monde traditionnel du [DNS (Système de Noms de Domaine)](/fr/glossary/dns/).
