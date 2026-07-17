---
title: DNS ரிசால்வர் (மறுசெயல் ரிசால்வர்)
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
description: ஒரு டொமைன் தேடலை ஏற்று, பொருந்தும் முகவரியை வழங்க DNS படிநிலையில் இறங்கிச் செல்லும் சேவையகம்.
keywords: ['DNS ரிசால்வர்', 'மறுசெயல் ரிசால்வர்', 'ரிசால்வர்', '8.8.8.8', '1.1.1.1', 'DNS தேடல்']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/what-is-a-dns-resolver/
relatedArticles:
  - /ta/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /ta/blog/the-dyn-dns-mirai-attack/
  - /ta/blog/the-myetherwallet-bgp-dns-attack/
  - /ta/blog/tokenized-domain-vs-web3-domain/
  - /ta/blog/premium-web3-tlds/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/domain-flipping-skills/
relatedGlossary:
  - /ta/glossary/dns/
  - /ta/glossary/tld/
  - /ta/glossary/urs/
  - /ta/glossary/registry/
  - /ta/glossary/registrar/
---

ஒரு **DNS ரிசால்வர்** (அல்லது *மறுசெயல் ரிசால்வர்*) என்பது, உங்கள் சாதனம் ஒரு டொமைன் பெயரை [IP முகவரியாக](/ta/glossary/ip-address/) மாற்றத் தேவைப்படும்போது தொடர்பு கொள்ளும் சேவையகமாகும். `1.1.1.1` (Cloudflare) மற்றும் `8.8.8.8` (Google) போன்ற பொது ரிசால்வர்கள் இந்த வேலையை முழுமையாகச் செய்கின்றன: [மூல மண்டலத்திலிருந்து (root zone)](/ta/glossary/root-zone/) தொடங்கி, [DNS](/ta/glossary/dns/) படிநிலையில் கீழிறங்கி, டொமைனின் அதிகாரமுள்ள [பெயர்ச்சேவையகங்களை (nameservers)](/ta/glossary/nameserver/) வினவி, பெறும் விடையை அதன் [TTL](/ta/glossary/ttl/) காலம் வரை தற்காலிக நினைவகத்தில் (cache) சேமிக்கின்றன. "ஒரு பெயரை தட்டச்சு செய்தால் தளம் உடனே திறக்கும்" என்ற அனுபவத்திற்கு DNS-இன் இந்தப் பகுதியே காரணம்.
