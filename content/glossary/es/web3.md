---
title: Web3
date: '2025-06-30'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Una visión de internet sobre blockchains públicas en la que los usuarios poseen sus datos, activos e identidad mediante sus propias claves, no cuentas de plataformas.
keywords: ['Web3', 'web descentralizada', 'internet blockchain', 'propiedad del usuario', 'peer-to-peer', 'descentralización', 'criptomoneda', 'contratos inteligentes', 'DeFi', 'NFT']
level: 2
sources:
  - https://ethereum.org/en/web3/
  - https://web3.foundation/about/
  - https://en.wikipedia.org/wiki/Web3
  - https://www.wired.com/story/web3-blockchain-decentralization-explained/
relatedArticles:
  - /es/blog/what-are-tokenized-domains/
  - /es/blog/onchain-domain-custody-and-recovery/
  - /es/blog/the-badgerdao-frontend-attack/
  - /es/blog/the-godaddy-multi-year-breach/
  - /es/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/icann/
  - /es/glossary/registrar/
  - /es/glossary/dns/
  - /es/glossary/registry/
  - /es/glossary/tld/
---

**Web3** (también escrito *Web 3.0*) es un paradigma propuesto para internet en el que la infraestructura central funciona sobre redes [blockchain](/es/glossary/blockchain/) públicas, permitiendo a los participantes poseer y controlar sus datos, activos digitales e identidades en línea mediante claves criptográficas en lugar de cuentas administradas por plataformas centralizadas.

## En qué se diferencia Web3 de Web1 y Web2

El término se explica habitualmente a través de un modelo de tres generaciones de la web:

- **Web1 (≈ 1991–2004)** — páginas estáticas, solo de lectura. Los usuarios consumían contenido publicado por webmasters; había poca interactividad o material generado por usuarios.
- **Web2 (≈ 2004–presente)** — la web participativa impulsada por plataformas. Las redes sociales, los motores de búsqueda y los servicios en la nube permiten a cualquiera publicar e interactuar, pero los datos subyacentes, las identidades y los flujos de monetización son propiedad y están controlados por un pequeño número de grandes plataformas (Google, Meta, Amazon y sus pares).
- **Web3 (propuesta)** — una web de lectura/escritura/propiedad. Los usuarios guardan sus propias claves, llevan su identidad y activos entre aplicaciones sin un custodio central, e interactúan a través de protocolos abiertos en lugar de APIs propietarias.

