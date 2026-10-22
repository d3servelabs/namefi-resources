---
title: "Dominios caducados y el ciclo de caída, explicado"
date: '2026-06-21'
language: es
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 3
format: explainer
description: "Distingue los plazos del registrador y la eliminación del registro: rescate, eliminación pendiente, subastas y captura sin una cuenta atrás universal."
ogImage: ../../assets/expired-domains-and-the-drop-cycle-og.jpg
keywords: ['dominios caducados', 'ciclo de caída de dominios', 'ciclo de vida de un dominio', 'período de gracia de redención', 'eliminación pendiente', 'captura de caída de dominios', 'nombres de dominio caducados', 'cómo caducan los dominios', 'dominios caídos', 'sniping de dominios', 'comprar dominios caducados', 'período de redención de dominios', 'cuándo caen los dominios', 'reserva anticipada de dominios', 'encontrar dominios para revender']
relatedArticles:
  - /es/blog/domain-backorders-and-drop-catching/
  - /es/blog/domain-flipping/
  - /es/blog/how-to-win-domain-auctions/
  - /es/blog/hand-registering-domains-to-flip/
  - /es/blog/when-to-drop-a-domain/
relatedTopics:
  - /es/topics/domain-investing/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-flipping-skills/
  - /es/series/name-change-game-change/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/icann/
  - /es/glossary/tld/
  - /es/glossary/dns/
  - /es/glossary/registry/
---

Un dominio vencido no queda disponible de inmediato. El registrador gestiona los plazos del cliente y las posibles subastas. El registro gestiona la eliminación y la liberación. Este artículo usa registros ordinarios de `.com` como ejemplo. Los dominios territoriales y patrocinados pueden seguir otras reglas.

A quienes revenden dominios les interesa este rincón del mercado porque los nombres caídos no son pizarras en blanco. Un nombre solo llega a la caída porque alguien lo registró, lo usó y lo abandonó, así que puede arrastrar antigüedad, enlaces entrantes, tráfico residual o una cadena que estaba ocupada el día en que, de otro modo, la habrías registrado manualmente. El ciclo es un flujo de reciclaje para nombres que ya demostraron que alguien los quería — un perfil de riesgo distinto al de una cadena recién creada, y uno de los canales de suministro que cartografiamos en [cómo encontrar dominios para revender](/es/blog/how-to-find-domains-to-flip/). Este explicativo recorre el ciclo de vida etapa por etapa, y luego cubre dónde aparecen los nombres caídos y cómo se posicionan quienes revenden para atraparlos.

## Etapa uno: la ventana de registro activo y renovación

