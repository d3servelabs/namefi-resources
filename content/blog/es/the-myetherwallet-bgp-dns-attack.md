---
title: 'El ataque BGP + DNS a MyEtherWallet: Cómo el secuestro del enrutamiento de internet drenó $150K en ETH'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
description: 'El 24 de abril de 2018, unos atacantes secuestraron el enrutamiento de internet de Amazon Route 53, envenenaron las respuestas DNS de myetherwallet.com y sirvieron un clon de phishing con un certificado autofirmado, drenando aproximadamente $150,000 en Ethereum. Un análisis en profundidad de por qué el DNS depende de una capa de enrutamiento que confía por defecto.'
keywords: ['myetherwallet', 'bgp hijack', 'secuestro dns', 'amazon route 53', 'route 53 hijack', 'seguridad dns', 'seguridad enrutamiento bgp', 'phishing ethereum', 'certificado autofirmado', 'enet as10297', 'rpki roa', 'phishing billetera crypto', 'seguridad de dominios']
relatedArticles:
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-curve-finance-dns-hijack/
  - /es/blog/the-bitcoin-org-dns-hijack/
  - /es/blog/the-godaddy-multi-year-breach/
  - /es/blog/the-dnspionage-campaign/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/name-change-game-change/
relatedGlossary:
  - /es/glossary/dns/
  - /es/glossary/registrar/
  - /es/glossary/icann/
  - /es/glossary/tld/
  - /es/glossary/web3/
---

Cuando escribes el nombre de un sitio web en un navegador, estás confiando en que dos sistemas invisibles sean honestos contigo.

El primero es el **DNS** — la guía telefónica de internet — que convierte un nombre como `myetherwallet.com` en una dirección IP numérica. El segundo es **BGP**, el Border Gateway Protocol, que decide qué camino físico siguen tus paquetes para llegar a esa dirección. Casi nadie piensa en ninguno de ellos. Simplemente funcionan, miles de millones de veces al día, en silencio.

La mañana del **24 de abril de 2018**, ambos mintieron al mismo tiempo. Durante unas dos horas, cualquiera que escribiera `myetherwallet.com` y omitiera una advertencia del navegador era enviado a un clon de [phishing](/es/glossary/phishing/) que corría en un servidor muy lejos de donde creía estar yendo. Para cuando se corrigió el enrutamiento, los atacantes habían drenado aproximadamente **$150,000 en [Ethereum](/es/glossary/ethereum/)** de las billeteras de usuarios reales.

Lo que hace de este incidente un ejemplo permanente en los programas de estudio de seguridad no es la cifra en dólares — los robos de criptomonedas posteriores la han superado con creces. Es el *mecanismo*. Los atacantes nunca entraron en los servidores de MyEtherWallet. Nunca adivinaron una contraseña. Atacaron el **camino**, no el edificio — secuestrando la capa de enrutamiento de internet para envenenar el propio DNS.

## El DNS descansa sobre una capa de enrutamiento que confía por defecto

Para entender lo que ocurrió, hay que comprender la incómoda base sobre la que se asienta cada nombre de dominio en la tierra.

El DNS responde a la pregunta "¿qué dirección IP es `myetherwallet.com`?" Pero para que tu consulta DNS llegue siquiera al servidor correcto, los enrutadores de internet deben saber *qué red* posee las direcciones IP de ese servidor DNS — y para averiguarlo, se apoyan en BGP.

Aquí está el problema. BGP es, por diseño, un sistema basado en la confianza. Como lo resume el artículo de Wikipedia al estilo Cloudflare, [por defecto el protocolo BGP está diseñado para confiar en todos los anuncios de rutas enviados por los pares](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). El investigador de seguridad Bob Cromwell describe la intención original de manera aún más directa: [BGP fue diseñado para ser una cadena de confianza entre ISP y universidades bien intencionados que creen ciegamente en la información que reciben](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust).

En otras palabras: cuando un operador de red se levanta y anuncia al mundo "el tráfico para *estas* direcciones IP debe pasar por *mí*," el resto de internet históricamente simplemente lo ha creído. Existe un mecanismo de desempate de ruta más específica incorporado en BGP — si dos redes reclaman las mismas direcciones, gana la que anuncia el bloque *más estrecho* y específico. Ese mecanismo de desempate es exactamente la palanca que un atacante acciona.

