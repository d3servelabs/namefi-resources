---
title: Domain Hijacking
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The theft of a domain by gaining unauthorized control of its registrar account or registration.
keywords: ['domain hijacking', 'account compromise', 'domain theft', 'registrar security', 'unauthorized transfer']
level: 1
sources:
  - https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en
---

**Domain hijacking** is the unauthorized seizure of a domain name by an attacker who gains control of the owning registrar account — typically through [phishing](/en/glossary/phishing/), credential stuffing, or social engineering against registrar support staff. Once inside the account, the attacker can change nameservers to redirect traffic, disable [registry lock](/en/glossary/registry-lock/) protections, or initiate a transfer to lock the legitimate owner out entirely, which is why it often overlaps with outright [domain theft](/en/glossary/domain-theft/). Defenses include enabling a [transfer lock](/en/glossary/transfer-lock/), using hardware-key two-factor authentication, opting into registry-level locking for high-value names, and keeping registrar contact details current so recovery emails reach you. Namefi's tokenization model adds an on-chain ownership layer: the NFT holder in a self-custody wallet controls the asset independently of any single registrar account, so an account compromise at the registrar does not automatically translate into loss of the tokenized representation. *Source: ICANN Name Holder FAQs.*
