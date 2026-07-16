---
title: 'Sea Turtle: La campaña patrocinada por un Estado que secuestró el DNS para espiar a gobiernos'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
description: 'Cómo "Sea Turtle", una campaña patrocinada por un Estado revelada por Cisco Talos en 2019, secuestró el DNS al comprometer registradores, registros y proveedores de DNS — redirigiendo a gobiernos, ministerios y empresas energéticas hacia servidores de los atacantes, falsificando certificados válidos e incluso vulnerando un registro nacional de TLD.'
keywords: ['secuestro dns sea turtle', 'cisco talos sea turtle', 'ataque de secuestro dns', 'ataque dns patrocinado por estado', 'compromiso de registro', 'compromiso de registrador', 'campaña de espionaje dns', 'certificado mitm lets encrypt', 'compromiso netnod', 'ics-forth grecia ccTLD', 'directiva de emergencia cisa 19-01', 'seguridad dns', 'seguridad de propiedad de dominio', 'ciberataque de estado nación']
relatedArticles:
  - /es/blog/the-dnspionage-campaign/
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-godaddy-multi-year-breach/
  - /es/blog/the-myetherwallet-bgp-dns-attack/
  - /es/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/name-change-game-change/
relatedGlossary:
  - /es/glossary/dns/
  - /es/glossary/registrar/
  - /es/glossary/tld/
  - /es/glossary/icann/
  - /es/glossary/registry/
---

La mayoría de los ciberataques intentan entrar *en* un objetivo. La campaña Sea Turtle hizo algo más silencioso y mucho más peligroso: se infiltró en el **mapa** que le indica a todo internet dónde vive el objetivo.

Cuando escribes la dirección web de un ministerio gubernamental o envías un correo a sus funcionarios, tu computadora primero consulta el [Sistema de Nombres de Dominio](/es/glossary/dns/) —DNS— para traducir ese nombre legible por humanos en la dirección numérica del servidor correcto. Esa consulta es tan fundamental que casi nada en internet la verifica. Simplemente confiamos en que el nombre resuelve al lugar al que se supone que debe llegar. Los operadores de Sea Turtle entendieron esa confianza a la perfección, y pasaron más de dos años abusando de ella para espiar a gobiernos de todo el Medio Oriente y el norte de África.

Revelada por Cisco Talos en abril de 2019, Sea Turtle es uno de los estudios de caso más claros que tenemos sobre cómo el propio DNS fue usado como instrumento de espionaje de Estado. Los atacantes no intentaron pescar a empleados individuales con phishing y esperar. Fueron tras los registradores, registros y proveedores de DNS que se encuentran *por encima* de sus objetivos —las instituciones que controlan cómo se resuelven los nombres— y desde esa posición privilegiada redirigieron el tráfico de organizaciones enteras, cosecharon credenciales y falsificaron los certificados criptográficos que se suponía hacían imposible la suplantación.

## El DNS como objetivo del espionaje de Estado

El DNS a veces se llama la guía telefónica de internet, pero eso no le hace justicia. Se parece más al sistema de enrutamiento postal: cada correo electrónico, cada inicio de sesión, cada llamada a una API comienza resolviendo un nombre. Si controlas la resolución, controlas el destino —y puedes sentarte invisiblemente en medio de conversaciones que ambas partes creen privadas y directas.

Eso convierte al DNS en un objetivo de espionaje casi perfecto. Comprometer un proveedor de DNS puede exponer el tráfico de todas las organizaciones que dependen de él. Y a diferencia del malware en un endpoint, la manipulación del DNS deja intactas las propias máquinas de la víctima: no hay nada que escanear, nada que poner en cuarentena. Los registros simplemente apuntan a un nuevo lugar.

