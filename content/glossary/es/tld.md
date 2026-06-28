---
title: TLD
date: '2026-05-22'
language: es
priority: P0
tags: ['glossary']
authors: ['namefiteam']
description: Un dominio de nivel superior (TLD) es la etiqueta más a la derecha de un nombre de dominio, como .com, .org o .de, delegado a través de la zona raíz de IANA bajo la supervisión de ICANN.
keywords: ['TLD', 'dominio de nivel superior', 'gTLD', 'ccTLD', 'nuevo gTLD', 'DNS', 'IANA', 'ICANN', 'zona raíz', 'registro de dominio']
also_known_as: ['Dominio de nivel superior']
level: 2
sources:
  - https://www.iana.org/domains/root/db
  - https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains
  - https://www.rfc-editor.org/rfc/rfc1591
  - https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains
relatedArticles:
  - /es/blog/what-is-a-tld/
  - /es/blog/top-tlds-to-secure-for-your-startup/
  - /es/blog/what-are-tokenized-domains/
  - /es/blog/how-tld-affects-domain-value/
  - /es/blog/top-tlds-to-secure-for-your-business/
relatedTopics:
  - /es/topics/choosing-a-tld/
  - /es/topics/domain-tokenization/
relatedSeries:
  - /es/series/best-tlds-by-industry/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/icann/
  - /es/glossary/registry/
  - /es/glossary/registrar/
  - /es/glossary/dns/
  - /es/glossary/web3/
---

**TLD** (*top-level domain*, dominio de nivel superior), también llamado **Dominio de nivel superior**, es la etiqueta más a la derecha de un nombre de dominio completamente cualificado — el segmento que sigue al último punto. En `www.example.com`, el TLD es `.com`; en `bbc.co.uk`, es `.uk`. Los TLDs se sitúan en el vértice de la jerarquía del [DNS](/es/glossary/dns/) y son la base sobre la que se construye cualquier otro nombre de dominio.

## Dónde se ubica el TLD en un nombre de dominio

El [DNS](/es/glossary/dns/) es un sistema de nomenclatura jerárquico con estructura de árbol. Leer un nombre de dominio de derecha a izquierda revela esa jerarquía:

1. **Raíz (`.`)** — El punto invisible en el extremo derecho. La [zona raíz](/es/glossary/root-zone/) es el punto de partida autoritativo: un pequeño conjunto de servidores mantenidos por la [IANA](/es/glossary/iana/) que conocen qué servidores de nombres son autoritativos para cada TLD.
2. **TLD** — La primera etiqueta visible desde la derecha (`.com`, `.org`, `.de`). Cada TLD tiene sus propios servidores de nombres autoritativos, operados por un [registro](/es/glossary/registry/) operador.
3. **[Dominio de segundo nivel](/es/glossary/second-level-domain/)** — La etiqueta inmediatamente a la izquierda del TLD (p. ej., `example` en `example.com`). Esto es lo que los registrantes adquieren de un registrador.
4. **Subdominio** — Cualquier etiqueta adicional a la izquierda (`www`, `mail`, `blog`), gestionada por quien controla el dominio de segundo nivel.

Cuando un resolutor busca `www.example.com`, primero pregunta a un servidor raíz dónde está `.com`, luego pregunta a los servidores de nombres del registro `.com` dónde está `example.com`, y luego pregunta a los servidores de nombres de `example.com` por el registro `www`. Esta cadena de delegación garantiza que ningún servidor único necesite conocer todos los nombres de dominio.

## Tipos de TLD

La IANA agrupa los TLDs en varias categorías:

| Categoría | Ejemplos | Notas |
|-----------|---------|-------|
| **[gTLD](/es/glossary/gtld/)** (genérico) | `.com`, `.net`, `.org`, `.info` | Originalmente sin restricciones o de alcance amplio; la clase más utilizada |
| **[ccTLD](/es/glossary/cctld/)** (código de país) | `.de`, `.uk`, `.jp`, `.us` | Códigos de dos letras asignados según ISO 3166-1; a menudo gobernados por autoridad nacional |
| **sTLD** (patrocinado) | `.gov`, `.edu`, `.mil`, `.museum` | Un subtipo de gTLD con una organización patrocinadora que restringe la elegibilidad |
| **[Nuevo gTLD](/es/glossary/new-gtld/)** | `.app`, `.blog`, `.shop`, `.xyz` | Introducido desde 2013 a través del programa de expansión de ICANN |
| **Infraestructura** | `.arpa` | Reservado para la infraestructura técnica del DNS; no disponible para registro |
| **Prueba / Reservado** | `.example`, `.localhost`, `.invalid` | Definido en RFC 2606; nunca delegado en la raíz pública |

`.arpa` es el único TLD de infraestructura actual. Alberga zonas de búsqueda inversa (`in-addr.arpa` para IPv4, `ip6.arpa` para IPv6) que mapean direcciones IP de vuelta a nombres de host.

Los TLDs de código de país originalmente estaban orientados a registrantes dentro del país nombrado, pero muchos han sido liberalizados para el registro global — `.io` (Territorio Británico del Océano Índico) y `.co` (Colombia) son ejemplos destacados utilizados internacionalmente como alternativas genéricas.

## Cómo se crean y delegan los TLDs

