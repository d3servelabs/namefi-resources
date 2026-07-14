---
title: "Principales enfoques de escalabilidad de blockchain: rollups, sidechains, canales y sharding"
date: '2026-07-02'
language: es
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 40
format: roundup
description: "Guía para entender el escalado de blockchain: rollups optimistas, rollups ZK, sidechains, canales de pago, sharding y capas de disponibilidad de datos."
ogImage: ../../assets/blockchain-scaling-approaches-og.jpg
keywords: ['escalabilidad de blockchain', 'soluciones de escalado de blockchain', 'escalado de layer 2', 'rollups', 'rollup optimista', 'rollup ZK', 'sidechains', 'canales de pago', 'canales de estado', 'sharding', 'disponibilidad de datos', 'trilema de la escalabilidad', 'Arbitrum', 'Optimism', 'zkSync', 'Starknet', 'Celestia', 'EigenDA', 'Polygon PoS', 'Lightning Network']
relatedArticles:
  - /es/blog/blockchain-virtual-machines/
  - /es/blog/blockchain-consensus-mechanisms/
  - /es/blog/blockchain-privacy-technologies/
  - /es/blog/blockchain-cryptographic-primitives/
  - /es/blog/premium-web3-tlds/
relatedGlossary:
  - /es/glossary/rollup/
  - /es/glossary/optimistic-rollup/
  - /es/glossary/zk-rollup/
  - /es/glossary/data-availability/
  - /es/glossary/layer-2/
relatedTopics:
  - /es/topics/web3-foundations/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/tokenize-your-com/
  - /es/series/domain-flipping-skills/
---

La red principal de Ethereum procesa unas 15 transacciones por segundo. Una red de pagos como Visa gestiona decenas de miles. Esa diferencia explica por qué las blockchains necesitan escalar: necesitan hacer más trabajo sin exigir que cada participante verifique cada transacción en la cadena base. A lo largo de los últimos años, el sector ha convergido en varios enfoques distintos —[rollups](/es/glossary/rollup/), sidechains, canales de pago y sharding—, cada uno con concesiones diferentes en seguridad, descentralización y coste.

Esta guía recorre los principales enfoques de escalado, explica el mecanismo de cada uno y los compara lado a lado para que la diferencia quede clara la próxima vez que aparezcan en la documentación de un proyecto.

---

## El trilema de la escalabilidad

El planteamiento del **trilema de la escalabilidad** de Vitalik Buterin es el modelo mental sobre el que se construye gran parte de este campo. Una blockchain quiere tres propiedades a la vez: «escalabilidad: la cadena puede procesar más transacciones de las que puede verificar un único nodo normal...», «descentralización: la cadena puede funcionar sin depender de la confianza en un pequeño grupo de grandes actores centralizados» y «seguridad: la cadena puede resistir que un gran porcentaje de los nodos participantes intente atacarla»; sin embargo, los diseños tradicionales solo logran dos de las tres ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Scalability%3A%20the%20chain%20can%20process%20more%20transactions%20than%20a%20single%20regular%20node)). Bitcoin y Ethereum en sus primeros años priorizaron la descentralización y la seguridad por encima del rendimiento; las cadenas con alto TPS que dependen de un conjunto pequeño de validadores potentes obtienen escalabilidad y seguridad, pero sacrifican descentralización; los diseños ingenuos de múltiples cadenas pueden escalar y mantenerse descentralizados, pero se vuelven inseguros si a un atacante le basta con comprometer una sola cadena.

En realidad, todos los enfoques que siguen responden a la misma pregunta: ¿cómo se aumenta el rendimiento sin renunciar a las otras dos esquinas del triángulo?

## Rollups: ejecución fuera de cadena, liquidación en cadena

![Diagrama vectorial plano de muchos pequeños comprobantes de transacción que se canalizan a un compactador llamado «Rollup Compressor», el cual los comprime en un bloque de lote compacto que después se publica sobre una cadena de bloques de capa base](../../assets/blockchain-scaling-approaches-01-rollup-batching.jpg)

