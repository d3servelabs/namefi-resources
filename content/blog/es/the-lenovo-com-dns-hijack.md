---
title: 'El secuestro de DNS de Lenovo.com: cuando Lizard Squad tomó la puerta principal de un gigante del hardware'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
description: 'El 25 de febrero de 2015, Lizard Squad secuestró Lenovo.com comprometiendo al registrador Webnic, redirigiendo el dominio del mayor fabricante de PC del mundo hacia una presentación de diapositivas de webcam e interceptando su correo electrónico, días después del escándalo de Superfish. Un análisis en profundidad de Domain Mayday sobre por qué el registrador es tu verdadero perímetro de seguridad.'
keywords: ['secuestro dns lenovo.com', 'lizard squad', 'registrador webnic', 'web commerce communications', 'secuestro dns', 'superfish', 'seguridad registrador de dominios', 'compromiso de registrador', 'código auth epp', 'interceptación de correo electrónico', 'secuestro google vietnam', 'seguridad de dominios', 'bloqueo de registrador']
relatedArticles:
  - /es/blog/the-malaysia-airlines-dns-hijack/
  - /es/blog/the-godaddy-multi-year-breach/
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-panix-com-domain-hijack/
  - /es/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/name-change-game-change/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/dns/
  - /es/glossary/icann/
  - /es/glossary/registry/
  - /es/glossary/tld/
---

La mañana del 25 de febrero de 2015, el enlace más visitado en internet para el mayor fabricante de PC del mundo apuntaba a una presentación de diapositivas de adolescentes aburridos mirando fijamente sus webcams, acompañada de una canción de *High School Musical*. Nadie había pirateado ni un solo servidor de Lenovo. Nadie había robado ninguna contraseña de Lenovo. Los atacantes nunca tocaron el edificio, la red ni el sitio web en sí.

Cambiaron un registro en el [registrador](/es/glossary/registrar/) de dominios de la empresa — y eso fue suficiente para apoderarse de la puerta principal de Lenovo, redirigir su correo y convertir su marca en objeto de burla durante una tarde.

Este es **Domain Mayday EP17**: el secuestro de DNS de Lenovo.com. Es una historia pequeña en números — unas pocas horas de inactividad, ningún sistema de producción comprometido, ninguna base de datos de clientes filtrada. Pero es una de las demostraciones más nítidas que se han realizado de una lección que la mayoría de las empresas aún comete el error de ignorar: tu dominio es tan seguro como el registrador que lo mantiene, y ese registrador casi nunca forma parte de tu programa de seguridad.

## Un gigante del hardware cuyo dominio es su cara

Para 2015, Lenovo era el [mayor fabricante de PC del mundo](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer), enviando más portátiles y computadoras de escritorio que nadie en la Tierra. Para una empresa de ese tamaño, lenovo.com no es un activo de marketing. Es el centro estructural de toda la operación: donde los clientes compran, donde llegan los tickets de soporte, donde fluyen los registros de garantía y, de manera crucial, el dominio detrás de cada dirección de correo electrónico `@lenovo.com` de la empresa.

Cuando una marca alcanza esa escala, el dominio deja de ser una dirección de sitio web y se convierte en infraestructura. Cada comunicado de prensa, cada caja de venta, cada firma de empleado, cada confirmación de pedido pasa por él. Lo que significa que quien controla el DNS del dominio controla no solo el sitio web, sino la *verdad* sobre a dónde apunta lenovo.com — tanto para los navegadores como para los servidores de correo.

Ese es el premio que Lizard Squad buscaba. No el sitio web. El puntero hacia él.

## 25 de febrero de 2015: la extraña redirección

