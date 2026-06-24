---
title: WHOIS Privacy
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A service that masks a registrant's personal contact details in public WHOIS or RDAP records.
keywords: ['WHOIS privacy', 'privacy protection', 'RDAP', 'registrant privacy', 'contact masking']
also_known_as: ['Privacy Protection']
level: 1
sources:
  - https://www.icann.org/rdap
---

**WHOIS privacy** (or privacy protection) is a service offered by most [registrars](/en/glossary/registrar/) that substitutes a proxy contact — typically the registrar's own address and a forwarding email — for the [registrant](/en/glossary/registrant/)'s real name, address, phone, and email in public [WHOIS](/en/glossary/whois/) and RDAP records. Without it, those details are openly queryable, making owners targets for spam, social-engineering attempts, and targeted phishing designed to compromise registrar credentials. GDPR enforcement since 2018 has pushed many registries to redact personal data by default in gTLD WHOIS, but protection varies by TLD and registrar, so explicitly enabling a privacy service remains good practice. It is important to understand what privacy protection does not do: it hides contact details but does not prevent a technically skilled attacker from using DNS enumeration or certificate transparency logs to map a domain's infrastructure.
