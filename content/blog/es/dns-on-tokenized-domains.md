---
title: "El DNS sigue funcionando: servidores de nombres, correo electrónico y DNSSEC en un dominio tokenizado"
date: '2026-05-22'
language: es
tags: ['guide']
authors: ['namefiteam']
draft: false
description: Un vistazo práctico a cómo el DNS habitual —servidores de nombres, A/AAAA, MX, TXT, DNSSEC, CAA— sigue funcionando después de tokenizar un dominio de la ICANN. Qué cambia, qué no y a dónde apuntar tu proveedor de DNS existente.
keywords: ['dominio tokenizado DNS', 'dominio NFT DNSSEC', 'servidores de nombres dominio tokenizado', 'correo electrónico dominio tokenizado', 'registros MX dominio NFT', 'registros CAA dominio tokenizado', 'gestión DNS dominio tokenizado', 'DNS dominio on-chain', 'MX dominio NFT', 'DNSSEC dominio NFT', 'Cloudflare dominio tokenizado', 'Route53 dominio tokenizado', 'cómo funciona DNS tokenizado', 'resolución dominio tokenizado']
---

Una preocupación común sobre la tokenización de un dominio: *"¿Seguirá funcionando mi sitio web? ¿Seguirá funcionando mi correo electrónico? ¿Tendré que aprender toda una nueva pila de DNS?"*

Respuesta corta: **sí, sí, no.** Un dominio tokenizado sigue siendo un dominio real de la ICANN. El DNS sigue haciendo exactamente lo que hace el DNS. Esta publicación es un recorrido por lo que cambia (un poco) y lo que no (la mayor parte).

---

## La única idea que debes tener en mente

Un dominio tokenizado tiene **dos capas**:

1. **La capa de [DNS](/es/glossary/dns/) / registro**: la misma en la que tu `.com` siempre ha vivido. [ICANN](/es/glossary/icann/), el [registrador](/es/glossary/registrar/), los servidores raíz, los resolutores recursivos.
2. **La capa [on-chain](/es/glossary/on-chain/)**: un [NFT](/es/glossary/nft/) en tu [billetera](/es/glossary/wallet/) que representa la *propiedad*.

La resolución de DNS (convertir `example.com` en una dirección IP) ocurre completamente en la capa 1. La capa on-chain trata sobre **quién controla el dominio**, no sobre cómo se resuelve. Los navegadores, servidores de correo electrónico, CDN y autoridades de certificación nunca necesitan saber que existe una blockchain.

Por eso "el DNS sigue funcionando". No es magia. Es el mismo DNS.

---

## Lo que no cambia

### Servidores de nombres

Sigues configurando los servidores de nombres para tu dominio. Usa Cloudflare, Route53, Namecheap, Google Cloud DNS, dnsimple: cualquiera que hayas usado antes está bien. Muchas personas dejan a su proveedor de DNS exactamente donde estaba al tokenizar y nunca lo vuelven a tocar.

### Registros A, AAAA, CNAME, ALIAS

Todo es estándar. Tu sitio web se resuelve de la misma manera que lo hizo ayer.

### MX, SPF, DKIM, DMARC

El correo electrónico sigue funcionando. La tokenización tiene cero impacto en la entrega de correo. Si usas Google Workspace, Microsoft 365, Fastmail, ProtonMail o un servidor de correo autoalojado, nada de eso cambia.

### Registros TXT

La verificación de dominio para herramientas SaaS (Stripe, Slack, GitHub, Atlassian, etc.) sigue funcionando. Agrega y elimina registros TXT según sea necesario.

### Registros CAA

