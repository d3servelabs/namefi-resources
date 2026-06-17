---
title: "DNSpionage: la campaña que convirtió el DNS en un arma contra los gobiernos"
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "A finales de 2018, Cisco Talos reveló DNSpionage, una campaña que posteriormente se vinculó a intereses iraníes y que reescribió los registros DNS gubernamentales, redirigió el tráfico de correo electrónico y VPN a servidores de los atacantes y emitió certificados TLS válidos para mantenerse invisible. Ayudó a desencadenar la primera directiva de emergencia de su tipo por parte del gobierno de los EE. UU."
keywords: ["dnspionage", "secuestro de dns", "redirección de dns", "cisco talos", "directiva de emergencia de cisa 19-01", "sea turtle dns", "secuestro de dns iraní", "secuestro de dns fireeye", "abuso de certificados let's encrypt", "seguridad dns", "seguridad de dominios", "ciberespionaje de estado nación", "mitigar manipulación de infraestructura dns"]
---

La mayoría de los desastres de dominios tienen que ver con quién *posee* un nombre. Este trató sobre quién lo *controla*, y durante algunos meses a finales de 2018, la respuesta para decenas de dominios gubernamentales en todo Medio Oriente fue: no los gobiernos.

No hubo una brecha en un servidor web. Ni malware en la página de inicio. Ninguna desfiguración (defacement), ninguna nota de rescate, ninguna prueba concluyente en los registros de la aplicación. Los atacantes nunca necesitaron irrumpir en los edificios. Entraron por la única puerta que casi nadie vigila: el **registro DNS** que indica dónde residen realmente el correo electrónico y los sitios web de un dominio. Lo editaron —silenciosamente, con credenciales válidas, detrás de un certificado TLS válido— y el tráfico del mundo siguió las nuevas instrucciones sin quejarse.

Cisco Talos lo llamó **DNSpionage**. Es una de las demostraciones documentadas más claras de que el Sistema de Nombres de Dominio (DNS) no es solo una infraestructura técnica. Es infraestructura de seguridad nacional.

## El DNS como arma de Estado

Para entender por qué DNSpionage conmocionó a los gobiernos, hay que recordar qué hace realmente el DNS.

Cada vez que envías un correo a un ministerio, inicias sesión en una VPN corporativa o cargas una página de correo web, tu dispositivo le hace primero una pregunta al DNS: *¿qué dirección IP tiene este nombre?* Lo que el DNS responda, tú confías en ello. Tu cliente de correo se conecta ahí. Tu VPN se autentica ahí. Tu navegador le entrega la sesión ahí. El DNS es la libreta de direcciones de toda Internet, y casi nada comprueba si dicha libreta ha sido editada.

Esa es la propiedad que DNSpionage explotó. Si puedes cambiar el registro —no romper el cifrado, no descifrar el archivo de contraseñas, solo cambiar el *puntero*— puedes interponerte invisiblemente entre un objetivo y los servicios en los que confían. El correo electrónico fluye a través de ti. Los inicios de sesión VPN fluyen a través de ti. Y como el propio nombre de dominio de la víctima todavía aparece en la barra del navegador, nada parece estar mal.

Esto es espionaje en la capa inferior a la aplicación. También es, para nuestra incomodidad, la capa que la mayoría de los programas de seguridad tratan como un problema ya resuelto.

## La campaña de DNSpionage (2018–2019)

