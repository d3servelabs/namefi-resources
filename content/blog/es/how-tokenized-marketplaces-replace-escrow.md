---
title: "De la publicación a la liquidación: Cómo los mercados tokenizados reemplazan el escrow"
date: '2026-05-22'
language: es
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Cómo los mercados de dominios tokenizados permiten a compradores y vendedores liquidar de forma atómica on-chain: sin servicio de escrow, sin códigos de autorización, sin bloqueo de registrador de cinco días. Qué reemplaza cada pieza del flujo tradicional y qué riesgos se trasladan a otras capas."
keywords: ['mercado de dominios blockchain', 'transferencia atómica de dominios', 'mercado de dominios tokenizados', 'reemplazo de escrow de dominios', 'venta de dominios sin escrow', 'venta de dominios cripto', 'proceso de venta de dominios tokenizados', 'vender dominio tokenizado', 'comprar dominio tokenizado', 'venta de dominios on-chain', 'liquidación de dominios NFT', 'mercado de dominios 2026', 'liquidez de dominios tokenizados']
---

El flujo tradicional para vender un `.com` es algo parecido a esto:

1. Publicarlo en [Sedo](https://sedo.com/), [Afternic](https://www.afternic.com/) o Dan.com.
2. Negociar.
3. Abrir un [escrow](/en/glossary/escrow/) (depósito en garantía) en [Escrow.com](https://www.escrow.com/) o similar. El comprador transfiere los fondos.
4. El vendedor desbloquea el dominio y proporciona el [código de autorización](/en/glossary/auth-code/) (auth code).
5. El comprador inicia la [transferencia entre registradores](/en/glossary/cross-registrar-transfer/) en su [registrador](/en/glossary/registrar/).
6. Esperar de 5 a 7 días para que se complete la transferencia de la [ICANN](/en/glossary/icann/).
7. Confirmar la transferencia; el escrow libera los fondos.
8. Pagar entre 3% y 6% en tarifas de escrow, más las comisiones del mercado.

Funciona. Ha sido el estándar durante dos décadas. Pero también es lento, costoso y está lleno de momentos en los que una parte tiene que confiar en que la otra (o un servicio de escrow de terceros) hará lo correcto.

Las ventas de dominios tokenizados comprimen todo este proceso en una sola transacción. Esta publicación explica cómo se hace y hacia dónde se traslada realmente la confianza.

---

## El nuevo flujo, de principio a fin

1. Publicar el [dominio tokenizado](/en/blog/what-are-tokenized-domains/) en un [mercado](/en/glossary/marketplace/) (el propio de Namefi, Doma, [OpenSea](https://opensea.io/), [Blur](https://blur.io/), etc.).
2. El comprador paga. El [NFT](/en/glossary/nft/) se transfiere a la [billetera](/en/glossary/wallet/) (wallet) del comprador. La plataforma mantiene sincronizado el registro del lado del [registrador](/en/glossary/registrar/).
3. Listo.

Eso es todo. Dos pasos. Sin [código de autorización](/en/glossary/auth-code/), sin [escrow](/en/glossary/escrow/), sin bloqueo de registrador de 5 días, sin esa brecha de «ya envié la transferencia, ahora confío en ti».

Esto funciona porque el **NFT es el registro de propiedad canónico**, y las transacciones [on-chain](/en/glossary/on-chain/) son [atómicas](/en/glossary/atomic-transfer/): el pago y la transferencia del activo ocurren en el mismo bloque, o no ocurre ninguno de los dos.

---

## En qué se convierte cada pieza tradicional

### Plataforma de publicación

Misma idea, diferente superficie. Los mercados siguen llevándose una comisión y siguen seleccionando las publicaciones. El gran cambio: las publicaciones tokenizadas pueden aparecer en **múltiples mercados a la vez** porque son NFT estándar. Publicas una vez en la plataforma que originó el dominio; OpenSea/Blur pueden agregarlo automáticamente.

Esta es una mejora significativa en la liquidez con respecto al mundo de los dominios tradicionales, donde Sedo y Afternic operaban como ecosistemas cerrados (walled gardens).

### Escrow.com

**Desaparece.** Es reemplazado por la liquidación atómica on-chain.

En el flujo tradicional, el escrow existe para cerrar la brecha asíncrona entre el pago del comprador y la transferencia del vendedor. En el flujo tokenizado, esa brecha no existe: la transacción es atómica, por lo que no es necesario que un tercero retenga el dinero en el medio. Esto elimina la comisión de escrow del 3-6% y el tiempo de espera.

### Códigos de autorización (códigos EPP)

**No son necesarios para la mitad tokenizada de la transacción.** La transferencia on-chain ocurre de inmediato. La sincronización de registros del lado del registrador es manejada por el protocolo; el comprador no necesita hacer nada manual.

(Si más adelante un comprador desea *des-tokenizar* el dominio y moverlo a un registrador completamente diferente, ese es un flujo separado que volvería a activar el mecanismo tradicional de transferencia de registrador, con códigos de autorización y todo).

### Bloqueo de transferencia de 5 días de la ICANN

**Se omite para la propia transferencia tokenizada.** Las reglas de transferencia de la ICANN se aplican a las transferencias entre registradores, no a los cambios de propiedad dentro de un mismo registrador. La plataforma de dominios tokenizados maneja el cambio on-chain sin desencadenar una transferencia completa entre registradores.

Existe una regla relacionada (el período de enfriamiento de 60 días tras una transferencia de registrador) que aún se aplica si un dominio ha sido transferido recientemente entre registradores. Eso tiene que ver con las transferencias de registrador, no con las transferencias on-chain, por lo que no bloquea las ventas tokenizadas.

### Transferencias bancarias y retrasos bancarios

**Reemplazados por pagos con criptomonedas y [monedas estables](/en/glossary/stablecoin/) (stablecoins).** USDC, ETH y otros pagos on-chain se liquidan en segundos. Las transferencias bancarias tardan días en liquidarse. La diferencia es aún más notoria en las ventas internacionales.

### «Confío en que la otra persona haga su parte»

**Reemplazado por la atomicidad de los contratos inteligentes.** La transacción se completa en su totalidad (tú obtienes el activo, ellos obtienen el dinero) o no ocurre (no hay movimiento de ninguna de las partes). No existe un escenario en el que una parte actúe y la otra no.

---

## Hacia dónde se trasladan realmente los riesgos

No todo son ventajas; el perfil de riesgo cambia. Algunos riesgos que el escrow manejaba en el flujo tradicional ahora residen en otros lugares.

### Riesgo de seguridad de la billetera

Ahora estás enviando un NFT a la dirección de una billetera. Si el comprador te dio la dirección incorrecta, o si tu interfaz te engaña para que lo envíes a una dirección incorrecta, es tu responsabilidad. Verifica siempre la dirección del destinatario.

### Riesgo del contrato inteligente

El contrato inteligente del mercado es el nuevo «escrow». Si tiene un error (bug), pueden pasar cosas raras. Por eso son importantes los mercados auditados y probados en batalla. No seas el primero en usar un contrato completamente nuevo para una venta de alto valor.

### Front-running y MEV

Las publicaciones on-chain son públicas. Un actor determinado puede intentar adelantarse (front-run) a una transacción (el término general es [MEV: Valor Máximo Extraíble](https://ethereum.org/en/developers/docs/mev/)). Los principales mercados tienen medidas de mitigación, pero es una categoría de riesgo que no existía en el flujo tradicional.

### Riesgo de activos robados

Si el NFT que estás comprando fue robado, puedes terminar con un dominio que las plataformas y los mercados se estén coordinando para marcar (flag). Algunos mercados se negarán a respetar las ventas de NFT marcados. Esta es un área de trabajo real y en curso en el ecosistema NFT en general.

### KYC / sanciones

Dependiendo del mercado y la jurisdicción, vendedores y compradores pueden enfrentar requisitos de KYC (Conozca a su cliente). Esto no es nuevo (los servicios de escrow también los tenían), pero la mecánica es diferente.

### Eventos fiscales

Una venta pagada en criptomonedas es un evento fiscal diferente a una venta pagada en moneda fiduciaria (fiat) en algunas jurisdicciones. Consulta la [publicación sobre preguntas fiscales y contables](/en/blog/tax-and-accounting-questions-for-tokenized-domains/) para ver el menú de preguntas que debes plantearle a tu contador (CPA).

---

## Qué significa esto para los compradores

- **Velocidad.** Las ventas se liquidan en minutos, no en días.
- **Tarifas más bajas.** No hay comisión de escrow. Los costos del mercado y de gas suelen ser mucho más bajos que el 3-6%.
- **Propiedad directa.** El NFT está en tu billetera, inmediatamente, sin esperas.
- **Verificación.** Puedes revisar el historial on-chain antes de comprar: cuándo se minteó el dominio, transferencias anteriores, publicaciones previas.

Estás cambiando la comodidad de un flujo de trabajo de escrow familiar por la desconocida comodidad de la atomicidad criptográfica. Para la mayoría de los compradores acostumbrados a los NFT, esto es una mejora neta. Para los primerizos, vale la pena hacer antes una pequeña transacción de práctica.

---

## Qué significa esto para los vendedores

- **Las mismas mejoras**: más rápido, más barato, más transparente.
- **Más lugares de venta.** Tu publicación puede aparecer en múltiples mercados de NFT simultáneamente.
- **Diferente audiencia.** Los compradores de los mercados NFT se comportan de manera diferente a los compradores de dominios tradicionales. Las dinámicas de precios pueden variar en cualquier dirección dependiendo del dominio.
- **Sin riesgo de «comprador arrepentido» (buyer flake).** O la transacción se completa o no lo hace. Se acabó el «el comprador pagó el escrow y luego desapareció».

La otra cara de la moneda: renuncias al alcance de marketing (a veces considerable) de las agencias especializadas de la industria de dominios tradicionales. Para los dominios premium, son comunes las estrategias híbridas: publicar tanto como un NFT tokenizado como a través de los canales tradicionales.

---

## Publicaciones Híbridas

Nada en un dominio tokenizado te impide publicarlo también a la antigua. Muchos propietarios publican:

- En el propio mercado de la plataforma.
- En mercados generales de NFT (OpenSea, Blur).
- En mercados de dominios tradicionales (Sedo, Afternic), con la salvedad de que el comprador puede querer «des-tokenizar» el dominio o aceptar su forma tokenizada.

Esto representa más trabajo, pero para los dominios de primer nivel expande de manera significativa el grupo de compradores.

---

## Hacia dónde creemos que va esto

Una vez que compradores y vendedores se acostumbren a la liquidación atómica, el flujo tradicional de escrow empezará a sentirse como hacer un cheque: viable pero arcaico. Las piezas que aún se necesitan para que los mercados de dominios tokenizados absorban una mayor parte del volumen son:

- Búsqueda y filtrado más específicos para dominios en los mercados de NFT.
- Mejores herramientas de valoración para activos heterogéneos.
- Mayor cobertura de TLD (Dominios de Nivel Superior) en las plataformas de tokenización.
- Contratos estables y bien auditados que no hayan presentado incidentes de alto perfil.

Todos estos aspectos son trabajos en curso y mejoran visiblemente año tras año.

---

## Un descargo de responsabilidad amistoso (¡Léeme!)

> No somos abogados, contadores, asesores financieros ni médicos; y **nada en este artículo es asesoramiento legal, financiero, fiscal, contable, médico ni de ningún otro tipo profesional.** Escribimos estas publicaciones para educarnos a nosotros mismos y para la comodidad de nuestros clientes. La información aquí presentada puede estar desactualizada, ser específica de una región o simplemente ser incorrecta: nosotros también cometemos errores.
>
> Para cualquier decisión importante, **por favor consulta a un profesional real (¡en serio!)**. O si ese no es tu estilo, pregúntale a un amigo, a Twitter, a Reddit, a una IA o a un psíquico. En resumen: **DYOR — Do Your Own Research (Haz tu propia investigación)**. Aprendamos y divirtámonos.

---

## Resumen

- Los mercados de dominios tokenizados comprimen el flujo tradicional de publicar → negociar → escrow → transferir → liquidar, en una única transacción on-chain.
- La pieza que desaparece más claramente es el **escrow**: la atomicidad criptográfica hace que sea innecesario un tercero retenedor de fondos.
- Los códigos de autorización, los bloqueos del registrador y las transferencias bancarias también quedan fuera para la mitad tokenizada de la transacción.
- En su lugar aparecen nuevos riesgos: seguridad de la billetera, errores de contratos inteligentes, MEV, coordinación frente a activos robados. Estos residen en lugares diferentes, no es que dejen de existir.
- Efecto neto: ventas más rápidas, más baratas y más transparentes, con una experiencia de usuario (UX) diferente (y mejorable). Las publicaciones híbridas siguen siendo comunes para los dominios premium.

Si realmente quieres probar a vender un dominio tokenizado, dirígete a [namefi.io](https://namefi.io). Para tener una visión más amplia, consulta los [Casos de uso para dominios tokenizados en 2026](/en/blog/tokenized-domain-use-cases-2026/).