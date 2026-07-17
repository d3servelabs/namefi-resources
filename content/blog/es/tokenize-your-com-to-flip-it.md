---
title: "Tokeniza tu .com para revenderlo: un recorrido con Namefi"
date: '2026-06-24'
language: es
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
cluster: domain-tokenization
series: domain-flipping-skills
seriesOrder: 39
format: guide
description: "Un recorrido con Namefi: lleva un .com a la cadena, mantén la resolución DNS funcionando y revéndelo como un NFT con liquidación atómica en lugar de un punto muerto con depósito en garantía."
ogImage: ../../assets/tokenize-your-com-to-flip-it-og.jpg
keywords: ['tokenizar un .com para revenderlo', 'tokeniza tu com', 'revender dominios tokenizados', 'vender un dominio como NFT', 'flipping de .com tokenizados', 'flipping de dominios en cadena', 'liquidación atómica de dominios', 'mercado de dominios tokenizados', 'continuidad DNS en dominio tokenizado', 'cómo tokenizar un dominio para venderlo', 'tokenizar y vender con namefi', 'punto com en una billetera', 'dominio ERC-721', 'liquidez de dominios tokenizados', 'revender un dominio com en cadena']
relatedArticles:
  - /es/blog/onchain-domain-flipping/
  - /es/blog/how-tokenization-changes-domain-flipping/
  - /es/blog/selling-domains-as-nfts/
  - /es/blog/onchain-domain-marketplaces-compared/
  - /es/blog/domain-flipping/
relatedTopics:
  - /es/topics/domain-tokenization/
  - /es/topics/domain-investing/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/dns/
  - /es/glossary/icann/
  - /es/glossary/tld/
  - /es/glossary/web3/
---

La mayoría de las reventas de un `.com` terminan de la misma forma tensa: el comprador no quiere pagar antes de que el nombre se mueva, el vendedor no quiere mover el nombre antes de cobrar, y un agente de [depósito en garantía](/es/glossary/escrow/) se queda en medio reteniendo el dinero mientras una transferencia entre registradores se completa a lo largo de varios días. Ese punto muerto es el impuesto de fricción de toda venta de alto valor. Tokenizar el `.com` primero cambia la forma de toda la operación: el nombre se convierte en un token que guardas en una [billetera](/es/glossary/wallet/), y la venta se convierte en un único intercambio en cadena en lugar de un traspaso de varios días entre varias partes.

