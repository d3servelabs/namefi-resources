---
title: "Principales tecnologías de privacidad en blockchain: pruebas de conocimiento cero, FHE, MPC, TEE y firmas de anillo"
date: '2026-07-02'
language: es
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
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

![Una persona que prueba entrega a una persona verificadora una insignia luminosa de prueba válida mientras mantiene bajo llave el testigo privado detrás de la espalda, lo que ilustra cómo una prueba de conocimiento cero verifica una afirmación pública sin revelar el secreto](../../assets/blockchain-privacy-technologies-01-zero-knowledge.jpg)

Una [prueba de conocimiento cero](/es/glossary/zero-knowledge-proof/) (ZKP) permite a una parte —quien *prueba*— convencer a otra —quien *verifica*— de que una afirmación pública es verdadera sin revelar el *testigo* privado usado para demostrarla, más allá de lo que ya implican la afirmación y su validez. En una afirmación como «conozco un `x` tal que `H(x) = y`», quien verifica ve normalmente la afirmación y el valor público `y`; el conocimiento cero protege `x`. Las aplicaciones pueden ocultar por separado partes de su entrada pública o vincularlas mediante un compromiso criptográfico, pero ocultar la propia afirmación no forma parte de la definición general de ZKP ([Thaler, *Proofs, Arguments, and Zero-Knowledge*](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html)).

Para que un sistema de pruebas cuente como un protocolo genuino de conocimiento cero debe satisfacer tres propiedades: completitud (una persona verificadora honesta acepta una afirmación verdadera), solidez (quien prueba de forma deshonesta no puede lograr que una persona verificadora honesta acepte una afirmación falsa, salvo con la probabilidad de error acotada del sistema de pruebas) y conocimiento cero propiamente dicho (la prueba no revela conocimiento adicional sobre el testigo privado más allá de lo que se deduce de la afirmación pública). Los protocolos interactivos clásicos suelen usar un compromiso, un desafío de quien verifica y una respuesta de quien prueba. Los SNARK y STARK modernos no interactivos empaquetan los datos de prueba necesarios sin un desafío en directo de quien verifica, pero conservan los mismos objetivos generales de completitud, solidez y conocimiento cero.

**Qué oculta:** el testigo privado, como datos secretos o entradas de un cálculo privado. La afirmación pública y las entradas públicas siguen visibles, salvo que la aplicación las vincule por separado mediante un compromiso o las cifre.

