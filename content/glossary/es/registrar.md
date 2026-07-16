---
title: Registrador
date: '2025-06-30'
language: es
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['iria-maquieira']
description: Una empresa acreditada por ICANN autorizada para registrar nombres de dominio en nombre del público, actuando como interfaz entre registrantes y registros.
keywords: ['registrador', 'registrador de dominios', 'acreditación ICANN', 'registro de dominios', 'RAA', 'EPP', 'código de autorización', 'bloqueo de transferencia', 'transferencia de dominio']
level: 2
sources:
  - https://www.icann.org/en/accredited-registrars
  - https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en
  - https://www.iana.org/domains/root
aliasesByLocale:
  zh-CN: ['注册服务商']
  de: ['Registrierungsdienst']
relatedArticles:
  - /es/blog/how-to-sell-a-domain-name-you-own/
  - /es/blog/what-are-tokenized-domains/
  - /es/blog/what-is-a-tld/
  - /es/blog/the-panix-com-domain-hijack/
  - /es/blog/what-is-udrp/
relatedTopics:
  - /es/topics/domain-basics/
  - /es/topics/domain-security/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/domain-investor-field-guide/
relatedGlossary:
  - /es/glossary/icann/
  - /es/glossary/registry/
  - /es/glossary/dns/
  - /es/glossary/tld/
  - /es/glossary/web3/
---

Un **registrador** es una organización acreditada por [ICANN](/es/glossary/icann/) que está autorizada para registrar nombres de dominio en uno o más dominios de nivel superior en nombre del público, gestionando la relación entre los compradores de dominios y el [registro](/es/glossary/registry/) que opera la base de datos autoritativa de esos dominios.

## Qué hace un registrador

Un registrador actúa como el proveedor de servicios de cara al público en el sistema de nombres de dominio. Cuando una persona u organización quiere ser propietaria de un nombre de dominio, interactúa con un registrador — no directamente con un registro ni con [ICANN](/es/glossary/icann/).

Las funciones principales que ofrece un registrador incluyen:

- **Búsqueda y registro de dominios.** El registrador consulta la base de datos de disponibilidad del registro y, una vez realizada la compra, envía una solicitud de registro en nombre del cliente.
- **Gestión de renovaciones.** Los registros se arriendan por períodos de uno a diez años. El registrador recauda las tarifas de renovación y vuelve a registrar el nombre antes de que expire.
- **Gestión de [DNS](/es/glossary/dns/) y [servidores de nombres](/es/glossary/nameserver/).** Los registradores ofrecen a los registrantes un panel de control para actualizar los servidores de nombres que determinan dónde se alojan los registros DNS de un dominio.
- **Mantenimiento de registros de contacto.** Las normas de ICANN requieren datos de contacto WHOIS precisos. Los registradores recopilan y (dentro de los límites de la privacidad) publican estos datos.
- **Funciones de seguridad del dominio.** Estas incluyen el bloqueo del dominio, la autenticación de dos factores en la cuenta del registrador, la firma DNSSEC y la verificación por correo electrónico para cambios sensibles.
- **Facilitación de transferencias.** Cuando el propietario de un dominio se traslada a otro registrador, el registrador actual debe seguir la política de transferencias de ICANN y liberar el dominio en respuesta a una solicitud de transferencia válida.

## Registrador vs. registro vs. registrante

El sector de los nombres de dominio se organiza en torno a tres roles distintos, cada uno comenzando con «regist-» — fuente frecuente de confusión.

| Rol | Quiénes son | Qué controlan |
|-----|-------------|---------------|
| **[Registro](/es/glossary/registry/)** | El operador de un dominio de nivel superior (TLD) — p. ej., Verisign para `.com`, DENIC para `.de`. | La base de datos autoritativa de todos los dominios de segundo nivel bajo ese TLD; establece los precios mayoristas y las políticas del registro. |
| **Registrador** | Un revendedor acreditado por ICANN autorizado para registrar nombres dentro de uno o más TLDs. | La relación con el cliente, los precios minoristas, los paneles de control, los avisos de renovación y los mecanismos de transferencia/bloqueo. |
| **[Registrante](/es/glossary/registrant/)** | La persona, empresa u organización que compra y usa el nombre de dominio. | La configuración de los servidores de nombres y los registros DNS; el derecho legal a renovar y transferir el nombre. |

