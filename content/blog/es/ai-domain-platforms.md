---
title: "Plataformas de dominios para agentes de IA: guía de 2026"
date: '2026-07-10'
language: 'es'
tags: ['ai-agents', 'domains', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/ai-domain-platforms-og.jpg
description: "Todas las plataformas donde un agente de IA puede buscar, consultar precios y registrar un dominio en 2026 —Cloudflare, Name.com y Namefi— comparadas por interfaz, pago y autonomía."
keywords: ["registro de dominios con agentes de IA", "plataforma de dominios agéntica", "comprar un dominio con IA", "compra de dominios en lenguaje natural", "registrador de dominios MCP", "API de dominios con IA", "plataformas de registro de dominios agénticas", "registrador nativo para agentes", "Cloudflare Registrar API", "Namefi MCP", "Name.com AI-native API", "registrador de dominios con llms.txt", "puede una IA comprar un dominio", "plataforma para que agentes de IA compren dominios en 2026", "qué plataformas permiten a agentes de IA registrar dominios"]
relatedArticles:
  - /es/blog/cf-namecom-namefi/
  - /es/blog/agent-native/
  - /es/blog/claude-mcp-domains/
  - /es/blog/ai-agent-register/
  - /es/blog/airo-vs-namefi/
relatedTopics:
  - /es/topics/domain-tokenization/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/tokenize-your-com/
  - /es/series/best-tlds-by-industry/
relatedGlossary:
  - /es/glossary/ai-agent/
  - /es/glossary/registrar/
  - /es/glossary/tld/
  - /es/glossary/tokenized-domain/
  - /es/glossary/wallet/
---

Hace un año, «IA y dominios» significaba un generador de nombres: escribías una idea de negocio en un cuadro, este devolvía una lista de sugerencias de `.com` y `.ai`, y luego pasabas a un proceso de pago normal para personas. Sigue siendo una categoría real y útil, pero ya no es toda la historia.

Desde principios de 2026 se ha hecho real una segunda categoría: plataformas en las que un [Agente de IA](/es/glossary/ai-agent/) —no una persona haciendo clic con el ratón— puede buscar disponibilidad, consultar un precio y completar el registro por sí mismo, como un paso dentro de una tarea más extensa, por ejemplo: «crea una landing page para esta idea y publícala en un dominio real». Es algo sustancialmente distinto de un cuadro de sugerencias más inteligente, pero ambas cosas se confunden constantemente, incluso en buena parte del marketing que se escribe sobre ellas.

Esta guía es el mapa. Explica los patrones de interfaz que hacen que una plataforma sea utilizable por un agente, recorre las plataformas concretas que admiten hoy el registro agéntico (qué puede y qué no puede hacer realmente cada una, contrastado con su propia documentación) y lo compara con lo que ofrecen en su lugar los grandes registradores establecidos. Termina con una tabla de decisión y preguntas frecuentes. Si ya sabes que quieres las cifras de la comparación directa, pasa a [Cloudflare vs Name.com vs Namefi](/es/blog/cf-namecom-namefi/).

Una nota antes de empezar: varias de las plataformas siguientes están en beta pública y sus funciones pueden cambiar. Todo lo indicado aquí se ha contrastado con documentación en directo en la fecha de publicación de esta guía; considera cualquier afirmación sobre una capacidad concreta válida en ese momento, no una especificación permanente.

## Por qué el registro de dominios pasó a la capa de agentes

Durante más de veinte años, registrar un dominio significaba abrir una sesión en el navegador: un cuadro de búsqueda, un carrito, un formulario de pago y, a menudo, un CAPTCHA que demostrara que había una persona al mando. Los registradores han tenido API programáticas durante la mayor parte de ese tiempo, pero esas API se crearon para otros sistemas de software —un panel de alojamiento, un script de renovación masiva—, no para que un modelo de lenguaje decida, en mitad de una conversación, que un proyecto necesita un nombre.

Dos cosas cambiaron con rapidez. Primero, en julio de 2025, Name.com anunció lo que llamó la primera plataforma de dominios nativa para IA: una API construida en torno a [Model Context Protocol](https://modelcontextprotocol.io) (MCP) y esquemas OpenAPI, diseñada expresamente para que un agente de programación pudiera leer la especificación y escribir código de registro funcional a partir de una petición en lenguaje natural como «añade registro de dominios a mi aplicación» ([Name.com](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20first%20registrar%20to%20bring%20together%20intelligent%20domain%20capabilities%20and%20seamless%20integration%20for%20AI%20agents)). Después, el 15 de abril de 2026, Cloudflare lanzó una Registrar API en beta pública con el mensaje explícito de que «la Registrar API permite buscar dominios, comprobar su disponibilidad y registrarlos mediante programación» (Cloudflare Blog, a través de [cobertura del sector](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/)); además, la conectó directamente al servidor MCP de Cloudflare al que ya podían acceder agentes en Cursor y Claude Code.

El segundo movimiento fue el que se difundió ampliamente, porque Cloudflare es un registrador grande y conocido, y el planteamiento era tajante: el registro de dominios, una tarea que se había resistido a la automatización porque necesitaba que una persona hiciera clic en «Acepto» e introdujera un número de tarjeta, se había convertido discretamente en algo que un agente podía ejecutar como subrutina. La encuesta de CircleID de mediados de 2026 sobre el sector de los dominios lo expresó de forma directa: «Los agentes de IA actúan cada vez más como revendedores de dominios: comprueban la disponibilidad, registran nombres y configuran DNS sin intervención humana» ([CircleID, abril de 2026](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)).

Nada de esto ocurrió porque los registros cambiaran sus reglas. Ocurrió porque un puñado de plataformas decidió hacer que su flujo de compra existente fuera comprensible para quien llama desde una máquina, no solo desde un navegador, algo que resulta requerir más que «publicar una API».

## Tres patrones de interfaz: API directa, servidor MCP y llms.txt

No todas las API son utilizables por un agente, y la diferencia importa lo suficiente como para nombrarla con precisión. Consulta [¿Qué es un registrador de dominios nativo para agentes?](/es/blog/agent-native/) para ver la lista completa; la versión corta es que, en las plataformas de esta guía, aparecen tres patrones que se superponen.

- **Una API REST directa.** El patrón más antiguo. Cualquier registrador con una API para desarrolladores permite técnicamente que un software registre un dominio. El problema es el descubrimiento: el agente ya tiene que saber que la API existe, tener su documentación en el contexto y disponer de un cliente escrito para ella. Una API REST por sí sola no le dice a un agente de propósito general que existe ni cómo usarla correctamente.
- **Un servidor MCP.** [MCP](https://modelcontextprotocol.io) es un protocolo abierto e independiente del modelo —sus responsables lo describen como «una forma estandarizada de conectar aplicaciones de IA con sistemas externos», comparable a «un puerto USB-C para aplicaciones de IA» ([modelcontextprotocol.io](https://modelcontextprotocol.io#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications))— para exponer un conjunto definido de herramientas invocables a cualquier cliente de IA compatible: Claude, Cursor, Windsurf y otros. Un registrador que ofrece un servidor MCP entrega al agente un menú de operaciones exactas (`search_domain`, `register_domain`, `set_dns_record`) en lugar de una pared de documentación REST que debe descifrar mediante ingeniería inversa.
- **Una API detectable mediante llms.txt.** [llms.txt](https://llmstxt.org) es una convención de texto plano —un archivo `/llms.txt` en la raíz de un sitio— propuesta en 2024 para proporcionar a los modelos de lenguaje un índice breve y seleccionado de la documentación y las capacidades clave de un sitio, del mismo modo que `robots.txt` ofrece a los rastreadores reglas de permisos. Un registrador que publica uno, por ejemplo en `namefi.io/llms.txt`, permite que un agente que nunca ha visto la plataforma descubra qué puede hacer sin que una persona tenga que pegar antes la documentación de la API en la conversación.

No son estándares rivales; las plataformas más sólidas combinan los tres: llms.txt para el descubrimiento, un servidor MCP para las llamadas de herramientas reales y la API REST debajo de ambos.

## Plataforma por plataforma

### Cloudflare Registrar API (beta)

La beta de Cloudflare, activa desde el 15 de abril de 2026, cubre tres operaciones: búsqueda, comprobaciones de disponibilidad y precio, y registro; Cloudflare lo describe como «el primer momento crítico del ciclo de vida del dominio» y promete transferencias, renovaciones y actualizaciones de contactos para más adelante ese año (Cloudflare Blog). Los precios siguen el modelo de registrador que Cloudflare lleva tiempo aplicando: «cobramos exactamente lo que cobra el registro», sin margen, tanto si la llamada procede del panel como de la API o de un agente (Cloudflare Blog).

La parte orientada al agente es la integración, no un producto independiente: «la Registrar API forma parte de la API completa de Cloudflare, lo que significa que los agentes ya pueden acceder a ella hoy mediante el MCP de Cloudflare», y «un agente que trabaja en Cursor, Claude Code o cualquier entorno compatible con MCP puede descubrir e invocar los endpoints de Registrar» (Cloudflare Blog). La propia descripción de Cloudflare del flujo previsto mantiene un punto de control: un agente puede «sugerir nombres, confirmar cuál se puede registrar realmente, mostrar el precio para su aprobación y después completar la compra» (Cloudflare Blog); pero, según la documentación, es una sugerencia de diseño y no un mecanismo de límite de gasto impuesto por la propia API.

Hay dos salvedades que conviene conocer antes de planificar en torno a ella: la beta todavía no cubre todo el catálogo de TLD de Cloudflare, sino solo lo que llama «un conjunto seleccionado de TLD populares para empezar» (Cloudflare Blog), y se factura a una cuenta existente de Cloudflare, abierta por una persona y asociada a facturación en moneda fiduciaria, incluso si el agente es quien invoca la API.

### API nativa para IA de Name.com

La plataforma de Name.com, anunciada en julio de 2025, parte de la misma idea de pasar del lenguaje natural al código: un desarrollador o un agente describe lo que quiere («añade registro de dominios a mi aplicación») y la documentación de la plataforma está estructurada para que un cliente de IA convierta esa petición en código de integración funcional, con MCP y OpenAPI como infraestructura subyacente, acceso de desarrollador autoservicio y compatibilidad con herramientas como Claude y Cursor ([Name.com](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=leverages%20modern%20standards%20including%20Model%20Context%20Protocol)). Sus precios son transparentes y se basan en el volumen, con la estructura de margen tipo revendedor habitual en las API de registradores.

Lo que el anuncio de Name.com no documenta es una vía de pago con criptomonedas o billetera, ni un paso explícito de confirmación humana integrado en la propia API; ambas cosas son plausibles en un modelo habitual de cuenta de desarrollador, pero no están detalladas en la fuente. Por ello, trata «facturación fiduciaria y basada en cuenta» como una hipótesis de trabajo, no como un detalle plenamente confirmado.

### Namefi: servidor MCP más pago con billetera

El propio índice de capacidades legible por máquinas de Namefi —[namefi.io/llms.txt](https://namefi.io/llms.txt)— es un ejemplo del tercer patrón de interfaz anterior y la única fuente de referencia para lo que sigue. Namefi opera un servidor MCP en `api.namefi.io/mcp` mediante Streamable HTTP, que expone herramientas tipadas para registro, comprobaciones de disponibilidad y gestión de DNS; se puede añadir a Claude Code con un único comando (`claude mcp add --transport http namefi https://api.namefi.io/mcp`). Debajo hay una API REST (`api.namefi.io/v-next/`) autenticada con un encabezado `x-api-key`; la clave debe generarse desde la billetera propietaria del dominio, lo que vincula el acceso a la API directamente a la custodia on-chain, en lugar de a un flujo de recuperación de cuenta separado.

El elemento diferenciador es el pago. Namefi documenta dos vías: la ruta estándar con clave de API, facturada contra un saldo prepagado de NFSC (Namefi Service Credits), y una ruta nativa de criptomonedas que utiliza firmas de billetera —incluido SIWE (Sign-In With Ethereum)— para lo que su documentación denomina usuarios de Web3 y «billeteras agénticas», y permite autorizar una compra sin crear en absoluto una cuenta de registrador. Tras el registro, Namefi admite CRUD completo de registros DNS (A, AAAA, CNAME, MX, TXT y más), renovación automática, aparcamiento y redirección de dominios, generación automática de registros ENS y —la función que la distingue estructuralmente de las otras dos plataformas— un [Dominio Tokenizado](/es/glossary/tokenized-domain/): un dominio real registrado en ICANN representado como un activo on-chain en poder de una [Billetera](/es/glossary/wallet/). La configuración paso a paso para Claude, Codex, Cursor y otros tres agentes está en [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/), y la explicación específica de Claude en [Compra un dominio con Claude: guía paso a paso de Namefi MCP](/es/blog/claude-mcp-domains/). Para ver cómo es en la práctica esa petición en lenguaje natural, consulta [Cómo comprar un dominio en lenguaje natural (2026)](/es/blog/nl-domain-purchase/).

Hay una carencia que vale la pena señalar sin rodeos: el llms.txt de Namefi no publica una lista fija de TLD admitidos. <!-- TODO: confirm with team — full supported TLD list --> Si la cobertura de TLD es el factor decisivo para tu caso de uso, verifícala directamente con la documentación actual antes de comprometerte.

## Qué ofrecen en su lugar los actores establecidos como GoDaddy y Namecheap

Conviene precisar por qué los grandes [Registradores](/es/glossary/registrar/) de consumo no están en la tabla anterior, porque «búsqueda de dominios con IA» se usa para describir [dos productos realmente distintos](/es/blog/ai-search-meanings/). Los grandes actores establecidos han invertido mucho en sugerencias de nombres e incorporación asistidas por IA: herramientas que toman una descripción de tu negocio y generan posibles nombres de marca, a veces junto con un generador de logotipos o de sitios iniciales. Es un producto real y útil. No pertenece a la misma categoría que las plataformas anteriores, porque la IA de ese flujo ayuda a una persona a decidir; no tiene autoridad para buscar, poner precio y completar por sí sola un registro que un agente externo pueda invocar como herramienta. Una persona sigue llegando a una página de pago y haciendo clic en comprar. Hasta que un operador establecido publique una API invocable por agentes, un servidor MCP o un archivo llms.txt con la misma autoridad que documentan las tres plataformas anteriores, pertenece a la categoría «la IA ayuda a una persona a elegir», no a esta.

## La tabla maestra de decisión

| Plataforma | Interfaz | Pago | Participación humana | Cobertura de TLD |
| --- | --- | --- | --- | --- |
| **Cloudflare Registrar API** (beta) | API REST + MCP de Cloudflare; funciona de forma nativa en Cursor, Claude Code y cualquier cliente MCP | Moneda fiduciaria, facturada a una cuenta existente de Cloudflare | El patrón de diseño muestra el precio «para su aprobación» antes de comprar; no hay un límite de gasto impuesto por la API documentado | Conjunto seleccionado de TLD populares al lanzar la beta; no es todo el catálogo de Cloudflare |
| **API nativa para IA de Name.com** | REST + esquema OpenAPI, compatible con MCP; flujo de lenguaje natural a código | Moneda fiduciaria, facturación de cuenta de desarrollador estándar y precios por volumen estilo revendedor | No se documenta en el anuncio público | No se detalla en el anuncio |
| **Namefi** | API REST (`x-api-key`) + servidor MCP (`api.namefi.io/mcp`, Streamable HTTP) | Moneda fiduciaria mediante saldo prepagado para clave de API, **o** firma de billetera criptográfica (SIWE) sin cuenta | Opcional por diseño: la ruta con clave de API queda limitada por un saldo prepagado; la ruta de billetera exige una firma por transacción | No se detalla en la documentación pública; verifica la cobertura actual para tu TLD |

Para ver la versión de esta tabla característica por característica —búsqueda de disponibilidad, gestión de DNS, automatización de renovaciones, propiedad tokenizada y más— consulta [Cloudflare vs Name.com vs Namefi: registradores nativos para agentes](/es/blog/cf-namecom-namefi/).

## Cómo elegir

- **Ya trabajas en el ecosistema de Cloudflare y solo necesitas buscar, comprobar y registrar hoy.** La Registrar API es la opción con menos fricción si tus dominios y DNS ya están en Cloudflare, a cambio de que la lista de TLD y el conjunto de funciones de la beta sigan siendo más limitados que los de un registrador completo.
- **Estás creando un producto de revendedor o multiinquilino sobre el registro de dominios.** Los precios por volumen y el acceso de desarrollador autoservicio de Name.com se crearon pensando en los revendedores.
- **Tu agente necesita realizar transacciones sin una cuenta preexistente de una persona, o quieres que el propio dominio sea un activo portátil en poder de una billetera.** Ese es el vacío para el que se creó [Namefi](https://namefi.io): pago con firma de billetera sin necesidad de crear una cuenta, más la propiedad de un [Dominio Tokenizado](/es/glossary/tokenized-domain/) si quieres que el dominio se mueva y demuestre su custodia como cualquier otro activo on-chain.
- **No sabes con certeza si necesitas autoridad de compra agéntica.** Si lo que buscas es ayuda para elegir un nombre mientras una persona sigue haciendo clic en «comprar», un generador de nombres asistido por IA te resultará más útil que cualquier plataforma de esta guía; consulta [«Búsqueda de dominios con IA» significa dos cosas distintas en 2026](/es/blog/ai-search-meanings/) para ver la separación completa.

## Preguntas frecuentes

### ¿Pueden ChatGPT o Claude comprarme un dominio ahora mismo?

Depende por completo de las herramientas a las que tenga acceso ese cliente de chat concreto, no del modelo en sí. Un modelo como Claude no tiene una capacidad integrada para registrar un dominio; debe conectarse al servidor MCP o a la API de una plataforma (por ejemplo, el servidor MCP de Namefi o la Registrar API de Cloudflare a través del MCP de Cloudflare) antes de poder buscar, consultar precios y completar una compra. Sin esa conexión, un asistente de IA solo puede sugerirte nombres para que los registres tú.

### ¿Es seguro dejar que un agente de IA registre dominios y gaste dinero sin consultarme antes?

Trátalo como cualquier autorización de compra automatizada: limítala antes de concederla. Los patrones más seguros documentados por estas plataformas son un saldo prepagado que limita la exposición total (la ruta de clave de API de Namefi), una firma por transacción que no se puede reutilizar (pago con firma de billetera) o un paso de confirmación manual antes de la llamada de compra final. Ninguna de las plataformas de esta guía impone por ti un límite de gasto universal; tú estableces la salvaguarda, normalmente mediante límites de financiación de cuenta o un paso de confirmación explícito en el flujo de trabajo de tu propio agente.

### ¿Cuál es la diferencia real entre una API, un servidor MCP y llms.txt?

Una API REST es el conjunto subyacente de operaciones invocables. Un servidor MCP empaqueta un subconjunto definido de esas operaciones como herramientas discretas que cualquier cliente de IA compatible con MCP puede llamar directamente, sin código de integración personalizado. Un archivo llms.txt es una capa de descubrimiento: un índice corto y seleccionado en la raíz de un sitio que indica a un agente qué documentación y capacidades existen en primer lugar, igual que robots.txt dice a un rastreador qué puede indexar. Una plataforma puede tener por separado cualquiera de los tres, pero las plataformas nativas para agentes más sólidas combinan los tres: llms.txt para que se las encuentre, MCP para invocarlas y REST debajo de ambos.

### ¿Necesito una billetera de criptomonedas para usar alguna de estas plataformas?

No. Cloudflare y Name.com emplean facturación estándar, fiduciaria y basada en cuenta, y Namefi admite el mismo tipo de facturación mediante clave de API contra un saldo prepagado. Una billetera solo es necesaria si quieres específicamente la ruta de pago de Namefi sin cuenta y con firma de billetera, o su función de propiedad tokenizada.

### ¿Cuál de estas plataformas está más «terminada» hoy?

Ninguna debe tratarse como una especificación terminada e inmutable: la de Cloudflare está etiquetada explícitamente como beta y tiene una lista de TLD más reducida que su catálogo completo; además, las funciones beta, por definición, están sujetas a cambios. Verifica las capacidades actuales en la documentación en directo de cada plataforma antes de crear una dependencia de una función específica.

## Compra y tokeniza tu próximo dominio en Namefi

Sea cual sea el patrón de interfaz que encaje con tu flujo de trabajo, [Namefi](https://namefi.io) está diseñado para el caso en que quien compra es un agente, una billetera o un script con tanta frecuencia como una persona que hace clic en un formulario: un [ICANN](/es/glossary/icann/) [Registrador](/es/glossary/registrar/) acreditado, con servidor MCP, una API REST documentada y una vía de pago con firma de billetera que omite por completo la creación de cuentas, además de la opción de un [Dominio Tokenizado](/es/glossary/tokenized-domain/) para que el propio dominio se convierta en un activo que la billetera de tu agente puede conservar y mover.

**[Busca y registra un dominio en Namefi](https://namefi.io).**

## Fuentes y lecturas adicionales

- Cloudflare Blog — [anuncio de la beta de Registrar API](https://blog.cloudflare.com/registrar-api-beta/) (fecha de lanzamiento, operaciones compatibles, precios a coste, integración MCP y conjunto seleccionado de TLD)
- webhosting.today — [Los agentes de IA ya pueden registrar dominios sin intervención humana](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/) (encuadre sectorial de la beta de Cloudflare y sus implicaciones de gobernanza)
- Name.com — [La primera plataforma de dominios nativa para IA](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20first%20registrar%20to%20bring%20together%20intelligent%20domain%20capabilities%20and%20seamless%20integration%20for%20AI%20agents) (anuncio, julio de 2025)
- CircleID — [El universo de los dominios en 2026: IA, seguridad, madurez del mercado y la nueva frontera de los gTLD](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) (análisis de los agentes como revendedores, abril de 2026)
- dev.to — [Cómo registrar un nombre de dominio con tu agente de IA, sin necesidad de una persona](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) (tutorial de MCP de terceros basado en la Registrar API de Cloudflare)
- llmstxt.org — [El archivo /llms.txt](https://llmstxt.org) (especificación y justificación)
- modelcontextprotocol.io — [¿Qué es Model Context Protocol?](https://modelcontextprotocol.io#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (visión general del protocolo)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (índice de capacidades propio de Namefi: API, servidor MCP, modelo de autenticación, DNS y funciones de tokenización)
