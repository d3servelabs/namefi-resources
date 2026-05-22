---
title: 'Cómo ocurre realmente el secuestro de dominios: cinco vías de ataque y los controles que los detienen'
date: '2026-05-10'
language: es
tags: ['security', 'domains', 'registrar', 'incident-response']
authors: ['namefiteam']
draft: false
description: 'Un recorrido práctico por las cinco formas en que los atacantes realmente toman el control de los dominios en el mundo real (ingeniería social, compromiso de la cuenta del registrador, toma de control del proveedor de DNS, secuestro de NS y recuperación de dominios expirados) y los controles específicos que bloquean cada una.'
ogImage: ../../assets/how-domain-hijacking-actually-happens-og.jpg
keywords: ['secuestro de dominios', 'seguridad de dominios', 'bloqueo del registrador', 'bloqueo de transferencia', 'dnssec', 'autenticación de dos factores', 'ingeniería social', 'dns colgante', 'namefi']
---

"Secuestro de dominios" (Domain hijacking) es una de esas frases que suena dramática pero significa cosas muy diferentes dependiendo de cómo suceda. Una cuenta de registrador comprometida por un correo de phishing es un secuestro. Un registro de servidor de nombres modificado silenciosamente en un proveedor de DNS es un secuestro. Un dominio expirado que otra persona registra y redirige es, en cierto sentido, también un secuestro.

