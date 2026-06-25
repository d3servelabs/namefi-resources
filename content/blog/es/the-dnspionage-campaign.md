---
title: 'DNSpionage: La campaña que convirtió el DNS en un arma contra gobiernos'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'A finales de 2018, Cisco Talos reveló DNSpionage — una campaña vinculada a intereses iraníes que reescribió registros DNS gubernamentales, redirigió el tráfico de correo electrónico y VPN hacia servidores atacantes, y obtuvo certificados TLS válidos para permanecer invisible. Contribuyó a desencadenar la primera directiva de emergencia de este tipo emitida por el gobierno de EE. UU.'
keywords: ['dnspionage', 'secuestro dns', 'redirección dns', 'cisco talos', 'directiva de emergencia cisa 19-01', 'sea turtle dns', 'secuestro dns irán', 'fireeye secuestro dns', 'abuso de certificados lets encrypt', 'seguridad dns', 'seguridad de dominios', 'ciberespionaje de estados nación', 'mitigar manipulación de infraestructura dns']
---

La mayoría de los desastres relacionados con dominios tienen que ver con quién *posee* un nombre. Este caso era sobre quién lo *controla* — y durante unos meses a finales de 2018, la respuesta para decenas de dominios gubernamentales en Oriente Medio fue: no los propios gobiernos.

No hubo ninguna brecha en un servidor web. No había malware en la página de inicio. Ningún defacement, ninguna nota de rescate, ningún rastro revelador en los registros de aplicaciones. Los atacantes nunca necesitaron irrumpir en los edificios. Entraron por la única puerta que casi nadie vigila: el **registro [DNS](/es/glossary/dns/)** que indica dónde viven realmente el correo electrónico y los sitios web de un dominio. Lo editaron — en silencio, con credenciales válidas, detrás de un certificado TLS válido — y el tráfico mundial siguió las nuevas instrucciones sin rechistar.

Cisco Talos lo denominó **DNSpionage**. Es una de las demostraciones más limpias registradas de que el Sistema de Nombres de Dominio no es solo fontanería. Es infraestructura de seguridad nacional.

## El DNS como arma de política de estado

Para entender por qué DNSpionage sacudió a los gobiernos, hay que recordar qué hace realmente el DNS.

Cada vez que envías un correo a un ministerio, inicias sesión en una VPN corporativa o abres una página de correo web, tu dispositivo primero le hace una pregunta al DNS: *¿cuál es la dirección IP de este nombre?* Lo que responda el DNS, tú lo confías. Tu cliente de correo se conecta ahí. Tu VPN se autentica ahí. Tu navegador entrega la sesión ahí. El DNS es la agenda de direcciones de todo internet, y casi nada comprueba si esa agenda ha sido editada.

Esa es la propiedad que DNSpionage explotó. Si puedes cambiar el registro — no romper el cifrado, no descifrar el archivo de contraseñas, solo cambiar el *puntero* — puedes situarte invisiblemente entre un objetivo y los servicios en los que confía. El correo electrónico pasa por ti. Los inicios de sesión de VPN pasan por ti. Y como el nombre de dominio de la propia víctima sigue apareciendo en la barra del navegador, nada parece mal.

Esto es espionaje en la capa por debajo de la aplicación. Es también, incómodamente, la capa que la mayoría de los programas de seguridad tratan como un problema ya resuelto.

## La campaña DNSpionage (2018–2019)

![Ilustración conceptual colorida y vívida de una sala de interceptación oculta bajo una centralita nacional, donde un operador en las sombras redirige silenciosamente el correo de un país a través de sellos oficiales falsificados, cables de datos brillantes que se bifurcan hacia un puesto de escucha secreto](../../assets/the-dnspionage-campaign-01-campaign.jpg)

El **27 de noviembre de 2018**, Cisco Talos publicó su primer informe. La frase inicial era específica: "[Cisco Talos descubrió recientemente una nueva campaña dirigida contra Líbano y los Emiratos Árabes Unidos (EAU) que afecta a dominios .gov, así como a una compañía aérea libanesa privada](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Cisco%20Talos%20recently%20discovered%20a%20new%20campaign%20targeting%20Lebanon%20and%20the%20United%20Arab%20Emirates)."

