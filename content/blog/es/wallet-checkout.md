---
title: "Paga dominios con una billetera cripto: sin necesidad de cuenta"
date: '2026-07-10'
language: 'es'
tags: ['ai-agents', 'payments']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
format: explainer
ogImage: ../../assets/wallet-checkout-og.jpg
description: "Cómo el checkout firmado con billetera de Namefi permite a un agente de IA comprar un dominio con criptomonedas, sin necesidad de cuenta: flujo, modelo de seguridad y políticas de gasto."
keywords: ["pago de dominios con criptomonedas", "registro de dominios con checkout de billetera", "comprar un dominio con una billetera cripto sin cuenta", "pagar un dominio con USDC", "agente de IA paga un dominio con criptomonedas", "registro de dominios x402", "eip-3009 transferwithauthorization", "registrador de dominios que acepta criptomonedas", "checkout firmado con billetera", "namefi x402", "pagos agénticos", "compra de dominios con stablecoin", "registro de dominios sin cuenta", "firma de billetera eip-712"]
relatedArticles:
  - /es/blog/ai-agent-register/
  - /es/blog/claude-mcp-domains/
  - /es/blog/cf-namecom-namefi/
  - /es/blog/namefi-mcp/
  - /es/blog/agent-own-domain/
relatedTopics:
  - /es/topics/domain-tokenization/
  - /es/topics/web3-foundations/
relatedSeries:
  - /es/series/blockchain-concepts/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/x402/
  - /es/glossary/wallet/
  - /es/glossary/stablecoin/
  - /es/glossary/private-key/
  - /es/glossary/tokenized-domain/
---

Cada vez que se plantea que «un agente de IA puede comprarte un dominio», se termina chocando con la misma barrera: ¿cómo paga realmente el agente? Una tarjeta de crédito presupone que hay una persona para introducir los dígitos en un formulario, superar un control antifraude y confirmar un código de un solo uso enviado a un teléfono. Un [Agente de IA](/es/glossary/ai-agent/) no cuenta con nada de eso. La respuesta de Namefi es una vía de checkout que no necesita tarjeta, método de pago guardado ni cuenta de Namefi: solo una [Billetera](/es/glossary/wallet/) cripto que firma el pago en ese momento. Este artículo explica en detalle cómo funciona ese flujo, qué permite y qué no permite al agente el esquema de firma, y cuándo conviene recurrir a la facturación con clave de API.

## Por qué el pago es la parte más difícil del comercio agéntico

Buscar y comprobar precios nunca fue la parte difícil de permitir que un agente compre cosas. Son consultas de solo lectura: no requieren autorización y no hay nada en juego si el agente se equivoca. El pago es distinto, porque es el único paso en el que un error cuesta dinero real, y todos los sistemas de pago de uso generalizado actuales presuponen que una persona autoriza el cargo.

Una tarjeta guardada es el ejemplo más claro. La facturación con tarjeta guardada funciona entregando al procesador de pagos un token que puede volver a cobrarse más adelante, a discreción del comercio, sin que el titular tenga que volver a demostrar nada en el momento del cargo. Eso está bien para una suscripción en la que confías para que te cobre cada mes. Encaja peor con un proceso autónomo: quien tenga ese token de tarjeta guardada puede hacer cargos, y la única defensa real es confiar en que el software no lo use mal o detectar el abuso después en el extracto. No hay forma de entregarle a un agente una tarjeta guardada que solo pague registros de dominios de hasta $50: la tarjeta no sabe para qué se utiliza.

[¿Qué es un registrador de dominios nativo para agentes?](/es/blog/agent-native/) expone el argumento más amplio de que el pago es una de las piezas fundamentales para que un servicio sea utilizable por un agente, no solo para que tenga una API. El checkout con billetera cripto de Namefi es la respuesta concreta a ese requisito: en vez de una credencial almacenada que un servicio puede cobrar cuando quiera, cada pago es una firma que la billetera produce para esa transacción concreta, a ese precio concreto y para nada más.

## La respuesta de Namefi: checkout firmado con billetera, sin crear una cuenta

Normalmente, registrar un dominio en Namefi usa una [clave de API](https://namefi.io/api-key) facturada contra un saldo con fondos de NFSC (Namefi Service Credit), como se explica en [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/). Esa vía requiere una cuenta: alguien genera una clave desde una billetera, recarga un saldo y la clave descuenta de él cada registro.

La vía firmada con billetera omite todo eso. Según la documentación legible por máquinas que Namefi publica para los pagos con billetera, la billetera de un agente puede pagar directamente en [USDC](/es/glossary/stablecoin/) sin que exista una cuenta de Namefi ni una clave de API en ningún lugar: la billetera del comprador firma una autorización de pago y el registro se liquida cuando llega esa firma. No hay nada que crear de antemano ni ninguna autorización permanente que pudiera usarse indebidamente más tarde: la billetera solo actúa en el instante en que firma.

Namefi documenta tres formas de que una billetera produzca esa firma, explicadas paso a paso a continuación: el protocolo [x402](/es/glossary/x402/) (la vía principal y la que aborda esta guía), una variante de desafío-respuesta de Machine Payable Protocol (MPP) y una vía de firma manual con EIP-712 para billeteras que no usan ninguno de los dos atajos.

## El flujo x402, paso a paso

x402 es un estándar abierto, respaldado por empresas como Cloudflare, AWS y Stripe, que recupera el código de estado HTTP `402 Payment Required`, inactivo desde hace tiempo, como una forma estructurada de solicitar un pago en cadena dentro de una solicitud normal, en vez de redirigir a una página de checkout independiente. Namefi lo implementa en su endpoint de registro de dominios:

1. **Solicitud sin pago.** El agente envía una solicitud `GET` sencilla al endpoint `/x402/domain/{domainName}` de Namefi, sin pago adjunto porque todavía no conoce el precio.
2. **HTTP 402 con precio.** Namefi responde con `402 Payment Required` e incluye en el cuerpo de la respuesta las opciones de pago: la red, el activo aceptado (USDC) y el importe. Esta es la parte de x402 que lo diferencia de un error normal: el estado 402 contiene todo lo que el cliente necesita para construir un pago válido, en vez de limitarse a decir «no».
3. **La billetera firma una `transferWithAuthorization` de EIP-3009.** En vez de enviar una transacción de blockchain independiente y esperar a que se confirme, la billetera produce una firma conforme a [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009), un estándar de Ethereum creado específicamente para transferencias de tokens autorizadas mediante firma. La función `transferWithAuthorization` de EIP-3009 permite al titular de un token firmar un mensaje que autoriza una transferencia de una cantidad específica a un destinatario específico, válida únicamente durante un intervalo concreto (`validAfter` / `validBefore`), que un tercero puede enviar después en cadena. La documentación de Namefi deja claro que este paso no requiere una cuenta de Namefi ni una firma EIP-712 previa: la billetera firma una autorización independiente de transferencia de USDC, punto.
4. **Repite la solicitud con un encabezado de pago.** El agente vuelve a enviar la solicitud original, esta vez con un encabezado `X-PAYMENT` que contiene la autorización firmada.
5. **Verifica, liquida y registra.** Namefi verifica la firma, inicia el flujo de registro del dominio y liquida el pago: el USDC sale de la billetera del comprador y el registro continúa igual que por la vía de la clave de API, incluido el acuñamiento del dominio como un [NFT](https://eips.ethereum.org/EIPS/eip-721), un [Dominio Tokenizado](/es/glossary/tokenized-domain/), en esa misma billetera pagadora de forma predeterminada.

Nada de esa secuencia exige que el agente haya creado una cuenta de Namefi, almacenado una credencial que Namefi pudiera reutilizar sin preguntar o cedido la custodia de los fondos antes del instante exacto del pago. La firma solo demuestra que la billetera autorizó esta transferencia concreta de USDC, por este importe y dentro de un intervalo de tiempo limitado.

## La variante MPP de desafío-respuesta

x402 es la vía principal, pero Namefi también documenta una segunda para billeteras o frameworks de agentes que utilizan un patrón de pago distinto: Machine Payable Protocol (MPP). Estructuralmente es la imagen especular de x402: un desafío-respuesta en lugar de un 402 sin más:

1. La primera solicitud al endpoint protegido vuelve a devolver `402 Payment Required`, pero esta vez incluye un **desafío firmado** en vez de una simple cotización de precio.
2. El cliente (normalmente mediante la herramienta de línea de comandos `mppx` de Namefi, creada específicamente para gestionar el paso de firma) firma ese desafío con la billetera pagadora.
3. El cliente repite la solicitud original con la firma resultante adjunta en un encabezado `Authorization`.

El efecto neto es el mismo que con x402: un pago por solicitud, firmado por billetera y sin credencial almacenada, empaquetado como un intercambio de desafío firmado en vez de un precio desnudo dentro de un 402. La vía que use un agente depende de las herramientas de pago que ya maneje; el endpoint de Namefi admite ambas.

## La vía manual con EIP-712

Para billeteras o scripts que no usan ninguno de los dos atajos, Namefi expone una vía de firma de nivel más bajo y completamente manual basada en la firma de datos tipados de [EIP-712](https://eips.ethereum.org/EIPS/eip-712), el mismo estándar en el que se basa EIP-3009. Una solicitud firmada de esta forma lleva tres encabezados: `x-namefi-signer` (la dirección de la billetera firmante), `x-namefi-signature` (la firma codificada en hexadecimal) y `x-namefi-eip712-type` (el esquema de datos tipados con el que se produjo la firma); además, envuelve su carga en un sobre con `payloadType`, la `payload` propiamente dicha, una `timestamp` y un `nonce`.

Dos detalles son importantes para la seguridad en esta vía manual: **las firmas caducan después de 300 segundos y los nonces son de un solo uso.** Una vez transcurridos 300 segundos, o una vez aceptada una solicitud que use el nonce, una firma capturada ya no puede reutilizarse con éxito. La documentación de Namefi también especifica que las definiciones de tipo EIP-712 vigentes deben obtenerse de sus endpoints `/v-next/eip712/` en el momento de la solicitud, no codificarse de forma fija en una integración, porque el esquema exacto al que debe ajustarse una firma puede cambiar.

Namefi también documenta la firma de billeteras de contratos inteligentes de esta manera: una cuenta externa (EOA) aprobada puede firmar en nombre de una billetera de contrato conforme a ERC-1271 o al más reciente EIP-7702, siempre que el contrato implemente una comprobación `approvedSigners(address)` que la API pueda verificar.<!-- TODO: confirmar qué tan común es en la práctica esta vía de billetera de contrato inteligente frente a una billetera EOA estándar -->

## El modelo de seguridad: qué puede y qué no puede hacer el agente

Conviene precisar qué limita realmente este esquema de firma, en vez de describir una garantía más fuerte de la que el mecanismo proporciona.

**Lo que sí limita.** Cada vía exige que la billetera firme la solicitud actual, en lugar de entregar a Namefi una credencial permanente. Los controles contra la repetición varían según el protocolo: en la vía manual EIP-712, la firma caduca después de 300 segundos y se consume un nonce de un solo uso; x402 usa una autorización EIP-3009 vinculada a un importe y un destinatario concretos, limitada por `validAfter`/`validBefore` y protegida por un nonce; en MPP, el cliente firma el desafío emitido por el servidor, por lo que sus condiciones de caducidad y repetición son las que especifique ese desafío. La billetera nunca concede a Namefi una autorización permanente para iniciar futuros cargos por su cuenta. Compáralo con una tarjeta guardada: una vez que un comercio tiene el token de tu tarjeta, nada en el propio token limita lo que podrá cobrar el mes siguiente ni impide que un sistema comprometido lo reutilice. La clave privada de una billetera nunca sale de ella en ninguno de estos flujos: el agente le pide a la billetera que produzca una firma para una solicitud concreta, y ese es todo el alcance de lo que sucede.

**Lo que no limita por sí solo.** La documentación de Namefi no describe un límite de gasto en dólares por transacción, incorporado y aplicado por el propio protocolo: los controles de caducidad y contra la repetición específicos de cada protocolo limitan cuándo y cómo puede reutilizarse una autorización, no cuánto puede autorizar una única solicitud firmada.<!-- TODO: confirmar con el equipo si el endpoint x402/MPP de Namefi aplica algún máximo de pago del lado del servidor, independiente del importe que el cliente solicita firmar --> En la práctica, la disciplina de gasto de un agente viene de fuera de este mecanismo: de cuánto USDC deposites en la billetera y de cualquier capa de política —una configuración de [Multifirma (Multi-sig)](/es/glossary/multi-sig/) que exija una segunda aprobación, o un paso de confirmación humana antes de que el agente pueda firmar— que coloques entre el agente y la [Clave Privada](/es/glossary/private-key/) de la billetera. [¿Qué es un registrador de dominios nativo para agentes?](/es/blog/agent-native/) y [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/) abordan el mismo punto desde el lado de las salvaguardas: financia la billetera solo con lo que estés dispuesto a que gaste un proceso sin supervisión y decide de antemano en qué punto hace falta aprobación humana.

Esa combinación —sin credencial permanente, una autorización limitada por transacción y los fondos como límite práctico de gasto— crea un perfil de riesgo realmente distinto al de una tarjeta guardada, no solo una versión con criptomonedas de lo mismo. Un número de tarjeta filtrado o un token de facturación comprometido puede cargarse repetidamente hasta que alguien lo detecte y lo cancele. Una autorización de pago capturada se rechaza cuando se alcanza su condición de caducidad o de prevención de repeticiones específica del protocolo: la vía manual EIP-712 la rechaza después de 300 segundos o una vez consumido su nonce; la autorización EIP-3009 de x402 se rechaza fuera del intervalo `validAfter`/`validBefore` o después de usar su nonce; y una credencial MPP se rige por las condiciones de caducidad y repetición codificadas en su desafío firmado.

## Cuándo usar en su lugar facturación con clave de API o NFSC

La vía firmada con billetera es la herramienta adecuada cuando el objetivo es precisamente que no exista una cuenta antes de la compra: un script totalmente autónomo, un agente que opera en nombre de otra persona sin credenciales de inicio de sesión compartidas o la preferencia de mantener una billetera cripto como única identidad implicada. No es automáticamente la vía correcta para todas las situaciones.

La facturación con clave de API contra un saldo de NFSC con fondos, tal como se detalla en [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/), tiene más sentido cuando un agente registra dominios de forma repetida y un saldo permanente que puede comprobarse es preferible a firmar un pago nuevo cada vez; cuando el operador quiere una vista única del gasto en un panel en lugar de reconstruirlo a partir de transferencias en cadena; o cuando el cliente ya tiene una forma sencilla de almacenar un valor de encabezado pero no una forma fácil de custodiar una clave privada y firmar con ella. Ambas vías llevan a las mismas operaciones de registro y DNS una vez que se liquida el pago: la elección trata de cómo funciona la autorización, no de lo que puedes registrar o gestionar después.

## Preguntas frecuentes

### ¿Necesito una cuenta de Namefi para pagar con una billetera cripto?

No. Los flujos x402 y MPP liquidan un registro de dominio a partir de un pago firmado por una billetera, sin cuenta de Namefi ni una clave de API creada de antemano. Solo se necesita una clave de API para la vía de facturación con saldo de NFSC.

### ¿Qué criptomoneda acepta Namefi para el checkout con billetera?

USDC. El endpoint x402 de Namefi cotiza y liquida específicamente en USDC, lo que evita las variaciones de precio que un activo volátil como ETH introduciría entre el momento de la cotización y el de la liquidación.

### ¿Firmar un pago con una billetera equivale a darle mi clave privada a un agente?

No: la billetera produce la firma sin exponer nunca la propia clave privada. El agente (o la herramienta que utiliza) le pide a la billetera que firme una autorización concreta y limitada; la clave permanece dentro de la billetera en todo momento.

### ¿Puede alguien reutilizar una firma de pago que hice antes?

Una firma capturada puede seguir siendo utilizable hasta que se rechace por su propia condición de caducidad o control contra la repetición; las tres vías no comparten una regla universal. En la vía manual EIP-712, las firmas caducan después de 300 segundos y cada nonce solo puede utilizarse una vez. La autorización EIP-3009 del flujo x402 solo es válida dentro de su intervalo `validAfter`/`validBefore`, y su nonce no puede utilizarse dos veces. MPP utiliza un desafío firmado, por lo que sus condiciones de caducidad y repetición deben comprobarse en ese desafío, en lugar de suponer que coinciden con las de las otras dos vías.

### ¿El dominio se tokeniza automáticamente cuando pago de esta manera?

De forma predeterminada, sí: el dominio registrado se acuña como NFT en la misma billetera que pagó, el mismo comportamiento de tokenización que utiliza la vía de clave de API salvo que se especifique una billetera receptora distinta. Consulta [Cloudflare vs Name.com vs Namefi: registradores nativos para agentes](/es/blog/cf-namecom-namefi/) para ver cómo se compara con registradores que no ofrecen checkout nativo de billetera ni propiedad tokenizada.

### ¿Es más seguro el checkout con billetera que pagar con una tarjeta guardada?

Limita un conjunto de riesgos distinto, en vez de eliminar el riesgo por completo. No hay una credencial permanente que un sistema comprometido pueda reutilizar indefinidamente, y cada pago exige una firma nueva para la solicitud correspondiente. Los controles contra la repetición son distintos: la vía manual EIP-712 utiliza una caducidad de 300 segundos y un nonce de un solo uso; la autorización EIP-3009 de x402 utiliza `validAfter`/`validBefore` y un nonce; MPP se rige por las condiciones de su desafío firmado. Ninguno de esos controles limita cuánto puede autorizar una única solicitud firmada, por lo que el tope práctico de lo que un agente puede gastar sigue viniendo de cuánto financies la billetera y de cualquier política de aprobación adicional (como una multifirma) que sitúes delante de ella.

## Compra un dominio con una billetera en Namefi

Si el objetivo de usar un agente es que ninguna cuenta humana se interponga entre el agente y la compra, el checkout firmado con billetera de Namefi está pensado exactamente para ello: un registro de dominio real acreditado por ICANN, pagado con una única autorización USDC firmada, con la propiedad tokenizada entregada en la misma billetera que pagó. Consulta el mecanismo completo en [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt), o empieza con la configuración más amplia en [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/).

**[Busca y registra un dominio en Namefi](https://namefi.io).**

## Fuentes y lecturas adicionales

- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (fuente primaria del flujo x402, la variante MPP de desafío-respuesta, la vía de firma manual con EIP-712, las reglas de caducidad de firma/nonce y la firma de billeteras de contratos inteligentes ERC-1271/EIP-7702)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (vía de facturación NFSC/con clave de API y el enlace a la referencia anterior sobre pagos con billetera)
- x402.org — [x402: An Internet-native payment standard](https://x402.org) (el protocolo de pago abierto basado en HTTP 402 que implementa el flujo de Namefi)
- Ethereum — [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009) (el estándar de firma tras el paso `transferWithAuthorization`; los límites temporales `validAfter`/`validBefore` y los nonces aleatorios de un solo uso)
- Ethereum — [EIP-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721) (el estándar NFT en el que se basa la propiedad de dominios tokenizados)
- Namefi — [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/) (la vía de facturación con clave de API/NFSC y la guía de salvaguardas más amplia)
- Namefi — [Cloudflare vs Name.com vs Namefi: registradores nativos para agentes](/es/blog/cf-namecom-namefi/) (cómo se compara el checkout nativo de billetera entre los tres registradores orientados a agentes)
