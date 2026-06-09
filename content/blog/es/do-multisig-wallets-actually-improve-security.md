---
title: '¿Mejoran realmente la seguridad las billeteras multifirma? Una perspectiva desde el modelo de amenazas'
date: '2026-05-07'
language: es
tags: ['security', 'wallets', 'multisig', 'web3', 'key-management']
authors: ['namefiteam']
draft: false
description: 'Las billeteras multifirma suelen considerarse como el estándar predeterminado para la custodia segura en cripto, pero la respuesta a "¿realmente mejoran la seguridad?" depende por completo del modelo de amenazas. Esta publicación analiza lo que la multifirma logra evitar, lo que no, y en qué casos puede empeorar la situación.'
ogImage: ../../assets/do-multisig-wallets-actually-improve-security-og.jpg
keywords: ['billetera multifirma', 'multifirma', 'safe wallet', 'gnosis safe', 'gestión de claves', 'autocustodia', 'firma umbral', 'recuperación social', 'namefi']
---

Las billeteras multifirma (aquellas donde M de N claves deben firmar antes de que una transacción sea válida) generalmente se presentan como la mejora obvia respecto a una *hot wallet* de clave única. La mayoría de las configuraciones de tesorería en DAOs, *exchanges* y empresas serias nativas del sector cripto funcionan con alguna variante de multifirma (Safe, Squads, Multisig.js o variantes de firma umbral).

Esa reputación está bien ganada, pero solo frente a un modelo de amenazas *específico*. La multifirma neutraliza algunas de las formas más comunes en que se roban fondos y no hace casi nada contra otras. A continuación presentamos la versión honesta: en qué es realmente buena la multifirma, en qué se queda corta y los casos en los que adoptarla puede hacer que una configuración sea *menos* segura.

## Qué es la multifirma, de forma muy resumida

