---
title: 'El ataque interno a SushiSwap MISO: cómo un commit malicioso desvió ~$3M de una subasta de tokens'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'En septiembre de 2021, un contratista anónimo introdujo su propia dirección de billetera en el front-end de la plataforma de lanzamiento MISO de SushiSwap mediante un commit malicioso, desviando 864,8 ETH (~$3M) de la subasta Jay Pegs Auto Mart. Un análisis en profundidad de Domain Mayday sobre cadenas de suministro de código, confianza en el front-end y lo que enseña sobre la propiedad verificable.'
keywords: ['hack sushiswap miso', 'ataque cadena de suministro miso', 'aristok3', 'jay pegs auto mart', 'ataque front-end defi', '864.8 eth', 'cadena de suministro de software', 'commit malicioso', 'amenaza interna', 'auctionwallet', 'joseph delong', 'seguridad cadena de suministro web', 'seguridad de dominios']
---

La mayoría de los ataques fuerzan una puerta. Este entró por la principal.

En septiembre de 2021, las personas que gestionaban la plataforma de lanzamiento MISO de SushiSwap no cayeron en un phishing, no perdieron una clave privada ni publicaron un contrato inteligente defectuoso. Hicieron algo mucho más ordinario: confiaron en un colaborador. Un contratista anónimo con acceso de escritura al código introdujo su propia dirección de billetera en el front-end de la subasta, la subió al repositorio y dejó que el proceso de despliegue hiciera el resto. Cuando se liquidó una única subasta de NFT, aproximadamente **864,8 ETH — cerca de $3 millones** — fluyeron no hacia el proyecto que realizaba la venta, sino hacia el desarrollador que había reescrito silenciosamente el destino del dinero.

Sin exploit. Sin zero-day. Solo una línea de código que nadie verificó dos veces, firmada por alguien que se suponía formaba parte del equipo.

Este es el episodio 15 de Domain Mayday. Es una historia sobre contratos inteligentes solo en los márgenes. En su núcleo es una historia sobre la parte de la web que casi nadie audita: la cadena de suministro de código, el front-end y el incómodo hecho de que "¿quién tiene permitido cambiar esto?" es una pregunta de seguridad tan seria como "¿quién tiene las claves?"

## La confianza que depositas en el código de una plataforma de lanzamiento

Una plataforma de lanzamiento DeFi como MISO — Minimal Initial SushiSwap Offering — existe para hacer una cosa bien: tomar dinero de un grupo de desconocidos y dirigirlo hacia un proyecto que lleva a cabo una venta de tokens o NFT. Para ello, combina contratos inteligentes auditados on-chain con un front-end web off-chain. Los usuarios interactúan con el front-end. El front-end le indica a su billetera qué transacción firmar.

Esa juntura es el punto vulnerable. La gente se obsesiona con la capa de contratos inteligentes porque ahí es donde viven las auditorías, las recompensas por errores y los titulares. Pero el front-end — el JavaScript que decide *a qué dirección* paga una subasta — es simplemente código en un repositorio, desplegado por un pipeline, editado por quien tenga acceso de escritura. Puedes auditar la caja fuerte todo lo que quieras; si un atacante interno puede cambiar el cartel que dice "deposita el dinero aquí", la caja fuerte nunca entra en juego.

El código de MISO era abierto y colaborativo, como suele ser la infraestructura cripto. Esa apertura es una característica: invita a colaboradores, acelera el desarrollo y permite que un pequeño equipo central logre resultados muy por encima de su peso. También es exactamente la superficie que necesita un atacante de cadena de suministro. No tienes que entrar a la fuerza si simplemente puedes ser invitado a colaborar.

## Septiembre de 2021: el commit malicioso

![Arte conceptual colorido y vívido de un solo ladrillo alterado, brillando en rojo, siendo silenciosamente intercambiado en una pared de ladrillos de código abierto por una mano enguantada anónima](../../assets/the-sushiswap-miso-insider-attack-01-attack.jpg)

El viernes 17 de septiembre de 2021, el entonces Director de Tecnología de SushiSwap, Joseph Delong, acudió a Twitter para explicar lo que había ocurrido. El relato de CoinDesk es directo: Delong declaró que [un contratista anónimo con el alias de Github "AristoK3" inyectó código malicioso en el front-end de Miso en un ataque a la cadena de suministro](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=an%20anonymous%20contractor%20using%20the%20Github%20handle).