La campaña tenía dos facetas. Una era una operación de malware bastante ordinaria: "[Esta campaña en particular utiliza dos sitios web falsos y maliciosos que contienen ofertas de empleo y se usan para comprometer objetivos mediante documentos maliciosos de Microsoft Office con macros incrustadas](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=This%20particular%20campaign%20utilizes%20two%20fake%2C%20malicious%20websites%20containing%20job%20postings)." Los sitios cebo suplantaban a reclutadores reales — "[hr-wipro[.]com (con redirección a wipro.com) y hr-suncor[.]com (con redirección a suncor.com)](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=hr%2Dwipro)" — e instalaban una herramienta de acceso remoto personalizada que, de forma característica, podía comunicarse con su servidor de comando a través del propio DNS.

Pero la segunda faceta es la que hizo historia. En palabras de Talos: "[En una campaña separada, los atacantes usaron la misma IP para redirigir el DNS de dominios .gov legítimos y de dominios de empresas privadas](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=the%20attackers%20used%20the%20same%20IP%20to%20redirect%20the%20DNS%20of%20legitimate)." Los servidores de nombres gubernamentales reales fueron apuntados a máquinas controladas por los atacantes: "[Múltiples servidores de nombres pertenecientes al sector público en Líbano y EAU, así como algunas empresas en Líbano, fueron aparentemente comprometidos, y los nombres de host bajo su control fueron apuntados a direcciones IP controladas por el atacante](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Multiple%20nameservers%20belonging%20to%20the%20public%20sector)."

Los sitios de empleo falsos eran la parte que parecía ciberdelincuencia ordinaria. La redirección de DNS era la parte que parecía política de estado.

Cuando investigadores independientes terminaron de tirar del hilo, el alcance era mucho mayor que el de dos países. Brian Krebs, trabajando a partir de las direcciones IP de los atacantes, encontró que "[en los últimos meses de 2018 los piratas informáticos detrás de DNSpionage lograron comprometer componentes clave de la infraestructura DNS de más de 50 empresas y agencias gubernamentales de Oriente Medio](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=in%20the%20last%20few%20months%20of%202018%20the%20hackers%20behind%20DNSpionage%20succeeded)."

## Quiénes fueron los objetivos y lo que estaba en juego

La lista de víctimas se lee como un mapa del sistema nervioso de una región: ministerios de asuntos exteriores, aviación civil, operadores de telecomunicaciones, infraestructura de internet y el correo web del ministerio de finanzas nacional. No son objetivos aleatorios. Son los lugares por donde pasan los secretos de una nación.

Dos meses después del primer informe de Talos, FireEye (ahora Mandiant) publicó su propio análisis e hizo la atribución de forma explícita pero cautelosa. Según FireEye, "[la investigación inicial sugiere que el actor o actores responsables tienen un nexo con Irán](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/#:~:text=initial%20research%20suggests%20the%20actor%20or%20actors%20responsible%20have%20a%20nexus%20to%20Iran)." Al informar sobre los hallazgos de FireEye, SecurityWeek señaló que la firma evaluó con "[confianza moderada](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=moderate%20confidence)" que Irán estaba detrás de los ataques, basándose en evidencias técnicas y en el hecho de que la campaña se alineaba con los intereses del gobierno iraní.

Las apuestas se derivan directamente de los objetivos. Cuando puedes leer el correo electrónico de un ministerio de asuntos exteriores en texto claro, no estás robando datos — estás leyendo la mente de un gobierno casi en tiempo real. Por eso una campaña de recolección de credenciales en la capa DNS se entiende correctamente no como fraude, sino como recopilación de inteligencia contra el Estado.

## Cómo ocurrió: registros DNS + certificados válidos + sitios de empleo falsos

