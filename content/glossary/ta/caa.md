---
title: "CAA"
date: '2026-10-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "சான்றிதழ்களை வழங்க டொமைன் அனுமதிக்கும் சான்றிதழ் ஆணையங்களை CAA பதிவு குறிப்பிடுகிறது."
keywords: ["CAA", "சான்றிதழ் ஆணைய அனுமதி", "TLS அடையாளச் சரிபார்ப்பு"]
also_known_as: ["சான்றிதழ் ஆணைய அனுமதி"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc8659#section-1
  - https://www.rfc-editor.org/rfc/rfc8659#section-5
  - https://letsencrypt.org/docs/caa/
relatedArticles:
  - /ta/blog/the-fox-it-dns-hijack/
  - /ta/blog/the-myetherwallet-bgp-dns-attack/
  - /ta/blog/the-curve-finance-dns-hijack/
  - /ta/blog/dns-on-tokenized-domains/
  - /ta/blog/dnssec-for-domain-owners/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-basics/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/tokenize-your-com/
relatedGlossary:
  - /ta/glossary/certificate-authority/
  - /ta/glossary/intermediate-ca/
  - /ta/glossary/man-in-the-middle-attack/
  - /ta/glossary/dane/
  - /ta/glossary/certificate-transparency/
---

**CAA** என்பது **சான்றிதழ் ஆணைய அனுமதி** என்பதன் சுருக்கம். சான்றிதழ்களை வழங்க டொமைன் அனுமதிக்கும் [சான்றிதழ் ஆணையம்](/ta/glossary/certificate-authority/) அல்லது ஆணையங்களை அடையாளம் காட்டும் DNS பதிவே CAA. விதிகளைக் கடைப்பிடிக்கும் CA, வழங்கலுக்கு முன் பொருந்தும் CAA பதிவுகளைச் சரிபார்க்கிறது. [DNSSEC (டொமைன் பெயர் அமைப்பு பாதுகாப்பு நீட்டிப்புகள்)](/ta/glossary/dnssec/), கொள்கையைக் கொண்ட DNS பதிலின் நம்பகத்தன்மையை உறுதிப்படுத்த முடியும். விதிகளைப் பின்பற்றும் செயல்முறைகளில் வேண்டாத சான்றிதழ் வழங்கலை CAA குறைக்கிறது. மற்ற வழங்குநர்களின் சான்றிதழ்களை உலாவிகள் நிராகரிக்க CAA கட்டாயப்படுத்தாது. ஏற்கெனவே உள்ள சான்றிதழ்களை CAA திரும்பப்பெறாது. பாதுகாப்பு மீறப்பட்ட CA கையொப்பச் சாவியால் நேரடியாகப் போலிச் சான்றிதழ்களை உருவாக்குபவரையும் CAA தடுக்காது. CAA வழங்குநர் அனுமதியைக் குறிப்பிடுகிறது. டொமைன் சரிபார்ப்பு தனித் தேவையாகவே தொடர்கிறது.
