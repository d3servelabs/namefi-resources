---
title: 'El secuestro DNS de Malaysia Airlines: "404 — Avión No Encontrado"'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'En enero de 2015, Lizard Squad secuestró el DNS de malaysiaairlines.com y reemplazó el sitio de la aerolínea con un lagarto vestido de esmoquin y la burla "404 — Avión No Encontrado". Ningún servidor fue vulnerado — los atacantes simplemente cambiaron a dónde apuntaba el dominio. Un análisis en profundidad de Domain Mayday sobre cómo el DNS se convirtió en la puerta de entrada más expuesta de la aerolínea.'
keywords: ['secuestro dns malaysia airlines', 'lizard squad', 'cyber caliphate', '404 avión no encontrado', 'secuestro dns', 'secuestro de dominio', 'compromiso de registrar', 'webnic', 'malaysiaairlines.com', 'seguridad de dominios', 'redirección dns', 'registry lock', 'mh370']
---

El avión nunca fue encontrado. En enero de 2015, tampoco lo fue el sitio web.

En la mañana del 26 de enero de 2015, cualquiera que escribiera **malaysiaairlines.com** en un navegador no llegaba a la aerolínea. Llegaba a un hacker. La familiar página de reservas había desaparecido, reemplazada por la imagen de un lagarto con sombrero de copa y monóculo, y un único y cruel titular: **"404 — Avión No Encontrado."** Debajo: *"Hackeado por Lizard Squad — Califato Cibernético Oficial."* La barra de título de un navegador decía, simplemente, *"ISIS will prevail."*

Era una broma sobre un cementerio. Menos de un año antes, el vuelo 370 de Malaysia Airlines había desaparecido del radar con 239 personas a bordo. Cuatro meses después, el vuelo 17 fue derribado sobre Ucrania. Ahora un grupo de adolescentes había convertido el propio duelo de la aerolínea en el remate de un chiste servido en su propia puerta de entrada — sin tocar jamás sus servidores.

Esa última parte es toda la historia. Malaysia Airlines no fue "hackeada" de la manera en que la mayoría de la gente lo imagina. Sus sistemas de reservas estaban intactos. Sus datos de pasajeros permanecían intocados. Lo que los atacantes se apoderaron fue de algo más fundamental y, resulta, mucho más fácil de tomar: el **nombre de dominio en sí** — la dirección que le dice a toda la internet dónde vive "Malaysia Airlines".

Este es un caso de Domain Mayday sobre la parte de tu infraestructura en la que probablemente nunca piensas hasta que apunta a otro lugar.

## Una aerolínea es su dominio

Para una aerolínea global, el sitio web no es un folleto. Es la caja registradora, el mostrador de facturación y el centro de llamadas, todo ligado a una cadena de texto: `malaysiaairlines.com`.

Cada reserva, cada inicio de sesión de fidelidad, cada enlace de "gestionar mi vuelo" en cada correo de confirmación se resuelve a través de ese dominio. Cuando un pasajero en Kuala Lumpur o Londres lo escribe, se dispara una cadena invisible: el navegador le pregunta al [Sistema de Nombres de Dominio](/es/glossary/dns/) (DNS) "¿dónde vive malaysiaairlines.com?", el DNS responde con una dirección IP, y el navegador se conecta. La marca de la aerolínea, sus ingresos y la confianza de sus clientes dependen de que esa única consulta devuelva la respuesta *correcta*.

El DNS es la agenda de direcciones de internet. También es, para la mayoría de las organizaciones, la puerta menos vigilada del edificio. Puedes gastar millones reforzando tus servidores, cifrando tus bases de datos y capacitando a tu personal contra el [phishing](/es/glossary/phishing/) — y nada de eso importa si alguien puede cambiar silenciosamente la línea en la agenda de direcciones que indica a dónde apunta tu nombre. Redirige la dirección y habrás redirigido la empresa, sin entrar nunca al edificio.

Eso es exactamente lo que ocurrió.