![Ilustración conceptual colorida y vívida de la centralita de correo nacional siendo reparada en silencio — tarjetas de direcciones brillantes siendo intercambiadas en una enorme pared de enrutamiento, cada línea redirigida pasando por un sello de candado verde falsificado antes de llegar a una cabina de escucha oculta](../../assets/the-dnspionage-campaign-02-dns-redirection.jpg)

Vale la pena detenerse aquí, porque la técnica es elegante de la peor manera. Hubo tres movimientos.

**Movimiento uno: conseguir las llaves de la agenda de direcciones.** Los atacantes no rompieron la criptografía del DNS. Iniciaron sesión. FireEye describió dos métodos: "[Un método consiste en iniciar sesión en la interfaz de administración de un proveedor de DNS con credenciales comprometidas y cambiar los registros DNS A para interceptar el tráfico de correo electrónico. Otro método consiste en cambiar los registros DNS NS después de hackear la cuenta del registrador de dominio de la víctima](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=One%20method%20involves%20logging%20into%20a%20DNS%20provider)." Las credenciales robadas de registradores y proveedores de DNS eran la llave maestra. Quien tiene el acceso al [registrador](/es/glossary/registrar/) controla el dominio — y el dominio controla todo lo que apunta a él.

**Movimiento dos: redirigir el tráfico de modo que siga funcionando.** Apuntar el servidor de correo de un gobierno a tu propia IP normalmente rompería las cosas y haría saltar alarmas. Por eso los atacantes usaron un proxy. El tráfico era retransmitido al destino real después de ser capturado, de modo que los usuarios veían una bandeja de entrada funcional y una VPN funcionando. Como describió FireEye en una tercera variante: "[los usuarios eran redirigidos a la infraestructura controlada por el atacante](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=users%20were%20redirected%20to%20attacker%2Dcontrolled%20infrastructure)." La interceptación era un ataque de hombre en el medio que reenviaba silenciosamente el tráfico — invisible precisamente porque nada parecía fallar.

**Movimiento tres: vencer el candado verde.** Los servicios modernos utilizan TLS, que debería lanzar una advertencia de certificado en el momento en que el tráfico llegue al servidor equivocado. Los atacantes cerraron esa brecha obteniendo sus propios certificados legítimos. Talos descubrió que "[durante cada compromiso de DNS, el actor generó cuidadosamente certificados de Let's Encrypt para los dominios redirigidos](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=During%20each%20DNS%20compromise%2C%20the%20actor%20carefully%20generated)." Como ahora controlaban el DNS del dominio, podían *demostrar* el control ante una autoridad certificadora — y la validación automática de dominio les entregó un certificado válido. FireEye confirmó el mismo patrón en todos los métodos: "[en ambos casos los atacantes usaron certificados de Let's Encrypt para evitar levantar sospechas](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=in%20both%20cases%20the%20attackers%20used%20Let%E2%80%99s%20Encrypt%20certificates)."

El resultado, en el resumen de Krebs, fue total: "[estos secuestros de DNS también allanaron el camino para que los atacantes obtuvieran certificados de cifrado SSL para los dominios objetivo (p. ej. webmail.finance.gov.lb), lo que les permitió descifrar el correo interceptado y las credenciales de VPN y verlos en texto claro](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=these%20DNS%20hijacks%20also%20paved%20the%20way%20for%20the%20attackers%20to%20obtain%20SSL%20encryption%20certificates)." Correos electrónicos e inicios de sesión de VPN, capturados y legibles, con un candado válido en todo momento.

Nótese lo que *no* fue necesario. Ningún zero-day. Ningún malware en los servidores de la víctima. Ningún firewall vulnerado. El ataque vivió enteramente en la brecha entre "soy propietario de este dominio" y "puedo demostrar quién controla actualmente sus registros." Esa brecha es donde vivió DNSpionage — y es más amplia de lo que la mayoría de las organizaciones creen.

## La respuesta: Directiva de Emergencia CISA 19-01

Las revelaciones combinadas de Talos y FireEye aterrizaron con fuerza en Washington. El **22 de enero de 2019**, la Agencia de Ciberseguridad e Infraestructura de los EE. UU. (CISA) emitió la **Directiva de Emergencia 19-01, "Mitigar la Manipulación de la Infraestructura DNS"** — la primera directiva de emergencia que CISA jamás había emitido, y una rara instrucción vinculante para todo el gobierno civil federal.

