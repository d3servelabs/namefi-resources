---
title: 'WHOIS (y RDAP)'
date: '2026-05-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: WHOIS y su sucesor RDAP son los servicios de consulta pública para los detalles de registro de un dominio, como su registrador y fecha de vencimiento.
keywords: ['WHOIS', 'RDAP', 'consulta de registro de dominio', 'información del registrante', 'consulta de propiedad de dominio']
level: 1
sources:
  - https://www.icann.org/rdap
  - https://lookup.icann.org/
---

**WHOIS** es el protocolo de larga data y el servicio público para consultar información de registro sobre un dominio — registrador, fechas de registro y vencimiento, e históricamente la información de contacto del registrante. Su sucesor moderno es **RDAP (Registration Data Access Protocol)**, que devuelve JSON estructurado y es el protocolo al que [ICANN](/es/glossary/icann/) y los registros están migrando. Para los [dominios tokenizados](/es/blog/what-are-tokenized-domains/), los registros WHOIS/RDAP siguen existiendo a nivel del [registrador](/es/glossary/registrar/) porque el registro [DNS](/es/glossary/dns/) subyacente es real y reconocido por ICANN — solo la *mecánica de propiedad y transferencia* se traslada a la capa [en cadena](/es/glossary/on-chain/). La privacidad es cada vez más común: muchos registradores ahora ocultan los datos de contacto personales por defecto, en línea con leyes de privacidad como el RGPD. Referencia: [consulta WHOIS de ICANN](https://lookup.icann.org/).
