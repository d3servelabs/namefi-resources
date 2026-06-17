---
title: "El secuestro de DNS de Lenovo.com: Cuando Lizard Squad tomó la puerta principal de un gigante del hardware"
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "El 25 de febrero de 2015, Lizard Squad secuestró Lenovo.com al comprometer al registrador Webnic, redirigiendo el dominio del mayor fabricante de PC del mundo a una presentación de cámaras web e interceptando su correo electrónico, días después del escándalo de Superfish. Un análisis profundo de Domain Mayday sobre por qué el registrador es su verdadero perímetro."
keywords: ['secuestro dns lenovo.com', 'lizard squad', 'registrador webnic', 'web commerce communications', 'secuestro de dns', 'superfish', 'seguridad de registradores de dominios', 'compromiso de registrador', 'código de autorización epp', 'interceptación de correo electrónico', 'secuestro google vietnam', 'seguridad de dominios', 'bloqueo de registrador']
---

En la mañana del 25 de febrero de 2015, el enlace más clicado en Internet para el mayor fabricante de PC del mundo apuntaba a una presentación de diapositivas de adolescentes aburridos mirando fijamente a sus cámaras web, con una canción de *High School Musical* de fondo. Nadie había hackeado un solo servidor de Lenovo. Nadie había robado una contraseña de Lenovo. Los atacantes nunca tocaron el edificio, la red o el sitio web en sí.

Cambiaron un solo registro en el registrador de dominios de la empresa, y eso fue suficiente para tomar el control de la puerta principal de Lenovo, redirigir su correo y convertir su marca en el hazmerreír de la tarde.

Este es el **Episodio 17 de Domain Mayday**: el secuestro de DNS de Lenovo.com. Es una historia pequeña según los números: unas pocas horas de inactividad, ningún sistema de producción violado, ninguna base de datos de clientes filtrada. Pero es una de las demostraciones más claras jamás realizadas de una lección en la que la mayoría de las empresas aún se equivocan: su dominio es tan seguro como el registrador que lo aloja, y ese registrador casi nunca está dentro de su programa de seguridad.

## Un gigante del hardware cuyo dominio es su rostro

Para 2015, Lenovo era el [mayor fabricante de PC del mundo](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer), enviando más computadoras portátiles y de escritorio que nadie en el mundo. Para una empresa de ese tamaño, lenovo.com no es un activo de marketing. Es el centro de carga de toda la operación: donde los clientes compran, donde llegan los tickets de soporte, donde fluyen los registros de garantía y, de manera crucial, el dominio detrás de cada dirección de correo electrónico `@lenovo.com` en la empresa.

Cuando una marca alcanza esa escala, el dominio deja de ser una dirección de sitio web y se convierte en infraestructura. Cada comunicado de prensa, cada caja minorista, cada firma de empleado, cada confirmación de pedido se enruta a través de él. Lo que significa que quien controle el DNS del dominio controla no solo el sitio web, sino la *verdad* sobre a dónde apunta lenovo.com, tanto para los navegadores como para los servidores de correo.

Ese es el premio que Lizard Squad buscaba. No el sitio web. El puntero hacia él.

## 25 de febrero de 2015: la extraña redirección

