---
title: "llms.txt para dominios: una API que cualquier agente de IA puede leer"
date: '2026-07-10'
language: 'es'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
format: explainer
ogImage: ../../assets/llms-txt-og.jpg
description: "Un recorrido por namefi.io/llms.txt: cómo un archivo de texto plano permite a cualquier agente de IA descubrir y usar la API completa de un registrador, y cómo se complementa con MCP."
keywords: ["llms.txt", "ejemplo de llms.txt", "qué es llms.txt", "documentación de API legible para IA", "descubrimiento de API", "robots.txt para IA", "llms.txt frente a MCP", "namefi.io/llms.txt", "referencia de API legible por máquinas", "API nativa para agentes", "documentación estructurada para LLM", "descubrimiento de API en texto plano", "descriptor de descubrimiento MCP", "registro de dominios con agentes de IA"]
relatedArticles:
  - /es/blog/ai-agent-register/
  - /es/blog/claude-mcp-domains/
  - /es/blog/namefi-mcp/
  - /es/blog/mcp-quickstart/
  - /es/blog/agent-native/
relatedTopics:
  - /es/topics/web3-foundations/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/blockchain-concepts/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/ai-agent/
  - /es/glossary/registrar/
  - /es/glossary/epp/
  - /es/glossary/dns/
  - /es/glossary/seo/
---

Todo [Registrador](/es/glossary/registrar/) con una [EPP](/es/glossary/epp/) tiene documentación en algún lugar: un sitio de documentación, una página de referencia, quizá una especificación OpenAPI tras una pantalla de inicio de sesión. Eso ha bastado durante dos décadas, porque quien leía era un desarrollador que podía navegar y pasar por alto la interfaz de navegación hasta encontrar el párrafo que importaba. Un [Agente de IA](/es/glossary/ai-agent/) que lee el mismo sitio durante la inferencia no tiene ese lujo: cuenta con un presupuesto de contexto fijo, no puede esperar a un portal de documentación renderizado con JavaScript y dispone de una sola oportunidad para averiguar qué hace una API antes de desistir o alucinar un endpoint inexistente.

