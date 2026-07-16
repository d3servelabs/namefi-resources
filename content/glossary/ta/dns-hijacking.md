---
title: DNS கடத்தல்
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
description: டொமைனின் பதிவை மாற்றாமல், DNS தெளிவாக்கல் அடுக்கை சிதைத்து போக்குவரத்தை திசைதிருப்பும் தாக்குதல்.
keywords: ['DNS கடத்தல்', 'தற்காலிக நினைவக நச்சேற்றம்', 'DNS ஏமாற்றல்', 'DNSSEC', 'போக்குவரத்து திசைதிருப்பல்']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/dns-cache-poisoning/
relatedArticles:
  - /ta/blog/the-fox-it-dns-hijack/
  - /ta/blog/the-sea-turtle-dns-espionage/
  - /ta/blog/the-myetherwallet-bgp-dns-attack/
  - /ta/blog/the-dnspionage-campaign/
  - /ta/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/domain-investor-field-guide/
relatedGlossary:
  - /ta/glossary/dns/
  - /ta/glossary/registrar/
  - /ta/glossary/bgp-hijack/
  - /ta/glossary/registry/
  - /ta/glossary/urs/
---

**DNS கடத்தல்** (DNS spoofing அல்லது cache poisoning என்றும் அழைக்கப்படும்) என்பது பதிவை அல்ல, தெளிவாக்கல் அடுக்கை குறிவைக்கும் தாக்குதல் ஆகும்: [registrar](/ta/glossary/registrar/)-இல் டொமைனை கைப்பற்றுவதற்குப் பதிலாக, [DNS resolver](/ta/glossary/dns-resolver/)-ஓ அல்லது [nameserver](/ta/glossary/nameserver/)-ஓ அந்த டொமைன் எந்த முகவரியை சுட்டுகிறது என்று நம்புகிறதோ, அதை தாக்குபவர் சிதைக்கிறார் — இதனால் பயனர்கள் தீங்கான IP முகவரிக்கு தெரியாமல் அனுப்பப்படுகிறார்கள். தற்காலிக நினைவக நச்சேற்றம் (cache poisoning) தாக்குதலில், போலி DNS பதில் ஒன்று ஒரு recursive resolver-ஆல் ஏற்றுக்கொள்ளப்பட்டு TTL காலம் முடியும் வரை தற்காலிக நினைவகத்தில் சேமிக்கப்படுகிறது — அந்த resolver சேவை செய்யும் எல்லா பயனர்களும் தவறான இடத்திற்கு அழைத்துச் செல்லப்படுகிறார்கள், ஆனால் அதிகாரப்பூர்வமான [DNS](/ta/glossary/dns/) பதிவுகளில் எந்த மாற்றமும் தெரியாது. இதற்கான முதன்மை தொழில்நுட்ப எதிர்நடவடிக்கை [DNSSEC](/ta/glossary/dnssec/) ஆகும் — இது DNS பதில்களை மறைகுறியீட்டு முறையில் கையொப்பமிடுவதால், resolver-கள் சிதைவை கண்டறிய முடியும். பாரம்பரிய [டொமைன் திருட்டிலிருந்து](/ta/glossary/domain-theft/) மாறாக, DNS கடத்தல் உரிமையாண்மை பதிவுகளை தொடாமலே விடுவதால், உங்கள் டொமைன் உண்மையில் எங்கு செல்கிறது என்பதை தீவிரமாக கண்காணிக்காத வரை இதை கண்டறிவது கடினமாக இருக்கும்.
