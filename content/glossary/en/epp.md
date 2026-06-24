---
title: EPP (Extensible Provisioning Protocol)
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The standard protocol registrars use to register and manage domains with a registry.
keywords: ['EPP', 'Extensible Provisioning Protocol', 'domain management', 'registry protocol', 'RFC 5730']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5730
---

**EPP** (Extensible Provisioning Protocol) is the XML-based command protocol defined in RFC 5730 that governs how a [registrar](/en/glossary/registrar/) communicates with a [registry](/en/glossary/registry/) to create, update, transfer, or delete domain registrations. Every time a registrar registers a new name, renews it, or initiates a transfer, it sends an EPP command over a secure TCP session to the registry's EPP server and receives a structured response confirming success or reporting an error. The protocol also carries the [auth-code](/en/glossary/auth-code/) used to authorize outbound transfers and surfaces the [EPP status codes](/en/glossary/epp-status-codes/) — such as `clientTransferProhibited` or `serverHold` — that describe a domain's current state. Because EPP is tightly controlled, access is limited to accredited registrars; end users never interact with it directly.
