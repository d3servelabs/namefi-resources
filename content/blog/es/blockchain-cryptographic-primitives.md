---
title: "Las principales primitivas criptográficas que sustentan toda blockchain"
date: '2026-07-02'
language: es
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 10
format: roundup
description: "Una guía de las primitivas criptográficas fundamentales que hacen funcionar las blockchains: funciones hash, firmas digitales, árboles de Merkle, criptografía de curva elíptica y compromisos criptográficos."
ogImage: ../../assets/blockchain-cryptographic-primitives-og.jpg
keywords: ['criptografía blockchain', 'primitivas criptográficas', 'función hash', 'SHA-256', 'Keccak-256', 'firma digital', 'ECDSA', 'EdDSA', 'firma BLS', 'árbol de Merkle', 'criptografía de curva elíptica', 'secp256k1', 'esquema de compromiso', 'criptografía poscuántica', 'criptografía de clave pública', 'seguridad blockchain']
relatedArticles:
  - /es/blog/blockchain-privacy-technologies/
  - /es/blog/blockchain-consensus-mechanisms/
  - /es/blog/blockchain-virtual-machines/
  - /es/blog/blockchain-scaling-approaches/
  - /es/blog/what-are-tokenized-domains/
relatedGlossary:
  - /es/glossary/blockchain/
  - /es/glossary/cryptographic-security/
  - /es/glossary/public-key/
  - /es/glossary/private-key/
  - /es/glossary/ethereum/
relatedTopics:
  - /es/topics/web3-foundations/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/tokenize-your-com/
  - /es/series/domain-flipping-skills/
---

Toda afirmación en una blockchain —«esta transacción es definitiva», «esta dirección posee este activo», «este historial no se ha alterado»— se reduce, en última instancia, a un puñado de primitivas criptográficas que cumplen funciones acotadas y bien definidas. Ninguna de ellas fue inventada por las blockchains. Las funciones hash, las firmas digitales y los árboles de Merkle existían décadas antes de Bitcoin. Lo que hicieron las blockchains fue combinarlas en un sistema donde no hace falta confiar en una única parte para que cualquiera de esas afirmaciones se cumpla.

Esta guía recorre las primitivas que realmente soportan el peso: las [funciones hash](/en/glossary/hash-function/) que generan una huella de los datos, las [firmas digitales](/en/glossary/digital-signature/) que autorizan transacciones, los [árboles de Merkle](/en/glossary/merkle-tree/) que permiten verificar por partes conjuntos de datos enormes, las matemáticas de curvas elípticas sobre las que se apoyan esas firmas y los esquemas de compromiso, el bloque de construcción que lleva a las [pruebas de conocimiento cero](/en/glossary/zero-knowledge-proof/). Entender cada una es la forma más rápida de comprender qué hace realmente una blockchain bajo el capó.

---

## Funciones hash criptográficas (SHA-256, Keccak)

![Un documento introducido en una máquina de función hash produce un resumen de huella de longitud fija, y cambiar una sola letra de la entrada genera un resumen completamente distinto, lo que ilustra el efecto avalancha](../../assets/blockchain-cryptographic-primitives-01-hash-function.jpg)

Una [función hash](/en/glossary/hash-function/) recibe una entrada de cualquier tamaño y produce de forma determinista una salida de tamaño fijo —un «resumen»— de modo que cambiar un solo bit de la entrada altera por completo la salida, y encontrar dos entradas distintas con el mismo resultado hash es computacionalmente inviable. Esa propiedad, la resistencia a colisiones, permite usar un hash como una huella compacta de datos arbitrariamente grandes que deja en evidencia cualquier manipulación.

