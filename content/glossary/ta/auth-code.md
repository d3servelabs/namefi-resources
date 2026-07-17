---
title: அனுமதிக் குறியீடு (EPP Code, Transfer Code)
date: '2026-05-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
description: ஒரு டொமைனை வேறு registrar-க்கு மாற்ற அனுமதிக்க registrar வழங்கும் குறுகிய per-domain இரகசியக் குறியீடு; EPP code அல்லது transfer code என்றும் அழைக்கப்படுகிறது.
keywords: ['அனுமதிக் குறியீடு', 'EPP குறியீடு', 'மாற்றுக் குறியீடு', 'டொமைன் மாற்றம்', 'அங்கீகாரக் குறியீடு', 'AuthInfo குறியீடு']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
relatedArticles:
  - /ta/blog/domain-escrow-explained/
  - /ta/blog/how-to-sell-a-domain-name-you-own/
  - /ta/blog/how-tokenization-changes-domain-flipping/
  - /ta/blog/the-panix-com-domain-hijack/
  - /ta/blog/how-to-tokenize-your-com/
relatedTopics:
  - /ta/topics/domain-tokenization/
  - /ta/topics/domain-basics/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/domain-investor-field-guide/
relatedGlossary:
  - /ta/glossary/registrar/
  - /ta/glossary/registry/
  - /ta/glossary/dns/
  - /ta/glossary/cross-registrar-transfer/
  - /ta/glossary/epp/
---

ஒரு **அனுமதிக் குறியீடு** (auth code) — **EPP code**, **AuthInfo code**, அல்லது **transfer code** என்றும் அழைக்கப்படுகிறது — என்பது ஒரு குறிப்பிட்ட டொமைனுக்காக [registrar](/ta/glossary/registrar/) வழங்கும் குறுகிய பகிரப்பட்ட இரகசியம் ஆகும்; இது [தரப்பு மாற்ற இடமாற்றத்தை](/ta/glossary/cross-registrar-transfer/) அங்கீகரிக்கிறது. EPP (Extensible Provisioning Protocol) என்பது அடிப்படை registry நெறிமுறை (protocol); அனுமதிக் குறியீடு அதில் ஒவ்வொரு டொமைனுக்குமான அடையாளச் சான்றிதழ் ஆகும். ஒரு registrar-இலிருந்து மற்றொன்றுக்கு டொமைனை மாற்ற வேண்டுமெனில், பெறும் registrar, [பதிவாளர்](/ta/glossary/registrant/) இழக்கும் registrar-இடமிருந்து பெற்ற சரியான அனுமதிக் குறியீட்டை சமர்ப்பிக்க வேண்டும். இந்தக் குறியீடு பொதுவாக registrar-இன் கட்டுப்பாட்டுப் பலகத்தில் (control panel) காணலாம்; சில நேரங்களில் "Transfer Out" அல்லது "Get EPP Code" என்ற பொத்தானுக்கு பின்னால் மறைக்கப்பட்டிருக்கும். [டோக்கனைஸ் செய்யப்பட்ட டொமைன்களுக்கு](/ta/blog/what-are-tokenized-domains/), [ஆன்-செயின்](/ta/glossary/on-chain/) உரிமை மாற்றத்திற்கு அனுமதிக் குறியீடு தேவையில்லை — [NFT](/ta/glossary/nft/) மாற்றம் ஆன்-செயினில் அணுவியல் முறையில் (atomic) நடைபெறுகிறது. அனுமதிக் குறியீடுகள் பாரம்பரிய [DNS](/ta/glossary/dns/) உலகில் registrar-களுக்கிடையே டொமைனை நகர்த்தும்போது மட்டுமே பொருந்தும்.