En una multifirma 2 de 3, existen tres claves privadas; cualquier combinación de dos de ellas debe firmar una transacción para que se ejecute *on-chain*. La billetera en sí es un contrato inteligente (en el mundo de Ethereum / EVM) o un tipo de salida multifirma nativa (en Bitcoin a través de [P2SH/P2WSH](https://en.bitcoin.it/wiki/BIP_0016)). El contrato verifica las firmas y luego reenvía la transacción.

La implementación más utilizada en los ecosistemas EVM es [Safe](https://safe.global/) (anteriormente Gnosis Safe). En Solana, [Squads](https://squads.so/) cumple la misma función. Bitcoin tiene una larga historia de soporte nativo para multifirma, a menudo combinado con billeteras de hardware a través de [flujos de trabajo PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).

Los esquemas de firma umbral (TSS, FROST, MPC) logran un resultado similar con una sola clave *on-chain*: cada firmante posee una *parte* (o fragmento) de la clave privada y firman de manera conjunta sin llegar a reconstruirla nunca. Desde la perspectiva del modelo de amenazas, la mayoría de los puntos a continuación se aplican por igual a ambos métodos, con algunas salvedades que se señalarán más adelante.

## Lo que la multifirma logra neutralizar (las buenas noticias)

### Compromiso de una clave única

Este es el beneficio principal. Si se roba la billetera de *hardware* de un firmante, si el teléfono de uno de ellos se infecta con *malware*, o si se filtra la frase semilla de un firmante, un atacante que posea solo esa clave no podrá mover los fondos. Necesita comprometer al menos otras M-1 claves al mismo tiempo.

Para una configuración 2 de 3, esto significa que el atacante debe comprometer *dos puntos de acceso independientes*, idealmente en manos de personas distintas, en *hardware* diferente y en ubicaciones físicas distintas. La probabilidad de que ocurran dos compromisos independientes en la misma ventana de tiempo suele ser órdenes de magnitud menor que la probabilidad de uno solo.

### Riesgo interno

Una sola persona con custodia total puede renunciar enfadada (*rage-quit*), desertar, ser coaccionada o simplemente cometer un error catastrófico. La multifirma obliga a la colusión. Para las DAOs y las empresas, esta suele ser la motivación *principal*; el beneficio de seguridad contra atacantes externos es secundario frente al beneficio de gobernanza contra cualquier actor interno individual.

### Recuperación de claves perdidas

En una configuración M de N donde N > M, perder una clave no es catastrófico. Los firmantes restantes pueden mover los fondos a una nueva multifirma y reemplazar la clave perdida. Esta es una mejora significativa sobre la custodia de clave única, donde la pérdida de una frase semilla significa una pérdida permanente.

### Ataques de *phishing* al usuario

Muchos ataques de *phishing* a billeteras (sitios web falsos de *airdrops*, aprobaciones maliciosas de tokens, contratos drenadores) dependen de que el usuario firme una transacción maliciosa en una sola sesión de navegador. Una multifirma añade un paso de confirmación en una interfaz diferente (una interfaz de coordinación como la de Safe, o una aprobación por *hardware* en múltiples dispositivos), lo que le da al usuario otro momento para darse cuenta de que está firmando algo que no tenía intención de firmar.

## Lo que la multifirma *no* logra neutralizar (la parte incómoda)

Esta es la sección que la mayoría de los análisis superficiales omiten.

### Errores de contratos inteligentes en la propia multifirma

La multifirma es un contrato inteligente. Si el contrato tiene un error (*bug*), toda la cuidadosa gestión de claves del mundo no servirá de nada. El incidente de multifirma más caro de la historia (el [congelamiento de la multifirma de Parity](https://www.parity.io/blog/security-alert/) en noviembre de 2017) se debió a un error en el contrato, no a un compromiso de claves. Alrededor de $150 millones en ETH quedaron permanentemente inaccesibles debido a una sola transacción.

En la actualidad, Safe es uno de los contratos más auditados en Ethereum y ha resistido bien el paso del tiempo, pero el punto sigue siendo válido: estás cambiando "una clave privada que proteger" por "un contrato inteligente en el que confiar". Esa confianza debe ganarse y volver a ganarse con auditorías y tiempo.

### Compromiso de la interfaz de firma

Casi todas las aprobaciones de multifirma ocurren a través de alguna interfaz: la interfaz web de Safe, un complemento de billetera o un panel personalizado. Si esa interfaz se ve comprometida (secuestro de DNS, ataque de cadena de suministro en una dependencia, extensión de navegador maliciosa), el atacante puede mostrarle al firmante A "enviar 1 ETH a alice.eth" mientras en realidad transmite a la billetera de *hardware* "enviar 1000 ETH a attacker.eth" para su firma.

La mayoría de las billeteras de *hardware* *sí* muestran la dirección de destino real, pero los firmantes suelen ojearlas rápidamente. El [incidente de Bybit](https://www.bybit.com/en-US/help-center/article/Incident-Report-Bybit-Exchange-Attack-Update) a principios de 2025 se basó en un compromiso de la interfaz de Safe; todos los firmantes aprobaron lo que pensaban que era una transacción de rutina, mientras que el contrato proxy estaba siendo modificado.

La multifirma te protege contra un atacante que *solo* tiene una clave. No te protege contra un atacante que puede poner la transacción equivocada frente a todos tus firmantes.

### *Phishing* coordinado a múltiples firmantes

Si los firmantes son conocidos y accesibles (y para cualquier tesorería con una dirección de Safe publicada, generalmente lo son), un atacante puede apuntar a todos ellos. Ejecutar la misma campaña de *phishing* contra cada firmante. Esperar. Si dos de cada tres están cansados, distraídos o con la guardia baja el mismo día, se alcanza el umbral.

Este es el ataque más realista contra multifirmas bien administradas en la práctica, y las defensas contra él son principalmente procedimentales, no técnicas: confirmación fuera de banda (*out-of-band*) de cada transacción en un canal separado (Signal, un chat distinto, una llamada telefónica), y una política estricta de que cualquier transacción superior a $X debe discutirse en vivo antes de firmarse.

### Compromiso del almacenamiento de claves *off-chain*

Si las "claves de firma" son en realidad un 2 de 3 entre las frases semilla de MetaMask de dos ingenieros y una billetera de *hardware* en la caja fuerte de la oficina, tienes un problema de OPSEC disfrazado de multifirma. El umbral se cumple técnicamente, pero la diversidad es falsa. Una infección de *malware* en las computadoras portátiles de los dos ingenieros, o un solo allanamiento en la oficina, pueden comprometer el umbral.

La verdadera diversidad requiere:

- Diferentes modelos de *hardware*. (Un Ledger, un Trezor, un Keystone).
- Diferentes sistemas operativos para cualquier firma por *software*.
- Diferentes ubicaciones físicas para cualquier almacenamiento persistente.
- Diferentes personas, cuando corresponda, con perfiles de amenaza distintos.

### Pérdidas más allá del umbral

La otra cara de la recuperación: en un esquema 2 de 3, perder *dos* claves supone una pérdida permanente. En un esquema 3 de 5, perder tres es una pérdida permanente. Cuanto mayor sea la diferencia entre M y N, más seguro será contra pérdidas individuales, pero más fácil le resultará a un atacante encontrar M firmantes a los que hacer *phishing*.

Esta es una tensión inevitable. Una M más alta es más segura contra ataques externos y menos recuperable. Una M más baja es más recuperable y más fácil de atacar. No existe una configuración que optimice ambas cosas.

## Dónde la multifirma puede empeorar la situación

Algunos casos sinceros:

- **Para saldos muy pequeños**, la carga operativa de la multifirma (coordinación de transacciones, costos de gas en EVM, curva de aprendizaje) puede producir errores que la custodia de clave única no tendría. La herramienta adecuada para $200 de dinero de bolsillo en cripto es una clave única respaldada por *hardware*.
- **Para usuarios individuales que tratan la multifirma como un esquema de recuperación** pero en la práctica mantienen las tres claves en dispositivos que solo ellos controlan, la multifirma añade complejidad sin cambiar el modelo de amenazas; si un solo atacante compromete uno de esos dispositivos hoy, probablemente pueda comprometerlos todos.
- **Para organizaciones que en realidad no tienen diversidad de firmantes** (todos en la misma oficina, en la misma VPN, usando el mismo SSO), el umbral se convierte en un mero formalismo.

En los tres casos, la respuesta no es "usa la custodia de clave única". Es "usa la multifirma *correctamente* o utiliza un custodio que lo haga". Pero pretender que el tipo de contrato por sí solo ofrece seguridad, independientemente de la práctica operativa, es la forma en la que ocurren las pérdidas de alto perfil.

## Cómo se ve una buena configuración

Una multifirma 2 de 3 o 3 de 5 funciona bien como control de tesorería cuando se cumple *todo* lo siguiente:

- Los firmantes son personas diferentes, en distintas jurisdicciones siempre que sea posible.
- Los dispositivos de firma son de diferentes marcas de *hardware* y tienen distintos sistemas operativos.
- Se utiliza un canal de comunicación independiente para la confirmación de transacciones, ajeno a la interfaz de firma.
- Existe un proceso documentado para verificar el *payload* de la transacción frente a los cambios esperados (calldata, objetivo, valor) antes de que cualquier firmante la apruebe.
- El contrato multifirma en sí está bien auditado (Safe es la opción conservadora por defecto en 2026) y la versión es conocida y fija.
- Existe un procedimiento de reemplazo de firmantes que ya se ha ensayado.

Esto requiere más disciplina de la que la mayoría de los equipos imaginan al principio. La buena noticia es que esta disciplina es una inversión que se realiza una sola vez; la mala noticia es que la disciplina importa más que el contrato.

## Cómo se conecta esto con los dominios

La asignación de nombres de dominio es una de las analogías más fuertes de la multifirma en el mundo *off-chain*. Un dominio controlado por la cuenta de un solo registrador detrás de una sola contraseña es como una billetera de clave única. Un dominio protegido por el bloqueo del registrador + bloqueo del registro + 2FA en el proveedor de DNS + múltiples proveedores autoritativos es, estructuralmente, una multifirma: múltiples factores independientes deben verse comprometidos antes de que el nombre pueda moverse.

Namefi lleva esto más allá al representar la propiedad como un registro *on-chain* que puede mantenerse directamente en una billetera multifirma. El mismo esquema de umbral que protege una tesorería ahora puede proteger el *plano de control del DNS*; así que una sola persona víctima de *phishing* ya no podrá perder el dominio de la empresa, de la misma forma en que no podría vaciar la tesorería por sí sola. La mejora en el modelo de amenazas es la misma en ambos mundos: reemplazar "confiar en una credencial" con "comprometer M de N factores independientes".

## Fuentes y lecturas complementarias

- Safe — [Contratos de cuentas inteligentes y auditorías](https://safe.global/).
- IETF FROST — [RFC 9591, el protocolo de umbral de Schnorr flexible y optimizado en rondas](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature).
- Bitcoin — [BIP-174 PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).
- Parity — [*Post-mortem* del congelamiento de su multifirma](https://www.parity.io/blog/security-alert/).
- a16z crypto — [Guía práctica para ejecutar una multifirma en Safe](https://a16zcrypto.com/posts/article/secure-your-tokens-set-up-a-safe-multisig/).