Los registros y los registradores son empresas distintas. Un registro no vende al público; vende acceso mayorista a los registradores acreditados. Los registradores fijan sus propios precios minoristas y compiten por los clientes. En algunos casos, la misma empresa tiene acreditación tanto de registro como de registrador (Donuts/Identity Digital es un ejemplo destacado), pero los roles siguen siendo operacional y contractualmente distintos bajo las normas de ICANN.

## Acreditación ICANN — el RAA

Una empresa no puede operar como registrador simplemente creando un proceso de pago. Primero debe ser acreditada por [ICANN](/es/glossary/icann/) bajo el **Acuerdo de Acreditación de Registradores (RAA)**, un contrato vinculante que establece obligaciones mínimas en materia de exactitud de datos, gestión de disputas, derechos de los registrantes, respuesta ante abusos y custodia financiera de los datos de los clientes.

Las disposiciones clave del RAA incluyen:

- **Verificación de registrantes.** Los registradores deben verificar los datos de contacto y responder a las reclamaciones por inexactitudes dentro de un plazo definido.
- **Custodia de datos.** Los registradores deben depositar los datos de registro de los clientes con un proveedor de custodia externo para que los registros sobrevivan si el registrador cierra su actividad.
- **Respuesta ante abusos.** Los registradores deben mantener un punto de contacto para abusos y actuar sobre los informes documentados de abusos (spam, malware, phishing) dentro de los plazos establecidos.
- **WHOIS delgado vs. grueso.** Algunos TLDs usan un modelo delgado (datos de contacto en el registrador) y otros usan un modelo grueso (datos de contacto copiados al registro). El RAA define qué datos deben publicarse o protegerse mediante privacidad bajo el RGPD y marcos similares.

