---
title: 'El secuestro de DNS de Curve Finance: Cuando los "contratos auditados" no pudieron salvar la puerta principal'
date: '2026-06-17'
language: es
tags:
  - dominios
  - seguridad
  - dns
  - seguridad-de-dominios
authors:
  - namefiteam
draft: false
description: 'En agosto de 2022, los contratos inteligentes de Curve Finance quedaron intactos, pero los atacantes secuestraron el dominio curve.fi en su registrador, clonaron el sitio y vaciaron aproximadamente $570 mil dólares de los usuarios. Un análisis profundo sobre el ataque de DNS a un front-end de DeFi y lo que nos enseña sobre la seguridad de dominios.'
keywords:
  - secuestro dns curve finance
  - secuestro curve.fi
  - secuestro de dns defi
  - compromiso iwantmyname
  - compromiso de servidor de nombres
  - drenador de billeteras
  - ataque front-end defi
  - seguridad de dominios
  - seguridad dns
  - phishing cripto
  - ataque sitio web clonado
  - compromiso cuenta de registrador
  - domain mayday
---

Los contratos inteligentes estaban bien.

Eso es lo primero que hay que entender sobre lo que le ocurrió a Curve Finance el 9 de agosto de 2022, y es la parte que todavía inquieta a los ingenieros de seguridad años después. El código on-chain de Curve —el creador de mercado automatizado, auditado y probado en batalla que posee miles de millones en monedas estables— nunca fue tocado. Ningún error de reentrada. Ninguna manipulación de oráculos. Ningún exploit de préstamos flash. La blockchain hizo exactamente lo que se suponía que debía hacer.

Y los usuarios aun así perdieron aproximadamente **$570,000**.

El ataque no provino de los contratos. Provino del **dominio**. Alguien tomó el control de `curve.fi` a nivel de registrador, lo dirigió a un sitio web clonado conectado a un drenador de billeteras (wallet-drainer), y dejó que la propia reputación del protocolo hiciera el resto. Cada auditoría de seguridad que Curve había pasado alguna vez fue irrelevante, porque el atacante nunca tocó esa puerta. Entraron por la principal: la dirección web que los usuarios escriben sin pensar.

Este es el Episodio 13 de *Domain Mayday*. Es una historia sobre cómo la parte más segura de un sistema puede estar perfectamente a salvo mientras la parte en la que todos *confían sin verificar* —el nombre de dominio— se convierte silenciosamente en la superficie de ataque.

## Los "contratos auditados" no protegen la puerta principal

DeFi pasó años construyendo una cultura de seguridad de contratos. Las auditorías se convirtieron en un requisito indispensable. Las recompensas por encontrar errores (bug bounties) escalaron a millones. "Verificado en Etherscan" se convirtió en una señal de confianza. El modelo mental colectivo se endureció en algo como: *si los contratos están a salvo, el protocolo está a salvo.*

Pero un usuario casi nunca interactúa directamente con un contrato. Entran a un sitio web. Escriben `curve.fi`, su navegador resuelve ese nombre a una dirección IP, carga una página, y esa página le dice a su billetera qué firmar. Cada uno de esos pasos ocurre *antes* de que se ejecute una sola línea de código en Solidity auditado — y cada uno de ellos vive en una infraestructura que la auditoría nunca cubrió.

El nombre de dominio es el primer eslabón de esa cadena. También es el eslabón que la mayoría de los equipos tratan como algo que se configura y se olvida: lo registras una vez, apuntas el DNS, y no vuelves a pensar en ello. Como lo expresó una explicación tras el incidente, este tipo de ataque ["explota la capa de confianza" entre el usuario y la interfaz de una aplicación descentralizada](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) en lugar de vulnerar la blockchain del protocolo. Los contratos pueden ser impecables. Si un atacante controla hacia dónde *apunta* `curve.fi`, nada de eso importa.

## 9 de agosto de 2022: el secuestro

![Vivid colorful concept art of a storefront whose address sign is being swapped to redirect shoppers into an identical fake shop with a hidden trapdoor floor, warm and cool tones, surreal security metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-01-hijack.jpg)

En la tarde del 9 de agosto de 2022, el front-end principal de Curve dejó de ser de Curve.

