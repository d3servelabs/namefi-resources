---
title: "El estado de la gestión de dominios mediante agentes en 2026"
date: '2026-07-10'
language: 'es'
tags: ['ai-agents', 'domains', 'analysis']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: analysis
ogImage: ../../assets/state-of-agentic-og.jpg
description: "El paso del registro de dominios a la capa de agentes: una cronología con fuentes, una auditoría de lo lanzado frente a lo anunciado —incluido Namefi— y predicciones refutables para 2027."
keywords: ["estado de la gestión de dominios mediante agentes", "gestión de dominios mediante agentes 2026", "tendencias de IA en la industria de dominios", "adopción de IA en la industria de dominios", "cronología de la capa de agentes", "predicciones sobre registradores de dominios para 2027", "adopción de registro de dominios con MCP", "registros de dominios .ai en 2026", "beta de la API Registrar de Cloudflare", "API nativa de IA de Name.com", "tesis de los agentes como revendedores de dominios", "informe de Verisign sobre la industria de nombres de dominio", "identidad de agentes de IA anclada en DNS"]
relatedArticles:
  - /es/blog/agents-buy-domains/
  - /es/blog/cf-namecom-namefi/
  - /es/blog/ai-domain-platforms/
  - /es/blog/agent-native/
  - /es/blog/ai-agent-register/
relatedTopics:
  - /es/topics/domain-basics/
  - /es/topics/web3-foundations/
relatedSeries:
  - /es/series/blockchain-concepts/
  - /es/series/domain-apocalypse/
relatedGlossary:
  - /es/glossary/ai-agent/
  - /es/glossary/epp/
  - /es/glossary/registrar/
  - /es/glossary/registry/
  - /es/glossary/reseller/
---

A mitad de 2026, la historia de que «los agentes de IA cambiarán cómo se registran los dominios» se puede contrastar con hechos reales en lugar de previsiones. Parte de ello ocurrió en una fecha concreta y verificable. Otra parte sigue siendo una etiqueta beta, una publicación de posicionamiento o un borrador en la cola de un organismo de normalización. Este artículo mantiene separados ambos grupos: una cronología documentada de lo que acercó el registro de dominios al modelo de [Cómo los agentes de IA compran dominios sin intervención humana (2026)](/es/blog/agents-buy-domains/), una auditoría honesta de lo que realmente se ha lanzado frente a lo meramente anunciado (Namefi incluido, con todas sus carencias), la tesis de los «agentes como revendedores» que circula en la prensa especializada y un conjunto de predicciones para 2027 redactadas de modo que cualquiera pueda calificarlas de verdaderas o falsas sin depender de nuestra interpretación.

## Las cifras de adopción y de dónde provienen realmente

Dos cifras se citan constantemente este año en la cobertura sobre «IA y dominios», y merecen niveles de confianza distintos.

La primera es la propia afirmación de Name.com de que [«el 91% de las personas encuestadas prevé que los agentes de IA gestionen al menos parte de sus dominios en los próximos dos años»](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years), extraída de una publicación del blog de la empresa del **10 de julio de 2025**. Name.com atribuye la cifra a «nuestra reciente encuesta de clientes» y no publica tamaño de muestra, metodología ni verificación independiente. Tómala por lo que es: **Name.com informa** que sus propios clientes, encuestados por Name.com, dijeron esto; es una percepción comunicada por la empresa, no una estadística independiente del sector.

La segunda cifra es verificable y cuenta con corroboración independiente. El **28 de enero de 2026**, el Gobierno de Anguila anunció que el [ccTLD (Dominio de Nivel Superior de Código de País)](/es/glossary/cctld/) `.ai` había superado un millón de dominios registrados, un hito que [Domain Name Wire informó directamente](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/): aproximadamente 598,000 dominios `.ai` a comienzos de 2025, superando el millón unos trece meses después, tras un crecimiento que tardó cinco años desde una base de alrededor de 40,000 registros en 2020. La cobertura de CircleID sobre la industria de dominios cita el mismo hito de forma independiente, y la nota sectorial de Hogan Lovells sobre `.ai` corrobora la trayectoria: una cifra confirmada por varias fuentes, no una única afirmación de la propia empresa.

