---
title: "El DNS sigue funcionando: Servidores de nombres, correo electrónico y DNSSEC en un dominio tokenizado"
date: '2026-05-22'
language: es
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Un vistazo práctico a cómo el DNS normal —servidores de nombres, A/AAAA, MX, TXT, DNSSEC, CAA— sigue funcionando después de tokenizar un dominio de la ICANN. Qué cambia, qué no y hacia dónde apuntar su proveedor de DNS existente."
keywords: ['DNS dominio tokenizado', 'DNSSEC dominio NFT', 'servidores de nombres dominio tokenizado', 'correo electrónico dominio tokenizado', 'registros MX dominio NFT', 'registros CAA dominio tokenizado', 'gestión de DNS dominio tokenizado', 'DNS de dominio on-chain', 'MX dominio NFT', 'DNSSEC dominio NFT', 'dominio tokenizado Cloudflare', 'dominio tokenizado Route53', 'cómo funciona DNS tokenizado', 'resolución de dominio tokenizado']
---

Una preocupación común sobre la tokenización de un dominio es: *«¿Seguirá funcionando mi sitio web? ¿Seguirá funcionando mi correo electrónico? ¿Tendré que aprender toda una nueva pila de DNS?»*

Respuesta corta: **sí, sí, no.** Un dominio tokenizado sigue siendo un dominio real de la ICANN. El DNS sigue haciendo exactamente lo que hace el DNS. Esta publicación es un recorrido por lo que cambia (un poco) y lo que no (la mayor parte).

---

## La idea principal a tener en cuenta

Un dominio tokenizado tiene **dos capas**:

1. **La capa de [DNS](/en/glossary/dns/) / registro**: la misma en la que siempre ha vivido su `.com`. [ICANN](/en/glossary/icann/), [registrador](/en/glossary/registrar/), servidores raíz, resolutores recursivos.
2. **La capa [on-chain](/en/glossary/on-chain/) (en la cadena)**: un [NFT](/en/glossary/nft/) en su [billetera](/en/glossary/wallet/) (wallet) que representa la *propiedad*.

La resolución de DNS, que convierte `example.com` en una dirección IP, ocurre completamente en la capa 1. La capa on-chain trata sobre **quién controla el dominio**, no sobre cómo se resuelve. Los navegadores, servidores de correo electrónico, CDN y autoridades de certificación nunca necesitan saber que existe una blockchain.

Es por eso que «el DNS sigue funcionando». No es magia. Es el mismo DNS.

---

## Lo que no cambia

### Servidores de nombres (Nameservers)

Sigue configurando los servidores de nombres para su dominio. Use Cloudflare, Route53, Namecheap, Google Cloud DNS, dnsimple: cualquiera que haya usado antes está bien. Muchas personas dejan a su proveedor de DNS exactamente donde estaba cuando tokenizan y nunca más lo tocan.

### Registros A, AAAA, CNAME, ALIAS

Todos estándar. Su sitio web se resuelve de la misma manera que lo hacía ayer.

### MX, SPF, DKIM, DMARC

El correo electrónico sigue funcionando. La tokenización no tiene ningún efecto en la entrega de correo. Si utiliza Google Workspace, Microsoft 365, Fastmail, ProtonMail o un servidor de correo autohospedado, nada de eso cambia.

### Registros TXT

La verificación de dominio para herramientas SaaS (Stripe, Slack, GitHub, Atlassian, etc.) sigue funcionando. Agregue y elimine registros TXT según sea necesario.

### Registros CAA

