---
title: "Principales máquinas virtuales de blockchain: EVM, SVM, MoveVM, WebAssembly/RISC-V y CairoVM"
date: '2026-07-02'
language: es
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 30
format: roundup
description: "Guía de las principales máquinas virtuales de blockchain —EVM, SVM, MoveVM, máquinas virtuales de WebAssembly y RISC-V, y CairoVM— que compara lenguajes, modelos de ejecución y ecosistemas."
ogImage: ../../assets/blockchain-virtual-machines-og.jpg
keywords: ['máquina virtual de blockchain', 'máquinas virtuales de blockchain', 'evm', 'ethereum virtual machine', 'svm', 'solana virtual machine', 'sealevel', 'movevm', 'lenguaje move', 'blockchain wasm', 'cosmwasm', 'polkavm', 'cairovm', 'lenguaje cairo', 'starknet', 'lenguaje de contratos inteligentes', 'ejecución paralela en blockchain', 'compatible con evm', 'entorno de ejecución de blockchain', 'máquina de estados de blockchain']
relatedArticles:
  - /es/blog/blockchain-consensus-mechanisms/
  - /es/blog/blockchain-scaling-approaches/
  - /es/blog/blockchain-cryptographic-primitives/
  - /es/blog/blockchain-privacy-technologies/
  - /es/blog/what-are-tokenized-domains/
relatedTopics:
  - /es/topics/web3-foundations/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/tokenize-your-com/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/ethereum-virtual-machine/
  - /es/glossary/webassembly/
  - /es/glossary/smart-contract/
  - /es/glossary/ethereum/
  - /es/glossary/gas/
---

Todo [contrato inteligente](/es/glossary/smart-contract/) debe ejecutarse en algún lugar. Ese «lugar» es una máquina virtual de blockchain (VM): el programa aislado que todos los nodos de la red ejecutan de manera idéntica, de modo que la misma entrada siempre produzca la misma salida sin importar quién la ejecute. La VM sobre la que construyes determina casi todo lo relativo a una cadena: en qué lenguajes puedes programar, si las transacciones pueden ejecutarse al mismo tiempo o solo una tras otra, y qué parte del ecosistema de desarrolladores existente puedes aprovechar desde el primer día.

Esta guía recorre cinco familias de VM que, en conjunto, impulsan buena parte de la actividad de contratos inteligentes en [Web3](/es/glossary/web3/) hoy: la [Ethereum Virtual Machine](/es/glossary/ethereum-virtual-machine/) (EVM), la SVM de Solana, MoveVM, utilizada por Aptos y Sui, las VM de bytecode portátil —como CosmWasm sobre [WebAssembly](/es/glossary/webassembly/) y PolkaVM sobre RISC-V— y CairoVM de Starknet.

---

## ¿Qué es una máquina virtual de blockchain y por qué importa?

Una VM de blockchain es un entorno de ejecución determinista y aislado: cada nodo completo descarga las mismas transacciones, las ejecuta en la misma VM y llega al mismo estado [en cadena](/es/glossary/on-chain/) resultante. La documentación de Ethereum describe la EVM como «un entorno virtual descentralizado que ejecuta código de forma uniforme y segura en todos los nodos de Ethereum» ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20is%20a%20decentralized,mechanics%20of%20how%20they%20work)), una descripción aplicable a todas las VM de esta guía.

Dos propiedades definen las concesiones de diseño de una VM:

- **Lenguaje y cadena de herramientas.** ¿En qué pueden escribir los desarrolladores los contratos y qué tan grande es la biblioteca existente de código auditado, herramientas y profesionales que ya dominan ese lenguaje?
- **Modelo de ejecución.** ¿La VM procesa las transacciones estrictamente una por una (de forma secuencial), o pueden ejecutarse al mismo tiempo transacciones independientes en varios núcleos de CPU (ejecución paralela)? La ejecución secuencial es más sencilla de razonar; la ejecución paralela eleva el rendimiento teórico, pero añade complejidad de planificación.

