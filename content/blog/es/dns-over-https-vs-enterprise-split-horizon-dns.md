---
title: 'DNS sobre HTTPS vs. DNS Empresarial de Horizonte Dividido: Un Punto Muerto que no se Resolverá Solo'
date: '2026-05-04'
language: es
tags: ['dns', 'doh', 'enterprise', 'security', 'networking']
authors: ['namefiteam']
draft: false
description: 'DNS sobre HTTPS (DoH) protege la privacidad del usuario encriptando las consultas DNS dentro de HTTPS. El DNS empresarial de horizonte dividido depende de que la red pueda ver esas consultas. La colisión entre ambos está redefiniendo cómo las redes corporativas, navegadores y sistemas operativos manejan la resolución de nombres.'
ogImage: ../../assets/dns-over-https-vs-enterprise-split-horizon-dns-og.jpg
keywords: ['dns sobre https', 'doh', 'dns de horizonte dividido', 'dns empresarial', 'dot', 'dns cifrado', 'dns interno', 'resolución de nombres', 'namefi']
relatedArticles:
  - /es/blog/what-are-tokenized-domains/
  - /es/blog/the-myetherwallet-bgp-dns-attack/
  - /es/blog/the-dnspionage-campaign/
  - /es/blog/the-godaddy-multi-year-breach/
  - /es/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/name-change-game-change/
relatedGlossary:
  - /es/glossary/dns/
  - /es/glossary/registrar/
  - /es/glossary/icann/
  - /es/glossary/tld/
  - /es/glossary/web3/
---