![Arte conceptual colorido y vívido de la fachada de vidrio de una corporación cuyo letrero iluminado ha sido reemplazado durante la noche por una valla publicitaria de broma estridente, rosas neón y azules eléctricos, una multitud mirando hacia arriba con confusión, sin logotipos de marca](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

A partir de esa tarde, los visitantes que escribían lenovo.com no llegaban a Lenovo. El sitio había sido reemplazado por una [presentación de diapositivas de fotos de webcam de adolescentes sentados frente a su computadora](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), con expresión vacía y ligeramente avergonzados, todo al compás de ["Breaking Free"](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) de *High School Musical*. The Register describió la misma escena como una [presentación de diapositivas de fotos de webcam de un joven de aspecto aburrido](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth) en lugar de los productos habituales de la empresa.

Era deliberadamente absurdo, y lo absurdo era el objetivo. Esto no era un robo silencioso de datos diseñado para pasar desapercibido. Era una humillación pública, escenificada en la URL más visible que tenía la empresa.

La atribución estaba a la vista de todos. El HTML de la página de reemplazo atribuía su construcción "renovada y mejorada" a [Ryan King y Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) — dos nombres que los internautas rápidamente vincularon a Lizard Squad, el mismo grupo que había pasado la temporada navideña anterior dejando fuera de servicio PlayStation Network y Xbox Live. El grupo se atribuyó la responsabilidad en Twitter, citando las letras de *High School Musical* de vuelta a Lenovo para mayor efecto.

Y luego las cosas empeoraron más allá de la vergüenza. Porque los atacantes controlaban el DNS de lenovo.com, no solo eran dueños del sitio web — eran dueños del correo. Como señaló un medio, el secuestro [significaba que podía interceptar el correo electrónico de Lenovo también](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), hasta que la redirección fue desactivada. Lizard Squad posteriormente publicó dos mensajes [enviados a empleados de Lenovo](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails) durante la ventana de tiempo en que tuvo el control. Uno de ellos, con un siniestro humor irónico, [hacía referencia a un portátil Lenovo Yoga que quedó "bloqueado"](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked) cuando un cliente intentó usar la propia herramienta de Lenovo para eliminar un software llamado Superfish.

Ese detalle resume todo el motivo en una sola frase.

## El trasfondo de Superfish

Para entender por qué Lenovo específicamente, hay que retroceder cinco días.

Superfish era un adware que Lenovo había estado [incluyendo con algunas de sus computadoras desde septiembre de 2014](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014). A simple vista era solo un inyector de anuncios — software que insertaba anuncios de compras adicionales en tu navegador. Pero la forma en que funcionaba era catastrófica. Para inyectar anuncios en páginas cifradas, Superfish instalaba su propio certificado raíz para poder [introducir anuncios incluso en páginas cifradas](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages) — en otras palabras, rompía el candado que protege HTTPS.

Peor aún, el certificado usaba la misma [clave privada](/es/glossary/private-key/) en todas las máquinas, y esa clave era descifrable. Cualquier atacante que la extrajera podía hacerse pasar por *cualquier* sitio web HTTPS ante *cualquier* portátil Lenovo que ejecutara Superfish. No era un fallo teórico. El [20 de febrero de 2015, el Departamento de Seguridad Nacional de los Estados Unidos recomendó desinstalarlo](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it) junto con su certificado raíz.

Así que en el transcurso de una semana, una empresa que vendía seguridad y confianza a empresas había enviado millones de portátiles con una vulnerabilidad de intermediario integrada, y luego vio cómo su propia herramienta de eliminación dejó inutilizable al menos la máquina de un cliente. El secuestro de Lizard Squad se presentó como una protesta — [un golpe con su propia medicina](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=sparked%20online%20uproar%20following%20the%20discovery%20of%20adware%20called%20Superfish) tras el escándalo de Superfish. La presentación de diapositivas de webcam era teatro. El mensaje era: *rompiste el cifrado para tus clientes, así que nosotros romperemos tu puerta principal por ti.*

## Cómo ocurrió: el registrador era el punto débil

![Arte conceptual colorido y vívido de un panel de control secuestrado con diales y switches brillantes, una mano en la sombra redirigiendo la puerta principal de una marca y sus conductos de correo por un nuevo camino iluminado en neón, verde azulado eléctrico y magenta, sin logotipos de marca](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

Esta es la parte que debería mantener despiertos a los CISOs: la propia infraestructura de Lenovo nunca fue comprometida.

Los atacantes fueron tras el registrador en su lugar. Los analistas de seguridad rastrearon el secuestro hasta el compromiso de **Web Commerce Communications** — más conocido como **Webnic.cc**, un registrador con sede en Malasia. Como señaló Help Net Security, los hackers no comprometieron los servidores de Lenovo; en cambio, [comprometieron los de Web Commerce Communications (Webnic.cc)](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/), el registrador en el que estaba registrado el dominio de Lenovo.

Esta no era la primera mala semana de Webnic. Solo dos días antes, el dominio vietnamita de Google había sido redirigido de la misma manera. SecurityWeek resumió la conexión sin rodeos: Lizard Squad [secuestró los registros DNS de Google Vietnam y Lenovo tras vulnerar los sistemas de WebNIC](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/), un registrador con sede en Malasia. Brian Krebs, citando a los investigadores que lo analizaron, informó que [ambos secuestros fueron posibles porque los atacantes tomaron el control de Webnic.cc](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=both%20hijacks%20were%20possible%20because%20the%20attackers%20seized%20control%20over%20Webnic.cc) — un registrador que, según ese mismo informe, servía esos dos dominios y otros 600 000 más.

La mecánica, según el informe de Krebs, se lee como un manual de por qué un registrador es un objetivo muy apetecible:

- **La vía de entrada.** Lizard Squad utilizó una [vulnerabilidad de inyección de comandos en Webnic.cc para cargar un rootkit](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — dándoles acceso persistente y oculto a los sistemas del registrador.
- **Las llaves maestras.** También [obtuvieron acceso al almacén de](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of) "auth codes" de Webnic — los secretos de transferencia EPP que pueden mover *cualquier* dominio a otro registrador.
- **La redirección.** Con control a nivel de registrador, cambiaron los registros de servidores de nombres de lenovo.com. The Register señaló que la [configuración de servidores de nombres del dominio fue actualizada de manera sospechosa ese día para apuntar a servidores DNS pertenecientes a la empresa de alojamiento web Cloudflare](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare) — usando Cloudflare para enmascarar el verdadero servidor de destino.
- **La captura del correo.** De manera crucial, no se detuvieron en el sitio web. [Cambiaron los registros del servidor de correo permitiéndoles interceptar los mensajes](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) enviados a las direcciones de Lenovo. El DNS controla más que el registro `A`; también controla el registro `MX`. Ser dueño del dominio significaba ser dueño del correo.

Ese último punto es el que la gente olvida. Una desfiguración es ruidosa y obvia. La interceptación silenciosa de correo electrónico es la mitad peligrosa de un secuestro de DNS — y se deriva del mismo acto único de cambiar un registro en el registrador.

## Respuesta y consecuencias

Lenovo actuó rápido, porque había poco más que pudiera hacer — la solución estaba en el registrador, no en sus propios servidores. La empresa confirmó que había sido [víctima de un ciberataque](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) cuyo efecto fue redirigir el tráfico del sitio web de Lenovo, y [al parecer había restaurado el acceso completo a su sitio web público para la tarde del 25 de febrero](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025). Cloudflare, al descubrir que su nombre estaba siendo utilizado en la cadena de redirección, desconectó los servidores de nombres maliciosos, lo que también puso fin a la interceptación de correo electrónico.

La limpieza más importante correspondía a Webnic. Un único fallo de inyección de comandos en un registrador había puesto dos de los dominios más valiosos de internet — el de Lenovo y una propiedad de Google — en manos de un grupo de hackers orientado a las travesuras en un intervalo de 48 horas. El incidente se convirtió en un caso de estudio permanente sobre el riesgo del registrador, y un recordatorio de que "600 000 otros dominios" estaban detrás del mismo sistema comprometido.

Para Lenovo, el daño duradero fue reputacional. Llegando días después de Superfish, el secuestro convirtió un grave fallo de seguridad en una historia en dos actos: primero la empresa traicionó la confianza de sus propios clientes, luego perdió visiblemente el control de su propio nombre. La presentación de diapositivas de webcam es lo que la gente recordó, pero el compromiso del registrador es lo que realmente importó.

## Lo que esto enseña: tu registrador es tu verdadero perímetro

La incómoda lección del EP17 es que Lenovo hizo la mayoría de las cosas bien en las partes que controlaba, y aun así fue secuestrado a través de la parte que no controlaba.

Algunas conclusiones que se generalizan mucho más allá de 2015:

1. **El registrador está dentro de tu límite de confianza lo trates así o no.** Puedes reforzar todos los servidores que posees y aun así perder el dominio en un tercero que probablemente nunca hayas auditado desde el punto de vista de la seguridad. El atacante toma el camino de menor resistencia — y el registrador suele ser más blando que tú.
2. **El control del DNS es el control del correo.** Un secuestro no es solo una página de inicio desfigurada. El mismo cambio de registro redirige silenciosamente el correo electrónico, permitiendo la interceptación, el restablecimiento de contraseñas contra tu dominio y la suplantación de identidad. Trata el registro `MX` como un activo crítico de seguridad, no como fontanería.
3. **Bloquea lo que se puede bloquear.** Los bloqueos de registrador (registrar-lock / `clientTransferProhibited`), el acceso restringido a los códigos EPP/auth y los bloqueos a nivel de registro para dominios de alto valor existen precisamente para evitar cambios no autorizados de servidores de nombres y transferencias. Son económicos. La consecuencia de omitirlos es que tu marca aparezca en una presentación de diapositivas de webcam.
4. **[DNSSEC](/es/glossary/dnssec/) eleva el costo.** Por sí solo no habría detenido una toma de control de cuenta del registrador, pero las zonas firmadas y el DNS monitorizado hacen que la manipulación silenciosa sea más difícil de ejecutar sin ser detectada.
5. **Monitoriza tu propio DNS para detectar desviaciones.** El hecho de que los servidores de nombres de Lenovo cambiaran a un proveedor inesperado fue la señal de alerta. El monitoreo continuo de los registros NS y MX transforma "nos enteramos cuando los clientes vieron una presentación de diapositivas" en "recibimos una alerta cuando cambió el registro."

El tema común: el control de dominios es un dominio de seguridad propio, y la mayoría de las empresas lo han externalizado a un proveedor que nunca aparece en su modelo de amenazas.

## El ángulo de Namefi

![Ilustración colorida de una propiedad de dominio verificable y resistente a manipulaciones — una tarjeta de dominio asegurada por un escudo verde, un token verde de Namefi y continuidad de DNS](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

El secuestro de Lenovo es, en esencia, un problema de control y procedencia. El atacante no necesitaba *ser* Lenovo; solo necesitaba convencer al sistema que controla lenovo.com de que apuntara a algún lugar nuevo. No existía un registro sólido, independiente y verificable de quién controla legítimamente el dominio — solo una cuenta de registrador que podía ser silenciosamente superada mediante una vulnerabilidad que nadie en Lenovo podía ver.

[Namefi](https://namefi.io) está construido alrededor de la idea de que los dominios deben comportarse como activos nativos de internet con una propiedad verificable y resistente a manipulaciones. Cuando el control de un dominio está anclado a una propiedad criptográfica que es auditable y difícil de anular silenciosamente — en lugar de una única cuenta de registrador con un código auth recuperable — un intercambio no autorizado de servidores de nombres deja de ser una edición silenciosa en el backend y se convierte en una ruptura visible y demostrable en la cadena de custodia. La propiedad tokenizada mantiene el dominio compatible con DNS mientras hace que "¿quién controla este nombre y acaba de cambiar?" sea una pregunta con una respuesta verificable.

Lizard Squad convirtió la puerta principal de un gigante del hardware en una broma en una tarde explotando el eslabón más débil de la cadena de propiedad. La defensa no es un sitio web más ruidoso. Es hacer que la *propiedad* del nombre en sí sea algo que un atacante no pueda falsificar silenciosamente.

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
