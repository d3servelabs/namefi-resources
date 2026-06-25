---
title: "Qué es una cuenta escrow y cómo funciona en la compraventa de dominios"
date: '2026-06-10'
language: es
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Una guía en lenguaje sencillo sobre el escrow y el escrow de dominios: qué es una cuenta escrow, qué significa escrow, cómo funciona paso a paso en la venta de un dominio, por qué importa para evitar fraudes, los servicios de escrow tradicionales frente al enfoque moderno, y cómo los contratos inteligentes pueden reemplazar el escrow con liquidación atómica en cadena."
keywords: ['cuenta escrow', 'que es una cuenta escrow', 'qué es una cuenta escrow', 'cuenta de depósito escrow', 'escrow significado', 'cuenta de escrow', 'qué es escrow', 'que es escrow', 'cuentas escrow', 'depósito en garantía', 'cómo funciona el escrow', 'escrow de dominios', 'servicio de escrow', 'comprar un dominio de forma segura', 'vender un dominio de forma segura', 'código de autorización', 'transferencia de dominio', 'comisiones de escrow', 'evitar fraude en dominios', 'escrow significa', 'cuenta de depósito en garantía', 'contrato inteligente escrow', 'liquidación atómica', 'dominio tokenizado']
---

Si alguna vez has comprado o vendido algo caro entre desconocidos — un coche, una casa, un `.com` de cinco cifras — te has topado con el mismo problema: el comprador no quiere pagar antes de recibir la cosa, y el vendedor no quiere entregar la cosa antes de recibir el pago. Alguien tiene que ir primero, e ir primero significa confiar en la otra persona.

El **[escrow](/es/glossary/escrow/)** (también llamado **depósito en garantía**) es la solución estándar a ese problema. Esta guía explica, en lenguaje sencillo, qué es una cuenta escrow, qué significa escrow, cómo funciona paso a paso en la venta de un dominio, por qué importa, y cómo un enfoque más reciente — los [dominios tokenizados](/es/blog/what-are-tokenized-domains/) y los contratos inteligentes — está empezando a reemplazar por completo al escrow tradicional.

---

## ¿Qué es una cuenta escrow? (en lenguaje sencillo)

Una **cuenta escrow** (o **cuenta de depósito en garantía**) es una cuenta neutral, controlada por un tercero de confianza, que se ubica en el medio de una transacción. En lugar de pagarle directamente al vendedor, el comprador le paga *al escrow*. El escrow retiene el dinero — y a veces también el activo — hasta que ambas partes han cumplido con su parte. Solo entonces el escrow libera los fondos al vendedor.

La palabra clave es **neutral**. El proveedor de escrow no tiene ningún interés en si el trato se cierra o no. Su único trabajo es seguir una regla muy simple:

> Retén el dinero. Libéralo al vendedor únicamente cuando se cumplan las condiciones acordadas. De lo contrario, devuélveselo al comprador.

Esa es toda la idea. El escrow no hace que ninguna de las partes sea más honesta — elimina la necesidad de que confíen entre sí, al insertar un árbitro al que se le paga por ser imparcial. Verás cuentas escrow en bienes raíces, en fusiones y adquisiciones, en plataformas de trabajo freelance y, muy comúnmente, en el sector de los dominios.

En resumen, el **escrow significa** literalmente "depósito en garantía": un tercero guarda el valor en custodia hasta que se cumplan las reglas del trato.

---

## Cómo funciona el escrow paso a paso en la venta de un dominio

