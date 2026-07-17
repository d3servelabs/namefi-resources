---
title: "Servidor MCP de Namefi: herramientas de dominios para agentes de IA"
date: '2026-07-10'
language: 'es'
tags: ['ai-agents', 'domains', 'web3']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
format: explainer
ogImage: ../../assets/namefi-mcp-og.jpg
description: "Todas las herramientas que el servidor MCP de Namefi expone a agentes de IA: búsqueda, registro, DNS, renovaciones y tokenización, además del modelo de autenticación y flujos de trabajo de ejemplo."
keywords: ["servidor mcp de namefi", "lista de herramientas mcp", "capacidades mcp de namefi", "servidor mcp para gestión de dominios", "servidor mcp de registrador de dominios", "permisos de claves api de namefi", "herramientas mcp de dns", "registrar dominio con mcp", "tokenizar dominio con mcp", "pago de dominio con x402", "dominios con autenticación siwe", "firma de dominios con eip-712", "búsqueda de clientes potenciales saliente para dominios", "openapi de namefi", "herramientas de dominios para agentes de ia"]
relatedArticles:
  - /es/blog/claude-mcp-domains/
  - /es/blog/ai-agent-register/
  - /es/blog/wallet-checkout/
  - /es/blog/llms-txt/
  - /es/blog/mcp-quickstart/
relatedTopics:
  - /es/topics/domain-tokenization/
  - /es/topics/web3-foundations/
relatedSeries:
  - /es/series/blockchain-concepts/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/ai-agent/
  - /es/glossary/registrar/
  - /es/glossary/tokenized-domain/
  - /es/glossary/dnssec/
  - /es/glossary/ens/
---

Todo [Agente de IA](/es/glossary/ai-agent/) que se conecta al servidor MCP de Namefi ve la misma lista de herramientas invocables: una por cada operación que define la API, incluidas búsqueda, registro, DNS, configuración a nivel de dominio, búsqueda saliente de clientes potenciales y pago. Esta página es el catálogo: cada herramienta, lo que hace, la autenticación que necesita y tres ejemplos prácticos que combinan varias herramientas en un flujo de trabajo real.

Si aún no has conectado un agente a Namefi, empieza por [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/) para configurar cada cliente, o por [Compra un dominio con Claude: guía paso a paso de Namefi MCP](/es/blog/claude-mcp-domains/) para ver una transcripción completa. Esta página da por sentada la conexión.

## Qué es el servidor MCP de Namefi

Namefi opera un único servidor MCP para toda su API, en `https://api.namefi.io/mcp`, mediante el transporte Streamable HTTP. En lugar de que un agente construya llamadas REST a mano a partir de documentación pegada en un chat, se conecta una vez y recibe una herramienta tipada para cada operación que define la API, generada directamente desde la propia especificación OpenAPI 3 de Namefi en [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json). Así, el catálogo MCP y la API REST no pueden desincronizarse.

