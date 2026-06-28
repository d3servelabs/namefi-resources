---
title: "¿Qué son los dominios tokenizados? Una guía sobre la tokenización de dominios"
date: '2026-05-22'
language: es
priority: P0
tags: ['faq']
authors: ['namefiteam']
draft: false
description: "Una introducción en lenguaje sencillo a los dominios tokenizados y a la tokenización de dominios: qué significa tokenizar un dominio, cómo funciona la tokenización de dominios y en qué se diferencia un dominio tokenizado de los dominios tradicionales y de los nombres exclusivos de blockchain como ENS."
keywords: ['dominio tokenizado', 'dominios tokenizados', 'tokenizar un dominio', 'tokenizar dominios', 'tokenizar dominio', 'tokenizando un dominio', 'tokenizando dominios', 'tokenización de dominios', 'tokenización de un dominio', 'tokenización de nombres de dominio', 'cómo tokenizar un dominio', 'qué es un dominio tokenizado', 'qué son los dominios tokenizados', 'dominios NFT', 'dominio NFT', 'dominios on-chain', 'dominio on-chain', 'dominios blockchain', 'dominio blockchain', 'DNS', 'dominios ICANN', 'dominios web3', 'dominio web3', 'NFT de dominio', 'dominio como NFT', 'namefi', 'propiedad de dominio', 'tokenización de activos de dominio', 'Namefi', 'D3', 'D3 Global Inc', 'D3 Inc', 'Doma', 'Doma Protocol', 'Domora', 'WebUnited', 'GBM', 'GBM Auctions', 'ENS', 'Ethereum Name Service', 'Unstoppable Domains', 'Freename', 'GoDaddy', 'Identity Digital', 'Namefi vs ENS', 'Namefi vs Unstoppable Domains', 'Namefi vs D3', 'dominio tokenizado vs ENS', 'dominio tokenizado vs dominio web3', 'dominio ICANN vs dominio web3', 'comparar plataformas de dominios tokenizados']
relatedArticles:
  - /es/blog/premium-web3-tlds/
  - /es/blog/ens-vs-unstoppable-vs-tokenized-dns/
  - /es/blog/tokenized-domain-vs-web3-domain/
  - /es/blog/how-to-sell-a-domain-name-you-own/
  - /es/blog/choosing-a-domain-tokenization-platform/
relatedTopics:
  - /es/topics/domain-tokenization/
  - /es/topics/choosing-a-tld/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/domain-investor-field-guide/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/dns/
  - /es/glossary/icann/
  - /es/glossary/tld/
  - /es/glossary/web3/
---

Es posible que hayas escuchado frases como "dominio tokenizado", "tokenizar un dominio" o "tokenización de dominios" y te hayas preguntado qué significan realmente. ¿Es un dominio tokenizado un nuevo tipo de dominio? ¿Un nombre exclusivo de [blockchain](/es/glossary/blockchain/)? ¿Un reemplazo para `.com`? Y, en primer lugar, ¿qué significa *tokenizar* un dominio?

Este artículo responde directamente a la pregunta de **"qué"**: qué *es* un dominio tokenizado, qué *significa* la tokenización de dominios, qué *no es* tokenizar un dominio y cómo se relaciona toda esta idea con los nombres de dominio que ya conoces.

> Si deseas comprender *por qué* es importante la tokenización de dominios, consulta [¿Por qué tokenizar dominios on-chain?](/es/blog/why-tokenize-domains/). Esta publicación se centra en el *qué*.

---

## La definición breve

Un **dominio tokenizado** es un [nombre de dominio](/es/blog/what-is-domain/) normal reconocido por la [ICANN](/es/glossary/icann/) (como `mimarca.xyz` o `ejemplo.com`) cuya propiedad también se representa como un **token en una blockchain**, generalmente un [NFT](/es/glossary/nft/). El proceso de creación de esa representación respaldada por un token se denomina **tokenización de dominios**, y el acto en sí es a lo que la gente se refiere cuando dice *tokenizar un dominio* o *tokenizar dominios*.

En otras palabras:

