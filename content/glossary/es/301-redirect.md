---
title: Redirección 301
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Un estado HTTP que indica a navegadores y motores de búsqueda que una página se ha movido permanentemente a una nueva URL.
keywords: ['redirección 301', 'redirección permanente', 'redirección http', 'seo', 'reenvío de dominio', 'equidad de enlace']
also_known_as: ['Redirección permanente']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
---

Una **redirección 301** (también llamada *redirección permanente*) es un código de respuesta HTTP que indica a los navegadores y motores de búsqueda que un recurso se ha movido permanentemente a una nueva URL y que todas las solicitudes futuras deben dirigirse al nuevo destino. El "301" la distingue de una redirección temporal 302: con una 301, Google consolida las señales de clasificación —incluida la equidad de enlace y el [texto de anclaje](/es/glossary/anchor-text/)— de la URL antigua a la nueva, lo que la convierte en el mecanismo estándar para el [reenvío de dominio](/es/glossary/domain-forwarding/) sin sacrificar el valor de [SEO](/es/glossary/seo/). En la práctica, esto significa que un inversor de dominios puede adquirir un dominio antiguo con una fuerte [autoridad de dominio](/es/glossary/domain-authority/) y apuntarlo a un sitio objetivo, transfiriendo gran parte de esa equidad de enlace acumulada al destino. La transferencia no es inmediata —Google normalmente consolida las señales a lo largo de varias semanas— y no siempre es del 100%, por lo que las redirecciones 301 son valiosas pero no representan un trasplante perfecto de equidad.