Un descriptor de descubrimiento legible por máquina en [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) permite que un agente encuentre el servidor sin que una persona pegue a mano una URL en un archivo de configuración: llama al servidor `namefi-api`, indica el transporte `streamable-http` y declara `apiKey`/`x-api-key` como autenticación de la conexión. Namefi, un [Registrador](/es/glossary/registrar/) acreditado por [ICANN](/es/glossary/icann/), también publica las mismas operaciones como endpoints HTTPS normales en [namefi.io/llms.txt](https://namefi.io/llms.txt), para agentes y scripts que no hablan MCP.

## El catálogo completo de capacidades

A continuación se muestra cada operación que define la API en la fecha de publicación, agrupada como las organiza la propia referencia de Namefi. La columna **Operación** contiene el `operationId` de la especificación OpenAPI: el nombre a partir del cual se crea la lista de herramientas de un cliente MCP. La columna **Autenticación** indica la vía más sencilla (una clave API cubre casi todo); el modelo de autenticación completo, incluidas las alternativas a una clave API, aparece en la sección siguiente.

### Búsqueda y descubrimiento

| Operación | Endpoint | Qué hace | Autenticación |
| --- | --- | --- | --- |
| `checkAvailability` | `GET /v-next/search/availability` | Comprueba si un nombre de dominio está disponible para registrarse | Ninguna |
| `checkBulkAvailability` | `GET /v-next/search/bulk-availability` | Evalúa en una sola llamada un lote de nombres candidatos | Ninguna |
| `getSuggestions` | `GET /v-next/search/suggestions` | Obtiene sugerencias algorítmicas de nombres relacionadas con una consulta | Ninguna |

### Registro y pedidos

| Operación | Endpoint | Qué hace | Autenticación |
| --- | --- | --- | --- |
| `registerDomain` | `POST /v-next/orders/register-domain` | Registra un dominio durante 0–10 años. Acepta un objeto `domainSetupOptions` (`autoPark`, `autoEns`, `autoRenew`, `dnssec`, `keepExistingNameservers`) y un `nftReceivingWallet` opcional | Clave API |
| `registerWithRecords` | `POST /v-next/orders/register-domain/records` | Registra y aplica en la misma llamada un conjunto inicial de registros DNS | Clave API |
| `getOrder` | `GET /v-next/orders/{orderId}` | Consulta un pedido hasta que alcance un estado final: `SUCCEEDED`, `FAILED`, `CANCELLED` o `PARTIALLY_COMPLETED` | Clave API |

El registro es asíncrono: `registerDomain` devuelve de inmediato el `id` del pedido y el agente consulta `getOrder` hasta que se resuelve. Tanto la [guía de Claude](/es/blog/claude-mcp-domains/) como la [guía de configuración para múltiples agentes](/es/blog/ai-agent-register/) muestran este patrón en transcripciones completas.

### Gestión de registros DNS

CRUD completo, registro por registro o por lotes, además de una lectura que no necesita autenticación alguna:

| Operación | Endpoint | Qué hace | Autenticación |
| --- | --- | --- | --- |
| `getDnsRecords` | `GET /v-next/dns/records` | Enumera todos los registros de una zona | Ninguna |
| `createDnsRecord` | `POST /v-next/dns/records` | Crea un registro | Clave API |
| `updateDnsRecord` | `PUT /v-next/dns/record` | Actualiza un registro por ID | Clave API |
| `deleteDnsRecord` | `DELETE /v-next/dns/record` | Elimina un registro por ID | Clave API |
| `batchCreateDnsRecords` | `POST /v-next/dns/records/batch` | Crea varios registros en una sola llamada | Clave API |
| `batchUpdateDnsRecords` | `PUT /v-next/dns/records/batch` | Actualiza varios registros en una sola llamada | Clave API |
| `batchDeleteDnsRecords` | `DELETE /v-next/dns/records/batch` | Elimina varios registros en una sola llamada | Clave API |

Los [Tipos de registros DNS (A, AAAA, CNAME, MX, TXT)](/es/glossary/dns-record-types/) admitidos son A, AAAA, CNAME, MX, TXT, NS, SOA, PTR, SRV, CAA, DS, TLSA, SSHFP, HTTPS, SVCB, NAPTR y SPF. Dos reglas de formato hacen tropezar la mayoría de los primeros intentos: `zoneName` no debe llevar punto final, mientras que los valores `rdata` de los registros CNAME, MX y NS sí deben llevarlo.

### Interruptores a nivel de dominio

Estos activan o desactivan una función completa, a diferencia de un único registro DNS:

| Operación | Endpoint | Qué hace | Autenticación |
| --- | --- | --- | --- |
| `toggleDomainParking` / `parkDomain` | `PUT` / `POST /v-next/dns/park` | Activa o desactiva el [Aparcamiento de dominios](/es/glossary/domain-parking/) | Clave API |
| `isDomainParked` | `GET /v-next/dns/parked` | Comprueba si un dominio está aparcado actualmente | Ninguna |
| `toggleForwarding` | `PUT /v-next/dns/forwarding` | Activa o desactiva el [Reenvío de dominio](/es/glossary/domain-forwarding/) | Clave API |
| `toggleAutoEns` | `PUT /v-next/dns/auto-ens` | Activa o desactiva la publicación automática de registros de [ENS (Servicio de Nombres de Ethereum)](/es/glossary/ens/) | Clave API |
| `toggleVercelAnyCastRecords` | `PUT /v-next/dns/vercel-anycast` | Activa o desactiva los registros DNS Anycast de Vercel | Clave API |

Ten en cuenta que [DNSSEC (Extensiones de Seguridad del DNS)](/es/glossary/dnssec/) no es uno de estos interruptores: se configura al registrar, como uno de los campos `domainSetupOptions` de `registerDomain` indicados arriba, no mediante un endpoint independiente que el agente llame después.

### Configuración del dominio

| Operación | Endpoint | Qué hace | Autenticación |
| --- | --- | --- | --- |
| `getAutoRenew` | `GET /v-next/domain-config/auto-renew` | Comprueba si la renovación automática está activada | Clave API |
| `toggleAutoRenew` | `PUT /v-next/domain-config/auto-renew` | Activa o desactiva la renovación automática | Clave API |

Cuando la [Renovación de dominio (Renovación automática)](/es/glossary/domain-renewal/) está activada, el dominio se renueva automáticamente antes de caducar mediante los métodos de pago de la billetera propietaria: una autorización permanente que conviene decidir deliberadamente para cada dominio, en lugar de dejarla activada por defecto en toda una cartera.

### Búsqueda saliente de clientes potenciales

La función más reciente convierte los dominios en propiedad en un embudo de ventas, en vez de una lista estática de activos:

| Operación | Endpoint | Qué hace | Autenticación |
| --- | --- | --- | --- |
| `getUserDomains` | `GET /v-next/user/domains` | Enumera los dominios que posee la billetera autenticada | Clave API |
| `startOutboundRun` | `POST /v-next/outbound/runs` | Inicia una ejecución de búsqueda de clientes potenciales con IA para un dominio en propiedad, con un `reasoningEffort` de `low`, `medium` o `high` | Clave API |
| `listOutboundRuns` | `GET /v-next/outbound/runs` | Enumera las ejecuciones pasadas y activas | Clave API |
| `getOutboundRun` | `GET /v-next/outbound/runs/{runId}` | Consulta el estado de una ejecución: `QUEUED`, `RUNNING`, `SUCCEEDED`, `FAILED` o `CANCELED` | Clave API |
| `listOutboundLeads` | `GET /v-next/outbound/runs/{runId}/leads` | Enumera posibles compradores clasificados, cada uno con una justificación, contactos descubiertos y cualquier borrador de contacto ya existente | Clave API |
| `prepareOutboundOutreach` | `POST /v-next/outbound/runs/{runId}/leads/{leadId}/outreach` | Genera un borrador de contacto para un posible comprador o devuelve el existente sin coste adicional de generación | Clave API |

La respuesta excluye la mecánica interna de clasificación —puntuación, detalles del modelo y estado de posibles compradores suprimidos—, de modo que un agente que resume resultados para una persona solo ve la justificación pública, el contacto encontrado y si existe un borrador.

### Pagos y cuenta

| Operación | Endpoint | Qué hace | Autenticación |
| --- | --- | --- | --- |
| `getBalance` | `GET /v-next/balance` | Consulta el saldo de NFSC (Namefi Service Credit) que financia los registros | Clave API |
| `requestNfscFaucet` | `POST /v-next/user/faucet` | Solicita créditos de prueba NFSC gratuitos (solo en entornos de desarrollo) | Clave API |
| `registerDomainX402` | `GET /x402/domain/{domainName}` | Registra y paga en un único flujo HTTP 402 firmado con una stablecoin, sin cuenta de Namefi | Firma de billetera |
| — | `GET /x402/purchase/{purchaseId}` | Consulta el estado de una compra x402 | Ninguna |
| `registerDomainMPP` | `GET /mpp/domain/{domainName}` | Registra y paga mediante el flujo de desafío-respuesta MPP (Machine Payable Protocol) | Firma de billetera |

Eso cubre todas las operaciones incluidas en búsqueda, registro, DNS, configuración de dominios, operaciones salientes y pago: se puede acceder a todas como herramientas MCP mediante la conexión con un único servidor o como llamadas HTTPS normales para agentes que no hablan MCP. (La API de Namefi también expone algunas operaciones auxiliares de gestión de cuenta y EIP-712/SIWE fuera de esta lista; el conjunto completo siempre está actualizado en la especificación OpenAPI enlazada en Fuentes más abajo).

## El modelo de autenticación: tres vías de acceso, una billetera detrás de todas

Todas las operaciones de escritura anteriores comprueban lo mismo: si quien llama controla la billetera que posee, o poseerá, el dominio, por una de tres vías. Cuál se aplica depende de la operación, no de un único ajuste a nivel de cuenta.

**Clave API (`x-api-key`).** Es la opción más sencilla y la que usa cada ejemplo práctico de este grupo de artículos. Genera una en [namefi.io/api-key](https://namefi.io/api-key); funciona para todas las operaciones anteriores, incluidas escrituras DNS, aparcamiento y registro, porque la clave hereda los permisos de la billetera que la generó. Envíala como un encabezado HTTP normal; no se necesita SDK.

**Firma de datos tipados EIP-712.** Para uso programático sin una clave almacenada, firma cada solicitud con una [Billetera](/es/glossary/wallet/) de Ethereum: los encabezados `x-namefi-signer`, `x-namefi-signature` y `x-namefi-eip712-type` envuelven la carga útil en un sobre con una marca de tiempo y un nonce de uso único que caduca a los 300 segundos. Es el modo que requieren operaciones como `toggleDomainParking`, `createDnsRecord` y `registerDomain` cuando no hay clave API. Las definiciones del dominio y los tipos proceden de endpoints en directo (`GET /v-next/eip712/domain`, `/eip712/types`), no de una constante codificada, porque la documentación de Namefi indica que pueden cambiar. Las billeteras de contratos inteligentes no pueden firmar directamente, así que una cuenta externa autorizada firma en nombre del contrato, con `x-namefi-erc1271-account` o `x-namefi-eip7702-account` para indicar qué contrato autoriza la solicitud.

**SIWE (Sign-In with Ethereum).** Un token de sesión (`x-namefi-siwe-token`) para lecturas protegidas que no necesitan una firma nueva en cada llamada, como enumerar dominios o pedidos en propiedad: obtén un nonce, consigue el mensaje que debes firmar, fírmalo con `personal_sign`, verifícalo y reutiliza el token.

Un pequeño grupo de operaciones no necesita autenticación —`checkAvailability`, `getSuggestions`, `getDnsRecords`, `isDomainParked` y los endpoints de metadatos EIP-712— porque son de solo lectura y no exponen nada que el DNS público de un dominio no mostraría ya en un navegador.

Por encima de ello está el pago. `registerDomainX402` liquida una compra mediante el [protocolo x402](https://x402.org): la billetera del comprador firma un `transferWithAuthorization` EIP-3009 para una [Stablecoin](/es/glossary/stablecoin/) como USDC, sin que intervenga una cuenta de Namefi. `registerDomainMPP` alcanza el mismo resultado mediante un desafío-respuesta firmado. Ambas opciones permiten que un agente omita la creación de una cuenta y pague por transacción; [Paga dominios con una billetera de criptomonedas: no necesitas una cuenta](/es/blog/wallet-checkout/) explica ese camino de principio a fin.

## La tokenización se ejecuta dentro del catálogo, no al margen

`registerDomain` acuña el dominio como un [NFT (Token No Fungible)](/es/glossary/nft/), un token [ERC-721 (estándar NFT)](/es/glossary/erc-721/) —[la interfaz estándar](https://eips.ethereum.org/EIPS/eip-721) que ya leen la mayoría de los mercados y billeteras—, en Base de forma predeterminada, para la billetera vinculada a la clave API de quien llama. `nftReceivingWallet` lo redirige a otra billetera o cadena en el momento del registro, y todo lo que viene después —escrituras DNS, aparcamiento, renovación automática y búsqueda saliente de clientes potenciales— comprueba ese mismo registro de propiedad en cadena, en vez de una base de datos de cuentas separada. Un [Dominio Tokenizado](/es/glossary/tokenized-domain/) negociado en un mercado como [OpenSea](https://opensea.io) lleva su control DNS y su propiedad ERC-721 como un solo objeto, no como dos sistemas que hay que mantener sincronizados a mano.

## Tres agentes, tres formas de usar el mismo conjunto de herramientas

**Un desarrollador registra un dominio y despliega DNS en una conversación.** `checkAvailability` confirma que el nombre está disponible, `registerDomain` lo envía con `domainSetupOptions` configurado para `autoRenew` y `dnssec` y, cuando el pedido llega a `SUCCEEDED`, `batchCreateDnsRecords` escribe los registros CNAME y TXT que espera el paso de verificación de una plataforma de despliegue. La [guía rápida de Namefi MCP para agentes de programación](/es/blog/mcp-quickstart/) recorre esta secuencia dentro de un editor.

**Un inversor de dominios gestiona una cartera.** `getUserDomains` obtiene las tenencias actuales, `checkBulkAvailability` evalúa nuevos candidatos en una sola llamada y `registerDomain` adquiere los que merecen la pena. Para nombres en reventa, `toggleDomainParking` publica una página de destino e `isDomainParked` confirma que está activa; en toda la cartera, `getAutoRenew` y `toggleAutoRenew` deciden qué nombres justifican una autorización permanente de renovación y cuáles son suficientemente especulativos como para dejarlos caducar.

**Una empresa busca clientes potenciales salientes para nombres que ya posee.** `getUserDomains` identifica un dominio sin usar, `startOutboundRun` inicia la investigación y `getOutboundRun` consulta hasta que alcanza `SUCCEEDED`. `listOutboundLeads` devuelve empresas clasificadas cuyo perfil sugiere que querrían ese nombre y `prepareOutboundOutreach` redacta un correo para cada posible comprador: se genera una vez y después se devuelve gratis en llamadas repetidas.

## Antes de que un agente ejecute todo esto sin supervisión

La propia documentación de operaciones salientes de Namefi marca cuatro operaciones como **consecuenciales**: `registerDomain`, `registerWithRecords`, `startOutboundRun` y `prepareOutboundOutreach`, porque cada una consume saldo o realiza una acción visible para terceros. Las herramientas de solo lectura, como `checkAvailability`, no implican ningún riesgo al ejecutarse de forma autónoma; cualquier operación que escriba un pedido, un registro DNS en un dominio activo o un borrador de contacto merece un paso de confirmación. [¿Qué es un registrador de dominios nativo para agentes?](/es/blog/agent-native/) incluye una lista de comprobación más completa para evaluar de este modo la superficie orientada a agentes de cualquier registrador.

## Cómo mantener actualizado este catálogo

Esta tabla refleja la especificación OpenAPI en directo de Namefi en la fecha de publicación indicada arriba, no una hoja de ruta fija: las nuevas operaciones aparecen en [namefi.io/llms.txt](https://namefi.io/llms.txt) y [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) antes de llegar a la tabla de cualquier artículo del blog.

## Preguntas frecuentes

### ¿Necesito una clave API solo para comprobar si un nombre está disponible?

No. `checkAvailability`, `checkBulkAvailability` y `getSuggestions` no requieren autenticación, por lo que funcionan con un agente recién conectado antes de financiar nada.

### ¿Puede un agente usar todo este catálogo sin que yo llegue a tener una clave API de Namefi?

Sí. Tanto `registerDomainX402` como `registerDomainMPP` liquidan un registro mediante una firma de billetera sin cuenta de Namefi, y la firma EIP-712 cubre directamente desde una billetera el resto de las operaciones de escritura.

### ¿Se tokeniza automáticamente un dominio cuando lo registro por cualquiera de estas vías?

Sí, de forma predeterminada y en todas las vías de registro. Si no se especifica `nftReceivingWallet`, el dominio se registra como un NFT ERC-721 en Base para la billetera vinculada a la clave API de quien llama.

### ¿Qué operaciones debe confirmar una persona antes de que las ejecute un agente autónomo?

Como mínimo, las cuatro que la documentación de Namefi marca como consecuenciales: `registerDomain`, `registerWithRecords`, `startOutboundRun` y `prepareOutboundOutreach`, además de cualquier escritura DNS en un dominio que ya sirva tráfico en directo.

## Conecta tu agente al catálogo completo

Todas las herramientas anteriores están disponibles tras una única conexión: `https://api.namefi.io/mcp`. Si aún no la has configurado, [Cómo registrar un dominio en Namefi con tu agente de IA](/es/blog/ai-agent-register/) ofrece la configuración exacta para seis clientes distintos, y [llms.txt para dominios](/es/blog/llms-txt/) explica la capa de descubrimiento que hay debajo.

**[Genera una clave API de Namefi](https://namefi.io/api-key)** y dirige tu agente al servidor: las herramientas anteriores son las que encontrará esperándole.

## Fuentes y lecturas adicionales

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (URL del servidor MCP, transporte, autenticación y referencia de operaciones principales: fuente primaria de este catálogo)
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) (referencia en un solo archivo que integra pagos Web3 y búsqueda saliente de clientes potenciales)
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (flujos de x402, MPP, EIP-712 y SIWE en detalle)
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) (descriptor de descubrimiento de MCP: nombre del servidor, URL, transporte y tipo de autenticación)
- Namefi — [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json) (especificación OpenAPI 3 legible por máquina: fuente de cada `operationId` y endpoint del catálogo de capacidades anterior)
- Namefi — [docs.namefi.io: Authentication](https://docs.namefi.io/docs/02-authentication.mdx#:~:text=The%20Namefi%20API%20supports%20three%20authentication%20methods) (modos de autenticación con clave API, EIP-712 y SIWE; requisitos de autenticación por operación; delegación ERC-1271/EIP-7702)
- Namefi — [docs.namefi.io: Register a domain](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx) (campos de solicitud de registro, flujo de consulta y valores de estado de pedidos)
- Namefi — [docs.namefi.io: Managing your balance](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx) (endpoints de saldo NFSC y faucet)
- Model Context Protocol — [What is the Model Context Protocol?](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications) (visión general del protocolo)
- llmstxt.org — [The /llms.txt file](https://llmstxt.org) (especificación y fundamento de la convención de descubrimiento que sigue el archivo de Namefi)
- x402.org — [x402 protocol](https://x402.org) (estándar de pago con stablecoins basado en HTTP 402 que sustenta `registerDomainX402`)
- Ethereum Improvement Proposals — [ERC-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721) (estándar de token que implementan los NFT de dominios de Namefi)
