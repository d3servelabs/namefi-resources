---
title: "ENS vs Unstoppable vs dominios DNS tokenizados"
date: '2026-06-24'
language: es
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
cluster: choosing-a-tld
series: domain-flipping-skills
seriesOrder: 37
format: comparison
description: "ENS vs Unstoppable Domains vs DNS de ICANN tokenizado, comparados según su resolución en navegadores, las renovaciones y quién controla realmente el nombre."
ogImage: ../../assets/ens-vs-unstoppable-vs-tokenized-dns-og.jpg
keywords: ['ENS vs Unstoppable Domains', 'ENS vs dominios tokenizados', 'Unstoppable Domains vs ENS', 'comparación de dominios web3', 'dominios DNS tokenizados', 'flipping de dominios ENS', 'dominios .eth', 'dominios .crypto', 'los dominios web3 resuelven en navegadores', 'tarifas de renovación de ENS', 'Unstoppable Domains sin renovación', 'ICANN vs dominios web3', 'quién controla un dominio web3', 'dominio tokenizado vs dominio web3', 'dominios NFT comparados']
relatedArticles:
  - /es/blog/onchain-domain-flipping/
  - /es/blog/what-are-tokenized-domains/
  - /es/blog/ens-vs-dns-domain-flipping/
  - /es/blog/onchain-domain-marketplaces-compared/
  - /es/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /es/topics/choosing-a-tld/
  - /es/topics/domain-investing/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/domain-investor-field-guide/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/dns/
  - /es/glossary/icann/
  - /es/glossary/tld/
  - /es/glossary/web3/
---

