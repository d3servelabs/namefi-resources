---
title: Registry Lock (பதிவக பூட்டு)
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
description: பதிவகம் ஒரு டொமைனை உறைய வைக்கும் உயர்நிலை பாதுகாப்பு சேவை; எந்த மாற்றமும் கைமுறை வெளிப்புற சரிபார்ப்பு மூலமே செய்யப்படும்.
keywords: ['பதிவக பூட்டு', 'டொமைன் பூட்டு', 'உயர்நிலை பாதுகாப்பு பூட்டு', 'டொமைன் கடத்தல் தடுப்பு', 'வெளிப்புற சரிபார்ப்பு']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /ta/blog/the-syrian-electronic-army-nyt-hijack/
  - /ta/blog/the-fox-it-dns-hijack/
  - /ta/blog/the-sea-turtle-dns-espionage/
  - /ta/blog/how-domain-hijacking-actually-happens/
  - /ta/blog/the-malaysia-airlines-dns-hijack/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-basics/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/domain-flipping-skills/
relatedGlossary:
  - /ta/glossary/registrar/
  - /ta/glossary/registry/
  - /ta/glossary/dns/
  - /ta/glossary/domain-hijacking/
  - /ta/glossary/transfer-lock/
---

**Registry Lock** என்பது ஒரு [பதிவக நிறுவனம்](/ta/glossary/registry/) வழங்கும் சிறப்பு பாதுகாப்பு சேவையாகும். இச்சேவையில் ஒரு டொமைன் பெயரை ஒரு குறிப்பிட்ட நிலையில் உறைய வைக்கலாம் — அதன் பிறகு, [பெயர் சேவையகம்](/ta/glossary/nameserver/) மாற்றங்கள், பரிமாற்றங்கள், அல்லது நீக்கங்கள் உள்ளிட்ட எந்த திருத்தமும் சாதாரண தானியங்கி EPP வழிமுறை மூலம் செயல்படுத்த இயலாது. அதற்கு பதிலாக, எந்த மாற்றமும் செய்ய வேண்டுமானால் [ரெஜிஸ்ட்ரார்](/ta/glossary/registrar/)க்கும் பதிவகத்திற்கும் இடையே தொலைபேசி அழைப்புகள், குறியாக்க டோக்கன்கள் (cryptographic tokens), அல்லது நேரில் அடையாள சரிபார்ப்பு போன்ற கைமுறை, வெளிப்புற சரிபார்ப்பு செயல்முறை மேற்கொள்ளப்பட வேண்டும். இது மிகவும் பரவலான [பரிமாற்ற பூட்டு](/ta/glossary/transfer-lock/) (transfer lock) என்பதிலிருந்து வேறுபட்டது — பரிமாற்ற பூட்டை ரெஜிஸ்ட்ரார் தனது சொந்த அமைப்புகள் வழி கட்டுப்படுத்தவும் மாற்றவும் முடியும். Registry Lock ஆனது பாதுகாப்பை பதிவக அளவிற்கு உயர்த்துவதால், ஒரு தாக்குபவர் ரெஜிஸ்ட்ரார் கணக்கை முழுமையாக கைப்பற்றினாலும் கூட அங்கீகரிக்கப்படாத மாற்றங்களை மேற்கொள்வது மிகவும் கடினமாகிறது. நிதி நிறுவனங்கள், பெரிய வர்த்தக முத்திரைகள், மற்றும் முக்கியமான உள்கட்டமைப்பு இயக்குனர்கள் தங்களின் மதிப்புமிக்க டொமைன்களை [டொமைன் கடத்தல்](/ta/glossary/domain-hijacking/) என்பதிலிருந்து பாதுகாக்க இந்த சேவையை பெரும்பாலும் பயன்படுத்துகின்றனர்.
