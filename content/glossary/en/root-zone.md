---
title: Root Zone (Root Servers)
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The top of the DNS hierarchy, listing every TLD and the servers authoritative for it.
keywords: ['root zone', 'root servers', 'DNS hierarchy', 'TLD delegation', 'IANA']
level: 1
sources:
  - https://www.iana.org/domains/root
  - https://www.iana.org/domains/root/servers
---

The **root zone** is the very top of the [DNS](/en/glossary/dns/) hierarchy — the master list of every [TLD](/en/glossary/tld/) and which [registry](/en/glossary/registry/) servers are authoritative for it. It is served by the **root servers**, a globally distributed set of systems reached at thirteen named addresses, and the zone's contents are maintained through [IANA](/en/glossary/iana/). Every domain lookup that isn't already cached starts here: a [resolver](/en/glossary/dns-resolver/) asks the root where to find `.com`, then follows the chain down.
