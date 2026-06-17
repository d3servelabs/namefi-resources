---
title: 'El Ataque al Front-End de BadgerDAO: $120 Millones Drenados a Través de un Script Inyectado'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'En diciembre de 2021, unos atacantes comprometieron la cuenta de Cloudflare de BadgerDAO e inyectaron un script malicioso en el front-end de su sitio web. Los contratos inteligentes auditados nunca fueron tocados; sin embargo, ~$120 millones se esfumaron a través de aprobaciones de billeteras que los usuarios firmaron sin saberlo. Un análisis profundo de por qué el sitio web es parte de tu superficie de seguridad.'
keywords: ['hackeo badgerdao', 'ataque front-end badgerdao', 'compromiso api key cloudflare', 'ataque script inyectado', 'seguridad front-end web3', 'ice phishing', 'ataque increaseAllowance', 'exploit aprobacion tokens', 'seguridad dns y dominios', 'exploit cloudflare workers', 'seguridad defi', 'ataque cadena de suministro web3', 'manipulacion de sitios web', 'seguridad de dominios']
---

La auditoría estaba limpia. Los contratos estaban bien. El dinero desapareció de todos modos.

En los días previos y posteriores al 2 de diciembre de 2021, BadgerDAO —un proyecto DeFi construido en torno a la integración de Bitcoin en las finanzas descentralizadas— perdió aproximadamente **$120 millones** en fondos de sus usuarios. No hubo ningún truco de préstamos flash (flash-loan), ningún error de reentrada (reentrancy bug), ni ningún exploit matemático sofisticado contra las bóvedas (vaults). Los contratos inteligentes hicieron exactamente lo que debían hacer. El atacante nunca tuvo que vulnerarlos, porque el atacante nunca los atacó.

Atacó el *sitio web*.

Alguien había deslizado silenciosamente un script malicioso en el front-end de app.badger.com. Para cada usuario que cargaba la página, parecía la misma dApp de confianza que usaban todos los días. Pero cuando iban a interactuar con ella, la página pedía a su billetera un permiso adicional e invisible, y una vez que hacían clic en "aprobar", sus tokens dejaban de ser suyos.

Esta es la historia de cómo un proyecto con contratos auditados perdió nueve cifras por una sola línea de código inyectada en el front-end, y por qué esto debería cambiar permanentemente tu forma de pensar sobre los límites de tu seguridad.

## La mentira reconfortante: "los contratos están auditados"

La cultura cripto educó a los usuarios para hacer una pregunta antes de confiar en un protocolo: *¿ha sido auditado?* Las auditorías son importantes. Detectan errores reales. Pero en algún punto del camino, "los contratos están auditados" se solidificó en un sentimiento de seguridad total, como si un informe de auditoría limpio fuera un campo de fuerza alrededor de todo lo que llevara el nombre del proyecto.

No lo es.

Una auditoría examina el código on-chain: las bóvedas, la lógica del token, los controles de acceso. No dice nada sobre la computadora portátil que un desarrollador dejó conectada, los registros DNS que dirigen tu navegador a otro lugar, la CDN que se encuentra frente al sitio, o el JavaScript que tu navegador realmente descarga y ejecuta cuando visitas la dApp. Esos elementos viven en la *Web2* —en cuentas en la nube, claves API e infraestructura de dominios— y son una carga estructural tan importante como el propio código en Solidity.

BadgerDAO es la prueba más clara registrada de esta brecha. Como lo expresó sin rodeos un análisis técnico del incidente: [desde la perspectiva de los contratos inteligentes del proyecto, nada había salido mal](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=From%20the%20perspective%20of%20the%20project%27s%20smart%20contracts%2C%20nothing%20had%20gone%20wrong), y el atacante solo estaba usando las aprobaciones otorgadas por los usuarios. La blockchain se comportó perfectamente. El sitio web mintió.

## El ataque: un escaparate alterado con un recibo limpio

![Vivid colorful concept art of a trusted, friendly-looking storefront whose cash register has been quietly tampered with, an extra hidden drawer siphoning coins while customers smile and pay normally](../../assets/the-badgerdao-frontend-attack-01-attack.jpg)

Imagina entrar en una tienda que has visitado cien veces. El mismo letrero, el mismo personal, el mismo mostrador. Compras algo pequeño, el cajero lo cobra, pasas tu tarjeta. Todo parece rutinario. Lo que no puedes ver es que alguien cambió el lector de tarjetas por uno que también autoriza silenciosamente un segundo cargo ilimitado en tu cuenta, a favor de un extraño, para que lo cobre cuando quiera.

Eso es, en efecto, lo que les sucedió a los usuarios de BadgerDAO.

