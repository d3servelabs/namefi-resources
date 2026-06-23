---
title: 'Dirección IP (IPv4 / IPv6)'
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: La dirección numérica que identifica un dispositivo en una red, a la que el DNS asigna un nombre de dominio.
keywords: ['dirección IP', 'IPv4', 'IPv6', 'registro A', 'registro AAAA', 'redes']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc791
  - https://www.cloudflare.com/learning/dns/glossary/what-is-my-ip-address/
---

Una **dirección IP** es la etiqueta numérica que identifica un dispositivo en una red — `93.184.216.34` en el formato más antiguo **IPv4**, o una cadena hexadecimal más larga como `2606:2800:220:1:248:1893:25c8:1946` en **IPv6**, que existe porque el mundo se quedó sin espacio en IPv4. El propósito del [DNS](/es/glossary/dns/) es precisamente asignar un dominio amigable para humanos a una de estas direcciones: un [registro](/es/glossary/dns-record-types/) **A** apunta un nombre a una dirección IPv4, y un registro **AAAA** a IPv6. Los bloques de direcciones son asignados por la [IANA](/es/glossary/iana/) a los registros regionales. La tokenización de dominios opera en una capa superior a todo esto — cambia quién *posee* el nombre, no las direcciones a las que este resuelve. *Fuente(s): RFC 791; glosario de direcciones IP de Cloudflare.*
