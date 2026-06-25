---
title: Registro
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: La organización que opera la base de datos autoritativa y los servidores de nombres de un dominio de nivel superior, delegando las ventas al por menor a los registradores.
keywords: ['registro', 'operador de registro', 'registro TLD', 'registro de dominios', 'ICANN', 'registrador', 'EPP', 'registro gTLD', 'registro ccTLD', 'sistema de registro compartido']
also_known_as: ['Operador de registro']
level: 2
sources:
  - https://www.icann.org/resources/pages/registries-0-2012-02-25-en
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/registry-agreements
  - https://www.icann.org/resources/pages/gtld-registry-agreement-2013-01-25-en
---

Un **registro** (también llamado *operador de registro*) es la organización que opera la base de datos autoritativa de un [TLD](/es/glossary/tld/) — registrando cada dominio inscrito bajo esa extensión, manteniendo el archivo de zona que mapea esos nombres a los [servidores de nombres](/es/glossary/nameserver/), y publicando los datos que permiten que las consultas a través del [DNS](/es/glossary/dns/) funcionen. Los registros se sitúan en la cima de la cadena de suministro de nombres de dominio, por encima de los [registradores](/es/glossary/registrar/) y los [registrantes](/es/glossary/registrant/).

## Qué hace un registro

La función central de un registro es mantener la **base de datos autoritativa** — a menudo denominada *base de datos de registro* o *sistema de registro compartido* — de cada dominio bajo su TLD. Cuando un dominio se crea, renueva, transfiere o elimina, el registro anota el cambio. El registro también publica el **archivo de zona del TLD**: el conjunto de delegaciones de [servidores de nombres](/es/glossary/nameserver/) que indica al [DNS](/es/glossary/dns/) global adónde enviar las consultas para los nombres bajo ese TLD.

Además de la gestión de la base de datos, la mayoría de los registros operan o contratan los **servidores de nombres autoritativos** para su TLD (a menudo llamados servidores de nombres del TLD). Estos servidores responden a las consultas de los resolutores que preguntan, por ejemplo, "¿qué servidores de nombres son autoritativos para `example.com`?" y devuelven la respuesta desde el archivo de zona del registro.

Más allá de sus obligaciones técnicas, los registros:

