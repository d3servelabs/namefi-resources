---
title: "Tasar dominios ENS y tokenizados: leer comparables onchain"
date: '2026-06-24'
language: es
tags: ['domains', 'domain-flipping', 'web3', 'analysis']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 40
format: analysis
description: "Cómo tasar dominios ENS y tokenizados usando comparables onchain, el razonamiento de piso frente a prima y los factores de club de ENS — y por qué difiere del DNS."
ogImage: ../../assets/appraising-onchain-domains-og.jpg
keywords: ['tasar dominios ENS', 'valoración de dominios ENS', 'tasación de dominios tokenizados', 'comparables onchain', 'ventas comparables de dominios', 'comparables de NameBio', 'precio de piso de ENS', 'club 999 de ENS', 'club 10k de ENS', 'cómo valorar un nombre ENS', 'valor de dominio tokenizado', 'tasación de dominios web3', 'valor de dominio ERC-721', 'historial de ventas onchain', 'piso frente a prima de dominios']
relatedArticles:
  - /es/blog/onchain-domain-flipping/
  - /es/blog/how-to-read-comparable-domain-sales/
  - /es/blog/domain-appraisal-tools-compared/
  - /es/blog/domain-flipping/
  - /es/blog/onchain-domain-marketplaces-compared/
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
  - /es/glossary/registry/
---

La tasación es la habilidad que decide si un flip gana dinero. El sourcing te dice qué está a la venta y la venta convierte un nombre en un cheque, pero el número que está en medio — lo que un nombre vale realmente — es donde reside el margen. Eso es cierto para un `.com` y también onchain. Sin embargo, el mundo onchain puede ofrecer algo que el mercado secundario del [DNS](/es/glossary/dns/) normalmente no puede: un historial público de propiedad con marcas de tiempo y, cuando un protocolo de mercado registra la contraprestación, evidencia de operaciones que puedes auditar. Eso no equivale a un registro completo de ventas: algunas transferencias no son ventas y algunos pagos o términos de la operación permanecen offchain. Este es el capítulo de tasación del manual más amplio de [flipping de dominios](/es/blog/domain-flipping/), centrado en los dos activos que comercias en el [flipping de dominios onchain](/es/blog/onchain-domain-flipping/) — nombres [ENS](/es/glossary/ens/) y dominios ICANN tokenizados.

El método es el mismo que usan los tasadores profesionales y los agentes inmobiliarios: los comparables. Como los define Wikipedia, [los comparables (o comps) son un término de tasación inmobiliaria que se refiere a propiedades con características similares a una propiedad objeto cuyo valor se busca](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property). Los dominios no tienen un precio de cotización, así que razonas a partir de lo que nombres similares vendieron recientemente. El giro onchain es que una venta declarada a menudo puede contrastarse con eventos de mercado y de pago específicos del protocolo, en vez de aceptarse solo porque alguien la reportó, pero únicamente cuando esos eventos muestran la contraprestación.

## De dónde vienen los comparables

![Ilustración editorial de la figura de un tasador con una lupa leyendo un libro contable onchain transparente con etiquetas de precio de ventas comparables recientes que fluyen de un cubo de blockchain](../../assets/appraising-onchain-domains-01-onchain-comps.jpg)

