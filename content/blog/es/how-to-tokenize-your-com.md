---
title: "Cómo tokenizar tu .com: Una guía paso a paso (2026)"
date: '2026-05-22'
language: es
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Un recorrido práctico y paso a paso para tokenizar un dominio que ya posees: elegibilidad, billeteras, tarifas, tiempo y qué esperar en cada pantalla. Escrito para propietarios, no para nerds de protocolos."
keywords: ['cómo tokenizar un dominio', 'cómo tokenizar un .com', 'tokenizar mi dominio', 'tokenizar un dominio existente', 'tokenizar un dominio paso a paso', 'tutorial de tokenización de dominios', 'guía para tokenizar .com', 'tokenizar .xyz', 'tokenizar .io', 'tokenizar en namefi', 'cómo hacer un dominio NFT', 'transferir dominio a NFT', 'dominio a NFT', 'proceso de tokenización de dominios', 'configuración de dominio tokenizado', 'tokenizar dominio ICANN']
---

Así que tienes un dominio —tal vez `mimarca.com`, tal vez un portafolio de nombres `.xyz`— y has decidido que quieres **tokenizarlo**. Esta guía te muestra qué sucede realmente, pantalla por pantalla, para que puedas planificar el tiempo, el dinero y el acceso que necesitarás antes de empezar.

Si todavía estás decidiendo *por qué* tokenizar, lee primero [¿Por qué tokenizar dominios on-chain?](/en/blog/why-tokenize-domains/). Si no estás seguro de *qué* significa exactamente la tokenización, [¿Qué son los dominios tokenizados?](/en/blog/what-are-tokenized-domains/) es el lugar para comenzar.

Este artículo asume que ya quieres hacerlo.

---

## Antes de empezar: Una lista de verificación de 60 segundos

Todo será mucho más fácil si cumples con lo siguiente antes de hacer clic en cualquier lugar:

- **Tienes el control del dominio en su [registrador](/en/glossary/registrar/) actual.** Puedes iniciar sesión, cambiar los servidores de nombres (nameservers) y aprobar transferencias / [códigos de autorización (auth codes)](/en/glossary/auth-code/).
- **Tienes una [billetera](/en/glossary/wallet/) de autocustodia.** MetaMask, Rabby, Coinbase Wallet o cualquier billetera EVM estándar. Asegúrate de tener realmente la [frase semilla (seed phrase)](/en/glossary/seed-phrase/) y no solo una cuenta de exchange.
- **La billetera tiene una pequeña cantidad de [gas](/en/glossary/gas/).** Unos pocos dólares en ETH o Base ETH cubren la transacción de acuñación (minting) [on-chain](/en/glossary/on-chain/). No necesitas mucho.
- **El dominio no está bloqueado, por expirar o en medio de una transferencia.** Los dominios dentro de los ~60 días de una [transferencia entre registradores](/en/glossary/cross-registrar-transfer/) reciente, o dentro de los 30 días de su vencimiento, a menudo no se pueden mover. Compruébalo primero.
- **Tienes tiempo.** Planea unos ~30 minutos de atención, más hasta 5–7 días de procesamiento en segundo plano para los movimientos entre registradores.

Si alguno de estos puntos es inestable, soluciónalo antes de comenzar. El proceso tolera mucho mejor la paciencia que las sorpresas.

---

## Paso 1: Conecta tu billetera en namefi.io