Este es el flujo clásico para vender un nombre de dominio a través de un servicio de escrow como [Escrow.com](https://www.escrow.com/):

1. **Acordar los términos.** Comprador y vendedor fijan un precio y deciden quién paga la comisión del escrow. Abren una transacción en el servicio de escrow.
2. **El comprador deposita en la cuenta escrow.** El comprador envía el monto acordado a la cuenta escrow — por transferencia bancaria, tarjeta o cripto. Es clave entender que el vendedor *todavía no* tiene ese dinero; el escrow solo lo está reteniendo.
3. **El escrow confirma los fondos.** El servicio de escrow verifica que el pago se haya acreditado y le avisa al vendedor: *"El dinero ya está aquí. Puedes transferir el dominio con seguridad."*
4. **El vendedor transfiere el dominio.** El vendedor desbloquea el dominio en su [registrador](/es/glossary/registrar/) y proporciona el [código de autorización](/es/glossary/auth-code/) (también llamado código EPP) — una contraseña que autoriza mover el dominio a otro registrador.
5. **El comprador inicia la transferencia.** Con ese código de autorización, el comprador inicia la transferencia hacia su propio registrador. Una [transferencia entre registradores](/es/glossary/cross-registrar-transfer/) de la [ICANN](https://www.icann.org/) suele tardar entre cinco y siete días en completarse por completo.
6. **El comprador confirma la recepción.** Una vez que el dominio aparece en la cuenta del comprador, este lo confirma a través del servicio de escrow.
7. **El escrow libera los fondos.** Ahora — y solo ahora — el escrow le paga al vendedor. El trato queda cerrado.
8. **Se descuentan las comisiones.** Los servicios de escrow normalmente cobran un porcentaje (a menudo de un dígito bajo), y además puede haber comisiones del [mercado](/es/glossary/marketplace/).

Fíjate en lo que logra el escrow: rompe el punto muerto. El vendedor transfiere el dominio *sabiendo que el dinero ya existe* en la cuenta escrow, y el comprador paga *sabiendo que recuperará su dinero* si el dominio nunca llega. Ninguna de las partes tiene que confiar en la otra — ambas confían en el árbitro.

---

## Por qué importa el escrow: se trata de evitar el fraude

Los dominios son un objetivo favorito del fraude precisamente porque son valiosos, intangibles y se mueven entre partes anónimas en todo el mundo. Sin escrow, la venta de un dominio está llena de formas de salir estafado:

- **El comprador paga y el dominio nunca llega.** El vendedor recibe la transferencia y desaparece.
- **El vendedor transfiere y el pago nunca llega.** O el comprador revierte el cargo después de recibir el dominio (un contracargo).
- **El "dominio" nunca fue del vendedor para venderlo.** Personas que en realidad no son dueñas listan dominios robados o secuestrados.

El escrow neutraliza los dos primeros casos de forma directa: el dinero y el activo no pueden desaparecer a la vez, porque el escrow retiene uno hasta que el otro se confirma. Los servicios de escrow serios también añaden verificaciones de identidad y de pago que atrapan parte del tercer caso. Para cualquier venta de dominio relevante entre personas que no se conocen, **el escrow es la expectativa mínima** — negarse a usarlo es, en sí mismo, una señal de alerta.

Para profundizar en el panorama de amenazas, consulta [cómo ocurre realmente el secuestro de dominios](/es/blog/how-domain-hijacking-actually-happens/).

---

## Servicios de escrow de dominios tradicionales: las contrapartidas

El modelo de escrow ha sido el estándar en los dominios durante dos décadas, y funciona. Pero tiene costos reales:

- **Comisiones.** Un porcentaje del precio de venta se lo lleva el servicio de escrow — dinero que sale del trato.
- **Tiempo.** Entre el depósito, la transferencia del registrador y la ventana de la [ICANN](/es/glossary/icann/), una venta puede tardar una semana o más.
- **Pasos manuales.** Códigos de autorización, desbloqueos, confirmaciones de transferencia — cada uno es una oportunidad para un error o un retraso.
- **Sigues confiando en un tercero.** El escrow traslada la confianza de "la otra persona" a "la empresa de escrow". Eso es una gran mejora, pero no es confianza cero. La empresa de escrow retiene tu dinero durante todo el trato.

Estas contrapartidas eran simplemente el precio de la seguridad — hasta que llegó un modelo de liquidación distinto.

---

## Cómo los dominios tokenizados + los contratos inteligentes reemplazan el escrow

Cuando un dominio está [tokenizado](/es/blog/what-are-tokenized-domains/), la propiedad se representa mediante un token [en cadena](/es/glossary/on-chain/) (un NFT) y no solo mediante una entrada en la base de datos de un registrador. Eso cambia lo que es posible en el momento de la liquidación.

Un [contrato inteligente](/es/glossary/smart-contract/) es código que se ejecuta en una [blockchain](/es/glossary/blockchain/) y se cumple automáticamente cuando se dan sus condiciones. Y lo crucial: una transacción en cadena es **atómica**: el pago y la transferencia del activo ocurren en la *misma* transacción, en el mismo bloque — o no ocurre ninguno de los dos. No existe un estado intermedio en el que una parte ya se movió y la otra no.

Esa propiedad hace exactamente lo que el escrow fue inventado para hacer, sin que un tercero retenga nada:

- El pago del comprador y el token del vendedor se intercambian **en el mismo instante**. El vendedor no puede tomar el dinero y huir, porque el token solo se mueve si el pago se mueve con él.
- **No hay código de autorización que compartir** ni una transferencia de registrador de varios días para el cambio de propiedad en cadena — el token se mueve de inmediato.
- **No hay comisión de escrow**, porque ningún tercero neutral está reteniendo fondos. El contrato inteligente *es* el árbitro imparcial, y su ejecución no tiene costo más allá de las comisiones normales de la red.

En otras palabras, el contrato inteligente se convierte en el escrow — pero es transparente, automático, instantáneo y no se queda con una comisión por guardar tu dinero. Para un recorrido más detallado del flujo completo del mercado y de hacia dónde se trasladan los riesgos, consulta [Desde el listado hasta la liquidación: cómo los mercados tokenizados reemplazan el escrow](/es/blog/how-tokenized-marketplaces-replace-escrow/).

Esto no está libre de riesgos — solo los traslada. En lugar de confiar en una empresa de escrow, ahora dependes de la seguridad de tu [billetera](/es/glossary/wallet/) y de la solidez del contrato inteligente. La idea no es que la liquidación tokenizada sea magia; es que *el trabajo que hace el escrow* puede hacerlo el código en lugar de un intermediario al que se le paga.

---

## Entonces, ¿deberías seguir usando escrow?

Depende de qué estés transaccionando:

- **¿Compras o vendes un dominio tradicional, no tokenizado, entre desconocidos?** Sí — usa un servicio de escrow de confianza. Las comisiones valen la pena, y saltarse el escrow es la forma en que la gente termina estafada.
- **¿Transaccionas un [dominio tokenizado](/es/glossary/tokenized-domain/) en un mercado?** La liquidación atómica en cadena ya te da la garantía esencial del escrow. Tu atención se desplaza a verificar el contrato y la dirección del destinatario.

Namefi trabaja con dominios tokenizados para que la compra y la venta puedan liquidarse en cadena — dándote la seguridad que ofrece el escrow sin la espera ni el porcentaje. Si quieres ver cómo funciona en la práctica, visita [namefi.io](https://namefi.io).

---

## Preguntas frecuentes

### ¿Qué es una cuenta escrow?

Una cuenta escrow es una cuenta neutral, en manos de un tercero de confianza, que retiene el pago del comprador durante una transacción. Los fondos se liberan al vendedor solo cuando se cumplen las condiciones acordadas — y se devuelven al comprador si no se cumplen. Permite que dos partes transaccionen sin tener que confiar directamente la una en la otra.

### ¿Qué significa escrow en la venta de un dominio?

En la venta de un dominio, escrow significa que un servicio externo retiene el dinero del comprador mientras el dominio se transfiere desde el registrador del vendedor al del comprador. Una vez que el comprador confirma que recibió el dominio, el escrow libera los fondos al vendedor. Protege a ambas partes contra el fraude.

### ¿Cómo funciona el escrow de dominios paso a paso?

El comprador deposita en la cuenta escrow; el escrow confirma el pago; el vendedor desbloquea el dominio y comparte el código de autorización; el comprador transfiere el dominio a su registrador; el comprador confirma la recepción; y el escrow entonces libera el dinero al vendedor.

### ¿Por qué necesito escrow para comprar un dominio?

Porque sin él, o bien el comprador puede pagar y nunca recibir el dominio, o bien el vendedor puede transferirlo y nunca cobrar. El escrow retiene el dinero en el medio para que ninguna de las partes pueda engañar a la otra. Para cualquier venta relevante entre desconocidos, es la práctica segura mínima.

### ¿Pueden los contratos inteligentes reemplazar el escrow?

Sí, para activos tokenizados. Un contrato inteligente puede liquidar el pago y la transferencia del activo de forma atómica — ambos ocurren juntos o no ocurre ninguno — lo que ofrece la garantía esencial del escrow de manera automática, instantánea y sin que un tercero retenga fondos ni cobre una comisión.

---

## Aviso legal amistoso (¡Léeme!)

> No somos abogados, contadores, asesores financieros ni médicos; y **nada en este artículo constituye asesoramiento legal, financiero, fiscal, contable, médico ni de ningún otro tipo profesional.** Escribimos estas publicaciones para educarnos a nosotros mismos y como una conveniencia para nuestros clientes. La información aquí contenida puede estar desactualizada, ser específica de una región o simplemente estar equivocada; nosotros también cometemos errores.
>
> Para cualquier decisión importante, **por favor consulta a un profesional real (¡en serio!)**. O si esa no es tu onda, pregúntale a un amigo, a Twitter, a Reddit, a una IA o a un vidente. En resumen: **DOYR — Do Your Own Research (Haz tu propia investigación)**. Aprendamos y divirtámonos.

---

## Resumen

- Una **cuenta escrow** es una cuenta neutral de un tercero que libera los fondos al vendedor solo después de que se cumplen las condiciones acordadas.
- En la venta de un dominio, el escrow retiene el dinero del comprador mientras el dominio se transfiere mediante el registrador y el código de autorización, y luego paga al vendedor cuando el comprador confirma la recepción.
- El escrow importa porque **elimina la necesidad de confiar en la otra parte**, neutralizando los fraudes más comunes en la venta de dominios.
- El escrow tradicional funciona, pero cuesta una comisión, lleva tiempo y aún exige confiar en un intermediario.
- Los **dominios tokenizados + los contratos inteligentes** pueden reemplazar el escrow con liquidación atómica en cadena — el pago y el activo se mueven juntos o no se mueven — ofreciendo la misma seguridad sin la espera ni la comisión.