La lista autoritativa de todos los TLDs delegados se mantiene en la **base de datos de la zona raíz de IANA** ([iana.org/domains/root/db](https://www.iana.org/domains/root/db)), que mapea cada TLD a su conjunto de servidores de nombres autoritativos y a su [registro](/es/glossary/registry/) operador designado.

**La delegación de ccTLD** sigue la política establecida en el [RFC 1591](https://www.rfc-editor.org/rfc/rfc1591) (Postel, 1994): los códigos de dos letras se derivan de ISO 3166-1, y cada uno se delega a un fideicomisario — típicamente una agencia gubernamental o un organismo de reconocimiento nacional — que se espera sirva al interés público de ese país o territorio. La [IANA](/es/glossary/iana/) revisa las solicitudes de re-delegación cuando la gobernanza de un ccTLD cambia de manos.

**Los nuevos gTLDs** se crean a través de rondas de solicitud de [ICANN](/es/glossary/icann/). La primera expansión importante comenzó en 2012, cuando ICANN abrió solicitudes para cualquier cadena de tres o más caracteres como TLD genérico. Los solicitantes pagan una cuota base, se someten a una evaluación de capacidad técnica y estabilidad financiera, superan un proceso de objeción (que cubre motivos de comunidad, moralidad, propiedad intelectual y confusión de cadenas), y firman un Acuerdo de Registro con ICANN ([programa de nuevos gTLD de ICANN](https://www.icann.org/en/beginners-guide-to-new-generic-top-level-domains)). Más de 1.200 nuevos gTLDs fueron delegados en esa ronda. Una segunda ronda de solicitudes se abrió en 2026, expandiendo aún más el espacio de nombres.

Una vez delegado, el [registro](/es/glossary/registry/) operador de un TLD mantiene la base de datos autoritativa de todos los dominios de segundo nivel registrados bajo él, gestiona los servidores de nombres de la zona y establece las políticas (precios, elegibilidad, reglas de longitud) que los registradores deben seguir al vender nombres a los registrantes.

## Ejemplos y TLDs destacados

| TLD | Operador | Notas |
|-----|---------|-------|
| `.com` | Verisign | TLD más grande por volumen de registros; originalmente para entidades comerciales |
| `.net` | Verisign | Originalmente para proveedores de infraestructura de red; ahora sin restricciones |
| `.org` | Public Interest Registry | Originalmente para organizaciones sin fines de lucro; ahora en gran medida sin restricciones |
| `.gov` | GSA (EE. UU.) | Restringido a entidades gubernamentales federales, estatales y locales de EE. UU. |
| `.edu` | Educause | Restringido a instituciones de educación postsecundaria acreditadas en EE. UU. |
| `.uk` | Nominet | ccTLD del Reino Unido; los registros comunes usan etiquetas de segundo nivel como `.co.uk` |
| `.de` | DENIC | ccTLD de Alemania; uno de los ccTLD más grandes por volumen |
| `.io` | ICANN / transición de registro pendiente | Código del Territorio Británico del Océano Índico; ampliamente adoptado por empresas tecnológicas |
| `.app` | Google Registry | Nuevo gTLD; HTTPS requerido por política del registro |
| `.xyz` | XYZ.com LLC | Nuevo gTLD; gran volumen de registros gracias a los precios bajos |

## TLDs, valor y SEO

Los motores de búsqueda tratan los TLDs de dos formas diferenciadas:

**Segmentación geográfica:** Un [ccTLD](/es/glossary/cctld/) envía una señal geográfica. Google Search Central señala que un sitio `.de` se interpreta generalmente como dirigido a usuarios de habla alemana, y Google Search Console permite la segmentación geográfica explícita para los TLDs genéricos, pero aplica las señales de ccTLD automáticamente. Si una empresa pretende servir a una audiencia global desde un único dominio, un TLD genérico evita restricciones geográficas no deseadas.

**Posicionamiento:** Para la mayoría de los propósitos, el TLD en sí no es un factor de posicionamiento. Google ha declarado que [trata los nuevos gTLDs como cualquier otro TLD](https://developers.google.com/search/docs/crawling-indexing/url-structure#top-level-domains) y que un `.com` no supera inherentemente a un `.app` o `.xyz` en los resultados. Lo que importa es la autoridad y relevancia general del dominio, no la extensión por sí sola. Algunos TLDs antiguos con palabras clave ricas (como `.jobs` o `.travel`) llevan señales de contexto implícitas, pero estas son menores en comparación con la calidad del contenido y el perfil de enlaces entrantes.

**Percepción de marca y memorabilidad:** Los inversores en dominios y los especialistas en marketing observan que los TLDs cortos establecidos — especialmente `.com` — tienen un fuerte reconocimiento entre los usuarios finales, lo que puede afectar las tasas de clics en los resultados de búsqueda, la navegación directa y la confianza. Esta es una dinámica de mercado y comportamental, no algorítmica.

**Precios premium y de mercado secundario:** El valor percibido de un TLD afecta los precios del mercado secundario para los nombres de [dominio de segundo nivel](/es/glossary/second-level-domain/) bajo él. Los nombres `.com` obtienen precios más altos en el mercado secundario en promedio que los nombres equivalentes bajo extensiones más nuevas, lo que refleja la familiaridad del consumidor más que ninguna ventaja técnica.

## TLDs y dominios tokenizados

Varios sistemas de nomenclatura basados en blockchain operan fuera de la zona raíz de IANA, introduciendo efectivamente TLDs alternativos que solo se resuelven dentro de resolutores compatibles o extensiones de navegador. Los ejemplos incluyen `.eth` (Ethereum Name Service), `.crypto` y `.nft`. Estos no están delegados a través de la [IANA](/es/glossary/iana/) y no se resuelven en el DNS global por defecto, aunque los puentes y servicios de pasarela pueden proporcionar una interoperabilidad parcial.

Dentro del espacio de nombres administrado por IANA, la tokenización de nombres de [dominio de segundo nivel](/es/glossary/second-level-domain/) (que representa la propiedad de un nombre como `example.com` como un token blockchain) es un concepto separado del TLD en sí; el TLD permanece bajo la misma gobernanza de registro independientemente de cómo se registre la propiedad de los nombres individuales bajo él.
