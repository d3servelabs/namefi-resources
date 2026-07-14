---
title: "Principales tecnologías de privacidad en blockchain: pruebas de conocimiento cero, FHE, MPC, TEE y firmas de anillo"
date: '2026-07-02'
language: es
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 50
format: roundup
description: "Una guía clara sobre las cinco principales tecnologías de privacidad en blockchain: pruebas de conocimiento cero, FHE, MPC, TEE y firmas de anillo, comparadas lado a lado."
ogImage: ../../assets/blockchain-privacy-technologies-og.jpg
keywords: ['privacidad en blockchain', 'prueba de conocimiento cero', 'zkp', 'cifrado totalmente homomórfico', 'fhe', 'computación segura entre múltiples partes', 'mpc', 'entorno de ejecución confiable', 'tee', 'firmas de anillo', 'direcciones furtivas', 'monero', 'zcash', 'zksync', 'starknet', 'tecnología de privacidad', 'computación confidencial', 'privacidad onchain', 'criptografía de blockchain', 'monedas de privacidad']
relatedArticles:
  - /es/blog/blockchain-cryptographic-primitives/
  - /es/blog/blockchain-scaling-approaches/
  - /es/blog/blockchain-virtual-machines/
  - /es/blog/blockchain-consensus-mechanisms/
  - /es/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /es/glossary/zero-knowledge-proof/
  - /es/glossary/fully-homomorphic-encryption/
  - /es/glossary/secure-multiparty-computation/
  - /es/glossary/trusted-execution-environment/
  - /es/glossary/cryptographic-security/
relatedTopics:
  - /es/topics/web3-foundations/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/tokenize-your-com/
  - /es/series/domain-flipping-skills/
---

Por defecto, cada transacción en una [blockchain](/es/glossary/blockchain/) pública es visible para cualquiera que mire. Los saldos, los importes transferidos y las contrapartes quedan para siempre en el registro abierto. Esa transparencia es la fuente de las garantías de confianza de una blockchain, pero también es un inconveniente: ningún banco publica los saldos de sus clientes y ninguna empresa quiere que sus pagos a proveedores o sus nóminas puedan ser leídos por sus competidores.

Las tecnologías de privacidad para blockchain existen para cerrar esa brecha sin renunciar a las propiedades que hacen útiles a las cadenas en primer lugar: verificabilidad, descentralización y la posibilidad de que desconocidos realicen transacciones sin un intermediario de confianza. Cinco técnicas dominan el panorama actual: las [pruebas de conocimiento cero](/es/glossary/zero-knowledge-proof/), el [cifrado totalmente homomórfico](/es/glossary/fully-homomorphic-encryption/) (FHE), la [computación segura entre múltiples partes](/es/glossary/secure-multiparty-computation/) (MPC), los [entornos de ejecución confiables](/es/glossary/trusted-execution-environment/) (TEE) y las firmas de anillo con direcciones furtivas. Cada una oculta una parte distinta del problema, se apoya en una hipótesis de confianza diferente y exige una cantidad de cómputo distinta. Esta guía explica las cinco, las compara lado a lado y aclara por qué la elección importa para cualquiera que construya sobre —o simplemente esté aprendiendo sobre— [Web3](/es/glossary/web3/).

---

## Pruebas de conocimiento cero

![Una persona que prueba entrega a una persona verificadora una insignia luminosa de prueba válida mientras mantiene un documento cerrado detrás de la espalda, lo que ilustra cómo una prueba de conocimiento cero convence sin revelar la afirmación subyacente](../../assets/blockchain-privacy-technologies-01-zero-knowledge.jpg)