La clasificación importa aquí, porque es lo que hace que este incidente sea tan instructivo. Como resumió *Vice*, el hackeo [no involucró exploits complicados de contratos inteligentes. En cambio, fue un ataque al front-end dirigido a la infraestructura web de BadgerDAO](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=injected%20a%20malicious%20script%20into%20BadgerDAO%27s%20frontend) — en particular, a su cuenta de Cloudflare. Fue, según su perspectiva, un ataque web de la *vieja escuela* dirigido a un objetivo Web3.

El mecanismo fue elegante y silencioso. El script malicioso solicitaba a la billetera del usuario que otorgara un permiso de gasto de tokens a la dirección del atacante. En palabras de Vice, [el script malicioso básicamente engañaba a las personas para que le dieran a la dirección derechos para enviar los tokens a la dirección del explotador](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=The%20malicious%20script%20basically%20tricked%20people%20into%20giving). El usuario pensaba que estaba realizando una transacción normal en la dApp. En realidad, estaba entregando las llaves de sus tokens.

Los investigadores de seguridad llaman a este patrón *ice phishing*: en lugar de robar tu clave privada, eres engañado para aprobar voluntariamente a un gastador malicioso. La firma es real. La aprobación es real. La transacción on-chain es válida. Precisamente por eso es tan peligroso, y por qué ninguna auditoría de contratos podría haberlo evitado.

## Lo que perdieron los usuarios: ~$120 millones, una firma a la vez

Las cifras son asombrosas para un ataque que nunca tocó una sola línea de código de las bóvedas.

La firma de auditoría de contratos inteligentes PeckShield [estimó que las pérdidas totales ascendían a unos $120 millones](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). El informe contable post-mortem del propio BadgerDAO, reproducido en estudios de caso del incidente, situó la pérdida en [aproximadamente 2076.54 BTC (~$116.3 millones de USD en el momento del hackeo)](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=2076.54%20BTC) una vez que todos los activos robados fueron convertidos a un denominador común.

El dolor no se distribuyó de manera uniforme. Una sola víctima —según se informa, una cuenta institucional— perdió la mayor parte en una sola transacción: los estudios de casos señalan que [aproximadamente 900 BTC fueron extraídos de la bóveda de Yearn wBTC](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php), y una sola parte perdió [más de $50 millones en Bitcoin envuelto (wBTC)](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=lose%20over%20%2450%20million). Cientos de usuarios comunes conformaron el resto.