Para ponerla en escala frente al mercado de dominios en general: el [Domain Name Industry Brief](https://www.dnib.com) de Verisign para el primer trimestre de 2026 informó de 392.5 millones de registros de nombres de dominio en todos los TLD, un aumento de 1.4% trimestre a trimestre y de 6.5% interanual, cifra que [la cobertura de CircleID sobre el informe](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29) cita directamente. El aproximadamente un millón de registros `.ai` se incluye dentro de esos 392.5 millones como una fracción pequeña pero de rápido crecimiento: un impulso auténtico, aunque todavía no una cuota que transforme el mercado. Ni DNIB ni los materiales públicos de Identity Digital desglosan qué fracción de los registros pasa por un agente en vez de por una compra en el navegador; esa es la laguna con la que trabaja el resto del artículo. Podemos verificar *que* se lanzó infraestructura orientada a agentes y aproximadamente *cuándo*, pero todavía no *qué volumen* circula por ella.

## Cronología: el traslado a la capa de agentes

Cada fecha de la tabla siguiente se ha comprobado frente a un anuncio primario, documentación oficial o un informe de prensa especializada consultado directamente, no frente a un agregador secundario que repite una cifra sin fuente.

| Fecha | Evento | Fuente |
| --- | --- | --- |
| 2004-03 | [EPP](/es/glossary/epp/) (Extensible Provisioning Protocol), el lenguaje de máquina a máquina que los registradores siguen usando para comunicarse con los registros, alcanza el estatus de estándar propuesto | [RFC 3730–3734, publicados en marzo de 2004](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004) |
| 2024-09-03 | Se publica la propuesta del archivo `/llms.txt`, que ofrece a los sitios una forma estándar de describirse ante modelos de lenguaje durante la inferencia | [llmstxt.org, publicado por Jeremy Howard](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time) |
| 2024-11-25 | Anthropic lanza el [Model Context Protocol](https://modelcontextprotocol.io), un estándar abierto para conectar aplicaciones de IA con servidores de herramientas externos | [Anuncio de MCP de Anthropic](https://www.anthropic.com/news/model-context-protocol) |
| 2025-07-10 | Name.com publica su texto de posicionamiento como la «primera plataforma de dominios nativa de IA», creada sobre MCP y OpenAPI, con la estadística autodeclarada del 91% anterior | [Blog de Name.com](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI) |
| 2026-01-28 | `.ai` supera un millón de dominios registrados, según un anuncio del Gobierno de Anguila | [Domain Name Wire](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/) |
| 2026-04-15 | Cloudflare incorpora su API Registrar a una beta pública durante «Agents Week», integrando registro, búsqueda y precios en la capa MCP | [Anuncio de la beta de la API Registrar de Cloudflare](https://blog.cloudflare.com/registrar-api-beta/); [cobertura del sector](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer) |
| 2026-04-20 | CircleID publica su análisis sobre los «agentes como revendedores de dominios» | [CircleID, Simone Catania](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) |
| 2026-04-24 | El Domain Name Industry Brief de Verisign para el primer trimestre de 2026 informa de 392.5 millones de registros de dominios en total, el contexto de mercado para todas las cifras anteriores | [DNIB.com](https://www.dnib.com); [cobertura de CircleID](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29) |
| 2026-04-27 | Identity Digital, matriz del registro `.ai` y de [Name.com](https://www.name.com), lanza un «estándar de identidad neutral para agentes de IA anclado en DNS» que propone usar registros DNS para consignar quién responde por un agente | [Sala de prensa de Identity Digital](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-identity-standard-for-ai-agents.html) |
| 2026-06-04 | Innovation Labs de Identity Digital formaliza esa propuesta como un Internet-Draft del IETF, «DNS-Anchored Durable Identity for AI Agents (DNSid)» | [GlobeNewswire](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems); [borrador en el datatracker del IETF](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

Leído en orden, el patrón es este: un protocolo de aprovisionamiento con veinte años de antigüedad; luego dos estándares de agentes de IA de propósito general que no se crearon para dominios (llms.txt y MCP); después, registradores que adaptan esos estándares a los flujos de compra uno a uno; y finalmente la misma familia de registros (Identity Digital) que va más allá de su propio registrador y propone DNS como infraestructura para la *identidad* del agente, no solo para su *compra*. Ese último paso es el más nuevo y el menos consolidado: un Internet-Draft es una propuesta enviada para discusión, no un estándar ratificado.

## Lo que realmente se ha lanzado frente a lo anunciado

«Nativo para agentes» se usa con ligereza en el lenguaje de marketing. Esta tabla recoge qué ha lanzado realmente cada entrada, comprobado frente a la documentación pública de cada plataforma, y qué sigue siendo una etiqueta beta, una afirmación de posicionamiento o una propuesta de normalización sin código operativo detrás.

| Plataforma | Capacidad | Estado | Evidencia |
| --- | --- | --- | --- |
| Namefi | Servidor MCP (`api.namefi.io/mcp`, Streamable HTTP, detectable en `/.well-known/mcp/servers.json`) | **Lanzado** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | Proceso de compra de USDC firmado con billetera mediante [x402](/es/glossary/x402/) (EIP-3009 `transferWithAuthorization`, sin necesidad de cuenta) | **Lanzado** | [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) |
| Namefi | Descubrimiento basado en `llms.txt` para herramientas de agentes y referencia REST | **Lanzado** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | Mecanismo de límite de gasto o de confirmación de compra en la capa API | **No lanzado**: a la fecha de este artículo no hay una puerta documentada; la salvaguarda reside hoy en el cliente MCP, no en el servidor | Nuestro propio análisis [¿Qué es un registrador de dominios nativo para agentes?](/es/blog/agent-native/), contrastado directamente con `namefi.io/llms.txt` y `namefi.io/web3/llms.txt` para este artículo |
| Cloudflare | API Registrar: búsqueda, disponibilidad, consulta de precio y registro síncrono | **Lanzado, en beta pública** desde 2026-04-15 | [Anuncio de la beta de la API Registrar de Cloudflare](https://blog.cloudflare.com/registrar-api-beta/) |
| Cloudflare | Gestión de registros DNS, transferencias, renovaciones y actualizaciones de contacto mediante la misma API | **Anunciado, en desarrollo**: la propia publicación de Cloudflare dice que está «trabajando activamente para ampliar la API y abarcar una mayor parte de la experiencia central de Registrar», con objetivo para más adelante en 2026 | [Anuncio de la beta de la API Registrar de Cloudflare](https://blog.cloudflare.com/registrar-api-beta/) |
| Name.com | Posicionamiento nativo de IA, MCP y OpenAPI; encuadre de lenguaje natural a código de integración | **Anunciado**: una publicación de posicionamiento, no una especificación de capacidades desglosada | [Blog de Name.com](https://www.name.com/blog/the-first-ai-native-domain-platform) |
| Name.com | `llms.txt` detectable o servidor MCP dedicado, comprobado directamente en la raíz del dominio | **No encontrado** en el momento de nuestra revisión | Comprobación directa de `name.com`, contrastada en [Cloudflare vs Name.com vs Namefi: registradores nativos para agentes](/es/blog/cf-namecom-namefi/) |
| Identity Digital | DNSid: un registro de propietario responsable, anclado en DNS y verificable criptográficamente, para agentes de IA | **Propuesto**: un Internet-Draft del IETF enviado para discusión, no un estándar ratificado ni integrado en una compra real de ningún registrador | [Datatracker del IETF: draft-ihsanullah-dnsid](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

Esta tabla deja dos conclusiones. Primera: ninguna plataforma que revisamos, incluido Namefi, ha lanzado un límite de gasto documentado y aplicado por la API; todas las salvaguardas residen una capa por encima, en la política que la persona establezca del lado del cliente. Es la misma conclusión a la que llegó nuestra lista de comprobación sobre registros nativos para agentes al puntuar la categoría. Segunda: DNS como ancla de identidad para el agente en sí, y no solo para el dominio que compra, sigue en la fase de «enviado para discusión al IETF», a meses de que un registrador pueda conectarlo a una compra real, incluso si recibe una buena acogida.

## La tesis del revendedor

La expresión que se repite en la cobertura de la industria de dominios en 2026 es que los agentes de IA se están convirtiendo en *revendedores*. El análisis de CircleID del 20 de abril de 2026 lo dice directamente: [«Los agentes de IA actúan cada vez más como revendedores de dominios: comprueban la disponibilidad, registran nombres y configuran DNS sin intervención humana.»](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)

Conviene separar esa elección de palabras de lo que implica. Un [Revendedor](/es/glossary/reseller/), en el vocabulario propio de la industria de dominios, es algo concreto y formal: una parte que vende o aprovisiona dominios bajo un acuerdo de acreditación de [ICANN](/es/glossary/icann/) de un registrador, con obligaciones contractuales frente al registrador y, de forma indirecta, frente a ICANN. Que un agente llame hoy a una API de registro no crea esa relación: el agente actúa como delegado de la persona cliente final, autenticado con la propia clave API o billetera de esa persona, no como una parte acreditada por derecho propio. El encuadre de CircleID es descriptivo, no una afirmación sobre el estatus de acreditación: el *patrón de comportamiento* de un revendedor —buscar, poner precio, registrar y configurar DNS, repetidamente, a volumen y en nombre de otra persona— ya aparece en los flujos de agentes aunque el operador no sea una empresa con un acuerdo de revendedor firmado.

Sigue abierta la cuestión de si ese comportamiento se consolidará en algo que los registros reconozcan formalmente. Exigiría que los registros y los registradores decidieran si la actividad de agentes a gran volumen y delimitada por políticas necesita su propio nivel de acreditación, postura de limitación de tasa o categoría de supervisión de abuso, distinta de la de un revendedor humano. Nada de lo que aparece en la cronología anterior —la beta de Cloudflare, la publicación de Name.com, el borrador DNSid de Identity Digital— propone todavía ese nivel. DNSid se acerca más, ya que trata explícitamente de verificar quién responde por las acciones de un agente, pero «quién responde» y «si está formalmente acreditado como revendedor» son preguntas distintas, y el borrador solo responde a la primera. Para conocer la mecánica de una compra individual, consulta [Cómo los agentes de IA compran dominios sin intervención humana (2026)](/es/blog/agents-buy-domains/).

## Predicciones para 2027

Cada una de estas predicciones está redactada para poder comprobarse con evidencia pública: una afirmación concreta, no una impresión, de modo que quien vuelva a leerla a mediados de 2027 pueda marcarla como verdadera, falsa o sin resolver sin que tengamos que interpretarla.

1. **Al menos uno entre Cloudflare, Name.com o un registrador generalista comparable publicará antes de julio de 2027 un mecanismo documentado de límite de gasto o confirmación de compra aplicado por la API** (no solo una guía del lado del cliente). A la fecha de este artículo, esa fila está vacía en todas las plataformas que comprobamos, incluido Namefi.
2. **La API Registrar de Cloudflare perderá su etiqueta «beta» y lanzará antes de finales de 2027 al menos una de estas funciones: gestión de registros DNS, automatización de renovaciones o compatibilidad con transferencias**, conforme al «más adelante en 2026» de su propio anuncio beta, con un año adicional de margen.
3. **El Internet-Draft DNSid (o un sucesor directo que responda a «quién responde por este agente») seguirá en estado de borrador del IETF, no será un RFC aprobado**, antes de julio de 2027; los documentos de normalización suelen tardar años desde su presentación, y este se presentó en junio de 2026.
4. **Los registros `.ai` superarán 1.5 millones** antes de julio de 2027, continuando la curva de crecimiento que documentaron Domain Name Wire e Identity Digital, en vez de estancarse cerca del millón que superaron en enero de 2026.
5. **Al menos una de las plataformas comparadas usará públicamente las palabras «reseller» o «agent-reseller»** en su propio marketing o documentación para la actividad de registro impulsada por agentes, formalizando el encuadre que empleó CircleID en abril de 2026 en vez de dejarlo como lenguaje de la prensa especializada.

## Preguntas frecuentes

### ¿Cuántos dominios están registrando realmente los agentes de IA ahora mismo?

Ningún registro ni registrador que revisamos —DNIB, Identity Digital, Cloudflare o Name.com— publica una cifra que separe los registros iniciados por agentes de los realizados por personas. Lo verificable es la infraestructura: qué plataformas lanzaron una vía de registro invocable por agentes (Namefi, Cloudflare en beta y Name.com en su posicionamiento) y cuándo. El volumen de adopción atribuible a agentes no es un dato público a la fecha de este artículo.

### ¿La estadística del 91% de Name.com es una cifra fiable para el sector?

Trátala como percepción comunicada por la empresa, no como una encuesta independiente. La publicación de Name.com de julio de 2025 atribuye la cifra a «nuestra reciente encuesta de clientes» sin publicar metodología, tamaño de muestra ni un auditor externo: es una señal de lo que los clientes de Name.com dijeron a la empresa, no una estadística citable para todo el mercado.

### ¿`.ai` realmente alcanzó un millón de registros y quién lo confirmó?

Sí, con corroboración independiente. El Gobierno de Anguila, que administra el [ccTLD (Dominio de Nivel Superior de Código de País)](/es/glossary/cctld/) `.ai`, anunció directamente el hito y Domain Name Wire informó de las cifras de crecimiento con una fecha concreta (28 de enero de 2026). CircleID y una nota sectorial de Hogan Lovells también citan el mismo hito de manera independiente: un estándar de evidencia distinto de una estadística empresarial autodeclarada.

### ¿Qué es DNSid y cambia la forma en que se registran los dominios?

DNSid es un Internet-Draft, una propuesta formal, no un estándar ratificado, presentado al IETF en junio de 2026 por Innovation Labs de Identity Digital. Propone usar registros DNS como un registro duradero y verificable de «quién responde por este agente de IA», un problema diferente del registro en sí: identificar al agente, no comprar el dominio. A la fecha de este artículo, no está integrado en la compra real de ningún registrador.

### ¿Algún registrador ha lanzado realmente un control de límite de gasto o de «no dejes que el agente gaste de más»?

No en la capa API, por lo que pudimos verificar consultando directamente la documentación de cada plataforma. Namefi, Cloudflare y Name.com dejan esa salvaguarda en la política que una persona establezca del lado del cliente: el cliente MCP, el marco de agentes o el límite de financiación de la clave API, en vez de una puerta de confirmación aplicada por el propio registrador. Es la única fila que toda tarjeta de puntuación sobre «nativo para agentes» en este espacio, incluida la nuestra, sigue marcando como incompleta.

### ¿Dónde puedo leer la mecánica de una compra individual de un agente, en lugar de la perspectiva de todo el sector?

[Cómo los agentes de IA compran dominios sin intervención humana (2026)](/es/blog/agents-buy-domains/) explica paso a paso la secuencia de buscar, fijar el precio, autenticarse, registrar y configurar. [Cloudflare vs Name.com vs Namefi: registradores nativos para agentes](/es/blog/cf-namecom-namefi/) compara las tres plataformas función por función, y [¿Qué es un registrador de dominios nativo para agentes?](/es/blog/agent-native/) expone la lista de comprobación que sustenta la tabla de este artículo sobre lo lanzado frente a lo anunciado.

## Registra con un agente que ya incorpora toda la pila

La mayoría de las carencias que documenta este artículo —límites de gasto sin documentar, etiquetas beta, publicaciones de posicionamiento sin especificación desglosada— no son exclusivas de una plataforma; describen dónde se encuentra la categoría a mediados de 2026. [Namefi](https://namefi.io) ofrece lo que ya se ha lanzado: un servidor MCP al que tu agente se conecta directamente, una API REST detectable mediante `llms.txt` y un proceso de compra [x402](/es/glossary/x402/) de USDC firmado con billetera sin necesidad de cuenta, además de la propiedad mediante un [Dominio Tokenizado](/es/glossary/tokenized-domain/) si quieres que el dominio resida en la billetera de un agente.

**[Busca y registra un dominio en Namefi](https://namefi.io).**

## Fuentes y lecturas adicionales

- Domain Name Wire — [El espacio de nombres .AI alcanza 1 millón de dominios (28 de enero de 2026)](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/)
- CircleID — [El universo de los dominios en 2026: IA, seguridad, madurez de mercado y la nueva frontera de los gTLD (20 de abril de 2026)](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- CircleID — [DNIB informa de 392.5 millones de registros de nombres de dominio en el primer trimestre de 2026](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29)
- Verisign / DNIB.com — [Domain Name Industry Brief](https://www.dnib.com)
- Cloudflare — [Anuncio de la beta de la API Registrar (15 de abril de 2026)](https://blog.cloudflare.com/registrar-api-beta/)
- webhosting.today — [Los agentes de IA ya pueden registrar dominios sin intervención humana](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer)
- Name.com — [La primera plataforma de dominios nativa de IA (10 de julio de 2025)](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years)
- Identity Digital — [Identity Digital lanza un estándar de identidad neutral para agentes de IA anclado en DNS (27 de abril de 2026)](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-identity-standard-for-ai-agents.html)
- Identity Digital / GlobeNewswire — [Innovation Labs de Identity Digital presenta al IETF una propuesta de identidad duradera para agentes de IA anclada en DNS (4 de junio de 2026)](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems)
- Datatracker del IETF — [draft-ihsanullah-dnsid: identidad duradera para agentes de IA anclada en DNS](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/)
- llmstxt.org — [La propuesta del archivo /llms.txt (publicada el 3 de septiembre de 2024)](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- Anthropic — [Presentación del Model Context Protocol (25 de noviembre de 2024)](https://www.anthropic.com/news/model-context-protocol)
- Wikipedia — [Extensible Provisioning Protocol (estándar propuesto, marzo de 2004)](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- Namefi — [namefi.io/llms.txt (servidor MCP y referencia de la API REST)](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt (referencia para la compra firmada con billetera x402)](https://namefi.io/web3/llms.txt)