Bitcoin usa SHA-256 en todo el sistema: las cabeceras de bloque se encadenan al incorporar en cada cabecera nueva el hash SHA256(SHA256()) de la cabecera anterior, por lo que alterar cualquier bloque pasado cambia su hash y rompe todas las cabeceras posteriores ([Guía para desarrolladores de Bitcoin](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Each%20block%20also%20stores%20the%20hash%20of%20the%20previous%20block%27s%20header%2C%20chaining%20the%20blocks%20together)). La misma construcción de doble SHA-256 incorpora las transacciones al [árbol de Merkle](/en/glossary/merkle-tree/) del bloque ([referencia de Bitcoin.org](https://developer.bitcoin.org/reference/block_chain.html#:~:text=A%20SHA256%28SHA256%28%29%29%20hash%20in%20internal%20byte%20order)).

Ethereum, en cambio, estandariza Keccak-256 (la propuesta Keccak original, distinta del estándar SHA-3 posterior de NIST) como función hash de propósito general. Cada dirección de cuenta se deriva tomando los últimos 20 bytes del hash Keccak-256 de la [clave pública](/en/glossary/public-key/) de la cuenta ([ethereum.org](https://ethereum.org/en/developers/docs/accounts/#:~:text=You%20get%20a%20public%20address%20for%20your%20account%20by%20taking%20the%20last%2020%20bytes%20of%20the%20Keccak-256%20hash%20of%20the%20public%20key)), y la misma función sustenta el direccionamiento por contenido de clave/valor que se usa en todo el [Trie Patricia de Merkle](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=key%20%3D%3D%20keccak256%28rlp%28value%29%29) que almacena el estado de Ethereum.

El hashing también es lo que convierte las cabeceras de bloque en una cadena auténtica, en lugar de una colección inconexa de registros: el hash de cada cabecera depende del hash de la cabecera anterior, de modo que reescribir el historial exige rehacer todos los bloques posteriores al punto que se quiere cambiar, además de superar el trabajo que sigue realizando la red honesta. Esa propiedad de «encadenamiento» es la razón literal por la que la estructura de datos se llama **blockchain**.

---

## Criptografía de clave pública y firmas digitales (ECDSA, EdDSA, BLS)

![Una clave privada firma una transacción para producir una firma digital, que una clave pública correspondiente verifica como válida con una marca de verificación verde, mientras que una clave pública que no coincide la rechaza con una X roja](../../assets/blockchain-cryptographic-primitives-02-signatures.jpg)

Una blockchain no tiene formulario de inicio de sesión, por lo que necesita otra forma de demostrar que «esta transacción realmente procede del propietario de esta cuenta». La [criptografía de clave pública](/en/glossary/public-key/) lo resuelve con un par de claves: una [clave privada](/en/glossary/private-key/) que se mantiene secreta y una clave pública que puede compartirse libremente. Firmar una transacción con la clave privada produce una [firma digital](/en/glossary/digital-signature/) que cualquiera puede verificar frente a la clave pública, demostrando la autorización sin revelar nunca la propia clave privada.

Las cuentas de Ethereum derivan su clave pública de la clave privada mediante el algoritmo de firma digital de curva elíptica, ECDSA, sobre la curva secp256k1, la misma curva que usa Bitcoin ([documentación de cuentas de ethereum.org](https://ethereum.org/en/developers/docs/accounts/#:~:text=The%20public%20key%20is%20generated%20from%20the%20private%20key%20using%20the%20Elliptic%20Curve%20Digital%20Signature%20Algorithm); [EIP-2, corrección de la maleabilidad de firmas secp256k1](https://eips.ethereum.org/EIPS/eip-2#:~:text=secp256k1n%2F2)). ECDSA es rápido de verificar y lleva décadas bajo escrutinio, pero presenta una debilidad operativa relevante para diseños más nuevos: las firmas ECDSA individuales no se agregan de manera eficiente, así que verificar miles de ellas requiere miles de comprobaciones separadas.

Ese es el vacío que cubren las firmas EdDSA y BLS. EdDSA (usada por cadenas como Solana y Stellar) emplea una construcción de curva distinta, determinista y resistente a ciertos problemas de implementación que históricamente han provocado errores de reutilización de nonce en ECDSA. Las firmas BLS van más allá: gracias a la propiedad de emparejamiento matemático de las curvas que usan, muchas firmas BLS pueden combinarse en una única firma agregada que verifica todas a la vez. La capa de consenso de prueba de participación de Ethereum depende precisamente de esto: los validadores firman certificaciones con claves BLS para que la Beacon Chain pueda agregar votos de cientos de miles de validadores en firmas lo bastante compactas como para verificarse rápidamente; eso es lo que hace viable la prueba de participación a gran escala ([ethereum.org, *The Beacon Chain*](https://eth2book.info/capella/part2/building_blocks/signatures/#:~:text=BLS%20signatures%20can%20be%20aggregated%20together%2C%20making%20them%20efficient%20to%20verify%20at%20large%20scale)). Ethereum también expone operaciones de curva BLS12-381 como precompiladas de la EVM específicamente para permitir la verificación de firmas BLS en contratos inteligentes ([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#:~:text=Add%20functionality%20to%20efficiently%20perform%20operations%20over%20the%20BLS12-381%20curve%2C%20including%20those%20for%20BLS%20signature%20verification)).

---

## Árboles de Merkle

![Una pirámide de nodos hash de un árbol de Merkle se combina por pares hasta una única raíz, con una ruta de prueba de hoja a raíz resaltada en naranja que muestra una prueba de Merkle para cliente ligero](../../assets/blockchain-cryptographic-primitives-03-merkle-tree.jpg)

Un [árbol de Merkle](/en/glossary/merkle-tree/) permite que una blockchain resuma miles de transacciones en un único hash de 32 bytes sin obligar a cada participante a almacenar todas las transacciones. Las hojas son hashes de elementos de datos individuales (transacciones, estados de cuenta); cada par de hashes se concatena y se vuelve a hashear, repitiendo el proceso hasta que queda un hash —la raíz— ([Guía para desarrolladores de Bitcoin](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Copies%20of%20each%20transaction%20are%20hashed%2C%20and%20the%20hashes%20are%20then%20paired%2C%20hashed%2C%20paired%20again%2C%20and%20hashed%20again%20until%20a%20single%20hash%20remains%2C%20the%20merkle%20root%20of%20a%20merkle%20tree)). Esa raíz se almacena directamente en la cabecera del bloque, lo que permite que un nodo completo se comprometa con todo el contenido de un bloque usando casi ningún espacio adicional.

La ventaja está en el tamaño de la prueba. Para demostrar que una transacción está incluida en un bloque, no se necesita el bloque completo, sino únicamente la transacción y una «rama de Merkle»: los hashes hermanos a lo largo de la ruta desde esa hoja hasta la raíz, normalmente del orden de log₂(n) hashes para n transacciones. Esta es la base de la verificación de pago simplificada (SPV): un cliente ligero que solo tiene cabeceras de bloque aún puede verificar que se produjo una transacción específica al comprobar su rama de Merkle contra la raíz de la cabecera, sin descargar toda la blockchain ([Guía para desarrolladores de Bitcoin](https://developer.bitcoin.org/devguide/operating_modes.html#:~:text=the%20merkle%20root%20in%20the%20block%20header%20along%20with%20a%20merkle%20branch%20can%20prove%20to%20the%20SPV%20client%20that%20the%20transaction%20in%20question%20is%20embedded%20in%20a%20block%20in%20the%20block%20chain)).

Ethereum amplía la idea con el Trie Patricia de Merkle, un híbrido de árbol de Merkle y trie de prefijos (radix) utilizado para almacenar el estado completo de las cuentas, no solo una lista de transacciones. Cada cabecera de bloque lleva tres raíces de trie distintas —`stateRoot`, `transactionsRoot` y `receiptsRoot`—, cada una demostrable de forma independiente ([ethereum.org](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=From%20a%20block%20header%20there%20are%203%20roots%20from%203%20of%20these%20tries)). Esto permite que un contrato inteligente o un cliente ligero verifique un único saldo de cuenta o una única ranura de almacenamiento sin reproducir toda la cadena.

---

## Criptografía de curva elíptica

La criptografía de curva elíptica (ECC) es la base matemática sobre la que se asientan ECDSA, EdDSA y BLS. En lugar de basarse en la dificultad de factorizar números grandes (como hace el RSA clásico), ECC se apoya en la dificultad del problema del logaritmo discreto en curvas elípticas: dado un punto de la curva al que se llega sumando un punto base a sí mismo muchas veces, es computacionalmente inviable recuperar cuántas veces se hizo, aunque calcular el punto en la dirección directa sea fácil. Esa asimetría —fácil en un sentido, difícil de invertir— es exactamente lo que permite usar una clave privada para firmar sin que la clave pública derivada deje de ser segura de publicar.

La curva concreta importa. Bitcoin y Ethereum usan secp256k1, una curva de Koblitz estandarizada por el Standards for Efficient Cryptography Group con parámetros de 256 bits bien estudiados ([SEC 2: Parámetros de dominio de curva elíptica recomendados](https://www.secg.org/sec2-v2.pdf)). Otros ecosistemas usan curvas distintas según sus compromisos: Ed25519 (la curva detrás de EdDSA en Solana y Stellar) prioriza la seguridad de la implementación y la velocidad, mientras que BLS12-381 se elige específicamente porque admite las operaciones de emparejamiento que requiere la agregación. Todas ofrecen aproximadamente el mismo nivel práctico de seguridad por bit de clave, a la vez que producen claves y firmas mucho más cortas que las de RSA equivalente; por eso ECC, y no RSA, se convirtió en el valor predeterminado para las cuentas blockchain.

---

## Esquemas de compromiso (un puente hacia el conocimiento cero)

Un esquema de compromiso permite «comprometer» un valor: publicar algo que te vincula a un dato concreto sin revelar el dato en sí y, más tarde, «abrir» el compromiso para demostrar cuál era. La analogía cotidiana es un sobre sellado: hoy puedes entregar a alguien un sobre sellado como prueba de que ya decidiste una respuesta, sin que la vea hasta que elijas abrirlo después y sin poder cambiar la respuesta de dentro una vez sellado.

Parece una primitiva menor, pero es la pieza que soporta la carga bajo la mayoría de los sistemas de pruebas de conocimiento cero. El diseño de disponibilidad de datos basado en blobs de Ethereum, por ejemplo, usa compromisos KZG —un esquema de compromiso polinómico— para reducir un blob grande de datos de rollup a un único compromiso criptográfico pequeño que quienes generan y verifican pruebas pueden comprobar sin procesar el blob completo ([ethereum.org, Danksharding](https://ethereum.org/en/roadmap/danksharding/#:~:text=KZG%20stands%20for%20Kate-Zaverucha-Goldberg)). De hecho, una raíz de Merkle es en sí misma un esquema de compromiso sencillo: compromete un conjunto de datos completo mediante su hash raíz, y una rama de Merkle es la «apertura» que revela una parte de él. Los ZK-rollups se basan en esquemas de compromiso más avanzados (compromisos polinómicos y vectoriales) para comprimir un lote completo de ejecución de transacciones en una prueba cuya verificación en cadena es barata; este tema se aborda en profundidad en [Conocimiento cero perfecto frente a computacional](/en/blog/perfect-vs-computational-zero-knowledge/).

---

## Comparación: primitivas criptográficas de blockchain

| Primitiva | Propiedad que proporciona | Uso en cadena | Riesgo clásico frente a poscuántico |
|---|---|---|---|
| Funciones hash (SHA-256, Keccak-256) | Huella resistente a colisiones; encadena bloques | Hashing de bloques, derivación de direcciones, raíces de Merkle | Sólidas frente a ataques clásicos con los tamaños de salida actuales; los esquemas basados en hashes suelen considerarse más resistentes a ataques cuánticos que las firmas actuales de curva elíptica |
| Firmas digitales — ECDSA | Autorización de transacciones mediante un par de clave privada/pública | Firmas de cuentas de Bitcoin y Ethereum | Segura frente a ataques clásicos; se espera que un ordenador cuántico de gran escala con capacidad suficiente pueda romper los esquemas basados en curvas elípticas, razón por la que NIST ha estandarizado alternativas poscuánticas ([NIST, 2024](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards#:~:text=A%20sufficiently%20capable%20quantum%20computer%2C%20though%2C%20would%20be%20able%20to%20sift%20through%20a%20vast%20number%20of%20potential%20solutions%20to%20these%20problems%20very%20quickly%2C%20thereby%20defeating%20current%20encryption)) |
| Firmas digitales — EdDSA / BLS | Firma determinista (EdDSA); agregación eficiente de firmas (BLS) | Firmas en Solana/Stellar (EdDSA); certificaciones de validadores de Ethereum (BLS) | La misma hipótesis subyacente de curva elíptica que ECDSA; la misma exposición cuántica a largo plazo |
| Árboles de Merkle | Compromiso compacto con un conjunto de datos grande; pruebas de inclusión pequeñas | Cabeceras de bloque, verificación de clientes ligeros (SPV), tries de estado/transacciones/recibos de Ethereum | Depende únicamente de la resistencia a colisiones de la función hash subyacente, por lo que hereda la postura cuántica de ese hash en lugar de añadir una exposición nueva |
| Criptografía de curva elíptica | Base matemática para claves y firmas compactas | secp256k1 (Bitcoin, Ethereum), Ed25519, BLS12-381 | Vulnerable del mismo modo que ECDSA/EdDSA/BLS ante un futuro ordenador cuántico de gran escala; este es el principal motor de la investigación sobre migración poscuántica |
| Esquemas de compromiso | Comprometer un valor ahora y revelarlo/demostrarlo después sin exponerlo de entrada | Compromisos KZG en la disponibilidad de datos de Ethereum; raíces de Merkle como compromisos sencillos; bloque de construcción para ZK-rollups | La seguridad depende de la hipótesis de hash o curva elíptica subyacente utilizada para construir el esquema |

---

## Cómo se conecta esto con los dominios tokenizados

Cada una de estas primitivas aparece directamente cuando [tokenizas](/en/glossary/tokenize/) un dominio. El [NFT](/en/glossary/nft/) que representa la propiedad está protegido por las mismas firmas ECDSA que protegen cualquier otro activo blockchain: quien controla la clave privada controla el token del dominio, sin más; por eso las [billeteras de hardware](/en/glossary/hardware-wallet/) y la custodia cuidadosa de la [frase semilla](/en/glossary/seed-phrase/) importan tanto para un `.com` tokenizado como para cualquier otro activo en cadena. El registro de propiedad del dominio vive en el mismo estado comprometido mediante Merkle que protege todos los demás saldos de cuentas y [contratos inteligentes](/en/glossary/smart-contract/) de la cadena; eso es precisamente lo que proporciona a un dominio tokenizado la misma evidencia de no manipulación que a cualquier otro activo en cadena: transferible, verificable y con una propiedad demostrable sin que la base de datos de un registrador sea la única fuente de autoridad.

Comprender estas primitivas también aclara qué cambia y qué no cambia con la tokenización: el registro DNS y el estado del registro del dominio siguen las reglas de ICANN, pero la prueba de propiedad ahora se apoya en la criptografía descrita anteriormente, en vez de en una cuenta de [registrador](/en/glossary/registrar/) protegida por inicio de sesión. Explora el panorama más amplio en [Mecanismos de consenso de blockchain](/es/blog/blockchain-consensus-mechanisms/) y [Enfoques de escalado de blockchain](/es/blog/blockchain-scaling-approaches/), o empieza a tokenizar en [namefi.io](https://namefi.io).

---

## Fuentes y lecturas adicionales

- Guía para desarrolladores de Bitcoin — [Cadena de bloques](https://developer.bitcoin.org/devguide/block_chain.html), encadenamiento mediante SHA256(SHA256()) de la cabecera anterior
- Referencia para desarrolladores de Bitcoin — [Cadena de bloques](https://developer.bitcoin.org/reference/block_chain.html), construcción de la raíz de Merkle
- Guía para desarrolladores de Bitcoin — [Modos de funcionamiento](https://developer.bitcoin.org/devguide/operating_modes.html), SPV y ramas de Merkle
- ethereum.org — [Cuentas de Ethereum](https://ethereum.org/en/developers/docs/accounts/), ECDSA y derivación de direcciones Keccak-256
- ethereum.org — [Trie Patricia de Merkle](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/), raíces de estado/transacciones/recibos
- ethereum.org — [Danksharding](https://ethereum.org/en/roadmap/danksharding/), compromisos polinómicos KZG
- EIP-2 — [Cambios del hard fork Homestead](https://eips.ethereum.org/EIPS/eip-2), restricciones de firmas secp256k1
- EIP-2537 — [Precompilada para operaciones de curva BLS12-381](https://eips.ethereum.org/EIPS/eip-2537)
- SEC 2: Parámetros de dominio de curva elíptica recomendados — [secg.org](https://www.secg.org/sec2-v2.pdf)
- *The Eth2 Book* — [Firmas y agregación BLS](https://eth2book.info/capella/part2/building_blocks/signatures/)
- NIST — [NIST publica los tres primeros estándares finalizados de cifrado poscuántico](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards)
