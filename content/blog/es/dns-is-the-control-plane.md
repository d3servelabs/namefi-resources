---
title: "Detrás de escena de la caída de AWS del 20 de octubre de 2025"
date: '2025-10-23'
language: es
tags: ['dns', 'aws', 'resilience', 'incident-explainer']
authors: ['namefiteam']
draft: false
description: "Una perspectiva desde las operaciones de registro/DNS sobre el incidente de AWS del 20 de octubre de 2025, cómo funciona realmente el DNS, por qué este fallo se propagó tanto y qué pueden hacer al respecto los equipos de internet resilientes."
keywords: ['dns', 'caída de aws', 'plano de control', 'dynamodb', 'us-east-1', 'caché dns', 'resiliencia en la nube', 'dns multifirma', 'respuesta a incidentes']
---

[![](../../assets/dns-is-the-control-plane.png)](../../assets/dns-is-the-control-plane.png)

El 20 de octubre de 2025, partes de internet tuvieron una mañana difícil. Amazon Web Services (AWS) reportó problemas en su clúster de centros de datos del norte de Virginia (US-EAST-1). Durante varias horas, muchas aplicaciones y sitios populares estuvieron lentos o no disponibles—[Vercel](https://downdetector.com/status/vercel/), [Figma](https://downdetector.in/status/figma/), [Venmo](https://downdetector.in/status/venmo/) y [Snapchat](https://downdetector.com/status/snapchat/), por nombrar algunos. Los medios de comunicación y los servicios de monitoreo registraron millones de reportes de usuarios, e incluso algunos servicios de Amazon tuvieron intermitencias.

Los clientes de Namefi, sin embargo, tuvieron un día tranquilo. Nuestros sistemas siguieron funcionando como de costumbre, no por casualidad, sino porque invertimos fuertemente en la ingeniería y el rigor operativo que hacen que la resolución de DNS sea resiliente a los contratiempos regionales.

Dicho esto, el equipo de ingeniería de Namefi revisa las interrupciones globales como esta y aprende de ellas, como lo hace con todos los incidentes importantes. Esto es lo que se ha aprendido hasta ahora:

*Nota: Al momento de escribir esto, el incidente aún se está desarrollando. Esta publicación puede actualizarse periódicamente. Si ves algún error o corrección necesaria, por favor compártelo con el equipo de desarrollo en [namefi.io](http://namefi.io). Lo apreciamos.*

## Qué salió mal realmente en AWS (sin tecnicismos)

Cada aplicación y sitio web necesita una forma de "buscar" dónde conectarse. Esa libreta de direcciones de internet se llama DNS (abreviatura de Domain Name System o Sistema de Nombres de Dominio). El 20 de octubre, un problema de nomenclatura dentro de AWS impidió que algunas computadoras encontraran un servicio clave de base de datos de AWS por su nombre. Si la libreta de direcciones no puede proporcionar la entrada correcta en el momento adecuado, incluso los sistemas saludables no pueden hablar entre sí.

AWS solucionó el problema inmediato de nomenclatura en un par de horas y luego pasó el resto del día permitiendo que las colas acumuladas se despejaran y facilitando el regreso de los sistemas a la normalidad. A última hora de la tarde (hora del Pacífico), AWS dijo que todo estaba operando normalmente de nuevo, aunque algunos servicios tardaron más en ponerse al día.

## Quiénes se vieron afectados (y qué dice eso sobre el internet actual)

El impacto fue amplio y familiar para los usuarios cotidianos. Aplicaciones de consumo como Snapchat y Reddit, comunicaciones como Zoom y Signal, y plataformas de juegos como Fortnite y Roblox reportaron problemas. Los servicios financieros vieron interrupciones en Coinbase y Robinhood, mientras que en el Reino Unido una serie de servicios públicos—incluyendo HMRC (el portal de impuestos) y bancos bajo el grupo Lloyds/Halifax/Bank of Scotland—experimentaron caídas. Las aplicaciones para clientes de telecomunicaciones de Vodafone y BT también se vieron afectadas, a pesar de que sus redes principales permanecieron disponibles.

Las propias propiedades de Amazon también tuvieron problemas: Amazon.com, Prime Video, Alexa y Ring vieron interrupciones, ilustrando cuán profundamente está entrelazado AWS con los servicios al consumidor de su empresa matriz. Los rastreadores en vivo como Downdetector registraron millones de reportes de problemas de usuarios en todo el mundo, subrayando cuántas aplicaciones de la vida diaria se asientan sobre AWS. Algunos resúmenes también notaron efectos dominó en aplicaciones de entretenimiento (por ejemplo, Apple Music) y aplicaciones móviles de grandes marcas de consumo durante ese lapso.

## Bajo el capó

La cronología de AWS apunta a fallos en la resolución de DNS para la API de DynamoDB en US-EAST-1. El desencadenante subyacente se atribuyó a un subsistema interno de EC2 que monitorea la salud de los balanceadores de carga de red (NLBs); cuando ese subsistema falló, se manifestó externamente como búsquedas de nombres incorrectas hacia el punto final (endpoint) de DynamoDB. AWS mitigó el problema de DNS a las 2:24 AM PDT y declaró todos los servicios normales para las 3:01 PM PDT, mientras las colas acumuladas se drenaban durante la tarde. ([Amazon](https://www.aboutamazon.com/news/aws/aws-service-disruptions-outage-update), [Reuters](https://www.reuters.com/business/retail-consumer/amazons-cloud-unit-reports-outage-several-websites-down-2025-10-20/))

La telemetría de red independiente no notó ninguna anomalía de enrutamiento de internet más amplia (por ejemplo, ningún incidente BGP), lo que se alinea con la conclusión de que la falla residía dentro del plano de control de AWS en lugar de en la internet pública. ([ThousandEyes](https://www.thousandeyes.com/blog/aws-outage-analysis-october-20-2025))

## Algunos comportamientos del DNS explican la "larga cola" después de la solución:

- **Almacenamiento en caché, incluido el caché negativo.** Los resolutores almacenan respuestas por un período llamado TTL (tiempo de vida). También almacenan en caché los fallos, por estándar. Si un resolutor almacenó en caché una respuesta de "no se pudo encontrar" durante el incidente, podría seguir sirviendo ese fallo hasta que el temporizador expirara, incluso después de que AWS corrigiera la fuente. (Estándares: [RFC 2308](https://datatracker.ietf.org/doc/html/rfc2308), actualizado en [RFC 9520](https://www.rfc-editor.org/rfc/rfc9520))
- **Plano de control vs. plano de datos.** Las plataformas en la nube separan la orquestación (plano de control) del servicio en estado estable (plano de datos). Un contratiempo en el plano de control que rompe las búsquedas de nombres puede bloquear rutas de servicio que de otro modo estarían saludables, porque los clientes aún necesitan descubrir los puntos finales por nombre. La propia guía de resiliencia de AWS distingue estos planos y señala la mayor complejidad y tasa de cambio en los sistemas de control. ([AWS whitepaper](https://docs.aws.amazon.com/whitepapers/latest/aws-fault-isolation-boundaries/control-planes-and-data-planes.html))
- **Centralidad regional.** US-EAST-1 aloja componentes de los que dependen muchas funciones globales; esta concentración explica por qué un problema de nomenclatura regional se sintió global en su efecto. (Contexto en reportes generales: [Reuters](https://www.reuters.com/business/retail-consumer/amazons-cloud-unit-reports-outage-several-websites-down-2025-10-20/))

## Qué pueden aprender de esto las empresas de internet más pequeñas

Incidentes como este subrayan una idea simple: la capa de nombres es la capa de seguridad. Las decisiones sobre a dónde se envía a los usuarios, qué centro de datos probar a continuación y cómo dirigir el tráfico durante los problemas pasan por el DNS. Construir esa capa para que sea independiente, redundante y esté lista para el cambio hace que la recuperación sea más rápida y las interrupciones más pequeñas.

## Por qué el DNS es crítico y cómo encaja Namefi

La lección no es que la nube sea frágil; es que la dependencia de una única ruta de nomenclatura y control concentra el riesgo. Los equipos modernos de internet reducen ese riesgo tratando al DNS como la capa de dirección independiente y resiliente para su tráfico y preparando puntos finales alternativos antes de que lleguen los problemas. Con un DNS robusto en su lugar, las aplicaciones conservan la capacidad de redirigir, degradarse con gracia y recuperarse más rápido cuando un proveedor tiene un mal día.

Esta filosofía es la razón por la que existe Namefi. La plataforma de Namefi proporciona resiliencia de dominios y DNS como producto, entrelazando las mejores prácticas, TTLs cuidadosamente diseñados y superficies de comunicación. El resultado es una capa de nomenclatura diseñada para continuar tomando buenas decisiones de enrutamiento cuando las nubes subyacentes se están curando, limitando o poniéndose al día. Los equipos que adoptan Namefi obtienen esta postura desde el primer momento, junto con las herramientas operativas para observarla y ajustarla sin atar esos controles al mismo plano que podría estar experimentando problemas.

Cuando ocurren incidentes como el del 20 de octubre, esa separación es lo que mantiene el mapa intacto.

## Fuentes y lecturas adicionales

- Amazon — Tiempos oficiales del incidente y pasos de recuperación (mitigación a las 2:24 AM PDT; todos los servicios normales a las 3:01 PM PDT; limitación de EC2 durante la recuperación). ([Amazon](https://www.aboutamazon.com/news/aws/aws-service-disruptions-outage-update))
- Reuters — Causa raíz en el subsistema de monitoreo de salud NLB interno de EC2; alcance del impacto; millones de reportes de usuarios; limpieza de trabajos acumulados. ([Reuters](https://www.reuters.com/business/retail-consumer/amazons-cloud-unit-reports-outage-several-websites-down-2025-10-20/))
- ThousandEyes — Telemetría centrada en US-EAST-1, DNS hacia DynamoDB y ausencia de anomalías de enrutamiento más amplias. ([ThousandEyes](https://www.thousandeyes.com/blog/aws-outage-analysis-october-20-2025))
- The Verge / Tom’s Guide — Cronologías públicas, confirmación de que el evento estaba relacionado con DNS/plano de control en lugar de un ciberataque, y ejemplos de plataformas afectadas. ([The Verge](https://www.theverge.com/news/802486/aws-outage-alexa-fortnite-snapchat-offline))
- Documentos IETF / Cloudflare — Comportamiento de almacenamiento en caché negativo de DNS (RFC 2308, RFC 9520) y patrones DNSSEC multifirma para implementaciones autoritativas multiproveedor (RFC 8901, documentos de operador). ([RFC Editor](https://www.rfc-editor.org/rfc/rfc8901), [RFC Editor](https://www.rfc-editor.org/rfc/rfc9520))