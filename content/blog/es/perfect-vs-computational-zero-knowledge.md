---
title: 'Zero-knowledge perfecto vs. computacional: Qué significa realmente la distinción'
date: '2026-05-13'
language: es
tags: ['cryptography', 'zero-knowledge', 'zk-snark', 'theory']
authors: ['namefiteam']
draft: false
description: 'Las pruebas de conocimiento cero vienen en tres variantes: perfectas, estadísticas y computacionales, y la diferencia importa más de lo que admiten la mayoría de las discusiones de ingeniería. Esta publicación explica cada una en un lenguaje sencillo, por qué casi todos los sistemas ZK de producción en 2026 son computacionales, y lo que esto aporta y cuesta.'
ogImage: ../../assets/perfect-vs-computational-zero-knowledge-og.jpg
keywords: ['prueba de conocimiento cero', 'conocimiento cero perfecto', 'conocimiento cero computacional', 'zk snark', 'zk stark', 'criptografía', 'simulador', 'esquema de compromiso', 'namefi']
---

Cuando las personas en el mundo cripto hablan de "pruebas de conocimiento cero" (zero-knowledge proofs), casi siempre se refieren a una cosa específica: un SNARK o STARK que prueba que algún cálculo se realizó correctamente, sin revelar los datos de entrada (inputs). Ese modelo mental está bien para la mayoría de las conversaciones de ingeniería. Oculta una distinción que se vuelve importante en el momento en que intentas razonar sobre *lo que la seguridad realmente garantiza*.

Las pruebas de conocimiento cero vienen en tres variantes formales (conocimiento cero **perfecto**, **estadístico** y **computacional**) y difieren en *lo que el verificador podría llegar a aprender incluso con recursos ilimitados*. El sistema que se implementa es casi con toda seguridad computacional. Vale la pena saber por qué y qué ventajas ofrece.

## La forma de una prueba de conocimiento cero

La configuración clásica: un *probador* (prover) quiere convencer a un *verificador* (verifier) de que una afirmación es verdadera, sin que el verificador aprenda nada más. "Verdadera" aquí significa algo como "Conozco un `x` tal que `H(x) = y`" o "Conozco un camino en este grafo" o "Ejecuté este programa correctamente con datos de entrada privados".

Un sistema de prueba es de **conocimiento cero** cuando, de manera informal, *el verificador podría haber generado la prueba por su cuenta sin el secreto*. Formalmente, esto se captura mediante la existencia de un **simulador**: un algoritmo de tiempo polinómico que, dada solo la declaración pública (sin testigo o *witness*), produce una transcripción que parece indistinguible de una transcripción de prueba real.

Las tres variantes de conocimiento cero difieren en lo que significa "parece indistinguible".

### Conocimiento cero perfecto

La salida del simulador está **distribuida de manera idéntica** a una prueba real. No existe ninguna prueba estadística, ni prueba que puedas ejecutar con un ordenador cuántico, ni prueba que puedas ejecutar en 10^100 años, que distinga al simulador del probador real. Matemáticamente, las dos distribuciones son la *misma*.

Este es el estándar de oro. Significa que: incluso un adversario sin límites (sin límite de tiempo, sin suposiciones computacionales) no aprende nada de la prueba.

### Conocimiento cero estadístico

La salida del simulador es **estadísticamente cercana** a una prueba real. La distancia de variación total entre las dos distribuciones es insignificante. Un adversario sin límites podría, en principio, aprender algo, pero la cantidad que podría aprender disminuye exponencialmente con el parámetro de seguridad.

Para todos los propósitos prácticos, el ZK estadístico es tan bueno como el ZK perfecto. Simplemente, el simulador no tiene que igualar la distribución real con exactitud; tiene que igualarla lo suficientemente cerca como para que ninguna cantidad de computación pueda amplificar la brecha.

### Conocimiento cero computacional

La salida del simulador es **computacionalmente indistinguible** de una prueba real: ningún algoritmo de *tiempo polinómico* puede diferenciarlos. Un adversario sin límites (alguien con la capacidad de usar la fuerza bruta en la función hash subyacente o resolver el problema difícil subyacente) podría muy bien ser capaz de distinguirlos y podría aprender el testigo (*witness*).