![Arte conceptual vívido y colorido de la fachada de vidrio de una empresa cuyo letrero iluminado ha sido cambiado de la noche a la mañana por una valla publicitaria de broma estridente, rosas neón y azules eléctricos, una multitud mirando hacia arriba con confusión, sin logotipos de marcas](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

A partir de esa tarde, los visitantes que escribían lenovo.com no llegaban a Lenovo. El sitio había sido reemplazado por una [presentación de fotos de cámaras web de niños sentados frente a su computadora](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), con miradas perdidas y ligeramente avergonzados, todo al ritmo de ["Breaking Free"](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) de *High School Musical*. The Register describió la misma escena como una [presentación de fotos de cámaras web de un joven con aspecto aburrido](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth) en lugar de los productos habituales de la empresa.

Era deliberadamente absurdo, y la absurdidad era el punto. Este no fue un robo de datos silencioso destinado a mantenerse oculto. Fue una humillación pública, escenificada en la URL más visible que poseía la empresa.

La atribución se escondía a plena vista. El HTML de la página de reemplazo daba crédito por su construcción "nueva y mejorada con una nueva marca" a [Ryan King y Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), dos nombres que los investigadores de Internet vincularon rápidamente con Lizard Squad, el mismo grupo que había pasado la temporada navideña anterior desconectando PlayStation Network y Xbox Live. El grupo se atribuyó el mérito en Twitter, citando la letra de *High School Musical* a Lenovo por si fuera poco.

Y luego se volvió peor que vergonzoso. Debido a que los atacantes controlaban el DNS de lenovo.com, no solo eran dueños del sitio web: eran dueños del correo. Como lo expresó un medio, el secuestro [significaba que también podía interceptar el correo electrónico de Lenovo](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), hasta que se desactivara la redirección. Lizard Squad publicó más tarde dos mensajes [enviados a empleados de Lenovo](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails) durante la ventana en la que mantuvo el control. Uno de ellos, con un sombrío sentido del humor, [se refería a una computadora portátil Lenovo Yoga que quedó "inservible" (bricked)](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked) cuando un cliente intentó ejecutar la propia herramienta de Lenovo para eliminar un software llamado Superfish.

Ese detalle es el motivo completo en una oración.

## El trasfondo de Superfish

Para entender por qué Lenovo específicamente, hay que retroceder cinco días.

Superfish era un adware que Lenovo había estado [incluyendo en algunas de sus computadoras desde septiembre de 2014](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014). A simple vista, era solo un inyector de anuncios: un software que introducía anuncios de compras adicionales en su navegador. Pero la forma en que funcionaba era catastrófica. Para inyectar anuncios en páginas cifradas, Superfish instalaba su propio certificado raíz para poder [introducir anuncios incluso en páginas cifradas](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages); en otras palabras, rompía el candado que protege el protocolo HTTPS.

Peor aún, el certificado usaba la misma clave privada en cada máquina, y esa clave era descifrable. Cualquier atacante que la extrajera podía hacerse pasar por *cualquier* sitio web HTTPS ante *cualquier* computadora portátil Lenovo que ejecutara Superfish. Esto no era una falla teórica. El [20 de febrero de 2015, el Departamento de Seguridad Nacional de los Estados Unidos aconsejó desinstalarlo](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it) junto con su certificado raíz.

Así que, en el lapso de una semana, una empresa que vendía seguridad y confianza a grandes corporaciones había enviado millones de computadoras portátiles con una vulnerabilidad *man-in-the-middle* incorporada, y luego vio cómo su propia herramienta de eliminación dejaba inservible la máquina de al menos un cliente. El secuestro de Lizard Squad se presentó como una protesta: una [cucharada de su propia medicina](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=sparked%20online%20uproar%20following%20the%20discovery%20of%20adware%20called%20Superfish) tras el escándalo de Superfish. La presentación de la cámara web fue puro teatro. El mensaje era: *ustedes rompieron el cifrado de sus clientes, así que nosotros romperemos su puerta principal por ustedes.*

## Cómo sucedió: el registrador era el punto débil

![Arte conceptual vívido y colorido de un panel de control secuestrado con diales e interruptores de enrutamiento brillantes, una mano sombría redirigiendo la puerta principal y las tuberías de correo de una marca hacia un nuevo camino iluminado con luces de neón, verde azulado eléctrico y magenta, sin logotipos de marcas](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

Aquí está la parte que debería quitarle el sueño a los CISO: la propia infraestructura de Lenovo nunca fue vulnerada.

Los atacantes fueron tras el registrador en su lugar. Los analistas de seguridad rastrearon el secuestro hasta un compromiso de **Web Commerce Communications**, mejor conocido como **Webnic.cc**, un registrador con sede en Malasia. Como lo expresó Help Net Security, los hackers no comprometieron los servidores de Lenovo; en su lugar, [comprometieron los de Web Commerce Communications (Webnic.cc)](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/), el registrador con el que estaba registrado el dominio de Lenovo.

Esta no era la primera mala semana de Webnic. Apenas dos días antes, el dominio vietnamita de Google había sido redirigido de la misma manera. SecurityWeek resumió la conexión sin rodeos: Lizard Squad [secuestró los registros DNS de Google Vietnam y Lenovo después de vulnerar los sistemas de WebNIC](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/), un registrador con sede en Malasia. Brian Krebs, citando a los investigadores que lo indagaron, informó que [ambos secuestros fueron posibles porque los atacantes tomaron el control de Webnic.cc](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=both%20hijacks%20were%20possible%20because%20the%20attackers%20seized%20control%20over%20Webnic.cc), un registrador que, según el mismo informe, servía a esos dos dominios y a otros 600,000.

La mecánica, según los informes de Krebs, se lee como un manual de por qué un registrador es un objetivo jugoso:

- **La forma de entrar.** Lizard Squad usó una [vulnerabilidad de inyección de comandos en Webnic.cc para cargar un rootkit](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit); dándoles un acceso persistente y oculto a los sistemas del registrador.
- **Las llaves maestras.** También [obtuvieron acceso al almacén de Webnic de](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of) "códigos de autorización" (auth codes), los secretos de transferencia EPP que pueden mover *cualquier* dominio a otro registrador.
- **La redirección.** Con control a nivel de registrador, cambiaron los registros del servidor de nombres (nameservers) de lenovo.com. The Register señaló que la [configuración del servidor de nombres del dominio se actualizó sospechosamente hoy para apuntar a servidores DNS pertenecientes a la empresa de alojamiento web CloudFlare](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare); usando Cloudflare para enmascarar el verdadero servidor de destino.
- **El robo de correo.** De manera crucial, no se detuvieron en el sitio web. Ellos [cambiaron los registros del servidor de correo permitiéndoles interceptar los mensajes](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) enviados a las direcciones de Lenovo. El DNS controla algo más que el registro `A`; controla también el registro `MX`. Ser dueño del dominio significaba ser dueño del correo.

Ese último punto es el que la gente olvida. Una desfiguración de un sitio web es ruidosa y obvia. La interceptación silenciosa del correo electrónico es la mitad peligrosa de un secuestro de DNS, y se deriva del mismo acto único de cambiar un registro en el registrador.

## Respuesta y consecuencias

Lenovo actuó rápido, porque había poco más que pudiera hacer: la solución residía en el registrador, no en sus propios servidores. La empresa confirmó que había sido [víctima de un ciberataque](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) cuyo efecto era redirigir el tráfico del sitio web de Lenovo, y [parecía haber restaurado el acceso completo a su sitio web público para la noche del 25 de febrero](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025). Cloudflare, al ver que su nombre se usaba en la cadena de redireccionamiento, bloqueó los servidores de nombres maliciosos, lo que también puso fin a la interceptación de correo electrónico.

La mayor limpieza pertenecía a Webnic. Un error de inyección de comandos de un solo registrador había puesto a dos de los dominios más valiosos de Internet (el de Lenovo y una propiedad de Google) en manos de un equipo de hackers impulsado por las acrobacias mediáticas en un lapso de 48 horas. El incidente se convirtió en un estudio de caso permanente sobre el riesgo de los registradores y un recordatorio de que "otros 600,000 dominios" se encontraban detrás del mismo sistema comprometido.

Para Lenovo, el daño duradero fue a su reputación. Tras los días de Superfish, el secuestro convirtió una grave falla de seguridad en una historia de dos actos: primero, la empresa rompió la confianza de sus propios clientes; luego, perdió visiblemente el control de su propio nombre. La presentación de la cámara web es lo que la gente recordó, pero el compromiso del registrador es lo que realmente importó.

## Lo que esto nos enseña: su registrador es su verdadero perímetro

La incómoda lección del EP17 es que Lenovo hizo la mayoría de las cosas bien en las partes que controlaba, y aun así fue secuestrado a través de la parte que no controlaba.

Algunas conclusiones que se pueden generalizar mucho más allá de 2015:

1. **El registrador se encuentra en su límite de confianza, lo trate de esa manera o no.** Usted puede fortalecer cada servidor que posea y aun así perder el dominio en un tercero al que probablemente nunca le haya hecho una revisión de seguridad. El atacante toma el camino de menor resistencia, y el registrador a menudo es más débil que usted.
2. **El control del DNS es el control del correo.** Un secuestro no es solo una página de inicio desfigurada. El mismo cambio de registro redirige silenciosamente el correo electrónico, permitiendo la interceptación, el restablecimiento de contraseñas contra su dominio y la suplantación de identidad. Trate el registro `MX` como un activo crítico de seguridad, no como una simple tubería.
3. **Bloquee lo que se pueda bloquear.** Los bloqueos de registrador (registrar-lock / `clientTransferProhibited`), el acceso restringido a los códigos EPP/autorización y los bloqueos a nivel de registro para dominios de alto valor existen precisamente para detener cambios no autorizados de servidores de nombres y transferencias. Son baratos. La desventaja de omitirlos es que su marca acabe en una presentación de cámaras web.
4. **DNSSEC eleva el costo.** No habría evitado la apropiación de una cuenta de registrador por sí solo, pero las zonas firmadas y el DNS monitoreado hacen que la manipulación silenciosa sea más difícil de lograr sin ser detectada.
5. **Supervise su propio DNS para detectar desviaciones.** El hecho de que los servidores de nombres de Lenovo cambiaran a un proveedor inesperado fue el indicio. El monitoreo continuo de los registros NS y MX convierte el "nos enteramos cuando los clientes vieron una presentación de diapositivas" en "recibimos una alerta cuando el registro cambió".

El tema en común: el control del dominio es un dominio de seguridad propio, y la mayoría de las empresas lo han subcontratado a un proveedor que nunca aparece en su modelo de amenazas.

## La perspectiva de Namefi

![Ilustración colorida de la propiedad de dominios verificable y resistente a manipulaciones: una tarjeta de dominio asegurada por un escudo verde, un token verde de Namefi y continuidad del DNS](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

El secuestro de Lenovo es, en su raíz, un problema de control y procedencia. El atacante no necesitaba *ser* Lenovo; solo necesitaba convencer al sistema que controla lenovo.com de apuntar a un lugar nuevo. No existía un registro sólido, independiente y verificable de quién controla legítimamente el dominio, solo una cuenta de registrador que podía ser dominada silenciosamente a través de una vulnerabilidad que nadie en Lenovo podía ver.

[Namefi](https://namefi.io) está construido sobre la idea de que los dominios deben comportarse como activos nativos de Internet con una propiedad verificable y resistente a las manipulaciones. Cuando el control de un dominio está anclado a una propiedad criptográfica que es auditable y difícil de anular silenciosamente (en lugar de una sola cuenta de registrador con un código de autorización recuperable), un intercambio no autorizado de servidor de nombres deja de ser una edición silenciosa en el *backend* y comienza a ser una ruptura visible y demostrable en la cadena de custodia. La propiedad tokenizada mantiene el dominio compatible con el DNS, mientras hace que la pregunta "¿quién controla este nombre y acaba de cambiar?" tenga una respuesta verificable.

Lizard Squad convirtió la puerta principal de un gigante del hardware en una broma en una tarde explotando el eslabón más débil de la cadena de propiedad. La defensa no es tener un sitio web más ruidoso. Es hacer que la *propiedad* del nombre en sí misma sea algo que un atacante no pueda falsificar de forma silenciosa.

## Fuentes y lecturas adicionales

- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- The Register — [Oh No, Lenovo! Lizard Squad on the attack, flashes swiped emails](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/)
- Engadget — [Lenovo's website hijacked, apparently by Lizard Squad](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)
- SecurityWeek — [Lizard Squad Hijacks Lenovo Website, Emails](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- BankInfoSecurity — [Lenovo Website Hijacked](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953)
- IT Security Guru — [Lizard Squad domain hijack gives control of Google Vietnam and Lenovo website](https://www.itsecurityguru.org/2015/02/26/lizard-squad-domain-hijack-gives-control-of-google-vietnam-and-lenovo-website/)
- CNBC — [Lenovo website breached, hacker group Lizard Squad claims responsibility](https://www.cnbc.com/2015/02/25/lenovo-website-breached-hacker-group-lizard-squad-claims-responsibility.html)
- We Live Security (ESET) — [Lenovo website hacked, Lizard Squad claims responsibility](https://www.welivesecurity.com/2015/02/26/lenovo-website-hacked-lizard-squad-claims-responsibility/)
- Computing — [Lenovo website hijacked by Lizard Squad after Superfish debacle](https://www.computing.co.uk/news/2397084/lenovo-website-hijacked-by-lizard-squad-after-superfish-debacle)
- Wikipedia — [Superfish](https://en.wikipedia.org/wiki/Superfish)
- CISA — [Lenovo Superfish Adware Vulnerable to HTTPS Spoofing](https://www.cisa.gov/news-events/alerts/2015/02/20/lenovo-superfish-adware-vulnerable-to-https-spoofing)