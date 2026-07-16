---
title: 'El Minuto de $12: Cuando Alguien Compró Google.com en Silencio'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
description: 'En septiembre de 2015, un exempleado de Google compró google.com a través de Google Domains por $12 y tuvo el control administrativo del dominio más valioso del mundo durante aproximadamente un minuto. La historia de Sanmay Ved, la recompensa de $6,006.13 y lo que un minuto de propiedad revela sobre quién controla realmente un dominio.'
keywords: ['dominio google.com', 'sanmay ved', 'bug google domains', 'seguridad de dominios', 'quién posee google.com', 'secuestro de dominio', 'acceso a herramientas de webmaster', 'recompensa de errores de google', 'recompensa 6006.13', 'vulnerabilidad de registro de dominio', 'control de dominio', 'seguridad dns', 'verificación de propiedad de dominio']
relatedArticles:
  - /es/blog/the-godaddy-multi-year-breach/
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-lenovo-com-dns-hijack/
  - /es/blog/the-sex-com-heist-the-forged-letter/
  - /es/blog/the-2024-squarespace-defi-domain-hijacks/
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
  - /es/glossary/tld/
  - /es/glossary/registry/
---

Durante aproximadamente un minuto en la noche del 29 de septiembre de 2015, la dirección más valiosa de internet no pertenecía a Google.

Pertenecía a un exempleado de Google llamado Sanmay Ved, quien acababa de comprar **google.com** por **$12**.

No irrumpió en nada. No explotó un desbordamiento de búfer ni realizó phishing a un administrador. Fue a la propia tienda de Google — Google Domains — escribió el dominio más famoso del mundo y vio cómo el proceso de compra hacía algo que nunca debería haber ocurrido: lo dejó pagar. Su tarjeta fue cargada. El pedido se completó. Y durante aproximadamente sesenta segundos, el titular del registro de google.com era un estudiante de posgrado en Massachusetts.

Esto es **Domain Mayday / 域名浩劫**, nuestra serie sobre los momentos en que la seguridad de los dominios falló públicamente. La mayoría de los episodios tratan sobre nombres robados por atacantes. Este es diferente — y más inquietante — porque nadie estaba atacando nada. El dominio más importante del planeta fue vendido, al precio de lista, a la primera persona que lo puso en un carrito de compras.

## Qué es normalmente google.com

Es difícil exagerar cuánto vale google.com, porque el número no es realmente un número.

Google.com es la puerta principal del motor de búsqueda más utilizado del planeta, el ancla de Gmail, Maps, Ads, los flujos de cuentas de YouTube y la columna vertebral de autenticación de miles de millones de personas. Slate, al cubrir el incidente, lo llamó ["el dominio con más tráfico del mundo"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.). Cualquiera sea el precio que se pagó por Tesla.com o Cars.com, google.com está en una categoría propia: no es un activo de marca, es *infraestructura* que una gran fracción de la población humana toca cada día.

Se supone que un dominio así es intocable. Debería estar bloqueado, marcado, retenido por el registro, en server-hold, con transferencia prohibida — envuelto en todas las protecciones que un [registrador](/es/glossary/registrar/) puede aplicar. La premisa misma de la seguridad de dominios es que cuanto más crítico es el nombre, más difícil es moverlo.

Y entonces, por $12, se movió.

## El minuto de $12

