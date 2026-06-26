---
title: 'La Brecha Plurianual de GoDaddy: Cómo los Intrusos Vivieron Dentro del Registrador más Grande del Mundo Durante Tres Años'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Entre 2020 y 2022, un único grupo de actores maliciosos habitó dentro de la infraestructura de GoDaddy — robando código fuente, exponiendo a 1,2 millones de clientes de Managed WordPress y redirigiendo intermitentemente sitios web de clientes a destinos maliciosos. Un análisis profundo sobre el riesgo de concentración en registradores y lo que enseña acerca de los puntos únicos de falla.'
keywords: ['brecha godaddy', 'filtración de datos godaddy', 'brecha managed wordpress', 'seguridad de registradores', 'seguridad de dominios', 'brecha plurianual', 'malware cpanel', 'ataque de redirección de sitios web', 'exposición de clave privada ssl', 'brecha de contraseña sftp', 'ciberseguridad sec 10-k', 'riesgo de concentración de registradores', 'punto único de falla']
relatedArticles:
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-dnspionage-campaign/
  - /es/blog/the-lenovo-com-dns-hijack/
  - /es/blog/the-badgerdao-frontend-attack/
  - /es/blog/the-icann-spear-phishing-breach/
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
  - /es/glossary/web3/
  - /es/glossary/tld/
---

Un [registrador](/es/glossary/registrar/) de dominios es la empresa más aburrida de la que jamás dependerás completamente.

Le pagas una vez al año. Inicias sesión quizás dos veces. Y a cambio, guarda la única cosa que hace que tu negocio sea accesible: el derecho de decir "este nombre apunta aquí." Correo electrónico, sitio web, inicio de sesión, pagos — cada hilo digital que posees pasa a través de quien controla el DNS de tu dominio. La mayoría de las personas nunca vuelve a pensar en esa empresa después de hacer la compra.

Durante más de dos años, un sofisticado grupo de actores maliciosos pensó en GoDaddy constantemente. Vivían dentro de él.

GoDaddy es el registrador de dominios más grande del mundo, con decenas de millones de clientes y más de 80 millones de dominios bajo gestión. Y entre al menos finales de 2019 y el final de 2022, GoDaddy ahora cree que el mismo intruso persistente recorrió sus sistemas repetidamente — robando código fuente, exponiendo los datos de 1,2 millones de clientes de Managed WordPress y, en un momento dado, redirigiendo silenciosamente sitios web de clientes al azar hacia destinos maliciosos. La empresa no lo describió como una única intrusión. Lo describió, en una presentación ante la Comisión de Bolsa y Valores de EE. UU., como [una campaña plurianual llevada a cabo por un sofisticado grupo de actores maliciosos](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=Based%20on%20our%20investigation%2C%20we%20believe%20these%20incidents%20are%20part%20of%20a%20multi%2Dyear%20campaign%20by%20a%20sophisticated%20threat%20actor%20group).

Así es como se ve cuando la empresa aburrida que está en la base de tu pila tecnológica resulta ser un punto único de falla para millones de otras personas también.

## Por qué un registrador es un punto único de falla para millones

La concentración es el modelo de negocio completo de un registrador masivo. La economía solo funciona a escala enorme: un sistema de aprovisionamiento, un panel de control, un almacén de credenciales, un conjunto de servidores de alojamiento, que sirven a todos. Esa eficiencia es exactamente lo que hace conveniente a GoDaddy — y exactamente lo que lo hace peligroso cuando un atacante logra entrar.

Cuando una pequeña empresa individual es hackeada, un negocio tiene una semana difícil. Cuando la plataforma que alberga los dominios, sitios web y certificados de millones de empresas es hackeada, el radio de explosión ya no es una sola compañía. Son todas las personas que confiaron a esa empresa su nombre.

Esa es la asimetría en el corazón del riesgo de los registradores. El cliente experimenta GoDaddy como su propio panel privado. El atacante lo experimenta como una bóveda que contiene millones de llaves a la vez — y solo hay que forzar la cerradura una vez.

Vale la pena ser preciso sobre lo que significa "punto único de falla" aquí, porque opera en dos capas al mismo tiempo. La primera es la capa del registrador: la autoridad que decide hacia dónde apunta el DNS de tu dominio. Si esa capa se ve comprometida, un atacante puede redirigir todo tu dominio — correo electrónico y todo — a otro lugar. La segunda es la capa de alojamiento y certificados: los servidores, credenciales y claves SSL que sirven y autentican tu sitio web real. GoDaddy es una de las pocas empresas que ocupa ambas capas para el mismo cliente al mismo tiempo. Así que cuando el mismo intruso tocó sus sistemas de aprovisionamiento, sus servidores de alojamiento y su material de certificados a lo largo de la campaña, no estaba pivotando entre víctimas no relacionadas. Se movía dentro de una sola empresa que resultaba tener varios tipos diferentes de llaves para los mismos millones de puertas.

