---
title: DNS
date: '2025-06-30'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: El sistema de nomenclatura jerárquico que traduce nombres de dominio legibles por humanos en las direcciones IP que las computadoras usan para enrutar el tráfico por internet.
keywords: ['DNS', 'sistema de nombres de dominio', 'resolución de nombres', 'búsqueda DNS', 'registros DNS', 'servidor de nombres', 'resolvedor recursivo', 'DNSSEC', 'infraestructura de internet']
also_known_as: ['Sistema de Nombres de Dominio']
level: 2
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.iana.org/domains/root
  - https://www.cloudflare.com/learning/dns/what-is-dns/
  - https://www.icann.org/resources/pages/what-2012-02-25-en
relatedArticles:
  - /es/blog/what-are-tokenized-domains/
  - /es/blog/the-myetherwallet-bgp-dns-attack/
  - /es/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /es/blog/the-sea-turtle-dns-espionage/
  - /es/blog/the-dnspionage-campaign/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/name-change-game-change/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/tld/
  - /es/glossary/icann/
  - /es/glossary/registry/
  - /es/glossary/web3/
---

**DNS** (el *Sistema de Nombres de Dominio*) es el sistema de nomenclatura distribuido y jerárquico de internet que traduce nombres de dominio legibles por humanos —como `example.com`— en las [direcciones IP](/es/glossary/ip-address/) que los equipos de red usan para enrutar paquetes a través de internet. Sin DNS, cada usuario tendría que recordar las direcciones numéricas de cada sitio que desease visitar. Definido en el [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034) y el [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035) (publicados por el IETF en 1987 y aún fundamentales hoy), el DNS sigue siendo uno de los protocolos centrales de internet.

## Qué hace el DNS

El DNS realiza la **resolución de nombres**: dado un nombre de dominio, devuelve los registros de recursos asociados a ese nombre — más comúnmente una [dirección IP](/es/glossary/ip-address/) para que un navegador o aplicación sepa dónde enviar su solicitud de conexión. El sistema también se usa para enrutar el correo electrónico (registros MX), verificar la propiedad del dominio (registros TXT) y delegar la autoridad sobre una zona a un conjunto determinado de servidores (registros NS).

Como el DNS se lee con mucha más frecuencia de lo que se actualiza, el protocolo está optimizado para lecturas rápidas y en caché distribuidas entre millones de servidores en todo el mundo, más que para la consistencia inmediata.

## Cómo funciona una búsqueda DNS

Cuando escribes `example.com` en un navegador, comienza un proceso de resolución en varios pasos:

1. **Comprobación de la caché local.** El sistema operativo comprueba primero su propia caché DNS. Si allí hay una respuesta reciente y aún válida, la búsqueda termina de inmediato.

2. **Resolvedor recursivo.** Si no existe respuesta en caché, la consulta se reenvía a un [resolvedor DNS](/es/glossary/dns-resolver/) — un servidor operado por tu ISP, una empresa (como el `1.1.1.1` de Cloudflare o el `8.8.8.8` de Google) o tu organización. Este resolvedor asume el trabajo de encontrar la respuesta en tu nombre; este modo de operación se denomina **resolución recursiva**.

3. **Servidores de nombres raíz.** Si el resolvedor no tiene respuesta en caché, contacta a uno de los 13 clústeres lógicos de servidores de nombres de la [zona raíz](/es/glossary/root-zone/) (etiquetados de `a` a `m`). El servidor raíz no conoce la respuesta final, pero responde con una referencia a los [servidores de nombres](/es/glossary/nameserver/) responsables del dominio de nivel superior (TLD) correspondiente, como `.com` o `.org`. La [IANA](https://www.iana.org/domains/root) publica y mantiene la base de datos de la zona raíz.

4. **Servidores de nombres TLD.** El resolvedor consulta los servidores de nombres TLD. Estos responden con una referencia a los **servidores de nombres autoritativos** del dominio específico (`example.com`).

5. **Servidores de nombres autoritativos.** El resolvedor consulta el [servidor de nombres](/es/glossary/nameserver/) autoritativo del dominio, que contiene los registros DNS reales. El servidor autoritativo devuelve el registro de recurso — por ejemplo, un registro `A` con una dirección IPv4.

6. **Respuesta y caché.** El resolvedor devuelve la respuesta al cliente y la guarda en caché durante el tiempo especificado por el [TTL](/es/glossary/ttl/) (Time to Live) del registro. Las consultas posteriores para el mismo nombre dentro de la ventana del TTL se sirven desde la caché, reduciendo la latencia y la carga en los servidores superiores.

Este patrón — en el que el resolvedor hace el trabajo iterativo y el cliente solo habla con un servidor — se denomina **resolución recursiva**. En contraste, la **resolución iterativa** es cuando el propio cliente consulta cada nivel de la jerarquía en secuencia; esto es raro en la práctica, pero es como los resolvedores recorren internamente la jerarquía ([RFC 1034 §5.3](https://datatracker.ietf.org/doc/html/rfc1034#section-5.3)).

## La jerarquía DNS y los principales tipos de registros

El DNS está organizado como un árbol invertido. La raíz (`.`) está en la cima; debajo de ella están los TLDs (`.com`, `.net`, `.io`, códigos de país como `.de`); debajo de cada TLD están los dominios de segundo nivel (`example.com`); y estos pueden tener subdominios de profundidad arbitraria (`mail.example.com`).

Cada nodo de este árbol se denomina **zona**, y el servidor de nombres autoritativo de una zona contiene los **registros de recursos** de esa zona. Los [tipos de registros DNS](/es/glossary/dns-record-types/) más frecuentes son:

| Registro | Propósito | Valor de ejemplo |
|----------|-----------|-----------------|
| **A** | Mapea un nombre a una dirección IPv4 | `93.184.216.34` |
| **AAAA** | Mapea un nombre a una dirección IPv6 | `2606:2800:21f:cb07::1` |
| **CNAME** | Crea un alias de un nombre a otro nombre canónico | `www → example.com` |
| **MX** | Especifica los servidores de correo del dominio, con prioridad | `10 mail.example.com` |
| **NS** | Delega una zona a un conjunto de servidores de nombres | `ns1.example.com` |
| **TXT** | Almacena texto arbitrario; usado para SPF, DKIM, verificación de dominio | `"v=spf1 include:…"` |
| **SOA** | Start of Authority — metadatos sobre la propia zona | serial, tiempos de refresco y reintento |

Los registros `CNAME` no pueden colocarse en el vértice de zona (el dominio simple `example.com`) porque un `CNAME` debe ser el único registro en un nombre, pero el vértice también requiere registros `NS` y `SOA`. Muchos proveedores DNS resuelven esto con «aplanamiento de CNAME» propietario o tipos de pseudo-registros `ALIAS`/`ANAME`.

## Quién gestiona el DNS

La gobernanza y operación del DNS está distribuida entre varias capas de actores:

- **[ICANN](/es/glossary/icann/) / IANA.** La Corporación de Internet para la Asignación de Nombres y Números supervisa la [zona raíz](/es/glossary/root-zone/) y coordina el espacio de nombres DNS global. La IANA, una función de ICANN, mantiene la [base de datos de la zona raíz](https://www.iana.org/domains/root) que lista todos los TLDs y sus servidores de nombres autoritativos.

- **Registros.** Un [registro](/es/glossary/registry/) opera la base de datos autoritativa de un TLD específico. Por ejemplo, Verisign opera `.com` y `.net`; la Public Interest Registry opera `.org`. Los registros publican y mantienen los registros NS que apuntan a los servidores de nombres de cada dominio.

- **Registradores.** Un [registrador](/es/glossary/registrar/) es una organización acreditada por ICANN (o el registro correspondiente) para vender nombres de dominio al público y enviar datos de registro al registro en nombre de los clientes.

- **Resolvedores recursivos.** Los resolvedores DNS son operados por ISPs, servicios de DNS públicos (Cloudflare, Google, Quad9), empresas y routers domésticos. Gestionan las búsquedas iterativas descritas anteriormente y almacenan resultados en caché para reducir la latencia de las consultas ([Cloudflare Learning — ¿Qué es el DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)).

- **Servidores de nombres autoritativos.** Alojados por propietarios de dominios o sus proveedores de DNS, estos servidores contienen los archivos de zona reales y responden a las consultas del resolvedor con respuestas definitivas.

## Seguridad

Las especificaciones originales del DNS fueron diseñadas para la fiabilidad y la escala, no para la seguridad. Con el tiempo han surgido varias vulnerabilidades y mecanismos de protección:

**Envenenamiento de caché.** Un atacante que puede inyectar una respuesta DNS falsificada en la caché de un resolvedor puede redirigir a los usuarios desde sitios legítimos a sitios maliciosos sin que lo sepan. El ataque Kaminsky (2008) demostró esto a escala, lo que llevó a una adopción más amplia de la aleatorización de puertos y [DNSSEC](/es/glossary/dnssec/).

**DNSSEC.** Las Extensiones de Seguridad DNS, definidas en los RFC 4033–4035, añaden firmas criptográficas a los registros DNS. Un resolvedor que valida las firmas [DNSSEC](/es/glossary/dnssec/) puede detectar respuestas manipuladas. La adopción crece pero es desigual: en 2024, aproximadamente el 90 % de la zona raíz y los principales TLDs están firmados, pero la validación de extremo a extremo depende de que todas las zonas de la cadena estén firmadas y de que los resolvedores comprueben las firmas.

**Secuestro de DNS.** Los atacantes que comprometen una cuenta de registrador, los sistemas del registro o el resolvedor de un ISP pueden redirigir respuestas DNS a escala. Las defensas incluyen la autenticación multifactor a nivel de registrador, los bloqueos de registro (EPP `serverTransferProhibited`) y la monitorización de cambios inesperados en registros NS o A.

**DNS sobre HTTPS / DNS sobre TLS (DoH / DoT).** Estos protocolos cifran las consultas DNS entre clientes y resolvedores, evitando la escucha clandestina y la modificación en ruta de las consultas en tránsito — una protección complementaria a DNSSEC, que aborda la integridad de los datos en lugar de la privacidad.

## DNS y dominios tokenizados

Algunos sistemas de dominio basados en blockchain (como Ethereum Name Service) mantienen sus propios mapeos nombre→dirección completamente en cadena, independientemente de la jerarquía DNS tradicional. Otros emiten tokens en cadena que representan la propiedad de un dominio registrado convencionalmente, donde el archivo de zona DNS subyacente sigue alojándose en servidores de nombres estándar. En este último caso, la resolución DNS funciona a través del flujo de búsqueda normal descrito anteriormente; el registro en blockchain atestigua la propiedad pero no forma parte de la ruta de resolución. Los dos sistemas — registros de propiedad en cadena y el DNS global — son capas distintas que pueden coexistir o ser conectadas mediante resolvedores de pasarela.

---

*Fuentes: [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034), [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035), [Base de datos de la zona raíz de IANA](https://www.iana.org/domains/root), [Cloudflare Learning — ¿Qué es el DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/), [ICANN — ¿Qué es el DNS?](https://www.icann.org/resources/pages/what-2012-02-25-en)*
