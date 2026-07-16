---
title: 'El ataque al front-end de BadgerDAO: $120M drenados a través de un solo script inyectado'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
description: 'En diciembre de 2021, atacantes comprometieron la cuenta de Cloudflare de BadgerDAO e inyectaron un script malicioso en el front-end de su sitio web. Los contratos inteligentes auditados nunca fueron tocados — sin embargo, ~$120M salieron por la puerta a través de aprobaciones de billeteras que los usuarios firmaron sin saberlo. Un análisis profundo sobre por qué el sitio web forma parte de tu superficie de seguridad.'
keywords: ['hackeo badgerdao', 'ataque front-end badgerdao', 'compromiso clave api cloudflare', 'ataque script inyectado', 'seguridad front-end web3', 'ice phishing', 'ataque increaseAllowance', 'exploit aprobación de tokens', 'seguridad dns y dominios', 'exploit cloudflare workers', 'seguridad defi', 'ataque cadena de suministro web3', 'manipulación de sitio web', 'seguridad de dominios']
relatedArticles:
  - /es/blog/the-curve-finance-dns-hijack/
  - /es/blog/the-sushiswap-miso-insider-attack/
  - /es/blog/the-godaddy-multi-year-breach/
  - /es/blog/the-2024-squarespace-defi-domain-hijacks/
  - /es/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/name-change-game-change/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/web3/
  - /es/glossary/dns/
  - /es/glossary/icann/
  - /es/glossary/tld/
---

La auditoría estaba limpia. Los contratos estaban bien. El dinero se fue de todas formas.

En los días alrededor del 2 de diciembre de 2021, BadgerDAO — un proyecto [DeFi](/es/glossary/defi/) construido en torno a llevar Bitcoin a las finanzas descentralizadas — perdió aproximadamente **$120 millones** de los fondos de sus usuarios. No hubo ningún truco de flash loan, ningún error de reentrancy, ningún exploit matemático inteligente contra las bóvedas. Los contratos inteligentes hicieron exactamente lo que fueron programados para hacer. El atacante nunca tuvo que romperlos, porque el atacante nunca los atacó.

Atacó el *sitio web*.

Alguien había introducido silenciosamente un script malicioso en el front-end de app.badger.com. Para cada usuario que cargaba la página, parecía la misma dApp de confianza que usaban todos los días. Pero cuando iban a interactuar con ella, la página pedía a su [billetera](/es/glossary/wallet/) un permiso adicional e invisible — y una vez que hacían clic en "aprobar", sus tokens ya no les pertenecían.

Esta es la historia de cómo un proyecto con contratos auditados perdió nueve cifras a través de una sola línea de código front-end inyectada, y por qué debería cambiar permanentemente la forma en que piensas sobre los límites de tu seguridad.

## La mentira reconfortante: "los contratos están auditados"

La cultura crypto entrenó a los usuarios para hacer una pregunta antes de confiar en un protocolo: *¿ha sido auditado?* Las auditorías importan. Detectan errores reales. Pero en algún punto del camino, "los contratos están auditados" se solidificó como una sensación de seguridad total — como si un informe de auditoría limpio fuera un escudo protector alrededor de todo lo que lleva el nombre del proyecto.

No lo es.

Una auditoría examina el código en la cadena: las bóvedas, la lógica de tokens, los controles de acceso. No dice nada sobre el portátil que un desarrollador dejó con la sesión iniciada, los registros [DNS](/es/glossary/dns/) que apuntan tu navegador a algún lugar, la CDN que se encuentra frente al sitio, o el JavaScript que tu navegador realmente descarga y ejecuta cuando visitas la dApp. Esos viven en *Web2* — en cuentas en la nube, claves API e infraestructura de dominio — y son igual de críticos que el Solidity.

BadgerDAO es la prueba más clara de esta brecha que existe. Como un análisis técnico del incidente señaló sin rodeos: [desde la perspectiva de los contratos inteligentes del proyecto, nada había salido mal](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=From%20the%20perspective%20of%20the%20project%27s%20smart%20contracts%2C%20nothing%20had%20gone%20wrong), y el atacante simplemente estaba usando las aprobaciones otorgadas por los usuarios. La cadena se comportó perfectamente. El sitio web mintió.

## El ataque: una tienda manipulada con un recibo limpio

![Arte conceptual colorido y vívido de una tienda de aspecto amigable y confiable cuya caja registradora ha sido manipulada silenciosamente, un cajón oculto extra que sifona monedas mientras los clientes sonríen y pagan normalmente](../../assets/the-badgerdao-frontend-attack-01-attack.jpg)

Imagina entrar en una tienda que has visitado cien veces. El mismo letrero, el mismo personal, el mismo mostrador. Compras algo pequeño, el cajero lo registra, golpeas tu tarjeta. Todo parece rutinario. Lo que no puedes ver es que alguien cambió el lector de tarjetas por uno que también autoriza silenciosamente un segundo cargo ilimitado contra tu cuenta — a un extraño, cuando quiera.

