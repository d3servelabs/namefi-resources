---
title: 'El robo del dominio Perl.com: cómo fue robado en silencio el hogar de una comunidad con 30 años de historia'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'A finales de enero de 2021, perl.com — hogar desde hace décadas de la comunidad de programación Perl — fue robado mediante un compromiso de cuenta a nivel de registrador, transferido a través de China, apuntado a una IP vinculada a malware y puesto a la venta por 190.000 dólares. Así fue como ocurrió, cómo se recuperó y qué enseña sobre la seguridad de las cuentas de registrador.'
keywords: ['perl.com', 'robo de dominio perl.com', 'secuestro de dominio', 'robo de dominio', 'compromiso de cuenta de registrador', 'ingeniería social', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'secuestro de DNS', 'seguridad de dominios', 'apropiación de cuenta', 'BizCN']
relatedArticles:
  - /es/blog/the-panix-com-domain-hijack/
  - /es/blog/the-lenovo-com-dns-hijack/
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-godaddy-multi-year-breach/
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

Algunos dominios son infraestructura que casualmente parece un nombre. **perl.com** es uno de ellos. No es un activo de marketing ni una marca que alguien construyó el año pasado — es un elemento del mobiliario de internet en torno al que la comunidad de programación Perl ha vivido desde los primeros días de la web, la puerta de entrada canónica a documentación, artículos y la cara pública del lenguaje.

