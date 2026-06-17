---
title: 'El secuestro de DNS de Malaysia Airlines: "404 — Avión no encontrado"'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'En enero de 2015, Lizard Squad secuestró el DNS de malaysiaairlines.com y reemplazó el sitio de la aerolínea con un lagarto en esmoquin y la burla "404 — Avión no encontrado". No se vulneró ningún servidor; los atacantes simplemente cambiaron a dónde apuntaba el dominio. Una inmersión profunda de Domain Mayday sobre cómo el DNS se convirtió en la puerta principal más expuesta de la aerolínea.'
keywords: ['secuestro de dns de malaysia airlines', 'lizard squad', 'cibercalifato', '404 avión no encontrado', 'secuestro de dns', 'secuestro de dominio', 'compromiso del registrador', 'webnic', 'malaysiaairlines.com', 'seguridad de dominios', 'redirección dns', 'bloqueo de registro', 'mh370']
---

El avión nunca se encontró. En enero de 2015, tampoco lo hizo el sitio web.

En la mañana del 26 de enero de 2015, cualquiera que escribiera **malaysiaairlines.com** en un navegador no llegaba a la aerolínea. Llegaba a un hacker. La familiar página de reservas había desaparecido, reemplazada por la imagen de un lagarto con sombrero de copa y monóculo, junto a un único y cruel titular: **"404 — Avión no encontrado"**. Debajo de él: *"Hackeado por Lizard Squad — Cibercalifato Oficial"*. La barra de título de un navegador leía simplemente: *"ISIS prevalecerá"*.

Era una broma sobre un cementerio. Menos de un año antes, el vuelo 370 de Malaysia Airlines había desaparecido del radar con 239 personas a bordo. Cuatro meses después, el vuelo 17 fue derribado en el cielo sobre Ucrania. Ahora, un grupo de adolescentes había convertido el dolor de la aerolínea en un chiste servido en su propia puerta principal, sin tocar jamás sus servidores.

Esa última parte es toda la historia. Malaysia Airlines no fue "hackeada" de la manera en que la mayoría de la gente lo imagina. Sus sistemas de reservas estaban intactos. Los datos de sus pasajeros no fueron tocados. Lo que los atacantes tomaron fue algo más fundamental y, según parece, mucho más fácil de arrebatar: el **nombre de dominio en sí**; la dirección que le dice a toda Internet dónde "vive" Malaysia Airlines.

Este es un caso de *Domain Mayday* sobre la parte de su infraestructura en la que probablemente nunca piensa hasta que apunta a otro lugar.

## Una aerolínea es su dominio

Para una aerolínea global, el sitio web no es un folleto. Es la caja registradora, el mostrador de facturación y el centro de atención telefónica, todos vinculados a una única cadena de texto: `malaysiaairlines.com`.

Cada reserva, cada inicio de sesión del programa de fidelización, cada enlace para "gestionar mi vuelo" en los correos electrónicos de confirmación se resuelve a través de ese dominio. Cuando un pasajero en Kuala Lumpur o Londres lo escribe, se activa una cadena invisible: el navegador le pregunta al Sistema de Nombres de Dominio (DNS) "¿dónde vive malaysiaairlines.com?", el DNS responde con una dirección IP y el navegador se conecta. La marca de la aerolínea, sus ingresos y la confianza de sus clientes dependen de que esa única búsqueda devuelva la respuesta *correcta*.

El DNS es la libreta de direcciones de Internet. Para la mayoría de las organizaciones, también es la puerta menos vigilada del edificio. Puede gastar millones fortaleciendo sus servidores, cifrando sus bases de datos y capacitando a su personal contra el phishing, y nada de eso importa si alguien puede cambiar silenciosamente la línea en la libreta de direcciones que indica a dónde apunta su nombre. Redirija la dirección y habrá redirigido la empresa, sin siquiera irrumpir en el edificio.

Eso es exactamente lo que ocurrió.

## El secuestro: un lagarto donde solía haber una aerolínea

