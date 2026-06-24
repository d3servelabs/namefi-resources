---
title: IP Address (IPv4 / IPv6)
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The numeric address that identifies a device on a network, which DNS maps a domain name to.
keywords: ['IP address', 'IPv4', 'IPv6', 'A record', 'AAAA record', 'networking']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc791
  - https://www.cloudflare.com/learning/dns/glossary/what-is-my-ip-address/
---

An **IP address** is the numeric label that identifies a device on a network — `93.184.216.34` in the older **IPv4** format, or a longer hexadecimal string like `2606:2800:220:1:248:1893:25c8:1946` in **IPv6**, which exists because the world ran out of IPv4 space. The whole point of the [DNS](/en/glossary/dns/) is to map a human-friendly domain to one of these addresses: an **A** [record](/en/glossary/dns-record-types/) points a name at an IPv4 address, an **AAAA** record at IPv6. Blocks of addresses are allocated through [IANA](/en/glossary/iana/) to regional registries. Domain tokenization operates a layer above all this — it changes who *owns* the name, not the addresses the name resolves to.
