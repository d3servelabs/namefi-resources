---
title: 'El ataque a Dyn DNS: Cuando una botnet Mirai de cámaras hackeadas derribó la mitad de internet'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'El 21 de octubre de 2016, un ataque DDoS impulsado por la botnet de IoT Mirai golpeó al proveedor de DNS Dyn en tres oleadas, dejando fuera de línea a Twitter, Netflix, Reddit, Spotify, GitHub, Airbnb y PayPal durante horas; un caso de estudio de "Domain Mayday" sobre la concentración de proveedores de DNS.'
keywords: ['ataque dyn dns', 'botnet mirai', 'ddos 21 octubre 2016', 'ataque ddos dns', 'botnet iot', 'caída de proveedor dns', 'seguridad de dominios', 'dns único punto de fallo', 'dyn ddos 2016', 'malware mirai', 'caída de internet 2016', 'redundancia dns', 'cámaras iot hackeadas']
---

Durante unas horas, un viernes de octubre de 2016, internet olvidó cómo encontrarse a sí mismo.

Twitter cargaba una página en blanco. Netflix se quedaba cargando y se rendía. Reddit, Spotify, GitHub, Airbnb, PayPal: todos ahí, todos en línea, todos funcionando perfectamente en sus propios servidores y todos completamente inaccesibles. Nada había sido hackeado. No se habían robado datos. Los sitios web estaban exactamente donde siempre habían estado. Lo que se rompió fue la parte de internet que *te dice dónde están las cosas*.

El ataque no golpeó a Twitter ni a Netflix. Golpeó a una empresa de la que la mayoría de sus usuarios nunca había oído hablar: **Dyn**, una firma de New Hampshire que gestionaba el DNS —la libreta de direcciones de internet— para una gran parte de la web moderna. Y el arma no fue una granja de servidores o el arsenal de un estado-nación. Fue un enjambre de monitores de bebés, cámaras web y enrutadores domésticos hackeados: dispositivos domésticos comunes, reclutados silenciosamente en un ejército llamado **Mirai**.

Este es **Domain Mayday EP08**: el día en que cámaras inteligentes inseguras derribaron la guía telefónica de internet.

## DNS: la guía telefónica de internet, y el lugar de Dyn en ella

Cada vez que escribes un nombre de dominio, tu computadora tiene que traducirlo a una dirección IP numérica antes de poder conectarse a algo. Esa traducción es trabajo del DNS, el Sistema de Nombres de Dominio (Domain Name System). Es la capa de búsqueda entre el nombre amigable para humanos y la máquina a la que apunta el nombre.

Dyn era uno de los grandes proveedores administrados de ese servicio de búsqueda. Cuando un sitio externalizaba su DNS a Dyn, los servidores de nombres de Dyn se convertían en la fuente autorizada para responder "¿dónde vive este dominio?". The Register expuso claramente la dependencia durante el ataque: al dejar a Dyn fuera de línea mediante un bombardeo, los resolutores públicos de DNS operados por Google y los ISP fueron [incapaces de contactar a Dyn para buscar nombres de host para los internautas, impidiendo que las personas accedieran a los sitios que usaban Dyn para el DNS](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames).

Esa es la silenciosa fragilidad en el centro de esta historia. Un sitio web puede ser impecable (servidores redundantes, tiempo de actividad perfecto, ingenieros de clase mundial) y aun así desaparecer de internet si el único proveedor que responde "¿dónde está?" se apaga. Como resumió más tarde CyLab de la Universidad Carnegie Mellon, los dominios afectados dependían [críticamente de Dyn, un DNS de terceros. En otras palabras, dependían únicamente de Dyn, por lo que cuando Dyn cayó, ellos también cayeron](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn).

## 21 de octubre de 2016: el ataque llegó en oleadas

