---
title: 'El secuestro del dominio Panix.com: Cómo una regla de aprobación automática de cinco días robó al proveedor de internet más antiguo de Nueva York'
date: '2026-06-17'
language: es
tags: ['dominios', 'seguridad', 'dns', 'seguridad-de-dominios']
authors: ['namefiteam']
draft: false
description: 'En enero de 2005, panix.com (el dominio del proveedor de internet comercial más antiguo de Nueva York) fue transferido de manera fraudulenta a un registrador en Australia utilizando tarjetas de crédito robadas, dejando fuera de línea la web y el correo electrónico durante días. Las reglas de transferencia entre registradores de la época, que se aprobaban automáticamente, lo hicieron posible, y su posterior solución redefinió la política de transferencia de dominios.'
keywords: ['panix.com', 'secuestro del dominio panix', 'secuestro de dominios', 'transferencia entre registradores', 'Melbourne IT', 'Dotster', 'Fibranet', 'política de transferencia de ICANN', 'bloqueo del registrador', 'clientTransferProhibited', 'seguridad de dominios', 'secuestro de DNS', 'código de autorización EPP']
---

Durante más de quince años, uno de los proveedores de internet comerciales más antiguos de los Estados Unidos vivió en una sola dirección: **panix.com**. Luego, durante un largo fin de semana festivo en enero de 2005, alguien se la arrebató.

No fue hackeando un servidor. Tampoco adivinando una contraseña. Llenaron un formulario de transferencia, pagaron con una tarjeta de crédito robada y esperaron a que una flamante regla de la ICANN hiciera el resto. En cuestión de horas, la propiedad de panix.com se había trasladado a una empresa en Australia, sus DNS apuntaban a un servidor en el Reino Unido y su correo electrónico se redirigía a través de Canadá; todo esto mientras las personas que realmente administraban Panix dormían la noche de un sábado, sin haber recibido advertencia alguna.

Esta es la historia de cómo un trámite administrativo, no un exploit de seguridad, secuestró al proveedor de servicios de internet (ISP) más antiguo de Nueva York, y de cómo la recuperación posterior ayudó a reescribir las reglas que rigen quién tiene permitido mover un dominio.

## Un ISP pionero cuyo negocio entero vivía en un solo dominio