`llms.txt` resuelve ese problema, y Namefi publica uno en [namefi.io/llms.txt](https://namefi.io/llms.txt). Este artículo explica en qué consiste la convención, por qué existe, qué contiene nuestro propio archivo sección por sección, dónde se detiene deliberadamente y cómo encaja junto al [Model Context Protocol](https://modelcontextprotocol.io) (MCP), en vez de competir con él. También es, intencionalmente, un ejemplo de lo que describe: un proveedor público de API que explica su propio archivo de descubrimiento legible por máquinas en lenguaje sencillo.

## Por qué los agentes no pueden limitarse a rastrear tu sitio de documentación

La razón de ser de `llms.txt` no es especulativa: se expone directamente en la propuesta. El [texto original de Jeremy Howard](https://llmstxt.org) comienza con la limitación que lo motivó: «Los grandes modelos de lenguaje dependen cada vez más de la información de los sitios web, pero afrontan una limitación crítica: las ventanas de contexto son demasiado pequeñas para manejar la mayoría de los sitios web en su totalidad. Convertir páginas HTML complejas, con navegación, anuncios y JavaScript, en texto plano apto para LLM es difícil e impreciso».

Son dos problemas superpuestos. Un sitio real de documentación —navegación, registro de cambios, texto de marketing, aviso de cookies— es sobre todo ruido frente a los pocos párrafos que un agente necesita para una tarea. Además, gran parte de ese ruido está detrás de JavaScript que una obtención sin navegador nunca ejecuta, así que lo que ve el cliente HTTP de un agente ni siquiera es la página que ve una persona. `llms.txt` evita ambos problemas: un único archivo Markdown de texto plano, pensado para leerse completo en lugar de rastrearse y reducirse.

## La analogía con `robots.txt` y dónde deja de funcionar

La comparación con [`robots.txt`](https://www.robotstxt.org) es la forma más rápida de situar `llms.txt` para quien conoce la infraestructura web, y es válida hasta cierto punto. `robots.txt` existe para dar instrucciones a los rastreadores web; en palabras del propio sitio, «Los propietarios de sitios web usan el archivo /robots.txt para dar instrucciones sobre su sitio a los robots web; esto se denomina *The Robots Exclusion Protocol*». Ambos archivos se alojan en una ruta raíz predecible, ambos son texto plano y ambos se dirigen a lectores automatizados, no a personas.

La analogía se rompe en la intención. `robots.txt` es casi por completo una instrucción **negativa**: `Disallow: /some-path` le dice a un rastreador qué *no* debe tocar. `llms.txt` es **positivo**: aquí está qué es este sitio y dónde están las partes que merece la pena leer. Menos una valla y más una tabla de contenidos para quien no puede hojear todo el libro. Ambos son complementarios, y el sitio de Namefi ejecuta los dos.

## Lo que realmente exige la especificación

`llms.txt` no es de formato libre; la propuesta define una estructura Markdown concreta, en este orden: una marca de orden de bytes opcional, un H1 obligatorio con el nombre del sitio, un resumen en bloque de cita, cero o más secciones de detalle sin encabezado y cero o más secciones de «lista de archivos» delimitadas por H2 con enlaces `[name](url): notes`. Un encabezado H2 tiene un significado especial: una sección llamada **Optional** indica «las URL de esta sección se pueden omitir si necesitas un contexto más breve». El archivo de Namefi usa exactamente ese encabezado y hace precisamente lo que describe la especificación.

## Recorrido por namefi.io/llms.txt

Este es el archivo en producción, anotado sección por sección: qué contiene realmente, citado de forma directa y por qué cada parte está configurada de esa manera para un agente que lo lee sin contexto previo.

| Sección (tal como aparece en el archivo) | Qué dice | Por qué tiene esa forma |
| --- | --- | --- |
| H1 + bloque de cita | `# Namefi API` / `> Namefi lets you register traditional domains as NFTs and manage their DNS records via API.` | La apertura obligatoria que pide la especificación: una línea sobre la que un agente puede actuar incluso si no lee nada más. |
| Referencia a MCP, integrada en el resumen | `MCP server (every operation below as MCP tools): https://api.namefi.io/mcp — discovery descriptor at https://namefi.io/.well-known/mcp/servers.json` | Coloca la ruta más rápida —una conexión a un protocolo en vivo— antes que la de texto plano, dentro de las tres primeras líneas. |
| `## Base URLs` | `https://api.namefi.io/v-next/` | Una línea, sin prosa: un agente que construye llamadas HTTP directas necesita exactamente esto. |
| `## MCP Server (for AI agents)` | «Prefer MCP if your client supports it… Add in Claude Code: `claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"`» | Expresa una preferencia y la respalda con un comando que se puede copiar y pegar, en lugar de un párrafo. |
| `## Authentication` | «Generate a key at https://namefi.io/api-key… Works for **all operations**… **Direct HTTP usage (recommended for AI agents):** Pass the header directly — no SDK required» | Deja claro al lector que no se necesita SDK, flujo de OAuth ni sesión del navegador para autenticar una llamada de escritura. |
| `## Domain Registration` | Una secuencia de tres pasos con `curl`: comprobar disponibilidad, enviar `POST /v-next/orders/register-domain` y consultar `GET /v-next/orders/{orderId}` hasta un estado terminal | La transacción central presentada como comandos ejecutables, no como una descripción en prosa de la forma de una solicitud o respuesta. |
| `## DNS Record Management` | Una tabla de once endpoints (`GET`/`POST`/`PUT`/`DELETE` en `/v-next/dns/records`, `/v-next/dns/park`, `/v-next/dns/forwarding`, etc.) con método, ruta, autenticación y una descripción de una línea | Los datos de referencia —muchos endpoints similares— se presentan en una tabla, no en once párrafos. |
| Nota de resolución de problemas | «**UNAUTHORIZED (401):** Your API key is invalid, expired, or not associated with the domain owner's wallet… **Record validation errors:** Check that `zoneName` has no trailing dot, `rdata` for CNAME/MX/NS types has a trailing dot…» | Anticipa los modos de fallo con los que es más probable que se encuentre un agente primero, mediante causa y corrección en vez de una tabla genérica de estados. |
| `## Optional` | Enlaces a la documentación del SDK de TypeScript, al paquete npm `@namefi/api-client`, a una especificación OpenAPI 3 legible por máquinas, a la guía de agentes salientes y a un repositorio de GitHub con scripts de ayuda independientes del firmante | La propia sección de la especificación para «omitir esto si necesitas un contexto más breve»: recursos más profundos, no requisitos previos para el flujo principal anterior. |

El archivo termina apuntando a `namefi.io/llms-full.txt`, el mismo contenido integrado en un solo documento, incluidos los flujos de pago de Web3 y la guía de agentes salientes que el archivo raíz solo enlaza. Esa división refleja el patrón de dos niveles de la propia especificación: mantener el punto de entrada lo bastante corto para caber cómodamente en el contexto y dejar que un agente que necesite más siga un enlace.

## Los archivos complementarios: descubrimiento de web3 y MCP

El archivo raíz enlaza a archivos hermanos para partes de la API que no pertenecen a un punto de entrada de propósito general. [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) documenta las vías de pago que necesita un agente con una billetera, en lugar de una clave de API: un flujo de [x402](/es/glossary/x402/) en el que `GET /x402/domain/{domainName}` devuelve `402 Payment Required` con el precio hasta que se adjunta una cabecera `X-PAYMENT` firmada; una variante de desafío-respuesta MPP (Machine Payable Protocol) firmada mediante la CLI `mppx`; y una vía de firma manual EIP-712 que cubre billeteras de contratos inteligentes. El archivo afirma claramente que el registro con x402 requiere «No Namefi account or EIP-712 signing required — the buyer's wallet signs an EIP-3009 `transferWithAuthorization`». Un agente que solo necesita una clave de API no tiene por qué cargar nada de ello.

El lado de MCP tiene su propio archivo de descubrimiento, totalmente separado de `llms.txt`: [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json), un pequeño descriptor JSON en vez de Markdown:

```json
{
  "servers": [
    {
      "name": "namefi-api",
      "transport": "streamable-http",
      "url": "https://api.namefi.io/mcp",
      "authentication": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key"
      },
      "documentation": "https://namefi.io/llms.txt"
    }
  ]
}
```

Ese descriptor vive bajo `.well-known/`, la misma convención que usa `/.well-known/security.txt` para metadatos detectables por máquinas: un hermano más acotado y tipado en JSON del enfoque de prosa Markdown de `llms.txt`. Su último campo apunta de nuevo a `llms.txt`, de modo que un agente que encuentra primero el servidor MCP aún tiene una ruta hacia la explicación en texto plano de lo que hacen esas herramientas.

## Qué se incluye, qué se deja fuera y por qué

Algunas decisiones parecen deliberadas. Casi todas las operaciones son invocaciones ejecutables de `curl`, no un párrafo que describe un esquema de solicitud: un archivo escrito para algo que ejecuta código, no para algo que redacta su propio resumen. El archivo raíz enlaza en lugar de incluirlo todo, y `llms-full.txt` integra lo que solo referencia: el patrón de gestión del tamaño de la propia especificación, aplicado literalmente. La sección `## Optional` enlaza una especificación OpenAPI 3 completa junto al Markdown, de modo que una herramienta que quiera un esquema estrictamente tipado dispone de uno sin saturar la ruta de lectura principal. Y el pago basado en billetera —x402, MPP, EIP-712— vive en su propio archivo, lo que mantiene la autenticación por clave de API y el registro como lo primero que lee cualquier agente.

<!-- TODO: confirm with team — whether there's a target token/character budget the root llms.txt is written against, and how the split between llms.txt / llms-full.txt / web3/llms.txt / outbound/llms.txt is revisited as the API grows -->

## llms.txt y MCP: descubrimiento frente a conexión

Conviene ser preciso sobre lo que hace cada pieza. `llms.txt` es un documento: un agente lo obtiene una vez y sabe qué es la API y dónde están los recursos más detallados; es texto inerte hasta que algo actúa según lo que dice. [MCP](https://modelcontextprotocol.io), según la descripción del propio protocolo, es «un estándar de código abierto para conectar aplicaciones de IA con sistemas externos»: una sesión en vivo que un cliente abre con un servidor y mediante la cual enumera e invoca herramientas ejecutables.

El archivo de Namefi demuestra la relación directamente: `llms.txt` le indica a un agente que hay un servidor MCP en `api.namefi.io/mcp` y le proporciona el comando `claude mcp add` para conectarse. Lee el archivo, descubre que existe una interfaz de herramientas en vivo, se conecta y actúa. Un agente que va directamente a MCP aún puede encontrar el servidor mediante `.well-known/mcp/servers.json`, pero el campo `documentation` de ese descriptor apunta de vuelta a `llms.txt`, por lo que ambos rara vez operan de forma realmente aislada.

## Orientación para otros proveedores de API

Publicar un `llms.txt` funcional no exige reconstruir tu documentación:

1. **Coloca al principio el H1, el resumen y el método de conexión más rápido**: un agente con poco contexto puede no leer más allá de las primeras líneas.
2. **Muestra solicitudes ejecutables, no prosa sobre esquemas.** Un comando `curl` con nombres de campo reales supera a un párrafo que describe un cuerpo JSON.
3. **Divide por tamaño, no por estructura de equipo.** Un archivo raíz corto, una ampliación más completa y archivos separados para cuestiones como los pagos mantienen corta la ruta habitual.
4. **Documenta los modos de fallo reales**, no solo los códigos de estado: por qué una llamada devuelve 401 frente a 403 importa más que los números.
5. **Usa el encabezado `## Optional` para todo lo que se pueda omitir**, según la propia convención de la especificación.
6. **Publica un descriptor de descubrimiento MCP junto a llms.txt si ejecutas un servidor MCP**: uno responde «qué es esto» y el otro «cómo me conecto».

## Preguntas frecuentes

### ¿Qué es llms.txt?

Una convención propuesta —no un estándar formal de IETF o W3C— para publicar un archivo Markdown de texto plano en la raíz de un sitio web que le indica a un agente de IA qué es el sitio o la API y dónde encontrar más detalles. Define un orden concreto: un título H1, un resumen en bloque de cita, párrafos de detalle opcionales y listas de enlaces delimitadas por H2, con un encabezado «Optional» reservado para material que se puede omitir.

### ¿En qué se diferencia llms.txt de robots.txt?

`robots.txt` es una instrucción negativa para los rastreadores web: qué no indexar, conforme al Robots Exclusion Protocol. `llms.txt` es positivo: qué es un sitio y qué merece la pena leer. Sirven a lectores automatizados distintos y normalmente coexisten en el mismo sitio.

### ¿llms.txt sustituye a MCP?

No. `llms.txt` es un documento que un agente lee una vez para entender qué hace una API; MCP es una conexión de protocolo en vivo que su cliente abre para llamar realmente a las operaciones de esa API. Namefi publica ambos, y `llms.txt` es lo que le indica primero al agente que el servidor MCP existe.

### ¿Qué contiene el archivo llms.txt de Namefi?

La URL base, una referencia a un servidor MCP, una sección de autenticación por clave de API, un flujo de registro de dominios en tres pasos con ejemplos ejecutables de `curl`, una tabla de endpoints para la gestión de registros DNS, endpoints de configuración de dominios, una sección de resolución de problemas y una sección «Optional» que enlaza el SDK, la especificación OpenAPI y archivos complementarios para pagos con billetera y flujos de trabajo de agentes salientes.

### ¿Puedo leer llms.txt yo mismo, sin un agente de IA?

Sí: es Markdown de texto plano, legible tanto para una persona como para un modelo. [namefi.io/llms.txt](https://namefi.io/llms.txt) se lee como una referencia rápida y concisa de API; la misma claridad que ayuda a una persona a revisarlo rápidamente también ayuda a un modelo a analizarlo correctamente.

## Fuentes y lecturas adicionales

- llmstxt.org — [El archivo /llms.txt: contexto, propuesta y especificación de formato](https://llmstxt.org/#:~:text=Large%20language%20models%20increasingly%20rely%20on%20website%20information%2C%20but%20face%20a%20critical%20limitation)
- robotstxt.org — [Acerca de /robots.txt: «En pocas palabras»](https://www.robotstxt.org/robotstxt.html#:~:text=Web%20site%20owners%20use%20the%20/robots.txt%20file%20to%20give%20instructions%20about%20their%20site%20to%20web%20robots%3B%20this%20is%20called%20The%20Robots%20Exclusion%20Protocol)
- modelcontextprotocol.io — [¿Qué es el Model Context Protocol (MCP)?](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (fuente principal de cada extracto anotado de este artículo)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (flujos de pago con billetera x402, MPP y EIP-712)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (descriptor de descubrimiento de MCP)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (ampliación de un solo archivo que integra los archivos complementarios de Web3 y agentes salientes)
- IETF — [RFC 8615, Identificadores uniformes de recursos bien conocidos (la convención `.well-known/`)](https://datatracker.ietf.org/doc/html/rfc8615)

## Lee el archivo tú mismo

La forma más rápida de entender `llms.txt` es abrir uno. [namefi.io/llms.txt](https://namefi.io/llms.txt) es público, no requiere autenticación y es lo bastante corto para leerlo en el tiempo que te llevó leer este artículo: el mismo archivo que lee primero todo agente de IA que se conecta a Namefi. Para saber qué hacen realmente las herramientas MCP que hay detrás, consulta [Servidor MCP de Namefi: herramientas de dominios para agentes de IA](/es/blog/namefi-mcp/); para conectarte desde un editor, la [Guía rápida de MCP](/es/blog/mcp-quickstart/); para ver a un agente ejecutar todo el flujo, [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/).
