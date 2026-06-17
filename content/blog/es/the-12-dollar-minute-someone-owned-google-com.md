---
title: 'El minuto de $12: Cuando alguien compró Google.com silenciosamente'
date: '2026-06-17'
language: es
tags: ['dominios', 'seguridad', 'dns', 'seguridad-de-dominios']
authors: ['namefiteam']
draft: false
description: 'En septiembre de 2015, un exempleado de Google compró google.com a través de Google Domains por $12 y tuvo el control administrativo del dominio más valioso del mundo durante aproximadamente un minuto. La historia de Sanmay Ved, la recompensa de $6,006.13 y lo que un minuto de propiedad revela sobre quién controla realmente un dominio.'
keywords: ['dominio google.com', 'sanmay ved', 'error de google domains', 'seguridad de dominios', 'quien es dueño de google.com', 'secuestro de dominio', 'acceso a herramientas para webmasters', 'recompensa por errores de google', 'recompensa 6006.13', 'vulnerabilidad en el registro de dominios', 'control de dominio', 'seguridad dns', 'verificación de propiedad de dominio']
---

Durante aproximadamente un minuto en la noche del 29 de septiembre de 2015, la dirección más valiosa de Internet no pertenecía a Google.

Pertenecía a un exempleado de Google llamado Sanmay Ved, quien acababa de comprar **google.com** por **$12**.

No irrumpió en el sistema. No explotó un desbordamiento de búfer ni hizo *phishing* a un administrador. Entró a la propia tienda minorista de Google —Google Domains—, escribió el dominio más famoso del mundo y observó cómo el proceso de pago hacía algo que nunca debió haber hecho: le permitió pagar. Su tarjeta fue procesada. El pedido se completó. Y, durante aproximadamente sesenta segundos, el registrante oficial de google.com fue un estudiante de posgrado en Massachusetts.

Este es **Domain Mayday / 域名浩劫**, nuestra serie sobre los momentos en que la seguridad de los dominios falló en público. La mayoría de los episodios tratan sobre nombres robados por atacantes. Este es diferente —y más inquietante— porque nadie estaba atacando nada. El dominio más importante del planeta se vendió, al precio de catálogo, a la primera persona que lo puso en un carrito de compras.

## Lo que google.com es normalmente

Es difícil exagerar lo que vale google.com, porque el número en realidad no es un simple número.

Google.com es la puerta de entrada al motor de búsqueda más utilizado del planeta, el ancla de los flujos de cuentas de Gmail, Maps, Ads y YouTube, y la columna vertebral de autenticación para miles de millones de personas. Slate, al cubrir el incidente, lo llamó ["el dominio con más tráfico del mundo"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.). Sea cual sea el precio por el que se vendieron Tesla.com o Cars.com, google.com está en una categoría única: no es un activo de marca, es *infraestructura* que una gran parte de la población humana toca todos los días.

Un dominio como ese debería ser intocable. Debería estar bloqueado, marcado, retenido por el registro, en *server-hold*, con prohibición de transferencia —envuelto en cada protección que un registrador pueda aplicar—. Toda la premisa de la seguridad de los dominios es que cuanto más crítico es el nombre, más difícil es moverlo.

Y entonces, por $12, se movió.

## El minuto de $12

