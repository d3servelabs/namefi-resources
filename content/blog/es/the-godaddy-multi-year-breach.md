---
title: 'La brecha de varios años de GoDaddy: cómo unos intrusos acamparon en el registrador más grande del mundo durante tres años'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Entre 2020 y 2022, un único grupo de actores de amenazas vivió dentro de la infraestructura de GoDaddy: robando código fuente, exponiendo a 1.2 millones de clientes de Managed WordPress y redirigiendo intermitentemente los sitios web de los clientes a sitios maliciosos. Un análisis profundo sobre el riesgo de concentración de los registradores y lo que nos enseña sobre los puntos únicos de fallo.'
keywords: ['brecha de godaddy', 'violación de datos de godaddy', 'brecha de managed wordpress', 'seguridad de registradores', 'seguridad de dominios', 'brecha de varios años', 'malware en cpanel', 'ataque de redirección de sitios web', 'exposición de clave privada ssl', 'brecha de contraseña sftp', 'ciberseguridad sec 10-k', 'riesgo de concentración de registradores', 'punto único de fallo']
---

Un registrador de dominios es la empresa más aburrida de la que jamás dependerá por completo.

Usted le paga una vez al año. Inicia sesión tal vez dos veces. Y, a cambio, guarda lo único que hace que su negocio sea accesible: el derecho a decir "este nombre apunta aquí". El correo electrónico, el sitio web, el inicio de sesión, los pagos... cada hilo digital que posee pasa por quien controle el DNS de su dominio. La mayoría de las personas no vuelve a pensar en esa empresa después de realizar el pago.

Durante más de dos años, un sofisticado grupo de actores de amenazas pensó en GoDaddy constantemente. Estaban viviendo dentro de él.

GoDaddy es el registrador de dominios más grande del planeta, con decenas de millones de clientes y bastante más de 80 millones de dominios bajo gestión. Y entre al menos finales de 2019 y finales de 2022, GoDaddy cree ahora, el mismo intruso persistente se movió a través de sus sistemas repetidamente: robando código fuente, exponiendo los datos de 1.2 millones de clientes de Managed WordPress y, en un momento dado, recableando silenciosamente sitios web aleatorios de clientes para redirigir a los visitantes a destinos maliciosos. La empresa no lo describió como un simple allanamiento. Lo describió, en un documento presentado ante la Comisión de Bolsa y Valores de EE. UU. (SEC), como [una campaña de varios años por parte de un sofisticado grupo de actores de amenazas](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=Based%20on%20our%20investigation%2C%20we%20believe%20these%20incidents%20are%20part%20of%20a%20multi%2Dyear%20campaign%20by%20a%20sophisticated%20threat%20actor%20group).

Así es como se ve cuando la aburrida empresa en la base de su infraestructura tecnológica resulta ser un punto único de fallo para millones de otras personas también.

## Por qué un registrador es un punto único de fallo para millones

La concentración es todo el modelo de negocio de un registrador del mercado masivo. La economía solo funciona a una escala enorme: un sistema de aprovisionamiento, un panel de control, un almacén de credenciales, un conjunto de servidores de alojamiento, sirviendo a todos. Esa eficiencia es exactamente lo que hace que GoDaddy sea conveniente, y exactamente lo que lo hace peligroso cuando un atacante logra entrar.

Cuando una pequeña empresa individual es hackeada, esa empresa tiene una mala semana. Cuando la plataforma que guarda los dominios, sitios web y certificados de millones de empresas es hackeada, el radio de impacto ya no es una sola empresa. Es todo aquel que confió en esa empresa con su nombre.

Esa es la asimetría en el corazón del riesgo de los registradores. El cliente experimenta a GoDaddy como su propio panel privado. El atacante lo experimenta como una bóveda que guarda millones de llaves a la vez, y solo tiene que forzar la cerradura una vez.