Una [prueba de conocimiento cero](/es/glossary/zero-knowledge-proof/) (ZKP) permite a una parte —quien *prueba*— convencer a otra —quien *verifica*— de que una afirmación es verdadera sin revelar nada más sobre ella. La documentación para desarrolladores de Ethereum lo expresa de forma clara: «una prueba de conocimiento cero es una forma de demostrar la validez de una afirmación sin revelar la propia afirmación»; la «persona que prueba» intenta demostrar una reclamación y la «persona verificadora» se encarga de validarla ([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/#:~:text=A%20zero%2Dknowledge%20proof%20is,without%20revealing%20the%20statement%20itself)).

Para que un sistema de pruebas cuente como un protocolo genuino de conocimiento cero debe satisfacer tres propiedades: completitud («si la entrada es válida, el protocolo de conocimiento cero siempre devuelve "true"»), solidez («si la entrada no es válida, es teóricamente imposible engañar al protocolo de conocimiento cero para que devuelva "true"») y conocimiento cero propiamente dicho, es decir, que «la persona verificadora no aprende nada sobre una afirmación más allá de si es válida o falsa» ([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)). En concreto, una prueba se construye a partir de un testigo (el secreto que conoce quien prueba), un desafío (una pregunta planteada por quien verifica) y una respuesta que permite comprobar ese conocimiento sin ver nunca el testigo.

**Qué oculta:** los datos o el cálculo subyacentes; solo se revela la prueba de que una reclamación es verdadera.

**Cómo se usa hoy:** los ZK-rollups son el mayor uso en producción de las ZKP para escalar blockchain. «Agrupan (o hacen “roll up” de) transacciones en lotes que se ejecutan fuera de cadena» y luego generan una única prueba de validez que Ethereum verifica antes de finalizar los cambios de estado del lote ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20bundle%20)). zkSync Era, creado por Matter Labs, es «un ZK Rollup compatible con EVM... impulsado por su propio zkEVM» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)), mientras que Starknet, creado por StarkWare, es un rollup de validez que ejecuta su propia VM Cairo en lugar de la EVM (los contratos de Solidity se conectan por separado). L2BEAT registra ambos como rollups protegidos por pruebas de validez, en vez de por la ventana de impugnación de pruebas de fraude que usan los rollups optimistas ([l2beat.com](https://l2beat.com/scaling/summary)). En materia de privacidad, [Zcash](https://z.cash/technology/) fue pionero en los zk-SNARK (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) para transacciones blindadas, donde «las direcciones de los usuarios, el importe de sus transacciones» y otros datos permanecen cifrados mientras la red sigue confirmando que la transacción es válida ([z.cash](https://z.cash/technology/)).

**La contrapartida:** generar una prueba ZK es costoso desde el punto de vista computacional —los circuitos de prueba recorren cada transacción de un lote y repiten sus comprobaciones—, por lo que el tiempo de prueba y el coste de hardware son limitaciones reales, aunque verificar en cadena sea barato y rápido. La confianza en el sistema se reduce a confiar en las matemáticas y, en algunos sistemas de prueba, en una ceremonia única de configuración confiable.

---

## Cifrado totalmente homomórfico (FHE)

![Una caja cerrada pasa por una máquina matemática manejada por un servidor en la nube sin llave y sale aún cerrada, pero con un resultado calculado dentro, lo que ilustra un cálculo realizado directamente sobre datos cifrados](../../assets/blockchain-privacy-technologies-02-fhe.jpg)

El [cifrado totalmente homomórfico](/es/glossary/fully-homomorphic-encryption/) adopta otro enfoque: en vez de demostrar un hecho sobre datos ocultos, permite *calcular directamente sobre datos cifrados* y obtener un resultado cifrado que, al descifrarse, equivale a la misma respuesta que se obtendría al calcular sobre texto plano. Zama, una de las empresas líderes en investigación e infraestructura de FHE, lo describe así: «FHE permite procesar datos sin descifrarlos: las empresas prestan servicios sin acceder a los datos de los usuarios, mientras estos disfrutan de una funcionalidad sin cambios» ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**Qué oculta:** las entradas en bruto, el estado intermedio y las salidas de un cálculo; todas las personas salvo quien posee la clave solo ven texto cifrado, incluso la parte que realiza el cálculo.

**Cómo funciona a alto nivel:** los esquemas FHE codifican valores en texto plano como textos cifrados construidos sobre matemáticas basadas en retículas, y después definen equivalentes cifrados de la suma y la multiplicación para que circuitos arbitrarios puedan ejecutarse sobre los textos cifrados. Aplicado a una blockchain, esto significa que un contrato inteligente puede mover tokens o evaluar lógica sin ver nunca los importes implicados; como explica el ejemplo de Zama, «la blockchain comprobó que Alice tenía fondos suficientes sin ver nunca los importes reales» ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption#:~:text=The%20blockchain%20verified%20Alice%20has%20sufficient%20funds%20without%20ever%20seeing%20the%20actual%20amounts)). Zama también indica que los esquemas FHE basados en retículas son «intrínsecamente resistentes a los ataques cuánticos», algo relevante para quienes piensan a largo plazo en el riesgo criptográfico ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**Proyectos de ejemplo:** [Zama](https://www.zama.org/) desarrolla las bibliotecas FHE de código abierto (TFHE-rs, Concrete) y fhEVM, usada para añadir ejecución confidencial de contratos inteligentes a cadenas EVM. [Fhenix](https://cofhe-docs.fhenix.zone/) es una blockchain creada específicamente para que «los desarrolladores construyan contratos inteligentes que preserven la privacidad mediante Fully Homomorphic Encryption», de modo que «los datos sensibles permanezcan cifrados durante todo el cálculo», con una biblioteca JavaScript (Cofhejs) para el cifrado del lado del cliente y una biblioteca FHE de Solidity para operaciones cifradas en cadena ([cofhe-docs.fhenix.zone](https://cofhe-docs.fhenix.zone/)).

**La contrapartida:** FHE ofrece la garantía de privacidad más fuerte de esta lista —nada se descifra, ni siquiera durante el cálculo—, pero también es, con gran diferencia, lo más costoso desde el punto de vista computacional frente a la ejecución en texto plano. Por eso las cadenas basadas en FHE ejecutan hoy lógica crítica para la confidencialidad en lugar de todas las transacciones, y por eso la aceleración de hardware para FHE es una carrera de investigación activa.

---

## Computación segura entre múltiples partes (MPC)

![Tres personas sostienen cada una una parte de una clave en forma de pieza de rompecabezas, unidas mediante líneas discontinuas en una única transacción firmada, lo que ilustra cómo la computación segura entre múltiples partes produce un resultado conjunto sin que nadie vea el secreto completo](../../assets/blockchain-privacy-technologies-03-mpc.jpg)

La [computación segura entre múltiples partes](/es/glossary/secure-multiparty-computation/) resuelve un problema relacionado pero distinto: en vez de que una parte calcule sobre datos cifrados, *varias* partes que poseen cada una una parte privada de la entrada calculan conjuntamente una función sin revelar sus entradas individuales entre sí. Según la definición formal, MPC es «un subcampo de la criptografía cuyo objetivo es crear métodos para que las partes calculen conjuntamente una función sobre sus entradas y mantengan privadas esas entradas», de modo que, para tres participantes, «Alice, Bob y Charlie todavía pueden aprender F(x, y, z) sin revelar quién gana qué» ([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation#:~:text=Secure%20multi%2Dparty%20computation%20)).

**Qué oculta:** la entrada individual de cada parte frente a todas las demás; solo se revela la salida acordada y ningún participante ve jamás el secreto completo.

**Hipótesis de confianza:** la seguridad depende de cuántos participantes pueden ser deshonestos antes de que el esquema falle. Las construcciones clásicas de compartición de secretos ofrecen seguridad de teoría de la información siempre que menos de un tercio de las partes sean activamente maliciosas, o que menos de la mitad sean meramente curiosas ([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)). En otras palabras, MPC sustituye «confiar en un custodio» por «confiar en que no coludan demasiadas de estas N partes».

**Cómo se usa hoy: custodia con firmas de umbral:** la aplicación blockchain más visible de MPC consiste en dividir una clave privada entre partes independientes para que ningún dispositivo o persona posea nunca la clave completa. El proveedor de infraestructura de custodia Fireblocks lo describe directamente: «la computación entre múltiples partes (MPC) es un método criptográfico que divide una clave privada en participaciones separadas distribuidas entre varias partes independientes» y, de forma crucial, «la clave completa nunca se reúne en un único lugar, en ningún momento» ([fireblocks.com](https://www.fireblocks.com/what-is-mpc#:~:text=Multi%2Dparty%20computation%20)). Cuando una transacción necesita una firma, un quórum de puntos de conexión valida cada uno la transacción y aporta una firma parcial; «en ningún momento se reúne la clave privada», de modo que «aunque se comprometa un punto de conexión... las participaciones de clave que permanecen en otros lugares no sirven de nada de forma aislada» ([fireblocks.com](https://www.fireblocks.com/what-is-mpc)). Este patrón de firma de umbral sustenta ahora gran parte de la custodia institucional de criptoactivos y muchas billeteras con varios firmantes.

**La contrapartida:** MPC evita el punto único de fallo de una clave privada guardada en un solo dispositivo, pero añade rondas de comunicación entre las partes (latencia) y requiere un diseño de protocolo cuidadoso. La garantía de seguridad de un esquema MPC solo es tan fuerte como su umbral supuesto de mayoría honesta, una hipótesis social y operativa, no solo matemática.

---

## Entornos de ejecución confiables (TEE)

Un [entorno de ejecución confiable](/es/glossary/trusted-execution-environment/) adopta otra vía: en lugar de cifrar los datos durante todo el cálculo, lo aísla dentro de una región de un chip protegida por hardware —un *enclave seguro*— que ni siquiera el propio sistema operativo de la máquina puede inspeccionar. SGX (Software Guard Extensions) de Intel, la implementación más conocida, se describe en Wikipedia como «un conjunto de códigos de instrucción que implementan un entorno de ejecución confiable y que están integrados en algunas unidades centrales de procesamiento (CPU) de Intel» ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=Intel%20Software%20Guard%20Extensions)). Desde el punto de vista mecánico, «SGX implica que la CPU cifre una parte de la memoria (el enclave)», de modo que «los datos y el código que se originan en el enclave se descifran sobre la marcha dentro de la CPU, lo que evita que otros códigos los examinen o lean», incluido «código que se ejecuta con niveles de privilegio superiores, como el sistema operativo y los hipervisores subyacentes» ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)).

**Qué oculta:** los datos y el código dentro del enclave frente a todos los demás procesos de la misma máquina, incluido un sistema operativo comprometido; es útil cuando se necesita confiar en la ejecución de una pieza de código concreta sin confiar en el operador del servidor.

**Hipótesis de confianza:** a diferencia de las ZKP, FHE o MPC, que dependen puramente de las matemáticas, un TEE exige confiar en el hardware y el firmware del fabricante del chip. Esa confianza se ha puesto a prueba: SGX «no protege frente a ataques de canal lateral», y los investigadores han demostrado repetidamente vulneraciones prácticas, desde extraer «claves RSA de enclaves SGX ejecutándose en el mismo sistema en cinco minutos» (2017) hasta el ataque Foreshadow, que «combina ejecución especulativa y desbordamiento de búfer para omitir SGX» (2018), además de vulnerabilidades posteriores como Plundervolt, LVI, SGAxe y ÆPIC Leak ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=While%20this%20can%20mitigate%20many%20kinds%20of%20attacks%2C%20it%20does%20not%20protect%20against%20side%2Dchannel%20attacks)). Este historial explica por qué los TEE suelen describirse como un término medio pragmático y más rápido, no como una garantía criptográfica hermética.