![Arte conceptual colorido y vibrante de una única bóveda central enorme apilada del suelo al techo con millones de llaves de dominio brillantes, una figura de intruso en la sombra cómodamente instalada en una silla plegable como si llevara años viviendo allí, iluminación dramática](../../assets/the-godaddy-multi-year-breach-01-breach.jpg)

## La cronología: 2019 → 2022

La parte inquietante de la historia de GoDaddy no es ningún incidente individual. Es que los incidentes, examinados en conjunto, se alinean en una ocupación de varios años. La propia GoDaddy conectó los puntos solo de manera retrospectiva.

**Finales de 2019 / Marzo de 2020 — el primer punto de apoyo.** Tras una brecha revelada en 2020, GoDaddy [alertó a 28.000 clientes de que un atacante usó las credenciales de sus cuentas de alojamiento web en octubre de 2019](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=GoDaddy%20alerted%2028%2C000%20customers%20that%20an%20attacker%20used%20their%20web%20hosting%20account%20credentials%20in%20October%202019) para conectarse a sus cuentas de alojamiento vía SSH. El atacante no necesitó un exploit de día cero; necesitó credenciales, y las obtuvo. Los informes de seguridad atribuyeron posteriormente esta oleada a la ingeniería social — atacantes que [suplantaban la identidad por teléfono](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/) para engañar al personal y a los clientes para que entregaran el acceso. Como GoDaddy resumió para InformationWeek, [en marzo de 2020, un actor malicioso comprometió las credenciales de inicio de sesión de 28.000 clientes](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=In%20March%202020%2C%20a%20threat%20actor%20compromised%20the%20login%20credentials%20of%2028%2C000%20customers).

