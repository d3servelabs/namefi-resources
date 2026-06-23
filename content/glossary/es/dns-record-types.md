---
title: 'Tipos de registros DNS (A, AAAA, CNAME, MX, TXT)'
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Las entradas en una zona que asignan un dominio a direcciones y servicios — A, AAAA, CNAME, MX, TXT y más.
keywords: ['registros DNS', 'registro A', 'registro AAAA', 'CNAME', 'registro MX', 'registro TXT']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/dns-records/
---

Los **tipos de registros DNS** son las entradas individuales en la zona de un dominio que indican al [DNS](/es/glossary/dns/) hacia dónde enviar los distintos tipos de tráfico. Los más comunes son **A** (asigna un nombre a una [dirección IP](/es/glossary/ip-address/) IPv4), **AAAA** (IPv6), **CNAME** (crea un alias de un nombre a otro), **MX** (enruta el correo electrónico) y **TXT** (texto libre usado para SPF, DKIM y verificación de dominio). Estos registros son publicados por los [servidores de nombres](/es/glossary/nameserver/) a los que se delega un dominio, y son los que realmente hacen que un sitio web cargue o que el correo se entregue. Tokenizar un dominio no afecta nada de esto: los registros siguen resolviendo con normalidad mientras la propiedad y la transferencia se mueven a una capa [en cadena](/es/glossary/on-chain/) controlada por una [billetera](/es/glossary/wallet/). *Fuente(s): RFC 1035; registros DNS de Cloudflare.*
