---
title: IPFS
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
description: கோப்புகளை அவற்றின் உள்ளடக்கத்தால் அடையாளப்படுத்தும் ஒரு பியர்-டு-பியர் நெறிமுறை; பரவலாக்கப்பட்ட இணைய தரவை வழங்க பயன்படுகிறது.
keywords: ['IPFS', 'உள்ளடக்க முகவரியிடல்', 'பியர்-டு-பியர்', 'பரவலாக்கப்பட்ட சேமிப்பு', 'CID']
also_known_as: ['InterPlanetary File System']
level: 1
sources:
  - https://docs.ipfs.tech/concepts/what-is-ipfs/
relatedArticles:
  - /ta/blog/the-curve-finance-dns-hijack/
  - /ta/blog/what-are-tokenized-domains/
  - /ta/blog/the-fox-it-dns-hijack/
  - /ta/blog/onchain-domain-custody-and-recovery/
  - /ta/blog/the-2024-squarespace-defi-domain-hijacks/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/domain-flipping-skills/
relatedGlossary:
  - /ta/glossary/web3/
  - /ta/glossary/dns/
  - /ta/glossary/tokenized-domain/
  - /ta/glossary/registrar/
  - /ta/glossary/blockchain/
---

**IPFS** (InterPlanetary File System) என்பது ஒரு பியர்-டு-பியர் ஹைப்பர்மீடியா நெறிமுறை ஆகும். இது கோப்புகளை சேவையக இருப்பிடத்தால் அல்ல, மாறாக அவற்றின் உள்ளடக்க ஹாஷ் மூலம் — Content Identifier (CID) என்று அழைக்கப்படும் — அடையாளப்படுத்துகிறது. இரண்டு கணுக்கள் (nodes) ஒரே கோப்பை வைத்திருந்தால், இரண்டும் ஒரே CID-ஐ உருவாக்கும்; இதனால் வலைப்பின்னல் அருகில் இருக்கும் எந்த கணுவிலிருந்தும் அந்தக் கோப்பை பெறலாம். இந்த உள்ளடக்க முகவரியிடல் (content-addressing) மாதிரி HTTP-க்கு நேர்மாறானது — HTTP-ல் ஒரு URL குறிப்பிட்ட சேவையகத்தை சுட்டும், அது எப்போது வேண்டுமானாலும் இணைப்பிலிருந்து விலகலாம். [Web3](/ta/glossary/web3/) பயன்பாடுகளில் IPFS ஒரு நிலையான ஆஃப்-செயின் (off-chain) தரவு அடுக்காக செயல்படுகிறது: NFT மெட்டாடேட்டா, கலை படைப்புகள் மற்றும் ஆவணங்கள் IPFS-ல் சேமிக்கப்படுகின்றன — இதன் மூலம் அவை விலையுயர்ந்த [பிளாக்செயின்](/ta/glossary/blockchain/)-ல் நிரந்தரமாக பின்னிக்கொள்வதை தவிர்க்கலாம்; அதற்கு பதிலாக [ஆன்-செயின்](/ta/glossary/on-chain/) பதிவு மாறாத CID-ஐ மட்டும் வைத்திருக்கும். டோக்கனைஸ் செய்யப்பட்ட டொமைன்களுக்கு (tokenized domains), IPFS ஒரு பரவலாக்கப்பட்ட இணையதளத்தை வழங்க முடியும் — IPFS-இயக்கக்கூடிய நுழைவாயில் (gateway) அல்லது உலாவி நீட்டிப்பு (browser extension) இருந்தால் அது வழக்கமான DNS சேவையகங்களை முற்றிலும் கடந்து செயல்படும்.
