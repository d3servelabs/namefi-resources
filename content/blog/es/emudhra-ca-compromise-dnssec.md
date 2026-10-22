---
title: "La exposición de las claves de CA de eMudhra demuestra que la seguridad de los dominios necesita más que HTTPS"
date: '2026-10-22'
language: "es"
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: true
cluster: domain-security
format: explainer
description: "Conozca la exposición de claves de CA de eMudhra, el riesgo de suplantación web y las protecciones de DNSSEC, DANE, CAA y CT."
keywords: ["eMudhra", "emSign", "claves de CA comprometidas", "autoridad de certificación", "CA intermedia", "MITM", "DNSSEC", "DANE", "CAA", "transparencia de certificados", "certificados TLS", "seguridad de dominios"]
relatedArticles:
  - /es/blog/the-fox-it-dns-hijack/
  - /es/blog/the-myetherwallet-bgp-dns-attack/
  - /es/blog/the-curve-finance-dns-hijack/
  - /es/blog/dns-on-tokenized-domains/
  - /es/blog/dnssec-for-domain-owners/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/tokenize-your-com/
relatedGlossary:
  - /es/glossary/certificate-authority/
  - /es/glossary/intermediate-ca/
  - /es/glossary/man-in-the-middle-attack/
  - /es/glossary/dnssec/
  - /es/glossary/dane/
---

Un sitio web puede cifrar una conexión con un impostor. El cifrado por sí solo no establece quién controla el otro extremo.

El incidente de eMudhra hace urgente esa distinción para los titulares de dominios, los fundadores y los equipos de Web3. El 20 de octubre de 2026, Google y Mozilla anunciaron medidas de emergencia ante la exposición de claves de autoridades de certificación intermedias. Una generación de claves débil abrió la posibilidad de falsificar certificados de sitios web. Los clientes que seguían confiando en esas claves afrontaban un riesgo de suplantación. [Google explica el fallo y las medidas de bloqueo](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/).

**Estado comprobado el 22 de octubre de 2026.** La investigación continúa. La exposición confirmada de las claves no demuestra que los atacantes interceptaran tráfico de clientes.

## El incidente expuso facultades de firma por encima de los sitios web individuales