ICANN publica la [lista completa de registradores acreditados](https://www.icann.org/en/accredited-registrars), actualmente con más de 2.000 en todo el mundo, junto con su estado de acreditación y cualquier sanción pública.

## Cómo funcionan el registro y las transferencias

### Registro a través de EPP

Los registradores se conectan a los registros mediante el **Protocolo de Aprovisionamiento Extensible ([EPP](/es/glossary/epp/))**, un protocolo estandarizado basado en XML definido en los RFC 5730–5734. Cuando un registrante completa una compra, el sistema del registrador envía un comando `create` de EPP al registro, que registra la inscripción y devuelve un **Identificador de Objeto del Registro (ROID)** único. El registro luego publica la delegación del [servidor de nombres](/es/glossary/nameserver/) en la zona raíz DNS para que el dominio resuelva.

### Bloqueos de transferencia y códigos de autorización

Las transferencias de dominios entre registradores se rigen por la [Política de Transferencia entre Registradores](https://www.icann.org/resources/pages/transfer-policy-2016-06-01-en) de ICANN. Dos mecanismos protegen contra las transferencias no autorizadas:

- **[Bloqueo de transferencia](/es/glossary/transfer-lock/) (bloqueo de registrador / estado EPP `clientTransferProhibited`).** Cuando está activado, el registro rechazará cualquier solicitud de transferencia de ese dominio. Los registradores lo activan por defecto como medida de seguridad. El registrante debe desbloquear explícitamente el dominio antes de iniciar una transferencia.
- **[Código de autorización](/es/glossary/auth-code/) (también llamado código de información de autorización EPP o código de autorización de transferencia).** Una contraseña de un solo uso generada por el registrador. El registrador receptor envía este código al registro para demostrar que el registrante autorizó la transferencia. Sin él, el registro rechaza la solicitud.

Un flujo estándar de transferencia saliente:

1. El registrante solicita el código de autorización al registrador actual.
2. El registrante desbloquea el dominio (desactiva `clientTransferProhibited`).
3. El registrante introduce el código de autorización en el registrador receptor.
4. El registrador receptor envía un comando `transfer` de EPP al registro.
5. El registro notifica al registrador cedente, que tiene cinco días para rechazarlo o aprobarlo explícitamente; el silencio se trata como aprobación.
6. Se completa la transferencia; el registrador receptor mantiene el registro durante el resto del plazo más un año.

Las normas de ICANN prohíben a los registradores cobrar una tarifa por la transferencia saliente, aunque algunos lo intentan para determinados TLDs.

### La regla del bloqueo de 60 días

La política de ICANN bloquea un dominio en su registrador actual durante 60 días después del registro inicial y durante 60 días después de una transferencia entre registradores. Esto evita escenarios de abuso como el traslado de un dominio entre registradores para ocultar la propiedad. El contador de 60 días se reinicia en cada transferencia.

## Revendedores

Muchos nombres de dominio no los venden directamente los registradores acreditados, sino **[revendedores](/es/glossary/reseller/)** — empresas que comercializan la infraestructura del registrador bajo su propia marca. Los revendedores no tienen su propia acreditación de ICANN; operan bajo la acreditación de su registrador superior. Para el [registrante](/es/glossary/registrant/), las implicaciones prácticas son:

- El registrador superior mantiene la conexión EPP con el registro, por lo que el nombre del registrador aparecerá en el WHOIS, no el del revendedor.
- Las disputas y los derechos de custodia se rigen por el RAA del registrador superior.
- Si el revendedor cesa su actividad, los registros permanecen válidos bajo la custodia del registrador superior.

Los acuerdos de revendedor son habituales: muchas empresas de alojamiento web, constructores de sitios web y proveedores de telecomunicaciones venden dominios como complementos a través de este modelo.

## Cómo elegir un registrador

Ningún registrador es adecuado para todos los casos de uso. Factores neutros que vale la pena comparar:

- **Precios.** Los precios de registro los fija el registro (mayorista) pero los marca de forma diferente cada registrador. Compara los precios promocionales del primer año con las tarifas de renovación plurianuales — la diferencia suele ser grande. Comprueba también el precio de la transferencia entrante.
- **Protección de privacidad.** La mayoría de los registradores incluyen la privacidad WHOIS (datos de contacto de proxy) sin coste adicional siguiendo las directrices RGPD de ICANN, pero algunos aún la cobran. Confirma la opción predeterminada.
- **Funciones de seguridad.** Busca autenticación de dos factores en la cuenta, disponibilidad de bloqueo de registro para dominios de alto valor, soporte de DNSSEC y correos electrónicos de confirmación de cambios en la cuenta.
- **Alojamiento DNS.** Algunos registradores incluyen su propio alojamiento DNS; otros son agnósticos en cuanto a servidores de nombres. Evalúa si el DNS incluido satisface tus necesidades o si apuntarás a un proveedor aparte (Cloudflare, AWS Route 53, etc.).
- **Calidad del soporte.** Los tiempos de respuesta y las opciones de canal (chat, teléfono, ticket) varían significativamente. Para dominios críticos para el negocio, el soporte en directo 24/7 importa.
- **Ámbito de acreditación.** No todos los registradores están acreditados para todos los TLDs. Confirma que el registrador admite los TLDs específicos que necesitas, especialmente para los TLDs de código de país (ccTLDs) que pueden requerir normas de presencia local.

Ejemplos conocidos de registradores acreditados incluyen GoDaddy, Namecheap, Cloudflare Registrar, Google Domains (ahora Squarespace Domains) y Gandi — mencionados aquí como ilustraciones objetivas, no como recomendaciones. Cada uno tiene diferentes estructuras de precios, conjuntos de funciones e interfaces de usuario que se adaptan a diferentes necesidades de los registrantes.

## Registradores y dominios tokenizados

El registro [DNS](/es/glossary/dns/) convencional sitúa el control del dominio en el registrador: el acceso a la cuenta, el método de pago y las propias políticas del registrador determinan quién puede renovar, transferir o configurar un nombre. La propiedad está efectivamente vinculada a la cuenta del registrador.

Algunos sistemas de nomenclatura basados en blockchain — como Ethereum Name Service (ENS) para los nombres `.eth` — operan completamente fuera de la jerarquía DNS tradicional y del marco de acreditación de ICANN. En estos sistemas, la propiedad está codificada en un contrato inteligente y controlada por una clave privada criptográfica en lugar de una cuenta de registrador. Dichos nombres no aparecen en la zona raíz de [IANA](/es/glossary/nameserver/) y no son resolubles en el DNS estándar sin extensiones de navegador o soporte a nivel de resolvedor.

Un pequeño conjunto de proyectos explora modelos híbridos, donde los nombres de dominio convencionales delegados por ICANN están vinculados a registros de propiedad en cadena, pero a fecha de 2025 estos siguen fuera del DNS convencional y no afectan al papel formal del registrador bajo el RAA. Para cualquier dominio que resuelva en el DNS estándar, un registrador acreditado por ICANN sigue siendo el intermediario obligatorio entre el registrante y el registro.