La Autorización de Autoridad de Certificación (CAA) —los registros que indican a las autoridades de certificación (Let's Encrypt, DigiCert) quién está autorizado para emitir certificados para tu dominio— siguen funcionando sin cambios.

### Certificados TLS / SSL

Sigues obteniendo los certificados de quien sea que te los proporcionaba antes. Let's Encrypt, tu proveedor de CDN, tu equilibrador de carga: el mismo flujo. Los desafíos ACME (DNS-01 o HTTP-01) funcionan de la misma manera.

### Renovaciones

El dominio se sigue renovando a través del registrador, en el mismo calendario y facturado de la misma forma. La tokenización no introduce ningún mecanismo de renovación nuevo.

---

## Lo que *sí* cambia (un poco)

### Quién controla el dominio

Antes: quien tuviera el inicio de sesión de la cuenta del registrador.
Después: **quien posea el NFT on-chain** tiene el control autoritativo. El panel de Namefi vincula el NFT a la cuenta del registrador a través del protocolo, por lo que la billetera es la fuente de la verdad.

Este es el punto principal. También es la razón por la que debes tomarte en serio la seguridad de tu billetera: consulta [Recuperación de un dominio tokenizado tras la pérdida de la billetera](/es/blog/recovering-a-tokenized-domain-after-wallet-loss/).

### Dónde haces clic para gestionar el DNS

La mayoría de los propietarios gestionan los registros DNS dentro del panel de Namefi después de la tokenización: el panel se comunica con el registrador en tu nombre. Si prefieres mantener tu DNS en Cloudflare/Route53, etc., simplemente deja tus servidores de nombres apuntando allí e ignora la interfaz de DNS de la aplicación. Ambos patrones funcionan.

### Transferencia del dominio

Antes: flujo de [transferencia entre registradores](/es/glossary/cross-registrar-transfer/), con [códigos de autorización](/en/glossary/auth-code/) y periodos de espera de 60 días.
Después: [**transferir el NFT**](/es/glossary/atomic-transfer/). Una sola transacción on-chain transfiere la propiedad. El protocolo mantiene sincronizado el registro en el lado del registrador. Esto es radicalmente más rápido y es la razón por la que los mercados de dominios tokenizados no necesitan el tradicional [depósito de garantía (escrow)](/es/glossary/escrow/) (consulta [Del listado a la liquidación](/es/blog/how-tokenized-marketplaces-replace-escrow/)).

Todavía puedes hacer una transferencia de registrador tradicional si lo deseas; la capa on-chain no lo impide.

---

## DNSSEC en un dominio tokenizado

[DNSSEC](/en/glossary/dnssec/) funciona. Si lo tenías habilitado antes, seguirá habilitado. Si no, puedes habilitarlo después de tokenizar. La cadena de confianza pasa a través del registro como de costumbre: la capa on-chain no interfiere en ninguna parte de esa ruta. (Contexto: el [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) define el protocolo; [la explicación de la ceremonia KSK de la ICANN](https://www.icann.org/dns-resolvers-checking-current-trust-anchors) describe el proceso de la raíz de confianza).

Algunas notas prácticas:

- Si tu DNS está en Cloudflare o Route53, esos proveedores se encargan de la firma DNSSEC por ti. Solo actívalo en el lado del registrador, lo cual puedes hacer a través del panel de Namefi.
- Los registros DS se gestionan a nivel de registrador / registro. Si rotas las KSK, publicarás nuevos registros DS a través del mismo flujo que siempre has utilizado.
- Los fallos de DNSSEC son visibles en herramientas estándar (`dig +dnssec`, [dnsviz.net](https://dnsviz.net/), [el analizador DNSSEC de Verisign](https://dnssec-debugger.verisignlabs.com/)). La tokenización no introduce un nuevo modo de fallo.

---

## Entregabilidad del correo electrónico tras la tokenización

La gente del correo electrónico es la que más se preocupa, así que seamos explícitos: **nada sobre el correo electrónico cambia.**

Tus registros MX siguen enrutando el correo a tu proveedor. SPF sigue autorizando a los remitentes. DKIM sigue firmando los mensajes salientes. DMARC sigue aplicando la alineación. La reputación vive en el par IP de envío / dominio, y tu dominio sigue siendo tu dominio: mismo nombre, misma antigüedad, mismo historial.

Si vas a cambiar de proveedor de correo al mismo tiempo que tokenizas (una ocasión común para hacer limpieza), haz esos cambios uno a la vez. No es porque la tokenización rompa algo; es simplemente una buena higiene operativa cambiar una variable a la vez.

---

## Referencia rápida: Registros comunes

| Registro | Se usa para | ¿Afectado por la tokenización? |
|---|---|---|
| A / AAAA | IP de sitios web | No |
| CNAME / ALIAS | Alias | No |
| MX | Enrutamiento de correo | No |
| TXT | Verificación, SPF, DKIM, DMARC | No |
| CAA | Restricciones de autoridad de certificación | No |
| NS | Delegación | No (sigues eligiendo los servidores de nombres) |
| DS | Delegación DNSSEC | No (gestionado en el registro como de costumbre) |
| SRV | Ubicación de servicios | No |
| TLSA | DANE | No |

Toda la capa "tokenizada" se sitúa *al lado* del DNS, no encima de él.

---

## Dónde suele tropezar la gente

- **Olvidar qué billetera contiene el NFT.** Este no es un problema de DNS, pero es la razón número uno por la que las personas pierden el acceso a un dominio tokenizado. Anótalo.
- **Cambiar los servidores de nombres y el proveedor de DNS al mismo tiempo.** Es tentador, pero introduce un riesgo innecesario. Tokeniza primero, luego cambia de proveedor de DNS si lo deseas.
- **Asumir que la capa on-chain envía automáticamente los cambios de DNS.** No lo hace. Los cambios de DNS siguen pasando por los proveedores de DNS y toman el tiempo de propagación normal (de minutos a unas pocas horas, según los TTL).
- **Deshabilitar DNSSEC durante una migración.** Si desactivas y activas DNSSEC, hazlo limpiamente con las actualizaciones adecuadas de los registros DS. Un DNSSEC mal implementado a medias rompe la resolución en todas partes.

---

## Descargo de responsabilidad amistoso (¡Léeme!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo constituye asesoramiento legal, financiero, fiscal, contable, médico ni ningún otro tipo de asesoramiento profesional.** Escribimos estas publicaciones para educarnos a nosotros mismos y como una comodidad para nuestros clientes. La información aquí puede estar desactualizada, ser específica de una geografía o simplemente estar equivocada: nosotros también cometemos errores.
>
> Para cualquier decisión importante, **por favor, consulta a un verdadero profesional (¡en serio!)**. O si ese no es tu estilo, pregúntale a un amigo, a Twitter, a Reddit, a una IA o a un vidente. En resumen: **DOYR — Haz tu propia investigación (Do Your Own Research)**. Aprendamos y divirtámonos.

---

## Resumen

- Tokenizar un dominio no reemplaza al DNS. El DNS sigue haciendo lo que hace el DNS.
- Tus servidores de nombres, sitio web, correo electrónico (MX/SPF/DKIM/DMARC), DNSSEC, CAA y certificados TLS siguen funcionando sin cambios.
- Lo que sí cambia es la **propiedad**: el NFT en tu billetera es el nuevo punto de control autoritativo. Las transferencias ocurren on-chain en lugar de a través de la burocracia del registrador.
- Puedes mantener tu DNS en Cloudflare, Route53 o donde sea que resida. O gestionarlo a través de Namefi. Ambas opciones son válidas.
- Implicación práctica: un `.com` tokenizado es operativamente indistinguible de un `.com` no tokenizado, hasta que vas a venderlo o transferirlo, momento en el cual la capa on-chain hace que todo sea radicalmente más rápido.

Para obtener una guía a nivel de operador sobre cómo tokenizar en primer lugar, consulta [Cómo tokenizar tu .com](/es/blog/how-to-tokenize-your-com/).