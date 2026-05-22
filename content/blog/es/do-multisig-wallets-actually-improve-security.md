---
title: '¿Las billeteras multifirma realmente mejoran la seguridad? Una visión desde el modelo de amenazas'
date: '2026-05-07'
language: es
tags: ['security', 'wallets', 'multisig', 'web3', 'key-management']
authors: ['namefiteam']
draft: false
description: 'Las billeteras multifirma (multisig) son consideradas ampliamente como el patrón de custodia segura por defecto en cripto, pero la respuesta a "¿realmente mejoran la seguridad?" depende completamente del modelo de amenazas. Esta publicación detalla qué es lo que evita una multisig, qué no, y en qué casos puede empeorar las cosas.'
ogImage: ../../assets/do-multisig-wallets-actually-improve-security-og.jpg
keywords: ['billetera multisig', 'multifirma', 'billetera safe', 'gnosis safe', 'gestión de llaves', 'autocustodia', 'firma de umbral', 'recuperación social', 'namefi']
---

Las billeteras multifirma (multisig)—billeteras donde M de N llaves deben firmar antes de que una transacción sea válida—suelen presentarse como la mejora obvia frente a una *hot wallet* (billetera caliente) de una sola llave. La mayoría de las configuraciones de tesorería en DAOs, *exchanges* y empresas serias nativas de cripto funcionan a través de alguna variante de multisig (Safe, Squads, Multisig.js, variantes de firmas de umbral).

Esa reputación está bien ganada, pero solo contra un modelo de amenazas *específico*. Las multisig evitan algunas de las formas más comunes en las que se roban fondos y no hacen casi nada contra otras. A continuación presentamos la versión honesta: en qué son realmente buenas las multisig, en qué fallan y los casos en los que adoptarlas puede hacer que una configuración sea *menos* segura.

## Qué es una multisig, muy brevemente