La mecánica era casi insultantemente simple. Según describió Delong, el atacante [reemplazó la dirección de billetera de la subasta por la propia](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=replaced%20the%20auction%27s%20wallet%20address%20with%20their%20own). PYMNTS lo describió en términos de cadena de suministro exactamente: el contratista [subió un commit de código malicioso que fue distribuido en el front-end de la plataforma](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=pushed%20a%20malicious%20code%20commit%20that%20was%20distributed%20on%20the%20platform%27s%20front%20end).

Un análisis post-mortem del incidente captura la esencia en una sola frase: un desarrollador que había sido contratado para trabajar en la subasta [insertó su propia dirección de billetera en el contrato en lugar de la auctionWallet](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=inserted%20his%20own%20wallet%20address%20into%20the%20contract%20instead%20of%20the) — editando el valor que el front-end introducía en el momento del despliegue, no rompiendo la lógica on-chain auditada en sí. Una sola variable. `auctionWallet` debía apuntar al proyecto que realizaba la venta. En cambio, apuntaba al contratista. Cada dólar que un postor creía enviar al beneficiario de la subasta fue a otro lugar, y el código se veía perfectamente normal mientras lo hacía.

## Lo que fue desviado: ~864,8 ETH, ~$3 millones

El objetivo era una única subasta, casi cómica. Según informó CryptoSlate, MISO sufrió un ataque a la cadena de suministro que [drenó 864,8 ETH del contrato de subasta de tokens 'Jay Pegs Auto Mart'](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=drained%20864.8%20ETH%20from%20the). Jay Pegs Auto Mart era un proyecto de arte NFT que se presentaba como una agencia de coches usados — una puesta en escena de la cultura cripto sobre lo que era, financieramente, una venta de tokens muy real.

Las cifras coincidieron en todos los medios. PYMNTS informó que [el hacker transfirió 864,8 monedas Ethereum — alrededor de $3 millones — a su billetera](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=transferred%20864.8%20Ethereum%20coins). The Crypto Times señaló que el atacante [drenó 864,8 ETH](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=drained%20864.8%20ETH), y que [el único proyecto de subasta que ha sido hackeado y explotado hasta el momento es Jay Pegs Auto Mart](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=The%20only%20auction%20project%20that%20has%20been%20hacked%20and%20exploited).

Ese último detalle es importante. El código envenenado se distribuyó a través del front-end, lo que significa que en principio podría haber redirigido *cualquier* subasta que tocara. En la práctica, solo Jay Pegs Auto Mart se liquidó hacia la dirección del atacante antes de que el equipo lo detectara. Las demás subastas afectadas fueron parcheadas antes de poder ser drenadas — unas pocas horas de diferencia entre un único titular negativo y una catástrofe.

## Cómo ocurrió: confianza interna, no una cerradura rota

![Arte conceptual colorido y vívido de un infiltrado en la sombra que gira silenciosamente una tubería de dinero brillante para que su flujo caiga en un cubo privado en lugar del depósito previsto](../../assets/the-sushiswap-miso-insider-attack-02-malicious-commit.jpg)

Si eliminamos el vocabulario cripto, esto es un ataque clásico a la cadena de suministro de software — la misma categoría que un paquete npm envenenado o un servidor de compilación manipulado, solo que con el pago denominado en ETH.

