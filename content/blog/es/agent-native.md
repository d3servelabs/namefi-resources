---
title: "¿Qué es un registrador de dominios nativo para agentes?"
date: '2026-07-10'
language: 'es'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
format: explainer
ogImage: ../../assets/agent-native-og.jpg
description: "Los registradores llevan décadas teniendo API, pero una API por sí sola no es nativa para agentes. La lista: descubrimiento, documentación, errores, pagos y controles de política."
keywords: ["registrador nativo para agentes", "definición de nativo para agentes", "qué es un registrador nativo para agentes", "API preparada para agentes", "servidor MCP", "llms.txt", "errores legibles por máquina", "idempotencia", "pagos agénticos", "registro de dominios con agentes de IA", "documentación de API en lenguaje natural", "controles de política para agentes de IA", "facturación con clave de API", "pago de dominios cripto con billetera"]
relatedArticles:
  - /es/blog/ai-domain-platforms/
  - /es/blog/cf-namecom-namefi/
  - /es/blog/ai-agent-register/
  - /es/blog/claude-mcp-domains/
  - /es/blog/airo-vs-namefi/
relatedTopics:
  - /es/topics/web3-foundations/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/blockchain-concepts/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/ai-agent/
  - /es/glossary/registrar/
  - /es/glossary/icann/
  - /es/glossary/epp/
  - /es/glossary/x402/
---

Los registradores de dominios cuentan con interfaces de programación de aplicaciones desde hace mucho tiempo. [Extensible Provisioning Protocol](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol) (EPP), el lenguaje de máquina a máquina que los registradores usan para comunicarse con los registros, alcanzó el estatus de [Proposed Standard en marzo de 2004](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004) —hace más de dos décadas—. Desde entonces, todo [Registrador](/es/glossary/registrar/) acreditado por [ICANN](/es/glossary/icann/) que se apoya en él ha tenido alguna API REST o SOAP para comprobar la disponibilidad, enviar una solicitud de registro y actualizar datos. Así que la respuesta honesta a «¿este registrador tiene API?» es, para casi todos los registradores del mercado: sí, y desde hace años.

Pero esa resulta ser la pregunta equivocada. Un [Agente de IA](/es/glossary/ai-agent/) que intenta registrar un dominio en tu nombre no falla porque al registrador le falte una API. Falla porque la API se diseñó para un desarrollador que lee una vez la documentación, escribe a mano el código de integración y lo lanza; no para un sistema que debe descubrir la API durante la ejecución, decidir qué ha ocurrido a partir de una respuesta JSON y completar una compra sin que nadie supervise una página de pago. Son requisitos distintos, y cumplir el segundo grupo es lo que este artículo llama **nativo para agentes**.

