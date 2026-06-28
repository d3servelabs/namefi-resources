---
title: மண்டல கோப்பு (Glue Record)
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
description: ஒரு டொமைனின் அனைத்து DNS பதிவுகளையும் — அதன் பெயர் சேவையகங்களுக்கான glue பதிவுகள் உட்பட — கொண்டிருக்கும் உரை கோப்பு.
keywords: ['மண்டல கோப்பு', 'glue பதிவு', 'DNS மண்டலம்', 'அதிகாரப்பூர்வ பதிவுகள்', 'பெயர் சேவையகம்']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/dns-zone/
relatedArticles:
  - /ta/blog/how-domain-hijacking-actually-happens/
  - /ta/blog/what-are-tokenized-domains/
  - /ta/blog/dns-on-tokenized-domains/
  - /ta/blog/the-dnspionage-campaign/
  - /ta/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/tokenize-your-com/
relatedGlossary:
  - /ta/glossary/dns/
  - /ta/glossary/registry/
  - /ta/glossary/registrar/
  - /ta/glossary/tld/
  - /ta/glossary/icann/
---

ஒரு **மண்டல கோப்பு (zone file)** என்பது ஒரு டொமைனின் அதிகாரப்பூர்வ [பெயர் சேவையகத்தில்](/ta/glossary/nameserver/) இருக்கும் உரை கோப்பாகும். இதில் அந்த டொமைனின் அனைத்து [DNS பதிவுகளும்](/ta/glossary/dns-record-types/) — A, MX, TXT மற்றும் டொமைன் இயங்கும் விதத்தை வரையறுக்கும் பிற உள்ளீடுகளும் — அடங்கியிருக்கும். **Glue record** என்பது ஒரு சிறப்பு நிலை: ஒரு டொமைனின் பெயர் சேவையகங்கள் *அதே டொமைனுக்கு கீழேயே* இருக்கும்போது (எ.கா. `ns1.example.com` என்பது `example.com`-க்கு சேவை செய்யும்போது), தாய் [பதிவேடு (registry)](/ta/glossary/registry/) அந்த பெயர் சேவையகத்தின் [IP முகவரியை](/ta/glossary/ip-address/) நேரடியாக தாய் மண்டலத்தில் வெளியிட வேண்டும் — இல்லையெனில் ஒரு சுற்றுவட்ட தேடல் சிக்கல் ஏற்படும். மண்டல கோப்பை திருத்துவதன் மூலம் ஒரு டொமைனின் [DNS](/ta/glossary/dns/)-ஐ கட்டமைக்கலாம்.
