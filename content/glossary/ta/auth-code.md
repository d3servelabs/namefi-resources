---
title: Auth Code
date: '2026-05-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
description: டொமைனை வேறு registrar-க்கு நகர்த்த அனுமதிக்க registrar வழங்கும் குறுகிய per-domain secret; EPP code அல்லது transfer code என்றும் அழைக்கப்படுகிறது.
keywords: ['auth code', 'EPP code', 'transfer code', 'domain transfer', 'authorization code', 'AuthInfo code']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
---

ஒரு **auth code** - **EPP code**, **AuthInfo code**, அல்லது **transfer code** என்றும் அழைக்கப்படுகிறது - ஒரு குறிப்பிட்ட டொமைனுக்காக [registrar](/ta/glossary/registrar/) வழங்கும் குறுகிய shared secret; இது [cross-registrar transfer](/ta/glossary/cross-registrar-transfer/) ஐ அங்கீகரிக்கிறது. EPP (Extensible Provisioning Protocol) என்பது underlying registry protocol; auth code அதில் உள்ள per-domain credential. ஒரு registrar-இலிருந்து மற்றொன்றுக்கு domain transfer செய்ய, பெறும் registrar, இழக்கும் registrar-இலிருந்து [registrant](/ta/glossary/registrant/) பெற்ற valid auth code-ஐ சமர்ப்பிக்க வேண்டும். இந்த code பொதுவாக registrar control panel-இல் தெரியும்; சில நேரங்களில் "Transfer Out" அல்லது "Get EPP Code" button-க்கு பின்னால் மறைக்கப்பட்டிருக்கும். [Tokenized domains](/ta/blog/what-are-tokenized-domains/) களுக்கு, [on-chain](/ta/glossary/on-chain/) ownership transfer-க்கு auth code தேவையில்லை - [NFT](/ta/glossary/nft/) transfer on-chain-இல் atomic ஆகும். Auth codes பாரம்பரிய [DNS](/ta/glossary/dns/) உலகில் registrars-க்கிடையே டொமைனை நகர்த்தும் போது மட்டுமே பொருந்தும்.
