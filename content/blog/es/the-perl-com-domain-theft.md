---
title: 'El robo del dominio Perl.com: Cómo fue robado silenciosamente un hogar comunitario de 30 años'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'A fines de enero de 2021, perl.com (el hogar de décadas de antigüedad de la comunidad de programación Perl) fue robado a través del compromiso de una cuenta a nivel de registrador, transferido a través de China, apuntado a una IP vinculada a malware y puesto a la venta por $190,000. Aquí explicamos cómo sucedió, cómo se recuperó y qué nos enseña sobre la seguridad de las cuentas de registradores.'
keywords: ['perl.com', 'robo del dominio perl.com', 'secuestro de dominios', 'robo de dominios', 'compromiso de cuenta del registrador', 'ingeniería social', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'secuestro de DNS', 'seguridad de dominios', 'toma de cuentas', 'BizCN']
---

Algunos dominios son infraestructuras que simplemente parecen un nombre. **perl.com** es uno de ellos. No es un activo de marketing ni una marca que alguien construyó el año pasado: es una pieza del mobiliario de Internet en torno a la cual la comunidad de programación de Perl ha vivido desde los primeros días de la web, la puerta principal canónica a la documentación, los artículos y la cara pública del lenguaje.

Así que cuando, la mañana del 27 de enero de 2021, esa puerta principal de repente perteneció a otra persona, no fue una estrategia de marca inteligente ni una venta negociada. Fue un robo. El dominio había sido arrebatado silenciosamente del control de su legítimo propietario meses antes, rebotado entre registradores y apuntado a una dirección IP con un historial de distribución de malware. Los propios operadores de red de la comunidad lo expresaron sin rodeos: ["El dominio perl.com fue secuestrado esta mañana, y actualmente apunta a un sitio de aparcamiento."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

Esta es la historia del EP19 de nuestra serie Domain Mayday: cómo se robó un dominio comunitario de treinta años de antigüedad sin que nadie irrumpiera en un solo servidor, y lo que costó recuperarlo.

## Un dominio conservado desde principios de los 90

Para entender el robo, hay que comprender lo ordinaria que era la configuración, y cómo esa misma cotidianidad era la vulnerabilidad.

perl.com no estaba guardado en una bóveda corporativa blindada. Se mantenía de la forma en que se mantienen la mayoría de los dominios de larga vida: por una persona de confianza, en un registrador principal, renovado año tras año sin drama. El editor del sitio, brian d foy, describió más tarde el linaje en su propio relato del incidente: ["Este dominio fue registrado a principios de los 90, a Tom Christiansen se le dio el control poco después, y básicamente siguió pagando las cuotas de registro."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

Ese es el perfil completo de una enorme fracción de los nombres más importantes de Internet. Una persona, un inicio de sesión en el registrador y tres décadas pagando la factura discretamente. Funciona a la perfección... hasta que la propia cuenta del registrador se convierte en el objetivo.

## 27 de enero de 2021: la puerta principal cambia de cerradura

![Arte conceptual vivo y colorido de un letrero comunitario de madera de hace décadas siendo desatornillado silenciosamente de su poste por la noche y llevado, contra un cielo brillante de placa de circuito](../../assets/the-perl-com-domain-theft-01-theft.jpg)

La primera alarma pública vino de las personas que administran la infraestructura de la comunidad de Perl. El blog del NOC (Centro de Operaciones de Red) de Perl publicó que el dominio había sido secuestrado "esta mañana" y que ahora apuntaba a un lugar donde no debería. Peor que una simple página de aparcamiento, los operadores advirtieron que ["hay algunas señales de que puede estar relacionado con sitios que han distribuido malware en el pasado."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

brian d foy lo hizo público ese mismo día. Los informes sobre el incidente confirmaron el momento en términos claros: ["El 27 de enero, el autor de programación en Perl y editor de Perl.com, brian d foy, tuiteó que el dominio perl.com de repente estaba registrado a nombre de otra persona."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

La respuesta de la comunidad fue rápida y pragmática. Mientras comenzaban los trabajos de recuperación, el NOC redirigió a los lectores a una copia de seguridad: ["Si estás buscando el contenido, puedes visitar perldotcom.perl.org."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) El nombre canónico había desaparecido, pero el contenido seguía siendo accesible.

## Lo que estaba en riesgo: una IP vinculada a malware

Un dominio robado es peligroso en proporción a la confianza que conlleva, y perl.com conllevaba mucha. Millones de desarrolladores, tutoriales, herramientas de CPAN y enlaces antiguos en toda la web apuntaban hacia él. Quienquiera que controlara el nombre controlaba hacia dónde se resolvía toda esa confianza.

Y el nuevo propietario no lo apuntó a un lugar inofensivo. Como documentó BleepingComputer, ["El nombre de dominio perl.com fue robado y ahora apunta a una dirección IP asociada con campañas de malware."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

Las huellas técnicas eran específicas. Los registros DNS se reescribieron para que ["las direcciones IP asignadas al dominio se cambiaran de 151.101.2.132 a la dirección IP de Google Cloud 35.186.238[.]101."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) Ese destino tenía un pasado: ["En 2019, la dirección IP 35.186.238[.]101 estaba vinculada a un dominio que distribuía un ejecutable de malware para el ya desaparecido ransomware Locky."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

Si sumamos estos dos hechos, el peligro es evidente. Un nombre en el que los desarrolladores confían de forma instintiva, que de repente se resuelve en una IP con un historial de malware, es el escenario casi perfecto para engañar exactamente al tipo de público técnico y consciente de la seguridad que normalmente es difícil de engañar.

## Cómo ocurrió: la cuenta del registrador, no el servidor

![Arte conceptual vivo y colorido de un formulario falso de cambio de propiedad deslizándose a través de un mostrador de servicio de registro, un sello oficial de goma que brilla en rojo, papeleo arremolinándose en luz de neón — sin logotipos de marcas](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

Esta es la parte que hace que este incidente sea un caso de estudio en lugar de una nota a pie de página: nadie hackeó el servidor web de perl.com, y nadie adivinó una contraseña de DNS. El ataque se produjo una capa más arriba, en el registrador: la empresa que mantiene el registro autorizado de a quién pertenece el nombre.

En su análisis post-mortem, brian d foy describió directamente la teoría de trabajo: ["Creemos que hubo un ataque de ingeniería social en Network Solutions, incluyendo documentos falsos y demás."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) La prensa lo enmarcó de la misma manera: el robo fue ["un ataque de ingeniería social que convenció al registrador Network Solutions de alterar los registros del dominio sin la autorización válida."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

El detalle más inquietante es la línea de tiempo. La comunidad solo se *dio cuenta* en enero, pero el compromiso real era mucho más antiguo. El trabajo forense sacado a la luz por el abogado de dominios John Berryhill retrasó la fecha real varios meses; como relata la cuenta de perl.com, ["John Berryhill proporcionó algunos trabajos forenses en Twitter que mostraban que el compromiso realmente ocurrió en septiembre."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek confirmó la paciencia del atacante: ["El ataque, explica, tuvo lugar en septiembre de 2020"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) — aproximadamente cuatro meses antes de que alguien viera los efectos.

¿Por qué una espera tan larga? Porque las reglas de transferencia de dominios recompensan la paciencia. ["La ICANN prohíbe la transferencia de un dominio durante 60 días después de la actualización de la información de contacto."](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) Un atacante que se apodera silenciosamente de una cuenta de registrador en septiembre no puede llevarse el dominio de inmediato, por lo que se sentaron a esperar, dejaron correr el reloj y dieron su paso una vez que el bloqueo expiró.

Cuando finalmente actuaron, lavaron el nombre a través de registradores y fronteras para dificultar su recuperación. The Register documentó el primer salto: ["El dominio fue transferido al registrador BizCN en diciembre, pero los servidores de nombres no fueron cambiados."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer rastreó la misma ruta geográficamente: el dominio ["fue robado en septiembre de 2020 mientras estaba en Network Solutions, transferido a un registrador en China el día de Navidad"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day) antes del salto final en enero, cuando ["El dominio fue transferido nuevamente en enero a otro registrador, Key Systems, GmbH."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

Y luego intentaron cobrar. Con el nombre recién reubicado, ["el registrante no autorizado intentó vender el dominio por $190,000 en el mercado de dominios Afternic."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) Un activo comunitario de treinta años, robado mediante papeleo, puesto a la venta como si fuera un mueble usado.

## La recuperación: semanas de papeleo para deshacer papeleo

La misma maquinaria que permitió el robo (registradores, registros y bases de datos de propiedad) era también la única vía de retorno. No había ningún servidor que volver a asegurar ni ningún parche que implementar. Alguien tenía que *demostrar*, a través de la cadena de registradores y registros, que Tom Christiansen era el verdadero propietario y que el nuevo "dueño" era un fraude.

Ese trabajo comenzó en cuestión de días. Para el 30 de enero, el NOC de Perl informó que ["Network Solutions está trabajando con Tom Christiansen, el registrante legítimo, en la recuperación del dominio Perl.com."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) Ese esfuerzo ["condujo finalmente a la restauración del dominio a su propietario anterior, Tom Christiansen, a principios de febrero."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

Pero "restaurado" no significaba "arreglado". La propia forma en que brian d foy lo planteó captura tanto el alivio como el trabajo inconcluso: ["El dominio Perl.com vuelve a estar en manos de Tom Christiansen y estamos trabajando en las diversas actualizaciones de seguridad para que esto no vuelva a suceder."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) Debido a que el dominio había apuntado a una IP vinculada a malware, los productos de seguridad lo habían incluido en sus listas negras y algunos resolutores de DNS lo estaban enviando a un sinkhole. Incluso después de que el registro del dominio fuera correcto, hicieron falta semanas adicionales para que el nombre volviera a ser de confianza en todos los sistemas de reputación de Internet: un largo proceso que prolongó toda la terrible experiencia a lo largo de unos dos meses.

El titular, en palabras de foy, casi se quedó corto: ["Durante una semana perdimos el control del dominio Perl.com."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) Una semana de robo activo; meses de compromiso latente antes de eso; semanas de limpieza después.

## Lo que esto nos enseña sobre la seguridad de las cuentas de registradores y los dominios conservados durante mucho tiempo

El robo de perl.com es muy instructivo precisamente porque no ocurrió nada exótico. Si lo simplificamos, las lecciones son incómodamente generales:

1. **La cuenta del registrador es la verdadera joya de la corona.** Todo el mundo refuerza la seguridad de sus servidores y su host de DNS. Pero el *registro de propiedad* del dominio reside en el registrador, y esa cuenta suele estar protegida por poco más que una contraseña y un equipo de soporte al que se puede convencer para hacer cambios. perl.com fue robado allí, no en la periferia de la red.

2. **La ingeniería social supera los controles técnicos.** Ningún exploit, ningún malware en el lado de la víctima: solo ["documentos falsos y demás"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.) lo suficientemente persuasivos para mover un registro real. La autenticación de dos factores en tu propio inicio de sesión no sirve de nada si se puede convencer a los *humanos* del registrador para que la anulen.

3. **Los dominios de larga vida son blancos fáciles.** Un nombre registrado a principios de los 90 y renovado en piloto automático durante treinta años tiende a acumular información de contacto obsoleta, un único punto de fallo humano y un propietario que no vigila el registro WHOIS a diario. Una estabilidad silenciosa es exactamente lo que permite que un compromiso en septiembre pase desapercibido hasta enero.

4. **Las reglas de transferencia son un arma de doble filo.** El bloqueo de transferencia de 60 días tras una actualización, que se supone debe *proteger* a los propietarios, se convirtió en la sala de espera del atacante. La paciencia, sumada al lavado a través de registradores y fronteras, convirtió una solución rápida en una recuperación de múltiples partes y semanas de duración.

5. **La recuperación es más lenta que el robo.** Robar el nombre solo requirió un documento falsificado. Recuperarlo requirió registradores, un registro, la evidencia del dueño legítimo y, después, semanas reconstruyendo la reputación con listas de bloqueo y resolutores. El robo es una transacción; la restitución son muchas.

El sombrío resumen: para un dominio como perl.com, la solidez de tu contraseña importa menos que la posibilidad de engañar a tu registrador para que la ignore.

## La perspectiva de Namefi

![Ilustración colorida de una propiedad de dominio verificable y resistente a manipulaciones — una tarjeta de dominio asegurada por un escudo verde, un token verde de Namefi y continuidad de DNS](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

Cada paso del robo de perl.com dependió de una sola debilidad: la propiedad era un *registro en la cuenta de otra persona*, que podía ser alterado por quien lograra persuadir al agente de soporte adecuado. El atacante nunca necesitó las llaves del dueño. Solo necesitó la confianza del registrador, y un papel falsificado fue suficiente para transferir un activo de treinta años de antigüedad al otro lado del planeta y ponerlo a la venta.

[Namefi](https://namefi.io) está construido sobre la premisa opuesta: que la propiedad de un dominio debe ser criptográficamente verificable y difícil de reescribir silenciosamente. Al representar el control del dominio como un activo tokenizado en cadena que mantiene la compatibilidad con DNS, la respuesta autorizada a "¿quién es el dueño de este nombre?" deja de ser una línea mutable en la base de datos de un registrador que una llamada telefónica convincente puede cambiar. Las transferencias se convierten en eventos firmados y auditables en lugar de papeleo administrativo, y un "cambio de propiedad" fraudulento no encuentra ninguna puerta silenciosa por la que colarse.

Esto no habría hecho que perl.com fuera imposible de robar de la noche a la mañana; los registradores y registros siguen siendo parte de la cadena. Pero ataca el modo de fallo exacto que definió este incidente (la brecha entre *pagar por un nombre durante treinta años* y *poder demostrar, de forma resistente a la manipulación, que es tuyo*), y reduce la ventana en la que un dominio robado puede ser lavado antes de que alguien pueda objetar.

perl.com recuperó su puerta principal. La pregunta más difícil que deja este episodio es por qué la cerradura era algo que un extraño con el papeleo adecuado podía llegar a abrir.

## Fuentes y lectura adicional

- The Perl NOC — [perl.com hijacked](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (brian d foy) — [The Hijacking of Perl.com](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [Perl.com domain stolen, now using IP address tied to malware](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [Perl.com theft blamed on social engineering attack](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [Hackers Controlled Perl.com Domain Months Before Hijack](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [Attackers took over the Perl.com domain in September 2020](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [Domain for popular programming website Perl.com stolen in 'hack'](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [Perl.com Domain Stolen, Now Using IP Address of Past Malware Campaigns](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [The perl.com domain has been hijacked](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [Perl.com editors tell the truth about the Perl.com domain hijacking case](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)