Estas decisiones repercuten en los costes de gas, el comportamiento ante la congestión y qué contratos y herramientas existentes se pueden trasladar sin reescribirlos. Por eso, «qué VM» es una de las primeras preguntas que debe responder cualquier cadena nueva, o cualquier activo [tokenizado](/es/glossary/tokenize/) construido sobre una de ellas.

---

## EVM (Ethereum Virtual Machine)

![Diagrama de vectores planos de la EVM como una máquina de pila de un solo carril, con un puntero de instrucciones que apila y desapila valores en una pila vertical y un indicador de gas que registra el coste de ejecución](../../assets/blockchain-virtual-machines-01-evm-stack.jpg)

La EVM se introdujo con [Ethereum](/es/glossary/ethereum/) en 2015 y hoy es una de las VM de contratos inteligentes más desplegadas. Es una **máquina de pila**: la documentación de Ethereum especifica que opera como «una máquina de pila con una profundidad de 1024 elementos», donde cada elemento es una palabra de 256 bits ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=The%20EVM%20executes%20as%20a,256%2Dbit%20word)). El estado del contrato reside en un trie Patricia de Merkle asociado a cada cuenta, y el estado global de la cadena también se organiza como un trie Patricia de Merkle modificado que conecta todas las cuentas mediante hashes ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Ethereum%20uses%20a%20modified%20Merkle,linked%20by%20hashes)).

**Lenguaje.** Los contratos se escriben casi siempre en **Solidity**, que la propia documentación de Ethereum describe como «un lenguaje de alto nivel orientado a objetos para implementar contratos inteligentes», fuertemente influido por la sintaxis de C++ ([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Solidity)). **Vyper**, un lenguaje «al estilo de Python» que reduce deliberadamente sus prestaciones para facilitar la auditoría de los contratos, es la principal alternativa ([ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/#:~:text=Vyper)).

**Modelo de ejecución.** La EVM procesa las transacciones dentro de un bloque de forma **secuencial**, una tras otra y en un orden fijo. Esto mantiene simple y fácil de auditar la lógica de transición de estado, pero limita el rendimiento de la capa base.

**Gas.** Cada operación consume [gas](/es/glossary/gas/), la unidad de Ethereum para «el esfuerzo computacional necesario para las operaciones», que pone precio a la ejecución y protege la red frente al spam o los bucles infinitos ([ethereum.org](https://ethereum.org/en/developers/docs/evm/#:~:text=Since%20each%20transaction%20is%20broadcast,uses%20gas)).

**Fortaleza y alcance distintivos.** La verdadera ventaja competitiva de la EVM es su ecosistema: es la VM más implementada del mundo cripto, y decenas de soluciones de segunda capa y cadenas independientes (Arbitrum, Optimism, Base, Polygon, BNB Chain y Avalanche C-Chain) ofrecen entornos **compatibles con EVM** o **equivalentes a EVM**, de modo que los contratos Solidity, las billeteras y las herramientas existentes se despliegan con pocos cambios o ninguno.

---

## SVM (Solana / Sealevel)

![Diagrama de vectores planos que contrasta una autopista de varios carriles con coches de transacciones que avanzan en paralelo y una carretera de un carril con coches en fila, para ilustrar la ejecución paralela de Sealevel de Solana frente a la ejecución secuencial](../../assets/blockchain-virtual-machines-02-parallel-execution.jpg)

El entorno de ejecución de Solana, **Sealevel**, parte de una apuesta concreta: la mayoría de las transacciones toca partes disjuntas del estado, por lo que pueden ejecutarse al mismo tiempo en vez de una por una. El propio anuncio de Solana describe Sealevel como «el entorno de ejecución paralelo de contratos inteligentes de Solana», capaz de «procesar miles de contratos en paralelo, usando tantos núcleos como tenga disponibles el validador» ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sealevel%E2%80%94Parallel%20Smart%20Contracts%20Runtime)).

**Cómo funciona el paralelismo.** Las transacciones de Solana deben declarar de antemano todas las cuentas que leerán o escribirán. Esa declaración posibilita la planificación: el entorno de ejecución puede «ordenar millones de transacciones pendientes» y «programar en paralelo todas las transacciones no superpuestas», incluso permitiendo que varias transacciones que solo *leen* la misma cuenta se ejecuten simultáneamente ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Sort%20millions%20of%20pending%20transactions)). Dos transacciones se serializan entre sí cuando acceden a la misma cuenta y al menos una de ellas escribe en ella; las transacciones que solo leen la misma cuenta pueden seguir ejecutándose simultáneamente.

