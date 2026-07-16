---
title: DNS பதிவு வகைகள் (A, AAAA, CNAME, MX, TXT)
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
description: ஒரு மண்டலத்தில் டொமைனை முகவரிகளும் சேவைகளும் உடன் இணைக்கும் உள்ளீடுகள் — A, AAAA, CNAME, MX, TXT மற்றும் பலவற்றை உள்ளடக்கியவை.
keywords: ['DNS பதிவுகள்', 'A பதிவு', 'AAAA பதிவு', 'CNAME', 'MX பதிவு', 'TXT பதிவு']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/dns-records/
relatedArticles:
  - /ta/blog/dns-on-tokenized-domains/
  - /ta/blog/how-domain-hijacking-actually-happens/
  - /ta/blog/the-lenovo-com-dns-hijack/
  - /ta/blog/the-dnspionage-campaign/
  - /ta/blog/what-are-tokenized-domains/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/tokenize-your-com/
relatedGlossary:
  - /ta/glossary/dns/
  - /ta/glossary/registrar/
  - /ta/glossary/tld/
  - /ta/glossary/icann/
  - /ta/glossary/registry/
---

**DNS பதிவு வகைகள்** என்பவை ஒரு டொமைனின் மண்டலத்தில் (zone) உள்ள தனித்தனி உள்ளீடுகளாகும்; இவை [DNS](/ta/glossary/dns/) க்கு வெவ்வேறு வகையான போக்குவரத்தை எங்கே திருப்பி அனுப்ப வேண்டும் என்று தெரிவிக்கின்றன. அடிக்கடி பயன்படுத்தப்படும் வகைகள்: **A** (ஒரு பெயரை IPv4 [IP முகவரியுடன்](/ta/glossary/ip-address/) இணைக்கிறது), **AAAA** (IPv6 முகவரியுடன் இணைக்கிறது), **CNAME** (ஒரு பெயரை மற்றொரு பெயரின் மாற்றுப்பெயராக அமைக்கிறது), **MX** (மின்னஞ்சலை வழிமாற்றுகிறது), மற்றும் **TXT** (SPF, DKIM மற்றும் டொமைன் சரிபார்ப்புக்கு பயன்படும் சுதந்திர-வடிவ உரை). இந்தப் பதிவுகள் நீங்கள் ஒரு டொமைனை ஒப்படைக்கும் [பெயர் சேவையகங்களால்](/ta/glossary/nameserver/) வெளியிடப்படுகின்றன; இவைதான் ஒரு வலைத்தளம் திறக்கவோ மின்னஞ்சல் வந்து சேரவோ உண்மையில் காரணமாகின்றன.