![Arte conceptual colorido y vívido de un globo brillante con forma de dominio que lleva una pequeña etiqueta de precio de doce dólares, una sola moneda que cae en una ranura de pago mientras un reloj de arena de un minuto comienza a correr](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Ved no estaba buscando problemas. Era un exgooglero — había trabajado en la empresa como Estratega de Cuentas años antes — y tarde en la noche estaba explorando Google Domains, el entonces nuevo servicio de registrador de Google, buscando nombres de dominio. Por capricho, escribió el más grande de todos.

En sus propias palabras, el resultado lo dejó helado: ["Escribí Google.com y para mi sorpresa aparecía como disponible,"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available) le dijo Ved a Business Insider. No "premium", no "hacer una oferta", no "este dominio está tomado". *Disponible.* Por la tarifa estándar de registro de $12.

Lo agregó a su carrito y completó la compra, esperando que el sistema lo rechazara. No lo hizo. La transacción se completó. Como lo resumió The Hacker News, un exgooglero había ["logrado comprar el dominio más visitado del mundo, Google.com, a través del propio servicio Domains de Google por solo $12."](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain)

Y entonces su bandeja de entrada comenzó a llenarse. Los sistemas que activan notificaciones basadas en la propiedad del dominio — los que envían alertas y controles a un propietario verificado — vieron un nuevo titular y comenzaron a hacer su trabajo. Security Affairs describió el momento: ["En pocos segundos, su bandeja de entrada y Google Webmaster Tools se llenaron de mensajes relacionados con webmaster que confirmaban la propiedad de los dominios de Google.com."](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded)

Durante ese minuto, Ved no solo figuraba como propietario en papel. La máquina lo trataba como el propietario.

## Qué controlas realmente en ese minuto

Esta es la parte que convierte una anécdota graciosa en una historia de seguridad.

Cuando eres el propietario verificado de un dominio en el ecosistema de Google, obtienes acceso a **Webmaster Tools** (ahora Search Console) — el panel que usan los propietarios de sitios para ver cómo se indexa una propiedad, enviar sitemaps, ver mensajes internos y gestionar cómo aparece el dominio en la búsqueda. Ved dijo más tarde que la implicación no se le escapó: ["La parte aterradora fue que tuve acceso a los controles de webmaster por un minuto,"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute) explicó.

Los informes de aquella época señalaban que durante esa ventana tenía ["acceso administrativo a Google.com"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=he%20had%20administrative%20access%20to%20Google.com) y que su ["panel de Google Search Console fue actualizado con mensajes para el dominio Google.com."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated) Piensa en lo que realmente permite alcanzar el hecho de poseer un dominio: registros [DNS](/es/glossary/dns/), enrutamiento de correo, la capacidad de demostrar "propiedad" ante terceros, y los controles del motor de búsqueda que deciden cómo se presenta una propiedad al mundo. El registro es la llave maestra. Todo lo que depende de él — DNS, certificados, correo electrónico, inicio de sesión único, indexación de búsqueda — asume que el titular es quien dice ser.

Ved actuó de manera responsable. No cambió un solo registro. Lo reportó de inmediato. Pero la lección permanece independientemente: la diferencia entre "un estudiante curioso" y "una catástrofe" no fue un control técnico. Fue la decisión de una persona de actuar honestamente.

## La respuesta de Google

![Arte conceptual colorido y vívido de una enorme llave brillante sostenida brevemente en una mano abierta, que luego es suavemente recuperada por un haz de luz, contra un cielo de placa de circuitos colorida con una moneda reembolsada flotando](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Los sistemas automatizados de Google detectaron la anomalía rápidamente. En aproximadamente un minuto, la orden fue revertida. Fox News informó la cancelación directamente: ["Google Domains canceló la venta un minuto después, indicando que alguien había registrado el sitio antes que él, y le reembolsó a Ved los $12."](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later) El "alguien" que lo había registrado primero, por supuesto, era el propio Google.

Luego Google hizo lo que convirtió esto en leyenda. A través de su Programa de Recompensas por Vulnerabilidades, pagó a Ved una recompensa — y la empresa eligió el número a propósito. En su revisión anual de seguridad de 2015, Google escribió: ["Nuestra recompensa económica inicial a Sanmay — $6,006.13 — deletreaba Google, numéricamente (¡entrecierra los ojos y lo verás!). Luego duplicamos esta cantidad cuando Sanmay donó su recompensa a la caridad."](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay) (Léelo como dígitos: 6-0-0-6-1-3 → G-O-O-G-L-E.)

Ved eligió donar el dinero. Pidió que fuera para la Fundación Art of Living India, que apoya escuelas gratuitas en toda la India — y cuando Google se enteró de la donación, duplicó el premio, llevando el total a aproximadamente **$12,012.26**. El propio framing de Ved sobre todo el episodio nunca fue sobre el pago. ["No me importa el dinero. Nunca se trató del dinero,"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money) le dijo a Business Insider.

Un error de $12 se convirtió en una historia sobre una recompensa ingeniosa, una donación generosa y una empresa que la igualó. Pero despojada de la buena voluntad, la realidad subyacente es cruda: un registrador entregó las llaves de su propio reino, y lo único que las recuperó fue una detección automática rápida — y un comprador que resultó ser honesto.

## ¿Cómo pudo escaparse un registro tan importante?

¿Cómo puede aparecer el dominio más protegido del mundo como "disponible por $12" en una tienda de autoservicio?

La respuesta honesta es que nadie fuera de Google tiene el postmortem interno completo, y no pretenderemos tenerlo. Pero la *forma* del fallo es familiar para cualquiera que haya trabajado con sistemas de dominios, y vale la pena ser precisos sobre lo que podemos y no podemos decir.

Lo que es verificable es el comportamiento visible. Los informes de aquella época mencionaron las dos explicaciones habituales: ["Podría haber sido un error en Google Domains o que la empresa simplemente no renovó su nombre de dominio cuando llegó el momento."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew) De cualquier manera, durante una breve ventana, la lógica de "¿está disponible este nombre para registrarse?" de la tienda devolvió una respuesta incorrecta para un nombre que debería haber estado codificado de forma fija como no vendible.

La lección más profunda es arquitectónica. La protección de un dominio es tan buena como el *camino más débil para modificarlo*. Un registro puede aplicar flags de server-hold y transferencia prohibida; un registrador puede bloquear un nombre; una organización puede habilitar autenticación multifactor y flujos de aprobación a nivel de registrador. Pero si alguna interfaz — una tienda minorista, una herramienta de administración interna, una anulación de soporte, un endpoint de API — puede mutar la propiedad sin que esas protecciones se activen, entonces el nombre es exactamente tan seguro como esa interfaz más débil. El radio de daño de una toma de dominio es enorme (DNS, correo electrónico, certificados, inicio de sesión), pero la superficie que lo desencadena puede ser pequeña: un formulario que debería haber dicho "no" y dijo "sí" en su lugar.

Esa asimetría es todo el problema. El valor en juego es máximo. La acción necesaria para moverlo puede ser mínima.

## Lo que esto enseña sobre el control de dominios

Del minuto de $12 se extraen algunas lecciones duraderas:

1. **El registro del titular es la llave maestra.** El DNS, los certificados TLS, la entregabilidad del correo electrónico y los flujos de "verifica que eres el propietario de este dominio" confían en el registro subyacente. Quien controla el registro controla todo lo que depende de él. Protege esa capa como la contraseña raíz que efectivamente es.

2. **La criticidad y la protección no se correlacionan automáticamente.** Uno asumiría que el dominio más importante del mundo es el más bloqueado. Durante un minuto, no lo fue. La importancia no se aplica por sí misma; los bloqueos explícitos, las retenciones y las puertas de aprobación sí lo hacen. Audítalos; no los asumas.

3. **El plano de control es más grande que el DNS.** Las personas aseguran sus servidores de nombres y olvidan la cuenta del registrador, el canal de soporte, el correo electrónico de facturación y las herramientas internas. Un dominio puede perderse a través de cualquier puerta que pueda reescribir la propiedad — no solo la que dice "DNS."

4. **A menudo estás a una persona honesta de distancia de un desastre.** Google tuvo suerte de que el comprador fuera un exempleado consciente de la seguridad que lo reportó de inmediato. La seguridad que depende de la buena voluntad de quien se tropieza con ella no es seguridad. El sistema, no el visitante, debería ser el que dice no.

5. **La detección rápida es un control real.** La detección automática de Google en aproximadamente un minuto limitó genuinamente el daño. No puedes prevenir todos los errores, pero el monitoreo estricto de los cambios de propiedad reduce la ventana en la que un desliz se convierte en una brecha.

La parte tranquilizadora de esta historia es que los sistemas de Google lo detectaron y revirtieron. La parte incómoda es que tuvieron que hacerlo.

## El enfoque de Namefi

![Ilustración colorida de propiedad de dominio verificable y resistente a la manipulación — una tarjeta de dominio asegurada por un escudo verde, un token verde de Namefi y continuidad de DNS](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

El minuto de $12 es, en esencia, una pregunta sobre un registro: *¿quién es el propietario verificado de este nombre ahora mismo, y qué tan difícil es cambiarlo en silencio?*

En el modelo tradicional, la respuesta vive dentro de la base de datos de un registrador, mutable a través de cualquier interfaz que exponga ese registrador — tienda minorista, anulación administrativa, ticket de soporte, API. La mayoría de esas interfaces están bien protegidas. Pero la propiedad solo es tan segura como la menos protegida, y el propietario generalmente no puede ver, en tiempo real, el momento en que su registro cambia de manos. Sanmay Ved supo que "poseía" google.com porque su bandeja de entrada se iluminó — no porque un libro mayor reforzado anunciara una transferencia verificada y autorizada.

[Namefi](https://namefi.io) parte de la premisa de que la propiedad de dominios debe ser **verificable y a prueba de manipulaciones**, no enterrada en una sola fila mutable. Al representar el control de dominio como un activo tokenizado y en cadena que sigue siendo compatible con el DNS, el acto de "quién posee este dominio" se convierte en algo que puedes verificar y auditar de forma independiente — y una transferencia se convierte en un evento explícito, autorizado y visible, en lugar de una compra que se completa silenciosamente. El objetivo no es hacer los dominios exóticos; es hacer que la llave maestra sea más difícil de entregar a la persona equivocada por accidente, e imposible de mover sin dejar rastro.

Google.com se recuperó en un minuto porque Google construyó una detección rápida sobre un primitivo frágil. La mejor respuesta es hacer que el primitivo en sí sea confiable: propiedad que puedes demostrar, transferencias que puedes ver y control que no depende de que un solo formulario recuerde decir "no."

## Fuentes y lectura adicional

- Google Online Security Blog — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1) (fuente primaria para la recompensa de $6,006.13 y la donación duplicada)
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/) (cita el blog de Google textualmente)
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- Fox News — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- Fox News — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- Yahoo Finance — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)