**Cómo se usa hoy:** los ZK-rollups son el mayor uso en producción de las ZKP para escalar blockchain. «Agrupan (o hacen “roll up” de) transacciones en lotes que se ejecutan fuera de cadena» y luego generan una única prueba de validez que Ethereum verifica antes de finalizar los cambios de estado del lote ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20bundle%20)). zkSync Era, creado por Matter Labs, es «un ZK Rollup compatible con EVM... impulsado por su propio zkEVM» ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)), mientras que Starknet, creado por StarkWare, es un rollup de validez que ejecuta su propia VM Cairo en lugar de la EVM (los contratos de Solidity se conectan por separado). L2BEAT registra ambos como rollups protegidos por pruebas de validez, en vez de por la ventana de impugnación de pruebas de fraude que usan los rollups optimistas ([l2beat.com](https://l2beat.com/scaling/summary)). En materia de privacidad, [Zcash](https://z.cash/technology/) fue pionero en los zk-SNARK (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) para transacciones blindadas, donde «las direcciones de los usuarios, el importe de sus transacciones» y otros datos permanecen cifrados mientras la red sigue confirmando que la transacción es válida ([z.cash](https://z.cash/technology/)).

**La contrapartida:** generar una prueba ZK es costoso desde el punto de vista computacional —los circuitos de prueba recorren cada transacción de un lote y repiten sus comprobaciones—, por lo que el tiempo de prueba y el coste de hardware son limitaciones reales, aunque verificar en cadena sea barato y rápido. La seguridad descansa en los supuestos criptográficos del sistema de pruebas, la generación segura de parámetros y la implementación correcta del circuito y el protocolo; en algunos sistemas de prueba también incluye una ceremonia única de configuración confiable. La documentación de Ethereum señala que comprometer la entropía de configuración puede permitir pruebas falsas y que los errores de implementación pueden debilitar el modelo de seguridad ([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/#trust-assumptions)).

---

## Cifrado totalmente homomórfico (FHE)

![Una caja cerrada pasa por una máquina matemática manejada por un servidor en la nube sin llave y sale aún cerrada, pero con un resultado calculado dentro, lo que ilustra un cálculo realizado directamente sobre datos cifrados](../../assets/blockchain-privacy-technologies-02-fhe.jpg)

El [cifrado totalmente homomórfico](/es/glossary/fully-homomorphic-encryption/) adopta otro enfoque: en vez de demostrar un hecho sobre datos ocultos, permite *calcular directamente sobre datos cifrados* y obtener un resultado cifrado que, al descifrarse, equivale a la misma respuesta que se obtendría al calcular sobre texto plano. Zama, una de las empresas líderes en investigación e infraestructura de FHE, lo describe así: «FHE permite procesar datos sin descifrarlos: las empresas prestan servicios sin acceder a los datos de los usuarios, mientras estos disfrutan de una funcionalidad sin cambios» ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**Qué oculta:** las entradas en bruto, el estado intermedio y las salidas de un cálculo; todas las personas salvo quien posee la clave solo ven texto cifrado, incluso la parte que realiza el cálculo.

**Cómo funciona a alto nivel:** los esquemas FHE codifican valores en texto plano como textos cifrados construidos sobre matemáticas basadas en retículas, y después definen equivalentes cifrados de la suma y la multiplicación para que circuitos arbitrarios puedan ejecutarse sobre los textos cifrados. Aplicado a una blockchain, esto significa que un contrato inteligente puede mover tokens o evaluar lógica sin ver nunca los importes implicados; como explica el ejemplo de Zama, «la blockchain comprobó que Alice tenía fondos suficientes sin ver nunca los importes reales» ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption#:~:text=The%20blockchain%20verified%20Alice%20has%20sufficient%20funds%20without%20ever%20seeing%20the%20actual%20amounts)). Zama también indica que los esquemas FHE basados en retículas son «intrínsecamente resistentes a los ataques cuánticos», algo relevante para quienes piensan a largo plazo en el riesgo criptográfico ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**Proyectos de ejemplo:** [Zama](https://www.zama.org/) desarrolla las bibliotecas FHE de código abierto (TFHE-rs, Concrete) y fhEVM, usada para añadir ejecución confidencial de contratos inteligentes a cadenas EVM. [Fhenix](https://cofhe-docs.fhenix.zone/) es una blockchain creada específicamente para que «los desarrolladores construyan contratos inteligentes que preserven la privacidad mediante Fully Homomorphic Encryption», de modo que «los datos sensibles permanezcan cifrados durante todo el cálculo», con una biblioteca JavaScript (Cofhejs) para el cifrado del lado del cliente y una biblioteca FHE de Solidity para operaciones cifradas en cadena ([cofhe-docs.fhenix.zone](https://cofhe-docs.fhenix.zone/)).

**La contrapartida:** la garantía distintiva de FHE es que los cálculos compatibles pueden ejecutarse sin descifrar las entradas ni los valores intermedios, pero su seguridad concreta sigue dependiendo del esquema y de la elección de parámetros; por eso HomomorphicEncryption.org publica tablas de seguridad específicas para cada esquema y directrices para seleccionar parámetros ([HomomorphicEncryption.org](https://homomorphicencryption.org/security-guidelines/)). También es, con gran diferencia, el enfoque más costoso de esta lista desde el punto de vista computacional frente a la ejecución en texto plano. Por eso las cadenas basadas en FHE ejecutan hoy lógica crítica para la confidencialidad en lugar de todas las transacciones, y por eso la aceleración de hardware para FHE es una carrera de investigación activa.

---

## Computación segura entre múltiples partes (MPC)

![Tres personas sostienen cada una una parte de una clave en forma de pieza de rompecabezas, unidas mediante líneas discontinuas en una única transacción firmada, lo que ilustra cómo la computación segura entre múltiples partes produce un resultado conjunto sin que nadie vea el secreto completo](../../assets/blockchain-privacy-technologies-03-mpc.jpg)

La [computación segura entre múltiples partes](/es/glossary/secure-multiparty-computation/) resuelve un problema relacionado pero distinto: en vez de que una parte calcule sobre datos cifrados, *varias* partes que poseen cada una una parte privada de la entrada calculan conjuntamente una función sin revelar sus entradas individuales entre sí. Según la definición formal, MPC es «un subcampo de la criptografía cuyo objetivo es crear métodos para que las partes calculen conjuntamente una función sobre sus entradas y mantengan privadas esas entradas», de modo que, para tres participantes, «Alice, Bob y Charlie todavía pueden aprender F(x, y, z) sin revelar quién gana qué» ([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation#:~:text=Secure%20multi%2Dparty%20computation%20)).

**Qué oculta:** la entrada individual de cada parte frente a todas las demás; solo se revela la salida acordada y ningún participante ve jamás el secreto completo.

**Hipótesis de confianza:** no existe un umbral de corrupción universal para MPC. En el resultado clásico de BGW para una red completa, la privacidad frente a fallos pasivos se mantiene con `t < n/2`, mientras que la robustez frente a fallos bizantinos se mantiene con `t < n/3` ([ACM](https://doi.org/10.1145/62212.62213)). Esos límites describen ese modelo de protocolo, no toda MPC: los protocolos perfectamente seguros pueden alcanzar `t < n/2` cuando se presupone difusión ([TCC 2021](https://www.iacr.org/archive/tcc2021/130420196/130420196.pdf)), mientras que el protocolo SPDZ, basado en seguridad computacional, ofrece seguridad activa con hasta `n - 1` partes corruptas en su modelo de preprocesamiento ([IACR](https://eprint.iacr.org/2011/535)). Esa garantía con mayoría deshonesta es seguridad con aborto —una parte corrupta aún puede detener el cálculo—, no equidad ni salida garantizada ([PoPETs](https://petsymposium.org/popets/2024/popets-2024-0053.php)). Por tanto, una implementación concreta debe indicar el protocolo, el modelo de corrupción pasiva o activa, los supuestos de sincronía, canal y configuración —incluida la difusión— y si presupone una mayoría honesta o deshonesta.

**Cómo se usa hoy: custodia con firmas de umbral:** la aplicación blockchain más visible de MPC consiste en dividir una clave privada entre partes independientes para que ningún dispositivo o persona posea nunca la clave completa. El proveedor de infraestructura de custodia Fireblocks lo describe directamente: «la computación entre múltiples partes (MPC) es un método criptográfico que divide una clave privada en participaciones separadas distribuidas entre varias partes independientes» y, de forma crucial, «la clave completa nunca se reúne en un único lugar, en ningún momento» ([fireblocks.com](https://www.fireblocks.com/what-is-mpc#:~:text=Multi%2Dparty%20computation%20)). Cuando una transacción necesita una firma, un quórum de puntos de conexión valida cada uno la transacción y aporta una firma parcial; «en ningún momento se reúne la clave privada», de modo que «aunque se comprometa un punto de conexión... las participaciones de clave que permanecen en otros lugares no sirven de nada de forma aislada» ([fireblocks.com](https://www.fireblocks.com/what-is-mpc)). Este patrón de firma de umbral sustenta ahora gran parte de la custodia institucional de criptoactivos y muchas billeteras con varios firmantes.

**La contrapartida:** MPC evita el punto único de fallo de una clave privada guardada en un solo dispositivo, pero añade rondas de comunicación entre las partes (latencia) y requiere un diseño de protocolo cuidadoso. Su garantía solo es tan fuerte como los supuestos criptográficos, de corrupción y de red del protocolo elegido y como la independencia operativa de las partes; MPC puede eliminar a un único poseedor de la clave sin eliminar la confianza del diseño del sistema.

---

## Entornos de ejecución confiables (TEE)

Un [entorno de ejecución confiable](/es/glossary/trusted-execution-environment/) adopta otra vía: en lugar de cifrar los datos durante todo el cálculo, lo aísla dentro de una región de un chip protegida por hardware —un *enclave seguro*— que ni siquiera el propio sistema operativo de la máquina puede inspeccionar. SGX (Software Guard Extensions) de Intel, la implementación más conocida, se describe en Wikipedia como «un conjunto de códigos de instrucción que implementan un entorno de ejecución confiable y que están integrados en algunas unidades centrales de procesamiento (CPU) de Intel» ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=Intel%20Software%20Guard%20Extensions)). Desde el punto de vista mecánico, «SGX implica que la CPU cifre una parte de la memoria (el enclave)», de modo que «los datos y el código que se originan en el enclave se descifran sobre la marcha dentro de la CPU, lo que evita que otros códigos los examinen o lean», incluido «código que se ejecuta con niveles de privilegio superiores, como el sistema operativo y los hipervisores subyacentes» ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)).

**Qué oculta:** los datos y el código dentro del enclave frente a todos los demás procesos de la misma máquina, incluido un sistema operativo comprometido; es útil cuando se necesita confiar en la ejecución de una pieza de código concreta sin confiar en el operador del servidor.

**Hipótesis de confianza:** la división no es entre «matemáticas puras» para ZKP, FHE y MPC y confianza exclusiva en el proveedor para un TEE. Los sistemas criptográficos desplegados también dependen de sus supuestos de dificultad declarados, sus parámetros o configuración, implementaciones correctas y —en el caso de MPC— el modelo de participantes y comunicación del protocolo. Un TEE añade aislamiento respaldado por hardware y atestación a ese modelo de confianza. Intel define la base informática de confianza de SGX como el hardware, el firmware de la CPU y el software de la plataforma necesarios para cumplir los objetivos de seguridad de SGX; la atestación permite a una parte que confía evaluar la identidad del enclave y el nivel de parches de la plataforma ([Intel](https://www.intel.com/content/www/us/en/security-center/technical-details/sgx-attestation-technical-details.html)). Ese límite de confianza se ha puesto a prueba: SGX «no protege frente a ataques de canal lateral», y los investigadores han demostrado repetidamente vulneraciones prácticas, desde extraer «claves RSA de enclaves SGX ejecutándose en el mismo sistema en cinco minutos» (2017) hasta el ataque Foreshadow, que «combina ejecución especulativa y desbordamiento de búfer para omitir SGX» (2018), además de vulnerabilidades posteriores como Plundervolt, LVI, SGAxe y ÆPIC Leak ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=While%20this%20can%20mitigate%20many%20kinds%20of%20attacks%2C%20it%20does%20not%20protect%20against%20side%2Dchannel%20attacks)). Este historial explica por qué los TEE suelen describirse como un término medio pragmático y más rápido, no como una garantía criptográfica hermética.

**Proyectos de ejemplo:** la red Sapphire de [Oasis Protocol](https://oasis.net/technology) ejecuta contratos inteligentes dentro de enclaves de hardware para que los usuarios puedan «ejecutar código dentro de enclaves protegidos por hardware», donde «los datos permanecen cifrados incluso frente a los operadores de servidores», mientras que «cada ejecución produce una prueba criptográfica que los usuarios pueden verificar sin confianza ciega». El resultado son «contratos inteligentes confidenciales» que conservan «compatibilidad y composabilidad con EVM» ([oasis.net](https://oasis.net/technology)). Secret Network y varios productos de privacidad vinculados al restaking también se basan en TEE, a menudo combinados con otras técnicas para una defensa en profundidad.

**La contrapartida:** los TEE funcionan cerca de la velocidad nativa —mucho más rápido que FHE o las pruebas ZK pesadas—, lo que los hace atractivos para aplicaciones sensibles a la latencia. Pero esa velocidad conlleva una base informática de confianza más amplia, compuesta por hardware y software, con un historial real y documentado de vulneraciones por canal lateral. Por tanto, la comparación es entre distintos supuestos del sistema, no entre confianza en el hardware y una «criptografía pura» sin supuestos.

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
| Pruebas de conocimiento cero | Testigo/datos privados; la afirmación pública sigue visible salvo que se oculte por separado | Supuestos y parámetros del sistema de pruebas e implementación del circuito/protocolo; configuración confiable en algunos sistemas | Alto para generar pruebas; bajo para verificarlas | Producción a escala (rollups, pagos blindados) | zkSync, Starknet, Zcash |
| Cifrado totalmente homomórfico | Todos los datos durante el cálculo, incluso frente al proveedor que calcula | Supuestos de dificultad del esquema y elección segura de parámetros e implementación | Sobrecarga de cómputo muy alta | Producción temprana; investigación activa sobre aceleración de hardware | Zama, Fhenix |
| Computación segura entre múltiples partes | La entrada individual de cada parte | Umbral de corrupción específico del protocolo, modelo de red/configuración e independencia de los participantes | Moderado; añade rondas de comunicación | Madura y ampliamente implantada en custodia | Fireblocks y otros custodios con firmas de umbral |
| Entornos de ejecución confiables | Datos/código frente a todos los demás procesos, incluido el sistema operativo | Código de enclave atestado, más la base informática de confianza de hardware, firmware y software y su nivel de parches | Velocidad cercana a la nativa | En producción, pero con un historial documentado de ataques de canal lateral | Intel SGX, Oasis Sapphire |
| Firmas de anillo y direcciones furtivas | Identidad de quien envía y de quien recibe | Indistinguibilidad estadística de los conjuntos de señuelos | Bajo; eficiente en hardware convencional | Madura, activa desde hace más de una década | Monero |

Ninguna tecnología gana en todos los aspectos; por eso la investigación actual las combina cada vez más, por ejemplo, usando pruebas ZK para verificar la corrección de un cálculo MPC, o TEE junto con FHE para una defensa en profundidad.

---

## Cómo se relaciona esto con los dominios tokenizados

Los [dominios tokenizados](/es/glossary/tokenize/) heredan la misma propiedad de transparencia por defecto que cualquier otro activo en cadena: las transferencias de propiedad, las ofertas y las actualizaciones de metadatos se pueden leer públicamente. En gran medida es una ventaja —la procedencia y el historial de propiedad son precisamente lo que hacen que un [dominio tokenizado](/es/blog/what-are-tokenized-domains/) sea confiable como activo negociable—, pero también implica que las tenencias y los precios de venta de una cartera de dominios son visibles para cualquiera que observe la cadena.

Las tecnologías de privacidad de esta guía apuntan a la dirección que podría tomar la infraestructura de dominios como NFT: la custodia de umbral basada en MPC ya protege [billeteras](/es/glossary/wallet/) institucionales que guardan NFT de dominios del mismo modo que protege otros activos digitales; las pruebas ZK podrían permitir algún día que quien hace una oferta demuestre que puede pagarla sin revelar su saldo completo; y las técnicas de cálculo confidencial podrían permitir que un registrador o mercado verifique reglas de elegibilidad sin exponer la identidad completa de quien compra. Nada de esto está desplegado hoy en la tokenización de dominios, pero las primitivas subyacentes son las mismas que ahora protegen miles de millones de dólares en infraestructura de DeFi y custodia.

---

## Fuentes y lecturas adicionales

- [Pruebas de conocimiento cero — ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)
- [Pruebas, argumentos y conocimiento cero — Justin Thaler](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html)
- [ZK-Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [Resumen de escalado de L2BEAT](https://l2beat.com/scaling/summary)
- [Descripción general de la tecnología de Zcash](https://z.cash/technology/)
- [Introducción al cifrado homomórfico — Zama](https://www.zama.org/introduction-to-homomorphic-encryption)
- [Directrices de seguridad — HomomorphicEncryption.org](https://homomorphicencryption.org/security-guidelines/)
- [Documentación de cofhe de Fhenix](https://cofhe-docs.fhenix.zone/)
- [Computación segura entre múltiples partes — Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)
- [Teoremas de completitud para computación distribuida no criptográfica tolerante a fallos — ACM](https://doi.org/10.1145/62212.62213)
- [Computación perfectamente segura y eficiente — TCC 2021](https://www.iacr.org/archive/tcc2021/130420196/130420196.pdf)
- [Computación entre múltiples partes a partir de cifrado parcialmente homomórfico (SPDZ) — IACR](https://eprint.iacr.org/2011/535)
- [Ampliación de la seguridad de SPDZ con equidad — PoPETs](https://petsymposium.org/popets/2024/popets-2024-0053.php)
- [Qué es MPC — Fireblocks](https://www.fireblocks.com/what-is-mpc)
- [Software Guard Extensions (SGX) — Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)
- [Detalles técnicos de atestación de Intel SGX](https://www.intel.com/content/www/us/en/security-center/technical-details/sgx-attestation-technical-details.html)
- [Tecnología de Oasis Protocol](https://oasis.net/technology)
- [Firmas de anillo — Moneropedia de Monero](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)
- [Direcciones furtivas — Moneropedia de Monero](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)
