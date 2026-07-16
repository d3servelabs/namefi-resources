---
title: 'Cuando la propia ICANN fue víctima de phishing: la brecha de spear-phishing de 2014 en el corazón de Internet'
date: '2026-06-17'
language: es
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
description: 'A finales de 2014, ICANN —el organismo que coordina el sistema de nombres de dominio de Internet— admitió que un correo electrónico de spear-phishing que suplantaba su propio dominio había cosechado las credenciales del personal y otorgado a los atacantes acceso administrativo al Sistema Centralizado de Datos de Zona. Un análisis en profundidad de Domain Mayday sobre cómo la propia autoridad del DNS fue víctima de phishing, qué quedó expuesto y por qué sigue siendo relevante.'
keywords: ['brecha de icann', 'spear phishing icann', 'czds', 'sistema centralizado de datos de zona', 'seguridad dns', 'seguridad de dominios', 'ataque de spear phishing', 'phishing de credenciales', 'archivos de zona', 'iana', 'hashes de contraseña con sal', 'brecha del sistema de nombres de dominio', 'hackeo icann 2014']
relatedArticles:
  - /es/blog/the-godaddy-multi-year-breach/
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-myetherwallet-bgp-dns-attack/
  - /es/blog/the-2024-squarespace-defi-domain-hijacks/
  - /es/blog/the-dnspionage-campaign/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/name-change-game-change/
relatedGlossary:
  - /es/glossary/icann/
  - /es/glossary/registrar/
  - /es/glossary/dns/
  - /es/glossary/tld/
  - /es/glossary/registry/
---

Existe un tipo especial de titular que hace que todo el sector de la seguridad se detenga. No "otra minorista comprometida", no "otra startup filtra una base de datos", sino el día en que la institución en la que todos los demás confían admite que fue hackeada de la manera más ordinaria posible.

En diciembre de 2014, esa institución fue [ICANN](/es/glossary/icann/). La Corporación de Internet para la Asignación de Nombres y Números —la organización sin ánimo de lucro que coordina todo el [sistema de nombres de dominio](/es/glossary/dns/), la guardiana de las reglas que permiten que `namefi.io` y `google.com` y todas las demás direcciones del mundo apunten a un servidor— reveló que algunos de sus empleados habían hecho clic en un enlace de un correo electrónico falso, habían introducido sus contraseñas en una página de inicio de sesión falsa y habían entregado a los atacantes las llaves de los sistemas internos, incluido el Sistema Centralizado de Datos de Zona (CZDS), el repositorio a través del cual se solicitan y acceden los archivos de zona de los dominios de nivel superior del mundo.

La organización que define cómo funciona la confianza en Internet fue víctima de phishing. Con un correo electrónico falsificado. Que fingía ser ICANN.

Este es el **EP11 de Domain Mayday** — y es el episodio donde la llamada proviene del interior de la casa.

## Qué es ICANN y por qué una brecha allí es simbólica

Para entender por qué esta historia causó tanto impacto, hay que comprender qué hace realmente ICANN.

ICANN no es una empresa en la que compras un dominio. Se sitúa un nivel por encima de eso. Coordina el sistema global de identificadores únicos que hace que Internet sea navegable: los dominios de nivel superior (`.com`, `.org`, `.io` y los cientos de nuevos), las reglas que siguen los registros y los registradores, y —a través de su función [IANA](/es/glossary/iana/)— la cima de la jerarquía del DNS, la zona raíz de la que depende en última instancia cualquier otra consulta.

Si los dominios son las direcciones de Internet, ICANN gestiona el directorio maestro de la oficina de correos. Una brecha en un [registrador](/es/glossary/registrar/) es grave. Una brecha en ICANN es simbólica, porque ICANN se supone que es la *autoridad* —la única institución cuyo trabajo consiste en mantener el sistema de nombres ordenado y de confianza. Cuando la autoridad en materia de nombres de Internet queda comprometida, la incómoda pregunta es obvia: si a *ellos* les puede pasar, ¿a quién no?

## Finales de 2014: el compromiso