Un **[rollup](/es/glossary/rollup/)** ejecuta transacciones fuera de la capa 1 (L1) y después publica un resumen compacto —junto con los datos de las transacciones subyacentes— en la cadena base. L2BEAT, el principal rastreador de estos sistemas, define los rollups como «L2 que publican periódicamente compromisos de estado en Ethereum», compromisos que «se validan mediante pruebas de validez o... se aceptan de forma optimista y pueden impugnarse mediante un mecanismo de prueba de fraude dentro de cierto período de pruebas de fraude» ([l2beat.com](https://l2beat.com/scaling/summary)). Como tanto los datos como el compromiso se publican en L1, cualquiera puede reconstruir el estado del rollup únicamente a partir de Ethereum. Eso permite que un rollup herede la seguridad de L1, en lugar de pedir a los usuarios que confíen en un nuevo conjunto de validadores. Esta es la tecnología que hay detrás de las redes de [Layer 2](/es/glossary/layer-2/) con las que más personas interactúan hoy: Base, Arbitrum, Optimism, zkSync y Starknet son todos rollups.

Los rollups se dividen en dos familias según cómo demuestran que su ejecución fuera de cadena fue correcta.

### Rollups optimistas

![Ilustración vectorial plana de dos puertas lado a lado: una puerta naranja «Optimistic» con un reloj de 7 días y una bandera de período de impugnación que representa la ventana de prueba de fraude, y una puerta verde «ZK» con una marca de verificación instantánea de prueba de validez](../../assets/blockchain-scaling-approaches-02-optimistic-vs-zk.jpg)

Un [rollup optimista](/es/glossary/optimistic-rollup/) «asume que las transacciones fuera de cadena son válidas y no publica pruebas de validez para los lotes de transacciones» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=Optimistic%20rollups%20assume%20offchain%20transactions%20are%20valid%20and%20don%27t%20publish%20proofs%20of%20validity)). Los operadores agrupan transacciones, las ejecutan fuera de cadena y publican los datos comprimidos en Ethereum. Después se abre una ventana de impugnación durante la cual cualquier persona que ejecute un nodo completo puede cuestionar el lote con una prueba de fraude; para retirar fondos de L2 a L1 hay que esperar a que «termine el período de impugnación, que dura aproximadamente siete días» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/#:~:text=the%20challenge%20period%E2%80%94lasting%20roughly%20seven%20days%E2%80%94elapses)). Esa ventana de una semana explica por qué un retiro normal desde un rollup optimista tarda alrededor de una semana, salvo que se use un proveedor de liquidez externo para una salida más rápida a cambio de una comisión.

Los rollups optimistas solo necesitan un sistema de pruebas de fraude, no un proceso criptográfico completo para generar pruebas de validez, lo que históricamente facilitó que admitieran contratos inteligentes de propósito general. **Arbitrum**, **Optimism** y **Base** —el rollup de Coinbase, descrito en ethereum.org como «un Optimistic Rollup construido con OP Stack» ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Base%20is%20an%20Optimistic%20Rollup%20built%20with%20the%20OP%20Stack))— se encuentran hoy entre los rollups optimistas más utilizados.

### Rollups ZK

