---
title: EPP Status Codes
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
description: The standardized flags on a domain that show its state — locked, on hold, pending transfer, and more.
keywords: ['EPP status codes', 'clientHold', 'serverTransferProhibited', 'domain status', 'pending delete']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /en/blog/expired-domains-and-the-drop-cycle/
  - /en/blog/domain-backorders-and-drop-catching/
  - /en/blog/how-to-sell-a-domain-name-you-own/
  - /en/blog/the-panix-com-domain-hijack/
  - /en/blog/working-with-domain-brokers/
relatedTopics:
  - /en/topics/domain-investing/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/domain-flipping-skills/
  - /en/series/domain-apocalypse/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/epp/
  - /en/glossary/registry/
  - /en/glossary/dns/
  - /en/glossary/transfer-lock/
---

**EPP status codes** are the machine-readable flags defined by the Extensible Provisioning Protocol ([EPP](/en/glossary/epp/)) that describe exactly what operations are permitted on a domain at any given moment. They come in two namespaces: `client*` codes set by the [registrar](/en/glossary/registrar/) and `server*` codes set by the [registry](/en/glossary/registry/), with the server codes taking precedence. Common ones include `clientTransferProhibited` (the [transfer lock](/en/glossary/transfer-lock/) that blocks outbound moves), `serverDeleteProhibited` (registry-level protection against deletion), `clientHold` (suspends DNS resolution, often for non-payment), and `pendingDelete` which marks a domain in its [grace period](/en/glossary/grace-period/) before it is released and available for registration again — a state adjacent to [pending delete](/en/glossary/pending-delete/). Understanding these codes matters practically: a domain showing `serverTransferProhibited` cannot be moved even after the registrar unlocks it, which surprises buyers mid-transaction.
