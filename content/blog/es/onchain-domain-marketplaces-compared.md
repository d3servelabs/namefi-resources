---
title: "Comparación de mercados de dominios en cadena: OpenSea, Seaport y más allá"
date: '2026-06-24'
language: es
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 36
format: comparison
description: "OpenSea, los mercados basados en Seaport y los mercados nativos de dominios en cadena comparados por comisiones, alcance y custodia: qué plataforma se ajusta a cada venta de dominio tokenizado."
ogImage: ../../assets/onchain-domain-marketplaces-compared-og.jpg
keywords: ['mercado de dominios en cadena', 'mercado de dominios tokenizados', 'vender dominio NFT', 'dominio OpenSea', 'protocolo Seaport', 'comisiones de mercado NFT', 'flipping de dominios web3', 'dónde vender dominios tokenizados', 'OpenSea vs Blur', 'venta atómica de NFT', 'dominio ERC-721', 'comparación de mercados de dominios NFT', 'mercado Namefi', 'venta de dominio con autocustodia', 'comercio de dominios en cadena']
relatedArticles:
  - /es/blog/selling-domains-as-nfts/
  - /es/blog/onchain-domain-flipping/
  - /es/blog/tokenize-your-com-to-flip-it/
  - /es/blog/how-tokenization-changes-domain-flipping/
  - /es/blog/ens-vs-dns-domain-flipping/
relatedTopics:
  - /es/topics/domain-investing/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/icann/
  - /es/glossary/dns/
  - /es/glossary/tld/
  - /es/glossary/web3/
---

Si haces flipping de un [dominio tokenizado](/es/blog/what-are-tokenized-domains/) —un nombre ICANN real con un token de propiedad [en cadena](/es/glossary/on-chain/) por encima— tienes una opción que el mundo tradicional de los dominios nunca te dio. Puedes publicar el nombre como un [NFT](/es/glossary/nft/) en un mercado de criptomonedas general, venderlo a través de una plataforma basada en [Seaport](/es/glossary/smart-contract/) sin custodia de terceros, o usar una plataforma nativa de dominios construida exactamente para este activo. Cada camino mueve el mismo token, pero las comisiones, el alcance y el modelo de custodia son lo bastante distintos como para que elegir mal pueda costarte un comprador o una parte de tu margen.