Talos fue directo sobre el mecanismo. Como dice su informe, [el secuestro de DNS ocurre cuando el actor puede modificar ilegítimamente los registros de nombres DNS para apuntar a los usuarios hacia servidores controlados por el actor](https://blog.talosintelligence.com/seaturtle/#:~:text=DNS%20hijacking%20occurs%20when%20the%20actor%20can%20illicitly%20modify%20DNS%20name%20records%20to%20point%20users%20to%20actor%2Dcontrolled%20servers). Simple de describir; devastador en la práctica.

## La campaña Sea Turtle (2017–2019)

![Arte conceptual colorido y vívido de un actor estatal sombrío perfilado como una tortuga que redirige silenciosamente flechas luminosas a través de un mapa estilizado de una región, con líneas de red de neón que se doblan hacia servidores ocultos](../../assets/the-sea-turtle-dns-espionage-01-campaign.jpg)

Sea Turtle no fue un golpe de mano. Talos evaluó que [la operación en curso probablemente comenzó tan pronto como enero de 2017 y continuó hasta el primer trimestre de 2019](https://blog.talosintelligence.com/seaturtle/#:~:text=The%20ongoing%20operation%20likely%20began%20as%20early%20as%20January%202017%20and%20has%20continued%20through%20the%20first%20quarter%20of%202019) — más de dos años de operaciones pacientes y persistentes.

Durante ese período, según el recuento de Talos, [al menos 40 organizaciones diferentes en 13 países distintos fueron comprometidas durante esta campaña](https://blog.talosintelligence.com/seaturtle/#:~:text=at%20least%2040%20different%20organizations%20across%2013%20different%20countries%20were%20compromised%20during%20this%20campaign). TechCrunch resumió el alcance: el grupo había [apuntado a 40 agencias gubernamentales y de inteligencia, empresas de telecomunicaciones y gigantes de internet en 13 países durante más de dos años](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/), con víctimas encontradas en países como [Armenia, así como Egipto, Turquía, Suecia, Jordania y los Emiratos Árabes Unidos](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/).

Talos se negó a atribuir públicamente la campaña a un gobierno específico, pero tenía confianza sobre la capacidad del operador. Como Craig Williams de Cisco Talos dijo a TechCrunch, [este es un nuevo grupo que opera de una manera relativamente única que no habíamos visto antes, usando nuevas tácticas, técnicas y procedimientos](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/), y el equipo evaluó que las [motivaciones principales del grupo son llevar a cabo espionaje](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/).

## Quiénes fueron los objetivos y qué estaba en juego

La lista de víctimas parece una lista de deseos de recolección de inteligencia. Talos identificó los objetivos principales como [organizaciones de seguridad nacional, ministerios de relaciones exteriores y organizaciones energéticas prominentes](https://blog.talosintelligence.com/seaturtle/#:~:text=national%20security%20organizations%2C%20ministries%20of%20foreign%20affairs%2C%20and%20prominent%20energy%20organizations) — exactamente las instituciones cuyas comunicaciones internas un Estado hostil más querría leer.

Un segundo nivel de víctimas era, en cierto sentido, aún más revelador. Talos encontró que los atacantes también apuntaron a [numerosos registradores de DNS, empresas de telecomunicaciones y proveedores de servicios de internet](https://blog.talosintelligence.com/seaturtle/#:~:text=numerous%20DNS%20registrars%2C%20telecommunication%20companies%2C%20and%20internet%20service%20providers). Estos no eran los premios finales; eran los *medios*. Al controlar los proveedores de infraestructura, los atacantes obtenían el poder de manipular el DNS para los objetivos reales más adelante en la cadena.

El resumen de BleepingComputer capturó el botín con claridad: los objetivos principales eran [ministerios de relaciones exteriores, organizaciones militares, agencias de inteligencia, empresas energéticas](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/). Cuando puedes interceptar silenciosamente el correo electrónico y el tráfico de inicio de sesión de un ministerio de relaciones exteriores, no necesitas romper el cifrado — simplemente recopilas las credenciales y lees el correo mientras fluye.

## Cómo sucedió: secuestrando la cadena de confianza

![Arte conceptual colorido y vívido de una figura de intermediario interceptando un flujo de sobres gubernamentales luminosos y sellando cada uno con un sello verde falsificado antes de pasarlos, dos candados enfrentados a través de una tubería fracturada](../../assets/the-sea-turtle-dns-espionage-02-registry-compromise.jpg)

Esto es lo que hizo a Sea Turtle inusualmente sofisticado: los atacantes rara vez apuntaban directamente a sus víctimas. En cambio, escalaron la cadena de confianza.

El patrón, reconstruido por Talos y corroborado por reportes independientes, funcionaba más o menos así. Primero, obtener un punto de apoyo en un proveedor de DNS, registrador o [registro](/es/glossary/registry/) — típicamente mediante spear-phishing o explotando una vulnerabilidad conocida. Con ese acceso, [modificar los registros DNS para apuntar a los usuarios legítimos del objetivo hacia servidores controlados por el actor](https://blog.talosintelligence.com/seaturtle/#:~:text=Modified%20DNS%20records%20to%20point%20legitimate%20users%20of%20the%20target%20to%20actor%2Dcontrolled%20servers). Esos servidores estaban configurados como una capa de intermediario: según BleepingComputer, [los operadores de Sea Turtle configuraron un marco de intermediario (MitM) que suplantaba los servicios legítimos utilizados por la víctima con el propósito de robar credenciales de inicio de sesión](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/). Las víctimas iniciaban sesión en lo que parecía su portal de correo o VPN habitual, y los atacantes [capturaban las credenciales legítimas de los usuarios cuando estos interactuaban con estos servidores controlados por el actor](https://blog.talosintelligence.com/seaturtle/#:~:text=Captured%20legitimate%20user%20credentials%20when%20users%20interacted%20with%20these%20actor%2Dcontrolled%20servers), para luego transmitirlas silenciosamente al servicio real de modo que nada pareciera fuera de lo normal.

La parte más ingeniosa —y más alarmante— fue cómo derrotaron el candado. Redirigir el tráfico es una cosa; hacerlo sin activar una advertencia de certificado en el navegador es otra. Sea Turtle resolvió esto obteniendo certificados genuinos y válidos para los dominios que estaban suplantando. Talos encontró que los atacantes [obtuvieron un certificado X.509 firmado por una autoridad de certificación de otro proveedor para el mismo dominio](https://blog.talosintelligence.com/seaturtle/#:~:text=obtained%20a%20certificate%20authority%2Dsigned%20X.509%20certificate), señalando que [estos actores utilizan certificados de Let's Encrypt, Comodo, Sectigo y autofirmados en sus servidores MitM](https://blog.talosintelligence.com/seaturtle/#:~:text=use%20Let%27s%20Encrypts%2C%20Comodo%2C%20Sectigo%2C%20and%20self%2Dsigned%20certificates). Dado que controlaban los registros DNS, podían superar las comprobaciones automáticas de validación de dominio en las que se basan las autoridades de certificación gratuitas —y salir con un candado verde legítimo para un dominio que no les pertenecía.

Brian Krebs, documentando la primera oleada estrechamente relacionada, describió el mismo manual: los atacantes [parecen haber cambiado los registros DNS para estos dominios de modo que los dominios apuntaran a servidores en Europa que controlaban](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/), y luego [pudieron obtener certificados SSL para esos dominios de los proveedores SSL Comodo y/o Let's Encrypt](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/). Una de las víctimas citadas fue [mail.gov.ae, que gestiona el correo electrónico de las oficinas gubernamentales de los Emiratos Árabes Unidos](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/).

### Los compromisos de registros

El punto más alto de la campaña fue el compromiso de organizaciones que no solo *usan* el DNS sino que lo *administran* para países enteros.

El primer caso confirmado públicamente involucró a Netnod de Suecia. Como informó Krebs, los atacantes [obtuvieron acceso a cuentas en el registrador de nombres de dominio de Netnod](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/), y el propio Netnod declaró que [se enteró de su papel en el ataque el 2 de enero](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/). Crucialmente, Netnod no era el destino — era una puerta de entrada. BleepingComputer señaló que Netnod dijo que [no eran el objetivo de los ataques sino una ruta para que el atacante "capturara detalles de inicio de sesión para servicios de internet"](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/).

Talos describió la importancia más amplia en términos contundentes: los operadores fueron [responsables del primer caso confirmado públicamente contra una organización que gestiona una zona de servidor raíz](https://blog.talosintelligence.com/seaturtle/#:~:text=responsible%20for%20the%20first%20publicly%20confirmed%20case%20against%20an%20organizations%20that%20manages%20a%20root%20server%20zone). Cuando las personas que administran una parte del directorio de direcciones central de internet pueden ser suplantadas silenciosamente, la suposición de que el DNS es confiable por defecto deja de sostenerse.

## Respuesta y consecuencias: no se detuvieron

El secuestro de DNS a esta escala provocó una respuesta oficial. En enero de 2019, la Agencia de Ciberseguridad e Infraestructura de EE. UU. emitió la [Directiva de Emergencia 19-01, "Mitigar la manipulación de infraestructura DNS"](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) — la primera directiva de emergencia que CISA había emitido jamás — ordenando a las agencias federales que auditaran sus registros DNS, cambiaran las credenciales de las cuentas de gestión de DNS y habilitaran la autenticación multifactor en dichas cuentas. Fue un reconocimiento tácito de que la administración de DNS se había convertido en una línea frontal de la seguridad nacional.

Lo más llamativo de Sea Turtle, sin embargo, es lo que ocurrió *después* de que fue expuesta. La mayoría de las campañas se silencian una vez que un proveedor como Talos publica sus métodos. Sea Turtle hizo lo contrario.

En un seguimiento de julio de 2019, Talos informó que el grupo había encontrado nuevas víctimas, incluido [un registro de dominio de nivel superior con código de país (ccTLD), que gestiona los registros DNS para cada dominio que usa ese código de país en particular](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=a%20country%20code%20top%2Dlevel%20domain%20%28ccTLD%29%20registry). En concreto, [El Instituto de Ciencias de la Computación de la Fundación para la Investigación y la Tecnología - Hellas (ICS-Forth), el ccTLD de Grecia](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=The%20Institute%20of%20Computer%20Science%20of%20the%20Foundation%20for%20Research%20and%20Technology%20%2D%20Hellas%20%28ICS%2DForth%29%2C%20the%20ccTLD%20for%20Greece) — el organismo que opera el espacio de nombres `.gr` — fue comprometido. SecurityWeek señaló que incluso después de que ICS-Forth reconoció públicamente la brecha, [la telemetría de Cisco confirmó que el compromiso persistió durante al menos cinco días más](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/).

La evaluación de Talos sobre el grupo fue inusualmente directa: [este grupo parece ser inusualmente descarado, y es poco probable que sea disuadido en el futuro](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=this%20group%20appears%20to%20be%20unusually%20brazen%2C%20and%20will%20be%20unlikely%20to%20be%20deterred%20going%20forward). Tenían razón. Sea Turtle no fue algo aislado; fue una demostración de que el espionaje en la capa DNS funciona, y que quienes lo practican están dispuestos a continuar abiertamente.

## Lo que esto enseña sobre el DNS como infraestructura crítica

Dejando a un lado la geopolítica, Sea Turtle deja una serie de lecciones incómodas sobre cómo funciona realmente la capa de nomenclatura de internet.

1. **El DNS es una cadena de confianza, y tú no controlas toda la cadena.** Tu seguridad puede ser excelente. Pero la resolución de tu dominio pasa por un registrador y un registro, y si cualquiera de ellos es comprometido, tus registros pueden modificarse sin tocar en ningún momento tu red. Sea Turtle demostró que los atacantes apuntarán deliberadamente al eslabón de la cadena sobre el que tienes menos visibilidad.

2. **Un certificado válido no es prueba de un destino legítimo.** El candado verde certifica que la conexión está cifrada hacia *quien controle el dominio en este momento* — y si un atacante ha secuestrado el DNS, ese alguien son ellos. Los certificados validados por dominio son tan confiables como el DNS contra el que se validan.

3. **La manipulación del DNS es casi invisible para la víctima.** No se ejecuta ningún malware en las máquinas de la víctima. Los escáneres de endpoints no ven nada. La única señal es que los registros apuntan a un lugar donde no deberían — que es exactamente por qué monitorear los registros DNS en busca de cambios inesperados, y bloquearlos, importa tanto.

4. **La seguridad de las cuentas de registrador y registro es infraestructura de seguridad nacional.** La primera directiva de emergencia de CISA fue, en esencia, sobre las credenciales de las cuentas de gestión de DNS. La autenticación multifactor, los bloqueos de registro y el acceso estrictamente controlado a las cuentas que pueden cambiar los registros DNS no son simples medidas de higiene — son la diferencia entre ser dueño de un dominio y simplemente parecer serlo.

## El ángulo Namefi

![Ilustración colorida de propiedad de dominio verificable y resistente a manipulaciones — una tarjeta de dominio asegurada por un escudo verde, un token Namefi verde y continuidad DNS](../../assets/the-sea-turtle-dns-espionage-03-namefi-angle.jpg)

Sea Turtle es, en su esencia, una historia sobre *quién tiene permitido cambiar los registros de un dominio* — y lo difícil que es para el resto del mundo saber cuándo esa autoridad ha sido robada silenciosamente.

El modelo tradicional concentra esa autoridad en cuentas de registrador y registro protegidas, con demasiada frecuencia, por poco más que una contraseña y una dirección de correo electrónico. Cuando esas cuentas caen, el control del dominio cae con ellas, en silencio. No existe un registro independientemente verificable de quién posee legítimamente un nombre, ni una pista a prueba de manipulaciones cuando el control cambia de manos.

[Namefi](https://namefi.io) aborda la propiedad de dominios como algo que debe ser **verificable y resistente a manipulaciones por diseño**, manteniéndose compatible con el DNS. Tokenizar la propiedad crea un registro auditable y criptográficamente anclado de quién controla un dominio — haciendo que las transferencias no autorizadas y las tomas de control silenciosas sean mucho más difíciles de ejecutar sin dejar una traza evidente. Por sí solo, esto no detiene que un registro sea víctima de phishing. Pero la lección más amplia que Sea Turtle deja clara es aquella sobre la que Namefi está construido: los dominios son infraestructura crítica, y la pregunta de *quién realmente posee este nombre* merece una respuesta más sólida que "quien pueda iniciar sesión en el panel de control."

La campaña redirigió a gobiernos explotando la brecha entre *poseer* un dominio y *demostrar* que lo posees. Cerrar esa brecha — hacer que la propiedad sea verificable, las transferencias auditables y la continuidad del control demostrable — es exactamente el tipo de resiliencia que la capa de nomenclatura todavía necesita.

## Fuentes y lecturas adicionales

- Cisco Talos — [DNS Hijacking Abuses Trust In Core Internet Service](https://blog.talosintelligence.com/seaturtle/)
- Cisco Talos — [Sea Turtle keeps on swimming, finds new victims, DNS hijacking techniques](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/)
- TechCrunch — [A new state-backed hacker group is hijacking government domains at a phenomenal pace](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)
- BleepingComputer — ['Sea Turtle' Campaign Focuses on DNS Hijacking to Compromise Targets](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)
- SecurityWeek — [Sea Turtle's DNS Hijacking Continues Despite Exposure](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)
- BankInfoSecurity — ['Sea Turtle' DNS Hijacking Group Conducts Espionage: Report](https://www.bankinfosecurity.com/sea-turtle-dns-hijacking-group-conducts-espionage-report-a-12390)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)
- SDxCentral — [Cisco Talos Says a Nation State Is Behind Sea Turtle DNS Hijacking Attacks](https://www.sdxcentral.com/articles/news/cisco-talos-says-a-nation-state-is-behind-sea-turtle-dns-hijacking-attacks/2019/04/)
- SecurityWeek — [State-Sponsored Hackers Use Sophisticated DNS Hijacking in Ongoing Attacks](https://www.securityweek.com/state-sponsored-hackers-use-sophisticated-dns-hijacking-ongoing-attacks/)