Para los dominios tradicionales, la base de datos de comparables por excelencia es [NameBio](https://namebio.com/), un archivo consultable de ventas históricas de dominios del [comercio de dominios](/es/glossary/domain-trading/) que puedes filtrar por palabra clave, extensión, precio y fecha. Es lo más parecido a un feed público de precios que tiene el mercado secundario del DNS: buscas nombres como el que estás tasando, miras a qué cerraron realmente y construyes un rango defendible a partir de la evidencia en lugar de una corazonada. Trata las cifras de portada como estimaciones — las ventas reportadas se inclinan hacia las que vale la pena reportar, y una base de datos de operaciones cerradas no puede contarte sobre los nombres que nunca se vendieron — pero como punto de partida supera a toda herramienta de tasación automatizada, razón por la cual nuestra guía sobre [cómo valorar un nombre de dominio](/es/blog/how-to-value-a-domain-name/) se apoya en las [ventas comparables](/es/glossary/comparable-sales/) por encima de los algoritmos.

Onchain, los datos de comparables pueden ser más ricos y su consulta es gratuita. Un nombre ENS o un dominio tokenizado es un [NFT](/es/glossary/nft/) bajo el estándar [ERC-721](/es/glossary/erc-721/) — que la especificación de Ethereum describe como una [API estándar para NFT dentro de contratos inteligentes](https://eips.ethereum.org/EIPS/eip-721#:~:text=The%20following%20standard%20allows%20for%20the%20implementation%20of%20a%20standard%20API%20for%20NFTs). Su [evento `Transfer` registra un cambio de propiedad únicamente con el remitente, el destinatario y el ID del token](https://eips.ethereum.org/EIPS/eip-721#specification); no identifica la transferencia como una venta ni indica un precio. La reconstrucción de una venta depende del mercado: el evento [`OrderFulfilled` de Seaport, por ejemplo, registra listas separadas de oferta y contraprestación](https://docs.opensea.io/docs/seaport-events-and-errors#orderfulfilled). Los mercados compatibles pueden usar esos registros para componer historiales de ventas, publicaciones y pisos, pero las transferencias entre billeteras, los pagos offchain y los lotes complejos requieren verificación adicional y pueden no producir un comparable limpio. La ventaja para la tasación es una pista de auditoría más sólida, no un registro de ventas automático ni completo.

## Piso frente a prima

![Ilustración editorial de un gráfico de precios con una línea base de piso plana formada por muchas mosaicos de nombre pequeños e iguales y unas pocas mosaicos de prima destacadas que se elevan muy por encima de la línea](../../assets/appraising-onchain-domains-02-floor-vs-premium.jpg)

El marco más útil para una tasación onchain es el de piso frente a prima, y encaja limpiamente con cómo se negocian estos activos en realidad.

El **piso** es el nombre disponible más barato dentro de una categoría reconocible — la oferta más baja en una colección de un [mercado](/es/glossary/marketplace/). Para una clase de nombres similares (digamos, nombres `.eth` de cinco letras o números aleatorios de cuatro dígitos), el piso es tu línea base: es aproximadamente lo que vale ahora mismo un miembro genérico e indiferenciado de ese conjunto. Los pisos se mueven con el mercado y con el hype, así que cualquier piso que cites es una instantánea, no una constante.

La **prima** es todo lo que un nombre específico exige por encima de ese piso — por ser más corto, una palabra de diccionario real, una marca reconocida o un número bajo. La mayor parte del trabajo de un tasador es justificar la prima: el piso lo puedes leer en una pantalla, pero la brecha entre el piso y lo que conseguiría `crypto.eth` es un juicio de valor que defiendes con comparables. La disciplina consiste en anclarse primero en el piso, y luego argumentar la prima hacia arriba a partir de ventas comparables, en lugar de partir de un número soñado y trabajar hacia abajo.

ENS hace esto concreto porque su propio precio de registro está escalonado por longitud. Según la documentación de ENS, un [.eth de 5+ letras te costará 5 USD al año](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), mientras que los nombres de cuatro y tres caracteres cuestan más al registrarse por diseño. Esa señal de escasez a nivel de protocolo — los nombres más cortos cuestan más incluso para conservarlos — te dice dónde se concentra la prima antes de que mires una sola venta.

## Rareza de ENS y factores de club

![Ilustración editorial de tokens de nombre estilo ENS siendo clasificados en niveles de rareza como estantes de insignias jerarquizados — un nivel de tres dígitos, un nivel de cuatro dígitos, un palíndromo y un nombre corto](../../assets/appraising-onchain-domains-03-club-factors.jpg)

ENS tiene una peculiaridad que ninguna extensión del DNS comparte: niveles de rareza organizados. Los "clubs" son conjuntos de nombres definidos puramente por su forma, y la pertenencia es un motor de valor fuerte y legible.

Los más conocidos son los clubs numéricos. El 999 Club son los 1.000 nombres de tres dígitos de `000.eth` a `999.eth`; el 10k Club son los 10.000 nombres de cuatro dígitos de `0000.eth` a `9999.eth`. Como la oferta de cada uno es fija y diminuta, se negocian como una serie de coleccionables con un piso visible y una delgada cola de prima. Los números también son neutrales respecto al idioma y difíciles de teclear mal, lo que es parte de por qué se convirtieron en un mercado especulativo propio. La misma lógica se extiende a las cadenas cortas de letras, los palíndromos y los nombres con emoji: cuanto más raro y legible el patrón, más gruesa la prima sobre el piso.

Las ventas de techo muestran hasta dónde llega la cola de prima. La mayor venta de ENS registrada es `paradigm.eth`, que The Block reporta que fue [comprada en octubre de 2021 por 420 ETH (unos 1,5 millones de dólares en ese momento)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=purchased%20in%20October%202021%20for%20420%20ETH), y `000.eth` — el miembro principal del 999 Club — [se compró por 300 ETH (315.000 dólares)](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH), [convirtiéndola en la segunda mayor venta medida tanto en ether como en dólares](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=making%20it%20the%20second%2Dlargest%20sale). Esos son valores atípicos y están cotizados en ETH, así que la cifra en dólares oscila con el token — pero anclan la parte alta de la curva. Cuando tasas un nombre de club, lo estás ubicando en una distribución cuyo piso y techo son ambos observables onchain. Para ver dónde se sitúan estos nombres respecto a otros activos onchain, consulta los [TLD web3 premium](/es/blog/premium-web3-tlds/) y la comparación más amplia [ENS frente a Unstoppable frente a DNS tokenizado](/es/blog/ens-vs-unstoppable-vs-tokenized-dns/).

## Tasar un dominio ICANN tokenizado es una tasación de DNS

Esta es la línea que no debes difuminar. Un dominio ICANN tokenizado no es un nombre ENS con una etiqueta distinta — es un `.com`, `.xyz` o `.io` real cuya propiedad se refleja como un token, mientras que el nombre subyacente sigue resolviéndose en todas partes. Como lo plantea nuestro explicativo sobre [qué son los dominios tokenizados](/es/blog/what-are-tokenized-domains/), estos son dominios DNS reales que *además* tienen una capa onchain, no un espacio de nombres paralelo. La consecuencia práctica para la tasación: valoras un `.com` tokenizado de la misma forma que valoras cualquier `.com` — con comparables de DNS de NameBio y los fundamentos habituales de longitud, demanda de palabras clave y fortaleza de la extensión — porque el comprador está pagando por un nombre resoluble universalmente, no por un alias de billetera.

Así que el conjunto de comparables se divide limpiamente. Para tasar `acme.eth`, sacas las ventas de ENS y los pisos de club, porque su valor es la identidad nativa de cripto. Para tasar un `acme.com` tokenizado, sacas los comparables de `.com`, porque su valor es una dirección web real que da la casualidad de que se liquida onchain. Confundir ambos es el error de tasación más común en este espacio — un `.com` tokenizado y un `.eth` de la misma palabra raíz son productos diferentes con compradores diferentes y comparables muy diferentes. Recorremos la versión orientada al comercio de esta distinción en [flipping de dominios ENS frente a DNS](/es/blog/ens-vs-dns-domain-flipping/), y la mecánica de por qué la tokenización cambia la operación en [cómo la tokenización cambia el flipping de dominios](/es/blog/how-tokenization-changes-domain-flipping/).

## En qué se diferencia la tasación onchain de la tasación de DNS

Los insumos riman, pero cuatro cosas difieren de verdad una vez que un nombre es un token.

**Los datos de comparables pueden auditarse, no darse por sentados.** Una entrada de NameBio es una venta que alguien eligió divulgar; un cambio de propiedad onchain es un evento de [contrato inteligente](/es/glossary/smart-contract/) que cualquiera puede leer, y una venta en un mercado puede comprobarse cuando el protocolo registra su contraprestación. Un `Transfer` ERC-721 por sí solo no basta. Antes de tratar el evento como comparable, aún debes identificar el protocolo de venta, el activo de pago, los elementos agrupados, los componentes offchain y un posible wash trading.

**Hay un piso en vivo.** Los nombres del DNS no tienen un precio de piso; cada uno es su propia negociación. Una colección de nombres onchain sí lo tiene, y un piso en movimiento cambia la tasación de hora en hora de una manera que una valoración de `.com` nunca hace.

**La menor fricción de liquidación es estructural; una mayor liquidez de mercado no está garantizada.** Un contrato de mercado puede intercambiar el pago y un token en una [transferencia atómica](/es/glossary/atomic-transfer/) — todas las partes se liquidan juntas o ninguna lo hace —, lo que reduce los traspasos y puede disminuir el tiempo, el coste y el riesgo de liquidación, como [explica el BIS en su descripción de la liquidación atómica](https://www.bis.org/publ/othp99.htm). Eso mejora la mecánica de liquidación, pero no aumenta por sí solo la [liquidez de los dominios](/es/glossary/domain-liquidity/) onchain: no crea demanda de compradores, oferta de vendedores ni un mercado bilateral profundo. La ejecución atómica puede eliminar de una venta [como NFT](/es/blog/selling-domains-as-nfts/) al agente de depósito en garantía o la ventana de transferencia. El [Banco de la Reserva Federal de Nueva York describe la liquidez de mercado como multidimensional](https://www.newyorkfed.org/newsevents/speeches/2015/dud150930.html), medida por factores como los diferenciales entre precios de compra y venta, la profundidad de mercado y el impacto en los precios; evalúalos por separado de la mecánica de liquidación. Explicamos el flujo de liquidación en [cómo los mercados tokenizados reemplazan el escrow](/es/blog/how-tokenized-marketplaces-replace-escrow/).

**Los precios denominados en cripto añaden una segunda variable.** La mayoría de los comparables onchain se cotizan en ETH. Un nombre "que vale 5 ETH" puede oscilar miles de dólares solo por los movimientos del token, así que anota siempre si estás tasando en ETH o en moneda fiat — cuentan historias distintas, y tratar un piso en ETH como un número estable en dólares es como se tuercen las tasaciones.

El hilo conductor: la tasación onchain puede ofrecerte un historial de propiedad más auditable y una liquidación más rápida, además de datos de comparables más ricos cuando un mercado registra la contraprestación, pero el oficio central no cambia. Ancla la valoración en el piso, justifica la prima con ventas comparables verificadas y usa el conjunto de comparables correcto para cada activo. Un `.com` tokenizado en una plataforma como [Namefi](https://namefi.io) se tasa como el dominio real que es; un `.eth` se tasa como el coleccionable onchain que es. Acierta con el conjunto de comparables y el resto es aritmética.

## Aviso amistoso (¡Léeme!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo es asesoría legal, financiera, fiscal, contable, médica ni de ningún otro tipo profesional.** Escribimos estas publicaciones para educarnos a nosotros mismos y como una conveniencia para nuestros clientes. La información aquí puede estar desactualizada, ser específica de una región o simplemente estar equivocada. Nosotros también cometemos errores.
>
> Para cualquier decisión importante, **por favor consulta a un profesional de verdad (¡en serio!)**. O si eso no va contigo, pregúntale a un amigo, pregunta en Twitter, pregunta en Reddit, pregúntale a una IA o pregúntale a un psíquico. En resumen: **DOYR - Do Your Own Research (Haz tu propia investigación)**. Aprendamos y divirtámonos.

## Fuentes y lecturas adicionales

- Wikipedia — [Comparables (el método de comparables para tasar por ventas recientes similares)](https://en.wikipedia.org/wiki/Comparables#:~:text=Comparables%20%28or%20comps%29%20is%20a%20real%20estate%20appraisal%20term%20referring%20to%20properties%20with%20characteristics%20that%20are%20similar%20to%20a%20subject%20property)
- NameBio — [base de datos consultable de ventas históricas de nombres de dominio](https://namebio.com/)
- Ethereum Improvement Proposals — [ERC-721: el evento `Transfer` registra `_from`, `_to` y `_tokenId`, no la contraprestación de una venta](https://eips.ethereum.org/EIPS/eip-721#specification)
- Documentación de OpenSea — [evento `OrderFulfilled` de Seaport con listas separadas de oferta y contraprestación](https://docs.opensea.io/docs/seaport-events-and-errors#orderfulfilled)
- Banco de Pagos Internacionales — [liquidación atómica y sus posibles efectos sobre el tiempo, el coste y el riesgo de liquidación](https://www.bis.org/publ/othp99.htm)
- Banco de la Reserva Federal de Nueva York — [las medidas de liquidez de mercado incluyen diferenciales entre precios de compra y venta, profundidad de mercado e impacto en los precios](https://www.newyorkfed.org/newsevents/speeches/2015/dud150930.html)
- Documentación de ENS — [precio del registrador de .eth por longitud de nombre (5+ letras = 5 USD/año)](https://docs.ens.domains/registry/eth#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- The Block — [000.eth se vendió por 300 ETH (315.000 dólares); paradigm.eth por 420 ETH (~1,5 M de dólares, oct 2021); nombres ENS como NFT en OpenSea](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