**Lenguaje y aspectos internos de la VM.** Los programas de Solana (así llama Solana a los contratos inteligentes) se compilan a una variante del bytecode Berkeley Packet Filter. Solana Labs explica que eligió «una variante del bytecode Berkeley Packet Filter (BPF)» para la VM en cadena ([solana.com](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts#:~:text=Berkeley%20Packet%20Filter)). Los programas se escriben principalmente en **Rust**, aunque también se admiten C y C++.

**Fortaleza distintiva.** Como el paralelismo a nivel de cuenta es una propiedad del entorno de ejecución y no algo que cada autor de contratos deba implementar manualmente, Solana puede sostener un alto rendimiento sin desplazar la ejecución fuera de la cadena. A cambio, exige un modelo más estricto de declaración de cuentas que cambia la forma de escribir contratos respecto al almacenamiento de formato libre de la EVM.

---

## MoveVM (Aptos y Sui)

![Diagrama de vectores planos de una moneda tratada como un recurso físico que se pasa de mano en mano entre dos cajas de cuenta, con distintivos «copia restringida» y «sin descarte implícito» que ilustran el modelo de recursos de Move regido por habilidades](../../assets/blockchain-virtual-machines-03-move-resource-v2.jpg)

**Move** es un lenguaje de contratos inteligentes creado originalmente para el proyecto Diem de Meta y ahora la capa base de **Aptos** y **Sui**, que ejecutan cada uno su propia variante de MoveVM. La documentación de Aptos describe Move como «un lenguaje de programación seguro para Web3 que pone el énfasis en la escasez y el control de acceso» ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Move%20is%20a%20safe%20and,scarcity%20and%20access%20control)).

