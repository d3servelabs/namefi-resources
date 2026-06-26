---
title: Reenvío de dominio
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Enviar visitantes automáticamente desde un dominio a otra dirección, a menudo mediante una redirección 301.
keywords: ['reenvío de dominio', 'redirección 301', 'redirección de URL', 'DNS', 'gestión de dominios']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
relatedArticles:
  - /es/blog/how-domain-hijacking-actually-happens/
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-lenovo-com-dns-hijack/
  - /es/blog/from-twitter-com-to-x-com/
  - /es/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-investing/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/name-change-game-change/
relatedGlossary:
  - /es/glossary/301-redirect/
  - /es/glossary/registrar/
  - /es/glossary/dns/
  - /es/glossary/icann/
  - /es/glossary/tld/
---

El **reenvío de dominio** (también llamado *reenvío de URL* o *redirección 301*) es una configuración que envía automáticamente a cada visitante que llega a un dominio hacia una URL de destino diferente. La variante de [redirección 301](/es/glossary/301-redirect/) indica a los motores de búsqueda que el traslado es permanente, transfiriendo la mayor parte de la equidad de enlace del dominio original al objetivo —lo que la convierte en la opción preferida al consolidar marcas o migrar tráfico. El reenvío se configura bien en el panel de control del registrador o estableciendo un [tipo de registro DNS](/es/glossary/dns-record-types/) que apunte a un servidor web que aplique la regla de redirección. Un caso de uso habitual es adquirir un [subdominio](/es/glossary/subdomain/) coincidente o una variante con error tipográfico y reenviarlo al sitio principal para capturar el tráfico desviado. El reenvío es distinto de la delegación DNS completa: el dominio sigue resolviéndose a través de DNS, pero las instrucciones a nivel HTTP redirigen el navegador.
