---
title: 'IDN (Nombre de Dominio Internacionalizado) / Punycode'
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Un dominio que usa caracteres no ASCII, codificado para el DNS como Punycode ASCII que comienza con xn--.
keywords: ['IDN', 'nombre de dominio internacionalizado', 'Punycode', 'xn--', 'dominio Unicode', 'homógrafo']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5890
  - https://www.icann.org/resources/pages/idn-2012-02-25-en
relatedArticles:
  - /es/blog/what-is-a-tld/
  - /es/blog/from-discordapp-com-to-discord-com/
  - /es/blog/the-lenovo-com-dns-hijack/
  - /es/blog/cybersquatting-vs-domaining-udrp-acpa/
  - /es/blog/domain-hacks-explained/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-investing/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/domain-apocalypse/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/registry/
  - /es/glossary/tld/
  - /es/glossary/dns/
  - /es/glossary/phishing/
---

Un **IDN (nombre de dominio internacionalizado)** es un dominio que usa caracteres no ASCII — `münchen.de`, `中国.cn` o un dominio con emoji — para que los nombres puedan escribirse en alfabetos distintos al latín básico. Dado que el [DNS](/es/glossary/dns/) solo maneja ASCII, un IDN se codifica en una cadena ASCII compatible llamada **Punycode**, que siempre comienza con el prefijo `xn--` (así, `münchen` se convierte en `xn--mnchen-3ya`). Los [registros](/es/glossary/registry/) y [registradores](/es/glossary/registrar/) admiten IDN a nivel de [TLD](/es/glossary/tld/), aunque conllevan un riesgo conocido: los caracteres visualmente similares permiten crear nombres homógrafo usados en phishing. Un IDN sigue siendo un nombre registrado ordinario, por lo que puede tokenizarse y mantenerse en una [billetera](/es/glossary/wallet/) como cualquier otro dominio. *Fuente(s): RFC 5890; recursos IDN de ICANN.*
