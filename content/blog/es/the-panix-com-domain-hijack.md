---
title: 'El secuestro de dominio de Panix.com: cómo una regla de aprobación automática de cinco días le robó al ISP más antiguo de Nueva York'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
description: 'En enero de 2005, panix.com — el dominio del proveedor de internet comercial más antiguo de Nueva York — fue transferido de forma fraudulenta a un registrador en Australia mediante tarjetas de crédito robadas, dejando el sitio web y el correo electrónico fuera de servicio durante días. Las reglas de transferencia entre registradores con aprobación automática de la época lo hicieron posible, y la resolución del caso reformó la política de transferencia de dominios.'
keywords: ['panix.com', 'secuestro de dominio panix', 'secuestro de dominio', 'transferencia entre registradores', 'Melbourne IT', 'Dotster', 'Fibranet', 'política de transferencia ICANN', 'bloqueo de registrador', 'clientTransferProhibited', 'seguridad de dominios', 'secuestro DNS', 'código de autorización EPP']
relatedArticles:
  - /es/blog/the-lenovo-com-dns-hijack/
  - /es/blog/the-perl-com-domain-theft/
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-sex-com-heist-the-forged-letter/
  - /es/blog/the-syrian-electronic-army-nyt-hijack/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/name-change-game-change/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/icann/
  - /es/glossary/dns/
  - /es/glossary/tld/
  - /es/glossary/registry/
---

Durante más de quince años, uno de los proveedores de internet comerciales más antiguos de Estados Unidos vivió en una sola dirección: **panix.com**. Luego, durante un largo fin de semana festivo en enero de 2005, alguien se la llevó.

No hackeando un servidor. No adivinando una contraseña. Rellenaron un formulario de transferencia, pagaron con una tarjeta de crédito robada y esperaron a que una nueva regla de [ICANN](/es/glossary/icann/) hiciera el resto. En pocas horas, la propiedad de panix.com había sido trasladada a una empresa en Australia, su DNS apuntado hacia un servidor en el Reino Unido y su correo electrónico redirigido a través de Canadá — todo mientras las personas que realmente gestionaban Panix dormían durante la noche del sábado, sin haber recibido ningún aviso.

Esta es la historia de cómo un trámite administrativo, y no un exploit informático, secuestró al ISP más antiguo de Nueva York — y cómo la resolución del caso ayudó a reescribir las reglas que determinan quién puede mover un dominio.

## Un ISP pionero cuyo negocio entero vivía en un solo dominio

