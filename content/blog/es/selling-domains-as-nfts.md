---
title: "Vender dominios como NFT: liquidez en cadena"
date: '2026-06-24'
language: es
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 35
format: guide
description: "Cómo funciona vender un dominio como NFT: mecánica de publicación, Seaport y OpenSea, ventas privadas restringidas al comprador, regalías y las trampas de gas y estafas."
ogImage: ../../assets/selling-domains-as-nfts-og.jpg
keywords: ['vender dominio como NFT', 'NFT de dominio', 'venta de dominio tokenizado', 'liquidez de dominios en cadena', 'publicar NFT de dominio en OpenSea', 'protocolo Seaport', 'publicación restringida al comprador', 'publicación privada de NFT', 'regalías de NFT de dominios', 'dominio ERC-721', 'transferencia atómica de dominio', 'vender dominio tokenizado', 'comisiones de gas en venta de NFT', 'estafas con NFT de dominios', 'domain flipping en cadena']
relatedArticles:
  - /es/blog/onchain-domain-marketplaces-compared/
  - /es/blog/onchain-domain-flipping/
  - /es/blog/tokenize-your-com-to-flip-it/
  - /es/blog/how-tokenization-changes-domain-flipping/
  - /es/blog/end-user-vs-reseller-domain-pricing/
relatedTopics:
  - /es/topics/domain-investing/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/icann/
  - /es/glossary/dns/
  - /es/glossary/web3/
  - /es/glossary/tld/
---

Una venta de dominio tradicional lleva incorporado un problema de confianza. El vendedor no quiere ejecutar la transferencia antes de que llegue el dinero; el comprador no quiere enviar los fondos antes de que el nombre aparezca en su cuenta. Toda la industria del [depósito en garantía](/es/glossary/escrow/) existe para colocarse entre esos dos reflejos. Vender un dominio como [NFT](/es/glossary/nft/) reorganiza ese punto muerto. Cuando la propiedad de un dominio ICANN real es también un token [en cadena](/es/glossary/on-chain/), el nombre se convierte en algo que puedes publicar, valorar y entregar dentro de la misma transacción que mueve el dinero — sin un intermediario que custodie el activo en las horas oscuras entre el pago y la transferencia.

Esta guía trata sobre esa capa de liquidez: qué ocurre realmente cuando publicas un NFT de [dominio](/es/glossary/domain-trading/), cómo funciona la fontanería del mercado, cuándo usar una publicación privada restringida al comprador en lugar de una abierta, cómo se comportan las regalías, y las trampas de gas y estafas que erosionan silenciosamente las ventas en cadena. Es un radio de la serie más amplia de [domain flipping](/es/blog/domain-flipping/), y da por hecho que ya sabes qué es un nombre tokenizado — si no, empieza por [qué son los dominios tokenizados](/es/blog/what-are-tokenized-domains/).

## Qué estás vendiendo realmente

Primero, un punto de precisión del que depende toda esta publicación. Un dominio tokenizado no es el mismo animal que un nombre [ENS](/es/glossary/ens/) o un nombre Unstoppable, y venderlos no es el mismo acto.

