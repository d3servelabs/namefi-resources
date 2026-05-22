---
title: 'Zero-Knowledge Perfecto vs. Computacional: Qué significa realmente la distinción'
date: '2026-05-13'
language: es
tags: ['cryptography', 'zero-knowledge', 'zk-snark', 'theory']
authors: ['namefiteam']
draft: false
description: 'Las pruebas de conocimiento cero vienen en tres variantes: perfectas, estadísticas y computacionales, y la diferencia importa más de lo que admiten la mayoría de las discusiones de ingeniería. Esta publicación explica cada una en lenguaje sencillo, por qué casi todos los sistemas ZK en producción en 2026 son computacionales, y qué ventajas y costos conlleva.'
ogImage: ../../assets/perfect-vs-computational-zero-knowledge-og.jpg
keywords: ['prueba de conocimiento cero', 'conocimiento cero perfecto', 'conocimiento cero computacional', 'zk snark', 'zk stark', 'criptografía', 'simulador', 'esquema de compromiso', 'namefi']
---

Cuando la gente en el mundo de las criptomonedas habla de "pruebas de conocimiento cero" (zero-knowledge proofs), casi siempre se refieren a una cosa específica: un SNARK o STARK que prueba que algún cálculo se realizó correctamente, sin revelar las entradas (inputs). Ese modelo mental está bien para la mayoría de las conversaciones de ingeniería. Sin embargo, oculta una distinción que se vuelve importante en el momento en que intentas razonar sobre *lo que realmente garantiza la seguridad*.

Las pruebas de conocimiento cero vienen en tres variantes formales (conocimiento cero **perfecto**, **estadístico** y **computacional**) y difieren en *lo que el verificador podría llegar a aprender incluso con recursos ilimitados*. El sistema que lanzas a producción es casi con certeza computacional. Vale la pena saber por qué y qué ventajas ofrece.

## La forma de una prueba de conocimiento cero

La configuración clásica: un *probador* (prover) quiere convencer a un *verificador* (verifier) de que una afirmación es verdadera, sin que el verificador aprenda nada más. "Verdadero" aquí significa algo como "Conozco un `x` tal que `H(x) = y`" o "Conozco un camino en este grafo" o "Ejecuté este programa correctamente con entradas privadas".

Un sistema de prueba es de **conocimiento cero** cuando, informalmente, *el verificador podría haber generado la prueba por su cuenta sin el secreto*. Formalmente, esto se captura mediante la existencia de un **simulador**: un algoritmo de tiempo polinomial que, dada solo la declaración pública (sin el testigo o *witness*), produce una transcripción que parece indistinguible de una transcripción de prueba real.

Las tres variantes del conocimiento cero difieren en lo que significa "parece indistinguible".

### Conocimiento cero perfecto

La salida del simulador está **idénticamente distribuida** a una prueba real. No hay prueba estadística, ni prueba que pudieras ejecutar con una computadora cuántica, ni prueba que pudieras ejecutar en 10^100 años, que distinga al simulador del probador real. Matemáticamente, las dos distribuciones son la *misma*.

Este es el estándar de oro. Significa que incluso un adversario ilimitado (sin límite de tiempo, sin suposiciones computacionales) no aprende nada de la prueba.

### Conocimiento cero estadístico

La salida del simulador es **estadísticamente cercana** a una prueba real. La distancia de variación total entre las dos distribuciones es insignificante. Un adversario ilimitado podría, en principio, aprender algo, pero la cantidad que podría aprender disminuye exponencialmente con el parámetro de seguridad.

Para todos los propósitos prácticos, el ZK estadístico es tan bueno como el ZK perfecto. El simulador simplemente no tiene que coincidir exactamente con la distribución real; tiene que coincidir lo suficientemente cerca como para que ninguna cantidad de computación pueda amplificar la brecha.

### Conocimiento cero computacional

La salida del simulador es **computacionalmente indistinguible** de una prueba real: ningún algoritmo de *tiempo polinomial* puede diferenciarlos. Un adversario ilimitado (alguien con la capacidad de usar fuerza bruta en la función hash subyacente o resolver el problema difícil subyacente) bien podría ser capaz de distinguirlos y podría aprender el testigo (*witness*).

