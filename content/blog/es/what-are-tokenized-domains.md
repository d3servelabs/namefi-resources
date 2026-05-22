---
title: '¿Qué son los dominios tokenizados? Una guía sobre la tokenización de dominios'
date: '2026-05-22'
language: es
tags: ['faq']
authors: ['namefiteam']
draft: false
description: 'Una introducción en lenguaje sencillo a los dominios tokenizados y la tokenización de dominios: qué significa tokenizar un dominio, cómo funciona la tokenización de dominios y en qué se diferencia un dominio tokenizado de los dominios tradicionales y de los nombres exclusivos de blockchain como ENS.'
keywords: ['dominio tokenizado', 'dominios tokenizados', 'tokenizar un dominio', 'tokenizar dominios', 'tokenizar dominio', 'tokenizando un dominio', 'tokenizando dominios', 'tokenización de dominios', 'tokenización de un dominio', 'tokenización de nombres de dominio', 'cómo tokenizar un dominio', 'qué es un dominio tokenizado', 'qué son los dominios tokenizados', 'dominios NFT', 'dominio NFT', 'dominios on-chain', 'dominio on-chain', 'dominios blockchain', 'dominio blockchain', 'DNS', 'dominios ICANN', 'dominios web3', 'dominio web3', 'NFT de dominio', 'dominio como NFT', 'namefi', 'propiedad de dominio', 'tokenización de activos de dominio', 'Namefi', 'D3', 'D3 Global Inc', 'D3 Inc', 'Doma', 'Doma Protocol', 'Domora', 'WebUnited', 'GBM', 'GBM Auctions', 'ENS', 'Ethereum Name Service', 'Unstoppable Domains', 'Freename', 'GoDaddy', 'Identity Digital', 'Namefi vs ENS', 'Namefi vs Unstoppable Domains', 'Namefi vs D3', 'dominio tokenizado vs ENS', 'dominio tokenizado vs dominio web3', 'dominio ICANN vs dominio web3', 'comparar plataformas de dominios tokenizados']
---

Es posible que haya escuchado frases como "dominio tokenizado", "tokenizar un dominio" o "tokenización de dominios" y se haya preguntado qué significan realmente. ¿Es un dominio tokenizado un nuevo tipo de dominio? ¿Un nombre exclusivo de blockchain? ¿Un reemplazo para `.com`? Y, en primer lugar, ¿qué significa *tokenizar* un dominio?

Este artículo responde directamente a la pregunta del **"qué"**: qué *es* un dominio tokenizado, qué *significa* la tokenización de dominios, qué *no* es tokenizar un dominio y cómo se relaciona toda esta idea con los nombres de dominio que ya conoce.

> Si desea comprender *por qué* es importante la tokenización de dominios, consulte [¿Por qué tokenizar dominios on-chain?](/en/blog/why-tokenize-domains/). Esta publicación se centra en el *qué*.

---

## La definición breve

Un **dominio tokenizado** es un [nombre de dominio](/en/blog/what-is-domain/) normal reconocido por la [ICANN](/en/glossary/icann/) (como `mimarca.xyz` o `example.com`) cuya propiedad también se representa como un **token en una blockchain** (generalmente un [NFT](/en/glossary/nft/)). El proceso de creación de esa representación respaldada por tokens se denomina **tokenización de dominios**, y el acto en sí es a lo que la gente se refiere cuando dice *tokenizar un dominio* o *tokenizar dominios*.

En otras palabras:

> Un dominio tokenizado es un solo dominio con **dos capas de propiedad sincronizadas**: el registro tradicional del [DNS](/en/glossary/dns/), *y* un token on-chain que lo refleja. **Tokenizar un dominio** es agregar esa segunda capa on-chain a un nombre de dominio existente o recién registrado.

Cuando transfiere el token, el dominio subyacente lo sigue. Cuando el dominio expira o se renueva, el token refleja ese estado.

---

## Dos capas, un dominio

Resulta útil imaginar que un dominio tokenizado tiene dos registros sincronizados:

