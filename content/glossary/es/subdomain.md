---
title: Subdominio
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['iria-maquieira']
description: Un prefijo añadido a un dominio para crear una dirección independiente, como blog.example.com o app.example.com.
keywords: ['subdominio', 'host', 'blog.example.com', 'DNS', 'dominio de segundo nivel']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/glossary/what-is-a-subdomain/
relatedArticles:
  - /es/blog/how-domain-hijacking-actually-happens/
  - /es/blog/what-is-a-tld/
  - /es/blog/domain-hacks-explained/
  - /es/blog/domain-terminology-guide/
  - /es/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/dns/
  - /es/glossary/tld/
  - /es/glossary/registrar/
  - /es/glossary/registry/
  - /es/glossary/domain-forwarding/
---

Un **subdominio** es un prefijo añadido a su dominio para crear una dirección distinta bajo él — `blog.example.com`, `app.example.com` o `mail.example.com` son todos subdominios de `example.com`. Se crea añadiendo un [registro DNS](/es/glossary/dns-record-types/) (normalmente un A o CNAME) en los [servidores de nombres](/es/glossary/nameserver/) del dominio padre, sin registro adicional ni coste extra. Los subdominios permiten que un nombre registrado aloje muchos servicios, lo que los convierte en un componente fundamental para sitios, aplicaciones y APIs. En el mundo tokenizado, la propiedad reside en el [dominio de segundo nivel](/es/glossary/second-level-domain/) [registrado](/es/glossary/registrant/); los subdominios son configuración bajo él y siguen a quien controla la [billetera](/es/glossary/wallet/) del dominio padre. *Fuente(s): RFC 1034; glosario de subdominios de Cloudflare.*
