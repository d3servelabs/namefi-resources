---
title: "Guía rápida de Namefi MCP: Claude Code, Cursor y Windsurf"
date: '2026-07-10'
language: 'es'
tags: ['ai-agents', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
format: guide
ogImage: ../../assets/mcp-quickstart-og.jpg
description: "Configuración de MCP para cada editor en Claude Code, Cursor y Windsurf, seguida de una guía rápida de cinco pasos para pasar de una aplicación nueva a un dominio personalizado activo sin salir del editor."
keywords: ["dominio mcp de claude code", "dominio mcp de cursor", "dominio mcp de windsurf", "registro de dominios desde el editor", "registro de dominios con agentes de programación", "registrar dominio desde el editor", "guía rápida de mcp", "configuración de namefi mcp", "dominio personalizado de vercel con namefi", "dominio personalizado de cloudflare pages con namefi", "desplegar un dominio personalizado con un agente de IA", "guía rápida para registrar dominios", "configuración mcp x-api-key", "apuntar un dominio a un despliegue"]
relatedArticles:
  - /es/blog/ai-agent-register/
  - /es/blog/claude-mcp-domains/
  - /es/blog/namefi-mcp/
  - /es/blog/wallet-checkout/
  - /es/blog/vibe-coding-domain/
relatedTopics:
  - /es/topics/domain-tokenization/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/tokenize-your-com/
  - /es/series/blockchain-concepts/
relatedGlossary:
  - /es/glossary/ai-agent/
  - /es/glossary/registrar/
  - /es/glossary/dns-record-types/
  - /es/glossary/nameserver/
  - /es/glossary/domain-renewal/
---

Ya estás en el editor. La aplicación está creada, acabas de hacer el primer despliegue en un subdominio de la plataforma y solo falta un dominio real para que la gente pueda acceder a ella. Esta guía rápida explica cómo completar ese registro sin abrir una pestaña del navegador, rellenar un formulario de pago ni salir de la misma sesión del [Agente de IA](/es/glossary/ai-agent/) que creó la aplicación: incluye la configuración exacta de conexión con [MCP](https://modelcontextprotocol.io) para Claude Code, Cursor y Windsurf, un flujo condensado de cinco pasos y, la parte que omiten la mayoría de las guías de dominios, cómo apuntar el dominio recién registrado al despliegue que acabas de publicar.

Esta guía cubre tres editores deliberadamente. Si usas OpenAI Codex, Gemini CLI o Claude Desktop, consulta [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/): es la guía central con una configuración verificada para los seis clientes y la vía REST sin procesar para cualquier herramienta que no sea compatible con MCP de forma nativa. Todo lo que aparece aquí se conecta al mismo servidor MCP de [Namefi](https://namefi.io) que documenta esa guía, así que no hay contradicciones: esta página es una versión condensada, centrada en herramientas de desarrollo, que añade un paso de despliegue que la guía central no cubre.

## Por qué registrar el dominio dentro del editor

«Ve a registrar un dominio» supone un cambio de contexto con un coste inusualmente alto para una tarea de cinco minutos: salir del editor, abrir el sitio de un registrador, buscar un nombre, atravesar un embudo de ventas adicionales de protección de privacidad y alojamiento de correo que no solicitaste, pagar y luego volver para averiguar qué registros DNS añadir.

La alternativa es dejar que el mismo agente que creó el proyecto y configuró el despliegue se encargue también del último tramo: comprobar el nombre, registrarlo y configurar el DNS, todo mediante llamadas a herramientas dentro de la conversación que ya estás teniendo. [Cloudflare promociona una versión de esta misma idea para su propia API Registrar](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=An%20agent%20using%20the%20API%20can%20suggest%20domain%20names%2C%20check%20registrability%2C%20and%20complete%20the%20purchase%20without%20the%20user%20leaving%20their%20current%20context), prueba de que no se trata de una preferencia de nicho, sino de un flujo hacia el que avanza más de un registrador. La sección comparativa al final aborda específicamente el enfoque de Cloudflare; la versión de Namefi añade una opción de [Dominio Tokenizado](/es/glossary/tokenized-domain/) y una vía de pago firmada con billetera sin necesidad de cuenta, explicada en [Paga dominios con una billetera de criptomonedas](/es/blog/wallet-checkout/).

## Configura la conexión: tres editores, tres archivos de configuración

Los tres editores siguientes se conectan al mismo endpoint, `https://api.namefi.io/mcp`, mediante Streamable HTTP y envían tu [clave API de Namefi](https://namefi.io/api-key) como encabezado `x-api-key`. Lo único que cambia en cada editor es el formato del archivo y el comando que lo escribe.

### Claude Code

La documentación de Claude Code ofrece un comando de CLI directo para añadir un servidor HTTP remoto con un encabezado personalizado:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

Ejecútalo una vez desde una terminal del proyecto y sustituye YOUR_KEY por tu clave real. De forma predeterminada, el servidor se guarda con ámbito **local**: estará disponible solo para ti y en este proyecto. Añade `--scope user` para tenerlo disponible en todos los proyectos de tu equipo, y confirma que se conectó con `claude mcp list`.

### Cursor

Cursor lee los servidores MCP desde `mcp.json`: una copia de proyecto en `.cursor/mcp.json` o una copia global en `~/.cursor/mcp.json`. Su formato documentado para servidores remotos admite autenticación mediante encabezados con interpolación de variables de entorno, por lo que la clave no tiene que estar en el archivo:

```json
{
  "mcpServers": {
    "namefi": {
      "url": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

`${env:NAMEFI_API_KEY}` se resuelve con el valor que tenga esa variable en el shell desde el que iniciaste Cursor; expórtala antes de abrir el editor.

### Windsurf (Cascade)

La integración MCP de Windsurf, denominada Cascade, lee `~/.codeium/windsurf/mcp_config.json`. Los servidores remotos usan allí un campo `serverUrl` en lugar de `url`, con el mismo patrón de `headers` y `${env:VAR}` que Cursor:

```json
{
  "mcpServers": {
    "namefi": {
      "serverUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

Conviene señalar algo: a la fecha de publicación de esta guía, `docs.windsurf.com/windsurf/cascade/mcp` redirige a `docs.devin.ai/desktop/cascade/mcp`; la documentación de Windsurf ahora se aloja bajo el dominio de documentación de productos Devin de Cognition, y el formato de configuración anterior es el que documenta esa página actual. Si usas una versión anterior, verifica los nombres de los campos con el enlace de la documentación al que dirija la ayuda integrada de tu versión.

## La guía rápida de cinco pasos: de una aplicación nueva a DNS activo

Cuando una de las conexiones esté activa, el resto del flujo es igual sin importar el editor que uses.

1. **Obtén una clave API** en [namefi.io/api-key](https://namefi.io/api-key), generada desde la billetera que debe poseer el nuevo dominio.
2. **Conéctate** con la configuración de tu editor y haz una comprobación rápida: pide «comprueba si `<yourapp>.com` está disponible en Namefi y dime qué herramienta llamaste». Es una llamada de solo lectura a `checkAvailability`, así que funciona antes de que hayas depositado fondos.
3. **Registra.** Confirma un nombre y una duración en lenguaje natural: «regístralo por un año». El agente envía `registerDomain` y consulta la orden hasta que alcanza `SUCCEEDED` (o un estado de error final); un registro típico termina tras unos pocos ciclos de consulta.
4. **Apúntalo a tu despliegue.** Este es el paso que explica la siguiente sección: añade, desde la misma conversación, los registros DNS que solicite tu plataforma de alojamiento.
5. **Comprueba que resuelva.** La [Propagación DNS](/es/glossary/dns-propagation/) no es instantánea; espera unos minutos y confirma con una búsqueda DNS pública o cargando el dominio en un navegador.

## Apunta el dominio nuevo al despliegue que acabas de publicar

Esta es la parte a la que nunca llega una guía genérica sobre «cómo registrar un dominio», porque sucede después del registro y del lado de la plataforma de alojamiento. Sin embargo, es el objetivo real de hacerlo dentro del editor: tu agente ya sabe en qué plataforma hizo el despliegue y puede configurar el DNS en la misma conversación que el registro.

### Vercel

La propia documentación de dominios de Vercel explica el flujo desde **Configuración → Dominios** en el panel del proyecto: añade el dominio y Vercel te indicará qué registro crear según se trate de un dominio raíz o de un subdominio. Para un **dominio raíz** (`yourapp.com`), Vercel solicita un **registro A** que apunte a su IP de servicio; para un **subdominio** (`www.yourapp.com`), pide un **CNAME**. Además, conviene saberlo antes de copiar un ejemplo de una guía antigua: [la documentación de Vercel deja claro que el destino de este CNAME es único para cada proyecto](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record), y se muestra en el panel en lugar de ser un único nombre de host fijo compartido por todos los proyectos.

Con ese valor en mano, el DNS se resuelve con una solicitud más al agente:

> «Añade un registro A para `@` que apunte a `76.76.21.21` y un CNAME para `www` que apunte al destino CNAME que me dio Vercel».

Eso llama dos veces a `createDnsRecord`, una por registro: la misma herramienta de [Tipos de registros DNS (A, AAAA, CNAME, MX, TXT)](/es/glossary/dns-record-types/) que se usa para cualquier escritura DNS en Namefi. La regla del punto final también se aplica aquí: el `rdata` de un destino CNAME necesita un punto final, mientras que el `zoneName` (tu dominio) no lo necesita.

### Cloudflare Pages

Si tu destino de despliegue es Cloudflare Pages y el DNS del dominio aún no se gestiona en Cloudflare, [la propia documentación de dominios personalizados de Cloudflare](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) solicita un único registro **CNAME** que apunte al subdominio `.pages.dev` de tu proyecto; no se necesita un registro A porque Pages sirve todo mediante ese destino CNAME. Primero debes completar el paso del panel de Cloudflare (Workers & Pages → tu proyecto → Dominios personalizados → Configurar un dominio); solo entonces el destino CNAME se resolverá correctamente.

> «Añade un CNAME para `app` que apunte a `my-project.pages.dev.`»

Misma llamada a herramienta, misma regla del punto final en el destino, distinta plataforma.

<!-- TODO: verificar — los pasos exactos de Vercel y Cloudflare Pages para emitir o renovar el certificado TLS en un dominio personalizado recién asociado, con el fin de afirmar con seguridad si en ambas plataformas es automático o requiere una activación manual -->

## Cómo se compara con el registro desde el editor de Cloudflare

Cloudflare es el otro registrador que promociona activamente un enfoque desde el editor, por lo que merece mencionarse directamente. Su API Registrar, [reportada en versión beta en abril de 2026](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/), también se integra con editores compatibles con MCP, incluidos Cursor y Claude Code, y permite que un agente busque, consulte el precio y registre un dominio de forma síncrona sin salir del contexto actual. Es la misma idea central que recorre esta guía para Namefi. El mismo informe señala que, en fase beta, la API de Cloudflare todavía no cubre la gestión posterior al registro, como transferencias y renovaciones, previstas para más adelante en 2026.

El servidor MCP de Namefi cubre hoy todo el ciclo de vida —registro, DNS y [Renovación de dominio (Renovación automática)](/es/glossary/domain-renewal/)—, además de dos cosas que no ofrece la vía de Cloudflare: el dominio se registra de forma predeterminada como NFT [Dominio Tokenizado](/es/glossary/tokenized-domain/) (redirigible a cualquier billetera) y admite un proceso de pago firmado con billetera sin necesidad de una cuenta de Namefi, detallado en [Paga dominios con una billetera de criptomonedas](/es/blog/wallet-checkout/). Ambas propuestas avanzan hacia el mismo flujo de «no salgas del editor»; cuál encaja mejor depende de si buscas un registro estándar o uno que también sea un activo en cadena.

## Preguntas frecuentes

### ¿También cubre Codex o Gemini CLI?
No en esta guía: está deliberadamente limitada a Claude Code, Cursor y Windsurf. [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/) ofrece la misma configuración exacta y verificada para Codex CLI, Gemini CLI y Claude Desktop.

### ¿Necesito una cuenta de Namefi antes de probarlo?
No. Una comprobación de disponibilidad de solo lectura no necesita autenticación, por lo que puedes conectar cualquiera de los editores anteriores y ejecutar la indicación de prueba del paso 2 antes de generar una clave API o depositar fondos.

### ¿Qué sucede si mi plataforma de despliegue no es Vercel ni Cloudflare Pages?
El patrón se mantiene en todas partes: el panel de tu plataforma te indica qué tipo de registro DNS necesita, casi siempre un registro A para un dominio raíz o un CNAME para un subdominio, y le das ese valor a tu agente para que lo escriba mediante `createDnsRecord`.

### ¿El dominio se tokeniza automáticamente si lo registro de esta forma?
Sí, de forma predeterminada: el dominio se registra como NFT en Base para la billetera vinculada a tu clave API, salvo que especifiques otro `nftReceivingWallet` en la solicitud. Consulta [¿Qué son los dominios tokenizados? Una guía sobre la tokenización de dominios](/es/blog/what-are-tokenized-domains/) si este concepto es nuevo para ti.

### ¿Puedo omitir por completo la clave API?
Sí, con una salvedad: la vía de pago [x402](/es/glossary/x402/) firmada con billetera de Namefi permite que una billetera con fondos pague un registro sin cuenta ni clave API. Requiere su propia explicación, que encontrarás en [Paga dominios con una billetera de criptomonedas](/es/blog/wallet-checkout/).

## Publica el dominio junto con la aplicación

El dominio es infraestructura, igual que el destino de despliegue y la base de datos; no hay una razón real para que sea la única parte de publicar una aplicación que todavía exija salir de las herramientas y rellenar un formulario web. Conecta una de las tres configuraciones, sigue el flujo de cinco pasos y el dominio quedará activo apuntando al mismo despliegue que tu agente acaba de crear, sin abrir una sola pestaña del navegador.

**[Genera una clave API de Namefi](https://namefi.io/api-key)** y prueba la indicación de comprobación de disponibilidad en el editor que ya tengas abierto, o lee la [guía completa de Claude Code con una transcripción anotada](/es/blog/claude-mcp-domains/) si quieres ver cada paso explicado en detalle.

## Fuentes y lecturas adicionales

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (URL del servidor MCP, transporte, autenticación y referencia de endpoints de registro y DNS: fuente primaria para todas las afirmaciones específicas de Namefi de esta guía)
- Namefi — [docs.namefi.io: Registrar un dominio](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (campos de solicitud de registro, flujo de consulta y valores de estado de las órdenes)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (descriptor de descubrimiento de MCP)
- Anthropic / Claude Code — [Conectar Claude Code a herramientas mediante MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (sintaxis de `claude mcp add --transport http`, encabezado `--header` y opciones `--scope`)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (formato de servidor remoto de `mcp.json`, `headers`, interpolación `${env:VAR}` y ubicaciones de configuración por proyecto y globales)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (redirige a [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp) a la fecha de publicación de esta guía; formato de `mcp_config.json`, `serverUrl` y `headers`)
- Vercel — [Añadir y configurar un dominio personalizado](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record) (registro A para dominios raíz, destino CNAME único por proyecto para subdominios y método de servidores de nombres)
- Vercel — [Descripción general de dominios](https://vercel.com/docs/domains#:~:text=76.76.21.21) (la IP de servicio `76.76.21.21` utilizada para registros A de dominios raíz)
- Cloudflare — [Dominios personalizados para Pages](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain) (flujo CNAME hacia `.pages.dev` para dominios que no se gestionan en Cloudflare)
- webhosting.today — [Los agentes de IA ya pueden registrar dominios sin intervención humana](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/) (informe sobre la beta de la API Registrar de Cloudflare: integraciones de editor y limitaciones de la beta)
- Model Context Protocol — [modelcontextprotocol.io](https://modelcontextprotocol.io) (visión general del protocolo)