**El modelo de recursos.** La idea definitoria de Move es tratar los activos digitales como **recursos**: tipos especiales de estructuras que el sistema de tipos del lenguaje garantiza que «no pueden duplicarse ni descartarse accidentalmente» ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Resources%20cannot%20be%20copied%2C%20they,structs%20cannot%20be%20accidentally%20duplicated)). Un token o NFT modelado como recurso de Move no puede copiarse a menos que su tipo tenga la habilidad `copy`, ni descartarse implícitamente a menos que tenga la habilidad `drop`; el compilador rechaza los usos no válidos. El módulo que define el tipo todavía puede crear valores nuevos y consumirlos explícitamente al desestructurarlos, además de exponer funciones controladas de acuñación o quema ([habilidades de Move en Aptos](https://aptos.dev/en/build/smart-contracts/book/abilities), [estructuras de Move y privilegios de módulo](https://aptos-labs.github.io/move-book/structs-and-enums.html)). Las habilidades evitan errores accidentales de copia y descarte, pero no demuestran que la lógica general de activos de un contrato sea correcta ni descartan todos los posibles errores de doble gasto o quema.

**Ejecución paralela.** Aptos ejecuta contratos Move mediante **Block-STM**, que la documentación describe como una tecnología que permite «la ejecución concurrente de transacciones sin ninguna intervención del usuario»: el entorno de ejecución infiere qué transacciones son independientes en tiempo de ejecución, en vez de requerir las listas declaradas de cuentas que utiliza Solana ([aptos.dev](https://aptos.dev/en/network/blockchain/move#:~:text=Parallelism%20via%20Block,input%20from%20the%20user)).

**Modelo de objetos de Sui.** Sui lleva más lejos la idea de recursos de Move con una capa de almacenamiento centrada en objetos: «un objeto es una unidad fundamental de almacenamiento en la red. Cada recurso, activo o dato en cadena es un objeto», direccionable mediante un ID único en lugar de residir en el almacén de clave-valor de una cuenta ([modelo de objetos de Sui](https://docs.sui.io/develop/sui-architecture/object-model)). El modelo de objetos actual de Sui enumera cinco formas de propiedad: **propiedad de una dirección**, **inmutable**, **propiedad de una dirección por consenso** (party), **compartida** y **encapsulada**. Una transacción puede seguir la ruta rápida directa de Sui sin ordenación por consenso solo cuando cada objeto mutable de entrada pertenece a una dirección y todos los demás objetos de entrada son inmutables. Los objetos cuya propiedad de dirección se gestiona por consenso y los objetos compartidos se secuencian mediante consenso incluso cuando una transacción solo los lee, aunque los accesos de solo lectura que no entran en conflicto pueden seguir ejecutándose simultáneamente ([objetos que pertenecen a una dirección en Sui](https://docs.sui.io/develop/objects/object-ownership/address-owned), [objetos party](https://docs.sui.io/develop/objects/object-ownership/party), [artículo Lutris](https://docs.sui.io/paper/sui-lutris.pdf)). Por tanto, las transacciones independientes que siguen la ruta rápida pueden procesarse simultáneamente sin tratar cada objeto como estado compartido globalmente.

**Fortaleza distintiva.** Los tipos de recursos de Move impiden que el código genérico copie un valor sin `copy` o que lo deje salir del ámbito sin `drop`. El módulo que define el tipo todavía puede acuñar valores y destruirlos explícitamente al desestructurarlos, por lo que estas comprobaciones no demuestran por sí solas la conservación de activos ni eliminan todos los errores en la lógica de activos. Tanto Aptos como Sui combinan ese modelo de seguridad con una ejecución paralela diseñada desde el principio, en vez de adaptada después.

---

## VM de bytecode portátil (CosmWasm y PolkaVM)

En lugar de definir un bytecode específico para blockchain, algunas cadenas utilizan formatos de instrucciones portátiles y de propósito general. **CosmWasm** ejecuta WebAssembly, mientras que **PolkaVM** ejecuta bytecode derivado de RISC-V; por tanto, PolkaVM no es una VM basada en WASM. El estándar WebAssembly describe Wasm como «un formato de instrucciones binario para una máquina virtual basada en pila», concebido como «un objetivo de compilación portátil para lenguajes de programación» que «aspira a ejecutarse a velocidad nativa» ([webassembly.org](https://webassembly.org/#:~:text=WebAssembly%20(abbreviated%20Wasm)%20is%20a,wide%20range%20of%20platforms)). Usar Wasm como VM de contratos significa que, en principio, cualquier lenguaje que compile a Wasm —Rust, C, C++, Go— puede producir un contrato desplegable.

**CosmWasm.** CosmWasm es la plataforma dominante de contratos inteligentes basados en Wasm del ecosistema Cosmos y se describe como «una plataforma de contratos inteligentes segura, eficiente e interoperable para el mundo multicadena» ([cosmwasm.com](https://www.cosmwasm.com/#:~:text=Secure%2C%20performant%2C%20interoperable%20smart%20contract,platform%20for%20the%20multi%2Dchain%20world)). Los contratos se escriben en **Rust** y se ejecutan en «un entorno de ejecución Web Assembly altamente optimizado» ([cosmwasm.com](https://www.cosmwasm.com/#:~:text=highly%20optimized%20Web%20Assembly%20runtime)). CosmWasm está desplegado en decenas de cadenas de Cosmos SDK, entre ellas Osmosis, Neutron, Injective, Secret Network y Terra, y hereda la mensajería entre cadenas IBC nativa de Cosmos.

**PolkaVM.** La VM más reciente de contratos inteligentes de Polkadot siguió otra ruta: en vez de ejecutar Wasm sin procesar, Parity creó PolkaVM como, según la descripción de su propio repositorio, «una máquina virtual de propósito general en espacio de usuario basada en RISC-V» ([github.com/paritytech/polkavm](https://github.com/paritytech/polkavm#:~:text=PolkaVM%20is%20a%20general%20purpose,level%20RISC%2DV%20based%20virtual%20machine)). La justificación, según la documentación de contratos inteligentes de ink!, es el rendimiento: la ejecución de RISC-V «se correlaciona con el rendimiento de las transacciones y sus costes», lo que proporciona una ejecución más rápida y económica que el intérprete de Wasm que ink! utilizaba antes ([use.ink](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/#:~:text=performance%20correlates%20with%20transaction%20throughput)). Cabe destacar que la pila PolkaVM de Polkadot (comercializada como «Revive») también incluye una capa de intérprete de EVM, que permite ejecutar contratos Solidity sobre el mismo backend RISC-V.

**Fortaleza distintiva.** Las VM de bytecode portátil sustituyen un bytecode específico de blockchain por objetivos de compilación de propósito general consolidados. Rust, en particular, aporta sólidas garantías de seguridad de memoria al código de contratos, y tanto Wasm como RISC-V se benefician de herramientas creadas para casos de uso no blockchain mucho más amplios. CosmWasm y PolkaVM siguen siendo arquitecturas distintas: la primera ejecuta Wasm y la segunda, bytecode derivado de RISC-V.

---

## CairoVM (Starknet)

**Cairo** es el lenguaje de contratos inteligentes y la VM creados específicamente para generar pruebas de conocimiento cero, y es la base de **Starknet**, una [Layer 2](/es/glossary/layer-2/) de Ethereum. La documentación de Starknet expresa claramente el objetivo de diseño: «Cairo es una arquitectura de Von Neumann compatible con STARK, capaz de generar pruebas de validez para cálculos arbitrarios» ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Cairo%20is%20a%20STARK,for%20arbitrary%20computations)). Que sea «compatible con STARK» significa que el conjunto de instrucciones está «optimizado para el sistema de pruebas STARK, aunque sigue siendo compatible con otros backends de sistemas de prueba» ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=Being%20STARK,other%20proof%20system%20backends)), una prioridad opuesta a la de la EVM o la SVM, que se diseñaron primero para la ejecución y solo más tarde incorporaron sistemas de pruebas para escalar.

**Modelo de ejecución.** Cairo compila a un conjunto de instrucciones Turing-completo (la «máquina Cairo») especificado como un conjunto de representaciones intermedias algebraicas, de modo que el rastro de ejecución de cualquier programa Cairo pueda convertirse en una prueba STARK sucinta verificable en Ethereum L1 ([starknet.io](https://www.starknet.io/cairo-book/ch201-architecture.html#:~:text=At%20its%20core%2C%20Cairo%20is,arbitrary%20code%29%20through%20the%20Cairo%20machine)). Esto permite a Starknet agrupar miles de transacciones fuera de la cadena y publicar en Ethereum una única prueba compacta de corrección, en vez de volver a ejecutar cada transacción.

**Fortaleza distintiva.** La facilidad para generar pruebas fue una restricción de diseño fundamental de Cairo: su conjunto de instrucciones y su rastro de ejecución están diseñados para producir pruebas STARK de manera eficiente. Sin embargo, el coste real de las pruebas depende del programa, la implementación del demostrador, los parámetros del sistema de pruebas y el objeto de comparación, por lo que no es necesariamente inferior para todas las cargas de trabajo zkEVM. La contrapartida es un ecosistema de lenguaje más nuevo y pequeño, así como una curva de aprendizaje más pronunciada que Solidity para quienes llegan desde Ethereum.

---

## Tabla comparativa

| VM | Lenguaje(s) de contratos | Modelo de ejecución / estado | Ejecución paralela | Tamaño del ecosistema | Compatible con EVM |
|---|---|---|---|---|---|
| **EVM** | Solidity, Vyper | Máquina de pila; estado de cuentas/almacenamiento en un trie Patricia de Merkle | No: secuencial dentro de un bloque | El mayor; objetivo predeterminado de L2 y cadenas de aplicaciones | Nativa |
| **SVM (Solana)** | Rust, C, C++ | Bytecode derivado de BPF; estado basado en cuentas con conjuntos declarados de lectura/escritura | Sí: Sealevel programa simultáneamente transacciones no superpuestas | Grande, de crecimiento rápido, principalmente nativo de Solana | No (ecosistema independiente) |
| **MoveVM (Aptos/Sui)** | Move | Objetos tipados como recursos; Aptos usa Block-STM y Sui varias formas de propiedad con rutas directas y secuenciadas por consenso | Sí: se infiere en tiempo de ejecución (Aptos) o mediante propiedad de objetos (Sui) | Más pequeño, en crecimiento; dos ecosistemas Move independientes | No |
| **Bytecode portátil (CosmWasm, PolkaVM)** | Rust (CosmWasm); cadenas de herramientas Rust/C/RISC-V (PolkaVM) | Bytecode Wasm (CosmWasm) o bytecode RISC-V (PolkaVM) | Depende de la cadena; no es una propiedad universal de ninguno de los dos formatos de instrucciones | Mediano; repartido entre muchas cadenas Cosmos y el conjunto de parachains de Polkadot | PolkaVM/Revive añade una capa de intérprete EVM; CosmWasm no es compatible con EVM |
| **CairoVM (Starknet)** | Cairo | Máquina basada en AIR y Turing-completa diseñada para pruebas STARK | No es el objetivo principal: está optimizada para facilitar las pruebas, no para la concurrencia | El más pequeño de los cinco, pero crece con la actividad L2 de Starknet | No (los proyectos zkEVM incorporan contratos Solidity por separado) |

---

## Cómo se relaciona esto con los dominios tokenizados

La VM que ejecuta una cadena importa directamente para la infraestructura de [dominios tokenizados](/es/glossary/tokenized-domain/). Un dominio representado como [NFT](/es/glossary/nft/) es, en el fondo, un contrato inteligente que hace cumplir quién posee un token y qué puede hacer con él: una lógica que se beneficia de las restricciones de Move en tiempo de compilación para copiar recursos y descartarlos implícitamente, y que las herramientas maduras de la EVM facilitan auditar e integrar con billeteras y mercados existentes. El modelo de tokenización de Namefi apunta deliberadamente al ecosistema EVM: la compatibilidad con EVM significa que el NFT de propiedad de un dominio `.com` o `.ai` tokenizado funciona de inmediato con el universo existente de billeteras EVM, mercados y protocolos DeFi, en vez de requerir una integración a medida para cada nueva VM. Explora los dominios tokenizados en [namefi.io](https://namefi.io).

---

## Fuentes y lecturas adicionales

- [The Ethereum Virtual Machine (EVM) — ethereum.org](https://ethereum.org/en/developers/docs/evm/)
- [Smart Contract Languages — ethereum.org](https://ethereum.org/en/developers/docs/smart-contracts/languages/)
- [Sealevel — Parallel Processing Thousands of Smart Contracts — Solana](https://solana.com/news/sealevel---parallel-processing-thousands-of-smart-contracts)
- [Move — Documentación de Aptos](https://aptos.dev/en/network/blockchain/move)
- [Habilidades de Move — documentación de Aptos](https://aptos.dev/en/build/smart-contracts/book/abilities)
- [Estructuras y enumeraciones — Move Book](https://aptos-labs.github.io/move-book/structs-and-enums.html)
- [Modelo de objetos — documentación de Sui](https://docs.sui.io/develop/sui-architecture/object-model)
- [Objetos que pertenecen a una dirección — documentación de Sui](https://docs.sui.io/develop/objects/object-ownership/address-owned)
- [Objetos party — documentación de Sui](https://docs.sui.io/develop/objects/object-ownership/party)
- [Sui Lutris](https://docs.sui.io/paper/sui-lutris.pdf)
- [CosmWasm](https://www.cosmwasm.com/)
- [PolkaVM — GitHub (paritytech)](https://github.com/paritytech/polkavm)
- [Why RISC-V and PolkaVM for Smart Contracts — documentación de ink!](https://use.ink/docs/v6/background/why-riscv-and-polkavm-for-smart-contracts/)
- [Arquitectura de Cairo — The Cairo Programming Language / Starknet](https://www.starknet.io/cairo-book/ch201-architecture.html)
- [WebAssembly](https://webassembly.org/)
