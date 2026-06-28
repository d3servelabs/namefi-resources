---
title: DNSSEC (டொமைன் பெயர் அமைப்பு பாதுகாப்பு நீட்டிப்புகள்)
date: '2026-05-22'
language: ta
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: DNS பதிவுகளில் கிரிப்டோகிராஃபிக் கையெழுத்துகள் — இவை ஒரு பதில் நம்பகமானது என்றும், பரிமாற்றத்தில் போலியாகவோ திருத்தப்பட்டதாகவோ இல்லை என்றும் தீர்வுகாண்பவர்கள் சரிபார்க்க உதவுகின்றன.
keywords: ['DNSSEC', 'DNS பாதுகாப்பு', 'டொமைன் பாதுகாப்பு', 'DS பதிவு', 'நம்பிக்கை சங்கிலி', 'கிரிப்டோகிராஃபிக் DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4033
relatedArticles:
  - /ta/blog/dns-on-tokenized-domains/
  - /ta/blog/how-domain-hijacking-actually-happens/
  - /ta/blog/the-curve-finance-dns-hijack/
  - /ta/blog/the-dnspionage-campaign/
  - /ta/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/tokenize-your-com/
relatedGlossary:
  - /ta/glossary/dns/
  - /ta/glossary/registrar/
  - /ta/glossary/registry/
  - /ta/glossary/icann/
  - /ta/glossary/tld/
---

**DNSSEC (Domain Name System Security Extensions)** என்பது [DNS](/ta/glossary/dns/) நெறிமுறைக்கான கிரிப்டோகிராஃபிக் நீட்டிப்புகளின் தொகுப்பாகும் — இவை DNS பதில்களின் நம்பகத்தன்மையையும் ஒருமைப்பாட்டையும் தீர்வுகாண்பவர்கள் சரிபார்க்க உதவுகின்றன. DNSSEC இல்லாமல், தீர்வுகாண்பவருக்கும் அதிகாரப்பூர்வ சேவையகத்திற்கும் இடையிலான பாதையில் ஒரு தாக்குபவர் DNS பதில்களை போலியாக உருவாக்கலாம் அல்லது திருத்தலாம் — இதனால் பயனர்கள் தீங்கிழைக்கும் உள்கட்டமைப்பிற்குத் திசைதிருப்பப்படுவார்கள். DNSSEC இருக்கும்போது, பதிவுகள் கையெழுத்திடப்பட்டிருக்கும், மேலும் DS பதிவுகள் வழியாக DNS வேர் முதல் ஒவ்வொரு மண்டலம் வழியாகவும் நம்பிக்கை சங்கிலி இயங்குகிறது. DNSSEC ஆனது [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033) மற்றும் தொடர்புடைய RFC களில் வரையறுக்கப்பட்டுள்ளது. ஒரு டொமைனை டோக்கனாக மாற்றுவது DNSSEC ஐ எந்த வகையிலும் மாற்றாது — நம்பிக்கை சங்கிலி இன்னும் [பதிவாளர்](/ta/glossary/registrar/) மற்றும் [பதிவேட்டகம்](/ta/glossary/registry/) வழியாகவே இயங்குகிறது, மேலும் DS பதிவுகள் அதே முறையில் வெளியிடப்படுகின்றன. பல DNS வழங்குநர்கள் (Cloudflare, Route53) DNSSEC இயக்கப்படும்போது மண்டலங்களில் தானாகவே கையெழுத்திடுகின்றனர்.