Vale la pena ser precisos sobre lo que significa "punto único de fallo" aquí, porque opera en dos capas a la vez. La primera es la capa del registrador: la autoridad que decide hacia dónde apunta el DNS de su dominio. Si se ve comprometida, un atacante puede redirigir su dominio entero —correo electrónico y todo— a otro lugar. La segunda es la capa de alojamiento y certificados: los servidores, las credenciales y las claves SSL que sirven y autentican su sitio web real. GoDaddy es una de las raras empresas que se asienta en ambas capas para el mismo cliente al mismo tiempo. Así que, cuando el mismo intruso tocó sus sistemas de aprovisionamiento, sus servidores de alojamiento y su material de certificados a lo largo de la campaña, no estaban saltando entre víctimas no relacionadas. Se estaban moviendo dentro de una sola empresa que, casualmente, tenía varios tipos diferentes de llaves para los mismos millones de puertas.

![Vivid colorful concept art of a single enormous central vault stacked floor to ceiling with millions of glowing domain keys, a shadowy intruder figure camped comfortably inside on a folding chair as if living there for years, dramatic lighting](../../assets/the-godaddy-multi-year-breach-01-breach.jpg)

## La cronología: 2019 → 2022

La parte inquietante de la historia de GoDaddy no es un incidente aislado. Es que los incidentes, examinados en conjunto, se alinean en una ocupación de años. El propio GoDaddy ató cabos solo en retrospectiva.

**Finales de 2019 / Marzo de 2020 — el primer punto de apoyo.** Después de una brecha revelada en 2020, GoDaddy [alertó a 28,000 clientes que un atacante utilizó las credenciales de su cuenta de alojamiento web en octubre de 2019](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=GoDaddy%20alerted%2028%2C000%20customers%20that%20an%20attacker%20used%20their%20web%20hosting%20account%20credentials%20in%20October%202019) para conectarse a sus cuentas de alojamiento a través de SSH. El atacante no necesitó un exploit *zero-day*; necesitó credenciales, y las obtuvo. Informes de seguridad atribuyeron más tarde esta ola a la ingeniería social: atacantes [haciéndose pasar por teléfono](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/) para engañar al personal y a los clientes y hacer que entregaran el acceso. Como resumió GoDaddy para InformationWeek, [en marzo de 2020, un actor de amenazas comprometió las credenciales de inicio de sesión de 28,000 clientes](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=In%20March%202020%2C%20a%20threat%20actor%20compromised%20the%20login%20credentials%20of%2028%2C000%20customers).