**Septiembre–Noviembre de 2021 — el gran golpe.** El 22 de noviembre de 2021, GoDaddy reveló una brecha en su entorno de alojamiento Managed WordPress. Las cifras fueron devastadoras: [el incidente fue descubierto por GoDaddy](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20incident%20was%20discovered%20by%20GoDaddy%20last%20Wednesday%2C%20on%20November%2017%2C%20but%20the%20attackers%20had%20access%20to%20its%20network%20and%20the%20data%20contained%20on%20the%20breached%20systems%20since%20at%20least%20September%206%2C%202021) el 17 de noviembre de 2021, pero los atacantes habían mantenido el acceso desde al menos el 6 de septiembre de 2021. Eso representa aproximadamente dos meses y medio de presencia no detectada. Como informó TechCrunch, [la persona no autorizada utilizó una contraseña comprometida para acceder a los sistemas de GoDaddy alrededor del 6 de septiembre](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/#:~:text=the%20unauthorized%20person%20used%20a%20compromised%20password%20to%20get%20access%20to%20GoDaddy%27s%20systems%20around%20September%206).

**Diciembre de 2022 — el malware y las redirecciones.** Un año después, el patrón volvió a surgir. GoDaddy [recibió informes de clientes a principios de diciembre de 2022 de que sus sitios estaban siendo usados para redirigir a dominios aleatorios](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=customer%20reports%20in%20early%20December%202022%20that%20their%20sites%20were%20being%20used%20to%20redirect%20to%20random%20domains). La investigación que siguió fue la que produjo la revelación de febrero de 2023 — y la comprobación de que no se trataba de un nuevo atacante, sino de la misma campaña que había estado recurriendo desde 2020.

Leídos en secuencia, estos no son tres brechas. Son tres avistamientos de un residente a largo plazo.

Lo que hace que la cronología sea tan sorprendente son los intervalos entre avistamientos. Meses, luego un año. Cada incidente individual, en el momento en que fue revelado, parecía un evento discreto con un principio y un fin — un restablecimiento de contraseña aquí, una reemisión de certificado allá. Fue solo cuando los investigadores de GoDaddy rastrearon el malware de diciembre de 2022 a través de sus herramientas y métodos que los eventos dejaron de parecer coincidencias y comenzaron a parecer un patrón. La frase más escalofriante de toda la divulgación es la tranquila admisión de que esto había estado sucediendo durante años antes de que alguien lo conectara.

## Qué quedó expuesto — y los sitios web que se volvieron contra sus propietarios

La brecha de Managed WordPress de 2021 es el incidente con el daño más claro y cuantificado. El propio aviso de GoDaddy, presentado ante la SEC, lo expuso con claridad.

Hasta 1,2 millones de clientes activos e inactivos de Managed WordPress tuvieron expuestas su dirección de correo electrónico y número de cliente. Peor aún, [la contraseña original de administrador de WordPress que se configuró en el momento del aprovisionamiento quedó expuesta](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20original%20WordPress%20Admin%20password%20that%20was%20set%20at%20the%20time%20of%20provisioning%20was%20exposed) — la llave maestra de esas instalaciones de WordPress. Para los clientes activos, los nombres de usuario y contraseñas de sFTP y base de datos quedaron expuestos, las credenciales que permiten cargar archivos y leer la base de datos directamente. Y para el subconjunto más sensible, [la clave privada SSL quedó expuesta](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=For%20a%20subset%20of%20active%20customers%2C%20the%20SSL%20private%20key%20was%20exposed) — el secreto criptográfico que prueba que un sitio es realmente sí mismo.

Suma todo eso y tienes un kit de peor caso posible. La contraseña de administrador te da acceso al sitio. El acceso a sFTP y a la base de datos te permite alterarlo a nivel de archivos y datos. Y la [clave privada](/es/glossary/private-key/) SSL — como señaló Wordfence en su [análisis de la brecha](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/) — podría permitir a un atacante suplantar a un sitio o descifrar su tráfico. Un registrador que se supone que debe anclar la confianza había entregado en cambio a un intruso los materiales para falsificarla.

| Qué se filtró | Quién fue afectado | Qué desbloquea |
| --- | --- | --- |
| Correo electrónico + número de cliente | Hasta 1,2M clientes activos e inactivos | Phishing dirigido, mapeo de cuentas |
| Contraseña original de administrador de WordPress | Clientes afectados (si aún estaba en uso) | Control total de la instalación de WordPress |
| Credenciales de sFTP + base de datos | Clientes activos | Manipulación del sitio a nivel de archivos y base de datos |
| Clave privada SSL | Un subconjunto de clientes activos | Suplantación del sitio, descifrado del tráfico |

El alcance de la exposición explica por qué esto fue diferente en naturaleza a un hackeo normal de un sitio. Un hackeo normal compromete un sitio. Aquí, una sola brecha en un sistema de aprovisionamiento compartido expuso las llaves de más de un millón de ellos en un solo movimiento.

Luego está la parte que convierte una filtración de datos en algo visceral: los sitios web de clientes que comenzaron a redirigir a los visitantes a sitios maliciosos. En diciembre de 2022, [un tercero no autorizado obtuvo acceso e instaló malware en nuestros servidores de alojamiento cPanel](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=an%20unauthorized%20third%20party%20gained%20access%20to%20and%20installed%20malware%20on%20our%20cPanel%20hosting%20servers), dijo GoDaddy, y [el malware redirigía intermitentemente sitios web de clientes al azar a sitios maliciosos](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=The%20malware%20intermittently%20redirected%20random%20customer%20websites%20to%20malicious%20sites). "Intermitentemente" y "al azar" son las palabras crueles aquí. Una redirección que siempre se activa es fácil de detectar. Una redirección que se activa a veces, para algunos visitantes, en algunos sitios, es el tipo de cosa que el propietario de una pequeña empresa reporta y luego no puede reproducir — y que su proveedor de alojamiento puede desestimar como un error aislado. Es un camuflaje integrado en el ataque.

## Cómo ocurrió: llaves prestadas, no cerraduras rotas

La lección más incómoda de la historia de GoDaddy es lo poco glamorosa que fue la entrada.

No hay un exploit de día cero exótico en el centro de esto. La primera oleada funcionó con credenciales robadas. La brecha de 2021 funcionó con [una contraseña comprometida](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=1.2%20million%20Managed%20WordPress%20customers%20after%20attackers%20breached%20GoDaddy%27s%20WordPress%20hosting%20environment%20using%20a%20compromised%20password). Krebs on Security tituló su análisis de la campaña ["Cuando los hackeos de baja tecnología causan brechas de alto impacto"](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/) — precisamente porque el impacto fue tan desproporcionado respecto a la sofisticación de la entrada. No necesitas derrotar una bóveda si alguien te entrega la llave.

Una vez adentro, el atacante hizo lo paciente y profesional: se quedó. A lo largo de la campaña, GoDaddy dijo que los actores [instalaron malware en nuestros sistemas y obtuvieron fragmentos de código relacionados con algunos servicios dentro de GoDaddy](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=installed%20malware%20on%20our%20systems%20and%20obtained%20pieces%20of%20code%20related%20to%20some%20services%20within%20GoDaddy). El código fuente robado no es una pérdida única; es un mapa. Le dice a un atacante cómo funcionan realmente los sistemas en los que ya está — dónde están los puntos débiles, cómo fluye la autenticación, qué atacar a continuación. Combinado con malware persistente, es la diferencia entre un robo rápido y una ocupación a largo plazo. Como BleepingComputer resumió la propia conclusión de GoDaddy, [los actores maliciosos pudieron instalar malware en los sistemas de la empresa y robar código](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=Threat%20actors%20were%20able%20to%20install%20malware%20on%20the%20company%27s%20systems%20and%20steal%20code) repetidamente a lo largo de años.

La brecha en la detección es la otra mitad de la historia. Dos meses y medio en el incidente de 2021. Años a lo largo de toda la campaña. El atacante no era más rápido que las defensas de GoDaddy sino más silencioso que su monitoreo.

![Arte conceptual colorido y vibrante de una única llave maestra brillante siendo girada para abrir toda una pared imponente de cientos de puertas de buzones a la vez, tenues tentáculos de malware arrastrándose por la pared como enredaderas, iluminación de neón dramática, sin logotipos](../../assets/the-godaddy-multi-year-breach-02-persistent-access.jpg)

## Respuesta y consecuencias

La respuesta técnica inmediata de GoDaddy a la brecha de 2021 siguió el protocolo estándar: restablecer las contraseñas de sFTP y base de datos expuestas, y comenzar a reemitir e instalar nuevos certificados SSL para los clientes cuyas claves privadas habían sido filtradas. Para la revelación de febrero de 2023, la empresa dijo que contrató expertos forenses externos y a las fuerzas del orden, y caracterizó al actor como un grupo sofisticado y organizado que tenía como objetivo a los proveedores de alojamiento — no un oportunista solitario.

Pero las secuelas reputacionales y regulatorias sobrevivieron a la respuesta al incidente. La serie de brechas atrajo el escrutinio de la Comisión Federal de Comercio de EE. UU., que en 2025 [finalizó una orden contra GoDaddy por fallos en la seguridad de datos](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures), alegando que la empresa no había implementado medidas de seguridad razonables a pesar de comercializar sus servicios con garantías de seguridad, y exigiéndole que estableciera un programa integral de seguridad de la información. Una brecha que comenzó con una contraseña prestada terminó, años después, como una orden de consentimiento federal.

La propia cronología de la divulgación recibió críticas: el encuadre plurianual solo se hizo público a través de una presentación SEC 10-K en febrero de 2023, lo que significó que los clientes se enteraron de que los incidentes de 2020, 2021 y 2022 estaban conectados mucho tiempo después de que cada uno hubiera sido reportado individualmente.

Hay un problema más profundo de responsabilidad enterrado en esa secuencia. Cada revelación, por sí sola, invitaba a una pequeña respuesta — cambiar una contraseña, aceptar un nuevo certificado, seguir adelante. Pero un cliente al que se le habían contado tres historias separadas de "incidente aislado" no tenía forma de entender que podría estar lidiando con un único adversario persistente que había estado cerca de sus datos durante años. El encuadre de una brecha determina cuán en serio la toman las personas aguas abajo. Tres incendios pequeños se leen de manera muy diferente a uno que arde durante mucho tiempo.

## Lo que esto enseña sobre el riesgo de concentración en registradores

Elimina los detalles específicos y la campaña de GoDaddy es una lección sobre por qué la concentración en registradores es su propia categoría de riesgo.

1. **La plataforma es el objetivo.** Los atacantes no tienen que apuntarte a ti. Apuntan a la empresa que te alberga a ti y a un millón de otros. Tu postura de seguridad apenas importa si el sistema de aprovisionamiento de tu registrador es el objetivo vulnerable — heredas su radio de explosión lo quieras o no.

2. **Las credenciales son la puerta principal, no los exploits.** Una contraseña comprometida hizo la mayor parte del daño aquí. La autenticación multifactor, la higiene de credenciales y la detección agresiva de anomalías importan más que cualquier defensa sofisticada individual — porque el punto de entrada casi siempre es acceso prestado, no una cerradura rota.

3. **El tiempo de permanencia es la métrica real.** La exposición de datos es mala. Un atacante viviendo sin ser detectado en tu sistema de aprovisionamiento durante meses o años es catastróficamente peor, porque la persistencia se acumula. El daño es una función de cuánto tiempo se queda, no solo de que entró.

4. **Los secretos centralizados son fallos centralizados.** Almacenar contraseñas de administrador, credenciales de sFTP y claves privadas SSL en un lugar, recuperables, es conveniente hasta que se convierte en la pérdida de peor caso posible. Cuando el mismo almacén guarda las llaves de 1,2 millones de clientes, una brecha equivale a 1,2 millones de brechas.

5. **La redirección del sitio web es la pesadilla del cliente, no del registrador.** Cuando los servidores de GoDaddy redirigieron los sitios de los clientes a destinos maliciosos, fueron las marcas, clientes y SEO de los clientes los que pagaron el precio — aunque ellos no hicieron nada malo. El riesgo de concentración es en gran medida el riesgo de ser perjudicado por el error de otro.

Nada de esto significa "nunca uses un registrador grande." La escala conlleva inversión real en seguridad, y los pequeños proveedores también fallan. Significa entender que cuando entregas tu dominio a una plataforma, estás aceptando que el peor día de esa plataforma es una posible versión del tuyo propio.

## La perspectiva de Namefi

![Ilustración colorida de propiedad de dominio verificable y resistente a manipulaciones — una tarjeta de dominio asegurada por un escudo verde, un token verde de Namefi y continuidad DNS](../../assets/the-godaddy-multi-year-breach-03-namefi-angle.jpg)

El problema más profundo que expone la campaña de GoDaddy no es el malware. Es que la propiedad y el control de un dominio vivían completamente dentro de la base de datos privada de un proveedor — una base de datos que, durante años, un intruso podía leer, alterar y suplantar desde adentro, mientras los propietarios legítimos no tenían forma independiente de saberlo.

[Namefi](https://namefi.io) está construido alrededor de un principio diferente: los dominios deben comportarse como activos nativos de internet cuya propiedad sea verificable y resistente a manipulaciones, no como una fila en el sistema de cuentas de una sola empresa que solo puedes confirmar iniciando sesión y esperando. La propiedad tokenizada hace que la pregunta "¿quién controla realmente este dominio?" sea respondible desde fuera de cualquier proveedor — auditable, portátil y más difícil de reescribir silenciosamente — mientras permanece compatible con DNS para que el nombre siga resolviéndose.

Eso no hace que un registrador sea inhackeable. Nada lo hace. Pero cambia lo que una brecha puede hacer silenciosamente. Cuando la prueba de propiedad vive en una capa verificable e independiente en lugar de solo dentro de la plataforma que fue comprometida, "el intruso vivió en la base de datos durante dos años" deja de ser lo mismo que "el intruso controló quién posee qué." La historia de GoDaddy es lo que ocurre cuando el control y la prueba son la misma cosa frágil, guardada en un solo lugar. La lección es dejar de guardarlos allí.

## Fuentes y lecturas adicionales

- BleepingComputer — [GoDaddy: Hackers stole source code, installed malware in multi-year breach](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/)
- BleepingComputer — [GoDaddy data breach hits 1.2 million Managed WordPress customers](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/)
- Krebs on Security — [When Low-Tech Hacks Cause High-Impact Breaches](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)
- Sophos — [GoDaddy admits: Crooks hit us with malware, poisoned customer websites](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites)
- The Hacker News — [GoDaddy Discloses Multi-Year Security Breach Causing Malware Installations and Source Code Theft](https://thehackernews.com/2023/02/godaddy-discloses-multi-year-security.html)
- TechCrunch — [GoDaddy says data breach exposed over a million user accounts](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/)
- SecurityWeek — [GoDaddy Breach Exposes 1.2 Million Managed WordPress Customer Accounts](https://www.securityweek.com/godaddy-breach-exposes-12-million-managed-wordpress-customer-accounts/)
- InformationWeek — [GoDaddy Hit with Multiyear Breach](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-)
- BankInfoSecurity — [GoDaddy Confirms Breach Affects 1.2 Million Customers](https://www.bankinfosecurity.com/godaddy-confirms-breach-affects-12-million-customers-a-17974)
- Wordfence — [GoDaddy Breach — Plaintext Passwords — 1.2M Affected](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)
- U.S. Federal Trade Commission — [FTC Finalizes Order with GoDaddy over Data Security Failures](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures)
- GoDaddy (via SEC) — [Notice of Security Incident, November 22, 2021](https://www.sec.gov/Archives/edgar/data/1609711/000160971121000122/gddyblogpostnov222021.htm)
