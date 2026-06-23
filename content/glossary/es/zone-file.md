---
title: 'Archivo de Zona (Registro de Pegamento)'
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: El archivo de texto que contiene todos los registros DNS de un dominio, incluidos los registros de pegamento para sus servidores de nombres.
keywords: ['archivo de zona', 'registro de pegamento', 'zona DNS', 'registros autoritativos', 'servidor de nombres']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/dns-zone/
---

Un **archivo de zona** es el archivo de texto en los [servidores de nombres](/es/glossary/nameserver/) autoritativos de un dominio que contiene todos sus [registros DNS](/es/glossary/dns-record-types/) — las entradas A, MX, TXT y demás que definen el comportamiento del dominio. Un **registro de pegamento** es un caso especial: cuando los servidores de nombres de un dominio residen *bajo ese mismo dominio* (por ejemplo, `ns1.example.com` sirviendo a `example.com`), el [registro](/es/glossary/registry/) padre debe publicar la [dirección IP](/es/glossary/ip-address/) del servidor de nombres directamente en la zona padre para evitar una consulta circular sin fin. Editar el archivo de zona es la forma de configurar el [DNS](/es/glossary/dns/) de un dominio. Son datos operativos, separados de la propiedad — que es exactamente lo que un dominio tokenizado mueve a una capa controlada por una [billetera](/es/glossary/wallet/). *Fuente(s): RFC 1035; glosario de zonas DNS de Cloudflare.*
