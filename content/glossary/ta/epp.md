---
title: EPP
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
description: டொமைன் பதிவுகளை உருவாக்க, புதுப்பிக்க, மாற்ற அல்லது நீக்க registrar-கள் registry-யுடன் தொடர்பு கொள்ள பயன்படுத்தும் நிலையான நெறிமுறை.
keywords: ['EPP', 'விரிவாக்கக்கூடிய வழங்கல் நெறிமுறை', 'டொமைன் மேலாண்மை', 'registry நெறிமுறை', 'RFC 5730']
also_known_as: ['விரிவாக்கக்கூடிய வழங்கல் நெறிமுறை']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5730
relatedArticles:
  - /ta/blog/the-panix-com-domain-hijack/
  - /ta/blog/the-lenovo-com-dns-hijack/
  - /ta/blog/expired-domains-and-the-drop-cycle/
  - /ta/blog/what-is-udrp/
  - /ta/blog/domain-escrow-explained/
relatedTopics:
  - /ta/topics/domain-basics/
  - /ta/topics/domain-security/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/domain-flipping-skills/
relatedGlossary:
  - /ta/glossary/registrar/
  - /ta/glossary/registry/
  - /ta/glossary/epp-status-codes/
  - /ta/glossary/dns/
  - /ta/glossary/icann/
---

**EPP** (Extensible Provisioning Protocol) என்பது RFC 5730-இல் வரையறுக்கப்பட்ட XML அடிப்படையிலான கட்டளை நெறிமுறை ஆகும். இது ஒரு [ரெஜிஸ்ட்ரார்](/ta/glossary/registrar/) [பதிவக நிறுவனத்துடன் (Registry)](/ta/glossary/registry/) எவ்வாறு தொடர்பு கொண்டு டொமைன் பதிவுகளை உருவாக்குகிறது, புதுப்பிக்கிறது, மாற்றுகிறது அல்லது நீக்குகிறது என்பதை நிர்வகிக்கிறது. ஒரு ரெஜிஸ்ட்ரார் புதிய பெயரை பதிவு செய்யும்போது, புதுப்பிக்கும்போது அல்லது மாற்றத்தை தொடங்கும்போதெல்லாம், registry-யின் EPP சேவையகத்திற்கு பாதுகாப்பான TCP அமர்வு வழியாக ஒரு EPP கட்டளையை அனுப்புகிறது; வெற்றியை உறுதிப்படுத்தும் அல்லது பிழையை தெரிவிக்கும் கட்டமைக்கப்பட்ட பதிலை பெறுகிறது. இந்த நெறிமுறை வெளிச்செல்லும் மாற்றங்களை அங்கீகரிக்க பயன்படும் [அனுமதிக் குறியீட்டையும் (auth-code)](/ta/glossary/auth-code/) கொண்டு செல்கிறது; மேலும் ஒரு டொமைனின் தற்போதைய நிலையை விவரிக்கும் `clientTransferProhibited` அல்லது `serverHold` போன்ற [EPP நிலைக் குறியீடுகளையும் (EPP status codes)](/ta/glossary/epp-status-codes/) வெளிப்படுத்துகிறது. EPP கடுமையாக கட்டுப்படுத்தப்படுவதால், அங்கீகரிக்கப்பட்ட ரெஜிஸ்ட்ரார்களுக்கு மட்டுமே அணுகல் வழங்கப்படுகிறது; இறுதி பயனர்கள் நேரடியாக இதனுடன் தொடர்பு கொள்வதில்லை.