Y la magnitud fue una consecuencia directa de la paciencia. El atacante no actuó presa del pánico. Como describe el análisis de Forta, [el hacker acumuló silenciosamente aprobaciones de casi 200 cuentas, y luego a las 12:48 a.m. del 2 de diciembre de 2021, drenó las billeteras de las víctimas en menos de 10 horas](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack#:~:text=The%20hacker%20silently%20accumulated%20approvals%20from%20almost%20200%20accounts). Las aprobaciones maliciosas se habían estado recolectando silenciosamente durante días: una trampa cargada, que se activó de una sola vez. Otra reconstrucción contabilizó a [500 billeteras creando estas aprobaciones ilimitadas](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=The%20attacker%20managed%20to%20get%20500%20wallets) a lo largo del periodo de la campaña.

El detalle más cruel: no había nada que un usuario cuidadoso pudiera haber comprobado. La URL era correcta. El certificado TLS era válido. La interfaz era genuina. Lo único incorrecto era un fragmento de JavaScript que el propio sitio web legítimo estaba sirviendo.

## Cómo sucedió: una clave API de Cloudflare y una aprobación inyectada

![Vivid colorful concept art of an invisible hand quietly adding one extra glowing approve button to a wallet pop-up while the real interface looks calm and trustworthy, a single malicious line of code slipping into a friendly web page](../../assets/the-badgerdao-frontend-attack-02-injected-script.jpg)

La puerta de entrada que usó el atacante no fue un contrato inteligente. Fue una cuenta en la nube.

BadgerDAO, como una enorme parte de la web moderna, se situaba detrás de Cloudflare: la capa de distribución de contenido y computación en el borde que sirve y acelera los sitios web. El control de esa cuenta significaba el control del código que el sitio web de BadgerDAO entregaba a sus visitantes. Y el atacante obtuvo ese control a través de una clave robada.

En el informe oficial de BadgerDAO, transmitido por CoinDesk, [el hacker utilizó una clave API comprometida que se creó sin el conocimiento o autorización de los ingenieros de Badger para inyectar periódicamente el código malicioso que afectó a un subconjunto de sus clientes](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m). Esa frase —*un subconjunto de sus clientes*— es en parte la razón por la que permaneció oculto tanto tiempo. El script no se ejecutaba para todos, todo el tiempo. Entraba y salía, afectando solo a algunos usuarios, haciendo que el comportamiento malicioso fuera enloquecedoramente difícil de reproducir o notar.

¿Cómo llegó a existir una clave API no autorizada? La causa principal se remontó a una falla en la cuenta de Cloudflare. Los estudios de caso del incidente señalan que usuarios no autorizados pudieron crear cuentas y también crear y ver claves API (Globales) (las cuales no pueden ser eliminadas o desactivadas) [antes de que se completara la verificación del correo electrónico](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=before%20email%20verification%20was%20completed). Un atacante podía plantar una clave en una cuenta y luego simplemente esperar a que el verdadero dueño terminara de verificarla y activarla, momento en el cual el atacante mantenía silenciosamente un acceso válido a la API.

Con esa clave, el atacante recurrió a Cloudflare Workers —la plataforma de computación en el borde de Cloudflare— para reescribir la página en su trayecto hacia el usuario. El reporte post-mortem de BadgerDAO, preparado con la firma de ciberseguridad Mandiant, concluyó que el incidente de phishing del 2 de diciembre fue el resultado de un fragmento de código inyectado de forma maliciosa proporcionado por Cloudflare Workers. El código inyectado hacía exactamente una cosa que importaba: insertaba una solicitud de aprobación de tokens extra en el flujo normal de la dApp.

Hubo incluso una intencionalidad deliberada sobre *qué* llamada de aprobación utilizó. CryptoBriefing informó que [el hacker presuntamente insertó un script malicioso en el sitio web de Badger que presentaba a los usuarios una transacción para "aumentar la asignación" (increase allowance)](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/#:~:text=presented%20users%20with%20a%20transaction%20to). Esa elección no fue aleatoria. En comparación con una llamada directa `approve`, un aviso de `increaseAllowance` tiende a mostrarse con señales visuales más débiles y menos alarmantes en las ventanas emergentes de las billeteras: menos banderas rojas, menos alertas del tipo "estás a punto de otorgar poder de gasto". El atacante optimizó la *experiencia de usuario* de ser robado.

Así que la cadena completa se vio así: una debilidad en la verificación de cuentas de Cloudflare permitió que existiera una clave API no autorizada → el atacante usó esa clave para desplegar un Worker → el Worker inyectó un script en app.badger.com → el script pidió a las billeteras una asignación de tokens hacia el atacante → los usuarios lo aprobaron → el atacante vació sus cuentas. Ni un solo paso de este proceso tocó los contratos auditados.

## La respuesta: pausar la blockchain para detener una herida de Web2

Una vez que las transacciones de drenaje impactaron a gran escala en las primeras horas del 2 de diciembre, la huella on-chain finalmente se hizo imposible de ignorar, y BadgerDAO se movió rápido, utilizando sus contratos inteligentes para detener un problema que se había originado completamente off-chain.

El equipo reconoció el incidente públicamente y, según CryptoBriefing, confirmó que [todos los contratos inteligentes se han pausado para prevenir futuros retiros](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). Debido a que las bóvedas de Badger tenían capacidad de pausa, congelar las transferencias cortó la habilidad del atacante para seguir moviendo los fondos recién aprobados. Un artículo técnico describe esta detención como el equipo ejerciendo el poder de congelar todas las llamadas a la función `transferFrom`, el mecanismo exacto de ERC-20 que las aprobaciones maliciosas estaban explotando. Esa pausa es también la razón por la cual una parte significativa de la pérdida fue teóricamente recuperable: algunos activos habían sido movidos por el atacante pero aún no habían sido retirados completamente de las bóvedas de Badger antes de que se implementara el congelamiento.

Por el lado de la infraestructura, la limpieza consistió en la sombría lista de verificación de Web2 ante una brecha de credenciales: rotar las claves API de Cloudflare, cambiar la contraseña de la cuenta, endurecer la autenticación multifactor (MFA) y auditar cada clave que no debería haber existido. Luego, BadgerDAO se asoció con Mandiant para investigar y publicar un reporte técnico post-mortem reconstruyendo la línea de tiempo: las debilidades de la cuenta de Cloudflare, las claves no autorizadas creadas en los meses anteriores, la inyección del script en noviembre y el vaciamiento en diciembre.

Pero ninguna respuesta a incidentes podía revertir las aprobaciones que los usuarios ya habían otorgado. Las firmas eran válidas. Las medidas correctivas podían detener robos *futuros* y buscar la recuperación de fondos; pero no podían revertir el consentimiento que ya se había concedido on-chain.

## Lo que esto enseña: el sitio web es parte de tu superficie de seguridad

La lección más importante de BadgerDAO es una corrección de límites. La mayoría de los equipos —y la mayoría de los usuarios— trazan el perímetro de seguridad alrededor de los contratos inteligentes. BadgerDAO demuestra que el perímetro es mucho más amplio.

**1. Tu front-end está dentro del alcance. Siempre.** El código que ejecuta el navegador de un usuario es parte de tu protocolo, independientemente de si vive on-chain o no. Si un atacante controla el JavaScript que entrega tu sitio, controlará las billeteras de tus usuarios, tengan o no contratos auditados. El sitio no es "solo la interfaz de usuario" (UI). Es el lugar donde se captura el consentimiento.

**2. Tu infraestructura de dominios y nube son parte del contrato.** Una cuenta de Cloudflare, un inicio de sesión de un proveedor de DNS, una cuenta de un registrador, una clave CI/CD... cada una es una vía para reescribir lo que ven tus usuarios. BadgerDAO no fue vulnerado en sus bóvedas; fue vulnerado en la *cuenta que controlaba el sitio web*. Trata esas credenciales con la misma paranoia que reservas para una clave privada de despliegue.

**3. Las claves API y los flujos de creación de cuentas son una verdadera superficie de ataque.** Todo el desastre dependió de una clave API no autorizada que nunca debió haber existido, posibilitada por una brecha en la verificación. Inventaría cada clave. Restringe rigurosamente su alcance. Rótala. Crea alertas para claves nuevas. Una clave olvidada es una clave que un atacante puede usar.

**4. "Auditado" es necesario, pero no suficiente.** Una auditoría limpia tiene un gran valor real y de todas formas deberías obtener una. Pero solo cubre los contratos, no la cuenta de la nube, el DNS, la CDN o el pipeline de construcción de tu front-end. La seguridad engloba toda la ruta desde el navegador de tu usuario hasta tu blockchain, y es el eslabón más débil, y no el más fuerte, el que establece el estándar.

**5. Los usuarios no pueden evitar un front-end alterado solo con inspeccionarlo.** "Revisa siempre la URL" es un buen consejo que no habría servido de nada aquí. La URL era correcta. La lección para los usuarios es más dura: desconfía profundamente de los avisos de aprobación y de `increaseAllowance`, prefiere las billeteras y herramientas que decodifican y advierten sobre las aprobaciones de tokens, y revoca asignaciones antiguas de manera regular. Lo que estás aprobando importa más que la página en la que te encuentras.

## La perspectiva de Namefi

![Colorful illustration of verifiable, tamper-resistant domain and web ownership — secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-badgerdao-frontend-attack-03-namefi-angle.jpg)

Si analizamos BadgerDAO hasta su esencia, nos encontramos ante un problema de **propiedad y control**. El atacante no era el propietario del sitio web de BadgerDAO, pero durante semanas pudo cambiar lo que este mostraba. Las personas que *realmente* poseían el proyecto no tenían una manera fiable e inalterable de saber que la cadena de control sobre su presencia web (cuentas, claves, configuración en el borde, DNS) había sido silenciosamente comprometida.

Esa es la brecha que le importa a [Namefi](https://namefi.io). Namefi trata a los dominios y la propiedad web como activos nativos de internet de primer nivel: un control que sea verificable, auditable y más difícil de secuestrar en silencio, a la vez que se mantiene compatible con DNS. La superficie de ataque del front-end —quién controla el nombre, a dónde resuelve, qué infraestructura hay detrás de él— no es una idea de último momento respecto a los contratos inteligentes. Como demostró BadgerDAO de la manera más costosa posible, todo esto *es* parte del modelo de seguridad.

Puedes auditar tus contratos hasta que sean impecables. Pero si una clave no autorizada puede reescribir tu sitio web y un script inyectado puede recolectar las aprobaciones de tus usuarios, la auditoría nunca fue la historia completa. El dominio, el DNS y la infraestructura web que entregan tu aplicación a personas reales son parte de tu superficie de seguridad. Trátalos como tal, porque los atacantes ya lo hacen.

## Fuentes y lecturas complementarias

- CoinDesk — [BadgerDAO Reveals Details of How It Was Hacked for $120M](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)
- Vice (Motherboard) — [Hackers Steal $119M From 'Web3' Crypto Project With Old School Attack](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/)
- Halborn — [Explained: The BadgerDAO Hack (December 2021)](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021)
- Forta — [How to Derail a 120-Million-Dollar Hack](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack)
- CryptoBriefing — [$120M Lost in BadgerDAO DeFi Hack](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)
- Quadriga Initiative — [Dec 2021 — BadgerDAO Malicious Code Injected — $116.3m](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)
- Chainalysis — [Behind The Scenes of The BadgerDAO Hack](https://www.chainalysis.com/blog/chainalysis-podcast-episode-6-badgerdao-hack/)
- BadgerDAO / Mandiant — [BadgerDAO Exploit Technical Post Mortem](https://www.badger.tools/technical-post-mortem)