Panix — Public Access Networks Corporation — no era una historia menor. Fundada en 1989, era, según Wikipedia, [el tercer ISP más antiguo del mundo después de The World y NetCom](https://en.wikipedia.org/wiki/Panix_(ISP)#:~:text=third%2Doldest%20ISP%20in%20the%20world%20after%20The%20World%20and%20NetCom). Era un referente del internet comercial temprano en la ciudad de Nueva York: cuentas shell, correo electrónico, alojamiento web, las conexiones de marcado telefónico y luego de banda ancha que miles de neoyorquinos utilizaban para conectarse a internet.

Y como casi todo negocio de internet entonces y ahora, la identidad de Panix *era* su dominio. Los buzones de correo de los clientes terminaban en `@panix.com`. Los servidores web respondían a `www.panix.com`. Toda la empresa — su marca, su alcance, lo que hacía que el correo de un cliente llegara efectivamente — dependía de los registros DNS asociados a un nombre. Perder el control de ese nombre no significaba perder un activo de marketing. Significaba perder el sistema nervioso del negocio.

Eso es exactamente lo que ocurrió.

## Enero de 2005: la transferencia fraudulenta

El relato legal es preciso sobre la fecha. Como resumió en su momento el despacho de abogados Davis Wright Tremaine, [el viernes 14 de enero de 2005 ocurrió un secuestro de alto perfil cuando el nombre de dominio "panix.com", propiedad del proveedor de servicios de internet neoyorquino del mismo nombre, fue transferido sin autorización a un tercero](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=On%20Friday%2C%20Jan.%2014%2C%202005%2C%20a%20high%2Dprofile%20hijacking%20occurred).

En las primeras horas de ese fin de semana, las consecuencias ya eran visibles. The Register, informando sobre el incidente a medida que se desarrollaba, describió la redirección en una frase que todavía parece un esquema de atraco: [la propiedad de panix.com fue trasladada a una empresa en Australia, los registros DNS reales fueron movidos a una empresa en el Reino Unido, y el correo de Panix.com fue redirigido a otra empresa en Canadá](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=The%20ownership%20of%20panix.com%20was%20moved%20to%20a%20company%20in%20Australia).

Slashdot, donde la noticia llegó a la comunidad técnica más amplia el 16 de enero, fue directo: [Panix, el proveedor de internet comercial más antiguo de Nueva York, tuvo su nombre de dominio 'panix.com' secuestrado por personas desconocidas](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked).

El detalle más condenatorio, desde el punto de vista de Panix, fue el silencio. La empresa [fundada en 1989 y el ISP comercial más antiguo de Nueva York afirmó que ni ella ni su registrador recibieron ninguna notificación de los cambios propuestos](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=neither%20it%20nor%20its%20registrar%20received%20any%20notification%20of%20the%20proposed%20changes). La transferencia que se llevó el dominio fue, hasta donde el propietario legítimo podía ver, completamente invisible hasta que ya había sucedido.

## La interrupción: web y correo electrónico caídos durante días

![Arte conceptual colorido y vívido de la escritura de una casa siendo re-registrada silenciosamente a nombre de un extraño en el extranjero mientras el propietario legítimo duerme, un título en papel luminoso deslizándose sobre un océano hacia un escritorio extranjero sellado a medianoche](../../assets/the-panix-com-domain-hijack-01-hijack.jpg)

Un dominio secuestrado no es un interruptor limpio de encendido/apagado — es un apagado lento y desagradable, y el peor daño lo sufre el correo.

Cuando controlas el [DNS](/es/glossary/dns/) de un dominio, controlas a dónde se entrega su correo electrónico. Al redirigir los registros de correo de panix.com, los secuestradores se convirtieron en la oficina de correos para toda la base de clientes de un ISP. Los mensajes entrantes — facturas, restablecimientos de contraseña, correspondencia comercial, correo personal — dejaron de llegar a Panix y empezaron a fluir hacia un servidor bajo el control de los atacantes. InfoWorld, informando tras calmarse la situación, señaló que el secuestro [privó a algunos clientes de Panix del acceso a su correo electrónico durante dos días](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html), y que algunos de esos clientes pudieron haber perdido cien o más mensajes durante el fin de semana.

El correo mal enrutado durante un secuestro no solo se retrasa. Gran parte desaparece — rebotado, descartado o silenciosamente engullido por un servidor que nunca debió recibirlo. Para un proveedor cuyos clientes medían el valor del servicio en "¿llegó mi correo?", días de correo mal enrutado era casi el peor apagón posible.

Y los clientes no podían hacer nada. El problema no estaba en las máquinas de Panix, que funcionaban perfectamente. Estaba en la tabla de enrutamiento global del Sistema de Nombres de Dominio, a la que se le había dicho — por un [registrador](/es/glossary/registrar/) en Australia, actuando sobre una solicitud fraudulenta — que panix.com ahora pertenecía a otra persona.

## Cómo ocurrió: el vacío legal de la transferencia con aprobación automática

![Arte conceptual colorido y vívido de un enorme sello de goma golpeando APROBADO en un formulario de transferencia para una llave de dominio luminosa, sin verificación de identidad, sin firma, sin guardia en el escritorio — un reloj al fondo mostrando cinco días contando regresivamente](../../assets/the-panix-com-domain-hijack-02-transfer-loophole.jpg)

Aquí está la parte que convierte a Panix en un caso emblemático y no en un simple fin de semana desafortunado: nadie entró por la fuerza. El sistema funcionó exactamente como fue diseñado. El diseño era la vulnerabilidad.

La mecánica pasaba por una cadena de intermediarios. El dominio de Panix estaba registrado con **Dotster**, un registrador en Vancouver, Washington. La transferencia fraudulenta fue iniciada a través de una cuenta en **Fibranet Services Ltd.**, un [revendedor](/es/glossary/reseller/) con sede en el Reino Unido, que la envió a **Melbourne IT**, un gran registrador en Australia. Como informó InfoWorld, [un error de Melbourne IT Ltd. permitió que estafadores utilizando tarjetas de crédito robadas tomaran control de Panix.com](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html) — la cuenta utilizada para la transferencia era [fraudulenta y había sido creada con tarjetas de crédito robadas](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html).

Pero el fraude con tarjetas solo abrió la cuenta. Lo que realmente movió el dominio fue una política. ICANN había introducido un nuevo proceso de transferencia entre registradores que había entrado en vigor solo semanas antes, en noviembre de 2004, construido alrededor de un principio de *aprobación por defecto*. Como explicó The Register, bajo el nuevo marco [estas reglas, que entraron en vigor el pasado noviembre, significan que las solicitudes de transferencia entre registros se aprueban automáticamente después de cinco días a menos que el propietario del dominio las contraordene](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=automatically%20approved%20after%20five%20days%20unless%20countermanded%20by%20the%20domain%20owner).

Léelo de nuevo, porque ahí está toda la historia. El silencio significaba *sí*. Si el propietario legítimo no hacía nada — porque, por ejemplo, nunca recibió el aviso — la transferencia se completaba por sí sola. Davis Wright Tremaine describió la misma trampa desde el lado legal: las nuevas reglas [posiblemente facilitan las transferencias fraudulentas porque bajo las reglas los dominios se transfieren automáticamente a menos que el propietario contraordene la solicitud de transferencia dentro de cinco días](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=automatically%20transferred%20unless%20the%20owner%20countermands%20the%20transfer%20request%20within%20five%20days).

Al acumular los fallos, el panorama es sombrío. El registrador *receptor* (Melbourne IT, a través de Fibranet) aceptó una solicitud respaldada por una tarjeta robada y, según su propia admisión posterior, [no verificó correctamente la solicitud](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=failed%20to%20properly%20verify%20the%20request). El registrador *cedente* (Dotster) y el propietario legítimo (Panix) no recibieron ningún aviso efectivo y por tanto nunca contraordenaron nada. Y el comportamiento predeterminado de la política — aprobar a menos que alguien objete — convirtió esa ausencia de objeción en un robo consumado. No se vulneró ningún cortafuegos. El papeleo fue el ataque.

## La recuperación y las reformas de política que provocó

La recuperación, una vez que intervino el factor humano, fue rápida — y eso es en sí mismo una acusación, porque demostró que la transferencia nunca debería haberse aprobado en primer lugar.

El domingo, [Panix había recuperado su dominio Panix.com de la empresa australiana de alojamiento y registro de dominios Melbourne IT, donde el dominio robado había quedado aparcado](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=Panix%20had%20recovered%20its%20Panix.com%20domain), y lo apuntó de vuelta a su hogar natural en Dotster. La corrección a nivel de [registro](/es/glossary/registry/) fue casi instantánea; la limpieza global no lo fue, porque el DNS no olvida por orden. Como señaló The Register, los servidores raíz se actualizaron rápidamente, pero la naturaleza distribuida del DNS significaba que tardaría hasta 24 horas en restaurarse completamente la normalidad — los cachés de todo el mundo tenían que expirar antes de que cada usuario viera el panix.com real de nuevo.

Melbourne IT, a su favor, no se escondió. Dos días después, The Register informó que [un registrador de dominios australiano admitió su participación en el secuestro de nombre de dominio del fin de semana pasado](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=An%20Australian%20domain%20registrar%20has%20admitted%20to%20its%20part), rastreando el fallo hasta un paso de verificación en su proceso de transferencia que no se había llevado a cabo y prometiendo que el vacío legal que permitió el error había sido cerrado.

Pero la consecuencia más importante fue estructural. Panix se convirtió en el ejemplo de libro de texto en el ajuste de cuentas más amplio sobre la seguridad en las transferencias que siguió. El Comité Asesor de Seguridad y Estabilidad de ICANN publicó un informe de 2005, [*Secuestro de nombres de dominio: incidentes, amenazas, riesgos y medidas correctivas*](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf), examinando exactamente esta clase de fallo — registradores que aceptan transferencias sin confirmar que el solicitante es realmente el titular del dominio. Las correcciones duraderas que reforzaron el sistema se remontan directamente a fines de semana como este:

- **Bloqueos de registrador por defecto.** Un dominio configurado como `clientTransferProhibited` simplemente rechaza la transferencia hasta que el bloqueo sea eliminado por el titular legítimo. Lo que antes era una opción adicional poco conocida se convirtió, para muchos registradores, en el estado predeterminado — un freno que la regla de aprobación automática no podía anular.
- **Códigos de autorización (códigos de transferencia EPP).** Las transferencias modernas de [gTLD](/es/glossary/gtld/) requieren un código de autorización secreto que el registrador *cedente* solo entrega al titular verificado, de modo que un registrador receptor ya no puede llevarse un dominio solo con papeleo.
- **Una [política de transferencia de ICANN](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy) documentada** con deberes de confirmación más estrictos y un canal de contacto de emergencia para revertir exactamente este tipo de transferencia fraudulenta de forma rápida.

El secuestro de Panix no inventó estos mecanismos por sí solo, pero se convirtió en el caso al que todos apuntaban cuando argumentaban que eran necesarios.

## Lo que esto enseña sobre los bloqueos de transferencia y la verificación

Si eliminamos las fechas y los nombres de los registradores, Panix deja algunas lecciones duraderas.

1. **La aprobación por defecto es una decisión de seguridad, y generalmente equivocada.** La elección de diseño más peligrosa en 2005 fue que *el silencio equivale al consentimiento*. Una transferencia que se completa cuando el propietario no hace nada asume que el propietario siempre está vigilando y siempre está disponible. Ninguna de las dos cosas es cierta durante un fin de semana festivo.
2. **La identidad debe ser verificada por la parte que entrega el activo, no solo por la que lo recibe.** El registrador receptor quería el negocio y tenía todos los incentivos para decir que sí. La seguridad real solo llegó cuando el registrador *cedente* tuvo que entregar un código de autorización a un titular verificado — colocando la verificación donde el activo realmente vive.
3. **Activa el bloqueo.** `clientTransferProhibited` es la protección más barata y efectiva que tiene un propietario de dominio contra este ataque exacto, y no cuesta nada. Un dominio bloqueado no puede ser transferido silenciosamente sin importar lo convincente que sea el papeleo. Bloquea tus nombres importantes y mantenlos bloqueados.
4. **Tu dominio es tu único punto de fallo.** Los servidores de Panix nunca fueron comprometidos, sin embargo la empresa quedó efectivamente fuera de línea. Cuando un solo registro en un registrador puede redirigir toda tu presencia web y de correo electrónico, ese registro merece más protección que tus servidores.
5. **Vigila los avisos.** La ventana de cinco días para contraordenar solo protege a un propietario que realmente recibe — y lee — el aviso de transferencia. Un correo electrónico de titular desactualizado, un contacto de administrador sin vigilancia o un fin de semana festivo convierte una válvula de seguridad en un fallo silencioso.

## El enfoque de Namefi

![Ilustración colorida de la propiedad de dominio verificable y resistente a la manipulación — una tarjeta de dominio asegurada por un escudo verde, un token verde de Namefi y continuidad de DNS](../../assets/the-panix-com-domain-hijack-03-namefi-angle.jpg)

El secuestro de Panix es, en su esencia, un problema de *autoridad*. La pregunta "¿quién está autorizado para mover este dominio?" fue respondida por una cadena de revendedores y un temporizador de aprobación por defecto en lugar de cualquier prueba sólida y verificable de propiedad. Una tarjeta de crédito robada y cinco días de silencio fueron suficientes para convencer al sistema de que un extraño en otro hemisferio hablaba en nombre de un ISP en Nueva York.

[Namefi](https://namefi.io) parte de la premisa opuesta: que el control de un dominio debe ser demostrable, no asumido. Al representar la [propiedad de dominio](/es/glossary/domain-ownership/) como un activo tokenizado en cadena compatible con DNS, el acto de "quién posee este nombre" se vuelve criptográficamente verificable y auditable — un registro que no puede ser sobrescrito silenciosamente por un registrador que acepta papeleo defectuoso. Las transferencias se realizan cuando la clave del titular las autoriza, no cuando un temporizador de cinco días expira sin supervisión. El comportamiento predeterminado es *denegar*, y el consentimiento tiene que ser demostrado, no meramente no-objetado.

Nada de esto existía en 1989 cuando se fundó Panix — ni siquiera en 2005, cuando ocurrió el secuestro. Pero apunta a la lección que ese fin de semana le enseñó a toda la industria: un dominio es demasiado importante para ser gobernado por el silencio. La propiedad debería ser algo que puedas demostrar a petición — y algo que un extraño no pueda arrebatarte simplemente porque no estabas mirando tu bandeja de entrada durante un largo fin de semana.

## Fuentes y lecturas adicionales

- The Register — [Panix recupera su dominio tras el secuestro](https://www.theregister.com/2005/01/17/panix_domain_hijack/)
- The Register — [Secuestro de Panix.com: empresa australiana asume la culpa](https://www.theregister.com/2005/01/19/panix_hijack_more/)
- Davis Wright Tremaine — [Protegerse contra el secuestro de nombres de dominio](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking)
- InfoWorld — [Empresa australiana asume la culpa del secuestro del dominio de Panix](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)
- Slashdot — [Al ISP más antiguo de Nueva York le secuestran el dominio](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked)
- Wikipedia — [Panix (ISP)](https://en.wikipedia.org/wiki/Panix_(ISP))
- Wikipedia — [Secuestro de dominio](https://en.wikipedia.org/wiki/Domain_hijacking)
- ICANN SSAC — [Secuestro de nombres de dominio: incidentes, amenazas, riesgos y medidas correctivas (2005)](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)
- ICANN — [Política de transferencia](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)
- Archivo de la lista de correo de NANOG — [debate sobre la transferencia de panix.com y los remedios de ICANN](https://diswww.mit.edu/charon/nanog/77162)
