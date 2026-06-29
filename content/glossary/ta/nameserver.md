---
title: பெயர் சேவையகம் (NS பதிவு)
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
description: ஒரு டொமைனுக்கான DNS வினவல்களுக்கு பதிலளிக்கும் சேவையகம்; அதன் NS பதிவுகள் அதிகாரப்பூர்வ சேவையகங்களை குறிப்பிடுகின்றன.
keywords: ['பெயர் சேவையகம்', 'NS பதிவு', 'அதிகாரப்பூர்வ சேவையகம்', 'DNS பகிர்வு', 'DNS விருந்தோம்பல்']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/dns-server-types/
relatedArticles:
  - /ta/blog/how-domain-hijacking-actually-happens/
  - /ta/blog/the-myetherwallet-bgp-dns-attack/
  - /ta/blog/dns-on-tokenized-domains/
  - /ta/blog/the-lenovo-com-dns-hijack/
  - /ta/blog/the-dnspionage-campaign/
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
  - /ta/glossary/tld/
  - /ta/glossary/zone-file/
---

ஒரு **பெயர் சேவையகம்** (nameserver) என்பது ஒரு டொமைனுக்கான [DNS](/ta/glossary/dns/) வினவல்களுக்கு பதிலளிக்கும் சேவையகமாகும். டொமைனின் [பதிவகத்தில்](/ta/glossary/registry/) (registry) உள்ள **NS பதிவுகள்** அந்த டொமைனுக்கு அதிகாரப்பூர்வமான பெயர் சேவையகங்களை அறிவிக்கின்றன. ஒரு டொமைனை DNS விருந்தோம்பலுக்கு (Cloudflare, Route 53, அல்லது உங்கள் [பதிவாளரின்](/ta/glossary/registrar/) சொந்த DNS) சுட்டும்போது, நீங்கள் அதன் பெயர் சேவையகங்களை அமைக்கிறீர்கள்; அந்தச் சேவையகங்கள் பின்னர் போக்குவரத்தையும் மின்னஞ்சலையும் வழிநடத்தும் [பதிவு வகைகளை](/ta/glossary/dns-record-types/) — A, MX, TXT மற்றும் ஏனையவற்றை — வெளியிடுகின்றன.
