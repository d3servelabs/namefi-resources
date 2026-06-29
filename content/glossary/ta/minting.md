---
title: டோக்கன் உருவாக்கம் (Minting)
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
description: ஒரு blockchain-இல் புதிய டோக்கனை உருவாக்கும் செயல் — டொமெயினுக்கு, அதன் உரிமையை குறிக்கும் NFT-ஐ வெளியிடுவது.
keywords: ['டோக்கன் உருவாக்கம்', 'மிண்டிங்', 'NFT உருவாக்கம்', 'டோக்கன் வெளியீடு', 'ஆன்-செயின்']
also_known_as: ['மிண்ட்']
level: 1
sources:
  - https://ethereum.org/en/nft/
relatedArticles:
  - /ta/blog/what-are-tokenized-domains/
  - /ta/blog/how-to-tokenize-your-com/
  - /ta/blog/onchain-domain-custody-and-recovery/
  - /ta/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ta/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /ta/topics/domain-tokenization/
  - /ta/topics/domain-security/
relatedSeries:
  - /ta/series/domain-flipping-skills/
  - /ta/series/domain-apocalypse/
relatedGlossary:
  - /ta/glossary/dns/
  - /ta/glossary/registrar/
  - /ta/glossary/tokenized-domain/
  - /ta/glossary/web3/
  - /ta/glossary/tokenize/
---

**டோக்கன் உருவாக்கம் (Minting)** என்பது ஒரு [blockchain](/ta/glossary/blockchain/)-இல் புதிய டோக்கன் பதிவை எழுதும் செயலாகும் — நாணயம் அச்சடிப்பதற்கு ஒப்பானது; இங்கே "மிண்ட்" என்பது ஒரு [smart contract](/ta/glossary/smart-contract/) செயல்பாடு ஆகும், இது ஒப்பந்தத்தின் ஆன்-செயின் நிலையில் ஒரு பதிவை உருவாக்கி அதை ஒரு உரிமையாளர் முகவரியில் ஒதுக்குகிறது. டொமெயின் டோக்கனாக்கத்தில், மிண்டிங் என்பது ஒரு உண்மையான DNS பெயர் blockchain-நேட்டிவ் சொத்தாக மாறும் முக்கியமான படியாகும்: ஒரு smart contract `mint` என்ற செயல்பாட்டை அழைத்து ஒரு [ERC-721](/ta/glossary/erc-721/) [NFT](/ta/glossary/nft/)-ஐ உருவாக்குகிறது, இதில் டோக்கன் ID ஒரு குறிப்பிட்ட டொமெயினுடன் தொடர்புபடுத்தப்படுகிறது. அந்த தருணத்திலிருந்து, டொமெயினை நேர்-நேர் பரிமாற்றம் செய்யலாம், ஒரு [NFT சந்தையில்](/ta/glossary/marketplace/) பட்டியலிடலாம், அல்லது பாரம்பரிய பதிவாளர் (registrar) செயல்முறையை தொடாமலேயே [DeFi](/ta/glossary/defi/)-இல் பயன்படுத்தலாம். மிண்டிங்-க்கு கணக்கீட்டிற்கு பணம் செலுத்த [gas](/ta/glossary/gas/) தேவைப்படுகிறது; மேலும் [டோக்கனாக்கம்](/ta/glossary/tokenize/) (tokenize) செயல்முறையில் பதிவாளர் பதிவை பூட்டுவதும் அடங்கும், இதனால் ஆன்-செயின் உரிமையாளர் DNS உள்ளமைவை கட்டுப்படுத்துவார். மிண்ட் செய்யப்பட்டவுடன், NFT உரிமையின் உண்மையான ஆதாரமாகிறது; அதை எரிப்பது (destroying) மீண்டும் வழக்கமான பதிவு முறைமைக்கு கட்டுப்பாட்டை திரும்பப் பெற்றுத் தருகிறது.