![Arte conceptual vívido y colorido de un maremoto de tráfico basura brillante estrellándose sobre un gigantesco panel de control de guía telefónica iluminado, las luces del directorio parpadeando y apagándose a través de un mapa oscuro](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

El asalto comenzó en la mañana del viernes 21 de octubre de 2016 y no llegó como un solo golpe. Se produjo en distintas oleadas a lo largo del día.

El registro del incidente en Wikipedia enumera [tres ataques de denegación de servicio distribuido consecutivos](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks) contra Dyn, comenzando alrededor de las 11:10 UTC. La mecánica fue un ataque de denegación de servicio distribuido de manual: el [ataque DDoS se logró a través de numerosas solicitudes de búsqueda DNS procedentes de decenas de millones de direcciones IP](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses), ahogando a los servidores de nombres de Dyn en tanto tráfico basura que las búsquedas legítimas no podían pasar.

Las oleadas son lo que lo hizo sentir implacable. The Register, que lo cubría en directo, describió el momento en que Dyn parecía recuperarse, y luego no lo hizo: [después de dos horas del maremoto inicial de tráfico basura, Dyn anunció que había mitigado el asalto y que el servicio volvía a la normalidad. Pero el alivio duró poco: solo una hora después, el ataque se reanudó](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave). Lo que parecía el final era solo la pausa entre rondas.

En volumen bruto, el ataque fue enorme para su época: uno de los mayores eventos DDoS vistos hasta ese momento, y The Register caracterizó el pico como [más de 1TBps](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps). (La propia Dyn advirtió que una "tormenta de reintentos" de tráfico legítimo infló algunas estimaciones iniciales, un punto al que volveremos más adelante).

## Qué sitios se apagaron y cómo se sintió

Cuando los servidores de nombres de Dyn no pudieron responder, el fallo se propagó hacia todos los que dependían de ellos. Este no era un rincón oscuro de la web. Era la portada de la internet de consumo.

El informe en directo de The Register nombró directamente a algunas de las víctimas: un ataque extraordinario y concentrado contra Dyn que continuó [interrumpiendo los servicios de internet de cientos de empresas, incluyendo gigantes en línea como Twitter, Amazon, Airbnb, Spotify y otros](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies). La lista de servicios afectados en Wikipedia se lee como un quién es quién de los sitios más grandes de la época: [Airbnb, Amazon.com, CNN, GitHub, Netflix, PayPal, Reddit, Spotify, Twitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb), y decenas más.

Brian Krebs, cuyo propio sitio había sido atacado por el mismo malware semanas antes, describió la experiencia del consumidor a medida que el [ataque comenzó a crear problemas para que los usuarios de Internet accedieran a una variedad de sitios, incluyendo Twitter, Amazon, Tumblr, Reddit, Spotify y Netflix](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter). Para los usuarios comunes, no había ningún error que tuviera sentido. Los sitios simplemente no cargaban: primero a lo largo de la costa este de los EE. UU., extendiéndose luego a medida que golpeaban las oleadas posteriores, llegando a usuarios de todo Estados Unidos y Europa.

## Cómo sucedió: un ejército de dispositivos inteligentes inseguros

![Arte conceptual vívido y colorido de miles de pequeñas y sonrientes cámaras inteligentes, tostadoras y monitores de bebés hackeados que pululan como insectos brillantes hacia una única y sobrecargada torre de directorio](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

Aquí está la parte que hizo del ataque a Dyn un punto de inflexión: la potencia de fuego no provino de computadoras. Provino de *cosas*.

Mirai es un malware que busca dispositivos de la Internet de las Cosas (IoT) —cámaras, enrutadores, DVRs— y los secuestra. Funciona explotando la debilidad más perezosa del hardware de consumo: la contraseña predeterminada con la que se envió el dispositivo. Como lo describió The Register, Mirai se propaga por la web, haciendo crecer sus filas de zombis obedientes, [iniciando sesión en dispositivos mediante sus contraseñas predeterminadas de fábrica a través de Telnet y SSH](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords). Krebs describió el mecanismo con la misma crudeza: Mirai [rastrea la web en busca de dispositivos IoT protegidos con poco más que nombres de usuario y contraseñas predeterminados de fábrica, y luego los alista en ataques](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices).

Los dispositivos en el corazón del ataque a Dyn fueron en su mayoría cámaras web y DVRs baratos. Krebs rastreó la botnet [principalmente a grabadoras de video digital (DVRs) y cámaras IP comprometidas fabricadas por una empresa china de alta tecnología llamada XiongMai Technologies](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders): dispositivos cuyas credenciales predeterminadas, en muchos casos, [un usuario no puede cambiar de manera factible](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password) porque la contraseña estaba codificada en el firmware.

Dos factores convirtieron a Mirai de una molestia en una catástrofe. Primero, el autor del malware había, [a finales de septiembre de 2016, publicado su código fuente, permitiendo efectivamente a cualquiera construir su propio ejército de ataque](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it). Segundo, la población de dispositivos vulnerables era inmensa. Dyn confirmó la firma del ataque: la empresa pudo [confirmar que un volumen significativo de tráfico de ataque se originó a partir de botnets basadas en Mirai](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai), y Wikipedia describe la botnet como un enjambre de [dispositivos conectados a Internet —como impresoras, cámaras IP, puertas de enlace residenciales y monitores de bebés— que habían sido infectados con el malware Mirai](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors).

## Las secuelas: contando el enjambre y los perpetradores

Cuando el polvo se asentó, incluso la pregunta básica de *qué tan grande fue* resultó difícil de responder. El propio análisis posterior al incidente de Dyn, a través del vicepresidente ejecutivo Scott Hilton, estimó la botnet en [hasta 100.000 puntos finales maliciosos](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints): enorme, pero menor que las "decenas de millones de IPs" que algunas cifras iniciales sugerían. La discrepancia provino de un bucle de retroalimentación: los ataques maliciosos se originaron en al menos una botnet, [y la tormenta de reintentos proporcionó un falso indicador de un conjunto de puntos finales significativamente mayor de lo que ahora sabemos que era](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20storm%20providing%20a%20false%20indicator). En otras palabras, el propio comportamiento automático de "volver a intentar" de internet amplificó el caos.

Las consecuencias legales agregaron un giro. Los tres jóvenes detrás de Mirai (Paras Jha, Josiah White y Dalton Norman) finalmente [se declararon culpables de su papel en la creación, operación y venta de acceso a la "botnet Mirai"](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating). Pero para la época del ataque a Dyn, Jha ya había publicado el código fuente abiertamente, y los fiscales y periodistas han tenido el cuidado de señalar que los atacantes de Dyn no fueron necesariamente el trío original. Como informó CyberScoop, [aún no está claro, por ejemplo, quién estuvo detrás del ataque más sonado vinculado a Mirai contra la empresa de gestión de rendimiento de internet Dyn](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind). Una vez que el arma fue de código abierto, cualquiera podía apretar el gatillo.

Para Dyn, el daño comercial fue real: en los meses siguientes, miles de dominios trasladaron su DNS a otra parte, una costosa lección de confianza del cliente después de un solo mal día.

## Lo que esto nos enseña sobre la concentración de proveedores de DNS

El ataque a Dyn es recordado como una historia sobre la seguridad del IoT, y lo es. Pero su lección más profunda trata sobre la *arquitectura*: el peligro de enrutar demasiada parte de internet a través de un solo cuello de botella.

Todos los sitios que se apagaron el 21 de octubre habían tomado la misma decisión, de apariencia razonable: externalizar el DNS a un único proveedor excelente. Individualmente, era inteligente. Colectivamente, significaba que eliminar a una sola empresa podía borrar de golpe una fracción significativa de la web. El veredicto de CyLab fue que las lecciones del ataque [solo han sido implementadas por un puñado de sitios web que se vieron directamente afectados](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful), incluso años después.

La respuesta defensiva es la redundancia: distribuir el DNS autoritativo en más de un proveedor para que ninguna interrupción única sea fatal. Dos años después de Dyn, The Register descubrió que esto seguía siendo raro y doloroso: Cricket Liu de Infoblox señaló que [no se ha vuelto más fácil usar múltiples proveedores de DNS autoritativos, por ejemplo (digamos Dyn más Verisign o Neustar). Poder usar múltiples proveedores marcaría una gran diferencia](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers). Las conclusiones para cualquiera que dependa de un dominio:

1. **Un dominio tiene más puntos de falla que su registrador.** El proveedor que responde "¿a dónde apunta este nombre?" soporta tanta carga como los servidores que hay detrás de él.
2. **Un DNS de proveedor único es un punto único de falla.** Un excelente tiempo de actividad en condiciones normales no dice nada sobre el comportamiento bajo una inundación de 1 Tbps.
3. **La concentración es conveniente y frágil.** La misma eficiencia que hace atractivo a un proveedor hace que su caída se sienta de forma generalizada.
4. **La resiliencia es una propiedad de la titularidad, no solo del alojamiento.** Cuando algo se rompe, necesitas controlar la configuración de tu dominio con la suficiente claridad y rapidez como para redirigirlo en poco tiempo.

## El enfoque de Namefi

![Ilustración colorida de la propiedad verificable y resiliente de dominios: una tarjeta de dominio asegurada por un escudo verde, un token verde de Namefi y continuidad del DNS](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

El ataque a Dyn no robó un solo dominio. No falsificó una transferencia ni secuestró la cuenta de un registrador. Y, sin embargo, durante unas horas, las personas que *poseían* esos dominios perdieron efectivamente el control de a dónde apuntaban sus nombres, no porque su titularidad estuviera en duda, sino porque la capa operativa debajo de sus dominios falló de golpe.

Esa brecha —entre *poseer* un nombre y *controlar de manera confiable* dónde se resuelve— es exactamente la fisura que explotan ataques como este. Los dominios se encuentran entre los activos más valiosos que posee una empresa, pero a menudo su control se esconde detrás de una infraestructura opaca y centralizada que el propietario no puede verificar ni reconfigurar rápidamente bajo presión.

[Namefi](https://namefi.io) está construido sobre la idea de que los dominios deben comportarse como activos nativos de internet: una titularidad que es criptográficamente verificable y portátil, al mismo tiempo que se mantiene totalmente compatible con el DNS. La titularidad de dominios verificable y controlada por el propietario no detiene una botnet, pero empuja al mundo hacia una internet donde el control de un nombre sea demostrable, auditable y no dependa silenciosamente del peor día de un proveedor. El ataque Mirai-Dyn es un recordatorio de que un dominio que "posees" es tan resiliente como la capa que responde por él. La resiliencia comienza haciendo que la titularidad y el control sean algo que realmente puedas verificar.

## Fuentes y lecturas adicionales

- Krebs on Security — [Cámaras y DVRs hackeados impulsaron la caída masiva de internet de hoy](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/)
- Wikipedia — [Ataques DDoS contra Dyn](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn)
- The Register — [Devastación del DNS: Los principales sitios web caen mientras Dyn muere de nuevo](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/)
- The Register — [Hoy innumerables dispositivos hackeados rompieron la web: tu resumen en 60 segundos](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/)
- The Register — [Mirai, Mirai, somételos a todos: ¿quién es la mayor botnet de todas?](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/)
- The Register — [En los dos años desde que Dyn se apagó, ¿qué hemos aprendido? No mucho, al parecer](https://www.theregister.com/2018/10/11/dns_insecurity_survey/)
- BankInfoSecurity — [Ejército botnet de "hasta 100.000" dispositivos IoT interrumpió a Dyn](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486)
- Carnegie Mellon CyLab — [Cuatro años desde el ataque Mirai-Dyn... ¿es internet más segura?](https://cylab.cmu.edu/news/2020/10/30-dynattack.html)
- CyberScoop — [Tres hombres se declaran culpables por su papel en el imperio de la botnet Mirai](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/)