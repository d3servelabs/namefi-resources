---
title: 'Domain Mayday EP14: Cuando una firma de seguridad sufrió un secuestro de DNS — El incidente Fox-IT'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'En septiembre de 2017, atacantes iniciaron sesión en el registrador de dominios externo de la firma de seguridad holandesa Fox-IT, modificaron su DNS, obtuvieron fraudulentamente un certificado TLS y ejecutaron un ataque de intermediario de 10 horas sobre el tráfico de clientes — hasta que Fox-IT lo detectó y publicó uno de los análisis post-mortem más transparentes de la industria.'
keywords: ['secuestro dns fox-it', 'fox-it ataque intermediario', 'incidente fox-it 2017', 'secuestro dns', 'compromiso cuenta registrador', 'certificado ssl fraudulento', 'ataque man-in-the-middle', 'seguridad registrador de dominios', 'autenticación dos factores dns', 'dnssec', 'registry lock', 'seguridad de dominios', 'ncc group fox-it']
---

Lo peculiar de un ataque de intermediario es que, mientras ocurre, todo parece normal.

El sitio carga. La barra de direcciones muestra el dominio correcto. El candado está cerrado. El certificado es válido. Los archivos se suben, los inicios de sesión tienen éxito, los correos llegan. No hay error, no hay advertencia, no hay imagen rota — solo un silencioso tercero sentado en medio de la conversación, leyendo todo lo que pasa por sus manos y reenviándolo para que ninguno de los extremos note el retraso.

Ahora imagine que eso le sucede a las personas cuyo trabajo es detectar exactamente eso.

En septiembre de 2017, la firma holandesa de ciberseguridad Fox-IT — una empresa que investiga brechas, construye sensores de detección de interceptaciones y asesora a gobiernos sobre cómo se mueven los atacantes — descubrió que un atacante había secuestrado el DNS de su propio dominio, obtenido un certificado TLS a su nombre y pasado casi un día leyendo el tráfico hacia y desde su portal de clientes. La cerradura del cerrajero había sido forzada. Y entonces Fox-IT hizo lo que casi ninguna empresa comprometida hace: [publicó un relato detallado de exactamente cómo sucedió](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes).

## Incluso una firma de seguridad depende de su registrador

Esta es la incómoda verdad que este caso hace concreta: sin importar qué tan buena sea tu seguridad interna, una gran parte de tu superficie de ataque vive en una empresa que tú no administras.

Tu dominio — el nombre que tus clientes escriben, la dirección contra la que se emiten tus certificados, el destino al que apunta tu correo electrónico — está configurado en un [registrador](/es/glossary/registrar/) de dominios. Quien controla esa cuenta del registrador controla hacia dónde resuelve tu nombre. Puede redirigir tu sitio web, redirigir tu correo y demostrar la "propiedad" de tu dominio ante una autoridad certificadora. Nada de eso requiere tocar tus servidores, tus firewalls o tu código. Solo requiere iniciar sesión en un panel web.

Fox-IT era, por cualquier medida, una organización de seguridad seria. Ejecutaba captura completa de paquetes y sus propios sensores de red. Utilizaba autenticación de dos factores en su portal para clientes. Posteriormente fue adquirida por NCC Group. Y aun así quedó expuesta a través de la única cuenta en la que casi nunca iniciaba sesión — porque, como la propia empresa señaló, [los ajustes de DNS en general cambian muy raramente](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=DNS%20settings%20in%20general%20change%20very%20rarely), por lo que las credenciales que los protegían se fueron quedando silenciosamente obsoletas.

Como Fox-IT planteó al inicio de su propio informe: [si tal ataque puede afectar a una firma de seguridad, lo más probable es que pueda afectar a muchos otros tipos de empresas](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=if%20such%20an%20attack%20can%20hit%20a%20security%20firm) que se centran menos en la seguridad.

## 19 de septiembre de 2017: el secuestro y el MITM