La cadena de confianza era la siguiente. A un colaborador se le dio acceso de escritura al código que impulsaba las subastas en vivo. Usó ese acceso para subir un cambio que intercambiaba la dirección de destino. El pipeline de despliegue hizo lo que hacen los pipelines — tomó el último código y lo envió al front-end que los usuarios reales cargaban en sus navegadores. Esos usuarios conectaron sus billeteras, firmaron lo que el front-end les indicó que firmaran, y financiaron una subasta cuyo beneficiario había sido reescrito silenciosamente. El relato de Coinspeaker coincide con los demás: [un contratista anónimo con el alias de GH AristoK3 inyectó código malicioso en el front-end de Miso](https://www.coinspeaker.com/sushiswap-miso-attack-nft/#:~:text=an%20anonymous%20contractor%20with%20the%20GH%20handle%20AristoK3%20injected%20malicious%20code%20into%20the%20Miso%20front%20end).

Observa lo que *no* fue necesario. El atacante no necesitó encontrar un fallo en un contrato inteligente. No necesitó robar una clave ni comprometer un servidor desde el exterior. Necesitó exactamente una cosa: que se le confiara lo suficiente como para cambiar el código. El informe del incidente es preciso — [el front-end de Miso se convirtió en víctima de un ataque a la cadena de suministro](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=The%20Miso%20front%20end%20has%20become%20the%20victim%20of%20a%20supply%20chain%20attack) — llevado a cabo por un contratista anónimo con el alias de GitHub AristoK3, quien [inyectó código malicioso en el front-end de Miso](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=injected%20malicious%20code%20into%20the%20Miso%20front%20end).

Esto es lo que hace tan peligrosos los ataques internos a la cadena de suministro. Todas las defensas externas — firewalls, auditorías, multifirmas en la tesorería — asumen que la amenaza está afuera intentando entrar. Un atacante interno con derechos de commit ya ha pasado todo eso. El cambio malicioso aprovechó el propio proceso de despliegue legítimo y confiable del proyecto para llegar a producción. El pipeline no fue subvertido. Fue *utilizado*.

## Respuesta y recuperación: detectado, identificado y reembolsado

La respuesta de SushiSwap fue rápida, pública y confrontacional. Delong no investigó en silencio; nombró el alias de GitHub, nombró una identidad real sospechosa y fijó un plazo. Según CoinDesk, la advertencia fue explícita: si los fondos no eran devueltos, el exchange DeFi presentaría [una denuncia ante el FBI](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=file%20a%20complaint%20with%20the%20FBI).

Funcionó. El atacante dio marcha atrás. CryptoSlate informó que apenas un par de horas después de que el equipo hiciera pública la situación, [el hacker devolvió 865 ETH al contrato original de MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=the%20hacker%20returned%20865%20ETH%20to%20the%20original%20MISO%20contract) — ligeramente *más* que los 864,8 ETH que habían salido. The Crypto Times confirmó el destino: [la dirección multifirma de Sushiswap recibió de vuelta 865 ETH](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=the%20multisign%20address%20of%20Sushiswap%20got%20865%20ETH%20back). La propia actualización de estado de Delong fue tan escueta como la amenaza original. Decrypt recoge su confirmación de que, aproximadamente un día después, fue [Todos los fondos devueltos](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum#:~:text=All%20funds%20returned).

El final feliz merece un asterisco. El dinero regresó no porque la arquitectura detectara el robo, sino porque el atacante eligió devolverlo bajo la intensa luz de la exposición pública y una amenaza creíble de medidas legales. El seudónimo en un registro público funciona en ambas direcciones: permitió que el contratista actuara de forma anónima, pero también significó que el rastro on-chain de los fondos desviados era visible para todos, lo que es exactamente la palanca que convirtió la devolución del dinero en la opción de menor resistencia. La recuperación aquí fue una negociación, no una garantía. El próximo atacante interno podría no titubear.

## Lo que esto enseña sobre las cadenas de suministro de código y la confianza en el front-end

El incidente de MISO es pequeño en dólares para los estándares DeFi y grande en lecciones. Algunas que vale la pena extraer:

1. **El front-end es parte de tu perímetro de seguridad.** Los usuarios firman lo que la interfaz les indica. Si un atacante controla qué dirección muestra la interfaz, no necesita el contrato inteligente en absoluto. Auditar solo el código on-chain es auditar solo la mitad del sistema.
2. **El acceso de escritura es la verdadera superficie de ataque.** La criptografía más robusta del mundo no ayuda si la persona que puede editar el código decide hacerlo. "¿Quién puede cambiar esto y quién lo revisa antes de que se publique?" es un control de seguridad, no un detalle de proceso.
3. **La revisión de código obligatoria no es burocracia — es defensa.** Con un solo segundo par de ojos requerido sobre el commit que intercambió `auctionWallet` probablemente se habría detenido esto de inmediato. Los ataques a la cadena de suministro prosperan con cambios que nadie verifica de forma independiente antes del despliegue.
4. **Los colaboradores seudónimos elevan las apuestas.** La contribución abierta es una fortaleza, pero conceder acceso con impacto en el despliegue a una identidad anónima significa que estás confiando en código que no puedes atribuir completamente. La confianza debe escalar con la verificación, no con el entusiasmo.
5. **La recuperación es suerte, no arquitectura.** Los fondos regresaron gracias a la presión pública y un registro rastreable. Diseñar un sistema que *dependa* de la buena voluntad del atacante no es un diseño de seguridad en absoluto.

El hilo conductor: la integridad de *quién tiene permitido hacer un cambio* y *la verificación de que el cambio publicado es el que se aprobó* tiene tanto peso como cualquier clave criptográfica. La confianza en la cadena de suministro no es una preocupación blanda y cultural. Es el borde duro del sistema.

## El ángulo de Namefi

![Ilustración colorida de propiedad verificable y resistente a la manipulación — asegurada por un escudo verde, un token verde de Namefi y continuidad](../../assets/the-sushiswap-miso-insider-attack-03-namefi-angle.jpg)

MISO perdió dinero porque el *destino del valor* podía ser reescrito silenciosamente por alguien en quien el sistema confiaba, y nadie verificó el cambio antes de que entrara en producción. Ese modo de fallo no es exclusivo de las plataformas de lanzamiento DeFi. Tiene la misma forma que un dominio cuya propiedad o registros DNS pueden ser alterados silenciosamente por quien tenga el acceso correcto — una cuenta de registrador, un panel interno, un contratista con credenciales.

Un dominio es uno de los ajustes de "destino" más importantes de internet. Sus registros DNS deciden adónde van realmente tu tráfico, tu correo electrónico y tus usuarios. Si alguien puede cambiarlos — un atacante interno o una cuenta comprometida — sin un registro verificable de forma independiente y a prueba de manipulaciones de quién cambió qué, tienes el problema de MISO con ropa distinta: la cerradura está bien, pero el cartel de la puerta puede ser intercambiado.

[Namefi](https://namefi.io) aborda esto tratando la propiedad de dominios como un activo verificable y resistente a la manipulación, en lugar de una entrada en la cuenta privada de alguien. La propiedad tokenizada hace que el control sea auditable y transferible on-chain mientras se mantiene compatible con DNS — de modo que "quién es dueño de esto y quién tiene permitido cambiarlo" se convierte en un hecho que puedes verificar, no en una confianza que debes extender a ciegas. El contratista de MISO pudo reescribir una dirección de pago precisamente porque el sistema no tenía una respuesta aplicada e independientemente verificable a "¿está este cambio autorizado?" La lección que Namefi extrae de los ataques a la cadena de suministro es que la propiedad y el control deben ser demostrables por diseño, de modo que la peligrosa brecha entre *confiado* y *verificado* nunca se abra.

## Fuentes y lecturas adicionales

- CoinDesk — [$3M in Ether Stolen From SushiSwap's MISO Launchpad](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad)
- Decrypt — [SushiSwap's Token Launchpad Hacked for Over $3M in Ethereum](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum)
- CryptoSlate — [Hacker returns 865 ETH stolen from Sushi's token launch platform MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/)
- PYMNTS — [SushiSwap Crypto Platform Victimized by $3M Hack](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/)
- The Crypto Times — [Sushiswap's Miso Launchpad Loses $3 Million In An Attack](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/)
- Coinspeaker — [SushiSwap Launchpad Miso Suffers Attack with 864.8 ETH NFT Project Fund Carted Away](https://www.coinspeaker.com/sushiswap-miso-attack-nft/)
- CryptoBriefing — [Sushi's Initial Offering Launchpad Suffers $3M Exploit](https://cryptobriefing.com/sushiswaps-miso-token-launchpad-suffers-3m-exploit/)
- CryptoPotato — [Another DeFi Hack: $3M in ETH Stolen From SushiSwap's Token Platform](https://cryptopotato.com/another-defi-hack-3m-in-eth-stolen-from-sushiswaps-token-platform/)
- Quadriga Initiative — [SushiSwap MISO Jaypegs Automart case study](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php)
