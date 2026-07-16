---
title: "Flipping de dominios onchain: comerciar con ENS y dominios tokenizados"
date: '2026-06-24'
language: es
tags: ['domains', 'domain-flipping', 'web3', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 32
format: guide
description: "Cómo funciona el flipping de dominios onchain: comerciar con ENS y dominios tokenizados como activos que se guardan en la billetera y tienen liquidez de NFT, y en qué se diferencia del flipping a través de registradores."
ogImage: ../../assets/onchain-domain-flipping-og.jpg
keywords: ['flipping de dominios onchain', 'flipping de dominios ENS', 'flipping de dominios tokenizados', 'comerciar con dominios tokenizados', 'flipping de dominios NFT', 'flipping de dominios web3', 'inversión en dominios ENS', 'mercado de dominios NFT', 'vender dominios como NFT', 'comercio de dominios onchain', 'dominios ERC-721', 'dominios guardados en billetera', 'liquidación atómica de dominios', 'liquidez de dominios tokenizados', 'flipping de dominios web3']
relatedArticles:
  - /es/blog/tokenize-your-com-to-flip-it/
  - /es/blog/how-tokenization-changes-domain-flipping/
  - /es/blog/selling-domains-as-nfts/
  - /es/blog/onchain-domain-marketplaces-compared/
  - /es/blog/ens-vs-dns-domain-flipping/
relatedTopics:
  - /es/topics/domain-investing/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/tld/
  - /es/glossary/icann/
  - /es/glossary/dns/
  - /es/glossary/web3/
---

El flipping de dominios tiene una forma familiar: compras un nombre barato, encuentras un comprador que lo necesita y lo vendes caro. La versión clásica de esa operación pasa por [registradores](/es/glossary/registrar/), mercados secundarios y un agente de depósito en garantía que retiene el dinero mientras se completa la transferencia. El flipping de dominios onchain es el mismo instinto de comprar barato y vender caro trasladado a una [blockchain](/es/glossary/blockchain/), donde el propio nombre es un token que guardas en una [billetera](/es/glossary/wallet/) y puedes comerciar como cualquier otro [NFT](/es/glossary/nft/).

Ese único cambio — el nombre como token — reescribe casi todos los pasos de la operación. La custodia, la publicación y la liquidación dejan de ser operaciones a nivel de cuenta en un registrador y se convierten en transacciones onchain que controlas directamente. Esta guía explica qué es realmente el flipping de dominios onchain, traza la línea importante entre los dos tipos muy distintos de "nombre onchain" con los que puedes hacer flipping, y recorre todo el arco de la operación: adquirir, custodiar, publicar, liquidar. Es el pilar onchain del manual más amplio de [flipping de dominios](/es/blog/domain-flipping/).

## Qué significa "flipping de dominios onchain"

En un flip normal, la propiedad reside en la base de datos de un registrador. Inicias sesión en una cuenta, los registros del registrador dicen que controlas el nombre, y moverlo a un comprador implica una [transferencia](/es/glossary/atomic-transfer/) de cuenta a cuenta o de registrador a registrador que el registrador media. El activo es real, pero nunca lo posees tú mismo: posees una cuenta que apunta a él.

El flipping onchain reemplaza esa cuenta por un [token](/es/glossary/tokenize/). El nombre se representa como un NFT bajo el estándar [ERC-721](/es/glossary/erc-721/), que la especificación de Ethereum describe como una [API estándar para NFT dentro de contratos inteligentes](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs) — y que su propio resumen llama una interfaz estándar para [tokens no fungibles, también conocidos como escrituras (deeds)](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds). Esa palabra, "escrituras", es la idea completa: el token es el título del nombre, que reside en tu billetera, no un recibo de un registro que mantiene otra persona. Quien posee el token controla el nombre, y transferir el control es una llamada a un [contrato inteligente](/es/glossary/smart-contract/) en lugar de un ticket de soporte.

Esa propiedad es la razón por la que los nombres onchain se comercian como una clase de activo líquido. Se publican en los mismos [mercados de NFT](/es/glossary/marketplace/) que el arte y los coleccionables, se liquidan en minutos y llevan un historial de propiedad público y auditable. El flip en sí se parece menos a una transferencia de registrador y más al [comercio de dominios](/es/glossary/domain-trading/) sobre rieles construidos para activos digitales.

## Dos tipos de nombre onchain — no los confundas

![Ilustración editorial de dos activos de nombre onchain distintos uno al lado del otro — un chip de identidad de billetera con un token frente a un globo terráqueo y un certificado de escritura rodeado de NFT](../../assets/onchain-domain-flipping-01-two-kinds.jpg)

Lo más importante que debes entender bien antes de comerciar es que "dominio onchain" abarca dos activos genuinamente distintos que se comportan de manera diferente para un flipper.

El primero es el nombre nativo de [Web3](/es/glossary/web3/), cuyo arquetipo es [ENS](/es/glossary/ens/) (`.eth`). Estos nombres viven enteramente en Ethereum. No forman parte de la raíz de [ICANN](/es/glossary/icann/), por lo que `vitalik.eth` no se resuelve en un navegador común sin un resolvedor o un puente. Su valor está en la identidad de billetera y la nomenclatura nativa de cripto. ENS es también abiertamente un mercado de registro: según la documentación de ENS, un [.eth de 5 o más letras te costará 5 USD al año](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), con los nombres de cuatro y tres letras con precios más altos por diseño, y una vez registrado un nombre puede moverse [igual que con cualquier otro token ERC721](https://docs.ens.domains/registry/eth#:~:text=just%20like%20with%20any%20other%20ERC721%20token). Ese piso de registro bajo y transparente es exactamente la razón por la que los nombres `.eth` cortos y premium se convirtieron en un mercado especulativo propio.

El segundo es el **dominio ICANN tokenizado** — un `.com`, `.xyz` o `.io` real cuya propiedad se refleja como un NFT mientras el nombre DNS subyacente sigue resolviéndose en todas partes. Como explica nuestro artículo sobre [qué son los dominios tokenizados](/es/blog/what-are-tokenized-domains/), estos son dominios DNS reales que *además* tienen una representación onchain, no un espacio de nombres paralelo. Para un flipper la distinción es concreta: un `.com` tokenizado lleva consigo la resolubilidad universal, el correo electrónico y el soporte de certificados de la internet tradicional, mientras que un nombre ENS lleva utilidad nativa de cripto pero necesita un puente para comportarse como un sitio web. Ambos pueden hacerse flipping onchain; no son el mismo producto, y un comprador está pagando por cosas distintas en cada caso. Comparamos las familias directamente en [dominio tokenizado vs dominio Web3](/es/blog/tokenized-domain-vs-web3-domain/).

Un tercer grupo — los TLD de Web3 de plataformas como Unstoppable Domains — se sitúa más cerca de ENS que de los nombres ICANN tokenizados; la guía de [TLD premium de Web3](/es/blog/premium-web3-tlds/) cubre dónde encajan esos. Mantén los tres bien diferenciados y pondrás precio a cada uno correctamente.

## En qué se diferencia del flipping en el mercado secundario de registradores

![Ilustración editorial de la liquidación atómica — monedas y un token NFT encajando como piezas de un rompecabezas entre dos manos, con un agente de depósito en garantía atenuado dejado a un lado](../../assets/onchain-domain-flipping-02-atomic-settle.jpg)

La mecánica diverge de forma más marcada en la liquidación, que es donde los flips tradicionales se ponen nerviosos. En el mundo de los registradores, comprador y vendedor se enfrentan a un punto muerto: el vendedor no transferirá antes de cobrar, el comprador no pagará antes de recibir el nombre, y un agente de [depósito en garantía (escrow)](/es/glossary/escrow/) externo tiene que ponerse en medio sosteniendo ambos lados. Desglosamos ese flujo de trabajo clásico en [el escrow de dominios explicado](/es/blog/domain-escrow-explained/).

Onchain, ese punto muerto puede colapsar en una única transacción atómica. Los protocolos de mercado construidos para NFT permiten que el pago y la transferencia ocurran juntos o no ocurran en absoluto. El protocolo de órdenes de OpenSea, Seaport, se describe a sí mismo como un [protocolo de mercado para comprar y vender NFT de forma segura y eficiente](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs), y el efecto práctico es que el pago del comprador y el token del vendedor se intercambian en un solo paso de liquidación. Ningún agente retiene el activo a mitad del trato: el contrato impone el intercambio. Ese es el mecanismo al que nos referimos cuando decimos que los mercados tokenizados [reemplazan el escrow](/es/blog/how-tokenized-marketplaces-replace-escrow/).

Las otras grandes diferencias:

- **La custodia es tuya.** En lugar de una cuenta en un registrador, el activo reside en tu billetera. Eso elimina el bloqueo de plataforma y el riesgo de incautación de cuenta, pero te pone encima todo el peso de la [gestión de claves](/es/glossary/custodial-ownership/) — pierde las claves, pierde el nombre.
- **La liquidez es más amplia.** Un nombre tokenizado puede publicarse en mercados de NFT generales junto a todos los demás activos ERC-721, no solo en mercados secundarios específicos de dominios, lo que amplía el conjunto de miradas y ofertas.
- **La procedencia es pública.** Cada venta y transferencia anterior es visible onchain, por lo que un comprador puede verificar el historial sin confiar en la palabra de un mercado — útil para la valoración y para demostrar que un nombre no es robado.

## La operación, paso a paso: adquirir, custodiar, publicar, liquidar

![Ilustración editorial de un flujo de flip onchain de cuatro pasos — una lupa sobre una etiqueta de nombre, una llave y una billetera, un escaparate de mercado y un intercambio circular de moneda por token](../../assets/onchain-domain-flipping-03-trade-steps.jpg)

### Adquirir

Obtienes nombres onchain de la misma manera que obtienes cualquier flip — buscando activos mal valorados — pero los canales difieren. Los nombres ENS provienen del mercado de registro de ENS o de mercados secundarios de NFT; el piso es transparente porque cualquiera puede leer la tarifa de registro onchain. Los dominios ICANN tokenizados provienen de registrar o [tokenizar un `.com` real](/es/blog/how-to-tokenize-your-com/) que ya crees que está infravalorado, o de comprar uno ya tokenizado. La disciplina es idéntica a la del resto del [comercio de dominios](/es/glossary/domain-trading/): no te enamores de un nombre que nadie comprará, y no pagues de más a la entrada, porque el precio de entrada fija todo tu margen.

### Custodiar

Este es el paso que no tiene equivalente en el flipping de registradores, y el que los flippers novatos subestiman. Una vez que el nombre es un NFT, *tú* eres el sistema de custodia. Una billetera caliente es conveniente para el comercio activo pero es la más expuesta; una billetera de hardware o un arreglo [multifirma](/es/glossary/multi-sig/) cambia algo de comodidad por una protección mucho mejor de un nombre que vas a retener durante meses. Si multifirma es la respuesta correcta es una pregunta real — la sopesamos en [¿las billeteras multifirma mejoran realmente la seguridad?](/es/blog/do-multisig-wallets-actually-improve-security/). Y como una clave perdida puede significar un nombre perdido, ten un plan de recuperación antes de necesitarlo; [recuperar un dominio tokenizado tras la pérdida de la billetera](/es/blog/recovering-a-tokenized-domain-after-wallet-loss/) cubre lo que es posible y lo que no.

### Publicar

Publicar un nombre onchain es una acción de mercado, no una página de aterrizaje de "se vende" en un dominio aparcado. Estableces un precio fijo de compra inmediata o abres una subasta directamente en un mercado de NFT, y la publicación es en sí misma una orden onchain (o firmada por el mercado) que cualquier comprador puede completar. Para los dominios ICANN tokenizados también conservas la opción de un embudo normal de página de ventas — la diferencia es que el cierre se ejecuta a través de un intercambio de tokens en lugar de un traspaso de escrow. Para los nombres tokenizados en concreto, la [continuidad del DNS](/es/blog/dns-on-tokenized-domains/) importa aquí: un dominio tokenizado bien construido sigue resolviéndose limpiamente durante el traspaso, de modo que un sitio activo no se queda a oscuras a mitad de venta.

### Liquidar

La liquidación es la recompensa por toda la fontanería onchain. El comprador completa tu orden, el pago y la transferencia del token se ejecutan juntos, y la propiedad se mueve en una sola transacción confirmada. Para un nombre ENS ahí termina todo — el nuevo poseedor ahora controla el nombre `.eth`. Para un dominio ICANN tokenizado la transferencia del token es la escritura, y la plataforma mantiene sincronizado el registro DNS subyacente para que el comprador termine controlando un dominio real y resoluble. En cualquier caso, ninguna de las partes tuvo que moverse primero, y ningún agente retuvo el activo en el medio.

## Cómo se ven las cifras

El flipping onchain sigue siendo un juego de cartera, no una lotería — la mayoría de los nombres que retienes no se venderán, y las ganancias financian el coste de mantenimiento. Pero las ventas estelares muestran por qué la categoría llama la atención. El nombre ENS más caro vendido hasta la fecha, según The Block, fue [paradigm.eth, que se compró en octubre de 2021 por 420 ETH (unos 1,5 millones de dólares en aquel momento)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=paradigm.eth%2C%20which%20was%20purchased%20in%20October%202021%20for%20420%20ETH); el mismo informe señala que [000.eth se compró por 300 ETH (315.000 dólares)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH) en julio de 2022.

Trata esos casos como excepciones, no como un modelo de negocio — el mismo baño de realidad que se aplica a las megaventas de `.com` se aplica por partida doble aquí, con el añadido de que los precios de los nombres onchain se mueven con la volatilidad del mercado cripto. Un piso medido en ETH puede reducirse a la mitad en términos de dólares sin que cambie de manos un solo nombre. Una valoración sobria, no la cinta de mejores momentos, es lo que mantiene una cartera onchain en números negros.

## Dónde encaja Namefi

La versión limpia de un flip onchain — título guardado en la billetera, liquidación atómica, sin punto muerto de escrow — es exactamente el flujo de trabajo que [Namefi](https://namefi.io) está construido para ofrecer con dominios ICANN *reales*. La propiedad tokenizada hace que el control de un `.com` sea auditable y transferible como un NFT, mientras que la continuidad del DNS mantiene el nombre resolviéndose durante el traspaso, de modo que un flipper obtiene la liquidez onchain sin renunciar a la resolubilidad universal por la que los compradores realmente pagan. Si quieres llevar a este modelo un nombre que ya posees, el recorrido está en [cómo tokenizar tu .com](/es/blog/how-to-tokenize-your-com/), y las compensaciones entre plataformas están en [cómo elegir una plataforma de tokenización de dominios](/es/blog/choosing-a-domain-tokenization-platform/).

## Aviso amistoso (¡Léeme!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo es asesoramiento legal, financiero, fiscal, contable, médico ni de ningún otro tipo profesional.** Escribimos estas publicaciones para educarnos a nosotros mismos y como una comodidad para nuestros clientes. La información aquí puede estar desactualizada, ser específica de una región o simplemente estar equivocada. Nosotros también cometemos errores.
>
> Para cualquier decisión importante, **consulta a un profesional de verdad (¡en serio!)**. O si eso no va contigo, pregúntale a un amigo, pregunta en Twitter, pregunta en Reddit, pregúntale a una IA o pregúntale a un psíquico. En resumen: **DOYR - Haz Tu Propia Investigación**. Aprendamos y divirtámonos.

## Fuentes y lecturas adicionales

- Ethereum Improvement Proposals — [Estándar de token no fungible ERC-721 (los NFT "también conocidos como escrituras")](https://eips.ethereum.org/EIPS/eip-721#:~:text=non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- Documentación de ENS — [Registrador de ETH (precios de registro; transferencia como un token ERC-721)](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ProjectOpenSea — [Seaport (protocolo de mercado para comprar y vender NFT de forma segura y eficiente)](https://github.com/ProjectOpenSea/seaport#:~:text=marketplace%20protocol%20for%20safely%20and%20efficiently%20buying%20and%20selling%20NFTs)
- The Block — [El dominio ENS 000.eth se vende por 300 ETH; paradigm.eth sigue siendo la mayor venta de ENS con 420 ETH](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
