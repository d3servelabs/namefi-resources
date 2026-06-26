---
title: 'TTL (टाइम टू लिव)'
date: '2026-06-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
description: TTL वह समय है, सेकंड में, जितने समय तक DNS रिकॉर्ड को रिज़ॉल्वर कैश कर सकते हैं, इसके बाद उसे फिर से लुकअप करना होता है।
keywords: ['TTL', 'टाइम टू लिव', 'DNS कैश', 'DNS प्रोपेगेशन', 'रिकॉर्ड कैशिंग']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
relatedArticles:
  - /hi/blog/the-panix-com-domain-hijack/
  - /hi/blog/the-godaddy-multi-year-breach/
  - /hi/blog/the-sushiswap-miso-insider-attack/
  - /hi/blog/working-with-domain-brokers/
  - /hi/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-investing/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/domain-flipping-skills/
relatedGlossary:
  - /hi/glossary/dns/
  - /hi/glossary/dns-propagation/
  - /hi/glossary/registrar/
  - /hi/glossary/icann/
  - /hi/glossary/registry/
---

**TTL (time to live)** सेकंड में एक मूल्य है जो प्रत्येक [DNS रिकॉर्ड](/hi/glossary/dns-record-types/) के साथ जुड़ा होता है और [रिज़ॉल्वर](/hi/glossary/dns-resolver/) को बताता है कि वे उत्तर को कब तक कैश कर सकते हैं, उसके बाद दोबारा जाँच करनी होगी। कम TTL (मान लीजिए 300 सेकंड) का मतलब है कि परिवर्तन जल्दी लागू होते हैं लेकिन अधिक लुकअप होते हैं; लंबा TTL (86,400 सेकंड = एक दिन) कुशल है लेकिन इसका मतलब है कि कोई अपडेट कैश में देर तक रहता है। किसी बदलाव से एक दिन पहले TTL कम करना तेज़ [DNS प्रोपेगेशन](/hi/glossary/dns-propagation/) के लिए मानक तरकीब है। TTL केवल DNS कैशिंग को नियंत्रित करता है — इसका डोमेन के पंजीकरण कार्यकाल या किसी टोकनाइज़्ड डोमेन द्वारा जोड़ी गई [ऑन-चेन](/hi/glossary/on-chain/) स्वामित्व परत से कोई संबंध नहीं है।

*स्रोत: RFC 1035; Cloudflare TTL glossary.*