La frase fue [acuñada por el cofundador de Ethereum Gavin Wood en 2014](https://ethereum.org/en/web3/) para describir un conjunto de tecnologías que consideraba necesarias para construir un internet menos dependiente de la confianza. Ganó atención generalizada en el período 2020–2022, junto con el crecimiento de los mercados de [DeFi](/es/glossary/defi/) y NFT.

## Tecnologías centrales

Las aplicaciones Web3 se construyen típicamente sobre alguna combinación de los siguientes elementos:

- **[Contratos inteligentes](/es/glossary/smart-contract/)** — código autoejecutado desplegado [en cadena](/es/glossary/on-chain/) que aplica reglas sin un operador centralizado. Son la primitiva fundamental para las aplicaciones descentralizadas (dApps).
- **Blockchains públicas** — libros de registro permisos, de solo anexado (siendo Ethereum el más ampliamente utilizado para aplicaciones de propósito general) que proporcionan una fuente de verdad compartida sin un intermediario de confianza.
- **Billeteras criptográficas** — software (o hardware) que gestiona claves privadas y firma transacciones. Una dirección de [billetera](/es/glossary/wallet/) funciona como una identidad universal y portátil entre aplicaciones compatibles.
- **Tokens y tokenización** — la capacidad de [tokenizar](/es/glossary/tokenize/) activos, incluidas divisas fungibles, derechos de gobernanza u objetos digitales únicos (NFT), como entradas en un libro de registro público que cualquier aplicación puede leer y verificar.
- **Almacenamiento descentralizado** — protocolos como IPFS y Arweave que replican contenido entre muchos nodos para que ninguna entidad individual pueda censurarlo o eliminarlo.
- **[DAOs](/es/glossary/dao/) (Organizaciones Autónomas Descentralizadas)** — entidades en cadena cuyas reglas y tesorería son gobernadas colectivamente por los poseedores de tokens en lugar de por una junta directiva.

## Identidad y nomenclatura

Una de las diferencias estructurales entre Web2 y Web3 es el tratamiento de la identidad. En Web2, una identidad es un nombre de usuario y contraseña almacenados en la base de datos de una empresa — la plataforma puede desactivarla en cualquier momento. En Web3, la identidad se deriva de un par de claves pública/privada controlado por el titular.

Las capas de nomenclatura legibles por humanos, como el [Ethereum Name Service (ENS)](/es/glossary/ens/), mapean direcciones criptográficas a nombres legibles (p. ej. `alice.eth`) en un registro que vive completamente en cadena. Estos nombres pueden servir simultáneamente como direcciones de pago, identificadores de inicio de sesión y punteros de sitios web descentralizados, sin que ninguna autoridad central pueda revocarlos mientras el propietario controle la clave correspondiente.

La Web3 Foundation, [establecida por Gavin Wood y otros](https://web3.foundation/about/), financia la investigación y el desarrollo de infraestructura de internet descentralizada y justa, con particular énfasis en los protocolos de interoperabilidad.

## Críticas y preguntas abiertas

Web3 es [debatida entre tecnólogos y economistas](https://www.wired.com/story/web3-blockchain-decentralization-explained/). Las preocupaciones más frecuentemente citadas incluyen:

- **Escalabilidad** — las blockchains públicas procesan muchas menos transacciones por segundo que las bases de datos centralizadas, y las comisiones se disparan bajo carga. Las redes de capa 2 (rollups, sidechains) mitigan esto pero añaden complejidad.
- **Experiencia de usuario** — gestionar claves privadas, comisiones de gas y confirmaciones de transacciones es significativamente más difícil que iniciar sesión con una cuenta social. La pérdida de la frase semilla implica la pérdida permanente de activos, sin posibilidad de recuperación de la cuenta.
- **Recentralización** — en la práctica, gran parte del ecosistema Web3 depende de un pequeño número de proveedores de infraestructura (p. ej. Infura y Alchemy para acceso RPC, OpenSea para liquidez de NFT, unos pocos emisores de stablecoins). Los críticos argumentan que esto recrea las concentraciones de poder que Web3 pretendía eliminar, solo con diferentes actores dominantes.
- **Especulación y financiarización** — los ciclos de mercado en torno a las criptomonedas y los NFT han llevado a observadores a preguntarse si los incentivos basados en tokens producen ecosistemas sostenibles o recompensan principalmente a los primeros tenedores.
- **Consumo de energía** — las blockchains de prueba de trabajo históricamente tenían grandes huellas de carbono; la transición de Ethereum en 2022 a prueba de participación redujo su consumo de energía en [aproximadamente un 99,95 %](https://ethereum.org/en/energy-consumption/), aunque algunas cadenas de prueba de trabajo siguen siendo consumidores significativos.
- **Incertidumbre regulatoria** — si los tokens constituyen valores, cómo se tratan las DAOs como entidades legales y la aplicación transfronteriza de disputas de contratos inteligentes siguen sin resolverse en la mayoría de las jurisdicciones.

Los proponentes contraargumentan que muchos de estos son problemas de ingeniería que mejoran con el tiempo, y que la base de protocolos abiertos y sin confianza vale los compromisos actuales.

## Relevancia para los dominios

Los nombres de dominio tradicionales operan a través de una jerarquía centralizada mantenida por ICANN y delegada a registros y registradores — el propietario de un nombre de dominio depende en última instancia de que un registrador mantenga el registro activo. Web3 introduce un modelo alternativo: registros de nombres en cadena donde la propiedad se codifica como un token que se guarda en la billetera del propietario, sin que ningún registrador pueda revocarlo unilateralmente.

Esto afecta a varios aspectos del funcionamiento de los dominios:

- **Resistencia a la censura** — un dominio cuyo registro de propiedad reside en una blockchain pública no puede ser confiscado mediante un cambio en la política del registrador ni mediante una orden judicial dirigida al registrador.
- **Componibilidad** — los nombres en cadena pueden ser leídos y utilizados por contratos inteligentes, habilitando el enrutamiento de pagos, la resolución de sitios web descentralizados y la emisión de credenciales dentro de un único identificador.
- **Mercados secundarios** — como los nombres en cadena son tokens, pueden transferirse entre pares o venderse a través de mercados descentralizados sin necesidad de que un registrador facilite la transferencia.
- **Interoperabilidad** — estándares como ENS permiten que un solo nombre se resuelva en múltiples aplicaciones (billeteras, navegadores, dApps) sin que cada aplicación necesite consultar una API propietaria.

La contrapartida es que los nombres basados en blockchain tienen una resolución limitada en el DNS convencional, requieren que el propietario gestione sus propias claves y dependen del funcionamiento continuo de la cadena subyacente.