**Proyectos de ejemplo:** la red Sapphire de [Oasis Protocol](https://oasis.net/technology) ejecuta contratos inteligentes dentro de enclaves de hardware para que los usuarios puedan «ejecutar código dentro de enclaves protegidos por hardware», donde «los datos permanecen cifrados incluso frente a los operadores de servidores», mientras que «cada ejecución produce una prueba criptográfica que los usuarios pueden verificar sin confianza ciega». El resultado son «contratos inteligentes confidenciales» que conservan «compatibilidad y composabilidad con EVM» ([oasis.net](https://oasis.net/technology)). Secret Network y varios productos de privacidad vinculados al restaking también se basan en TEE, a menudo combinados con otras técnicas para una defensa en profundidad.

**La contrapartida:** los TEE funcionan cerca de la velocidad nativa —mucho más rápido que FHE o las pruebas ZK pesadas—, lo que los hace atractivos para aplicaciones sensibles a la latencia. Pero esa velocidad procede de confiar en hardware con un historial real y documentado de vulneraciones por canal lateral, así que los sistemas basados en TEE suelen tener hipótesis de confianza más débiles en el peor caso que los enfoques criptográficos puros.

---

## Firmas de anillo y direcciones furtivas

El último par de técnicas protege un objetivo más limitado pero muy práctico: ocultar *quién* envió una transacción y *quién* la recibió, aunque la transacción en sí sea visible en cadena. [Monero](https://www.getmonero.org/) es el principal ejemplo en producción de ambas.

**Las firmas de anillo** ocultan al remitente. La documentación de Monero explica que «una firma de anillo es un tipo de firma digital que puede realizar cualquier miembro de un grupo de usuarios que tengan claves», y que «debería ser computacionalmente inviable determinar cuál de las claves de los miembros del grupo se utilizó para producir la firma» ([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html#:~:text=a%20ring%20signature%20is%20a%20type%20of%20digital%20signature)). En la práctica, una transacción de Monero mezcla la clave de quien realmente gasta con claves públicas señuelo «extraídas de la blockchain mediante un método de distribución gamma», de manera que, «en un “anillo” de posibles firmantes, todos los miembros del anillo son iguales y válidos» y «no hay forma de que un observador externo sepa cuál de los posibles firmantes de un grupo de firmas pertenece a tu cuenta» ([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)).

**Las direcciones furtivas** ocultan a quien recibe. En vez de reutilizar una única dirección pública, «el remitente [crea] direcciones aleatorias de un solo uso para cada transacción en nombre de quien recibe», de modo que los pagos entrantes «van a direcciones únicas de la blockchain, donde no pueden vincularse ni con la dirección publicada de quien recibe ni con las direcciones de ninguna otra transacción» ([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html#:~:text=They%20allow%20and%20require%20the%20sender%20to%20create%20random%20one%2Dtime%20addresses)). Quien recibe utiliza una clave privada de visualización para buscar pagos en la cadena y una clave privada de gasto para moverlos, de forma que «solo quien envía y quien recibe pueden determinar adónde se mandó un pago» ([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)).

**Qué oculta:** la identidad de quien envía (firmas de anillo) y la identidad de quien recibe (direcciones furtivas). Los *importes* de las transacciones se ocultan mediante un mecanismo independiente (Confidential Transactions / RingCT), que estas dos técnicas por sí solas no cubren.

**La contrapartida:** ambas técnicas funcionan eficientemente en hardware convencional, sin sobrecarga de pruebas ni dependencia de enclaves, lo que las hace adecuadas para una red de pagos activa. Pero el modelo de confianza depende de que los conjuntos de señuelos sean estadísticamente indistinguibles de quien firma realmente. Una selección débil de señuelos o las heurísticas de análisis de blockchain han reducido históricamente los conjuntos de anonimato en implementaciones tempranas de firmas de anillo, por lo que las decisiones sobre parámetros (tamaño del anillo, distribución de señuelos) importan tanto como la primitiva subyacente.

---

## Comparación de los cinco enfoques

| Tecnología | Qué oculta | Hipótesis de confianza | Coste de rendimiento | Madurez actual | Proyectos de ejemplo |
|---|---|---|---|---|---|
| Pruebas de conocimiento cero | Datos/cálculo subyacentes; solo se revela la validez de la prueba | Matemáticas criptográficas (más configuración confiable en algunos sistemas) | Alto para generar pruebas; bajo para verificarlas | Producción a escala (rollups, pagos blindados) | zkSync, Starknet, Zcash |
| Cifrado totalmente homomórfico | Todos los datos durante el cálculo, incluso frente al proveedor que calcula | Matemáticas criptográficas (basadas en retículas) | Sobrecarga de cómputo muy alta | Producción temprana; investigación activa sobre aceleración de hardware | Zama, Fhenix |
| Computación segura entre múltiples partes | La entrada individual de cada parte | Mayoría honesta/umbral entre participantes | Moderado; añade rondas de comunicación | Madura y ampliamente implantada en custodia | Fireblocks y otros custodios con firmas de umbral |
| Entornos de ejecución confiables | Datos/código frente a todos los demás procesos, incluido el sistema operativo | Proveedor de hardware/firmware (fabricante del chip) | Velocidad cercana a la nativa | En producción, pero con un historial documentado de ataques de canal lateral | Intel SGX, Oasis Sapphire |
| Firmas de anillo y direcciones furtivas | Identidad de quien envía y de quien recibe | Indistinguibilidad estadística de los conjuntos de señuelos | Bajo; eficiente en hardware convencional | Madura, activa desde hace más de una década | Monero |

Ninguna tecnología gana en todos los aspectos; por eso la investigación actual las combina cada vez más, por ejemplo, usando pruebas ZK para verificar la corrección de un cálculo MPC, o TEE junto con FHE para una defensa en profundidad.

---

## Cómo se relaciona esto con los dominios tokenizados

Los [dominios tokenizados](/es/glossary/tokenize/) heredan la misma propiedad de transparencia por defecto que cualquier otro activo en cadena: las transferencias de propiedad, las ofertas y las actualizaciones de metadatos se pueden leer públicamente. En gran medida es una ventaja —la procedencia y el historial de propiedad son precisamente lo que hacen que un [dominio tokenizado](/es/blog/what-are-tokenized-domains/) sea confiable como activo negociable—, pero también implica que las tenencias y los precios de venta de una cartera de dominios son visibles para cualquiera que observe la cadena.

Las tecnologías de privacidad de esta guía apuntan a la dirección que podría tomar la infraestructura de dominios como NFT: la custodia de umbral basada en MPC ya protege [billeteras](/es/glossary/wallet/) institucionales que guardan NFT de dominios del mismo modo que protege otros activos digitales; las pruebas ZK podrían permitir algún día que quien hace una oferta demuestre que puede pagarla sin revelar su saldo completo; y las técnicas de cálculo confidencial podrían permitir que un registrador o mercado verifique reglas de elegibilidad sin exponer la identidad completa de quien compra. Nada de esto está desplegado hoy en la tokenización de dominios, pero las primitivas subyacentes son las mismas que ahora protegen miles de millones de dólares en infraestructura de DeFi y custodia.

---

## Fuentes y lecturas adicionales

- [Pruebas de conocimiento cero — ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)
- [ZK-Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [Resumen de escalado de L2BEAT](https://l2beat.com/scaling/summary)
- [Descripción general de la tecnología de Zcash](https://z.cash/technology/)
- [Introducción al cifrado homomórfico — Zama](https://www.zama.org/introduction-to-homomorphic-encryption)
- [Documentación de cofhe de Fhenix](https://cofhe-docs.fhenix.zone/)
- [Computación segura entre múltiples partes — Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)
- [Qué es MPC — Fireblocks](https://www.fireblocks.com/what-is-mpc)
- [Software Guard Extensions (SGX) — Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)
- [Tecnología de Oasis Protocol](https://oasis.net/technology)
- [Firmas de anillo — Moneropedia de Monero](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)
- [Direcciones furtivas — Moneropedia de Monero](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)
