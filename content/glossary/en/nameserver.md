---
title: Nameserver (NS Record)
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A server that answers DNS queries for a domain; its NS records name the authoritative servers.
keywords: ['nameserver', 'NS record', 'authoritative server', 'DNS delegation', 'DNS hosting']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/dns-server-types/
---

A **nameserver** is a server that answers [DNS](/en/glossary/dns/) queries for a domain, and the **NS records** at a domain's [registry](/en/glossary/registry/) declare which nameservers are authoritative for it. When you point a domain at a DNS host (Cloudflare, Route 53, your [registrar](/en/glossary/registrar/)'s own DNS), you are setting its nameservers; those servers then publish the [record types](/en/glossary/dns-record-types/) — A, MX, TXT, and the rest — that route traffic and mail. Tokenizing a domain does not change this layer: the nameservers and their records keep working exactly as before, while ownership and transfer move to a [wallet](/en/glossary/wallet/)-controlled [on-chain](/en/glossary/on-chain/) layer on top. *Sources: RFC 1034; Cloudflare DNS server types.*