> Un dominio tokenizado es un dominio con **dos capas de propiedad sincronizadas**: el registro tradicional de [DNS](/es/glossary/dns/), *y* un token [on-chain](/es/glossary/on-chain/) que lo refleja. **Tokenizar un dominio** consiste en agregar esa segunda capa on-chain a un nombre de dominio existente o recién registrado.

Cuando transfieres el token, el dominio subyacente lo sigue. Cuando el dominio expira o se renueva, el token refleja ese estado.

---

## Dos capas, un dominio

Resulta útil imaginar que un dominio tokenizado tiene dos registros sincronizados:

| Capa | Qué es | Quién la mantiene |
|---|---|---|
| DNS / Registro | El registro oficial en el [registrador](/es/glossary/registrar/) y en el registro | [Registradores](/es/glossary/registrar/) acreditados por la [ICANN](/es/glossary/icann/) |
| Token on-chain | Un [NFT](/es/glossary/nft/) en tu [billetera](/es/glossary/wallet/) que representa la propiedad | Un [contrato inteligente](/es/glossary/smart-contract/) en una blockchain pública |

Las dos capas se mantienen sincronizadas mediante la plataforma de tokenización de dominios (en el caso de Namefi, mediante el protocolo Namefi y sus integraciones con registradores). Siempre que hablamos de *tokenizar un dominio*, *tokenizar dominios* o la *tokenización de nombres de dominio*, nos referimos a establecer y mantener esta relación de dos capas para un dominio específico.

Esto es diferente a poseer un dominio *solo* en un registrador (el modelo tradicional) y diferente a poseer un nombre *solo* on-chain (el modelo estilo ENS). Un dominio tokenizado es ambos, de forma deliberada.

---

## Lo que *no son* los dominios tokenizados

Vale la pena aclarar algunos conceptos erróneos comunes sobre la tokenización de dominios:

### No son un nuevo TLD

Un dominio tokenizado no es un nombre de estilo `.crypto`, `.eth` o `.x`. Cuando tokenizas un dominio a través de Namefi, utilizas los mismos TLD que ya conoces (`.com`, `.xyz`, `.io`, `.art`, etc.), los cuales se resuelven en cualquier navegador, cliente de correo electrónico o resolutor de DNS del mundo.

### No son lo mismo que ENS o los "nombres blockchain"

Los nombres de [ENS](/es/glossary/ens/) (como `vitalik.eth`) viven completamente on-chain y no se resuelven en el DNS estándar sin puentes o resolutores especiales. Los dominios tokenizados, por el contrario, son **dominios DNS reales** que *también* tienen una representación on-chain. La tokenización de dominios agrega la capa on-chain a un nombre DNS real; no reemplaza al DNS con un sistema de nombres paralelo.

| Característica | Dominio Tradicional | ENS / Nombre Blockchain | Dominio Tokenizado |
|---|---|---|---|
| Funciona en cualquier navegador | Sí | Requiere resolutor | Sí |
| Reconocido por la ICANN | Sí | No | Sí |
| Guardado en tu billetera | No | Sí | Sí |
| Transferible on-chain | No | Sí | Sí |
| Componible con contratos inteligentes | No | Sí | Sí |

### No son a prueba de censura ni están "al margen de la ley"

Debido a que el activo subyacente es un dominio DNS real, los dominios tokenizados siguen sujetos a renovación, a las políticas de la [ICANN](/es/glossary/icann/), a las disputas [UDRP](/es/glossary/udrp/) y a la ley aplicable. El token refleja la propiedad; no exime al dominio de las reglas del mundo real.

---

## Cómo funciona la tokenización de un dominio en la práctica

Esto es lo que sucede realmente cuando tokenizas un dominio (o registras un dominio tokenizado completamente nuevo) en Namefi:

1. **Registro**: Se registra (o transfiere) un dominio DNS real a través de un [registrador](/es/glossary/registrar/) acreditado.
2. **Acuñación (Minting)**: Como parte de la tokenización del dominio, se acuña en tu [billetera](/es/glossary/wallet/) un [NFT](/es/glossary/nft/) que representa dicho dominio.
3. **Sincronización**: La plataforma mantiene la propiedad a nivel de DNS alineada con la propiedad on-chain para cada dominio tokenizado. Si transfieres el NFT, el registro DNS lo sigue.
4. **Uso**: Puedes apuntar el dominio tokenizado a un sitio web, configurar registros DNS o utilizar el NFT en aplicaciones on-chain (mercados, identidad, [DeFi](/es/glossary/defi/), etc.).

