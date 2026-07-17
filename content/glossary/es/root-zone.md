---
title: 'Zona Raíz (Servidores Raíz)'
date: '2026-06-22'
language: es
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['iria-maquieira']
description: La cima de la jerarquía DNS, que lista cada TLD y los servidores autoritativos para él.
keywords: ['zona raíz', 'servidores raíz', 'jerarquía DNS', 'delegación TLD', 'IANA']
level: 1
sources:
  - https://www.iana.org/domains/root
  - https://www.iana.org/domains/root/servers
relatedArticles:
  - /es/blog/what-is-a-tld/
  - /es/blog/premium-web3-tlds/
  - /es/blog/the-malaysia-airlines-dns-hijack/
  - /es/blog/what-are-tokenized-domains/
  - /es/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /es/topics/choosing-a-tld/
  - /es/topics/domain-security/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/tld/
  - /es/glossary/dns/
  - /es/glossary/registry/
  - /es/glossary/registrar/
  - /es/glossary/icann/
---

La **zona raíz** es la cima de la jerarquía [DNS](/es/glossary/dns/) — la lista maestra de cada [TLD](/es/glossary/tld/) y qué servidores del [registro](/es/glossary/registry/) son autoritativos para él. Es servida por los **servidores raíz**, un conjunto de sistemas distribuidos globalmente accesibles en trece direcciones con nombre, y el contenido de la zona es mantenido por la [IANA](/es/glossary/iana/). Toda consulta de dominio que no esté ya en caché comienza aquí: un [resolvedor](/es/glossary/dns-resolver/) pregunta a la raíz dónde encontrar `.com`, y luego sigue la cadena hacia abajo. La zona raíz es el ancla de nomenclatura de internet — y no se ve afectada por la tokenización, que añade una capa de propiedad controlada por una [billetera](/es/glossary/wallet/) sobre el DNS existente en lugar de reemplazar la raíz. *Fuente(s): zona raíz de IANA; servidores raíz de IANA.*
