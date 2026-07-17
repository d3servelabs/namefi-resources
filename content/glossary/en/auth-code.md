---
title: Auth Code (EPP Code, Transfer Code)
date: '2026-05-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A short per-domain secret a registrar issues to authorize moving a domain to another registrar, also called an EPP code or transfer code.
keywords: ['auth code', 'EPP code', 'transfer code', 'domain transfer', 'authorization code', 'AuthInfo code']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
relatedArticles:
  - /en/blog/domain-escrow-explained/
  - /en/blog/how-to-sell-a-domain-name-you-own/
  - /en/blog/how-tokenization-changes-domain-flipping/
  - /en/blog/the-panix-com-domain-hijack/
  - /en/blog/how-to-tokenize-your-com/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-investor-field-guide/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/registry/
  - /en/glossary/dns/
  - /en/glossary/cross-registrar-transfer/
  - /en/glossary/epp/
---

An **auth code** — also called an **EPP code**, **AuthInfo code**, or **transfer code** — is a short shared secret that a [registrar](/en/glossary/registrar/) issues for a specific domain to authorize a [cross-registrar transfer](/en/glossary/cross-registrar-transfer/). EPP (Extensible Provisioning Protocol) is the standard underlying registry protocol; the auth code is the per-domain credential within it. To transfer a domain from one registrar to another, the gaining registrar must present a valid auth code obtained by the [registrant](/en/glossary/registrant/) from the losing registrar. The code is usually visible inside the registrar's control panel, sometimes hidden behind a "Transfer Out" or "Get EPP Code" button. For [tokenized domains](/en/blog/what-are-tokenized-domains/), the [on-chain](/en/glossary/on-chain/) ownership transfer **does not** require an auth code — the [NFT](/en/glossary/nft/) transfer is atomic on-chain. Auth codes are only relevant when moving a domain between registrars in the traditional [DNS](/en/glossary/dns/) world.