Dirígete a [namefi.io](https://namefi.io) y haz clic en "Connect Wallet" (Conectar billetera). Aprueba la conexión en tu billetera. Esta billetera se convertirá en el **propietario** del dominio tokenizado: el NFT vivirá aquí, y quien posea esta billetera posee el dominio.

> **Tómate esto en serio.** Si pierdes esta billetera, pierdes el lado on-chain de tu dominio. Tenemos una guía separada sobre [cómo recuperar un dominio tokenizado tras la pérdida de la billetera](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/): léela ahora, no después.

---

## Paso 2: Añade el dominio que quieres tokenizar

En tu panel (dashboard) de Namefi, busca o añade el dominio que ya posees. Namefi verificará su elegibilidad: el [registrador](/en/glossary/registrar/) en el que se encuentra actualmente, si se puede bloquear, si cumple con las reglas de transferencia de la [ICANN](/en/glossary/icann/) y si el [TLD](/en/glossary/tld/) es compatible.

Verás uno de tres estados:

- **Elegible ahora.** Procede al Paso 3.
- **Elegible tras una espera.** Generalmente significa que una transferencia reciente todavía está dentro de la ventana de 60 días de la ICANN. Espera a que termine el plazo y vuelve.
- **No compatible.** Algunos TLDs aún no son compatibles. Consulta la lista de TLDs compatibles o contacta a soporte.

---

## Paso 3: Elige una ruta de tokenización

Namefi suele ofrecer un par de rutas dependiendo del registrador actual del dominio:

1. **Transferir y luego tokenizar.** Mueve el dominio al registrador asociado acreditado de Namefi, y luego acuña el token on-chain. Esta es la ruta más común. Toma unos días debido al flujo de transferencia de la ICANN, no por nada relacionado con la blockchain.
2. **Tokenizar en el lugar (donde sea compatible).** Para algunas integraciones de registradores, el dominio se queda donde está y la capa on-chain se añade por encima. Es más rápido, pero solo está disponible para ciertos registradores asociados.

Verás la ruta que se aplica a tu dominio. El panel de control mostrará el tiempo estimado y cualquier tarifa por adelantado.

---

## Paso 4: Confirma el código de autorización / Aprueba la transferencia (si es necesario)

Para la ruta de transferencia, tomarás el [**código de autorización (auth code)**](/en/glossary/auth-code/) (a veces llamado código EPP) de tu registrador actual y lo pegarás en Namefi. Es posible que también necesites:

- Desbloquear el dominio en tu registrador actual.
- Aprobar un correo de confirmación enviado al contacto del titular (registrant).

Esta es la parte más lenta de todo el proceso. Calcula de 5 a 7 días para que se complete el movimiento entre registradores, aunque a menudo termina más rápido.

---

## Paso 5: Acuña el token On-Chain

Una vez que el dominio esté bajo la integración del registrador de Namefi, se te pedirá que **acuñes** (mint) la representación [NFT](/en/glossary/nft/) (un token [ERC-721](/en/glossary/erc-721/) estándar). Tu billetera se abrirá; confirmas una transacción; se paga el [gas](/en/glossary/gas/); y el token aterriza en tu billetera.

Este es el momento en que el dominio queda [*tokenizado*](/en/glossary/tokenize/). Ahora tienes:

- El registro tradicional [DNS](/en/glossary/dns/) / registrador (sigue siendo real y sigue siendo reconocido por la ICANN).
- Un NFT [on-chain](/en/glossary/on-chain/) en tu billetera que representa la propiedad.

A partir de este momento, el protocolo se encarga de mantener ambos sincronizados.

---

## Paso 6: Verifica en tu billetera y en un explorador de bloques

Abre la pestaña de NFTs de tu billetera. Deberías ver el nuevo NFT del dominio tokenizado. Haz clic para ir a un explorador de bloques (Etherscan, Basescan, etc.) y confirmar el contrato y la dirección de propiedad. Este es un buen momento para tomar una captura de pantalla para tus propios registros.

Si tienes una [billetera de hardware](/en/glossary/hardware-wallet/), este es un gran momento para transferirle el NFT. La transferencia es una transferencia NFT normal y cuesta gas.

---

## Paso 7: Gestiona DNS y renovaciones

Tokenizar un dominio no cambia cómo resuelve en internet. Tus servidores de nombres, registros A, registros MX, DNSSEC... todo sigue funcionando. Puedes gestionarlos desde el panel de Namefi, o delegar a tu proveedor de DNS existente (Cloudflare, Route53, etc.) tal como lo hacías antes.

Para más detalles sobre lo que cambia (y lo que no) en la capa DNS, consulta [El DNS sigue funcionando: Servidores de nombres, correo electrónico y DNSSEC en un dominio tokenizado](/en/blog/dns-on-tokenized-domains/).

Las renovaciones continúan realizándose a través de la capa del registrador. Namefi se encarga de la facturación por el lado del registrador; tú mantienes la propiedad on-chain.

---

## Qué esperar en cuanto a costos

Básicamente, estás pagando por tres cosas:

- **Tarifas del registrador.** El precio normal de la renovación anual del dominio, más cualquier tarifa de transferencia. Estos son costos del mundo real que existen independientemente de la tokenización.
- **Gas.** Unos pocos dólares por la transacción de acuñación (minting), dependiendo de la cadena (Base es más barata que la capa 1 de Ethereum).
- **Tarifas del protocolo.** Las propias tarifas de Namefi por el servicio de tokenización. Estas se muestran en el panel antes de que confirmes.

No hay sorpresas ocultas. Si un número no está en la pantalla de confirmación, no es un cargo.

---

## Inconvenientes comunes

- **"Mi registrador no quiere liberar el código de autorización (auth code)."** Algunos registradores ocultan esto en las profundidades de su interfaz web o requieren abrir un ticket de soporte. Sé paciente y persistente.
- **"Desbloqueé el dominio pero el sistema aún dice que está bloqueado."** Los registradores a menudo almacenan en caché el estado de bloqueo hasta por 24 horas. Espera un día y actualiza.
- **"Mi billetera muestra el NFT, pero el dominio todavía aparece en mi antiguo registrador."** Durante la ventana de transferencia, ambas partes pueden mostrar brevemente la propiedad. El lado on-chain se vuelve autoritativo una vez que se liquida la transferencia.
- **"Quiero usar una [multisig](/en/glossary/multi-sig/) como propietario."** Es compatible. Conecta la billetera multisig. Solo asegúrate de que realmente puedes ejecutar transacciones desde ella: una multisig donde has perdido a los firmantes es un dominio que también has perdido. Contexto: [¿Las billeteras multisig realmente mejoran la seguridad?](/en/blog/do-multisig-wallets-actually-improve-security/)

---

## Aviso amigable (¡Léeme!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo es asesoramiento legal, financiero, fiscal, contable, médico ni de ningún otro tipo profesional.** Escribimos estas publicaciones para educarnos y como una conveniencia para nuestros clientes. La información aquí puede estar desactualizada, ser específica de una zona geográfica o simplemente ser incorrecta: también cometemos errores.
>
> Para cualquier decisión importante, **por favor consulta a un verdadero profesional (¡en serio!)**. O si ese no es tu estilo, pregúntale a un amigo, pregunta en Twitter, en Reddit, a una IA o a un vidente. En resumen: **DYOR — Haz tu propia investigación (Do Your Own Research)**. Aprendamos y divirtámonos.

---

## Resumen

- Tokenizar un dominio que ya posees es un proceso interactivo guiado de unos ~30 minutos, más hasta una semana de espera del lado del registrador.
- Necesitas: control sobre el dominio, una billetera de autocustodia, una pequeña cantidad de gas y paciencia.
- La acuñación (minting) on-chain es el *último* paso; la mayor parte del trabajo es el aburrido flujo de transferencia de registradores que la ICANN impone independientemente de la blockchain.
- Después de la tokenización, tienes **dos capas sincronizadas de propiedad**: el registro DNS tradicional y un NFT en tu billetera.
- Lee la [guía de recuperación por pérdida de billetera](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) *antes* de tokenizar, no después.

¿Listo para empezar? Dirígete a [namefi.io](https://namefi.io).