Eso es, en efecto, lo que les ocurrió a los usuarios de BadgerDAO.

La clasificación importa aquí, porque es lo que hace que este incidente sea tan instructivo. Como *Vice* lo resumió, el hackeo [no involucró exploits complicados de contratos inteligentes. En cambio, fue un ataque front-end dirigido a la infraestructura web de BadgerDAO](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=injected%20a%20malicious%20script%20into%20BadgerDAO%27s%20frontend) — en particular su cuenta de Cloudflare. Fue, en sus palabras, un ataque web *a la vieja escuela* dirigido a un objetivo [Web3](/es/glossary/web3/).

El mecanismo fue elegante y silencioso. El script malicioso pedía a la billetera del usuario que otorgara una asignación de gasto de tokens a la dirección del atacante. En palabras de Vice, [el script malicioso básicamente engañó a las personas para que le dieran a la dirección derechos para enviar los tokens a la dirección del explotador](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=The%20malicious%20script%20basically%20tricked%20people%20into%20giving). El usuario pensaba que estaba haciendo negocios normales en la dApp. Estaba firmando para ceder las llaves de sus tokens.

Los investigadores de seguridad llaman a este patrón *ice [phishing](/es/glossary/phishing/)*: en lugar de robar tu [clave privada](/es/glossary/private-key/), te engañan para que apruebes voluntariamente a un gastador malicioso. La firma es real. La aprobación es real. La transacción en la cadena es válida. Es exactamente por eso que es tan peligroso — y por qué ninguna auditoría de contratos podría haberlo detenido.

## Lo que perdieron los usuarios: ~$120 millones, una firma a la vez

Las cifras son asombrosas para un ataque que nunca tocó una sola línea de código de las bóvedas.

La firma de auditoría de contratos inteligentes PeckShield [estimó que las pérdidas totales ascendieron a alrededor de $120 millones](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). La propia contabilidad post-mortem de BadgerDAO, reproducida en estudios de caso del incidente, fijó la pérdida en [aproximadamente 2076.54 BTC (~$116.3M USD en el momento del hackeo)](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=2076.54%20BTC) una vez que todos los activos robados se convirtieron a un denominador común.

El dolor no se distribuyó uniformemente. Una sola víctima — según se informó, una cuenta institucional — perdió la mayor parte en una transacción: los estudios de caso señalan que [aproximadamente 900 BTC fueron retirados de la bóveda Yearn wBTC](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php), con una sola parte perdiendo [más de $50 millones en Bitcoin envuelto](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=lose%20over%20%2450%20million). Cientos de usuarios ordinarios conformaron el resto.