El registro puede renovar automáticamente un `.com` aunque el cliente no haya pagado. Los 45 días de gracia regulan la facturación entre registro y registrador. El registrador puede recibir el crédito correspondiente si elimina el registro durante ese plazo. El cliente no obtiene por ello 45 días garantizados para renovar. Una fecha ampliada tampoco demuestra el pago del cliente. Consulta el [apéndice 7, sección 3.1.3 del contrato vigente](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm). La [política vigente de ICANN, sección 2.2](https://www.icann.org/resources/pages/errp-2024-02-21-en) permite eliminar registros vencidos conforme a las reglas aplicables.

## Etapa dos: el período de gracia de redención

![Ilustración editorial de una etiqueta de nombre de dominio suspendida dentro de un reloj de arena, a su vez dentro de un dial de cuenta regresiva, con una mano ofreciendo una moneda para pagar una cuota de recuperación antes de que se agote el tiempo](../../assets/expired-domains-and-the-drop-cycle-01-redemption.jpg)

La eliminación de un `.com` ordinario fuera del período de gracia inicial inicia `redemptionPeriod`: 30 días naturales para solicitar la restauración. El vencimiento por sí solo no inicia ese período. El titular debe contactar con el registrador que eliminó el registro. El registro desactiva la resolución DNS. ICANN exige 30 días a los gTLD no patrocinados, con una excepción para eliminaciones durante la gracia inicial. No existe una tarifa universal de 100 dólares. Solicita el coste total de restauración y renovación. Consulta las [secciones 3 y 4 de la política vigente](https://www.icann.org/resources/pages/errp-2024-02-21-en).

## Etapa tres: eliminación pendiente

Si nadie restaura un `.com` ordinario durante el rescate, el registro aplica el período final de eliminación pendiente durante cinco días naturales. El registro rechaza las modificaciones y después purga el registro. El [apéndice 7, sección 3.3.2](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm) establece ese plazo.

Comprueba la combinación completa de estados. `pendingDelete` puede acompañar a `redemptionPeriod` o `pendingRestore`. En esos casos prevalece la descripción del rescate o la restauración. La [guía de ICANN](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en) explica la diferencia. El estado público no determina una hora exacta de liberación. La suma 45 + 30 + 5 tampoco garantiza una liberación 80 días después del vencimiento.

## Etapa cuatro: la liberación, y la carrera por atraparla

![Ilustración editorial de varios servidores robot automatizados corriendo a través de una puerta abierta para atrapar una única etiqueta de dominio que cae en el instante en que se libera](../../assets/expired-domains-and-the-drop-cycle-02-release-scramble.jpg)

Tras la purga, el registro permite nuevas inscripciones conforme a sus reglas. Una subasta de dominios vencidos puede vender el registro antes de la eliminación. El nombre puede cambiar de titular sin quedar disponible públicamente. El calendario de una subasta no es el calendario de eliminación del registro.

Una reserva solicita un intento de adquisición, sin garantizar el resultado. Varios servicios no pueden completar cada uno la misma nueva inscripción. El proveedor que obtiene el nombre puede celebrar una subasta si recibió varias reservas. Por ejemplo, [Dynadot](https://www.dynadot.com/help/question/backorder-auction) celebra una subasta pública tras una captura exitosa con varias solicitudes. Las subastas privadas no son universales.

## Dónde aparecen los nombres caídos

![Ilustración editorial de un centro de búsqueda con una lupa que se ramifica hacia cuatro canales — una lista de caídas, un ticket de reserva anticipada, un mazo de subasta y un escaparate de mercado secundario — cada uno portando una etiqueta de dominio](../../assets/expired-domains-and-the-drop-cycle-03-where-surface.jpg)

Conocer el ciclo solo sirve si sabes dónde vigilarlo. Los nombres caídos y a punto de caer aparecen en unos pocos lugares predecibles, y una rutina de adquisición que funcione suele nutrirse de varios a la vez:

- **Listas de caídas y bases de datos de dominios caducados.** Listas públicas y de pago publican los nombres que entran cada día en eliminación pendiente, a menudo filtrables por longitud, [TLD](/es/glossary/tld/), palabra clave, antigüedad y métricas de enlaces — la fuente de datos en bruto para una lista de seguimiento de nombres a punto de liberarse.
- **Plataformas de reserva anticipada y captura de caída.** En lugar de vigilar el calendario tú mismo, colocas una reserva anticipada y un servicio compite por el nombre en la liberación en tu nombre. Esta es la vía práctica para cualquier cosa con demanda — consulta [pedidos anticipados de dominios y drop-catching](/es/blog/domain-backorders-and-drop-catching/).
- **Subastas de dominios caducados.** Muchos registradores no dejan que su inventario valioso que está por caducar llegue siquiera a la caída pública; lo encauzan hacia sus propias subastas de caducados durante o después de la ventana de gracia, de modo que el nombre se vende en lugar de liberarse. Eso se solapa con el canal más amplio de [cómo ganar subastas de dominios](/es/blog/how-to-win-domain-auctions/).
- **Mercados secundarios.** Los nombres atrapados por otra persona, o recuperados y vueltos a listar, reaparecen para reventa en el [mercado secundario](/es/glossary/aftermarket/). No es la caída en sí, pero es donde acaba buena parte del inventario posterior a la caída.

La ventaja de quien revende está en emparejar el canal con el nombre — una cadena de baja competencia en una lista de caídas pública es una jugada perfectamente cercana al registro manual, mientras que una palabra única premium exige una reserva anticipada y, probablemente, un presupuesto para subasta. Si tu instinto es registrar cadenas nuevas en lugar de eso, ese es un camino legítimo y distinto, recorrido en [registro manual de dominios para revender](/es/blog/hand-registering-domains-to-flip/).

## Leer el ciclo como quien revende

El titular debe consultar inmediatamente al registrador sobre renovación y restauración. El comprador debe anotar extensión, registrador, estados completos, hora de consulta, canal de subasta y plazo de reserva. La fecha de vencimiento no garantiza una fecha de liberación. Una reventa o transferencia de tokens no elimina la obligación de renovar el registro subyacente.

**La diligencia viaja con el nombre.** Un nombre caído hereda su historia, y no toda historia es buena. Antes de pujar por un nombre antiguo, revisa su uso previo, su rastro de [WHOIS](/es/glossary/whois/) y de titularidad, cualquier bloqueo del [registrador](/es/glossary/registrar/), y si alguna vez alojó algo que lo contamine. Un nombre que antes infringió una marca todavía puede atraer una reclamación [UDRP](/es/glossary/udrp/) estando en tus manos; los retroenlaces existentes pueden ser spam con la misma facilidad con que pueden ser oro. La caída te entrega el activo *y* su carga.

## El ángulo de Namefi

Atrapar un gran nombre caído es solo la mitad del trabajo; la próxima vez que cambie de manos, te topas con la misma fricción que golpea a todo [comercio de dominios](/es/glossary/domain-trading/) de alto valor. El comprador no pagará antes de que el nombre se mueva, el vendedor no lo moverá antes de cobrar, y el traspaso del [código de autorización](/es/glossary/auth-code/) entre registradores deja un hueco nervioso en medio. Ese punto muerto es la razón por la que existe el [depósito en garantía](/es/glossary/escrow/), y se agudiza cuanto más vale un nombre antiguo y rico en enlaces.

## Aviso amistoso (¡léelo!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo es asesoramiento legal, financiero, fiscal, contable, médico ni de ningún otro tipo profesional.** Escribimos estas publicaciones para formarnos a nosotros mismos y como una comodidad para nuestros clientes. La información aquí puede estar desactualizada, ser específica de una región o sencillamente estar equivocada. Nosotros también cometemos errores.
>
> Para cualquier decisión importante, **consulta a un profesional de verdad (¡en serio!)**. O si ese no es tu rollo, pregúntale a un amigo, pregunta en Twitter, pregunta en Reddit, pregúntale a una IA o pregúntale a un vidente. En resumen: **DOYR - Do Your Own Research** (investiga por tu cuenta). Aprendamos y pasémoslo bien.

## Fuentes y lecturas adicionales

Fuentes comprobadas el 22 de octubre de 2026 (UTC). La traducción conserva la fecha original.

- [ICANN / Verisign — Contrato vigente de .com, apéndice 7](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm)
- [ICANN — ERRP 2024](https://www.icann.org/resources/pages/errp-2024-02-21-en)
- [ICANN — EPP](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)
- [Dynadot](https://www.dynadot.com/help/question/backorder-auction)
