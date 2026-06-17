---
title: 'El ataque interno a SushiSwap MISO: Cómo un commit malicioso desvió ~$3M de una subasta de tokens'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'En septiembre de 2021, un contratista anónimo introdujo la dirección de su propia billetera en el front-end de la plataforma de lanzamiento MISO de SushiSwap mediante un commit malicioso, desviando 864.8 ETH (~$3M) de la subasta de Jay Pegs Auto Mart. Un análisis profundo de Domain Mayday sobre las cadenas de suministro de código, la confianza en el front-end y lo que esto nos enseña sobre la propiedad verificable.'
keywords: ['hackeo sushiswap miso', 'ataque a la cadena de suministro miso', 'aristok3', 'jay pegs auto mart', 'ataque front-end defi', '864.8 eth', 'cadena de suministro de software', 'commit malicioso', 'amenaza interna', 'auctionwallet', 'joseph delong', 'seguridad de la cadena de suministro web', 'seguridad de dominios']
---

La mayoría de los ataques fuerzan una puerta. Este simplemente entró por la puerta principal.

En septiembre de 2021, las personas que administraban la plataforma de lanzamiento MISO de SushiSwap no fueron víctimas de phishing, no perdieron una clave privada y no publicaron un contrato inteligente con errores. Hicieron algo mucho más común: confiaron en un colaborador. Un contratista anónimo con acceso de commit al código puso la dirección de su propia billetera en el front-end de la subasta, hizo un push y dejó que el proceso de despliegue hiciera el resto. Cuando finalizó una única subasta de NFT, aproximadamente **864.8 ETH —unos $3 millones de dólares—** fluyeron no al proyecto que organizaba la venta, sino al desarrollador que había reescrito discretamente hacia dónde debía ir el dinero.

Ningún exploit. Ningún día cero (zero-day). Solo una línea de código que nadie verificó, firmada por alguien que se suponía que estaba en el equipo.

Este es el EP15 de Domain Mayday. Es una historia sobre contratos inteligentes solo en la superficie. En su núcleo, es una historia sobre la parte de la web que la mayoría de la gente nunca audita: la cadena de suministro de código, el front-end y el incómodo hecho de que "¿quién tiene permiso para cambiar esto?" es una pregunta de seguridad tan seria como "¿quién tiene las llaves?".

## La confianza que depositas en el código de una plataforma de lanzamiento

Una plataforma de lanzamiento DeFi como MISO (Minimal Initial SushiSwap Offering) existe para hacer una cosa bien: tomar dinero de una multitud de extraños y dirigirlo a un proyecto que realiza una venta de tokens o NFT. Para lograrlo, entrelaza contratos inteligentes auditados on-chain (en la cadena) y un front-end web off-chain (fuera de la cadena). Los usuarios interactúan con el front-end. El front-end le dice a su billetera qué transacción firmar.

Esa costura es el punto débil. La gente se obsesiona con la capa de contratos inteligentes porque ahí es donde viven las auditorías, los programas de recompensas por errores (bug bounties) y los titulares. Pero el front-end —el JavaScript que decide *a qué dirección* paga una subasta— es solo código en un repositorio, implementado por un proceso (pipeline), y editado por cualquiera que tenga acceso de escritura. Puedes auditar la bóveda todo lo que quieras; si alguien desde adentro puede cambiar el letrero que dice "deposite su dinero aquí", la bóveda ni siquiera entra en juego.

El código de MISO era abierto y colaborativo, de la forma en que suele ser la infraestructura cripto. Esa apertura es una característica: invita a contribuidores, acelera el desarrollo y permite que un pequeño equipo central logre resultados muy por encima de sus posibilidades. También es exactamente la superficie que necesita un atacante de la cadena de suministro. No tienes que forzar la entrada si simplemente puedes ser invitado a contribuir.

## Septiembre 2021: el commit malicioso

![Vivid colorful concept art of a single tampered brick, glowing red, being quietly swapped into an otherwise clean open-source brick wall by an anonymous gloved hand](../../assets/the-sushiswap-miso-insider-attack-01-attack.jpg)

El viernes 17 de septiembre de 2021, el entonces Director de Tecnología (CTO) de SushiSwap, Joseph Delong, recurrió a Twitter para explicar lo sucedido. El relato de CoinDesk es contundente: Delong dijo que [un contratista anónimo usando el alias de Github "AristoK3" inyectó código malicioso en el front-end de Miso en un ataque a la cadena de suministro](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=an%20anonymous%20contractor%20using%20the%20Github%20handle).

