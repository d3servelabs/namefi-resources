---
title: 'Auth-Code (EPP-Code, Transfer-Code)'
date: '2026-05-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
description: Ein kurzes domainspezifisches Geheimnis, das ein Registrar ausstellt, um die Übertragung einer Domain zu einem anderen Registrar zu autorisieren, auch EPP-Code oder Transfer-Code genannt.
keywords: ['Auth-Code', 'EPP-Code', 'Transfer-Code', 'Domain-Transfer', 'Autorisierungscode', 'AuthInfo-Code']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
relatedArticles:
  - /de/blog/domain-escrow-explained/
  - /de/blog/how-to-sell-a-domain-name-you-own/
  - /de/blog/how-tokenization-changes-domain-flipping/
  - /de/blog/the-panix-com-domain-hijack/
  - /de/blog/how-to-tokenize-your-com/
relatedTopics:
  - /de/topics/domain-tokenization/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/domain-investor-field-guide/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/registry/
  - /de/glossary/dns/
  - /de/glossary/cross-registrar-transfer/
  - /de/glossary/epp/
---

Ein **Auth-Code** – auch **EPP-Code**, **AuthInfo-Code** oder **Transfer-Code** genannt – ist ein kurzes gemeinsames Geheimnis, das ein [Registrar](/de/glossary/registrar/) für eine bestimmte Domain ausstellt, um einen [Cross-Registrar-Transfer](/de/glossary/cross-registrar-transfer/) zu autorisieren. EPP (Extensible Provisioning Protocol) ist das zugrunde liegende Standard-Registry-Protokoll; der Auth-Code ist die domainspezifische Berechtigung darin. Um eine Domain von einem Registrar zu einem anderen zu übertragen, muss der aufnehmende Registrar einen gültigen Auth-Code vorlegen, den der [Registrant](/de/glossary/registrant/) vom abgebenden Registrar erhalten hat. Der Code ist in der Regel im Kontrollpanel des Registrars sichtbar, manchmal hinter einem „Transfer-Out"- oder „EPP-Code abrufen"-Button verborgen. Bei [tokenisierten Domains](/de/blog/what-are-tokenized-domains/) erfordert die [On-Chain](/de/glossary/on-chain/)-Eigentumsübertragung **keinen** Auth-Code – der [NFT](/de/glossary/nft/)-Transfer erfolgt atomar on-chain. Auth-Codes sind nur relevant, wenn eine Domain zwischen Registraren in der traditionellen [DNS](/de/glossary/dns/)-Welt verschoben wird.
