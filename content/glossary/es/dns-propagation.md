---
title: Propagación DNS
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: El retraso antes de que un cambio de DNS sea visible en todas partes, mientras los registros antiguos almacenados en caché expiran en los resolvedores.
keywords: ['propagación DNS', 'retraso en actualización DNS', 'TTL', 'caché DNS', 'cambio de servidor de nombres']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
  - https://datatracker.ietf.org/doc/html/rfc1035
---

La **propagación DNS** es el lapso entre realizar un cambio en el [DNS](/es/glossary/dns/) y que ese cambio sea visible en toda la internet. Ocurre porque los [resolvedores](/es/glossary/dns-resolver/) de todo el mundo almacenan en caché la respuesta anterior hasta que su [TTL](/es/glossary/ttl/) expira, de modo que un nuevo [registro](/es/glossary/dns-record-types/) o la actualización de un [servidor de nombres](/es/glossary/nameserver/) se despliega de forma gradual en lugar de instantánea — desde minutos hasta un par de días. No existe un "DNS" global que actualizar de una vez; la propagación es simplemente el agotamiento de las cachés. La solución práctica es reducir el TTL con anticipación a un cambio planificado. Nada de esto afecta la propiedad de un dominio: la tokenización cambia quién controla el nombre en cadena, no la rapidez con que se propagan los cambios en el DNS. *Fuente(s): glosario de TTL de Cloudflare; RFC 1035.*