![Arte conceptual vívido y colorido de una carta oficial fraudulenta que se cuela ante un formidable guardián que sostiene un anillo brillante de llaves maestras de Internet, la carta brillando en rojo mientras las llaves brillan en azul](../../assets/the-icann-spear-phishing-breach-01-breach.jpg)

ICANN detalló la cronología en [su propio comunicado público](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=We%20believe%20a%20%22spear%20phishing%22%20attack%20was%20initiated%20in%20late%20November%202014.), publicado el 16 de diciembre de 2014, con una franqueza admirable: "Creemos que un ataque de 'spear phishing' se inició a finales de noviembre de 2014."

La mecánica era casi insultantemente simple. Según la descripción de ICANN, el ataque "[involucró mensajes de correo electrónico elaborados para parecer que provenían de nuestro propio dominio y enviados a miembros de nuestro personal](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=It%20involved%20email%20messages%20that%20were%20crafted%20to%20appear%20to%20come%20from%20our%20own%20domain%20being%20sent%20to%20members%20of%20our%20staff.)." Los empleados recibieron correos electrónicos que parecían provenir de `icann.org` —desde el interior de la propia ICANN. Algunos hicieron clic. Según la reconstrucción de The Register, los empleados "[hicieron clic en un enlace de los mensajes que los llevó a una página de inicio de sesión falsa —en la que el personal introdujo sus nombres de usuario y contraseñas](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=clicked%20on%20a%20link%20in%20the%20messages%20that%20took%20them%20to%20a%20bogus%20login%20page)", entregando así a los atacantes sus credenciales de correo electrónico de trabajo. El seco veredicto de The Register sobre la defensa ausente: "[Sin rastro de autenticación de dos factores, entonces.](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)"

El resultado, en palabras de la propia ICANN: "[El ataque resultó en el compromiso de las credenciales de correo electrónico de varios miembros del personal de ICANN.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attack%20resulted%20in%20the%20compromise%20of%20the%20email%20credentials%20of%20several%20ICANN%20staff%20members.)" Help Net Security lo expresó de forma aún más directa: "[Varios miembros del personal fueron engañados para que entregaran sus credenciales de correo electrónico](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=Several%20staff%20members%20were%20fooled%20into%20handing%20over%20their%20email%20credentials)" a los atacantes.

Sin vulnerabilidad de día cero. Sin malware exótico. Un correo electrónico convincente y un formulario de inicio de sesión falso —el truco más antiguo de Internet, ejecutado contra las personas que ayudan a gestionar Internet.

## Lo que fue accedido: el sistema de datos de zona en el centro

Las credenciales de correo electrónico robadas son por sí mismas un problema grave. Lo que convirtió esta brecha en un episodio de *Domain Mayday* es a qué llegaron los atacantes *con* ellas.

A principios de diciembre de 2014, ICANN descubrió que los inicios de sesión comprometidos habían sido reutilizados para acceder a otros sistemas. El más grave fue el **Sistema Centralizado de Datos de Zona** —CZDS, la plataforma donde las partes autorizadas solicitan y descargan los archivos de zona de los dominios genéricos de nivel superior del mundo. La revelación de ICANN es contundente: "[El atacante obtuvo acceso administrativo a todos los archivos del CZDS.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attacker%20obtained%20administrative%20access%20to%20all%20files%20in%20the%20CZDS.)"

Acceso *administrativo*. A *todos* los archivos. The Register explicó por qué eso importa: el CZDS "[otorga a las partes autorizadas acceso a todos los archivos de zona de los dominios genéricos de nivel superior del mundo](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=gives%20authorized%20parties%20access%20to%20all%20the%20zone%20files%20of%20the%20world%27s%20generic%20top%2Dlevel%20domains)." Los *usuarios* del sistema no son personas ordinarias —son, como señaló The Register, "[muchos de los administradores de los registros y registradores del mundo](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=many%20of%20the%20administrators%20of%20the%20world%27s%20registries%20and%20registrars)." Los atacantes no solo accedieron a una base de datos; accedieron a la base de datos en la que los propios guardianes del sistema de nombres inician sesión.