La mecánica fue casi insultantemente simple. Según lo describió Delong, el atacante [reemplazó la dirección de la billetera de la subasta con la suya propia](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=replaced%20the%20auction%27s%20wallet%20address%20with%20their%20own). PYMNTS expresó el acto en términos de cadena de suministro exactamente así: el contratista [hizo un push de un commit de código malicioso que se distribuyó en el front-end de la plataforma](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=pushed%20a%20malicious%20code%20commit%20that%20was%20distributed%20on%20the%20platform%27s%20front%20end).

Un informe post-mortem del incidente captura la esencia en una oración: un desarrollador que había sido contratado para trabajar en la subasta [insertó la dirección de su propia billetera en el contrato en lugar del auctionWallet](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=inserted%20his%20own%20wallet%20address%20into%20the%20contract%20instead%20of%20the) — editando el valor que el front-end introducía en el momento del despliegue, no rompiendo la lógica on-chain auditada en sí. Una sola variable. Se suponía que `auctionWallet` apuntaba al proyecto que realizaba la venta. En su lugar, apuntaba al contratista. Cada dólar que un postor creía estar enviando al beneficiario de la subasta iba a otro lugar, y el código se veía perfectamente normal mientras lo hacía.

## Lo que se desvió: ~864.8 ETH, ~$3 millones

El objetivo fue una única, casi cómica subasta. Según informó CryptoSlate, MISO sufrió un ataque a la cadena de suministro que [drenó 864.8 ETH del contrato de subasta de tokens de 'Jay Pegs Auto Mart'](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=drained%20864.8%20ETH%20from%20the). Jay Pegs Auto Mart era un proyecto de arte NFT con temática de concesionario de autos usados — un decorado lúdico de la criptocultura sobre lo que era, financieramente, una venta de tokens muy real.

Las cifras coincidieron en todos los medios. PYMNTS informó que [el hacker transfirió 864.8 monedas Ethereum —alrededor de $3 millones— a su billetera](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=transferred%20864.8%20Ethereum%20coins). The Crypto Times señaló que el atacante [drenó 864.8 ETH](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=drained%20864.8%20ETH), y que [el único proyecto de subasta que ha sido hackeado y explotado hasta ahora es Jay Pegs Auto Mart](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=The%20only%20auction%20project%20that%20has%20been%20hacked%20and%20exploited).

Ese último detalle es importante. El código envenenado fue distribuido a través del front-end, lo que significa que, en principio, podría haber redirigido *cualquier* subasta que tocara. En la práctica, solo Jay Pegs Auto Mart se liquidó en la dirección del atacante antes de que el equipo lo detectara. Las otras subastas afectadas fueron parcheadas antes de que pudieran ser vaciadas — unas pocas horas de diferencia entre un solo mal titular y una catástrofe.

## Cómo sucedió: confianza en un interno, no una cerradura rota

![Vivid colorful concept art of an insider in shadow quietly twisting a glowing money pipe so its flow spills into a private bucket instead of the intended tank](../../assets/the-sushiswap-miso-insider-attack-02-malicious-commit.jpg)

Quite el vocabulario cripto y esto es un ataque clásico a la cadena de suministro de software — de la misma categoría que un paquete npm envenenado o un servidor de compilación alterado, solo que con el botín denominado en ETH.

