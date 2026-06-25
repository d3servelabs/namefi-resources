---
title: "Flipping de dominios ENS vs DNS: en qué se diferencian"
date: '2026-06-24'
language: es
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 33
format: comparison
description: "En qué se diferencia revender nombres .eth de ENS frente a revender dominios DNS tradicionales: propiedad, liquidez, renovación, gas y para qué sirve cada uno."
ogImage: ../../assets/ens-vs-dns-domain-flipping-og.jpg
keywords: ['ENS vs DNS', 'revender dominios ENS', 'flipping de dominios ENS', 'inversión en dominios .eth', 'revender nombres .eth', 'ENS vs dominios tradicionales', 'flipping de dominios on-chain', 'liquidez de dominios NFT', 'tarifas de renovación de ENS', 'dominios ERC-721', 'flipping de dominios web3', 'vender ENS en OpenSea', 'periodo de gracia de expiración de ENS', 'flipping de dominios tokenizados', 'tarifas de gas de ENS']
---

Si revendes dominios, probablemente has observado el mercado de [ENS](/es/glossary/ens/) desde la barrera y te has preguntado si es el mismo juego con una nueva capa de pintura. No lo es. Revender un nombre `.eth` y revender un `.com` tradicional riman —compra barato un buen string, véndeselo a quien lo necesite más—, pero casi todo lo que hay debajo es distinto: quién puede ver tu propiedad, cómo se liquida una venta, qué pagas por conservar el nombre y qué significa siquiera "poseerlo". Este artículo recorre las diferencias reales para que decidas dónde pertenecen de verdad tu tiempo y tu capital.

Primero, una aclaración, porque el terreno es confuso. Los nombres `.eth` de ENS no son lo mismo que los **dominios DNS tokenizados**. Un nombre `.eth` vive enteramente [en cadena](/es/glossary/on-chain/) y no se resuelve en un navegador normal sin un resolutor o un puente. Un `.com` tokenizado es un dominio real de [ICANN](/es/glossary/icann/) que *además* lleva un token en cadena: se resuelve en todas partes donde lo hace un `.com`. Profundizamos en esa división triple en [dominio tokenizado vs dominio web3](/es/blog/tokenized-domain-vs-web3-domain/) y en la comparación [ENS vs Unstoppable vs DNS tokenizado](/es/blog/ens-vs-unstoppable-vs-tokenized-dns/). Este artículo trata específicamente del flipping de `.eth` de ENS frente al flipping de DNS tradicional: ten presente la tercera categoría, porque toma prestados los mejores rasgos de ambas.

## Qué estás comprando en realidad

![Ilustración editorial de un token-nombre NFT autocustodiado y una llave dentro de una billetera sostenida en tu mano, frente a un acceso de registrador arrendado y un documento de arrendamiento bloqueado por un tercero](../../assets/ens-vs-dns-domain-flipping-01-custody.jpg)

Un dominio DNS tradicional es un registro: pagas a un [registrador](/es/glossary/registrar/) acreditado por la ICANN, y tu nombre queda en una base de datos de registro. No eres dueño del string de forma absoluta: tienes un arrendamiento renovable, y la superficie de control es un acceso de registrador.

