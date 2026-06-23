---
title: 'Servidor de nombres (Registro NS)'
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Un servidor que responde consultas DNS para un dominio; sus registros NS indican los servidores autoritativos.
keywords: ['servidor de nombres', 'registro NS', 'servidor autoritativo', 'delegación DNS', 'alojamiento DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/dns-server-types/
---

Un **servidor de nombres** es un servidor que responde consultas [DNS](/es/glossary/dns/) para un dominio, y los **registros NS** en el [registro](/es/glossary/registry/) del dominio declaran qué servidores de nombres son autoritativos para él. Cuando usted apunta un dominio a un proveedor de DNS (Cloudflare, Route 53, el propio DNS de su [registrador](/es/glossary/registrar/)), está configurando sus servidores de nombres; esos servidores publican luego los [tipos de registros](/es/glossary/dns-record-types/) — A, MX, TXT y demás — que enrutan el tráfico y el correo. Tokenizar un dominio no cambia esta capa: los servidores de nombres y sus registros siguen funcionando exactamente igual, mientras la propiedad y la transferencia se mueven a una capa [en cadena](/es/glossary/on-chain/) controlada por una [billetera](/es/glossary/wallet/). *Fuente(s): RFC 1034; tipos de servidores DNS de Cloudflare.*
