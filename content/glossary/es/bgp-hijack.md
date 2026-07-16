---
title: Secuestro BGP
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['iria-maquieira']
description: Redirigir el tráfico de internet anunciando falsamente rutas IP, un ataque a nivel de red que opera por debajo de DNS.
keywords: ['secuestro BGP', 'secuestro de rutas', 'prefijo IP', 'seguridad de red', 'enrutamiento de internet']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
relatedArticles:
  - /es/blog/the-myetherwallet-bgp-dns-attack/
  - /es/blog/the-dnspionage-campaign/
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-sea-turtle-dns-espionage/
  - /es/blog/how-domain-hijacking-actually-happens/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/name-change-game-change/
relatedGlossary:
  - /es/glossary/dns/
  - /es/glossary/dns-hijacking/
  - /es/glossary/icann/
  - /es/glossary/public-key/
  - /es/glossary/web3/
---

El **secuestro BGP** (secuestro del Border Gateway Protocol) es un ataque a nivel de red en el que un sistema autónomo malicioso o mal configurado difunde anuncios de enrutamiento falsos, convenciendo a otros enrutadores en internet de que envíen el tráfico destinado a una [dirección IP](/es/glossary/ip-address/) legítima a través de la infraestructura del atacante. A diferencia del [secuestro DNS](/es/glossary/dns-hijacking/) —que corrompe los mapeos de nombre a IP— un secuestro BGP opera en la capa de enrutamiento, por lo que los registros DNS del dominio permanecen intactos y DNSSEC no ofrece protección contra él. Una vez redirigido el tráfico, los atacantes pueden interceptar la emisión de certificados TLS (los secuestros BGP se han utilizado para obtener certificados fraudulentos de CAs que emplean validación de dominio basada en HTTP), leer el tráfico no cifrado o realizar ataques de intermediario. Las mitigaciones incluyen la validación del origen de rutas mediante RPKI (Resource Public Key Infrastructure) y servicios de monitoreo que alertan cuando sistemas autónomos inesperados anuncian sus prefijos.