Un nombre ENS es distinto en su naturaleza. Como dicen los documentos de ENS, [el Servicio de Nombres de Ethereum (ENS) es un sistema de nomenclatura distribuido, abierto y extensible basado en la cadena de bloques de Ethereum](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain). Un nombre `.eth` registrado es un [NFT (Token No Fungible)](/es/glossary/nft/) —concretamente un token [ERC-721 (estándar NFT)](/es/glossary/erc-721/)— que vive en tu [billetera](/es/glossary/wallet/). Los documentos de ENS son explícitos en que los usuarios [transfieren su nombre igual que con cualquier otro token ERC721](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token). ERC-721, el estándar que lo sustenta, es [una interfaz estándar para tokens no fungibles, también conocidos como deeds (títulos)](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds), y [proporciona la funcionalidad básica para rastrear y transferir NFTs](https://eips.ethereum.org/EIPS/eip-721#:~:text=This%20standard%20provides%20basic%20functionality%20to%20track%20and%20transfer%20NFTs).

Así que la primera diferencia es la custodia. Con DNS, el registrador tiene las llaves de tu cuenta y el registro guarda el registro autoritativo. Con ENS, el [contrato inteligente](/es/glossary/smart-contract/) guarda el registro y *tú* tienes las llaves. Eso corta en ambos sentidos para un flipper, como veremos: elimina a un intermediario de las ventas, pero pone toda la carga de la [custodia](/es/glossary/custodial-ownership/) sobre tu propia [frase semilla](/es/glossary/wallet/).

## La propiedad es pública, on-chain y auditable

Cuando compras un `.com`, la propiedad es semiprivada. Los datos WHOIS suelen estar ocultos, el historial de transferencias es opaco y un comprador en gran medida tiene que confiar en tu palabra de que el nombre está limpio y libre de cargas.

ENS invierte esto. Como cada registro, transferencia y venta es una transacción en cadena, la procedencia completa de un nombre es pública y permanente. Cualquiera puede leer qué [billetera](/es/glossary/wallet/) posee `crypto.eth`, cuándo cambió de manos por última vez y por cuánto. Para un flipper esto es un arma de doble filo. La ventaja: la diligencia debida es trivial, las falsificaciones son difíciles y un comprador puede verificar tu propiedad en segundos sin un agente de [depósito en garantía (escrow)](/es/glossary/escrow/) que la respalde. La desventaja: tu cartera y tu base de coste son visibles para los competidores, y una billetera que delata "soy un flipper" puede invitar a peores contraofertas. El domaining tradicional te permite estar callado; ENS no.

Esta transparencia es la misma propiedad que hace que los nombres en cadena sean más fáciles de valorar y comerciar de forma programática, un tema que retomamos en [tasación de dominios on-chain](/es/blog/appraising-onchain-domains/).

## Liquidez del mercado secundario: marketplaces, no brókers

![Ilustración editorial de un intercambio atómico de un solo paso en el escaparate de un marketplace de NFTs frente a una lenta ruta de escrow de varios pasos que serpentea a través de un intermediario](../../assets/ens-vs-dns-domain-flipping-02-settlement.jpg)

Aquí es donde ENS cambia de verdad la experiencia. Como un nombre `.eth` es un token ERC-721, es compatible de forma nativa con los [mercados (ej. OpenSea, Blur)](/es/glossary/marketplace/) de NFTs de propósito general —OpenSea, Blur y otros— sin necesidad de fontanería especial de la industria de los dominios. Lo pones a la venta como cualquier otro NFT, y una venta se liquida a través del [contrato inteligente](/es/glossary/smart-contract/) estándar del marketplace.

Esa liquidación es la diferencia principal. Una venta de dominio tradicional es una coreografía de varios días: acordar el precio, abrir el escrow, el comprador lo financia, tú lanzas la [transferencia](/es/glossary/atomic-transfer/) en el registrador, el registrador confirma, el escrow libera. Una venta de ENS es una [transferencia atómica](/es/glossary/atomic-transfer/): el pago del comprador y tu token se intercambian en una sola transacción, o no ocurre ninguna de las dos. Ningún tercero retiene el activo a mitad del trato, que es el mismo mecanismo que hace que las ventas de dominios tokenizados estén libres de escrow: consulta [cómo los marketplaces tokenizados reemplazan el escrow](/es/blog/how-tokenized-marketplaces-replace-escrow/) y la comparación más amplia [marketplaces de dominios on-chain comparados](/es/blog/onchain-domain-marketplaces-compared/).

Sin embargo, la liquidez tiene una trampa real. Los marketplaces de NFTs son líquidos para *NFTs*, pero un nombre `.eth` solo se vende a un comprador que específicamente quiere ese nombre y que ya es nativo de las criptomonedas. Un gran `.com` se puede vender literalmente a cualquier empresa del planeta; un gran `.eth` se vende al grupo mucho más reducido de personas que tienen ETH, manejan una billetera y valoran un nombre en cadena. Liquidación más rápida, demanda más fina. No confundas "instantáneo de transferir" con "fácil de vender".

## El modelo de renovación y expiración no es el mismo

![Ilustración editorial de una indulgente red de seguridad de periodo de gracia atrapando una etiqueta de dominio que cae frente a un estricto reloj de subasta holandesa con un precio descendente y una mano apropiándose del nombre liberado](../../assets/ens-vs-dns-domain-flipping-03-expiry.jpg)

Ambos sistemas te cobran por conservar un nombre, pero los mecanismos divergen de formas que importan a una cartera.

El DNS tradicional funciona según los términos del registrador. Un registro de [gTLD (Dominio de Nivel Superior Genérico)](/es/glossary/gtld/) puede conservarse hasta diez años —según Wikipedia, [el periodo máximo de registro para un nombre de dominio gTLD es de 10 años](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)— y el precio de renovación de un `.com` corriente es modesto: Wikipedia señala que, a fecha de 2023, [el coste minorista generalmente oscila desde un mínimo de alrededor de $9.70 al año](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=the%20retail%20cost%20generally%20ranges%20from%20a%20low%20of%20about%20%249.70%20per%20year). Si dejas pasar una renovación, hay un colchón indulgente: ventanas de redención y periodos de gracia medidos en semanas antes de que el nombre realmente caiga.

ENS usa una tarifa anual basada en la longitud, pagada en ETH. Según los documentos de ENS, los nombres de cinco o más caracteres cuestan unos $5 al año, los de cuatro caracteres unos $160 y los de tres caracteres unos $640: los strings cortos y escasos cuestan más para desincentivar el acaparamiento (estimaciones vigentes al momento de escribir esto; los precios de ENS están denominados en USD y se liquidan en ETH, así que el importe exacto en ETH varía con el mercado). La ruta de expiración es más estricta y más adversa: después de que un nombre caduca, los documentos de ENS describen una ventana de [90 días tras la expiración de un nombre (es decir, después del periodo de gracia)](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires) antes de que vuelva a estar disponible mediante lo que los documentos llaman [una subasta holandesa de 21 días](https://docs.ens.domains/registry/eth/#:~:text=a%2021%20day%20dutch%20auction), donde el precio de recuperación empieza muy alto y decae hacia la tarifa normal. Para un flipper, esa subasta es a la vez un riesgo (deja caducar un nombre valioso y los rivales pueden apropiárselo) y una oportunidad (un observador disciplinado puede recuperar nombres premium a medida que cae el precio holandés).

La conclusión práctica: ENS recompensa una disciplina de renovación más estricta que DNS. Los mecanismos de gracia son menos indulgentes, y la consecuencia de una renovación olvidada no es una caída discreta: es una subasta pública que tus competidores están vigilando.

## Costes de gas y liquidación

Los costes de los dominios tradicionales son predecibles: una renovación plana, tarifas de transferencia ocasionales, el corte esporádico de un escrow. Puedes presupuestar el coste anual de mantenimiento de una cartera al dólar.

ENS añade una variable que no controlas: el gas. Cada acción en cadena —registrar, renovar, transferir, poner a la venta— es una transacción de Ethereum con una tarifa de red que fluctúa con la congestión. En un día tranquilo esto es trivial; durante un minteo concurrido o un pico de mercado puede empequeñecer la renovación de $5 de un nombre barato. Eso cambia las cuentas en los flips de bajo valor. Renovar doscientos `.com` de relleno cuesta una suma plana y conocida; renovar doscientos nombres `.eth` de gama baja puede costar mucho más en gas que en tarifas, y las propias tarifas oscilan con el precio de ETH. Las herramientas de capa 2 y de agrupación (batching) suavizan esto, pero el punto central se mantiene: el mantenimiento de ENS es más irregular y menos predecible que el de DNS, y esa imprevisibilidad es un coste real para cualquiera que opere a volumen.

## Para qué sirve cada uno

Ninguno es estrictamente mejor: se adaptan a flippers distintos y a nombres distintos.

**El flipping de DNS tradicional** gana cuando tu comprador es una *empresa* en lugar de un usuario de criptomonedas: un usuario final que necesita `austinplumbing.com` para una web, correo electrónico y posicionamiento en Google. El grupo de compradores es toda la economía, los nombres funcionan en todas partes sin la menor fricción, el mantenimiento es predecible y el manual de jugadas es maduro. El coste es una liquidación lenta y atada al escrow, y una propiedad opaca. La mayor parte del oficio del [flipping de dominios](/es/blog/domain-flipping/) —el sourcing, la [tasación](/es/blog/how-to-value-a-domain-name/), la prospección— se construyó aquí.

**El flipping de ENS** gana cuando el valor del nombre es *nativo de las criptomonedas*: una identidad de billetera limpia, un identificador de protocolo o DAO, un string coleccionable corto. La liquidación es atómica, la propiedad es autocustodiada y el activo es componible con aplicaciones en cadena. El coste es un grupo de compradores más reducido, exposición al gas, reglas de expiración más estrictas y la responsabilidad total por tus propias llaves: pierde la billetera y el nombre desaparece, que es exactamente la razón por la que [recuperar un nombre on-chain tras la pérdida de la billetera](/es/blog/recovering-a-tokenized-domain-after-wallet-loss/) y la [custodia multifirma](/es/glossary/multi-sig/) importan mucho más aquí que en DNS.

Y hay una tercera vía que no te obliga a elegir. Un **dominio DNS tokenizado** —un `.com` real con un token en cadena encima— te da el grupo universal de compradores del DNS *y* la liquidación atómica, libre de escrow y autocustodiada de ENS. Ese es el carril para el que está construido [Namefi](https://namefi.io): tokeniza un nombre que ibas a revender de todos modos, mantenlo resolviéndose en todas partes y véndelo en cadena sin el baile del escrow. Si estás sopesando en serio el lado on-chain, el pilar del clúster [flipping de dominios on-chain](/es/blog/onchain-domain-flipping/) y [cómo la tokenización cambia el flipping de dominios](/es/blog/how-tokenization-changes-domain-flipping/) exponen el panorama completo, y [vender dominios como NFTs](/es/blog/selling-domains-as-nfts/) cubre los mecanismos de la puesta a la venta.

## En resumen

El flipping de ENS y el de DNS comparten un espíritu y casi nada de su fontanería. ENS te da propiedad pública, [liquidez](/es/glossary/domain-trading/) de marketplace de NFTs y liquidación atómica, al precio de un grupo de compradores más fino, exposición al gas, reglas de expiración duras y riesgo de autocustodia. DNS te da un grupo de compradores universal, un mantenimiento predecible y un indulgente colchón de renovación, al precio de transferencias lentas, atadas al escrow y opacas. Los flippers más astutos no eligen una tribu; emparejan el nombre con el mercado. Y cada vez más recurren al DNS tokenizado para dejar de elegir del todo.

## Aviso amistoso (¡léeme!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo es asesoramiento legal, financiero, fiscal, contable, médico ni de ningún otro tipo profesional.** Escribimos estos artículos para educarnos a nosotros mismos y como una comodidad para nuestros clientes. La información aquí puede estar desactualizada, ser específica de una geografía o simplemente estar equivocada. Nosotros también cometemos errores.
>
> Para cualquier decisión importante, **por favor consulta a un profesional de verdad (¡en serio!)**. O si eso no va contigo, pregúntale a un amigo, pregunta en Twitter, pregunta en Reddit, pregúntale a una IA o pregúntale a un vidente. En resumen: **DOYR - Do Your Own Research (Investiga por tu cuenta)**. Aprendamos y divirtámonos.

## Fuentes y lecturas adicionales

- Documentos de ENS — [¿Qué es ENS? (sistema de nomenclatura distribuido en la cadena de bloques de Ethereum)](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)
- Documentos de ENS — [Registrador ETH (los nombres .eth se transfieren como cualquier token ERC721; periodo de gracia y subasta holandesa al expirar; tarifas anuales basadas en la longitud)](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- Ethereum Improvement Proposals — [ERC-721 Estándar de Token No Fungible ("una interfaz estándar para tokens no fungibles, también conocidos como deeds")](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- Wikipedia — [Domain name registrar (plazo máximo de gTLD de 10 años; precios de renovación minorista de `.com`)](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)