![Vivid colorful concept art of a glowing DNS signpost on a runway switched by an unseen hand, rerouting a stream of travelers away from a departure gate toward a dead-end wall stamped with a giant 404, neon teal and magenta](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

La desfiguración del sitio (defacement) fue diseñada para causar la máxima crueldad. La imagen de un lagarto en traje de etiqueta era la tarjeta de presentación de Lizard Squad; el grupo había pasado el diciembre anterior desconectando [Xbox Live y la PlayStation Network de Sony](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month) durante las vacaciones. Para enero, se había envuelto en la imaginería de un "Cibercalifato", presentándose como aliados de ISIS, aunque los investigadores trataron esta afirmación con profundo escepticismo.

El sitio, tal como lo encontraron los visitantes, [mostraba la imagen de un lagarto con sombrero de copa y monóculo, además del texto "404-Plane Not Found"](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27). El relato de Wikipedia sobre el grupo registra la misma escena: los usuarios fueron [redirigidos a otra página con la imagen de un lagarto en esmoquin](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard), y la página [llevaba el titular "404 - Plane Not Found", en aparente referencia a la pérdida del vuelo MH370 de la aerolínea el año anterior](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year).

La crueldad era el objetivo. El MH370 había [desaparecido del radar el 8 de marzo de 2014](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014); finalmente se dio por muertas a las 239 personas a bordo y los restos nunca se localizaron de manera concluyente. El MH17 había sido [derribado por fuerzas respaldadas por Rusia con un misil tierra-aire Buk 9M38 el 17 de julio de 2014](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014), matando a los 298 ocupantes. Sellar "Avión no encontrado" en la página principal de la aerolínea era convertir el peor año en la historia de la empresa en un arma y transmitirlo a cada cliente que intentara acceder al sitio.

Luego llegó la amenaza. El grupo [tuiteó que pronto "liberaría algo del botín encontrado en los servidores de www.malaysiaairlines.com"](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon), e incluso publicó una captura de pantalla que afirmaba mostrar itinerarios de pasajeros. Para una aerolínea que ya se estaba ahogando en un año de catástrofes, la idea de que los datos de los clientes anduvieran sueltos era otro tipo de desastre.

## Cómo sucedió: la libreta de direcciones, no el edificio

![Vivid colorful concept art of a futuristic switchboard operator pulling a glowing cable from the correct socket and plugging it into a fake one, streams of light-traffic diverting off a runway toward an impostor terminal, electric blues and warm orange](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

Aquí se encuentra el núcleo técnico del asunto, y la razón por la que este caso pertenece a una serie de seguridad de dominios en lugar de a una de brechas en servidores.

La propia declaración de Malaysia Airlines, repetida a lo largo de toda la cobertura, hizo la distinción con precisión: [Malaysia Airlines confirma que su Sistema de Nombres de Dominio (DNS) ha sido comprometido, por lo que los usuarios son redirigidos a un sitio web de hackers cuando se ingresa la URL www.malaysiaairlines.com](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website). La aerolínea insistió en que su [sitio web no fue hackeado y este fallo temporal no afecta sus reservas y que los datos de los usuarios permanecen seguros](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured), añadiendo que sus [servidores web están intactos](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact).

Ambas cosas eran ciertas al mismo tiempo: el sitio estaba arruinado *y* los servidores estaban bien. Los atacantes nunca necesitaron los servidores. Como señaló *The Register*, [los registros DNS del sitio han sido manipulados para que los navegantes sean redirigidos a un sitio controlado por hackers](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site). Cambiaron la entrada de la libreta de direcciones, no el edificio al que apuntaba. Incluso la malicia quedó archivada en los metadatos: una comprobación de Whois de la época mostraba [ISIS prevalecerá](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail) listado como el título del sitio.

¿Dónde se guardaba esa libreta de direcciones? En el registrador. El dominio de la aerolínea [parece estar registrado en Web Commerce Communications Limited —también conocido como Webnic— que tiene oficinas en Singapur, Malasia y China](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China). Ese nombre es importante, porque Webnic estaba a punto de volverse infame.

Un mes después, el mismo registrador estuvo en el centro de un incidente mucho mayor. Como informó Brian Krebs, los atacantes [tomaron el control de Webnic.cc, el registrador malasio que sirve a ambos dominios y a otros 600.000](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others), y luego [aprovecharon su acceso a Webnic.cc para alterar los registros del sistema de nombres de dominio (DNS)](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records) para **Lenovo** y **Google Vietnam**. El mecanismo, informó Krebs, fue una [vulnerabilidad de inyección de comandos en Webnic.cc para subir un rootkit](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit): acceso persistente al mismo sistema que controla a dónde apuntan cientos de miles de dominios.

No es necesario irrumpir en Google para redirigir google.com.vn. No es necesario irrumpir en una aerolínea para redirigir su página principal. Solo tiene que comprometer la capa que *posee la respuesta* a "¿dónde vive este dominio?", que es la cuenta del registrador y los registros DNS detrás de ella. Esa capa se encuentra fuera del perímetro que la mayoría de las empresas realmente defienden.

## Impacto y respuesta

Para la aerolínea, el daño fue reputacional y operativo, más que por robo de datos. Los clientes que intentaban hacer una reserva o el check-in se topaban con la desfiguración del sitio. Los titulares de todo el mundo emparejaron las palabras "Malaysia Airlines" con "hackeado"; una marca ya en crisis ahora se asociaba con un lagarto burlándose de su avión perdido.

La aerolínea se movilizó para contenerlo de la única manera en que se puede contener un secuestro de DNS: trabajando a través de la capa que había sido subvertida. Afirmó que había [resuelto el problema con su proveedor de servicios](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider) y que [se esperaba que el sistema estuviera completamente recuperado en un plazo de 22 horas](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours). Ese margen de tiempo es en sí mismo un indicador de DNS: incluso después de arreglar los registros, la respuesta incorrecta puede perdurar en cachés de todo el mundo hasta que expire. Un secuestro es rápido de cometer y lento de revertir por completo.

Sobre la amenaza de filtración de datos, la aerolínea mantuvo su postura —reservas no afectadas, datos de los usuarios seguros— y la catastrófica filtración de la que se jactaba el grupo nunca se materializó como describieron. Pero "no fuimos realmente vulnerados, los atacantes solo controlaron nuestra identidad pública entera durante casi un día" es un mensaje difícil de transmitir al público viajero. Para un cliente que mira la frase "404 — Avión no encontrado", la distinción entre una brecha en el servidor y un secuestro de DNS es invisible. El sitio *era* la aerolínea. Y por un día, el sitio perteneció a otra persona.

## Lo que esto enseña sobre el DNS como su puerta de entrada

El secuestro de Malaysia Airlines es una lección de manual precisamente porque *no se vulneró nada* en el sentido convencional. Las conclusiones se generalizan a casi todas las organizaciones en línea:

1. **Su dominio es un punto único de fallo que no controla solo.** El registrador mantiene el registro maestro de a dónde apunta su nombre. Si la seguridad de su cuenta (o su software) falla, sus servidores perfectamente blindados son irrelevantes. Webnic demostró esto dos veces en un mes, con una aerolínea y luego con Google y Lenovo.

2. **Un secuestro de DNS no requiere una brecha en su sistema.** Los atacantes redirigieron la libreta de direcciones, no el edificio. Las defensas que vigilan sus servidores, su código y su red pueden pasar por alto un ataque que ocurre íntegramente en la capa de nombres.

3. **Bloquee los registros que pueden mover su nombre.** El Bloqueo de Registro (Registry Lock) y los bloqueos a nivel de registrador existen específicamente para detener cambios no autorizados en su DNS y en los registros de los servidores de nombres: añaden un paso manual fuera de banda antes de que alguien pueda reorientar su dominio. Para un dominio de alto valor, estas medidas no son opcionales.

4. **Implemente DNSSEC y 2FA en el registrador.** La autenticación robusta en la cuenta del registrador y la firma DNSSEC en la zona elevan el coste de exactamente el mismo intercambio silencioso de registros que desfiguró el sitio de Malaysia Airlines.

5. **La recuperación es más lenta que el ataque.** Los TTL y los cachés globales hacen que un secuestro sobreviva a su solución. Planifique el periodo de limpieza, no solo el parche.

El incómodo resumen: la mayoría de las empresas vigilan el edificio y dejan una nota adhesiva en la puerta principal diciendo a todos a qué edificio entrar. Cambie la nota, y habrá mudado la empresa.

## La perspectiva de Namefi

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

El secuestro de Malaysia Airlines es, en su núcleo, una cuestión de *quién tiene permiso para cambiar a dónde apunta un nombre*, y con qué facilidad esa autoridad puede ser robada silenciosamente en la capa del registrador. El ataque no derrotó a la criptografía ni vulneró una base de datos. Derrotó al frágil plano de control basado en cuentas que decide el hecho más importante sobre un dominio: a dónde resuelve.

[Namefi](https://namefi.io) está construido sobre la idea de que la propiedad y el control de los dominios deberían comportarse como un activo verificable y nativo de Internet en lugar de como una línea en la base de datos de un registrador que una cuenta comprometida puede reescribir. La propiedad tokenizada hace que la pregunta "¿quién controla este dominio, y ese control acaba de cambiar de manos?" sea auditable y a prueba de manipulaciones, manteniendo la compatibilidad con el DNS. La defensa contra un secuestro no consiste solo en tener contraseñas más fuertes, sino en hacer que los cambios no autorizados sean *visibles y demostrables* en lugar de silenciosos.

Malaysia Airlines nunca perdió sus servidores. Perdió la respuesta a una sola pregunta —*¿a dónde apunta este nombre?*— durante aproximadamente un día. El avión nunca fue encontrado. El sitio web tampoco debería haberse perdido nunca. La lección de Domain Mayday es que la libreta de direcciones forma parte del perímetro, y el día que lo olvide es el día en que un lagarto de sombrero de copa se muda a su puerta principal.

## Fuentes y lecturas complementarias

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