En una multisig 2 de 3, existen tres llaves privadas; dos de ellas cualesquiera deben firmar una transacción para que se ejecute en la cadena (*on-chain*). La billetera en sí es un contrato inteligente (en el mundo de Ethereum / EVM) o un tipo de salida multisig nativa (en Bitcoin a través de [P2SH/P2WSH](https://en.bitcoin.it/wiki/BIP_0016)). El contrato verifica las firmas y luego reenvía la transacción.

La implementación más utilizada en los ecosistemas EVM es [Safe](https://safe.global/) (anteriormente Gnosis Safe). En Solana, [Squads](https://squads.so/) juega el mismo papel. Bitcoin tiene una larga historia de soporte nativo para multisig, a menudo combinado con billeteras de hardware a través de [flujos de trabajo PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).

Los esquemas de firma de umbral (TSS, FROST, MPC) logran un resultado similar con una sola llave en la cadena: cada firmante posee una *parte* de la llave privada y firman conjuntamente sin llegar a reconstruirla nunca. Desde la perspectiva del modelo de amenazas, la mayoría de los puntos a continuación se aplican por igual a ambos, con algunas advertencias que se mencionan más adelante.

## Lo que evita una multisig (las buenas noticias)

### Compromiso de una sola llave

Este es el beneficio principal. Si roban la billetera de hardware de un firmante, si el teléfono de un firmante se infecta con malware, o si se filtra la frase semilla de un firmante, un atacante que posea esa única llave no podrá mover los fondos. Necesita comprometer al menos otras M-1 llaves al mismo tiempo.

Para una configuración 2 de 3, esto significa que el atacante debe comprometer *dos puntos de acceso independientes* (*endpoints*), idealmente en poder de diferentes personas, en hardware diferente, y en ubicaciones físicas diferentes. La probabilidad de que ocurran dos compromisos independientes en el mismo periodo de tiempo suele ser órdenes de magnitud menor que la probabilidad de uno solo.

### Riesgo interno

Una sola persona con custodia total puede abandonar abruptamente por enojo (*rage-quit*), desertar, ser coaccionada o simplemente cometer un error catastrófico. La multisig obliga a la colusión. Para las DAOs y las empresas, esta suele ser la motivación *principal*; el beneficio de seguridad contra atacantes externos es secundario al beneficio de gobernanza frente a cualquier actor interno.

### Recuperación de llaves perdidas

En una configuración M de N donde N > M, perder una llave no es catastrófico. Los firmantes restantes pueden mover los fondos a una nueva multisig y reemplazar la llave perdida. Esta es una mejora significativa en comparación con la custodia de llave única, donde la pérdida de una frase semilla significa una pérdida permanente.

### *Phishing* al usuario

Muchos ataques de *phishing* a billeteras (sitios falsos de airdrops, aprobaciones de tokens maliciosos, contratos de drenaje o *drainers*) dependen de que el usuario firme una transacción maliciosa en una sola sesión de navegador. Una multisig añade un paso de confirmación en una superficie diferente (una interfaz de coordinación como la de Safe, o una aprobación por hardware en múltiples dispositivos), lo que le da al usuario otro momento para darse cuenta de que está firmando algo que no tenía intención de firmar.

## Lo que *no* evita una multisig (la parte incómoda)

Esta es la sección que la mayoría de los análisis rápidos omiten.

### Errores de contratos inteligentes en la propia multisig

La multisig es un contrato inteligente. Si el contrato tiene un error (*bug*), toda la gestión cuidadosa de llaves del mundo no servirá de nada. El incidente de multisig más costoso de la historia —el [congelamiento de las multisig de Parity](https://www.parity.io/blog/security-alert/) en noviembre de 2017— fue un error del contrato, no el compromiso de una llave. Aproximadamente $150 millones en ETH quedaron permanentemente inaccesibles debido a una sola transacción.

La versión moderna de Safe es uno de los contratos más auditados en Ethereum y ha resistido bien, pero el punto se mantiene: estás cambiando "una llave privada a proteger" por "un contrato inteligente en el cual confiar". Esa confianza debe ganarse y volver a ganarse con auditorías y tiempo.

### Compromiso de la interfaz de firma

Casi todas las aprobaciones de multisig se realizan a través de alguna interfaz: la interfaz web de Safe, un plugin de billetera, un panel de control personalizado. Si esa interfaz se ve comprometida (secuestro de DNS, ataque de cadena de suministro a una dependencia, extensión de navegador maliciosa), el atacante puede mostrarle al firmante A "enviar 1 ETH a alice.eth" mientras en realidad transmite "enviar 1000 ETH a atacante.eth" a la billetera de hardware para que sea firmada.

La mayoría de las billeteras de hardware *sí* muestran la dirección de destino real, pero los firmantes suelen echarle un vistazo superficial. El [incidente de Bybit](https://www.bybit.com/en-US/help-center/article/Incident-Report-Bybit-Exchange-Attack-Update) a principios de 2025 se basó en el compromiso de la interfaz de Safe; todos los firmantes aprobaron lo que pensaban que era una transacción de rutina, mientras se modificaba el contrato proxy.

La multisig te protege contra un atacante que *solo* tiene una llave. No te protege contra un atacante que puede poner la transacción equivocada frente a todos tus firmantes.

### *Phishing* coordinado a múltiples firmantes

Si los firmantes son conocidos y accesibles (y en cualquier tesorería con una dirección de Safe publicada, generalmente lo son), un atacante puede ir tras todos ellos. Ejecutar la misma campaña de *phishing* contra cada firmante. Esperar. Si dos de cada tres están cansados, distraídos o con la guardia baja el mismo día, se alcanza el umbral.

Este es el ataque más realista contra multisigs bien administradas en la práctica, y las defensas contra él son principalmente procedimentales, no técnicas: confirmación fuera de banda (*out-of-band*) de cada transacción en un canal separado (Signal, un chat distinto, una llamada telefónica) y una política estricta de que cualquier transacción superior a $X debe discutirse en vivo antes de firmar.

### Compromiso del almacenamiento de llaves fuera de la cadena

Si las "llaves de firma" son en realidad un esquema 2 de 3 distribuido entre las frases semilla de MetaMask de dos ingenieros y una billetera de hardware en la caja fuerte de la oficina, tienes un problema de OPSEC disfrazado de multisig. El umbral se cumple técnicamente, pero la diversidad es falsa. Una infección por malware en las computadoras portátiles de los dos ingenieros, o un solo allanamiento en la oficina, puede comprometer el umbral.

La diversidad real requiere:

- Diferentes modelos de hardware. (Un Ledger, un Trezor, un Keystone).
- Diferentes sistemas operativos para cualquier firma por software.
- Diferentes ubicaciones físicas para cualquier almacenamiento persistente.
- Diferentes seres humanos, cuando corresponda, con diferentes perfiles de amenaza.

### Pérdida que supera el umbral

El otro lado de la recuperación: en un esquema 2 de 3, perder *dos* llaves es una pérdida permanente. En uno 3 de 5, perder tres es una pérdida permanente. Cuanto mayor sea la brecha entre M y N, más seguro será frente a pérdidas individuales, pero será más fácil para un atacante encontrar M firmantes a los cuales hacerles *phishing*.

Esta es la tensión inevitable. Una M más alta es más segura contra ataques externos y menos recuperable. Una M más baja es más recuperable y más fácil de atacar. No existe una configuración que optimice ambas a la vez.

## En qué casos la multisig puede empeorar las cosas

Algunos casos honestos:

- **Para saldos muy pequeños**, la carga operativa de una multisig (coordinación de transacciones, costos de gas en EVM, curva de aprendizaje) puede generar errores que la custodia de llave única no tendría. La herramienta adecuada para $200 en cripto como dinero de bolsillo es una sola llave respaldada por hardware.
- **Para usuarios en solitario que tratan la multisig como un esquema de recuperación** pero en la práctica mantienen las tres llaves en dispositivos que controlan exclusivamente, la multisig agrega complejidad sin cambiar el modelo de amenazas: si un solo atacante compromete uno de esos dispositivos hoy, probablemente pueda comprometerlos todos.
- **Para las organizaciones que en realidad no tienen diversidad de firmantes** (todos en la misma oficina, en la misma VPN, usando el mismo SSO), el umbral se convierte en un simple trámite.

En los tres casos, la respuesta no es "usar custodia de una sola llave". La respuesta es "usar la multisig *correctamente* o usar un custodio que lo haga". Pero fingir que el tipo de contrato por sí solo brinda seguridad, independientemente de la práctica operativa, es la forma en la que ocurren las pérdidas de alto perfil.

## Cómo se ve un buen esquema

Una multisig 2 de 3 o 3 de 5 funciona bien como control de tesorería cuando *todas* las siguientes afirmaciones son ciertas:

- Los firmantes son humanos diferentes, en diferentes jurisdicciones de ser posible.
- Los dispositivos de firma son de marcas de hardware diferentes, en diferentes sistemas operativos.
- Se utiliza un canal de comunicación separado para la confirmación de transacciones, independiente de la interfaz de firma.
- Existe un proceso documentado para verificar el *payload* de la transacción en comparación con los cambios esperados (*calldata*, objetivo, valor) antes de que cualquier firmante la apruebe.
- El contrato multisig en sí está bien auditado (Safe es la opción predeterminada y conservadora en 2026) y la versión es conocida y está fijada.
- Existe un procedimiento de reemplazo de firmantes y se ha ensayado.

Esto requiere más disciplina de la que la mayoría de los equipos consideran al principio. La buena noticia es que la disciplina es una inversión única; la mala noticia es que la disciplina importa más que el contrato.

## Cómo se conecta esto con los dominios

Los nombres de dominio son una de las analogías más fuertes con las multisig en el mundo fuera de la cadena (*off-chain*). Un dominio controlado por una sola cuenta de registrador detrás de una sola contraseña es una billetera de llave única. Un dominio protegido por un bloqueo del registrador + bloqueo del registro + 2FA en el proveedor de DNS + múltiples proveedores autoritativos es, estructuralmente, una multisig: se deben comprometer múltiples factores independientes antes de que el nombre se pueda mover.

Namefi lleva esto más allá al representar la propiedad como un registro en la cadena (*on-chain*) que puede mantenerse directamente en una billetera multisig. El mismo esquema de umbral que protege una tesorería ahora puede proteger el *plano de control DNS*, por lo que una sola persona víctima de *phishing* no puede perder el dominio de la empresa, de la misma forma que no puede vaciar la tesorería por sí sola. La mejora del modelo de amenazas es la misma en ambos mundos: reemplazar "confiar en una credencial" por "comprometer M de N factores independientes".

## Fuentes y lectura adicional

- Safe — [Contratos de cuentas inteligentes y auditorías](https://safe.global/).
- IETF FROST — [RFC 9591, el protocolo Flexible Round-Optimized Schnorr Threshold](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature).
- Bitcoin — [BIP-174 PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).
- Parity — [Análisis post-mortem del congelamiento de las multisig](https://www.parity.io/blog/security-alert/).
- a16z crypto — [Guía práctica para administrar una multisig en Safe](https://a16zcrypto.com/posts/article/secure-your-tokens-set-up-a-safe-multisig/).