| Capa             | Qué es                                              | Quién la mantiene                         |
|------------------|-----------------------------------------------------|-------------------------------------------|
| DNS / Registro   | El registro oficial en el [registrador](/en/glossary/registrar/) y el registro (registry) | [Registradores](/en/glossary/registrar/) acreditados por la [ICANN](/en/glossary/icann/) |
| Token on-chain   | Un [NFT](/en/glossary/nft/) en su [billetera](/en/glossary/wallet/) que representa la propiedad | Un [contrato inteligente](/en/glossary/smart-contract/) en una blockchain pública |

Ambas capas se mantienen sincronizadas mediante la plataforma de tokenización de dominios (en el caso de Namefi, mediante el protocolo de Namefi y sus integraciones con los registradores). Siempre que hablamos de *tokenizar un dominio*, *tokenizar dominios* o *tokenización de nombres de dominio*, nos referimos a establecer y mantener esta relación de dos capas para un dominio específico.

Esto es diferente de poseer un dominio *solo* en un registrador (el modelo tradicional) y diferente de poseer un nombre *solo* on-chain (el modelo al estilo ENS). Un dominio tokenizado es deliberadamente ambas cosas.

---

## Lo que *no* son los dominios tokenizados

Vale la pena aclarar algunos conceptos erróneos comunes sobre la tokenización de dominios:

### No es un nuevo TLD

Un dominio tokenizado no es un nombre del estilo `.crypto`, `.eth` o `.x`. Cuando tokeniza un dominio a través de Namefi, utiliza los mismos TLD que ya conoce (`.com`, `.xyz`, `.io`, `.art`, etc.) y que se resuelven en cualquier navegador, cliente de correo electrónico o resolutor de DNS del mundo.

### No es lo mismo que ENS o los "nombres de blockchain"

Los nombres de [ENS](/en/glossary/ens/) (como `vitalik.eth`) viven completamente on-chain y no se resuelven en el DNS estándar sin puentes o resolutores especiales. Los dominios tokenizados, por el contrario, son **dominios DNS reales** que *también* tienen una representación on-chain. La tokenización de dominios añade la capa on-chain a un nombre DNS real; no reemplaza el DNS con un sistema de nombres paralelo.

| Característica                   | Dominio tradicional | ENS / Nombre de blockchain | Dominio tokenizado |
|----------------------------------|---------------------|----------------------------|--------------------|
| Funciona en cualquier navegador  | Sí                 | Requiere resolutor         | Sí                |
| Reconocido por la ICANN          | Sí                 | No                         | Sí                |
| Se guarda en su billetera        | No                 | Sí                         | Sí                |
| Transferible on-chain            | No                 | Sí                         | Sí                |
| Componible con contratos inteligentes | No                 | Sí                         | Sí                |

### No están a prueba de censura ni "fuera de la ley"

Debido a que el activo subyacente es un dominio DNS real, los dominios tokenizados siguen sujetos a renovación, a las políticas de la [ICANN](/en/glossary/icann/), a las disputas de la política [UDRP](/en/glossary/udrp/) y a la ley aplicable. El token refleja la propiedad; no exime al dominio de las reglas del mundo real.

---

## Cómo funciona la tokenización de un dominio en la práctica

Esto es lo que realmente sucede cuando tokeniza un dominio (o registra un dominio tokenizado completamente nuevo) en Namefi:

1. **Registro** — Se registra (o se transfiere) un dominio DNS real a través de un [registrador](/en/glossary/registrar/) acreditado.
2. **Acuñación (Minting)** — Como parte de la tokenización del dominio, se acuña (mint) un [NFT](/en/glossary/nft/) que representa ese dominio en su [billetera](/en/glossary/wallet/).
3. **Sincronización** — La plataforma mantiene la propiedad a nivel de DNS alineada con la propiedad on-chain para cada dominio tokenizado. Si transfiere el NFT, el registro DNS lo sigue.
4. **Uso** — Puede apuntar el dominio tokenizado a un sitio web, configurar registros DNS o usar el NFT en aplicaciones on-chain (mercados, identidad, [DeFi](/en/glossary/defi/), etc.).