Autorización de Autoridad de Certificación (CAA): los registros que indican a las autoridades de certificación (Let's Encrypt, DigiCert) quién tiene permiso para emitir certificados para su dominio, siguen funcionando sin cambios.

### Certificados TLS / SSL

Sigue obteniendo los certificados de quien se los proporcionaba antes. Let's Encrypt, su proveedor de CDN, su balanceador de carga: el mismo flujo. Los desafíos ACME (DNS-01 o HTTP-01) funcionan de la misma manera.

### Renovaciones

El dominio se sigue renovando a través del registrador, en el mismo calendario y facturado de la misma manera. La tokenización no introduce ningún mecanismo de renovación nuevo.

---

## Lo que *SÍ* cambia (un poco)

### Quién controla el dominio

Antes: quienquiera que tuviera el inicio de sesión de la cuenta del registrador.
Después: **quien posea el NFT on-chain** tiene el control autoritativo. El panel de Namefi vincula el NFT a la cuenta del registrador a través del protocolo, por lo que la billetera es la fuente de la verdad.

Este es el punto principal. También es la razón por la que debe tomarse en serio la seguridad de la billetera; consulte [Recuperación de un dominio tokenizado después de la pérdida de la billetera](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/).

### Dónde hace clic para administrar el DNS

La mayoría de los propietarios administran los registros DNS dentro del panel de Namefi después de la tokenización: el panel se comunica con el registrador en su nombre. Si prefiere mantener su DNS en Cloudflare/Route53, etc., simplemente deje sus servidores de nombres apuntando allí e ignore la interfaz de usuario de DNS dentro de la aplicación. Ambos patrones funcionan.

### Transferencia del dominio

Antes: flujo de [transferencia entre registradores](/en/glossary/cross-registrar-transfer/), con [códigos de autorización](/en/glossary/auth-code/) (auth codes) y períodos de espera de 60 días.
Después: [**transferencia del NFT**](/en/glossary/atomic-transfer/). Una sola transacción on-chain transfiere la propiedad. El protocolo mantiene sincronizado el registro del lado del registrador. Esto es drásticamente más rápido, y es por eso que los mercados de dominios tokenizados no necesitan el [depósito de garantía (escrow)](/en/glossary/escrow/) tradicional (consulte [Desde la publicación hasta la liquidación](/en/blog/how-tokenized-marketplaces-replace-escrow/)).

Aún puede realizar una transferencia tradicional de registrador si lo desea; la capa on-chain no lo impide.

---

## DNSSEC en un dominio tokenizado

[DNSSEC](/en/glossary/dnssec/) funciona. Si lo tenía habilitado antes, permanece habilitado. Si no, puede habilitarlo después de tokenizar. La cadena de confianza se ejecuta a través del registro como de costumbre; la capa on-chain no se encuentra en ninguna parte de esa ruta. (Contexto: [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) define el protocolo; la [explicación de la ceremonia KSK de la ICANN](https://www.icann.org/dns-resolvers-checking-current-trust-anchors) describe el proceso de la raíz de confianza).

Algunas notas prácticas:

- Si su DNS está en Cloudflare o Route53, esos proveedores se encargan de la firma de DNSSEC por usted. Simplemente actívelo en el lado del registrador, lo cual puede hacer a través del panel de Namefi.
- Los registros DS se gestionan a nivel de registrador / registro. Si rota las KSK, publicará nuevos registros DS a través del mismo flujo que siempre ha utilizado.
- Los fallos de DNSSEC son visibles en herramientas estándar (`dig +dnssec`, [dnsviz.net](https://dnsviz.net/), el [analizador de DNSSEC de Verisign](https://dnssec-debugger.verisignlabs.com/)). La tokenización no introduce un nuevo modo de fallo.

---

## Entregabilidad de correo electrónico después de la tokenización

La gente suele preocuparse más por el correo electrónico, así que seamos explícitos: **nada sobre el correo electrónico cambia.**

Sus registros MX siguen enrutando el correo a su proveedor. SPF sigue autorizando a los remitentes. DKIM sigue firmando los mensajes salientes. DMARC sigue aplicando la alineación. La reputación vive en el par IP / dominio de envío, y su dominio sigue siendo su dominio: el mismo nombre, la misma antigüedad, el mismo historial.

Si está cambiando de proveedor de correo casi al mismo tiempo que tokeniza (una ocasión común para hacer limpieza), realice esos cambios de uno en uno. No es porque la tokenización rompa nada; es simplemente una buena higiene operativa cambiar una variable a la vez.

---

## Referencia rápida: Registros comunes

| Registro | Usado para | ¿Afectado por la tokenización? |
|---|---|---|
| A / AAAA | IPs de sitios web | No |
| CNAME / ALIAS | Alias | No |
| MX | Enrutamiento de correo electrónico | No |
| TXT | Verificación, SPF, DKIM, DMARC | No |
| CAA | Restricciones de la autoridad de certificados | No |
| NS | Delegación | No (sigue eligiendo los servidores de nombres) |
| DS | Delegación de DNSSEC | No (se gestiona en el registro como de costumbre) |
| SRV | Ubicación del servicio | No |
| TLSA | DANE | No |

Toda la capa «tokenizada» se encuentra *junto al* DNS, no encima de él.

---

## Dónde suele tropezar la gente en realidad

- **Olvidar qué billetera contiene el NFT.** Este no es un problema de DNS, pero es la causa principal por la que las personas pierden el acceso a un dominio tokenizado. Anótelo.
- **Cambiar los servidores de nombres y el proveedor de DNS al mismo tiempo.** Es tentador, pero introduce riesgos innecesarios. Tokenice primero y, si lo desea, cambie de proveedor de DNS más tarde.
- **Asumir que la capa on-chain envía automáticamente los cambios de DNS.** No es así. Los cambios de DNS siguen pasando a través de los proveedores de DNS y toman el tiempo de propagación normal (de minutos a algunas horas, dependiendo de los TTL).
- **Deshabilitar DNSSEC durante una migración.** Si apaga y enciende DNSSEC, hágalo limpiamente con las actualizaciones adecuadas de los registros DS. Un DNSSEC a medio implementar rompe la resolución en todas partes.

---

## Aviso amistoso (¡Léame!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo es asesoramiento legal, financiero, fiscal, contable, médico ni de ningún otro tipo profesional.** Escribimos estas publicaciones para educarnos a nosotros mismos y para la comodidad de nuestros clientes. La información aquí contenida puede estar desactualizada, ser específica de una región o simplemente estar equivocada: nosotros también cometemos errores.
>
> Para cualquier decisión importante, **consulte a un profesional real (¡en serio!)**. O si ese no es su estilo, pregúntele a un amigo, a Twitter, a Reddit, a una IA o a un vidente. En resumen: **DOYR — Do Your Own Research (Haga su propia investigación)**. Aprendamos y divirtámonos.

---

## Resumen

- La tokenización de un dominio no reemplaza el DNS. El DNS sigue haciendo su trabajo.
- Sus servidores de nombres, sitio web, correo electrónico (MX/SPF/DKIM/DMARC), DNSSEC, CAA y certificados TLS continúan funcionando sin cambios.
- Lo que sí cambia es **la propiedad**: el NFT en su billetera es el nuevo punto de control autoritativo. Las transferencias se realizan on-chain en lugar de a través de la burocracia del registrador.
- Puede mantener su DNS en Cloudflare, Route53 o donde sea que se encuentre. O gestionarlo a través de Namefi. Ambas opciones son válidas.
- Implicación práctica: un `.com` tokenizado es operativamente indistinguible de un `.com` no tokenizado, hasta que vaya a venderlo o transferirlo, momento en el que la capa on-chain hace que todo sea drásticamente más rápido.

Para obtener una guía a nivel de operador sobre cómo tokenizar en primer lugar, consulte [Cómo tokenizar su .com](/en/blog/how-to-tokenize-your-com/).