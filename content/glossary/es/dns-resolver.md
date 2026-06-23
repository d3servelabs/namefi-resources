---
title: 'Resolvedor DNS (Resolvedor Recursivo)'
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: El servidor que recibe una consulta de dominio y recorre la jerarquía DNS para devolver la dirección correspondiente.
keywords: ['resolvedor DNS', 'resolvedor recursivo', 'resolvedor', '8.8.8.8', '1.1.1.1', 'consulta DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/what-is-a-dns-resolver/
---

Un **resolvedor DNS** (o *resolvedor recursivo*) es el servidor al que acude su dispositivo cada vez que necesita convertir un dominio en una [dirección IP](/es/glossary/ip-address/). Los resolvedores públicos como `1.1.1.1` (Cloudflare) y `8.8.8.8` (Google) realizan el trabajo: partiendo de la [zona raíz](/es/glossary/root-zone/), descienden por la jerarquía [DNS](/es/glossary/dns/) hasta los [servidores de nombres](/es/glossary/nameserver/) autoritativos del dominio, y luego almacenan la respuesta en caché durante su [TTL](/es/glossary/ttl/). Esta es la parte del DNS que hace que "escribir un nombre y llegar a un sitio" se sienta instantáneo. Los resolvedores solo leen datos DNS públicos — no tienen visibilidad sobre quién *posee* un dominio, razón por la que la capa de propiedad basada en [billetera](/es/glossary/wallet/) de un dominio tokenizado es invisible para la resolución y no altera en nada cómo se resuelven los nombres. *Fuente(s): RFC 1034; resolvedor DNS de Cloudflare.*