**Septiembre–Noviembre de 2021 — el gran golpe.** El 22 de noviembre de 2021, GoDaddy reveló una brecha en su entorno de alojamiento de Managed WordPress. Las matemáticas fueron brutales: [el incidente fue descubierto por GoDaddy](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20incident%20was%20discovered%20by%20GoDaddy%20last%20Wednesday%2C%20on%20November%2017%2C%20but%20the%20attackers%20had%20access%20to%20its%20network%20and%20the%20data%20contained%20on%20the%20breached%20systems%20since%20at%20least%20September%206%2C%202021) el 17 de noviembre de 2021, pero los atacantes habían mantenido el acceso desde al menos el 6 de septiembre de 2021. Eso es aproximadamente dos meses y medio de presencia indetectada. Como informó TechCrunch, [la persona no autorizada utilizó una contraseña comprometida para obtener acceso a los sistemas de GoDaddy alrededor del 6 de septiembre](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/#:~:text=the%20unauthorized%20person%20used%20a%20compromised%20password%20to%20get%20access%20to%20GoDaddy%27s%20systems%20around%20September%206).

**Diciembre de 2022 — el malware y las redirecciones.** Un año después, el patrón surgió nuevamente. GoDaddy [recibió informes de clientes a principios de diciembre de 2022 de que sus sitios estaban siendo utilizados para redirigir a dominios aleatorios](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=customer%20reports%20in%20early%20December%202022%20that%20their%20sites%20were%20being%20used%20to%20redirect%20to%20random%20domains). La investigación que siguió fue lo que produjo la revelación de febrero de 2023, y la comprensión de que no se trataba de un atacante nuevo, sino de la misma campaña que había sido recurrente desde 2020.

Leídas en secuencia, estas no son tres brechas. Son tres avistamientos de un residente a largo plazo.

Lo que hace que la cronología sea tan llamativa son los espacios entre avistamientos. Meses, luego un año. Cada incidente individual, en el momento en que se reveló, parecía un evento aislado con un principio y un fin: un restablecimiento de contraseña aquí, una reemisión de certificado allá. Fue solo cuando los investigadores de GoDaddy rastrearon el malware de diciembre de 2022 a través de sus herramientas y métodos que los eventos dejaron de parecer coincidencias y empezaron a parecer un patrón. La frase más escalofriante de toda la divulgación es la silenciosa admisión de que esto había estado sucediendo durante años antes de que alguien lo conectara.

## Lo que quedó expuesto — y los sitios web que se volvieron contra sus dueños

La brecha de Managed WordPress de 2021 es el incidente con el daño más claro y cuantificado. El propio aviso de GoDaddy, presentado ante la SEC, lo expuso claramente.

Hasta 1.2 millones de clientes activos e inactivos de Managed WordPress sufrieron la exposición de su dirección de correo electrónico y número de cliente. Peor aún, [la contraseña original del administrador de WordPress que se estableció en el momento del aprovisionamiento fue expuesta](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20original%20WordPress%20Admin%20password%20that%20was%20set%20at%20the%20time%20of%20provisioning%20was%20exposed) — la llave maestra de esas instalaciones de WordPress. Para los clientes activos, se expusieron los nombres de usuario y las contraseñas de sFTP y de la base de datos, las credenciales que le permiten cargar archivos y leer la base de datos directamente. Y para el subconjunto más sensible, [la clave privada SSL fue expuesta](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=For%20a%20subset%20of%20active%20customers%2C%20the%20SSL%20private%20key%20was%20exposed) — el secreto criptográfico que prueba que un sitio es realmente él mismo.

Sume todo eso y tendrá un kit para el peor de los casos. La contraseña de administrador le da acceso al sitio. El acceso sFTP y a la base de datos le permiten alterarlo en la capa de archivos y datos. Y la clave privada SSL —como señaló Wordfence en su [análisis de la brecha](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)— podría permitir a un atacante hacerse pasar por un sitio o descifrar su tráfico. Un registrador que se supone que debe anclar la confianza, en su lugar había entregado a un intruso los materiales para falsificarla.

| Qué se filtró | Quién se vio afectado | Qué desbloquea |
| --- | --- | --- |
| Correo + n.º de cliente | Hasta 1.2M de clientes activos e inactivos | Phishing dirigido, mapeo de cuentas |
| Contraseña original de admin de WordPress | Clientes afectados (si seguía en uso) | Control total de la instalación de WordPress |
| Credenciales sFTP + base de datos | Clientes activos | Manipulación del sitio a nivel de archivo y base de datos |
| Clave privada SSL | Un subconjunto de clientes activos | Suplantación del sitio, descifrado de tráfico |

El alcance de la exposición le dice por qué esto fue de un tipo diferente al de un hackeo de sitio normal. Un hackeo normal compromete un sitio. Aquí, una sola brecha en un sistema de aprovisionamiento compartido expuso las llaves de más de un millón de ellos en un solo movimiento.

Luego está la parte que convierte una violación de datos en algo visceral: sitios web de clientes que comenzaron a redirigir a los visitantes a sitios maliciosos. En diciembre de 2022, [un tercero no autorizado obtuvo acceso e instaló malware en nuestros servidores de alojamiento cPanel](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=an%20unauthorized%20third%20party%20gained%20access%20to%20and%20installed%20malware%20on%20our%20cPanel%20hosting%20servers), dijo GoDaddy, y [el malware redirigió intermitentemente sitios web aleatorios de clientes a sitios maliciosos](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=The%20malware%20intermittently%20redirected%20random%20customer%20websites%20to%20malicious%20sites). "Intermitentemente" y "aleatorios" son las palabras crueles aquí. Una redirección que se activa cada vez es fácil de detectar. Una redirección que se activa a veces, para algunos visitantes, en algunos sitios, es el tipo de cosas que el propietario de una pequeña empresa reporta y luego no puede reproducir, y que su proveedor de alojamiento puede descartar como una casualidad. Es el camuflaje integrado en el ataque.

## Cómo ocurrió: llaves prestadas, no cerraduras rotas

La lección más incómoda de la historia de GoDaddy es lo poco glamorosa que fue la entrada.

No hay un *zero-day* exótico en el centro de esto. La primera ola se ejecutó con credenciales robadas. La brecha de 2021 se ejecutó con [una contraseña comprometida](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=1.2%20million%20Managed%20WordPress%20customers%20after%20attackers%20breached%20GoDaddy%27s%20WordPress%20hosting%20environment%20using%20a%20compromised%20password). Krebs on Security tituló su análisis de la campaña ["Cuando los hackeos de baja tecnología causan brechas de alto impacto"](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/) — exactamente porque el impacto fue muy desproporcionado a la sofisticación de la entrada. No es necesario vencer a una bóveda si alguien le entrega la llave.

Una vez dentro, el atacante hizo lo paciente y profesional: se quedó. A lo largo de la campaña, GoDaddy dijo que los actores [instalaron malware en nuestros sistemas y obtuvieron piezas de código relacionadas con algunos servicios dentro de GoDaddy](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=installed%20malware%20on%20our%20systems%20and%20obtained%20pieces%20of%20code%20related%20to%20some%20services%20within%20GoDaddy). El código fuente robado no es una pérdida de una sola vez; es un mapa. Le dice a un atacante cómo funcionan realmente los sistemas en los que ya está adentro: dónde están los puntos débiles, cómo fluye la autenticación, qué atacar a continuación. Combinado con un malware persistente, es la diferencia entre un ataque rápido de robar y huir (smash-and-grab) y una ocupación a largo plazo. Como resumió BleepingComputer sobre la propia conclusión de GoDaddy, [los actores de amenazas pudieron instalar malware en los sistemas de la empresa y robar código](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=Threat%20actors%20were%20able%20to%20install%20malware%20on%20the%20company%27s%20systems%20and%20steal%20code) repetidamente a lo largo de años.

La brecha de detección es la otra mitad de la historia. Dos meses y medio en el incidente de 2021. Años en la campaña en su conjunto. El atacante no fue más rápido que las defensas de GoDaddy, sino más silencioso que su monitoreo.

![Vivid colorful concept art of a single glowing skeleton key being turned to open an entire towering wall of hundreds of mailbox doors at once, faint malware tendrils creeping along the wall like vines, dramatic neon lighting, no logos](../../assets/the-godaddy-multi-year-breach-02-persistent-access.jpg)

## Respuesta y secuelas

La respuesta técnica inmediata de GoDaddy a la brecha de 2021 fue el manual estándar: restablecer las contraseñas expuestas de sFTP y bases de datos, y comenzar a reemitir e instalar nuevos certificados SSL para los clientes cuyas claves privadas se habían filtrado. Para la divulgación de febrero de 2023, la empresa dijo que contrató a expertos forenses externos y a las fuerzas del orden, y caracterizó al actor como un grupo organizado y sofisticado que atacaba a proveedores de alojamiento, no un oportunista solitario.

Pero las secuelas regulatorias y de reputación duraron más que la respuesta al incidente. La serie de brechas atrajo el escrutinio de la Comisión Federal de Comercio (FTC) de EE. UU., que en 2025 [finalizó una orden con GoDaddy sobre fallos de seguridad de datos](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures), alegando que la empresa no había implementado una seguridad razonable a pesar de comercializar sus servicios con garantías de seguridad, y exigiéndole que estableciera un programa integral de seguridad de la información. Una brecha que comenzó con una contraseña prestada terminó, años después, como una orden de consentimiento federal.

El cronograma de divulgación en sí mismo atrajo críticas: el marco de varios años solo se hizo público a través de un documento 10-K de la SEC en febrero de 2023, lo que significó que los clientes se enteraron de que los incidentes de 2020, 2021 y 2022 estaban conectados mucho después de que cada uno hubiera sido reportado individualmente.

Hay un problema de responsabilidad más profundo enterrado en esa secuencia. Cada divulgación, por sí sola, invitaba a una pequeña respuesta: cambiar una contraseña, aceptar un nuevo certificado, seguir adelante. Pero un cliente al que se le habían contado tres historias separadas de "incidentes aislados" no tenía forma de entender que podría estar lidiando con un adversario persistente que había estado cerca de sus datos durante años. La forma en que se enmarca una brecha determina la seriedad con la que la toman las personas afectadas. Tres pequeños incendios se perciben de manera muy diferente a un solo incendio de larga duración.

## Lo que esto enseña sobre el riesgo de concentración de los registradores

Si dejamos de lado los detalles, la campaña de GoDaddy es una clase magistral de por qué la concentración de registradores es su propia categoría de riesgo.

1. **La plataforma es el premio.** Los atacantes no tienen que atacarlo a usted. Atacan a la empresa que los aloja a usted y a un millón más. Su postura de seguridad apenas importa si el sistema de aprovisionamiento de su registrador es el blanco fácil: usted hereda su radio de impacto le guste o no.

2. **Las credenciales son la puerta de entrada, no los exploits.** Una contraseña comprometida hizo la mayor parte del daño aquí. La autenticación multifactor, la higiene de las credenciales y la detección agresiva de anomalías importan más que cualquier defensa sofisticada en particular, porque el punto de entrada es casi siempre un acceso prestado, no una cerradura rota.

3. **El tiempo de permanencia es la verdadera métrica.** La exposición de datos es mala. Que un atacante viva indetectado en su sistema de aprovisionamiento durante meses o años es catastróficamente peor, porque la persistencia se acumula. El daño es una función de cuánto tiempo se quedan, no solo de que hayan logrado entrar.

4. **Los secretos centralizados son un fallo centralizado.** Almacenar contraseñas de administrador, credenciales sFTP y claves privadas SSL en un solo lugar y de forma recuperable es conveniente hasta el momento en que se convierte en la peor pérdida posible. Cuando el mismo almacén guarda las llaves de 1.2 millones de clientes, una brecha es 1.2 millones de brechas.

5. **La redirección del sitio web es la pesadilla del cliente, no del registrador.** Cuando los servidores de GoDaddy redirigieron los sitios de los clientes a destinos maliciosos, fueron las marcas de los clientes, sus clientes y su SEO los que pagaron, a pesar de no haber hecho nada malo. El riesgo de concentración es en gran medida el riesgo de ser perjudicado por el error de otra persona.

Nada de esto significa "nunca use un registrador grande". La escala conlleva una inversión real en seguridad y los proveedores pequeños también fallan. Significa entender que cuando usted entrega su dominio a una plataforma, está aceptando el peor día de esa plataforma como una posible versión del suyo propio.

## El enfoque de Namefi

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-godaddy-multi-year-breach-03-namefi-angle.jpg)

