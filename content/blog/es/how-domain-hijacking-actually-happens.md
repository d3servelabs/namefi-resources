---
title: 'Cómo Ocurre Realmente el Secuestro de Dominios: Cinco Rutas de Ataque y los Controles Que los Detienen'
date: '2026-05-10'
language: es
tags: ['security', 'domains', 'registrar', 'incident-response']
authors: ['namefiteam']
draft: false
description: 'Un recorrido práctico por las cinco formas en que los atacantes realmente se apoderan de los dominios en el mundo real (ingeniería social, compromiso de la cuenta del registrador, toma de control del proveedor de DNS, secuestros de NS y recuperación de dominios expirados) y los controles específicos que bloquean a cada una.'
ogImage: ../../assets/how-domain-hijacking-actually-happens-og.jpg
keywords: ['secuestro de dominios', 'seguridad de dominios', 'bloqueo de registrador', 'bloqueo de transferencia', 'dnssec', 'autenticación de dos factores', 'ingeniería social', 'dns colgante', 'namefi']
---

El "secuestro de dominios" (*domain hijacking*) es una de esas frases que suena dramática pero que significa cosas muy diferentes dependiendo de cómo ocurra. Una cuenta de [registrador](/es/glossary/registrar/) tomada mediante un correo de *[phishing](/es/glossary/phishing/)* es un secuestro. Un [registro](/es/glossary/registry/) de [servidor de nombres](/es/glossary/nameserver/) intercambiado silenciosamente en un proveedor de DNS es un secuestro. Un dominio expirado que otra persona toma y redirecciona es, en cierto sentido, también un secuestro.