Un [rollup ZK](/es/glossary/zk-rollup/) adopta el enfoque opuesto: en vez de asumir la validez y permitir un período de impugnación, presenta junto con cada lote una prueba de validez —una prueba criptográfica de que la transición de estado del lote es correcta—. Como Ethereum verifica esa prueba en cadena, «no hay retrasos al mover fondos de un rollup ZK a Ethereum... porque las transacciones de salida se ejecutan una vez que el contrato del rollup ZK verifica la prueba de validez» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=There%20are%20no%20delays%20when%20moving%20funds%20from%20a%20ZK%2Drollup%20to%20Ethereum)). Los rollups ZK «pueden procesar miles de transacciones en un lote y después publicar en Mainnet solo algunos datos de resumen mínimos» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20can%20process%20thousands%20of%20transactions%20in%20a%20batch)), mediante sistemas de prueba como los zk-SNARKs (pruebas pequeñas y verificación rápida) o los zk-STARKs (transparentes y sin necesidad de una configuración de confianza). **zkSync Era**, **Starknet** —«un ZK Rollup de propósito general basado en STARKs y la máquina virtual Cairo» ([ethereum.org](https://ethereum.org/en/layer-2/#:~:text=Starknet%20is%20a%20general%20purpose%20ZK%20Rollup%20based%20on%20STARKs%20and%20the%20Cairo%20VM))— y **Linea** son rollups ZK destacados; Polygon zkEVM y Scroll también implementan una zkEVM para ejecutar contratos inteligentes de Ethereum existentes en un entorno verificable mediante ZK.

La contrapartida es que generar pruebas de validez consume mucha computación y, para conseguir una equivalencia completa con la EVM, es técnicamente más difícil de construir que un sistema de pruebas de fraude. Esa es parte de la razón por la que los rollups optimistas alcanzaron antes la adopción generalizada, aunque los rollups ZK ofrezcan una finalidad más rápida.

## Sidechains

Una **sidechain** «es una blockchain separada que funciona de forma independiente de Ethereum y está conectada a Ethereum Mainnet mediante un puente bidireccional» y, a diferencia de un rollup, «usa un mecanismo de consenso independiente y no se beneficia de las garantías de seguridad de Ethereum» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/#:~:text=A%20sidechain%20uses%20a%20separate%20consensus%20mechanism%20and%20doesn%27t%20benefit%20from%20Ethereum%27s%20security%20guarantees)). Esa es la diferencia esencial con una Layer 2: una sidechain intercambia seguridad heredada por libertad de diseño independiente y, por lo general, comisiones más bajas y bloques más rápidos, ya que responde a su propio conjunto de validadores y no a Ethereum.

**Polygon PoS** es el ejemplo más conocido. La página de producto de Polygon lo describe como «la sidechain de Ethereum más utilizada, probada con miles de millones de valor asegurado, transacciones casi instantáneas y comisiones de menos de un céntimo» ([polygon.technology](https://polygon.technology/polygon-pos)), y está protegida por su propio conjunto de validadores de proof of stake en vez de por Ethereum. **Gnosis Chain** (antes xDai) es otra sidechain ampliamente utilizada, junto con Skale y Metis Andromeda. Como se confía en un conjunto de validadores distinto y normalmente más pequeño, la seguridad de una sidechain solo es tan fuerte como ese conjunto. Es una garantía materialmente diferente de la de un rollup, donde en principio los estados no válidos pueden detectarse y revertirse usando datos anclados en L1.

## Canales de estado y de pago

Un **canal de estado** permite que dos o más partes realicen transacciones fuera de cadena bloqueando fondos en un contrato compartido e intercambiando actualizaciones firmadas directamente, de modo que «los pares del canal pueden realizar un número arbitrario de transacciones fuera de cadena mientras envían solo dos transacciones en cadena para abrir y cerrar el canal» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=Channel%20peers%20can%20conduct%20an%20arbitrary%20number%20of%20offchain%20transactions%20while%20only%20submitting%20two%20onchain%20transactions)). Un canal de pago especializa este mecanismo para transferencias simples de saldo y «se describe mejor como un “libro mayor bidireccional” mantenido colectivamente por dos usuarios» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/#:~:text=A%20payment%20channel%20is%20best%20described%20as%20a%20%E2%80%9Ctwo%2Dway%20ledger%E2%80%9D%20collectively%20maintained%20by%20two%20users)). Los participantes pueden realizar cualquier número de transacciones entre sí, fuera de cadena e instantáneamente, y solo recurren a la cadena base al abrir el canal (bloquear la garantía) y cerrarlo (liquidar el saldo final).

La implementación más conocida es **Lightning Network**, descrita en su propio sitio como «una red descentralizada que usa la funcionalidad de contratos inteligentes de la blockchain para permitir pagos instantáneos entre una red de participantes», construida con «canales de pago bidireccionales» que enrutan pagos como los paquetes de datos se enrutan por Internet ([lightning.network](https://lightning.network/)). La limitación es que los canales solo escalan las transacciones *entre partes que tienen una ruta de canales abiertos entre sí*, los fondos deben comprometerse por adelantado para abrir un canal y las redes de canales necesitan enrutamiento de liquidez para funcionar bien a gran escala. Nada de eso se aplica a un rollup de propósito general que puede ejecutar contratos inteligentes arbitrarios para cualquier persona.

## Sharding y capas de disponibilidad de datos

![Diagrama vectorial plano de transacciones divididas en cuatro carriles de fragmentos paralelos (de Shard 1 a Shard 4), cada uno procesando de forma independiente su propia cadena de bloques, todos alimentando una franja de capa de disponibilidad de datos situada debajo](../../assets/blockchain-scaling-approaches-03-sharding.jpg)

El **sharding** divide el trabajo de validación de una blockchain entre varios subconjuntos paralelos («shards» o fragmentos) de nodos, de modo que ningún nodo individual tenga que procesar toda la carga de transacciones de la red. Vitalik Buterin sostiene que «el sharding es una técnica que permite obtener las tres» esquinas del trilema a la vez ([vitalik.eth.limo](https://vitalik.eth.limo/general/2021/04/07/sharding.html#:~:text=Sharding%20is%20a%20technique%20that%20gets%20you%20all%20three)), mediante comités de validadores seleccionados aleatoriamente para verificar distintos fragmentos en paralelo. La tecnología que hace seguro el sharding sin obligar a cada nodo a descargar todos los datos completos de cada fragmento es el muestreo de [disponibilidad de datos](/es/glossary/data-availability/) (DAS): «una manera de que la red compruebe que los datos están disponibles sin imponer demasiada carga a ningún nodo individual» ([ethereum.org](https://ethereum.org/en/developers/docs/data-availability/#:~:text=Data%20availability%20sampling%20is%20a%20way%20for%20the%20network%20to%20check%20that%20data%20is%20available%20without%20putting%20too%20much%20strain%20on%20any%20individual%20node)). Un nodo ligero descarga solo piezas pequeñas elegidas al azar de los datos de un bloque y, gracias a la codificación de borrado, aun así puede adquirir confianza en que se publicaron los datos completos.

Este mismo problema de disponibilidad de datos se aplica directamente a los rollups, por lo que han surgido capas dedicadas de disponibilidad de datos como una categoría propia de infraestructura. **Celestia** es una blockchain modular creada específicamente para que «los rollups y las L2 usen Celestia como una red donde publicar y poner a disposición datos de transacciones para que cualquiera pueda descargarlos» ([celestia.org](https://celestia.org/what-is-celestia/#:~:text=Rollups%20and%20L2s%20use%20Celestia%20as%20a%20network%20for%20publishing%20and%20making%20transaction%20data%20available%20for%20anyone%20to%20download)), lo que permite a un rollup publicar sus datos en una capa de DA más barata y diseñada para ese fin, en vez de hacerlo en la red principal de Ethereum. **EigenDA**, construida sobre la infraestructura de restaking de EigenLayer, ofrece un servicio comparable, asegurado por participantes de Ethereum que optan por proteger también la capa de DA. Los rollups que publican datos en una capa de DA externa en lugar de en Ethereum L1 se denominan a veces *validiums* u *optimiums* en vez de «rollups puros», ya que L2BEAT los clasifica como una categoría distinta junto a los rollups y otras soluciones L2 ([l2beat.com](https://l2beat.com/scaling/summary)). Intercambian parte de la garantía de seguridad anclada en L1 por menores costes de publicación de datos.

## Comparación de los enfoques

| Enfoque | Dónde se ejecuta el cálculo | ¿Hereda la seguridad de L1? | Disponibilidad de datos | Principal contrapartida | Ejemplos |
|---|---|---|---|---|---|
| Rollup optimista | Fuera de cadena (L2) | Sí: datos y prueba de fraude en L1 | Datos completos publicados en L1 | Ventana de impugnación de retirada de ~7 días | Arbitrum, Optimism, Base |
| Rollup ZK | Fuera de cadena (L2) | Sí: datos y prueba de validez en L1 | Datos completos publicados en L1 | Generación de pruebas costosa; equivalencia completa con la EVM más difícil | zkSync, Starknet, Linea |
| Sidechain | Cadena independiente | No: consenso y validadores propios | Cadena propia, no publicada en L1 | Seguridad limitada a su propio conjunto de validadores | Polygon PoS, Gnosis Chain |
| Canal de estado/pago | Fuera de cadena, entre participantes | Indirectamente: fondos bloqueados en L1 | No se publica; solo el estado final queda en cadena | Solo escala transacciones entre partes conectadas por canales; los fondos deben bloquearse previamente | Lightning Network |
| Sharding / capa de DA | Fragmentos paralelos o una red de DA separada | Varía: el sharding de L1 la hereda; las capas de DA externas añaden una nueva suposición de confianza | Se verifica mediante muestreo de disponibilidad de datos | La DA externa reduce el coste, pero añade una dependencia fuera de L1 | Hoja de ruta de sharding de Ethereum, Celestia, EigenDA |

Ningún enfoque gana en todos los ejes, por lo que los sistemas de producción los combinan cada vez más. Por ejemplo, un rollup ZK que publica sus datos en Celestia en lugar de Ethereum toma prestada la seguridad de las pruebas de validez de una capa y la disponibilidad de datos económica de otra.

---

## Relación con los dominios tokenizados

Las decisiones de escalado importan para los [dominios tokenizados](/es/glossary/tokenized-domain/) porque cada acuñación, transferencia, actualización de DNS o acción de garantía es una transacción en cadena, y su coste y tiempo de finalidad dependen de dónde se liquide. La transferencia de un `.com` tokenizado confirmada en un rollup optimista es barata y rápida para el usuario, pero no adquiere finalidad plena frente a L1 durante aproximadamente una semana, salvo que se use un puente de salida rápida; la misma transferencia en un rollup ZK alcanza finalidad frente a L1 en cuanto se publica la prueba de validez. Las sidechains pueden ser incluso más baratas, pero un NFT de dominio que exista únicamente en una sidechain hereda la seguridad de su conjunto de validadores más pequeño, no la de Ethereum. Comprender estas concesiones forma parte de entender qué se posee realmente cuando un dominio se representa en cadena: el mismo hábito de diligencia debida que importa en los [fundamentos de Web3](/es/topics/web3-foundations/) en general.

---

## Fuentes y lecturas adicionales

- [Los límites de la escalabilidad de blockchain — Vitalik Buterin](https://vitalik.eth.limo/general/2021/04/07/sharding.html)
- [Layer 2 — ethereum.org](https://ethereum.org/en/layer-2/)
- [Rollups optimistas — ethereum.org](https://ethereum.org/en/developers/docs/scaling/optimistic-rollups/)
- [Rollups ZK — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [Sidechains — ethereum.org](https://ethereum.org/en/developers/docs/scaling/sidechains/)
- [Canales de estado — ethereum.org](https://ethereum.org/en/developers/docs/scaling/state-channels/)
- [Disponibilidad de datos — ethereum.org](https://ethereum.org/en/developers/docs/data-availability/)
- [Resumen de escalado de L2BEAT](https://l2beat.com/scaling/summary)
- [¿Qué es Celestia? — celestia.org](https://celestia.org/what-is-celestia/)
- [Lightning Network](https://lightning.network/)
- [Polygon PoS — polygon.technology](https://polygon.technology/polygon-pos)