El análisis posterior al incidente de CertiK fijó la cronología con precisión: ["Aproximadamente a las 4:20 PM EST del 9 de agosto de 2022, el registro DNS de Curve Finance fue comprometido y dirigido a un sitio malicioso clonado."](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Para cualquiera que visitara `curve.fi`, nada parecía estar mal. La página cargaba. El logotipo estaba allí. Los fondos (pools), la interfaz, los colores: todo estaba fielmente reproducido.

La diferencia era invisible y total: el sitio que cargaba en el navegador del usuario ya no era servido por Curve. Era un clon, alojado en la infraestructura del atacante, esperando a que alguien conectara una billetera.

El investigador de seguridad Lefteris Karapetsas describió la mecánica sin rodeos: los atacantes habían ["clonado el sitio, hecho que el DNS apuntara a su IP donde estaba desplegado el sitio clonado, y añadido solicitudes de aprobación a un contrato malicioso."](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) Una explicación posterior de Cointelegraph describió el mismo patrón: ["Los atacantes habían clonado el sitio web de Curve Finance e interferido con su configuración de DNS para enviar a los usuarios a una versión duplicada del sitio web."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Y luego esperaron.

## Lo que perdieron los usuarios

Cuando un usuario llegaba al clon e intentaba usarlo, la página le pedía a su billetera que hiciera algo que hace miles de veces al día en sitios DeFi legítimos: aprobar un token. Según CertiK, ["el atacante inyectó código malicioso en ese sitio que pedía a los usuarios que otorgaran aprobaciones de tokens a un contrato no verificado."](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Coingape describió la trampa en términos más sencillos: ["Los hackers lograron desplegar un contrato malicioso en la página de inicio, que una vez aprobado por la víctima vaciaría por completo las billeteras de los usuarios."](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)

Aprobar una asignación de token parece rutinario. Es el mismo clic que hacen los usuarios para realizar un intercambio (swap) en un exchange legítimo. Pero aquí el contrato que se aprobaba pertenecía al atacante — y una vez aprobado, podía transferir las monedas estables de la víctima.

La contabilidad on-chain fue específica. CertiK informó que ["en total, 7 usuarios se vieron afectados por el exploit, culminando en pérdidas de ~$612k,"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) con la cifra desglosada como ["$612,724.16 en USDC y DAI"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) que el hacker luego intercambió por ETH. rekt.news llegó a un número más redondo y ampliamente citado: ["Los fondos robados (340 ETH, o ~$575k en total)."](https://rekt.news/curve-finance-rekt) La mayor parte de la cobertura contemporánea cayó en la misma franja: Cryptopotato informó que [los hackers robaron alrededor de $570,000 en ETH](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/); CryptoDaily señaló que [el hacker había robado más de $573,000](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack). El total exacto varía un poco dependiendo de cuándo se tomó la instantánea y a qué precio estaba el ETH. La magnitud en sí no cambia: cifras medias o bajas de seis dígitos, tomadas de un puñado de usuarios, por un sitio que lucía exactamente como el que confiaban.

Y aquí está la parte sobre la que vale la pena reflexionar. Tronweekly lo capturó claramente: este ataque ["no tocó los contratos inteligentes de Ethereum de Curve ni ninguno de los $5.7 mil millones de activos almacenados en ellos."](https://www.tronweekly.com/curve-finance-dns-hijacking/) Cinco mil setecientos millones de dólares en activos del protocolo, completamente a salvo. Curve mismo, como señaló el mismo artículo, ["está ileso y no ha incurrido en pérdidas."](https://www.tronweekly.com/curve-finance-dns-hijacking/) El protocolo ganó. Los usuarios perdieron. Porque el ataque nunca estuvo dirigido al protocolo.

## Cómo sucedió: el dominio, no la cadena

![Vivid colorful concept art of a telephone switchboard operator secretly rerouting one glowing call cable to a counterfeit identical building, neon cables and circuits, surreal DNS rerouting metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-02-dns-compromise.jpg)

Entonces, ¿cómo logra un atacante que `curve.fi` resuelva hacia *su* servidor en lugar del de Curve?

Comencemos con lo que hace el DNS. Un nombre de dominio como `curve.fi` es una etiqueta amigable para los humanos. Las computadoras necesitan una dirección IP. El Sistema de Nombres de Dominio (DNS) es la capa de búsqueda que traduce uno en otro — la explicación de Cointelegraph lo compara con ["una guía telefónica"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) que ["convierte estos nombres de dominio fáciles de usar en las direcciones IP que requieren las computadoras para conectarse."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) El secuestro de DNS significa alterar esa búsqueda para que la guía telefónica dé el número equivocado — ["alterando cómo se resuelven las consultas DNS, redirigiendo a los usuarios a sitios maliciosos sin su conocimiento."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Crucialmente, no necesitas vulnerar la computadora del usuario para hacer esto. Cambias la respuesta autorizada en su origen: el **servidor de nombres** (nameserver) en el que se delega el dominio. Y esa fuente reside en el registrador del dominio.

El fundador de Curve, Michael Egorov, fue directo sobre dónde ocurrió el fallo. Según lo citado por rekt.news, ["el registrador dns iwantmyname tuvo sus ns comprometidos,"](https://rekt.news/curve-finance-rekt) y la interpretación del equipo fue que ["Curve cree que el servidor de nombres subyacente fue comprometido, en lugar de una vulnerabilidad a nivel de cuenta."](https://rekt.news/curve-finance-rekt) En otras palabras: no se trataba (hasta donde Curve pudo determinar) de una contraseña robada en la propia cuenta de registrador de Curve. Era un problema una capa más profunda — en la infraestructura de servidores de nombres que operaba el propio registrador. Posteriormente, Cointelegraph confirmó al registrador por su nombre, señalando que el proyecto ["estaba usando el mismo registrador, 'iwantmyname', en el momento del ataque."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Esa distinción importa enormemente para la lección. Un equipo puede aplicar una contraseña fuerte, habilitar la autenticación de dos factores y blindar perfectamente su propio inicio de sesión del registrador — y *aun así* perder su dominio si el servidor de nombres debajo de él está comprometido. El propietario del dominio no necesariamente cometió un error. La confianza que depositaron en la capa inferior simplemente se rompió. El planteamiento de Cointelegraph sobre cómo funcionan estos ataques generaliza el riesgo: ["Si el mapeo de un sitio cambia debido a credenciales robadas o a la vulnerabilidad de un registrador, los usuarios pueden ser redirigidos a servidores dañinos sin darse cuenta."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Una vez que el servidor de nombres respondió con la IP del atacante, el resto fue automático. A cada usuario que escribía `curve.fi` se le entregaba el clon en silencio. La guía telefónica había sido editada, y casi nadie revisa la guía telefónica.

## Respuesta y consecuencias

El equipo de Curve se movió rápido, y la respuesta es instructiva precisamente por lo que pudieron y no pudieron hacer.

Lo que *sí pudieron* hacer de inmediato fue advertir. El equipo fue claro con los usuarios: ["Por favor, no realicen ninguna aprobación ni intercambios. Estamos tratando de localizar el problema, pero por ahora, por su seguridad, no usen curve.fi ni curve.exchange."](https://www.tronweekly.com/curve-finance-dns-hijacking/) Redirigieron a los usuarios a una alternativa que aún estaba limpia — ["Por favor, usen https://curve.exchange por ahora hasta que la propagación de https://curve.fi vuelva a la normalidad"](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/) — porque `curve.exchange` funcionaba sobre una infraestructura diferente y no estaba envenenada.

Lo que *no pudieron* hacer al instante fue deshacer el daño ya hecho. Cambiaron el servidor de nombres, pero el DNS no se actualiza en todas partes al mismo tiempo. Como señaló rekt.news, ["El sitio espejo del hacker fue eliminado rápidamente, sin embargo, algunos servidores de nombres aún deben actualizarse."](https://rekt.news/curve-finance-rekt) Durante un margen de tiempo, incluso después de implementada la solución, las memorias caché (caches) de todo el mundo siguieron ofreciendo la respuesta antigua y maliciosa. Ese retraso de propagación es una propiedad inherente del DNS — y una ventaja intrínseca para el atacante.

Para los usuarios que ya habían aprobado el contrato malicioso, la única defensa era la revocación. El mensaje se repitió en todas partes: ["Si ha aprobado algún contrato en Curve en las últimas horas, por favor revoque de inmediato."](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) rekt.news publicó la dirección específica del drenador que los usuarios necesitaban revocar — `0x9eb5f8e83359bb5013f3d8eee60bdce5654e8881` — para que las víctimas pudieran cortar la asignación antes de que se robara más.

Los fondos robados se dispersaron a través de los canales habituales de lavado. CertiK rastreó el flujo — ["FixedFloat: 292 ETH, Tornado Cash: 27.7 ETH, Binance: 20 ETH"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) — y notó un giro oportuno: con Tornado Cash recién sancionado por la OFAC días antes, ["la reciente sanción a Tornado Cash por parte de la OFAC probablemente preocupó lo suficiente al hacker como para enviar la mayoría de los fondos robados a FixedFloat,"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) un exchange centralizado. Esa elección ayudó: rekt.news informó que de los fondos enviados a FixedFloat, [112 ETH fueron congelados](https://rekt.news/curve-finance-rekt). A las pocas horas, Curve confirmó que ["el problema se ha encontrado y revertido."](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)

## Lo que esto enseña sobre DNS para front-ends de DeFi

El incidente de Curve es una lección compacta sobre dónde reside la verdadera superficie de ataque en DeFi. Algunas conclusiones se aplican mucho más allá de Curve:

1. **Tu dominio es parte de tu perímetro de seguridad.** Es tentador tratar el dominio como infraestructura de marketing: una etiqueta, no un sistema. Pero el dominio es la primera instrucción que sigue el navegador de un usuario. Si es incorrecta, todo lo que viene después es incorrecto. Las auditorías que se detienen en los límites del contrato dejan desprotegido el eslabón de mayor confianza.

2. **La seguridad del registrador y del servidor de nombres está por encima de ti (upstream).** La higiene de la cuenta del propio Curve pudo haber estado bien; se creyó que el compromiso estuvo en la capa del servidor de nombres. Tú heredas la postura de seguridad de cada proveedor en tu cadena DNS. Elige registradores y hosts de DNS que admitan bloqueos de registrador (registrar locks), fuertes protecciones de cuenta e idealmente DNSSEC — y entiende que, incluso entonces, estás confiando en una capa que no controlas del todo.

3. **Los usuarios no pueden ver el DNS.** El clon parecía idéntico porque el *nombre* era idéntico. El candado era verde; la URL era correcta. Nada de lo que un usuario cauteloso revisa normalmente lo habría alertado. Esto es lo que hace que el secuestro de DNS sea tan efectivo incluso contra audiencias sofisticadas: el engaño ocurre por debajo de la capa que inspeccionan los humanos.

4. **Ten una alternativa limpia.** La tabla de salvación de Curve fue `curve.exchange` en una infraestructura separada. Una segunda ruta de front-end —un dominio diferente, un proveedor DNS diferente, un espejo basado en IPFS o ENS— te da un lugar a donde enviar a los usuarios cuando tu nombre principal está envenenado.

5. **Las aprobaciones de tokens son la carga útil (payload).** Todo ataque de front-end de esta familia termina de la misma manera: una aprobación de apariencia rutinaria a un contrato hostil. Las billeteras, las interfaces y los usuarios necesitan tratar las solicitudes de aprobación en una página recién cargada como la acción de alto riesgo que realmente son.

## El enfoque de Namefi

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-curve-finance-dns-hijack-03-namefi-angle.jpg)

El secuestro de Curve es, en su raíz, una cuestión de **quién controla el nombre** — y con qué transparencia se puede verificar, mantener y recuperar ese control.

En el modelo tradicional, el control de un dominio es un paquete frágil: una cuenta de registrador, un conjunto de registros de servidor de nombres, y una cadena de proveedores en los que tienes que confiar silenciosamente. Cuando cualquier eslabón de esa cadena se ve comprometido —como se creía que lo estaba el servidor de nombres de iwantmyname— el propietario legítimo puede perder el control efectivo de su propio nombre sin haber cometido jamás un error, y sin un registro obvio y a prueba de manipulaciones de *qué cambió y cuándo*.

[Namefi](https://namefi.io) está construido sobre la idea de que los dominios deberían comportarse como activos nativos de internet — que la propiedad y el control pueden hacerse verificables, auditables y resistentes a la manipulación mientras se mantienen compatibles con el DNS. La lección más profunda de Curve no es "DeFi es inseguro". Es que **la capa de dominio es una infraestructura de seguridad fundamental**, y durante años ha sido tratada como simple decoración. Ya sea que manejes un protocolo DeFi, una tienda en línea o un blog, el nombre que escriben tus usuarios es una promesa — y la integridad de esa promesa es solo tan fuerte como la superficie de control detrás de ella.

Los contratos de Curve sostuvieron cinco mil setecientos millones de dólares sin un rasguño. El dominio entregó medio millón en una tarde. Esa brecha es toda la historia.

## Fuentes y lectura adicional

- CertiK — [Análisis del incidente de hackeo a Curve Finance](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)
- rekt.news — [Curve Finance — REKT](https://rekt.news/curve-finance-rekt)
- Cointelegraph (vía TradingView) — [¿Qué es el secuestro de DNS? Cómo derribó el sitio web de Curve Finance](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)
- Cryptopotato — [Curve Finance emite advertencia sobre front-end comprometido en medio de robo de $570K](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)
- Coingape — [DNS de Curve Finance secuestrado, atacantes robaron $570K de billeteras de usuarios](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)
- Tronweekly — [Hackers de Curve Finance saquean $570K vía secuestro de DNS](https://www.tronweekly.com/curve-finance-dns-hijacking/)
- CryptoDaily — [Curve Finance pide a los usuarios que revoquen contratos recientes tras hackeo de DNS](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)