Este artículo define el término con precisión, presenta una lista para evaluar cualquier registrador —o cualquier API— con ese criterio y la aplica con franqueza a las plataformas disponibles en 2026, incluida [Namefi](https://namefi.io). Para comparar las plataformas entre sí, en lugar de ver la definición, consulta [Cloudflare vs Name.com vs Namefi: registradores nativos para agentes](/es/blog/cf-namecom-namefi/) o la guía más amplia de [plataformas de dominios agénticas basadas en IA](/es/blog/ai-domain-platforms/). Si todavía concibes «IA y dominios» como un generador de nombres que propone cadenas aptas para una marca, la lista de abajo muestra cuánto más alto está el listón de lo nativo para agentes; consulta [Más allá del generador de nombres de dominio con IA: la era de los agentes](/es/blog/beyond-generators/) para ver esa diferencia en detalle.

## Por qué «tener una API» y «ser nativo para agentes» no son la misma afirmación

Una API de registrador tradicional presupone que una persona participa en el diseño, no en la ejecución. Un desarrollador abre una cuenta, lee una página de referencia escrita para personas, copia un ejemplo de código y fija en su aplicación el endpoint, el encabezado de autenticación y la forma esperada de la respuesta. Una vez hecho eso, la integración se ejecuta sin supervisión, pero solo porque una persona ya hizo el trabajo interpretativo. No hay nada en la propia API que resulte legible para un sistema que llega sin contexto, sin una integración previa, y debe averiguar en ese momento qué operaciones existen y cómo llamarlas.

Un agente llega sin contexto continuamente. Cada conversación con un agente de programación y cada cliente MCP nuevo equivale, en la práctica, a un desarrollador que nunca ha visto tu API y dispone de apenas unos segundos para entenderla. Si la respuesta a «¿cómo aprende un agente a usar esta API?» es «una persona leyó la documentación y escribió código auxiliar hace años», la API mantiene a una persona incrustada permanentemente en su ruta de ejecución, aunque nadie haga clic durante la compra. Este artículo trata de lo que debe ser cierto del propio registrador para que ese agente que parte desde cero tenga éxito; para la perspectiva de quien compra sobre esa misma transferencia, consulta [Cómo compran dominios los agentes de IA sin una persona (2026)](/es/blog/agents-buy-domains/).

## La lista de verificación para registradores nativos para agentes

Un registrador nativo para agentes es aquel que un agente de IA puede descubrir, entender y usar para realizar transacciones por completo por sí mismo: sin navegador, sin que una persona lea antes la documentación ni introduzca un número de tarjeta. Para ello deben cumplirse seis cosas concretas, no basta con «tener una API»:

| Requisito | Registrador con API | Registrador nativo para agentes |
| --- | --- | --- |
| Capacidad de descubrimiento | Los endpoints existen, pero hay que comunicar al agente la URL base y el esquema de autenticación por un canal externo | Una ubicación estándar (`llms.txt` o un servidor [MCP](https://modelcontextprotocol.io)) que el agente puede encontrar y leer sin ayuda |
| Documentación en lenguaje natural | La documentación de referencia está escrita para que una persona hojee una página | La documentación está estructurada para que un agente la procese durante la inferencia: operación, campos obligatorios y efecto, en un mismo lugar |
| Errores legibles por máquina | Códigos de estado HTTP más texto pensado para una persona que lee un registro | Un código de error estable, una marca `retryable` y detalles estructurados con los que un agente puede tomar decisiones programáticamente |
| Compra sin navegador | El registro se completa en una página de pago alojada, a veces tras un CAPTCHA | El registro se completa mediante la propia API o protocolo, de principio a fin y sin necesidad de renderizar una página |
| Pago programático | El pago presupone una tarjeta guardada vinculada a la cuenta de facturación de una persona | Pago mediante una clave de API facturada a una cuenta o una transacción firmada por una billetera: algo que puede conservar una entidad no humana |
| Controles de política | Nada impide que un script haga todo lo que permitan las credenciales | Límites de gasto, pasos de confirmación o claves de alcance limitado que la persona configura una vez, para que el agente opere dentro de unos límites |

Esta es la versión resumible de la definición: **un registrador nativo para agentes es aquel que obtiene un sí en descubrimiento, documentación en lenguaje natural, errores legibles por máquina, compra sin navegador y pago programático; los controles de política son la parte que toda la categoría todavía está resolviendo.**

## Descubrimiento: llms.txt y MCP son el mapa del sitio para los agentes

Un desarrollador encuentra una API buscando o haciendo clic por un sitio de documentación. Un agente necesita un archivo que pueda obtener y leer de una vez, o una conexión de protocolo que pueda consultar para conocer las operaciones disponibles. Hoy hay dos mecanismos que cumplen esa función.

[llms.txt](https://llmstxt.org) es, en palabras de la propia propuesta, [«una propuesta para estandarizar el uso de un archivo `/llms.txt` que proporcione información para ayudar a los LLM a utilizar un sitio web en el momento de la inferencia»](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time). Es la misma idea que `robots.txt`, pero, en lugar de indicar a un rastreador qué puede indexar, indica a un modelo de lenguaje qué es un sitio y cómo usarlo. Consulta [llms.txt para dominios: una API que cualquier agente de IA puede leer](/es/blog/llms-txt/) para ver cómo se ve ese archivo cuando un registrador publica uno.

[MCP (Model Context Protocol)](https://modelcontextprotocol.io) resuelve un problema adyacente: es [«un estándar de código abierto para conectar aplicaciones de IA con sistemas externos»](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems). Mientras que llms.txt es un documento que un agente lee una vez para orientarse, MCP es una conexión activa que el cliente del agente abre con un servidor que expone un conjunto definido de herramientas invocables. Son complementarios, no competidores: llms.txt permite al agente descubrir que un registrador existe y saber, a grandes rasgos, qué puede hacer; MCP es la forma en que el cliente del agente se conecta realmente e invoca las operaciones.

Namefi publica ambos. El punto de entrada en [namefi.io/llms.txt](https://namefi.io/llms.txt) documenta un servidor MCP en `api.namefi.io/mcp`, un archivo de descubrimiento de MCP en `namefi.io/.well-known/mcp/servers.json` y una referencia REST completa, junto con archivos complementarios para pagos con billetera y flujos de trabajo de agentes salientes. Al comprobar directamente dos operadores establecidos, la documentación de registradores de Cloudflare publica su propio `llms.txt` en `developers.cloudflare.com/registrar/llms.txt`, pero nada de su documentación pública afirma que Cloudflare ejecute un servidor MCP dedicado para el producto de registrador. La propuesta de la beta, según la información publicada, es que [la API está «diseñada para funcionar dentro de las herramientas donde los desarrolladores ya trabajan: editores de código con compatibilidad con MCP como Cursor y Claude Code»](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code). Eso es más limitado: el editor es compatible con MCP, no necesariamente el propio registrador de Cloudflare. El portal para desarrolladores de GoDaddy, comprobado directamente, documenta endpoints REST para un desarrollador humano y, hasta la fecha, no muestra referencia alguna a `llms.txt` ni a un servidor MCP.

## Pagos: por qué una tarjeta guardada bloquea a los agentes y qué la sustituye

El paso de compra es donde más cuesta eliminar la premisa de que haya una persona en el circuito, porque la infraestructura de pagos web de consumo se construyó alrededor de una persona: una tarjeta guardada, una dirección de facturación y, a veces, un CAPTCHA pensado para filtrar a cualquiera que no sea una persona. Un agente no puede completar un formulario de tarjeta y entregarle el número de tarjeta sin procesar de una persona para que se haga pasar por ella es un mal modelo de seguridad, aunque sea técnicamente posible.

Se están lanzando dos alternativas. La primera es la facturación con clave de API: el registrador emite una credencial vinculada a una cuenta prefinanciada o facturada, y el agente autentica cada llamada con esa clave en vez de con una tarjeta. La documentación de Namefi describe cómo generar esta clave en [namefi.io/api-key](https://namefi.io/api-key) y enviarla como encabezado `x-api-key` en cada solicitud, sin sesión de navegador ni formulario de tarjeta. Los precios de `.ai` de Cloudflare siguen la misma lógica de coste: [ofrece «registros y renovaciones de dominios .ai a precios mayoristas, sin recargos adicionales»](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups). Un precio plano y previsible es más fácil de razonar para un agente que uno que varía según la promoción.

La segunda alternativa es el pago firmado por una billetera, que elimina la propia cuenta, no solo la tarjeta. La documentación `web3` de Namefi describe un flujo basado en el código de estado HTTP 402 y el patrón [x402](/es/glossary/x402/): una solicitud de un dominio sin pago devuelve los precios en una respuesta 402, la billetera del solicitante firma una autorización EIP-3009 y esa autorización firmada se vuelve a enviar como encabezado para completar el registro y la liquidación en un solo paso, explícitamente [«sin necesidad de una cuenta de Namefi ni de firma EIP-712»](https://namefi.io/web3/llms.txt). La idea aquí es más acotada: es un método de pago que el software puede conservar y usar por sí mismo, algo que una tarjeta de crédito guardada no puede hacer por su propia estructura. Consulta [Paga dominios con una billetera cripto: sin necesidad de cuenta](/es/blog/wallet-checkout/) para ver ese flujo de principio a fin.

## Controles de política: la fila que toda la categoría aún no ha resuelto

Esta es la brecha honesta. El descubrimiento, la documentación legible por máquina, los errores estructurados y el pago programático son cosas que un registrador puede construir una vez y poner en producción. Los controles de política —topes de gasto, un paso de confirmación por encima de un umbral o una clave limitada a un TLD o a un presupuesto— son distintos, porque protegen a la persona que delegó la autoridad, no la facilidad de uso de la API.

Al comprobar la documentación de Namefi, el caso más verificable, se ve que marca determinadas operaciones como relevantes y documenta errores estructurados y legibles por máquina (códigos estables, una marca `retryable` y detalles estructurados): un avance real en esa fila. Pero no encontramos un mecanismo de límite de gasto documentado ni una puerta de confirmación del lado del servidor en la referencia pública de la API hasta la fecha; esa salvaguarda vive hoy una capa por encima, en la política que la persona configure en el propio cliente MCP. Tampoco encontramos documentación pública de un mecanismo de límite de gasto en las API de registrador de Cloudflare o Name.com. Esta es la fila que todo registrador nativo para agentes debería cerrar a continuación.

## Puntuación de las plataformas actuales según la lista

Así puntúan las tres plataformas más mencionadas en este espacio frente a la lista de seis elementos, según lo que verificamos directamente en la documentación pública de cada plataforma, en lugar de basarnos en textos de marketing:

| Registrador | Descubrimiento | Documentación en lenguaje natural | Errores legibles por máquina | Compra sin navegador | Pago programático | Controles de política |
| --- | --- | --- | --- | --- | --- | --- |
| Namefi | Sí: llms.txt + servidor MCP | Sí: familia de archivos llms.txt | Sí: códigos estructurados | Sí: REST + MCP | Sí: clave de API o billetera (x402) | Aún no documentados |
| Cloudflare Registrar | Parcial: su propio llms.txt; MCP está al nivel del editor, no es un servidor dedicado confirmado | Sin confirmar: no se verificó más allá del índice de llms.txt | Sin confirmar: no se verificó en la documentación pública | Sí: controlada por API según la información de la beta | Sí: clave de API, precios a coste | Aún no documentados |
| Name.com | Sin confirmar: no se encontró llms.txt en la raíz del dominio comprobada | Lo afirma el propio anuncio de Name.com, sin verificación independiente adicional | No se encontró en la documentación heredada revisada; sin confirmar para la API más reciente | Sin verificación independiente | Parcial: solo se documenta la facturación mediante crédito de cuenta | Aún no documentados |

La única fila que está vacía en todos los casos, los controles de política, es una verdadera brecha de toda la industria, no un reproche a una sola plataforma. Vale la pena revisarla de nuevo a medida que avance este espacio.

## Preguntas frecuentes

### ¿Qué es un registrador de dominios nativo para agentes?

Un registrador nativo para agentes es aquel que un agente de IA puede descubrir, entender y usar para realizar transacciones por sí mismo: sin navegador, sin que una persona lea antes la documentación ni introduzca un número de tarjeta. Obtiene un sí en descubrimiento (un archivo `llms.txt` o un servidor MCP), documentación en lenguaje natural, errores legibles por máquina, compra sin navegador y pago programático; los controles de política —límites de gasto y puertas de confirmación— son la parte que la categoría todavía está construyendo.

### ¿Por qué los agentes de IA no pueden usar las API de registrador normales?

Técnicamente pueden llamar a los endpoints, pero la mayoría de las API de registradores presuponen que un desarrollador humano ya leyó la documentación y escribió por adelantado el código de integración. Un agente sin una integración previa no tiene una forma estándar de descubrir la URL base, conocer el esquema de autenticación o interpretar un mensaje de error en prosa. La API funciona solo porque una persona ya hizo ese trabajo interpretativo, no porque sea legible para un agente que parte desde cero.

### ¿Cuál es la diferencia entre llms.txt y MCP?

`llms.txt` es un archivo de texto plano que un agente lee una vez para saber qué es un sitio o una API y cómo utilizarlo: cumple el mismo papel que `robots.txt` para los rastreadores, pero está escrito para modelos de lenguaje. [MCP](https://modelcontextprotocol.io) es una conexión de protocolo activa que el cliente de un agente abre con un servidor que expone herramientas invocables. Son complementarios: llms.txt sirve para el descubrimiento y MCP es la conexión que el agente usa para actuar. Consulta [llms.txt para dominios: una API que cualquier agente de IA puede leer](/es/blog/llms-txt/) para la mitad dedicada al descubrimiento.

### ¿Cómo hago que mi propia API sea utilizable por agentes?

Publica un `llms.txt` que describa tu API para los modelos, expón un servidor MCP —o, como mínimo, endpoints documentados con OpenAPI—, devuelve errores estructurados con códigos estables en vez de texto, asegúrate de que cada operación de escritura se complete sin una página de pago alojada, admite un método de pago que no presuponga una tarjeta humana y añade límites de gasto o de confirmación para que quien tenga las credenciales pueda delimitar lo que el agente puede hacer.

### ¿Namefi es nativo para agentes?

Según la lista anterior, Namefi obtiene un sí en cinco de las seis filas verificadas directamente: publica una familia de archivos `llms.txt` y un servidor MCP, su documentación está estructurada para el consumo de agentes, su API devuelve errores estructurados y legibles por máquina, el registro se completa íntegramente mediante la API o el flujo de billetera basado en x402 sin necesidad de un panel de control, y el pago funciona con una clave de API o una transacción firmada por una billetera sin requerir una cuenta. Los controles de política aún no están documentados en la referencia pública de la API; ese control reside actualmente del lado del cliente. <!-- TODO: confirm with team — whether a spend-cap or purchase-confirmation feature is on the near-term roadmap -->

### ¿Tener un servidor MCP convierte automáticamente a un registrador en nativo para agentes?

No. La compatibilidad con MCP cubre el descubrimiento y la compra sin navegador, pero un registrador puede exponer un servidor MCP y aun así devolver errores no estructurados, seguir exigiendo una tarjeta guardada o seguir sin tener un mecanismo de límite de gasto. Ser nativo para agentes implica cumplir toda la lista, no una sola fila.

## Fuentes y lecturas adicionales

- Wikipedia — [Extensible Provisioning Protocol (EPP se estandarizó como Proposed Standard en marzo de 2004)](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- CircleID — [El universo de los dominios en 2026: IA, seguridad, madurez del mercado y la nueva frontera de los gTLD («Los agentes de IA actúan cada vez más como revendedores de dominios...»)](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- webhosting.today — [Los agentes de IA ya pueden registrar dominios, sin intervención humana (beta de la API de Cloudflare Registrar, abril de 2026)](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code)
- Name.com — [La primera plataforma de dominios nativa para IA («compatible con estándares modernos como Model Context Protocol...»)](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=Our%20platform%20is%20supported%20by%20modern%20standards%20like%20Model%20Context%20Protocol)
- llmstxt.org — [La propuesta del archivo /llms.txt](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- modelcontextprotocol.io — [Qué es Model Context Protocol (MCP)](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Schema.org — [FAQPage](https://schema.org/FAQPage)
- Cloudflare — [Compra dominios .ai al coste](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)
- Cloudflare Developers — [Índice de documentación del registrador (llms.txt)](https://developers.cloudflare.com/registrar/llms.txt)
- Namefi — [namefi.io/llms.txt (referencia de la API y del servidor MCP; fuente de referencia para las afirmaciones sobre el producto Namefi en este artículo)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt (flujo de pago firmado por billetera / x402, «sin necesidad de una cuenta de Namefi ni de firma EIP-712»)](https://namefi.io/web3/llms.txt)