La experiencia del usuario final es: *un dominio, dos formas de interactuar con él*, el familiar mundo del DNS y el mundo programable on-chain que desbloquea la tokenización de dominios.

---

## Qué puede hacer con un dominio tokenizado

Debido a que ambas capas existen, obtiene la unión de ambas capacidades:

- **Usarlo como un dominio normal** — alojar un sitio web, configurar correo electrónico, configurar registros DNS.
- **Guardarlo en su propia billetera** — no se requiere una cuenta alojada por terceros para tener la propiedad.
- **Transferirlo en segundos** — envíe el NFT a otra billetera; el registro DNS lo seguirá.
- **Listarlo en mercados de NFT** — OpenSea, Blur, entre otros.
- **Usarlo en contratos inteligentes** — como garantía, en [subastas](/en/glossary/auction/), [arrendamientos](/en/glossary/leasing/), [propiedad fraccionada](/en/glossary/fractional-ownership/) y más.
- **Vincularlo a una identidad on-chain** — enlazarlo a sistemas como [Farcaster](/en/glossary/farcaster/), [Lens](/en/glossary/lens/) o [DID](/en/glossary/did/).

---

## Principales plataformas que tokenizan dominios

La tokenización de dominios ya no es un experimento de un solo proveedor: varias plataformas ofrecen ahora formas de tokenizar un dominio o trabajar con dominios tokenizados, cada una con un enfoque ligeramente diferente. A continuación, se presenta un resumen de los nombres más reconocidos en este espacio.

> Los enlaces externos a continuación se proporcionan como referencias útiles, no como patrocinios.

### 1. Namefi (esos somos nosotros)

**Enfoque:** Tokenizar dominios reales de la ICANN (`.com`, `.xyz`, `.io`, `.art` y muchos más) como NFT mientras se mantiene la capa DNS completamente funcional. Ambas capas se mantienen sincronizadas a través de [registradores](/en/glossary/registrar/) acreditados.

**Lo que distingue a Namefi:** Namefi fue la **primera plataforma en tokenizar dominios reales de la ICANN en la red principal de Ethereum, y la primera en hacerlo en Base**. Debido a que los dominios tokenizados por Namefi viven en Ethereum y Base, se integran de forma natural con **la mayoría de los principales mercados de NFT y protocolos de préstamos** (OpenSea, Blur, NFTfi, entre otros) gracias al ecosistema [DeFi](/en/glossary/defi/) profundo y maduro de Ethereum. Otras plataformas han tomado sus propias decisiones sobre las cadenas que se adaptan a sus objetivos; Ethereum y Base brindan a los usuarios de Namefi la más amplia compatibilidad inmediata con las herramientas de NFT y DeFi existentes en la actualidad.

