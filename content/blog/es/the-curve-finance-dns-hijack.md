---
title: 'El Secuestro de DNS de Curve Finance: Cuando los "Contratos Auditados" No Pudieron Salvar la Puerta Principal'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'En agosto de 2022, los contratos inteligentes de Curve Finance estaban intactos — pero los atacantes secuestraron el dominio curve.fi en su registrador, clonaron el sitio y drenaron aproximadamente $570K de los usuarios. Un análisis profundo del ataque DNS a una interfaz DeFi, y lo que enseña sobre seguridad de dominios.'
keywords: ['secuestro dns curve finance', 'hijack curve.fi', 'dns hijacking defi', 'compromiso iwantmyname', 'compromiso nameserver', 'wallet drainer', 'ataque front-end defi', 'seguridad de dominios', 'seguridad dns', 'phishing cripto', 'ataque sitio clonado', 'compromiso cuenta registrador', 'domain mayday']
---

Los contratos inteligentes estaban bien.

Ese es el primer punto que hay que entender sobre lo que le ocurrió a Curve Finance el 9 de agosto de 2022, y es el dato que sigue inquietando a los ingenieros de seguridad años después. El código on-chain de Curve — el market maker automatizado auditado y battle-tested que custodiaba miles de millones en stablecoins — nunca fue tocado. Sin bug de reentrancia. Sin manipulación de oracle. Sin exploit de flash loan. La blockchain hizo exactamente lo que se suponía que debía hacer.

Y los usuarios aún perdieron aproximadamente **$570,000**.

El ataque no llegó a través de los contratos. Llegó a través del **dominio**. Alguien tomó el control de `curve.fi` a nivel del registrador, lo apuntó a un sitio web clonado conectado a un drenador de billeteras, y dejó que la propia reputación del protocolo hiciera el resto. Cada auditoría de seguridad que Curve había superado era irrelevante, porque el atacante nunca tocó esa puerta. Entró por el frente — la dirección web que los usuarios escribían sin pensarlo.

Este es el Episodio 13 de *Domain Mayday*. Es una historia sobre cómo la parte más segura de un sistema puede estar perfectamente a salvo mientras la parte en la que todos *confían sin verificar* — el nombre de dominio — se convierte silenciosamente en la superficie de ataque.

## Los "contratos auditados" no protegen la puerta principal

DeFi pasó años construyendo una cultura de seguridad en contratos. Las auditorías se convirtieron en un requisito mínimo. Las recompensas por bugs escalaron a millones. "Verificado en Etherscan" se convirtió en una señal de confianza. El modelo mental colectivo se solidificó en algo como: *si los contratos son seguros, el protocolo es seguro.*

Pero un usuario casi nunca interactúa con un contrato directamente. Va a un sitio web. Escribe `curve.fi`, su navegador resuelve ese nombre a una dirección IP, carga una página, y esa página le dice a su billetera qué firmar. Cada uno de esos pasos ocurre *antes* de que se ejecute una sola línea de Solidity auditado — y cada uno de ellos vive en infraestructura que la auditoría nunca cubrió.

El nombre de dominio es el primer eslabón de esa cadena. También es el eslabón que la mayoría de los equipos tratan como algo que se configura una vez y se olvida: registrarlo, apuntar el DNS, y nunca más pensar en ello. Como señaló una explicación posterior al incidente, este tipo de ataque ["explota la capa de confianza"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) entre el usuario y la interfaz de una app descentralizada en lugar de vulnerar la blockchain del protocolo. Los contratos pueden ser impecables. Si un atacante controla a dónde *apunta* `curve.fi`, nada de eso importa.

## 9 de agosto de 2022: el secuestro

![Arte conceptual colorido y vívido de una fachada comercial cuyo letrero de dirección está siendo reemplazado para redirigir a los clientes a una tienda falsa idéntica con un suelo con trampilla oculta, tonos cálidos y fríos, metáfora de seguridad surrealista, sin logotipos de marca](../../assets/the-curve-finance-dns-hijack-01-hijack.jpg)

En la tarde del 9 de agosto de 2022, el front-end principal de Curve dejó de ser de Curve.