La experiencia del [usuario final](/es/glossary/end-user/) es: *un dominio, dos formas de interactuar con él*; el mundo familiar de DNS y el mundo on-chain programable que desbloquea la tokenización de dominios.

---

## Qué puedes hacer con un dominio tokenizado

Como ambas capas existen, obtienes la unión de sus capacidades:

- **Usarlo como un dominio normal**: alojar un sitio web, configurar correo electrónico, establecer registros DNS.
- **Guardarlo en tu propia billetera**: no se requiere una cuenta alojada por un tercero para tener la propiedad.
- **Transferirlo en segundos**: enviar el NFT a otra billetera; el registro DNS lo sigue.
- **Listarlo en mercados de NFT**: OpenSea, Blur y otros.
- **Usarlo en contratos inteligentes**: como garantía (colateral), en [subastas](/es/glossary/auction/), [arrendamiento (leasing)](/es/glossary/leasing/), [propiedad fraccionada](/es/glossary/fractional-ownership/) y más.
- **Vincularlo a una identidad on-chain**: conectarlo a [Farcaster](/es/glossary/farcaster/), [Lens](/es/glossary/lens/) o sistemas de [DID](/es/glossary/did/).

---

## Principales plataformas que tokenizan dominios

La tokenización de dominios ya no es un experimento de un solo proveedor: varias plataformas ofrecen actualmente formas de tokenizar un dominio o trabajar con dominios tokenizados, cada una con un enfoque ligeramente diferente. Aquí tienes una descripción general de los nombres más reconocidos en el sector.

> Los enlaces externos a continuación se proporcionan como referencias útiles, no como patrocinios.

### 1. Namefi (esos somos nosotros)

**Enfoque:** Tokenizar dominios ICANN reales (`.com`, `.xyz`, `.io`, `.art` y muchos más) como NFT manteniendo la capa de DNS completamente funcional. Ambas capas se mantienen sincronizadas a través de [registradores](/es/glossary/registrar/) acreditados.

**Lo que distingue a Namefi:** Namefi fue la **primera plataforma en tokenizar dominios ICANN reales en la red principal (mainnet) de [Ethereum](/es/glossary/ethereum/), y la primera en hacerlo en Base**. Debido a que los dominios tokenizados por Namefi viven en Ethereum y Base, se integran de manera natural con la **mayoría de los principales mercados de NFT y protocolos de préstamos** (OpenSea, Blur, NFTfi y otros) gracias al profundo y maduro ecosistema [DeFi](/es/glossary/defi/) de Ethereum. Otras plataformas han tomado sus propias decisiones sobre las redes que mejor se adaptan a sus objetivos; sin embargo, Ethereum y Base brindan a los usuarios de Namefi la compatibilidad inmediata más amplia con las herramientas de NFT y DeFi existentes en la actualidad.