**Ideal para:** Propietarios que desean un dominio real resoluble en navegadores *y* una propiedad nativa de billetera y componible en un solo producto, en la cadena con el soporte más amplio para DeFi y NFT. Visite [namefi.io](https://namefi.io) para comenzar.

### 2. D3 Global Inc

**Enfoque:** Una plataforma centrada en llevar TLD nuevos y existentes on-chain a nivel de registro, asociándose con operadores de TLD e infraestructura alineada con la ICANN.

**Ideal para:** Iniciativas de tokenización a nivel de registro y nuevos lanzamientos de TLD tokenizados. Sitio: [d3.inc](https://d3.inc).

### 3. Doma Protocol

**Enfoque:** Un esfuerzo a nivel de protocolo para estandarizar cómo se representan y transfieren los dominios reales on-chain a través de registradores y cadenas.

**Ideal para:** Desarrolladores que buscan abstracciones a nivel de protocolo para la tokenización de dominios. Sitio: [doma.xyz](https://doma.xyz).

### 4. Domora

**Enfoque:** Otra plataforma emergente en el espacio de dominios tokenizados, enfocada en llevar nombres de dominio reales on-chain.

**Ideal para:** Usuarios que evalúan alternativas en la categoría de dominios DNS tokenizados. Sitio: [domora.com](https://domora.com).

### 5. WebUnited

**Enfoque:** Un actor que explora la representación on-chain de dominios y la infraestructura relacionada para nombres de dominio reales.

**Ideal para:** Equipos que buscan opciones adicionales de dominios tokenizados. Sitio: [webunited.com](https://webunited.com).

### 6. GBM (Global Brand Marketplace / GBM Auctions)

**Enfoque:** Conocido por su infraestructura de subastas on-chain que se ha aplicado a la venta de dominios tokenizados y activos de marca.

**Ideal para:** Descubrimiento y venta de dominios tokenizados y activos de marca digitales relacionados impulsados por subastas. Sitio: [gbm.auction](https://gbm.auction).

### 7. Registradores tradicionales explorando la tokenización

Algunos [registradores](/en/glossary/registrar/) y registros establecidos de la ICANN (p. ej., [GoDaddy](https://www.godaddy.com), [Identity Digital](https://www.identity.digital)) han anunciado iniciativas o asociaciones exploratorias de tokenización. La cobertura y la disponibilidad varían ampliamente, y la mayor parte de su negocio principal sigue siendo el registro tradicional exclusivo de DNS.

---

## Una categoría hermana: ENS, Unstoppable Domains, Freename y dominios Web3

Un primo cercano de los dominios tokenizados es la familia de los **dominios Web3**, una categoría pionera gracias a excelentes proyectos como ENS, Unstoppable Domains y Freename. Queremos ser claros acerca de la distinción, no para menospreciar su trabajo (han contribuido enormemente a la identidad y a los nombres on-chain), sino para ayudar a los lectores a elegir la herramienta adecuada para sus objetivos.

Los dominios Web3 tienen un diseño deliberadamente diferente al de los dominios ICANN tokenizados. Aquí le explicamos cómo pensar en ellos:

- **Un espacio de nombres diferente por diseño.** Los dominios Web3 (`.eth`, `.crypto`, `.x`, `.nft` y los TLD creados por los usuarios) viven intencionalmente fuera de la raíz de la [ICANN](/en/glossary/icann/), lo que les permite iterar rápidamente y experimentar con nuevos modelos de nomenclatura. La contrapartida es que se sitúan junto a la jerarquía DNS tradicional en lugar de estar dentro de ella.
- **La resolución de navegadores y correos electrónicos requiere pasos adicionales.** Visitar un dominio Web3 en un navegador típico, o enviarle un correo electrónico, generalmente necesita un resolutor, una extensión o un puente. El ecosistema de billeteras, dApps y navegadores nativos de criptomonedas que *sí* los admiten está creciendo constantemente, pero la paridad con los navegadores estándar, servidores de correo, CDN, herramientas de SEO y autoridades de certificados SSL/TLS aún está en progreso.
- **Casos de uso nativos de billetera genuinamente novedosos.** Aquí es donde brillan los dominios Web3: reemplazando las largas direcciones `0x…` con nombres legibles por humanos, simplificando las transferencias de tokens, impulsando los inicios de sesión en dApps y sirviendo como primitivas de identidad on-chain. Muchos de estos patrones simplemente no existían antes de ENS y sus pares, y los dominios tokenizados se basan en esas ideas.
- **El perfil de adopción difiere de los dominios DNS / ICANN reales.** Los dominios reales (también llamados *dominios DNS*, *dominios ICANN* o *dominios reales*, p. ej., `.com`, `.org`, `.xyz`, `.io`) se benefician de décadas de soporte universal en todos los navegadores, proveedores de correo electrónico, CDN y autoridades de certificación. Los dominios Web3 tienen un alcance impresionante y creciente dentro del ecosistema nativo de criptomonedas, mientras que la adopción más amplia de Internet todavía se está poniendo al día.

Las principales plataformas de dominios Web3, valorando lo que aporta cada una:

- [ENS](https://ens.domains) — un sistema de nombres fundacional nativo de Ethereum (`.eth`) y una de las primitivas más importantes en Web3. ENS también ofrece puentes bien pensados a nombres DNS reales a través de [DNSSEC](/en/glossary/dnssec/).
- [Unstoppable Domains](https://unstoppabledomains.com) — un pionero temprano e influyente de nombres nativos de blockchain como `.crypto`, `.x` y `.nft`, con amplias integraciones de billeteras y dApps.
- [Freename](https://freename.io) — un enfoque ingenioso para los TLD y espacios de nombres de Web3 creados por los usuarios.

Si su objetivo principal es la **identidad on-chain** o la **nomenclatura Web3**, estas plataformas son excelentes y vale la pena explorarlas. Si su objetivo principal es un nombre que **también** funcione en cualquier navegador, cualquier cliente de correo electrónico, cualquier CDN y cualquier autoridad de certificados SSL (es decir, un dominio ICANN real que también puede mantener y programar desde su billetera), entonces las plataformas de dominios tokenizados anteriores (Namefi, D3 Global Inc, Doma Protocol, Domora, WebUnited, GBM) están diseñadas para ese caso de uso. Ambas categorías pueden coexistir felizmente, y muchos usuarios poseen ambas.

---

## Cómo elegir entre ellas

Una forma rápida de pensarlo:

| Si usted desea…                                                              | Considere                              |
|------------------------------------------------------------------------------|----------------------------------------|
| Un dominio `.com`/`.xyz`/`.io` real tokenizado en Ethereum o Base, con el soporte más amplio de mercados NFT y préstamos DeFi | **Namefi**                              |
| Asociaciones a nivel de registro para un TLD completamente nuevo             | D3 Global Inc                          |
| Estándares de capa de protocolo para dominios tokenizados                    | Doma Protocol                          |
| Plataformas adicionales de dominios DNS tokenizados para evaluar             | Domora, WebUnited                      |
| Infraestructura de venta impulsada por subastas para dominios tokenizados    | GBM                                    |
| Identidad on-chain y nombres nativos de Ethereum (p. ej., `.eth`): una categoría hermana, no un dominio ICANN tokenizado | ENS                                    |
| TLD nativos de Web3 diseñados para casos de uso centrados en la billetera: una categoría hermana, no un dominio ICANN tokenizado | Unstoppable Domains, Freename          |
| Registro tradicional con pilotos de tokenización opcionales específicos del proveedor | GoDaddy, Identity Digital, otros       |

La distinción clave a recordar: **tokenizar un dominio (en el sentido de Namefi) significa mantener un nombre DNS real reconocido por la ICANN y agregar un token on-chain por encima**, no reemplazar el DNS con un sistema de nombres Web3 paralelo.

---

## Un modelo mental sencillo

Si un dominio tradicional es una **escritura que un tercero guarda en su nombre**, un dominio tokenizado es la **misma escritura, con una copia criptográfica en su propio bolsillo**, y ambas se mantienen sincronizadas.

No pierde la capa legal/de registro. Gana una capa programable por encima.

---

## Resumen

- Un **dominio tokenizado** es un dominio DNS real con un token on-chain (generalmente un NFT) que refleja su propiedad.
- La **tokenización de dominios** (también llamada *tokenización de nombres de dominio* o *tokenización de un dominio*) es el proceso de crear y mantener esa representación on-chain.
- **Tokenizar un dominio** (o *tokenizar dominios* en masa) es agregar esta capa de propiedad nativa de billetera a un dominio ICANN real, sin renunciar a la capa DNS tradicional.
- Un dominio tokenizado **no** es un TLD nuevo, no es un nombre al estilo ENS, y no es una forma de eludir el DNS ni la ley.
- Le brinda todo lo que hace un dominio tradicional, *además* de la propiedad nativa de la billetera y la componibilidad con aplicaciones on-chain.

Para explorar *por qué* esto es importante y qué es lo que desbloquea la tokenización de dominios, lea [¿Por qué tokenizar dominios on-chain?](/en/blog/why-tokenize-domains/). Para registrar o tokenizar su primer dominio, visite [namefi.io](https://namefi.io).