---
title: Registrar / Transfer Lock
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A status that blocks a domain from transferring to another registrar until it is explicitly unlocked.
keywords: ['transfer lock', 'registrar lock', 'domain security', 'EPP status', 'domain transfer']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
---

**Registrar / Transfer Lock** (EPP status `clientTransferProhibited`) is a flag set by your [registrar](/en/glossary/registrar/) that prevents a domain from being moved to a different registrar without first being deliberately unlocked. When the lock is on, any attempt to initiate a [cross-registrar transfer](/en/glossary/cross-registrar-transfer/) is rejected before it can proceed, even if the requester has the [auth-code](/en/glossary/auth-code/). It is one of the simplest and most effective defenses against [domain hijacking](/en/glossary/domain-hijacking/): a thief who has compromised your account cannot quietly transfer the asset away as long as the lock is active. Best practice is to keep the transfer lock enabled at all times and only remove it for the brief window needed to complete a legitimate transfer. On Namefi, a tokenized domain retains its on-chain representation even while the underlying registrar lock is active, so the NFT can be traded in a wallet while the DNS registration itself remains protected from unauthorized moves. *Source: ICANN EPP Status Codes reference.*