En todos los casos, el resultado es el mismo: alguien más le está diciendo al mundo hacia dónde apunta su nombre. El correo electrónico, los pagos, los flujos de inicio de sesión y las integraciones SaaS comienzan a enviar tráfico al atacante. La recuperación a menudo lleva días, a veces semanas. Si el dominio fue transferido a otro registrador, la [Política de Resolución de Disputas por Transferencias (TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.) de la [ICANN](/es/glossary/icann/) puede ser relevante; otros casos a menudo requieren una escalada al registrador, una escalada al registro (*registry*), la recuperación de la plataforma o una orden judicial. La solución más rápida es, en primer lugar, no llegar nunca a esa posición.

Esta publicación detalla las cinco rutas de ataque que vemos con más frecuencia, cómo se ve cada una desde la perspectiva del defensor y los controles específicos que realmente las detienen.

## 1. Ingeniería social contra el equipo de soporte del registrador

Los secuestros de alto perfil más comunes de la última década no involucraron ningún *exploit* técnico. Involucraron una llamada telefónica.

El patrón: un atacante recopila suficiente información sobre un objetivo —historial de [WHOIS](/es/glossary/whois/), LinkedIn, filtraciones de contraseñas, redes sociales— y luego llama o envía un correo electrónico al equipo de soporte del registrador haciéndose pasar por el propietario. Solicitan un restablecimiento de contraseña, un cambio de correo electrónico o un código de autorización de transferencia. Si el agente de soporte sigue una lista de verificación para la cual el atacante se ha preparado, la cuenta cambia de manos.

Este fue el mecanismo detrás de varios de los secuestros más perjudiciales que involucraron plataformas de intercambio de criptomonedas, plataformas de publicidad y marcas de infraestructura. No requiere ninguna vulnerabilidad en el código del registrador; explota al factor humano en el proceso.

**Qué lo detiene:**

- **Una regla estricta por parte del registrador** de que los cambios de propiedad requieren un documento notariado o un desafío multifactorial contra el canal existente del solicitante de registro.
- **Bloqueo del registro** (*registry lock*, independiente del bloqueo del registrador), donde el propio operador del registro se niega a actuar sobre transferencias o cambios de contacto sin una confirmación fuera de banda (*out-of-band*). Disponible en `.com`, `.net` y en muchos [ccTLD](/es/glossary/cctld/).
- **Verificar qué registrador utiliza realmente** y eliminar los demás. Las marcas que comenzaron en 2007 a menudo tienen cuentas inactivas en tres o cuatro registradores con credenciales débiles.

## 2. Compromiso de la cuenta del registrador (la ruta de las credenciales)

El primo técnico de la ingeniería social. El atacante obtiene las credenciales de la cuenta del registrador mediante *phishing*, o las encuentra en un volcado de relleno de credenciales (*credential stuffing*), e inicia sesión directamente. Desde allí, desbloquean el dominio, cambian el correo electrónico de contacto y solicitan una transferencia.

**Qué lo detiene:**

- **2FA resistente al *phishing* en la cuenta del registrador.** El TOTP a través de una aplicación de autenticación es lo mínimo indispensable; las claves de hardware (WebAuthn / FIDO2) son el nivel máximo. El 2FA basado en SMS no es suficiente: los ataques de intercambio de SIM (*SIM-swapping*) lo han derrotado repetidamente. La [guía de CISA](https://www.cisa.gov/secure-our-world/turn-mfa) del gobierno de EE. UU. recomienda explícitamente abandonar los SMS.
- **Un registrador que admita bloqueos por dominio** además de bloqueos por cuenta, de modo que el compromiso de una sola cuenta no pueda desbloquear todo a la vez.
- **Pista de auditoría y alertas** sobre cambios de contacto, cambios de servidores de nombres y solicitudes de transferencia. El primer movimiento del atacante es silenciar esas alertas; si estas se disparan a un canal que el atacante no controla, usted obtiene tiempo de advertencia.

## 3. Toma de control del proveedor de DNS

Incluso si la cuenta del registrador está bloqueada, los *servidores de nombres* que publica el registrador podrían apuntar a un proveedor de DNS con una cuenta separada: Cloudflare, Route 53, NS1, DNSimple o su propio servidor BIND. Si el atacante ingresa a esa cuenta DNS, no necesita tocar al registrador. Simplemente reescriben los registros A, MX y TXT, y el tráfico hace el resto.

A menudo, esta es la ruta más fácil para los atacantes, porque las marcas invierten en la seguridad del registrador pero tratan al proveedor de DNS como una "infraestructura" con controles más débiles.

**Qué lo detiene:**

- **El mismo rigor en el 2FA de la cuenta del proveedor de DNS que en el registrador.** Trátela como si fuera igualmente confidencial. Lo es.
- **[DNSSEC](/es/glossary/dnssec/)**, firmado a nivel de zona. DNSSEC no evita el compromiso de la cuenta de un proveedor de DNS: si un atacante puede publicar registros a través del proveedor y el proveedor los firma con las claves activas de la zona, los resolutores (*resolvers*) que validen tratarán esas respuestas como auténticas. Lo que sí bloquea DNSSEC es la manipulación en la ruta de red (*in-path tampering*), el envenenamiento de caché y las respuestas falsificadas que no están firmadas o que están firmadas incorrectamente, asumiendo que el dominio padre publica los registros DS correctos. Consulte los detalles del protocolo en el [RFC 4033-4035](https://datatracker.ietf.org/doc/html/rfc4033).
- **DNS de múltiples proveedores** con cuentas y credenciales separadas, utilizando [DNSSEC con múltiples firmantes (*multi-signer*)](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.). Esto ayuda con la disponibilidad y el aislamiento de los proveedores, pero solo funciona si cada proveedor entrega los datos previstos de la zona y los conjuntos DNSKEY/DS se coordinan correctamente. No es una solución mágica donde los resolutores prefieren automáticamente al proveedor que no ha sido comprometido.

## 4. Secuestros de servidores de nombres mediante delegaciones obsoletas y registros colgantes

Una variante más sutil: el dominio en sí está bien, pero un *[subdominio](/es/glossary/subdomain/)* apunta (a través de un registro CNAME o NS) a un servicio de terceros que el propietario original ya no controla. El atacante registra el recurso en el lado del tercero y ahora responde por el subdominio.

Ejemplos:

- Un subdominio con registro CNAME apuntando a un antiguo recurso de Heroku, S3 o Azure que ha sido liberado. El atacante reclama ese nombre de recurso y obtiene un certificado TLS válido.
- Un registro `NS` delegado que apunta a la cuenta de un proveedor de DNS que ha sido eliminada. El atacante crea una cuenta nueva usando exactamente ese mismo patrón de *host* y publica los registros que quiera para el subdominio.

Estos casos están catalogados bajo el término general de **DNS colgante** (*dangling DNS*), y son la forma más común de secuestros de dominios "reales" en la web abierta actual, ya que la mayoría de las grandes organizaciones tienen cientos o miles de subdominios y solo auditan una fracción de ellos.

**Qué lo detiene:**

- **Un inventario completo de cada registro NS, CNAME y ALIAS** en cada zona que posea, con un responsable asignado para cada uno.
- **Escáneres automatizados de DNS colgantes** que vuelven a resolver cada registro de forma programada y marcan aquellos que apuntan a servicios de terceros que ya no responden. El [blog de GitHub](https://github.blog/2021-12-13-securing-our-home-labs-frigate-version-bump/) y [Detectify Labs](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/) tienen artículos extensos sobre esta clase de ataque.
- **Dar de baja los registros el mismo día** que se da de baja el servicio subyacente.

## 5. Recuperación de dominios expirados

El ataque más simple y el que genera menos empatía: el [registrante](/es/glossary/registrant/) olvidó renovar. Pasa el período de gracia. El dominio vuelve a estar disponible para el público. Alguien más lo registra.

Esto suena como un fallo operativo, no como un incidente de seguridad, pero el impacto es idéntico: alguien más ahora controla el nombre, y todas las señales de confianza que se construyeron durante años (SPF, DKIM, *callbacks* de OAuth, correos electrónicos de restablecimiento de contraseña, integraciones de pago) comienzan a fluir hacia un extraño. Varios incidentes públicos involucraron a atacantes comprando dominios expirados específicamente porque el propietario anterior los había registrado como la declaración `iss` (*claim*) en tokens de OAuth o como remitente para correos electrónicos transaccionales.

**Qué lo detiene:**

- **Renovación multianual** (5-10 años) en cualquier dominio que esté vinculado a la autenticación, pagos o tráfico de producción. El costo es trivial; la protección es significativa.
- **[Renovación automática](/es/glossary/domain-renewal/) con un método de pago que no pueda fallar silenciosamente.** El vencimiento de las tarjetas de crédito es la causa más común de expiraciones accidentales.
- **Recordatorios en el calendario** a los 90, 60, 30 y 7 días que se envíen a la dirección de un *equipo*, no a la bandeja de entrada de una sola persona que podría dejar la empresa.

## Cómo se ve una buena postura de seguridad

Reuniendo todos los controles, la base fundamental para cualquier dominio importante se ve de la siguiente manera:

| Control | Bloquea la ruta de ataque |
| --- | --- |
| 2FA con clave de hardware en el registrador | Compromiso de cuenta (ruta 2) |
| 2FA con clave de hardware en el proveedor DNS | Toma de control de DNS (ruta 3) |
| [Bloqueo de registro](/es/glossary/registry-lock/) (donde esté disponible) | Ingeniería social (ruta 1) |
| DNSSEC firmado en la zona | Manipulación de DNS en la ruta y respuestas falsificadas |
| Inventario de subdominios + escáner de DNS colgante | Secuestro de subdominio (ruta 4) |
| Renovación de 5 a 10 años + renovación automática | Expiración accidental (ruta 5) |
| Alertas de cambios de contacto/NS/transferencias | Las cinco opciones (se entera a tiempo) |

Si usted es responsable de un dominio y no puede marcar cada fila, el trabajo del atacante es materialmente más fácil.

## Cómo cambia el panorama Namefi

La mayoría de los controles anteriores existen como características en un solo registrador, en un solo proveedor de DNS o en una herramienta de flujo de trabajo, y la seguridad depende de cuál sea la cuenta más débil. Namefi tokeniza la relación del registrante en la cadena de bloques (*[on-chain](/es/glossary/on-chain/)*), lo que significa que el registro autoritativo de *quién es el propietario de este nombre* vive fuera de la base de datos de clientes de cualquier registrador individual. Un agente de soporte en cualquier proveedor no puede cambiar silenciosamente la propiedad sin una transacción firmada que el propietario legítimo deba aprobar. El registrador sigue operando la delegación técnica, pero la capa de *control* se mueve a un lugar donde la ingeniería social no funciona.

Eso no es un sustituto completo de los controles en la tabla anterior: todavía necesita DNSSEC, todavía necesita 2FA en el proveedor de DNS y todavía necesita renovar. Pero elimina por completo del modelo de amenazas el vector de secuestro de alto impacto más común (ruta 1).

## Fuentes y lecturas complementarias

- ICANN — [Alcance de la Política de Resolución de Disputas por Transferencias](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.).
- IETF — [RFC de DNSSEC 4033/4034/4035](https://datatracker.ietf.org/doc/html/rfc4033) y [RFC 8901 sobre DNSSEC de múltiples firmantes](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.).
- CISA — [Guía de autenticación multifactor](https://www.cisa.gov/secure-our-world/turn-mfa).
- Detectify Labs — [Artículo sobre la toma de control de subdominios hostiles](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/).
- Verisign — [Bloqueo de registro para .com/.net](https://www.verisign.com/en_US/channel-resources/domain-registry-products/registry-lock/index.xhtml).