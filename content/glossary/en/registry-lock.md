---
title: Registry Lock
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A high-security service where the registry freezes a domain so changes need manual out-of-band approval.
keywords: ['registry lock', 'domain lock', 'high-security lock', 'domain hijacking prevention', 'out-of-band verification']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
---

**Registry Lock** is a premium security service offered by a [registry](/en/glossary/registry/) that places a domain into a state where no modification — including nameserver changes, transfers, or deletions — can be processed through the normal automated EPP channel. Instead, any change requires a manual, out-of-band verification process involving phone calls, cryptographic tokens, or in-person identity checks between the registrar and the registry. This is distinct from the more common [transfer lock](/en/glossary/transfer-lock/), which the [registrar](/en/glossary/registrar/) controls and can toggle through its own systems; registry lock escalates the protection to the registry tier, making unauthorized changes extremely difficult even if an attacker gains full access to the registrar account. It is most commonly used by financial institutions, large brands, and critical-infrastructure operators to protect high-value domains against [domain hijacking](/en/glossary/domain-hijacking/).
