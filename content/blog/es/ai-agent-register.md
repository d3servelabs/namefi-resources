---
title: "Cómo registrar un dominio en Namefi con tu agente de IA"
date: '2026-07-10'
language: 'es'
tags: ['ai-agents', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: guide
ogImage: ../../assets/ai-agent-register-og.jpg
description: "La guía de referencia para registrar un dominio en Namefi con cualquier agente de IA —Claude, Codex, Cursor y más— mediante MCP, REST o pago con billetera."
keywords: ["registrar dominio con agente de IA", "tutorial de Namefi", "registro de dominios con Claude", "registro de dominios con Codex", "dominio Cursor MCP", "dominio Windsurf MCP", "dominio Gemini CLI MCP", "cómo registrar dominios con agentes", "x-api-key", "servidor MCP", "pago con billetera", "registro de dominios con Namefi MCP", "agente de IA compra dominio en Namefi", "tutorial MCP para registrar dominios"]
relatedArticles:
  - /es/blog/claude-mcp-domains/
  - /es/blog/cf-namecom-namefi/
  - /es/blog/ai-domain-platforms/
  - /es/blog/agent-native/
  - /es/blog/airo-vs-namefi/
relatedTopics:
  - /es/topics/domain-tokenization/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/tokenize-your-com/
  - /es/series/blockchain-concepts/
relatedGlossary:
  - /es/glossary/ai-agent/
  - /es/glossary/registrar/
  - /es/glossary/wallet/
  - /es/glossary/x402/
  - /es/glossary/tokenized-domain/
---

Esta es la página que debes guardar si quieres que un [Agente de IA](/es/glossary/ai-agent/) —cualquier agente de IA, no uno de un proveedor concreto— registre un dominio real por ti en [Namefi](https://namefi.io), un [Registrador](/es/glossary/registrar/) acreditado por [ICANN](/es/glossary/icann/). Explica los mecanismos que no cambian, independientemente del cliente en el que escribas, y después ofrece pasos de configuración exactos, verificados individualmente, para los seis agentes que la gente usa hoy: Claude Desktop, Claude Code, OpenAI Codex, Cursor, Windsurf y Gemini CLI. Si tu agente no figura en esa lista, la guía termina con una vía REST directa que funciona con cualquier sistema capaz de realizar una solicitud HTTP, porque toda la superficie de la API de Namefi también se publica en texto plano precisamente para ese fin.

Esta guía está escrita y mantenida por el equipo de Namefi, por lo que la parte de Namefi de cada paso procede de primera mano: explica de forma legible para personas la misma API que publicamos para agentes en [namefi.io/llms.txt](https://namefi.io/llms.txt) y [docs.namefi.io](https://docs.namefi.io). La configuración de cada proveedor de agentes se verificó con la documentación vigente del propio proveedor en la fecha de publicación de esta guía; cuando la documentación de un proveedor no da una respuesta clara, se indica expresamente en lugar de rellenar el vacío con una conjetura.

Si ya sabes que vas a usar Claude y quieres la guía completa y comentada con una transcripción real, [Compra un dominio con Claude: guía paso a paso de Namefi MCP](/es/blog/claude-mcp-domains/) profundiza más que las secciones resumidas de Claude de esta página. Esta página es el eje; aquella, junto con los demás enlaces repartidos aquí, son los radios.

## Qué significa realmente «registrar un dominio con un agente de IA»

Para que un agente registre un dominio en tu nombre sin que tengas que rellenar un formulario, deben cumplirse dos condiciones. Primero, el agente necesita una forma de *descubrir y llamar* a la API de Namefi: el [Model Context Protocol](https://modelcontextprotocol.io) (MCP), un estándar abierto que permite a un cliente de IA conectarse a un servidor de herramientas externo y ver una lista definida de operaciones invocables, o una solicitud HTTP normal si el agente está programado en lugar de ser conversacional. Segundo, el agente necesita *autorización para gastar*: una clave de API vinculada a un saldo con fondos, o una [Billetera](/es/glossary/wallet/) de criptomonedas capaz de firmar un pago en el momento. Todo lo que aparece en esta guía es una de esas dos piezas.

Namefi opera un único servidor MCP para toda su API, en `https://api.namefi.io/mcp`, mediante el transporte Streamable HTTP. Un agente —o la persona que lo configura— puede descubrirlo sin leer nunca esta página: publicamos un descriptor legible por máquina en [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) que llama al servidor `namefi-api` e indica que su transporte es `streamable-http`. Todos los clientes de abajo se conectan a esa misma URL; lo único que cambia es cómo el archivo de configuración o la línea de comandos de cada cliente te pide señalarla.

## El flujo universal de cinco pasos

Esta es la secuencia que subyace a cada sección específica de agente más abajo. Cuando la entiendas aquí, las instrucciones por agente se reducen a «¿cómo hago el paso 2 en esta herramienta concreta?».

1. **Obtén credenciales.** Genera una [clave de API](https://namefi.io/api-key), una cadena con prefijo `nfk_` que sirve para todas las operaciones: registro, creación de registros DNS, actualizaciones y eliminaciones. La clave hereda los permisos de la billetera que la generó, así que créala desde la billetera que deba ser dueña del dominio. Si prefieres no conservar ninguna clave de API de Namefi, pasa a la vía de pago con billetera que aparece más abajo: no necesita cuenta.
2. **Conecta tu agente al servidor MCP.** Configura en tu cliente `https://api.namefi.io/mcp` con el encabezado `x-api-key` que contiene tu clave. La sintaxis exacta depende del cliente; consulta la sección de tu agente a continuación.
3. **Busca y consulta el precio.** Pregunta en lenguaje natural si un nombre está disponible. Esto llama a la operación `checkAvailability` (`GET /v-next/search/availability?domain=…`), que no requiere autenticación, o a su variante masiva si quieres filtrar varios candidatos a la vez.
4. **Registra y luego consulta el estado.** Tras tu confirmación, el agente envía `registerDomain` (`POST /v-next/orders/register-domain`), o la variante combinada `register-domain/records` si quieres configurar DNS en la misma llamada. El registro es asíncrono: el cuerpo de la solicitud recibe un `normalizedDomainName` y un `durationInYears`, y el endpoint `register-domain/records` también acepta una matriz `records` (`name`, `type`, `rdata`, `ttl` por registro), de modo que DNS se escribe en cuanto termina el pedido. El agente (o tú) consulta `getOrder` (`GET /v-next/orders/{orderId}`) hasta que alcance un estado terminal: `SUCCEEDED`, `FAILED`, `CANCELLED` o `PARTIALLY_COMPLETED`.
5. **Configura DNS y verifica.** Añade o ajusta [Tipos de registros DNS (A, AAAA, CNAME, MX, TXT)](/es/glossary/dns-record-types/) mediante `createDnsRecord` (`POST /v-next/dns/records`), configura la delegación a nivel de [Servidor de nombres (Registro NS)](/es/glossary/nameserver/) si hace falta y espera unos minutos de [Propagación DNS](/es/glossary/dns-propagation/) antes de confirmar que el dominio resuelve.

La solicitud de registro también acepta un objeto `domainSetupOptions` con anulaciones por dominio: `autoPark`, `autoEns`, `autoRenew`, `dnssec` y `keepExistingNameservers` (el último indica a Namefi que deje intacta la delegación de servidores de nombres existente del dominio en lugar de redirigirla; resulta útil si registras un dominio que debe seguir resolviendo en otro sitio inmediatamente). Un campo opcional `nftReceivingWallet` controla dónde llega el token de propiedad del dominio: si lo omites, el dominio se registra como NFT en Base para la billetera vinculada a tu clave de API.

## Matriz de configuración por agente

| Agente | Método de conexión | Dónde vive la configuración | ¿Admite encabezado de autenticación personalizado? | Verificado con |
| --- | --- | --- | --- | --- |
| Claude Code | MCP, Streamable HTTP | Comando de CLI `claude mcp add` (escribe en `~/.claude.json` o `.mcp.json`) | Sí — opción `--header` | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp), verificado el 2026-07-10 |
| Claude Desktop / claude.ai | MCP, Streamable HTTP mediante Custom Connector | Settings → Connectors → Add custom connector | Indicación de autenticación controlada por el servidor (OAuth, clave de API o credenciales, según lo que solicite el servidor) | [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers), verificado el 2026-07-10 |
| OpenAI Codex CLI | MCP, Streamable HTTP | `~/.codex/config.toml`, tabla `[mcp_servers.<name>]` | Sí — `http_headers` (estático) o `env_http_headers` (desde variables de entorno) | [learn.chatgpt.com/docs/extend/mcp](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (el destino actual de la redirección de `developers.openai.com/codex/mcp`), verificado el 2026-07-10 |
| Cursor | MCP, Streamable HTTP | `.cursor/mcp.json` (proyecto) o `~/.cursor/mcp.json` (global) | Sí — objeto `headers`, con interpolación `${env:VAR}` | [cursor.com/docs/mcp](https://cursor.com/docs/mcp), verificado el 2026-07-10 |
| Windsurf (Cascade) | MCP, Streamable HTTP | `~/.codeium/windsurf/mcp_config.json` | Sí — objeto `headers` en una entrada `serverUrl`, con interpolación `${env:VAR}` | [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (en la fecha de publicación de esta guía, esa URL redirige a `docs.devin.ai/desktop/cascade/mcp`; consulta la sección de Windsurf más abajo), verificado el 2026-07-10 |
| Gemini CLI | MCP, Streamable HTTP | `~/.gemini/settings.json` (usuario) o `.gemini/settings.json` (proyecto) | Sí — objeto `headers` en una entrada `httpUrl` | [geminicli.com/docs/tools/mcp-server](https://geminicli.com/docs/tools/mcp-server/), verificado el 2026-07-10 |
| Cualquier otro cliente MCP | MCP, Streamable HTTP | El formato de configuración que documente ese cliente | Depende del cliente; la parte del servidor de Namefi no cambia | [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) |
| Cualquier script o agente sin MCP | REST directo | N/A — llamadas HTTPS directas | Sí — encabezado `x-api-key` en todas las llamadas de escritura | [namefi.io/llms.txt](https://namefi.io/llms.txt), [docs.namefi.io](https://docs.namefi.io) |

Todas las filas anteriores se conectan al mismo servidor y al mismo conjunto de operaciones. Lo único que cambia según el agente es la sintaxis para indicarle a ese cliente concreto «aquí tienes un servidor MCP remoto y este es el encabezado que debe enviar».

**El mismo mensaje de prueba, siempre.** Después de conectar cada uno de los agentes de abajo, ejecuta este mensaje exacto para comparar resultados entre clientes:

> "Comprueba si `example.com` está disponible para registrarse en Namefi y dime qué herramienta u operación llamaste para averiguarlo. No registres nada todavía."

Es una llamada de solo lectura: `checkAvailability` no necesita autenticación, por lo que puedes ejecutarla sin riesgo con un agente recién conectado incluso antes de haberle asignado fondos; además, te indica de inmediato si la conexión y la lista de herramientas funcionan.

## Claude Desktop y claude.ai

Claude Desktop y claude.ai se conectan a servidores MCP remotos mediante **Custom Connectors**. Abre Settings, ve a Connectors, elige "Add custom connector" e introduce `https://api.namefi.io/mcp` como URL del servidor. Tras hacer clic en Add, Claude te pedirá que completes la autenticación; la documentación de Anthropic describe este paso como uno que suele incluir «OAuth, claves de API o combinaciones de nombre de usuario y contraseña», y el mensaje exacto depende de lo que exija el servidor conectado.

<!-- TODO: verify — the exact field Claude Desktop's Custom Connector screen presents for an x-api-key-style header --> Si tu configuración de Desktop no muestra un lugar evidente para pegar la clave, Claude Code (la siguiente sección) es hoy la vía verificada para las operaciones de escritura, y las herramientas de solo lectura, como la búsqueda de disponibilidad, funcionan a través del conector sin clave alguna. La guía completa, incluido el aspecto del flujo del conector una vez conectado, está en [Compra un dominio con Claude: guía paso a paso de Namefi MCP](/es/blog/claude-mcp-domains/).

## Claude Code

La documentación de Claude Code proporciona una sintaxis general y exacta para añadir un servidor MCP HTTP remoto con un encabezado personalizado:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

Ejecuta ese comando una vez desde una terminal, sustituyendo `YOUR_KEY` por tu clave real. De forma predeterminada, escribe el servidor con ámbito **local**, disponible solo para ti y en tu proyecto actual (las versiones antiguas de Claude Code llamaban a este ámbito "project"). Añade `--scope user` si quieres que la conexión esté disponible en todos los proyectos de tu equipo, o `--scope project` para compartirla con todo el mundo en el proyecto mediante un archivo `.mcp.json` versionado. Confirma la conexión con `claude mcp list` y comprueba el número de herramientas activas dentro de una sesión con `/mcp`.

## OpenAI Codex CLI

Codex CLI guarda la configuración de MCP en un archivo TOML, de forma predeterminada `~/.codex/config.toml` (o en un `.codex/config.toml` con ámbito de proyecto para proyectos de confianza). Cada servidor tiene su propia tabla y el transporte se infiere de las claves presentes: una clave `command` significa un servidor local con stdio, y una clave `url` significa HTTP transmitible. La documentación de Codex especifica que el nombre de la tabla debe ser `mcp_servers` con guion bajo; `mcp-servers` u otras variantes parecidas se ignoran sin aviso.

```toml
# ~/.codex/config.toml
[mcp_servers.namefi]
url = "https://api.namefi.io/mcp"
env_http_headers = { "x-api-key" = "NAMEFI_API_KEY" }
```

Esta forma obtiene la clave de una variable de entorno llamada `NAMEFI_API_KEY` en lugar de escribirla en el archivo; establécela en tu shell antes de ejecutar Codex. Si prefieres codificarla directamente (no es recomendable en un archivo que podrías confirmar al repositorio), la forma estática equivalente es `http_headers = { "x-api-key" = "YOUR_KEY" }`. Codex también documenta un campo `bearer_token_env_var` específicamente para autenticación del estilo `Authorization: Bearer …`, pero el encabezado `x-api-key` de Namefi necesita los campos de propósito general `http_headers` / `env_http_headers`, no el específico de bearer.

## Cursor

Cursor lee las definiciones de servidores MCP desde `mcp.json`: una copia de ámbito de proyecto en `.cursor/mcp.json` en la raíz de tu repositorio, o una copia global en `~/.cursor/mcp.json` que se aplica en todas partes. La documentación de Cursor presenta directamente la forma para servidores remotos, incluido el uso de autenticación mediante encabezados e interpolación de variables de entorno para que la clave no tenga que vivir en el archivo:

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

`${env:NAMEFI_API_KEY}` se resuelve al valor que tenga esa variable de entorno en el momento de la conexión. Consulta [Inicio rápido de Namefi MCP: Claude Code, Cursor y Windsurf](/es/blog/mcp-quickstart/) para ver una versión condensada de esta misma configuración.

## Windsurf (Cascade)

La integración MCP de Windsurf —denominada **Cascade** dentro del producto— lee su lista de servidores desde `~/.codeium/windsurf/mcp_config.json`. Los servidores HTTP remotos usan un campo `serverUrl` (no `command`), junto con el mismo tipo de objeto `headers` e interpolación `${env:VAR}` que Cursor:

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

Conviene señalar algo con claridad: en la fecha de publicación de esta guía, `docs.windsurf.com/windsurf/cascade/mcp` redirige a `docs.devin.ai/desktop/cascade/mcp`. La documentación de Windsurf ahora vive bajo el dominio de documentación del producto Devin de Cognition, y la propia página se refiere tanto a "Windsurf" y "Cascade" como a "Devin Desktop". El formato de configuración anterior es el que documenta esa página actual; si usas una compilación antigua de Windsurf, los nombres de los campos deberían coincidir, pero compruébalos con la URL de documentación a la que enlace la ayuda integrada de tu versión.

## Gemini CLI

Gemini CLI lee los servidores MCP desde `settings.json`: una copia de nivel de usuario en `~/.gemini/settings.json`, o una copia de nivel de proyecto en `.gemini/settings.json` que solo se aplica dentro de ese proyecto. La forma del servidor remoto utiliza `httpUrl` en lugar de `url`:

```json
{
  "mcpServers": {
    "namefi": {
      "httpUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "YOUR_KEY"
      }
    }
  }
}
```

La documentación de Gemini CLI también indica un campo `timeout` (en milisegundos; 600,000 de forma predeterminada) si una llamada de herramienta concreta necesita más tiempo de lo habitual; la consulta del registro no debería necesitarlo, ya que el cliente espera solo cada llamada individual, no todo el bucle de consulta.

## Cualquier otro agente compatible con MCP

Si tu agente admite MCP pero no es uno de los seis anteriores, el lado del servidor es idéntico independientemente del cliente que se conecte: apúntalo a `https://api.namefi.io/mcp` mediante Streamable HTTP, con `x-api-key: YOUR_KEY` como encabezado personalizado. Consulta la documentación de tu propio cliente para conocer la sintaxis de su archivo de configuración o de su comando; el descriptor de descubrimiento en [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) existe precisamente para que un agente —o la persona que lo configure— encuentre la URL, el transporte y los requisitos de autenticación del servidor sin que una persona tenga que pegárselos manualmente.

Conviene conocer un patrón si tu cliente solo admite servidores MCP **locales (stdio)** y no admite Streamable HTTP remoto ni SSE directamente: el paquete comunitario `mcp-remote` conecta un servidor Streamable HTTP remoto con un proceso local que tu cliente puede iniciar normalmente y reenvía los encabezados que configures. No es algo que esta guía pueda verificar con la documentación propia de Namefi, ya que es un puente de terceros, no una vía publicada por Namefi; considéralo una alternativa si tu cliente concreto realmente no tiene compatibilidad nativa con Streamable HTTP remoto, no la opción predeterminada. <!-- TODO: verify — an exact mcp-remote invocation for Namefi's server if a client without native Streamable HTTP support needs it -->

## Sin MCP: la vía REST directa

Todas las operaciones descritas antes también son endpoints HTTPS normales, documentados uno por uno en [namefi.io/llms.txt](https://namefi.io/llms.txt) y con todo detalle en [docs.namefi.io](https://docs.namefi.io). Un framework de agentes capaz de realizar llamadas HTTP, pero que no hable MCP —un script personalizado, otro entorno de agentes o una tarea de CI— puede seguir el mismo flujo directamente:

```bash
# 1. Check availability (no auth required)
curl "https://api.namefi.io/v-next/search/availability?domain=example.com"

# 2. Register (requires x-api-key)
curl -X POST "https://api.namefi.io/v-next/orders/register-domain" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"normalizedDomainName": "example.com", "durationInYears": 1}'

# 3. Poll the order until it reaches a terminal status
curl "https://api.namefi.io/v-next/orders/{orderId}" \
  -H "x-api-key: YOUR_KEY"
```

llms.txt es una convención de texto plano: un índice legible por máquina que un sitio publica en su raíz específicamente para que un agente de IA descubra qué hace una API sin tener que rastrear páginas de documentación renderizadas. El archivo de Namefi es lo bastante breve como para leerlo directamente en [namefi.io/llms.txt](https://namefi.io/llms.txt) si quieres la versión completa en lugar del resumen comprimido anterior. Consulta [llms.txt para dominios: una API que cualquier agente de IA puede leer](/es/blog/llms-txt/) para saber más sobre la convención.

## Pago: clave de API frente a pago con billetera

Todo lo anterior presupone una clave de API facturada contra un saldo NFSC (Namefi Service Credit) con fondos; puedes consultarlo cuando quieras en `GET /v-next/balance` (requiere `x-api-key`), recargarlo mediante un endpoint de faucet en entornos de desarrollo o a través del panel de Namefi en producción. <!-- TODO: confirm with team — the exact production NFSC top-up flow: accepted payment methods, and whether it's purchasable through chat/API or only the dashboard UI -->

Namefi también permite registrar un dominio con una billetera de criptomonedas y **sin ninguna cuenta de Namefi**, mediante el protocolo [x402](/es/glossary/x402/): la billetera de un agente firma una autorización EIP-3009, la API responde con un HTTP 402 que indica el precio si aún no se adjuntó ningún pago, y el registro se liquida cuando llega un pago firmado válido, normalmente en una [Stablecoin](/es/glossary/stablecoin/) como USDC. También hay una variante relacionada de desafío-respuesta MPP (Machine Payable Protocol), además de una vía manual de firma EIP-712 para billeteras que no utilizan ninguno de esos atajos. Esta vía centrada en la billetera importa precisamente para los agentes de los que trata esta guía: elimina por completo el paso de creación de cuenta, por lo que un proceso autónomo nunca tiene que guardar —ni filtrar— una clave de API. Consulta [Paga dominios con una billetera de criptomonedas: sin necesidad de cuenta](/es/blog/wallet-checkout/) para ver ese flujo por separado.

## Salvaguardas antes de dar poder de compra a un agente

Un agente capaz de registrar un dominio también puede gastar dinero y reescribir DNS en una propiedad activa, así que vale la pena tomar unas cuantas decisiones de forma deliberada, en vez de dejarlas por defecto:

- **Limita la clave de API a la billetera mínima.** Una clave hereda los permisos de la billetera que la generó: créala desde la billetera destinada a poseer los nuevos registros, no desde una que tenga activos que no quieras exponer a la clave de un agente.
- **Limita lo que el agente puede gastar.** Un saldo NFSC es en sí mismo un límite de gasto: fínancialo solo con la cantidad que te resulte aceptable que un agente use sin supervisión, en lugar de mantener un saldo elevado de forma permanente.
- **Decide en qué punto una persona debe seguir participando.** Las operaciones de solo lectura, como la búsqueda de disponibilidad, no requieren autenticación y no entrañan riesgo; en cuanto una llamada envía `registerDomain`, activa la renovación automática o escribe un registro DNS en un dominio que ya sirve tráfico, ese es el punto en el que debes exigir una confirmación explícita en vez de dejar que el agente avance de forma autónoma.
- **Revisa las escrituras de DNS antes de confirmarlas**, igual que revisarías cualquier cambio de infraestructura. La validación de Namefi rechaza registros malformados en lugar de aceptarlos silenciosamente (consulta la tabla de solución de problemas más abajo), pero detecta errores de formato, no un valor que sea sintácticamente correcto y equivocado.

[¿Qué es un registrador de dominios nativo para agentes?](/es/blog/agent-native/) presenta una lista más completa —capacidad de descubrimiento, errores legibles por máquina y vías de pago que no suponen que una persona tenga una tarjeta de crédito— para evaluar cualquier superficie de registrador orientada a agentes, incluida la de Namefi.

## Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `401 UNAUTHORIZED` en cualquier llamada de escritura | Clave de API inválida, vencida o generada desde una billetera que no es dueña del dominio objetivo | Genera una clave nueva en [namefi.io/api-key](https://namefi.io/api-key) desde la billetera que posee (o poseerá) el dominio |
| `403 FORBIDDEN` | La clave es válida, pero su billetera no posee este dominio concreto | Comprueba la titularidad antes de volver a intentarlo |
| Codex ignora tu entrada `[mcp_servers.namefi]` | Error tipográfico en el nombre de la tabla: Codex exige la forma con guion bajo `mcp_servers`, no `mcp-servers` | Corrige el encabezado de tabla en `config.toml` |
| Cursor o Windsurf muestran el servidor como desconectado | El objeto `headers` está mal formado, o `${env:VAR}` hace referencia a una variable sin definir | Comprueba que el JSON sea válido y que la variable de entorno citada esté realmente exportada en el shell que inició el editor |
| Gemini CLI no encuentra la configuración | Se editó el `settings.json` equivocado: los archivos de usuario y de proyecto son independientes | Confirma si querías `~/.gemini/settings.json` o `.gemini/settings.json` en el proyecto actual |
| El pedido de registro permanece en un estado no terminal | Es normal: el registro es asíncrono | Sigue consultando `getOrder`; considéralo bloqueado solo si nunca llega a `SUCCEEDED`, `FAILED`, `CANCELLED` o `PARTIALLY_COMPLETED` |
| La creación o actualización de un registro DNS se rechaza con un error de validación | `zoneName` tiene un punto final, o a un valor `rdata` de CNAME/MX/NS le falta su punto final obligatorio | `zoneName` = sin punto final; valores `rdata` de tipo FQDN = punto final obligatorio |
| El registro falla por completo | Saldo NFSC insuficiente en la billetera pagadora | Consulta `GET /v-next/balance`; recarga mediante el faucet (desarrollo) o el panel (producción) |
| El agente dice que no tiene herramientas de dominio disponibles | El servidor MCP no está conectado, o se conectó sin el encabezado necesario para las operaciones de escritura | Vuelve a comprobar el archivo de configuración de tu cliente o ejecuta otra vez su comando para añadir el servidor con el encabezado incluido |

## Preguntas frecuentes

### ¿Tengo que elegir un agente y quedarme con él?

No. El servidor MCP y todos los endpoints REST son idénticos sin importar qué cliente se conecte: puedes configurar Claude Code hoy y Cursor mañana con la misma clave de API y el mismo saldo NFSC, sin ningún paso de migración.

### ¿Cuál de estos agentes es «mejor» para registrar un dominio?

No hay una diferencia significativa de capacidad para esta tarea, porque todos los clientes llaman a las mismas operaciones del lado del servidor. Las diferencias están por completo en la sintaxis de configuración MCP propia de cada cliente; precisamente por eso esta guía dedica una sección a cada uno y usa el mismo mensaje de prueba: ejecútalo una vez por cliente y compara tú mismo las transcripciones.

### ¿Qué ocurre si mi agente no admite MCP?

Usa la vía REST directa anterior. Cada operación a la que llega una llamada de herramienta MCP también es un endpoint HTTPS documentado, y `namefi.io/llms.txt` está diseñado específicamente como punto de entrada de texto plano que un agente —o la persona que lo configura— puede leer sin navegador.

### ¿Mi dominio se tokeniza automáticamente al registrarlo de esta forma?

Sí, de forma predeterminada. Si no especificas un `nftReceivingWallet` en la solicitud de registro, el dominio se registra como NFT en Base para la billetera vinculada a tu clave de API. Puedes redirigirlo a una billetera diferente en el momento del registro.

### ¿Puede un agente registrar un dominio sin que yo tenga una clave de API?

Sí: la vía de pago x402 firmada por billetera no necesita cuenta de Namefi ni clave de API, solo una billetera con fondos. La sección de pagos anterior cubre lo esencial de ese flujo; consulta [Paga dominios con una billetera de criptomonedas: sin necesidad de cuenta](/es/blog/wallet-checkout/) para ver la guía completa.

### ¿Registrar mediante un agente cuesta más que hacerlo desde el sitio web de Namefi?

Esta guía no afirma que haya una comparación de precios en un sentido u otro. <!-- TODO: confirm with team — whether Namefi's MCP/API pricing matches its standard registration pricing, or differs --> En cualquier caso, todas las vías se cargan contra el mismo saldo NFSC, tanto si la solicitud procede de un navegador como de un script o de la herramienta de un agente.

## Empieza con el agente que ya tengas abierto

No necesitas tener seis clientes instalados para usar esta guía: necesitas exactamente uno, además de una clave de API de Namefi o una billetera con fondos. Elige la sección de arriba que corresponda con el agente con el que ya estés hablando, sigue la configuración y prueba el mensaje de prueba. A partir de ahí, el resto del flujo de esta página —buscar, registrar y configurar DNS— transcurre en la misma conversación.

**[Genera una clave de API de Namefi](https://namefi.io/api-key)** o profundiza con la [guía de Claude con una transcripción completa](/es/blog/claude-mcp-domains/) y la [comparación directa de registradores nativos para agentes](/es/blog/cf-namecom-namefi/). Para los componentes en los que se apoya esta guía, consulta [Servidor MCP de Namefi: herramientas de dominios para agentes de IA](/es/blog/namefi-mcp/), [Inicio rápido de Namefi MCP: Claude Code, Cursor y Windsurf](/es/blog/mcp-quickstart/), [Paga dominios con una billetera de criptomonedas: sin necesidad de cuenta](/es/blog/wallet-checkout/) y [llms.txt para dominios: una API que cualquier agente de IA puede leer](/es/blog/llms-txt/).

## Fuentes y lecturas adicionales

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (URL del servidor MCP, transporte, autenticación, referencia de endpoints de registro/DNS y campos de `domainSetupOptions`: fuente primaria de todas las afirmaciones específicas de Namefi de esta guía)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (flujos de pago con billetera x402, MPP y EIP-712)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (descriptor de descubrimiento MCP: nombre, URL, transporte y tipo de autenticación del servidor)
- Namefi — [docs.namefi.io: autenticación](https://docs.namefi.io/docs/02-authentication.mdx) (modos de autenticación de clave de API, EIP-712 y SIWE; requisitos de autenticación por operación)
- Namefi — [docs.namefi.io: registrar un dominio](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (campos de la solicitud de registro, flujo de consulta y valores de estado del pedido)
- Namefi — [docs.namefi.io: gestionar el saldo](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (saldo NFSC y endpoints de faucet)
- Anthropic / Claude Code — [conectar Claude Code a herramientas mediante MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (sintaxis de `claude mcp add --transport http`, opciones `--header` y `--scope`)
- Model Context Protocol — [conectarse a servidores MCP remotos](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (flujo de Custom Connectors de Claude Desktop / claude.ai)
- OpenAI — [learn.chatgpt.com: Model Context Protocol (Codex CLI)](https://learn.chatgpt.com/docs/extend/mcp?surface=cli) (tabla `[mcp_servers.<name>]` de `config.toml`, campos `url`, `http_headers`, `env_http_headers` y `bearer_token_env_var`)
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp) (formato de servidor remoto de `mcp.json`, interpolación de `headers` y `${env:VAR}`, ubicaciones de configuración de proyecto frente a global)
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp) (redirige a [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp) en la fecha de publicación de esta guía; formato de `mcp_config.json`, `serverUrl`, `headers`)
- Google — [geminicli.com: servidores MCP con Gemini CLI](https://geminicli.com/docs/tools/mcp-server/) (formato de `settings.json`, `httpUrl`, `headers`, `timeout`)
- llmstxt.org — [el archivo /llms.txt](https://llmstxt.org) (especificación y justificación de la convención de descubrimiento que sigue `namefi.io/llms.txt`)
