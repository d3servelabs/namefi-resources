---
title: 'El Ataque BGP + DNS a MyEtherWallet: Cómo el Secuestro del Enrutamiento de Internet Drenó $150K en ETH'
date: '2026-06-17'
language: es
tags: ['dominios', 'seguridad', 'dns', 'seguridad-de-dominios']
authors: ['namefiteam']
draft: false
description: 'El 24 de abril de 2018, unos atacantes secuestraron el enrutamiento de internet de Amazon Route 53, envenenaron las respuestas DNS de myetherwallet.com y sirvieron un clon de phishing detrás de un certificado autofirmado, drenando aproximadamente $150,000 en Ethereum. Un análisis profundo de Domain Mayday sobre por qué el DNS opera sobre una capa de enrutamiento que confía por defecto.'
keywords: ['myetherwallet', 'secuestro bgp', 'secuestro dns', 'amazon route 53', 'secuestro route 53', 'seguridad dns', 'seguridad de enrutamiento bgp', 'phishing ethereum', 'certificado autofirmado', 'enet as10297', 'rpki roa', 'phishing billetera cripto', 'seguridad de dominios']
---

Cuando escribes el nombre de un sitio web en un navegador, estás confiando en que dos sistemas invisibles sean honestos contigo.

El primero es el **DNS** —la guía telefónica del internet— que convierte un nombre como `myetherwallet.com` en una dirección IP numérica. El segundo es **BGP**, el Protocolo de Puerta de Enlace de Frontera (Border Gateway Protocol), que decide qué ruta física toman tus paquetes para llegar a esa dirección. Casi nadie piensa en ninguno de los dos. Simplemente funcionan, miles de millones de veces al día, en silencio.

En la mañana del **24 de abril de 2018**, ambos mintieron al mismo tiempo. Durante unas dos horas, cualquier persona que escribiera `myetherwallet.com` y omitiera la advertencia de su navegador era enviada a un clon de *phishing* que se ejecutaba en un servidor muy lejos de donde creían que iban. Para cuando se corrigió el enrutamiento, los atacantes habían drenado aproximadamente **$150,000 en Ethereum** de las billeteras de usuarios reales.

Lo que convierte a este incidente en un caso de estudio permanente en los planes de formación en ciberseguridad no es la cantidad de dinero —los robos de criptomonedas posteriores lo han empequeñecido—. Es el *mecanismo*. Los atacantes nunca irrumpieron en los servidores de MyEtherWallet. Nunca adivinaron una contraseña. Atacaron la **carretera**, no el edificio, secuestrando la capa de enrutamiento de internet para envenenar el propio DNS.

## El DNS se asienta sobre una capa de enrutamiento que confía por defecto

Para entender qué ocurrió, hay que comprender los incómodos cimientos que se encuentran debajo de cada nombre de dominio en el mundo.

El DNS responde a la pregunta "¿cuál es la dirección IP de `myetherwallet.com`?". Pero para que tu consulta DNS llegue siquiera al servidor correcto, los enrutadores de internet deben saber *qué red* posee las direcciones IP de ese servidor DNS, y para descubrirlo, dependen de BGP.

Aquí está el problema. BGP es, por diseño, un sistema basado en la confianza. Como dice el resumen al estilo Cloudflare en Wikipedia, [por defecto, el protocolo BGP está diseñado para confiar en todos los anuncios de rutas enviados por sus pares](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). El investigador de seguridad Bob Cromwell describe la intención original de forma aún más directa: [BGP fue diseñado para ser una cadena de confianza entre ISP y universidades bien intencionadas que creen ciegamente la información que reciben](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust).

En otras palabras: cuando un operador de red se levanta y anuncia al mundo "el tráfico para *estas* direcciones IP debe pasar a través de *mí*", históricamente el resto de internet simplemente se lo ha creído. BGP tiene incorporado un sistema de desempate basado en rutas más específicas: si dos redes reclaman las mismas direcciones, gana la que anuncia el bloque *más estrecho* y específico. Ese desempate es exactamente la palanca de la que tira un atacante.

Así que la superficie de ataque de cualquier dominio es más grande que su registrador, más grande que su proveedor de DNS y más grande que su alojamiento web. Incluye toda la red global de enrutamiento que lleva tu consulta DNS al lugar correcto. MyEtherWallet lo descubrió por las malas.

## Lo que perdieron los usuarios el 24 de abril de 2018