Una [Autoridad de certificación](/es/glossary/certificate-authority/), o CA, emite certificados digitales que vinculan identidades con claves públicas. Para HTTPS, un certificado identifica los nombres de dominio que un servidor puede autenticar. La CA comprueba los requisitos de identidad aplicables antes de firmar el certificado. El navegador comprueba la cadena de certificados y que el servidor demuestre la posesión de la clave privada correspondiente. [RFC 5280 describe el modelo de certificados](https://www.rfc-editor.org/rfc/rfc5280#section-3.2).

Una CA raíz proporciona un ancla de confianza. Una [Autoridad de certificación intermedia](/es/glossary/intermediate-ca/) tiene facultades de firma delegadas por debajo de una raíz. Los certificados de sitios web normalmente dependen de una CA intermedia. Una clave de sitio web comprometida amenaza las identidades de ese certificado. Una clave intermedia comprometida puede amenazar muchos dominios sin relación entre sí, según las restricciones de los certificados y las comprobaciones del cliente.

El [registro del incidente de Mozilla identifica ocho certificados intermedios afectados](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0): seis para TLS y dos para firma de código. Mozilla recuperó de forma independiente las claves privadas débiles. eMudhra marcó los certificados como revocados el 18 de octubre. Esos hechos describen un fallo en la generación de claves, no pruebas de que alguien robara la clave privada de cada cliente.

En su [declaración del 21 de octubre](https://emudhra.com/es/post/certificate-security-incident#:~:text=During%20the%20ceremony), eMudhra atribuyó las claves débiles a un paso de encapsulado y desencapsulado durante su ceremonia de claves del 30 de abril de 2025. eMudhra afirmó que las autoridades intermedias afectadas no habían emitido certificados de entidad final e informó que no tenía pruebas de explotación anteriores a la divulgación. La empresa también afirmó que su investigación de la causa raíz exacta seguía incompleta. Esas declaraciones describen los hallazgos de eMudhra, no una garantía independiente sobre todo el tráfico histórico.

## Las protecciones de los navegadores cambiaron la exposición práctica

Google afirma que Chrome bloqueó las claves afectadas el 17 de octubre mediante una actualización de CRLSet. Google también informa que ningún certificado TLS de las seis autoridades intermedias TLS afectadas apareció en CT antes del bloqueo. Por tanto, los certificados fraudulentos de esas autoridades intermedias no podrían haber funcionado con clientes que aplicaban el requisito de CT pertinente. El aviso de Google incluye a Chrome entre esos clientes.

Mozilla [distribuyó su bloqueo de OneCRL esa misma tarde](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/). Mozilla también publicó actualizaciones de Firefox para configuraciones que podrían no recibir la protección de OneCRL. Una actualización del navegador no demuestra que todas las aplicaciones del mismo dispositivo tengan la misma protección. [Cloudflare advierte específicamente que distintas aplicaciones pueden utilizar distintos verificadores de certificados](https://blog.cloudflare.com/emudhra-certificate-compromise/#:~:text=A%20successful%20browser%20test).

El aviso de Google del 20 de octubre programa la eliminación de **emSign ECC Root CA - G3** entre los consumidores de Chrome Root Store para el 27 de octubre de 2026, hora del Pacífico PDT. Google indica a los operadores de sitios web afectados que migren los certificados a otra jerarquía de confianza. Los operadores deben distinguir un bloqueo de seguridad inmediato de una interrupción posterior del servicio causada por la retirada de confianza en una raíz.

## Un atacante intermediario necesita acceso al tráfico y una identidad aceptada

Un [Ataque de intermediario](/es/glossary/man-in-the-middle-attack/), o MITM, sitúa a un atacante entre las partes que se comunican. Considere un ataque hipotético, no una explotación observada de eMudhra:

1. Un atacante redirige a un visitante mediante respuestas DNS maliciosas u otro método de interceptación de red.
2. El atacante presenta un certificado falsificado para el dominio previsto.
3. Un cliente sin protección acepta el certificado y establece TLS con el atacante.
4. El atacante puede retransmitir tráfico al servicio real mientras lee o modifica datos de la aplicación.

Poseer una clave de CA no redirige el tráfico automáticamente. Un certificado por sí solo tampoco descifra todas las sesiones grabadas previamente. La confidencialidad directa de TLS 1.3 protege las sesiones anteriores frente a una exposición posterior de claves de autenticación a largo plazo, bajo los supuestos establecidos. [RFC 8446 explica la distinción](https://datatracker.ietf.org/doc/html/rfc8446#appendix-E.1).

Nuestro [estudio de caso de Fox-IT](/es/blog/the-fox-it-dns-hijack/) examina otra ruta hacia un resultado similar: la vulneración del registrador permitió obtener certificados fraudulentos. Nuestro [estudio de caso de MyEtherWallet](/es/blog/the-myetherwallet-bgp-dns-attack/) examina la manipulación del enrutamiento y del DNS. La seguridad de los dominios debe abordar tanto la dirección del tráfico como la autenticación del extremo.

## DNSSEC autentica respuestas DNS sin reparar las claves de CA

[DNSSEC (Extensiones de Seguridad del DNS)](/es/glossary/dnssec/) añade firmas digitales a los datos DNS. Un resolvedor validador comprueba esas firmas mediante una cadena de confianza. Con una zona correctamente firmada y una cadena de validación intacta, un atacante no puede sustituir una respuesta de dirección por una falsificada sin que se detecte. [RFC 4033 define las protecciones y los límites](https://datatracker.ietf.org/doc/html/rfc4033#section-3).

Los clientes deben validar localmente o confiar tanto en el resolvedor validador como en una conexión autenticada con ese resolvedor. [RFC 4033 aborda este requisito del último tramo](https://datatracker.ietf.org/doc/html/rfc4033#section-7).

Con esas condiciones, DNSSEC puede bloquear el paso de falsificación de DNS del ataque hipotético. DNSSEC no revoca una CA intermedia, no valida un certificado HTTPS ni cifra el tráfico web. Un atacante que intercepte el tráfico por otra ruta aún puede presentar un certificado falsificado a un cliente vulnerable.

La firma por sí sola tampoco protege la cuenta del registrador ni el panel de control del DNS autoritativo. Un atacante que controle los cambios DNS autorizados puede publicar registros perjudiciales que el proveedor firma. Los operadores necesitan protección de cuentas, supervisión de cambios y un registro DS correcto en la zona superior, además de la validación DNSSEC.

## DANE puede vincular una clave de servicio al DNS firmado cuando los clientes aplican la vinculación

[DANE](/es/glossary/dane/) conecta DNSSEC con la autenticación TLS mediante registros TLSA. Un operador de dominio publica el certificado, la clave o el ancla de confianza esperados en el DNS firmado. Un cliente compatible valida DNSSEC y aplica la asociación TLSA. [RFC 6698 especifica esa asociación](https://www.rfc-editor.org/rfc/rfc6698#section-2).

Por ejemplo, el uso DANE-EE puede vincular un servicio directamente con su clave pública. Un certificado falsificado con una clave de CA ajena no cumpliría esa vinculación. Ese beneficio requiere validación DNSSEC segura, datos TLSA correctos y aplicación efectiva por parte del cliente. La rotación de claves también requiere actualizaciones TLSA coordinadas. [RFC 7671 ofrece orientación operativa](https://www.rfc-editor.org/rfc/rfc7671#section-5.1).

Publicar registros TLSA no protege automáticamente a los visitantes de navegadores habituales. La [solicitud de implementación de DANE en Firefox sigue rechazada](https://bugzilla.mozilla.org/show_bug.cgi?id=1994924). Los operadores deben verificar la compatibilidad del cliente exacto. DANE tiene una aplicación normalizada para la [seguridad del transporte SMTP](https://www.rfc-editor.org/rfc/rfc7672).

## CAA y CT ofrecen controles de certificados diferentes

| Control | Protección | Límite |
| --- | --- | --- |
| DNSSEC | Un resolvedor validador autentica los datos DNS firmados. | DNSSEC no repara claves de CA comprometidas. |
| DANE | Un cliente compatible comprueba una asociación TLSA autenticada por DNSSEC. | Los clientes deben aplicar la asociación. |
| CAA | Una CA que cumple la norma comprueba qué emisores autoriza el dominio. | Un falsificador puede eludir el proceso de emisión de la CA. |
| CT | Los registros exponen la emisión de certificados para la supervisión y las comprobaciones de políticas del cliente. | Los registros por sí solos no impiden toda falsificación ni protegen a todos los clientes. |

[CAA](/es/glossary/caa/) publica emisores autorizados en DNS. [RFC 8659 distingue la autorización de emisión de la validación de certificados por el cliente](https://www.rfc-editor.org/rfc/rfc8659#section-1). Una clave de firma robada o recuperable permite a un falsificador ignorar las comprobaciones CAA.

La [Transparencia de certificados](/es/glossary/certificate-transparency/), o CT, permite auditar públicamente la emisión de certificados. La supervisión puede señalar certificados inesperados, mientras que la aplicación de políticas del cliente puede rechazar certificados sin las pruebas de registro exigidas. [RFC 9162 describe el mecanismo de registro](https://www.rfc-editor.org/rfc/rfc9162#section-1). Los hallazgos de Google descritos antes muestran por qué la aplicación de políticas importa durante un incidente de CA.

## Los operadores de dominios deben comprobar ahora la confianza de los clientes y las dependencias de los certificados

- Instale las actualizaciones de seguridad actuales del navegador, sistema operativo, entorno de ejecución y paquetes de CA.
- Catalogue las cadenas de certificados de sitios web, API, aplicaciones móviles, contenedores y pasarelas de inspección TLS.
- Siga las indicaciones de los proveedores para las autoridades intermedias afectadas y la eliminación de raíces, incluidas las rutas de certificación alternativas.
- Reemplace los certificados cuya cadena llegue a la jerarquía que pierde la confianza antes del plazo aplicable al cliente.
- Pruebe el verificador TLS real de cada aplicación después de corregir el problema.
- Mantenga activada la verificación de certificados y deténgase ante errores de certificado.
- Active DNSSEC con una delegación DS correcta y use resolución con validación.
- Restrinja los emisores autorizados con CAA, supervise CT y proteja las cuentas del registrador y del DNS.

Una VPN puede cambiar la ruta del tráfico. Una VPN no repara las decisiones de confianza en certificados del cliente. HSTS exige HTTPS, pero una identidad HTTPS falsificada que el cliente acepte sigue superando esa protección. [RFC 6797 describe los límites de seguridad de HSTS](https://www.rfc-editor.org/rfc/rfc6797#section-14).

Para los lectores de Namefi, la titularidad de dominios, la administración DNS, la autenticación TLS y la autorización de carteras requieren controles independientes. Tokenizar un dominio no sustituye automáticamente la confianza de los navegadores en las CA ni activa DNSSEC. Nuestra [guía DNS para dominios tokenizados](/es/blog/dns-on-tokenized-domains/) explica la conexión operativa. Nuestro [estudio de caso de Curve Finance](/es/blog/the-curve-finance-dns-hijack/) muestra por qué un equipo de Web3 debe proteger el dominio que sirve su interfaz.

## Estas fuentes primarias documentan el incidente y sus defensas

Todas las fuentes siguientes se consultaron el 22 de octubre de 2026. Las declaraciones sobre el incidente pueden cambiar a medida que continúan las investigaciones.

- [Google: respuesta de Chrome y Android](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/), 20 de octubre de 2026. Secciones sobre entropía, CT, bloqueo y eliminación de raíces.
- [Mozilla: respuesta de Firefox](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/), 20 de octubre de 2026. Distribución de OneCRL y actualizaciones adicionales.
- [Incidencia 2083449 de Mozilla](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0), descripción y comentario 1. Alcance de los certificados, recuperación independiente de claves y revocación.
- [Declaración del incidente de eMudhra](https://emudhra.com/es/post/certificate-security-incident), actualizaciones 2–4. Hallazgos de la empresa y opciones de transición para clientes.
- [Orientación de Cloudflare sobre el incidente](https://blog.cloudflare.com/emudhra-certificate-compromise/), orientación para verificar cada aplicación.
- [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280#section-3.2), modelo de certificados y rutas de confianza.
- [RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446#appendix-E.1), confidencialidad directa de TLS 1.3.
- [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033#section-3), servicios, límites y validación DNSSEC.
- [RFC 6698](https://www.rfc-editor.org/rfc/rfc6698#section-2) y [RFC 7671](https://www.rfc-editor.org/rfc/rfc7671#section-5.1), asociaciones DANE y operaciones.
- [Incidencia 1994924 de Mozilla](https://bugzilla.mozilla.org/show_bug.cgi?id=1994924), estado de implementación de DANE en Firefox.
- [RFC 7672](https://www.rfc-editor.org/rfc/rfc7672), DANE para SMTP.
- [RFC 8659](https://www.rfc-editor.org/rfc/rfc8659#section-1), distinción entre autorización CAA y validación.
- [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162#section-1), registro y supervisión CT.
- [RFC 6797](https://www.rfc-editor.org/rfc/rfc6797#section-14), consideraciones de seguridad de HSTS.
