---
title: "¿Qué es el pago para agentes, y por qué todo el mundo se apresura a ofrecerlo?"
date: '2026-08-13'
language: 'es'
tags: ['ai-agents', 'payments', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
format: explainer
ogImage: ../../assets/what-is-agent-payment-og.jpg
description: "El pago para agentes permite que los agentes de IA gasten con una autoridad delimitada y revocable. Un vistazo a la billetera de Link para agentes de Stripe, las tarjetas para agentes de Mercury y la carrera de 2025-2026."
keywords: ["qué es el pago para agentes", "pagos para agentes explicados", "comercio agéntico", "billetera de Link para agentes de Stripe", "Issuing para agentes de Stripe", "tarjetas para agentes de Mercury", "gestión de gastos de Mercury", "Agentic Commerce Protocol", "protocolo AP2 de Google", "Mastercard Agent Pay", "Visa Intelligent Commerce", "tarjeta de un solo uso para agente de IA", "shared payment token", "límites de gasto de agentes de IA", "pagos de agentes con x402"]
relatedArticles:
  - /es/blog/wallet-checkout/
  - /es/blog/agents-buy-domains/
  - /es/blog/state-of-agentic/
  - /es/blog/agent-native/
  - /es/blog/ai-agent-register/
relatedTopics:
  - /es/topics/web3-foundations/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/blockchain-concepts/
  - /es/series/domain-apocalypse/
relatedGlossary:
  - /es/glossary/ai-agent/
  - /es/glossary/x402/
  - /es/glossary/stablecoin/
  - /es/glossary/wallet/
  - /es/glossary/tokenized-domain/
---

En el lapso de dieciséis meses, las dos grandes redes de tarjetas, Google, OpenAI y Stripe han anunciado o lanzado infraestructura para lo mismo: permitir que un [Agente de IA](/es/glossary/ai-agent/) gaste dinero. Mastercard [anunció Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens) el 29 de abril de 2025. Visa presentó [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=browse%2C%20select%2C%20purchase%20and%20manage%20on%20their%20behalf) al día siguiente. Google publicó su [Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption) con más de 60 organizaciones asociadas en septiembre de 2025. Ese mismo mes, OpenAI activó [Instant Checkout dentro de ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe). Y en abril de 2026, Stripe lanzó [la billetera de Link para agentes](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials), una billetera de consumo que un agente puede tomar prestada una compra a la vez. Incluso Mercury, una plataforma de banca empresarial, encabeza ahora su [propuesta de gestión de gastos](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) con «tarjetas para equipos **y agentes**».

Este artículo explica qué es realmente el «pago para agentes», recorre dos implementaciones reveladoras —la billetera de Stripe orientada al consumidor y las tarjetas para agentes de Mercury orientadas a la empresa— y luego examina por qué tantas compañías decidieron, casi al mismo tiempo, que no podían permitirse quedarse fuera de esto.

## Qué significa realmente «pago para agentes»

El pago para agentes es la infraestructura que permite que un agente de software gaste dinero en nombre de una persona o una empresa, con una autoridad que es **delimitada** (esta cantidad, en este comercio, para este fin), **demostrable** (el comercio puede verificar que el agente estaba efectivamente autorizado) y **revocable** (el propietario puede desactivarla), en lugar del instrumento tosco de entregarle al agente un número de tarjeta en bruto.

Esa última cláusula es todo el punto. Nunca ha habido nada que te impidiera pegar tu número de Visa en el archivo de configuración de un bot. Lo que detiene a la mayoría de la gente es que un número de tarjeta es autoridad sin delimitar: quien lo tenga puede cobrar cualquier cosa, en cualquier lugar, hasta que lo notes y canceles la tarjeta. El anuncio de AP2 de Google plantea el problema de fondo sin rodeos: los sistemas de pago actuales, por lo general, [«dan por sentado que es una persona quien hace clic directamente en 'comprar' en una superficie de confianza»](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=assume%20a%20human%20is%20directly%20clicking), y un agente autónomo que inicia un pago [«rompe ese supuesto fundamental»](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption). AP2 plantea esa brecha como tres preguntas que toda transacción de un agente debe responder: **autorización** (¿le otorgó el usuario al agente autoridad para *esta* compra?), **autenticidad** (¿refleja la solicitud del agente la intención real del usuario?) y **responsabilidad** (¿quién asume la pérdida cuando algo sale mal?).

Todos los productos de este espacio —los programas de tokens de las redes de tarjetas, los protocolos abiertos, las billeteras, las tarjetas para agentes— son un intento de responder esas tres preguntas lo bastante bien como para que dejar que un agente gaste dinero se convierta en algo normal y aburrido.

## Stripe: una billetera que tu agente puede tomar prestada, una compra a la vez

La entrada de Stripe, [anunciada el 29 de abril de 2026](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching), es **la billetera de Link para agentes**, construida sobre una nueva capa de **Issuing para agentes**. Link es la billetera de consumo de Stripe —el producto de «guarda mis datos para un checkout más rápido»— con una base de clientes que Stripe cifra en [más de 200 millones de consumidores](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers). El flujo del agente funciona así:

1. El consumidor le otorga a un agente acceso a su billetera de Link mediante un flujo estándar de OAuth, el mismo patrón de consentimiento que se usa para conectar cualquier aplicación de terceros.
2. Cuando el agente quiere comprar algo, crea una **solicitud de gasto** que lleva contexto: nombre del comercio, URL, importe y una descripción legible por humanos de qué está comprando y por qué.
3. El consumidor revisa y aprueba la solicitud en la web o en las aplicaciones móviles de Link. Hoy, [cada solicitud exige la revisión de la persona](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=each%20request%20requires%20the%20person%E2%80%99s%20review) antes de compartir cualquier credencial; Stripe dice que los límites de gasto y la autonomía preaprobada están planeados para más adelante.
4. Al aprobarse, el agente recibe una **tarjeta de un solo uso** o un **Shared Payment Token (SPT)**, una credencial que [puede delimitarse con controles como el importe, la divisa y el comercio](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=scoped%20with%20controls%20like%20amount%2C%20currency%2C%20and%20merchant). Como lo expresa Stripe: [«El agente nunca obtiene acceso a tus credenciales de pago en bruto».](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)

Vale la pena leer el diseño con atención porque invierte el modelo de tarjeta guardada. Una tarjeta guardada es autoridad permanente de la que el comercio (o el agente) puede disponer una y otra vez, delimitada por acuerdos que se hacen cumplir después del hecho y no por la propia credencial; una solicitud de gasto es una concesión única de autoridad, creada en el momento de la compra, delimitada a esa compra y muerta después. Stripe también expone la capa subyacente —Issuing para agentes— para que las empresas puedan construir sus propias billeteras agénticas: tarjetas virtuales de un solo uso, almacenamiento de fondos, permisos a nivel de tarjeta, monitorización de transacciones y controles antifraude en el momento de la autorización.

## Mercury: la tarjeta corporativa conoce al agente

La billetera de Stripe responde la pregunta del consumidor: *¿cómo dejo que un agente de compras adquiera cosas con mi dinero?* La [gestión de gastos](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) de Mercury responde la versión empresarial, y su respuesta es reveladora: tratar a los agentes como empleados.

Mercury describe el producto como [«gestión de gastos autoaplicada, con presupuestos inteligentes, reembolsos a empleados y tarjetas para equipos y agentes»](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents). La mecánica es el conjunto de herramientas de gestión de gastos ya conocido —[presupuestos y barreras de seguridad delimitados a fines concretos](https://mercury.com/spend-management#:~:text=Set%20up%20budgets%20and%20guardrails%20to%20unblock%20your%20team%20and%20agents), límites por categoría, seguimiento en tiempo real, políticas que se hacen cumplir solas— extendido a gastadores no humanos: las empresas pueden [emitir tarjetas dedicadas para agentes para transacciones aprobadas](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions), cada una con sus propios límites.

La página incluso lo demuestra: un agente rellena un formulario de checkout con «la tarjeta para agentes de Jane», realiza un pedido publicitario de $100 y reporta que la tarjeta tiene un límite de gasto de $1,000 al mes y que los datos de la tarjeta se usaron solo para ese checkout, sin quedar almacenados nunca. Mercury Spend está [incluido para todos los clientes de banca empresarial de Mercury](https://mercury.com/spend-management#:~:text=included%20for%20all%20Mercury%20business%20banking%20customers), con una versión independiente planeada para equipos que operan con otro banco.

El enfoque importa más que la lista de funciones. Para una empresa, un agente que gasta dinero no es un problema de pago exótico y nuevo: es plantilla. Recibe una tarjeta, un presupuesto, un propósito, un límite mensual y un rastro de auditoría, exactamente igual que una nueva contratación en el sistema de finanzas. Donde Stripe construyó un bucle de consentimiento para consumidores, Mercury construyó una casilla del organigrama para software.

## Dieciséis meses de anuncios

Al reunir la cronología en un solo lugar, la fiebre resulta difícil de pasar por alto:

| Fecha | Empresa | Qué se anunció |
|---|---|---|
| 29 de abril de 2025 | Mastercard | [Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens): Agentic Tokens; los agentes deben estar [registrados y verificados](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=trusted%20AI%20agents%20to%20be%20registered%20and%20verified) para poder transaccionar |
| 30 de abril de 2025 | Visa | [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users): abre la red de Visa a los agentes de IA mediante credenciales tokenizadas |
| 16 de septiembre de 2025 | Google | [Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption): un protocolo abierto con más de 60 socios, desde Amex hasta Coinbase y PayPal |
| 29 de septiembre de 2025 | OpenAI + Stripe | [Instant Checkout en ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe), impulsado por el Agentic Commerce Protocol (ACP) de código abierto |
| 15 de enero de 2026 | Google | [Universal Commerce Protocol (UCP)](/es/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/): un estándar abierto de interoperabilidad de comercio diseñado para funcionar junto con AP2 |
| 29 de abril de 2026 | Stripe | [La billetera de Link para agentes + Issuing para agentes](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching): acceso a la billetera de consumo y primitivas de emisión para el gasto de agentes |
| 2026 | Mercury | [Gestión de gastos con tarjetas para agentes](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions): presupuestos, barreras de seguridad y tarjetas dedicadas para agentes |

¿Por qué la estampida? Tres fuerzas, y esta parte es interpretación, no algo que los anuncios digan de forma explícita:

**El comprador se está moviendo, y la billetera quiere moverse con él.** OpenAI señala que [más de 700 millones de personas recurren a ChatGPT cada semana](https://openai.com/index/buy-it-in-chatgpt/#:~:text=More%20than%20700%20million%20people%20turn%20to%20ChatGPT%20each%20week), y ahora gestiona compras dentro del propio chat. Si el descubrimiento y el checkout ocurren ambos dentro de una conversación con un agente, quien provea la billetera del agente se sitúa entre cada comercio y cada cliente. La propuesta de Stripe a los desarrolladores es explícita sobre el premio: construye sobre Link y [alcanza su base de 200 millones de consumidores](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers). Las empresas de pagos vieron cómo la búsqueda y las redes sociales intermediaron el comercio durante dos décadas; ninguna de ellas piensa quedarse mirando desde la banda mientras los agentes hacen lo mismo.

**Las credenciales sin delimitar no sobreviven al contacto con la automatización.** Sin rieles construidos para ese propósito, la gente le entrega a los agentes tarjetas guardadas e inicios de sesión compartidos: autoridad permanente sin delimitación, exactamente el patrón que los sistemas antifraude existen para detectar. El responsable de producto de Visa planteó el requisito como una confianza que se extiende más allá de los usuarios: los agentes [«necesitarán que se confíe en ellos para los pagos, no solo por parte de los usuarios, sino también de los bancos y los vendedores»](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users). Las redes que pueden distinguir un agente autorizado de un bot que prueba tarjetas logran aprobar más transacciones buenas y bloquear más malas; las que no pueden, hacen ambas cosas mal.

**Los protocolos son una carrera por el territorio.** ACP, AP2, los Agentic Tokens de Mastercard y las credenciales tokenizadas de Visa quieren ser todos la gramática por defecto de las compras hechas por máquinas. Los estándares abiertos suelen ganar estas carreras por ser fáciles de adoptar, precisamente por lo que OpenAI [liberó el código de ACP](https://openai.com/index/buy-it-in-chatgpt/#:~:text=Agentic%20Commerce%20Protocol%2C%20so%20that%20more%20merchants%20and%20developers%20can%20begin%20building) y Google reclutó a 60 socios de lanzamiento para AP2, para luego seguir en enero de 2026 con el [Universal Commerce Protocol](/es/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/) con el fin de estandarizar el flujo de compra en torno al pago. Nadie quiere integrar dos veces el estándar perdedor.

## Un mismo patrón de diseño, muchos logotipos

Si se le quita el barniz de marca, todo producto serio de pago para agentes converge en las mismas cuatro propiedades:

1. **Nunca exponer la credencial en bruto.** Tarjetas de un solo uso (Stripe), Shared Payment Tokens (Stripe/ACP), Agentic Tokens (Mastercard), credenciales tokenizadas (Visa). El agente lleva un instrumento construido para ese propósito, no tu PAN.
2. **Delimitar la autoridad.** Importe, divisa, comercio y límites temporales en la propia credencial: la versión de OpenAI son [tokens de pago cifrados «autorizados solo para importes y comercios específicos»](https://openai.com/index/buy-it-in-chatgpt/#:~:text=encrypted%20payment%20tokens%20are%20only%20authorized%20for%20specific%20amounts%20and%20specific%20merchants).
3. **Mantener a una persona en el bucle de aprobación, al menos por ahora.** Stripe exige hoy la revisión de cada solicitud; los presupuestos de Mercury preautorizan el gasto dentro de límites que fija una persona. El dial de la autonomía se mueve, pero arranca cerca de cero.
4. **Hacer legible el gasto del agente.** Agentes registrados (Mastercard), cadenas de contexto en las solicitudes de gasto (Stripe), seguimiento en tiempo real y la disciplina de recibos-o-se-bloquea-la-tarjeta (Mercury). Toda transacción debería responder «¿qué agente, con la autoridad de quién, para qué?»

Si esas propiedades les suenan familiares a los lectores nativos de las criptomonedas, es porque deberían sonarles así. Una transferencia de [Stablecoin](/es/glossary/stablecoin/) autorizada por firma bajo el esquema de pago exacto de [x402](/es/glossary/x402/) —un importe exacto, a un destinatario exacto, válido solo dentro de una ventana temporal, firmado por la propia [Billetera](/es/glossary/wallet/) del pagador en el momento de la compra— es el mismo diseño al que se llega desde la otra dirección, con la delimitación aplicada mediante criptografía en lugar del motor de políticas de un emisor. El propio Stripe incluye las stablecoins como un método de pago próximo para las billeteras de agentes. El mundo de las tarjetas y el mundo cripto están convergiendo en la misma respuesta: *autoridad por transacción, no autoridad archivada.*

## Dónde encajan los dominios

Los dominios están resultando ser una de las primeras cosas que los agentes compran por su cuenta: son objetos puramente de API, no requieren dirección de envío, y todo producto de agente desplegado acaba necesitando un nombre que controle. Hemos escrito sobre [cómo los agentes compran dominios sin intervención humana](/es/blog/agents-buy-domains/), [qué aspecto tiene un registrador nativo para agentes](/es/blog/agent-native/) y [cómo un agente registra un dominio en Namefi](/es/blog/ai-agent-register/) paso a paso.

La propia respuesta de Namefi a la pregunta del pago es el checkout firmado con billetera, tratado en profundidad en [Paga dominios con una billetera cripto: sin necesidad de cuenta](/es/blog/wallet-checkout/): la billetera de un agente responde a un desafío x402 firmando una autorización de transferencia de USDC para un registro exacto, a un precio exacto, sin cuenta y sin credencial almacenada en ningún lugar, y recibe el dominio como un [Dominio Tokenizado](/es/glossary/tokenized-domain/) en esa misma billetera. Es pago para agentes exactamente en el sentido que este artículo ha venido describiendo, disponible hoy en un producto real, para lo que los agentes más previsiblemente necesitan comprar.

La carrera por ofrecer pago para agentes es, al final, una carrera por ganarse la confianza. Más de doscientos millones de consumidores de Link, más de setecientos millones de usuarios semanales de ChatGPT y todos los programas de tarjetas corporativas convergen en la misma apuesta: los próximos mil millones de compradores no serán todos humanos, y la infraestructura que le dé a su software una autoridad de gasto segura, delimitada y responsable será tan fundamental como lo fue la red de tarjetas para la última era del comercio.

## Fuentes y lecturas adicionales

- Stripe — [Cómo dar a los agentes la capacidad de pagar](https://stripe.com/blog/giving-agents-the-ability-to-pay) (la billetera de Link para agentes + Issuing para agentes, 29 de abril de 2026)
- Mercury — [Spend Management](https://mercury.com/spend-management) (presupuestos, barreras de seguridad y tarjetas dedicadas para agentes)
- Google Cloud — [Presentamos el Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol) (16 de septiembre de 2025)
- OpenAI — [Cómpralo en ChatGPT: Instant Checkout y el Agentic Commerce Protocol](https://openai.com/index/buy-it-in-chatgpt/) (29 de septiembre de 2025)
- Mastercard — [Mastercard presenta Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html) (29 de abril de 2025)
- Visa — [Buscar y comprar con IA: Visa presenta una nueva era del comercio](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html) (Visa Intelligent Commerce, 30 de abril de 2025)
- Namefi — [Paga dominios con una billetera cripto: sin necesidad de cuenta](/es/blog/wallet-checkout/) (checkout firmado con billetera x402)
