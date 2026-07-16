---
title: Transfer Lock
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: A status that blocks a domain from transferring to another registrar until it is explicitly unlocked.
keywords: ['transfer lock', 'registrar lock', 'domain security', 'EPP status', 'domain transfer']
also_known_as: ['Registrar Lock']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /en/blog/the-panix-com-domain-hijack/
  - /en/blog/how-to-sell-a-domain-name-you-own/
  - /en/blog/how-tokenization-changes-domain-flipping/
  - /en/blog/avoiding-domain-sale-scams/
  - /en/blog/working-with-domain-brokers/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-investing/
relatedSeries:
  - /en/series/domain-flipping-skills/
  - /en/series/domain-apocalypse/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/domain-hijacking/
  - /en/glossary/cross-registrar-transfer/
  - /en/glossary/epp/
  - /en/glossary/registry-lock/
---

**Transfer Lock** (also called a *registrar lock*; EPP status `clientTransferProhibited`) is a flag set by your [registrar](/en/glossary/registrar/) that prevents a domain from being moved to a different registrar without first being deliberately unlocked. When the lock is on, any attempt to initiate a [cross-registrar transfer](/en/glossary/cross-registrar-transfer/) is rejected before it can proceed, even if the requester has the [auth-code](/en/glossary/auth-code/). It is one of the simplest and most effective defenses against [domain hijacking](/en/glossary/domain-hijacking/): a thief who has compromised your account cannot quietly transfer the asset away as long as the lock is active. Best practice is to keep the transfer lock enabled at all times and only remove it for the brief window needed to complete a legitimate transfer.