![Arte conceptual colorido y vívido de una figura de espía silencioso leyendo dos flujos de correo que fluyen entre dos torres distantes, los flujos pasando invisiblemente por sus manos mientras ambas torres brillan como si nada fuera mal](../../assets/the-fox-it-dns-hijack-01-hijack.jpg)

El relato de Fox-IT comienza con una línea que desde entonces se ha convertido en un pequeño clásico de la escritura sobre respuesta a incidentes: [Para Fox-IT el "si" se convirtió en "cuando" el martes 19 de septiembre de 2017](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=became%20%E2%80%98when%E2%80%99%20on%20Tuesday%2C%20September%2019%202017), cuando la empresa fue víctima de un ataque de intermediario.

Lo que ocurrió no fue un exploit de servidor. En la madrugada del 19 de septiembre, [un atacante accedió a los registros DNS del dominio Fox-IT.com en nuestro registrador de dominios externo](https://grahamcluley.com/fox-it-dns-hack/#:~:text=an%20attacker%20accessed%20the%20DNS%20records%20for%20the%20Fox%2DIT.com%20domain). Con el control de esos registros, el atacante [modificó un registro DNS de un servidor específico para que apuntara a un servidor en su posesión e interceptara y reenviara el tráfico](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=modified%20a%20DNS%20record%20for%20one%20particular%20server) de vuelta a la infraestructura real de Fox-IT.

Ese último detalle — *reenviar el tráfico* — es lo que lo convirtió en un ataque de intermediario en lugar de una simple interrupción. Los visitantes seguían llegando a un portal funcional. Solo lo hacían a través del atacante primero.

El objetivo era específico. El ataque estaba [dirigido específicamente a ClientPortal, la aplicación web de intercambio de documentos de Fox-IT](https://grahamcluley.com/fox-it-dns-hack/#:~:text=specifically%20aimed%20at%20ClientPortal), el sistema que Fox-IT usaba para intercambiar archivos de forma segura con clientes, proveedores y otras organizaciones. En otras palabras, el atacante fue directamente al canal por donde fluían los documentos confidenciales de los clientes.

Gracias a que Fox-IT lo detectó y contuvo, la empresa [limitó el tiempo total efectivo del MitM a 10 horas y 24 minutos](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes). La cobertura independiente confirmó el mismo dato: [el incidente ocurrió el 19 de septiembre y duró 10 horas y 24 minutos](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=lasted%20for%2010%20hours%20and%2024%20minutes).

## Qué fue interceptado exactamente

Diez horas de ataque de intermediario en un portal de intercambio de documentos suena catastrófico. El botín real fue pequeño — y esa pequeñez es en sí misma la historia.

Durante la ventana de ataque, [nueve usuarios individuales iniciaron sesión y sus credenciales fueron interceptadas](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Nine%20individual%20users%20logged%20in). Pero esas credenciales resultaron inútiles en gran medida: el portal de Fox-IT requería un segundo factor de autenticación que el atacante, sentado en la ruta de red, no podía repetir. Help Net Security señaló que las credenciales de inicio de sesión de nueve usuarios fueron capturadas pero [eran inútiles sin el segundo factor de autenticación](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor).

En cuanto a archivos, [doce archivos (de los cuales diez eran únicos) fueron transferidos e interceptados](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Twelve%20files%20%28of%20which%20ten%20were%20unique%29%20were%20transferred%20and%20intercepted). Algunos contenían información confidencial de clientes. El atacante también capturó un subconjunto de nombres y direcciones de correo electrónico de usuarios de ClientPortal, algunos nombres de cuenta y un número de teléfono móvil, como [resumió SecurityWeek](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=mobile%20phone%20number).

Dos hechos mantuvieron el daño acotado. Primero, Fox-IT declaró claramente que [los archivos clasificados como secreto de estado nunca se transfieren a través de nuestro ClientPortal](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Files%20classified%20as%20state%20secret%20are%20never%20transferred) — el material más sensible simplemente nunca existió en el canal expuesto. Segundo, el propio segundo factor de la firma amortiguó el robo de credenciales. La arquitectura limitó el radio de daño incluso después de que el perímetro — el DNS — hubiera fallado.

## Cómo ocurrió: una contraseña obsoleta, sin segundo factor

![Arte conceptual colorido y vívido de una llave ornamental siendo extraída del bolsillo de un guardián dormido y usada para abrir un gran cartel que desvía un río de luz hacia una cabina espejada oculta, donde un sello de cera forjado estampa un certificado brillante](../../assets/the-fox-it-dns-hijack-02-mitm.jpg)

El mecanismo parece una lista de verificación de cómo se toma un dominio sin una sola línea de malware en los servidores de la víctima.

**Paso uno — entrar a la cuenta del registrador.** El atacante [inició sesión correctamente en el panel de control DNS de nuestro proveedor de registrador de dominio externo usando credenciales válidas](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=logged%20in%20to%20the%20DNS%20control%20panel). La investigación de Fox-IT concluyó que el atacante [probablemente obtuvo acceso a las credenciales del panel de control DNS de su registrador de dominio mediante el compromiso de un proveedor externo](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=through%20the%20compromise%20of%20a%20third%20party%20provider). Dos debilidades combinadas hicieron que ese inicio de sesión funcionara: la [contraseña no había sido cambiada desde 2013](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013), y el registrador no ofrecía ningún segundo factor — en el momento de escribir esto, Fox-IT señaló que el [registrador aún no admite 2FA](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA).

**Paso dos — cambiar DNS y demostrar "propiedad" ante una CA.** Con el panel abierto, el atacante redirigió el DNS. Pero para ejecutar un ataque de intermediario *creíble* en un sitio HTTPS, necesitaba un certificado válido para fox-it.com — y la forma moderna de obtenerlo es demostrar que controlas el dominio. Así que el atacante hizo exactamente eso. En una estrecha ventana alrededor de las 02:05–02:15, [redirigió e interceptó temporalmente el correo electrónico de Fox-IT con el propósito específico de demostrar que era propietario de nuestro dominio durante el proceso de registro fraudulento de un certificado SSL para nuestro ClientPortal](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=fraudulently%20registering%20an%20SSL%20certificate%20for%20our%20ClientPortal). Esta es la parte que debería hacer pausar a todo lector: **el control del DNS es, en la práctica, el control de la validación de dominio.** Un certificado validado por dominio se concede a quien pueda responder al desafío de la CA — y aquí, controlar el DNS permitió al atacante redirigir el correo electrónico de validación y responderlo. El DNS decide dónde aterriza esa prueba de propiedad.

**Paso tres — situarse en el medio.** Armado con un certificado emitido legítimamente (pero obtenido fraudulentamente), el atacante apuntó el dominio a un VPS en el extranjero e interceptó el tráfico. Como describió SecurityWeek, el [certificado SSL falso fue utilizado para un ataque MitM contra ClientPortal, con el tráfico al portal enrutado a través de un proveedor de servidor privado virtual (VPS) en el extranjero](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=rogue%20SSL%20certificate%20was%20used). Para un visitante, nada estaba mal. El candado era real. El certificado validado. El intermediario sostenía una llave en la que confiaba el navegador.

Tres capas — DNS, la autoridad certificadora y el propio TLS — funcionaban todas técnicamente de forma correcta. El atacante no rompió ninguna de ellas. Convenció a las tres de que era Fox-IT, y lo único que le permitió hacerlo fue un inicio de sesión obsoleto y sin un solo factor en un registrador.

## La respuesta de Fox-IT: detectar, contener y luego contárselo a todos

Lo que diferencia este incidente de cientos de otros más silenciosos es la respuesta — tanto técnica como editorial.

**La detección fue rápida.** Fox-IT determinó que los servidores de nombres de su dominio fox-it.com habían sido redirigidos, detectando la intrusión aproximadamente cinco horas después de que comenzara — [unas cinco horas después de que comenzara el ataque](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=five%20hours%20after%20the%20attack%20started), según Help Net Security. La captura completa de paquetes y los sensores de red que la empresa ejecutaba sobre sí misma le proporcionaron el registro forense para reconstruir exactamente qué había sido tocado y qué no.

**El contenimiento fue deliberado.** En lugar de desconectar el portal y alertar al atacante, Fox-IT eligió una mitigación más discreta: [deshabilitó el segundo factor de autenticación de nuestro sistema de autenticación de inicio de sesión del ClientPortal](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=disabled%20the%20second%20factor%20authentication) — un movimiento contraintuitivo, pero que le permitió gestionar la situación mientras recuperaba el control de su DNS, sin revelar que había detectado la intrusión. Luego [contactó inmediatamente a los clientes afectados respecto a estos archivos](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=All%20affected%20clients%20in%20respect%20of%20these%20files%20were%20contacted%20immediately).

**Luego llegó la parte que lo convirtió en un caso de estudio.** Tres meses después, tras el análisis y con una investigación policial en marcha, Fox-IT publicó un post-mortem completo con marcas de tiempo bajo una tesis simple: [la transparencia genera más confianza que el secretismo y hay lecciones que aprender](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=transparency%20builds%20more%20trust%20than%20secrecy). Una empresa de seguridad había sido expuesta de la manera más representativa posible — y en lugar de ocultarlo, entregó a la industria un análisis detallado. El titular de BleepingComputer capturó el tono que merecía el momento: [Top Security Firm Admits to MitM Security Incident](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=Top%20Security%20Firm%20Admits).

## Qué enseña esto sobre la seguridad del registrador y los registry locks

Deja de lado los detalles y el incidente Fox-IT es una lección sobre dónde está el perímetro real. Para la mayoría de las organizaciones, el perímetro no es solo el firewall. Es el inicio de sesión del registrador. Esto es lo que argumenta el caso:

1. **Trata la cuenta del registrador como infraestructura de producción.** Rara vez cambia, por lo que es fácil olvidarla — y eso es exactamente por qué se deteriora. Una contraseña sin cambiar [desde 2013](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013) no es "bajo riesgo porque hay poco tráfico"; es una credencial de alto valor sin monitoreo.

2. **Exige autenticación multifactor en el registrador — y cámbiate si no la ofrece.** El registrador de Fox-IT [no admitía 2FA](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA) en absoluto. La cuenta más importante en la cadena de seguridad de tu dominio estaba protegida solo por una contraseña. La presencia o ausencia de 2FA en un registrador es un criterio de adquisición, no un añadido opcional.

3. **Usa un registry lock.** Más allá del propio inicio de sesión del registrador, muchos registros ofrecen un *registry lock* — un bloqueo del lado del servidor que impide cambios en los servidores de nombres y registros de contacto a menos que se complete un paso de verificación manual fuera de banda. Un registry lock habría significado que incluso con una contraseña del registrador completamente comprometida, no se podría redirigir el DNS silenciosamente. Convierte "a un panel de distancia" en "múltiples personas y una llamada telefónica de distancia."

4. **Implementa [DNSSEC](/es/glossary/dnssec/) donde puedas.** DNSSEC firma criptográficamente las respuestas DNS para que los resolvedores puedan detectar manipulaciones en la ruta de resolución. No es una solución mágica aquí — un atacante que controla los registros autoritativos puede volver a firmarlos — pero eleva el costo y cierra clases enteras de manipulación DNS en tránsito. La defensa en profundidad en la capa DNS importa precisamente porque, como mostró este caso, el DNS se sitúa *por encima* de TLS y la emisión de certificados en la pila de confianza.

5. **Recuerda que el control del DNS equivale al control del certificado.** El atacante obtuvo un certificado TLS válido [demostrando la propiedad del dominio a través del correo electrónico redirigido](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=proving%20that%20they%20owned%20our%20domain). Monitorea los registros de Transparencia de Certificados para detectar certificados inesperados emitidos contra tus dominios. Un certificado fraudulento que aparece en CT es una de las pocas señales externas de que un secuestro de DNS puede estar en marcha.

6. **Mantén un segundo factor en la propia aplicación.** El 2FA del portal de Fox-IT es la razón por la que nueve contraseñas robadas fueron [inútiles sin el segundo factor de autenticación](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor). Cuando la capa exterior (DNS) falló, la capa interior (MFA a nivel de aplicación) aún limitó el daño.

El hilo conductor: tu dominio es un punto único de fallo que en parte externalizas. Reforzarlo no es glamoroso, y solo da sus frutos el día en que alguien intenta exactamente lo que le pasó a Fox-IT.

## El ángulo Namefi

![Ilustración colorida de propiedad de dominio verificable y resistente a manipulaciones — una tarjeta de dominio asegurada por un escudo verde, un token verde de Namefi y continuidad DNS](../../assets/the-fox-it-dns-hijack-03-namefi-angle.jpg)

El incidente Fox-IT es, en esencia, un problema de control y procedencia. El atacante nunca necesitó ser Fox-IT. Solo necesitaba que un sistema — el panel del registrador — *creyera* que lo era, durante el tiempo suficiente para redirigir el DNS y emitir un certificado. Todo lo que estaba aguas abajo confió en esa creencia.

[Namefi](https://namefi.io) está construido para hacer que el control de dominios sea verificable y resistente a manipulaciones, en lugar de depender de una única contraseña reutilizable en el panel web de un proveedor. Al representar la propiedad del dominio como un activo verificable en cadena que permanece compatible con el DNS, el control se convierte en algo que puedes auditar y demostrar — no solo en una cuenta en la que alguien podría iniciar sesión silenciosamente y reconfigurar. Los cambios críticos pueden vincularse a la propiedad que realmente tienes, en el espíritu de un registry lock, en lugar de a una credencial que no ha sido rotada en años.

Nada de esto haría imposible a un atacante determinado. Pero la historia de Fox-IT trata en última instancia de un único inicio de sesión robado que se traduce en control total de un nombre. Cuanto más cerca esté el control del dominio de la propiedad verificable — y más difícil sea cambiar un nombre silenciosamente con una sola contraseña obsoleta — menos puede propagarse un momento como el "si se convirtió en cuando" de Fox-IT antes de que alguien lo note.

Una firma de seguridad detectó su propio secuestro en cinco horas y le contó al mundo cómo. La mayoría de las organizaciones no lo habrían detectado en ninguno de los dos sentidos. La lección más barata es la que Fox-IT pagó: bloquea el registrador antes de que se convierta en la puerta abierta.

## Fuentes y lecturas adicionales

- Fox-IT (NCC Group) — [Lessons learned from a Man-in-the-Middle attack](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/) (post-mortem principal)
- BleepingComputer — [Top Security Firm Admits to MitM Security Incident](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/)
- Help Net Security — [Security company Fox-IT reveals, details MitM attack they suffered in September](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/)
- Graham Cluley — [Fox-IT reveals hackers hijacked its DNS records, spied on clients' files](https://grahamcluley.com/fox-it-dns-hack/)
- SecurityWeek — [Hackers Target Security Firm Fox-IT](https://www.securityweek.com/hackers-target-security-firm-fox-it/)
- GBHackers — [Leading IT Security Firm Fox-IT hit by Cyber Attack](https://gbhackers.com/cyber-attack/)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (relacionado: técnica de secuestro DNS + certificado fraudulento a escala)