Así que cuando, en la mañana del 27 de enero de 2021, esa puerta de entrada repentinamente perteneció a alguien más, no fue una jugada de marca inteligente ni una venta negociada. Fue un robo. El dominio había sido silenciosamente arrancado del control de su legítimo propietario meses antes, había pasado por distintos registradores y había sido apuntado a una dirección IP con historial de distribución de malware. Los propios operadores de red de la comunidad lo dijeron sin rodeos: ["El dominio perl.com fue secuestrado esta mañana y actualmente apunta a un sitio de estacionamiento."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

Esta es la historia del EP19 de nuestra serie Domain Mayday: cómo un dominio comunitario de treinta años fue robado sin que nadie vulnerara un solo servidor, y lo que costó recuperarlo.

## Un dominio en posesión desde principios de los 90

Para entender el robo, hay que comprender lo ordinaria que era la situación — y cómo esa misma cotidianidad era la vulnerabilidad.

perl.com no estaba guardado en alguna caja fuerte corporativa blindada. Se mantenía como la mayoría de los dominios con larga trayectoria: en manos de una persona de confianza, en un [registrador](/es/glossary/registrar/) convencional, renovado año tras año sin contratiempos. El editor del sitio, brian d foy, describió más tarde la historia en su propio relato del incidente: ["Este dominio fue registrado a principios de los 90, a Tom Christiansen se le cedió el control poco después, y básicamente siguió pagando las cuotas de registro."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

Ese es el perfil exacto de una enorme fracción de los nombres más importantes de internet. Una persona, un inicio de sesión en un registrador y tres décadas de pagar la factura sin complicaciones. Funciona perfectamente — hasta que la propia cuenta del registrador se convierte en el objetivo.

## 27 de enero de 2021: la puerta de entrada cambia de cerradura

![Arte conceptual colorido y vívido de un viejo letrero de madera de una comunidad siendo silenciosamente destornillado de su poste en la noche y llevado, contra un cielo de circuitos luminosos](../../assets/the-perl-com-domain-theft-01-theft.jpg)

La primera alarma pública vino de las personas que gestionan la infraestructura de la comunidad Perl. El blog del NOC (Centro de Operaciones de Red) de Perl publicó que el dominio había sido secuestrado "esta mañana" y ahora apuntaba a un lugar donde no debería. Peor aún que una simple página de estacionamiento, los operadores advirtieron que ["hay señales de que podría estar relacionado con sitios que han distribuido malware en el pasado."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

brian d foy lo hizo público el mismo día. Los informes sobre el incidente confirmaron el momento con precisión: ["El 27 de enero, el autor de programación Perl y editor de Perl.com brian d foy tuiteó que el dominio perl.com estaba repentinamente registrado a nombre de otra persona."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

La respuesta de la comunidad fue rápida y pragmática. Mientras comenzaba el trabajo de recuperación, el NOC redirigió a los lectores a una copia de seguridad: ["Si buscas el contenido, puedes visitar perldotcom.perl.org."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) El nombre canónico había desaparecido, pero el contenido seguía siendo accesible.

## Lo que estaba en riesgo: una IP vinculada a malware

Un dominio robado es peligroso en proporción a la confianza que porta — y perl.com portaba mucha. Millones de desarrolladores, tutoriales, herramientas de CPAN y antiguos enlaces en toda la web apuntaban a él. Quien controlara el nombre controlaba a qué resolvía toda esa confianza.

Y el nuevo propietario no lo apuntó a algo inofensivo. Como documentó BleepingComputer, ["el nombre de dominio perl.com fue robado y ahora apunta a una dirección IP asociada con campañas de malware."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

Las huellas técnicas eran específicas. Los registros DNS fueron reescritos de modo que ["las direcciones IP asignadas al dominio cambiaron de 151.101.2.132 a la dirección IP de Google Cloud 35.186.238[.]101."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) Ese destino tenía un pasado: ["En 2019, la dirección IP 35.186.238[.]101 estuvo vinculada a un dominio que distribuía un ejecutable de malware para el ransomware Locky, ya desaparecido."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

Sumar esos dos hechos hace evidente el peligro. Un nombre en el que los desarrolladores confían de manera refleja, que de repente resuelve a una IP con historial de malware, es la configuración casi perfecta para engañar exactamente al tipo de audiencia técnica y consciente de la seguridad que normalmente es difícil de engañar.

## Cómo ocurrió: la cuenta del registrador, no el servidor

![Arte conceptual colorido y vívido de un documento falsificado de cambio de titularidad siendo deslizado sobre el mostrador de un servicio de registro, un sello oficial brillando en rojo, papeles arremolinándose en luz de neón — sin logotipos de marcas](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

Esta es la parte que convierte este incidente en un caso de manual y no en una nota al pie: nadie hackeó el servidor web de perl.com y nadie adivinó una contraseña de DNS. El ataque ocurrió un nivel más arriba, en el registrador — la empresa que mantiene el registro autoritativo de quién posee el nombre.

En su análisis posterior al incidente, brian d foy describió directamente la hipótesis de trabajo: ["Creemos que hubo un ataque de ingeniería social contra Network Solutions, con documentos falsificados y demás."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) La prensa lo enmarcó de la misma manera: el robo fue ["un ataque de ingeniería social que convenció al registrador Network Solutions de alterar los registros del dominio sin autorización válida."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

El detalle más inquietante es la cronología. La comunidad solo *se dio cuenta* en enero, pero el compromiso real fue mucho anterior. El trabajo forense del abogado especializado en dominios John Berryhill empujó la fecha real varios meses atrás; como recoge el relato de perl.com, ["John Berryhill aportó trabajo forense en Twitter que demostró que el compromiso ocurrió realmente en septiembre."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek confirmó la paciencia del atacante: ["El ataque, explica, tuvo lugar en septiembre de 2020"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) — aproximadamente cuatro meses antes de que nadie viera los efectos.

¿Por qué la larga espera? Porque las reglas de las transferencias de dominio recompensan la paciencia. ["ICANN prohíbe la transferencia de un dominio durante 60 días tras la actualización de la información de contacto."](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) Un atacante que toma silenciosamente el control de una cuenta de registrador en septiembre no puede llevarse inmediatamente el dominio — así que lo guardó, dejó correr el reloj y actuó una vez que caducó el bloqueo.

Cuando finalmente actuaron, lavaron el nombre a través de registradores y fronteras para dificultar la recuperación. The Register documentó el primer salto: ["El dominio fue transferido al registrador BizCN en diciembre, pero los servidores de nombres no cambiaron."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer trazó el mismo camino geográficamente: el dominio ["fue robado en septiembre de 2020 mientras estaba en Network Solutions, transferido a un registrador en China el día de Navidad"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day) antes del último salto en enero, cuando ["el dominio fue transferido de nuevo en enero a otro registrador, Key Systems, GmbH."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

Y entonces intentaron cobrar. Con el nombre recién reubicado, ["el titular no autorizado intentó vender el dominio por 190.000 dólares en el mercado de dominios Afternic."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) Un activo comunitario de treinta años, robado mediante papeleo, puesto a la venta como muebles de segunda mano.

## La recuperación: semanas de papeleo para deshacer papeleo

La misma maquinaria que permitió el robo — registradores, registros y registros de titularidad — era también el único camino de vuelta. No había servidor que volver a asegurar ni parche que desplegar. Alguien tenía que *demostrar*, a través de la cadena de registradores y registros, que Tom Christiansen era el propietario real y que el nuevo "propietario" era un fraude.

Ese trabajo comenzó en cuestión de días. Para el 30 de enero, el NOC de Perl informó de que ["Network Solutions está trabajando con Tom Christiansen, el titular legítimo, en la recuperación del dominio Perl.com."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) El esfuerzo ["finalmente condujo a la restauración del dominio a su anterior propietario, Tom Christiansen, a principios de febrero."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

Pero "restaurado" no significaba "arreglado". El propio enfoque de brian d foy captura tanto el alivio como el trabajo pendiente: ["El dominio Perl.com está de nuevo en manos de Tom Christiansen y estamos trabajando en las distintas actualizaciones de seguridad para que esto no vuelva a ocurrir."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) Dado que el dominio había apuntado a una IP vinculada a malware, los productos de seguridad lo habían incluido en listas negras y algunos resolutores de DNS lo estaban sumidero. Incluso después de que el [registro](/es/glossary/registry/) fuera correcto, tardó semanas adicionales en volver a ser de confianza en los sistemas de reputación de internet — una cola larga que extendió la pesadilla durante aproximadamente dos meses en total.

El titular, en palabras de foy, fue casi moderado: ["Durante una semana perdimos el control del dominio Perl.com."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) Una semana de robo activo; meses de compromiso latente antes; semanas de limpieza después.

## Lo que esto enseña sobre la seguridad de cuentas de registrador y los dominios de larga trayectoria

El robo de perl.com es tan instructivo precisamente porque no ocurrió nada exótico. Al reducirlo a lo esencial, las lecciones resultan incómodamente generales:

1. **Tu cuenta de registrador es la joya de la corona real.** Todo el mundo protege sus servidores y su servidor DNS. Pero el *registro de titularidad* del dominio vive en el registrador, y esa cuenta a menudo está protegida por poco más que una contraseña y un equipo de soporte al que se puede convencer para hacer cambios. perl.com fue robado ahí, no en el perímetro.

2. **La ingeniería social supera los controles técnicos.** Sin exploits, sin malware en el lado de la víctima — solo ["documentos falsificados y demás"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.) suficientemente convincentes para mover un registro real. La autenticación de dos factores en tu propio inicio de sesión no ayuda si los *humanos* del registrador pueden ser convencidos de ignorarla.

3. **Los dominios de larga trayectoria son objetivos fáciles.** Un nombre registrado a principios de los 90 y renovado en piloto automático durante treinta años tiende a acumular información de contacto obsoleta, un único punto de fallo humano y un propietario que no vigila el registro [WHOIS](/es/glossary/whois/) a diario. La tranquilidad silenciosa es exactamente lo que permite que un compromiso de septiembre pase inadvertido hasta enero.

4. **Las reglas de transferencia son un arma de doble filo.** El [bloqueo de transferencia](/es/glossary/transfer-lock/) de 60 días después de una actualización, que se supone que *protege* a los propietarios, se convirtió en la sala de espera del atacante. La paciencia más el lavado a través de registradores y fronteras convirtió un arreglo rápido en una recuperación de múltiples partes y múltiples semanas.

5. **La recuperación es más lenta que el robo.** Robar el nombre requirió un documento falsificado. Recuperarlo requirió registradores, un registro, las pruebas del propietario legítimo y luego semanas de reconstrucción de la reputación con listas de bloqueo y resolutores. El robo es una transacción; la restitución son muchas.

El sombrío resumen: para un dominio como perl.com, la fortaleza de tu contraseña importa menos que si tu registrador puede ser engañado para que la ignore.

## El enfoque de Namefi

![Ilustración colorida de la titularidad de dominios verificable y resistente a manipulaciones — una tarjeta de dominio protegida por un escudo verde, un token verde de Namefi y continuidad DNS](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

Cada paso del robo de perl.com giró en torno a una debilidad: la titularidad era un *registro en la cuenta de otra persona*, modificable por quien pudiera convencer al agente de soporte adecuado. El atacante nunca necesitó las claves del propietario. Necesitó la confianza del registrador — y un papel falsificado fue suficiente para transferir un activo de treinta años a través del planeta y ponerlo a la venta.

[Namefi](https://namefi.io) se construye sobre la premisa contraria: que la titularidad de dominios debe ser criptográficamente verificable y difícil de reescribir en silencio. Al representar el control de dominio como un activo tokenizado y en cadena que sigue siendo compatible con DNS, la respuesta autoritativa a "¿quién posee este nombre?" deja de ser una línea mutable en la base de datos de un registrador que una llamada telefónica convincente puede cambiar. Las transferencias se convierten en eventos firmados y auditables en lugar de papeleo administrativo — y un "cambio de titularidad" fraudulento no tiene ninguna puerta discreta por la que entrar.

No habría hecho que perl.com fuera imposible de robar de la noche a la mañana; los registradores y los registros siguen siendo parte de la cadena. Pero ataca exactamente el modo de fallo que definió este incidente — la brecha entre *pagar por un nombre durante treinta años* y *ser capaz de demostrar, de manera resistente a manipulaciones, que es tuyo* — y reduce la ventana en la que un dominio robado puede ser lavado antes de que nadie pueda objetar.

perl.com recuperó su puerta de entrada. La pregunta más difícil que deja este episodio es por qué la cerradura era algo que un extraño con los papeles adecuados podía abrir.

## Fuentes y lecturas adicionales

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