- Fijan los **precios mayoristas** — el precio que los [registradores](/es/glossary/registrar/) pagan por dominio, por año.
- Redactan y hacen cumplir las **políticas de registro** — requisitos de elegibilidad, normas de uso aceptable, y períodos de amanecer/protección de marcas para nuevas extensiones.
- Operan servicios de consulta **WHOIS / RDAP** que exponen los datos de registro al público.
- Coordinan con [ICANN](/es/glossary/icann/) bajo un acuerdo de registro que define las obligaciones y los estándares de rendimiento ([Acuerdos de Registro de ICANN](https://www.icann.org/en/registry-agreements)).

## Registro vs. registrador vs. registrante

La industria de los nombres de dominio se organiza en torno a un modelo de tres niveles establecido por [ICANN](/es/glossary/icann/):

| Nivel | Función | Ejemplos |
|-------|---------|---------|
| **Registro** | Opera la base de datos del TLD; fija el precio mayorista; sin ventas directas al consumidor | Verisign (.com, .net), PIR (.org), DENIC (.de) |
| **[Registrador](/es/glossary/registrar/)** | Minorista acreditado; vende dominios al público; interactúa con el registro mediante EPP | GoDaddy, Namecheap, Google Domains |
| **[Registrante](/es/glossary/registrant/)** | La persona u organización que registra un nombre de dominio | Cualquier empresa o individuo que compra un dominio |

Los registros y los registradores son acreditados por [ICANN](/es/glossary/icann/), pero desempeñan funciones diferenciadas. Un registro no puede actuar simultáneamente como registrador minorista de sus propios TLDs según las normas de separación vertical de ICANN (con excepciones limitadas). Esta separación es intencional: evita que un registro se otorgue precios preferenciales o acceso prioritario a nombres deseables antes que el público.

## Cómo funciona el modelo registro–registrador

El puente técnico entre el registro y el registrador es el **[Protocolo de aprovisionamiento extensible (EPP)](/es/glossary/epp/)**, un protocolo basado en XML definido en el [RFC 5730](https://www.rfc-editor.org/rfc/rfc5730). Los registradores se conectan al servidor EPP del registro para realizar operaciones del ciclo de vida del dominio: `check` (¿está disponible el nombre?), `create`, `renew`, `transfer`, `update` y `delete`.

Bajo este modelo:

1. Un registrador suscribe un **Acuerdo de Acreditación de Registrador (RAA)** con [ICANN](/es/glossary/icann/) y un **acuerdo registro–registrador** separado con cada registro cuyos TLDs desea comercializar.
2. El registro cobra al registrador una **tarifa mayorista** (por ejemplo, Verisign cobra a los registradores acreditados aproximadamente $10,26/año por un `.com` a fecha de 2024).
3. El registrador añade su margen y vende a un **precio minorista** al [registrante](/es/glossary/registrant/).
4. El registrador envía comandos [EPP](/es/glossary/epp/) al registro, que actualiza la base de datos autoritativa y el archivo de zona, haciendo que el dominio esté activo en el DNS en cuestión de minutos.

Esta arquitectura, a veces denominada **sistema de registro compartido (SRS)**, permite que un único registro soporte cientos de registradores que compiten entre sí simultáneamente, todos escribiendo en la misma base de datos autoritativa mediante transacciones [EPP](/es/glossary/epp/) estandarizadas. La competencia en el nivel del registrador mantiene bajos los precios minoristas sin otorgar a ningún revendedor un monopolio sobre el acceso al TLD.

## Ejemplos

**Registros de TLD genéricos**

- **Verisign** opera `.com` y `.net`, los dos [gTLD](/es/glossary/gtld/)s más grandes por volumen de registros. Su acuerdo de registro con [ICANN](/es/glossary/icann/) está disponible públicamente y se cita ampliamente como modelo de referencia ([entrada de la base de datos raíz de IANA para .com](https://www.iana.org/domains/root/db/com.html)).
- **Public Interest Registry (PIR)** opera `.org`, originalmente establecido como un registro sin ánimo de lucro para servir a organizaciones no comerciales.
- **Identity Digital** (antes Donuts y Afilias) es uno de los mayores operadores de [nuevos gTLD](/es/glossary/new-gtld/)s delegados, gestionando cientos de extensiones como `.blog`, `.online`, `.store` y `.news`.

**Registros de TLD de código de país**

Los registros de [ccTLD](/es/glossary/cctld/) operan bajo autoridad nacional o territorial en lugar de bajo acuerdos de [gTLD](/es/glossary/gtld/) de [ICANN](/es/glossary/icann/), aunque muchos continúan interactuando con los registradores mediante [EPP](/es/glossary/epp/):

- **Nominet** (.uk) — el registro del Reino Unido, una organización sin ánimo de lucro fundada en 1996.
- **DENIC** (.de) — el registro cooperativo de Alemania, gestionado por una organización de miembros de registradores.
- **AFNIC** (.fr) — el registro de Francia, operado bajo una delegación del gobierno francés.
- **VeriSign** / **CNNIC** (.cn) — el registro de código de país de China, operado por el Centro de Información de la Red de Internet de China.

Los registros de ccTLD están listados en la base de datos raíz de IANA en [iana.org/domains/root/db](https://www.iana.org/domains/root/db), que es el inventario autoritativo de todas las delegaciones de TLD en el mundo.

## Nuevos registros de gTLD

Antes de 2012, el conjunto de TLDs genéricos era pequeño y estable — `.com`, `.net`, `.org`, `.info`, `.biz` y un puñado más. El **Programa de Nuevos gTLD** de ICANN, lanzado en 2012, abrió solicitudes para casi cualquier cadena de caracteres como [nuevo gTLD](/es/glossary/new-gtld/). Más de 1.200 nuevas extensiones fueron finalmente delegadas.

Los registros de [gTLD](/es/glossary/gtld/)s nuevos operan bajo un **Acuerdo de Registro** con [ICANN](/es/glossary/icann/) que impone requisitos técnicos (soporte de EPP, DNSSEC, RDAP), estándares de rendimiento (disponibilidad del sistema, tiempos de respuesta a consultas) y obligaciones de política (mitigación del abuso, mecanismos de protección de marcas como el período de amanecer de la Trademark Clearinghouse y el sistema de Suspensión Rápida Uniforme).

ICANN mantiene la lista completa de acuerdos de registro para nuevos gTLDs en [icann.org/en/registry-agreements](https://www.icann.org/en/registry-agreements).

## Registros y dominios tokenizados

Un pequeño número de espacios de nombres de dominio alternativos — notablemente Unstoppable Domains y ENS (Ethereum Name Service) — emiten nombres similares a dominios anclados en cadenas de bloques públicas en lugar de en una zona DNS coordinada por ICANN. En estos sistemas, la propiedad se registra en un contrato inteligente en lugar de en una base de datos de registro, y la resolución requiere una extensión de navegador o un resolutor compatible en lugar de la ruta de consulta DNS estándar.

Estos espacios de nombres basados en blockchain no están delegados en la raíz de IANA y no son visibles para los resolutores DNS ordinarios por defecto. Operan de forma independiente del sistema de registro de ICANN descrito anteriormente.