## El secuestro: un lagarto donde antes había una aerolínea

![Arte conceptual colorido y vívido de un letrero de DNS luminoso en una pista de aterrizaje manipulado por una mano invisible, desviando un flujo de viajeros de una puerta de embarque hacia una pared marcada con un enorme 404, en colores neón turquesa y magenta](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

La desfiguración fue diseñada para causar el máximo daño. La imagen de un lagarto en ropa formal era la tarjeta de presentación de Lizard Squad; el grupo había pasado el diciembre anterior derribando [Xbox Live y Sony PlayStation Network](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month) durante las vacaciones. Para enero, se había envuelto en la imagen de un "Califato Cibernético", posando como aliado del ISIS incluso mientras los investigadores trataban la afirmación con profundo escepticismo.

El sitio, tal como lo encontraron los visitantes, [mostraba la imagen de un lagarto con sombrero de copa y monóculo, junto con el texto "404-Plane Not Found"](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27). El relato de Wikipedia sobre el grupo registra la misma escena: los usuarios fueron [redirigidos a otra página con la imagen de un lagarto vestido de esmoquin](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard), y la página [llevaba el titular "404 - Plane Not Found", una aparente referencia a la pérdida del vuelo MH370 el año anterior](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year).

La crueldad era el mensaje. El MH370 había [desaparecido del radar el 8 de marzo de 2014](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014), con las 239 personas a bordo eventualmente presumidas muertas y los restos nunca localizados de manera concluyente. El MH17 había sido [derribado por fuerzas respaldadas por Rusia con un misil superficie-aire Buk 9M38 el 17 de julio de 2014](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014), matando a los 298 pasajeros a bordo. Estampar "Avión No Encontrado" en la página de inicio de la aerolínea fue convertir el peor año de la compañía en un arma — y transmitirlo a cada cliente que intentaba acceder al sitio.

Luego llegó la amenaza. El grupo [publicó en Twitter que "pronto filtraría el botín encontrado en los servidores de www.malaysiaairlines.com,"](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon) e incluso publicó una captura de pantalla que afirmaba mostrar itinerarios de pasajeros. Para una aerolínea que ya se ahogaba en un año de catástrofes, la idea de que los datos de los clientes estuvieran sueltos era su propio tipo de desastre.

## Cómo ocurrió: la agenda de direcciones, no el edificio

![Arte conceptual colorido y vívido de un operador de centralita futurista que desconecta un cable luminoso del enchufe correcto y lo conecta a uno falso, con corrientes de tráfico de luz desviándose de una pista hacia una terminal impostora, en tonos azul eléctrico y naranja cálido](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

Aquí está el núcleo técnico del asunto, y la razón por la que este caso pertenece a una serie de seguridad de dominios y no a una sobre brechas de servidores.

El propio comunicado de Malaysia Airlines, repetido en toda la cobertura, trazó la distinción con precisión: [Malaysia Airlines confirma que su Sistema de Nombres de Dominio (DNS) ha sido comprometido, por lo que los usuarios son redirigidos a un sitio web de hackers cuando se introduce la URL www.malaysiaairlines.com](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website). La aerolínea insistió en que su [sitio web no fue hackeado y que este problema temporal no afecta sus reservas y que los datos de los usuarios permanecen seguros](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured), añadiendo que sus [servidores web están intactos](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact).

Ambas cosas eran verdad al mismo tiempo: el sitio estaba destruido *y* los servidores estaban bien. Los atacantes nunca necesitaron los servidores. Como lo expresó The Register, [los registros DNS del sitio fueron manipulados de modo que los usuarios eran redirigidos a un sitio controlado por hackers](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site). Cambiaron la entrada en la agenda de direcciones, no el edificio al que apuntaba. Incluso la malicia estaba archivada en los metadatos: una consulta [Whois](/es/glossary/whois/) en ese momento mostraba [ISIS will prevail](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail) como título del sitio.

¿Dónde se guardaba esa agenda de direcciones? En el registrar. El dominio de la aerolínea [aparece registrado con Web Commerce Communications Limited — también conocido como Webnic — que tiene oficinas en Singapur, Malasia y China](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China). Ese nombre importa, porque Webnic estaba a punto de hacerse tristemente célebre.

Un mes después, el mismo registrar se encontraba en el centro de un incidente mucho mayor. Como informó Brian Krebs, los atacantes [tomaron el control de Webnic.cc, el registrar malayo que gestiona ese dominio y otros 600,000](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others), y luego [aprovecharon su acceso en Webnic.cc para alterar los registros del sistema de nombres de dominio (DNS)](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records) de **Lenovo** y **Google Vietnam**. El mecanismo, según informó Krebs, fue una [vulnerabilidad de inyección de comandos en Webnic.cc para cargar un rootkit](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — acceso persistente al mismo sistema que controla a dónde apuntan cientos de miles de dominios.

No necesitas irrumpir en Google para redirigir google.com.vn. No necesitas irrumpir en una aerolínea para redirigir su página de inicio. Solo tienes que comprometer la capa que *posee la respuesta* a "¿dónde vive este dominio?" — la cuenta del registrar y los registros DNS detrás de ella. Esa capa se encuentra fuera del perímetro que la mayoría de las empresas realmente defienden.

## Impacto y respuesta

Para la aerolínea, el daño fue reputacional y operativo más que un robo de datos. Los clientes que intentaban reservar o hacer el check-in se encontraban con una desfiguración. Los titulares de todo el mundo asociaron las palabras "Malaysia Airlines" con "hackeada" — una marca ya en crisis ahora vinculada a un lagarto burlándose de su avión desaparecido.

La aerolínea actuó para contenerlo de la única manera en que un [secuestro DNS](/es/glossary/dns-hijacking/) puede contenerse: trabajando a través de la capa que había sido subvertida. Dijo que había [resuelto el problema con su proveedor de servicios](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider) y que el [sistema se esperaba que estuviera completamente recuperado en 22 horas](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours). Ese plazo es en sí mismo una señal reveladora del DNS: incluso después de corregir los registros, la respuesta errónea puede persistir en cachés de todo el mundo hasta que expire. Un secuestro es rápido de cometer y lento de deshacer por completo.

Sobre la amenaza de filtración de datos, la aerolínea mantuvo su posición — reservas sin afectación, datos de usuarios seguros — y la catastrófica filtración que el grupo alardeó nunca se materializó como se describió. Pero "no fuimos realmente vulnerados, los atacantes solo controlaron toda nuestra identidad pública durante casi un día" es un mensaje difícil de comunicar al público viajero. Para un cliente mirando "404 — Avión No Encontrado", la distinción entre una brecha de servidor y un secuestro DNS es invisible. El sitio era la aerolínea. Y durante un día, el sitio le pertenecía a otra persona.

## Lo que esto enseña sobre el DNS como tu puerta de entrada

El secuestro de Malaysia Airlines es una lección de libro de texto precisamente porque *nada fue vulnerado* en el sentido convencional. Las conclusiones se generalizan a casi cualquier organización en línea:

1. **Tu dominio es un punto único de falla que no controlas solo.** El registrar guarda el [registro](/es/glossary/registry/) maestro de a dónde apunta tu nombre. Si la seguridad de su cuenta — o su software — falla, tus servidores perfectamente reforzados son irrelevantes. Webnic lo demostró dos veces en un mes, con una aerolínea y luego con Google y Lenovo.

2. **Un secuestro DNS no requiere vulnerar tus sistemas.** Los atacantes redirigieron la agenda de direcciones, no el edificio. Las defensas que vigilan tus servidores, tu código y tu red pueden pasar por alto un ataque que ocurre completamente en la capa de nomenclatura.

3. **Bloquea los registros que pueden mover tu nombre.** El Registry Lock y los bloqueos a nivel de registrar existen específicamente para impedir cambios no autorizados en tus registros DNS y de servidores de nombres — añaden un paso manual fuera de banda antes de que nadie pueda redirigir tu dominio. Para un dominio de alto valor, no son opcionales.

4. **Activa [DNSSEC](/es/glossary/dnssec/) y la autenticación de dos factores en el registrar.** Una autenticación sólida en la cuenta del registrar y la firma DNSSEC en la zona elevan el costo exactamente del silencioso intercambio de registros que desfiguró Malaysia Airlines.

5. **La recuperación es más lenta que el ataque.** Los TTL y los cachés globales significan que un secuestro sobrevive a su corrección. Planifica para el período de limpieza, no solo para el parche.

El resumen incómodo: la mayoría de las empresas cuidan el edificio y dejan una nota adhesiva en la puerta de entrada que le dice a todos a qué edificio entrar. Cambia la nota y habrás movido la empresa.

## El ángulo Namefi

![Ilustración colorida de propiedad de dominio verificable y resistente a manipulaciones — una tarjeta de dominio asegurada con un escudo verde, un token verde de Namefi y continuidad DNS](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

El secuestro de Malaysia Airlines es, en esencia, una pregunta sobre *quién tiene permitido cambiar a dónde apunta un nombre* — y con qué facilidad esa autoridad puede ser robada silenciosamente en la capa del registrar. El ataque no venció a la criptografía ni descifró una base de datos. Venció al plano de control suave y basado en cuentas que decide el hecho más importante sobre un dominio: a dónde se resuelve.

[Namefi](https://namefi.io) está construido sobre la idea de que la propiedad y el control de dominios deben comportarse como un activo verificable nativo de internet, en lugar de una entrada en la base de datos de un registrar que una cuenta comprometida puede reescribir. La propiedad tokenizada hace que la pregunta "¿quién controla este dominio, y acaba de cambiar de manos ese control?" sea auditable y evidentemente a prueba de manipulaciones, manteniendo la compatibilidad con el DNS. La defensa contra un secuestro no son solo contraseñas más fuertes — es hacer que los cambios no autorizados sean *visibles y demostrables* en lugar de silenciosos.

Malaysia Airlines nunca perdió sus servidores. Perdió la respuesta a una sola pregunta — *¿a dónde apunta este nombre?* — durante aproximadamente un día. El avión nunca fue encontrado. El sitio web tampoco debería haberse perdido. La lección de Domain Mayday es que la agenda de direcciones forma parte del perímetro, y el día que lo olvidas es el día que un lagarto con sombrero de copa se muda a tu puerta de entrada.

## Fuentes y lecturas adicionales

- TechCrunch — [Malaysia Airlines Site Hacked By Lizard Squad](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/)
- The Register — [Lizard Squad threatens Malaysia Airlines with data dump](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/)
- BankInfoSecurity — [Malaysia Airlines Website Hacked](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833)
- Computerworld — [Malaysia Airlines claim DNS hijacked, site not hacked, but attackers threaten data dump](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html)
- Infosecurity Magazine — [Malaysia Airlines Site Back Up as Hackers Threaten Data Dump](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/)
- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- ABC News — [Malaysia Airlines Hit by Lizard Squad Hack Attack](https://abcnews.go.com/Technology/malaysia-airlines-hit-lizard-squad-hack-attack/story?id=28489244)
- NBC News — [Lizard Squad Claims It Hacked Malaysia Airlines Website](https://www.nbcnews.com/storyline/isis-terror/lizard-squad-claims-it-hacked-malaysia-airlines-website-n293461)
- IT Security Guru — [Lizard Squad hijacks Malaysia Airline DNS](https://www.itsecurityguru.org/2015/01/26/lizard-squad-hijacks-malaysia-airline-dns/)
- Wikipedia — [Lizard Squad](https://en.wikipedia.org/wiki/Lizard_Squad)
- Wikipedia — [Malaysia Airlines Flight 370](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370)
- Wikipedia — [Malaysia Airlines Flight 17](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17)