Más allá de los archivos de zona, la brecha expuso los datos personales que los usuarios del CZDS habían registrado. Según ICANN, el botín "[incluía copias de los archivos de zona del sistema, así como información introducida por los usuarios como nombre, dirección postal, dirección de correo electrónico, número de fax y teléfono, nombre de usuario y contraseña](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=This%20included%20copies%20of%20the%20zone%20files%20in%20the%20system%2C%20as%20well%20as%20information%20entered%20by%20users)." Nombres de usuario y contraseñas de las personas que gestionan los TLD —almacenados en un sistema al que un atacante había accedido portando una credencial robada.

Las credenciales llegaron aún más lejos. ICANN confirmó que los atacantes también tocaron el **GAC Wiki** (el espacio del Comité Asesor Gubernamental), el **Blog de ICANN** y el **portal de información [WHOIS](/es/glossary/whois/)**, aunque informó de que [los dos últimos sistemas no se vieron afectados](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=The%20latter%20two%20were%20not%20affected%20in%20any%20way.) y de que en el wiki solo hubo una visualización limitada.

## Cómo ocurrió: la credencial que decía "ICANN"

![Arte conceptual vívido y colorido de una torre de control para el sistema de nombres de dominio de noche, una única credencial falsa y brillante estampada con una marca de verificación que abre sus puertas mientras los guardias reales permanecen ajenos, con haces de luz roja que se escapan](../../assets/the-icann-spear-phishing-breach-02-spear-phishing.jpg)

Si se eliminan las capas técnicas, el ataque es un juego de confianza.

El spear phishing se diferencia del phishing ordinario en su precisión. No son un millón de correos electrónicos spam con la esperanza de que alguien muerda el anzuelo; son un pequeño número de mensajes cuidadosamente elaborados dirigidos a personas específicas, diseñados para parecer tráfico interno de rutina. Aquí el disfraz era el más poderoso posible: el correo electrónico parecía provenir de `icann.org`. Como resumió The Register, "[Los atacantes enviaron al personal correos electrónicos falsificados que parecían provenir de icann.org.](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Attackers%20sent%20staff%20spoofed%20emails%20appearing%20to%20coming%20from%20icann.org.)"

Piense en la psicología. Un correo electrónico del dominio de su propia organización no dispara las alarmas. Tampoco lo hace una página de inicio de sesión que parece la que usted usa a diario. Todo el ataque explotó el hecho de que *interno* y *familiar* se sienten igual que *seguro* —y no son lo mismo. La barra de direcciones decía una cosa; la página que había detrás recopilaba todo lo que se escribía en ella.

La única mitigación genuina de ICANN estaba en el lado del almacenamiento: las contraseñas robadas no estaban almacenadas en texto plano. Como señala la divulgación, "[las contraseñas se almacenaban como hashes criptográficos con sal](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=Although%20the%20passwords%20were%20stored%20as%20salted%20cryptographic%20hashes)" —mejor que la alternativa, pero, como señaló The Register, la protección solo se mantiene si los usuarios no reutilizaron esos mismos inicios de sesión en otro lugar, porque los hashes aún podían ser descifrados sin conexión. La brecha no terminó con la descarga; inició una lenta carrera entre los defensores que rotaban las contraseñas y los atacantes que intentaban revertirlas.

## Respuesta y consecuencias

Para su crédito, ICANN gestionó la divulgación mejor que la brecha en sí.

Hizo pública la información en cuestión de semanas, desactivó las contraseñas del CZDS, notificó a los usuarios afectados y —notablemente— enmarcó la transparencia como un deber y no como una responsabilidad. La organización declaró que estaba "[proporcionando información sobre este incidente públicamente, no solo por nuestro compromiso con la apertura y la transparencia, sino también porque compartir información sobre ciberseguridad ayuda a todos los involucrados a evaluar las amenazas a sus sistemas](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=providing%20information%20about%20this%20incident%20publicly%2C%20not%20just%20because%20of%20our%20commitment%20to%20openness%20and%20transparency)." También informó de que un programa de mejora de la seguridad iniciado antes ese mismo año había "[ayudado a limitar el acceso no autorizado obtenido en el ataque](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=these%20enhancements%20helped%20limit%20the%20unauthorized%20access%20obtained%20in%20the%20attack)."