En todos los casos, el resultado es el mismo: ahora es otra persona quien le dice al mundo a dónde apunta tu nombre. El correo electrónico, los pagos, los flujos de inicio de sesión y las integraciones de SaaS comienzan a enviar tráfico al atacante. La recuperación a menudo lleva días, a veces semanas. Si el dominio fue transferido a otro registrador, la [Política de Resolución de Disputas por Transferencia (TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.) de la ICANN puede ser relevante; otros casos a menudo requieren la intervención del registrador, del operador del registro, la recuperación de la plataforma o una orden judicial. La solución más rápida es no llegar nunca a esa situación en primer lugar.

Esta publicación detalla las cinco vías de ataque que vemos con mayor frecuencia, cómo se ve cada una desde la perspectiva del defensor y los controles específicos que realmente las detienen.

## 1. Ingeniería social contra el equipo de soporte del registrador

Los secuestros de alto perfil más comunes de la última década no involucraron ningún exploit técnico. Involucraron una llamada telefónica.

El patrón: un atacante recopila suficiente información sobre un objetivo (historial de WHOIS, LinkedIn, filtraciones de contraseñas, redes sociales) y luego llama o envía un correo electrónico al equipo de soporte del registrador haciéndose pasar por el propietario. Solicitan un restablecimiento de contraseña, un cambio de correo electrónico o un código de autorización de transferencia. Si el agente de soporte sigue una lista de verificación para la cual el atacante se ha preparado, la cuenta cambia de manos.

Este fue el mecanismo detrás de varios de los secuestros más dañinos que afectaron a intercambios de criptomonedas, plataformas de publicidad y marcas de infraestructura. No requiere ninguna vulnerabilidad en el código del registrador; explota al factor humano en el proceso.

**Qué lo detiene:**

- **Una regla estricta por parte del registrador** que exija que los cambios de propiedad requieran un documento notariado o un desafío de múltiples factores a través del canal existente del titular.
- **Bloqueo del registro** (Registry lock, distinto del bloqueo del registrador), donde el operador del registro mismo se niega a actuar sobre transferencias o cambios de contacto sin una confirmación fuera de banda. Disponible en `.com`, `.net` y en muchos ccTLDs.
- **Verificar qué registrador utilizas realmente** y eliminar los demás. Las marcas que comenzaron en 2007 a menudo tienen cuentas inactivas en tres o cuatro registradores con credenciales débiles.

## 2. Compromiso de la cuenta del registrador (la vía de las credenciales)

El primo técnico de la ingeniería social. El atacante obtiene las credenciales de la cuenta del registrador mediante phishing, o las encuentra en un volcado de relleno de credenciales (credential-stuffing), e inicia sesión directamente. Desde allí desbloquean el dominio, cambian el correo electrónico de contacto y solicitan una transferencia.

**Qué lo detiene:**

- **2FA resistente al phishing en la cuenta del registrador.** El uso de TOTP a través de una aplicación de autenticación es lo mínimo; las llaves de hardware (WebAuthn / FIDO2) son el nivel máximo. El 2FA basado en SMS no es suficiente: los ataques de intercambio de SIM (SIM-swapping) lo han eludido en repetidas ocasiones. La [guía de CISA](https://www.cisa.gov/secure-our-world/turn-mfa) del gobierno de los EE. UU. recomienda explícitamente abandonar el uso de SMS.
- **Un registrador que admita bloqueos por dominio** además de bloqueos por cuenta, para que el compromiso de una sola cuenta no pueda desbloquear todo a la vez.
- **Pista de auditoría y alertas** sobre cambios de contacto, cambios en los servidores de nombres y solicitudes de transferencia. El primer movimiento del atacante es silenciar esas alertas; si se envían a un canal que el atacante no controla, obtendrás un tiempo valioso de advertencia.

## 3. Toma de control del proveedor de DNS

Incluso si la cuenta del registrador está asegurada, los *servidores de nombres* que publica el registrador pueden apuntar a un proveedor de DNS con una cuenta separada: Cloudflare, Route 53, NS1, DNSimple, o tu propio servidor BIND. Si el atacante ingresa a esa cuenta de DNS, no necesita tocar el registrador. Simplemente reescriben los registros A, MX y TXT y el tráfico los seguirá.

Esta suele ser la vía más fácil para los atacantes, porque las marcas invierten en la seguridad del registrador pero tratan al proveedor de DNS como "infraestructura" con controles más débiles.

**Qué lo detiene:**

- **El mismo rigor de 2FA en la cuenta del proveedor de DNS que en la del registrador.** Trátalo como algo igualmente sensible. Porque lo es.
- **DNSSEC**, firmado a nivel de zona. DNSSEC no previene el compromiso de la cuenta de un proveedor de DNS: si un atacante puede publicar registros a través del proveedor y el proveedor los firma con las claves activas de la zona, los resolutores de validación tratarán esas respuestas como auténticas. Lo que DNSSEC sí bloquea es la alteración en ruta (in-path tampering), el envenenamiento de caché (cache poisoning) y las respuestas falsificadas que no están firmadas o están mal firmadas, asumiendo que el padre publica los registros DS correctos. Consulta los [RFC 4033-4035](https://datatracker.ietf.org/doc/html/rfc4033) para conocer los detalles del protocolo.
- **DNS multiproveedor** con cuentas y credenciales separadas, utilizando [DNSSEC de múltiples firmantes](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.). Esto ayuda con la disponibilidad y el aislamiento de proveedores, pero solo funciona si cada proveedor sirve los datos de zona previstos y los conjuntos de DNSKEY/DS se coordinan correctamente. No es una anulación mágica donde los resolutores prefieren automáticamente al proveedor no comprometido.

## 4. Secuestros de servidores de nombres mediante delegaciones obsoletas y registros colgantes

Una variante más sutil: el dominio en sí está bien, pero un *subdominio* apunta (a través de un CNAME o registro NS) a un servicio de terceros que el propietario original ya no controla. El atacante registra el recurso en el servicio del tercero y ahora responde por el subdominio.

Ejemplos:

- Un subdominio con CNAME apuntando a un antiguo activo de Heroku, S3 o Azure que ha sido liberado. El atacante vuelve a reclamar el nombre de ese activo y obtiene un certificado TLS válido.
- Un registro `NS` delegado apuntando a la cuenta de un proveedor de DNS que ha sido eliminada. El atacante crea una cuenta nueva usando exactamente ese patrón de host y sirve los registros que desee para el subdominio.

Estos se catalogan bajo el término general de **DNS colgante** (dangling DNS), y son la forma más común de secuestros de dominio "reales" en la web abierta de hoy, porque la mayoría de las grandes organizaciones tienen cientos o miles de subdominios y solo auditan una fracción de ellos.

**Qué lo detiene:**

- **Un inventario completo de cada registro NS, CNAME y ALIAS** en cada zona que poseas, con un responsable asignado para cada uno.
- **Escáneres automatizados de DNS colgante** que vuelvan a resolver cada registro de forma programada y marquen los que apuntan a servicios de terceros que ya no responden. El [blog de GitHub](https://github.blog/2021-12-13-securing-our-home-labs-frigate-version-bump/) y [Detectify Labs](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/) tienen artículos extensos sobre esta clase de ataques.
- **Dar de baja los registros el mismo día** que desactives el servicio subyacente.

## 5. Recuperación de dominios expirados

El ataque más simple y que despierta menos compasión: el titular olvidó renovar. Pasa el período de gracia. El dominio vuelve a estar disponible en el mercado. Otra persona lo registra.

Esto suena como un fallo operativo, no como un incidente de seguridad, pero el impacto es idéntico: ahora otra persona controla el nombre, y todas las señales de confianza que se construyeron durante años (SPF, DKIM, devoluciones de llamada OAuth, correos electrónicos de restablecimiento de contraseña, integraciones de pago) comienzan a fluir hacia un extraño. Varios incidentes públicos involucraron a atacantes comprando dominios expirados específicamente porque el propietario anterior los había registrado como la declaración `iss` (emisor) en tokens OAuth o como el remitente de correos electrónicos transaccionales.

**Qué lo detiene:**

- **Renovación multianual** (5-10 años) para cualquier dominio que esté vinculado a autenticación, pagos o tráfico de producción. El costo es mínimo; la protección es significativa.
- **Renovación automática con un método de pago que no pueda fallar de manera silenciosa.** El vencimiento de las tarjetas de crédito es la causa más común de expiración accidental.
- **Recordatorios de calendario** a los 90, 60, 30 y 7 días que alerten a una dirección de *equipo*, no a la bandeja de entrada de una sola persona que podría dejar la empresa.

## Cómo se ve un escenario ideal

Reuniendo los controles, el estándar básico para cualquier dominio importante se ve así:

| Control | Vía de ataque que bloquea |
| -------------------------------------- | ----------------------------------------------- |
| 2FA con llave de hardware en el registrador | Compromiso de cuenta (vía 2) |
| 2FA con llave de hardware en el proveedor de DNS | Toma de control de DNS (vía 3) |
| Bloqueo de registro (donde esté disponible) | Ingeniería social (vía 1) |
| DNSSEC firmado en la zona | Alteración de DNS en ruta y respuestas falsificadas |
| Inventario de subdominios + escáner colgante | Secuestro de subdominios (vía 4) |
| Renovación a 5-10 años + renovación automática | Expiración accidental (vía 5) |
| Alertas por cambios de contacto/NS/transferencia | Las cinco (te enteras a tiempo) |

Si eres responsable de un dominio y no puedes marcar cada fila, el trabajo del atacante será considerablemente más fácil.

## Cómo Namefi cambia el panorama

La mayoría de los controles anteriores existen como funciones en un registrador, un proveedor de DNS o una herramienta de flujos de trabajo, y la seguridad depende de cuál sea la cuenta más débil. Namefi tokeniza la relación del titular (registrant) on-chain (en la cadena de bloques), lo que significa que el registro autorizado de *quién posee este nombre* vive fuera de la base de datos de clientes de cualquier registrador individual. Un agente de soporte en cualquier proveedor no puede cambiar silenciosamente la propiedad sin una transacción firmada que el propietario legítimo debe aprobar. El registrador todavía opera la delegación técnica, pero la capa de *control* se traslada a un lugar donde la ingeniería social no funciona.

Esto no es un sustituto completo para los controles en la tabla anterior (aún necesitas DNSSEC, aún necesitas 2FA en el proveedor de DNS, aún necesitas renovar tu dominio). Pero elimina por completo del modelo de amenazas el vector de secuestro de alto impacto más común (la vía 1).

## Fuentes y lecturas adicionales

- ICANN — [Alcance de la Política de Resolución de Disputas por Transferencia](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.).
- IETF — [RFCs de DNSSEC 4033/4034/4035](https://datatracker.ietf.org/doc/html/rfc4033) y [RFC 8901 sobre DNSSEC de múltiples firmantes](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.).
- CISA — [Guía de autenticación multifactor](https://www.cisa.gov/secure-our-world/turn-mfa).
- Detectify Labs — [Artículo sobre la toma hostil de subdominios](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/).
- Verisign — [Bloqueo de registro para .com/.net](https://www.verisign.com/en_US/channel-resources/domain-registry-products/registry-lock/index.xhtml).