---
title: Secuestro DNS
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Redirigir el tráfico de un dominio manipulando la resolución DNS en lugar de su registro.
keywords: ['secuestro DNS', 'envenenamiento de caché', 'suplantación DNS', 'DNSSEC', 'redirección de tráfico']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/dns-cache-poisoning/
---

El **secuestro DNS** (también llamado suplantación DNS o envenenamiento de caché) ataca la capa de resolución en lugar del registro en sí: en vez de apoderarse del dominio en el registrador, el atacante corrompe lo que un [resolvedor DNS](/es/glossary/dns-resolver/) o [servidor de nombres](/es/glossary/nameserver/) cree que el dominio apunta, enviando silenciosamente a los visitantes a una IP maliciosa. En un ataque de envenenamiento de caché, una respuesta DNS falsificada es aceptada por un resolvedor recursivo y almacenada en caché durante la duración del TTL, desviando a todos los usuarios a los que sirve ese resolvedor —sin ningún cambio visible en los registros [DNS](/es/glossary/dns/) autoritativos. La principal contramedida técnica es [DNSSEC](/es/glossary/dnssec/), que firma criptográficamente las respuestas DNS para que los resolvedores puedan detectar manipulaciones. A diferencia del robo de dominio tradicional, el secuestro DNS deja intactos los registros de propiedad, lo que hace más difícil detectarlo sin monitorización activa de adónde resuelve realmente tu dominio.