La línea más importante para el resto de Internet fue la que indicaba lo que *no* cayó. ICANN confirmó: "[este ataque no impacta ningún sistema relacionado con IANA](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=this%20attack%20does%20not%20impact%20any%20IANA%2Drelated%20systems)." IANA —como la describió Help Net Security, la función que "[gestiona la zona raíz en el Sistema de Nombres de Dominio (DNS)](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=manages%20the%20root%20zone%20in%20the%20Domain%20Name%20System)"— es la verdadera cima de la pirámide de nombres de Internet. Si los atacantes la hubieran alcanzado, esto no habría sido una vergonzosa filtración de datos; habría sido una emergencia estructural.

El momento empeoró el bochorno. El titular de The Register lo expresó sin rodeos: el "[momento del ataque de spear-phishing no podría ser peor para el supervisor de nombres de dominio](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Spear%2Dphishing%20attack%20timing%20couldn%27t%20be%20worse%20for%20domain%20name%20overseer)." ¿Por qué? Porque ICANN "[esperaba que le entregaran el control del contrato crítico de IANA el año siguiente](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=it%20will%20prove%20extremely%20embarrassing%20to%20ICANN%2C%20which%20hopes%20to%20be%20handed%20control%20of%20the%20critical%20IANA%20contract%20next%20year)" —la transición de tutela que estaba entonces en negociación. Ser víctima de phishing es una mala audición para "confíen en nosotros con el corazón del DNS." (Como contexto, tampoco fue el primer susto en el CZDS de ICANN en 2014: The Register mencionó un incidente anterior en abril en el que "[a varios usuarios se les otorgó erróneamente acceso de administrador al sistema](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=a%20number%20of%20users%20were%20wrongly%20given%20admin%20access%20to%20the%20system).")

Y los datos tuvieron una larga vida posterior. En una actualización del 21 de febrero de 2017 añadida a su propio comunicado, ICANN reconoció que la información de la brecha estaba reapareciendo: "[parte de la información obtenida en el incidente de spear phishing que anunciamos en 2014 está siendo ofrecida a la venta en foros clandestinos](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=some%20information%20obtained%20in%20the%20spear%20phishing%20incident%20we%20announced%20in%202014%20is%20being%20offered%20for%20sale%20on%20underground%20forums)." CyberScoop informó sobre el precio años después: "[los datos todavía se están pasando y vendiendo en mercados negros por 300 dólares](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/#:~:text=the%20data%20is%20still%20being%20passed%20around%20and%20sold%20on%20black%20markets%20for%20%24300)", con afirmaciones de que nunca habían sido filtrados antes. Un solo clic a finales de 2014 todavía generaba ventas en 2017.

## Lo que esto enseña: todos son vulnerables al phishing, incluso la autoridad del DNS

La lección del EP11 no es "ICANN fue descuidada." Es algo más humilde.

**Todos son vulnerables al phishing.** No los descuidados. No los que no están entrenados. *Todos.* La organización que literalmente gobierna los nombres de Internet —integrada por personas que se dedican a pensar en DNS, seguridad e infraestructura— igualmente tuvo varios empleados que introdujeron sus credenciales en una página falsa porque el correo electrónico parecía interno. El phishing no vence a tu conocimiento; vence a tu atención, durante los dos segundos que tarda en hacer clic.

De este episodio se pueden extraer algunas conclusiones duraderas:

1. **Las credenciales son el perímetro.** Los atacantes nunca rompieron la criptografía de ICANN ni explotaron un fallo de servidor. Tomaron prestada una contraseña. Una vez que la identidad es la puerta, la identidad robada es la brecha —que es exactamente por qué el phishing sigue siendo el ataque más fiable del mundo.
2. **La autenticación multifactor no es opcional para los sistemas privilegiados.** El pinchazo de The Register sobre "[sin rastro de autenticación de dos factores](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)" es el punto central. Un segundo factor probablemente habría convertido el robo de credenciales en un no-evento.
3. **El movimiento lateral es el multiplicador.** El daño provino de la *reutilización* —inicios de sesión de correo electrónico reutilizados para acceder al CZDS, el wiki y el portal. Segmentar el acceso y no permitir que una credencial robada abra muchas puertas es lo que contiene una brecha.
4. **Los datos comprometidos son para siempre.** La reventa de 2017 demuestra que "restablecimos las contraseñas" cierra el incidente pero no la exposición. Los nombres, direcciones y números de teléfono no se filtran al revés.
5. **La autoridad no es lo mismo que la inmunidad.** Ser la institución que define la confianza no te hace inmune al ataque más básico sobre ella. Si acaso, te convierte en un objetivo más valioso.

