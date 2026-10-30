---
title: 'Cómo instalar un certificado SSL y comprobar HTTPS'
date: '2026-10-22'
updated: '2026-10-29'
language: es
tags: ['https', 'tls', 'certificates', 'security']
authors: ['namefiteam']
draft: false
cluster: domain-security
format: guide
description: Instala un certificado SSL con tu proveedor o Certbot. Elige la validación del dominio, comprueba HTTPS y prueba la renovación automática.
ogImage: ../../assets/how-to-install-an-ssl-certificate-og.jpg
keywords: ['instalar certificado ssl', 'instalación ssl', 'activar https', 'ssl nginx', 'certbot nginx', 'configurar https', 'validación de dominio', 'validación dns', 'renovación automática de certificados', 'errores ssl']
relatedArticles:
  - /es/blog/what-is-https/
  - /es/blog/dns-is-the-control-plane/
  - /es/blog/how-domain-hijacking-actually-happens/
  - /es/blog/the-myetherwallet-bgp-dns-attack/
  - /es/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /es/topics/domain-security/
  - /es/topics/domain-basics/
relatedSeries:
  - /es/series/domain-apocalypse/
  - /es/series/blockchain-concepts/
relatedGlossary:
  - /es/glossary/dns/
  - /es/glossary/registrar/
  - /es/glossary/public-key/
  - /es/glossary/private-key/
  - /es/glossary/dnssec/
---

Para instalar un certificado SSL, empieza por el servicio que aloja tu sitio. Tu proveedor de alojamiento puede administrar los certificados. Un servidor que administras necesita su propio proceso de certificación.

El nombre habitual es certificado SSL. HTTPS moderno utiliza TLS. Nuestra [explicación de HTTPS](/es/blog/what-is-https/) presenta los conceptos. Esta guía explica la instalación y las comprobaciones posteriores.

## Tu alojamiento determina el método de instalación