Y la escala fue consecuencia directa de la paciencia. El atacante no actuó en pánico. Como describe el análisis de Forta, [el hacker acumuló silenciosamente aprobaciones de casi 200 cuentas, y luego a las 12:48 am del 2 de diciembre de 2021, el hacker vació las billeteras de las víctimas en menos de 10 horas](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack#:~:text=The%20hacker%20silently%20accumulated%20approvals%20from%20almost%20200%20accounts). Las aprobaciones maliciosas se habían estado acumulando silenciosamente durante días — una trampa cargada, disparada de una vez. Otra reconstrucción contó [500 billeteras que crearon estas aprobaciones ilimitadas](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=The%20attacker%20managed%20to%20get%20500%20wallets) a lo largo de la campaña.

El detalle más cruel: no había nada que un usuario cuidadoso pudiera haber verificado. La URL era correcta. El certificado TLS era válido. La interfaz era genuina. Lo único que estaba mal era un fragmento de JavaScript que el propio sitio legítimo estaba sirviendo.

## Cómo sucedió: una clave API de Cloudflare y una aprobación inyectada

![Arte conceptual colorido y vívido de una mano invisible que agrega silenciosamente un botón de aprobación brillante adicional a una ventana emergente de billetera mientras la interfaz real parece tranquila y confiable, una sola línea maliciosa de código que se desliza en una página web amigable](../../assets/the-badgerdao-frontend-attack-02-injected-script.jpg)

La puerta principal que usó el atacante no era un contrato inteligente. Era una cuenta en la nube.

BadgerDAO, como una enorme proporción de la web moderna, se encontraba detrás de Cloudflare — la capa de entrega de contenido y computación en el borde que sirve y acelera los sitios web. El control de esa cuenta significaba controlar qué código el sitio web de BadgerDAO entregaba a los visitantes. Y el atacante obtuvo ese control a través de una clave robada.

En la contabilidad oficial de BadgerDAO, retransmitida por CoinDesk, [el hacker utilizó una clave API comprometida que fue creada sin el conocimiento ni la autorización de los ingenieros de Badger para inyectar periódicamente el código malicioso que afectó a un subconjunto de sus clientes](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m). Esa frase — *un subconjunto de sus clientes* — es parte de por qué permaneció oculto tanto tiempo. El script no se activaba para todos, en todo momento. Rotaba entrando y saliendo, afectando solo a algunos usuarios, haciendo que el comportamiento malicioso fuera desesperantemente difícil de reproducir o notar.

¿Cómo llegó a existir una clave API no autorizada? La causa raíz se remontó a una falla en la cuenta de Cloudflare. Los estudios de caso del incidente señalan que los usuarios no autorizados podían crear cuentas y también podían crear y ver claves API (globales) (que no pueden eliminarse ni desactivarse) [antes de que se completara la verificación por correo electrónico](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=before%20email%20verification%20was%20completed). Un atacante podía plantar una clave contra una cuenta y luego simplemente esperar a que el propietario real terminara de verificar y la activara — momento en el cual el atacante tenía silenciosamente acceso API válido.

Con esa clave, el atacante recurrió a Cloudflare Workers — la plataforma de computación en el borde de Cloudflare — para reescribir la página en camino al usuario. El post-mortem de BadgerDAO, preparado con la firma de ciberseguridad Mandiant, concluyó que el incidente de phishing del 2 de diciembre fue el resultado de un fragmento malicioso inyectado proporcionado por Cloudflare Workers. El código inyectado hizo exactamente una cosa que importaba: insertó una solicitud de aprobación de token adicional en el flujo normal de la dApp.

Incluso había un diseño deliberado en *qué* llamada de aprobación utilizó. CryptoBriefing informó que [el hacker supuestamente insertó un script malicioso en el sitio web de Badger que presentó a los usuarios una transacción para "aumentar la asignación"](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/#:~:text=presented%20users%20with%20a%20transaction%20to). Esa elección no fue aleatoria. Comparado con una llamada `approve` directa, un aviso de `increaseAllowance` tiende a representarse con señales visuales más débiles y menos alarmantes en las ventanas emergentes de billetera — menos banderas rojas, menos advertencia de "estás a punto de otorgar poder de gasto". El atacante optimizó la *experiencia de usuario* de ser robado.

Así que la cadena completa se vio así: una debilidad en la verificación de cuentas de Cloudflare permitió que existiera una clave API no autorizada → el atacante usó esa clave para desplegar un Worker → el Worker inyectó un script en app.badger.com → el script solicitó a las billeteras una asignación de tokens para el atacante → los usuarios aprobaron → el atacante los vació. Ni un solo paso de eso tocó los contratos auditados.

## La respuesta: pausar la cadena para detener una herida Web2

Una vez que las transacciones de vaciado llegaron a escala en las primeras horas del 2 de diciembre, la huella en la cadena finalmente se volvió imposible de ignorar, y BadgerDAO actuó rápidamente — usando sus contratos inteligentes para detener un problema que había originado completamente fuera de la cadena.

El equipo reconoció el incidente públicamente y, según CryptoBriefing, confirmó que [todos los contratos inteligentes han sido pausados para prevenir más retiros](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). Dado que las bóvedas de Badger tenían capacidad de pausa, congelar las transferencias cortó la capacidad del atacante de seguir moviendo fondos recién aprobados. Un análisis técnico describe la detención como el equipo ejerciendo el poder de congelar todas las llamadas a la función `transferFrom` — el mecanismo [ERC-20](/es/glossary/erc-20/) mismo que las aprobaciones maliciosas estaban explotando. Esa pausa también es la razón por la que una porción significativa de la pérdida era teóricamente recuperable: algunos activos habían sido movidos por el atacante pero aún no habían sido completamente retirados de las bóvedas de Badger antes de que llegara la congelación.

En el lado de la infraestructura, la limpieza fue la sombría lista de verificación Web2 de una brecha de credenciales: rotar las claves API de Cloudflare, cambiar la contraseña de la cuenta, reforzar la autenticación multifactor y auditar cada clave que no debería haber existido. BadgerDAO luego se asoció con Mandiant para investigar y publicar un post-mortem técnico que reconstruyó la línea de tiempo — las debilidades de la cuenta de Cloudflare, las claves no autorizadas creadas en los meses anteriores, la inyección de script de noviembre y el vaciado de diciembre.

Pero ninguna respuesta al incidente podía deshacer las aprobaciones que los usuarios ya habían otorgado. Las firmas eran válidas. La remediación podía detener el robo *futuro* y perseguir la recuperación; no podía revertir el consentimiento que ya había sido otorgado en la cadena.

## Lo que esto enseña: el sitio web es parte de tu superficie de seguridad

La lección más importante de BadgerDAO es una corrección de límites. La mayoría de los equipos — y la mayoría de los usuarios — trazan el perímetro de seguridad alrededor de los contratos inteligentes. BadgerDAO prueba que el perímetro es mucho más grande.

**1. Tu front-end está en el ámbito. Siempre.** El código que ejecuta el navegador de un usuario es parte de tu protocolo, ya sea que viva en la cadena o no. Si un atacante controla qué JavaScript sirve tu sitio, controla las billeteras de tus usuarios — contratos auditados o no. El sitio no es "solo la interfaz de usuario". Es el lugar donde se captura el consentimiento.

**2. Tu infraestructura de nube y dominio es parte del contrato.** Una cuenta de Cloudflare, un inicio de sesión en un proveedor DNS, una cuenta de [registrador](/es/glossary/registrar/), una clave CI/CD — cada una es un camino para reescribir lo que ven tus usuarios. BadgerDAO no fue vulnerado en la bóveda; fue vulnerado en la *cuenta que controlaba el sitio web*. Trata esas credenciales con la misma paranoia que reservas para una clave privada de desplegador.

**3. Las claves API y los flujos de creación de cuentas son superficie de ataque real.** Todo el desastre dependió de una clave API no autorizada que nunca debería haber existido, posibilitada por una brecha de verificación. Haz un inventario de cada clave. Limita su alcance. Rótalas. Alerta sobre nuevas. Una clave que olvidaste es una clave que un atacante puede usar.

**4. "Auditado" es necesario, no suficiente.** Una auditoría limpia es valor real y deberías obtener una de todas formas. Pero cubre los contratos, no la cuenta en la nube, el DNS, la CDN o el pipeline de compilación del front-end. La seguridad es todo el camino desde el navegador de un usuario hasta tu cadena — y el eslabón más débil, no el más fuerte, establece el listón.

**5. Los usuarios no pueden inspeccionarse hasta salir de un front-end manipulado.** "Siempre verifica la URL" es un buen consejo que no habría servido de nada aquí. La URL era correcta. La lección para los usuarios es más difícil: sé profundamente sospechoso de las solicitudes de aprobación y de `increaseAllowance`, prefiere billeteras y herramientas que decodifiquen y adviertan sobre las aprobaciones de tokens, y revoca regularmente las asignaciones obsoletas. Lo que estás aprobando importa más que la página en la que estás.

## El ángulo de Namefi

![Ilustración colorida de propiedad de dominio y web verificable y resistente a manipulaciones — asegurada por un escudo verde, un token verde de Namefi y continuidad DNS](../../assets/the-badgerdao-frontend-attack-03-namefi-angle.jpg)

Reduce BadgerDAO a su esencia y es un problema de **propiedad y control**. El atacante no era propietario del sitio web de BadgerDAO — pero durante semanas, podía cambiar lo que servía. Las personas que *sí* eran propietarias del proyecto no tenían una forma confiable y a prueba de manipulaciones de saber que la cadena de control sobre su presencia web — cuenta, claves, configuración de borde, DNS — había sido silenciosamente comprometida.

Esa es la brecha que le importa a [Namefi](https://namefi.io). Namefi trata los dominios y la propiedad web como activos de primera clase nativos de internet: control que es verificable, auditable y más difícil de secuestrar silenciosamente, manteniendo la compatibilidad con DNS. La superficie de ataque del front-end — quién controla el nombre, hacia dónde resuelve, qué infraestructura hay detrás — no es una consideración secundaria a los contratos inteligentes. Como BadgerDAO demostró de la manera más costosa posible, *es* parte del modelo de seguridad.

Puedes auditar tus contratos hasta que sean impecables. Pero si una clave no autorizada puede reescribir tu sitio web y un script inyectado puede cosechar las aprobaciones de tus usuarios, la auditoría nunca fue toda la historia. El dominio, el DNS y la infraestructura web que entregan tu aplicación a personas reales son parte de tu superficie de seguridad. Trátalos como tal — porque los atacantes ya lo hacen.

## Fuentes y lectura adicional

- CoinDesk — [BadgerDAO Reveals Details of How It Was Hacked for $120M](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)
- Vice (Motherboard) — [Hackers Steal $119M From 'Web3' Crypto Project With Old School Attack](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/)
- Halborn — [Explained: The BadgerDAO Hack (December 2021)](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021)
- Forta — [How to Derail a 120-Million-Dollar Hack](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack)
- CryptoBriefing — [$120M Lost in BadgerDAO DeFi Hack](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)
- Quadriga Initiative — [Dec 2021 — BadgerDAO Malicious Code Injected — $116.3m](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)
- Chainalysis — [Behind The Scenes of The BadgerDAO Hack](https://www.chainalysis.com/blog/chainalysis-podcast-episode-6-badgerdao-hack/)
- BadgerDAO / Mandiant — [BadgerDAO Exploit Technical Post Mortem](https://www.badger.tools/technical-post-mortem)
