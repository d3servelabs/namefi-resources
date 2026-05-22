---
title: 'DNS sobre HTTPS vs. DNS Split-Horizon empresarial: Un punto muerto que no se resolverá por sí solo'
date: '2026-05-04'
language: es
tags: ['dns', 'doh', 'enterprise', 'security', 'networking']
authors: ['namefiteam']
draft: false
description: 'El DNS sobre HTTPS (DoH) protege la privacidad del usuario al cifrar las consultas DNS dentro de HTTPS. El DNS split-horizon empresarial depende de que la red pueda ver esas consultas. La colisión entre ambos está reconfigurando la forma en que las redes corporativas, los navegadores y los sistemas operativos gestionan la resolución de nombres.'
ogImage: ../../assets/dns-over-https-vs-enterprise-split-horizon-dns-og.jpg
keywords: ['dns sobre https', 'doh', 'dns split horizon', 'dns empresarial', 'dot', 'dns cifrado', 'dns interno', 'resolución de nombres', 'namefi']
---

Durante la mayor parte de la historia de Internet, las consultas DNS han viajado en texto plano a través del puerto 53. Cualquiera en la ruta de la red podía leerlas, registrarlas y modificarlas. Este era un problema de privacidad que el IETF finalmente abordó con dos alternativas cifradas: [DNS sobre TLS (DoT, RFC 7858)](https://datatracker.ietf.org/doc/html/rfc7858) en 2016 y [DNS sobre HTTPS (DoH, RFC 8484)](https://datatracker.ietf.org/doc/html/rfc8484) en 2018.

En particular, DoH cambió las reglas del juego, ya que oculta el DNS *dentro* de un flujo HTTPS normal. Para un observador de la red, una consulta DoH parece idéntica a cualquier otra conexión TLS dirigida a un servidor de contenido. Esto es excelente para los usuarios que navegan en una red hostil de una cafetería. Pero no lo es tanto para un equipo de TI corporativo que depende de ver —y dirigir— cada consulta DNS que cruza el perímetro.

Este es el punto muerto. Ambas partes tienen requisitos legítimos y bien articulados. Los organismos de estandarización y los proveedores de navegadores y sistemas operativos han pasado la mayor parte de una década intentando que ambos funcionen al mismo tiempo, y el resultado es un conjunto de compromisos frágiles que cualquier persona que administre una red empresarial en 2026 necesita comprender.

## Qué hace realmente DoH

Un cliente DoH envía consultas DNS como solicitudes POST o GET de HTTPS, normalmente a `https://dns.google/dns-query`, `https://cloudflare-dns.com/dns-query` u otro resolutor público. La respuesta vuelve como el cuerpo de una respuesta HTTPS normal. Hay tres propiedades que importan:

- **Cifrado en tránsito.** Los observadores de la red no pueden leer el nombre de la consulta ni la respuesta.
- **Servidor autenticado.** El cliente verifica el certificado TLS del resolutor, por lo que un ataque de intermediario (man-in-the-middle) no puede suplantarlo.
- **Indistinguible del tráfico web.** Puerto 443, TLS 1.3, patrones SNI normales. No hay tráfico con "forma de DNS" que se pueda filtrar.

La tercera propiedad es la que define el conflicto. DoT también cifra las consultas, pero lo hace en un puerto *dedicado* (853), que una red puede bloquear o redirigir fácilmente. DoH no se puede bloquear de forma selectiva sin bloquear también la navegación web ordinaria.

## Qué hace realmente el DNS split-horizon empresarial

La mayoría de las grandes organizaciones utilizan **DNS split-horizon** (horizonte dividido). El mismo nombre (`vpn.example.corp`, `git.example.com`, `intranet.example.com`) se resuelve en diferentes direcciones IP dependiendo de si la consulta proviene del interior o del exterior de la red.

Dentro de la red:
- El resolutor es el DNS interno de la empresa, a menudo integrado con Active Directory.
- `git.example.com` podría resolverse a una dirección privada RFC 1918 como `10.0.4.7`.
- Es posible que las zonas exclusivamente internas (`example.corp`, `example.internal`) no existan en absoluto en la Internet pública.
- Las herramientas de seguridad y DLP ven cada consulta y pueden marcar el DNS dirigido a dominios maliciosos conocidos.

Fuera de la red (o en un dispositivo personal con Wi-Fi doméstico):
- La misma consulta va a un resolutor público.
- `git.example.com` se resuelve en el balanceador de carga público.
- Los nombres exclusivamente internos simplemente no se resuelven.

Esto no es nada exótico. Es la configuración predeterminada para casi todas las empresas con más de unos pocos cientos de empleados. Depende de una suposición crítica: **el endpoint utiliza el resolutor que la red le indica usar**, a través de DHCP, políticas de red (push policy) o configuración de VPN.

DoH rompe esa suposición. Si el navegador incluye su propio resolutor, o si el sistema operativo omite el resolutor del sistema, el endpoint deja de consultar el DNS interno por completo. Los nombres de host internos dejan de resolverse. Las herramientas de seguridad dejan de ver las consultas de las que dependen para la detección.

## Cómo han intentado gestionar esto los navegadores y sistemas operativos

Los proveedores no han sido ciegos ante este problema. Los compromisos que existen hoy en día están estructurados en capas y son un tanto *ad hoc*.

### El modelo de "actualización automática" de Chrome

La implementación de DoH de Chrome solo actualiza el resolutor del sistema a DoH si este se encuentra en la lista de proveedores permitidos por Chrome con capacidad para DoH (Google, Cloudflare, Quad9, etc.). Si el sistema está configurado para utilizar un resolutor corporativo interno que no está en la lista de permitidos, Chrome lo deja intacto. Las políticas empresariales también pueden desactivar DoH por completo mediante la configuración [`DnsOverHttpsMode` de Chrome](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).

### El modelo TRR (Resolutor Recursivo de Confianza) de Firefox

El enfoque de Firefox ha sido más controvertido. En las regiones donde Mozilla ha habilitado DoH por defecto, Firefox utiliza un resolutor predeterminado como Cloudflare en los EE. UU., pero también ejecuta heurísticas empresariales y de red antes de activar DoH. Una señal importante es el dominio canario (canary domain) `use-application-dns.net`: cuando el resolutor local devuelve un resultado negativo, Firefox desactiva el DNS a nivel de aplicación para los usuarios cuyo DoH estaba habilitado por defecto. Mozilla también documenta un matiz importante sobre el split-horizon: los nombres exclusivamente internos pueden recurrir al DNS ordinario si falla la resolución de DoH, pero los nombres públicos que se resuelven de forma diferente dentro de la red requieren una política empresarial para desactivar DoH.

### El DNS cifrado de Apple (iOS 14+, macOS Big Sur+)

Apple permite que las aplicaciones y los perfiles de configuración opten por habilitar DoH o DoT para todo el sistema, pero respeta las políticas de MDM que exigen un resolutor específico. Los dispositivos administrados por empresas se comportan correctamente desde el primer momento.

### DoH nativo de Windows

Desde Windows 11, y en Windows Server 2022 en adelante, el propio sistema operativo puede usar DoH para el resolutor del sistema. Las Políticas de Grupo (Group Policy) controlan si DoH está permitido, es obligatorio o está prohibido, y Windows solo habilita DoH con aquellos servidores DNS configurados que se sabe que lo soportan. Posiblemente, este sea el modelo más limpio: el equipo de seguridad elige la política y el sistema operativo la aplica.

El patrón es claro: **el DoH que vive en una sola aplicación (el navegador) es difícil de controlar por la red; el DoH que vive en el resolutor a nivel del sistema operativo es controlable a través de los canales MDM normales**. El IETF y los proveedores de sistemas operativos han acordado en gran medida que las políticas pertenecen a la capa del sistema operativo.

## Las opciones realistas para una empresa en 2026

Dadas las herramientas anteriores, existen tres estrategias viables y una cuarta que no funcionará.

### Estrategia A: Todo interno, DoH bloqueado

Aplicar una política que desactive DoH en todos los navegadores, bloquee el puerto 443 hacia endpoints públicos conocidos de DoH y fuerce que todo el DNS pase por el resolutor interno. El resolutor interno en sí puede usar DoH para comunicarse con los resolutores públicos de nivel superior (upstream), pero dentro de la red todo pasa a través de él.

Esta es la opción más prescriptiva. Conserva el split-horizon a la perfección y proporciona visibilidad total a las herramientas de seguridad. El costo es que hay que mantener listas de bloqueo de los nuevos endpoints de DoH, y cualquier aplicación que instale el usuario y que realice su propio DoH (algunos clientes de chat, algunas VPN) puede funcionar incorrectamente.

### Estrategia B: DoH interno

Levantar un servidor DoH interno (Cloudflared, AdGuard o un servidor DNS de Windows con DoH habilitado), configurar los endpoints para que lo utilicen y ejecutar el split-horizon en el servidor DoH interno. Los endpoints obtienen DNS cifrado sin que la red pierda visibilidad.

Esta es la opción más limpia y hacia la que se dirigen la mayoría de las grandes empresas. Conserva el beneficio de la privacidad (las consultas se cifran en la LAN) al mismo tiempo que mantiene el beneficio de la seguridad (el resolutor interno sigue viendo y puede filtrar todas las consultas). Microsoft, Google y Apple soportan la configuración a nivel de sistema operativo para este escenario.

### Estrategia C: Dominio canario / señal de red

Publicar el dominio canario de Mozilla. Aplicar las políticas relevantes de Chrome y Edge. Confiar en que los navegadores detecten que se encuentran en una red administrada y deleguen la tarea al resolutor del sistema. Esta es la opción menos invasiva y resulta suficiente para muchas organizaciones pequeñas y medianas.

### Estrategia D (no funciona): "Simplemente ignoraremos DoH"

Fingir que el conflicto no existe, dejar los valores predeterminados y asumir que todo el DNS sigue fluyendo a través del resolutor corporativo. Este es el estado de cosas más común y produce fallos predecibles: desarrolladores que informan que las URL exclusivamente internas funcionan en Edge pero no en Firefox, equipos de seguridad que ven lagunas en los registros de DNS y errores intermitentes de VPN-DNS que llevan horas diagnosticar. El problema no desaparece. Solo se vuelve más difícil atribuirle una causa.

## La privacidad no es lo único a lo que se renuncia con DoH

Un efecto más sutil de DoH es la centralización de los resolutores. Cuando un navegador o sistema operativo está configurado para usar un resolutor DoH público, una mayor parte del flujo de DNS de ese usuario podría dirigirse a un único operador de resolutor. El modo automático de Chrome está diseñado explícitamente para preservar el proveedor de DNS existente del usuario siempre que sea posible, y el despliegue predeterminado de Firefox depende de la región y de la heurística, por lo que esto no afecta literalmente a "cada consulta" en todas las implementaciones. Pero la concesión arquitectónica se mantiene: el DNS cifrado puede trasladar la confianza de la red local o el ISP hacia un conjunto más pequeño de operadores de resolutores seleccionados.

Si este intercambio es aceptable dependerá del modelo de amenazas. Para un usuario en una red hostil de una cafetería, centralizar la confianza en Cloudflare es una clara mejora con respecto a confiar en la cafetería. Para una empresa que ya tenía una relación contractual con su ISP, puede suponer un retroceso. La [EFF ha estado escribiendo sobre esta concesión](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet) desde los primeros despliegues de DoH.

La respuesta más limpia es la misma que la Estrategia B anterior: ejecutar tu propio resolutor DoH para que el DNS cifrado no requiera confiar a un tercero todo el flujo de consultas.

## Lo que esto significa para los propietarios de dominios

Si administras un dominio que es consumido por empresas —una aplicación SaaS, una herramienta para desarrolladores, una API— los datos relevantes son:

- Una fracción de tus usuarios te resolverá a través de un endpoint público de DoH, especialmente en dispositivos no administrados o en navegadores configurados explícitamente. Las cadenas de CNAME, las delegaciones de subdominios y cualquier truco de DNS ingenioso que uses para la personalización deben funcionar igual de bien cuando se resuelven desde un resolutor público arbitrario que desde el resolutor interno de un cliente.
- La elusión de la censura basada en DNS es un caso de uso real de DoH. Si tu dominio está bloqueado por el filtro DNS de un gobierno (como lo han estado varios dominios de mensajería cifrada y VPN), los usuarios accederán a ti a través de DoH desde un resolutor público. La mecánica es la misma; lo que está en juego políticamente es distinto.
- El split-horizon interno nunca debe resolver un nombre de cara al público hacia algo que *solo tenga sentido internamente*, de un modo que se corrompa si un usuario hace una consulta accidentalmente por DoH. El fallo clásico es un `app.example.com` exclusivamente interno que devuelve una IP privada a la que ningún usuario de DoH puede acceder; en ese caso, un empleado en remoto desde un hotel descubrirá que el mismo nombre de host es inaccesible y registrará un error. Utiliza una zona exclusivamente interna claramente separada (`app.example.internal`).

## Cómo encaja Namefi en todo esto

Namefi trata al DNS como un plano de control orientado al público: el lugar donde los nombres globales se encuentran con las políticas locales. Nuestros flujos de trabajo de DNS asumen que las consultas pueden provenir de cualquier resolutor, incluidos los endpoints de DoH que no podemos enumerar, y los nombres que publicamos funcionan de manera coherente en cualquier caso. Para los clientes que ejecutan split-horizon de forma interna, nosotros nos situamos en el lado público: la respuesta autoritativa para `example.com` es la que servimos nosotros, y lo que el resolutor interno anule para los usuarios internos es un asunto entre ellos y la política de su endpoint.

El punto de fondo es que el DNS cifrado ha llegado para quedarse, y lo mismo ocurre con la visibilidad empresarial. La forma de reconciliar ambos conceptos no es luchar contra los estándares, sino trasladar el punto de aplicación de políticas de la red al sistema operativo. Los organismos de estandarización, Microsoft, Apple, Google y Mozilla han convergido en esa respuesta. El trabajo restante es principalmente operativo.

## Fuentes y lecturas complementarias

- IETF — [DNS sobre HTTPS, RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) y [DNS sobre TLS, RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858).
- Chrome Enterprise — [Controles de políticas de DoH](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).
- Mozilla — [Programa de Resolutor Recursivo de Confianza (TRR)](https://wiki.mozilla.org/Trusted_Recursive_Resolver), [comportamiento del dominio canario](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).), y [guía de contingencia para split-horizon](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.).
- Chromium — [Modelo de actualización automática a DoH con el mismo proveedor en Chrome](https://www.chromium.org/developers/dns-over-https/#:~:text=Chrome's%20auto%2Dupgrade%20approach%20does%20not%20change%20the%20DNS%20provider).
- Microsoft — [Configurar DNS sobre HTTPS en Windows](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support#:~:text=Allow%20DoH.%20Queries%20will%20be%20performed%20using%20DoH%20if%20the%20specified%20DNS%20servers%20support%20the%20protocol.).
- EFF — [El DNS cifrado podría ayudar a cerrar una de las mayores brechas de privacidad de Internet](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet).