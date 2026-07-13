---
title: "Compra un dominio con Claude: guía paso a paso de Namefi MCP"
date: '2026-07-10'
language: 'es'
tags: ['ai-agents', 'domains', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/claude-mcp-domains-og.jpg
description: "Conecta Claude al servidor MCP de Namefi y registra un dominio real desde una sola conversación. Configuración exacta, una transcripción anotada y solución de problemas."
keywords: ["namefi mcp", "dominio mcp de claude", "configuración de servidor mcp", "comprar dominio con claude", "x-api-key", "tutorial paso a paso", "registro de dominios namefi mcp", "registrar dominio con claude desktop", "comprar dominio con claude code", "integración de namefi con claude", "registrador de dominios mcp", "agente de IA compra dominio con claude", "mcp mediante streamable http"]
relatedArticles:
  - /es/blog/ai-agent-register/
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
  - /es/glossary/dns-record-types/
  - /es/glossary/tokenized-domain/
  - /es/glossary/x402/
---

Al terminar esta guía tendrás un dominio real registrado a través de un registrador acreditado por [ICANN](/es/glossary/icann/), con su DNS apuntando a lo que estés creando, todo desde una conversación con Claude: sin proceso de pago en el navegador, carrito ni CAPTCHA. Esta es la guía de configuración del equipo de Namefi para el servidor MCP de [Namefi](https://namefi.io), una explicación legible para personas de la misma API que publicamos para agentes en [namefi.io/llms.txt](https://namefi.io/llms.txt) y [docs.namefi.io](https://docs.namefi.io). Cuando un detalle aún no está finalizado o publicado, esta guía lo indica de forma explícita en lugar de especular.

Existen tutoriales de terceros sobre cómo «registrar un dominio con tu [Agente de IA](/es/glossary/ai-agent/)»; [un ejemplo popular](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) muestra el patrón con otro servidor MCP, creado como revendedor sobre la API Registrar de Cloudflare. El funcionamiento de MCP es el mismo concepto entre proveedores; esta guía se centra en el servidor MCP de Namefi, su propio modelo de autenticación y su opción de [Dominio Tokenizado](/es/glossary/tokenized-domain/), comprobados con la documentación de Namefi y no con la descripción de un tercero.

## Qué es MCP, en pocas palabras

El [Model Context Protocol](https://modelcontextprotocol.io) (MCP) es un estándar abierto para conectar una aplicación de IA —en este caso, Claude— con herramientas externas y fuentes de datos. La propia documentación del protocolo lo describe como [un puerto USB-C para aplicaciones de IA](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications): un conector estandarizado en vez de una integración a medida para cada herramienta. Conectado al servidor MCP de Namefi, Claude obtiene un conjunto definido de operaciones invocables —comprobar disponibilidad, registrar un dominio, leer y escribir registros DNS— en vez de tener que reconstruir una API REST a partir de documentación pegada en el chat.

## Requisitos previos

- **Un cliente de Claude compatible con MCP.** Esta guía cubre Claude Code (línea de comandos) con instrucciones concretas y comprobadas, y Claude Desktop / claude.ai (mediante Custom Connectors) con el flujo general documentado. Otros clientes MCP, como Cursor o Windsurf, se conectan al mismo servidor; consulta las secciones por agente en [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/) o la versión resumida, [Guía rápida de Namefi MCP: Claude Code, Cursor y Windsurf](/es/blog/mcp-quickstart/), si solo necesitas los comandos de conexión.
- **Una clave API de Namefi**, generada en [namefi.io/api-key](https://namefi.io/api-key), *o* una [Billetera](/es/glossary/wallet/) de criptomonedas si prefieres pagar por transacción sin usar ninguna clave API (consulta la sección sobre billeteras al final).
- **Un saldo de NFSC con fondos** si vas a registrar en el entorno de producción de Namefi. NFSC (Namefi Service Credits) es el saldo del que se cobra el registro de dominios; la documentación de Namefi describe cómo recargarlo desde el panel de Namefi en producción y cómo solicitar créditos de prueba gratuitos desde un endpoint de faucet en entornos de desarrollo.

## Paso 1: obtén una clave API de Namefi

La [clave API](https://namefi.io/api-key) es la vía de autenticación más sencilla y la que usa esta guía de principio a fin: un único encabezado cubre todas las operaciones, incluidos el registro, la creación, actualización y eliminación de registros DNS. Hay un detalle que conviene asimilar antes de generar una clave: **la clave hereda los permisos de la billetera que la generó.** Si quieres gestionar el DNS de un dominio que ya posees, genera la clave desde la billetera que posee el NFT de ese dominio; una clave generada desde otra billetera no tendrá acceso de escritura a un dominio cuyo [Registrante](/es/glossary/registrant/) sea otra persona.

Una vez generada, la clave es una cadena con el prefijo `nfk_`. La pasarás como encabezado `x-api-key` en todas las operaciones de escritura; las operaciones de solo lectura, como una comprobación de disponibilidad, no la requieren.

## Paso 2: conecta Claude al servidor MCP de Namefi

Namefi, un [Registrador](/es/glossary/registrar/) acreditado por ICANN, opera un único servidor MCP para toda su superficie de API en `https://api.namefi.io/mcp`, accesible mediante el transporte Streamable HTTP. El servidor expone cada operación `/v-next` como una herramienta tipada —búsqueda, registro, DNS, configuración de dominios y operaciones salientes— y su existencia, junto con los detalles de conexión, se publica como descriptor de descubrimiento en [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json), legible por máquina para que un agente encuentre el servidor sin que una persona tenga que pegarle primero la URL.

### Claude Code

Añadir el servidor a Claude Code requiere un solo comando:

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

Esto coincide con la [sintaxis documentada de Claude Code](https://code.claude.com/docs/en/mcp) para añadir un servidor MCP HTTP remoto con un encabezado de autenticación personalizado: el patrón general es `claude mcp add --transport http <name> <url> --header "<Header-Name>: <value>"`. Ejecútalo una vez desde tu terminal (sustituye `YOUR_KEY` por la clave del paso 1) y Claude Code escribirá el servidor en la configuración MCP de tu proyecto o usuario. De forma predeterminada, el comando registra el servidor solo para el proyecto actual; añade `--scope user` si quieres que esté disponible en todos los proyectos, u omite la clave por completo y añádela después si al principio solo necesitas herramientas de lectura, como la búsqueda de disponibilidad.

Confirma la conexión con `claude mcp list`, que debería mostrar `namefi` como conectado, y con `/mcp` dentro de una sesión de Claude Code para ver cuántas herramientas expone el servidor de Namefi.

### Claude Desktop y claude.ai

Claude Desktop y claude.ai se conectan a servidores MCP remotos mediante **Custom Connectors**, como se documenta en [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers): abre Settings, ve a Connectors, elige «Add custom connector» e introduce la URL del servidor, `https://api.namefi.io/mcp`. Tras hacer clic en Add, el flujo te pedirá que completes la autenticación; según la documentación de Anthropic, este paso «suele implicar OAuth, claves API o combinaciones de nombre de usuario y contraseña», según lo que requiera el servidor concreto, y Claude mostrará la indicación que el servidor solicite.

<!-- TODO: confirm with team — the exact field Claude Desktop's Custom Connector auth screen presents for an x-api-key-style header; Anthropic's public docs describe the general authentication step without showing Namefi's server specifically --> Si al configurar el conector de Desktop no aparece un lugar claro para introducir la clave, Claude Code es por ahora la vía comprobada, y las herramientas de solo lectura (búsqueda de disponibilidad) funcionan en el conector sin necesidad de clave.

## Paso 3: añade fondos a tu saldo de NFSC

El registro de dominios es una operación de pago: requiere NFSC (Namefi Service Credits) en la billetera que paga. En un entorno de desarrollo o de prueba, un faucet (`POST /v-next/user/faucet`, o `client.user.requestNfscFaucet()` en el SDK) entrega créditos de prueba gratuitos, con límite de frecuencia por billetera. En producción, NFSC se recarga desde el panel de Namefi. <!-- TODO: confirm with team — the exact production top-up flow: accepted payment methods and whether it's purchasable directly through chat or only through the dashboard UI --> Puedes consultar tu saldo actual en cualquier momento: preguntando a Claude («¿cuál es mi saldo de Namefi?») una vez conectado, o directamente con `GET /v-next/balance`.

## Paso 4: la conversación de compra

Con el servidor MCP conectado y un saldo con fondos, el resto del flujo ocurre en lenguaje natural. Esta es una versión anotada de cómo se desarrolla esa conversación, vinculada a la operación subyacente que la documentación de la API de Namefi nombra en cada paso.

**1. Le pides a Claude que compruebe un nombre.**

> "¿Está `example.com` disponible para registrarlo?"

Claude llama a la comprobación de disponibilidad (la operación `checkAvailability`, accesible directamente en `GET /v-next/search/availability?domain=example.com`, sin autenticación). Te informa de si el nombre está libre y puede revisar de una vez un lote de candidatos mediante la variante de disponibilidad masiva si le das varios nombres para comparar.

**2. Confirmas y registras.**

> "Regístralo por un año y configura el DNS para que `@` apunte a 203.0.113.10."

Claude envía una orden de registro (`registerDomain`, `POST /v-next/orders/register-domain`) o, si también pediste registros DNS, la variante combinada `register-domain/records`, que aplica los [Tipos de registros DNS (A, AAAA, CNAME, MX, TXT)](/es/glossary/dns-record-types/) que solicitaste en cuanto termina la orden. El cuerpo de la solicitud acepta un `normalizedDomainName` (en minúsculas, sin punto final, cualquier [TLD](/es/glossary/tld/) que `search/availability` haya indicado como registrable) y un `durationInYears` (0–10, valor predeterminado: 1). Un `nftReceivingWallet` opcional controla la tokenización: si lo omites, el dominio se registra como NFT en Base para la billetera vinculada a tu clave API. Un objeto `domainSetupOptions` documenta más ajustes por dominio, incluidos `autoRenew`, `dnssec` y `keepExistingNameservers`; este último permite a Claude registrar el dominio sin redirigir la delegación de su [Servidor de nombres (Registro NS)](/es/glossary/nameserver/) desde donde esté configurada actualmente.

**3. Claude consulta el estado hasta que la orden termina.**

El registro es asíncrono. Claude (o tú, mientras observas el estado) consulta `getOrder` (`GET /v-next/orders/{orderId}`) hasta que la orden alcanza un estado final: `SUCCEEDED`, `FAILED`, `CANCELLED` o `PARTIALLY_COMPLETED`. Un registro típico se completa en unos pocos ciclos de consulta; Claude te informa cuando termina, en vez de dejarte mirando un indicador de carga.

**4. Pides más registros DNS si no los configuraste todos desde el principio.**

> "Añade también un CNAME para `www` que apunte a `cname.vercel-dns.com.` y un registro TXT bajo `_verify` con este token."

Claude llama a `createDnsRecord` (`POST /v-next/dns/records`) para cada uno. Hay dos reglas de formato que conviene conocer antes de pedirlo: el `rdata` de los [Tipos de registros DNS (A, AAAA, CNAME, MX, TXT)](/es/glossary/dns-record-types/) y de tipos de registro similares debe terminar con un punto final (`cname.vercel-dns.com.`), mientras que `zoneName`, el dominio en sí, no debe hacerlo. Invertir estas dos reglas es la causa más habitual de un error de validación en este flujo.

**5. Opcional: activa la renovación automática.**

> "Activa la renovación automática para este dominio."

Claude activa la [Renovación de dominio (Renovación automática)](/es/glossary/domain-renewal/) mediante `PUT /v-next/domain-config/auto-renew`. Cuando está activada, el dominio se renueva automáticamente antes de caducar mediante los métodos de pago disponibles en la billetera del propietario. Conviene saberlo antes de activarla, ya que es una autorización permanente, no una confirmación única.

## Paso 5: verifica que resuelva

La [Propagación DNS](/es/glossary/dns-propagation/) no es instantánea, así que espera unos minutos antes de comprobar los registros. Las consultas DNS no requieren autenticación, por lo que tú —o Claude— puedes confirmar qué está activo con `GET /v-next/dns/records?zoneName=example.com` o con una herramienta pública de búsqueda DNS. Si apuntaste el dominio a una plataforma de despliegue, su propio paso de verificación de dominio (comprobar el registro TXT que te pidió) también es una confirmación independiente que conviene realizar.

## Pagar con una billetera en lugar de una clave API

Todo lo anterior usa la vía de clave API. Namefi también permite registrar un dominio con una billetera de criptomonedas y sin ninguna cuenta de Namefi, mediante el protocolo [x402](/es/glossary/x402/): la billetera del comprador firma una autorización EIP-3009, la API responde `402 Payment Required` con el precio si no se adjunta ninguna y liquida el registro cuando llega un pago válido. Ese flujo merece su propia guía, no una nota al pie; consulta [Paga dominios con una billetera de criptomonedas: no necesitas una cuenta](/es/blog/wallet-checkout/) o la sección de pagos de [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/) para conocer todos los detalles.

## Solución de problemas

| Síntoma | Causa probable | Solución |
| --- | --- | --- |
| `401 UNAUTHORIZED` en cualquier llamada de escritura | La clave API es inválida, ha caducado o se generó desde una billetera que no posee el dominio | Genera una clave nueva en [namefi.io/api-key](https://namefi.io/api-key) con la billetera que posee —o poseerá— el dominio |
| `403 FORBIDDEN` | La clave es válida, pero la billetera a la que está vinculada no posee este dominio concreto | Comprueba la propiedad en tu cuenta de Namefi antes de volver a intentarlo |
| La orden de registro permanece en un estado no final | Es normal: el registro es asíncrono | Sigue consultando `getOrder`; los propios ejemplos de Namefi consultan cada 5 segundos. Trátalo como bloqueado solo si nunca alcanza `SUCCEEDED`, `FAILED`, `CANCELLED` o `PARTIALLY_COMPLETED` |
| La creación o actualización de un registro DNS se rechaza con un error de validación | `zoneName` tiene un punto final, o a un valor `rdata` de CNAME/MX/NS le falta su punto final | `zoneName` = sin punto final; valores `rdata` de tipo FQDN = punto final obligatorio |
| El registro falla por completo | Saldo de NFSC insuficiente en la billetera que paga | Comprueba el saldo (`GET /v-next/balance`) y recárgalo mediante el faucet (prueba) o el panel de Namefi (producción) |
| Claude indica que no tiene herramientas de dominio disponibles | El servidor MCP no está conectado o se conectó sin el encabezado necesario para las operaciones de escritura | Ejecuta de nuevo `claude mcp add` con la opción `--header`, o consulta `/mcp` / `claude mcp list` para comprobar el estado de la conexión |

## Preguntas frecuentes

### ¿Necesito conocer la API REST de Namefi para usar esto, o basta con hablar con Claude en lenguaje natural?

El lenguaje natural basta para todo el flujo anterior: «¿está disponible este dominio?», «regístralo» o «apúntalo a esta IP» funcionan como solicitudes directas. Los endpoints y campos de solicitud de esta guía se documentan para que puedas comprobar qué hace Claude internamente, o invocarlos directamente si estás creando un script en vez de conversar.

### ¿Registrar mediante Claude cuesta más que registrar desde el sitio web de Namefi?

Esta guía no afirma que haya una diferencia de precio en ningún sentido. <!-- TODO: confirm with team — whether Namefi's MCP/API pricing matches its standard registration pricing, or differs --> En cualquier caso, el registro se descuenta del mismo saldo de NFSC tanto si la solicitud procede de un navegador, un script o una llamada de herramienta MCP.

### ¿Mi dominio se tokeniza automáticamente como NFT al registrarlo de esta manera?

Sí, de forma predeterminada. Si no especificas un `nftReceivingWallet` en la solicitud de registro, el dominio se registra como NFT en Base para la billetera vinculada a tu clave API. Puedes redirigirlo a una billetera o cadena distinta en el momento del registro.

### Si la solicitud de registro DNS de Claude tiene una errata, ¿puede romper mi dominio sin que me dé cuenta?

Las escrituras DNS pasan por la validación de Namefi antes de aplicarse, y un `rdata` mal formado (por ejemplo, sin el punto final en un destino CNAME) se rechaza con un error en lugar de aceptarse en silencio; consulta la tabla de solución de problemas anterior. Aun así, trata los cambios de DNS en un dominio activo como cualquier cambio de infraestructura: revisa lo que Claude va a enviar antes de confirmarlo.

### ¿Puedo usar este mismo servidor MCP con Cursor o Windsurf en lugar de Claude?

Sí. El servidor de Namefi habla el mismo protocolo MCP abierto independientemente del cliente que se conecte, así que la parte del servidor no cambia. Los comandos de conexión del lado del cliente difieren según el editor; consulta las secciones de configuración por cliente en [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/) o la versión más corta, [Guía rápida de Namefi MCP: Claude Code, Cursor y Windsurf](/es/blog/mcp-quickstart/).

## Compra tu próximo dominio desde una conversación

Esta es la configuración exacta que Namefi admite hoy, no una hipótesis. Una vez conectado el servidor MCP, todo, desde buscar un nombre hasta registrarlo, configurar DNS y —de forma opcional— convertirlo en un token custodiado en una billetera, ocurre sin salir del chat. El servidor MCP expone más funciones además del registro —búsqueda saliente de clientes potenciales, operaciones DNS por lotes y configuración de dominios—, todas detectables desde la misma conexión una vez configurada. Consulta [Servidor MCP de Namefi: herramientas de dominio para agentes de IA](/es/blog/namefi-mcp/) para ver el catálogo completo de herramientas.

**[Genera una clave API de Namefi y conecta Claude](https://namefi.io/api-key).**

## Fuentes y lecturas adicionales

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (URL del servidor MCP, transporte, autenticación y endpoints de registro y DNS; fuente primaria de esta guía)
- Namefi — [docs.namefi.io: Authentication](https://docs.namefi.io/docs/02-authentication.mdx) (clave API, modos de autenticación EIP-712 y SIWE; requisitos de autenticación por operación)
- Namefi — [docs.namefi.io: Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (ejemplos de registro y consulta de estado en SDK, fetch, cURL y Python)
- Namefi — [docs.namefi.io: Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (endpoints de faucet de NFSC y consulta de saldo)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (descriptor de descubrimiento de MCP)
- Anthropic / Claude Code — [Connect Claude Code to tools via MCP](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http) (sintaxis de `claude mcp add --transport http`, autenticación por encabezado y opciones de ámbito)
- Model Context Protocol — [Connect to remote MCP servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication) (flujo de Custom Connectors para Claude Desktop y claude.ai)
- Model Context Protocol — [What is the Model Context Protocol?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (visión general del protocolo)
- llmstxt.org — [The /llms.txt file](https://llmstxt.org) (especificación y justificación del archivo de descubrimiento que sigue namefi.io/llms.txt)
- dev.to — [How to register a domain name with your AI agent, no human needed](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26) (tutorial MCP de terceros creado sobre un revendedor de registrador diferente y respaldado por Cloudflare)