## El ángulo de Namefi

![Ilustración colorida de la propiedad de dominio verificable y resistente a la manipulación — una tarjeta de dominio asegurada por un escudo verde, un token Namefi verde y la continuidad del DNS](../../assets/the-icann-spear-phishing-breach-03-namefi-angle.jpg)

La brecha de ICANN es, en esencia, una historia sobre *quién controla los registros* —y cómo ese control fue secuestrado a través de un único inicio de sesión robado en un sistema centralizado.

Esa es la debilidad estructural sobre la que vale la pena reflexionar. Cuando la prueba de quién está autorizado para acceder o gestionar datos críticos de dominio vive detrás de un nombre de usuario y contraseña en una sola plataforma, todo el modelo de confianza se derrumba en el momento en que esas credenciales son robadas mediante phishing. No hay una segunda verificación. Un correo electrónico convincente y una contraseña reutilizada fueron suficientes para otorgar acceso administrativo al sistema de datos de zona en el centro del mundo de los nombres.

[Namefi](https://namefi.io) está construido sobre una premisa diferente: que la propiedad y el control de los dominios deben ser **verificables, resistentes a la manipulación y no dependientes de un único secreto en una única bandeja de entrada.** Al representar la propiedad de dominios como tokens [en cadena](/es/glossary/on-chain/) que permanecen compatibles con el DNS, el control se convierte en algo que se puede probar y auditar criptográficamente —no solo en algo protegido por una contraseña que un correo electrónico de spear-phishing puede robar. Esto no hace a nadie inmune al phishing; nada lo hace. Pero reduce el radio de la explosión, de modo que una credencial prestada ya no está a un paso de las llaves del reino.

La imagen perdurable del EP11 es la carta falsa que pasó ante el guardián de las llaves maestras de Internet porque vestía el uniforme correcto. La solución no es un guardián más inteligente. Es un sistema donde las propias llaves pueden demostrar que son reales.

## Fuentes y lecturas adicionales

- ICANN — [ICANN Targeted in Spear Phishing Attack | Enhanced Security Measures Implemented](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en) (fuente primaria, incluida la actualización de 2017)
- The Register — [ICANN HACKED: Intruders poke around global DNS innards](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044)
- Help Net Security — [ICANN systems breached via spear-phishing emails](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/)
- Computerworld — [ICANN data compromised in spearphishing attack](https://www.computerworld.com/article/1487605/icann-data-compromised-in-spearphishing-attack.html)
- WeLiveSecurity (ESET) — [ICANN computers compromised by hackers](https://www.welivesecurity.com/2014/12/18/icann-computers-compromised-hackers/)
- Associations Now — [ICANN Systems Infiltrated in "Spear Phishing" Attack](https://associationsnow.com/2014/12/icann-systems-infiltrated-spear-phishing-attack/)
- Slate — [ICANN Got Hacked](https://slate.com/technology/2014/12/icann-hacked-in-spear-phishing-campaign.html)
- Domain Incite — [Hacked ICANN data for sale on black market](http://domainincite.com/21562-hacked-icann-data-for-sale-on-black-market)
- Slashdot — [Hackers Compromise ICANN, Access Zone File Data System](https://tech.slashdot.org/story/14/12/18/1540233/hackers-compromise-icann-access-zone-file-data-system)
- CyberScoop — [Hacked ICANN data still sells for hundreds of dollars years after breach](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/)
- DomainGang — [ICANN alerts users of CZDS & ICANN Wiki about security breach](https://domaingang.com/domain-news/icann-alerts-users-czds-icann-wiki-security-breach/)