Esta es la más débil de las tres, en el sentido formal, y es la que ofrecen casi todos los sistemas modernos en la actualidad.

## Por qué casi todos los sistemas ZK de producción son computacionales

Hay un teorema que se esconde detrás de esto: **para los lenguajes NP-completos, es poco probable que exista el conocimiento cero perfecto** a menos que la jerarquía polinómica colapse ([Goldreich y Krawczyk, 1996](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf)). En otras palabras, si deseas probar declaraciones *arbitrarias* en conocimiento cero (declaraciones tan expresivas como "Ejecuté este programa correctamente"), no puedes tener conocimiento cero perfecto sin hacer que la prueba misma dependa de suposiciones de complejidad no probadas.

Lo que *puedes* tener para declaraciones NP arbitrarias es:

- **Pruebas de conocimiento cero computacional**, que existen si existen las funciones unidireccionales (*one-way functions*). ([Goldreich, Micali, Wigderson 1991](https://dl.acm.org/doi/10.1145/116825.116852).)
- **Conocimiento cero estadístico para clases limitadas** de declaraciones (problemas autorreducibles aleatorios, isomorfismo de grafos), pero no para NP en general.

Por lo tanto, cuando un sistema real (Groth16, PLONK, Halo2, STARK, Bulletproofs) dice que es de "conocimiento cero", casi siempre significa conocimiento cero *computacional*. La prueba no revela nada a un verificador de tiempo polinómico, condicionado a suposiciones sobre curvas elípticas, funciones hash u otras primitivas criptográficas.

Si esas suposiciones se rompen (por ejemplo, un algoritmo futuro rompe el problema del logaritmo discreto en una curva en la que se basa un esquema), el argumento del conocimiento cero puede debilitarse retroactivamente. Exactamente qué se hace posible depende de la construcción: un atacante podría distinguir las transcripciones reales de las simuladas, falsificar pruebas o extraer información que anteriormente estaba protegida. No debes asumir que las antiguas transcripciones de ZK computacional conservan el mismo margen de privacidad una vez que sus suposiciones subyacentes fallan.

## Un ejemplo práctico: los esquemas de compromiso

Los esquemas de compromiso (*commitment schemes*) hacen que la distinción sea concreta.

Un compromiso es, a grandes rasgos: "Guardo un valor `v` en un sobre sellado `c`, te entrego el sobre y revelo `v` más tarde. Puedes verificar que revelé el valor original, pero no puedes mirar `v` antes de que lo revele".

Dos propiedades de seguridad:

- **Ocultamiento (Hiding)** — el sobre no revela nada sobre `v`.
- **Vinculación (Binding)** — no puedo abrir el sobre con un valor distinto al que comprometí originalmente.

No se pueden tener ambas propiedades a la perfección. Un compromiso perfectamente oculto es computacionalmente vinculante (con suficiente computación, un atacante puede encontrar una segunda apertura). Un compromiso perfectamente vinculante es computacionalmente oculto (con suficiente computación, un atacante puede extraer el valor comprometido).

Los [compromisos de Pedersen](https://link.springer.com/chapter/10.1007/3-540-46766-1_9) son perfectamente ocultos y computacionalmente vinculantes: no revelan *nada* sobre el valor comprometido incluso a un atacante sin límites, pero una futura ruptura del logaritmo discreto permite engañar a la vinculación. Los compromisos basados en hash (`c = H(v || r)`) son computacionalmente ocultos y (cuando el hash es resistente a colisiones) computacionalmente vinculantes.

La variante que necesites depende de qué propiedad se permite que se debilite con el tiempo. Para la privacidad a largo plazo de un voto o una oferta, generalmente deseas un ocultamiento perfecto incluso si la vinculación es solo computacional, porque puedes volver a probar la vinculación antes de que se rompa la suposición del logaritmo discreto, pero no puedes revelar o descegar (*unblind*) retroactivamente un voto filtrado.

## Por qué esto es importante para los ZK rollups y los sistemas L2

La mayoría de los ZK rollups utilizan SNARKs con conocimiento cero computacional. Las implicaciones prácticas son:

- **En la actualidad**, las pruebas no revelan nada a ningún atacante factible. La garantía de privacidad es sólida.
- **A largo plazo**, las pruebas revelan lo que la suposición subyacente proteja. Si un rollup utiliza un SNARK cuya seguridad recae en el logaritmo discreto BN254, y BN254 se rompe en 2050, todas las pruebas publicadas antes de ese momento se vuelven potencialmente revelables.
- **Las consideraciones poscuánticas** importan: los SNARK basados en logaritmos discretos (Groth16, PLONK sobre curvas de emparejamiento estándar) *no* son seguros a nivel poscuántico. Los STARK, que se basan únicamente en la resistencia a la colisión de hash, sí lo son. ([StarkWare](https://eprint.iacr.org/2018/046.pdf), el artículo que estableció el acrónimo STARK).
- **El ZK estadístico o perfecto** es posible en entornos restringidos (por ejemplo, para probar ciertas relaciones algebraicas) y en ocasiones se usa cuando el presupuesto de privacidad a largo plazo importa más que la expresividad.

Para aplicaciones como votaciones anónimas, canales de denunciantes (*whistleblowers*) y otros sistemas donde las transcripciones pueden ser archivadas durante décadas, la elección entre ZK computacional y estadístico no es un asunto menor. Es la diferencia entre la privacidad que resiste al adversario del mañana y la privacidad que resiste a cualquier adversario.

## Un árbol de decisión simple

Si estás eligiendo un sistema ZK para producción:

- **Privacidad exclusiva para el verificador, datos de corta duración y el rendimiento es lo que más importa:** el ZK computacional de un SNARK o STARK probado en batalla (*battle-tested*) está bien. Así es la mayoría de los rollups, ZK-KYC y ZK-login.
- **Privacidad a largo plazo, sensibilidad de auditoría/legal:** prefiere un sistema basado en hash (STARK) o un compromiso estilo Pedersen debajo. Documenta la suposición.
- **Privacidad comprobable independientemente de las suposiciones computacionales:** estás buscando un ZK perfecto o estadístico en una clase de declaración restringida. Espera sacrificar algo de expresividad o interactividad.

Nada es gratis. Las diferentes variantes de ZK tienen compensaciones (*trade-offs*) entre sí y en comparación con la eficiencia. La pregunta es *qué compensación asumes de manera consciente*.

## Cómo Namefi piensa sobre esto

En los flujos de propiedad de dominios, el uso más interesante de ZK es probar que posees un nombre sin revelar *qué* nombre. Las pruebas de propiedad contra un [registro](/es/glossary/registry/) [on-chain](/es/glossary/on-chain/) se pueden realizar mediante ZK computacional con herramientas muy maduras (Groth16, PLONK), y en eso es en lo que se basan los sistemas de producción en la actualidad. Para flujos más sensibles (digamos, probar que un dominio pertenece a un *conjunto* de entidades de confianza sin revelar a cuál de ellas), los esquemas de ZK perfectos o estadísticos en declaraciones restringidas podrían volverse relevantes. El propósito de esta publicación es hacer que la compensación sea comprensible: elige lo que realmente necesitas y deja por escrito las suposiciones que estás asumiendo.

## Fuentes y lecturas adicionales

- Goldreich, Micali, Wigderson — [Proofs that yield nothing but their validity (J. ACM 1991)](https://dl.acm.org/doi/10.1145/116825.116852).
- Goldreich y Krawczyk — [On the composition of zero-knowledge proof systems (1996)](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf).
- Pedersen — [Non-interactive and information-theoretic secure verifiable secret sharing (1991)](https://link.springer.com/chapter/10.1007/3-540-46766-1_9).
- Ben-Sasson, Bentov, Horesh, Riabzev — [Scalable, transparent, and post-quantum secure computational integrity (STARK paper, 2018)](https://eprint.iacr.org/2018/046.pdf).
- a16z crypto — [Justin Thaler's "Proofs, Arguments, and Zero-Knowledge"](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html), el libro de texto moderno canónico.