Durante la mayor parte de la historia de Internet, las consultas [DNS](/es/glossary/dns/) viajaron en texto plano a través del puerto 53. Cualquiera en la ruta de la red podía leerlas, registrarlas y modificarlas. Ese era un problema de privacidad que el IETF finalmente abordó con dos alternativas encriptadas (cifradas): [DNS sobre TLS (DoT, RFC 7858)](https://datatracker.ietf.org/doc/html/rfc7858) en 2016 y [DNS sobre HTTPS (DoH, RFC 8484)](https://datatracker.ietf.org/doc/html/rfc8484) en 2018.

DoH en particular cambió las reglas del juego, porque oculta el DNS *dentro* de un flujo HTTPS normal. Para un observador de la red, una consulta DoH se ve idéntica a cualquier otra conexión TLS a un servidor de contenido. Esto es excelente para los usuarios que navegan en una red hostil de una cafetería. Pero es mucho menos ideal para un equipo de TI corporativo que depende de ver —y dirigir— cada consulta DNS que cruza el perímetro.

Este es el punto muerto. Ambas partes tienen requisitos legítimos y bien articulados. Los organismos de normalización, los proveedores de navegadores y los creadores de sistemas operativos han pasado la mayor parte de una década intentando que ambos funcionen a la vez, y el resultado es una serie de compromisos incómodos que cualquiera que administre una red empresarial en 2026 necesita entender.

## Qué hace realmente DoH

Un cliente DoH envía consultas DNS como solicitudes HTTP POST o GET, normalmente a `https://dns.google/dns-query`, `https://cloudflare-dns.com/dns-query`, u otro resolutor público. La respuesta regresa como un cuerpo de respuesta HTTPS normal. Hay tres propiedades importantes:

- **Cifrado en tránsito.** Los observadores de la red no pueden leer el nombre de la consulta ni la respuesta.
- **Servidor autenticado.** El cliente verifica el certificado TLS del resolutor, por lo que un ataque de intermediario (man-in-the-middle) no puede suplantarlo.
- **Indistinguible del tráfico web.** Puerto 443, TLS 1.3, patrones SNI normales. No hay tráfico con "forma de DNS" que se pueda filtrar.

La tercera propiedad es la que define el conflicto. DoT también cifra las consultas, pero lo hace en un puerto *dedicado* (853), que una red puede bloquear o redirigir fácilmente. DoH no se puede bloquear selectivamente sin bloquear también la navegación web ordinaria.

## Qué hace realmente el DNS empresarial de horizonte dividido

La mayoría de las grandes organizaciones operan con **DNS de horizonte dividido** (split-horizon DNS). El mismo nombre (`vpn.example.corp`, `git.example.com`, `intranet.example.com`) se resuelve en direcciones IP diferentes dependiendo de si la consulta proviene del interior o del exterior de la red.

Dentro de la red:
- El resolutor es el DNS interno de la empresa, a menudo integrado con Active Directory.
- `git.example.com` podría resolverse a una dirección privada RFC 1918 como `10.0.4.7`.
- Es posible que las zonas exclusivas para uso interno (`example.corp`, `example.internal`) ni siquiera existan en la Internet pública.
- Las herramientas de seguridad y DLP (Prevención de Pérdida de Datos) ven cada consulta y pueden marcar el DNS dirigido a dominios maliciosos conocidos.

Fuera de la red (o en un dispositivo personal con el Wi-Fi de casa):
- La misma consulta va a un resolutor público.
- `git.example.com` se resuelve al balanceador de carga público.
- Los nombres de uso exclusivo interno simplemente no se resuelven.

Esto no es algo exótico. Es el estándar para casi cualquier empresa de más de unos cientos de empleados. Depende de una suposición crítica: **el endpoint usa el resolutor que la red le indica usar**, ya sea a través de DHCP, políticas de red o configuraciones de VPN.

DoH rompe esa suposición. Si el navegador incluye su propio resolutor, o el sistema operativo omite el resolutor del sistema, el endpoint deja de consultar por completo el DNS interno. Los nombres de host internos dejan de resolverse. Las herramientas de seguridad dejan de ver las consultas de las que dependen para la detección.

## Cómo los navegadores y sistemas operativos han intentado manejar esto

Los proveedores no han sido ajenos al problema. Los compromisos que existen hoy en día están en capas y son un tanto improvisados (*ad hoc*).

### El modelo de "actualización automática" de Chrome

La implementación de DoH de Chrome solo actualiza el resolutor del sistema a DoH si dicho resolutor se encuentra en la lista de permitidos de proveedores compatibles con DoH de Chrome (Google, Cloudflare, Quad9, etc.). Si el sistema está configurado para usar un resolutor corporativo interno que no está en la lista de permitidos, Chrome no lo modifica. Las políticas empresariales también pueden desactivar DoH por completo mediante la configuración [`DnsOverHttpsMode` de Chrome](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).

### El modelo TRR (Trusted Recursive Resolver) de Firefox

El enfoque de Firefox ha sido más controvertido. En regiones donde Mozilla ha habilitado DoH por defecto, Firefox utiliza un resolutor predeterminado como Cloudflare en EE. UU., pero también ejecuta heurísticas de red y empresariales antes de habilitar DoH. Una señal importante es el dominio canario (*canary domain*) `use-application-dns.net`: cuando el resolutor local devuelve un resultado negativo, Firefox desactiva el DNS a nivel de aplicación para los usuarios cuyo DoH estaba habilitado por defecto. Mozilla también documenta un matiz importante del horizonte dividido: los nombres exclusivos internos pueden recurrir al DNS ordinario (fallback) si la resolución DoH falla, pero los nombres públicos que se resuelven de forma diferente dentro de la red requieren una política empresarial para desactivar DoH.

### El DNS cifrado de Apple (iOS 14+, macOS Big Sur+)

Apple permite que las aplicaciones y los perfiles de configuración opten por habilitar DoH o DoT para todo el sistema, pero respeta las políticas MDM que exigen un resolutor específico. Los dispositivos gestionados por la empresa se comportan correctamente de forma predeterminada (*out of the box*).

### DoH nativo de Windows

Desde Windows 11, y en Windows Server 2022 y posteriores, el propio sistema operativo puede usar DoH para el resolutor del sistema. Las Políticas de Grupo (Group Policy) controlan si DoH está permitido, es obligatorio o está prohibido, y Windows solo habilita DoH en los servidores DNS configurados que se sabe que lo soportan. Podría decirse que este es el modelo más limpio: el equipo de seguridad elige la política y el sistema operativo la aplica.

El patrón es claro: **un DoH que reside en una sola aplicación (el navegador) es difícil de controlar para la red; un DoH que reside en el resolutor a nivel de sistema operativo se puede controlar mediante canales normales de MDM**. El IETF y los proveedores de sistemas operativos han coincidido, en su mayor parte, en que la política debe recaer en la capa del sistema operativo.

## Las opciones realistas para una empresa en 2026

Dadas las herramientas anteriores, existen tres estrategias viables y una cuarta que no funcionará.

### Estrategia A: Todo interno, DoH bloqueado

Desplegar políticas que desactiven DoH en cada navegador, bloqueen el puerto 443 hacia endpoints públicos conocidos de DoH y fuercen a que todo el DNS pase por el resolutor interno. El propio resolutor interno podría comunicarse mediante DoH con resolutores públicos de nivel superior (*upstream*), pero dentro de la red todo debe pasar a través de él.

Esta es la opción más prescriptiva. Conserva el horizonte dividido a la perfección y proporciona una visibilidad total a las herramientas de seguridad. El costo es tener que mantener listas de bloqueo para los nuevos endpoints de DoH, y cualquier aplicación que el usuario instale y que gestione su propio DoH (algunos clientes de chat, algunas VPN) podría funcionar mal.

### Estrategia B: DoH Interno

Levantar un servidor DoH interno (Cloudflared, AdGuard o un servidor DNS de Windows con DoH habilitado), configurar los endpoints para que lo utilicen y ejecutar el horizonte dividido en el servidor DoH interno. Los endpoints obtienen DNS cifrado sin que la red pierda visibilidad.

Esta es la opción más limpia y hacia la cual se dirigen la mayoría de las grandes empresas. Conserva el beneficio de la privacidad (las consultas se cifran en la LAN) manteniendo a la vez el beneficio de la seguridad (el resolutor interno todavía ve y puede filtrar cada consulta). Microsoft, Google y Apple soportan la configuración a nivel del sistema operativo para este escenario.

### Estrategia C: Dominio canario / señal de red

Publicar el dominio canario de Mozilla. Desplegar las políticas relevantes de Chrome y Edge. Confiar en que los navegadores detecten que están en una red gestionada y deleguen la tarea al resolutor del sistema. Esta es la opción más ligera y es suficiente para muchas organizaciones pequeñas y medianas.

### Estrategia D (no funciona): "Simplemente ignoraremos DoH"

Pretender que el conflicto no existe, dejar los valores predeterminados en su lugar y asumir que todo el DNS todavía fluye a través del resolutor corporativo. Este es el estado de situación más común y produce fallos predecibles: desarrolladores reportando que las URLs exclusivas para uso interno funcionan en Edge pero no en Firefox, equipos de seguridad que observan vacíos en los registros DNS y errores intermitentes de VPN-DNS que tardan horas en ser diagnosticados. El problema no desaparece. Simplemente se vuelve más difícil rastrear su origen.

## Las concesiones de DoH van más allá de la privacidad

Un efecto más sutil de DoH es la centralización de los resolutores. Cuando un navegador o sistema operativo se configura para utilizar un resolutor DoH público, una mayor parte del flujo de DNS de ese usuario puede dirigirse a un único operador de resolución. El modo automático de Chrome está diseñado explícitamente para preservar el proveedor de DNS existente del usuario siempre que sea posible, y el despliegue predeterminado de Firefox depende de la región y de heurísticas, por lo que esto no afecta literalmente a "cada consulta" en todos los despliegues. Pero el compromiso arquitectónico (*trade-off*) permanece: el DNS cifrado puede trasladar la confianza de la red local o ISP hacia un conjunto más pequeño de operadores de resolutores seleccionados.

Que este intercambio sea aceptable o no depende del modelo de amenazas. Para un usuario en una red hostil de una cafetería, centralizar la confianza en Cloudflare es una clara mejora en comparación con confiar en la red de la cafetería. Para una empresa que ya tenía una relación contractual con su ISP, puede suponer un retroceso. La [EFF ha estado escribiendo sobre esta contrapartida](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet) desde los primeros despliegues de DoH.

La respuesta más limpia es la misma que la Estrategia B mencionada anteriormente: administrar tu propio resolutor DoH, para que el DNS cifrado no requiera confiar a un tercero la totalidad del flujo de consultas.

## Qué significa esto para los propietarios de dominios

Si administras un dominio que es consumido por empresas (una aplicación SaaS, una herramienta para desarrolladores, una API), los datos relevantes son:

- Una parte de tus usuarios te resolverá a través de un endpoint DoH público, especialmente en dispositivos no gestionados o navegadores configurados explícitamente. Las cadenas CNAME, delegaciones de subdominios y cualquier truco DNS inteligente que apliques para personalización deben funcionar igual cuando se resuelven desde un resolutor público arbitrario que desde uno interno de un cliente.
- La evasión de la censura basada en DNS es un caso de uso real para DoH. Si tu dominio es bloqueado por el filtro DNS de un gobierno (como ha ocurrido con varios dominios de VPN y mensajería cifrada), los usuarios accederán a ti a través de DoH desde un resolutor público. La mecánica es la misma; lo que cambia son los riesgos políticos.
- El horizonte dividido interno nunca debería resolver un nombre público hacia algo que *solo tenga sentido internamente*, de una forma que pudiera fallar si un usuario consulta accidentalmente a través de DoH. El fallo clásico es un `app.example.com` exclusivamente interno que devuelve una IP privada que ningún usuario de DoH puede alcanzar; luego, un empleado remoto en un hotel encuentra inalcanzable el mismo nombre de host y reporta un error. Usa siempre una zona exclusiva para uso interno claramente separada (`app.example.internal`).

## Cómo encaja Namefi en esto

Namefi trata al DNS como el plano de control orientado al público: el lugar donde los nombres globales se encuentran con las políticas locales. Nuestros flujos de trabajo de DNS asumen que las consultas pueden provenir de cualquier resolutor, incluidos los endpoints DoH que no podemos enumerar, y los nombres que publicamos funcionan de manera consistente independientemente de ello. Para los clientes que operan con horizonte dividido internamente, nosotros nos situamos en el lado público: la respuesta autoritativa para `example.com` es la que proporcionamos, y lo que el resolutor interno sobrescribe para los usuarios internos es asunto de ellos y de su política de endpoints.

El punto de fondo: el DNS cifrado ha llegado para quedarse, y también lo ha hecho la visibilidad empresarial. La forma de reconciliar ambos no es luchar contra los estándares, sino trasladar el punto de aplicación de políticas de la red al sistema operativo. Los organismos de estandarización, Microsoft, Apple, Google y Mozilla han convergido en esa respuesta. El trabajo que queda es, en su mayor parte, operativo.

## Fuentes y lecturas recomendadas

- IETF — [DNS over HTTPS, RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) y [DNS over TLS, RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858).
- Chrome Enterprise — [Controles de políticas de DoH](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).
- Mozilla — [Programa Trusted Recursive Resolver](https://wiki.mozilla.org/Trusted_Recursive_Resolver), [comportamiento del dominio canario](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).), y [guía de contingencia de horizonte dividido](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.).
- Chromium — [Modelo de actualización automática a DoH del mismo proveedor en Chrome](https://www.chromium.org/developers/dns-over-https/#:~:text=Chrome's%20auto%2Dupgrade%20approach%20does%20not%20change%20the%20DNS%20provider).
- Microsoft — [Configuración de DNS sobre HTTPS en Windows](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support#:~:text=Allow%20DoH.%20Queries%20will%20be%20performed%20using%20DoH%20if%20the%20specified%20DNS%20servers%20support%20the%20protocol.).
- EFF — [El DNS cifrado podría ayudar a cerrar una de las mayores brechas de privacidad de Internet](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet).