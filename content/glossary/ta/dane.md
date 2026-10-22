---
title: "DANE"
date: '2026-10-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "DNSSEC பாதுகாக்கும் TLSA பதிவுகளில் உள்ள சான்றிதழ் அல்லது சாவித் தொடர்புகள் மூலம் TLS சேவைகளை DANE உறுதிப்படுத்துகிறது."
keywords: ["DANE", "DNS அடிப்படையிலான பெயரிடப்பட்ட அமைப்புகளின் அடையாளச் சரிபார்ப்பு", "TLS அடையாளச் சரிபார்ப்பு"]
also_known_as: ["DNS அடிப்படையிலான பெயரிடப்பட்ட அமைப்புகளின் அடையாளச் சரிபார்ப்பு"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc6698#section-2
  - https://www.rfc-editor.org/rfc/rfc7671#section-5.1
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
  - /ta/glossary/caa/
  - /ta/glossary/certificate-transparency/
---

**DANE** என்பது **DNS அடிப்படையிலான பெயரிடப்பட்ட அமைப்புகளின் அடையாளச் சரிபார்ப்பு** என்பதன் சுருக்கம். TLSA பதிவுகள் மூலம் TLS சேவையைச் சான்றிதழ், பொது விசை அல்லது நம்பிக்கை ஆதாரத்துடன் DANE இணைக்கிறது. [DNSSEC (டொமைன் பெயர் அமைப்பு பாதுகாப்பு நீட்டிப்புகள்)](/ta/glossary/dnssec/), DNS தரவின் நம்பகத்தன்மையைச் சரிபார்க்கிறது. ஆதரிக்கும் கிளையன்ட் TLS அடையாளச் சரிபார்ப்பின்போது தொடர்பை அமல்படுத்துகிறது. தேர்ந்தெடுத்த பயன்பாட்டைப் பொறுத்து, DANE பொதுச் [சான்றிதழ் ஆணையம்](/ta/glossary/certificate-authority/) ஒன்றைக் கட்டுப்படுத்தலாம். அல்லது, பொது CA நம்பிக்கையைச் சாராமல் சேவையின் அடையாளத்தை உறுதிப்படுத்தலாம். TLSA பதிவுகளை வெளியிடுவது மட்டும் DANE-ஐப் புறக்கணிக்கும் கிளையன்ட்களைப் பாதுகாக்காது. இயக்குநர்கள் சாவி மாற்றங்களை TLSA புதுப்பிப்புகளுடன் ஒருங்கிணைத்து, DNSSEC சரிபார்ப்பைப் பராமரிக்க வேண்டும்.
