---
title: Acuñación
date: '2026-06-22'
language: es
tags: ['glossary']
authors: ['namefiteam']
description: Creación de un nuevo token en una blockchain — para un dominio, emisión del NFT que representa su propiedad.
keywords: ['acuñación', 'acuñar', 'creación de NFT', 'emisión de tokens', 'on-chain']
also_known_as: ['Acuñar']
level: 1
sources:
  - https://ethereum.org/en/nft/
---

**Acuñación** (también llamada *acuñar*) es el acto de escribir un nuevo registro de token en una [blockchain](/es/glossary/blockchain/) — análogo a acuñar una moneda, salvo que la «ceca» es una función de [contrato inteligente](/es/glossary/smart-contract/) que crea una entrada en el estado on-chain del contrato y la asigna a una dirección propietaria. Para la tokenización de dominios, la acuñación es el paso crítico en que un nombre DNS real se convierte en un activo nativo de blockchain: un contrato inteligente ejecuta `mint`, creando un [NFT](/es/glossary/nft/) [ERC-721](/es/glossary/erc-721/) cuyo ID de token se corresponde con un dominio específico. A partir de ese momento, el dominio puede transferirse entre pares, listarse en un mercado de NFT o usarse en DeFi sin pasar por el flujo de trabajo del registrador tradicional. La acuñación requiere [gas](/es/glossary/gas/) para pagar la computación, y el proceso de [tokenización](/es/glossary/tokenize/) también implica bloquear el registro del registrador para que el propietario on-chain controle la configuración DNS. Una vez acuñado, el NFT es la fuente de verdad sobre la propiedad; quemar (destruir) el NFT devuelve el control al sistema de registro convencional.