Esta guía compara las tres familias de plataformas en cadena —mercados NFT generales como OpenSea, mercados basados en Seaport y de comisión cero, y plataformas nativas de dominios incluida [Namefi](https://namefi.io)— en las cuatro cosas que realmente deciden un flip: comisiones, alcance, custodia y a qué tipo de venta se ajusta cada una. Namefi es una opción aquí, no la única. El objetivo es ayudarte a emparejar la plataforma con la operación.

Si eres nuevo en vender nombres como tokens, empieza por [vender dominios como NFT](/es/blog/selling-domains-as-nfts/) y el artículo pilar del clúster sobre [flipping de dominios en cadena](/es/blog/onchain-domain-flipping/). Esta publicación asume que ya tienes un nombre tokenizado y estás decidiendo dónde venderlo.

## Por qué la plataforma importa más en cadena que fuera de ella

En el [mercado secundario](/es/glossary/domain-trading/) tradicional, el mercado es sobre todo un tablón de anuncios más una mesa de [custodia (escrow)](/es/blog/domain-escrow-explained/). El nombre no se mueve hasta que una persona del registrador lo empuja, y un tercero neutral retiene el dinero mientras tanto. En cadena, el mercado es algo más cercano a una capa de liquidación: el propio contrato puede intercambiar el token por el pago en una sola transacción, de modo que el enfrentamiento de "quién mueve primero" que el escrow existe para resolver puede colapsarse en una única [transferencia atómica](/es/glossary/atomic-transfer/). Desglosamos esa mecánica en [cómo los mercados tokenizados reemplazan al escrow](/es/blog/how-tokenized-marketplaces-replace-escrow/).

Ese cambio modifica lo que estás buscando. Fuera de la cadena comparas tasas de comisión y confianza en el escrow. En cadena también comparas el modelo de contrato inteligente, si la plataforma llega a tomar [custodia](/es/glossary/custodial-ownership/) de tu nombre, y cuántos de los compradores adecuados realmente lo navegan. Tres cosas importan más: las **comisiones** (lo que la plataforma y los creadores se quedan), el **alcance** (si tu comprador siquiera está ahí) y la **custodia** (si conservas el nombre en tu propia [billetera](/es/glossary/wallet/) hasta el momento de la venta).

## OpenSea y los mercados NFT generales

![Ilustración editorial de cuatro escaparates planos uno al lado del otro bajo toldos a rayas: un gran bazar general, un puesto minimalista y esbelto, un pequeño quiosco con letrero hexagonal y una tienda nativa de dominios con un letrero de globo terráqueo](../../assets/onchain-domain-marketplaces-compared-01-venue-storefronts.jpg)

OpenSea es la respuesta por defecto porque es el mayor mercado NFT general, y la mayoría de los dominios tokenizados emitidos como tokens [ERC-721](/es/glossary/erc-721/) —la [interfaz estándar para tokens no fungibles, también conocidos como deeds](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)— aparecen ahí automáticamente. Si tu nombre vive en Ethereum o Base, normalmente puedes publicarlo en OpenSea sin ninguna integración específica de dominios.

En cuanto a comisiones, OpenSea ahora cobra una [comisión del 1% por vender NFT](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=1%25%20fee%20for%20selling%20NFTs), con las ganancias del creador gestionadas por separado: en OpenSea, [las ganancias del creador son obligatorias u opcionales](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=creator%20earnings%20are%20enforced%20or%20optional) según la colección. Para un dominio que acuñaste tú mismo, normalmente no hay regalías de creador de las que preocuparse, así que el total que se llevan es pequeño.

La fortaleza aquí es el alcance y la familiaridad. Un comprador que ya opera con NFT tiene una billetera conectada, conoce el flujo de publicación y confía en la marca. La debilidad es que un mercado general trata tu nombre como cualquier otro JPEG. No muestra señales específicas de dominios: que el nombre resuelve en [DNS](/es/blog/dns-on-tokenized-domains/), que tiene tráfico, que es un `.com` real en lugar de una cadena solo para Web3. Un inversor de dominios que recorre OpenSea no tiene una forma nativa de filtrar por "nombres ICANN reales con X". OpenSea es la red más amplia y el contexto más superficial.

**Mejor para:** nombres líquidos y reconocibles donde el comprador es nativo cripto y el valor es obvio solo a partir de la cadena.

## Mercados basados en Seaport y de comisión cero

![Ilustración editorial de una balanza de dos platillos que sopesa una pequeña pila de monedas de comisiones bajas frente a un amplio abanico radiante de alcance de audiencia](../../assets/onchain-domain-marketplaces-compared-02-fees-vs-reach.jpg)

[Seaport](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs) es el protocolo de código abierto que está debajo de OpenSea, descrito por su propio repositorio como [un protocolo de mercado para comprar y vender NFT de forma segura y eficiente](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs). Como es un [contrato inteligente](/es/glossary/smart-contract/) público, cualquiera puede construir un mercado sobre él, razón por la cual "basado en Seaport" es una categoría y no un único sitio. El rasgo compartido es que las publicaciones son ofertas firmadas liquidadas directamente por el contrato: conservas el nombre en tu billetera, el pago del comprador y tu token se intercambian de forma atómica, y ningún operador llega a retener el activo.

La otra rama notable son las plataformas de comisión cero para operadores profesionales. Blur, por ejemplo, anuncia [comisiones de mercado](https://blur.io/#:~:text=Marketplace%20fees) del [0%](https://blur.io/#:~:text=0%25) para arrebatar operadores de alta frecuencia a los líderes establecidos. Para un flipper que optimiza cada punto básico, una plataforma de comisión cero es atractiva, pero el alcance es la trampa. Estas plataformas están afinadas para colecciones de arte y PFP con suelos profundos y de sensación fungible, no para nombres de dominio únicos donde cada cadena es un mercado separado. Puedes no pagar nada en comisiones y aun así esperar mucho tiempo porque el comprador adecuado no está navegando ahí.

La historia de la custodia es la verdadera victoria en toda esta familia: un flujo de Seaport bien diseñado es una auténtica [transferencia atómica](/es/glossary/atomic-transfer/), así que el riesgo de contraparte que el escrow existe para neutralizar prácticamente desaparece. Eso es una mejora significativa frente al proceso fuera de la cadena descrito en nuestra [explicación del escrow](/es/blog/how-tokenized-marketplaces-replace-escrow/).

**Mejor para:** vendedores sensibles a las comisiones que ya tienen un comprador apalabrado, o que quieren autocustodia y liquidación atómica y no necesitan que la plataforma genere demanda.

## Una nota sobre los mercados de nombres nativos de Web3

Vale la pena separar los dominios ICANN tokenizados de los nombres nativos de Web3, porque se negocian en lugares distintos y la distinción es fácil de difuminar. Un nombre [ENS](/es/glossary/ens/) como `vitalik.eth` no es un dominio DNS: ENS es [un sistema de nombres distribuido, abierto y extensible basado en la cadena de bloques de Ethereum](https://docs.ens.domains/learn/protocol#:~:text=a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain), y los nombres `.eth` viven fuera de la raíz de ICANN. También se emiten bajo un modelo de comisiones diferente: ENS fija el precio de los registros `.eth` por longitud, con un nombre de cinco caracteres o más que cuesta aproximadamente [5 USD al año](https://docs.ens.domains/registry/eth#:~:text=5%20USD), mientras que un nombre de tres caracteres ronda los [$640](https://docs.ens.domains/registry/eth#:~:text=640) anuales.

Los nombres ENS y similares son negociables como NFT y pueden estar en OpenSea justo al lado de un `.com` tokenizado, pero el comprador de `crypto.eth` quiere algo distinto que el comprador de `crypto.com`: uno es identidad nativa de la billetera, el otro es una dirección de sitio web resoluble universalmente. Trazamos la línea completa en [flipping de dominios: ENS frente a DNS](/es/blog/ens-vs-dns-domain-flipping/) y la comparación a nivel de plataforma en [ENS vs Unstoppable vs DNS tokenizado](/es/blog/ens-vs-unstoppable-vs-tokenized-dns/). La versión corta: no fijes el precio ni publiques un dominio ICANN tokenizado como si fuera un nombre ENS, y no asumas que un comprador de ENS es tu comprador.

## Mercados nativos de dominios, incluida Namefi

La tercera familia está construida específicamente para dominios reales tokenizados. En lugar de tratar el nombre como un token genérico, una plataforma nativa de dominios entiende que hay una capa DNS por debajo: puede mostrar que el nombre resuelve, mantener la continuidad del DNS a lo largo del traspaso para que un sitio en funcionamiento no se quede a oscuras en mitad de la operación, y presentar la publicación a compradores que buscan dominios reales en lugar de coleccionables.

[Namefi](https://namefi.io) se sitúa en esta categoría. Tokeniza nombres ICANN reales como NFT en Ethereum y Base manteniendo la capa DNS en funcionamiento, lo que significa que un nombre vendido a través de Namefi puede liquidarse [en cadena](/es/glossary/on-chain/) con la misma mecánica atómica y libre de escrow que una venta de Seaport, pero con el contexto específico de dominios que un mercado general no puede ofrecer. Como los nombres tokenizados por Namefi son NFT estándar, siguen siendo publicables en OpenSea y otras plataformas también. No quedas atrapado; estás añadiendo una opción consciente de los dominios, no cerrando las demás. Si estás eligiendo dónde tokenizar en primer lugar, [cómo elegir una plataforma de tokenización de dominios](/es/blog/choosing-a-domain-tokenization-platform/) compara los proveedores.

La contrapartida es que los mercados nativos de dominios son más jóvenes y más delgados que OpenSea. Su alcance es más estrecho en número bruto de usuarios, aunque cada usuario sea un comprador de dominios más cualificado. Para nombres de alto valor donde el comprador necesita confiar en que está obteniendo un dominio real y resoluble —no solo un token— ese contexto cualificado puede importar más que el tráfico puro.

**Mejor para:** nombres ICANN reales donde la continuidad del DNS, la confianza del comprador y la presentación específica de dominios importan, típicamente tus nombres de mayor valor o en uso activo.

## Cómo emparejar la plataforma con la venta

![Ilustración editorial de una sola moneda de token de dominio encaminada por rutas ramificadas de líneas discontinuas hacia el escaparate que mejor encaja entre varios, como un flujo de decisión](../../assets/onchain-domain-marketplaces-compared-03-match-venue.jpg)

No hay un único mejor mercado, solo un mejor encaje para un nombre dado. Una guía de decisión aproximada:

| Si el nombre es… | Inclínate por |
|---|---|
| Una cadena líquida y reconocible por la comunidad cripto, comprador nativo de NFT | OpenSea: alcance más amplio, comisión baja del 1% |
| Ya vendido (tienes al comprador), quieres comisión cero + autocustodia | Una plataforma basada en Seaport o de comisión cero: liquidación atómica |
| Un dominio ICANN real y resoluble donde la continuidad del DNS y la confianza importan | Un mercado nativo de dominios como Namefi |
| Un nombre ENS / nativo de Web3, no un dominio DNS | Una plataforma consciente de ENS, y fíjale el precio como identidad, no como sitio web |

El punto más profundo es que en cadena puedes publicar el mismo token en más de un lugar a la vez, porque la mayoría de estas plataformas leen de la misma billetera y del mismo contrato ERC-721. Un flipper pragmático a menudo publica de forma amplia en un mercado general por alcance y trabaja los nombres de alto valor a través de una plataforma nativa de dominios por contexto y confianza. El modelo de custodia —mantener el nombre en tu propia billetera [multifirma](/es/glossary/multi-sig/) o de clave única hasta la liquidación— viaja contigo a través de todas ellas, que es la razón completa por la que las ventas en [mercados](/es/glossary/marketplace/) con autocustodia superan al viejo baile del escrow. Para más sobre cómo proteger el activo en sí, consulta [¿las billeteras multifirma realmente mejoran la seguridad?](/es/blog/do-multisig-wallets-actually-improve-security/) y el manual de recuperación en [recuperar un dominio tokenizado tras perder la billetera](/es/blog/recovering-a-tokenized-domain-after-wallet-loss/).

Elige la plataforma para el nombre que tienes delante, no al revés. El token es el mismo en todas partes; el comprador no lo es.

## Aviso amistoso (¡Léeme!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo es asesoramiento legal, financiero, fiscal, contable, médico ni ningún otro tipo de asesoramiento profesional.** Escribimos estas publicaciones para educarnos a nosotros mismos y como una comodidad para nuestros clientes. La información aquí puede estar desactualizada, ser específica de una región o simplemente estar equivocada. Nosotros también cometemos errores.
>
> Para cualquier decisión importante, **consulta a un profesional de verdad (¡en serio!)**. O si eso no va contigo, pregúntale a un amigo, pregunta en Twitter, pregunta en Reddit, pregúntale a una IA o pregúntale a un psíquico. En resumen: **DOYR - Haz Tu Propia Investigación**. Aprendamos y divirtámonos.

## Fuentes y lecturas adicionales

- Ethereum Improvement Proposals — [ERC-721 Non-Fungible Token Standard ("a standard interface for non-fungible tokens, also known as deeds")](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- ProjectOpenSea/seaport (GitHub) — [Seaport is a marketplace protocol for safely and efficiently buying and selling NFTs](https://github.com/ProjectOpenSea/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- OpenSea Help Center — [What fees do I pay on OpenSea? (1% selling fee; creator earnings enforced or optional)](https://support.opensea.io/en/articles/8867091-what-fees-do-i-pay-on-opensea#:~:text=1%25%20fee%20for%20selling%20NFTs)
- Blur — [NFT Marketplace for Pro Traders (0% marketplace fees)](https://blur.io/#:~:text=0%25)
- ENS Documentation — [What is ENS? ("a distributed, open, and extensible naming system based on the Ethereum blockchain")](https://docs.ens.domains/learn/protocol#:~:text=a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)
- ENS Documentation — [.eth Registrar pricing (length-based annual fees: ~$5/yr for 5+ characters, ~$640/yr for 3 characters)](https://docs.ens.domains/registry/eth#:~:text=5%20USD)
