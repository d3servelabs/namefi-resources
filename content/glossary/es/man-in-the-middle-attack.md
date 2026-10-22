---
title: "Ataque de intermediario"
date: '2026-10-22'
language: "es"
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "Un ataque de intermediario sitúa a un atacante entre las partes que se comunican para interceptar o alterar la comunicación."
keywords: ["ataque de intermediario", "MITM", "autenticación TLS"]
also_known_as: ["MITM", "Ataque en la ruta de comunicación"]
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4949
  - https://datatracker.ietf.org/doc/html/rfc8446#section-1
relatedArticles:
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-myetherwallet-bgp-dns-attack/
  - /es/blog/the-curve-finance-dns-hijack/
  - /es/blog/dns-on-tokenized-domains/
  - /es/blog/dnssec-for-domain-owners/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/certificate-authority/
  - /es/glossary/intermediate-ca/
  - /es/glossary/dane/
  - /es/glossary/caa/
  - /es/glossary/certificate-transparency/
---

Un **ataque de intermediario**, también llamado **MITM** o **ataque en la ruta de comunicación**, sitúa a un atacante entre las partes que se comunican. El atacante intercepta, retransmite o modifica la comunicación mientras las partes pueden creer que se comunican directamente. El [Secuestro DNS](/es/glossary/dns-hijacking/) puede redirigir una conexión hacia el atacante. HTTPS normalmente combate la suplantación del extremo mediante la validación de certificados y la prueba de posesión de la clave privada. Una [Autoridad de certificación](/es/glossary/certificate-authority/) comprometida puede debilitar esa autenticación cuando un cliente sigue aceptando la autoridad afectada. El cifrado puede entonces proteger una conexión cuyo extremo es el atacante.