El problema más profundo que expone la campaña de GoDaddy no es el malware. Es que la propiedad y el control de un dominio vivían completamente dentro de la base de datos privada de un solo proveedor, una base de datos que, durante años, un intruso pudo leer, alterar y suplantar desde el interior, mientras que los propietarios legítimos no tenían una forma independiente de saberlo.

[Namefi](https://namefi.io) está construido en torno a un estándar predeterminado diferente: los dominios deben comportarse como activos nativos de Internet cuya propiedad sea verificable y resistente a manipulaciones, no como una fila en el sistema de cuentas de una sola empresa que usted solo puede confirmar iniciando sesión y cruzando los dedos. La propiedad tokenizada hace que la pregunta "¿quién controla realmente este dominio?" se pueda responder desde fuera de cualquier proveedor en particular —siendo auditable, portátil y más difícil de reescribir en silencio—, mientras se mantiene compatible con DNS para que el nombre siga resolviéndose.

Eso no hace que un registrador sea inhackeable. Nada lo hace. Pero cambia lo que una brecha puede hacer silenciosamente. Cuando la prueba de propiedad vive en una capa independiente y verificable en lugar de únicamente dentro de la plataforma que fue comprometida, "el intruso vivió en la base de datos durante dos años" deja de ser lo mismo que "el intruso controlaba quién era dueño de qué". La historia de GoDaddy es lo que sucede cuando el control y la prueba son la misma cosa frágil, guardada en un solo lugar. La lección es dejar de mantenerlos allí.

## Fuentes y lecturas complementarias

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