![A vivid colorful concept illustration of a hidden interception room beneath a national switchboard, where a shadowy operator quietly reroutes a country's mail through forged official seals, glowing data cables splitting toward a secret listening post](../../assets/the-dnspionage-campaign-01-campaign.jpg)

El **27 de noviembre de 2018**, Cisco Talos publicó su primer informe. La línea de apertura fue específica: "[Cisco Talos recently discovered a new campaign targeting Lebanon and the United Arab Emirates (UAE) affecting .gov domains, as well as a private Lebanese airline company](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Cisco%20Talos%20recently%20discovered%20a%20new%20campaign%20targeting%20Lebanon%20and%20the%20United%20Arab%20Emirates)".

La campaña tenía dos caras. Una era una operación de malware bastante ordinaria: "[This particular campaign utilizes two fake, malicious websites containing job postings that are used to compromise targets via malicious Microsoft Office documents with embedded macros](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=This%20particular%20campaign%20utilizes%20two%20fake%2C%20malicious%20websites%20containing%20job%20postings)". Los sitios de cebo se hacían pasar por reclutadores reales —"[hr-wipro[.]com (with a redirection to wipro.com) and hr-suncor[.]com (with a redirection to suncor.com)](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=hr%2Dwipro)"— y descargaban una herramienta de acceso remoto personalizada que, de forma distintiva, podía comunicarse con su servidor de comando a través del propio DNS.

Pero la segunda cara es la que hizo historia. En palabras de Talos: "[In a separate campaign, the attackers used the same IP to redirect the DNS of legitimate .gov and private company domains](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=the%20attackers%20used%20the%20same%20IP%20to%20redirect%20the%20DNS%20of%20legitimate)". Los servidores de nombres gubernamentales reales apuntaban a máquinas que pertenecían a los atacantes: "[Multiple nameservers belonging to the public sector in Lebanon and UAE, as well as some companies in Lebanon, were apparently compromised, and hostnames under their control were pointed to attacker-controlled IP addresses](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Multiple%20nameservers%20belonging%20to%20the%20public%20sector)".

Los sitios de empleos falsos fueron la parte que parecía cibercrimen normal. La redirección de DNS fue la parte que parecía una operación de Estado.

Para cuando los investigadores independientes terminaron de tirar del hilo, el alcance era mucho mayor que el de dos países. Brian Krebs, trabajando hacia atrás desde las direcciones IP de los atacantes, descubrió que "[in the last few months of 2018 the hackers behind DNSpionage succeeded in compromising key components of DNS infrastructure for more than 50 Middle Eastern companies and government agencies](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=in%20the%20last%20few%20months%20of%202018%20the%20hackers%20behind%20DNSpionage%20succeeded)".

## A quiénes se atacó y qué estaba en juego

La lista de víctimas se lee como un mapa del sistema nervioso de una región: ministerios de relaciones exteriores, aviación civil, operadores de telecomunicaciones, infraestructura de Internet y el correo web de un ministerio nacional de finanzas. No son objetivos aleatorios. Son los lugares por donde viajan a través de los cables los secretos de una nación.

Dos meses después del primer informe de Talos, FireEye (ahora Mandiant) publicó su propio análisis e hizo que la atribución fuera explícita pero cuidadosa. Como lo expresó FireEye, "[initial research suggests the actor or actors responsible have a nexus to Iran](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/#:~:text=initial%20research%20suggests%20the%20actor%20or%20actors%20responsible%20have%20a%20nexus%20to%20Iran)". Informando sobre los hallazgos de FireEye, SecurityWeek señaló que la firma evaluó con "[moderate confidence](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=moderate%20confidence)" que Irán estaba detrás de los ataques, basándose en la evidencia técnica y en el hecho de que la campaña se alineaba con los intereses del gobierno iraní.

Lo que está en juego se deduce directamente de los objetivos. Cuando puedes leer los correos electrónicos de un ministerio de exteriores en texto claro, no estás robando datos: estás leyendo la mente de un gobierno casi en tiempo real. Es por eso que una campaña de recolección de credenciales en la capa DNS se entiende correctamente no como fraude, sino como recopilación de inteligencia contra el Estado.

## Cómo ocurrió: registros DNS + certificados válidos + sitios de empleo falsos

![A vivid colorful concept illustration of a national mail switchboard being silently re-patched — glowing address cards being swapped on a giant routing wall, each rerouted line passing through a forged green padlock seal before reaching a hidden listening booth](../../assets/the-dnspionage-campaign-02-dns-redirection.jpg)

Aquí está la parte por la que vale la pena detenerse, porque la técnica es elegante de la peor manera posible. Hubo tres movimientos.

**Primer movimiento: obtener las llaves de la libreta de direcciones.** Los atacantes no rompieron la criptografía del DNS. Simplemente iniciaron sesión. FireEye describió dos caminos: "[One method involves logging into a DNS provider's administration interface using compromised credentials and changing DNS A records in an effort to intercept email traffic. Another method involves changing DNS NS records after hacking into the victim's domain registrar account](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=One%20method%20involves%20logging%20into%20a%20DNS%20provider)". Las credenciales robadas del registrador y del host de DNS eran la llave maestra. Quien posee el acceso al registrador posee el dominio, y el dominio posee todo lo que apunte hacia él.

**Segundo movimiento: redirigir el tráfico de modo que siga funcionando.** Apuntar el servidor de correo de un gobierno a tu propia IP normalmente rompería las cosas y activaría las alarmas. Por lo tanto, los atacantes usaron proxys. El tráfico se retransmitía hacia el destino real después de ser capturado, de modo que los usuarios veían una bandeja de entrada y una VPN que funcionaban correctamente. Como describió FireEye sobre una tercera variante: "[users were redirected to attacker-controlled infrastructure](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=users%20were%20redirected%20to%20attacker%2Dcontrolled%20infrastructure)". La interceptación fue un ataque de intermediario (man-in-the-middle) que reenviaba de forma silenciosa e invisible precisamente porque nada parecía fallar.

**Tercer movimiento: eludir el candado verde.** Los servicios modernos utilizan TLS, lo que debería arrojar una advertencia de certificado en el momento en que el tráfico aterriza en el servidor incorrecto. Los atacantes cerraron esa brecha emitiendo sus propios certificados legítimos. Talos descubrió que "[during each DNS compromise, the actor carefully generated Let's Encrypt certificates for the redirected domains](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=During%20each%20DNS%20compromise%2C%20the%20actor%20carefully%20generated)". Como ahora controlaban el DNS del dominio, podían *demostrar* el control ante una autoridad certificadora, y la validación automatizada de dominio les entregaba un certificado válido. FireEye confirmó el mismo patrón en todos los métodos: "[in both cases the attackers used Let's Encrypt certificates to avoid raising suspicion](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=in%20both%20cases%20the%20attackers%20used%20Let%E2%80%99s%20Encrypt%20certificates)".

El resultado, según el resumen de Krebs, fue total: "[these DNS hijacks also paved the way for the attackers to obtain SSL encryption certificates for the targeted domains (e.g. webmail.finance.gov.lb), which allowed them to decrypt the intercepted email and VPN credentials and view them in plain text](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=these%20DNS%20hijacks%20also%20paved%20the%20way%20for%20the%20attackers%20to%20obtain%20SSL%20encryption%20certificates)". Inicios de sesión de correo electrónico y VPN, capturados y legibles, con un candado válido en todo momento.

Notemos lo que *no* se requirió. Ningún ataque de día cero (zero-day). Ningún malware en los propios servidores de la víctima. Ningún cortafuegos vulnerado. El ataque operó completamente en la brecha entre "soy el propietario de este dominio" y "puedo demostrar quién controla actualmente sus registros". Esa brecha es donde habitaba DNSpionage, y es más amplia de lo que la mayoría de las organizaciones creen.

## La respuesta: Directiva de Emergencia 19-01 de CISA

Las revelaciones conjuntas de Talos y FireEye impactaron con fuerza en Washington. El **22 de enero de 2019**, la Agencia de Seguridad de Infraestructura y Ciberseguridad (CISA) de los EE. UU. emitió la **Directiva de Emergencia 19-01, "Mitigación de la manipulación de la infraestructura de DNS"**, la primera directiva de emergencia que CISA había emitido en su historia, y una inusual instrucción de carácter vinculante para todo el gobierno civil federal.

El diagnóstico de la directiva coincidió exactamente con la investigación. Como se cita en informes de la época, CISA advirtió que "[attackers have redirected and intercepted web and mail traffic, and could do so for other networked services](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=redirected%20and%20intercepted%20web%20and%20mail%20traffic)", y que los actores habían "[compromised the accounts of administrators in charge of government DNS domains](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=compromised%20the%20accounts%20of%20administrators)".

Luego ordenó cuatro acciones, en un plazo de 10 días, que parecen una réplica directa a cada uno de los tres movimientos de los atacantes:

1. **Audite sus registros DNS**: verifique que nada haya sido manipulado en los servidores autoritativos y secundarios.
2. **Cambie las contraseñas de las cuentas DNS**: rote cada credencial que tenga permisos para editar el DNS.
3. **Agregue autenticación multifactor** a todas las cuentas de administración de DNS: de modo que una contraseña robada por sí sola ya no sea la llave maestra.
4. **Monitoree los registros de Transparencia de Certificados (Certificate Transparency)**: vigile la emisión de certificados para sus dominios que usted nunca solicitó.

Ese cuarto punto es el más revelador. CISA no solo les estaba diciendo a las agencias que cerraran la puerta con llave; les estaba indicando que vigilaran los registros públicos de certificados en busca de evidencia de que alguien ya hubiera utilizado una copia de la llave. DNSpionage había convertido la Transparencia de Certificados de ser una función de nicho de la PKI (Infraestructura de Clave Pública) a una herramienta de detección de primera línea contra el secuestro de DNS ejecutado por Estados nación.

Krebs capturó de manera clara lo inusual del momento: "[the U.S. Department of Homeland Security issued a rare emergency directive ordering all U.S. federal civilian agencies to secure the login credentials for their Internet domain records](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=issued%20a%20rare%20emergency%20directive%20ordering%20all%20U.S.%20federal%20civilian%20agencies)".

DNSpionage no actuó por sí solo para provocar esto. Una operación paralela, aún más agresiva que Talos llamó **Sea Turtle** —la cual Talos describió como "[the first known case of a domain name registry organization that was compromised for cyber espionage operations](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=first%20known%20case%20of%20a%20domain%20name%20registry%20organization%20that%20was%20compromised)", afectando a "[approximately 40 different organizations across 13 different countries](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=approximately%2040%20different%20organizations%20across%2013%20different%20countries)"— aumentó aún más lo que estaba en juego. Talos tuvo cuidado de mantener ambas campañas separadas; en su seguimiento de abril de 2019 señaló que el comportamiento de DNSpionage "[will likely continue to distinguish this actor from more concerning campaigns like Sea Turtle](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/#:~:text=will%20likely%20continue%20to%20distinguish%20this%20actor%20from%20more%20concerning%20campaigns%20like%20Sea%20Turtle)". Juntas, las dos campañas demostraron lo mismo desde distintos ángulos: la cadena de suministro de DNS se había convertido en un escenario de conflicto entre Estados.

## Lo que esto nos enseña sobre el DNS como infraestructura de seguridad nacional

A DNSpionage le falta el drama del malware, pero le sobran las lecciones incómodas. Vale la pena retener algunas de ellas:

- **La cuenta del registrador es una de las joyas de la corona.** Todo lo que está debajo de un dominio (correo, web, VPN, inicio de sesión único, emisión de certificados) hereda la confianza de quienquiera que pueda editar su DNS. Tener solo una contraseña y ningún segundo factor en esa cuenta no es una brecha menor; es el castillo entero con la puerta de par en par. Las primeras instrucciones de CISA trataban sobre *credenciales*, no sobre cortafuegos, exactamente por esta razón.
- **Un certificado válido no es prueba de legitimidad.** El candado verde demuestra que el tráfico está cifrado hacia *quien sea que controle el dominio en este momento*. Si un atacante controla el DNS, la validación automatizada de dominio le emitirá felizmente un certificado real. La confianza en TLS se toma prestada de la confianza en el DNS, y el DNS es más frágil de lo que la mayoría asume.
- **Los ataques de DNS son invisibles por diseño.** Debido a que el proxy reenvía el tráfico real, los servicios de la víctima siguen funcionando. No hay interrupciones que investigar. La única señal externa puede ser la aparición de un certificado en un registro público de Transparencia de Certificados (CT), lo que explica por qué monitorear esos registros pasó de ser opcional a ser obligatorio de la noche a la mañana.
- **El control del dominio es un control de seguridad nacional.** Cuando la entidad que edita el DNS de un ministerio de exteriores es un Estado hostil, la distinción entre "operaciones de TI" y "contrainteligencia" se desmorona. La libreta de direcciones de Internet es terreno estratégico.

El hilo conductor es una sola pregunta que casi ninguna herramienta operativa responde en tiempo real: **¿quién controla realmente este dominio en este momento, y puedo demostrar que no ha cambiado en silencio?** DNSpionage funcionó porque esa pregunta era tan difícil de responder que los gobiernos de toda una región no pudieron hacerlo.

## La perspectiva de Namefi

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-dnspionage-campaign-03-namefi-angle.jpg)