Así que la superficie de ataque de cualquier dominio es mayor que su [registrador](/es/glossary/registrar/), mayor que su proveedor de DNS y mayor que su proveedor de alojamiento web. Incluye todo el tejido de enrutamiento global que lleva tu consulta DNS al lugar correcto. MyEtherWallet lo aprendió de la manera más dura.

## Lo que los usuarios perdieron el 24 de abril de 2018

![Arte conceptual colorido y vívido de tráfico de internet fluyendo por una autopista de datos luminosa, desviado repentinamente por una señal de desvío falsa hacia una carretera ficticia que conduce a un edificio impostor, con paquetes de luz dispersándose en una trampa](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

El daño se concentró en una ventana de aproximadamente dos horas. Según The Register, el enrutamiento malicioso operó [entre las 11am y la 1pm UTC](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC) ese día. En esa ventana, una fracción de todos los que intentaban acceder a `myetherwallet.com` fueron silenciosamente entregados a un impostor.

El impostor era convincente. Parecía MyEtherWallet porque era un clon casi exacto. La *única* cosa que lo delataba era una advertencia de certificado — y, lo que es crucial, los usuarios podían omitir esa advertencia con un clic. Quienes lo hicieron y luego iniciaron sesión, entregaron las llaves de sus propios fondos. Como reportó BleepingComputer, [quienes iniciaron sesión tuvieron sus claves privadas de billetera robadas, que el atacante usó para vaciar las cuentas](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen).

Las cifras se reportan de forma ligeramente distinta en los diferentes medios, pero el número central es consistente. BleepingComputer lo situó en [215 Ether, el equivalente a $160,000 en el momento de la transacción](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000). CyberScoop reportó que los ladrones [lograron robar 215 Ether, equivalente a unos $152,000 en ese momento](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000). Help Net Security resumió que los atacantes [lograron robar aproximadamente $150,000 en Ethereum](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum). Los mismos 215 ETH; la cifra en dólares simplemente varía según el tipo de cambio en el momento del robo.

Esa es la brutal economía de un ataque de enrutamiento más DNS sobre una billetera de criptomonedas. No hay departamento de reversión de fraudes, no hay contracargo, no hay banco al que llamar. Una vez que las claves privadas se ingresan en el clon del atacante y los fondos se mueven en la cadena, están perdidos.

## Cómo ocurrió: secuestra la ruta, envenena la respuesta, sirve el clon

![Arte conceptual colorido y vívido de un mapa mundial luminoso secuestrado donde una ruta GPS es redirigida por una mano impostora que redibuja el camino, llevando a los viajeros hacia un edificio falso mientras el destino real brilla ignorado en la distancia](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

El ataque encadenó dos fallos. Ninguno de los dos por sí solo habría funcionado. Juntos fueron devastadores.

**Paso uno: secuestrar la ruta a los servidores DNS de Amazon.** MyEtherWallet usaba el servicio de DNS gestionado de Amazon. Como señaló Help Net Security con claridad, [MyEtherWallet.com usa el servicio DNS Route 53 de Amazon](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service). Los atacantes no irrumpieron en Route 53. En cambio, según The Register, [alguien fue capaz de enviar mensajes BGP — Border Gateway Protocol — a los enrutadores centrales de internet para convencerlos de enviar el tráfico destinado a algunos de los servidores de AWS a una máquina rebelde](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP).

El anuncio que lo hizo posible vino de un lugar inesperado. The Register informó que [el bloque de red AS10297, perteneciente a la empresa de alojamiento web con sede en Ohio eNet, anunció que podía hacerse cargo del tráfico destinado a algunas de las direcciones IP de AWS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet). Y como BGP prefiere las rutas más específicas y confía en sus pares, el anuncio falso se propagó. Wikipedia registra la escala: [Aproximadamente 1300 direcciones IP del espacio de Amazon Web Services, dedicadas a Amazon Route 53, fueron secuestradas por eNet (o un cliente suyo), un ISP en Columbus, Ohio. Varios socios de peering, como Hurricane Electric, propagaron ciegamente los anuncios](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space). "Propagaron ciegamente" es toda la historia del modelo de confianza de BGP en dos palabras.

**Paso dos: convertirse en el servidor DNS y mentir.** Una vez secuestrada la ruta, las consultas que deberían haber ido a los servidores DNS reales de Amazon aterrizaron en la máquina del atacante. Esa máquina se hizo pasar por Route 53. The Register describió el resultado: [esa máquina rebelde actuó entonces como el servicio DNS de AWS, y proporcionó las direcciones IP incorrectas para MyEtherWallet.com, dirigiendo a algunos visitantes desafortunados al dominio .com hacia un sitio de phishing](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service). El análisis de Kentik enmarca el mismo hecho desde el lado del DNS: [el servidor DNS autoritativo impostor devolvió respuestas falsas para myetherwallet.com, redirigiendo a los usuarios a una versión impostora del sitio web de MyEtherWallet](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com).

**Paso tres: servir el clon de phishing — desde Rusia.** Las respuestas DNS envenenadas dirigían a los usuarios a un servidor en Rusia que alojaba la billetera falsa. Help Net Security reportó que los atacantes usaron el secuestro para [redirigir el tráfico destinado a MyEtherWallet.com al sitio de phishing imitador, alojado en un servidor en Rusia](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia).

**La única salvaguarda que casi funcionó: el certificado.** Esta es la parte en la que cada lector debería detenerse a reflexionar. Los atacantes controlaban la *resolución* del dominio y el *servidor*, pero no podían producir un certificado TLS válido para `myetherwallet.com` emitido por una autoridad de confianza. Así que el navegador hizo exactamente lo que debía hacer — lanzó una advertencia. Help Net Security lo describió con precisión: [lo único que daba alguna indicación de que el sitio de phishing no era lo que pretendía ser era la advertencia mostrada a los visitantes de que el certificado TLS usado por el sitio había sido firmado por una autoridad desconocida (es decir, era autofirmado)](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication). BleepingComputer coincidió en que la señal era obvia para cualquiera que prestara atención: [el sitio web falso era fácil de detectar porque los atacantes usaron un certificado TLS autofirmado que generaba un error en todos los navegadores modernos](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot).

Pero "fácil de detectar" asume que el usuario se detiene. WeLiveSecurity de ESET captó cuán frágil era realmente esa protección: [la única pista obvia que un usuario típico podría haber notado era que al visitar el sitio falso de MyEtherWallet habrían visto un mensaje de error indicándoles que el sitio estaba usando un certificado SSL no confiable](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted). El navegador levantó la mano y dijo *esto está mal*. Los usuarios que perdieron dinero son los que hicieron clic de todas formas — y las víctimas [tuvieron que pasar por un mensaje de error HTTPS, ya que el falso MyEtherWallet.com usaba un certificado TLS/SSL no confiable](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message).

## Respuesta y consecuencias

El secuestro no fue sutil para quienes monitorizan el enrutamiento de forma profesional. Los sistemas de monitorización de redes vieron aparecer los prefijos falsos más específicos y luego retirarse dentro de la misma ventana de dos horas, y una vez que se retiró el anuncio fraudulento, el enrutamiento normal hacia Route 53 se restableció.

La propia MyEtherWallet fue enfática en que su propia infraestructura no había sido vulnerada. Como la empresa subrayó en las horas inmediatas al incidente, el problema era la fontanería de internet, no su aplicación — esto fue un [secuestro de DNS](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking) de la ruta de resolución, logrado a través de BGP, en lugar de una vulneración de los servidores o el código de MEW.

La solución más profunda llegó en la capa de enrutamiento. El episodio se convirtió en uno de los argumentos más citados a favor de **RPKI** (Infraestructura de Clave Pública de Recursos) y las **ROAs** (Autorizaciones de Origen de Ruta) — registros criptográficos que permiten a las redes declarar, de forma verificable, qué sistemas autónomos tienen *permitido* anunciar qué prefijos IP. Con ROAs válidas en su lugar, un anuncio extraviado de "yo tomo las direcciones de Amazon" proveniente de un ISP de Ohio puede ser marcado como **RPKI-inválido** y descartado en lugar de [propagarse ciegamente](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements). Kentik señala la consecuencia directamente: si el mismo anuncio se hiciera hoy contra un prefijo correctamente firmado, [habría sido evaluado como RPKI-inválido](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid). En los años posteriores a ataques como este, las grandes redes aceleraron la publicación de ROAs precisamente para esta clase de ruta.

Pero la adopción de RPKI es un esfuerzo global, de varios años y de participación voluntaria. La lección para todos los demás fue más simple e inmediata: la seguridad de tu dominio depende de capas que no posees y que no puedes ver.

## Lo que esto enseña sobre BGP y DNS como sistemas de confianza por defecto

Este incidente merece ser memorizado porque invierte el modelo mental habitual de "seguridad de dominios."

La mayoría de las personas cree que la seguridad de un dominio significa una contraseña fuerte en el registrador, autenticación de dos factores y un bloqueo del registrador. Todo eso es real y necesario — y **nada de ello habría detenido el 24 de abril de 2018.** Los atacantes nunca tocaron el registrador, nunca tocaron los registros DNS de MyEtherWallet, nunca tocaron sus servidores. Los registros decían lo correcto todo el tiempo. Internet simplemente dejó de entregar las consultas al lugar que los alojaba.

Algunas conclusiones duraderas:

1. **Tu dominio viaja sobre confianza prestada.** La resolución depende de BGP, y BGP, [por defecto... está diseñado para confiar en todos los anuncios de rutas enviados por los pares](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). Puedes tener una configuración DNS impecable y aun así ser secuestrado una capa más abajo.

2. **El envenenamiento de DNS puede lograrse sin tocar nunca el DNS.** Secuestra la ruta al servidor DNS y controlas las respuestas, incluso cuando los registros autoritativos están intactos.

3. **TLS es un respaldo real — y frágil.** La advertencia del certificado fue lo único que se interponía entre los usuarios y la pérdida total. Funcionó técnicamente y falló conductualmente. Un control de seguridad que el usuario puede saltarse con un clic es tan fuerte como la paciencia del usuario.

4. **La finalidad en cadena elimina la red de seguridad.** Para un inicio de sesión bancario, una sesión envenenada es grave. Para una billetera de criptomonedas, es irreversible. El mismo ataque contra otro tipo de sitio habría sido un susto; aquí fue una pérdida permanente.

5. **La defensa en profundidad debe incluir la capa de enrutamiento.** RPKI/ROA a nivel de red, junto con el monitoreo de anuncios de origen inesperados de tus prefijos, es ahora el mínimo indispensable para cualquier cosa de alto valor.

## El ángulo Namefi

![Ilustración colorida de propiedad de dominio verificable y resistente a manipulaciones — una tarjeta de dominio asegurada por un escudo verde, un token Namefi verde y continuidad DNS](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

El ataque a MyEtherWallet es un recordatorio claro de que un dominio no es una sola cosa que "posees" — es una pila de relaciones de confianza, cualquier capa de las cuales puede ser subvertida: el [registro](/es/glossary/registry/), el registrador, el proveedor de DNS y el tejido de enrutamiento global que entrega las consultas a ese proveedor.

[Namefi](https://namefi.io) está construido para hacer que la capa de *propiedad* de esa pila sea verificable y resistente a manipulaciones. La propiedad tokenizada de dominios significa que el control de un dominio puede ser probado criptográficamente y transferido de una manera auditable, en lugar de descansar únicamente en una contraseña de cuenta en un único proveedor — manteniéndose al mismo tiempo compatible con el DNS. Por sí solo, no soluciona BGP; nada en la capa de propiedad reescribe cómo internet enruta los paquetes. Pero ataca la misma enfermedad subyacente que este incidente expuso: **demasiada confianza crítica de internet es implícita, no verificable y reversible por quien pueda falsificar el mensaje correcto.**

El futuro de la seguridad de dominios se parece menos a una contraseña fuerte y más a prueba criptográfica en cada capa — propiedad verificable, enrutamiento verificable (RPKI), identidad verificable (TLS). Los usuarios de MyEtherWallet perdieron dinero en la brecha entre esas capas. Cerrar esa brecha, una capa verificable a la vez, es todo el proyecto.

Los registros de dominio nunca estuvieron equivocados el 24 de abril de 2018. Internet simplemente creyó una mentira sobre cómo llegar a ellos. Hacer que "quién posee qué, y cómo se llega ahí" sea demostrable en lugar de asumido es la forma de asegurarse de que el próximo anuncio falsificado sea descartado en lugar de obedecido.

## Fuentes y lectura adicional

- The Register — [Cryptocurrency thieves snatch ~$150k after BGP hijack reroutes MyEtherWallet DNS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [Hacker Hijacks DNS Server of MyEtherWallet to Steal $160,000](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [MyEtherWallet users robbed after successful DNS hijacking attack](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [Amazon DNS service server hijacked for $152,000 Ether theft](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Ethereum cryptocurrency wallets raided after Amazon's internet domain service hijacked](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [What can be learned from recent BGP hijacks targeting cryptocurrency services?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [BGP hijacking](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [BGP Hijacking](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [How Was MEW (MyEtherWallet) DNS Spoofed?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [Hackers Hijacked DNS Servers to Steal from MyEtherWallet Users](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)