**Ideal para:** Propietarios que desean un dominio real y resoluble en navegadores *y* una propiedad componible y nativa de billetera en un solo producto, en la blockchain con el mayor soporte de DeFi y NFT. Visita [namefi.io](https://namefi.io) para comenzar.

### 2. D3 Global Inc

**Enfoque:** Una plataforma centrada en llevar TLD nuevos y existentes on-chain a nivel de registro, asociándose con operadores de TLD e infraestructura alineada con la ICANN.

**Ideal para:** Iniciativas de tokenización a nivel de registro y lanzamientos de nuevos TLD tokenizados. Sitio: [d3.inc](https://d3.inc).

### 3. Doma Protocol

**Enfoque:** Un esfuerzo a nivel de protocolo para estandarizar cómo los dominios reales se representan y transfieren on-chain a través de registradores y blockchains.

**Ideal para:** Desarrolladores (builders) que buscan abstracciones a nivel de protocolo para la tokenización de dominios. Sitio: [doma.xyz](https://doma.xyz).

### 4. Domora

**Enfoque:** Otra plataforma emergente en el espacio de los dominios tokenizados, centrada en llevar nombres de dominio reales on-chain.

**Ideal para:** Usuarios que evalúan alternativas en la categoría de dominios DNS tokenizados. Sitio: [domora.com](https://domora.com).

### 5. WebUnited

**Enfoque:** Un actor que explora la representación on-chain de dominios y la infraestructura relacionada para nombres de dominio reales.

**Ideal para:** Equipos que buscan opciones adicionales de dominios tokenizados. Sitio: [webunited.com](https://webunited.com).

### 6. GBM (Global Brand Marketplace / GBM Auctions)

**Enfoque:** Conocida por su infraestructura de subastas on-chain que se ha aplicado a la venta de dominios tokenizados y activos de marca.

**Ideal para:** El descubrimiento y venta impulsados por subastas de dominios tokenizados y activos de marca digital relacionados. Sitio: [gbm.auction](https://gbm.auction).

### 7. Registradores tradicionales explorando la tokenización

Algunos [registradores](/es/glossary/registrar/) y registros incumbentes de la ICANN (por ejemplo, [GoDaddy](https://www.godaddy.com), [Identity Digital](https://www.identity.digital)) han anunciado asociaciones o iniciativas exploratorias de tokenización. La cobertura y la disponibilidad varían ampliamente, y la mayor parte de su negocio principal sigue siendo el registro tradicional exclusivo de DNS.

---

## Una categoría hermana: ENS, Unstoppable Domains, Freename y los dominios Web3

Un pariente cercano de los dominios tokenizados es la familia de los **dominios [Web3](/es/glossary/web3/)**, una categoría en la que fueron pioneros excelentes proyectos como ENS, Unstoppable Domains y Freename. Queremos ser claros con la distinción, no para menospreciar su trabajo (han contribuido enormemente a los nombres e identidad on-chain), sino para ayudar a los lectores a elegir la herramienta adecuada para sus objetivos.

Los dominios Web3 tienen un diseño intencionalmente diferente a los dominios ICANN tokenizados. Así es como debes pensar en ellos:

- **Un espacio de nombres diferente por diseño.** Los dominios Web3 (`.eth`, `.crypto`, `.x`, `.nft` y los TLD creados por los usuarios) viven intencionalmente fuera de la raíz de la [ICANN](/es/glossary/icann/), lo que les permite iterar rápidamente y experimentar con nuevos modelos de nomenclatura. La contrapartida es que se sitúan junto a la jerarquía de DNS tradicional en lugar de estar dentro de ella.
- **La resolución en navegadores y correo electrónico requiere pasos adicionales.** Visitar un dominio Web3 en un navegador típico, o enviarle un correo electrónico, generalmente necesita un resolutor, una extensión o un puente. El ecosistema de billeteras, dApps y navegadores cripto-nativos que *sí* los soportan crece de forma constante; sin embargo, la paridad con navegadores estándar, servidores de correo, CDN, herramientas de SEO y autoridades de certificación SSL/TLS aún está en progreso.
- **Casos de uso nativos de billetera genuinamente novedosos.** Aquí es donde brillan los dominios Web3: reemplazando las largas direcciones `0x…` por nombres legibles para humanos, simplificando las transferencias de tokens, impulsando los inicios de sesión en dApps y sirviendo como primitivas de identidad on-chain. Muchos de estos patrones simplemente no existían antes de ENS y sus pares, y los dominios tokenizados se basan en esas ideas.
- **El perfil de adopción difiere de los dominios DNS / ICANN reales.** Los dominios reales (también llamados *dominios DNS*, *dominios ICANN* o *dominios reales*, por ejemplo, `.com`, `.org`, `.xyz`, `.io`) se benefician de décadas de soporte universal en todos los navegadores, proveedores de correo electrónico, CDN y autoridades de certificación. Los dominios Web3 tienen un alcance impresionante y creciente dentro del ecosistema cripto-nativo, mientras que la adopción más amplia de Internet aún se está poniendo al día.

Las principales plataformas de dominios Web3, reconociendo lo que cada una aporta:

- [ENS](https://ens.domains): un sistema de nombres fundacional nativo de Ethereum (`.eth`) y una de las primitivas más importantes en Web3. ENS también ofrece puentes bien pensados hacia nombres DNS reales a través de [DNSSEC](/es/glossary/dnssec/).
- [Unstoppable Domains](https://unstoppabledomains.com): un pionero temprano e influyente de nombres nativos de blockchain como `.crypto`, `.x` y `.nft`, con amplias integraciones de billeteras y dApps.
- [Freename](https://freename.io): un enfoque innovador para los espacios de nombres y TLD de Web3 creados por los usuarios.

Si tu objetivo principal es la **identidad on-chain** o los **nombres Web3**, estas plataformas son excelentes y vale la pena explorarlas. Si tu objetivo principal es un nombre que **también** funcione en cualquier navegador, cualquier cliente de correo electrónico, cualquier CDN y cualquier autoridad de certificación SSL (es decir, un dominio ICANN real que, adicionalmente, puedas guardar y programar desde tu billetera), entonces las plataformas de dominios tokenizados mencionadas anteriormente (Namefi, D3 Global Inc, Doma Protocol, Domora, WebUnited, GBM) están diseñadas para ese caso de uso. Ambas categorías pueden coexistir felizmente, y muchos usuarios poseen de ambas.

---

## Cómo elegir entre ellas

Una forma rápida de pensarlo:

| Si quieres... | Mira |
|---|---|
| Un dominio `.com`/`.xyz`/`.io` real tokenizado en Ethereum o Base, con el soporte más amplio de mercados NFT y préstamos DeFi | **Namefi** |
| Asociaciones a nivel de registro para un TLD completamente nuevo | D3 Global Inc |
| Estándares de capa de protocolo para dominios tokenizados | Doma Protocol |
| Evaluar plataformas adicionales de dominios DNS tokenizados | Domora, WebUnited |
| Infraestructura de venta impulsada por subastas para dominios tokenizados | GBM |
| Identidad on-chain y nombres nativos de Ethereum (p. ej. `.eth`): una categoría hermana, no un dominio ICANN tokenizado | ENS |
| TLD nativos de Web3 diseñados para casos de uso centrados en la billetera: una categoría hermana, no un dominio ICANN tokenizado | Unstoppable Domains, Freename |
| Registro tradicional con proyectos piloto de tokenización opcionales y específicos del proveedor | GoDaddy, Identity Digital, otros |

La distinción clave a recordar: **tokenizar un dominio (en el sentido de Namefi) significa conservar un nombre DNS real y reconocido por la ICANN, y agregarle un token on-chain**, no reemplazar al DNS con un sistema de nombres Web3 paralelo.

---

## Un modelo mental simple

Si un dominio tradicional es una **escritura que un tercero posee en tu nombre**, un dominio tokenizado es la **misma escritura, pero con una copia criptográfica en tu propio bolsillo**; y ambas se mantienen en total sincronía.

No pierdes la capa legal o de registro. Ganas una programable encima.

---

## Resumen

- Un **dominio tokenizado** es un dominio DNS real con un token on-chain (generalmente un NFT) que refleja su propiedad.
- La **tokenización de dominios** (también llamada *tokenización de nombres de dominio* o *tokenización de un dominio*) es el proceso de crear y mantener esa representación on-chain.
- **Tokenizar un dominio** (o *tokenizar dominios* de forma masiva) es agregar esta capa de propiedad nativa de la billetera a un dominio ICANN real, sin renunciar a la capa DNS tradicional.
- Un dominio tokenizado **no** es un nuevo TLD, no es un nombre estilo ENS y no es una forma de eludir el DNS o la ley.
- Te brinda todo lo que hace un dominio tradicional, *además* de propiedad nativa de billetera y [componibilidad](/es/glossary/composability/) con aplicaciones on-chain.

Para explorar *por qué* es importante esto y qué desbloquea la tokenización de dominios, lee [¿Por qué tokenizar dominios on-chain?](/es/blog/why-tokenize-domains/). Para registrar o tokenizar tu primer dominio, visita [namefi.io](https://namefi.io).