[Let’s Encrypt recomienda consultar primero al proveedor de alojamiento](#tu-proveedor-puede-administrar-los-certificados). Un proveedor puede ejecutar el cliente ACME y renovar los certificados. Comprar un dominio no determina quién administra HTTPS.

| Tu configuración | Tu siguiente paso |
| --- | --- |
| Plataforma web o cuenta de alojamiento administrada | Consulta las instrucciones del proveedor sobre dominios propios y HTTPS |
| Servidor Linux que administras | Elige un cliente ACME y las instrucciones para tu servidor web |
| Sitio detrás de un proxy inverso | Comprueba el certificado público y la conexión al servidor de origen |

Inicia sesión con una cuenta autorizada para administrar el sitio. No incluyas claves privadas ni credenciales DNS en solicitudes de soporte o repositorios públicos.

## Los usuarios de alojamiento administrado deben activar el servicio de certificados del proveedor

1. Agrega el dominio al sitio correcto en tu cuenta de alojamiento.
2. Configura los registros DNS que indique el proveedor.
3. Activa HTTPS o los certificados automáticos, si el proveedor lo requiere.
4. Espera a que el proveedor confirme la emisión.
5. Abre el sitio mediante HTTPS y comprueba el nombre del servidor.

Las instrucciones del proveedor especifican los controles y valores DNS. No copies los registros de otro sitio. Tu [registrador](/es/glossary/registrar/), proveedor DNS y alojamiento pueden ser empresas distintas.

## Los administradores de servidores pueden utilizar Certbot con Nginx

Este procedimiento requiere Linux con soporte para snap, Nginx, un sitio HTTP existente y acceso de administrador. Consulta [las instrucciones de Certbot para Nginx](#certbot-configura-nginx) para conocer los requisitos y comandos completos. Selecciona otra configuración si utilizas otro sistema operativo o servidor.

Respalda la configuración de Nginx antes de permitir que Certbot la modifique. Confirma que DNS dirige las solicitudes al servidor previsto. La validación HTTP necesita acceso público al puerto TCP `80`. HTTPS utiliza el puerto TCP `443`.

Después de instalar Certbot según las instrucciones seleccionadas, ejecuta `sudo certbot --nginx`. Certbot puede obtener el certificado y configurar Nginx. Selecciona todos los nombres que necesita el sitio. El comando `sudo certbot certonly --nginx` obtiene un certificado sin instalarlo en la configuración del servidor.

Después, ejecuta `sudo certbot renew --dry-run`. Los paquetes de Certbot incluyen un mecanismo de renovación programada. Comprueba el temporizador o la configuración de cron. Una prueba correcta comprueba el proceso en ese momento. Sigue supervisando el vencimiento del certificado y los errores de renovación.

## La validación DNS permite certificados comodín y servidores con acceso restringido

[HTTP-01 y DNS-01 demuestran el control del dominio de formas diferentes](#elige-el-método-de-validación). HTTP-01 recupera un archivo de validación mediante el puerto `80`. HTTP-01 no permite emitir certificados comodín.

DNS-01 utiliza un registro TXT bajo `_acme-challenge`. DNS-01 permite certificados comodín y servidores sin acceso HTTP público. Utiliza una integración del cliente ACME que automatice las actualizaciones DNS. Los cambios manuales del registro TXT requieren trabajo continuo, salvo que otro proceso los automatice.

Utiliza credenciales DNS con permisos limitados cuando el proveedor lo permita. Let’s Encrypt advierte que guardar credenciales DNS completas en un servidor comprometido aumenta los daños. Delegar la zona de validación puede separar la validación de la zona DNS principal.

## Los proxies inversos también requieren comprobar el servidor de origen

Una conexión correcta entre el navegador y el proxy no demuestra que el proxy valide el certificado del origen. En Cloudflare, [Full (strict) valida la conexión al origen](#verifica-la-conexión-al-origen).

Cloudflare requiere un certificado vigente, un emisor aceptado y un nombre coincidente. El origen debe aceptar HTTPS en el puerto `443`. Configura el origen antes de activar el modo. Un certificado de origen no válido puede provocar el error `526`.

## Debes comprobar el sitio después de la instalación

Si Chrome indica un error de conexión segura, consulta la [guía de diagnóstico de conexiones de Chrome](/es/blog/fix-chrome-secure-connection-error/) para registrar el código exacto y elegir las comprobaciones pertinentes.

Abre cada nombre previsto con `https://`. Revisa el nombre, emisor y periodo de validez del certificado. Comprueba una página importante y un formulario, además de la página de inicio.

Busca [contenido mixto](#elimina-el-contenido-mixto) en la consola del navegador: una página HTTPS puede solicitar recursos por HTTP. Actualiza las direcciones de recursos y la configuración de la aplicación cuando corresponda. Comprueba que las solicitudes HTTP redirijan a la dirección HTTPS prevista sin formar un bucle.

| Problema | Primera comprobación |
| --- | --- |
| Falla la validación del dominio | Destino DNS, método de validación y acceso público a la validación |
| El navegador indica otro nombre | Nombres del certificado y configuración del servidor elegida para la solicitud |
| Fallan algunos recursos | Solicitudes HTTP en la consola del navegador |
| Cloudflare indica el error 526 | Vigencia, emisor y nombre del certificado del origen |
| Falla la prueba de renovación | Registros del cliente, acceso a la validación y autorización DNS |

La instalación termina cuando el sitio presenta el certificado correcto, las solicitudes funcionan y la prueba de renovación finaliza correctamente. Asigna a una persona la supervisión de la próxima renovación.

## Estas fuentes describen los métodos de instalación compatibles

### Tu proveedor puede administrar los certificados

Let’s Encrypt — [Getting Started](https://letsencrypt.org/getting-started/#getting-certificates-through-your-hosting-provider), consultado el 22 de octubre de 2026. La página distingue los certificados administrados por el proveedor de la ejecución de un cliente ACME propio.

### Certbot configura Nginx

EFF — [Nginx on Linux with snap](https://certbot.eff.org/instructions?ws=nginx&os=snap), consultado el 22 de octubre de 2026. Las instrucciones incluyen la instalación, la opción de obtener solamente el certificado y la prueba de renovación.

### Elige el método de validación

Let’s Encrypt — [Challenge Types](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge), consultado el 22 de octubre de 2026. Las secciones HTTP-01 y DNS-01 explican los puertos, certificados comodín, automatización y permisos de las credenciales.

### Verifica la conexión al origen

Cloudflare — [Full (strict)](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/#required-setup), consultado el 22 de octubre de 2026. Los requisitos especifican las comprobaciones del certificado del origen y el acceso HTTPS.

### Elimina el contenido mixto

MDN — [Mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content), consultado el 22 de octubre de 2026. La guía explica las solicitudes HTTP dentro de páginas HTTPS.