Este es el más débil de los tres, en el sentido formal, y es el que casi todos los sistemas modernos ofrecen en realidad.

## Por qué casi todos los sistemas ZK en producción son computacionales

Hay un teorema que se esconde detrás de esto: **para los lenguajes NP-completos, es poco probable que exista el conocimiento cero perfecto** a menos que la jerarquía polinomial colapse ([Goldreich y Krawczyk, 1996](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf)). En otras palabras, si deseas probar declaraciones *arbitrarias* en conocimiento cero (declaraciones tan expresivas como "ejecuté este programa correctamente"), no puedes tener conocimiento cero perfecto sin hacer que la prueba en sí dependa de suposiciones de complejidad no probadas.

Lo que *sí puedes* tener para declaraciones NP arbitrarias:

- **Pruebas de conocimiento cero computacionales**, que existen si existen las funciones unidireccionales (*one-way functions*). ([Goldreich, Micali, Wigderson 1991](https://dl.acm.org/doi/10.1145/116825.116852).)
- **Conocimiento cero estadístico para clases limitadas** de declaraciones (problemas aleatorios auto-reducibles, isomorfismo de grafos), pero no para NP general.

Así que cuando un sistema real (Groth16, PLONK, Halo2, STARK, Bulletproofs) dice que es de "conocimiento cero", virtualmente siempre significa conocimiento cero *computacional*. La prueba no revela nada a un verificador de tiempo polinomial, condicionado a suposiciones sobre curvas elípticas, funciones hash u otras primitivas criptográficas.

Si esas suposiciones se rompen (digamos, un algoritmo futuro rompe el problema del logaritmo discreto en una curva de la que depende un esquema), el argumento de conocimiento cero puede debilitarse retroactivamente. Exactamente qué se vuelve posible depende de la construcción: un atacante podría ser capaz de distinguir las transcripciones reales de las simuladas, falsificar pruebas o extraer información que antes estaba protegida. No debes asumir que las antiguas transcripciones de ZK computacional conservan el mismo margen de privacidad después de que fallan sus suposiciones subyacentes.

## Un ejemplo práctico: esquemas de compromiso

Los esquemas de compromiso (*commitment schemes*) hacen que la distinción sea concreta.

Un compromiso es, a grandes rasgos: "Encierro un valor `v` en un sobre sellado `c`, te entrego el sobre y revelo `v` más tarde. Puedes verificar que revelé el valor original, pero no puedes echar un vistazo a `v` antes de que lo revele".

Dos propiedades de seguridad:

- **Ocultamiento (Hiding)** — el sobre no revela nada sobre `v`.
- **Vinculación (Binding)** — no puedo abrir el sobre con un valor diferente al que me comprometí originalmente.

No puedes tener ambas de forma perfecta. Un compromiso que oculta perfectamente es computacionalmente vinculante (con suficiente cálculo, un atacante puede encontrar una segunda forma de abrirlo). Un compromiso perfectamente vinculante es computacionalmente oculto (con suficiente cálculo, un atacante puede extraer el valor comprometido).

Los [compromisos de Pedersen](https://link.springer.com/chapter/10.1007/3-540-46766-1_9) son perfectamente ocultos y computacionalmente vinculantes: no revelan *nada* sobre el valor comprometido ni siquiera ante un atacante ilimitado, pero una ruptura futura del logaritmo discreto te permite engañar en la vinculación. Los compromisos basados en hash (`c = H(v || r)`) son computacionalmente ocultos y (cuando el hash es resistente a colisiones) computacionalmente vinculantes.

Qué variante deseas depende de qué propiedad se permite que se debilite con el tiempo. Para la privacidad a largo plazo de un voto o una oferta, generalmente deseas un ocultamiento perfecto incluso si la vinculación es solo computacional, porque puedes volver a probar la vinculación antes de que se rompa la suposición del logaritmo discreto, pero no puedes volver a revelar u ocultar retroactivamente un voto que ya se filtró.

## Por qué esto importa para los ZK rollups y los sistemas L2

La mayoría de los ZK rollups usan SNARKs con conocimiento cero computacional. Las implicaciones prácticas:

- **Hoy**, las pruebas no revelan nada a ningún atacante factible. La garantía de privacidad es fuerte.
- **A largo plazo**, las pruebas revelan lo que sea que la suposición subyacente proteja. Si un rollup usa un SNARK cuya seguridad descansa en el logaritmo discreto de BN254, y BN254 se rompe en 2050, cada prueba publicada antes de esa fecha se vuelve potencialmente vulnerable y desocultable.
- **Las consideraciones poscuánticas** importan: los SNARK basados en logaritmo discreto (Groth16, PLONK sobre curvas de emparejamiento estándar) *no* son seguros a nivel poscuántico. Los STARK, que dependen solo de la resistencia a colisiones de hash, sí lo son. ([StarkWare](https://eprint.iacr.org/2018/046.pdf), el artículo que estableció el acrónimo STARK).
- **El ZK estadístico o perfecto** es posible en entornos restringidos (por ejemplo, probar ciertas relaciones algebraicas) y a veces se usa cuando el presupuesto de privacidad a largo plazo importa más que la expresividad.

Para aplicaciones como votaciones anónimas, canales de denunciantes (whistleblowers) y otros sistemas donde las transcripciones pueden archivarse durante décadas, la elección entre ZK computacional y estadístico no es pedantería. Es la diferencia entre la privacidad que se mantiene frente al adversario de mañana y la privacidad que se mantiene frente a cualquier adversario.

## Un árbol de decisiones simple

Si estás eligiendo un sistema ZK para producción:

- **Privacidad solo para el verificador, datos de corta duración, el rendimiento es lo más importante:** el ZK computacional de un SNARK o STARK probado en batalla está bien. Esta es la realidad de la mayoría de los rollups, ZK-KYC y ZK-login.
- **Privacidad a largo plazo, sensibilidad legal/auditoría:** prefiere un sistema basado en hash (STARK) o un compromiso de estilo Pedersen por debajo. Documenta la suposición.
- **Privacidad demostrable independientemente de las suposiciones computacionales:** estás buscando ZK perfecto o estadístico en una clase de declaraciones restringida. Espera renunciar a algo de expresividad o interactividad.

Nada es gratis. Las variantes de ZK implican compromisos (*trade-offs*) entre sí y en relación con la eficiencia. La pregunta es *qué compromiso haces de forma consciente*.

## Cómo Namefi aborda esto

En los flujos de propiedad de dominios, el uso más interesante de ZK es demostrar que eres dueño de un nombre sin revelar *qué* nombre es. Las pruebas de propiedad frente a un registro en cadena (*on-chain*) se pueden hacer con ZK computacional utilizando herramientas muy maduras (Groth16, PLONK), y es sobre esto en lo que se ejecutan los sistemas de producción hoy en día. Para flujos más sensibles (por ejemplo, probar que un dominio pertenece a un *conjunto* de entidades de confianza sin revelar a cuál), los esquemas de ZK estadísticos o perfectos sobre declaraciones restringidas pueden volverse relevantes. El punto de esta publicación es hacer que el compromiso (*trade-off*) sea claro: elige lo que realmente necesitas y deja por escrito las suposiciones que estás asumiendo.

## Fuentes y lecturas adicionales

- Goldreich, Micali, Wigderson — [Proofs that yield nothing but their validity (J. ACM 1991)](https://dl.acm.org/doi/10.1145/116825.116852).
- Goldreich y Krawczyk — [On the composition of zero-knowledge proof systems (1996)](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf).
- Pedersen — [Non-interactive and information-theoretic secure verifiable secret sharing (1991)](https://link.springer.com/chapter/10.1007/3-540-46766-1_9).
- Ben-Sasson, Bentov, Horesh, Riabzev — [Scalable, transparent, and post-quantum secure computational integrity (STARK paper, 2018)](https://eprint.iacr.org/2018/046.pdf).
- a16z crypto — ["Proofs, Arguments, and Zero-Knowledge" de Justin Thaler](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html), el libro de texto moderno canónico.