La cadena de confianza se veía así. Se le otorgó a un colaborador acceso de escritura al código que impulsaba las subastas en vivo. Utilizó ese acceso para realizar un commit con un cambio que intercambió la dirección de destino. El proceso de despliegue (pipeline) hizo lo que hacen estos procesos: tomó el código más reciente y lo implementó en el front-end que los usuarios reales cargaban en sus navegadores. Esos usuarios conectaron sus billeteras, firmaron lo que el front-end les dijo que firmaran, y financiaron una subasta cuyo beneficiario había sido reescrito en silencio. El relato de Coinspeaker coincide con los demás: [un contratista anónimo con el alias de GH AristoK3 inyectó código malicioso en el front-end de Miso](https://www.coinspeaker.com/sushiswap-miso-attack-nft/#:~:text=an%20anonymous%20contractor%20with%20the%20GH%20handle%20AristoK3%20injected%20malicious%20code%20into%20the%20Miso%20front%20end).

Note lo que *no* fue necesario. El atacante no necesitó encontrar una falla en un contrato inteligente. No necesitó robar una clave ni comprometer un servidor desde afuera. Necesitó exactamente una cosa: tener la confianza suficiente para cambiar el código. El enfoque del reporte del incidente es preciso: [el front-end de Miso ha sido víctima de un ataque a la cadena de suministro](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=The%20Miso%20front%20end%20has%20become%20the%20victim%20of%20a%20supply%20chain%20attack), llevado a cabo por un contratista anónimo usando el alias de GitHub AristoK3, quien [inyectó código malicioso en el front-end de Miso](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=injected%20malicious%20code%20into%20the%20Miso%20front%20end).

Esto es lo que hace que los ataques internos a la cadena de suministro sean tan peligrosos. Toda defensa externa —firewalls, auditorías, carteras multifirma (multisigs) en la tesorería— asume que la amenaza está en el exterior tratando de entrar. Un atacante interno con derechos de commit ya ha superado todo eso. El cambio malicioso viajó a producción usando el propio proceso de despliegue confiable y legítimo del proyecto. El pipeline no fue subvertido. Fue *utilizado*.

## Respuesta y recuperación: atrapado, nombrado y reembolsado

La respuesta de SushiSwap fue rápida, pública y confrontacional. Delong no investigó en silencio; nombró el alias de GitHub, mencionó una identidad real sospechosa y fijó un plazo. Según CoinDesk, la advertencia fue explícita: si los fondos no eran devueltos, el exchange DeFi presentaría [una queja ante el FBI](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=file%20a%20complaint%20with%20the%20FBI).

Funcionó. El atacante dio marcha atrás. CryptoSlate informó que solo un par de horas después de que el equipo hiciera público el caso, [el hacker devolvió 865 ETH al contrato original de MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=the%20hacker%20returned%20865%20ETH%20to%20the%20original%20MISO%20contract) — un poco *más* de los 864.8 ETH que salieron. The Crypto Times confirmó el destino: [la dirección multifirma de Sushiswap recuperó 865 ETH](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=the%20multisign%20address%20of%20Sushiswap%20got%20865%20ETH%20back). La propia actualización de estado de Delong fue tan concisa como la amenaza original. Decrypt registra su confirmación de que, en aproximadamente un día, [Todos los fondos fueron devueltos](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum#:~:text=All%20funds%20returned).

El final feliz merece un asterisco. El dinero regresó no porque la arquitectura haya detectado el robo, sino porque el atacante eligió devolverlo bajo la brillante luz de la exposición pública y una amenaza creíble de las autoridades. El seudonimato en un libro mayor público (public ledger) es un arma de doble filo: le permitió al contratista actuar de forma anónima, pero también significó que el rastro on-chain de los fondos desviados fuera visible para todos, lo cual es exactamente la ventaja que hizo que devolver el dinero fuera el camino de menor resistencia. Aquí, la recuperación fue una negociación, no una garantía. El próximo atacante interno podría no titubear.

## Lo que esto enseña sobre las cadenas de suministro de código y la confianza en el front-end

El incidente de MISO es pequeño en dólares para los estándares de DeFi, pero grande en lecciones. Algunas que vale la pena destacar:

1. **El front-end es parte de su perímetro de seguridad.** Los usuarios firman lo que la interfaz les dice que firmen. Si un atacante controla qué dirección muestra la interfaz, no necesita el contrato inteligente en absoluto. Auditar solo el código on-chain es auditar solo la mitad del sistema.
2. **El acceso de escritura es la verdadera superficie de ataque.** La criptografía más fuerte del mundo no sirve de nada si la persona que puede editar el código decide actuar maliciosamente. "¿Quién puede cambiar esto y quién lo revisa antes de que se implemente?" es un control de seguridad, no un detalle del proceso.
3. **La revisión de código obligatoria no es burocracia: es defensa.** Un simple requerimiento de un segundo par de ojos en el commit que intercambió `auctionWallet` probablemente habría detenido esto en seco. Los ataques a la cadena de suministro prosperan con cambios que nadie verifica de manera independiente antes del despliegue.
4. **Los colaboradores bajo seudónimo aumentan el riesgo.** La contribución abierta es una fortaleza, pero otorgar acceso que afecte al despliegue a una identidad anónima significa que está confiando en código que no puede atribuir por completo. La confianza debe escalar junto con la verificación, no con el entusiasmo.
5. **La recuperación es cuestión de suerte, no de arquitectura.** Los fondos regresaron gracias a la presión pública y a un libro mayor rastreable. Diseñar un sistema que *dependa* de la buena voluntad del atacante no es, de ningún modo, un diseño de seguridad.

La línea conductora: la integridad de *quién está autorizado para hacer un cambio*, y *la verificación de que el cambio es el que se implementó*, soporta tanto peso como cualquier clave criptográfica. La confianza en la cadena de suministro no es una preocupación cultural menor. Es el límite rígido del sistema.

## La perspectiva de Namefi

![Colorful illustration of verifiable, tamper-resistant ownership — secured by a green shield, a green Namefi token, and continuity](../../assets/the-sushiswap-miso-insider-attack-03-namefi-angle.jpg)

MISO perdió dinero porque el *destino de los fondos* (destination of value) pudo ser reescrito en silencio por alguien en quien el sistema confiaba, y nadie verificó el cambio antes de que se publicara. Este tipo de fallo no es exclusivo de las plataformas de lanzamiento DeFi. Tiene la misma forma que un dominio cuya propiedad o registros DNS pueden ser alterados discretamente por quienquiera que tenga el acceso adecuado: una cuenta de registrador, un panel interno, un contratista con credenciales.

Un dominio es una de las configuraciones de "destino" más trascendentales en Internet. Sus registros DNS deciden a dónde van realmente su tráfico, su correo electrónico y sus usuarios. Si estos pueden ser cambiados por un infiltrado o por una cuenta comprometida sin un registro inalterable y verificable de forma independiente de quién cambió qué, usted tiene el problema de MISO vestido con otra ropa: la cerradura está bien, pero el letrero de la puerta puede ser intercambiado.

[Namefi](https://namefi.io) aborda esto tratando la propiedad de un dominio como un activo verificable y resistente a manipulaciones, en lugar de una entrada en la cuenta privada de alguien. La propiedad tokenizada hace que el control sea auditable y transferible on-chain, manteniéndose compatible con el DNS, por lo que "quién es el dueño de esto y quién tiene permiso para cambiarlo" se convierte en un hecho que se puede verificar, no en una confianza que deba otorgar a ciegas. El contratista de MISO pudo reescribir una dirección de pago precisamente porque el sistema no tenía una respuesta forzosa y verificable independientemente a "¿está autorizado este cambio?". La lección que Namefi extrae de los ataques a la cadena de suministro es que la propiedad y el control deben ser demostrables por diseño, para que esa peligrosa brecha entre *confiado* y *verificado* nunca se abra en primer lugar.

## Fuentes y lecturas adicionales

- CoinDesk — [$3M en Ether robados de la plataforma de lanzamiento MISO de SushiSwap](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad)
- Decrypt — [La plataforma de lanzamiento de tokens de SushiSwap fue hackeada por más de $3M en Ethereum](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum)
- CryptoSlate — [El hacker devuelve 865 ETH robados de la plataforma de lanzamiento de tokens de Sushi, MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/)
- PYMNTS — [Plataforma cripto SushiSwap víctima de un hackeo de $3M](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/)
- The Crypto Times — [La plataforma Miso de Sushiswap pierde $3 millones en un ataque](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/)
- Coinspeaker — [La plataforma de lanzamiento Miso de SushiSwap sufre un ataque con el robo de 864.8 ETH del fondo de un proyecto NFT](https://www.coinspeaker.com/sushiswap-miso-attack-nft/)
- CryptoBriefing — [La plataforma de ofertas iniciales de Sushi sufre un exploit de $3M](https://cryptobriefing.com/sushiswaps-miso-token-launchpad-suffers-3m-exploit/)
- CryptoPotato — [Otro hackeo DeFi: $3M en ETH robados de la plataforma de tokens de SushiSwap](https://cryptopotato.com/another-defi-hack-3m-in-eth-stolen-from-sushiswaps-token-platform/)
- Quadriga Initiative — [Estudio de caso de SushiSwap MISO Jaypegs Automart](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php)