![Vivid colorful concept art of a glowing globe-shaped domain wearing a tiny twelve-dollar price tag, a single coin dropping into a checkout slot as a one-minute hourglass begins to run](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Ved no estaba buscando problemas. Era un ex-Googler —había trabajado en la empresa como Estratega de Cuentas años antes— y, a altas horas de la noche, estaba explorando Google Domains, el entonces nuevo servicio de registro de Google, mirando nombres de dominio. Por un capricho, escribió el más grande de todos.

Según él mismo relata, el resultado lo dejó paralizado: ["Escribí Google.com y, para mi sorpresa, aparecía como disponible"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available), dijo Ved a Business Insider. No decía "premium", ni "haz una oferta", ni "este dominio está ocupado". *Disponible.* Por la tarifa estándar de registro de $12.

Lo añadió a su carrito e inició el pago, esperando totalmente que el sistema lo rechazara. No lo hizo. La transacción se completó. Como resumió The Hacker News, un ex-Googler había ["logrado comprar el dominio más visitado del mundo, Google.com, a través del propio servicio Domains de Google por solo $12"](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain).

Y entonces su bandeja de entrada comenzó a llenarse. Los sistemas que dependen de la propiedad del dominio —los que envían alertas y controles a un propietario de dominio verificado— vieron a un nuevo registrante y comenzaron a hacer su trabajo. Security Affairs describió el momento: ["En pocos segundos, su bandeja de entrada y Google Webmaster Tools se inundaron de mensajes relacionados con webmasters que confirmaban la propiedad de los dominios de Google.com"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded).

Durante ese minuto, Ved no solo figuraba como propietario en el papel. La máquina lo trataba como el propietario.

## Lo que realmente controlas en ese minuto

Esta es la parte que convierte una anécdota divertida en una historia de seguridad.

Cuando eres el propietario verificado de un dominio en el ecosistema de Google, obtienes acceso a **Webmaster Tools** (ahora Search Console), el panel de control que usan los propietarios de sitios para ver cómo se indexa una propiedad, enviar mapas de sitio, ver mensajes internos y administrar cómo aparece el dominio en las búsquedas. Más tarde, Ved dijo que no pasó por alto lo que esto implicaba: ["La parte aterradora fue que tuve acceso a los controles para webmasters durante un minuto"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute), explicó.

Los reportes de la época señalaron que durante ese periodo tuvo ["acceso administrativo a Google.com"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=he%20had%20administrative%20access%20to%20Google.com) y que su ["panel de control de Google Search Console se actualizó con mensajes para el dominio Google.com"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated). Piense en lo que la propiedad de un dominio le permite alcanzar en realidad: registros DNS, enrutamiento de correo, la capacidad de demostrar la "propiedad" ante terceros y los controles del motor de búsqueda que deciden cómo se presenta una propiedad al mundo. El registro es la llave maestra. Todo lo que sigue —DNS, certificados, correo electrónico, inicio de sesión único, indexación de búsquedas— asume que el registrante es quien dice ser.

Ved hizo lo correcto. No cambió ni un solo registro. Lo reportó de inmediato. Pero la lección sigue ahí sin importar qué: la diferencia entre "un estudiante curioso" y "una catástrofe" no fue un control técnico. Fue la elección de una persona de comportarse bien.

## La detección de Google y su respuesta

![Vivid colorful concept art of a giant glowing key held briefly in an open hand, then gently pulled back by a beam of light, against a colorful circuit-board sky with a refunded coin floating away](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Los sistemas automatizados de Google detectaron la anomalía rápidamente. En aproximadamente un minuto, el pedido fue revertido. Fox News informó sobre la cancelación con claridad: ["Google Domains canceló la venta un minuto después, diciendo que alguien había registrado el sitio antes de que él pudiera hacerlo, y le reembolsó a Ved los $12"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later). El "alguien" que lo había registrado primero, por supuesto, era el propio Google.

Luego Google hizo lo que convirtió esto en leyenda. A través de su Programa de Recompensas por Vulnerabilidades, le pagó a Ved una recompensa, y la compañía eligió la cifra a propósito. En su revisión oficial del año de seguridad de 2015, Google escribió: ["Nuestra recompensa financiera inicial para Sanmay —$6,006.13— deletreaba Google, numéricamente (¡entrecierra un poco los ojos y lo verás!). Luego duplicamos esta cantidad cuando Sanmay donó su recompensa a la caridad"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay). (Léalo como dígitos: 6-0-0-6-1-3 → G-O-O-G-L-E).

Ved optó por regalar el dinero. Pidió que se destinara a la Fundación El Arte de Vivir de la India (Art of Living India Foundation), que apoya escuelas gratuitas en toda la India; y cuando Google se enteró de la donación, duplicó el premio, llevando el total a aproximadamente **$12,012.26**. El propio enfoque de Ved sobre todo el episodio nunca se trató del pago. ["No me importa el dinero. Nunca se trató del dinero"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money), le dijo a Business Insider.

Un error de $12 se convirtió en una historia sobre una recompensa inteligente, una donación generosa y una empresa que la igualó. Pero al quitar la buena voluntad, el hecho subyacente es crudo: un registrador entregó las llaves de su propio reino, y lo único que las recuperó fue una rápida detección automatizada y un comprador que resultó ser honesto.

## ¿Cómo es que un registro tan importante se cuela?

¿Cómo es que el dominio más protegido del planeta aparece como "disponible por $12" en un proceso de pago de autoservicio?

La respuesta honesta es que nadie fuera de Google tiene el informe completo del análisis interno, y no fingiremos tenerlo. Pero la *forma* de la falla le resulta familiar a cualquiera que haya trabajado con sistemas de dominios, y vale la pena ser precisos sobre lo que podemos y no podemos decir.

Lo que es verificable es el comportamiento visible. Los informes de la época plantearon las dos explicaciones habituales: ["Pudo haber sido un error en Google Domains o la compañía simplemente olvidó renovar su nombre de dominio cuando llegó el momento"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew). De cualquier manera, durante una breve ventana de tiempo, la lógica de "¿está disponible este nombre para registrarse?" de la tienda arrojó la respuesta equivocada para un nombre que debería haber estado programado (*hard-coded*) como invendible.

La lección más profunda es arquitectónica. La protección de un dominio es tan buena como *el camino más débil para cambiarlo*. Un registro (registry) puede aplicar bloqueos a nivel de servidor (*server-hold*) y prohibiciones de transferencia (*transfer-prohibited*); un registrador (registrar) puede bloquear un nombre; una organización puede habilitar la autenticación multifactor y flujos de aprobación a nivel de registrador. Pero si cualquier interfaz única —un proceso de pago en la tienda, una herramienta de administración interna, una anulación por parte del soporte técnico o un *endpoint* de API— puede mutar la propiedad sin que se activen esas protecciones, entonces el nombre es exactamente tan seguro como esa única interfaz más débil. El radio de impacto de una toma de control de dominio es enorme (DNS, correo electrónico, certificados, inicios de sesión), pero la superficie que la desencadena puede ser diminuta: un formulario que debería haber dicho "no" y en su lugar dijo "sí".

Esa asimetría es el problema principal. El valor en juego es máximo. La acción requerida para moverlo puede ser mínima.

## Lo que esto nos enseña sobre el control de dominios

Del minuto de $12 surgen algunas lecciones duraderas:

1. **El registro del registrante es la llave maestra.** DNS, los certificados TLS, la capacidad de entrega de correo electrónico y los flujos de "verifique que es propietario de este dominio" confían en el registro subyacente. Quien controla el registro, controla todo lo que depende de él. Proteja esa capa como la contraseña *root* que efectivamente es.

2. **La criticidad y la protección no están correlacionadas automáticamente.** Uno asumiría que el dominio más importante del mundo es el más blindado. Por un minuto, no lo estuvo. La importancia no se impone por sí sola; los bloqueos explícitos, las retenciones y los controles de aprobación sí lo hacen. Audítelos; no los asuma.

3. **El plano de control es más grande que el DNS.** La gente asegura sus servidores de nombres y olvida la cuenta del registrador, el canal de soporte, el correo electrónico de facturación y las herramientas internas. Un dominio puede perderse a través de cualquier puerta que pueda reescribir la propiedad, no solo la etiquetada como "DNS".

4. **A menudo estás a una persona honesta de distancia del desastre.** Google tuvo suerte de que el comprador fuera un exempleado con mentalidad de seguridad que lo reportó al instante. La seguridad que depende de la buena voluntad de quien se topa con ella, no es seguridad. El sistema, no el visitante, debe ser el que diga "no".

5. **La detección rápida es un control real.** La detección automatizada de aproximadamente un minuto por parte de Google genuinamente limitó el daño. No puedes prevenir todos los errores, pero un monitoreo estricto sobre los cambios de propiedad reduce la ventana en la que un tropiezo se convierte en una brecha.

La parte tranquilizadora de esta historia es que los sistemas de Google se dieron cuenta y lo revirtieron. La parte incómoda es que tuvieron que hacerlo.

## La perspectiva de Namefi

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

El minuto de $12 es, en el fondo, una pregunta sobre un registro: *¿quién es el propietario verificado de este nombre en este momento, y qué tan difícil es cambiar eso silenciosamente?*

En el modelo tradicional, la respuesta vive dentro de la base de datos de un registrador, y es mutable a través de las interfaces que dicho registrador exponga: la página de compra, la anulación del administrador, un *ticket* de soporte, la API. La mayoría de esas interfaces están bien vigiladas. Pero la propiedad es tan segura como la interfaz menos vigilada, y el propietario generalmente no puede ver, en tiempo real, el momento en que su registro cambia de manos. Sanmay Ved se enteró de que era el "dueño" de google.com porque su bandeja de entrada se iluminó, no porque un libro mayor inmutable anunciara una transferencia verificada y autorizada.

[Namefi](https://namefi.io) parte de la premisa de que la propiedad del dominio debe ser **verificable y a prueba de manipulaciones** (*tamper-evident*), y no estar oculta en una sola fila mutable. Al representar el control del dominio como un activo tokenizado en la cadena de bloques (*on-chain*) que se mantiene compatible con DNS, el acto de saber "quién es dueño de este dominio" se convierte en algo que puedes verificar y auditar de forma independiente; y una transferencia se convierte en un evento explícito, autorizado y visible, en lugar de un proceso de pago que se completa silenciosamente. El objetivo no es hacer que los dominios sean exóticos; es hacer que la llave maestra sea más difícil de entregar a la persona equivocada por accidente, e imposible de mover sin dejar un rastro.

Google.com se recuperó en un minuto porque Google construyó una detección rápida sobre una primitiva frágil. La mejor respuesta es hacer que la primitiva en sí misma sea confiable: una propiedad que puedas probar, transferencias que puedas ver y un control que no dependa de que un único formulario recuerde decir "no".

## Fuentes y lecturas adicionales

- Google Online Security Blog — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1) (fuente principal de la recompensa de $6,006.13 y la donación duplicada)
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/) (cita textualmente el blog de Google)
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- Fox News — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- Fox News — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- Yahoo Finance — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)