---
title: பொது விசை
date: '2026-06-22'
language: ta
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
description: ஒரு blockchain விசை ஜோடியில் பகிரக்கூடிய பாதி; தனிப்பட்ட விசையிலிருந்து உருவாக்கப்படும், நிதி பெறவும் கையொப்பங்களை சரிபார்க்கவும் பயன்படுகிறது.
keywords: ['பொது விசை', 'முகவரி', 'சரிபார்ப்பு விசை', 'சமச்சீரற்ற மறைக்குறியீடு', 'blockchain கணக்கு']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /ta/blog/the-badgerdao-frontend-attack/
  - /ta/blog/the-myetherwallet-bgp-dns-attack/
  - /ta/blog/do-multisig-wallets-actually-improve-security/
  - /ta/blog/onchain-domain-custody-and-recovery/
  - /ta/blog/the-sushiswap-miso-insider-attack/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-basics/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/domain-flipping-skills/
relatedGlossary:
  - /ta/glossary/private-key/
  - /ta/glossary/web3/
  - /ta/glossary/blockchain/
  - /ta/glossary/smart-contract/
  - /ta/glossary/dns/
---

ஒரு **பொது விசை** (public key) என்பது ஒரு [blockchain](/ta/glossary/blockchain/) கணக்கின் மறைக்குறியீட்டு விசை ஜோடியில் பகிரக்கூடிய பாதியாகும். இந்த விசையை — அல்லது இதிலிருந்து பெறப்படும் முகவரியை — வெளிப்படையாக பிரசுரிப்பது பாதுகாப்பானது: பிறர் உங்களுக்கு டோக்கன்கள் அனுப்பவும், உங்கள் சார்பாக smart contract-களை அழைக்கவும் இந்த முகவரி பயன்படுகிறது. பொது விசை, [தனிப்பட்ட விசையிலிருந்து](/ta/glossary/private-key/) ஒரு-திசை நீள்வட்ட வளைவு கணிதத்தின் (elliptic-curve math) மூலம் உருவாக்கப்படுகிறது; எனவே பொது விசையை பகிர்வதால் பரிவர்த்தனைகளை அங்கீகரிக்கும் இரகசியம் என்றும் வெளிப்படாது. ஒரு டிஜிட்டல் கையொப்பத்தை பொது விசையுடன் சரிபார்ப்பது, அந்த செய்தி பொருத்தமான தனிப்பட்ட விசையை வைத்திருப்பவரால் கையொப்பமிடப்பட்டது என்பதை நிரூபிக்கிறது — இவ்வாறுதான் நெட்வொர்க் ஒரு பரிவர்த்தனை உண்மையிலேயே அங்கீகரிக்கப்பட்டது என்பதை உறுதிப்படுத்துகிறது.