Este es un recorrido práctico de ese camino en [Namefi](https://namefi.io): llevar a la cadena un `.com` que ya posees, mantenerlo resolviendo en todas partes y luego listarlo y liquidarlo como un [NFT](/es/glossary/nft/). Se enmarca dentro del manual más amplio del [flipping de dominios](/es/blog/domain-flipping/) y del pilar del [flipping de dominios en cadena](/es/blog/onchain-domain-flipping/). Si quieres el *porqué* antes del *cómo*, empieza por [por qué tokenizar dominios en la cadena](/es/blog/why-tokenize-domains/).

## Por qué revender un .com tokenizado en lugar de uno común

Un `.com` tradicional es real, pero en realidad nunca lo tienes en tu poder: lo que tienes es una cuenta en un [registrador](/es/glossary/registrar/) cuya base de datos dice que tú controlas el nombre. Venderlo implica un movimiento de cuenta a cuenta o de registrador a registrador que el registrador media, con el depósito en garantía cubriendo la brecha de confianza en medio.

Tokenizar convierte esa cuenta en un [token](/es/glossary/tokenize/) que custodias tú mismo. El nombre se representa como un NFT bajo el estándar [ERC-721](/es/glossary/erc-721/), que la especificación de Ethereum llama una [API estándar para NFTs dentro de contratos inteligentes](https://eips.ethereum.org/EIPS/eip-721#:~:text=standard%20API%20for%20NFTs), y cuyo propio resumen lo describe como una interfaz estándar para [tokens no fungibles, también conocidos como deeds (títulos)](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds). Esa palabra, "deeds" (títulos), es la clave: el token es el título del nombre, en tu billetera, no un recibo de un registro que conserva otra persona. Para quien revende, eso compra tres ventajas concretas:

- **La liquidación se reduce a una sola transacción.** El pago y la transferencia se ejecutan juntos o no se ejecutan en absoluto, de modo que ninguna de las partes tiene que moverse primero.
- **La liquidez es más amplia.** Un `.com` tokenizado puede listarse en [mercados de NFT](/es/glossary/marketplace/) generales junto a cualquier otro activo ERC-721, no solo en mercados secundarios exclusivos de dominios.
- **La procedencia es pública.** Cada transferencia anterior es auditable [en cadena](/es/glossary/on-chain/), así que un comprador puede verificar el historial sin tener que confiar en la palabra de un mercado.

Lo fundamental es que nada de esto sacrifica aquello por lo que realmente paga un comprador en un `.com`. A diferencia de un nombre nativo de Web3 como un `.eth` de [ENS](/es/glossary/ens/) —que vive fuera de la raíz de [ICANN](/es/glossary/icann/) y necesita un resolvedor o un puente para cargar en un navegador normal—, un `.com` tokenizado sigue siendo un dominio [DNS](/es/glossary/dns/) real que resuelve en todas partes, con correo electrónico y certificados funcionando. Esa distinción es la razón misma por la que existe esta guía; la desarrollamos por completo en [qué son los dominios tokenizados](/es/blog/what-are-tokenized-domains/) y [dominio tokenizado vs dominio Web3](/es/blog/tokenized-domain-vs-web3-domain/). No confundas ambos: un `.com` tokenizado de ICANN y un nombre `.eth` se revenden sobre las mismas vías, pero venden cosas completamente distintas.

## Paso 1: Lleva el .com a la cadena

![Ilustración editorial de una tarjeta de dominio con un globo terráqueo entrando en un portal de tokenización y saliendo como un medallón NFT facetado, mientras un globo iluminado debajo sigue brillando para mostrar que el DNS aún resuelve](../../assets/tokenize-your-com-to-flip-it-01-bring-onchain.jpg)

El proceso completo, pantalla por pantalla, está en [cómo tokenizar tu .com](/es/blog/how-to-tokenize-your-com/); aquí va la forma general para quien revende.

Conectas una billetera autocustodiada en [namefi.io](https://namefi.io): esa billetera se convierte en la propietaria del [dominio tokenizado](/es/glossary/tokenized-domain/), de modo que quien la tenga tiene el nombre. Agregas el `.com` que ya posees, Namefi comprueba la elegibilidad frente a las reglas de transferencia de ICANN y el registrador donde está actualmente, y eliges un camino. El más común es transferir-y-luego-tokenizar: mueves el dominio al registrador socio acreditado de Namefi usando el [código de autorización](/es/glossary/auth-code/) de tu registrador actual, y luego acuñas el token. Algunas integraciones de registradores admiten un camino en el sitio en el que el nombre se queda donde está y la capa en cadena se añade por encima.

Dos apuntes sobre los tiempos que importan cuando revendes con una fecha límite. Primero, la parte lenta es la transferencia entre registradores, no nada relacionado con la blockchain: planifica para varios días por el flujo entre registradores de ICANN, y no inicies una tokenización la misma semana en que esperas cerrar una venta. Segundo, los nombres transferidos recientemente pueden estar dentro de una ventana de bloqueo de transferencia de ICANN y simplemente aún no se moverán, así que comprueba la elegibilidad antes de prometerle nada a un comprador. La acuñación en sí —una única confirmación de billetera que paga el [gas](/es/glossary/gas/) y deposita el NFT— es el paso *final* y más rápido.

Cuando termina, tienes dos capas sincronizadas: el registro DNS / de registrador tradicional, y un token ERC-721 en tu billetera que representa la propiedad. Transfiere el token y el dominio lo sigue.

## Paso 2: Custódialo como un activo que piensas vender

Este es el paso que no tiene equivalente en el flipping con registradores, y el que subestiman quienes recién empiezan a revender en cadena: una vez que el nombre es un NFT, *tú* eres el sistema de custodia. Un nombre que planeas conservar durante meses mientras encuentras un comprador no debería quedarse en una billetera caliente que también usas para transacciones cotidianas.

Una billetera de hardware es lo mínimo. Para nombres de mayor valor, un esquema [multifirma](/es/glossary/multi-sig/) intercambia algo de comodidad por una protección mucho mejor frente a una única clave comprometida, aunque si vale la pena para ti es una pregunta real que sopesamos en [¿las billeteras multifirma realmente mejoran la seguridad?](/es/blog/do-multisig-wallets-actually-improve-security/). La contracara de tener tus propias [claves custodiales](/es/glossary/custodial-ownership/) es que una clave perdida puede significar un nombre perdido, así que ten un plan de recuperación listo *antes* de necesitarlo: [recuperar un dominio tokenizado tras perder la billetera](/es/blog/recovering-a-tokenized-domain-after-wallet-loss/) cubre lo que es posible y lo que no. Una custodia sólida también forma parte del argumento de venta hacia un comprador: un nombre con una cadena de propiedad limpia y auditable es más fácil de vender que uno cuya procedencia no puedes probar.

## Paso 3: Mantén el DNS resolviendo durante toda la venta

![Ilustración editorial de un medallón NFT de propiedad deslizándose de la mano de un vendedor a la mano de un comprador sobre un escaparate iluminado e ininterrumpido con un globo estable, mostrando que el sitio sigue en línea mientras cambia la propiedad](../../assets/tokenize-your-com-to-flip-it-02-dns-continuity.jpg)

Esta es la ventaja que separa a un `.com` tokenizado de un nombre `.eth`, y vale la pena protegerla deliberadamente. Tokenizar no cambia cómo resuelve el dominio: los servidores de nombres, los registros A, los MX y [DNSSEC](/es/glossary/dnssec/) siguen funcionando, gestionados desde el panel de Namefi o delegados a tu proveedor de DNS existente. Cubrimos exactamente qué cambia y qué no en [el DNS en dominios tokenizados](/es/blog/dns-on-tokenized-domains/).

Para quien revende, **la continuidad del DNS es la diferencia entre una venta limpia y un comprador viendo cómo un sitio en vivo se apaga a mitad del trato.** Un dominio tokenizado bien construido sigue resolviendo sin problemas durante el traspaso, así que cuando la propiedad del token se mueve, el sitio web, el correo y los certificados no parpadean. Esa continuidad es una característica de venta por sí misma: un comprador que puede ver el nombre resolviendo durante todo el proceso tiene muchas menos razones para regatear el precio a la baja por el riesgo de la transferencia.

## Paso 4: Lístalo como un NFT

Listar un `.com` tokenizado es una acción de mercado, no una página de aterrizaje de "en venta" en un dominio aparcado. Estableces un precio fijo de compra inmediata o abres una [subasta](/es/glossary/auction/) directamente en un mercado de NFT, y el listado es en sí mismo una orden firmada que cualquier comprador puede ejecutar. Como el activo es un token ERC-721 estándar, tu audiencia no se limita a quienes frecuentan mercados secundarios exclusivos de dominios: el nombre se ubica en los mismos lugares que cualquier otro NFT. Recorremos las opciones de listado en [vender dominios como NFTs](/es/blog/selling-domains-as-nfts/), y comparamos dónde listar en [mercados de dominios en cadena comparados](/es/blog/onchain-domain-marketplaces-compared/).

También conservas la opción de un embudo tradicional con página de ventas para un nombre tokenizado. La diferencia está puramente en el cierre: el trato se liquida mediante un intercambio de tokens en lugar de un traspaso con depósito en garantía, lo que nos lleva a la recompensa.

## Paso 5: Liquida sin un punto muerto con depósito en garantía

![Ilustración editorial de un comprador y un vendedor intercambiando un medallón token y una pila de monedas a través de dos engranajes entrelazados, con la posición del agente intermediario de depósito en garantía visiblemente vacía entre ellos](../../assets/tokenize-your-com-to-flip-it-03-atomic-settlement.jpg)

Aquí es donde la mecánica en cadena demuestra su valor. Los protocolos de mercado creados para NFTs permiten que el pago y la transferencia ocurran de forma atómica: juntos o nada en absoluto. El protocolo de órdenes de OpenSea, Seaport, se describe a sí mismo como un [protocolo de mercado para comprar y vender NFTs de forma segura y eficiente](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs), y el efecto práctico es que el pago del comprador y tu transferencia del token se intercambian en un único paso de liquidación. Ningún agente externo retiene el activo a mitad del trato; el contrato impone el intercambio.

Para tu `.com` tokenizado, la transferencia del token *es* el traspaso del título, y Namefi mantiene sincronizado el registro DNS subyacente para que el comprador termine controlando un dominio real y resoluble, no solo un NFT que apunta a la nada. Ese único mecanismo es lo que queremos decir cuando afirmamos que los mercados tokenizados [reemplazan al depósito en garantía](/es/blog/how-tokenized-marketplaces-replace-escrow/); ese artículo detalla la matemática de la confianza. Ninguna de las partes se movió primero, ningún agente retuvo el dinero, y toda la liquidación que antes tomaba días de depósito en garantía ahora toma una transacción confirmada.

## Una mirada realista a la economía

Tokenizar no cambia la matemática de fondo del flipping: sigue siendo un juego de portafolio, no un billete de lotería. La mayoría de los nombres que conserves no se venderán, y un pequeño número de buenas ventas financia el costo de mantenimiento del resto. Llevar un nombre a la cadena amplía tu universo de compradores y elimina la fricción de la liquidación, pero no fabrica demanda para un nombre que nadie quiere. Una [valoración](/es/blog/onchain-domain-flipping/) sobria sigue decidiendo si una reventa funciona.

También hay una pila de costos que mantener honesta. Pagas las comisiones ordinarias de renovación del registrador independientemente de la tokenización, unos pocos dólares de gas para acuñar (Base es más barata que la L1 de [Ethereum](/es/glossary/ethereum/)), y la comisión de protocolo de Namefi por el servicio de tokenización, todo mostrado en la pantalla de confirmación antes de que te comprometas. Si el margen entre tu precio de entrada y tu precio de venta realista no cubre cómodamente esos costos, tokenizar un nombre marginal solo añade pasos. Tokeniza los nombres que vale la pena revender, no todos los nombres que tengas.

Un punto de contexto que conviene tener presente: el potencial al alza en grandes `.com` es real pero poco común. La venta récord sigue siendo `Voice.com`, donde, según el registro `.nl` SIDN, [el proveedor de blockchain Block.one pagó 30 millones de dólares estadounidenses](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=Block.one%20paid) por el nombre, y aun así, señala SIDN, [la suma más alta divulgada públicamente jamás pagada por un nombre de dominio](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=the%20highest%20publicly%20disclosed%20sum). Eso es un caso atípico que sobrevive en los titulares precisamente porque es raro, no un plan de negocio.

## Dónde encaja Namefi

La versión limpia de esta reventa —título en la billetera, liquidación atómica, sin punto muerto con depósito en garantía y un nombre que sigue resolviendo durante todo el proceso— es exactamente el flujo de trabajo que [Namefi](https://namefi.io) está diseñado para ofrecer con dominios de ICANN *reales*. La propiedad tokenizada hace que el control de un `.com` sea auditable y transferible como un NFT, mientras que la continuidad del DNS preserva la resolubilidad universal por la que los compradores realmente pagan. Para llevar a este modelo un nombre que ya posees, el paso a paso está en [cómo tokenizar tu .com](/es/blog/how-to-tokenize-your-com/); para sopesar primero los proveedores, consulta [cómo elegir una plataforma de tokenización de dominios](/es/blog/choosing-a-domain-tokenization-platform/).

## Aviso amistoso (¡Léeme!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo constituye asesoramiento legal, financiero, fiscal, contable, médico ni de ningún otro tipo profesional.** Escribimos estas publicaciones para aprender nosotros mismos y como una comodidad para nuestros clientes. La información aquí puede estar desactualizada, ser específica de una región o simplemente estar equivocada. Nosotros también cometemos errores.
>
> Para cualquier decisión importante, **consulta a un profesional de verdad (¡en serio!)**. O si eso no va contigo, pregúntale a un amigo, pregunta en Twitter, pregunta en Reddit, pregúntale a una IA o pregúntale a un vidente. En resumen: **DOYR - Do Your Own Research (investiga por tu cuenta)**. Aprendamos y divirtámonos.

## Fuentes y lecturas adicionales

- Ethereum Improvement Proposals — [Estándar de token no fungible ERC-721 ("API estándar para NFTs"; NFTs "también conocidos como deeds")](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- ProjectOpenSea — [Seaport (protocolo de mercado para comprar y vender NFTs de forma segura y eficiente)](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- SIDN — [Voice.com vendido por 30 millones de dólares (Block.one, 2019; la venta de dominio más alta divulgada públicamente)](https://www.sidn.nl/en/news-and-blogs/voice-com-sold-for-usd-30-million#:~:text=Block.one%20paid)
