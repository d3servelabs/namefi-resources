---
title: "Cómo tokenizar tu .com: Una guía paso a paso (2026)"
date: '2026-05-22'
language: es
tags: ['guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['iria-maquieira']
draft: false
description: "Un recorrido práctico paso a paso para tokenizar un dominio que ya posees: elegibilidad, billeteras, tarifas, tiempo y qué esperar en cada pantalla. Escrito para propietarios, no para nerds de protocolos."
keywords: ['cómo tokenizar un dominio', 'cómo tokenizar un .com', 'tokenizar mi dominio', 'tokenizar un dominio existente', 'tokenizar un dominio paso a paso', 'tutorial de tokenización de dominios', 'guía para tokenizar .com', 'tokenizar .xyz', 'tokenizar .io', 'tokenizar con namefi', 'cómo hacer un dominio NFT', 'transferir dominio a NFT', 'dominio a NFT', 'proceso de tokenización de dominios', 'configuración de dominio tokenizado', 'tokenizar dominio ICANN']
relatedArticles:
  - /es/blog/tokenize-your-com-to-flip-it/
  - /es/blog/how-to-sell-a-domain-name-you-own/
  - /es/blog/dns-on-tokenized-domains/
  - /es/blog/how-tokenized-marketplaces-replace-escrow/
  - /es/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /es/topics/domain-tokenization/
  - /es/topics/domain-investing/
relatedSeries:
  - /es/series/tokenize-your-com/
  - /es/series/domain-flipping-skills/
relatedGlossary:
  - /es/glossary/registrar/
  - /es/glossary/icann/
  - /es/glossary/dns/
  - /es/glossary/tld/
  - /es/glossary/web3/
---

Así que posees un dominio —tal vez `mybrand.com`, tal vez un portafolio de nombres `.xyz`— y has decidido que quieres **tokenizarlo**. Esta guía detalla lo que realmente sucede, pantalla por pantalla, para que puedas planificar el tiempo, el dinero y el acceso que necesitarás antes de empezar.

Si todavía estás decidiendo *por qué* tokenizar, lee primero [¿Por qué tokenizar dominios on-chain?](/es/blog/why-tokenize-domains/). Si ni siquiera estás seguro de *qué* significa la tokenización, [¿Qué son los dominios tokenizados?](/es/blog/what-are-tokenized-domains/) es el lugar para comenzar.

Esta publicación asume que ya quieres hacerlo.

---

## Antes de empezar: Una lista de verificación de 60 segundos

Tendrás una experiencia mucho más fluida si estas condiciones se cumplen antes de hacer clic en cualquier lugar:

- **Controlas el dominio en su [registrador](/es/glossary/registrar/) actual.** Puedes iniciar sesión, cambiar los servidores de nombres (nameservers) y aprobar transferencias / [códigos de autorización (auth codes)](/es/glossary/auth-code/).
- **Tienes una [billetera (wallet)](/es/glossary/wallet/) de autocustodia.** MetaMask, Rabby, Coinbase Wallet, o cualquier billetera EVM estándar. Asegúrate de tener realmente la [frase semilla (seed phrase)](/es/glossary/seed-phrase/), no solo una cuenta en un exchange.
- **La billetera tiene una pequeña cantidad de [gas](/es/glossary/gas/).** Unos pocos dólares de ETH o Base ETH cubren la transacción de minteo (acuñación) [on-chain](/es/glossary/on-chain/). No necesitas mucho.
- **El dominio no está bloqueado, a punto de expirar ni en medio de una transferencia.** Los dominios que están dentro de los ~60 días posteriores a una [transferencia entre registradores](/es/glossary/cross-registrar-transfer/) reciente, o a 30 días de su expiración, a menudo no se pueden mover. Compruébalo primero.
- **Tienes tiempo.** Calcula unos 30 minutos de atención, más hasta 5–7 días de procesamiento en segundo plano para movimientos entre registradores.

Si algo de esto no es seguro, soluciónalo antes de empezar. El proceso tolera la paciencia mucho mejor que las sorpresas.

---

## Paso 1: Conecta tu billetera en namefi.io

Dirígete a [namefi.io](https://namefi.io) y haz clic en "Connect Wallet" (Conectar Billetera). Aprueba la conexión en tu billetera. Esta billetera se convertirá en la **propietaria** del [dominio tokenizado](/es/glossary/tokenized-domain/): el NFT vivirá aquí, y quien posea esta billetera, posee el dominio.

> **Toma esto en serio.** Si pierdes esta billetera, pierdes el lado on-chain de tu dominio. Tenemos una guía separada sobre [cómo recuperar un dominio tokenizado tras la pérdida de la billetera](/es/blog/recovering-a-tokenized-domain-after-wallet-loss/); léela ahora, no después.

---

## Paso 2: Añade el dominio que quieres tokenizar

En tu panel de control de Namefi, busca o añade el dominio que ya posees. Namefi verificará su elegibilidad: el [registrador](/es/glossary/registrar/) en el que se encuentra actualmente, si se puede bloquear, si cumple con las reglas de transferencia de la [ICANN](/es/glossary/icann/) y si el [TLD](/es/glossary/tld/) es compatible.

Verás uno de estos tres estados:

- **Elegible ahora.** Procede al Paso 3.
- **Elegible tras una espera.** Generalmente significa que una transferencia reciente todavía está dentro de la ventana de 60 días de la ICANN. Espera a que pase el plazo y vuelve.
- **No compatible.** Algunos TLDs aún no son compatibles. Consulta la lista de TLDs compatibles o contacta a soporte.

---

## Paso 3: Elige una ruta de tokenización

Namefi suele ofrecer un par de rutas dependiendo del registrador actual del dominio:

1. **Transferir y luego tokenizar.** Mueve el dominio al socio registrador acreditado de Namefi y luego mintea el token on-chain. Esta es la ruta más común. Tarda unos días debido al flujo de transferencia de la ICANN, no por nada relacionado con la [blockchain](/es/glossary/blockchain/).
2. **Tokenizar en el lugar (donde sea compatible).** Para algunas integraciones de registradores, el dominio permanece donde está y la capa on-chain se añade encima. Es más rápido, pero solo está disponible para ciertos registradores asociados.

Verás la ruta que se aplica a tu dominio. El panel de control mostrará el tiempo estimado y cualquier tarifa por adelantado.

---

## Paso 4: Confirma el código de autorización / Aprueba la transferencia (si es necesario)

Para la ruta de transferencia, tomarás el [**código de autorización (auth code)**](/es/glossary/auth-code/) (a veces llamado código EPP) de tu registrador actual y lo pegarás en Namefi. Es posible que también necesites:

- Desbloquear el dominio en tu registrador actual.
- Aprobar un correo electrónico de confirmación enviado al contacto del solicitante de registro.

Esta es la parte más lenta de todo el proceso. Planifica entre 5 y 7 días para que se complete el movimiento entre registradores, aunque a menudo termina más rápido.

---

## Paso 5: Mintear el token on-chain

Una vez que el dominio esté bajo la integración del registrador de Namefi, se te pedirá que **mintees** la representación [NFT](/es/glossary/nft/) (un token [ERC-721](/es/glossary/erc-721/) estándar). Tu billetera aparecerá; confirmas una transacción; se paga el [gas](/es/glossary/gas/); el token aterriza en tu billetera.

Este es el momento en que el dominio queda [*tokenizado*](/es/glossary/tokenize/). Ahora tienes:

- El registro [DNS](/es/glossary/dns/) / registrador tradicional (sigue siendo real, sigue siendo reconocido por la ICANN).
- Un NFT [on-chain](/es/glossary/on-chain/) en tu billetera que representa la propiedad.

En adelante, el protocolo mantendrá a ambos sincronizados.

---

## Paso 6: Verifica en tu billetera y en un explorador de bloques

Abre la pestaña de NFTs de tu billetera. Deberías ver el nuevo NFT del dominio tokenizado. Haz clic en él para ir a un explorador de bloques (Etherscan, Basescan, etc.) y confirmar el contrato y la dirección de propiedad. Este es un buen momento para tomar una captura de pantalla para tus propios registros.

Si tienes una [billetera de hardware (hardware wallet)](/es/glossary/hardware-wallet/), este es un gran momento para mover el NFT hacia ella. La transferencia es una transferencia de NFT normal y cuesta gas.

---

## Paso 7: Gestiona los DNS y las renovaciones

Tokenizar un dominio no cambia cómo se resuelve. Tus servidores de nombres, registros A, registros MX, [DNSSEC](/es/glossary/dnssec/)... todo sigue funcionando. Puedes gestionarlos desde el panel de control de Namefi, o delegarlos a tu proveedor de DNS existente (Cloudflare, Route53, etc.) tal como antes.

Para obtener detalles sobre qué cambia (y qué no) en la capa DNS, consulta [El DNS sigue funcionando: Servidores de nombres, correo electrónico y DNSSEC en un dominio tokenizado](/es/blog/dns-on-tokenized-domains/).

Las renovaciones siguen ocurriendo a través de la capa del registrador. Namefi se encarga de la facturación del lado del registrador; tú conservas la propiedad on-chain.

---

## Qué esperar en cuanto a costos

Aproximadamente, estás pagando por tres cosas:

- **Tarifas del registrador.** El precio normal de renovación anual del dominio, más cualquier tarifa de transferencia. Estos son costos del mundo real que existen independientemente de la tokenización.
- **Gas.** Unos pocos dólares para la transacción de minteo, dependiendo de en qué cadena (Base es más barato que [Ethereum](/es/glossary/ethereum/) L1).
- **Tarifas del protocolo.** Las tarifas propias de Namefi por el servicio de tokenización. Estas se muestran en el panel de control antes de que confirmes.

No hay sorpresas ocultas. Si un número no está en la pantalla de confirmación, no es un cargo.

---

## Inconvenientes comunes

- **"Mi registrador no libera el código de autorización."** Algunos registradores ocultan esto en lo profundo de su interfaz de usuario o requieren un ticket de soporte. Sé paciente y persistente.
- **"Desbloqueé el dominio pero el sistema aún dice que está bloqueado."** Los registradores a menudo guardan en caché el estado de bloqueo hasta por 24 horas. Espera un día y actualiza.
- **"Mi billetera muestra el NFT, pero el dominio todavía aparece en mi antiguo registrador."** Durante la ventana de transferencia, ambas partes pueden mostrar la propiedad brevemente. El lado on-chain se vuelve autoritativo después de que la transferencia se liquida.
- **"Quiero usar una [multisig](/es/glossary/multi-sig/) como propietario."** Es compatible. Conecta la billetera multisig. Solo asegúrate de que realmente puedes ejecutar transacciones desde ella: una multisig en la que has perdido firmantes es un dominio que también has perdido. Contexto: [¿Las billeteras multifirma (multisig) realmente mejoran la seguridad?](/es/blog/do-multisig-wallets-actually-improve-security/)

---

## Descargo de responsabilidad amistoso (¡Léeme!)

> No somos abogados, contadores, asesores financieros ni médicos, y **nada en este artículo es asesoramiento legal, financiero, fiscal, contable, médico ni de ninguna otra índole profesional.** Escribimos estas publicaciones para educarnos a nosotros mismos y como una conveniencia para nuestros clientes. La información aquí puede estar desactualizada, ser específica de una geografía o simplemente estar equivocada; nosotros también cometemos errores.
>
> Para cualquier decisión importante, **por favor consulta a un verdadero profesional (¡en serio!)**. O si ese no es tu estilo, pregúntale a un amigo, pregunta en Twitter, pregunta en Reddit, pregúntale a una IA o a un vidente. En resumen: **DYOR — Do Your Own Research (Haz tu propia investigación)**. Vamos a aprender y a divertirnos.

---

## Resumen

- Tokenizar un dominio que ya posees es un proceso interactivo guiado de unos 30 minutos, más hasta una semana de espera por parte del registrador.
- Necesitas: control del dominio, una billetera de autocustodia, una pequeña cantidad de gas y paciencia.
- El minteo on-chain es el *último* paso; la mayor parte del trabajo es el aburrido flujo de transferencia entre registradores que la ICANN impone independientemente de la blockchain.
- Después de la tokenización, tienes **dos capas de propiedad sincronizadas**: el registro DNS tradicional y un NFT en tu billetera.
- Lee la [guía de recuperación por pérdida de billetera](/es/blog/recovering-a-tokenized-domain-after-wallet-loss/) *antes* de tokenizar, no después.

¿Listo para empezar? Dirígete a [namefi.io](https://namefi.io).