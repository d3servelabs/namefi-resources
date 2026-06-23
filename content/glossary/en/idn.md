---
title: IDN (Internationalized Domain Name) / Punycode
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: A domain using non-ASCII characters, encoded for DNS as ASCII Punycode beginning with xn--.
keywords: ['IDN', 'internationalized domain name', 'Punycode', 'xn--', 'Unicode domain', 'homograph']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5890
  - https://www.icann.org/resources/pages/idn-2012-02-25-en
---

An **IDN (internationalized domain name)** is a domain that uses non-ASCII characters — `münchen.de`, `中国.cn`, or an emoji domain — so names can be written in scripts beyond basic Latin. Because the [DNS](/en/glossary/dns/) itself only handles ASCII, an IDN is encoded into a compatible ASCII string called **Punycode**, which always begins with the `xn--` prefix (so `münchen` becomes `xn--mnchen-3ya`). [Registries](/en/glossary/registry/) and [registrars](/en/glossary/registrar/) support IDNs at the [TLD](/en/glossary/tld/) level, though they carry a known risk: visually similar characters enable *homograph* lookalikes used in phishing. An IDN is still an ordinary registered name underneath, so it can be tokenized and held in a [wallet](/en/glossary/wallet/) like any other domain. *Sources: RFC 5890; ICANN IDN resources.*