El análisis post-incidente de CertiK estableció el cronograma con precisión: ["A las aproximadamente 4:20 PM EST del 9 de agosto de 2022, el registro DNS de Curve Finance fue comprometido y apuntado a un sitio malicioso clonado."](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Para cualquiera que visitara `curve.fi`, nada parecía incorrecto. La página se cargaba. El logo estaba ahí. Los pools, la interfaz, los colores — todo fielmente reproducido.

La diferencia era invisible y total: el sitio que se cargaba en el navegador del usuario ya no era servido por Curve. Era un clon, alojado en la infraestructura del atacante, esperando a que alguien conectara una billetera.

El investigador de seguridad Lefteris Karapetsas describió la mecánica sin rodeos — los atacantes habían ["clonado el sitio, hecho que el DNS apuntara a su IP donde está desplegado el sitio clonado, y añadido solicitudes de aprobación a un contrato malicioso."](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) La explicación posterior de Cointelegraph describió el mismo patrón: ["Los atacantes habían clonado el sitio web de Curve Finance e interferido con su configuración DNS para enviar a los usuarios a una versión duplicada del sitio web."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Luego esperaron.

## Lo que perdieron los usuarios

Cuando un usuario aterrizaba en el clon e intentaba usarlo, la página le pedía a su billetera que hiciera algo que hace miles de veces al día en sitios DeFi legítimos: aprobar un token. Según CertiK, ["el atacante inyectó código malicioso en ese sitio que pedía a los usuarios dar aprobaciones de tokens a un contrato no verificado."](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Coingape describió la trampa en términos más sencillos: ["Los hackers lograron desplegar un contrato malicioso en la página de inicio, que al ser aprobado por la víctima drenaba completamente las billeteras de los usuarios."](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)

Aprobar una allowance de token parece algo rutinario. Es el mismo clic que hacen los usuarios para intercambiar en un exchange legítimo. Pero aquí el contrato que se aprobaba pertenecía al atacante — y una vez aprobado, podía mover las stablecoins de la víctima.

La contabilidad on-chain fue específica. CertiK informó que ["en total, 7 usuarios fueron afectados por el exploit con un total de aproximadamente $612K en pérdidas,"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) con la cifra desglosada como ["$612,724.16 en USDC y DAI"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) que el hacker luego intercambió por ETH. rekt.news optó por un número más redondo y ampliamente citado: ["Los fondos robados (340 ETH, o aproximadamente $575K, en total)."](https://rekt.news/curve-finance-rekt) La mayoría de la cobertura contemporánea aterrizó en la misma banda — Cryptopotato informó que [los hackers robaron alrededor de $570,000 en ETH](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/); CryptoDaily señaló que [el hacker había robado más de $573,000](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack). El total exacto varía un poco dependiendo de cuándo se tomó la instantánea y el precio del ETH. La forma del robo no: seis cifras bajas-medias, tomadas de un puñado de usuarios, por un sitio que se veía exactamente como el que confiaban.

Y aquí está la parte que vale la pena considerar. Tronweekly lo capturó claramente: este ataque ["no tocó los contratos inteligentes de Ethereum de Curve ni ninguno de los $5.7B de activos almacenados en ellos."](https://www.tronweekly.com/curve-finance-dns-hijacking/) Cinco punto siete mil millones de dólares en activos del protocolo, completamente seguros. El propio Curve, como señaló el mismo artículo, ["no sufrió daños y no incurrió en ninguna pérdida."](https://www.tronweekly.com/curve-finance-dns-hijacking/) El protocolo ganó. Los usuarios perdieron. Porque el ataque nunca estuvo dirigido al protocolo.

## Cómo ocurrió: el dominio, no la cadena

![Arte conceptual colorido y vívido de un operador de centralita telefónica redirigiendo secretamente un cable de llamada luminoso hacia un edificio falsificado idéntico, cables neón y circuitos, metáfora surrealista de redireccionamiento DNS, sin logotipos de marca](../../assets/the-curve-finance-dns-hijack-02-dns-compromise.jpg)

¿Cómo logra un atacante que `curve.fi` resuelva a *su* servidor en lugar del de Curve?

Empecemos por lo que hace el DNS. Un nombre de dominio como `curve.fi` es una etiqueta amigable para los humanos. Los ordenadores necesitan una dirección IP. El Sistema de Nombres de Dominio es la capa de búsqueda que traduce uno en el otro — la explicación de Cointelegraph lo compara con ["una guía telefónica"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) que ["convierte estos nombres de dominio amigables para el usuario en las direcciones IP que los ordenadores necesitan para conectarse."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) El secuestro DNS significa manipular esa búsqueda para que la guía telefónica dé el número equivocado — ["alterando cómo se resuelven las consultas DNS, redirigiendo a los usuarios a sitios maliciosos sin su conocimiento."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Fundamentalmente, no es necesario vulnerar el ordenador del usuario para hacer esto. Se cambia la respuesta autoritativa en su origen — el **nameserver** al que el dominio delega. Y ese origen reside en el registrador del dominio.

El fundador de Curve, Michael Egorov, fue directo sobre dónde vivía el fallo. Según cita de rekt.news, ["el registrador de dns iwantmyname tuvo su ns comprometido,"](https://rekt.news/curve-finance-rekt) y la lectura del equipo fue que ["Curve cree que el nameserver subyacente fue comprometido, en lugar de una vulnerabilidad a nivel de cuenta."](https://rekt.news/curve-finance-rekt) En otras palabras: esto no fue (hasta donde Curve pudo determinar) una contraseña robada de la cuenta propia de Curve en el registrador. Fue un problema una capa más abajo — en la infraestructura de nameserver que el propio registrador operaba. La explicación posterior de Cointelegraph confirmó el registrador por nombre, señalando que el proyecto ["estaba usando el mismo registrador, 'iwantmyname,' en el momento del ataque anterior."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Esa distinción importa enormemente para la lección. Un equipo puede aplicar una contraseña fuerte, habilitar la autenticación de dos factores y proteger perfectamente su propio inicio de sesión en el registrador — y *aun así* perder su dominio si el nameserver que está por debajo es comprometido. El propietario del dominio no necesariamente cometió un error. La confianza que depositó en la capa inferior simplemente fue traicionada. El marco de Cointelegraph sobre cómo funcionan estos ataques generaliza el riesgo: ["Si el mapeo de un sitio cambia debido a credenciales robadas o una vulnerabilidad del registrador, los usuarios pueden ser redirigidos a servidores dañinos sin darse cuenta."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Una vez que el nameserver respondió con la IP del atacante, el resto fue automático. Cada usuario que escribía `curve.fi` recibía silenciosamente el clon. La guía telefónica había sido editada, y casi nadie revisa la guía telefónica.

## Respuesta y secuelas

El equipo de Curve actuó rápido, y la respuesta es instructiva precisamente por lo que pudieron y no pudieron hacer.

Lo que *pudieron* hacer de inmediato fue advertir. El equipo les dijo a los usuarios claramente: ["Por favor, no realicen ninguna aprobación ni intercambio. Estamos tratando de localizar el problema, pero por ahora, por su seguridad, no usen curve.fi ni curve.exchange."](https://www.tronweekly.com/curve-finance-dns-hijacking/) Dirigieron a los usuarios al alternativo aún limpio — ["Por favor usen https://curve.exchange por ahora hasta que la propagación de https://curve.fi vuelva a la normalidad"](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/) — porque `curve.exchange` funcionaba con infraestructura diferente y no estaba envenenado.

Lo que *no pudieron* hacer al instante fue deshacer el daño hecho. Cambiaron el nameserver, pero el DNS no se actualiza en todas partes al mismo tiempo. Como señaló rekt.news, ["El sitio espejo del hacker fue eliminado rápidamente, sin embargo, algunos nameservers aún estaban por actualizar."](https://rekt.news/curve-finance-rekt) Durante una ventana de tiempo, incluso después de aplicar la corrección, los cachés de todo el mundo seguían sirviendo la respuesta antigua y maliciosa. Ese retardo de propagación es una propiedad intrínseca del DNS — y una ventaja intrínseca para el atacante.

Para los usuarios que ya habían aprobado el contrato malicioso, la única defensa era la revocación. El mensaje se repitió en todos lados: ["Si han aprobado contratos en Curve en las últimas horas, por favor revóquenlos de inmediato."](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) rekt.news publicó la dirección específica del drenador que los usuarios necesitaban revocar — `0x9eb5f8e83359bb5013f3d8eee60bdce5654e8881` — para que las víctimas pudieran cortar la allowance antes de que se tomara más.

Los fondos robados se dispersaron por los canales de lavado habituales. CertiK rastreó el flujo — ["FixedFloat: 292 ETH, Tornado Cash: 27.7 ETH, Binance: 20 ETH"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) — y señaló un giro del destino: con Tornado Cash recién sancionado por la OFAC días antes, ["la reciente sanción de Tornado Cash por parte de la OFAC probablemente preocupó lo suficiente al hacker como para enviar la mayoría de los fondos robados a FixedFloat,"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) un exchange centralizado. Esa elección ayudó: rekt.news informó que de los fondos enviados a FixedFloat, [112 ETH fueron congelados](https://rekt.news/curve-finance-rekt). En pocas horas, Curve confirmó ["que el problema ha sido encontrado y revertido."](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)

## Lo que esto enseña sobre DNS para front-ends DeFi

El incidente de Curve es una lección compacta sobre dónde vive la verdadera superficie de ataque de DeFi. Algunos aprendizajes se generalizan bien más allá de Curve:

1. **Tu dominio forma parte de tu perímetro de seguridad.** Es tentador tratar el dominio como infraestructura de marketing — una etiqueta, no un sistema. Pero el dominio es la primera instrucción que sigue el navegador de un usuario. Si está mal, todo lo que viene después está mal. Las auditorías que se detienen en el límite del contrato dejan sin cubrir el eslabón más confiable.

2. **La seguridad del registrador y del nameserver está por encima de ti.** La higiene de cuenta propia de Curve puede haber sido correcta; se cree que el compromiso fue a nivel del nameserver. Heredas la postura de seguridad de cada proveedor en tu cadena DNS. Elige registradores y hosts DNS que soporten bloqueos de registrador, fuertes protecciones de cuenta e idealmente DNSSEC — y entiende que incluso así, estás confiando en una capa que no controlas completamente.

3. **Los usuarios no pueden ver el DNS.** El clon se veía idéntico porque el *nombre* era idéntico. El candado era verde; la URL era correcta. Nada de lo que un usuario cuidadoso normalmente verifica lo habría detectado. Esto es lo que hace al secuestro DNS tan efectivo incluso contra audiencias sofisticadas — el engaño ocurre por debajo de la capa que los humanos inspeccionan.

4. **Ten un fallback limpio.** La tabla de salvación de Curve fue `curve.exchange` en infraestructura separada. Una segunda ruta de front-end — un dominio diferente, un proveedor DNS diferente, un espejo basado en IPFS o ENS — te da un lugar al que enviar a los usuarios cuando tu nombre principal está envenenado.

5. **Las aprobaciones de tokens son la carga útil.** Todos los ataques de front-end de esta familia terminan de la misma manera: una aprobación de aspecto rutinario a un contrato hostil. Las billeteras, las interfaces y los usuarios necesitan tratar las solicitudes de aprobación en una página recién cargada como la acción de alto riesgo que son.

## El ángulo de Namefi

![Ilustración colorida de propiedad de dominio verificable y resistente a manipulaciones — una tarjeta de dominio asegurada por un escudo verde, un token verde de Namefi y continuidad DNS](../../assets/the-curve-finance-dns-hijack-03-namefi-angle.jpg)

El secuestro de Curve es, en su esencia, una cuestión de **quién controla el nombre** — y con qué claridad ese control puede verificarse, mantenerse y recuperarse.

En el modelo tradicional, el control de un dominio es un paquete frágil: una cuenta de registrador, un conjunto de registros de nameserver y una cadena de proveedores en los que hay que confiar silenciosamente. Cuando cualquier eslabón de esa cadena se compromete — como se creía que ocurrió con el nameserver de iwantmyname — el propietario legítimo puede perder el control efectivo de su propio nombre sin haber cometido ningún error, y sin un registro obvio e inviolable de *qué cambió y cuándo*.

[Namefi](https://namefi.io) está construido alrededor de la idea de que los dominios deben comportarse como activos nativos de internet — que la propiedad y el control pueden hacerse verificables, auditables y resistentes a manipulaciones mientras permanecen compatibles con el DNS. La lección más profunda de Curve no es "DeFi es inseguro." Es que **la capa de dominio es infraestructura de seguridad fundamental**, y durante años ha sido tratada como decoración. Tanto si gestionas un protocolo DeFi, una tienda o un blog, el nombre que escriben tus usuarios es una promesa — y la integridad de esa promesa es tan fuerte como la superficie de control que la respalda.

Los contratos de Curve custodiaron cinco punto siete mil millones de dólares sin un rasguño. El dominio cedió medio millón en una tarde. Esa brecha es toda la historia.

## Fuentes y lectura adicional

- CertiK — [Curve Finance Hack Incident Analysis](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)
- rekt.news — [Curve Finance — REKT](https://rekt.news/curve-finance-rekt)
- Cointelegraph (vía TradingView) — [What is DNS hijacking? How it took down Curve Finance's website](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)
- Cryptopotato — [Curve Finance Issues Warning About Compromised Front End Amid $570K Theft](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)
- Coingape — [Curve Finance DNS Hijacked, Attackers Stole $570K from User Wallets](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)
- Tronweekly — [Curve Finance's Hackers Loot $570K Via DNS Hijacking](https://www.tronweekly.com/curve-finance-dns-hijacking/)
- CryptoDaily — [Curve Finance Asks Users To Revoke Recent Contracts After DNS Hack](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)