En su raíz, DNSpionage es un problema de **procedencia**. Los atacantes nunca fueron propietarios de los dominios objetivo. Tomaron prestado su control robando las credenciales que permiten a los paneles del registrador y del host DNS realizar ediciones silenciosas e inverificables, y nada en el sistema alertó de que la *parte al mando* había cambiado.

[Namefi](https://namefi.io) se basa en la premisa de que la propiedad y el control de un dominio deben ser **verificables, portátiles y evidentes ante manipulaciones** en lugar de estar encerrados en un inicio de sesión de registrador opaco. La propiedad tokenizada convierte a "quién controla este nombre" en un hecho comprobable y auditable, y no en una configuración oculta tras una contraseña que podría estar ya en manos de otra persona. Esto no reemplaza la higiene de la cuenta del registrador o la autenticación multifactor (el consejo de CISA sigue siendo completamente correcto), sino que ataca la brecha más profunda que explotó DNSpionage: la dificultad de *demostrar*, de manera independiente y continua, que la parte que controla un dominio es la que realmente debería ser.

La lección de DNSpionage no es que el DNS sea frágil de alguna manera exótica. Es que el hecho más importante sobre un dominio (quién lo controla) estuvo, durante demasiado tiempo, a merced únicamente de una contraseña robada. Hacer que ese hecho sea verificable es, justamente, el objetivo principal.

## Fuentes y lecturas adicionales

- Cisco Talos — [DNSpionage Campaign Targets Middle East](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/) (27 de nov. de 2018)
- Cisco Talos — [DNSpionage brings out the Karkoff](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/) (23 de abr. de 2019)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (18 de feb. de 2019)
- The Register — [Baddies linked to Iran fingered for DNS hijacking to read Middle Eastern regimes' emails](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/) (10 de ene. de 2019)
- SecurityWeek — [Iran-Linked DNS Hijacking Attacks Target Organizations Worldwide](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/) (10 de ene. de 2019)
- BleepingComputer — [DHS Issues Emergency Directive to Prevent DNS Hijacking Attacks](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/) (Ene. de 2019)
- Network World — [Cisco Talos details exceptionally dangerous DNS hijacking attack](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html) (17 de abr. de 2019)
- Network World — [Cisco: DNSpionage attack adds new tools, morphs tactics](https://www.networkworld.com/article/967303/cisco-dnspionage-attack-adds-new-tools-morphs-tactics.html)
- CERT-IST — [DNSpionage and DNS data hijacking](https://www.cert-ist.com/public/en/SO_detail?format=html&code=dnspionage)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) (22 de ene. de 2019)