El diagnóstico de la directiva coincidía exactamente con la investigación. Según citas de informes contemporáneos, CISA advirtió que "[los atacantes han redirigido e interceptado tráfico web y de correo electrónico, y podrían hacerlo con otros servicios en red](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=redirected%20and%20intercepted%20web%20and%20mail%20traffic)," y que los actores habían "[comprometido las cuentas de los administradores a cargo de los dominios DNS gubernamentales](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=compromised%20the%20accounts%20of%20administrators)."

Luego ordenó cuatro acciones, con un plazo de 10 días — y leen como una réplica directa a cada uno de los tres movimientos del atacante:

1. **Auditar los registros DNS** — verificar que nada haya sido manipulado en servidores autoritativos y secundarios.
2. **Cambiar las contraseñas de las cuentas DNS** — rotar todas las credenciales que pueden editar el DNS.
3. **Añadir autenticación multifactor** a todas las cuentas de administración de DNS — para que una contraseña robada por sí sola ya no sea la llave maestra.
4. **Monitorizar los registros de Transparencia de Certificados** — vigilar los certificados emitidos para sus dominios que nunca fueron solicitados por ellos.

Ese cuarto punto es revelador. CISA no solo le decía a las agencias que cerraran la puerta; les decía que vigilaran los registros públicos de certificados en busca de evidencias de que alguien ya había usado una copia de la llave. DNSpionage había convertido la Transparencia de Certificados de una función de nicho de PKI en una herramienta de detección de primera línea contra el secuestro de DNS de estados nación.

Krebs capturó con claridad la excepcionalidad del momento: "[el Departamento de Seguridad Nacional de EE. UU. emitió una rara directiva de emergencia ordenando a todas las agencias civiles federales de EE. UU. que aseguraran las credenciales de inicio de sesión de sus registros de dominio de internet](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=issued%20a%20rare%20emergency%20directive%20ordering%20all%20U.S.%20federal%20civilian%20agencies)."

DNSpionage no actuó solo para provocarla. Una operación paralela, aún más agresiva, que Talos llamó **Sea Turtle** — que Talos describió como "[el primer caso conocido de una organización de registro de nombres de dominio comprometida para operaciones de ciberespionaje](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=first%20known%20case%20of%20a%20domain%20name%20registry%20organization%20that%20was%20compromised)," afectando a "[aproximadamente 40 organizaciones diferentes en 13 países distintos](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=approximately%2040%20different%20organizations%20across%2013%20different%20countries)" — elevó aún más las apuestas. Talos fue cuidadoso en mantener las dos operaciones distintas; en su seguimiento de abril de 2019 señaló que el comportamiento de DNSpionage "[probablemente continuará distinguiendo a este actor de campañas más preocupantes como Sea Turtle](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/#:~:text=will%20likely%20continue%20to%20distinguish%20this%20actor%20from%20more%20concerning%20campaigns%20like%20Sea%20Turtle)." Juntas, las dos campañas hicieron el mismo punto desde ángulos diferentes: la cadena de suministro del DNS se había convertido en un teatro de conflicto estatal.

## Lo que esto enseña sobre el DNS como infraestructura de seguridad nacional

DNSpionage tiene poco drama de malware pero muchas lecciones incómodas. Algunas que vale la pena conservar:

- **La cuenta del registrador es una joya de la corona.** Todo lo que depende de un dominio — correo, web, VPN, inicio de sesión único, emisión de certificados — hereda la confianza de quien puede editar su DNS. Una contraseña sin segundo factor en esa cuenta no es una brecha pequeña; es todo el castillo con la puerta abierta. Las primeras instrucciones de CISA fueron sobre *credenciales*, no sobre firewalls, exactamente por esta razón.
- **Un certificado válido no es prueba de legitimidad.** El candado verde demuestra que el tráfico está cifrado hacia *quien controle el dominio en este momento*. Si un atacante controla el DNS, la validación automática de dominio le emitirá alegremente un certificado real. La confianza en TLS se toma prestada de la confianza en el DNS — y el DNS es más frágil de lo que la mayoría de la gente asume.
- **Los ataques de DNS son invisibles por diseño.** Porque el proxy reenvía el tráfico real, los servicios de la víctima siguen funcionando. No hay ninguna interrupción que investigar. La única señal externa puede ser un certificado apareciendo en un registro CT público — razón por la cual monitorizar esos registros pasó de opcional a obligatorio de la noche a la mañana.
- **El control de dominio es un control de seguridad nacional.** Cuando la entidad que edita el DNS de un ministerio de asuntos exteriores es un estado hostil, la distinción entre "operaciones de TI" y "contrainteligencia" se desvanece. La agenda de direcciones de internet es terreno estratégico.

El hilo conductor es una sola pregunta que casi ninguna herramienta operativa responde en tiempo real: **¿quién controla realmente este dominio ahora mismo, y puedo probar que no ha cambiado silenciosamente?** DNSpionage funcionó porque esa pregunta era tan difícil de responder que los gobiernos de toda una región no podían hacerlo.

## El ángulo Namefi

![Ilustración colorida de propiedad de dominio verificable y resistente a manipulaciones — una tarjeta de dominio asegurada por un escudo verde, un token Namefi verde y continuidad DNS](../../assets/the-dnspionage-campaign-03-namefi-angle.jpg)

DNSpionage es, en su raíz, un problema de **procedencia**. Los atacantes nunca fueron propietarios de los dominios objetivo. Tomaron prestado el control de ellos robando las credenciales que permitían a los paneles de registradores y proveedores de DNS realizar ediciones silenciosas e inverificables — y nada en el sistema marcó que la *parte en control* había cambiado.

[Namefi](https://namefi.io) se basa en la premisa de que la propiedad y el control de dominios deben ser **verificables, portátiles y a prueba de manipulaciones**, en lugar de estar encerrados en un opaco inicio de sesión de registrador. La propiedad tokenizada hace que "quién controla este nombre" sea un hecho que puedes comprobar y auditar, no una configuración oculta detrás de una contraseña que puede que ya esté en manos de otra persona. Eso no reemplaza la higiene de la cuenta del registrador ni la autenticación multifactor — el consejo de CISA sigue siendo completamente correcto — pero ataca la brecha más profunda que DNSpionage explotó: la dificultad de *probar*, de forma independiente y continua, que la parte que controla un dominio es la parte que debería controlarlo.

La lección de DNSpionage no es que el DNS sea frágil de alguna manera exótica. Es que el hecho más importante sobre un dominio — quién lo controla — estuvo durante demasiado tiempo separado de la respuesta correcta únicamente por una contraseña robada. Hacer ese hecho verificable es todo el objetivo.

## Fuentes y lecturas adicionales

- Cisco Talos — [DNSpionage Campaign Targets Middle East](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/) (27 de noviembre de 2018)
- Cisco Talos — [DNSpionage brings out the Karkoff](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/) (23 de abril de 2019)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (18 de febrero de 2019)
- The Register — [Baddies linked to Iran fingered for DNS hijacking to read Middle Eastern regimes' emails](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/) (10 de enero de 2019)
- SecurityWeek — [Iran-Linked DNS Hijacking Attacks Target Organizations Worldwide](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/) (10 de enero de 2019)
- BleepingComputer — [DHS Issues Emergency Directive to Prevent DNS Hijacking Attacks](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/) (enero de 2019)
- Network World — [Cisco Talos details exceptionally dangerous DNS hijacking attack](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html) (17 de abril de 2019)
- Network World — [Cisco: DNSpionage attack adds new tools, morphs tactics](https://www.networkworld.com/article/967303/cisco-dnspionage-attack-adds-new-tools-morphs-tactics.html)
- CERT-IST — [DNSpionage and DNS data hijacking](https://www.cert-ist.com/public/en/SO_detail?format=html&code=dnspionage)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) (22 de enero de 2019)