Panix (Public Access Networks Corporation) no era un caso aislado. Fundado en 1989, fue, según Wikipedia, el [tercer ISP más antiguo del mundo después de The World y NetCom](https://en.wikipedia.org/wiki/Panix_(ISP)#:~:text=third%2Doldest%20ISP%20in%20the%20world%20after%20The%20World%20and%20NetCom). Era un pilar fundamental de los inicios del internet comercial en la ciudad de Nueva York: ofrecía cuentas shell, correo electrónico, alojamiento web, y las conexiones por línea conmutada (dial-up) y luego de banda ancha que miles de neoyorquinos utilizaban para conectarse a la red.

Y al igual que casi cualquier negocio de internet entonces y ahora, la identidad de Panix *era* su dominio. Los buzones de correo de los clientes terminaban en `@panix.com`. Los servidores web respondían a `www.panix.com`. Toda la empresa (su marca, su accesibilidad, lo que hacía que el correo electrónico de un cliente realmente llegara a su destino) pendía de los registros DNS vinculados a un solo nombre. Si pierdes el control de ese nombre, no solo pierdes un activo de marketing: pierdes el sistema nervioso del negocio.

Eso fue exactamente lo que sucedió.

## Enero de 2005: la transferencia fraudulenta

El registro legal es preciso respecto al día. Tal como lo resumió el bufete de abogados Davis Wright Tremaine en su momento: [el viernes 14 de enero de 2005, ocurrió un secuestro de alto perfil cuando el nombre de dominio "panix.com", propiedad del proveedor de servicios de internet del mismo nombre con sede en Nueva York, fue transferido sin autorización a un tercero](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=On%20Friday%2C%20Jan.%2014%2C%202005%2C%20a%20high%2Dprofile%20hijacking%20occurred).

Para la madrugada de ese fin de semana, las consecuencias ya estaban en marcha. *The Register*, al informar sobre el incidente mientras se desarrollaba, describió la redirección en una oración que todavía se lee como el esquema de un asalto a mano armada: [la propiedad de panix.com se trasladó a una empresa en Australia, los registros DNS reales se movieron a una compañía en el Reino Unido, y el correo de Panix.com fue redirigido a otra empresa más en Canadá](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=The%20ownership%20of%20panix.com%20was%20moved%20to%20a%20company%20in%20Australia).

*Slashdot*, medio a través del cual la noticia llegó a la comunidad técnica en general el 16 de enero, lo expresó sin rodeos: [a Panix, el proveedor de internet comercial más antiguo de Nueva York, le fue secuestrado su nombre de dominio 'panix.com' por personas desconocidas](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked).

El detalle más condenatorio, desde el punto de vista de Panix, fue el silencio. La empresa, [establecida en 1989 y el ISP comercial más antiguo de Nueva York, dijo que ni ella ni su registrador recibieron notificación alguna sobre los cambios propuestos](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=neither%20it%20nor%20its%20registrar%20received%20any%20notification%20of%20the%20proposed%20changes). La transferencia que se llevó el dominio fue, hasta donde el propietario legítimo podía saber, completamente invisible hasta que ya se había consumado.

## La interrupción: web y correo electrónico caídos durante días

![Vibrante y colorido arte conceptual de la escritura de una casa siendo discretamente registrada de nuevo a un extraño en el extranjero mientras el dueño legítimo duerme, un brillante título de papel deslizándose sobre un océano hacia un escritorio extranjero sellado a medianoche](../../assets/the-panix-com-domain-hijack-01-hijack.jpg)

Un dominio secuestrado no es un interruptor que simplemente se apaga o se enciende; es un desvanecimiento lento y desagradable, y el peor daño se lo lleva el correo electrónico.

Cuando controlas los DNS de un dominio, controlas dónde se entrega su correo. Al reorientar los registros de correo de panix.com, los secuestradores se convirtieron en la oficina de correos de toda la base de clientes del ISP. Los mensajes entrantes (facturas, restablecimientos de contraseñas, correspondencia corporativa, correo personal) dejaron de llegar a Panix y comenzaron a fluir hacia un servidor controlado por los atacantes. *InfoWorld*, informando después de que se asentara el polvo, señaló que el secuestro [privó a algunos clientes de Panix de acceso a su correo electrónico durante dos días](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html), y que algunos de esos clientes podrían haber perdido cien o más mensajes durante ese fin de semana.

El correo mal enrutado durante un secuestro no es solo un retraso. Gran parte de él se pierde: es rebotado, descartado o devorado silenciosamente por un servidor que nunca debió recibirlo. Para un proveedor cuyos clientes medían el valor del servicio con un "¿llegó mi correo?", días de correos perdidos era casi la peor caída de servicio concebible.

Y no había nada que los clientes pudieran hacer. El problema no estaba en las máquinas de Panix, que funcionaban a la perfección. Estaba en la tabla de enrutamiento global del Sistema de Nombres de Dominio (DNS), a la que se le había indicado —por un registrador en Australia, actuando tras una solicitud fraudulenta— que panix.com ahora pertenecía a otra persona.

## Cómo sucedió: la laguna legal de la transferencia con aprobación automática

![Vibrante y colorido arte conceptual de un sello de goma gigante estampando APROBADO en un formulario de transferencia para una llave de dominio brillante, sin verificación de identificación, sin firma, sin guardia en el escritorio — un reloj en el fondo mostrando una cuenta regresiva de cinco días](../../assets/the-panix-com-domain-hijack-02-transfer-loophole.jpg)

Aquí está el factor que convierte a Panix en un caso histórico en lugar de solo otro mal fin de semana: nadie irrumpió ilegalmente en sus sistemas. El sistema funcionó exactamente como fue diseñado. El diseño *era* la vulnerabilidad.

La mecánica pasó por una cadena de intermediarios. El dominio de Panix estaba registrado en **Dotster**, un registrador en Vancouver, Washington. La transferencia fraudulenta se inició a través de una cuenta en **Fibranet Services Ltd.**, un revendedor con sede en el Reino Unido, quien la remitió a **Melbourne IT**, un gran registrador en Australia. Como informó *InfoWorld*, [un error de Melbourne IT Ltd. permitió a estafadores que usaban tarjetas de crédito robadas tomar el control de Panix.com](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html); la cuenta utilizada para la transferencia era [fraudulenta y se configuró con tarjetas de crédito robadas](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html).

Pero el fraude con tarjetas de crédito solo sirvió para abrir la cuenta. Lo que realmente movió el dominio fue una política de la industria. La ICANN había introducido un nuevo proceso de transferencia entre registradores que había entrado en vigor apenas unas semanas antes, en noviembre de 2004, construido en torno al principio de *aprobación por defecto*. Como explicó *The Register*, bajo este nuevo marco, [estas reglas, que entraron en vigor el pasado noviembre, significan que las solicitudes de transferencia entre registradores se aprueban automáticamente después de cinco días a menos que el propietario del dominio las anule](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=automatically%20approved%20after%20five%20days%20unless%20countermanded%20by%20the%20domain%20owner).

Lea eso de nuevo, porque encapsula la historia completa. El silencio significaba *sí*. Si el propietario legítimo no hacía nada (porque, por ejemplo, nunca recibió la notificación), la transferencia se completaba por sí sola. Davis Wright Tremaine describió la misma trampa desde el punto de vista legal: las nuevas reglas [podría decirse que hacen que las transferencias fraudulentas sean más fáciles de llevar a cabo porque, según las normas, los dominios se transfieren automáticamente a menos que el propietario anule la solicitud de transferencia dentro de un plazo de cinco días](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=automatically%20transferred%20unless%20the%20owner%20countermands%20the%20transfer%20request%20within%20five%20days).

Sumemos las fallas y el panorama es sombrío. El registrador *receptor* (Melbourne IT, a través de Fibranet) aceptó una solicitud respaldada por una tarjeta robada y, según admitió posteriormente, [no verificó adecuadamente la solicitud](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=failed%20to%20properly%20verify%20the%20request). El registrador *emisor* (Dotster) y el propietario legítimo (Panix) no recibieron una notificación efectiva, por lo que nunca anularon nada. Y el enfoque predeterminado de la política (aprobar a menos que alguien se oponga) convirtió esa falta de objeción en un robo consumado. No se vulneró ningún firewall. El trámite administrativo mismo fue el ataque.

## La recuperación y las reformas políticas que desencadenó

La recuperación, una vez que los humanos se involucraron, fue rápida; lo cual es su propia condena, porque demostró que la transferencia nunca debió haberse aprobado en primer lugar.

Para el domingo, [Panix había recuperado su dominio Panix.com de la firma australiana de alojamiento y registro de dominios Melbourne IT, donde estaba aparcado el dominio sustraído](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=Panix%20had%20recovered%20its%20Panix.com%20domain), y lo apuntó de nuevo a su hogar natural en Dotster. La corrección a nivel del registro fue casi instantánea; pero la limpieza global no lo fue, porque el DNS no olvida de un momento a otro por comando. Como señaló *The Register*, los servidores raíz se actualizaron rápidamente, pero la naturaleza distribuida del DNS significaba que tomaría hasta 24 horas antes de que se restaurara completamente la normalidad: las memorias caché de todo el mundo debían expirar antes de que cada usuario pudiera ver de nuevo el verdadero panix.com.

Melbourne IT, a su favor, no se escondió. Dos días después, *The Register* informó que [un registrador de dominios australiano admitió su participación en el secuestro del pasado fin de semana](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=An%20Australian%20domain%20registrar%20has%20admitted%20to%20its%20part), rastreando la falla hasta un paso de verificación en su proceso de transferencia que no se había realizado, y prometió que la brecha que permitió el error había sido cerrada.

Pero la consecuencia más importante fue estructural. Panix se convirtió en el ejemplo clásico de los libros de texto durante el debate sobre la seguridad de las transferencias que tuvo lugar a continuación. El Comité Asesor de Seguridad y Estabilidad (SSAC) de la ICANN publicó en 2005 un informe titulado [*Secuestro de nombres de dominio: incidentes, amenazas, riesgos y acciones correctivas*](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf), examinando exactamente este tipo de fallos: registradores que aceptaban transferencias sin confirmar que el solicitante fuera realmente el registrante. Las soluciones duraderas que fortalecieron el sistema se derivan directamente de fines de semana como este:

- **Bloqueos de registrador por defecto.** Un dominio configurado en `clientTransferProhibited` simplemente se niega a ser transferido hasta que el titular legítimo retira el bloqueo. Lo que alguna vez fue una opción poco conocida se convirtió, para muchos registradores, en el estado predeterminado: un freno que la regla de aprobación automática no podía eludir.
- **Códigos de autorización (códigos de transferencia EPP).** Las transferencias modernas de gTLD requieren un código de autorización secreto que el registrador *emisor* solo proporciona al registrante verificado, de modo que un registrador receptor ya no puede llevarse un dominio basándose únicamente en trámites administrativos.
- **Una [Política de Transferencia de la ICANN](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)** documentada, con deberes de confirmación más estrictos y un canal de contacto de emergencia para revertir con rapidez exactamente este tipo de transferencias fraudulentas.

El secuestro de Panix no inventó estos mecanismos por sí solo, pero se convirtió en el caso de referencia que todos señalaban al argumentar por qué eran absolutamente necesarios.

## Lo que esto nos enseña sobre los bloqueos de transferencia y la verificación

Si quitamos las fechas y los nombres de los registradores, Panix nos deja algunas lecciones duraderas.

1. **Permitir por defecto es una decisión de seguridad, y generalmente la equivocada.** La elección de diseño más peligrosa en 2005 fue asumir que *el silencio equivale a consentimiento*. Una transferencia que se completa cuando el propietario no hace nada asume que este siempre está atento y localizable. Ninguna de las dos cosas es cierta durante un fin de semana largo.
2. **La identidad debe ser verificada por la parte que cede el activo, no solo por la parte que lo toma.** El registrador receptor quería el negocio y tenía todos los incentivos para aprobarlo. La verdadera seguridad se logró solo cuando el registrador *emisor* tuvo la obligación de entregar un código de autorización a un titular verificado, colocando el filtro de seguridad allí donde realmente habita el activo.
3. **Active el bloqueo.** `clientTransferProhibited` es la protección más barata y efectiva que tiene un propietario de dominio contra este ataque en particular, y no cuesta nada. Un dominio bloqueado no puede ser transferido en silencio sin importar cuán convincente sea el trámite en papel. Bloquee sus nombres importantes y déjelos así.
4. **Su dominio es su único punto de falla.** Los servidores de Panix nunca fueron comprometidos, pero la empresa estuvo efectivamente fuera de línea. Cuando un solo registro en una base de datos puede redirigir toda su presencia web y de correo electrónico, ese registro merece más protección que sus propios servidores.
5. **Preste atención a las notificaciones.** La ventana de cinco días para anular un proceso solo protege al propietario que realmente recibe (y lee) la notificación de transferencia. Un correo electrónico del titular desactualizado, un contacto administrativo que no se revisa o un fin de semana festivo convierten esa válvula de seguridad en un fallo silencioso.

## El enfoque de Namefi

![Ilustración colorida de una propiedad de dominio verificable y resistente a manipulaciones: una tarjeta de dominio asegurada por un escudo verde, un token verde de Namefi y continuidad del DNS](../../assets/the-panix-com-domain-hijack-03-namefi-angle.jpg)

El secuestro de Panix es, en el fondo, un problema de *autoridad*. La pregunta "¿quién tiene permitido mover este dominio?" fue respondida por una cadena de revendedores y un temporizador de aprobación automática en lugar de una prueba de propiedad sólida y verificable. Una tarjeta de crédito robada y cinco días de silencio fueron suficientes para convencer al sistema de que un extraño en el otro lado del mundo actuaba en nombre de un ISP de Nueva York.

[Namefi](https://namefi.io) parte de la premisa opuesta: que el control de un dominio debe poder demostrarse y no darse por sentado. Al representar la propiedad del dominio como un activo tokenizado en la cadena de bloques (blockchain) que se mantiene compatible con DNS, el hecho de responder "quién posee este nombre" se vuelve criptográficamente verificable y auditable: un registro que no puede ser reescrito silenciosamente por un registrador que acepte documentación falsificada. Las transferencias se ejecutan cuando la clave criptográfica del titular las autoriza, no cuando se agota la cuenta regresiva de un reloj de cinco días sin supervisión. El estado predeterminado es *denegar*, y el consentimiento debe demostrarse explícitamente, no simplemente "no ser objetado".

Nada de esto existía en 1989 cuando se fundó Panix, ni siquiera en 2005, cuando ocurrió el secuestro. Pero subraya la lección que aquel fin de semana le enseñó a toda la industria: un dominio es demasiado importante como para ser gobernado por el silencio. Su propiedad debería ser algo que usted pueda demostrar cuando sea necesario, y algo que un extraño no pueda arrebatar simplemente porque usted no estaba revisando su bandeja de entrada durante un puente festivo.

## Fuentes y lecturas adicionales

- The Register — [Panix se recupera del secuestro de dominio](https://www.theregister.com/2005/01/17/panix_domain_hijack/)
- The Register — [Secuestro de Panix.com: firma australiana asume la culpa](https://www.theregister.com/2005/01/19/panix_hijack_more/)
- Davis Wright Tremaine — [Protección contra el secuestro de nombres de dominio](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking)
- InfoWorld — [Una empresa australiana asume la culpa por el secuestro del dominio de Panix](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)
- Slashdot — [El ISP más antiguo de Nueva York sufre un secuestro de dominio](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked)
- Wikipedia — [Panix (ISP)](https://en.wikipedia.org/wiki/Panix_(ISP))
- Wikipedia — [Secuestro de dominios](https://en.wikipedia.org/wiki/Domain_hijacking)
- ICANN SSAC — [Secuestro de Nombres de Dominio: Incidentes, Amenazas, Riesgos y Acciones Correctivas (2005)](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)
- ICANN — [Política de Transferencia](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)
- Archivo de la lista de correo de NANOG — [Discusión sobre la transferencia de panix.com y las soluciones de la ICANN](https://diswww.mit.edu/charon/nanog/77162)