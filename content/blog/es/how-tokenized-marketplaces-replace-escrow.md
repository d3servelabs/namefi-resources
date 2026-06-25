---
title: "Desde el listado hasta la liquidación: Cómo los mercados tokenizados reemplazan el depósito en garantía (escrow)"
date: '2026-05-22'
language: es
tags: ['guide']
authors: ['namefiteam']
draft: false
description: "Cómo los mercados de dominios tokenizados permiten a compradores y vendedores liquidar atómicamente en cadena (on-chain): sin servicios de depósito en garantía (escrow), sin códigos de autorización, sin bloqueos de registrador de cinco días. Qué reemplaza cada pieza del flujo tradicional y qué riesgos se trasladan a otras capas."
keywords: ['mercado de dominios blockchain', 'transferencia atómica de dominios', 'mercado de dominios tokenizados', 'reemplazar escrow de dominios', 'venta de dominio sin escrow', 'venta de dominio cripto', 'proceso de venta de dominio tokenizado', 'vender dominio tokenizado', 'comprar dominio tokenizado', 'venta de dominio en cadena', 'liquidación de NFT de dominio', 'mercado de dominios 2026', 'liquidez de dominios tokenizados']
---

El flujo tradicional para vender un `.com` es más o menos así:

1. Listar en [Sedo](https://sedo.com/), [Afternic](https://www.afternic.com/) o Dan.com.
2. Negociar.
3. Abrir un [depósito en garantía o escrow](/es/glossary/escrow/) en [Escrow.com](https://www.escrow.com/) o similar. El comprador transfiere los fondos.
4. El vendedor desbloquea el dominio y proporciona el [código de autorización](/es/glossary/auth-code/).
5. El comprador inicia la [transferencia entre registradores](/es/glossary/cross-registrar-transfer/) en su [registrador](/es/glossary/registrar/).
6. Esperar de 5 a 7 días para que se complete la transferencia de la [ICANN](/es/glossary/icann/).
7. Confirmar la transferencia; el escrow libera los fondos.
8. Pagar entre un 3% y un 6% en comisiones de escrow, más la comisión del mercado.

Funciona. Ha sido el estándar durante dos décadas. Pero también es lento, costoso y está lleno de momentos en los que una de las partes tiene que confiar en que la otra (o un servicio de escrow de terceros) haga lo correcto.

Las ventas de dominios tokenizados comprimen todo esto en una sola transacción. Esta publicación explica cómo, y hacia dónde se traslada realmente la confianza.

---

## El nuevo flujo, de principio a fin

1. Listar el [dominio tokenizado](/es/blog/what-are-tokenized-domains/) en un [mercado](/es/glossary/marketplace/) (el propio de Namefi, Doma, [OpenSea](https://opensea.io/), [Blur](https://blur.io/), etc.).
2. El comprador paga. El [NFT](/es/glossary/nft/) se transfiere a la [billetera (wallet)](/es/glossary/wallet/) del comprador. El registro del lado del [registrador](/es/glossary/registrar/) es mantenido en sincronía por la plataforma.
3. Listo.

Eso es todo. Dos pasos. Sin [código de autorización](/es/glossary/auth-code/), sin [escrow](/es/glossary/escrow/), sin bloqueo de registrador de 5 días, sin la incertidumbre de "ya envié el dinero, ahora confío en ti".

Esto funciona porque el **NFT es el registro de propiedad canónico**, y las transacciones [en cadena (on-chain)](/es/glossary/on-chain/) son [atómicas](/es/glossary/atomic-transfer/): el pago y la transferencia del activo ocurren en el mismo bloque, o no ocurre ninguno de los dos.

---

## En qué se convierte cada pieza tradicional

### Plataforma de listado

La misma idea, pero en una superficie diferente. Los mercados siguen cobrando una comisión y siguen seleccionando los listados. El gran cambio: los listados tokenizados pueden aparecer en **múltiples mercados a la vez** porque son NFT estándar. Se listan una vez en la plataforma que originó el dominio; y plataformas como OpenSea o Blur pueden agregarlo automáticamente.

Esta es una mejora significativa de la [liquidez](/es/glossary/domain-liquidity/) en comparación con el mundo de los dominios tradicionales, donde Sedo y Afternic funcionaban como ecosistemas cerrados (walled gardens).

### Escrow.com

**Desaparece.** Es reemplazado por la liquidación atómica en cadena.

En el flujo tradicional, el escrow existe para cerrar la brecha asíncrona entre el momento en que el comprador paga y el vendedor transfiere. En el flujo tokenizado, esa brecha no existe: la transacción es atómica, por lo que ningún tercero necesita retener el dinero en el medio. Esto elimina la tarifa de escrow del 3 al 6% y el tiempo de espera.

### Códigos de autorización (códigos EPP)

**No son necesarios para la mitad tokenizada de la transacción.** La transferencia en cadena ocurre inmediatamente. La sincronización del registro del lado del registrador es manejada por el protocolo; el comprador no necesita hacer nada manual.

(Si más adelante un comprador quiere *destokenizar* el dominio y trasladarlo a un registrador completamente diferente, ese sería un flujo separado que volvería a activar el mecanismo tradicional de transferencia entre registradores, incluyendo los códigos de autorización y todo lo demás).

### Bloqueo de transferencia de 5 días de la ICANN

**Se omite para la transferencia tokenizada en sí.** Las reglas de transferencia de la ICANN se aplican a las transferencias entre registradores, no a los cambios de propiedad dentro de un mismo registrador. La plataforma de dominios tokenizados maneja el cambio en cadena sin desencadenar una transferencia completa entre registradores.

Existe una regla relacionada (el período de espera de 60 días después de una transferencia de registrador) que todavía se aplica si un dominio fue transferido recientemente entre registradores. Pero eso se refiere a las transferencias de registrador, no a las transferencias en cadena, por lo que no bloquea las ventas tokenizadas.

### Transferencias bancarias y retrasos

**Reemplazados por pagos con criptomonedas y [monedas estables (stablecoins)](/es/glossary/stablecoin/).** USDC, ETH y otros pagos en cadena se liquidan en segundos. Las transferencias bancarias tardan días en liquidarse. La diferencia es mucho más evidente en las ventas internacionales.

### "Confío en que la otra persona haga su parte"

**Reemplazado por la atomicidad de los contratos inteligentes.** La transacción se completa en su totalidad (tú obtienes el activo, ellos obtienen el dinero) o no se realiza en absoluto (no hay movimiento por ninguna de las partes). No hay ninguna versión en la que una parte actúe y la otra no.

---

## Hacia dónde se trasladan realmente los riesgos

No todo son ventajas; el perfil de riesgo cambia. Algunos riesgos que el escrow manejaba en el flujo tradicional ahora residen en otros lugares.

### Riesgo de seguridad de la billetera

Ahora estás enviando un NFT a una dirección de billetera. Si el comprador te dio la dirección equivocada, o si tu interfaz te engaña para que lo envíes a una dirección incorrecta, es tu responsabilidad. Siempre verifica la dirección del destinatario.

### Riesgo de los contratos inteligentes

El [contrato inteligente](/es/glossary/smart-contract/) del mercado es el nuevo "escrow". Si tiene un error, pueden ocurrir cosas extrañas. Es por esto que los mercados auditados y probados son importantes. No seas el primero en usar un contrato completamente nuevo para una venta de alto valor.

### Front-running y MEV

Los listados en cadena son públicos. Un actor decidido puede intentar adelantarse (front-run) a una transacción (el término general es [MEV — Valor Máximo Extraíble](https://ethereum.org/en/developers/docs/mev/)). Los principales mercados tienen mitigaciones, pero es una categoría de riesgo que no existía en el flujo tradicional.

### Riesgo de activos robados

Si el NFT que estás comprando fue robado, podrías terminar con un dominio que las plataformas y los mercados se estén coordinando para marcar (flag). Algunos mercados se negarán a validar las ventas de NFT marcados. Esta es un área de trabajo real y en desarrollo dentro del ecosistema general de los NFT.

### KYC / sanciones

Dependiendo del mercado y la jurisdicción, es posible que compradores y vendedores enfrenten requisitos de KYC (Conozca a su Cliente). Esto no es nuevo (los servicios de escrow también los tenían), pero la mecánica es diferente.

### Eventos fiscales

Una venta pagada en criptomonedas es un evento fiscal diferente a una venta pagada en moneda fiduciaria en algunas jurisdicciones. Consulta la publicación sobre [preguntas fiscales y contables sobre dominios tokenizados](/es/blog/tax-and-accounting-questions-for-tokenized-domains/) para ver la lista de preguntas que debes plantearle a tu contador.

---

## Qué significa esto para los compradores

- **Velocidad.** Las ventas se liquidan en minutos, no en días.
- **Tarifas más bajas.** Sin la comisión del escrow. Los costos de red ([gas](/es/glossary/gas/)) y del mercado suelen ser mucho menores que el 3-6%.
- **Propiedad directa.** El NFT está en tu billetera de inmediato, sin esperas.
- **Verificación.** Puedes revisar el historial en cadena antes de comprar: cuándo se acuñó el dominio, transferencias previas, listados anteriores.

Estás cambiando la comodidad de un flujo de trabajo de escrow familiar por la desconocida comodidad de la atomicidad criptográfica. Para la mayoría de los compradores acostumbrados a los NFT, esto es una mejora definitiva. Para los primerizos, vale la pena hacer primero una pequeña transacción de práctica.

---

## Qué significa esto para los vendedores

- **Las mismas mejoras**: más rápido, más barato, más transparente.
- **Más plataformas.** Tu listado puede aparecer en múltiples mercados de NFT simultáneamente.
- **Diferente audiencia.** Los compradores en los mercados de NFT se comportan de manera diferente a los compradores tradicionales de dominios. La dinámica de precios puede cambiar en cualquier dirección dependiendo del dominio.
- **Sin riesgo de "comprador fantasma".** O la transacción se completa o no lo hace. Se acabó el "el comprador pagó el escrow y luego desapareció".

La otra cara de la moneda: renuncias al alcance de marketing (a veces considerable) de las agencias de corretaje especializadas de la industria de dominios tradicionales. Para los dominios premium, las estrategias híbridas (listarlo tanto como un NFT tokenizado como a través de canales tradicionales) son muy comunes.

---

## Listados híbridos

Nada en un dominio tokenizado te impide listarlo también a la antigua. Muchos propietarios listan:

- En el propio mercado de la plataforma.
- En mercados generales de NFT (OpenSea, Blur).
- En mercados tradicionales de dominios (Sedo, Afternic), con la salvedad de que el comprador podría querer "destokenizarlo" o aceptar la forma tokenizada.

Esto supone más trabajo, pero para los dominios de primer nivel amplía significativamente el grupo de compradores.

---

## Hacia dónde creemos que va esto

Una vez que los compradores y vendedores se acostumbren a la liquidación atómica, el flujo tradicional de escrow empezará a sentirse como hacer un cheque de papel: funcional, pero arcaico. Las piezas que aún se necesitan para que los mercados de dominios tokenizados absorban un mayor volumen son:

- Mejor búsqueda y filtrado específicos de dominios en los mercados de NFT.
- Mejores herramientas de valoración para activos heterogéneos.
- Mayor cobertura de extensiones ([TLD](/es/glossary/tld/)) en las plataformas de tokenización.
- Contratos estables y bien auditados que no hayan presentado ningún incidente de alto perfil.

Todo esto está en proceso de desarrollo y mejora visiblemente año tras año.

---

## Aviso legal amistoso (¡Léeme!)

> No somos abogados, contadores, asesores financieros ni médicos; y **nada en este artículo constituye asesoramiento legal, financiero, fiscal, contable, médico ni de ningún otro tipo profesional.** Escribimos estas publicaciones para educarnos a nosotros mismos y como una conveniencia para nuestros clientes. La información aquí contenida puede estar desactualizada, ser específica de una región o simplemente estar equivocada; nosotros también cometemos errores.
>
> Para cualquier decisión importante, **por favor consulta a un profesional real (¡en serio!)**. O si esa no es tu onda, pregúntale a un amigo, a Twitter, a Reddit, a una IA o a un vidente. En resumen: **DOYR — Do Your Own Research (Haz tu propia investigación)**. Aprendamos y divirtámonos.

---

## Resumen

- Los mercados de dominios tokenizados comprimen el flujo tradicional de listar → negociar → escrow → transferir → liquidar en una sola transacción en cadena.
- La pieza que desaparece más claramente es el **escrow**: la atomicidad criptográfica hace innecesario que un tercero retenga los fondos.
- Los códigos de autorización, los bloqueos del registrador y las transferencias bancarias también desaparecen para la mitad tokenizada de la transacción.
- En su lugar, aparecen nuevos riesgos: seguridad de la billetera, errores en los contratos inteligentes, MEV y coordinación sobre activos robados. Los riesgos se trasladan a diferentes lugares, no es que desaparezcan.
- Efecto neto: ventas más rápidas, más baratas y más transparentes, con una experiencia de usuario diferente (y mejorable). Los listados híbridos siguen siendo comunes para los dominios premium.

Si realmente quieres intentar vender un dominio tokenizado, dirígete a [namefi.io](https://namefi.io). Para tener una perspectiva más amplia, consulta los [Casos de uso para dominios tokenizados en 2026](/es/blog/tokenized-domain-use-cases-2026/).