![Vivid colorful concept art of internet traffic flowing along a glowing data highway, suddenly diverted by a counterfeit detour sign onto a fake road leading to an impostor building, packets of light scattering into a trap](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

El daño se concentró en una ventana de aproximadamente dos horas. Según The Register, el enrutamiento malicioso estuvo activo [entre las 11am y la 1pm UTC](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC) ese día. En ese periodo, una parte de todos los que intentaban acceder a `myetherwallet.com` fueron entregados silenciosamente a un impostor.

El impostor era convincente. Se veía como MyEtherWallet porque era un clon casi exacto. Lo *único* que lo delataba era una advertencia de certificado, y lo que es crucial, los usuarios podían simplemente hacer clic para saltarse esa advertencia. Aquellos que lo hicieron, y luego iniciaron sesión, entregaron las llaves de sus propios fondos. Como informó BleepingComputer, [a los que iniciaron sesión les robaron las claves privadas de sus billeteras, que el atacante utilizó para vaciar las cuentas](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen).

El recuento se reporta de manera ligeramente diferente en varios medios, pero la cifra principal es consistente. BleepingComputer la situó en [215 Ether, el equivalente a $160,000, en el momento de la transacción](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000). CyberScoop informó que los ladrones [lograron robar 215 Ether, lo que equivalía a unos $152,000 en ese momento](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000). Help Net Security resumió que los atacantes [lograron robar aproximadamente $150,000 en Ethereum](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum). Son los mismos 215 ETH; la cifra en dólares simplemente fluctúa con el tipo de cambio en el momento del robo.

Esa es la economía brutal de un ataque de enrutamiento combinado con DNS a una billetera de criptomonedas. No hay un departamento de reversión de fraudes, ni reembolsos, ni un banco al cual llamar. Una vez que las claves privadas se introducen en el clon de un atacante y los fondos se mueven en la cadena de bloques, se pierden para siempre.

## Cómo ocurrió: secuestrar la ruta, envenenar la respuesta, servir el clon

![Vivid colorful concept art of a hijacked glowing world map where a GPS route is rerouted by an impostor hand redrawing the path, travelers led toward a fake landmark building while the real destination glows ignored in the distance](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

El ataque encadenó dos fallos. Ninguno por sí solo habría funcionado. Juntos fueron devastadores.

**Paso uno: secuestrar la ruta a los servidores DNS de Amazon.** MyEtherWallet utilizaba el servicio DNS administrado por Amazon. Como señaló Help Net Security claramente, [MyEtherWallet.com utiliza el servicio DNS Route 53 de Amazon](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service). Los atacantes no hackearon Route 53. En su lugar, según The Register, [alguien logró enviar mensajes BGP (Protocolo de Puerta de Enlace de Frontera) a los enrutadores centrales de internet para convencerlos de enviar el tráfico destinado a algunos servidores de AWS a una máquina rebelde](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP).

El anuncio que lo logró provino de un lugar inesperado. The Register informó que [el bloque de red AS10297, perteneciente a la empresa de alojamiento web eNet, con sede en Ohio, anunció que podía hacerse cargo del tráfico destinado a algunas de las direcciones IP de AWS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet). Y como BGP prefiere rutas más específicas y confía en sus pares, el anuncio falso se propagó. Wikipedia registra la magnitud: [Aproximadamente 1300 direcciones IP dentro del espacio de Amazon Web Services, dedicadas a Amazon Route 53, fueron secuestradas por eNet (o un cliente de la misma), un ISP en Columbus, Ohio. Varios socios de emparejamiento (peering), como Hurricane Electric, propagaron ciegamente los anuncios](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space). "Propagaron ciegamente" resume en dos palabras toda la historia del modelo de confianza de BGP.

**Paso dos: convertirse en el servidor DNS y mentir.** Una vez secuestrada la ruta, las consultas que deberían haber ido a los verdaderos servidores DNS de Amazon terminaron en la máquina del atacante. Dicha máquina se hizo pasar por Route 53. The Register describió el resultado: [esa máquina rebelde actuó entonces como el servicio DNS de AWS, y proporcionó las direcciones IP incorrectas para MyEtherWallet.com, dirigiendo a algunos visitantes desafortunados del .com hacia un sitio de phishing](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service). El análisis de Kentik expone el mismo hecho desde la perspectiva del DNS: [el servidor DNS autoritativo impostor devolvió respuestas falsas para myetherwallet.com, desviando a los usuarios hacia una versión impostora del sitio web de MyEtherWallet](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com).

**Paso tres: servir el clon de phishing —desde Rusia.** Las respuestas DNS envenenadas dirigían a los usuarios a un servidor en Rusia que alojaba la billetera falsa. Help Net Security informó que los atacantes utilizaron el secuestro para [redireccionar el tráfico destinado a MyEtherWallet.com hacia el sitio de phishing similar, alojado en un servidor en Rusia](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia).

**La única medida de seguridad que casi funcionó: el certificado.** Esta es la parte que todo lector debería asimilar. Los atacantes controlaban la *resolución* del dominio y el *servidor*, pero no podían generar un certificado TLS válido para `myetherwallet.com` emitido por una autoridad de confianza. Así que el navegador hizo exactamente lo que se suponía que debía hacer: lanzó una advertencia. Help Net Security lo describió con precisión: [lo único que daba alguna indicación de que el sitio de phishing no era lo que pretendía ser fue la advertencia mostrada a los visitantes indicando que el certificado TLS utilizado por el sitio estaba firmado por una autoridad desconocida (es decir, era autofirmado)](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication). BleepingComputer estuvo de acuerdo en que la señal era obvia para cualquiera que prestara atención: [el sitio web falso era fácil de detectar porque los atacantes usaron un certificado TLS autofirmado que desencadenó un error en todos los navegadores modernos](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot).

Pero "fácil de detectar" asume que el usuario se detiene. WeLiveSecurity de ESET capturó cuán débil era realmente la protección: [la única pista obvia que un usuario típico podría haber notado fue que, al visitar el sitio falso de MyEtherWallet, habría visto un mensaje de error advirtiéndole que el sitio utilizaba un certificado SSL no confiable](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted). El navegador levantó la mano y dijo *esto está mal*. Los usuarios que perdieron dinero son aquellos que hicieron clic para continuar de todos modos, y las víctimas [tuvieron que aceptar y saltarse un mensaje de error HTTPS, ya que el falso MyEtherWallet.com usaba un certificado TLS/SSL no confiable](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message).

## Respuesta y consecuencias

El secuestro no fue sutil para las personas que se dedican a monitorear el enrutamiento. Los monitores de redes vieron aparecer y desaparecer los prefijos falsos y más específicos dentro de esa misma ventana de dos horas, y una vez que se retiró el anuncio malicioso, regresó el enrutamiento normal a Route 53.

La propia empresa MyEtherWallet fue rotunda al afirmar que su infraestructura no había sido vulnerada. Como recalcó en los momentos posteriores, el problema radicaba en las tuberías de internet, no en su aplicación: se trató de un [secuestro de DNS](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking) en la ruta de resolución, logrado a través de BGP, y no de un compromiso en los servidores o en el código de MEW.

La solución más profunda se implementó en la capa de enrutamiento. El episodio se convirtió en uno de los argumentos más citados a favor de **RPKI** (Infraestructura de Clave Pública de Recursos) y los **ROA** (Autorizaciones de Origen de Ruta): registros criptográficos que permiten a las redes declarar, de manera verificable, qué sistemas autónomos están *autorizados* a anunciar determinados prefijos IP. Con ROAs válidos en vigor, un anuncio perdido del tipo "yo me encargo de las direcciones de Amazon" proveniente de un ISP de Ohio puede marcarse como **RPKI-inválido** y ser descartado en lugar de [propagarse ciegamente](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements). Kentik señala la consecuencia directamente: si se hiciera hoy el mismo anuncio contra un prefijo debidamente firmado, [habría sido evaluado como RPKI-inválido](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid). En los años posteriores a ataques como este, las grandes redes aceleraron la publicación de ROAs exactamente para este tipo de rutas.

Sin embargo, la adopción de RPKI es un esfuerzo global, de varios años y de carácter opcional. La lección para los demás fue más simple e inmediata: la seguridad de tu dominio depende de capas que no posees y que no puedes ver.

## Qué nos enseña esto sobre la confianza por defecto de BGP y DNS

Vale la pena memorizar este incidente porque invierte el modelo mental habitual de "seguridad de dominios".

La mayoría de las personas cree que la seguridad de un dominio consiste en tener una contraseña sólida en el registrador, autenticación de dos factores y un bloqueo de registrador. Todo eso es real y necesario, y **nada de ello habría detenido lo ocurrido el 24 de abril de 2018.** Los atacantes nunca tocaron al registrador, nunca tocaron los registros DNS de MyEtherWallet, nunca tocaron sus servidores. Los registros mostraron la información correcta todo el tiempo. Internet simplemente dejó de entregar las consultas al lugar que los alojaba.

Algunas conclusiones duraderas:

1. **Tu dominio opera sobre confianza prestada.** La resolución depende de BGP, y BGP, por [defecto... está diseñado para confiar en todos los anuncios de rutas enviados por sus pares](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). Puedes tener una configuración DNS impecable y aun así ser secuestrado en una capa inferior.

2. **El envenenamiento de DNS se puede lograr sin siquiera tocar el DNS.** Secuestra la ruta hacia el servidor DNS y controlarás las respuestas, incluso cuando los registros autoritativos estén intactos.

3. **TLS es un verdadero respaldo, pero uno muy frágil.** La advertencia del certificado era lo único que se interponía entre los usuarios y la pérdida total. Funcionó a nivel técnico, pero falló a nivel de comportamiento. Un control de seguridad que un usuario puede ignorar con un clic es tan fuerte como la paciencia del usuario.

4. **La irrevocabilidad on-chain elimina la red de seguridad.** Para el inicio de sesión en un banco, una sesión envenenada es grave. Para una billetera de criptomonedas, es irreversible. El mismo ataque contra otro tipo de sitio web habría sido un buen susto; aquí supuso una pérdida permanente.

5. **La defensa en profundidad debe incluir la capa de enrutamiento.** RPKI/ROA a nivel de red, además del monitoreo de anuncios de origen inesperados para tus prefijos, son ahora requisitos indispensables para cualquier activo de alto valor.

## La perspectiva de Namefi

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

El ataque a MyEtherWallet es un duro recordatorio de que un dominio no es un objeto único que simplemente "posees", sino una pila de relaciones de confianza, y cualquier capa de esta puede ser subvertida: el registro, el registrador, el proveedor de DNS y la infraestructura global de enrutamiento que entrega las consultas a ese proveedor.

[Namefi](https://namefi.io) se ha construido con el objetivo de hacer que la capa de *propiedad* de esa pila sea verificable y resistente a manipulaciones. La propiedad de dominios tokenizada significa que el control de un dominio se puede demostrar y transferir criptográficamente de manera auditable, en lugar de depender únicamente de la contraseña de una cuenta en un solo proveedor, y todo ello manteniendo la compatibilidad con el DNS. Por sí solo no soluciona el problema de BGP; nada en la capa de propiedad reescribe la forma en que internet enruta los paquetes. Sin embargo, ataca la misma enfermedad subyacente que este incidente expuso: **gran parte de la confianza crítica en internet es implícita, no verificable y reversible por cualquiera que pueda falsificar el mensaje adecuado.**

El futuro de la seguridad de dominios no se basa tanto en una contraseña segura, sino en pruebas criptográficas en cada capa: propiedad verificable, enrutamiento verificable (RPKI), identidad verificable (TLS). Los usuarios de MyEtherWallet perdieron dinero en las grietas entre esas capas. Cerrar esas brechas, una capa verificable a la vez, es el objetivo de todo el proyecto.

Los registros de dominio nunca estuvieron equivocados el 24 de abril de 2018. Internet simplemente se creyó una mentira sobre cómo llegar a ellos. Hacer que aspectos como "quién es el dueño de qué y cómo llegar hasta ello" sean comprobables en lugar de supuestos es la manera de garantizar que el próximo anuncio falso sea descartado en lugar de obedecido.

## Fuentes y lecturas adicionales

- The Register — [Ladrones de criptomonedas arrebatan ~$150k después de que un secuestro de BGP desviara el DNS de MyEtherWallet](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [Un hacker secuestra el servidor DNS de MyEtherWallet para robar $160,000](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [Usuarios de MyEtherWallet son robados tras un exitoso ataque de secuestro de DNS](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [El servidor del servicio DNS de Amazon es secuestrado para el robo de $152,000 en Ether](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Billeteras de criptomonedas Ethereum asaltadas tras el secuestro del servicio de dominios de internet de Amazon](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [¿Qué se puede aprender de los recientes secuestros de BGP dirigidos a servicios de criptomonedas?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [Secuestro BGP](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [Secuestro BGP](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [¿Cómo fue suplantado el DNS de MEW (MyEtherWallet)?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [Hackers secuestraron servidores DNS para robar a usuarios de MyEtherWallet](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)