- Un **nombre `.eth` de [ENS](https://ens.domains)** vive enteramente en Ethereum. Se resuelve a través de [billeteras](/es/glossary/wallet/) y aplicaciones compatibles con ENS, no en una barra de direcciones de navegador corriente, y ENS fija el precio del registro por longitud — según la documentación de ENS, [un `.eth` de `5+` letras te costará `5 USD` al año](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), con [uno de `4` letras `160 USD` al año](https://docs.ens.domains/registry/eth#:~:text=A%20%604%60%20letter%20%60160%20USD%60%20per%20year) y [uno de `3` letras `640 USD` al año](https://docs.ens.domains/registry/eth#:~:text=and%20a%20%603%60%20letter%20%60640%20USD%60%20per%20year).
- Un **nombre Unstoppable** (`.crypto`, `.x` y compañía) es un nombre [Web3](/es/glossary/web3/) acuñado fuera de la raíz de ICANN.
- Un **dominio ICANN tokenizado** es el que le importa a esta serie: un `example.com` real que se resuelve en todos los navegadores, *más* un token en tu billetera que representa su control. Comparamos los tres frente a frente en [dominio tokenizado vs. dominio web3](/es/blog/tokenized-domain-vs-web3-domain/).

La mecánica de mercado que sigue se aplica a cualquiera de ellos, porque todos son NFT. Pero el *valor* que transfieres es enormemente distinto. Cuando vendes un nombre ENS, el comprador obtiene una identidad exclusivamente en cadena. Cuando vendes un `.com` tokenizado, el comprador obtiene un activo de negocio universalmente resoluble cuyo DNS sigue funcionando durante el traspaso. No dejes que un flujo de publicación elegante te engañe para valorar uno como el otro.

## Cómo se vuelve líquido un NFT de dominio

Casi todos los NFT de dominio que negociarás son un token [ERC-721](/es/glossary/erc-721/) — el estándar que Wikipedia describe como [un marco técnico que define un conjunto de reglas e interfaces para crear y gestionar tokens únicos y no fungibles (NFT) en la cadena de bloques de Ethereum](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique). Ser un token estándar es lo que lo hace líquido: cualquier [mercado](/es/glossary/marketplace/), billetera o [contrato inteligente](/es/glossary/smart-contract/) que hable ERC-721 puede publicarlo, custodiarlo en garantía o prestar contra él sin que tu nombre sea un caso especial.

Esa estandarización es toda la historia de la liquidez. Un dominio tradicional solo se vende donde un registrador o un mercado de dominios permite venderlo. Un NFT de dominio se vende dondequiera que se entienda ERC-721 — que hoy es la mayor parte de la economía NFT. Esa es la razón estructural por la que la tokenización cambia la negociación, tratada más a fondo en [cómo la tokenización cambia el domain flipping](/es/blog/how-tokenized-marketplaces-replace-escrow/).

## Publicar en un mercado: Seaport y OpenSea

![Ilustración editorial de una balanza que muestra un token NFT de dominio en un lado y una pila de monedas en el otro, unidos por un eslabón de cadena entrelazado en el centro bajo el toldo de un mercado](../../assets/selling-domains-as-nfts-01-atomic-swap.jpg)

Los rieles dominantes para las ventas de NFT son [Seaport](https://docs.opensea.io/docs/seaport) y [OpenSea](https://opensea.io), y ayuda entender que son dos capas diferentes. Seaport es el protocolo; OpenSea es una tienda construida encima de él. Según la propia documentación de OpenSea, [Seaport es un protocolo de mercado para comprar y vender NFT de forma segura y eficiente en la cadena de bloques](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs), y [Seaport impulsa el sitio web de OpenSea](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20powers%20the%20OpenSea%20website) — cada orden en OpenSea pasa por él.

El modelo mental que importa para un vendedor es la estructura de dos lados de Seaport: una **oferta** (offer) y una **contraprestación** (consideration). La oferta es lo que pones en juego (tu NFT de dominio). La contraprestación es lo que exiges a cambio (un precio en ETH o una stablecoin, más cualquier comisión y regalía dirigida a otras partes). Firmas esa orden una sola vez. Nada se mueve hasta que un comprador la cumple, y cuando lo hace, el protocolo liquida ambos lados en un único paso atómico — tu token y su pago se intercambian en la misma transacción, o ninguno lo hace. Esa atomicidad es la propiedad de [transferencia atómica](/es/glossary/atomic-transfer/) que reemplaza al depósito en garantía: no existe una ventana en la que un lado haya pagado y el otro no haya entregado.

Publicar en la práctica es un ritual de dos pasos que la mayoría de los vendedores hace una vez y luego olvida:

1. **Aprobación.** La primera vez que publicas desde una billetera, firmas una aprobación que permite al contrato del mercado mover ese token en tu nombre cuando se dispare una venta. Esto cuesta gas; las publicaciones posteriores de otros tokens de la misma colección normalmente no.
2. **La orden de publicación.** Firmas la orden propiamente dicha — precio, moneda, duración. En la mayoría de los mercados esta firma es **sin gas**: estás firmando un mensaje, no enviando una transacción, así que crear o cancelar una publicación a precio fijo normalmente no cuesta nada hasta que alguien compra.

Una consecuencia práctica: el comprador, no tú, suele pagar el gas para ejecutar una compra a precio fijo. La guía para vendedores de OpenSea lo dice sin rodeos — [Los compradores pagan las comisiones de gas al comprar un artículo a precio fijo](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item), mientras que [Los vendedores pagan las comisiones de gas al aceptar ofertas](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Sellers%20pay%20gas%20fees%20when%20accepting%20offers). Así que si publicas y esperas, el comprador asume el gas; si aceptas activamente una puja entrante, lo asumes tú. Esa asimetría debería moldear cómo vendes cuando la red está congestionada.

## Publicaciones privadas restringidas al comprador

![Ilustración editorial de un medallón NFT de dominio encerrado en una vitrina de cristal visible para una pequeña multitud, donde solo una persona concreta tiene la llave dorada que coincide para abrirla](../../assets/selling-domains-as-nfts-02-private-listing.jpg)

Una publicación abierta está bien para un nombre genérico que venderías a cualquiera. Pero muchas operaciones reales de dominios se negocian primero fuera del mercado — un precio acordado por correo o por una llamada — y luego solo necesitas una forma limpia y sin confianza de liquidar con *ese comprador concreto*. Publicar ese nombre abiertamente es un error: un tercero que vigile el mercado podría arrebatártelo a tu precio acordado antes de que tu comprador haga clic.

La solución es una **publicación restringida al comprador (privada)**, y Seaport la admite de forma nativa porque la contraprestación puede nombrar a un destinatario obligatorio. En OpenSea esto se configura en el flujo de publicación: según su guía, puedes [reservar el artículo para un comprador específico. Para ello, haz clic en Reservar e introduce su dirección de billetera](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=reserve%20the%20item%20for%20a%20specific%20buyer.%20To%20do%20so%2C%20click). Solo esa billetera puede cumplir la orden. Todos los demás ven la publicación pero no pueden comprarla.

Este es el equivalente en cadena de una liquidación intermediada y restringida al comprador, y es el patrón en el que Namefi se apoya para las ventas impulsadas por ofertas: negocia la cifra con una persona y luego liquídala como una publicación privada para que el comprador acordado — y solo ese comprador — pueda completar el intercambio atómico. Obtienes la privacidad de la operación fuera de mercado *y* la firmeza sin depósito en garantía de la operación en cadena. Eso sí, acierta con la dirección de la billetera de destino: un solo carácter erróneo y habrás reservado tu nombre de cinco cifras para una dirección que nadie controla.

## Regalías: ¿sobreviven a la venta?

Algunos NFT de dominio llevan una regalía — un porcentaje dirigido al emisor original o a un creador en cada reventa. El estándar aquí es [EIP-2981](https://eips.ethereum.org/EIPS/eip-2981), que existe, en sus propias palabras, para que los contratos puedan [señalar un importe de regalía a pagar al creador del NFT o al titular de los derechos cada vez que el NFT se venda o revenda](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold).

Dos cosas que todo flipper debería interiorizar. Primero, EIP-2981 solo *señala* una regalía; no la *impone*. Que la regalía se pague realmente depende de la política del mercado, y la industria pasó 2022–2023 haciendo que la mayoría de las regalías fueran opcionales. No modeles tus rendimientos asumiendo que se respetará una regalía en el siguiente salto — puede que no. Segundo, las regalías cortan en ambos sentidos para un flipper: una regalía que pagas al salir es un costo real en tu margen, y cualquier comisión de plataforma se suma encima. La guía de OpenSea señala que la tienda [normalmente cobra una comisión del 1% al vendedor](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=OpenSea%20typically%20charges%20a%201%25%20fee%20to%20the%20seller), y las ganancias del creador, cuando aplican, también salen de tus ingresos. Lee el desglose de comisiones que muestra el mercado antes de confirmar — esos son estimados de *tu* monto neto, y son la cifra que decide si valió la pena el flip.

## Trampas de gas y estafas que evitar

![Ilustración editorial de una billetera protegida bajo una cúpula de cristal con un escudo, rodeada de peligros señalizados con banderas de advertencia: una bomba de gasolina goteando una moneda, un anzuelo de phishing enganchando un documento de aprobación de firma, y un portapapeles que muestra una dirección sustituida](../../assets/selling-domains-as-nfts-03-gas-scam.jpg)

La liquidez en cadena es real, pero viene con una nueva superficie de fallos. Las dos grandes son el gas y el fraude.

**Gas.** Ethereum cobra por la computación. Según ethereum.org, [Gas se refiere a la unidad que mide la cantidad de esfuerzo computacional necesario para ejecutar operaciones específicas en la red de Ethereum](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort), y se paga en ETH. Para un nombre de cuatro cifras en un día congestionado, el gas de la aprobación más la liquidación puede ser una porción significativa de tu margen — y en un nombre de bajo valor puede superar por completo la venta. Dos defensas: haz tu aprobación cuando la red esté tranquila, y considera publicar en una cadena de comisiones más bajas. Esta es una razón por la que los dominios tokenizados en Base, no solo en la red principal de Ethereum, importan para los flippers que trabajan con nombres más pequeños.

**Estafas.** El mundo en cadena tiene su propio catálogo de engaños, y los NFT de dominio están de lleno en el punto de mira:

- **Sustitución de direcciones de billetera.** El malware y los secuestradores del portapapeles reemplazan en silencio una dirección pegada. Verifica siempre el primero y el último carácter de cualquier dirección de comprador o destinatario contra una segunda fuente antes de firmar.
- **Firmas de "aprobación" maliciosas.** Un mercado falso o un sitio de phishing puede pedirte que firmes una aprobación que otorga a un contrato un poder amplio sobre tus tokens. Si no entiendes exactamente qué autoriza una firma, no la firmes. Trata cualquier solicitud de aprobación inesperada como hostil.
- **Publicaciones falsificadas.** Los estafadores acuñan tokens que imitan al original y los publican como si fueran el dominio tokenizado real. Los compradores deberían verificar la dirección del contrato contra la publicada por el emisor; los vendedores deberían asegurarse de que su publicación genuina sea la que los compradores encuentren. En parte por esto importan la custodia y la procedencia — consulta [recuperar un dominio tokenizado tras perder la billetera](/es/blog/recovering-a-tokenized-domain-after-wallet-loss/) y los argumentos a favor de una configuración [multifirma](/es/glossary/multi-sig/) en [¿mejoran realmente la seguridad las billeteras multifirma?](/es/blog/do-multisig-wallets-actually-improve-security/).
- **"Soporte" falso.** Nadie legítimo te escribirá primero por mensaje directo pidiéndote una frase semilla o una firma de "validación". La frase semilla nunca sale de tu control. Punto.

El hilo conductor: la liquidación en cadena elimina el riesgo de contraparte de la *operación* y lo reemplaza por riesgo operativo en *tu billetera*. El agente de depósito en garantía ya no está, y tampoco la persona que solía detectar una transferencia mal escrita. Esa responsabilidad ahora es tuya.

## Dónde deja esto a un flipper

Vender un dominio como NFT convierte un nombre en algo genuinamente líquido: un token ERC-721 que puedes publicar sin gas, liquidar de forma atómica, reservar para un comprador específico y mover por un ecosistema de mercados profundo en lugar del mercado secundario de un único registrador. El punto muerto del depósito en garantía que define las ventas tradicionales se disuelve en gran medida. Lo que pide a cambio es alfabetización en cadena — saber qué estás firmando, cuánto costará el gas y qué contrapartes son reales.

Para el panorama más amplio sobre cómo los nombres tokenizados cambian la economía de la negociación, el centro en [domain flipping](/es/blog/domain-flipping/) es el lugar por donde empezar, y [por qué tokenizar dominios](/es/blog/why-tokenize-domains/) defiende el caso de añadir la capa en cadena en primer lugar. Si quieres probar una venta de principio a fin con un nombre real, resoluble en navegador, [Namefi](https://namefi.io) está hecho exactamente para esto — un `.com` tokenizado que puedes publicar y liquidar en cadena mientras el DNS sigue resolviendo durante el traspaso.

## Aviso amistoso (¡léeme!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo es asesoramiento legal, financiero, fiscal, contable, médico ni de ningún otro tipo profesional.** Escribimos estas publicaciones para educarnos a nosotros mismos y como una comodidad para nuestros clientes. La información aquí puede estar desactualizada, ser específica de una región o simplemente estar equivocada. Nosotros también cometemos errores.
>
> Para cualquier decisión importante, **por favor consulta a un profesional de verdad (¡en serio!)**. O si eso no va contigo, pregúntale a un amigo, pregunta en Twitter, pregunta en Reddit, pregúntale a una IA o pregúntale a un vidente. En resumen: **DOYR - Do Your Own Research** (Investiga por tu cuenta). Aprendamos y divirtámonos.

## Fuentes y lecturas adicionales

- Documentación de OpenSea — [Seaport (protocolo de mercado; impulsa OpenSea; modelo oferta/contraprestación)](https://docs.opensea.io/docs/seaport#:~:text=Seaport%20is%20a%20marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- OpenSea — [Cómo vender NFT (reservar para un comprador específico; quién paga el gas; comisión del 1% al vendedor)](https://opensea.io/learn/nft/how-to-sell-nfts#:~:text=Buyers%20pay%20gas%20fees%20when%20purchasing%20a%20fixed%2Dprice%20item)
- Wikipedia — [ERC-721 (estándar de token no fungible en Ethereum)](https://en.wikipedia.org/wiki/ERC-721#:~:text=is%20a%20technical%20framework%2C%20defining%20a%20set%20of%20rules%20and%20interfaces%20for%20creating%20and%20managing%20unique)
- Propuestas de Mejora de Ethereum — [EIP-2981 (estándar de regalías de NFT)](https://eips.ethereum.org/EIPS/eip-2981#:~:text=to%20signal%20a%20royalty%20amount%20to%20be%20paid%20to%20the%20NFT%20creator%20or%20rights%20holder%20every%20time%20the%20NFT%20is%20sold%20or%20re%2Dsold)
- Documentación de ENS — [Precios de registro de .eth por longitud ($5 / $160 / $640 al año)](https://docs.ens.domains/registry/eth#:~:text=a%20%605%2B%60%20letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ethereum.org — [Gas y comisiones (definición de gas)](https://ethereum.org/en/developers/docs/gas/#:~:text=Gas%20refers%20to%20the%20unit%20that%20measures%20the%20amount%20of%20computational%20effort)