Si estás haciendo flipping de nombres on-chain, la primera decisión es qué tipo de "nombre on-chain" estás negociando siquiera. Las tres categorías que la mayoría de la gente mete en el mismo saco no son el mismo activo, y las diferencias deciden si el nombre resuelve en un navegador, si deberás pagar una renovación el año que viene y quién lo controla realmente. Esta guía compara las tres de tú a tú: [ENS](/es/glossary/ens/) (`.eth`), [Unstoppable Domains](https://unstoppabledomains.com) (`.crypto`, `.x`, `.nft`) y dominios [DNS](/es/glossary/dns/) reales de ICANN tokenizados (los nombres `.com`/`.io`/`.xyz` que puedes [tokenizar](/es/glossary/tokenize/) en [Namefi](https://namefi.io)).

Coinciden en una cosa: cada una pone la propiedad del nombre en tu [billetera](/es/glossary/wallet/) como un token. Difieren en todo lo que importa para la reventa. Si solo te quedas con una idea, que sea esta: los nombres ENS y Unstoppable viven *fuera* de la raíz de ICANN, mientras que un dominio DNS tokenizado *es* un dominio de ICANN con un token añadido. Ese único hecho repercute en cascada sobre la resolución, las renovaciones y el control.

## Qué es cada una en realidad

![Ilustración editorial de tres tarjetas de nombre-token sobre pequeños pedestales una al lado de otra: un token hexagonal estilo .eth, una insignia redondeada de nombre Web3 y una clásica tarjeta de dominio ICANN con un globo terráqueo, todas con igual protagonismo](../../assets/ens-vs-unstoppable-vs-tokenized-dns-01-three-name-types.jpg)

**ENS** es un sistema de nombres sobre [Ethereum](/es/glossary/ethereum/). La documentación oficial lo describe llanamente: [ENS asigna nombres legibles por humanos como 'alice.eth' a identificadores legibles por máquinas, como direcciones de Ethereum](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names), hashes de contenido y metadatos. Un nombre `.eth` se emite como un token en Ethereum, y [transfieres su nombre igual que cualquier otro token ERC721](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token), de modo que, mecánicamente, es un [NFT](/es/glossary/nft/) [ERC-721](/es/glossary/erc-721/). Lo crucial: `.eth` no está delegado por ICANN; es un espacio de nombres que ENS creó on-chain.

**Unstoppable Domains** vende nombres nativos de blockchain como `.crypto`, `.x`, `.nft` y `.dao`. Estos [nombres de dominio también pueden acuñarse como un token no fungible (NFT) en la blockchain de Ethereum](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token), y la empresa los almacena en tu billetera; su documentación de soporte dice que los [dominios Web3 se almacenan en tu billetera de criptomonedas como activos digitales (NFT) y son plenamente de tu propiedad](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets). Al igual que `.eth`, estos TLD no forman parte de la raíz de ICANN.

**Los dominios DNS tokenizados** son distintos por naturaleza. El activo subyacente es un dominio de ICANN corriente —`example.com`, `yourname.io`— registrado a través de un [registrador](/es/glossary/registrar/) acreditado, con un token on-chain acuñado para reflejar su propiedad. Desglosamos la mecánica en [qué son los dominios tokenizados](/es/blog/what-are-tokenized-domains/), pero en resumen: es un nombre con dos capas sincronizadas, no un nuevo espacio de nombres. Para el encuadre más amplio de la categoría, consulta [dominio tokenizado vs dominio web3](/es/blog/tokenized-domain-vs-web3-domain/).

## Resolución en el navegador: ¿el nombre simplemente funciona?

![Ilustración editorial de tres ventanas de barra de direcciones de navegador apiladas: la de arriba muestra una marca de verificación verde mientras que las otras dos necesitan un pequeño complemento de puerta de enlace en forma de pieza de rompecabezas antes de resolver](../../assets/ens-vs-unstoppable-vs-tokenized-dns-02-resolvability.jpg)

Esta es la línea divisoria más clara, y para quien hace flipping a menudo lo es todo, porque la resolución es lo que la mayoría de los compradores finales está pagando en realidad.

Un `.com` tokenizado resuelve en todas partes donde lo hace un `.com` normal —cualquier navegador, cualquier cliente de correo, cualquier CDN y autoridad de certificación— porque *es* un `.com` normal. No se requiere nada especial del visitante.

Los nombres de ENS y Unstoppable no superan ese listón por sí solos. Unstoppable es franca en que sus nombres necesitan ayuda: [puedes descargar nuestra extensión para la resolución de dominios en Chrome y Firefox](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=you%20can%20download), y solo resuelven de forma nativa en un puñado de navegadores amigables con las criptomonedas, como Brave y Opera. Los nombres `.eth` de ENS corren la misma suerte en navegadores estándar sin un resolutor, una puerta de enlace o una extensión. Eso no es una crítica a la ingeniería: es una decisión de diseño deliberada que les da a estos sistemas la libertad de iterar fuera de ICANN. Pero cambia quién es tu comprador: estás vendiendo principalmente al público [web3](/es/glossary/web3/) y nativo de billeteras, no al mercado general que espera que un nombre cargue en un Chrome normal y corriente.

Un matiz que vale la pena conocer: ENS tiende un puente *hacia* el DNS en lugar de alejarse de él. Su documentación señala que [ENS admite nombres DNS, permitiendo a los usuarios importar nombres DNS a ENS](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names) mediante [DNSSEC](/es/glossary/dnssec/). Así, el propietario de un `.com` puede proyectar su nombre real dentro de ENS, pero es el nombre DNS el que hace la resolución en la internet habitual, mientras que ENS añade una capa de identidad on-chain. Eso no hace que el propio `.eth` resuelva en un navegador estándar.

## Renovaciones: ¿debes dinero el año que viene?

El modelo de renovación es donde las tres divergen de una forma que golpea directamente tu coste de mantenimiento, y donde quien hace flipping puede llevarse una desagradable sorpresa.

Los nombres `.eth` de ENS conllevan una tarifa anual. La documentación oficial del registrador es explícita sobre los precios: [un .eth de 5 o más letras te costará 5 USD al año. Uno de 4 letras, 160 USD al año, y uno de 3 letras, 640 USD al año](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you), y [esta tarifa se paga en ETH](https://docs.ens.domains/registry/eth/#:~:text=This%20fee%20is%20paid%20in%20ETH). Si la pasas por alto, hay un período de gracia, tras el cual, según ENS, [90 días después de que un nombre expira (es decir, tras el período de gracia), el nombre entrará en una subasta de prima temporal](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires). Para nombres `.eth` cortos y valiosos, la renovación es una partida de gasto real.

Unstoppable Domains comercializa el modelo opuesto: una compra única. Su documentación dice que los dominios Web3 [no pueden ser arrebatados, no requieren renovaciones y son tuyos de por vida](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=don%27t%20require%20renewals%2C%20and%20are%20yours%20for%20life). No tener factura anual resulta atractivo para quien hace flipping de comprar y mantener, aunque "de por vida" es una afirmación sobre la intención del protocolo, no una garantía de ICANN: estos nombres existen solo mientras lo haga la infraestructura de resolución que los lee.

Los dominios DNS tokenizados siguen la economía normal de ICANN: pagas la renovación anual de un registrador, y los registros de gTLD se limitan a un plazo máximo de 10 años. Es un coste recurrente, pero es el mismo coste bien conocido que todo inversor en `.com` ya presupuesta. La tokenización no añade una segunda renovación: el token sigue el rastro de la única inscripción DNS que tiene debajo.

## Quién controla realmente el nombre

![Ilustración editorial de tres paneles de control, cada uno con un reloj de renovación y una llave: una llave sostenida por completo por la mano de un usuario, y las otras dos extendiéndose hacia una alta torre de registro](../../assets/ens-vs-unstoppable-vs-tokenized-dns-03-who-controls.jpg)

El término "autocustodia" se usa con ligereza en las tres, así que conviene ser preciso sobre qué significa el control en cada capa.

En el caso de ENS y Unstoppable, el control on-chain es genuinamente tuyo: quien tiene la [clave privada](/es/glossary/private-key/) tiene el nombre, sin que ningún registrador pueda recuperarlo mediante un ticket de soporte. Ese es el verdadero atractivo de que la [propiedad custodial](/es/glossary/custodial-ownership/) sea reemplazada por la custodia de la billetera. La trampa es que "el nombre" solo significa algo dentro de los sistemas de resolución que lo honran. Si controlas el token pero los únicos lugares que lo resuelven son una extensión de navegador y algunas dApps, tu control es real, pero su *alcance* está acotado por la adopción.

En el caso de un dominio DNS tokenizado, el control es por capas. El token en tu billetera rige la propiedad y la transferencia on-chain; el nombre subyacente sigue siendo un dominio de ICANN real, lo que significa que permanece sujeto a la renovación, la política de ICANN y las disputas [UDRP](/es/glossary/udrp/), las mismas reglas bajo las que vive todo `.com`. Una plataforma de tokenización reputada mantiene ambas capas sincronizadas, de modo que transferir el token mueve el dominio, con continuidad de DNS para que el sitio en vivo no parpadee durante un traspaso. Obtienes control nativo de billetera *y* un nombre que toda la internet ya reconoce. La contrapartida es honesta: no estás "fuera del sistema", porque el activo es un dominio real que responde a reglas del mundo real. Profundizamos en la cuestión de la custodia en [recuperar un dominio tokenizado tras perder la billetera](/es/blog/recovering-a-tokenized-domain-after-wallet-loss/).

## Liquidez y dónde se venden

Como las tres son NFT estilo [ERC-721](/es/glossary/erc-721/) (o algo muy cercano), pueden listarse en [mercados](/es/glossary/marketplace/) de NFT y transferirse con un intercambio [atómico](/es/glossary/atomic-transfer/) en el que el comprador paga y recibe a la vez, sin que ningún agente externo de [depósito en garantía](/es/glossary/escrow/) retenga el activo a mitad del trato. Esa fontanería compartida es justo lo que hace atractivos para el flipping a los nombres on-chain, y se cubre en [cómo los mercados tokenizados reemplazan al depósito en garantía](/es/blog/how-tokenized-marketplaces-replace-escrow/).

Sin embargo, los grupos de compradores difieren. ENS tiene el mercado secundario más profundo de las tres: nombres `.eth` premium se han negociado por sumas importantes. CoinGecko registra que [el dominio cripto más caro jamás vendido fue "paradigm.eth", que se vendió por 1,51 millones de dólares (420 ETH) el 9 de octubre de 2021](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for), y The Block informó que [el dominio del Servicio de Nombres de Ethereum (ENS) 000.eth se compró por 300 ETH (315.000 dólares)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH). Son cifras reales, pero trátalas como casos atípicos, igual que `Voice.com` es un caso atípico en el mundo del DNS: te dicen que existe un techo, no lo que alcanza un nombre típico. Cualquier cifra de "precio mínimo" que veas citada es una estimación cambiante, no un hecho.

Los dominios DNS tokenizados aprovechan un universo de compradores distinto y más grande: cualquiera que quiera un dominio real, resoluble universalmente *más* propiedad nativa de billetera. Ese es el público que quiere que un nombre cargue en cualquier navegador, ejecute correo y lleve un certificado SSL, sin renunciar a la opción de venderlo como un NFT.

## Cuál hacer flipping

No hay un único ganador; hay un encaje según tu comprador.

- **Haz flipping de `.eth` de ENS** si vendes a un público nativo de cripto que valora los nombres cortos numéricos o de palabra como identidad on-chain, y te sientes cómodo cargando con la renovación anual en cualquier nombre que valga la pena mantener.
- **Haz flipping de nombres Unstoppable** si tu comprador quiere una identidad web3 sin renovación y centrada en la billetera, y la resolución en navegadores estándar no es su prioridad. Consulta [TLD web3 premium](/es/blog/premium-web3-tlds/) para ver cómo se valora ese espacio de nombres.
- **Haz flipping de dominios DNS tokenizados** si quieres el grupo de compradores más grande y un nombre que *funcione*: un `.com`/`.io`/`.xyz` real de ICANN que puedes mantener, programar y vender on-chain, mientras resuelve para todo el mundo. Empieza con [cómo tokenizar tu .com](/es/blog/how-to-tokenize-your-com/), y si estás sopesando plataformas, [elegir una plataforma de tokenización de dominios](/es/blog/choosing-a-domain-tokenization-platform/) repasa los criterios.

Para la visión de conjunto de por qué cualquiera de estas opciones supera el viejo modelo de depósito en garantía y confianza, el centro de [flipping de dominios](/es/blog/domain-flipping/) une todo el conjunto de habilidades, y [por qué tokenizar dominios](/es/blog/why-tokenize-domains/) cubre las ventajas en profundidad. Sea cual sea la categoría que negocies, ten claro qué activo hay en tu billetera antes de poner un precio, porque la resolución, las renovaciones y el control no son detalles: son el producto.

## Aviso amistoso (¡léeme!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo es asesoramiento legal, financiero, fiscal, contable, médico ni de ninguna otra clase profesional.** Escribimos estas publicaciones para formarnos a nosotros mismos y como una comodidad para nuestros clientes. La información aquí puede estar desactualizada, ser específica de una región o, sencillamente, estar equivocada. Nosotros también cometemos errores.
>
> Para cualquier decisión importante, **por favor consulta a un profesional de verdad (¡en serio!)**. O si eso no va contigo, pregúntale a un amigo, pregúntale a Twitter, pregúntale a Reddit, pregúntale a una IA o pregúntale a un vidente. En resumen: **DOYR - Investiga por Tu Cuenta (Do Your Own Research)**. Aprendamos y divirtámonos.

## Fuentes y lecturas adicionales

- Documentación de ENS — [Protocolo de ENS: asigna nombres legibles por humanos a direcciones](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names)
- Documentación de ENS — [Registrador de ETH: los `.eth` se transfieren como cualquier otro token ERC721; precios anuales (5 / 160 / 640 USD al año); tarifa pagada en ETH; gracia de 90 días](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- Documentación de ENS — [ENS admite importar nombres DNS mediante DNSSEC](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names)
- Soporte de Unstoppable Domains — [Dominios Web3 almacenados como NFT en tu billetera; sin renovaciones, tuyos de por vida; extensión de navegador requerida para Chrome y Firefox](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets)
- CoinMarketCap — [Unstoppable Domains acuñados como NFT en la blockchain de Ethereum](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token)
- CoinGecko Research — [Dominios cripto más caros: paradigm.eth se vendió por 1,51 millones de dólares (420 ETH), 9 oct 2021](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for)
- The Block — [000.eth comprado por 300 ETH (315.000 dólares), segunda venta de ENS más grande](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
